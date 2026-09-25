// Achicar en Node las fotos que pide el agente, con el mismo `achicar()` que
// usa la app: el lienzo del navegador se reemplaza por `@napi-rs/canvas`.
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { achicar, type Imagen, type Lienzo } from '../src/fotos.js';
import { CORTE_DE_LECTURA } from '../src/config.js';

/**
 * Una URL que no se pudo bajar: sin red, un error del servidor o un pedido
 * que no contesta. Quien la pidió la deja como link externo, igual que *Por
 * URL* en el editor.
 */
export class NoSeBajo extends Error {
  constructor(readonly url: string, motivo: string) {
    super(`No se pudo bajar la foto ${url}: ${motivo}`);
    this.name = 'NoSeBajo';
  }
}

export interface DependenciasAchicar {
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  /** Corre un programa sin shell; rechaza si termina con error. */
  ejecutar?: (comando: string, args: string[]) => Promise<void>;
}

const ejecutarSinShell = (comando: string, args: string[]): Promise<void> =>
  new Promise((resolver, rechazar) => {
    execFile(comando, args, error => (error ? rechazar(error) : resolver()));
  });

/**
 * Lo más que se baja de una URL. Una foto de teléfono pesa unos pocos MB; una
 * dirección que devuelve algo mucho más grande no es una foto, y leerla
 * entera llenaría la memoria.
 */
export const TOPE_DE_BAJADA = 25 * 1024 * 1024;

/** Un origen con esquema —`https:`, `file:`, `data:`— es una URL; si no, una ruta local. */
const esquemaDe = (origen: string): string | null => /^([a-z][a-z0-9+.-]+):/i.exec(origen)?.[1]?.toLowerCase() ?? null;

/**
 * La URL como la escribe `new URL`: esquema en minúsculas, espacios
 * codificados y sin saltos de línea. Una que no se baja se escribe así en el
 * depósito, donde una línea con otra forma haría perder la sección entera.
 */
function urlNormalizada(origen: string): string {
  try {
    return new URL(origen.trim()).href;
  } catch {
    throw new Error(`La foto ${origen} no se puede traer: no es una URL válida.`);
  }
}

/** Un lienzo de `@napi-rs/canvas` con la forma del `<canvas>` que `achicar()` usa. */
function lienzoDeNode(): Lienzo {
  const canvas = createCanvas(1, 1);
  return {
    get width() { return canvas.width; },
    set width(v: number) { canvas.width = v; },
    get height() { return canvas.height; },
    set height(v: number) { canvas.height = v; },
    getContext: () => canvas.getContext('2d') as unknown as ReturnType<Lienzo['getContext']>,
    toBlob(alTerminar, tipo, calidad) {
      canvas.encode('jpeg', Math.round(calidad * 100)).then(
        bytes => { alTerminar(new Blob([new Uint8Array(bytes)], { type: tipo })); },
        () => { alTerminar(null); }
      );
    }
  };
}

const decodificar = async (blob: Blob): Promise<Imagen> =>
  loadImage(Buffer.from(await blob.arrayBuffer()));

/**
 * Los bytes de una URL. El pedido se corta solo: un servidor que acepta y no
 * contesta dejaría la herramienta colgada.
 */
async function bajar(url: string, pedir: NonNullable<DependenciasAchicar['fetch']>): Promise<Blob> {
  const motivo = (e: unknown): string => (e instanceof Error ? e.message : String(e));
  let respuesta: Response;
  try {
    respuesta = await pedir(url, { signal: AbortSignal.timeout(CORTE_DE_LECTURA) });
  } catch (e) {
    throw new NoSeBajo(url, motivo(e));
  }
  if (!respuesta.ok) throw new NoSeBajo(url, `el servidor contestó ${respuesta.status}`);
  const pasado = `pesa más de ${TOPE_DE_BAJADA / 1024 / 1024} MB`;
  if (Number(respuesta.headers.get('Content-Length')) > TOPE_DE_BAJADA) throw new NoSeBajo(url, pasado);
  if (!respuesta.body) return respuesta.blob();
  // Sin `Content-Length`, o con uno que miente: se cuenta lo leído.
  const lector = respuesta.body.getReader();
  const partes: Uint8Array[] = [];
  let leido = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      leido += value.byteLength;
      if (leido > TOPE_DE_BAJADA) {
        await lector.cancel().catch(() => {});
        throw new NoSeBajo(url, pasado);
      }
      partes.push(value);
    }
  } catch (e) {
    throw e instanceof NoSeBajo ? e : new NoSeBajo(url, motivo(e));
  }
  return new Blob(partes as BlobPart[], { type: respuesta.headers.get('Content-Type') ?? '' });
}

/**
 * Los bytes de un archivo local. Un HEIC —lo que saca un iPhone— no lo
 * decodifica el canvas: `sips`, que viene con macOS, lo pasa antes a JPEG en
 * un temporal que se borra al terminar.
 */
async function leerLocal(ruta: string, ejecutar: NonNullable<DependenciasAchicar['ejecutar']>): Promise<Blob> {
  const ext = extname(ruta).toLowerCase();
  if (ext !== '.heic' && ext !== '.heif') return new Blob([new Uint8Array(await readFile(ruta))]);
  const temporal = await mkdtemp(join(tmpdir(), 'recetario-heic-'));
  try {
    const salida = join(temporal, `${basename(ruta, extname(ruta))}.jpg`);
    await ejecutar('sips', ['-s', 'format', 'jpeg', ruta, '--out', salida]);
    return new Blob([new Uint8Array(await readFile(salida))]);
  } finally {
    await rm(temporal, { recursive: true, force: true });
  }
}

/**
 * La foto de `origen` —una ruta local o una URL— achicada a JPEG, como la
 * sube el editor. Una URL http o https que no se baja, o que pasa el tope,
 * rechaza con `NoSeBajo`. Cualquier otra falla —otro esquema, un archivo que
 * no está, que no es una foto o que no se decodifica— rechaza con un error
 * que nombra el origen, para que el agente sepa cuál de las fotos pedidas es.
 */
export async function achicarEnNode(
  origen: string,
  { fetch: pedir = fetch, ejecutar = ejecutarSinShell }: DependenciasAchicar = {}
): Promise<Blob> {
  const esquema = esquemaDe(origen.trim());
  // Sólo la web: `file:` o `data:` no son una foto que el agente vio en un
  // sitio, y una ruta local se pasa sin esquema.
  if (esquema !== null && esquema !== 'http' && esquema !== 'https') {
    throw new Error(`La foto ${origen} no se puede traer: una URL tiene que ser http o https, y un archivo local va como ruta, sin esquema.`);
  }
  const blob = esquema ? await bajar(urlNormalizada(origen), pedir) : await leerLocal(origen, ejecutar).catch((e: unknown) => {
    throw new Error(`No se pudo leer la foto ${origen}: ${e instanceof Error ? e.message : String(e)}`);
  });
  try {
    return await achicar(blob, lienzoDeNode, { decodificar });
  } catch (e) {
    throw new Error(`La foto ${origen} no se pudo decodificar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
