import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderEditor, recetaDesdeFormulario } from '../src/ui/editor.js';

const CATEGORIAS = [{ id: 'c1', nombre: 'Carnes' }, { id: 'c2', nombre: 'Postres' }];
const RECETA = parse(`---\ntitulo: Milanesas\ndificultad: fácil\ntags: [horno, incompleto]\nautor_agente: claude\n---\n\n## Ingredientes\n- sal\n\n## Maridaje\nMalbec.\n`);
const ENTRADA = { id_archivo: 'r1', carpeta_id: 'c1' };

describe('renderEditor', () => {
  it('pone carpeta y dificultad como selectores', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toContain('<select name="carpeta"');
    expect(html).toContain('<select name="dificultad"');
    expect(html).toContain('<option value="c1" selected');
  });

  it('el resto del frontmatter va como texto', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toContain('name="titulo"');
    expect(html).toContain('name="rinde"');
    expect(html).toContain('name="fuente"');
  });

  it('un textarea por sección del cuerpo, con el Markdown crudo', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    for (const s of ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas']) {
      expect(html).toContain(`name="${s}"`);
    }
    expect(html).toContain('- sal');
  });

  it('muestra Otras secciones solo cuando el archivo las trae', () => {
    const con = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(con).toContain('Otras secciones · 1');
    expect(con).toContain('Malbec.');
    const sin = renderEditor({ receta: parse('---\ntitulo: X\n---\n'), entrada: ENTRADA, categorias: CATEGORIAS });
    expect(sin).not.toContain('Otras secciones');
  });

  it('marca el tag incompleto de forma distinta', () => {
    const html = renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS });
    expect(html).toMatch(/class="chip [^"]*incompleto[^"]*"[^>]*>incompleto/);
  });

  it('normaliza dificultad inválida antes de comparar', () => {
    const recetaInvalida = parse('---\ntitulo: X\ndificultad: imposible\n---\n');
    const html = renderEditor({ receta: recetaInvalida, entrada: ENTRADA, categorias: CATEGORIAS });
    // La opción vacía ("sin definir") debe tener selected
    expect(html).toContain('<option value="" selected>sin definir</option>');
    // Ninguna otra opción debe tener selected
    expect(html).not.toMatch(/<option value="fácil"[^>]*selected/);
    expect(html).not.toMatch(/<option value="media"[^>]*selected/);
    expect(html).not.toMatch(/<option value="difícil"[^>]*selected/);
  });

  it('ofrece borrar la receta', () => {
    expect(renderEditor({ receta: RECETA, entrada: ENTRADA, categorias: CATEGORIAS })).toContain('data-accion="borrar"');
  });

  it('defendé: sin argumentos no lanza', () => {
    expect(() => renderEditor()).not.toThrow();
  });

  it('defendé: null no lanza', () => {
    expect(() => renderEditor(null)).not.toThrow();
  });

  it('defendé: receta sin campos no lanza', () => {
    expect(() => renderEditor({ receta: {}, entrada: ENTRADA, categorias: CATEGORIAS })).not.toThrow();
  });
});

describe('recetaDesdeFormulario', () => {
  it('preserva extras y otras secciones que el formulario no toca', () => {
    const r = recetaDesdeFormulario({ titulo: 'Nuevo', tags: 'horno', ingredientes: '- sal' }, RECETA);
    expect(r.extras).toEqual({ autor_agente: 'claude' });
    expect(r.otras).toEqual([{ encabezado: 'Maridaje', cuerpo: 'Malbec.' }]);
    expect(r.titulo).toBe('Nuevo');
  });

  it('parte los tags por coma y limpia espacios', () => {
    const r = recetaDesdeFormulario({ titulo: 'X', tags: 'horno,  rápido ,' }, RECETA);
    expect(r.tags).toEqual(['horno', 'rápido']);
  });

  it('una dificultad inválida no se guarda', () => {
    const r = recetaDesdeFormulario({ titulo: 'X', dificultad: 'regular' }, RECETA);
    expect(r.dificultad).toBe('');
  });

  it('defendé: datos vacíos no lanza', () => {
    expect(() => recetaDesdeFormulario({}, RECETA)).not.toThrow();
  });

  it('defendé: null no lanza', () => {
    expect(() => recetaDesdeFormulario(null, RECETA)).not.toThrow();
  });

  it('defendé: receta original null no lanza', () => {
    expect(() => recetaDesdeFormulario({}, null)).not.toThrow();
  });
});
