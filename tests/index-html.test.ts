// El HTML no lo cubre ningún otro test: `#velo-escritura` es el único lugar
// donde vive el SVG del libro que se escribe, y perderlo no lo nota nada más
// que el teléfono. La animación en sí se prueba ahí, no acá.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

/** El bloque de `#velo-escritura`, hasta el `<script>` que le sigue en el body. */
function veloEscritura(): string {
  const inicio = html.indexOf('id="velo-escritura"');
  const fin = html.indexOf('<script', inicio);
  return html.slice(inicio, fin);
}

describe('el velo de escritura en index.html', () => {
  it('ya no lleva el spinner', () => {
    expect(veloEscritura()).not.toContain('spin');
  });

  it('lleva un SVG en línea, decorativo', () => {
    const bloque = veloEscritura();
    expect(bloque).toContain('<svg');
    expect(bloque).toContain('aria-hidden="true"');
  });

  it('el libro tiene el renglón que se escribe y el lápiz que lo recorre', () => {
    const bloque = veloEscritura();
    expect(bloque).toContain('renglon');
    expect(bloque).toContain('lapiz');
  });
});
