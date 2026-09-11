import { describe, it, expect } from 'vitest';
import { renderRecetario } from '../src/ui/recetario.js';

const dibujar = (o = {}) => renderRecetario({
  categorias: [{ id: 'c1', nombre: 'Carnes', cantidad: 4 }, { id: 'c2', nombre: 'Postres', cantidad: 0 }],
  borradores: 3, ...o
});

describe('Recetario', () => {
  it('la búsqueda está arriba y visible, no detrás de un ícono', () => {
    const html = dibujar();
    expect(html.indexOf('class="buscar"')).toBeLessThan(html.indexOf('class="grilla"'));
    expect(html).toContain('placeholder="Buscar receta o ingrediente"');
  });

  it('las dieciséis categorías salen del índice, ninguna del código', () => {
    expect(dibujar({ categorias: [] })).not.toContain('class="tile"');
  });

  it('una categoría sin recetas se muestra igual', () => {
    expect(dibujar()).toContain('Postres');
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

  it('la entrada a Borradores lleva el contador', () => {
    expect(dibujar()).toContain('>3<');
  });

  it('en cero, la entrada a Borradores sigue visible y sin número', () => {
    const html = dibujar({ borradores: 0 });
    expect(html).toContain('data-accion="borradores"');
    expect(html).not.toContain('class="n"');
  });

  it('Ajustes se llega desde acá', () => {
    expect(dibujar()).toContain('data-accion="ajustes"');
  });

  it('no hay barra de navegación inferior', () => {
    expect(dibujar()).not.toContain('class="nav"');
  });

  it('el planificador no está: E06 queda afuera', () => {
    expect(dibujar()).not.toContain('Planificar');
  });
});
