/**
 * Los tags especiales: lo que la app dibuja y filtra distinto. Viven en la
 * clave `tags_especiales` del `.md`, separados de `tags`. Cada uno se declara
 * acá con todo lo que lo distingue, y el resto del código consulta la
 * definición en vez de preguntar por nombre. El orden de la tabla es el de
 * cualquier fila de tags: primero lo que se busca para cocinar, al final lo
 * que falta terminar.
 */
import { normalizar } from './normalizar.js';

/** Las claves de `ICO` que usa un especial. El dominio no importa la UI. */
export type NombreIcono = 'estrella' | 'calendario' | 'marcador' | 'borrador';

export type TagEspecial = 'favorito' | 'menú diario' | 'probar' | 'borrador' | 'pan' | 'fermentado';

/** Las calculadoras de *Herramientas* que abre un especial desde la receta. */
export type Herramienta = 'pan' | 'fermentados';

export interface DefinicionEspecial {
  /** La forma canónica: la única que se lee y la que se escribe. */
  nombre: TagEspecial;
  /** Otras formas que no se escriben a mano en `tags`. */
  reservadas: readonly string[];
  icono: NombreIcono | null;
  /** Lo que dice la marca de la tarjeta para quien no la ve. */
  etiquetaMarca: string | null;
  /** Se ofrece como chip en la fila de especiales de las listas. */
  enChips: boolean;
  /** Se muestra en la receta y como marca en la tarjeta. */
  enReceta: boolean;
  /** La búsqueda por texto lo encuentra. */
  enBusqueda: boolean;
  /** El texto de su botón en el editor. */
  etiquetaEditor: string;
  /** La calculadora que abre el botón *Calcular* de la receta, o ninguna. */
  herramienta: Herramienta | null;
}

export const ESPECIALES: readonly DefinicionEspecial[] = [
  {
    nombre: 'favorito', reservadas: ['favorita', 'favoritos', 'favoritas'],
    icono: 'estrella', etiquetaMarca: 'Favorita',
    enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'favorito', herramienta: null
  },
  {
    nombre: 'menú diario', reservadas: [],
    icono: 'calendario', etiquetaMarca: 'Menú diario',
    enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'menú diario', herramienta: null
  },
  {
    nombre: 'probar', reservadas: [],
    icono: 'marcador', etiquetaMarca: 'Para probar',
    enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'probar', herramienta: null
  },
  // Sin marca ni chip: al borrador se llega por su lista, en el menú. El
  // ícono lo llevan sólo su botón del editor y el título de esa lista.
  {
    nombre: 'borrador', reservadas: ['borradores', 'incompleta', 'incompleto', 'incompletos', 'incompletas'],
    icono: 'borrador', etiquetaMarca: null,
    enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'borrador', herramienta: null
  },
  // Dicen qué calculadora sirve para la receta: abren la suya desde la
  // receta y no se muestran en ningún otro lado.
  {
    nombre: 'pan', reservadas: [], icono: null, etiquetaMarca: null,
    enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'pan', herramienta: 'pan'
  },
  {
    nombre: 'fermentado', reservadas: [], icono: null, etiquetaMarca: null,
    enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'fermentado', herramienta: 'fermentados'
  }
];

export const TAGS_ESPECIALES: readonly TagEspecial[] = ESPECIALES.map(d => d.nombre);

/** Contradicen a `borrador`: no son un especial, pero tampoco se escriben a mano. */
const FORMAS_TERMINADO = ['terminado', 'terminada', 'terminados', 'terminadas'] as const;

/** Lo que no se escribe a mano en `tags`. */
export const TAGS_RESERVADOS: readonly string[] = [
  ...ESPECIALES.flatMap(d => [d.nombre, ...d.reservadas]),
  ...FORMAS_TERMINADO
];

export function definicion(especial: TagEspecial): DefinicionEspecial {
  const d = ESPECIALES.find(x => x.nombre === especial);
  if (!d) throw new Error(`Especial desconocido: ${especial}`);
  return d;
}

/** El especial escrito en su forma canónica, sin mirar mayúsculas ni tildes, o `null`. */
export function tagEspecial(valor: unknown): TagEspecial | null {
  const n = normalizar(valor);
  if (!n) return null;
  return TAGS_ESPECIALES.find(t => normalizar(t) === n) ?? null;
}

/** Si el tag es uno de los reservados, sin importar mayúsculas ni tildes. */
export function tagReservado(valor: unknown): boolean {
  const n = normalizar(valor);
  return !!n && TAGS_RESERVADOS.some(t => normalizar(t) === n);
}

/** El especial del que un tag reservado es el nombre o una forma, o `null` (`terminado`). */
export function especialDeReservada(valor: unknown): TagEspecial | null {
  const n = normalizar(valor);
  if (!n) return null;
  return ESPECIALES.find(d => [d.nombre, ...d.reservadas].some(f => normalizar(f) === n))?.nombre ?? null;
}

/** Lo que se lee de `tags_especiales`: la lista cerrada, en su orden y sin repetir, y aparte lo que no es. */
export function especialesValidos(valores: readonly string[]): { validos: TagEspecial[]; ignorados: string[] } {
  const puestos = new Set<TagEspecial>();
  const ignorados: string[] = [];
  for (const v of valores) {
    const t = tagEspecial(v);
    if (t) puestos.add(t); else ignorados.push(v);
  }
  return { validos: TAGS_ESPECIALES.filter(t => puestos.has(t)), ignorados };
}
