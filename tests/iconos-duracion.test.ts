import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ICONO_DE_DURACION } from '../src/ui/iconos.js';
import { DURACIONES } from '../src/catalogo.js';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('los relojitos de duración', () => {
  it('hay uno por valor, y todos son distintos', () => {
    const iconos = DURACIONES.map(d => ICONO_DE_DURACION[d]);
    expect(iconos.every(i => i.startsWith('<svg viewBox="0 0 24 24">'))).toBe(true);
    expect(new Set(iconos).size).toBe(5);
  });

  it('>1 día son dos relojes: dos marcas de las 12', () => {
    expect(ICONO_DE_DURACION['>1 día'].match(/v1\.33"/g)).toHaveLength(2);
  });

  it('>60 min termina en flecha: el aro de afuera tiene trazo 1.6', () => {
    expect(ICONO_DE_DURACION['>60 min']).toContain('stroke-width="1.6"');
  });

  it('el disco que corta el reloj de atrás toma el fondo de donde esté', () => {
    expect(ICONO_DE_DURACION['>1 día']).toContain('style="fill:var(--fondo-reloj)"');
    expect(TOKENS).toContain('--fondo-reloj:');
  });
});
