import { describe, it, expect } from 'vitest';
import { tagsDe, conTag, buscarEnReferencias, recortar } from '../src/referencias/busqueda.js';
import { idDeFicha, filasDe } from '../src/referencias/forma.js';
import type { FichaDeReferencia, Tabla, Cuenta } from '../src/referencias/tipos.js';

const fuente = { nombre: 'F', url: 'https://f.com' };
const plana: Tabla = {
  id: 'plana', titulo: 'Aceites', columnas: [{ id: 'a', nombre: 'Aceite' }, { id: 'b', nombre: 'Humo', unidad: '°C' }],
  filas: [{ a: 'Girasol', b: '1' }, { a: 'Oliva', b: '2' }], fuente
};
const agrupada: Tabla = {
  id: 'agrupada', titulo: 'Duración', columnas: [{ id: 'a', nombre: 'Alimento' }, { id: 'b', nombre: 'Heladera' }],
  grupos: [
    { titulo: 'Frutas', filas: [{ a: 'Limón', b: '3 semanas' }, { a: 'Banana', b: 'no' }] },
    { titulo: 'Lácteos', filas: [{ a: 'Crema', b: '1 semana' }] }
  ],
  fuente
};
const cuenta: Cuenta = { id: 'merengue', titulo: 'Merengue', entradas: [{ id: 'limon', nombre: 'Limón', tipo: 'numero', porDefecto: 1 }], calcular: () => null };
const otra: Tabla = { ...plana, id: 'girasol', titulo: 'Semillas de girasol' };

const lista: FichaDeReferencia[] = [
  { tipo: 'tabla', tabla: plana, tags: ['zapallo', 'aceite'] },
  { tipo: 'cuenta', cuenta, tags: ['ñoqui'] },
  { tipo: 'tabla', tabla: agrupada, tags: ['aceite'] },
  { tipo: 'tabla', tabla: otra, tags: ['semillas'] }
];

const ids = (xs: readonly FichaDeReferencia[]): string[] => xs.map(idDeFicha);

describe('los tags', () => {
  it('sin repetir y en orden alfabético', () => {
    expect(tagsDe(lista)).toEqual(['aceite', 'ñoqui', 'semillas', 'zapallo']);
  });

  it('sin tag, todas las fichas en orden; con un tag, sólo las suyas; uno que no está, ninguna', () => {
    expect(ids(conTag(lista, ''))).toEqual(['plana', 'merengue', 'agrupada', 'girasol']);
    expect(ids(conTag(lista, 'aceite'))).toEqual(['plana', 'agrupada']);
    expect(conTag(lista, 'nada')).toEqual([]);
  });
});

describe('recortar', () => {
  it('deja sólo las filas que coinciden y los grupos que conservan alguna', () => {
    const r = recortar(agrupada, f => f['a'] === 'Crema');
    expect(r && 'grupos' in r ? r.grupos.map(g => g.titulo) : null).toEqual(['Lácteos']);
    expect(r ? filasDe(r) : null).toEqual([{ a: 'Crema', b: '1 semana' }]);
  });

  it('sin ninguna fila, nada', () => {
    expect(recortar(plana, () => false)).toBeNull();
  });
});

describe('la búsqueda', () => {
  it('sin distinguir mayúsculas ni acentos, en las filas de una tabla agrupada, con su grupo', () => {
    const { fichas, tablas } = buscarEnReferencias(lista, '', ' LIMON ');
    expect(fichas).toEqual([]);
    expect(tablas.map(t => idDeFicha(t.ficha))).toEqual(['agrupada']);
    const t = tablas[0]?.tabla;
    expect(t && 'grupos' in t ? t.grupos.map(g => [g.titulo, g.filas.length]) : null).toEqual([['Frutas', 1]]);
  });

  it('una cuenta se encuentra por su título, no por sus entradas', () => {
    expect(ids(buscarEnReferencias(lista, '', 'merengue').fichas)).toEqual(['merengue']);
    expect(buscarEnReferencias(lista, '', 'limón').fichas).toEqual([]);
  });

  it('una ficha que coincide por un tag va como ficha', () => {
    expect(ids(buscarEnReferencias(lista, '', 'semillas').fichas)).toEqual(['girasol']);
  });

  it('una ficha que coincide por título y por filas va una sola vez, como tabla', () => {
    const { fichas, tablas } = buscarEnReferencias(lista, '', 'girasol');
    expect(tablas.map(t => idDeFicha(t.ficha))).toEqual(['plana', 'girasol']);
    expect(fichas).toEqual([]);
  });

  it('con un tag, sólo busca en sus fichas', () => {
    expect(buscarEnReferencias(lista, 'semillas', 'girasol').tablas.map(t => idDeFicha(t.ficha))).toEqual(['girasol']);
  });

  it('sin coincidencias, ni fichas ni tablas; sin texto, tampoco', () => {
    expect(buscarEnReferencias(lista, '', 'xyz')).toEqual({ fichas: [], tablas: [] });
    expect(buscarEnReferencias(lista, '', '   ')).toEqual({ fichas: [], tablas: [] });
  });
});
