// tests/main-estado-vista.test.js
//
// El estado de la vista de detalle vive en el módulo de main.js, no en la
// ruta, así que sobrevive a un render y hay que resetearlo a mano al cambiar
// de receta. Antes el que se arrastraba era la pestaña abierta; ahora que las
// pestañas se fueron, el que queda es el plegado de los ingredientes — mismo
// bug, otro mecanismo. Se prueba simulando el entorno global y mirando con
// qué argumentos se llama a renderDetalle.
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ArgsDetalle } from '../src/ui/detalle.js';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/app.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({}) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));
vi.mock('../src/cache.js', () => ({ abrirCache: async () => ({}) }));

const detalleSpy = vi.fn((_args?: ArgsDetalle) => '<div></div>');
vi.mock('../src/ui/detalle.js', () => ({
  renderDetalle: (args?: ArgsDetalle) => detalleSpy(args)
}));

/** Los argumentos del último renderDetalle. Si no hubo, el test tiene que fallar acá. */
const ultimoDetalle = (): ArgsDetalle => {
  const args = detalleSpy.mock.lastCall;
  if (!args) throw new Error('renderDetalle no se llamó');
  return args[0] ?? {};
};

const storeFake = {
  arrancar: async () => ({ estado: 'listo', reconstruir: false, categorias: [] }),
  cargarIndice: async () => [],
  sync: async () => ({}),
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [],
  categoriasConConteo: () => [],
  receta: async (id: string) => ({
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
  afterEach(limpiarGlobales);

  it('el plegado de ingredientes no se arrastra a la receta siguiente', async () => {
    const hashListeners: Record<string, () => void> = {};
    const clickListeners: ((e: unknown) => unknown)[] = [];
    const app = {
      innerHTML: '', insertAdjacentHTML: () => {},
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => {
        if (ev === 'click') clickListeners.push(fn);
      }
    };
    global.document = comoGlobal<Document>({
      querySelector: () => app, querySelectorAll: () => [], addEventListener: () => {}
    });
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { hashListeners[ev] = fn; }
    });
    global.location = comoGlobal<Location>({ hash: '' });
    global.history = comoGlobal<History>({ back: () => {} });

    await import('../src/main.js');
    await esperarMicrotareas();

    // Receta A: los ingredientes arrancan a la vista
    global.location.hash = '#/r/A';
    hashListeners['hashchange']?.();
    await esperarMicrotareas();
    expect(ultimoDetalle().ingredientesPlegados).toBe(false);

    // El usuario pliega los ingredientes en A
    const boton = {
      dataset: { accion: 'ingredientes' }, classList: { contains: () => false },
      closest: () => null, tagName: 'BUTTON'
    };
    for (const fn of clickListeners) {
      await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
    }
    await esperarMicrotareas();
    expect(ultimoDetalle().ingredientesPlegados).toBe(true);

    // Receta B: tiene que abrir con los ingredientes a la vista
    global.location.hash = '#/r/B';
    hashListeners['hashchange']?.();
    await esperarMicrotareas();
    expect(ultimoDetalle().ingredientesPlegados).toBe(false);
  });
});
