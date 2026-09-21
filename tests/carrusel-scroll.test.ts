// Las flechas y el degradé del carrusel se atan al scroll con CSS puro
// (`animation-timeline`): sin scroll de verdad en el DOM mínimo de los tests,
// lo único que se puede verificar es que las reglas sigan ahí y atadas a la
// misma timeline que el degradé (mismo mecanismo que `tests/estilos-toque.test.ts`
// usa para lo que sólo se ve en el teléfono).
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

describe('el carrusel es un componente del sistema: su CSS vive en tokens.css', () => {
  it('el marco, la pista y las flechas están en tokens.css y no en base.css', () => {
    expect(TOKENS).toContain('.carrusel-marco {');
    expect(TOKENS).toContain('.carrusel-flecha {');
    expect(BASE).not.toContain('.carrusel');
  });

  it('el degradé va al fondo de atrás del carrusel, que cada uno define', () => {
    expect(TOKENS).toContain('--carrusel-fondo: var(--bg);');
    expect(TOKENS).toContain('linear-gradient(to right, transparent, var(--carrusel-fondo))');
    // El de fotos vive adentro de una ficha, no sobre el fondo de la pantalla.
    expect(TOKENS).toContain('.carrusel-fotos { --carrusel-fondo: var(--surface);');
  });
});

describe('el carrusel: las flechas siguen la timeline del degradé', () => {
  it('la izquierda arranca oculta, como el degradé izquierdo', () => {
    expect(TOKENS).toContain('.carrusel-flecha.izq { visibility: hidden;');
  });

  it('las dos flechas usan la timeline `--carrusel` con los mismos rangos que el degradé', () => {
    const soporte = TOKENS.slice(
      TOKENS.indexOf('@supports (animation-timeline: scroll())'), TOKENS.indexOf('@keyframes aparecer')
    );
    expect(soporte).toContain('.carrusel-flecha.izq');
    expect(soporte).toContain('.carrusel-flecha.der');
    expect((soporte.match(/animation-timeline: --carrusel/g) ?? []).length).toBe(4);  // dos degradés + dos flechas
    expect((soporte.match(/animation-range: 0 40px/g) ?? []).length).toBe(2);     // el degradé y la flecha, izquierda
    expect((soporte.match(/animation-range: calc\(100% - 40px\) 100%/g) ?? []).length).toBe(2);  // ídem, derecha
  });

  it('la flecha derecha desaparece al final y la izquierda aparece al correrse', () => {
    expect(TOKENS).toContain('@keyframes aparecer-flecha { to { visibility: visible; } }');
    expect(TOKENS).toContain('@keyframes desaparecer-flecha { from { visibility: visible; } to { visibility: hidden; } }');
  });

  it('sin desborde no hay nada que correr: el lado derecho arranca oculto, como el izquierdo', () => {
    // Si el carrusel no desborda, la timeline de scroll queda inactiva y la
    // animación no se aplica: lo que se ve es el valor base. Por eso el
    // degradé y la flecha de la derecha tienen que estar ocultos de base, y la
    // animación es la que los muestra mientras quede algo por ver.
    const soporte = TOKENS.slice(
      TOKENS.indexOf('@supports (animation-timeline: scroll())'), TOKENS.indexOf('@keyframes aparecer')
    );
    expect(soporte).toContain('.carrusel-marco::after { opacity: 0;');
    expect(soporte).toContain('.carrusel-flecha.der { visibility: hidden;');
    expect(TOKENS).toContain('@keyframes desaparecer { from { opacity: 1; } to { opacity: 0; } }');
  });

  it('el trazo de la flecha es 1.5, como el resto de los íconos', () => {
    expect(TOKENS).toContain('.carrusel-flecha svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.5;');
  });
});
