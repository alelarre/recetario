/**
 * El editor: un control por clave del frontmatter y un campo de texto por
 * sección (mockup 06). El YAML no se muestra en ningún momento.
 *
 * Lo que no es un campo de texto: la categoría, que al guardar **mueve el
 * archivo** entre carpetas de Drive (C04.2.3).
 *
 * Lo que el editor no entiende —claves y secciones desconocidas— no se muestra
 * y se conserva igual: Drive no tiene escritura parcial, así que guardar
 * reescribe el `.md` entero y lo que el editor no preservara se perdería
 * (C04.3c.1).
 */
import { escapar } from './markdown.js';
import { encabezado, avisoAlGuardar, iconoDeTag } from './componentes.js';
import { ICO, ICONO_DE_DURACION } from './iconos.js';
import {
  DIFICULTADES, dificultadValida, tagReservado, TAGS_ESPECIALES, tagEspecial, tieneEspecial,
  DURACIONES, duracionValida
} from '../catalogo.js';
import { sePuedeTerminar } from '../recipe.js';
import type { Receta, Entrada } from '../tipos.js';
import type { Categoria } from '../store.js';

export interface ArgsEditor {
  receta: Receta;
  /** Sin entrada es el alta: el archivo todavía no existe en Drive. */
  entrada: Entrada | null;
  categorias?: Pick<Categoria, 'id' | 'nombre'>[];
  tagsConocidos?: string[];
  /** El texto del aviso cuando el guardado falló. Lo escrito sigue en pantalla. */
  error?: string;
  /** Borrar es destructivo: la confirmación nombra la receta (C04.6.1). */
  confirmandoBorrado?: boolean;
}

/** Suelto al pie y no en una ficha: es una acción destructiva, no un campo más. */
export const botonBorrar =
  `<button class="btn pel" data-accion="borrar" type="button" style="width:100%">${ICO.tacho}Borrar receta</button>`;

/**
 * Toma el lugar del botón sin redibujar el formulario, por lo mismo que la
 * pregunta de salida: redibujarlo perdería lo que se venía escribiendo.
 */
export const confirmacionBorrado = (titulo: string | null): string =>
  '<div class="ficha" data-confirmar-borrado style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-4)">¿Borrar <b>${escapar(titulo ?? 'esta receta')}</b>?</p>` +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="cancelar-borrado" type="button">Cancelar</button>' +
      '<button class="btn pel" data-accion="borrar-confirmado" type="button">Borrar</button>' +
    '</div></div>';

/**
 * Salir con cambios pendientes pregunta antes (C04.1.1). Se inserta arriba del
 * formulario sin redibujarlo, por lo mismo que `pillTag`: redibujar perdería
 * justo lo que se está preguntando si descartar.
 */
export const confirmacionSalida =
  '<div class="ficha" data-salida style="border-color:var(--error)">' +
    '<p class="lee" style="margin:0 0 var(--e-4)">¿Salir sin guardar los cambios?</p>' +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="seguir-editando" type="button">Seguir editando</button>' +
      '<button class="btn pel" data-accion="salir-sin-guardar" type="button">Salir</button>' +
    '</div></div>';

const campo = (nombre: string, etiqueta: string, valor?: string | null, ph = ''): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<input name="${nombre}" value="${escapar(valor ?? '')}"${ph ? ` placeholder="${escapar(ph)}"` : ''}></label>`;

/**
 * Un tag del editor: una pill con su propia cruz. Se exporta porque `main`
 * agrega una sin redibujar el formulario entero —redibujarlo perdería lo que
 * el usuario venía escribiendo en los demás campos—. El ícono del especial va
 * antes del nombre, como en los chips de las demás pantallas; la cruz queda
 * al final, que es la que saca el tag.
 */
export const pillTag = (tag: string): string =>
  `<button type="button" class="chip" data-accion="tag-quitar" data-valor="${escapar(tag)}">` +
  `${iconoDeTag(tag)}${escapar(tag)}${ICO.cerrar}</button>`;

const area = (
  nombre: string, etiqueta: string, valor?: string | null, filas = 4, estilo = ''
): string =>
  `<label class="campo"${estilo ? ` style="${estilo}"` : ''}><span>${escapar(etiqueta)}</span>` +
  `<textarea name="${nombre}" rows="${filas}">${escapar(valor ?? '')}</textarea></label>`;

/**
 * Los cuatro tags especiales, un botón cada uno: apretado si la receta
 * lo tiene, suelto si no. `incompleta` no se suelta sin lo mínimo —título,
 * categoría, ingredientes y pasos—: mientras falte, queda apretado y
 * deshabilitado, y la leyenda dice qué hace falta.
 */
function botonesEspeciales(tags: string[], puedeTerminar: boolean): string {
  const botones = TAGS_ESPECIALES.map(t => {
    const bloqueado = t === 'incompleta' && !puedeTerminar;
    const apretado = bloqueado || tieneEspecial({ tags }, t);
    return `<button type="button" class="tag-esp" data-accion="tag-especial" data-valor="${escapar(t)}" ` +
      `aria-pressed="${apretado}"${bloqueado ? ' disabled' : ''}>${iconoDeTag(t)}${escapar(t)}</button>`;
  }).join('');
  return `<div class="tags-esp" role="group" aria-label="Tags especiales">${botones}</div>` +
    `<p class="aviso-mudo leyenda-incompleta"${puedeTerminar ? ' hidden' : ''}>` +
    'Se va a poder sacar <i>incompleta</i> cuando se cargue: título, categoría, ingredientes y pasos.</p>';
}

/**
 * La duración: cinco botones con su relojito, uno apretado a la vez.
 * Tocar el apretado lo suelta. El valor viaja en el `hidden`, que es lo que
 * lee el formulario y lo que compara «cambios sin guardar».
 */
function campoDuracion(tiempo: string | null): string {
  const actual = duracionValida(tiempo);
  const botones = DURACIONES.map(d =>
    `<button type="button" class="dur-btn" data-accion="elegir-duracion" data-valor="${escapar(d)}" aria-pressed="${d === actual}">` +
    `${ICONO_DE_DURACION[d]}${escapar(d)}</button>`).join('');
  return '<div class="campo" data-duraciones><span>Duración</span>' +
    `<div class="duraciones" role="group" aria-label="Duración">${botones}</div>` +
    `<input type="hidden" name="tiempo" value="${escapar(actual)}">` +
    '<p class="aviso-mudo">Hasta comer, con reposo y horno incluidos.</p>' +
  '</div>';
}

export function renderEditor(
  { receta, entrada, categorias = [], tagsConocidos = [], error, confirmandoBorrado }: ArgsEditor
): string {
  // En el alta no hay categoría elegida, y la primera de la lista no es una
  // respuesta: sin elegirla no se sabe en qué carpeta va el archivo
  // (C04.3b.1). El placeholder queda seleccionado y no se puede volver a él.
  const sinElegir = !entrada?.carpeta_id;
  const opcionesCarpeta =
    (sinElegir ? '<option value="" disabled selected>Elegí una categoría</option>' : '') +
    categorias.map(c =>
      `<option value="${escapar(c.id)}"${c.id === entrada?.carpeta_id ? ' selected' : ''}>${escapar(c.nombre)}</option>`
    ).join('');

  const actual = dificultadValida(receta.dificultad);
  const opcionesDificultad = ['', ...DIFICULTADES].map(d =>
    `<option value="${escapar(d)}"${d === actual ? ' selected' : ''}>${escapar(d || '—')}</option>`).join('');

  const tags = receta.tags ?? [];

  const carpetaActual = entrada?.carpeta_id ?? '';
  const puede = sePuedeTerminar(receta, carpetaActual);
  const comunes = tags.filter(t => !tagEspecial(t));
  const especiales = TAGS_ESPECIALES.filter(t =>
    (t === 'incompleta' && !puede) || tieneEspecial({ tags }, t));

  // Las dos fichas llevan título: el formulario es largo, y al hacer scroll es lo
  // que dice en qué parte se está.
  const datos = '<div class="ficha"><h2>Datos</h2>' +
    campo('titulo', 'Título', receta.titulo) +
    `<label class="campo"><span>Categoría</span><select name="carpeta">${opcionesCarpeta}</select></label>` +
    // Los tags son pills que se sacan de a una, y un campo aparte para sumar.
    // El valor que viaja en el formulario es el `hidden`: el campo de agregar
    // no se llama `tags` justamente para que lo a medio escribir no se guarde.
    '<div class="campo" data-tags><span>Tags</span>' +
      botonesEspeciales(tags, puede) +
      `<div class="chips" data-pills>${comunes.map(pillTag).join('')}</div>` +
      `<input type="hidden" name="tags" value="${escapar([...especiales, ...comunes].join(', '))}">` +
      '<input data-tag-nuevo list="tags-conocidos" placeholder="Agregar un tag y Enter">' +
      // Los reservados no se sugieren: no se pueden escribir a mano.
      `<datalist id="tags-conocidos">${tagsConocidos.filter(t => !tagReservado(t))
        .map(t => `<option value="${escapar(t)}">`).join('')}</datalist>` +
      '<p class="error-tag" hidden>Tag no permitido</p>' +
    '</div>' +
    campo('rinde', 'Rinde', receta.rinde) +
    campoDuracion(receta.tiempo) +
    `<label class="campo"><span>Dificultad</span><select name="dificultad">${opcionesDificultad}</select></label>` +
    campo('fuente', 'Fuente', receta.fuente) +
    campo('foto', 'Foto', receta.foto, 'https://…') +
  '</div>';

  // Cómo se escribe un ingrediente para que el filtro por ingrediente lo
  // encuentre y la cantidad quede en su columna (C05.1.2, C05.1.3). El editor
  // no corrige ni valida: por eso es una ayuda y no una regla.
  const FORMATO = [
    'Un ingrediente por línea, con guión:',
    '',
    '- Merluza — 800 g',
    '- Aceite — c/n',
    '- Sal, pimienta',
    '',
    'El nombre va primero y la cantidad después del separador, que puede ser',
    '— | - ; o una coma seguida de un número.',
    '',
    'Los ### arman grupos:',
    '',
    '### Para la salsa',
    '- Tomate perita — 1 lata'
  ].join('\n');

  const ayudaIngredientes =
    '<details class="esbozo">' +
      '<summary>Formato</summary>' +
      `<pre>${escapar(FORMATO)}</pre>` +
    '</details>';

  const contenido = '<div class="ficha"><h2>Contenido</h2>' +
    area('descripcion', 'Descripción', receta.descripcion, 3) +
    // El campo y su ayuda son un bloque: se pegan.
    area('ingredientes', 'Ingredientes', receta.ingredientes, 8, 'margin-bottom:var(--e-1)') +
    ayudaIngredientes +
    area('preparacion', 'Preparación', receta.preparacion, 6) +
    area('variaciones', 'Variaciones', receta.variaciones, 3) +
    area('notas', 'Notas', receta.notas, 3) +
  '</div>';

  const borrar = !entrada ? ''
    : confirmandoBorrado ? confirmacionBorrado(receta.titulo) : botonBorrar;

  return encabezado({
    titulo: entrada ? 'Editando' : 'Nueva receta',
    volver: true,
    // Fijo arriba, como en la receta abierta (C03.1.2b): Guardar queda a mano
    // aunque se esté escribiendo al fondo del formulario.
    pegajoso: true,
    derecha: '<button class="btn prim compacto" data-accion="guardar">Guardar</button>'
  }) +
    '<form class="cuerpo" data-formulario>' +
      (error ? avisoAlGuardar(error) : '') +
      datos + contenido + borrar +
    '</form>';
}

/** Los valores crudos del formulario: cada campo es el `name` de su input. */
export type DatosFormulario = Record<string, string | undefined>;

/** El formulario que corresponde a una receta. Lo usa el redibujado tras un error. */
export function formularioDesde(receta: Receta): DatosFormulario {
  return {
    titulo: receta.titulo ?? '',
    tags: (receta.tags ?? []).join(', '),
    rinde: receta.rinde ?? '',
    tiempo: receta.tiempo ?? '',
    dificultad: receta.dificultad ?? '',
    fuente: receta.fuente ?? '',
    foto: receta.foto ?? '',
    descripcion: receta.descripcion,
    ingredientes: receta.ingredientes,
    preparacion: receta.preparacion,
    variaciones: receta.variaciones,
    notas: receta.notas
  };
}

/**
 * La receta que resulta del formulario, sobre la que se leyó del `.md`.
 *
 * Lo que el editor no muestra —`extras` y `otras`— viaja en `base` y sale
 * intacto: guardar sin tocar nada tiene que producir un archivo equivalente.
 */
export function recetaDesdeFormulario(datos: DatosFormulario, base: Receta): Receta {
  const texto = (clave: string): string | null => datos[clave]?.trim() || null;

  return {
    ...base,
    titulo: texto('titulo') ?? base.titulo,
    tags: String(datos['tags'] ?? '').split(',').map(t => t.trim()).filter(Boolean),
    rinde: texto('rinde'),
    tiempo: duracionValida(datos['tiempo']) || null,
    dificultad: dificultadValida(datos['dificultad']) || null,
    fuente: texto('fuente'),
    foto: texto('foto'),
    descripcion: datos['descripcion'] ?? base.descripcion,
    ingredientes: datos['ingredientes'] ?? base.ingredientes,
    preparacion: datos['preparacion'] ?? base.preparacion,
    variaciones: datos['variaciones'] ?? base.variaciones,
    notas: datos['notas'] ?? base.notas
  };
}
