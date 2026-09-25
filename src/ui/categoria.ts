/**
 * La lista de una categoría (mockup 04).
 *
 * El encabezado dice el total real desde el primer momento, aunque la lista
 * todavía esté dibujando su primer tramo: el número no cambia debajo de la
 * mano mientras se scrollea (C02.5.2).
 */
import { encabezado, vacio } from './componentes.js';
import { listaPlana } from './lista-recetas.js';
import type { ListaPlana } from '../lista-control.js';

export interface OpcionesCategoria {
  nombre: string;
  /** Lo que arma `lista-control`: filtrada, ordenada y cortada al tramo. */
  lista: ListaPlana;
  tagsActivos: readonly string[];
  /** Los tags de la categoría, ya ordenados por cantidad. */
  tags: { tag: string; cantidad: number }[];
}

export function renderCategoria({ nombre, lista, tagsActivos, tags }: OpcionesCategoria): string {
  const hayFiltros = tagsActivos.length > 0 || lista.duracionesActivas.length > 0;
  const siVacia = vacio(!hayFiltros
    ? `Todavía no hay nada acá. Entran con Nueva receta, compartiendo desde otra app, ` +
      `o como archivos .md en la carpeta ${nombre} de Drive.`
    : lista.duracionesActivas.length
      ? 'Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.'
      : 'Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.');

  return encabezado({ titulo: nombre, volver: true, total: lista.total }) +
    `<div class="cuerpo denso">${listaPlana({ lista, carrusel: { tags, activos: tagsActivos }, vacio: siVacia })}</div>`;
}
