import { describe, it, expect } from 'vitest';
import {
  renderListaCategorias, renderEdicionCategoria, confirmacionBorrarCategoria, botonBorrarCategoria
} from '../src/ui/gestion-categorias.js';

const pastas = { id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };
const fiambres = { id: 'c2', nombre: 'Fiambres', color: '', foto: '' };

describe('la lista de categorías', () => {
  it('alfabética, con su conteo, y cada una lleva a su edición', () => {
    const html = renderListaCategorias({ categorias: [{ categoria: pastas, recetas: 12 }, { categoria: fiambres, recetas: 1 }] });
    expect(html.indexOf('Fiambres')).toBeLessThan(html.indexOf('Pastas'));
    expect(html).toContain('12 recetas');
    expect(html).toContain('1 receta<');
    expect(html).toContain('href="#/categorias/c1"');
    expect(html).toContain('href="#/categorias/nueva"');
  });

  it('una sin foto lleva la trama en la miniatura', () => {
    expect(renderListaCategorias({ categorias: [{ categoria: fiambres, recetas: 0 }] })).toContain('trama');
  });
});

describe('la edición de una categoría', () => {
  const valores = { nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };

  it('es un formulario con el nombre, las 16 muestras y las fotos, con la elegida marcada', () => {
    const html = renderEdicionCategoria({ categoria: pastas, valores, otros: ['Aves'] });
    expect(html).toContain('data-formulario');
    expect(html).toContain('name="nombre" value="Pastas"');
    expect(html.match(/data-accion="elegir-color"/g)).toHaveLength(16);
    expect(html).toContain('data-accion="elegir-color" data-valor="pastas" aria-pressed="true"');
    expect(html).toContain('data-accion="elegir-foto" data-valor="catalogo:pastas" aria-pressed="true"');
    expect(html).toContain('data-accion="elegir-foto" data-valor=""');
    expect(html).toContain('name="color" value="pastas"');
    expect(html).toContain('name="foto" value="catalogo:pastas"');
  });

  it('Guardar arranca deshabilitado: todavía no hay cambios', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toMatch(/data-accion="guardar-categoria"[^>]*disabled/);
  });

  it('la muestra de arriba es el tile que va a quedar', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toContain('data-muestra');
  });

  it('Borrar categoría sólo al editar', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toContain('data-accion="borrar-categoria"');
    expect(renderEdicionCategoria({ categoria: null, valores: { nombre: '', color: 'bebidas', foto: '' }, otros: [] }))
      .not.toContain('data-accion="borrar-categoria"');
  });

  it('una nueva se titula así', () => {
    expect(renderEdicionCategoria({ categoria: null, valores: { nombre: '', color: 'bebidas', foto: '' }, otros: [] }))
      .toContain('Nueva categoría');
  });

  it('el error de guardar va arriba', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [], error: 'No se pudo guardar.' }))
      .toContain('No se pudo guardar.');
  });
});

describe('la confirmación de borrado', () => {
  it('con recetas: cuántas, hasta tres nombres en orden, y el botón dice lo que hace', () => {
    const html = confirmacionBorrarCategoria('Pastas', ['Ravioles', 'Lasaña', 'Ñoquis', 'Canelones', 'Sorrentinos']);
    expect(html).toContain('<b>Pastas y sus 5 recetas van a la papelera de Drive.</b>');
    expect(html).toContain('Canelones, Lasaña, Ñoquis y 2 más.');
    expect(html).toContain('Borrar Pastas y 5 recetas');
    expect(html).toContain('data-accion="borrar-categoria-confirmado"');
  });

  it('con una receta, en singular', () => {
    expect(confirmacionBorrarCategoria('Pastas', ['Ñoquis'])).toContain('Pastas y su receta va a la papelera de Drive.');
  });

  it('vacía, la corta', () => {
    const html = confirmacionBorrarCategoria('Pastas', []);
    expect(html).toContain('<b>Pastas va a la papelera de Drive.</b>');
    expect(html).toContain('>Borrar Pastas<');
  });

  it('el botón que la abre', () => {
    expect(botonBorrarCategoria).toContain('data-accion="borrar-categoria"');
  });
});
