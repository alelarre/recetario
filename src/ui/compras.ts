/**
 * La lista de compras (mockup 12): los ingredientes de todo lo que el plan
 * tiene cargado, en dos fichas.
 *
 * Deriva del plan y no se guarda en ningún lado: se lee y se comparte como
 * texto. **No se tilda nada** —se lee en el supermercado y no hay estado que
 * sincronizar—, así que ninguna fila es un control.
 */
import { escapar } from './markdown.js';
import { encabezado, vacio } from './componentes.js';
import { renderFichaCompartir } from './compartir.js';
import { ICO } from './iconos.js';
import type { EstadoCompartir } from './compartir.js';
import type { ListaDeCompras } from '../compras.js';

export interface OpcionesCompras {
  lista: ListaDeCompras;
  /** La ficha de compartir abierta, con *Texto* como única opción. */
  compartir?: EstadoCompartir;
}

/** Las mismas filas que la ficha de ingredientes de la receta. */
const fila = (nombre: string, cantidad?: string): string =>
  `<div class="ing"><span class="n">${escapar(nombre)}</span>` +
  (cantidad ? `<span class="c">${escapar(cantidad)}</span>` : '') + '</div>';

const ficha = (titulo: string, filas: string): string =>
  filas ? `<div class="ficha"><h2>${titulo}</h2>${filas}</div>` : '';

export function renderCompras({ lista, compartir }: OpcionesCompras): string {
  const cuerpo =
    ficha('Con cantidad', lista.conCantidad.map(i => fila(i.nombre, i.cantidad)).join('')) +
    ficha('Sin cantidad', lista.sinCantidad.map(n => fila(n)).join(''));

  return encabezado({
    titulo: 'Lista de compras', volver: true,
    derecha: `<button class="ico" data-accion="compartir-compras" aria-label="Compartir">${ICO.compartir}</button>`
  }) +
    '<div class="cuerpo">' +
      // Las recetas del plan pueden no tener ingredientes, o haberse borrado:
      // la lista queda vacía y lo dice, sin culpar a nadie.
      (cuerpo || vacio('Las recetas del plan no tienen ingredientes cargados.')) +
    '</div>' +
    (compartir ? renderFichaCompartir(compartir) : '');
}
