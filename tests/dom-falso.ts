/**
 * Andamiaje para los tests que ejercitan `main`.
 *
 * Los tests corren en `environment: 'node'`: no hay jsdom, y el DOM que usan
 * es un doble escrito a mano con los tres o cuatro métodos que `main` toca.
 * Montar eso sobre `global.document` pide un cast, porque el doble no
 * implementa la interfaz entera de `Document`. Estos helpers dejan el cast
 * dicho en un solo lugar, en vez de repetirlo en cada línea de cada test.
 */

/** Monta un doble en un global del navegador, afirmando el tipo que Node espera. */
export const comoGlobal = <T>(doble: unknown): T => doble as T;

/**
 * Saca los globales del navegador entre tests.
 *
 * `delete` sobre ellos necesita el cast: en los tipos de Node no son
 * opcionales, así que TypeScript los trata como propiedades que siempre están.
 */
export function limpiarGlobales(): void {
  const g = global as unknown as Record<string, unknown>;
  for (const clave of ['document', 'window', 'location', 'history']) delete g[clave];
}

/**
 * Un cliente de Identity Services que concede el token al primer pedido.
 *
 * Los tipos son los mismos que declara `src/gis.d.ts` —son globales
 * ambientales, no hace falta importarlos—, así que si el contrato del SDK
 * cambia, este doble deja de compilar en vez de seguir mintiendo.
 */
export function clienteGisFalso(token = 'tok-123'): ClienteToken {
  const c: ClienteToken = {
    callback: () => {},
    error_callback: () => {},
    requestAccessToken: () => c.callback({ access_token: token, expires_in: 3600 })
  };
  return c;
}

/** `window` con Identity Services ya cargado y respondiendo. */
export function windowConGis(): Window & typeof globalThis {
  return comoGlobal<Window & typeof globalThis>({
    google: { accounts: { oauth2: { initTokenClient: () => clienteGisFalso() } } }
  });
}
