import { describe, it, expect, afterEach } from 'vitest';
import { leer, guardar, borrar } from '../src/indice-local.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { comoGlobal, localStorageFalso } from './dom-falso.js';
import { entradaFalsa } from './dobles.js';

const copia: CopiaIndice = {
  schemaVersion: 3,
  indiceId: 'i1',
  modifiedTime: '2026-09-13T10:00:00.000Z',
  meta: { schemaVersion: '3', ultima_reconstruccion: '2026-09-12T10:00:00.000Z' },
  filas: [{ fila: 2, entrada: entradaFalsa({ id_archivo: 'r1', titulo: 'Milanesas', tags: ['horno'], mtime: 1000 }) }]
};

describe('indice-local: la copia del índice en el navegador', () => {
  afterEach(() => { delete (global as unknown as Record<string, unknown>)['localStorage']; });

  it('lo guardado se lee igual', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    guardar(copia);
    expect(leer()).toEqual(copia);
  });

  it('vive en una sola clave, recetario-indice', () => {
    const ls = localStorageFalso();
    global.localStorage = comoGlobal<Storage>(ls);
    guardar(copia);
    expect([...ls._datos.keys()]).toEqual(['recetario-indice']);
  });

  it('sin nada guardado no hay copia', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    expect(leer()).toBeNull();
  });

  it('borrar la saca', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    guardar(copia);
    borrar();
    expect(leer()).toBeNull();
  });

  it('un JSON roto se lee como que no hay copia', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-indice', '{roto');
    expect(leer()).toBeNull();
  });

  it('un JSON sin la forma de la copia también', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-indice', JSON.stringify({ indiceId: 'i1' }));
    expect(leer()).toBeNull();
  });

  it('un localStorage que tira se lee como que no hay copia, y guardar y borrar no tiran', () => {
    const tira = () => { throw new Error('bloqueado'); };
    global.localStorage = comoGlobal<Storage>({ getItem: tira, setItem: tira, removeItem: tira });
    expect(leer()).toBeNull();
    expect(() => guardar(copia)).not.toThrow();
    expect(() => borrar()).not.toThrow();
  });

  it('sin localStorage en absoluto tampoco rompe', () => {
    expect(leer()).toBeNull();
    expect(() => guardar(copia)).not.toThrow();
    expect(() => borrar()).not.toThrow();
  });

  it('si guardar falla, no queda la copia anterior', () => {
    // Lleno, por ejemplo: la copia vieja quedaría con datos de antes de la
    // escritura que no se pudo guardar.
    const ls = localStorageFalso();
    global.localStorage = comoGlobal<Storage>(ls);
    guardar(copia);
    ls.setItem = () => { throw new Error('lleno'); };
    guardar({ ...copia, modifiedTime: '2026-09-13T11:00:00.000Z' });
    expect(leer()).toBeNull();
  });
});
