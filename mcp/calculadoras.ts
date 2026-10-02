/**
 * Las calculadoras de *Herramientas* para el agente. Son las de la app
 * (`src/calculadoras/`): mismas tablas, mismas cuentas y mismo texto del
 * resultado. No usan el Drive ni el login.
 *
 * El pan parte de lo que trae su tipo, como en la pantalla, y dice con qué
 * calculó. Lo que no sale de un tipo no se completa: si falta, devuelven qué
 * falta y sus opciones, para que el agente se lo pregunte al usuario.
 */
import {
  leerPedidoPan, calcularPan, lineasPan, lineasPrefermento, advertenciasPan, datosUsados, type PedidoPan
} from '../src/calculadoras/pan.js';
import { leerPedidoSal, cifrasSal, lineasSal, advertenciasSal, type PedidoSal } from '../src/calculadoras/fermentados.js';
import { gramos, porciento } from '../src/calculadoras/gramos.js';
import type { Faltante } from '../src/calculadoras/pedido.js';

type Linea = { nombre: string; valor: string };

export function calcularPanParaElAgente(pedido: PedidoPan):
  { faltan: Faltante[] } | {
    usado: Linea[]; resultado: Linea[]; prefermento?: Linea[]; harina_total: string; masa_total: string;
    hidratacion: string; advertencias: string[];
  } {
  const leido = leerPedidoPan(pedido);
  if ('faltan' in leido) return leido;
  const r = calcularPan(leido.datos);
  const prefermento = lineasPrefermento(leido.datos);
  return {
    // Con qué se calculó: con el tipo, parte no la pidió nadie.
    usado: datosUsados(leido.datos),
    // Con prefermento, `resultado` es la masa final.
    ...(prefermento.length ? { prefermento } : {}),
    resultado: lineasPan(leido.datos),
    harina_total: r ? `${gramos(r.harinaTotal)} g` : '—',
    masa_total: r ? `${gramos(r.masaTotal)} g` : '—',
    hidratacion: r ? porciento(r.hidratacion) : '—',
    advertencias: advertenciasPan(leido.datos)
  };
}

export function calcularSalParaElAgente(pedido: PedidoSal):
  { faltan: Faltante[] } | { resultado: Linea[]; advertencias: string[] } {
  const leido = leerPedidoSal(pedido);
  return 'faltan' in leido ? leido
    : { resultado: [...cifrasSal(leido.datos), ...lineasSal(leido.datos)], advertencias: [...advertenciasSal(leido.datos)] };
}
