// El login de escritorio del MCP, sin red, sin el Llavero real y sin
// navegador: Google es un `fetch` falso y el navegador es una función que
// hace el pedido de vuelta al loopback local, como haría Google al redirigir.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  crearAuthEscritorio, codigoDe, comoErrorDeLogin, cuentaConectada, ErrorDeLogin,
  MENSAJES, type Llavero
} from '../mcp/auth.js';
import { crearLlaveroMac, type EjecutarComando } from '../mcp/llavero.js';

const SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive';

let carpeta: string;
let rutaCliente: string;

beforeEach(() => {
  carpeta = mkdtempSync(join(tmpdir(), 'recetario-auth-'));
  rutaCliente = join(carpeta, 'cliente.json');
  writeFileSync(rutaCliente, JSON.stringify({
    installed: {
      client_id: 'id-de-prueba.apps.googleusercontent.com',
      project_id: 'recetario',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      client_secret: 'secreto-de-prueba',
      redirect_uris: ['http://localhost']
    }
  }));
});

afterEach(() => {
  rmSync(carpeta, { recursive: true, force: true });
});

function llaveroFalso(inicial: string | null = null): Llavero & { valor: string | null } {
  const llavero = {
    valor: inicial,
    async leer() { return llavero.valor; },
    async guardar(v: string) { llavero.valor = v; }
  };
  return llavero;
}

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
}

interface Pedido { url: string; cuerpo: URLSearchParams }

/** Un Google falso: registra los pedidos y contesta con `responder`. */
function googleFalso(responder: (p: Pedido) => Response | Promise<Response>) {
  const pedidos: Pedido[] = [];
  const fetchFalso = (async (entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada);
    const cuerpo = new URLSearchParams(typeof init?.body === 'string' ? init.body : String(init?.body ?? ''));
    const pedido = { url, cuerpo };
    pedidos.push(pedido);
    return responder(pedido);
  }) as typeof fetch;
  return { fetch: fetchFalso, pedidos };
}

const nuncaAbre = () => { throw new Error('no tenía que abrir el navegador'); };

describe('mcp/auth: el cliente de escritorio', () => {
  it('sin el archivo del cliente, token() falla con sin-cliente', async () => {
    const { fetch } = googleFalso(() => json({}));
    const auth = crearAuthEscritorio({
      llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch,
      rutaCliente: join(carpeta, 'no-existe.json')
    });
    await expect(auth.token()).rejects.toMatchObject({ codigo: 'sin-cliente' });
  });

  it('con el archivo mal formado, falla con sin-cliente', async () => {
    const { fetch } = googleFalso(() => json({}));
    for (const contenido of ['{ no es json', '{}', JSON.stringify({ installed: { client_id: 'x' } }), JSON.stringify({ web: { client_id: 'x', client_secret: 'y' } })]) {
      writeFileSync(rutaCliente, contenido);
      const auth = crearAuthEscritorio({ llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch, rutaCliente });
      await expect(auth.token()).rejects.toMatchObject({ codigo: 'sin-cliente' });
      await expect(auth.conectar()).rejects.toMatchObject({ codigo: 'sin-cliente' });
    }
  });

  it('sin refresh token en el Llavero, token() falla con sin-permiso y no pide nada a Google', async () => {
    const google = googleFalso(() => json({}));
    const auth = crearAuthEscritorio({ llavero: llaveroFalso(null), abrirNavegador: nuncaAbre, fetch: google.fetch, rutaCliente });
    const error = await auth.token().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorDeLogin);
    expect(error).toMatchObject({ codigo: 'sin-permiso', message: MENSAJES['sin-permiso'] });
    expect(google.pedidos).toEqual([]);
  });
});

describe('mcp/auth: conectar', () => {
  it('pide permiso con drive, offline, consent y PKCE; canjea el código y guarda el refresh token', async () => {
    let urlAbierta = '';
    const google = googleFalso(({ cuerpo }) => {
      const desafio = new URL(urlAbierta).searchParams.get('code_challenge');
      const verificador = cuerpo.get('code_verifier') ?? '';
      const calculado = createHash('sha256').update(verificador).digest('base64url');
      if (cuerpo.get('code') !== 'codigo-del-navegador' || calculado !== desafio) {
        return json({ error: 'invalid_grant' }, 400);
      }
      return json({ access_token: 'acceso-1', expires_in: 3599, refresh_token: 'refresco-nuevo', scope: SCOPE_DRIVE });
    });
    const llavero = llaveroFalso('refresco-viejo');
    const auth = crearAuthEscritorio({
      llavero, fetch: google.fetch, rutaCliente,
      abrirNavegador: async (url) => {
        urlAbierta = url;
        const p = new URL(url).searchParams;
        const vuelta = new URL(p.get('redirect_uri') ?? '');
        vuelta.searchParams.set('code', 'codigo-del-navegador');
        vuelta.searchParams.set('state', p.get('state') ?? '');
        // El navegador vuelve al loopback: un pedido real a 127.0.0.1.
        void globalThis.fetch(vuelta);
      }
    });

    await auth.conectar();

    const url = new URL(urlAbierta);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    const p = url.searchParams;
    expect(p.get('client_id')).toBe('id-de-prueba.apps.googleusercontent.com');
    expect(p.get('scope')).toBe(SCOPE_DRIVE);
    expect(p.get('access_type')).toBe('offline');
    expect(p.get('prompt')).toBe('consent');
    expect(p.get('response_type')).toBe('code');
    expect(p.get('code_challenge_method')).toBe('S256');
    expect(p.get('state')).toMatch(/^[\w-]{16,}$/);
    expect(p.get('redirect_uri')).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const canje = google.pedidos[0];
    expect(canje.url).toBe('https://oauth2.googleapis.com/token');
    expect(canje.cuerpo.get('grant_type')).toBe('authorization_code');
    expect(canje.cuerpo.get('client_secret')).toBe('secreto-de-prueba');
    expect(canje.cuerpo.get('redirect_uri')).toBe(p.get('redirect_uri'));
    expect(llavero.valor).toBe('refresco-nuevo');

    // El access token del canje ya sirve: token() no vuelve a pedir.
    expect(await auth.token()).toBe('acceso-1');
    expect(google.pedidos).toHaveLength(1);
  });

  it('un state que no coincide no canjea nada y el loopback se cierra', async () => {
    const google = googleFalso(() => json({ access_token: 'a', expires_in: 3600, refresh_token: 'r' }));
    const llavero = llaveroFalso(null);
    let redirect = '';
    const auth = crearAuthEscritorio({
      llavero, fetch: google.fetch, rutaCliente,
      abrirNavegador: async (url) => {
        redirect = new URL(url).searchParams.get('redirect_uri') ?? '';
        void globalThis.fetch(`${redirect}/?code=robado&state=otro`);
      }
    });
    await expect(auth.conectar()).rejects.toThrow(/no corresponde/);
    expect(google.pedidos).toEqual([]);
    expect(llavero.valor).toBeNull();
    await expect(globalThis.fetch(redirect)).rejects.toThrow();
  });

  it('si Google vuelve con access_denied, falla con usuario-no-habilitado', async () => {
    const google = googleFalso(() => json({}));
    const auth = crearAuthEscritorio({
      llavero: llaveroFalso(null), fetch: google.fetch, rutaCliente,
      abrirNavegador: async (url) => {
        const p = new URL(url).searchParams;
        void globalThis.fetch(`${p.get('redirect_uri')}/?error=access_denied&state=${p.get('state')}`);
      }
    });
    await expect(auth.conectar()).rejects.toMatchObject({ codigo: 'usuario-no-habilitado' });
    expect(google.pedidos).toEqual([]);
  });

  it('si el permiso aceptado no incluye drive, falla con scope-insuficiente y no guarda', async () => {
    const google = googleFalso(() => json({
      access_token: 'a', expires_in: 3600, refresh_token: 'r',
      scope: 'https://www.googleapis.com/auth/drive.file'
    }));
    const llavero = llaveroFalso(null);
    const auth = crearAuthEscritorio({
      llavero, fetch: google.fetch, rutaCliente,
      abrirNavegador: async (url) => {
        const p = new URL(url).searchParams;
        void globalThis.fetch(`${p.get('redirect_uri')}/?code=c&state=${p.get('state')}`);
      }
    });
    await expect(auth.conectar()).rejects.toMatchObject({ codigo: 'scope-insuficiente' });
    expect(llavero.valor).toBeNull();
  });
});

describe('mcp/auth: token', () => {
  it('renueva con el refresh token y usa el access token hasta un minuto antes de que venza', async () => {
    let reloj = 1_000_000;
    let n = 0;
    const google = googleFalso(() => json({ access_token: `acceso-${++n}`, expires_in: 3600, scope: SCOPE_DRIVE }));
    const auth = crearAuthEscritorio({
      llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch: google.fetch, rutaCliente,
      ahora: () => reloj
    });

    expect(await auth.token()).toBe('acceso-1');
    const pedido = google.pedidos[0];
    expect(pedido.url).toBe('https://oauth2.googleapis.com/token');
    expect(pedido.cuerpo.get('grant_type')).toBe('refresh_token');
    expect(pedido.cuerpo.get('refresh_token')).toBe('refresco');
    expect(pedido.cuerpo.get('client_id')).toBe('id-de-prueba.apps.googleusercontent.com');

    reloj += (3600 - 61) * 1000;
    expect(await auth.token()).toBe('acceso-1');
    expect(google.pedidos).toHaveLength(1);

    reloj += 2000;
    expect(await auth.token()).toBe('acceso-2');
    expect(google.pedidos).toHaveLength(2);
  });

  it('dos pedidos a la vez hacen una sola renovación', async () => {
    const google = googleFalso(() => json({ access_token: 'acceso', expires_in: 3600 }));
    const auth = crearAuthEscritorio({ llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch: google.fetch, rutaCliente });
    expect(await Promise.all([auth.token(), auth.token()])).toEqual(['acceso', 'acceso']);
    expect(google.pedidos).toHaveLength(1);
  });

  it('un refresh token rechazado es permiso-revocado, con el texto claro y sin el crudo de Google', async () => {
    const google = googleFalso(() => json({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, 400));
    const auth = crearAuthEscritorio({ llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch: google.fetch, rutaCliente });
    const error = await auth.token().catch((e: unknown) => e);
    expect(error).toMatchObject({ codigo: 'permiso-revocado', message: MENSAJES['permiso-revocado'] });
    expect((error as Error).message).not.toContain('expired or revoked');
  });

  it('sin conexión, falla con sin-red', async () => {
    const fetchCaido = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
    const auth = crearAuthEscritorio({ llavero: llaveroFalso('refresco'), abrirNavegador: nuncaAbre, fetch: fetchCaido, rutaCliente });
    await expect(auth.token()).rejects.toMatchObject({ codigo: 'sin-red' });
  });
});

describe('mcp/auth: codigoDe', () => {
  const casos: [string, Parameters<typeof codigoDe>[0], string | null][] = [
    ['invalid_grant', { status: 400, cuerpo: '{"error":"invalid_grant","error_description":"Bad Request"}' }, 'permiso-revocado'],
    ['access_denied', { cuerpo: 'access_denied' }, 'usuario-no-habilitado'],
    ['403 org_internal', { status: 403, cuerpo: 'Error 403: org_internal' }, 'cliente-interno'],
    ['403 accessNotConfigured', {
      status: 403,
      cuerpo: JSON.stringify({ error: { code: 403, errors: [{ reason: 'accessNotConfigured' }], status: 'PERMISSION_DENIED' } })
    }, 'api-deshabilitada'],
    ['403 SERVICE_DISABLED', {
      status: 403,
      cuerpo: JSON.stringify({ error: { code: 403, status: 'PERMISSION_DENIED', details: [{ reason: 'SERVICE_DISABLED' }] } })
    }, 'api-deshabilitada'],
    ['403 insufficientPermissions', {
      status: 403,
      cuerpo: JSON.stringify({ error: { code: 403, errors: [{ reason: 'insufficientPermissions' }] } })
    }, 'scope-insuficiente'],
    ['403 ACCESS_TOKEN_SCOPE_INSUFFICIENT', {
      status: 403,
      cuerpo: JSON.stringify({ error: { code: 403, details: [{ reason: 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' }] } })
    }, 'scope-insuficiente'],
    ['error de red', { red: true }, 'sin-red'],
    ['un 404 cualquiera', { status: 404, cuerpo: '{"error":{"code":404}}' }, null],
    ['un 403 de otra cosa', { status: 403, cuerpo: '{"error":{"errors":[{"reason":"forbidden"}]}}' }, null]
  ];
  for (const [nombre, respuesta, codigo] of casos) {
    it(`${nombre} → ${codigo}`, () => {
      expect(codigoDe(respuesta)).toBe(codigo);
    });
  }

  it('comoErrorDeLogin traduce un error de Drive o de red, y deja pasar el resto', () => {
    const deDrive = Object.assign(new Error('{"error":{"errors":[{"reason":"accessNotConfigured"}]}}'), { status: 403 });
    expect(comoErrorDeLogin(deDrive)).toMatchObject({ codigo: 'api-deshabilitada', message: MENSAJES['api-deshabilitada'] });
    expect(comoErrorDeLogin(new TypeError('fetch failed'))).toMatchObject({ codigo: 'sin-red' });
    expect(comoErrorDeLogin(Object.assign(new Error('no encontrado'), { status: 404 }))).toBeNull();
    const yaTraducido = new ErrorDeLogin('sin-carpeta');
    expect(comoErrorDeLogin(yaTraducido)).toBe(yaTraducido);
  });

  it('cada código tiene su texto claro', () => {
    for (const [codigo, mensaje] of Object.entries(MENSAJES)) {
      const error = new ErrorDeLogin(codigo as keyof typeof MENSAJES);
      expect(error.message).toBe(mensaje);
      expect(error.name).toBe('ErrorDeLogin');
    }
  });
});

describe('mcp/auth: cuentaConectada', () => {
  it('pregunta a Drive el correo de la cuenta con el token', async () => {
    let autorizacion = '';
    const fetchFalso = (async (url: string | URL | Request, init?: RequestInit) => {
      autorizacion = new Headers(init?.headers).get('Authorization') ?? '';
      expect(String(url)).toContain('https://www.googleapis.com/drive/v3/about');
      return json({ user: { emailAddress: 'ale@example.com' } });
    }) as typeof fetch;
    expect(await cuentaConectada(fetchFalso, 'tok')).toBe('ale@example.com');
    expect(autorizacion).toBe('Bearer tok');
  });
});

describe('mcp/llavero: el Llavero de macOS con `security`', () => {
  function ejecutarFalso(respuestas: { codigo: number; salida?: string }[]) {
    const llamadas: { comando: string; args: string[]; entrada: string | undefined }[] = [];
    const ejecutar: EjecutarComando = async (comando, args, entrada) => {
      llamadas.push({ comando, args, entrada });
      const r = respuestas.shift() ?? { codigo: 0 };
      return { codigo: r.codigo, salida: r.salida ?? '' };
    };
    return { ejecutar, llamadas };
  }

  it('guarda el token por stdin, nunca como argumento, y verifica que quedó', async () => {
    const token = '1//0gAb-c_d/e.f';
    const { ejecutar, llamadas } = ejecutarFalso([{ codigo: 0 }, { codigo: 0, salida: `${token}\n` }]);
    await crearLlaveroMac({ ejecutar, cuenta: 'ale' }).guardar(token);
    expect(llamadas[0].comando).toBe('security');
    expect(llamadas[0].args).toEqual(['-i']);
    expect(llamadas[0].entrada).toBe(`add-generic-password -U -s recetario-mcp -a ale -w "${token}"\n`);
    for (const l of llamadas) expect(l.args.join(' ')).not.toContain(token);
    expect(llamadas[1].args).toEqual(['find-generic-password', '-s', 'recetario-mcp', '-w']);
  });

  it('si al releer no está lo que se guardó, falla', async () => {
    const { ejecutar } = ejecutarFalso([{ codigo: 0 }, { codigo: 44 }]);
    await expect(crearLlaveroMac({ ejecutar, cuenta: 'ale' }).guardar('tok')).rejects.toThrow(/Llavero/);
  });

  it('rechaza un token con caracteres que romperían el comando', async () => {
    const { ejecutar, llamadas } = ejecutarFalso([]);
    await expect(crearLlaveroMac({ ejecutar, cuenta: 'ale' }).guardar('a" ; delete-keychain x')).rejects.toThrow();
    expect(llamadas).toEqual([]);
  });

  it('lee el token, o null si no hay', async () => {
    const hay = ejecutarFalso([{ codigo: 0, salida: 'refresco\n' }]);
    expect(await crearLlaveroMac({ ejecutar: hay.ejecutar, cuenta: 'ale' }).leer()).toBe('refresco');
    const noHay = ejecutarFalso([{ codigo: 44 }]);
    expect(await crearLlaveroMac({ ejecutar: noHay.ejecutar, cuenta: 'ale' }).leer()).toBeNull();
  });
});
