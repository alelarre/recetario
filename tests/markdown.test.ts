import { describe, it, expect } from 'vitest';
import { aHtml, escapar, aTexto, aPdf, tramosEnLinea, tramosDeFuente } from '../src/ui/markdown.js';

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

  describe('validación de esquemas en imágenes', () => {
    it('rechaza ![](javascript:alert(1)) — no emite <img>', () => {
      const html = aHtml('![](javascript:alert(1))');
      expect(html).not.toContain('<img');
      expect(html).toContain('![](javascript:alert(1))');
    });

    it('rechaza ![](JavaScript:alert(1)) case-insensitive', () => {
      const html = aHtml('![](JavaScript:alert(1))');
      expect(html).not.toContain('<img');
      expect(html).toContain('![](JavaScript:alert(1))');
    });

    it('rechaza ![](data:text/html,<script>)', () => {
      const html = aHtml('![](data:text/html,<script>)');
      expect(html).not.toContain('<img');
      expect(html).toContain('![](data:text/html,&lt;script&gt;)');
    });

    it('aceptan https://', () => {
      const html = aHtml('![](https://drive.google.com/file/d/ABC/view)');
      expect(html).toContain('<img src="https://drive.google.com/file/d/ABC/view"');
    });

    it('aceptan http://', () => {
      const html = aHtml('![](http://example.com/foto.jpg)');
      expect(html).toContain('<img src="http://example.com/foto.jpg"');
    });

    it('aceptan rutas relativas /fotos/x.jpg', () => {
      const html = aHtml('![](./fotos/receta.jpg)');
      expect(html).toContain('<img src="./fotos/receta.jpg"');
    });

    it('aceptan rutas con /', () => {
      const html = aHtml('![](/fotos/receta.jpg)');
      expect(html).toContain('<img src="/fotos/receta.jpg"');
    });

    it('aceptan rutas relativas ../', () => {
      const html = aHtml('![](../fotos/receta.jpg)');
      expect(html).toContain('<img src="../fotos/receta.jpg"');
    });
  });
});

describe('tramosEnLinea', () => {
  it('negrita, itálica, link e imagen como tramos', () => {
    expect(tramosEnLinea('a **b** *c* [d](https://x.com) ![](https://y.com/i.png)')).toEqual([
      { texto: 'a ' }, { texto: 'b', negrita: true }, { texto: ' ' }, { texto: 'c', italica: true },
      { texto: ' ' }, { texto: 'd', link: 'https://x.com' }, { texto: ' ' }, { texto: '', imagen: 'https://y.com/i.png' }
    ]);
  });
  it('un link adentro de negrita conserva las dos cosas', () => {
    expect(tramosEnLinea('**ver [x](https://x.com)**')).toEqual([
      { texto: 'ver ', negrita: true }, { texto: 'x', link: 'https://x.com', negrita: true }
    ]);
  });
  it('un destino inseguro queda como texto', () => {
    expect(tramosEnLinea('[a](javascript:alert(1))')).toEqual([{ texto: '[a](javascript:alert(1)' }, { texto: ')' }]);
  });
});

describe('tramosDeFuente', () => {
  it('URL pelada: link con el sitio a la vista', () => {
    expect(tramosDeFuente('https://cookpad.com/r/1')).toEqual([{ texto: 'cookpad.com/r/1', link: 'https://cookpad.com/r/1' }]);
  });
  it('link markdown entre comillas', () => {
    expect(tramosDeFuente('"[Paladar](https://p.com/x)"')).toEqual([{ texto: 'Paladar', link: 'https://p.com/x' }]);
  });
  it('texto libre, sin formato', () => {
    expect(tramosDeFuente('libro *viejo*, pág. 84')).toEqual([{ texto: 'libro *viejo*, pág. 84' }]);
  });
});

describe('aTexto', () => {
  it('negrita a *, itálica a _, listas tal cual', () => {
    expect(aTexto('Batir **fuerte** y *suave*.\n\n- sal\n- pimienta\n\n1. Uno\n2. Dos'))
      .toBe('Batir *fuerte* y _suave_.\n\n- sal\n- pimienta\n\n1. Uno\n2. Dos');
  });
  it('el subtítulo va pegado a lo que sigue, sin #', () => {
    expect(aTexto('### Más liviana\nBajar el aceite.\n\n### Otra\n- a')).toBe('Más liviana\nBajar el aceite.\n\nOtra\n- a');
  });
  it('link como texto (url); si el texto es la URL, sólo la URL; imagen como URL', () => {
    expect(aTexto('[Paladar](https://p.com) https://q.com ![](https://i.com/a.png)'))
      .toBe('Paladar (https://p.com) https://q.com https://i.com/a.png');
    expect(aTexto('[https://p.com](https://p.com)')).toBe('https://p.com');
  });
  it('la numeración vuelve a empezar en cada lista', () => {
    expect(aTexto('### A\n1. x\n2. y\n### B\n1. z')).toBe('A\n1. x\n2. y\n\nB\n1. z');
  });
  it('vacío es vacío', () => { expect(aTexto('')).toBe(''); });
});

describe('aPdf', () => {
  it('un nodo por ítem, que no se parte, con la numeración de su lista', () => {
    const nodos = aPdf('- sal\n- ajo\n\n1. Uno\n2. **Dos**');
    expect(nodos).toHaveLength(4);
    expect(nodos[0]).toEqual({ ul: [{ text: [{ text: 'sal' }] }], style: 'lista', unbreakable: true });
    expect(nodos[3]).toEqual({ ol: [{ text: [{ text: 'Dos', bold: true }] }], start: 2, style: 'lista', unbreakable: true });
  });
  it('párrafo y subtítulo con su estilo; links con el estilo link', () => {
    expect(aPdf('### Sub\nVer [acá](https://x.com).')).toEqual([
      { text: [{ text: 'Sub' }], style: 'subtitulo' },
      { text: [{ text: 'Ver ' }, { text: 'acá', link: 'https://x.com', style: 'link' }, { text: '.' }], style: 'parrafo', unbreakable: true }
    ]);
  });
});
