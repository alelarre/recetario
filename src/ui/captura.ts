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
  /**
   * Se está editando un borrador que ya existe: los tres campos se editan
   * —incluida la fuente— y el encabezado lo dice. Contradice C01.6.1, que
   * dejaba la fuente fija; decisión del usuario el 2026-09-12.
   */
  edicion?: boolean;
  guardando: boolean;
  error?: string;
}

export function renderCaptura(
  { fuente, titulo, nota = '', edicion, guardando, error }: OpcionesCaptura
): string {
  const sinTitulo = !titulo.trim();
  const fuenteVisible = fuente.replace(/^https?:\/\//i, '');
  // Compartido desde otra app: pantalla efímera encima de lo que el usuario
  // estaba haciendo, sin encabezado ni volver, y se sale con Cancelar
  // (C01.2.2). Agregado a mano o editado desde Borradores es una pantalla más
  // de la app, y lleva encabezado y volver como todas.
  const compartido = !!fuente && !edicion;

  const campoTitulo = '<label class="campo"><span>Título</span>' +
    `<input name="titulo" value="${escapar(titulo)}" autofocus placeholder="Pasta con berenjenas"></label>`;
  // Lo que haya que recordar y no entre en el título: «la versión sin
  // lactosa», «probarla con menos sal». Opcional.
  const campoNota =
    `<label class="campo"><span>Nota</span><textarea name="nota" rows="2">${escapar(nota)}</textarea></label>`;

  // Compartida, la fuente va arriba: es el dato que ya vino y el título es lo
  // único que hay que escribir. Escribiendo o editando, el título va primero,
  // que es lo que identifica al borrador.
  const campos = compartido
    ? `<div class="fnt">${escapar(fuenteVisible)}</div>` + campoTitulo + campoNota
    : campoTitulo +
      '<label class="campo"><span>Fuente</span>' +
      `<input name="fuente" value="${escapar(fuente)}" placeholder="Una URL, o dónde está anotada"></label>` +
      campoNota;

  return (compartido ? '' : encabezado({
      titulo: edicion ? 'Editar borrador' : 'Nuevo borrador', volver: true
    })) +
    '<div class="hoja">' +
    (compartido ? '<h1>Guardar en Recetario</h1>' : '') +
    (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'guardar-captura' } }) : '') +
    campos +
    '<div class="pie2">' +
      '<button class="btn sec" data-accion="cancelar-captura">Cancelar</button>' +
      `<button class="btn prim" data-accion="guardar-captura"${sinTitulo || guardando ? ' disabled' : ''}>` +
        `${guardando ? 'Guardando…' : 'Guardar'}</button>` +
    '</div>' +
  '</div>';
}
