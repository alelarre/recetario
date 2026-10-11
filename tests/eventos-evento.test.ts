import { describe, it, expect } from 'vitest';
import { calcularEvento, textoEvento, porTramo, soloDatos } from '../src/eventos/evento.js';
import type { Comunes, Dato, EstadoEvento, TipoDeEvento, Valores } from '../src/eventos/tipos.js';

const F = { nombre: 'F', url: 'https://f.com' };
const G = { nombre: 'G', url: 'https://g.com' };
const d = (valor: number, fuente = F): Dato => ({ valor, fuente });
const COMUNES: Comunes = { factorChico: d(0.5, G), horas: 4 };

const PRUEBA: TipoDeEvento = {
  id: 'prueba', nombre: 'Prueba',
  datos: [{ id: 'fiesta', nombre: 'Fiesta', tipo: 'si-no', porDefecto: false }],
  grupos: [
    { id: 'comer', titulo: 'Para comer', seReparte: true, factores: c => (c.tipo['fiesta'] === true ? [d(2)] : []) },
    { id: 'parrilla', titulo: 'Parrilla', seReparte: true },
    { id: 'aparte', titulo: 'Aparte', seReparte: false }
  ],
  cosas: [
    { id: 'empanadas', nombre: 'Empanadas', grupo: 'comer', prendida: true, porcion: () => d(6), unidad: 'unidad', docenas: true, aptaPara: [] },
    { id: 'pizza', nombre: 'Pizza', grupo: 'comer', prendida: false, porcion: () => d(4), unidad: 'unidad', nombreUnidad: 'porciones', aptaPara: ['vegetariano'],
      envase: { cantidad: d(8), nombre: { uno: 'pizza', varios: 'pizzas' } } },
    { id: 'carne', nombre: 'Carne', grupo: 'comer', prendida: false, porcion: () => d(300), unidad: 'g', carne: true },
    { id: 'tira', nombre: 'Tira', grupo: 'parrilla', prendida: false, porcion: () => d(600), unidad: 'g', carne: true },
    { id: 'pollo', nombre: 'Pollo', grupo: 'parrilla', prendida: false, porcion: () => d(300), unidad: 'g', carne: true },
    { id: 'torta', nombre: 'Torta', grupo: 'aparte', prendida: false, porcion: () => d(100), unidad: 'g', chicoEntero: true, aptaPara: ['vegetariano', 'celiaco'] },
    { id: 'helado', nombre: 'Helado', grupo: 'aparte', prendida: false, porcion: () => ({ valor: 250, fuente: null, nota: 'El helado es un supuesto.' }), unidad: 'ml' },
    { id: 'bocados', nombre: 'Bocados', grupo: 'aparte', prendida: false, porcion: c => d(c.horas), unidad: 'unidad' },
    { id: 'picada', nombre: 'Picada', grupo: 'aparte', prendida: false,
      partes: [{ id: 'quesos', nombre: 'Quesos', porcion: () => d(50) }, { id: 'pan', nombre: 'Pan', porcion: () => d(30) }] }
  ],
  ademas: [],
  cifra: { grupo: 'comer', nombre: 'Para comer' }
};
const TIPOS = [PRUEBA];

const evento = (cambios: Partial<EstadoEvento> = {}, cosas: Record<string, boolean> = {}, datos: Valores = {}): EstadoEvento => ({
  tipo: 'prueba', adultos: 10, chicos: 0, horas: 4, calor: false, margen: 0, restricciones: { vegetariano: null, vegano: null, celiaco: null, 'sin-lactosa': null }, 
  porTipo: { prueba: { datos, cosas, reparto: {}, ademas: {} } }, ...cambios
});
const cantidades = (e: EstadoEvento): Record<string, string> =>
  Object.fromEntries((calcularEvento(e, TIPOS, COMUNES)?.grupos ?? []).flatMap(g => g.items.map(i => [i.id, i.cantidad])));

describe('la cuenta común', () => {
  it('una cosa sola lleva su porción entera', () => {
    expect(cantidades(evento())).toEqual({ empanadas: '60 (5 docenas)' });
  });

  it('dos cosas del mismo grupo se reparten la porción', () => {
    expect(cantidades(evento({}, { pizza: true }))).toEqual({ empanadas: '30 (2 ½ docenas)', pizza: '3 pizzas (20 porciones)' });
  });

  it('tres cosas, un tercio cada una', () => {
    expect(cantidades(evento({}, { pizza: true, carne: true })))
      .toEqual({ empanadas: '24 (2 docenas)', pizza: '2 pizzas (14 porciones)', carne: '1 kg' });
  });

  it('en un grupo que no se reparte, cada cosa lleva su porción entera', () => {
    expect(cantidades(evento({}, { empanadas: false, torta: true, helado: true }))).toEqual({ torta: '1 kg', helado: '2,5 l' });
  });

  it('un chico cuenta por su factor; en la torta, entero', () => {
    expect(cantidades(evento({ chicos: 4 }, { torta: true }))).toEqual({ empanadas: '72 (6 docenas)', torta: '1,4 kg' });
  });

  it('los factores del grupo lo multiplican', () => {
    expect(cantidades(evento({}, {}, { fiesta: true }))).toEqual({ empanadas: '120 (10 docenas)' });
  });

  it('el margen va sobre todo', () => {
    expect(cantidades(evento({ margen: 10 }))).toEqual({ empanadas: '66 (5 ½ docenas)' });
  });

  it('una cosa con partes sale en gramos de cada parte', () => {
    expect(cantidades(evento({}, { empanadas: false, picada: true }))).toEqual({ 'picada-quesos': '500 g', 'picada-pan': '300 g' });
  });

  it('sin horas, o en cero, calcula con las horas por defecto', () => {
    const solo = { empanadas: false, bocados: true };
    expect(cantidades(evento({ horas: null }, solo))).toEqual({ bocados: '40' });
    expect(cantidades(evento({ horas: 0 }, solo))).toEqual({ bocados: '40' });
    expect(cantidades(evento({ horas: 2 }, solo))).toEqual({ bocados: '20' });
  });

  it('con decimales no hay NaN ni Infinity', () => {
    const r = calcularEvento(evento({ adultos: 2.5, chicos: 1.5 }, { pizza: true, carne: true, torta: true }), TIPOS, COMUNES);
    expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity/);
  });

  it('sin personas, con todo apagado o con un tipo que no existe, no hay resultado', () => {
    expect(calcularEvento(evento({ adultos: null, chicos: null }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({ adultos: 0 }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({}, { empanadas: false }), TIPOS, COMUNES)).toBeNull();
    expect(calcularEvento(evento({ tipo: 'otro' }), TIPOS, COMUNES)).toBeNull();
  });

  it('las cifras: las personas, y los gramos del grupo de la cifra', () => {
    expect(calcularEvento(evento({ chicos: 2 }, { carne: true }), TIPOS, COMUNES)?.cifras)
      .toEqual([{ nombre: 'Personas', valor: '12' }, { nombre: 'Para comer', valor: '1,7 kg' }]);
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.cifras).toEqual([{ nombre: 'Personas', valor: '10' }]);
  });

  it('el título dice cuántos son, y adultos y chicos si hay chicos', () => {
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.titulo).toBe('Prueba para 10');
    expect(calcularEvento(evento({ chicos: 4 }), TIPOS, COMUNES)?.titulo).toBe('Prueba para 14 (10 adultos, 4 chicos)');
    expect(calcularEvento(evento({ adultos: 1, chicos: 1 }), TIPOS, COMUNES)?.titulo).toBe('Prueba para 2 (1 adulto, 1 chico)');
    const conDecimales = calcularEvento(evento({ adultos: 0.1, chicos: 0.2 }), TIPOS, COMUNES);
    expect(conDecimales?.titulo).toBe('Prueba para 0,3 (0,1 adultos, 0,2 chicos)');
    expect(conDecimales?.cifras[0]).toEqual({ nombre: 'Personas', valor: '0,3' });
  });

  it('las fuentes de los números usados, una vez cada una; la nota de los que van sin fuente, como advertencia', () => {
    const r = calcularEvento(evento({ chicos: 2 }, { pizza: true, helado: true }), TIPOS, COMUNES);
    expect(r?.fuentes).toEqual([G, F]);
    expect(r?.advertencias).toEqual(['El helado es un supuesto.']);
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.fuentes).toEqual([F]);
  });

  it('avisa por cada grupo sin nada apto para cada restricción con invitados; no toca las cantidades', () => {
    const con = (cosas: Record<string, boolean>) => evento({ restricciones: { vegetariano: 2, vegano: null, celiaco: 1, 'sin-lactosa': 0 } }, cosas);
    expect(calcularEvento(con({ torta: true }), TIPOS, COMUNES)?.advertencias).toEqual([
      'Para comer: nada apto para 2 vegetarianos.',
      'Para comer: nada apto para 1 celíaco.'
    ]);
    expect(calcularEvento(con({ torta: true, pizza: true }), TIPOS, COMUNES)?.advertencias).toEqual(['Para comer: nada apto para 1 celíaco.']);
    expect(cantidades(con({ torta: true }))).toEqual(cantidades(evento({}, { torta: true })));
    expect(calcularEvento(evento({}, { torta: true }), TIPOS, COMUNES)?.advertencias).toEqual([]);
  });

  it('en un grupo de una sola unidad hay un total, y el reparto lo divide sin cambiarlo', () => {
    const parrilla = { empanadas: false, tira: true, pollo: true };
    const parejo = calcularEvento(evento({}, parrilla), TIPOS, COMUNES)?.grupos[0];
    expect(parejo).toMatchObject({ id: 'parrilla', titulo: 'Parrilla', total: '4,5 kg', reparto: { tira: 50, pollo: 50 } });
    expect(cantidades(evento({}, parrilla))).toEqual({ tira: '2,3 kg', pollo: '2,3 kg' });
    const e = evento({ porTipo: { prueba: { datos: {}, cosas: parrilla, reparto: { tira: 0.8, pollo: 0.2 }, ademas: {} } } });
    expect(calcularEvento(e, TIPOS, COMUNES)?.grupos[0]).toMatchObject({ total: '4,5 kg', reparto: { tira: 80, pollo: 20 } });
    expect(cantidades(e)).toEqual({ tira: '3,6 kg', pollo: '900 g' });
  });

  it('en un grupo que mezcla unidades, el reparto es un porcentaje de la porción de cada cosa, sin total', () => {
    const e = evento({ porTipo: { prueba: { datos: {}, cosas: { pizza: true }, reparto: { empanadas: 0.6, pizza: 0.4 }, ademas: {} } } });
    const g = calcularEvento(e, TIPOS, COMUNES)?.grupos[0];
    expect(g?.total).toBeUndefined();
    expect(g?.reparto).toEqual({ empanadas: 60, pizza: 40 });
    expect(cantidades(e)).toEqual({ empanadas: '36 (3 docenas)', pizza: '2 pizzas (16 porciones)' });
  });

  it('con una sola cosa en el grupo no hay reparto', () => {
    expect(calcularEvento(evento(), TIPOS, COMUNES)?.grupos[0]?.reparto).toBeUndefined();
  });

  it('el texto para mandar', () => {
    const r = calcularEvento(evento({}, { torta: true }), TIPOS, COMUNES);
    expect(r && textoEvento(r)).toBe('Prueba para 10\n\nPara comer\n- Empanadas: 60 (5 docenas)\n\nAparte\n- Torta: 1 kg');
  });
});

describe('las ayudas de los tipos', () => {
  it('el tramo de las horas: el primero que las alcanza; el último, sin tope', () => {
    const tramos = [{ hastaHoras: 2, factor: d(0.75) }, { hastaHoras: 4, factor: null }, { hastaHoras: null, factor: d(1.25) }];
    expect(porTramo(tramos, 1)?.valor).toBe(0.75);
    expect(porTramo(tramos, 2)?.valor).toBe(0.75);
    expect(porTramo(tramos, 3)).toBeNull();
    expect(porTramo(tramos, 9)?.valor).toBe(1.25);
  });

  it('soloDatos saca los nulos', () => {
    expect(soloDatos(null, d(2), null).map(x => x.valor)).toEqual([2]);
  });
});
