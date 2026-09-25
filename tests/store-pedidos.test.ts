// Cuántos pedidos a Drive y a Sheets hace cada operación del store. Cada
// prueba cuenta los pedidos a los dobles: lo que el store ya sabe no se vuelve
// a preguntar.
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { parse } from '../src/recipe.js';
import { serializePlan } from '../src/plan.js';
import { linkDeFoto } from '../src/fotos-receta.js';
import { driveFalso, sheetsFalso, indiceLocalFalso, imagenesFalsas } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-18T10:00:00.000Z';

const PAN = `---\ntitulo: Pan\n---\n\n## Fotos\n- 1: ${linkDeFoto('fv')}\n- 2: ${linkDeFoto('fw')}\n- 3: ${linkDeFoto('fx')}\n`;
const md = (titulo: string): string => `---\ntitulo: ${titulo}\n---\n`;
const fila = (id: string, titulo: string, carpeta: string): string[] =>
  [id, `${id}.md`, titulo, 'Panes', carpeta, '', '', '', '', '', '', '1000'];

/** Panes (c1) con dos recetas, una con tres fotos en `_fotos/`, y el índice abierto. */
async function abierto() {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Panes', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'panes', foto: 'catalogo:panes' } },
    { id: 'fc', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    { id: 'r1', name: 'r1.md', parents: ['c1'], contenido: PAN },
    { id: 'r2', name: 'r2.md', parents: ['c1'], contenido: md('Grisines') },
    ...['fv', 'fw', 'fx'].map(id => ({ id, name: `${id}.jpg`, mimeType: 'image/jpeg', parents: ['fc'] }))
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r1', 'Pan', 'c1'), fila('r2', 'Grisines', 'c1')]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_fotos', 'fc']]);
  sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Panes', 'panes', 'catalogo:panes']]);
  const indiceLocal = indiceLocalFalso();
  const store = crearStore({ drive, sheets, indiceLocal, imagenes: imagenesFalsas() });
  await store.arrancar();
  await store.cargarIndice();
  drive.llamadas.length = 0;
  sheets.llamadas.length = 0;
  return { drive, sheets, store, indiceLocal };
}

describe('borrar una receta', () => {
  it('con la receta ya leída no relee el .md, y sus fotos van igual a la papelera', async () => {
    const { store, drive } = await abierto();
    await store.borrar('r1', { receta: parse(PAN) });
    expect(drive.cuantas('leerTexto')).toBe(0);
    expect(['fv', 'fw', 'fx'].map(id => drive._store.get(id)?.trashed)).toEqual([true, true, true]);
  });

  it('sin la receta, la lee como siempre', async () => {
    const { store, drive } = await abierto();
    await store.borrar('r1');
    expect(drive.cuantas('leerTexto', 'r1')).toBe(1);
    expect(drive._store.get('fv')?.trashed).toBe(true);
  });

  it('las fotos se preguntan juntas y no en fila', async () => {
    const { store, drive } = await abierto();
    const metadatos = drive.metadatos.bind(drive);
    let enVuelo = 0;
    let pico = 0;
    drive.metadatos = async (id: string) => {
      enVuelo++;
      pico = Math.max(pico, enVuelo);
      await new Promise(listo => setTimeout(listo, 1));
      enVuelo--;
      return metadatos(id);
    };
    await store.borrar('r1', { receta: parse(PAN) });
    expect(pico).toBe(3);
    expect(['fv', 'fw', 'fx'].map(id => drive._store.get(id)?.trashed)).toEqual([true, true, true]);
  });

  it('pide los ids de las hojas una sola vez por sesión', async () => {
    const { store, sheets } = await abierto();
    await store.borrar('r1', { receta: parse(PAN) });
    await store.borrar('r2', { receta: parse(md('Grisines')) });
    expect(sheets.cuantas('hojas')).toBe(1);
    expect(sheets.cuantas('borrarFila')).toBe(2);
    expect(await sheets.leer('i1', 'recetas!A1:L10')).toEqual([[...COLUMNAS]]);
  });

  it('con la planilla creada en la sesión, los ids ya se conocen', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'c1', name: 'Panes', mimeType: CARPETA, parents: ['raiz'] }
    ]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();
    const { id } = await store.crear(parse(md('Pan')), { carpetaId: 'c1' });
    const hojasAlCrear = sheets.cuantas('hojas');
    await store.borrar(id, { receta: parse(md('Pan')) });
    expect(sheets.cuantas('hojas')).toBe(hojasAlCrear);
    const indice = [...drive._store.values()].find(a => a.name === '_indice')!;
    expect(await sheets.leer(indice.id, 'recetas!A1:L10')).toEqual([[...COLUMNAS]]);
  });
});

describe('la hoja meta', () => {
  it('guardarMeta escribe sin releer, y la clave queda en su fila', async () => {
    const { store, sheets } = await abierto();
    await store.guardarMeta('carpeta_fotos', 'otra');
    await store.guardarMeta('nueva', 'si');
    expect(sheets.cuantas('leer')).toBe(0);
    expect(await sheets.leer('i1', 'meta!A1:B20')).toEqual([
      ['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_fotos', 'otra'], ['nueva', 'si']
    ]);
  });

  it('reindexar no lee ninguna hoja, y deja cada clave de meta una sola vez', async () => {
    const { store, sheets } = await abierto();
    await store.reconstruir();
    expect(sheets.cuantas('leer')).toBe(0);
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    const claves = meta.map(f => f[0]);
    expect(new Set(claves).size).toBe(claves.length);
    expect(meta).toContainEqual(['schemaVersion', String(SCHEMA_VERSION)]);
    expect(meta).toContainEqual(['reconstruccion_en_curso', '']);
  });

  it('preparar una carpeta con `_indice` lee meta una vez, aunque tenga que borrar la anotación de reemplazada', async () => {
    const { store, sheets } = await abierto();
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['reemplazada', 'si']]);
    await store.prepararCarpeta({ id: 'raiz', nombre: 'Recetario' });
    expect(sheets.llamadas.filter(l => l[0] === 'leer' && l[1]?.startsWith('meta!'))).toHaveLength(1);
    expect(await sheets.leer('i1', 'meta!A1:B20')).toContainEqual(['reemplazada', '']);
  });
});

describe('reindexar', () => {
  it('vacía cada hoja de una vez sin leerla, aunque tenga filas agregadas a mano', async () => {
    const { store, sheets } = await abierto();
    sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r1', 'Pan', 'c1'), fila('r1', 'Pan', 'c1'), ['a mano'], []]);
    await store.reconstruir();
    expect(sheets.cuantas('leer')).toBe(0);
    expect(sheets.cuantas('vaciarHoja')).toBe(2);
    const recetas = await sheets.leer('i1', 'recetas!A1:L10');
    expect(recetas.slice(1).map(f => f[0]).sort()).toEqual(['r1', 'r2']);
  });

  it('preparar la carpeta lista las carpetas una sola vez', async () => {
    const { store, drive } = await abierto();
    await store.prepararCarpeta({ id: 'raiz', nombre: 'Recetario' });
    expect(drive.cuantas('listarCarpetas')).toBe(1);
    // Las predefinidas que se crearon entran al índice con su color, como la que ya estaba.
    const nombres = store.categorias().map(c => c.nombre);
    expect(nombres).toContain('Panes');
    expect(nombres).toContain('Carnes');
    expect(store.categorias().every(c => c.color && c.foto)).toBe(true);
  });
});

describe('borrar una categoría', () => {
  it('anota la fecha de `_indice` una sola vez, al terminar', async () => {
    const { store, drive } = await abierto();
    await store.borrarCategoria('c1');
    expect(drive.cuantas('metadatos', 'i1')).toBe(1);
  });

  it('si se corta a mitad, lo ya movido queda en la copia', async () => {
    const { store, drive, indiceLocal } = await abierto();
    const actualizar = drive.actualizar.bind(drive);
    drive.actualizar = async (id: string, contenido: string) => {
      if (id === 'r2') throw new Error('red');
      return actualizar(id, contenido);
    };
    await expect(store.borrarCategoria('c1')).rejects.toThrow();
    const r1 = indiceLocal.actual()?.filas.find(f => f.entrada.id_archivo === 'r1');
    expect(r1?.entrada.carpeta_id).toBe(store._ctx.sinCategoriaId);
    expect(drive.cuantas('metadatos', 'i1')).toBe(1);
  });
});

describe('el plan', () => {
  async function conPlan() {
    const r = await abierto();
    r.drive._store.set('p1', {
      id: 'p1', name: '_plan.md', parents: ['raiz'], mimeType: 'text/markdown', modifiedTime: FECHA,
      contenido: serializePlan({ comidas: [{ dia: 0, momento: 'noche', id: 'r2', titulo: 'Grisines' }] })
    });
    return r;
  }

  it('cada pedido lee el archivo, pero lo busca por nombre una sola vez', async () => {
    const { store, drive } = await conPlan();
    await store.plan();
    drive._store.get('p1')!.contenido = '';
    expect(await store.plan()).toEqual({ comidas: [] });
    expect(drive.cuantas('leerTexto', 'p1')).toBe(2);
    expect(drive.cuantas('buscarPorNombre')).toBe(1);
  });

  it('si el archivo ya no está, lo vuelve a buscar', async () => {
    const { store, drive } = await conPlan();
    await store.plan();
    drive._store.delete('p1');
    expect(await store.plan()).toEqual({ comidas: [] });
    expect(drive.cuantas('buscarPorNombre')).toBe(2);
  });
});
