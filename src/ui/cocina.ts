/**
 * El modo cocina (mockup 02).
 *
 * Es la única pantalla con conmutador: acá notas y variaciones no se usan, que
 * era el argumento con el que las pestañas se habían vetado. Abre en
 * Ingredientes —el mise en place va primero— y todo lo que se marca mientras
 * se cocina se pierde al salir: no persiste nada (C03.2.4).
 */
import { escapar, aHtml } from './markdown.js';
import { ICO } from './iconos.js';
import { gruposDe, tramosDe } from '../recipe.js';
import type { Receta } from '../tipos.js';

export type PosicionCocina = 'ingredientes' | 'pasos';

export interface OpcionesCocina {
  receta: Receta;
  posicion: PosicionCocina;
  /** El paso realzado, o `null`. Índice global sobre todos los pasos. */
  aqui: number | null;
  /** Los pasos marcados, por el mismo índice global. */
  hechos: number[];
  /** El wake lock está tomado. Si el navegador no lo soporta, el botón no se dibuja. */
  wakeActivo?: boolean;
}

/** Sin soporte no se ofrece y no se avisa: no hay nada que el usuario pueda hacer (C03.3.1). */
const hayWakeLock = (): boolean =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export function renderCocina(
  { receta, posicion, aqui, hechos, wakeActivo = false }: OpcionesCocina
): string {
  const grupos = gruposDe(receta.ingredientes).filter(g => g.items.length);
  const tramos = tramosDe(receta.preparacion).filter(t => t.pasos.length);
  const marcados = Array.isArray(hechos) ? hechos : [];

  const posiciones = [
    ...(grupos.length ? [['ingredientes', 'Ingredientes'] as const] : []),
    ...(tramos.length ? [['pasos', 'Pasos'] as const] : [])
  ];
  const conmutador = posiciones.length > 1
    ? '<div class="conm">' + posiciones.map(([clave, rotulo]) =>
        `<button class="${clave === posicion ? 'on' : ''}" data-accion="conmutar" data-posicion="${clave}">${rotulo}</button>`
      ).join('') + '</div>'
    : '';

  const ingredientes = grupos.map(g =>
    (g.nombre ? `<div class="grupo">${escapar(g.nombre)}</div>` : '') +
    g.items.map(i =>
      `<div class="ing"><span class="n">${escapar(i.nombre)}</span>` +
      (i.cantidad ? `<span class="c">${escapar(i.cantidad)}</span>` : '') +
      '</div>').join('')
  ).join('');

  // Los pasos se numeran por tramo, como están escritos; el índice que marca
  // el hilo es global, para que «acá voy» sea uno solo en toda la receta.
  let n = -1;
  const pasos = tramos.map(t =>
    (t.nombre ? `<div class="tramo">${escapar(t.nombre)}</div>` : '') +
    `<ol class="pasos">${t.pasos.map(p => {
      n++;
      const clase = n === aqui ? 'aqui' : marcados.includes(n) ? 'hecho' : '';
      return `<li${clase ? ` class="${clase}"` : ''} data-accion="paso" data-paso="${n}">${aHtml(p)}</li>`;
    }).join('')}</ol>`
  ).join('');

  const contenido = posicion === 'ingredientes' && grupos.length ? ingredientes : pasos;

  const wake = hayWakeLock()
    ? `<div class="wake"><button class="btn ${wakeActivo ? 'prim' : 'sec'}" data-accion="wake">${ICO.sol}` +
      `${wakeActivo ? 'Pantalla encendida' : 'Mantener la pantalla encendida'}</button></div>`
    : '';

  return '<div class="encoc">' +
      `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>` +
      `<span class="tit">${escapar(receta.titulo ?? '')}</span>` +
      '<button class="btn sec compacto" data-accion="salir-cocina">Salir</button>' +
    '</div>' +
    conmutador +
    `<div class="coc">${contenido}</div>` +
    wake;
}
