/**
 * Qué muestra Referencias: la lista de fichas, filtrada por un tag, o lo que
 * encuentra el buscador. No dibuja: decide.
 */
import { normalizar } from '../normalizar.js';
import { tituloDeFicha } from './forma.js';
import type { FichaDeReferencia, Tabla, Fila } from './tipos.js';

/** Una tabla con filas que coinciden: su ficha y la tabla recortada a esas filas. */
export interface TablaEncontrada { ficha: FichaDeReferencia; tabla: Tabla }

/** Los tags de las fichas, sin repetir, en orden alfabético. */
export const tagsDe = (fichas: readonly FichaDeReferencia[]): string[] =>
  [...new Set(fichas.flatMap(f => f.tags))].sort((a, b) => a.localeCompare(b, 'es'));

/** Las fichas que llevan el tag; sin tag, todas. */
export const conTag = (fichas: readonly FichaDeReferencia[], tag: string): FichaDeReferencia[] =>
  fichas.filter(f => !tag || f.tags.includes(tag));

/** La tabla con sólo las filas que coinciden, y los grupos que conservan alguna; sin ninguna, nada. */
export function recortar(t: Tabla, coincide: (f: Fila) => boolean): Tabla | null {
  if ('grupos' in t) {
    const grupos = t.grupos.map(g => ({ ...g, filas: g.filas.filter(coincide) })).filter(g => g.filas.length > 0);
    return grupos.length ? { ...t, grupos } : null;
  }
  const filas = t.filas.filter(coincide);
  return filas.length ? { ...t, filas } : null;
}

/**
 * Lo que encuentra el texto, sin distinguir mayúsculas ni acentos, entre las
 * fichas del tag: las tablas con filas que coinciden, recortadas; y las
 * fichas que coinciden sólo por su título o un tag. Una cuenta se encuentra
 * por su título y sus tags, no por lo que calcula.
 */
export function buscarEnReferencias(fichas: readonly FichaDeReferencia[], tag: string, texto: string):
  { fichas: FichaDeReferencia[]; tablas: TablaEncontrada[] } {
  const q = normalizar(texto);
  const porNombre: FichaDeReferencia[] = [];
  const tablas: TablaEncontrada[] = [];
  if (!q) return { fichas: porNombre, tablas };
  const contiene = (x: unknown): boolean => normalizar(x).includes(q);
  for (const ficha of conTag(fichas, tag)) {
    const recortada = ficha.tipo === 'tabla' ? recortar(ficha.tabla, f => Object.values(f).some(contiene)) : null;
    if (recortada) tablas.push({ ficha, tabla: recortada });
    else if ([tituloDeFicha(ficha), ...ficha.tags].some(contiene)) porNombre.push(ficha);
  }
  return { fichas: porNombre, tablas };
}
