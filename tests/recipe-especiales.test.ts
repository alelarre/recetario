import { describe, it, expect } from 'vitest';
import { parse, serialize, CLAVES_FRONTMATTER } from '../src/recipe.js';

const md = (fm: string): string => `---\ntitulo: Pollo\n${fm}\n---\n`;

describe('tags_especiales al leer', () => {
  it('se lee la lista cerrada, canónica y en orden', () => {
    const r = parse(md('tags_especiales: [BORRADOR, Favorito, favorito]'));
    expect(r.tags_especiales).toEqual(['favorito', 'borrador']);
    expect(r.ignorados).toEqual([]);
  });

  it('un valor que no es de la lista se ignora y queda anotado', () => {
    const r = parse(md('tags_especiales: [favoritas, brioche]'));
    expect(r.tags_especiales).toEqual([]);
    expect(r.ignorados).toEqual([
      { clave: 'tags_especiales', valor: 'favoritas' },
      { clave: 'tags_especiales', valor: 'brioche' }
    ]);
  });

  it('un reservado en tags se ignora: ni especial ni tag común', () => {
    const r = parse(md('tags: [favorito, horno, incompleta, terminado]'));
    expect(r.tags).toEqual(['horno']);
    expect(r.tags_especiales).toEqual([]);
    expect(r.ignorados.map(i => i.valor)).toEqual(['favorito', 'incompleta', 'terminado']);
  });

  it('acepta el formato largo de lista', () => {
    const r = parse('---\ntitulo: X\ntags_especiales:\n  - probar\n  - favorito\n---\n');
    expect(r.tags_especiales).toEqual(['favorito', 'probar']);
    expect(r.avisos).not.toContain('frontmatter-ilegible');
  });

  it('sin la clave, vacío', () => {
    expect(parse(md('tags: [horno]')).tags_especiales).toEqual([]);
  });
});

describe('tags_especiales al escribir', () => {
  it('va justo después de tags, y vacía no se escribe', () => {
    const r = parse(md('tags: [horno]\ntags_especiales: [probar]\nrinde: 4'));
    expect(serialize(r)).toMatch(/^---\ntitulo: Pollo\ntags: \[horno\]\ntags_especiales: \[probar\]\nrinde: 4\n---/);
    expect(serialize({ ...r, tags_especiales: [] })).not.toContain('tags_especiales');
  });

  it('ida y vuelta', () => {
    const r = parse(md('tags: [horno]\ntags_especiales: [favorito, borrador]'));
    expect(parse(serialize(r)).tags_especiales).toEqual(['favorito', 'borrador']);
  });

  it('lo ignorado no se escribe', () => {
    const r = parse(md('tags: [favorito, horno]'));
    expect(serialize(r)).not.toContain('favorito');
  });
});

it('las claves declaradas, en el orden en que se escriben', () => {
  expect(CLAVES_FRONTMATTER.map(c => c.clave))
    .toEqual(['titulo', 'tags', 'tags_especiales', 'rinde', 'tiempo', 'dificultad', 'fuente', 'foto']);
});
