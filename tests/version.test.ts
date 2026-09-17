import { describe, it, expect } from 'vitest';
import { textoVersion, COMMIT } from '../src/version.js';
import { lateral } from '../src/ui/componentes.js';

describe('la versión visible', () => {
  it('es el commit corto y cuándo se compiló, en la hora del teléfono', () => {
    const compilado = new Date(2026, 8, 13, 14, 30).toISOString();
    expect(textoVersion('8648476', compilado)).toBe('8648476 · 13/09 14:30');
  });

  it('sin fecha de compilación queda sólo el commit', () => {
    expect(textoVersion('dev', '')).toBe('dev');
  });

  it('Vite inyecta un commit al compilar, también para los tests', () => {
    expect(COMMIT).toMatch(/^([0-9a-f]{7}|dev)$/);
  });

  it('el menú lateral la dibuja al pie', () => {
    const html = lateral({ activo: 'recetario', borradores: 0 });
    expect(html).toContain(`<div class="version">${textoVersion()}</div></nav>`);
  });
});
