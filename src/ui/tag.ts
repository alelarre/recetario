/**
 * La lista de las recetas con un tag. Es la pantalla de categoría con otro
 * criterio: el mismo encabezado con total —con el ícono adelante si el tag es
 * especial—, el mismo carrusel para acumular, y la misma lista.
 *
 * Borradores es esta misma lista con el tag `borrador`, dibujada como destino
 * del menú: con el lateral y la hamburguesa en vez del volver, y con cada
 * tarjeta abriendo el editor, que es donde se completa un borrador.
 */
import { encabezado, vacio, iconoDeTag, conLateral, izquierdaDelEncabezado } from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
import { listaPlana } from './lista-recetas.js';
import type { ListaPlana } from '../lista-control.js';

export interface OpcionesTag {
  tag: string;
  /** Lo que arma `lista-control`: filtrada, ordenada y cortada al tramo. */
  lista: ListaPlana;
  /** Los tags prendidos, con el de la ruta. */
  tagsActivos: readonly string[];
  tags: { tag: string; cantidad: number }[];
  /** La lista es Borradores: cada tarjeta abre el editor, y el vacío lo dice. */
  borradores?: boolean;
  /** Borradores es destino del menú: el lateral y la hamburguesa. */
  menu?: MenuDePantalla;
  /** El título del encabezado, si no es el tag: Borradores se llama como en el menú. */
  titulo?: string;
}

export function renderTag({ tag, lista, tagsActivos, tags, borradores, menu, titulo }: OpcionesTag): string {
  // El tag de la ruta no se puede sacar —cambiar de tag es volver—, así que el
  // vacío dice el hecho y no invita a «sacar un filtro» que no se puede sacar.
  // «No hay borradores.» es sólo sin otro tag prendido: con uno, los
  // borradores pueden estar y el filtro no los deja ver.
  const otroTag = tagsActivos.some(t => t !== tag);
  const siVacia = vacio(lista.duracionesActivas.length
    ? 'Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.'
    : borradores && !otroTag ? 'No hay borradores.' : 'Ninguna receta tiene estos tags.');

  const icono = iconoDeTag(tag);
  const pantalla = encabezado({
    titulo: titulo ?? tag, total: lista.total, ...(icono ? { icono } : {}),
    ...izquierdaDelEncabezado(menu)
  }) +
    '<div class="cuerpo denso">' +
      listaPlana({
        lista, vacio: siVacia, tarjeta: { destino: borradores ? 'editor' : 'receta' },
        // El carrusel corta en los mismos veinte que el Recetario.
        carrusel: { tags, activos: tagsActivos, tope: 20, fijo: tag }
      }) +
    '</div>';
  return conLateral(menu, pantalla);
}
