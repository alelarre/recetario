/**
 * El Recetario: el punto de entrada (IA §4.2).
 *
 * La búsqueda arriba y visible —es el job más frecuente y no se esconde detrás
 * de un ícono (IA §4.4)—, y las categorías abajo, en dos columnas. Sin barra
 * de navegación inferior: con dos lugares primarios, una franja permanente
 * gasta pantalla para una decisión que se toma poco (IA §4.6).
 *
 * Mockup 03.
 */
import { encabezado, tile, carruselTags, vacio, conLateral, izquierdaDelEncabezado } from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
import { ICO } from './iconos.js';

const SIN_RECETAS = 'Todavía no hay recetas. Entran con Nueva receta, compartiendo desde otra app, ' +
  'o como archivos .md en las carpetas de Drive.';

/** Con borradores esperando, el vacío no dice «no hay recetas»: hay, sin terminar. */
const sinTerminadasConBorradores = (n: number): string =>
  `Todavía no hay recetas terminadas. Hay ${n} en Borradores.`;

export interface OpcionesRecetario {
  categorias: { id: string; nombre: string; cantidad: number }[];
  /** Cuántos borradores esperan: el vacío los nombra. */
  borradores: number;
  /** El Recetario es destino del menú: el lateral y la hamburguesa. */
  menu?: MenuDePantalla;
  /** Los tags del recetario entero, ya ordenados por cantidad. */
  tags: { tag: string; cantidad: number }[];
}

export function renderRecetario(
  { categorias, borradores, menu, tags }: OpcionesRecetario
): string {
  // Alfabético y no por cantidad: la posición de la categoría en la grilla es
  // justo lo que se aprende, y reacomodarla cada vez que entra una receta la
  // vuelve a esconder.
  const grilla = [...categorias]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(c => tile(c.nombre, { cantidad: c.cantidad }))
    .join('');

  // Los destinos viven en el lateral: el encabezado sólo lleva la
  // hamburguesa, que en pantalla ancha no se dibuja porque el lateral es fijo.
  return conLateral(menu,
        encabezado({ titulo: 'Recetario', grande: true, ...izquierdaDelEncabezado(menu) }) +
      '<div class="cuerpo">' +
        '<div class="buscar">' + ICO.buscar +
          '<input data-accion="buscar" placeholder="Buscar receta o ingrediente">' +
        '</div>' +
        // Los veinte más usados: con cientos de recetas la cola larga no aporta,
        // y para eso está la búsqueda.
        carruselTags(tags, { tope: 20 }) +
        '<div class="grupo-res"><div class="rot">Categorías</div>' +
        `<div class="grilla">${grilla}</div></div>` +
        // Sin ninguna receta las categorías se ven igual: falta decir por dónde entran,
        // o —si hay borradores— que ya hay algo, sin terminar.
        (categorias.some(c => c.cantidad > 0)
          ? ''
          : vacio(borradores > 0 ? sinTerminadasConBorradores(borradores) : SIN_RECETAS)) +
      '</div>');
}
