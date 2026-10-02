import { it, expect } from 'vitest';
import { calcularPanParaElAgente, calcularSalParaElAgente } from '../mcp/calculadoras.js';
import { lineasPan, advertenciasPan, datosUsados, leerPedidoPan } from '../src/calculadoras/pan.js';
import { cifrasSal, lineasSal, type DatosSal } from '../src/calculadoras/fermentados.js';

const pedido = {
  pan: 'pan de campo', harina: '000', segunda_harina: 'ninguna', prefermento: 'ninguno', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, temperatura: '18 a 24 °C', harina_total: 1000
};

it('con todos los datos, el mismo resultado que la pantalla', () => {
  const datos = leerPedidoPan(pedido);
  if (!('datos' in datos)) throw new Error('el pedido de prueba está incompleto');
  expect(calcularPanParaElAgente(pedido)).toEqual({
    usado: datosUsados(datos.datos),
    resultado: lineasPan(datos.datos),
    harina_total: '1000 g',
    masa_total: '1745 g',
    hidratacion: '72 %',
    advertencias: advertenciasPan(datos.datos)
  });
});

it('con datos faltantes, qué falta y sus opciones', () => {
  expect(calcularPanParaElAgente({ harina: '000', harina_total: 500 })).toEqual(leerPedidoPan({ harina: '000', harina_total: 500 }));
});

it('sal: con datos y sin', () => {
  expect(calcularSalParaElAgente({ fermento: 'pepinos', peso_total: 1200 }))
    .toEqual({ resultado: [{ nombre: 'Sal', valor: '42 g' }, { nombre: 'Porcentaje', valor: '3,5 %' }], advertencias: [] });
  const kimchi: DatosSal = { fermento: 'kimchi', pesoTotal: 1000, temperatura: 'mas-24' };
  expect(calcularSalParaElAgente({ fermento: 'kimchi', peso_total: 1000, temperatura: 'más de 24 °C' }))
    .toEqual({
      resultado: [...cifrasSal(kimchi), ...lineasSal(kimchi)],
      advertencias: [expect.stringContaining('empezar a probar')]
    });
  expect(calcularSalParaElAgente({ peso_total: 1200 })).toHaveProperty('faltan');
});

it('una pizza: la masa total sale de los bollos', () => {
  const r = calcularPanParaElAgente({ ...pedido, pan: 'pizza new york', harina_total: undefined, bollos: 2, peso_bollo: 380 });
  expect(r).toHaveProperty('masa_total', '760 g');
});

it('con prefermento, sus líneas aparte y el resultado de la masa final', () => {
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = pedido;
  const r = calcularPanParaElAgente({ ...sinFermentacion, prefermento: 'biga' });
  expect(r).toHaveProperty('prefermento', [
    { nombre: 'Harina 000', valor: '400 g' }, { nombre: 'Agua', valor: '176 g' }, { nombre: 'Levadura fresca', valor: '4,0 g' }
  ]);
  expect(r).toHaveProperty('masa_total', '1744 g');
});

it('sólo con el tipo, la cantidad y la temperatura: calcula con lo que trae el tipo, y dice con qué', () => {
  const r = calcularPanParaElAgente({ pan: 'baguette', harina_total: 1000, temperatura: '18 a 24 °C' });
  expect(r).toHaveProperty('usado', [
    { nombre: 'Tipo', valor: 'Baguette' }, { nombre: 'Harina', valor: '000' }, { nombre: 'Hidratación', valor: '68 %' },
    { nombre: 'Prefermento', valor: 'Poolish, 12 h' }, { nombre: 'Levadura', valor: 'Fresca' },
    { nombre: 'Temperatura ambiente', valor: '18 a 24 °C' }
  ]);
  expect(r).toHaveProperty('hidratacion', '68 %');
  expect(r).toHaveProperty('prefermento');
});
