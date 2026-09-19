import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearStore, TOPE_LECTURAS } from '../src/store.js';
import type { DriveDelStore } from '../src/store.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';
import { SCHEMA_VERSION } from '../src/config.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const md = (titulo: string): string => `---\ntitulo: ${titulo}\n---\n\n## Ingredientes\n- sal\n`;

let drive: DriveFalso;
let sheets: SheetsFalso;
let store: ReturnType<typeof crearStore>;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
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
  store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
});

describe('reconstruir', () => {
  it('indexa la raíz y las categorías, y saltea las carpetas que empiezan con _', async () => {
    const r = await store.reconstruir();
    expect(r.indexadas).toBe(3);
    const titulos = store.entradas().map(e => e.titulo).sort();
    expect(titulos).toEqual(['Asado', 'Bife', 'Suelta']);
  });

  it('_fotos/ no es categoría: la reconoce, la anota en meta y no la lee', async () => {
    drive._store.set('fc', { id: 'fc', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] });
    drive._store.set('fv', { id: 'fv', name: 'otra.md', parents: ['fc'], contenido: md('No es receta') });
    await store.reconstruir();
    expect(store.categorias().map(c => c.nombre)).toEqual(['Carnes']);
    expect(store.entradas().map(e => e.titulo)).not.toContain('No es receta');
    expect(drive.llamadas).not.toContainEqual(['leerTexto', 'fv']);
    expect(store._ctx.fotosId).toBe('fc');
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    expect(meta).toContainEqual(['carpeta_fotos', 'fc']);
  });

  it('las recetas de la raíz quedan como Sin categorizar', async () => {
    await store.reconstruir();
    expect(store.entradas().find(e => e.titulo === 'Suelta')!.categoria).toBe('Sin categorizar');
  });

  it('nombra las ignoradas por no tener titulo, sin borrar el archivo', async () => {
    // Por nombre y no un conteo: así el aviso de Ajustes dice cuál buscar en
    // Drive (C05.5.2).
    const r = await store.reconstruir();
    expect(r.ignorados).toEqual(['sin-titulo.md']);
    expect(drive._store.has('x1')).toBe(true);
  });

  it('deja el flag limpio y la fecha escrita al terminar', async () => {
    await store.reconstruir();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta.reconstruccion_en_curso).toBeFalsy();
    expect(meta.ultima_reconstruccion).toBeTruthy();
  });

  it('anota la versión del esquema, para no reconstruir en cada arranque', async () => {
    // Subir SCHEMA_VERSION es lo que fuerza la reconstrucción; si al terminar
    // no queda anotada, el arranque siguiente vuelve a reconstruir de nuevo.
    await store.reconstruir();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta.schemaVersion).toBe(String(SCHEMA_VERSION));
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

  it('borra las filas viejas de cada hoja en una sola llamada, no una por fila', async () => {
    // De a una, la cuota de escrituras por minuto de Sheets se agota apenas
    // hay unas pocas decenas de recetas: pasó en la práctica con 60 reales.
    await store.reconstruir();  // dos filas más el encabezado, para tener algo que borrar
    const espiaBorrarFilas = vi.spyOn(sheets, 'borrarFilas');
    const espiaBorrarFila = vi.spyOn(sheets, 'borrarFila');
    await store.reconstruir();
    // Una llamada por hoja con filas —recetas y categorías—, nunca dos a la misma.
    const hojas = espiaBorrarFilas.mock.calls.map(llamada => llamada[1]);
    expect(hojas.length).toBeGreaterThan(0);
    expect(new Set(hojas).size).toBe(hojas.length);
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

describe('reconstruir lee varios .md a la vez', () => {
  const TITULOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  /** Deja correr todo lo que ya está resuelto antes de mirar las pendientes. */
  const tic = (): Promise<void> => new Promise(resolver => setTimeout(resolver, 0));

  /**
   * Un Drive cuyas lecturas quedan colgadas hasta que el test las suelta: es la
   * única forma de ver cuántas están en vuelo al mismo tiempo.
   */
  function armar() {
    const base = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      ...TITULOS.map((t, i) => ({ id: `r${i}`, name: `${i}.md`, parents: ['c1'], contenido: md(t) }))
    ]);
    const pendientes: { id: string; soltar: () => void }[] = [];
    const drive = {
      ...base,
      leerTexto: (id: string) => new Promise<string>(resolver => {
        pendientes.push({ id, soltar: () => resolver(base._store.get(id)?.contenido ?? '') });
      })
    } satisfies DriveDelStore & Record<string, unknown>;
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1');
    return { drive, sheets, pendientes, store: crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() }) };
  }

  it('mantiene hasta TOPE_LECTURAS lecturas en vuelo, no una sola', async () => {
    const { store, pendientes } = armar();
    await store.arrancar();

    const reconstruccion = store.reconstruir();
    await tic();
    expect(pendientes.length).toBe(TOPE_LECTURAS);

    // Al terminar una entra la siguiente: el tope se mantiene, no se vacía y
    // vuelve a llenarse por lotes.
    pendientes.shift()!.soltar();
    await tic();
    expect(pendientes.length).toBe(TOPE_LECTURAS);

    while (pendientes.length) { pendientes.shift()!.soltar(); await tic(); }
    await reconstruccion;
    expect(store.entradas().length).toBe(TITULOS.length);
  });

  it('deja las filas en el orden de los archivos aunque las lecturas terminen desordenadas', async () => {
    const { store, sheets, pendientes } = armar();
    await store.arrancar();

    const reconstruccion = store.reconstruir();
    await tic();
    // La última pedida termina primero: el orden de llegada no es el de Drive.
    while (pendientes.length) { pendientes.pop()!.soltar(); await tic(); }
    await reconstruccion;

    expect(store.entradas().map(e => e.titulo)).toEqual(TITULOS);
    const recetas = sheets.appends.filter(a => a.hoja === 'recetas').at(-1)!;
    const titulo = COLUMNAS.indexOf('titulo');
    expect(recetas.valores.map(f => f[titulo])).toEqual(TITULOS);
  });

  it('el progreso avanza de a uno aunque las lecturas se solapen', async () => {
    const { store, pendientes } = armar();
    await store.arrancar();

    const vistos: number[] = [];
    const reconstruccion = store.reconstruir(p => vistos.push(p.leidas));
    await tic();
    while (pendientes.length) { pendientes.pop()!.soltar(); await tic(); }
    await reconstruccion;

    expect(vistos).toEqual(TITULOS.map((_, i) => i + 1));
  });
});
