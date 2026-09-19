/**
 * La captura del Share Target (mockup 07).
 *
 * El flujo más crítico del producto y la pantalla más simple: lo compartido
 * ya viene cargado —el link como fuente, que no se edita, y el resto del
 * texto en la nota—, el título es opcional, y guardar escribe el `.md` del
 * borrador y cierra. Sin categoría ni tags: cada campo de más es una razón
 * para no capturar (C01.2.1).
 *
 * Agregado a mano desde Borradores, la fuente sí se escribe, porque no vino
 * de ningún lado (C01.4.3).
 */
import { escapar } from './markdown.js';
import { avisoAlGuardar, encabezado } from './componentes.js';
import { sePuedeGuardar } from '../borrador.js';

export interface OpcionesCaptura {
  /** El link que compartió la app de origen. Vacío cuando se agrega a mano, o si lo compartido no traía link. */
  fuente: string;
  /**
   * Llegó del menú Compartir. Sin decirlo, se deduce de la fuente; hay que
   * decirlo cuando lo compartido es un texto sin link.
   */
  compartido?: boolean;
  titulo: string;
  /** Texto libre, opcional: lo que haya que recordar del borrador. */
  nota?: string;
  /**
   * Se está editando un borrador que ya existe: los tres campos se editan
   * —incluida la fuente— y el encabezado lo dice.
   */
  edicion?: boolean;
  guardando: boolean;
  error?: string;
}

export function renderCaptura(
  { fuente, titulo, nota = '', compartido: vinoCompartido, edicion, guardando, error }: OpcionesCaptura
): string {
  const vacio = !sePuedeGuardar({ fuente, nota });
  const fuenteVisible = fuente.replace(/^https?:\/\//i, '');
  // Compartido desde otra app: pantalla efímera encima de lo que el usuario
  // estaba haciendo, sin encabezado ni volver, y se sale con Cancelar
  // (C01.2.2). Agregado a mano o editado desde Borradores es una pantalla más
  // de la app, y lleva encabezado y volver como todas.
  const compartido = (vinoCompartido ?? !!fuente) && !edicion;

  const campoTitulo = '<label class="campo"><span>Título (opcional)</span>' +
    `<input name="titulo" value="${escapar(titulo)}" autofocus placeholder="Pasta con berenjenas"></label>`;
  // Lo que haya que recordar y no entre en el título: «la versión sin
  // lactosa», «probarla con menos sal». Opcional.
  //
  // Y el ayuda memoria: la nota se lee como el `.md` de la receta cuando el
  // borrador se convierte, así que lo escrito bajo cada encabezado termina en
  // su campo. Escribirla así no es obligatorio; por eso es un esbozo y no una
  // validación.
  const ESBOZO = [
    '_Descripción_',
    '',
    '## Ingredientes',
    '- Harina 0000 — 500 g',
    '- Sal — c/n',
    '',
    '## Preparación',
    '1. Mezclar todo.',
    '2. Amasar 10 minutos.',
    '',
    '## Variaciones',
    '- Con aceitunas.',
    '',
    '## Notas',
    'Lo que no entre en ningún lado.'
  ].join('\n');

  const campoNota =
    '<label class="campo" style="margin-bottom:var(--e-2)"><span>Nota</span>' +
    `<textarea name="nota" rows="6">${escapar(nota)}</textarea></label>` +
    // Colapsado: es referencia para cuando hace falta, no algo para leer cada vez.
    '<details class="esbozo">' +
      '<summary>Estructura básica</summary>' +
      `<pre>${escapar(ESBOZO)}</pre>` +
    '</details>';

  // Compartida, la fuente va arriba: es el dato que ya vino y el título es lo
  // único que hay que escribir. Escribiendo o editando, el título va primero,
  // que es lo que identifica al borrador.
  const campos = compartido
    ? (fuente ? `<div class="fnt">${escapar(fuenteVisible)}</div>` : '') + campoTitulo + campoNota
    : campoTitulo +
      '<label class="campo"><span>Fuente</span>' +
      `<input name="fuente" value="${escapar(fuente)}" placeholder="Una URL, o dónde está anotada"></label>` +
      campoNota;

  return (compartido ? '' : encabezado({
      titulo: edicion ? 'Editar borrador' : 'Nuevo borrador', volver: true
    })) +
    '<div class="hoja">' +
    (compartido ? '<h1>Guardar en Recetario</h1>' : '') +
    (error ? avisoAlGuardar(error) : '') +
    campos +
    '<div class="pie2">' +
      '<button class="btn sec" data-accion="cancelar-captura">Cancelar</button>' +
      `<button class="btn prim" data-accion="guardar-captura"${vacio || guardando ? ' disabled' : ''}>` +
        `${guardando ? 'Guardando…' : 'Guardar'}</button>` +
    '</div>' +
  '</div>';
}
