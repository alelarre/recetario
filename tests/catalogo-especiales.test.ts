import { describe, it, expect } from 'vitest';
import {
  TAGS_ESPECIALES, tagEspecial, esFavorita, ordenarTags, ordenarRecetas, conEspecial, tagReservado,
  coincideTag
} from '../src/catalogo.js';
import { entradaFalsa } from './dobles.js';

describe('los tags especiales', () => {
  it('son cuatro, en el orden fijo', () => {
    expect(TAGS_ESPECIALES).toEqual(['favorito', 'menú diario', 'probar', 'borrador']);
  });

  it('reconoce cada uno sin importar mayúsculas ni tildes', () => {
    expect(tagEspecial('Favorito')).toBe('favorito');
    expect(tagEspecial('menu diario')).toBe('menú diario');
    expect(tagEspecial('MENÚ DIARIO')).toBe('menú diario');
    expect(tagEspecial('probar')).toBe('probar');
  });

  it('borrador se reconoce en sus formas, incluidas las viejas', () => {
    expect(tagEspecial('borrador')).toBe('borrador');
    expect(tagEspecial('Borradores')).toBe('borrador');
    expect(tagEspecial('incompleta')).toBe('borrador');
    expect(tagEspecial('INCOMPLETOS')).toBe('borrador');
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

  it('terminado y sus formas siguen reservados, y los cuatro especiales también', () => {
    for (const t of ['terminado', 'terminadas', 'borrador', 'incompleta', 'menu diario', 'favoritas', 'probar']) {
      expect(tagReservado(t)).toBe(true);
    }
    expect(tagReservado('horno')).toBe(false);
  });

  it('ordena los tags con los especiales primero, en su orden', () => {
    expect(ordenarTags(['horno', 'menú diario', 'clásica', 'favorito']))
      .toEqual(['favorito', 'menú diario', 'horno', 'clásica']);
  });

  it('ordena los tags en el orden nuevo', () => {
    expect(ordenarTags(['horno', 'incompleta', 'probar', 'menú diario', 'favorito']))
      .toEqual(['favorito', 'menú diario', 'probar', 'incompleta', 'horno']);
  });

  it('coincideTag compara por igualdad, o por el mismo especial', () => {
    expect(coincideTag('incompleta', 'borrador')).toBe(true);
    expect(coincideTag('pollo', 'pollo')).toBe(true);
    expect(coincideTag('pollo', 'borrador')).toBe(false);
  });

  it('ordena las recetas con las favoritas primero y alfabético adentro', () => {
    const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags });
    const orden = ordenarRecetas([
      e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])
    ]).map(x => x.titulo);
    expect(orden).toEqual(['Asado', 'Osobuco', 'Bife', 'Vitel toné']);
  });

  it('pone y saca un especial sin tocar los demás tags', () => {
    expect(conEspecial(['horno'], 'borrador', true)).toEqual(['borrador', 'horno']);
    expect(conEspecial(['Favorita', 'horno'], 'favorito', false)).toEqual(['horno']);
  });

  it('la forma vieja se reemplaza por la canónica al poner el especial', () => {
    expect(conEspecial(['incompleta', 'pollo'], 'borrador', true)).toEqual(['borrador', 'pollo']);
    expect(conEspecial(['incompleta'], 'borrador', false)).toEqual([]);
  });
});
