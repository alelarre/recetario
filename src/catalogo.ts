import { normalizar, ingredientesIndexables } from './recipe.js';
import type {
  Receta, Ubicacion, Entrada, ArchivoDrive, CambioDrive, Diff
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
  'mtime'
] as const satisfies ReadonlyArray<keyof Entrada>;

export const DIFICULTADES = ['fácil', 'media', 'difícil'] as const;

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
    mtime: String(typeof u.mtime === 'number' ? u.mtime : 0)
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
    mtime: isNaN(mtimeNum) || mtimeNum < 0 ? 0 : mtimeNum
  };
}

const esMarkdown = (file: unknown): file is ArchivoDrive => {
  // Defender file: debe ser un object con properties
  if (typeof file !== 'object' || file === null) return false;

  // Detectar por mimeType o extensión
  const f = file as ArchivoDrive;
  return f.mimeType === 'text/markdown' || /\.md$/i.test(f.name ?? '');
};

/** Las opciones de `diffCambios`: el índice actual y el mapa carpeta → categoría. */
export interface OpcionesDiff {
  indice?: Map<string, Entrada> | null;
  carpetas?: Map<string, string> | null;
}

/**
 * Clasifica un lote de la Changes API contra lo que el índice ya sabe (§4.2).
 * Nada de lo que llega se asume bien formado: un cambio sin `fileId`, un
 * archivo sin `parents` o un lote que no es arreglo salen por `ignorados`.
 */
export function diffCambios(cambios?: unknown, opciones?: OpcionesDiff | null): Diff {
  const salida: Diff = { releer: [], parchear: [], borrar: [], ignorados: [] };

  // Defender cambios: debe ser array
  const cambiosArray: unknown[] = Array.isArray(cambios) ? cambios : [];

  // Defender opciones: puede faltar, ser null o undefined
  // Si no hay opciones válidas, no procesamos nada
  if (typeof opciones !== 'object' || opciones === null) {
    return salida;
  }

  // Defender indice: debe tener .get si es Map, si no tratar como vacío
  const indice: Map<string, Entrada> =
    opciones.indice && typeof opciones.indice.get === 'function' ? opciones.indice : new Map();

  // Defender carpetas: debe tener .get si es Map, si no tratar como vacío
  const carpetas: Map<string, string> =
    opciones.carpetas && typeof opciones.carpetas.get === 'function' ? opciones.carpetas : new Map();

  for (const bruto of cambiosArray) {
    // Tolera elementos null
    if (bruto === null || typeof bruto !== 'object') continue;
    const cambio = bruto as CambioDrive;

    const id = cambio.fileId ?? cambio.file?.id;
    // Salta si no hay id
    if (!id) continue;

    const file = cambio.file;
    const estaba = indice.get(id);

    // Borrar: removed, sin file, o trashed
    if (cambio.removed || !file || file.trashed) {
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    // Validar que está en una carpeta conocida
    const carpetaId = (file.parents ?? [])[0] ?? '';
    const categoria = carpetas.get(carpetaId);

    if (categoria === undefined) {
      // Se movió fuera del recetario, o nunca estuvo adentro.
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    // Ignorar si no es markdown
    if (!esMarkdown(file)) { salida.ignorados.push(id); continue; }

    const ubicacion: Ubicacion = {
      id,
      nombre_archivo: file.name ?? '',
      categoria,
      carpeta_id: carpetaId,
      mtime: Date.parse(file.modifiedTime ?? '') || 0
    };

    // Comparar con lo que ya existe
    if (!estaba || estaba.mtime !== ubicacion.mtime) {
      // Cambió el contenido o es nuevo
      salida.releer.push(ubicacion);
      continue;
    }

    // Mismo mtime: solo cambió ubicación o nombre
    if (estaba.nombre_archivo !== ubicacion.nombre_archivo || estaba.carpeta_id !== ubicacion.carpeta_id) {
      salida.parchear.push(ubicacion);
      continue;
    }

    // Sin cambios reales
    salida.ignorados.push(id);
  }

  return salida;
}
