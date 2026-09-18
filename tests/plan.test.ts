import { describe, it, expect } from 'vitest';
import { parsePlan, serializePlan, diaDeHoy, diasDesde, DIAS, DIAS_CORTOS } from '../src/plan.js';
import type { Plan } from '../src/tipos.js';

const plan: Plan = {
  comidas: [
    { dia: 1, momento: 'noche', id: '1EjWIrmaQ', titulo: 'Rabas' },
    { dia: 1, momento: 'noche', id: '10szFByXS', titulo: 'Ensalada verde' },
    { dia: 3, momento: 'mediodia', id: '1lYb6YB9Q', titulo: 'Ñoquis de papa' }
  ]
};

const texto =
  '## Martes\n' +
  '- Noche: [Rabas](drive:1EjWIrmaQ)\n' +
  '- Noche: [Ensalada verde](drive:10szFByXS)\n' +
  '\n' +
  '## Jueves\n' +
  '- Mediodía: [Ñoquis de papa](drive:1lYb6YB9Q)\n';

describe('el .md del plan', () => {
  it('se escribe con un ## por día cargado, de lunes a domingo', () => {
    expect(serializePlan(plan)).toBe(texto);
  });

  it('ida y vuelta', () => {
    expect(parsePlan(serializePlan(plan))).toEqual(plan);
  });

  it('el plan vacío es un archivo vacío', () => {
    expect(serializePlan({ comidas: [] })).toBe('');
    expect(parsePlan('')).toEqual({ comidas: [] });
  });

  it('un día sin nada no se escribe', () => {
    expect(serializePlan({ comidas: [{ dia: 6, momento: 'noche', id: 'x', titulo: 'Sopa' }] }))
      .toBe('## Domingo\n- Noche: [Sopa](drive:x)\n');
  });

  it('los días salen en orden aunque las comidas vengan mezcladas', () => {
    const mezclado: Plan = {
      comidas: [
        { dia: 4, momento: 'noche', id: 'b', titulo: 'B' },
        { dia: 0, momento: 'mediodia', id: 'a', titulo: 'A' }
      ]
    };
    expect(serializePlan(mezclado)).toBe('## Lunes\n- Mediodía: [A](drive:a)\n\n## Viernes\n- Noche: [B](drive:b)\n');
  });

  it('varias recetas por comida se conservan en el orden del archivo', () => {
    const leido = parsePlan(
      '## Lunes\n- Noche: [C](drive:3)\n- Noche: [A](drive:1)\n- Noche: [B](drive:2)\n');
    expect(leido.comidas.map(c => c.titulo)).toEqual(['C', 'A', 'B']);
  });

  it('los nombres de día y de momento se comparan sin acentos ni mayúsculas', () => {
    const leido = parsePlan('## MIERCOLES\n- mediodia: [A](drive:1)\n');
    expect(leido.comidas).toEqual([{ dia: 2, momento: 'mediodia', id: '1', titulo: 'A' }]);
  });

  it('lo que no se reconoce se ignora', () => {
    const leido = parsePlan(
      '# Mi plan\n' +
      '## Lunedì\n' +
      '- Noche: [Fuera de día](drive:x)\n' +
      '## Lunes\n' +
      '- Merienda: [Otro momento](drive:y)\n' +
      '- Noche: sin link\n' +
      '- Noche: [Con otro esquema](https://ejemplo)\n' +
      'texto suelto\n' +
      '- Noche: [Vale](drive:z)\n');
    expect(leido.comidas).toEqual([{ dia: 0, momento: 'noche', id: 'z', titulo: 'Vale' }]);
  });

  it('lo ignorado se pierde al reescribir', () => {
    expect(serializePlan(parsePlan('## Lunes\n- Noche: sin link\n'))).toBe('');
  });

  it('con saltos de línea de Windows se lee igual', () => {
    expect(parsePlan('## Lunes\r\n- Noche: [A](drive:1)\r\n').comidas).toHaveLength(1);
  });

  it('un título con corchetes o paréntesis vuelve entero', () => {
    const conSignos: Plan = { comidas: [{ dia: 0, momento: 'noche', id: '1', titulo: 'Pan (de campo)' }] };
    expect(parsePlan(serializePlan(conSignos))).toEqual(conSignos);
  });
});

describe('los días', () => {
  it('son siete, con lunes primero', () => {
    expect(DIAS).toHaveLength(7);
    expect(DIAS[0]).toBe('Lunes');
    expect(DIAS_CORTOS).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
  });

  it('hoy sale del día de la semana del teléfono, con lunes en 0', () => {
    // 2026-09-14 fue lunes; 2026-09-20, domingo.
    expect(diaDeHoy(new Date(2026, 8, 14))).toBe(0);
    expect(diaDeHoy(new Date(2026, 8, 15))).toBe(1);
    expect(diaDeHoy(new Date(2026, 8, 20))).toBe(6);
  });

  it('la semana arranca en hoy y da la vuelta', () => {
    expect(diasDesde(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(diasDesde(0)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
