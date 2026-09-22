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

  // Una sola barra de punta a punta: nunca un spinner mudo, que es lo que
  // parecía colgado con una carpeta recién creada (P76).
  it('creando el índice, recién arrancando: la barra en cero y no un spinner', () => {
    const html = renderConexion({ estado: 'creando-indice', progreso: 0 });
    expect(html).toContain('Creando el índice');
    expect(html).toContain('class="barra"');
    expect(html).not.toContain('class="spin"');
  });

  it('creando el índice: el porcentaje y la barra', () => {
    const html = renderConexion({ estado: 'creando-indice', progreso: 0.47 });
    expect(html).toContain('47%');
    expect(html).toContain('width:47%');
    expect(html).not.toContain('class="spin"');
  });
});

describe('Conexión: la carga', () => {
  it('Conectando… lleva el spinner', () => {
    const html = renderConexion({ estado: 'conectando' });
    expect(html).toContain('Conectando…');
    expect(html).toContain('class="spin"');
  });
});
