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

  it('cada categoría conocida tiene su token de color', () => {
    expect(colorCategoria('Pescados y mariscos')).toBe('var(--cat-pescados)');
    expect(colorCategoria('Carnes')).toBe('var(--cat-carnes)');
  });

  it('Otros se dibuja con el neutro y sin foto: es la categoría comodín', () => {
    expect(colorCategoria('Otros')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Otros')).toBeNull();
  });

  it('una categoría desconocida cae en el neutro y no rompe', () => {
    // Agregar una categoría es crear una carpeta en Drive: la app tiene que
    // dibujarla igual, aunque nadie le haya puesto color ni foto.
    expect(colorCategoria('Fiambres caseros')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Fiambres caseros')).toBeNull();
  });

  it('defendé: sin nombre no lanza', () => {
    expect(() => colorCategoria(undefined)).not.toThrow();
    expect(() => fotoCategoria(null)).not.toThrow();
  });
});
