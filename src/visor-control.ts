/**
 * El controlador del visor de fotos: qué fotos recorre, en cuál está, el gesto
 * para pasar de una a otra y el cierre. Lo usan la app y la vista de invitado;
 * cada una dibuja el visor a su manera (`renderVisor` en `ui/visor.ts`) y
 * escucha los toques, y le pasa acá lo que el dedo hizo.
 *
 * Abierto es una capa: el atrás lo cierra sin salir de la pantalla.
 */
import type { EstadoVisor } from './ui/visor.js';
import type { Navegacion } from './navegacion.js';

/** Lo que el visor necesita del historial: abrir su capa y consumirla al cerrar tocando. */
export type CapasDelVisor = Pick<Navegacion, 'abrirCapa' | 'cerrarCapa'>;

/** Una foto de la tira que recorre el visor. */
export interface FotoDelVisor { n: number; url: string }

export interface VisorControl {
  /** El visor abierto, o `null`. */
  readonly estado: EstadoVisor | null;
  /**
   * Abre con **lo que se tocó**: la foto `n`, deslizando entre las de la
   * tira. Una foto que no está en la tira —la portada, la de un paso— se
   * abre sola, con la URL `suelta`. Devuelve si abrió.
   */
  abrir(tira: FotoDelVisor[], n?: number, suelta?: string): boolean;
  /** El toque sobre el visor. Lo cierra y devuelve `true`, salvo que sea el click con el que termina un deslizamiento. */
  tocar(): boolean;
  /** Lo cierra sin tocar el historial: el atrás ya consumió la capa, o se cambió de pantalla. */
  olvidar(): void;
  /**
   * El dedo apoya: `x` si es uno solo, `null` si son más. Devuelve si el dedo
   * es del visor —está abierto—, y entonces no es de nadie más.
   */
  empezarToque(x: number | null): boolean;
  /** El dedo se levanta en `x`. Devuelve si cambió de foto: hay que volver a dibujarlo. */
  terminarToque(x: number | null): boolean;
}

/** Por debajo de esto no llega a ser un deslizamiento. */
const UMBRAL = 40;

/**
 * El índice después de un deslizamiento: `dx` es el desplazamiento horizontal
 * en píxeles. Por debajo del umbral el índice no se mueve. Hacia la izquierda
 * avanza a la siguiente foto, hacia la derecha vuelve a la anterior; en los
 * extremos no da la vuelta.
 */
export function pasoDelVisor(i: number, dx: number, total: number): number {
  if (Math.abs(dx) < UMBRAL) return i;
  const siguiente = dx < 0 ? i + 1 : i - 1;
  return Math.min(Math.max(siguiente, 0), total - 1);
}

export function crearVisorControl(capas: CapasDelVisor): VisorControl {
  let estado: EstadoVisor | null = null;
  /** Dónde apoyó el dedo, o `null`. */
  let desde: number | null = null;
  /**
   * El deslizamiento cambió de foto: el click que viene después del
   * `touchend` no cierra el visor, que si no se cerraría en cada gesto.
   */
  let deslizo = false;

  const cerrar = (): void => { estado = null; desde = null; deslizo = false; };

  return {
    get estado() { return estado; },

    abrir(tira, n, suelta) {
      const i = n === undefined ? -1 : tira.findIndex(f => f.n === n);
      if (i >= 0) estado = { urls: tira.map(f => f.url), i };
      else if (suelta) estado = { urls: [suelta], i: 0 };
      else return false;
      deslizo = false;
      capas.abrirCapa('visor');
      return true;
    },

    tocar() {
      if (deslizo) { deslizo = false; return false; }
      capas.cerrarCapa('visor');
      cerrar();
      return true;
    },

    olvidar: cerrar,

    empezarToque(x) {
      deslizo = false;
      desde = estado ? x : null;
      return estado !== null;
    },

    terminarToque(x) {
      const inicio = desde;
      desde = null;
      if (!estado || inicio === null || x === null) return false;
      const i = pasoDelVisor(estado.i, x - inicio, estado.urls.length);
      if (i === estado.i) return false;
      estado = { ...estado, i };
      deslizo = true;
      return true;
    }
  };
}
