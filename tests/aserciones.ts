import type { ResultadoArranque } from '../src/store.js';

/**
 * Aserciones que además estrechan el tipo.
 *
 * `arrancar()` devuelve una unión discriminada por `estado`, y cada caso trae
 * campos distintos. Un test que hace `expect(r.estado).toBe('listo')` y en la
 * línea siguiente lee `r.reconstruir` está leyendo un campo que sólo existe en
 * una de las ramas: TypeScript no puede saber que la aserción de arriba ya lo
 * garantizó.
 *
 * Pasar por acá resuelve las dos cosas a la vez: el tipo queda estrechado, y
 * cuando el estado no es el esperado el test falla diciendo cuál llegó, en vez
 * de reventar más abajo con un `undefined` que no explica nada.
 */
export function arranqueListo(r: ResultadoArranque): Extract<ResultadoArranque, { estado: 'listo' }> {
  if (r.estado !== 'listo') {
    throw new Error(`Se esperaba el arranque en 'listo' y llegó en '${r.estado}'`);
  }
  return r;
}

export function arranqueEligiendo(r: ResultadoArranque): Extract<ResultadoArranque, { estado: 'elegir-carpeta' }> {
  if (r.estado !== 'elegir-carpeta') {
    throw new Error(`Se esperaba el arranque en 'elegir-carpeta' y llegó en '${r.estado}'`);
  }
  return r;
}

export function arranqueSoloLectura(r: ResultadoArranque): Extract<ResultadoArranque, { estado: 'solo-lectura' }> {
  if (r.estado !== 'solo-lectura') {
    throw new Error(`Se esperaba el arranque en 'solo-lectura' y llegó en '${r.estado}'`);
  }
  return r;
}

/**
 * Marca un valor deliberadamente inválido para el parámetro que lo recibe.
 *
 * Varias funciones de la app prometen no romperse con entrada mala —un `.md`
 * malformado, una fila corta, un argumento nulo (§8)— y los tests que lo
 * comprueban tienen que pasarle justamente lo que el tipo prohíbe. El cast es
 * necesario; envolverlo acá deja claro que es la intención del test y no una
 * anotación que alguien no supo cómo escribir.
 */
export const invalido = <T>(valor: unknown): T => valor as T;
