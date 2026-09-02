import { describe, it, expect } from 'vitest';
import { parsearHash } from '../src/ui/router.js';

describe('parsearHash', () => {
  it('la raíz es el home', () => {
    expect(parsearHash('#/')).toEqual({ vista: 'home', params: {} });
    expect(parsearHash('')).toEqual({ vista: 'home', params: {} });
  });

  it('categoría con el nombre decodificado', () => {
    expect(parsearHash('#/c/Panes%20y%20masas')).toEqual({ vista: 'categoria', params: { nombre: 'Panes y masas' } });
  });

  it('búsqueda con su query', () => {
    expect(parsearHash('#/buscar?q=milanesas')).toEqual({ vista: 'buscar', params: { q: 'milanesas' } });
  });

  it('detalle y edición de una receta', () => {
    expect(parsearHash('#/r/abc123')).toEqual({ vista: 'detalle', params: { id: 'abc123' } });
    expect(parsearHash('#/r/abc123/editar')).toEqual({ vista: 'editar', params: { id: 'abc123' } });
  });

  it('alta de receta', () => {
    expect(parsearHash('#/nueva')).toEqual({ vista: 'nueva', params: {} });
  });

  it('una ruta desconocida cae en el home en vez de romper', () => {
    expect(parsearHash('#/cualquiera/cosa')).toEqual({ vista: 'home', params: {} });
  });

  describe('defensa de parámetros', () => {
    it('null, undefined, NaN y objetos devuelven el home', () => {
      expect(parsearHash(null)).toEqual({ vista: 'home', params: {} });
      expect(parsearHash(undefined)).toEqual({ vista: 'home', params: {} });
      expect(parsearHash(42)).toEqual({ vista: 'home', params: {} });
      expect(parsearHash({})).toEqual({ vista: 'home', params: {} });
    });

    it('URL rota con escape inválido no rompe la app', () => {
      // decodeURIComponent lanza con %E0%A4%A, así que tenemos que manejarlo
      expect(parsearHash('#/c/%E0%A4%A')).toEqual({ vista: 'home', params: {} });
    });

    it('búsqueda sin query devuelve q vacío', () => {
      expect(parsearHash('#/buscar')).toEqual({ vista: 'buscar', params: { q: '' } });
    });

    it('detalle sin ID no es detalle', () => {
      expect(parsearHash('#/r')).toEqual({ vista: 'home', params: {} });
      expect(parsearHash('#/r/')).toEqual({ vista: 'home', params: {} });
    });

    it('categoría sin nombre no es categoría', () => {
      expect(parsearHash('#/c')).toEqual({ vista: 'home', params: {} });
      expect(parsearHash('#/c/')).toEqual({ vista: 'home', params: {} });
    });
  });
});
