import { it, expect } from 'vitest';
import { calcularSal, cifrasSal, lineasSal, advertenciasSal, FERMENTOS } from '../src/calculadoras/fermentados.js';
import { TEMPERATURAS } from '../src/calculadoras/temperaturas.js';

it('1200 g de pepinos llevan 42 g de sal', () => {
  expect(calcularSal({ fermento: 'pepinos', pesoTotal: 1200, temperatura: null })).toEqual({ sal: 42, porcentaje: 3.5 });
});

it('la tabla en su orden', () => {
  expect(FERMENTOS.map(f => [f.nombre, f.sal])).toEqual([
    ['Chucrut', 2], ['Kimchi', 2.5], ['Ajíes', 3], ['Verduras en salmuera', 3], ['Pepinos', 3.5]
  ]);
});

it.each([0, -1, Number.NaN])('peso %s: sin resultado', p => {
  expect(calcularSal({ fermento: 'chucrut', pesoTotal: p, temperatura: null })).toBeNull();
});

it('las franjas de temperatura en su orden', () => {
  expect(TEMPERATURAS.map(t => t.nombre)).toEqual(['Menos de 13 °C', '13 a 18 °C', '18 a 24 °C', 'Más de 24 °C']);
});

it('cada franja tiene un rango de días que va de menos a más, o no tiene dato', () => {
  for (const f of FERMENTOS) {
    for (const t of TEMPERATURAS) {
      const dias = f.dias[t.clave];
      if (dias) expect(dias[0]).toBeLessThanOrEqual(dias[1]);
    }
  }
});

it('con temperatura, el resultado suma el tiempo y su advertencia', () => {
  const d = { fermento: 'chucrut', pesoTotal: 1000, temperatura: '18-24' } as const;
  expect(cifrasSal(d)).toEqual([{ nombre: 'Sal', valor: '20 g' }, { nombre: 'Porcentaje', valor: '2 %' }]);
  expect(lineasSal(d)).toEqual([{ nombre: 'Tiempo', valor: '6 a 16 días' }]);
  expect(advertenciasSal(d)).toEqual([expect.stringContaining('empezar a probar')]);
});

it('una franja sin dato lo dice, sin inventar', () => {
  expect(lineasSal({ fermento: 'ajies', pesoTotal: 1000, temperatura: 'menos-13' }).at(-1))
    .toEqual({ nombre: 'Tiempo', valor: 'sin dato a esta temperatura' });
});

it('sin temperatura, ni tiempo ni advertencia', () => {
  const d = { fermento: 'chucrut', pesoTotal: 1000, temperatura: null } as const;
  expect(cifrasSal(d).map(l => l.nombre)).toEqual(['Sal', 'Porcentaje']);
  expect(lineasSal(d)).toEqual([]);
  expect(cifrasSal({ ...d, pesoTotal: 0 }).map(l => l.valor)).toEqual(['—', '—']);
  expect(advertenciasSal(d)).toEqual([]);
});
