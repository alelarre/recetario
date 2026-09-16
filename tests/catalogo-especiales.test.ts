import { describe, it, expect } from 'vitest';
import {
  TAGS_ESPECIALES, tagEspecial, esFavorita, ordenarTags, ordenarRecetas, conFavorito, tagReservado
} from '../src/catalogo.js';
import { entradaFalsa } from './dobles.js';

describe('los tags especiales', () => {
  it('son tres, en orden fijo y en minúscula', () => {
    expect(TAGS_ESPECIALES).toEqual(['favorito', 'probar', 'menú diario']);
  });

  it('reconoce cada uno sin importar mayúsculas ni tildes', () => {
    expect(tagEspecial('Favorito')).toBe('favorito');
    expect(tagEspecial('menu diario')).toBe('menú diario');
    expect(tagEspecial('MENÚ DIARIO')).toBe('menú diario');
    expect(tagEspecial('probar')).toBe('probar');
  });

  it('un tag común no es especial', () => {
    expect(tagEspecial('horno')).toBeNull();
    expect(tagEspecial('')).toBeNull();
    expect(tagEspecial(undefined)).toBeNull();
  });

  it('`menú diario` queda reservado: no se puede escribir a mano', () => {
    expect(tagReservado('menú diario')).toBe(true);
    expect(tagReservado('menu diario')).toBe(true);
  });

  it('una receta es favorita si lleva el tag, escrito como sea', () => {
    expect(esFavorita({ tags: ['horno', 'Favorita'] })).toBe(true);
    expect(esFavorita({ tags: ['horno'] })).toBe(false);
    expect(esFavorita({ tags: [] })).toBe(false);
  });

  it('ordena los tags con los especiales primero, en su orden', () => {
    expect(ordenarTags(['horno', 'menú diario', 'clásica', 'favorito']))
      .toEqual(['favorito', 'menú diario', 'horno', 'clásica']);
  });

  it('ordena las recetas con las favoritas primero y alfabético adentro', () => {
    const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags });
    const orden = ordenarRecetas([
      e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])
    ]).map(x => x.titulo);
    expect(orden).toEqual(['Asado', 'Osobuco', 'Bife', 'Vitel toné']);
  });

  it('pone y saca `favorito` sin tocar los demás tags', () => {
    expect(conFavorito(['horno'], true)).toEqual(['favorito', 'horno']);
    expect(conFavorito(['favorito', 'horno'], true)).toEqual(['favorito', 'horno']);
    expect(conFavorito(['Favorita', 'horno'], false)).toEqual(['horno']);
    expect(conFavorito(['horno'], false)).toEqual(['horno']);
  });
});
