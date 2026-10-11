/**
 * Los números del asado: los gramos crudos de cada corte si fuera la única
 * carne —los de hueso, más—, los embutidos, las achuras y lo demás, y el
 * carbón o la leña por kilo de carne. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos.
 */
import type { DatosCombustible } from '../ademas.js';
import { HACERASADO, SADA, SERVIDOS } from './fuentes.js';

export const ASADO = {
  // hacerasado: 450 g de base; con hueso, × 1,25; el pollo, × 1,3.
  tira: { valor: 562.5, fuente: HACERASADO },
  vacio: { valor: 450, fuente: HACERASADO },
  matambre: { valor: 300, fuente: SADA },
  entrana: { valor: 300, fuente: SADA },
  pollo: { valor: 585, fuente: HACERASADO },
  cerdo: { valor: 450, fuente: HACERASADO },
  cordero: { valor: 600, fuente: SERVIDOS },
  chorizo: { valor: 1, fuente: SERVIDOS },
  morcilla: { valor: 0.5, fuente: SERVIDOS },
  chinchulines: { valor: 150, fuente: SERVIDOS },
  mollejas: { valor: 100, fuente: SERVIDOS },
  provoleta: { valor: 1 / 3, fuente: SERVIDOS },
  verduras: { valor: 300, fuente: SERVIDOS },
  papas: { valor: 200, fuente: SERVIDOS },
  ensalada: { valor: 200, fuente: HACERASADO },
  pan: { valor: 100, fuente: SADA }
};

export const COMBUSTIBLE = {
  carbonPorKgCarne: { valor: 1.1, fuente: HACERASADO },
  lenaPorKgCarne: { valor: 2.5, fuente: { nombre: 'Diario Uno', url: 'https://www.diariouno.com.ar/sociedad/asado-perfecto-el-truco-definitivo-calcular-la-cantidad-lena-que-debes-utilizar-n1372266' } },
  vientoOFrio: { valor: 1.2, fuente: HACERASADO },
  bolsaCarbon: { kg: { valor: 3, fuente: SERVIDOS }, nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } }
} satisfies DatosCombustible;
