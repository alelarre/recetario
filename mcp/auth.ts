// El login del MCP: OAuth de Google para una app de escritorio. La primera vez
// (`npm run mcp:conectar`) abre el navegador y recibe el código en un puerto
// local; el refresh token queda en el Llavero y de ahí en más el MCP renueva
// solo. Los errores de login salen con un código fijo y un texto claro, que el
// skill traduce a un paso concreto para el usuario; nunca el crudo de Google.
import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { SCOPE } from '../src/config.js';
import { abrirLoopback } from './loopback.js';
import { ErrorDeLogin, errorDe } from './errores.js';

export {
  ErrorDeLogin, MENSAJES, codigoDe, comoErrorDeLogin, errorDe,
  type CodigoAuth, type RespuestaDeGoogle
} from './errores.js';

export const RUTA_CLIENTE = join(homedir(), '.config', 'recetario', 'cliente.json');

/**
 * El canje del código recién dado que Google rechaza (`invalid_grant`) no es
 * un permiso revocado sino uno que no llegó a completarse: el código venció o
 * ya se usó. El paso es el mismo, pero el texto no habla de revocar.
 */
const MENSAJE_CANJE_FALLIDO =
  'El permiso no se pudo completar: Google no aceptó el código que volvió del navegador. ' +
  'Hay que correr `npm run mcp:conectar` de nuevo.';

const MENSAJE_ILEGIBLE = 'Google respondió algo que no se pudo leer. Hay que reintentar en un rato.';

/** Donde vive el refresh token: el Llavero de macOS (`llavero.ts`). */
export interface Llavero {
  leer(): Promise<string | null>;
  guardar(v: string): Promise<void>;
}

interface Cliente { clientId: string; clientSecret: string }

/** El JSON que descarga Google Cloud para una app de escritorio: `{ installed: {...} }`. */
async function leerCliente(ruta: string): Promise<Cliente> {
  let datos: unknown;
  try {
    datos = JSON.parse(await readFile(ruta, 'utf-8'));
  } catch {
    throw new ErrorDeLogin('sin-cliente');
  }
  const installed = (datos as { installed?: { client_id?: unknown; client_secret?: unknown } } | null)?.installed;
  const clientId = installed?.client_id;
  const clientSecret = installed?.client_secret;
  if (typeof clientId !== 'string' || !clientId || typeof clientSecret !== 'string' || !clientSecret) {
    throw new ErrorDeLogin('sin-cliente');
  }
  return { clientId, clientSecret };
}

const URL_CONSENTIMIENTO = 'https://accounts.google.com/o/oauth2/v2/auth';
const URL_TOKEN = 'https://oauth2.googleapis.com/token';

/** El access token se deja de usar un minuto antes de que venza. */
const MARGEN_VENCIMIENTO = 60_000;

interface RespuestaDeToken { access_token: string; expires_in: number; refresh_token?: string; scope?: string }

function aBase64Url(bytes: Buffer): string {
  return bytes.toString('base64url');
}

export interface OpcionesAuth {
  llavero: Llavero;
  abrirNavegador: (url: string) => void | Promise<void>;
  fetch: typeof fetch;
  /** El archivo del cliente; por defecto, `~/.config/recetario/cliente.json`. */
  rutaCliente?: string;
  ahora?: () => number;
}

export interface AuthEscritorio {
  token(): Promise<string>;
  conectar(): Promise<void>;
  /**
   * Descarta el access token en memoria. Se llama ante un 401 de Drive o de
   * Sheets: el token puede seguir vigente por reloj y aun así estar revocado.
   */
  olvidar(): void;
}

/** Un JSON de Google; si no lo es, un error fijo que no muestra el cuerpo. */
function leerJson<T>(texto: string): T {
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error(MENSAJE_ILEGIBLE);
  }
}

export function crearAuthEscritorio(opciones: OpcionesAuth): AuthEscritorio {
  const { llavero, abrirNavegador, fetch } = opciones;
  const rutaCliente = opciones.rutaCliente ?? RUTA_CLIENTE;
  const ahora = opciones.ahora ?? Date.now;

  let vigente: { token: string; vence: number } | null = null;
  let renovando: Promise<string> | null = null;

  /**
   * Un pedido al endpoint de tokens; cualquier falla sale como `ErrorDeLogin`
   * o con el status. `enCanje` es el canje del código que acaba de volver del
   * navegador, donde un `invalid_grant` tiene su propio texto.
   */
  async function pedirToken(parametros: Record<string, string>, enCanje = false): Promise<RespuestaDeToken> {
    let r: Response;
    try {
      r = await fetch(URL_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(parametros).toString()
      });
    } catch {
      throw new ErrorDeLogin('sin-red');
    }
    const texto = await r.text();
    if (!r.ok) {
      const error = errorDe({ status: r.status, cuerpo: texto });
      if (enCanje && error?.codigo === 'permiso-revocado') {
        throw new ErrorDeLogin('permiso-revocado', { mensaje: MENSAJE_CANJE_FALLIDO });
      }
      // El cuerpo de un error del endpoint de tokens no trae tokens, pero igual
      // no se muestra: el status alcanza para saber que no es de login.
      throw error ?? new Error(`Google respondió ${r.status} al pedir el token.`);
    }
    const datos = leerJson<Partial<RespuestaDeToken>>(texto);
    if (typeof datos.access_token !== 'string' || typeof datos.expires_in !== 'number') {
      throw new Error('Google respondió sin access token.');
    }
    // Sin el scope completo de Drive el MCP no ve los `.md` que escribe otro.
    if (datos.scope !== undefined && !datos.scope.split(' ').includes(SCOPE)) {
      throw new ErrorDeLogin('scope-insuficiente');
    }
    return datos as RespuestaDeToken;
  }

  function recordar(respuesta: RespuestaDeToken): string {
    vigente = { token: respuesta.access_token, vence: ahora() + respuesta.expires_in * 1000 };
    return respuesta.access_token;
  }

  async function renovar(): Promise<string> {
    const cliente = await leerCliente(rutaCliente);
    const refresco = await llavero.leer();
    if (!refresco) throw new ErrorDeLogin('sin-permiso');
    return recordar(await pedirToken({
      grant_type: 'refresh_token',
      refresh_token: refresco,
      client_id: cliente.clientId,
      client_secret: cliente.clientSecret
    }));
  }

  return {
    async token() {
      if (vigente && ahora() < vigente.vence - MARGEN_VENCIMIENTO) return vigente.token;
      // Varias herramientas pueden pedir el token a la vez: una sola renovación.
      renovando ??= renovar().finally(() => { renovando = null; });
      return renovando;
    },

    async conectar() {
      const cliente = await leerCliente(rutaCliente);
      const state = aBase64Url(randomBytes(24));
      const verificador = aBase64Url(randomBytes(48));
      const desafio = aBase64Url(createHash('sha256').update(verificador).digest());

      const loopback = await abrirLoopback(state);
      try {
        const url = new URL(URL_CONSENTIMIENTO);
        url.search = new URLSearchParams({
          client_id: cliente.clientId,
          redirect_uri: loopback.redirect,
          response_type: 'code',
          scope: SCOPE,
          access_type: 'offline',
          prompt: 'consent',
          state,
          code_challenge: desafio,
          code_challenge_method: 'S256'
        }).toString();
        await abrirNavegador(url.toString());
        const codigo = await loopback.vuelta;

        const respuesta = await pedirToken({
          grant_type: 'authorization_code',
          code: codigo,
          code_verifier: verificador,
          redirect_uri: loopback.redirect,
          client_id: cliente.clientId,
          client_secret: cliente.clientSecret
        }, true);
        // Con `prompt=consent` Google siempre manda un refresh token nuevo.
        if (!respuesta.refresh_token) throw new ErrorDeLogin('sin-permiso');
        await llavero.guardar(respuesta.refresh_token);
        recordar(respuesta);
      } finally {
        loopback.cerrar();
      }
    },

    olvidar() {
      vigente = null;
    }
  };
}

/** El correo de la cuenta conectada, para que `mcp:conectar` diga con cuál quedó. */
export async function cuentaConectada(fetchGoogle: typeof fetch, token: string): Promise<string> {
  let r: Response;
  try {
    r = await fetchGoogle('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    throw new ErrorDeLogin('sin-red');
  }
  const texto = await r.text();
  if (!r.ok) {
    throw errorDe({ status: r.status, cuerpo: texto }) ?? new Error(`Drive respondió ${r.status} al preguntar la cuenta.`);
  }
  const datos = leerJson<{ user?: { emailAddress?: string } }>(texto);
  return datos.user?.emailAddress ?? '(sin correo)';
}
