import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderCocina } from '../src/ui/cocina.js';
import { ICO } from '../src/ui/iconos.js';
import { parse } from '../src/recipe.js';

const COMPLETA = parse(`---
titulo: Rabas
---

## Ingredientes
- Calamar — 500 g
- Sal

## Preparación
1. Lavar.
2. Freír.
`);

const CON_TODO = parse(`---
titulo: Rabas
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g

## Preparación
1. Lavar.

## Variaciones
- Tempura.

## Notas
Ojo con el aceite.
`);

const base: { posicion: 'pasos'; aqui: number | null; hechos: number[] } =
  { posicion: 'pasos', aqui: null, hechos: [] };

describe('Modo cocina', () => {
  describe('mantener la pantalla encendida (C03.3.1)', () => {
    afterEach(() => { vi.unstubAllGlobals(); });

    it('es un ícono del encabezado, antes de Salir, y no hay barra al pie', () => {
      vi.stubGlobal('navigator', { wakeLock: {} });
      const html = renderCocina({ ...base, receta: COMPLETA });
      const enc = html.slice(0, html.indexOf('data-accion="salir-cocina"'));
      expect(enc).toContain('data-accion="wake"');
      expect(enc).toContain('aria-label="Mantener la pantalla encendida"');
      expect(html).not.toContain('class="wake"');
    });

    it('apagado no está presionado; encendido se invierte', () => {
      vi.stubGlobal('navigator', { wakeLock: {} });
      expect(renderCocina({ ...base, receta: COMPLETA })).toContain('class="ico" data-accion="wake" aria-pressed="false"');
      expect(renderCocina({ ...base, receta: COMPLETA, wakeActivo: true }))
        .toContain('class="ico on" data-accion="wake" aria-pressed="true"');
    });

    it('si el navegador no lo soporta, no se dibuja', () => {
      vi.stubGlobal('navigator', {});
      expect(renderCocina({ ...base, receta: COMPLETA })).not.toContain('data-accion="wake"');
    });
  });

  it('abre en Ingredientes: el mise en place va primero', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, posicion: 'ingredientes' });
    expect(html).toContain(`<button class="on" data-accion="conmutar" data-posicion="ingredientes">${ICO.zanahoria}Ingredientes</button>`);
  });

  it('cada posición del conmutador lleva su ícono al lado de la palabra', () => {
    const html = renderCocina({ ...base, receta: COMPLETA });
    expect(html).toContain(`data-posicion="ingredientes">${ICO.zanahoria}Ingredientes</button>`);
    expect(html).toContain(`data-posicion="pasos">${ICO.listaNumerada}Pasos</button>`);
  });

  it('notas, variaciones y descripción no se muestran', () => {
    const html = renderCocina({ ...base, receta: CON_TODO });
    expect(html).not.toContain('Notas');
    expect(html).not.toContain('Variaciones');
    expect(html).not.toContain('Una entrada clásica');
  });

  it('el paso realzado lleva la clase aqui, y solo uno', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, aqui: 1 });
    expect(html.match(/class="aqui"/g)).toHaveLength(1);
  });

  it('un paso hecho se atenúa y no se tacha', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, hechos: [0] });
    expect(html).toContain('class="hecho"');
    expect(html).not.toContain('text-decoration');
    expect(html).not.toContain('<s>');
  });

  it('el paso donde voy no cuenta además como hecho', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, aqui: 0, hechos: [0] });
    expect(html.match(/class="hecho"/g)).toBeNull();
  });

  it('sin ingredientes, el conmutador no dibuja esa posición', () => {
    const r = parse('---\ntitulo: A\n---\n## Preparación\n1. Salar.');
    expect(renderCocina({ ...base, receta: r })).not.toContain('Ingredientes</button>');
  });

  it('los ingredientes conservan la distinción entre nombre y cantidad', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, posicion: 'ingredientes' });
    expect(html).toContain('class="n"');
    expect(html).toContain('class="c"');
  });

  it('tiene salida visible', () => {
    expect(renderCocina({ ...base, receta: COMPLETA })).toContain('>Salir<');
  });

  it('escapa lo que viene del .md', () => {
    const r = parse('---\ntitulo: "<img onerror=alert(1)>"\n---\n## Preparación\n1. Salar.');
    expect(renderCocina({ ...base, receta: r })).not.toContain('<img onerror');
  });
});
