import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

/**
 * Tres carpetas: Pastas sin propiedades (predefinida a migrar), «Mis tartas» con
 * propiedades de Tartas (una predefinida renombrada a mano) y «Fiambres» sin
 * propiedades (desconocida). Más `_borradores`, que no es categoría. `hojas`
 * elige qué hojas tiene la planilla.
 */
function armar(hojas = ['recetas', 'meta', 'borradores', 'categorias']) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Pastas', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Mis tartas', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'tartas', foto: 'catalogo:tartas-y-empanadas' } },
    { id: 'c3', name: 'Fiambres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', hojas);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.cargar('i1', 'borradores', [[...COLUMNAS_BORRADORES]]);
  if (hojas.includes('categorias')) sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS]]);
  const indiceLocal = indiceLocalFalso();
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store };
}

describe('reindexar las categorías', () => {
  it('escribe color y foto sólo a las predefinidas que no los tienen', async () => {
    const { store, drive } = armar();
    await store.arrancar();
    await store.reconstruir();
    const escritas = drive.llamadas.filter(l => l[0] === 'propiedades');
    expect(escritas).toEqual([['propiedades', 'c1', { color: 'pastas', foto: 'catalogo:pastas' }]]);
  });

  it('una carpeta con propiedades las conserva aunque se llame distinto', async () => {
    const { store } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(store.categorias().find(c => c.id === 'c2')).toEqual(
      { id: 'c2', nombre: 'Mis tartas', color: 'tartas', foto: 'catalogo:tartas-y-empanadas' });
  });

  it('una desconocida queda sin color ni foto, y _borradores no es categoría', async () => {
    const { store } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(store.categorias().find(c => c.id === 'c3')).toEqual({ id: 'c3', nombre: 'Fiambres', color: '', foto: '' });
    expect(store.categorias().map(c => c.nombre)).not.toContain('_borradores');
  });

  it('escribe la hoja categorias y anota carpeta_borradores en meta', async () => {
    const { store, sheets } = armar();
    await store.arrancar();
    await store.reconstruir();
    const hoja = await sheets.leer('i1', 'categorias!A1:D100');
    expect(hoja[0]).toEqual([...COLUMNAS_CATEGORIAS]);
    expect(hoja.slice(1).map(f => f[0]).sort()).toEqual(['c1', 'c2', 'c3']);
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['carpeta_borradores']).toBe('bc');
  });

  it('crea la hoja categorias si la planilla no la tiene', async () => {
    const { store, sheets } = armar(['recetas', 'meta', 'borradores']);
    await store.arrancar();
    await store.reconstruir();
    expect((await sheets.hojas('i1')).map(h => h.title)).toContain('categorias');
    expect(await sheets.leer('i1', 'categorias!A1:D100')).toHaveLength(4);
  });

  it('la copia guardada al terminar trae las categorías y la raíz', async () => {
    const { store, indiceLocal } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(indiceLocal.actual()?.raizId).toBe('raiz');
    expect(indiceLocal.actual()?.categorias.map(c => c.id).sort()).toEqual(['c1', 'c2', 'c3']);
  });
});

describe('cargar las categorías', () => {
  it('salen de la hoja, con el id de _borradores de meta, sin listar carpetas', async () => {
    const { store, sheets, drive } = armar();
    sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Pastas', 'pastas', 'catalogo:pastas']]);
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_borradores', 'bc']]);
    let listadas = 0;
    const listar = drive.listarCarpetas.bind(drive);
    drive.listarCarpetas = async (id: string) => { listadas++; return listar(id); };

    await store.arrancar();
    await store.cargarIndice();

    expect(store.categorias()).toEqual([{ id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' }]);
    expect(listadas).toBe(0);
    const b = await store.agregarBorrador({ titulo: 'Pan', fuente: '', nota: '' });
    expect(drive._store.get(b.id)?.parents).toEqual(['bc']);
  });

  it('con la planilla recién creada están vacías hasta reindexar', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    expect(store.categorias()).toEqual([]);
    await store.reconstruir();
    expect(store.categorias().map(c => c.nombre)).toEqual(['Carnes']);
  });

  it('agregar el primer borrador anota la carpeta nueva en meta', async () => {
    const { store, sheets } = armar();
    await store.arrancar();
    await store.cargarIndice();
    await store.agregarBorrador({ titulo: 'Pan', fuente: '', nota: '' });
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['carpeta_borradores']).toMatch(/^nuevo/);
  });

  it('crear la planilla crea las cuatro hojas', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    expect((await sheets.hojas(store._ctx.indiceId)).map(h => h.title))
      .toEqual(['recetas', 'meta', 'borradores', 'categorias']);
  });
});

describe('abrir por la copia', () => {
  /** Una primera apertura que reindexa y deja la copia; la segunda la usa. */
  async function segundaApertura() {
    const primera = armar();
    await primera.store.arrancar();
    await primera.store.reconstruir();
    const drive = primera.drive;
    drive.llamadas.length = 0;
    let lecturas = 0;
    const leer = primera.sheets.leer.bind(primera.sheets);
    primera.sheets.leer = async (id: string, rango: string) => { lecturas++; return leer(id, rango); };
    const store = crearStore({ drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal });
    return { store, drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal, lecturas: () => lecturas };
  }

  it('con la copia vigente, un solo pedido a Drive y ninguno a Sheets', async () => {
    const { store, drive, lecturas } = await segundaApertura();
    const r = await store.arrancar();
    await store.cargarIndice();
    expect(r.estado).toBe('listo');
    expect(drive.llamadas).toEqual([['metadatos', 'i1']]);
    expect(lecturas()).toBe(0);
    expect(store.categorias().map(c => c.id).sort()).toEqual(['c1', 'c2', 'c3']);
  });

  it('con otra fecha, lee la planilla sin buscar nada', async () => {
    const { store, drive, lecturas } = await segundaApertura();
    drive._store.get('i1')!.modifiedTime = '2030-01-01T00:00:00.000Z';
    await store.arrancar();
    await store.cargarIndice();
    expect(drive.llamadas.some(l => l[0] === 'buscarPorNombre')).toBe(false);
    expect(lecturas()).toBeGreaterThan(0);
    expect(store.categorias()).toHaveLength(3);
  });

  it('si _indice ya no está, busca como la primera vez', async () => {
    const { store, drive } = await segundaApertura();
    drive._store.get('i1')!.trashed = true;
    await store.arrancar();
    expect(drive.llamadas.some(l => l[0] === 'buscarPorNombre')).toBe(true);
  });

  it('sin red, solo-lectura: la copia no se usa para dibujar', async () => {
    const { store, drive } = await segundaApertura();
    drive.fallar('metadatos', Object.assign(new Error('sin red'), { status: 0 }));
    expect((await store.arrancar()).estado).toBe('solo-lectura');
  });
});
