import { describe, it, expect } from 'vitest';
import { pedidoDeConversion, esRecetaEnMd, recetaRecibida, aplicarPegada } from '../src/conversion.js';
import { recetaFalsa } from './dobles.js';
import { DURACIONES, DIFICULTADES } from '../src/catalogo.js';

const receta = { id: 'r1', titulo: 'Focaccia', fuente: 'https://ejemplo.com/focaccia', notas: 'La de la abuela, sin romero' };

describe('el pedido al agente', () => {
  const pedido = pedidoDeConversion(receta);

  it('empieza pidiendo convertir el borrador', () => {
    expect(pedido).toMatch(/^Convertí este borrador en una receta para mi Recetario/);
  });

  it('lleva la receta tal cual', () => {
    expect(pedido).toContain('Focaccia');
    expect(pedido).toContain('https://ejemplo.com/focaccia');
    expect(pedido).toContain('Notas: La de la abuela, sin romero');
  });

  it('pide el id como última línea del frontmatter, y no borrador:', () => {
    expect(pedido).toMatch(/`id: r1`/);
    expect(pedido).not.toContain('borrador:');
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

  it('una receta sin fuente ni notas no deja líneas vacías con rótulo', () => {
    const p = pedidoDeConversion({ id: 'r1', titulo: 'Pan', fuente: '', notas: '' });
    expect(p).not.toMatch(/Fuente:\s*\n/);
    expect(p).not.toMatch(/Notas:\s*\n/);
  });
});

describe('el pedido con fotos', () => {
  const conFotos = { fotos: ['1AbC', '1DeF'] };

  it('dice cuántas van, en orden, qué pueden ser y cómo tratarlas, después de la receta', () => {
    const p = pedidoDeConversion(receta, conFotos);
    expect(p).toContain('Fotos: van 2, en orden.');
    expect(p).toContain('sin inventar cantidades ni pasos que no estén');
    expect(p).toContain('Una foto del plato sirve para el título y la descripción, no para la receta.');
    expect(p.indexOf('Notas: La de la abuela')).toBeLessThan(p.indexOf('Fotos: van 2'));
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('una sola foto se dice en singular', () => {
    expect(pedidoDeConversion(receta, { fotos: ['1AbC'] })).toContain('Fotos: va 1, en orden.');
  });

  it('sin fotos no dice nada de fotos', () => {
    expect(pedidoDeConversion(receta, { fotos: [] })).not.toContain('Fotos:');
  });

  it('con los links de Drive, una línea por foto y cómo leerlas', () => {
    const p = pedidoDeConversion(receta, { ...conFotos, links: true });
    expect(p).toContain('Foto 1: https://drive.google.com/file/d/1AbC/view');
    expect(p).toContain('Foto 2: https://drive.google.com/file/d/1DeF/view');
    expect(p).toContain('Las fotos están en mi Google Drive: leelas con el conector de Drive.');
    expect(pedidoDeConversion(receta, conFotos)).not.toContain('drive.google.com');
  });

  it('dice cómo referenciarlas en la receta, después del párrafo de las fotos', () => {
    const p = pedidoDeConversion(receta, conFotos);
    expect(p).toContain('En la receta, esas fotos son foto:1, foto:2…, en el mismo orden.');
    expect(p).toContain('Si una muestra el plato terminado, poné `foto: foto:N`.');
    expect(p).toContain('Si una muestra un paso, sumá `![](foto:N)` al final de ese paso.');
    expect(p).toContain('No escribas la sección Fotos: la arma la app.');
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('En la receta, esas fotos son'));
    expect(p.indexOf('En la receta, esas fotos son')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('esa guía también va cuando el pedido lleva los links de Drive', () => {
    expect(pedidoDeConversion(receta, { ...conFotos, links: true })).toContain('En la receta, esas fotos son foto:1, foto:2…');
  });

  it('sin fotos no dice nada de cómo referenciarlas', () => {
    expect(pedidoDeConversion(receta, { fotos: [] })).not.toContain('En la receta, esas fotos son');
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
  it('saca la clave id y la devuelve aparte', () => {
    const { receta, id } = recetaRecibida('---\ntitulo: Pan\nid: r1\n---\n\n## Preparación\n1. Amasar.\n');
    expect(id).toBe('r1');
    expect(receta.titulo).toBe('Pan');
    expect(receta.extras).not.toHaveProperty('id');
  });

  it('sin la clave, el id es vacío', () => {
    const { receta, id } = recetaRecibida('---\ntitulo: Pan\nmaridaje: tinto\n---\n');
    expect(id).toBe('');
    expect(receta.extras['maridaje']).toBe('tinto');
  });

  it('una receta vieja con borrador: no da id, y borrador queda en los extras como cualquier clave desconocida', () => {
    const { receta, id } = recetaRecibida('---\ntitulo: Pan\nborrador: b1\n---\n');
    expect(id).toBe('');
    expect(receta.extras['borrador']).toBe('b1');
  });
});

describe('CRLF (una receta compartida o pegada con saltos de línea de Windows)', () => {
  const CRLF = '---\r\ntitulo: Pan\r\nid: r1\r\n---\r\n\r\n## Preparación\r\n1. Amasar.\r\n';

  it('se reconoce igual que con LF', () => {
    expect(esRecetaEnMd(CRLF)).toBe(true);
  });

  it('recetaRecibida saca el título y el id, sin avisos de frontmatter faltante', () => {
    const { receta, id } = recetaRecibida(CRLF);
    expect(receta.titulo).toBe('Pan');
    expect(id).toBe('r1');
    expect(receta.avisos).not.toContain('sin-frontmatter');
    expect(receta.avisos).not.toContain('sin-titulo');
  });
});

describe('lo que llega envuelto', () => {
  const md = '---\ntitulo: Focaccia\nid: r1\n---\n\n## Preparación\n1. Amasar.\n';

  it('dentro de un bloque de código, con o sin lenguaje', () => {
    expect(esRecetaEnMd('```\n' + md + '```')).toBe(true);
    expect(esRecetaEnMd('```markdown\n' + md + '```\n')).toBe(true);
    expect(recetaRecibida('```markdown\n' + md + '```').receta.titulo).toBe('Focaccia');
    expect(recetaRecibida('~~~\n' + md + '~~~').id).toBe('r1');
  });

  it('con texto del agente antes y después del bloque', () => {
    const conCharla = 'Listo, acá va:\n\n```md\n' + md + '```\n\n¿Querés que agregue algo?';
    expect(esRecetaEnMd(conCharla)).toBe(true);
    const { receta: r, id } = recetaRecibida(conCharla);
    expect(r.titulo).toBe('Focaccia');
    expect(id).toBe('r1');
    expect(r.preparacion).toContain('Amasar');
  });

  it('citada con >, y citada adentro de un bloque', () => {
    const citada = md.split('\n').map(l => (l ? '> ' + l : '>')).join('\n');
    expect(esRecetaEnMd(citada)).toBe(true);
    expect(recetaRecibida(citada).receta.titulo).toBe('Focaccia');
    expect(recetaRecibida('```\n' + citada + '\n```').id).toBe('r1');
  });

  it('un texto cualquiera dentro de un bloque no es una receta', () => {
    expect(esRecetaEnMd('```\nhola\n```')).toBe(false);
    expect(esRecetaEnMd('> mirá esta receta\n> de pan')).toBe(false);
  });

  it('sin envoltorio, todo sigue igual', () => {
    expect(esRecetaEnMd(md)).toBe(true);
    expect(recetaRecibida(md).receta.titulo).toBe('Focaccia');
  });
});

describe('lo pegado sobre el editor abierto', () => {
  const actual = recetaFalsa({
    titulo: 'Viejo', tags: ['horno'], notas: 'lo escrito',
    fotos: [{ n: 1, url: 'https://drive.google.com/file/d/a/view' }], foto: 'foto:1'
  });
  const pegada = recetaFalsa({ titulo: 'Focaccia', tags: ['pan'], ingredientes: '- Harina — 500 g', notas: '' });

  it('título, datos, tags y secciones son los de lo pegado', () => {
    const r = aplicarPegada(actual, pegada, 'c1');
    expect(r.titulo).toBe('Focaccia');
    expect(r.tags).toEqual(['pan']);
    expect(r.ingredientes).toBe('- Harina — 500 g');
    expect(r.notas).toBe('');
  });

  it('el depósito de fotos es el del editor', () => {
    const conFotos = recetaFalsa({ ...pegada, fotos: [{ n: 7, url: 'https://x/y.jpg' }] });
    expect(aplicarPegada(actual, conFotos, 'c1').fotos).toEqual(actual.fotos);
  });

  it('la portada es la de lo pegado, y si no trae, la del editor', () => {
    expect(aplicarPegada(actual, pegada, 'c1').foto).toBe('foto:1');
    expect(aplicarPegada(actual, recetaFalsa({ ...pegada, foto: 'foto:2' }), 'c1').foto).toBe('foto:2');
  });

  it('sin categoría, queda borrador aunque lo pegado no lo traiga', () => {
    expect(aplicarPegada(actual, pegada, '').tags).toEqual(['borrador', 'pan']);
    expect(aplicarPegada(actual, pegada, 'c1').tags).not.toContain('borrador');
  });

  it('una forma alternativa de borrador no se duplica', () => {
    const vieja = recetaFalsa({ ...pegada, tags: ['incompleta'] });
    expect(aplicarPegada(actual, vieja, '').tags).toEqual(['borrador']);
  });
});
