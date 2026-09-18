import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { serializePlan } from '../src/plan.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { Plan } from '../src/tipos.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-18T10:00:00.000Z';

const plan: Plan = { comidas: [{ dia: 1, momento: 'noche', id: 'f1', titulo: 'Rabas' }] };

/** Un Recetario con `_plan.md` o sin él, y con la opción de que esté repetido. */
async function armar({ planes = [] as { id: string; contenido: string; modifiedTime?: string }[] } = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    ...planes.map(p => ({ id: p.id, name: '_plan.md', parents: ['raiz'], contenido: p.contenido, modifiedTime: p.modifiedTime ?? FECHA }))
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'borradores', 'categorias']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();
  return { drive, sheets, store };
}

describe('leer el plan', () => {
  it('lo encuentra por nombre en la carpeta base y lo parsea', async () => {
    const { store } = await armar({ planes: [{ id: 'p1', contenido: serializePlan(plan) }] });
    expect(await store.plan()).toEqual(plan);
  });

  it('sin archivo, el plan está vacío y no se crea nada', async () => {
    const { store, drive } = await armar();
    expect(await store.plan()).toEqual({ comidas: [] });
    expect([...drive._store.values()].some(a => a.name === '_plan.md')).toBe(false);
  });

  it('lo busca una sola vez por sesión: el id queda en memoria', async () => {
    const { store, drive } = await armar({ planes: [{ id: 'p1', contenido: serializePlan(plan) }] });
    await store.plan();
    await store.plan();
    expect(drive.llamadas.filter(l => l[0] === 'buscarPorNombre' && l[1] === '_plan.md')).toHaveLength(1);
  });

  it('con más de uno manda el más reciente, y queda el aviso', async () => {
    const { store } = await armar({
      planes: [
        { id: 'viejo', contenido: '## Lunes\n- Noche: [Viejo](drive:v)\n', modifiedTime: '2026-01-01T00:00:00.000Z' },
        { id: 'nuevo', contenido: '## Lunes\n- Noche: [Nuevo](drive:n)\n', modifiedTime: '2026-09-18T00:00:00.000Z' }
      ]
    });
    expect((await store.plan()).comidas[0]?.titulo).toBe('Nuevo');
    expect(store.planDuplicado()).toEqual({ cantidad: 2, modifiedTime: '2026-09-18T00:00:00.000Z' });
  });

  it('con uno solo no hay aviso', async () => {
    const { store } = await armar({ planes: [{ id: 'p1', contenido: '' }] });
    await store.plan();
    expect(store.planDuplicado()).toBeNull();
  });
});

describe('guardar el plan', () => {
  it('crea `_plan.md` en la carpeta base al primer cambio', async () => {
    const { store, drive } = await armar();
    await store.plan();
    await store.guardarPlan(plan);
    const archivo = [...drive._store.values()].find(a => a.name === '_plan.md');
    expect(archivo?.parents).toEqual(['raiz']);
    expect(archivo?.contenido).toBe(serializePlan(plan));
  });

  it('lo crea una sola vez: el segundo guardado reescribe el mismo archivo', async () => {
    const { store, drive } = await armar();
    await store.guardarPlan(plan);
    await store.guardarPlan({ comidas: [] });
    const archivos = [...drive._store.values()].filter(a => a.name === '_plan.md');
    expect(archivos).toHaveLength(1);
    expect(archivos[0]?.contenido).toBe('');
  });

  it('reescribe el archivo entero sobre el que ya existía', async () => {
    const { store, drive } = await armar({ planes: [{ id: 'p1', contenido: '## Lunes\n- Noche: [Viejo](drive:v)\n' }] });
    await store.guardarPlan(plan);
    expect(drive._store.get('p1')?.contenido).toBe(serializePlan(plan));
  });

  it('reiniciar deja el archivo vacío, y leerlo de vuelta da el plan vacío', async () => {
    const { store } = await armar({ planes: [{ id: 'p1', contenido: serializePlan(plan) }] });
    await store.guardarPlan({ comidas: [] });
    expect(await store.plan()).toEqual({ comidas: [] });
  });

  it('lo guardado es lo que devuelve la próxima lectura, sin volver a Drive', async () => {
    const { store, drive } = await armar({ planes: [{ id: 'p1', contenido: '' }] });
    await store.plan();
    await store.guardarPlan(plan);
    const antes = drive.llamadas.filter(l => l[0] === 'leerTexto').length;
    expect(await store.plan()).toEqual(plan);
    expect(drive.llamadas.filter(l => l[0] === 'leerTexto')).toHaveLength(antes);
  });
});

describe('el plan y el índice', () => {
  it('el reindexado no toma `_plan.md` como receta', async () => {
    const { store, drive } = await armar({ planes: [{ id: 'p1', contenido: serializePlan(plan) }] });
    drive._store.set('r1', {
      id: 'r1', name: 'milanesas.md', parents: ['c1'],
      contenido: '---\ntitulo: Milanesas\n---\n'
    });
    const { indexadas, ignorados } = await store.reconstruir();
    expect(indexadas).toBe(1);
    expect(ignorados).toEqual([]);
    expect(store.entradas().map(e => e.nombre_archivo)).toEqual(['milanesas.md']);
  });
});
