/**
 * La lista de recetas: las tarjetas, los filtros de tags y de duración, el
 * conmutador de orden y el spinner del tramo. La dibujan la categoría, la
 * lista por tag, Borradores, los resultados y *Agregar al plan*.
 *
 * Recibe la lista ya armada por `lista-control.ts` —filtrada, ordenada y
 * cortada al tramo— y la dibuja en ese orden: acá no se ordena nada.
 */
import { escapar } from './markdown.js';
import { tarjeta, carruselTags, filaDuraciones, conmutadorOrden } from './componentes.js';
import type { OpcionesCarrusel, OpcionesTarjeta } from './componentes.js';
import type { ListaAgrupada, ListaPlana } from '../lista-control.js';

/**
 * El spinner del final de la lista mientras falta un tramo. No es una espera
 * de red —el índice ya está en memoria—: es la señal de que hay más. La marca
 * es lo que busca el observador del tramo, así no toma otro spinner de la
 * pantalla.
 */
export const SPINNER_TRAMO = '<div class="spin" data-tramo></div>';

export interface OpcionesListaPlana {
  lista: ListaPlana;
  /** El carrusel de tags que filtra, arriba de todo. Sin esto, no hay carrusel. */
  carrusel?: OpcionesCarrusel & { tags: { tag: string; cantidad: number }[] };
  /** El HTML de lo que se ve sin ninguna receta: cada pantalla dice lo suyo. */
  vacio: string;
  /** Adónde lleva la tarjeta, o qué acción dispara. */
  tarjeta?: Pick<OpcionesTarjeta, 'accion' | 'destino'>;
}

export function listaPlana({ lista, carrusel, vacio, tarjeta: deLaTarjeta = {} }: OpcionesListaPlana): string {
  // Los tags puestos se ven encendidos en el carrusel mismo, y se sacan
  // tocándolos de nuevo: no hay una fila aparte de filtros activos.
  const tags = carrusel ? carruselTags(carrusel.tags, carrusel) : '';
  // La fila de duraciones sólo existe si hay algo que filtrar, y el
  // conmutador si hay algo que ordenar.
  const duraciones = filaDuraciones(lista.duraciones, lista.duracionesActivas);
  const conmutador = lista.orden ? conmutadorOrden(lista.orden) : '';
  const cuerpo = lista.entradas.length
    ? `<div class="lista">${lista.entradas.map(e => tarjeta(e, deLaTarjeta)).join('')}</div>` +
      (lista.hayMas ? SPINNER_TRAMO : '')
    : vacio;
  return tags + duraciones + conmutador + cuerpo;
}

export interface OpcionesListaAgrupada {
  lista: ListaAgrupada;
  /** Lo buscado: lo nombra la frase del vacío. */
  consulta: string;
  /** Con acción, cada tarjeta la dispara en vez de abrir la receta. */
  accion?: string;
}

/**
 * Los resultados separados por los tres criterios (C02.3.1): un grupo sin
 * resultados no está, y cada uno dice cuántos trajo. Sin resultados no hay
 * ilustración ni «quisiste decir»: una frase que nombra los tres criterios
 * probados, para que quede claro que no es que se buscó mal.
 */
export function listaAgrupada({ lista, consulta, accion }: OpcionesListaAgrupada): string {
  if (!lista.grupos.length) {
    return `<div class="vacio">Ninguna receta se llama, lleva ni tiene <b>${escapar(consulta)}</b>.</div>`;
  }
  const grupos = lista.grupos.map(g =>
    '<div class="grupo-res">' +
      `<div class="rot"><span>${escapar(g.rotulo)}</span><span>${g.total}</span></div>` +
      '<div class="lista">' +
        g.items.map(i => tarjeta(i.entrada, {
          ...(i.motivo ? { motivo: i.motivo } : {}), ...(accion ? { accion } : {})
        })).join('') +
      '</div>' +
    '</div>').join('');
  // Los grupos van en su envoltorio, que los separa más que a las filas.
  return (lista.orden ? conmutadorOrden(lista.orden) : '') + `<div class="grupos">${grupos}</div>` +
    (lista.hayMas ? SPINNER_TRAMO : '');
}
