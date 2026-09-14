// La identidad visual sale de las propiedades de la carpeta —color y foto—, que
// `main` registra desde el índice. Lo que importa probar es que la búsqueda es
// por nombre, que una categoría renombrada conserva lo suyo, y que lo que falta
// no rompe nada.
import { describe, it, expect, beforeEach } from 'vitest';
import { colorCategoria, fotoCategoria, slugCategoria, registrarCategorias, fotosDelCatalogo, colorDeClave, urlDeFoto } from '../src/ui/categorias.js';

describe('categorias', () => {
  beforeEach(() => registrarCategorias([
    { id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' },
    { id: 'c2', nombre: 'Mis tartas', color: 'tartas', foto: 'catalogo:tartas-y-empanadas' },
    { id: 'c3', nombre: 'Fiambres', color: '', foto: '' },
    { id: 'c4', nombre: 'Rara', color: 'fucsia', foto: 'drive:abc' },
    { id: 'c5', nombre: 'Otros', color: 'otros', foto: 'catalogo:otros' }
  ]));

  it('el slug sigue siendo el del nombre', () => {
    expect(slugCategoria('Pescados y mariscos')).toBe('pescados-y-mariscos');
  });

  it('color y foto salen de las claves registradas', () => {
    expect(colorCategoria('Pescados y mariscos')).toBe('var(--cat-pescados)');
    expect(fotoCategoria('Pescados y mariscos')).toMatch(/pescados-y-mariscos/);
  });

  it('una categoría renombrada conserva su color y su foto', () => {
    expect(colorCategoria('Mis tartas')).toBe('var(--cat-tartas)');
    expect(fotoCategoria('Mis tartas')).toMatch(/tartas-y-empanadas/);
  });

  it('Otros lleva el neutro y su foto', () => {
    expect(colorCategoria('Otros')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Otros')).not.toBeNull();
  });

  it('sin propiedades, con una clave desconocida o sin registrar: neutro y sin foto', () => {
    expect(colorCategoria('Fiambres')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Fiambres')).toBeNull();
    expect(colorCategoria('Rara')).toBe('var(--cat-otros)');
    expect(colorCategoria('Sin categorizar')).toBe('var(--cat-otros)');
  });

  it('una foto de Drive todavía no se dibuja', () => {
    expect(fotoCategoria('Rara')).toBeNull();
  });

  it('defendé: sin nombre no lanza', () => {
    expect(() => colorCategoria(undefined)).not.toThrow();
    expect(() => fotoCategoria(null)).not.toThrow();
  });
  it('el catálogo lista sus fotos, y las claves se traducen sin registro', () => {
    expect(fotosDelCatalogo()).toContain('pastas');
    expect(colorDeClave('pastas')).toBe('var(--cat-pastas)');
    expect(colorDeClave('fucsia')).toBe('var(--cat-otros)');
    expect(urlDeFoto('catalogo:pastas')).toMatch(/pastas/);
    expect(urlDeFoto('')).toBeNull();
    expect(urlDeFoto('drive:abc')).toBeNull();
  });
});
