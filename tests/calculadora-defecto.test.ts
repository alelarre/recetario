import { it, expect } from 'vitest';
import { completarPan, PAN_POR_DEFECTO } from '../src/calculadoras/pan.js';
import { completarSal, SAL_POR_DEFECTO } from '../src/calculadoras/fermentados.js';

it('el defecto del pan: campo, 000, sin segunda, fresca, 8 h, 1 kg de harina', () => {
  expect(PAN_POR_DEFECTO).toEqual({
    pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
    levadura: 'fresca', fermentacion: 'ambiente-8', cantidad: { de: 'harina', gramos: 1000 }
  });
});

it('un guardado ilegible o vacío da el defecto', () => {
  expect(completarPan(null)).toEqual(PAN_POR_DEFECTO);
  expect(completarPan('x')).toEqual(PAN_POR_DEFECTO);
  expect(completarPan([])).toEqual(PAN_POR_DEFECTO);
});

it('una opción que ya no existe vuelve al defecto sólo en ese dato', () => {
  const d = completarPan({ ...PAN_POR_DEFECTO, pan: 'pan-viejo', harina: 'integral' });
  expect(d.pan).toBe('campo');
  expect(d.harina).toBe('integral');
});

it('masa madre con 2 h pasa a 4 h', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, levadura: 'masa-madre', fermentacion: 'ambiente-2' }).fermentacion).toBe('ambiente-4');
});

it('la segunda igual a la principal se descarta', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, harina: '000', segunda: '000' }).segunda).toBeNull();
});

it('la cantidad sólo si es un número positivo, y de harina o de masa', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'masa', gramos: 900 } }).cantidad).toEqual({ de: 'masa', gramos: 900 });
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'otra', gramos: -2 } }).cantidad).toEqual({ de: 'harina', gramos: 1000 });
});

it('sal: lo mismo', () => {
  expect(SAL_POR_DEFECTO).toEqual({ fermento: 'chucrut', pesoTotal: 1000 });
  expect(completarSal({ fermento: 'kimchi', pesoTotal: -3 })).toEqual({ fermento: 'kimchi', pesoTotal: 1000 });
  expect(completarSal(undefined)).toEqual(SAL_POR_DEFECTO);
});
