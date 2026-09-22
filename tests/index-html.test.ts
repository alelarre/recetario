// El HTML no lo cubre ningún otro test: `#velo-escritura` es el único lugar
// donde vive el SVG de la olla que se revuelve, y perderlo no lo nota nada más
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

  it('el SVG es decorativo: aria-hidden va en la propia etiqueta <svg>', () => {
    const etiqueta = veloEscritura().match(/<svg[^>]*>/)?.[0] ?? '';
    expect(etiqueta).toContain('aria-hidden="true"');
  });

  it('tiene la olla, el vapor, la cuchara con su parte redonda y la tapa', () => {
    const bloque = veloEscritura();
    expect(bloque).toContain('olla');
    expect(bloque).toContain('vapor');
    expect(bloque).toContain('cuchara');
    // La parte redonda de la cuchara: el óvalo que se hunde en la olla.
    expect(bloque).toContain('<ellipse');
    expect(bloque).toContain('tapa');
  });

  it('tiene el tilde del cierre, y ya no el libro que se escribía', () => {
    const bloque = veloEscritura();
    expect(bloque).toContain('tilde');
    expect(bloque).not.toContain('libro');
    expect(bloque).not.toContain('lapiz');
  });
});
