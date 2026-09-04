// tests/categorias.test.js
//
// La identidad visual se resuelve desde el nombre de la carpeta, que es la
// única verdad del modelo (§3.1). Lo que importa probar es que una carpeta
// nueva —creada en Drive, que la app descubre listando subcarpetas— no rompe
// nada aunque todavía no tenga ni color ni foto asignados.
import { describe, it, expect } from 'vitest';
import { colorCategoria, fotoCategoria, slugCategoria } from '../src/ui/categorias.js';

describe('categorias', () => {
  it('el slug coincide con el nombre del archivo de imagen', () => {
    expect(slugCategoria('Pescados y mariscos')).toBe('pescados-y-mariscos');
    expect(slugCategoria('Arroces y legumbres')).toBe('arroces-y-legumbres');
  });

  it('cada categoría conocida tiene su color', () => {
    expect(colorCategoria('Pescados y mariscos')).toBe('hsl(174 58% 50%)');
    expect(colorCategoria('Carnes')).toBe('hsl(8 62% 58%)');
  });

  it('una categoría desconocida cae en el neutro y no rompe', () => {
    // Agregar una categoría es crear una carpeta en Drive: la app tiene que
    // dibujarla igual, aunque nadie le haya puesto color ni foto.
    expect(colorCategoria('Fiambres caseros')).toBe('hsl(258 12% 46%)');
    expect(fotoCategoria('Fiambres caseros')).toBeNull();
  });

  it('defendé: sin nombre no lanza', () => {
    expect(() => colorCategoria(undefined)).not.toThrow();
    expect(() => fotoCategoria(null)).not.toThrow();
  });
});
