/**
 * La calculadora de sal para fermentados. **Toda su fórmula vive acá.**
 *
 * Es una sola cuenta para la sal seca y para la salmuera: el porcentaje sobre
 * el peso total, que es todo lo que hay en el frasco —la verdura y, si va en
 * salmuera, el agua—. Con el tiempo, la sal se reparte entre las dos.
 */
import { porNombre, positivo, type Faltante, type Pedido } from './pedido.js';
import { gramos, porciento } from './gramos.js';

export type ClaveFermento = 'chucrut' | 'kimchi' | 'ajies' | 'salmuera' | 'pepinos';

/** Cada fermento con su % de sal sobre el peso total. */
export const FERMENTOS: readonly { clave: ClaveFermento; nombre: string; sal: number }[] = [
  { clave: 'chucrut', nombre: 'Chucrut', sal: 2 },
  { clave: 'kimchi', nombre: 'Kimchi', sal: 2.5 },
  { clave: 'ajies', nombre: 'Ajíes', sal: 3 },
  { clave: 'salmuera', nombre: 'Verduras en salmuera', sal: 3 },
  { clave: 'pepinos', nombre: 'Pepinos', sal: 3.5 }
];

export interface DatosSal {
  fermento: ClaveFermento;
  /** En gramos: la verdura, y el agua si va en salmuera. */
  pesoTotal: number;
}

/** Los gramos de sal y el porcentaje usado, o `null` si el peso no es un número positivo. */
export function calcularSal(d: DatosSal): { sal: number; porcentaje: number } | null {
  if (!Number.isFinite(d.pesoTotal) || d.pesoTotal <= 0) return null;
  const fermento = FERMENTOS.find(f => f.clave === d.fermento);
  if (!fermento) throw new Error(`Opción desconocida: ${d.fermento}`);
  return { sal: d.pesoTotal * fermento.sal / 100, porcentaje: fermento.sal };
}

/** Los datos de un pedido del MCP, o lo que falta con sus opciones. Sin valores por defecto. */
export function leerPedidoSal(p: { fermento?: string | undefined; peso_total?: number | undefined }): Pedido<DatosSal> {
  const faltan: Faltante[] = [];
  const fermento = porNombre(FERMENTOS, p.fermento);
  if (!fermento) faltan.push({ dato: 'fermento', opciones: FERMENTOS.map(f => f.nombre) });
  const peso = positivo(p.peso_total);
  if (peso === null) faltan.push({ dato: 'peso_total', opciones: [] });
  return fermento && peso !== null ? { datos: { fermento: fermento.clave, pesoTotal: peso } } : { faltan };
}

/** Lo que muestra la calculadora la primera vez. */
export const SAL_POR_DEFECTO: DatosSal = { fermento: 'chucrut', pesoTotal: 1000 };

/** Las últimas elecciones guardadas, dato por dato: lo que no vale vuelve al valor por defecto. */
export function completarSal(guardado: unknown): DatosSal {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const fermento = FERMENTOS.find(f => f.clave === g['fermento'])?.clave ?? SAL_POR_DEFECTO.fermento;
  const peso = g['pesoTotal'];
  return {
    fermento,
    pesoTotal: typeof peso === 'number' && Number.isFinite(peso) && peso > 0 ? peso : SAL_POR_DEFECTO.pesoTotal
  };
}

/** El resultado como se muestra; lo usan la pantalla y el MCP. Sin resultado, guiones. */
export function lineasSal(d: DatosSal): { nombre: string; valor: string }[] {
  const r = calcularSal(d);
  return [
    { nombre: 'Sal', valor: r ? `${gramos(r.sal)} g` : '—' },
    { nombre: 'Porcentaje', valor: r ? porciento(r.porcentaje) : '—' }
  ];
}
