/**
 * El Google Picker: la ventana de Google para elegir una carpeta que ya existe.
 *
 * La app no lista las carpetas del usuario; cuando hay que elegir una que no es
 * la que se crea, la elige Google con su propia navegación y su búsqueda.
 *
 * El script no va en `index.html`: la mayoría de las sesiones no lo usa. Se
 * carga la primera vez que se abre el Picker y se espera a que el global exista,
 * como hace `auth.ts` con Identity Services.
 */
import { API_KEY } from './config.js';

const URL_API = 'https://apis.google.com/js/api.js';
const MIME_CARPETA = 'application/vnd.google-apps.folder';

export interface CarpetaElegida {
  id: string;
  nombre: string;
}

/** La carga en curso o ya hecha. Un fallo la suelta: el próximo intento reintenta. */
let carga: Promise<void> | null = null;

function cargarSdk(): Promise<void> {
  if (carga) return carga;
  carga = new Promise<void>((resolve, reject) => {
    const pedirModulo = (): void => {
      const gapi = window.gapi;
      if (!gapi) return reject(new Error('El script del Picker no dejó gapi'));
      gapi.load('picker', { callback: resolve });
    };
    if (window.gapi) return pedirModulo();
    const script = document.createElement('script');
    script.src = URL_API;
    script.async = true;
    script.onload = pedirModulo;
    script.onerror = () => reject(new Error('No se pudo cargar el script del Picker'));
    document.head.appendChild(script);
  });
  carga.catch(() => { carga = null; });
  return carga;
}

/**
 * Abre el Picker y espera. Resuelve con la carpeta elegida, o con `null` si el
 * usuario cerró la ventana sin elegir. Si el script no carga, tira: la pantalla
 * lo avisa y ofrece reintentar.
 */
export async function elegirCarpeta(token: string): Promise<CarpetaElegida | null> {
  await cargarSdk();
  const picker = window.google?.picker;
  // `cargarSdk` ya resolvió, pero eso no se lo puede probar al compilador.
  if (!picker) throw new Error('El Picker de Google no cargó');

  return new Promise<CarpetaElegida | null>(resolve => {
    const vista = new picker.DocsView(picker.ViewId.FOLDERS)
      .setSelectFolderEnabled(true)
      // Sólo carpetas propias: las compartidas y las unidades compartidas no entran.
      .setOwnedByMe(true)
      .setMimeTypes(MIME_CARPETA);
    new picker.PickerBuilder()
      .addView(vista)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle('Elegí la carpeta de tus recetas')
      .setLocale('es')
      .setCallback(respuesta => {
        if (respuesta.action === picker.Action.PICKED) {
          const elegida = respuesta.docs?.[0];
          resolve(elegida ? { id: elegida.id, nombre: elegida.name ?? '' } : null);
        } else if (respuesta.action === picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build()
      .setVisible(true);
  });
}
