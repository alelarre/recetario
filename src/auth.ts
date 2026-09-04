import { CLIENT_ID, SCOPE } from './config.js';

export class ErrorDeAuth extends Error {}

const CLAVE_STORAGE = 'recetario-auth';

/** Un token vigente y cuándo deja de serlo, en milisegundos epoch. */
interface TokenGuardado {
  token: string;
  vence: number;
}

// El flujo de OAuth de Identity Services es siempre por popup, incluso en la
// renovación "silenciosa" (`prompt: ''`): se abre y se cierra solo si ya hay
// sesión y permiso concedidos, pero se abre. Sin guardar el token entre
// aperturas, cada recarga de la página arranca en null y fuerza ese popup
// aunque el token anterior siga siendo válido por otra hora.
const leerGuardado = (): TokenGuardado | null => {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) return null;
    const { token, vence } = JSON.parse(crudo);
    return (typeof token === 'string' && typeof vence === 'number') ? { token, vence } : null;
  } catch {
    return null;
  }
};

const guardarEnStorage = (token: string, vence: number): void => {
  try { localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ token, vence })); } catch { /* privado, lleno, o inaccesible: seguir solo en memoria */ }
};

const borrarDeStorage = (): void => {
  try { localStorage.removeItem(CLAVE_STORAGE); } catch { /* nada que borrar o storage inaccesible */ }
};

export function crearAuth() {
  const guardado = leerGuardado();
  let token: string | null = guardado?.token ?? null;
  let vence: number = guardado?.vence ?? 0;
  let cliente: ClienteToken | null = null;

  // El script de Identity Services va con `async`, así que puede seguir
  // descargándose cuando este módulo ya corre: sin esperar acá, la carrera
  // se pierde a veces y la app queda con "Google Identity no cargó" sin
  // reintento automático. Sondear es más simple que recablear la carga del
  // script con un <script> armado a mano y su propio evento `load`.
  const esperarGis = (timeoutMs = 8000): Promise<void> => new Promise<void>((resolve, reject) => {
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

  const clienteGis = (): ClienteToken => {
    if (cliente) return cliente;
    // `esperarGis` ya corrió, pero eso no se lo puede probar al compilador.
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) throw new ErrorDeAuth('Google Identity no cargó');
    cliente = oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE, callback: () => {}, error_callback: () => {}
    });
    return cliente;
  };

  const pedir = (prompt: string): Promise<string> =>
    esperarGis().then(() => new Promise<string>((resolve, reject) => {
    const c = clienteGis();
    c.callback = (resp) => {
      if (resp.error) return reject(new ErrorDeAuth(resp.error));
      if (!resp.access_token) return reject(new ErrorDeAuth('Google no devolvió un token'));
      token = resp.access_token;
      // Google devuelve expires_in en segundos; se renueva un minuto antes.
      vence = Date.now() + (Number(resp.expires_in) - 60) * 1000;
      guardarEnStorage(resp.access_token, vence);
      resolve(resp.access_token);
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
