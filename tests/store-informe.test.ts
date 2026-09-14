import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import type { EstadoCopia } from '../src/store.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import { arranqueListo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-13T10:00:00.000Z';

/** Dos categorías, la carpeta de borradores —que no cuenta— y `_indice` con la meta que se pida. */
function armar({
  copia = null as CopiaIndice | null,
  meta = [['schemaVersion', String(SCHEMA_VERSION)]] as string[][],
  conIndice = true
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
    ...(conIndice ? [{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA }] : [])
  ]);
  const sheets = sheetsFalso();
  if (conIndice) {
    sheets.crearPlanilla('i1', ['recetas', 'meta', 'borradores']);
    sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
    sheets.cargar('i1', 'meta', meta);
    sheets.cargar('i1', 'borradores', [[...COLUMNAS_BORRADORES]]);
  }
  return crearStore({ drive, sheets, indiceLocal: indiceLocalFalso(copia) });
}

const copiaVigente = (cambios: Partial<CopiaIndice> = {}): CopiaIndice => ({
  schemaVersion: SCHEMA_VERSION, indiceId: 'i1', modifiedTime: FECHA,
  meta: { schemaVersion: String(SCHEMA_VERSION) }, filas: [], borradores: [], raizId: 'raiz', categorias: [], ...cambios
});

describe('el informe del arranque (P18)', () => {
  const casos: [EstadoCopia, CopiaIndice | null][] = [
    ['coincide', copiaVigente()],
    ['sin-copia', null],
    ['otra-fecha', copiaVigente({ modifiedTime: '2026-09-01T00:00:00.000Z' })],
    ['otra-planilla', copiaVigente({ indiceId: 'otra' })],
    ['otro-esquema', copiaVigente({ schemaVersion: SCHEMA_VERSION - 1 })]
  ];

  it.each(casos)('la copia local: %s, con su fecha', async (estado, copia) => {
    const { informe } = arranqueListo(await armar({ copia }).arrancar());
    expect(informe.copia).toBe(estado);
    expect(informe.copiaModificada).toBe(copia?.modifiedTime ?? '');
  });

  it('trae cuándo arrancó y la fecha de _indice', async () => {
    const antes = Date.now();
    const { informe } = arranqueListo(await armar().arrancar());
    expect(Date.parse(informe.momento)).toBeGreaterThanOrEqual(antes);
    expect(informe.indiceModificado).toBe(FECHA);
  });

  it('sin motivo, no reindexa', async () => {
    expect(arranqueListo(await armar().arrancar()).informe.reindexado).toBe('');
  });

  it('con otra versión del esquema en la meta, el motivo es el esquema', async () => {
    const r = arranqueListo(await armar({ meta: [['schemaVersion', '1']] }).arrancar());
    expect(r.reconstruir).toBe(true);
    expect(r.informe.reindexado).toBe('esquema');
  });

  it('con un reindexado a medias, el motivo es ése', async () => {
    const meta = [['schemaVersion', String(SCHEMA_VERSION)], ['reconstruccion_en_curso', 'si']];
    expect(arranqueListo(await armar({ meta }).arrancar()).informe.reindexado).toBe('a-medias');
  });

  it('sin _indice, la planilla es nueva: no tiene fecha, y una copia vieja es de otra planilla', async () => {
    const { informe } = arranqueListo(await armar({ conIndice: false, copia: copiaVigente() }).arrancar());
    expect(informe.reindexado).toBe('planilla-nueva');
    expect(informe.indiceModificado).toBe('');
    expect(informe.copia).toBe('otra-planilla');
  });
});
