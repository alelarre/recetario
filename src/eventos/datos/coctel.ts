/**
 * Los números del cóctel o lunch: los bocados por persona en 2 a 4 h, todos
 * juntos, y el factor de las horas. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos.
 */
import type { Dato, Tramo } from '../tipos.js';
import { COMIDA_PY } from './fuentes.js';

export const COCTEL: { bocados: Dato; horas: readonly Tramo[] } = {
  bocados: { valor: 14, fuente: COMIDA_PY },
  // 10, 14 y 18 bocados como comida: el factor de cada tramo sobre el de 2 a 4 h.
  horas: [
    { hastaHoras: 2, factor: { valor: 0.71, fuente: COMIDA_PY } },
    { hastaHoras: 4, factor: null },
    { hastaHoras: null, factor: { valor: 1.29, fuente: COMIDA_PY } }
  ]
};
