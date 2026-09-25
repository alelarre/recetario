import { describe, it, expect } from 'vitest';
import { listaPlana, listaAgrupada } from '../src/ui/lista-recetas.js';
import { vacio } from '../src/ui/componentes.js';
import { entradaFalsa, listaPlanaFalsa as plana, listaAgrupadaFalsa as agrupada } from './dobles.js';

const e = (titulo: string, extra: Parameters<typeof entradaFalsa>[0] = {}) =>
  entradaFalsa({ id_archivo: titulo, titulo, ...extra });


describe('lista-recetas — la lista plana', () => {
  it('dibuja las tarjetas en el orden en que llegan', () => {
    const html = listaPlana({ lista: plana({ entradas: [e('Zapallo'), e('Ajo')], total: 2 }), vacio: '' });
    expect(html.match(/class="fila tarjeta"/g)).toHaveLength(2);
    expect(html.indexOf('Zapallo')).toBeLessThan(html.indexOf('Ajo'));
    expect(html).toContain('<div class="lista">');
  });

  it('mientras falta un tramo, el spinner propio del tramo va al final', () => {
    const html = listaPlana({ lista: plana({ entradas: [e('A')], total: 2, hayMas: true }), vacio: '' });
    expect(html).toContain('<div class="spin" data-tramo></div>');
    expect(html.indexOf('data-tramo')).toBeGreaterThan(html.lastIndexOf('class="fila tarjeta"'));
  });

  it('con todo dibujado no hay spinner', () => {
    expect(listaPlana({ lista: plana({ entradas: [e('A')], total: 1 }), vacio: '' })).not.toContain('class="spin"');
  });

  it('sin recetas, el vacío que le pasan', () => {
    const html = listaPlana({ lista: plana(), vacio: vacio('No hay borradores.') });
    expect(html).toContain('<div class="vacio">No hay borradores.</div>');
    expect(html).not.toContain('class="lista"');
  });

  it('las duraciones y el conmutador arriba de la lista; sin conmutador, sin fila de orden', () => {
    const con = listaPlana({
      lista: plana({ entradas: [e('A', { tiempo: '~15 min' })], total: 1, duraciones: [{ valor: '~15 min', cantidad: 1 }], orden: 'duracion' }),
      vacio: ''
    });
    expect(con).toContain('data-accion="filtrar-duracion"');
    expect(con).toContain('data-valor="duracion" aria-pressed="true"');
    expect(con.indexOf('data-accion="ordenar"')).toBeLessThan(con.indexOf('class="lista"'));
    const sin = listaPlana({ lista: plana({ entradas: [e('A')], total: 1 }), vacio: '' });
    expect(sin).not.toContain('data-accion="filtrar-duracion"');
    expect(sin).not.toContain('data-accion="ordenar"');
  });

  it('el carrusel de tags va primero, con los prendidos y el fijo', () => {
    const html = listaPlana({
      lista: plana({ entradas: [e('A')], total: 1, duraciones: [{ valor: '~15 min', cantidad: 1 }], orden: 'alfa' }),
      carrusel: { tags: [{ tag: 'horno', cantidad: 2 }, { tag: 'vegano', cantidad: 1 }], activos: ['horno', 'vegano'], fijo: 'horno' },
      vacio: ''
    });
    expect(html.indexOf('carrusel-marco')).toBeLessThan(html.indexOf('data-accion="filtrar-duracion"'));
    expect(html).toContain('class="chip act"');
  });

  it('las tarjetas llevan su destino o su acción', () => {
    expect(listaPlana({ lista: plana({ entradas: [e('A')], total: 1 }), vacio: '', tarjeta: { destino: 'editor' } }))
      .toContain('href="#/r/A/editar"');
    expect(listaPlana({ lista: plana({ entradas: [e('A')], total: 1 }), vacio: '', tarjeta: { accion: 'elegir' } }))
      .toContain('data-accion="elegir" data-id="A"');
  });
});

describe('lista-recetas — la lista agrupada', () => {
  const tres = agrupada({
    grupos: [
      { rotulo: 'Por nombre', total: 1, items: [{ entrada: e('Filet') }] },
      { rotulo: 'Por ingrediente', total: 4, items: [{ entrada: e('Gratín'), motivo: 'tiene Merluza' }] }
    ],
    total: 5, hayMas: true
  });

  it('cada grupo con su rótulo y su total, y cada tarjeta con su motivo', () => {
    const html = listaAgrupada({ lista: tres, consulta: 'merluza' });
    expect(html).toContain('<div class="grupo-res"><div class="rot"><span>Por nombre</span><span>1</span></div>');
    expect(html).toContain('<span>Por ingrediente</span><span>4</span>');
    expect(html).toContain('tiene Merluza');
  });

  it('mientras falta un tramo, el spinner propio del tramo va después del último grupo', () => {
    const html = listaAgrupada({ lista: tres, consulta: 'merluza' });
    expect(html.indexOf('data-tramo')).toBeGreaterThan(html.lastIndexOf('class="fila tarjeta"'));
    expect(listaAgrupada({ lista: { ...tres, hayMas: false }, consulta: 'x' })).not.toContain('class="spin"');
  });

  it('con conmutador, va arriba de los grupos', () => {
    const html = listaAgrupada({ lista: { ...tres, orden: 'alfa' }, consulta: 'x' });
    expect(html.indexOf('data-accion="ordenar"')).toBeLessThan(html.indexOf('grupo-res'));
    expect(listaAgrupada({ lista: tres, consulta: 'x' })).not.toContain('data-accion="ordenar"');
  });

  it('sin resultados, una frase que nombra los tres criterios, con lo buscado escapado', () => {
    const html = listaAgrupada({ lista: agrupada(), consulta: '"><script>' });
    expect(html).toContain('Ninguna receta se llama, lleva ni tiene <b>');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('grupo-res');
  });

  it('con acción, las tarjetas la disparan', () => {
    expect(listaAgrupada({ lista: tres, consulta: 'x', accion: 'elegir' })).toContain('data-accion="elegir" data-id="Gratín"');
  });
});
