// Las herramientas de lectura del MCP contra los dobles de Drive y Sheets: lo
// que devuelven tiene que ser lo mismo que ve la app.
import { describe, it, expect, beforeEach } from 'vitest';
import { crearRecetario, indiceEnMemoria, errorDeSoloLectura } from '../mcp/recetario.js';
import { ErrorDeLogin, MENSAJES } from '../mcp/errores.js';
import { crearStore } from '../src/store.js';
import { reglasDelFormato, reglaDeReservados } from '../src/conversion.js';
import { validarMd } from '../src/validar.js';
import { COLUMNAS, TAGS_RESERVADOS, tagEspecial } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

const fila = (id: string, titulo: string, categoria: string, carpeta: string,
              tags: string, ingredientes: string, dificultad = ''): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', dificultad, '', tags, ingredientes, '1000', ''];

const MD_MILANESAS = '---\ntitulo: Milanesas napolitanas\ntags: [horno]\n---\n\n## Ingredientes\n\n- nalga — 1 kg\n';

let drive: DriveFalso;
let sheets: SheetsFalso;

function sembrar(meta: string[][] = [['schemaVersion', String(SCHEMA_VERSION)]]): void {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'r1.md', parents: ['c1'], contenido: MD_MILANESAS },
    { id: 'r2', name: 'r2.md', parents: ['c1'], contenido: '---\ntitulo: Bife de chorizo\n---\n' },
    { id: 'r3', name: 'r3.md', parents: ['c2'], contenido: '---\ntitulo: Flan casero\n---\n' },
    { id: 'r4', name: 'r4.md', parents: ['c2'], contenido: '---\ntitulo: Flan de dulce de leche\ntags: [borrador]\n---\n' }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [
    [...COLUMNAS],
    fila('r1', 'Milanesas napolitanas', 'Carnes', 'c1', 'horno|rápido', 'muzzarella|nalga', 'fácil'),
    fila('r2', 'Bife de chorizo', 'Carnes', 'c1', 'parrilla', 'bife', 'fácil'),
    fila('r3', 'Flan casero', 'Postres', 'c2', 'dulce|horno', 'huevo|leche', 'media'),
    fila('r4', 'Flan de dulce de leche', 'Postres', 'c2', 'borrador|dulce', 'dulce de leche')
  ]);
  sheets.cargar('i1', 'meta', meta);
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes'], ['c2', 'Postres', 'postres', 'catalogo:postres']
  ]);
}

/** El store de la app sobre los mismos dobles: la referencia de «lo mismo que la app». */
async function storeDeLaApp() {
  const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();
  return store;
}

const nuevoRecetario = () => crearRecetario({ drive, sheets, auth: { olvidar: () => {} } });

beforeEach(() => sembrar());

describe('arranque', () => {
  it('el primer uso arranca el store y lee la planilla una vez; los siguientes no la releen', async () => {
    const recetario = nuevoRecetario();
    expect(sheets.cuantas('leer')).toBe(0);  // crearlo no pide nada
    await recetario.categorias();
    const lecturas = sheets.cuantas('leer');
    expect(lecturas).toBeGreaterThan(0);
    expect(drive.cuantas('carpetasMarcadas')).toBe(1);

    await recetario.tags();
    await recetario.buscar({ texto: 'flan' });
    await recetario.leer('r1');
    expect(sheets.cuantas('leer')).toBe(lecturas);
    expect(drive.cuantas('carpetasMarcadas')).toBe(1);
  });

  it('dos herramientas a la vez comparten un solo arranque', async () => {
    const recetario = nuevoRecetario();
    await Promise.all([recetario.categorias(), recetario.tags()]);
    expect(drive.cuantas('carpetasMarcadas')).toBe(1);
  });

  it('con el índice de otro esquema, reindexa al arrancar, como la app', async () => {
    sembrar([['schemaVersion', '1']]);
    const recetario = nuevoRecetario();
    const categorias = await recetario.categorias();
    expect(drive.cuantas('leerTexto')).toBeGreaterThan(0);
    expect(categorias.find(c => c.nombre === 'Postres')?.cantidad).toBe(1);
  });

  it('el índice local vive sólo en memoria: no hay copia que leer', () => {
    expect(indiceEnMemoria.leer()).toBeNull();
  });
});

describe('sin carpeta', () => {
  beforeEach(() => {
    drive._store.get('raiz')!.appProperties = {};
  });

  it.each(['categorias', 'tags', 'buscar', 'leer'] as const)('%s falla con sin-carpeta', async herramienta => {
    const recetario = nuevoRecetario();
    const llamadas = {
      categorias: () => recetario.categorias(),
      tags: () => recetario.tags(),
      buscar: () => recetario.buscar({ texto: 'flan' }),
      leer: () => recetario.leer('r1')
    };
    const error = await llamadas[herramienta]().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeLogin);
    expect((error as ErrorDeLogin).codigo).toBe('sin-carpeta');
  });

  it('con dos carpetas marcadas también es sin-carpeta', async () => {
    drive._store.get('raiz')!.appProperties = { recetario: 'raiz' };
    drive._store.set('otra', { id: 'otra', name: 'Recetario 2', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } });
    const error = await nuevoRecetario().categorias().catch((e: unknown) => e);
    expect((error as ErrorDeLogin).codigo).toBe('sin-carpeta');
    expect((error as ErrorDeLogin).message).toBe(
      'Hay más de una carpeta marcada como Recetario. Abrí la app y elegí cuál usar desde Ajustes → Cambiar carpeta.');
    expect((error as ErrorDeLogin).detalle).toBe('2');
  });

  it('sin ninguna marcada, el mensaje es el de siempre', async () => {
    const error = await nuevoRecetario().categorias().catch((e: unknown) => e);
    expect((error as ErrorDeLogin).message).toBe(MENSAJES['sin-carpeta']);
  });

  it('después de marcar la carpeta, el próximo uso arranca', async () => {
    const recetario = nuevoRecetario();
    await expect(recetario.categorias()).rejects.toBeInstanceOf(ErrorDeLogin);
    drive._store.get('raiz')!.appProperties = { recetario: 'raiz' };
    expect(await recetario.categorias()).toHaveLength(2);
  });

  it('formato y validar no necesitan el Drive', async () => {
    const recetario = nuevoRecetario();
    expect(recetario.formato().length).toBeGreaterThan(0);
    expect(recetario.validar(MD_MILANESAS).problemas).toEqual([]);
    expect(drive.cuantas('carpetasMarcadas')).toBe(0);
  });
});

describe('errores de Google en el arranque', () => {
  it('un 401 al buscar la carpeta olvida el token y reintenta', async () => {
    let olvidadas = 0;
    const original = drive.carpetasMarcadas;
    let fallas = 1;
    drive.carpetasMarcadas = async () => {
      if (fallas-- > 0) throw Object.assign(new Error('{"error":{"code":401}}'), { status: 401 });
      return original();
    };
    const recetario = crearRecetario({ drive, sheets, auth: { olvidar: () => { olvidadas++; } } });
    expect(await recetario.categorias()).toHaveLength(2);
    expect(olvidadas).toBe(1);
  });

  it('un error de permisos sale con su código, no como un fallo genérico de Drive', async () => {
    drive.fallar('carpetasMarcadas', Object.assign(
      new Error('{"error":{"code":403,"errors":[{"reason":"insufficientPermissions"}]}}'), { status: 403 }));
    const error = await nuevoRecetario().categorias().catch((e: unknown) => e);
    expect((error as ErrorDeLogin).codigo).toBe('scope-insuficiente');
  });

  it('sin conexión es sin-red', async () => {
    drive.fallar('carpetasMarcadas', new TypeError('fetch failed'));
    const error = await nuevoRecetario().categorias().catch((e: unknown) => e);
    expect((error as ErrorDeLogin).codigo).toBe('sin-red');
  });

  it('después de un sin-red en el arranque, el próximo uso arranca', async () => {
    const recetario = nuevoRecetario();
    drive.fallar('carpetasMarcadas', new TypeError('fetch failed'));
    expect(((await recetario.categorias().catch((e: unknown) => e)) as ErrorDeLogin).codigo).toBe('sin-red');
    drive.fallar('carpetasMarcadas', undefined);
    expect(await recetario.categorias()).toHaveLength(2);
  });

  it('después de un permiso-revocado en el arranque, el próximo uso arranca', async () => {
    const recetario = nuevoRecetario();
    drive.fallar('carpetasMarcadas', Object.assign(new Error('{"error":{"code":401}}'), { status: 401 }));
    expect(((await recetario.categorias().catch((e: unknown) => e)) as ErrorDeLogin).codigo).toBe('permiso-revocado');
    drive.fallar('carpetasMarcadas', undefined);
    expect(await recetario.categorias()).toHaveLength(2);
  });

  it('un fallo de Drive que no es de login no se disfraza de login', async () => {
    drive.fallar('carpetasMarcadas', Object.assign(new Error('Backend Error'), { status: 500 }));
    const error = await nuevoRecetario().categorias().catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ErrorDeLogin);
    expect((error as Error).message).toContain('Backend Error');
  });
});

describe('las herramientas', () => {
  it('formato: las reglas de la app, con los reservados menos borrador y la regla de borrador al lado', () => {
    const reglas = nuevoRecetario().formato();
    const deLaApp = reglasDelFormato();
    const i = deLaApp.indexOf(reglaDeReservados(TAGS_RESERVADOS));
    expect(i).toBeGreaterThanOrEqual(0);

    expect(reglas.slice(0, i)).toEqual(deLaApp.slice(0, i));
    expect(reglas[i]).toBe(reglaDeReservados(TAGS_RESERVADOS.filter(t => tagEspecial(t) !== 'borrador')));
    expect(reglas[i]).toContain('`terminado`');
    expect(reglas[i]).toContain('`favorita`');
    expect(reglas[i]).not.toContain('`borrador`');
    expect(reglas[i]).not.toContain('`incompleta`');
    expect(reglas[i + 1]).toContain('El tag `borrador` va cuando');
    // Lo demás de la app, tal cual y en su orden; después, las reglas de las fotos.
    const resto = deLaApp.slice(i + 1);
    expect(reglas.slice(i + 2, i + 2 + resto.length)).toEqual(resto);
    expect(reglas.slice(i + 2 + resto.length).join('\n')).toContain('`foto: foto:N`');
  });

  it('formato dice cómo se numeran las fotos antes de subirlas', () => {
    const texto = nuevoRecetario().formato().join('\n');
    expect(texto).toContain('`foto: foto:N`');
    expect(texto).toContain('`![](foto:N)`');
    expect(texto).toContain('`foto:i`');
    expect(texto).toContain('número más alto del depósito');
    expect(texto).toContain('`fuente`');
    expect(texto).toContain('nunca se reusan');
    expect(texto).toContain('URL externa');
    expect(texto).toContain('No escribas la sección `## Fotos`');
    expect(texto).toContain('se ignora');
    expect(texto).toContain('`sacar`');
    expect(texto).not.toContain('tal como vino de `leer`');
  });

  it('categorias: id, nombre y cantidad, sin contar los borradores', async () => {
    expect(await nuevoRecetario().categorias()).toEqual([
      { id: 'c1', nombre: 'Carnes', cantidad: 2 },
      { id: 'c2', nombre: 'Postres', cantidad: 1 }
    ]);
  });

  it('tags: lo mismo que tagsDe("recetas") de la app', async () => {
    const tags = await nuevoRecetario().tags();
    expect(tags).toEqual((await storeDeLaApp()).tagsDe('recetas'));
    expect(tags.map(t => t.tag)).not.toContain('borrador');
  });

  it('buscar por texto: lo mismo que la búsqueda de la app, con el motivo', async () => {
    const resultados = await nuevoRecetario().buscar({ texto: 'horno' });
    const app = (await storeDeLaApp()).buscarPorTexto('horno');
    expect(resultados.map(r => r.id).sort()).toEqual(
      [...app.porNombre, ...app.porIngrediente.map(c => c.entrada), ...app.porTag.map(c => c.entrada)]
        .map(e => e.id_archivo).sort());
    expect(resultados.find(r => r.id === 'r3')).toEqual({
      id: 'r3', titulo: 'Flan casero', categoria: 'Postres', nombre_archivo: 'r3.md',
      tags: ['dulce', 'horno'], motivos: ['tiene tag horno']
    });
  });

  it('buscar: una receta que coincide por dos criterios sale una vez, con los dos motivos', async () => {
    const [flan, ...resto] = await nuevoRecetario().buscar({ texto: 'flan' });
    expect(resto).toEqual([]);
    expect(flan?.id).toBe('r3');
    expect(flan?.motivos).toEqual(['título']);

    const leche = await nuevoRecetario().buscar({ texto: 'dulce' });
    expect(leche.map(r => r.id)).toEqual(['r3']);
    expect(leche[0]?.motivos).toEqual(['tiene tag dulce']);
  });

  it('buscar no trae borradores salvo que se pidan', async () => {
    const recetario = nuevoRecetario();
    expect((await recetario.buscar({ texto: 'dulce de leche' })).map(r => r.id)).toEqual([]);
    expect((await recetario.buscar({ categoria: 'Postres' })).map(r => r.id)).toEqual(['r3']);

    const borradores = await recetario.buscar({ tags: ['borrador'] });
    expect(borradores.map(r => r.id)).toEqual(['r4']);
    expect(borradores[0]?.motivos).toEqual(['tag borrador']);

    const conTexto = await recetario.buscar({ texto: 'dulce de leche', tags: ['borrador'] });
    expect(conTexto.map(r => r.id)).toEqual(['r4']);
    expect(conTexto[0]?.motivos).toEqual(['«dulce de leche» en el título o los ingredientes', 'tag borrador']);
  });

  it('buscar con filtros: lo mismo que el filtro de la app, y el filtro es el motivo', async () => {
    const resultados = await nuevoRecetario().buscar({ categoria: 'Carnes', tags: ['rápido'] });
    const app = (await storeDeLaApp()).buscar({ categoria: 'Carnes', tags: ['rápido'] });
    expect(resultados.map(r => r.id)).toEqual(app.map(e => e.id_archivo));
    expect(resultados[0]?.motivos).toEqual(['categoría Carnes', 'tag rápido']);
  });

  it('buscar combina texto y filtros', async () => {
    const recetario = nuevoRecetario();
    expect((await recetario.buscar({ texto: 'horno', categoria: 'Carnes' })).map(r => r.id)).toEqual(['r1']);
    const conDificultad = await recetario.buscar({ texto: 'horno', dificultad: 'media' });
    expect(conDificultad.map(r => r.id)).toEqual(['r3']);
    expect(conDificultad[0]?.motivos).toEqual(['tiene tag horno', 'dificultad media']);
  });

  it('leer: el .md entero, la categoría y el nombre de archivo', async () => {
    expect(await nuevoRecetario().leer('r1')).toEqual({
      id: 'r1', md: MD_MILANESAS, categoria: 'Carnes', nombre_archivo: 'r1.md'
    });
  });

  it('leer un id que no está en el índice falla sin leer el archivo', async () => {
    const recetario = nuevoRecetario();
    await expect(recetario.leer('otro')).rejects.toThrow(/índice/);
    expect(drive.cuantas('leerTexto', 'otro')).toBe(0);
  });

  it('validar: un .md escrito según formato, con dos fotos pedidas, pasa', () => {
    const md = '---\ntitulo: Tarta\nfoto: foto:1\n---\n\n## Preparación\n\n1. Hornear. ![](foto:2)\n';
    const fotos = [{ origen: '/tmp/plato.jpg', uso: 'plato' }, { origen: '/tmp/paso.jpg', uso: 'paso' }] as const;
    const recetario = nuevoRecetario();
    expect(recetario.validar(md, fotos).problemas).toEqual([]);
    expect(recetario.validar(md).problemas.map(p => p.campo)).toEqual(['foto', 'fotos']);
  });

  it('validar al guardar: las fotos nuevas siguen al número más alto del depósito', () => {
    const md = '---\ntitulo: Tarta\nfoto: foto:4\n---\n\n## Preparación\n\n1. Hornear. ![](foto:5)\n\n' +
      '## Fotos\n\n- 1: https://ejemplo.com/1.jpg\n- 3: https://ejemplo.com/3.jpg\n';
    const fotos = [{ origen: 'a.jpg', uso: 'plato' }, { origen: 'b.jpg', uso: 'paso' }] as const;
    expect(nuevoRecetario().validar(md, fotos).problemas).toEqual([]);
    expect(nuevoRecetario().validar(md.replace('foto:5', 'foto:6'), fotos).problemas.map(p => p.campo)).toEqual(['fotos']);
  });

  it('validar: lo mismo que validarMd', () => {
    const md = '---\ntitulo: Algo\ntiempo: un rato\n---\n';
    expect(nuevoRecetario().validar(md)).toEqual(validarMd(md));
  });
});

describe('errorDeSoloLectura', () => {
  it('el error de login es el del arranque sólo si su mensaje es el motivo', () => {
    const deLogin = new ErrorDeLogin('sin-red');
    expect(errorDeSoloLectura(deLogin.message, deLogin)).toBe(deLogin);
  });

  it('un error de login anterior, que el store atrapó, no reemplaza al motivo', () => {
    const error = errorDeSoloLectura('Backend Error', new ErrorDeLogin('sin-red'));
    expect(error).not.toBeInstanceOf(ErrorDeLogin);
    expect(error.message).toContain('Backend Error');
  });

  it('sin error de login, el motivo', () => {
    expect(errorDeSoloLectura('Backend Error', null).message).toContain('Backend Error');
  });
});
