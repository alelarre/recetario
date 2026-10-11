/**
 * Los números de las bebidas, el hielo y las infusiones: cuánto toma cada uno
 * por hora, los envases de acá, el hielo por persona y por litro, y las tazas.
 * Salen de `product-design/research/herramientas/verificacion-eventos.md`,
 * sección Decisiones; corregir uno es editar su línea, y ningún test fija un
 * valor. Sólo datos.
 */
import type { DatosBebidas, DatosHielo, DatosInfusiones } from '../ademas.js';
import { BORDERIO, HACECUENTAS, LA_NACION } from './fuentes.js';

const PENAFLOR = { nombre: 'Peñaflor (Vinos y Spirits)', url: 'https://www.vinosyspirits.com/vino-y-espumante-cantidades' };
const botella750 = { ml: { valor: 750, fuente: PENAFLOR }, nombre: { uno: 'botella de 750 ml', varios: 'botellas de 750 ml' } };
const botella2250 = { ml: { valor: 2250, fuente: HACECUENTAS }, nombre: { uno: 'botella de 2,25 l', varios: 'botellas de 2,25 l' } };

export const BEBIDAS = {
  bebidas: [
    { id: 'cerveza', nombre: 'Cerveza', alcohol: true, mlPorHora: { valor: 350, fuente: HACECUENTAS },
      envase: { ml: { valor: 473, fuente: HACECUENTAS }, nombre: { uno: 'lata de 473 ml', varios: 'latas de 473 ml' } } },
    { id: 'vino', nombre: 'Vino', alcohol: true, mlPorHora: { valor: 103.5, fuente: HACECUENTAS }, envase: botella750 },
    { id: 'fernet', nombre: 'Fernet', alcohol: true, mlPorHora: { valor: 25, fuente: HACECUENTAS },
      envase: { ml: { valor: 750, fuente: BORDERIO }, nombre: { uno: 'botella de 750 ml', varios: 'botellas de 750 ml' } },
      con: { id: 'cola', nombre: 'Cola para el fernet', mlPorMl: { valor: 3, fuente: HACECUENTAS }, envase: botella2250 } },
    { id: 'gaseosa', nombre: 'Gaseosa', alcohol: false, mlPorHora: { valor: 286, fuente: BORDERIO }, envase: botella2250 },
    { id: 'agua', nombre: 'Agua', alcohol: false, mlPorHora: { valor: 357, fuente: BORDERIO },
      envase: { ml: { valor: 5000, fuente: BORDERIO }, nombre: { uno: 'bidón de 5 l', varios: 'bidones de 5 l' } } },
    { id: 'jugo', nombre: 'Jugo', alcohol: false,
      mlPorHora: { valor: 286, fuente: null, nota: 'El jugo por persona es un supuesto, sin fuente: se calcula como la gaseosa.' },
      envase: { ml: { valor: 1000, fuente: { nombre: 'Super Mamí', url: 'https://www.supermami.com.ar/super/producto/jugo-cepita-naranja-tetra-brik-x-1000-cc/_/A-30518' } },
        nombre: { uno: 'tetra de 1 l', varios: 'tetras de 1 l' } } }
  ],
  horasPlenas: { valor: 4, fuente: HACECUENTAS },
  despues: { valor: 0.5, fuente: BORDERIO },
  calor: { valor: 1.25, fuente: HACECUENTAS },
  chico: { valor: 1.75, fuente: HACECUENTAS },
  brindis: { mlPorAdulto: { valor: 150, fuente: LA_NACION }, envase: botella750 }
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
