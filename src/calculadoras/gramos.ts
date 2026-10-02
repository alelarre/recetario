/**
 * Gramos para mostrar: enteros desde 10 g, con un decimal hasta 10 g (5,4 g de
 * levadura) y con dos por debajo de 1 g, sin bajar nunca de 0,01: una
 * cantidad que se calculó no se muestra como cero.
 */
export function gramos(valor: number): string {
  // Se redondea antes de elegir el formato: 9,96 se muestra «10», no «10,0».
  const conDos = Math.max(Math.round(valor * 100) / 100, 0.01);
  if (conDos < 1) return conDos.toFixed(2).replace('.', ',');
  const conUno = Math.round(valor * 10) / 10;
  return conUno < 10 ? conUno.toFixed(1).replace('.', ',') : String(Math.round(valor));
}

/** Un porcentaje con coma y, si no es entero, un decimal: «72 %», «2,5 %». */
export const porciento = (n: number): string =>
  `${(Number.isInteger(n) ? String(n) : n.toFixed(1)).replace('.', ',')} %`;
