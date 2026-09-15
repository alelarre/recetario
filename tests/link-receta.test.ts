import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '../src/recipe.js';
import { codificar, decodificar, urlDeLink } from '../src/link-receta.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));

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
