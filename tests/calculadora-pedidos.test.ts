import { it, expect } from 'vitest';
import { leerPedidoPan } from '../src/calculadoras/pan.js';
import { leerPedidoSal } from '../src/calculadoras/fermentados.js';

const completo = {
  pan: 'campo', harina: '000', segunda_harina: 'ninguna', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, harina_total: 500
};

it('con todo, sin mirar mayúsculas ni tildes', () => {
  expect(leerPedidoPan({ ...completo, pan: 'PAN DE CAMPO', fermentacion: 'frio', horas: 24 }))
    .toEqual({ datos: { pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 10, levadura: 'fresca',
      fermentacion: 'frio-24', cantidad: { de: 'harina', gramos: 500 } } });
});

it('con segunda harina y la masa total', () => {
  const { harina_total: _, ...sinHarina } = completo;
  expect(leerPedidoPan({ ...sinHarina, segunda_harina: 'Centeno', porcentaje_segunda: 30, masa_total: 900 }))
    .toEqual({ datos: { pan: 'campo', harina: '000', segunda: 'centeno', porcentajeSegunda: 30, levadura: 'fresca',
      fermentacion: 'ambiente-8', cantidad: { de: 'masa', gramos: 900 } } });
});

it('sólo con la harina y la cantidad: dice qué falta y las opciones; las horas, todavía no', () => {
  const r = leerPedidoPan({ harina: '000', harina_total: 500 });
  expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['pan', 'segunda_harina', 'levadura', 'fermentacion']);
  expect('faltan' in r && r.faltan[0]!.opciones).toContain('Pan de campo');
  expect('faltan' in r && r.faltan[1]!.opciones).toEqual(['Ninguna', '0000', '000 para pizza', 'Semolín', 'Integral', 'Centeno']);
});

it('con segunda harina sin porcentaje, falta el porcentaje', () => {
  const r = leerPedidoPan({ ...completo, segunda_harina: 'integral' });
  expect(r).toEqual({ faltan: [{ dato: 'porcentaje_segunda', opciones: ['10', '20', '30', '50'] }] });
});

it('masa madre con 2 h no vale, y ofrece las horas posibles', () => {
  const r = leerPedidoPan({ ...completo, levadura: 'masa madre', horas: 2 });
  expect(r).toEqual({ faltan: [{ dato: 'horas', opciones: ['4', '8'] }] });
});

it('las dos cantidades, o ninguna, es un faltante', () => {
  expect(leerPedidoPan({ ...completo, masa_total: 900 })).toEqual({ faltan: [{ dato: 'cantidad', opciones: ['harina_total', 'masa_total'] }] });
  const { harina_total: _, ...sinCantidad } = completo;
  expect(leerPedidoPan(sinCantidad)).toEqual({ faltan: [{ dato: 'cantidad', opciones: ['harina_total', 'masa_total'] }] });
});

it('un valor que no es de la tabla es un faltante', () => {
  const r = leerPedidoPan({ ...completo, pan: 'brioche' });
  expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['pan']);
});

it('sal: el fermento por su nombre', () => {
  expect(leerPedidoSal({ fermento: 'pepinos', peso_total: 1200 })).toEqual({ datos: { fermento: 'pepinos', pesoTotal: 1200 } });
  expect(leerPedidoSal({ fermento: 'AJIES', peso_total: 1200 })).toEqual({ datos: { fermento: 'ajies', pesoTotal: 1200 } });
  expect(leerPedidoSal({ peso_total: 1200 })).toEqual({ faltan: [{ dato: 'fermento',
    opciones: ['Chucrut', 'Kimchi', 'Ajíes', 'Verduras en salmuera', 'Pepinos'] }] });
  expect(leerPedidoSal({ fermento: 'chucrut' })).toEqual({ faltan: [{ dato: 'peso_total', opciones: [] }] });
});

it('un dato que depende de otro que falta no se pide todavía', () => {
  // Sin la harina principal no se sabe qué segunda se puede ofrecer.
  const sinHarina = leerPedidoPan({ pan: 'campo', levadura: 'fresca', fermentacion: 'ambiente', horas: 8, harina_total: 500 });
  expect('faltan' in sinHarina && sinHarina.faltan.map(f => f.dato)).toEqual(['harina']);
  // Sin la levadura no se sabe si van las 2 h.
  const sinLevadura = leerPedidoPan({ ...completo, levadura: undefined, horas: undefined });
  expect('faltan' in sinLevadura && sinLevadura.faltan.map(f => f.dato)).toEqual(['levadura']);
  // Sin el modo no se sabe qué horas ofrecer.
  const sinModo = leerPedidoPan({ ...completo, fermentacion: undefined, horas: undefined });
  expect('faltan' in sinModo && sinModo.faltan.map(f => f.dato)).toEqual(['fermentacion']);
});

it('con lo que se respondió, la vuelta siguiente pide lo que dependía de eso', () => {
  const r = leerPedidoPan({ ...completo, levadura: 'masa madre', horas: undefined });
  expect(r).toEqual({ faltan: [{ dato: 'horas', opciones: ['4', '8'] }] });
});
