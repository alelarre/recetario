import { describe, it, expect } from 'vitest';
import { partes } from '../src/eventos/reparto.js';

const redondo = (x: Record<string, number>) => Object.fromEntries(Object.entries(x).map(([k, v]) => [k, Math.round(v * 1000) / 1000]));

describe('las partes de un grupo', () => {
  it('sin reparto guardado, en partes iguales', () => {
    expect(partes(['a', 'b', 'c'], {})).toEqual({ a: 1 / 3, b: 1 / 3, c: 1 / 3 });
  });

  it('con reparto, en su proporción, sumando 1', () => {
    expect(partes(['a', 'b'], { a: 3, b: 1 })).toEqual({ a: 0.75, b: 0.25 });
  });

  it('una que no tiene parte entra con la de un reparto parejo, y las demás le hacen lugar en su proporción', () => {
    expect(redondo(partes(['a', 'b', 'c'], { a: 0.75, b: 0.25 }))).toEqual({ a: 0.5, b: 0.167, c: 0.333 });
  });

  it('si todas las guardadas están en cero, en partes iguales', () => {
    expect(partes(['a', 'b'], { a: 0, b: 0 })).toEqual({ a: 0.5, b: 0.5 });
  });

  it('lo guardado de cosas que no están no cuenta', () => {
    expect(partes(['a', 'b'], { a: 1, b: 1, vieja: 8 })).toEqual({ a: 0.5, b: 0.5 });
  });
});
