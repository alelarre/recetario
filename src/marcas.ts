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
