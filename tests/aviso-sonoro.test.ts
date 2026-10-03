import { describe, it, expect, afterEach } from 'vitest';
import { crearAvisoSonoro } from '../src/aviso-sonoro.js';

/** Un `AudioContext` mínimo: cuenta los contextos, las reanudaciones y los osciladores. */
function audioFalso() {
  const registro = { contextos: 0, reanudados: 0, osciladores: 0 };
  class ContextoFalso {
    state: AudioContextState = 'suspended';
    currentTime = 0;
    destination = {};
    constructor() { registro.contextos++; }
    resume() { registro.reanudados++; this.state = 'running'; return Promise.resolve(); }
    createOscillator() {
      registro.osciladores++;
      return { type: '', frequency: { value: 0 }, connect: () => {}, start: () => {}, stop: () => {} };
    }
    createGain() {
      return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } };
    }
  }
  (globalThis as unknown as Record<string, unknown>)['AudioContext'] = ContextoFalso;
  return registro;
}

afterEach(() => { delete (globalThis as unknown as Record<string, unknown>)['AudioContext']; });

describe('el aviso sonoro', () => {
  it('después de recargar, sin haber empezado un temporizador, suena igual: crea el contexto y lo reanuda', () => {
    const registro = audioFalso();
    const aviso = crearAvisoSonoro();
    aviso.sonar();
    expect(registro.contextos).toBe(1);
    expect(registro.reanudados).toBe(1);
    expect(registro.osciladores).toBe(3);
  });

  it('un solo contexto, aunque suene muchas veces', () => {
    const registro = audioFalso();
    const aviso = crearAvisoSonoro();
    aviso.preparar();
    aviso.sonar();
    aviso.sonar();
    expect(registro.contextos).toBe(1);
  });

  it('sin Web Audio no hace nada', () => {
    const aviso = crearAvisoSonoro();
    expect(() => { aviso.preparar(); aviso.sonar(); }).not.toThrow();
  });
});
