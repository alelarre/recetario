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
});

describe('Conexión: la carga', () => {
  it('Conectando… lleva el spinner', () => {
    const html = renderConexion({ estado: 'conectando' });
    expect(html).toContain('Conectando…');
    expect(html).toContain('class="spin"');
  });
});
