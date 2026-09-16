import { describe, it, expect } from 'vitest';
import { parse, sePuedeTerminar } from '../src/recipe.js';

describe('sePuedeTerminar: sólo habilita el control del editor', () => {
  const completa = parse(`---
titulo: Rabas
---

## Ingredientes
- Calamar — 500 g

## Preparación
1. Freír.
`);

  it('con título, categoría, ingredientes y pasos, se puede', () => {
    expect(sePuedeTerminar(completa, 'c1')).toBe(true);
  });

  it('sin categoría no se puede, aunque la receta esté escrita entera', () => {
    expect(sePuedeTerminar(completa, '')).toBe(false);
    expect(sePuedeTerminar(completa, null)).toBe(false);
  });

  it('sin título, sin ingredientes o sin pasos, tampoco', () => {
    expect(sePuedeTerminar({ ...completa, titulo: null }, 'c1')).toBe(false);
    expect(sePuedeTerminar({ ...completa, ingredientes: '' }, 'c1')).toBe(false);
    expect(sePuedeTerminar({ ...completa, preparacion: '' }, 'c1')).toBe(false);
  });

  it('una línea suelta alcanza como ingrediente: el bullet no es obligatorio', () => {
    const suelto = parse('---\ntitulo: A\n---\n## Ingredientes\nharina y sal\n## Preparación\n1. Mezclar.');
    expect(sePuedeTerminar(suelto, 'c1')).toBe(true);
  });

  it('una sección con sólo un grupo y ningún ítem no alcanza', () => {
    const vacia = parse('---\ntitulo: A\n---\n## Ingredientes\n### Para la salsa\n## Preparación\n1. Mezclar.');
    expect(sePuedeTerminar(vacia, 'c1')).toBe(false);
  });

  it('no lanza con nada', () => {
    expect(sePuedeTerminar(null, 'c1')).toBe(false);
    expect(sePuedeTerminar(undefined, undefined)).toBe(false);
  });
});
