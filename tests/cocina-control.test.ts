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

  /** Una navegación que anota lo que se le pidió. */
  const navFalsa = () => {
    const pedidos: string[] = [];
    return {
      pedidos,
      volver: (respaldo: string, n = 1) => { pedidos.push(`volver ${respaldo} ${n}`); },
      reemplazar: (hash: string) => { pedidos.push(`reemplazar ${hash}`); }
    };
  };

  it('el chevron vuelve a la lectura, se haya entrado desde ella o no', async () => {
    const c = crearControlCocina();
    const nav = navFalsa();
    await c.volverALectura(nav, '#/r/f1');
    c.entrarDesdeLectura();
    await c.volverALectura(nav, '#/r/f1');
    expect(nav.pedidos).toEqual(['volver #/r/f1 1', 'volver #/r/f1 1']);
  });

  it('Salir saltea la lectura sólo si se entró desde ella, una vez', async () => {
    const c = crearControlCocina();
    const nav = navFalsa();
    await c.salir(nav, '#/c/Carnes');
    c.entrarDesdeLectura();
    await c.salir(nav, '#/c/Carnes');
    await c.salir(nav, '#/c/Carnes');
    c.entrarDesdeLectura(); c.olvidarLectura();
    await c.salir(nav, '#/c/Carnes');
    c.entrarDesdeLectura();
    await c.volverALectura(nav, '#/r/f1');
    await c.salir(nav, '#/c/Carnes');
    expect(nav.pedidos).toEqual([
      'reemplazar #/c/Carnes', 'volver #/c/Carnes 2', 'reemplazar #/c/Carnes', 'reemplazar #/c/Carnes',
      'volver #/r/f1 1', 'reemplazar #/c/Carnes'
    ]);
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
