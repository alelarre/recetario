import { describe, it, expect } from 'vitest';
import { renderResultados } from '../src/ui/resultados.js';
import { crearListaControl } from '../src/lista-control.js';
import { entradaFalsa } from './dobles.js';
import type { Coincidencias } from '../src/tipos.js';

const sinNada = { porNombre: [], porIngrediente: [], porTag: [] };
/** La lista como la arma la pantalla: por el controlador, que ordena y corta. */
const lista = (grupos: Coincidencias) => crearListaControl().agrupada(grupos);

describe('Resultados', () => {
  it('un grupo sin resultados no se dibuja', () => {
    const html = renderResultados({ consulta: 'merluza', lista: lista({ ...sinNada, porNombre: [entradaFalsa()] }) });
    expect(html).toContain('Por nombre');
    expect(html).not.toContain('Por ingrediente');
  });

  it('cada grupo dice cuántos resultados trajo', () => {
    const html = renderResultados({
      consulta: 'x', lista: lista({ ...sinNada, porNombre: [entradaFalsa({ id_archivo: 'a' }), entradaFalsa({ id_archivo: 'b' })] })
    });
    expect(html).toContain('>2<');
  });

  it('los tres criterios se dibujan por separado, con su motivo', () => {
    const html = renderResultados({
      consulta: 'merluza',
      lista: lista({
        porNombre: [entradaFalsa({ titulo: 'Filet de merluza' })],
        porIngrediente: [{ entrada: entradaFalsa({ titulo: 'Gratin' }), motivo: 'tiene Merluza o pescadilla' }],
        porTag: [{ entrada: entradaFalsa({ titulo: 'Caballa' }), motivo: 'tiene tag merluza' }]
      })
    });
    expect(html).toContain('Por nombre');
    expect(html).toContain('tiene Merluza o pescadilla');
    expect(html).toContain('tiene tag merluza');
  });

  it('la caja lleva la lupa, y dice Buscar cuando está vacía', () => {
    const html = renderResultados({ consulta: '', lista: lista(sinNada) });
    expect(html).toContain('class="buscar"');
    expect(html).toContain('placeholder="Buscar"');
    expect(html).toContain('<circle cx="11" cy="11" r="7"/>');
  });

  it('la caja del encabezado trae lo buscado, para corregirlo sin volver', () => {
    expect(renderResultados({ consulta: 'berenjena', lista: lista({ ...sinNada, porNombre: [entradaFalsa()] }) }))
      .toContain('value="berenjena"');
  });

  it('sin resultados, una frase y nada más', () => {
    const html = renderResultados({ consulta: 'berenjena', lista: lista(sinNada) });
    expect(html).toContain('Ninguna receta se llama, lleva ni tiene <b>berenjena</b>.');
    expect(html).not.toContain('quisiste decir');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('class="cuerpo');
  });

  it('escapa lo buscado', () => {
    expect(renderResultados({ consulta: '"><script>', lista: lista(sinNada) })).not.toContain('<script>');
  });

  const e = (id: string, titulo: string, tiempo: string) => entradaFalsa({ id_archivo: id, titulo, tiempo });

  it('con alguna duración, el conmutador va arriba de los grupos', () => {
    const html = renderResultados({ consulta: 'horno', lista: lista({ ...sinNada, porNombre: [e('1', 'Besugo al horno', '~60 min')] }) });
    expect(html).toContain('data-accion="ordenar"');
    expect(html.indexOf('data-accion="ordenar"')).toBeLessThan(html.indexOf('grupo-res'));
  });

  it('sin ninguna duración, no hay conmutador', () => {
    const html = renderResultados({ consulta: 'horno', lista: lista({ ...sinNada, porNombre: [e('1', 'Besugo', '')] }) });
    expect(html).not.toContain('data-accion="ordenar"');
  });
});
