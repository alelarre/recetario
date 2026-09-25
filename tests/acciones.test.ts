import { describe, it, expect } from 'vitest';
import { registrarAcciones, accionDe } from '../src/acciones.js';
import type { Accion } from '../src/acciones.js';

const nada: Accion = () => undefined;

describe('el mapa de acciones', () => {
  it('reúne las acciones de todas las secciones', () => {
    const volver: Accion = () => 'volver';
    const ordenar: Accion = () => 'ordenar';
    const acciones = registrarAcciones({ navegacion: { volver }, lista: { ordenar } });
    expect(accionDe(acciones, 'volver')).toBe(volver);
    expect(accionDe(acciones, 'ordenar')).toBe(ordenar);
  });

  it('una acción no registrada no hace nada: no se encuentra', () => {
    const acciones = registrarAcciones({ navegacion: { volver: nada } });
    expect(accionDe(acciones, 'desconocida')).toBeUndefined();
    expect(accionDe(acciones, undefined)).toBeUndefined();
    expect(accionDe(acciones, '')).toBeUndefined();
  });

  it('lo que todo objeto trae de fábrica no es una acción', () => {
    const acciones = registrarAcciones({ navegacion: { volver: nada } });
    for (const nombre of ['toString', 'constructor', 'hasOwnProperty', '__proto__', 'valueOf']) {
      expect(accionDe(acciones, nombre)).toBeUndefined();
    }
  });

  it('dos secciones con la misma acción es un error de cableado, y dice cuáles', () => {
    expect(() => registrarAcciones({ plan: { volver: nada }, navegacion: { volver: nada } }))
      .toThrow(/volver.*plan.*navegacion/);
  });
});
