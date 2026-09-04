// tests/main-estado-vista.test.js
//
// El estado de la vista de detalle vive en el módulo de main.js, no en la
// ruta, así que sobrevive a un render y hay que resetearlo a mano al cambiar
// de receta. Antes el que se arrastraba era la pestaña abierta; ahora que las
// pestañas se fueron, el que queda es el plegado de los ingredientes — mismo
// bug, otro mecanismo. Se prueba simulando el entorno global y mirando con
// qué argumentos se llama a renderDetalle.
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/app.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({}) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));
vi.mock('../src/cache.js', () => ({ abrirCache: async () => ({}) }));

const detalleSpy = vi.fn(() => '<div></div>');
vi.mock('../src/ui/detalle.js', () => ({ renderDetalle: (...args) => detalleSpy(...args) }));

const storeFake = {
  arrancar: async () => ({ estado: 'listo', reconstruir: false, categorias: [] }),
  cargarIndice: async () => [],
  sync: async () => ({}),
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [],
  categoriasConConteo: () => [],
  receta: async (id) => ({
    entrada: { id, titulo: id },
    receta: { titulo: id, ingredientes: 'a', preparacion: 'b', notas: 'c' }
  }),
  flush: async () => {},
  buscar: () => [],
  tagsDe: () => []
};
vi.mock('../src/store.js', () => ({ crearStore: () => storeFake }));

async function esperarMicrotareas(vueltas = 5) {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
}

describe('main.js: el estado de la vista de detalle', () => {
  afterEach(() => {
    delete global.document;
    delete global.window;
    delete global.location;
    delete global.history;
  });

  it('el plegado de ingredientes no se arrastra a la receta siguiente', async () => {
    const hashListeners = {};
    const clickListeners = [];
    const app = {
      innerHTML: '', insertAdjacentHTML: () => {},
      addEventListener: (ev, fn) => { if (ev === 'click') clickListeners.push(fn); }
    };
    global.document = { querySelector: () => app, querySelectorAll: () => [], addEventListener: () => {} };
    global.window = { google: {}, addEventListener: (ev, fn) => { hashListeners[ev] = fn; } };
    global.location = { hash: '' };
    global.history = { back: () => {} };

    await import('../src/main.js');
    await esperarMicrotareas();

    // Receta A: los ingredientes arrancan a la vista
    global.location.hash = '#/r/A';
    hashListeners.hashchange();
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].ingredientesPlegados).toBe(false);

    // El usuario pliega los ingredientes en A
    const boton = {
      dataset: { accion: 'ingredientes' }, classList: { contains: () => false },
      closest: () => null, tagName: 'BUTTON'
    };
    for (const fn of clickListeners) {
      await fn({ target: { closest: (sel) => (sel.includes('data-accion') ? boton : null) } });
    }
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].ingredientesPlegados).toBe(true);

    // Receta B: tiene que abrir con los ingredientes a la vista
    global.location.hash = '#/r/B';
    hashListeners.hashchange();
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].ingredientesPlegados).toBe(false);
  });
});
