// Las herramientas de escritura del MCP contra los dobles de Drive y Sheets:
// escriben el `.md` y su fila con el store de la app, y no escriben lo que no
// pasa la validación.
import { describe, it, expect, beforeEach } from 'vitest';
import { crearRecetario } from '../mcp/recetario.js';
import { crearStore } from '../src/store.js';
import { parse, slugArchivo } from '../src/recipe.js';
import { linkDeFoto } from '../src/fotos-receta.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

const fila = (id: string, titulo: string, categoria: string, carpeta: string): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', '', '', '', '', '1000', ''];

/** Una receta vieja: una clave y una sección que la app no conoce, y dos fotos en `_fotos/`. */
const MD_FLAN = [
  '---',
  'titulo: Flan casero',
  'origen: la abuela',
  'foto: foto:1',
  '---',
  '',
  '## Ingredientes',
  '',
  '- huevos — 6',
  '',
  '## Preparación',
  '',
  '1. Batir. ![](foto:2)',
  '',
  '## Maridaje',
  '',
  'Un oporto.',
  '',
  '## Fotos',
  '',
  `- 1: ${linkDeFoto('f1')}`,
  `- 2: ${linkDeFoto('f2')}`,
  ''
].join('\n');

const md = (titulo: string, extra = ''): string =>
  `---\ntitulo: ${titulo}\n${extra}---\n\n## Ingredientes\n\n- harina — 500 g\n`;

let drive: DriveFalso;
let sheets: SheetsFalso;

beforeEach(() => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r3', name: 'r3.md', parents: ['c2'], contenido: MD_FLAN },
    { id: 'f1', name: 'flan-1.jpg', mimeType: 'image/jpeg', parents: ['fotos'] },
    { id: 'f2', name: 'flan-2.jpg', mimeType: 'image/jpeg', parents: ['fotos'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r3', 'Flan casero', 'Postres', 'c2')]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_fotos', 'fotos']]);
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes'], ['c2', 'Postres', 'postres', 'catalogo:postres']
  ]);
});

const nuevoRecetario = () => crearRecetario({ drive, sheets, auth: { olvidar: () => {} } });

/** Lo que ve la app al abrir: el índice leído de la planilla. */
async function indiceDeLaApp() {
  const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();
  return store.entradas();
}

const archivo = (id: string) => drive._store.get(id);

describe('crear', () => {
  it('escribe el .md en la categoría y su fila, y devuelve el id y el nombre de archivo', async () => {
    const r = await nuevoRecetario().crear({ md: md('Pan casero'), categoria: 'Postres' });
    expect(r).toMatchObject({ escrita: true, nombre_archivo: 'pan-casero.md', problemas: [] });
    if (!r.escrita) return;
    expect(archivo(r.id)?.parents).toEqual(['c2']);
    expect(parse(archivo(r.id)?.contenido).titulo).toBe('Pan casero');
    const entrada = (await indiceDeLaApp()).find(e => e.id_archivo === r.id);
    expect(entrada).toMatchObject({ titulo: 'Pan casero', categoria: 'Postres', carpeta_id: 'c2', nombre_archivo: 'pan-casero.md' });
  });

  it('sin categoría va a _sin-categoria/, que se crea con la primera', async () => {
    const r = await nuevoRecetario().crear({ md: md('Pan casero') });
    if (!r.escrita) throw new Error('no se escribió');
    const padre = archivo(r.id)?.parents?.[0] ?? '';
    expect(archivo(padre)?.name).toBe('_sin-categoria');
    expect((await indiceDeLaApp()).find(e => e.id_archivo === r.id)?.carpeta_id).toBe(padre);
  });

  it('«Sin categoría» por nombre es lo mismo que ninguna', async () => {
    const r = await nuevoRecetario().crear({ md: md('Pan casero'), categoria: 'sin categoria' });
    if (!r.escrita) throw new Error('no se escribió');
    expect(archivo(archivo(r.id)?.parents?.[0] ?? '')?.name).toBe('_sin-categoria');
  });

  it('la categoría se compara sin mayúsculas ni tildes', async () => {
    drive._store.set('c3', { id: 'c3', name: 'Panadería', mimeType: CARPETA, parents: ['raiz'] });
    sheets.cargar('i1', 'categorias', [
      [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', ''], ['c2', 'Postres', 'postres', ''], ['c3', 'Panadería', 'panes', '']
    ]);
    const r = await nuevoRecetario().crear({ md: md('Pan casero'), categoria: 'PANADERIA' });
    if (!r.escrita) throw new Error('no se escribió');
    expect(archivo(r.id)?.parents).toEqual(['c3']);
  });

  it.each(['Postre', 'Dulces'])('una categoría que no existe («%s») falla con las que sí, sin crear nada', async categoria => {
    const error = await nuevoRecetario().crear({ md: md('Pan casero'), categoria }).catch((e: unknown) => e);
    expect((error as Error).message).toContain(`«${categoria}»`);
    expect((error as Error).message).toContain('Carnes, Postres');
    expect(drive.cuantas('crear')).toBe(0);
    expect(sheets.cuantas('escribir') + sheets.cuantas('append')).toBe(0);
  });

  it('con errores de validación no escribe nada y los devuelve', async () => {
    const r = await nuevoRecetario().crear({ md: md('Pan casero', 'tiempo: 20 minutos\n'), categoria: 'Postres' });
    expect(r.escrita).toBe(false);
    expect(r.problemas).toEqual([expect.objectContaining({ campo: 'tiempo', nivel: 'error' })]);
    expect(drive.cuantas('crear')).toBe(0);
    expect(sheets.cuantas('escribir') + sheets.cuantas('append')).toBe(0);
  });

  it('con avisos escribe igual y los devuelve', async () => {
    const r = await nuevoRecetario().crear({ md: md('Pan casero', 'origen: la abuela\n'), categoria: 'Postres' });
    expect(r.escrita).toBe(true);
    expect(r.problemas).toEqual([expect.objectContaining({ campo: 'origen', nivel: 'aviso' })]);
    if (r.escrita) expect(archivo(r.id)?.contenido).toContain('origen: la abuela');
  });

  it('limpia el .md como Pegar: CRLF y bloque de código', async () => {
    const r = await nuevoRecetario().crear({ md: '```markdown\r\n' + md('Pan casero').replace(/\n/g, '\r\n') + '```', categoria: 'Postres' });
    if (!r.escrita) throw new Error('no se escribió');
    expect(archivo(r.id)?.contenido).not.toContain('\r');
    expect(archivo(r.id)?.contenido).not.toContain('```');
  });

  it('dos recetas con el mismo título en la misma categoría: la segunda sale con sufijo y ninguna pisa a la otra', async () => {
    const recetario = nuevoRecetario();
    const a = await recetario.crear({ md: md('Pan casero'), categoria: 'Postres' });
    const b = await recetario.crear({ md: md('Pan casero', 'rinde: 2 panes\n'), categoria: 'Postres' });
    if (!a.escrita || !b.escrita) throw new Error('no se escribió');
    expect(a.nombre_archivo).toBe('pan-casero.md');
    expect(b.nombre_archivo).toBe('pan-casero-2.md');
    expect(a.id).not.toBe(b.id);
    expect(parse(archivo(a.id)?.contenido).rinde).toBeNull();
    expect(parse(archivo(b.id)?.contenido).rinde).toBe('2 panes');
    const panes = (await indiceDeLaApp()).filter(e => e.titulo === 'Pan casero');
    expect(panes.map(e => e.nombre_archivo).sort()).toEqual(['pan-casero-2.md', 'pan-casero.md']);
  });

  it('un lote que se corta en la tercera de cinco deja escritas las dos primeras y ninguna a medias', async () => {
    const recetario = nuevoRecetario();
    drive.fallar(`crear:${slugArchivo('Receta 3')}`, new TypeError('fetch failed'));
    const escritas: string[] = [];
    let error: unknown = null;
    for (const n of [1, 2, 3, 4, 5]) {
      try {
        const r = await recetario.crear({ md: md(`Receta ${n}`), categoria: 'Carnes' });
        if (r.escrita) escritas.push(r.id);
      } catch (e) {
        error = e;
        break;
      }
    }
    expect(error).not.toBeNull();
    expect(escritas).toHaveLength(2);
    const enCarnes = [...drive._store.values()].filter(a => a.parents?.includes('c1')).map(a => parse(a.contenido).titulo);
    expect(enCarnes.sort()).toEqual(['Receta 1', 'Receta 2']);
    const filas = (await indiceDeLaApp()).filter(e => e.categoria === 'Carnes').map(e => e.titulo);
    expect(filas.sort()).toEqual(['Receta 1', 'Receta 2']);
  });

  it('ignora la sección ## Fotos del .md: el depósito lo arma el MCP', async () => {
    const conFotos = md('Pan casero') + `\n## Fotos\n\n- 1: ${linkDeFoto('f1')}\n`;
    const r = await nuevoRecetario().crear({ md: conFotos, categoria: 'Postres' });
    if (!r.escrita) throw new Error('no se escribió');
    expect(parse(archivo(r.id)?.contenido).fotos).toEqual([]);
    expect(archivo(r.id)?.contenido).not.toContain('## Fotos');
  });

  it('una referencia a una foto que no está en el depósito es error, con los números que hay', async () => {
    const conFotos = md('Pan casero', 'foto: foto:1\n') + `\n## Fotos\n\n- 1: ${linkDeFoto('f1')}\n`;
    const r = await nuevoRecetario().crear({ md: conFotos, categoria: 'Postres' });
    expect(r.escrita).toBe(false);
    expect(r.problemas).toEqual([expect.objectContaining({ campo: 'foto', nivel: 'error' })]);
    expect(r.problemas[0]?.mensaje).toContain('El depósito está vacío.');
    expect(drive.cuantas('crear')).toBe(0);
  });

  it('con fotos pedidas no escribe: todavía no se suben', async () => {
    const error = await nuevoRecetario().crear({
      md: md('Pan casero', 'foto: foto:1\n'), categoria: 'Postres', fotos: [{ origen: '/tmp/pan.jpg', uso: 'plato' }]
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(drive.cuantas('crear')).toBe(0);
  });
});

describe('guardar', () => {
  const corregido = MD_FLAN.replace('- huevos — 6', '- huevos — 8');

  it('relee la receta de Drive antes de escribir, y escribe el .md y la fila', async () => {
    const recetario = nuevoRecetario();
    const r = await recetario.guardar({ id: 'r3', md: corregido.replace('Flan casero', 'Flan de la abuela') });
    expect(r).toMatchObject({ escrita: true, id: 'r3' });
    const lecturas = drive.llamadas.filter(l => l[0] === 'leerTexto' || l[0] === 'actualizar').map(l => l[0]);
    expect(lecturas).toEqual(['leerTexto', 'actualizar']);
    expect(archivo('r3')?.contenido).toContain('- huevos — 8');
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')?.titulo).toBe('Flan de la abuela');
  });

  it('conserva las claves y las secciones desconocidas', async () => {
    await nuevoRecetario().guardar({ id: 'r3', md: corregido });
    const escrito = archivo('r3')?.contenido ?? '';
    expect(escrito).toContain('origen: la abuela');
    expect(escrito).toContain('## Maridaje');
    expect(escrito).toContain('Un oporto.');
  });

  it('un .md sin ## Fotos conserva el depósito de Drive', async () => {
    const sinDeposito = corregido.replace(/\n## Fotos[\s\S]*$/, '\n');
    const r = await nuevoRecetario().guardar({ id: 'r3', md: sinDeposito });
    expect(r.escrita).toBe(true);
    expect(parse(archivo('r3')?.contenido).fotos).toEqual([
      { n: 1, url: linkDeFoto('f1') }, { n: 2, url: linkDeFoto('f2') }
    ]);
  });

  it('un ## Fotos alterado se ignora: se escribe el depósito de Drive', async () => {
    const alterado = corregido
      .replace(`- 1: ${linkDeFoto('f1')}`, '- 1: https://ejemplo.com/otra.jpg')
      .replace(`- 2: ${linkDeFoto('f2')}`, `- 2: ${linkDeFoto('de-otra-receta')}\n- 3: ${linkDeFoto('tambien-ajena')}`);
    const r = await nuevoRecetario().guardar({ id: 'r3', md: alterado });
    expect(r.escrita).toBe(true);
    expect(parse(archivo('r3')?.contenido).fotos).toEqual([
      { n: 1, url: linkDeFoto('f1') }, { n: 2, url: linkDeFoto('f2') }
    ]);
  });

  it('una referencia a un número que no está en el depósito de Drive es error, con los que hay', async () => {
    const r = await nuevoRecetario().guardar({ id: 'r3', md: corregido.replace('![](foto:2)', '![](foto:5)') });
    expect(r.escrita).toBe(false);
    const errores = r.problemas.filter(p => p.nivel === 'error');
    expect(errores).toEqual([expect.objectContaining({ campo: 'fotos' })]);
    expect(errores[0]?.mensaje).toContain('foto:5');
    expect(errores[0]?.mensaje).toContain('Hay: 1, 2.');
    expect(drive.cuantas('actualizar')).toBe(0);
  });

  it('mueve el archivo si cambia la categoría', async () => {
    await nuevoRecetario().guardar({ id: 'r3', md: corregido, categoria: 'carnes' });
    expect(archivo('r3')?.parents).toEqual(['c1']);
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')).toMatchObject({ categoria: 'Carnes', carpeta_id: 'c1' });
  });

  it('sin categoría no la mueve', async () => {
    await nuevoRecetario().guardar({ id: 'r3', md: corregido });
    expect(drive.cuantas('mover')).toBe(0);
    expect(archivo('r3')?.parents).toEqual(['c2']);
  });

  it('categoría vacía la pasa a _sin-categoria/, y de ahí vuelve a una categoría', async () => {
    const recetario = nuevoRecetario();
    await recetario.guardar({ id: 'r3', md: corregido, categoria: '' });
    const suelta = archivo('r3')?.parents?.[0] ?? '';
    expect(archivo(suelta)?.name).toBe('_sin-categoria');
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')?.carpeta_id).toBe(suelta);

    await recetario.guardar({ id: 'r3', md: corregido, categoria: 'Carnes' });
    expect(archivo('r3')?.parents).toEqual(['c1']);
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')).toMatchObject({ categoria: 'Carnes', carpeta_id: 'c1' });
  });

  it('una categoría que no existe falla sin escribir', async () => {
    const error = await nuevoRecetario().guardar({ id: 'r3', md: corregido, categoria: 'Postre' }).catch((e: unknown) => e);
    expect((error as Error).message).toContain('Carnes, Postres');
    expect(drive.cuantas('actualizar')).toBe(0);
  });

  it('saca las fotos pedidas: fuera del depósito y a la papelera', async () => {
    const sinPaso = corregido.replace(' ![](foto:2)', '');
    const r = await nuevoRecetario().guardar({ id: 'r3', md: sinPaso, sacar: [2] });
    expect(r.escrita).toBe(true);
    expect(parse(archivo('r3')?.contenido).fotos.map(f => f.n)).toEqual([1]);
    expect(drive.cuantas('borrar', 'f2')).toBe(1);
    expect(drive.cuantas('borrar', 'f1')).toBe(0);
  });

  it('un número repetido en sacar tira la foto una sola vez', async () => {
    const sinPaso = corregido.replace(' ![](foto:2)', '');
    const r = await nuevoRecetario().guardar({ id: 'r3', md: sinPaso, sacar: [2, 2] });
    expect(r.escrita).toBe(true);
    expect(drive.cuantas('borrar', 'f2')).toBe(1);
    expect(parse(archivo('r3')?.contenido).fotos.map(f => f.n)).toEqual([1]);
  });

  it('sacar una foto con URL externa la saca del depósito sin tocar Drive', async () => {
    archivo('r3')!.contenido = MD_FLAN.replace(`- 2: ${linkDeFoto('f2')}`, `- 2: ${linkDeFoto('f2')}\n- 3: https://ejemplo.com/flan.jpg`);
    const r = await nuevoRecetario().guardar({ id: 'r3', md: corregido, sacar: [3] });
    expect(r.escrita).toBe(true);
    expect(parse(archivo('r3')?.contenido).fotos.map(f => f.n)).toEqual([1, 2]);
    expect(drive.cuantas('borrar')).toBe(0);
  });

  it('no saca una foto que el .md todavía nombra', async () => {
    const r = await nuevoRecetario().guardar({ id: 'r3', md: corregido, sacar: [2] });
    expect(r.escrita).toBe(false);
    const errores = r.problemas.filter(p => p.nivel === 'error');
    expect(errores).toEqual([expect.objectContaining({ campo: 'fotos' })]);
    expect(errores[0]?.mensaje).toContain('foto:2');
    expect(errores[0]?.mensaje).toContain('Hay: 1.');
    expect(drive.cuantas('actualizar')).toBe(0);
    expect(drive.cuantas('borrar')).toBe(0);
  });

  it('no saca una foto que no está en el depósito', async () => {
    const r = await nuevoRecetario().guardar({ id: 'r3', md: corregido, sacar: [7] });
    expect(r.escrita).toBe(false);
    expect(r.problemas.filter(p => p.nivel === 'error').map(p => p.mensaje)).toEqual([expect.stringContaining('foto:7')]);
    expect(drive.cuantas('actualizar')).toBe(0);
  });

  it('con errores de validación no escribe', async () => {
    const r = await nuevoRecetario().guardar({ id: 'r3', md: corregido.replace('titulo: Flan casero\n', '') });
    expect(r.escrita).toBe(false);
    expect(r.problemas).toContainEqual(expect.objectContaining({ campo: 'titulo', nivel: 'error' }));
    expect(drive.cuantas('actualizar')).toBe(0);
  });

  it('un id que no está en el índice no se escribe', async () => {
    const error = await nuevoRecetario().guardar({ id: 'f1', md: corregido }).catch((e: unknown) => e);
    expect((error as Error).message).toContain('reindexar');
    expect(drive.cuantas('actualizar')).toBe(0);
  });
});

describe('borrar', () => {
  it('con el título exacto como confirmación manda la receta a la papelera, con su fila y sus fotos de _fotos/', async () => {
    await nuevoRecetario().borrar({ id: 'r3', confirmacion: 'Flan casero' });
    expect(drive.cuantas('borrar', 'r3')).toBe(1);
    expect(drive.cuantas('borrar', 'f1')).toBe(1);
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')).toBeUndefined();
  });

  it('sin confirmación no borra nada y dice qué título pasar', async () => {
    const error = await nuevoRecetario().borrar({ id: 'r3' }).catch((e: unknown) => e);
    expect((error as Error).message).toBe('Para borrar hay que pasar el título exacto de la receta: "Flan casero"');
    expect(drive.cuantas('borrar')).toBe(0);
    expect((await indiceDeLaApp()).find(e => e.id_archivo === 'r3')).toBeDefined();
  });

  it.each(['flan casero', 'Flan', 'Flan casero '])('con una confirmación que no coincide («%s») no borra nada', async confirmacion => {
    const error = await nuevoRecetario().borrar({ id: 'r3', confirmacion }).catch((e: unknown) => e);
    expect((error as Error).message).toBe('Para borrar hay que pasar el título exacto de la receta: "Flan casero"');
    expect(drive.cuantas('borrar')).toBe(0);
  });

  it('un id que no está en el índice no se borra', async () => {
    const error = await nuevoRecetario().borrar({ id: 'f1', confirmacion: 'flan-1.jpg' }).catch((e: unknown) => e);
    expect((error as Error).message).toContain('reindexar');
    expect(drive.cuantas('borrar')).toBe(0);
  });
});

describe('reindexar', () => {
  it('rehace el índice desde las carpetas e informa el avance', async () => {
    drive._store.set('r9', { id: 'r9', name: 'r9.md', parents: ['c1'], contenido: md('Subida a mano') });
    const avance: number[] = [];
    const r = await nuevoRecetario().reindexar(p => avance.push(p));
    expect(r.indexadas).toBe(2);
    expect(avance.length).toBeGreaterThan(0);
    expect(avance).toEqual([...avance].sort((a, b) => a - b));
    expect((await indiceDeLaApp()).map(e => e.titulo).sort()).toEqual(['Flan casero', 'Subida a mano']);
  });
});
