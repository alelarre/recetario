/**
 * La lista de las recetas con un tag (P27). Es la pantalla de categoría con
 * otro criterio: el mismo encabezado con total, el mismo carrusel para cambiar
 * o acumular, y la misma lista con las favoritas primero.
 *
 * El ícono del tag especial no va en el encabezado: ya está en su chip
 * encendido del carrusel, dos renglones más abajo.
 */
import { encabezado, tarjeta, vacio, carruselTags, SPINNER } from './componentes.js';
import { ordenarRecetas } from '../catalogo.js';
import type { Entrada } from '../tipos.js';

export interface OpcionesTag {
  tag: string;
  entradas: Entrada[];
  total: number;
  visibles: number;
  tagsActivos: string[];
  tags: { tag: string; cantidad: number }[];
}

export function renderTag({ tag, entradas, total, visibles, tagsActivos, tags }: OpcionesTag): string {
  const lista = ordenarRecetas(entradas).map(e => tarjeta(e)).join('');
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio('Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.');

  return encabezado({ titulo: tag, volver: true, total }) +
    `<div class="cuerpo denso">${carruselTags(tags, { activos: tagsActivos })}${cuerpo}</div>`;
}
