/**
 * Lo que es de la pantalla que se está mirando. Cambiar de pantalla lo tira
 * entero y arranca con `estadoNuevo()`: si no, se entra a otra categoría y no
 * se ve nada porque quedó filtrando por un tag que ahí no existe, sin forma de
 * darse cuenta.
 *
 * Lo que sobrevive a un cambio de pantalla no va acá: vive aparte en
 * `main.ts`, cada cosa con el motivo por el que sobrevive.
 */
import { crearListaControl } from './lista-control.js';
import type { ListaControl } from './lista-control.js';
import type { FotosDelPedido } from './compartir.js';
import type { CarpetaSimple } from './ui/carpeta.js';
import type { EstadoCompartir } from './ui/compartir.js';

/** El pedido al agente, listo para mandar: el texto y las fotos. */
export type PedidoAlAgente = { pedido: string; fotos: FotosDelPedido | null };

export interface EstadoDePantalla {
  /**
   * El editor abierto: su hash y cómo estaba el formulario al dibujarlo. Salir
   * con el formulario distinto pregunta antes (C04.1.1). La comparación es
   * contra esta foto, no contra el `.md` de Drive: no se lee nada para decidir.
   */
  editorAbierto: { hash: string; formulario: string } | null;
  /**
   * Adónde se iba cuando la pregunta de cambios sin guardar frenó la salida
   * por un link: *Salir sin guardar* va ahí. `null` si se salía por el atrás,
   * y ahí salir es volver.
   */
  salidaPendiente: string | null;
  /**
   * Cuántas fotos dejó el service worker del menú Compartir para la receta
   * nueva que se está abriendo, todavía sin leer. Se leen una sola vez: un
   * redibujado del editor no las vuelve a sumar.
   */
  compartidasPorLeer: number;
  /** La lista de recetas de la pantalla: sus filtros, su orden y su tramo. */
  lista: ListaControl;
  /** Reiniciar el plan pregunta antes: vacía los siete días. */
  confirmandoReinicio: boolean;
  /** Lo escrito en la caja de la pantalla de agregar. Vive acá y no en el DOM: el bloque se redibuja solo. */
  consultaPlan: string;
  /** La categoría elegida en la grilla de la pantalla de agregar, si hay una. */
  categoriaPlan: string | null;
  /**
   * La pantalla de la carpeta base: la carpeta que se está por usar y lo que
   * falló. Las sugerencias no van acá: vienen del arranque.
   */
  selector: { confirmando: CarpetaSimple | null; error: string };
  /** La foto propia recién elegida para una categoría: se sube al guardarla. */
  fotoPropia: { blob: Blob; url: string } | null;
  /** La ficha de compartir abierta, o `null`. */
  compartiendo: EstadoCompartir | null;
  /** El PDF ya armado, para *Enviar PDF* cuando Chrome perdió el toque: no se vuelve a generar. */
  pdfListo: File | null;
  /** La estrella de favorito está escribiendo: dura lo que tarda Drive. */
  marcandoFavorito: boolean;
  /** Lo último que falló al marcar favorito. Lo dibuja la receta, arriba de la ficha. */
  errorFavorito: string;
  /** El reindexado lanzado desde Ajustes falló: Ajustes lo avisa arriba del botón Reindexar. */
  errorReindexado: boolean;
  /**
   * El aviso que la pantalla trajo al llegar: cómo terminó el pedido al
   * agente se lee en la receta, porque el editor desde el que se mandó ya se
   * cerró.
   */
  avisoDeLlegada: string;
  /**
   * El pedido que no salió —el navegador ya no tenía la activación del toque—
   * y que la receta ofrece mandar con un toque nuevo. Como `pdfListo` con
   * *Enviar PDF*: no se vuelve a armar.
   */
  pedidoPendiente: PedidoAlAgente | null;
}

export const estadoNuevo = (): EstadoDePantalla => ({
  editorAbierto: null,
  salidaPendiente: null,
  compartidasPorLeer: 0,
  lista: crearListaControl(),
  confirmandoReinicio: false,
  consultaPlan: '',
  categoriaPlan: null,
  selector: { confirmando: null, error: '' },
  fotoPropia: null,
  compartiendo: null,
  pdfListo: null,
  marcandoFavorito: false,
  errorFavorito: '',
  errorReindexado: false,
  avisoDeLlegada: '',
  pedidoPendiente: null
});
