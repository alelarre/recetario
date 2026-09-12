import { describe, it, expect } from 'vitest';
import { renderEditor, recetaDesdeFormulario, formularioDesde } from '../src/ui/editor.js';
import { parse, serialize } from '../src/recipe.js';
import { entradaFalsa } from './dobles.js';
import type { Categoria } from '../src/store.js';

const categorias: Categoria[] = [
  { id: 'c1', nombre: 'Carnes' }, { id: 'c2', nombre: 'Pescados y mariscos' }
];

const MD_REAL = `---
titulo: Rabas
tags: [fritura, rápido]
rinde: 4 porciones
fuente: Recetario original
maridaje: tinto
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g

## Preparación
1. Lavar.

## Maridaje
Un tinto.
`;

const cargada = parse(MD_REAL);
const dibujar = (extra = {}) => renderEditor({ entrada: null, receta: cargada, categorias, ...extra });

describe('renderEditor', () => {
  it('hay un control por clave del frontmatter y el YAML no se ve', () => {
    const html = dibujar();
    for (const c of ['titulo', 'tags', 'rinde', 'tiempo', 'dificultad', 'fuente', 'foto']) {
      expect(html).toContain(`name="${c}"`);
    }
    expect(html).not.toContain('---\ntitulo:');
  });

  it('los tags son pills que se sacan de a una, más un campo para agregar', () => {
    const html = dibujar();
    expect(html).toContain('data-accion="tag-quitar"');
    expect(html).toContain('data-valor="fritura"');
    expect(html).toContain('data-valor="rápido"');
    expect(html).toContain('data-tag-nuevo');
  });

  it('lo que viaja en el formulario es el campo oculto, no lo a medio escribir', () => {
    const html = dibujar();
    expect(html).toContain('<input type="hidden" name="tags" value="fritura, rápido">');
    // El campo de agregar no se llama `tags`: un tag a medio tipear no se guarda.
    expect(html.match(/name="tags"/g)).toHaveLength(1);
  });

  it('rinde y tiempo no sugieren un valor: son texto libre', () => {
    // El value sí sale del .md; lo que no va es un ejemplo puesto por la app,
    // que se lee como si fuera el formato esperado.
    const html = dibujar();
    expect(html).toContain('<input name="rinde" value="4 porciones">');
    expect(html).toContain('<input name="tiempo" value="">');
    expect(html).not.toContain('40 min');
  });

  it('una receta completa muestra la casilla tildada, y bloqueada', () => {
    // Tildada porque lo está; bloqueada porque no hay nada que declarar, y
    // dejarla editable escribiría `completa: true` en un .md que no la tenía.
    const html = dibujar();
    expect(html).toContain('<input type="checkbox" name="completa" checked disabled>');
    expect(html).toContain('Ya cuenta como completa');
  });

  it('a una receta incompleta la casilla se le puede marcar', () => {
    const html = renderEditor({ entrada: null, receta: parse('---\ntitulo: A\n---\n'), categorias });
    expect(html).toContain('<input type="checkbox" name="completa">');
    expect(html).toContain('Le falta algún ingrediente o paso');
  });

  it('con completa: true en el archivo, la casilla queda editable: es la única forma de borrar la clave', () => {
    const conClave = parse(`---\ntitulo: A\ncompleta: true\n---\n\n## Ingredientes\n- Sal\n\n## Preparación\n1. Salar.\n`);
    const html = renderEditor({ entrada: null, receta: conClave, categorias });
    expect(html).toContain('<input type="checkbox" name="completa" checked>');
    expect(html).not.toContain('disabled>');
    expect(html).toContain('Podés desmarcarla');
  });

  it('dificultad es una elección de tres', () => {
    const html = dibujar();
    for (const d of ['fácil', 'media', 'difícil']) expect(html).toContain(d);
  });

  it('la categoría son las subcarpetas, y la actual viene elegida', () => {
    const html = renderEditor({
      entrada: entradaFalsa({ carpeta_id: 'c2' }), receta: cargada, categorias
    });
    expect(html).toContain('Pescados y mariscos');
    expect(html).toContain('value="c2" selected');
  });

  it('hay cinco campos de contenido, y los ingredientes son uno más', () => {
    const html = dibujar();
    for (const s of ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas']) {
      expect(html).toContain(`name="${s}"`);
    }
    expect(html.match(/name="ingredientes"/g)).toHaveLength(1);
  });

  it('lo que el editor no entiende no se muestra', () => {
    const html = dibujar();
    expect(html).not.toContain('maridaje: tinto');
    expect(html).not.toContain('name="otra-0"');
  });

  it('la casilla de completa está al pie', () => {
    expect(dibujar()).toContain('Está completa así como está');
  });

  it('sin entrada no se ofrece borrar: el archivo todavía no existe', () => {
    expect(dibujar()).not.toContain('data-accion="borrar"');
    expect(renderEditor({ entrada: entradaFalsa(), receta: cargada, categorias }))
      .toContain('data-accion="borrar"');
  });

  it('borrar pide confirmación y nombra la receta', () => {
    const html = renderEditor({
      entrada: entradaFalsa(), receta: cargada, categorias, confirmandoBorrado: true
    });
    expect(html).toContain('¿Borrar <b>Rabas</b>?');
    expect(html).toContain('data-accion="borrar-confirmado"');
  });

  it('cuando falla, el aviso aparece y lo escrito sigue en pantalla', () => {
    const html = dibujar({ error: 'No se pudo guardar.' });
    expect(html).toContain('No se pudo guardar.');
    expect(html).toContain(cargada.titulo!);
  });
});

describe('recetaDesdeFormulario', () => {
  it('un campo vacío no escribe su clave', () => {
    const r = recetaDesdeFormulario({ titulo: 'A', rinde: '', foto: '' }, parse(''));
    expect(serialize(r)).not.toContain('rinde:');
    expect(serialize(r)).not.toContain('foto:');
  });

  it('las claves y secciones desconocidas se conservan', () => {
    const original = parse('---\ntitulo: A\nmaridaje: tinto\n---\n## Maridaje\nUn tinto.');
    const nueva = recetaDesdeFormulario({ titulo: 'B' }, original);
    const md = serialize(nueva);
    expect(md).toContain('maridaje: tinto');
    expect(md).toContain('## Maridaje');
    expect(md).toContain('Un tinto.');
  });

  it('guardar sin tocar nada produce un archivo equivalente', () => {
    const original = parse(MD_REAL);
    expect(serialize(recetaDesdeFormulario(formularioDesde(original), original))).toBe(serialize(original));
  });

  it('marcar la casilla escribe completa: true', () => {
    const r = recetaDesdeFormulario({ titulo: 'A', completa: 'on' }, parse('---\ntitulo: A\n---\n'));
    expect(serialize(r)).toContain('completa: true');
  });

  it('desmarcar la casilla borra la clave, no escribe completa: false', () => {
    const r = recetaDesdeFormulario({ titulo: 'A' }, parse('---\ntitulo: A\ncompleta: true\n---\n'));
    expect(serialize(r)).not.toContain('completa');
  });

  it('el título vacío no borra el que había: es el único obligatorio', () => {
    const r = recetaDesdeFormulario({ titulo: '' }, parse('---\ntitulo: A\n---\n'));
    expect(r.titulo).toBe('A');
  });

  it('los tags se separan por coma y se limpian', () => {
    const r = recetaDesdeFormulario({ titulo: 'A', tags: ' horno , , rápido ' }, parse(''));
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('no corrige la convención de los ingredientes: los guarda tal cual', () => {
    const texto = '- Sal, pimienta\n-   Aceite para freír';
    const r = recetaDesdeFormulario({ titulo: 'A', ingredientes: texto }, parse(''));
    expect(r.ingredientes).toBe(texto);
  });
});
