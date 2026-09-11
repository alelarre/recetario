// tests/main-estado-vista.test.ts
//
// El estado de la vista vive en el módulo de main.ts y no en la ruta, así que
// sobrevive a un render: lo que se prueba acá es que cambiar de receta dibuja
// la receta nueva y no arrastra nada de la anterior. El plegado de
// ingredientes, que era el estado que se arrastraba en v1, se fue con la barra
// pegajosa: la receta se lee de corrido.
//
// El cableado entero de main.ts —las once vistas y sus errores— es de la
// Tarea 22, y sus tests se escriben ahí.
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { OpcionesReceta } from '../src/ui/receta.js';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
vi.mock('../src/auth.js', () => ({
  crearAuth: () => ({ conectar: async () => {}, token: async () => 'tok', olvidar: () => {} })
}));
vi.mock('../src/drive.js', () => ({ crearDrive: () => ({}) }));
vi.mock('../src/sheets.js', () => ({ crearSheets: () => ({}) }));

const recetaSpy = vi.fn((_args?: OpcionesReceta) => '<div></div>');
vi.mock('../src/ui/receta.js', () => ({
  renderReceta: (args?: OpcionesReceta) => recetaSpy(args)
}));

/** Los argumentos del último renderReceta. Si no hubo, el test tiene que fallar acá. */
const ultimaReceta = (): OpcionesReceta => {
  const args = recetaSpy.mock.lastCall;
  if (!args) throw new Error('renderReceta no se llamó');
  if (!args[0]) throw new Error('renderReceta se llamó sin argumentos');
  return args[0];
};

const storeFake = {
  arrancar: async () => ({ estado: 'listo', reconstruir: false, categorias: [] }),
  cargarIndice: async () => [],
  guardarMeta: async () => {},
  ultimaReconstruccion: () => '',
  entradas: () => [],
  categoriasConConteo: () => [],
  receta: async (id: string) => ({
    entrada: { id_archivo: id, titulo: id },
    receta: { titulo: id, ingredientes: 'a', preparacion: 'b', notas: 'c' }
  }),
  buscar: () => [],
  tagsDe: () => []
};
vi.mock('../src/store.js', () => ({ crearStore: () => storeFake }));

async function esperarMicrotareas(vueltas = 5) {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
}

describe('main.ts: la vista de una receta', () => {
  afterEach(limpiarGlobales);

  it('cambiar de receta dibuja la receta nueva', async () => {
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

    global.location.hash = '#/r/A';
    hashListeners['hashchange']?.();
    await esperarMicrotareas();
    expect(ultimaReceta().entrada?.id_archivo).toBe('A');

    global.location.hash = '#/r/B';
    hashListeners['hashchange']?.();
    await esperarMicrotareas();
    expect(ultimaReceta().entrada?.id_archivo).toBe('B');
    // Y nada de la anterior sobrevive al cambio.
    expect(ultimaReceta().receta.titulo).toBe('B');
  });
});
