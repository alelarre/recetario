/**
 * Agregar una receta a una comida del plan (mockup 12).
 *
 * Es el único lugar desde donde se asigna: la receta abierta no ofrece
 * planificar. Arriba la búsqueda del Recetario; debajo, las recetas con el tag
 * `menú diario`, que son las que se cocinan entre semana. Tocar una tarjeta la
 * suma y vuelve al plan, así que acá las tarjetas no llevan a la receta.
 */
import { escapar } from './markdown.js';
import { encabezado, tarjeta } from './componentes.js';
import { ICO } from './iconos.js';
import { tituloDeComida } from '../plan.js';
import type { Coincidencia, Coincidencias, Entrada, Momento } from '../tipos.js';

/** La acción que suma la receta tocada a la comida de la ruta. */
const ELEGIR = 'elegir-para-el-plan';

export interface OpcionesBloque {
  /** Las recetas con el tag `menú diario`, que se muestran sin buscar nada. */
  menuDiario: Entrada[];
  consulta: string;
  grupos: Coincidencias;
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

/**
 * Lo que va debajo de la caja: el bloque *Menú diario*, o los resultados
 * agrupados como en `#/buscar` (C02.3.2). Se dibuja aparte porque escribir lo
 * reemplaza sin repintar la pantalla, que perdería el foco del teclado.
 */
export function bloqueDeAgregar({ menuDiario, consulta, grupos }: OpcionesBloque): string {
  if (consulta.trim()) {
    const cuerpo =
      grupo('Por nombre', grupos.porNombre.map(e => tarjeta(e, { accion: ELEGIR }))) +
      grupo('Por ingrediente', grupos.porIngrediente.map(conMotivo)) +
      grupo('Por tag', grupos.porTag.map(conMotivo));
    return cuerpo ||
      `<div class="vacio">Ninguna receta se llama, lleva ni tiene <b>${escapar(consulta)}</b>.</div>`;
  }
  // Sin ninguna receta con el tag no hay bloque: el lugar queda para la
  // búsqueda, que es lo único que hay para hacer acá.
  if (!menuDiario.length) return '';
  const lista = [...menuDiario]
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
    .map(e => tarjeta(e, { accion: ELEGIR }))
    .join('');
  return `<div><div class="rot">Menú diario</div><div class="lista">${lista}</div></div>`;
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
