import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES, serializeBorrador } from '../src/borrador.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { arranqueListo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-13T10:00:00.000Z';

const md = (titulo: string, capturado: string, nota = '', fuente = ''): string =>
  serializeBorrador({ titulo, fuente, capturado, nota });

/**
 * Un Recetario con `_borradores/` y dos borradores: el más nuevo primero en la
 * hoja, para ver que la lista ordena. `conCarpeta: false` arma uno sin la
 * carpeta, y `hojas` elige qué hojas tiene la planilla.
 */
async function armar({
  conCarpeta = true,
  hojas = ['recetas', 'meta', 'borradores'],
  copia = null as CopiaIndice | null
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    ...(conCarpeta ? [
      { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'b1', name: 'focaccia.md', parents: ['bc'], contenido: md('Focaccia', '2026-09-10T00:00:00.000Z', 'Con romero.', 'https://x/1') },
      { id: 'b2', name: 'rabas.md', parents: ['bc'], contenido: md('Rabas', '2026-09-01T00:00:00.000Z') }
    ] : [])
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', hojas);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  if (hojas.includes('borradores')) {
    sheets.cargar('i1', 'borradores', [
      [...COLUMNAS_BORRADORES],
      ['b1', 'focaccia.md', 'Focaccia', '2026-09-10T00:00:00.000Z'],
      ['b2', 'rabas.md', 'Rabas', '2026-09-01T00:00:00.000Z']
    ]);
  }
  const lecturas: string[] = [];
  const leer = sheets.leer.bind(sheets);
  sheets.leer = async (id: string, rango: string) => { lecturas.push(rango); return leer(id, rango); };
  const indiceLocal = indiceLocalFalso(copia);
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store, lecturas };
}

/** Cada fila de borradores de la copia apunta a la fila de la hoja donde está ese borrador. */
async function borradoresCoincidenConLaPlanilla(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const hoja = await sheets.leer('i1', 'borradores!A1:D100');
  expect(copia).not.toBeNull();
  expect(copia!.borradores).toHaveLength(hoja.length - 1);
  for (const { fila, entrada } of copia!.borradores) {
    expect(hoja[fila - 1]?.[0], `fila ${fila}`).toBe(entrada.id_archivo);
  }
}

describe('los borradores al abrir', () => {
  it('se cargan de la hoja borradores, y la lista va de lo más viejo a lo más nuevo', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Focaccia']);
  });

  it('entran en la copia local con su número de fila', async () => {
    const { store, sheets, indiceLocal } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('una copia que sirve trae los borradores sin leer Sheets', async () => {
    const primera = await armar();
    await primera.store.arrancar();
    await primera.store.cargarIndice();

    const segunda = await armar({ copia: primera.indiceLocal.actual() });
    await segunda.store.arrancar();
    await segunda.store.cargarIndice();

    expect(segunda.lecturas).toEqual([]);
    expect(segunda.store.borradores()).toEqual(primera.store.borradores());
  });

  it('borrador(id) lee y parsea su .md', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(await store.borrador('b1')).toEqual({
      id: 'b1', titulo: 'Focaccia', fuente: 'https://x/1',
      capturado: '2026-09-10T00:00:00.000Z', nota: 'Con romero.'
    });
  });

  it('la carpeta _borradores no es una categoría', async () => {
    const { store } = await armar();
    expect(arranqueListo(await store.arrancar()).categorias.map(c => c.nombre)).toEqual(['Carnes']);
  });

  it('crear la planilla crea también la hoja borradores con su encabezado', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    const id = store._ctx.indiceId;
    expect((await sheets.hojas(id)).map(h => h.title)).toEqual(['recetas', 'meta', 'borradores']);
    expect((await sheets.leer(id, 'borradores!A1:D1'))[0]).toEqual([...COLUMNAS_BORRADORES]);
  });
});

describe('reindexar los borradores', () => {
  it('rearma la hoja borradores desde la carpeta', async () => {
    const { store, sheets, drive } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    // Un borrador escrito por fuera: sólo aparece al reindexar.
    drive._store.set('b3', {
      id: 'b3', name: 'pan.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: md('Pan', '2026-09-05T00:00:00.000Z')
    });

    await store.reconstruir();

    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Pan', 'Focaccia']);
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja).toHaveLength(4);
    expect(hoja.slice(1).map(f => f[0]).sort()).toEqual(['b1', 'b2', 'b3']);
  });

  it('crea la hoja borradores si la planilla no la tiene', async () => {
    const { store, sheets, indiceLocal } = await armar({ hojas: ['recetas', 'meta'] });
    await store.arrancar();
    await store.reconstruir();
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja[0]).toEqual([...COLUMNAS_BORRADORES]);
    expect(hoja).toHaveLength(3);
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('un borrador sin título se saltea y se nombra en ignorados', async () => {
    const { store, drive } = await armar();
    await store.arrancar();
    drive._store.set('b9', {
      id: 'b9', name: 'suelto.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: 'sin frontmatter'
    });
    const r = await store.reconstruir();
    expect(r.ignorados).toContain('suelto.md');
    expect(store.borradores().map(b => b.id_archivo)).not.toContain('b9');
  });

  it('sin carpeta _borradores, la hoja queda vacía', async () => {
    const { store, sheets } = await armar({ conCarpeta: false });
    await store.arrancar();
    await store.reconstruir();
    expect(store.borradores()).toEqual([]);
    expect(await sheets.leer('i1', 'borradores!A1:D100')).toHaveLength(1);
  });

  it('el progreso cuenta recetas y borradores juntos', async () => {
    const { store } = await armar();
    await store.arrancar();
    const vistos: number[] = [];
    await store.reconstruir(p => vistos.push(p.total));
    expect(vistos.at(-1)).toBe(2);
  });
});
