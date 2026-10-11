/**
 * Lo que vale para todos los eventos: cuánto come un chico y las horas con
 * que arranca el campo. Sale de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir un número es editar su línea, y ningún test fija un
 * valor. Sólo datos.
 */
import type { Comunes } from '../tipos.js';
import { SERVIDOS } from './fuentes.js';

export const COMUNES: Comunes = {
  factorChico: { valor: 0.5, fuente: SERVIDOS },
  // El valor con que arranca el campo de horas, no un número de una fuente.
  horas: 4
};
