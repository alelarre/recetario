/**
 * La calculadora de sal para fermentados. **Toda su fórmula vive acá.**
 *
 * Es una sola cuenta para la sal seca y para la salmuera: el porcentaje sobre
 * el peso total, que es todo lo que hay en el frasco —la verdura y, si va en
 * salmuera, el agua—. Con el tiempo, la sal se reparte entre las dos.
 *
 * **El tipo de fermento es un punto de partida, no una regla:** al elegirlo
 * carga su porcentaje de sal, que después se puede cambiar. La cuenta usa el
 * porcentaje escrito, no el del tipo.
 *
 * El tiempo es cuándo empezar a probar según la temperatura del ambiente, en
 * días, por franja. Una franja sin fuente queda sin dato: no se extrapola.
 * Las fuentes de cada valor están en
 * `product-design/research/herramientas/fermentos-conservas-curados.md`.
 */
import { porNombre, positivo, type Faltante, type Pedido } from './pedido.js';
import { gramos, porciento } from './gramos.js';
import { TEMPERATURAS, type ClaveTemperatura } from './temperaturas.js';

export type ClaveFermento = 'chucrut' | 'kimchi' | 'ajies' | 'salmuera' | 'pepinos';

/** Días hasta empezar a probar: desde y hasta. `null` es una franja sin dato. */
type Dias = readonly [number, number] | null;

/** Cada fermento con el % de sal que sugiere, sobre el peso total, y sus días por franja. */
export const FERMENTOS: readonly {
  clave: ClaveFermento; nombre: string; sal: number; dias: Readonly<Record<ClaveTemperatura, Dias>>;
}[] = [
  // Días: missvickie, de la versión suave a la clásica. Por debajo de 15 °C puede no fermentar (NCHFP).
  { clave: 'chucrut', nombre: 'Chucrut', sal: 2,
    dias: { 'menos-13': null, '13-18': [9, 26], '18-24': [6, 16], 'mas-24': [4, 12] } },
  // Días: extensión de la Universidad de Georgia, missvickie y estudios de pH; menos de 13 °C es en heladera.
  { clave: 'kimchi', nombre: 'Kimchi', sal: 2.5,
    dias: { 'menos-13': [10, 35], '13-18': [2, 5], '18-24': [2, 3], 'mas-24': [1, 2] } },
  // Días: superglobalcalculator; más de 24 °C, de resultados de búsqueda.
  { clave: 'ajies', nombre: 'Ajíes', sal: 3,
    dias: { 'menos-13': null, '13-18': null, '18-24': [7, 14], 'mas-24': [5, 7] } },
  // Días: brineandbubble y oldschoolferments (coliflor, zanahoria).
  { clave: 'salmuera', nombre: 'Verduras en salmuera', sal: 3,
    dias: { 'menos-13': null, '13-18': null, '18-24': [5, 14], 'mas-24': [3, 5] } },
  // Días: half-sour, de Oregon State (3,5 %, 15 a 25 °C) y howlongfor.
  { clave: 'pepinos', nombre: 'Pepinos', sal: 3.5,
    dias: { 'menos-13': null, '13-18': [4, 6], '18-24': [4, 6], 'mas-24': null } }
];

export const ADVERTENCIAS_SAL: readonly string[] = [
  'El tiempo es cuándo empezar a probar, no cuándo termina: se prueba y se pasa a la heladera cuando gusta.'
];

export interface DatosSal {
  /** El tipo del que se partió. `null`: un pedido del agente con su porcentaje y sin tipo. */
  fermento: ClaveFermento | null;
  /** En %, sobre el peso total. */
  sal: number;
  /** En gramos: la verdura, y el agua si va en salmuera. */
  pesoTotal: number;
  /** Sin temperatura no hay tiempo: el agente puede pedir sólo la sal. */
  temperatura: ClaveTemperatura | null;
}

const esPositivo = (n: number): boolean => Number.isFinite(n) && n > 0;

/** Los datos al elegir un tipo: el porcentaje de sal vuelve al que sugiere. Quedan el peso y la temperatura. */
export function alElegirFermento(antes: Pick<DatosSal, 'pesoTotal' | 'temperatura'>, fermento: ClaveFermento): DatosSal {
  const tipo = FERMENTOS.find(f => f.clave === fermento);
  if (!tipo) throw new Error(`Opción desconocida: ${fermento}`);
  return { fermento, sal: tipo.sal, pesoTotal: antes.pesoTotal, temperatura: antes.temperatura };
}

/** Los gramos de sal y el porcentaje usado, o `null` si el peso o el porcentaje no son un número positivo. */
export function calcularSal(d: DatosSal): { sal: number; porcentaje: number } | null {
  if (!esPositivo(d.pesoTotal) || !esPositivo(d.sal)) return null;
  return { sal: d.pesoTotal * d.sal / 100, porcentaje: d.sal };
}

/** El tiempo hasta empezar a probar, como se muestra. */
function textoTiempo(fermento: ClaveFermento, temperatura: ClaveTemperatura): string {
  const dias = FERMENTOS.find(f => f.clave === fermento)?.dias[temperatura] ?? null;
  return dias ? `${dias[0]} a ${dias[1]} días` : 'sin dato a esta temperatura';
}

export interface PedidoSal {
  /** El tipo. Con él, el porcentaje de sal que no venga es el que sugiere. */
  fermento?: string | undefined;
  /** En %, sobre el peso total. */
  porcentaje_sal?: number | undefined;
  peso_total?: number | undefined;
  temperatura?: string | undefined;
}

/**
 * Los datos de un pedido del MCP, o lo que falta con sus opciones.
 *
 * **Con el tipo, el porcentaje de sal que no viene es el que sugiere el
 * tipo**, como en la pantalla, y el que viene lo pisa. Sin el tipo hace
 * falta el porcentaje; si no está, lo primero que falta es el tipo. El peso
 * nunca sale del tipo.
 *
 * La temperatura es opcional: sin ella no hay tiempo, pero una que no es una
 * de las franjas falta. El tiempo es del tipo: sin tipo no hay.
 */
export function leerPedidoSal(p: PedidoSal): Pedido<DatosSal> {
  const fermento = porNombre(FERMENTOS, p.fermento);
  // Un tipo que no existe se corrige antes que nada.
  if (p.fermento !== undefined && !fermento) return { faltan: [{ dato: 'fermento', opciones: FERMENTOS.map(f => f.nombre) }] };

  const faltan: Faltante[] = [];
  const sal = p.porcentaje_sal !== undefined ? positivo(p.porcentaje_sal) : fermento?.sal ?? null;
  if (sal === null) {
    if (!fermento) faltan.push({ dato: 'fermento', opciones: FERMENTOS.map(f => f.nombre) });
    if (p.porcentaje_sal !== undefined || !fermento) faltan.push({ dato: 'porcentaje_sal', opciones: [] });
  }
  const peso = positivo(p.peso_total);
  if (peso === null) faltan.push({ dato: 'peso_total', opciones: [] });
  const temperatura = p.temperatura === undefined ? null : porNombre(TEMPERATURAS, p.temperatura);
  if (p.temperatura !== undefined && !temperatura) faltan.push({ dato: 'temperatura', opciones: TEMPERATURAS.map(t => t.nombre) });
  return sal !== null && peso !== null && !faltan.length
    ? { datos: { fermento: fermento?.clave ?? null, sal, pesoTotal: peso, temperatura: temperatura?.clave ?? null } }
    : { faltan };
}

/** El tipo con que arranca la calculadora. */
const FERMENTO_POR_DEFECTO: ClaveFermento = 'chucrut';

/** Lo que muestra la calculadora la primera vez: el tipo de por defecto, con 1 kg y entre 18 y 24 °C. */
export const SAL_POR_DEFECTO: DatosSal = alElegirFermento({ pesoTotal: 1000, temperatura: '18-24' }, FERMENTO_POR_DEFECTO);

/**
 * Las últimas elecciones guardadas, dato por dato: lo que no vale vuelve al
 * valor por defecto —el porcentaje de sal, al que sugiere el tipo guardado—.
 */
export function completarSal(guardado: unknown): DatosSal {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const numero = (x: unknown): number | null => (typeof x === 'number' && esPositivo(x) ? x : null);
  const tipo = FERMENTOS.find(f => f.clave === g['fermento']) ?? FERMENTOS.find(f => f.clave === FERMENTO_POR_DEFECTO);
  return {
    fermento: tipo?.clave ?? FERMENTO_POR_DEFECTO,
    sal: numero(g['sal']) ?? tipo?.sal ?? SAL_POR_DEFECTO.sal,
    pesoTotal: numero(g['pesoTotal']) ?? SAL_POR_DEFECTO.pesoTotal,
    temperatura: TEMPERATURAS.find(t => t.clave === g['temperatura'])?.clave ?? SAL_POR_DEFECTO.temperatura
  };
}

type Linea = { nombre: string; valor: string };

/** Lo que se destaca del resultado: la sal y su porcentaje. Sin resultado, guiones. */
export function cifrasSal(d: DatosSal): Linea[] {
  const r = calcularSal(d);
  return [
    { nombre: 'Sal', valor: r ? `${gramos(r.sal)} g` : '—' },
    { nombre: 'Porcentaje', valor: r ? porciento(r.porcentaje) : '—' }
  ];
}

/** El resto del resultado: con temperatura y tipo, el tiempo. Lo usan la pantalla y el MCP. */
export const lineasSal = (d: DatosSal): Linea[] =>
  (d.temperatura && d.fermento ? [{ nombre: 'Tiempo', valor: textoTiempo(d.fermento, d.temperatura) }] : []);

/** Las advertencias del resultado: con tiempo, que es cuándo empezar a probar. */
export const advertenciasSal = (d: DatosSal): readonly string[] => (lineasSal(d).length ? ADVERTENCIAS_SAL : []);
