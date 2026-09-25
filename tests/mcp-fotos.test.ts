// Las fotos del MCP: achicarlas en Node con el mismo `achicar()` de la app, y
// subirlas con la receta en el depósito, con el número que el `.md` ya usa.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { mkdtemp, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { achicarEnNode, NoSeBajo, type DependenciasAchicar } from '../mcp/fotos.js';
import { crearRecetario } from '../mcp/recetario.js';
import { parse } from '../src/recipe.js';
import { linkDeFoto } from '../src/fotos-receta.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';

const CHICA = join(import.meta.dirname, 'fixtures', 'foto-chica.jpg');

let dir: string;
let grande: string;

/** Un JPEG de `ancho`×`alto`, para las fotos que el fixture no cubre. */
async function jpeg(ancho: number, alto: number): Promise<Buffer> {
  const c = createCanvas(ancho, alto);
  const x = c.getContext('2d');
  x.fillStyle = '#2a7';
  x.fillRect(0, 0, ancho, alto);
  return c.encode('jpeg', 85);
}

async function medidasDe(blob: Blob): Promise<{ ancho: number; alto: number; tipo: string; jpeg: boolean }> {
  const bytes = Buffer.from(await blob.arrayBuffer());
  const img = await loadImage(bytes);
  return { ancho: img.width, alto: img.height, tipo: blob.type, jpeg: bytes[0] === 0xff && bytes[1] === 0xd8 };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'recetario-fotos-'));
  grande = join(dir, 'grande.jpg');
  await writeFile(grande, await jpeg(2000, 1000));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('achicarEnNode', () => {
  it('una foto de 2000×1000 queda en un JPEG de 1600×800', async () => {
    expect(await medidasDe(await achicarEnNode(grande))).toEqual({ ancho: 1600, alto: 800, tipo: 'image/jpeg', jpeg: true });
  });

  it('una foto más chica que 1600 no se agranda', async () => {
    expect(await medidasDe(await achicarEnNode(CHICA))).toMatchObject({ ancho: 320, alto: 240, jpeg: true });
  });

  it('un archivo que no es imagen falla con el nombre del archivo', async () => {
    const texto = join(dir, 'receta.txt');
    await writeFile(texto, 'no soy una foto');
    await expect(achicarEnNode(texto)).rejects.toThrow('receta.txt');
  });

  it('un archivo que no existe falla con el nombre del archivo', async () => {
    await expect(achicarEnNode(join(dir, 'no-esta.jpg'))).rejects.toThrow('no-esta.jpg');
  });

  it.each(['.heic', '.HEIF'])('un %s se pasa antes a JPEG con sips, y el temporal se borra', async ext => {
    const origen = join(dir, `plato${ext}`);
    await writeFile(origen, 'heic simulado');
    const llamadas: { comando: string; args: string[] }[] = [];
    const ejecutar: DependenciasAchicar['ejecutar'] = async (comando, args) => {
      llamadas.push({ comando, args });
      await copyFile(grande, args[args.length - 1] ?? '');
    };
    const blob = await achicarEnNode(origen, { ejecutar });
    expect(await medidasDe(blob)).toMatchObject({ ancho: 1600, alto: 800 });
    expect(llamadas).toHaveLength(1);
    const { comando, args } = llamadas[0]!;
    expect(comando).toBe('sips');
    expect(args.slice(0, 4)).toEqual(['-s', 'format', 'jpeg', origen]);
    expect(args[4]).toBe('--out');
    const { existsSync } = await import('node:fs');
    expect(existsSync(args[5] ?? '')).toBe(false);
  });

  it('un JPEG no pasa por sips', async () => {
    let llamado = false;
    await achicarEnNode(CHICA, { ejecutar: async () => { llamado = true; } });
    expect(llamado).toBe(false);
  });

  it('un HEIC que sips no puede convertir falla con el nombre del archivo', async () => {
    const origen = join(dir, 'roto.heic');
    await writeFile(origen, 'x');
    await expect(achicarEnNode(origen, { ejecutar: async () => { throw new Error('sips: error'); } })).rejects.toThrow('roto.heic');
  });

  it('una URL se baja y se achica', async () => {
    const pedidas: string[] = [];
    const fetch: DependenciasAchicar['fetch'] = async url => {
      pedidas.push(String(url));
      return new Response(new Uint8Array(await jpeg(2000, 1000)), { headers: { 'Content-Type': 'image/jpeg' } });
    };
    const blob = await achicarEnNode('https://ejemplo.com/plato.jpg', { fetch });
    expect(pedidas).toEqual(['https://ejemplo.com/plato.jpg']);
    expect(await medidasDe(blob)).toMatchObject({ ancho: 1600, alto: 800 });
  });

  it('una URL que no se puede bajar es NoSeBajo', async () => {
    const sinRed: DependenciasAchicar['fetch'] = async () => { throw new TypeError('fetch failed'); };
    const e404: DependenciasAchicar['fetch'] = async () => new Response('no', { status: 404 });
    await expect(achicarEnNode('https://ejemplo.com/a.jpg', { fetch: sinRed })).rejects.toBeInstanceOf(NoSeBajo);
    await expect(achicarEnNode('https://ejemplo.com/a.jpg', { fetch: e404 })).rejects.toBeInstanceOf(NoSeBajo);
  });

  it('una URL que baja algo que no es una foto falla con la URL', async () => {
    const html: DependenciasAchicar['fetch'] = async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } });
    const error = await achicarEnNode('https://ejemplo.com/pagina', { fetch: html }).catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(NoSeBajo);
    expect((error as Error).message).toContain('https://ejemplo.com/pagina');
  });
});

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

/** Una receta con dos fotos en `_fotos/`: la del plato y la de un paso. */
const MD_FLAN = [
  '---',
  'titulo: Flan casero',
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
  '## Fotos',
  '',
  `- 1: ${linkDeFoto('f1')}`,
  `- 2: ${linkDeFoto('f2')}`,
  ''
].join('\n');

const md = (titulo: string, { extra = '', pasos = '1. Amasar.' } = {}): string =>
  `---\ntitulo: ${titulo}\n${extra}---\n\n## Ingredientes\n\n- harina — 500 g\n\n## Preparación\n\n${pasos}\n`;

let drive: DriveFalso;
let sheets: SheetsFalso;

beforeEach(() => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r3', name: 'flan-casero.md', parents: ['c2'], contenido: MD_FLAN },
    { id: 'f1', name: 'flan-casero-1.jpg', mimeType: 'image/jpeg', parents: ['fotos'] },
    { id: 'f2', name: 'flan-casero-2.jpg', mimeType: 'image/jpeg', parents: ['fotos'] }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], ['r3', 'flan-casero.md', 'Flan casero', 'Postres', 'c2', '', '', '', '', '', '', '1000', '']]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_fotos', 'fotos']]);
  sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c2', 'Postres', 'postres', 'catalogo:postres']]);
});

/** Un `fetch` falso: la URL de la foto contesta un JPEG de 2000×1000; cualquier otra, sin red. */
const fetchFalso: DependenciasAchicar['fetch'] = async url => {
  if (url === 'https://ejemplo.com/plato.jpg') {
    return new Response(new Uint8Array(await jpeg(2000, 1000)), { headers: { 'Content-Type': 'image/jpeg' } });
  }
  throw new TypeError('fetch failed');
};

const nuevoRecetario = () => crearRecetario({
  drive, sheets, auth: { olvidar: () => {} },
  achicar: origen => achicarEnNode(origen, { fetch: fetchFalso })
});

const archivo = (id: string) => drive._store.get(id);
const porNombre = (nombre: string) => [...drive._store.values()].find(a => a.name === nombre);

/** La receta escrita, como la lee la app. */
function escrita(r: Awaited<ReturnType<ReturnType<typeof nuevoRecetario>['crear']>>) {
  if (!r.escrita) throw new Error(`no se escribió: ${JSON.stringify(r.problemas)}`);
  return parse(archivo(r.id)?.contenido);
}

describe('las fotos al crear', () => {
  it('plato: va al depósito, se sube a _fotos/ y queda de portada', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero'), categoria: 'Postres', fotos: [{ origen: CHICA, uso: 'plato' }]
    }));
    const subida = porNombre('pan-casero-1.jpg');
    expect(subida?.parents).toEqual(['fotos']);
    expect(receta.fotos).toEqual([{ n: 1, url: linkDeFoto(subida?.id ?? '') }]);
    expect(receta.foto).toBe('foto:1');
    expect(await medidasDe(subida!.blob!)).toMatchObject({ ancho: 320, alto: 240, jpeg: true });
  });

  it('plato: si el .md ya trae una portada, se respeta', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero', { extra: 'foto: https://ejemplo.com/portada.jpg\n' }), categoria: 'Postres',
      fotos: [{ origen: CHICA, uso: 'plato' }]
    }));
    expect(receta.foto).toBe('https://ejemplo.com/portada.jpg');
    expect(receta.fotos.map(f => f.n)).toEqual([1]);
  });

  it('el número que usa el .md apunta a la foto que le corresponde', async () => {
    // La fuente no se sube (sin `borrador`) y deja libre el 1; el paso es el 2 y el plato el 3.
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero', { pasos: '1. Amasar. ![](foto:2)' }), categoria: 'Postres',
      fotos: [{ origen: grande, uso: 'fuente' }, { origen: CHICA, uso: 'paso' }, { origen: grande, uso: 'plato' }]
    }));
    const paso = porNombre('pan-casero-2.jpg');
    const plato = porNombre('pan-casero-3.jpg');
    expect(porNombre('pan-casero-1.jpg')).toBeUndefined();
    expect(receta.foto).toBe('foto:3');
    expect(receta.preparacion).toContain('![](foto:2)');
    expect(receta.fotos).toEqual([
      { n: 2, url: linkDeFoto(paso?.id ?? '') },
      { n: 3, url: linkDeFoto(plato?.id ?? '') }
    ]);
    expect(await medidasDe(paso!.blob!)).toMatchObject({ ancho: 320, alto: 240 });
    expect(await medidasDe(plato!.blob!)).toMatchObject({ ancho: 1600, alto: 800 });
  });

  it('paso: va al depósito y no toca la portada', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero', { pasos: '1. Amasar. ![](foto:1)' }), categoria: 'Postres',
      fotos: [{ origen: CHICA, uso: 'paso' }]
    }));
    expect(receta.foto).toBeNull();
    expect(receta.fotos.map(f => f.n)).toEqual([1]);
  });

  it('fuente: sin borrador no se sube', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero'), categoria: 'Postres', fotos: [{ origen: CHICA, uso: 'fuente' }]
    }));
    expect(receta.fotos).toEqual([]);
    expect(drive.cuantas('crear')).toBe(1);
  });

  it('fuente: con borrador, en cualquiera de sus formas, se sube al depósito', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero', { extra: 'tags: [Borrador]\n' }), categoria: 'Postres', fotos: [{ origen: CHICA, uso: 'fuente' }]
    }));
    expect(receta.fotos).toEqual([{ n: 1, url: linkDeFoto(porNombre('pan-casero-1.jpg')?.id ?? '') }]);
    expect(receta.foto).toBeNull();
  });

  it('una referencia a una fuente que no se sube es error y no escribe', async () => {
    const r = await nuevoRecetario().crear({
      md: md('Pan casero', { pasos: '1. Amasar. ![](foto:1)' }), categoria: 'Postres', fotos: [{ origen: CHICA, uso: 'fuente' }]
    });
    expect(r.escrita).toBe(false);
    expect(r.problemas.filter(p => p.nivel === 'error')).toHaveLength(1);
    expect(drive.cuantas('crear')).toBe(0);
  });

  it('una URL se baja, se achica y se sube', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero'), categoria: 'Postres', fotos: [{ origen: 'https://ejemplo.com/plato.jpg', uso: 'plato' }]
    }));
    const subida = porNombre('pan-casero-1.jpg');
    expect(receta.fotos).toEqual([{ n: 1, url: linkDeFoto(subida?.id ?? '') }]);
    expect(await medidasDe(subida!.blob!)).toMatchObject({ ancho: 1600, alto: 800 });
  });

  it('una URL que no se puede bajar queda como link externo, con su número', async () => {
    const receta = escrita(await nuevoRecetario().crear({
      md: md('Pan casero'), categoria: 'Postres',
      fotos: [{ origen: CHICA, uso: 'paso' }, { origen: 'https://ejemplo.com/caida.jpg', uso: 'plato' }]
    }));
    expect(receta.fotos[1]).toEqual({ n: 2, url: 'https://ejemplo.com/caida.jpg' });
    expect(receta.foto).toBe('foto:2');
    expect(porNombre('pan-casero-2.jpg')).toBeUndefined();
  });

  it('un archivo que no se puede leer falla con su nombre y no escribe nada', async () => {
    const roto = join(dir, 'pagina-rota.jpg');
    await writeFile(roto, 'no soy una foto');
    const error = await nuevoRecetario().crear({
      md: md('Pan casero'), categoria: 'Postres',
      fotos: [{ origen: CHICA, uso: 'plato' }, { origen: roto, uso: 'paso' }]
    }).catch((e: unknown) => e);
    expect((error as Error).message).toContain('pagina-rota.jpg');
    expect(drive.cuantas('crear')).toBe(0);
  });
});

describe('validar con fotos', () => {
  it('una fuente cuenta como pendiente sólo si la receta lleva borrador', () => {
    const conRef = md('Pan casero', { pasos: '1. Amasar. ![](foto:1)' });
    const fuente = [{ origen: CHICA, uso: 'fuente' as const }];
    expect(nuevoRecetario().validar(conRef, fuente).problemas.filter(p => p.nivel === 'error')).toHaveLength(1);
    const conBorrador = md('Pan casero', { extra: 'tags: [borrador]\n', pasos: '1. Amasar. ![](foto:1)' });
    expect(nuevoRecetario().validar(conBorrador, fuente).problemas.filter(p => p.nivel === 'error')).toEqual([]);
  });
});

describe('las fotos al guardar', () => {
  it('las nuevas siguen al depósito de Drive y la portada del .md se respeta', async () => {
    const conPaso = MD_FLAN.replace('1. Batir. ![](foto:2)', '1. Batir. ![](foto:2)\n2. Hornear. ![](foto:3)');
    const r = await nuevoRecetario().guardar({
      id: 'r3', md: conPaso, fotos: [{ origen: CHICA, uso: 'paso' }, { origen: grande, uso: 'plato' }]
    });
    const receta = escrita(r);
    expect(receta.foto).toBe('foto:1');
    expect(receta.fotos).toEqual([
      { n: 1, url: linkDeFoto('f1') },
      { n: 2, url: linkDeFoto('f2') },
      { n: 3, url: linkDeFoto(porNombre('flan-casero-3.jpg')?.id ?? '') },
      { n: 4, url: linkDeFoto(porNombre('flan-casero-4.jpg')?.id ?? '') }
    ]);
  });

  it('un archivo que no se puede leer falla con su nombre y no reescribe la receta', async () => {
    const error = await nuevoRecetario().guardar({
      id: 'r3', md: MD_FLAN, fotos: [{ origen: join(dir, 'no-esta.heic'), uso: 'paso' }]
    }).catch((e: unknown) => e);
    expect((error as Error).message).toContain('no-esta.heic');
    expect(drive.cuantas('actualizar')).toBe(0);
    expect(drive.cuantas('crear')).toBe(0);
  });

  it('sacar una foto no tira una URL que otra línea del depósito sigue usando', async () => {
    archivo('r3')!.contenido = MD_FLAN.replace(`- 2: ${linkDeFoto('f2')}`, `- 2: ${linkDeFoto('f2')}\n- 3: ${linkDeFoto('f2')}`);
    const sinPaso = MD_FLAN.replace(' ![](foto:2)', '');
    const r = await nuevoRecetario().guardar({ id: 'r3', md: sinPaso, sacar: [2] });
    expect(escrita(r).fotos.map(f => f.n)).toEqual([1, 3]);
    expect(drive.cuantas('borrar', 'f2')).toBe(0);
  });
});
