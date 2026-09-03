// tests/store-escritura.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import { parse } from '../src/recipe.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\n---\n\n## Notas\n- ojo\n`;

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
  await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', '', '', String(Date.parse('2026-01-01T00:00:00.000Z'))]]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
  await store.cargarIndice();
});

describe('guardar', () => {
  it('escribe el .md y deja la fila encolada, no escrita', async () => {
    const receta = parse(MD);
    receta.titulo = 'Milanesas napolitanas';
    const r = await store.guardar('r1', receta, {});
    expect(r.ok).toBe(true);
    expect(drive._store.get('r1').contenido).toContain('titulo: Milanesas napolitanas');
    expect(await cache.leerCola()).toHaveLength(1);
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    expect(filas[1][2]).toBe('Milanesas');  // la planilla todavía no se tocó
  });

  it('flush vuelca la cola a la planilla y la vacía', async () => {
    const receta = parse(MD);
    receta.titulo = 'Milanesas napolitanas';
    await store.guardar('r1', receta, {});
    await store.flush();
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    expect(filas[1][2]).toBe('Milanesas napolitanas');
    expect(await cache.leerCola()).toHaveLength(0);
  });

  it('la UI ve el cambio al instante, sin esperar el flush', async () => {
    const receta = parse(MD);
    receta.titulo = 'Otro título';
    await store.guardar('r1', receta, {});
    expect(store.entradas()[0].titulo).toBe('Otro título');
  });

  it('mover de carpeta cambia la categoría y llama a mover en Drive', async () => {
    await store.guardar('r1', parse(MD), { carpetaDestino: 'c2' });
    expect(drive._store.get('r1').parents).toEqual(['c2']);
    expect(store.entradas()[0].categoria).toBe('Postres');
  });

  it('si el archivo cambió en Drive no lo pisa', async () => {
    drive._store.get('r1').modifiedTime = '2026-06-01T00:00:00.000Z';
    const r = await store.guardar('r1', parse(MD), {});
    expect(r.ok).toBe(false);
    expect(r.conflicto).toBeDefined();
    expect(drive._store.get('r1').contenido).toBe(MD);
  });
});

describe('crear', () => {
  it('escribe un .md con titulo, el tag incompleto y nombre derivado del título', async () => {
    const r = await store.crear({ titulo: 'Ñoquis del 29', carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('noquis-del-29.md');
    const contenido = drive._store.get(r.id).contenido;
    expect(contenido).toContain('titulo: Ñoquis del 29');
    expect(contenido).toContain('incompleto');
  });

  it('sin carpeta cae en la raíz, que es la bandeja de entrada', async () => {
    const r = await store.crear({ titulo: 'Suelta' });
    expect(drive._store.get(r.id).parents).toEqual(['raiz']);
    expect(store.entradas().find(e => e.id_archivo === r.id).categoria).toBe('Sin categorizar');
  });

  it('no pisa un nombre existente', async () => {
    const r = await store.crear({ titulo: 'Milanesas', carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('milanesas-2.md');
  });
});

describe('borrar', () => {
  it('borra el archivo y saca la fila del índice', async () => {
    await store.borrar('r1');
    expect(drive._store.has('r1')).toBe(false);
    expect(store.entradas()).toHaveLength(0);
  });

  it('crear y borrar sin flush: no deja entrada huérfana', async () => {
    const r = await store.crear({ titulo: 'Nueva' });
    expect(store.entradas()).toHaveLength(2);  // r1 + nueva
    await store.borrar(r.id);
    expect(drive._store.has(r.id)).toBe(false);
    expect(store.entradas()).toHaveLength(1);  // solo r1
    const cola = await cache.leerCola();
    expect(cola.filter(op => op.id === r.id)).toHaveLength(0);  // no hay ops pendientes de la borrada
  });

  it('flush después de crear y borrar sin flush: no crea fila fantasma', async () => {
    const r = await store.crear({ titulo: 'Fantasma' });
    await store.borrar(r.id);
    await store.flush();
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    const titulos = filas.slice(1).map(f => f[2]);
    expect(titulos).toEqual(['Milanesas']);  // solo la que existía
  });

  it('borrar una receta con fila sigue funcionando', async () => {
    await store.borrar('r1');
    expect(drive._store.has('r1')).toBe(false);
    expect(store.entradas()).toHaveLength(0);
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    expect(filas).toHaveLength(1);  // solo el encabezado
  });

  it('borrar persiste el mapa de filas en la cache, no solo en memoria', async () => {
    const otra = await store.crear({ titulo: 'Otra' });
    await store.flush();  // le da a "otra" una fila real: r1=2, otra=3

    await store.borrar('r1');

    const mapa = await cache.leerMapaFilas();
    expect(mapa.has('r1')).toBe(false);
    expect(mapa.get(otra.id)).toBe(2);  // corrida un lugar tras borrar la fila 2
  });
});
