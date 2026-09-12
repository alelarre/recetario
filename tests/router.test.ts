import { describe, it, expect } from 'vitest';
import { parsearHash } from '../src/ui/router.js';

describe('parsearHash', () => {
  it('la raíz es el Recetario', () => {
    expect(parsearHash('#/')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('')).toEqual({ vista: 'recetario', params: {} });
  });

  it('categoría con el nombre decodificado', () => {
    expect(parsearHash('#/c/Panes%20y%20masas')).toEqual({ vista: 'categoria', params: { nombre: 'Panes y masas' } });
  });

  it('búsqueda con su query', () => {
    expect(parsearHash('#/buscar?q=milanesas')).toEqual({ vista: 'resultados', params: { q: 'milanesas' } });
  });

  it('detalle y edición de una receta', () => {
    expect(parsearHash('#/r/abc123')).toEqual({ vista: 'receta', params: { id: 'abc123' } });
    expect(parsearHash('#/r/abc123/editar')).toEqual({ vista: 'editar', params: { id: 'abc123' } });
  });

  it('alta de receta', () => {
    expect(parsearHash('#/nueva')).toEqual({ vista: 'nueva', params: {} });
  });

  it('alta desde un borrador, con su id', () => {
    expect(parsearHash('#/nueva?borrador=b1')).toEqual({ vista: 'nueva', params: { borrador: 'b1' } });
  });

  it('una ruta desconocida cae en el Recetario en vez de romper', () => {
    expect(parsearHash('#/cualquiera/cosa')).toEqual({ vista: 'recetario', params: {} });
    expect(parsearHash('#/no-existe')).toEqual({ vista: 'recetario', params: {} });
  });

  it('reconoce las rutas nuevas', () => {
    expect(parsearHash('#/borradores')).toEqual({ vista: 'borradores', params: {} });
    expect(parsearHash('#/borradores/b1')).toEqual({ vista: 'borrador', params: { id: 'b1' } });
    expect(parsearHash('#/ajustes')).toEqual({ vista: 'ajustes', params: {} });
    expect(parsearHash('#/r/f1/cocinar')).toEqual({ vista: 'cocinar', params: { id: 'f1' } });
  });

  it('capturar lee el título y la fuente del Share Target', () => {
    expect(parsearHash('#/capturar?url=https%3A%2F%2Fx%2F1&text=Focaccia'))
      .toEqual({ vista: 'capturar', params: { url: 'https://x/1', text: 'Focaccia' } });
  });

  it('capturar sin nada es capturar igual: el Share Target puede no mandar campos', () => {
    expect(parsearHash('#/capturar')).toEqual({ vista: 'capturar', params: { url: '', text: '' } });
  });

  describe('defensa de parámetros', () => {
    it('null, undefined, NaN y objetos devuelven el Recetario', () => {
      expect(parsearHash(null)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash(undefined)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash(42)).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash({})).toEqual({ vista: 'recetario', params: {} });
    });

    it('URL rota con escape inválido no rompe la app', () => {
      // decodeURIComponent lanza con %E0%A4%A, así que tenemos que manejarlo
      expect(parsearHash('#/c/%E0%A4%A')).toEqual({ vista: 'recetario', params: {} });
    });

    it('búsqueda sin query devuelve q vacío', () => {
      expect(parsearHash('#/buscar')).toEqual({ vista: 'resultados', params: { q: '' } });
    });

    it('la receta sin ID no es una receta', () => {
      expect(parsearHash('#/r')).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash('#/r/')).toEqual({ vista: 'recetario', params: {} });
    });

    it('categoría sin nombre no es categoría', () => {
      expect(parsearHash('#/c')).toEqual({ vista: 'recetario', params: {} });
      expect(parsearHash('#/c/')).toEqual({ vista: 'recetario', params: {} });
    });
  });
});
