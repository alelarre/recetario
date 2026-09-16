# Tags especiales — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que `favorito` tenga control propio en la receta, marca en la tarjeta y orden en las listas, que `probar` y `menú diario` se dibujen con ícono, y que los tags se puedan tocar desde un carrusel en el Recetario y en cada categoría.

**Architecture:** los tres son tags de la lista `tags` del `.md` —ningún cambio de esquema ni de índice—. Las reglas puras (qué tag es especial, en qué orden van, cómo se ordenan las recetas) viven en `src/catalogo.ts` y se testean solas; las vistas de `src/ui/` las consumen; `src/main.ts` cablea la estrella, las flechas del carrusel y la ruta nueva `#/t/<tag>`.

**Tech Stack:** TypeScript estricto, Vite, sin framework. Vistas que devuelven HTML como string y se pintan en `#app`. Tests con Vitest. CSS propio en `src/ui/tokens.css` (sistema) y `src/ui/base.css` (cada pantalla).

**Spec:** `docs/superpowers/specs/2026-09-16-tags-especiales-design.md`

## Global Constraints

- **Español rioplatense** en todo: comentarios, UI, nombres.
- **Los tres tags se escriben** `favorito`, `probar` y `menú diario`, **en minúscula**, tal cual van en el `.md`.
- **Nada de claves nuevas en el frontmatter ni columnas nuevas en el índice.** `SCHEMA_VERSION` no se toca.
- **Todo texto que venga de un `.md` pasa por `escapar()`** antes de entrar al HTML.
- **Los íconos son de trazo**, `stroke-width: 1.5`, sin relleno, salvo la estrella encendida.
- **La animación de la estrella dura 2 s** por vuelta.
- **El carrusel del Recetario corta en 20 tags**; el de una categoría, no corta.
- **Las flechas del carrusel sólo con** `@media (hover: hover) and (pointer: fine)`.
- **`npm test`, `npm run typecheck` y `npm run build` tienen que quedar en verde al terminar cada tarea.**
- **No commitear sin el visto bueno del usuario** (convención del proyecto para features con spec y plan): cada tarea deja el commit preparado y se muestra el diff.

---

### Task 1: Las reglas puras, en el catálogo

**Files:**
- Modify: `src/catalogo.ts`
- Test: `tests/catalogo-especiales.test.ts` (crear)

**Interfaces:**
- Consumes: `normalizar` de `src/recipe.js`, el tipo `Entrada` de `src/tipos.js`.
- Produces:
  - `TAGS_ESPECIALES: readonly ['favorito', 'probar', 'menú diario']`
  - `type TagEspecial = 'favorito' | 'probar' | 'menú diario'`
  - `tagEspecial(valor: unknown): TagEspecial | null`
  - `esFavorita(x: { tags: string[] }): boolean`
  - `ordenarTags(tags: string[]): string[]`
  - `ordenarRecetas(entradas: Entrada[]): Entrada[]`
  - `conFavorito(tags: string[], favorita: boolean): string[]`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/catalogo-especiales.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  TAGS_ESPECIALES, tagEspecial, esFavorita, ordenarTags, ordenarRecetas, conFavorito, tagReservado
} from '../src/catalogo.js';
import { entradaFalsa } from './dobles.js';

describe('los tags especiales', () => {
  it('son tres, en orden fijo y en minúscula', () => {
    expect(TAGS_ESPECIALES).toEqual(['favorito', 'probar', 'menú diario']);
  });

  it('reconoce cada uno sin importar mayúsculas ni tildes', () => {
    expect(tagEspecial('Favorito')).toBe('favorito');
    expect(tagEspecial('menu diario')).toBe('menú diario');
    expect(tagEspecial('MENÚ DIARIO')).toBe('menú diario');
    expect(tagEspecial('probar')).toBe('probar');
  });

  it('un tag común no es especial', () => {
    expect(tagEspecial('horno')).toBeNull();
    expect(tagEspecial('')).toBeNull();
    expect(tagEspecial(undefined)).toBeNull();
  });

  it('`menú diario` queda reservado: no se puede escribir a mano', () => {
    expect(tagReservado('menú diario')).toBe(true);
    expect(tagReservado('menu diario')).toBe(true);
  });

  it('una receta es favorita si lleva el tag, escrito como sea', () => {
    expect(esFavorita({ tags: ['horno', 'Favorita'] })).toBe(true);
    expect(esFavorita({ tags: ['horno'] })).toBe(false);
    expect(esFavorita({ tags: [] })).toBe(false);
  });

  it('ordena los tags con los especiales primero, en su orden', () => {
    expect(ordenarTags(['horno', 'menú diario', 'clásica', 'favorito']))
      .toEqual(['favorito', 'menú diario', 'horno', 'clásica']);
  });

  it('ordena las recetas con las favoritas primero y alfabético adentro', () => {
    const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags });
    const orden = ordenarRecetas([
      e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])
    ]).map(x => x.titulo);
    expect(orden).toEqual(['Asado', 'Osobuco', 'Bife', 'Vitel toné']);
  });

  it('pone y saca `favorito` sin tocar los demás tags', () => {
    expect(conFavorito(['horno'], true)).toEqual(['favorito', 'horno']);
    expect(conFavorito(['favorito', 'horno'], true)).toEqual(['favorito', 'horno']);
    expect(conFavorito(['Favorita', 'horno'], false)).toEqual(['horno']);
    expect(conFavorito(['horno'], false)).toEqual(['horno']);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/catalogo-especiales.test.ts`
Expected: FAIL — `TAGS_ESPECIALES` no existe.

- [ ] **Step 3: Implementar en `src/catalogo.ts`**

En `TAGS_RESERVADOS`, agregar el tercero al final de la lista, después de `'probar'`:

```ts
  'probar',
  'menú diario', 'menu diario'
] as const;
```

Y al final del archivo, las reglas nuevas:

```ts
/**
 * Los tags que la app dibuja distinto: ícono propio y lugar fijo al principio
 * de cualquier fila de tags (P27). No son estados: son tags, y viven en la
 * lista `tags` del `.md` como cualquier otro.
 */
export const TAGS_ESPECIALES = ['favorito', 'probar', 'menú diario'] as const;
export type TagEspecial = (typeof TAGS_ESPECIALES)[number];

/** El especial que le corresponde a un tag escrito de cualquier forma, o `null`. */
export function tagEspecial(valor: unknown): TagEspecial | null {
  const n = normalizar(String(valor ?? ''));
  if (!n) return null;
  return TAGS_ESPECIALES.find(t => normalizar(t) === n) ?? null;
}

/** Lleva el tag `favorito`, escrito como sea. */
export function esFavorita(x: { tags: string[] }): boolean {
  const tags = Array.isArray(x?.tags) ? x.tags : [];
  return tags.some(t => tagEspecial(t) === 'favorito');
}

/** Los especiales primero, en el orden de `TAGS_ESPECIALES`; el resto como venía. */
export function ordenarTags(tags: string[]): string[] {
  const lista = Array.isArray(tags) ? tags : [];
  const peso = (t: string): number => {
    const esp = tagEspecial(t);
    return esp ? TAGS_ESPECIALES.indexOf(esp) : TAGS_ESPECIALES.length;
  };
  return [...lista].sort((a, b) => peso(a) - peso(b));
}

/**
 * Las favoritas primero y, dentro de cada bloque, alfabético (P27). Es una
 * excepción al alfabético, no su reemplazo: sin favoritas, el orden es el de
 * siempre.
 */
export function ordenarRecetas(entradas: Entrada[]): Entrada[] {
  const lista = Array.isArray(entradas) ? entradas : [];
  return [...lista].sort((a, b) =>
    Number(esFavorita(b)) - Number(esFavorita(a)) || a.titulo.localeCompare(b.titulo, 'es'));
}

/** La lista de tags con `favorito` puesto o sacado, sin tocar los demás. */
export function conFavorito(tags: string[], favorita: boolean): string[] {
  const sinFavorito = (Array.isArray(tags) ? tags : []).filter(t => tagEspecial(t) !== 'favorito');
  return favorita ? ['favorito', ...sinFavorito] : sinFavorito;
}
```

`Array.sort` en JavaScript es estable, así que `ordenarTags` conserva el orden original entre los tags comunes.

- [ ] **Step 4: Correr los tests y ver que pasan**

Run: `npx vitest run tests/catalogo-especiales.test.ts && npm run typecheck`
Expected: PASS y typecheck en verde.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/catalogo.ts tests/catalogo-especiales.test.ts
git commit -m "Los tres tags especiales, con sus reglas"
```

---

### Task 2: Los dos íconos y los chips con ícono

**Files:**
- Modify: `src/ui/iconos.ts`, `src/ui/componentes.ts`
- Test: `tests/componentes.test.ts`

**Interfaces:**
- Consumes: `TAGS_ESPECIALES`, `tagEspecial`, `ordenarTags` de `src/catalogo.js`.
- Produces:
  - `ICO.marcador` e `ICO.calendario` en `src/ui/iconos.ts`
  - `iconoDeTag(tag: string): string` en `src/ui/componentes.ts` — el SVG del especial, o `''`
  - `chipTag(tag: string, opciones?: { activo?: boolean; cantidad?: number; accion?: string }): string`
  - `chipsSueltos(tags: string[], activos?: string[]): string` — los chips sin el contenedor
  - `chips(tags, activos)` pasa a ordenar con `ordenarTags` y a dibujar el ícono

- [ ] **Step 1: Escribir el test que falla**

Agregar a `tests/componentes.test.ts`:

```ts
import { chips, chipTag, iconoDeTag } from '../src/ui/componentes.js';
import { ICO } from '../src/ui/iconos.js';

describe('los chips de tags', () => {
  it('cada especial tiene su ícono y los comunes no llevan ninguno', () => {
    expect(iconoDeTag('favorito')).toBe(ICO.estrella);
    expect(iconoDeTag('probar')).toBe(ICO.marcador);
    expect(iconoDeTag('menú diario')).toBe(ICO.calendario);
    expect(iconoDeTag('horno')).toBe('');
  });

  it('el chip lleva el ícono adelante del nombre', () => {
    expect(chipTag('probar')).toContain(`${ICO.marcador}probar`);
  });

  it('el chip puede llevar su cantidad', () => {
    expect(chipTag('horno', { cantidad: 4 })).toContain('<span class="cuenta">4</span>');
  });

  it('el activo se marca', () => {
    expect(chipTag('horno', { activo: true })).toContain('class="chip act"');
  });

  it('la fila de tags de una receta pone los especiales primero', () => {
    const html = chips(['horno', 'menú diario', 'favorito']);
    expect(html.indexOf('favorito')).toBeLessThan(html.indexOf('menú diario'));
    expect(html.indexOf('menú diario')).toBeLessThan(html.indexOf('horno'));
  });

  it('escapa lo que viene del archivo', () => {
    expect(chipTag('<b>x</b>')).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/componentes.test.ts`
Expected: FAIL — `chipTag` no existe.

- [ ] **Step 3: Implementar**

En `src/ui/iconos.ts`, dentro de `ICO`, después de `bandeja`:

```ts
  /** Los dos tags especiales que no son favorito: «probar» y «menú diario». */
  marcador: svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  calendario: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  /** Favorito: la misma estrella en la receta, en la tarjeta y en el carrusel. */
  estrella: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>'),
```

En `src/ui/componentes.ts`, agregar el import y reemplazar `chips`:

```ts
import { tagEspecial, ordenarTags } from '../catalogo.js';
```

```ts
/** El ícono del tag especial, o nada si es un tag común. */
export function iconoDeTag(tag: string): string {
  const esp = tagEspecial(tag);
  if (esp === 'favorito') return ICO.estrella;
  if (esp === 'probar') return ICO.marcador;
  if (esp === 'menú diario') return ICO.calendario;
  return '';
}

export interface OpcionesChip {
  activo?: boolean;
  /** Cuántas recetas lo llevan. Sin número, no se dibuja. */
  cantidad?: number;
  /** La acción del click. Por defecto el filtro por tag, que `main` ya escucha. */
  accion?: string;
}

/** §6.10 — Un tag como chip: con su ícono si es especial, y con su número si lo trae. */
export function chipTag(tag: string, { activo, cantidad, accion }: OpcionesChip = {}): string {
  const cuenta = cantidad === undefined ? '' : `<span class="cuenta">${cantidad}</span>`;
  const attr = accion ? ` data-accion="${escapar(accion)}"` : '';
  return `<button class="chip${activo ? ' act' : ''}"${attr} data-tag="${escapar(tag)}">` +
    `${iconoDeTag(tag)}${escapar(tag)}${cuenta}</button>`;
}

/**
 * Los chips sueltos, sin el contenedor: los usa la receta, que arma su fila
 * poniendo la marca de incompleta antes que los tags.
 */
export function chipsSueltos(tags: string[], activos: string[] = []): string {
  return ordenarTags(Array.isArray(tags) ? tags : [])
    .map(tag => chipTag(tag, { activo: activos.includes(tag) })).join('');
}

/** §6.10 — Los tags como chips; los activos marcados con el acento, los especiales primero. */
export function chips(tags: string[], activos: string[] = []): string {
  return `<div class="chips">${chipsSueltos(tags, activos)}</div>`;
}
```

- [ ] **Step 4: Correr los tests y ver que pasan**

Run: `npx vitest run && npm run typecheck`
Expected: PASS. Si algún test viejo comparaba el HTML exacto de un chip, actualizarlo para que compare el nombre y la clase, no el string entero.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/iconos.ts src/ui/componentes.ts tests/componentes.test.ts
git commit -m "Los tags especiales se dibujan con su ícono"
```

---

### Task 3: La marca en la tarjeta y el orden en las listas

**Files:**
- Modify: `src/ui/componentes.ts`, `src/ui/categoria.ts`, `src/ui/resultados.ts`, `src/ui/tokens.css`
- Test: `tests/componentes.test.ts`, `tests/vista-categoria.test.ts`, `tests/vista-resultados.test.ts`

**Interfaces:**
- Consumes: `esFavorita`, `ordenarRecetas` de `src/catalogo.js`; `ICO.estrella`.
- Produces: la clase CSS `.fav-esq`, y `tarjeta()` con la estrella de la esquina.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/componentes.test.ts`:

```ts
import { tarjeta } from '../src/ui/componentes.js';
import { entradaFalsa } from './dobles.js';

describe('la marca de favorito en la tarjeta', () => {
  it('una favorita lleva la estrella en la esquina', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Asado', tags: ['favorito'] }));
    expect(html).toContain('class="fav-esq"');
    expect(html).toContain('aria-label="Favorita"');
  });

  it('las demás no llevan nada', () => {
    expect(tarjeta(entradaFalsa({ titulo: 'Asado', tags: ['horno'] }))).not.toContain('fav-esq');
  });
});
```

En `tests/vista-categoria.test.ts`:

```ts
it('las favoritas van primero, y adentro sigue el alfabético', () => {
  const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags, categoria: 'Carnes' });
  const html = renderCategoria({
    nombre: 'Carnes',
    entradas: [e('Vitel toné'), e('Osobuco', ['favorito']), e('Bife'), e('Asado', ['favorito'])],
    total: 4, visibles: 4, tagsActivos: []
  });
  const orden = ['Asado', 'Osobuco', 'Bife', 'Vitel toné'].map(t => html.indexOf(t));
  expect(orden).toEqual([...orden].sort((a, b) => a - b));
});
```

En `tests/vista-resultados.test.ts`:

```ts
it('cada subsección ordena sus favoritas primero, sin mezclarse entre subsecciones', () => {
  const e = (titulo: string, tags: string[] = []) => entradaFalsa({ titulo, tags });
  const html = renderResultados({
    consulta: 'x',
    grupos: {
      porNombre: [e('Zapallo'), e('Arroz', ['favorito'])],
      porIngrediente: [{ entrada: e('Budín'), motivo: 'Lleva huevo' }],
      porTag: []
    }
  });
  expect(html.indexOf('Arroz')).toBeLessThan(html.indexOf('Zapallo'));
  // La favorita del primer grupo no se sube al grupo de arriba de todo.
  expect(html.indexOf('Por nombre')).toBeLessThan(html.indexOf('Arroz'));
});
```

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/componentes.test.ts tests/vista-categoria.test.ts tests/vista-resultados.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `src/ui/componentes.ts`, importar `esFavorita` y sumar la estrella al final de la tarjeta:

```ts
import { tagEspecial, ordenarTags, esFavorita } from '../catalogo.js';
```

```ts
  const favorita = esFavorita(e)
    ? `<span class="fav-esq" role="img" aria-label="Favorita">${ICO.estrella}</span>` : '';
  return `<a class="tarjeta" href="#/r/${encodeURIComponent(e.id_archivo)}">` +
    placeholder(e.categoria, e.foto) +
    '<span class="txt">' +
      `<span class="n">${escapar(e.titulo)}</span>` +
      `<span class="ctx">${contexto}${marca}</span>` +
    '</span>' + favorita + '</a>';
```

En `src/ui/categoria.ts`, reemplazar el orden alfabético:

```ts
import { ordenarRecetas } from '../catalogo.js';
```

```ts
  // Las favoritas primero; dentro de cada bloque, alfabético (P27).
  const lista = ordenarRecetas(entradas).map(e => tarjeta(e)).join('');
```

En `src/ui/resultados.ts`, ordenar cada grupo antes de dibujarlo:

```ts
import { ordenarRecetas } from '../catalogo.js';
```

```ts
  const conMotivoOrdenado = (cs: Coincidencia[]): string[] => {
    // Se ordenan las entradas y se vuelve a cada coincidencia por su id: el
    // motivo viaja con la coincidencia, no con la entrada.
    const porId = new Map(cs.map(c => [c.entrada.id_archivo, c]));
    return ordenarRecetas(cs.map(c => c.entrada))
      .map(e => porId.get(e.id_archivo))
      .filter((c): c is Coincidencia => !!c)
      .map(conMotivo);
  };

  const cuerpo =
    grupo('Por nombre', ordenarRecetas(porNombre).map(e => tarjeta(e))) +
    grupo('Por ingrediente', conMotivoOrdenado(porIngrediente)) +
    grupo('Por tag', conMotivoOrdenado(porTag));
```

En `src/ui/tokens.css`, después de la regla `.tarjeta .ctx`:

```css
/* §6.1 — La estrella de favorito, en la esquina de la tarjeta (P27). La
   reserva de espacio va en el texto: sin ella, un título largo pasa por debajo. */
.tarjeta { position: relative; }
.tarjeta .txt { padding-right: 22px; }
.fav-esq { position: absolute; top: 6px; right: 8px; line-height: 0; }
.fav-esq svg { width: 18px; height: 18px; stroke: var(--acento); fill: none; stroke-width: 1.5;
               stroke-linejoin: round; fill: color-mix(in srgb, var(--acento) 35%, transparent); }
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/componentes.ts src/ui/categoria.ts src/ui/resultados.ts src/ui/tokens.css tests/
git commit -m "Las favoritas primero, con su estrella en la tarjeta"
```

---

### Task 4: La estrella en la receta

**Files:**
- Modify: `src/ui/receta.ts`, `src/ui/base.css`
- Test: `tests/vista-receta.test.ts`

**Interfaces:**
- Consumes: `esFavorita` de `src/catalogo.js`, `ICO.estrella`.
- Produces: `renderReceta` acepta `favorito?: 'no' | 'si' | 'escribiendo'` y dibuja el botón `data-accion="favorito"`.

- [ ] **Step 1: Escribir el test que falla**

En `tests/vista-receta.test.ts`:

```ts
describe('la estrella de favorito', () => {
  const receta = parse('---\ntitulo: Asado\ntags: [horno]\n---\n');

  it('va en el encabezado, apagada', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta });
    expect(html).toContain('data-accion="favorito"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain('class="fav on"');
  });

  it('se enciende cuando la receta lleva el tag', () => {
    const conTag = parse('---\ntitulo: Asado\ntags: [favorito]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: conTag });
    expect(html).toContain('class="fav on"');
    expect(html).toContain('aria-pressed="true"');
  });

  it('mientras escribe muestra el estado de carga y no acepta otro toque', () => {
    const html = renderReceta({ entrada: entradaFalsa(), receta, favorito: 'escribiendo' });
    expect(html).toContain('class="fav cargando"');
    expect(html).toContain('disabled');
  });

  it('los tags especiales van primeros y con su ícono', () => {
    const conTags = parse('---\ntitulo: Asado\ntags: [horno, probar]\n---\n');
    const html = renderReceta({ entrada: entradaFalsa(), receta: conTags });
    expect(html.indexOf('probar')).toBeLessThan(html.indexOf('horno'));
    expect(html).toContain(ICO.marcador);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/vista-receta.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `src/ui/receta.ts`, sumar la opción y el botón, y usar `chips()` para la fila de tags:

```ts
import { chipsSueltos } from './componentes.js';
import { esFavorita } from '../catalogo.js';
```

```ts
export interface OpcionesReceta {
  entrada: Entrada | null;
  receta: Receta;
  compartir?: EstadoCompartir;
  /** Qué está pasando con la estrella: nada, o una escritura en curso. */
  favorito?: 'escribiendo';
}
```

```ts
/**
 * La estrella del encabezado: pone y saca el tag `favorito` (P27). Son dos
 * estrellas superpuestas —el contorno y la llena—, y mientras Drive contesta
 * la llena se descubre de izquierda a derecha, en loop. El resultado se dibuja
 * recién con la respuesta: la app no adivina lo que todavía no se escribió.
 */
function botonFavorito(receta: Receta, escribiendo: boolean): string {
  const puesta = esFavorita(receta);
  const clase = escribiendo ? 'fav cargando' : puesta ? 'fav on' : 'fav';
  return `<button class="ico" data-accion="favorito" aria-label="Favorito" ` +
    `aria-pressed="${puesta}"${escribiendo ? ' disabled' : ''}>` +
    `<span class="${clase}">${ICO.estrella}${ICO.estrella}</span></button>`;
}
```

En el cuerpo de `renderReceta`, reemplazar la fila de tags y el encabezado:

```ts
  const marca = receta.completa ? '' :
    '<button class="chip pend" data-accion="editar" aria-label="Incompleta: abrir el editor">' +
      '<span class="inc"></span>Incompleta</button>';
  // Los tags, con los especiales primero y con su ícono (P27). La marca de
  // incompleta sigue yendo antes que todos.
  const marcas = marca || receta.tags.length
    ? `<div class="chips">${marca}${chipsSueltos(receta.tags)}</div>`
    : '';
```

El import de `chipsSueltos` sale de `componentes.js`, donde lo dejó la tarea 2.

Y el encabezado:

```ts
  const botonCompartir = `<button class="ico" data-accion="compartir" aria-label="Compartir">${ICO.compartir}</button>`;
  const estrella = botonFavorito(receta, favorito === 'escribiendo');
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: estrella + botonCompartir + alArchivo }) +
```

En `src/ui/base.css`, en la sección de la receta:

```css
/* §6.5 — La estrella de favorito del encabezado (P27): el contorno y la llena,
   superpuestas. Mientras se escribe en Drive, la llena se descubre de izquierda
   a derecha en loop; el resultado se dibuja recién con la respuesta. */
.fav { position: relative; display: inline-grid; place-items: center; line-height: 0; }
.fav svg { grid-area: 1 / 1; width: var(--ico); height: var(--ico); fill: none; stroke-width: 1.5;
           stroke-linejoin: round; }
.fav svg:first-child { stroke: currentColor; }
.fav svg:last-child { stroke: var(--acento); fill: color-mix(in srgb, var(--acento) 45%, transparent);
                      clip-path: inset(0 100% 0 0); }
.fav.on { color: var(--acento); }
.fav.on svg:last-child { clip-path: inset(0); }
.fav.cargando { color: var(--acento); }
.fav.cargando svg:last-child { animation: llenar 2s linear infinite; }
@keyframes llenar { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@media (prefers-reduced-motion: reduce) {
  .fav.cargando svg:last-child { animation: none; clip-path: inset(0 50% 0 0); }
}
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/receta.ts src/ui/componentes.ts src/ui/base.css tests/vista-receta.test.ts
git commit -m "La estrella de favorito, en el encabezado de la receta"
```

---

### Task 5: La acción de la estrella

**Files:**
- Modify: `src/main.ts`
- Test: `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `conFavorito`, `esFavorita` de `src/catalogo.js`; `store.guardar`; `recetaLeida` y `recetaDePantalla` de `main.ts`.
- Produces: la acción `favorito` en la delegación de clicks.

- [ ] **Step 1: Escribir el test que falla**

En `tests/main-rutas.test.ts`, con el doble de store que ya existe —agregarle un espía de `guardar`—:

```ts
it('la estrella pone el tag, guarda y queda encendida', async () => {
  estado.md = '---\ntitulo: Rabas\ntags: [frito]\n---\n';
  const { abrir, tocar, app } = await montar();
  await abrir('#/r/f1');

  await tocar('favorito');

  expect(estado.guardados.at(-1)?.tags).toEqual(['favorito', 'frito']);
  expect(app.innerHTML).toContain('class="fav on"');
});

it('tocarla de nuevo lo saca', async () => {
  estado.md = '---\ntitulo: Rabas\ntags: [favorito, frito]\n---\n';
  const { abrir, tocar, app } = await montar();
  await abrir('#/r/f1');

  await tocar('favorito');

  expect(estado.guardados.at(-1)?.tags).toEqual(['frito']);
  expect(app.innerHTML).not.toContain('class="fav on"');
});

it('si la escritura falla, la estrella vuelve como estaba y avisa', async () => {
  estado.md = '---\ntitulo: Rabas\n---\n';
  estado.fallaGuardar = 1;
  const { abrir, tocar, app } = await montar();
  await abrir('#/r/f1');

  await tocar('favorito');

  expect(app.innerHTML).not.toContain('class="fav on"');
  expect(app.innerHTML).toContain('No se pudo marcar');
});
```

En el doble del store del mismo archivo, agregar:

```ts
  guardar: async (_id: string, receta: { tags: string[] }) => {
    if (estado.fallaGuardar > 0) { estado.fallaGuardar--; throw new Error('red'); }
    estado.guardados.push({ tags: receta.tags });
  },
```

y en `estado`: `guardados: [] as { tags: string[] }[]`, `fallaGuardar: 0`, limpiados en el `afterEach`.

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/main-rutas.test.ts`
Expected: FAIL — la acción no existe.

- [ ] **Step 3: Implementar en `src/main.ts`**

Importar:

```ts
import { conFavorito, esFavorita } from './catalogo.js';
```

Sumar el estado de la escritura, al lado de `recetaLeida`:

```ts
/** La estrella de favorito está escribiendo: dura lo que tarda Drive (P27). */
let marcandoFavorito = false;
```

Sumar también dónde vive el error de la escritura:

```ts
/** Lo último que falló al marcar favorito. Lo dibuja la receta, arriba de la ficha. */
let errorFavorito = '';
```

En el bloque de `cambiaDePantalla`, junto a los demás estados que se limpian al navegar:

```ts
    marcandoFavorito = false;
    errorFavorito = '';
```

Y la acción, junto a las demás de la receta:

```ts
  if (accion === 'favorito') {
    const id = vistaActual?.params['id'] ?? '';
    const actual = recetaLeida?.receta;
    if (!id || !actual || marcandoFavorito) return;

    // El resultado se dibuja recién cuando Drive contesta (P27): mientras
    // tanto, la estrella muestra que está escribiendo y no acepta otro toque.
    marcandoFavorito = true;
    errorFavorito = '';
    await render();

    const nueva = { ...actual, tags: conFavorito(actual.tags, !esFavorita(actual)) };
    try {
      await store.guardar(id, nueva);
      recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta: nueva };
    } catch (err) {
      console.error(err);
      errorFavorito = 'No se pudo marcar como favorita. Revisá la conexión.';
    }
    marcandoFavorito = false;
    return render();
  }
```

En la rama `case 'receta'`, pasarle los dos a la vista:

```ts
        pintar(renderReceta({
          entrada, receta,
          ...(compartiendo ? { compartir: compartiendo } : {}),
          ...(marcandoFavorito ? { favorito: 'escribiendo' as const } : {}),
          ...(errorFavorito ? { error: errorFavorito } : {})
        }));
```

Y en `src/ui/receta.ts`, sumar `error?: string` a `OpcionesReceta` y dibujarlo arriba de la ficha, con el mismo aviso que usa el resto de la app (R1):

```ts
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: estrella + botonCompartir + alArchivo }) +
    '<div class="cuerpo">' +
      (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'favorito' } }) : '') +
      fichaCabecera({ receta, categoria, marcas }) + fichasDelCuerpo(receta) +
    '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`) +
    (compartir ? renderFichaCompartir(compartir) : '');
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/main.ts src/ui/receta.ts tests/main-rutas.test.ts tests/vista-receta.test.ts
git commit -m "Marcar favorito escribe el .md y su fila"
```

---

### Task 6: El carrusel

**Files:**
- Modify: `src/ui/componentes.ts`, `src/ui/base.css`
- Test: `tests/componentes.test.ts`

**Interfaces:**
- Consumes: `chipTag`, `ordenarTags`, `TAGS_ESPECIALES`, `tagEspecial`.
- Produces: `carruselTags(tags: { tag: string; cantidad: number }[], opciones?: { activos?: string[]; tope?: number }): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { carruselTags } from '../src/ui/componentes.js';

describe('el carrusel de tags', () => {
  const tags = [
    { tag: 'horno', cantidad: 11 }, { tag: 'favorito', cantidad: 3 },
    { tag: 'clásica', cantidad: 14 }, { tag: 'menú diario', cantidad: 2 }
  ];

  it('pone los especiales primero y después los demás por cantidad', () => {
    const html = carruselTags(tags);
    const orden = ['favorito', 'menú diario', 'clásica', 'horno'].map(t => html.indexOf(`>${t}<`));
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
  });

  it('cada chip lleva su número', () => {
    expect(carruselTags(tags)).toContain('<span class="cuenta">14</span>');
  });

  it('sin tags no dibuja nada', () => {
    expect(carruselTags([])).toBe('');
  });

  it('corta en el tope cuando se lo pasan, sin contar los especiales', () => {
    const muchos = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
    const html = carruselTags([...muchos, { tag: 'favorito', cantidad: 1 }], { tope: 20 });
    expect(html).toContain('>favorito<');
    expect(html).toContain('>t19<');
    expect(html).not.toContain('>t20<');
  });

  it('lleva las dos flechas y el marco del degradé', () => {
    const html = carruselTags(tags);
    expect(html).toContain('class="carrusel-marco"');
    expect(html).toContain('data-accion="carrusel-izq"');
    expect(html).toContain('data-accion="carrusel-der"');
  });

  it('marca los activos', () => {
    expect(carruselTags(tags, { activos: ['horno'] })).toContain('class="chip act"');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/componentes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

En `src/ui/componentes.ts`:

```ts
export interface OpcionesCarrusel {
  activos?: string[];
  /** Cuántos tags comunes entran. Los especiales no cuentan y van siempre. */
  tope?: number;
}

/**
 * El carrusel de tags que filtra (P27): los especiales primero y en su orden,
 * después los demás por cantidad. Se desliza de costado; el degradé dice que
 * sigue, y las flechas aparecen sólo con mouse o trackpad.
 */
export function carruselTags(
  tags: { tag: string; cantidad: number }[], { activos = [], tope }: OpcionesCarrusel = {}
): string {
  const lista = Array.isArray(tags) ? tags : [];
  const especiales = TAGS_ESPECIALES
    .map(t => lista.find(x => tagEspecial(x.tag) === t))
    .filter((x): x is { tag: string; cantidad: number } => !!x && x.cantidad > 0);
  const comunes = lista.filter(x => !tagEspecial(x.tag));
  const cortados = tope === undefined ? comunes : comunes.slice(0, tope);
  const todos = [...especiales, ...cortados];
  if (!todos.length) return '';

  const chips = todos
    .map(({ tag, cantidad }) => chipTag(tag, { cantidad, activo: activos.includes(tag) }))
    .join('');
  return '<div class="carrusel-marco">' +
    `<div class="carrusel" data-carrusel>${chips}</div>` +
    `<button class="carrusel-flecha izq" data-accion="carrusel-izq" aria-label="Tags anteriores">${ICO.volver}</button>` +
    `<button class="carrusel-flecha der" data-accion="carrusel-der" aria-label="Más tags">${ICO.chevron}</button>` +
    '</div>';
}
```

`comunes` ya viene ordenado por cantidad: `store.tagsDe()` ordena por cantidad y desempata alfabético.

En `src/ui/iconos.ts`, el chevron que mira a la derecha:

```ts
  /** El chevron hacia adelante: la flecha derecha del carrusel. */
  chevron: svg('<path d="M9 18l6-6-6-6"/>'),
```

En `src/ui/base.css`:

```css
/* ---- El carrusel de tags (P27) ---- */
.carrusel-marco { position: relative; margin-bottom: var(--e-3); }
.carrusel { display: flex; gap: var(--e-2); overflow-x: auto; padding-bottom: var(--e-1);
            scrollbar-width: none; scroll-behavior: smooth; }
.carrusel::-webkit-scrollbar { display: none; }
.carrusel .chip { flex: 0 0 auto; }
.chip .cuenta { color: var(--fg-3); font-variant-numeric: tabular-nums; margin-left: 2px; }
.chip.act .cuenta { color: inherit; opacity: .8; }
.chip svg { width: 14px; height: 14px; }

/* El degradé dice que sigue. A la derecha mientras quede algo; a la izquierda,
   sólo cuando ya se corrió. La opacidad se ata a la posición del carrusel sin
   JavaScript; donde no haya soporte, los dos se ven siempre, que no rompe nada. */
.carrusel-marco::before, .carrusel-marco::after {
  content: ''; position: absolute; top: 0; bottom: var(--e-1); width: 40px; pointer-events: none; }
.carrusel-marco::after { right: 0; background: linear-gradient(to right, transparent, var(--bg)); }
.carrusel-marco::before { left: 0; background: linear-gradient(to left, transparent, var(--bg)); }
@supports (animation-timeline: scroll()) {
  .carrusel-marco { timeline-scope: --tags; }
  .carrusel { scroll-timeline: --tags inline; }
  .carrusel-marco::before { opacity: 0; animation: aparecer linear both;
                            animation-timeline: --tags; animation-range: 0 40px; }
  .carrusel-marco::after { animation: desaparecer linear both;
                           animation-timeline: --tags; animation-range: calc(100% - 40px) 100%; }
}
@keyframes aparecer { to { opacity: 1; } }
@keyframes desaparecer { to { opacity: 0; } }

/* Las flechas, sólo con mouse o trackpad: en el teléfono se desliza con el dedo. */
.carrusel-flecha { display: none; position: absolute; top: 50%; transform: translateY(-50%); z-index: 1;
  width: 32px; height: 32px; place-items: center; cursor: pointer; color: var(--fg);
  background: var(--surface-alta); border: 1px solid var(--borde-fuerte); border-radius: 50%; }
.carrusel-flecha svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
.carrusel-flecha.izq { left: 0; }
.carrusel-flecha.der { right: 0; }
@media (hover: hover) and (pointer: fine) {
  .carrusel-flecha { display: grid; }
  .carrusel { padding-inline: 40px; }
}
@media (prefers-reduced-motion: reduce) { .carrusel { scroll-behavior: auto; } }
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/componentes.ts src/ui/iconos.ts src/ui/base.css tests/componentes.test.ts
git commit -m "El carrusel de tags, con su degradé y sus flechas"
```

---

### Task 7: El carrusel en el Recetario y en la categoría

**Files:**
- Modify: `src/ui/recetario.ts`, `src/ui/categoria.ts`, `src/main.ts`
- Test: `tests/vista-recetario.test.ts`, `tests/vista-categoria.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `carruselTags`; `store.tagsDe(categoria?)`, que devuelve `{ tag, cantidad }[]` ya ordenado por cantidad.
- Produces: `renderRecetario` y `renderCategoria` aceptan `tags: { tag: string; cantidad: number }[]`.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/vista-recetario.test.ts`:

```ts
it('dibuja el carrusel debajo de la búsqueda y arriba de las categorías', () => {
  const html = dibujar({ tags: [{ tag: 'horno', cantidad: 3 }] });
  expect(html.indexOf('data-accion="buscar"')).toBeLessThan(html.indexOf('carrusel-marco'));
  expect(html.indexOf('carrusel-marco')).toBeLessThan(html.indexOf('Categorías'));
});

it('sin tags no hay carrusel', () => {
  expect(dibujar({ tags: [] })).not.toContain('carrusel-marco');
});
```

En `tests/vista-categoria.test.ts`:

```ts
it('el carrusel va arriba de la lista, con los tags de la categoría', () => {
  const html = renderCategoria({
    nombre: 'Carnes', entradas: [], total: 0, visibles: 0, tagsActivos: [],
    tags: [{ tag: 'horno', cantidad: 2 }]
  });
  expect(html).toContain('carrusel-marco');
  expect(html).toContain('>horno<');
});
```

En `tests/main-rutas.test.ts`:

```ts
it('el Recetario corta el carrusel en veinte tags', async () => {
  estado.tags = Array.from({ length: 25 }, (_, i) => ({ tag: `t${i}`, cantidad: 25 - i }));
  const { abrir, app } = await montar();
  await abrir('#/');
  expect(app.innerHTML).toContain('>t19<');
  expect(app.innerHTML).not.toContain('>t20<');
});
```

con `tagsDe: () => estado.tags` en el doble del store y `tags: []` en `estado`.

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/vista-recetario.test.ts tests/vista-categoria.test.ts tests/main-rutas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/ui/recetario.ts`:

```ts
import { encabezado, tile, lateral, botonMenu, carruselTags } from './componentes.js';

export interface OpcionesRecetario {
  categorias: { id: string; nombre: string; cantidad: number }[];
  borradores: number;
  menuAbierto?: boolean;
  /** Los tags del recetario entero, ya ordenados por cantidad (P27). */
  tags?: { tag: string; cantidad: number }[];
}
```

```ts
      '<div class="cuerpo">' +
        '<div class="buscar">' + ICO.buscar +
          '<input data-accion="buscar" placeholder="Buscar receta o ingrediente">' +
        '</div>' +
        // Los veinte más usados: con cientos de recetas la cola larga no aporta,
        // y para eso está la búsqueda.
        carruselTags(tags ?? [], { tope: 20 }) +
        '<div><div class="rot">Categorías</div>' +
```

`src/ui/categoria.ts`: sumar `tags?: { tag: string; cantidad: number }[]` a las opciones y reemplazar el bloque `filtros`:

```ts
  // El carrusel reemplaza a la fila de chips activos: los puestos se ven
  // encendidos ahí mismo, y se sacan tocándolos de nuevo (P27).
  const filtros = carruselTags(tags ?? [], { activos });
```

`src/main.ts`, en las dos ramas:

```ts
    case 'recetario':
      return pintar(renderRecetario({
        categorias: store.categoriasConConteo(), borradores: store.borradores().length,
        menuAbierto, tags: store.tagsDe()
      }));
```

```ts
      pintar(renderCategoria({
        nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos, tags: store.tagsDe(nombre)
      }));
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/recetario.ts src/ui/categoria.ts src/main.ts tests/
git commit -m "El carrusel de tags, en el Recetario y en cada categoría"
```

---

### Task 8: Las flechas desplazan

**Files:**
- Modify: `src/main.ts`
- Test: `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: las acciones `carrusel-izq` y `carrusel-der` que dibuja `carruselTags`.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Escribir el test que falla**

```ts
it('la flecha desplaza el carrusel el 80% de lo que se ve', async () => {
  estado.tags = [{ tag: 'horno', cantidad: 3 }];
  const { abrir, tocar, desplazamientos } = await montar();
  await abrir('#/');

  await tocar('carrusel-der');
  await tocar('carrusel-izq');

  expect(desplazamientos).toEqual([320, -320]);
});
```

En el arnés, el doble del carrusel: `document.querySelector('[data-carrusel]')` devuelve
`{ clientWidth: 400, scrollBy: (o: { left: number }) => desplazamientos.push(o.left) }`.

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/main-rutas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar en `src/main.ts`**

```ts
  // Las flechas sólo existen con mouse o trackpad (el CSS las esconde): el
  // teléfono desliza con el dedo. Se mueve el 80% de lo que se ve, para que
  // quede un chip de referencia entre una vista y la siguiente.
  if (accion === 'carrusel-izq' || accion === 'carrusel-der') {
    const carrusel = document.querySelector<HTMLElement>('#app [data-carrusel]');
    if (!carrusel) return;
    const paso = Math.round(carrusel.clientWidth * 0.8);
    carrusel.scrollBy?.({ left: accion === 'carrusel-der' ? paso : -paso, behavior: 'smooth' });
    return;
  }
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/main.ts tests/main-rutas.test.ts
git commit -m "Las flechas del carrusel desplazan"
```

---

### Task 9: La lista por tag

**Files:**
- Create: `src/ui/tag.ts`, `tests/vista-tag.test.ts`
- Modify: `src/ui/router.ts`, `src/main.ts`
- Test: `tests/router.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `carruselTags`, `tarjeta`, `vacio`, `encabezado` de `componentes.js`; `ordenarRecetas`; `iconoDeTag`.
- Produces: `renderTag({ tag, entradas, total, visibles, tagsActivos, tags }): string`; la ruta `{ vista: 'tag', params: { nombre } }` desde `#/t/<tag>`.

- [ ] **Step 1: Escribir los tests que fallan**

`tests/router.test.ts`:

```ts
it('#/t/<tag> es la lista por tag, y el nombre viene decodificado', () => {
  expect(parsearHash('#/t/menú%20diario')).toEqual({ vista: 'tag', params: { nombre: 'menú diario' } });
});
```

`tests/vista-tag.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderTag } from '../src/ui/tag.js';
import { entradaFalsa } from './dobles.js';
import { ICO } from '../src/ui/iconos.js';

describe('la lista por tag', () => {
  const base = { tag: 'horno', total: 2, visibles: 2, tagsActivos: ['horno'], tags: [] };

  it('el encabezado lleva el nombre del tag y el total', () => {
    const html = renderTag({ ...base, entradas: [entradaFalsa({ titulo: 'Pan' })] });
    expect(html).toContain('horno');
    expect(html).toContain('<span class="tot">2</span>');
  });

  it('el chip encendido del carrusel lleva el ícono del especial', () => {
    const html = renderTag({
      ...base, tag: 'probar', tagsActivos: ['probar'], entradas: [],
      tags: [{ tag: 'probar', cantidad: 1 }]
    });
    expect(html).toContain(ICO.marcador);
    expect(html).toContain('class="chip act"');
  });

  it('las favoritas van primero', () => {
    const html = renderTag({ ...base, entradas: [
      entradaFalsa({ titulo: 'Zapallo', tags: ['horno'] }),
      entradaFalsa({ titulo: 'Arroz', tags: ['horno', 'favorito'] })
    ] });
    expect(html.indexOf('Arroz')).toBeLessThan(html.indexOf('Zapallo'));
  });

  it('sin recetas muestra el vacío', () => {
    expect(renderTag({ ...base, entradas: [], total: 0, visibles: 0 }))
      .toContain('Ninguna receta con esos tags');
  });
});
```

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/router.test.ts tests/vista-tag.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/ui/router.ts`: sumar `'tag'` a `Vista` y, antes del `return` final:

```ts
  // La lista por tag: se llega tocando un chip del carrusel del Recetario.
  if (partes[0] === 't' && partes[1]) {
    try {
      return { vista: 'tag', params: { nombre: decodeURIComponent(partes[1]) } };
    } catch {
      return { vista: 'recetario', params: {} };
    }
  }
```

`src/ui/tag.ts`:

```ts
/**
 * La lista de las recetas con un tag (P27). Es la pantalla de categoría con
 * otro criterio: el mismo encabezado con total, el mismo carrusel para cambiar
 * o acumular, y la misma lista con las favoritas primero.
 *
 * El ícono del tag especial no va en el encabezado: ya está en su chip
 * encendido del carrusel, dos renglones más abajo.
 */
import { encabezado, tarjeta, vacio, carruselTags, SPINNER } from './componentes.js';
import { ordenarRecetas } from '../catalogo.js';
import type { Entrada } from '../tipos.js';

export interface OpcionesTag {
  tag: string;
  entradas: Entrada[];
  total: number;
  visibles: number;
  tagsActivos: string[];
  tags: { tag: string; cantidad: number }[];
}

export function renderTag({ tag, entradas, total, visibles, tagsActivos, tags }: OpcionesTag): string {
  const lista = ordenarRecetas(entradas).map(e => tarjeta(e)).join('');
  const cuerpo = lista
    ? `<div class="lista">${lista}</div>` + (visibles < total ? SPINNER : '')
    : vacio('Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba.');

  return encabezado({ titulo: tag, volver: true, total }) +
    `<div class="cuerpo denso">${carruselTags(tags, { activos: tagsActivos })}${cuerpo}</div>`;
}
```

`src/main.ts`: importar `renderTag` y sumar la rama, copiando el tramo de la categoría:

```ts
    case 'tag': {
      const nombre = ruta.params['nombre'] ?? '';
      const activos = tagsActivos.includes(nombre) ? tagsActivos : [nombre, ...tagsActivos];
      const entradas = store.buscar({ tags: activos });
      pintar(renderTag({
        tag: nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos: activos, tags: store.tagsDe()
      }));
      return observarTramo();
    }
```

En el handler de `data-tag`, mandar a la lista por tag cuando el toque viene del Recetario:

```ts
  if (boton.dataset['tag']) {
    const tag = boton.dataset['tag'];
    if (vistaActual?.vista === 'recetario') { location.hash = `#/t/${encodeURIComponent(tag)}`; return; }
    tagsActivos = tagsActivos.includes(tag) ? tagsActivos.filter(t => t !== tag) : [...tagsActivos, tag];
    return render();
  }
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/tag.ts src/ui/router.ts src/main.ts tests/
git commit -m "La lista por tag, desde el carrusel del Recetario"
```

---

### Task 10: El editor dibuja los especiales con ícono

**Files:**
- Modify: `src/ui/editor.ts`
- Test: `tests/vista-editor.test.ts`

**Interfaces:**
- Consumes: `iconoDeTag` de `componentes.js`.
- Produces: `pillTag` con ícono.

- [ ] **Step 1: Escribir el test que falla**

```ts
it('un tag especial se dibuja con su ícono, y se puede sacar como cualquiera', () => {
  const html = pillTag('probar');
  expect(html).toContain(ICO.marcador);
  expect(html).toContain('data-accion="tag-quitar"');
});

it('un tag común no lleva ícono', () => {
  expect(pillTag('horno')).not.toContain('<svg');
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npx vitest run tests/vista-editor.test.ts`
Expected: FAIL — el segundo pasa, el primero no.

- [ ] **Step 3: Implementar**

```ts
import { encabezado, aviso, iconoDeTag } from './componentes.js';
```

```ts
export const pillTag = (tag: string): string =>
  `<button type="button" class="chip" data-accion="tag-quitar" data-valor="${escapar(tag)}">` +
  `${iconoDeTag(tag)}${escapar(tag)}${ICO.cerrar}</button>`;
```

El ícono del tag va antes del nombre y la cruz queda al final, que es la que saca.

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Dejar el commit preparado**

```bash
git add src/ui/editor.ts tests/vista-editor.test.ts
git commit -m "Los tags especiales, con ícono también en el editor"
```

---

### Task 11: Los documentos

**Files:**
- Modify: `product-design/product/specs/E02-Encontrar.md`, `product-design/product/specs/E03-LeerYCocinar.md`, `product-design/ux/design-system.md`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`, `CLAUDE.md`
- Test: no hay; la puerta es `npm run typecheck` y `npm test`, que no cambian.

- [ ] **Step 1: `E02-Encontrar.md`**

En C02.6.4 —«Los tags no tienen pantalla propia»— agregar, sin borrar lo anterior:

> `[cambio del 2026-09-16]` Los tags **sí tienen dónde tocarse fuera de la receta**: un carrusel en el Recetario y en cada categoría, y una lista por tag (`#/t/<tag>`). Lo que sigue sin existir es la nube de tags y la sección en la navegación. El vocabulario sigue siendo libre: la app no propone ni valida, salvo los tres especiales, que se reserva.

- [ ] **Step 2: `E03-LeerYCocinar.md`**

En la ficha de la receta abierta, sumar la capacidad:

> **La estrella de favorito** vive en el encabezado, a la izquierda de compartir. Un toque pone el tag `favorito` y otro lo saca. Mientras se escribe en Drive se llena de izquierda a derecha en loop; el resultado se dibuja recién con la respuesta, y si falla vuelve como estaba y avisa.

- [ ] **Step 3: `design-system.md` §3.4**

«Hay exactamente diez» pasa a doce, y la lista suma: el marcador de *probar* y el calendario de *menú diario*. La estrella de favorito se nombra ahí también.

- [ ] **Step 4: `decision-log.md`**

Una fila nueva al final de la tabla:

| 2026-09-16 | **Favorito es el único tag especial con control propio; probar y menú diario son tags con ícono.** Los tres viven en la lista `tags` del `.md`. | P27 pedía darle entidad a favoritos y a otros tags especiales, que estaban reservados sin uso. | Una clave nueva en el frontmatter (reabría el esquema cerrado de ocho claves); guardarlos fuera del `.md` (el reindexado los borraría); tres chips fijos en la ficha; una fila «Estado» como la del editor; los estados en el pie con Cocinar. | Se compararon seis formas sobre el CSS real. Los tags ya existen, ya viajan en la fila del índice y ya se filtran: no hace falta esquema nuevo ni reindexar. Favorito es el único que se marca seguido, así que es el único que gana un control de un toque. | `catalogo.ts`, `componentes.ts`, `receta.ts`, `recetario.ts`, `categoria.ts`, `resultados.ts`, `tag.ts`, `editor.ts`, `main.ts`. Las listas ordenan las favoritas primero: es una excepción al alfabético, no su reemplazo. |

- [ ] **Step 5: `BACKLOG.md` y `CLAUDE.md`**

- P27 pasa a **Resuelto** `[2026-09-16]`, con una línea de qué quedó: los tres tags especiales, la estrella, el carrusel y la lista por tag.
- En `CLAUDE.md`, sacar P27 de la lista de abiertos y sumar el bloque «Hecho el 2026-09-16 — tags especiales», con el spec y el plan.
- En la tabla de decisiones cerradas de `CLAUDE.md`, la fila del orden de las listas aclara la excepción: las favoritas van primero.

- [ ] **Step 6: Dejar el commit preparado**

```bash
git add product-design CLAUDE.md
git commit -m "Los documentos dicen lo que los tags especiales hacen"
```

---

## Verificación final, en el teléfono

Después de la última tarea, con todo pusheado a `main` y el deploy terminado:

1. Marcar y desmarcar una receta: la animación corre y corta al contestar Drive.
2. Con el avión puesto: la estrella vuelve como estaba y aparece el aviso con *Reintentar*.
3. Deslizar el carrusel en el Recetario y en una categoría: el degradé aparece y desaparece de cada lado.
4. **Las flechas no aparecen** en el teléfono.
5. Una receta marcada se ve primera en su categoría y en cada subsección de la búsqueda.
6. Tocar un tag en el Recetario abre la lista por tag; tocar otro chip ahí acumula el filtro.
