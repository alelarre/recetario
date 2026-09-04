import { describe, it, expect } from 'vitest';
import { parse, parseIngrediente, ingredientesIndexables, slugArchivo } from '../src/recipe.js';
import { invalido } from './aserciones.js';
import type { Receta } from '../src/tipos.js';

describe('parseIngrediente', () => {
  it('separa cantidad, unidad e item', () => {
    expect(parseIngrediente('- 200 g de muzzarella')).toEqual({
      cantidad: '200', unidad: 'g', item: 'muzzarella', crudo: '- 200 g de muzzarella'
    });
  });

  it('acepta cantidad sin unidad', () => {
    const r = parseIngrediente('- 4 milanesas de nalga')!;
    expect(r.cantidad).toBe('4');
    expect(r.item).toBe('milanesas de nalga');
  });

  it('acepta fracciones y decimales', () => {
    expect(parseIngrediente('- 1/2 taza de leche')!.cantidad).toBe('1/2');
    expect(parseIngrediente('- 1,5 kg de papas')!.cantidad).toBe('1,5');
  });

  it('lo que no matchea se devuelve entero como item, sin perder nada', () => {
    const r = parseIngrediente('- sal y pimienta a gusto')!;
    expect(r.cantidad).toBeNull();
    expect(r.unidad).toBeNull();
    expect(r.item).toBe('sal y pimienta a gusto');
  });

  it('ignora los encabezados de subsección', () => {
    expect(parseIngrediente('### Para la salsa')).toBeNull();
  });

  // Tests de defensa
  describe('guards defensivos', () => {
    it('tolera null', () => {
      expect(parseIngrediente(null)).toBeNull();
    });

    it('tolera undefined', () => {
      expect(parseIngrediente(undefined)).toBeNull();
    });

    it('tolera un número', () => {
      const r = parseIngrediente(42)!;
      expect(r).toBeNull();
    });

    it('tolera un objeto', () => {
      const r = parseIngrediente({ foo: 'bar' })!;
      expect(r).toBeNull();
    });

    it('tolera una línea vacía', () => {
      expect(parseIngrediente('')).toBeNull();
    });

    it('tolera una línea con solo espacios', () => {
      expect(parseIngrediente('   ')).toBeNull();
    });
  });
});

describe('ingredientesIndexables', () => {
  it('devuelve los items en minúsculas, sin repetidos ni subsecciones', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n### Para la salsa\n- 200 g de Muzzarella\n- 1 lata de tomate\n- 200 g de muzzarella\n`);
    expect(ingredientesIndexables(r)).toEqual(['muzzarella', 'tomate']);
  });

  // Tests de defensa
  describe('guards defensivos', () => {
    it('tolera null', () => {
      expect(ingredientesIndexables(null)).toEqual([]);
    });

    it('tolera undefined', () => {
      expect(ingredientesIndexables(undefined)).toEqual([]);
    });

    it('tolera receta que es un número', () => {
      expect(ingredientesIndexables(invalido(42))).toEqual([]);
    });

    it('tolera receta que es un objeto vacío', () => {
      expect(ingredientesIndexables({})).toEqual([]);
    });

    it('tolera una receta sin el campo ingredientes', () => {
      const r = { titulo: 'Test' };
      expect(ingredientesIndexables(r)).toEqual([]);
    });

    it('tolera ingredientes null', () => {
      const r = invalido<Partial<Receta>>({ titulo: 'Test', ingredientes: null });
      expect(ingredientesIndexables(r)).toEqual([]);
    });

    it('tolera ingredientes con solo líneas vacías', () => {
      const r = { titulo: 'Test', ingredientes: '\n\n' };
      expect(ingredientesIndexables(r)).toEqual([]);
    });
  });
});

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
