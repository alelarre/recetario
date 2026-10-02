import { it, expect } from 'vitest';
import { completarPan, PAN_POR_DEFECTO } from '../src/calculadoras/pan.js';
import { completarSal, SAL_POR_DEFECTO } from '../src/calculadoras/fermentados.js';

it('el defecto del pan: campo, 000, sin segunda, fresca, 8 h, 1 kg de harina', () => {
  expect(PAN_POR_DEFECTO).toEqual({
    pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
    prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-8', temperatura: '18-24',
    cantidad: { de: 'harina', gramos: 1000 }, horasPrefermento: 0
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
  expect(completarPan({ ...PAN_POR_DEFECTO, prefermento: 'masa-madre', fermentacion: 'ambiente-2' }).fermentacion).toBe('ambiente-4');
});

it('la segunda igual a la principal se descarta', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, harina: '000', segunda: '000' }).segunda).toBeNull();
});

it('la cantidad sólo si es un número positivo, y de harina o de masa', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'masa', gramos: 900 } }).cantidad).toEqual({ de: 'masa', gramos: 900 });
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'otra', gramos: -2 } }).cantidad).toEqual({ de: 'harina', gramos: 1000 });
});

it('sal: lo mismo', () => {
  expect(SAL_POR_DEFECTO).toEqual({ fermento: 'chucrut', pesoTotal: 1000, temperatura: '18-24' });
  expect(completarSal({ fermento: 'kimchi', pesoTotal: -3, temperatura: 'heladera' }))
    .toEqual({ fermento: 'kimchi', pesoTotal: 1000, temperatura: '18-24' });
  expect(completarSal({ fermento: 'kimchi', pesoTotal: 500, temperatura: 'mas-24' }))
    .toEqual({ fermento: 'kimchi', pesoTotal: 500, temperatura: 'mas-24' });
  expect(completarSal(undefined)).toEqual(SAL_POR_DEFECTO);
});

it('pan: una pizza va en bollos y un pan en harina o masa, aunque lo guardado diga otra cosa', () => {
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: 6, gramos: 270 });
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'harina', gramos: 500 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: 4, gramos: 250 });
  expect(completarPan({ pan: 'campo', cantidad: { de: 'bollos', bollos: 4, gramos: 250 } }).cantidad)
    .toEqual({ de: 'masa', gramos: 1000 });
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'bollos', bollos: -1, gramos: 250 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: 4, gramos: 250 });
});

it('pan: la levadura es fresca o seca; el prefermento, uno de la tabla; y unas horas que no son las suyas toman las primeras', () => {
  expect(completarPan({ levadura: 'masa-madre', prefermento: 'biga' })).toMatchObject({ levadura: 'fresca', prefermento: 'biga' });
  expect(completarPan({ prefermento: 'masa-madre', horasPrefermento: 12 })).toMatchObject({ prefermento: 'masa-madre', horasPrefermento: 0 });
  expect(completarPan({ prefermento: 'poolish', horasPrefermento: 12 })).toMatchObject({ prefermento: 'poolish', horasPrefermento: 12 });
  expect(completarPan({ prefermento: 'poolish', horasPrefermento: 5 })).toMatchObject({ prefermento: 'poolish', horasPrefermento: 8 });
  expect(completarPan({ prefermento: 'sourdough' })).toMatchObject({ prefermento: null, horasPrefermento: 0 });
});

it('pan: la temperatura es una de las franjas, o la de por defecto', () => {
  expect(completarPan({ temperatura: 'mas-24' }).temperatura).toBe('mas-24');
  expect(completarPan({ temperatura: 'tibio' }).temperatura).toBe('18-24');
});
