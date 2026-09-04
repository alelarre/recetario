// tests/vista-detalle.test.js
import { describe, it, expect } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderDetalle } from '../src/ui/detalle.js';
import { invalido } from './aserciones.js';
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
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
    expect(html).toContain('4 porciones · 40 min · fácil');
  });

  it('apila las cuatro secciones en una columna, sin pestañas', () => {
    // Cocinando hacen falta los ingredientes y los pasos a la vez: las
    // pestañas obligaban a saltar entre las dos cosas con las manos ocupadas.
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
    expect(html).not.toContain('data-pestana');
    for (const s of ['Ingredientes', 'Preparación', 'Variaciones', 'Notas']) {
      expect(html).toContain(s);
    }
  });

  it('una sección que la receta no trae no se dibuja vacía', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n- sal\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r });
    expect(html).toContain('Ingredientes');
    expect(html).not.toContain('Variaciones');
  });

  it('los ingredientes se pliegan sin perder la barra que los devuelve', () => {
    const plegado = renderDetalle({ entrada: ENTRADA, receta: RECETA, ingredientesPlegados: true });
    expect(plegado).toContain('data-accion="ingredientes"');
    expect(plegado).toContain('aria-expanded="false"');
    expect(plegado).not.toContain('data-ingredientes');
  });

  it('los pasos de Preparación son marcables', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
    expect(html).toContain('class="paso"');
  });

  it('la descripción se muestra en el detalle', () => {
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
    expect(html).toContain('Un clásico.');
  });

  it('las secciones desconocidas se muestran en Notas y no se pierden', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## Maridaje\nMalbec.\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r });
    expect(html).toContain('Maridaje');
    expect(html).toContain('Malbec.');
  });

  it('una receta incompleta se ve marcada también en el detalle', () => {
    const html = renderDetalle({ entrada: { ...ENTRADA, tags: ['incompleto'] }, receta: RECETA });
    expect(html).toContain('incompleto');
  });

  describe('avisos de parseo (§8: un .md malformado se muestra con un aviso)', () => {
    it('una receta sin problemas no muestra ningún aviso', () => {
      const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
      expect(html).not.toContain('class="aviso"');
    });

    it('el frontmatter ilegible se traduce a texto legible, sin el código interno', () => {
      const r = parse(`---\ntitulo: X\nesto no es valido\n---\n\n## Ingredientes\n- sal\n`);
      expect(r.avisos).toContain('frontmatter-ilegible');
      const html = renderDetalle({ entrada: ENTRADA, receta: r });
      expect(html).toContain('el frontmatter no se pudo leer');
      expect(html).not.toContain('frontmatter-ilegible');
    });

    it('sin frontmatter ni título, avisa las dos cosas en texto legible', () => {
      const r = parse('Solo un párrafo suelto, sin frontmatter.');
      expect(r.avisos).toEqual(expect.arrayContaining(['sin-frontmatter', 'sin-titulo']));
      const html = renderDetalle({ entrada: ENTRADA, receta: r });
      expect(html).toContain('el frontmatter no se pudo leer');
      expect(html).toContain('esta receta no tiene título');
      expect(html).not.toContain('sin-frontmatter');
      expect(html).not.toContain('sin-titulo');
    });

    it('una sección repetida avisa en texto legible', () => {
      const r = parse(`---\ntitulo: X\n---\n\n## Ingredientes\n- sal\n\n## Ingredientes\n- pimienta\n`);
      expect(r.avisos).toContain('seccion-duplicada');
      const html = renderDetalle({ entrada: ENTRADA, receta: r });
      expect(html).toContain('hay una sección repetida');
      expect(html).not.toContain('seccion-duplicada');
    });

    it('con avisos inválidos o ausentes no lanza y no muestra nada', () => {
      expect(() => renderDetalle({ entrada: ENTRADA, receta: { ...RECETA, avisos: invalido(null) } })).not.toThrow();
      const html = renderDetalle({ entrada: ENTRADA, receta: { ...RECETA, avisos: [invalido('codigo-inventado')] } });
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
    expect(() => renderDetalle(invalido(null))).not.toThrow();
  });

  it('con una receta vacía no lanza', () => {
    expect(() => renderDetalle({ entrada: {}, receta: {} })).not.toThrow();
    const html = renderDetalle({ entrada: {}, receta: {} });
    expect(html).toBeTruthy();
  });

  it('escapa un script en el título', () => {
    const r = parse(`---\ntitulo: <script>alert(1)</script>\n---\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapa un script en una sección desconocida', () => {
    const r = parse(`---\ntitulo: X\n---\n\n## <script>alert(1)</script>\nContenido.\n`);
    const html = renderDetalle({ entrada: ENTRADA, receta: r });
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

  it('ofrece mantener la pantalla activa y agrandar el texto', () => {
    // Las dos mitades que resolvería un modo cocina, sin pantalla nueva.
    const html = renderDetalle({ entrada: ENTRADA, receta: RECETA });
    expect(html).toContain('data-accion="pantalla"');
    expect(html).toContain('data-accion="texto-grande"');
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
    expect(() => renderVisor(invalido(null))).not.toThrow();
    const html = renderVisor(invalido(null));
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
