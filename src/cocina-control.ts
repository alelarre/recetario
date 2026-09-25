/**
 * El estado del modo cocina y la pantalla encendida. Lo usan la app y la vista
 * de invitado: marcar, conmutar y no dejar que la pantalla se apague se
 * comportan igual en las dos.
 *
 * El estado se limpia al entrar: al volver a abrir una receta no hay ningún
 * paso realzado ni marcado (C03.2.4). No persiste en ningún lado.
 */
import type { PosicionCocina } from './ui/cocina.js';
import type { Navegacion } from './navegacion.js';

export function crearControlCocina() {
  let posicion: PosicionCocina = 'ingredientes';
  /** El paso actual. Al entrar es el primero: sin uno elegido, la pantalla no dice dónde estás. */
  let aqui = 0;
  let hechos: number[] = [];
  /** El scroll de cada lado del conmutador, para no perderlo al conmutar (C03.2.2). */
  const scroll: Record<PosicionCocina, number> = { ingredientes: 0, pasos: 0 };
  /** Para que la pantalla no se apague cocinando. */
  let bloqueo: WakeLockSentinel | null = null;

  /**
   * Que la pantalla no se apague mientras se cocina: es la fricción más real de
   * seguir una receta con las manos sucias. El bloqueo se pierde solo cuando la
   * app pasa a segundo plano, así que hay que volver a pedirlo al volver — sin
   * eso, alcanza con atender un mensaje para que la pantalla se apague de nuevo.
   */
  async function mantenerPantalla(): Promise<boolean> {
    if (!navigator.wakeLock) return false;
    try {
      bloqueo = await navigator.wakeLock.request('screen');
      bloqueo.addEventListener('release', () => { bloqueo = null; });
      return true;
    } catch {
      bloqueo = null;
      return false;
    }
  }

  async function soltarPantalla(): Promise<void> {
    try { await bloqueo?.release(); } catch { /* ya soltado */ }
    bloqueo = null;
  }

  return {
    estado: () => ({ posicion, aqui, hechos, wakeActivo: !!bloqueo }),
    reiniciar(): void {
      posicion = 'ingredientes';
      aqui = 0;
      hechos = [];
      scroll.ingredientes = scroll.pasos = 0;
    },
    /** Devuelve el scroll al que volver, o `null` si ya estaba ahí. */
    conmutar(destino: string | undefined, scrollActual: number): number | null {
      const nueva: PosicionCocina = destino === 'pasos' ? 'pasos' : 'ingredientes';
      if (nueva === posicion) return null;
      scroll[posicion] = scrollActual;
      posicion = nueva;
      return scroll[nueva];
    },
    /**
     * Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
     * hecho y el hilo sigue al siguiente. Devuelve si hubo que redibujar.
     */
    marcarPaso(valor: string | undefined): boolean {
      const n = Number(valor ?? -1);
      if (!Number.isInteger(n) || n < 0) return false;
      if (aqui === n) {
        hechos = [...hechos.filter(p => p !== n), n];
        aqui = n + 1;
      } else {
        aqui = n;
        hechos = hechos.filter(p => p !== n);
      }
      return true;
    },
    /**
     * El chevron: suelta la pantalla y vuelve a la lectura, `lectura`. Es el
     * mismo en la app y en el invitado: vuelve una entrada, y sin pantalla
     * atrás —un link directo a la cocina— la lectura toma su lugar.
     */
    async volverALectura(nav: Pick<Navegacion, 'volver'>, lectura: string): Promise<void> {
      await soltarPantalla();
      nav.volver(lectura);
    },
    /**
     * *Salir*: suelta la pantalla y vuelve hasta salir de la receta, `receta`,
     * a donde se la eligió. Sin nada atrás —un link directo a la cocina—,
     * `respaldo` toma su lugar.
     */
    async salir(nav: Pick<Navegacion, 'salirDe'>, receta: string, respaldo: string): Promise<void> {
      await soltarPantalla();
      nav.salirDe(receta, respaldo);
    },
    mantenerPantalla,
    soltarPantalla,
    async alternarPantalla(): Promise<void> {
      if (bloqueo) await soltarPantalla();
      else await mantenerPantalla();
    },
    /** Si el sol sigue encendido y el bloqueo no está, se perdió al irse a segundo plano. */
    necesitaRepedir: (solEncendido: boolean): boolean => solEncendido && !bloqueo
  };
}

export type ControlCocina = ReturnType<typeof crearControlCocina>;
