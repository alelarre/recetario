# `tags_especiales` — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: superpowers:subagent-driven-development
> (recomendado) o superpowers:executing-plans, tarea por tarea. Los pasos usan
> casillas (`- [ ]`).

**Objetivo:** los cuatro especiales pasan de `tags` a una clave propia,
`tags_especiales`, con el comportamiento de cada uno declarado en una tabla.

**Arquitectura:** `src/especiales.ts` es la tabla y las funciones puras sobre
ella. `recipe.ts` declara las claves del frontmatter en un solo lugar y las
recorre al leer y al escribir. El resto (índice, store, UI, conversión, MCP)
pasa a mirar `tags_especiales` y a consultar la tabla en vez de preguntar por
nombre.

**Stack:** TypeScript estricto, Vite, Vitest (Node, DOM escrito a mano en
`tests/dom-falso.ts`).

**Spec:** `docs/superpowers/specs/2026-09-28-tags-especiales-design.md`.
Leelo antes de empezar: el plan argumenta desde ahí.

## Restricciones globales

- Todo en español rioplatense: código, comentarios, mensajes y documentos.
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`. Imports de tipos con `import type`. Nada de `.js`.
- En `src/` no va `instanceof` contra clases del navegador.
- Un comentario dice la razón vigente; no cita entradas del backlog ni este
  spec o plan (desaparecen al terminar). Sí puede citar `product-design/`.
- **No se commitea nada.** El usuario revisa el diff completo al final
  (Tarea 10). Cada tarea termina con sus tests en verde, no con un commit.
- **Entre tareas la suite completa puede estar roja** en lo que todavía no se
  migró: el cambio es transversal. Cada tarea corre los archivos de test que
  le tocan. La Tarea 10 deja `npm test`, `npm run typecheck` y
  `npm run build` en verde.
- Correr un archivo: `npx vitest run tests/<archivo>.test.ts`.

## Qué mirar al revisar

Condiciones que el spec implica y que conviene tener cubiertas; cada una tiene
su test en la tarea que la dueña.

1. Un `.md` viejo con `favorito` en `tags`: se lee sin el especial y sin un
   tag común «favorito»; `validar` lo marca como error (Tareas 2 y 5).
2. `tags_especiales: [Favorito, favorito, BORRADOR]`: se lee
   `[favorito, borrador]`, sin duplicados y en el orden de la tabla (Tarea 2).
3. Una receta guardada sin tocar nada conserva sus especiales: ida y vuelta
   `parse → serialize → parse` (Tarea 2) y el editor, que los manda en su
   propio `hidden` (Tarea 7).
4. Pegar la respuesta del agente sobre un borrador favorito con categoría:
   queda `favorito`, sale `borrador` (Tarea 6).
5. Una fila del índice escrita con el esquema 7 (sin la columna nueva): se
   lee con `tags_especiales` vacío, sin romper (Tarea 3).

---

### Tarea 1: la tabla de especiales

**Archivos:**
- Crear: `src/normalizar.ts`, `src/especiales.ts`, `tests/especiales.test.ts`
- Modificar: `src/recipe.ts` (mover `normalizar`, reexportarlo)

**Interfaces que produce** (las usan todas las tareas siguientes):

```ts
// src/normalizar.ts
export function normalizar(texto: unknown): string;

// src/especiales.ts
export type NombreIcono = 'estrella' | 'calendario' | 'marcador';
export type TagEspecial = 'favorito' | 'menú diario' | 'probar' | 'borrador';
export interface DefinicionEspecial { /* ver el paso 3 */ }
export const ESPECIALES: readonly DefinicionEspecial[];
export const TAGS_ESPECIALES: readonly TagEspecial[];
export const TAGS_RESERVADOS: readonly string[];
export function definicion(especial: TagEspecial): DefinicionEspecial;
export function tagEspecial(valor: unknown): TagEspecial | null;   // sólo la forma canónica
export function tagReservado(valor: unknown): boolean;
export function especialDeReservada(valor: unknown): TagEspecial | null; // `favoritas` → `favorito`
export function especialesValidos(valores: readonly string[]): { validos: TagEspecial[]; ignorados: string[] };
```

- [ ] **Paso 1: mover `normalizar`.** Crear `src/normalizar.ts` con la función
  tal cual está hoy en `src/recipe.ts` (con su comentario «Minúsculas y sin
  tildes. Es la única normalización del sistema.»). En `recipe.ts`, borrar la
  función y agregar:

  ```ts
  import { normalizar } from './normalizar.js';
  export { normalizar } from './normalizar.js';
  ```

  Correr `npx vitest run tests/recipe*.test.ts`: tiene que seguir verde.

- [ ] **Paso 2: escribir el test que falla.** `tests/especiales.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import {
    ESPECIALES, TAGS_ESPECIALES, TAGS_RESERVADOS, definicion, tagEspecial,
    tagReservado, especialDeReservada, especialesValidos
  } from '../src/especiales.js';
  import { ICO } from '../src/ui/iconos.js';

  describe('la tabla de especiales', () => {
    it('tiene los cuatro, en su orden', () => {
      expect(TAGS_ESPECIALES).toEqual(['favorito', 'menú diario', 'probar', 'borrador']);
      expect(ESPECIALES.map(d => d.nombre)).toEqual([...TAGS_ESPECIALES]);
    });

    it.each([
      ['favorito', 'estrella', 'Favorita', true, true, false],
      ['menú diario', 'calendario', 'Menú diario', true, true, false],
      ['probar', 'marcador', 'Para probar', true, true, false],
      ['borrador', null, null, false, false, false]
    ] as const)('%s: ícono, marca, chips, receta y búsqueda', (nombre, icono, marca, chips, receta, busqueda) => {
      const d = definicion(nombre);
      expect(d.icono).toBe(icono);
      expect(d.etiquetaMarca).toBe(marca);
      expect(d.enChips).toBe(chips);
      expect(d.enReceta).toBe(receta);
      expect(d.enBusqueda).toBe(busqueda);
      expect(d.etiquetaEditor).toBe(nombre);
    });

    it('cada ícono existe en ICO', () => {
      for (const d of ESPECIALES) if (d.icono) expect(ICO[d.icono]).toBeTruthy();
    });
  });

  describe('reconocer', () => {
    it('sólo la forma canónica, sin mirar mayúsculas ni tildes', () => {
      expect(tagEspecial('Favorito')).toBe('favorito');
      expect(tagEspecial('menu diario')).toBe('menú diario');
      expect(tagEspecial('favoritas')).toBeNull();
      expect(tagEspecial('incompleta')).toBeNull();
      expect(tagEspecial('horno')).toBeNull();
    });

    it('las reservadas son los nombres, sus formas y las de terminado', () => {
      for (const t of ['favorito', 'Favoritas', 'borradores', 'incompleta', 'incompletos', 'terminada', 'menu diario', 'probar']) {
        expect(tagReservado(t)).toBe(true);
      }
      expect(tagReservado('horno')).toBe(false);
      expect(TAGS_RESERVADOS).toContain('incompletas');
    });

    it('una forma reservada dice de qué especial es', () => {
      expect(especialDeReservada('favoritas')).toBe('favorito');
      expect(especialDeReservada('Incompleta')).toBe('borrador');
      expect(especialDeReservada('favorito')).toBe('favorito');
      expect(especialDeReservada('terminado')).toBeNull();
    });
  });

  describe('especialesValidos', () => {
    it('canónicos, sin repetir, en el orden de la tabla, y aparte lo que no es', () => {
      expect(especialesValidos(['BORRADOR', 'Favorito', 'favorito', 'favoritas', 'pan']))
        .toEqual({ validos: ['favorito', 'borrador'], ignorados: ['favoritas', 'pan'] });
    });
  });
  ```

- [ ] **Paso 3: correrlo y ver que falla** (`src/especiales.js` no existe).

- [ ] **Paso 4: implementar `src/especiales.ts`.**

  ```ts
  /**
   * Los tags especiales: lo que la app dibuja y filtra distinto. Viven en la
   * clave `tags_especiales` del `.md`, separados de `tags`. Cada uno se
   * declara acá con todo lo que lo distingue; el resto del código consulta
   * la definición y no pregunta por nombre. El orden de la tabla es el de
   * cualquier fila de tags: primero lo que se busca para cocinar, al final lo
   * que falta terminar.
   */
  import { normalizar } from './normalizar.js';

  /** Las claves de `ICO` que usa un especial. El dominio no importa la UI. */
  export type NombreIcono = 'estrella' | 'calendario' | 'marcador';

  export type TagEspecial = 'favorito' | 'menú diario' | 'probar' | 'borrador';

  export interface DefinicionEspecial {
    /** La forma canónica: la única que se lee y la que se escribe. */
    nombre: TagEspecial;
    /** Otras formas que no se escriben a mano en `tags`. */
    reservadas: readonly string[];
    icono: NombreIcono | null;
    /** Lo que dice la marca de la tarjeta para quien no la ve. */
    etiquetaMarca: string | null;
    /** Se ofrece en la fila de chips de las listas. */
    enChips: boolean;
    /** Se muestra en la receta y como marca en la tarjeta. */
    enReceta: boolean;
    /** La búsqueda por texto lo encuentra. */
    enBusqueda: boolean;
    /** El texto de su botón en el editor. */
    etiquetaEditor: string;
  }

  export const ESPECIALES: readonly DefinicionEspecial[] = [
    {
      nombre: 'favorito', reservadas: ['favorita', 'favoritos', 'favoritas'],
      icono: 'estrella', etiquetaMarca: 'Favorita',
      enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'favorito'
    },
    {
      nombre: 'menú diario', reservadas: [],
      icono: 'calendario', etiquetaMarca: 'Menú diario',
      enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'menú diario'
    },
    {
      nombre: 'probar', reservadas: [],
      icono: 'marcador', etiquetaMarca: 'Para probar',
      enChips: true, enReceta: true, enBusqueda: false, etiquetaEditor: 'probar'
    },
    // Sin presentación propia: al borrador se llega por su lista, en el menú.
    {
      nombre: 'borrador', reservadas: ['borradores', 'incompleta', 'incompleto', 'incompletos', 'incompletas'],
      icono: null, etiquetaMarca: null,
      enChips: false, enReceta: false, enBusqueda: false, etiquetaEditor: 'borrador'
    }
  ];

  export const TAGS_ESPECIALES: readonly TagEspecial[] = ESPECIALES.map(d => d.nombre);

  /** Contradicen a `borrador`: no son un especial, pero tampoco se escriben a mano. */
  const FORMAS_TERMINADO = ['terminado', 'terminada', 'terminados', 'terminadas'] as const;

  /** Lo que no se escribe a mano en `tags`. */
  export const TAGS_RESERVADOS: readonly string[] = [
    ...ESPECIALES.flatMap(d => [d.nombre, ...d.reservadas]),
    ...FORMAS_TERMINADO
  ];

  export function definicion(especial: TagEspecial): DefinicionEspecial {
    const d = ESPECIALES.find(x => x.nombre === especial);
    if (!d) throw new Error(`Especial desconocido: ${especial}`);
    return d;
  }

  /** El especial escrito en su forma canónica, sin mirar mayúsculas ni tildes, o `null`. */
  export function tagEspecial(valor: unknown): TagEspecial | null {
    const n = normalizar(valor);
    if (!n) return null;
    return TAGS_ESPECIALES.find(t => normalizar(t) === n) ?? null;
  }

  export function tagReservado(valor: unknown): boolean {
    const n = normalizar(valor);
    return !!n && TAGS_RESERVADOS.some(t => normalizar(t) === n);
  }

  /** El especial del que un tag reservado es el nombre o una forma, o `null` (`terminado`). */
  export function especialDeReservada(valor: unknown): TagEspecial | null {
    const n = normalizar(valor);
    if (!n) return null;
    return ESPECIALES.find(d => [d.nombre, ...d.reservadas].some(f => normalizar(f) === n))?.nombre ?? null;
  }

  /** Lo que se lee de `tags_especiales`: la lista cerrada, en su orden y sin repetir, y aparte lo que no es. */
  export function especialesValidos(valores: readonly string[]): { validos: TagEspecial[]; ignorados: string[] } {
    const puestos = new Set<TagEspecial>();
    const ignorados: string[] = [];
    for (const v of valores) {
      const t = tagEspecial(v);
      if (t) puestos.add(t); else ignorados.push(v);
    }
    return { validos: TAGS_ESPECIALES.filter(t => puestos.has(t)), ignorados };
  }
  ```

- [ ] **Paso 5:** `npx vitest run tests/especiales.test.ts` → verde.

---

### Tarea 2: el formato del `.md`

**Archivos:**
- Modificar: `src/recipe.ts`, `src/tipos.ts`
- Tests: `tests/recipe-*.test.ts` (sumar `tests/recipe-especiales.test.ts`),
  `tests/dobles.ts` (`recetaFalsa` sale de `parse('')`, no cambia)

**Consume:** `especialesValidos`, `tagReservado`, `TagEspecial` (Tarea 1).

**Produce:**

```ts
// src/tipos.ts
import type { TagEspecial } from './especiales.js';
export interface ValorIgnorado { clave: 'tags' | 'tags_especiales'; valor: string }
export interface Receta {
  titulo: string | null;
  tags: string[];
  tags_especiales: TagEspecial[];
  // …lo de hoy…
  /** Lo que el parser descartó de `tags` y `tags_especiales`. No se escribe. */
  ignorados: ValorIgnorado[];
}

// src/recipe.ts
export const CLAVES_FRONTMATTER: readonly { clave: ClaveFrontmatter; forma: 'texto' | 'lista' }[];
export type ClaveFrontmatter = 'titulo' | 'tags' | 'tags_especiales' | 'rinde' | 'tiempo' | 'dificultad' | 'fuente' | 'foto';
```

- [ ] **Paso 1: el test que falla.** `tests/recipe-especiales.test.ts`:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { parse, serialize, CLAVES_FRONTMATTER } from '../src/recipe.js';

  const md = (fm: string): string => `---\ntitulo: Pollo\n${fm}\n---\n`;

  describe('tags_especiales al leer', () => {
    it('se lee la lista cerrada, canónica y en orden', () => {
      const r = parse(md('tags_especiales: [BORRADOR, Favorito, favorito]'));
      expect(r.tags_especiales).toEqual(['favorito', 'borrador']);
      expect(r.ignorados).toEqual([]);
    });

    it('un valor que no es de la lista se ignora y queda anotado', () => {
      const r = parse(md('tags_especiales: [favoritas, pan]'));
      expect(r.tags_especiales).toEqual([]);
      expect(r.ignorados).toEqual([
        { clave: 'tags_especiales', valor: 'favoritas' },
        { clave: 'tags_especiales', valor: 'pan' }
      ]);
    });

    it('un reservado en tags se ignora: ni especial ni tag común', () => {
      const r = parse(md('tags: [favorito, horno, incompleta, terminado]'));
      expect(r.tags).toEqual(['horno']);
      expect(r.tags_especiales).toEqual([]);
      expect(r.ignorados.map(i => i.valor)).toEqual(['favorito', 'incompleta', 'terminado']);
    });

    it('acepta el formato largo de lista', () => {
      const r = parse('---\ntitulo: X\ntags_especiales:\n  - probar\n  - favorito\n---\n');
      expect(r.tags_especiales).toEqual(['favorito', 'probar']);
      expect(r.avisos).not.toContain('frontmatter-ilegible');
    });

    it('sin la clave, vacío', () => {
      expect(parse(md('tags: [horno]')).tags_especiales).toEqual([]);
    });
  });

  describe('tags_especiales al escribir', () => {
    it('va justo después de tags, y vacía no se escribe', () => {
      const r = parse(md('tags: [horno]\ntags_especiales: [probar]\nrinde: 4'));
      expect(serialize(r)).toMatch(/^---\ntitulo: Pollo\ntags: \[horno\]\ntags_especiales: \[probar\]\nrinde: 4\n---/);
      expect(serialize({ ...r, tags_especiales: [] })).not.toContain('tags_especiales');
    });

    it('ida y vuelta', () => {
      const r = parse(md('tags: [horno]\ntags_especiales: [favorito, borrador]'));
      expect(parse(serialize(r)).tags_especiales).toEqual(['favorito', 'borrador']);
    });

    it('lo ignorado no se escribe', () => {
      const r = parse(md('tags: [favorito, horno]'));
      expect(serialize(r)).not.toContain('favorito');
    });
  });

  it('las claves declaradas, en el orden en que se escriben', () => {
    expect(CLAVES_FRONTMATTER.map(c => c.clave))
      .toEqual(['titulo', 'tags', 'tags_especiales', 'rinde', 'tiempo', 'dificultad', 'fuente', 'foto']);
  });
  ```

- [ ] **Paso 2:** correrlo y ver que falla.

- [ ] **Paso 3: implementar.** En `src/tipos.ts`, agregar `ValorIgnorado`,
  `tags_especiales` e `ignorados` a `Receta` como arriba. Cambiar el comentario
  de `extras` a «Claves del frontmatter que no son las del formato».

  En `src/recipe.ts`, reemplazar `CLAVES`/`ClaveSimple`/`esClaveSimple` por:

  ```ts
  import { especialesValidos, tagReservado } from './especiales.js';

  /**
   * Las claves del frontmatter, en el orden en que se escriben. Es la única
   * declaración del formato: el parser, el serializador, `validar` y las
   * reglas para los agentes salen de acá.
   */
  export const CLAVES_FRONTMATTER = [
    { clave: 'titulo', forma: 'texto' },
    { clave: 'tags', forma: 'lista' },
    { clave: 'tags_especiales', forma: 'lista' },
    { clave: 'rinde', forma: 'texto' },
    { clave: 'tiempo', forma: 'texto' },
    { clave: 'dificultad', forma: 'texto' },
    { clave: 'fuente', forma: 'texto' },
    { clave: 'foto', forma: 'texto' }
  ] as const;
  export type ClaveFrontmatter = (typeof CLAVES_FRONTMATTER)[number]['clave'];
  type ClaveTexto = Extract<(typeof CLAVES_FRONTMATTER)[number], { forma: 'texto' }>['clave'];
  type ClaveLista = Extract<(typeof CLAVES_FRONTMATTER)[number], { forma: 'lista' }>['clave'];

  const formaDe = (c: string): 'texto' | 'lista' | null =>
    CLAVES_FRONTMATTER.find(x => x.clave === c)?.forma ?? null;
  ```

  `recetaVacia()` suma `tags_especiales: []` e `ignorados: []`.

  En `parsearFrontmatter`: las listas se juntan crudas y se asignan al final,
  porque el filtro de cada una necesita la lista entera.

  ```ts
  const listas: Partial<Record<ClaveLista, string[]>> = {};
  // …dentro del for, en lugar de `if (clave === 'tags')`:
  if (/^\s*-\s+/.test(linea)) {
    if (!(ultimaClave !== null && formaDe(ultimaClave) === 'lista')) receta.avisos.push('frontmatter-ilegible');
    continue;
  }
  // …
  const forma = formaDe(clave);
  if (forma === 'lista') listas[clave as ClaveLista] = parsearLista(valor.trim(), lineas.slice(i + 1));
  else if (forma === 'texto') receta[clave as ClaveTexto] = valor.trim() === '' ? null : valor.trim();
  else receta.extras[clave] = valor.trim();
  // …después del for:
  // Un reservado en `tags` no es un tag común: los especiales tienen su clave.
  const tags = listas.tags ?? [];
  receta.tags = tags.filter(t => !tagReservado(t));
  const { validos, ignorados } = especialesValidos(listas.tags_especiales ?? []);
  receta.tags_especiales = validos;
  receta.ignorados = [
    ...tags.filter(tagReservado).map(valor => ({ clave: 'tags' as const, valor })),
    ...ignorados.map(valor => ({ clave: 'tags_especiales' as const, valor }))
  ];
  ```

  En `serialize`, reemplazar el armado del frontmatter por el recorrido:

  ```ts
  for (const { clave, forma } of CLAVES_FRONTMATTER) {
    if (forma === 'lista') {
      const valores = r[clave];
      if (Array.isArray(valores) && valores.length) fm.push(`${clave}: [${valores.join(', ')}]`);
    } else if (r[clave]) {
      fm.push(`${clave}: ${r[clave]}`);
    }
  }
  ```

  (las `extras` siguen después, igual que hoy).

- [ ] **Paso 4:** `npx vitest run tests/recipe-especiales.test.ts tests/recipe*.test.ts`
  → verde. Si algún test de `recipe-*` tenía `favorito` o `borrador` en `tags`
  esperando leerlo, pasarlo a `tags_especiales` en el `.md` del test.

---

### Tarea 3: catálogo e índice

**Archivos:**
- Modificar: `src/catalogo.ts`, `src/tipos.ts` (`Entrada`), `src/config.ts`
  (`SCHEMA_VERSION = 8`), `tests/dobles.ts` (`entradaFalsa` suma
  `tags_especiales: []`)
- Tests: `tests/catalogo-especiales.test.ts` (reescribir), `tests/catalogo-fila.test.ts`,
  `tests/recipe-completitud.test.ts`, `tests/version.test.ts` si fija el número

**Consume:** Tareas 1 y 2.

**Produce** (en `catalogo.ts`):

```ts
export { TAGS_ESPECIALES, TAGS_RESERVADOS, ESPECIALES, definicion, tagEspecial, tagReservado } from './especiales.js';
export type { TagEspecial, DefinicionEspecial } from './especiales.js';
export function tieneEspecial(x: { tags_especiales: readonly TagEspecial[] }, especial: TagEspecial): boolean;
export const esFavorita: (x: { tags_especiales: readonly TagEspecial[] }) => boolean;
export function conEspecial(especiales: readonly TagEspecial[], especial: TagEspecial, puesto: boolean): TagEspecial[];
export function coincideTag(escrito: string, buscado: string): boolean; // sólo normalizar
```

`Entrada` suma `tags_especiales: TagEspecial[]`. `COLUMNAS` suma
`'tags_especiales'` **al final**, después de `'foto'`.

- [ ] **Paso 1: reescribir `tests/catalogo-especiales.test.ts`** con:

  ```ts
  import { describe, it, expect } from 'vitest';
  import { tieneEspecial, esFavorita, conEspecial, coincideTag, tieneAlgoCargado, filaDesde, entradaDesdeFila, COLUMNAS } from '../src/catalogo.js';
  import { recetaFalsa } from './dobles.js';

  describe('especiales en tags_especiales', () => {
    it('tieneEspecial y esFavorita miran la clave nueva', () => {
      expect(esFavorita({ tags_especiales: ['favorito'] })).toBe(true);
      expect(tieneEspecial({ tags_especiales: ['probar'] }, 'borrador')).toBe(false);
    });

    it('conEspecial pone y saca, en el orden de la tabla', () => {
      expect(conEspecial(['borrador'], 'favorito', true)).toEqual(['favorito', 'borrador']);
      expect(conEspecial(['favorito', 'borrador'], 'favorito', false)).toEqual(['borrador']);
      expect(conEspecial(['favorito'], 'favorito', true)).toEqual(['favorito']);
    });

    it('coincideTag ya no conoce formas alternativas', () => {
      expect(coincideTag('Horno', 'horno')).toBe(true);
      expect(coincideTag('favoritas', 'favorito')).toBe(false);
    });

    it('un especial que no es borrador cuenta como algo cargado', () => {
      expect(tieneAlgoCargado(recetaFalsa({ tags_especiales: ['borrador'] }))).toBe(false);
      expect(tieneAlgoCargado(recetaFalsa({ tags_especiales: ['borrador', 'probar'] }))).toBe(true);
      expect(tieneAlgoCargado(recetaFalsa({ tags: ['horno'] }))).toBe(true);
    });
  });

  describe('la columna del índice', () => {
    it('va al final, y hace ida y vuelta', () => {
      expect(COLUMNAS.at(-1)).toBe('tags_especiales');
      const fila = filaDesde(recetaFalsa({ titulo: 'X', tags_especiales: ['favorito', 'borrador'] }), { id: 'a' });
      expect(entradaDesdeFila(fila).tags_especiales).toEqual(['favorito', 'borrador']);
    });

    it('una fila del esquema anterior, sin la columna, se lee vacía', () => {
      const vieja = filaDesde(recetaFalsa({ titulo: 'X' }), { id: 'a' }).slice(0, -1);
      expect(entradaDesdeFila(vieja).tags_especiales).toEqual([]);
    });

    it('una celda con algo que no es especial lo descarta', () => {
      const fila = filaDesde(recetaFalsa({ titulo: 'X' }), { id: 'a' });
      fila[fila.length - 1] = 'favorito|pan';
      expect(entradaDesdeFila(fila).tags_especiales).toEqual(['favorito']);
    });
  });
  ```

  (Verificar que `recetaFalsa` acepte parciales; si no, usar
  `{ ...parse(''), … }`.)

- [ ] **Paso 2:** correrlo y ver que falla.

- [ ] **Paso 3: implementar en `catalogo.ts`.**
  - Borrar `TAGS_ESPECIALES`, `TagEspecial`, `FORMAS_ALTERNATIVAS`,
    `FORMAS_TERMINADO`, `TAGS_RESERVADOS`, `tagReservado`, `tagEspecial` y
    `ordenarTags`; agregar los reexports de arriba.
  - `coincideTag(escrito, buscado)`: `normalizar(escrito) === normalizar(buscado)`.
  - `tieneEspecial`: `(Array.isArray(x?.tags_especiales) ? x.tags_especiales : []).includes(especial)`.
  - `conEspecial(especiales, especial, puesto)`:
    ```ts
    const puestos = new Set(especiales.filter(t => t !== especial));
    if (puesto) puestos.add(especial);
    return TAGS_ESPECIALES.filter(t => puestos.has(t));
    ```
  - `tieneAlgoCargado`: la última condición pasa a
    `receta.tags.length > 0 || receta.tags_especiales.some(t => t !== 'borrador')`.
  - `COLUMNAS`: sumar `'tags_especiales'` al final. En `filaDesde`:
    `tags_especiales: unirConBarra(Array.isArray(r.tags_especiales) ? r.tags_especiales : [])`.
    En `entradaDesdeFila`:
    `tags_especiales: especialesValidos(partir(texto.tags_especiales)).validos`.
  - Actualizar el comentario de `COLUMNAS` si hace falta; el de los
    especiales ya vive en `especiales.ts`.
  - `SCHEMA_VERSION = 8` en `src/config.ts`.

- [ ] **Paso 4:** `npx vitest run tests/catalogo-especiales.test.ts tests/catalogo-fila.test.ts tests/recipe-completitud.test.ts tests/version.test.ts`
  → verde. Ajustar los fixtures que pongan especiales en `tags`.

---

### Tarea 4: el store

**Archivos:**
- Modificar: `src/store.ts`
- Tests: `tests/store-busqueda.test.ts`, `tests/store-reconstruccion.test.ts`,
  `tests/store-categorias.test.ts`, `tests/store-gestion-categorias.test.ts`,
  `tests/store-indice-local.test.ts`, `tests/store-informe.test.ts`

**Consume:** `tagEspecial`, `definicion`, `tieneEspecial`, `conEspecial`,
`coincideTag` (Tarea 3).

- [ ] **Paso 1: tests que fallan**, en `tests/store-busqueda.test.ts`
  (usando los helpers del archivo para armar el store con entradas):

  ```ts
  it('filtrar por un especial mira tags_especiales', () => {
    // entradas: A con tags_especiales ['favorito'], B con tags ['horno']
    expect(store.buscar({ tags: ['favorito'] }).map(e => e.titulo)).toEqual(['A']);
    expect(store.buscar({ tags: ['horno'] }).map(e => e.titulo)).toEqual(['B']);
  });

  it('tagsDe cuenta los especiales con enChips y no borrador', () => {
    // entradas: A ['favorito'] + tags ['horno'], C ['borrador'] (con categoría)
    const tags = store.tagsDe('todas');
    expect(tags).toContainEqual({ tag: 'favorito', cantidad: 1 });
    expect(tags.find(t => t.tag === 'borrador')).toBeUndefined();
  });

  it('la búsqueda por texto no encuentra especiales', () => {
    expect(store.buscarPorTexto('favorito').porTag).toEqual([]);
  });
  ```

- [ ] **Paso 2:** correrlos y ver que fallan.

- [ ] **Paso 3: implementar.**
  - `buscar`: el filtro de tags pasa a
    ```ts
    if (tagList.length && !tagList.every(tag => {
      const esp = tagEspecial(tag);
      return esp ? e.tags_especiales.includes(esp) : e.tags.some(x => coincideTag(x, tag));
    })) return false;
    ```
  - `tagsDe`: después del loop de `e.tags` (que ya no necesita el `if` de
    `borrador`: los reservados no llegan a `tags`), sumar
    ```ts
    for (const esp of e.tags_especiales) {
      if (definicion(esp).enChips) cuenta.set(esp, (cuenta.get(esp) ?? 0) + 1);
    }
    ```
    Actualizar el comentario: los especiales se cuentan según su definición.
  - `buscarPorTexto`: sin cambios de lógica (recorre `e.tags`); ajustar el
    comentario si menciona el tag `borrador` como motivo.
  - `sueltaSinBorrador(carpeta, receta: { tags_especiales: TagEspecial[] })`.
  - Reindexar lo suelto (≈ línea 1304):
    `{ ...receta, tags_especiales: conEspecial(receta.tags_especiales, 'borrador', true) }`.
  - Cualquier otro `tieneEspecial(e, …)` ya funciona por la firma nueva.

- [ ] **Paso 4:** correr los `tests/store-*.test.ts` y ajustar fixtures:
  especiales que estaban en `tags` de `entradaFalsa(...)`/`.md` de prueba
  pasan a `tags_especiales`. Verde.

---

### Tarea 5: validar

**Archivos:**
- Modificar: `src/validar.ts`
- Tests: `tests/validar.test.ts`

**Consume:** `Receta.ignorados` (Tarea 2), `especialDeReservada`,
`TAGS_ESPECIALES`, `CLAVES_FRONTMATTER`.

- [ ] **Paso 1: tests que fallan** en `tests/validar.test.ts`:

  ```ts
  const conFm = (fm: string) => `---\ntitulo: X\n${fm}\n---\n`;

  it('un especial en tags es error y dice dónde va', () => {
    const { problemas } = validarMd(conFm('tags: [favorito]'));
    expect(problemas).toContainEqual({ campo: 'tags', nivel: 'error',
      mensaje: '`favorito` es un tag especial: va en `tags_especiales`.' });
  });

  it('una forma reservada es error y nombra su especial', () => {
    const { problemas } = validarMd(conFm('tags: [incompleta]'));
    expect(problemas).toContainEqual({ campo: 'tags', nivel: 'error',
      mensaje: '`incompleta` está reservado. Si es `borrador`, va en `tags_especiales`.' });
  });

  it('terminado es error', () => {
    const { problemas } = validarMd(conFm('tags: [terminado]'));
    expect(problemas).toContainEqual({ campo: 'tags', nivel: 'error',
      mensaje: 'El tag `terminado` está reservado y no se usa.' });
  });

  it('un valor fuera de la lista en tags_especiales es error', () => {
    const { problemas } = validarMd(conFm('tags_especiales: [pan]'));
    expect(problemas).toContainEqual({ campo: 'tags_especiales', nivel: 'error',
      mensaje: '`pan` no es un tag especial. `tags_especiales` acepta: `favorito`, `menú diario`, `probar`, `borrador`.' });
  });

  it('tags_especiales no es una clave desconocida', () => {
    const { problemas } = validarMd(conFm('tags_especiales: [favorito]'));
    expect(problemas).toEqual([]);
  });
  ```

  Borrar los tests que esperaban `aviso` para una forma alternativa.

- [ ] **Paso 2:** correrlos y ver que fallan.

- [ ] **Paso 3: implementar.** Reemplazar `problemasDeTags(receta.tags)` por
  `problemasDeIgnorados(receta.ignorados)`:

  ```ts
  /**
   * Lo que el parser descartó de `tags` y `tags_especiales`. Todo es error:
   * la receta se guardaría perdiéndolo.
   */
  function problemasDeIgnorados(ignorados: readonly ValorIgnorado[]): Problema[] {
    return ignorados.map(({ clave, valor }): Problema => {
      if (clave === 'tags_especiales') {
        return { campo: clave, nivel: 'error',
          mensaje: `\`${valor}\` no es un tag especial. \`tags_especiales\` acepta: ${lista(TAGS_ESPECIALES)}.` };
      }
      const especial = especialDeReservada(valor);
      if (especial && tagEspecial(valor) === especial) {
        return { campo: clave, nivel: 'error', mensaje: `\`${valor}\` es un tag especial: va en \`tags_especiales\`.` };
      }
      return especial
        ? { campo: clave, nivel: 'error', mensaje: `\`${valor}\` está reservado. Si es \`${especial}\`, va en \`tags_especiales\`.` }
        : { campo: clave, nivel: 'error', mensaje: `El tag \`${valor}\` está reservado y no se usa.` };
    });
  }
  ```

  Actualizar imports (sacar `tagReservado` si queda sin uso) y el mensaje de
  `frontmatter-ilegible`: «…ni ítems de una lista (`tags`, `tags_especiales`).»

- [ ] **Paso 4:** `npx vitest run tests/validar.test.ts` → verde.

---

### Tarea 6: conversión, pegar y link

**Archivos:**
- Modificar: `src/conversion.ts`, `src/link-receta.ts`
- Tests: `tests/conversion.test.ts`, el test del link (`tests/link-receta*.test.ts`
  o donde se pruebe `link-receta`)

**Consume:** `CLAVES_FRONTMATTER` (Tarea 2), `conEspecial`, `TAGS_RESERVADOS`,
`TAGS_ESPECIALES` (Tarea 3).

**Produce:**

```ts
export function reglasDelFormato(opciones?: { especiales?: boolean }): string[];
export const reglaDeReservados: (tags: readonly string[]) => string; // sin cambios
```

- [ ] **Paso 1: tests que fallan** en `tests/conversion.test.ts`:

  ```ts
  it('las reglas del frontmatter salen de la declaración de claves', () => {
    const [claves] = reglasDelFormato();
    expect(claves).toContain('`titulo` (obligatoria), `tags` como lista `[a, b]`, `rinde`');
    expect(claves).not.toContain('tags_especiales');
    expect(reglasDelFormato({ especiales: true })[0]).toContain('`tags_especiales` como lista `[a, b]`');
  });

  it('el pedido no menciona tags_especiales', () => {
    expect(pedidoDeConversion(datosDePrueba)).not.toContain('tags_especiales');
  });

  it('pegar conserva los especiales del editor y resuelve borrador por categoría', () => {
    const actual = recetaFalsa({ tags_especiales: ['favorito', 'borrador'] });
    const pegada = recetaFalsa({ titulo: 'Y', tags_especiales: ['probar'] });
    expect(aplicarPegada(actual, pegada, 'carpeta-1').tags_especiales).toEqual(['favorito']);
    expect(aplicarPegada(actual, pegada, '').tags_especiales).toEqual(['favorito', 'borrador']);
  });
  ```

  (`datosDePrueba`: el que ya use el archivo para `pedidoDeConversion`.)

  En el test del link: una receta con `tags_especiales: ['favorito']` produce
  un link cuyo `.md` decodificado no contiene `tags_especiales`.

- [ ] **Paso 2:** correrlos y ver que fallan.

- [ ] **Paso 3: implementar.**
  - La regla de las claves se arma desde `CLAVES_FRONTMATTER`:
    ```ts
    const descripcionDeClave = (c: ClaveFrontmatter, forma: 'texto' | 'lista'): string =>
      c === 'titulo' ? '`titulo` (obligatoria)' : forma === 'lista' ? `\`${c}\` como lista \`[a, b]\`` : `\`${c}\``;

    function reglaDeClaves(especiales: boolean): string {
      const claves = CLAVES_FRONTMATTER.filter(c => especiales || c.clave !== 'tags_especiales');
      return `- Frontmatter entre \`---\`, con estas claves y ninguna otra: ${claves.map(c => descripcionDeClave(c.clave, c.forma)).join(', ')}.`;
    }
    ```
    `REGLAS_DEL_FRONTMATTER` pasa a ser una función
    `reglasDelFrontmatter(especiales: boolean)` que devuelve
    `[reglaDeClaves(especiales), <tiempo>, <dificultad>, reglaDeReservados(TAGS_RESERVADOS),
    ...(especiales ? [\`- \\\`tags_especiales\\\` acepta sólo: ${lista(TAGS_ESPECIALES)}.\`] : [])]`.
  - `reglasDelFormato({ especiales = false } = {})` usa
    `reglasDelFrontmatter(especiales)`. `pedidoDeConversion` usa
    `reglasDelFrontmatter(false)`.
  - `aplicarPegada`:
    ```ts
    const propios = conEspecial(actual.tags_especiales, 'borrador', carpeta === '');
    return { ...pegada, fotos: actual.fotos, foto: pegada.foto ?? actual.foto, tags_especiales: propios };
    ```
    Reescribir su comentario: los especiales son del usuario y no de lo
    pegado; `borrador` queda sólo si no hay categoría.
  - `link-receta.ts:35`: `serialize({ ...sinFotosDeDrive(receta), tags: [], tags_especiales: [], extras: {} })`.

- [ ] **Paso 4:** `npx vitest run tests/conversion.test.ts` y el del link → verde.

---

### Tarea 7: la UI

**Archivos:**
- Modificar: `src/ui/componentes.ts`, `src/ui/receta.ts`, `src/ui/editor.ts`,
  `src/main.ts`
- Tests: `tests/componentes.test.ts`, `tests/tarjeta-favorita.test.ts`,
  `tests/vista-receta.test.ts`, `tests/vista-editor.test.ts`,
  `tests/vista-tag.test.ts`, `tests/vista-recetario.test.ts`,
  `tests/vista-plan*.test.ts`, `tests/lista-*.test.ts`,
  `tests/main-rutas.test.ts`, `tests/main-nueva-receta.test.ts`,
  `tests/router.test.ts`, `tests/navegacion.test.ts`, `tests/vista-ajustes.test.ts`,
  `tests/vista-invitado.test.ts`, `tests/invitado.test.ts`

**Consume:** `ESPECIALES`, `definicion`, `tagEspecial`, `tieneEspecial`,
`conEspecial`, `esFavorita` (Tareas 1 y 3); `ICO` de `iconos.ts`.

- [ ] **Paso 1: tests que fallan.**

  `tests/componentes.test.ts`:
  ```ts
  it('la tarjeta marca los especiales con enReceta, en orden, con su etiqueta', () => {
    const html = tarjeta(entradaFalsa({ titulo: 'X', tags_especiales: ['probar', 'favorito', 'borrador'] }));
    const etiquetas = [...html.matchAll(/aria-label="([^"]+)"/g)].map(m => m[1]);
    expect(etiquetas).toEqual(['Favorita', 'Para probar']);
  });

  it('chipsSueltos: especiales con enReceta, después los comunes', () => {
    const html = chipsSueltos(['horno'], ['probar', 'borrador']);
    expect(html.indexOf('probar')).toBeLessThan(html.indexOf('horno'));
    expect(html).not.toContain('borrador');
  });
  ```

  `tests/vista-editor.test.ts`:
  ```ts
  it('los especiales viajan en su propio hidden', () => {
    const html = renderEditor({ receta: recetaFalsa({ titulo: 'X', tags: ['horno'], tags_especiales: ['favorito'] }), entrada: null });
    expect(html).toContain('name="tags" value="horno"');
    expect(html).toContain('name="tags_especiales" value="favorito"');
  });

  it('recetaDesdeFormulario lee las dos listas', () => {
    const r = recetaDesdeFormulario({ tags: 'horno', tags_especiales: 'favorito, pan' }, recetaFalsa());
    expect(r.tags).toEqual(['horno']);
    expect(r.tags_especiales).toEqual(['favorito']);
  });
  ```

  `tests/vista-receta.test.ts`: con `tags_especiales: ['favorito', 'probar']`
  y `tags: ['horno']`, la receta muestra el chip `probar` y el chip `horno`,
  no un chip `favorito`, y la estrella está `aria-pressed="true"`.

- [ ] **Paso 2:** correrlos y ver que fallan.

- [ ] **Paso 3: `componentes.ts`.**
  - `iconoDeTag(tag)`:
    ```ts
    const esp = tagEspecial(tag);
    const icono = esp ? definicion(esp).icono : null;
    return icono ? ICO[icono] : '';
    ```
  - Tarjeta: borrar `ConMarca`, `NOMBRE_DE_MARCA` y `CON_MARCA`;
    ```ts
    const puestas = ESPECIALES.filter(d => d.enReceta && d.icono && e.tags_especiales.includes(d.nombre));
    // …cada marca: aria-label/title = d.etiquetaMarca, clase `favorita` si d.nombre === 'favorito', ícono ICO[d.icono]
    ```
  - `chipsSueltos(tags: string[], especiales: readonly TagEspecial[] = [])`:
    ```ts
    const propios = especiales.filter(t => definicion(t).enReceta);
    return [...propios, ...(Array.isArray(tags) ? tags : [])].map(tag => chipTag(tag, { quieto: true })).join('');
    ```
    Actualizar su comentario.
  - `carruselTags`: `especiales` sale de
    `ESPECIALES.filter(d => d.enChips).map(d => lista.find(x => x.tag === d.nombre))…`;
    los comunes, `lista.filter(x => !tagEspecial(x.tag))` (sin cambios).

- [ ] **Paso 4: `receta.ts`.**
  `const chips = chipsSueltos(receta.tags, receta.tags_especiales.filter(t => t !== 'favorito'));`
  El comentario de al lado se mantiene (favorito ya es la estrella).

- [ ] **Paso 5: `editor.ts`.**
  - `botonesEspeciales(especiales: readonly TagEspecial[], puedeTerminar)`
    recorre `ESPECIALES`, con `d.etiquetaEditor` e `iconoDeTag(d.nombre)`;
    `apretado = bloqueado || especiales.includes(d.nombre)`. El bloqueo sigue
    siendo sólo para `borrador` (es la regla de completitud, no de la tabla).
  - En `renderEditor`: `comunes = receta.tags`,
    `especiales = TAGS_ESPECIALES.filter(t => (t === 'borrador' && !puede) || receta.tags_especiales.includes(t))`.
    Los `hidden`:
    ```ts
    `<input type="hidden" name="tags" value="${escapar(comunes.join(', '))}">` +
    `<input type="hidden" name="tags_especiales" value="${escapar(especiales.join(', '))}">`
    ```
    Convertir con Agente sigue mirando `especiales.includes('borrador')`.
  - `formularioDesde`: sumar `tags_especiales: receta.tags_especiales.join(', ')`.
  - `recetaDesdeFormulario`: sumar
    ```ts
    tags_especiales: especialesValidos(String(datos['tags_especiales'] ?? '').split(',').map(t => t.trim()).filter(Boolean)).validos,
    ```
    y `tags` filtra `!tagReservado(t)`.

- [ ] **Paso 6: `main.ts`.**
  - `sincronizarTags`: escribe los dos `hidden` por separado:
    `input[name="tags_especiales"]` con los botones apretados, `input[name="tags"]`
    con las pills. Actualizar su comentario.
  - Nueva receta (≈ línea 1059):
    `receta.tags_especiales = conEspecial(receta.tags_especiales, 'borrador', true);`
  - `favorito` (≈ línea 1716):
    `{ ...actual, tags_especiales: conEspecial(actual.tags_especiales, 'favorito', !esFavorita(actual)) }`.
  - `tieneEspecial(escrita, 'borrador')` (≈ línea 1482) ya funciona.
  - `store.buscar({ tags: ['borrador'] })` y `['menú diario']` no cambian.

- [ ] **Paso 7:** correr los tests de la lista de archivos. Ajustar fixtures:
  todo especial puesto en `tags` de una `entradaFalsa`, `recetaFalsa` o `.md`
  de prueba pasa a `tags_especiales`. Un test que verificaba una forma
  alternativa (`incompleta` como borrador, `favoritas` como favorito) se
  borra. Verde.

---

### Tarea 8: MCP y skill

**Archivos:**
- Modificar: `mcp/recetario.ts`, `mcp/servidor.ts`, `skills/recetario/SKILL.md`
- Tests: `tests/mcp-lectura.test.ts`, `tests/mcp-fotos.test.ts`,
  `tests/mcp-fotos-pedidas.test.ts` y los `tests/mcp-*.test.ts` que fallen

**Consume:** `reglasDelFormato({ especiales: true })` (Tarea 6), `tieneEspecial`.

- [ ] **Paso 1: tests que fallan** en `tests/mcp-lectura.test.ts` (o donde se
  pruebe `formato`):

  ```ts
  it('formato lista tags_especiales y la regla de borrador la nombra', async () => {
    const reglas = (await recetario.formato()).join('\n');
    expect(reglas).toContain('`tags_especiales` como lista');
    expect(reglas).toContain('`tags_especiales` acepta sólo: `favorito`, `menú diario`, `probar`, `borrador`.');
    expect(reglas).toMatch(/`borrador` va en `tags_especiales` cuando/);
    expect(reglas).toContain('`borradores`'); // los reservados en tags, sin excepción
  });

  it('crear rechaza un especial en tags', async () => {
    const r = await recetario.crear({ md: '---\ntitulo: X\ntags: [borrador]\n---\n', /* … */ });
    // espera el error de validar y que no se haya escrito nada
  });
  ```

  (Adaptar a cómo el archivo llama a las herramientas y lee la respuesta.)

- [ ] **Paso 2:** correrlos y ver que fallan.

- [ ] **Paso 3: implementar.**
  - `mcp/recetario.ts`: borrar `REGLA_RESERVADOS` (la excepción de
    `borrador`); `REGLA_BORRADOR` pasa a:
    `'- \`borrador\` va en \`tags_especiales\` cuando algo de la fuente quedó sin volcar a la receta (un renglón ilegible, la receta sigue en otra página, una cantidad dudosa), o cuando faltan los ingredientes o los pasos. Si no, no va.'`
    `reglasDelFormatoDelMcp()` pasa a
    `[...reglasDelFormato({ especiales: true }), REGLA_BORRADOR, ...REGLAS_FOTOS]`.
    Actualizar los comentarios que hablaban del reemplazo de la línea.
  - `conBorrador: tieneEspecial(recibida, 'borrador')` ya mira la clave nueva
    por la firma; revisar que `recibida` sea una `Receta`.
  - `buscarEnIndice`: `pideBorradores` usa `tagEspecial(t) === 'borrador'`;
    sigue igual.
  - `mcp/servidor.ts`: la descripción de `formato` dice «tags reservados y
    especiales»; la de `fuente` (línea 53) y la de `buscar`/`categoria`
    (líneas 78 y 81) dicen «`borrador` en `tags_especiales`» en lugar de «el
    tag `borrador`».
  - `skills/recetario/SKILL.md`: cada «el tag `borrador`» / «lleva
    `borrador`» pasa a «`borrador` en `tags_especiales`». En la tabla de
    herramientas, `buscar`: «Los borradores aparecen sólo pidiendo el tag
    `borrador`» queda (el filtro es por nombre). En *Ordenar el recetario*,
    agregar: «Los especiales (`tags_especiales`) no se unifican ni se tocan
    salvo que el usuario lo pida.»

- [ ] **Paso 4:** `npx vitest run tests/mcp-*.test.ts` → verde. Ajustar
  fixtures con especiales en `tags`.

---

### Tarea 9: documentos

**Archivos:**
- Modificar: `CLAUDE.md`, `product-design/product/specs/E05-Cimientos.md`
  (C05.1.4 y §Reglas), `E01-CapturaYBorradores.md`, `E02-Encontrar.md`,
  `E03-LeerYCocinar.md`, `E04-Corregir.md`, `E06-Planificar.md`,
  `product-design/ux/information-architecture.md`, `user-flows.md`,
  `design-system.md`, `brand-identity.md`
- No tocar: `product-design/ux/mockups/`, `wireframes.md`, `research/`,
  `strategy/` (salvo que definan el formato del `.md`).

- [ ] **Paso 1: `CLAUDE.md`.**
  - «El frontmatter es cerrado, siete claves» → ocho, sumando
    `tags_especiales`.
  - «Cuatro tags especiales» se reescribe: viven en `tags_especiales`, una
    lista cerrada (`favorito`, `menú diario`, `probar`, `borrador`); `tags` no
    los lleva; cada uno se declara en la tabla de `src/especiales.ts` (ícono,
    marca, chips, receta, búsqueda). Sin formas alternativas ni `incompleta`.
  - «Un borrador es una receta con el tag `borrador`» → «con `borrador` en
    `tags_especiales`»; `store.tagsDe` lo deja afuera por su definición.
  - Tabla «Dónde está cada cosa», fila Dominio: sumar `especiales.ts` y
    `normalizar.ts`.
  - La línea de «No proponer» sobre claves nuevas queda como está.

- [ ] **Paso 2: E05 C05.1.4** — reemplazar los criterios por:
  - [ ] Cuatro especiales —`favorito`, `menú diario`, `probar` y `borrador`— viven en la clave `tags_especiales`, en ese orden en cualquier fila de tags y antes que los demás.
  - [ ] `tags_especiales` es una lista cerrada: se reconoce sin mirar mayúsculas ni tildes, se escribe en la forma canónica, y un valor que no es de la lista se lee como ausente.
  - [ ] `tags` no lleva especiales: un reservado en `tags` —un especial, `favoritas`, `borradores`, `incompleta` y sus formas, `terminado` y sus formas— se ignora al leer.
  - [ ] Ninguno se escribe a mano en el campo de tags: cada especial tiene su botón en el editor (`E04-Corregir.md`).
  - [ ] El índice tiene una columna `tags_especiales`.
  - [ ] Cada especial declara su ícono, su marca en la tarjeta, si se ofrece en los chips, si se muestra en la receta y si lo encuentra la búsqueda por texto; ninguno lo encuentra.

  Buscar en E05 las menciones al frontmatter de «siete claves» y
  actualizarlas.

- [ ] **Paso 3: el resto de `product-design/`.** `grep -rn "incomplet\|forma alternativa\|formas alternativas\|valores de .tags.\|tag .borrador." product-design --exclude-dir=mockups`
  y reescribir cada mención que trate a los especiales como valores de `tags`
  o a `incompleta` como `borrador`. En la IA, el párrafo «Cuatro tags son
  especiales» (≈ línea 640) sigue el texto de C05.1.4. En `user-flows.md`
  ≈ línea 555, «¿lleva el tag borrador, o incompleta?» → «¿lleva `borrador`
  en `tags_especiales`?». En `brand-identity.md` ≈ línea 180, la fila de
  vocabulario queda (dice qué palabra *no* usar), revisar sólo que no diga que
  `incompleta` se lee como borrador.

- [ ] **Paso 4:** `grep -rn "incomplet" src mcp skills tests CLAUDE.md` — sólo
  pueden quedar las `reservadas` de `especiales.ts`, sus tests y los textos
  que no hablan del tag (p. ej. «Este link está roto o incompleto»).

---

### Tarea 10: verificación y revisión

- [ ] **Paso 1:** `npm test` → todo verde. Si falla algo, corregirlo en la
  tarea que corresponde.
- [ ] **Paso 2:** `npm run typecheck` → sin errores (corre las tres configs).
- [ ] **Paso 3:** `npm run build` → sin errores.
- [ ] **Paso 4:** `grep -rn "FORMAS_ALTERNATIVAS\|ordenarTags\|NOMBRE_DE_MARCA\|CON_MARCA\|REGLA_RESERVADOS" src mcp tests` → vacío.
- [ ] **Paso 5:** mostrar al usuario `git diff --stat` y el diff, y esperar su
  visto bueno antes de commitear. Recordarle el orden: migrar los `.md` antes
  de abrir la app nueva (reindexa sola por `SCHEMA_VERSION = 8`) o reindexar a
  mano después de migrar.
- [ ] **Paso 6 (con el visto bueno):** commitear, marcar P108 en el backlog
  como terminada (se borra la fila) y P106 vuelve a `Abierto`. Borrar el spec y
  el plan de `docs/superpowers/` en el commit de cierre, una vez que lo
  decidido esté en `product-design/` y `CLAUDE.md`.
