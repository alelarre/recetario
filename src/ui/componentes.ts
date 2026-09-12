/**
 * Los fragmentos que comparten las pantallas: encabezado, tarjeta,
 * placeholder, aviso, chips, vacío y el spinner.
 *
 * El markup es el de los mockups, literal. Todo texto que venga de un `.md`
 * pasa por `escapar()`: los archivos los escribe cualquiera —un agente, el
 * usuario, un PDF mal convertido— y ninguno es confiable.
 */
import { escapar } from './markdown.js';
import { colorCategoria, fotoCategoria, slugCategoria } from './categorias.js';
import { ICO } from './iconos.js';
import type { Entrada } from '../tipos.js';

/** §5.1 — el spinner del final de la lista y de las esperas. */
export const SPINNER = '<div class="spin"></div>';

export interface OpcionesEncabezado {
  titulo: string;
  volver?: boolean;
  /** El Recetario y Borradores llevan el título grande y a la izquierda. */
  grande?: boolean;
  /** HTML ya armado para el extremo derecho: botones de ícono. */
  derecha?: string;
  /** El total de la categoría va acá y no en la lista (mockup 04). */
  total?: number;
  /** Queda fijo arriba al scrollear. Lo usa la receta, que le pone el título. */
  pegajoso?: boolean;
}

export function encabezado(
  { titulo, volver, grande, derecha, total, pegajoso }: OpcionesEncabezado
): string {
  const izquierda = volver
    ? `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>`
    : '';
  const clase = grande ? 'tit izq' : 'tit';
  const estilo = grande ? ' style="font-size:var(--txt-titulo)"' : '';
  return `<div class="enc${pegajoso ? ' peg' : ''}">${izquierda}` +
    `<span class="${clase}"${estilo}>${escapar(titulo)}</span>` +
    (total === undefined ? '' : `<span class="tot">${total}</span>`) +
    (derecha ?? '') +
    '</div>';
}

/**
 * §6.2 — La foto de la receta si la tiene; si no, la de la categoría
 * oscurecida y teñida. Ocupa exactamente el mismo espacio en los dos casos.
 */
export function placeholder(categoria: unknown, foto?: string): string {
  if (foto) return `<img class="foto" src="${escapar(foto)}" alt="" loading="lazy">`;
  const imagen = fotoCategoria(categoria);
  const estilo = `--c:${colorCategoria(categoria)}` + (imagen ? `;--img:url(${imagen})` : '');
  return `<span class="ph" style="${escapar(estilo)}"></span>`;
}

export interface OpcionesTarjeta {
  /** En los resultados por ingrediente, por qué apareció (C02.3.2). */
  motivo?: string;
}

/** §6.1 — Foto, título y una línea de contexto. Alto total 80 px. */
export function tarjeta(e: Entrada, { motivo }: OpcionesTarjeta = {}): string {
  const contexto = motivo
    ? `<span class="motivo">${escapar(motivo)}</span>`
    : `<span class="pin" style="background:${colorCategoria(e.categoria)}"></span>` +
      escapar([e.categoria, e.tiempo, e.rinde].filter(Boolean).join(' · '));
  const marca = e.completa ? '' : '<span class="inc"></span>';
  return `<a class="tarjeta" href="#/r/${encodeURIComponent(e.id_archivo)}">` +
    placeholder(e.categoria, e.foto) +
    '<span class="txt">' +
      `<span class="n">${escapar(e.titulo)}</span>` +
      `<span class="ctx">${contexto}${marca}</span>` +
    '</span></a>';
}

export interface OpcionesAviso {
  texto: string;
  /** El control para reintentar. Sin él, el aviso solo informa (R1). */
  accion?: { etiqueta: string; accion: string };
}

/** §6.8 — Un aviso en castellano, donde ocurrió, y un control para reintentar. */
export function aviso({ texto, accion }: OpcionesAviso): string {
  const boton = accion
    ? `<button class="btn sec compacto" data-accion="${escapar(accion.accion)}">${escapar(accion.etiqueta)}</button>`
    : '';
  return `<div class="aviso"><p>${escapar(texto)}</p>${boton}</div>`;
}

/** §6.10 — Los tags como chips; los activos marcados con el acento. */
export function chips(tags: string[], activos: string[] = []): string {
  const lista = (Array.isArray(tags) ? tags : []).map(tag => {
    const clase = activos.includes(tag) ? 'chip act' : 'chip';
    return `<button class="${clase}" data-tag="${escapar(tag)}">${escapar(tag)}</button>`;
  }).join('');
  return `<div class="chips">${lista}</div>`;
}

/** Una frase y nada más: sin ilustración y sin sugerencias (mockup 05). */
export function vacio(texto: string): string {
  return `<div class="vacio">${escapar(texto)}</div>`;
}

/** El tile de una categoría en la grilla del Recetario (mockup 03). */
export function tile(nombre: string, cantidad?: number): string {
  const imagen = fotoCategoria(nombre);
  const fondo = imagen
    ? `<span class="im" style="background-image:url(${imagen})"></span>`
    : '<span class="im trama"></span>';   // las que no tienen foto
  const cuenta = cantidad ? `<span class="cu">${cantidad}</span>` : '';
  return `<a class="tile" style="--c:${colorCategoria(nombre)}" ` +
    `href="#/c/${encodeURIComponent(nombre)}" data-slug="${escapar(slugCategoria(nombre))}">` +
    `${fondo}${cuenta}<span class="nm">${escapar(nombre)}</span></a>`;
}
