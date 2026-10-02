import { it, expect } from 'vitest';
import { leerPedidoPan } from '../src/calculadoras/pan.js';
import { leerPedidoSal } from '../src/calculadoras/fermentados.js';

const completo = {
  pan: 'campo', harina: '000', segunda_harina: 'ninguna', prefermento: 'ninguno', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, harina_total: 500
};

it('con todo, sin mirar mayúsculas ni tildes', () => {
  expect(leerPedidoPan({ ...completo, pan: 'PAN DE CAMPO', fermentacion: 'frio', horas: 24 }))
    .toEqual({ datos: { pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 10, levadura: 'fresca',
      fermentacion: 'frio-24', cantidad: { de: 'harina', gramos: 500 }, prefermento: null, horasPrefermento: 0 } });
});

it('con segunda harina y la masa total', () => {
  const { harina_total: _, ...sinHarina } = completo;
  expect(leerPedidoPan({ ...sinHarina, segunda_harina: 'Centeno', porcentaje_segunda: 30, masa_total: 900 }))
    .toEqual({ datos: { pan: 'campo', harina: '000', segunda: 'centeno', porcentajeSegunda: 30, levadura: 'fresca',
      fermentacion: 'ambiente-8', cantidad: { de: 'masa', gramos: 900 }, prefermento: null, horasPrefermento: 0 } });
});

it('sólo con la harina y la cantidad: dice qué falta y las opciones; las horas, todavía no', () => {
  const r = leerPedidoPan({ harina: '000', harina_total: 500 });
  expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['pan', 'segunda_harina', 'prefermento', 'levadura', 'fermentacion']);
  expect('faltan' in r && r.faltan[2]!.opciones).toEqual(['Ninguno', 'Masa madre', 'Poolish', 'Biga', 'Pâte fermentée']);
  expect('faltan' in r && r.faltan[0]!.opciones).toContain('Pan de campo');
  expect('faltan' in r && r.faltan[1]!.opciones).toEqual(['Ninguna', '0000', '000 para pizza', 'Semolín', 'Integral', 'Centeno']);
});

it('con segunda harina sin porcentaje, falta el porcentaje', () => {
  const r = leerPedidoPan({ ...completo, segunda_harina: 'integral' });
  expect(r).toEqual({ faltan: [{ dato: 'porcentaje_segunda', opciones: ['10', '20', '30', '50'] }] });
});

it('masa madre con 2 h no vale, y ofrece las horas posibles', () => {
  const r = leerPedidoPan({ ...completo, prefermento: 'masa madre', horas: 2 });
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
  expect(leerPedidoSal({ fermento: 'pepinos', peso_total: 1200 })).toEqual({ datos: { fermento: 'pepinos', pesoTotal: 1200, temperatura: null } });
  expect(leerPedidoSal({ fermento: 'AJIES', peso_total: 1200 })).toEqual({ datos: { fermento: 'ajies', pesoTotal: 1200, temperatura: null } });
  expect(leerPedidoSal({ peso_total: 1200 })).toEqual({ faltan: [{ dato: 'fermento',
    opciones: ['Chucrut', 'Kimchi', 'Ajíes', 'Verduras en salmuera', 'Pepinos'] }] });
  expect(leerPedidoSal({ fermento: 'chucrut' })).toEqual({ faltan: [{ dato: 'peso_total', opciones: [] }] });
});

it('sal: la temperatura es opcional, por su nombre, y una que no es franja falta', () => {
  expect(leerPedidoSal({ fermento: 'kimchi', peso_total: 1000, temperatura: '18 a 24 °C' }))
    .toEqual({ datos: { fermento: 'kimchi', pesoTotal: 1000, temperatura: '18-24' } });
  expect(leerPedidoSal({ fermento: 'kimchi', peso_total: 1000, temperatura: '20 grados' })).toEqual({ faltan: [{ dato: 'temperatura',
    opciones: ['Menos de 13 °C', '13 a 18 °C', '18 a 24 °C', 'Más de 24 °C'] }] });
});

it('un dato que depende de otro que falta no se pide todavía', () => {
  // Sin la harina principal no se sabe qué segunda se puede ofrecer.
  const sinHarina = leerPedidoPan({ ...completo, harina: undefined, segunda_harina: undefined });
  expect('faltan' in sinHarina && sinHarina.faltan.map(f => f.dato)).toEqual(['harina']);
  // Sin el prefermento no se sabe si van las 2 h.
  const sinPrefermento = leerPedidoPan({ ...completo, prefermento: undefined, horas: undefined });
  expect('faltan' in sinPrefermento && sinPrefermento.faltan.map(f => f.dato)).toEqual(['prefermento']);
  const sinLevadura = leerPedidoPan({ ...completo, levadura: undefined });
  expect('faltan' in sinLevadura && sinLevadura.faltan.map(f => f.dato)).toEqual(['levadura']);
  // Sin el modo no se sabe qué horas ofrecer.
  const sinModo = leerPedidoPan({ ...completo, fermentacion: undefined, horas: undefined });
  expect('faltan' in sinModo && sinModo.faltan.map(f => f.dato)).toEqual(['fermentacion']);
});

it('con lo que se respondió, la vuelta siguiente pide lo que dependía de eso', () => {
  const r = leerPedidoPan({ ...completo, prefermento: 'masa madre', horas: undefined });
  expect(r).toEqual({ faltan: [{ dato: 'horas', opciones: ['4', '8'] }] });
});

it('pan: la masa madre es un prefermento y no pide levadura', () => {
  expect(leerPedidoPan({ ...completo, prefermento: 'Masa Madre', levadura: undefined }))
    .toEqual({ datos: expect.objectContaining({ prefermento: 'masa-madre', fermentacion: 'ambiente-8' }) });
  const sinNada = leerPedidoPan({ ...completo, prefermento: 'masa madre', levadura: undefined, fermentacion: undefined, horas: undefined });
  expect('faltan' in sinNada && sinNada.faltan.map(f => f.dato)).toEqual(['fermentacion']);
});

it('pan: una pizza se pide en bollos y gramos por bollo, con el sugerido como opción', () => {
  const pizza = { ...completo, pan: 'Pizza napolitana', harina_total: undefined };
  expect(leerPedidoPan({ ...pizza, bollos: 6, peso_bollo: 270 }))
    .toEqual({ datos: expect.objectContaining({ pan: 'napolitana', cantidad: { de: 'bollos', bollos: 6, gramos: 270 } }) });
  expect(leerPedidoPan({ ...pizza, bollos: 6 })).toEqual({ faltan: [{ dato: 'peso_bollo', opciones: ['250'] }] });
  expect(leerPedidoPan(pizza)).toEqual({ faltan: [{ dato: 'bollos', opciones: [] }, { dato: 'peso_bollo', opciones: ['250'] }] });
  // La harina total no sirve en una pizza.
  expect(leerPedidoPan({ ...pizza, harina_total: 500 })).toEqual({ faltan: [{ dato: 'bollos', opciones: [] }, { dato: 'peso_bollo', opciones: ['250'] }] });
});

it('pan: sin el pan no se pide la cantidad, porque depende de si es pizza', () => {
  const sinPan = leerPedidoPan({ ...completo, pan: undefined, harina_total: undefined });
  expect('faltan' in sinPan && sinPan.faltan.map(f => f.dato)).toEqual(['pan']);
});

it('pan: con poolish faltan sus horas, y no pide la fermentación de la masa final', () => {
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = completo;
  expect(leerPedidoPan({ ...sinFermentacion, prefermento: 'poolish' }))
    .toEqual({ faltan: [{ dato: 'horas_prefermento', opciones: ['8', '12', '18'] }] });
  expect(leerPedidoPan({ ...sinFermentacion, prefermento: 'Poolish', horas_prefermento: 12 }))
    .toEqual({ datos: expect.objectContaining({ prefermento: 'poolish', horasPrefermento: 12 }) });
  expect(leerPedidoPan({ ...sinFermentacion, prefermento: 'biga' }))
    .toEqual({ datos: expect.objectContaining({ prefermento: 'biga', horasPrefermento: 18 }) });
  expect(leerPedidoPan({ ...completo, prefermento: 'ninguno' })).toEqual({ datos: expect.objectContaining({ prefermento: null }) });
});

it('pan: la pâte fermentée sí pide la fermentación de la masa final', () => {
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = completo;
  const r = leerPedidoPan({ ...sinFermentacion, prefermento: 'pâte fermentée' });
  expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['fermentacion']);
});

it('pan: un prefermento que no es de la tabla falta con sus opciones, y la masa madre no es una levadura', () => {
  expect(leerPedidoPan({ ...completo, prefermento: 'levain' }))
    .toEqual({ faltan: [{ dato: 'prefermento', opciones: ['Ninguno', 'Masa madre', 'Poolish', 'Biga', 'Pâte fermentée'] }] });
  expect(leerPedidoPan({ ...completo, prefermento: 'biga', levadura: 'masa madre' }))
    .toEqual({ faltan: [{ dato: 'levadura', opciones: ['Fresca', 'Seca'] }] });
});
