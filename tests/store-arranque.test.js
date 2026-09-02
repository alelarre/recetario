import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

function conRecetario(extra = []) {
  return driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'privada', name: '_privada', mimeType: CARPETA, parents: ['raiz'] },
    ...extra
  ]);
}

const armar = (drive) => {
  const sheets = sheetsFalso();
  const cache = crearCacheMemoria();
  return { store: crearStore({ drive, sheets, cache }), sheets, cache, drive };
};

describe('arranque en frío', () => {
  it('sin carpeta Recetario no crea nada y manda al SETUP', async () => {
    const { store, drive } = armar(driveFalso([]));
    const r = await store.arrancar();
    expect(r.estado).toBe('falta-estructura');
    expect(drive._store.size).toBe(0);
  });

  it('con dos carpetas Recetario pide elegir', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'r2', name: 'Recetario', mimeType: CARPETA, parents: ['otra'] }
    ]);
    const r = await armar(drive).store.arrancar();
    expect(r.estado).toBe('elegir-carpeta');
    expect(r.candidatas).toHaveLength(2);
  });

  it('descubre las categorías listando subcarpetas, y excluye las que empiezan con _', async () => {
    const r = await armar(conRecetario()).store.arrancar();
    expect(r.categorias.map(c => c.nombre).sort()).toEqual(['Carnes', 'Postres']);
  });

  it('sin planilla la crea con encabezados y pide reconstruir', async () => {
    const { store, drive } = armar(conRecetario());
    const r = await store.arrancar();
    expect(r.estado).toBe('listo');
    expect(r.reconstruir).toBe(true);
    const creada = [...drive._store.values()].find(a => a.name === '_indice');
    expect(creada).toBeDefined();
  });

  it('con una planilla recién creada, ultimaReconstruccion no rompe y da vacío', async () => {
    const { store } = armar(conRecetario());
    await store.arrancar();
    await expect(store.ultimaReconstruccion()).resolves.toBe('');
  });

  it('con dos planillas usa la más reciente y avisa', async () => {
    const drive = conRecetario([
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: '2026-01-01T00:00:00.000Z' },
      { id: 'i2', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: '2026-02-01T00:00:00.000Z' }
    ]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1'); sheets.crearPlanilla('i2');
    const r = await store.arrancar();
    expect(r.indiceId).toBe('i2');
    expect(r.avisos).toContain('indice-duplicado');
  });

  it('si la búsqueda falla arranca en solo lectura y NO crea una segunda planilla', async () => {
    const drive = conRecetario();
    drive.fallar('buscarPorNombre', Object.assign(new Error('sin red'), { status: 0 }));
    const { store } = armar(drive);
    const r = await store.arrancar();
    expect(r.estado).toBe('solo-lectura');
    expect([...drive._store.values()].some(a => a.name === '_indice')).toBe(false);
  });

  it('con reconstruccion_en_curso marcado pide reconstruir en vez de confiar en el índice', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
    await sheets.escribir('i1', 'meta!A2:B2', [['reconstruccion_en_curso', 'si']]);
    expect((await store.arrancar()).reconstruir).toBe(true);
  });

  it('con schemaVersion viejo pide reconstruir', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '0']]);
    expect((await store.arrancar()).reconstruir).toBe(true);
  });

  it('si falla listarCarpetas arranca en solo lectura sin lanzar', async () => {
    const drive = conRecetario();
    const { store } = armar(drive);

    // Envolvé listarCarpetas para lanzar
    const listarOriginal = drive.listarCarpetas;
    drive.listarCarpetas = async function() {
      throw Object.assign(new Error('sin red'), { status: 0 });
    };

    const r = await store.arrancar();
    expect(r.estado).toBe('solo-lectura');
    expect([...drive._store.values()].some(a => a.name === '_indice')).toBe(false);
  });

  it('si falla buscarPorNombre de planilla arranca en solo lectura y NO crea _indice', async () => {
    const drive = conRecetario();
    const { store } = armar(drive);

    // Guardá la original, reemplazá para fallar solo en la segunda llamada
    const buscarOriginal = drive.buscarPorNombre;
    let callCount = 0;
    drive.buscarPorNombre = async function(nombre, padre) {
      callCount++;
      if (callCount === 2) throw Object.assign(new Error('sin red'), { status: 0 });
      return buscarOriginal.call(drive, nombre, padre);
    };

    const r = await store.arrancar();
    expect(r.estado).toBe('solo-lectura');
    expect([...drive._store.values()].some(a => a.name === '_indice')).toBe(false);
  });
});
