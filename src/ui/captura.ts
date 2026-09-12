/**
 * La captura del Share Target (mockup 07).
 *
 * El flujo más crítico del producto y la pantalla más simple: la fuente ya
 * viene cargada y no se edita, el único campo es el título, y guardar escribe
 * una fila de la planilla de Borradores y cierra. Sin categoría, sin tags y
 * sin notas: cada campo de más es una razón para no capturar (C01.2.1).
 *
 * Sin fuente es «Agregar a mano» desde Borradores: ahí la fuente sí se
 * escribe, porque no vino de ningún lado (C01.4.3).
 */
import { escapar } from './markdown.js';
import { aviso, encabezado } from './componentes.js';

export interface OpcionesCaptura {
  /** Lo que compartió la app de origen. Vacío cuando se agrega a mano. */
  fuente: string;
  titulo: string;
  /** Texto libre, opcional: lo que haya que recordar del borrador. */
  nota?: string;
  guardando: boolean;
  error?: string;
}

export function renderCaptura({ fuente, titulo, nota = '', guardando, error }: OpcionesCaptura): string {
  const sinTitulo = !titulo.trim();
  const fuenteVisible = fuente.replace(/^https?:\/\//i, '');

  // Compartido desde otra app: es una pantalla efímera encima de lo que el
  // usuario estaba haciendo, sin encabezado ni volver, y se sale con Cancelar
  // (C01.2.2). Agregado a mano desde Borradores es una pantalla más de la app,
  // y lleva el encabezado y el volver como todas.
  const cabecera = fuente
    ? '<h1>Guardar en Recetario</h1>'
    : '';

  return (fuente ? '' : encabezado({ titulo: 'Nuevo borrador', volver: true })) +
    '<div class="hoja">' +
    cabecera +
    (fuente
      ? `<div class="fnt">${escapar(fuenteVisible)}</div>`
      : '<label class="campo"><span>Fuente</span>' +
        '<input name="fuente" placeholder="Una URL, o dónde está anotada"></label>') +
    (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'guardar-captura' } }) : '') +
    '<label class="campo"><span>Título</span>' +
      `<input name="titulo" value="${escapar(titulo)}" autofocus placeholder="Pasta con berenjenas"></label>` +
    // Lo que haya que recordar y no entre en el título: «la versión sin
    // lactosa», «probarla con menos sal». Opcional.
    `<label class="campo"><span>Nota</span><textarea name="nota" rows="2">${escapar(nota)}</textarea></label>` +
    '<div class="pie2">' +
      '<button class="btn sec" data-accion="cancelar-captura">Cancelar</button>' +
      `<button class="btn prim" data-accion="guardar-captura"${sinTitulo || guardando ? ' disabled' : ''}>` +
        `${guardando ? 'Guardando…' : 'Guardar'}</button>` +
    '</div>' +
  '</div>';
}
