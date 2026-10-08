# Referencias unificadas — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Referencia rápida, Masas y dulces, Básicos de cocción y Conservación pasan a ser *Referencias*: un índice por subsección con tags y buscador, y cada ficha en su pantalla; el Conversor queda aparte.

**Architecture:** Los datos no cambian. `src/referencias/indice.ts` suma los tags de cada ficha y separa las cuatro subsecciones (`REFERENCIAS`) del Conversor. Un módulo puro, `src/referencias/busqueda.ts`, decide el índice filtrado y los resultados. La UI suma la entrada y la ficha suelta, reusando el dibujo de tabla y cuenta; el tag y el texto viajan en la ruta, y escribir cambia la ruta sin dibujar (`cambiarSinDibujar`).

**Tech Stack:** TypeScript estricto, Vite, vitest con el DOM escrito a mano (`tests/dom-falso.ts`), MCP con zod.

**Spec:** `docs/superpowers/specs/2026-10-05-referencias-unificadas-design.md`

## Global Constraints

- Todo en español rioplatense: UI, comentarios, tests y commits.
- Ningún test fija un valor de las tablas o constantes de referencia: sólo forma y lógica, con datos armados en el test.
- `npm test`, `npm run typecheck` y `npm run build` en verde al cerrar cada tarea.
- En `src/` no va `instanceof` contra clases del navegador; el destino de un evento se estrecha con `conClosest`.
- `navegacion.ts` es el único que toca `location` y `history`.
- Todo HTML con fotos pasa por `pintar` o `pintarParte` (acá no hay fotos, pero el repintado parcial usa `pintarParte`).
- Un comentario dice la razón vigente; no cita el backlog ni el spec.
- Rutas: `#/herramientas/referencias`, `#/herramientas/referencias?tag=<tag>&q=<texto>`, `#/herramientas/referencias/<id>`; `#/herramientas/conversor` sigue. Las rutas `referencia`, `masas`, `coccion` y `conservacion` dejan de existir y caen en la lista de Herramientas.
- La clave de lo escrito en una cuenta sigue siendo `recetario.referencias.<subsección>`.
- Textos: «Referencias», detalle «Huevos, carne, masas, cocción y cuánto dura cada alimento», buscador «Buscar», sin resultados «Nada con «…»», el link de un grupo «abrir».

## Review Focus

1. Escribir en el buscador: el foco y el teclado quedan; la ruta cambia sin redibujar; el volver desde una ficha encuentra el texto. Test en Tarea 5.
2. Un tag con espacios o acentos («legumbres y granos», «conservación») en la ruta y en los chips: se codifica y se lee bien. Test en Tareas 3 y 4.
3. Una ficha que coincide por título y también por filas aparece una sola vez, como grupo. Test en Tarea 2.
4. Una ficha de cuenta abierta sola sigue guardando bajo la clave de su subsección y repinta sólo su resultado. Test en Tarea 5.
5. `#/herramientas/referencias/<id>` con un id del Conversor o inexistente lleva a la entrada. Test en Tarea 5.

---

### Tarea 1: Los tags en el índice

**Files:**
- Modify: `src/referencias/tipos.ts`, `src/referencias/forma.ts`, `src/referencias/indice.ts`
- Test: `tests/referencias-forma.test.ts`

**Interfaces:**
- Produces:
  - `type FichaDeReferencia = Ficha & { tags?: readonly string[] }` (tipos.ts); `HerramientaDeReferencia.fichas: readonly FichaDeReferencia[]`.
  - `idDeFicha(f: Ficha): string`, `tituloDeFicha(f: Ficha): string` (forma.ts).
  - `REFERENCIAS: readonly HerramientaDeReferencia[]` — las cuatro subsecciones, en orden; `HERRAMIENTAS_DE_REFERENCIA` = `[...REFERENCIAS, conversor]` (indice.ts).
  - `fichaDeReferencia(id: string): { subseccion: HerramientaDeReferencia; ficha: FichaDeReferencia } | null` — sólo en `REFERENCIAS`.

- [ ] **Paso 1: tests de forma que fallan**

```ts
describe('los tags de Referencias', () => {
  it('cada ficha de las cuatro subsecciones tiene al menos un tag, sin repetidos; el Conversor no lleva', () => {
    for (const s of REFERENCIAS) for (const f of s.fichas) {
      const tags = f.tags ?? [];
      expect(tags.length, idDeFicha(f)).toBeGreaterThan(0);
      expect(new Set(tags).size, idDeFicha(f)).toBe(tags.length);
    }
    expect(herramientaDeReferencia('conversor').fichas.every(f => !f.tags)).toBe(true);
    expect(REFERENCIAS.map(s => s.id)).toEqual(['rapida', 'masas', 'coccion', 'conservacion']);
  });

  it('fichaDeReferencia encuentra una ficha de Referencias con su subsección, y no una del Conversor', () => {
    const primera = REFERENCIAS[0].fichas[0];
    expect(fichaDeReferencia(idDeFicha(primera))?.subseccion.id).toBe(REFERENCIAS[0].id);
    expect(fichaDeReferencia(idDeFicha(herramientaDeReferencia('conversor').fichas[0]))).toBeNull();
    expect(fichaDeReferencia('no-existe')).toBeNull();
  });
});
```

- [ ] **Paso 2:** `npx vitest run tests/referencias-forma.test.ts` → FAIL (no existen `REFERENCIAS`, `fichaDeReferencia`, `idDeFicha`).
- [ ] **Paso 3: implementar.** En `tipos.ts`, `FichaDeReferencia` y `fichas: readonly FichaDeReferencia[]`. En `forma.ts`:

```ts
export const idDeFicha = (f: Ficha): string => (f.tipo === 'tabla' ? f.tabla.id : f.cuenta.id);
export const tituloDeFicha = (f: Ficha): string => (f.tipo === 'tabla' ? f.tabla.titulo : f.cuenta.titulo);
```

En `indice.ts`, cada ficha de las cuatro lleva `tags` según la tabla del spec (§Los tags); `REFERENCIAS` son las cuatro, `HERRAMIENTAS_DE_REFERENCIA` las cuatro más el Conversor, y:

```ts
/** La ficha de Referencias con ese id y su subsección; una del Conversor no es de Referencias. */
export function fichaDeReferencia(id: string): { subseccion: HerramientaDeReferencia; ficha: FichaDeReferencia } | null {
  for (const subseccion of REFERENCIAS) {
    const ficha = subseccion.fichas.find(f => idDeFicha(f) === id);
    if (ficha) return { subseccion, ficha };
  }
  return null;
}
```

- [ ] **Paso 4:** el test pasa; `npm test` y `npm run typecheck` en verde.
- [ ] **Paso 5:** commit «Referencias: los tags de cada ficha».

### Tarea 2: La búsqueda

**Files:**
- Create: `src/referencias/busqueda.ts`
- Test: `tests/referencias-busqueda.test.ts`

**Interfaces:**
- Consumes: `HerramientaDeReferencia`, `FichaDeReferencia`, `Tabla`, `Fila` (tipos); `filasDe`, `idDeFicha`, `tituloDeFicha` (forma); `normalizar`.
- Produces:
  - `interface Apartado { subseccion: HerramientaDeReferencia; fichas: readonly FichaDeReferencia[] }`
  - `interface TablaEncontrada { subseccion: HerramientaDeReferencia; ficha: FichaDeReferencia; tabla: Tabla }` — `tabla` recortada a las filas que coinciden.
  - `tagsDe(subs): string[]` — únicos, en orden alfabético (`localeCompare('es')`).
  - `indiceDe(subs, tag: string): Apartado[]` — sin tag, todas; sin las subsecciones vacías.
  - `buscarEnReferencias(subs, tag: string, texto: string): { fichas: Apartado[]; tablas: TablaEncontrada[] }`.
  - `recortar(t: Tabla, coincide: (f: Fila) => boolean): Tabla | null`.

- [ ] **Paso 1: tests que fallan**, con subsecciones armadas en el test (dos subsecciones; una tabla plana, una agrupada y una cuenta; tags propios):
  - `tagsDe` devuelve los tags sin repetir, «aceite» antes de «ñoqui» antes de «zapallo».
  - `indiceDe(subs, '')` devuelve todas; con un tag, sólo sus fichas, y no la subsección que queda vacía; un tag que no está deja `[]`.
  - `buscarEnReferencias`: «LIMON» encuentra «Limón» en una tabla agrupada, con el título de su grupo y sin los grupos vacíos; una ficha que coincide sólo por título o por tag va en `fichas`; una que coincide por título y por filas va sólo en `tablas`; una cuenta se encuentra por título y no por sus entradas; con tag, sólo busca en sus fichas; sin coincidencias, `{ fichas: [], tablas: [] }`; el texto con espacios alrededor se recorta.
- [ ] **Paso 2:** `npx vitest run tests/referencias-busqueda.test.ts` → FAIL (no existe el módulo).
- [ ] **Paso 3: implementar.**

```ts
/**
 * Qué muestra la entrada de Referencias: el índice, filtrado por un tag, o lo
 * que encuentra el buscador. No dibuja: decide.
 */
import { normalizar } from '../normalizar.js';
import { filasDe, idDeFicha, tituloDeFicha } from './forma.js';
import type { HerramientaDeReferencia, FichaDeReferencia, Tabla, Fila } from './tipos.js';

export interface Apartado { subseccion: HerramientaDeReferencia; fichas: readonly FichaDeReferencia[] }
export interface TablaEncontrada { subseccion: HerramientaDeReferencia; ficha: FichaDeReferencia; tabla: Tabla }

export const tagsDe = (subs: readonly HerramientaDeReferencia[]): string[] =>
  [...new Set(subs.flatMap(s => s.fichas.flatMap(f => f.tags ?? [])))].sort((a, b) => a.localeCompare(b, 'es'));

export function indiceDe(subs: readonly HerramientaDeReferencia[], tag: string): Apartado[] {
  return subs
    .map(subseccion => ({ subseccion, fichas: subseccion.fichas.filter(f => !tag || (f.tags ?? []).includes(tag)) }))
    .filter(a => a.fichas.length > 0);
}

/** La tabla con sólo las filas que coinciden, y los grupos que conservan alguna; sin ninguna, nada. */
export function recortar(t: Tabla, coincide: (f: Fila) => boolean): Tabla | null {
  if ('grupos' in t) {
    const grupos = t.grupos.map(g => ({ ...g, filas: g.filas.filter(coincide) })).filter(g => g.filas.length);
    return grupos.length ? { ...t, grupos } : null;
  }
  const filas = t.filas.filter(coincide);
  return filas.length ? { ...t, filas } : null;
}

export function buscarEnReferencias(subs: readonly HerramientaDeReferencia[], tag: string, texto: string):
  { fichas: Apartado[]; tablas: TablaEncontrada[] } {
  const q = normalizar(texto);
  const fichas: Apartado[] = [];
  const tablas: TablaEncontrada[] = [];
  if (!q) return { fichas, tablas };
  for (const { subseccion, fichas: candidatas } of indiceDe(subs, tag)) {
    const porNombre: FichaDeReferencia[] = [];
    for (const ficha of candidatas) {
      const recortada = ficha.tipo === 'tabla'
        ? recortar(ficha.tabla, f => Object.values(f).some(x => normalizar(x).includes(q)))
        : null;
      if (recortada) tablas.push({ subseccion, ficha, tabla: recortada });
      else if ([tituloDeFicha(ficha), ...(ficha.tags ?? [])].some(x => normalizar(x).includes(q))) porNombre.push(ficha);
    }
    if (porNombre.length) fichas.push({ subseccion, fichas: porNombre });
  }
  return { fichas, tablas };
}
```

(`idDeFicha` se importa sólo si lo usa; si no, sacarlo del import.)
- [ ] **Paso 4:** pasa; `npm test` y `npm run typecheck` en verde.
- [ ] **Paso 5:** commit «Referencias: el índice por tag y la búsqueda».

### Tarea 3: Las rutas y cambiar la ruta sin dibujar

**Files:**
- Modify: `src/ui/router.ts`, `src/navegacion.ts`
- Test: `tests/router.test.ts`, `tests/navegacion.test.ts`

**Interfaces:**
- Produces:
  - Vistas `'referencias'` (params `tag`, `q` si vienen y no vacíos), `'ficha-referencia'` (param `id`, decodificado) y `'conversor'` (sin params). La vista `'referencia'` desaparece.
  - `hashDeReferencias({ tag, q }: { tag?: string; q?: string }): string` — `#/herramientas/referencias` más `?tag=…&q=…` con lo que no está vacío (`URLSearchParams`).
  - `nav.cambiarSinDibujar(hash: string): void` — `history.replaceState({ profundidad }, '', hash)` y anota el hash; no dispara `hashchange`.

- [ ] **Paso 1: tests que fallan.** Router:

```ts
it('Referencias: la entrada con su tag y su texto, la ficha y el Conversor', () => {
  expect(parsearHash('#/herramientas/referencias')).toEqual({ vista: 'referencias', params: {} });
  expect(parsearHash('#/herramientas/referencias?tag=legumbres%20y%20granos&q=lim%C3%B3n'))
    .toEqual({ vista: 'referencias', params: { tag: 'legumbres y granos', q: 'limón' } });
  expect(parsearHash('#/herramientas/referencias?tag=&q=')).toEqual({ vista: 'referencias', params: {} });
  expect(parsearHash('#/herramientas/referencias/punto-humo')).toEqual({ vista: 'ficha-referencia', params: { id: 'punto-humo' } });
  expect(parsearHash('#/herramientas/conversor')).toEqual({ vista: 'conversor', params: {} });
});
it('las rutas viejas de cada referencia caen en la lista de Herramientas', () => {
  for (const r of ['referencia', 'masas', 'coccion', 'conservacion']) {
    expect(parsearHash(`#/herramientas/${r}`).vista).toBe('herramientas');
  }
});
it('hashDeReferencias pone en la ruta sólo lo que no está vacío, codificado', () => {
  expect(hashDeReferencias({})).toBe('#/herramientas/referencias');
  expect(hashDeReferencias({ tag: 'conservación', q: '' })).toBe('#/herramientas/referencias?tag=conservaci%C3%B3n');
  expect(parsearHash(hashDeReferencias({ tag: 'legumbres y granos', q: 'a&b' })).params)
    .toEqual({ tag: 'legumbres y granos', q: 'a&b' });
});
```

Navegación (con el entorno falso de `tests/navegacion.test.ts`): `cambiarSinDibujar('#/x?q=a')` llama a `history.replaceState` con la profundidad actual y la URL, no a `location.replace`, y un `volver` posterior sigue sabiendo si hay atrás.
- [ ] **Paso 2:** `npx vitest run tests/router.test.ts tests/navegacion.test.ts` → FAIL.
- [ ] **Paso 3: implementar.** En `router.ts`, `Vista` cambia `'referencia'` por `'referencias' | 'ficha-referencia' | 'conversor'`; desaparece `DE_REFERENCIA`; en el bloque de `herramientas`:

```ts
if (partes[1] === 'conversor') return { vista: 'conversor', params: {} };
if (partes[1] === 'referencias') {
  if (!partes[2]) return { vista: 'referencias', params: presentes(params, ['tag', 'q']) };
  try { return { vista: 'ficha-referencia', params: { id: decodeURIComponent(partes[2]) } }; }
  catch { return { vista: 'referencias', params: {} }; }
}
```

y `hashDeReferencias`. En `navegacion.ts`, dentro del objeto que devuelve `crearNavegacion`:

```ts
/**
 * Cambia el hash de la entrada actual sin dibujar: `replaceState` no dispara
 * `hashchange`. Es para lo que se escribe y viaja en la ruta, como la búsqueda
 * de Referencias: redibujar le sacaría el foco al campo.
 */
cambiarSinDibujar(hash: string): void {
  history.replaceState({ profundidad }, '', hash);
  anotar(hash, false);
},
```

`main.ts` deja de compilar por la vista `'referencia'`: en esta tarea sólo se renombra el `case 'referencia'` a `case 'conversor'` (con `herramientaDeReferencia('conversor')`) y las dos condiciones del listener de `input` pasan a `'conversor'`, con `id = 'conversor'`. Lo demás va en la Tarea 5.
- [ ] **Paso 4:** pasan; `npm test` (ajustar en `tests/main-rutas.test.ts` las rutas viejas a `#/herramientas/conversor` donde se pruebe el Conversor; los casos de las cuatro viejas se reescriben en la Tarea 5 — en esta tarea se marcan con `it.skip` y un comentario «se reescribe con la entrada de Referencias») y `npm run typecheck` en verde.
- [ ] **Paso 5:** commit «Referencias: las rutas de la entrada y de la ficha».

### Tarea 4: Las pantallas

**Files:**
- Modify: `src/ui/referencias.ts`, `src/ui/base.css`
- Test: `tests/vista-referencias.test.ts`

**Interfaces:**
- Consumes: `REFERENCIAS`, `tagsDe`, `indiceDe`, `buscarEnReferencias`, `hashDeReferencias`, `idDeFicha`, `tituloDeFicha`.
- Produces:
  - `renderReferencias(p: { tag: string; q: string }): string` — encabezado (volver, `ICO.libro`, «Referencias») y `<div class="cuerpo referencias">` con el buscador (`data-buscar-referencias`, placeholder «Buscar», value = q), los chips de tags (`<button class="chip[ act]" data-accion="referencias-tag" data-tag="…">`) y `<div data-contenido-referencias>` con `contenidoDeReferencias`.
  - `contenidoDeReferencias(p: { tag: string; q: string }): string` — sin texto, el índice; con texto, los resultados o «Nada con «…»».
  - `renderFichaDeReferencia(f: FichaDeReferencia, valores: Valores): string` — encabezado con volver y el título de la ficha; sus tags como `<a class="chip" href="${hashDeReferencias({ tag })}">`; la ficha sin su `h2`.
  - `renderConversor(h: HerramientaDeReferencia, e: EstadoReferencia): string` — lo que hoy hace `renderReferencia`, con `ICO.medidor` y el buscador siempre.
  - `fichaTabla` y `fichaCuenta` suman un parámetro `conTitulo = true`.

- [ ] **Paso 1: tests que fallan** (contra `REFERENCIAS` real sólo para estructura, sin valores; contra datos del test para el contenido):
  - la entrada lleva volver, el título «Referencias», el buscador vacío y un chip por cada tag de `tagsDe(REFERENCIAS)`; sin tag ni texto, un título por subsección y un link `#/herramientas/referencias/<id>` por ficha;
  - con `tag`, su chip lleva `act` y el índice sólo sus fichas;
  - con `q`, cada tabla encontrada lleva su título, un link «abrir» a su ficha, el `<thead>` y sólo las filas que coinciden; una ficha encontrada por título va como link del índice; sin nada, «Nada con «…»» con el texto escapado;
  - un tag con espacios y acento lleva el `data-tag` escapado y el href codificado;
  - la ficha suelta lleva el título en el encabezado, sus tags como links a la entrada con `?tag=`, y no repite el `h2`; una cuenta suelta lleva `data-resultado-cuenta` y sus entradas;
  - `renderConversor` sigue pasando los tests de hoy del Conversor (renombrar las llamadas).
- [ ] **Paso 2:** `npx vitest run tests/vista-referencias.test.ts` → FAIL.
- [ ] **Paso 3: implementar** en `src/ui/referencias.ts` (los resultados reusan `filasFiltradas(tablaRecortada, '')`, que dibuja el encabezado y las filas que quedan):

```ts
const hrefFicha = (f: Ficha): string => `#/herramientas/referencias/${encodeURIComponent(idDeFicha(f))}`;

function indiceHtml(apartados: readonly Apartado[]): string {
  return apartados.map(a => `<h2 class="sec-ref">${escapar(a.subseccion.titulo)}</h2><div class="ficha indice-refs">` +
    a.fichas.map(f => `<a class="fila ref-fila" href="${hrefFicha(f)}"><span class="tit">${escapar(tituloDeFicha(f))}</span></a>`).join('') +
    '</div>').join('');
}

export function contenidoDeReferencias({ tag, q }: { tag: string; q: string }): string {
  if (!q.trim()) return indiceHtml(indiceDe(REFERENCIAS, tag));
  const { fichas, tablas } = buscarEnReferencias(REFERENCIAS, tag, q);
  if (!fichas.length && !tablas.length) return `<p class="aviso-mudo">Nada con «${escapar(q.trim())}».</p>`;
  return indiceHtml(fichas) + tablas.map(e =>
    `<div class="ficha ref"><h2>${escapar(e.tabla.titulo)} <a class="abrir-ref" href="${hrefFicha(e.ficha)}">abrir</a></h2>` +
    filasFiltradas(e.tabla, '') + '</div>').join('');
}

export function renderReferencias({ tag, q }: { tag: string; q: string }): string {
  const chips = tagsDe(REFERENCIAS).map(t =>
    `<button type="button" class="chip${t === tag ? ' act' : ''}" data-accion="referencias-tag" data-tag="${escapar(t)}">${escapar(t)}</button>`).join('');
  return encabezado({ titulo: 'Referencias', icono: ICO.libro, volver: true }) +
    '<div class="cuerpo referencias">' +
    `<div class="buscar">${ICO.buscar}<input data-buscar-referencias placeholder="Buscar" value="${escapar(q)}"></div>` +
    `<div class="chips tags-ref">${chips}</div>` +
    `<div data-contenido-referencias>${contenidoDeReferencias({ tag, q })}</div></div>`;
}

export function renderFichaDeReferencia(f: FichaDeReferencia, valores: Valores): string {
  const tags = (f.tags ?? []).map(t => `<a class="chip" href="${hashDeReferencias({ tag: t })}">${escapar(t)}</a>`).join('');
  const ficha = f.tipo === 'tabla' ? fichaTabla(f.tabla, '', false) : fichaCuenta(f.cuenta, valores, false);
  return encabezado({ titulo: tituloDeFicha(f), volver: true }) +
    `<div class="cuerpo referencias"><div class="chips tags-ref">${tags}</div>${ficha}</div>`;
}
```

En `base.css`, junto a la sección de Referencias: `.sec-ref` (título de subsección como los de sección de la app, `--txt-chico`, `--fg-2`, mayúsculas de la regla existente para títulos de sección si la hay; si no, `--txt-chico` peso 600 `--fg-2` con `--e-4` arriba), `.tags-ref { flex-wrap: wrap; }`, `.abrir-ref` (`--txt-chico`, `--acento`, sin subrayado) y `.ref-fila` (la fila de lista existente, tocable, 48 px de alto mínimo).
- [ ] **Paso 4:** pasan; `npm test` y `npm run typecheck` en verde.
- [ ] **Paso 5:** commit «Referencias: la entrada, los resultados y la ficha suelta».

### Tarea 5: El cableado y la lista de Herramientas

**Files:**
- Modify: `src/main.ts`, `src/ui/herramientas.ts`, `src/referencias/tipos.ts`, `src/referencias/indice.ts`, `src/ui/iconos.ts`
- Test: `tests/main-rutas.test.ts`, `tests/vista-herramientas.test.ts`, `tests/referencias-forma.test.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: `HerramientaDeReferencia` queda `{ id; titulo; fichas }` (sin `ruta`, `detalle`, `icono`, `buscador`).

- [ ] **Paso 1: tests que fallan** en `tests/main-rutas.test.ts` (reescribir los `it.skip` de la Tarea 3):
  - `#/herramientas/referencias` dibuja la entrada; `#/herramientas/referencias/<id de una tabla>` su ficha; `/<id del conversor>` y `/no-existe` reemplazan la ruta por la entrada;
  - tocar un tag reemplaza la ruta por `?tag=`; tocarlo de nuevo, por la entrada sin tag; con texto escrito, el tag nuevo conserva `q`;
  - escribir en el buscador llama a `cambiarSinDibujar` con `?q=` (y el tag si hay), pinta sólo `[data-contenido-referencias]` y no redibuja la pantalla;
  - en la ficha suelta de una cuenta, escribir guarda bajo `recetario.referencias.<subsección>` y pinta sólo su resultado;
  - el botón de minutos de una ficha suelta crea el temporizador;
  - la lista de Herramientas tiene cinco entradas, en orden, con `#/herramientas/referencias` y `#/herramientas/conversor`.
- [ ] **Paso 2:** `npx vitest run tests/main-rutas.test.ts tests/vista-herramientas.test.ts` → FAIL.
- [ ] **Paso 3: implementar.**
  - `render`: `case 'referencias'` → `pintar(renderReferencias({ tag: params.tag ?? '', q: params.q ?? '' }))`, ignorando un `tag` que no está en `tagsDe(REFERENCIAS)`; `case 'ficha-referencia'` → con `fichaDeReferencia(id)`, `pintar(renderFichaDeReferencia(ficha, controlReferencias.estado(subseccion.id).valores[idDeFicha(ficha)] ?? {}))`, y si no hay, `nav.reemplazar(hashDeReferencias({}))`.
  - Listener de `input`: en `'ficha-referencia'` y `'conversor'`, las entradas de cuenta usan el id de la subsección de la ficha (o `'conversor'`); en `'referencias'`, `[data-buscar-referencias]` hace `vistaActual.params.q = valor`, `nav.cambiarSinDibujar(hashDeReferencias({ tag, q }))` y `pintarParte(#app [data-contenido-referencias], contenidoDeReferencias({ tag, q }), 'reemplazar')`.
  - Acción `referencias-tag` en la sección de acciones de `main.ts`: `nav.reemplazar(hashDeReferencias({ tag: actual === tocado ? '' : tocado, q }))`.
  - `renderHerramientas`: las entradas de Referencias (`#/herramientas/referencias`, `ICO.libro`, «Referencias», «Huevos, carne, masas, cocción y cuánto dura cada alimento») y Conversor (`#/herramientas/conversor`, `ICO.medidor`, «Conversor», «Tazas, cucharas y gramos por ingrediente») escritas como las demás.
  - `HerramientaDeReferencia` sin `ruta`, `detalle`, `icono` ni `buscador`; `indice.ts` sin esos campos; `iconos.ts` sin `rodillo`, `olla` ni `heladera` (verificar con `grep` que nadie más los use).
  - `tests/referencias-forma.test.ts`: el test del orden de las herramientas compara ids, no rutas.
- [ ] **Paso 4:** pasan; `npm test`, `npm run typecheck` y `npm run build` en verde.
- [ ] **Paso 5:** commit «Referencias: una sola sección en Herramientas».

### Tarea 6: El MCP

**Files:**
- Modify: `mcp/referencias.ts`
- Test: `tests/mcp-referencias.test.ts`

- [ ] **Paso 1: test que falla:** el listado de `consultarReferencia({})` lleva, en cada tabla y cada cuenta de una subsección, sus `tags` (los mismos de `indice.ts`); las del Conversor, `[]`.
- [ ] **Paso 2:** `npx vitest run tests/mcp-referencias.test.ts` → FAIL.
- [ ] **Paso 3:** en el listado, `tablas: h.fichas.flatMap(f => f.tipo === 'tabla' ? [{ id, titulo, tags: f.tags ?? [] }] : [])` y lo mismo en `cuentas`.
- [ ] **Paso 4:** pasa; `npm test` y `npm run typecheck` en verde.
- [ ] **Paso 5:** commit «MCP: los tags de cada ficha en el listado de referencias».

### Tarea 7: Los documentos

**Files:**
- Modify: `product-design/product/specs/E07-Herramientas.md`, `product-design/ux/information-architecture.md`, `product-design/ux/design-system.md`, `CLAUDE.md`, `skills/herramientas/SKILL.md`, `mcp/LEEME.md`, `BACKLOG.md`

- [ ] **Paso 1:** E07: F07.7 a F07.10 pasan a ser **F07.7 — Referencias** con C07.7.1 la entrada (buscador, tags, índice, ruta), C07.7.2 los resultados, C07.7.3 la ficha, y las fichas de cada subsección (lo de hoy de F07.7.2, F07.8, F07.9 y F07.10, sin las pantallas propias ni el buscador de Conservación); la tabla de tags; C07.1 (la lista de cinco y las rutas); C07.6.4 (el listado con tags); F07.11 Conversor pasa a F07.8 si la numeración lo pide, o queda.
- [ ] **Paso 2:** IA: la fila de las cuatro pantallas pasa a dos —*Referencias* (`#/herramientas/referencias`) y *Ficha de referencia* (`#/herramientas/referencias/<id>`)—. Design system §6.30: la entrada, el título de subsección, la fila de ficha, los chips de tags, el grupo de resultados con «abrir», la ficha suelta sin `h2`; el buscador de Conservación sale del texto; la tabla de íconos queda con `libro` (Referencias) y `medidor` (Conversor).
- [ ] **Paso 3:** `CLAUDE.md` (la sección de Herramientas y la tabla de UI), el skill (cuándo usar `consultar_referencia`: los tags del listado) y el `LEEME`.
- [ ] **Paso 4:** `npm test` en verde (los tests de skills y documentos).
- [ ] **Paso 5:** commit «Referencias: los documentos de la sección unificada».

## Al cerrar

Revisión final de toda la rama; el usuario revisa el diff antes de pasar a `main`; P130 pasa a `Falta probar`; se borran el spec y el plan.
