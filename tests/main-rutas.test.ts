// tests/main-rutas.test.ts
//
// `main.ts` es el cableado: no exporta nada y corre sobre `environment: 'node'`,
// así que la única forma de probarlo es simular su entorno global y sus
// dependencias, y después mirar qué se pintó. Lo que se prueba acá es lo que
// sólo se ve en el cableado: que cada ruta dibuje su pantalla, y que un fallo
// de red avise sin dejar datos de una lectura anterior.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ErrorDeDrive } from '../src/drive.js';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';
import { entradaFalsa } from './dobles.js';
import { parse } from '../src/recipe.js';
import { DURACIONES } from '../src/catalogo.js';
import type { Coincidencias } from '../src/tipos.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
// Los tres módulos de Google se simulan, pero conservan sus clases de error:
// `main.ts` las usa para reconocer una sesión vencida.
vi.mock('../src/auth.js', async original => ({
  ...await original<typeof import('../src/auth.js')>(),
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', async original => ({ ...await original<typeof import('../src/drive.js')>(), crearDrive: () => ({ cuenta: async () => 'alguien@gmail.com' }) }));
vi.mock('../src/sheets.js', async original => ({ ...await original<typeof import('../src/sheets.js')>(), crearSheets: () => ({}) }));
// Con una API key, la pantalla de la carpeta ofrece el Picker; el Picker mismo
// es un doble: `elegida` es lo que devuelve, `null` es cancelar y `falla` tira.
vi.mock('../src/config.js', async original => ({
  ...await original<typeof import('../src/config.js')>(),
  API_KEY: 'key-de-prueba'
}));
const picker = vi.hoisted(() => ({
  elegida: null as null | { id: string; nombre: string },
  falla: false
}));
vi.mock('../src/picker.js', () => ({
  elegirCarpeta: async () => {
    if (picker.falla) throw new Error('no cargó');
    return picker.elegida;
  }
}));
/** `espera`, si está, es una promesa que el test resuelve a mano: el PDF tarda lo que el test quiera. */
const pdfs = vi.hoisted(() => ({ generados: 0, espera: null as Promise<void> | null }));
vi.mock('../src/pdf/generar.js', () => ({
  precargar: async () => ({}),
  generar: async () => {
    pdfs.generados++;
    if (pdfs.espera) await pdfs.espera;
    return new Blob(['%PDF'], { type: 'application/pdf' });
  }
}));

/** Lo que los dobles le dan a main. `falla` enciende el error de lectura. */
const estadoInicial = () => ({
  falla: false as boolean | Error,
  borradores: [] as { id: string; titulo: string; fuente: string; nota: string; capturado: string }[],
  /** Los ids que se pidió descartar, en orden. */
  descartados: [] as string[],
  /** Cuántas veces más va a fallar `descartar` antes de andar. */
  fallasAlDescartar: 0,
  /** Los títulos de las recetas que se crearon: cada una es un `.md` nuevo. */
  creadas: [] as string[],
  /** El `.md` que devuelve `store.receta`. */
  md: '---\ntitulo: Milanesas\n---\n',
  /** Lo que el editor o la captura tienen escrito cuando se toca Guardar. */
  formulario: {} as Record<string, string>,
  /** Cuántas veces se leyó un `.md` de Drive: cada una es un pedido de red. */
  lecturas: 0,
  /** Cuántas veces se leyó el .md de un borrador. */
  lecturasBorradores: 0,
  /** Lo que el arranque dice de las planillas `_indice` repetidas. */
  indiceDuplicado: null as null | { cantidad: number; modifiedTime: string },
  /** Cuántas veces se borró la copia local del índice. */
  copiasBorradas: 0,
  /** El arranque termina en elegir-carpeta, con estas sugerencias. */
  eligiendo: null as null | { id: string; name: string }[],
  /** Las carpetas que se prepararon con el setup, en orden. */
  preparadas: [] as string[],
  /** Las carpetas que se crearon desde la pantalla de la carpeta base. */
  carpetasCreadas: [] as { nombre: string; padre: string }[],
  /** Cuántas veces se anotó la carpeta anterior como reemplazada. */
  reemplazadas: 0,
  /** Lo que se guardó desde la gestión de categorías, en orden. */
  categoriasGuardadas: [] as string[],
  /** Los ids de las categorías borradas. */
  categoriasBorradas: [] as string[],
  /** Los tags con los que se guardó cada vez que se tocó la estrella, en orden. */
  guardados: [] as { tags: string[] }[],
  /** Cuántas veces más falla `guardar` antes de andar, para probar el aviso de la estrella. */
  fallaGuardar: 0,
  /** Lo que devuelve `store.tagsDe()`, ya ordenado por cantidad. */
  tags: [] as { tag: string; cantidad: number }[]
});

const estado = estadoInicial();

const storeFake = {
  arrancar: async () => estado.eligiendo
    ? { estado: 'elegir-carpeta', sugerencias: estado.eligiendo, avisos: [] }
    : {
        estado: 'listo', reconstruir: false, raizId: 'raiz',
        categorias: [{ id: 'c1', nombre: 'Carnes' }], indiceDuplicado: estado.indiceDuplicado
      },
  carpeta: () => ({ id: 'raiz', nombre: 'Recetario' }),
  crearCarpeta: async (nombre: string, padre: string) => {
    estado.carpetasCreadas.push({ nombre, padre });
    return { id: 'nueva', nombre };
  },
  prepararCarpeta: async (c: { id: string }) => { estado.preparadas.push(c.id); return { ignorados: [] }; },
  marcarReemplazada: async () => { estado.reemplazadas++; },
  recetasDe: (id: string) => id === 'c1' ? [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', carpeta_id: 'c1' })] : [],
  crearCategoria: async (d: { nombre: string }) => { estado.categoriasGuardadas.push(`nueva:${d.nombre}`); return { id: 'c9', nombre: d.nombre, color: '', foto: '' }; },
  editarCategoria: async (id: string, d: { nombre: string }) => { estado.categoriasGuardadas.push(`${id}:${d.nombre}`); },
  borrarCategoria: async (id: string) => { estado.categoriasBorradas.push(id); },
  cargarIndice: async () => [],
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  categoriasConConteo: () => [{ id: 'c1', nombre: 'Carnes', cantidad: 1 }],
  categorias: () => [{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' }],
  buscar: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  buscarPorTexto: (): Coincidencias => ({ porNombre: [], porIngrediente: [], porTag: [] }),
  tagsDe: () => estado.tags,
  crear: async (receta: { titulo: string | null }) => {
    estado.creadas.push(receta.titulo ?? '');
    return { id: `nuevo-${estado.creadas.length}`, nombre_archivo: 'receta.md' };
  },
  guardar: async (_id: string, receta: { tags: string[] }) => {
    if (estado.fallaGuardar > 0) { estado.fallaGuardar--; throw new Error('red'); }
    estado.guardados.push({ tags: receta.tags });
  },
  receta: async (id: string) => {
    estado.lecturas++;
    if (estado.falla) throw estado.falla === true ? new Error('red') : estado.falla;
    return { entrada: entradaFalsa({ id_archivo: id }), receta: parse(estado.md) };
  },
  borradores: () => estado.borradores.map(b => ({
    id_archivo: b.id, nombre_archivo: `${b.id}.md`, titulo: b.titulo, capturado: b.capturado
  })),
  borrador: async (id: string) => {
    estado.lecturasBorradores++;
    const b = estado.borradores.find(x => x.id === id);
    if (!b) throw new Error(`no hay borrador ${id}`);
    return b;
  },
  agregarBorrador: async () => ({ id: 'b1', titulo: '', fuente: '', nota: '', capturado: '' }),
  editarBorrador: async () => {},
  descartarBorrador: async (id: string) => {
    if (estado.fallasAlDescartar > 0) { estado.fallasAlDescartar--; throw new Error('red'); }
    estado.descartados.push(id);
  }
};
vi.mock('../src/store.js', () => ({ crearStore: () => storeFake }));
vi.mock('../src/indice-local.js', () => ({
  leer: () => null,
  guardar: () => {},
  borrar: () => { estado.copiasBorradas++; }
}));

const esperar = async (vueltas = 5) => {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
};

describe('main.ts: las rutas', () => {
  afterEach(() => {
    limpiarGlobales();
    Object.assign(estado, estadoInicial());
    Object.assign(picker, { elegida: null, falla: false });
    vi.unstubAllGlobals();
    delete (global as unknown as Record<string, unknown>)['FormData'];
    vi.resetModules();
  });

  const montar = async ({
    search = '', readyState = 'complete' as DocumentReadyState, reducedMotion = false
  } = {}) => {
    const clicks: ((e: unknown) => unknown)[] = [];
    const cambios: ((e: unknown) => unknown)[] = [];
    /** Los atributos de `#app`: el único que se pone desde `main` es `aria-busy`. */
    const atributosApp: Record<string, string> = {};
    const app = {
      innerHTML: '', insertAdjacentHTML: () => {},
      setAttribute: (n: string, v: string) => { atributosApp[n] = v; },
      removeAttribute: (n: string) => { delete atributosApp[n]; },
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => {
        if (ev === 'click') clicks.push(fn);
        if (ev === 'change') cambios.push(fn);
      }
    };
    /** El velo de la escritura en curso, hermano de `#app` en `index.html`. */
    const velo = { hidden: true };
    /** Lo que se insertó arriba del formulario sin redibujarlo. */
    const preguntas: string[] = [];
    const formulario = {
      insertAdjacentHTML: (_donde: string, html: string) => { preguntas.push(html); }
    };
    const listeners: Record<string, () => void> = {};
    const listenersDoc: Record<string, () => void> = {};
    /** Lo que se puso en lugar de un elemento, con `outerHTML`, sin redibujar. */
    const enLugar: string[] = [];
    const vueltasAtras: number[] = [];
    const scrolls: number[] = [];
    /** Lo que la flecha del carrusel le pidió desplazar a `scrollBy`. */
    const desplazamientos: number[] = [];
    /** El `behavior` de cada desplazamiento: 'auto' con reduced motion, si no 'smooth'. */
    const comportamientos: string[] = [];
    // La duración del editor: sin HTML real que releer, cada botón
    // guarda su propio `aria-pressed` en este mapa, y el campo oculto su
    // propio valor en una variable aparte —dos estados independientes, como
    // en el DOM real, para que un test pueda notar si `main.ts` deja de
    // escribir uno de los dos. `tocar` reutiliza estos mismos objetos como
    // el botón tocado, para que la comparación por referencia de
    // `elegir-duracion` en `main.ts` encuentre al que se tocó.
    const presionados = new Map(DURACIONES.map(valor => [valor as string, false]));
    const botonesDuracion = new Map(DURACIONES.map(valor => [valor as string, {
      dataset: { accion: 'elegir-duracion', valor }, classList: { contains: () => false },
      closest: () => null, tagName: 'BUTTON', remove: () => {}, hasAttribute: () => false,
      getAttribute: (n: string) => n === 'aria-pressed' ? String(presionados.get(valor) ?? false) : null,
      setAttribute: (n: string, v: string) => {
        if (n !== 'aria-pressed') return;
        presionados.set(valor, v === 'true');
      }
    }]));
    let valorOculto = '';
    const campoTiempoDuracion = {
      get value() { return valorOculto; },
      set value(v: string) { valorOculto = v; },
      setAttribute: (_n: string, v: string) => { valorOculto = v; }
    };
    global.document = comoGlobal<Document>({
      querySelector: (sel: string) => {
        if (sel === '#app') return app;
        if (sel === '#velo-escritura') return velo;
        if (sel === '[data-formulario]') return formulario;
        // Los campos de la captura: lo que el test dejó escrito en `formulario`.
        if (sel === 'input[name="titulo"]') return { value: estado.formulario['titulo'] ?? '' };
        if (sel === 'input[name="fuente"]') return { value: estado.formulario['fuente'] ?? '' };
        if (sel === 'textarea[name="nota"]') return { value: estado.formulario['nota'] ?? '' };
        if (sel === '[data-salida]') return preguntas.length ? { remove: () => { preguntas.length = 0; } } : null;
        if (sel === '[data-confirmar-borrado]') {
          return enLugar.at(-1)?.includes('data-confirmar-borrado')
            ? { set outerHTML(html: string) { enLugar.push(html); } } : null;
        }
        // El sol encendido, tal como lo dibuja la cocina.
        if (sel === '[data-accion="wake"].on') return app.innerHTML.includes('class="ico on" data-accion="wake"') ? {} : null;
        // El carrusel: 400 px visibles, como para que el 80% dé un número redondo.
        if (sel === '#app [data-carrusel]') {
          return {
            clientWidth: 400,
            scrollBy: (o: { left: number; behavior?: string }) => {
              desplazamientos.push(o.left);
              comportamientos.push(o.behavior ?? '');
            }
          };
        }
        if (sel === '#app input[name="tiempo"]') return campoTiempoDuracion;
        // El spinner del pie de una lista: lo que mira el observador del tramo.
        if (sel === '#app .spin') return app.innerHTML.includes('class="spin"') ? {} : null;
        return null;
      },
      querySelectorAll: (sel: string) =>
        sel === '#app [data-accion="elegir-duracion"]' ? [...botonesDuracion.values()] : [],
      addEventListener: (ev: string, fn: () => void) => { listenersDoc[ev] = fn; },
      visibilityState: 'visible',
      readyState
    });
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; },
      scrollTo: (_x: number, y: number) => { scrolls.push(y); }, scrollY: 0, close: () => {},
      // Sólo la consulta de reduced motion importa acá: las demás no se usan.
      matchMedia: (q: string) => ({ matches: reducedMotion && q.includes('prefers-reduced-motion') })
    });
    // `replace` es lo que usan las navegaciones de cierre: no agrega una
    // entrada al historial, y el doble lo distingue de asignar `hash`.
    const reemplazos: string[] = [];
    const empujados: string[] = [];
    const recargas: number[] = [];
    global.location = comoGlobal<Location>({
      hash: '', pathname: '/recetario/', search, origin: 'https://h',
      replace: (h: string) => { reemplazos.push(h); global.location.hash = h; },
      reload: () => { recargas.push(1); }
    });
    // El editor se lee con `new FormData(form)`: el doble entrega lo que diga
    // `estado.formulario`, sin importar el form.
    (global as unknown as Record<string, unknown>)['FormData'] = class {
      [Symbol.iterator]() { return Object.entries(estado.formulario)[Symbol.iterator](); }
    };
    global.history = comoGlobal<History>({
      back: () => { vueltasAtras.push(1); }, length: 5,
      replaceState: (_estado: unknown, _titulo: string, url: string) => {
        const i = url.indexOf('#');
        if (i >= 0) global.location.hash = url.slice(i);
      },
      pushState: (_estado: unknown, _titulo: string, url: string) => { empujados.push(url); global.location.hash = url; }
    });

    await import('../src/main.js');
    await esperar();

    return {
      app,
      velo,
      atributosApp,
      recargas,
      vueltasAtras,
      scrolls,
      reemplazos,
      empujados,
      preguntas,
      enLugar,
      desplazamientos,
      comportamientos,
      /** La app vuelve a primer plano. */
      volverAPrimerPlano: async () => { listenersDoc['visibilitychange']?.(); await esperar(); },
      /** El evento `load` de `window`, para lo que quedó pendiente de él. */
      dispararLoad: async () => { listeners['load']?.(); await esperar(); },
      abrir: async (hash: string) => {
        global.location.hash = hash;
        listeners['hashchange']?.();
        await esperar();
      },
      /** Un `change` en la caja de búsqueda, con el valor que tenga. */
      escribir: async (valor: string) => {
        const campo = { dataset: { accion: 'buscar' }, value: valor, focus: () => {} };
        for (const fn of cambios) await fn({ target: campo });
        await esperar();
      },
      /** Un click en un control con esta acción, como lo entrega la delegación. */
      tocar: async (accion: string, datos: Record<string, string> = {}, atributos: Record<string, string> = {}) => {
        const attrs: Record<string, string> = { ...atributos };
        // Los botones de duración son los mismos objetos que devuelve
        // `document.querySelectorAll`: en el DOM real el botón tocado es el
        // mismo nodo que se vuelve a encontrar al recorrerlos.
        const boton = accion === 'elegir-duracion' && botonesDuracion.has(datos['valor'] ?? '')
          ? botonesDuracion.get(datos['valor']!)!
          : {
              dataset: { accion, ...datos }, classList: { contains: () => false },
              closest: () => null, tagName: 'BUTTON', remove: () => {},
              setAttribute: (n: string, v: string) => { attrs[n] = v; },
              getAttribute: (n: string) => attrs[n] ?? null,
              hasAttribute: (n: string) => n in attrs,
              set outerHTML(html: string) { enLugar.push(html); }
            };
        for (const fn of clicks) {
          await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
        }
        await esperar();
        return attrs;
      }
    };
  };

  it('cada ruta dibuja su pantalla', async () => {
    const { app, abrir } = await montar();
    for (const [hash, marca] of [
      ['#/', 'class="grilla"'],
      ['#/c/Carnes', 'class="tot"'],
      ['#/r/f1', 'class="rec-tit"'],
      ['#/r/f1/cocinar', 'class="coc"'],
      ['#/buscar?q=nada', 'class="cajaenc"'],
      ['#/borradores', 'No hay nada esperando.'],
      // Sin fuente compartida es «agregar a mano»: lleva encabezado propio.
      ['#/capturar', 'Nuevo borrador'],
      ['#/ajustes', 'Reindexar']
    ] as const) {
      await abrir(hash);
      expect(app.innerHTML, hash).toContain(marca);
    }
  });

  it('el Recetario corta el carrusel en veinte tags', async () => {
    estado.tags = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const { abrir, app } = await montar();
    await abrir('#/');
    expect(app.innerHTML).toContain('>t19<');
    expect(app.innerHTML).not.toContain('>t20<');
  });

  it('la flecha desplaza el carrusel el 80% de lo que se ve', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, desplazamientos } = await montar();
    await abrir('#/');

    await tocar('carrusel-der');
    await tocar('carrusel-izq');

    expect(desplazamientos).toEqual([320, -320]);
  });

  it('la flecha respeta prefers-reduced-motion: sin animación al desplazar', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, comportamientos } = await montar({ reducedMotion: true });
    await abrir('#/');

    await tocar('carrusel-der');

    expect(comportamientos).toEqual(['auto']);
  });

  it('la lista por tag se dibuja, con el total y las recetas', async () => {
    const { abrir, app } = await montar();
    await abrir('#/t/horno');
    expect(app.innerHTML).toContain('>horno<');
    expect(app.innerHTML).toContain('class="tarjeta"');
  });

  it('en la lista por tag, tocar otro chip acumula: los dos quedan activos y la lista se achica', async () => {
    // El tag de la ruta (`horno`) no es tocable: el que acumula es el otro
    // chip del carrusel. `buscar` filtra de verdad acá, a diferencia del resto
    // de este archivo, para poder ver que la lista se achica con los dos
    // tags puestos.
    estado.tags = [{ tag: 'horno', cantidad: 2 }, { tag: 'dulce', cantidad: 1 }];
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'] }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Torta frita', categoria: 'Postres', tags: ['horno', 'dulce'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/t/horno');
      expect(app.innerHTML).toContain('Milanesas');
      expect(app.innerHTML).toContain('Torta frita');

      await tocar('', { tag: 'dulce' });

      expect(app.innerHTML).not.toContain('Milanesas');
      expect(app.innerHTML).toContain('Torta frita');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('en el Recetario, tocar un chip del carrusel navega a la lista por tag', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar } = await montar();
    await abrir('#/');
    await tocar('', { tag: 'horno' });
    expect(global.location.hash).toBe('#/t/horno');
  });

  it('en la categoría, tocar un chip sigue filtrando ahí mismo, sin navegar', async () => {
    estado.tags = [{ tag: 'horno', cantidad: 3 }];
    const { abrir, tocar, app } = await montar();
    await abrir('#/c/Carnes');
    await tocar('', { tag: 'horno' });
    expect(global.location.hash).toBe('#/c/Carnes');
    expect(app.innerHTML).toContain('class="chip act"');
  });

  it('en la categoría, encender duraciones suma y el total baja; cambiar de pantalla lo limpia', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = () => [
      entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas', categoria: 'Carnes', tiempo: '~30 min' }),
      entradaFalsa({ id_archivo: 'f2', titulo: 'Guiso', categoria: 'Carnes', tiempo: '>60 min' }),
      entradaFalsa({ id_archivo: 'f3', titulo: 'Asado', categoria: 'Carnes', tiempo: '' })
    ];
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      await tocar('filtrar-duracion', { valor: '~30 min' });
      expect(app.innerHTML).toContain('Rabas');
      expect(app.innerHTML).not.toContain('Guiso');
      expect(app.innerHTML).toContain('<span class="tot">1</span>');
      await tocar('filtrar-duracion', { valor: '>60 min' });
      expect(app.innerHTML).toContain('Guiso');
      expect(app.innerHTML).not.toContain('Asado');
      await abrir('#/');
      await abrir('#/c/Carnes');
      expect(app.innerHTML).toContain('Asado');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('ordenar por duración reordena la lista y vuelve a A–Z al cambiar de pantalla', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = () => [
      entradaFalsa({ id_archivo: 'f1', titulo: 'Asado', categoria: 'Carnes', tiempo: '>60 min' }),
      entradaFalsa({ id_archivo: 'f2', titulo: 'Rabas', categoria: 'Carnes', tiempo: '~15 min' })
    ];
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML.indexOf('Rabas')).toBeLessThan(app.innerHTML.indexOf('Asado'));
      await abrir('#/');
      await abrir('#/c/Carnes');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('sin la fila de duraciones (por el filtro de tags) el orden vuelve a A–Z aunque quedara en duración', async () => {
    // Con todos los tags, hay una receta con duración: se puede elegir orden
    // por duración. Filtrando por `sinTiempo` quedan sólo las dos sin
    // duración: la fila de orden no se dibuja, y el orden efectivo tiene que
    // volver a A–Z —favoritas primero— en vez de quedarse pegado en
    // duración, donde no hay control para sacarlo.
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'], tiempo: '~30 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Arroz', categoria: 'Carnes', tags: ['sinTiempo'] }),
        entradaFalsa({ id_archivo: 'f3', titulo: 'Zapallo', categoria: 'Carnes', tags: ['sinTiempo', 'favorito'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML).toContain('data-accion="ordenar" data-valor="duracion" aria-pressed="true"');

      await tocar('', { tag: 'sinTiempo' });

      // La fila de orden no se dibuja: no hay ninguna duración en lo filtrado.
      expect(app.innerHTML).not.toContain('data-accion="ordenar"');
      // Pero el orden efectivo es A–Z: Zapallo es favorita y va primero,
      // aunque alfabéticamente vaya después de Arroz.
      expect(app.innerHTML.indexOf('Zapallo')).toBeLessThan(app.innerHTML.indexOf('Arroz'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('lo mismo en la lista por tag: sin la fila de duraciones el orden vuelve a A–Z', async () => {
    const original = storeFake.buscar;
    storeFake.buscar = (filtros?: { tags?: string[] }) => {
      const activos = filtros?.tags ?? [];
      const todas = [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes', tags: ['horno'], tiempo: '~30 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Arroz', categoria: 'Carnes', tags: ['horno', 'sinTiempo'] }),
        entradaFalsa({ id_archivo: 'f3', titulo: 'Zapallo', categoria: 'Carnes', tags: ['horno', 'sinTiempo', 'favorito'] })
      ];
      return todas.filter(e => activos.every(t => e.tags.includes(t)));
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/t/horno');
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML).toContain('data-accion="ordenar" data-valor="duracion" aria-pressed="true"');

      await tocar('', { tag: 'sinTiempo' });

      expect(app.innerHTML).not.toContain('data-accion="ordenar"');
      expect(app.innerHTML.indexOf('Zapallo')).toBeLessThan(app.innerHTML.indexOf('Arroz'));
    } finally {
      storeFake.buscar = original;
    }
  });

  it('ordenar por duración vuelve a mostrar el primer tramo: la única con duración entra ahí aunque alfabético la deje afuera', async () => {
    // 31 recetas: 30 sin duración con títulos A01..A30, y «Zeta» con
    // `~15 min`, que alfabéticamente cae última —fuera del primer tramo de
    // 30 (`TRAMO`)—. Ordenar por duración la trae adelante de todas: tiene
    // que entrar en lo que ya se dibujó, sin tocar «ver más».
    const original = storeFake.buscar;
    const todas = [
      ...Array.from({ length: 30 }, (_, i) =>
        entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes' })),
      entradaFalsa({ id_archivo: 'fz', titulo: 'Zeta', categoria: 'Carnes', tiempo: '~15 min' })
    ];
    storeFake.buscar = () => todas;
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML).not.toContain('Zeta');

      await tocar('ordenar', { valor: 'duracion' });

      expect(app.innerHTML).toContain('Zeta');
    } finally {
      storeFake.buscar = original;
    }
  });

  it('filtrar por tag vuelve a mostrar el primer tramo, como el filtro de duración y el orden', async () => {
    // 31 recetas con el mismo tag. El tramo avanza con un IntersectionObserver,
    // que en Node no existe: acá es uno falso que se dispara a mano.
    const original = storeFake.buscar;
    const todas = Array.from({ length: 31 }, (_, i) =>
      entradaFalsa({ id_archivo: `f${i}`, titulo: `A${String(i + 1).padStart(2, '0')}`, categoria: 'Carnes', tags: ['horno'] }));
    storeFake.buscar = () => todas;
    let llegarAlPie = (): void => {};
    const g = global as unknown as Record<string, unknown>;
    g['IntersectionObserver'] = class {
      constructor(fn: (e: { isIntersecting: boolean }[]) => void) { llegarAlPie = () => fn([{ isIntersecting: true }]); }
      observe(): void {}
      disconnect(): void {}
    };
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/c/Carnes');
      expect(app.innerHTML).not.toContain('A31');
      llegarAlPie();
      await vi.waitFor(() => expect(app.innerHTML).toContain('A31'));

      await tocar('', { tag: 'horno' });

      expect(app.innerHTML).not.toContain('A31');
    } finally {
      storeFake.buscar = original;
      delete g['IntersectionObserver'];
    }
  });

  it('ordenar por duración en la búsqueda reordena los resultados', async () => {
    const original = storeFake.buscarPorTexto;
    storeFake.buscarPorTexto = () => ({
      porNombre: [
        entradaFalsa({ id_archivo: 'f1', titulo: 'Asado', tiempo: '>60 min' }),
        entradaFalsa({ id_archivo: 'f2', titulo: 'Rabas', tiempo: '~15 min' })
      ],
      porIngrediente: [], porTag: []
    });
    try {
      const { abrir, tocar, app } = await montar();
      await abrir('#/buscar?q=horno');
      expect(app.innerHTML.indexOf('Asado')).toBeLessThan(app.innerHTML.indexOf('Rabas'));
      await tocar('ordenar', { valor: 'duracion' });
      expect(app.innerHTML.indexOf('Rabas')).toBeLessThan(app.innerHTML.indexOf('Asado'));
    } finally {
      storeFake.buscarPorTexto = original;
    }
  });

  it('un link de invitado con la app ya abierta recarga: la vista de invitado se decide al cargar', async () => {
    const { abrir, recargas } = await montar();
    await abrir('#/ver?r=1abc');
    expect(recargas).toHaveLength(1);
  });

  it('borrar los datos locales borra la copia y recarga: lo que hay en memoria salió de ella', async () => {
    const { abrir, tocar, recargas } = await montar();
    await abrir('#/ajustes');
    await tocar('borrar-datos-locales');
    expect(estado.copiasBorradas).toBe(1);
    expect(recargas).toHaveLength(1);
  });

  it('mientras reindexa, Ajustes se dibuja con los mismos datos que al entrar', async () => {
    const { app, abrir, tocar } = await montar();
    let aMitad = '';
    const conReconstruir = storeFake as typeof storeFake & {
      reconstruir?: (alProgresar: (p: { leidas: number; total: number }) => void) => Promise<{ ignorados: string[] }>;
    };
    conReconstruir.reconstruir = async alProgresar => {
      alProgresar({ leidas: 1, total: 2 });
      aMitad = app.innerHTML;
      return { ignorados: [] };
    };
    try {
      await abrir('#/ajustes');
      await tocar('reindexar');
      expect(aMitad).toContain('Reindexando: 1 de 2.');
      expect(aMitad).toContain('Carpeta: Recetario');
    } finally {
      delete conReconstruir.reconstruir;
    }
  });

  describe('la gestión de categorías', () => {
    it('la lista y la edición se dibujan', async () => {
      const { app, abrir } = await montar();
      await abrir('#/categorias');
      expect(app.innerHTML).toContain('href="#/categorias/c1"');
      await abrir('#/categorias/c1');
      expect(app.innerHTML).toContain('name="nombre" value="Carnes"');
      await abrir('#/categorias/nueva');
      expect(app.innerHTML).toContain('Nueva categoría');
    });

    it('guardar una edición llama al store con lo del formulario y vuelve a la lista', async () => {
      const { abrir, tocar, vueltasAtras } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: 'catalogo:carnes' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['c1:Carnes rojas']);
      expect(vueltasAtras).toHaveLength(1);
    });

    it('guardar una nueva la crea', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/categorias/nueva');
      estado.formulario = { nombre: 'Fiambres', color: 'bebidas', foto: '' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['nueva:Fiambres']);
    });

    it('borrar pregunta con las recetas, y confirmar borra y vuelve a la lista', async () => {
      const { abrir, tocar, enLugar, reemplazos } = await montar();
      await abrir('#/categorias/c1');
      await tocar('borrar-categoria');
      expect(enLugar.at(-1)).toContain('Carnes y su receta va a la papelera de Drive.');
      await tocar('borrar-categoria-confirmado');
      expect(estado.categoriasBorradas).toEqual(['c1']);
      expect(reemplazos.at(-1)).toBe('#/categorias');
    });
  });

  it('lo compartido desde otra app abre la captura con la fuente cargada', async () => {
    const { app } = await montar({ search: '?title=Reel&text=https%3A%2F%2Finstagram.com%2Freel%2Fabc' });
    expect(global.location.hash).toBe('#/capturar?text=https%3A%2F%2Finstagram.com%2Freel%2Fabc');
    expect(app.innerHTML).toContain('instagram.com/reel/abc');
  });

  describe('la carpeta base', () => {
    it('sin carpeta marcada, el arranque lleva a la pantalla con las encontradas', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app, reemplazos } = await montar();
      expect(reemplazos).toContain('#/carpeta');
      expect(app.innerHTML).toContain('Tus recetas en Drive');
      expect(app.innerHTML).toContain('data-id="r1"');
    });

    it('mientras no hay carpeta, otra ruta vuelve a la pantalla', async () => {
      estado.eligiendo = [];
      const { abrir, reemplazos } = await montar();
      await abrir('#/ajustes');
      expect(reemplazos.at(-1)).toBe('#/carpeta');
    });

    it('elegir una encontrada confirma, prepara la carpeta y recarga', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app, tocar, recargas } = await montar();
      await tocar('carpeta-sugerida', { id: 'r1', nombre: 'Recetario' });
      expect(app.innerHTML).toContain('Voy a usar <b>Recetario</b>.');
      await tocar('carpeta-confirmar');
      expect(estado.preparadas).toEqual(['r1']);
      expect(estado.reemplazadas).toBe(0);
      expect(recargas).toHaveLength(1);
    });

    it('crear no pregunta: crea la carpeta en Mi unidad, la prepara y recarga', async () => {
      estado.eligiendo = [];
      const { tocar, recargas } = await montar();
      await tocar('carpeta-crear');
      expect(estado.carpetasCreadas).toEqual([{ nombre: 'Recetario', padre: 'root' }]);
      expect(estado.preparadas).toEqual(['nueva']);
      expect(recargas).toHaveLength(1);
    });

    it('con el Picker, elegir una carpeta confirma y prepara', async () => {
      estado.eligiendo = [];
      picker.elegida = { id: 'p1', nombre: 'Mis recetas' };
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).toContain('Voy a usar <b>Mis recetas</b>.');
      await tocar('carpeta-confirmar');
      expect(estado.preparadas).toEqual(['p1']);
    });

    it('cancelar el Picker no cambia nada', async () => {
      estado.eligiendo = [];
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).not.toContain('Voy a usar');
      expect(estado.preparadas).toEqual([]);
    });

    it('si el Picker no abre, lo dice y deja reintentar', async () => {
      estado.eligiendo = [];
      picker.falla = true;
      const { app, tocar } = await montar();
      await tocar('carpeta-elegir');
      expect(app.innerHTML).toContain('No se pudo abrir el selector de Google.');
      expect(app.innerHTML).toContain('data-accion="reintentar"');
    });

    it('cambiar de carpeta desde Ajustes anota la anterior antes de preparar la nueva', async () => {
      picker.elegida = { id: 'a1', nombre: 'Cocina' };
      const { app, abrir, tocar } = await montar();
      await abrir('#/ajustes');
      await tocar('cambiar-carpeta');
      await abrir('#/carpeta?cambiando=1');
      expect(app.innerHTML).toContain('Cambiar carpeta');
      await tocar('carpeta-elegir');
      await tocar('carpeta-confirmar');
      expect(estado.reemplazadas).toBe(1);
      expect(estado.preparadas).toEqual(['a1']);
    });

    it('Ajustes dice qué carpeta se usa', async () => {
      const { app, abrir } = await montar();
      await abrir('#/ajustes');
      expect(app.innerHTML).toContain('Carpeta: Recetario');
    });
  });

  it('Salir borra la copia local del índice, además del token', async () => {
    const { tocar } = await montar();
    await tocar('salir');
    expect(estado.copiasBorradas).toBe(1);
  });

  it('el aviso de la planilla _indice duplicada llega a Ajustes', async () => {
    estado.indiceDuplicado = { cantidad: 2, modifiedTime: new Date(2026, 8, 12, 14, 30).toISOString() };
    const { app, abrir } = await montar();
    await abrir('#/ajustes');
    expect(app.innerHTML).toContain('Hay 2 planillas _indice en Drive.');
  });

  it('sin red, la pantalla avisa y no dibuja datos de una lectura anterior', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).toContain('Milanesas');

    estado.falla = true;
    await abrir('#/r/f2');
    expect(app.innerHTML).toContain('class="aviso"');
    expect(app.innerHTML).not.toContain('Milanesas');
  });

  it('ningún error muestra el mensaje crudo de Google', async () => {
    const { app, abrir } = await montar();
    estado.falla = new Error('Unable to parse range: meta!A1:B20');
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toContain('Unable to parse range');
    expect(app.innerHTML).toContain('data-accion="reintentar"');
  });

  it('cada pantalla nueva empieza arriba', async () => {
    // El hash no toca el scroll: entrar al modo cocina desde el pie de la
    // receta abría los ingredientes ya scrolleados.
    const { abrir, scrolls } = await montar();
    await abrir('#/r/f1');
    const antes = scrolls.length;
    await abrir('#/r/f1/cocinar');
    expect(scrolls.length).toBeGreaterThan(antes);
    expect(scrolls.at(-1)).toBe(0);
  });

  it('el volver del encabezado vuelve: es la acción que las pantallas dibujan', async () => {
    // El encabezado emite `volver`: si el cableado escuchara otro nombre, el
    // botón no haría nada en ninguna pantalla.
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/c/Carnes');
    await tocar('volver');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('las dos salidas del modo cocina tienen destinos distintos', async () => {
    const { abrir, tocar } = await montar();

    // El chevron vuelve a la receta, para seguir leyéndola sin la escala de cocina.
    await abrir('#/r/f1/cocinar');
    await tocar('volver-receta');
    expect(global.location.hash).toBe('#/r/f1');

    // Salir vuelve a la categoría, que es donde se elige otra cosa.
    await abrir('#/r/f1/cocinar');
    await tocar('salir-cocina');
    expect(global.location.hash).toBe('#/c/Carnes');
  });

  it('volver de la cocina a la receta es un back cuando se entró desde ella', async () => {
    // Con una navegación nueva, la receta quedaría dos veces seguidas en el
    // historial y su chevron parecería no hacer nada; con `location.hash =`,
    // el chevron de la receta volvería al modo cocina.
    const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
    await abrir('#/r/f1');
    await tocar('cocinar');
    await tocar('volver-receta');
    expect(vueltasAtras).toHaveLength(1);
    expect(reemplazos).toEqual([]);
  });

  it('con un link directo al modo cocina, volver navega a la receta', async () => {
    const { abrir, tocar, reemplazos } = await montar();
    await abrir('#/r/f1/cocinar');
    await tocar('volver-receta');
    expect(reemplazos).toEqual(['#/r/f1']);
  });

  it('salir de la cocina no la deja en el historial', async () => {
    const { abrir, tocar, reemplazos } = await montar();
    await abrir('#/r/f1/cocinar');
    await tocar('salir-cocina');
    expect(reemplazos).toEqual(['#/c/Carnes']);
  });

  it('el modo cocina arranca con el paso 1 como actual', async () => {
    // Sin ingredientes, el modo cocina abre directo en los pasos.
    estado.md = '---\ntitulo: Rabas\n---\n\n## Preparación\n1. Lavar.\n2. Freír.\n';
    const { abrir, app } = await montar();
    await abrir('#/r/f1/cocinar');

    expect(app.innerHTML).toContain('<li class="aqui" data-accion="paso" data-paso="0">');
    expect(app.innerHTML).toContain('<li data-accion="paso" data-paso="1">');
  });

  describe('el .md se lee al entrar a la pantalla, no en cada redibujado', () => {
    const PASOS = '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar — 1 kg\n\n## Preparación\n1. Lavar.\n2. Freír.\n';

    it('en cocina, marcar pasos, conmutar y tocar el sol no vuelven a leer', async () => {
      vi.stubGlobal('navigator', { wakeLock: { request: async () => ({ addEventListener: () => {}, release: async () => {} }) } });
      estado.md = PASOS;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1/cocinar');
      expect(estado.lecturas).toBe(1);

      await tocar('conmutar', { posicion: 'pasos' });
      // El paso 1 arranca como actual: tocarlo lo da por hecho.
      await tocar('paso', { paso: '0' });
      await tocar('wake');

      expect(estado.lecturas).toBe(1);
      // Y los toques se dibujaron: el primero hecho, el segundo actual, el sol encendido.
      expect(app.innerHTML).toContain('<li class="hecho" data-accion="paso" data-paso="0">');
      expect(app.innerHTML).toContain('<li class="aqui" data-accion="paso" data-paso="1">');
      expect(app.innerHTML).toContain('class="ico on" data-accion="wake"');
    });

    it('tocar un tag en la receta abierta no vuelve a leer', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [frito]\n---\n';
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('', { tag: 'frito' });
      expect(estado.lecturas).toBe(1);
    });

    it('entre la receta, su modo cocina y su editor se reutiliza la misma copia', async () => {
      estado.md = PASOS;
      const { abrir } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/cocinar');
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      await abrir('#/r/f1');
      expect(estado.lecturas).toBe(1);
    });

    it('otra receta, o salir a otra pantalla y volver, sí vuelven a leer', async () => {
      estado.md = PASOS;
      const { abrir } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f2');
      expect(estado.lecturas).toBe(2);
      await abrir('#/c/Carnes');
      await abrir('#/r/f2');
      expect(estado.lecturas).toBe(3);
    });

    it('reintentar vuelve a leer', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('reintentar');
      expect(estado.lecturas).toBe(2);
    });

    it('después de guardar, volver a la receta muestra lo guardado sin volver a leer', async () => {
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await abrir('#/r/f1/editar');
      expect(estado.lecturas).toBe(1);

      estado.formulario = { titulo: 'Milanesas a caballo', carpeta: 'c1' };
      await tocar('guardar');
      // Guardar relee el .md antes de escribir: lo que la app no conoce se preserva.
      expect(estado.lecturas).toBe(2);

      await abrir('#/r/f1');
      expect(estado.lecturas).toBe(2);
      expect(app.innerHTML).toContain('Milanesas a caballo');
    });

    it('si la lectura falla, reintentar vuelve a pedirla', async () => {
      estado.falla = true;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      estado.falla = false;
      await tocar('reintentar');
      expect(estado.lecturas).toBe(2);
      expect(app.innerHTML).toContain('Milanesas');
    });
  });

  describe('los borradores salen del índice; el .md se lee al abrir uno', () => {
    const B1 = { id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' };

    it('el contador y la lista no leen nada', async () => {
      estado.borradores = [B1];
      const { abrir, tocar, app } = await montar();
      await abrir('#/');
      await tocar('abrir-menu');
      await abrir('#/borradores');
      await abrir('#/ajustes');
      expect(estado.lecturasBorradores).toBe(0);
      await abrir('#/borradores');
      expect(app.innerHTML).toContain('Focaccia');
    });

    it('entre un borrador, sus redibujados y crear la receta, el .md se lee una vez', async () => {
      estado.borradores = [B1];
      const { abrir, tocar } = await montar();
      await abrir('#/borradores/b1');
      await tocar('descartar');
      await tocar('cancelar-descarte');
      await tocar('editar-borrador');
      await tocar('volver');
      await abrir('#/nueva?borrador=b1');
      expect(estado.lecturasBorradores).toBe(1);
    });

    it('salir a la lista y volver a abrirlo sí lo relee', async () => {
      estado.borradores = [B1];
      const { abrir } = await montar();
      await abrir('#/borradores/b1');
      await abrir('#/borradores');
      await abrir('#/borradores/b1');
      expect(estado.lecturasBorradores).toBe(2);
    });

    it('si descartar falla, avisa y el borrador sigue en pantalla', async () => {
      estado.borradores = [B1];
      estado.fallasAlDescartar = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/borradores/b1');
      await tocar('descartar-confirmado');
      expect(app.innerHTML).toContain('No se pudo descartar.');
      expect(app.innerHTML).toContain('Focaccia');
    });

    it('un borrador que no está en el índice muestra la lista', async () => {
      const { abrir, app } = await montar();
      await abrir('#/borradores/fantasma');
      expect(app.innerHTML).toContain('No hay nada esperando.');
      expect(estado.lecturasBorradores).toBe(0);
    });
  });

  it('al volver de segundo plano con el sol encendido, se vuelve a pedir la pantalla (C03.3.1)', async () => {
    let pedidos = 0;
    let soltar = () => {};
    vi.stubGlobal('navigator', { wakeLock: { request: async () => {
      pedidos++;
      return { addEventListener: (_ev: string, fn: () => void) => { soltar = fn; }, release: async () => {} };
    } } });
    estado.md = '---\ntitulo: Rabas\n---\n\n## Preparación\n1. Lavar.\n';
    const { abrir, tocar, volverAPrimerPlano } = await montar();
    await abrir('#/r/f1/cocinar');
    await tocar('wake');
    expect(pedidos).toBe(1);

    // El navegador suelta el bloqueo al irse a segundo plano.
    soltar();
    await volverAPrimerPlano();

    expect(pedidos).toBe(2);
  });

  describe('borrar receta pregunta sin redibujar el formulario', () => {
    it('la confirmación reemplaza al botón y nombra la receta; no se relee ni se pierde lo escrito', async () => {
      const { abrir, tocar, app, enLugar } = await montar();
      await abrir('#/r/f1/editar');
      const formulario = app.innerHTML;

      await tocar('borrar');

      expect(app.innerHTML).toBe(formulario);
      expect(estado.lecturas).toBe(1);
      expect(enLugar.at(-1)).toContain('¿Borrar <b>Milanesas</b>?');
      expect(enLugar.at(-1)).toContain('data-accion="borrar-confirmado"');
    });

    it('cancelar vuelve a poner el botón, también sin redibujar', async () => {
      const { abrir, tocar, app, enLugar } = await montar();
      await abrir('#/r/f1/editar');
      const formulario = app.innerHTML;

      await tocar('borrar');
      await tocar('cancelar-borrado');

      expect(app.innerHTML).toBe(formulario);
      expect(enLugar.at(-1)).toContain('data-accion="borrar"');
      expect(enLugar.at(-1)).not.toContain('borrar-confirmado');
    });
  });

  describe('los botones de tags especiales en el editor', () => {
    it('tocar un botón especial lo invierte', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const attrs = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'false' });
      expect(attrs['aria-pressed']).toBe('true');
      const otra = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'true' });
      expect(otra['aria-pressed']).toBe('false');
    });

    it('un botón especial deshabilitado no cambia al tocarlo', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1/editar');
      const attrs = await tocar('tag-especial', { valor: 'incompleta' }, { 'aria-pressed': 'true', disabled: '' });
      expect(attrs['aria-pressed']).toBe('true');
    });
  });

  describe('la duración en el editor', () => {
    // El DOM falso de este archivo no vuelve a serializar el árbol en
    // `app.innerHTML` cuando se mutan atributos por fuera del botón tocado
    // (ver el comentario en `montar`), así que la aserción va contra
    // `document.querySelector`/`querySelectorAll`, como el propio código de
    // `main.ts` los usa para encontrar los otros botones y el campo oculto.
    it('elegir una duración aprieta ese botón, suelta los otros y la escribe en el campo oculto; tocarla de nuevo la saca', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/nueva');
      const boton = (valor: string) =>
        [...document.querySelectorAll<HTMLElement & { dataset: Record<string, string> }>('#app [data-accion="elegir-duracion"]')]
          .find(b => b.dataset['valor'] === valor)!;
      const oculto = () => document.querySelector<HTMLInputElement>('#app input[name="tiempo"]')!;

      await tocar('elegir-duracion', { valor: '~30 min' });
      expect(boton('~30 min').getAttribute('aria-pressed')).toBe('true');
      expect(oculto().value).toBe('~30 min');

      await tocar('elegir-duracion', { valor: '>1 día' });
      expect(boton('~30 min').getAttribute('aria-pressed')).toBe('false');
      expect(boton('>1 día').getAttribute('aria-pressed')).toBe('true');
      expect(oculto().value).toBe('>1 día');

      await tocar('elegir-duracion', { valor: '>1 día' });
      expect(boton('>1 día').getAttribute('aria-pressed')).toBe('false');
      expect(oculto().value).toBe('');
    });
  });

  it('una receta nueva abre con incompleta', async () => {
    const { abrir, app } = await montar();
    await abrir('#/nueva');
    expect(app.innerHTML).toContain('data-valor="incompleta" aria-pressed="true"');
  });

  it('un borrador convertido también abre con incompleta', async () => {
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', capturado: '', nota: '' }];
    const { abrir, app } = await montar();
    await abrir('#/nueva?borrador=b1');
    expect(app.innerHTML).toContain('value="Focaccia"');
    expect(app.innerHTML).toContain('data-valor="incompleta" aria-pressed="true"');
  });

  it('crear la receta desde un borrador reparte la nota en sus secciones', async () => {
    estado.borradores = [{
      id: 'b1', titulo: 'Focaccia', fuente: 'https://x/1', capturado: '',
      nota: 'Una focaccia simple.\n\n## Ingredientes\n- Harina — 500 g\n\n## Preparación\n1. Amasar.\n\n## Notas\nDejar levar.'
    }];
    const { abrir, app } = await montar();
    await abrir('#/nueva?borrador=b1');

    // El editor abre con cada parte en su campo, no todo en Notas.
    expect(app.innerHTML).toContain('value="Focaccia"');
    expect(app.innerHTML).toContain('value="https://x/1"');
    expect(app.innerHTML).toContain('- Harina — 500 g');
    expect(app.innerHTML).toContain('1. Amasar.');
    expect(app.innerHTML).toContain('Dejar levar.');
    expect(app.innerHTML).toContain('Una focaccia simple.');
  });

  it('crear la receta desde un borrador y salir sin guardar deja el borrador', async () => {
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/borradores/b1');
    await tocar('crear-receta');
    await abrir('#/nueva?borrador=b1');

    await tocar('volver');
    await abrir('#/borradores/b1');

    expect(vueltasAtras).toHaveLength(1);
    expect(estado.creadas).toEqual([]);
    expect(estado.descartados).toEqual([]);
  });

  it('guardar la receta nueva borra el borrador del que salió', async () => {
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
    const { abrir, tocar } = await montar();
    await abrir('#/nueva?borrador=b1');

    estado.formulario = { titulo: 'Focaccia', carpeta: 'c1' };
    await tocar('guardar');

    expect(estado.creadas).toEqual(['Focaccia']);
    expect(estado.descartados).toEqual(['b1']);
  });

  it('con la sesión vencida, guardar avisa que hay que conectarse y conectar no redibuja el editor (R3)', async () => {
    const original = storeFake.crear;
    storeFake.crear = async () => { throw new ErrorDeDrive('Invalid Credentials', 401); };
    try {
      const { app, abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      await tocar('guardar');

      expect(app.innerHTML).toContain('Hay que conectarse de nuevo con Google.');
      expect(app.innerHTML).toContain('data-accion="conectar-de-nuevo"');
      expect(app.innerHTML).not.toContain('Invalid Credentials');

      // Lo escrito vive en el formulario: conectar no puede repintar la pantalla.
      const antes = app.innerHTML;
      await tocar('conectar-de-nuevo');
      expect(app.innerHTML).toBe(antes);
    } finally {
      storeFake.crear = original;
    }
  });

  it('si guardar falla por otra cosa, el aviso habla de la conexión y no lleva control', async () => {
    const original = storeFake.crear;
    storeFake.crear = async () => { throw new Error('red'); };
    try {
      const { app, abrir, tocar } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
      await tocar('guardar');
      expect(app.innerHTML).toContain('No se pudo guardar. Revisá la conexión.');
      expect(app.innerHTML).not.toContain('conectar-de-nuevo');
    } finally {
      storeFake.crear = original;
    }
  });

  it('una receta nueva que no sale de un borrador no borra ninguno', async () => {
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
    const { abrir, tocar } = await montar();
    await abrir('#/nueva');

    estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
    await tocar('guardar');

    expect(estado.creadas).toEqual(['Pan']);
    expect(estado.descartados).toEqual([]);
  });

  it('si borrar el borrador falla, guardar de nuevo no crea un segundo .md (R2)', async () => {
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
    estado.fallasAlDescartar = 1;
    const { abrir, tocar, app } = await montar();
    await abrir('#/nueva?borrador=b1');

    estado.formulario = { titulo: 'Focaccia', carpeta: 'c1' };
    await tocar('guardar');
    expect(app.innerHTML).toContain('No se pudo guardar.');

    await tocar('guardar');

    expect(estado.creadas).toEqual(['Focaccia']);
    expect(estado.descartados).toEqual(['b1']);
  });

  describe('salir del editor con cambios pendientes pregunta antes (C04.1.1)', () => {
    it('sin cambios, salir no pregunta', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, app, empujados, preguntas } = await montar();
      await abrir('#/r/f1/editar');

      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
      expect(preguntas).toEqual([]);
      expect(app.innerHTML).not.toContain('data-formulario');
    });

    it('con cambios, el atrás no dibuja la pantalla anterior: vuelve al editor y pregunta', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, app, empujados, preguntas } = await montar();
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas a la napolitana' };
      await abrir('#/r/f1');

      expect(empujados).toEqual(['#/r/f1/editar']);
      expect(app.innerHTML).toContain('data-formulario');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
    });

    it('escribir y borrar lo escrito no cuenta como cambio', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, empujados } = await montar();
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas' };
      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
    });

    it('seguir editando saca la pregunta y se queda en el editor', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, preguntas, vueltasAtras } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/r/f1');

      await tocar('seguir-editando');

      expect(preguntas).toEqual([]);
      expect(vueltasAtras).toEqual([]);
    });

    it('salir sin guardar sale de verdad', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, app, vueltasAtras } = await montar();
      await abrir('#/r/f1/editar');
      estado.formulario = { titulo: 'Otra cosa' };
      await abrir('#/r/f1');

      await tocar('salir-sin-guardar');
      await abrir('#/r/f1');

      expect(vueltasAtras).toHaveLength(1);
      expect(app.innerHTML).not.toContain('data-formulario');
    });

    it('guardar no pregunta al volver', async () => {
      estado.formulario = { titulo: 'Milanesas' };
      const { abrir, tocar, empujados } = await montar();
      await abrir('#/r/f1/editar');

      estado.formulario = { titulo: 'Milanesas a la napolitana' };
      await tocar('guardar');
      await abrir('#/r/f1');

      expect(empujados).toEqual([]);
    });

    it('vale también para la receta nueva', async () => {
      estado.formulario = { titulo: '' };
      const { abrir, empujados } = await montar();
      await abrir('#/nueva');

      estado.formulario = { titulo: 'Pan' };
      await abrir('#/');

      expect(empujados).toEqual(['#/nueva']);
    });
  });

  it('volver mientras se edita un borrador muestra el borrador, no la lista', async () => {
    // Editar no cambia la URL: con un `history.back()` el volver se iba a la
    // lista, que es la entrada anterior.
    estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
    const { abrir, tocar, app, vueltasAtras } = await montar();
    await abrir('#/borradores/b1');
    await tocar('editar-borrador');
    expect(app.innerHTML).toContain('Editar borrador');

    await tocar('volver');
    expect(vueltasAtras).toHaveLength(0);
    expect(app.innerHTML).toContain('data-accion="crear-receta"');
  });

  it('cancelar un borrador nuevo vuelve: `close()` no alcanza cuando la pestaña no la abrió un script', async () => {
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/borradores');
    await abrir('#/capturar');
    await tocar('cancelar-captura');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('buscar con la caja vacía no hace nada, y no avisa', async () => {
    const { abrir, escribir, app } = await montar();
    await abrir('#/c/Carnes');
    const antes = global.location.hash;

    await escribir('   ');

    expect(global.location.hash).toBe(antes);
    expect(app.innerHTML).not.toContain('class="aviso"');
  });

  it('con texto, buscar navega a los resultados sin los espacios de más', async () => {
    const { abrir, escribir } = await montar();
    await abrir('#/');
    await escribir('  leche  ');
    expect(global.location.hash).toBe('#/buscar?q=leche');
  });

  describe('compartir desde la receta', () => {
    const PASOS = '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar — 1 kg\n\n## Preparación\n1. Lavar.\n';
    afterEach(() => { pdfs.generados = 0; pdfs.espera = null; });

    it('el ícono abre la ficha y cancelar la cierra', async () => {
      estado.md = PASOS;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      expect(app.innerHTML).toContain('hoja-compartir');
      await tocar('cerrar-compartir');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF: genera y lo comparte como archivo, y la ficha se cierra', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); }, canShare: () => true });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(pdfs.generados).toBe(1);
      expect(compartidos[0]?.files?.[0]?.name).toBe('rabas.pdf');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF sin activación: Enviar PDF manda el mismo archivo sin volver a generar', async () => {
      estado.md = PASOS;
      let intentos = 0;
      vi.stubGlobal('navigator', {
        share: async () => { if (++intentos === 1) throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); },
        canShare: () => true
      });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(app.innerHTML).toContain('El PDF está listo.');
      await tocar('enviar-pdf');
      expect(intentos).toBe(2);
      expect(pdfs.generados).toBe(1);
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('mientras arma el PDF la ficha no acepta toques, y navegar descarta el resultado', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); }, canShare: () => true });
      let terminar = (): void => {};
      pdfs.espera = new Promise<void>(r => { terminar = r; });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      // Sin await: el toque queda colgado de `generar` hasta que el test lo suelte.
      const generando = tocar('compartir-pdf');
      await esperar();
      expect(app.innerHTML).toContain('Armando el PDF…');
      await tocar('cerrar-compartir');
      expect(app.innerHTML).toContain('Armando el PDF…');
      // Se va a otra receta antes de que termine: el PDF de la primera no se manda.
      await abrir('#/r/f2');
      terminar();
      await generando;
      await esperar();
      expect(compartidos).toHaveLength(0);
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('texto: lo comparte con el título adentro', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); } });
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-texto');
      expect(compartidos[0]?.text?.startsWith('Rabas\n')).toBe(true);
    });

    it('link sin share ni portapapeles: lo muestra para copiar', async () => {
      estado.md = PASOS;
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-link');
      expect(app.innerHTML).toContain('#/ver?r=1');
    });
  });

  describe('la estrella de favorito', () => {
    it('la estrella pone el tag, guarda y queda encendida', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [frito]\n---\n';
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(estado.guardados.at(-1)?.tags).toEqual(['favorito', 'frito']);
      expect(app.innerHTML).toContain('class="fav on"');
    });

    it('tocarla de nuevo lo saca', async () => {
      estado.md = '---\ntitulo: Rabas\ntags: [favorito, frito]\n---\n';
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(estado.guardados.at(-1)?.tags).toEqual(['frito']);
      expect(app.innerHTML).not.toContain('class="fav on"');
    });

    it('si la escritura falla, la estrella vuelve como estaba y avisa', async () => {
      estado.md = '---\ntitulo: Rabas\n---\n';
      estado.fallaGuardar = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');

      await tocar('favorito');

      expect(app.innerHTML).not.toContain('class="fav on"');
      // No sólo «no quedó encendida»: tiene que haber vuelto a su estado
      // normal y no quedar girando —si `marcandoFavorito` no se revierte en
      // el camino de error, la estrella se dibuja "cargando" y `disabled`
      // para siempre, y las dos aserciones de arriba no lo notarían.
      expect(app.innerHTML).not.toContain('class="fav cargando"');
      expect(app.innerHTML).not.toContain('disabled');
      expect(app.innerHTML).toContain('No se pudo marcar');
    });
  });

  describe('el velo de la escritura en curso (R8)', () => {
    /** Una promesa que el test resuelve cuando quiere: la escritura tarda lo que él decida. */
    function pendiente<T>() {
      let resolver!: (valor: T) => void;
      const promesa = new Promise<T>(r => { resolver = r; });
      return { promesa, resolver };
    }

    it('mientras se crea la receta, la pantalla no responde ni navega', async () => {
      const original = storeFake.crear;
      const { promesa, resolver } = pendiente<{ id: string; nombre_archivo: string }>();
      storeFake.crear = () => promesa;
      try {
        const { abrir, tocar, app, velo, empujados, vueltasAtras } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };
        // Sin await: el toque queda colgado de `crear` hasta que el test lo suelte.
        const guardando = tocar('guardar');
        await esperar();

        expect(velo.hidden).toBe(false);
        // Ningún otro toque hace nada, ni siquiera el volver del encabezado.
        await tocar('volver');
        expect(vueltasAtras).toEqual([]);
        // Y el gesto de atrás no dibuja la pantalla nueva: la URL vuelve al editor.
        await abrir('#/r/f1');
        expect(empujados).toEqual(['#/nueva']);
        expect(global.location.hash).toBe('#/nueva');
        expect(app.innerHTML).toContain('data-formulario');

        resolver({ id: 'nuevo-1', nombre_archivo: 'pan.md' });
        await guardando;
      } finally {
        storeFake.crear = original;
      }
    });

    it('al terminar, el velo se va y el guardado sigue su camino', async () => {
      const { abrir, tocar, velo, vueltasAtras } = await montar();
      await abrir('#/nueva');
      estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

      await tocar('guardar');

      expect(velo.hidden).toBe(true);
      expect(estado.creadas).toEqual(['Pan']);
      expect(vueltasAtras).toHaveLength(1);
    });

    it('si la escritura falla, el velo se va y queda el aviso con lo escrito', async () => {
      const original = storeFake.crear;
      storeFake.crear = async () => { throw new Error('red'); };
      try {
        const { abrir, tocar, app, velo } = await montar();
        await abrir('#/nueva');
        estado.formulario = { titulo: 'Pan', carpeta: 'c1' };

        await tocar('guardar');

        expect(velo.hidden).toBe(true);
        expect(app.innerHTML).toContain('No se pudo guardar.');
        expect(app.innerHTML).toContain('Pan');
      } finally {
        storeFake.crear = original;
      }
    });

    it('la estrella de favorito no lo muestra: no traba la lectura de la receta', async () => {
      const original = storeFake.guardar;
      const { promesa, resolver } = pendiente<void>();
      storeFake.guardar = () => promesa;
      try {
        const { abrir, tocar, velo } = await montar();
        await abrir('#/r/f1');

        const marcando = tocar('favorito');
        await esperar();

        expect(velo.hidden).toBe(true);
        resolver();
        await marcando;
      } finally {
        storeFake.guardar = original;
      }
    });

    it('con la captura es igual: no responde mientras escribe, y al terminar cierra a Borradores', async () => {
      const original = storeFake.agregarBorrador;
      const { promesa, resolver } = pendiente<{ id: string; titulo: string; fuente: string; nota: string; capturado: string }>();
      storeFake.agregarBorrador = () => promesa;
      try {
        const { abrir, tocar, app, velo, empujados, reemplazos, vueltasAtras } = await montar();
        await abrir('#/capturar');
        estado.formulario = { titulo: 'Focaccia' };
        const guardando = tocar('guardar-captura');
        await esperar();

        expect(velo.hidden).toBe(false);
        await tocar('volver');
        expect(vueltasAtras).toEqual([]);
        await abrir('#/');
        expect(empujados).toEqual(['#/capturar']);
        expect(app.innerHTML).toContain('Nuevo borrador');

        resolver({ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' });
        await guardando;

        expect(velo.hidden).toBe(true);
        expect(reemplazos.at(-1)).toBe('#/borradores');
      } finally {
        storeFake.agregarBorrador = original;
      }
    });
  });

  it('ningún guardado exitoso muestra un cartel de confirmación', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toMatch(/guardad|listo|éxito/i);
  });

  describe('convertir con Claude', () => {
    const mdConId = (id: string): string =>
      `---\ntitulo: Focaccia\nborrador: ${id}\n---\n\n## Preparación\n1. Hornear.\n`;
    const MD_SIN_ID = '---\ntitulo: Focaccia\n---\n\n## Preparación\n1. Hornear.\n';

    it('Convertir con Claude, sin menú Compartir, abre el link a Claude con el pedido', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: 'https://x', nota: '', capturado: '' }];
      vi.stubGlobal('navigator', {});
      const { abrir, tocar } = await montar();
      // `montar()` no le da `open` al doble de `window`: se lo agrega acá,
      // sólo para este test, y se lo saca en el `finally`.
      const aperturas: string[] = [];
      const ventana = global.window as unknown as Record<string, unknown>;
      const original = ventana['open'];
      ventana['open'] = (u: string) => { aperturas.push(u); };
      try {
        await abrir('#/borradores/b1');
        await tocar('convertir-con-claude');
        expect(aperturas).toHaveLength(1);
        expect(aperturas[0]).toMatch(/^https:\/\/claude\.ai\/new\?q=/);
        expect(aperturas[0]).toContain('borrador%3A%20b1');
      } finally {
        ventana['open'] = original;
      }
    });

    it('sin menú Compartir ni portapapeles, y el pedido demasiado largo para el link, avisa en vez de no hacer nada', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: 'https://x', nota: 'a'.repeat(9000), capturado: '' }];
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();

      await abrir('#/borradores/b1');
      await tocar('convertir-con-claude');

      expect(app.innerHTML).toContain('No se pudo abrir Claude ni copiar el pedido.');
    });

    it('compartir una receta con id válido abre el editor atado a ese borrador, con `replace`', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      const { abrir, app, reemplazos } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(mdConId('b1')));

      expect(global.location.hash).toBe('#/nueva?borrador=b1&recibida=1');
      expect(app.innerHTML).toContain('value="Focaccia"');
      expect(app.innerHTML).not.toContain('borrador: b1');
      expect(app.innerHTML).not.toContain('name="borrador"');
      expect(app.innerHTML).toContain('data-valor="incompleta" aria-pressed="true"');
      // Con `replace`, no con una entrada nueva: `#/capturar` era la única
      // entrada que dejó el Share Target, y sumar una acá haría que volver
      // cayera de nuevo en la captura, que reabriría esta misma receta.
      expect(reemplazos).toContain('#/nueva?borrador=b1&recibida=1');
    });

    it('compartir una receta sin id abre la pregunta con `replace`, y elegir "Ninguno" crea la receta nueva', async () => {
      const { abrir, tocar, app, reemplazos } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(MD_SIN_ID));

      expect(global.location.hash).toBe('#/recibida');
      expect(app.innerHTML).toContain('¿De qué borrador es esta receta?');
      expect(reemplazos).toContain('#/recibida');

      await tocar('elegir-borrador-recibido', { valor: '' });

      expect(global.location.hash).toBe('#/nueva?recibida=1');
      expect(app.innerHTML).toContain('value="Focaccia"');
    });

    it('en la pregunta, elegir un borrador ata el editor a él', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      const { abrir, tocar } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(MD_SIN_ID));

      await tocar('elegir-borrador-recibido', { valor: 'b1' });

      expect(global.location.hash).toBe('#/nueva?borrador=b1&recibida=1');
    });

    it('compartir una receta con un id de borrador que no existe también abre la pregunta', async () => {
      const { abrir } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(mdConId('fantasma')));
      expect(global.location.hash).toBe('#/recibida');
    });

    it('compartir algo que no es una receta sigue abriendo la captura', async () => {
      const { abrir, app } = await montar();
      await abrir('#/capturar?text=hola');
      // La pantalla de captura compartida en sí, no sólo el texto: el título
      // y el botón de guardar del borrador.
      expect(app.innerHTML).toContain('<h1>Guardar en Recetario</h1>');
      expect(app.innerHTML).toContain('<div class="fnt">hola</div>');
      expect(app.innerHTML).toContain('data-accion="guardar-captura"');
      expect(app.innerHTML).not.toContain('¿De qué borrador');
    });

    it('pegar receta en el borrador ata el editor a ese borrador, aunque el texto traiga otro id', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      vi.stubGlobal('navigator', { clipboard: { readText: async () => mdConId('otro') } });
      const { abrir, tocar } = await montar();
      await abrir('#/borradores/b1');

      await tocar('pegar-receta');

      expect(global.location.hash).toBe('#/nueva?borrador=b1&recibida=1');
    });

    it('pegar receta en Borradores sigue la regla del id: sin id, lleva a la pregunta', async () => {
      vi.stubGlobal('navigator', { clipboard: { readText: async () => MD_SIN_ID } });
      const { abrir, tocar } = await montar();
      await abrir('#/borradores');

      await tocar('pegar-receta');

      expect(global.location.hash).toBe('#/recibida');
    });

    it('pegar algo que no es una receta avisa y no abre nada', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      vi.stubGlobal('navigator', { clipboard: { readText: async () => 'esto no es una receta' } });
      const { abrir, tocar, app } = await montar();
      await abrir('#/borradores/b1');

      await tocar('pegar-receta');

      expect(app.innerHTML).toContain('Lo copiado no es una receta en .md.');
      expect(app.innerHTML).toContain('Focaccia');
      expect(global.location.hash).toBe('#/borradores/b1');
    });

    it('con el portapapeles bloqueado, avisa que no se pudo leer', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      vi.stubGlobal('navigator', { clipboard: { readText: async () => { throw new Error('denegado'); } } });
      const { abrir, tocar, app } = await montar();
      await abrir('#/borradores/b1');

      await tocar('pegar-receta');

      expect(app.innerHTML).toContain('No se pudo leer lo copiado.');
    });

    it('el editor con la receta recibida cuenta como cambios sin guardar desde que se abre', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      const { abrir, app, empujados, preguntas } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(mdConId('b1')));
      expect(global.location.hash).toBe('#/nueva?borrador=b1&recibida=1');

      await abrir('#/');

      expect(empujados).toEqual(['#/nueva?borrador=b1&recibida=1']);
      expect(app.innerHTML).toContain('data-formulario');
      expect(preguntas.join('')).toContain('data-salida');
      expect(preguntas.join('')).toContain('¿Salir sin guardar los cambios?');
    });

    it('guardar atado a un borrador, desde la receta recibida, convierte, descarta el borrador y cierra a la receta creada', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(mdConId('b1')));
      expect(global.location.hash).toBe('#/nueva?borrador=b1&recibida=1');

      estado.formulario = { titulo: 'Focaccia', carpeta: 'c1' };
      await tocar('guardar');

      expect(estado.creadas).toEqual(['Focaccia']);
      expect(estado.descartados).toEqual(['b1']);
      // No `history.back()`: desde acá volvería a `#/capturar` —o a
      // `#/recibida`—, que reconocería la misma receta ya guardada y la
      // reabriría. Cierra directo a la receta que
      // `store.crear`/`convertirBorrador` acaba de crear.
      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toContain('#/r/nuevo-1');
      expect(global.location.hash).toBe('#/r/nuevo-1');
    });

    it('sin entrada previa en el historial, «Salir sin guardar» cierra a Borradores en vez de intentar volver', async () => {
      estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' }];
      const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(mdConId('b1')));
      // Como en el Share Target real: la captura era la única entrada.
      (global.history as unknown as { length: number }).length = 1;

      await tocar('salir-sin-guardar');

      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toContain('#/borradores');
    });

    it('sin entrada previa, volver desde «¿De qué borrador…» cierra a Borradores', async () => {
      const { abrir, tocar, reemplazos, vueltasAtras } = await montar();
      await abrir('#/capturar?text=' + encodeURIComponent(MD_SIN_ID));
      expect(global.location.hash).toBe('#/recibida');
      (global.history as unknown as { length: number }).length = 1;

      await tocar('volver');

      expect(vueltasAtras).toEqual([]);
      expect(reemplazos).toContain('#/borradores');
    });
  });

  describe('el registro del service worker', () => {
    // `main.ts` no es el script de entrada: `inicio.ts` lo carga con
    // `import()`, así que puede evaluarse después de `load`. Sin este chequeo,
    // el `addEventListener('load', …)` no dispara nunca y el SW no se registra.
    it('con el documento ya completo, se registra sin esperar `load`', async () => {
      const registros: string[] = [];
      vi.stubGlobal('navigator', { serviceWorker: { register: async (ruta: string) => { registros.push(ruta); return {}; } } });
      await montar({ readyState: 'complete' });
      expect(registros).toEqual(['./sw.js']);
    });

    it('con el documento todavía cargando, se registra recién al disparar `load`', async () => {
      const registros: string[] = [];
      vi.stubGlobal('navigator', { serviceWorker: { register: async (ruta: string) => { registros.push(ruta); return {}; } } });
      const { dispararLoad } = await montar({ readyState: 'loading' });
      expect(registros).toEqual([]);
      await dispararLoad();
      expect(registros).toEqual(['./sw.js']);
    });
  });
});
