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

describe('el pedido con fotos', () => {
  const conFotos = { ...borrador, fotos: ['1AbC', '1DeF'] };

  it('dice cuántas van, en orden, qué pueden ser y cómo tratarlas, después del borrador', () => {
    const p = pedidoDeConversion(conFotos);
    expect(p).toContain('Fotos: van 2, en orden.');
    expect(p).toContain('sin inventar cantidades ni pasos que no estén');
    expect(p).toContain('Una foto del plato sirve para el título y la descripción, no para la receta.');
    expect(p.indexOf('Nota: La de la abuela')).toBeLessThan(p.indexOf('Fotos: van 2'));
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('una sola foto se dice en singular', () => {
    expect(pedidoDeConversion({ ...borrador, fotos: ['1AbC'] })).toContain('Fotos: va 1, en orden.');
  });

  it('sin fotos no dice nada de fotos', () => {
    expect(pedidoDeConversion({ ...borrador, fotos: [] })).not.toContain('Fotos:');
  });

  it('con los links de Drive, una línea por foto y cómo leerlas', () => {
    const p = pedidoDeConversion(conFotos, { links: true });
    expect(p).toContain('Foto 1: https://drive.google.com/file/d/1AbC/view');
    expect(p).toContain('Foto 2: https://drive.google.com/file/d/1DeF/view');
    expect(p).toContain('Las fotos están en mi Google Drive: leelas con el conector de Drive.');
    expect(pedidoDeConversion(conFotos)).not.toContain('drive.google.com');
  });

  it('dice cómo referenciarlas en la receta, después del párrafo de las fotos', () => {
    const p = pedidoDeConversion(conFotos);
    expect(p).toContain('En la receta, esas fotos son foto:1, foto:2…, en el mismo orden.');
    expect(p).toContain('Si una muestra el plato terminado, poné `foto: foto:N`.');
    expect(p).toContain('Si una muestra un paso, sumá `![](foto:N)` al final de ese paso.');
    expect(p).toContain('No escribas la sección Fotos: la arma la app.');
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('En la receta, esas fotos son'));
    expect(p.indexOf('En la receta, esas fotos son')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('esa guía también va cuando el pedido lleva los links de Drive', () => {
    expect(pedidoDeConversion(conFotos, { links: true })).toContain('En la receta, esas fotos son foto:1, foto:2…');
  });

  it('sin fotos no dice nada de cómo referenciarlas', () => {
    expect(pedidoDeConversion({ ...borrador, fotos: [] })).not.toContain('En la receta, esas fotos son');
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

describe('lo que llega envuelto', () => {
  const receta = '---\ntitulo: Focaccia\nborrador: b1\n---\n\n## Preparación\n1. Amasar.\n';

  it('dentro de un bloque de código, con o sin lenguaje', () => {
    expect(esRecetaEnMd('```\n' + receta + '```')).toBe(true);
    expect(esRecetaEnMd('```markdown\n' + receta + '```\n')).toBe(true);
    expect(recetaRecibida('```markdown\n' + receta + '```').receta.titulo).toBe('Focaccia');
    expect(recetaRecibida('~~~\n' + receta + '~~~').borradorId).toBe('b1');
  });

  it('con texto del agente antes y después del bloque', () => {
    const conCharla = 'Listo, acá va:\n\n```md\n' + receta + '```\n\n¿Querés que agregue algo?';
    expect(esRecetaEnMd(conCharla)).toBe(true);
    const { receta: r, borradorId } = recetaRecibida(conCharla);
    expect(r.titulo).toBe('Focaccia');
    expect(borradorId).toBe('b1');
    expect(r.preparacion).toContain('Amasar');
  });

  it('citada con >, y citada adentro de un bloque', () => {
    const citada = receta.split('\n').map(l => (l ? '> ' + l : '>')).join('\n');
    expect(esRecetaEnMd(citada)).toBe(true);
    expect(recetaRecibida(citada).receta.titulo).toBe('Focaccia');
    expect(recetaRecibida('```\n' + citada + '\n```').borradorId).toBe('b1');
  });

  it('un texto cualquiera dentro de un bloque no es una receta', () => {
    expect(esRecetaEnMd('```\nhola\n```')).toBe(false);
    expect(esRecetaEnMd('> mirá esta receta\n> de pan')).toBe(false);
  });

  it('sin envoltorio, todo sigue igual', () => {
    expect(esRecetaEnMd(receta)).toBe(true);
    expect(recetaRecibida(receta).receta.titulo).toBe('Focaccia');
  });
});
