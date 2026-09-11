import { describe, it, expect } from 'vitest';
import { renderReceta } from '../src/ui/receta.js';
import { parse } from '../src/recipe.js';
import { entradaFalsa } from './dobles.js';

const MINIMA = parse('---\ntitulo: A\n---\n');

const COMPLETA = parse(`---
titulo: Rabas
tags: [fritura]
rinde: 4 porciones
fuente: Recetario original
foto: https://x/1.jpg
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g
- Sal, pimienta

## Preparación
1. Lavar.
2. Freír.

## Variaciones
- Tempura en vez de harina.

## Notas
Ojo con la temperatura.
`);

const CON_TRAMOS = parse(`---
titulo: Anchoítas
---

## Preparación
### Para la anchoíta
1. Filetear.
### Para el melón
1. Pelar.
### Final
1. Servir.
`);

describe('Receta en lectura', () => {
  it('el orden es foto, título, contexto, fuente, descripción, ingredientes, preparación, variaciones, notas', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    const pos = (s: string) => html.indexOf(s);
    expect(pos('rec-foto')).toBeLessThan(pos('rec-tit'));
    expect(pos('rec-tit')).toBeLessThan(pos('Ingredientes'));
    expect(pos('Ingredientes')).toBeLessThan(pos('Preparación'));
    expect(pos('Preparación')).toBeLessThan(pos('Variaciones'));
    expect(pos('Variaciones')).toBeLessThan(pos('Notas'));
  });

  it('la categoría sale de la fila del índice, no del frontmatter', () => {
    const html = renderReceta({ entrada: entradaFalsa({ categoria: 'Pescados y mariscos' }), receta: COMPLETA });
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('var(--cat-pescados)');
  });

  it('una sección ausente no deja encabezado vacío', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('Notas');
  });

  it('sin foto, la receta empieza por el título', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('rec-foto');
  });

  it('los ### de preparación son tramos y la numeración vuelve a empezar', () => {
    const html = renderReceta({ entrada: null, receta: CON_TRAMOS });
    expect(html.match(/class="tramo"/g)).toHaveLength(3);
    expect(html.match(/<ol class="pasos">/g)).toHaveLength(3);
  });

  it('una sección desconocida se muestra tal cual, al final', () => {
    const html = renderReceta({ entrada: null, receta: parse('---\ntitulo: A\n---\n## Maridaje\nUn tinto.') });
    expect(html).toContain('Maridaje');
    expect(html).toContain('Un tinto.');
  });

  it('la marca de incompleta es tocable y abre el editor', () => {
    const html = renderReceta({ entrada: null, receta: MINIMA });
    expect(html).toContain('data-accion="editar"');
    expect(html).toContain('class="inc');
  });

  it('una receta completa no lleva la marca', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('class="inc"');
  });

  it('las variaciones como bullets se muestran como lista', () => {
    const html = renderReceta({ entrada: null, receta: parse('---\ntitulo: A\n---\n## Variaciones\n- Sin huevo.') });
    expect(html).toContain('Sin huevo.');
  });

  it('una variación con fuente propia la muestra como fuente, no como cuerpo', () => {
    const r = parse('---\ntitulo: A\n---\n## Variaciones\n### A la suiza\n*Libro de cocina*\n\nCambiar la salsa.');
    expect(renderReceta({ entrada: null, receta: r })).toContain('class="f"');
  });

  it('los tags son tocables y llevan al filtro', () => {
    const r = parse('---\ntitulo: A\ntags: [horno]\n---\n');
    expect(renderReceta({ entrada: null, receta: r })).toContain('data-tag="horno"');
  });

  it('al pie están Cocinar y Editar', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html).toContain('>Cocinar<');
    expect(html).toContain('Editar');
  });

  it('sin ingredientes ni pasos, no se ofrece Cocinar', () => {
    expect(renderReceta({ entrada: null, receta: MINIMA })).not.toContain('>Cocinar<');
  });

  it('escapa el título: el .md lo escribe cualquiera', () => {
    const r = parse('---\ntitulo: "<img onerror=alert(1)>"\n---\n');
    expect(renderReceta({ entrada: null, receta: r })).not.toContain('<img onerror');
  });
});
