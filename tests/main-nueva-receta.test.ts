// tests/main-nueva-receta.test.js
//
// main.js es el cableado de la app: no tiene entorno DOM en los tests
// (vite.config.js usa `environment: 'node'`) y no exporta nada, así que la
// única forma de probarlo es simular su entorno global (document, window,
// location) y los módulos de los que depende, y después mirar qué se pintó.
// "Nueva receta" ya no usa prompt(): navega directo al mismo formulario que
// editar, sin entrada, y "Guardar" es lo que de verdad crea el archivo en
// Drive (cubierto en store-escritura.test.js) con los datos del formulario
// (cubierto en vista-editor.test.js) — acá solo importa que no aparezca
// ningún prompt en el camino.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/app.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({}) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));
vi.mock('../src/cache.js', () => ({ abrirCache: async () => ({}) }));

const storeFake = {
  arrancar: async () => ({ estado: 'listo', reconstruir: false, categorias: [{ id: 'c1', nombre: 'Carnes' }] }),
  cargarIndice: async () => [],
  sync: async () => ({}),
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  crear: async () => ({ id: 'nuevo-id', nombre_archivo: 'x.md' }),
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

describe('main.js: navegar a "nueva receta"', () => {
  afterEach(() => {
    limpiarGlobales();
    delete (global as unknown as Record<string, unknown>)['prompt'];
  });

  it('renderiza el formulario de alta directo, sin ningún prompt', async () => {
    const app = { innerHTML: '', insertAdjacentHTML: () => {}, addEventListener: () => {} };
    const listeners: Record<string, () => void> = {};
    global.document = comoGlobal<Document>({
      querySelector: (sel: string) => (sel === '#app' ? app : null),
      addEventListener: () => {}
    });
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; }
    });
    global.location = comoGlobal<Location>({ hash: '', pathname: '/recetario/', search: '' });
    global.history = comoGlobal<History>({ back: () => {}, replaceState: () => {} });
    // Si el código todavía llamara a prompt(), esto lo delata: no hay
    // implementación, así que tirar significa que el popup no se fue del todo.
    global.prompt = () => { throw new Error('no debería llamarse: el popup se sacó del medio'); };

    await import('../src/main.js');
    await esperarMicrotareas();  // deja terminar el arranque fire-and-forget

    global.location.hash = '#/nueva';
    listeners['hashchange']?.();
    await esperarMicrotareas();

    expect(app.innerHTML).toContain('Nueva receta');
    expect(app.innerHTML).toContain('name="titulo"');
    expect(app.innerHTML).not.toContain('data-accion="borrar"');
  });
});
