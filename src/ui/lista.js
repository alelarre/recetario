import { escapar } from './markdown.js';
import { colorCategoria, fotoCategoria } from './categorias.js';

/**
 * Una lista de recetas: la de una categoría, o los resultados de una búsqueda.
 *
 * `grupos` llega sólo desde la búsqueda, que separa las coincidencias por
 * título de las coincidencias por ingrediente. Ahí el chip de color sí informa
 * —vienen categorías mezcladas—; dentro de una categoría no aparece, porque
 * serían veinte cuadraditos iguales que cuestan altura de fila y no dicen nada.
 */
export function renderLista(arg = {}) {
  const { titulo = '', entradas = [], tags = [], tagsActivos = [], grupos = null, vacio = null } = arg ?? {};
  const ents = Array.isArray(entradas) ? entradas : [];
  const tagsList = Array.isArray(tags) ? tags : [];
  const activos = Array.isArray(tagsActivos) ? tagsActivos : [];

  const chips = tagsList.map(t => `
    <button class="chip" data-tag="${escapar(t.tag)}" aria-pressed="${activos.includes(t.tag)}">${escapar(t.tag)}</button>`).join('');

  let cuerpo, total;
  if (grupos) {
    const { porNombre = [], porIngrediente = [] } = grupos;
    total = porNombre.length + porIngrediente.length;
    cuerpo = [
      seccion('Por nombre', porNombre),
      seccion('Por ingrediente', porIngrediente),
    ].join('');
  } else {
    total = ents.length;
    cuerpo = ents.map(e => fila(e, { conMarca: false })).join('');
  }

  return `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <h1>${escapar(titulo)}</h1>
      <span class="cuenta">${total}</span>
    </header>
    ${tagsList.length ? `<div class="chips">${chips}</div>` : ''}
    <div class="listado">${cuerpo || vacioHtml(vacio)}</div>`;
}

function seccion(rotulo, ents) {
  if (!ents.length) return '';
  return `<p class="rotulo">${escapar(rotulo)} · ${ents.length}</p>` +
    ents.map(e => fila(e, { conMarca: true })).join('');
}

function fila(e, { conMarca }) {
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
function vacioHtml(vacio) {
  const { titulo = 'Todavía no hay nada acá', detalle = '' } = vacio ?? {};
  return `<div class="vacio"><strong>${escapar(titulo)}</strong>${detalle ? `<p>${escapar(detalle)}</p>` : ''}</div>`;
}
