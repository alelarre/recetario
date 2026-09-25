/**
 * Los resultados de la búsqueda, separados por los tres criterios (C02.3.1),
 * con la lista agrupada de `lista-recetas.ts`.
 *
 * Mockup 05.
 */
import { escapar } from './markdown.js';
import { ICO } from './iconos.js';
import { listaAgrupada } from './lista-recetas.js';
import type { ListaAgrupada } from '../lista-control.js';

export interface OpcionesResultados {
  consulta: string;
  /** Lo que arma `lista-control`: cada grupo ordenado, y el tramo cortado entre todos. */
  lista: ListaAgrupada;
}

export function renderResultados({ consulta, lista }: OpcionesResultados): string {
  // La misma caja del Recetario —lupa adentro, fondo propio—, entre el volver y
  // el limpiar: es el mismo control, no dos parecidos.
  const caja = '<div class="cajaenc">' +
    `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>` +
    `<div class="buscar">${ICO.buscar}` +
      `<input data-accion="buscar" value="${escapar(consulta)}" placeholder="Buscar">` +
    '</div>' +
    `<button class="ico" data-accion="limpiar" aria-label="Limpiar">${ICO.cerrar}</button>` +
    '</div>';

  const cuerpo = listaAgrupada({ lista, consulta });
  // Sin resultados la frase va sola, sin el cuerpo denso de la lista.
  return caja + (lista.grupos.length ? `<div class="cuerpo denso">${cuerpo}</div>` : cuerpo);
}
