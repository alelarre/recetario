// El flujo de OAuth de Identity Services es siempre por popup, incluso la
// renovación "silenciosa" — pasó en la práctica que aparecía en cada apertura
// de la página porque el token vivía solo en memoria y se perdía en cada
// recarga. Acá se verifica que sobrevive en localStorage.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { crearAuth } from '../src/auth.js';
import { comoGlobal, windowConGis, localStorageFalso } from './dom-falso.js';

describe('auth.js: persistencia del token entre aperturas', () => {
  beforeEach(() => {
    global.window = windowConGis();
  });

  afterEach(() => {
    const g = global as unknown as Record<string, unknown>;
    delete g['window'];
    delete g['localStorage'];
  });

  it('con un token guardado y todavía vigente, no vuelve a pedirle nada a Google', async () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-auth', JSON.stringify({ token: 'guardado', vence: Date.now() + 60000 }));

    // Si volviera a pedir, explotaría acá: no hay cliente de GIS configurado para responder.
    global.window.google!.accounts!.oauth2!.initTokenClient = () => {
      throw new Error('no debería llamar a Google');
    };

    const auth = crearAuth();
    expect(await auth.token()).toBe('guardado');
  });

  it('con un token guardado pero vencido, pide uno nuevo', async () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-auth', JSON.stringify({ token: 'viejo', vence: Date.now() - 1000 }));

    const auth = crearAuth();
    expect(await auth.token()).toBe('tok-123');
  });

  it('después de conseguir un token nuevo, lo deja guardado para la próxima apertura', async () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    const auth = crearAuth();
    await auth.token();

    const guardado = JSON.parse(global.localStorage.getItem('recetario-auth') ?? 'null');
    expect(guardado.token).toBe('tok-123');
    expect(guardado.vence).toBeGreaterThan(Date.now());
  });

  it('olvidar() borra lo guardado, no solo lo que hay en memoria', async () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    const auth = crearAuth();
    await auth.token();
    auth.olvidar();

    expect(global.localStorage.getItem('recetario-auth')).toBeNull();
  });

  it('olvidar() revoca el token en Google: un token copiado deja de servir', async () => {
    const revocados: string[] = [];
    global.window.google!.accounts!.oauth2!.revoke = (t: string) => { revocados.push(t); };
    const auth = crearAuth();
    await auth.token();
    auth.olvidar();

    expect(revocados).toEqual(['tok-123']);
  });

  it('olvidar() sin token no le pide nada a Google', () => {
    const revocados: string[] = [];
    global.window.google!.accounts!.oauth2!.revoke = (t: string) => { revocados.push(t); };
    crearAuth().olvidar();

    expect(revocados).toEqual([]);
  });

  it('con el token vencido, dos llamadas concurrentes a token() comparten una sola renovación', async () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-auth', JSON.stringify({ token: 'viejo', vence: Date.now() - 1000 }));

    let pedidos = 0;
    global.window.google!.accounts!.oauth2!.initTokenClient = () => {
      const c: ClienteToken = {
        callback: () => {},
        error_callback: () => {},
        requestAccessToken: () => { pedidos++; c.callback({ access_token: 'tok-123', expires_in: 3600 }); }
      };
      return c;
    };

    const auth = crearAuth();
    const [a, b] = await Promise.all([auth.token(), auth.token()]);

    expect(pedidos).toBe(1);
    expect(a).toBe('tok-123');
    expect(b).toBe('tok-123');
  });

  it('si localStorage no existe o está deshabilitado, sigue funcionando solo en memoria', async () => {
    // Sin global.localStorage: simula un navegador en modo privado que lo bloquea,
    // o un entorno (como Node en CI) que directamente no lo tiene.
    const auth = crearAuth();
    expect(await auth.token()).toBe('tok-123');
    expect(auth.olvidar).not.toThrow;
    expect(() => auth.olvidar()).not.toThrow();
  });
});
