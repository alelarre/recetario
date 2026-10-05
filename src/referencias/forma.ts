/**
 * La forma de los datos de referencia: no mira ningún valor, sólo que cada
 * tabla y cada constante diga de dónde sale y que cada fila tenga las
 * columnas de su tabla. Lo usa el test que custodia `datos/`.
 */
import type { Tabla, Fila, Fuente, Constante } from './tipos.js';

export const filasDe = (t: Tabla): readonly Fila[] => ('filas' in t ? t.filas : t.grupos.flatMap(g => g.filas));
export const fuentesDe = (t: Tabla): readonly Fuente[] => ('fuente' in t ? [t.fuente] : t.fuentes);

function problemasDeFuente(donde: string, f: Fuente): string[] {
  const problemas: string[] = [];
  if (!/^https?:\/\/\S+$/.test(f.url)) problemas.push(`${donde}: la fuente «${f.nombre}» no tiene una URL http o https`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.consultada)) problemas.push(`${donde}: la fuente «${f.nombre}» no tiene la fecha como AAAA-MM-DD`);
  return problemas;
}

export function problemasDeForma(t: Tabla): string[] {
  const problemas = fuentesDe(t).flatMap(f => problemasDeFuente(t.id, f));
  const columnas = new Set(t.columnas.map(c => c.id));
  const abreviaturas = 'fuentes' in t ? new Set(t.fuentes.map(f => f.abreviatura)) : null;
  filasDe(t).forEach((fila, i) => {
    const donde = `${t.id}, fila ${i + 1}`;
    for (const c of columnas) if (!(c in fila)) problemas.push(`${donde}: falta la columna «${c}»`);
    for (const c of Object.keys(fila)) if (!columnas.has(c)) problemas.push(`${donde}: la columna «${c}» no está en la tabla`);
    if (abreviaturas && 'columnaFuente' in t) {
      const abreviatura = (fila[t.columnaFuente] ?? '').split(/[ ,]/)[0] ?? '';
      if (!abreviaturas.has(abreviatura)) problemas.push(`${donde}: la fuente «${abreviatura}» no está en la lista de la tabla`);
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
