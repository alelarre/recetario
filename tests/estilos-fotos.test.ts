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

describe('el botón que pone una foto en la línea del cursor', () => {
  it('tiene un pico hacia la izquierda: señala la línea a la que va la foto', () => {
    expect(TOKENS).toMatch(/\.poner-foto::before\s*\{[^}]*border-right-color:\s*var\(--borde-fuerte\)/);
    expect(TOKENS).toMatch(/\.poner-foto::after\s*\{[^}]*border-right-color:\s*var\(--surface\)/);
  });

  it('el relleno del pico acompaña al botón apretado', () => {
    expect(TOKENS).toMatch(/\.poner-foto:active::after\s*\{[^}]*border-right-color:\s*var\(--surface-alta\)/);
  });
});

describe('la foto de la muestra de una categoría, que es un cuadro de foto adentro del tile', () => {
  it('no toma el radio del cuadro de foto: la recorta el tile', () => {
    expect(TOKENS).toMatch(/\.tile \.im\.cuadro-foto\s*\{[^}]*border-radius:\s*0/);
  });

  it('el aviso de foto ausente queda arriba del tinte del tile, sobre su propio fondo', () => {
    const regla = TOKENS.match(/\.tile \.im \.miniatura-vacia\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regla).toMatch(/position:\s*relative/);
    expect(regla).toMatch(/z-index:\s*1/);
    expect(regla).toMatch(/background:\s*var\(--surface-alta\)/);
  });
});

describe('la ayuda de la ficha Fotos', () => {
  it('es prosa: va en chico, no en micro', () => {
    const regla = TOKENS.match(/^\.fotos-ayuda\s*\{([^}]*)\}/m)?.[1] ?? '';
    expect(regla).toContain('font-size: var(--txt-chico)');
  });
});
