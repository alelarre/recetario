import { normalizar, ingredientesIndexables } from './recipe.js';
import type {
  Receta, Ubicacion, Entrada
} from './tipos.js';

/**
 * El orden de las columnas de la planilla. Es el esquema del índice (§4.3):
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

/** Si el tag es uno de los reservados, sin importar mayúsculas ni acentos. */
export function tagReservado(valor: unknown): boolean {
  const n = normalizar(String(valor ?? ''));
  return TAGS_RESERVADOS.some(t => normalizar(t) === n);
}

/** Un valor que no matchea cae en "sin definir" en vez de romper el filtro (§3.2). */
export function dificultadValida(valor: unknown): string {
  // Defender contra cualquier tipo
  const s = String(valor ?? '').trim();
  if (!s) return '';
  const n = normalizar(s);
  const encontrada = DIFICULTADES.find(d => normalizar(d) === n);
  return encontrada ?? '';
}

/**
 * Arma la fila de la planilla para una receta. Acepta cualquier cosa a
 * propósito: la receta puede venir de un `.md` malformado y la ubicación de una
 * respuesta de Drive incompleta, y ninguna de las dos puede tumbar el índice.
 */
export function filaDesde(receta?: Partial<Receta> | null, ubicacion?: Partial<Ubicacion> | null): string[] {
  // Defender receta
  const r: Partial<Receta> = typeof receta === 'object' && receta !== null ? receta : {};

  // Defender ubicacion
  const u: Partial<Ubicacion> = typeof ubicacion === 'object' && ubicacion !== null ? ubicacion : {};

  // Defender tags: debe ser array
  const tagsArray: unknown[] = Array.isArray(r.tags) ? r.tags : [];
  const tagsStr = tagsArray
    .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
    // Sacar el | de cada valor: es el separador de la celda (§4.3), y un tag
    // que lo trajera partiría mal al releer. Son valores curados, no texto
    // libre del .md, así que sacarlo no pierde nada real.
    .map(t => t.trim().replace(/\|/g, ''))
    .filter(Boolean)
    .join('|');

  // Defender ingredientes: debe ser array de strings
  const ingredientesArray: unknown[] = ingredientesIndexables(r);
  const ingredientesStr = Array.isArray(ingredientesArray)
    ? ingredientesArray
      .filter((i): i is string => typeof i === 'string' && Boolean(i.trim()))
      // Mismo motivo que con tags: el | es el separador de la celda, no un
      // carácter válido dentro de un valor.
      .map(i => i.trim().replace(/\|/g, ''))
      .filter(Boolean)
      .join('|')
    : '';

  // Construir celdas
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
    tags: tagsStr,
    ingredientes: ingredientesStr,
    mtime: String(typeof u.mtime === 'number' ? u.mtime : 0),
    foto: typeof r.foto === 'string' ? r.foto : ''
  };

  return COLUMNAS.map(c => String(celdas[c] ?? ''));
}

/** El inverso de `filaDesde`. Una fila corta o con huecos da campos vacíos. */
export function entradaDesdeFila(fila?: unknown): Entrada {
  // Defender fila: debe ser array
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
    tiempo: texto.tiempo,
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
 * de cualquier fila de tags (P27). No son estados: son tags, y viven en la
 * lista `tags` del `.md` como cualquier otro. El orden es el mismo en todos
 * lados: primero lo que se busca para cocinar, al final lo que falta terminar.
 */
export const TAGS_ESPECIALES = ['favorito', 'menú diario', 'probar', 'incompleta'] as const;
export type TagEspecial = (typeof TAGS_ESPECIALES)[number];

/**
 * Formas que se leen como cada especial, además de lo que ya cubre
 * `normalizar` (mayúsculas y tildes). Sólo `favorito` e `incompleta` tienen
 * género y número.
 */
const FORMAS_ALTERNATIVAS: Record<TagEspecial, readonly string[]> = {
  favorito: ['favorita', 'favoritos', 'favoritas'],
  'menú diario': [],
  probar: [],
  incompleta: ['incompleto', 'incompletos', 'incompletas']
};

/** Contradicen a `incompleta`: un tag así diría lo contrario que el especial. */
const FORMAS_TERMINADO = ['terminado', 'terminada', 'terminados', 'terminadas'] as const;

/**
 * Tags que no se escriben a mano. Los cuatro especiales tienen su botón en el
 * editor, y escribirlos crearía una segunda forma de poner lo mismo;
 * `terminado` contradice a `incompleta`. Derivada, para que no diverja de la
 * lista de especiales.
 */
export const TAGS_RESERVADOS: readonly string[] = [
  ...TAGS_ESPECIALES,
  ...TAGS_ESPECIALES.flatMap(t => FORMAS_ALTERNATIVAS[t]),
  ...FORMAS_TERMINADO
];

/** El especial que le corresponde a un tag escrito de cualquier forma, o `null`. */
export function tagEspecial(valor: unknown): TagEspecial | null {
  const n = normalizar(String(valor ?? ''));
  if (!n) return null;
  return TAGS_ESPECIALES.find(t =>
    normalizar(t) === n || FORMAS_ALTERNATIVAS[t].some(f => normalizar(f) === n)) ?? null;
}

/** Lleva ese especial, escrito como sea. */
export function tieneEspecial(x: { tags: string[] }, especial: TagEspecial): boolean {
  const tags = Array.isArray(x?.tags) ? x.tags : [];
  return tags.some(t => tagEspecial(t) === especial);
}

export const esFavorita = (x: { tags: string[] }): boolean => tieneEspecial(x, 'favorito');

/** Incompleta es un tag, no una clave del frontmatter: sin el tag, la receta está terminada. */
export const esIncompleta = (x: { tags: string[] }): boolean => tieneEspecial(x, 'incompleta');

/** Los especiales primero, en el orden de `TAGS_ESPECIALES`; el resto como venía. */
export function ordenarTags(tags: string[]): string[] {
  const lista = Array.isArray(tags) ? tags : [];
  const peso = (t: string): number => {
    const esp = tagEspecial(t);
    return esp ? TAGS_ESPECIALES.indexOf(esp) : TAGS_ESPECIALES.length;
  };
  return [...lista].sort((a, b) => peso(a) - peso(b));
}

/**
 * Las favoritas primero y, dentro de cada bloque, alfabético (P27). Es una
 * excepción al alfabético, no su reemplazo: sin favoritas, el orden es el de
 * siempre.
 */
export function ordenarRecetas(entradas: Entrada[]): Entrada[] {
  const lista = Array.isArray(entradas) ? entradas : [];
  return [...lista].sort((a, b) =>
    Number(esFavorita(b)) - Number(esFavorita(a)) || a.titulo.localeCompare(b.titulo, 'es'));
}

/** La lista de tags con ese especial puesto o sacado, en su forma canónica y sin tocar los demás. */
export function conEspecial(tags: string[], especial: TagEspecial, puesto: boolean): string[] {
  const sin = (Array.isArray(tags) ? tags : []).filter(t => tagEspecial(t) !== especial);
  return puesto ? [especial, ...sin] : sin;
}

