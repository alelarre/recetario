/**
 * Agregar una receta a una comida del plan (mockup 12).
 *
 * Es el único lugar desde donde se asigna: la receta abierta no ofrece
 * planificar. Arriba la búsqueda del Recetario; debajo, las recetas con el tag
 * `menú diario` y la grilla de las categorías, los dos atajos para no tener
 * que escribir. Tocar una tarjeta la suma y vuelve al plan, así que acá las
 * tarjetas no llevan a la receta —ni los tiles a la categoría—.
 */
import { escapar } from './markdown.js';
import { encabezado, tile } from './componentes.js';
import { ICO } from './iconos.js';
import { listaAgrupada, listaPlana } from './lista-recetas.js';
import { tituloDeComida } from '../plan.js';
import type { ListaAgrupada, ListaPlana } from '../lista-control.js';
import type { Categoria, Momento } from '../tipos.js';

/** La acción que suma la receta tocada a la comida de la ruta. */
const ELEGIR = 'elegir-para-el-plan';
/** La acción que filtra el bloque a las recetas de una categoría de la grilla. */
const ELEGIR_CATEGORIA = 'elegir-categoria-plan';
/** La acción que deja esa categoría y vuelve a Menú diario y la grilla. */
const VOLVER_CATEGORIAS = 'volver-categorias-plan';

/**
 * Lo que va debajo de la caja, que es una de tres cosas: los resultados de lo
 * escrito, las recetas de una categoría elegida en la grilla, o —sin nada de
 * eso— el bloque *Menú diario* junto con la grilla de las categorías.
 */
export type OpcionesBloque =
  | { busqueda: { consulta: string; lista: ListaAgrupada } }
  | { categoria: { nombre: string; lista: ListaPlana } }
  | { menuDiario: ListaPlana; categorias: Categoria[] };

export type OpcionesPlanAgregar = OpcionesBloque & {
  dia: number;
  momento: Momento;
  /** Lo escrito en la caja. */
  consulta: string;
};

/**
 * Los resultados se agrupan como en `#/buscar` (C02.3.2), con la misma lista.
 * Se dibuja aparte porque buscar lo reemplaza sin repintar la pantalla, que
 * perdería el foco del teclado.
 */
export function bloqueDeAgregar(bloque: OpcionesBloque): string {
  if ('busqueda' in bloque) return listaAgrupada({ ...bloque.busqueda, accion: ELEGIR });
  if ('categoria' in bloque) {
    const { nombre, lista } = bloque.categoria;
    return '<div class="rot-cat">' +
      `<button type="button" class="ico" data-accion="${VOLVER_CATEGORIAS}" aria-label="Volver a las categorías">${ICO.volver}</button>` +
      `<span>${escapar(nombre)}</span>` +
    '</div>' +
    listaPlana({
      lista, tarjeta: { accion: ELEGIR },
      vacio: `<div class="vacio">Todavía no hay recetas en <b>${escapar(nombre)}</b>.</div>`
    });
  }
  const menu = bloque.menuDiario.entradas.length
    ? `<div class="grupo-res"><div class="rot">Menú diario</div>${listaPlana({ lista: bloque.menuDiario, tarjeta: { accion: ELEGIR }, vacio: '' })}</div>`
    : '';
  const grilla = [...bloque.categorias]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(c => tile(c.nombre, { accion: ELEGIR_CATEGORIA }))
    .join('');
  return `<div class="grupos">${menu}<div class="grupo-res"><div class="rot">Categorías</div><div class="grilla">${grilla}</div></div></div>`;
}

export function renderPlanAgregar(opciones: OpcionesPlanAgregar): string {
  const { dia, momento, consulta } = opciones;
  return encabezado({ titulo: tituloDeComida(dia, momento), volver: true }) +
    '<div class="cuerpo denso">' +
      // La misma caja del Recetario, con su propia acción: acá buscar filtra
      // en esta pantalla y no navega a los resultados.
      `<div class="buscar">${ICO.buscar}` +
        `<input data-accion="buscar-en-plan" value="${escapar(consulta)}" placeholder="Buscar receta o ingrediente">` +
      '</div>' +
      `<div data-resultados-plan>${bloqueDeAgregar(opciones)}</div>` +
    '</div>';
}
