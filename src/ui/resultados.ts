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
import { tarjeta } from './componentes.js';
import { ICO } from './iconos.js';
import type { Coincidencia, Entrada, Coincidencias } from '../tipos.js';

export interface OpcionesResultados {
  consulta: string;
  grupos: Coincidencias;
}

const grupo = (rotulo: string, tarjetas: string[]): string => {
  if (!tarjetas.length) return '';
  return '<div class="grupo-res">' +
    `<div class="rot"><span>${rotulo}</span><span>${tarjetas.length}</span></div>` +
    `<div class="lista">${tarjetas.join('')}</div>` +
    '</div>';
};

const conMotivo = (c: Coincidencia): string => tarjeta(c.entrada, { motivo: c.motivo });

export function renderResultados({ consulta, grupos }: OpcionesResultados): string {
  const { porNombre = [] as Entrada[], porIngrediente = [], porTag = [] } = grupos ?? {};

  const cuerpo =
    grupo('Por nombre', porNombre.map(e => tarjeta(e))) +
    grupo('Por ingrediente', porIngrediente.map(conMotivo)) +
    grupo('Por tag', porTag.map(conMotivo));

  const caja = '<div class="cajaenc">' +
    `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>` +
    `<input data-accion="buscar" value="${escapar(consulta)}">` +
    `<button class="ico" data-accion="limpiar" aria-label="Limpiar">${ICO.cerrar}</button>` +
    '</div>';

  const vacio = `<div class="vacio">Ninguna receta se llama, lleva ni tiene <b>${escapar(consulta)}</b>.</div>`;

  return caja + (cuerpo ? `<div class="cuerpo denso">${cuerpo}</div>` : vacio);
}
