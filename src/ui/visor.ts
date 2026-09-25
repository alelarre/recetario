/**
 * El visor de fotos de la receta: la foto actual a pantalla completa sobre el
 * velo. Sólo el dibujo: qué fotos recorre, en cuál está y el gesto son de
 * `visor-control.ts`.
 */
import { imgDe } from './markdown.js';

export interface EstadoVisor {
  /** Las fotos que el visor recorre, en su orden. */
  urls: string[];
  /** La foto que se está mostrando. */
  i: number;
}

/**
 * La foto actual, al ancho de la pantalla sobre el velo. Se cierra tocando,
 * en cualquier parte (`data-accion="cerrar-visor"`).
 */
export function renderVisor({ urls, i }: EstadoVisor): string {
  const url = urls[i];
  if (url === undefined) return '';
  return '<div class="visor" data-accion="cerrar-visor">' + imgDe(url) + '</div>';
}
