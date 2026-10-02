import { it, expect } from 'vitest';
import { calcularPanParaElAgente, calcularSalParaElAgente } from '../mcp/calculadoras.js';
import { lineasPan, advertenciasPan, leerPedidoPan } from '../src/calculadoras/pan.js';
import { lineasSal } from '../src/calculadoras/fermentados.js';

const pedido = {
  pan: 'pan de campo', harina: '000', segunda_harina: 'ninguna', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, harina_total: 1000
};

it('con todos los datos, el mismo resultado que la pantalla', () => {
  const datos = leerPedidoPan(pedido);
  if (!('datos' in datos)) throw new Error('el pedido de prueba está incompleto');
  expect(calcularPanParaElAgente(pedido)).toEqual({
    resultado: lineasPan(datos.datos),
    harina_total: '1000 g',
    masa_total: '1745 g',
    advertencias: advertenciasPan(datos.datos)
  });
});

it('con datos faltantes, qué falta y sus opciones', () => {
  expect(calcularPanParaElAgente({ harina: '000', harina_total: 500 })).toEqual(leerPedidoPan({ harina: '000', harina_total: 500 }));
});

it('sal: con datos y sin', () => {
  expect(calcularSalParaElAgente({ fermento: 'pepinos', peso_total: 1200 }))
    .toEqual({ resultado: lineasSal({ fermento: 'pepinos', pesoTotal: 1200, temperatura: null }), advertencias: [] });
  expect(calcularSalParaElAgente({ fermento: 'kimchi', peso_total: 1000, temperatura: 'más de 24 °C' }))
    .toEqual({
      resultado: lineasSal({ fermento: 'kimchi', pesoTotal: 1000, temperatura: 'mas-24' }),
      advertencias: [expect.stringContaining('empezar a probar')]
    });
  expect(calcularSalParaElAgente({ peso_total: 1200 })).toHaveProperty('faltan');
});
