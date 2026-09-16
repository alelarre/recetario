// Las flechas y el degradé del carrusel de tags se atan al scroll con CSS
// puro (`animation-timeline`, P27 §5.2): sin scroll de verdad en el DOM
// mínimo de los tests, lo único que se puede verificar es que las reglas
// sigan ahí y atadas a la misma timeline que el degradé (mismo mecanismo que
// `tests/estilos-toque.test.ts` usa para lo que sólo se ve en el teléfono).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');
const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('el trazo de los íconos de chip: 1.5 en todos lados, no sólo en el carrusel', () => {
  it('vive en tokens.css, no acotado al carrusel', () => {
    expect(TOKENS).toContain('.chip svg { stroke-width: 1.5; }');
  });

  it('base.css no repite la regla ni el tamaño, que ya pone tokens.css', () => {
    expect(BASE).not.toContain('.chip svg');
  });
});

describe('el carrusel de tags: las flechas siguen la timeline del degradé', () => {
  it('la izquierda arranca oculta, como el degradé izquierdo', () => {
    expect(BASE).toContain('.carrusel-flecha.izq { visibility: hidden;');
  });

  it('las dos flechas usan la timeline `--tags` con los mismos rangos que el degradé', () => {
    const soporte = BASE.slice(
      BASE.indexOf('@supports (animation-timeline: scroll())'), BASE.indexOf('@keyframes aparecer')
    );
    expect(soporte).toContain('.carrusel-flecha.izq');
    expect(soporte).toContain('.carrusel-flecha.der');
    expect((soporte.match(/animation-timeline: --tags/g) ?? []).length).toBe(4);  // dos degradés + dos flechas
    expect((soporte.match(/animation-range: 0 40px/g) ?? []).length).toBe(2);     // el degradé y la flecha, izquierda
    expect((soporte.match(/animation-range: calc\(100% - 40px\) 100%/g) ?? []).length).toBe(2);  // ídem, derecha
  });

  it('la flecha derecha desaparece al final y la izquierda aparece al correrse', () => {
    expect(BASE).toContain('@keyframes aparecer-flecha { to { visibility: visible; } }');
    expect(BASE).toContain('@keyframes desaparecer-flecha { to { visibility: hidden; } }');
  });

  it('el trazo de la flecha es 1.5, como el resto de los íconos', () => {
    expect(BASE).toContain('.carrusel-flecha svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.5;');
  });
});
