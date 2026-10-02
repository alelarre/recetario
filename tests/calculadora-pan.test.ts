import { describe, it, expect } from 'vitest';
import { calcularPan, fermentacionesPara, HIDRATACION_MAXIMA, type DatosPan } from '../src/calculadoras/pan.js';
import { gramos } from '../src/calculadoras/gramos.js';

const base: DatosPan = {
  pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
  levadura: 'fresca', fermentacion: 'ambiente-8', cantidad: { de: 'harina', gramos: 1000 }
};

describe('calcularPan', () => {
  it('pan de campo, 1 kg de 000, fresca, 8 h', () => {
    const r = calcularPan(base)!;
    expect(r.hidratacion).toBe(72);
    expect(r.agua).toBeCloseTo(720);
    expect(r.sal).toBeCloseTo(20);
    expect(r.levadura).toBeCloseTo(5);
    expect(r.masaTotal).toBeCloseTo(1745);
    expect(r.harinas).toEqual([{ clave: '000', nombre: '000', gramos: 1000 }]);
  });

  it('000 con 30 % de centeno: ajuste +6 y una línea por harina', () => {
    const r = calcularPan({ ...base, segunda: 'centeno', porcentajeSegunda: 30 })!;
    expect(r.hidratacion).toBeCloseTo(78);
    expect(r.harinas.map(h => [h.clave, Math.round(h.gramos)])).toEqual([['000', 700], ['centeno', 300]]);
  });

  it('masa madre: la harina y el agua a agregar descuentan la mitad de la masa madre', () => {
    const r = calcularPan({ ...base, levadura: 'masa-madre', fermentacion: 'ambiente-4' })!;
    expect(r.levadura).toBeCloseTo(200);
    expect(r.harinas[0]!.gramos).toBeCloseTo(900);
    expect(r.agua).toBeCloseTo(620);
    expect(r.harinaTotal).toBe(1000);
    expect(r.masaTotal).toBeCloseTo(1740);
  });

  it('el agua a agregar nunca es negativa: peor caso de la tabla', () => {
    const r = calcularPan({ ...base, pan: 'miga', harina: '0000', levadura: 'masa-madre', fermentacion: 'ambiente-4' })!;
    expect(r.agua).toBeGreaterThan(0);
  });

  it('la hidratación se topea en 85 %', () => {
    const r = calcularPan({ ...base, pan: 'ciabatta', harina: 'centeno' })!;
    expect(r.hidratacion).toBe(HIDRATACION_MAXIMA);
    expect(r.topeada).toBe(true);
    expect(calcularPan(base)!.topeada).toBe(false);
  });

  it('la seca es la fresca dividida por 3', () => {
    const fresca = calcularPan(base)!.levadura;
    expect(calcularPan({ ...base, levadura: 'seca' })!.levadura).toBeCloseTo(fresca / 3);
  });

  it('desde la masa total da la misma harina (ida y vuelta)', () => {
    const ida = calcularPan(base)!;
    const vuelta = calcularPan({ ...base, cantidad: { de: 'masa', gramos: ida.masaTotal } })!;
    expect(vuelta.harinaTotal).toBeCloseTo(1000);
    const conMasaMadre = { ...base, levadura: 'masa-madre' as const, fermentacion: 'frio-24' as const };
    const idaMM = calcularPan(conMasaMadre)!;
    const vueltaMM = calcularPan({ ...conMasaMadre, cantidad: { de: 'masa', gramos: idaMM.masaTotal } })!;
    expect(vueltaMM.harinaTotal).toBeCloseTo(1000);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('cantidad %s: sin resultado', g => {
    expect(calcularPan({ ...base, cantidad: { de: 'harina', gramos: g } })).toBeNull();
  });
});

it('con masa madre no se ofrecen 2 h', () => {
  expect(fermentacionesPara('masa-madre').map(f => f.clave)).not.toContain('ambiente-2');
  expect(fermentacionesPara('fresca').map(f => f.clave)).toContain('ambiente-2');
});

it('gramos: enteros; por debajo de 10, un decimal; por debajo de 1, dos, y nunca menos de 0,01', () => {
  expect(gramos(720.4)).toBe('720');
  expect(gramos(5.44)).toBe('5,4');
  expect(gramos(0.333)).toBe('0,33');
  expect(gramos(0.05)).toBe('0,05');
  expect(gramos(0.001)).toBe('0,01');
  expect(gramos(0.996)).toBe('1,0');
  expect(gramos(9.96)).toBe('10');
  expect(gramos(9.94)).toBe('9,9');
});
