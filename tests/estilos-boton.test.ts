// Tres botones de la app son enlaces y no `<button>` —«Categorías ›» en
// Ajustes, «+ Nueva» en la lista de categorías y «Ir a la fuente» en un
// borrador—, así que el navegador los subraya salvo que `.btn` lo apague. Se
// ve sólo mirando la pantalla: sin este test la regla se pierde en silencio.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('el botón', () => {
  it('no se subraya, aunque sea un <a>', () => {
    const regla = TOKENS.match(/^\.btn \{([^}]*)\}/m)?.[1] ?? '';
    expect(regla).toContain('text-decoration: none');
  });
});
