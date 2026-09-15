import { describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderInvitado, renderLinkRoto } from '../src/ui/invitado.js';
import { renderCocina } from '../src/ui/cocina.js';
import { ACCIONES_DE_INVITADO } from '../src/invitado.js';

const RECETA = parse(`---
titulo: Rabas
tags: [fritura]
fuente: https://p.com/rabas
completa: no
---

Una entrada clásica.

## Ingredientes
- Calamar — 500 g

## Preparación
1. Lavar.
2. Freír.

## Notas
Ojo con el aceite.
`);

const acciones = (html: string): string[] => [...html.matchAll(/data-accion="([^"]+)"/g)].map(m => m[1] ?? '');

describe('La vista de invitado', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sólo usa acciones de su lista cerrada, en la lectura y en la cocina', () => {
    vi.stubGlobal('navigator', { wakeLock: {} });
    const lectura = renderInvitado({ receta: RECETA, categoria: 'Pescados' });
    const cocina = renderCocina({ receta: RECETA, posicion: 'pasos', aqui: 0, hechos: [], salidas: 'solo-volver' });
    for (const a of [...acciones(lectura), ...acciones(cocina)]) {
      expect(ACCIONES_DE_INVITADO as readonly string[], a).toContain(a);
    }
    expect(acciones(lectura)).toContain('cocinar');
  });

  it('no tiene tags, ni marca de incompleta, ni .md, ni compartir, ni editar', () => {
    const html = renderInvitado({ receta: RECETA, categoria: 'Pescados' });
    expect(html).not.toContain('class="chips"');
    expect(html).not.toContain('data-tag');
    expect(html).not.toContain('Incompleta');
    expect(html).not.toContain('drive.google.com');
    expect(html).not.toContain('data-accion="compartir"');
    expect(html).not.toContain('Editar');
    expect(html).not.toContain('class="enc');
  });

  it('muestra la cabecera y las fichas del cuerpo', () => {
    const html = renderInvitado({ receta: RECETA, categoria: 'Pescados' });
    expect(html).toContain('class="rec-tit">Rabas<');
    expect(html).toContain('Pescados');
    expect(html).toContain('>p.com/rabas<');
    expect(html).toContain('<h2>Ingredientes</h2>');
    expect(html).toContain('<h2>Notas</h2>');
  });

  it('la categoría va sin pin: el color es de la carpeta del dueño y el invitado no lo conoce', () => {
    const html = renderInvitado({ receta: RECETA, categoria: 'Pescados' });
    expect(html).not.toContain('class="pin"');
    expect(html).toContain('Pescados');
  });

  it('sin ingredientes ni pasos no hay pie', () => {
    expect(renderInvitado({ receta: parse('---\ntitulo: A\n---\n'), categoria: '' })).not.toContain('class="pie"');
  });

  it('el link roto lo dice y no ofrece nada', () => {
    const html = renderLinkRoto();
    expect(html).toContain('Este link está roto o incompleto.');
    expect(acciones(html)).toEqual([]);
  });
});
