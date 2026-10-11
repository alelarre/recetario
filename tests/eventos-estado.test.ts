import { describe, it, expect } from 'vitest';
import {
  valoresDe, estadoInicial, estadoInicialDeTipo, completarEvento, estadoDeTipo,
  conTipo, conDato, conCosa, conAdemas, conDatoDeAdemas, conReparto, conRepartoDe
} from '../src/eventos/estado.js';
import type { Ademas, Comunes, Dato, DatoPedido, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const nada = () => d(1);
const ADEMAS: Ademas = {
  id: 'hielo', nombre: 'Hielo', grupo: 'Además',
  datos: [{ id: 'enfriar', nombre: 'Enfriar', tipo: 'si-no', porDefecto: false }],
  calcular: () => ({ items: [], usados: [] })
};
const CON_ATAJO: TipoDeEvento = {
  id: 'uno', nombre: 'Uno',
  datos: [
    { id: 'menu', nombre: 'Menú', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] },
    { id: 'fiesta', nombre: 'Fiesta', tipo: 'si-no', porDefecto: false }
  ],
  grupos: [{ id: 'g', titulo: 'G', seReparte: true }],
  cosas: [
    { id: 'x', nombre: 'X', grupo: 'g', prendida: false, porcion: nada, unidad: 'unidad' },
    { id: 'y', nombre: 'Y', grupo: 'g', prendida: true, porcion: nada, unidad: 'unidad' },
    { id: 'z', nombre: 'Z', grupo: 'g', prendida: true, porcion: nada, unidad: 'unidad' }
  ],
  ademas: [{ ademas: ADEMAS, prendido: true }],
  atajo: { dato: 'menu', cosas: { a: ['x'], b: ['y'] } }
};
const BEBIDAS_DE_PRUEBA: Ademas = {
  id: 'bebidas', nombre: 'Bebidas', grupo: 'Bebidas',
  datos: [{ id: 'a', nombre: 'A', tipo: 'si-no', porDefecto: true }, { id: 'b', nombre: 'B', tipo: 'si-no', porDefecto: true },
          { id: 'c', nombre: 'C', tipo: 'si-no', porDefecto: false }],
  reparte: v => [['a', 'b', 'c'].filter(x => v[x] === true).map(x => `bebidas.${x}`)],
  calcular: () => ({ items: [], usados: [] })
};
const CON_BEBIDAS: TipoDeEvento = { ...CON_ATAJO, id: 'tres', nombre: 'Tres', ademas: [{ ademas: BEBIDAS_DE_PRUEBA, prendido: true }] };
const SIN_ATAJO: TipoDeEvento = { id: 'dos', nombre: 'Dos', datos: CON_ATAJO.datos, grupos: CON_ATAJO.grupos, cosas: CON_ATAJO.cosas, ademas: CON_ATAJO.ademas };
const TIPOS = [CON_ATAJO, SIN_ATAJO, CON_BEBIDAS];

describe('los datos de un tipo', () => {
  it('lo guardado que sigue valiendo se queda; lo demás vuelve a su valor por defecto', () => {
    const datos: DatoPedido[] = [
      { id: 'n', nombre: 'N', tipo: 'numero', porDefecto: 3 },
      { id: 'o', nombre: 'O', tipo: 'opcion', porDefecto: 'a', opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] },
      { id: 's', nombre: 'S', tipo: 'si-no', porDefecto: false }
    ];
    expect(valoresDe(datos, { n: 5, o: 'b', s: true })).toEqual({ n: 5, o: 'b', s: true });
    expect(valoresDe(datos, { n: -1, o: 'c', s: 'si' })).toEqual({ n: 3, o: 'a', s: false });
    expect(valoresDe(datos, null)).toEqual({ n: 3, o: 'a', s: false });
  });
});

describe('el estado inicial', () => {
  it('arranca en el primer tipo, sin personas y con las horas por defecto', () => {
    expect(estadoInicial(TIPOS, COMUNES)).toEqual({
      tipo: 'uno', adultos: null, chicos: null, horas: 4, calor: false, margen: 0,
      restricciones: { vegetariano: null, vegano: null, celiaco: null, 'sin-lactosa': null }, porTipo: {}
    });
  });

  it('lo inicial de un tipo aplica su atajo: prende las de la opción y apaga las demás que nombra', () => {
    expect(estadoInicialDeTipo(CON_ATAJO).cosas).toEqual({ x: true, y: false, z: true });
    expect(estadoInicialDeTipo(CON_ATAJO).ademas).toEqual({ hielo: { prendido: true, datos: { enfriar: false } } });
  });
});

describe('lo leído del teléfono', () => {
  it('sin nada, o roto, es el estado inicial', () => {
    expect(completarEvento(null, TIPOS, COMUNES)).toEqual(estadoInicial(TIPOS, COMUNES));
    expect(completarEvento('roto', TIPOS, COMUNES)).toEqual(estadoInicial(TIPOS, COMUNES));
  });

  it('un tipo que ya no existe vuelve al primero; un margen que no es uno de los tres, a cero', () => {
    const e = completarEvento({ tipo: 'viejo', margen: 15, adultos: -3, chicos: 2.5 }, TIPOS, COMUNES);
    expect([e.tipo, e.margen, e.adultos, e.chicos]).toEqual(['uno', 0, null, 2.5]);
  });

  it('el reparto guardado de cosas que existen, con números válidos', () => {
    expect(completarEvento({ porTipo: { uno: { reparto: { x: 0.5, y: -1, vieja: 0.3, z: 'mucho' } } } }, TIPOS, COMUNES).porTipo['uno']?.reparto)
      .toEqual({ x: 0.5 });
  });

  it('el reparto guardado de las bebidas se conserva; el de una bebida que no existe, no', () => {
    expect(completarEvento({ porTipo: { tres: { reparto: { 'bebidas.a': 0.6, 'bebidas.z': 0.4, 'otra.a': 1 } } } }, TIPOS, COMUNES).porTipo['tres']?.reparto)
      .toEqual({ 'bebidas.a': 0.6 });
  });

  it('las restricciones guardadas que valen se quedan; las demás, vacías', () => {
    expect(completarEvento({ restricciones: { vegetariano: 2, vegano: -1, celiaco: 'uno', otra: 3 } }, TIPOS, COMUNES).restricciones)
      .toEqual({ vegetariano: 2, vegano: null, celiaco: null, 'sin-lactosa': null });
  });

  it('sin horas guardadas, las de por defecto; vacías, quedan vacías', () => {
    expect(completarEvento({}, TIPOS, COMUNES).horas).toBe(4);
    expect(completarEvento({ horas: null }, TIPOS, COMUNES).horas).toBeNull();
  });

  it('una cosa o algo de lo que se suma que ya no existen se ignoran; una opción vieja vuelve a la de por defecto', () => {
    const e = completarEvento({
      porTipo: { uno: { datos: { menu: 'c' }, cosas: { y: true, vieja: true }, ademas: { vieja: { prendido: true }, hielo: { prendido: false, datos: { enfriar: true } } } } }
    }, TIPOS, COMUNES);
    expect(e.porTipo['uno']).toEqual({
      datos: { menu: 'a', fiesta: false },
      cosas: { x: true, y: true, z: true },
      reparto: {},
      ademas: { hielo: { prendido: false, datos: { enfriar: true } } }
    });
  });
});

describe('los cambios', () => {
  const inicial = estadoInicial(TIPOS, COMUNES);

  it('cambiar de tipo y volver conserva lo de cada tipo, y las personas', () => {
    let e: EstadoEvento = { ...conCosa(inicial, TIPOS, 'z', false), adultos: 8 };
    e = conTipo(e, TIPOS, 'dos');
    e = conCosa(e, TIPOS, 'x', true);
    e = conTipo(e, TIPOS, 'uno');
    expect(e.adultos).toBe(8);
    expect(estadoDeTipo(e, CON_ATAJO).cosas['z']).toBe(false);
    expect(e.porTipo['dos']?.cosas['x']).toBe(true);
  });

  it('un tipo que no existe no cambia nada', () => {
    expect(conTipo(inicial, TIPOS, 'otro')).toBe(inicial);
  });

  it('el dato del atajo prende y apaga sólo lo que el atajo nombra', () => {
    const e = conDato(conCosa(inicial, TIPOS, 'z', false), TIPOS, 'menu', 'b');
    expect(estadoDeTipo(e, CON_ATAJO).cosas).toEqual({ x: false, y: true, z: false });
  });

  it('otro dato no toca las cosas', () => {
    const e = conDato(inicial, TIPOS, 'fiesta', true);
    expect(estadoDeTipo(e, CON_ATAJO).datos['fiesta']).toBe(true);
    expect(estadoDeTipo(e, CON_ATAJO).cosas).toEqual(estadoInicialDeTipo(CON_ATAJO).cosas);
  });

  it('una cosa que no existe no cambia nada', () => {
    expect(estadoDeTipo(conCosa(inicial, TIPOS, 'nada', true), CON_ATAJO)).toEqual(estadoInicialDeTipo(CON_ATAJO));
  });

  it('un slider sube una cosa y las demás bajan en su proporción, sumando 100', () => {
    // x, y, z prendidas (el atajo de «a» prende x; y se prende a mano).
    const base = conCosa(inicial, TIPOS, 'y', true);
    let e = conReparto(base, TIPOS, 'g', 'x', 60);
    const r1 = estadoDeTipo(e, CON_ATAJO).reparto;
    expect([r1['x'], r1['y'], r1['z']].map(v => Math.round((v ?? 0) * 1000) / 1000)).toEqual([0.6, 0.2, 0.2]);
    e = conReparto(e, TIPOS, 'g', 'y', 30);
    const r2 = estadoDeTipo(e, CON_ATAJO).reparto;
    expect([r2['x'], r2['y'], r2['z']].map(v => Math.round((v ?? 0) * 1000) / 1000)).toEqual([0.525, 0.3, 0.175]);
    const r3 = estadoDeTipo(conReparto(e, TIPOS, 'g', 'x', 150), CON_ATAJO).reparto;
    expect([r3['x'], r3['y'], r3['z']]).toEqual([1, 0, 0]);
  });

  it('prender una cosa le borra la parte guardada: entra con la de un reparto parejo', () => {
    const e = conCosa(conReparto(conCosa(inicial, TIPOS, 'y', true), TIPOS, 'g', 'y', 80), TIPOS, 'y', false);
    expect(estadoDeTipo(conCosa(e, TIPOS, 'y', true), CON_ATAJO).reparto['y']).toBeUndefined();
  });

  it('un reparto fijo por porcentajes: lo que no se nombra se reparte lo que queda', () => {
    const e = conRepartoDe(conCosa(inicial, TIPOS, 'y', true), TIPOS, { x: 50 });
    expect(estadoDeTipo(e, CON_ATAJO).reparto).toEqual({ x: 0.5, y: 0.25, z: 0.25 });
  });

  it('el slider de una bebida reparte entre las de su grupo; prender una le borra la parte', () => {
    let e = conTipo(inicial, TIPOS, 'tres');
    e = conReparto(e, TIPOS, 'Bebidas', 'bebidas.a', 70);
    expect(estadoDeTipo(e, CON_BEBIDAS).reparto['bebidas.a']).toBe(0.7);
    expect(estadoDeTipo(e, CON_BEBIDAS).reparto['bebidas.b']).toBeCloseTo(0.3);
    e = conDatoDeAdemas(conDatoDeAdemas(e, TIPOS, 'bebidas', 'a', false), TIPOS, 'bebidas', 'a', true);
    expect(estadoDeTipo(e, CON_BEBIDAS).reparto['bebidas.a']).toBeUndefined();
  });

  it('un reparto fijo también vale para las bebidas', () => {
    const e = conRepartoDe(conTipo(inicial, TIPOS, 'tres'), TIPOS, { 'bebidas.a': 80 });
    expect(estadoDeTipo(e, CON_BEBIDAS).reparto).toEqual({ 'bebidas.a': 0.8, 'bebidas.b': 0.19999999999999996 });
  });

  it('lo que se suma después se apaga y se le cambian los datos', () => {
    let e = conAdemas(inicial, TIPOS, 'hielo', false);
    e = conDatoDeAdemas(e, TIPOS, 'hielo', 'enfriar', true);
    expect(estadoDeTipo(e, CON_ATAJO).ademas['hielo']).toEqual({ prendido: false, datos: { enfriar: true } });
  });
});
