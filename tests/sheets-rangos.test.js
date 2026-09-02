import { describe, it, expect } from 'vitest';
import { rangoDeFila, rangoDeCelda } from '../src/sheets.js';

describe('rangos A1', () => {
  it('una fila entera abarca las doce columnas', () => {
    expect(rangoDeFila(2)).toBe('recetas!A2:L2');
  });

  it('una celda usa la letra de su columna', () => {
    expect(rangoDeCelda('titulo', 5)).toBe('recetas!C5');
    expect(rangoDeCelda('mtime', 5)).toBe('recetas!L5');
  });

  it('una columna desconocida es un error de programación, no un rango raro', () => {
    expect(() => rangoDeCelda('inexistente', 2)).toThrow();
  });

  describe('defensa de parámetros en rangoDeFila', () => {
    it('null lanza error de programación', () => {
      expect(() => rangoDeFila(null)).toThrow();
    });

    it('undefined lanza error de programación', () => {
      expect(() => rangoDeFila(undefined)).toThrow();
    });

    it('un número negativo lanza error de programación', () => {
      expect(() => rangoDeFila(-5)).toThrow();
    });

    it('un string lanza error de programación', () => {
      expect(() => rangoDeFila('algo')).toThrow();
    });

    it('un flotante lanza error de programación', () => {
      expect(() => rangoDeFila(1.5)).toThrow();
    });

    it('un número positivo entero retorna la fila correcta', () => {
      expect(rangoDeFila(1)).toBe('recetas!A1:L1');
      expect(rangoDeFila(10)).toBe('recetas!A10:L10');
      expect(rangoDeFila(100)).toBe('recetas!A100:L100');
    });
  });
});
