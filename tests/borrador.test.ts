import { describe, it, expect } from 'vitest';
import {
  parseBorrador, serializeBorrador, filaDeBorrador, entradaBorradorDesdeFila, COLUMNAS_BORRADORES,
  desdeCompartido, tituloPorDefecto, sePuedeGuardar, nombreDeFoto, MAXIMO_FOTOS
} from '../src/borrador.js';

const borrador = {
  titulo: 'Pollo al disco', fuente: 'https://instagram.com/reel/abc',
  capturado: '2026-09-13T10:30:00.000Z', nota: 'Con cerveza.', fotos: [] as string[]
};

describe('el .md de un borrador', () => {
  it('se escribe con tres claves en el frontmatter y la nota como cuerpo', () => {
    expect(serializeBorrador(borrador)).toBe(
      '---\ntitulo: Pollo al disco\nfuente: https://instagram.com/reel/abc\n' +
      'capturado: 2026-09-13T10:30:00.000Z\n---\n\nCon cerveza.\n'
    );
  });

  it('sin nota, termina en el frontmatter', () => {
    expect(serializeBorrador({ ...borrador, nota: '' })).toMatch(/---\n$/);
  });

  it('ida y vuelta, con una nota de varias líneas que tiene ## y ---', () => {
    const nota = 'Una focaccia.\n\n## Ingredientes\n- Harina\n\n---\n\nOtra cosa: con dos puntos.';
    expect(parseBorrador(serializeBorrador({ ...borrador, nota }))).toEqual({ ...borrador, nota });
  });

  it('un título con dos puntos se lee entero', () => {
    expect(parseBorrador(serializeBorrador({ ...borrador, titulo: 'Pan: el de campo' })).titulo)
      .toBe('Pan: el de campo');
  });

  it('sin frontmatter, todo es nota y el título queda vacío', () => {
    expect(parseBorrador('Algo suelto.\n')).toEqual({ titulo: '', fuente: '', capturado: '', nota: 'Algo suelto.', fotos: [] });
  });

  it('una clave desconocida se ignora', () => {
    const texto = '---\ntitulo: A\ntags: [x]\n---\n\nnota\n';
    expect(parseBorrador(texto)).toEqual({ titulo: 'A', fuente: '', capturado: '', nota: 'nota', fotos: [] });
  });

  it('las fotos van en la clave fotos, con los ids en orden, como lista', () => {
    const texto = serializeBorrador({ ...borrador, fotos: ['1AbC', '1DeF'] });
    expect(texto).toBe(
      '---\ntitulo: Pollo al disco\nfuente: https://instagram.com/reel/abc\n' +
      'capturado: 2026-09-13T10:30:00.000Z\nfotos: [1AbC, 1DeF]\n---\n\nCon cerveza.\n'
    );
    expect(parseBorrador(texto)).toEqual({ ...borrador, fotos: ['1AbC', '1DeF'] });
  });

  it('sin fotos, la clave no se escribe', () => {
    expect(serializeBorrador(borrador)).not.toContain('fotos');
  });

  it('una lista de fotos vacía se lee como ninguna', () => {
    expect(parseBorrador('---\ntitulo: A\nfotos: []\n---\n').fotos).toEqual([]);
  });

  it('con saltos de línea de Windows se lee igual', () => {
    expect(parseBorrador('---\r\ntitulo: A\r\n---\r\n\r\nnota\r\n').titulo).toBe('A');
  });
});

describe('la fila de la hoja borradores', () => {
  it('tiene cuatro columnas, en el orden de COLUMNAS_BORRADORES', () => {
    const entrada = { id_archivo: 'b1', nombre_archivo: 'a.md', titulo: 'A', capturado: '2026-09-13' };
    expect(COLUMNAS_BORRADORES).toEqual(['id_archivo', 'nombre_archivo', 'titulo', 'capturado']);
    expect(filaDeBorrador(entrada)).toEqual(['b1', 'a.md', 'A', '2026-09-13']);
    expect(entradaBorradorDesdeFila(filaDeBorrador(entrada))).toEqual(entrada);
  });

  it('una fila corta se lee con vacíos', () => {
    expect(entradaBorradorDesdeFila(['b1'])).toEqual({ id_archivo: 'b1', nombre_archivo: '', titulo: '', capturado: '' });
  });
});

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

describe('el título del borrador', () => {
  it('sin título, se arma con el día y la hora', () => {
    expect(tituloPorDefecto(new Date(2026, 8, 19, 9, 5))).toBe('Borrador 19/09 09:05');
  });

  it('para guardar alcanza con fuente o con nota; el título no hace falta', () => {
    expect(sePuedeGuardar({ fuente: 'https://x', nota: '' })).toBe(true);
    expect(sePuedeGuardar({ fuente: '', nota: 'Harina' })).toBe(true);
    expect(sePuedeGuardar({ fuente: '  ', nota: ' ' })).toBe(false);
  });

  it('con sólo fotos también se puede guardar', () => {
    expect(sePuedeGuardar({ fuente: '', nota: '', fotos: 1 })).toBe(true);
    expect(sePuedeGuardar({ fuente: '', nota: '', fotos: 0 })).toBe(false);
  });
});

describe('el nombre de una foto', () => {
  it('es el del .md con un número, desde 1', () => {
    expect(nombreDeFoto('tarta-de-la-abuela.md', [])).toBe('tarta-de-la-abuela-1.jpg');
  });

  it('toma el primer número libre', () => {
    expect(nombreDeFoto('tarta.md', ['tarta.md', 'tarta-1.jpg', 'tarta-3.jpg'])).toBe('tarta-2.jpg');
  });

  it('el máximo es cinco', () => {
    expect(MAXIMO_FOTOS).toBe(5);
  });
});
