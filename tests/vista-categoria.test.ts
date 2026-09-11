import { describe, it, expect } from 'vitest';
import { renderCategoria } from '../src/ui/categoria.js';
import { entradaFalsa } from './dobles.js';

const veinte = Array.from({ length: 20 }, (_, i) =>
  entradaFalsa({ id_archivo: `f${i}`, titulo: `Receta ${String(i).padStart(2, '0')}`,
                 categoria: 'Pescados y mariscos', completa: true }));

describe('Categoría', () => {
  it('el total del encabezado es el total real desde el primer momento', () => {
    const html = renderCategoria({
      nombre: 'Pescados y mariscos', entradas: veinte.slice(0, 13), total: 20, visibles: 13, tagsActivos: []
    });
    expect(html).toContain('>20<');
    expect(html.match(/class="tarjeta"/g)).toHaveLength(13);
  });

  it('mientras falta un tramo, el spinner va al final de la lista', () => {
    const html = renderCategoria({ nombre: 'A', entradas: veinte.slice(0, 13), total: 20, visibles: 13, tagsActivos: [] });
    expect(html.indexOf('class="spin"')).toBeGreaterThan(html.lastIndexOf('class="tarjeta"'));
  });

  it('con todo cargado no queda spinner', () => {
    expect(renderCategoria({ nombre: 'A', entradas: veinte, total: 20, visibles: 20, tagsActivos: [] }))
      .not.toContain('class="spin"');
  });

  it('con un filtro puesto, el encabezado lo dice y ofrece quitarlo', () => {
    const html = renderCategoria({ nombre: 'A', entradas: [], total: 0, visibles: 0, tagsActivos: ['horno'] });
    expect(html).toContain('horno');
    expect(html).toContain('data-accion="quitar-tag"');
  });

  it('filtrar hasta cero muestra la frase y el control para quitar el filtro', () => {
    const html = renderCategoria({ nombre: 'A', entradas: [], total: 0, visibles: 0, tagsActivos: ['horno'] });
    expect(html).toContain('class="vacio"');
    expect(html).toContain('data-accion="quitar-tag"');
  });

  it('una receta incompleta se lista igual y no se ordena distinto', () => {
    const entradas = [entradaFalsa({ titulo: 'A', completa: false }), entradaFalsa({ titulo: 'B', completa: true })];
    const html = renderCategoria({ nombre: 'C', entradas, total: 2, visibles: 2, tagsActivos: [] });
    expect(html.indexOf('>A<')).toBeLessThan(html.indexOf('>B<'));
  });

  it('el orden es alfabético por título, venga como venga', () => {
    const entradas = [entradaFalsa({ titulo: 'Zapallo' }), entradaFalsa({ titulo: 'Ajo' })];
    const html = renderCategoria({ nombre: 'C', entradas, total: 2, visibles: 2, tagsActivos: [] });
    expect(html.indexOf('>Ajo<')).toBeLessThan(html.indexOf('>Zapallo<'));
  });

  it('una categoría vacía muestra una frase, sin ilustración', () => {
    const html = renderCategoria({ nombre: 'Bebidas', entradas: [], total: 0, visibles: 0, tagsActivos: [] });
    expect(html).toContain('class="vacio"');
    // Sin ilustración es del cuerpo: el ícono de volver del encabezado queda.
    const cuerpo = html.slice(html.indexOf('class="cuerpo'));
    expect(cuerpo).not.toContain('<svg');
  });
});
