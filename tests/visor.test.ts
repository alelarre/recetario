import { describe, it, expect } from 'vitest';
import { pasoDelVisor, renderVisor } from '../src/ui/visor.js';

describe('pasoDelVisor', () => {
  it('un deslizamiento corto no mueve el índice', () => {
    expect(pasoDelVisor(1, 10, 5)).toBe(1);
    expect(pasoDelVisor(1, -39, 5)).toBe(1);
  });

  it('deslizar hacia la izquierda avanza a la siguiente', () => {
    expect(pasoDelVisor(1, -40, 5)).toBe(2);
  });

  it('deslizar hacia la derecha vuelve a la anterior', () => {
    expect(pasoDelVisor(1, 40, 5)).toBe(0);
  });

  it('no da la vuelta: en la primera, deslizar hacia la anterior deja el índice', () => {
    expect(pasoDelVisor(0, 40, 5)).toBe(0);
  });

  it('no da la vuelta: en la última, deslizar hacia la siguiente deja el índice', () => {
    expect(pasoDelVisor(4, -40, 5)).toBe(4);
  });

  it('con una sola foto, ningún deslizamiento mueve el índice', () => {
    expect(pasoDelVisor(0, -40, 1)).toBe(0);
    expect(pasoDelVisor(0, 40, 1)).toBe(0);
  });
});

describe('renderVisor', () => {
  it('dibuja la foto actual sobre el velo, con el índice y el total al alcance', () => {
    const html = renderVisor({ urls: ['https://x/1.jpg', 'https://x/2.jpg'], i: 1 });
    expect(html).toContain('class="visor"');
    expect(html).toContain('data-accion="cerrar-visor"');
    expect(html).toContain('data-i="1"');
    expect(html).toContain('data-total="2"');
    expect(html).toContain('src="https://x/2.jpg"');
  });

  it('una foto de Drive se dibuja como recuadro, con data-drive', () => {
    const html = renderVisor({ urls: ['https://drive.google.com/file/d/abc/view'], i: 0 });
    expect(html).toContain('data-drive="abc"');
  });

  it('sin fotos no dibuja nada', () => {
    expect(renderVisor({ urls: [], i: 0 })).toBe('');
  });
});
