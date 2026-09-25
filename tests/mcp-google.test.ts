// Los clientes de Drive y Sheets del MCP: un 401 descarta el token y reintenta
// una sola vez, y los errores de permisos salen como `ErrorDeLogin`.
import { describe, it, expect } from 'vitest';
import { conLogin } from '../mcp/google.js';
import { ErrorDeLogin } from '../mcp/errores.js';

const conStatus = (status: number, cuerpo: string): Error => Object.assign(new Error(cuerpo), { status });

/** Un cliente que falla con los errores de `fallas`, en orden, y después contesta. */
function clienteQueFalla(fallas: unknown[]) {
  const api = {
    llamadas: 0,
    async leer(x: string): Promise<string> {
      api.llamadas++;
      const falla = fallas.shift();
      if (falla !== undefined) throw falla;
      return `leído ${x}`;
    },
    sincronico: (): number => 7
  };
  return api;
}

function envolver(fallas: unknown[]) {
  const cliente = clienteQueFalla(fallas);
  const auth = { olvidadas: 0, olvidar() { auth.olvidadas++; } };
  const errores: ErrorDeLogin[] = [];
  const envuelto = conLogin(cliente, { alRechazar: () => auth.olvidar(), alFallar: e => errores.push(e) });
  return { cliente, auth, errores, envuelto };
}

describe('conLogin', () => {
  it('sin errores, llama una vez y devuelve lo mismo', async () => {
    const { cliente, envuelto, auth } = envolver([]);
    expect(await envuelto.leer('a')).toBe('leído a');
    expect(cliente.llamadas).toBe(1);
    expect(auth.olvidadas).toBe(0);
  });

  it('deja las funciones sincrónicas como están', () => {
    const { envuelto } = envolver([]);
    expect(envuelto.sincronico()).toBe(7);
  });

  it('ante un 401 olvida el token y reintenta una vez', async () => {
    const { cliente, envuelto, auth } = envolver([conStatus(401, '{"error":{"code":401}}')]);
    expect(await envuelto.leer('a')).toBe('leído a');
    expect(cliente.llamadas).toBe(2);
    expect(auth.olvidadas).toBe(1);
  });

  it('dos 401 seguidos son permiso-revocado, sin un tercer intento', async () => {
    const { cliente, envuelto, errores } = envolver([conStatus(401, 'no'), conStatus(401, 'no')]);
    const error = await envuelto.leer('a').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeLogin);
    expect((error as ErrorDeLogin).codigo).toBe('permiso-revocado');
    expect(cliente.llamadas).toBe(2);
    expect(errores.map(e => e.codigo)).toEqual(['permiso-revocado']);
  });

  it('un 403 de API deshabilitada es api-deshabilitada, sin reintentar', async () => {
    const cuerpo = '{"error":{"code":403,"message":"Google Sheets API has not been used","status":"PERMISSION_DENIED","details":[{"reason":"SERVICE_DISABLED"}]}}';
    const { cliente, envuelto, auth } = envolver([conStatus(403, cuerpo)]);
    const error = await envuelto.leer('a').catch((e: unknown) => e);
    expect((error as ErrorDeLogin).codigo).toBe('api-deshabilitada');
    expect((error as ErrorDeLogin).detalle).toBe('Sheets');
    expect(cliente.llamadas).toBe(1);
    expect(auth.olvidadas).toBe(0);
  });

  it('sin conexión es sin-red', async () => {
    const { envuelto } = envolver([new TypeError('fetch failed')]);
    const error = await envuelto.leer('a').catch((e: unknown) => e);
    expect((error as ErrorDeLogin).codigo).toBe('sin-red');
  });

  it('un error que no es de login pasa tal cual: el store distingue el 404', async () => {
    const noEsta = conStatus(404, 'File not found');
    const { envuelto, errores } = envolver([noEsta]);
    expect(await envuelto.leer('a').catch((e: unknown) => e)).toBe(noEsta);
    expect(errores).toEqual([]);
  });
});
