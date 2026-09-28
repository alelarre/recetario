import { describe, it, expect } from 'vitest';
import {
  tieneEspecial, esFavorita, conEspecial, coincideTag, tieneAlgoCargado, ordenarRecetas,
  filaDesde, entradaDesdeFila, COLUMNAS
} from '../src/catalogo.js';
import type { TagEspecial } from '../src/catalogo.js';
import { entradaFalsa, recetaFalsa } from './dobles.js';

describe('especiales en tags_especiales', () => {
  it('tieneEspecial y esFavorita miran la clave nueva', () => {
    expect(esFavorita({ tags_especiales: ['favorito'] })).toBe(true);
    expect(esFavorita({ tags_especiales: [] })).toBe(false);
    expect(tieneEspecial({ tags_especiales: ['probar'] }, 'borrador')).toBe(false);
  });

  it('conEspecial pone y saca, en el orden de la tabla', () => {
    expect(conEspecial(['borrador'], 'favorito', true)).toEqual(['favorito', 'borrador']);
    expect(conEspecial(['favorito', 'borrador'], 'favorito', false)).toEqual(['borrador']);
    expect(conEspecial(['favorito'], 'favorito', true)).toEqual(['favorito']);
  });

  it('coincideTag compara sin mayúsculas ni tildes; favoritas no es favorito', () => {
    expect(coincideTag('Horno', 'horno')).toBe(true);
    expect(coincideTag('pollo', 'borrador')).toBe(false);
    expect(coincideTag('favoritas', 'favorito')).toBe(false);
  });

  it('un especial que no es borrador cuenta como algo cargado', () => {
    expect(tieneAlgoCargado(recetaFalsa({ tags_especiales: ['borrador'] }))).toBe(false);
    expect(tieneAlgoCargado(recetaFalsa({ tags_especiales: ['borrador', 'probar'] }))).toBe(true);
    expect(tieneAlgoCargado(recetaFalsa({ tags: ['horno'] }))).toBe(true);
  });

  it('ordena las recetas con las favoritas primero y alfabético adentro', () => {
    const e = (titulo: string, tags_especiales: TagEspecial[] = []) => entradaFalsa({ titulo, tags_especiales });
    const orden = ordenarRecetas([
      e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])
    ]).map(x => x.titulo);
    expect(orden).toEqual(['Asado', 'Osobuco', 'Bife', 'Vitel toné']);
  });
});

describe('la columna del índice', () => {
  it('va al final, y hace ida y vuelta', () => {
    expect(COLUMNAS.at(-1)).toBe('tags_especiales');
    const fila = filaDesde(recetaFalsa({ titulo: 'X', tags_especiales: ['favorito', 'borrador'] }), { id: 'a' });
    expect(entradaDesdeFila(fila).tags_especiales).toEqual(['favorito', 'borrador']);
  });

  it('una fila del esquema anterior, sin la columna, se lee vacía', () => {
    const vieja = filaDesde(recetaFalsa({ titulo: 'X' }), { id: 'a' }).slice(0, -1);
    expect(entradaDesdeFila(vieja).tags_especiales).toEqual([]);
  });

  it('una celda con algo que no es especial lo descarta', () => {
    const fila = filaDesde(recetaFalsa({ titulo: 'X' }), { id: 'a' });
    fila[fila.length - 1] = 'favorito|pan';
    expect(entradaDesdeFila(fila).tags_especiales).toEqual(['favorito']);
  });
});
