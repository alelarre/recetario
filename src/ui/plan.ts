/**
 * El plan de la semana (mockup 12).
 *
 * Siete días desde hoy, dos comidas cada uno, y cada comida es una lista de
 * recetas. No hay fechas ni semana siguiente: el único lugar donde entra hoy es
 * el orden en que se dibujan los días. El plan parcial es el caso normal y no
 * se señala; el plan vacío tampoco lleva aviso, porque las catorce celdas con
 * su `+` ya lo dicen.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, conLateral, izquierdaDelEncabezado } from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
import { colorCategoria } from './categorias.js';
import { ICO } from './iconos.js';
import { DIAS_CORTOS, MOMENTOS, NOMBRE_DEL_MOMENTO, diasDesde, tituloDeComida } from '../plan.js';
import type { Entrada, Momento, Plan } from '../tipos.js';

export interface OpcionesPlan {
  plan: Plan;
  /** El índice en memoria: de ahí salen el color de la categoría y si la receta sigue estando. */
  entradas: Entrada[];
  /** El día de hoy, 0 = lunes. */
  hoy: number;
  /** Reiniciar pregunta antes, en el lugar de los dos botones. */
  confirmandoReinicio?: boolean;
  /** Lo último que falló al escribir. La grilla sigue mostrando lo que dice Drive. */
  error?: string;
  /** El plan es destino del menú: el lateral y la hamburguesa. */
  menu?: MenuDePantalla;
}

/**
 * Una línea de una celda: el título, que lleva a la receta, y su cruz. Manda
 * el título del índice, que sigue a la receta si se la renombra; el escrito en
 * `_plan.md` queda sólo para la que ya no tiene fila.
 */
function linea(indice: number, titulo: string, entrada: Entrada | undefined): string {
  const nombre = escapar(entrada?.titulo || titulo);
  // Sin fila en el índice la receta ya no está: se marca y no se borra sola
  // —el `.md` puede seguir en Drive—, pero deja de tomar color de categoría.
  const cuerpo = entrada
    ? `<a class="t" href="#/r/${encodeURIComponent(entrada.id_archivo)}">${nombre}</a>`
    : `<span class="t"><s>${nombre}</s></span>`;
  const estilo = entrada ? ` style="--c:${colorCategoria(entrada.categoria)}"` : '';
  return `<div class="it${entrada ? '' : ' ida'}"${estilo}>${cuerpo}` +
    `<button class="x" data-accion="sacar-del-plan" data-i="${indice}" ` +
    `aria-label="Sacar ${nombre}">${ICO.cerrar}</button></div>`;
}

function celda(
  { plan, entradas }: Pick<OpcionesPlan, 'plan' | 'entradas'>, dia: number, momento: Momento
): string {
  // El índice es el de `plan.comidas`: la cruz saca esa línea y nada más, aun
  // con la misma receta dos veces en la misma comida.
  const lineas = plan.comidas
    .map((comida, i) => ({ comida, i }))
    .filter(({ comida }) => comida.dia === dia && comida.momento === momento)
    .map(({ comida, i }) => linea(i, comida.titulo, entradas.find(e => e.id_archivo === comida.id)))
    .join('');
  const mas = `<button class="mas" data-accion="agregar-al-plan" data-dia="${dia}" ` +
    `data-momento="${momento}" aria-label="Agregar a ${escapar(tituloDeComida(dia, momento))}">${ICO.mas}</button>`;
  return `<div class="celda${lineas ? '' : ' libre'}">${lineas}${mas}</div>`;
}

export function renderPlan(
  { plan, entradas, hoy, confirmandoReinicio, error, menu }: OpcionesPlan
): string {
  const filas = diasDesde(hoy).map(dia =>
    `<div class="d${dia === hoy ? ' hoy' : ''}"><b>${DIAS_CORTOS[dia]}</b>` +
    (dia === hoy ? '<span>hoy</span>' : '') + '</div>' +
    MOMENTOS.map(momento => celda({ plan, entradas }, dia, momento)).join('')
  ).join('');

  const grilla = '<div class="grilla-sem"><div class="cab"></div>' +
    MOMENTOS.map(m => `<div class="cab">${NOMBRE_DEL_MOMENTO[m]}</div>`).join('') +
    filas + '</div>';

  const vacio = plan.comidas.length === 0;
  const botones =
    `<button class="btn prim" data-accion="ir-a-compras"${vacio ? ' disabled' : ''}>Lista de compras</button>` +
    `<button class="btn sec" data-accion="reiniciar-plan"${vacio ? ' disabled' : ''}>Reiniciar el plan</button>`;

  // Vacía los siete días: la confirmación lleva el borde de error, como borrar
  // una receta, y va donde estaban los botones.
  const confirmacion = '<div class="ficha" data-confirmar-reinicio style="border-color:var(--error)">' +
    '<p class="lee" style="margin:0 0 var(--e-3)">¿Reiniciar el plan? Se vacían los siete días.</p>' +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="cancelar-reinicio">Cancelar</button>' +
      '<button class="btn prim" data-accion="reiniciar-plan-confirmado">Reiniciar</button>' +
    '</div></div>';

  // Se llega desde el menú, así que el encabezado lo abre: la hamburguesa y no
  // el volver, igual que en las demás pantallas de `MENU` (`router.ts`).
  return conLateral(menu,
      encabezado({ titulo: 'Plan de la semana', ...izquierdaDelEncabezado(menu) }) +
      '<div class="cuerpo denso">' +
        // Sin control de reintento: reintentar es volver a tocar lo que falló (R1).
        (error ? aviso({ texto: error }) : '') +
        grilla +
        `<div class="pie-plan">${confirmandoReinicio ? confirmacion : botones}</div>` +
      '</div>');
}
