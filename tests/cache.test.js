import { describe, it, expect } from 'vitest';
import { crearCacheMemoria } from '../src/cache.js';

describe('cache en memoria', () => {
  it('guarda y devuelve el índice', async () => {
    const c = crearCacheMemoria();
    expect(await c.leerIndice()).toEqual([]);
    await c.guardarIndice([{ id_archivo: 'a' }]);
    expect(await c.leerIndice()).toEqual([{ id_archivo: 'a' }]);
  });

  it('guarda el mapa de filas como Map', async () => {
    const c = crearCacheMemoria();
    await c.guardarMapaFilas(new Map([['a', 2]]));
    expect((await c.leerMapaFilas()).get('a')).toBe(2);
  });

  it('la cola es FIFO y se vacía entera', async () => {
    const c = crearCacheMemoria();
    await c.encolar({ tipo: 'fila', id: 'a' });
    await c.encolar({ tipo: 'fila', id: 'b' });
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
    const entradas = [{ id_archivo: 'a' }];
    await c.guardarIndice(entradas);
    entradas.push({ id_archivo: 'b' });  // agregar al array original
    const guardado = await c.leerIndice();
    expect(guardado.length).toBe(1);  // no debe tener la entrada nueva
    expect(guardado[0].id_archivo).toBe('a');
  });
});
