import { describe, it, expect } from 'vitest';
import { renderCompras } from '../src/ui/compras.js';

const lista = {
  conCantidad: [{ nombre: 'Harina', cantidad: '500 g' }, { nombre: 'Huevos', cantidad: '5' }],
  sinCantidad: ['Perejil', 'Sal']
};

describe('la lista de compras', () => {
  it('lleva volver, el título y el ícono de compartir', () => {
    const html = renderCompras({ lista });
    expect(html).toContain('Lista de compras');
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain('data-accion="compartir-compras"');
  });

  it('son dos fichas, con las filas de ingredientes de la receta', () => {
    const html = renderCompras({ lista });
    expect(html).toContain('<h2>Con cantidad</h2>');
    expect(html).toContain('<h2>Sin cantidad</h2>');
    expect(html).toContain('<div class="ing"><span class="n">Harina</span><span class="c">500 g</span></div>');
    expect(html).toContain('<div class="ing"><span class="n">Perejil</span></div>');
  });

  it('no se tilda nada: ninguna fila es un control', () => {
    const html = renderCompras({ lista });
    expect(html).not.toContain('<input');
    expect(html).not.toContain('checkbox');
  });

  it('una sección vacía no se dibuja', () => {
    const html = renderCompras({ lista: { conCantidad: lista.conCantidad, sinCantidad: [] } });
    expect(html).toContain('Con cantidad');
    expect(html).not.toContain('Sin cantidad');
  });

  it('sin nada —todas las recetas del plan se borraron— lo dice', () => {
    const html = renderCompras({ lista: { conCantidad: [], sinCantidad: [] } });
    expect(html).toContain('class="vacio"');
  });

  it('compartir ofrece Texto solamente', () => {
    const html = renderCompras({ lista, compartir: { paso: 'opciones', solo: 'texto' } });
    expect(html).toContain('data-accion="compartir-texto"');
    expect(html).not.toContain('data-accion="compartir-pdf"');
    expect(html).not.toContain('data-accion="compartir-link"');
  });
});
