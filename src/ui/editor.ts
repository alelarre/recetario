/**
 * El editor: un control por clave del frontmatter y un campo de texto por
 * sección (mockup 06). El YAML no se muestra en ningún momento.
 *
 * Dos cosas que no son campos de texto: la categoría, que al guardar **mueve
 * el archivo** entre carpetas de Drive (C04.2.3), y la casilla de completitud,
 * que es la única forma de forzar `completa: true`.
 *
 * Lo que el editor no entiende —claves y secciones desconocidas— no se muestra
 * y se conserva igual: Drive no tiene escritura parcial, así que guardar
 * reescribe el `.md` entero y lo que el editor no preservara se perdería
 * (C04.3c.1).
 */
import { escapar } from './markdown.js';
import { encabezado, aviso } from './componentes.js';
import { ICO } from './iconos.js';
import { DIFICULTADES, dificultadValida } from '../catalogo.js';
import { estaCompleta } from '../recipe.js';
import type { Receta, Entrada } from '../tipos.js';
import type { Categoria } from '../store.js';

export interface ArgsEditor {
  receta: Receta;
  /** Sin entrada es el alta: el archivo todavía no existe en Drive. */
  entrada: Entrada | null;
  categorias?: Categoria[];
  tagsConocidos?: string[];
  /** El texto del aviso cuando el guardado falló. Lo escrito sigue en pantalla. */
  error?: string;
  /** Borrar es destructivo: la confirmación nombra la receta (C04.6.1). */
  confirmandoBorrado?: boolean;
}

const campo = (nombre: string, etiqueta: string, valor?: string | null, ph = ''): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<input name="${nombre}" value="${escapar(valor ?? '')}"${ph ? ` placeholder="${escapar(ph)}"` : ''}></label>`;

/**
 * Un tag del editor: una pill con su propia cruz. Se exporta porque `main`
 * agrega una sin redibujar el formulario entero —redibujarlo perdería lo que
 * el usuario venía escribiendo en los demás campos—.
 */
export const pillTag = (tag: string): string =>
  `<button type="button" class="chip" data-accion="tag-quitar" data-valor="${escapar(tag)}">` +
  `${escapar(tag)}${ICO.cerrar}</button>`;

const area = (
  nombre: string, etiqueta: string, valor?: string | null, filas = 4, estilo = ''
): string =>
  `<label class="campo"${estilo ? ` style="${estilo}"` : ''}><span>${escapar(etiqueta)}</span>` +
  `<textarea name="${nombre}" rows="${filas}">${escapar(valor ?? '')}</textarea></label>`;

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

  const datos = '<div class="ficha">' +
    campo('titulo', 'Título', receta.titulo) +
    `<label class="campo"><span>Categoría</span><select name="carpeta">${opcionesCarpeta}</select></label>` +
    // Los tags son pills que se sacan de a una, y un campo aparte para sumar.
    // El valor que viaja en el formulario es el `hidden`: el campo de agregar
    // no se llama `tags` justamente para que lo a medio escribir no se guarde.
    '<div class="campo" data-tags><span>Tags</span>' +
      `<div class="chips" data-pills>${tags.map(pillTag).join('')}</div>` +
      `<input type="hidden" name="tags" value="${escapar(tags.join(', '))}">` +
      '<input data-tag-nuevo list="tags-conocidos" placeholder="Agregar un tag y Enter">' +
      `<datalist id="tags-conocidos">${tagsConocidos.map(t => `<option value="${escapar(t)}">`).join('')}</datalist>` +
    '</div>' +
    '<div class="par" style="margin-bottom:var(--e-4)">' +
      campo('rinde', 'Rinde', receta.rinde) +
      campo('tiempo', 'Tiempo', receta.tiempo) +
    '</div>' +
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

  // La casilla es la declaración del usuario, no el cálculo: una receta con
  // ingredientes y pasos ya cuenta como completa sin tildar nada (C05.3.1), y
  // la clave `completa: true` existe para las que igual están terminadas
  // aunque les falte algo. Sin decirlo, la casilla desmarcada se lee como si
  // la receta estuviera incompleta.
  const derivada = estaCompleta({ ...receta, completa: false });
  // Tildada cuando la receta está completa, venga del cálculo o de la clave:
  // verla vacía en una receta completa se lee como una contradicción.
  //
  // Cuando la completitud es derivada la casilla queda **bloqueada**: no hay
  // nada que declarar, y dejarla editable haría que guardar sin tocar nada
  // escribiera `completa: true` en un `.md` que no la tenía — convertiría en
  // declarado lo que F05.3 quiere derivado. Un `input` deshabilitado no viaja
  // en el formulario, así que no se escribe ninguna clave.
  //
  // Si el archivo sí trae `completa: true`, la casilla queda editable aunque el
  // cálculo también la dé por completa: es la única forma de borrar la clave.
  const bloqueada = derivada && !receta.completa;
  const nota = bloqueada
    ? 'Ya cuenta como completa: tiene título, ingredientes y pasos. No hace falta marcarla.'
    : derivada
      ? 'Tiene título, ingredientes y pasos. Podés desmarcarla: igual va a contar como completa.'
      : 'Le falta algún ingrediente o paso. Marcala si igual está terminada así.';
  const completa = '<div class="ficha"><label class="check">' +
    '<input type="checkbox" name="completa"' +
      `${receta.completa || derivada ? ' checked' : ''}${bloqueada ? ' disabled' : ''}>` +
      ' Está completa así como está' +
    '</label>' +
    `<p class="aviso-mudo" style="margin:var(--e-2) 0 0">${nota}</p>` +
  '</div>';

  const borrar = !entrada ? ''
    : confirmandoBorrado
      ? '<div class="ficha" style="border-color:var(--error)">' +
        `<p class="lee" style="margin:0 0 var(--e-4)">¿Borrar <b>${escapar(receta.titulo ?? 'esta receta')}</b>?</p>` +
        '<div class="acciones">' +
          '<button class="btn sec" data-accion="cancelar-borrado" type="button">Cancelar</button>' +
          '<button class="btn pel" data-accion="borrar-confirmado" type="button">Borrar</button>' +
        '</div></div>'
      : '<div class="ficha"><button class="btn pel" data-accion="borrar" type="button">Borrar receta</button></div>';

  return encabezado({
    titulo: entrada ? 'Editando' : 'Nueva receta',
    volver: true,
    derecha: '<button class="btn prim compacto" data-accion="guardar">Guardar</button>'
  }) +
    '<form class="cuerpo" data-formulario>' +
      // Sin botón de reintentar: el reintento es tocar Guardar otra vez, que
      // está arriba y no se fue a ningún lado (R1).
      (error ? aviso({ texto: error }) : '') +
      datos + contenido + completa + borrar +
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
    notas: receta.notas,
    ...(receta.completa ? { completa: 'on' } : {})
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
    tiempo: texto('tiempo'),
    dificultad: dificultadValida(datos['dificultad']) || null,
    fuente: texto('fuente'),
    foto: texto('foto'),
    // La casilla desmarcada borra la clave; la app nunca escribe `completa: false`.
    completa: datos['completa'] === 'on' || datos['completa'] === 'true',
    descripcion: datos['descripcion'] ?? base.descripcion,
    ingredientes: datos['ingredientes'] ?? base.ingredientes,
    preparacion: datos['preparacion'] ?? base.preparacion,
    variaciones: datos['variaciones'] ?? base.variaciones,
    notas: datos['notas'] ?? base.notas
  };
}
