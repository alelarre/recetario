import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '../src/recipe.js';
import { documentoPdf } from '../src/pdf/documento.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));
const mm = (v: number) => v * 72 / 25.4;
type Nodo = Record<string, unknown>;
// `content` tipa como `Content`, cuyo union incluye variantes que no son
// array (además de `Content[]`): la aserción directa a `Nodo[]` no
// «sobrepone lo suficiente» para TS.
const contenido = (r = BABA) => documentoPdf(r, 'Entradas y picadas').content as unknown as Nodo[];
// `JSON.stringify(undefined)` es `undefined`, no la cadena "undefined": los
// nodos sin `stack` (la cabecera, que es una `table`) devuelven `undefined` en
// `n['stack']?.[0]`, y sin este resguardo el `.includes()` de quien llama
// explota.
const textoDe = (n: unknown): string => JSON.stringify(n) ?? '';

describe('el documento del PDF', () => {
  it('página de 105 × 180 mm con fondo en todas las páginas', () => {
    const d = documentoPdf(BABA, '');
    expect(d.pageSize).toEqual({ width: mm(105), height: mm(180) });
    expect(typeof d.background).toBe('function');
    expect(d.defaultStyle).toMatchObject({ font: 'Inter' });
  });

  it('empieza por la cabecera con título, contexto y fuente, y no lleva tags', () => {
    const [cabecera] = contenido();
    expect(textoDe(cabecera)).toContain('Baba ganush');
    expect(textoDe(cabecera)).toContain('Entradas y picadas · 6 porciones');
    expect(textoDe(cabecera)).toContain('cookieandkate.com/epic-baba-ganoush-recipe/');
    expect(textoDe(contenido())).not.toContain('vegetariano');
  });

  it('cada título de sección va junto a su primer ítem, en un bloque que no se parte', () => {
    for (const titulo of ['Ingredientes', 'Preparación', 'Variaciones', 'Notas']) {
      const bloque = contenido().find(n => textoDe((n['stack'] as unknown[] | undefined)?.[0]).includes(`"${titulo}"`));
      expect(bloque, titulo).toBeDefined();
      expect(bloque?.['unbreakable'], titulo).toBe(true);
      expect((bloque?.['stack'] as unknown[]).length, titulo).toBe(2);
    }
  });

  it('cada ingrediente y cada paso es un nodo que no se parte, y los pasos siguen la numeración', () => {
    const pasos = contenido().filter(n => 'ol' in n);
    expect(pasos.every(n => n['unbreakable'] === true)).toBe(true);
    expect(pasos.map(n => n['start'])).toEqual([2, 3, 4, 5, 6]);   // el 1 va con el título
    const ingredientes = contenido().filter(n => 'ul' in n && textoDe(n).includes('cucharad'));
    expect(ingredientes.length).toBeGreaterThan(0);
    expect(ingredientes.every(n => n['unbreakable'] === true)).toBe(true);
  });

  it('las fracciones llegan intactas', () => {
    expect(textoDe(contenido())).toContain('⅓ taza');
  });

  it('la negrita y la cantidad del ingrediente son tramos en negrita', () => {
    const r = parse('---\ntitulo: A\n---\n## Ingredientes\n- Calamar — 500 g\n## Preparación\n1. Batir **fuerte**.');
    const json = textoDe(contenido(r));
    expect(json).toContain('{"text":"fuerte","bold":true}');
    expect(json).toContain('"text":"  500 g","bold":true');
  });

  it('una sección vacía no se dibuja', () => {
    const r = parse('---\ntitulo: A\n---\n## Preparación\n1. Salar.');
    const json = textoDe(contenido(r));
    expect(json).not.toContain('"Ingredientes"');
    expect(json).not.toContain('"Notas"');
  });

  it('los tramos de preparación con subtítulo reinician la numeración', () => {
    const r = parse('---\ntitulo: A\n---\n## Preparación\n### Masa\n1. a\n2. b\n### Relleno\n1. c');
    const starts = (nodos: unknown[]): unknown[] => nodos.flatMap(n => {
      const o = n as Nodo;
      return 'ol' in o ? [o['start']] : 'stack' in o ? starts(o['stack'] as unknown[]) : [];
    });
    expect(starts(contenido(r))).toEqual([1, 2, 1]);
  });
});
