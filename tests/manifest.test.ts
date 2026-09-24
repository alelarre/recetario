import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hashDeCompartido } from '../src/ui/router.js';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));

describe('el Share Target del manifest', () => {
  // Cada valor es el nombre del parámetro de la query donde Android pone ese
  // campo. Si dos comparten nombre, la query trae el mismo parámetro dos veces
  // y la app lee el primero: el título tapaba al texto, que es donde casi
  // todas las apps mandan el link.
  it('cada campo llega en su propio parámetro', () => {
    const { title, text, url } = manifest.share_target.params;
    expect(new Set([title, text, url]).size).toBe(3);
  });

  // Las fotos llegan como archivos: eso pide POST multipart. El service
  // worker atiende ese POST, que ningún servidor recibe.
  it('es un POST multipart que acepta imágenes en fotos', () => {
    const { action, method, enctype, params } = manifest.share_target;
    expect(method).toBe('POST');
    expect(enctype).toBe('multipart/form-data');
    expect(action).toBe('/recetario/compartir');
    expect(params.files).toEqual([{ name: 'fotos', accept: ['image/*'] }]);
  });

  it('el service worker atiende esa misma ruta y usa el caché que lee el editor', () => {
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toContain("'recetario-compartido'");
    expect(sw).toMatch(/pathname\.endsWith\('\/compartir'\)/);
  });

  it('el redirect de lo compartido apunta a la receta nueva, con fotos aunque no haya url ni texto', () => {
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toMatch(/#\/nueva/);
    expect(sw).not.toMatch(/#\/capturar/);
    // `destino.set('fotos', …)` va después del `for` que pone `url` y `text`,
    // sin depender de que alguno de los dos haya llegado.
    const ordenFotos = sw.indexOf("destino.set('fotos'");
    const construyeQuery = sw.indexOf('const query = destino.toString()');
    expect(ordenFotos).toBeGreaterThan(-1);
    expect(ordenFotos).toBeLessThan(construyeQuery);
  });

  it('el título se ignora: el link y el texto llegan a la receta nueva', () => {
    expect(hashDeCompartido('?title=Instagram&text=' + encodeURIComponent('Mirá https://instagram.com/reel/abc')))
      .toBe('#/nueva?text=' + encodeURIComponent('Mirá https://instagram.com/reel/abc').replace(/%20/g, '+'));
  });
});
