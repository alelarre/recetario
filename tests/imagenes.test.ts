import { describe, it, expect } from 'vitest';
import { crearImagenes, CACHE_IMAGENES, CACHE_COMPARTIDO } from '../src/imagenes.js';
import type { AlmacenDeCaches } from '../src/imagenes.js';

/** Cache Storage en memoria: nombre del caché → clave → respuesta. */
function cachesFalso() {
  const cachés = new Map<string, Map<string, Response>>();
  const almacen: AlmacenDeCaches = {
    open: async (nombre: string) => {
      let c = cachés.get(nombre);
      if (!c) { c = new Map(); cachés.set(nombre, c); }
      const cache = c;
      return {
        match: async (clave: string) => cache.get(clave)?.clone(),
        put: async (clave: string, r: Response) => { cache.set(clave, r); },
        delete: async (clave: string) => cache.delete(clave)
      };
    },
    delete: async (nombre: string) => cachés.delete(nombre)
  };
  return { almacen, cachés };
}

function armar({ faltan = [] as string[], conexion }: {
  faltan?: string[];
  conexion?: () => { saveData?: boolean } | undefined;
} = {}) {
  const { almacen, cachés } = cachesFalso();
  const pedidas: string[] = [];
  const revocadas: string[] = [];
  let n = 0;
  const imagenes = crearImagenes({
    leerBlob: async (id: string) => {
      pedidas.push(id);
      if (faltan.includes(id)) throw Object.assign(new Error('no está'), { status: 404 });
      return new Blob([`foto ${id}`], { type: 'image/jpeg' });
    },
    caches: () => almacen,
    crearUrl: () => `blob:${++n}`,
    revocarUrl: (u: string) => { revocadas.push(u); },
    ...(conexion ? { conexion } : {})
  });
  return { imagenes, cachés, pedidas, revocadas, almacen };
}

/** Deja correr las tareas ya encoladas antes de seguir. */
const tic = (): Promise<void> => new Promise(resolver => setTimeout(resolver, 0));

describe('mostrar una foto de Drive', () => {
  it('la primera vez la pide a Drive y la guarda en el caché por id', async () => {
    const { imagenes, cachés, pedidas } = armar();
    expect(await imagenes.urlDeImagen('f1')).toBe('blob:1');
    expect(pedidas).toEqual(['f1']);
    const guardada = cachés.get(CACHE_IMAGENES)?.get('imagen/f1');
    expect(await guardada?.text()).toBe('foto f1');
  });

  it('la segunda vez sale del caché, sin pedir a Drive', async () => {
    const { imagenes, pedidas } = armar();
    await imagenes.urlDeImagen('f1');
    imagenes.soltarImagenes();
    await imagenes.urlDeImagen('f1');
    expect(pedidas).toEqual(['f1']);
    expect(await (await imagenes.imagenDe('f1'))?.text()).toBe('foto f1');
  });

  it('en la misma pantalla, la misma foto es el mismo object URL', async () => {
    const { imagenes } = armar();
    expect(await imagenes.urlDeImagen('f1')).toBe(await imagenes.urlDeImagen('f1'));
  });

  it('soltar revoca los object URL de la pantalla, también los de las fotos en memoria', async () => {
    const { imagenes, revocadas } = armar();
    await imagenes.urlDeImagen('f1');
    const suelta = imagenes.urlDeBlob(new Blob(['x']));
    imagenes.soltarImagenes();
    expect(revocadas).toEqual(['blob:1', suelta]);
  });

  it('una foto que ya no está en Drive es null, y no se guarda', async () => {
    const { imagenes, cachés } = armar({ faltan: ['f1'] });
    expect(await imagenes.urlDeImagen('f1')).toBeNull();
    expect(cachés.get(CACHE_IMAGENES)?.has('imagen/f1')).toBe(false);
  });

  it('otro error de Drive se propaga', async () => {
    const imagenes = crearImagenes({
      leerBlob: async () => { throw Object.assign(new Error('red'), { status: 500 }); },
      caches: () => undefined, crearUrl: () => 'blob:1', revocarUrl: () => {}
    });
    await expect(imagenes.urlDeImagen('f1')).rejects.toThrow('red');
  });

  it('sin Cache Storage, la pide a Drive igual', async () => {
    const imagenes = crearImagenes({
      leerBlob: async () => new Blob(['x']), caches: () => undefined,
      crearUrl: () => 'blob:1', revocarUrl: () => {}
    });
    expect(await imagenes.urlDeImagen('f1')).toBe('blob:1');
  });

  it('dos pedidos a la vez de la misma foto la bajan una sola vez', async () => {
    const { imagenes, pedidas } = armar();
    const [a, b] = await Promise.all([imagenes.imagenDe('f1'), imagenes.imagenDe('f1')]);
    expect(pedidas).toEqual(['f1']);
    expect(await a?.text()).toBe('foto f1');
    expect(await b?.text()).toBe('foto f1');
  });

  it('terminado el pedido, la foto se vuelve a poder pedir —también si falló—', async () => {
    const { imagenes, pedidas } = armar();
    await Promise.all([imagenes.imagenDe('f1'), imagenes.imagenDe('f1')]);
    imagenes.soltarImagenes();
    await imagenes.olvidarImagen('f1');
    await imagenes.imagenDe('f1');
    expect(pedidas).toEqual(['f1', 'f1']);

    let falla = true;
    const rota = crearImagenes({
      leerBlob: async () => {
        if (falla) throw Object.assign(new Error('red'), { status: 500 });
        return new Blob(['al fin']);
      },
      caches: () => undefined
    });
    await expect(Promise.all([rota.imagenDe('f1'), rota.imagenDe('f1')])).rejects.toThrow('red');
    falla = false;
    expect(await (await rota.imagenDe('f1'))?.text()).toBe('al fin');
  });

  it('borrarImagenes borra el caché entero', async () => {
    const { imagenes, cachés } = armar();
    await imagenes.urlDeImagen('f1');
    await imagenes.borrarImagenes();
    expect(cachés.has(CACHE_IMAGENES)).toBe(false);
  });
});

describe('las fotos que llegaron compartidas', () => {
  it('salen del caché en orden, y descartarlas lo borra', async () => {
    const { imagenes, cachés, almacen } = armar();
    const cache = await almacen.open(CACHE_COMPARTIDO);
    await cache.put('compartido/0', new Response(new Blob(['a'])));
    await cache.put('compartido/1', new Response(new Blob(['b'])));

    const fotos = await imagenes.fotosCompartidas(2);
    expect(await Promise.all(fotos.map(f => f.text()))).toEqual(['a', 'b']);

    await imagenes.descartarCompartidas();
    expect(cachés.has(CACHE_COMPARTIDO)).toBe(false);
  });

  it('lo que falta no está: con el caché vacío no hay fotos', async () => {
    const { imagenes } = armar();
    expect(await imagenes.fotosCompartidas(3)).toEqual([]);
  });
});

describe('guardarImagen', () => {
  it('guarda con la misma clave que usa imagenDe: después no pide a Drive', async () => {
    const { imagenes, pedidas } = armar();
    await imagenes.guardarImagen('f1', new Blob(['recién subida'], { type: 'image/jpeg' }));
    expect(await (await imagenes.imagenDe('f1'))?.text()).toBe('recién subida');
    expect(pedidas).toEqual([]);
  });

  it('sin Cache Storage no rompe', async () => {
    const imagenes = crearImagenes({
      leerBlob: async () => new Blob(['x']), caches: () => undefined,
      crearUrl: () => 'blob:1', revocarUrl: () => {}
    });
    await expect(imagenes.guardarImagen('f1', new Blob(['x']))).resolves.toBeUndefined();
  });
});

describe('olvidarImagen', () => {
  it('la saca del caché: la próxima vez se vuelve a pedir a Drive', async () => {
    const { imagenes, cachés, pedidas } = armar();
    await imagenes.urlDeImagen('f1');
    await imagenes.olvidarImagen('f1');
    expect(cachés.get(CACHE_IMAGENES)?.has('imagen/f1')).toBe(false);
    await imagenes.urlDeImagen('f1');
    expect(pedidas).toEqual(['f1', 'f1']);
  });

  it('revoca y olvida el object URL de la pantalla, si había uno', async () => {
    const { imagenes, revocadas } = armar();
    const url = await imagenes.urlDeImagen('f1');
    await imagenes.olvidarImagen('f1');
    expect(revocadas).toEqual([url]);
  });

  it('sin object URL en pantalla, no intenta revocar nada', async () => {
    const { imagenes, revocadas, cachés } = armar();
    await imagenes.guardarImagen('f1', new Blob(['x']));
    await imagenes.olvidarImagen('f1');
    expect(revocadas).toEqual([]);
    expect(cachés.get(CACHE_IMAGENES)?.has('imagen/f1')).toBe(false);
  });

  it('sin Cache Storage no rompe', async () => {
    const imagenes = crearImagenes({
      leerBlob: async () => new Blob(['x']), caches: () => undefined,
      crearUrl: () => 'blob:1', revocarUrl: () => {}
    });
    await expect(imagenes.olvidarImagen('f1')).resolves.toBeUndefined();
  });
});

describe('precargar', () => {
  it('pide sólo lo que falta: lo que ya está en el caché no se vuelve a pedir', async () => {
    const { imagenes, pedidas } = armar();
    await imagenes.guardarImagen('f1', new Blob(['x']));
    await imagenes.precargar(['f1', 'f2', 'f3']);
    expect(pedidas.sort()).toEqual(['f2', 'f3']);
  });

  it('de a dos por default: nunca más de dos pedidos en vuelo', async () => {
    const enVuelo: string[] = [];
    let maxEnVuelo = 0;
    const resolutores: Array<() => void> = [];
    const almacen = cachesFalso().almacen;
    const imagenes = crearImagenes({
      leerBlob: (id: string) => {
        enVuelo.push(id);
        maxEnVuelo = Math.max(maxEnVuelo, enVuelo.length);
        return new Promise<Blob>(resolver => {
          resolutores.push(() => { enVuelo.splice(enVuelo.indexOf(id), 1); resolver(new Blob([id])); });
        });
      },
      caches: () => almacen
    });

    const p = imagenes.precargar(['f1', 'f2', 'f3', 'f4']);
    await tic();
    expect(enVuelo.sort()).toEqual(['f1', 'f2']);

    resolutores.shift()!();
    await tic();
    expect(enVuelo.length).toBe(2);

    while (resolutores.length) { resolutores.shift()!(); await tic(); }
    await p;
    expect(maxEnVuelo).toBeLessThanOrEqual(2);
  });

  it('un tope explícito cambia cuántos pedidos van en vuelo', async () => {
    const enVuelo: string[] = [];
    let maxEnVuelo = 0;
    const resolutores: Array<() => void> = [];
    const almacen = cachesFalso().almacen;
    const imagenes = crearImagenes({
      leerBlob: (id: string) => {
        enVuelo.push(id);
        maxEnVuelo = Math.max(maxEnVuelo, enVuelo.length);
        return new Promise<Blob>(resolver => {
          resolutores.push(() => { enVuelo.splice(enVuelo.indexOf(id), 1); resolver(new Blob([id])); });
        });
      },
      caches: () => almacen
    });

    const p = imagenes.precargar(['f1', 'f2', 'f3'], { tope: 1 });
    await tic();
    expect(enVuelo).toEqual(['f1']);
    while (resolutores.length) { resolutores.shift()!(); await tic(); }
    await p;
    expect(maxEnVuelo).toBe(1);
  });

  it('un error en una foto —red o 404— no corta las demás ni rechaza la promesa', async () => {
    const { imagenes, pedidas } = armar({ faltan: ['f1'] });
    await expect(imagenes.precargar(['f1', 'f2'])).resolves.toBeUndefined();
    expect(pedidas.sort()).toEqual(['f1', 'f2']);
  });

  it('con saveData no se precarga nada', async () => {
    const { imagenes, pedidas } = armar({ conexion: () => ({ saveData: true }) });
    await imagenes.precargar(['f1', 'f2']);
    expect(pedidas).toEqual([]);
  });

  it('sin Cache Storage no rompe', async () => {
    const imagenes = crearImagenes({
      leerBlob: async (id: string) => new Blob([id]), caches: () => undefined,
      crearUrl: () => 'blob:1', revocarUrl: () => {}
    });
    await expect(imagenes.precargar(['f1'])).resolves.toBeUndefined();
  });
});
