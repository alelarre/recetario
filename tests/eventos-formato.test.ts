import { describe, it, expect } from 'vitest';
import { arriba, unidades, peso, volumen, envases, personas } from '../src/eventos/formato.js';

describe('el formato de compra', () => {
  it('redondea para arriba sin sumar uno por la coma flotante', () => {
    expect(arriba(0.1 * 3 * 10)).toBe(3);
    expect(arriba(2.1)).toBe(3);
  });

  it('las unidades van enteras, con su nombre si lo tienen', () => {
    expect(unidades(2.1)).toBe('3');
    expect(unidades(3, { nombre: 'porciones' })).toBe('3 porciones');
  });

  it('lo que se compra por docena se redondea a la media docena y dice las docenas', () => {
    expect(unidades(5, { porDocena: true })).toBe('6 (½ docena)');
    expect(unidades(12, { porDocena: true })).toBe('12 (1 docena)');
    expect(unidades(13, { porDocena: true })).toBe('18 (1 ½ docenas)');
    expect(unidades(30, { porDocena: true })).toBe('30 (2 ½ docenas)');
    expect(unidades(0, { porDocena: true })).toBe('0');
  });

  it('el peso va en gramos debajo de 1 kg y en kg con un decimal desde 1 kg, para arriba', () => {
    expect(peso(450)).toBe('450 g');
    expect(peso(999.2)).toBe('1 kg');
    expect(peso(2400)).toBe('2,4 kg');
    expect(peso(2401)).toBe('2,5 kg');
  });

  it('el volumen va en ml debajo de 1 l y en litros con un decimal desde 1 l', () => {
    expect(volumen(330)).toBe('330 ml');
    expect(volumen(14150)).toBe('14,2 l');
    expect(volumen(12000)).toBe('12 l');
  });

  it('las personas van con coma y un decimal, sin el error de la coma flotante', () => {
    expect(personas(10)).toBe('10');
    expect(personas(2.5)).toBe('2,5');
    expect(personas(0.1 + 0.2)).toBe('0,3');
  });

  it('los envases van enteros para arriba, en singular si es uno', () => {
    const lata = { uno: 'lata', varios: 'latas' };
    expect(envases(14150, 473, lata)).toBe('30 latas');
    expect(envases(400, 750, { uno: 'botella', varios: 'botellas' })).toBe('1 botella');
  });
});
