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

/** Las ocho claves del frontmatter (IA §1.5). El esquema es cerrado. */
export type ClaveFrontmatter =
  'titulo' | 'tags' | 'rinde' | 'tiempo' | 'dificultad' | 'fuente' | 'foto' | 'completa';

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
  foto: string | null;
  /** Solo se escribe para forzar `true`; la app nunca escribe `false` (C05.3.2). */
  completa: boolean;
  /** Claves del frontmatter que no son las ocho. Se preservan al guardar. */
  extras: Record<string, string>;
  descripcion: string;
  ingredientes: string;
  preparacion: string;
  variaciones: string;
  notas: string;
  otras: OtraSeccion[];
  avisos: Aviso[];
}

/**
 * Un ingrediente parseado: nombre primero, cantidad después del separador
 * (C05.1.3). La cantidad es texto libre y no se normaliza nunca.
 */
export interface Ingrediente {
  nombre: string;
  /** `null` cuando el ítem no traía separador: es un ingrediente sin cantidad. */
  cantidad: string | null;
  /** La línea tal como vino. */
  crudo: string;
}

/** Un `###` dentro de `## Ingredientes` (C05.1.2). Sin `###`, un grupo sin nombre. */
export interface GrupoIngredientes {
  nombre: string;
  items: Ingrediente[];
}

/** Un `###` dentro de `## Preparación`. La numeración vuelve a empezar en cada uno. */
export interface TramoPreparacion {
  nombre: string;
  pasos: string[];
}

/** Un `###` dentro de `## Variaciones`, con su fuente propia si la trae (IA §1.8). */
export interface Variacion {
  nombre: string;
  fuente: string | null;
  cuerpo: string;
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
  /** URL externa, o cadena vacía. Se dibuja donde esté (IA §1.7). */
  foto: string;
  /** Derivada al leer el `.md` (C05.3.1). Es cache: el archivo gana (R4). */
  completa: boolean;
}

/**
 * Una fila de la planilla de Borradores. No entra al índice: es una cola de
 * trabajo, no un archivo consolidado (IA §2.1).
 */
export interface Borrador {
  id: string;
  titulo: string;
  /** Texto libre: una URL o "libro de pescados, pág. 84". No se edita (C01.6.1). */
  fuente: string;
  /** ISO. El orden de la lista es por acá, lo más viejo primero. */
  capturado: string;
}

/** Los filtros de la vista de categoría. Todos opcionales y combinables. */
export interface Filtros {
  texto?: string | null;
  categoria?: string | null;
  dificultad?: string | null;
  tags?: string[] | null;
}

/** Una coincidencia que necesita decir por qué apareció (C02.3.4). */
export interface Coincidencia {
  entrada: Entrada;
  /** «tiene Merluza o pescadilla», «tiene tag horno». El valor, sin normalizar. */
  motivo: string;
}

/**
 * Resultados de búsqueda, separados por los tres criterios: el título, los
 * ingredientes y los tags (C02.3.1). Son coincidencias de peso distinto y la
 * vista las rotula aparte; una receta que coincide por dos entra en los dos
 * grupos (C02.3.2).
 */
export interface Coincidencias {
  porNombre: Entrada[];
  porIngrediente: Coincidencia[];
  porTag: Coincidencia[];
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

