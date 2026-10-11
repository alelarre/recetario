/**
 * Los números de la comida: lo que se pica antes, lo que se come, el
 * acompañamiento, el postre y el pan, cada uno si fuera lo único de su
 * grupo; y las sobras. Salen de
 * `product-design/research/herramientas/verificacion-eventos.md`, sección
 * Decisiones; corregir uno es editar su línea, y ningún test fija un valor.
 * Sólo datos.
 */
import { ELGOURMET, FABRICA_DE_EMPANADAS, FEED_MY_GUESTS, LA_NACION, REINA_DE_VAINILLA } from './fuentes.js';

export const COMIDA = {
  antes: {
    empanadas: { valor: 3, fuente: FABRICA_DE_EMPANADAS },
    // Carne cocida: 80 a 100 g si acompaña otras entradas.
    vitelTone: { valor: 90, fuente: { nombre: 'iProfesional', url: 'https://www.iprofesional.com/actualidad/444565-guia-rapida-cuanto-peceto-comprar-para-el-vitel-tone-de-navidad-segun-cantidad-de-gente' } },
    bocaditos: { valor: 6, fuente: ELGOURMET }
  },
  comer: {
    empanadas: { valor: 5, fuente: FABRICA_DE_EMPANADAS },
    pizza: { valor: 3, fuente: FEED_MY_GUESTS },
    pastaSeca: { valor: 100, fuente: { nombre: 'Garofalo', url: 'https://www.pasta-garofalo.com/es/news/cuantos-gramos-de-pasta-seca-por-persona/' } },
    pastaFresca: { valor: 200, fuente: { nombre: 'Pasta di Como', url: 'https://www.pastadicomo.com/post/guia-simple-para-no-quedarse-corto-cuanta-pasta-fresca-calcular-por-persona' } },
    carne: { valor: 300, fuente: LA_NACION },
    pollo: { valor: 350, fuente: null, nota: 'El pollo por persona es un supuesto: ninguna fuente lo da para una comida.' },
    pescado: { valor: 200, fuente: { nombre: 'La Sal Catering', url: 'https://lasalcatering.com/en/how-to-calculate-food-for-events/' } }
  },
  porcionesPorPizza: { valor: 8, fuente: FEED_MY_GUESTS },
  acompanamiento: {
    // Una papa mediana, de unos 200 g.
    pure: { valor: 200, fuente: LA_NACION },
    papas: { valor: 200, fuente: LA_NACION },
    ensalada: { valor: 120, fuente: { nombre: 'TinaCocina', url: 'https://tinacocina.com/calcular-una-racion-una-fiesta/' } },
    arroz: { valor: 50, fuente: { nombre: 'La Nación', url: 'https://www.lanacion.com.ar/lifestyle/en-las-redes/como-calcular-la-porcion-de-arroz-justa-por-persona-nid27122024/' } }
  },
  postre: {
    torta: { valor: 100, fuente: REINA_DE_VAINILLA },
    // Un litro cada cuatro.
    helado: { valor: 250, fuente: ELGOURMET },
    postre: { valor: 120, fuente: null, nota: 'El postre en porciones es un supuesto: ninguna fuente da cuánto por persona.' },
    fruta: { valor: 150, fuente: null, nota: 'La fruta por persona es un supuesto: ninguna fuente da el número.' }
  },
  // Dos pancitos.
  pan: { valor: 100, fuente: LA_NACION },
  sobras: { valor: 1.3, fuente: { nombre: 'Omni Calculator', url: 'https://www.omnicalculator.com/food/thanksgiving' } }
};
