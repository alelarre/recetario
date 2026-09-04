import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearStore } from '../src/store.js';
import { crearCacheMemoria } from '../src/cache.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import type { Cache } from '../src/cache.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const md = (titulo: string): string => `---\ntitulo: ${titulo}\n---\n\n## Ingredientes\n- sal\n`;

let drive: DriveFalso;
let sheets: SheetsFalso;
let cache: Cache;
let store: ReturnType<typeof crearStore>;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'privada', name: '_privada', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'a.md', parents: ['c1'], contenido: md('Asado') },
    { id: 'r2', name: 'b.md', parents: ['c1'], contenido: md('Bife') },
    { id: 'r3', name: 'suelta.md', parents: ['raiz'], contenido: md('Suelta') },
    { id: 'x1', name: 'sin-titulo.md', parents: ['c1'], contenido: '---\nrinde: 2\n---\n' },
    { id: 'p1', name: 'nota.txt', mimeType: 'text/plain', parents: ['privada'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  cache = crearCacheMemoria();
  store = crearStore({ drive, sheets, cache });
  await store.arrancar();
});

describe('reconstruir', () => {
  it('indexa la raíz y las categorías, y saltea las carpetas que empiezan con _', async () => {
    const r = await store.reconstruir();
    expect(r.indexadas).toBe(3);
    const titulos = store.entradas().map(e => e.titulo).sort();
    expect(titulos).toEqual(['Asado', 'Bife', 'Suelta']);
  });

  it('las recetas de la raíz quedan como Sin categorizar', async () => {
    await store.reconstruir();
    expect(store.entradas().find(e => e.titulo === 'Suelta')!.categoria).toBe('Sin categorizar');
  });

  it('cuenta las ignoradas por no tener titulo, sin borrar el archivo', async () => {
    const r = await store.reconstruir();
    expect(r.ignoradasSinTitulo).toBe(1);
    expect(drive._store.has('x1')).toBe(true);
  });

  it('descarta la cola antes de empezar', async () => {
    await cache.encolar({ tipo: 'fila', id: 'viejo', fila: ['viejo'] });
    await store.reconstruir();
    expect(await cache.leerCola()).toHaveLength(0);
  });

  it('deja el flag limpio y la fecha escrita al terminar', async () => {
    await store.reconstruir();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta.reconstruccion_en_curso).toBeFalsy();
    expect(meta.ultima_reconstruccion).toBeTruthy();
    expect(meta.changesPageToken).toBeTruthy();
  });

  it('reporta progreso mientras lee', async () => {
    const vistos: number[] = [];
    await store.reconstruir(p => vistos.push(p.leidas));
    expect(vistos.length).toBeGreaterThan(0);
    expect(vistos.at(-1)).toBe(4);
  });

  it('reemplaza la planilla entera en vez de agregar filas duplicadas', async () => {
    await store.reconstruir();
    await store.reconstruir();
    const filas = await sheets.leer('i1', 'recetas!A1:L100');
    expect(filas.length).toBe(4);  // encabezado + tres recetas
  });

  it('borra las filas viejas en una sola llamada, no una por fila', async () => {
    // De a una, la cuota de escrituras por minuto de Sheets se agota apenas
    // hay unas pocas decenas de recetas: pasó en la práctica con 60 reales.
    await store.reconstruir();  // dos filas más el encabezado, para tener algo que borrar
    const espiaBorrarFilas = vi.spyOn(sheets, 'borrarFilas');
    const espiaBorrarFila = vi.spyOn(sheets, 'borrarFila');
    await store.reconstruir();
    expect(espiaBorrarFilas).toHaveBeenCalledTimes(1);
    expect(espiaBorrarFila).not.toHaveBeenCalled();
  });

  it('la fecha queda disponible para el home a través de ultimaReconstruccion()', async () => {
    expect(store.ultimaReconstruccion()).toBe('');  // todavía no reconstruyó
    await store.reconstruir();
    const fecha = store.ultimaReconstruccion();
    expect(fecha).toBeTruthy();
    expect(new Date(fecha).toString()).not.toBe('Invalid Date');
  });

  it('después de reconstruir, el valor en memoria es el nuevo y no el viejo', async () => {
    // Verificar que comienza vacío
    expect(store.ultimaReconstruccion()).toBe('');

    // Reconstruir una vez
    const antes = Date.now();
    await store.reconstruir();
    const despues = Date.now();
    const fecha1 = store.ultimaReconstruccion();

    // Verificar que la fecha está en el rango esperado
    expect(fecha1).toBeTruthy();
    const timestamp1 = Date.parse(fecha1);
    expect(timestamp1).toBeGreaterThanOrEqual(antes);
    expect(timestamp1).toBeLessThanOrEqual(despues);

    // Esperar un poco y reconstruir de nuevo
    await new Promise(resolve => setTimeout(resolve, 10));
    await store.reconstruir();
    const fecha2 = store.ultimaReconstruccion();

    // Verificar que la segunda fecha es más reciente que la primera
    expect(fecha2).toBeTruthy();
    expect(Date.parse(fecha2)).toBeGreaterThan(Date.parse(fecha1));
  });
});
