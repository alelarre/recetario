/**
 * Las marcas de temporizador del cuerpo de una receta (`E05-Cimientos.md`):
 * `[texto](cuenta:50:00 "etiqueta")` crea una cuenta regresiva y
 * `[texto](cronometro: "etiqueta")` un cronómetro con nombre. Tienen forma de
 * link para que fuera de la app la frase se siga leyendo. Puro: lo usan el
 * dibujo, `validar`, el índice, el invitado y el editor.
 */
import { formatear, nombreDeDuracion } from './temporizadores.js';
import type { Receta } from './tipos.js';

export type TipoMarca = 'cuenta' | 'cronometro';

export interface Marca {
  tipo: TipoMarca;
  /** Lo que se lee en la frase; puede estar vacío. */
  texto: string;
  /** El nombre que se le dio; vacío si no tiene. */
  etiqueta: string;
  /** En ms, en una cuenta; un cronómetro no tiene. */
  duracion: number | null;
}

/** 23:59:59, el tope de las ruedas de Temporizadores. */
export const DURACION_MAXIMA = ((23 * 60 + 59) * 60 + 59) * 1000;

/**
 * Una marca, válida o no: el texto, el esquema, lo que sigue a los dos puntos
 * y el resto hasta el paréntesis, donde va la etiqueta. Lo que no calza con la
 * forma de la etiqueta lo decide `leerMarca`, así una mal escrita se reconoce
 * igual y se lee como texto común en vez de quedar a la vista.
 */
export const PATRON_MARCA = /\[([^\]]*)\]\((cuenta|cronometro):([^)\s]*)((?:\s+\"[^\"]*\")?[^)]*)\)/g;

const DURACION = /^(?:(\d+):([0-5]\d):([0-5]\d)|(\d+):([0-5]\d))$/;

/** `m:ss` o `h:mm:ss` en ms; `null` si no se lee, si es cero o si pasa de 23:59:59. */
export function leerDuracion(s: string): number | null {
  const m = DURACION.exec(s);
  if (!m) return null;
  const [, h, mh, sh, mm, sm] = m;
  const segundos = h !== undefined
    ? (Number(h) * 60 + Number(mh)) * 60 + Number(sh)
    : Number(mm) * 60 + Number(sm);
  const ms = segundos * 1000;
  return ms > 0 && ms <= DURACION_MAXIMA ? ms : null;
}

/** Las partes que encontró `PATRON_MARCA`, como marca; `null` si está mal formada. */
export function leerMarca(texto: string, esquema: string, valor: string, resto: string): Marca | null {
  const r = resto.trim();
  const conEtiqueta = /^"([^"]*)"$/.exec(r);
  if (r && !(conEtiqueta && /^\s/.test(resto))) return null;
  const etiqueta = conEtiqueta?.[1]?.trim() ?? '';
  if (esquema === 'cuenta') {
    const duracion = leerDuracion(valor);
    return duracion === null ? null : { tipo: 'cuenta', texto, etiqueta, duracion };
  }
  if (esquema === 'cronometro' && valor === '') return { tipo: 'cronometro', texto, etiqueta, duracion: null };
  return null;
}

/** El nombre del temporizador que crea: la etiqueta, el texto, o el de uno creado sin nombre. */
export function nombreDeMarca(m: Marca): string {
  return m.etiqueta.trim() || m.texto.trim() ||
    (m.tipo === 'cuenta' && m.duracion !== null ? nombreDeDuracion(m.duracion) : 'Cronómetro');
}

/** Sin comillas, corchetes ni paréntesis, en un renglón: lo que no rompe la marca. */
const etiquetaLimpia = (s: string): string => s.replace(/["()[\]]/g, '').replace(/\s+/g, ' ').trim();

/** La marca escrita, con `texto` entre los corchetes; vacío por defecto, como la escribe el editor. */
export function escribirMarca(m: { tipo: TipoMarca; duracion: number | null; etiqueta: string }, texto = ''): string {
  const etiqueta = etiquetaLimpia(m.etiqueta);
  const valor = m.tipo === 'cuenta' ? formatear(m.duracion ?? 0) : '';
  return `[${texto}](${m.tipo}:${valor}${etiqueta ? ` "${etiqueta}"` : ''})`;
}

/** El texto con cada marca cambiada por lo que se lee de ella. */
export const quitarMarcas = (texto: string): string => texto.replace(PATRON_MARCA, (_, t: string) => t);

/** Las marcas del texto que no se pueden leer, tal como están escritas. */
export function marcasMalFormadas(texto: string): string[] {
  return [...texto.matchAll(PATRON_MARCA)]
    .filter(m => leerMarca(m[1] ?? '', m[2] ?? '', m[3] ?? '', m[4] ?? '') === null)
    .map(m => m[0]);
}

/**
 * Agrega algo al final de una línea —la del cursor—, con un espacio antes; en
 * una línea vacía queda solo. Si la línea no existe, el texto no cambia.
 */
export function agregarAlFinal(texto: string, linea: number, pedazo: string): string {
  const lineas = texto.split('\n');
  const actual = lineas[linea];
  if (actual === undefined) return texto;
  lineas[linea] = actual ? `${actual} ${pedazo}` : pedazo;
  return lineas.join('\n');
}

/** La receta con el cuerpo sin marcas: la del invitado, que no tiene temporizadores. */
export function sinMarcas(receta: Receta): Receta {
  return {
    ...receta,
    descripcion: quitarMarcas(receta.descripcion),
    ingredientes: quitarMarcas(receta.ingredientes),
    preparacion: quitarMarcas(receta.preparacion),
    variaciones: quitarMarcas(receta.variaciones),
    notas: quitarMarcas(receta.notas),
    otras: receta.otras.map(o => ({ ...o, cuerpo: quitarMarcas(o.cuerpo) }))
  };
}

/**
 * Envuelve en una marca lo que está seleccionado en el editor: la selección
 * pasa a ser el `texto` de la marca, en su lugar. Sólo lo que cae en la
 * primera línea, sin los espacios de las puntas y sin corchetes ni paréntesis,
 * que romperían la marca. Devuelve el texto nuevo y el cursor justo después de
 * la marca, o `null` si no queda nada que envolver o si la selección toca un
 * link, una foto u otra marca: ahí la marca va al final de la línea.
 */
export function envolver(
  texto: string, desde: number, hasta: number, m: { tipo: TipoMarca; duracion: number | null; etiqueta: string }
): { texto: string; cursor: number } | null {
  if (!(desde >= 0 && desde < hasta && hasta <= texto.length)) return null;
  const finDeLinea = texto.indexOf('\n', desde);
  let a = desde;
  let b = finDeLinea === -1 ? hasta : Math.min(hasta, finDeLinea);
  while (a < b && /\s/.test(texto[a] ?? '')) a++;
  while (b > a && /\s/.test(texto[b - 1] ?? '')) b--;
  const limpio = texto.slice(a, b).replace(/[()[\]]/g, '').replace(/\s+/g, ' ').trim();
  if (!limpio) return null;
  const inicioDeLinea = texto.lastIndexOf('\n', a - 1) + 1;
  const linea = texto.slice(inicioDeLinea, finDeLinea === -1 ? texto.length : finDeLinea);
  for (const x of linea.matchAll(/!?\[[^\]]*\]\([^)]*\)/g)) {
    const inicio = inicioDeLinea + (x.index ?? 0);
    if (a < inicio + x[0].length && b > inicio) return null;
  }
  const marca = escribirMarca(m, limpio);
  return { texto: texto.slice(0, a) + marca + texto.slice(b), cursor: a + marca.length };
}

const NUMERO = String.raw`\d+(?:[.,]\d+)?`;
// Las más largas primero: `min` no puede quedarse con el principio de `minutos`.
const UNIDAD = String.raw`(''|horas?|hours?|hrs?|hs\.?|h|minutos?|minutes?|mins?\.?|'|segundos?|seconds?|segs?\.?|secs?|s)(?![a-z])`;
const PAR = new RegExp(String.raw`(${NUMERO})(?:\s*(?:a|-|–|—)\s*(${NUMERO}))?\s*${UNIDAD}`, 'g');
const SEGUNDOS_POR_UNIDAD = (u: string): number =>
  u.startsWith('h') ? 3600 : u === "'" || u.startsWith('min') ? 60 : 1;
const FRACCION: Readonly<Record<string, string>> = { '½': '.5', '¼': '.25', '¾': '.75' };

/**
 * La duración que dice un texto —«50 minutos», «1,5 horas», «1 h 30 min»,
 * «20 a 25 min», «media hora»—, para proponerla en las ruedas al envolver una
 * selección. Es sólo una sugerencia: ante cualquier duda —un número sin
 * unidad, algo que no se entiende entre dos tiempos, cero o más de
 * 23:59:59— devuelve `null` y las ruedas quedan como siempre.
 */
export function duracionDeTexto(texto: string): number | null {
  try {
    const t = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d)\s*([½¼¾])/g, (_, d: string, f: string) => d + (FRACCION[f] ?? ''))
      .replace(/[½¼¾]/g, f => `0${FRACCION[f] ?? ''}`)
      .replace(new RegExp(String.raw`(${NUMERO})\s*(?:horas?|hs?)\s+y\s+media\b`, 'g'),
        (_, n: string) => `${Number(n.replace(',', '.')) + 0.5} h`)
      .replace(/\b(?:una\s+)?hora\s+y\s+media\b/g, '1.5 h')
      .replace(/\b(?:un\s+)?cuarto\s+de\s+hora\b/g, '0.25 h')
      .replace(/\bmedia\s+hora\b/g, '0.5 h');
    const pares = [...t.matchAll(PAR)];
    if (!pares.length) return null;
    let segundos = 0;
    let fin = -1;
    for (const p of pares) {
      const inicio = p.index ?? 0;
      // Entre dos tiempos sólo puede haber espacios, comas, «y» o «+».
      if (fin >= 0 && t.slice(fin, inicio).replace(/\by\b/g, '').replace(/[\s,+]/g, '') !== '') return null;
      const a = Number((p[1] ?? '').replace(',', '.'));
      const b = p[2] === undefined ? a : Number(p[2].replace(',', '.'));
      segundos += Math.max(a, b) * SEGUNDOS_POR_UNIDAD(p[3] ?? '');
      fin = inicio + p[0].length;
    }
    // Un número que no forma parte de ningún tiempo: no se sabe qué es.
    if (/\d/.test(t.replace(PAR, ''))) return null;
    const ms = Math.round(segundos) * 1000;
    return Number.isFinite(ms) && ms > 0 && ms <= DURACION_MAXIMA ? ms : null;
  } catch {
    return null;
  }
}
