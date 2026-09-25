import { describe, it, expect, beforeEach } from 'vitest';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, recetaFalsa, indiceLocalFalso, imagenesFalsas } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';
import { parse } from '../src/recipe.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { linkDeFoto } from '../src/fotos-receta.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MD = `---\ntitulo: Milanesas\n---\n\n## Notas\n- ojo\n`;

/**
 * Un Drive con la carpeta base marcada y `f1` adentro, sin fila en el índice:
 * guardar un archivo sin fila exige que esté en la carpeta del Recetario.
 */
const conRaiz = () => driveFalso([
  { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
  { id: 'f1', name: 'f1.md', parents: ['raiz'] }
]);

describe('guardar: escritura sincrónica, sin cola', () => {
  it('escribe la fila del índice en el momento, sin cola', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: conRaiz(), sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();
    const antes = sheets.escrituras.length;   // el arranque ya escribió el índice

    await store.guardar('f1', recetaFalsa({ titulo: 'Milanesas' }));

    expect(sheets.escrituras).toHaveLength(antes + 1);
    expect(sheets.escrituras.at(-1)?.valores[0]).toContain('Milanesas');
  });

  it('el guardado termina recién cuando Sheets confirmó', async () => {
    const sheets = sheetsFalso();
    let confirmado = false;
    sheets.alEscribir = async () => { await Promise.resolve(); confirmado = true; };
    const store = crearStore({ drive: conRaiz(), sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa());
    expect(confirmado).toBe(true);
  });

  it('guardar dos veces la misma receta deja una sola fila (R2)', async () => {
    const sheets = sheetsFalso();
    const store = crearStore({ drive: conRaiz(), sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('f1', recetaFalsa({ titulo: 'A' }));
    await store.guardar('f1', recetaFalsa({ titulo: 'B' }));

    expect(store.entradas().filter(e => e.id_archivo === 'f1')).toHaveLength(1);
    expect(sheets.appends).toHaveLength(1);   // el segundo reemplaza, no agrega
  });

  it('no compara el modifiedTime remoto: pisa lo que haya', async () => {
    // 'f1' remoto quedó modificado bien después de lo que el índice tiene
    // guardado como su mtime: R4 manda pisar igual.
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      { id: 'f1', name: 'f1.md', parents: ['raiz'], modifiedTime: '2030-01-01T00:00:00.000Z' }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1');
    await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
    await sheets.escribir('i1', 'meta!A1:B1', [['schemaVersion', '1']]);
    await sheets.append('i1', 'recetas', [
      ['f1', 'f1.md', 'Vieja', 'Sin categoría', 'raiz', '', '', '', '', '', '', String(Date.parse('2020-01-01T00:00:00.000Z'))]
    ]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
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
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets, indiceLocal: indiceLocalFalso() });
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
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
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
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes'], ['c2', 'Postres', 'postres', 'catalogo:postres']
  ]);
  store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
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

  it('carpetaDestino vacío mueve una receta de categoría a _sin-categoria/, creándola si falta', async () => {
    await store.guardar('r1', parse(MD), { carpetaDestino: '' });
    const carpeta = [...drive._store.values()].find(a => a.name === '_sin-categoria')!;
    expect(carpeta).toMatchObject({ mimeType: CARPETA, parents: ['raiz'] });
    expect(drive._store.get('r1')!.parents).toEqual([carpeta.id]);
    expect(store.entradas()[0]?.categoria).toBe('Sin categoría');
  });

  it('una receta sin fila en el índice se guarda con su carpeta y nombre reales', async () => {
    // 'suelta.md' vive en Carnes pero nunca tuvo fila: por ejemplo, se abrió
    // por un link directo. Sin `entrada` de dónde sacar la carpeta, caería en
    // la raíz —«Sin categoría»— y con `nombre_archivo` vacío.
    drive._store.set('suelta', {
      id: 'suelta', name: 'suelta.md', mimeType: 'text/markdown', parents: ['c1'],
      modifiedTime: '2026-01-01T00:00:00.000Z', contenido: MD
    });
    expect(store.entradas().find(e => e.id_archivo === 'suelta')).toBeUndefined();

    await store.guardar('suelta', recetaFalsa({ titulo: 'Suelta' }));

    const entrada = store.entradas().find(e => e.id_archivo === 'suelta');
    expect(entrada?.categoria).toBe('Carnes');
    expect(entrada?.nombre_archivo).toBe('suelta.md');
  });
});

describe('un archivo fuera del Recetario', () => {
  // Con el permiso `drive`, un id que llega en un link a `#/r/<id>` puede ser
  // cualquier archivo del usuario: guardar y borrar lo tienen que rechazar.
  const conAjeno = () => driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'ajeno', name: 'notas.md', parents: ['otra-carpeta'], contenido: 'mis notas' }
  ]);

  it('guardar lo rechaza sin reescribirlo', async () => {
    const drive = conAjeno();
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.arrancar();

    await expect(store.guardar('ajeno', recetaFalsa({ titulo: 'Pisada' }))).rejects.toThrow();
    expect(await drive.leerTexto('ajeno')).toBe('mis notas');
  });

  it('borrar lo rechaza sin mandarlo a la papelera', async () => {
    const drive = conAjeno();
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.arrancar();

    await expect(store.borrar('ajeno')).rejects.toThrow();
    expect(drive._store.get('ajeno')?.trashed).toBeFalsy();
  });
});

describe('crear', () => {
  it('escribe un .md con lo que le pasen, y nombre derivado del título', async () => {
    // No fuerza ningún tag: eso lo decide quien llama (el formulario).
    const r = await store.crear(recetaFalsa({ titulo: 'Ñoquis del 29', tags: ['rico'] }), { carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('noquis-del-29.md');
    const contenido = drive._store.get(r.id)!.contenido;
    expect(contenido).toContain('titulo: Ñoquis del 29');
    expect(contenido).toContain('rico');
  });

  it('sin carpeta cae en _sin-categoria/, que es la bandeja de entrada', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Suelta' }));
    const carpeta = [...drive._store.values()].find(a => a.name === '_sin-categoria')!;
    expect(drive._store.get(r.id)!.parents).toEqual([carpeta.id]);
    expect(store.entradas().find(e => e.id_archivo === r.id)!.categoria).toBe('Sin categoría');
  });

  it('_sin-categoria/ se crea con la primera receta suelta, y no otra vez con la segunda', async () => {
    await store.crear(recetaFalsa({ titulo: 'Suelta' }));
    await store.crear(recetaFalsa({ titulo: 'Otra suelta' }));
    expect([...drive._store.values()].filter(a => a.name === '_sin-categoria')).toHaveLength(1);
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    expect(meta).toContainEqual(['carpeta_sin_categoria', expect.anything()]);
  });

  it('no pisa un nombre existente', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Milanesas' }), { carpetaId: 'c1' });
    expect(r.nombre_archivo).toBe('milanesas-2.md');
  });
});

describe('borrar', () => {
  it('borra el archivo y saca la fila del índice', async () => {
    await store.borrar('r1');
    expect(drive._store.get('r1')?.trashed).toBe(true);
    expect(store.entradas()).toHaveLength(0);
  });

  it('crear y borrar no deja entrada huérfana', async () => {
    const r = await store.crear(recetaFalsa({ titulo: 'Nueva' }));
    expect(store.entradas()).toHaveLength(2);  // r1 + nueva
    await store.borrar(r.id);
    expect(drive._store.get(r.id)?.trashed).toBe(true);
    expect(store.entradas()).toHaveLength(1);  // solo r1
  });

  it('crear y borrar no deja fila fantasma en la planilla', async () => {
    // La escritura es sincrónica: no hace falta un flush aparte para que esto
    // se refleje en la planilla.
    const r = await store.crear(recetaFalsa({ titulo: 'Fantasma' }));
    await store.borrar(r.id);
    const filas = await sheets.leer('i1', 'recetas!A1:L10');
    const titulos = filas.slice(1).map(f => f[2]);
    expect(titulos).toEqual(['Milanesas']);  // solo la que existía
  });

  it('borrar una receta con fila sigue funcionando', async () => {
    await store.borrar('r1');
    expect(drive._store.get('r1')?.trashed).toBe(true);
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

describe('carpetaDestino vacío y _sin-categoria/', () => {
  it('no mueve una receta ya suelta en la raíz', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      { id: 'r9', name: 'suelta.md', parents: ['raiz'], contenido: MD }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
    await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
    await sheets.append('i1', 'recetas',
      [['r9', 'suelta.md', 'Milanesas', 'Sin categoría', 'raiz', '', '', '', '', '', '', '1000']]);
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('r9', parse(MD), { carpetaDestino: '' });

    expect(drive.llamadas.filter(l => l[0] === 'mover')).toEqual([]);
    expect(drive._store.get('r9')!.parents).toEqual(['raiz']);
  });

  it('con carpetaDestino explícito mueve una receta desde _sin-categoria/ a una categoría', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'sc', name: '_sin-categoria', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      { id: 'r9', name: 'suelta.md', parents: ['sc'], contenido: MD }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
    await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
    await sheets.append('i1', 'recetas',
      [['r9', 'suelta.md', 'Milanesas', 'Sin categoría', 'sc', '', '', '', '', '', '', '1000']]);
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_sin_categoria', 'sc']]);
    sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes']]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();

    await store.guardar('r9', parse(MD), { carpetaDestino: 'c1' });

    expect(drive._store.get('r9')!.parents).toEqual(['c1']);
    expect(store.entradas()[0]?.categoria).toBe('Carnes');
  });

  /**
   * Un archivo sin fila en el índice, en `_sin-categoria/`: `delRecetario` sólo
   * reconocía la raíz y las categorías, y lo hubiera rechazado igual que uno
   * ajeno al Recetario.
   */
  async function sueltaSinFila() {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'sc', name: '_sin-categoria', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      { id: 'suelta', name: 'suelta.md', parents: ['sc'], contenido: MD }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
    await sheets.escribir('i1', 'recetas!A1:L1', [[...COLUMNAS]]);
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_sin_categoria', 'sc']]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.cargarIndice();
    return { drive, store };
  }

  it('guardar acepta un id sin fila que está en _sin-categoria/', async () => {
    const { store, drive } = await sueltaSinFila();
    await store.guardar('suelta', recetaFalsa({ titulo: 'Suelta' }));
    expect(drive._store.get('suelta')?.contenido).toContain('Suelta');
    expect(store.entradas().find(e => e.id_archivo === 'suelta')?.categoria).toBe('Sin categoría');
  });

  it('borrar acepta un id sin fila que está en _sin-categoria/', async () => {
    const { store, drive } = await sueltaSinFila();
    await store.borrar('suelta');
    expect(drive._store.get('suelta')?.trashed).toBe(true);
  });
});

describe('guardar y crear con fotos', () => {
  const foto = (texto: string): Blob => new Blob([texto], { type: 'image/jpeg' });
  const PAN = `---\ntitulo: Pan de campo\n---\n\n## Preparación\n1. Amasar\n\n## Fotos\n- 1: ${linkDeFoto('fv')}\n`;

  /**
   * Un Recetario con `_fotos/` (fc), una receta con una foto en `_fotos/` y
   * una foto ajena en otra carpeta. `conCarpetaFotos: false` lo arma sin `_fotos/`.
   */
  async function conFotos({ conCarpetaFotos = true } = {}) {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
      { id: 'c1', name: 'Panes', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
      ...(conCarpetaFotos ? [{ id: 'fc', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] }] : []),
      { id: 'r1', name: 'pan-de-campo.md', parents: ['c1'], contenido: PAN },
      { id: 'fv', name: 'pan-de-campo-1.jpg', mimeType: 'image/jpeg', parents: ['fc'] },
      { id: 'ajena', name: 'mia.jpg', mimeType: 'image/jpeg', parents: ['otra'] }
    ]);
    const sheets = sheetsFalso();
    sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
    sheets.cargar('i1', 'recetas', [[...COLUMNAS], ['r1', 'pan-de-campo.md', 'Pan de campo', 'Panes', 'c1', '', '', '', '', '', '', '1000']]);
    sheets.cargar('i1', 'meta', [
      ['schemaVersion', String(SCHEMA_VERSION)],
      ...(conCarpetaFotos ? [['carpeta_fotos', 'fc']] : [])
    ]);
    sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Panes', 'panes', 'catalogo:panes']]);
    const imagenes = imagenesFalsas();
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal, imagenes });
    await store.arrancar();
    await store.cargarIndice();
    drive.llamadas.length = 0;
    return { drive, sheets, store, imagenes, indiceLocal };
  }

  const sinCambios = { nuevas: new Map<number, Blob>(), sacadas: [] };

  it('sube, escribe el .md y recién después manda a la papelera', async () => {
    const { store, drive } = await conFotos();
    const receta = { ...parse(PAN), fotos: [{ n: 2, url: '' }] };

    await store.guardar('r1', receta, {
      fotos: { nuevas: new Map([[2, foto('nueva')]]), sacadas: [linkDeFoto('fv')] }
    });

    const escrituras = drive.llamadas.filter(l => ['crear', 'mover', 'renombrar', 'actualizar', 'borrar'].includes(String(l[0])));
    expect(escrituras).toEqual([
      ['crear', 'pan-de-campo-2.jpg'],
      ['actualizar', 'r1'],
      ['borrar', 'fv']
    ]);
  });

  it('la foto nueva va a _fotos/, su link queda en su línea, entra al caché y se avisa', async () => {
    const { store, drive, imagenes } = await conFotos();
    const subidas: [number, string][] = [];
    const blob = foto('nueva');

    await store.guardar('r1', { ...parse(PAN), fotos: [{ n: 1, url: linkDeFoto('fv') }, { n: 2, url: '' }] }, {
      fotos: { ...sinCambios, nuevas: new Map([[2, blob]]), alSubir: (n, id) => { subidas.push([n, id]); } }
    });

    const [[n, id] = [0, '']] = subidas;
    expect(n).toBe(2);
    expect(drive._store.get(id)).toMatchObject({ name: 'pan-de-campo-2.jpg', parents: ['fc'], mimeType: 'image/jpeg' });
    expect(parse(drive._store.get('r1')?.contenido ?? '').fotos).toEqual([
      { n: 1, url: linkDeFoto('fv') }, { n: 2, url: linkDeFoto(id) }
    ]);
    expect(imagenes.guardadas).toEqual([[id, blob]]);
  });

  it('la portada foto:N de una foto nueva llega resuelta a la fila del índice', async () => {
    const { store } = await conFotos();
    await store.guardar('r1', { ...parse(PAN), foto: 'foto:2', fotos: [{ n: 2, url: '' }] }, {
      fotos: { ...sinCambios, nuevas: new Map([[2, foto('x')]]) }
    });
    expect(store.entradas().find(e => e.id_archivo === 'r1')?.foto).toMatch(/^https:\/\/drive\.google\.com\/file\/d\/nuevo\d+\/view$/);
  });

  it('una línea del depósito que quedó sin URL no se escribe: dejaría la sección ilegible', async () => {
    const { store, drive } = await conFotos();
    // La 3 no está en `nuevas`: si se escribiera como `- 3: `, `## Fotos` no
    // parsearía más y la receta perdería el depósito entero.
    await store.guardar('r1', { ...parse(PAN), fotos: [{ n: 1, url: linkDeFoto('fv') }, { n: 3, url: '' }] }, {
      fotos: { ...sinCambios }
    });
    expect(drive._store.get('r1')?.contenido).not.toContain('- 3: ');
    expect(parse(drive._store.get('r1')?.contenido ?? '').fotos).toEqual([{ n: 1, url: linkDeFoto('fv') }]);

    // Y sin `fotos`, que es como guardan las pantallas que no las tocan.
    await store.guardar('r1', { ...parse(PAN), fotos: [{ n: 4, url: '' }] });
    expect(parse(drive._store.get('r1')?.contenido ?? '').fotos).toEqual([]);
  });

  it('una sacada fuera de _fotos/ o externa no va a la papelera; una que ya no está no es un error', async () => {
    const { store, drive, imagenes } = await conFotos();
    await store.guardar('r1', { ...parse(PAN), fotos: [] }, {
      fotos: { ...sinCambios, sacadas: [linkDeFoto('ajena'), 'https://ejemplo.com/pan.jpg', linkDeFoto('borrada'), linkDeFoto('fv')] }
    });
    expect(drive._store.get('ajena')?.trashed).toBeFalsy();
    expect(drive._store.get('fv')?.trashed).toBe(true);
    expect(drive.llamadas.filter(l => l[0] === 'borrar')).toEqual([['borrar', 'fv']]);
    expect(imagenes.olvidadas).toEqual(['borrada', 'fv']);
  });

  it('un error del caché no falla la escritura', async () => {
    const { store, drive, imagenes } = await conFotos();
    imagenes.guardarImagen = async () => { throw new Error('cuota'); };
    imagenes.olvidarImagen = async () => { throw new Error('cuota'); };
    await store.guardar('r1', { ...parse(PAN), fotos: [{ n: 2, url: '' }] }, {
      fotos: { ...sinCambios, nuevas: new Map([[2, foto('x')]]), sacadas: [linkDeFoto('fv')] }
    });
    expect(drive._store.get('fv')?.trashed).toBe(true);
  });

  it('la primera foto crea _fotos/ y la anota en meta', async () => {
    const { store, drive, sheets, indiceLocal } = await conFotos({ conCarpetaFotos: false });
    const r = await store.crear({ ...recetaFalsa({ titulo: 'Pan de campo' }), fotos: [{ n: 1, url: '' }] }, {
      carpetaId: 'c1', fotos: { ...sinCambios, nuevas: new Map([[1, foto('x')]]) }
    });

    // El nombre del `.md` se calcula antes de subir: ya hay un pan-de-campo.md.
    expect(drive.llamadas.filter(l => l[0] === 'crear').map(l => l[1])).toEqual(['_fotos', 'pan-de-campo-2-1.jpg', 'pan-de-campo-2.md']);
    expect(r.nombre_archivo).toBe('pan-de-campo-2.md');
    const carpeta = [...drive._store.values()].find(a => a.name === '_fotos')!;
    expect(carpeta).toMatchObject({ mimeType: CARPETA, parents: ['raiz'] });
    const meta = await sheets.leer('i1', 'meta!A1:B20');
    expect(meta).toContainEqual(['carpeta_fotos', carpeta.id]);
    expect(indiceLocal.actual()?.meta['carpeta_fotos']).toBe(carpeta.id);
    const subida = [...drive._store.values()].find(a => a.name === 'pan-de-campo-2-1.jpg')!;
    expect(subida.parents).toEqual([carpeta.id]);
    expect(parse(drive._store.get(r.id)?.contenido ?? '').fotos).toEqual([{ n: 1, url: linkDeFoto(subida.id) }]);

    // La segunda no crea otra carpeta.
    await store.crear({ ...recetaFalsa({ titulo: 'Otro' }), fotos: [{ n: 1, url: '' }] }, {
      fotos: { ...sinCambios, nuevas: new Map([[1, foto('y')]]) }
    });
    expect([...drive._store.values()].filter(a => a.name === '_fotos')).toHaveLength(1);
  });

  it('sin fotos que subir ni mover, no crea _fotos/', async () => {
    const { store, drive } = await conFotos({ conCarpetaFotos: false });
    await store.guardar('r1', parse(PAN), { fotos: { ...sinCambios, sacadas: [linkDeFoto('fv')] } });
    expect([...drive._store.values()].some(a => a.name === '_fotos')).toBe(false);
    expect(drive._store.get('fv')?.trashed).toBeFalsy();
  });

  it('borrar lee el .md, lo manda a la papelera y después sus fotos de _fotos/', async () => {
    const { store, drive, imagenes } = await conFotos();
    drive._store.get('r1')!.contenido = PAN.replace('\n- 1:', `\n- 2: ${linkDeFoto('ajena')}\n- 3: https://ejemplo.com/pan.jpg\n- 1:`);

    await store.borrar('r1');

    expect(drive.llamadas.filter(l => l[0] === 'borrar')).toEqual([['borrar', 'r1'], ['borrar', 'fv']]);
    expect(drive._store.get('ajena')?.trashed).toBeFalsy();
    expect(imagenes.olvidadas).toEqual(['fv']);
    expect(store.entradas()).toHaveLength(0);
  });

  it('si el .md no se puede leer, la receta se borra igual y sus fotos quedan huérfanas', async () => {
    const { store, drive } = await conFotos();
    drive.leerTexto = async () => { throw new Error('red'); };

    await expect(store.borrar('r1')).resolves.toBeUndefined();

    expect(drive._store.get('r1')?.trashed).toBe(true);
    expect(drive._store.get('fv')?.trashed).toBeFalsy();
    expect(store.entradas()).toHaveLength(0);
  });
});
