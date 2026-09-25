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

export type CodigoAuth =
  | 'sin-cliente' | 'sin-permiso' | 'permiso-revocado' | 'usuario-no-habilitado'
  | 'cliente-interno' | 'api-deshabilitada' | 'scope-insuficiente' | 'sin-carpeta' | 'sin-red';

export const RUTA_CLIENTE = join(homedir(), '.config', 'recetario', 'cliente.json');

export const MENSAJES: Record<CodigoAuth, string> = {
  'sin-cliente':
    'Falta el cliente de Google del MCP: ~/.config/recetario/cliente.json no está o está mal formado. ' +
    'Hay que crear un cliente «Aplicación de escritorio» en Google Cloud y guardar ahí el JSON que se descarga.',
  'sin-permiso':
    'El MCP todavía no tiene permiso para usar el Drive. ' +
    'Hay que correr `npm run mcp:conectar` y dar permiso con la cuenta del Drive del recetario.',
  'permiso-revocado':
    'Google rechazó el permiso guardado: se revocó el acceso, se cambió la contraseña o venció ' +
    '(con el proyecto en modo Prueba dura 7 días). Hay que correr `npm run mcp:conectar` otra vez.',
  'usuario-no-habilitado':
    'Google no dio el permiso: la cuenta no está entre los usuarios de prueba del proyecto, o se canceló. ' +
    'Hay que agregarla en Pantalla de consentimiento → Usuarios de prueba.',
  'cliente-interno':
    'El proyecto de Google Cloud tiene el tipo de usuario «Interno». Hay que pasarlo a «Externo» en la pantalla de consentimiento.',
  'api-deshabilitada':
    'La API de Drive o la de Sheets no está habilitada en el proyecto de Google Cloud. ' +
    'Hay que habilitarla en APIs y servicios → Biblioteca.',
  'scope-insuficiente':
    'El permiso dado no incluye el acceso completo a Drive. Hay que correr `npm run mcp:conectar` y aceptar el permiso completo.',
  'sin-carpeta':
    'La cuenta conectada no ve ninguna carpeta del recetario. Hay que conectarse con la cuenta del Drive del recetario, ' +
    'o abrir la app una vez para crear o elegir la carpeta.',
  'sin-red':
    'No hay conexión con Google. Hay que revisar la conexión y reintentar; no hace falta reconectar.'
};

export class ErrorDeLogin extends Error {
  readonly codigo: CodigoAuth;
  constructor(codigo: CodigoAuth) {
    super(MENSAJES[codigo]);
    this.name = 'ErrorDeLogin';
    this.codigo = codigo;
  }
}

/** Lo que contestó Google, o que ni siquiera se llegó. */
export type RespuestaDeGoogle = { red: true } | { status?: number; cuerpo: string };

/**
 * El código que corresponde a una respuesta de Google, o `null` si no es un
 * problema de login o de permisos. Se busca en el texto: los errores de OAuth
 * (`{"error":"invalid_grant"}`), los de las APIs (`reason` en `errors` o en
 * `details`) y el `error` del redirect llegan con formas distintas.
 */
export function codigoDe(respuesta: RespuestaDeGoogle): CodigoAuth | null {
  if ('red' in respuesta) return 'sin-red';
  const { status, cuerpo } = respuesta;
  if (cuerpo.includes('invalid_grant')) return 'permiso-revocado';
  if (cuerpo.includes('access_denied')) return 'usuario-no-habilitado';
  if (cuerpo.includes('org_internal')) return 'cliente-interno';
  if (status === 403) {
    if (/accessNotConfigured|SERVICE_DISABLED/.test(cuerpo)) return 'api-deshabilitada';
    if (/insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/.test(cuerpo)) return 'scope-insuficiente';
  }
  return null;
}

/**
 * Un `fetch` de Node que no llegó al servidor rechaza con `TypeError('fetch
 * failed')`; una lectura cortada por `AbortSignal.timeout`, con un
 * `TimeoutError`. Cualquier otro `TypeError` es un error de programación y no
 * se disfraza de falta de conexión.
 */
function esFallaDeRed(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error instanceof TypeError && error.message === 'fetch failed') || error.name === 'TimeoutError';
}

/**
 * Un error de un pedido a Google (un `ErrorDeDrive` o de Sheets, que llevan el
 * cuerpo en el mensaje y el `status`, o un `fetch` que no llegó) como
 * `ErrorDeLogin`; `null` si es otra cosa y hay que dejarlo pasar.
 */
export function comoErrorDeLogin(error: unknown): ErrorDeLogin | null {
  if (error instanceof ErrorDeLogin) return error;
  if (esFallaDeRed(error)) return new ErrorDeLogin('sin-red');
  if (error instanceof Error && 'status' in error && typeof error.status === 'number') {
    const codigo = codigoDe({ status: error.status, cuerpo: error.message });
    return codigo ? new ErrorDeLogin(codigo) : null;
  }
  return null;
}

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
}

export function crearAuthEscritorio(opciones: OpcionesAuth): AuthEscritorio {
  const { llavero, abrirNavegador, fetch } = opciones;
  const rutaCliente = opciones.rutaCliente ?? RUTA_CLIENTE;
  const ahora = opciones.ahora ?? Date.now;

  let vigente: { token: string; vence: number } | null = null;
  let renovando: Promise<string> | null = null;

  /** Un pedido al endpoint de tokens; cualquier falla sale como `ErrorDeLogin` o con el status. */
  async function pedirToken(parametros: Record<string, string>): Promise<RespuestaDeToken> {
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
      const codigo = codigoDe({ status: r.status, cuerpo: texto });
      // El cuerpo de un error del endpoint de tokens no trae tokens, pero igual
      // no se muestra: el status alcanza para saber que no es de login.
      throw codigo ? new ErrorDeLogin(codigo) : new Error(`Google respondió ${r.status} al pedir el token.`);
    }
    const datos = JSON.parse(texto) as Partial<RespuestaDeToken>;
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
        const vuelta = await loopback.vuelta;
        if ('error' in vuelta) {
          const traducido = codigoDe({ cuerpo: vuelta.error });
          throw traducido ? new ErrorDeLogin(traducido) : new Error(`Google no dio el permiso (${vuelta.error}).`);
        }

        const respuesta = await pedirToken({
          grant_type: 'authorization_code',
          code: vuelta.codigo,
          code_verifier: verificador,
          redirect_uri: loopback.redirect,
          client_id: cliente.clientId,
          client_secret: cliente.clientSecret
        });
        // Con `prompt=consent` Google siempre manda un refresh token nuevo.
        if (!respuesta.refresh_token) throw new ErrorDeLogin('sin-permiso');
        await llavero.guardar(respuesta.refresh_token);
        recordar(respuesta);
      } finally {
        loopback.cerrar();
      }
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
    const codigo = codigoDe({ status: r.status, cuerpo: texto });
    throw codigo ? new ErrorDeLogin(codigo) : new Error(`Drive respondió ${r.status} al preguntar la cuenta.`);
  }
  const datos = JSON.parse(texto) as { user?: { emailAddress?: string } };
  return datos.user?.emailAddress ?? '(sin correo)';
}
