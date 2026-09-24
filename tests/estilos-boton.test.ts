// Hay botones de la app que son enlaces y no `<button>` —«Categorías ›» en
// Ajustes y «+ Nueva» en la lista de categorías—, así que el navegador los subraya salvo que `.btn` lo apague. Se
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
