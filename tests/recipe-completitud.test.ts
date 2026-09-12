import { describe, it, expect } from 'vitest';
import { parse, serialize, sePuedeTerminar } from '../src/recipe.js';
import { recetaFalsa } from './dobles.js';

describe('completa: es un dato del archivo, no un cálculo', () => {
  it('se lee del frontmatter, donde dice «sí» o «no»', () => {
    expect(parse('---\ntitulo: A\ncompleta: sí\n---\n').completa).toBe(true);
    expect(parse('---\ntitulo: A\ncompleta: no\n---\n').completa).toBe(false);
  });

  it('«si» sin tilde vale igual, y las mayúsculas no importan', () => {
    for (const valor of ['si', 'Sí', 'SI', ' sí ']) {
      expect(parse(`---\ntitulo: A\ncompleta: ${valor}\n---\n`).completa).toBe(true);
    }
  });

  it('`true` sigue valiendo: es lo que escribían los archivos anteriores', () => {
    expect(parse('---\ntitulo: A\ncompleta: true\n---\n').completa).toBe(true);
    expect(parse('---\ntitulo: A\ncompleta: false\n---\n').completa).toBe(false);
  });

  it('cualquier otro valor se lee como incompleta', () => {
    for (const valor of ['tal vez', '1', 'yes', '']) {
      expect(parse(`---\ntitulo: A\ncompleta: ${valor}\n---\n`).completa).toBe(false);
    }
  });

  it('un archivo sin la clave se lee como incompleta, sin mirar el contenido', () => {
    const conTodo = parse(`---
titulo: Rabas
---

## Ingredientes
- Calamar — 500 g

## Preparación
1. Freír.
`);
    expect(conTodo.completa).toBe(false);
  });

  it('la clave se escribe siempre, con «sí» o «no»', () => {
    expect(serialize(recetaFalsa({ titulo: 'A', completa: true }))).toContain('completa: sí');
    expect(serialize(recetaFalsa({ titulo: 'A', completa: false }))).toContain('completa: no');
  });

  it('vuelve del archivo como entró', () => {
    for (const valor of [true, false]) {
      const md = serialize(recetaFalsa({ titulo: 'A', completa: valor }));
      expect(parse(md).completa).toBe(valor);
    }
  });
});

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

  it('no mira `completa`: es la condición para declararla, no la declaración', () => {
    expect(sePuedeTerminar({ ...completa, completa: true }, '')).toBe(false);
  });

  it('no lanza con nada', () => {
    expect(sePuedeTerminar(null, 'c1')).toBe(false);
    expect(sePuedeTerminar(undefined, undefined)).toBe(false);
  });
});
