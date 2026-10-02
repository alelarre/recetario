import { it, expect } from 'vitest';
import { calcularSal, FERMENTOS } from '../src/calculadoras/fermentados.js';

it('1200 g de pepinos llevan 42 g de sal', () => {
  expect(calcularSal({ fermento: 'pepinos', pesoTotal: 1200 })).toEqual({ sal: 42, porcentaje: 3.5 });
});

it('la tabla en su orden', () => {
  expect(FERMENTOS.map(f => [f.nombre, f.sal])).toEqual([
    ['Chucrut', 2], ['Kimchi', 2.5], ['Ajíes', 3], ['Verduras en salmuera', 3], ['Pepinos', 3.5]
  ]);
});

it.each([0, -1, Number.NaN])('peso %s: sin resultado', p => {
  expect(calcularSal({ fermento: 'chucrut', pesoTotal: p })).toBeNull();
});
