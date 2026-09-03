import { CLIENT_ID, SCOPE } from './config.js';

export class ErrorDeAuth extends Error {}

export function crearAuth() {
  let token = null;
  let vence = 0;
  let cliente = null;

  // El script de Identity Services va con `async`, así que puede seguir
  // descargándose cuando este módulo ya corre: sin esperar acá, la carrera
  // se pierde a veces y la app queda con "Google Identity no cargó" sin
  // reintento automático. Sondear es más simple que recablear la carga del
  // script con un <script> armado a mano y su propio evento `load`.
  const esperarGis = (timeoutMs = 8000) => new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(intervalo);
        resolve();
      } else if (Date.now() - inicio > timeoutMs) {
        clearInterval(intervalo);
        reject(new ErrorDeAuth('Google Identity no cargó'));
      }
    }, 50);
  });

  const clienteGis = () => {
    if (cliente) return cliente;
    cliente = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE, callback: () => {}, error_callback: () => {}
    });
    return cliente;
  };

  const pedir = (prompt) => esperarGis().then(() => new Promise((resolve, reject) => {
    const c = clienteGis();
    c.callback = (resp) => {
      if (resp.error) return reject(new ErrorDeAuth(resp.error));
      token = resp.access_token;
      // Google devuelve expires_in en segundos; se renueva un minuto antes.
      vence = Date.now() + (Number(resp.expires_in) - 60) * 1000;
      resolve(token);
    };
    // Si el usuario cierra el popup de consentimiento (en vez de tocar algo
    // adentro), Google no llama a `callback`: sin esto la promesa quedaba
    // pendiente para siempre y la pantalla se congelaba en "Conectando…".
    c.error_callback = () => reject(new ErrorDeAuth('No se completó la conexión con Google'));
    c.requestAccessToken({ prompt });
  }));

  return {
    conectar: () => pedir('consent'),
    /** Renovación silenciosa mientras haya sesión de Google; si no, hay que reconectar. */
    token: async () => (token && Date.now() < vence) ? token : pedir(''),
    olvidar: () => { token = null; vence = 0; }
  };
}
