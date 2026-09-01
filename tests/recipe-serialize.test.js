import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src/recipe.js';

const ORIGINAL = `---
titulo: Milanesas napolitanas
tags: [italiana, horno]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá
---

Un clásico.

## Ingredientes
- 4 milanesas

## Preparación
1. Hornear.

## Variaciones
### A la suiza
Gruyere.

## Notas
- Ojo con el horno.
`;

describe('serialize', () => {
  it('hace round-trip sin perder nada', () => {
    expect(serialize(parse(ORIGINAL))).toBe(ORIGINAL);
  });

  it('omite las claves vacías en vez de escribirlas en null', () => {
    const texto = serialize(parse(`---\ntitulo: X\n---\n`));
    expect(texto).toBe('---\ntitulo: X\n---\n');
  });

  it('escribe las secciones en el orden canónico aunque vengan al revés', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Notas\n- b\n\n## Ingredientes\n- a\n`);
    const texto = serialize(r);
    expect(texto.indexOf('## Ingredientes')).toBeLessThan(texto.indexOf('## Notas'));
  });

  it('serializa las secciones desconocidas al final, después de Notas', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nMalbec.\n\n## Notas\n- a\n`);
    const texto = serialize(r);
    expect(texto.indexOf('## Notas')).toBeLessThan(texto.indexOf('## Maridaje'));
    expect(texto).toContain('## Maridaje\nMalbec.');
  });

  it('preserva las claves desconocidas del frontmatter', () => {
    const texto = serialize(parse(`---\ntitulo: X\nautor_agente: claude\n---\n`));
    expect(texto).toContain('autor_agente: claude');
  });

  it('sobrevive a un round-trip doble sin cambiar', () => {
    const una = serialize(parse(ORIGINAL));
    expect(serialize(parse(una))).toBe(una);
  });
});
