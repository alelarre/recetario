/**
 * Los números de la merienda: cuántos de cada bocado si es lo único, en una
 * merienda de 2 a 4 h; el factor de las horas y el del cumpleaños infantil;
 * y la torta. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos.
 */
import type { Dato, Tramo } from '../tipos.js';
import { COMIDA_PY, REINA_DE_VAINILLA } from './fuentes.js';

export const MERIENDA: {
  facturas: Dato; miga: Dato; salados: Dato; dulces: Dato; torta: Dato; horas: readonly Tramo[]; infantil: Dato;
} = {
  facturas: { valor: 3, fuente: null, nota: 'Las facturas por persona son un supuesto: ninguna fuente da el número.' },
  miga: { valor: 4, fuente: { nombre: 'Diario UNO', url: 'https://www.diariouno.com.ar/sociedad/cuantos-sandwiches-miga-se-calculan-persona-n1255072' } },
  salados: { valor: 8, fuente: COMIDA_PY },
  dulces: { valor: 5, fuente: REINA_DE_VAINILLA },
  torta: { valor: 100, fuente: REINA_DE_VAINILLA },
  // El factor de cada tramo sobre la merienda de 2 a 4 h, que no cambia nada: 6, 8 y 10 bocados.
  horas: [
    { hastaHoras: 2, factor: { valor: 0.75, fuente: COMIDA_PY } },
    { hastaHoras: 4, factor: null },
    { hastaHoras: null, factor: { valor: 1.25, fuente: COMIDA_PY } }
  ],
  // 9 bocados en un cumpleaños infantil contra 8 en una merienda, de 2 a 4 h.
  infantil: { valor: 1.125, fuente: COMIDA_PY }
};
