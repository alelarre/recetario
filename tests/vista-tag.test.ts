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

  it('un tag especial lleva su ícono en el encabezado, antes del nombre', () => {
    const html = renderTag({ ...base, tag: 'probar', tagsActivos: ['probar'], entradas: [] });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    expect(enc).toContain(`${ICO.marcador}probar`);
  });

  it('un tag común no lleva ícono en el encabezado', () => {
    const html = renderTag({ ...base, entradas: [] });
    const titulo = html.slice(html.indexOf('<span class="tit">'), html.indexOf('</span>', html.indexOf('<span class="tit">')));
    expect(titulo).not.toContain('<svg');
  });

  it('el chip encendido del carrusel lleva el ícono del especial', () => {
    const html = renderTag({
      ...base, tag: 'probar', tagsActivos: ['probar'], entradas: [],
      tags: [{ tag: 'probar', cantidad: 1 }]
    });
    expect(html).toContain(ICO.marcador);
    expect(html).toContain('class="chip act"');
  });

  it('el chip del tag de la ruta no es tocable: cambiar de tag es volver', () => {
    const html = renderTag({
      ...base, entradas: [], tags: [{ tag: 'horno', cantidad: 2 }, { tag: 'rápido', cantidad: 1 }]
    });
    expect(html).not.toContain('data-tag="horno"');
    // Los demás chips del carrusel siguen acumulando como siempre.
    expect(html).toContain('data-tag="rápido"');
  });

  it('corta el carrusel en veinte tags, como el Recetario', () => {
    const muchos = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const html = renderTag({ ...base, entradas: [], tags: muchos });
    expect(html).toContain('>t19<');
    expect(html).not.toContain('>t20<');
  });

  it('las favoritas van primero', () => {
    const html = renderTag({ ...base, entradas: [
      entradaFalsa({ titulo: 'Zapallo', tags: ['horno'] }),
      entradaFalsa({ titulo: 'Arroz', tags: ['horno', 'favorito'] })
    ] });
    expect(html.indexOf('Arroz')).toBeLessThan(html.indexOf('Zapallo'));
  });

  it('sin recetas muestra el vacío, sin invitar a sacar un filtro que no se puede sacar', () => {
    const html = renderTag({ ...base, entradas: [], total: 0, visibles: 0 });
    expect(html).toContain('class="vacio"');
    // El tag de la ruta no se puede sacar: el vacío dice el hecho, no invita a nada.
    expect(html).not.toContain('Probá');
  });
});
