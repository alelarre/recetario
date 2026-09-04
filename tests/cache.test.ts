import { describe, it, expect } from 'vitest';
import { crearCacheMemoria } from '../src/cache.js';
import { entradaFalsa } from './dobles.js';
import type { OperacionPendiente } from '../src/cache.js';

describe('cache en memoria', () => {
  it('guarda y devuelve el índice', async () => {
    const c = crearCacheMemoria();
    expect(await c.leerIndice()).toEqual([]);
    await c.guardarIndice([entradaFalsa({ id_archivo: 'a' })]);
    expect(await c.leerIndice()).toEqual([entradaFalsa({ id_archivo: 'a' })]);
  });

  it('guarda el mapa de filas como Map', async () => {
    const c = crearCacheMemoria();
    await c.guardarMapaFilas(new Map([['a', 2]]));
    expect((await c.leerMapaFilas()).get('a')).toBe(2);
  });

  it('la cola es FIFO y se vacía entera', async () => {
    const c = crearCacheMemoria();
    await c.encolar({ tipo: 'fila', id: 'a', fila: [] });
    await c.encolar({ tipo: 'fila', id: 'b', fila: [] });
    expect((await c.leerCola()).map(o => o.id)).toEqual(['a', 'b']);
    await c.vaciarCola();
    expect(await c.leerCola()).toEqual([]);
  });

  it('los cuerpos se guardan y se leen por id', async () => {
    const c = crearCacheMemoria();
    await c.guardarCuerpo('a', '# hola');
    expect(await c.leerCuerpo('a')).toBe('# hola');
    expect(await c.leerCuerpo('b')).toBeNull();
  });

  it('guardarMapaFilas no se ve afectado por mutaciones posteriores del original', async () => {
    const c = crearCacheMemoria();
    const mapa = new Map([['a', 1]]);
    await c.guardarMapaFilas(mapa);
    mapa.set('a', 999);  // mutar el original
    mapa.set('b', 2);    // agregar una entrada nueva
    const guardado = await c.leerMapaFilas();
    expect(guardado.get('a')).toBe(1);  // debe tener el valor original
    expect(guardado.has('b')).toBe(false);  // no debe tener la entrada nueva
  });

  it('guardarIndice no se ve afectado por mutaciones posteriores del original', async () => {
    const c = crearCacheMemoria();
    const entradas = [entradaFalsa({ id_archivo: 'a' })];
    await c.guardarIndice(entradas);
    entradas.push(entradaFalsa({ id_archivo: 'b' }));  // agregar al array original
    const guardado = await c.leerIndice();
    expect(guardado.length).toBe(1);  // no debe tener la entrada nueva
    expect(guardado[0].id_archivo).toBe('a');
  });

  it('guardarIndice con clon profundo: mutación de objeto adentro no afecta lo guardado', async () => {
    const c = crearCacheMemoria();
    const entradas = [entradaFalsa({ id_archivo: 'a', mtime: 1 })];
    await c.guardarIndice(entradas);
    entradas[0].mtime = 999;  // mutar un objeto dentro del array
    const guardado = await c.leerIndice();
    expect(guardado[0].mtime).toBe(1);  // debe tener el valor original
  });

  it('leerIndice con clon profundo: mutación de objeto leído no afecta lecturas futuras', async () => {
    const c = crearCacheMemoria();
    await c.guardarIndice([entradaFalsa({ id_archivo: 'a', mtime: 1 })]);
    const leido = await c.leerIndice();
    leido[0].mtime = 999;  // mutar lo que se leyó
    const reLeido = await c.leerIndice();
    expect(reLeido[0].mtime).toBe(1);  // segunda lectura debe devolver el valor original
  });

  it('encolar con clon profundo: mutación de operación no afecta lo encolado', async () => {
    const c = crearCacheMemoria();
    // La fila es un arreglo anidado: es lo que hace falta para que el clon
    // tenga que ser profundo y no una copia del objeto de arriba.
    const op: OperacionPendiente = { tipo: 'fila', id: 'a', fila: ['uno'] };
    await c.encolar(op);
    op.fila[0] = 'mutado';  // mutar la operación original
    const cola = await c.leerCola();
    expect(cola[0].fila[0]).toBe('uno');  // debe tener el valor original
  });

  it('leerCola con clon profundo: mutación de objeto encolado no afecta lecturas futuras', async () => {
    const c = crearCacheMemoria();
    await c.encolar({ tipo: 'fila', id: 'a', fila: ['uno'] });
    const cola1 = await c.leerCola();
    cola1[0].fila[0] = 'mutado';  // mutar lo que se leyó
    const cola2 = await c.leerCola();
    expect(cola2[0].fila[0]).toBe('uno');  // segunda lectura debe devolver el valor original
  });

  it('leerMapaFilas devuelve un Map con .get funcionando', async () => {
    const c = crearCacheMemoria();
    await c.guardarMapaFilas(new Map([['clave', 7]]));
    const mapa = await c.leerMapaFilas();
    expect(mapa instanceof Map).toBe(true);
    expect(mapa.get('clave')).toBe(7);
  });

  it('leerIndice devuelve un array con métodos de array', async () => {
    const c = crearCacheMemoria();
    await c.guardarIndice([entradaFalsa({ id_archivo: 'a' }), entradaFalsa({ id_archivo: 'b' })]);
    const arr = await c.leerIndice();
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(2);
    expect(arr.map(e => e.id_archivo)).toEqual(['a', 'b']);
  });
});
