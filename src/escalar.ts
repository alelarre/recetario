/**
 * Escalar una receta para cocinarla esa vez: leer el número del principio de
 * una cantidad, multiplicarlo y volver a escribirlo. Lo escalado se muestra y
 * nunca vuelve al `.md`. El resto de la cantidad —la unidad, la nota, lo que
 * no es número— queda como está escrito.
 */

/** Los multiplicadores que se eligen con un toque. */
export const MULTIPLICADORES = [0.5, 1, 2, 3] as const;

const FRACCIONES: Readonly<Record<string, number>> = { '½': 1 / 2, '¼': 1 / 4, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8 };

/**
 * El número del principio de un texto y cuántos caracteres ocupa: un entero o
 * un decimal con coma o punto, una fracción —`½` o `1/2`—, un entero y una
 * fracción —`1½`, `1 ½`, `1 1/2`, `2 y 1/2`—, o un entero con punto de miles
 * —`1.500`, como se escribe acá—. Sin número al principio, nada.
 */
function leerNumero(texto: string): { valor: number; largo: number } | null {
  const formas: [RegExp, (m: RegExpMatchArray) => number | null][] = [
    [/^(\d+)\s+(?:y\s+)?(\d+)\/(\d+)/, m => (Number(m[3]) ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null)],
    [/^(\d+)\s+y\s+([½¼¾⅓⅔⅛])/, m => Number(m[1]) + (FRACCIONES[m[2] ?? ''] ?? 0)],
    // Un punto seguido de tres cifras, después de un entero que no es cero, separa miles.
    [/^([1-9]\d{0,2}(?:\.\d{3})+)(?![\d.,])/, m => Number((m[1] ?? '').replaceAll('.', ''))],
    [/^(\d+)\/(\d+)/, m => (Number(m[2]) ? Number(m[1]) / Number(m[2]) : null)],
    [/^(\d+)\s*([½¼¾⅓⅔⅛])/, m => Number(m[1]) + (FRACCIONES[m[2] ?? ''] ?? 0)],
    [/^([½¼¾⅓⅔⅛])/, m => FRACCIONES[m[1] ?? ''] ?? null],
    [/^(\d+(?:[.,]\d+)?)/, m => Number((m[1] ?? '').replace(',', '.'))]
  ];
  for (const [forma, valorDe] of formas) {
    const m = texto.match(forma);
    const valor = m ? valorDe(m) : null;
    if (m && valor !== null && Number.isFinite(valor)) return { valor, largo: m[0].length };
  }
  return null;
}

/**
 * Un número para mostrar en una receta: de 10 para arriba, entero; debajo de
 * 10, entero o con una fracción común si está a menos de 0,05 de ella; si no,
 * con un decimal y coma.
 */
export function escribirNumero(n: number): string {
  if (n >= 10) return String(Math.round(n));
  // Una cantidad chica que no es cero no se muestra «0»: con dos decimales.
  if (n > 0 && n < 0.05) return String(Math.round(n * 100) / 100).replace('.', ',');
  const entero = Math.floor(n);
  const distancia = (v: number): number => Math.abs(n - entero - v);
  const cercana = ([[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']] as const)
    .filter(([v]) => distancia(v) < 0.05)
    .sort(([a], [b]) => distancia(a) - distancia(b))[0];
  if (!cercana) return String(Math.round(n * 10) / 10).replace('.', ',');
  const base = entero + (cercana[0] === 1 ? 1 : 0);
  if (!cercana[1]) return String(base);
  return base ? `${base}${cercana[1]}` : cercana[1];
}

/** Lo que une los dos extremos de un rango: `2-3`, `2–3`, `2 a 3`, `2 o 3`. */
const SEPARADOR_DE_RANGO = /^\s*(?:-|–|a|o)\s*/;

/**
 * La cantidad con su número del principio —o los dos extremos de un rango:
 * `2-3`, `2–3`, `2 a 3`, `2 o 3`— multiplicado. Lo que no empieza con un número queda
 * igual, y por 1 no se toca nada.
 */
export function escalarCantidad(cantidad: string, factor: number): string {
  if (factor === 1) return cantidad;
  const primero = leerNumero(cantidad);
  if (!primero) return cantidad;
  const despues = cantidad.slice(primero.largo);
  const separador = despues.match(SEPARADOR_DE_RANGO)?.[0];
  const segundo = separador ? leerNumero(despues.slice(separador.length)) : null;
  if (separador && segundo) {
    return escribirNumero(primero.valor * factor) + separador + escribirNumero(segundo.valor * factor) +
      despues.slice(separador.length + segundo.largo);
  }
  return escribirNumero(primero.valor * factor) + despues;
}

/**
 * El número con que empieza el rinde —«4 porciones», «1 molde de 24 cm»—, o
 * nada. Un rango —«4 a 6 porciones»— no tiene un solo número para elegir.
 */
export function porcionesDe(rinde: string | null): number | null {
  const limpio = (rinde ?? '').trim();
  const numero = leerNumero(limpio);
  if (!numero || !(numero.valor > 0)) return null;
  const despues = limpio.slice(numero.largo);
  const separador = despues.match(SEPARADOR_DE_RANGO)?.[0];
  return separador && leerNumero(despues.slice(separador.length)) ? null : numero.valor;
}

/** Lo que sigue al número del rinde: «porciones», «molde de 24 cm». */
export function restoDelRinde(rinde: string): string {
  const limpio = rinde.trim();
  return limpio.slice(leerNumero(limpio)?.largo ?? 0).trim();
}
