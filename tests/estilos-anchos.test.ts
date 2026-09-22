// Lo que no se puede pasar de ancho ni de alto: la fila de ingredientes (P56)
// y las fichas al pie (P58). Las dos se ven sólo en el teléfono —una palabra
// larga estirando la pantalla, una ficha más alta que la ventana—, así que las
// decisiones quedan acá para que no se borren en silencio.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');
const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

/** El cuerpo de una regla, por su selector exacto. */
const regla = (css: string, selector: string): string =>
  css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('la fila de ingredientes corta en vez de estirarse (P56)', () => {
  it('el nombre puede achicarse, y la palabra que no entra se parte', () => {
    // Sin `min-width: 0` un ítem flex no baja del ancho mínimo de su
    // contenido: una palabra sin espacios —o una URL— estira la fila entera.
    const n = regla(TOKENS, '.ing .n');
    expect(n).toContain('min-width: 0');
    expect(n).toContain('overflow-wrap: break-word');
  });

  it('la cantidad tampoco se sale: la que sola no entra en la fila se corta', () => {
    const c = regla(TOKENS, '.ing .c');
    expect(c).toContain('min-width: 0');
    expect(c).toContain('overflow-wrap: break-word');
    // `nowrap` la dejaba salirse de la pantalla; el ancho natural se lo
    // garantiza el nombre en `flex: 1` desde cero, no el `white-space`.
    expect(c).not.toContain('nowrap');
  });

  it('la cantidad sigue alineada a la derecha y en cifras tabulares (§6.11)', () => {
    const c = regla(TOKENS, '.ing .c');
    expect(c).toContain('text-align: right');
    expect(c).toContain('font-variant-numeric: tabular-nums');
  });
});

describe('las fichas al pie se miden contra la ventana chica (P58)', () => {
  // En Android `vh` mide la ventana sin la barra de direcciones: una ficha
  // calculada así puede quedar más alta que lo que se ve, y cortada arriba
  // —la página está trabada, no hay forma de llegar—. `vh` va de respaldo,
  // para el navegador que no tenga `svh`.
  it('la de compartir: tope y desplazamiento propios', () => {
    const hoja = regla(BASE, '.hoja-compartir');
    expect(hoja).toContain('max-height: 100vh; max-height: 100svh;');
    expect(hoja).toContain('overflow: auto');
  });

  it('el cuadro del texto adentro, también', () => {
    expect(regla(BASE, '.hoja-compartir .copia')).toContain('max-height: 40vh; max-height: 40svh;');
  });

  it('la de fotos del editor, igual', () => {
    expect(regla(TOKENS, '.hoja-foto')).toContain('max-height: 80vh; max-height: 80svh;');
  });

  it('el `env(safe-area-inset-bottom)` de la ficha sólo vale con viewport-fit=cover', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(BASE).toContain('env(safe-area-inset-bottom)');
    expect(html).toContain('viewport-fit=cover');
  });
});
