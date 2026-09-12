import { describe, it, expect } from 'vitest';
import { renderCaptura } from '../src/ui/captura.js';

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

  it('el título tiene el foco, y es el único campo obligatorio', () => {
    const html = renderCaptura(base);
    // Un input —el título— más el textarea de la nota, que es opcional.
    expect(html.match(/<input/g)).toHaveLength(1);
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

  it('con el título vacío, Guardar no está disponible', () => {
    expect(renderCaptura(base)).toContain('disabled');
  });

  it('con título, Guardar está disponible', () => {
    expect(renderCaptura({ ...base, titulo: 'Focaccia' })).not.toContain('disabled');
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
  });
});
