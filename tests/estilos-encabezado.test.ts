// Todos los encabezados quedan fijos arriba al bajar: el de todas las
// pantallas, el del modo cocina y la caja de los resultados. Es sólo CSS, y
// se ve sólo haciendo scroll en el teléfono: sin este test la regla se pierde
// en silencio.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');
const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

/** El cuerpo de la primera regla con ese selector exacto, al principio de una línea. */
const regla = (css: string, selector: string): string => {
  const escapado = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`^${escapado} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';
};

const zIndex = (css: string, selector: string): number =>
  Number(regla(css, selector).match(/z-index: (\d+)/)?.[1] ?? NaN);

describe('los encabezados fijos', () => {
  it.each([
    ['el de todas las pantallas', TOKENS, '.enc'],
    ['el del modo cocina', BASE, '.encoc'],
    ['la caja de los resultados', BASE, '.cajaenc']
  ])('%s queda pegado arriba, con fondo propio', (_caso, css, selector) => {
    const r = regla(css, selector);
    expect(r).toContain('position: sticky');
    expect(r).toContain('top: 0');
    expect(r).toMatch(/background: var\(--(bg|surface)\)/);
    expect(zIndex(css, selector)).toBe(3);
  });

  it('el conmutador de cocina se apila debajo del encabezado, no encima', () => {
    expect(regla(BASE, '.conm')).toContain('top: 64px');
    expect(regla(BASE, '.encoc')).toContain('height: 64px');
  });

  it('el menú lateral, su velo, las fichas al pie y el visor quedan por encima', () => {
    for (const [css, selector] of [
      [BASE, '.lat'], [BASE, '.velo-lat'], [BASE, '.velo'], [BASE, '.hoja-compartir'],
      [TOKENS, '.hoja-foto'], [TOKENS, '.visor']
    ] as const) {
      expect(zIndex(css, selector), selector).toBeGreaterThan(zIndex(TOKENS, '.enc'));
    }
  });

  it('el título largo se recorta en una línea en cualquier encabezado', () => {
    expect(regla(TOKENS, '.enc .tit')).toContain('text-overflow: ellipsis');
  });
});
