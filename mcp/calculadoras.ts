/**
 * Las calculadoras de *Herramientas* para el agente. Son las de la app
 * (`src/calculadoras/`): mismas tablas, mismas cuentas y mismo texto del
 * resultado. No usan el Drive ni el login.
 *
 * No completan nada: si falta un dato, devuelven qué falta y sus opciones,
 * para que el agente se lo pregunte al usuario.
 */
import { leerPedidoPan, calcularPan, lineasPan, advertenciasPan, type PedidoPan } from '../src/calculadoras/pan.js';
import { leerPedidoSal, lineasSal } from '../src/calculadoras/fermentados.js';
import { gramos } from '../src/calculadoras/gramos.js';
import type { Faltante } from '../src/calculadoras/pedido.js';

type Linea = { nombre: string; valor: string };

export function calcularPanParaElAgente(pedido: PedidoPan):
  { faltan: Faltante[] } | { resultado: Linea[]; harina_total: string; masa_total: string; advertencias: string[] } {
  const leido = leerPedidoPan(pedido);
  if ('faltan' in leido) return leido;
  const r = calcularPan(leido.datos);
  return {
    resultado: lineasPan(leido.datos),
    harina_total: r ? `${gramos(r.harinaTotal)} g` : '—',
    masa_total: r ? `${gramos(r.masaTotal)} g` : '—',
    advertencias: advertenciasPan(leido.datos)
  };
}

export function calcularSalParaElAgente(pedido: { fermento?: string | undefined; peso_total?: number | undefined }):
  { faltan: Faltante[] } | { resultado: Linea[] } {
  const leido = leerPedidoSal(pedido);
  return 'faltan' in leido ? leido : { resultado: lineasSal(leido.datos) };
}
