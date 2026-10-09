/**
 * Referencias, una sola lista de fichas en el orden de la pantalla, con los
 * tags de cada una; y las fichas del Conversor. Los datos salen de `datos/`;
 * las cuentas, de `cuentas.ts`. Una ficha nueva se suma acá; cambiar un tag
 * es editar su línea.
 */
import type { Ficha, FichaDeReferencia, IdHerramienta, Tabla, Cuenta } from './tipos.js';
import { idDeFicha } from './forma.js';
import { TABLAS_RAPIDA } from './datos/rapida.js';
import { TABLAS_COCCION, ARROZ, AGUA_SAL_PASTA, CALDO } from './datos/coccion.js';
import { TABLAS_CONSERVACION } from './datos/conservacion.js';
import { TABLAS_MASAS, MOLDE, PIZZA, AZUCAR, MERENGUE } from './datos/masas-y-dulces.js';
import { CONVERSOR } from './datos/conversor.js';
import { cuentaMolde, cuentaBolloPizza, cuentaPuntoAzucar, cuentaMerengue, cuentaArroz, cuentaAguaSalPasta, cuentaCaldo, cuentaConversion, tablaDePesos, tablaDeSistemas, tablaDeMedidasEeuu } from './cuentas.js';

const tabla = (t: Tabla, ...tags: string[]): FichaDeReferencia => ({ tipo: 'tabla', tabla: t, tags });
const cuenta = (c: Cuenta, ...tags: string[]): FichaDeReferencia => ({ tipo: 'cuenta', cuenta: c, tags });

export const REFERENCIAS: readonly FichaDeReferencia[] = [
  // Huevos, carne, aceite, horno y bebidas.
  tabla(TABLAS_RAPIDA.huevos, 'huevo'),
  tabla(TABLAS_RAPIDA['carne-seguridad'], 'carne', 'pollo'),
  tabla(TABLAS_RAPIDA['carne-puntos'], 'carne'),
  tabla(TABLAS_RAPIDA.aceite, 'fritura', 'pollo'),
  tabla(TABLAS_RAPIDA['punto-humo'], 'fritura'),
  tabla(TABLAS_RAPIDA['horno-escala'], 'horno'),
  tabla(TABLAS_RAPIDA.infusiones, 'bebidas'),
  tabla(TABLAS_RAPIDA.vinos, 'bebidas'),
  tabla(TABLAS_RAPIDA.cervezas, 'bebidas'),
  // Arroz, granos, legumbres, pasta, verduras y caldo.
  cuenta(cuentaArroz(ARROZ), 'arroz'),
  tabla(TABLAS_COCCION['arroz-presion'], 'arroz', 'olla a presión'),
  tabla(TABLAS_COCCION.granos, 'legumbres y granos'),
  tabla(TABLAS_COCCION.legumbres, 'legumbres y granos'),
  tabla(TABLAS_COCCION['legumbres-presion'], 'legumbres y granos', 'olla a presión'),
  cuenta(cuentaAguaSalPasta(AGUA_SAL_PASTA), 'pasta'),
  tabla(TABLAS_COCCION['pasta-tiempos'], 'pasta'),
  tabla(TABLAS_COCCION.verduras, 'verduras'),
  tabla(TABLAS_COCCION.blanqueado, 'verduras'),
  cuenta(cuentaCaldo(CALDO), 'carne'),
  // Masas y dulces.
  cuenta(cuentaMolde(MOLDE), 'dulces', 'horno'),
  tabla(TABLAS_MASAS.piezas, 'masas'),
  tabla(TABLAS_MASAS['pasta-porcion'], 'pasta'),
  cuenta(cuentaBolloPizza(PIZZA), 'masas', 'horno'),
  cuenta(cuentaPuntoAzucar(AZUCAR), 'dulces'),
  cuenta(cuentaMerengue(MERENGUE), 'dulces', 'huevo'),
  // Conservación.
  tabla(TABLAS_CONSERVACION.conservacion, 'conservación')
];

export const FICHAS_DEL_CONVERSOR: readonly Ficha[] = [
  { tipo: 'cuenta', cuenta: cuentaConversion(CONVERSOR) },
  { tipo: 'tabla', tabla: tablaDePesos(CONVERSOR) },
  { tipo: 'tabla', tabla: tablaDeSistemas(CONVERSOR) },
  { tipo: 'tabla', tabla: tablaDeMedidasEeuu(CONVERSOR) }
];

/** Las fichas de Referencias o del Conversor. */
export const fichasDe = (id: IdHerramienta): readonly Ficha[] => (id === 'conversor' ? FICHAS_DEL_CONVERSOR : REFERENCIAS);

/** La ficha de Referencias con ese id; una del Conversor no es de Referencias. */
export const fichaDeReferencia = (id: string): FichaDeReferencia | null => REFERENCIAS.find(f => idDeFicha(f) === id) ?? null;
