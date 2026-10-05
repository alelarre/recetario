import { it, expect } from 'vitest';
import {
  completarPan, alElegirTipo, PAN_POR_DEFECTO, PANES, PREFERMENTOS_CON_LEVADURA, BOLLOS_POR_DEFECTO, type ClavePan
} from '../src/calculadoras/pan.js';
import { completarSal, SAL_POR_DEFECTO, FERMENTOS } from '../src/calculadoras/fermentados.js';

// Los valores por defecto y los de las tablas se leen de su archivo: los
// tests prueban de dónde sale cada dato, no cuánto vale.
const panDe = (clave: ClavePan) => PANES.find(p => p.clave === clave)!;
const horasDe = (clave: 'poolish' | 'biga') => PREFERMENTOS_CON_LEVADURA.find(p => p.clave === clave)!.horas.map(h => h.horas);
const salDe = (clave: string) => FERMENTOS.find(f => f.clave === clave)!.sal;

it('el defecto del pan: su tipo como viene', () => {
  expect(PAN_POR_DEFECTO).toEqual(alElegirTipo(PAN_POR_DEFECTO, PAN_POR_DEFECTO.pan!));
});

it('un guardado ilegible o vacío da el defecto', () => {
  expect(completarPan(null)).toEqual(PAN_POR_DEFECTO);
  expect(completarPan('x')).toEqual(PAN_POR_DEFECTO);
  expect(completarPan([])).toEqual(PAN_POR_DEFECTO);
});

it('una opción que ya no existe vuelve al defecto sólo en ese dato', () => {
  const d = completarPan({ ...PAN_POR_DEFECTO, pan: 'pan-viejo', harina: 'integral' });
  expect(d.pan).toBe(PAN_POR_DEFECTO.pan);
  expect(d.harina).toBe('integral');
});

it('lo que falta o no vale vuelve a lo que trae el tipo guardado', () => {
  expect(completarPan({ pan: 'baguette' })).toEqual(alElegirTipo(PAN_POR_DEFECTO, 'baguette'));
  const napolitana = panDe('napolitana');
  expect(completarPan({ pan: 'napolitana', harina: 'x', hidratacion: -1 }))
    .toMatchObject({ harina: napolitana.harina, hidratacion: napolitana.hidratacion });
});

it('la hidratación escrita se conserva; «Ninguno» guardado no es un dato que falte', () => {
  expect(completarPan({ pan: 'campo', hidratacion: 66.5 }).hidratacion).toBe(66.5);
  expect(completarPan({ pan: 'campo', prefermento: null }).prefermento).toBeNull();
  expect(completarPan({ pan: 'campo' }).prefermento).toBe(panDe('campo').prefermento);
});

it('masa madre con 2 h pasa a 4 h', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, prefermento: 'masa-madre', fermentacion: 'ambiente-2' }).fermentacion).toBe('ambiente-4');
});

it('la segunda igual a la principal se descarta', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, harina: '000', segunda: '000' }).segunda).toBeNull();
});

it('la cantidad sólo si es un número positivo, y de harina o de masa', () => {
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'masa', gramos: 900 } }).cantidad).toEqual({ de: 'masa', gramos: 900 });
  expect(completarPan({ ...PAN_POR_DEFECTO, cantidad: { de: 'otra', gramos: -2 } }).cantidad).toEqual(PAN_POR_DEFECTO.cantidad);
});

it('sal: lo mismo', () => {
  // El defecto es su tipo con el porcentaje que sugiere.
  expect(SAL_POR_DEFECTO.sal).toBe(salDe(SAL_POR_DEFECTO.fermento!));
  // El porcentaje de sal que falta o no vale es el que sugiere el tipo guardado.
  expect(completarSal({ fermento: 'kimchi', pesoTotal: -3, temperatura: 'heladera' }))
    .toEqual({ fermento: 'kimchi', sal: salDe('kimchi'), pesoTotal: SAL_POR_DEFECTO.pesoTotal, temperatura: SAL_POR_DEFECTO.temperatura });
  expect(completarSal({ fermento: 'kimchi', sal: -1, pesoTotal: 500, temperatura: 'mas-24' }))
    .toEqual({ fermento: 'kimchi', sal: salDe('kimchi'), pesoTotal: 500, temperatura: 'mas-24' });
  expect(completarSal({ fermento: 'kimchi', sal: 3.2, pesoTotal: 500, temperatura: 'mas-24' }).sal).toBe(3.2);
  expect(completarSal({ fermento: 'no-existe', sal: 4 })).toMatchObject({ fermento: SAL_POR_DEFECTO.fermento, sal: 4 });
  expect(completarSal(undefined)).toEqual(SAL_POR_DEFECTO);
});

it('pan: una pizza va en bollos y un pan en harina o masa, aunque lo guardado diga otra cosa', () => {
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: 6, gramos: 270 });
  const bollo = panDe('napolitana').bollo;
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'harina', gramos: 500 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: bollo });
  expect(completarPan({ pan: 'campo', cantidad: { de: 'bollos', bollos: 4, gramos: 250 } }).cantidad)
    .toEqual({ de: 'masa', gramos: 1000 });
  expect(completarPan({ pan: 'napolitana', cantidad: { de: 'bollos', bollos: -1, gramos: 250 } }).cantidad)
    .toEqual({ de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: bollo });
});

it('pan: la levadura es fresca o seca; el prefermento, uno de la tabla; y unas horas que no son las suyas toman las primeras', () => {
  expect(completarPan({ levadura: 'masa-madre', prefermento: 'biga' })).toMatchObject({ levadura: 'fresca', prefermento: 'biga' });
  expect(completarPan({ prefermento: 'masa-madre', horasPrefermento: 12 })).toMatchObject({ prefermento: 'masa-madre', horasPrefermento: 0 });
  const poolish = horasDe('poolish');
  expect(completarPan({ prefermento: 'poolish', horasPrefermento: poolish.at(-1) })).toMatchObject({ prefermento: 'poolish', horasPrefermento: poolish.at(-1) });
  expect(completarPan({ prefermento: 'poolish', horasPrefermento: 0.5 })).toMatchObject({ prefermento: 'poolish', horasPrefermento: poolish[0] });
  // Un prefermento que no existe vuelve al del tipo; las horas del tipo valen sólo para su prefermento.
  expect(completarPan({ prefermento: 'sourdough' })).toMatchObject({ prefermento: PAN_POR_DEFECTO.prefermento, horasPrefermento: PAN_POR_DEFECTO.horasPrefermento });
  expect(completarPan({ pan: 'baguette', prefermento: 'biga' })).toMatchObject({ prefermento: 'biga', horasPrefermento: horasDe('biga')[0] });
});

it('pan: la temperatura es una de las franjas, o la de por defecto', () => {
  expect(completarPan({ temperatura: 'mas-24' }).temperatura).toBe('mas-24');
  expect(completarPan({ temperatura: 'tibio' }).temperatura).toBe(PAN_POR_DEFECTO.temperatura);
});
