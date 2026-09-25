import { describe, it, expect } from 'vitest';
import { crearStore, recetasMovidasEn } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso, recetaFalsa, imagenesFalsas } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { parse } from '../src/recipe.js';
import { linkDeFoto } from '../src/fotos-receta.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

const fila = (id: string, titulo: string, categoria: string, carpeta: string): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', '', '', '', '', '1000'];

/**
 * Pastas (c1) con dos recetas, Aves (c2) con una, y una suelta en la raíz. La
 * columna categoria de r1 dice un nombre viejo a propósito.
 */
async function abierta() {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Pastas', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'pastas', foto: 'catalogo:pastas' } },
    { id: 'c2', name: 'Aves', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'aves', foto: 'catalogo:aves' } },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'r1.md', parents: ['c1'] }, { id: 'r2', name: 'r2.md', parents: ['c2'] },
    { id: 'r3', name: 'r3.md', parents: ['c1'] }, { id: 'r4', name: 'r4.md', parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [
    [...COLUMNAS],
    fila('r1', 'Ñoquis', 'Nombre viejo', 'c1'),
    fila('r2', 'Pollo', 'Aves', 'c2'),
    fila('r3', 'Lasaña', 'Pastas', 'c1'),
    fila('r4', 'Suelta', 'Sin categoría', 'raiz')
  ]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Pastas', 'pastas', 'catalogo:pastas'], ['c2', 'Aves', 'aves', 'catalogo:aves']
  ]);
  const indiceLocal = indiceLocalFalso();
  const imagenes = imagenesFalsas();
  const store = crearStore({ drive, sheets, indiceLocal, imagenes });
  await store.arrancar();
  await store.cargarIndice();
  drive._store.get('i1')!.modifiedTime = '2026-09-13T11:00:00.000Z';
  return { drive, sheets, indiceLocal, store, imagenes };
}

/** Las filas de la copia apuntan a las de la planilla, en las dos hojas. */
async function copiaCoincide(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const recetas = await sheets.leer('i1', 'recetas!A1:L100');
  expect(copia!.filas).toHaveLength(recetas.length - 1);
  for (const { fila: nro, entrada } of copia!.filas) expect(recetas[nro - 1]?.[0]).toBe(entrada.id_archivo);
  const categorias = await sheets.leer('i1', 'categorias!A1:D100');
  expect(copia!.categorias.map(c => c.id)).toEqual(categorias.slice(1).map(f => f[0]));
}

describe('el nombre de la categoría de cada receta', () => {
  it('sale de la carpeta, no de la columna', async () => {
    const { store } = await abierta();
    expect(store.entradas().find(e => e.id_archivo === 'r1')?.categoria).toBe('Pastas');
    expect(store.entradas().find(e => e.id_archivo === 'r4')?.categoria).toBe('Sin categoría');
  });

  it('también al abrir desde la copia', async () => {
    const primera = await abierta();
    const store = crearStore({ drive: primera.drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal });
    primera.drive._store.get('i1')!.modifiedTime = primera.indiceLocal.actual()!.modifiedTime;
    await store.arrancar();
    await store.cargarIndice();
    expect(store.entradas().find(e => e.id_archivo === 'r1')?.categoria).toBe('Pastas');
  });

  it('una receta con una carpeta que no es categoría queda Sin categoría', async () => {
    const { sheets } = await abierta();
    sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r9', 'Rara', 'Vieja', 'borrada')]);
    const otra = crearStore({ drive: driveFalso([]), sheets, indiceLocal: indiceLocalFalso() });
    otra._ctx.indiceId = 'i1';
    await otra.cargarIndice();
    expect(otra.entradas()[0]?.categoria).toBe('Sin categoría');
  });
});

describe('crear una categoría', () => {
  it('crea la carpeta en la raíz con sus propiedades, agrega la fila y la copia coincide', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '' });
    expect(drive._store.get(c.id)).toMatchObject({ name: 'Fiambres', mimeType: CARPETA, parents: ['raiz'] });
    expect(drive._store.get(c.id)?.appProperties).toEqual({ color: 'bebidas', foto: '' });
    expect(store.categorias().map(x => x.nombre)).toContain('Fiambres');
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('«Sin categoría» no se puede crear, y no toca Drive', async () => {
    const { store, drive } = await abierta();
    const antes = drive._store.size;
    await expect(store.crearCategoria({ nombre: 'sin categoria', color: 'aves', foto: '' }))
      .rejects.toThrow('Ese nombre es el de las recetas sin categoría.');
    expect(drive._store.size).toBe(antes);
  });

  it('un nombre repetido no toca Drive', async () => {
    const { store, drive } = await abierta();
    const antes = drive._store.size;
    await expect(store.crearCategoria({ nombre: 'pastas', color: 'aves', foto: '' })).rejects.toThrow('Ya hay una categoría con ese nombre.');
    expect(drive._store.size).toBe(antes);
  });
});

describe('editar una categoría', () => {
  it('renombra la carpeta, reescribe sólo su fila, y las recetas muestran el nombre nuevo', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const escriturasAntes = sheets.escrituras.length;
    await store.editarCategoria('c1', { nombre: 'Pastas frescas', color: 'pastas', foto: 'catalogo:pastas' });

    expect(drive._store.get('c1')?.name).toBe('Pastas frescas');
    const nuevas = sheets.escrituras.slice(escriturasAntes);
    expect(nuevas.map(e => e.hoja)).toEqual(['categorias']);
    expect(store.entradas().filter(e => e.carpeta_id === 'c1').map(e => e.categoria)).toEqual(['Pastas frescas', 'Pastas frescas']);
    expect(indiceLocal.actual()?.filas.find(f => f.entrada.id_archivo === 'r1')?.entrada.categoria).toBe('Pastas frescas');
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('sin cambiar el nombre no renombra; sin cambiar color ni foto no escribe propiedades', async () => {
    const { store, drive } = await abierta();
    drive.llamadas.length = 0;
    await store.editarCategoria('c1', { nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' });
    expect(drive.llamadas.filter(l => l[0] === 'propiedades')).toEqual([]);
    drive.llamadas.length = 0;
    await store.editarCategoria('c1', { nombre: 'Pastas', color: 'aves', foto: 'catalogo:pastas' });
    expect(drive.llamadas.filter(l => l[0] === 'propiedades')).toEqual([['propiedades', 'c1', { color: 'aves', foto: 'catalogo:pastas' }]]);
  });

  it('no se puede renombrar a «Sin categoría»', async () => {
    const { store, drive } = await abierta();
    await expect(store.editarCategoria('c1', { nombre: 'Sin Categoría', color: 'pastas', foto: '' }))
      .rejects.toThrow('Ese nombre es el de las recetas sin categoría.');
    expect(drive._store.get('c1')?.name).toBe('Pastas');
  });

  it('su propio nombre no cuenta como repetido; el de otra sí', async () => {
    const { store } = await abierta();
    await expect(store.editarCategoria('c1', { nombre: 'PASTAS', color: 'pastas', foto: '' })).resolves.toBeUndefined();
    await expect(store.editarCategoria('c1', { nombre: 'Aves', color: 'pastas', foto: '' })).rejects.toThrow('Ya hay una categoría');
  });
});

describe('borrar una categoría', () => {
  const NOQUIS = `---\ntitulo: Ñoquis\ntags: [favorito]\n---\n\n## Preparación\n1. Amasar\n\n## Fotos\n- 1: ${linkDeFoto('fv')}\n`;

  it('sus recetas pasan a _sin-categoria/ con el tag borrador, y después la carpeta va a la papelera', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    drive._store.set('fv', { id: 'fv', name: 'noquis-1.jpg', mimeType: 'image/jpeg', parents: ['raiz'] });
    drive._store.get('r1')!.contenido = NOQUIS;
    drive._store.get('r3')!.contenido = '---\ntitulo: Lasaña\n---\n\n## Preparación\n1. Armar\n';
    const orden: string[] = [];
    const mover = drive.mover.bind(drive);
    drive.mover = async (id: string, donde: { de: string; a: string }) => { orden.push(`mover ${id}`); return mover(id, donde); };
    const borrar = drive.borrar.bind(drive);
    drive.borrar = async (id: string) => { orden.push(`borrar ${id}`); return borrar(id); };

    await store.borrarCategoria('c1');

    const sc = [...drive._store.values()].find(a => a.name === '_sin-categoria')!;
    expect(orden).toEqual(['mover r1', 'mover r3', 'borrar c1']);
    for (const id of ['r1', 'r3']) {
      expect(drive._store.get(id)?.parents).toEqual([sc.id]);
      expect(drive._store.get(id)?.trashed).toBeFalsy();
      expect(parse(drive._store.get(id)!.contenido!).tags).toContain('borrador');
    }
    // Las fotos se quedan: el `.md` las sigue nombrando por su id.
    expect(parse(drive._store.get('r1')!.contenido!).fotos).toEqual([{ n: 1, url: linkDeFoto('fv') }]);
    expect(parse(drive._store.get('r1')!.contenido!).tags).toContain('favorito');
    expect(drive._store.get('fv')?.trashed).toBeFalsy();
    expect(drive._store.get('c1')?.trashed).toBe(true);
    expect(store.buscar({ tags: ['borrador'] }).map(e => e.id_archivo).sort()).toEqual(['r1', 'r3']);
    expect(store.entradas().map(e => e.id_archivo).sort()).toEqual(['r1', 'r2', 'r3', 'r4']);
    expect(store.categorias().map(c => c.id)).toEqual(['c2']);
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('un .md que no se puede leer frena el borrado: la carpeta sigue estando', async () => {
    const { store, drive } = await abierta();
    drive._store.get('r1')!.contenido = NOQUIS;
    const leerTexto = drive.leerTexto.bind(drive);
    drive.leerTexto = async (id: string) => { if (id === 'r3') throw new Error('red'); return leerTexto(id); };

    await expect(store.borrarCategoria('c1')).rejects.toThrow('red');

    expect(drive._store.get('c1')?.trashed).toBeFalsy();
    expect(drive._store.get('r3')?.parents).toEqual(['c1']);
    expect(store.categorias().map(c => c.id)).toEqual(['c1', 'c2']);
  });

  it('un .md de la carpeta que no está en el índice también pasa a _sin-categoria/ con borrador', async () => {
    const { store, drive } = await abierta();
    drive._store.set('r9', { id: 'r9', name: 'r9.md', parents: ['c1'], contenido: '---\ntitulo: Subida por fuera\n---\n' });
    drive._store.set('x1', { id: 'x1', name: 'nota.txt', parents: ['c1'], contenido: 'hola' });

    await store.borrarCategoria('c1');

    const sc = [...drive._store.values()].find(a => a.name === '_sin-categoria')!;
    expect(drive._store.get('r9')?.parents).toEqual([sc.id]);
    expect(drive._store.get('r9')?.trashed).toBeFalsy();
    expect(parse(drive._store.get('r9')!.contenido!).tags).toContain('borrador');
    expect(store.buscar({ tags: ['borrador'] }).map(e => e.id_archivo)).toContain('r9');
    expect(drive._store.get('x1')?.parents).toEqual(['c1']);
    expect(drive._store.get('c1')?.trashed).toBe(true);
  });

  it('si falla después de mover alguna, la carpeta sigue estando y el error cuenta las movidas', async () => {
    const { store, drive } = await abierta();
    const actualizar = drive.actualizar.bind(drive);
    drive.actualizar = async (id: string, contenido: string) => {
      if (id === 'r3') throw new Error('red');
      return actualizar(id, contenido);
    };

    const error = await store.borrarCategoria('c1').then(() => null, (e: unknown) => e);

    expect(recetasMovidasEn(error)).toBe(1);
    expect(drive._store.get('c1')?.trashed).toBeFalsy();
    expect(drive._store.get('r3')?.parents).toEqual(['c1']);
    expect(store.categorias().map(c => c.id)).toEqual(['c1', 'c2']);
  });

  it('si falla antes de mover ninguna, el error no cuenta movidas', async () => {
    const { store, drive } = await abierta();
    drive.leerTexto = async () => { throw new Error('red'); };
    const error = await store.borrarCategoria('c1').then(() => null, (e: unknown) => e);
    expect(recetasMovidasEn(error)).toBe(0);
  });

  it('una categoría vacía no borra filas de recetas', async () => {
    const { store, sheets } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Vacía', color: 'bebidas', foto: '' });
    let llamadas = 0;
    const borrarFilas = sheets.borrarFilas.bind(sheets);
    sheets.borrarFilas = async (id: string, hojaId: number, nros: number[]) => { llamadas++; return borrarFilas(id, hojaId, nros); };
    await store.borrarCategoria(c.id);
    expect(llamadas).toBe(0);
    expect(store.categorias().map(x => x.id)).toEqual(['c1', 'c2']);
  });

  it('después de borrar, guardar otra receta escribe su fila correcta', async () => {
    const { store, sheets } = await abierta();
    await store.borrarCategoria('c1');
    await store.escribirFila(recetaFalsa({ titulo: 'Pollo al horno' }),
      { id: 'r2', nombre_archivo: 'r2.md', categoria: 'Aves', carpeta_id: 'c2', mtime: 1 });
    const recetas = await sheets.leer('i1', 'recetas!A1:L100');
    expect(recetas.filter(f => f[0] === 'r2')).toHaveLength(1);
    expect(recetas.find(f => f[0] === 'r2')?.[2]).toBe('Pollo al horno');
  });
});

describe('la foto propia de una categoría', () => {
  const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });

  it('crear la sube a _fotos/ como categoria-<nombre>.jpg y la nombra drive:<id>', async () => {
    const { store, drive, imagenes } = await abierta();
    const blob = foto('x');
    const c = await store.crearCategoria({ nombre: 'Fiambres Caseros', color: 'bebidas', foto: '', fotoPropia: blob });

    const subida = [...drive._store.values()].find(a => a.name === 'categoria-fiambres-caseros.jpg')!;
    const fotos = [...drive._store.values()].find(a => a.name === '_fotos')!;
    expect(subida).toMatchObject({ parents: [fotos.id], mimeType: 'image/jpeg' });
    expect(c.foto).toBe(`drive:${subida.id}`);
    expect(drive._store.get(c.id)?.appProperties).toEqual({ color: 'bebidas', foto: `drive:${subida.id}` });
    expect(store.categorias().find(x => x.id === c.id)?.foto).toBe(`drive:${subida.id}`);
    expect(imagenes.guardadas).toEqual([[subida.id, blob]]);
  });

  it('editar con otra foto propia sube la nueva y manda la anterior a la papelera', async () => {
    const { store, drive, imagenes } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '', fotoPropia: foto('a') });
    const anterior = c.foto.slice('drive:'.length);

    await store.editarCategoria(c.id, { nombre: 'Fiambres', color: 'bebidas', foto: c.foto, fotoPropia: foto('b') });

    const nueva = store.categorias().find(x => x.id === c.id)!.foto;
    expect(nueva).toMatch(/^drive:/);
    expect(nueva).not.toBe(c.foto);
    expect(drive._store.get(nueva.slice('drive:'.length))?.name).toBe('categoria-fiambres.jpg');
    expect(drive._store.get(anterior)?.trashed).toBe(true);
    expect(imagenes.olvidadas).toEqual([anterior]);
  });

  it('elegir una del catálogo manda la propia anterior a la papelera', async () => {
    const { store, drive } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '', fotoPropia: foto('a') });
    await store.editarCategoria(c.id, { nombre: 'Fiambres', color: 'bebidas', foto: 'catalogo:pastas' });
    expect(drive._store.get(c.foto.slice('drive:'.length))?.trashed).toBe(true);
  });

  it('editar sin tocar la foto no la manda a la papelera', async () => {
    const { store, drive } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '', fotoPropia: foto('a') });
    await store.editarCategoria(c.id, { nombre: 'Fiambres y quesos', color: 'bebidas', foto: c.foto });
    expect(drive._store.get(c.foto.slice('drive:'.length))?.trashed).toBeFalsy();
  });

  it('borrar la categoría se lleva su foto propia', async () => {
    const { store, drive, imagenes } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '', fotoPropia: foto('a') });
    await store.borrarCategoria(c.id);
    const id = c.foto.slice('drive:'.length);
    expect(drive._store.get(id)?.trashed).toBe(true);
    expect(imagenes.olvidadas).toEqual([id]);
  });
});

describe('recetasDe', () => {
  it('las entradas de una categoría', async () => {
    const { store } = await abierta();
    expect(store.recetasDe('c1').map(e => e.titulo).sort()).toEqual(['Lasaña', 'Ñoquis']);
  });
});
