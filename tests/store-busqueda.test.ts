import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';

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
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
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
    // El tag manual `incompleto` se fue con el rediseño: la completitud se
    // deriva al leer el .md (C05.3.1) y el filtro es de tags cualesquiera.
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
});

describe('categoriasConConteo', () => {
  it('cuenta las recetas de cada categoría', () => {
    const c = store.categoriasConConteo();
    expect(c.find(x => x.nombre === 'Carnes')!.cantidad).toBe(2);
    expect(c.find(x => x.nombre === 'Postres')!.cantidad).toBe(1);
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
    await abrirDeNuevo();
    const tags = store.tagsDe('Carnes');
    // zapallo aparece 3 veces, es el primero aunque alfabéticamente viene después que 'horno'
    expect(tags[0].tag).toBe('zapallo');
    expect(tags[0].cantidad).toBe(3);
  });
});
