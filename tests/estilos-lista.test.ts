// La lista de recetas es sistema: la usan cinco pantallas, así que su CSS vive
// en tokens.css. Que una regla quede en base.css, o duplicada, no lo nota
// ningún otro test.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');
const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

/** El cuerpo de la regla cuyo selector es exactamente ese, al principio de una línea. */
const regla = (css: string, selector: string): string | undefined => {
  const escapado = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`^${escapado}\\s*\\{([^}]*)\\}`, 'm'))?.[1];
};

describe('la fila: la base de la tarjeta, la categoría en Ajustes y la carpeta', () => {
  it('vive en tokens.css, con el fondo, el borde y el ancho de toque', () => {
    const fila = regla(TOKENS, '.fila') ?? '';
    for (const d of ['display: flex', 'padding: var(--e-3)', 'background: var(--surface)',
      'border: 1px solid var(--borde)', 'border-radius: var(--r-ficha)', 'text-decoration: none']) {
      expect(fila).toContain(d);
    }
  });

  it('la tarjeta, la categoría y la carpeta no repiten la base', () => {
    expect(regla(TOKENS, '.tarjeta')).not.toContain('border');
    expect(regla(BASE, '.bor')).toBeUndefined();
    expect(regla(BASE, '.carp')).toBeUndefined();
  });
});

describe('la lista de recetas, en tokens.css', () => {
  for (const selector of ['.lista', '.rot', '.grupo-res + .grupo-res', '.tile', '.fila-dur .chip', '.orden', '.orden-seg']) {
    it(`${selector} está en tokens.css y no en base.css`, () => {
      expect(regla(TOKENS, selector)).toBeDefined();
      expect(regla(BASE, selector)).toBeUndefined();
    });
  }

  it('la fila de duraciones se alinea como el carrusel de tags: no tiene márgenes ni desplazamiento propios', () => {
    expect(regla(TOKENS, '.fila-dur')).toBeUndefined();
    expect(TOKENS).not.toContain('.fila-dur::-webkit-scrollbar');
  });

  it('no hay una regla .foto suelta: la foto de la tarjeta va adentro del placeholder', () => {
    expect(regla(TOKENS, '.foto')).toBeUndefined();
    expect(regla(TOKENS, '.ph .foto')).toBeDefined();
  });
});
