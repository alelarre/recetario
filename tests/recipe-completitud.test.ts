import { describe, it, expect } from 'vitest';
import { parse, estaCompleta } from '../src/recipe.js';

const con = (cuerpo: string) => parse(`---\ntitulo: Prueba\n---\n${cuerpo}`);

describe('estaCompleta', () => {
  it('completa = título y al menos un ingrediente y al menos un paso', () => {
    expect(estaCompleta(con('## Ingredientes\n- Sal\n## Preparación\n1. Salar.'))).toBe(true);
  });

  it('sin ingredientes, incompleta', () => {
    expect(estaCompleta(con('## Preparación\n1. Salar.'))).toBe(false);
  });

  it('sin pasos, incompleta', () => {
    expect(estaCompleta(con('## Ingredientes\n- Sal'))).toBe(false);
  });

  it('sin título, incompleta', () => {
    expect(estaCompleta(parse('## Ingredientes\n- Sal\n## Preparación\n1. Salar.'))).toBe(false);
  });

  it('un grupo sin ítems no cuenta como ingrediente', () => {
    expect(estaCompleta(con('## Ingredientes\n### Para la salsa\n## Preparación\n1. Salar.'))).toBe(false);
  });

  it('`completa: true` gana sobre el cálculo', () => {
    const r = parse('---\ntitulo: Masa madre\ncompleta: true\n---\n');
    expect(estaCompleta(r)).toBe(true);
  });

  // Tests de defensa: los habilita la firma con `Partial<Receta> | null`,
  // que es la que necesita `filaDesde()` para no obligar a un `as Receta`.
  describe('guards defensivos', () => {
    it('tolera receta null', () => {
      expect(estaCompleta(null)).toBe(false);
    });

    it('tolera receta vacía', () => {
      expect(estaCompleta({})).toBe(false);
    });
  });
});
