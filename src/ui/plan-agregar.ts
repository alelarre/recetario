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
import { encabezado, tarjeta, tile } from './componentes.js';
import { ICO } from './iconos.js';
import { tituloDeComida } from '../plan.js';
import type { Categoria, Coincidencia, Coincidencias, Entrada, Momento } from '../tipos.js';

/** La acción que suma la receta tocada a la comida de la ruta. */
const ELEGIR = 'elegir-para-el-plan';
/** La acción que filtra el bloque a las recetas de una categoría de la grilla. */
const ELEGIR_CATEGORIA = 'elegir-categoria-plan';
/** La acción que deja esa categoría y vuelve a Menú diario y la grilla. */
const VOLVER_CATEGORIAS = 'volver-categorias-plan';

export interface OpcionesBloque {
  /** Las recetas con el tag `menú diario`, que se muestran sin buscar nada. */
  menuDiario: Entrada[];
  consulta: string;
  grupos: Coincidencias;
  /** Las 16 categorías, para la grilla que se ofrece sin buscar nada. */
  categorias: Categoria[];
  /** La categoría elegida en esa grilla, o ninguna. */
  categoriaElegida: string | null;
  /** Las recetas de `categoriaElegida`; vacío si no hay ninguna elegida. */
  deLaCategoria: Entrada[];
}

export interface OpcionesPlanAgregar extends OpcionesBloque {
  dia: number;
  momento: Momento;
}

const grupo = (rotulo: string, tarjetas: string[]): string =>
  tarjetas.length
    ? '<div class="grupo-res">' +
      `<div class="rot"><span>${rotulo}</span><span>${tarjetas.length}</span></div>` +
      `<div class="lista">${tarjetas.join('')}</div>` +
      '</div>'
    : '';

const conMotivo = (c: Coincidencia): string => tarjeta(c.entrada, { motivo: c.motivo, accion: ELEGIR });

const listaDeRecetas = (entradas: Entrada[]): string =>
  [...entradas]
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
    .map(e => tarjeta(e, { accion: ELEGIR }))
    .join('');

/**
 * Lo que va debajo de la caja: los resultados agrupados como en `#/buscar`
 * (C02.3.2), las recetas de una categoría elegida en la grilla, o —sin nada de
 * eso— el bloque *Menú diario* junto con la grilla de las 16 categorías. Se
 * dibuja aparte porque escribir lo reemplaza sin repintar la pantalla, que
 * perdería el foco del teclado.
 */
export function bloqueDeAgregar(
  { menuDiario, consulta, grupos, categorias, categoriaElegida, deLaCategoria }: OpcionesBloque
): string {
  if (consulta.trim()) {
    const cuerpo =
      grupo('Por nombre', grupos.porNombre.map(e => tarjeta(e, { accion: ELEGIR }))) +
      grupo('Por ingrediente', grupos.porIngrediente.map(conMotivo)) +
      grupo('Por tag', grupos.porTag.map(conMotivo));
    return cuerpo ||
      `<div class="vacio">Ninguna receta se llama, lleva ni tiene <b>${escapar(consulta)}</b>.</div>`;
  }
  if (categoriaElegida) {
    const lista = listaDeRecetas(deLaCategoria);
    return '<div class="rot-cat">' +
      `<button type="button" class="ico" data-accion="${VOLVER_CATEGORIAS}" aria-label="Volver a las categorías">${ICO.volver}</button>` +
      `<span>${escapar(categoriaElegida)}</span>` +
    '</div>' +
    (lista
      ? `<div class="lista">${lista}</div>`
      : `<div class="vacio">Todavía no hay recetas en <b>${escapar(categoriaElegida)}</b>.</div>`);
  }
  const menu = menuDiario.length
    ? `<div class="grupo-res"><div class="rot">Menú diario</div><div class="lista">${listaDeRecetas(menuDiario)}</div></div>`
    : '';
  const grilla = [...categorias]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map(c => tile(c.nombre, { accion: ELEGIR_CATEGORIA }))
    .join('');
  return menu + `<div class="grupo-res"><div class="rot">Categorías</div><div class="grilla">${grilla}</div></div>`;
}

export function renderPlanAgregar({ dia, momento, ...bloque }: OpcionesPlanAgregar): string {
  return encabezado({ titulo: tituloDeComida(dia, momento), volver: true }) +
    '<div class="cuerpo denso">' +
      // La misma caja del Recetario, con su propia acción: acá escribir filtra
      // en esta pantalla y no navega a los resultados.
      `<div class="buscar">${ICO.buscar}` +
        `<input data-accion="buscar-en-plan" value="${escapar(bloque.consulta)}" placeholder="Buscar receta o ingrediente">` +
      '</div>' +
      `<div data-resultados-plan>${bloqueDeAgregar(bloque)}</div>` +
    '</div>';
}
