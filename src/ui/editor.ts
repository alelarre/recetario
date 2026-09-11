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
import { DIFICULTADES, dificultadValida } from '../catalogo.js';
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

const area = (nombre: string, etiqueta: string, valor?: string | null, filas = 4): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<textarea name="${nombre}" rows="${filas}">${escapar(valor ?? '')}</textarea></label>`;

export function renderEditor(
  { receta, entrada, categorias = [], tagsConocidos = [], error, confirmandoBorrado }: ArgsEditor
): string {
  const opcionesCarpeta = categorias.map(c =>
    `<option value="${escapar(c.id)}"${c.id === entrada?.carpeta_id ? ' selected' : ''}>${escapar(c.nombre)}</option>`
  ).join('');

  const actual = dificultadValida(receta.dificultad);
  const opcionesDificultad = ['', ...DIFICULTADES].map(d =>
    `<option value="${escapar(d)}"${d === actual ? ' selected' : ''}>${escapar(d || '—')}</option>`).join('');

  const tags = receta.tags ?? [];
  const chipsTags = tags.map(t => `<span class="chip">${escapar(t)}</span>`).join('');

  const datos = '<div class="ficha">' +
    campo('titulo', 'Título', receta.titulo) +
    `<label class="campo"><span>Categoría</span><select name="carpeta">${opcionesCarpeta}</select></label>` +
    '<div class="campo"><span>Tags</span>' +
      `<div class="chips">${chipsTags}</div>` +
      `<input name="tags" value="${escapar(tags.join(', '))}" list="tags-conocidos" placeholder="separados por coma">` +
      `<datalist id="tags-conocidos">${tagsConocidos.map(t => `<option value="${escapar(t)}">`).join('')}</datalist>` +
    '</div>' +
    '<div class="par" style="margin-bottom:var(--e-4)">' +
      campo('rinde', 'Rinde', receta.rinde, '4 porciones') +
      campo('tiempo', 'Tiempo', receta.tiempo, '40 min') +
    '</div>' +
    `<label class="campo"><span>Dificultad</span><select name="dificultad">${opcionesDificultad}</select></label>` +
    campo('fuente', 'Fuente', receta.fuente) +
    campo('foto', 'Foto', receta.foto, 'https://…') +
  '</div>';

  const contenido = '<div class="ficha"><h2>Contenido</h2>' +
    area('descripcion', 'Descripción', receta.descripcion, 3) +
    area('ingredientes', 'Ingredientes', receta.ingredientes, 8) +
    area('preparacion', 'Preparación', receta.preparacion, 6) +
    area('variaciones', 'Variaciones', receta.variaciones, 3) +
    area('notas', 'Notas', receta.notas, 3) +
  '</div>';

  const completa = '<div class="ficha"><label class="check">' +
    `<input type="checkbox" name="completa"${receta.completa ? ' checked' : ''}> Está completa así como está` +
  '</label></div>';

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
      (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'guardar' } }) : '') +
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
