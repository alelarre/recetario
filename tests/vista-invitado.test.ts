import { describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from '../src/recipe.js';
import { renderInvitado, renderLinkRoto } from '../src/ui/invitado.js';
import { renderCocina } from '../src/ui/cocina.js';
import { ACCIONES_DE_INVITADO } from '../src/invitado.js';
import { codificar, decodificar } from '../src/link-receta.js';

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

const CON_FOTOS = parse(`---
titulo: Rabas
foto: foto:2
---

## Preparación
1. Freír. ![Así queda](foto:2)
2. Servir. ![](foto:1)

## Fotos
- 1: https://drive.google.com/file/d/abc/view
- 2: https://x/plato.jpg
`);

/** Dos sin uso: una externa, que viaja, y una de Drive, que no. */
const CON_SOBRANTES = parse(`---
titulo: Rabas
foto: foto:2
---

## Preparación
1. Freír.

## Fotos
- 1: https://drive.google.com/file/d/abc/view
- 2: https://x/plato.jpg
- 3: https://x/suelta.jpg
`);

const acciones = (html: string): string[] => [...html.matchAll(/data-accion="([^"]+)"/g)].map(m => m[1] ?? '');

describe('La vista de invitado', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sólo usa acciones de su lista cerrada, en la lectura y en la cocina', () => {
    vi.stubGlobal('navigator', { wakeLock: {} });
    const lectura = renderInvitado({ receta: CON_FOTOS, categoria: 'Pescados', visor: { urls: ['https://x/plato.jpg'], i: 0 } });
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

  it('dibuja la receta resuelta y nunca pide nada a Drive', () => {
    const html = renderInvitado({ receta: CON_FOTOS, categoria: 'Pescados' });
    expect(html).toContain('src="https://x/plato.jpg"');
    expect(html).not.toContain('foto:2');
    expect(html).not.toContain('data-drive');
    expect(html).not.toContain('drive.google.com');
  });

  it('el carrusel de la primera ficha lleva sólo las sin uso que viajaron', () => {
    const html = renderInvitado({ receta: CON_SOBRANTES, categoria: '' });
    expect(html).not.toContain('<h2>Fotos</h2>');
    expect(html).toContain('carrusel-fotos');
    // Ni la portada —que ya está arriba— ni la de Drive, que no viajó.
    expect(html.match(/class="carrusel-foto cuadro-foto"/g)).toHaveLength(1);
    expect(html).toContain('src="https://x/suelta.jpg"');
    expect(html).not.toContain('data-drive');
    expect(html.indexOf('carrusel-fotos')).toBeLessThan(html.indexOf('<h2>Preparación</h2>'));
  });

  it('con todas ubicadas, el carrusel no se dibuja', () => {
    expect(renderInvitado({ receta: CON_FOTOS, categoria: '' })).not.toContain('carrusel-fotos');
  });

  it('sin fotos no hay carrusel', () => {
    expect(renderInvitado({ receta: RECETA, categoria: '' })).not.toContain('carrusel-fotos');
  });

  it('el visor abierto se dibuja sobre la receta', () => {
    const html = renderInvitado({ receta: CON_FOTOS, categoria: '', visor: { urls: ['https://x/plato.jpg'], i: 0 } });
    expect(html).toContain('class="visor"');
    expect(html).toContain('data-total="1"');
  });

  it('por el camino real —codificar, decodificar, dibujar— ninguna foto sale dos veces', async () => {
    // Los demás tests de acá arman la receta con `parse`, que es la forma cruda
    // que el link nunca entregaba: la falla sólo se veía yendo por el
    // camino de producción.
    const r = parse(`---
titulo: Rabas
foto: foto:1
---

## Preparación
1. Freír. ![](foto:2)

## Fotos
- 1: https://x/portada.jpg
- 2: https://x/paso.jpg
- 3: https://x/suelta.jpg
`);
    const vuelta = await decodificar(await codificar(r, 'Pescados'));
    expect(vuelta).not.toBeNull();
    const html = renderInvitado({ receta: vuelta!.receta, categoria: vuelta!.categoria });
    const carrusel = html.slice(html.indexOf('carrusel-fotos'), html.indexOf('carrusel-flecha'));
    expect(carrusel).toContain('https://x/suelta.jpg');
    expect(carrusel).not.toContain('https://x/portada.jpg');
    expect(carrusel).not.toContain('https://x/paso.jpg');
    // Una sola vez cada una en la pantalla entera: la portada arriba y la del
    // paso en su línea.
    expect(html.match(/https:\/\/x\/portada\.jpg/g)).toHaveLength(1);
    expect(html.match(/https:\/\/x\/paso\.jpg/g)).toHaveLength(1);
  });

  it('por el camino real, con todas ubicadas no hay carrusel', async () => {
    const vuelta = await decodificar(await codificar(CON_FOTOS, 'Pescados'));
    const html = renderInvitado({ receta: vuelta!.receta, categoria: '' });
    expect(html).not.toContain('carrusel-fotos');
    expect(html).not.toContain('data-drive');
  });

  it('el link roto lo dice y no ofrece nada', () => {
    const html = renderLinkRoto();
    expect(html).toContain('Este link está roto o incompleto.');
    expect(acciones(html)).toEqual([]);
  });
});
