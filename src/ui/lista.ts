import { escapar } from './markdown.js';
import { colorCategoria, fotoCategoria } from './categorias.js';
import type { Entrada } from '../tipos.js';

/**
 * La lista de una categoría. Los resultados de búsqueda se fueron a
 * `resultados.ts`, que separa los tres criterios con su motivo.
 */
/** Un tag con cuántas recetas lo llevan, para el chip de filtro. */
export interface TagConCuenta {
  tag: string;
  cantidad: number;
}

/** Qué decir cuando no hay nada que listar. */
export interface EstadoVacio {
  titulo?: string;
  detalle?: string;
}

export interface ArgsLista {
  titulo?: string;
  entradas?: Entrada[];
  tags?: TagConCuenta[];
  tagsActivos?: string[];
  /**
   * El nombre de la categoría que se está mirando, para encabezarla con su
   * foto. Va explícito y no se deduce de `titulo`: en la búsqueda el título es
   * el texto buscado, que no tiene ni foto ni color.
   */
  categoria?: string | null;
  vacio?: EstadoVacio | null;
}

export function renderLista(arg: ArgsLista = {}): string {
  const { titulo = '', entradas = [], tags = [], tagsActivos = [], vacio = null,
          categoria = null } = arg ?? {};
  const ents: Entrada[] = Array.isArray(entradas) ? entradas : [];
  const tagsList: TagConCuenta[] = Array.isArray(tags) ? tags : [];
  const activos: string[] = Array.isArray(tagsActivos) ? tagsActivos : [];

  const chips = tagsList.map(t => `
    <button class="chip" data-tag="${escapar(t.tag)}" aria-pressed="${activos.includes(t.tag)}">${escapar(t.tag)}</button>`).join('');

  const total = ents.length;
  const cuerpo = ents.map(e => fila(e, { conMarca: false })).join('');

  const encabezado = `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <h1>${escapar(titulo)}</h1>
      <span class="cuenta">${total}</span>
    </header>`;

  // La categoría se encabeza con su propia foto: es la misma que el tile que
  // se acaba de tocar en el home, así que la pantalla que se abre confirma
  // dónde entraste sin tener que leer el título. Sin foto queda el color
  // plano, que es el mismo respaldo que usa el tile.
  const foto = categoria ? fotoCategoria(categoria) : null;

  return `
    ${categoria ? `
      <div class="cabecera-cat" style="--cat:${colorCategoria(categoria)}">
        ${foto ? `<img src="${escapar(foto)}" alt="" loading="lazy">` : ''}
        <span class="velo"></span>
        ${encabezado}
      </div>` : encabezado}
    ${tagsList.length ? `<div class="chips">${chips}</div>` : ''}
    <div class="listado">${cuerpo || vacioHtml(vacio)}</div>`;
}

function fila(e: Entrada, { conMarca }: { conMarca: boolean }): string {
  const meta = conMarca
    ? e.categoria
    : [e.rinde, e.tiempo, e.dificultad].filter(Boolean).join(' · ');
  const incompleto = e.tags?.includes('incompleto');
  const foto = conMarca ? fotoCategoria(e.categoria) : null;
  return `
    <a class="fila${incompleto ? ' incompleto' : ''}" href="#/r/${escapar(e.id_archivo)}">
      ${conMarca ? `<span class="marca" style="--cat:${colorCategoria(e.categoria)}">${
        foto ? `<img src="${escapar(foto)}" alt="" loading="lazy">` : ''}</span>` : ''}
      <span>
        <span class="titulo">${escapar(e.titulo)}</span>
        <span class="meta">${escapar(meta || 'Sin datos')}</span>
      </span>
    </a>`;
}

/**
 * Una categoría vacía abría una pantalla en blanco. En un recetario que se
 * llena con agentes por fuera de la app, el vacío tiene que decir de dónde va
 * a salir el contenido.
 */
function vacioHtml(vacio: EstadoVacio | null): string {
  const { titulo = 'Todavía no hay nada acá', detalle = '' } = vacio ?? {};
  return `<div class="vacio"><strong>${escapar(titulo)}</strong>${detalle ? `<p>${escapar(detalle)}</p>` : ''}</div>`;
}
