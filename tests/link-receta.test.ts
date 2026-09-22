import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '../src/recipe.js';
import { codificar, decodificar, urlDeLink } from '../src/link-receta.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));

const CON_FOTOS = parse(`---
titulo: Rabas
foto: foto:1
---

## Preparación
1. Freír. ![Así queda](foto:1)
2. Servir. ![](foto:2)

## Fotos
- 1: https://drive.google.com/file/d/abc/view
- 2: https://x/plato.jpg
`);

describe('el link de una receta', () => {
  it('ida y vuelta: la receta y su categoría', async () => {
    const vuelta = await decodificar(await codificar(BABA, 'Entradas y picadas'));
    expect(vuelta?.categoria).toBe('Entradas y picadas');
    expect(vuelta?.receta.titulo).toBe('Baba ganush');
    expect(vuelta?.receta.ingredientes).toBe(BABA.ingredientes);
    expect(vuelta?.receta.preparacion).toBe(BABA.preparacion);
    expect(vuelta?.receta.fuente).toBe(BABA.fuente);
  });

  it('tags y claves extra no viajan', async () => {
    const r = parse('---\ntitulo: A\ntags: [secreto]\nautor: yo\n---\n## Notas\nx');
    const carga = await codificar(r, '');
    const vuelta = await decodificar(carga);
    expect(vuelta?.receta.tags).toEqual([]);
    expect(vuelta?.receta.extras).toEqual({});
  });

  it('las fotos de Drive no viajan: ni la cabecera, ni la referencia, ni el depósito', async () => {
    const vuelta = await decodificar(await codificar(CON_FOTOS, 'Pescados'));
    expect(vuelta?.receta.foto).toBeNull();
    expect(vuelta?.receta.fotos).toEqual([{ n: 2, url: 'https://x/plato.jpg' }]);
    expect(vuelta?.receta.preparacion).not.toContain('drive.google.com');
    expect(vuelta?.receta.preparacion).not.toContain('Así queda');
  });

  it('las externas viajan **sin resolver**, como `foto:N` con su línea del depósito', async () => {
    // Resolverlas antes de mandarlas borraba las referencias, y del otro lado
    // toda foto parecía sin uso: el carrusel del invitado las repetía.
    const portadaExterna = parse(`---\ntitulo: A\nfoto: foto:2\n---\n\n## Preparación\n1. Servir. ![](foto:2)\n\n## Fotos\n- 2: https://x/plato.jpg\n`);
    const vuelta = await decodificar(await codificar(portadaExterna, ''));
    expect(vuelta?.receta.foto).toBe('foto:2');
    expect(vuelta?.receta.preparacion).toContain('![](foto:2)');
    expect(vuelta?.receta.fotos).toEqual([{ n: 2, url: 'https://x/plato.jpg' }]);
  });

  it('la URL de una foto usada viaja una sola vez: en su línea, no repetida en el texto', async () => {
    const r = parse('---\ntitulo: A\nfoto: foto:1\n---\n\n## Preparación\n1. Servir. ![](foto:1)\n\n## Fotos\n- 1: https://x/plato.jpg\n');
    const vuelta = await decodificar(await codificar(r, ''));
    const md = [vuelta?.receta.foto, vuelta?.receta.preparacion].join('\n');
    expect(md).not.toContain('https://x/plato.jpg');
  });

  it('empieza con la versión y usa sólo caracteres de URL', async () => {
    const carga = await codificar(BABA, 'Entradas y picadas');
    expect(carga).toMatch(/^1[A-Za-z0-9_-]+$/);
    expect(urlDeLink(carga, 'https://alelarre.github.io/recetario/').length).toBeLessThan(2200);
  });

  it('arma la URL de la vista de invitado', () => {
    expect(urlDeLink('1abc', 'https://h/recetario/')).toBe('https://h/recetario/#/ver?r=1abc');
  });

  it('una carga cortada, alterada, vacía, de otra versión o que no es texto es null', async () => {
    const carga = await codificar(BABA, 'Entradas y picadas');
    expect(await decodificar(carga.slice(0, -12))).toBeNull();
    expect(await decodificar(carga.slice(0, 20) + 'zz' + carga.slice(22))).toBeNull();
    expect(await decodificar('')).toBeNull();
    expect(await decodificar('2' + carga.slice(1))).toBeNull();
    expect(await decodificar(null)).toBeNull();
    expect(await decodificar('1!!!')).toBeNull();
  });
});
