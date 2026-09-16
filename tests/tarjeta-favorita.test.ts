// La reserva de espacio para la estrella de favorito (P27 §4) es CSS puro:
// sin ella, no hay forma de ver desde un test si el título de una tarjeta
// común perdió ancho por algo que no lleva.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('la reserva de espacio para la estrella de la tarjeta', () => {
  it('sólo se aplica a las tarjetas favoritas, no a todas', () => {
    expect(TOKENS).toContain('.tarjeta:has(.fav-esq) .txt { padding-right: 22px; }');
    // La regla sin acotar le sacaba ancho al título de cualquier tarjeta.
    expect(TOKENS).not.toContain('.tarjeta .txt { padding-right: 22px; }');
  });
});
