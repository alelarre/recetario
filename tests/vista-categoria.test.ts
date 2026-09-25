import { describe, it, expect } from 'vitest';
import { renderCategoria } from '../src/ui/categoria.js';
import { entradaFalsa, listaPlanaFalsa } from './dobles.js';

const veinte = Array.from({ length: 20 }, (_, i) =>
  entradaFalsa({ id_archivo: `f${i}`, titulo: `Receta ${String(i).padStart(2, '0')}`,
                 categoria: 'Pescados y mariscos' }));

// El orden, el filtro y el tramo son del controlador: `lista-control.test.ts`.
describe('Categoría', () => {
  it('el total del encabezado es el total real desde el primer momento', () => {
    const html = renderCategoria({
      nombre: 'Pescados y mariscos', lista: listaPlanaFalsa({ entradas: veinte.slice(0, 13), total: 20, hayMas: true }),
      tagsActivos: [], tags: []
    });
    expect(html).toContain('>20<');
    expect(html.match(/class="fila tarjeta"/g)).toHaveLength(13);
  });

  it('mientras falta un tramo, el spinner va al final de la lista', () => {
    const html = renderCategoria({
      nombre: 'A', lista: listaPlanaFalsa({ entradas: veinte.slice(0, 13), total: 20, hayMas: true }), tagsActivos: [], tags: []
    });
    expect(html.indexOf('class="spin"')).toBeGreaterThan(html.lastIndexOf('class="fila tarjeta"'));
  });

  it('con todo cargado no queda spinner', () => {
    expect(renderCategoria({ nombre: 'A', lista: listaPlanaFalsa({ entradas: veinte }), tagsActivos: [], tags: [] }))
      .not.toContain('class="spin"');
  });

  it('con un filtro puesto, se ve encendido en el carrusel', () => {
    const html = renderCategoria({
      nombre: 'A', lista: listaPlanaFalsa(), tagsActivos: ['horno'], tags: [{ tag: 'horno', cantidad: 1 }]
    });
    expect(html).toContain('>horno<');
    expect(html).toContain('class="chip act"');
  });

  it('sin recetas y sin filtros, dice por dónde entran', () => {
    const html = renderCategoria({ nombre: 'Carnes', lista: listaPlanaFalsa(), tagsActivos: [], tags: [] });
    expect(html).toContain(
      'Todavía no hay nada acá. Entran con Nueva receta, compartiendo desde otra app, ' +
      'o como archivos .md en la carpeta Carnes de Drive.'
    );
  });

  it('filtrar hasta cero muestra la frase, con el carrusel encendido arriba', () => {
    const html = renderCategoria({
      nombre: 'A', lista: listaPlanaFalsa(), tagsActivos: ['horno'], tags: [{ tag: 'horno', cantidad: 1 }]
    });
    expect(html).toContain('Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.');
    expect(html).toContain('class="chip act"');
  });

  it('el carrusel va arriba de la lista, con los tags de la categoría', () => {
    const html = renderCategoria({
      nombre: 'Carnes', lista: listaPlanaFalsa({ entradas: veinte }), tagsActivos: [], tags: [{ tag: 'horno', cantidad: 2 }]
    });
    expect(html).toContain('carrusel-marco');
    expect(html).toContain('>horno<');
    expect(html.indexOf('carrusel-marco')).toBeLessThan(html.indexOf('class="lista"'));
  });

  it('dibuja las recetas en el orden en que se las da el controlador', () => {
    const entradas = [entradaFalsa({ titulo: 'Zapallo' }), entradaFalsa({ titulo: 'Ajo' })];
    const html = renderCategoria({ nombre: 'C', lista: listaPlanaFalsa({ entradas }), tagsActivos: [], tags: [] });
    expect(html.indexOf('>Zapallo<')).toBeLessThan(html.indexOf('>Ajo<'));
  });

  it('una categoría vacía muestra una frase, sin ilustración', () => {
    const html = renderCategoria({ nombre: 'Bebidas', lista: listaPlanaFalsa(), tagsActivos: [], tags: [] });
    expect(html).toContain('class="vacio"');
    // Sin ilustración es del cuerpo: el ícono de volver del encabezado queda.
    const cuerpo = html.slice(html.indexOf('class="cuerpo'));
    expect(cuerpo).not.toContain('<svg');
  });
});

describe('Categoría — duración', () => {
  const con = [
    entradaFalsa({ id_archivo: 'a', titulo: 'Zarzuela', tiempo: '~15 min' }),
    entradaFalsa({ id_archivo: 'b', titulo: 'Abadejo', tiempo: '>60 min' })
  ];

  it('con duraciones, dibuja la fila de filtro y el conmutador', () => {
    const html = renderCategoria({
      nombre: 'P', tagsActivos: [], tags: [],
      lista: listaPlanaFalsa({ entradas: con, duraciones: [{ valor: '~15 min', cantidad: 1 }, { valor: '>60 min', cantidad: 1 }], orden: 'alfa' })
    });
    expect(html).toContain('data-accion="filtrar-duracion"');
    expect(html).toContain('data-accion="ordenar"');
  });

  it('sin ninguna duración, no hay fila de filtro ni conmutador', () => {
    const html = renderCategoria({ nombre: 'P', tagsActivos: [], tags: [], lista: listaPlanaFalsa({ entradas: con }) });
    expect(html).not.toContain('data-accion="filtrar-duracion"');
    expect(html).not.toContain('data-accion="ordenar"');
  });

  it('con un filtro de duración puesto y ninguna receta, el vacío invita a sacar filtros', () => {
    const html = renderCategoria({
      nombre: 'P', tagsActivos: [], tags: [], lista: listaPlanaFalsa({ duracionesActivas: ['~15 min'], orden: 'alfa' })
    });
    expect(html).toContain('Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.');
  });
});
