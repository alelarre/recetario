/**
 * La pantalla de la carpeta base.
 *
 * Aparece cuando no hay una carpeta marcada, o hay más de una, y desde Ajustes
 * para cambiarla. **No lista nada del Drive:** la app ofrece crear la carpeta, o
 * abrir el Picker de Google para elegir una que ya exista. Lo único de Drive que
 * se muestra son las encontradas, que son las que la app ya sabe que le
 * pertenecen.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso } from './componentes.js';
import { ICO } from './iconos.js';
import { NOMBRE_RAIZ } from '../config.js';

export interface CarpetaSimple {
  id: string;
  nombre: string;
}

export interface OpcionesSelector {
  /** Las marcadas, o las propias llamadas Recetario. */
  sugerencias: CarpetaSimple[];
  /** La carpeta a punto de usarse: la confirmación reemplaza los botones. */
  confirmando: CarpetaSimple | null;
  /** Se entró desde Ajustes, para cambiar la carpeta en uso. */
  cambiando: boolean;
  /** Sin API key el Picker no se puede abrir, así que no se ofrece. */
  conPicker: boolean;
  error?: string;
}

const INTRO_PRIMERA = 'Recetario guarda cada receta como un archivo en una carpeta de tu ' +
  'Google Drive. Podés crearla ahora o elegir una que ya tengas.';
const INTRO_CAMBIO = 'La carpeta actual queda como está en Drive. La app va a usar la que elijas.';

export function renderSelector(
  { sugerencias, confirmando, cambiando, conPicker, error }: OpcionesSelector
): string {
  const encontradas = sugerencias.length
    ? '<div class="grupo-res"><div class="rot">Encontradas</div><div class="lista">' +
      sugerencias.map(c =>
        '<div class="fila carp">' +
          ICO.carpeta +
          `<span class="n">${escapar(c.nombre)}</span>` +
          '<button class="btn sec compacto" data-accion="carpeta-sugerida" ' +
            `data-id="${escapar(c.id)}" data-nombre="${escapar(c.nombre)}">Usar</button>` +
        '</div>'
      ).join('') + '</div></div>'
    : '';

  const botones = '<div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
    `<button class="btn prim" data-accion="carpeta-crear">Crear la carpeta «${escapar(NOMBRE_RAIZ)}» en Mi unidad</button>` +
    (conPicker ? '<button class="btn sec" data-accion="carpeta-elegir">Ya tengo una carpeta</button>' : '') +
    '</div>';

  const confirmacion = confirmando
    ? '<div class="ficha">' +
        `<p class="lee" style="margin:0 0 var(--e-4)">Se va a usar <b>${escapar(confirmando.nombre)}</b>. ` +
        'Las categorías que falten se crean, y después se indexa lo que haya adentro.</p>' +
        '<div class="acciones">' +
          '<button class="btn sec" data-accion="carpeta-cancelar">Cancelar</button>' +
          '<button class="btn prim" data-accion="carpeta-confirmar">Usar</button>' +
        '</div></div>'
    : '';

  // El error va en el lugar de los botones: Reintentar lo saca y vuelve a
  // ofrecer lo mismo —o la confirmación, si había una carpeta elegida—.
  const acciones = error
    ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } })
    : confirmacion || botones;

  return encabezado(cambiando
    ? { titulo: 'Cambiar carpeta', volver: true }
    : { titulo: 'Tus recetas en Drive' }) +
    '<div class="cuerpo">' +
      `<p class="lee" style="margin:0">${cambiando ? INTRO_CAMBIO : INTRO_PRIMERA}</p>` +
      encontradas +
      acciones +
    '</div>';
}
