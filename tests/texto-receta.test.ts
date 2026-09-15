import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse, contextoDe } from '../src/recipe.js';
import { textoReceta } from '../src/texto-receta.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));

describe('contextoDe', () => {
  it('categoría, rinde, tiempo y dificultad, lo que haya', () => {
    expect(contextoDe(BABA, 'Entradas y picadas')).toBe('Entradas y picadas · 6 porciones (unas 1¾ tazas) · 55 min · fácil');
    expect(contextoDe(parse('---\ntitulo: A\n---\n'), '')).toBe('');
  });
});

describe('textoReceta', () => {
  it('una receta chica, entera', () => {
    const r = parse(`---
titulo: Rabas
tags: [fritura]
rinde: 4 porciones
fuente: "[Paladar](https://p.com/rabas)"
completa: sí
---

Una entrada **clásica**.

## Ingredientes
- Calamar — 500 g
- Sal

## Preparación
1. Lavar.
2. Freír *bien*.

## Notas
Ojo con el aceite.
`);
    expect(textoReceta(r, 'Pescados')).toBe(
`Rabas
Pescados · 4 porciones

Una entrada *clásica*.

Ingredientes
- Calamar — 500 g
- Sal

Preparación
1. Lavar.
2. Freír _bien_.

Notas
Ojo con el aceite.

Fuente: Paladar (https://p.com/rabas)`);
  });

  it('el baba ganush: secciones, subtítulos y fuente al final, sin tags', () => {
    const t = textoReceta(BABA, 'Entradas y picadas');
    expect(t.startsWith('Baba ganush\nEntradas y picadas · 6 porciones')).toBe(true);
    expect(t).toContain('\n\nIngredientes\n- 900 g de berenjenas italianas (2 chicas o medianas)\n');
    expect(t).toContain('\n\nPreparación\n1. Precalentar el horno a 230 °C');
    expect(t).toContain('\n\nVariaciones\nMás liviana\nBajar el aceite de oliva');
    expect(t).toContain('\n\nNotas\n- Elegir dos berenjenas chicas');
    expect(t.endsWith('\n\nFuente: https://cookieandkate.com/epic-baba-ganoush-recipe/')).toBe(true);
    expect(t).not.toContain('vegetariano');
    expect(t).not.toContain('completa');
    expect(t).not.toContain('\n\n\n');
    expect(t).not.toContain('#');
  });

  it('una sección vacía no aparece', () => {
    expect(textoReceta(parse('---\ntitulo: A\n---\n## Notas\n'), '')).toBe('A');
  });
});
