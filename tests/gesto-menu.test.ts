import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  puedeEmpezar, direccion, progreso, seAbre, sobreFilaDeslizable, ANCHO_MENU, ANCHO_MENU_FIJO, MARGEN_BORDE
} from '../src/ui/gesto-menu.js';

describe('el gesto del menú lateral', () => {
  it('cerrado, no empieza pegado al borde: ese deslizamiento es el «atrás» de Android', () => {
    expect(puedeEmpezar(MARGEN_BORDE - 1, false, false)).toBe(false);
    expect(puedeEmpezar(MARGEN_BORDE, false, false)).toBe(true);
    expect(puedeEmpezar(200, false, false)).toBe(true);
  });

  it('abierto, empieza en cualquier lado', () => {
    expect(puedeEmpezar(0, true, false)).toBe(true);
  });

  it('cerrado, no empieza sobre una fila que se desplaza de costado: el dedo es de la fila', () => {
    expect(puedeEmpezar(200, false, true)).toBe(false);
    expect(puedeEmpezar(200, true, true)).toBe(true);
  });

  describe('sobre una fila deslizable', () => {
    /** Lo tocado: adentro de una fila que mide `ancho` y tiene `contenido` para correr, si hay fila. */
    const tocado = (fila: { ancho: number; contenido: number } | null, selectores: string[] = []): Element =>
      ({
        closest: (sel: string) => {
          selectores.push(sel);
          return fila && sel === '[data-deslizable]' ? { clientWidth: fila.ancho, scrollWidth: fila.contenido } : null;
        }
      }) as unknown as Element;

    it('cualquier [data-deslizable] que desborda cuenta, sin una lista de clases', () => {
      const selectores: string[] = [];
      expect(sobreFilaDeslizable(tocado({ ancho: 300, contenido: 600 }, selectores))).toBe(true);
      expect(selectores).toEqual(['[data-deslizable]']);
    });

    it('una fila que entra entera no cuenta: no hay nada que correr', () => {
      expect(sobreFilaDeslizable(tocado({ ancho: 300, contenido: 300 }))).toBe(false);
    });

    it('fuera de una fila, o sin destino, no cuenta', () => {
      expect(sobreFilaDeslizable(tocado(null))).toBe(false);
      expect(sobreFilaDeslizable(null)).toBe(false);
    });
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

describe('los anchos del menú son los mismos en TS y en el CSS', () => {
  const css = readFileSync('src/ui/base.css', 'utf8');
  /** Los bloques `@media (min-width: …)` con ese ancho, enteros. */
  const bloquesDesde = (ancho: number): string[] => {
    const bloques: string[] = [];
    const inicio = `@media (min-width: ${ancho}px) {`;
    for (let i = css.indexOf(inicio); i >= 0; i = css.indexOf(inicio, i + 1)) {
      let nivel = 0;
      for (let j = i + inicio.length - 1; j < css.length; j++) {
        if (css[j] === '{') nivel++;
        else if (css[j] === '}' && --nivel === 0) { bloques.push(css.slice(i, j + 1)); break; }
      }
    }
    return bloques;
  };

  it('el lateral mide ANCHO_MENU', () => {
    expect(css).toMatch(new RegExp(`\\.lat \\{[^}]*width: ${ANCHO_MENU}px`));
  });

  it(`desde ANCHO_MENU_FIJO el lateral queda fijo y el contenido se corre ANCHO_MENU`, () => {
    const fijo = bloquesDesde(ANCHO_MENU_FIJO).join('\n');
    expect(fijo).toContain('.lat { transform: none; }');
    expect(fijo).toContain(`.conten { padding-left: ${ANCHO_MENU}px; }`);
  });

  it('el velo y la traba del scroll son de la pantalla angosta: por debajo de ANCHO_MENU_FIJO', () => {
    expect(css).toContain(`@media (width < ${ANCHO_MENU_FIJO}px) {`);
    // Ningún otro corte del menú: si cambia uno, cambian todos.
    const cortes = [...css.matchAll(/@media \((?:min-width: |width < )(\d+)px\)/g)].map(m => Number(m[1]));
    expect(new Set(cortes)).toEqual(new Set([ANCHO_MENU_FIJO]));
  });
});
