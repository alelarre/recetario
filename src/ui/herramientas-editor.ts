/**
 * El botón de herramientas del editor (C04.3d): lo que se puede poner en la
 * línea del cursor. Cada herramienta es una entrada de la tabla —ícono,
 * nombre, si está disponible y su paso—; una nueva es una entrada más. La capa
 * se abre como las otras fichas del editor y se cierra con el atrás.
 */
import { escapar } from './markdown.js';
import { ICO } from './iconos.js';
import { renderElegirFoto } from './editor.js';
import { rueda } from './temporizadores.js';
import { aMs, type Duracion } from '../temporizadores.js';
import type { FotoDeReceta } from '../tipos.js';

export interface ContextoDeLinea { seccion: string; linea: number; fotos: FotoDeReceta[]; ruedas: Duracion }

export interface HerramientaDeLinea {
  id: 'foto' | 'cuenta' | 'cronometro';
  nombre: string;
  icono: string;
  /** Por qué no se puede usar ahora, o `null` si se puede. */
  deshabilitada?(ctx: ContextoDeLinea): string | null;
  /** Lo que se dibuja al elegirla, en la misma capa. */
  paso(ctx: ContextoDeLinea): string;
}

const VELO = '<div class="velo" data-accion="cerrar-ficha-foto"></div>';
const RUEDAS_DE_MARCA = { mas: 'marca-rueda-mas', menos: 'marca-rueda-menos', marca: 'data-rueda-marca' };
const enLinea = (ctx: ContextoDeLinea): string => `data-seccion="${escapar(ctx.seccion)}" data-linea="${ctx.linea}"`;

function pasoDeMarca(ctx: ContextoDeLinea, tipo: 'cuenta' | 'cronometro', titulo: string): string {
  const ruedas = tipo === 'cuenta'
    ? `<div class="ruedas">${rueda('h', ctx.ruedas, RUEDAS_DE_MARCA)}${rueda('m', ctx.ruedas, RUEDAS_DE_MARCA)}${rueda('s', ctx.ruedas, RUEDAS_DE_MARCA)}</div>`
    : '';
  const apagado = tipo === 'cuenta' && aMs(ctx.ruedas) <= 0 ? ' disabled' : '';
  return VELO + '<div class="ficha hoja-foto" data-herramientas-linea>' +
    `<h2>${titulo}</h2>` +
    '<label class="campo"><span>Nombre (opcional)</span><input data-etiqueta-marca value="" placeholder="Hornear, reposo…"></label>' +
    ruedas +
    `<button class="btn prim" type="button" data-accion="poner-marca" data-tipo="${tipo}" ${enLinea(ctx)}${apagado}>Poner</button>` +
    '</div>';
}

export const HERRAMIENTAS_DE_LINEA: readonly HerramientaDeLinea[] = [
  {
    id: 'foto', nombre: 'Foto', icono: ICO.imagen,
    deshabilitada: ctx => (ctx.fotos.length ? null : 'Primero agregá una foto en la ficha Fotos'),
    paso: ctx => renderElegirFoto(ctx.fotos, ctx.seccion, ctx.linea)
  },
  { id: 'cuenta', nombre: 'Cuenta regresiva', icono: ICO.relojMas, paso: ctx => pasoDeMarca(ctx, 'cuenta', 'Cuenta regresiva') },
  { id: 'cronometro', nombre: 'Cronómetro', icono: ICO.cronometroMas, paso: ctx => pasoDeMarca(ctx, 'cronometro', 'Cronómetro') }
];

/** La capa con una entrada por herramienta. */
export function renderHerramientasDeLinea(ctx: ContextoDeLinea): string {
  const items = HERRAMIENTAS_DE_LINEA.map(h => {
    const motivo = h.deshabilitada?.(ctx) ?? null;
    return `<button type="button" class="item-herramienta" data-accion="elegir-herramienta-linea" data-herramienta="${h.id}" ${enLinea(ctx)}` +
      `${motivo ? ' disabled' : ''}>${h.icono}<span>${h.nombre}${motivo ? `<span class="det">${motivo}</span>` : ''}</span>${ICO.chevron}</button>`;
  }).join('');
  return VELO + '<div class="ficha hoja-foto" data-herramientas-linea><h2>Agregar en esta línea</h2>' + items + '</div>';
}
