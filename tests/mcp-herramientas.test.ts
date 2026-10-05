import { it, expect } from 'vitest';
import { calcularPanParaElAgente, calcularSalParaElAgente } from '../mcp/calculadoras.js';
import {
  lineasPan, lineasPrefermento, advertenciasPan, datosUsados, leerPedidoPan, calcularPan, alElegirTipo, type PedidoPan, type DatosPan
} from '../src/calculadoras/pan.js';
import { cifrasSal, lineasSal, alElegirFermento, type DatosSal } from '../src/calculadoras/fermentados.js';
import { gramos, porciento } from '../src/calculadoras/gramos.js';

/** Los datos que lee el pedido; los resultados se comparan con las cuentas de la app, no con números fijos. */
function leido(p: PedidoPan): DatosPan {
  const r = leerPedidoPan(p);
  if (!('datos' in r)) throw new Error('el pedido de prueba está incompleto');
  return r.datos;
}

const pedido = {
  pan: 'pan de campo', harina: '000', segunda_harina: 'ninguna', prefermento: 'ninguno', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, temperatura: '18 a 24 °C', harina_total: 1000
};

it('con todos los datos, el mismo resultado que la pantalla', () => {
  const datos = leido(pedido);
  const r = calcularPan(datos)!;
  expect(calcularPanParaElAgente(pedido)).toEqual({
    usado: datosUsados(datos),
    resultado: lineasPan(datos),
    harina_total: '1000 g',
    masa_total: `${gramos(r.masaTotal)} g`,
    hidratacion: porciento(r.hidratacion),
    advertencias: advertenciasPan(datos)
  });
});

it('con datos faltantes, qué falta y sus opciones', () => {
  expect(calcularPanParaElAgente({ harina: '000', harina_total: 500 })).toEqual(leerPedidoPan({ harina: '000', harina_total: 500 }));
});

it('sal: con datos y sin', () => {
  const pepinos = alElegirFermento({ pesoTotal: 1200, temperatura: null }, 'pepinos');
  expect(calcularSalParaElAgente({ fermento: 'pepinos', peso_total: 1200 }))
    .toEqual({ resultado: cifrasSal(pepinos), advertencias: [] });
  const kimchi: DatosSal = alElegirFermento({ pesoTotal: 1000, temperatura: 'mas-24' }, 'kimchi');
  expect(calcularSalParaElAgente({ fermento: 'kimchi', peso_total: 1000, temperatura: 'más de 24 °C' }))
    .toEqual({
      resultado: [...cifrasSal(kimchi), ...lineasSal(kimchi)],
      advertencias: [expect.stringContaining('empezar a probar')]
    });
  expect(calcularSalParaElAgente({ peso_total: 1200 })).toHaveProperty('faltan');
  // Sin tipo y con el porcentaje: la sal, sin tiempo aunque venga la temperatura.
  expect(calcularSalParaElAgente({ porcentaje_sal: 4, peso_total: 500, temperatura: 'más de 24 °C' }))
    .toEqual({ resultado: [{ nombre: 'Sal', valor: '20 g' }, { nombre: 'Porcentaje', valor: '4 %' }], advertencias: [] });
});

it('una pizza: la masa total sale de los bollos', () => {
  const r = calcularPanParaElAgente({ ...pedido, pan: 'pizza new york', harina_total: undefined, bollos: 2, peso_bollo: 380 });
  expect(r).toHaveProperty('masa_total', '760 g');
});

it('con prefermento, sus líneas aparte y el resultado de la masa final', () => {
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = pedido;
  const conBiga = { ...sinFermentacion, prefermento: 'biga' };
  const r = calcularPanParaElAgente(conBiga);
  expect(r).toHaveProperty('prefermento', lineasPrefermento(leido(conBiga)));
  expect(r).toHaveProperty('resultado', lineasPan(leido(conBiga)));
  expect(r).toHaveProperty('masa_total', `${gramos(calcularPan(leido(conBiga))!.masaTotal)} g`);
});

it('sólo con el tipo, la cantidad y la temperatura: calcula con lo que trae el tipo, y dice con qué', () => {
  const r = calcularPanParaElAgente({ pan: 'baguette', harina_total: 1000, temperatura: '18 a 24 °C' });
  const baguette = alElegirTipo({ pan: 'baguette', cantidad: { de: 'harina', gramos: 1000 }, temperatura: '18-24' }, 'baguette');
  expect(r).toHaveProperty('usado', datosUsados(baguette));
  expect(r).toHaveProperty('hidratacion', porciento(baguette.hidratacion));
  // El prefermento que trae el tipo, con sus líneas aparte.
  expect('prefermento' in r).toBe(lineasPrefermento(baguette).length > 0);
});
