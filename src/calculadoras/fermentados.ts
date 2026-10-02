/**
 * La calculadora de sal para fermentados. **Toda su fórmula vive acá.**
 *
 * Es una sola cuenta para la sal seca y para la salmuera: el porcentaje sobre
 * el peso total, que es todo lo que hay en el frasco —la verdura y, si va en
 * salmuera, el agua—. Con el tiempo, la sal se reparte entre las dos.
 *
 * El tiempo es cuándo empezar a probar según la temperatura del ambiente, en
 * días, por franja. Una franja sin fuente queda sin dato: no se extrapola.
 * Las fuentes de cada valor están en
 * `product-design/research/herramientas/fermentos-conservas-curados.md`.
 */
import { porNombre, positivo, type Faltante, type Pedido } from './pedido.js';
import { gramos, porciento } from './gramos.js';

export type ClaveFermento = 'chucrut' | 'kimchi' | 'ajies' | 'salmuera' | 'pepinos';
export type ClaveTemperatura = 'menos-13' | '13-18' | '18-24' | 'mas-24';

/** Las franjas de temperatura del ambiente. */
export const TEMPERATURAS: readonly { clave: ClaveTemperatura; nombre: string }[] = [
  { clave: 'menos-13', nombre: 'Menos de 13 °C' },
  { clave: '13-18', nombre: '13 a 18 °C' },
  { clave: '18-24', nombre: '18 a 24 °C' },
  { clave: 'mas-24', nombre: 'Más de 24 °C' }
];

/** Días hasta empezar a probar: desde y hasta. `null` es una franja sin dato. */
type Dias = readonly [number, number] | null;

/** Cada fermento con su % de sal sobre el peso total y sus días por franja. */
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
  fermento: ClaveFermento;
  /** En gramos: la verdura, y el agua si va en salmuera. */
  pesoTotal: number;
  /** Sin temperatura no hay tiempo: el agente puede pedir sólo la sal. */
  temperatura: ClaveTemperatura | null;
}

/** Los gramos de sal y el porcentaje usado, o `null` si el peso no es un número positivo. */
export function calcularSal(d: DatosSal): { sal: number; porcentaje: number } | null {
  if (!Number.isFinite(d.pesoTotal) || d.pesoTotal <= 0) return null;
  const fermento = FERMENTOS.find(f => f.clave === d.fermento);
  if (!fermento) throw new Error(`Opción desconocida: ${d.fermento}`);
  return { sal: d.pesoTotal * fermento.sal / 100, porcentaje: fermento.sal };
}

/** El tiempo hasta empezar a probar, como se muestra. */
function textoTiempo(fermento: ClaveFermento, temperatura: ClaveTemperatura): string {
  const dias = FERMENTOS.find(f => f.clave === fermento)?.dias[temperatura] ?? null;
  return dias ? `${dias[0]} a ${dias[1]} días` : 'sin dato a esta temperatura';
}

export interface PedidoSal {
  fermento?: string | undefined;
  peso_total?: number | undefined;
  temperatura?: string | undefined;
}

/**
 * Los datos de un pedido del MCP, o lo que falta con sus opciones. Sin valores
 * por defecto. La temperatura es opcional: sin ella no hay tiempo, pero una
 * que no es una de las franjas falta.
 */
export function leerPedidoSal(p: PedidoSal): Pedido<DatosSal> {
  const faltan: Faltante[] = [];
  const fermento = porNombre(FERMENTOS, p.fermento);
  if (!fermento) faltan.push({ dato: 'fermento', opciones: FERMENTOS.map(f => f.nombre) });
  const peso = positivo(p.peso_total);
  if (peso === null) faltan.push({ dato: 'peso_total', opciones: [] });
  const temperatura = p.temperatura === undefined ? null : porNombre(TEMPERATURAS, p.temperatura);
  if (p.temperatura !== undefined && !temperatura) faltan.push({ dato: 'temperatura', opciones: TEMPERATURAS.map(t => t.nombre) });
  return fermento && peso !== null && !faltan.length
    ? { datos: { fermento: fermento.clave, pesoTotal: peso, temperatura: temperatura?.clave ?? null } }
    : { faltan };
}

/** Lo que muestra la calculadora la primera vez. */
export const SAL_POR_DEFECTO: DatosSal = { fermento: 'chucrut', pesoTotal: 1000, temperatura: '18-24' };

/** Las últimas elecciones guardadas, dato por dato: lo que no vale vuelve al valor por defecto. */
export function completarSal(guardado: unknown): DatosSal {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const fermento = FERMENTOS.find(f => f.clave === g['fermento'])?.clave ?? SAL_POR_DEFECTO.fermento;
  const peso = g['pesoTotal'];
  const temperatura = TEMPERATURAS.find(t => t.clave === g['temperatura'])?.clave ?? SAL_POR_DEFECTO.temperatura;
  return {
    fermento,
    pesoTotal: typeof peso === 'number' && Number.isFinite(peso) && peso > 0 ? peso : SAL_POR_DEFECTO.pesoTotal,
    temperatura
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

/** El resto del resultado: con temperatura, el tiempo. Lo usan la pantalla y el MCP. */
export const lineasSal = (d: DatosSal): Linea[] =>
  (d.temperatura ? [{ nombre: 'Tiempo', valor: textoTiempo(d.fermento, d.temperatura) }] : []);

/** Las advertencias del resultado: con tiempo, que es cuándo empezar a probar. */
export const advertenciasSal = (d: DatosSal): readonly string[] => (d.temperatura ? ADVERTENCIAS_SAL : []);
