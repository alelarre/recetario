/**
 * La forma de los datos de referencia: no mira ningún valor, sólo que cada
 * tabla y cada constante diga de dónde sale y que cada fila tenga las
 * columnas de su tabla. Lo usa el test que custodia `datos/`.
 */
import type { Tabla, Fila, Fuente, Constante, Ficha } from './tipos.js';

export const filasDe = (t: Tabla): readonly Fila[] => ('filas' in t ? t.filas : t.grupos.flatMap(g => g.filas));
export const fuentesDe = (t: Tabla): readonly Fuente[] => ('fuente' in t ? [t.fuente] : t.fuentes);
export const idDeFicha = (f: Ficha): string => (f.tipo === 'tabla' ? f.tabla.id : f.cuenta.id);
export const tituloDeFicha = (f: Ficha): string => (f.tipo === 'tabla' ? f.tabla.titulo : f.cuenta.titulo);

const problemasDeFuente = (donde: string, f: Fuente): string[] =>
  /^https?:\/\/\S+$/.test(f.url) ? [] : [`${donde}: la fuente «${f.nombre}» no tiene una URL http o https`];

/**
 * Las abreviaturas que nombra una celda de fuente, como «ANMAT-F, FK 135, 141»,
 * «SENASA y FSIS» o «FK 157 (descartada FK 160)»: toda palabra que no sea un
 * número de página o un rango, salvo las que unen.
 */
const PALABRAS_QUE_UNEN = new Set(['y', 'descartada']);
const fuentesDeCelda = (celda: string): string[] =>
  celda.split(/[\s,()]+/).filter(p => p !== '' && !/^\d/.test(p) && !PALABRAS_QUE_UNEN.has(p));

export function problemasDeForma(t: Tabla): string[] {
  const problemas = fuentesDe(t).flatMap(f => problemasDeFuente(t.id, f));
  const columnas = new Set(t.columnas.map(c => c.id));
  const abreviaturas = 'fuentes' in t ? new Set(t.fuentes.map(f => f.abreviatura)) : null;
  filasDe(t).forEach((fila, i) => {
    const donde = `${t.id}, fila ${i + 1}`;
    for (const c of columnas) if (!(c in fila)) problemas.push(`${donde}: falta la columna «${c}»`);
    for (const c of Object.keys(fila)) if (!columnas.has(c)) problemas.push(`${donde}: la columna «${c}» no está en la tabla`);
    if (abreviaturas && 'columnaFuente' in t) {
      const nombradas = fuentesDeCelda(fila[t.columnaFuente] ?? '');
      if (nombradas.length === 0) problemas.push(`${donde}: no nombra ninguna fuente`);
      for (const a of nombradas) if (!abreviaturas.has(a)) problemas.push(`${donde}: la fuente «${a}» no está en la lista de la tabla`);
    }
  });
  return problemas;
}

export function problemasDeConstante(nombre: string, c: Constante): string[] {
  return [
    ...(Number.isFinite(c.valor) ? [] : [`${nombre}: el valor no es un número`]),
    ...problemasDeFuente(nombre, c.fuente)
  ];
}
