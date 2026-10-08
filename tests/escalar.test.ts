import { describe, it, expect } from 'vitest';
import { escalarCantidad, escribirNumero, porcionesDe, restoDelRinde } from '../src/escalar.js';

describe('escribir un número', () => {
  it('de 10 para arriba, entero', () => expect([10, 187.5, 1000.4].map(escribirNumero)).toEqual(['10', '188', '1000']));
  it('debajo de 10, entero o fracción común si está cerca', () =>
    expect([3, 1.5, 0.75, 0.333, 2.667, 2.25, 2.98].map(escribirNumero)).toEqual(['3', '1½', '¾', '⅓', '2⅔', '2¼', '3']));
  it('si no, un decimal con coma', () => expect([2.4, 0.6, 7.1].map(escribirNumero)).toEqual(['2,4', '0,6', '7,1']));
  it('la fracción más cercana, no la primera dentro del margen', () => expect([0.3, 2.3, 0.712].map(escribirNumero)).toEqual(['⅓', '2⅓', '¾']));
  it('una cantidad chica que no es cero no se escribe «0»', () => expect([0.02, 0.04].map(escribirNumero)).toEqual(['0,02', '0,04']));
});

describe('escalar una cantidad', () => {
  const x2 = (c: string) => escalarCantidad(c, 2);
  it('enteros y decimales, con coma o punto', () => expect(['250 g', '1,5 l', '0.75 taza'].map(x2)).toEqual(['500 g', '3 l', '1½ taza']));
  it('fracciones y mixtos', () => expect(['½ taza', '¾', '1/2 cebolla', '1½ tazas', '1 ½ taza', '1 1/2 taza'].map(x2))
    .toEqual(['1 taza', '1½', '1 cebolla', '3 tazas', '3 taza', '3 taza']));
  it('un rango escala los dos extremos', () => expect(['2-3 dientes', '2–3', '2 a 3 cdas'].map(x2)).toEqual(['4-6 dientes', '4–6', '4 a 6 cdas']));
  it('un rango con «o» también', () => expect(x2('2 o 3 dientes')).toBe('4 o 6 dientes'));
  it('un entero «y» una fracción es un solo número', () => expect(['2 y 1/2 tazas', '1 y ½ taza'].map(x2)).toEqual(['5 tazas', '3 taza']));
  it('el punto entre miles no es decimal', () => expect(['1.000 g', '1.500 g', '12.500 g', '1.5 kg'].map(x2)).toEqual(['2000 g', '3000 g', '25000 g', '3 kg']));
  it('la nota y lo que sigue quedan igual', () => expect(x2('1 kg (800 g si es de lata)')).toBe('2 kg (800 g si es de lata)'));
  it('lo que no empieza con número queda igual', () =>
    expect(['a gusto', 'c/n', 'una pizca', 'media taza'].map(x2)).toEqual(['a gusto', 'c/n', 'una pizca', 'media taza']));
  it('una imagen en línea después del número queda igual', () => expect(x2('1 taza ![](foto:2)')).toBe('2 taza ![](foto:2)'));
  it('un número pegado a la unidad', () => expect(x2('500g')).toBe('1000g'));
  it('por ½', () => expect(escalarCantidad('3 huevos', 0.5)).toBe('1½ huevos'));
  it('por 1, sin tocar', () => expect(escalarCantidad('1.50 g', 1)).toBe('1.50 g'));
});

describe('el rinde', () => {
  it('el número del principio', () => expect(['4 porciones', '12 empanadas', '1½ litros'].map(porcionesDe)).toEqual([4, 12, 1.5]));
  it('cualquier rinde que empiece con número', () => expect(porcionesDe('1 molde de 24 cm')).toBe(1));
  it('un rinde con rango no tiene un solo número', () => expect(['4 a 6 porciones', '6-8 porciones', '2 o 3 budines'].map(porcionesDe)).toEqual([null, null, null]));
  it('sin número, nada', () => expect(['para la familia', '', null].map(porcionesDe)).toEqual([null, null, null]));
  it('lo que sigue al número', () => expect(['4 porciones', '1 molde de 24 cm', '6'].map(restoDelRinde)).toEqual(['porciones', 'molde de 24 cm', '']));
});
