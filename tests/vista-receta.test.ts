import { describe, it, expect } from 'vitest';
import { renderReceta } from '../src/ui/receta.js';
import { parse } from '../src/recipe.js';
import { entradaFalsa } from './dobles.js';

const MINIMA = parse('---\ntitulo: A\n---\n');

const COMPLETA = parse(`---
titulo: Rabas
completa: sí
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

  it('el encabezado arranca sin texto: ni el título ni la categoría se repiten', () => {
    const html = renderReceta({ entrada: entradaFalsa({ categoria: 'Pescados y mariscos' }), receta: COMPLETA });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    // Vacío pero presente: `main` le pone el título cuando el grande sale de
    // pantalla, así que el span tiene que estar.
    expect(enc).toContain('<span class="tit"></span>');
    expect(enc).not.toContain('Rabas');
    expect(enc).not.toContain('Pescados y mariscos');
  });

  it('la fuente lleva su prefijo', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).toContain('>📖</span>fuente: ');
  });

  it('la descripción va en la misma ficha que el título, no en una aparte', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    // Entre el título y la descripción no hay otra ficha: es la misma.
    const entre = html.slice(html.indexOf('rec-tit'), html.indexOf('Una entrada clásica'));
    expect(entre).not.toContain('class="ficha"');
    expect(html.indexOf('Una entrada clásica')).toBeLessThan(html.indexOf('<h2>Ingredientes'));
  });

  it('una fuente que es URL se dibuja clickeable, sin el esquema a la vista', () => {
    const r = parse('---\ntitulo: A\nfuente: https://cookpad.com/ar/recetas/123\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('<a href="https://cookpad.com/ar/recetas/123" target="_blank" rel="noopener">');
    expect(html).toContain('>cookpad.com/ar/recetas/123<');
  });

  it('una fuente en markdown usa su texto como link', () => {
    const r = parse('---\ntitulo: A\nfuente: "[Directo al paladar](https://directoalpaladar.com/x)"\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('href="https://directoalpaladar.com/x"');
    expect(html).toContain('>Directo al paladar<');
  });

  it('una fuente que no es URL queda como texto', () => {
    const r = parse('---\ntitulo: A\nfuente: libro de pescados, pág. 84\n---\n');
    const html = renderReceta({ entrada: null, receta: r });
    expect(html).toContain('libro de pescados, pág. 84');
    expect(html).not.toContain('<a href');
  });

  it('una fuente con esquema raro no se convierte en link', () => {
    const r = parse('---\ntitulo: A\nfuente: "[click](javascript:alert(1))"\n---\n');
    expect(renderReceta({ entrada: null, receta: r })).not.toContain('<a href');
  });

  it('la fuente cierra la cabecera: va después de los tags, no entre el título y ellos', () => {
    const html = renderReceta({ entrada: null, receta: COMPLETA });
    expect(html.indexOf('rec-ctx')).toBeLessThan(html.indexOf('class="chips"'));
    expect(html.indexOf('class="chips"')).toBeLessThan(html.indexOf('rec-fuente'));
    expect(html.indexOf('rec-fuente')).toBeLessThan(html.indexOf('Ingredientes'));
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

  it('la marca sale del archivo: una receta declarada terminada no la lleva', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('class="inc"');
    // Y una escrita entera pero sin declarar, sí.
    const sinDeclarar = parse('---\ntitulo: A\n---\n## Ingredientes\n- Sal\n## Preparación\n1. Salar.');
    expect(renderReceta({ entrada: null, receta: sinDeclarar })).toContain('class="inc"');
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

  it('el encabezado lleva el link al .md en Drive, en otra pestaña', () => {
    const html = renderReceta({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: COMPLETA });
    expect(html).toContain('href="https://drive.google.com/file/d/f1/view"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
    expect(html).toContain('.md</a>');
    expect(html).toContain('drive_favicon_2026_32dp.png');
    // Es un dato al margen, no un botón del encabezado.
    expect(html).toContain('class="archivo"');
  });

  it('sin fila del índice no hay link: no se conoce el id del archivo', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('drive.google.com');
  });

  it('no hay un menú de ⋯: las acciones están al pie', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('data-accion="menu"');
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
