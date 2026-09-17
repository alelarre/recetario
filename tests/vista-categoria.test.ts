import { describe, it, expect } from 'vitest';
import { renderCategoria } from '../src/ui/categoria.js';
import { entradaFalsa } from './dobles.js';

const veinte = Array.from({ length: 20 }, (_, i) =>
  entradaFalsa({ id_archivo: `f${i}`, titulo: `Receta ${String(i).padStart(2, '0')}`,
                 categoria: 'Pescados y mariscos' }));

describe('Categoría', () => {
  it('el total del encabezado es el total real desde el primer momento', () => {
    const html = renderCategoria({
      nombre: 'Pescados y mariscos', entradas: veinte.slice(0, 13), total: 20, visibles: 13, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html).toContain('>20<');
    expect(html.match(/class="tarjeta"/g)).toHaveLength(13);
  });

  it('mientras falta un tramo, el spinner va al final de la lista', () => {
    const html = renderCategoria({
      nombre: 'A', entradas: veinte.slice(0, 13), total: 20, visibles: 13, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html.indexOf('class="spin"')).toBeGreaterThan(html.lastIndexOf('class="tarjeta"'));
  });

  it('con todo cargado no queda spinner', () => {
    expect(renderCategoria({
      nombre: 'A', entradas: veinte, total: 20, visibles: 20, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    })).not.toContain('class="spin"');
  });

  it('con un filtro puesto, se ve encendido en el carrusel', () => {
    const html = renderCategoria({
      nombre: 'A', entradas: [], total: 0, visibles: 0, tagsActivos: ['horno'],
      tags: [{ tag: 'horno', cantidad: 1 }], duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html).toContain('>horno<');
    expect(html).toContain('class="chip act"');
  });

  it('filtrar hasta cero muestra la frase, con el carrusel encendido arriba', () => {
    const html = renderCategoria({
      nombre: 'A', entradas: [], total: 0, visibles: 0, tagsActivos: ['horno'],
      tags: [{ tag: 'horno', cantidad: 1 }], duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html).toContain('class="vacio"');
    expect(html).toContain('class="chip act"');
  });

  it('el carrusel va arriba de la lista, con los tags de la categoría', () => {
    const html = renderCategoria({
      nombre: 'Carnes', entradas: [], total: 0, visibles: 0, tagsActivos: [],
      tags: [{ tag: 'horno', cantidad: 2 }], duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html).toContain('carrusel-marco');
    expect(html).toContain('>horno<');
  });

  it('una receta incompleta se lista igual y no se ordena distinto', () => {
    const entradas = [entradaFalsa({ titulo: 'A', tags: ['incompleta'] }), entradaFalsa({ titulo: 'B' })];
    const html = renderCategoria({
      nombre: 'C', entradas, total: 2, visibles: 2, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html.indexOf('>A<')).toBeLessThan(html.indexOf('>B<'));
  });

  it('el orden es alfabético por título, venga como venga', () => {
    const entradas = [entradaFalsa({ titulo: 'Zapallo' }), entradaFalsa({ titulo: 'Ajo' })];
    const html = renderCategoria({
      nombre: 'C', entradas, total: 2, visibles: 2, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html.indexOf('>Ajo<')).toBeLessThan(html.indexOf('>Zapallo<'));
  });

  it('las favoritas van primero, y adentro sigue el alfabético', () => {
    const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags, categoria: 'Carnes' });
    const html = renderCategoria({
      nombre: 'Carnes',
      entradas: [e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])],
      total: 4, visibles: 4, tagsActivos: [], tags: [], duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    const orden = ['Asado', 'Osobuco', 'Bife', 'Vitel toné'].map(t => html.indexOf(t));
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it('una categoría vacía muestra una frase, sin ilustración', () => {
    const html = renderCategoria({
      nombre: 'Bebidas', entradas: [], total: 0, visibles: 0, tagsActivos: [], tags: [],
      duraciones: [], duracionesActivas: [], orden: 'alfa'
    });
    expect(html).toContain('class="vacio"');
    // Sin ilustración es del cuerpo: el ícono de volver del encabezado queda.
    const cuerpo = html.slice(html.indexOf('class="cuerpo'));
    expect(cuerpo).not.toContain('<svg');
  });
});

describe('Categoría — duración', () => {
  const base = {
    nombre: 'Pescados y mariscos', total: 2, visibles: 2, tagsActivos: [], tags: [],
    duracionesActivas: [] as string[], orden: 'alfa' as const
  };
  const con = [
    entradaFalsa({ id_archivo: 'a', titulo: 'Zarzuela', tiempo: '~15 min' }),
    entradaFalsa({ id_archivo: 'b', titulo: 'Abadejo', tiempo: '>60 min' })
  ];

  it('con duraciones, dibuja la fila de filtro y el conmutador', () => {
    const html = renderCategoria({
      ...base, entradas: con, duraciones: [{ valor: '~15 min', cantidad: 1 }, { valor: '>60 min', cantidad: 1 }]
    });
    expect(html).toContain('data-accion="filtrar-duracion"');
    expect(html).toContain('data-accion="ordenar"');
  });

  it('sin ninguna duración, no hay fila de filtro ni conmutador', () => {
    const html = renderCategoria({ ...base, entradas: con, duraciones: [] });
    expect(html).not.toContain('data-accion="filtrar-duracion"');
    expect(html).not.toContain('data-accion="ordenar"');
  });

  it('ordena según el orden elegido', () => {
    const alfa = renderCategoria({ ...base, entradas: con, duraciones: [{ valor: '~15 min', cantidad: 1 }] });
    expect(alfa.indexOf('Abadejo')).toBeLessThan(alfa.indexOf('Zarzuela'));
    const dur = renderCategoria({ ...base, entradas: con, orden: 'duracion', duraciones: [{ valor: '~15 min', cantidad: 1 }] });
    expect(dur.indexOf('Zarzuela')).toBeLessThan(dur.indexOf('Abadejo'));
  });

  it('con un filtro de duración puesto y ninguna receta, el vacío invita a sacar filtros', () => {
    const html = renderCategoria({
      ...base, entradas: [], total: 0, visibles: 0, duracionesActivas: ['~15 min'],
      duraciones: []
    });
    expect(html).toContain('Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.');
  });
});
