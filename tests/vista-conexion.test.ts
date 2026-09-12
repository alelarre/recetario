import { describe, it, expect } from 'vitest';
import { renderConexion } from '../src/ui/conexion.js';

describe('Conexión', () => {
  it('la primera pantalla explica antes de pedir', () => {
    const html = renderConexion({ estado: 'inicial' });
    expect(html).toMatch(/tu Google Drive/i);
    expect(html).toContain('Conectar con Google');
  });

  it('cancelado: lo dice y muestra el botón otra vez, nunca queda en Conectando', () => {
    const html = renderConexion({ estado: 'cancelado' });
    expect(html).toContain('Conectar con Google');
    expect(html).not.toContain('Conectando…');
  });

  it('denegado explica que sin Drive no hay app', () => {
    expect(renderConexion({ estado: 'denegado' })).toMatch(/sin acceso a Drive/i);
  });

  it('creando el índice, antes de saber cuántos son: spinner y ningún cero', () => {
    const html = renderConexion({ estado: 'creando-indice', progreso: { leidas: 0, total: 0 } });
    expect(html).toContain('Creando el índice…');
    expect(html).toContain('class="spin"');
    expect(html).not.toContain('0 de 0');
  });

  it('creando el índice: número y no spinner', () => {
    const html = renderConexion({ estado: 'creando-indice', progreso: { leidas: 128, total: 1012 } });
    expect(html).toContain('128');
    expect(html).toContain('1012');
    expect(html).not.toContain('class="spin"');
  });
});
