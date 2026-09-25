import { describe, it, expect, beforeEach } from 'vitest';
import { renderPlanAgregar, bloqueDeAgregar } from '../src/ui/plan-agregar.js';
import { registrarCategorias } from '../src/ui/categorias.js';
import { crearListaControl } from '../src/lista-control.js';
import { entradaFalsa, listaPlanaFalsa } from './dobles.js';
import type { Categoria, Coincidencias, Entrada } from '../src/tipos.js';

const categorias: Categoria[] = [
  { id: 'c1', nombre: 'Carnes', color: 'carnes', foto: '' },
  { id: 'c2', nombre: 'Aves', color: 'aves', foto: '' }
];

beforeEach(() => registrarCategorias(categorias));

const recetasDelMenu = [
  entradaFalsa({ id_archivo: 'f2', titulo: 'Tortilla de papas', categoria: 'Carnes', tags: ['menú diario'] }),
  entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes', tags: ['menú diario'] })
];

/** Las listas como las arma la pantalla: por el controlador, que ordena y corta. */
const plana = (entradas: Entrada[]) => crearListaControl().plana(entradas, { filtros: false });
const inicio = (menu: Entrada[] = recetasDelMenu) => ({ menuDiario: plana(menu), categorias });
const busqueda = (consulta: string, grupos: Coincidencias) =>
  ({ busqueda: { consulta, lista: crearListaControl().agrupada(grupos) } });

const sinResultados: Coincidencias = { porNombre: [], porIngrediente: [], porTag: [] };

describe('agregar una receta a una comida', () => {
  it('el título dice para qué comida es, y se vuelve con el chevron', () => {
    const html = renderPlanAgregar({ dia: 1, momento: 'mediodia', consulta: '', ...inicio() });
    expect(html).toContain('Martes al mediodía');
    expect(html).toContain('data-accion="volver"');
  });

  it('a la noche lo dice así', () => {
    expect(renderPlanAgregar({ dia: 1, momento: 'noche', consulta: '', ...inicio() })).toContain('Martes a la noche');
  });

  it('la caja de búsqueda va arriba, con lo escrito, y no es la que navega a los resultados', () => {
    const html = renderPlanAgregar({ dia: 0, momento: 'noche', consulta: 'pa"pa', ...busqueda('pa"pa', sinResultados) });
    expect(html).toContain('data-accion="buscar-en-plan" value="pa&quot;pa"');
    expect(html).not.toContain('data-accion="buscar"');
  });

  it('sin texto escrito muestra el bloque Menú diario, en A–Z', () => {
    const html = bloqueDeAgregar(inicio());
    expect(html).toContain('Menú diario');
    expect(html.indexOf('Milanesas napolitanas')).toBeLessThan(html.indexOf('Tortilla de papas'));
  });

  it('Menú diario y Categorías van juntos en el envoltorio de grupos, que los separa', () => {
    expect(bloqueDeAgregar(inicio())).toMatch(/^<div class="grupos"><div class="grupo-res"><div class="rot">Menú diario</);
    expect(bloqueDeAgregar(inicio([]))).toMatch(/^<div class="grupos"><div class="grupo-res"><div class="rot">Categorías</);
  });

  it('sin recetas con ese tag, no hay bloque Menú diario, pero la grilla de categorías sigue', () => {
    const html = bloqueDeAgregar(inicio([]));
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Categorías');
  });

  it('las tarjetas suman a la comida y no llevan a la receta', () => {
    const html = bloqueDeAgregar(inicio());
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).not.toContain('href="#/r/f1"');
  });

  it('al escribir, el bloque se reemplaza por los resultados agrupados', () => {
    const grupos: Coincidencias = {
      porNombre: [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes' })],
      porIngrediente: [{ entrada: entradaFalsa({ id_archivo: 'f3', titulo: 'Guiso', categoria: 'Carnes' }), motivo: 'tiene Papa' }],
      porTag: []
    };
    const html = bloqueDeAgregar(busqueda('papa', grupos));
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Por nombre');
    expect(html).toContain('Por ingrediente');
    expect(html).toContain('tiene Papa');
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f3"');
  });

  it('una búsqueda sin resultados lo dice, nombrando los tres criterios', () => {
    expect(bloqueDeAgregar(busqueda('kiwi', sinResultados))).toContain('Ninguna receta se llama, lleva ni tiene <b>kiwi</b>.');
  });

  it('el bloque que se redibuja tiene su marca en el HTML de la pantalla', () => {
    expect(renderPlanAgregar({ dia: 0, momento: 'noche', consulta: '', ...inicio() })).toContain('data-resultados-plan');
  });
});

describe('la grilla de categorías, para no tener que escribir', () => {
  it('ofrece las categorías, alfabéticas, cada una como un botón y no un link', () => {
    const html = bloqueDeAgregar(inicio([]));
    expect(html.indexOf('Aves')).toBeLessThan(html.indexOf('Carnes'));
    expect(html).toContain('data-accion="elegir-categoria-plan" data-nombre="Aves"');
    expect(html).not.toContain('href="#/c/Aves"');
  });

  it('elegida una categoría, se filtra a sus recetas y no navega a la pantalla de la categoría', () => {
    const deLaCategoria = [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas napolitanas', categoria: 'Carnes' })];
    const html = bloqueDeAgregar({ categoria: { nombre: 'Carnes', lista: plana(deLaCategoria) } });
    expect(html).not.toContain('Categorías');
    expect(html).not.toContain('Menú diario');
    expect(html).toContain('Milanesas napolitanas');
    expect(html).toContain('data-accion="elegir-para-el-plan" data-id="f1"');
    expect(html).toContain('data-accion="volver-categorias-plan"');
  });

  it('la categoría elegida pagina: mientras falta un tramo, va el spinner del tramo', () => {
    const lista = listaPlanaFalsa({ entradas: [entradaFalsa({ id_archivo: 'f1' })], total: 40, hayMas: true });
    expect(bloqueDeAgregar({ categoria: { nombre: 'Carnes', lista } })).toContain('data-tramo');
  });

  it('una categoría sin recetas lo dice, en vez de dejar la lista vacía', () => {
    const html = bloqueDeAgregar({ categoria: { nombre: 'Aves', lista: plana([]) } });
    expect(html).toContain('Todavía no hay recetas en <b>Aves</b>.');
  });
});
