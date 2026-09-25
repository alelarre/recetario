// Las fotos del MCP: achicarlas en Node con el mismo `achicar()` de la app, y
// subirlas con la receta en el depósito, con el número que el `.md` ya usa.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { achicarEnNode, NoSeBajo, type DependenciasAchicar } from '../mcp/fotos.js';

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
