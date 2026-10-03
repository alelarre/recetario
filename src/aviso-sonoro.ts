/**
 * El aviso de una cuenta que llegó a cero: un pitido generado con Web Audio
 * —tres notas cortas— y una vibración. Sin archivo de audio: nada que cachear
 * ni que cargar. El contexto de audio se crea en el toque que empieza la
 * cuenta (`preparar`): el navegador no deja arrancar audio sin un gesto. Una
 * cuenta que ya corría al recargar no pasó por ese toque: `sonar` crea el
 * contexto y lo reanuda, y el navegador lo deja una vez que hubo cualquier
 * toque en la página.
 */
import type { Aviso } from './cuentas-control.js';

export function crearAvisoSonoro(): Aviso {
  let ctx: AudioContext | null = null;
  /** El contexto andando, o ninguno si el navegador no tiene Web Audio. */
  function contexto(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    ctx ??= new AudioContext();
    if (ctx.state !== 'running') void ctx.resume();
    return ctx;
  }
  return {
    preparar() { contexto(); },
    sonar() {
      const ctx = contexto();
      if (!ctx) return;
      const t = ctx.currentTime;
      for (const demora of [0, 0.18, 0.36]) {
        const osc = ctx.createOscillator();
        const gan = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        osc.connect(gan);
        gan.connect(ctx.destination);
        gan.gain.setValueAtTime(0.0001, t + demora);
        gan.gain.exponentialRampToValueAtTime(0.4, t + demora + 0.01);
        gan.gain.exponentialRampToValueAtTime(0.0001, t + demora + 0.14);
        osc.start(t + demora);
        osc.stop(t + demora + 0.15);
      }
    },
    vibrar() {
      // Sin vibración —la Mac, un navegador que no la tiene— no pasa nada.
      navigator.vibrate?.([200, 100, 200]);
    }
  };
}
