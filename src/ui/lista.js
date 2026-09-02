import { escapar } from './markdown.js';

const idDeDrive = (url) => (String(url).match(/\/d\/([A-Za-z0-9_-]+)/) ?? [])[1] ?? null;

function miniatura(entrada, miniaturas) {
  const id = idDeDrive(entrada.foto);
  const mini = id && miniaturas?.get(id);
  if (mini) return `<img class="miniatura" src="${escapar(mini)}" alt="" loading="lazy">`;
  if (entrada.foto && !id) return `<img class="miniatura" src="${escapar(entrada.foto)}" alt="" loading="lazy">`;
  return '<div class="miniatura"></div>';
}

export function renderLista(arg = {}) {
  const { titulo = '', entradas = [], tags = [], tagsActivos = [], miniaturas } = arg ?? {};
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
        ${miniatura(e, miniaturas)}
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
