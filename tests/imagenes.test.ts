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
        put: async (clave: string, r: Response) => { cache.set(clave, r); }
      };
    },
    delete: async (nombre: string) => cachés.delete(nombre)
  };
  return { almacen, cachés };
}

function armar({ faltan = [] as string[] } = {}) {
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
    revocarUrl: (u: string) => { revocadas.push(u); }
  });
  return { imagenes, cachés, pedidas, revocadas, almacen };
}

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
