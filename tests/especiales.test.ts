import { describe, it, expect } from 'vitest';
import {
  ESPECIALES, TAGS_ESPECIALES, TAGS_RESERVADOS, definicion, tagEspecial,
  tagReservado, especialDeReservada, especialesValidos
} from '../src/especiales.js';
import { ICO } from '../src/ui/iconos.js';

describe('la tabla de especiales', () => {
  it('tiene los seis, en su orden', () => {
    expect(TAGS_ESPECIALES).toEqual(['favorito', 'menú diario', 'probar', 'borrador', 'pan', 'fermentado']);
    expect(ESPECIALES.map(d => d.nombre)).toEqual([...TAGS_ESPECIALES]);
  });

  it.each([
    ['favorito', 'estrella', 'Favorita', true, true, false],
    ['menú diario', 'calendario', 'Menú diario', true, true, false],
    ['probar', 'marcador', 'Para probar', true, true, false],
    ['borrador', null, null, false, false, false],
    ['pan', null, null, false, false, false],
    ['fermentado', null, null, false, false, false]
  ] as const)('%s: ícono, marca, chips, receta y búsqueda', (nombre, icono, marca, chips, receta, busqueda) => {
    const d = definicion(nombre);
    expect(d.icono).toBe(icono);
    expect(d.etiquetaMarca).toBe(marca);
    expect(d.enChips).toBe(chips);
    expect(d.enReceta).toBe(receta);
    expect(d.enBusqueda).toBe(busqueda);
    expect(d.etiquetaEditor).toBe(nombre);
  });

  it('pan y fermentado abren su calculadora; los demás, ninguna', () => {
    expect(ESPECIALES.map(d => [d.nombre, d.herramienta])).toEqual([
      ['favorito', null], ['menú diario', null], ['probar', null], ['borrador', null],
      ['pan', 'pan'], ['fermentado', 'fermentados']
    ]);
    expect(tagReservado('pan')).toBe(true);
    expect(tagReservado('Fermentado')).toBe(true);
  });

  it('cada ícono existe en ICO', () => {
    for (const d of ESPECIALES) if (d.icono) expect(ICO[d.icono]).toBeTruthy();
  });
});

describe('reconocer', () => {
  it('sólo la forma canónica, sin mirar mayúsculas ni tildes', () => {
    expect(tagEspecial('Favorito')).toBe('favorito');
    expect(tagEspecial('menu diario')).toBe('menú diario');
    expect(tagEspecial('favoritas')).toBeNull();
    expect(tagEspecial('incompleta')).toBeNull();
    expect(tagEspecial('horno')).toBeNull();
    expect(tagEspecial('')).toBeNull();
  });

  it('las reservadas son los nombres, sus formas y las de terminado', () => {
    for (const t of ['favorito', 'Favoritas', 'borradores', 'incompleta', 'incompletos', 'terminada', 'menu diario', 'probar']) {
      expect(tagReservado(t)).toBe(true);
    }
    expect(tagReservado('horno')).toBe(false);
    expect(tagReservado('')).toBe(false);
    expect(TAGS_RESERVADOS).toContain('incompletas');
  });

  it('una forma reservada dice de qué especial es', () => {
    expect(especialDeReservada('favoritas')).toBe('favorito');
    expect(especialDeReservada('Incompleta')).toBe('borrador');
    expect(especialDeReservada('favorito')).toBe('favorito');
    expect(especialDeReservada('terminado')).toBeNull();
  });
});

describe('especialesValidos', () => {
  it('canónicos, sin repetir, en el orden de la tabla, y aparte lo que no es', () => {
    expect(especialesValidos(['BORRADOR', 'Favorito', 'favorito', 'favoritas', 'brioche']))
      .toEqual({ validos: ['favorito', 'borrador'], ignorados: ['favoritas', 'brioche'] });
  });
});
