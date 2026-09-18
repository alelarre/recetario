import { describe, it, expect, beforeEach } from 'vitest';
import { renderPlan } from '../src/ui/plan.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { entradaFalsa } from './dobles.js';
import type { Plan } from '../src/tipos.js';

beforeEach(() => registrarCategorias([
  { id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: '' },
  { id: 'c2', nombre: 'Ensaladas', color: 'ensaladas', foto: '' }
]));

const entradas = [
  entradaFalsa({ id_archivo: 'f1', titulo: 'Rabas', categoria: 'Pescados y mariscos' }),
  entradaFalsa({ id_archivo: 'f2', titulo: 'Ensalada verde', categoria: 'Ensaladas' })
];

const plan: Plan = {
  comidas: [
    { dia: 1, momento: 'noche', id: 'f1', titulo: 'Rabas' },
    { dia: 1, momento: 'noche', id: 'f2', titulo: 'Ensalada verde' }
  ]
};

const dibujar = (opciones: Partial<Parameters<typeof renderPlan>[0]> = {}) =>
  renderPlan({ plan, entradas, hoy: 1, ...opciones });

describe('la grilla del plan', () => {
  it('arranca en hoy y da la vuelta', () => {
    const html = dibujar({ hoy: 1 });
    const dias = [...html.matchAll(/<b>([^<]+)<\/b>/g)].map(m => m[1]);
    expect(dias).toEqual(['Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun']);
  });

  it('hoy va marcado, con «hoy» debajo del nombre', () => {
    expect(dibujar({ hoy: 3 })).toContain('<div class="d hoy"><b>Jue</b><span>hoy</span></div>');
  });

  it('las dos columnas son Mediodía y Noche', () => {
    const html = dibujar();
    expect(html).toContain('<div class="cab">Mediodía</div>');
    expect(html).toContain('<div class="cab">Noche</div>');
  });

  it('una comida con varias recetas dibuja una línea por receta, en orden', () => {
    const html = dibujar();
    expect(html.indexOf('Rabas')).toBeLessThan(html.indexOf('Ensalada verde'));
    expect(html).toContain('href="#/r/f1"');
    expect(html).toContain('href="#/r/f2"');
  });

  it('cada línea lleva el color de su categoría', () => {
    expect(dibujar()).toContain('--c:var(--cat-pescados)');
  });

  it('cada línea tiene su cruz, que saca esa línea nada más', () => {
    const html = dibujar();
    expect(html).toContain('data-accion="sacar-del-plan" data-i="0"');
    expect(html).toContain('data-accion="sacar-del-plan" data-i="1"');
  });

  it('la receta que ya no está en el índice va tachada, sin color de categoría', () => {
    const html = renderPlan({ plan, entradas: [], hoy: 1 });
    expect(html).toContain('class="it ida"');
    expect(html).toContain('<s>Rabas</s>');
  });

  it('una comida sin nada es sólo el + , con borde punteado', () => {
    const html = dibujar();
    expect(html).toContain('<div class="celda libre">');
    expect(html).toContain('data-accion="agregar-al-plan" data-dia="1" data-momento="mediodia"');
  });

  it('las catorce comidas ofrecen agregar', () => {
    expect([...dibujar().matchAll(/data-accion="agregar-al-plan"/g)]).toHaveLength(14);
  });

  it('el título es Plan de la semana y se vuelve con el chevron', () => {
    const html = dibujar();
    expect(html).toContain('Plan de la semana');
    expect(html).toContain('data-accion="volver"');
  });
});

describe('el pie del plan', () => {
  it('lleva la lista de compras y reiniciar', () => {
    const html = dibujar();
    expect(html).toContain('data-accion="ir-a-compras"');
    expect(html).toContain('data-accion="reiniciar-plan"');
    expect(html).not.toContain('disabled');
  });

  it('con el plan vacío los dos quedan deshabilitados', () => {
    const html = renderPlan({ plan: { comidas: [] }, entradas, hoy: 0 });
    expect(html).toContain('<button class="btn prim" data-accion="ir-a-compras" disabled>');
    expect(html).toContain('<button class="btn sec" data-accion="reiniciar-plan" disabled>');
  });

  it('el plan vacío no lleva aviso: las catorce celdas con su + ya lo dicen', () => {
    expect(renderPlan({ plan: { comidas: [] }, entradas, hoy: 0 })).not.toContain('class="vacio"');
  });

  it('reiniciar pone la confirmación en el lugar de los dos botones', () => {
    const html = dibujar({ confirmandoReinicio: true });
    expect(html).toContain('¿Reiniciar el plan? Se vacían los siete días.');
    expect(html).toContain('data-accion="cancelar-reinicio"');
    expect(html).toContain('data-accion="reiniciar-plan-confirmado"');
    expect(html).not.toContain('data-accion="ir-a-compras"');
  });

  it('un error de escritura avisa arriba, con reintentar', () => {
    const html = dibujar({ error: 'No se pudo guardar el plan. Revisá la conexión.' });
    expect(html).toContain('No se pudo guardar el plan. Revisá la conexión.');
    expect(html).toContain('data-accion="reintentar"');
  });
});
