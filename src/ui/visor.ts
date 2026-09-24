/**
 * El visor de fotos de la receta: la foto actual a pantalla
 * completa sobre el velo, entre las fotos del depósito, en su orden. Módulo
 * puro: no toca el DOM ni escucha gestos, eso lo cablea `main.ts`.
 */
import { imgDe } from './markdown.js';

export interface EstadoVisor {
  /** Las fotos que el visor recorre, en su orden. */
  urls: string[];
  /** La foto que se está mostrando. */
  i: number;
}

/**
 * El índice después de un deslizamiento: `dx` es el desplazamiento horizontal
 * en píxeles. Por debajo de 40 px no llega a ser un gesto y el índice no se
 * mueve. Hacia la izquierda avanza a la siguiente foto, hacia la derecha
 * vuelve a la anterior; en los extremos no da la vuelta.
 */
export function pasoDelVisor(i: number, dx: number, total: number): number {
  if (Math.abs(dx) < 40) return i;
  const siguiente = dx < 0 ? i + 1 : i - 1;
  return Math.min(Math.max(siguiente, 0), total - 1);
}

/**
 * La foto actual, al ancho de la pantalla sobre el velo. `data-i` y
 * `data-total` quedan en el contenedor para que el deslizamiento sepa dónde
 * está parado y hasta dónde llega, sin recalcularlo. Se cierra tocando, en
 * cualquier parte (`data-accion="cerrar-visor"`).
 */
export function renderVisor({ urls, i }: EstadoVisor): string {
  const url = urls[i];
  if (url === undefined) return '';
  return `<div class="visor" data-accion="cerrar-visor" data-i="${i}" data-total="${urls.length}">` +
    imgDe(url) +
  '</div>';
}
