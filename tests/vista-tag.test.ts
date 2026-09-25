import { describe, it, expect } from 'vitest';
import { renderTag } from '../src/ui/tag.js';
import { entradaFalsa, listaPlanaFalsa } from './dobles.js';
import { ICO } from '../src/ui/iconos.js';

describe('la lista por tag', () => {
  const base = { tag: 'horno', tagsActivos: ['horno'], tags: [], lista: listaPlanaFalsa() };
  const con = (entradas: ReturnType<typeof entradaFalsa>[]) => listaPlanaFalsa({ entradas });

  it('el encabezado lleva el nombre del tag y el total', () => {
    const html = renderTag({ ...base, lista: listaPlanaFalsa({ entradas: [entradaFalsa({ titulo: 'Pan' })], total: 2 }) });
    expect(html).toContain('horno');
    expect(html).toContain('<span class="tot">2</span>');
  });

  it('un tag especial lleva su ícono en el encabezado, antes del nombre', () => {
    const html = renderTag({ ...base, tag: 'probar', tagsActivos: ['probar'] });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    expect(enc).toContain(`${ICO.marcador}probar`);
  });

  it('un tag común no lleva ícono en el encabezado', () => {
    const html = renderTag({ ...base });
    const titulo = html.slice(html.indexOf('<span class="tit">'), html.indexOf('</span>', html.indexOf('<span class="tit">')));
    expect(titulo).not.toContain('<svg');
  });

  it('el chip encendido del carrusel lleva el ícono del especial', () => {
    const html = renderTag({
      ...base, tag: 'probar', tagsActivos: ['probar'],
      tags: [{ tag: 'probar', cantidad: 1 }]
    });
    expect(html).toContain(ICO.marcador);
    expect(html).toContain('class="chip act"');
  });

  it('el chip del tag de la ruta no es tocable: cambiar de tag es volver', () => {
    const html = renderTag({
      ...base, tags: [{ tag: 'horno', cantidad: 2 }, { tag: 'rápido', cantidad: 1 }]
    });
    expect(html).not.toContain('data-tag="horno"');
    // Los demás chips del carrusel siguen acumulando como siempre.
    expect(html).toContain('data-tag="rápido"');
  });

  it('corta el carrusel en veinte tags, como el Recetario', () => {
    const muchos = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const html = renderTag({ ...base, tags: muchos });
    expect(html).toContain('>t19<');
    expect(html).not.toContain('>t20<');
  });

  it('sin el menú, tocar una receta la abre', () => {
    const html = renderTag({ ...base, lista: con([entradaFalsa({ id_archivo: 'r1' })]) });
    expect(html).toContain('href="#/r/r1"');
    expect(html).not.toContain('/editar');
  });


  it('sin recetas muestra el vacío, sin invitar a sacar un filtro que no se puede sacar', () => {
    const html = renderTag({ ...base });
    expect(html).toContain('class="vacio"');
    // El tag de la ruta no se puede sacar: el vacío dice el hecho, no invita a nada.
    expect(html).not.toContain('Probá');
  });

  it('con un filtro de duración sin resultados, el vacío no le echa la culpa a los tags', () => {
    const html = renderTag({
      ...base, lista: listaPlanaFalsa({ duracionesActivas: ['~15 min'], orden: 'alfa' })
    });
    expect(html).toContain('class="vacio"');
    expect(html).toContain('Ninguna receta con esos filtros. Probá sacando alguno de los filtros de arriba.');
    expect(html).not.toContain('Ninguna receta tiene estos tags.');
  });

  it('con duraciones, dibuja la fila de filtro y el conmutador', () => {
    const html = renderTag({
      ...base,
      lista: listaPlanaFalsa({
        entradas: [
          entradaFalsa({ id_archivo: 'a', titulo: 'Zarzuela', tags: ['horno'], tiempo: '~15 min' }),
          entradaFalsa({ id_archivo: 'b', titulo: 'Abadejo', tags: ['horno'], tiempo: '>60 min' })
        ],
        duraciones: [{ valor: '~15 min', cantidad: 1 }, { valor: '>60 min', cantidad: 1 }], orden: 'alfa'
      })
    });
    expect(html).toContain('data-accion="filtrar-duracion"');
    expect(html).toContain('data-accion="ordenar"');
  });

  describe('con el menú: la lista de Borradores', () => {
    const borradores = { ...base, tag: 'borrador', tagsActivos: ['borrador'] };

    it('lleva la hamburguesa con el contador, y no el volver', () => {
      const html = renderTag({ ...borradores, borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 3 } });
      expect(html).toContain('data-accion="abrir-menu"');
      expect(html).toContain('<span class="n">3</span>');
      expect(html).not.toContain('data-accion="volver"');
    });

    it('se titula como el menú, no con el nombre del tag', () => {
      const html = renderTag({ ...borradores, titulo: 'Borradores', borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 0 } });
      expect(html).toContain('Borradores</');
      expect(html).not.toContain('borrador</');
      // Sin ícono: el borrador no tiene presentación propia.
      expect(html).not.toContain('class="borr"');
    });

    it('tocar un borrador abre su editor, no la receta', () => {
      const html = renderTag({
        ...borradores, lista: con([entradaFalsa({ id_archivo: 'b1', tags: ['borrador'] })]),
        borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 1 }
      });
      expect(html).toContain('href="#/r/b1/editar"');
      expect(html).not.toContain('href="#/r/b1"');
    });

    it('dibuja el menú lateral con Borradores marcado', () => {
      const html = renderTag({ ...borradores, borradores: true, menu: { activo: 'borradores', abierto: true, borradores: 3 } });
      expect(html).toContain('<nav class="lat abierto">');
      expect(html).toContain('<a class="act" href="#/borradores">');
    });

    it('vacía, dice que no hay borradores', () => {
      const html = renderTag({ ...borradores, borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 0 } });
      expect(html).toContain('No hay borradores.');
    });

    it('el carrusel no ofrece borrador como chip: `tagsDe` no lo lista, y la ruta no lo agrega', () => {
      const html = renderTag({
        ...borradores, borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 2 },
        tags: [{ tag: 'dulce', cantidad: 2 }, { tag: 'probar', cantidad: 1 }]
      });
      expect(html).toContain('data-tag="dulce"');
      expect(html).not.toContain('<span class="chip act">');
      expect(html.slice(html.indexOf('class="cuerpo'))).not.toContain('>borrador<');
    });

    it('no ofrece crear ni pegar: para eso está Nueva receta', () => {
      const html = renderTag({ ...borradores, borradores: true, menu: { activo: 'borradores', abierto: false, borradores: 0 } });
      expect(html).not.toContain('pegar-receta');
      expect(html).not.toContain('Nuevo');
    });

    it('sin el menú sigue siendo la lista por tag con el volver', () => {
      const html = renderTag({ ...borradores });
      expect(html).toContain('data-accion="volver"');
      expect(html).not.toContain('class="lat');
      expect(html).toContain('Ninguna receta tiene estos tags.');
    });
  });
});
