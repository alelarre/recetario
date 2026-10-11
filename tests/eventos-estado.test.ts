import { describe, it, expect } from 'vitest';
import {
  valoresDe, estadoInicial, estadoInicialDeTipo, completarEvento, estadoDeTipo,
  conTipo, conDato, conCosa, conAdemas, conDatoDeAdemas
} from '../src/eventos/estado.js';
import type { Ademas, Comunes, Dato, DatoPedido, EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const d = (valor: number): Dato => ({ valor, fuente: { nombre: 'F', url: 'https://f.com' } });
const COMUNES: Comunes = { factorChico: d(0.5), horas: 4 };
const nada = () => d(1);
const ADEMAS: Ademas = {
  id: 'hielo', nombre: 'Hielo',
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
const SIN_ATAJO: TipoDeEvento = { id: 'dos', nombre: 'Dos', datos: CON_ATAJO.datos, grupos: CON_ATAJO.grupos, cosas: CON_ATAJO.cosas, ademas: CON_ATAJO.ademas };
const TIPOS = [CON_ATAJO, SIN_ATAJO];

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
    expect(estadoInicial(TIPOS, COMUNES)).toEqual({ tipo: 'uno', adultos: null, chicos: null, horas: 4, calor: false, margen: 0, porTipo: {} });
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

  it('lo que se suma después se apaga y se le cambian los datos', () => {
    let e = conAdemas(inicial, TIPOS, 'hielo', false);
    e = conDatoDeAdemas(e, TIPOS, 'hielo', 'enfriar', true);
    expect(estadoDeTipo(e, CON_ATAJO).ademas['hielo']).toEqual({ prendido: false, datos: { enfriar: true } });
  });
});
