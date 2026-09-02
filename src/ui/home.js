import { escapar } from './markdown.js';

export function renderHome({ categorias = [], ultimaReconstruccion = '' } = {}) {
  const fecha = ultimaReconstruccion
    ? new Date(ultimaReconstruccion).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'nunca';

  const tiles = categorias.map(c => `
    <a class="tile" href="#/c/${encodeURIComponent(c.nombre)}">
      ${escapar(c.nombre)}
      <span class="cuenta">${c.cantidad}</span>
    </a>`).join('');

  return `
    <header class="encabezado">
      <h1>Recetario</h1>
      <button data-accion="menu" aria-label="Más acciones" aria-expanded="false">⋯</button>
    </header>
    <div class="chips"><input class="buscador" data-accion="buscar" type="search" placeholder="Buscar receta o ingrediente"></div>
    <nav class="tiles">${tiles}</nav>
    <div class="menu" hidden>
      <button data-accion="reconstruir">Reconstruir índice <span class="cuenta">última vez: ${escapar(fecha)}</span></button>
      <button data-accion="reconectar">Reconectar cuenta</button>
      <a class="tile" href="#/nueva">Nueva receta</a>
    </div>`;
}
