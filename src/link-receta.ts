/**
 * El link que muestra una receta sin login. La receta viaja entera en
 * el fragmento, comprimida: no hay nada publicado en Drive y nada que revocar.
 */
import { parse, serialize } from './recipe.js';
import type { Receta } from './tipos.js';

/** La versión del formato. Cambiar la carga es cambiar este número. */
const VERSION = '1';

async function pasarPor(bytes: Uint8Array, flujo: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const salida = new Blob([bytes.slice()]).stream().pipeThrough(flujo);
  return new Uint8Array(await new Response(salida).arrayBuffer());
}

function aBase64url(bytes: Uint8Array): string {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(texto: string): Uint8Array {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binario, c => c.charCodeAt(0));
}

export async function codificar(receta: Receta, categoria: string): Promise<string> {
  const md = serialize({ ...receta, tags: [], extras: {} });
  const json = new TextEncoder().encode(JSON.stringify({ c: categoria, md }));
  return VERSION + aBase64url(await pasarPor(json, new CompressionStream('deflate-raw')));
}

/** Nunca tira: un link roto, cortado o de otra versión es `null`. */
export async function decodificar(carga: unknown): Promise<{ receta: Receta; categoria: string } | null> {
  if (typeof carga !== 'string' || carga.length < 2 || !carga.startsWith(VERSION)) return null;
  try {
    const bytes = await pasarPor(deBase64url(carga.slice(VERSION.length)), new DecompressionStream('deflate-raw'));
    const datos: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!datos || typeof datos !== 'object') return null;
    const { c, md } = datos as Record<string, unknown>;
    if (typeof c !== 'string' || typeof md !== 'string') return null;
    const receta = parse(md);
    return receta.titulo ? { receta, categoria: c } : null;
  } catch {
    return null;
  }
}

export function urlDeLink(carga: string, base = location.origin + import.meta.env.BASE_URL): string {
  return `${base}#/ver?r=${carga}`;
}
