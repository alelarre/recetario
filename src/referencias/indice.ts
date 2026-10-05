/**
 * Las cinco herramientas de referencia, en el orden de la lista de
 * Herramientas, y el orden de sus fichas. Los datos salen de `datos/`; las
 * cuentas, de `cuentas.ts`. Una ficha nueva se suma acá.
 */
import type { HerramientaDeReferencia, IdHerramienta } from './tipos.js';
import { TABLAS_RAPIDA } from './datos/rapida.js';
import { TABLAS_COCCION, ARROZ, AGUA_SAL_PASTA, ESPAGUETI, CALDO } from './datos/coccion.js';
import { TABLAS_CONSERVACION } from './datos/conservacion.js';
import { TABLAS_MASAS, MOLDE, PASTA_FRESCA, LASANA, PIZZA, AZUCAR, MERENGUE } from './datos/masas-y-dulces.js';
import { CONVERSOR } from './datos/conversor.js';
import { cuentaMolde, cuentaPastaFresca, cuentaLasana, cuentaBolloPizza, cuentaPuntoAzucar, cuentaMerengue, cuentaArroz, tablaDeArroz, cuentaAguaSalPasta, cuentaEspagueti, cuentaCaldo, cuentaConversion, tablaDePesos, tablaDeSistemas, tablaDeMedidasEeuu } from './cuentas.js';

export const HERRAMIENTAS_DE_REFERENCIA: readonly HerramientaDeReferencia[] = [
  { id: 'rapida', ruta: '#/herramientas/referencia', titulo: 'Referencia rápida', detalle: 'Huevos, carne, aceite, horno y bebidas', icono: 'libro', buscador: false,
    fichas: [
      TABLAS_RAPIDA.huevos, TABLAS_RAPIDA['carne-seguridad'], TABLAS_RAPIDA['carne-puntos'],
      TABLAS_RAPIDA.aceite, TABLAS_RAPIDA['punto-humo'], TABLAS_RAPIDA['horno-escala'],
      TABLAS_RAPIDA['horno-ventilador'], TABLAS_RAPIDA.mate, TABLAS_RAPIDA.te, TABLAS_RAPIDA.cafe,
      TABLAS_RAPIDA.vinos, TABLAS_RAPIDA.cervezas
    ].map(tabla => ({ tipo: 'tabla', tabla }) as const) },
  { id: 'masas', ruta: '#/herramientas/masas', titulo: 'Masas y dulces', detalle: 'Moldes, piezas, pasta, pizza, azúcar y merengue', icono: 'rodillo', buscador: false,
    fichas: [
      { tipo: 'cuenta', cuenta: cuentaMolde(MOLDE) },
      { tipo: 'tabla', tabla: TABLAS_MASAS.piezas },
      { tipo: 'cuenta', cuenta: cuentaPastaFresca(PASTA_FRESCA) },
      { tipo: 'tabla', tabla: TABLAS_MASAS['pasta-comprada'] },
      { tipo: 'cuenta', cuenta: cuentaLasana(LASANA) },
      { tipo: 'tabla', tabla: TABLAS_MASAS['masas-por-plato'] },
      { tipo: 'cuenta', cuenta: cuentaBolloPizza(PIZZA) },
      { tipo: 'cuenta', cuenta: cuentaPuntoAzucar(AZUCAR) },
      { tipo: 'cuenta', cuenta: cuentaMerengue(MERENGUE) }
    ] },
  { id: 'coccion', ruta: '#/herramientas/coccion', titulo: 'Básicos de cocción', detalle: 'Arroz, granos, legumbres, pasta, verduras y caldo', icono: 'olla', buscador: false,
    fichas: [
      { tipo: 'cuenta', cuenta: cuentaArroz(ARROZ) },
      { tipo: 'tabla', tabla: tablaDeArroz(ARROZ) },
      { tipo: 'tabla', tabla: TABLAS_COCCION['arroz-presion'] },
      { tipo: 'tabla', tabla: TABLAS_COCCION.granos },
      { tipo: 'tabla', tabla: TABLAS_COCCION.legumbres },
      { tipo: 'tabla', tabla: TABLAS_COCCION['legumbres-presion'] },
      { tipo: 'cuenta', cuenta: cuentaAguaSalPasta(AGUA_SAL_PASTA) },
      { tipo: 'tabla', tabla: TABLAS_COCCION['pasta-tiempos'] },
      { tipo: 'cuenta', cuenta: cuentaEspagueti(ESPAGUETI) },
      { tipo: 'tabla', tabla: TABLAS_COCCION.verduras },
      { tipo: 'tabla', tabla: TABLAS_COCCION.blanqueado },
      { tipo: 'cuenta', cuenta: cuentaCaldo(CALDO) }
    ] },
  { id: 'conservacion', ruta: '#/herramientas/conservacion', titulo: 'Conservación', detalle: 'Cuánto dura cada alimento', icono: 'heladera', buscador: true,
    fichas: [TABLAS_CONSERVACION['nota-general'], TABLAS_CONSERVACION.conservacion].map(tabla => ({ tipo: 'tabla', tabla }) as const) },
  { id: 'conversor', ruta: '#/herramientas/conversor', titulo: 'Conversor', detalle: 'Tazas, cucharas y gramos por ingrediente', icono: 'medidor', buscador: true,
    fichas: [
      { tipo: 'cuenta', cuenta: cuentaConversion(CONVERSOR) },
      { tipo: 'tabla', tabla: tablaDePesos(CONVERSOR) },
      { tipo: 'tabla', tabla: tablaDeSistemas(CONVERSOR) },
      { tipo: 'tabla', tabla: tablaDeMedidasEeuu(CONVERSOR) }
    ] }
];

export function herramientaDeReferencia(id: IdHerramienta): HerramientaDeReferencia {
  const h = HERRAMIENTAS_DE_REFERENCIA.find(x => x.id === id);
  if (!h) throw new Error(`No hay herramienta de referencia «${id}»`);
  return h;
}
