// tests/auth-espera-gis.test.js
//
// El script de Identity Services carga con `async`, así que puede seguir
// bajando cuando auth.js ya se ejecuta: contra el sitio publicado esto pasó
// en la práctica y dejó a la app en "No pude arrancar: Google Identity no
// cargó" sin reintento automático. Estas pruebas verifican que auth.js
// espera a que aparezca `window.google.accounts.oauth2` en vez de
// asumirlo, con timers falsos para no depender de tiempo real.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { crearAuth } from '../src/auth.js';

function clienteGisFalso() {
  const c = {};
  c.requestAccessToken = () => c.callback({ access_token: 'tok-123', expires_in: 3600 });
  return c;
}

describe('auth.js: espera a que cargue Identity Services', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.window = {};
  });

  afterEach(() => {
    vi.useRealTimers();
    delete global.window;
  });

  it('si Google Identity termina de cargar después de arrancar, igual conecta', async () => {
    const auth = crearAuth();
    const promesa = auth.conectar();

    // Todavía no está: el sondeo sigue esperando sin resolver ni rechazar.
    await vi.advanceTimersByTimeAsync(150);

    // Ahora "termina de cargar" el script.
    global.window.google = { accounts: { oauth2: { initTokenClient: () => clienteGisFalso() } } };
    await vi.advanceTimersByTimeAsync(50);

    expect(await promesa).toBe('tok-123');
  });

  it('si nunca carga, rechaza con un mensaje claro en vez de quedar pendiente para siempre', async () => {
    const auth = crearAuth();
    const promesa = auth.conectar();
    const expectativa = expect(promesa).rejects.toThrow('Google Identity no cargó');
    await vi.advanceTimersByTimeAsync(8100);
    await expectativa;
  });
});
