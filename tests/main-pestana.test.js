// tests/main-pestana.test.js
//
// `pestana` vive en el módulo de main.js, no en la ruta: es la única pieza de
// estado de la vista de detalle que sobrevive a un render. Por eso hay que
// probar acá que se resetea al cambiar de receta, igual que main-nueva-receta:
// simulando el entorno global y mirando con qué pestaña se llama a
// renderDetalle.
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

describe('main.js: la pestaña del detalle', () => {
  afterEach(() => {
    delete global.document;
    delete global.window;
    delete global.location;
    delete global.history;
  });

  it('vuelve a Ingredientes al abrir otra receta', async () => {
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

    // Receta A: arranca en ingredientes
    global.location.hash = '#/r/A';
    hashListeners.hashchange();
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].pestana).toBe('ingredientes');

    // El usuario toca "Notas" en A
    const botonNotas = {
      dataset: { pestana: 'notas' }, classList: { contains: () => false },
      closest: () => null, tagName: 'BUTTON'
    };
    for (const fn of clickListeners) {
      await fn({ target: { closest: (sel) => (sel.includes('data-pestana') ? botonNotas : null) } });
    }
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].pestana).toBe('notas');

    // Receta B: tiene que volver al default, no heredar "notas"
    global.location.hash = '#/r/B';
    hashListeners.hashchange();
    await esperarMicrotareas();
    expect(detalleSpy.mock.lastCall[0].pestana).toBe('ingredientes');
  });
});
