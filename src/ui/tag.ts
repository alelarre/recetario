/**
 * La lista de las recetas con un tag (P27). Es la pantalla de categoría con
 * otro criterio: el mismo encabezado con total —con el ícono adelante si el
 * tag es especial—, el mismo carrusel para acumular, y la misma lista con las
 * favoritas primero.
 */
import { encabezado, tarjeta, vacio, carruselTags, iconoDeTag, SPINNER } from './componentes.js';
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
  // El tag de la ruta no se puede sacar —cambiar de tag es volver—, así que el
  // vacío dice el hecho y no invita a «sacar un filtro» que no se puede sacar.
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio('Ninguna receta tiene estos tags.');

  // Corta en los mismos veinte que el Recetario (P27 §6): la ronda de
  // corrección lo alineó, que antes acá no cortaba.
  const icono = iconoDeTag(tag);
  return encabezado({ titulo: tag, volver: true, total, ...(icono ? { icono } : {}) }) +
    `<div class="cuerpo denso">${carruselTags(tags, { activos: tagsActivos, tope: 20, fijo: tag })}${cuerpo}</div>`;
}
