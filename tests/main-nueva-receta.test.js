// tests/main-nueva-receta.test.js
//
// main.js es el cableado de la app: no tiene entorno DOM en los tests
// (vite.config.js usa `environment: 'node'`) y no exporta nada, así que la
// única forma de probarlo es simular su entorno global (document, window,
// location, prompt) y los módulos de los que depende, y después mirar a
// dónde navega. Es más pesado que el resto de la suite a propósito: es el
// único lugar donde vive la regla "crear navega al editor" (§7.2).
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/app.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({}) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));
vi.mock('../src/cache.js', () => ({ abrirCache: async () => ({}) }));

const storeFake = {
  arrancar: async () => ({ estado: 'listo', reconstruir: false, categorias: [] }),
  cargarIndice: async () => [],
  sync: async () => ({}),
  guardarMeta: async () => {},
  ultimaReconstruccion: async () => '',
  crear: async ({ titulo }) => ({ id: 'nuevo-id' }),
  entradas: () => [],
  categoriasConConteo: () => [],
  receta: async () => ({ entrada: null, receta: null }),
  flush: async () => {},
  buscar: () => [],
  tagsDe: () => []
};
vi.mock('../src/store.js', () => ({ crearStore: () => storeFake }));

async function esperarMicrotareas(vueltas = 5) {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
}

describe('main.js: crear una receta', () => {
  afterEach(() => {
    delete global.document;
    delete global.window;
    delete global.location;
    delete global.prompt;
  });

  it('después de crear, navega directo al editor y no al detalle', async () => {
    const listeners = {};
    global.document = {
      querySelector: () => ({ innerHTML: '', insertAdjacentHTML: () => {}, addEventListener: () => {} }),
      addEventListener: () => {}
    };
    global.window = { google: {}, addEventListener: (ev, fn) => { listeners[ev] = fn; } };
    global.location = { hash: '' };
    global.prompt = () => 'Receta nueva';

    await import('../src/main.js');
    await esperarMicrotareas();  // deja terminar el arranque fire-and-forget

    global.location.hash = '#/nueva';
    listeners.hashchange();
    await esperarMicrotareas();

    expect(global.location.hash).toBe('#/r/nuevo-id/editar');
  });
});
