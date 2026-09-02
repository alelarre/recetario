import { escapar } from './markdown.js';

export function renderLista(arg = {}) {
  const { titulo = '', entradas = [], tags = [], tagsActivos = [] } = arg ?? {};
  const ents = Array.isArray(entradas) ? entradas : [];
  const tagsList = Array.isArray(tags) ? tags : [];
  const activos = Array.isArray(tagsActivos) ? tagsActivos : [];

  const chips = tagsList.map(t => `
    <button class="chip" data-tag="${escapar(t.tag)}" aria-pressed="${activos.includes(t.tag)}">${escapar(t.tag)}</button>`).join('');

  const filas = ents.map(e => {
    const meta = [e.rinde, e.tiempo, e.dificultad].filter(Boolean).join(' · ');
    const incompleto = e.tags?.includes('incompleto');
    return `
      <a class="fila" href="#/r/${escapar(e.id_archivo)}">
        <span>
          <span class="titulo${incompleto ? ' incompleto' : ''}">${escapar(e.titulo)}</span>
          <span class="meta">${escapar(meta || 'Sin datos')}</span>
        </span>
      </a>`;
  }).join('');

  return `
    <header class="encabezado">
      <button data-accion="atras" aria-label="Volver">‹</button>
      <h1>${escapar(titulo)}</h1>
      <span class="cuenta">${ents.length}</span>
    </header>
    ${tagsList.length ? `<div class="chips">${chips}</div>` : ''}
    <div class="listado">${filas || '<p class="contenido">Todavía no hay recetas acá.</p>'}</div>`;
}
