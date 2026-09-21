// El recuadro de carga de una foto de Drive es CSS puro: ningún otro test lo
// toca, y que tape o no la foto de la categoría sólo se ve en pantalla.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('el recuadro de una foto de Drive que todavía no llegó', () => {
  it('adentro del placeholder es transparente: abajo está la foto de la categoría', () => {
    expect(TOKENS).toMatch(/\.ph img\[data-drive\]:not\(\[src\]\)\s*\{[^}]*background:\s*transparent/);
  });

  it('afuera sigue siendo un recuadro del tamaño que va a tener', () => {
    const regla = TOKENS.match(/^img\[data-drive\]:not\(\[src\]\)\s*\{([^}]*)\}/m)?.[1] ?? '';
    expect(regla).toContain('aspect-ratio');
    expect(regla).toContain('background: var(--surface)');
  });
});
