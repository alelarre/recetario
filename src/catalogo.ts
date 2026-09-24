import { normalizar, ingredientesIndexables, duracionValida, DURACIONES, type Duracion } from './recipe.js';
import { resolver } from './fotos-receta.js';
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
  'foto'
] as const satisfies ReadonlyArray<keyof Entrada>;

export const DIFICULTADES = ['fácil', 'media', 'difícil'] as const;

export { DURACIONES, duracionValida } from './recipe.js';
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
    foto: resolver(typeof r.foto === 'string' ? r.foto : null, Array.isArray(r.fotos) ? r.fotos : []) ?? ''
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
    foto: texto.foto
  };
}

/**
 * Los tags que la app dibuja distinto: ícono propio y lugar fijo al principio
 * de cualquier fila de tags. No son estados: son tags, y viven en la
 * lista `tags` del `.md` como cualquier otro. El orden es el mismo en todos
 * lados: primero lo que se busca para cocinar, al final lo que falta terminar.
 */
export const TAGS_ESPECIALES = ['favorito', 'menú diario', 'probar', 'borrador'] as const;
export type TagEspecial = (typeof TAGS_ESPECIALES)[number];

/**
 * Formas que se leen como cada especial, además de lo que ya cubre
 * `normalizar` (mayúsculas y tildes). `favorito` tiene género y número;
 * `borrador` además acepta `incompleta` y sus formas, para que los `.md`
 * escritos afuera con esa palabra se lean como borrador.
 */
const FORMAS_ALTERNATIVAS: Record<TagEspecial, readonly string[]> = {
  favorito: ['favorita', 'favoritos', 'favoritas'],
  'menú diario': [],
  probar: [],
  borrador: ['borradores', 'incompleta', 'incompleto', 'incompletos', 'incompletas']
};

/** Contradicen a `borrador`: un tag así diría lo contrario que el especial. */
const FORMAS_TERMINADO = ['terminado', 'terminada', 'terminados', 'terminadas'] as const;

/**
 * Tags que no se escriben a mano. Los cuatro especiales tienen su botón en el
 * editor, y escribirlos crearía una segunda forma de poner lo mismo;
 * `terminado` contradice a `borrador`. Derivada, para que no diverja de la
 * lista de especiales.
 */
export const TAGS_RESERVADOS: readonly string[] = [
  ...TAGS_ESPECIALES,
  ...TAGS_ESPECIALES.flatMap(t => FORMAS_ALTERNATIVAS[t]),
  ...FORMAS_TERMINADO
];

/** Si el tag es uno de los reservados, sin importar mayúsculas ni acentos. */
export function tagReservado(valor: unknown): boolean {
  const n = normalizar(String(valor ?? ''));
  return TAGS_RESERVADOS.some(t => normalizar(t) === n);
}

/** El especial que le corresponde a un tag escrito de cualquier forma, o `null`. */
export function tagEspecial(valor: unknown): TagEspecial | null {
  const n = normalizar(String(valor ?? ''));
  if (!n) return null;
  return TAGS_ESPECIALES.find(t =>
    normalizar(t) === n || FORMAS_ALTERNATIVAS[t].some(f => normalizar(f) === n)) ?? null;
}

/**
 * Si dos tags escritos son el mismo. Uno igual siempre coincide; si el
 * buscado es un especial, también coincide cualquier forma —vieja o
 * nueva— de ese mismo especial.
 */
export function coincideTag(escrito: string, buscado: string): boolean {
  if (normalizar(escrito) === normalizar(buscado)) return true;
  const esp = tagEspecial(buscado);
  return esp !== null && tagEspecial(escrito) === esp;
}

/** Lleva ese especial, escrito como sea. */
export function tieneEspecial(x: { tags: string[] }, especial: TagEspecial): boolean {
  const tags = Array.isArray(x?.tags) ? x.tags : [];
  return tags.some(t => tagEspecial(t) === especial);
}

export const esFavorita = (x: { tags: string[] }): boolean => tieneEspecial(x, 'favorito');

/** Los especiales primero, en el orden de `TAGS_ESPECIALES`; el resto como venía. */
export function ordenarTags(tags: string[]): string[] {
  const lista = Array.isArray(tags) ? tags : [];
  const peso = (t: string): number => {
    const esp = tagEspecial(t);
    return esp ? TAGS_ESPECIALES.indexOf(esp) : TAGS_ESPECIALES.length;
  };
  return [...lista].sort((a, b) => peso(a) - peso(b));
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

/** La lista de tags con ese especial puesto o sacado, en su forma canónica y sin tocar los demás. */
export function conEspecial(tags: string[], especial: TagEspecial, puesto: boolean): string[] {
  const sin = (Array.isArray(tags) ? tags : []).filter(t => tagEspecial(t) !== especial);
  return puesto ? [especial, ...sin] : sin;
}

