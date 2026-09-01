import { describe, it, expect } from 'vitest';
import { parse, normalizar } from '../src/recipe.js';

const COMPLETA = `---
titulo: Milanesas napolitanas
tags: [italiana, horno, rápido]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
---

Un clásico de los domingos.
`;

describe('parse — frontmatter', () => {
  it('lee las seis claves conocidas', () => {
    const r = parse(COMPLETA);
    expect(r.titulo).toBe('Milanesas napolitanas');
    expect(r.tags).toEqual(['italiana', 'horno', 'rápido']);
    expect(r.rinde).toBe('4 porciones');
    expect(r.tiempo).toBe('40 min');
    expect(r.dificultad).toBe('fácil');
    expect(r.fuente).toBe('Cuaderno de mamá, p. 12');
    expect(r.avisos).toEqual([]);
  });

  it('acepta tags en lista de guiones además de la lista corta', () => {
    const r = parse(`---\ntitulo: X\ntags:\n  - horno\n  - rápido\n---\n`);
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('deja en null lo que falta, sin inventar', () => {
    const r = parse(`---\ntitulo: Solo título\n---\n`);
    expect(r.titulo).toBe('Solo título');
    expect(r.rinde).toBeNull();
    expect(r.dificultad).toBeNull();
    expect(r.tags).toEqual([]);
  });

  it('preserva las claves desconocidas en extras', () => {
    const r = parse(`---\ntitulo: X\nautor_agente: claude\n---\n`);
    expect(r.extras).toEqual({ autor_agente: 'claude' });
  });

  it('sin titulo avisa, pero devuelve una receta usable', () => {
    const r = parse(`---\nrinde: 2\n---\n\nTexto suelto.\n`);
    expect(r.titulo).toBeNull();
    expect(r.avisos).toContain('sin-titulo');
    expect(r.descripcion).toBe('Texto suelto.');
  });

  it('sin frontmatter trata todo como cuerpo y avisa', () => {
    const r = parse('Una receta pegada de cualquier lado.\n');
    expect(r.titulo).toBeNull();
    expect(r.avisos).toContain('sin-frontmatter');
    expect(r.descripcion).toBe('Una receta pegada de cualquier lado.');
  });

  it('con frontmatter ilegible rescata lo que puede y no lanza', () => {
    const r = parse(`---\ntitulo: X\n:::basura:::\n---\n\nCuerpo.\n`);
    expect(r.titulo).toBe('X');
    expect(r.avisos).toContain('frontmatter-ilegible');
    expect(r.descripcion).toBe('Cuerpo.');
  });

  it('lista bajo una clave que no es tags marca frontmatter-ilegible', () => {
    const r = parse(`---\ntitulo: X\nrinde:\n  - 4 porciones\n  - 6 porciones\n---\n`);
    expect(r.titulo).toBe('X');
    expect(r.rinde).toBeNull();
    expect(r.avisos).toContain('frontmatter-ilegible');
  });
});

describe('normalizar', () => {
  it('baja a minúsculas y saca tildes', () => {
    expect(normalizar('Fácil')).toBe('facil');
    expect(normalizar('PREPARACIÓN')).toBe('preparacion');
  });

  it('coerciona números, objetos y otros tipos sin lanzar', () => {
    expect(normalizar(42)).toBe('42');
    expect(normalizar({ foo: 'bar' })).toBe('[object object]');
  });
});
