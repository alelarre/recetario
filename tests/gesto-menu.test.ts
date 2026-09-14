import { describe, it, expect } from 'vitest';
import { puedeEmpezar, direccion, progreso, seAbre, ANCHO_MENU, MARGEN_BORDE } from '../src/ui/gesto-menu.js';

describe('el gesto del menú lateral', () => {
  it('cerrado, no empieza pegado al borde: ese deslizamiento es el «atrás» de Android', () => {
    expect(puedeEmpezar(MARGEN_BORDE - 1, false)).toBe(false);
    expect(puedeEmpezar(MARGEN_BORDE, false)).toBe(true);
    expect(puedeEmpezar(200, false)).toBe(true);
  });

  it('abierto, empieza en cualquier lado', () => {
    expect(puedeEmpezar(0, true)).toBe(true);
  });

  it('no decide hasta que el dedo se mueve lo suficiente', () => {
    expect(direccion(4, 3)).toBe('indeciso');
  });

  it('un movimiento claramente horizontal es gesto; uno vertical o en diagonal, desplazamiento', () => {
    expect(direccion(30, 5)).toBe('horizontal');
    expect(direccion(-30, 5)).toBe('horizontal');
    expect(direccion(5, 30)).toBe('vertical');
    expect(direccion(20, 18)).toBe('vertical');
  });

  it('cerrado, el progreso crece al ir a la derecha y no pasa de 1', () => {
    expect(progreso(0, false)).toBe(0);
    expect(progreso(ANCHO_MENU / 2, false)).toBe(0.5);
    expect(progreso(ANCHO_MENU * 2, false)).toBe(1);
    expect(progreso(-50, false)).toBe(0);
  });

  it('abierto, el progreso baja al ir a la izquierda', () => {
    expect(progreso(0, true)).toBe(1);
    expect(progreso(-ANCHO_MENU / 2, true)).toBe(0.5);
    expect(progreso(-ANCHO_MENU * 2, true)).toBe(0);
    expect(progreso(50, true)).toBe(1);
  });

  it('queda abierto si pasó la mitad', () => {
    expect(seAbre(0.6)).toBe(true);
    expect(seAbre(0.4)).toBe(false);
  });
});
