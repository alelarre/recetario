import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS, entradaDesdeFila } from '../src/catalogo.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso, recetaFalsa } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { arranqueListo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
/** El modifiedTime de `_indice` que devuelve la búsqueda al arrancar. */
const FECHA = '2026-09-13T10:00:00.000Z';

const fila = (id: string, titulo: string): string[] =>
  [id, `${id}.md`, titulo, 'Carnes', 'c1', '', '', '', '', '', '', '1000'];

/**
 * Un Recetario con una categoría, `_indice` con dos recetas, y el `.md` de la
 * primera. Cuenta las lecturas de Sheets por rango: que no haya ninguna es lo
 * que se quiere probar cuando la copia sirve.
 */
async function armar({
  copia = null as CopiaIndice | null,
  meta = [['schemaVersion', String(SCHEMA_VERSION)]] as string[][]
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    { id: 'r1', name: 'r1.md', parents: ['c1'], contenido: '---\ntitulo: Milanesas\n---\n' }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r1', 'Milanesas'), fila('r2', 'Bife')]);
  sheets.cargar('i1', 'meta', meta);
  const lecturas: string[] = [];
  const leer = sheets.leer.bind(sheets);
  sheets.leer = async (id: string, rango: string) => { lecturas.push(rango); return leer(id, rango); };
  const indiceLocal = indiceLocalFalso(copia);
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store, lecturas };
}

/** Una copia que coincide con la planilla de `armar`, salvo lo que se cambie. */
const copiaVigente = (cambios: Partial<CopiaIndice> = {}): CopiaIndice => ({
  schemaVersion: SCHEMA_VERSION,
  indiceId: 'i1',
  modifiedTime: FECHA,
  meta: { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '2026-09-12T10:00:00.000Z' },
  // Fuera de orden a propósito: al usarla se ordena por número de fila.
  filas: [
    { fila: 3, entrada: entradaDesdeFila(fila('r2', 'Bife')) },
    { fila: 2, entrada: entradaDesdeFila(fila('r1', 'Milanesas de la copia')) }
  ],
  ...cambios
});

describe('al abrir, con la copia local del índice', () => {
  it('si la copia sirve, no lee Sheets y usa sus filas y su meta', async () => {
    const { store, lecturas } = await armar({ copia: copiaVigente() });
    const r = arranqueListo(await store.arrancar());
    await store.cargarIndice();

    expect(lecturas).toEqual([]);
    expect(store.entradas().map(e => e.titulo)).toEqual(['Milanesas de la copia', 'Bife']);
    expect(store.ultimaReconstruccion()).toBe('2026-09-12T10:00:00.000Z');
    expect(r.reconstruir).toBe(false);
  });

  const casos: [string, CopiaIndice | null][] = [
    ['sin copia', null],
    ['con otra fecha', copiaVigente({ modifiedTime: '2026-09-01T00:00:00.000Z' })],
    ['de otra planilla', copiaVigente({ indiceId: 'otra' })],
    ['de otra versión del esquema', copiaVigente({ schemaVersion: SCHEMA_VERSION - 1 })]
  ];

  it.each(casos)('%s, lee meta y recetas y guarda una copia con la fecha de la búsqueda', async (_caso, copia) => {
    const { store, lecturas, indiceLocal } = await armar({ copia });
    await store.arrancar();
    await store.cargarIndice();

    expect(lecturas.some(r => r.startsWith('meta!'))).toBe(true);
    expect(lecturas.some(r => r.startsWith('recetas!'))).toBe(true);
    expect(store.entradas().map(e => e.titulo)).toEqual(['Milanesas', 'Bife']);

    const guardada = indiceLocal.actual();
    expect(guardada?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(guardada?.indiceId).toBe('i1');
    expect(guardada?.modifiedTime).toBe(FECHA);
    expect(guardada?.meta['schemaVersion']).toBe(String(SCHEMA_VERSION));
    expect(guardada?.filas).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'r1', titulo: 'Milanesas' }) },
      { fila: 3, entrada: expect.objectContaining({ id_archivo: 'r2', titulo: 'Bife' }) }
    ]);
  });

  it('la copia que guarda una apertura la usa la siguiente', async () => {
    const primera = await armar();
    await primera.store.arrancar();
    await primera.store.cargarIndice();

    const segunda = await armar({ copia: primera.indiceLocal.actual() });
    await segunda.store.arrancar();
    await segunda.store.cargarIndice();

    expect(segunda.lecturas).toEqual([]);
    expect(segunda.store.entradas()).toEqual(primera.store.entradas());
  });

  it('la decisión de reindexar usa la meta de la copia: reconstruccion_en_curso ahí pide reindexar', async () => {
    const copia = copiaVigente({ meta: { schemaVersion: String(SCHEMA_VERSION), reconstruccion_en_curso: 'si' } });
    const { store, lecturas } = await armar({ copia });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(true);
    expect(lecturas).toEqual([]);
  });

  it('con la copia sirviendo, la meta de la planilla no se mira', async () => {
    const { store } = await armar({
      copia: copiaVigente(),
      meta: [['schemaVersion', String(SCHEMA_VERSION)], ['reconstruccion_en_curso', 'si']]
    });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(false);
  });

  it('con la planilla recién creada, cargar no guarda copia: la guarda el reindexado', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] }
    ]);
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(true);
    await store.cargarIndice();
    expect(indiceLocal.guardadas).toEqual([]);
  });

  it('sin red no toca la copia', async () => {
    const { store, drive, indiceLocal } = await armar({ copia: copiaVigente() });
    drive.fallar('buscarPorNombre', new Error('sin red'));
    expect((await store.arrancar()).estado).toBe('solo-lectura');
    expect(indiceLocal.guardadas).toEqual([]);
    expect(indiceLocal.borradas).toBe(0);
  });
});

/** La fecha que Drive le pone a `_indice` después de que la app escribe. */
const NUEVA = '2026-09-13T11:00:00.000Z';

/** La app abierta sin copia previa: ya bajó la planilla y guardó la primera copia. */
async function abierta() {
  const armado = await armar();
  await armado.store.arrancar();
  await armado.store.cargarIndice();
  // Lo que haría Sheets al escribir: la planilla cambia de fecha en Drive.
  armado.drive._store.get('i1')!.modifiedTime = NUEVA;
  return armado;
}

/** Cada fila de la copia apunta a la fila de la planilla donde está esa receta. */
async function coincideConLaPlanilla(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const planilla = await sheets.leer('i1', 'recetas!A1:L100');
  expect(copia).not.toBeNull();
  expect(copia!.filas).toHaveLength(planilla.length - 1);
  for (const { fila: nro, entrada } of copia!.filas) {
    expect(planilla[nro - 1]?.[0], `fila ${nro}`).toBe(entrada.id_archivo);
  }
}

describe('después de escribir en _indice, la copia queda igual a la planilla', () => {
  it('guardar pide la metadata de _indice y guarda la copia con la fecha nueva', async () => {
    const { store, drive, indiceLocal } = await abierta();
    await store.guardar('r1', recetaFalsa({ titulo: 'Milanesas napolitanas' }));

    expect(drive.llamadas).toContainEqual(['metadatos', 'i1']);
    const copia = indiceLocal.actual();
    expect(copia?.modifiedTime).toBe(NUEVA);
    expect(copia?.filas).toContainEqual({
      fila: 2, entrada: expect.objectContaining({ id_archivo: 'r1', titulo: 'Milanesas napolitanas' })
    });
  });

  it('guardar deja los números de fila de la planilla, aunque en memoria la entrada pase al final', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.guardar('r1', recetaFalsa({ titulo: 'Milanesas napolitanas' }));
    expect(store.entradas().at(-1)?.id_archivo).toBe('r1');
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('crear suma la fila nueva con el número que le tocó en la planilla', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    const { id } = await store.crear(recetaFalsa({ titulo: 'Vitel toné' }), { carpetaId: 'c1' });
    expect(indiceLocal.actual()?.filas).toContainEqual({ fila: 4, entrada: expect.objectContaining({ id_archivo: id }) });
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('borrar corre los números de fila de la copia', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.borrar('r1');
    expect(indiceLocal.actual()?.modifiedTime).toBe(NUEVA);
    expect(indiceLocal.actual()?.filas).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'r2' }) }
    ]);
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('escribir la fila por la capa compartida también deja la receta en la copia', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.escribirFila(recetaFalsa({ titulo: 'Nueva' }),
      { id: 'r9', nombre_archivo: 'r9.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: 1 });
    expect(store.entradas().map(e => e.id_archivo)).toContain('r9');
    expect(indiceLocal.actual()?.filas).toContainEqual({ fila: 4, entrada: expect.objectContaining({ id_archivo: 'r9' }) });
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('reindexar guarda la copia una sola vez, al terminar', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    const antes = indiceLocal.guardadas.length;
    await store.reconstruir();

    expect(indiceLocal.guardadas.length).toBe(antes + 1);
    const copia = indiceLocal.actual();
    expect(copia?.modifiedTime).toBe(NUEVA);
    expect(copia?.meta['reconstruccion_en_curso']).toBe('');
    expect(copia?.meta['ultima_reconstruccion']).toBeTruthy();
    // r2 está en la planilla pero no tiene `.md` en Drive: el reindexado la saca.
    expect(copia?.filas.map(f => f.entrada.id_archivo)).toEqual(['r1']);
    await coincideConLaPlanilla(sheets, copia);
  });

  it('si la escritura remota falla, la copia no cambia', async () => {
    const { store, sheets, drive, indiceLocal } = await abierta();
    const antes = structuredClone(indiceLocal.actual());
    sheets.alEscribir = async () => { throw new Error('cuota'); };

    await expect(store.guardar('r1', recetaFalsa({ titulo: 'Otra' }))).rejects.toThrow('cuota');
    expect(indiceLocal.actual()).toEqual(antes);
    expect(drive.llamadas).not.toContainEqual(['metadatos', 'i1']);
  });

  it('si la escritura sale y falla pedir la metadata, borra la copia y el guardado no falla', async () => {
    const { store, drive, indiceLocal } = await abierta();
    drive.fallar('metadatos', new Error('sin red'));

    await expect(store.guardar('r1', recetaFalsa({ titulo: 'Otra' }))).resolves.toBeUndefined();
    expect(indiceLocal.actual()).toBeNull();
    expect(indiceLocal.borradas).toBe(1);
  });
});
