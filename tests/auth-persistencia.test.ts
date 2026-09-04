// tests/auth-persistencia.test.js
//
// El flujo de OAuth de Identity Services es siempre por popup, incluso la
// renovación "silenciosa" — pasó en la práctica que aparecía en cada apertura
// de la página porque el token vivía solo en memoria y se perdía en cada
// recarga. Estas pruebas verifican que ahora sobrevive en localStorage.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { crearAuth } from '../src/auth.js';
import { comoGlobal, windowConGis } from './dom-falso.js';

function localStorageFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => (datos.has(k) ? datos.get(k)! : null),
    setItem: (k: string, v: unknown) => { datos.set(k, String(v)); },
    removeItem: (k: string) => { datos.delete(k); },
    _datos: datos
  };
}

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

  it('si localStorage no existe o está deshabilitado, sigue funcionando solo en memoria', async () => {
    // Sin global.localStorage: simula un navegador en modo privado que lo bloquea,
    // o un entorno (como Node en CI) que directamente no lo tiene.
    const auth = crearAuth();
    expect(await auth.token()).toBe('tok-123');
    expect(auth.olvidar).not.toThrow;
    expect(() => auth.olvidar()).not.toThrow();
  });
});
