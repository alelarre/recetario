import { describe, it, expect, vi } from 'vitest';
import { crearControlReferencias } from '../src/referencias-control.js';
import { localStorageFalso } from './dom-falso.js';

function armar(almacen = localStorageFalso()) {
  const redibujar = vi.fn(); const pintarResultado = vi.fn(); const pintarTabla = vi.fn();
  const c = crearControlReferencias({ almacen, redibujar, pintarResultado, pintarTabla });
  return { c, redibujar, pintarResultado, pintarTabla, almacen };
}

describe('el control de referencias', () => {
  it('escribir un número guarda y pinta sólo el resultado', () => {
    const { c, pintarResultado, redibujar, almacen } = armar();
    c.alEscribir('referencias', 'agua-sal-pasta', 'gramos', '250');
    expect(c.estado('referencias').valores['agua-sal-pasta']?.['gramos']).toBe(250);
    expect(pintarResultado).toHaveBeenCalledWith('referencias', 'agua-sal-pasta');
    expect(redibujar).not.toHaveBeenCalled();
    expect(JSON.parse(almacen.getItem('recetario.referencias')!)).toEqual({ 'agua-sal-pasta': { gramos: 250 } });
  });

  it('un texto que no es número queda vacío; la coma decimal vale', () => {
    const { c } = armar();
    c.alEscribir('referencias', 'molde', 'alto', 'abc');
    expect(c.estado('referencias').valores['molde']?.['alto']).toBeNull();
    c.alEscribir('referencias', 'molde', 'alto', '4,5');
    expect(c.estado('referencias').valores['molde']?.['alto']).toBe(4.5);
  });

  it('elegir una opción redibuja esa cuenta: puede cambiar qué entradas se ven', () => {
    const { c, redibujar } = armar();
    c.alElegir('referencias', 'molde', 'forma', 'tubo');
    expect(redibujar).toHaveBeenCalledExactlyOnceWith('referencias', 'molde');
  });

  it('elegir la variante de una tabla la guarda y redibuja esa tabla', () => {
    const { c, redibujar, almacen } = armar();
    const boton = { dataset: { herramienta: 'referencias', tabla: 'blanqueado', valor: 'vapor' } } as unknown as HTMLElement;
    c.acciones['elegir-variante']!(boton, new Event('click'));
    expect(c.estado('referencias').valores['blanqueado']?.['variante']).toBe('vapor');
    expect(redibujar).toHaveBeenCalledExactlyOnceWith('referencias', 'blanqueado');
    expect(JSON.parse(almacen.getItem('recetario.referencias')!)).toEqual({ blanqueado: { variante: 'vapor' } });
  });

  it('lo guardado roto vuelve a vacío', () => {
    const almacen = localStorageFalso();
    almacen.setItem('recetario.referencias', '{roto');
    expect(armar(almacen).c.estado('referencias').valores).toEqual({});
  });

  it('buscar no guarda y pinta sólo la tabla', () => {
    const { c, pintarTabla, almacen } = armar();
    c.alBuscar('conversor', 'pollo');
    expect(c.estado('conversor').busqueda).toBe('pollo');
    expect(pintarTabla).toHaveBeenCalledWith('conversor');
    expect(almacen.getItem('recetario.conversor')).toBeNull();
  });

});
