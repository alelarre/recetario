import { describe, it, expect } from 'vitest';
import { renderTag } from '../src/ui/tag.js';
import { entradaFalsa } from './dobles.js';
import { ICO } from '../src/ui/iconos.js';

describe('la lista por tag', () => {
  const base = { tag: 'horno', total: 2, visibles: 2, tagsActivos: ['horno'], tags: [] };

  it('el encabezado lleva el nombre del tag y el total', () => {
    const html = renderTag({ ...base, entradas: [entradaFalsa({ titulo: 'Pan' })] });
    expect(html).toContain('horno');
    expect(html).toContain('<span class="tot">2</span>');
  });

  it('el chip encendido del carrusel lleva el ícono del especial', () => {
    const html = renderTag({
      ...base, tag: 'probar', tagsActivos: ['probar'], entradas: [],
      tags: [{ tag: 'probar', cantidad: 1 }]
    });
    expect(html).toContain(ICO.marcador);
    expect(html).toContain('class="chip act"');
  });

  it('las favoritas van primero', () => {
    const html = renderTag({ ...base, entradas: [
      entradaFalsa({ titulo: 'Zapallo', tags: ['horno'] }),
      entradaFalsa({ titulo: 'Arroz', tags: ['horno', 'favorito'] })
    ] });
    expect(html.indexOf('Arroz')).toBeLessThan(html.indexOf('Zapallo'));
  });

  it('sin recetas muestra el vacío', () => {
    expect(renderTag({ ...base, entradas: [], total: 0, visibles: 0 }))
      .toContain('Ninguna receta con esos tags');
  });
});
