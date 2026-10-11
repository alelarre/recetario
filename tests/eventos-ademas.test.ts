import { describe, it, expect } from 'vitest';
import { bebidas, hielo, infusiones, combustible, type DatosBebidas, type DatosHielo, type DatosInfusiones, type DatosCombustible } from '../src/eventos/ademas.js';
import { calcularEvento } from '../src/eventos/evento.js';
import type { Calculado, Contexto, Dato, TipoDeEvento, Valores } from '../src/eventos/tipos.js';

const F = { nombre: 'F', url: 'https://f.com' };
const d = (valor: number): Dato => ({ valor, fuente: F });

const BEB: DatosBebidas = {
  bebidas: [
    { id: 'cerveza', nombre: 'Cerveza', alcohol: true, mlPorHora: d(300) },
    { id: 'vino', nombre: 'Vino', alcohol: true, mlPorHora: d(150) },
    { id: 'fernet', nombre: 'Fernet', alcohol: true, mlPorHora: d(100),
      con: { id: 'cola', nombre: 'Cola para el fernet', mlPorMl: d(3) } },
    { id: 'gaseosa', nombre: 'Gaseosa', alcohol: false, mlPorHora: d(200) },
    { id: 'agua', nombre: 'Agua', alcohol: false, mlPorHora: d(100) }
  ],
  horasPlenas: d(4), despues: d(0.5), calor: d(1.5), chico: d(2),
  brindis: { mlPorAdulto: d(100) }
};
const HIELO: DatosHielo = { kgPorPersona: d(0.5), kgPorLitroFrio: d(0.5), calor: d(1.3), bolsa: { kg: d(3), nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } } };
const INF: DatosInfusiones = {
  tazasPorPersona: { valor: 2, fuente: null, nota: 'Las tazas por persona son un supuesto.' },
  infusiones: [
    { id: 'cafe', nombre: 'Café', prendida: true, porTaza: d(10), unidad: 'g' },
    { id: 'te', nombre: 'Té', prendida: false, porTaza: d(1), unidad: 'saquitos' },
    { id: 'leche', nombre: 'Leche', prendida: false, porTaza: d(200), unidad: 'ml' }
  ]
};
const COMB: DatosCombustible = { carbonPorKgCarne: d(1), lenaPorKgCarne: d(2.5), vientoOFrio: d(1.3), bolsaCarbon: { kg: d(3), nombre: { uno: 'bolsa de 3 kg', varios: 'bolsas de 3 kg' } } };

const calc = (c: Partial<Contexto> = {}, extra: Partial<Calculado> = {}): Calculado => ({
  contexto: { adultos: 10, chicos: 0, personas: 10, horas: 4, calor: false, tipo: {}, ...c },
  margen: 1, carneG: 0, mlFrios: 0, reparto: {}, ...extra
});
const cantidades = (r: { items: readonly { id: string; cantidad: string }[] }) => Object.fromEntries(r.items.map(i => [i.id, i.cantidad]));
const solo = (...ids: string[]): Valores => Object.fromEntries(['cerveza', 'vino', 'fernet', 'gaseosa', 'agua', 'brindis'].map(id => [id, ids.includes(id)]));

describe('las bebidas', () => {
  const b = bebidas(BEB, ['cerveza']);

  it('las bebidas y las infusiones van en Bebidas; el hielo en Además; el carbón o la leña, en Para el fuego', () => {
    expect([b.grupo, hielo(HIELO).grupo, infusiones(INF).grupo, combustible(COMB).grupo]).toEqual(['Bebidas', 'Además', 'Bebidas', 'Para el fuego']);
  });

  it('piden los adultos que toman y un sí o no por bebida, prendidas las del tipo', () => {
    expect(b.datos.map(x => [x.id, x.porDefecto])).toEqual([
      ['toman', null], ['cerveza', true], ['vino', false], ['fernet', false], ['gaseosa', false], ['agua', false], ['brindis', false]
    ]);
  });

  it('una sola con alcohol: los que toman por las horas, en litros', () => {
    const r = b.calcular(calc(), solo('cerveza'));
    expect(cantidades(r)).toEqual({ cerveza: '12 l' });
    expect(r.mlFrios).toBe(12000);
  });

  it('dos con alcohol se reparten', () => {
    expect(cantidades(b.calcular(calc(), solo('cerveza', 'vino')))).toEqual({ cerveza: '6 l', vino: '3 l' });
  });

  it('los que toman: los escritos, nunca más que los adultos; vacío, todos', () => {
    expect(cantidades(b.calcular(calc(), { ...solo('cerveza'), toman: 4 }))).toEqual({ cerveza: '4,8 l' });
    expect(cantidades(b.calcular(calc(), { ...solo('cerveza'), toman: 20 }))).toEqual({ cerveza: '12 l' });
  });

  it('después de las horas plenas se toma menos; con calor, más', () => {
    expect(cantidades(b.calcular(calc({ horas: 6 }), solo('cerveza')))).toEqual({ cerveza: '15 l' });
    expect(cantidades(b.calcular(calc({ calor: true }), solo('cerveza')))).toEqual({ cerveza: '18 l' });
  });

  it('los chicos toman sólo sin alcohol, por su factor', () => {
    expect(cantidades(b.calcular(calc({ chicos: 5 }), solo('cerveza', 'gaseosa'))))
      .toEqual({ cerveza: '12 l', gaseosa: '16 l' });
  });

  it('el fernet suma su cola; el brindis va aparte, por adulto', () => {
    expect(cantidades(b.calcular(calc(), solo('fernet', 'brindis'))))
      .toEqual({ fernet: '4 l', cola: '12 l', brindis: '1 l' });
  });

  it('con el margen', () => {
    expect(cantidades(b.calcular(calc({}, { margen: 1.1 }), solo('cerveza')))).toEqual({ cerveza: '13,2 l' });
  });

  it('sin ninguna prendida, nada', () => {
    expect(b.calcular(calc(), solo())).toEqual({ items: [], usados: [], mlFrios: 0, reparto: {} });
  });

  it('se reparten en dos: las con alcohol y las sin alcohol, cada una con las prendidas', () => {
    expect(b.reparte?.(solo('cerveza', 'vino', 'gaseosa'))).toEqual([['bebidas.cerveza', 'bebidas.vino'], ['bebidas.gaseosa']]);
  });

  it('el reparto divide a los que toman: la gente queda fija y los litros siguen el ritmo de cada bebida', () => {
    const r = b.calcular(calc({}, { reparto: { 'bebidas.cerveza': 0.7, 'bebidas.vino': 0.3 } }), solo('cerveza', 'vino', 'gaseosa', 'agua'));
    expect(cantidades(r)).toEqual({ cerveza: '8,4 l', vino: '1,8 l', gaseosa: '4 l', agua: '2 l' });
    expect(r.reparto).toEqual({ 'bebidas.cerveza': 70, 'bebidas.vino': 30, 'bebidas.gaseosa': 50, 'bebidas.agua': 50 });
    expect(r.items.map(i => i.cosa)).toEqual(['bebidas.cerveza', 'bebidas.vino', 'bebidas.gaseosa', 'bebidas.agua']);
  });

  it('con una sola de las suyas no hay reparto; la cola y el brindis no llevan', () => {
    const r = b.calcular(calc(), solo('fernet', 'gaseosa', 'brindis'));
    expect(r.reparto).toEqual({});
    expect(r.items.find(i => i.id === 'cola')?.cosa).toBeUndefined();
  });
});

describe('el hielo', () => {
  const h = hielo(HIELO);
  it('por persona, chicos enteros; con calor, más', () => {
    expect(cantidades(h.calcular(calc({ chicos: 2 }), { enfriar: false }))).toEqual({ hielo: '6 kg · 2 bolsas de 3 kg' });
    expect(cantidades(h.calcular(calc({ calor: true }), { enfriar: false }))).toEqual({ hielo: '6,5 kg · 3 bolsas de 3 kg' });
  });
  it('para enfriar, suma por litro de bebida fría', () => {
    expect(cantidades(h.calcular(calc({}, { mlFrios: 12000 }), { enfriar: true }))).toEqual({ hielo: '11 kg · 4 bolsas de 3 kg' });
  });
});

describe('las infusiones', () => {
  const i = infusiones(INF);
  it('las tazas se reparten entre las prendidas, y cada una dice cuánto lleva', () => {
    expect(cantidades(i.calcular(calc(), { cafe: true, te: false, leche: false }))).toEqual({ cafe: '20 tazas · 200 g' });
    expect(cantidades(i.calcular(calc(), { cafe: true, te: true, leche: false })))
      .toEqual({ cafe: '10 tazas · 100 g', te: '10 tazas · 10 saquitos' });
    expect(cantidades(i.calcular(calc(), { cafe: false, te: false, leche: true }))).toEqual({ leche: '20 tazas · 4 l' });
  });
  it('el número sin fuente viaja con su nota', () => {
    expect(i.calcular(calc(), { cafe: true }).usados).toContain(INF.tazasPorPersona);
  });
});

describe('el carbón o la leña', () => {
  const c = combustible(COMB);
  it('sale de los kilos de carne', () => {
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'carbon', viento: false }))).toEqual({ carbon: '4,5 kg · 2 bolsas de 3 kg' });
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'lena', viento: false }))).toEqual({ lena: '11,3 kg' });
    expect(cantidades(c.calcular(calc({}, { carneG: 4500 }), { que: 'carbon', viento: true }))).toEqual({ carbon: '5,9 kg · 2 bolsas de 3 kg' });
  });
  it('sin carne en gramos, nada, y lo dice', () => {
    const r = c.calcular(calc(), { que: 'carbon', viento: false });
    expect(r.items).toEqual([]);
    expect(r.advertencias).toEqual(['Sin carne en gramos, el carbón o la leña no se calcula.']);
  });
});

describe('en el evento', () => {
  const TIPO: TipoDeEvento = {
    id: 'asado', nombre: 'Asado', datos: [],
    grupos: [{ id: 'carne', titulo: 'Carne', seReparte: true }],
    cosas: [{ id: 'vacio', nombre: 'Vacío', grupo: 'carne', prendida: true, porcion: () => d(450), unidad: 'g', carne: true }],
    ademas: [{ ademas: hielo(HIELO), prendido: true }, { ademas: combustible(COMB), prendido: true }, { ademas: bebidas(BEB, ['cerveza']), prendido: true }]
  };
  const COMUNES = { factorChico: d(0.5), horas: 4 };

  it('el carbón lee la carne, y el hielo lo que calcularon las bebidas aunque estén declaradas después', () => {
    const e = {
      tipo: 'asado', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0 as const, restricciones: { vegetariano: null, vegano: null, celiaco: null, 'sin-lactosa': null }, 
      porTipo: { asado: { datos: {}, cosas: {}, reparto: {}, ademas: { hielo: { prendido: true, datos: { enfriar: true } } } } }
    };
    const r = calcularEvento(e, [TIPO], COMUNES);
    expect(r?.ademas.map(g => [g.titulo, Object.fromEntries(g.items.map(i => [i.id, i.cantidad]))])).toEqual([
      ['Bebidas', { cerveza: '12 l' }],
      ['Además', { hielo: '11 kg · 4 bolsas de 3 kg' }],
      ['Para el fuego', { carbon: '4,5 kg · 2 bolsas de 3 kg' }]
    ]);
  });

  it('las advertencias de lo que se suma llegan al resultado', () => {
    const e = {
      tipo: 'asado', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0 as const, restricciones: { vegetariano: null, vegano: null, celiaco: null, 'sin-lactosa': null }, 
      porTipo: { asado: { datos: {}, cosas: { vacio: false }, reparto: {}, ademas: {} } }
    };
    expect(calcularEvento(e, [TIPO], COMUNES)?.advertencias).toContain('Sin carne en gramos, el carbón o la leña no se calcula.');
  });

  it('lo apagado no se calcula', () => {
    const e = {
      tipo: 'asado', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0 as const, restricciones: { vegetariano: null, vegano: null, celiaco: null, 'sin-lactosa': null }, 
      porTipo: { asado: { datos: {}, cosas: {}, reparto: {}, ademas: { hielo: { prendido: false, datos: {} }, combustible: { prendido: false, datos: {} }, bebidas: { prendido: false, datos: {} } } } }
    };
    expect(calcularEvento(e, [TIPO], COMUNES)?.ademas).toEqual([]);
  });
});
