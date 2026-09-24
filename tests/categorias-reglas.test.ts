import { describe, it, expect } from 'vitest';
import { problemaDelNombre, colorLibre, CLAVES_COLOR } from '../src/categorias.js';

describe('el nombre de una categoría', () => {
  it('uno nuevo y distinto es válido', () => {
    expect(problemaDelNombre('Fiambres', ['Pastas', 'Aves'])).toBe('');
  });

  it('vacío, con _ adelante o repetido sin mirar tildes ni mayúsculas, no', () => {
    expect(problemaDelNombre('   ', [])).toBe('Ponele un nombre.');
    expect(problemaDelNombre('_ocultas', [])).toBe('No puede empezar con _.');
    expect(problemaDelNombre('PASTAS', ['Pastas'])).toBe('Ya hay una categoría con ese nombre.');
    expect(problemaDelNombre('Pescados y mariscos', ['Péscados y Mariscos'])).toBe('Ya hay una categoría con ese nombre.');
  });

  it('«Sin categoría», sin mirar tildes ni mayúsculas, no: es el nombre de lo que no tiene categoría', () => {
    expect(problemaDelNombre('Sin categoría', [])).toBe('Ese nombre es el de las recetas sin categoría.');
    expect(problemaDelNombre('  SIN CATEGORIA ', ['Pastas'])).toBe('Ese nombre es el de las recetas sin categoría.');
  });
});

describe('el color de una categoría nueva', () => {
  it('el primero de la paleta que nadie usa', () => {
    expect(colorLibre(['arroces', 'aves'])).toBe('bebidas');
  });

  it('con todos en uso, el neutro', () => {
    expect(colorLibre(CLAVES_COLOR)).toBe('otros');
  });

  it('el neutro nunca se ofrece como libre mientras quede otro', () => {
    expect(colorLibre(CLAVES_COLOR.filter(c => c !== 'verduras' && c !== 'otros'))).toBe('verduras');
  });
});
