// La línea de contexto de la receta: el punto de la categoría y el texto.
// Con `flex-wrap: wrap`, en una pantalla angosta el texto no entraba al lado
// del punto y se iba entero al renglón siguiente, dejando el punto solo.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');
const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('la línea de contexto de la receta (.rec-ctx)', () => {
  it('no envuelve: el texto encoge y corta adentro, al lado del punto', () => {
    const regla = BASE.match(/\.rec-ctx\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regla).toContain('display: flex');
    expect(regla).not.toContain('flex-wrap');
    // Encoger necesita las dos cosas: el permiso del ítem y el punto que no cede.
    expect(TOKENS).toContain('.ctx-txt { min-width: 0; }');
    expect(TOKENS.match(/\.pin\s*\{([^}]*)\}/)?.[1] ?? '').toContain('flex: 0 0 8px');
  });

  it('el punto se alinea con el primer renglón, no con el medio del bloque', () => {
    const regla = BASE.match(/\.rec-ctx\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regla).toContain('align-items: flex-start');
    expect(BASE).toContain('.rec-ctx .pin { margin-top: 6px; }');
  });
});
