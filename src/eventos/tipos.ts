/**
 * La forma de un evento, en un solo lugar: el tipo con sus datos, sus grupos,
 * sus cosas y lo que se suma después; los números con su fuente; lo que se
 * guarda; y lo que se calcula. Los números viven en `datos/`; la cuenta, en
 * `evento.ts` y `ademas.ts`.
 */
import type { Fuente } from '../referencias/tipos.js';

/** Un número de los datos: con su fuente, o sin ninguna y con la nota que lo dice. */
export type Dato =
  | { valor: number; fuente: Fuente }
  | { valor: number; fuente: null; nota: string };

export type ValorDeDato = number | string | boolean | null;
export type Valores = Readonly<Record<string, ValorDeDato>>;

/** Un dato que se pide: un número, una opción o un sí o no. */
export type DatoPedido =
  | { id: string; nombre: string; tipo: 'numero'; unidad?: string; porDefecto: number | null }
  | { id: string; nombre: string; tipo: 'opcion'; opciones: readonly { valor: string; texto: string }[]; porDefecto: string }
  | { id: string; nombre: string; tipo: 'si-no'; porDefecto: boolean };

/** Lo que sabe el evento al calcular una porción o un factor. */
export interface Contexto {
  adultos: number;
  chicos: number;
  /** Los adultos más los chicos por su factor. */
  personas: number;
  horas: number;
  calor: boolean;
  /** Los datos del tipo, ya completos. */
  tipo: Valores;
}

/** Un tramo de horas: hasta cuántas —`null`, sin tope— y su factor; `null`, el tramo que no cambia nada. */
export interface Tramo { hastaHoras: number | null; factor: Dato | null }

export interface Grupo {
  id: string;
  titulo: string;
  /** Con n cosas prendidas, cada una lleva 1/n de su porción. */
  seReparte: boolean;
  /** Lo que multiplica al grupo: las horas, el cumpleaños infantil, con sobras. */
  factores?: (c: Contexto) => readonly Dato[];
}

export interface NombreDeEnvase { uno: string; varios: string }
/** Un envase de compra: cuántas unidades de la cosa trae —ocho porciones por pizza—. */
export interface Envase { cantidad: Dato; nombre: NombreDeEnvase }

export type Restriccion = 'vegetariano' | 'vegano' | 'celiaco' | 'sin-lactosa';

interface CosaBase {
  id: string;
  nombre: string;
  /** El `id` de su grupo. */
  grupo: string;
  prendida: boolean;
  /** El chico come como un adulto: la torta. */
  chicoEntero?: true;
  /** Carne cruda en gramos: cuenta para el carbón o la leña. */
  carne?: true;
  /** Para qué restricciones alimentarias es apta, como se hace en general; sin declarar, para ninguna. */
  aptaPara?: readonly Restriccion[];
}
export interface CosaSimple extends CosaBase {
  /** Cuánto come una persona si es lo único de su grupo, en `unidad`. */
  porcion: (c: Contexto) => Dato;
  unidad: 'unidad' | 'g' | 'ml';
  /** Cómo se llama la unidad, «porciones»; sin nombre, el número solo. */
  nombreUnidad?: string;
  /** Se compra por docena: se redondea a la media docena. */
  docenas?: true;
  envase?: Envase;
}
/** Una cosa hecha de partes en gramos: la picada que va antes, en fiambres, quesos y pan. */
export interface CosaConPartes extends CosaBase {
  partes: readonly { id: string; nombre: string; porcion: (c: Contexto) => Dato }[];
}
export type Cosa = CosaSimple | CosaConPartes;

/** Una línea del resultado. `cosa`: de qué cosa es —las partes de la picada son de la picada—. */
export interface Item { id: string; nombre: string; cantidad: string; cosa?: string }

export type IdAdemas = 'bebidas' | 'infusiones' | 'hielo' | 'combustible';
/** Lo ya calculado que leen las que se suman después. */
export interface Calculado {
  contexto: Contexto;
  /** 1, 1,1 o 1,2. */
  margen: number;
  /** Gramos de carne cruda de las cosas prendidas, con el margen. */
  carneG: number;
  /** Mililitros de bebida fría, con el margen: los enfría el hielo. */
  mlFrios: number;
}
/** Lo que devuelve lo que se suma: sus ítems, los números que usó y lo que tiene que avisar. */
export interface Parcial { items: readonly Item[]; usados: readonly Dato[]; mlFrios?: number; advertencias?: readonly string[] }
export interface Ademas {
  id: IdAdemas;
  nombre: string;
  /** Dónde va, en la pantalla y en el resultado: «Además», o «Para el fuego» lo de la cocción. */
  grupo: string;
  datos: readonly DatoPedido[];
  calcular(c: Calculado, v: Valores): Parcial;
}

export interface TipoDeEvento {
  id: string;
  nombre: string;
  datos: readonly DatoPedido[];
  grupos: readonly Grupo[];
  cosas: readonly Cosa[];
  ademas: readonly { ademas: Ademas; prendido: boolean }[];
  /** Un dato del tipo cuya opción prende sus cosas y apaga las demás que nombra: el tipo de asado. */
  atajo?: { dato: string; cosas: Readonly<Record<string, readonly string[]>> };
  /** El grupo cuyos gramos van en las cifras: la carne del asado. */
  cifra?: { grupo: string; nombre: string };
}

/** Lo que vale para todos los tipos. `horas` es el valor por defecto del campo. */
export interface Comunes { factorChico: Dato; horas: number }

export type Margen = 0 | 10 | 20;
export interface EstadoDeTipo {
  datos: Valores;
  cosas: Readonly<Record<string, boolean>>;
  /** La proporción de cada cosa en su grupo, que mueven los sliders; sin guardar, un reparto parejo. */
  reparto: Readonly<Record<string, number>>;
  ademas: Readonly<Record<string, { prendido: boolean; datos: Valores }>>;
}
/** Lo que se guarda: un evento a la vez, con lo de cada tipo por separado. */
export interface EstadoEvento {
  tipo: string;
  adultos: number | null;
  chicos: number | null;
  horas: number | null;
  calor: boolean;
  margen: Margen;
  /** Cuántos de los invitados tienen cada restricción; vacío, ninguno. */
  restricciones: Readonly<Record<Restriccion, number | null>>;
  porTipo: Readonly<Record<string, EstadoDeTipo>>;
}

export interface Linea { nombre: string; valor: string }
export interface GrupoDeResultado {
  id: string;
  titulo: string;
  items: readonly Item[];
  /** En un grupo de una sola unidad que se reparte: el total, que el reparto divide sin cambiar. */
  total?: string;
  /** Con dos o más cosas que se reparten: el porcentaje de cada una, por su `id`. */
  reparto?: Readonly<Record<string, number>>;
}
export interface ResultadoEvento {
  /** «Asado para 12 (10 adultos, 2 chicos)». */
  titulo: string;
  cifras: readonly Linea[];
  grupos: readonly GrupoDeResultado[];
  /** Lo que se suma después, en sus grupos: «Además» y «Para el fuego». */
  ademas: readonly GrupoDeResultado[];
  advertencias: readonly string[];
  fuentes: readonly Fuente[];
}
