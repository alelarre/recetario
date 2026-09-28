import { normalizar, ingredientesIndexables, duracionValida, DURACIONES, type Duracion } from './recipe.js';
import { resolver } from './fotos-receta.js';
import { TAGS_ESPECIALES, especialesValidos, type TagEspecial } from './especiales.js';
import type {
  Receta, Ubicacion, Entrada
} from './tipos.js';

/**
 * El orden de las columnas de la planilla. Es el esquema del índice:
 * cambiarlo invalida las filas ya escritas, así que se agrega al final o se
 * sube SCHEMA_VERSION para forzar una reconstrucción.
 */
export const COLUMNAS = [
  'id_archivo',
  'nombre_archivo',
  'titulo',
  'categoria',
  'carpeta_id',
  'rinde',
  'tiempo',
  'dificultad',
  'fuente',
  'tags',
  'ingredientes',
  'mtime',
  'foto',
  'tags_especiales'
] as const satisfies ReadonlyArray<keyof Entrada>;

export const DIFICULTADES = ['fácil', 'media', 'difícil'] as const;

export { DURACIONES, duracionValida } from './recipe.js';
export {
  ESPECIALES, TAGS_ESPECIALES, TAGS_RESERVADOS, definicion, tagEspecial, tagReservado
} from './especiales.js';
export type { TagEspecial, DefinicionEspecial } from './especiales.js';
export type { Duracion } from './recipe.js';

/** Un valor que no matchea cae en "sin definir" en vez de romper el filtro. */
export function dificultadValida(valor: unknown): string {
  const s = String(valor ?? '').trim();
  if (!s) return '';
  const n = normalizar(s);
  const encontrada = DIFICULTADES.find(d => normalizar(d) === n);
  return encontrada ?? '';
}

/**
 * Una celda con varios valores. El `|` se saca de cada uno: es el separador de
 * la celda, y un valor que lo trajera partiría mal al releer. Son valores
 * curados, no texto libre del `.md`, así que sacarlo no pierde nada real.
 */
function unirConBarra(valores: unknown[]): string {
  return valores
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim().replace(/\|/g, ''))
    .filter(Boolean)
    .join('|');
}

/**
 * Arma la fila de la planilla para una receta. Acepta cualquier cosa a
 * propósito: la receta puede venir de un `.md` malformado y la ubicación de una
 * respuesta de Drive incompleta, y ninguna de las dos puede tumbar el índice.
 */
export function filaDesde(receta?: Partial<Receta> | null, ubicacion?: Partial<Ubicacion> | null): string[] {
  const r: Partial<Receta> = typeof receta === 'object' && receta !== null ? receta : {};
  const u: Partial<Ubicacion> = typeof ubicacion === 'object' && ubicacion !== null ? ubicacion : {};

  const celdas: Record<(typeof COLUMNAS)[number], string> = {
    id_archivo: typeof u.id === 'string' ? u.id : '',
    nombre_archivo: typeof u.nombre_archivo === 'string' ? u.nombre_archivo : '',
    titulo: typeof r.titulo === 'string' ? r.titulo : '',
    categoria: typeof u.categoria === 'string' ? u.categoria : '',
    carpeta_id: typeof u.carpeta_id === 'string' ? u.carpeta_id : '',
    rinde: typeof r.rinde === 'string' ? r.rinde : '',
    tiempo: typeof r.tiempo === 'string' ? r.tiempo : '',
    dificultad: dificultadValida(r.dificultad),
    fuente: typeof r.fuente === 'string' ? r.fuente : '',
    tags: unirConBarra(Array.isArray(r.tags) ? r.tags : []),
    ingredientes: unirConBarra(ingredientesIndexables(r)),
    mtime: String(typeof u.mtime === 'number' ? u.mtime : 0),
    // La cabecera ya resuelta a su URL: las listas la dibujan sin leer el `.md`.
    foto: resolver(typeof r.foto === 'string' ? r.foto : null, Array.isArray(r.fotos) ? r.fotos : []) ?? '',
    tags_especiales: unirConBarra(Array.isArray(r.tags_especiales) ? r.tags_especiales : [])
  };

  return COLUMNAS.map(c => String(celdas[c] ?? ''));
}

/** El inverso de `filaDesde`. Una fila corta o con huecos da campos vacíos. */
export function entradaDesdeFila(fila?: unknown): Entrada {
  const f: unknown[] = Array.isArray(fila) ? fila : [];

  // Cada columna a texto; lo que no sea string cuenta como ausente.
  const texto = {} as Record<(typeof COLUMNAS)[number], string>;
  COLUMNAS.forEach((col, i) => {
    const valor = f[i];
    texto[col] = typeof valor === 'string' ? valor : '';
  });

  const partir = (celda: string): string[] =>
    celda.trim() ? celda.split('|').filter(v => v.trim()) : [];

  const mtimeNum = Number(texto.mtime);

  return {
    id_archivo: texto.id_archivo,
    nombre_archivo: texto.nombre_archivo,
    titulo: texto.titulo,
    categoria: texto.categoria,
    carpeta_id: texto.carpeta_id,
    rinde: texto.rinde,
    tiempo: duracionValida(texto.tiempo),
    dificultad: texto.dificultad,
    fuente: texto.fuente,
    tags: partir(texto.tags),
    ingredientes: partir(texto.ingredientes),
    mtime: isNaN(mtimeNum) || mtimeNum < 0 ? 0 : mtimeNum,
    foto: texto.foto,
    tags_especiales: especialesValidos(partir(texto.tags_especiales)).validos
  };
}

/** Lleva ese especial. */
export function tieneEspecial(x: { tags_especiales: readonly TagEspecial[] }, especial: TagEspecial): boolean {
  return (Array.isArray(x?.tags_especiales) ? x.tags_especiales : []).includes(especial);
}

export const esFavorita = (x: { tags_especiales: readonly TagEspecial[] }): boolean => tieneEspecial(x, 'favorito');

/** Si dos tags escritos son el mismo, sin mirar mayúsculas ni tildes. */
export function coincideTag(escrito: string, buscado: string): boolean {
  return normalizar(escrito) === normalizar(buscado);
}

/**
 * Si una receta nueva tiene algo que guardar (C04.3b.1): algún campo escrito
 * —por el usuario o precargado por Compartir—, una foto en el depósito, un
 * tag, o un especial que no sea `borrador`, que se pone solo. Sin esto, el título por defecto
 * de un borrador dejaría guardar un formulario vacío.
 */
export function tieneAlgoCargado(receta: Receta): boolean {
  const campos = [
    receta.titulo, receta.fuente, receta.rinde, receta.tiempo, receta.dificultad, receta.foto,
    receta.descripcion, receta.ingredientes, receta.preparacion, receta.variaciones, receta.notas
  ];
  return campos.some(c => (c ?? '').trim() !== '') ||
    receta.fotos.length > 0 ||
    receta.tags.length > 0 ||
    receta.tags_especiales.some(t => t !== 'borrador');
}

/** A–Z es el orden de siempre; `duracion` es el del conmutador de las listas. */
export type Orden = 'alfa' | 'duracion';

/**
 * A–Z: las favoritas primero y, dentro de cada bloque, alfabético.
 * Por duración: de la más corta a la más larga, con las favoritas mezcladas
 * —la estrella de la tarjeta ya las marca—, alfabético dentro de cada valor y
 * las que no tienen duración al final.
 */
export function ordenarRecetas(entradas: Entrada[], orden: Orden = 'alfa'): Entrada[] {
  const lista = Array.isArray(entradas) ? entradas : [];
  const alfa = (a: Entrada, b: Entrada): number => a.titulo.localeCompare(b.titulo, 'es');
  if (orden === 'duracion') {
    const pos = (e: Entrada): number => {
      const d = duracionValida(e.tiempo);
      return d ? DURACIONES.indexOf(d) : DURACIONES.length;
    };
    return [...lista].sort((a, b) => pos(a) - pos(b) || alfa(a, b));
  }
  return [...lista].sort((a, b) => Number(esFavorita(b)) - Number(esFavorita(a)) || alfa(a, b));
}

/** Cuántas recetas hay con cada duración, en el orden de `DURACIONES`, sin los valores vacíos. */
export function contarDuraciones(entradas: Entrada[]): { valor: Duracion; cantidad: number }[] {
  const lista = Array.isArray(entradas) ? entradas : [];
  return DURACIONES
    .map(valor => ({ valor, cantidad: lista.filter(e => duracionValida(e.tiempo) === valor).length }))
    .filter(x => x.cantidad > 0);
}

/** Las recetas con alguna de las duraciones encendidas; sin ninguna encendida, todas. */
export function filtrarPorDuracion(entradas: Entrada[], activas: string[]): Entrada[] {
  const lista = Array.isArray(entradas) ? entradas : [];
  if (!activas.length) return lista;
  return lista.filter(e => activas.includes(duracionValida(e.tiempo)));
}

/** Los especiales con ese puesto o sacado, en el orden de la tabla. */
export function conEspecial(especiales: readonly TagEspecial[], especial: TagEspecial, puesto: boolean): TagEspecial[] {
  const puestos = new Set((Array.isArray(especiales) ? especiales : []).filter(t => t !== especial));
  if (puesto) puestos.add(especial);
  return TAGS_ESPECIALES.filter(t => puestos.has(t));
}
