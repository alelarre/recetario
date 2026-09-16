# Tags especiales, segunda parte — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que `incompleta` sea el cuarto tag especial y la clave `completa` desaparezca, que los cuatro especiales se pongan con un botón cada uno en el editor, y que sus marcas vayan juntas en la esquina de la tarjeta.

**Architecture:** las reglas puras de los especiales —orden, formas, reservados, poner y sacar— viven en `src/catalogo.ts`. El editor dibuja un botón por especial y guarda el estado en el mismo `hidden` de tags que ya viaja en el formulario. La completitud deja de ser un campo propio de `Receta` y de `Entrada`: se deriva de los tags, como favorito. El índice pierde su columna y `SCHEMA_VERSION` sube.

**Tech Stack:** TypeScript estricto, Vite, sin framework. Vistas que devuelven HTML como string. Tests con Vitest. CSS en `src/ui/tokens.css` (sistema) y `src/ui/base.css` (pantallas).

**Spec:** `docs/superpowers/specs/2026-09-16-tags-especiales-2-design.md`

## Global Constraints

- **Español rioplatense** en todo: comentarios, UI, nombres. Los comentarios explican **por qué**.
- **Los cuatro especiales, en este orden en todos lados:** `favorito`, `menú diario`, `probar`, `incompleta`. En minúscula.
- **`completa` no tiene código propio:** es una clave desconocida del frontmatter como cualquier otra, se conserva en `extras` al guardar, y nada la lee ni la borra.
- **No queda código muerto:** lo que era de la completitud —conmutador, su CSS, `revisarCompletitud`, `marcarCompletitud`, `data-completa`, la columna del índice— se borra, no se deja comentado.
- **`SCHEMA_VERSION` pasa de 5 a 6.**
- **La regla no cambia:** `incompleta` no se puede sacar sin título, categoría, ingredientes y pasos (`sePuedeTerminar`).
- **Todo texto que venga de un `.md` pasa por `escapar()`.**
- **`npm test`, `npm run typecheck` y `npm run build` en verde al terminar cada tarea.** TypeScript con `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y `verbatimModuleSyntax`.
- **Commits locales, sin push:** el usuario revisa el diff antes de publicar.

---

### Task 1: Los cuatro especiales, en el catálogo

**Files:**
- Modify: `src/catalogo.ts`, `src/main.ts` (sólo el uso de `conFavorito`)
- Test: `tests/catalogo-especiales.test.ts`

**Interfaces:**
- Produces:
  - `TAGS_ESPECIALES = ['favorito', 'menú diario', 'probar', 'incompleta'] as const`
  - `tieneEspecial(x: { tags: string[] }, especial: TagEspecial): boolean`
  - `esFavorita(x)` y `esIncompleta(x)`, las dos sobre `tieneEspecial`
  - `conEspecial(tags: string[], especial: TagEspecial, puesto: boolean): string[]` — **reemplaza** a `conFavorito`, que se borra
  - `TAGS_RESERVADOS`, derivada: los cuatro especiales, sus formas alternativas y las cuatro formas de `terminado`

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/catalogo-especiales.test.ts`, reemplazar los tests de `TAGS_ESPECIALES` y de `conFavorito` por estos, y sumar los nuevos:

```ts
it('son cuatro, en el orden fijo', () => {
  expect(TAGS_ESPECIALES).toEqual(['favorito', 'menú diario', 'probar', 'incompleta']);
});

it('incompleta se reconoce en sus formas', () => {
  expect(tagEspecial('incompleto')).toBe('incompleta');
  expect(tagEspecial('Incompletas')).toBe('incompleta');
  expect(tagEspecial('incompleta')).toBe('incompleta');
});

it('una receta es incompleta si lleva el tag, escrito como sea', () => {
  expect(esIncompleta({ tags: ['Incompleto'] })).toBe(true);
  expect(esIncompleta({ tags: ['horno'] })).toBe(false);
});

it('terminado y sus formas siguen reservados, y los cuatro especiales también', () => {
  for (const t of ['terminado', 'terminadas', 'incompleta', 'incompletos', 'menu diario', 'favoritas', 'probar']) {
    expect(tagReservado(t)).toBe(true);
  }
  expect(tagReservado('horno')).toBe(false);
});

it('pone y saca un especial sin tocar los demás tags', () => {
  expect(conEspecial(['horno'], 'incompleta', true)).toEqual(['incompleta', 'horno']);
  expect(conEspecial(['Incompleto', 'horno'], 'incompleta', true)).toEqual(['incompleta', 'horno']);
  expect(conEspecial(['incompleta', 'horno'], 'incompleta', false)).toEqual(['horno']);
  expect(conEspecial(['Favorita', 'horno'], 'favorito', false)).toEqual(['horno']);
});

it('ordena los tags en el orden nuevo', () => {
  expect(ordenarTags(['horno', 'incompleta', 'probar', 'menú diario', 'favorito']))
    .toEqual(['favorito', 'menú diario', 'probar', 'incompleta', 'horno']);
});
```

Actualizar el import del archivo: sacar `conFavorito`, sumar `conEspecial`, `esIncompleta`.

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/catalogo-especiales.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar en `src/catalogo.ts`**

Borrar `FORMAS_FAVORITO` y la declaración vieja de `TAGS_RESERVADOS` —con su comentario—, y reescribir el bloque de los especiales así. `TAGS_RESERVADOS` va **después** de `TAGS_ESPECIALES` y `FORMAS_ALTERNATIVAS`, porque se deriva de ellas:

```ts
/**
 * Los tags que la app dibuja distinto: ícono propio y lugar fijo al principio
 * de cualquier fila de tags (P27). No son estados: son tags, y viven en la
 * lista `tags` del `.md` como cualquier otro. El orden es el mismo en todos
 * lados: primero lo que se busca para cocinar, al final lo que falta terminar.
 */
export const TAGS_ESPECIALES = ['favorito', 'menú diario', 'probar', 'incompleta'] as const;
export type TagEspecial = (typeof TAGS_ESPECIALES)[number];

/**
 * Formas que se leen como cada especial, además de lo que ya cubre
 * `normalizar` (mayúsculas y tildes). Sólo `favorito` e `incompleta` tienen
 * género y número.
 */
const FORMAS_ALTERNATIVAS: Record<TagEspecial, readonly string[]> = {
  favorito: ['favorita', 'favoritos', 'favoritas'],
  'menú diario': [],
  probar: [],
  incompleta: ['incompleto', 'incompletos', 'incompletas']
};

/** Contradicen a `incompleta`: un tag así diría lo contrario que el especial. */
const FORMAS_TERMINADO = ['terminado', 'terminada', 'terminados', 'terminadas'] as const;

/**
 * Tags que no se escriben a mano. Los cuatro especiales tienen su botón en el
 * editor, y escribirlos crearía una segunda forma de poner lo mismo;
 * `terminado` contradice a `incompleta`. Derivada, para que no diverja de la
 * lista de especiales.
 */
export const TAGS_RESERVADOS: readonly string[] = [
  ...TAGS_ESPECIALES,
  ...TAGS_ESPECIALES.flatMap(t => FORMAS_ALTERNATIVAS[t]),
  ...FORMAS_TERMINADO
];
```

`tagReservado` y `tagEspecial` quedan como están. Reemplazar `esFavorita` y `conFavorito` por:

```ts
/** Lleva ese especial, escrito como sea. */
export function tieneEspecial(x: { tags: string[] }, especial: TagEspecial): boolean {
  const tags = Array.isArray(x?.tags) ? x.tags : [];
  return tags.some(t => tagEspecial(t) === especial);
}

export const esFavorita = (x: { tags: string[] }): boolean => tieneEspecial(x, 'favorito');

/** Incompleta es un tag, no una clave del frontmatter: sin el tag, la receta está terminada. */
export const esIncompleta = (x: { tags: string[] }): boolean => tieneEspecial(x, 'incompleta');

/** La lista de tags con ese especial puesto o sacado, en su forma canónica y sin tocar los demás. */
export function conEspecial(tags: string[], especial: TagEspecial, puesto: boolean): string[] {
  const sin = (Array.isArray(tags) ? tags : []).filter(t => tagEspecial(t) !== especial);
  return puesto ? [especial, ...sin] : sin;
}
```

En `src/main.ts`, en la acción `favorito`, cambiar `conFavorito(actual.tags, !esFavorita(actual))` por `conEspecial(actual.tags, 'favorito', !esFavorita(actual))` y ajustar el import.

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS. Si algún test viejo esperaba el orden `favorito, probar, menú diario` —el carrusel, la fila de la receta—, actualizarlo al orden nuevo.

- [ ] **Step 5: Commit local**

```bash
git add src/catalogo.ts src/main.ts tests/
git commit -m "incompleta es el cuarto tag especial, en el catálogo"
```

---

### Task 2: El editor, con un botón por tag especial

**Files:**
- Modify: `src/ui/editor.ts`, `src/ui/componentes.ts` (`iconoDeTag`), `src/main.ts`, `src/ui/base.css`
- Test: `tests/vista-editor.test.ts`, `tests/componentes.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `TAGS_ESPECIALES`, `tagEspecial` de la tarea 1; `sePuedeTerminar` de `src/recipe.ts`.
- Produces:
  - `iconoDeTag('incompleta')` devuelve `'<span class="inc"></span>'`.
  - En el formulario: botones `data-accion="tag-especial"` con `data-valor` y `aria-pressed`, dentro de `.tags-esp`, y la leyenda `.leyenda-incompleta`.
  - El `hidden` `name="tags"` lleva los especiales apretados **y** los tags comunes.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/componentes.test.ts`:

```ts
it('incompleta usa la marca de medio círculo como ícono', () => {
  expect(iconoDeTag('incompleta')).toBe('<span class="inc"></span>');
});
```

En `tests/vista-editor.test.ts` (usar el helper `dibujar` y la receta `cargada` que ya existen; `cargada` tiene título, ingredientes y pasos):

```ts
describe('los tags especiales en el editor', () => {
  it('hay un botón por especial, en su orden, dentro del campo Tags', () => {
    const html = dibujar();
    const orden = ['favorito', 'menú diario', 'probar', 'incompleta']
      .map(t => html.indexOf(`data-accion="tag-especial" data-valor="${t}"`));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(html.indexOf('data-tags')).toBeLessThan(orden[0]!);
  });

  it('apretado si la receta tiene el tag, suelto si no', () => {
    const conProbar = { ...cargada, tags: ['probar', 'horno'] };
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: conProbar, categorias });
    expect(html).toContain('data-valor="probar" aria-pressed="true"');
    expect(html).toContain('data-valor="favorito" aria-pressed="false"');
  });

  it('las pills son sólo de los tags comunes', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['probar', 'horno'] }, categorias });
    expect(html).toContain('data-accion="tag-quitar" data-valor="horno"');
    expect(html).not.toContain('data-accion="tag-quitar" data-valor="probar"');
  });

  it('el hidden de tags lleva los especiales apretados y los comunes', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['horno', 'probar'] }, categorias });
    expect(html).toContain('name="tags" value="probar, horno"');
  });

  it('sin lo mínimo, incompleta queda apretado y deshabilitado, con la leyenda', () => {
    const vacia = { ...cargada, tags: [], preparacion: '' };
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: vacia, categorias });
    expect(html).toContain('data-valor="incompleta" aria-pressed="true" disabled');
    expect(html).toMatch(/class="aviso-mudo leyenda-incompleta"(?! hidden)/);
    expect(html).toContain('name="tags" value="incompleta"');
  });

  it('con lo mínimo, incompleta se puede soltar y la leyenda no se ve', () => {
    const html = renderEditor({ entrada: entradaFalsa({ carpeta_id: 'c1' }), receta: { ...cargada, tags: ['incompleta'] }, categorias });
    expect(html).toContain('data-valor="incompleta" aria-pressed="true">');
    expect(html).toContain('leyenda-incompleta" hidden');
  });

  it('el conmutador de Estado ya no existe', () => {
    const html = dibujar();
    expect(html).not.toContain('data-completa');
    expect(html).not.toContain('conm-doble');
    expect(html).not.toContain('name="completa"');
  });
});
```

En `tests/main-rutas.test.ts`. El helper `tocar` arma hoy un botón doble cuyo `setAttribute` no guarda nada: extendelo para que guarde y devuelva atributos, y para que el test pueda leerlos después.

```ts
      tocar: async (accion: string, datos: Record<string, string> = {}, atributos: Record<string, string> = {}) => {
        const attrs: Record<string, string> = { ...atributos };
        const boton = {
          dataset: { accion, ...datos }, classList: { contains: () => false },
          closest: () => null, tagName: 'BUTTON', remove: () => {},
          setAttribute: (n: string, v: string) => { attrs[n] = v; },
          getAttribute: (n: string) => attrs[n] ?? null,
          hasAttribute: (n: string) => n in attrs,
          set outerHTML(html: string) { enLugar.push(html); }
        };
        for (const fn of clicks) {
          await fn({ target: { closest: (sel: string) => (sel.includes('data-accion') ? boton : null) } });
        }
        await esperar();
        return attrs;
      }
```

Y los tests:

```ts
it('tocar un botón especial lo invierte', async () => {
  const { abrir, tocar } = await montar();
  await abrir('#/r/f1/editar');
  const attrs = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'false' });
  expect(attrs['aria-pressed']).toBe('true');
  const otra = await tocar('tag-especial', { valor: 'probar' }, { 'aria-pressed': 'true' });
  expect(otra['aria-pressed']).toBe('false');
});

it('un botón especial deshabilitado no cambia al tocarlo', async () => {
  const { abrir, tocar } = await montar();
  await abrir('#/r/f1/editar');
  const attrs = await tocar('tag-especial', { valor: 'incompleta' }, { 'aria-pressed': 'true', disabled: '' });
  expect(attrs['aria-pressed']).toBe('true');
});
```

Que el `hidden` de tags siga a los botones lo cubren los tests de la vista (el valor inicial) y el de «cambios sin guardar» de P7, que ya compara el formulario entero.

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/componentes.test.ts tests/vista-editor.test.ts tests/main-rutas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/ui/componentes.ts`, en `iconoDeTag`:

```ts
  if (esp === 'incompleta') return '<span class="inc"></span>';
```

`src/ui/editor.ts`:

- Importar `TAGS_ESPECIALES` y `tagEspecial` de `../catalogo.js`.
- Borrar el bloque `completa` (el conmutador, su `hidden` y su leyenda), su comentario, y el `+ completa +` del final de la ficha de datos. Borrar la mención a «la casilla de completitud» en el comentario del módulo.
- Sumar, arriba de `renderEditor`:

```ts
/**
 * Los cuatro tags especiales, un botón cada uno (P27): apretado si la receta
 * lo tiene, suelto si no. `incompleta` no se suelta sin lo mínimo —título,
 * categoría, ingredientes y pasos—: mientras falte, queda apretado y
 * deshabilitado, y la leyenda dice qué hace falta.
 */
function botonesEspeciales(tags: string[], puedeTerminar: boolean): string {
  const botones = TAGS_ESPECIALES.map(t => {
    const bloqueado = t === 'incompleta' && !puedeTerminar;
    const apretado = bloqueado || tags.some(x => tagEspecial(x) === t);
    return `<button type="button" class="tag-esp" data-accion="tag-especial" data-valor="${escapar(t)}" ` +
      `aria-pressed="${apretado}"${bloqueado ? ' disabled' : ''}>${iconoDeTag(t)}${escapar(t)}</button>`;
  }).join('');
  return `<div class="tags-esp" role="group" aria-label="Tags especiales">${botones}</div>` +
    `<p class="aviso-mudo leyenda-incompleta"${puedeTerminar ? ' hidden' : ''}>` +
    'Se va a poder sacar <i>incompleta</i> cuando se cargue: título, categoría, ingredientes y pasos.</p>';
}
```

- Dentro de `renderEditor`, antes de armar `datos`:

```ts
  const puede = sePuedeTerminar(receta, entrada?.carpeta_id ?? '');
  const comunes = tags.filter(t => !tagEspecial(t));
  const especiales = TAGS_ESPECIALES.filter(t =>
    (t === 'incompleta' && !puede) || tags.some(x => tagEspecial(x) === t));
```

- El campo Tags pasa a:

```ts
    '<div class="campo" data-tags><span>Tags</span>' +
      botonesEspeciales(tags, puede) +
      `<div class="chips" data-pills>${comunes.map(pillTag).join('')}</div>` +
      `<input type="hidden" name="tags" value="${escapar([...especiales, ...comunes].join(', '))}">` +
```

- En `formularioDesde`, borrar `completa: ...`.
- En `recetaDesdeFormulario`, reemplazar la línea de `completa` por `completa: base.completa,` con el comentario `// Transitorio: la tarea 3 saca el campo de la receta.` — la tarea 3 la borra.

`src/main.ts`:

- `sincronizarTags` pasa a leer los especiales apretados y las pills:

```ts
/** Los especiales apretados y las pills, en el `hidden` que viaja en el formulario. */
function sincronizarTags(): void {
  const especiales = [...document.querySelectorAll<HTMLElement>('#app [data-accion="tag-especial"][aria-pressed="true"]')]
    .map(b => b.dataset['valor'] ?? '');
  const pills = [...document.querySelectorAll<HTMLElement>('[data-pills] [data-valor]')]
    .map(p => p.dataset['valor'] ?? '');
  const oculto = document.querySelector<HTMLInputElement>('input[name="tags"]');
  if (oculto) oculto.value = [...especiales, ...pills].filter(Boolean).join(', ');
}
```

- Borrar `marcarCompletitud` y reemplazar `revisarCompletitud` por:

```ts
/**
 * Vuelve a mirar si la receta del formulario puede sacarse `incompleta`, y
 * habilita o bloquea su botón. Corre en cada tecla, así que toca el DOM en vez
 * de redibujar: redibujar perdería el foco y el cursor.
 */
function revisarIncompleta(): void {
  const boton = document.querySelector<HTMLButtonElement>('#app [data-accion="tag-especial"][data-valor="incompleta"]');
  if (!boton) return;
  const valor = (n: string): string =>
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `#app [name="${n}"]`)?.value ?? '';
  const puede = sePuedeTerminar(
    { titulo: valor('titulo'), ingredientes: valor('ingredientes'), preparacion: valor('preparacion') },
    valor('carpeta')
  );
  boton.disabled = !puede;
  const leyenda = document.querySelector<HTMLElement>('#app .leyenda-incompleta');
  if (leyenda) leyenda.hidden = puede;
  // Si dejó de cumplir, la receta vuelve a quedar incompleta.
  if (!puede && boton.getAttribute('aria-pressed') !== 'true') {
    boton.setAttribute('aria-pressed', 'true');
    sincronizarTags();
  }
}
```

- Renombrar las dos llamadas a `revisarCompletitud()` por `revisarIncompleta()`.
- En la delegación de clicks, sacar `[data-completa]` del selector de `closest` y borrar la rama `if (boton.dataset['completa'])`. Sumar, junto a `tag-quitar`:

```ts
  if (accion === 'tag-especial') {
    if (boton.hasAttribute('disabled')) return;
    boton.setAttribute('aria-pressed', String(boton.getAttribute('aria-pressed') !== 'true'));
    sincronizarTags();
    return;
  }
```

- En `agregarTag`, el comentario del rechazo pasa a: `// Los especiales tienen su botón y terminado contradice a incompleta: no se escriben a mano.`

`src/ui/base.css`, en la sección del editor: **borrar** todas las reglas de `.conm-doble`, `.leyenda-completa` y `.campo.estado`, con sus comentarios, y sumar:

```css
/* Los cuatro tags especiales, un botón cada uno (P27). Apretado se invierte
   —fondo claro, texto oscuro—, la convención del estado elegido de la app: el
   acento sobre un estado se lee como alerta. Deshabilitado, el apagado de un
   botón sin acción disponible. */
.tags-esp { display: grid; grid-template-columns: 1fr 1fr; gap: var(--e-2); margin-bottom: var(--e-3); }
.tag-esp { min-height: 48px; padding: 0 var(--e-3); display: inline-flex; align-items: center;
           justify-content: center; gap: var(--e-2); cursor: pointer;
           background: var(--surface-alta); color: var(--fg-2);
           border: 1px solid var(--borde); border-radius: var(--r-medio);
           font: 600 var(--txt-base)/1 var(--tipo); }
.tag-esp svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.5;
               stroke-linecap: round; stroke-linejoin: round; }
.tag-esp .inc { color: inherit; }
@media (hover: hover) {
  .tag-esp:hover:not([disabled]):not([aria-pressed="true"]) { color: var(--fg); }
}
.tag-esp[aria-pressed="true"] { background: var(--fg); border-color: var(--fg); color: var(--bg); }
.tag-esp[disabled] { cursor: default; opacity: .6; }
.leyenda-incompleta { line-height: 1.5; margin: 0 0 var(--e-3); }
```

Antes de borrar el `@media (hover: hover)` que contenía el hover del conmutador, fijate si ese bloque tiene otras reglas: si las tiene, borrá sólo la del conmutador.

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS. Actualizar o borrar los tests viejos del conmutador (`data-completa`, `Terminada`, `leyenda-completa`) en `tests/vista-editor.test.ts` y `tests/main-rutas.test.ts`: no pueden quedar tests de algo que ya no existe.

- [ ] **Step 5: Commit local**

```bash
git add src/ui/editor.ts src/ui/componentes.ts src/main.ts src/ui/base.css tests/
git commit -m "Los cuatro tags especiales se ponen con un botón en el editor"
```

---

### Task 3: La clave `completa` sale del esquema y del índice

**Files:**
- Modify: `src/tipos.ts`, `src/recipe.ts`, `src/catalogo.ts`, `src/config.ts`, `src/ui/editor.ts`, `src/ui/componentes.ts`, `src/ui/receta.ts`
- Test: `tests/dobles.ts`, `tests/recipe-frontmatter.test.ts`, `tests/recipe-serialize.test.ts`, `tests/recipe-completitud.test.ts`, `tests/catalogo-fila.test.ts`, y los demás que el typecheck marque

**Interfaces:**
- Consumes: `esIncompleta` de la tarea 1.
- Produces: `Receta` y `Entrada` **sin** `completa`; `COLUMNAS` sin `'completa'`; `SCHEMA_VERSION = 6`.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/recipe-frontmatter.test.ts`:

```ts
it('completa es una clave desconocida más: va a extras, tal cual', () => {
  const r = parse('---\ntitulo: Pan\ncompleta: sí\n---\n');
  expect(r.extras).toEqual({ completa: 'sí' });
  expect('completa' in r).toBe(false);
});
```

En `tests/recipe-serialize.test.ts`:

```ts
it('no escribe completa por su cuenta', () => {
  expect(serialize(parse('---\ntitulo: Pan\n---\n'))).not.toContain('completa');
});

it('si completa venía, la conserva como a cualquier clave desconocida', () => {
  expect(serialize(parse('---\ntitulo: Pan\ncompleta: no\n---\n'))).toContain('completa: no');
});
```

En `tests/catalogo-fila.test.ts`:

```ts
it('la fila no tiene la columna completa', () => {
  expect(COLUMNAS).not.toContain('completa');
});
```

Y en un test de `config` o donde ya se verifique la versión:

```ts
it('SCHEMA_VERSION es 6: la fila perdió la columna completa', () => {
  expect(SCHEMA_VERSION).toBe(6);
});
```

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/recipe-frontmatter.test.ts tests/recipe-serialize.test.ts tests/catalogo-fila.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `src/tipos.ts`: sacar `'completa'` de `ClaveFrontmatter` y corregir su comentario a «Las siete claves»; sacar `completa` de `Receta` y de `Entrada`, con sus comentarios.
- `src/recipe.ts`: sacar `completa: false` de `recetaVacia`; borrar la rama `else if (clave === 'completa')` de `parse` —la clave cae en `extras`, como cualquier desconocida—; borrar el `fm.push` de `completa` en `serialize` y su comentario. Actualizar el comentario de `sePuedeTerminar`: habilita que se pueda sacar el tag `incompleta` en el editor.
- `src/catalogo.ts`: sacar `'completa'` de `COLUMNAS`, y la celda y el campo correspondientes en `filaDesde` y `entradaDesdeFila`, con sus comentarios.
- `src/config.ts`: `SCHEMA_VERSION = 6`, y sumar al comentario: «y a 6 el 2026-09-16, cuando la fila perdió la columna `completa`: la completitud pasó a ser el tag especial `incompleta`».
- `src/ui/editor.ts`: borrar la línea transitoria `completa: base.completa` de `recetaDesdeFormulario`.
- `src/ui/componentes.ts`: en `tarjeta()`, `e.completa ? '' : ...` pasa a `esIncompleta(e) ? ... : ''` (la tarea 4 reemplaza la marca entera).
- `src/ui/receta.ts`: `receta.completa ? '' : ...` pasa a `esIncompleta(receta) ? ... : ''` (la tarea 5 la reemplaza).
- `tests/dobles.ts`: sacar `completa` de `entradaFalsa`.
- Todo test que arme una `Receta` o una `Entrada` con `completa`: pasar a expresar lo mismo con el tag `incompleta` en `tags`, o sacarlo si no importa para ese test. En `tests/recipe-completitud.test.ts` quedan sólo los tests de `sePuedeTerminar`.

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS. El typecheck es el que encuentra los usos que falten: no quedan referencias a `.completa` en `src/` (verificar con `grep -rn "\.completa\|completa:" src`).

- [ ] **Step 5: Commit local**

```bash
git add src/ tests/
git commit -m "completa sale del esquema y del índice: la completitud es el tag incompleta"
```

---

### Task 4: Las marcas de la tarjeta, juntas en la esquina

**Files:**
- Modify: `src/ui/componentes.ts`, `src/ui/tokens.css`
- Test: `tests/componentes.test.ts`, `tests/tarjeta-favorita.test.ts`

**Interfaces:**
- Consumes: `TAGS_ESPECIALES`, `tagEspecial`, `iconoDeTag`.
- Produces: `tarjeta()` dibuja `<span class="marcas-esq">` con una `.marca` por especial presente, y la variable `--marcas` en la tarjeta.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/componentes.test.ts`:

```ts
describe('las marcas de la tarjeta', () => {
  it('van juntas arriba a la derecha, en el orden de los especiales', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['incompleta', 'horno', 'favorito', 'probar'] }));
    const esq = html.slice(html.indexOf('class="marcas-esq"'));
    const orden = ['Favorita', 'Para probar', 'Incompleta'].map(n => esq.indexOf(`aria-label="${n}"`));
    expect(orden.every(i => i > 0)).toBe(true);
    expect(orden).toEqual([...orden].sort((a, b) => a - b));
    expect(html).toContain('style="--marcas:3"');
  });

  it('la línea de contexto no lleva ninguna marca', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'Pan', categoria: 'Panes', tags: ['incompleta'] }));
    const ctx = html.slice(html.indexOf('class="ctx"'), html.indexOf('</span></span>'));
    expect(ctx).not.toContain('class="inc"');
  });

  it('sin especiales no hay esquina', () => {
    expect(tarjeta(entradaFalsa({ titulo: 'Pan', tags: ['horno'] }))).not.toContain('marcas-esq');
  });
});
```

Los tests de `tests/tarjeta-favorita.test.ts` que miran `fav-esq` pasan a mirar `.marcas-esq` y la regla de CSS nueva.

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/componentes.test.ts tests/tarjeta-favorita.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/ui/componentes.ts`, en `tarjeta()`: borrar `marca` y `favorita`, y armar:

```ts
/** Cómo dice cada marca lo que es, para quien no la ve. */
const NOMBRE_DE_MARCA: Record<TagEspecial, string> = {
  favorito: 'Favorita', 'menú diario': 'Menú diario', probar: 'Para probar', incompleta: 'Incompleta'
};
```

```ts
  // Las marcas de los especiales, juntas en la esquina y en su orden (P27): la
  // línea de contexto queda sólo con datos. `--marcas` reserva el ancho que
  // ocupan, para que el título no pase por debajo.
  const puestas = TAGS_ESPECIALES.filter(t => e.tags.some(x => tagEspecial(x) === t));
  const marcas = puestas.length
    ? '<span class="marcas-esq">' + puestas.map(t =>
        `<span class="marca" role="img" aria-label="${NOMBRE_DE_MARCA[t]}">${iconoDeTag(t)}</span>`).join('') +
      '</span>'
    : '';
  return `<a class="tarjeta" href="#/r/${encodeURIComponent(e.id_archivo)}"` +
    `${puestas.length ? ` style="--marcas:${puestas.length}"` : ''}>` +
    placeholder(e.categoria, e.foto) +
    '<span class="txt">' +
      `<span class="n">${escapar(e.titulo)}</span>` +
      `<span class="ctx">${contexto}</span>` +
    '</span>' + marcas + '</a>';
```

Importar `TAGS_ESPECIALES` y el tipo `TagEspecial`; sacar `esFavorita` y `esIncompleta` del import si quedan sin uso.

`src/ui/tokens.css`: **borrar** las reglas `.tarjeta:has(.fav-esq) .txt`, `.fav-esq` y `.fav-esq svg`, con su comentario, y sumar:

```css
/* §6.1 — Las marcas de los tags especiales, juntas en la esquina de la tarjeta
   (P27). `--marcas` es cuántas hay: la reserva de ancho del título crece con
   ellas, y una tarjeta sin marcas no pierde nada. */
.tarjeta .txt { padding-right: calc(var(--marcas, 0) * 20px); }
.marcas-esq { position: absolute; top: 6px; right: 8px; display: flex; gap: 4px; line-height: 0; }
.marca { display: grid; place-items: center; width: 16px; height: 16px; color: var(--acento); }
.marca svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.5;
             stroke-linecap: round; stroke-linejoin: round; }
.marca[aria-label="Favorita"] svg { fill: color-mix(in srgb, var(--acento) 35%, transparent); }
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS. `grep -rn "fav-esq" src tests` no devuelve nada.

- [ ] **Step 5: Commit local**

```bash
git add src/ui/componentes.ts src/ui/tokens.css tests/
git commit -m "Las marcas de los tags especiales, juntas en la esquina de la tarjeta"
```

---

### Task 5: La receta y la receta nueva

**Files:**
- Modify: `src/ui/componentes.ts` (`chipsSueltos`), `src/ui/receta.ts`, `src/main.ts` (vista `nueva`)
- Test: `tests/componentes.test.ts`, `tests/vista-receta.test.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consumes: `conEspecial` de la tarea 1; `chipTag`, `iconoDeTag`.
- Produces: en la receta, el chip de `incompleta` abre el editor; una receta nueva abre con `incompleta`.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/componentes.test.ts`:

```ts
it('en la fila de tags de la receta, incompleta abre el editor en vez de filtrar', () => {
  const html = chipsSueltos(['horno', 'incompleta']);
  expect(html).toContain('data-accion="editar"');
  expect(html).not.toContain('data-tag="incompleta"');
  expect(html.indexOf('incompleta')).toBeLessThan(html.indexOf('horno'));
});
```

En `tests/vista-receta.test.ts`:

```ts
it('la fila de tags no repite la marca de incompleta: es el chip del tag', () => {
  const r = parse('---\ntitulo: Pan\ntags: [incompleta, horno]\n---\n');
  const html = renderReceta({ entrada: entradaFalsa(), receta: r });
  expect(html.match(/class="inc"/g)).toHaveLength(1);
});
```

En `tests/main-rutas.test.ts`:

```ts
it('una receta nueva abre con incompleta', async () => {
  const { abrir, app } = await montar();
  await abrir('#/nueva');
  expect(app.innerHTML).toContain('data-valor="incompleta" aria-pressed="true"');
});

it('un borrador convertido también abre con incompleta', async () => {
  estado.borradores = [{ id: 'b1', titulo: 'Focaccia', fuente: '', capturado: '', nota: '' }];
  const { abrir, app } = await montar();
  await abrir('#/nueva?borrador=b1');
  expect(app.innerHTML).toContain('value="Focaccia"');
  expect(app.innerHTML).toContain('data-valor="incompleta" aria-pressed="true"');
});
```

- [ ] **Step 2: Correrlos y ver que fallan**

Run: `npx vitest run tests/componentes.test.ts tests/vista-receta.test.ts tests/main-rutas.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/ui/componentes.ts`, `chipsSueltos`:

```ts
/**
 * Los chips sueltos, sin el contenedor: los usa la receta. `incompleta` no
 * filtra: abre el editor, que es donde se completa lo que falta (C03.1.3).
 */
export function chipsSueltos(tags: string[], activos: string[] = []): string {
  return ordenarTags(Array.isArray(tags) ? tags : []).map(tag => tagEspecial(tag) === 'incompleta'
    ? `<button class="chip pend" data-accion="editar" aria-label="Incompleta: abrir el editor">` +
      `${iconoDeTag(tag)}${escapar(tag)}</button>`
    : chipTag(tag, { activo: activos.includes(tag) })).join('');
}
```

`src/ui/receta.ts`: borrar `marca` y su comentario; la fila queda

```ts
  // Los tags, con los especiales primero y con su ícono (P27). Incompleta es
  // uno más: su chip abre el editor.
  const marcas = receta.tags.length ? `<div class="chips">${chipsSueltos(receta.tags)}</div>` : '';
```

`src/main.ts`, vista `nueva`, justo antes del `return abrirEditor(...)`:

```ts
      // Una receta nace incompleta: sacar el tag es la declaración explícita de
      // que está terminada (P27).
      receta.tags = conEspecial(receta.tags, 'incompleta', true);
```

- [ ] **Step 4: Correr todo**

Run: `npx vitest run && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit local**

```bash
git add src/ tests/
git commit -m "La receta nace incompleta, y en la receta su chip abre el editor"
```

---

### Task 6: Los documentos

**Files:**
- Modify: `product-design/plan/decision-log.md`, `product-design/product/specs/E05-Cimientos.md`, `product-design/product/specs/E04-Corregir.md`, `product-design/ux/design-system.md`, `product-design/plan/BACKLOG.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-16-tags-especiales-design.md`, `docs/superpowers/specs/2026-09-16-tags-especiales-2-design.md`

- [ ] **Step 1: `decision-log.md`** — una fila al final de la tabla:

| 2026-09-16 | **La completitud pasa a ser el tag especial `incompleta`, y la clave `completa` sale del esquema.** Los cuatro especiales se ponen con un botón cada uno en el editor. | Probando la primera parte de los tags especiales, `probar` y `menú diario` no tenían cómo ponerse —el spec decía a la vez que se ponían desde el editor y que escribirlos estaba prohibido—, y la completitud era un mecanismo aparte —clave, columna del índice y conmutador— para algo que se comporta como un tag. | Mantener `completa` y sumar sólo los botones; leer `completa: no` como el tag durante una transición; borrar la clave al guardar. | Un solo mecanismo para los cuatro. La completitud sigue siendo una declaración del usuario (2026-09-12): cambia dónde se guarda. Sin transición ni código propio para `completa`, que queda como clave desconocida: el usuario regulariza los `.md` a mano. Una receta nace con el tag, así que sacarlo es la declaración explícita. | `catalogo.ts`, `recipe.ts`, `tipos.ts`, `editor.ts`, `componentes.ts`, `receta.ts`, `main.ts`; `SCHEMA_VERSION` 6. El frontmatter queda con siete claves. |

- [ ] **Step 2: `E05-Cimientos.md`** — reescribir C05.3.1 a C05.3.3 para que digan: la completitud es el tag `incompleta` en la lista `tags`; el índice no tiene columna propia y se deriva de los tags; `sePuedeTerminar` habilita que se pueda sacar el tag en el editor. Marcar el cambio `[cambio del 2026-09-16]`.

- [ ] **Step 3: `E04-Corregir.md`** — reescribir C04.4.1: el control es un botón por tag especial dentro de «Tags», `incompleta` apretado y deshabilitado sin lo mínimo, vuelve a apretarse si se pierde; una receta nueva nace con `incompleta`.

- [ ] **Step 4: `design-system.md`** — sacar el conmutador de completitud donde se lo describa, y sumar los botones de los tags especiales (invertido al apretar) y el medio círculo como ícono de `incompleta`.

- [ ] **Step 5: `BACKLOG.md`** — en P14, sumar que el skill del agente escribe `completa` y no el tag `incompleta`. En P27, sumar la segunda parte con un resumen de lo hecho y el spec.

- [ ] **Step 6: `CLAUDE.md`** — el esquema pasa de ocho claves a siete en todos los lugares donde se nombra (la fila «Campos `ultima_vez`…» de decisiones cerradas, «Lo esencial», el bloque del skill); sumar al bloque «Hecho el 2026-09-16» la segunda parte, con su spec y su plan.

- [ ] **Step 7: Los dos specs** — en el de la primera parte, el orden de los especiales pasa a `favorito, menú diario, probar, incompleta` y el §2 aclara que `probar` y `menú diario` se ponen con botón. En el de la segunda, el estado pasa a «Implementado».

- [ ] **Step 8: Commit local**

```bash
git add product-design CLAUDE.md docs/superpowers/specs
git commit -m "Los documentos dicen que la completitud es el tag incompleta"
```

---

## Verificación final, en el teléfono

1. Crear una receta: abre con `incompleta` apretado y deshabilitado.
2. Cargar lo mínimo: el botón se habilita; soltarlo y guardar la deja terminada.
3. Con `incompleta` suelto, borrar los pasos: vuelve a apretarse.
4. Poner `menú diario` y `probar` desde sus botones: aparecen en la esquina de la tarjeta y primeros en la receta.
5. Tocar el chip `incompleta` en una receta: abre el editor.
6. La próxima apertura reindexa sola (versión 6).
