/**
 * Los tipos del dominio, en un solo lugar.
 *
 * Dos fronteras distintas viven acá y conviene no confundirlas:
 *
 * - La del `.md`, que es la fuente de verdad. Una receta parseada tiene
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

/** Las cuatro secciones que la app entiende; el resto cae en `otras`. */
export type ClaveSeccion = 'ingredientes' | 'preparacion' | 'variaciones' | 'notas';

/** Lo que el parser puede tener para decir. Se muestran traducidos. */
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
  /** Claves del frontmatter que no son las siete. Se preservan al guardar. */
  extras: Record<string, string>;
  descripcion: string;
  ingredientes: string;
  preparacion: string;
  variaciones: string;
  notas: string;
  otras: OtraSeccion[];
  /** El depósito de fotos: la sección `## Fotos`, ya parseada. Vacío si no hay. */
  fotos: FotoDeReceta[];
  avisos: Aviso[];
}

/** Una foto del depósito: la línea `- N: URL` de `## Fotos` (`src/fotos-receta.ts`). */
export interface FotoDeReceta {
  n: number;
  url: string;
}

/**
 * Los cambios de fotos que hizo el editor, para que el store los aplique al
 * guardar (C04.1.1): subir las nuevas, mover las que vienen de un borrador y
 * mandar a la papelera las que se sacaron.
 */
export interface CambiosDeFotos {
  /** Se suben a `_fotos/`; su URL de Drive va en la línea `n` del depósito. */
  nuevas: Map<number, Blob>;
  /** Ids en `_borradores/` que se mueven a `_fotos/`. */
  deBorrador: string[];
  /** URLs que estaban en el `.md` y ya no. */
  sacadas: string[];
  /** Avisa cada foto que el store ya subió, para que un reintento no la resuba. */
  alSubir?: (n: number, id: string) => void;
}

/**
 * Un lugar de la receta donde *Poner en…* puede escribir una referencia a una
 * foto (`src/fotos-receta.ts`, `lineasDeLaReceta`). En ingredientes y pasos
 * `linea` ubica la línea exacta dentro del texto de la sección, la que recibe
 * `ponerEn`; en las demás la referencia va en un renglón nuevo al final, sin
 * línea que apuntar.
 */
export type Lugar =
  | { seccion: 'ingredientes' | 'preparacion'; linea: number; texto: string; grupo: string }
  | { seccion: 'descripcion' | 'variaciones' | 'notas'; linea: null; texto: string; grupo: string };

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

/** Dónde vive un `.md` en Drive. La carpeta es la categoría. */
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
 * Es un cache derivado de los `.md`: si dice algo distinto del archivo,
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
}

/**
 * Un borrador: un `.md` en `Recetario/_borradores/`. Es su propia entidad —título,
 * fuente, nota y fotos—, no una receta incompleta.
 */
export interface Borrador {
  /** El id del archivo en Drive. */
  id: string;
  titulo: string;
  /** Texto libre: una URL o "libro de pescados, pág. 84". */
  fuente: string;
  /** Lo que haya que recordar del borrador. Texto libre y opcional. */
  nota: string;
  /** ISO. El orden de la lista es por acá, lo más viejo primero. */
  capturado: string;
  /** Los ids de Drive de sus fotos, en orden. Van al lado del `.md`, en `_borradores/`. */
  fotos: string[];
}

/** Una fila de la hoja `borradores` del índice: lo que alcanza para la lista y el contador. */
export interface EntradaBorrador {
  id_archivo: string;
  nombre_archivo: string;
  titulo: string;
  capturado: string;
}

/** Las dos comidas de un día. */
export type Momento = 'mediodia' | 'noche';

/**
 * Una receta cargada en una comida del plan. `dia` va de 0 a 6 con lunes en 0:
 * el plan no tiene fechas, y el único lugar donde entra hoy es el orden en que
 * la pantalla dibuja los días.
 */
export interface Comida {
  dia: number;
  momento: Momento;
  /** El id del `.md` en Drive: es lo que usa la app. El título está para leerlo. */
  id: string;
  titulo: string;
}

/**
 * El plan de la semana: `Recetario/_plan.md`. Una comida puede tener varias
 * recetas, y el orden dentro de cada una es el del archivo.
 */
export interface Plan {
  comidas: Comida[];
}

/** Los filtros de la vista de categoría. Todos opcionales y combinables. */
export interface Filtros {
  texto?: string | null;
  categoria?: string | null;
  dificultad?: string | null;
  tags?: string[] | null;
}

/** Una coincidencia que necesita decir por qué apareció (C02.3.2). */
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

/**
 * Una subcarpeta de `Recetario/`: la carpeta es la categoría. El color y
 * la foto son las propiedades de la carpeta en Drive; vacíos, se dibuja con el
 * neutro y la trama.
 */
export interface Categoria {
  id: string;
  nombre: string;
  /** Clave de la paleta (`src/categorias.ts`), o vacío. */
  color: string;
  /** `catalogo:<clave>`, `drive:<id>` o vacío. */
  foto: string;
}

/** Un archivo tal como lo devuelve Drive. Todo campo puede faltar. */
export interface ArchivoDrive {
  id: string;
  /** Las propiedades privadas de la app sobre el archivo. */
  appProperties?: Record<string, string>;
  name?: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
  trashed?: boolean;
}

