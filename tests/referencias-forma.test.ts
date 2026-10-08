import { describe, it, expect } from 'vitest';
import { problemasDeForma, problemasDeConstante, filasDe, idDeFicha } from '../src/referencias/forma.js';
import { REFERENCIAS, FICHAS_DEL_CONVERSOR, fichaDeReferencia, fichasDe } from '../src/referencias/indice.js';
import type { Tabla, Fuente } from '../src/referencias/tipos.js';
import { AGUA_SAL_PASTA, ESPAGUETI, CALDO } from '../src/referencias/datos/coccion.js';
import { MOLDE, PASTA_FRESCA, PIZZA, AZUCAR, MERENGUE } from '../src/referencias/datos/masas-y-dulces.js';
import { SISTEMAS, UNIDADES, INGREDIENTES, INGREDIENTE_DEL_STICK } from '../src/referencias/datos/conversor.js';

const fuente = { nombre: 'Fuente', url: 'https://ejemplo.com/x' };
const columnas = [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B', unidad: '°C' }];

describe('la forma de una tabla', () => {
  it('una tabla bien formada no tiene problemas', () => {
    const t: Tabla = { id: 't', titulo: 'T', columnas, filas: [{ a: 'x', b: '1' }], fuente };
    expect(problemasDeForma(t)).toEqual([]);
  });

  it('una fila sin una columna, o con una de más, es un problema', () => {
    const t: Tabla = { id: 't', titulo: 'T', columnas, filas: [{ a: 'x' }, { a: 'y', b: '1', c: 'z' }], fuente };
    expect(problemasDeForma(t)).toEqual([
      't, fila 1: falta la columna «b»',
      't, fila 2: la columna «c» no está en la tabla'
    ]);
  });

  it('una fuente sin URL http o https es un problema', () => {
    const mala = { nombre: 'X', url: 'ejemplo.com' };
    expect(problemasDeForma({ id: 't', titulo: 'T', columnas, filas: [], fuente: mala })).toEqual([
      't: la fuente «X» no tiene una URL http o https'
    ]);
  });

  it('con varias fuentes, cada fuente que nombra una fila está en la lista', () => {
    const celdas = [
      'FK 43', 'FK 34–42, 59', 'SEN y FK', 'FK 157 (descartada FK 160)',
      'FK, ST 2', 'ST 1', 'FK 157 (descartada ST 160)', '', '12'
    ];
    const t: Tabla = {
      id: 't', titulo: 'T', columnas: [...columnas, { id: 'f', nombre: 'Fuente' }], columnaFuente: 'f',
      fuentes: [{ ...fuente, abreviatura: 'FK' }, { ...fuente, abreviatura: 'SEN' }],
      grupos: [{ titulo: 'G', filas: celdas.map(f => ({ a: 'x', b: '1', f })) }]
    };
    expect(problemasDeForma(t)).toEqual([
      't, fila 5: la fuente «ST» no está en la lista de la tabla',
      't, fila 6: la fuente «ST» no está en la lista de la tabla',
      't, fila 7: la fuente «ST» no está en la lista de la tabla',
      't, fila 8: no nombra ninguna fuente',
      't, fila 9: no nombra ninguna fuente'
    ]);
    expect(filasDe(t)).toHaveLength(celdas.length);
  });

  it('una constante sin fuente válida o con un valor que no es un número finito es un problema', () => {
    expect(problemasDeConstante('k', { valor: 1, unidad: 'g', fuente })).toEqual([]);
    expect(problemasDeConstante('k', { valor: Number.NaN, unidad: 'g', fuente })).toEqual(['k: el valor no es un número']);
  });
});

describe('el índice', () => {
  it('fichasDe da las de Referencias o las del Conversor', () => {
    expect(fichasDe('referencias')).toBe(REFERENCIAS);
    expect(fichasDe('conversor')).toBe(FICHAS_DEL_CONVERSOR);
  });

  it('todas las tablas tienen buena forma, y los id de fichas son únicos entre Referencias y el Conversor', () => {
    const todas = [...REFERENCIAS, ...FICHAS_DEL_CONVERSOR];
    for (const f of todas) if (f.tipo === 'tabla') expect(problemasDeForma(f.tabla), f.tabla.id).toEqual([]);
    const ids = todas.map(idDeFicha);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las constantes de cocción dicen de dónde salen', () => {
    const constantes = { ...AGUA_SAL_PASTA, ...ESPAGUETI, aguaPorKg: CALDO.aguaPorKg, mirepoixMinPorKg: CALDO.mirepoixMinPorKg, mirepoixMaxPorKg: CALDO.mirepoixMaxPorKg };
    for (const [nombre, c] of Object.entries(constantes)) expect(problemasDeConstante(nombre, c)).toEqual([]);
  });

  it('las constantes de masas y dulces dicen de dónde salen', () => {
    const constantes = {
      'MOLDE.densidad': MOLDE.densidad, 'MOLDE.llenado': MOLDE.llenado,
      'PIZZA.gramosPorCm2Molde': PIZZA.gramosPorCm2Molde, 'AZUCAR.metrosPorGrado': AZUCAR.metrosPorGrado
    };
    for (const [nombre, c] of Object.entries(constantes)) expect(problemasDeConstante(nombre, c)).toEqual([]);
  });

  it('cada receta y cada tipo de merengue, y las demás fuentes de masas y dulces, tienen URL y fecha', () => {
    const fuentes: (readonly [string, Fuente])[] = [
      ...PASTA_FRESCA.map(r => [`pasta ${r.id}`, r.fuente] as const),
      ...MERENGUE.map(m => [`merengue ${m.id}`, m.fuente] as const),
      ['MOLDE.fuenteAtajos', MOLDE.fuenteAtajos],
      ...MOLDE.atajos.flatMap(a => (a.fuente ? [[`molde ${a.id}`, a.fuente] as const] : [])), ['PIZZA.fuenteNapolitana', PIZZA.fuenteNapolitana],
      ['PIZZA.fuenteMolde', PIZZA.fuenteMolde], ['AZUCAR.fuente', AZUCAR.fuente]
    ];
    for (const [nombre, fuente] of fuentes) expect(problemasDeConstante(nombre, { valor: 0, unidad: '', fuente })).toEqual([]);
  });
});

describe('los datos del conversor', () => {
  it('cada sistema, unidad e ingrediente dice de dónde sale', () => {
    for (const s of SISTEMAS) for (const f of s.fuentes) expect(problemasDeConstante(`sistema ${s.id}`, { valor: s.taza, unidad: 'ml', fuente: f })).toEqual([]);
    for (const [nombre, c] of Object.entries(UNIDADES)) expect(problemasDeConstante(nombre, c)).toEqual([]);
    for (const i of INGREDIENTES) expect(problemasDeConstante(`ingrediente ${i.id}`, { valor: i.medida.gramos, unidad: 'g', fuente: i.fuente })).toEqual([]);
  });

  it('los id no se repiten, cada medida usa un sistema que existe y el stick es de un ingrediente que está', () => {
    const ids = INGREDIENTES.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(SISTEMAS.map(s => s.id)).size).toBe(SISTEMAS.length);
    for (const i of INGREDIENTES) expect(SISTEMAS.map(s => s.id), i.id).toContain(i.medida.sistema);
    for (const i of INGREDIENTES) expect(i.medida.cantidad > 0 && i.medida.gramos > 0, i.id).toBe(true);
    expect(ids).toContain(INGREDIENTE_DEL_STICK);
  });
});

describe('los tags de Referencias', () => {
  it('cada ficha tiene al menos un tag, sin repetidos', () => {
    for (const f of REFERENCIAS) {
      expect(f.tags.length, idDeFicha(f)).toBeGreaterThan(0);
      expect(new Set(f.tags).size, idDeFicha(f)).toBe(f.tags.length);
    }
  });

  it('fichaDeReferencia encuentra una ficha de Referencias, y no una del Conversor', () => {
    const primera = REFERENCIAS[0];
    expect(primera && fichaDeReferencia(idDeFicha(primera))).toBe(primera);
    expect(fichaDeReferencia(idDeFicha(FICHAS_DEL_CONVERSOR[0]))).toBeNull();
    expect(fichaDeReferencia('no-existe')).toBeNull();
  });
});
