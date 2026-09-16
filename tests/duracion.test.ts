import { describe, it, expect } from 'vitest';
import {
  DURACIONES, duracionValida, entradaDesdeFila, filaDesde, ordenarRecetas, contarDuraciones, filtrarPorDuracion
} from '../src/catalogo.js';
import { contextoDe, parse } from '../src/recipe.js';
import { entradaFalsa } from './dobles.js';

describe('los cinco valores de duración', () => {
  it('son estos, en este orden', () => {
    expect(DURACIONES).toEqual(['~15 min', '~30 min', '~60 min', '>60 min', '>1 día']);
  });

  it('duracionValida acepta los cinco tal cual y nada más', () => {
    for (const d of DURACIONES) expect(duracionValida(d)).toBe(d);
    for (const x of ['55 min', '30 min', '~30', '1 h', '', null, undefined, 30]) expect(duracionValida(x)).toBe('');
    expect(duracionValida('  ~30 min  ')).toBe('~30 min');
  });

  it('una fila del índice con un tiempo inválido llega sin duración', () => {
    const fila = filaDesde({ titulo: 'Baba', tiempo: '55 min' }, { id: 'f1' });
    expect(entradaDesdeFila(fila).tiempo).toBe('');
    const buena = filaDesde({ titulo: 'Baba', tiempo: '~60 min' }, { id: 'f1' });
    expect(entradaDesdeFila(buena).tiempo).toBe('~60 min');
  });

  it('contextoDe no muestra un tiempo inválido', () => {
    expect(contextoDe(parse('---\ntitulo: A\ntiempo: 55 min\n---\n'), 'Carnes')).toBe('Carnes');
    expect(contextoDe(parse('---\ntitulo: A\ntiempo: ~30 min\n---\n'), 'Carnes')).toBe('Carnes · ~30 min');
  });
});

describe('ordenar por duración', () => {
  const e = (titulo: string, tiempo: string, fav = false) =>
    entradaFalsa({ id_archivo: titulo, titulo, tiempo, tags: fav ? ['favorito'] : [] });
  const lista = [e('Zapallo', ''), e('Budín', '>1 día'), e('Arroz', '~30 min', true), e('Caldo', '~15 min'), e('Asado', '')];

  it('A–Z no cambia: favoritas primero y alfabético, sin mirar la duración', () => {
    expect(ordenarRecetas(lista).map(x => x.titulo)).toEqual(['Arroz', 'Asado', 'Budín', 'Caldo', 'Zapallo']);
    expect(ordenarRecetas(lista, 'alfa').map(x => x.titulo)).toEqual(['Arroz', 'Asado', 'Budín', 'Caldo', 'Zapallo']);
  });

  it('por duración mezcla las favoritas y deja las sin duración al final, en alfabético', () => {
    expect(ordenarRecetas(lista, 'duracion').map(x => x.titulo)).toEqual(['Caldo', 'Arroz', 'Budín', 'Asado', 'Zapallo']);
  });

  it('dentro de un mismo valor, alfabético', () => {
    const dos = [e('Pizza', '~30 min'), e('Arroz', '~30 min')];
    expect(ordenarRecetas(dos, 'duracion').map(x => x.titulo)).toEqual(['Arroz', 'Pizza']);
  });
});

describe('contar y filtrar por duración', () => {
  const lista = [
    entradaFalsa({ id_archivo: '1', tiempo: '~30 min' }),
    entradaFalsa({ id_archivo: '2', tiempo: '~30 min' }),
    entradaFalsa({ id_archivo: '3', tiempo: '>1 día' }),
    entradaFalsa({ id_archivo: '4', tiempo: '55 min' }),
    entradaFalsa({ id_archivo: '5', tiempo: '' })
  ];

  it('cuenta sólo los valores válidos, en el orden de DURACIONES, sin los que no tienen recetas', () => {
    expect(contarDuraciones(lista)).toEqual([{ valor: '~30 min', cantidad: 2 }, { valor: '>1 día', cantidad: 1 }]);
  });

  it('sin activas no filtra; con varias, las suma', () => {
    expect(filtrarPorDuracion(lista, [])).toHaveLength(5);
    expect(filtrarPorDuracion(lista, ['~30 min']).map(x => x.id_archivo)).toEqual(['1', '2']);
    expect(filtrarPorDuracion(lista, ['~30 min', '>1 día']).map(x => x.id_archivo)).toEqual(['1', '2', '3']);
  });
});
