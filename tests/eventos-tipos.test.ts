import { describe, it, expect } from 'vitest';
import { TIPOS_DE_EVENTO } from '../src/eventos/indice.js';
import { COMUNES } from '../src/eventos/datos/comunes.js';
import { BEBIDAS, HIELO, INFUSIONES } from '../src/eventos/datos/bebidas.js';
import { ASADO, COMBUSTIBLE } from '../src/eventos/datos/asado.js';
import { MERIENDA } from '../src/eventos/datos/merienda.js';
import { COMIDA } from '../src/eventos/datos/comida.js';
import { PICADA } from '../src/eventos/datos/picada.js';
import { COCTEL } from '../src/eventos/datos/coctel.js';
import { datosDe, problemasDeDato, problemasDeTipo } from '../src/eventos/forma.js';
import { calcularEvento } from '../src/eventos/evento.js';
import { estadoInicial, conTipo } from '../src/eventos/estado.js';
import type { EstadoEvento, TipoDeEvento } from '../src/eventos/tipos.js';

const ARCHIVOS = { COMUNES, BEBIDAS, HIELO, INFUSIONES, ASADO, COMBUSTIBLE, MERIENDA, COMIDA, PICADA, COCTEL };

describe('la forma de los números', () => {
  it('cada número dice de dónde sale: una fuente con URL, o la nota de por qué no tiene', () => {
    const todos = Object.entries(ARCHIVOS).flatMap(([nombre, x]) => datosDe(nombre, x));
    expect(todos.length).toBeGreaterThan(0);
    expect(todos.flatMap(x => problemasDeDato(x.donde, x.dato))).toEqual([]);
  });

  it('un dato sin URL o sin nota es un problema', () => {
    expect(problemasDeDato('X', { valor: 1, fuente: { nombre: 'F', url: 'f.com' } })).toEqual(['X: la fuente «F» no tiene una URL http o https']);
    expect(problemasDeDato('X', { valor: 1, fuente: null, nota: ' ' })).toEqual(['X: va sin fuente y sin nota']);
    expect(problemasDeDato('X', { valor: Number.NaN, fuente: { nombre: 'F', url: 'https://f.com' } })).toEqual(['X: el valor no es un número positivo']);
  });
});

describe('los cinco tipos', () => {
  it('son merienda, asado, comida, picada y cóctel, en ese orden', () => {
    expect(TIPOS_DE_EVENTO.map(t => t.id)).toEqual(['merienda', 'asado', 'comida', 'picada', 'coctel']);
  });

  it('cada uno nombra grupos, cosas y atajos que existen', () => {
    expect(TIPOS_DE_EVENTO.flatMap(problemasDeTipo)).toEqual([]);
  });

  it('un tipo mal armado tiene problemas', () => {
    const malo: TipoDeEvento = {
      id: 'malo', nombre: 'Malo', datos: [],
      grupos: [{ id: 'g', titulo: 'G', seReparte: true }, { id: 'vacio', titulo: 'V', seReparte: true }],
      cosas: [{ id: 'x', nombre: 'X', grupo: 'otro', prendida: true, porcion: () => COMUNES.factorChico, unidad: 'g' }],
      ademas: [], atajo: { dato: 'nada', cosas: { a: ['y'] } }, cifra: { grupo: 'otro', nombre: 'C' }
    };
    expect(problemasDeTipo(malo)).toEqual([
      'malo: la cosa «x» es de un grupo que no está, «otro»',
      'malo: la cosa «x» no dice para qué restricciones es apta',
      'malo: el grupo «g» no tiene cosas',
      'malo: el grupo «vacio» no tiene cosas',
      'malo: el atajo es de «nada», que no es una opción del tipo',
      'malo: el atajo nombra «y», que no es una cosa',
      'malo: la cifra es de un grupo que no está, «otro»'
    ]);
  });

  /** Todo prendido, para que cada cosa y cada una de las que se suman calculen. */
  function todoPrendido(t: TipoDeEvento): EstadoEvento {
    const e = conTipo(estadoInicial(TIPOS_DE_EVENTO, COMUNES), TIPOS_DE_EVENTO, t.id);
    return {
      ...e, adultos: 10, chicos: 3, horas: 6, calor: true, margen: 10,
      porTipo: { [t.id]: {
        datos: {},
        cosas: Object.fromEntries(t.cosas.map(c => [c.id, true])),
        reparto: {},
        ademas: Object.fromEntries(t.ademas.map(a => [a.ademas.id, {
          prendido: true, datos: Object.fromEntries(a.ademas.datos.flatMap(x => (x.tipo === 'si-no' ? [[x.id, true]] : [])))
        }]))
      } }
    };
  }

  for (const t of TIPOS_DE_EVENTO) {
    it(`${t.nombre}: con los valores por defecto calcula sin errores`, () => {
      const e = { ...conTipo(estadoInicial(TIPOS_DE_EVENTO, COMUNES), TIPOS_DE_EVENTO, t.id), adultos: 10 };
      const r = calcularEvento(e, TIPOS_DE_EVENTO, COMUNES);
      expect(r).not.toBeNull();
      expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
    });

    it(`${t.nombre}: con todo prendido, cada cosa sale en la lista y nada da NaN`, () => {
      const r = calcularEvento(todoPrendido(t), TIPOS_DE_EVENTO, COMUNES);
      const ids = new Set((r?.grupos ?? []).flatMap(g => g.items.map(i => i.id.split('-')[0])));
      for (const c of t.cosas) expect(ids.has(c.id.split('-')[0]), c.id).toBe(true);
      expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity|undefined/);
      expect(r?.fuentes.length).toBeGreaterThan(0);
    });
  }
});

describe('el atajo del asado', () => {
  it('cada tipo de asado prende algo', () => {
    const asado = TIPOS_DE_EVENTO.find(t => t.id === 'asado');
    const dato = asado?.datos.find(x => x.id === asado.atajo?.dato);
    expect(dato?.tipo).toBe('opcion');
    if (dato?.tipo !== 'opcion' || !asado?.atajo) return;
    for (const o of dato.opciones) expect(asado.atajo.cosas[o.valor]?.length, o.valor).toBeGreaterThan(0);
  });
});
