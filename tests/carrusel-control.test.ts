import { describe, it, expect, afterEach } from 'vitest';
import { accionesDelCarrusel } from '../src/carrusel-control.js';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

/** Una flecha adentro de su marco, cuya pista mide `ancho` y anota cada desplazamiento. */
function flechaDe(ancho: number) {
  const desplazamientos: ScrollToOptions[] = [];
  const pista = { clientWidth: ancho, scrollBy: (o: ScrollToOptions) => { desplazamientos.push(o); } };
  const marco = { querySelector: (sel: string) => (sel === '[data-carrusel]' ? pista : null) };
  const flecha = comoGlobal<HTMLElement>({ closest: (sel: string) => (sel === '.carrusel-marco' ? marco : null) });
  return { flecha, desplazamientos };
}

const tocar = (accion: string, flecha: HTMLElement): unknown =>
  accionesDelCarrusel[accion]?.(flecha, comoGlobal<Event>({}));

describe('carrusel-control', () => {
  afterEach(() => { limpiarGlobales(); });

  it('la flecha derecha corre la pista de su marco el 80% de lo que se ve', () => {
    global.window = comoGlobal<Window & typeof globalThis>({});
    const { flecha, desplazamientos } = flechaDe(300);
    tocar('carrusel-der', flecha);
    expect(desplazamientos).toEqual([{ left: 240, behavior: 'smooth' }]);
  });

  it('la izquierda, para el otro lado', () => {
    global.window = comoGlobal<Window & typeof globalThis>({});
    const { flecha, desplazamientos } = flechaDe(300);
    tocar('carrusel-izq', flecha);
    expect(desplazamientos).toEqual([{ left: -240, behavior: 'smooth' }]);
  });

  it('con el movimiento reducido, salta sin animar', () => {
    global.window = comoGlobal<Window & typeof globalThis>({ matchMedia: () => ({ matches: true }) });
    const { flecha, desplazamientos } = flechaDe(300);
    tocar('carrusel-der', flecha);
    expect(desplazamientos).toEqual([{ left: 240, behavior: 'auto' }]);
  });

  it('una flecha sin marco no hace nada', () => {
    global.window = comoGlobal<Window & typeof globalThis>({});
    const flecha = comoGlobal<HTMLElement>({ closest: () => null });
    expect(() => tocar('carrusel-der', flecha)).not.toThrow();
  });
});
