/**
 * La lista de una categoría (mockup 04).
 *
 * `total` y `visibles` son distintos a propósito: el encabezado dice el total
 * real desde el primer momento aunque la lista todavía esté dibujando su
 * primer tramo, así que el número no cambia debajo de la mano mientras se
 * scrollea (C02.5.2). El spinner del final no es una espera de red —el índice
 * ya está en memoria— sino la señal de que hay más tramo.
 */
import { encabezado, tarjeta, vacio, SPINNER } from './componentes.js';
import { escapar } from './markdown.js';
import { ICO } from './iconos.js';
import type { Entrada } from '../tipos.js';

export interface OpcionesCategoria {
  nombre: string;
  /** Las que se dibujan, ya cortadas al tramo. */
  entradas: Entrada[];
  /** Cuántas tiene la categoría con el filtro puesto. */
  total: number;
  visibles: number;
  tagsActivos: string[];
}

export function renderCategoria(
  { nombre, entradas, total, visibles, tagsActivos }: OpcionesCategoria
): string {
  const activos = Array.isArray(tagsActivos) ? tagsActivos : [];

  const filtros = activos.length
    ? '<div class="chips">' + activos.map(tag =>
        `<button class="chip act" data-accion="quitar-tag" data-tag="${escapar(tag)}">` +
        `${escapar(tag)}${ICO.cerrar}</button>`).join('') + '</div>'
    : '';

  const ordenadas = [...entradas].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  const lista = ordenadas.map(e => tarjeta(e)).join('');

  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio(activos.length
        ? 'Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.'
        : `Todavía no hay nada acá. Las recetas entran como archivos .md en la carpeta ${nombre} de Drive.`);

  return encabezado({ titulo: nombre, volver: true, total }) +
    `<div class="cuerpo denso">${filtros}${cuerpo}</div>`;
}
