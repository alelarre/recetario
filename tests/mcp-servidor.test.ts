// El servidor MCP contra un cliente del SDK en memoria y el recetario sobre los
// dobles de Drive y Sheets: sin stdio, sin red y sin el Llavero.
import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { crearServidor } from '../mcp/servidor.js';
import { crearRecetario } from '../mcp/recetario.js';
import { ErrorDeDrive } from '../src/drive.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso } from './dobles.js';
import type { DriveFalso, SheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

const fila = (id: string, titulo: string, categoria: string, carpeta: string): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', '', '', '', '', '1000', ''];

const md = (titulo: string, extra = ''): string =>
  `---\ntitulo: ${titulo}\n${extra}---\n\n## Ingredientes\n\n- harina — 500 g\n`;

let drive: DriveFalso;
let sheets: SheetsFalso;

beforeEach(() => {
  drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } },
    { id: 'c2', name: 'Postres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'fotos', name: '_fotos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r3', name: 'r3.md', parents: ['c2'], contenido: md('Flan casero') }
  ]);
  sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'categorias']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r3', 'Flan casero', 'Postres', 'c2')]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_fotos', 'fotos']]);
  sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c2', 'Postres', 'postres', 'catalogo:postres']]);
});

/** Un cliente MCP conectado al servidor por un transporte en memoria. */
async function conectar(): Promise<Client> {
  const recetario = crearRecetario({
    drive, sheets, auth: { olvidar: () => {} },
    achicar: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
  });
  const [delCliente, delServidor] = InMemoryTransport.createLinkedPair();
  await crearServidor(recetario).connect(delServidor);
  const cliente = new Client({ name: 'test', version: '1.0.0' });
  await cliente.connect(delCliente);
  return cliente;
}

interface Respuesta { isError?: boolean; content: { type: string; text: string }[] }

async function llamar(cliente: Client, name: string, args: Record<string, unknown> = {}): Promise<Respuesta> {
  return await cliente.callTool({ name, arguments: args }) as Respuesta;
}

const texto = (r: Respuesta): string => r.content.map(c => c.text).join('\n');

describe('las herramientas', () => {
  it('lista las diez, cada una con su descripción y su esquema de entrada', async () => {
    const { tools } = await (await conectar()).listTools();
    expect(tools.map(t => t.name).sort()).toEqual(
      ['borrar', 'buscar', 'categorias', 'crear', 'formato', 'guardar', 'leer', 'reindexar', 'tags', 'validar']
    );
    for (const t of tools) {
      expect(t.description).toBeTruthy();
      expect(t.inputSchema.type).toBe('object');
    }
  });

  it('borrar pide el id y la confirmación', async () => {
    const { tools } = await (await conectar()).listTools();
    const borrar = tools.find(t => t.name === 'borrar');
    expect(borrar?.inputSchema.required?.sort()).toEqual(['confirmacion', 'id']);
  });

  it('crear y guardar piden las fotos con su origen y su uso', async () => {
    const { tools } = await (await conectar()).listTools();
    for (const nombre of ['crear', 'guardar', 'validar']) {
      const esquema = tools.find(t => t.name === nombre)?.inputSchema as { properties: Record<string, unknown> };
      expect(JSON.stringify(esquema.properties.fotos)).toContain('"plato","paso","fuente"');
    }
  });
});

describe('llamar a una herramienta', () => {
  it('formato devuelve las reglas como texto', async () => {
    const r = await llamar(await conectar(), 'formato');
    expect(r.isError).toBeFalsy();
    expect(texto(r)).toContain('`tiempo` es uno de estos valores');
  });

  it('buscar devuelve JSON con las recetas y por qué coinciden', async () => {
    const r = await llamar(await conectar(), 'buscar', { texto: 'flan' });
    expect(JSON.parse(texto(r))).toEqual([expect.objectContaining({ id: 'r3', titulo: 'Flan casero', motivos: ['título'] })]);
  });

  it('crear escribe y devuelve el id y el nombre de archivo', async () => {
    const r = await llamar(await conectar(), 'crear', { md: md('Pan casero'), categoria: 'Postres' });
    expect(r.isError).toBeFalsy();
    expect(JSON.parse(texto(r))).toMatchObject({ escrita: true, nombre_archivo: 'pan-casero.md' });
  });

  it('crear con errores no escribe y devuelve los problemas como error', async () => {
    const r = await llamar(await conectar(), 'crear', { md: md('Pan', 'tiempo: un rato\n') });
    expect(r.isError).toBe(true);
    expect(JSON.parse(texto(r))).toMatchObject({ escrita: false, problemas: [expect.objectContaining({ campo: 'tiempo' })] });
    expect(drive.cuantas('crear')).toBe(0);
  });

  it('validar con fotos dice qué número tiene cada una y cuáles se suben', async () => {
    const r = await llamar(await conectar(), 'validar', {
      md: md('Pan', 'foto: foto:2\n'),
      fotos: [{ origen: '/tmp/libro.jpg', uso: 'fuente' }, { origen: '/tmp/pan.jpg', uso: 'plato' }]
    });
    const v = JSON.parse(texto(r));
    expect(v.problemas).toEqual([]);
    expect(v.fotos).toEqual([
      { origen: '/tmp/libro.jpg', uso: 'fuente', n: 1, seSube: false },
      { origen: '/tmp/pan.jpg', uso: 'plato', n: 2, seSube: true }
    ]);
  });

  it('borrar con una confirmación que no coincide es un error y no borra', async () => {
    const r = await llamar(await conectar(), 'borrar', { id: 'r3', confirmacion: 'flan' });
    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('"Flan casero"');
    expect(drive.cuantas('borrar')).toBe(0);
  });

  it('borrar con el título exacto manda la receta a la papelera', async () => {
    const r = await llamar(await conectar(), 'borrar', { id: 'r3', confirmacion: 'Flan casero' });
    expect(r.isError).toBeFalsy();
    expect(drive.cuantas('borrar', 'r3')).toBe(1);
  });

  it('reindexar informa el avance como progreso del MCP', async () => {
    const cliente = await conectar();
    const avance: number[] = [];
    const r = await cliente.callTool({ name: 'reindexar', arguments: {} }, undefined, {
      onprogress: p => { avance.push(p.progress); }
    }) as Respuesta;
    expect(JSON.parse(texto(r))).toMatchObject({ indexadas: 1 });
    expect(avance.length).toBeGreaterThan(0);
    expect(avance.at(-1)).toBe(1);
  });
});

describe('los errores', () => {
  it('uno de login sale con su código y el texto claro, sin lo que dijo Google', async () => {
    drive.fallar('carpetasMarcadas', new ErrorDeDrive(
      '{"error":{"code":403,"errors":[{"reason":"insufficientPermissions"}],"message":"Request had insufficient authentication scopes."}}',
      403
    ));
    const r = await llamar(await conectar(), 'categorias');
    expect(r.isError).toBe(true);
    expect(texto(r)).toMatch(/^\[scope-insuficiente\] /);
    expect(texto(r)).toContain('npm run mcp:conectar');
    expect(texto(r)).not.toContain('insufficient');
  });

  it('uno de Google que no es de login dice el status, sin el cuerpo de la respuesta', async () => {
    drive.fallar('leerTexto', new ErrorDeDrive('{"error":{"message":"Backend Error interno 7f3a"}}', 500));
    const r = await llamar(await conectar(), 'leer', { id: 'r3' });
    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('500');
    expect(texto(r)).not.toContain('Backend');
  });

  it('uno propio del recetario sale con su mensaje', async () => {
    const r = await llamar(await conectar(), 'leer', { id: 'nada' });
    expect(r.isError).toBe(true);
    expect(texto(r)).toContain('No hay ninguna receta con el id nada');
  });
});
