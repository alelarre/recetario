/**
 * La forma de las herramientas de referencia, en un solo lugar: una tabla de
 * consulta, su fuente, una constante de una cuenta y una cuenta. Los datos
 * viven en `datos/`, sin funciones; las cuentas, en `cuentas.ts`.
 */

export interface Fuente { nombre: string; url: string; consultada: string }
export interface FuenteAbreviada extends Fuente { abreviatura: string }
export interface Columna { id: string; nombre: string; unidad?: string; minutos?: true }
export type Fila = Readonly<Record<string, string>>;
export interface Grupo { titulo: string; filas: readonly Fila[] }
export type Contenido = { filas: readonly Fila[] } | { grupos: readonly Grupo[] };
export type Procedencia = { fuente: Fuente } | { fuentes: readonly FuenteAbreviada[]; columnaFuente: string };
export type Tabla = { id: string; titulo: string; columnas: readonly Columna[]; notas?: readonly string[] } & Contenido & Procedencia;
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
export type IdHerramienta = 'rapida' | 'masas' | 'coccion' | 'conservacion' | 'conversor';
export interface HerramientaDeReferencia {
  id: IdHerramienta; ruta: string; titulo: string; detalle: string;
  icono: 'libro' | 'rodillo' | 'olla' | 'heladera' | 'medidor'; buscador: boolean; fichas: readonly Ficha[];
}

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
