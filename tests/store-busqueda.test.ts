import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const fila = (id: string, titulo: string, categoria: string, carpeta: string,
              tags: string, ingredientes: string, dificultad = ''): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', dificultad, '', tags, ingredientes, '1000'];

let store: ReturnType<typeof crearStore>;
let sheets: SheetsFalso;
let drive: DriveFalso;

beforeEach(async () => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
  await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
  await sheets.append('i1', 'recetas', [
    fila('r1', 'Milanesas napolitanas', 'Carnes', 'c1', 'horno|rápido', 'muzzarella|nalga', 'fácil'),
    fila('r2', 'Bife de chorizo', 'Carnes', 'c1', 'parrilla', 'bife', 'fácil'),
    fila('r3', 'Flan casero', 'Postres', 'c2', 'dulce', 'huevo|leche', 'media')
  ]);
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes'], ['c2', 'Postres', 'postres', 'catalogo:postres']
  ]);
  store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();
});

/**
 * Filas escritas por fuera de la app se ven al abrirla de nuevo: una apertura
 * sin la copia local de la anterior, que las lee de la planilla.
 */
async function abrirDeNuevo(): Promise<void> {
  store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();
}

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

  it('el filtro por tag no conoce ningún tag en particular', () => {
    // La completitud se deriva al leer el .md (C05.3.1), y el filtro es de
    // tags cualesquiera.
    expect(store.buscar({ tags: ['dulce'] }).map(e => e.id_archivo)).toEqual(['r3']);
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

  it('filtra por el tag especial aunque la fila tenga la forma vieja', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta a medio hacer', 'Postres', 'c2', 'incompleta', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.buscar({ tags: ['borrador'] }).map(e => e.id_archivo)).toEqual(['r4']);
  });

  it('sin pedirlo, un borrador no aparece en ningún resultado: a los borradores se llega por el menú', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta a medio hacer', 'Postres', 'c2', 'borrador', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.buscar({}).map(e => e.id_archivo)).not.toContain('r4');
    expect(store.buscar({ texto: 'torta' }).map(e => e.id_archivo)).not.toContain('r4');
    expect(store.buscar({ categoria: 'Postres' }).map(e => e.id_archivo)).not.toContain('r4');
  });

  it('pidiendo el tag borrador, sí lo devuelve, en cualquiera de sus formas', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta a medio hacer', 'Postres', 'c2', 'Borradores', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.buscar({ tags: ['incompleta'] }).map(e => e.id_archivo)).toEqual(['r4']);
  });
});

describe('una receta en _sin-categoria/ sin el tag borrador', () => {
  beforeEach(async () => {
    drive._store.set('sc', { id: 'sc', name: '_sin-categoria', mimeType: CARPETA, parents: ['raiz'] });
    await sheets.append('i1', 'meta', [['carpeta_sin_categoria', 'sc']]);
    await sheets.append('i1', 'recetas', [
      fila('r5', 'Guiso perdido', 'Sin categoría', 'sc', 'invierno|favorito', 'lentejas'),
      fila('r6', 'Pan a medio hacer', 'Sin categoría', 'sc', 'borrador', 'harina')
    ]);
    await abrirDeNuevo();
  });

  it('no aparece en buscar, ni pidiendo sus tags', () => {
    expect(store.buscar().map(e => e.id_archivo)).not.toContain('r5');
    expect(store.buscar({ texto: 'guiso' })).toHaveLength(0);
    expect(store.buscar({ tags: ['invierno'] }).map(e => e.id_archivo)).not.toContain('r5');
    expect(store.buscar({ tags: ['favorito'] }).map(e => e.id_archivo)).not.toContain('r5');
  });

  it('no aparece en buscarPorTexto por título, ingrediente ni tag', () => {
    for (const q of ['guiso', 'lentejas', 'invierno']) {
      const { porNombre, porIngrediente, porTag } = store.buscarPorTexto(q);
      expect(porNombre.map(e => e.id_archivo)).not.toContain('r5');
      expect(porIngrediente.map(c => c.entrada.id_archivo)).not.toContain('r5');
      expect(porTag.map(c => c.entrada.id_archivo)).not.toContain('r5');
    }
  });

  it('sus tags no cuentan en tagsDe', () => {
    expect(store.tagsDe().map(t => t.tag)).not.toContain('invierno');
    expect(store.tagsDe().map(t => t.tag)).not.toContain('favorito');
  });

  it('un borrador de _sin-categoria/ sí aparece pidiendo el tag borrador', () => {
    expect(store.buscar({ tags: ['borrador'] }).map(e => e.id_archivo)).toEqual(['r6']);
  });
});

describe('una receta suelta en la carpeta base sin el tag borrador', () => {
  beforeEach(async () => {
    await sheets.append('i1', 'recetas', [
      fila('r7', 'Guiso suelto', 'Sin categoría', 'raiz', 'otoño|favorito', 'porotos'),
      fila('r8', 'Pan suelto', 'Sin categoría', 'raiz', 'borrador', 'harina')
    ]);
    await abrirDeNuevo();
  });

  it('no aparece en buscar, ni pidiendo sus tags', () => {
    expect(store.buscar().map(e => e.id_archivo)).not.toContain('r7');
    expect(store.buscar({ tags: ['otoño'] })).toHaveLength(0);
    expect(store.buscar({ tags: ['favorito'] }).map(e => e.id_archivo)).not.toContain('r7');
  });

  it('no aparece en buscarPorTexto por título, ingrediente ni tag', () => {
    for (const q of ['guiso', 'porotos', 'otoño']) {
      const { porNombre, porIngrediente, porTag } = store.buscarPorTexto(q);
      expect([...porNombre, ...porIngrediente.map(c => c.entrada), ...porTag.map(c => c.entrada)].map(e => e.id_archivo)).not.toContain('r7');
    }
  });

  it('sus tags no cuentan en tagsDe', () => {
    expect(store.tagsDe().map(t => t.tag)).not.toContain('otoño');
  });

  it('un borrador suelto en la carpeta base sí aparece pidiendo el tag borrador', () => {
    expect(store.buscar({ tags: ['borrador'] }).map(e => e.id_archivo)).toEqual(['r8']);
  });
});

describe('buscarPorTexto: los tres criterios', () => {
  beforeEach(async () => {
    // Un fixture propio: lo que importa acá es que el mismo texto coincida por
    // título, por ingrediente y por tag, y en recetas distintas.
    await sheets.append('i1', 'recetas', [
      fila('f-filet', 'Filet de merluza a la romana', 'Carnes', 'c1', 'frito', 'Merluza o pescadilla|Pan rallado'),
      fila('f-gratin', 'Gratin de papas', 'Carnes', 'c1', 'horno', 'Merluza o pescadilla|Papa'),
      fila('f-caballa', 'Caballa a la sidra', 'Carnes', 'c1', 'merluza', 'Caballa'),
      fila('f-pure', 'Puré de papas', 'Carnes', 'c1', '', 'Papa|Leche')
    ]);
    await abrirDeNuevo();
  });

  it('busca en título, ingredientes y tags, y separa los tres grupos', () => {
    const g = store.buscarPorTexto('merluza');
    expect(g.porNombre.map(e => e.titulo)).toEqual(['Filet de merluza a la romana']);
    expect(g.porIngrediente[0]?.motivo).toBe('tiene Merluza o pescadilla');
    expect(g.porTag).toHaveLength(1);
  });

  it('no distingue mayúsculas ni acentos, en los dos sentidos', () => {
    expect(store.buscarPorTexto('PURE').porNombre.map(e => e.titulo)).toContain('Puré de papas');
    expect(store.buscarPorTexto('puré').porNombre.map(e => e.titulo)).toContain('Puré de papas');
  });

  it('una receta que coincide por dos criterios aparece en los dos grupos', () => {
    const g = store.buscarPorTexto('merluza');
    const enNombre = g.porNombre.some(e => e.id_archivo === 'f-filet');
    const enIngrediente = g.porIngrediente.some(r => r.entrada.id_archivo === 'f-filet');
    expect(enNombre && enIngrediente).toBe(true);
  });

  it('el motivo cita el ingrediente tal como está escrito', () => {
    expect(store.buscarPorTexto('merluza').porIngrediente[0]?.motivo).toContain('Merluza o pescadilla');
  });

  it('el motivo del tag lo nombra como tag', () => {
    expect(store.buscarPorTexto('merluza').porTag[0]?.motivo).toBe('tiene tag merluza');
  });

  it('no busca en la descripción, en los pasos ni en las notas', () => {
    // Nada de eso está en la fila del índice: buscar mil recetas no lee mil .md.
    expect(store.buscarPorTexto('domingos').porNombre).toHaveLength(0);
  });

  it('la caja vacía no devuelve nada', () => {
    expect(store.buscarPorTexto('')).toEqual({ porNombre: [], porIngrediente: [], porTag: [] });
  });

  it('no lanza con argumentos inválidos', () => {
    expect(store.buscarPorTexto(null)).toEqual({ porNombre: [], porIngrediente: [], porTag: [] });
    expect(() => store.buscarPorTexto(42)).not.toThrow();
  });

  it('no devuelve un borrador en ningún grupo, ni el tag borrador como motivo', async () => {
    await sheets.append('i1', 'recetas', [
      fila('f-borrador', 'Merluza a medio hacer', 'Carnes', 'c1', 'borrador', 'Merluza')
    ]);
    await abrirDeNuevo();
    const g = store.buscarPorTexto('merluza');
    expect(g.porNombre.map(e => e.id_archivo)).not.toContain('f-borrador');
    expect(g.porIngrediente.map(r => r.entrada.id_archivo)).not.toContain('f-borrador');
    expect(store.buscarPorTexto('borrador').porTag).toEqual([]);
  });
});

describe('categoriasConConteo', () => {
  it('cuenta las recetas de cada categoría', () => {
    const c = store.categoriasConConteo();
    expect(c.find(x => x.nombre === 'Carnes')!.cantidad).toBe(2);
    expect(c.find(x => x.nombre === 'Postres')!.cantidad).toBe(1);
  });

  it('no muestra Sin categoría cuando la raíz está vacía', () => {
    expect(store.categoriasConConteo().some(c => c.nombre === 'Sin categoría')).toBe(false);
  });

  it('no muestra Sin categoría aunque haya recetas sueltas: a los borradores se llega por el menú', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Suelta', 'Sin categoría', 'raiz', 'borrador', 'harina'),
      fila('r5', 'Otra suelta', 'Sin categoría', 'sin-cat', 'borrador', 'harina')
    ]);
    await abrirDeNuevo();
    const c = store.categoriasConConteo();
    expect(c.map(x => x.nombre)).toEqual(['Carnes', 'Postres']);
  });

  it('no cuenta una receta de la categoría marcada como borrador', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'A medio hacer', 'Carnes', 'c1', 'borrador', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.categoriasConConteo().find(x => x.nombre === 'Carnes')!.cantidad).toBe(2);
  });
});

describe('tagsDe', () => {
  it('ordena por frecuencia descendente, y a igual frecuencia, alfabéticamente', () => {
    // En Carnes los tres tienen frecuencia 1, así que el orden es alfabético.
    expect(store.tagsDe('recetas', 'Carnes').map(t => t.tag)).toEqual(['horno', 'parrilla', 'rápido']);
  });

  it('no lista borrador en ninguna de sus formas: a los borradores se llega por el menú', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta', 'Postres', 'c2', 'borrador|dulce', 'harina'),
      fila('r5', 'Budín', 'Postres', 'c2', 'incompleta', 'harina'),
      fila('r6', 'Tarta', 'Postres', 'c2', 'Borradores|probar', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.tagsDe('todas').map(t => t.tag)).toEqual(['dulce', 'horno', 'parrilla', 'probar', 'rápido']);
    expect(store.tagsDe('borradores').map(t => t.tag)).toEqual(['dulce', 'probar']);
  });

  it('cuenta lo mismo que la lista que abre el chip: sin los borradores', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta', 'Postres', 'c2', 'borrador|dulce', 'harina'),
      fila('r5', 'Tarta', 'Postres', 'c2', 'incompleta|probar', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.tagsDe()).toEqual(store.tagsDe('recetas'));
    expect(store.tagsDe().find(t => t.tag === 'dulce')?.cantidad).toBe(store.buscar({ tags: ['dulce'] }).length);
    expect(store.tagsDe().map(t => t.tag)).not.toContain('probar');
    expect(store.tagsDe('recetas', 'Postres')).toEqual([{ tag: 'dulce', cantidad: 1 }]);
  });

  it('en Borradores cuenta sólo los borradores, con o sin categoría', async () => {
    drive._store.set('sc', { id: 'sc', name: '_sin-categoria', mimeType: CARPETA, parents: ['raiz'] });
    await sheets.append('i1', 'meta', [['carpeta_sin_categoria', 'sc']]);
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Torta', 'Postres', 'c2', 'borrador|dulce', 'harina'),
      fila('r5', 'Pan', 'Sin categoría', 'sc', 'borrador|dulce|horno', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.tagsDe('borradores')).toEqual([{ tag: 'dulce', cantidad: 2 }, { tag: 'horno', cantidad: 1 }]);
  });

  it('las sugerencias del editor juntan los tags de recetas y borradores', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Tarta', 'Postres', 'c2', 'borrador|probar', 'harina')
    ]);
    await abrirDeNuevo();
    expect(store.tagsDe('todas').map(t => t.tag)).toContain('probar');
  });

  it('prioriza frecuencia sobre orden alfabético', async () => {
    await sheets.append('i1', 'recetas', [
      fila('r4', 'Ensalada de zapallo', 'Carnes', 'c1', 'zapallo', 'zapallo', 'fácil'),
      fila('r5', 'Zapallo relleno', 'Carnes', 'c1', 'zapallo', 'zapallo', 'media'),
      fila('r6', 'Zapallo gratinado', 'Carnes', 'c1', 'zapallo', 'zapallo', 'media'),
      fila('r7', 'Asado', 'Carnes', 'c1', 'asado', 'carne', 'media')
    ]);
    await abrirDeNuevo();
    const tags = store.tagsDe('recetas', 'Carnes');
    // zapallo aparece 3 veces: va primero aunque 'h' < 'z'.
    expect(tags[0].tag).toBe('zapallo');
    expect(tags[0].cantidad).toBe(3);
  });
});
