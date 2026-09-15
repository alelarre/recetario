# Compartir recetas — plan de implementación (P23)

> **Para agentes:** SUB-SKILL REQUERIDO: superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** compartir una receta como PDF, como link a una vista de invitado sin login, o como texto, desde un ícono en la receta.

**Arquitectura:** un parser de markdown con tres salidas (HTML, PDF, texto); piezas de presentación y de control del modo cocina extraídas para que las usen la app y el invitado; pdfmake cargado con `import()`; una entrada nueva (`inicio.ts`) que decide entre la app y el invitado antes de cargar nada de la app.

**Stack:** TypeScript estricto + Vite, sin framework; Vitest en `environment: 'node'` con DOM falso; `pdfmake` 0.3.11.

**Spec:** `docs/superpowers/specs/2026-09-14-compartir-recetas-design.md`

## Restricciones globales

- **Un único commit al final** (Tarea 12), después de que el usuario revise el diff. Ninguna tarea commitea.
- Todo en español rioplatense: código, comentarios, UI, tests.
- `npm test`, `npm run typecheck` y `npm run build` en verde antes del commit.
- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` (los imports de tipos van con `import type`).
- Los tests corren en Node sin jsdom: nada de `instanceof Element` ni globales del navegador sin preguntar antes.
- Todo texto que venga de un `.md` pasa por `escapar()` al emitirse como HTML.
- Página del PDF: 105 × 180 mm, márgenes de 8 mm, fondo `#17140F`. Cuerpo 6,25 pt, título 9,4 pt, sección 7 pt, contexto y fuente 5,5 pt.
- Link: `<origen><BASE_URL>#/ver?r=1<base64url>`; carga `JSON.stringify({ c, md })` con `deflate-raw`.
- Acciones del invitado, lista cerrada: `cocinar`, `volver-receta`, `conmutar`, `paso`, `wake`.

## Mapa de archivos

| Archivo | Qué |
|---|---|
| `src/pdf/fuentes/Inter-Regular.ttf`, `Inter-SemiBold.ttf`, `Inter-Italic.ttf`, `OFL.txt` | Nuevos: fuentes recortadas |
| `package.json` | `pdfmake`, `@types/pdfmake` |
| `src/ui/markdown.ts` | Parser + `aHtml`, `aTexto`, `aPdf`, `tramosDeFuente` |
| `src/recipe.ts` | `contextoDe` |
| `src/texto-receta.ts` | Nuevo: `textoReceta` |
| `src/link-receta.ts` | Nuevo: `codificar`, `decodificar`, `urlDeLink` |
| `src/pdf/documento.ts` | Nuevo: `documentoPdf` |
| `src/pdf/generar.ts` | Nuevo: `precargar`, `generar` |
| `src/compartir.ts` | Nuevo: `compartirPdf`, `compartirLink`, `compartirTexto`, `plataformaDelNavegador` |
| `src/ui/pintar.ts` | Nuevo: `pintar`, `conClosest` (salen de `main.ts`) |
| `src/cocina-control.ts` | Nuevo: estado del modo cocina y pantalla encendida (sale de `main.ts`) |
| `src/ui/fichas-receta.ts` | Nuevo: piezas de la receta (salen de `receta.ts`) |
| `src/ui/cocina.ts` | `salidas` obligatorio |
| `src/ui/receta.ts` | Compone con `fichas-receta`; ícono y ficha de compartir |
| `src/ui/compartir.ts` | Nuevo: `renderFichaCompartir` |
| `src/ui/iconos.ts` | `ICO.compartir` |
| `src/ui/base.css` | Estilos de la ficha de compartir |
| `src/main.ts` | Usa las extracciones; cablea compartir; sin CSS |
| `src/ui/router.ts` | `rutaDeInvitado`, `esHashDeInvitado` |
| `src/ui/invitado.ts` | Nuevo: `renderInvitado`, `renderLinkRoto` |
| `src/invitado.ts` | Nuevo: controlador del invitado |
| `src/inicio.ts` | Nuevo: entrada |
| `index.html` | Carga `inicio.ts` |
| `tests/fixtures/baba-ganush.md` | Nuevo: receta real para tests |
| Docs | `BACKLOG.md` P23, `design-system.md` §3.4, `CLAUDE.md` |

---

### Tarea 1: Fuentes y dependencia

**Archivos:**
- Crear: `src/pdf/fuentes/Inter-Regular.ttf`, `src/pdf/fuentes/Inter-SemiBold.ttf`, `src/pdf/fuentes/Inter-Italic.ttf`, `src/pdf/fuentes/OFL.txt`
- Modificar: `package.json`, `package-lock.json`
- Crear: `tests/fixtures/baba-ganush.md`

- [ ] **Paso 1: Instalar dependencias**

```bash
npm install pdfmake@0.3.11 && npm install -D @types/pdfmake
```

- [ ] **Paso 2: Bajar las TTF de Inter**

```bash
mkdir -p /tmp/inter src/pdf/fuentes
curl -s 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;1,400' > /tmp/inter/css
# El CSS trae, en este orden: italic 400, normal 400, normal 600.
grep -o 'https://[^)]*\.ttf' /tmp/inter/css | sed -n 1p | xargs curl -s -o /tmp/inter/italic.ttf
grep -o 'https://[^)]*\.ttf' /tmp/inter/css | sed -n 2p | xargs curl -s -o /tmp/inter/regular.ttf
grep -o 'https://[^)]*\.ttf' /tmp/inter/css | sed -n 3p | xargs curl -s -o /tmp/inter/semibold.ttf
grep -B2 'ttf' /tmp/inter/css | grep -E 'style|weight'   # verificar el orden
curl -sL https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt -o src/pdf/fuentes/OFL.txt
```

Esperado: el `grep -B2` muestra `italic / 400`, `normal / 400`, `normal / 600` en ese orden. Si el orden es otro, reasignar los tres archivos.

- [ ] **Paso 3: Recortar**

```bash
U='U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20AC,U+2150-215E'
for par in regular:Inter-Regular italic:Inter-Italic semibold:Inter-SemiBold; do
  uvx --from fonttools pyftsubset "/tmp/inter/${par%%:*}.ttf" --unicodes="$U" \
    --layout-features='*' --output-file="src/pdf/fuentes/${par##*:}.ttf"
done
ls -la src/pdf/fuentes
```

Esperado: tres `.ttf` de entre 20 y 45 KB, más `OFL.txt`.

- [ ] **Paso 4: Fixture**

```bash
mkdir -p tests/fixtures
base64 -d -i /private/tmp/claude-501/-Users-alelarre-Documents-recetario/ec549a2a-089a-47de-af55-2c4ba4622a8c/scratchpad/b2/baba.b64 -o tests/fixtures/baba-ganush.md
head -8 tests/fixtures/baba-ganush.md
```

Esperado: empieza con `---` / `titulo: Baba ganush`. Si el scratchpad ya no existe, bajar el archivo `baba-ganush.md` (id `12vVi1mOnnh6eKkKqetv1GynIISMMntHR`) con el conector de Drive.

---

### Tarea 2: Parser de markdown con tres salidas

**Archivos:**
- Modificar: `src/ui/markdown.ts` (reescribir entero)
- Test: `tests/markdown.test.ts` (sumar al final; no tocar los existentes)

**Interfaces:**
- Produce:
  - `interface TramoEnLinea { texto: string; negrita?: true; italica?: true; link?: string; imagen?: string }`
  - `type Bloque = { tipo: 'parrafo' | 'subtitulo'; tramos: TramoEnLinea[] } | { tipo: 'lista' | 'numerada'; items: TramoEnLinea[][] }`
  - `tramosEnLinea(texto: unknown): TramoEnLinea[]`, `bloques(texto: unknown): Bloque[]`
  - `tramosAHtml(t): string`, `tramosATexto(t): string`, `tramosAPdf(t): ContentText[]`
  - `aHtml(texto, { pasos? }): string` (misma firma que hoy), `aTexto(texto): string`, `aPdf(texto): Content[]`
  - `tramosDeFuente(fuente: string): TramoEnLinea[]`

- [ ] **Paso 1: Tests nuevos** — agregar al final de `tests/markdown.test.ts`, y sumar al import `aTexto, aPdf, tramosEnLinea, tramosDeFuente`:

```ts
describe('tramosEnLinea', () => {
  it('negrita, itálica, link e imagen como tramos', () => {
    expect(tramosEnLinea('a **b** *c* [d](https://x.com) ![](https://y.com/i.png)')).toEqual([
      { texto: 'a ' }, { texto: 'b', negrita: true }, { texto: ' ' }, { texto: 'c', italica: true },
      { texto: ' ' }, { texto: 'd', link: 'https://x.com' }, { texto: ' ' }, { texto: '', imagen: 'https://y.com/i.png' }
    ]);
  });
  it('un link adentro de negrita conserva las dos cosas', () => {
    expect(tramosEnLinea('**ver [x](https://x.com)**')).toEqual([
      { texto: 'ver ', negrita: true }, { texto: 'x', link: 'https://x.com', negrita: true }
    ]);
  });
  it('un destino inseguro queda como texto', () => {
    expect(tramosEnLinea('[a](javascript:alert(1))')).toEqual([{ texto: '[a](javascript:alert(1)' }, { texto: ')' }]);
  });
});

describe('tramosDeFuente', () => {
  it('URL pelada: link con el sitio a la vista', () => {
    expect(tramosDeFuente('https://cookpad.com/r/1')).toEqual([{ texto: 'cookpad.com/r/1', link: 'https://cookpad.com/r/1' }]);
  });
  it('link markdown entre comillas', () => {
    expect(tramosDeFuente('"[Paladar](https://p.com/x)"')).toEqual([{ texto: 'Paladar', link: 'https://p.com/x' }]);
  });
  it('texto libre, sin formato', () => {
    expect(tramosDeFuente('libro *viejo*, pág. 84')).toEqual([{ texto: 'libro *viejo*, pág. 84' }]);
  });
});

describe('aTexto', () => {
  it('negrita a *, itálica a _, listas tal cual', () => {
    expect(aTexto('Batir **fuerte** y *suave*.\n\n- sal\n- pimienta\n\n1. Uno\n2. Dos'))
      .toBe('Batir *fuerte* y _suave_.\n\n- sal\n- pimienta\n\n1. Uno\n2. Dos');
  });
  it('el subtítulo va pegado a lo que sigue, sin #', () => {
    expect(aTexto('### Más liviana\nBajar el aceite.\n\n### Otra\n- a')).toBe('Más liviana\nBajar el aceite.\n\nOtra\n- a');
  });
  it('link como texto (url); si el texto es la URL, sólo la URL; imagen como URL', () => {
    expect(aTexto('[Paladar](https://p.com) https://q.com ![](https://i.com/a.png)'))
      .toBe('Paladar (https://p.com) https://q.com https://i.com/a.png');
    expect(aTexto('[https://p.com](https://p.com)')).toBe('https://p.com');
  });
  it('la numeración vuelve a empezar en cada lista', () => {
    expect(aTexto('### A\n1. x\n2. y\n### B\n1. z')).toBe('A\n1. x\n2. y\n\nB\n1. z');
  });
  it('vacío es vacío', () => { expect(aTexto('')).toBe(''); });
});

describe('aPdf', () => {
  it('un nodo por ítem, que no se parte, con la numeración de su lista', () => {
    const nodos = aPdf('- sal\n- ajo\n\n1. Uno\n2. **Dos**');
    expect(nodos).toHaveLength(4);
    expect(nodos[0]).toEqual({ ul: [{ text: [{ text: 'sal' }] }], style: 'lista', unbreakable: true });
    expect(nodos[3]).toEqual({ ol: [{ text: [{ text: 'Dos', bold: true }] }], start: 2, style: 'lista', unbreakable: true });
  });
  it('párrafo y subtítulo con su estilo; links con el estilo link', () => {
    expect(aPdf('### Sub\nVer [acá](https://x.com).')).toEqual([
      { text: [{ text: 'Sub' }], style: 'subtitulo' },
      { text: [{ text: 'Ver ' }, { text: 'acá', link: 'https://x.com', style: 'link' }, { text: '.' }], style: 'parrafo', unbreakable: true }
    ]);
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/markdown.test.ts`
Esperado: FAIL (`aTexto` no es una función / no se exporta).

- [ ] **Paso 3: Reescribir `src/ui/markdown.ts`**

```ts
import type { Content, ContentText } from 'pdfmake/interfaces';

export function escapar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sólo `http:`, `https:` y rutas relativas. Todo lo demás —`javascript:` el
 * primero— no se emite como destino: los `.md` los escribe cualquiera.
 */
export const esDestinoSeguro = (url: string): boolean =>
  /^(https?:\/\/|\/|\.\.?\/)/i.test(url);

/** Un pedazo de texto en línea con su formato. Lo leen las tres salidas: HTML, texto y PDF. */
export interface TramoEnLinea {
  texto: string;
  negrita?: true;
  italica?: true;
  /** El destino de un link, ya validado. */
  link?: string;
  /** El destino de una imagen, ya validado; `texto` queda vacío. */
  imagen?: string;
}

export type Bloque =
  | { tipo: 'parrafo' | 'subtitulo'; tramos: TramoEnLinea[] }
  | { tipo: 'lista' | 'numerada'; items: TramoEnLinea[][] };

type BloqueLista = Extract<Bloque, { items: unknown }>;

// Imagen, link, negrita, itálica: en cada posición gana el primero que calza, y
// adentro de la negrita y la itálica se vuelve a buscar. Nota: URLs con
// paréntesis anidados (ej: alert(1)) se truncan en el primer ), limitación conocida.
const EN_LINEA = /!\[[^\]]*\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;

function enLinea(fuente: string, formato: Pick<TramoEnLinea, 'negrita' | 'italica'>): TramoEnLinea[] {
  const salida: TramoEnLinea[] = [];
  const suelto = (texto: string): void => { if (texto) salida.push({ texto, ...formato }); };
  let desde = 0;
  for (const m of fuente.matchAll(EN_LINEA)) {
    const inicio = m.index ?? 0;
    suelto(fuente.slice(desde, inicio));
    desde = inicio + m[0].length;
    const [entero, imagen, textoLink, destino, negrita, italica] = m;
    if (imagen !== undefined) {
      if (esDestinoSeguro(imagen)) salida.push({ texto: '', imagen, ...formato });
      else suelto(entero);
    } else if (textoLink !== undefined && destino !== undefined) {
      if (esDestinoSeguro(destino)) salida.push({ texto: textoLink, link: destino, ...formato });
      else suelto(entero);
    } else if (negrita !== undefined) {
      salida.push(...enLinea(negrita, { ...formato, negrita: true }));
    } else if (italica !== undefined) {
      salida.push(...enLinea(italica, { ...formato, italica: true }));
    }
  }
  suelto(fuente.slice(desde));
  return salida;
}

export const tramosEnLinea = (texto: unknown): TramoEnLinea[] => enLinea(String(texto ?? ''), {});

/** Los bloques de un texto: párrafos, `###`, listas con guion y listas numeradas. */
export function bloques(texto: unknown): Bloque[] {
  const salida: Bloque[] = [];
  let parrafo: string[] = [];
  let lista: BloqueLista | null = null;

  const cerrarParrafo = (): void => {
    if (parrafo.length) salida.push({ tipo: 'parrafo', tramos: tramosEnLinea(parrafo.join(' ')) });
    parrafo = [];
  };
  const item = (tipo: BloqueLista['tipo'], contenido: string): void => {
    cerrarParrafo();
    let actual = lista;
    if (!actual || actual.tipo !== tipo) {
      actual = { tipo, items: [] };
      salida.push(actual);
      lista = actual;
    }
    actual.items.push(tramosEnLinea(contenido));
  };

  for (const linea of String(texto ?? '').split('\n')) {
    const h3 = linea.match(/^###\s+(.*)$/);
    const vineta = linea.match(/^\s*[-*]\s+(.*)$/);
    const num = linea.match(/^\s*\d+[.)]\s+(.*)$/);

    if (h3) { cerrarParrafo(); lista = null; salida.push({ tipo: 'subtitulo', tramos: tramosEnLinea(h3[1]) }); continue; }
    if (vineta) { item('lista', vineta[1] ?? ''); continue; }
    if (num) { item('numerada', num[1] ?? ''); continue; }
    if (!linea.trim()) { cerrarParrafo(); lista = null; continue; }
    lista = null;
    parrafo.push(linea.trim());
  }
  cerrarParrafo();
  return salida;
}

export function tramosAHtml(tramos: TramoEnLinea[]): string {
  return tramos.map(t => {
    if (t.imagen) return `<img src="${escapar(t.imagen)}" alt="" loading="lazy">`;
    let html = escapar(t.texto);
    if (t.link) html = `<a href="${escapar(t.link)}" target="_blank" rel="noopener">${html}</a>`;
    if (t.italica) html = `<em>${html}</em>`;
    if (t.negrita) html = `<strong>${html}</strong>`;
    return html;
  }).join('');
}

/** `pasos` convierte la <ol> en la lista tildable del detalle (§7.2). */
export function aHtml(texto: unknown, { pasos = false }: { pasos?: boolean } = {}): string {
  return bloques(texto).map(b => {
    if (b.tipo === 'parrafo') return `<p>${tramosAHtml(b.tramos)}</p>`;
    if (b.tipo === 'subtitulo') return `<h3>${tramosAHtml(b.tramos)}</h3>`;
    if (b.tipo === 'lista') return `<ul>${b.items.map(i => `<li>${tramosAHtml(i)}</li>`).join('')}</ul>`;
    // La clase va acá y no en quien llama: con `pasos` esta misma <ol> es la
    // lista de pasos tildables del detalle, y el CSS la necesita para numerar.
    return pasos
      ? '<ol class="pasos">' + b.items.map(i =>
          `<li class="paso"><button class="check" aria-pressed="false" aria-label="Marcar paso"></button><span>${tramosAHtml(i)}</span></li>`
        ).join('') + '</ol>'
      : `<ol>${b.items.map(i => `<li>${tramosAHtml(i)}</li>`).join('')}</ol>`;
  }).join('');
}

const sinEsquema = (url: string): string => url.replace(/^https?:\/\//i, '');

/**
 * El texto para mandar por otra app: conserva lo que WhatsApp entiende como
 * formato —`*negrita*`, `_itálica_`— y saca la marca de links e imágenes.
 */
export function tramosATexto(tramos: TramoEnLinea[]): string {
  return tramos.map(t => {
    if (t.imagen) return t.imagen;
    let s = t.link
      ? (sinEsquema(t.link) === sinEsquema(t.texto) ? t.link : `${t.texto} (${t.link})`)
      : t.texto;
    if (t.italica) s = `_${s}_`;
    if (t.negrita) s = `*${s}*`;
    return s;
  }).join('');
}

/** Bloques separados por un renglón en blanco; lo que sigue a un `###` va pegado. */
export function aTexto(texto: unknown): string {
  const partes: string[] = [];
  let pegado = false;
  for (const b of bloques(texto)) {
    const s = b.tipo === 'lista' ? b.items.map(i => `- ${tramosATexto(i)}`).join('\n')
      : b.tipo === 'numerada' ? b.items.map((i, n) => `${n + 1}. ${tramosATexto(i)}`).join('\n')
      : tramosATexto(b.tramos);
    partes.push((partes.length && !pegado ? '\n' : '') + s);
    pegado = b.tipo === 'subtitulo';
  }
  return partes.join('\n');
}

/** Los tramos como texto de pdfmake. Los estilos (`link`) los define el documento. */
export function tramosAPdf(tramos: TramoEnLinea[]): ContentText[] {
  return tramos.map(t => {
    const destino = t.link ?? t.imagen;
    return {
      text: t.imagen ?? t.texto,
      ...(t.negrita ? { bold: true } : {}),
      ...(t.italica ? { italics: true } : {}),
      ...(destino ? { link: destino, style: 'link' } : {})
    };
  });
}

/**
 * Un nodo por párrafo y por ítem, para que el documento pueda juntar un título
 * con lo primero que le sigue. Ningún ítem se parte entre páginas.
 */
export function aPdf(texto: unknown): Content[] {
  const nodos: Content[] = [];
  for (const b of bloques(texto)) {
    if (b.tipo === 'subtitulo') nodos.push({ text: tramosAPdf(b.tramos), style: 'subtitulo' });
    else if (b.tipo === 'parrafo') nodos.push({ text: tramosAPdf(b.tramos), style: 'parrafo', unbreakable: true });
    else if (b.tipo === 'lista') for (const i of b.items) nodos.push({ ul: [{ text: tramosAPdf(i) }], style: 'lista', unbreakable: true });
    else b.items.forEach((i, n) => nodos.push({ ol: [{ text: tramosAPdf(i) }], start: n + 1, style: 'lista', unbreakable: true }));
  }
  return nodos;
}

/**
 * La fuente es texto libre: una URL pelada, un link markdown, o «libro de
 * pescados, pág. 84». Las dos primeras son link; de la URL pelada se muestra el
 * sitio y no el esquema, que no informa nada. El texto libre va tal cual.
 */
export function tramosDeFuente(fuente: string): TramoEnLinea[] {
  // El parser del frontmatter deja el valor tal cual, comillas incluidas.
  const limpia = fuente.trim().replace(/^["'](.*)["']$/, '$1').trim();
  const md = limpia.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (md?.[1] && md[2] && esDestinoSeguro(md[2])) return [{ texto: md[1], link: md[2] }];
  if (/^https?:\/\/\S+$/i.test(limpia)) return [{ texto: sinEsquema(limpia), link: limpia }];
  return limpia ? [{ texto: limpia }] : [];
}
```

Nota: la primera prueba de `aPdf` espera `{ ul: [...], style, unbreakable }` y la de `{ ol, start, ... }`; el orden de claves no importa en `toEqual`.

- [ ] **Paso 4: Correr los tests de markdown**

Run: `npx vitest run tests/markdown.test.ts`
Esperado: PASS, incluidos todos los tests anteriores de `aHtml` sin cambios.

- [ ] **Paso 5: Correr toda la suite y typecheck**

Run: `npm test && npm run typecheck`
Esperado: todo verde. Si `typecheck` marca `ForbidOtherElementProperties` en `aPdf`, revisar que ningún nodo mezcle `text` con `ul`/`ol`.

---

### Tarea 3: `contextoDe` y el texto de la receta

**Archivos:**
- Modificar: `src/recipe.ts` (agregar al final)
- Crear: `src/texto-receta.ts`
- Test: `tests/texto-receta.test.ts`

**Interfaces:**
- Consume: `aTexto`, `tramosATexto`, `tramosDeFuente` (Tarea 2).
- Produce: `contextoDe(receta: Receta, categoria: string): string` en `src/recipe.ts`; `textoReceta(receta: Receta, categoria: string): string`.

- [ ] **Paso 1: Test**

```ts
// tests/texto-receta.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse, contextoDe } from '../src/recipe.js';
import { textoReceta } from '../src/texto-receta.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));

describe('contextoDe', () => {
  it('categoría, rinde, tiempo y dificultad, lo que haya', () => {
    expect(contextoDe(BABA, 'Entradas y picadas')).toBe('Entradas y picadas · 6 porciones (unas 1¾ tazas) · 55 min · fácil');
    expect(contextoDe(parse('---\ntitulo: A\n---\n'), '')).toBe('');
  });
});

describe('textoReceta', () => {
  it('una receta chica, entera', () => {
    const r = parse(`---
titulo: Rabas
tags: [fritura]
rinde: 4 porciones
fuente: "[Paladar](https://p.com/rabas)"
completa: sí
---

Una entrada **clásica**.

## Ingredientes
- Calamar — 500 g
- Sal

## Preparación
1. Lavar.
2. Freír *bien*.

## Notas
Ojo con el aceite.
`);
    expect(textoReceta(r, 'Pescados')).toBe(
`Rabas
Pescados · 4 porciones

Una entrada *clásica*.

Ingredientes
- Calamar — 500 g
- Sal

Preparación
1. Lavar.
2. Freír _bien_.

Notas
Ojo con el aceite.

Fuente: Paladar (https://p.com/rabas)`);
  });

  it('el baba ganush: secciones, subtítulos y fuente al final, sin tags', () => {
    const t = textoReceta(BABA, 'Entradas y picadas');
    expect(t.startsWith('Baba ganush\nEntradas y picadas · 6 porciones')).toBe(true);
    expect(t).toContain('\n\nIngredientes\n- 900 g de berenjenas italianas (2 chicas o medianas)\n');
    expect(t).toContain('\n\nPreparación\n1. Precalentar el horno a 230 °C');
    expect(t).toContain('\n\nVariaciones\nMás liviana\nBajar el aceite de oliva');
    expect(t).toContain('\n\nNotas\n- Elegir dos berenjenas chicas');
    expect(t.endsWith('\n\nFuente: https://cookieandkate.com/epic-baba-ganoush-recipe/')).toBe(true);
    expect(t).not.toContain('vegetariano');
    expect(t).not.toContain('completa');
    expect(t).not.toContain('\n\n\n');
    expect(t).not.toContain('#');
  });

  it('una sección vacía no aparece', () => {
    expect(textoReceta(parse('---\ntitulo: A\n---\n## Notas\n'), '')).toBe('A');
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/texto-receta.test.ts`
Esperado: FAIL (no existe `contextoDe` ni `texto-receta.js`).

- [ ] **Paso 3: `contextoDe` al final de `src/recipe.ts`**

```ts
/** La línea de contexto de una receta: lo que la ubica sin abrirla. La categoría sale de la carpeta. */
export function contextoDe(receta: Receta, categoria: string): string {
  return [categoria, receta.rinde, receta.tiempo, receta.dificultad].filter(Boolean).join(' · ');
}
```

(Si `Receta` no está importado como tipo en `recipe.ts`, ya lo está: lo usan `serialize` y `sePuedeTerminar`.)

- [ ] **Paso 4: `src/texto-receta.ts`**

```ts
/**
 * La receta como texto, para el menú Compartir (spec §6). Casi el `.md`: sin
 * frontmatter, sin `#`, con la negrita y la itálica que WhatsApp entiende.
 */
import { aTexto, tramosATexto, tramosDeFuente } from './ui/markdown.js';
import { contextoDe } from './recipe.js';
import type { Receta } from './tipos.js';

const SECCIONES = [
  ['ingredientes', 'Ingredientes'],
  ['preparacion', 'Preparación'],
  ['variaciones', 'Variaciones'],
  ['notas', 'Notas']
] as const;

export function textoReceta(receta: Receta, categoria: string): string {
  const partes: string[] = [[receta.titulo ?? 'Sin título', contextoDe(receta, categoria)].filter(Boolean).join('\n')];
  const descripcion = aTexto(receta.descripcion);
  if (descripcion) partes.push(descripcion);
  for (const [clave, nombre] of SECCIONES) {
    const cuerpo = aTexto(receta[clave]);
    if (cuerpo) partes.push(`${nombre}\n${cuerpo}`);
  }
  for (const otra of receta.otras) {
    const cuerpo = aTexto(otra.cuerpo);
    if (cuerpo) partes.push(`${otra.encabezado}\n${cuerpo}`);
  }
  const fuente = receta.fuente ? tramosATexto(tramosDeFuente(receta.fuente)) : '';
  if (fuente) partes.push(`Fuente: ${fuente}`);
  return partes.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
```

- [ ] **Paso 5: Correr**

Run: `npx vitest run tests/texto-receta.test.ts`
Esperado: PASS. Si falla el test del baba ganush en `Notas`, mirar el fixture: si las notas no son lista, ajustar la aserción a la primera línea real de la sección.

---

### Tarea 4: El link

**Archivos:**
- Crear: `src/link-receta.ts`
- Test: `tests/link-receta.test.ts`

**Interfaces:**
- Produce: `codificar(receta: Receta, categoria: string): Promise<string>`; `decodificar(carga: unknown): Promise<{ receta: Receta; categoria: string } | null>`; `urlDeLink(carga: string, base?: string): string`.

- [ ] **Paso 1: Test**

```ts
// tests/link-receta.test.ts
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
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/link-receta.test.ts`
Esperado: FAIL (no existe el módulo).

- [ ] **Paso 3: `src/link-receta.ts`**

```ts
/**
 * El link que muestra una receta sin login (spec §5). La receta viaja entera en
 * el fragmento, comprimida: no hay nada publicado en Drive y nada que revocar.
 */
import { parse, serialize } from './recipe.js';
import type { Receta } from './tipos.js';

/** La versión del formato. Cambiar la carga es cambiar este número. */
const VERSION = '1';

async function pasarPor(bytes: Uint8Array, flujo: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const salida = new Blob([bytes.slice()]).stream().pipeThrough(flujo);
  return new Uint8Array(await new Response(salida).arrayBuffer());
}

function aBase64url(bytes: Uint8Array): string {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(texto: string): Uint8Array {
  const b64 = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binario, c => c.charCodeAt(0));
}

export async function codificar(receta: Receta, categoria: string): Promise<string> {
  const md = serialize({ ...receta, tags: [], extras: {} });
  const json = new TextEncoder().encode(JSON.stringify({ c: categoria, md }));
  return VERSION + aBase64url(await pasarPor(json, new CompressionStream('deflate-raw')));
}

/** Nunca tira: un link roto, cortado o de otra versión es `null`. */
export async function decodificar(carga: unknown): Promise<{ receta: Receta; categoria: string } | null> {
  if (typeof carga !== 'string' || carga.length < 2 || !carga.startsWith(VERSION)) return null;
  try {
    const bytes = await pasarPor(deBase64url(carga.slice(VERSION.length)), new DecompressionStream('deflate-raw'));
    const datos: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!datos || typeof datos !== 'object') return null;
    const { c, md } = datos as Record<string, unknown>;
    if (typeof c !== 'string' || typeof md !== 'string') return null;
    const receta = parse(md);
    return receta.titulo ? { receta, categoria: c } : null;
  } catch {
    return null;
  }
}

export function urlDeLink(carga: string, base = location.origin + import.meta.env.BASE_URL): string {
  return `${base}#/ver?r=${carga}`;
}
```

- [ ] **Paso 4: Correr**

Run: `npx vitest run tests/link-receta.test.ts`
Esperado: PASS. Si la carga «alterada» decodifica igual (cambió un carácter que no rompe el deflate), usar `carga.slice(0, 5) + 'AAAA' + carga.slice(9)`.

---

### Tarea 5: El documento del PDF

**Archivos:**
- Crear: `src/pdf/documento.ts`
- Test: `tests/pdf-documento.test.ts`

**Interfaces:**
- Consume: `aPdf`, `tramosAPdf`, `tramosEnLinea`, `tramosDeFuente` (Tarea 2); `contextoDe`, `gruposDe`, `tramosDe`, `variacionesDe` (`src/recipe.ts`).
- Produce: `documentoPdf(receta: Receta, categoria: string): TDocumentDefinitions`.

- [ ] **Paso 1: Test**

```ts
// tests/pdf-documento.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from '../src/recipe.js';
import { documentoPdf } from '../src/pdf/documento.js';

const BABA = parse(readFileSync(new URL('./fixtures/baba-ganush.md', import.meta.url), 'utf8'));
const mm = (v: number) => v * 72 / 25.4;
type Nodo = Record<string, unknown>;
const contenido = (r = BABA) => documentoPdf(r, 'Entradas y picadas').content as Nodo[];
const textoDe = (n: unknown): string => JSON.stringify(n);

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
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/pdf-documento.test.ts`
Esperado: FAIL (no existe el módulo).

- [ ] **Paso 3: `src/pdf/documento.ts`**

```ts
/**
 * La receta como documento de pdfmake (spec §4). Es una función pura: no
 * importa pdfmake, sólo sus tipos, y se prueba en Node.
 *
 * Cada ítem es un nodo que no se parte, y cada título de sección —y cada
 * rótulo de grupo o de tramo— viaja junto a su primer ítem: así ninguno queda
 * solo al pie de una página.
 */
import type { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { aPdf, tramosAPdf, tramosDeFuente, tramosEnLinea } from '../ui/markdown.js';
import { contextoDe, gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { Receta } from '../tipos.js';

const mm = (v: number): number => v * 72 / 25.4;
const ANCHO = mm(105);
const ALTO = mm(180);
const MARGEN = mm(8);
const RELLENO = 6;

/** Los tokens de `src/ui/tokens.css` que usa el PDF. */
const COLOR = {
  bg: '#17140F', surface: '#211D17', borde: '#3A342B', bordeFuerte: '#544C40',
  fg: '#F2EBE1', fg2: '#B3A99B', fg3: '#948A7A'
} as const;

const TXT = { cuerpo: 6.25, titulo: 9.4, seccion: 7, chico: 5.5 } as const;

const linea = (ancho: number, color: string): Content =>
  ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: ancho, y2: 0, lineWidth: 0.75, lineColor: color }] });

/** El primer nodo con lo que lo antecede, en un bloque que no se parte; el resto, suelto. */
function juntoAlPrimero(antes: Content[], nodos: Content[]): Content[] {
  const [primero, ...resto] = nodos;
  if (primero === undefined) return [];
  return [{ stack: [...antes, primero], unbreakable: true }, ...resto];
}

function seccion(titulo: string, nodos: Content[]): Content[] {
  const encabezado: Content = {
    stack: [{ text: titulo, style: 'seccion' }, linea(ANCHO - 2 * MARGEN, COLOR.bordeFuerte)],
    margin: [0, 8, 0, 3]
  };
  return juntoAlPrimero([encabezado], nodos);
}

function cabecera(receta: Receta, categoria: string): Content {
  const contexto = contextoDe(receta, categoria);
  const fuente = receta.fuente ? tramosDeFuente(receta.fuente) : [];
  const stack: Content[] = [
    { text: receta.titulo ?? 'Sin título', style: 'titulo' },
    ...(contexto ? [{ text: contexto, style: 'contexto' }] : []),
    ...aPdf(receta.descripcion),
    ...(fuente.length
      ? [
          { ...linea(ANCHO - 2 * MARGEN - 2 * RELLENO, COLOR.borde), margin: [0, 3, 0, 3] } as Content,
          { text: [{ text: 'fuente: ' }, ...tramosAPdf(fuente)], style: 'fuente' }
        ]
      : [])
  ];
  return {
    table: { widths: ['*'], body: [[{ stack }]] },
    layout: {
      fillColor: () => COLOR.surface,
      hLineColor: () => COLOR.borde, vLineColor: () => COLOR.borde,
      hLineWidth: () => 0.75, vLineWidth: () => 0.75,
      paddingLeft: () => RELLENO, paddingRight: () => RELLENO,
      paddingTop: () => RELLENO, paddingBottom: () => RELLENO
    }
  };
}

function ingredientes(receta: Receta): Content[] {
  return gruposDe(receta.ingredientes).filter(g => g.items.length).flatMap(g => {
    const items: Content[] = g.items.map(i => ({
      ul: [{ text: [{ text: i.nombre }, ...(i.cantidad ? [{ text: `  ${i.cantidad}`, bold: true } as ContentText] : [])] }],
      style: 'lista', unbreakable: true
    }));
    return g.nombre ? juntoAlPrimero([{ text: g.nombre.toUpperCase(), style: 'grupo' }], items) : items;
  });
}

function preparacion(receta: Receta): Content[] {
  return tramosDe(receta.preparacion).filter(t => t.pasos.length).flatMap(t => {
    const pasos: Content[] = t.pasos.map((p, n) => ({
      ol: [{ text: tramosAPdf(tramosEnLinea(p)) }], start: n + 1, style: 'lista', markerColor: COLOR.fg3, unbreakable: true
    }));
    return t.nombre ? juntoAlPrimero([{ text: t.nombre.toUpperCase(), style: 'grupo' }], pasos) : pasos;
  });
}

function variaciones(receta: Receta): Content[] {
  const { lista, secciones } = variacionesDe(receta.variaciones);
  if (secciones.length) {
    return secciones.map(v => ({
      stack: [
        { text: v.nombre, style: 'subtitulo' },
        ...(v.fuente ? [{ text: v.fuente, style: 'fuente', italics: true } as Content] : []),
        ...aPdf(v.cuerpo)
      ],
      unbreakable: true
    }));
  }
  return lista.map(v => ({ ul: [{ text: tramosAPdf(tramosEnLinea(v)) }], style: 'lista', unbreakable: true }));
}

export function documentoPdf(receta: Receta, categoria: string): TDocumentDefinitions {
  return {
    pageSize: { width: ANCHO, height: ALTO },
    pageMargins: [MARGEN, MARGEN, MARGEN, MARGEN],
    info: { title: receta.titulo ?? 'Receta' },
    background: (_pagina, tamano) => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: tamano.width, h: tamano.height, color: COLOR.bg }]
    }),
    defaultStyle: { font: 'Inter', fontSize: TXT.cuerpo, color: COLOR.fg, lineHeight: 1.35 },
    styles: {
      titulo: { fontSize: TXT.titulo, bold: true, margin: [0, 0, 0, 2] },
      contexto: { fontSize: TXT.chico, color: COLOR.fg2, margin: [0, 0, 0, 3] },
      fuente: { fontSize: TXT.chico, color: COLOR.fg3 },
      link: { color: COLOR.fg2, decoration: 'underline' },
      seccion: { fontSize: TXT.seccion, bold: true, margin: [0, 0, 0, 2] },
      grupo: { fontSize: TXT.chico, color: COLOR.fg2, characterSpacing: 0.3, margin: [0, 3, 0, 1] },
      subtitulo: { bold: true, margin: [0, 2, 0, 1] },
      parrafo: { margin: [0, 0, 0, 3] },
      lista: { margin: [0, 0, 0, 1.5] }
    },
    content: [
      cabecera(receta, categoria),
      ...seccion('Ingredientes', ingredientes(receta)),
      ...seccion('Preparación', preparacion(receta)),
      ...seccion('Variaciones', variaciones(receta)),
      ...seccion('Notas', aPdf(receta.notas)),
      ...receta.otras.flatMap(o => seccion(o.encabezado, aPdf(o.cuerpo)))
    ]
  };
}
```

- [ ] **Paso 4: Correr test y typecheck**

Run: `npx vitest run tests/pdf-documento.test.ts && npm run typecheck`
Esperado: PASS. Si el typecheck rechaza un literal por `ForbidOtherElementProperties` (por ejemplo `margin` en un nodo `canvas` esparcido), declarar ese nodo como `const n: ContentCanvas = { canvas: [...], margin: [...] }` importando `ContentCanvas` como tipo.

- [ ] **Paso 5: Ver el PDF de verdad (descartable)**

Crear en el scratchpad `ver-pdf.mjs` que importe el documento con Vite SSR y lo imprima con pdfmake en Node, para compararlo con `opcion-a-5.pdf`:

```js
// Correr desde la raíz del repo: cp <scratchpad>/ver-pdf.mjs ./.ver-pdf.mjs && node ./.ver-pdf.mjs; rm ./.ver-pdf.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import pdfmake from 'pdfmake';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { parse } = await server.ssrLoadModule('/src/recipe.ts');
const { documentoPdf } = await server.ssrLoadModule('/src/pdf/documento.ts');
await server.close();
pdfmake.setFonts({ Inter: { normal: 'src/pdf/fuentes/Inter-Regular.ttf', bold: 'src/pdf/fuentes/Inter-SemiBold.ttf', italics: 'src/pdf/fuentes/Inter-Italic.ttf', bolditalics: 'src/pdf/fuentes/Inter-SemiBold.ttf' } });
const doc = documentoPdf(parse(readFileSync('tests/fixtures/baba-ganush.md', 'utf8')), 'Entradas y picadas');
writeFileSync(process.env.SALIDA ?? '/tmp/baba-pdfmake.pdf', await pdfmake.createPdf(doc).getBuffer());
console.log('listo');
```

Abrir el PDF con Read y compararlo con `scratchpad/b2/opcion-a-5.pdf`. Ajustar márgenes o `lineHeight` sólo si la diferencia es notoria; los tamaños quedan como dice el spec.

---

### Tarea 6: Generar el PDF en el navegador

**Archivos:**
- Crear: `src/pdf/generar.ts`
- Test: `tests/pdf-generar.test.ts`

**Interfaces:**
- Consume: `documentoPdf` (Tarea 5); las fuentes (Tarea 1).
- Produce: `precargar(): Promise<PdfMake>`; `generar(receta: Receta, categoria: string): Promise<Blob>`.

- [ ] **Paso 1: Test**

```ts
// tests/pdf-generar.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parse } from '../src/recipe.js';

const llamadas = vi.hoisted(() => ({ setFonts: [] as unknown[], createPdf: [] as unknown[] }));
vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    setFonts: (f: unknown) => { llamadas.setFonts.push(f); },
    createPdf: (d: unknown) => { llamadas.createPdf.push(d); return { getBlob: async () => new Blob(['%PDF'], { type: 'application/pdf' }) }; }
  }
}));

describe('generar el PDF', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); llamadas.setFonts = []; llamadas.createPdf = []; });

  it('precargar pide las tres fuentes una sola vez y registra Inter con URLs absolutas', async () => {
    const pedidas: string[] = [];
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async (u: string) => { pedidas.push(u); return { ok: true }; });
    const { precargar } = await import('../src/pdf/generar.js');
    await precargar();
    await precargar();
    expect(pedidas).toHaveLength(3);
    expect(pedidas.every(u => u.startsWith('https://h/'))).toBe(true);
    expect(llamadas.setFonts).toHaveLength(1);
    expect(JSON.stringify(llamadas.setFonts[0])).toContain('Inter');
  });

  it('si falla una fuente, el próximo intento vuelve a pedir', async () => {
    let fallar = true;
    let pedidos = 0;
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async () => { pedidos++; return { ok: !fallar, status: fallar ? 500 : 200 }; });
    const { precargar } = await import('../src/pdf/generar.js');
    await expect(precargar()).rejects.toThrow();
    fallar = false;
    await precargar();
    expect(pedidos).toBe(6);
  });

  it('generar devuelve el Blob del documento de la receta', async () => {
    vi.stubGlobal('location', { href: 'https://h/recetario/' });
    vi.stubGlobal('fetch', async () => ({ ok: true }));
    const { generar } = await import('../src/pdf/generar.js');
    const blob = await generar(parse('---\ntitulo: Rabas\n---\n'), 'Pescados');
    expect(blob.type).toBe('application/pdf');
    expect(JSON.stringify(llamadas.createPdf[0])).toContain('Rabas');
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/pdf-generar.test.ts`
Esperado: FAIL (no existe el módulo).

- [ ] **Paso 3: `src/pdf/generar.ts`**

```ts
/**
 * pdfmake y las fuentes, cargados recién cuando se va a compartir (spec §4.3).
 * Abrir la ficha llama a `precargar()`: el toque que genera el PDF es otro, con
 * su propia ventana de activación, y lo pesado ya llegó.
 */
import fuenteRegular from './fuentes/Inter-Regular.ttf?url';
import fuenteSemibold from './fuentes/Inter-SemiBold.ttf?url';
import fuenteItalica from './fuentes/Inter-Italic.ttf?url';
import { documentoPdf } from './documento.js';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Receta } from '../tipos.js';

/** Lo que se usa de pdfmake. El build de navegador es UMD y su forma exacta depende del empaquetador. */
interface PdfMake {
  setFonts(fuentes: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>): void;
  createPdf(documento: TDocumentDefinitions): { getBlob(): Promise<Blob> };
}

let cargando: Promise<PdfMake> | null = null;

export function precargar(): Promise<PdfMake> {
  if (!cargando) {
    cargando = (async () => {
      // pdfmake baja las fuentes por su cuenta y sólo acepta URLs http(s) absolutas.
      const [normal, bold, italics] = [fuenteRegular, fuenteSemibold, fuenteItalica]
        .map(u => new URL(u, location.href).href) as [string, string, string];
      const [modulo] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        ...[normal, bold, italics].map(async u => {
          const r = await fetch(u);
          if (!r.ok) throw new Error(`No se pudo bajar la fuente (${r.status})`);
        })
      ]);
      const conDefault = modulo as unknown as { default?: PdfMake } & PdfMake;
      const pdfMake = conDefault.default ?? conDefault;
      pdfMake.setFonts({ Inter: { normal, bold, italics, bolditalics: bold } });
      return pdfMake;
    })();
    // Un fallo —sin señal— no queda guardado: el próximo toque vuelve a intentar.
    cargando.catch(() => { cargando = null; });
  }
  return cargando;
}

export async function generar(receta: Receta, categoria: string): Promise<Blob> {
  const pdfMake = await precargar();
  return pdfMake.createPdf(documentoPdf(receta, categoria)).getBlob();
}
```

- [ ] **Paso 4: Correr test y typecheck**

Run: `npx vitest run tests/pdf-generar.test.ts && npm run typecheck`
Esperado: PASS. Si `tsc` da TS7016 para `pdfmake/build/pdfmake`, crear `src/pdfmake.d.ts` con `declare module 'pdfmake/build/pdfmake';` y volver a correr.

- [ ] **Paso 5: Que el build lo parta en un chunk aparte**

Run: `npm run build && ls -la dist/assets | grep -i -E 'pdfmake|Inter'`
Esperado: un `.js` de pdfmake separado del de entrada, y las tres `Inter-*.ttf` con hash. Si pdfmake cae en el bundle principal, algo lo importa estáticamente: buscar con `grep -rn "pdfmake" src`.

---

### Tarea 7: Compartir en la plataforma

**Archivos:**
- Crear: `src/compartir.ts`
- Test: `tests/compartir.test.ts`

**Interfaces:**
- Produce:
  - `interface Plataforma { share?: (d: ShareData) => Promise<void>; canShare?: (d: ShareData) => boolean; copiar?: (t: string) => Promise<void>; descargar: (f: File) => void }`
  - `type Resultado = 'compartido' | 'cancelado' | 'sin-activacion' | 'descargado' | 'copiado' | 'sin-portapapeles'`
  - `compartirPdf(p, archivo: File): Promise<Resultado>`; `compartirLink(p, titulo: string, url: string)`; `compartirTexto(p, texto: string)`; `plataformaDelNavegador(): Plataforma`

- [ ] **Paso 1: Test**

```ts
// tests/compartir.test.ts
import { describe, it, expect } from 'vitest';
import { compartirPdf, compartirLink, compartirTexto } from '../src/compartir.js';
import type { Plataforma } from '../src/compartir.js';

const error = (name: string) => Object.assign(new Error(name), { name });
const pdf = new File(['%PDF'], 'rabas.pdf', { type: 'application/pdf' });

function plataforma(opciones: { share?: 'ok' | 'AbortError' | 'NotAllowedError' | 'otro'; canShare?: boolean; copiar?: boolean } = {}) {
  const registro = { compartido: [] as ShareData[], copiado: [] as string[], descargado: [] as string[] };
  const p: Plataforma = {
    ...(opciones.share ? { share: async (d: ShareData) => {
      registro.compartido.push(d);
      if (opciones.share === 'otro') throw new Error('raro');
      if (opciones.share !== 'ok') throw error(opciones.share!);
    } } : {}),
    ...(opciones.canShare !== undefined ? { canShare: () => opciones.canShare! } : {}),
    ...(opciones.copiar ? { copiar: async (t: string) => { registro.copiado.push(t); } } : {}),
    descargar: (f: File) => { registro.descargado.push(f.name); }
  };
  return { p, registro };
}

describe('compartir el PDF', () => {
  it('con share de archivos, lo comparte con el título', async () => {
    const { p, registro } = plataforma({ share: 'ok', canShare: true });
    expect(await compartirPdf(p, pdf)).toBe('compartido');
    expect(registro.compartido[0]?.files?.[0]?.name).toBe('rabas.pdf');
    expect(registro.compartido[0]?.title).toBe('rabas');
  });
  it('cancelar el menú es cancelado', async () => {
    expect(await compartirPdf(plataforma({ share: 'AbortError', canShare: true }).p, pdf)).toBe('cancelado');
  });
  it('sin la activación del toque es sin-activacion', async () => {
    expect(await compartirPdf(plataforma({ share: 'NotAllowedError', canShare: true }).p, pdf)).toBe('sin-activacion');
  });
  it('sin canShare de archivos, se descarga', async () => {
    const { p, registro } = plataforma({ share: 'ok', canShare: false });
    expect(await compartirPdf(p, pdf)).toBe('descargado');
    expect(registro.descargado).toEqual(['rabas.pdf']);
    expect(registro.compartido).toEqual([]);
  });
  it('sin share, se descarga', async () => {
    expect(await compartirPdf(plataforma().p, pdf)).toBe('descargado');
  });
  it('otro error se propaga', async () => {
    await expect(compartirPdf(plataforma({ share: 'otro', canShare: true }).p, pdf)).rejects.toThrow('raro');
  });
});

describe('compartir link y texto', () => {
  it('el link va con título y url', async () => {
    const { p, registro } = plataforma({ share: 'ok' });
    expect(await compartirLink(p, 'Rabas', 'https://h/#/ver?r=1a')).toBe('compartido');
    expect(registro.compartido[0]).toEqual({ title: 'Rabas', url: 'https://h/#/ver?r=1a' });
  });
  it('el texto va solo, sin title', async () => {
    const { p, registro } = plataforma({ share: 'ok' });
    expect(await compartirTexto(p, 'Rabas\n…')).toBe('compartido');
    expect(registro.compartido[0]).toEqual({ text: 'Rabas\n…' });
  });
  it('sin share se copia', async () => {
    const { p, registro } = plataforma({ copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('copiado');
    expect(registro.copiado).toEqual(['hola']);
  });
  it('sin share ni portapapeles es sin-portapapeles', async () => {
    expect(await compartirLink(plataforma().p, 'A', 'https://h')).toBe('sin-portapapeles');
  });
  it('cancelar no copia', async () => {
    const { p, registro } = plataforma({ share: 'AbortError', copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('cancelado');
    expect(registro.copiado).toEqual([]);
  });
  it('sin activación, cae al portapapeles', async () => {
    const { p, registro } = plataforma({ share: 'NotAllowedError', copiar: true });
    expect(await compartirTexto(p, 'hola')).toBe('copiado');
    expect(registro.copiado).toEqual(['hola']);
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/compartir.test.ts`
Esperado: FAIL (no existe el módulo).

- [ ] **Paso 3: `src/compartir.ts`**

```ts
/**
 * El menú Compartir del sistema, con sus respaldos (spec §2). La plataforma se
 * inyecta: los tests corren en Node, donde `navigator.share` no existe.
 */
export interface Plataforma {
  share?: (datos: ShareData) => Promise<void>;
  canShare?: (datos: ShareData) => boolean;
  copiar?: (texto: string) => Promise<void>;
  descargar: (archivo: File) => void;
}

export type Resultado = 'compartido' | 'cancelado' | 'sin-activacion' | 'descargado' | 'copiado' | 'sin-portapapeles';

const nombreDe = (e: unknown): string =>
  e && typeof e === 'object' && 'name' in e ? String((e as { name: unknown }).name) : '';

async function mandar(share: NonNullable<Plataforma['share']>, datos: ShareData): Promise<Resultado> {
  try {
    await share(datos);
    return 'compartido';
  } catch (e) {
    if (nombreDe(e) === 'AbortError') return 'cancelado';
    // Chrome consume la activación del toque al llamar a share, y dura 5 s:
    // si generar tardó más, hay que pedir otro toque.
    if (nombreDe(e) === 'NotAllowedError') return 'sin-activacion';
    throw e;
  }
}

export async function compartirPdf(p: Plataforma, archivo: File): Promise<Resultado> {
  const datos: ShareData = { files: [archivo], title: archivo.name.replace(/\.pdf$/i, '') };
  if (!p.share || !p.canShare?.(datos)) {
    p.descargar(archivo);
    return 'descargado';
  }
  return mandar(p.share, datos);
}

async function compartirOCopiar(p: Plataforma, datos: ShareData, copia: string): Promise<Resultado> {
  if (p.share) {
    const r = await mandar(p.share, datos);
    if (r !== 'sin-activacion') return r;
  }
  if (!p.copiar) return 'sin-portapapeles';
  try {
    await p.copiar(copia);
    return 'copiado';
  } catch {
    return 'sin-portapapeles';
  }
}

export const compartirLink = (p: Plataforma, titulo: string, url: string): Promise<Resultado> =>
  compartirOCopiar(p, { title: titulo, url }, url);

/** Sin `title`: muchas apps lo ignoran, y el título ya va adentro del texto. */
export const compartirTexto = (p: Plataforma, texto: string): Promise<Resultado> =>
  compartirOCopiar(p, { text: texto }, texto);

export function plataformaDelNavegador(): Plataforma {
  const nav = navigator;
  return {
    ...(typeof nav.share === 'function' ? { share: (d: ShareData) => nav.share(d) } : {}),
    ...(typeof nav.canShare === 'function' ? { canShare: (d: ShareData) => nav.canShare(d) } : {}),
    ...(nav.clipboard && typeof nav.clipboard.writeText === 'function'
      ? { copiar: (t: string) => nav.clipboard.writeText(t) } : {}),
    descargar: (archivo: File) => {
      const url = URL.createObjectURL(archivo);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  };
}
```

- [ ] **Paso 4: Correr**

Run: `npx vitest run tests/compartir.test.ts && npm run typecheck`
Esperado: PASS.

---

### Tarea 8: Extracciones — pintar, control del modo cocina, fichas, salidas de cocina

Todo el comportamiento de la app queda igual: la prueba es la suite existente.

**Archivos:**
- Crear: `src/ui/pintar.ts`, `src/cocina-control.ts`, `src/ui/fichas-receta.ts`
- Modificar: `src/main.ts`, `src/ui/receta.ts`, `src/ui/cocina.ts`
- Test: `tests/cocina-control.test.ts` (nuevo), `tests/vista-cocina.test.ts` (ajuste)

**Interfaces:**
- Produce:
  - `pintar(html: string): void`; `conClosest(t: EventTarget | null): Element | null`
  - `crearControlCocina()` → `{ estado(): { posicion; aqui; hechos; wakeActivo }, reiniciar(), conmutar(destino: string | undefined, scrollActual: number): number | null, marcarPaso(valor: string | undefined): boolean, entrarDesdeLectura(), salirALectura(): 'atras' | 'reemplazar', olvidarLectura(), mantenerPantalla(): Promise<boolean>, soltarPantalla(): Promise<void>, alternarPantalla(): Promise<void>, necesitaRepedir(solEncendido: boolean): boolean }`
  - `fichaCabecera({ receta, categoria, marcas? }): string`; `fichasDelCuerpo(receta): string`; `botonCocinar(receta): string`; `pieDeAcciones(html): string`
  - `OpcionesCocina.salidas: 'volver-y-salir' | 'solo-volver'`

- [ ] **Paso 1: Test del control**

```ts
// tests/cocina-control.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { crearControlCocina } from '../src/cocina-control.js';

describe('el control del modo cocina', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('arranca en ingredientes con el paso 1 como actual', () => {
    expect(crearControlCocina().estado()).toEqual({ posicion: 'ingredientes', aqui: 0, hechos: [], wakeActivo: false });
  });

  it('tocar el paso actual lo da por hecho y el hilo sigue; tocar otro lo marca como actual', () => {
    const c = crearControlCocina();
    expect(c.marcarPaso('0')).toBe(true);
    expect(c.estado()).toMatchObject({ aqui: 1, hechos: [0] });
    c.marcarPaso('0');
    expect(c.estado()).toMatchObject({ aqui: 0, hechos: [] });
    expect(c.marcarPaso('x')).toBe(false);
  });

  it('conmutar guarda el scroll del lado que se deja y devuelve el del otro', () => {
    const c = crearControlCocina();
    expect(c.conmutar('pasos', 300)).toBe(0);
    expect(c.conmutar('ingredientes', 50)).toBe(300);
    expect(c.conmutar('ingredientes', 10)).toBeNull();
  });

  it('reiniciar vuelve todo al principio', () => {
    const c = crearControlCocina();
    c.marcarPaso('0'); c.conmutar('pasos', 20);
    c.reiniciar();
    expect(c.estado()).toEqual({ posicion: 'ingredientes', aqui: 0, hechos: [], wakeActivo: false });
    expect(c.conmutar('pasos', 0)).toBe(0);
  });

  it('salir a la lectura es atrás sólo si se entró desde ella, una vez', () => {
    const c = crearControlCocina();
    expect(c.salirALectura()).toBe('reemplazar');
    c.entrarDesdeLectura();
    expect(c.salirALectura()).toBe('atras');
    expect(c.salirALectura()).toBe('reemplazar');
    c.entrarDesdeLectura(); c.olvidarLectura();
    expect(c.salirALectura()).toBe('reemplazar');
  });

  it('la pantalla encendida: pedir, soltar, y volver a pedir si se perdió', async () => {
    let soltar = () => {};
    vi.stubGlobal('navigator', { wakeLock: { request: async () => ({
      addEventListener: (_e: string, fn: () => void) => { soltar = fn; }, release: async () => {}
    }) } });
    const c = crearControlCocina();
    await c.alternarPantalla();
    expect(c.estado().wakeActivo).toBe(true);
    expect(c.necesitaRepedir(true)).toBe(false);
    soltar();
    expect(c.necesitaRepedir(true)).toBe(true);
    expect(c.necesitaRepedir(false)).toBe(false);
    await c.mantenerPantalla();
    await c.alternarPantalla();
    expect(c.estado().wakeActivo).toBe(false);
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/cocina-control.test.ts`
Esperado: FAIL (no existe el módulo).

- [ ] **Paso 3: `src/cocina-control.ts`**

```ts
/**
 * El estado del modo cocina y la pantalla encendida. Lo usan la app y la vista
 * de invitado: marcar, conmutar y no dejar que la pantalla se apague se
 * comportan igual en las dos.
 *
 * El estado se limpia al entrar: al volver a abrir una receta no hay ningún
 * paso realzado ni marcado (C03.2.4). No persiste en ningún lado.
 */
import type { PosicionCocina } from './ui/cocina.js';

export function crearControlCocina() {
  let posicion: PosicionCocina = 'ingredientes';
  /** El paso actual. Al entrar es el primero: sin uno elegido, la pantalla no dice dónde estás. */
  let aqui = 0;
  let hechos: number[] = [];
  /** El scroll de cada lado del conmutador, para no perderlo al conmutar (C03.2.2). */
  const scroll: Record<PosicionCocina, number> = { ingredientes: 0, pasos: 0 };
  /**
   * Si al modo cocina se entró tocando «Cocinar», la lectura ya está una entrada
   * atrás en el historial: volver a ella es un `back`, no una navegación nueva.
   * Con una navegación quedaba dos veces seguidas y su volver parecía no hacer nada.
   */
  let desdeLectura = false;
  let bloqueo: WakeLockSentinel | null = null;

  /**
   * Que la pantalla no se apague mientras se cocina. El bloqueo se pierde solo
   * cuando la app pasa a segundo plano, así que hay que volver a pedirlo al volver.
   */
  async function mantenerPantalla(): Promise<boolean> {
    if (!navigator.wakeLock) return false;
    try {
      bloqueo = await navigator.wakeLock.request('screen');
      bloqueo.addEventListener('release', () => { bloqueo = null; });
      return true;
    } catch {
      bloqueo = null;
      return false;
    }
  }

  async function soltarPantalla(): Promise<void> {
    try { await bloqueo?.release(); } catch { /* ya soltado */ }
    bloqueo = null;
  }

  return {
    estado: () => ({ posicion, aqui, hechos, wakeActivo: !!bloqueo }),
    reiniciar(): void {
      posicion = 'ingredientes';
      aqui = 0;
      hechos = [];
      scroll.ingredientes = scroll.pasos = 0;
    },
    /** Devuelve el scroll al que volver, o `null` si ya estaba ahí. */
    conmutar(destino: string | undefined, scrollActual: number): number | null {
      const nueva: PosicionCocina = destino === 'pasos' ? 'pasos' : 'ingredientes';
      if (nueva === posicion) return null;
      scroll[posicion] = scrollActual;
      posicion = nueva;
      return scroll[nueva];
    },
    /**
     * Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
     * hecho y el hilo sigue al siguiente. Devuelve si hubo que redibujar.
     */
    marcarPaso(valor: string | undefined): boolean {
      const n = Number(valor ?? -1);
      if (!Number.isInteger(n) || n < 0) return false;
      if (aqui === n) {
        hechos = [...hechos.filter(p => p !== n), n];
        aqui = n + 1;
      } else {
        aqui = n;
        hechos = hechos.filter(p => p !== n);
      }
      return true;
    },
    entrarDesdeLectura(): void { desdeLectura = true; },
    salirALectura(): 'atras' | 'reemplazar' {
      const salida = desdeLectura ? 'atras' : 'reemplazar';
      desdeLectura = false;
      return salida;
    },
    olvidarLectura(): void { desdeLectura = false; },
    mantenerPantalla,
    soltarPantalla,
    async alternarPantalla(): Promise<void> {
      if (bloqueo) await soltarPantalla();
      else await mantenerPantalla();
    },
    /** Si el sol sigue encendido y el bloqueo no está, se perdió al irse a segundo plano. */
    necesitaRepedir: (solEncendido: boolean): boolean => solEncendido && !bloqueo
  };
}

export type ControlCocina = ReturnType<typeof crearControlCocina>;
```

- [ ] **Paso 4: `src/ui/pintar.ts`**

```ts
/** Lo que comparten los dos controladores —la app y el invitado— para dibujar y escuchar toques. */

export function pintar(html: string): void {
  const app = document.querySelector('#app');
  if (app) app.innerHTML = html;
}

/**
 * Estrecha el destino de un evento a algo con `closest`.
 *
 * Va por capacidad y no por `instanceof Element` a propósito: los tests corren
 * en Node contra un DOM mínimo escrito a mano, donde `Element` no existe como
 * global. Chequear la clase ataría el código de producción a que el entorno de
 * test cargue un DOM completo, que es justo lo que este proyecto no hace.
 */
export const conClosest = (t: EventTarget | null): Element | null =>
  t && typeof (t as Element).closest === 'function' ? t as Element : null;
```

- [ ] **Paso 5: `salidas` en `src/ui/cocina.ts`**

En `OpcionesCocina`, agregar después de `wakeActivo`:

```ts
  /**
   * Las salidas del encabezado. La receta tiene dos: el chevron vuelve a la
   * receta y Salir a la categoría. El invitado no tiene categoría: sólo el chevron.
   */
  salidas: 'volver-y-salir' | 'solo-volver';
```

Cambiar la firma a `{ receta, posicion, aqui, hechos, wakeActivo = false, salidas }: OpcionesCocina` y la línea de Salir:

```ts
      wake +
      (salidas === 'volver-y-salir' ? '<button class="btn sec compacto" data-accion="salir-cocina">Salir</button>' : '') +
```

En `tests/vista-cocina.test.ts`, cambiar `base`:

```ts
const base: { posicion: 'pasos'; aqui: number | null; hechos: number[]; salidas: 'volver-y-salir' } =
  { posicion: 'pasos', aqui: null, hechos: [], salidas: 'volver-y-salir' };
```

y agregar al final del `describe`:

```ts
  it('con solo-volver no hay Salir, y el chevron sigue', () => {
    const html = renderCocina({ ...base, receta: COMPLETA, salidas: 'solo-volver' });
    expect(html).not.toContain('salir-cocina');
    expect(html).toContain('data-accion="volver-receta"');
  });
```

- [ ] **Paso 6: `src/ui/fichas-receta.ts`**

```ts
/**
 * Las piezas de la receta en lectura que comparten la receta de la app y la
 * vista de invitado. Cada pantalla arma su encabezado, sus marcas y sus
 * acciones: lo que se sume a una no aparece en la otra salvo que se pase a propósito.
 */
import { escapar, aHtml, tramosAHtml, tramosDeFuente } from './markdown.js';
import { colorCategoria } from './categorias.js';
import { contextoDe, gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { Receta, GrupoIngredientes, TramoPreparacion } from '../tipos.js';

export const ficha = (contenido: string, titulo?: string): string =>
  contenido ? `<div class="ficha">${titulo ? `<h2>${escapar(titulo)}</h2>` : ''}${contenido}</div>` : '';

const ingredientes = (grupos: GrupoIngredientes[]): string =>
  grupos.map(g =>
    (g.nombre ? `<div class="grupo">${escapar(g.nombre)}</div>` : '') +
    g.items.map(i =>
      `<div class="ing"><span class="n">${escapar(i.nombre)}</span>` +
      (i.cantidad ? `<span class="c">${escapar(i.cantidad)}</span>` : '') +
      '</div>').join('')
  ).join('');

const preparacion = (tramos: TramoPreparacion[]): string =>
  tramos.map(t =>
    (t.nombre ? `<div class="tramo">${escapar(t.nombre)}</div>` : '') +
    // La numeración vuelve a empezar en cada tramo: son pasos de otra cosa.
    `<ol class="pasos">${t.pasos.map(p => `<li>${aHtml(p)}</li>`).join('')}</ol>`
  ).join('');

export interface OpcionesCabecera {
  receta: Receta;
  categoria: string;
  /** Lo que va entre el contexto y la descripción. La receta pone ahí los tags y la marca de incompleta. */
  marcas?: string;
}

/**
 * La primera ficha: foto, título, contexto, marcas, descripción y fuente. La
 * fuente al pie, tras un divisor: es dato de procedencia.
 */
export function fichaCabecera({ receta, categoria, marcas = '' }: OpcionesCabecera): string {
  const contexto = contextoDe(receta, categoria);
  const fuente = receta.fuente ? tramosAHtml(tramosDeFuente(receta.fuente)) : '';
  return ficha(
    (receta.foto ? `<img class="rec-foto" src="${escapar(receta.foto)}" alt="" loading="lazy">` : '') +
    `<h1 class="rec-tit">${escapar(receta.titulo ?? 'Sin título')}</h1>` +
    (contexto
      ? `<div class="rec-ctx">${categoria ? `<span class="pin" style="background:${colorCategoria(categoria)}"></span>` : ''}${escapar(contexto)}</div>`
      : '') +
    marcas +
    // La descripción es de la receta, no una sección aparte: va en la misma ficha.
    (receta.descripcion ? `<div class="lee rec-desc">${aHtml(receta.descripcion)}</div>` : '') +
    (fuente ? `<div class="rec-fuente"><span class="emo">📖</span>fuente: ${fuente}</div>` : '')
  );
}

/** Ingredientes, Preparación, Variaciones, Notas y las secciones que la app no conoce. Ninguna vacía. */
export function fichasDelCuerpo(receta: Receta): string {
  const grupos = gruposDe(receta.ingredientes).filter(g => g.items.length);
  const tramos = tramosDe(receta.preparacion).filter(t => t.pasos.length);
  const { lista, secciones } = variacionesDe(receta.variaciones);
  const variaciones = secciones.length
    ? secciones.map(v =>
        `<div class="var"><h3>${escapar(v.nombre)}</h3>` +
        (v.fuente ? `<div class="f">${escapar(v.fuente)}</div>` : '') +
        `<p>${aHtml(v.cuerpo)}</p></div>`).join('')
    : lista.map(v => `<div class="var"><p>${aHtml(v)}</p></div>`).join('');

  return ficha(ingredientes(grupos), 'Ingredientes') +
    ficha(preparacion(tramos), 'Preparación') +
    ficha(variaciones, 'Variaciones') +
    ficha(receta.notas ? `<div class="lee">${aHtml(receta.notas)}</div>` : '', 'Notas') +
    receta.otras.map(o => ficha(`<div class="lee">${aHtml(o.cuerpo)}</div>`, o.encabezado)).join('');
}

/** Cocinar necesita algo que cocinar: sin ingredientes ni pasos no se ofrece. */
export function botonCocinar(receta: Receta): string {
  const hay = gruposDe(receta.ingredientes).some(g => g.items.length) || tramosDe(receta.preparacion).some(t => t.pasos.length);
  return hay ? '<button class="btn prim" data-accion="cocinar">Cocinar</button>' : '';
}

export const pieDeAcciones = (botones: string): string =>
  botones ? `<div class="pie"><div class="acciones">${botones}</div></div>` : '';
```

Nota: la fuente markdown hoy se emite `<a href target rel>texto</a>`; `tramosAHtml` produce exactamente ese markup, así que los tests de fuente de `vista-receta` siguen valiendo.

- [ ] **Paso 7: `src/ui/receta.ts` compone con las fichas**

Reemplazar el archivo desde el import de `markdown.js` hasta el final por:

```ts
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
// El logo de Drive, en el repo y no pedido a `gstatic.com`: una dependencia de
// red para 513 bytes es una dependencia de más, y así entra a `/assets/`, que es
// lo único que el service worker sirve caché-primero. Es el favicon que publica
// Google, copiado tal cual: redibujarlo de trazo lo vuelve irreconocible, que es
// lo único que el logo aporta (design-system §6.7).
import logoDrive from './drive.png';
import type { Entrada, Receta } from '../tipos.js';

export interface OpcionesReceta {
  /** La fila del índice, para la categoría. Falta si la receta no está indexada. */
  entrada: Entrada | null;
  receta: Receta;
}

export function renderReceta({ entrada, receta }: OpcionesReceta): string {
  const categoria = entrada?.categoria ?? '';
  // El estado es un chip más de la fila de tags, y va primero: es lo que hay que
  // ver al mirar la receta. Como chip hereda el ancho, el alto y el aire de los
  // demás — suelto debajo se montaba sobre ellos (C03.1.3). Lo que dice el `.md`, sin calcular nada.
  const marca = receta.completa ? '' :
    '<button class="chip pend" data-accion="editar" aria-label="Incompleta: abrir el editor">' +
      '<span class="inc"></span>Incompleta</button>';
  const marcas = marca || receta.tags.length
    ? '<div class="chips">' + marca +
      receta.tags.map(t => `<button class="chip" data-tag="${escapar(t)}">${escapar(t)}</button>`).join('') +
      '</div>'
    : '';

  // El `.md` en Drive, en una pestaña nueva. Sólo si la receta está en el
  // índice: sin fila no se conoce su id de archivo.
  const alArchivo = entrada?.id_archivo
    ? `<a class="archivo" href="https://drive.google.com/file/d/${encodeURIComponent(entrada.id_archivo)}/view" ` +
      'target="_blank" rel="noopener" aria-label="Ver el archivo en Drive">' +
      `<img class="logo" src="${escapar(logoDrive)}" ` +
      // Sin `lazy`: son 513 bytes y está en pantalla desde el primer momento.
      'alt="" width="16" height="16">.md</a>'
    : '';

  // El encabezado arranca sin texto: el título está abajo, grande y entero.
  // `main` le pone el título recortado cuando el grande sale de pantalla.
  // Sin menú de ⋯: las acciones son Cocinar y Editar, y las dos están al pie.
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: alArchivo }) +
    '<div class="cuerpo">' + fichaCabecera({ receta, categoria, marcas }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`);
}
```

Conservar el comentario de cabecera del archivo (`/** La receta entera, en una columna (mockup 01). … */`).

- [ ] **Paso 8: `src/main.ts` usa las extracciones**

Imports — agregar:

```ts
import { pintar, conClosest } from './ui/pintar.js';
import { crearControlCocina } from './cocina-control.js';
```

Borrar las definiciones que se mudaron: `let wakeLock…` (línea 56), `let posicionCocina`, `let pasoAqui`, `let pasosHechos` y su comentario, `let cocinaDesdeReceta` y su comentario, `const scrollCocina` y su comentario, `const conClosest` y su comentario, `const pintar = …`, y las funciones `mantenerPantalla` / `soltarPantalla` con su comentario. Borrar también `import type { PosicionCocina } from './ui/cocina.js';`.

En su lugar, donde estaba `let pasosHechos`:

```ts
/** El modo cocina: paso actual, marcados, conmutador y pantalla encendida. */
const cocina = crearControlCocina();
```

Reemplazar el listener de `visibilitychange`:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  // Si el botón sigue activo, el usuario nunca lo apagó: el bloqueo se
  // perdió al irse a segundo plano y hay que volver a pedirlo.
  const sol = document.querySelector<HTMLElement>('[data-accion="wake"].on');
  if (cocina.necesitaRepedir(!!sol)) void cocina.mantenerPantalla().then(() => render());
});
```

En `render`, dentro de `if (cambiaDePantalla)`, reemplazar las cuatro líneas de `posicionCocina…scrollCocina…` por:

```ts
    cocina.reiniciar();
```

En `case 'cocinar'`:

```ts
        return pintar(renderCocina({ receta, ...cocina.estado(), salidas: 'volver-y-salir' }));
```

En el handler de clicks, reemplazar `cocinar`, `conmutar`, `paso` y `wake`:

```ts
  if (accion === 'cocinar') {
    cocina.entrarDesdeLectura();
    location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/cocinar`;
    return;
  }
  if (accion === 'conmutar') {
    const volverA = cocina.conmutar(boton.dataset['posicion'], window.scrollY);
    if (volverA === null) return;
    await render();
    window.scrollTo(0, volverA);
    return;
  }
  if (accion === 'paso') {
    // Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
    // hecho y el hilo sigue al siguiente.
    if (cocina.marcarPaso(boton.dataset['paso'])) return render();
    return;
  }
  if (accion === 'wake') {
    await cocina.alternarPantalla();
    return render();
  }
```

Y `volver-receta`, `salir-cocina` y el `soltarPantalla` de `volver`:

```ts
  if (accion === 'volver-receta') {
    await cocina.soltarPantalla();
    if (cocina.salirALectura() === 'atras') return history.back();
    // Se entró al modo cocina por un link directo: no hay receta atrás.
    irCerrando(`#/r/${encodeURIComponent(vistaActual?.params['id'] ?? '')}`);
    return;
  }
  if (accion === 'salir-cocina') {
    await cocina.soltarPantalla();
    cocina.olvidarLectura();
```

(el resto de `salir-cocina` queda igual) y en `volver`: `if (vistaActual?.vista === 'cocinar') await cocina.soltarPantalla();`.

- [ ] **Paso 9: Correr toda la suite y typecheck**

Run: `npm test && npm run typecheck`
Esperado: todo verde, en particular `main-rutas` (cocina, sol, volver de segundo plano) y `vista-receta` sin cambios. `grep -n "wakeLock\|pasoAqui\|scrollCocina\|cocinaDesdeReceta" src/main.ts` no devuelve nada.

---

### Tarea 9: Ícono y ficha de compartir en la receta

**Archivos:**
- Crear: `src/ui/compartir.ts`
- Modificar: `src/ui/iconos.ts`, `src/ui/receta.ts`, `src/ui/base.css`, `src/main.ts`
- Test: `tests/vista-receta.test.ts` (sumar), `tests/main-rutas.test.ts` (sumar)

**Interfaces:**
- Consume: `generar`, `precargar` (T6); `compartirPdf`, `compartirLink`, `compartirTexto`, `plataformaDelNavegador` (T7); `codificar`, `urlDeLink` (T4); `textoReceta` (T3); `slugArchivo` (`recipe.ts`).
- Produce:
  - `type EstadoCompartir = { paso: 'opciones' } | { paso: 'generando' } | { paso: 'pdf-listo' } | { paso: 'error-pdf' } | { paso: 'copiado'; que: 'link' | 'texto' } | { paso: 'mostrar'; que: 'link' | 'texto'; contenido: string }`
  - `renderFichaCompartir(estado: EstadoCompartir): string`
  - `OpcionesReceta.compartir?: EstadoCompartir`
  - Acciones: `compartir`, `cerrar-compartir`, `compartir-pdf`, `enviar-pdf`, `compartir-link`, `compartir-texto`

- [ ] **Paso 1: Tests de la vista** — agregar al final del `describe` de `tests/vista-receta.test.ts` (y `import { renderFichaCompartir } from '../src/ui/compartir.js';`):

```ts
  it('el encabezado lleva compartir, antes del .md', () => {
    const html = renderReceta({ entrada: entradaFalsa({ id_archivo: 'f1' }), receta: COMPLETA });
    const enc = html.slice(0, html.indexOf('class="cuerpo'));
    expect(enc).toContain('data-accion="compartir" aria-label="Compartir"');
    expect(enc.indexOf('data-accion="compartir"')).toBeLessThan(enc.indexOf('class="archivo"'));
  });

  it('sin estado de compartir no hay ficha; con estado, sí', () => {
    expect(renderReceta({ entrada: null, receta: COMPLETA })).not.toContain('hoja-compartir');
    expect(renderReceta({ entrada: null, receta: COMPLETA, compartir: { paso: 'opciones' } })).toContain('hoja-compartir');
  });
});

describe('La ficha de compartir', () => {
  it('opciones: PDF, Link, Texto y Cancelar; tocar el velo cierra', () => {
    const html = renderFichaCompartir({ paso: 'opciones' });
    for (const a of ['compartir-pdf', 'compartir-link', 'compartir-texto']) expect(html).toContain(`data-accion="${a}"`);
    expect(html).toContain('>Cancelar<');
    expect(html).toContain('class="velo" data-accion="cerrar-compartir"');
  });
  it('generando: nada se puede tocar', () => {
    const html = renderFichaCompartir({ paso: 'generando' });
    expect(html).toContain('Armando el PDF…');
    expect(html).not.toMatch(/data-accion="compartir-(pdf|link|texto)"/);
  });
  it('pdf-listo: Enviar PDF', () => {
    expect(renderFichaCompartir({ paso: 'pdf-listo' })).toContain('data-accion="enviar-pdf"');
    expect(renderFichaCompartir({ paso: 'pdf-listo' })).toContain('El PDF está listo.');
  });
  it('error-pdf: avisa y ofrece reintentar', () => {
    const html = renderFichaCompartir({ paso: 'error-pdf' });
    expect(html).toContain('No pude armar el PDF.');
    expect(html).toContain('data-accion="compartir-pdf">Reintentar');
  });
  it('copiado y mostrar', () => {
    expect(renderFichaCompartir({ paso: 'copiado', que: 'link' })).toContain('Link copiado.');
    expect(renderFichaCompartir({ paso: 'copiado', que: 'texto' })).toContain('Texto copiado.');
    const html = renderFichaCompartir({ paso: 'mostrar', que: 'texto', contenido: '<b>Rabas</b>' });
    expect(html).toContain('&lt;b&gt;Rabas&lt;/b&gt;');
  });
```

(Ojo con el cierre: el primer bloque va dentro del `describe('Receta en lectura')` existente, que se cierra con el `});` que se muestra; el `describe('La ficha de compartir')` va después.)

- [ ] **Paso 2: Tests del cableado** — en `tests/main-rutas.test.ts`, agregar al lado de los otros `vi.mock`:

```ts
const pdfs = vi.hoisted(() => ({ generados: 0 }));
vi.mock('../src/pdf/generar.js', () => ({
  precargar: async () => ({}),
  generar: async () => { pdfs.generados++; return new Blob(['%PDF'], { type: 'application/pdf' }); }
}));
```

y dentro del `describe` principal:

```ts
  describe('compartir desde la receta', () => {
    const PASOS = '---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar — 1 kg\n\n## Preparación\n1. Lavar.\n';
    afterEach(() => { pdfs.generados = 0; });

    it('el ícono abre la ficha y cancelar la cierra', async () => {
      estado.md = PASOS;
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      expect(app.innerHTML).toContain('hoja-compartir');
      await tocar('cerrar-compartir');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF: genera y lo comparte como archivo, y la ficha se cierra', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); }, canShare: () => true });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(pdfs.generados).toBe(1);
      expect(compartidos[0]?.files?.[0]?.name).toBe('rabas.pdf');
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('PDF sin activación: Enviar PDF manda el mismo archivo sin volver a generar', async () => {
      estado.md = PASOS;
      let intentos = 0;
      vi.stubGlobal('navigator', {
        share: async () => { if (++intentos === 1) throw Object.assign(new Error('x'), { name: 'NotAllowedError' }); },
        canShare: () => true
      });
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-pdf');
      expect(app.innerHTML).toContain('El PDF está listo.');
      await tocar('enviar-pdf');
      expect(intentos).toBe(2);
      expect(pdfs.generados).toBe(1);
      expect(app.innerHTML).not.toContain('hoja-compartir');
    });

    it('texto: lo comparte con el título adentro', async () => {
      estado.md = PASOS;
      const compartidos: ShareData[] = [];
      vi.stubGlobal('navigator', { share: async (d: ShareData) => { compartidos.push(d); } });
      const { abrir, tocar } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-texto');
      expect(compartidos[0]?.text?.startsWith('Rabas\n')).toBe(true);
    });

    it('link sin share ni portapapeles: lo muestra para copiar', async () => {
      estado.md = PASOS;
      vi.stubGlobal('navigator', {});
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1');
      await tocar('compartir');
      await tocar('compartir-link');
      expect(app.innerHTML).toContain('#/ver?r=1');
    });
  });
```

Además, en `montar()`, el doble de `location` necesita `origin`: agregar `origin: 'https://h'` al objeto de `global.location`.

- [ ] **Paso 3: Correr y ver que fallan**

Run: `npx vitest run tests/vista-receta.test.ts tests/main-rutas.test.ts`
Esperado: FAIL en los tests nuevos.

- [ ] **Paso 4: Ícono** — en `src/ui/iconos.ts`, antes de `puntos`:

```ts
  /** Compartir la receta: PDF, link o texto. De Lucide (share-2). */
  compartir: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
    '<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>'),
```

- [ ] **Paso 5: `src/ui/compartir.ts`**

```ts
/**
 * La ficha de compartir, al pie de la receta (spec §2). Es estado de la
 * pantalla, no una ruta: volver, Cancelar o tocar el velo la cierran.
 */
import { escapar } from './markdown.js';
import { aviso } from './componentes.js';

export type EstadoCompartir =
  | { paso: 'opciones' }
  | { paso: 'generando' }
  | { paso: 'pdf-listo' }
  | { paso: 'error-pdf' }
  | { paso: 'copiado'; que: 'link' | 'texto' }
  | { paso: 'mostrar'; que: 'link' | 'texto'; contenido: string };

const boton = (accion: string, texto: string, clase = 'sec'): string =>
  `<button class="btn ${clase}" data-accion="${accion}">${escapar(texto)}</button>`;

const cancelar = boton('cerrar-compartir', 'Cancelar');
const listo = boton('cerrar-compartir', 'Listo');

function cuerpo(estado: EstadoCompartir): string {
  switch (estado.paso) {
    case 'opciones':
      return boton('compartir-pdf', 'PDF') + boton('compartir-link', 'Link') + boton('compartir-texto', 'Texto') + cancelar;
    case 'generando':
      return '<button class="btn sec" disabled><span class="spin en-boton"></span>Armando el PDF…</button>' +
        '<button class="btn sec" disabled>Link</button><button class="btn sec" disabled>Texto</button>';
    case 'pdf-listo':
      return '<p>El PDF está listo.</p>' + boton('enviar-pdf', 'Enviar PDF', 'prim') + cancelar;
    case 'error-pdf':
      return aviso({ texto: 'No pude armar el PDF.', accion: { etiqueta: 'Reintentar', accion: 'compartir-pdf' } }) + cancelar;
    case 'copiado':
      return `<p>${estado.que === 'link' ? 'Link copiado.' : 'Texto copiado.'}</p>` + listo;
    case 'mostrar':
      return '<p>Copialo desde acá:</p>' + `<div class="copia">${escapar(estado.contenido)}</div>` + listo;
  }
}

export function renderFichaCompartir(estado: EstadoCompartir): string {
  return '<div class="velo" data-accion="cerrar-compartir"></div>' +
    `<div class="hoja-compartir" role="dialog" aria-label="Compartir"><h2>Compartir</h2>${cuerpo(estado)}</div>`;
}
```

Nota: el test de `aviso` espera `data-accion="compartir-pdf">Reintentar`; `aviso()` emite `data-accion="…">etiqueta</button>`, así que calza.

- [ ] **Paso 6: La receta dibuja el ícono y la ficha** — en `src/ui/receta.ts`:

```ts
import { renderFichaCompartir } from './compartir.js';
import type { EstadoCompartir } from './compartir.js';
```

En `OpcionesReceta`:

```ts
  /** La ficha de compartir abierta, en su estado. Sin esto no se dibuja. */
  compartir?: EstadoCompartir;
```

Firma `renderReceta({ entrada, receta, compartir }: OpcionesReceta)`, y el `return`:

```ts
  const botonCompartir = `<button class="ico" data-accion="compartir" aria-label="Compartir">${ICO.compartir}</button>`;
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: botonCompartir + alArchivo }) +
    '<div class="cuerpo">' + fichaCabecera({ receta, categoria, marcas }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`) +
    (compartir ? renderFichaCompartir(compartir) : '');
```

- [ ] **Paso 7: CSS** — al final de la sección de la receta en `src/ui/base.css` (después de `.pie .acciones`):

```css
/* ---- Compartir (spec P23 §2) ---- */
.velo { position: fixed; inset: 0; z-index: 30; background: var(--velo); opacity: .6; }
.hoja-compartir { position: fixed; left: 0; right: 0; bottom: 0; z-index: 31; max-width: 680px; margin: 0 auto;
                  display: flex; flex-direction: column; gap: var(--e-2);
                  background: var(--surface); border-top: 1px solid var(--borde);
                  border-radius: var(--r-ficha) var(--r-ficha) 0 0;
                  padding: var(--e-4) var(--e-4) calc(var(--e-4) + env(safe-area-inset-bottom)); }
.hoja-compartir h2 { font-size: var(--txt-base); font-weight: 600; margin: 0 0 var(--e-2); }
.hoja-compartir p { margin: 0 0 var(--e-2); }
.hoja-compartir .btn { width: 100%; }
.hoja-compartir .copia { font-size: var(--txt-chico); color: var(--fg-2); background: var(--bg);
                         border: 1px solid var(--borde); border-radius: var(--r-medio); padding: var(--e-3);
                         max-height: 40vh; overflow: auto; white-space: pre-wrap; word-break: break-all;
                         user-select: all; }
.spin.en-boton { width: 16px; height: 16px; margin: 0 var(--e-2) 0 0; }
```

- [ ] **Paso 8: Cableado en `src/main.ts`**

Imports:

```ts
import { slugArchivo } from './recipe.js';
import { precargar, generar } from './pdf/generar.js';
import { compartirPdf, compartirLink, compartirTexto, plataformaDelNavegador } from './compartir.js';
import { codificar, urlDeLink } from './link-receta.js';
import { textoReceta } from './texto-receta.js';
import type { EstadoCompartir } from './ui/compartir.js';
```

(`slugArchivo` se suma al import existente de `./recipe.js`.)

Estado, junto a `const cocina`:

```ts
/** La ficha de compartir de la receta abierta, o `null`. */
let compartiendo: EstadoCompartir | null = null;
/** El PDF ya armado, para *Enviar PDF* cuando Chrome perdió el toque: no se vuelve a generar. */
let pdfListo: File | null = null;
```

En `render`, dentro de `if (cambiaDePantalla)`, después de `cocina.reiniciar();`:

```ts
    compartiendo = null;
    pdfListo = null;
```

En `case 'receta'`:

```ts
        pintar(renderReceta({ entrada, receta, ...(compartiendo ? { compartir: compartiendo } : {}) }));
```

En el handler de clicks, antes de `if (accion === 'cocinar')`:

```ts
  if (accion === 'compartir') {
    compartiendo = { paso: 'opciones' };
    // Lo pesado del PDF empieza a bajar ya: el toque que lo genera es otro.
    void precargar().catch(() => {});
    return render();
  }
  if (accion === 'cerrar-compartir') {
    compartiendo = null;
    pdfListo = null;
    return render();
  }
  if (accion === 'compartir-pdf' || accion === 'enviar-pdf') {
    if (!recetaLeida) return;
    const { entrada, receta } = recetaLeida;
    if (accion === 'compartir-pdf' || !pdfListo) {
      compartiendo = { paso: 'generando' };
      await render();
      try {
        const blob = await generar(receta, entrada?.categoria ?? '');
        pdfListo = new File([blob], slugArchivo(receta.titulo).replace(/\.md$/, '.pdf'), { type: 'application/pdf' });
      } catch (err) {
        console.error(err);
        compartiendo = { paso: 'error-pdf' };
        return render();
      }
    }
    try {
      const r = await compartirPdf(plataformaDelNavegador(), pdfListo);
      compartiendo = r === 'sin-activacion' ? { paso: 'pdf-listo' } : null;
    } catch (err) {
      console.error(err);
      compartiendo = { paso: 'error-pdf' };
    }
    if (!compartiendo) pdfListo = null;
    return render();
  }
  if (accion === 'compartir-link' || accion === 'compartir-texto') {
    if (!recetaLeida) return;
    const { entrada, receta } = recetaLeida;
    const categoria = entrada?.categoria ?? '';
    const que = accion === 'compartir-link' ? 'link' : 'texto';
    let contenido = '';
    try {
      const plataforma = plataformaDelNavegador();
      contenido = que === 'link' ? urlDeLink(await codificar(receta, categoria)) : textoReceta(receta, categoria);
      const r = que === 'link'
        ? await compartirLink(plataforma, receta.titulo ?? '', contenido)
        : await compartirTexto(plataforma, contenido);
      compartiendo = r === 'copiado' ? { paso: 'copiado', que }
        : r === 'sin-portapapeles' ? { paso: 'mostrar', que, contenido }
        : null;
    } catch (err) {
      console.error(err);
      compartiendo = contenido ? { paso: 'mostrar', que, contenido } : null;
    }
    return render();
  }
```

Nota de tipos: después del `if (accion === 'compartir-pdf' || !pdfListo)` TypeScript no sabe que `pdfListo` no es `null`. Si el typecheck lo marca, guardar el archivo en una constante local: `const archivo = pdfListo; if (!archivo) return;` antes del `try` de `compartirPdf` y pasar `archivo`.

- [ ] **Paso 9: Correr**

Run: `npm test && npm run typecheck`
Esperado: todo verde.

---

### Tarea 10: La vista de invitado

**Archivos:**
- Modificar: `src/ui/router.ts`
- Crear: `src/ui/invitado.ts`, `src/invitado.ts`
- Test: `tests/router.test.ts` (sumar), `tests/vista-invitado.test.ts`, `tests/invitado.test.ts`

**Interfaces:**
- Consume: `fichaCabecera`, `fichasDelCuerpo`, `botonCocinar`, `pieDeAcciones` (T8); `renderCocina` con `salidas` (T8); `crearControlCocina` (T8); `pintar`, `conClosest` (T8); `decodificar` (T4).
- Produce: `rutaDeInvitado(hash: unknown): { vista: 'lectura' | 'cocina'; carga: string } | null`; `esHashDeInvitado(hash: unknown): boolean`; `renderInvitado({ receta, categoria }): string`; `renderLinkRoto(): string`; `ACCIONES_DE_INVITADO`; `iniciarInvitado(): void`.

- [ ] **Paso 1: Tests del router** — al final de `tests/router.test.ts` (sumar `rutaDeInvitado, esHashDeInvitado` al import):

```ts
describe('rutaDeInvitado', () => {
  it('lectura y cocina, con la carga', () => {
    expect(rutaDeInvitado('#/ver?r=1abc')).toEqual({ vista: 'lectura', carga: '1abc' });
    expect(rutaDeInvitado('#/ver/cocinar?r=1abc')).toEqual({ vista: 'cocina', carga: '1abc' });
  });
  it('sin carga, la carga es vacía; otra cosa no es de invitado', () => {
    expect(rutaDeInvitado('#/ver')).toEqual({ vista: 'lectura', carga: '' });
    expect(rutaDeInvitado('#/r/f1')).toBeNull();
    expect(rutaDeInvitado('')).toBeNull();
    expect(esHashDeInvitado('#/ver?r=x')).toBe(true);
    expect(esHashDeInvitado('#/verduras')).toBe(false);
  });
});
```

- [ ] **Paso 2: Test de la vista**

```ts
// tests/vista-invitado.test.ts
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

  it('sin ingredientes ni pasos no hay pie', () => {
    expect(renderInvitado({ receta: parse('---\ntitulo: A\n---\n'), categoria: '' })).not.toContain('class="pie"');
  });

  it('el link roto lo dice y no ofrece nada', () => {
    const html = renderLinkRoto();
    expect(html).toContain('Este link está roto o incompleto.');
    expect(acciones(html)).toEqual([]);
  });
});
```

- [ ] **Paso 3: Test del controlador**

```ts
// tests/invitado.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';
import { parse } from '../src/recipe.js';
import { codificar } from '../src/link-receta.js';

const esperar = async (vueltas = 8) => { for (let i = 0; i < vueltas; i++) await new Promise(r => setTimeout(r, 0)); };

async function montar(hash: string) {
  const clicks: ((e: unknown) => unknown)[] = [];
  const listeners: Record<string, () => void> = {};
  const app = { innerHTML: '', addEventListener: (ev: string, fn: (e: unknown) => unknown) => { if (ev === 'click') clicks.push(fn); } };
  const reemplazos: string[] = [];
  const atras: number[] = [];
  global.document = comoGlobal<Document>({
    title: '', visibilityState: 'visible',
    querySelector: (sel: string) => (sel === '#app' ? app : null),
    addEventListener: () => {}
  });
  global.window = comoGlobal<Window & typeof globalThis>({
    addEventListener: (ev: string, fn: () => void) => { listeners[ev] = fn; }, scrollTo: () => {}, scrollY: 0
  });
  global.location = comoGlobal<Location>({ hash, replace: (h: string) => { reemplazos.push(h); global.location.hash = h; } });
  global.history = comoGlobal<History>({ back: () => { atras.push(1); } });

  const { iniciarInvitado } = await import('../src/invitado.js');
  iniciarInvitado();
  await esperar();
  return {
    app, reemplazos, atras,
    abrir: async (h: string) => { global.location.hash = h; listeners['hashchange']?.(); await esperar(); },
    tocar: async (accion: string, datos: Record<string, string> = {}) => {
      const boton = { dataset: { accion, ...datos } };
      for (const fn of clicks) await fn({ target: { closest: () => boton } });
      await esperar();
    }
  };
}

describe('el controlador del invitado', () => {
  afterEach(() => { limpiarGlobales(); vi.resetModules(); });

  const cargaDe = () => codificar(parse('---\ntitulo: Rabas\n---\n\n## Ingredientes\n- Calamar\n\n## Preparación\n1. Lavar.\n2. Freír.\n'), 'Pescados');

  it('dibuja la receta del link y pone su título a la pestaña', async () => {
    const carga = await cargaDe();
    const { app } = await montar(`#/ver?r=${carga}`);
    expect(app.innerHTML).toContain('class="rec-tit">Rabas<');
    expect(global.document.title).toBe('Rabas');
  });

  it('Cocinar lleva a la cocina del invitado, sin Salir; el chevron vuelve atrás', async () => {
    const carga = await cargaDe();
    const { app, tocar, abrir, atras } = await montar(`#/ver?r=${carga}`);
    await tocar('cocinar');
    expect(global.location.hash).toBe(`#/ver/cocinar?r=${carga}`);
    await abrir(`#/ver/cocinar?r=${carga}`);
    expect(app.innerHTML).toContain('class="coc"');
    expect(app.innerHTML).not.toContain('salir-cocina');
    await tocar('volver-receta');
    expect(atras).toHaveLength(1);
  });

  it('con un link directo a la cocina, el chevron reemplaza por la lectura', async () => {
    const carga = await cargaDe();
    const { tocar, reemplazos } = await montar(`#/ver/cocinar?r=${carga}`);
    await tocar('volver-receta');
    expect(reemplazos).toEqual([`#/ver?r=${carga}`]);
  });

  it('marcar un paso se dibuja', async () => {
    const carga = await cargaDe();
    const { app, tocar } = await montar(`#/ver/cocinar?r=${carga}`);
    await tocar('conmutar', { posicion: 'pasos' });
    await tocar('paso', { paso: '0' });
    expect(app.innerHTML).toContain('<li class="hecho" data-accion="paso" data-paso="0">');
  });

  it('un link roto lo dice', async () => {
    const { app } = await montar('#/ver?r=1roto');
    expect(app.innerHTML).toContain('Este link está roto o incompleto.');
  });
});
```

- [ ] **Paso 4: Correr y ver que fallan**

Run: `npx vitest run tests/router.test.ts tests/vista-invitado.test.ts tests/invitado.test.ts`
Esperado: FAIL (faltan exports y módulos).

- [ ] **Paso 5: Router** — al final de `src/ui/router.ts`:

```ts
/** La vista de invitado: la receta que viaja en el link, sin login (spec P23 §3). */
export interface RutaInvitado {
  vista: 'lectura' | 'cocina';
  carga: string;
}

export function rutaDeInvitado(hash: unknown): RutaInvitado | null {
  const limpio = String(hash ?? '').replace(/^#/, '');
  const [ruta = '', query = ''] = limpio.split('?');
  const partes = ruta.split('/').filter(Boolean);
  if (partes[0] !== 'ver') return null;
  const carga = new URLSearchParams(query).get('r') ?? '';
  return { vista: partes[1] === 'cocinar' ? 'cocina' : 'lectura', carga };
}

export const esHashDeInvitado = (hash: unknown): boolean => rutaDeInvitado(hash) !== null;
```

- [ ] **Paso 6: `src/ui/invitado.ts`**

```ts
/**
 * La vista de invitado: la receta de un link, para quien no usa la app (spec
 * P23 §3). Es una pantalla propia, armada con las piezas de la receta: su
 * cabecera no lleva marcas, no hay encabezado, y la única acción es Cocinar.
 */
import { vacio } from './componentes.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import type { Receta } from '../tipos.js';

export function renderInvitado({ receta, categoria }: { receta: Receta; categoria: string }): string {
  return '<div class="cuerpo">' + fichaCabecera({ receta, categoria }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta));
}

export const renderLinkRoto = (): string =>
  `<div class="cuerpo">${vacio('Este link está roto o incompleto.')}</div>`;
```

- [ ] **Paso 7: `src/invitado.ts`**

```ts
/**
 * El controlador de la vista de invitado. No carga nada de la app: ni store,
 * ni token, ni el manejador de acciones de `main.ts`. Escucha sólo las acciones
 * de su lista; una acción nueva de la app no llega acá aunque use el mismo nombre.
 */
import { pintar, conClosest } from './ui/pintar.js';
import { renderInvitado, renderLinkRoto } from './ui/invitado.js';
import { renderCocina } from './ui/cocina.js';
import { rutaDeInvitado } from './ui/router.js';
import { decodificar } from './link-receta.js';
import { crearControlCocina } from './cocina-control.js';
import type { Receta } from './tipos.js';

export const ACCIONES_DE_INVITADO = ['cocinar', 'volver-receta', 'conmutar', 'paso', 'wake'] as const;

export function iniciarInvitado(): void {
  const cocina = crearControlCocina();
  /** La receta decodificada, por carga: los redibujados no vuelven a descomprimir. */
  let leida: { carga: string; receta: Receta; categoria: string } | null = null;
  let vistaAnterior: 'lectura' | 'cocina' | null = null;

  async function render(): Promise<void> {
    const ruta = rutaDeInvitado(location.hash);
    if (!ruta) return;
    if (leida?.carga !== ruta.carga) {
      const datos = await decodificar(ruta.carga);
      leida = datos ? { carga: ruta.carga, ...datos } : null;
    }
    if (!leida) {
      document.title = 'Recetario';
      return pintar(renderLinkRoto());
    }
    document.title = leida.receta.titulo ?? 'Recetario';
    if (ruta.vista !== vistaAnterior) {
      // Pantalla nueva: arriba de todo, y la cocina desde el principio (C03.2.4).
      cocina.reiniciar();
      window.scrollTo?.(0, 0);
      vistaAnterior = ruta.vista;
    }
    if (ruta.vista === 'lectura') return pintar(renderInvitado({ receta: leida.receta, categoria: leida.categoria }));
    return pintar(renderCocina({ receta: leida.receta, ...cocina.estado(), salidas: 'solo-volver' }));
  }

  document.querySelector('#app')?.addEventListener('click', async (e) => {
    const boton = conClosest(e.target)?.closest<HTMLElement>('[data-accion]') ?? null;
    if (!boton || !leida) return;
    const accion = boton.dataset['accion'];
    const lectura = `#/ver?r=${leida.carga}`;

    if (accion === 'cocinar') {
      cocina.entrarDesdeLectura();
      location.hash = `#/ver/cocinar?r=${leida.carga}`;
      return;
    }
    if (accion === 'volver-receta') {
      await cocina.soltarPantalla();
      if (cocina.salirALectura() === 'atras') return history.back();
      location.replace(lectura);
      return;
    }
    if (accion === 'conmutar') {
      const volverA = cocina.conmutar(boton.dataset['posicion'], window.scrollY);
      if (volverA === null) return;
      await render();
      window.scrollTo?.(0, volverA);
      return;
    }
    if (accion === 'paso') {
      if (cocina.marcarPaso(boton.dataset['paso'])) await render();
      return;
    }
    if (accion === 'wake') {
      await cocina.alternarPantalla();
      await render();
    }
  });

  window.addEventListener('hashchange', () => { void render(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const sol = document.querySelector('[data-accion="wake"].on');
    if (cocina.necesitaRepedir(!!sol)) void cocina.mantenerPantalla().then(render);
  });

  void render();
}
```

Nota: el doble de `location.replace` del test no dispara `hashchange`; en el navegador sí, y `render` dibuja la lectura.

- [ ] **Paso 8: Correr**

Run: `npx vitest run tests/router.test.ts tests/vista-invitado.test.ts tests/invitado.test.ts && npm run typecheck`
Esperado: PASS.

---

### Tarea 11: La entrada que decide

**Archivos:**
- Crear: `src/inicio.ts`
- Modificar: `index.html`, `src/main.ts` (sacar los imports de CSS)
- Test: `tests/inicio.test.ts`

- [ ] **Paso 1: Test**

```ts
// tests/inicio.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { comoGlobal, limpiarGlobales } from './dom-falso.js';

const cargados = vi.hoisted(() => ({ main: 0, invitado: 0 }));
vi.mock('../src/ui/tokens.css', () => ({}));
vi.mock('../src/ui/base.css', () => ({}));
vi.mock('../src/main.js', () => { cargados.main++; return {}; });
vi.mock('../src/invitado.js', () => ({ iniciarInvitado: () => { cargados.invitado++; } }));

const esperar = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

describe('la entrada', () => {
  afterEach(() => { limpiarGlobales(); vi.resetModules(); cargados.main = 0; cargados.invitado = 0; });

  it('#/ver… carga el invitado y no la app', async () => {
    global.location = comoGlobal<Location>({ hash: '#/ver?r=1abc' });
    await import('../src/inicio.js');
    await esperar();
    expect(cargados).toEqual({ main: 0, invitado: 1 });
  });

  it('cualquier otro hash carga la app', async () => {
    global.location = comoGlobal<Location>({ hash: '#/r/f1' });
    await import('../src/inicio.js');
    await esperar();
    expect(cargados).toEqual({ main: 1, invitado: 0 });
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

Run: `npx vitest run tests/inicio.test.ts`
Esperado: FAIL (no existe `inicio.js`).

- [ ] **Paso 3: `src/inicio.ts`**

```ts
/**
 * La entrada de `index.html`. Decide antes de cargar nada de la app: un link de
 * receta compartida (`#/ver…`) abre la vista de invitado sin login y sin
 * `main.ts`; cualquier otra cosa, la app.
 */
import './ui/tokens.css';
import './ui/base.css';
import { esHashDeInvitado } from './ui/router.js';

if (esHashDeInvitado(location.hash)) {
  void import('./invitado.js').then(m => m.iniciarInvitado());
} else {
  void import('./main.js');
}
```

- [ ] **Paso 4: `index.html` y `main.ts`**

En `index.html`: `<script type="module" src="/src/inicio.ts"></script>`.

En `src/main.ts`: borrar las dos primeras líneas (`import './ui/tokens.css';` y `import './ui/base.css';`).

- [ ] **Paso 5: Correr todo**

Run: `npm test && npm run typecheck && npm run build`
Esperado: todo verde; `dist/assets` con chunks separados para `main`, `invitado` y pdfmake.

- [ ] **Paso 6: Probar en el navegador local (descartable)**

Run: `npm run dev` en segundo plano y, con Playwright:
1. Abrir `http://localhost:8080/recetario/#/ver?r=<carga del baba ganush>` (generarla con `codificar` en un script SSR como el de la Tarea 5). Esperado: la receta sin tags, con Cocinar; tocar Cocinar abre la cocina sin Salir; el chevron vuelve.
2. Abrir `http://localhost:8080/recetario/#/ver?r=1roto`. Esperado: «Este link está roto o incompleto.».
3. Abrir `http://localhost:8080/recetario/`. Esperado: la pantalla de conexión de siempre.
4. En la consola del navegador, sobre la app sin sesión, correr `import('/recetario/src/pdf/generar.ts').then(async m => { const b = await m.generar((await import('/recetario/src/recipe.ts')).parse('---\ntitulo: Prueba ⅓\n---\n## Preparación\n1. Uno.'), 'Otros'); console.log(b.size, b.type); })`. Esperado: un tamaño mayor a 5000 y `application/pdf`: pdfmake funciona dentro de Vite y baja las fuentes por URL.

---

### Tarea 12: Documentación, verificación final y el commit único

**Archivos:**
- Modificar: `product-design/plan/BACKLOG.md`, `product-design/ux/design-system.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-14-compartir-recetas-design.md` (estado)

- [ ] **Paso 1: BACKLOG P23** — reemplazar la celda «Qué hay que hacer» de P23 por:

```
**Resuelto** `[2026-09-14]`. Desde un ícono en el encabezado de la receta: **PDF** (pdfmake con Inter embebida, 105 × 180 mm, tema oscuro), **Link** a una vista de invitado sin login —la receta viaja comprimida en el fragmento, sin tags, y se puede leer y cocinar— y **Texto** para cualquier app, con la negrita y la itálica de WhatsApp. Es una copia del momento: nada queda publicado en Drive. Spec en `docs/superpowers/specs/2026-09-14-compartir-recetas-design.md`, plan en `docs/superpowers/plans/2026-09-14-compartir-recetas.md`. Queda afuera *Guardar en mi Recetario* desde el link.
```

- [ ] **Paso 2: design-system §3.4** — cambiar «Hay exactamente diez en la app: volver, buscar, ajustes, borradores, descartar, editar, borrar, mantener la pantalla encendida, y las dos posiciones del conmutador de cocina —…—.» por «Hay exactamente once en la app: volver, buscar, ajustes, borradores, descartar, editar, borrar, mantener la pantalla encendida, compartir `[del 2026-09-14]`, y las dos posiciones del conmutador de cocina —…—.» (conservando el texto del guion largo tal cual).

- [ ] **Paso 3: CLAUDE.md**
  - En «Lo que queda pendiente», quitar P23 de la lista de abiertos y sumar a «Estado al 2026-09-14» que P23 está resuelto.
  - Agregar un bloque «**Hecho el 2026-09-14 — compartir recetas (P23):** …» junto a los otros «Hecho el…», con «**Falta probarlo en el teléfono.**» y los cuatro puntos del spec §9.1.
  - En «Cómo quedó el código», fila «Es nuevo»: sumar `inicio.ts` (la entrada), `invitado.ts`, `link-receta.ts`, `texto-receta.ts`, `compartir.ts`, `cocina-control.ts`, `src/pdf/` y `src/ui/fichas-receta.ts`.
  - En «Decisiones cerradas — no reabrir», agregar estas filas:

```
| Compartir con un link público al `.md` en Drive | Decidido el 2026-09-14. Pide volver público el archivo y sumar una API key a la app. El link lleva la receta comprimida en el fragmento: 800 a 1250 caracteres el típico, 2075 el más largo, y llega entero y tocable a WhatsApp. |
| Compartir la receta como imagen | Decidido el 2026-09-14. WhatsApp recomprime las imágenes: una receta larga a 1080 px de ancho mide ~10.000 px de alto y la letra no se lee. |
| Armar el PDF con `window.print()` o rasterizando el HTML | Imprimir no es un toque: hay que guardar en Descargas y adjuntar a mano. Rasterizar da un PDF-imagen, pesado y sin texto. |
| jsPDF, PDFKit, pdf-lib, @react-pdf, typst en WASM para el PDF | Medido el 2026-09-14. jsPDF y PDFKit no paginan ni mezclan negrita en un párrafo sin un motor propio; pdf-lib no tiene layout y no se publica desde 2021; @react-pdf exige React; typst son 10,7 MB. pdfmake arma listas, paginación y fondo de forma declarativa. |
| Roboto en el PDF | No tiene ⅓ ni ⅔ (verificado en tres archivos). En pantalla Android la completa con otra fuente; un PDF no. Inter sí los tiene. |
| El texto compartido en texto plano neutro | Decidido el 2026-09-14: se conserva `*negrita*`, `_itálica_`, `- ` y `1. ` porque WhatsApp los entiende; en otra app se ven los asteriscos. |
| La vista de invitado como un modo de la receta | Decidido el 2026-09-14. Es una pantalla con controlador propio y una lista cerrada de acciones, armada con las mismas piezas: lo que se agregue a la receta no aparece en el invitado sin querer. |
```

- [ ] **Paso 4: Estado del spec** — cambiar `**Estado:** Aprobado en conversación; pendiente de revisión escrita.` por `**Estado:** Implementado el 2026-09-14; falta probarlo en el teléfono.`

- [ ] **Paso 5: Verificación final**

Run: `npm test && npm run typecheck && npm run build`
Esperado: todo verde. Anotar la cantidad de tests.

- [ ] **Paso 6: Mostrar el diff y esperar el visto bueno**

Run: `git status && git diff --stat`
Mostrar al usuario el resumen y los archivos. **No commitear hasta que lo apruebe.**

- [ ] **Paso 7: El commit único y el push**

```bash
git add -A
git status   # verificar que no entran archivos del scratchpad ni .ver-pdf.mjs
git commit -m "$(cat <<'EOF'
Compartir recetas: PDF, link a una vista de invitado y texto (P23)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

Esperado: un solo commit nuevo sobre `main`; el workflow de Pages publica. Probar en el teléfono lo del spec §9.1.
