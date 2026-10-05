import { describe, it, expect } from 'vitest';
import { problemasDeForma, problemasDeConstante, filasDe } from '../src/referencias/forma.js';
import { HERRAMIENTAS_DE_REFERENCIA } from '../src/referencias/indice.js';
import type { Tabla, Fuente } from '../src/referencias/tipos.js';
import { AGUA_SAL_PASTA, ESPAGUETI, CALDO } from '../src/referencias/datos/coccion.js';
import { MOLDE, PASTA_FRESCA, LASANA, PIZZA, AZUCAR, MERENGUE } from '../src/referencias/datos/masas-y-dulces.js';

const fuente = { nombre: 'Fuente', url: 'https://ejemplo.com/x', consultada: '2026-10-04' };
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

  it('una fuente sin URL https o con la fecha mal escrita es un problema', () => {
    const mala = { nombre: 'X', url: 'ejemplo.com', consultada: '4/10/2026' };
    expect(problemasDeForma({ id: 't', titulo: 'T', columnas, filas: [], fuente: mala })).toEqual([
      't: la fuente «X» no tiene una URL http o https',
      't: la fuente «X» no tiene la fecha como AAAA-MM-DD'
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
  it('las cuatro herramientas, en el orden de la lista, con su ruta', () => {
    expect(HERRAMIENTAS_DE_REFERENCIA.map(h => [h.id, h.ruta])).toEqual([
      ['rapida', '#/herramientas/referencia'], ['masas', '#/herramientas/masas'],
      ['coccion', '#/herramientas/coccion'], ['conservacion', '#/herramientas/conservacion']
    ]);
  });

  it('todas las tablas del índice tienen buena forma, y los id de fichas son únicos', () => {
    const ids: string[] = [];
    for (const h of HERRAMIENTAS_DE_REFERENCIA) {
      for (const f of h.fichas) {
        if (f.tipo === 'tabla') expect(problemasDeForma(f.tabla), f.tabla.id).toEqual([]);
        ids.push(f.tipo === 'tabla' ? f.tabla.id : f.cuenta.id);
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('las constantes de cocción dicen de dónde salen', () => {
    const constantes = { ...AGUA_SAL_PASTA, ...ESPAGUETI, aguaPorKg: CALDO.aguaPorKg, mirepoixMinPorKg: CALDO.mirepoixMinPorKg, mirepoixMaxPorKg: CALDO.mirepoixMaxPorKg };
    for (const [nombre, c] of Object.entries(constantes)) expect(problemasDeConstante(nombre, c)).toEqual([]);
  });

  it('las constantes de masas y dulces dicen de dónde salen', () => {
    const constantes = {
      'MOLDE.densidad': MOLDE.densidad, 'MOLDE.llenado': MOLDE.llenado,
      'LASANA.cm2PorPorcion': LASANA.cm2PorPorcion, 'LASANA.cm2Base': LASANA.cm2Base,
      'PIZZA.gramosPorCm2Molde': PIZZA.gramosPorCm2Molde, 'AZUCAR.metrosPorGrado': AZUCAR.metrosPorGrado
    };
    for (const [nombre, c] of Object.entries(constantes)) expect(problemasDeConstante(nombre, c)).toEqual([]);
  });

  it('cada receta y cada tipo de merengue, y las demás fuentes de masas y dulces, tienen URL y fecha', () => {
    const fuentes: (readonly [string, Fuente])[] = [
      ...PASTA_FRESCA.map(r => [`pasta ${r.id}`, r.fuente] as const),
      ...LASANA.masas.map(r => [`lasaña ${r.id}`, r.fuente] as const),
      ...MERENGUE.map(m => [`merengue ${m.id}`, m.fuente] as const),
      ['MOLDE.fuenteAtajos', MOLDE.fuenteAtajos],
      ...MOLDE.atajos.flatMap(a => (a.fuente ? [[`molde ${a.id}`, a.fuente] as const] : [])), ['PIZZA.fuenteNapolitana', PIZZA.fuenteNapolitana],
      ['PIZZA.fuenteMolde', PIZZA.fuenteMolde], ['AZUCAR.fuente', AZUCAR.fuente]
    ];
    for (const [nombre, fuente] of fuentes) expect(problemasDeConstante(nombre, { valor: 0, unidad: '', fuente })).toEqual([]);
  });
});
