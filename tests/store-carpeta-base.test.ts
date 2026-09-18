import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { COLUMNAS_CATEGORIAS, PREDEFINIDAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { arranqueListo, arranqueEligiendo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MARCA = { recetario: 'raiz' };

/** Una planilla `_indice` completa, con la meta que se pida. */
function planilla(sheets: SheetsFalso, id: string, meta: string[][] = [['schemaVersion', String(SCHEMA_VERSION)]]) {
  sheets.crearPlanilla(id, ['recetas', 'meta', 'borradores', 'categorias']);
  sheets.cargar(id, 'recetas', [[...COLUMNAS]]);
  sheets.cargar(id, 'meta', meta);
  sheets.cargar(id, 'borradores', [[...COLUMNAS_BORRADORES]]);
  sheets.cargar(id, 'categorias', [[...COLUMNAS_CATEGORIAS]]);
}

describe('arrancar por la marca', () => {
  it('una carpeta marcada es la raíz, aunque no se llame Recetario', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Mis recetas', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    const r = arranqueListo(await store.arrancar());
    expect(r.raizId).toBe('m1');
    expect(store.carpeta()).toEqual({ id: 'm1', nombre: 'Mis recetas' });
  });

  it('sin marcadas, elegir-carpeta con las propias llamadas Recetario, sin las ajenas', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'r2', name: 'Recetario', mimeType: CARPETA, parents: ['root'], ajena: true }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    const r = arranqueEligiendo(await store.arrancar());
    expect(r.sugerencias.map(c => c.id)).toEqual(['r1']);
  });

  it('sin marcadas ni Recetario, elegir-carpeta sin sugerencias', async () => {
    const store = crearStore({ drive: driveFalso([]), sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias).toEqual([]);
  });

  it('con varias marcadas, elegir-carpeta con las marcadas', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Una', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'm2', name: 'Otra', mimeType: CARPETA, parents: ['root'], appProperties: MARCA }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias.map(c => c.id).sort()).toEqual(['m1', 'm2']);
  });

  it('una marcada ajena no cuenta', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'De otra persona', mimeType: CARPETA, parents: ['root'], appProperties: MARCA, ajena: true }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias).toEqual([]);
  });

  it('si la búsqueda de la marca falla, solo-lectura', async () => {
    const drive = driveFalso([]);
    drive.fallar('carpetasMarcadas', Object.assign(new Error('sin red'), { status: 0 }));
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect((await store.arrancar()).estado).toBe('solo-lectura');
  });

  it('la copia de una carpeta reemplazada se descarta y se usa la marcada', async () => {
    // Otro dispositivo cambió de carpeta: la vieja perdió la marca y su meta dice
    // reemplazada, y la nueva está marcada.
    const drive = driveFalso([
      { id: 'vieja', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'iv', name: '_indice', mimeType: PLANILLA, parents: ['vieja'], modifiedTime: '2026-09-14T00:00:00.000Z' },
      { id: 'nueva', name: 'Cocina', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'in', name: '_indice', mimeType: PLANILLA, parents: ['nueva'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'iv', [['schemaVersion', String(SCHEMA_VERSION)], ['reemplazada', 'si']]);
    planilla(sheets, 'in');
    const copia = {
      schemaVersion: SCHEMA_VERSION, indiceId: 'iv', raizId: 'vieja', raizNombre: 'Recetario',
      modifiedTime: '2026-09-13T00:00:00.000Z', meta: {}, filas: [], borradores: [], categorias: []
    };
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso(copia) });
    const r = arranqueListo(await store.arrancar());
    expect(r.raizId).toBe('nueva');
    expect(r.indiceId).toBe('in');
  });

  it('la copia guarda el nombre de la carpeta', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Mis recetas', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });
    await store.arrancar();
    await store.cargarIndice();
    expect(indiceLocal.actual()?.raizNombre).toBe('Mis recetas');
  });
});

describe('el setup de una carpeta', () => {
  const subcarpetas = (drive: ReturnType<typeof driveFalso>, padre: string) =>
    [...drive._store.values()].filter(a => a.mimeType === CARPETA && !a.trashed && (a.parents ?? []).includes(padre));

  it('sobre una carpeta vacía: las 16 con color y foto, _indice, reindexa y marca', async () => {
    const drive = driveFalso([{ id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }]);
    const sheets = sheetsFalso();
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });

    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });

    const creadas = subcarpetas(drive, 'n1');
    expect(creadas.map(c => c.name).sort()).toEqual(PREDEFINIDAS.map(p => p.nombre).sort());
    expect(creadas.find(c => c.name === 'Pastas')?.appProperties).toEqual({ color: 'pastas', foto: 'catalogo:pastas' });
    expect([...drive._store.values()].some(a => a.name === '_indice' && (a.parents ?? []).includes('n1'))).toBe(true);
    expect(drive._store.get('n1')?.appProperties).toEqual(MARCA);
    expect(store.categorias()).toHaveLength(16);
    expect(indiceLocal.actual()?.raizNombre).toBe('Nueva');
  });

  it('sobre una carpeta que ya tiene las 16, no crea ninguna', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      ...PREDEFINIDAS.map((p, i) => ({ id: `c${i}`, name: p.nombre, mimeType: CARPETA, parents: ['r1'] }))
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    expect(subcarpetas(drive, 'r1')).toHaveLength(16);
  });

  it('conserva las carpetas propias y crea las predefinidas que faltan', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'f1', name: 'Fiambres', mimeType: CARPETA, parents: ['r1'] },
      { id: 'p1', name: 'pastas', mimeType: CARPETA, parents: ['r1'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    // Pastas ya estaba —con otra mayúscula—: 15 nuevas más las dos que había.
    expect(subcarpetas(drive, 'r1')).toHaveLength(17);
    expect(store.categorias().map(c => c.nombre)).toContain('Fiambres');
  });

  it('si se corta antes de marcar, queda sin marca y sin copia; repetirlo no duplica', async () => {
    const drive = driveFalso([{ id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }]);
    const sheets = sheetsFalso();
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });
    const propiedades = drive.propiedades.bind(drive);
    drive.propiedades = async (id: string, props: Record<string, string | null>) => {
      if (props['recetario']) throw new Error('red');
      return propiedades(id, props);
    };

    await expect(store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' })).rejects.toThrow('red');
    expect(drive._store.get('n1')?.appProperties?.['recetario']).toBeUndefined();
    expect(indiceLocal.actual()).toBeNull();

    drive.propiedades = propiedades;
    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });
    expect(subcarpetas(drive, 'n1')).toHaveLength(16);
    expect([...drive._store.values()].filter(a => a.name === '_indice' && !a.trashed)).toHaveLength(1);
  });

  it('marcar la nueva quita la marca de las otras', async () => {
    const drive = driveFalso([
      { id: 'vieja', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });
    expect(drive._store.get('vieja')?.appProperties?.['recetario']).toBeUndefined();
    expect(drive._store.get('n1')?.appProperties).toEqual(MARCA);
  });

  it('volver a una carpeta con reemplazada la borra', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['r1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1', [['schemaVersion', String(SCHEMA_VERSION)], ['reemplazada', 'si']]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['reemplazada']).toBe('');
  });

  it('marcarReemplazada anota en la meta de la carpeta en uso', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.marcarReemplazada();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['reemplazada']).toBe('si');
  });
});

describe('crear la carpeta base', () => {
  it('crearCarpeta la crea donde se le dice', async () => {
    const drive = driveFalso([{ id: 'a', name: 'Cocina', mimeType: CARPETA, parents: ['root'] }]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    const nueva = await store.crearCarpeta('Recetario', 'a');
    expect(nueva.nombre).toBe('Recetario');
    expect(drive._store.get(nueva.id)).toMatchObject({ mimeType: CARPETA, parents: ['a'] });
  });
});
