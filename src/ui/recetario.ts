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
import { encabezado, tile, lateral, botonMenu } from './componentes.js';
import { ICO } from './iconos.js';

export interface OpcionesRecetario {
  categorias: { id: string; nombre: string; cantidad: number }[];
  /** Cuántos borradores esperan. En cero no se dibuja el número. */
  borradores: number;
  /** El menú lateral está desplegado (sólo en pantalla angosta). */
  menuAbierto?: boolean;
}

export function renderRecetario(
  { categorias, borradores, menuAbierto }: OpcionesRecetario
): string {
  // Alfabético y no por cantidad: la posición de la categoría en la grilla es
  // justo lo que se aprende, y reacomodarla cada vez que entra una receta la
  // vuelve a esconder.
  const grilla = [...categorias]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(c => tile(c.nombre, c.cantidad))
    .join('');

  // Los tres destinos viven en el lateral: el encabezado sólo lleva la
  // hamburguesa, que en pantalla ancha no se dibuja porque el lateral es fijo.
  return lateral({ activo: 'recetario', borradores, ...(menuAbierto ? { abierto: true } : {}) }) +
    '<div class="conten">' +
        encabezado({ titulo: 'Recetario', grande: true, derecha: botonMenu(borradores) }) +
      '<div class="cuerpo">' +
        '<div class="buscar">' + ICO.buscar +
          '<input data-accion="buscar" placeholder="Buscar receta o ingrediente">' +
        '</div>' +
        '<div><div class="rot">Categorías</div>' +
        `<div class="grilla">${grilla}</div></div>` +
      '</div>' +
    '</div>';
}
