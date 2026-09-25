// Los clientes de Drive y Sheets del MCP, envueltos para el login de
// escritorio. Un 401 puede llegar con un access token vigente por reloj pero
// revocado: se lo descarta y se repite el pedido una sola vez, que es seguro
// hasta en una escritura porque Google la rechazó antes de hacerla. Los errores
// de login y de permisos salen como `ErrorDeLogin`, con su código; el resto
// pasa tal cual, porque el store distingue, por ejemplo, el 404.
import { comoErrorDeLogin, type ErrorDeLogin } from './errores.js';

export interface GanchosDeLogin {
  /** Ante un 401: descartar el access token, para que el reintento pida otro. */
  alRechazar: () => void;
  /**
   * Cada error de login que sale. El arranque del store atrapa los errores de
   * Drive y devuelve sólo su mensaje; así el código no se pierde.
   */
  alFallar?: (error: ErrorDeLogin) => void;
}

const esRechazo = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { status?: unknown }).status === 401;

const esPromesa = (x: unknown): x is Promise<unknown> =>
  typeof x === 'object' && x !== null && typeof (x as { then?: unknown }).then === 'function';

/** El cliente con cada método asincrónico envuelto; lo demás queda igual. */
export function conLogin<T extends object>(cliente: T, ganchos: GanchosDeLogin): T {
  const traducir = (e: unknown): unknown => {
    const deLogin = comoErrorDeLogin(e);
    if (!deLogin) return e;
    ganchos.alFallar?.(deLogin);
    return deLogin;
  };

  return new Proxy(cliente, {
    get(objeto, clave, receptor) {
      const valor: unknown = Reflect.get(objeto, clave, receptor);
      if (typeof valor !== 'function') return valor;
      return (...args: unknown[]): unknown => {
        const llamar = (): unknown => Reflect.apply(valor, objeto, args);
        const primera = llamar();
        if (!esPromesa(primera)) return primera;
        return primera.catch(async (e: unknown) => {
          if (!esRechazo(e)) throw traducir(e);
          ganchos.alRechazar();
          try {
            return await llamar();
          } catch (otra) {
            throw traducir(otra);
          }
        });
      };
    }
  });
}
