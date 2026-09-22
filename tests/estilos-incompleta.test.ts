// El CSS de la marca de incompleta no lo cubre ningún otro test: fuera del
// chip —el único lugar donde antes era un ítem flex— se veía cortada.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('la marca de incompleta (.inc)', () => {
  it('tiene su tamaño propio: no depende de ser un ítem flex', () => {
    const regla = TOKENS.match(/\.inc\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(regla).toContain('display: inline-block');
    expect(regla).toContain('width: 12px');
    expect(regla).toContain('height: 12px');
  });
});
