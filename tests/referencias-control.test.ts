import { describe, it, expect, vi } from 'vitest';
import { crearControlReferencias } from '../src/referencias-control.js';
import { localStorageFalso } from './dom-falso.js';

function armar(almacen = localStorageFalso()) {
  const redibujar = vi.fn(); const pintarResultado = vi.fn(); const pintarTabla = vi.fn(); const temporizador = vi.fn();
  const c = crearControlReferencias({ almacen, redibujar, pintarResultado, pintarTabla, temporizador });
  return { c, redibujar, pintarResultado, pintarTabla, temporizador, almacen };
}
const boton = (dataset: Record<string, string>) => ({ dataset }) as unknown as HTMLElement;

describe('el control de referencias', () => {
  it('escribir un número guarda y pinta sólo el resultado', () => {
    const { c, pintarResultado, redibujar, almacen } = armar();
    c.alEscribir('coccion', 'agua-sal-pasta', 'gramos', '250');
    expect(c.estado('coccion').valores['agua-sal-pasta']?.['gramos']).toBe(250);
    expect(pintarResultado).toHaveBeenCalledWith('coccion', 'agua-sal-pasta');
    expect(redibujar).not.toHaveBeenCalled();
    expect(JSON.parse(almacen.getItem('recetario.referencias.coccion')!)).toEqual({ 'agua-sal-pasta': { gramos: 250 } });
  });

  it('un texto que no es número queda vacío; la coma decimal vale', () => {
    const { c } = armar();
    c.alEscribir('masas', 'molde', 'alto', 'abc');
    expect(c.estado('masas').valores['molde']?.['alto']).toBeNull();
    c.alEscribir('masas', 'molde', 'alto', '4,5');
    expect(c.estado('masas').valores['molde']?.['alto']).toBe(4.5);
  });

  it('elegir una opción redibuja: puede cambiar qué entradas se ven', () => {
    const { c, redibujar } = armar();
    c.alElegir('masas', 'molde', 'forma', 'tubo');
    expect(redibujar).toHaveBeenCalledOnce();
  });

  it('lo guardado roto vuelve a vacío', () => {
    const almacen = localStorageFalso();
    almacen.setItem('recetario.referencias.masas', '{roto');
    expect(armar(almacen).c.estado('masas').valores).toEqual({});
  });

  it('buscar no guarda y pinta sólo la tabla', () => {
    const { c, pintarTabla, almacen } = armar();
    c.alBuscar('conservacion', 'pollo');
    expect(c.estado('conservacion').busqueda).toBe('pollo');
    expect(pintarTabla).toHaveBeenCalledWith('conservacion');
    expect(almacen.getItem('recetario.referencias.conservacion')).toBeNull();
  });

  it('el botón de minutos crea un temporizador con el nombre de la fila', () => {
    const { c, temporizador } = armar();
    c.acciones['referencia-temporizador']!(boton({ nombre: 'Chauchas', minutos: '1.5' }), new Event('click'));
    expect(temporizador).toHaveBeenCalledWith('Chauchas', 1.5);
  });
});
