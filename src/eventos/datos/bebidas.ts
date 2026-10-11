/**
 * Los números de las bebidas, el hielo y las infusiones: cuánto toma cada uno
 * por hora, el hielo por persona y por litro, y las tazas.
 * Salen de `product-design/research/herramientas/verificacion-eventos.md`,
 * sección Decisiones; corregir uno es editar su línea, y ningún test fija un
 * valor. Sólo datos.
 */
import type { DatosBebidas, DatosHielo, DatosInfusiones } from '../ademas.js';
import { BORDERIO, HACECUENTAS, LA_NACION } from './fuentes.js';

export const BEBIDAS = {
  bebidas: [
    { id: 'cerveza', nombre: 'Cerveza', alcohol: true, mlPorHora: { valor: 350, fuente: HACECUENTAS } },
    { id: 'vino', nombre: 'Vino', alcohol: true, mlPorHora: { valor: 103.5, fuente: HACECUENTAS } },
    { id: 'fernet', nombre: 'Fernet', alcohol: true, mlPorHora: { valor: 25, fuente: HACECUENTAS },
      con: { id: 'cola', nombre: 'Cola para el fernet', mlPorMl: { valor: 3, fuente: HACECUENTAS } } },
    { id: 'gaseosa', nombre: 'Gaseosa', alcohol: false, mlPorHora: { valor: 286, fuente: BORDERIO } },
    { id: 'agua', nombre: 'Agua', alcohol: false, mlPorHora: { valor: 357, fuente: BORDERIO } },
    { id: 'jugo', nombre: 'Jugo', alcohol: false,
      mlPorHora: { valor: 286, fuente: null, nota: 'El jugo por persona es un supuesto, sin fuente: se calcula como la gaseosa.' } }
  ],
  horasPlenas: { valor: 4, fuente: HACECUENTAS },
  despues: { valor: 0.5, fuente: BORDERIO },
  calor: { valor: 1.25, fuente: HACECUENTAS },
  chico: { valor: 1.75, fuente: HACECUENTAS },
  brindis: { mlPorAdulto: { valor: 150, fuente: LA_NACION } }
} satisfies DatosBebidas;

export const HIELO = {
  kgPorPersona: { valor: 0.33, fuente: HACECUENTAS },
  kgPorLitroFrio: { valor: 0.5, fuente: HACECUENTAS },
  calor: { valor: 1.3, fuente: { nombre: 'Rolito', url: 'https://rolito.com.ar/calculadora-de-hielo.html' } },
  bolsa: { kg: { valor: 3, fuente: { nombre: 'Rappi', url: 'https://www.rappi.com.ar/p/hielo-bolsa-x-3kg-177992' } },
    nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } }
} satisfies DatosHielo;

export const INFUSIONES = {
  tazasPorPersona: { valor: 1.4, fuente: { nombre: 'Cortado con hielo', url: 'https://cortadoconhielo.com/cuanto-cafe-preparar-evento/' } },
  infusiones: [
    { id: 'cafe', nombre: 'Café', prendida: true, unidad: 'g',
      porTaza: { valor: 10, fuente: { nombre: 'Starbucks at Home', url: 'https://www.starbucksathome.com/es/brewing-guides/brewing-at-home/coffee-machine' } } },
    { id: 'te', nombre: 'Té', prendida: true, unidad: 'saquitos',
      porTaza: { valor: 1, fuente: { nombre: 'BakeCalcs', url: 'https://bakecalcs.uk/portions-and-catering/afternoon-tea-calculator/' } } },
    { id: 'mate-cocido', nombre: 'Mate cocido', prendida: false, unidad: 'saquitos',
      porTaza: { valor: 1, fuente: { nombre: 'Agro Rural Noticias', url: 'https://www.agroruralnoticias.com.ar/noticias_pagina.php?noticia=42389' } } },
    { id: 'leche', nombre: 'Café con leche (la leche)', prendida: false, unidad: 'ml',
      porTaza: { valor: 75, fuente: { nombre: 'Somos el Café', url: 'https://www.somoselcafe.com.ar/blog/articulo/como-hacer-un-cafe-con-leche/' } } }
  ]
} satisfies DatosInfusiones;
