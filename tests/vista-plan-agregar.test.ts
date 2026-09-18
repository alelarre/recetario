import { describe, it, expect, beforeEach } from 'vitest';
import { renderPlanAgregar, bloqueDeAgregar } from '../src/ui/plan-agregar.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { entradaFalsa } from './dobles.js';
import type { Coincidencias } from '../src/tipos.js';

beforeEach(() => registrarCategorias([{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: '' }]));

const menuDiario = [
  entradaFalsa({ id_archivo: 'f2', titulo: 'Tortilla de papas', categoria: 'Carnes', tags: ['menú diario'] }),
  entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes', tags: ['menú diario'] })
];

const sinResultados: Coincidencias = { porNombre: [], porIngrediente: [], porTag: [] };

describe('agregar una receta a una comida', () => {
  it('el título dice para qué comida es, y se vuelve con el chevron', () => {
    const html = renderPlanAgregar({ dia: 1, momento: 'mediodia', menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('Martes al mediodía');
    expect(html).toContain('data-accion="volver"');
  });

  it('a la noche lo dice así', () => {
    const html = renderPlanAgregar({ dia: 1, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('Martes a la noche');
  });

  it('la caja de búsqueda va arriba, y no es la que navega a los resultados', () => {
    const html = renderPlanAgregar({ dia: 0, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('data-accion="buscar-en-plan"');
    expect(html).not.toContain('data-accion="buscar"');
  });

  it('sin texto escrito muestra el bloque Menú diario, alfabético', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('Menú diario');
    expect(html.indexOf('Milanesas napolitanas')).toBeLessThan(html.indexOf('Tortilla de papas'));
  });

  it('sin recetas con ese tag, el bloque no se dibuja', () => {
    expect(bloqueDeAgregar({ menuDiario: [], consulta: '', grupos: sinResultados })).toBe('');
  });

  it('las tarjetas suman a la comida y no llevan a la receta', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).not.toContain('href="#/r/f1"');
  });

  it('al escribir, el bloque se reemplaza por los resultados agrupados', () => {
    const grupos: Coincidencias = {
      porNombre: [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes' })],
      porIngrediente: [{ entrada: entradaFalsa({ id_archivo: 'f3', titulo: 'Guiso', categoria: 'Carnes' }), motivo: 'tiene Papa' }],
      porTag: []
    };
    const html = bloqueDeAgregar({ menuDiario, consulta: 'papa', grupos });
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Por nombre');
    expect(html).toContain('Por ingrediente');
    expect(html).toContain('tiene Papa');
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f3"');
  });

  it('una búsqueda sin resultados lo dice, nombrando los tres criterios', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: 'kiwi', grupos: sinResultados });
    expect(html).toContain('Ninguna receta se llama, lleva ni tiene <b>kiwi</b>.');
  });

  it('el bloque que se redibuja tiene su marca en el HTML de la pantalla', () => {
    const html = renderPlanAgregar({ dia: 0, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados });
    expect(html).toContain('data-resultados-plan');
  });
});
