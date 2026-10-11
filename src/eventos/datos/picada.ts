/**
 * Los números de la picada: los gramos de cada parte, antes de comer o como
 * la comida, de una sola fuente que da cada parte. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos.
 */
import { CIRCUITO } from './fuentes.js';

export const PICADA = {
  antes: {
    fiambres: { valor: 70, fuente: CIRCUITO }, quesos: { valor: 50, fuente: CIRCUITO }, pan: { valor: 50, fuente: CIRCUITO },
    vegetales: { valor: 30, fuente: CIRCUITO }, snacks: { valor: 25, fuente: CIRCUITO }, dips: { valor: 15, fuente: CIRCUITO }
  },
  comida: {
    fiambres: { valor: 120, fuente: CIRCUITO }, quesos: { valor: 100, fuente: CIRCUITO }, pan: { valor: 130, fuente: CIRCUITO },
    vegetales: { valor: 70, fuente: CIRCUITO }, snacks: { valor: 50, fuente: CIRCUITO }, dips: { valor: 30, fuente: CIRCUITO }
  }
};
