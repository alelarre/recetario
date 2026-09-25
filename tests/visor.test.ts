import { describe, it, expect } from 'vitest';
import { renderVisor } from '../src/ui/visor.js';

describe('renderVisor', () => {
  it('dibuja la foto actual sobre el velo, sin el índice ni el total: el estado es del controlador', () => {
    const html = renderVisor({ urls: ['https://x/1.jpg', 'https://x/2.jpg'], i: 1 });
    expect(html).toContain('class="visor"');
    expect(html).toContain('data-accion="cerrar-visor"');
    expect(html).not.toContain('data-i=');
    expect(html).not.toContain('data-total=');
    expect(html).toContain('src="https://x/2.jpg"');
    expect(html).not.toContain('https://x/1.jpg');
  });

  it('una foto de Drive se dibuja como recuadro, con data-drive', () => {
    const html = renderVisor({ urls: ['https://drive.google.com/file/d/abc/view'], i: 0 });
    expect(html).toContain('data-drive="abc"');
  });

  it('sin fotos no dibuja nada', () => {
    expect(renderVisor({ urls: [], i: 0 })).toBe('');
  });
});
