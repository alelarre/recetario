/**
 * La lista de las recetas con un tag. Es la pantalla de categoría con otro
 * criterio: el mismo encabezado con total —con el ícono adelante si el tag es
 * especial—, el mismo carrusel para acumular, y la misma lista con las
 * favoritas primero.
 *
 * Borradores es esta misma lista con el tag `borrador`, dibujada como destino
 * del menú: con el lateral y la hamburguesa en vez del volver, y con cada
 * tarjeta abriendo el editor, que es donde se completa un borrador.
 */
import {
  encabezado, tarjeta, vacio, carruselTags, iconoDeTag, SPINNER, filaDuraciones, conmutadorOrden,
  conLateral, izquierdaDelEncabezado
} from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
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
  /** La lista es Borradores: cada tarjeta abre el editor, y el vacío lo dice. */
  borradores?: boolean;
  /** Borradores es destino del menú: el lateral y la hamburguesa. */
  menu?: MenuDePantalla;
  /** El título del encabezado, si no es el tag: Borradores se llama como en el menú. */
  titulo?: string;
}

export function renderTag(
  { tag, entradas, total, visibles, tagsActivos, tags, duraciones, duracionesActivas, orden, borradores, menu, titulo }: OpcionesTag
): string {
  const destino = borradores ? 'editor' : 'receta';
  const lista = ordenarRecetas(entradas, orden).map(e => tarjeta(e, { destino })).join('');
  // El tag de la ruta no se puede sacar —cambiar de tag es volver—, así que el
  // vacío dice el hecho y no invita a «sacar un filtro» que no se puede sacar.
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio(duracionesActivas.length
        ? 'Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.'
        : borradores ? 'No hay borradores.' : 'Ninguna receta tiene estos tags.');

  const hayDuraciones = duraciones.length > 0 || duracionesActivas.length > 0;
  const filtroDuracion = filaDuraciones(duraciones, duracionesActivas);
  const conmutador = hayDuraciones ? conmutadorOrden(orden) : '';

  // El carrusel corta en los mismos veinte que el Recetario.
  const icono = iconoDeTag(tag);
  const pantalla = encabezado({
    titulo: titulo ?? tag, total, ...(icono ? { icono } : {}),
    ...izquierdaDelEncabezado(menu)
  }) +
    `<div class="cuerpo denso">${carruselTags(tags, { activos: tagsActivos, tope: 20, fijo: tag })}` +
    `${filtroDuracion}${conmutador}${cuerpo}</div>`;
  return conLateral(menu, pantalla);
}
