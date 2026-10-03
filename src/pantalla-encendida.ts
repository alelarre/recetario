/**
 * La pantalla no se apaga mientras corre un temporizador. Es un bloqueo propio,
 * aparte del del modo cocina: cada uno pide y suelta el suyo, y el sistema
 * mantiene la pantalla mientras haya uno. El bloqueo se pierde solo al pasar
 * a segundo plano, así que `mantener` se llama a cada tic y pide de nuevo
 * sólo cuando no hay uno vivo.
 */
import type { Pantalla } from './temporizadores-control.js';

export function crearPantallaEncendida(): Pantalla {
  let bloqueo: WakeLockSentinel | null = null;
  let pidiendo = false;
  return {
    mantener() {
      if (bloqueo || pidiendo || typeof navigator === 'undefined' || !navigator.wakeLock) return;
      pidiendo = true;
      navigator.wakeLock.request('screen')
        .then(b => { bloqueo = b; b.addEventListener('release', () => { bloqueo = null; }); })
        .catch(() => { /* en segundo plano el pedido falla; el próximo tic a la vista lo vuelve a pedir */ })
        .finally(() => { pidiendo = false; });
    },
    soltar() {
      void bloqueo?.release();
      bloqueo = null;
    }
  };
}
