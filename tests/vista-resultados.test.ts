import { describe, it, expect } from 'vitest';
import { renderResultados } from '../src/ui/resultados.js';
import { entradaFalsa } from './dobles.js';

const sinNada = { porNombre: [], porIngrediente: [], porTag: [] };

describe('Resultados', () => {
  it('un grupo sin resultados no se dibuja', () => {
    const html = renderResultados({ consulta: 'merluza', grupos: { ...sinNada, porNombre: [entradaFalsa()] } });
    expect(html).toContain('Por nombre');
    expect(html).not.toContain('Por ingrediente');
  });

  it('cada grupo dice cuántos resultados trajo', () => {
    const html = renderResultados({
      consulta: 'x', grupos: { ...sinNada, porNombre: [entradaFalsa(), entradaFalsa()] }
    });
    expect(html).toContain('>2<');
  });

  it('los tres criterios se dibujan por separado, con su motivo', () => {
    const html = renderResultados({
      consulta: 'merluza',
      grupos: {
        porNombre: [entradaFalsa({ titulo: 'Filet de merluza' })],
        porIngrediente: [{ entrada: entradaFalsa({ titulo: 'Gratin' }), motivo: 'tiene Merluza o pescadilla' }],
        porTag: [{ entrada: entradaFalsa({ titulo: 'Caballa' }), motivo: 'tiene tag merluza' }]
      }
    });
    expect(html).toContain('Por nombre');
    expect(html).toContain('tiene Merluza o pescadilla');
    expect(html).toContain('tiene tag merluza');
  });

  it('la caja lleva la lupa, y dice Buscar cuando está vacía', () => {
    const html = renderResultados({ consulta: '', grupos: sinNada });
    expect(html).toContain('class="buscar"');
    expect(html).toContain('placeholder="Buscar"');
    expect(html).toContain('<circle cx="11" cy="11" r="7"/>');
  });

  it('la caja del encabezado trae lo buscado, para corregirlo sin volver', () => {
    expect(renderResultados({ consulta: 'berenjena', grupos: { ...sinNada, porNombre: [entradaFalsa()] } }))
      .toContain('value="berenjena"');
  });

  it('sin resultados, una frase y nada más', () => {
    const html = renderResultados({ consulta: 'berenjena', grupos: sinNada });
    expect(html).toContain('berenjena');
    expect(html).not.toContain('quisiste decir');
    expect(html).not.toContain('<img');
  });

  it('escapa lo buscado', () => {
    expect(renderResultados({ consulta: '"><script>', grupos: sinNada })).not.toContain('<script>');
  });
});
