import { describe, it, expect, beforeEach } from 'vitest';
import { renderPlanAgregar, bloqueDeAgregar } from '../src/ui/plan-agregar.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { entradaFalsa } from './dobles.js';
import type { Categoria, Coincidencias } from '../src/tipos.js';

const categorias: Categoria[] = [
  { id: 'c1', nombre: 'Carnes', color: 'carnes', foto: '' },
  { id: 'c2', nombre: 'Aves', color: 'aves', foto: '' }
];

beforeEach(() => registrarCategorias(categorias));

const menuDiario = [
  entradaFalsa({ id_archivo: 'f2', titulo: 'Tortilla de papas', categoria: 'Carnes', tags: ['menú diario'] }),
  entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes', tags: ['menú diario'] })
];

const sinResultados: Coincidencias = { porNombre: [], porIngrediente: [], porTag: [] };

/** Los campos de `OpcionesBloque` que no cambian entre los tests que no tocan categorías. */
const sinCategoriaElegida = { categorias, categoriaElegida: null, deLaCategoria: [] };

describe('agregar una receta a una comida', () => {
  it('el título dice para qué comida es, y se vuelve con el chevron', () => {
    const html = renderPlanAgregar({
      dia: 1, momento: 'mediodia', menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida
    });
    expect(html).toContain('Martes al mediodía');
    expect(html).toContain('data-accion="volver"');
  });

  it('a la noche lo dice así', () => {
    const html = renderPlanAgregar({
      dia: 1, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida
    });
    expect(html).toContain('Martes a la noche');
  });

  it('la caja de búsqueda va arriba, y no es la que navega a los resultados', () => {
    const html = renderPlanAgregar({
      dia: 0, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida
    });
    expect(html).toContain('data-accion="buscar-en-plan"');
    expect(html).not.toContain('data-accion="buscar"');
  });

  it('sin texto escrito muestra el bloque Menú diario, alfabético', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida });
    expect(html).toContain('Menú diario');
    expect(html.indexOf('Milanesas napolitanas')).toBeLessThan(html.indexOf('Tortilla de papas'));
  });

  it('sin recetas con ese tag, no hay bloque Menú diario, pero la grilla de categorías sigue', () => {
    const html = bloqueDeAgregar({ menuDiario: [], consulta: '', grupos: sinResultados, ...sinCategoriaElegida });
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Categorías');
  });

  it('las tarjetas suman a la comida y no llevan a la receta', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida });
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).not.toContain('href="#/r/f1"');
  });

  it('al escribir, el bloque se reemplaza por los resultados agrupados', () => {
    const grupos: Coincidencias = {
      porNombre: [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes' })],
      porIngrediente: [{ entrada: entradaFalsa({ id_archivo: 'f3', titulo: 'Guiso', categoria: 'Carnes' }), motivo: 'tiene Papa' }],
      porTag: []
    };
    const html = bloqueDeAgregar({ menuDiario, consulta: 'papa', grupos, ...sinCategoriaElegida });
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Por nombre');
    expect(html).toContain('Por ingrediente');
    expect(html).toContain('tiene Papa');
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f3"');
  });

  it('una búsqueda sin resultados lo dice, nombrando los tres criterios', () => {
    const html = bloqueDeAgregar({ menuDiario, consulta: 'kiwi', grupos: sinResultados, ...sinCategoriaElegida });
    expect(html).toContain('Ninguna receta se llama, lleva ni tiene <b>kiwi</b>.');
  });

  it('el bloque que se redibuja tiene su marca en el HTML de la pantalla', () => {
    const html = renderPlanAgregar({
      dia: 0, momento: 'noche', menuDiario, consulta: '', grupos: sinResultados, ...sinCategoriaElegida
    });
    expect(html).toContain('data-resultados-plan');
  });
});

describe('la grilla de categorías, para no tener que escribir (P69)', () => {
  it('ofrece las categorías, alfabéticas, cada una como un botón y no un link', () => {
    const html = bloqueDeAgregar({ menuDiario: [], consulta: '', grupos: sinResultados, ...sinCategoriaElegida });
    expect(html.indexOf('Aves')).toBeLessThan(html.indexOf('Carnes'));
    expect(html).toContain('data-accion="elegir-categoria-plan" data-nombre="Aves"');
    expect(html).not.toContain('href="#/c/Aves"');
  });

  it('elegida una categoría, se filtra a sus recetas y no navega a la pantalla de la categoría', () => {
    const deLaCategoria = [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes' })];
    const html = bloqueDeAgregar({
      menuDiario, consulta: '', grupos: sinResultados,
      categorias, categoriaElegida: 'Carnes', deLaCategoria
    });
    expect(html).not.toContain('Categorías');
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Milanesas napolitanas');
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).toContain('data-accion="volver-categorias-plan"');
  });

  it('una categoría sin recetas lo dice, en vez de dejar la lista vacía', () => {
    const html = bloqueDeAgregar({
      menuDiario, consulta: '', grupos: sinResultados,
      categorias, categoriaElegida: 'Aves', deLaCategoria: []
    });
    expect(html).toContain('Todavía no hay recetas en <b>Aves</b>.');
  });
});
