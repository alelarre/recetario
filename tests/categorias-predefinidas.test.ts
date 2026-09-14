import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  PREDEFINIDAS, CLAVES_COLOR, predefinidaPorNombre,
  COLUMNAS_CATEGORIAS, filaDeCategoria, categoriaDesdeFila
} from '../src/categorias.js';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('las categorías predefinidas', () => {
  it('son 16, sin nombres repetidos', () => {
    expect(PREDEFINIDAS).toHaveLength(16);
    expect(new Set(PREDEFINIDAS.map(p => p.nombre)).size).toBe(16);
  });

  it('cada color es una clave de la paleta con su token en tokens.css', () => {
    for (const { nombre, color } of PREDEFINIDAS) {
      expect(CLAVES_COLOR, nombre).toContain(color);
      expect(TOKENS, nombre).toContain(`--cat-${color}:`);
    }
  });

  it('cada foto tiene su .webp en src/categorias/', () => {
    for (const { nombre, foto } of PREDEFINIDAS) {
      expect(existsSync(new URL(`../src/categorias/${foto}.webp`, import.meta.url)), nombre).toBe(true);
    }
  });

  it('se reconocen por nombre sin importar tildes ni mayúsculas', () => {
    expect(predefinidaPorNombre('PESCADOS Y MARISCOS')?.color).toBe('pescados');
    expect(predefinidaPorNombre('Desayunos y meriendas')?.foto).toBe('desayunos-y-meriendas');
    expect(predefinidaPorNombre('Fiambres caseros')).toBeNull();
  });
});

describe('la fila de la hoja categorias', () => {
  it('tiene cuatro columnas, ida y vuelta', () => {
    const c = { id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };
    expect(COLUMNAS_CATEGORIAS).toEqual(['id_carpeta', 'nombre', 'color', 'foto']);
    expect(categoriaDesdeFila(filaDeCategoria(c))).toEqual(c);
  });

  it('una fila corta se lee con vacíos', () => {
    expect(categoriaDesdeFila(['c1', 'Rara'])).toEqual({ id: 'c1', nombre: 'Rara', color: '', foto: '' });
  });
});
