/**
 * La lista de una categoría (mockup 04).
 *
 * `total` y `visibles` son distintos a propósito: el encabezado dice el total
 * real desde el primer momento aunque la lista todavía esté dibujando su
 * primer tramo, así que el número no cambia debajo de la mano mientras se
 * scrollea (C02.5.2). El spinner del final no es una espera de red —el índice
 * ya está en memoria— sino la señal de que hay más tramo.
 */
import { encabezado, tarjeta, vacio, SPINNER, carruselTags, filaDuraciones, conmutadorOrden } from './componentes.js';
import { ordenarRecetas } from '../catalogo.js';
import type { Entrada } from '../tipos.js';
import type { Duracion, Orden } from '../catalogo.js';

export interface OpcionesCategoria {
  nombre: string;
  /** Las que se dibujan, ya cortadas al tramo. */
  entradas: Entrada[];
  /** Cuántas tiene la categoría con el filtro puesto. */
  total: number;
  visibles: number;
  tagsActivos: string[];
  /** Los tags de la categoría, ya ordenados por cantidad (P27). */
  tags: { tag: string; cantidad: number }[];
  /** Cuántas recetas hay con cada duración, sobre el filtro de tags (P29). */
  duraciones: { valor: Duracion; cantidad: number }[];
  duracionesActivas: string[];
  orden: Orden;
}

export function renderCategoria(
  { nombre, entradas, total, visibles, tagsActivos, tags, duraciones, duracionesActivas, orden }: OpcionesCategoria
): string {
  const activos = Array.isArray(tagsActivos) ? tagsActivos : [];

  // El carrusel reemplaza a la fila de chips activos: los puestos se ven
  // encendidos ahí mismo, y se sacan tocándolos de nuevo (P27).
  const filtros = carruselTags(tags, { activos });

  // La fila de duraciones y el conmutador de orden sólo existen si hay algo
  // que filtrar u ordenar: una duración con recetas, o encendida (P29).
  const hayDuraciones = duraciones.length > 0 || duracionesActivas.length > 0;
  const filtroDuracion = filaDuraciones(duraciones, duracionesActivas);
  const orden_ = hayDuraciones ? conmutadorOrden(orden) : '';

  // Las favoritas primero, o por duración si se eligió ese orden (P27, P29).
  const lista = ordenarRecetas(entradas, orden).map(e => tarjeta(e)).join('');

  const hayFiltros = activos.length > 0 || duracionesActivas.length > 0;
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio(!hayFiltros
        ? `Todavía no hay nada acá. Las recetas entran como archivos .md en la carpeta ${nombre} de Drive.`
        : duracionesActivas.length
          ? 'Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.'
          : 'Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.');

  return encabezado({ titulo: nombre, volver: true, total }) +
    `<div class="cuerpo denso">${filtros}${filtroDuracion}${orden_}${cuerpo}</div>`;
}
