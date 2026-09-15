/**
 * La vista de invitado: la receta de un link, para quien no usa la app (spec
 * P23 §3). Es una pantalla propia, armada con las piezas de la receta: su
 * cabecera no lleva marcas, no hay encabezado, y la única acción es Cocinar.
 */
import { vacio } from './componentes.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import type { Receta } from '../tipos.js';

export function renderInvitado({ receta, categoria }: { receta: Receta; categoria: string }): string {
  return '<div class="cuerpo">' + fichaCabecera({ receta, categoria, pin: false }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta));
}

export const renderLinkRoto = (): string =>
  `<div class="cuerpo">${vacio('Este link está roto o incompleto.')}</div>`;
