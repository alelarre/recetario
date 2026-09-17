/**
 * La ficha de compartir, al pie de la receta. Es estado de la pantalla, no una
 * ruta: volver, Cancelar o tocar el velo la cierran.
 */
import { escapar } from './markdown.js';
import { aviso } from './componentes.js';

export type EstadoCompartir =
  | { paso: 'opciones' }
  | { paso: 'generando' }
  | { paso: 'pdf-listo' }
  | { paso: 'error-pdf' }
  | { paso: 'copiado'; que: 'link' | 'texto' }
  | { paso: 'mostrar'; que: 'link' | 'texto'; contenido: string };

const boton = (accion: string, texto: string, clase = 'sec'): string =>
  `<button class="btn ${clase}" data-accion="${accion}">${escapar(texto)}</button>`;

const cancelar = boton('cerrar-compartir', 'Cancelar');
const listo = boton('cerrar-compartir', 'Listo');

function cuerpo(estado: EstadoCompartir): string {
  switch (estado.paso) {
    case 'opciones':
      return boton('compartir-pdf', 'PDF') + boton('compartir-link', 'Link') + boton('compartir-texto', 'Texto') + cancelar;
    case 'generando':
      return '<button class="btn sec" disabled><span class="spin en-boton"></span>Armando el PDF…</button>' +
        '<button class="btn sec" disabled>Link</button><button class="btn sec" disabled>Texto</button>';
    case 'pdf-listo':
      return '<p>El PDF está listo.</p>' + boton('enviar-pdf', 'Enviar PDF', 'prim') + cancelar;
    case 'error-pdf':
      return aviso({ texto: 'No pude armar el PDF.', accion: { etiqueta: 'Reintentar', accion: 'compartir-pdf' } }) + cancelar;
    case 'copiado':
      return `<p>${estado.que === 'link' ? 'Link copiado.' : 'Texto copiado.'}</p>` + listo;
    case 'mostrar':
      return '<p>Copialo desde acá:</p>' + `<div class="copia">${escapar(estado.contenido)}</div>` + listo;
  }
}

export function renderFichaCompartir(estado: EstadoCompartir): string {
  return '<div class="velo" data-accion="cerrar-compartir"></div>' +
    `<div class="hoja-compartir" role="dialog" aria-label="Compartir"><h2>Compartir</h2>${cuerpo(estado)}</div>`;
}
