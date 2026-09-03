import { CLIENT_ID, SCOPE } from './config.js';

export class ErrorDeAuth extends Error {}

const CLAVE_STORAGE = 'recetario-auth';

// El flujo de OAuth de Identity Services es siempre por popup, incluso en la
// renovación "silenciosa" (`prompt: ''`): se abre y se cierra solo si ya hay
// sesión y permiso concedidos, pero se abre. Sin guardar el token entre
// aperturas, cada recarga de la página arranca en null y fuerza ese popup
// aunque el token anterior siga siendo válido por otra hora.
const leerGuardado = () => {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) return null;
    const { token, vence } = JSON.parse(crudo);
    return (typeof token === 'string' && typeof vence === 'number') ? { token, vence } : null;
  } catch {
    return null;
  }
};

const guardarEnStorage = (token, vence) => {
  try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ token, vence })); } catch { /* privado, lleno, o inaccesible: seguir solo en memoria */ }
};

const borrarDeStorage = () => {
  try { localStorage.removeItem(CLAVE_STORAGE); } catch { /* nada que borrar o storage inaccesible */ }
};

export function crearAuth() {
  const guardado = leerGuardado();
  let token = guardado?.token ?? null;
  let vence = guardado?.vence ?? 0;
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
      guardarEnStorage(token, vence);
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
    olvidar: () => { token = null; vence = 0; borrarDeStorage(); }
  };
}
