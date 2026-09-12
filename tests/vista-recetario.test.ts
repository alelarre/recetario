import { describe, it, expect } from 'vitest';
import { renderRecetario } from '../src/ui/recetario.js';

const dibujar = (o = {}) => renderRecetario({
  categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 4 }, { id: 'c2', nombre: 'Postres', cantidad: 0 }],
  borradores: 3, ...o
});

describe('Recetario', () => {
  it('el título de la app va centrado en la barra', () => {
    expect(dibujar()).toContain('<span class="tit app"');
  });

  it('la búsqueda está arriba y visible, no detrás de un ícono', () => {
    const html = dibujar();
    expect(html.indexOf('class="buscar"')).toBeLessThan(html.indexOf('class="grilla"'));
    expect(html).toContain('placeholder="Buscar receta o ingrediente"');
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
    expect(dibujar({ menuAbierto: true })).toContain('lat abierto');
  });

  it('no hay barra de navegación inferior', () => {
    expect(dibujar()).not.toContain('class="nav"');
  });

  it('el planificador no está: E06 queda afuera', () => {
    expect(dibujar()).not.toContain('Planificar');
  });
});
