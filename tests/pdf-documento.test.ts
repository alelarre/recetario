import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '../src/recipe.js';
import { documentoPdf } from '../src/pdf/documento.js';
import type { FotoDeReceta } from '../src/tipos.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));

/** Una receta ya resuelta, como la que arma `generar`: la cabecera y las referencias son URLs. */
const CON_FOTOS = parse(`---
titulo: Rabas
foto: https://x/portada.jpg
---

## Ingredientes
- Calamar — 500 g ![Fresco](https://x/otra.jpg)

## Preparación
1. Freír. ![Así queda](https://x/paso.jpg)

## Sobras
Al día siguiente, al horno.

## Fotos
- 1: https://x/portada.jpg
- 2: https://x/paso.jpg
- 3: https://x/otra.jpg
- 4: https://x/sin-mapa.jpg
- 5: https://x/suelta1.jpg
- 6: https://x/suelta2.jpg
- 7: https://x/suelta3.jpg
`);

const MAPA = new Map([
  ['https://x/portada.jpg', 'data:image/jpeg;base64,PORTADA'],
  ['https://x/paso.jpg', 'data:image/jpeg;base64,PASO'],
  ['https://x/otra.jpg', 'data:image/jpeg;base64,OTRA'],
  ['https://x/suelta1.jpg', 'data:image/jpeg;base64,SUELTA1'],
  ['https://x/suelta2.jpg', 'data:image/jpeg;base64,SUELTA2'],
  ['https://x/suelta3.jpg', 'data:image/jpeg;base64,SUELTA3']
]);

const mm = (v: number) => v * 72 / 25.4;
type Nodo = Record<string, unknown>;
// `content` tipa como `Content`, cuyo union incluye variantes que no son
// array (además de `Content[]`): la aserción directa a `Nodo[]` no
// «sobrepone lo suficiente» para TS.
const contenido = (r = BABA, imagenes = new Map<string, string>(), galeria: FotoDeReceta[] = []) =>
  documentoPdf(r, 'Entradas y picadas', imagenes, galeria).content as unknown as Nodo[];

/** Las sin uso de `CON_FOTOS`: la portada, el paso y el ingrediente ya se dibujan en su lugar. */
const SIN_USO: FotoDeReceta[] = [
  { n: 4, url: 'https://x/sin-mapa.jpg' }, { n: 5, url: 'https://x/suelta1.jpg' },
  { n: 6, url: 'https://x/suelta2.jpg' }, { n: 7, url: 'https://x/suelta3.jpg' }
];
// `JSON.stringify(undefined)` es `undefined`, no la cadena "undefined": los
// nodos sin `stack` (la cabecera, que es una `table`) devuelven `undefined` en
// `n['stack']?.[0]`, y sin este resguardo el `.includes()` de quien llama
// explota.
const textoDe = (n: unknown): string => JSON.stringify(n) ?? '';

describe('el documento del PDF', () => {
  it('página de 105 × 180 mm con fondo en todas las páginas', () => {
    const d = documentoPdf(BABA, '', new Map(), []);
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

  it('la cabecera va arriba del título, al ancho de la página y con el alto topado a 90 mm', () => {
    const nodos = contenido(CON_FOTOS, MAPA);
    expect(nodos[0]).toMatchObject({ image: 'data:image/jpeg;base64,PORTADA', fit: [mm(105) - 2 * mm(8), mm(90)] });
    expect(textoDe(nodos[1])).toContain('Rabas');
  });

  it('la foto de una línea va debajo de ella, con su epígrafe y en un bloque que no se parte', () => {
    // El primer paso viaja adentro del bloque del título de la sección.
    const bloque = contenido(CON_FOTOS, MAPA)
      .flatMap(n => ((n['stack'] as Nodo[] | undefined) ?? [n]))
      .find(n => textoDe(n).includes('Freír'));
    expect(bloque?.['unbreakable']).toBe(true);
    const pila = bloque?.['stack'] as Nodo[];
    expect('ol' in (pila[0] as Nodo)).toBe(true);
    expect(pila[1]).toMatchObject({ image: 'data:image/jpeg;base64,PASO' });
    expect(textoDe(pila[2])).toContain('Así queda');
    // La URL no se escribe como texto: la foto está dibujada.
    expect(textoDe(bloque)).not.toContain('https://x/paso.jpg');
  });

  it('la foto de un ingrediente va debajo de su línea, en el mismo bloque que no se parte', () => {
    const bloque = contenido(CON_FOTOS, MAPA)
      .flatMap(n => ((n['stack'] as Nodo[] | undefined) ?? [n]))
      .find(n => textoDe(n).includes('Calamar'));
    expect(bloque?.['unbreakable']).toBe(true);
    const pila = bloque?.['stack'] as Nodo[];
    expect('ul' in (pila[0] as Nodo)).toBe(true);
    expect(textoDe(pila[0])).toContain('500 g');
    expect(pila[1]).toMatchObject({ image: 'data:image/jpeg;base64,OTRA' });
    expect(textoDe(pila[2])).toContain('Fresco');
    expect(textoDe(bloque)).not.toContain('https://x/otra.jpg');
  });

  it('la galería va antes de las secciones ajenas, de a dos por fila', () => {
    const nodos = contenido(CON_FOTOS, MAPA, SIN_USO);
    const indiceDe = (t: string) =>
      nodos.findIndex(n => textoDe((n['stack'] as unknown[] | undefined)?.[0]).includes(`"${t}"`));
    const titulo = indiceDe('Fotos');
    expect(titulo).toBeGreaterThan(0);
    // Como en la pantalla: la ficha Fotos va después de Notas y antes de las ajenas.
    expect(titulo).toBeLessThan(indiceDe('Sobras'));
    const filas = nodos.slice(titulo).flatMap(n =>
      'columns' in n ? [n] : ((n['stack'] as Nodo[] | undefined) ?? []).filter(x => 'columns' in x));
    expect(filas).toHaveLength(2);
    expect((filas[0]?.['columns'] as unknown[]).length).toBe(2);
    expect((filas[1]?.['columns'] as unknown[]).length).toBe(1);
  });

  it('la galería lleva sólo las sin uso: la portada y las de una línea no se repiten', () => {
    const json = textoDe(contenido(CON_FOTOS, MAPA, SIN_USO));
    const veces = (s: string) => json.split(s).length - 1;
    // La portada, el paso y el ingrediente se dibujan una sola vez, en su lugar.
    expect(veces('base64,PORTADA')).toBe(1);
    expect(veces('base64,PASO')).toBe(1);
    expect(veces('base64,OTRA')).toBe(1);
    expect(veces('base64,SUELTA1')).toBe(1);
  });

  it('sin ninguna sin uso, la sección Fotos no se dibuja', () => {
    expect(textoDe(contenido(CON_FOTOS, MAPA, []))).not.toContain('"Fotos"');
  });

  it('una URL sin data URL no se dibuja', () => {
    const json = textoDe(contenido(CON_FOTOS, MAPA, SIN_USO));
    expect(json).not.toContain('sin-mapa');
    expect(textoDe(contenido(CON_FOTOS, new Map(), SIN_USO))).not.toContain('"image"');
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
