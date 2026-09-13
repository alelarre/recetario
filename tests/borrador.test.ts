import { describe, it, expect } from 'vitest';
import {
  parseBorrador, serializeBorrador, filaDeBorrador, entradaBorradorDesdeFila, COLUMNAS_BORRADORES
} from '../src/borrador.js';

const borrador = {
  titulo: 'Pollo al disco', fuente: 'https://instagram.com/reel/abc',
  capturado: '2026-09-13T10:30:00.000Z', nota: 'Con cerveza.'
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
    expect(parseBorrador('Algo suelto.\n')).toEqual({ titulo: '', fuente: '', capturado: '', nota: 'Algo suelto.' });
  });

  it('una clave desconocida se ignora', () => {
    const texto = '---\ntitulo: A\ntags: [x]\n---\n\nnota\n';
    expect(parseBorrador(texto)).toEqual({ titulo: 'A', fuente: '', capturado: '', nota: 'nota' });
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
