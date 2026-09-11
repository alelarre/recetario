/**
 * La capa que la app y el agente invocan igual (C05.4.3).
 *
 * Tres operaciones viven acá —escribir una receta al índice, convertir un
 * borrador en receta y leer un `.md`— y son el único camino para escribir: dos
 * implementaciones del mismo formato divergen, una sola no.
 *
 * Son funciones finas sobre el store y sobre `borradores`. La única con lógica
 * propia es `convertirBorrador`, que es una operación y no tres.
 */
import type { Store } from './store.js';
import type { Borradores } from './borradores.js';
import type { Receta, Ubicacion } from './tipos.js';

/** Lo que una receta recién creada devuelve: su identidad en Drive (R5). */
export interface RecetaCreada {
  id: string;
  nombre_archivo: string;
}

export type StoreDeCompartido = Pick<Store, 'escribirFila' | 'crear' | 'guardar' | 'receta'>;
export type BorradoresDeCompartido = Pick<Borradores, 'descartar'>;

export interface DependenciasCompartido {
  store: StoreDeCompartido;
  borradores: BorradoresDeCompartido;
  /**
   * Lo que una conversión ya creó, por si hay que reintentarla: borrador → la
   * receta. Sin esto el reintento crearía un segundo `.md`, y R2 pide que deje
   * una sola fila. Vive con las dependencias y no en el módulo porque dura lo
   * que la sesión: el reintento es a mano y en el momento (R1). Si la app se
   * recargó en el medio, la conversión vuelve a empezar y el duplicado se ve.
   */
  convertidos?: Map<string, RecetaCreada>;
}

/**
 * Escribe o reemplaza **su** fila, identificada por el `fileId` (C05.4.1).
 * Repetirla con la misma receta deja una sola fila.
 */
export function escribirRecetaAlIndice(
  { store }: DependenciasCompartido, receta: Receta, ubicacion: Ubicacion
): Promise<void> {
  return store.escribirFila(receta, ubicacion);
}

/**
 * Convertir es una operación, no tres (C01.7.1): escribe el `.md`, escribe la
 * fila del índice y borra la fila del borrador, en ese orden. No captura nada
 * en el medio —si algo falla, propaga y el reintento repite los tres (R2)—.
 *
 * La `fuente` del borrador llega en la receta: la pone quien la arma —el
 * editor, que abre con el título y la fuente del borrador—, no esta función.
 */
export async function convertirBorrador(
  deps: DependenciasCompartido,
  { borradorId, receta, carpetaId }: { borradorId: string; receta: Receta; carpetaId: string }
): Promise<RecetaCreada> {
  const convertidos = deps.convertidos ?? (deps.convertidos = new Map<string, RecetaCreada>());

  // El `.md` y su fila: las dos las hace el store en una sola llamada.
  const anterior = convertidos.get(borradorId);
  const creada = anterior
    ? (await deps.store.guardar(anterior.id, receta, { carpetaDestino: carpetaId }), anterior)
    : await deps.store.crear(receta, { carpetaId });
  convertidos.set(borradorId, creada);

  // El borrador. Que ya no esté no es un error (edge case de F01.7).
  await deps.borradores.descartar(borradorId);

  convertidos.delete(borradorId);
  return creada;
}

/** Lee el `.md` y lo parsea. El archivo es la verdad: acá no se compara nada (R4). */
export async function leerReceta({ store }: DependenciasCompartido, id: string): Promise<Receta> {
  return (await store.receta(id)).receta;
}
