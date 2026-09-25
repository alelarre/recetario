import { describe, it, expect } from 'vitest';
import { renderRecetario } from '../src/ui/recetario.js';

/** Como lo llama `main`: el Recetario es destino del menú, y el contador es el de los borradores. */
const dibujar = ({ borradores = 3, abierto = false, ...o }: Record<string, unknown> & { borradores?: number; abierto?: boolean } = {}) =>
  renderRecetario({
    categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 4 }, { id: 'c2', nombre: 'Postres', cantidad: 0 }],
    borradores, tags: [], menu: { activo: 'recetario', abierto, borradores }, ...o
  });

describe('Recetario', () => {
  it('el título de la app va centrado en la barra', () => {
    expect(dibujar()).toContain('<span class="tit app"');
  });

  it('sin ninguna receta, dice por dónde entran; con alguna, no', () => {
    const vacio = dibujar({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 0 }], borradores: 0 });
    expect(vacio).toContain(
      'Todavía no hay recetas. Entran con Nueva receta, compartiendo desde otra app, ' +
      'o como archivos .md en las carpetas de Drive.'
    );
    expect(vacio).toContain('class="grilla"');
    expect(dibujar()).not.toContain('Todavía no hay recetas.');
  });

  it('sin recetas terminadas pero con borradores, lo dice; sin nada, el texto de hoy', () => {
    const conBorradores = dibujar({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 0 }], borradores: 2 });
    expect(conBorradores).toContain('Todavía no hay recetas terminadas. Hay 2 en Borradores.');
    expect(conBorradores).not.toContain('Todavía no hay recetas. Entran con Nueva receta');

    const sinNada = dibujar({ categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 0 }], borradores: 0 });
    expect(sinNada).toContain(
      'Todavía no hay recetas. Entran con Nueva receta, compartiendo desde otra app, ' +
      'o como archivos .md en las carpetas de Drive.'
    );
  });

  it('la búsqueda está arriba y visible, no detrás de un ícono', () => {
    const html = dibujar();
    expect(html.indexOf('class="buscar"')).toBeLessThan(html.indexOf('class="grilla"'));
    expect(html).toContain('placeholder="Buscar receta o ingrediente"');
  });

  it('dibuja el carrusel debajo de la búsqueda y arriba de las categorías', () => {
    const html = dibujar({ tags: [{ tag: 'horno', cantidad: 3 }] });
    expect(html.indexOf('data-accion="buscar"')).toBeLessThan(html.indexOf('carrusel-marco'));
    expect(html.indexOf('carrusel-marco')).toBeLessThan(html.indexOf('Categorías'));
  });

  it('sin tags no hay carrusel', () => {
    expect(dibujar({ tags: [] })).not.toContain('carrusel-marco');
  });

  it('las dieciséis categorías salen del índice, ninguna del código', () => {
    expect(dibujar({ categorias: [] })).not.toContain('class="tile"');
  });

  it('una categoría sin recetas se muestra igual', () => {
    const html = dibujar();
    expect(html).toContain('Postres');
    // Y sin un 0 encima: el contador sólo aparece cuando hay algo que contar.
    // Los dos `cu` son el del tile de Carnes y el de Borradores en el menú.
    expect(html).toContain('<span class="cu">4</span>');
    expect(html.match(/class="cu"/g)).toHaveLength(2);
  });

  it('cada categoría lleva a su lista', () => {
    expect(dibujar()).toContain('href="#/c/Carnes"');
  });

  it('las categorías salen alfabéticas, venga como venga el índice', () => {
    const html = dibujar({ categorias: [
      { id: 'c1', nombre: 'Otros', cantidad: 1 },
      { id: 'c2', nombre: 'Bebidas', cantidad: 1 },
      { id: 'c3', nombre: 'Aves', cantidad: 1 }
    ] });
    expect(html.indexOf('>Aves<')).toBeLessThan(html.indexOf('>Bebidas<'));
    expect(html.indexOf('>Bebidas<')).toBeLessThan(html.indexOf('>Otros<'));
  });

  it('el menú lateral lleva los destinos y el alta, con su nombre', () => {
    const html = dibujar();
    expect(html).toContain('class="lat');
    expect(html).toContain('href="#/borradores"');
    expect(html).toContain('href="#/nueva"');
    expect(html).toContain('href="#/ajustes"');
    // El destino actual queda marcado; «nueva receta» es una acción y no.
    expect(html).toContain('<a class="act" href="#/"');
    expect(html).toContain('<a href="#/nueva">');
  });

  it('el destino del Recetario se llama Inicio: «Recetario» ya es la marca de arriba del menú', () => {
    const html = dibujar();
    expect(html).toContain('<div class="marca">Recetario</div>');
    expect(html).toMatch(/<a class="act" href="#\/"><svg[^]*?<\/svg>Inicio<\/a>/);
  });

  it('el contador de borradores se ve con el menú cerrado, sobre la hamburguesa', () => {
    const html = dibujar();
    expect(html).toContain('data-accion="abrir-menu"');
    expect(html).toContain('<span class="n">3</span>');
  });

  it('en cero no hay número: ni en el menú ni sobre la hamburguesa', () => {
    const html = dibujar({ borradores: 0 });
    expect(html).toContain('data-accion="abrir-menu"');
    expect(html).not.toContain('class="n"');
    expect(html).toContain('href="#/borradores"');
  });

  it('el menú arranca cerrado y se despliega con la clase', () => {
    expect(dibujar()).not.toContain('lat abierto');
    expect(dibujar({ abierto: true })).toContain('lat abierto');
  });

  it('sin el menú, el volver y ningún lateral', () => {
    const html = renderRecetario({ categorias: [], borradores: 0, tags: [] });
    expect(html).toContain('data-accion="volver"');
    expect(html).not.toContain('class="lat');
  });

  it('no hay barra de navegación inferior', () => {
    expect(dibujar()).not.toContain('class="nav"');
  });

  it('el planificador no está: E06 queda afuera', () => {
    expect(dibujar()).not.toContain('Planificar');
  });
});
