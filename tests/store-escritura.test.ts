import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, recetaFalsa } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import { parse } from '../src/recipe.js';
import { COLUMNAS } from '../src/catalogo.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\n---\n\n## Notas\n- ojo\n`;

describe('guardar: escritura sincrónica, sin cola', () => {
  it('escribe la fila del índice en el momento, sin cola', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa({ titulo: 'Milanesas' }));

    expect(sheets.escrituras).toHaveLength(1);
    expect(sheets.escrituras[0]?.valores[0]).toContain('Milanesas');
  });

  it('el guardado termina recién cuando Sheets confirmó', async () => {
    const sheets = sheetsFalso();
    let confirmado = false;
    sheets.alEscribir = async () => { await Promise.resolve(); confirmado = true; };
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa());
    expect(confirmado).toBe(true);
  });

  it('guardar dos veces la misma receta deja una sola fila (R2)', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa({ titulo: 'A' }));
    await store.guardar('f1', recetaFalsa({ titulo: 'B' }));

    expect(store.entradas().filter(e => e.id_archivo === 'f1')).toHaveLength(1);
    expect(sheets.appends).toHaveLength(1);   // el segundo reemplaza, no agrega
  });

  it('no compara el modifiedTime remoto: pisa lo que haya', async () => {
    // 'f1' remoto quedó modificado bien después de lo que el índice tiene
    // guardado como su mtime. Con el chequeo de conflicto de antes de esta
    // tarea, esta diferencia rechazaba el guardado; R4 manda pisar igual.
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      { id: 'f1', name: 'f1.md', parents: ['raiz'], modifiedTime: '2030-01-01T00:00:00.000Z' }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
    await sheets.append('i1', 'recetas', [
      ['f1', 'f1.md', 'Vieja', 'Sin categorizar', 'raiz', '', '', '', '', '', '', String(Date.parse('2020-01-01T00:00:00.000Z'))]
    ]);
    const store = crearStore({ drive, sheets });
    await store.arrancar();
    await store.cargarIndice();
    const mtimeViejo = store.entradas().find(e => e.id_archivo === 'f1')?.mtime;
    const escriturasAntes = sheets.escrituras.length;  // el fixture ya escribió encabezado, meta y la fila vieja

    await expect(store.guardar('f1', recetaFalsa())).resolves.toBeUndefined();

    // No alcanza con que la promesa resuelva: una guarda de conflicto que
    // corta temprano también resuelve `undefined`, solo que sin escribir
    // nada. Atar la aserción a un efecto observable es lo que hace que este
    // test falle si alguien repone el chequeo de conflicto.
    expect(sheets.escrituras.length).toBe(escriturasAntes + 1);
    expect(store.entradas().find(e => e.id_archivo === 'f1')?.mtime).not.toBe(mtimeViejo);
  });

  it('si falla la escritura de la fila, el error sale y no queda nada encolado', async () => {
    const sheets = sheetsFalso();
    sheets.alEscribir = async () => { throw new Error('cuota'); };
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets });
    await store.arrancar();
    await store.cargarIndice();

    await expect(store.guardar('f1', recetaFalsa())).rejects.toThrow();
    expect(store).not.toHaveProperty('flush');
  });
});

let drive: DriveFalso;
let sheets: SheetsFalso;
let store: ReturnType<typeof crearStore>;

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
  await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  await sheets.append('i1', 'recetas', [['r1', 'milanesas.md', 'Milanesas', 'Carnes', 'c1', '', '', '', '', '', '', String(Date.parse('2026-01-01T00:00:00.000Z'))]]);
  store = crearStore({ drive, sheets });
  await store.arrancar();
  await store.cargarIndice();
});

describe('guardar', () => {
  it('la UI ve el cambio al instante', async () => {
    const receta = parse(MD);
    receta.titulo = 'Otro título';
    await store.guardar('r1', receta, {});
    expect(store.entradas()[0]?.titulo).toBe('Otro título');
  });

  it('mover de carpeta cambia la categoría y llama a mover en Drive', async () => {
    await store.guardar('r1', parse(MD), { carpetaDestino: 'c2' });
    expect(drive._store.get('r1')!.parents).toEqual(['c2']);
    expect(store.entradas()[0]?.categoria).toBe('Postres');
  });
});

describe('crear', () => {
  it('escribe un .md con lo que le pasen, y nombre derivado del título', async () => {
    // No fuerza ningún tag: eso ahora lo decide quien llama (el formulario).
    const r = await store.crear(recetaFalsa({ titulo: 'Ñoquis del 29', tags: ['rico'] }), { carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('noquis-del-29.md');
    const contenido = drive._store.get(r.id)!.contenido;
    expect(contenido).toContain('titulo: Ñoquis del 29');
    expect(contenido).toContain('rico');
  });

  it('sin carpeta cae en la raíz, que es la bandeja de entrada', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Suelta' }));
    expect(drive._store.get(r.id)!.parents).toEqual(['raiz']);
    expect(store.entradas().find(e => e.id_archivo === r.id)!.categoria).toBe('Sin categorizar');
  });

  it('no pisa un nombre existente', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Milanesas' }), { carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('milanesas-2.md');
  });
});

describe('borrar', () => {
  it('borra el archivo y saca la fila del índice', async () => {
    await store.borrar('r1');
    expect(drive._store.has('r1')).toBe(false);
    expect(store.entradas()).toHaveLength(0);
  });

  it('crear y borrar no deja entrada huérfana', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Nueva' }));
    expect(store.entradas()).toHaveLength(2);  // r1 + nueva
    await store.borrar(r.id);
    expect(drive._store.has(r.id)).toBe(false);
    expect(store.entradas()).toHaveLength(1);  // solo r1
  });

  it('crear y borrar no deja fila fantasma en la planilla', async () => {
    // La escritura es sincrónica ahora: no hace falta un flush aparte para
    // que esto se refleje en la planilla.
    const r = await store.crear(recetaFalsa({ titulo: 'Fantasma' }));
    await store.borrar(r.id);
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

  it('borrar corre el mapa de filas en memoria, no solo la planilla', async () => {
    const otra = await store.crear(recetaFalsa({ titulo: 'Otra' }));  // fila 3
    await store.borrar('r1');  // se borra la fila 2; "otra" tiene que correr a la 2

    await store.guardar(otra.id, recetaFalsa({ titulo: 'Otra actualizada' }));

    // Si el store no hubiera corrido el número de fila de "otra" en memoria,
    // este guardar habría escrito en la vieja fila 3 en vez de la 2, dejando
    // dos filas para la misma receta en vez de actualizar la que hay.
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    const deOtra = filas.filter(f => f[0] === otra.id);
    expect(deOtra).toHaveLength(1);
    expect(deOtra[0]?.[2]).toBe('Otra actualizada');
  });
});
