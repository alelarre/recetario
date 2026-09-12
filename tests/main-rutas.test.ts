// tests/main-rutas.test.ts
//
// `main.ts` es el cableado: no exporta nada y corre sobre `environment: 'node'`,
// así que la única forma de probarlo es simular su entorno global y sus
// dependencias, y después mirar qué se pintó. Lo que se prueba acá es lo que
// sólo se ve en el cableado: que cada ruta dibuje su pantalla, y que un fallo
// de red avise sin dejar datos de una lectura anterior.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';
import { entradaFalsa } from './dobles.js';
import { parse } from '../src/recipe.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({ cuenta: async () => 'alguien@gmail.com' }) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));

/** Lo que los dobles le dan a main. `falla` enciende el error de lectura. */
const estado = {
  falla: false as boolean | Error,
  borradores: [] as { id: string; titulo: string; fuente: string; nota: string; capturado: string }[]
};

const storeFake = {
  arrancar: async () => ({
    estado: 'listo', reconstruir: false, raizId: 'raiz',
    categorias: [{ id: 'c1', nombre: 'Carnes' }]
  }),
  cargarIndice: async () => [],
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  categoriasConConteo: () => [{ id: 'c1', nombre: 'Carnes', cantidad: 1 }],
  buscar: () => [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', categoria: 'Carnes' })],
  buscarPorTexto: () => ({ porNombre: [], porIngrediente: [], porTag: [] }),
  tagsDe: () => [],
  receta: async (id: string) => {
    if (estado.falla) throw estado.falla === true ? new Error('red') : estado.falla;
    return { entrada: entradaFalsa({ id_archivo: id }), receta: parse('---\ntitulo: Milanesas\n---\n') };
  }
};
vi.mock('../src/store.js', () => ({ crearStore: () => storeFake }));
vi.mock('../src/borradores.js', () => ({
  crearBorradores: () => ({
    listar: async () => estado.borradores,
    agregar: async () => ({ id: 'b1', titulo: '', fuente: '', capturado: '' }),
    editar: async () => {},
    descartar: async () => {}
  })
}));

const esperar = async (vueltas = 5) => {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
};

describe('main.ts: las rutas', () => {
  afterEach(() => {
    limpiarGlobales();
    estado.falla = false;
    estado.borradores = [];
    vi.resetModules();
  });

  const montar = async () => {
    const clicks: ((e: unknown) => unknown)[] = [];
    const cambios: ((e: unknown) => unknown)[] = [];
    const app = {
      innerHTML: '', insertAdjacentHTML: () => {},
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => {
        if (ev === 'click') clicks.push(fn);
        if (ev === 'change') cambios.push(fn);
      }
    };
    const listeners: Record<string, () => void> = {};
    const vueltasAtras: number[] = [];
    const scrolls: number[] = [];
    global.document = comoGlobal<Document>({
      querySelector: (sel: string) => (sel === '#app' ? app : null),
      querySelectorAll: () => [], addEventListener: () => {}
    });
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; },
      scrollTo: (_x: number, y: number) => { scrolls.push(y); }, scrollY: 0
    });
    // `replace` es lo que usan las navegaciones de cierre: no agrega una
    // entrada al historial, y el doble lo distingue de asignar `hash`.
    const reemplazos: string[] = [];
    global.location = comoGlobal<Location>({
      hash: '', pathname: '/recetario/', search: '',
      replace: (h: string) => { reemplazos.push(h); global.location.hash = h; }
    });
    global.history = comoGlobal<History>({
      back: () => { vueltasAtras.push(1); }, replaceState: () => {}, length: 5
    });

    await import('../src/main.js');
    await esperar();

    return {
      app,
      vueltasAtras,
      scrolls,
      reemplazos,
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
      tocar: async (accion: string) => {
        const boton = {
          dataset: { accion }, classList: { contains: () => false },
          closest: () => null, tagName: 'BUTTON', remove: () => {}
        };
        for (const fn of clicks) {
          await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
        }
        await esperar();
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
    // El encabezado emite `volver`; el cableado escuchaba `atras`, el nombre
    // de v1, así que el botón no hacía nada en ninguna pantalla.
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
    // Con una navegación nueva, la receta quedaba dos veces seguidas en el
    // historial y su chevron parecía no hacer nada. Y antes de eso, con
    // `location.hash =`, el chevron de la receta volvía al modo cocina.
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

  it('ningún guardado exitoso muestra un cartel de confirmación', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toMatch(/guardad|listo|éxito/i);
  });
});
