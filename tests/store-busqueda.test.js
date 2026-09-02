import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const fila = (id, titulo, categoria, carpeta, tags, ingredientes, dificultad = '') =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', dificultad, '', tags, ingredientes, '1000'];

let store, sheets;

beforeEach(async () => {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:L1', [COLUMNAS]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  await sheets.append('i1', 'recetas', [
    fila('r1', 'Milanesas napolitanas', 'Carnes', 'c1', 'horno|rápido', 'muzzarella|nalga', 'fácil'),
    fila('r2', 'Bife de chorizo', 'Carnes', 'c1', 'parrilla', 'bife', 'fácil'),
    fila('r3', 'Flan casero', 'Postres', 'c2', 'incompleto', 'huevo|leche', 'media')
  ]);
  store = crearStore({ drive, sheets, cache: crearCacheMemoria() });
  await store.arrancar();
  await store.cargarIndice();
});

describe('buscar', () => {
  it('sin filtros devuelve todo', async () => {
    expect(store.buscar({})).toHaveLength(3);
  });

  it('busca en el título ignorando tildes y mayúsculas', () => {
    expect(store.buscar({ texto: 'MILANESAS' }).map(e => e.id_archivo)).toEqual(['r1']);
    expect(store.buscar({ texto: 'flan' }).map(e => e.id_archivo)).toEqual(['r3']);
  });

  it('busca también por ingrediente', () => {
    expect(store.buscar({ texto: 'muzzarella' }).map(e => e.id_archivo)).toEqual(['r1']);
  });

  it('filtra por categoría', () => {
    expect(store.buscar({ categoria: 'Carnes' })).toHaveLength(2);
  });

  it('filtra por tag, y varios tags piden todos', () => {
    expect(store.buscar({ tags: ['horno'] }).map(e => e.id_archivo)).toEqual(['r1']);
    expect(store.buscar({ tags: ['horno', 'parrilla' ] })).toHaveLength(0);
  });

  it('filtra por dificultad', () => {
    expect(store.buscar({ dificultad: 'fácil' })).toHaveLength(2);
  });

  it('combina filtros', () => {
    expect(store.buscar({ categoria: 'Carnes', tags: ['rápido'] }).map(e => e.id_archivo)).toEqual(['r1']);
  });

  it('lista lo que falta terminar filtrando por incompleto', () => {
    expect(store.buscar({ tags: ['incompleto'] }).map(e => e.id_archivo)).toEqual(['r3']);
  });

  it('no lanza con argumentos inválidos', () => {
    // buscar(null), buscar(42), buscar('texto') devuelven el índice entero sin lanzar
    expect(store.buscar(null)).toHaveLength(3);
    expect(store.buscar(42)).toHaveLength(3);
    expect(store.buscar('texto')).toHaveLength(3);
  });

  it('no lanza si tags es un string en vez de array', () => {
    // Si tags viene como string (por error de interfaz), lo trata como array vacío y devuelve todo
    expect(store.buscar({ tags: 'horno' })).toHaveLength(3);
  });

  it('no lanza si los valores son null o undefined', () => {
    // Todos los valores null devuelven el índice entero
    expect(store.buscar({ texto: null, categoria: null, dificultad: null })).toHaveLength(3);
    expect(store.buscar({ texto: undefined, categoria: undefined })).toHaveLength(3);
  });
});

describe('categoriasConConteo', () => {
  it('cuenta las recetas de cada categoría', () => {
    const c = store.categoriasConConteo();
    expect(c.find(x => x.nombre === 'Carnes').cantidad).toBe(2);
    expect(c.find(x => x.nombre === 'Postres').cantidad).toBe(1);
  });

  it('no muestra Sin categorizar cuando la raíz está vacía', () => {
    expect(store.categoriasConConteo().some(c => c.nombre === 'Sin categorizar')).toBe(false);
  });
});

describe('tagsDe', () => {
  it('ordena por frecuencia descendente, y a igual frecuencia, alfabéticamente', () => {
    // Carnes tiene horno, rápido, parrilla todos con frecuencia 1, así que el orden es alfabético
    expect(store.tagsDe('Carnes').map(t => t.tag)).toEqual(['horno', 'parrilla', 'rápido']);
  });

  it('prioriza frecuencia sobre orden alfabético', async () => {
    // Agregar recetas: zapallo en tres, asado en una
    // Así zapallo (3 veces) viene antes que horno (1 vez) a pesar de que 'h' < 'z'
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Ensalada de zapallo', 'Carnes', 'c1', 'zapallo', 'zapallo', 'fácil'),
      fila('r5', 'Zapallo relleno', 'Carnes', 'c1', 'zapallo', 'zapallo', 'media'),
      fila('r6', 'Zapallo gratinado', 'Carnes', 'c1', 'zapallo', 'zapallo', 'media'),
      fila('r7', 'Asado', 'Carnes', 'c1', 'asado', 'carne', 'media')
    ]);
    await store.cargarIndice();
    const tags = store.tagsDe('Carnes');
    // zapallo aparece 3 veces, es el primero aunque alfabéticamente viene después que 'horno'
    expect(tags[0].tag).toBe('zapallo');
    expect(tags[0].cantidad).toBe(3);
  });
});
