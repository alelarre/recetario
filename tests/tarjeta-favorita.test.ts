// La reserva de espacio para las marcas de la esquina (P27 §6.1) es CSS puro:
// sin ella, no hay forma de ver desde un test si el título de una tarjeta
// perdió ancho por algo que no lleva.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('la reserva de espacio para las marcas de la tarjeta', () => {
  it('crece con --marcas y no le saca ancho a una tarjeta sin marcas', () => {
    expect(TOKENS).toContain('.tarjeta .txt { padding-right: calc(var(--marcas, 0) * 20px); }');
    // La regla vieja reservaba un ancho fijo sólo para la estrella.
    expect(TOKENS).not.toContain('padding-right: 22px');
  });

  it('la esquina junta las marcas en una fila propia', () => {
    expect(TOKENS).toContain('.marcas-esq { position: absolute; top: 6px; right: 8px; display: flex; gap: 4px; line-height: 0; }');
  });
});
