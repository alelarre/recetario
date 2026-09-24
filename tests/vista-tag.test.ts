import { describe, it, expect } from 'vitest';
import { renderTag } from '../src/ui/tag.js';
import { entradaFalsa } from './dobles.js';
import { ICO } from '../src/ui/iconos.js';
import type { Duracion } from '../src/catalogo.js';

describe('la lista por tag', () => {
  const base = {
    tag: 'horno', total: 2, visibles: 2, tagsActivos: ['horno'], tags: [],
    duraciones: [] as { valor: Duracion; cantidad: number }[],
    duracionesActivas: [] as string[], orden: 'alfa' as const
  };

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

  it('con un filtro de duración sin resultados, el vacío no le echa la culpa a los tags', () => {
    const html = renderTag({
      ...base, entradas: [], total: 0, visibles: 0, duracionesActivas: ['~15 min']
    });
    expect(html).toContain('class="vacio"');
    expect(html).toContain('Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.');
    expect(html).not.toContain('Ninguna receta tiene estos tags.');
  });

  it('con duraciones, dibuja la fila de filtro y el conmutador', () => {
    const html = renderTag({
      ...base,
      entradas: [
        entradaFalsa({ id_archivo: 'a', titulo: 'Zarzuela', tags: ['horno'], tiempo: '~15 min' }),
        entradaFalsa({ id_archivo: 'b', titulo: 'Abadejo', tags: ['horno'], tiempo: '>60 min' })
      ],
      duraciones: [{ valor: '~15 min', cantidad: 1 }, { valor: '>60 min', cantidad: 1 }]
    });
    expect(html).toContain('data-accion="filtrar-duracion"');
    expect(html).toContain('data-accion="ordenar"');
  });

  describe('con el menú: la lista de Borradores', () => {
    const borradores = { ...base, tag: 'borrador', tagsActivos: ['borrador'] };

    it('lleva la hamburguesa con el contador, y no el volver', () => {
      const html = renderTag({ ...borradores, entradas: [], menu: { abierto: false, borradores: 3 } });
      expect(html).toContain('data-accion="abrir-menu"');
      expect(html).toContain('<span class="n">3</span>');
      expect(html).not.toContain('data-accion="volver"');
    });

    it('se titula como el menú, no con el nombre del tag', () => {
      const html = renderTag({ ...borradores, titulo: 'Borradores', entradas: [], menu: { abierto: false, borradores: 0 } });
      // El título lleva adelante el ícono del tag, que es otro `<span>`.
      expect(html).toContain('<span class="borr"></span>Borradores</span>');
      expect(html).not.toContain('<span class="borr"></span>borrador</span>');
    });

    it('dibuja el menú lateral con Borradores marcado', () => {
      const html = renderTag({ ...borradores, entradas: [], menu: { abierto: true, borradores: 3 } });
      expect(html).toContain('<nav class="lat abierto">');
      expect(html).toContain('<a class="act" href="#/borradores">');
    });

    it('vacía, dice que no hay borradores', () => {
      const html = renderTag({ ...borradores, entradas: [], total: 0, visibles: 0, menu: { abierto: false, borradores: 0 } });
      expect(html).toContain('No hay borradores.');
    });

    it('no ofrece crear ni pegar: para eso está Nueva receta', () => {
      const html = renderTag({ ...borradores, entradas: [], menu: { abierto: false, borradores: 0 } });
      expect(html).not.toContain('pegar-receta');
      expect(html).not.toContain('Nuevo');
    });

    it('sin el menú sigue siendo la lista por tag con el volver', () => {
      const html = renderTag({ ...borradores, entradas: [] });
      expect(html).toContain('data-accion="volver"');
      expect(html).not.toContain('class="lat');
      expect(html).toContain('Ninguna receta tiene estos tags.');
    });
  });
});
