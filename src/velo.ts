/**
 * El velo: la pantalla ocupada mientras la app trabaja y no se la puede tocar
 * (R8). Es el único dueño de `#velo-escritura` y de `aria-busy` en `#app`.
 *
 * Tiene tres formas, y cada operación usa una sola:
 * - `escribir`: tapa desde el toque con la olla y cierra con el tilde.
 * - `esperar`: una espera que no escribe; tapa sin tilde, y si termina antes
 *   de `MS_ESPERA_VISIBLE` no llega a verse.
 * - `conProgreso`: el reindexado y la preparación de la carpeta base, con una
 *   tarjeta que lleva el texto y la barra en lugar de la olla.
 *
 * Las operaciones se cuentan: una adentro de otra no hace parpadear nada, y el
 * velo se va cuando termina la última.
 */

/**
 * Lo que dura el cierre con el tilde antes de que el que escribió pueda
 * navegar (§6.17b): el tilde termina de dibujarse a los 875 ms —0,3 s de
 * espera y 0,575 s de trazo— y se queda 975 ms más quieto, para que se llegue
 * a ver que salió bien. Con menos, el tilde aparece y la pantalla ya cambió.
 */
export const MS_CIERRE = 1850;

/** Lo que se espera a que la pantalla de destino se pinte antes de sacar el velo igual. */
export const MS_RESPALDO_CIERRE = 400;

/** Una espera más corta que esto no llega a mostrar el velo: sería un parpadeo. */
export const MS_ESPERA_VISIBLE = 250;

export interface DomDelVelo {
  /** `#velo-escritura`. Los tests corren sobre un DOM mínimo: puede no estar. */
  velo: () => HTMLElement | null;
  /** `#app`, que lleva `aria-busy` mientras la pantalla está ocupada. */
  app: () => Element | null;
  /** La pantalla pasó de libre a ocupada. */
  alTapar?: () => void;
}

export interface Velo {
  /** Una escritura: la olla desde el toque y el tilde al terminar bien. */
  escribir<T>(tarea: () => Promise<T>): Promise<T>;
  /** Una espera que no escribe: sin tilde, y visible sólo pasados `MS_ESPERA_VISIBLE`. */
  esperar<T>(tarea: () => Promise<T>): Promise<T>;
  /** El reindexado o la carpeta base: el texto y la barra, de 0 a 1. */
  conProgreso<T>(texto: string, tarea: (avance: (parte: number) => void) => Promise<T>): Promise<T>;
  /** Hay una operación en curso, o su tilde se está dibujando: no se navega ni se toca nada. */
  ocupado(): boolean;
  /** Lo llama el dibujo de la pantalla entera: saca el velo que quedó puesto después del tilde. */
  alPintar(): void;
}

type Forma = 'escribir' | 'esperar' | 'progreso';

interface Operacion {
  forma: Forma;
  /** Se ve. Una espera arranca invisible y aparece pasado su plazo. */
  visible: boolean;
  texto: string;
  parte: number;
  reloj: ReturnType<typeof setTimeout> | null;
}

/** Lo hecho, de 0 a 1, como entero de 0 a 100: el ancho de la barra. */
const porCiento = (parte: number): number => Math.min(100, Math.max(0, Math.round(parte * 100)));

export function crearVelo(dom: DomDelVelo): Velo {
  const activas = new Set<Operacion>();

  /**
   * El tilde que se está dibujando: la pantalla sigue ocupada, y `soltar`
   * deja seguir al que escribió. Una operación nueva lo corta y lo suelta
   * antes: si no, ese manejador se quedaría esperando un dibujo que ya no va
   * a pasar.
   */
  let cierre: { reloj: ReturnType<typeof setTimeout>; soltar: () => void } | null = null;

  /**
   * Terminado el tilde, el velo sigue puesto hasta que la pantalla de destino
   * se pinta: así su dibujo queda tapado. El respaldo es para la escritura
   * que no navega a ningún lado: sin él, el velo esperaría un dibujo que no viene.
   */
  let respaldo: ReturnType<typeof setTimeout> | null = null;

  const ocupado = (): boolean => activas.size > 0 || cierre !== null;

  function cortarCierre(): void {
    if (respaldo !== null) { clearTimeout(respaldo); respaldo = null; }
    if (cierre) { clearTimeout(cierre.reloj); cierre.soltar(); }
  }

  /** Lo que se ve con las operaciones en curso: la tarjeta del último progreso, la olla, o nada. */
  function dibujar(): void {
    const velo = dom.velo();
    if (!velo) return;
    const visibles = [...activas].filter(o => o.visible);
    if (!visibles.length) { velo.hidden = true; return; }
    const progreso = visibles.reverse().find(o => o.forma === 'progreso');
    velo.classList.remove('exito');
    velo.classList.toggle('progreso', !!progreso);
    if (progreso) {
      const texto = velo.querySelector<HTMLElement>('[data-progreso-texto]');
      if (texto) texto.textContent = progreso.texto;
      const barra = velo.querySelector<HTMLElement>('[data-progreso-barra]');
      if (barra) barra.style.width = `${porCiento(progreso.parte)}%`;
    }
    velo.hidden = false;
  }

  function sacar(): void {
    if (respaldo !== null) { clearTimeout(respaldo); respaldo = null; }
    const velo = dom.velo();
    if (velo) { velo.hidden = true; velo.classList.remove('exito', 'progreso'); }
  }

  function empezar(op: Operacion): void {
    const estaba = ocupado();
    // Con el velo ya en pantalla —el cierre de una escritura—, una espera no
    // tiene parpadeo que evitar: sigue tapando desde ya.
    const yaSeVe = dom.velo()?.hidden === false;
    cortarCierre();
    if (op.forma !== 'esperar' || yaSeVe) op.visible = true;
    else op.reloj = setTimeout(() => { op.reloj = null; op.visible = true; dibujar(); }, MS_ESPERA_VISIBLE);
    activas.add(op);
    dom.app()?.setAttribute('aria-busy', 'true');
    if (!estaba) dom.alTapar?.();
    dibujar();
  }

  /** Termina una operación. Devuelve cuándo puede seguir el que la lanzó. */
  function terminar(op: Operacion, bien: boolean): Promise<void> {
    if (op.reloj !== null) { clearTimeout(op.reloj); op.reloj = null; }
    activas.delete(op);
    if (activas.size) { dibujar(); return Promise.resolve(); }
    const velo = dom.velo();
    if (!bien || op.forma !== 'escribir' || !velo) {
      dom.app()?.removeAttribute('aria-busy');
      sacar();
      return Promise.resolve();
    }
    // El cierre: la tapa baja sobre la olla y se dibuja el tilde.
    velo.classList.remove('progreso');
    velo.classList.add('exito');
    return new Promise(listo => {
      const soltar = (): void => {
        cierre = null;
        dom.app()?.removeAttribute('aria-busy');
        listo();
      };
      cierre = {
        soltar,
        reloj: setTimeout(() => {
          soltar();
          respaldo = setTimeout(sacar, MS_RESPALDO_CIERRE);
        }, MS_CIERRE)
      };
    });
  }

  async function correr<T>(op: Operacion, tarea: () => Promise<T>): Promise<T> {
    empezar(op);
    let resultado: T;
    try {
      resultado = await tarea();
    } catch (err) {
      void terminar(op, false);
      throw err;
    }
    await terminar(op, true);
    return resultado;
  }

  const nueva = (forma: Forma, texto = ''): Operacion => ({ forma, visible: false, texto, parte: 0, reloj: null });

  return {
    escribir: tarea => correr(nueva('escribir'), tarea),
    esperar: tarea => correr(nueva('esperar'), tarea),
    conProgreso: (texto, tarea) => {
      const op = nueva('progreso', texto);
      return correr(op, () => tarea(parte => {
        op.parte = parte;
        if (activas.has(op)) dibujar();
      }));
    },
    ocupado,
    alPintar: () => { if (respaldo !== null) sacar(); }
  };
}
