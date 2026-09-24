// Lo que no se puede pasar de ancho ni de alto: la fila de ingredientes
// y las fichas al pie. Las dos se ven sólo en el teléfono —una palabra
// larga estirando la pantalla, una ficha más alta que la ventana—, así que las
// decisiones quedan acá para que no se borren en silencio.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');
const BASE = readFileSync(new URL('../src/ui/base.css', import.meta.url), 'utf8');

/** El cuerpo de una regla, por su selector exacto. */
const regla = (css: string, selector: string): string =>
  css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('la fila de ingredientes corta en vez de estirarse', () => {
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

describe('las fichas al pie se miden contra la ventana chica', () => {
  // En Android `vh` mide la ventana sin la barra de direcciones: una ficha
  // calculada así puede quedar más alta que lo que se ve, y cortada arriba
  // —la página está trabada, no hay forma de llegar—.
  it('la de compartir se topa en el alto de la ventana', () => {
    expect(regla(BASE, '.hoja-compartir')).toContain('max-height: 100svh;');
  });

  it('el cuadro del texto adentro, en el 40 % (§6.23)', () => {
    expect(regla(BASE, '.hoja-compartir .copia')).toContain('max-height: 40svh;');
  });

  it('la de fotos del editor, en el 80 %', () => {
    expect(regla(TOKENS, '.hoja-foto')).toContain('max-height: 80svh;');
  });

  it('ningún tope en `vh`: repetir la declaración no sirve, la minificación la borra', () => {
    // Medido en `dist/assets/index-*.css`: lightningcss descarta la
    // declaración duplicada y no queda ni un `vh`. Un navegador sin `svh`
    // —Chrome 105 a 107— se quedaría sin tope, peor que no topar nada. La app
    // ya depende de `:has()`, de la 105, y corre en un Chrome al día.
    for (const css of [BASE, TOKENS]) {
      expect(css.split('\n').filter(l => /max-height:[^;]*\dvh/.test(l))).toEqual([]);
    }
  });

  it('en la ficha de compartir se desplaza el cuadro, y sólo el cuadro', () => {
    // Dos contenedores de scroll anidados dejan el gesto de adentro sin mover
    // la ficha: el cuadro se achica cuando la ficha llega a su tope, así que
    // no hace falta que la ficha se desplace y *Listo* queda siempre a la vista.
    const hoja = regla(BASE, '.hoja-compartir');
    expect(hoja).not.toContain('overflow');
    const copia = regla(BASE, '.hoja-compartir .copia');
    expect(copia).toContain('overflow: auto');
    expect(copia).toContain('min-height: 0');
  });

  it('el `env(safe-area-inset-bottom)` de la ficha sólo vale con viewport-fit=cover', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(BASE).toContain('env(safe-area-inset-bottom)');
    expect(html).toContain('viewport-fit=cover');
  });
});

describe('el nombre de una fila de lista no estira la pantalla', () => {
  // Un nombre largo y sin espacios, sin recortarlo, desborda y la página queda
  // con scroll horizontal, y ahí Android se lleva el deslizamiento del menú
  // lateral antes que la página.
  it('se recorta como el de una receta en la lista', () => {
    const n = regla(BASE, '.bor .n');
    expect(n).toContain('overflow: hidden');
    expect(n).toContain('-webkit-line-clamp: 2');
    // Y una palabra sin espacios corta en vez de empujar el ancho.
    expect(n).toContain('overflow-wrap: anywhere');
  });

  it('el contenedor del texto puede achicarse', () => {
    expect(regla(BASE, '.bor .txt')).toContain('min-width: 0');
  });
});
