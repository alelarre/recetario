/**
 * La lista de las recetas con un tag. Es la pantalla de categoría con otro
 * criterio: el mismo encabezado con total —con el ícono adelante si el tag es
 * especial—, el mismo carrusel para acumular, y la misma lista con las
 * favoritas primero.
 */
import { encabezado, tarjeta, vacio, carruselTags, iconoDeTag, SPINNER, filaDuraciones, conmutadorOrden } from './componentes.js';
import { ordenarRecetas } from '../catalogo.js';
import type { Entrada } from '../tipos.js';
import type { Duracion, Orden } from '../catalogo.js';

export interface OpcionesTag {
  tag: string;
  entradas: Entrada[];
  total: number;
  visibles: number;
  tagsActivos: string[];
  tags: { tag: string; cantidad: number }[];
  /** Cuántas recetas hay con cada duración, sobre el filtro de tags. */
  duraciones: { valor: Duracion; cantidad: number }[];
  duracionesActivas: string[];
  orden: Orden;
}

export function renderTag(
  { tag, entradas, total, visibles, tagsActivos, tags, duraciones, duracionesActivas, orden }: OpcionesTag
): string {
  const lista = ordenarRecetas(entradas, orden).map(e => tarjeta(e)).join('');
  // El tag de la ruta no se puede sacar —cambiar de tag es volver—, así que el
  // vacío dice el hecho y no invita a «sacar un filtro» que no se puede sacar.
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio(duracionesActivas.length
        ? 'Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.'
        : 'Ninguna receta tiene estos tags.');

  const hayDuraciones = duraciones.length > 0 || duracionesActivas.length > 0;
  const filtroDuracion = filaDuraciones(duraciones, duracionesActivas);
  const conmutador = hayDuraciones ? conmutadorOrden(orden) : '';

  // El carrusel corta en los mismos veinte que el Recetario.
  const icono = iconoDeTag(tag);
  return encabezado({ titulo: tag, volver: true, total, ...(icono ? { icono } : {}) }) +
    `<div class="cuerpo denso">${carruselTags(tags, { activos: tagsActivos, tope: 20, fijo: tag })}` +
    `${filtroDuracion}${conmutador}${cuerpo}</div>`;
}
