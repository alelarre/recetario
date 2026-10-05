import { it, expect } from 'vitest';
import {
  leerPedidoPan, alElegirTipo, hidratacionAlCambiarHarinas, fermentacionesPara,
  PANES, PREFERMENTOS_CON_LEVADURA, FERMENTACIONES, PORCENTAJES_SEGUNDA, type PedidoPan, type ClavePan
} from '../src/calculadoras/pan.js';
import { leerPedidoSal, FERMENTOS } from '../src/calculadoras/fermentados.js';

// Lo que trae cada tipo y las opciones de cada dato se leen de las tablas:
// los tests prueban de dónde sale cada dato, no cuánto vale.
const panDe = (clave: ClavePan) => PANES.find(p => p.clave === clave)!;
const horasDe = (clave: 'poolish' | 'biga' | 'pate') => PREFERMENTOS_CON_LEVADURA.find(p => p.clave === clave)!.horas.map(h => h.horas);
const salDe = (clave: string) => FERMENTOS.find(f => f.clave === clave)!.sal;
const enFrio = FERMENTACIONES.filter(f => f.modo === 'frio');

const T = '18 a 24 °C';
/** Todos los datos dichos, sin tipo: no hay de dónde completar. */
const todo = {
  harina: '000', segunda_harina: 'ninguna', hidratacion: 72, prefermento: 'ninguno', levadura: 'fresca',
  fermentacion: 'ambiente', horas: 8, temperatura: T, harina_total: 500
};
const faltantes = (p: PedidoPan): string[] | null => {
  const r = leerPedidoPan(p);
  return 'faltan' in r ? r.faltan.map(f => f.dato) : null;
};
const datos = (p: PedidoPan) => {
  const r = leerPedidoPan(p);
  return 'datos' in r ? r.datos : null;
};

it('pan: con el tipo, la cantidad y la temperatura alcanza; lo demás es lo que trae el tipo', () => {
  expect(datos({ pan: 'PAN DE CAMPO', harina_total: 500, temperatura: T }))
    .toEqual(alElegirTipo({ pan: 'campo', cantidad: { de: 'harina', gramos: 500 }, temperatura: '18-24' }, 'campo'));
  expect(datos({ pan: 'baguette', masa_total: 900, temperatura: T }))
    .toEqual(alElegirTipo({ pan: 'baguette', cantidad: { de: 'masa', gramos: 900 }, temperatura: '18-24' }, 'baguette'));
  // Con biga, o con la masa en la heladera, no hace falta la temperatura.
  const ciabatta = panDe('ciabatta');
  expect(datos({ pan: 'ciabatta', prefermento: 'biga', harina_total: 500 }))
    .toMatchObject({ prefermento: 'biga', horasPrefermento: horasDe('biga')[0], hidratacion: ciabatta.hidratacion });
  const ny = panDe('new-york');
  expect(datos({ pan: 'pizza new york', fermentacion: 'frío', horas: enFrio[0]!.horas, bollos: 3 }))
    .toMatchObject({ harina: ny.harina, fermentacion: enFrio[0]!.clave, cantidad: { de: 'bollos', bollos: 3, gramos: ny.bollo } });
});

it('pan: lo que viene pisa lo que trae el tipo', () => {
  expect(datos({ pan: 'campo', prefermento: 'ninguno', levadura: 'Seca', fermentacion: 'frio', horas: 24, hidratacion: 65, harina_total: 500 }))
    .toMatchObject({ pan: 'campo', prefermento: null, levadura: 'seca', fermentacion: 'frio-24', hidratacion: 65 });
  expect(datos({ pan: 'frances', fermentacion: 'ambiente', horas: 8, harina_total: 500, temperatura: T })).toMatchObject({ fermentacion: 'ambiente-8' });
});

it('pan: la hidratación que no viene es la del tipo, corrida por las harinas pedidas', () => {
  const frances = { pan: 'pan francés', harina_total: 500, temperatura: T };
  const tipo = { ...panDe('frances'), segunda: null, porcentajeSegunda: 30 as const };
  expect(datos(frances)?.hidratacion).toBe(tipo.hidratacion);
  expect(datos({ ...frances, harina: 'integral' })?.hidratacion)
    .toBe(hidratacionAlCambiarHarinas(tipo, { harina: 'integral', segunda: null, porcentajeSegunda: 30 }));
  expect(datos({ ...frances, segunda_harina: 'Centeno', porcentaje_segunda: 30 })).toMatchObject({
    segunda: 'centeno', porcentajeSegunda: 30,
    hidratacion: hidratacionAlCambiarHarinas(tipo, { harina: tipo.harina, segunda: 'centeno', porcentajeSegunda: 30 })
  });
  // La que viene manda, sin correr.
  expect(datos({ ...frances, harina: 'integral', hidratacion: 70 })?.hidratacion).toBe(70);
  expect(leerPedidoPan({ ...frances, hidratacion: -3 })).toEqual({ faltan: [{ dato: 'hidratacion', opciones: [] }] });
});

it('pan: lo que depende de un dato cambiado no sale del tipo: se pide, con sus opciones', () => {
  const frances = { pan: 'frances', harina_total: 500, temperatura: T };
  expect(leerPedidoPan({ ...frances, segunda_harina: 'integral' }))
    .toEqual({ faltan: [{ dato: 'porcentaje_segunda', opciones: PORCENTAJES_SEGUNDA.map(String) }] });
  expect(leerPedidoPan({ ...frances, prefermento: 'poolish' }))
    .toEqual({ faltan: [{ dato: 'horas_prefermento', opciones: horasDe('poolish').map(String) }] });
  expect(leerPedidoPan({ ...frances, fermentacion: 'frío' }))
    .toEqual({ faltan: [{ dato: 'horas', opciones: enFrio.map(f => String(f.horas)) }] });
  // Unas horas sin cantidad de masa madre no van con ella.
  const sinMasaMadre = FERMENTACIONES.find(f => f.modo === 'ambiente' && f.masaMadre === null);
  if (sinMasaMadre) {
    expect(leerPedidoPan({ ...frances, prefermento: 'masa madre', fermentacion: 'ambiente', horas: sinMasaMadre.horas })).toEqual({ faltan: [{
      dato: 'horas', opciones: fermentacionesPara('masa-madre').filter(f => f.modo === 'ambiente').map(f => String(f.horas))
    }] });
  }
  // Las horas que vienen pisan las que trae el tipo para su prefermento.
  const ultimas = horasDe('poolish').at(-1)!;
  expect(datos({ pan: 'baguette', prefermento: 'poolish', horas_prefermento: ultimas, harina_total: 500, temperatura: T })?.horasPrefermento)
    .toBe(ultimas);
});

it('pan: un tipo que no existe se corrige antes que nada', () => {
  const r = leerPedidoPan({ pan: 'brioche', harina_total: 500 });
  expect('faltan' in r && r.faltan.map(f => f.dato)).toEqual(['pan']);
  expect('faltan' in r && r.faltan[0]!.opciones).toContain('Pan de campo');
});

it('pan: un valor que no es de la tabla es un faltante, aunque el tipo traiga el suyo', () => {
  expect(faltantes({ pan: 'campo', harina: 'de fuerza', harina_total: 500, temperatura: T })).toEqual(['harina']);
  expect(leerPedidoPan({ pan: 'campo', prefermento: 'levain', harina_total: 500, temperatura: T }))
    .toEqual({ faltan: [{ dato: 'prefermento', opciones: ['Ninguno', 'Masa madre', 'Poolish', 'Biga', 'Pâte fermentée'] }] });
  // La masa madre no es una levadura.
  expect(leerPedidoPan({ pan: 'frances', levadura: 'masa madre', harina_total: 500, temperatura: T }))
    .toEqual({ faltan: [{ dato: 'levadura', opciones: ['Fresca', 'Seca'] }] });
});

it('pan: sin tipo, con todos los datos, calcula', () => {
  expect(datos(todo)).toEqual({
    pan: null, harina: '000', segunda: null, porcentajeSegunda: 30, hidratacion: 72, prefermento: null, levadura: 'fresca',
    fermentacion: 'ambiente-8', temperatura: '18-24', cantidad: { de: 'harina', gramos: 500 }, horasPrefermento: 0
  });
  // La masa madre no pide levadura; el poolish no pide fermentación.
  expect(datos({ ...todo, prefermento: 'Masa Madre', levadura: undefined })).toMatchObject({ prefermento: 'masa-madre' });
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = todo;
  expect(datos({ ...sinFermentacion, prefermento: 'Poolish', horas_prefermento: 12 })).toMatchObject({ prefermento: 'poolish', horasPrefermento: 12 });
  // Sin tipo, los bollos valen si vienen con su peso.
  expect(datos({ ...todo, harina_total: undefined, bollos: 4, peso_bollo: 250 })?.cantidad).toEqual({ de: 'bollos', bollos: 4, gramos: 250 });
});

it('pan: sin tipo y con datos por completar, el tipo es lo primero que falta, y la cantidad espera', () => {
  const r = leerPedidoPan({ harina: '000', harina_total: 500 });
  expect('faltan' in r && r.faltan.map(f => f.dato))
    .toEqual(['pan', 'segunda_harina', 'hidratacion', 'prefermento', 'levadura', 'fermentacion', 'temperatura']);
  expect('faltan' in r && r.faltan[0]!.opciones).toContain('Pan de campo');
  expect('faltan' in r && r.faltan[1]!.opciones).toEqual(['Ninguna', '0000', '00', 'Semolín', 'Integral', 'Centeno']);
  // Sin nada: no se pide la cantidad, que depende de si el tipo es una pizza, ni las horas, que dependen del modo.
  expect(faltantes({})).toEqual(['pan', 'harina', 'hidratacion', 'prefermento', 'levadura', 'fermentacion', 'temperatura']);
  // Con todo menos la cantidad, se pide la cantidad.
  expect(leerPedidoPan({ ...todo, harina_total: undefined })).toEqual({ faltan: [{ dato: 'cantidad', opciones: ['harina_total', 'masa_total'] }] });
});

it('pan: las dos cantidades, o ninguna, es un faltante', () => {
  const campo = { pan: 'campo', temperatura: T };
  expect(leerPedidoPan({ ...campo, harina_total: 500, masa_total: 900 })).toEqual({ faltan: [{ dato: 'cantidad', opciones: ['harina_total', 'masa_total'] }] });
  expect(leerPedidoPan(campo)).toEqual({ faltan: [{ dato: 'cantidad', opciones: ['harina_total', 'masa_total'] }] });
});

it('pan: una pizza se pide en bollos; los gramos por bollo que no vienen son los del tipo', () => {
  const pizza = { pan: 'Pizza napolitana', fermentacion: 'ambiente', temperatura: T };
  const napolitana = panDe('napolitana');
  expect(datos({ ...pizza, bollos: 6 }))
    .toMatchObject({ pan: 'napolitana', harina: napolitana.harina, cantidad: { de: 'bollos', bollos: 6, gramos: napolitana.bollo } });
  expect(datos({ ...pizza, bollos: 6, peso_bollo: 270 })?.cantidad).toEqual({ de: 'bollos', bollos: 6, gramos: 270 });
  expect(leerPedidoPan(pizza)).toEqual({ faltan: [{ dato: 'bollos', opciones: [] }] });
  // La harina total no sirve en una pizza.
  expect(leerPedidoPan({ ...pizza, harina_total: 500 })).toEqual({ faltan: [{ dato: 'bollos', opciones: [] }] });
  expect(leerPedidoPan({ ...pizza, bollos: 6, peso_bollo: -1 })).toEqual({ faltan: [{ dato: 'peso_bollo', opciones: [String(napolitana.bollo)] }] });
});

it('pan: la pâte fermentée usa la fermentación de la masa final, que sale del tipo', () => {
  expect(datos({ pan: 'frances', prefermento: 'pâte fermentée', harina_total: 500, temperatura: T }))
    .toMatchObject({ prefermento: 'pate', horasPrefermento: horasDe('pate')[0], fermentacion: panDe('frances').fermentacion });
  const { fermentacion: _f, horas: _h, ...sinFermentacion } = todo;
  expect(faltantes({ ...sinFermentacion, prefermento: 'pâte fermentée' })).toEqual(['pan', 'fermentacion']);
});

it('pan: la temperatura del ambiente se pide si algo fermenta a temperatura ambiente, por su nombre', () => {
  const sinTemperatura = { ...todo, temperatura: undefined };
  expect(leerPedidoPan(sinTemperatura)).toEqual({ faltan: [{ dato: 'temperatura',
    opciones: ['Menos de 13 °C', '13 a 18 °C', '18 a 24 °C', 'Más de 24 °C'] }] });
  expect(datos({ ...todo, temperatura: 'más de 24 °c' })?.temperatura).toBe('mas-24');
  // En frío sin prefermento y con biga, no.
  const frio = enFrio[0]!.horas;
  expect(datos({ ...sinTemperatura, fermentacion: 'frío', horas: frio })).not.toBeNull();
  expect(datos({ ...sinTemperatura, prefermento: 'biga', fermentacion: undefined, horas: undefined })).not.toBeNull();
  // El poolish y la pâte fermentée fermentan a temperatura ambiente, aunque la masa vaya a la heladera.
  expect(faltantes({ ...sinTemperatura, prefermento: 'poolish', horas_prefermento: horasDe('poolish')[0], fermentacion: undefined, horas: undefined }))
    .toEqual(['temperatura']);
  expect(faltantes({ pan: 'frances', prefermento: 'pâte fermentée', fermentacion: 'frío', horas: frio, harina_total: 500 })).toEqual(['temperatura']);
});

it('pan: la 00, la 000 y la 0000 son tres harinas distintas, por su nombre exacto', () => {
  for (const [nombre, clave] of [['00', '00'], ['000', '000'], ['0000', '0000']] as const) {
    expect(datos({ ...todo, harina: nombre })?.harina).toBe(clave);
  }
});

it('sal: con el tipo, por su nombre, el porcentaje es el que sugiere; el que viene lo pisa', () => {
  expect(leerPedidoSal({ fermento: 'pepinos', peso_total: 1200 }))
    .toEqual({ datos: { fermento: 'pepinos', sal: salDe('pepinos'), pesoTotal: 1200, temperatura: null } });
  expect(leerPedidoSal({ fermento: 'AJIES', peso_total: 1200 }))
    .toEqual({ datos: { fermento: 'ajies', sal: salDe('ajies'), pesoTotal: 1200, temperatura: null } });
  expect(leerPedidoSal({ fermento: 'chucrut', porcentaje_sal: 2.5, peso_total: 1000 }))
    .toEqual({ datos: { fermento: 'chucrut', sal: 2.5, pesoTotal: 1000, temperatura: null } });
  expect(leerPedidoSal({ fermento: 'chucrut', porcentaje_sal: 0, peso_total: 1000 }))
    .toEqual({ faltan: [{ dato: 'porcentaje_sal', opciones: [] }] });
  // El peso no sale del tipo.
  expect(leerPedidoSal({ fermento: 'chucrut' })).toEqual({ faltan: [{ dato: 'peso_total', opciones: [] }] });
});

it('sal: sin tipo calcula si viene el porcentaje; si no, el tipo es lo primero que falta', () => {
  expect(leerPedidoSal({ porcentaje_sal: 4, peso_total: 1200 }))
    .toEqual({ datos: { fermento: null, sal: 4, pesoTotal: 1200, temperatura: null } });
  const opciones = ['Chucrut', 'Kimchi', 'Ajíes', 'Verduras en salmuera', 'Pepinos'];
  expect(leerPedidoSal({ peso_total: 1200 })).toEqual({ faltan: [{ dato: 'fermento', opciones }, { dato: 'porcentaje_sal', opciones: [] }] });
  // Un tipo que no existe se corrige antes que nada.
  expect(leerPedidoSal({ fermento: 'repollo' })).toEqual({ faltan: [{ dato: 'fermento', opciones }] });
});

it('sal: la temperatura es opcional, por su nombre, y una que no es franja falta', () => {
  expect(leerPedidoSal({ fermento: 'kimchi', peso_total: 1000, temperatura: '18 a 24 °C' }))
    .toEqual({ datos: { fermento: 'kimchi', sal: salDe('kimchi'), pesoTotal: 1000, temperatura: '18-24' } });
  expect(leerPedidoSal({ fermento: 'kimchi', peso_total: 1000, temperatura: '20 grados' })).toEqual({ faltan: [{ dato: 'temperatura',
    opciones: ['Menos de 13 °C', '13 a 18 °C', '18 a 24 °C', 'Más de 24 °C'] }] });
});
