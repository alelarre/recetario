// tests/vista-detalle.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderDetalle } from '../src/ui/detalle.js';
import { renderVisor } from '../src/ui/visor.js';

const RECETA = parse(`---
titulo: Milanesas napolitanas
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
tags: [horno]
---

Un clásico.

## Ingredientes
- 200 g de muzzarella

## Preparación
1. Precalentar.
2. Hornear.

## Variaciones
### A la suiza
Gruyere.

## Notas
- Ojo con el horno.
`);

const ENTRADA = { id_archivo: 'r1', titulo: 'Milanesas napolitanas', tags: ['horno'] };

describe('renderDetalle', () => {
  it('muestra la meta junta', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('la pestaña Notas cuenta notas y variaciones juntas', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('Notas · 2');
  });

  it('la pestaña Notas queda apagada cuando no hay ninguna', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n- sal\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
    expect(html).toMatch(/data-pestana="notas"[^>]*disabled/);
  });

  it('los pasos de Preparación son marcables', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'preparacion' });
    expect(html).toContain('class="paso"');
  });

  it('la descripción se muestra en el detalle', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('Un clásico.');
  });

  it('las secciones desconocidas se muestran en Notas y no se pierden', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nMalbec.\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'notas' });
    expect(html).toContain('Maridaje');
    expect(html).toContain('Malbec.');
  });

  it('una receta incompleta se ve marcada también en el detalle', () => {
    const html = renderDetalle({ entrada: { ...ENTRADA, tags: ['incompleto'] }, receta: RECETA, pestana: 'ingredientes' });
    expect(html).toContain('incompleto');
  });

  describe('avisos de parseo (§8: un .md malformado se muestra con un aviso)', () => {
    it('una receta sin problemas no muestra ningún aviso', () => {
      const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'ingredientes' });
      expect(html).not.toContain('class="aviso"');
    });

    it('el frontmatter ilegible se traduce a texto legible, sin el código interno', () => {
      const r = parse(`---\ntitulo: X\nesto no es valido\n---\n\n## Ingredientes\n- sal\n`);
      expect(r.avisos).toContain('frontmatter-ilegible');
      const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
      expect(html).toContain('el frontmatter no se pudo leer');
      expect(html).not.toContain('frontmatter-ilegible');
    });

    it('sin frontmatter ni título, avisa las dos cosas en texto legible', () => {
      const r = parse('Solo un párrafo suelto, sin frontmatter.');
      expect(r.avisos).toEqual(expect.arrayContaining(['sin-frontmatter', 'sin-titulo']));
      const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
      expect(html).toContain('el frontmatter no se pudo leer');
      expect(html).toContain('esta receta no tiene título');
      expect(html).not.toContain('sin-frontmatter');
      expect(html).not.toContain('sin-titulo');
    });

    it('una sección repetida avisa en texto legible', () => {
      const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n- sal\n\n## Ingredientes\n- pimienta\n`);
      expect(r.avisos).toContain('seccion-duplicada');
      const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
      expect(html).toContain('hay una sección repetida');
      expect(html).not.toContain('seccion-duplicada');
    });

    it('con avisos inválidos o ausentes no lanza y no muestra nada', () => {
      expect(() => renderDetalle({ entrada: ENTRADA, receta: { ...RECETA, avisos: null }, pestana: 'ingredientes' })).not.toThrow();
      const html = renderDetalle({ entrada: ENTRADA, receta: { ...RECETA, avisos: ['codigo-inventado'] }, pestana: 'ingredientes' });
      expect(html).not.toContain('class="aviso"');
    });
  });

  // Tests de defensa
  it('sin argumentos no lanza', () => {
    expect(() => renderDetalle()).not.toThrow();
    const html = renderDetalle();
    expect(html).toBeTruthy();
    expect(typeof html).toBe('string');
  });

  it('con null no lanza', () => {
    expect(() => renderDetalle(null)).not.toThrow();
  });

  it('con una receta vacía no lanza', () => {
    expect(() => renderDetalle({ entrada: {}, receta: {}, pestana: 'ingredientes' })).not.toThrow();
    const html = renderDetalle({ entrada: {}, receta: {}, pestana: 'ingredientes' });
    expect(html).toBeTruthy();
  });

  it('escapa un script en el título', () => {
    const r = parse(`---\ntitulo: <script>alert(1)</script>\n---\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'ingredientes' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapa un script en una sección desconocida', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## <script>alert(1)</script>\nContenido.\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r, pestana: 'notas' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('con receta null no lanza', () => {
    expect(() => renderDetalle({ entrada: ENTRADA, receta: null })).not.toThrow();
    const html = renderDetalle({ entrada: ENTRADA, receta: null });
    expect(html).toBeTruthy();
  });

  it('con entrada null y receta null no lanza', () => {
    expect(() => renderDetalle({ entrada: null, receta: null })).not.toThrow();
    const html = renderDetalle({ entrada: null, receta: null });
    expect(html).toBeTruthy();
  });

  it('con una pestaña inexistente, exactamente una pestaña queda seleccionada', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA, pestana: 'inventada' });
    const matches = html.match(/aria-selected="true"/g);
    expect(matches).toHaveLength(1);
  });
});

describe('renderVisor', () => {
  it('muestra la foto pedida y cuántas hay', () => {
    const html = renderVisor({ fotos: ['https://a/1', 'https://a/2'], indice: 1 });
    expect(html).toContain('https://a/2');
    expect(html).toContain('2 / 2');
  });

  it('emite visor-contador y no meta', () => {
    const html = renderVisor({ fotos: ['https://a/1', 'https://a/2'], indice: 0 });
    expect(html).toContain('class="visor-contador"');
    expect(html).not.toContain('class="meta"');
  });

  // Tests de defensa
  it('con la lista de fotos vacía no lanza', () => {
    expect(() => renderVisor({ fotos: [], indice: 0 })).not.toThrow();
    const html = renderVisor({ fotos: [], indice: 0 });
    expect(html).toBe('');
  });

  it('con null no lanza', () => {
    expect(() => renderVisor(null)).not.toThrow();
    const html = renderVisor(null);
    expect(typeof html).toBe('string');
  });

  it('con un índice negativo no produce undefined', () => {
    const html = renderVisor({ fotos: ['https://a/1', 'https://a/2'], indice: -1 });
    expect(html).not.toContain('undefined');
  });

  it('con un índice fuera de rango no produce undefined', () => {
    const html = renderVisor({ fotos: ['https://a/1', 'https://a/2'], indice: 10 });
    expect(html).not.toContain('undefined');
  });

  it('escapa URLs en el src', () => {
    const html = renderVisor({ fotos: ['https://a/"><script>alert(1)</script>'], indice: 0 });
    expect(html).not.toContain('<script>');
  });
});
