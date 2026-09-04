/**
 * Los tipos del dominio, en un solo lugar.
 *
 * Dos fronteras distintas viven acá y conviene no confundirlas:
 *
 * - La del `.md`, que es la fuente de verdad (§3.2). Una receta parseada tiene
 *   todas sus claves siempre presentes; lo que falta en el archivo llega como
 *   `null`, nunca ausente. Por eso el parser no devuelve campos opcionales:
 *   quien la consume no tiene que preguntarse si la clave existe, solo si
 *   tiene valor.
 *
 * - La de Google, que es texto ajeno. Todo lo que llega de Drive o de Sheets se
 *   declara opcional aunque la documentación prometa que viene: la app ya se
 *   rompió una vez con una planilla a medio crear cuya hoja `meta` no existía.
 *   Un campo que el servidor puede omitir se escribe `?`, y el código lo
 *   resuelve en el borde.
 */

/** Las seis claves del frontmatter (§3.2). El esquema es cerrado. */
export type ClaveFrontmatter = 'titulo' | 'tags' | 'rinde' | 'tiempo' | 'dificultad' | 'fuente';

/** Las cuatro secciones que la app entiende; el resto cae en `otras`. */
export type ClaveSeccion = 'ingredientes' | 'preparacion' | 'variaciones' | 'notas';

/** Lo que el parser puede tener para decir. Se muestran traducidos (§8). */
export type Aviso = 'frontmatter-ilegible' | 'sin-frontmatter' | 'sin-titulo' | 'seccion-duplicada';

/** Un encabezado `##` que no es ninguna de las cuatro secciones conocidas. */
export interface OtraSeccion {
  encabezado: string;
  cuerpo: string;
}

/**
 * Una receta parseada desde un `.md`.
 *
 * Los campos de texto del cuerpo son `string` y no `string | null`: una sección
 * ausente es la cadena vacía, que es lo que el serializador espera de vuelta.
 * Los del frontmatter sí son nulables, porque ahí la diferencia entre "no está"
 * y "está vacío" la decide el archivo.
 */
export interface Receta {
  titulo: string | null;
  tags: string[];
  rinde: string | null;
  tiempo: string | null;
  dificultad: string | null;
  fuente: string | null;
  /** Claves del frontmatter que no son las seis. Se preservan al guardar. */
  extras: Record<string, string>;
  descripcion: string;
  ingredientes: string;
  preparacion: string;
  variaciones: string;
  notas: string;
  otras: OtraSeccion[];
  avisos: Aviso[];
}

/** Un ingrediente parseado. Best-effort a propósito (§3.2). */
export interface Ingrediente {
  cantidad: string | null;
  unidad: string | null;
  item: string;
  /** La línea tal como vino. Es lo que se dibuja: el parseo es para indexar. */
  crudo: string;
}

/** Dónde vive un `.md` en Drive. La carpeta es la categoría (§3.1). */
export interface Ubicacion {
  id: string;
  nombre_archivo: string;
  categoria: string;
  carpeta_id: string;
  /** `modifiedTime` de Drive en milisegundos. 0 si no se pudo leer. */
  mtime: number;
}

/**
 * Una fila del índice, ya deserializada.
 *
 * Es un cache derivado de los `.md` (§4.3): si dice algo distinto del archivo,
 * el archivo gana. `tags` e `ingredientes` viajan en la planilla como una celda
 * con `|` entre valores y vuelven acá como arreglos.
 */
export interface Entrada {
  id_archivo: string;
  nombre_archivo: string;
  titulo: string;
  categoria: string;
  carpeta_id: string;
  rinde: string;
  tiempo: string;
  /** Vacío cuando el valor del archivo no es una de las tres dificultades. */
  dificultad: string;
  fuente: string;
  tags: string[];
  ingredientes: string[];
  mtime: number;
}

/** Los filtros de la vista de categoría. Todos opcionales y combinables. */
export interface Filtros {
  texto?: string | null;
  categoria?: string | null;
  dificultad?: string | null;
  tags?: string[] | null;
}

/**
 * Resultados de búsqueda, separados por dónde coincidió el texto.
 * Son dos coincidencias de peso muy distinto y la vista las rotula aparte (§7.2).
 */
export interface Coincidencias {
  porNombre: Entrada[];
  porIngrediente: Entrada[];
}

/* ------------------------------------------------------------------ */
/* La frontera con Google. Nada de acá se asume presente.              */
/* ------------------------------------------------------------------ */

/** Un archivo tal como lo devuelve Drive. Todo campo puede faltar. */
export interface ArchivoDrive {
  id: string;
  name?: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
  trashed?: boolean;
}

/** Una entrada de la Changes API (§4.2). */
export interface CambioDrive {
  fileId?: string;
  removed?: boolean;
  file?: ArchivoDrive;
}

/** Lo que `diffCambios` decide hacer con un lote de cambios. */
export interface Diff {
  /** Cambió el contenido: hay que releer el `.md`. */
  releer: Ubicacion[];
  /** Solo se movió o se renombró: alcanza con corregir la fila. */
  parchear: Ubicacion[];
  /** Borrado, tirado a la papelera, o sacado del recetario. */
  borrar: string[];
  /** No es un `.md`, o no cambió nada real. */
  ignorados: string[];
}
