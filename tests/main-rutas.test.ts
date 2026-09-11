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

/** Lo que el store le da a main. `falla` enciende el error de lectura. */
const estado = { falla: false as boolean | Error };

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
    listar: async () => [],
    agregar: async () => ({ id: 'b1', titulo: '', fuente: '', capturado: '' }),
    editarTitulo: async () => {},
    descartar: async () => {}
  })
}));

const esperar = async (vueltas = 5) => {
  for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0));
};

describe('main.ts: las rutas', () => {
  afterEach(() => { limpiarGlobales(); estado.falla = false; vi.resetModules(); });

  const montar = async () => {
    const clicks: ((e: unknown) => unknown)[] = [];
    const app = {
      innerHTML: '', insertAdjacentHTML: () => {},
      addEventListener: (ev: string, fn: (e: unknown) => unknown) => { if (ev === 'click') clicks.push(fn); }
    };
    const listeners: Record<string, () => void> = {};
    const vueltasAtras: number[] = [];
    global.document = comoGlobal<Document>({
      querySelector: (sel: string) => (sel === '#app' ? app : null),
      querySelectorAll: () => [], addEventListener: () => {}
    });
    global.window = comoGlobal<Window & typeof globalThis>({
      google: {}, addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; }
    });
    global.location = comoGlobal<Location>({ hash: '', pathname: '/recetario/', search: '' });
    global.history = comoGlobal<History>({
      back: () => { vueltasAtras.push(1); }, replaceState: () => {}, length: 5
    });

    await import('../src/main.js');
    await esperar();

    return {
      app,
      vueltasAtras,
      abrir: async (hash: string) => {
        global.location.hash = hash;
        listeners['hashchange']?.();
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
      ['#/capturar', 'Guardar en Recetario'],
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

  it('el volver del encabezado vuelve: es la acción que las pantallas dibujan', async () => {
    // El encabezado emite `volver`; el cableado escuchaba `atras`, el nombre
    // de v1, así que el botón no hacía nada en ninguna pantalla.
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/c/Carnes');
    await tocar('volver');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('salir del modo cocina y volver son la misma salida', async () => {
    const { abrir, tocar, vueltasAtras } = await montar();
    await abrir('#/r/f1/cocinar');
    await tocar('salir-cocina');
    expect(vueltasAtras).toHaveLength(1);
  });

  it('ningún guardado exitoso muestra un cartel de confirmación', async () => {
    const { app, abrir } = await montar();
    await abrir('#/r/f1');
    expect(app.innerHTML).not.toMatch(/guardad|listo|éxito/i);
  });
});
