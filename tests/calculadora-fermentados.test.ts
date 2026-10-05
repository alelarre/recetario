import { it, expect } from 'vitest';
import {
  calcularSal, cifrasSal, lineasSal, advertenciasSal, alElegirFermento, FERMENTOS, type DatosSal
} from '../src/calculadoras/fermentados.js';
import { TEMPERATURAS } from '../src/calculadoras/temperaturas.js';

const chucrut: DatosSal = { fermento: 'chucrut', sal: 2, pesoTotal: 1000, temperatura: '18-24' };
const salDe = (clave: string) => FERMENTOS.find(f => f.clave === clave)!.sal;

// Los días de la tabla se leen de ahí: una franja con dato y, si hay, una sin.
const franjas = FERMENTOS.flatMap(f => TEMPERATURAS.map(t => ({ fermento: f.clave, temperatura: t.clave, dias: f.dias[t.clave] })));
const conDato = franjas.find(x => x.dias)!;
const sinDato = franjas.find(x => !x.dias);
const enFranja = (x: { fermento: DatosSal['fermento']; temperatura: DatosSal['temperatura'] }): DatosSal =>
  ({ fermento: x.fermento, sal: 2, pesoTotal: 1000, temperatura: x.temperatura });
const rango = `${conDato.dias![0]} a ${conDato.dias![1]} días`;

it('1200 g al 3,5 % llevan 42 g de sal', () => {
  expect(calcularSal({ fermento: 'pepinos', sal: 3.5, pesoTotal: 1200, temperatura: null })).toEqual({ sal: 42, porcentaje: 3.5 });
});

it('la cuenta usa el porcentaje escrito, no el que sugiere el tipo; sin tipo calcula igual', () => {
  expect(calcularSal({ ...chucrut, sal: 2.5 })).toEqual({ sal: 25, porcentaje: 2.5 });
  expect(calcularSal({ ...chucrut, fermento: null, sal: 2.5 })).toEqual({ sal: 25, porcentaje: 2.5 });
});

it('elegir un tipo carga su porcentaje de sal; quedan el peso y la temperatura', () => {
  const tocado: DatosSal = { ...chucrut, sal: 5, pesoTotal: 800, temperatura: 'mas-24' };
  expect(alElegirFermento(tocado, 'pepinos')).toEqual({ fermento: 'pepinos', sal: salDe('pepinos'), pesoTotal: 800, temperatura: 'mas-24' });
  // Elegir de nuevo el mismo tipo también lo deja como viene.
  expect(alElegirFermento(tocado, 'chucrut').sal).toBe(salDe('chucrut'));
});

it.each([0, -1, Number.NaN])('peso %s: sin resultado', p => {
  expect(calcularSal({ ...chucrut, pesoTotal: p })).toBeNull();
});

it.each([0, -1, Number.NaN])('porcentaje de sal %s: sin resultado', s => {
  expect(calcularSal({ ...chucrut, sal: s })).toBeNull();
  expect(cifrasSal({ ...chucrut, sal: s }).map(l => l.valor)).toEqual(['—', '—']);
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
  expect(cifrasSal(chucrut)).toEqual([{ nombre: 'Sal', valor: '20 g' }, { nombre: 'Porcentaje', valor: '2 %' }]);
  expect(lineasSal(enFranja(conDato))).toEqual([{ nombre: 'Tiempo', valor: rango }]);
  expect(advertenciasSal(chucrut)).toEqual([expect.stringContaining('empezar a probar')]);
});

it('el tiempo es del tipo: no cambia con el porcentaje de sal, y sin tipo no hay', () => {
  expect(lineasSal({ ...enFranja(conDato), sal: 4 })).toEqual([{ nombre: 'Tiempo', valor: rango }]);
  expect(lineasSal({ ...chucrut, fermento: null })).toEqual([]);
  expect(advertenciasSal({ ...chucrut, fermento: null })).toEqual([]);
});

it.skipIf(!sinDato)('una franja sin dato lo dice, sin inventar', () => {
  expect(lineasSal(enFranja(sinDato!)).at(-1))
    .toEqual({ nombre: 'Tiempo', valor: 'sin dato a esta temperatura' });
});

it('sin temperatura, ni tiempo ni advertencia', () => {
  const d: DatosSal = { ...chucrut, temperatura: null };
  expect(cifrasSal(d).map(l => l.nombre)).toEqual(['Sal', 'Porcentaje']);
  expect(lineasSal(d)).toEqual([]);
  expect(cifrasSal({ ...d, pesoTotal: 0 }).map(l => l.valor)).toEqual(['—', '—']);
  expect(advertenciasSal(d)).toEqual([]);
});
