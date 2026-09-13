# Índice local — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Objetivo:** que abrir la app no lea Sheets cuando la planilla `_indice` no cambió desde la última vez, guardando una copia del índice en `localStorage` y verificándola por el `modifiedTime` de `_indice` (P12).

**Arquitectura:** un módulo nuevo, `src/indice-local.ts`, sólo lee, guarda y borra la copia. `src/store.ts` decide: al arrancar compara la copia contra la búsqueda de `_indice` que ya hace, y la usa si coincide; después de cada escritura en `_indice` pide la metadata y vuelve a guardar la copia (un único paso, `persistir()`). `main.ts` pasa el módulo al store, lo borra en *Salir*, y le lleva a Ajustes el aviso de la planilla duplicada.

**Stack:** TypeScript estricto + Vite, sin framework. Tests con Vitest en `environment: 'node'`, con dobles escritos a mano (`tests/dobles.ts`, `tests/dom-falso.ts`).

**Spec:** `docs/superpowers/specs/2026-09-13-indice-local-design.md` — leerlo antes de empezar. Este plan argumenta desde ahí.

## Restricciones globales

- **Premisa:** nunca hay escritura concurrente. No se agrega nada para dos pestañas, dos dispositivos o el agente escribiendo a la vez (spec §1).
- **Idioma:** todo en español rioplatense: comentarios, nombres, textos de UI y mensajes de commit.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess` (sólo en `src`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Los imports de tipos van con `import type`. Los imports internos llevan extensión `.js`.
- **Clave de `localStorage`:** `recetario-indice`, una sola, en JSON.
- **La copia nunca es imprescindible:** cualquier duda termina en bajar la planilla. La copia nunca queda más nueva que la planilla.
- **Sin red no se dibuja con la copia:** la búsqueda en Drive va antes que la copia, y si falla se muestra el aviso de siempre.
- **Los dobles se declaran contra el tipo que el store consume**, con `satisfies`.
- **Verificación de cada tarea:** `npm test` y `npm run typecheck` en verde antes de commitear. Hoy hay 488 tests.
- **Se trabaja sobre `main`**, un commit por tarea, y al final se pushea: los cambios se prueban en el teléfono sobre GitHub Pages.
- **Commits:** terminan con la línea `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Mapa de archivos

| Archivo | Qué cambia |
|---|---|
| `src/indice-local.ts` | **Nuevo.** `CopiaIndice`, `IndiceLocal`, y `leer`/`guardar`/`borrar` sobre `localStorage`. |
| `src/store.ts` | Recibe `indiceLocal`. Guarda `meta` y `modifiedTime` en el contexto. Usa la copia al arrancar y al cargar; `persistir()` después de cada escritura. El resultado del arranque suma `indiceDuplicado`. |
| `src/main.ts` | Pasa `indiceLocal` al store; *Salir* borra la copia; Ajustes recibe `indiceDuplicado`. |
| `src/ui/ajustes.ts` | Dibuja el aviso de la planilla duplicada. |
| `tests/dom-falso.ts` | Suma `localStorageFalso`, que hoy vive dentro de `auth-persistencia.test.ts`. |
| `tests/dobles.ts` | Suma `indiceLocalFalso`; el Drive falso registra y puede hacer fallar `metadatos`. |
| `tests/indice-local.test.ts` | **Nuevo.** |
| `tests/store-indice-local.test.ts` | **Nuevo.** La copia al arrancar y después de escribir. |
| `tests/store-*.test.ts`, `tests/compartido.test.ts` | Pasan `indiceLocal: indiceLocalFalso()` a `crearStore`. |
| `tests/vista-ajustes.test.ts`, `tests/main-rutas.test.ts`, `tests/store-arranque.test.ts` | Casos nuevos del aviso y de *Salir*. |
| Documentos | `decision-log.md`, `E05-Cimientos.md`, `BACKLOG.md`, `CLAUDE.md`. |

---

### Tarea 1: `src/indice-local.ts`

**Archivos:**
- Crear: `src/indice-local.ts`
- Crear: `tests/indice-local.test.ts`
- Modificar: `tests/dom-falso.ts` (sumar `localStorageFalso`)
- Modificar: `tests/auth-persistencia.test.ts:7-19` (importar `localStorageFalso` en vez de declararlo)

**Interfaces:**
- Consume: `Entrada` de `src/tipos.ts`.
- Produce:
  - `export interface CopiaIndice { schemaVersion: number; indiceId: string; modifiedTime: string; meta: Record<string, string>; filas: { fila: number; entrada: Entrada }[] }`
  - `export interface IndiceLocal { leer(): CopiaIndice | null; guardar(copia: CopiaIndice): void; borrar(): void }`
  - `export function leer(): CopiaIndice | null`
  - `export function guardar(copia: CopiaIndice): void`
  - `export function borrar(): void`
  - En `tests/dom-falso.ts`: `export function localStorageFalso()` → `{ getItem, setItem, removeItem, _datos: Map<string, string> }`

- [ ] **Paso 1: mover `localStorageFalso` a `tests/dom-falso.ts`**

Agregar al final de `tests/dom-falso.ts`:

```ts
/**
 * `localStorage` en memoria. Node no lo tiene, y los módulos que lo usan lo
 * envuelven en `try/catch`: sin este doble, los tests sólo verían el camino
 * de la falla.
 */
export function localStorageFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => (datos.has(k) ? datos.get(k)! : null),
    setItem: (k: string, v: unknown) => { datos.set(k, String(v)); },
    removeItem: (k: string) => { datos.delete(k); },
    _datos: datos
  };
}
```

En `tests/auth-persistencia.test.ts`, borrar la función `localStorageFalso` (líneas 11-19) y cambiar el import de la línea 9 por:

```ts
import { comoGlobal, windowConGis, localStorageFalso } from './dom-falso.js';
```

Correr: `npx vitest run tests/auth-persistencia.test.ts`
Esperado: PASS, 5 tests.

- [ ] **Paso 2: escribir el test que falla**

Crear `tests/indice-local.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { leer, guardar, borrar } from '../src/indice-local.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { comoGlobal, localStorageFalso } from './dom-falso.js';
import { entradaFalsa } from './dobles.js';

const copia: CopiaIndice = {
  schemaVersion: 3,
  indiceId: 'i1',
  modifiedTime: '2026-09-13T10:00:00.000Z',
  meta: { schemaVersion: '3', ultima_reconstruccion: '2026-09-12T10:00:00.000Z' },
  filas: [{ fila: 2, entrada: entradaFalsa({ id_archivo: 'r1', titulo: 'Milanesas', tags: ['horno'], mtime: 1000 }) }]
};

describe('indice-local: la copia del índice en el navegador', () => {
  afterEach(() => { delete (global as unknown as Record<string, unknown>)['localStorage']; });

  it('lo guardado se lee igual', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    guardar(copia);
    expect(leer()).toEqual(copia);
  });

  it('vive en una sola clave, recetario-indice', () => {
    const ls = localStorageFalso();
    global.localStorage = comoGlobal<Storage>(ls);
    guardar(copia);
    expect([...ls._datos.keys()]).toEqual(['recetario-indice']);
  });

  it('sin nada guardado no hay copia', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    expect(leer()).toBeNull();
  });

  it('borrar la saca', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    guardar(copia);
    borrar();
    expect(leer()).toBeNull();
  });

  it('un JSON roto se lee como que no hay copia', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-indice', '{roto');
    expect(leer()).toBeNull();
  });

  it('un JSON sin la forma de la copia también', () => {
    global.localStorage = comoGlobal<Storage>(localStorageFalso());
    global.localStorage.setItem('recetario-indice', JSON.stringify({ indiceId: 'i1' }));
    expect(leer()).toBeNull();
  });

  it('un localStorage que tira se lee como que no hay copia, y guardar y borrar no tiran', () => {
    const tira = () => { throw new Error('bloqueado'); };
    global.localStorage = comoGlobal<Storage>({ getItem: tira, setItem: tira, removeItem: tira });
    expect(leer()).toBeNull();
    expect(() => guardar(copia)).not.toThrow();
    expect(() => borrar()).not.toThrow();
  });

  it('sin localStorage en absoluto tampoco rompe', () => {
    expect(leer()).toBeNull();
    expect(() => guardar(copia)).not.toThrow();
    expect(() => borrar()).not.toThrow();
  });

  it('si guardar falla, no queda la copia anterior', () => {
    // Lleno, por ejemplo: la copia vieja quedaría con datos de antes de la
    // escritura que no se pudo guardar.
    const ls = localStorageFalso();
    global.localStorage = comoGlobal<Storage>(ls);
    guardar(copia);
    ls.setItem = () => { throw new Error('lleno'); };
    guardar({ ...copia, modifiedTime: '2026-09-13T11:00:00.000Z' });
    expect(leer()).toBeNull();
  });
});
```

- [ ] **Paso 3: correrlo y ver que falla**

Correr: `npx vitest run tests/indice-local.test.ts`
Esperado: FAIL, no resuelve `../src/indice-local.js`.

- [ ] **Paso 4: implementar**

Crear `src/indice-local.ts`:

```ts
/**
 * La copia local del índice (P12): «la planilla `_indice` tal como la vi por
 * última vez». Este módulo sólo la lee, la guarda y la borra; cuándo usarla lo
 * decide el store.
 *
 * Cualquier falla de `localStorage` —navegación privada, almacenamiento lleno o
 * bloqueado, JSON roto— se lee como «no hay copia». La copia nunca es
 * imprescindible: sin ella, la app baja la planilla.
 */
import type { Entrada } from './tipos.js';

const CLAVE_STORAGE = 'recetario-indice';

export interface CopiaIndice {
  /** El SCHEMA_VERSION del código que escribió la copia. */
  schemaVersion: number;
  /** Qué planilla es. */
  indiceId: string;
  /** El modifiedTime de `_indice` en Drive cuando se guardó la copia. */
  modifiedTime: string;
  /** La hoja `meta`: schemaVersion, ultima_reconstruccion, reconstruccion_en_curso. */
  meta: Record<string, string>;
  /**
   * La hoja `recetas`: cada entrada con su número de fila. Va explícito porque
   * el orden en memoria no es el de la planilla: guardar reubica la entrada al
   * final de la lista, y en la planilla queda en su lugar.
   */
  filas: { fila: number; entrada: Entrada }[];
}

/** Lo que el store usa. `main` le pasa este módulo entero; los tests, un doble. */
export interface IndiceLocal {
  leer(): CopiaIndice | null;
  guardar(copia: CopiaIndice): void;
  borrar(): void;
}

export function leer(): CopiaIndice | null {
  try {
    const crudo = localStorage.getItem(CLAVE_STORAGE);
    if (!crudo) return null;
    const copia: unknown = JSON.parse(crudo);
    return esCopia(copia) ? copia : null;
  } catch {
    return null;
  }
}

export function guardar(copia: CopiaIndice): void {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(copia));
  } catch {
    // Lleno o inaccesible: que no quede la anterior, que ya no es la planilla.
    borrar();
  }
}

export function borrar(): void {
  try { localStorage.removeItem(CLAVE_STORAGE); } catch { /* nada que borrar o storage inaccesible */ }
}

/** La forma, no cada entrada: el contenido lo escribió este mismo código. */
function esCopia(c: unknown): c is CopiaIndice {
  if (!c || typeof c !== 'object') return false;
  const x = c as Record<string, unknown>;
  return typeof x['schemaVersion'] === 'number'
    && typeof x['indiceId'] === 'string'
    && typeof x['modifiedTime'] === 'string'
    && !!x['meta'] && typeof x['meta'] === 'object'
    && Array.isArray(x['filas']);
}
```

- [ ] **Paso 5: correr los tests**

Correr: `npx vitest run tests/indice-local.test.ts tests/auth-persistencia.test.ts`
Esperado: PASS.

Correr: `npm test && npm run typecheck`
Esperado: todo en verde (497 tests).

- [ ] **Paso 6: commit**

```bash
git add src/indice-local.ts tests/indice-local.test.ts tests/dom-falso.ts tests/auth-persistencia.test.ts
git commit -m "$(cat <<'EOF'
La copia local del índice: leer, guardar y borrar

Una clave de localStorage, recetario-indice. Cualquier falla del
almacenamiento se lee como que no hay copia (P12).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 2: el store usa la copia al arrancar

**Archivos:**
- Modificar: `src/store.ts` (tipos de dependencias, `Contexto`, `arrancar`, `crearPlanilla`, `guardarMeta`, `ultimaReconstruccion`, `cargarIndice`, `reconstruir`)
- Modificar: `src/main.ts:1-6` y `src/main.ts:237` (pasar `indiceLocal`)
- Modificar: `tests/dobles.ts` (sumar `indiceLocalFalso`; `metadatos` registra y puede fallar)
- Modificar: cada `crearStore({ drive, sheets })` de `tests/store-busqueda.test.ts:32`, `tests/store-escritura.test.ts:15,29,39,66,85,111`, `tests/store-arranque.test.ts:27,89`, `tests/compartido.test.ts:31`, `tests/store-reconstruccion.test.ts:32`
- Crear: `tests/store-indice-local.test.ts`

**Interfaces:**
- Consume: `CopiaIndice`, `IndiceLocal` de la Tarea 1.
- Produce:
  - `Dependencias` pasa a ser `{ drive: DriveDelStore; sheets: SheetsDelStore; indiceLocal: IndiceLocal }`.
  - `DriveDelStore` suma `'metadatos'`.
  - En `tests/dobles.ts`: `export function indiceLocalFalso(inicial?: CopiaIndice | null)` → `{ guardadas: CopiaIndice[]; borradas: number; actual(): CopiaIndice | null; leer; guardar; borrar }`, y `export type IndiceLocalFalso`.
  - En `store.ts`, internas y usadas por la Tarea 3: `ctx.meta: Record<string, string>`, `ctx.modifiedTime: string`, `copiaActual(): CopiaIndice`.

- [ ] **Paso 1: el doble de la copia y `metadatos` en el Drive falso**

En `tests/dobles.ts`, sumar al import de la línea 5 y agregar uno nuevo:

```ts
import type { DriveDelStore, SheetsDelStore } from '../src/store.js';
import type { CopiaIndice, IndiceLocal } from '../src/indice-local.js';
```

Reemplazar `metadatos` del Drive falso (líneas 54-60) por:

```ts
    // El real siempre devuelve un archivo o tira; pedir metadatos de un id que
    // no existe es un error del test, no un caso a tolerar en silencio.
    async metadatos(id: string) {
      api.llamadas.push(['metadatos', id]);
      if (fallas.has('metadatos')) throw fallas.get('metadatos');
      const a = store.get(id);
      if (!a) throw new Error(`El doble de Drive no tiene el archivo ${id}`);
      return a;
    },
```

Agregar antes de `export const COLUMNAS_ESPERADAS`:

```ts
/**
 * La copia local del índice, en memoria. Clona al guardar y al leer, como el
 * JSON de `localStorage`: sin eso el store y la copia compartirían objetos, y
 * un test podría pasar gracias a un alias que en el navegador no existe.
 */
export function indiceLocalFalso(inicial: CopiaIndice | null = null) {
  let copia: CopiaIndice | null = inicial ? structuredClone(inicial) : null;
  const api = {
    /** Cada copia que el store guardó, en orden. */
    guardadas: [] as CopiaIndice[],
    /** Cuántas veces se pidió borrarla. */
    borradas: 0,
    /** Lo que hay guardado ahora, para las aserciones. */
    actual: (): CopiaIndice | null => copia,
    leer: (): CopiaIndice | null => (copia ? structuredClone(copia) : null),
    guardar: (c: CopiaIndice): void => {
      copia = structuredClone(c);
      api.guardadas.push(structuredClone(c));
    },
    borrar: (): void => { copia = null; api.borradas++; }
  } satisfies IndiceLocal & Record<string, unknown>;
  return api;
}
```

Y junto a los otros tipos de dobles:

```ts
export type IndiceLocalFalso = ReturnType<typeof indiceLocalFalso>;
```

- [ ] **Paso 2: pasar `indiceLocal` en cada `crearStore` de los tests**

En cada archivo de la lista, sumar `indiceLocalFalso` al import de `./dobles.js` y agregar `indiceLocal: indiceLocalFalso()` al objeto. Por ejemplo, `tests/store-escritura.test.ts:15`:

```ts
    const store = crearStore({ drive: driveFalso([{ id: 'f1' }]), sheets, indiceLocal: indiceLocalFalso() });
```

y `tests/store-arranque.test.ts:25-28`:

```ts
const armar = (drive: DriveFalso) => {
  const sheets = sheetsFalso();
  const indiceLocal = indiceLocalFalso();
  return { store: crearStore({ drive, sheets, indiceLocal }), sheets, drive, indiceLocal };
};
```

`tests/store-arranque.test.ts:89`:

```ts
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
```

`tests/store-busqueda.test.ts:32`, `tests/store-escritura.test.ts:29,39,66,85,111`, `tests/compartido.test.ts:31` y `tests/store-reconstruccion.test.ts:32`, igual: sumar `, indiceLocal: indiceLocalFalso()` dentro de las llaves.

Hasta el Paso 5 el typecheck marca la clave `indiceLocal` como desconocida: seguir sin correr nada.

- [ ] **Paso 3: escribir los tests que fallan**

Crear `tests/store-indice-local.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS, entradaDesdeFila } from '../src/catalogo.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import { arranqueListo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
/** El modifiedTime de `_indice` que devuelve la búsqueda al arrancar. */
const FECHA = '2026-09-13T10:00:00.000Z';

const fila = (id: string, titulo: string): string[] =>
  [id, `${id}.md`, titulo, 'Carnes', 'c1', '', '', '', '', '', '', '1000'];

/**
 * Un Recetario con una categoría, `_indice` con dos recetas, y el `.md` de la
 * primera. Cuenta las lecturas de Sheets por rango: que no haya ninguna es lo
 * que se quiere probar cuando la copia sirve.
 */
async function armar({
  copia = null as CopiaIndice | null,
  meta = [['schemaVersion', String(SCHEMA_VERSION)]] as string[][]
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    { id: 'r1', name: 'r1.md', parents: ['c1'], contenido: '---\ntitulo: Milanesas\n---\n' }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1');
  sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r1', 'Milanesas'), fila('r2', 'Bife')]);
  sheets.cargar('i1', 'meta', meta);
  const lecturas: string[] = [];
  const leer = sheets.leer.bind(sheets);
  sheets.leer = async (id: string, rango: string) => { lecturas.push(rango); return leer(id, rango); };
  const indiceLocal = indiceLocalFalso(copia);
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store, lecturas };
}

/** Una copia que coincide con la planilla de `armar`, salvo lo que se cambie. */
const copiaVigente = (cambios: Partial<CopiaIndice> = {}): CopiaIndice => ({
  schemaVersion: SCHEMA_VERSION,
  indiceId: 'i1',
  modifiedTime: FECHA,
  meta: { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '2026-09-12T10:00:00.000Z' },
  // Fuera de orden a propósito: al usarla se ordena por número de fila.
  filas: [
    { fila: 3, entrada: entradaDesdeFila(fila('r2', 'Bife')) },
    { fila: 2, entrada: entradaDesdeFila(fila('r1', 'Milanesas de la copia')) }
  ],
  ...cambios
});

describe('al abrir, con la copia local del índice', () => {
  it('si la copia sirve, no lee Sheets y usa sus filas y su meta', async () => {
    const { store, lecturas } = await armar({ copia: copiaVigente() });
    const r = arranqueListo(await store.arrancar());
    await store.cargarIndice();

    expect(lecturas).toEqual([]);
    expect(store.entradas().map(e => e.titulo)).toEqual(['Milanesas de la copia', 'Bife']);
    expect(store.ultimaReconstruccion()).toBe('2026-09-12T10:00:00.000Z');
    expect(r.reconstruir).toBe(false);
  });

  const casos: [string, CopiaIndice | null][] = [
    ['sin copia', null],
    ['con otra fecha', copiaVigente({ modifiedTime: '2026-09-01T00:00:00.000Z' })],
    ['de otra planilla', copiaVigente({ indiceId: 'otra' })],
    ['de otra versión del esquema', copiaVigente({ schemaVersion: SCHEMA_VERSION - 1 })]
  ];

  it.each(casos)('%s, lee meta y recetas y guarda una copia con la fecha de la búsqueda', async (_caso, copia) => {
    const { store, lecturas, indiceLocal } = await armar({ copia });
    await store.arrancar();
    await store.cargarIndice();

    expect(lecturas.some(r => r.startsWith('meta!'))).toBe(true);
    expect(lecturas.some(r => r.startsWith('recetas!'))).toBe(true);
    expect(store.entradas().map(e => e.titulo)).toEqual(['Milanesas', 'Bife']);

    const guardada = indiceLocal.actual();
    expect(guardada?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(guardada?.indiceId).toBe('i1');
    expect(guardada?.modifiedTime).toBe(FECHA);
    expect(guardada?.meta['schemaVersion']).toBe(String(SCHEMA_VERSION));
    expect(guardada?.filas).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'r1', titulo: 'Milanesas' }) },
      { fila: 3, entrada: expect.objectContaining({ id_archivo: 'r2', titulo: 'Bife' }) }
    ]);
  });

  it('la copia que guarda una apertura la usa la siguiente', async () => {
    const primera = await armar();
    await primera.store.arrancar();
    await primera.store.cargarIndice();

    const segunda = await armar({ copia: primera.indiceLocal.actual() });
    await segunda.store.arrancar();
    await segunda.store.cargarIndice();

    expect(segunda.lecturas).toEqual([]);
    expect(segunda.store.entradas()).toEqual(primera.store.entradas());
  });

  it('la decisión de reindexar usa la meta de la copia: reconstruccion_en_curso ahí pide reindexar', async () => {
    const copia = copiaVigente({ meta: { schemaVersion: String(SCHEMA_VERSION), reconstruccion_en_curso: 'si' } });
    const { store, lecturas } = await armar({ copia });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(true);
    expect(lecturas).toEqual([]);
  });

  it('con la copia sirviendo, la meta de la planilla no se mira', async () => {
    const { store } = await armar({
      copia: copiaVigente(),
      meta: [['schemaVersion', String(SCHEMA_VERSION)], ['reconstruccion_en_curso', 'si']]
    });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(false);
  });

  it('con la planilla recién creada, cargar no guarda copia: la guarda el reindexado', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] }
    ]);
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal });
    expect(arranqueListo(await store.arrancar()).reconstruir).toBe(true);
    await store.cargarIndice();
    expect(indiceLocal.guardadas).toEqual([]);
  });

  it('sin red no toca la copia', async () => {
    const { store, drive, indiceLocal } = await armar({ copia: copiaVigente() });
    drive.fallar('buscarPorNombre', new Error('sin red'));
    expect((await store.arrancar()).estado).toBe('solo-lectura');
    expect(indiceLocal.guardadas).toEqual([]);
    expect(indiceLocal.borradas).toBe(0);
  });
});
```

- [ ] **Paso 4: correrlos y ver que fallan**

Correr: `npx vitest run tests/store-indice-local.test.ts`
Esperado: FAIL. «si la copia sirve…» falla porque `lecturas` no está vacío, y los casos que guardan fallan porque `indiceLocal.actual()` es `null`.

- [ ] **Paso 5: implementar en `src/store.ts`**

Imports (arriba del archivo), sumar:

```ts
import type { CopiaIndice, IndiceLocal } from './indice-local.js';
```

`Contexto` (líneas 42-50) queda:

```ts
interface Contexto {
  raizId: string;
  indiceId: string;
  categorias: Categoria[];
  /** Id de carpeta → nombre de categoría. Incluye la raíz. */
  carpetas: Map<string, string>;
  soloLectura: boolean;
  /** La hoja `meta` como se vio por última vez, de la planilla o de la copia. */
  meta: Record<string, string>;
  /**
   * El modifiedTime de `_indice` que se vio por última vez: el de la búsqueda
   * al arrancar, o el que se pidió después de escribir. Vacío si no se sabe, y
   * entonces la copia no se usa ni se guarda.
   */
  modifiedTime: string;
}
```

`DriveDelStore` y `Dependencias` (líneas 64-75):

```ts
export type DriveDelStore = Pick<Drive,
  'buscarPorNombre' | 'listarCarpetas' | 'listarHijos' | 'leerTexto' | 'metadatos' |
  'crear' | 'actualizar' | 'renombrar' | 'mover' | 'borrar'>;

export type SheetsDelStore = Pick<Sheets,
  'leer' | 'escribir' | 'append' | 'agregarHoja' | 'borrarFila' | 'borrarFilas' |
  'hojas' | 'renombrarHoja'>;

export interface Dependencias {
  drive: DriveDelStore;
  sheets: SheetsDelStore;
  /** La copia local del índice (P12). `main` pasa `indice-local.ts`; los tests, un doble. */
  indiceLocal: IndiceLocal;
}
```

Principio de `crearStore` (líneas 77-83):

```ts
export function crearStore({ drive, sheets, indiceLocal }: Dependencias) {
  const ctx: Contexto = {
    raizId: '', indiceId: '', categorias: [], carpetas: new Map(),
    soloLectura: false, meta: {}, modifiedTime: ''
  };
  let entradas: Entrada[] = [];
  let filas = new Map<string, number>();
```

Después de `leerMeta`, agregar las tres funciones de la copia:

```ts
  /**
   * La copia local, si es de esta planilla, la escribió este código y Drive
   * tiene la misma fecha que ella. Se compara metadata, nunca contenido.
   */
  function copiaQueSirve(): CopiaIndice | null {
    if (!ctx.modifiedTime) return null;
    const copia = indiceLocal.leer();
    if (!copia) return null;
    const sirve = copia.schemaVersion === SCHEMA_VERSION
      && copia.indiceId === ctx.indiceId
      && copia.modifiedTime === ctx.modifiedTime;
    return sirve ? copia : null;
  }

  /** Lo que hay en memoria, con el número de fila que cada entrada tiene en la planilla. */
  function copiaActual(): CopiaIndice {
    return {
      schemaVersion: SCHEMA_VERSION,
      indiceId: ctx.indiceId,
      modifiedTime: ctx.modifiedTime,
      meta: { ...ctx.meta },
      filas: entradas.flatMap(entrada => {
        const nro = filas.get(entrada.id_archivo);
        return nro ? [{ fila: nro, entrada }] : [];
      })
    };
  }

  /** Carga la copia en memoria, en el orden de la planilla, como si se la hubiera leído. */
  function usarCopia(copia: CopiaIndice): void {
    const ordenadas = [...copia.filas].sort((a, b) => a.fila - b.fila);
    ctx.meta = { ...copia.meta };
    entradas = ordenadas.map(f => f.entrada);
    filas = new Map(ordenadas.map(f => [f.entrada.id_archivo, f.fila]));
  }
```

En `arrancar`, el bloque de las líneas 166-179 queda:

```ts
    let reconstruir = false;
    if (planillas.length === 0) {
      ctx.indiceId = await crearPlanilla();
      ctx.meta = { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '' };
      reconstruir = true;
    } else {
      if (planillas.length > 1) avisos.push('indice-duplicado');
      const ordenadas = [...planillas].sort(
        (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''));
      ctx.indiceId = ordenadas[0]?.id ?? '';
      // La búsqueda ya trae la fecha: esa es toda la verificación, sin pedidos nuevos.
      ctx.modifiedTime = ordenadas[0]?.modifiedTime ?? '';
      const copia = copiaQueSirve();
      if (copia) usarCopia(copia);
      else ctx.meta = await leerMeta();
      if (Number(ctx.meta['schemaVersion']) !== SCHEMA_VERSION) reconstruir = true;
      if (ctx.meta['reconstruccion_en_curso']) reconstruir = true;
    }
```

`ultimaReconstruccion` y `guardarMeta` (líneas 187-197):

```ts
  /** Cuándo se reconstruyó el índice por última vez, para Ajustes. Sin red: sale de la meta en memoria. */
  function ultimaReconstruccion(): string {
    return ctx.meta['ultima_reconstruccion'] ?? '';
  }

  async function guardarMeta(clave: string, valor: string): Promise<void> {
    const meta = await sheets.leer(ctx.indiceId, `${HOJA_META}!A1:B20`);
    const i = meta.findIndex(f => f[0] === clave);
    const fila = i >= 0 ? i + 1 : meta.length + 1;
    await sheets.escribir(ctx.indiceId, `${HOJA_META}!A${fila}:B${fila}`, [[clave, valor]]);
    ctx.meta[clave] = valor;
  }
```

`cargarIndice` (líneas 199-205):

```ts
  async function cargarIndice(): Promise<Entrada[]> {
    const copia = copiaQueSirve();
    if (copia) {
      usarCopia(copia);
      return entradas;
    }
    const crudo = await sheets.leer(ctx.indiceId, `${HOJA_RECETAS}!A1:${ULTIMA_COLUMNA}100000`);
    const cuerpo = crudo.slice(1);  // la fila 1 son los encabezados
    entradas = cuerpo.map(entradaDesdeFila).filter(e => e.id_archivo);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    // La fecha es la de la búsqueda de recién: nada escribió entre medio (§1 del
    // diseño). Sin fecha —la planilla recién creada— no se guarda: lo hace el
    // reindexado al terminar.
    if (ctx.modifiedTime) indiceLocal.guardar(copiaActual());
    return entradas;
  }
```

En `reconstruir`, borrar la línea 350 (`ctx.ultimaReconstruccionEnMemoria = ahora;`): `guardarMeta` ya deja la fecha en `ctx.meta`.

- [ ] **Paso 6: `main.ts` pasa la copia**

En `src/main.ts`, después de `import { crearStore } from './store.js';` (línea 6):

```ts
import * as indiceLocal from './indice-local.js';
```

Y la línea 237:

```ts
  store = crearStore({ drive, sheets, indiceLocal });
```

- [ ] **Paso 7: correr los tests**

Correr: `npx vitest run tests/store-indice-local.test.ts`
Esperado: PASS.

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 8: commit**

```bash
git add src/store.ts src/main.ts tests/dobles.ts tests/store-indice-local.test.ts tests/store-*.test.ts tests/compartido.test.ts
git commit -m "$(cat <<'EOF'
Al abrir, el índice sale de la copia local si _indice no cambió

La búsqueda de _indice ya trae su modifiedTime: si coincide con el de la
copia, y la copia es de esta planilla y de este esquema, no se lee Sheets.
Si no, se baja la planilla como antes y se guarda una copia nueva (P12).

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 3: cada escritura en `_indice` deja la copia al día

**Archivos:**
- Modificar: `src/store.ts` (`persistir` nueva; `escribirFila`, `borrarDelIndice`, `guardar`, `crear`, `reconstruir`)
- Modificar: `tests/store-indice-local.test.ts` (un `describe` nuevo)

**Interfaces:**
- Consume: `ctx.meta`, `ctx.modifiedTime`, `copiaActual()` de la Tarea 2; `drive.metadatos(id, campos)`.
- Produce: `escribirFila(receta, ubicacion)` pasa a actualizar también `entradas` en memoria (antes lo hacían `guardar` y `crear`); la firma no cambia.

- [ ] **Paso 1: escribir los tests que fallan**

Agregar al final de `tests/store-indice-local.test.ts`, y sumar `recetaFalsa` y el tipo `SheetsFalso` al import de `./dobles.js`:

```ts
import { driveFalso, sheetsFalso, indiceLocalFalso, recetaFalsa } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
```

```ts
/** La fecha que Drive le pone a `_indice` después de que la app escribe. */
const NUEVA = '2026-09-13T11:00:00.000Z';

/** La app abierta sin copia previa: ya bajó la planilla y guardó la primera copia. */
async function abierta() {
  const armado = await armar();
  await armado.store.arrancar();
  await armado.store.cargarIndice();
  // Lo que haría Sheets al escribir: la planilla cambia de fecha en Drive.
  armado.drive._store.get('i1')!.modifiedTime = NUEVA;
  return armado;
}

/** Cada fila de la copia apunta a la fila de la planilla donde está esa receta. */
async function coincideConLaPlanilla(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const planilla = await sheets.leer('i1', 'recetas!A1:L100');
  expect(copia).not.toBeNull();
  expect(copia!.filas).toHaveLength(planilla.length - 1);
  for (const { fila: nro, entrada } of copia!.filas) {
    expect(planilla[nro - 1]?.[0], `fila ${nro}`).toBe(entrada.id_archivo);
  }
}

describe('después de escribir en _indice, la copia queda igual a la planilla', () => {
  it('guardar pide la metadata de _indice y guarda la copia con la fecha nueva', async () => {
    const { store, drive, indiceLocal } = await abierta();
    await store.guardar('r1', recetaFalsa({ titulo: 'Milanesas napolitanas' }));

    expect(drive.llamadas).toContainEqual(['metadatos', 'i1']);
    const copia = indiceLocal.actual();
    expect(copia?.modifiedTime).toBe(NUEVA);
    expect(copia?.filas).toContainEqual({
      fila: 2, entrada: expect.objectContaining({ id_archivo: 'r1', titulo: 'Milanesas napolitanas' })
    });
  });

  it('guardar deja los números de fila de la planilla, aunque en memoria la entrada pase al final', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.guardar('r1', recetaFalsa({ titulo: 'Milanesas napolitanas' }));
    expect(store.entradas().at(-1)?.id_archivo).toBe('r1');
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('crear suma la fila nueva con el número que le tocó en la planilla', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    const { id } = await store.crear(recetaFalsa({ titulo: 'Vitel toné' }), { carpetaId: 'c1' });
    expect(indiceLocal.actual()?.filas).toContainEqual({ fila: 4, entrada: expect.objectContaining({ id_archivo: id }) });
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('borrar corre los números de fila de la copia', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.borrar('r1');
    expect(indiceLocal.actual()?.modifiedTime).toBe(NUEVA);
    expect(indiceLocal.actual()?.filas).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'r2' }) }
    ]);
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('escribir la fila por la capa compartida también deja la receta en la copia', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    await store.escribirFila(recetaFalsa({ titulo: 'Nueva' }),
      { id: 'r9', nombre_archivo: 'r9.md', categoria: 'Carnes', carpeta_id: 'c1', mtime: 1 });
    expect(store.entradas().map(e => e.id_archivo)).toContain('r9');
    expect(indiceLocal.actual()?.filas).toContainEqual({ fila: 4, entrada: expect.objectContaining({ id_archivo: 'r9' }) });
    await coincideConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('reindexar guarda la copia una sola vez, al terminar', async () => {
    const { store, sheets, indiceLocal } = await abierta();
    const antes = indiceLocal.guardadas.length;
    await store.reconstruir();

    expect(indiceLocal.guardadas.length).toBe(antes + 1);
    const copia = indiceLocal.actual();
    expect(copia?.modifiedTime).toBe(NUEVA);
    expect(copia?.meta['reconstruccion_en_curso']).toBe('');
    expect(copia?.meta['ultima_reconstruccion']).toBeTruthy();
    // r2 está en la planilla pero no tiene `.md` en Drive: el reindexado la saca.
    expect(copia?.filas.map(f => f.entrada.id_archivo)).toEqual(['r1']);
    await coincideConLaPlanilla(sheets, copia);
  });

  it('si la escritura remota falla, la copia no cambia', async () => {
    const { store, sheets, drive, indiceLocal } = await abierta();
    const antes = structuredClone(indiceLocal.actual());
    sheets.alEscribir = async () => { throw new Error('cuota'); };

    await expect(store.guardar('r1', recetaFalsa({ titulo: 'Otra' }))).rejects.toThrow('cuota');
    expect(indiceLocal.actual()).toEqual(antes);
    expect(drive.llamadas).not.toContainEqual(['metadatos', 'i1']);
  });

  it('si la escritura sale y falla pedir la metadata, borra la copia y el guardado no falla', async () => {
    const { store, drive, indiceLocal } = await abierta();
    drive.fallar('metadatos', new Error('sin red'));

    await expect(store.guardar('r1', recetaFalsa({ titulo: 'Otra' }))).resolves.toBeUndefined();
    expect(indiceLocal.actual()).toBeNull();
    expect(indiceLocal.borradas).toBe(1);
  });
});
```

- [ ] **Paso 2: correrlos y ver que fallan**

Correr: `npx vitest run tests/store-indice-local.test.ts`
Esperado: FAIL en los ocho tests nuevos, salvo «si la escritura remota falla, la copia no cambia», que ya pasa (hoy nada toca la copia después de escribir). Los demás fallan porque la copia sigue con `FECHA` y no llama a `metadatos`.

- [ ] **Paso 3: implementar en `src/store.ts`**

Agregar `persistir` después de `usarCopia`:

```ts
  /**
   * El paso con que termina toda escritura en `_indice`: pedir su fecha nueva
   * y guardar la copia entera. Si la fecha no llega, la copia se borra y la
   * próxima apertura baja la planilla; la escritura ya salió, así que no se
   * propaga nada. Así la copia nunca queda más nueva que la planilla.
   */
  async function persistir(): Promise<void> {
    try {
      const { modifiedTime } = await drive.metadatos(ctx.indiceId, 'modifiedTime');
      if (!modifiedTime) throw new Error('Drive no devolvió la fecha de _indice');
      ctx.modifiedTime = modifiedTime;
    } catch {
      ctx.modifiedTime = '';
      indiceLocal.borrar();
      return;
    }
    indiceLocal.guardar(copiaActual());
  }
```

`escribirFila` y `borrarDelIndice` (líneas 207-231) quedan:

```ts
  async function escribirFila(receta: Receta, ubicacion: Ubicacion): Promise<void> {
    const fila = filaDesde(receta, ubicacion);
    // La entrada en memoria se actualiza acá y no en quien llama: la capa
    // compartida escribe la fila sin pasar por guardar ni crear, y la copia
    // se arma desde las entradas.
    entradas = [...entradas.filter(e => e.id_archivo !== ubicacion.id), entradaDesdeFila(fila)];
    const nro = filas.get(ubicacion.id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro), [fila]);
    else {
      await sheets.append(ctx.indiceId, HOJA_RECETAS, [fila]);
      filas.set(ubicacion.id, filas.size + 2);
    }
    await persistir();
  }

  async function borrarDelIndice(id: string): Promise<void> {
    // Sacar la entrada siempre, tenga fila o no.
    entradas = entradas.filter(e => e.id_archivo !== id);

    // Borrar la fila y hacer el corrimiento solo si tenía fila.
    const nro = filas.get(id);
    if (nro) {
      const hojas = await sheets.hojas(ctx.indiceId);
      const hojaId = hojas.find(h => h.title === HOJA_RECETAS)?.sheetId ?? 0;
      await sheets.borrarFila(ctx.indiceId, hojaId, nro);
      filas.delete(id);
      // El corrimiento es determinístico: no hace falta releer nada (§4.3).
      for (const [otroId, otraFila] of filas) if (otraFila > nro) filas.set(otroId, otraFila - 1);
      await persistir();
    }
  }
```

En `guardar`, borrar las dos líneas que actualizan `entradas` (257-258):

```ts
    const nueva = entradaDesdeFila(filaDesde(receta, ubicacion));
    entradas = [...entradas.filter(e => e.id_archivo !== id), nueva];
```

y dejar sólo `await escribirFila(receta, ubicacion);`.

En `crear`, borrar la línea 277:

```ts
    entradas = [...entradas, entradaDesdeFila(filaDesde(receta, ubicacion))];
```

En `reconstruir`, después de `await guardarMeta('reconstruccion_en_curso', '');`:

```ts
    await guardarMeta('reconstruccion_en_curso', '');
    // Una sola vez, al final: si se corta a mitad, la primera anotación ya
    // cambió la fecha de _indice, y la próxima apertura baja la planilla y ve
    // la reconstrucción en curso.
    await persistir();
```

- [ ] **Paso 4: correr los tests**

Correr: `npx vitest run tests/store-indice-local.test.ts tests/store-escritura.test.ts tests/store-reconstruccion.test.ts tests/compartido.test.ts`
Esperado: PASS. En `store-escritura`, «la UI ve el cambio al instante» sigue pasando porque `escribirFila` actualiza `entradas` antes de escribir, igual que antes lo hacía `guardar`.

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 5: commit**

```bash
git add src/store.ts tests/store-indice-local.test.ts
git commit -m "$(cat <<'EOF'
Cada escritura en _indice deja la copia local al día

Escribir una fila, borrarla o reindexar terminan en persistir(): se pide
el modifiedTime nuevo de _indice y se guarda la copia entera. Si ese
pedido falla, la copia se borra. La entrada en memoria la actualiza
escribirFila, para que la capa compartida también quede en la copia.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 4: *Salir* borra la copia, y Ajustes avisa de la planilla duplicada

**Archivos:**
- Modificar: `src/store.ts` (`IndiceDuplicado`, `ResultadoArranque`, `arrancar`)
- Modificar: `src/ui/ajustes.ts`
- Modificar: `src/main.ts` (las dos llamadas a `renderAjustes`, líneas 280-282 y 445-448; *Salir*, líneas 675-680)
- Modificar: `tests/store-arranque.test.ts:113-123`
- Modificar: `tests/vista-ajustes.test.ts`
- Modificar: `tests/main-rutas.test.ts` (estado, `storeFake.arrancar`, mock de `indice-local`, dos tests)

**Interfaces:**
- Consume: `indiceLocal.borrar()` de la Tarea 1; el `import * as indiceLocal` de `main.ts` de la Tarea 2.
- Produce:
  - En `store.ts`: `export interface IndiceDuplicado { cantidad: number; modifiedTime: string }`, y el caso `'listo'` de `ResultadoArranque` suma `indiceDuplicado: IndiceDuplicado | null`.
  - En `ajustes.ts`: `OpcionesAjustes` suma `indiceDuplicado?: IndiceDuplicado | null`.

- [ ] **Paso 1: escribir los tests que fallan**

En `tests/store-arranque.test.ts`, el test «con dos planillas usa la más reciente y avisa» suma una aserción al final:

```ts
    expect(arranqueListo(r).indiceDuplicado).toEqual({ cantidad: 2, modifiedTime: '2026-02-01T00:00:00.000Z' });
```

y se agrega uno nuevo a continuación:

```ts
  it('con una sola planilla no hay aviso de duplicado', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    const r = arranqueListo(await store.arrancar());
    expect(r.indiceDuplicado).toBeNull();
    expect(r.avisos).not.toContain('indice-duplicado');
  });
```

En `tests/vista-ajustes.test.ts`, agregar dentro del `describe`:

```ts
  it('con más de una planilla _indice, el aviso dice cuántas hay y cuál se usa', () => {
    // La fecha se arma en hora local: el aviso la muestra en la hora del teléfono.
    const modifiedTime = new Date(2026, 8, 12, 14, 30).toISOString();
    const html = renderAjustes({ ...base, indiceDuplicado: { cantidad: 2, modifiedTime } });
    expect(html).toContain('Hay 2 planillas _indice en Drive. Se usa la modificada el 12/09 a las 14:30.');
    expect(html).not.toContain('No hay nada para avisar.');
  });

  it('el aviso del duplicado convive con los archivos ignorados', () => {
    const modifiedTime = new Date(2026, 8, 12, 14, 30).toISOString();
    const html = renderAjustes({ ...base, ignorados: ['suelta.md'], indiceDuplicado: { cantidad: 3, modifiedTime } });
    expect(html).toContain('Hay 3 planillas _indice en Drive.');
    expect(html).toContain('suelta.md');
  });
```

En `tests/main-rutas.test.ts`:

Sumar dos campos al objeto `estado` (después de `lecturasBorradores: 0`):

```ts
  lecturasBorradores: 0,
  /** Lo que el arranque dice de las planillas `_indice` repetidas. */
  indiceDuplicado: null as null | { cantidad: number; modifiedTime: string },
  /** Cuántas veces se borró la copia local del índice. */
  copiasBorradas: 0
```

`storeFake.arrancar` pasa a traer el campo:

```ts
  arrancar: async () => ({
    estado: 'listo', reconstruir: false, raizId: 'raiz',
    categorias: [{ id: 'c1', nombre: 'Carnes' }], indiceDuplicado: estado.indiceDuplicado
  }),
```

Después de `vi.mock('../src/store.js', ...)`:

```ts
vi.mock('../src/indice-local.js', () => ({
  leer: () => null,
  guardar: () => {},
  borrar: () => { estado.copiasBorradas++; }
}));
```

En el `afterEach`, sumar:

```ts
    estado.indiceDuplicado = null;
    estado.copiasBorradas = 0;
```

Y dos tests, después de «cada ruta dibuja su pantalla»:

```ts
  it('Salir borra la copia local del índice, además del token', async () => {
    const { tocar } = await montar();
    await tocar('salir');
    expect(estado.copiasBorradas).toBe(1);
  });

  it('el aviso de la planilla _indice duplicada llega a Ajustes', async () => {
    estado.indiceDuplicado = { cantidad: 2, modifiedTime: new Date(2026, 8, 12, 14, 30).toISOString() };
    const { app, abrir } = await montar();
    await abrir('#/ajustes');
    expect(app.innerHTML).toContain('Hay 2 planillas _indice en Drive.');
  });
```

- [ ] **Paso 2: correrlos y ver que fallan**

Correr: `npx vitest run tests/store-arranque.test.ts tests/vista-ajustes.test.ts tests/main-rutas.test.ts`
Esperado: FAIL en los cinco casos nuevos o modificados (`indiceDuplicado` es `undefined`, el aviso no aparece y `copiasBorradas` es 0).

- [ ] **Paso 3: implementar en `src/store.ts`**

Antes de `ResultadoArranque`:

```ts
/** Hay más de una planilla `_indice`: cuántas, y la fecha de la que se usa (la más reciente). */
export interface IndiceDuplicado {
  cantidad: number;
  modifiedTime: string;
}
```

En el caso `'listo'` de `ResultadoArranque`, después de `reconstruir: boolean;`:

```ts
      /** Para el aviso de Ajustes; `null` si hay una sola planilla. */
      indiceDuplicado: IndiceDuplicado | null;
```

En `arrancar`, declarar junto a `let reconstruir = false;`:

```ts
    let indiceDuplicado: IndiceDuplicado | null = null;
```

dentro de la rama con planillas, después de `ctx.modifiedTime = ...`:

```ts
      if (planillas.length > 1) indiceDuplicado = { cantidad: planillas.length, modifiedTime: ctx.modifiedTime };
```

y en el `return` final:

```ts
    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      categorias: ctx.categorias, reconstruir, indiceDuplicado, avisos
    };
```

- [ ] **Paso 4: implementar en `src/ui/ajustes.ts`**

El import de tipos:

```ts
import type { Progreso, IndiceDuplicado } from '../store.js';
```

En `OpcionesAjustes`, después de `ignorados`:

```ts
  /** Hay más de una planilla `_indice` en Drive: cuántas y cuál se usa. */
  indiceDuplicado?: IndiceDuplicado | null;
```

La firma de `renderAjustes`:

```ts
export function renderAjustes(
  { cuenta, ultimaReindexado, ignorados, indiceDuplicado, reindexando, borradores = 0, menuAbierto }: OpcionesAjustes
): string {
```

El bloque `const lista = ...` (líneas 51-54) queda:

```ts
  // El tono de los avisos es el hecho y el número (brand-identity §3.2).
  const duplicado = indiceDuplicado
    ? `<p class="aviso-mudo" style="margin:0 0 var(--e-2)">Hay ${indiceDuplicado.cantidad} planillas _indice en Drive. ` +
      `Se usa la modificada el ${fechaYHora(indiceDuplicado.modifiedTime)}.</p>`
    : '';

  const deIgnorados = ignorados.length
    ? `<div class="fila-a"><span class="t aviso-mudo">${ignorados.length} ${ignorados.length === 1 ? 'archivo ignorado' : 'archivos ignorados'} por no tener título.</span></div>` +
      `<p class="aviso-mudo" style="margin:var(--e-2) 0 0">${ignorados.map(n => escapar(n)).join(', ')}</p>`
    : '';

  const lista = duplicado + deIgnorados || '<p class="aviso-mudo" style="margin:0">No hay nada para avisar.</p>';
```

Y al final del archivo, junto a `porcentaje`:

```ts
/** «12/09 a las 14:30», en la hora del teléfono. */
function fechaYHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} a las ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
```

- [ ] **Paso 5: implementar en `src/main.ts`**

Junto a `categoriasDelArranque` (después de la línea 166):

```ts
/** El aviso de la planilla `_indice` repetida, para Ajustes. Sólo existe con el arranque en 'listo'. */
const indiceDuplicado = () =>
  estadoArranque?.estado === 'listo' ? estadoArranque.indiceDuplicado : null;
```

En `reconstruir` (líneas 280-282):

```ts
    ? pintar(renderAjustes({
        cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados,
        indiceDuplicado: indiceDuplicado(), reindexando
      }))
```

En `render`, caso `'ajustes'` (líneas 445-448):

```ts
      return pintar(renderAjustes({
        cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados,
        indiceDuplicado: indiceDuplicado(), reindexando,
        borradores: (await borradoresDePantalla().catch(() => [])).length, menuAbierto
      }));
```

*Salir* (líneas 675-680):

```ts
  if (accion === 'salir') {
    auth.olvidar();
    // La copia tiene títulos e ingredientes: después de Salir no queda nada
    // del usuario en el navegador.
    indiceLocal.borrar();
    cuenta = '';
    irCerrando('#/');
    return pintar(renderConexion({ estado: 'inicial' }));
  }
```

- [ ] **Paso 6: correr los tests**

Correr: `npx vitest run tests/store-arranque.test.ts tests/vista-ajustes.test.ts tests/main-rutas.test.ts`
Esperado: PASS.

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

- [ ] **Paso 7: commit**

```bash
git add src/store.ts src/ui/ajustes.ts src/main.ts tests/store-arranque.test.ts tests/vista-ajustes.test.ts tests/main-rutas.test.ts
git commit -m "$(cat <<'EOF'
Salir borra la copia del índice, y Ajustes avisa de _indice duplicada

El aviso indice-duplicado se generaba y ninguna pantalla lo mostraba.
Ahora el arranque trae cuántas planillas hay y la fecha de la que se
usa, y Ajustes lo dice en Avisos.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 5: los documentos, y a probar en el teléfono

**Archivos:**
- Modificar: `product-design/plan/decision-log.md` (encabezado y una fila al final de la tabla, después de la línea 120)
- Modificar: `product-design/product/specs/E05-Cimientos.md:242` y `:348-352`
- Modificar: `product-design/plan/BACKLOG.md` (filas P12 y P18)
- Modificar: `CLAUDE.md`

- [ ] **Paso 1: `decision-log.md`**

Cambiar el encabezado:

```markdown
**Versión:** 1.8
**Última actualización:** 2026-09-13
```

Agregar esta fila al final de la tabla, después de la del 2026-09-12 sobre el título de sección:

```markdown
| 2026-09-13 | **Hay copia local del índice, y sólo del índice.** Se guarda en `localStorage` (`recetario-indice`) y al abrir se compara el `modifiedTime` de `_indice` con el de la copia: si coincide, no se lee Sheets. Después de cada escritura en `_indice` se pide la fecha nueva y se vuelve a guardar. Reabre la decisión del 2026-09-06. | P12: el índice se bajaba entero en cada apertura. La decisión del 2026-09-06 se tomó pensando en dos escritores sin bloqueo; la premisa nueva es que **nunca hay escritura concurrente**: lo que cambia entre sesiones viene de otro dispositivo, del agente o de una edición a mano, pero nunca con la app abierta. | Copiar también los `.md`, las categorías o los borradores; detectar cambios en los `.md` hechos afuera; usar la copia para dibujar sin red; comparar contenido en vez de metadata. | Con esa premisa, la fecha de `_indice` alcanza para saber si la copia es la planilla, y la búsqueda de `_indice` que el arranque ya hacía la trae sin pedidos nuevos. Ante cualquier duda —falla la metadata, falla guardar, otra planilla, otro esquema— la copia se descarta y se baja la planilla: nunca queda más nueva que ella. | `E05-Cimientos.md` C05.4.2 y C05.8.1. `src/indice-local.ts`. Lo que escribe el agente sigue dependiendo de *Reindexar* (P14). Queda sin medir cuánto tarda Drive en actualizar la fecha después de escribir por Sheets: si tarda, la apertura siguiente baja la planilla de más. |
```

- [ ] **Paso 2: `E05-Cimientos.md`**

La línea 242 queda:

```markdown
- [ ] **Hay copia local del índice, y sólo del índice** `[2026-09-13]`. Vive en `localStorage` y se usa si la fecha de `_indice` en Drive es la misma que tenía al guardarla; si no, se lee la planilla y se reemplaza. Cada escritura en `_indice` la actualiza. No sirve para dibujar sin red: ver C05.8.1.
```

En C05.8.1, agregar un cuarto criterio después de «Ninguna pantalla promete que algo se va a guardar después.»:

```markdown
- [ ] La copia local del índice (C05.4.2) no reemplaza la lectura de Drive: al abrir, la búsqueda de `_indice` va primero, y sin ella se muestra el aviso.
```

- [ ] **Paso 3: `BACKLOG.md`**

En la fila de **P12**, reemplazar desde `**Diseño en curso** \`[2026-09-13]\`` hasta el final de la celda (`…pendiente de revisión; después, el plan.`) por:

```markdown
**Resuelto** `[2026-09-13]`: con la premisa nueva de que nunca hay escritura concurrente, hay **una copia local del índice verificada por la metadata de `_indice`** —al abrir, si la fecha coincide, no se lee Sheets— y cada escritura la actualiza. Spec en `docs/superpowers/specs/2026-09-13-indice-local-design.md`, plan en `docs/superpowers/plans/2026-09-13-indice-local.md`. La app sigue sin ver lo que se escribe afuera en los `.md` (P14). Queda medir en el teléfono cuánto tarda Drive en actualizar la fecha después de escribir.
```

En la fila de **P18**, reemplazar `Depende del índice local (el diseño en curso de P12).` por:

```markdown
El índice local ya está (P12): `store.arrancar()` sabe si usó la copia o bajó la planilla, y con qué fechas.
```

- [ ] **Paso 4: `CLAUDE.md`**

El párrafo **«En curso — para retomar:»** (debajo de «Después, usando la app») se reemplaza por:

```markdown
**Hecho el 2026-09-13 — el índice local (P12):** al abrir, si `_indice` no cambió
desde la última vez, el índice sale de una copia en `localStorage` y no se lee
Sheets; cada escritura deja la copia al día. Spec en
`docs/superpowers/specs/2026-09-13-indice-local-design.md`, plan en
`docs/superpowers/plans/2026-09-13-indice-local.md`. **Falta la verificación a
mano en el teléfono** (abajo).
```

En la tabla **«Cómo quedó el código»**, la fila **Se eliminó** cambia `la cola, el cache local del índice y la Changes API.` por `la cola, el cache local del índice —volvió el 2026-09-13 de otra forma, ver «Funcionar sin conexión»— y la Changes API.`; y la fila **Es nuevo** suma, después de `` `compartido.ts` (la capa que la app y el agente invocan igual) ``: `, \`indice-local.ts\` (la copia del índice en el navegador, P12)`.

En **«Falta verificar a mano»**, agregar al final del párrafo:

```markdown
Y del índice local (P12): abrir la app dos veces seguidas y ver en la pestaña Red
que la segunda no lee Sheets; guardar una receta, cerrar y abrir, y ver que
tampoco lee —si lee, Drive tardó en actualizar la fecha de `_indice`: anotarlo—;
y editar una fila a mano en la planilla, abrir, y ver que sí lee.
```

La fila **«Funcionar sin conexión»** de «Decisiones cerradas» queda:

```markdown
| Funcionar sin conexión | Salió de v1 el 2026-09-02 y sigue afuera: sin la lectura de Drive no hay con qué dibujar. `cache.ts` y su IndexedDB se eliminaron con el rediseño. **Desde el 2026-09-13 hay copia local del índice, y sólo del índice** (P12, `src/indice-local.ts`): con la premisa de que nunca hay escritura concurrente, se guarda en `localStorage` y al abrir se compara el `modifiedTime` de `_indice`; si coincide no se lee Sheets. No sirve para dibujar sin red: la búsqueda en Drive va antes que la copia (C05.4.2, C05.8.1). |
```

En **«Lo que queda pendiente» → «Estado al 2026-09-13»**, `resueltos P1 a P11, P13, P16 y P17` pasa a `resueltos P1 a P13, P16 y P17`; se borra el ítem de **P12**; y en **P18** y **P21**, `depende de P12` pasa a `P12 ya está hecho`.

En el párrafo de estado de arriba, actualizar la cantidad de tests (`**488 tests**`) al número que dé `npm test` al terminar.

- [ ] **Paso 5: verificación final**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde. Anotar la cantidad de tests y confirmar que coincide con lo escrito en `CLAUDE.md`.

- [ ] **Paso 6: commit y push**

```bash
git add product-design/plan/decision-log.md product-design/product/specs/E05-Cimientos.md product-design/plan/BACKLOG.md CLAUDE.md
git commit -m "$(cat <<'EOF'
P12 resuelto: los documentos dicen que hay copia local del índice

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

- [ ] **Paso 7: pedirle al usuario la verificación en el teléfono**

Con Pages publicado, las tres pruebas del §8 del spec, en la pestaña Red (Chrome remoto) o mirando si aparece «Conectando…» más corto:

1. Abrir la app dos veces seguidas: la segunda apertura no pide `sheets.googleapis.com`.
2. Guardar una receta, cerrar y abrir: no pide Sheets. Si pide, Drive tardó en actualizar la fecha de `_indice` (§5.3): anotarlo en `BACKLOG.md` P12.
3. Editar una fila a mano en `_indice`, abrir: sí pide Sheets.
