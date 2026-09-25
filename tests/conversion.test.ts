import { describe, it, expect } from 'vitest';
import { pedidoDeConversion, esRecetaEnMd, recetaRecibida, aplicarPegada } from '../src/conversion.js';
import { recetaFalsa } from './dobles.js';
import { DURACIONES, DIFICULTADES } from '../src/catalogo.js';

const vacio = { descripcion: '', rinde: '', ingredientes: '', preparacion: '' };
const receta = { id: 'r1', titulo: 'Focaccia', fuente: 'https://ejemplo.com/focaccia', notas: 'La de la abuela, sin romero', ...vacio };

describe('el pedido al agente', () => {
  const pedido = pedidoDeConversion(receta);

  it('empieza pidiendo convertir el borrador', () => {
    expect(pedido).toMatch(/^Convertir este borrador en una receta para mi Recetario/);
  });

  it('lleva la receta tal cual', () => {
    expect(pedido).toContain('Título: Focaccia');
    expect(pedido).toContain('Fuente: https://ejemplo.com/focaccia');
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
    const p = pedidoDeConversion({ ...receta, fuente: '', notas: '' });
    expect(p).not.toMatch(/Fuente:\s*\n/);
    expect(p).not.toMatch(/Notas:\s*\n/);
  });
});

describe('el título', () => {
  it('el que se pone solo a un borrador no viaja: se pide uno que represente el plato', () => {
    const p = pedidoDeConversion({ ...receta, titulo: 'Borrador 24/09 21:15' });
    expect(p).not.toContain('Borrador 24/09 21:15');
    expect(p).toContain('Título: no tiene. Proponer un título corto que represente el plato.');
  });

  it('sin título, lo mismo', () => {
    expect(pedidoDeConversion({ ...receta, titulo: '' }))
      .toContain('Título: no tiene. Proponer un título corto que represente el plato.');
  });

  it('un título escrito que empieza con «Borrador» pero no es el de la fecha viaja', () => {
    expect(pedidoDeConversion({ ...receta, titulo: 'Borrador de pan' })).toContain('Título: Borrador de pan');
  });
});

describe('lo que ya está cargado en el editor', () => {
  const cargada = {
    ...receta, descripcion: 'Esponjosa y bien aceitada', rinde: '1 placa',
    ingredientes: '- Harina — 500 g\n- Agua — 350 cc', preparacion: '1. Mezclar.\n2. Leudar.'
  };
  const p = pedidoDeConversion(cargada);

  it('viaja tal cual, cada campo con su rótulo', () => {
    expect(p).toContain('Descripción: Esponjosa y bien aceitada');
    expect(p).toContain('Rinde: 1 placa');
    expect(p).toContain('Ingredientes:\n- Harina — 500 g\n- Agua — 350 cc');
    expect(p).toContain('Preparación:\n1. Mezclar.\n2. Leudar.');
  });

  it('se pide conservarlo y refinarlo, nombrando sólo lo que hay', () => {
    expect(p).toContain('Lo que ya está cargado (descripción, rinde, ingredientes y preparación) es el punto de partida');
    const soloIngredientes = pedidoDeConversion({ ...receta, ingredientes: '- Harina — 500 g' });
    expect(soloIngredientes).toContain('Lo que ya está cargado (ingredientes) es el punto de partida');
    expect(soloIngredientes).not.toContain('Rinde:');
  });

  it('sin nada cargado no se habla de eso', () => {
    expect(pedidoDeConversion(receta)).not.toContain('Lo que ya está cargado');
  });
});

describe('la fuente y la búsqueda', () => {
  it('con fuente: transcribir y después corroborar contra fuentes externas', () => {
    const p = pedidoDeConversion(receta);
    expect(p).toContain('Leer la fuente y transcribir la receta.');
    expect(p).toContain('Después, corroborarla con una búsqueda web contra una o más fuentes externas.');
    expect(p).toContain('quedarse con la fuente original y anotar la diferencia en `## Notas`');
  });

  it('sin fuente: proponer la receta y contrastarla con una búsqueda web, y anotar la fuente usada', () => {
    const p = pedidoDeConversion({ ...receta, fuente: '' });
    expect(p).not.toContain('Leer la fuente');
    expect(p).toContain('No hay fuente: proponer la receta a partir del borrador y contrastarla con una búsqueda web de una o más fuentes.');
    expect(p).toContain('En `fuente`, poner la URL de la fuente principal consultada.');
  });
});

describe('el pedido con fotos', () => {
  // Los números son los del depósito: el 2 no va (un link externo, o una
  // foto que no se pudo leer), y el pedido lo tiene que decir.
  const conFotos = { fotos: [{ n: 1, id: '1AbC' }, { n: 3, id: '1DeF' }] };

  it('dice cuántas van, en orden, qué pueden ser y cómo tratarlas, después de la receta', () => {
    const p = pedidoDeConversion(receta, conFotos);
    expect(p).toContain('Fotos: van 2, en orden.');
    expect(p).toContain('sin inventar cantidades ni pasos que no estén');
    expect(p).toContain('Una foto del plato sirve para el título y la descripción, no para la receta.');
    expect(p.indexOf('Notas: La de la abuela')).toBeLessThan(p.indexOf('Fotos: van 2'));
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('una sola foto se dice en singular', () => {
    expect(pedidoDeConversion(receta, { fotos: [{ n: 1, id: '1AbC' }] })).toContain('Fotos: va 1, en orden.');
  });

  it('sin fotos no dice nada de fotos', () => {
    expect(pedidoDeConversion(receta, { fotos: [] })).not.toContain('Fotos:');
  });

  it('con los links de Drive, una línea por foto y cómo leerlas', () => {
    const p = pedidoDeConversion(receta, { ...conFotos, links: true });
    expect(p).toContain('foto:1: https://drive.google.com/file/d/1AbC/view');
    expect(p).toContain('foto:3: https://drive.google.com/file/d/1DeF/view');
    expect(p).toContain('Las fotos están en mi Google Drive: leerlas con el conector de Drive.');
    expect(pedidoDeConversion(receta, conFotos)).not.toContain('drive.google.com');
  });

  it('dice cómo referenciarlas en la receta, después del párrafo de las fotos', () => {
    const p = pedidoDeConversion(receta, conFotos);
    expect(p).toContain('En la receta, cada foto se nombra con su número: la 1.ª es foto:1 y la 2.ª es foto:3.');
    expect(p).toContain('Si una muestra el plato terminado, poner `foto: foto:N`.');
    expect(p).toContain('Si una muestra un paso, sumar `![](foto:N)` al final de ese paso.');
    expect(p).toContain('No escribir la sección Fotos: la arma la app.');
    expect(p.indexOf('Fotos: van 2')).toBeLessThan(p.indexOf('En la receta, cada foto'));
    expect(p.indexOf('En la receta, cada foto')).toBeLessThan(p.indexOf('Formato:'));
  });

  it('esa guía también va cuando el pedido lleva los links de Drive', () => {
    expect(pedidoDeConversion(receta, { ...conFotos, links: true })).toContain('la 1.ª es foto:1 y la 2.ª es foto:3');
  });

  it('una sola foto dice su número', () => {
    expect(pedidoDeConversion(receta, { fotos: [{ n: 4, id: 'x' }] }))
      .toContain('En la receta, cada foto se nombra con su número: la 1.ª es foto:4.');
  });

  it('tres o más se enumeran con comas y la última con «y»', () => {
    const p = pedidoDeConversion(receta, { fotos: [{ n: 1, id: 'a' }, { n: 2, id: 'b' }, { n: 5, id: 'c' }] });
    expect(p).toContain('la 1.ª es foto:1, la 2.ª es foto:2 y la 3.ª es foto:5.');
  });

  it('sin fotos no dice nada de cómo referenciarlas', () => {
    expect(pedidoDeConversion(receta, { fotos: [] })).not.toContain('En la receta, cada foto');
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
