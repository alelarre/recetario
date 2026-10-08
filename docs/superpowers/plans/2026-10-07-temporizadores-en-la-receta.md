# Temporizadores en la receta — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marcas `[texto](cuenta:50:00 "etiqueta")` y `[texto](cronometro: "etiqueta")` en el cuerpo de la receta, que en la receta y el modo cocina son un botón que crea el temporizador; cronómetros con nombre en Temporizadores; y el botón de foto del editor generalizado a un botón de herramientas por línea.

**Architecture:** Un módulo puro nuevo, `src/marcas.ts`, sabe leer y escribir una marca y lo usan el renderer (`src/ui/markdown.ts`, que suma un tramo `temporizador` a `TramoEnLinea`), `validar.ts`, el índice, el invitado y el editor. El modelo de `src/temporizadores.ts` suma el cronómetro con nombre a la lista. Una sola acción, `crear-temporizador`, crea un temporizador desde cualquier botón `.ico-min` —receta, cocina y Referencias— con un bloqueo de 2 s contra el doble toque. El editor reemplaza su botón de foto por uno de herramientas cuya capa sale de una tabla (`src/ui/herramientas-editor.ts`).

**Tech Stack:** TypeScript estricto + Vite, sin framework; Vitest en Node con el DOM a mano de `tests/dom-falso.ts`.

**Spec:** `docs/superpowers/specs/2026-10-07-temporizadores-en-la-receta-design.md`

## Global Constraints

- Todo en español rioplatense: código, comentarios, UI y documentos.
- TypeScript con `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Sin `instanceof` contra clases del navegador en `src/`.
- **No se commitea nada hasta que el usuario revisa el diff** (`CLAUDE.md` §Cómo se trabaja). Cada tarea termina con los tests en verde y el trabajo en el árbol, sin commit. La tarea 11 muestra el diff y commitea con el visto bueno.
- Duración de una marca: `m:ss` o `h:mm:ss`; minutos y segundos después del primer número con dos cifras; de más de 0 a 23:59:59.
- Nombre de un temporizador desde una marca: etiqueta → `texto` → `nombreDeDuracion(ms)` (cuenta) / «Cronómetro» (cronómetro).
- `.ico-min`: 24 px, ícono de 14 px, área de toque 10 px más por lado. Bloqueo contra el doble toque: 2000 ms con tilde en `--exito`.
- El frontmatter y `SCHEMA_VERSION` no cambian.
- Un comentario no cita el backlog ni secciones del spec de `docs/superpowers/`; sí puede citar `product-design/` (`C07.5b.1`, `C04.3d.1`, IA §4.6).
- Al final, `npm test`, `npm run typecheck` y `npm run build` en verde.

## Review Focus

- **Una marca mal cerrada** (`[x](cuenta:5:00 "hornear)` sin comilla final, o una etiqueta con `)`) tiene que leerse como texto común y no partir el resto de la línea ni dejar sintaxis a la vista. Test en la tarea 3.
- **Una lista guardada vieja** (sólo cuentas) y una con un elemento roto tienen que leerse sin perder lo demás. Test en la tarea 4.
- **Tocar el botón dos veces en menos de 2 s** crea uno solo; tocar después de los 2 s crea otro. Test en la tarea 6.
- **El modo cocina**: tocar el botón de un paso no marca el paso (el `<li>` tiene `data-accion="paso"`). Test en la tarea 6.
- **El editor sin fotos**: el botón de herramientas aparece igual y la entrada Foto va deshabilitada; antes, sin fotos, no había botón. Test en la tarea 9.

---

### Task 1: `src/marcas.ts` — leer y escribir una marca

**Files:**
- Create: `src/marcas.ts`
- Test: `tests/marcas.test.ts`

**Interfaces:**
- Consumes: `formatear`, `nombreDeDuracion` de `src/temporizadores.ts`; `Receta` de `src/tipos.ts`.
- Produces:
  - `type TipoMarca = 'cuenta' | 'cronometro'`
  - `interface Marca { tipo: TipoMarca; texto: string; etiqueta: string; duracion: number | null }` (ms en una cuenta, `null` en un cronómetro)
  - `DURACION_MAXIMA: number`
  - `PATRON_MARCA: RegExp` (global; grupos: 1 texto, 2 esquema, 3 valor, 4 resto)
  - `leerDuracion(s: string): number | null`
  - `leerMarca(texto: string, esquema: string, valor: string, resto: string): Marca | null`
  - `nombreDeMarca(m: Marca): string`
  - `escribirMarca(m: { tipo: TipoMarca; duracion: number | null; etiqueta: string }, texto?: string): string`
  - `quitarMarcas(texto: string): string`
  - `marcasMalFormadas(texto: string): string[]`
  - `agregarAlFinal(texto: string, linea: number, pedazo: string): string`
  - `sinMarcas(receta: Receta): Receta`

- [ ] **Step 1: Escribir los tests**

```ts
// tests/marcas.test.ts
import { describe, it, expect } from 'vitest';
import {
  leerDuracion, leerMarca, nombreDeMarca, escribirMarca, quitarMarcas, marcasMalFormadas,
  agregarAlFinal, sinMarcas, PATRON_MARCA, DURACION_MAXIMA
} from '../src/marcas.js';
import { parse } from '../src/recipe.js';

const MIN = 60_000;
const marcaDe = (s: string) => {
  const m = [...s.matchAll(PATRON_MARCA)][0];
  return m ? leerMarca(m[1] ?? '', m[2] ?? '', m[3] ?? '', m[4] ?? '') : undefined;
};

describe('la duración', () => {
  it('m:ss y h:mm:ss', () => {
    expect(leerDuracion('0:30')).toBe(30_000);
    expect(leerDuracion('50:00')).toBe(50 * MIN);
    expect(leerDuracion('1:30:00')).toBe(90 * MIN);
    expect(leerDuracion('23:59:59')).toBe(DURACION_MAXIMA);
  });
  it('lo que no se lee, cero o más de 23:59:59 no es duración', () => {
    for (const s of ['', '50', '1:5', '1:5:00', '1:60', 'a:00', '0:00', '0:00:00', '24:00:00', '1:00:00:00', ' 5:00']) {
      expect(leerDuracion(s)).toBeNull();
    }
  });
});

describe('leer una marca', () => {
  it('una cuenta con texto y etiqueta', () => {
    expect(marcaDe('durante [50 minutos](cuenta:50:00 "cocinar").'))
      .toEqual({ tipo: 'cuenta', texto: '50 minutos', etiqueta: 'cocinar', duracion: 50 * MIN });
  });
  it('sin etiqueta y sin texto', () => {
    expect(marcaDe('[](cuenta:4:00)')).toEqual({ tipo: 'cuenta', texto: '', etiqueta: '', duracion: 4 * MIN });
  });
  it('un cronómetro, con y sin etiqueta', () => {
    expect(marcaDe('[hasta que esté liso](cronometro: "amasar")'))
      .toEqual({ tipo: 'cronometro', texto: 'hasta que esté liso', etiqueta: 'amasar', duracion: null });
    expect(marcaDe('[](cronometro:)')).toEqual({ tipo: 'cronometro', texto: '', etiqueta: '', duracion: null });
  });
  it('mal formadas: null', () => {
    expect(marcaDe('[x](cuenta:5)')).toBeNull();
    expect(marcaDe('[x](cuenta:0:00)')).toBeNull();
    expect(marcaDe('[x](cuenta:5:00 hornear)')).toBeNull();
    expect(marcaDe('[x](cuenta:5:00 "hornear)')).toBeNull();
    expect(marcaDe('[x](cronometro:5:00)')).toBeNull();
  });
  it('un link común no es marca', () => {
    expect(marcaDe('[sitio](https://a.com)')).toBeUndefined();
  });
});

describe('el nombre', () => {
  it('la etiqueta, el texto, o el de por defecto', () => {
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: 'cocinar', duracion: 50 * MIN })).toBe('cocinar');
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '50 minutos', etiqueta: '', duracion: 50 * MIN })).toBe('50 minutos');
    expect(nombreDeMarca({ tipo: 'cuenta', texto: '', etiqueta: '', duracion: 50 * MIN })).toBe('50 min');
    expect(nombreDeMarca({ tipo: 'cronometro', texto: '', etiqueta: '', duracion: null })).toBe('Cronómetro');
  });
});

describe('escribir una marca', () => {
  it('cuenta y cronómetro, con y sin etiqueta', () => {
    expect(escribirMarca({ tipo: 'cuenta', duracion: 50 * MIN, etiqueta: 'cocinar' })).toBe('[](cuenta:50:00 "cocinar")');
    expect(escribirMarca({ tipo: 'cuenta', duracion: 90 * MIN, etiqueta: '' })).toBe('[](cuenta:1:30:00)');
    expect(escribirMarca({ tipo: 'cronometro', duracion: null, etiqueta: ' amasar ' })).toBe('[](cronometro: "amasar")');
    expect(escribirMarca({ tipo: 'cronometro', duracion: null, etiqueta: '' }, 'liso')).toBe('[liso](cronometro:)');
  });
  it('la etiqueta pierde lo que rompería la marca', () => {
    expect(escribirMarca({ tipo: 'cuenta', duracion: MIN, etiqueta: 'a "b") [c]\nd' })).toBe('[](cuenta:1:00 "a b c d")');
  });
  it('lo escrito se vuelve a leer igual', () => {
    expect(marcaDe(escribirMarca({ tipo: 'cuenta', duracion: 50 * MIN, etiqueta: 'cocinar' })))
      .toEqual({ tipo: 'cuenta', texto: '', etiqueta: 'cocinar', duracion: 50 * MIN });
  });
});

describe('quitar y revisar', () => {
  it('quitarMarcas deja el texto de cada marca, válida o no', () => {
    expect(quitarMarcas('durante [50 minutos](cuenta:50:00 "cocinar"). [](cuenta:4:00) [x](cuenta:9)'))
      .toBe('durante 50 minutos.  x');
  });
  it('marcasMalFormadas da las que no se leen', () => {
    expect(marcasMalFormadas('[a](cuenta:5:00) [b](cuenta:5) [c](cronometro:1:00)')).toEqual(['[b](cuenta:5)', '[c](cronometro:1:00)']);
  });
  it('agregarAlFinal: con un espacio, o solo en una línea vacía; fuera de rango no cambia', () => {
    expect(agregarAlFinal('Freír.\nServir.', 1, '[](cronometro:)')).toBe('Freír.\nServir. [](cronometro:)');
    expect(agregarAlFinal('Freír.\n', 1, '[](cronometro:)')).toBe('Freír.\n[](cronometro:)');
    expect(agregarAlFinal('Freír.', 3, '[](cronometro:)')).toBe('Freír.');
  });
  it('sinMarcas limpia todo el cuerpo y deja el frontmatter', () => {
    const r = parse('---\ntitulo: T\n---\nDesc [5 min](cuenta:5:00).\n\n## Preparación\n\n1. Hornear [](cuenta:1:00:00 "horno").\n\n## Pasos extra\n\nOtra [x](cronometro:)\n');
    const limpia = sinMarcas(r);
    expect(limpia.titulo).toBe('T');
    expect(limpia.descripcion).not.toContain('cuenta:');
    expect(limpia.preparacion).toBe('1. Hornear .');
    expect(limpia.otras[0]?.cuerpo).toBe('Otra x');
  });
});
```

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/marcas.test.ts`
Expected: FAIL, «Failed to resolve import "../src/marcas.js"».

- [ ] **Step 3: Escribir `src/marcas.ts`**

```ts
/**
 * Las marcas de temporizador del cuerpo de una receta (`E05-Cimientos.md`):
 * `[texto](cuenta:50:00 "etiqueta")` crea una cuenta regresiva y
 * `[texto](cronometro: "etiqueta")` un cronómetro con nombre. Tienen forma de
 * link para que fuera de la app la frase se siga leyendo. Puro: lo usan el
 * dibujo, `validar`, el índice, el invitado y el editor.
 */
import { formatear, nombreDeDuracion } from './temporizadores.js';
import type { Receta } from './tipos.js';

export type TipoMarca = 'cuenta' | 'cronometro';

export interface Marca {
  tipo: TipoMarca;
  /** Lo que se lee en la frase; puede estar vacío. */
  texto: string;
  /** El nombre que se le dio; vacío si no tiene. */
  etiqueta: string;
  /** En ms, en una cuenta; un cronómetro no tiene. */
  duracion: number | null;
}

/** 23:59:59, el tope de las ruedas de Temporizadores. */
export const DURACION_MAXIMA = ((23 * 60 + 59) * 60 + 59) * 1000;

/**
 * Una marca, válida o no: el texto, el esquema, lo que sigue a los dos puntos
 * y el resto hasta el paréntesis, donde va la etiqueta. Lo que no calza con la
 * forma de la etiqueta lo decide `leerMarca`, así una mal escrita se reconoce
 * igual y se lee como texto común en vez de quedar a la vista.
 */
export const PATRON_MARCA = /\[([^\]]*)\]\((cuenta|cronometro):([^)\s]*)([^)]*)\)/g;

const DURACION = /^(?:(\d+):([0-5]\d):([0-5]\d)|(\d+):([0-5]\d))$/;

/** `m:ss` o `h:mm:ss` en ms; `null` si no se lee, si es cero o si pasa de 23:59:59. */
export function leerDuracion(s: string): number | null {
  const m = DURACION.exec(s);
  if (!m) return null;
  const [, h, mh, sh, mm, sm] = m;
  const segundos = h !== undefined
    ? (Number(h) * 60 + Number(mh)) * 60 + Number(sh)
    : Number(mm) * 60 + Number(sm);
  const ms = segundos * 1000;
  return ms > 0 && ms <= DURACION_MAXIMA ? ms : null;
}

/** Las partes que encontró `PATRON_MARCA`, como marca; `null` si está mal formada. */
export function leerMarca(texto: string, esquema: string, valor: string, resto: string): Marca | null {
  const r = resto.trim();
  const conEtiqueta = /^"([^"]*)"$/.exec(r);
  if (r && !(conEtiqueta && /^\s/.test(resto))) return null;
  const etiqueta = conEtiqueta?.[1]?.trim() ?? '';
  if (esquema === 'cuenta') {
    const duracion = leerDuracion(valor);
    return duracion === null ? null : { tipo: 'cuenta', texto, etiqueta, duracion };
  }
  if (esquema === 'cronometro' && valor === '') return { tipo: 'cronometro', texto, etiqueta, duracion: null };
  return null;
}

/** El nombre del temporizador que crea: la etiqueta, el texto, o el de uno creado sin nombre. */
export function nombreDeMarca(m: Marca): string {
  return m.etiqueta.trim() || m.texto.trim() ||
    (m.tipo === 'cuenta' && m.duracion !== null ? nombreDeDuracion(m.duracion) : 'Cronómetro');
}

/** Sin comillas, corchetes ni paréntesis, en un renglón: lo que no rompe la marca. */
const etiquetaLimpia = (s: string): string => s.replace(/["()[\]]/g, '').replace(/\s+/g, ' ').trim();

/** La marca escrita, con `texto` entre los corchetes; vacío por defecto, como la escribe el editor. */
export function escribirMarca(m: { tipo: TipoMarca; duracion: number | null; etiqueta: string }, texto = ''): string {
  const etiqueta = etiquetaLimpia(m.etiqueta);
  const valor = m.tipo === 'cuenta' ? formatear(m.duracion ?? 0) : '';
  return `[${texto}](${m.tipo}:${valor}${etiqueta ? ` "${etiqueta}"` : ''})`;
}

/** El texto con cada marca cambiada por lo que se lee de ella. */
export const quitarMarcas = (texto: string): string => texto.replace(PATRON_MARCA, (_, t: string) => t);

/** Las marcas del texto que no se pueden leer, tal como están escritas. */
export function marcasMalFormadas(texto: string): string[] {
  return [...texto.matchAll(PATRON_MARCA)]
    .filter(m => leerMarca(m[1] ?? '', m[2] ?? '', m[3] ?? '', m[4] ?? '') === null)
    .map(m => m[0]);
}

/**
 * Agrega algo al final de una línea —la del cursor—, con un espacio antes; en
 * una línea vacía queda solo. Si la línea no existe, el texto no cambia.
 */
export function agregarAlFinal(texto: string, linea: number, pedazo: string): string {
  const lineas = texto.split('\n');
  const actual = lineas[linea];
  if (actual === undefined) return texto;
  lineas[linea] = actual ? `${actual} ${pedazo}` : pedazo;
  return lineas.join('\n');
}

/** La receta con el cuerpo sin marcas: la del invitado, que no tiene temporizadores. */
export function sinMarcas(receta: Receta): Receta {
  return {
    ...receta,
    descripcion: quitarMarcas(receta.descripcion),
    ingredientes: quitarMarcas(receta.ingredientes),
    preparacion: quitarMarcas(receta.preparacion),
    variaciones: quitarMarcas(receta.variaciones),
    notas: quitarMarcas(receta.notas),
    otras: receta.otras.map(o => ({ ...o, cuerpo: quitarMarcas(o.cuerpo) }))
  };
}
```

- [ ] **Step 4: Correr los tests**

Run: `npx vitest run tests/marcas.test.ts`
Expected: PASS. Si `sinMarcas` falla por cómo `parse` nombra una sección desconocida, ajustar sólo el test al nombre que da `parse` (`receta.otras`).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sin errores. Sin commit (ver Global Constraints).

---

### Task 2: Los íconos y `.ico-min` en el sistema

**Files:**
- Modify: `src/ui/iconos.ts` (sumar `relojMas`, `cronometro`, `cronometroMas`, `herramienta`, `tilde`)
- Modify: `src/ui/base.css:701-704` (sacar `.ico-min`) y `src/ui/tokens.css` (ponerla, achicada)
- Test: `tests/estilos-boton.test.ts` (o el archivo de estilos donde encaje; ver Step 1)

**Interfaces:**
- Produces: `ICO.relojMas`, `ICO.cronometro`, `ICO.cronometroMas`, `ICO.herramienta`, `ICO.tilde`; la clase `.ico-min` en `tokens.css`.

- [ ] **Step 1: Test de la clase**

Mirar cómo leen el CSS los tests de estilos (`tests/estilos-fotos.test.ts` lee `TOKENS` con `readFileSync`). Sumar en `tests/estilos-boton.test.ts`, con el mismo patrón:

```ts
it('.ico-min es del sistema: 24 px, ícono de 14 y 10 px más de toque', () => {
  expect(TOKENS).toMatch(/\.ico-min\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px/);
  expect(TOKENS).toMatch(/\.ico-min svg\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px/);
  expect(TOKENS).toMatch(/\.ico-min::after\s*\{[^}]*inset:\s*-10px/);
  expect(BASE).not.toMatch(/\.ico-min\s*\{/);
});
it('en el modo cocina crece con el texto', () => {
  expect(TOKENS).toMatch(/\.coc \.ico-min svg\s*\{[^}]*width:\s*var\(--ico-cocina\)/);
});
```

(Si el archivo no define `TOKENS` y `BASE`, definirlos como en `estilos-fotos.test.ts`.)

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run tests/estilos-boton.test.ts`
Expected: FAIL en los dos tests nuevos.

- [ ] **Step 3: Mover y achicar la clase**

Borrar de `src/ui/base.css` las tres reglas `.ico-min`, `.ico-min::after` y `.ico-min svg` (líneas 701-704). En `src/ui/tokens.css`, junto a los componentes de botón, agregar:

```css
/* §6.30b — El botón que crea un temporizador al lado de un texto: una marca
   de la receta o una fila de Referencias. El ícono lleva su «+»; recién
   tocado muestra la tilde. El área de toque es 10 px más grande por lado. */
.ico-min { position: relative; display: inline-grid; place-items: center; width: 24px; height: 24px; padding: 0;
           margin-left: var(--e-1); vertical-align: middle; background: none;
           border: 1px solid var(--borde-fuerte); border-radius: var(--r-chico); color: var(--fg-2); cursor: pointer; }
.ico-min::after { content: ''; position: absolute; inset: -10px; }
.ico-min svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ico-min.hecho { color: var(--exito); border-color: var(--exito); }
.coc .ico-min { width: 36px; height: 36px; }
.coc .ico-min svg { width: var(--ico-cocina); height: var(--ico-cocina); }
```

(Si `--r-chico` no existe en `tokens.css`, usar el radio que use `.poner-foto`.)

- [ ] **Step 4: Los íconos**

En `src/ui/iconos.ts`, después de `reloj`:

```ts
  /** El reloj con un «+» donde se abre el círculo: crea una cuenta regresiva. */
  relojMas: svg('<path d="M21 12a9 9 0 1 0-9 9"/><path d="M12 7v5l3 2"/><path d="M19 16v6M16 19h6"/>'),
  /** El cronómetro: una aguja y el botón arriba. */
  cronometro: svg('<circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M10 2h4M12 2v3"/>'),
  /** El cronómetro con el «+»: crea uno. */
  cronometroMas: svg('<path d="M20 13a8 8 0 1 0-8 8"/><path d="M12 13V9"/><path d="M10 2h4M12 2v3"/><path d="M19 16v6M16 19h6"/>'),
  /** La llave inglesa del botón de herramientas del editor. */
  herramienta: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.4-.4-2.1z"/>'),
  /** Hecho: el temporizador se creó. */
  tilde: svg('<path d="M5 12l5 5 9-10"/>'),
```

- [ ] **Step 5: Correr tests y typecheck**

Run: `npx vitest run tests/estilos-boton.test.ts tests/vista-referencias.test.ts && npm run typecheck`
Expected: PASS.

---

### Task 3: El renderer lee las marcas

**Files:**
- Modify: `src/ui/markdown.ts`
- Test: `tests/markdown.test.ts`

**Interfaces:**
- Consumes: `PATRON_MARCA`, `leerMarca`, `nombreDeMarca`, `Marca` de `src/marcas.ts`; `ICO.relojMas`, `ICO.cronometroMas`.
- Produces:
  - `TramoEnLinea.temporizador?: { tipo: TipoMarca; duracion: number | null; nombre: string }`
  - `botonTemporizador(t: { tipo: TipoMarca; duracion: number | null; nombre: string }): string`, el `<button class="ico-min" data-accion="crear-temporizador" data-tipo="cuenta|cronometro" data-duracion="<ms>" data-nombre="…">`; `data-duracion` sólo en una cuenta.

- [ ] **Step 1: Tests**

En `tests/markdown.test.ts`, un `describe` nuevo (importar `tramosEnLinea`, `tramosAHtml`, `aHtml`, `aTexto`, `aPdf`, `botonTemporizador` de `../src/ui/markdown.js` e `ICO` de `../src/ui/iconos.js`):

```ts
describe('las marcas de temporizador', () => {
  it('una cuenta es un tramo con su texto, su duración y su nombre', () => {
    expect(tramosEnLinea('durante [50 minutos](cuenta:50:00 "cocinar").')).toEqual([
      { texto: 'durante ' },
      { texto: '50 minutos', temporizador: { tipo: 'cuenta', duracion: 3_000_000, nombre: 'cocinar' } },
      { texto: '.' }
    ]);
  });
  it('en HTML: el texto y el botón al lado', () => {
    const html = aHtml('durante [50 minutos](cuenta:50:00 "cocinar").');
    expect(html).toContain('50 minutos<button type="button" class="ico-min" data-accion="crear-temporizador" data-tipo="cuenta" data-duracion="3000000" data-nombre="cocinar"');
    expect(html).toContain(ICO.relojMas);
  });
  it('un cronómetro lleva su ícono y no lleva duración', () => {
    const html = aHtml('[](cronometro: "amasar")');
    expect(html).toContain('data-tipo="cronometro"');
    expect(html).not.toContain('data-duracion');
    expect(html).toContain(ICO.cronometroMas);
  });
  it('el nombre se escapa', () => {
    expect(aHtml('[](cuenta:1:00 "a<b")')).toContain('data-nombre="a&lt;b"');
  });
  it('mal formada: queda su texto, sin botón ni sintaxis', () => {
    for (const md of ['[5 min](cuenta:5)', '[5 min](cuenta:5:00 "hornear)', '[5 min](cronometro:3:00)', '[5 min](cuenta:5:00 hornear)']) {
      const html = aHtml(md);
      expect(html).toContain('5 min');
      expect(html).not.toContain('crear-temporizador');
      expect(html).not.toContain('cuenta:');
      expect(html).not.toContain('cronometro:');
    }
  });
  it('dentro de negrita sigue siendo marca', () => {
    expect(aHtml('**[5 min](cuenta:5:00)**')).toContain('<strong>5 min<button');
  });
  it('en texto y en PDF queda sólo el texto; una vacía no deja nada', () => {
    expect(aTexto('Hornear [1 h](cuenta:1:00:00 "horno"). [](cuenta:4:00)')).toBe('Hornear 1 h. ');
    expect(JSON.stringify(aPdf('Hornear [1 h](cuenta:1:00:00). [](cuenta:4:00)'))).not.toContain('cuenta');
  });
  it('un link común sigue siendo link', () => {
    expect(aHtml('[sitio](https://a.com)')).toContain('<a href="https://a.com"');
  });
  it('botonTemporizador es el mismo botón para cualquiera que lo dibuje', () => {
    expect(botonTemporizador({ tipo: 'cuenta', duracion: 600_000, nombre: 'Chauchas' }))
      .toBe(`<button type="button" class="ico-min" data-accion="crear-temporizador" data-tipo="cuenta" data-duracion="600000" data-nombre="Chauchas" aria-label="Empezar un temporizador: Chauchas">${ICO.relojMas}</button>`);
  });
});
```

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/markdown.test.ts`
Expected: FAIL en el `describe` nuevo.

- [ ] **Step 3: Implementar**

En `src/ui/markdown.ts`:

1. Imports: `import { PATRON_MARCA, leerMarca, nombreDeMarca, type TipoMarca } from '../marcas.js';` e `import { ICO } from './iconos.js';`.
2. En `TramoEnLinea`, sumar:

```ts
  /** Una marca de temporizador (`src/marcas.ts`): `texto` es lo que se lee, y el botón va al lado. */
  temporizador?: { tipo: TipoMarca; duracion: number | null; nombre: string };
```

3. `EN_LINEA` suma la marca **antes** que la imagen y el link, con sus cuatro grupos tomados de `PATRON_MARCA.source`:

```ts
// Marca de temporizador, imagen, link, negrita, itálica: en cada posición gana
// el primero que calza, y adentro de la negrita y la itálica se vuelve a buscar.
// La marca va primero: tiene forma de link y el link la tomaría.
const EN_LINEA = new RegExp(
  `${PATRON_MARCA.source}|!\\[([^\\]]*)\\]\\(([^)\\s]+)\\)|\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|\\*\\*(.+?)\\*\\*|\\*(.+?)\\*`, 'g'
);
```

4. En `enLinea`, la desestructuración pasa a
`const [entero, marcaTexto, esquema, valor, resto, epigrafe, imagen, textoLink, destino, negrita, italica] = m;`
y antes de `if (imagen !== undefined)`:

```ts
    if (esquema !== undefined) {
      const marca = leerMarca(marcaTexto ?? '', esquema, valor ?? '', resto ?? '');
      // Mal escrita se lee como texto común: su texto, sin la sintaxis.
      if (!marca) suelto(marcaTexto ?? '');
      else salida.push({
        texto: marca.texto, ...formato,
        temporizador: { tipo: marca.tipo, duracion: marca.duracion, nombre: nombreDeMarca(marca) }
      });
      continue;
    }
```

(Usar `continue` dentro del `for…of` y dejar el resto de la cadena `if` como está; `entero` sigue usándose en las ramas de imagen y link.)

5. El botón, exportado:

```ts
/**
 * El botón que crea un temporizador al lado de un texto: el de una marca de la
 * receta y el de una fila de Referencias. Lo atiende `crear-temporizador`.
 */
export function botonTemporizador(t: { tipo: TipoMarca; duracion: number | null; nombre: string }): string {
  const duracion = t.tipo === 'cuenta' && t.duracion !== null ? ` data-duracion="${t.duracion}"` : '';
  const icono = t.tipo === 'cuenta' ? ICO.relojMas : ICO.cronometroMas;
  return `<button type="button" class="ico-min" data-accion="crear-temporizador" data-tipo="${t.tipo}"${duracion} ` +
    `data-nombre="${escapar(t.nombre)}" aria-label="Empezar un temporizador: ${escapar(t.nombre)}">${icono}</button>`;
}
```

6. `tramosAHtml`: después de armar `html` con los formatos, si `t.temporizador`, `html += botonTemporizador(t.temporizador)` **adentro** de `<em>`/`<strong>` (el test de la negrita pide `<strong>5 min<button`). Es decir, sumar el botón antes de envolver:

```ts
    let html = escapar(t.texto);
    if (t.temporizador) html += botonTemporizador(t.temporizador);
    if (t.link) html = `<a …>${html}</a>`;
```

7. `tramosATexto` y `tramosAPdf` no cambian: un tramo `temporizador` ya es texto común para los dos (`texto`, sin `link` ni `imagen`). En `tramosAPdf`, filtrar además los tramos de texto vacío: `tramos.filter(t => !t.imagen && t.texto !== '')`.

- [ ] **Step 4: Correr**

Run: `npx vitest run tests/markdown.test.ts tests/pdf-documento.test.ts tests/texto-receta.test.ts`
Expected: PASS (los dos últimos, si existen con ese nombre; si no, `npm test`).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

---

### Task 4: El modelo: cronómetros con nombre en la lista

**Files:**
- Modify: `src/temporizadores.ts`
- Test: `tests/temporizadores.test.ts`

**Interfaces:**
- Produces:
  - `interface CronoConNombre { id: string; nombre: string; acumulado: number; desde?: number }`
  - `type EnLista = Temporizador | CronoConNombre`
  - `esCrono(x: EnLista): x is CronoConNombre`
  - `empezarCrono(id: string, nombre: string, ahora: number): CronoConNombre`
  - `pausarCrono(c: CronoConNombre, ahora: number): CronoConNombre`, `seguirCrono(c: CronoConNombre, ahora: number): CronoConNombre`
  - `Guardado.temporizadores: EnLista[]`
  - `transcurrido` acepta un `CronoConNombre` (su forma es la de un `Cronometro`).

- [ ] **Step 1: Tests**

En `tests/temporizadores.test.ts`:

```ts
describe('un cronómetro con nombre', () => {
  it('empieza corriendo desde cero, con su nombre o «Cronómetro»', () => {
    expect(empezarCrono('c', ' amasar ', T0)).toEqual({ id: 'c', nombre: 'amasar', acumulado: 0, desde: T0 });
    expect(empezarCrono('c', '', T0).nombre).toBe('Cronómetro');
  });
  it('se pausa y sigue sin perder lo contado', () => {
    const c = empezarCrono('c', 'amasar', T0);
    const p = pausarCrono(c, T0 + 5000);
    expect(p).toEqual({ id: 'c', nombre: 'amasar', acumulado: 5000 });
    expect(transcurrido(seguirCrono(p, T0 + 9000), T0 + 10_000)).toBe(6000);
  });
  it('esCrono distingue por la forma', () => {
    expect(esCrono(empezarCrono('c', 'x', T0))).toBe(true);
    expect(esCrono(empezar('t', 'x', MINUTO, T0))).toBe(false);
  });
});

describe('lo guardado, con cronómetros con nombre', () => {
  it('lee cuentas y cronómetros mezclados, en su orden', () => {
    const crudo = { temporizadores: [
      { id: 'a', nombre: 'Pasta', duracion: MINUTO, fin: T0 },
      { id: 'b', nombre: 'amasar', acumulado: 3000, desde: T0 },
      { id: 'c', nombre: 'leudar', acumulado: 9000 }
    ] };
    expect(leerGuardado(crudo).temporizadores.map(t => t.id)).toEqual(['a', 'b', 'c']);
  });
  it('una lista vieja, sólo de cuentas, se lee igual', () => {
    const crudo = { temporizadores: [{ id: 'a', nombre: 'Pasta', duracion: MINUTO, restante: 5000 }] };
    expect(leerGuardado(crudo).temporizadores).toEqual(crudo.temporizadores);
  });
  it('un elemento roto se descarta y los demás quedan', () => {
    const crudo = { temporizadores: [
      { id: 'b', nombre: 'amasar', acumulado: -1 },
      { id: 'c', nombre: 'leudar', acumulado: 9000, desde: 'x' },
      { id: 'd', nombre: 'ok', acumulado: 0 }
    ] };
    expect(leerGuardado(crudo).temporizadores.map(t => t.id)).toEqual(['d']);
  });
});
```

(Importar `empezarCrono`, `pausarCrono`, `seguirCrono`, `esCrono` y `empezar` junto con lo que el archivo ya importa; si `T0` no existe en el archivo, declarar `const T0 = 1_000_000;`.)

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/temporizadores.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `src/temporizadores.ts`, después del bloque del cronómetro:

```ts
/**
 * Un cronómetro con nombre: lo crea una marca de la receta y va en la lista,
 * mezclado con las cuentas (C07.5b.1). Cuenta igual que el cronómetro de
 * arriba —su forma es la de un `Cronometro`— y no termina ni avisa.
 */
export interface CronoConNombre { id: string; nombre: string; acumulado: number; desde?: number }

/** Lo que va en la lista de Temporizadores, en orden de creación. */
export type EnLista = Temporizador | CronoConNombre;

export const esCrono = (x: EnLista): x is CronoConNombre => 'acumulado' in x;

const comoCrono = (c: CronoConNombre): Cronometro =>
  c.desde === undefined ? { acumulado: c.acumulado } : { desde: c.desde, acumulado: c.acumulado };

export const empezarCrono = (id: string, nombre: string, ahora: number): CronoConNombre =>
  ({ id, nombre: nombre.trim() || 'Cronómetro', acumulado: 0, desde: ahora });

export const pausarCrono = (c: CronoConNombre, ahora: number): CronoConNombre =>
  ({ id: c.id, nombre: c.nombre, ...pararCrono(comoCrono(c), ahora) });

export const seguirCrono = (c: CronoConNombre, ahora: number): CronoConNombre =>
  ({ id: c.id, nombre: c.nombre, ...iniciarCrono(comoCrono(c), ahora) });
```

`cronoCorriendo` y `transcurrido` ya aceptan cualquier cosa con `acumulado` y `desde?` si se tipa su parámetro como `Cronometro | CronoConNombre`; cambiar sus firmas a:

```ts
export const cronoCorriendo = (c: Cronometro | CronoConNombre): c is CronoCorriendo | (CronoConNombre & { desde: number }) =>
  'desde' in c && c.desde !== undefined;
export const transcurrido = (c: Cronometro | CronoConNombre, ahora: number): number =>
  c.acumulado + (cronoCorriendo(c) ? Math.max(0, ahora - c.desde) : 0);
```

En lo guardado:

```ts
export interface Guardado { temporizadores: EnLista[]; crono: Cronometro; ultimaDuracion: Duracion }

function esCronoConNombre(x: unknown): x is CronoConNombre {
  if (!esObjeto(x) || typeof x['id'] !== 'string' || typeof x['nombre'] !== 'string') return false;
  if (!esNumero(x['acumulado']) || x['acumulado'] < 0) return false;
  return x['desde'] === undefined || esNumero(x['desde']);
}
```

y en `leerGuardado`, la lista:

```ts
    temporizadores: lista.flatMap((x): EnLista[] => {
      if (esTemporizador(x)) return [corriendo(x)
        ? { id: x.id, nombre: x.nombre, duracion: x.duracion, fin: x.fin }
        : { id: x.id, nombre: x.nombre, duracion: x.duracion, restante: x.restante }];
      if (esCronoConNombre(x)) return [x.desde === undefined
        ? { id: x.id, nombre: x.nombre, acumulado: x.acumulado }
        : { id: x.id, nombre: x.nombre, acumulado: x.acumulado, desde: x.desde }];
      return [];
    }),
```

(`esTemporizador` exige `duracion`, así que un cronómetro nunca pasa por ahí.)

- [ ] **Step 4: Correr**

Run: `npx vitest run tests/temporizadores.test.ts && npm run typecheck`
Expected: el test pasa. El typecheck **va a fallar** en `temporizadores-control.ts`, `ui/temporizadores.ts` y `main.ts`, que todavía tipan la lista como `Temporizador[]`: lo arregla la tarea 5. Anotar los errores y seguir.

---

### Task 5: El control, la pantalla y la tira con cronómetros con nombre

**Files:**
- Modify: `src/temporizadores-control.ts`, `src/ui/temporizadores.ts`, `src/main.ts` (`pintarTemporizadoresVivos`)
- Test: `tests/temporizadores-control.test.ts`, `tests/vista-temporizadores.test.ts`

**Interfaces:**
- Consumes: `EnLista`, `esCrono`, `empezarCrono`, `pausarCrono`, `seguirCrono`, `transcurrido` (tarea 4).
- Produces:
  - `EstadoTemporizadores.temporizadores: readonly EnLista[]`
  - `ControlTemporizadores.empezarCronoCon(nombre: string): void`
  - `Turno = { tipo: 'crono' } | { tipo: 'temporizador'; temporizador: EnLista }`

- [ ] **Step 1: Tests del control**

En `tests/temporizadores-control.test.ts` (usa `armar()`, `boton()` y el reloj falso del archivo):

```ts
describe('los cronómetros con nombre', () => {
  it('empezarCronoCon lo suma a la lista, corriendo, y lo guarda', () => {
    const { c, almacen } = armar();
    c.empezarCronoCon('amasar');
    const [x] = c.estado().temporizadores;
    expect(x).toMatchObject({ nombre: 'amasar', acumulado: 0 });
    expect(JSON.parse(almacen.getItem(CLAVE_TEMPORIZADORES) ?? '{}').temporizadores).toHaveLength(1);
  });
  it('pausar y seguir le paran y le siguen la cuenta', () => {
    const { c, r } = armar();
    c.empezarCronoCon('amasar');
    const id = c.estado().temporizadores[0]!.id;
    r.tics(5);
    c.acciones['temporizador-pausar']!(boton(id), new Event('click'));
    r.tics(5);
    expect(transcurrido(c.estado().temporizadores[0] as never, c.estado().ahora)).toBe(5000);
    c.acciones['temporizador-seguir']!(boton(id), new Event('click'));
    r.tics(2);
    expect(transcurrido(c.estado().temporizadores[0] as never, c.estado().ahora)).toBe(7000);
  });
  it('mientras corre, la pantalla queda encendida; pausado, no', () => {
    const { c, encendida } = armar();
    c.empezarCronoCon('amasar');
    expect(encendida()).toBe(true);
    c.acciones['temporizador-pausar']!(boton(c.estado().temporizadores[0]!.id), new Event('click'));
    expect(encendida()).toBe(false);
  });
  it('no termina ni avisa, y sacar lo saca', () => {
    const { c, r, aviso } = armar();
    c.empezarCronoCon('amasar');
    r.tics(120);
    expect(aviso.sonar).not.toHaveBeenCalled();
    c.acciones['temporizador-sacar']!(boton(c.estado().temporizadores[0]!.id), new Event('click'));
    expect(c.estado().temporizadores).toHaveLength(0);
  });
  it('+1\' no le hace nada a un cronómetro', () => {
    const { c } = armar();
    c.empezarCronoCon('amasar');
    const antes = c.estado().temporizadores[0];
    c.acciones['temporizador-sumar']!(boton(antes!.id), new Event('click'));
    expect(c.estado().temporizadores[0]).toEqual(antes);
  });
});
```

(Si `armar()` no devuelve `r`, `aviso`, `encendida` o `almacen` con esos nombres, usar los que devuelve; leer el final de `armar` antes.)

- [ ] **Step 2: Tests de la pantalla y la tira**

En `tests/vista-temporizadores.test.ts`:

```ts
const amasar = { id: 'a', nombre: 'amasar', acumulado: 65_000, desde: T0 - 5000 };
const leudar = { id: 'z', nombre: 'leudar', acumulado: 30_000 };

describe('los cronómetros con nombre', () => {
  it('van en la lista, en su orden, con el tiempo que sube, pausa y sacar, sin +1\' ni barra', () => {
    const html = dibujar({ temporizadores: [pasta, amasar] });
    const ficha = html.slice(html.indexOf('data-temporizador="a"'));
    expect(html.indexOf('data-temporizador="a"')).toBeGreaterThan(html.indexOf('data-temporizador="p"'));
    expect(ficha).toContain('1:10');
    expect(ficha).toContain('data-accion="temporizador-pausar"');
    expect(ficha).toContain('data-accion="temporizador-sacar"');
    expect(ficha.slice(0, ficha.indexOf('</div></div>'))).not.toContain('temporizador-sumar');
    expect(ficha.slice(0, ficha.indexOf('</div></div>'))).not.toContain('class="barra"');
  });
  it('el ícono al lado del nombre distingue cuenta y cronómetro', () => {
    const html = dibujar({ temporizadores: [pasta, amasar] });
    expect(html).toContain(`<span class="nom">${ICO.reloj}Pasta</span>`);
    expect(html).toContain(`<span class="nom">${ICO.cronometro}amasar</span>`);
  });
  it('la tira rota por los que corren, mezclados, y no por los pausados', () => {
    const turnos = turnosDeTira({ ...base, temporizadores: [pasta, amasar, leudar] });
    expect(turnos.map(t => (t.tipo === 'temporizador' ? t.temporizador.id : 'crono'))).toEqual(['p', 'a']);
  });
  it('en la tira, un cronómetro muestra su nombre y lo que lleva', () => {
    const html = renderTira({ ...base, temporizadores: [amasar] }, 0);
    expect(html).toContain('>amasar<');
    expect(html).toContain('1:10');
    expect(html).toContain(ICO.cronometro);
  });
});
```

- [ ] **Step 3: Ver que fallan**

Run: `npx vitest run tests/temporizadores-control.test.ts tests/vista-temporizadores.test.ts`
Expected: FAIL.

- [ ] **Step 4: El control**

En `src/temporizadores-control.ts`:

- Importar `type EnLista, esCrono, empezarCrono, pausarCrono, seguirCrono, cronoCorriendo` (este ya está).
- `EstadoTemporizadores.temporizadores: readonly EnLista[]`; la variable `let temporizadores: readonly EnLista[]`.
- Una ayuda para las cuentas solas: `const cuentas = (): Temporizador[] => temporizadores.filter((x): x is Temporizador => !esCrono(x));`
- `enMarcha`: `cuentas().some(c => corriendo(c) && !terminado(c, ahora)) || cronoCorriendo(crono) || temporizadores.some(x => esCrono(x) && cronoCorriendo(x))`.
- `ajustarMarcha` y `tic`: donde dice `temporizadores.some(t => terminado(t, ahora))` y `temporizadores.filter(c => terminado(c, ahora) …)`, usar `cuentas()`.
- `porId` devuelve `EnLista | undefined`; `reemplazar(c: EnLista, nueva: EnLista)`; `sobre` recibe `fn: (c: EnLista, ahora: number) => void`.
- Las acciones:

```ts
    'temporizador-pausar': sobre((c, ahora) => reemplazar(c, esCrono(c) ? pausarCrono(c, ahora) : pausar(c, ahora))),
    'temporizador-seguir': sobre((c, ahora) => reemplazar(c, esCrono(c) ? seguirCrono(c, ahora) : seguir(c, ahora))),
    // Un cronómetro no tiene minutos que sumar.
    'temporizador-sumar': sobre((c, ahora) => { if (esCrono(c)) return; callar(c); reemplazar(c, sumarMinuto(c, ahora)); }),
```

  (`callar` recibe `EnLista`: sólo usa `id`.)
- En `ControlTemporizadores`:

```ts
  /** Empieza un cronómetro con nombre: lo llaman las marcas de la receta. */
  empezarCronoCon(nombre: string): void;
```

  y en el objeto devuelto:

```ts
    empezarCronoCon(nombre) {
      cambiar(() => { temporizadores = [...temporizadores, empezarCrono(nuevoId(), nombre, reloj.ahora())]; });
    },
```

- [ ] **Step 5: La pantalla y la tira**

En `src/ui/temporizadores.ts`:

- Importar `type EnLista, esCrono, type CronoConNombre` de `../temporizadores.js`.
- `fichaTemporizador(c: Temporizador, …)` queda para las cuentas, con `<span class="nom">${ICO.reloj}${escapar(c.nombre)}</span>`.
- Una ficha nueva:

```ts
/** Un cronómetro con nombre: el tiempo que sube, pausa o seguir, y sacar (C07.5b.1). */
function fichaCronoConNombre(c: CronoConNombre, ahora: number): string {
  const andando = cronoCorriendo(c);
  return `<div class="ficha temporizador" data-temporizador="${escapar(c.id)}">` +
    `<div class="temporizador-fila"><span class="nom">${ICO.cronometro}${escapar(c.nombre)}</span>` +
    `<span class="tiempo${andando ? '' : ' pausado'}" data-tiempo="${escapar(c.id)}">${formatear(transcurrido(c, ahora))}</span>` +
    '<div class="acciones-temporizador">' +
      (andando ? cuadrado('temporizador-pausar', c.id, 'Pausar', ICO.pausa) : cuadrado('temporizador-seguir', c.id, 'Seguir', ICO.play)) +
      cuadrado('temporizador-sacar', c.id, 'Sacar', ICO.cerrar) +
    '</div></div></div>';
}

const fichaDeLista = (x: EnLista, ahora: number): string =>
  esCrono(x) ? fichaCronoConNombre(x, ahora) : fichaTemporizador(x, ahora);
```

- `renderTemporizadores`: `e.temporizadores.map(c => fichaDeLista(c, e.ahora))`.
- `Turno`: `{ tipo: 'temporizador'; temporizador: EnLista }`.
- `turnosDeTira`: `e.temporizadores.filter(t => (esCrono(t) ? cronoCorriendo(t) : corriendo(t)))`.
- Una ayuda local: `const terminadoEnLista = (t: EnLista, ahora: number): boolean => !esCrono(t) && terminado(t, ahora);` y `const tiempoEnLista = (t: EnLista, ahora: number): string => formatear(esCrono(t) ? transcurrido(t, ahora) : restante(t, ahora));`
- `formaDeTira`, `tiempoDeTira` y `renderTira`: cambiar `terminado(t.turno.temporizador, e.ahora)` por `terminadoEnLista(…)` y `formatear(restante(temp, e.ahora))` por `tiempoEnLista(temp, e.ahora)`. En `renderTira`, el ícono: `${t.turno.tipo === 'temporizador' && esCrono(t.turno.temporizador) ? ICO.cronometro : ICO.reloj}`.

- [ ] **Step 6: `main.ts`**

En `pintarTemporizadoresVivos` (`src/main.ts`, el `for (const c of e.temporizadores)`):

```ts
  for (const c of e.temporizadores) {
    const t = document.querySelector<HTMLElement>(`#app [data-tiempo="${c.id}"]`);
    if (t) t.textContent = formatear(esCrono(c) ? transcurrido(c, e.ahora) : restante(c, e.ahora));
    if (esCrono(c)) continue;
    const b = document.querySelector<HTMLElement>(`#app [data-avance="${c.id}"]`);
    if (b) b.style.width = `${Math.round(avance(c, e.ahora) * 100)}%`;
  }
```

e importar `esCrono` de `./temporizadores.js`.

- [ ] **Step 7: Correr todo lo de temporizadores y el typecheck**

Run: `npx vitest run tests/temporizadores.test.ts tests/temporizadores-control.test.ts tests/vista-temporizadores.test.ts tests/main-rutas.test.ts && npm run typecheck`
Expected: PASS, sin errores de tipos.

---

### Task 6: La acción `crear-temporizador`, con el bloqueo de 2 s

**Files:**
- Create: `src/marca-control.ts`
- Modify: `src/main.ts` (registrar la sección), `src/ui/referencias.ts:49-54` (usar `botonTemporizador`), `src/referencias-control.ts` (sacar `referencia-temporizador` y la dependencia `temporizador`)
- Test: `tests/marca-control.test.ts`, `tests/referencias-control.test.ts`, `tests/vista-referencias.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `botonTemporizador` (tarea 3); `ControlTemporizadores.empezarCon(nombre, ms)` y `empezarCronoCon(nombre)` (tarea 5); `ICO.tilde`.
- Produces: `accionesDeMarcas(d: { empezarCuenta(nombre: string, ms: number): void; empezarCrono(nombre: string): void; demorar(ms: number, fn: () => void): void }): SeccionDeAcciones` con la acción `crear-temporizador`; `BLOQUEO_MARCA = 2000`.

- [ ] **Step 1: Tests**

```ts
// tests/marca-control.test.ts
import { describe, it, expect, vi } from 'vitest';
import { accionesDeMarcas, BLOQUEO_MARCA } from '../src/marca-control.js';
import { ICO } from '../src/ui/iconos.js';

function armar() {
  const pendientes: { ms: number; fn: () => void }[] = [];
  const d = { empezarCuenta: vi.fn(), empezarCrono: vi.fn(), demorar: (ms: number, fn: () => void) => { pendientes.push({ ms, fn }); } };
  const acciones = accionesDeMarcas(d);
  const tocar = (b: HTMLElement) => acciones['crear-temporizador']!(b, new Event('click'));
  const pasar = () => { for (const p of pendientes.splice(0)) p.fn(); };
  return { d, tocar, pasar, pendientes };
}
const boton = (dataset: Record<string, string>) =>
  ({ dataset, disabled: false, innerHTML: ICO.relojMas, classList: { add: vi.fn(), remove: vi.fn() } }) as unknown as HTMLElement & { disabled: boolean };

describe('crear-temporizador', () => {
  it('una cuenta, con su nombre y su duración', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cuenta', duracion: '3000000', nombre: 'cocinar' }));
    expect(d.empezarCuenta).toHaveBeenCalledWith('cocinar', 3_000_000);
  });
  it('un cronómetro, con su nombre', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cronometro', nombre: 'amasar' }));
    expect(d.empezarCrono).toHaveBeenCalledWith('amasar');
  });
  it('queda 2 s deshabilitado con la tilde, y después vuelve', () => {
    const { tocar, pasar, pendientes } = armar();
    const b = boton({ tipo: 'cuenta', duracion: '60000', nombre: 'x' });
    tocar(b);
    expect(b.disabled).toBe(true);
    expect(b.innerHTML).toBe(ICO.tilde);
    expect(pendientes[0]?.ms).toBe(BLOQUEO_MARCA);
    pasar();
    expect(b.disabled).toBe(false);
    expect(b.innerHTML).toBe(ICO.relojMas);
  });
  it('un segundo toque mientras está bloqueado no crea otro', () => {
    const { d, tocar, pasar } = armar();
    const b = boton({ tipo: 'cuenta', duracion: '60000', nombre: 'x' });
    tocar(b); tocar(b);
    expect(d.empezarCuenta).toHaveBeenCalledOnce();
    pasar(); tocar(b);
    expect(d.empezarCuenta).toHaveBeenCalledTimes(2);
  });
  it('sin duración válida, una cuenta no crea nada', () => {
    const { d, tocar } = armar();
    tocar(boton({ tipo: 'cuenta', duracion: 'x', nombre: 'x' }));
    expect(d.empezarCuenta).not.toHaveBeenCalled();
  });
});
```

(El `disabled` del botón real ya impide el click en el navegador; el chequeo explícito en la acción cubre el DOM falso y un toque que llegue igual.)

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/marca-control.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/marca-control.ts`**

```ts
/**
 * El botón que crea un temporizador al lado de un texto —una marca de la
 * receta, una fila de Referencias—: lo crea y lo arranca sin cambiar de
 * pantalla. Después queda 2 s deshabilitado con la tilde: un doble toque crea
 * uno solo, y un toque más, pasado ese rato, crea otro.
 */
import type { SeccionDeAcciones } from './acciones.js';
import { ICO } from './ui/iconos.js';

export const BLOQUEO_MARCA = 2000;

export interface DependenciasMarcas {
  empezarCuenta(nombre: string, ms: number): void;
  empezarCrono(nombre: string): void;
  /** Llama `fn` dentro de `ms`; los tests la disparan a mano. */
  demorar(ms: number, fn: () => void): void;
}

export const accionesDeMarcas = ({ empezarCuenta, empezarCrono, demorar }: DependenciasMarcas): SeccionDeAcciones => ({
  'crear-temporizador': (boton) => {
    const b = boton as HTMLButtonElement;
    if (b.disabled) return;
    const { tipo, nombre = '', duracion } = b.dataset;
    if (tipo === 'cuenta') {
      const ms = Number(duracion);
      if (!(Number.isFinite(ms) && ms > 0)) return;
      empezarCuenta(nombre, ms);
    } else if (tipo === 'cronometro') {
      empezarCrono(nombre);
    } else return;
    const icono = b.innerHTML;
    b.disabled = true;
    b.innerHTML = ICO.tilde;
    b.classList.add('hecho');
    demorar(BLOQUEO_MARCA, () => {
      b.disabled = false;
      b.innerHTML = icono;
      b.classList.remove('hecho');
    });
  }
});
```

- [ ] **Step 4: Cablear en `main.ts`**

Importar `accionesDeMarcas` y sumar en `registrarAcciones` una sección:

```ts
  marcas: accionesDeMarcas({
    empezarCuenta: (nombre, ms) => { controlTemporizadores.empezarCon(nombre, ms); },
    empezarCrono: (nombre) => { controlTemporizadores.empezarCronoCon(nombre); },
    demorar: (ms, fn) => { setTimeout(fn, ms); }
  }),
```

Revisar que `controlTemporizadores.redibujar` fuera de Temporizadores sólo pinta la tira (ya es así: no redibuja la receta), de modo que el botón tocado sigue en el DOM durante los 2 s.

- [ ] **Step 5: Referencias usa el mismo botón**

En `src/ui/referencias.ts`, la celda con minutos:

```ts
  const boton = minutos === null ? '' : ' ' + botonTemporizador({ tipo: 'cuenta', duracion: Math.round(minutos * MINUTO), nombre });
```

importando `botonTemporizador` de `./markdown.js` y `MINUTO` de `../temporizadores.js`. En `src/referencias-control.ts`, borrar la acción `referencia-temporizador` y la dependencia `temporizador` de `crearControlReferencias` (y su línea en `main.ts`, `temporizador: (nombre, minutos) => …`).

Actualizar los tests:
- `tests/vista-referencias.test.ts:44`: `expect(html).toContain('data-accion="crear-temporizador" data-tipo="cuenta" data-duracion="180000" data-nombre="Chauchas"');`
- `tests/referencias-control.test.ts`: borrar el test «el botón de minutos crea un temporizador…» y el `temporizador` de `armar()`.
- `tests/main-rutas.test.ts:1230`: `await tocar('crear-temporizador', { tipo: 'cuenta', nombre: 'Chauchas', duracion: '600000' });` (el resto del test queda).

- [ ] **Step 6: Tests de integración en la receta y en la cocina**

En `tests/main-rutas.test.ts`, junto al test de Referencias, dos tests con el mismo `montar()`:

```ts
    it('el botón de una marca en la receta empieza el temporizador sin cambiar de pantalla', async () => {
      estado.md = '---\ntitulo: Bondiola\n---\n\n## Preparación\n\n1. Cocinar [50 minutos](cuenta:50:00 "cocinar").\n';
      const { abrir, tocar, almacen, app } = await montar();
      await abrir('#/r/f1');
      expect(app.innerHTML).toContain('data-accion="crear-temporizador"');
      const ruta = location.hash;
      await tocar('crear-temporizador', { tipo: 'cuenta', nombre: 'cocinar', duracion: '3000000' });
      expect(location.hash).toBe(ruta);
      const guardado = JSON.parse(almacen.getItem('recetario.temporizadores') ?? '{}') as { temporizadores: { nombre: string }[] };
      expect(guardado.temporizadores[0]).toMatchObject({ nombre: 'cocinar', duracion: 3_000_000 });
    });

    it('en la cocina, el botón de un paso no marca el paso', async () => {
      estado.md = '---\ntitulo: Bondiola\n---\n\n## Preparación\n\n1. Cocinar [](cuenta:1:00).\n';
      const { abrir, tocar, app } = await montar();
      await abrir('#/r/f1/cocina');
      await tocar('crear-temporizador', { tipo: 'cuenta', nombre: '1 min', duracion: '60000' });
      expect(app.innerHTML).not.toContain('class="hecho"');
      expect(app.innerHTML).not.toContain('class="aqui"');
    });
```

(Adaptar `estado.md`, la ruta de la receta y la de la cocina a lo que usen los tests vecinos de `main-rutas.test.ts`; buscar un test que abra `#/r/…` y uno que entre a la cocina y copiar su forma.)

- [ ] **Step 7: Correr**

Run: `npx vitest run tests/marca-control.test.ts tests/referencias-control.test.ts tests/vista-referencias.test.ts tests/main-rutas.test.ts tests/acciones.test.ts && npm run typecheck`
Expected: PASS.

---

### Task 7: El invitado sin marcas y el índice con el texto

**Files:**
- Modify: `src/invitado.ts` (donde arma `leida`), `src/recipe.ts` (`ingredientesIndexables`)
- Test: `tests/invitado.test.ts`, `tests/recipe-cuerpo.test.ts` (o el test donde esté `ingredientesIndexables`)

**Interfaces:**
- Consumes: `sinMarcas`, `quitarMarcas` (tarea 1).

- [ ] **Step 1: Tests**

En el test donde se prueba `ingredientesIndexables` (buscarlo con `grep -ln ingredientesIndexables tests`):

```ts
  it('una marca en un ingrediente aporta su texto y nada más', () => {
    const r = parse('---\ntitulo: T\n---\n\n## Ingredientes\n\n- garbanzos [en remojo](cuenta:8:00:00 "remojo") — 500 g\n');
    expect(ingredientesIndexables(r)).toEqual(['garbanzos en remojo']);
  });
```

En `tests/invitado.test.ts`, siguiendo cómo arma un link y dibuja la lectura y la cocina:

```ts
  it('el invitado ve el texto de una marca, sin botón, en la lectura y en la cocina', async () => {
    // Codificar una receta con `1. Hornear [1 h](cuenta:1:00:00 "horno").` en la preparación,
    // abrir `#/ver?r=…`, y después la cocina, como hacen los tests vecinos.
    expect(html).toContain('Hornear 1 h.');
    expect(html).not.toContain('crear-temporizador');
    expect(htmlCocina).not.toContain('crear-temporizador');
  });
```

(Completar la preparación del link con el helper que usen los tests de `invitado.test.ts`.)

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/invitado.test.ts tests/recipe-cuerpo.test.ts`
Expected: FAIL en los tests nuevos.

- [ ] **Step 3: Implementar**

`src/recipe.ts`, en `ingredientesIndexables`: `vistos.add(quitarMarcas(ing.nombre).replace(/\s+/g, ' ').trim());` con `import { quitarMarcas } from './marcas.js';`. Revisar que no quede un ciclo: `marcas.ts` importa `temporizadores.ts` y `tipos.ts`, ninguno de los dos importa `recipe.ts`.

`src/invitado.ts`, donde arma `leida`:

```ts
      // El invitado no tiene temporizadores (su lista de acciones es cerrada):
      // las marcas se leen como su texto, sin botón.
      const receta = datos ? sinMarcas(datos.receta) : null;
      leida = datos && receta
        ? { carga: ruta.carga, ...datos, cruda: receta, receta: resueltaSinFotosDeDrive(receta) }
        : null;
```

importando `sinMarcas` de `./marcas.js`.

- [ ] **Step 4: Correr**

Run: `npx vitest run tests/invitado.test.ts tests/recipe-cuerpo.test.ts tests/catalogo-fila.test.ts && npm run typecheck`
Expected: PASS.

---

### Task 8: `validar` y las reglas del formato

**Files:**
- Modify: `src/validar.ts`, `src/conversion.ts` (`REGLAS_DEL_CUERPO`)
- Test: `tests/validar.test.ts`, `tests/conversion.test.ts`

**Interfaces:**
- Consumes: `marcasMalFormadas` (tarea 1).

- [ ] **Step 1: Tests**

`tests/validar.test.ts` (con el helper de `.md` que use el archivo):

```ts
describe('las marcas de temporizador', () => {
  it('una bien escrita no es problema', () => {
    const { problemas } = validarMd('---\ntitulo: T\n---\n\n## Preparación\n\n1. Hornear [1 h](cuenta:1:00:00 "horno").\n2. Amasar [](cronometro:).\n');
    expect(problemas).toEqual([]);
  });
  it('una mal escrita es error, con la marca y la forma correcta', () => {
    const { problemas } = validarMd('---\ntitulo: T\n---\n\n## Preparación\n\n1. Hornear [1 h](cuenta:60).\n');
    expect(problemas).toEqual([expect.objectContaining({ campo: 'cuerpo', nivel: 'error' })]);
    expect(problemas[0]?.mensaje).toContain('[1 h](cuenta:60)');
    expect(problemas[0]?.mensaje).toContain('cuenta:50:00');
  });
});
```

`tests/conversion.test.ts`, en «las reglas del formato»:

```ts
  it('las reglas del cuerpo nombran las dos marcas de temporizador', () => {
    const reglas = reglasDelFormato().join('\n');
    expect(reglas).toContain('cuenta:');
    expect(reglas).toContain('cronometro:');
  });
```

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/validar.test.ts tests/conversion.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/validar.ts`:

```ts
/** Las marcas de temporizador que la app lee como texto común: se perderían sin avisar. */
function problemasDeMarcas(receta: Receta): Problema[] {
  const cuerpo = [receta.descripcion, receta.ingredientes, receta.preparacion, receta.variaciones, receta.notas,
    ...receta.otras.map(o => o.cuerpo)].join('\n');
  return marcasMalFormadas(cuerpo).map(marca => ({
    campo: 'cuerpo',
    nivel: 'error',
    mensaje: `\`${marca}\` no es una marca de temporizador: se escribe \`[texto](cuenta:50:00 "etiqueta")\` ` +
      '(`m:ss` o `h:mm:ss`, hasta 23:59:59) o `[texto](cronometro: "etiqueta")`, con la etiqueta opcional.'
  }));
}
```

sumarlo en `problemasDe` (`...problemasDeMarcas(receta)`) e importar `marcasMalFormadas` de `./marcas.js`.

`src/conversion.ts`, al final de `REGLAS_DEL_CUERPO`:

```ts
  '- Un paso con un tiempo concreto de horno, hervor, reposo, leudado o marinada lleva una marca de temporizador que envuelve las palabras del tiempo: `durante [50 minutos](cuenta:50:00 "cocinar")`. La duración es `m:ss` o `h:mm:ss`; con un rango («20 a 25 minutos») va el mayor; sin número («hasta que dore») no lleva marca. La etiqueta, entre comillas y opcional, es corta: el verbo del paso. `[texto](cronometro: "etiqueta")` va sólo donde el paso pide medir algo que la fuente no fija.'
```

- [ ] **Step 4: Correr**

Run: `npx vitest run tests/validar.test.ts tests/conversion.test.ts tests/mcp-lectura.test.ts tests/mcp-escritura.test.ts && npm run typecheck`
Expected: PASS. (Si algún test del MCP compara la lista de reglas entera, actualizar el esperado con la línea nueva.)

---

### Task 9: El editor: el botón de herramientas y su capa

**Files:**
- Create: `src/ui/herramientas-editor.ts` (la tabla, la capa y los pasos), `src/herramientas-editor-control.ts` (las ruedas y las acciones)
- Modify: `src/ui/editor.ts` (`botonPonerFoto` → `botonHerramientas`, el epígrafe de la ficha Fotos), `src/ui/temporizadores.ts` (exportar `rueda` con su acción y su marca), `src/ui/tokens.css` (`.poner-foto` → `.poner-en-linea`), `src/main.ts` (`acomodarBotonDeFoto` → `acomodarBotonDeLinea`, la sección de acciones, `FICHAS_DE_FOTO`)
- Test: `tests/herramientas-editor.test.ts`, `tests/vista-editor.test.ts`, `tests/estilos-fotos.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `escribirMarca`, `agregarAlFinal` (tarea 1); `CamposDelEditor` de `src/fotos-control.ts`; `Duracion`, `girar`, `aMs`, `esRueda`, `DURACION_POR_DEFECTO` de `src/temporizadores.ts`; `renderElegirFoto` de `src/ui/editor.ts`.
- Produces:
  - `HERRAMIENTAS_DE_LINEA: readonly HerramientaDeLinea[]` con `interface HerramientaDeLinea { id: 'foto' | 'cuenta' | 'cronometro'; nombre: string; icono: string; deshabilitada?(ctx: ContextoDeLinea): string | null; paso(ctx: ContextoDeLinea): string }`
  - `interface ContextoDeLinea { seccion: string; linea: number; fotos: FotoDeReceta[]; ruedas: Duracion }`
  - `renderHerramientasDeLinea(ctx: ContextoDeLinea): string` (la capa con una entrada por herramienta)
  - `botonHerramientas(seccion: string, linea: number, altura: number): string`
  - `rueda(r: Rueda, ruedas: Duracion, accion?: { mas: string; menos: string; marca: string }): string` exportada desde `src/ui/temporizadores.ts`
  - `crearHerramientasEditor(d: { campos: CamposDelEditor; fotos: () => FotoDeReceta[]; pantalla: { abrirFicha(html: string): void; cerrarFicha(): void; etiquetaEscrita(): string; pintarRuedas(r: Duracion): void } }): { acciones: SeccionDeAcciones }`, con las acciones `abrir-herramientas-linea`, `elegir-herramienta-linea`, `marca-rueda-mas`, `marca-rueda-menos` y `poner-marca`.

- [ ] **Step 1: Tests de la vista**

```ts
// tests/herramientas-editor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHerramientasDeLinea, HERRAMIENTAS_DE_LINEA } from '../src/ui/herramientas-editor.js';
import { crearHerramientasEditor } from '../src/herramientas-editor-control.js';
import { ICO } from '../src/ui/iconos.js';

const ctx = { seccion: 'preparacion', linea: 1, fotos: [{ n: 1, url: 'https://a.com/1.jpg' }], ruedas: { h: 0, m: 10, s: 0 } };

describe('la capa de herramientas', () => {
  it('Foto, Cuenta regresiva y Cronómetro, en ese orden, con su ícono', () => {
    expect(HERRAMIENTAS_DE_LINEA.map(h => h.id)).toEqual(['foto', 'cuenta', 'cronometro']);
    const html = renderHerramientasDeLinea(ctx);
    expect(html).toContain('Agregar en esta línea');
    expect(html.indexOf('Foto')).toBeLessThan(html.indexOf('Cuenta regresiva'));
    expect(html.indexOf('Cuenta regresiva')).toBeLessThan(html.indexOf('Cronómetro'));
    expect(html).toContain(ICO.relojMas);
    expect(html).toContain('data-accion="elegir-herramienta-linea" data-herramienta="cuenta" data-seccion="preparacion" data-linea="1"');
  });
  it('se cierra con el velo, como las otras fichas del editor', () => {
    expect(renderHerramientasDeLinea(ctx).startsWith('<div class="velo" data-accion="cerrar-ficha-foto">')).toBe(true);
  });
  it('sin fotos en el depósito, Foto va deshabilitada y dice por qué', () => {
    const html = renderHerramientasDeLinea({ ...ctx, fotos: [] });
    expect(html).toMatch(/data-herramienta="foto"[^>]*disabled/);
    expect(html).toContain('Primero agregá una foto en la ficha Fotos');
  });
  it('el paso de la cuenta: nombre vacío, ruedas y Poner', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cuenta')!.paso(ctx);
    expect(paso).toContain('name="etiqueta-marca" value=""');
    expect(paso).toContain('data-accion="marca-rueda-mas"');
    expect(paso).toContain('data-accion="poner-marca" data-tipo="cuenta" data-seccion="preparacion" data-linea="1"');
  });
  it('Poner va deshabilitado con las ruedas en cero', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cuenta')!.paso({ ...ctx, ruedas: { h: 0, m: 0, s: 0 } });
    expect(paso).toMatch(/data-accion="poner-marca"[^>]*disabled/);
  });
  it('el paso del cronómetro: nombre y Poner, sin ruedas', () => {
    const paso = HERRAMIENTAS_DE_LINEA.find(h => h.id === 'cronometro')!.paso(ctx);
    expect(paso).toContain('name="etiqueta-marca"');
    expect(paso).not.toContain('marca-rueda');
  });
});

describe('las acciones', () => {
  function armar(campo = 'Freír.\nCocinar 50 minutos.') {
    let valor = campo;
    const pantalla = { abrirFicha: vi.fn(), cerrarFicha: vi.fn(), etiquetaEscrita: vi.fn(() => 'cocinar'), pintarRuedas: vi.fn() };
    const campos = { leer: (n: string) => (n === 'preparacion' ? valor : null), escribir: (_: string, v: string) => { valor = v; } };
    const h = crearHerramientasEditor({ campos, fotos: () => [], pantalla });
    const tocar = (accion: string, dataset: Record<string, string>) => h.acciones[accion]!({ dataset } as unknown as HTMLElement, new Event('click'));
    return { pantalla, tocar, valor: () => valor };
  }
  it('abrir abre la capa con la sección y la línea del botón', () => {
    const { pantalla, tocar } = armar();
    tocar('abrir-herramientas-linea', { seccion: 'preparacion', linea: '1' });
    expect(pantalla.abrirFicha.mock.calls[0]?.[0]).toContain('Agregar en esta línea');
  });
  it('elegir Cuenta abre su paso con las ruedas en 0:10:00', () => {
    const { pantalla, tocar } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(pantalla.abrirFicha.mock.calls[0]?.[0]).toContain('data-rueda-marca="m">10<');
  });
  it('las ruedas giran y se pintan sin reabrir la ficha', () => {
    const { pantalla, tocar } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    tocar('marca-rueda-mas', { rueda: 'm' });
    expect(pantalla.pintarRuedas).toHaveBeenLastCalledWith({ h: 0, m: 11, s: 0 });
    expect(pantalla.abrirFicha).toHaveBeenCalledOnce();
  });
  it('Poner escribe la marca vacía al final de la línea y cierra la capa', () => {
    const { pantalla, tocar, valor } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    for (let i = 0; i < 40; i++) tocar('marca-rueda-mas', { rueda: 'm' });
    tocar('poner-marca', { tipo: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(valor()).toBe('Freír.\nCocinar 50 minutos. [](cuenta:50:00 "cocinar")');
    expect(pantalla.cerrarFicha).toHaveBeenCalled();
  });
  it('Poner un cronómetro sin etiqueta', () => {
    const { pantalla, tocar, valor } = armar();
    pantalla.etiquetaEscrita.mockReturnValue('');
    tocar('poner-marca', { tipo: 'cronometro', seccion: 'preparacion', linea: '0' });
    expect(valor()).toBe('Freír. [](cronometro:)\nCocinar 50 minutos.');
  });
  it('una cuenta en cero no se pone', () => {
    const { tocar, valor } = armar();
    tocar('elegir-herramienta-linea', { herramienta: 'cuenta', seccion: 'preparacion', linea: '1' });
    for (let i = 0; i < 10; i++) tocar('marca-rueda-menos', { rueda: 'm' });
    tocar('poner-marca', { tipo: 'cuenta', seccion: 'preparacion', linea: '1' });
    expect(valor()).toBe('Freír.\nCocinar 50 minutos.');
  });
});
```

- [ ] **Step 2: Ver que fallan**

Run: `npx vitest run tests/herramientas-editor.test.ts`
Expected: FAIL.

- [ ] **Step 3: La rueda compartida**

En `src/ui/temporizadores.ts`, exportar `rueda` con la acción y la marca como parámetro, sin cambiar lo que dibuja hoy:

```ts
/** Las acciones y la marca de una rueda: las de Temporizadores, o las de otra pantalla que las use. */
export interface AccionesDeRueda { mas: string; menos: string; marca: string }
const RUEDA_DE_TEMPORIZADORES: AccionesDeRueda = { mas: 'rueda-mas', menos: 'rueda-menos', marca: 'data-rueda-valor' };

export function rueda(r: Rueda, ruedas: Duracion, a: AccionesDeRueda = RUEDA_DE_TEMPORIZADORES): string {
  const valor = r === 'h' ? String(ruedas.h) : dos(ruedas[r]);
  return `<div class="rueda"><span class="lbl">${ETIQUETA[r]}</span><div class="caja">` +
    `<button type="button" data-accion="${a.mas}" data-rueda="${r}" aria-label="Más ${ETIQUETA[r]}">${ICO.arriba}</button>` +
    `<span class="val" ${a.marca}="${r}">${valor}</span>` +
    `<button type="button" data-accion="${a.menos}" data-rueda="${r}" aria-label="Menos ${ETIQUETA[r]}">${ICO.abajo}</button>` +
    '</div></div>';
}
```

Correr `npx vitest run tests/vista-temporizadores.test.ts`: tiene que seguir en verde.

- [ ] **Step 4: `src/ui/herramientas-editor.ts`**

```ts
/**
 * El botón de herramientas del editor (C04.3d): lo que se puede poner en la
 * línea del cursor. Cada herramienta es una entrada de la tabla —ícono,
 * nombre, si está disponible y su paso—; una nueva es una entrada más. La capa
 * se abre como las otras fichas del editor y se cierra con el atrás.
 */
import { escapar } from './markdown.js';
import { ICO } from './iconos.js';
import { renderElegirFoto } from './editor.js';
import { rueda } from './temporizadores.js';
import { aMs, type Duracion } from '../temporizadores.js';
import type { FotoDeReceta } from '../tipos.js';

export interface ContextoDeLinea { seccion: string; linea: number; fotos: FotoDeReceta[]; ruedas: Duracion }

export interface HerramientaDeLinea {
  id: 'foto' | 'cuenta' | 'cronometro';
  nombre: string;
  icono: string;
  /** Por qué no se puede usar ahora, o `null` si se puede. */
  deshabilitada?(ctx: ContextoDeLinea): string | null;
  /** Lo que se dibuja al elegirla, en la misma capa. */
  paso(ctx: ContextoDeLinea): string;
}

const VELO = '<div class="velo" data-accion="cerrar-ficha-foto"></div>';
const RUEDAS_DE_MARCA = { mas: 'marca-rueda-mas', menos: 'marca-rueda-menos', marca: 'data-rueda-marca' };
const enLinea = (ctx: ContextoDeLinea): string => `data-seccion="${escapar(ctx.seccion)}" data-linea="${ctx.linea}"`;

function pasoDeMarca(ctx: ContextoDeLinea, tipo: 'cuenta' | 'cronometro', titulo: string): string {
  const ruedas = tipo === 'cuenta'
    ? `<div class="ruedas">${rueda('h', ctx.ruedas, RUEDAS_DE_MARCA)}${rueda('m', ctx.ruedas, RUEDAS_DE_MARCA)}${rueda('s', ctx.ruedas, RUEDAS_DE_MARCA)}</div>`
    : '';
  const apagado = tipo === 'cuenta' && aMs(ctx.ruedas) <= 0 ? ' disabled' : '';
  return VELO + '<div class="ficha hoja-foto" data-herramientas-linea>' +
    `<h2>${titulo}</h2>` +
    '<label class="campo"><span>Nombre (opcional)</span><input name="etiqueta-marca" value="" placeholder="Hornear, reposo…"></label>' +
    ruedas +
    `<button class="btn prim" type="button" data-accion="poner-marca" data-tipo="${tipo}" ${enLinea(ctx)}${apagado}>Poner</button>` +
    '</div>';
}

export const HERRAMIENTAS_DE_LINEA: readonly HerramientaDeLinea[] = [
  {
    id: 'foto', nombre: 'Foto', icono: ICO.imagen,
    deshabilitada: ctx => (ctx.fotos.length ? null : 'Primero agregá una foto en la ficha Fotos'),
    paso: ctx => renderElegirFoto(ctx.fotos, ctx.seccion, ctx.linea)
  },
  { id: 'cuenta', nombre: 'Cuenta regresiva', icono: ICO.relojMas, paso: ctx => pasoDeMarca(ctx, 'cuenta', 'Cuenta regresiva') },
  { id: 'cronometro', nombre: 'Cronómetro', icono: ICO.cronometroMas, paso: ctx => pasoDeMarca(ctx, 'cronometro', 'Cronómetro') }
];

/** La capa con una entrada por herramienta. */
export function renderHerramientasDeLinea(ctx: ContextoDeLinea): string {
  const items = HERRAMIENTAS_DE_LINEA.map(h => {
    const motivo = h.deshabilitada?.(ctx) ?? null;
    return `<button type="button" class="item-herramienta" data-accion="elegir-herramienta-linea" data-herramienta="${h.id}" ${enLinea(ctx)}` +
      `${motivo ? ' disabled' : ''}>${h.icono}<span>${h.nombre}${motivo ? `<span class="det">${motivo}</span>` : ''}</span>${ICO.chevron}</button>`;
  }).join('');
  return VELO + '<div class="ficha hoja-foto" data-herramientas-linea><h2>Agregar en esta línea</h2>' + items + '</div>';
}
```

Revisar si `src/ui/editor.ts` importaría de vuelta `herramientas-editor.ts` (tarea, Step 6): si `botonHerramientas` queda en `editor.ts` no hay ciclo, porque `editor.ts` no importa este archivo.

CSS en `src/ui/base.css`, junto a las fichas del editor:

```css
/* La capa del botón de herramientas: una fila por herramienta, ícono, nombre y chevron. */
.item-herramienta { display: flex; align-items: center; gap: var(--e-3); width: 100%; padding: var(--e-3) var(--e-1);
                    background: none; border: 0; border-top: 1px solid var(--borde); color: var(--fg);
                    font: inherit; text-align: left; cursor: pointer; }
.item-herramienta:first-of-type { border-top: 0; }
.item-herramienta > span { flex: 1; }
.item-herramienta .det { display: block; font-size: var(--txt-micro); color: var(--fg-3); }
.item-herramienta:disabled { color: var(--fg-3); cursor: default; }
.item-herramienta svg { width: var(--ico); height: var(--ico); stroke: currentColor; fill: none; stroke-width: 1.5;
                        stroke-linecap: round; stroke-linejoin: round; color: var(--fg-2); }
```

- [ ] **Step 5: `src/herramientas-editor-control.ts`**

```ts
/**
 * Las acciones del botón de herramientas del editor: abrir la capa, elegir una
 * herramienta, las ruedas de la cuenta y *Poner*. Escribe en el campo por
 * `CamposDelEditor`, como la foto: el formulario no se redibuja nunca.
 */
import type { SeccionDeAcciones } from './acciones.js';
import type { CamposDelEditor } from './fotos-control.js';
import { escribirMarca, agregarAlFinal } from './marcas.js';
import { aMs, girar, esRueda, DURACION_POR_DEFECTO, type Duracion } from './temporizadores.js';
import { HERRAMIENTAS_DE_LINEA, renderHerramientasDeLinea, type ContextoDeLinea } from './ui/herramientas-editor.js';
import type { FotoDeReceta } from './tipos.js';

export interface PantallaDeHerramientas {
  abrirFicha(html: string): void;
  cerrarFicha(): void;
  /** Lo escrito en el nombre de la marca. */
  etiquetaEscrita(): string;
  /** Escribe los valores de las ruedas y habilita *Poner*, sin reabrir la ficha. */
  pintarRuedas(r: Duracion): void;
}

export function crearHerramientasEditor({ campos, fotos, pantalla }: {
  campos: CamposDelEditor;
  fotos: () => FotoDeReceta[];
  pantalla: PantallaDeHerramientas;
}): { acciones: SeccionDeAcciones } {
  /** Las ruedas de la cuenta: cada vez que se abre, desde 0:10:00. */
  let ruedas: Duracion = DURACION_POR_DEFECTO;

  const contexto = (boton: HTMLElement): ContextoDeLinea => ({
    seccion: boton.dataset['seccion'] ?? '',
    linea: Number(boton.dataset['linea'] ?? 0),
    fotos: fotos(),
    ruedas
  });

  const girarRueda = (paso: 1 | -1) => (boton: HTMLElement): void => {
    const r = boton.dataset['rueda'];
    if (!esRueda(r)) return;
    ruedas = girar(ruedas, r, paso);
    pantalla.pintarRuedas(ruedas);
  };

  return {
    acciones: {
      'abrir-herramientas-linea': (boton) => { pantalla.abrirFicha(renderHerramientasDeLinea(contexto(boton))); },
      'elegir-herramienta-linea': (boton) => {
        const h = HERRAMIENTAS_DE_LINEA.find(x => x.id === boton.dataset['herramienta']);
        if (!h) return;
        ruedas = DURACION_POR_DEFECTO;
        const ctx = contexto(boton);
        if (h.deshabilitada?.(ctx)) return;
        pantalla.abrirFicha(h.paso(ctx));
      },
      'marca-rueda-mas': girarRueda(1),
      'marca-rueda-menos': girarRueda(-1),
      'poner-marca': (boton) => {
        const tipo = boton.dataset['tipo'];
        if (tipo !== 'cuenta' && tipo !== 'cronometro') return;
        const duracion = tipo === 'cuenta' ? aMs(ruedas) : null;
        if (tipo === 'cuenta' && !(duracion && duracion > 0)) return;
        const seccion = boton.dataset['seccion'] ?? '';
        const texto = campos.leer(seccion);
        if (texto === null) return;
        const marca = escribirMarca({ tipo, duracion, etiqueta: pantalla.etiquetaEscrita() });
        campos.escribir(seccion, agregarAlFinal(texto, Number(boton.dataset['linea'] ?? 0), marca));
        pantalla.cerrarFicha();
      }
    }
  };
}
```

- [ ] **Step 6: El botón flotante y el editor**

En `src/ui/editor.ts`, reemplazar `botonPonerFoto` por:

```ts
/**
 * El botón de herramientas, en la línea donde está el cursor: sin texto, del
 * alto de un renglón y colgado del marco del campo, a `altura` píxeles de su
 * borde de arriba. La línea viaja con él porque es la que había cuando se lo
 * dibujó: el cursor puede haberse ido para cuando se elige qué poner.
 */
export const botonHerramientas = (seccion: string, linea: number, altura: number): string =>
  '<button type="button" class="poner-en-linea" data-accion="abrir-herramientas-linea" ' +
  `data-seccion="${escapar(seccion)}" data-linea="${linea}" style="top:${altura}px" ` +
  `aria-label="Agregar en esta línea">${ICO.herramienta}</button>`;
```

y en el epígrafe de la ficha Fotos (`src/ui/editor.ts:183-184`), cambiar `${enLinea(ICO.imagen)}` por `${enLinea(ICO.herramienta)}`.

En `src/ui/tokens.css`, renombrar `.poner-foto` → `.poner-en-linea` en las seis reglas (líneas 388-400) y en el comentario («§6.9b — El botón de herramientas…»). En `tests/estilos-fotos.test.ts:22-27`, el mismo cambio de nombre.

- [ ] **Step 7: `main.ts`**

- Renombrar `acomodarBotonDeFoto` → `acomodarBotonDeLinea` en todas sus llamadas (`grep -n acomodarBotonDeFoto src/main.ts`) y en la propiedad `acomodarBoton` de `accionesDeFotos`.
- Adentro: `document.querySelector('#app .poner-en-linea')?.remove();`, **borrar** el `if (!fotosEditor.fotos().length) return;` y su comentario, y dibujar `botonHerramientas(...)` en vez de `botonPonerFoto(...)`. Actualizar el comentario de la función («El botón de herramientas, a la altura…»).
- `FICHAS_DE_FOTO` suma `#app [data-herramientas-linea]`.
- Una sección nueva en `registrarAcciones`:

```ts
  herramientasEditor: crearHerramientasEditor({
    campos: camposDelEditor,
    fotos: () => fotosEditor.fotos(),
    pantalla: {
      abrirFicha: abrirFichaFoto,
      cerrarFicha: cerrarFichaFoto,
      etiquetaEscrita: () => document.querySelector<HTMLInputElement>('#app [name="etiqueta-marca"]')?.value ?? '',
      pintarRuedas: (r) => {
        for (const k of ['h', 'm', 's'] as const) {
          const v = document.querySelector<HTMLElement>(`#app [data-rueda-marca="${k}"]`);
          if (v) v.textContent = k === 'h' ? String(r.h) : String(r[k]).padStart(2, '0');
        }
        const poner = document.querySelector<HTMLButtonElement>('#app [data-accion="poner-marca"]');
        if (poner) poner.disabled = aMs(r) <= 0;
      }
    }
  }).acciones,
```

  donde `camposDelEditor` es el objeto `CamposDelEditor` que hoy se le pasa a `crearFotosControl` (si está inline, sacarlo a una constante y pasar la misma a los dos).
- En `src/fotos-control.ts`, la acción `abrir-elegir-foto` ya no la dibuja nadie: borrarla. `renderElegirFoto` sigue (la usa la entrada Foto), y `poner-en` sigue igual.

- [ ] **Step 8: Tests de la vista y de integración**

- `tests/vista-editor.test.ts:700-716`: los tests de `botonPonerFoto` pasan a `botonHerramientas`, esperando `data-accion="abrir-herramientas-linea"`, `class="poner-en-linea"` y `ICO.herramienta`.
- `tests/main-rutas.test.ts`:
  - `#app .poner-foto` → `#app .poner-en-linea` y `.poner-foto` → `.poner-en-linea` (líneas ~717 y ~873).
  - El test de la línea ~4409: `data-accion="abrir-herramientas-linea"`.
  - El test «con el depósito vacío no hay botón» se reemplaza por: con el depósito vacío **hay** botón, y la capa tiene Foto deshabilitada:

```ts
    it('con el depósito vacío el botón está igual, y Foto va deshabilitada', async () => {
      estado.md = MD_SIN_FOTOS; // o el md que usen los tests del editor sin `## Fotos`
      const { abrir, tocar, posarCursor, botonesDeFoto, preguntas } = await montar();
      await abrir('#/r/f1/editar');
      await posarCursor('preparacion', 0);
      expect(botonesDeFoto.at(-1)).toContain('data-accion="abrir-herramientas-linea"');
      await tocar('abrir-herramientas-linea', { seccion: 'preparacion', linea: '0' });
      expect(preguntas.at(-1)).toMatch(/data-herramienta="foto"[^>]*disabled/);
    });
```

  - Los tests que tocan `abrir-elegir-foto` pasan por la capa: `await tocar('abrir-herramientas-linea', {…}); await tocar('elegir-herramienta-linea', { herramienta: 'foto', seccion, linea });` y después lo que ya hacían.
  - Uno nuevo: poner una cuenta escribe la marca en la línea sin redibujar el formulario (`app.innerHTML` igual que antes, como el test de la foto de la línea ~4496).

- [ ] **Step 9: Correr**

Run: `npx vitest run tests/herramientas-editor.test.ts tests/vista-editor.test.ts tests/estilos-fotos.test.ts tests/fotos-control.test.ts tests/main-rutas.test.ts && npm run typecheck`
Expected: PASS.

---

### Task 10: El skill y los documentos

**Files:**
- Modify: `skills/recetario/SKILL.md`, `product-design/product/specs/E05-Cimientos.md`, `E03-LeerYCocinar.md`, `E04-Corregir.md`, `E07-Herramientas.md`, `product-design/ux/design-system.md`, `product-design/ux/information-architecture.md`, `CLAUDE.md`, `BACKLOG.md`

- [ ] **Step 1: El skill**

En `skills/recetario/SKILL.md`, junto a lo de `![](foto:N)` en los pasos, una sección «Temporizadores en los pasos» con las reglas de la línea nueva de `REGLAS_DEL_CUERPO` (tarea 8), los cuatro ejemplos del spec (§El formato) y: «Al corregir una receta que ya existe, no se agregan marcas salvo que se pidan.»

- [ ] **Step 2: `product-design/`**

Cada documento dice cómo es el producto hoy, sin historial:
- `E05-Cimientos.md`: en el formato del cuerpo, junto a `foto:N`, las dos marcas, la duración, la etiqueta, el nombre que resulta, que una mal escrita se lee como su texto, y que el índice y la búsqueda ven sólo el texto.
- `E03-LeerYCocinar.md`: el botón al lado del texto en la receta y la cocina, que crea y arranca sin cambiar de pantalla, el bloqueo de 2 s con la tilde, y que el texto, el PDF y el invitado dejan sólo el texto.
- `E04-Corregir.md` F04.3d: el botón de herramientas y su capa (Foto, Cuenta regresiva, Cronómetro), cada paso, la marca vacía al final de la línea, y el epígrafe nuevo de C04.3d.1.
- `E07-Herramientas.md` C07.5b.1: los cronómetros con nombre en la lista, su ficha, la tira y la pantalla encendida; y que el botón de minutos de Referencias es el mismo `.ico-min` con `relojMas`.
- `design-system.md`: `.ico-min` (24 px, ícono 14, toque +10, tilde en `--exito`, más grande en cocina), los íconos `relojMas`, `cronometro`, `cronometroMas`, `herramienta`, `tilde`, y `.poner-en-linea` en lugar de `.poner-foto`.
- `information-architecture.md`: la capa «Agregar en esta línea» del editor, en las capas de §4.6.

- [ ] **Step 3: `CLAUDE.md`**

- En «Lo esencial», después del párrafo de las fotos: una viñeta corta sobre las marcas de temporizador (formato, dónde se ven, que el invitado no las tiene) y que los cronómetros con nombre van en la lista de Temporizadores.
- En «Dónde está cada cosa»: `marcas.ts` en Dominio; `marca-control.ts` y `herramientas-editor-control.ts` en Controladores; `herramientas-editor.ts` en UI.

- [ ] **Step 4: El spec**

En `docs/superpowers/specs/2026-10-07-temporizadores-en-la-receta-design.md`, donde dice `src/herramientas-editor.ts`, poner `src/ui/herramientas-editor.ts` y `src/herramientas-editor-control.ts`.

- [ ] **Step 5: Backlog**

`BACKLOG.md`: P126 pasa a `Falta probar`.

---

### Task 11: Verificación y revisión del diff

- [ ] **Step 1: Las tres en verde**

Run: `npm test && npm run typecheck && npm run build`
Expected: todo en verde. Si algo falla, arreglarlo antes de seguir.

- [ ] **Step 2: Buscar restos**

Run: `grep -rn "poner-foto\|abrir-elegir-foto\|referencia-temporizador\|botonPonerFoto\|acomodarBotonDeFoto" src tests product-design CLAUDE.md`
Expected: sin resultados.

- [ ] **Step 3: Mostrar el diff al usuario**

`git status` y `git diff --stat`, y un resumen por tarea. **Esperar el visto bueno.**

- [ ] **Step 4: Commit y push**

Con el visto bueno: commitear (mensaje en español, con la línea `Co-Authored-By` de la conversación) y pushear a `main` para probar en el teléfono sobre Pages: el botón en un paso y en la cocina, la tilde, la tira con un cronómetro con nombre, y el botón de herramientas del editor.
