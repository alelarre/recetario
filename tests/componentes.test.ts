import { describe, it, expect } from 'vitest';
import { tarjeta, placeholder, aviso, encabezado, chips, vacio, tile } from '../src/ui/componentes.js';
import { entradaFalsa } from './dobles.js';

describe('tarjeta', () => {
  it('lleva foto, título y la línea de contexto con categoría y tiempo', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Rabas', categoria: 'Pescados y mariscos', tiempo: '30 min' }));
    expect(html).toContain('Rabas');
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('30 min');
  });

  it('lleva a la receta', () => {
    expect(tarjeta(entradaFalsa({ id_archivo: 'f1' }))).toContain('href="#/r/f1"');
  });

  it('una receta sin foto lleva el placeholder, no un hueco', () => {
    const html = tarjeta(entradaFalsa({ foto: '' }));
    expect(html).toContain('class="ph"');
    expect(html).not.toContain('<img');
  });

  it('una receta con foto propia la dibuja', () => {
    const html = tarjeta(entradaFalsa({ foto: 'https://x/1.jpg' }));
    expect(html).toContain('<img class="foto" src="https://x/1.jpg"');
    expect(html).not.toContain('class="ph"');
  });

  it('el placeholder ocupa el mismo espacio que una foto', () => {
    expect(placeholder('Carnes')).toContain('class="ph"');
    // Las dos clases fijan 56px en tokens.css: la lista no se desalinea.
  });

  it('el placeholder lleva el color y la foto de la categoría', () => {
    const html = placeholder('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toContain('--img:url(');
  });

  it('una receta incompleta lleva la marca, sin color de error', () => {
    const html = tarjeta(entradaFalsa({ completa: false }));
    expect(html).toContain('class="inc"');
    expect(html).not.toContain('error');
  });

  it('una receta completa no lleva ninguna marca', () => {
    expect(tarjeta(entradaFalsa({ completa: true }))).not.toContain('class="inc"');
  });

  it('en un resultado por ingrediente, la tarjeta dice por qué apareció', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Gratin' }), { motivo: 'tiene Merluza o pescadilla' });
    expect(html).toContain('tiene Merluza o pescadilla');
  });

  it('escapa el título: un .md lo escribe cualquiera', () => {
    expect(tarjeta(entradaFalsa({ titulo: '<img onerror=alert(1)>' }))).not.toContain('<img onerror');
  });
});

describe('aviso', () => {
  it('trae el texto y el control para reintentar', () => {
    const html = aviso({ texto: 'No se pudo guardar.', accion: { etiqueta: 'Reintentar', accion: 'reintentar' } });
    expect(html).toContain('No se pudo guardar.');
    expect(html).toContain('data-accion="reintentar"');
  });

  it('un aviso sin acción no dibuja ningún botón', () => {
    expect(aviso({ texto: 'Se ignoraron 3 archivos.' })).not.toContain('<button');
  });
});

describe('encabezado', () => {
  it('el total va en el encabezado, no en la lista', () => {
    expect(encabezado({ titulo: 'Pescados y mariscos', volver: true, total: 20 })).toContain('>20<');
  });

  it('sin volver no dibuja el botón de volver', () => {
    const html = encabezado({ titulo: 'Recetario' });
    expect(html).not.toContain('data-accion="volver"');
    expect(html).toContain('Recetario');
  });

  it('escapa el título', () => {
    expect(encabezado({ titulo: '<b>x</b>' })).not.toContain('<b>x</b>');
  });
});

describe('chips', () => {
  it('marca los activos', () => {
    const html = chips(['horno', 'rápido'], ['horno']);
    expect(html).toContain('class="chip act"');
    expect(html).toContain('data-tag="horno"');
  });
});

describe('vacio', () => {
  it('es una frase y nada más', () => {
    const html = vacio('Ninguna receta se llama así.');
    expect(html).toContain('Ninguna receta se llama así.');
    expect(html).not.toContain('<button');
  });
});

describe('tile', () => {
  it('lleva la foto de la categoría y su color', () => {
    const html = tile('Pescados y mariscos');
    expect(html).toContain('--c:var(--cat-pescados)');
    expect(html).toContain('background-image:url(');
    expect(html).toContain('href="#/c/Pescados%20y%20mariscos"');
  });

  it('una categoría sin foto cae en la trama, no en un hueco', () => {
    expect(tile('Fiambres caseros')).toContain('class="im trama"');
  });

  it('el contador aparece cuando la categoría tiene recetas', () => {
    expect(tile('Carnes', 20)).toContain('<span class="cu">20</span>');
  });

  it('en cero no se dibuja: una categoría vacía se muestra igual, sin un 0 encima', () => {
    expect(tile('Carnes', 0)).not.toContain('class="cu"');
    expect(tile('Carnes')).not.toContain('class="cu"');
  });
});
