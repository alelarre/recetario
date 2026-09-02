import { CLIENT_ID, SCOPE } from './config.js';

export class ErrorDeAuth extends Error {}

export function crearAuth() {
  let token = null;
  let vence = 0;
  let cliente = null;

  const clienteGis = () => {
    if (cliente) return cliente;
    if (!window.google?.accounts?.oauth2) throw new ErrorDeAuth('Google Identity no cargó');
    cliente = window.google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: () => {} });
    return cliente;
  };

  const pedir = (prompt) => new Promise((resolve, reject) => {
    const c = clienteGis();
    c.callback = (resp) => {
      if (resp.error) return reject(new ErrorDeAuth(resp.error));
      token = resp.access_token;
      // Google devuelve expires_in en segundos; se renueva un minuto antes.
      vence = Date.now() + (Number(resp.expires_in) - 60) * 1000;
      resolve(token);
    };
    c.requestAccessToken({ prompt });
  });

  return {
    conectar: () => pedir('consent'),
    /** Renovación silenciosa mientras haya sesión de Google; si no, hay que reconectar. */
    token: async () => (token && Date.now() < vence) ? token : pedir(''),
    olvidar: () => { token = null; vence = 0; }
  };
}
