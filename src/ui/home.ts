import { escapar } from './markdown.js';
import { colorCategoria, fotoCategoria } from './categorias.js';

/**
 * El buscador va primero: de las tres formas de llegar a una receta —por
 * categoría, por nombre y por ingrediente— él sirve a dos.
 *
 * Las categorías van en orden alfabético y no por cantidad: ordenar por
 * cantidad reacomodaría la grilla entera cada vez que se agrega una receta, y
 * la posición aprendida se perdería. Las que están en cero se pliegan al
 * final, sin desaparecer: crear una carpeta en Drive tiene que seguir siendo
 * evidente.
 */
/** Una categoría tal como la dibuja el home: nombre y cuántas recetas tiene. */
export interface TileCategoria {
  id?: string;
  nombre?: string;
  cantidad?: number;
}

export interface ArgsHome {
  categorias?: TileCategoria[];
  /** ISO de la última reconstrucción del índice, o '' si nunca se hizo. */
  ultimaReconstruccion?: string;
  vaciasVisibles?: boolean;
}

export function renderHome(arg: ArgsHome = {}): string {
  const { categorias = [], ultimaReconstruccion = '', vaciasVisibles = false } = arg ?? {};
  const cats: TileCategoria[] = Array.isArray(categorias) ? categorias : [];
  const fecha = ultimaReconstruccion
    ? new Date(ultimaReconstruccion).toLocaleString('es-AR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
    : 'nunca';

  const ordenadas = [...cats].sort((a, b) => String(a?.nombre ?? '').localeCompare(String(b?.nombre ?? ''), 'es'));
  const conRecetas = ordenadas.filter(c => (c?.cantidad ?? 0) > 0);
  const vacias = ordenadas.filter(c => !((c?.cantidad ?? 0) > 0));

  return `
    <header class="encabezado">
      <h1>Recetario</h1>
      <button data-accion="menu" aria-label="Más acciones" aria-expanded="false">⋯</button>
    </header>
    <div class="busca"><input class="buscador" data-accion="buscar" type="search" placeholder="Buscar receta o ingrediente"></div>
    <nav class="tiles">${conRecetas.map(tile).join('')}</nav>
    ${vacias.length ? `
      <button class="vacias" data-accion="vacias" aria-expanded="${vaciasVisibles}">
        <span>${vacias.length} ${vacias.length === 1 ? 'categoría vacía' : 'categorías vacías'}</span>
        <span aria-hidden="true">${vaciasVisibles ? '⌃' : '⌄'}</span>
      </button>
      ${vaciasVisibles ? `<nav class="tiles">${vacias.map(tile).join('')}</nav>` : ''}` : ''}
    <a class="alta" href="#/nueva">Nueva receta</a>
    <div class="menu" hidden>
      <button data-accion="reconstruir">Reconstruir índice <span class="cuenta">última vez: ${escapar(fecha)}</span></button>
      <button data-accion="reconectar">Reconectar cuenta</button>
    </div>`;
}

function tile(c: TileCategoria): string {
  const nombre = String(c?.nombre ?? '');
  const foto = fotoCategoria(nombre);
  return `
    <a class="tile" href="#/c/${encodeURIComponent(nombre)}" style="--cat:${colorCategoria(nombre)}">
      ${foto ? `<img src="${escapar(foto)}" alt="" loading="lazy">` : ''}
      <span class="velo"></span>
      <span class="pie">
        <span class="nombre">${escapar(nombre)}</span>
        <span class="cuenta">${c?.cantidad ?? 0}</span>
      </span>
    </a>`;
}
