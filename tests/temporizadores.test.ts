import { describe, it, expect } from 'vitest';
import {
  empezar, pausar, seguir, sumarMinuto, restante, terminado, avance, corriendo,
  CRONO_EN_CERO, iniciarCrono, pararCrono, reiniciarCrono, transcurrido, cronoCorriendo,
  formatear, nombreDeDuracion, aMs, girar, leerGuardado, GUARDADO_POR_DEFECTO, DURACION_POR_DEFECTO, MINUTO
} from '../src/temporizadores.js';

const T0 = 1_000_000;

describe('un temporizador regresiva', () => {
  it('empieza corriendo y lo que falta baja con el reloj, hasta cero y no más', () => {
    const c = empezar('a', 'Pasta', 10 * MINUTO, T0);
    expect(corriendo(c)).toBe(true);
    expect(restante(c, T0)).toBe(10 * MINUTO);
    expect(restante(c, T0 + 3 * MINUTO)).toBe(7 * MINUTO);
    expect(restante(c, T0 + 11 * MINUTO)).toBe(0);
    expect(terminado(c, T0 + 10 * MINUTO)).toBe(true);
    expect(terminado(c, T0 + 10 * MINUTO - 1)).toBe(false);
  });

  it('el avance va de 0 a 1', () => {
    const c = empezar('a', 'Pasta', 10 * MINUTO, T0);
    expect(avance(c, T0)).toBe(0);
    expect(avance(c, T0 + 5 * MINUTO)).toBe(0.5);
    expect(avance(c, T0 + 20 * MINUTO)).toBe(1);
  });

  it('sin nombre, la duración es el nombre', () => {
    expect(empezar('a', '  ', 10 * MINUTO, T0).nombre).toBe('10 min');
    expect(empezar('a', 'Horno', 10 * MINUTO, T0).nombre).toBe('Horno');
  });

  it('pausar guarda lo que falta; seguir vuelve a contar desde ahí', () => {
    const c = empezar('a', 'Pasta', 10 * MINUTO, T0);
    const p = pausar(c, T0 + 4 * MINUTO);
    expect(corriendo(p)).toBe(false);
    expect(restante(p, T0 + 50 * MINUTO)).toBe(6 * MINUTO);
    const s = seguir(p, T0 + 50 * MINUTO);
    expect(restante(s, T0 + 51 * MINUTO)).toBe(5 * MINUTO);
    expect(s.duracion).toBe(10 * MINUTO);
  });

  it('un minuto más: corriendo suma al fin, pausado a lo que falta, y la duración crece', () => {
    const c = empezar('a', 'Pasta', 10 * MINUTO, T0);
    const mas = sumarMinuto(c, T0 + MINUTO);
    expect(restante(mas, T0 + MINUTO)).toBe(10 * MINUTO);
    expect(mas.duracion).toBe(11 * MINUTO);
    const p = sumarMinuto(pausar(c, T0 + MINUTO), T0 + 5 * MINUTO);
    expect(restante(p, T0 + 5 * MINUTO)).toBe(10 * MINUTO);
  });

  it('un minuto más sobre uno terminado hace rato vuelve a correr desde 1:00, contado desde ahora', () => {
    const c = empezar('a', 'Pasta', MINUTO, T0);
    const mas = sumarMinuto(c, T0 + 30 * MINUTO);
    expect(restante(mas, T0 + 30 * MINUTO)).toBe(MINUTO);
    expect(terminado(mas, T0 + 30 * MINUTO)).toBe(false);
  });
});

describe('el cronómetro', () => {
  it('acumula entre pausas y reiniciar lo deja en cero', () => {
    expect(transcurrido(CRONO_EN_CERO, T0)).toBe(0);
    const a = iniciarCrono(CRONO_EN_CERO, T0);
    expect(cronoCorriendo(a)).toBe(true);
    expect(transcurrido(a, T0 + 5000)).toBe(5000);
    const b = pararCrono(a, T0 + 5000);
    expect(transcurrido(b, T0 + 99_000)).toBe(5000);
    const c = iniciarCrono(b, T0 + 100_000);
    expect(transcurrido(c, T0 + 101_000)).toBe(6000);
    expect(iniciarCrono(c, T0 + 200_000)).toBe(c);
    expect(transcurrido(reiniciarCrono(), T0)).toBe(0);
  });
});

describe('el formato', () => {
  it('m:ss hasta 59:59 y h:mm:ss desde una hora, redondeando hacia abajo', () => {
    expect(formatear(0)).toBe('0:00');
    expect(formatear(999)).toBe('0:00');
    expect(formatear(65_000)).toBe('1:05');
    expect(formatear(59 * MINUTO + 59_000)).toBe('59:59');
    expect(formatear(60 * MINUTO)).toBe('1:00:00');
    expect(formatear(-5)).toBe('0:00');
  });

  it('el nombre de una duración', () => {
    expect(nombreDeDuracion(10 * MINUTO)).toBe('10 min');
    expect(nombreDeDuracion(80 * MINUTO)).toBe('1 h 20 min');
    expect(nombreDeDuracion(45_000)).toBe('45 s');
    expect(nombreDeDuracion(60 * MINUTO)).toBe('1 h');
    expect(nombreDeDuracion(0)).toBe('0 s');
  });
});

describe('las ruedas', () => {
  it('pasan a milisegundos', () => {
    expect(aMs({ h: 1, m: 20, s: 5 })).toBe(80 * MINUTO + 5000);
    expect(aMs({ h: 0, m: 0, s: 0 })).toBe(0);
  });

  it('giran con tope circular: 24 horas, 60 minutos y 60 segundos', () => {
    expect(girar({ h: 0, m: 0, s: 0 }, 'h', -1)).toEqual({ h: 23, m: 0, s: 0 });
    expect(girar({ h: 23, m: 0, s: 0 }, 'h', 1)).toEqual({ h: 0, m: 0, s: 0 });
    expect(girar({ h: 0, m: 0, s: 0 }, 'm', -1)).toEqual({ h: 0, m: 59, s: 0 });
    expect(girar({ h: 0, m: 59, s: 0 }, 'm', 1)).toEqual({ h: 0, m: 0, s: 0 });
    expect(girar({ h: 0, m: 0, s: 59 }, 's', 1)).toEqual({ h: 0, m: 0, s: 0 });
    expect(girar({ h: 0, m: 10, s: 0 }, 's', -1)).toEqual({ h: 0, m: 10, s: 59 });
  });
});

describe('lo guardado', () => {
  it('sin nada, roto o de otra forma: lo de fábrica', () => {
    expect(leerGuardado(null)).toEqual(GUARDADO_POR_DEFECTO);
    expect(leerGuardado('{roto')).toEqual(GUARDADO_POR_DEFECTO);
    expect(leerGuardado({ temporizadores: 'no', crono: 3, ultimaDuracion: [] })).toEqual(GUARDADO_POR_DEFECTO);
    expect(GUARDADO_POR_DEFECTO.ultimaDuracion).toEqual(DURACION_POR_DEFECTO);
    expect(DURACION_POR_DEFECTO).toEqual({ h: 0, m: 10, s: 0 });
  });

  it('conserva los temporizadores bien formados y descarta los otros', () => {
    const g = leerGuardado({
      temporizadores: [
        { id: 'a', nombre: 'Pasta', duracion: 1000, fin: 5000 },
        { id: 'b', nombre: 'Horno', duracion: 1000, restante: 400 },
        { id: 'c', nombre: 'Las dos', duracion: 1000, fin: 5000, restante: 400 },
        { id: 'd', nombre: 'Negativa', duracion: -1, fin: 5000 },
        { id: 7, nombre: 'Sin id', duracion: 1000, fin: 5000 },
        'nada'
      ],
      crono: { desde: 100, acumulado: 50 },
      ultimaDuracion: { h: 1, m: 2, s: 3 }
    });
    expect(g.temporizadores).toEqual([
      { id: 'a', nombre: 'Pasta', duracion: 1000, fin: 5000 },
      { id: 'b', nombre: 'Horno', duracion: 1000, restante: 400 }
    ]);
    expect(g.crono).toEqual({ desde: 100, acumulado: 50 });
    expect(g.ultimaDuracion).toEqual({ h: 1, m: 2, s: 3 });
  });

  it('el cronómetro corriendo sigue desde donde estaba al recargar', () => {
    const g = leerGuardado({ temporizadores: [], crono: { desde: T0, acumulado: 2000 }, ultimaDuracion: { h: 0, m: 5, s: 0 } });
    expect(transcurrido(g.crono, T0 + 3000)).toBe(5000);
  });

  it('un cronómetro o unas ruedas fuera de forma caen en lo de fábrica, sin tocar lo demás', () => {
    const g = leerGuardado({ temporizadores: [], crono: { acumulado: 'x' }, ultimaDuracion: { h: 0, m: 61, s: 0 } });
    expect(g.crono).toEqual(CRONO_EN_CERO);
    expect(g.ultimaDuracion).toEqual(DURACION_POR_DEFECTO);
  });
});
