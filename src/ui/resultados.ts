/**
 * Los resultados de la búsqueda, separados por los tres criterios (C02.3.1).
 *
 * Un grupo sin resultados no se dibuja, y cada grupo dice cuántos trajo. Sin
 * resultados no hay ilustración ni «quisiste decir»: una frase que nombra los
 * tres criterios probados, para que quede claro que no es que buscó mal.
 *
 * Mockup 05.
 */
import { escapar } from './markdown.js';
import { tarjeta, conmutadorOrden } from './componentes.js';
import { ICO } from './iconos.js';
import { ordenarRecetas, duracionValida } from '../catalogo.js';
import type { Coincidencia, Entrada, Coincidencias } from '../tipos.js';
import type { Orden } from '../catalogo.js';

export interface OpcionesResultados {
  consulta: string;
  grupos: Coincidencias;
  /** El conmutador de orden: ordena dentro de cada grupo. */
  orden?: Orden;
}

const grupo = (rotulo: string, tarjetas: string[]): string => {
  if (!tarjetas.length) return '';
  return '<div class="grupo-res">' +
    `<div class="rot"><span>${rotulo}</span><span>${tarjetas.length}</span></div>` +
    `<div class="lista">${tarjetas.join('')}</div>` +
    '</div>';
};

const conMotivo = (c: Coincidencia): string => tarjeta(c.entrada, { motivo: c.motivo });

/**
 * Ordena las entradas de una lista de coincidencias y las vuelve a emparejar
 * con su motivo por id: el motivo viaja con la coincidencia, no con la
 * entrada, así que reordenar entradas solas lo perdería.
 */
const conMotivoOrdenado = (cs: Coincidencia[], orden: Orden): string[] => {
  const porId = new Map(cs.map(c => [c.entrada.id_archivo, c]));
  return ordenarRecetas(cs.map(c => c.entrada), orden)
    .map(e => porId.get(e.id_archivo))
    .filter((c): c is Coincidencia => !!c)
    .map(conMotivo);
};

export function renderResultados({ consulta, grupos, orden = 'alfa' }: OpcionesResultados): string {
  const { porNombre = [] as Entrada[], porIngrediente = [], porTag = [] } = grupos ?? {};

  const todas = [...porNombre, ...porIngrediente.map(c => c.entrada), ...porTag.map(c => c.entrada)];
  const conmutador = todas.some(e => duracionValida(e.tiempo)) ? conmutadorOrden(orden) : '';

  const cuerpo =
    grupo('Por nombre', ordenarRecetas(porNombre, orden).map(e => tarjeta(e))) +
    grupo('Por ingrediente', conMotivoOrdenado(porIngrediente, orden)) +
    grupo('Por tag', conMotivoOrdenado(porTag, orden));

  // La misma caja del Recetario —lupa adentro, fondo propio—, entre el volver y
  // el limpiar: es el mismo control, no dos parecidos.
  const caja = '<div class="cajaenc">' +
    `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>` +
    `<div class="buscar">${ICO.buscar}` +
      `<input data-accion="buscar" value="${escapar(consulta)}" placeholder="Buscar">` +
    '</div>' +
    `<button class="ico" data-accion="limpiar" aria-label="Limpiar">${ICO.cerrar}</button>` +
    '</div>';

  const vacio = `<div class="vacio">Ninguna receta se llama, lleva ni tiene <b>${escapar(consulta)}</b>.</div>`;

  return caja + (cuerpo ? `<div class="cuerpo denso">${conmutador}${cuerpo}</div>` : vacio);
}
