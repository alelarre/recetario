/**
 * Lo que comparten los pedidos de las calculadoras por el MCP: el agente
 * manda los datos por su nombre, y lo que falta o no vale vuelve con las
 * opciones para preguntárselas al usuario. Nada se completa por defecto.
 */
import { normalizar } from '../normalizar.js';

/** Un dato que falta o no es una opción, con las que valen. */
export interface Faltante {
  dato: string;
  opciones: readonly string[];
}

export type Pedido<T> = { datos: T } | { faltan: Faltante[] };

/** La fila cuyo nombre o clave es el texto, sin mirar mayúsculas ni tildes. */
export function porNombre<T extends { clave: string; nombre: string }>(tabla: readonly T[], valor: unknown): T | null {
  const n = normalizar(valor);
  if (!n) return null;
  return tabla.find(f => normalizar(f.nombre) === n || normalizar(f.clave) === n) ?? null;
}

/** Un número finito y positivo, o `null`. */
export const positivo = (valor: unknown): number | null =>
  typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : null;
