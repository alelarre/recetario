import { describe, it, expect } from 'vitest';
import { crearVisorControl, pasoDelVisor } from '../src/visor-control.js';

/** El controlador con unas capas de mentira que anotan lo que se les pide. */
function montar() {
  const capas: string[] = [];
  const visor = crearVisorControl({
    abrirCapa: capa => { capas.push(`abrir ${capa}`); },
    cerrarCapa: capa => { capas.push(`cerrar ${capa ?? ''}`); }
  });
  return { visor, capas };
}

const TIRA = [{ n: 2, url: 'https://x/2.jpg' }, { n: 3, url: 'https://x/3.jpg' }, { n: 5, url: 'https://x/5.jpg' }];

/** Un deslizamiento entero: el dedo apoya en `desde` y se levanta en `hasta`. */
const deslizar = (visor: ReturnType<typeof crearVisorControl>, desde: number, hasta: number): boolean => {
  visor.empezarToque(desde);
  return visor.terminarToque(hasta);
};

describe('pasoDelVisor', () => {
  it('un deslizamiento corto no mueve el índice', () => {
    expect(pasoDelVisor(1, 10, 5)).toBe(1);
    expect(pasoDelVisor(1, -39, 5)).toBe(1);
  });

  it('deslizar hacia la izquierda avanza a la siguiente', () => {
    expect(pasoDelVisor(1, -40, 5)).toBe(2);
  });

  it('deslizar hacia la derecha vuelve a la anterior', () => {
    expect(pasoDelVisor(1, 40, 5)).toBe(0);
  });

  it('no da la vuelta: en la primera, deslizar hacia la anterior deja el índice', () => {
    expect(pasoDelVisor(0, 40, 5)).toBe(0);
  });

  it('no da la vuelta: en la última, deslizar hacia la siguiente deja el índice', () => {
    expect(pasoDelVisor(4, -40, 5)).toBe(4);
  });

  it('con una sola foto, ningún deslizamiento mueve el índice', () => {
    expect(pasoDelVisor(0, -40, 1)).toBe(0);
    expect(pasoDelVisor(0, 40, 1)).toBe(0);
  });
});

describe('visor-control — abrir', () => {
  it('arranca cerrado', () => {
    expect(montar().visor.estado).toBeNull();
  });

  it('abre en la foto tocada, recorriendo la tira, y es una capa', () => {
    const { visor, capas } = montar();
    expect(visor.abrir(TIRA, 3)).toBe(true);
    expect(visor.estado).toEqual({ urls: TIRA.map(f => f.url), i: 1 });
    expect(capas).toEqual(['abrir visor']);
  });

  it('una foto que no está en la tira se abre sola, con la URL suelta', () => {
    const { visor } = montar();
    visor.abrir(TIRA, 1, 'https://x/portada.jpg');
    expect(visor.estado).toEqual({ urls: ['https://x/portada.jpg'], i: 0 });
  });

  it('sin número también se abre sola', () => {
    const { visor } = montar();
    visor.abrir([], undefined, 'https://x/suelta.jpg');
    expect(visor.estado).toEqual({ urls: ['https://x/suelta.jpg'], i: 0 });
  });

  it('sin nada que mostrar no abre, ni suma una capa', () => {
    const { visor, capas } = montar();
    expect(visor.abrir(TIRA, 1)).toBe(false);
    expect(visor.abrir(TIRA, 1, '')).toBe(false);
    expect(visor.estado).toBeNull();
    expect(capas).toEqual([]);
  });
});

describe('visor-control — el gesto', () => {
  it('deslizar hacia la izquierda pasa a la siguiente foto', () => {
    const { visor } = montar();
    visor.abrir(TIRA, 2);
    expect(deslizar(visor, 200, 100)).toBe(true);
    expect(visor.estado?.i).toBe(1);
  });

  it('un movimiento corto, o en un extremo, no cambia de foto', () => {
    const { visor } = montar();
    visor.abrir(TIRA, 2);
    expect(deslizar(visor, 200, 180)).toBe(false);
    expect(deslizar(visor, 100, 200)).toBe(false);
    expect(visor.estado?.i).toBe(0);
  });

  it('el dedo es del visor sólo mientras está abierto', () => {
    const { visor } = montar();
    expect(visor.empezarToque(200)).toBe(false);
    expect(visor.terminarToque(100)).toBe(false);
    visor.abrir(TIRA, 2);
    expect(visor.empezarToque(200)).toBe(true);
    // Con más de un dedo sigue siendo del visor, pero no desliza.
    expect(visor.empezarToque(null)).toBe(true);
    expect(visor.terminarToque(100)).toBe(false);
  });

  it('levantar el dedo sin haberlo apoyado no hace nada', () => {
    const { visor } = montar();
    visor.abrir(TIRA, 2);
    expect(visor.terminarToque(100)).toBe(false);
    expect(visor.estado?.i).toBe(0);
  });
});

describe('visor-control — cerrar', () => {
  it('tocar lo cierra y consume su capa', () => {
    const { visor, capas } = montar();
    visor.abrir(TIRA, 2);
    expect(visor.tocar()).toBe(true);
    expect(visor.estado).toBeNull();
    expect(capas).toEqual(['abrir visor', 'cerrar visor']);
  });

  it('el click que sigue a un deslizamiento no cierra: ya cambió de foto', () => {
    const { visor, capas } = montar();
    visor.abrir(TIRA, 2);
    deslizar(visor, 200, 100);
    expect(visor.tocar()).toBe(false);
    expect(visor.estado?.i).toBe(1);
    expect(capas).toEqual(['abrir visor']);
    // El toque siguiente sí.
    expect(visor.tocar()).toBe(true);
    expect(visor.estado).toBeNull();
  });

  it('un toque nuevo olvida el deslizamiento anterior', () => {
    const { visor } = montar();
    visor.abrir(TIRA, 2);
    deslizar(visor, 200, 100);
    // Apoya y levanta sin moverse: el click de ese toque cierra.
    expect(deslizar(visor, 150, 150)).toBe(false);
    expect(visor.tocar()).toBe(true);
  });

  it('olvidar lo cierra sin tocar el historial: el atrás ya consumió la capa', () => {
    const { visor, capas } = montar();
    visor.abrir(TIRA, 2);
    deslizar(visor, 200, 100);
    visor.olvidar();
    expect(visor.estado).toBeNull();
    expect(capas).toEqual(['abrir visor']);
    // Lo que quedó del deslizamiento no se come el primer toque del próximo visor.
    visor.abrir(TIRA, 2);
    expect(visor.tocar()).toBe(true);
  });
});
