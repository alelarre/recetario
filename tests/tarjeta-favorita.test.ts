// La reserva de espacio para las marcas de la esquina (P27 §6.1) es CSS puro:
// sin ella, no hay forma de ver desde un test si el título de una tarjeta
// perdió ancho por algo que no lleva.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { tarjeta } from '../src/ui/componentes.js';
import { entradaFalsa } from './dobles.js';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');
const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

describe('la reserva de espacio para las marcas de la tarjeta', () => {
  it('crece con --marcas y no le saca ancho a una tarjeta sin marcas', () => {
    expect(TOKENS).toContain('.tarjeta .txt { padding-right: calc(var(--marcas, 0) * 20px); }');
    // La regla vieja reservaba un ancho fijo sólo para la estrella.
    expect(TOKENS).not.toContain('padding-right: 22px');
  });

  it('la esquina junta las marcas en una fila propia', () => {
    expect(TOKENS).toContain('.marcas-esq { position: absolute; top: 6px; right: 8px; display: flex; gap: 4px; line-height: 0; }');
  });

  it('el relleno de la estrella cuelga de una clase, no del texto accesible', () => {
    expect(TOKENS).toContain('.marca.favorita svg');
    expect(TOKENS).not.toContain('.marca[aria-label="Favorita"]');
  });

  it('esa clase no es `fav`: la usa la estrella del encabezado, que recorta su segundo svg', () => {
    // Con `fav`, `.fav svg:last-child { clip-path: inset(0 100% 0 0) }` de
    // base.css dejaba la estrella de la tarjeta recortada a cero.
    expect(BASE).toContain('.fav svg:last-child');
    expect(tarjeta(entradaFalsa({ tags: ['favorito'] }))).not.toMatch(/class="[^"]*\bfav\b/);
  });
});
