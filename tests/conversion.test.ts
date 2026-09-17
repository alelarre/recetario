import { describe, it, expect } from 'vitest';
import { pedidoDeConversion, esRecetaEnMd, recetaRecibida } from '../src/conversion.js';
import { DURACIONES, DIFICULTADES } from '../src/catalogo.js';

const borrador = { id: 'b123', titulo: 'Focaccia', fuente: 'https://ejemplo.com/focaccia', nota: 'La de la abuela, sin romero' };

describe('el pedido para Claude', () => {
  const pedido = pedidoDeConversion(borrador);

  it('lleva el borrador tal cual', () => {
    expect(pedido).toContain('Focaccia');
    expect(pedido).toContain('https://ejemplo.com/focaccia');
    expect(pedido).toContain('La de la abuela, sin romero');
  });

  it('pide la línea del id del borrador', () => {
    expect(pedido).toContain('borrador: b123');
  });

  it('lleva los valores cerrados desde las constantes de la app', () => {
    for (const d of DURACIONES) expect(pedido).toContain(d);
    for (const d of DIFICULTADES) expect(pedido).toContain(d);
    expect(pedido).toContain('menú diario');
    expect(pedido).toContain('incompleta');
  });

  it('pide sólo el .md, sin texto alrededor ni bloque de código', () => {
    expect(pedido).toContain('## Ingredientes');
    expect(pedido).toContain('## Preparación');
    expect(pedido).toMatch(/sólo con el texto plano, sin texto antes ni después/i);
  });

  it('un borrador sin fuente ni nota no deja líneas vacías con rótulo', () => {
    const p = pedidoDeConversion({ id: 'b1', titulo: 'Pan', fuente: '', nota: '' });
    expect(p).not.toMatch(/Fuente:\s*\n/);
    expect(p).not.toMatch(/Nota:\s*\n/);
  });
});

describe('reconocer una receta en .md', () => {
  it('una receta con frontmatter y titulo', () => {
    expect(esRecetaEnMd('---\ntitulo: Pan\n---\n\n## Ingredientes\n- Harina — 500 g\n')).toBe(true);
    expect(esRecetaEnMd('  \n---\ntitulo: Pan\ntiempo: ~60 min\n---\n')).toBe(true);
  });

  it('un link, un texto suelto, sin titulo o sin cierre no son recetas', () => {
    expect(esRecetaEnMd('https://ejemplo.com/pan')).toBe(false);
    expect(esRecetaEnMd('Mirá esta receta de pan')).toBe(false);
    expect(esRecetaEnMd('---\nrinde: 4\n---\n')).toBe(false);
    expect(esRecetaEnMd('---\ntitulo: Pan\n')).toBe(false);
    expect(esRecetaEnMd(null)).toBe(false);
  });
});

describe('la receta recibida', () => {
  it('saca la clave borrador y devuelve el id', () => {
    const { receta, borradorId } = recetaRecibida('---\ntitulo: Pan\nborrador: b9\n---\n\n## Preparación\n1. Amasar.\n');
    expect(borradorId).toBe('b9');
    expect(receta.titulo).toBe('Pan');
    expect(receta.extras).not.toHaveProperty('borrador');
  });

  it('sin la clave, el id es vacío y las demás claves desconocidas se conservan', () => {
    const { receta, borradorId } = recetaRecibida('---\ntitulo: Pan\nmaridaje: tinto\n---\n');
    expect(borradorId).toBe('');
    expect(receta.extras['maridaje']).toBe('tinto');
  });
});

describe('CRLF (una receta compartida o pegada con saltos de línea de Windows)', () => {
  const CRLF = '---\r\ntitulo: Pan\r\nborrador: b9\r\n---\r\n\r\n## Preparación\r\n1. Amasar.\r\n';

  it('se reconoce igual que con LF', () => {
    expect(esRecetaEnMd(CRLF)).toBe(true);
  });

  it('recetaRecibida saca el título y el id del borrador, sin avisos de frontmatter faltante', () => {
    const { receta, borradorId } = recetaRecibida(CRLF);
    expect(receta.titulo).toBe('Pan');
    expect(borradorId).toBe('b9');
    expect(receta.avisos).not.toContain('sin-frontmatter');
    expect(receta.avisos).not.toContain('sin-titulo');
  });
});
