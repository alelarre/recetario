import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\ntags: [horno]\n---\n\n## Ingredientes\n- 200 g de muzzarella\n`;

let drive, sheets, cache, store;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'milanesas.md', parents: ['c1'], contenido: MD, modifiedTime: '2026-01-01T00:00:00.000Z' }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:L1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
});

describe('cargarIndice', () => {
  it('arma el mapa de filas 1-based salteando el encabezado', async () => {
    await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', 'horno', 'muzzarella', '1000']]);
    await store.cargarIndice();
    expect((await cache.leerMapaFilas()).get('r1')).toBe(2);
    expect(store.entradas()).toHaveLength(1);
  });
});

describe('sync', () => {
  it('un archivo nuevo se lee, se parsea y entra al índice', async () => {
    await store.cargarIndice();
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.releidos).toBe(1);
    expect(store.entradas()[0].titulo).toBe('Milanesas');
  });

  it('una movida parchea la fila sin descargar el .md', async () => {
    await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', '', '', String(Date.parse('2026-01-01T00:00:00.000Z'))]]);
    await store.cargarIndice();
    drive.llamadas.length = 0;
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c2'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.parcheados).toBe(1);
    expect(drive.llamadas.some(l => l[0] === 'leerTexto')).toBe(false);
    expect(store.entradas()[0].categoria).toBe('Postres');
  });

  it('un borrado saca la fila y corre las siguientes en el mapa', async () => {
    await sheets.append('i1', 'recetas', [
      ['r1', 'a.md', 'A', 'Carnes', 'c1', '', '', '', '', '', '', '1'],
      ['r2', 'b.md', 'B', 'Carnes', 'c1', '', '', '', '', '', '', '1']
    ]);
    await store.cargarIndice();
    drive.cambios = async () => ({ changes: [{ fileId: 'r1', removed: true }], newStartPageToken: '101' });
    await store.sync();
    const mapa = await cache.leerMapaFilas();
    expect(mapa.has('r1')).toBe(false);
    expect(mapa.get('r2')).toBe(2);  // era 3, se corrió una
  });

  it('guarda el nuevo changesPageToken para la próxima vez', async () => {
    await store.cargarIndice();
    drive.cambios = async () => ({ changes: [], newStartPageToken: '999' });
    await store.sync();
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    expect(meta.find(f => f[0] === 'changesPageToken')[1]).toBe('999');
  });

  it('una receta sin titulo no entra al índice', async () => {
    drive._store.get('r1').contenido = '---\nrinde: 2\n---\n\nsin título\n';
    await store.cargarIndice();
    drive.cambios = async () => ({
      changes: [{ fileId: 'r1', removed: false, file: { id: 'r1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }],
      newStartPageToken: '101'
    });
    const r = await store.sync();
    expect(r.ignoradosSinTitulo).toBe(1);
    expect(store.entradas()).toHaveLength(0);
  });

  it('dos borrados en el mismo sync corren las filas siguientes sin mezclar', async () => {
    await sheets.append('i1', 'recetas', [
      ['r1', 'a.md', 'A', 'Carnes', 'c1', '', '', '', '', '', '', '1'],
      ['r2', 'b.md', 'B', 'Carnes', 'c1', '', '', '', '', '', '', '2'],
      ['r3', 'c.md', 'C', 'Carnes', 'c1', '', '', '', '', '', '', '3']
    ]);
    await store.cargarIndice();
    drive.cambios = async () => ({
      changes: [
        { fileId: 'r1', removed: true },
        { fileId: 'r2', removed: true }
      ],
      newStartPageToken: '101'
    });
    await store.sync();
    const mapa = await cache.leerMapaFilas();
    expect(mapa.has('r1')).toBe(false);
    expect(mapa.has('r2')).toBe(false);
    expect(mapa.get('r3')).toBe(2);  // era 4, se corrió dos veces
    const entradas = store.entradas();
    expect(entradas).toHaveLength(1);
    expect(entradas[0].id_archivo).toBe('r3');
  });
});
