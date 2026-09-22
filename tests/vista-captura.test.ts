import { describe, it, expect } from 'vitest';
import { renderCaptura } from '../src/ui/captura.js';
import { ICO } from '../src/ui/iconos.js';

const base = { fuente: 'https://x/1', titulo: '', guardando: false };

describe('Captura', () => {
  it('compartida desde otra app no lleva encabezado: es efímera sobre lo que estabas haciendo', () => {
    const html = renderCaptura(base);
    expect(html).not.toContain('class="enc"');
    expect(html).toContain('Guardar en Recetario');
    expect(html).toContain('data-accion="cancelar-captura"');
  });

  it('agregada a mano lleva el encabezado y el volver, como el resto de las pantallas', () => {
    const html = renderCaptura({ ...base, fuente: '' });
    expect(html).toContain('class="enc"');
    expect(html).toContain('data-accion="volver"');
    expect(html).toContain('Nuevo borrador');
  });

  it('la fuente se muestra y no se edita', () => {
    const html = renderCaptura(base);
    expect(html).toContain('x/1');
    expect(html).not.toContain('name="fuente"');
  });

  it('el título tiene el foco, y es opcional', () => {
    const html = renderCaptura(base);
    // Un input de texto —el título— más el textarea de la nota, que es
    // opcional. Los otros dos inputs son los de las fotos (Cámara y
    // Galería), que no se escriben.
    expect(html.match(/<input(?! type="file")/g)).toHaveLength(1);
    expect(html).toContain('autofocus');
    expect(html).toContain('name="nota"');
  });

  it('escribiendo o editando, el título va primero', () => {
    const nuevo = renderCaptura({ ...base, fuente: '' });
    expect(nuevo.indexOf('name="titulo"')).toBeLessThan(nuevo.indexOf('name="fuente"'));
    const editando = renderCaptura({ ...base, edicion: true });
    expect(editando.indexOf('name="titulo"')).toBeLessThan(editando.indexOf('name="fuente"'));
  });

  it('compartida, la fuente que vino va arriba del título', () => {
    const html = renderCaptura(base);
    expect(html.indexOf('class="fnt"')).toBeLessThan(html.indexOf('name="titulo"'));
  });

  it('debajo de la nota va el esbozo de cómo se reparte en la receta', () => {
    const html = renderCaptura(base);
    expect(html.indexOf('name="nota"')).toBeLessThan(html.indexOf('class="esbozo"'));
    expect(html).toContain('Estructura básica');
    // Colapsado: el bloque está, pero no ocupa la pantalla hasta que se abre.
    expect(html).not.toContain('<details class="esbozo" open>');
    expect(html).toContain('_Descripción_');
    for (const seccion of ['## Ingredientes', '## Preparación', '## Variaciones', '## Notas']) {
      expect(html).toContain(seccion);
    }
    // Es referencia, no un campo: no tiene name ni se envía.
    const esbozo = html.slice(html.indexOf('class="esbozo"'));
    expect(esbozo).not.toContain('name=');
  });

  it('la nota escrita sobrevive al redibujado', () => {
    expect(renderCaptura({ ...base, nota: 'sin lactosa' })).toContain('sin lactosa');
  });

  it('sin fuente —agregar a mano— la fuente se escribe', () => {
    const html = renderCaptura({ ...base, fuente: '' });
    expect(html).toContain('name="fuente"');
  });

  it('no hay categoría, ni tags, ni notas', () => {
    const html = renderCaptura(base);
    for (const c of ['categoria', 'tags', 'notas']) expect(html).not.toContain(`name="${c}"`);
  });

  it('con fuente y sin título, Guardar está disponible: el título se arma solo', () => {
    expect(renderCaptura(base)).not.toContain('disabled');
  });

  it('sin fuente ni nota, Guardar no está disponible aunque haya título', () => {
    expect(renderCaptura({ ...base, fuente: '', titulo: 'Focaccia' })).toContain('disabled');
  });

  it('con sólo nota, Guardar está disponible', () => {
    expect(renderCaptura({ ...base, fuente: '', nota: 'Harina 500 g' })).not.toContain('disabled');
  });

  it('compartido sin link —una receta copiada— es la pantalla de lo compartido, con el texto en la nota', () => {
    const html = renderCaptura({ ...base, fuente: '', nota: 'Harina 500 g', compartido: true });
    expect(html).toContain('Guardar en Recetario');
    expect(html).not.toContain('class="enc"');
    expect(html).not.toContain('class="fnt"');
    expect(html).toContain('Harina 500 g');
  });

  it('mientras guarda, el botón lo dice y no se puede tocar dos veces', () => {
    const html = renderCaptura({ ...base, titulo: 'Focaccia', guardando: true });
    expect(html).toContain('disabled');
    expect(html).toMatch(/Guardando/);
  });

  it('cuando falla, el título escrito queda en pantalla', () => {
    const html = renderCaptura({ ...base, titulo: 'Focaccia', error: 'No se pudo guardar.' });
    expect(html).toContain('Focaccia');
    expect(html).toContain('No se pudo guardar.');
    expect(html).not.toMatch(/más tarde|se guardará/i);
    expect(html).not.toContain('Reintentar');
  });

  it('sin sesión, el aviso ofrece conectar; con otro error, no lleva control (R3)', () => {
    const sinSesion = renderCaptura({ ...base, titulo: 'Focaccia', error: 'Hay que conectarse de nuevo con Google.' });
    expect(sinSesion).toContain('data-accion="conectar-de-nuevo"');
    expect(sinSesion).toContain('value="Focaccia"');
    expect(renderCaptura({ ...base, error: 'No se pudo guardar. Revisá la conexión.' })).not.toContain('conectar-de-nuevo');
  });

  describe('las fotos', () => {
    it('debajo de la nota, las miniaturas con su × y los tres botones para agregar (P50, P59)', () => {
      const html = renderCaptura({ ...base, fotos: ['blob:1', 'blob:2'] });
      expect(html.indexOf('name="nota"')).toBeLessThan(html.indexOf('class="miniaturas"'));
      expect(html).toContain('<img src="blob:1"');
      expect(html).toContain('data-accion="sacar-foto-captura" data-valor="1"');
      expect(html).toContain(`${ICO.camara}Cámara`);
      expect(html).toContain('Galería');
      // La misma ficha de la receta y del borrador: la abre `main.ts`.
      expect(html).toContain('data-accion="abrir-foto-url"');
      expect(html).toContain('Por URL');
      expect(html).toContain('<input type="file" accept="image/*" capture="environment" data-fotos hidden>');
      expect(html).toContain('<input type="file" accept="image/*" multiple data-fotos hidden>');
    });

    it('sin fotos, igual se ofrece agregar', () => {
      expect(renderCaptura(base)).toContain('Cámara');
      expect(renderCaptura(base)).toContain('Galería');
      expect(renderCaptura(base)).toContain('Por URL');
    });

    it('con cinco fotos, los botones no se dibujan', () => {
      const html = renderCaptura({ ...base, fotos: ['a', 'b', 'c', 'd', 'e'] });
      expect(html).not.toContain('Cámara');
      expect(html).not.toContain('Galería');
      expect(html).not.toContain('Por URL');
      expect(html.match(/sacar-foto-captura/g)).toHaveLength(5);
    });

    it('con sólo fotos, Guardar está disponible', () => {
      expect(renderCaptura({ ...base, fuente: '', fotos: ['blob:1'] })).not.toContain('disabled');
    });

    it('editando un borrador no están: se manejan en la vista del borrador', () => {
      expect(renderCaptura({ ...base, edicion: true })).not.toContain('Cámara');
      expect(renderCaptura({ ...base, edicion: true })).not.toContain('Galería');
      expect(renderCaptura({ ...base, edicion: true })).not.toContain('Por URL');
    });

    it('un aviso se muestra sin control', () => {
      const html = renderCaptura({ ...base, aviso: 'Llegaron 8 fotos: se guardan las primeras 5.' });
      expect(html).toContain('Llegaron 8 fotos: se guardan las primeras 5.');
      expect(html).not.toContain('data-accion="reintentar"');
    });
  });
});

