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
  'foto',
  'completa'
] as const satisfies ReadonlyArray<keyof Entrada>;

export const DIFICULTADES = ['fácil', 'media', 'difícil'] as const;

/**
 * Tags que la app se reserva: nombran estados que calcula o va a calcular ella,
 * no cosas de la receta. Escribirlos a mano crearía un dato paralelo que miente
 * en cuanto alguien edita el `.md` por afuera, que es justo lo que la
 * completitud derivada vino a evitar (F05.3).
 *
 * `incompleto` y `terminado` nombran la completitud, que es la clave `completa`
 * del frontmatter; `favorito` y `probar` todavía no se usan y quedan tomados
 * desde ahora. De cada uno se reservan las cuatro formas —masculino, femenino
 * y sus plurales—, porque un tag escrito a mano no tiene por qué coincidir con
 * la que el código eligió.
 */
export const TAGS_RESERVADOS = [
  'incompleto', 'incompleta', 'incompletos', 'incompletas',
  'terminado', 'terminada', 'terminados', 'terminadas',
  'favorito', 'favorita', 'favoritos', 'favoritas',
  'probar'
] as const;

/** Si el tag es uno de los reservados, sin importar mayúsculas ni acentos. */
export function tagReservado(valor: unknown): boolean {
  const n = normalizar(String(valor ?? ''));
  return (TAGS_RESERVADOS as readonly string[]).some(t => normalizar(t) === n);
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
    foto: typeof r.foto === 'string' ? r.foto : '',
    // 'si' y no 'true': la celda la puede leer una persona en la planilla.
    // Lo que dice el archivo, sin recalcular: la completitud es un dato.
    completa: r.completa === true ? 'si' : ''
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
    foto: texto.foto,
    completa: texto.completa === 'si'
  };
}

