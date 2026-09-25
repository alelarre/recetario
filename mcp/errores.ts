// Los errores de login del MCP: un código fijo y un texto claro, que el skill
// traduce a un paso concreto para el usuario. Nunca el mensaje crudo de Google.
// Aparte de `auth.ts` para que el loopback los use sin importarse en círculo.

export type CodigoAuth =
  | 'sin-cliente' | 'sin-permiso' | 'permiso-revocado' | 'usuario-no-habilitado'
  | 'cliente-interno' | 'api-deshabilitada' | 'scope-insuficiente' | 'sin-carpeta' | 'sin-red';

export const MENSAJES: Record<CodigoAuth, string> = {
  'sin-cliente':
    'Falta el cliente de Google del MCP: ~/.config/recetario/cliente.json no está, está mal formado o Google no lo reconoce. ' +
    'Hay que crear un cliente «Aplicación de escritorio» en Google Cloud y guardar ahí el JSON que se descarga.',
  'sin-permiso':
    'El MCP todavía no tiene permiso para usar el Drive. ' +
    'Hay que correr `npm run mcp:conectar` y dar permiso con la cuenta del Drive del recetario.',
  'permiso-revocado':
    'Google rechazó el permiso guardado: se revocó el acceso, se cambió la contraseña o venció ' +
    '(con el proyecto en modo Prueba dura 7 días). Hay que correr `npm run mcp:conectar` otra vez.',
  'usuario-no-habilitado':
    'Google no dio el permiso. Si tocaste Cancelar, corré `npm run mcp:conectar` de nuevo y aceptá. ' +
    'Si no, la cuenta no está entre los usuarios de prueba del proyecto: agregala en ' +
    'Pantalla de consentimiento → Usuarios de prueba.',
  'cliente-interno':
    'El proyecto de Google Cloud tiene el tipo de usuario «Interno». Hay que pasarlo a «Externo» en la pantalla de consentimiento.',
  'api-deshabilitada':
    'La Google Drive API o la Google Sheets API no está habilitada en el proyecto de Google Cloud. ' +
    'Hay que habilitar las dos en APIs y servicios → Biblioteca.',
  'scope-insuficiente':
    'El permiso dado no incluye el acceso completo a Drive. Hay que correr `npm run mcp:conectar` y aceptar el permiso completo.',
  'sin-carpeta':
    'La cuenta conectada no ve ninguna carpeta del recetario. Hay que conectarse con la cuenta del Drive del recetario, ' +
    'o abrir la app una vez para crear o elegir la carpeta.',
  'sin-red':
    'No hay conexión con Google. Hay que revisar la conexión y reintentar; no hace falta reconectar.'
};

/** El texto de `api-deshabilitada` cuando se sabe cuál de las dos APIs falta. */
function mensajeDeApi(api: string): string {
  return `La Google ${api} API no está habilitada en el proyecto de Google Cloud. ` +
    `Hay que habilitar «Google ${api} API» en APIs y servicios → Biblioteca.`;
}

export interface OpcionesError {
  /**
   * Lo que precisa el código: la API deshabilitada (`Drive` o `Sheets`) o el
   * `error` con que Google volvió del permiso.
   */
  detalle?: string;
  /** Un texto propio del momento, en lugar del de la tabla. */
  mensaje?: string;
}

export class ErrorDeLogin extends Error {
  readonly codigo: CodigoAuth;
  readonly detalle: string | undefined;
  constructor(codigo: CodigoAuth, opciones: OpcionesError = {}) {
    const { detalle, mensaje } = opciones;
    super(mensaje ?? (codigo === 'api-deshabilitada' && detalle ? mensajeDeApi(detalle) : MENSAJES[codigo]));
    this.name = 'ErrorDeLogin';
    this.codigo = codigo;
    this.detalle = detalle;
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
  // El endpoint de tokens contesta 401 `invalid_client` si el cliente del
  // archivo no existe o su secreto no es el suyo: es el archivo, no el permiso.
  if (cuerpo.includes('invalid_client')) return 'sin-cliente';
  if (cuerpo.includes('invalid_grant')) return 'permiso-revocado';
  if (cuerpo.includes('access_denied')) return 'usuario-no-habilitado';
  if (cuerpo.includes('org_internal')) return 'cliente-interno';
  // Un 401 de Drive o de Sheets es un token que Google ya no acepta.
  if (status === 401) return 'permiso-revocado';
  if (status === 403) {
    if (/accessNotConfigured|SERVICE_DISABLED/.test(cuerpo)) return 'api-deshabilitada';
    if (/insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/.test(cuerpo)) return 'scope-insuficiente';
  }
  return null;
}

/**
 * Cuál API está deshabilitada. Google la nombra en `details[].metadata.service`
 * (`sheets.googleapis.com`) o en el `message` («Google Drive API has not been
 * used…»); si nombra las dos o ninguna, no se sabe.
 */
function apiDe(cuerpo: string): string | undefined {
  const drive = /drive\.googleapis\.com|Drive API/.test(cuerpo);
  const sheets = /sheets\.googleapis\.com|Sheets API/.test(cuerpo);
  if (drive === sheets) return undefined;
  return drive ? 'Drive' : 'Sheets';
}

/** El `ErrorDeLogin` de una respuesta de Google, con su detalle; `null` si no es de login. */
export function errorDe(respuesta: RespuestaDeGoogle): ErrorDeLogin | null {
  const codigo = codigoDe(respuesta);
  if (!codigo) return null;
  if (codigo === 'api-deshabilitada' && !('red' in respuesta)) {
    const api = apiDe(respuesta.cuerpo);
    return new ErrorDeLogin(codigo, api ? { detalle: api } : {});
  }
  return new ErrorDeLogin(codigo);
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
  if (esErrorDeGoogle(error)) return errorDe({ status: error.status, cuerpo: error.message });
  return null;
}

/** Un error de Drive o de Sheets: trae el status, y en el mensaje, el cuerpo crudo de Google. */
export type ErrorDeGoogle = Error & { status: number };

export function esErrorDeGoogle(error: unknown): error is ErrorDeGoogle {
  return error instanceof Error && 'status' in error && typeof error.status === 'number';
}

/** El texto de un error de Google que no es de login, sin el cuerpo de la respuesta. */
export function mensajeDeGoogle(error: ErrorDeGoogle): string {
  return `Google respondió ${error.status} y no se pudo completar el pedido.`;
}
