import { describe, it, expect } from 'vitest';
import { crearNavegacion } from '../src/navegacion.js';
import { historialFalso } from './dom-falso.js';

/** Deja llegar los `hashchange` encolados. */
const esperar = async () => { for (let i = 0; i < 3; i++) await Promise.resolve(); };

/**
 * El módulo sobre un historial falso. Cada `hashchange` numera, como hace
 * la app; `llegadas` es lo que devolvió cada vez.
 */
function montar(hash = '#/') {
  const llegadas: string[] = [];
  let nav: ReturnType<typeof crearNavegacion> | null = null;
  const h = historialFalso({ hash, alCambiarHash: () => { if (nav) llegadas.push(nav.numerar()); } });
  nav = crearNavegacion({ location: h.location, history: h.history });
  nav.arrancar();
  return { nav, llegadas, ...h };
}

const profundidad = (state: unknown): unknown => (state as { profundidad?: unknown } | null)?.profundidad;

describe('la navegación', () => {
  it('al arrancar, la entrada actual queda con profundidad 0 y no hay atrás', () => {
    const { nav, history } = montar();
    expect(profundidad(history.state)).toBe(0);
    expect(nav.hayAtras()).toBe(false);
  });

  it('arrancar con una URL la pone en lugar de la actual', () => {
    const { nav, location, history } = montar('');
    nav.arrancar('/recetario/#/nueva?text=hola');
    expect(location.hash).toBe('#/nueva?text=hola');
    expect(profundidad(history.state)).toBe(0);
  });

  it('ir agrega una entrada con la profundidad de la anterior más uno', async () => {
    const { nav, location, history, pila, llegadas } = montar();
    nav.ir('#/c/Carnes');
    nav.ir('#/r/f1');
    await esperar();
    expect(location.hash).toBe('#/r/f1');
    expect(pila().map(e => profundidad(e.state))).toEqual([0, 1, 2]);
    expect(profundidad(history.state)).toBe(2);
    // Las dos llegan ya numeradas: el `hashchange` no las cuenta de nuevo.
    expect(llegadas).toEqual(['conocida', 'conocida']);
    expect(nav.hayAtras(2)).toBe(true);
  });

  it('ir al hash en el que ya se está no agrega nada', async () => {
    const { nav, pila } = montar();
    nav.ir('#/');
    await esperar();
    expect(pila()).toHaveLength(1);
    expect(nav.hayAtras()).toBe(false);
  });

  it('reemplazar conserva la profundidad', async () => {
    const { nav, location, history, pila, reemplazos } = montar();
    nav.ir('#/plan/agregar?dia=1&momento=noche');
    nav.reemplazar('#/plan');
    await esperar();
    expect(reemplazos).toEqual(['#/plan']);
    expect(location.hash).toBe('#/plan');
    expect(pila().map(e => e.hash)).toEqual(['#/', '#/plan']);
    expect(profundidad(history.state)).toBe(1);
  });

  it('numerar le pone a una entrada sin state la profundidad de la anterior más uno', async () => {
    const { nav, location, history, llegadas } = montar();
    nav.ir('#/c/Carnes');
    await esperar();
    // Un `<a href>`: el navegador agrega la entrada sin `state`.
    location.hash = '#/r/f1';
    await esperar();
    expect(llegadas.at(-1)).toBe('nueva');
    expect(profundidad(history.state)).toBe(2);
    expect(nav.hayAtras(2)).toBe(true);
  });

  it('volver a una entrada anterior recupera su profundidad', async () => {
    const { nav, atras, llegadas } = montar();
    nav.ir('#/c/Carnes');
    nav.ir('#/r/f1');
    await esperar();
    atras();
    await esperar();
    expect(llegadas.at(-1)).toBe('conocida');
    expect(nav.hayAtras(1)).toBe(true);
    expect(nav.hayAtras(2)).toBe(false);
  });

  it('hayAtras(1) y hayAtras(2)', async () => {
    const { nav } = montar();
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([false, false]);
    nav.ir('#/c/Carnes');
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([true, false]);
    nav.ir('#/r/f1');
    expect([nav.hayAtras(1), nav.hayAtras(2)]).toEqual([true, true]);
    await esperar();
  });

  it('volver hace back si hay atrás', async () => {
    const { nav, location, vueltasAtras, reemplazos } = montar();
    nav.ir('#/c/Carnes');
    await esperar();
    nav.volver('#/');
    await esperar();
    expect(vueltasAtras).toHaveLength(1);
    expect(reemplazos).toEqual([]);
    expect(location.hash).toBe('#/');
  });

  it('volver sin atrás reemplaza por el respaldo', async () => {
    const { nav, location, vueltasAtras, reemplazos, pila } = montar('#/r/f1/cocinar');
    nav.volver('#/r/f1');
    await esperar();
    expect(vueltasAtras).toEqual([]);
    expect(reemplazos).toEqual(['#/r/f1']);
    expect(location.hash).toBe('#/r/f1');
    expect(pila()).toHaveLength(1);
  });

  it('volver con n = 2 retrocede dos entradas', async () => {
    const { nav, location, saltos } = montar();
    nav.ir('#/r/f1');
    nav.ir('#/r/f1/editar');
    await esperar();
    nav.volver('#/', 2);
    await esperar();
    expect(saltos).toEqual([-2]);
    expect(location.hash).toBe('#/');
    expect(nav.hayAtras()).toBe(false);
  });

  it('con una sola entrada atrás, volver con n = 2 reemplaza', async () => {
    const { nav, saltos, reemplazos } = montar('#/r/f1');
    nav.ir('#/r/f1/editar');
    await esperar();
    nav.volver('#/', 2);
    expect(saltos).toEqual([]);
    expect(reemplazos).toEqual(['#/']);
  });

  it('una entrada de profundidad 0 no vuelve, aunque el navegador tenga entradas atrás', async () => {
    // Lo de antes de abrir la app —otro sitio, o la entrada del Share
    // Target— está en el historial del navegador, pero no es una pantalla de
    // la app: volver ahí sería salirse.
    const { nav, history, vueltasAtras, reemplazos } = montar();
    history.pushState(null, '', '#/nueva?text=hola');
    nav.arrancar();
    nav.volver('#/');
    expect(vueltasAtras).toEqual([]);
    expect(reemplazos).toEqual(['#/']);
  });

  it('deshacer vuelve atrás, y ese hashchange llega como deshecho', async () => {
    const { nav, location, pila, llegadas } = montar();
    nav.ir('#/nueva');
    await esperar();
    const antes = pila();
    location.hash = '#/plan';
    await esperar();
    expect(llegadas.at(-1)).toBe('nueva');
    nav.deshacer();
    await esperar();
    expect(llegadas.at(-1)).toBe('deshecha');
    expect(pila()).toEqual(antes);
    expect(nav.hayAtras(1)).toBe(true);
    expect(nav.hayAtras(2)).toBe(false);
  });

  it('restaurar vuelve a poner una pantalla sin avisar', async () => {
    const { nav, atras, pila, empujados, llegadas } = montar();
    nav.ir('#/r/f1/editar');
    await esperar();
    atras();
    await esperar();
    const cuantas = llegadas.length;
    nav.restaurar('#/r/f1/editar');
    await esperar();
    expect(empujados).toEqual(['#/r/f1/editar']);
    expect(llegadas).toHaveLength(cuantas);
    expect(pila().map(e => [e.hash, profundidad(e.state)])).toEqual([['#/', 0], ['#/r/f1/editar', 1]]);
    expect(nav.hayAtras()).toBe(true);
  });
});

