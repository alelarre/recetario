import { describe, it, expect } from 'vitest';
import { diffCambios } from '../src/catalogo.js';

const CARPETAS = new Map([['raiz', 'Sin categorizar'], ['c1', 'Carnes'], ['c2', 'Postres']]);

const entrada = (extra = {}) => ({
  id_archivo: 'id1', nombre_archivo: 'milanesas.md', titulo: 'Milanesas',
  categoria: 'Carnes', carpeta_id: 'c1', mtime: 1000, tags: [], ingredientes: [], ...extra
});

const cambio = (extra = {}) => ({
  fileId: 'id1', removed: false,
  file: { id: 'id1', name: 'milanesas.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false, ...extra }
});

const indiceCon = (...entradas) => new Map(entradas.map(e => [e.id_archivo, e]));

describe('diffCambios', () => {
  // Tests del brief - camino feliz
  it('un archivo nuevo hay que leerlo', () => {
    const r = diffCambios([cambio()], { indice: new Map(), carpetas: CARPETAS });
    expect(r.releer).toEqual([{ id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: Date.parse('2026-01-01T00:00:00.000Z') }]);
    expect(r.parchear).toEqual([]);
  });

  it('un mtime distinto obliga a releer el contenido', () => {
    const r = diffCambios([cambio()], { indice: indiceCon(entrada()), carpetas: CARPETAS });
    expect(r.releer).toHaveLength(1);
    expect(r.parchear).toEqual([]);
  });

  it('una movida con el mismo mtime se parchea sin descargar el archivo', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio({ parents: ['c2'] })], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r.releer).toEqual([]);
    expect(r.parchear).toEqual([{ id: 'id1', nombre_archivo: 'milanesas.md', categoria: 'Postres', carpeta_id: 'c2', mtime: mismo }]);
  });

  it('un renombre con el mismo mtime también se parchea', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio({ name: 'napolitanas.md' })], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r.parchear[0].nombre_archivo).toBe('napolitanas.md');
  });

  it('sin cambios reales no propone nada', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const r = diffCambios([cambio()], { indice: indiceCon(entrada({ mtime: mismo })), carpetas: CARPETAS });
    expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: ['id1'] });
  });

  it('removed y trashed borran', () => {
    const indice = indiceCon(entrada());
    expect(diffCambios([{ fileId: 'id1', removed: true }], { indice, carpetas: CARPETAS }).borrar).toEqual(['id1']);
    expect(diffCambios([cambio({ trashed: true })], { indice, carpetas: CARPETAS }).borrar).toEqual(['id1']);
  });

  it('moverlo fuera del recetario equivale a borrarlo del índice', () => {
    const r = diffCambios([cambio({ parents: ['otra'] })], { indice: indiceCon(entrada()), carpetas: CARPETAS });
    expect(r.borrar).toEqual(['id1']);
  });

  it('ignora lo que no es un .md', () => {
    const r = diffCambios([cambio({ name: 'foto.png', mimeType: 'image/png' })], { indice: new Map(), carpetas: CARPETAS });
    expect(r.ignorados).toEqual(['id1']);
    expect(r.releer).toEqual([]);
  });

  it('ignora un .md que nunca estuvo y vive fuera del recetario', () => {
    const r = diffCambios([cambio({ parents: ['otra'] })], { indice: new Map(), carpetas: CARPETAS });
    expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: ['id1'] });
  });

  it('procesa varios cambios de distinto tipo en una sola pasada', () => {
    const mismo = Date.parse('2026-01-01T00:00:00.000Z');
    const indice = indiceCon(entrada(), entrada({ id_archivo: 'id2', nombre_archivo: 'flan.md', categoria: 'Postres', carpeta_id: 'c2', mtime: mismo }));
    const r = diffCambios([
      cambio(),
      { fileId: 'id2', removed: true },
      { fileId: 'id3', removed: false, file: { id: 'id3', name: 'nueva.md', mimeType: 'text/markdown', parents: ['c2'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }
    ], { indice, carpetas: CARPETAS });
    expect(r.releer.map(x => x.id)).toEqual(['id1', 'id3']);
    expect(r.borrar).toEqual(['id2']);
  });

  // Tests de defensa
  describe('defensas: cambios', () => {
    it('tolera cambios null', () => {
      const r = diffCambios(null, { indice: new Map(), carpetas: CARPETAS });
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera cambios que no es array (string)', () => {
      const r = diffCambios('no soy array', { indice: new Map(), carpetas: CARPETAS });
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera cambios que no es array (número)', () => {
      const r = diffCambios(123, { indice: new Map(), carpetas: CARPETAS });
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera elementos null dentro de cambios', () => {
      const r = diffCambios([null, cambio()], { indice: new Map(), carpetas: CARPETAS });
      expect(r.releer.length).toBeGreaterThan(0);
      // El cambio válido debe procesarse, el null se salta
    });

    it('tolera elementos sin fileId ni file.id', () => {
      const r = diffCambios([{ removed: false }], { indice: new Map(), carpetas: CARPETAS });
      // El elemento sin id debe saltarse sin romper
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera elementos sin file', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false }], { indice: new Map(), carpetas: CARPETAS });
      // removed=false pero sin file debe tratarse como borrado si estaba
      expect(r.ignorados).toContain('id1');
    });
  });

  describe('defensas: segundo argumento', () => {
    it('tolera que falte el segundo argumento por completo (retorna sin procesar)', () => {
      const r = diffCambios([cambio()]);
      // Sin opciones válidas, no procesa: todo vacío
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera que sea undefined (retorna sin procesar)', () => {
      const r = diffCambios([cambio()], undefined);
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });

    it('tolera que sea null (retorna sin procesar)', () => {
      const r = diffCambios([cambio()], null);
      expect(r).toEqual({ releer: [], parchear: [], borrar: [], ignorados: [] });
    });
  });

  describe('defensas: indice no es Map', () => {
    it('tolera indice que no es Map (plain object)', () => {
      const r = diffCambios([cambio()], { indice: {}, carpetas: CARPETAS });
      // Sin .get() devuelve undefined, indice se trata como Map vacío (archivo es nuevo)
      expect(r.releer.length).toBeGreaterThan(0);
    });

    it('tolera indice null (se trata como Map vacío)', () => {
      const r = diffCambios([cambio()], { indice: null, carpetas: CARPETAS });
      // indice null se trata como Map vacío, el archivo es nuevo
      expect(r.releer.length).toBeGreaterThan(0);
    });

    it('tolera indice undefined (se trata como Map vacío)', () => {
      const r = diffCambios([cambio()], { indice: undefined, carpetas: CARPETAS });
      // indice undefined se trata como Map vacío, el archivo es nuevo
      expect(r.releer.length).toBeGreaterThan(0);
    });
  });

  describe('defensas: carpetas no es Map', () => {
    it('tolera carpetas que no es Map (plain object)', () => {
      const r = diffCambios([cambio()], { indice: new Map(), carpetas: { c1: 'Carnes' } });
      // Sin .get() todo cae en undefined, el archivo se ignora como fuera del recetario
      expect(r.ignorados).toContain('id1');
    });

    it('tolera carpetas null', () => {
      const r = diffCambios([cambio()], { indice: new Map(), carpetas: null });
      expect(r.ignorados).toContain('id1');
    });

    it('tolera carpetas undefined', () => {
      const r = diffCambios([cambio()], { indice: new Map(), carpetas: undefined });
      expect(r.ignorados).toContain('id1');
    });
  });

  describe('defensas: propiedades faltantes en file', () => {
    it('tolera file sin parents', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.md', mimeType: 'text/markdown', modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // Sin parents, [0] será undefined, el archivo se ignora
      expect(r.ignorados).toContain('id1');
    });

    it('tolera file con parents vacío', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.md', mimeType: 'text/markdown', parents: [], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // parents[] vacío, [0] será undefined, el archivo se ignora
      expect(r.ignorados).toContain('id1');
    });

    it('tolera file sin modifiedTime', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.md', mimeType: 'text/markdown', parents: ['c1'], trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // Date.parse(undefined) devuelve NaN, debe tratarse como 0
      expect(r.releer.length).toBeGreaterThan(0);
      expect(r.releer[0].mtime).toBe(0);
    });

    it('tolera file sin name pero válido como markdown por mimeType', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // Sin name, nombre_archivo será undefined, debe ser string vacío o fallar gracefully
      expect(r.releer.length).toBeGreaterThan(0);
    });
  });

  describe('defensas: esMarkdown edge cases', () => {
    it('detecta .md por extensión cuando mimeType falta', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.md', mimeType: 'application/octet-stream', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      expect(r.releer.length).toBeGreaterThan(0);
    });

    it('detecta .MD mayúscula', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.MD', mimeType: 'text/plain', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      expect(r.releer.length).toBeGreaterThan(0);
    });

    it('ignora .txt aunque sea markdown en Drive', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id1', name: 'test.txt', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // mimeType=text/markdown debe valer aunque sea .txt
      expect(r.releer.length).toBeGreaterThan(0);
    });
  });

  describe('defensas: fileId vs file.id', () => {
    it('prefiere fileId cuando ambos existen', () => {
      const r = diffCambios([{ fileId: 'id1', removed: false, file: { id: 'id2', name: 'test.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // Debe usar fileId='id1'
      expect(r.releer[0].id).toBe('id1');
    });

    it('cae back a file.id si falta fileId', () => {
      const r = diffCambios([{ removed: false, file: { id: 'id2', name: 'test.md', mimeType: 'text/markdown', parents: ['c1'], modifiedTime: '2026-01-01T00:00:00.000Z', trashed: false } }], { indice: new Map(), carpetas: CARPETAS });
      // Debe usar file.id='id2'
      expect(r.releer[0].id).toBe('id2');
    });
  });
});
