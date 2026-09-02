import { describe, it, expect } from 'vitest';
import { aHtml, escapar } from '../src/ui/markdown.js';

describe('aHtml', () => {
  it('escapa el HTML de entrada', () => {
    expect(aHtml('<script>alert(1)</script>')).not.toContain('<script>');
    expect(aHtml('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  it('convierte listas con guiones', () => {
    expect(aHtml('- sal\n- pimienta')).toBe('<ul><li>sal</li><li>pimienta</li></ul>');
  });

  it('convierte subsecciones ### en h3', () => {
    expect(aHtml('### Para la salsa')).toBe('<h3>Para la salsa</h3>');
  });

  it('convierte imágenes', () => {
    expect(aHtml('![](https://a/1)')).toContain('<img src="https://a/1"');
  });

  it('convierte párrafos', () => {
    expect(aHtml('Hola.\n\nChau.')).toBe('<p>Hola.</p><p>Chau.</p>');
  });

  it('con pasos:true emite ítems marcables', () => {
    const html = aHtml('1. Precalentar.\n2. Hornear.', { pasos: true });
    expect(html).toContain('class="paso"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Precalentar.');
  });

  it('sin pasos, una lista numerada es una lista común', () => {
    expect(aHtml('1. Precalentar.')).toBe('<ol><li>Precalentar.</li></ol>');
  });

  it('negrita e itálica', () => {
    expect(aHtml('**fuerte** y *suave*')).toBe('<p><strong>fuerte</strong> y <em>suave</em></p>');
  });

  it('un texto vacío devuelve cadena vacía', () => {
    expect(aHtml('')).toBe('');
  });

  describe('defensa de parámetros', () => {
    it('aHtml(null) devuelve cadena vacía sin lanzar', () => {
      expect(() => aHtml(null)).not.toThrow();
      expect(aHtml(null)).toBe('');
    });

    it('aHtml(undefined) devuelve cadena vacía sin lanzar', () => {
      expect(() => aHtml(undefined)).not.toThrow();
      expect(aHtml(undefined)).toBe('');
    });

    it('aHtml(42) convierte a string sin lanzar', () => {
      expect(() => aHtml(42)).not.toThrow();
      expect(aHtml(42)).toBe('<p>42</p>');
    });

    it('aHtml({}) convierte a string sin lanzar', () => {
      expect(() => aHtml({})).not.toThrow();
      const resultado = aHtml({});
      expect(typeof resultado).toBe('string');
    });

    it('escapar(null) devuelve cadena vacía sin lanzar', () => {
      expect(() => escapar(null)).not.toThrow();
      expect(escapar(null)).toBe('');
    });

    it('escapar(undefined) devuelve cadena vacía sin lanzar', () => {
      expect(() => escapar(undefined)).not.toThrow();
      expect(escapar(undefined)).toBe('');
    });

    it('escapar(42) convierte a string sin lanzar', () => {
      expect(() => escapar(42)).not.toThrow();
      expect(escapar(42)).toBe('42');
    });

    it('escapar({}) convierte a string sin lanzar', () => {
      expect(() => escapar({})).not.toThrow();
      const resultado = escapar({});
      expect(typeof resultado).toBe('string');
    });
  });

  describe('casos de inyección XSS', () => {
    it('escapa <img src=x onerror=alert(1)> — la etiqueta se ve como texto', () => {
      const html = aHtml('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img');
      expect(html).not.toContain('<img');
    });

    it('escapa <script> en encabezados', () => {
      const html = aHtml('### <script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('escapa <script> en listas', () => {
      const html = aHtml('- <script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('escapa <script> en listas numeradas', () => {
      const html = aHtml('1. <script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('escapa <style> con inyección CSS', () => {
      const html = aHtml('<style>body { display:none; }</style>');
      expect(html).toContain('&lt;style&gt;');
      expect(html).not.toContain('<style>');
    });
  });
});
