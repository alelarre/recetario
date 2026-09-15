import { describe, it, expect, vi, afterEach } from 'vitest';
import { crearControlCocina } from '../src/cocina-control.js';

describe('el control del modo cocina', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('arranca en ingredientes con el paso 1 como actual', () => {
    expect(crearControlCocina().estado()).toEqual({ posicion: 'ingredientes', aqui: 0, hechos: [], wakeActivo: false });
  });

  it('tocar el paso actual lo da por hecho y el hilo sigue; tocar otro lo marca como actual', () => {
    const c = crearControlCocina();
    expect(c.marcarPaso('0')).toBe(true);
    expect(c.estado()).toMatchObject({ aqui: 1, hechos: [0] });
    c.marcarPaso('0');
    expect(c.estado()).toMatchObject({ aqui: 0, hechos: [] });
    expect(c.marcarPaso('x')).toBe(false);
  });

  it('conmutar guarda el scroll del lado que se deja y devuelve el del otro', () => {
    const c = crearControlCocina();
    expect(c.conmutar('pasos', 300)).toBe(0);
    expect(c.conmutar('ingredientes', 50)).toBe(300);
    expect(c.conmutar('ingredientes', 10)).toBeNull();
  });

  it('reiniciar vuelve todo al principio', () => {
    const c = crearControlCocina();
    // Ida, vuelta e ida: los dos lados quedan con scroll guardado y se termina en pasos.
    c.marcarPaso('0'); c.conmutar('pasos', 20); c.conmutar('ingredientes', 30); c.conmutar('pasos', 40);
    c.reiniciar();
    expect(c.estado()).toEqual({ posicion: 'ingredientes', aqui: 0, hechos: [], wakeActivo: false });
    // El primer conmutar pisa el scroll del lado que deja: el que verifica es el de pasos.
    expect(c.conmutar('pasos', 0)).toBe(0);
  });

  it('salir a la lectura es atrás sólo si se entró desde ella, una vez', () => {
    const c = crearControlCocina();
    expect(c.salirALectura()).toBe('reemplazar');
    c.entrarDesdeLectura();
    expect(c.salirALectura()).toBe('atras');
    expect(c.salirALectura()).toBe('reemplazar');
    c.entrarDesdeLectura(); c.olvidarLectura();
    expect(c.salirALectura()).toBe('reemplazar');
  });

  it('la pantalla encendida: pedir, soltar, y volver a pedir si se perdió', async () => {
    let soltar = () => {};
    vi.stubGlobal('navigator', { wakeLock: { request: async () => ({
      addEventListener: (_e: string, fn: () => void) => { soltar = fn; }, release: async () => {}
    }) } });
    const c = crearControlCocina();
    await c.alternarPantalla();
    expect(c.estado().wakeActivo).toBe(true);
    expect(c.necesitaRepedir(true)).toBe(false);
    soltar();
    expect(c.necesitaRepedir(true)).toBe(true);
    expect(c.necesitaRepedir(false)).toBe(false);
    await c.mantenerPantalla();
    await c.alternarPantalla();
    expect(c.estado().wakeActivo).toBe(false);
  });
});
