import { describe, it, expect } from 'vitest';
import { renderCaptura } from '../src/ui/captura.js';

const base = { fuente: 'https://x/1', titulo: '', guardando: false };

describe('Captura', () => {
  it('la fuente se muestra y no se edita', () => {
    const html = renderCaptura(base);
    expect(html).toContain('x/1');
    expect(html).not.toContain('name="fuente"');
  });

  it('el único campo editable es el título, y tiene el foco', () => {
    const html = renderCaptura(base);
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).toContain('autofocus');
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
