/**
 * Cómo se muestra lo que se compra: lo que va por unidad, entero y para
 * arriba —por docena, a la media docena—; el peso en gramos o en kilos; el
 * volumen en mililitros o en litros; y los envases.
 */
import type { NombreDeEnvase } from './tipos.js';

/** Para arriba, sin que el error de la coma flotante sume uno: 2,0000001 es 2. */
export const arriba = (n: number): number => Math.ceil(n - 1e-9);

const conComa = (n: number): string => String(n).replace('.', ',');

/** «½ docena», «1 docena», «2 ½ docenas»: `n` es múltiplo de seis. */
function docenas(n: number): string {
  const enteras = Math.floor(n / 12);
  const media = n % 12 !== 0;
  const texto = enteras === 0 ? '½' : media ? `${enteras} ½` : String(enteras);
  return `${texto} ${n > 12 ? 'docenas' : 'docena'}`;
}

/** Unidades enteras para arriba; las que se compran por docena, a la media docena. */
export function unidades(n: number, { nombre, porDocena = false }: { nombre?: string | undefined; porDocena?: boolean | undefined } = {}): string {
  const u = porDocena ? arriba(n / 6) * 6 : arriba(n);
  const base = nombre ? `${u} ${nombre}` : String(u);
  return porDocena && u > 0 ? `${base} (${docenas(u)})` : base;
}

/** En gramos enteros debajo de 1 kg; desde 1 kg, en kg con un decimal. Siempre para arriba. */
export function peso(g: number): string {
  const enteros = arriba(g);
  return enteros < 1000 ? `${enteros} g` : `${conComa(arriba(g / 100) / 10)} kg`;
}

/** En mililitros enteros debajo de 1 l; desde 1 l, en litros con un decimal. Siempre para arriba. */
export function volumen(ml: number): string {
  const enteros = arriba(ml);
  return enteros < 1000 ? `${enteros} ml` : `${conComa(arriba(ml / 100) / 10)} l`;
}

/** Cuántas personas: con un decimal y coma, sin el error de la coma flotante: 0,1 + 0,2 es «0,3». */
export const personas = (n: number): string => conComa(Math.round(n * 10) / 10);

/** Cuántos envases hacen falta, para arriba: «30 latas». */
export function envases(total: number, porEnvase: number, nombre: NombreDeEnvase): string {
  const n = arriba(total / porEnvase);
  return `${n} ${n === 1 ? nombre.uno : nombre.varios}`;
}
