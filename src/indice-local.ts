/**
 * La copia local del índice: «la planilla `_indice` tal como la vi por
 * última vez». Este módulo sólo la lee, la guarda y la borra; cuándo usarla lo
 * decide el store.
 *
 * Cualquier falla de `localStorage` —navegación privada, almacenamiento lleno o
 * bloqueado, JSON roto— se lee como «no hay copia». La copia nunca es
 * imprescindible: sin ella, la app baja la planilla.
 */
import type { Categoria, Entrada, EntradaBorrador } from './tipos.js';

const CLAVE_STORAGE = 'recetario-indice';

export interface CopiaIndice {
  /** El SCHEMA_VERSION del código que escribió la copia. */
  schemaVersion: number;
  /** Qué planilla es. */
  indiceId: string;
  /** La carpeta `Recetario/`: con ella y `indiceId`, abrir no busca nada. */
  raizId: string;
  /** El nombre de la carpeta, para mostrar en Ajustes sin pedidos. */
  raizNombre: string;
  /** El modifiedTime de `_indice` en Drive cuando se guardó la copia. */
  modifiedTime: string;
  /** La hoja `meta`: schemaVersion, ultima_reconstruccion, reconstruccion_en_curso. */
  meta: Record<string, string>;
  /**
   * La hoja `recetas`: cada entrada con su número de fila. Va explícito porque
   * el orden en memoria no es el de la planilla: guardar reubica la entrada al
   * final de la lista, y en la planilla queda en su lugar.
   */
  filas: { fila: number; entrada: Entrada }[];
  /** La hoja `borradores`, con el mismo criterio que `filas`. */
  borradores: { fila: number; entrada: EntradaBorrador }[];
  /** La hoja `categorias`, en el orden de la planilla. */
  categorias: Categoria[];
}

/** Lo que el store usa. `main` le pasa este módulo entero; los tests, un doble. */
export interface IndiceLocal {
  leer(): CopiaIndice | null;
  guardar(copia: CopiaIndice): void;
  borrar(): void;
}

export function leer(): CopiaIndice | null {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) return null;
    const copia: unknown = JSON.parse(crudo);
    return esCopia(copia) ? copia : null;
  } catch {
    return null;
  }
}

export function guardar(copia: CopiaIndice): void {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(copia));
  } catch {
    // Lleno o inaccesible: que no quede la anterior, que ya no es la planilla.
    borrar();
  }
}

export function borrar(): void {
  try { localStorage.removeItem(CLAVE_STORAGE); } catch { /* nada que borrar o storage inaccesible */ }
}

/** La forma, no cada entrada: el contenido lo escribió este mismo código. */
function esCopia(c: unknown): c is CopiaIndice {
  if (!c || typeof c !== 'object') return false;
  const x = c as Record<string, unknown>;
  return typeof x['schemaVersion'] === 'number'
    && typeof x['indiceId'] === 'string'
    && typeof x['modifiedTime'] === 'string'
    && !!x['meta'] && typeof x['meta'] === 'object'
    && Array.isArray(x['filas'])
    && Array.isArray(x['borradores'])
    && typeof x['raizId'] === 'string'
    && typeof x['raizNombre'] === 'string'
    && Array.isArray(x['categorias']);
}
