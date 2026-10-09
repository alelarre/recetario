/**
 * La forma de las herramientas de referencia, en un solo lugar: una tabla de
 * consulta, su fuente, una constante de una cuenta y una cuenta. Los datos
 * viven en `datos/`, sin funciones; las cuentas, en `cuentas.ts`.
 */

export interface Fuente { nombre: string; url: string }
export interface FuenteAbreviada extends Fuente { abreviatura: string }
/** `variante`: la columna se ve sólo con esa variante de la tabla elegida. */
export interface Columna { id: string; nombre: string; unidad?: string; minutos?: true; variante?: string }
export type Fila = Readonly<Record<string, string>>;
export interface Grupo { titulo: string; filas: readonly Fila[] }
export type Contenido = { filas: readonly Fila[] } | { grupos: readonly Grupo[] };
/**
 * De dónde sale una tabla: una fuente; varias, todas al pie —ninguna, si la
 * tabla va sin fuente—; o varias con una columna que dice, fila por fila, de
 * cuál sale cada una por su abreviatura.
 */
export type Procedencia =
  | { fuente: Fuente }
  | { fuentes: readonly Fuente[] }
  | { fuentes: readonly FuenteAbreviada[]; columnaFuente: string };
/**
 * Las variantes de una tabla: un conmutador arriba que elige qué columnas se
 * ven —«Al agua» o «Al vapor»—. Abre en la primera.
 */
export interface Variantes { nombre: string; opciones: readonly { valor: string; texto: string }[] }
export type Tabla = {
  id: string; titulo: string; columnas: readonly Columna[]; notas?: readonly string[]; variantes?: Variantes
} & Contenido & Procedencia;
export interface Constante { valor: number; unidad: string; fuente: Fuente }
export type Entrada =
  | { id: string; nombre: string; tipo: 'numero'; unidad?: string; porDefecto: number | null; visibleSi?: (v: Valores) => boolean }
  | { id: string; nombre: string; tipo: 'opcion'; opciones: readonly { valor: string; texto: string }[]; porDefecto: string; visibleSi?: (v: Valores) => boolean };
export type Valores = Readonly<Record<string, number | string | null>>;
export interface Linea { nombre: string; valor: string }
export interface TablaDeResultado { columnas: readonly string[]; filas: readonly (readonly string[])[] }
export interface Resultado { lineas: readonly Linea[]; tabla?: TablaDeResultado; advertencias: readonly string[]; fuentes: readonly Fuente[] }
/** `descripcion` es una frase con la pregunta que la cuenta responde: la ve el agente en el MCP. */
export interface Cuenta { id: string; titulo: string; descripcion?: string; entradas: readonly Entrada[]; notas?: readonly string[]; calcular(v: Valores): Resultado | null }
export type Ficha = { tipo: 'tabla'; tabla: Tabla } | { tipo: 'cuenta'; cuenta: Cuenta };
/** Una ficha de Referencias, con sus tags. */
export type FichaDeReferencia = Ficha & { tags: readonly string[] };
/** Las dos herramientas hechas de fichas, cada una con lo escrito en sus cuentas guardado aparte. */
export type IdHerramienta = 'referencias' | 'conversor';

/** Los sistemas de medida del conversor: cuánto miden la taza y las cucharas. */
export type IdSistema = 'metrica' | 'australia' | 'eeuu' | 'japon';
export type MedidaCasera = 'taza' | 'cucharada' | 'cucharadita';
export interface Sistema {
  id: IdSistema; nombre: string; taza: number; cucharada: number; cucharadita: number;
  notas?: readonly string[]; fuentes: readonly FuenteAbreviada[];
}
export interface IngredienteConvertible {
  id: string; nombre: string; grupo: string;
  /** La medida tal como la da la fuente: «½ taza de EE. UU. = 113 g». Los gramos por ml salen de acá. */
  medida: { cantidad: number; unidad: MedidaCasera; sistema: IdSistema; gramos: number };
  fuente: FuenteAbreviada;
}
