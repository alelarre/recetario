import { escapar } from './markdown.js';
import { DIFICULTADES, dificultadValida } from '../catalogo.js';
import type { Receta, Entrada } from '../tipos.js';
import type { Categoria } from '../store.js';

const campoTexto = (nombre: string, etiqueta: string, valor?: string | null): string => `
  <label class="campo"><span>${escapar(etiqueta)}</span>
    <input name="${nombre}" value="${escapar(valor ?? '')}"></label>`;

const campoArea = (nombre: string, etiqueta: string, valor?: string | null): string => `
  <label class="campo"><span>${escapar(etiqueta)}</span>
    <textarea name="${nombre}">${escapar(valor ?? '')}</textarea></label>`;

export interface ArgsEditor {
  receta?: Receta | null;
  /** Sin entrada es el alta: el archivo todavía no existe en Drive. */
  entrada?: Partial<Entrada> | null;
  categorias?: Categoria[];
  tagsConocidos?: string[];
}

export function renderEditor(opts: ArgsEditor = {}): string {
  const { receta, entrada, categorias = [], tagsConocidos = [] } = opts ?? {};

  // Defensa: si receta es null, undefined o no tiene estructura, devolver string seguro
  if (!receta) {
    return '';
  }

  const opcionesCarpeta = categorias.map(c =>
    `<option value="${escapar(c.id)}"${c.id === entrada?.carpeta_id ? ' selected' : ''}>${escapar(c.nombre)}</option>`).join('');
  const dificultadActual = dificultadValida(receta.dificultad);
  const opcionesDificultad: string = ['', ...DIFICULTADES].map(d =>
    `<option value="${escapar(d)}"${d === dificultadActual ? ' selected' : ''}>${escapar(d || 'sin definir')}</option>`).join('');

  const chipsTags = (receta.tags ?? []).map(t =>
    `<span class="chip${t === 'incompleto' ? ' incompleto' : ''}">${escapar(t)}</span>`).join('');

  const otras = (receta.otras ?? []).map((o, i) => `
    <label class="campo"><span>## ${escapar(o.encabezado)}</span>
      <textarea name="otra-${i}">${escapar(o.cuerpo)}</textarea></label>`).join('');

  // Sin entrada todavía no hay archivo en Drive: es el formulario de alta,
  // no el de edición. No tiene sentido ofrecer "Borrar" algo que no existe.
  const esNueva = !entrada;

  return `
    <header class="encabezado">
      <button data-accion="cancelar">Cancelar</button>
      <h1>${esNueva ? 'Nueva receta' : 'Editar receta'}</h1>
      <button data-accion="guardar">Guardar</button>
    </header>
    <form class="contenido" data-formulario>
      ${campoTexto('titulo', 'Título', receta.titulo)}
      <label class="campo"><span>Carpeta</span>
        <select name="carpeta">${opcionesCarpeta}</select></label>
      <label class="campo"><span>Dificultad</span>
        <select name="dificultad">${opcionesDificultad}</select></label>
      ${campoTexto('rinde', 'Rinde', receta.rinde)}
      ${campoTexto('tiempo', 'Tiempo', receta.tiempo)}
      <label class="campo"><span>Tags</span>
        <div class="chips">${chipsTags}</div>
        <input name="tags" value="${escapar((receta.tags ?? []).join(', '))}" list="tags-conocidos">
        <datalist id="tags-conocidos">${tagsConocidos.map(t => `<option value="${escapar(t)}">`).join('')}</datalist>
      </label>
      ${campoTexto('fuente', 'Fuente', receta.fuente)}
      ${campoArea('descripcion', 'Descripción', receta.descripcion)}
      ${campoArea('ingredientes', 'Ingredientes', receta.ingredientes)}
      ${campoArea('preparacion', 'Preparación', receta.preparacion)}
      ${campoArea('variaciones', 'Variaciones', receta.variaciones)}
      ${campoArea('notas', 'Notas', receta.notas)}
      ${otras ? `<div class="otras"><span>Otras secciones · ${(receta.otras ?? []).length}</span>${otras}
        <p class="meta">Secciones que la app no reconoce. Se guardan igual, al final del archivo.</p></div>` : ''}
      ${esNueva ? '' : `<button data-accion="borrar" type="button"><span aria-hidden="true">🗑️</span>Borrar receta</button>`}
    </form>`;
}

/** Los valores crudos del formulario: cada campo es el `name` de su input. */
export type DatosFormulario = Record<string, string | undefined>;

export function recetaDesdeFormulario(
  datos?: DatosFormulario | null,
  original?: Receta | null
): Receta | Partial<Receta> {
  // Defensa: si datos o original son null, devolver neutro
  if (!datos || !original) {
    return original ?? {};
  }

  const otras = (original.otras ?? []).map((o, i) => ({
    encabezado: o.encabezado,
    cuerpo: datos[`otra-${i}`] ?? o.cuerpo
  }));

  return {
    ...original,
    titulo: datos.titulo?.trim() || original.titulo,
    tags: String(datos.tags ?? '').split(',').map(t => t.trim()).filter(Boolean),
    rinde: datos.rinde?.trim() || null,
    tiempo: datos.tiempo?.trim() || null,
    dificultad: dificultadValida(datos.dificultad),
    fuente: datos.fuente?.trim() || null,
    descripcion: datos.descripcion ?? original.descripcion,
    ingredientes: datos.ingredientes ?? original.ingredientes,
    preparacion: datos.preparacion ?? original.preparacion,
    variaciones: datos.variaciones ?? original.variaciones,
    notas: datos.notas ?? original.notas,
    otras
  };
}
