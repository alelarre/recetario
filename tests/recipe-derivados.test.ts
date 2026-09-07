import { describe, it, expect } from 'vitest';
import { slugArchivo } from '../src/recipe.js';
import { invalido } from './aserciones.js';

describe('slugArchivo', () => {
  it('baja a minúsculas, saca tildes y usa guiones', () => {
    expect(slugArchivo('Milanesas napolitanas')).toBe('milanesas-napolitanas.md');
    expect(slugArchivo('Ñoquis del 29')).toBe('noquis-del-29.md');
  });

  it('saca la puntuación y no deja guiones dobles ni en los bordes', () => {
    expect(slugArchivo('  ¡Torta: de manzana!  ')).toBe('torta-de-manzana.md');
  });

  it('agrega sufijo numérico si el nombre ya existe en la carpeta', () => {
    expect(slugArchivo('Pan', ['pan.md'])).toBe('pan-2.md');
    expect(slugArchivo('Pan', ['pan.md', 'pan-2.md'])).toBe('pan-3.md');
  });

  it('un título vacío cae en un nombre usable', () => {
    expect(slugArchivo('')).toBe('sin-titulo.md');
  });

  // Tests de defensa
  describe('guards defensivos', () => {
    it('tolera titulo null', () => {
      expect(slugArchivo(null)).toBe('sin-titulo.md');
    });

    it('tolera titulo undefined', () => {
      expect(slugArchivo(undefined)).toBe('sin-titulo.md');
    });

    it('tolera titulo que es un número', () => {
      expect(slugArchivo(42)).toBe('42.md');
    });

    it('tolera titulo que es un objeto', () => {
      const result = slugArchivo({ foo: 'bar' });
      expect(result).toBe('sin-titulo.md');
    });

    it('tolera existentes null', () => {
      expect(slugArchivo('Pan', invalido(null))).toBe('pan.md');
    });

    it('tolera existentes undefined', () => {
      expect(slugArchivo('Pan', undefined)).toBe('pan.md');
    });

    it('tolera existentes que contiene undefined', () => {
      expect(slugArchivo('Pan', ['pan.md', undefined])).toBe('pan-2.md');
    });

    it('tolera existentes que es un string sin lanzar', () => {
      expect(slugArchivo('Pan', invalido('pan.md'))).toBe('pan.md');
    });

    it('tolera existentes que es un número sin lanzar', () => {
      expect(slugArchivo('Pan', invalido(42))).toBe('pan.md');
    });

    it('tolera existentes que es un objeto sin lanzar', () => {
      expect(slugArchivo('Pan', invalido({}))).toBe('pan.md');
    });
  });
});
