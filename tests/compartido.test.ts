import { describe, it, expect } from 'vitest';
import { desdeCompartido, tituloPorDefecto } from '../src/compartido.js';

describe('lo que llega compartido desde otra app', () => {
  it('con url, la fuente es la url y el texto va a la nota', () => {
    expect(desdeCompartido({ url: 'https://sitio.com/r', text: 'La de la abuela, buenísima' }))
      .toEqual({ fuente: 'https://sitio.com/r', nota: 'La de la abuela, buenísima' });
  });

  it('con url y el mismo link en el texto, la nota no lo repite', () => {
    expect(desdeCompartido({ url: 'https://sitio.com/r', text: 'Mirá https://sitio.com/r' }))
      .toEqual({ fuente: 'https://sitio.com/r', nota: 'Mirá' });
  });

  it('sin url, la fuente es el primer link del texto y lo demás va a la nota', () => {
    expect(desdeCompartido({ url: '', text: 'Mirá este reel https://instagram.com/reel/abc ¡buenísimo!' }))
      .toEqual({ fuente: 'https://instagram.com/reel/abc', nota: 'Mirá este reel ¡buenísimo!' });
  });

  it('un texto que es sólo el link deja la nota vacía', () => {
    expect(desdeCompartido({ url: '', text: 'https://youtu.be/xyz' }))
      .toEqual({ fuente: 'https://youtu.be/xyz', nota: '' });
  });

  it('un texto sin link —una receta copiada— va entero a la nota, sin fuente', () => {
    expect(desdeCompartido({ url: '', text: 'Harina 500 g\nAgua 300 ml' }))
      .toEqual({ fuente: '', nota: 'Harina 500 g\nAgua 300 ml' });
  });

  it('nada compartido es nada', () => {
    expect(desdeCompartido({ url: '', text: '' })).toEqual({ fuente: '', nota: '' });
  });
});

describe('el título por defecto', () => {
  it('se arma con el día y la hora', () => {
    expect(tituloPorDefecto(new Date(2026, 8, 19, 9, 5))).toBe('Borrador 19/09 09:05');
  });
});
