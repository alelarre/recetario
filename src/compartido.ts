/**
 * Convertir un borrador en receta (C05.4.3). El único camino para escribir es
 * el store, que escribe el `.md` y su fila juntos; acá vive la operación que
 * además descarta el borrador, y que es una sola y no tres.
 */
import type { Store } from './store.js';
import type { Receta } from './tipos.js';

/** Lo que una receta recién creada devuelve: su identidad en Drive (R5). */
export interface RecetaCreada {
  id: string;
  nombre_archivo: string;
}

export type StoreDeCompartido = Pick<Store, 'crear' | 'guardar' | 'descartarBorrador'>;

export interface DependenciasCompartido {
  store: StoreDeCompartido;
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
  const convertidos = deps.convertidos ??= new Map<string, RecetaCreada>();

  // El `.md` y su fila: las dos las hace el store en una sola llamada.
  const anterior = convertidos.get(borradorId);
  let creada: RecetaCreada;
  if (anterior) {
    await deps.store.guardar(anterior.id, receta, { carpetaDestino: carpetaId });
    creada = anterior;
  } else {
    creada = await deps.store.crear(receta, { carpetaId });
  }
  convertidos.set(borradorId, creada);

  // El borrador: su `.md` a la papelera y su fila afuera. Que ya no esté no es
  // un error (edge case de F01.7).
  await deps.store.descartarBorrador(borradorId);

  convertidos.delete(borradorId);
  return creada;
}
