# Categorías en el índice (P15/P19, etapa 1) — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Objetivo:** que el color y la foto de cada categoría salgan de las propiedades de su carpeta en Drive, que las 16 predefinidas vivan en una sola tabla, que la lista de categorías viaje en una hoja de `_indice` dentro de la copia local, y que abrir con la copia vigente cueste un pedido.

**Arquitectura:** `src/categorias.ts` (nuevo) tiene la tabla de predefinidas y la fila de la hoja. `src/store.ts` lee la hoja `categorias` al cargar, la escribe al reindexar —listando las carpetas y escribiendo propiedades a las predefinidas que no las tienen— y arranca por la copia: la fecha de `_indice` por su id, y sólo sin copia busca. `src/ui/categorias.ts` deja de conocer nombres: `main` le registra `store.categorias()` y traduce claves a token e imagen.

**Stack:** TypeScript estricto + Vite, sin framework. Vitest en `environment: 'node'` con dobles a mano.

**Spec:** `docs/superpowers/specs/2026-09-13-categorias-en-el-indice-design.md` — leerlo antes de empezar.

## Restricciones globales

- **Sin commits ni push.** El usuario revisa el diff completo antes. La última tarea termina mostrando los cambios.
- **Idioma:** español rioplatense en comentarios, nombres y UI.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess` (sólo `src`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Imports internos con `.js`; tipos con `import type`.
- **Las 16 predefinidas se nombran en un solo lugar:** `src/categorias.ts`. Ningún otro archivo de `src/` escribe un nombre de categoría.
- **Propiedades de carpeta:** `color` = clave de la paleta; `foto` = `catalogo:<clave>`.
- **Hoja:** `categorias`, columnas `id_carpeta | nombre | color | foto`. `meta` suma `carpeta_borradores`.
- **`SCHEMA_VERSION` = 5.**
- **Verificación de cada tarea:** `npm test` y `npm run typecheck` en verde.

## Mapa de archivos

| Archivo | Qué cambia |
|---|---|
| `src/categorias.ts` | **Nuevo.** `CLAVES_COLOR`, `PREDEFINIDAS`, `predefinidaPorNombre`, `COLUMNAS_CATEGORIAS`, `filaDeCategoria`, `categoriaDesdeFila`. |
| `src/tipos.ts` | `Categoria` se muda acá con `color` y `foto`; `ArchivoDrive` suma `appProperties`. |
| `src/drive.ts` | `propiedades()`; `listarCarpetas` pide `appProperties`. |
| `src/sheets.ts` | `HOJA_CATEGORIAS`. |
| `src/config.ts` | `SCHEMA_VERSION` = 5. |
| `src/indice-local.ts` | `CopiaIndice` suma `raizId` y `categorias`. |
| `src/store.ts` | Categorías en memoria desde la hoja o la copia; reindexado con migración; `carpeta_borradores`; arranque por la copia; `categorias()`; `InformeArranque` sin `categorias`; `ResultadoArranque` sin `categorias`. |
| `src/ui/categorias.ts` | Por registro y claves, sin nombres. |
| `src/ui/editor.ts` | `categorias` acepta `Pick<Categoria, 'id' \| 'nombre'>[]`. |
| `src/ui/ajustes.ts` | La ficha «Al abrir» recibe la cantidad de categorías aparte. |
| `src/main.ts` | `store.categorias()` y `registrarCategorias`. |
| `tests/dobles.ts` | Drive falso: `propiedades`, `appProperties`, 404 al pedir metadatos de un id que no existe. |
| Tests | `categorias-predefinidas.test.ts` y `drive-propiedades.test.ts` nuevos; `categorias.test.ts` reescrito; `store-categorias.test.ts` nuevo; ajustes en `store-*`, `compartido`, `main-*`, `vista-ajustes`. |
| Documentos | `design-system.md`, `CLAUDE.md`, `SETUP.md`, `decision-log.md`, `BACKLOG.md`. |

---

### Tarea 1: la tabla de predefinidas

**Archivos:**
- Crear: `src/categorias.ts`, `tests/categorias-predefinidas.test.ts`
- Modificar: `src/tipos.ts`, `src/store.ts` (el tipo `Categoria` se va), `src/ui/editor.ts:20,26`

**Interfaces:**
- Produce:
  - `tipos.ts`: `export interface Categoria { id: string; nombre: string; color: string; foto: string }`.
  - `store.ts`: `export type { Categoria } from './tipos.js';` (los imports existentes siguen andando).
  - `categorias.ts`: `CLAVES_COLOR` (readonly tupla de las 16 claves), `type ClaveColor`, `interface CategoriaPredefinida { nombre: string; color: ClaveColor; foto: string }`, `PREDEFINIDAS: readonly CategoriaPredefinida[]`, `predefinidaPorNombre(nombre: string): CategoriaPredefinida | null`, `COLUMNAS_CATEGORIAS`, `filaDeCategoria(c: Categoria): string[]`, `categoriaDesdeFila(f: string[]): Categoria`.

- [ ] **Paso 1: test que falla**

Crear `tests/categorias-predefinidas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import {
  PREDEFINIDAS, CLAVES_COLOR, predefinidaPorNombre,
  COLUMNAS_CATEGORIAS, filaDeCategoria, categoriaDesdeFila
} from '../src/categorias.js';

const TOKENS = readFileSync(new URL('../src/ui/tokens.css', import.meta.url), 'utf8');

describe('las categorías predefinidas', () => {
  it('son 16, sin nombres repetidos', () => {
    expect(PREDEFINIDAS).toHaveLength(16);
    expect(new Set(PREDEFINIDAS.map(p => p.nombre)).size).toBe(16);
  });

  it('cada color es una clave de la paleta con su token en tokens.css', () => {
    for (const { nombre, color } of PREDEFINIDAS) {
      expect(CLAVES_COLOR, nombre).toContain(color);
      expect(TOKENS, nombre).toContain(`--cat-${color}:`);
    }
  });

  it('cada foto tiene su .webp en src/categorias/', () => {
    for (const { nombre, foto } of PREDEFINIDAS) {
      expect(existsSync(new URL(`../src/categorias/${foto}.webp`, import.meta.url)), nombre).toBe(true);
    }
  });

  it('se reconocen por nombre sin importar tildes ni mayúsculas', () => {
    expect(predefinidaPorNombre('PESCADOS Y MARISCOS')?.color).toBe('pescados');
    expect(predefinidaPorNombre('Desayunos y meriendas')?.foto).toBe('desayunos-y-meriendas');
    expect(predefinidaPorNombre('Fiambres caseros')).toBeNull();
  });
});

describe('la fila de la hoja categorias', () => {
  it('tiene cuatro columnas, ida y vuelta', () => {
    const c = { id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };
    expect(COLUMNAS_CATEGORIAS).toEqual(['id_carpeta', 'nombre', 'color', 'foto']);
    expect(categoriaDesdeFila(filaDeCategoria(c))).toEqual(c);
  });

  it('una fila corta se lee con vacíos', () => {
    expect(categoriaDesdeFila(['c1', 'Rara'])).toEqual({ id: 'c1', nombre: 'Rara', color: '', foto: '' });
  });
});
```

Correr: `npx vitest run tests/categorias-predefinidas.test.ts`
Esperado: FAIL, no resuelve `../src/categorias.js`.

- [ ] **Paso 2: implementar**

En `src/tipos.ts`, antes de `ArchivoDrive`:

```ts
/**
 * Una subcarpeta de `Recetario/`: la carpeta es la categoría (§3.1). El color y
 * la foto son las propiedades de la carpeta en Drive; vacíos, se dibuja con el
 * neutro y la trama.
 */
export interface Categoria {
  id: string;
  nombre: string;
  /** Clave de la paleta (`src/categorias.ts`), o vacío. */
  color: string;
  /** `catalogo:<clave>`, `drive:<id>` o vacío. */
  foto: string;
}
```

En `src/store.ts`, borrar la interfaz `Categoria` (líneas 15-19) y en su lugar:

```ts
export type { Categoria } from './tipos.js';
```

sumando `Categoria` al `import type { … } from './tipos.js'` del store.

En `src/ui/editor.ts`, `categorias?: Categoria[]` pasa a `categorias?: Pick<Categoria, 'id' | 'nombre'>[]`: el editor sólo usa id y nombre.

Crear `src/categorias.ts`:

```ts
/**
 * Las categorías predefinidas, en un solo lugar.
 *
 * Son las 16 con las que arranca un Recetario: su nombre, su color de la paleta
 * y su foto del catálogo. Ningún otro archivo nombra una categoría. Los valores
 * de los colores viven en `src/ui/tokens.css` como `--cat-<clave>`, y las fotos
 * en `src/categorias/<clave>.webp`: sumar una predefinida es una fila acá y su
 * `.webp`.
 *
 * También vive acá la fila de la hoja `categorias` del índice.
 */
import { normalizar } from './recipe.js';
import type { Categoria } from './tipos.js';

export const CLAVES_COLOR = [
  'arroces', 'aves', 'bebidas', 'carnes', 'desayunos', 'ensaladas', 'entradas', 'panes',
  'pastas', 'pescados', 'postres', 'salsas', 'sopas', 'tartas', 'verduras', 'otros'
] as const;

export type ClaveColor = (typeof CLAVES_COLOR)[number];

export interface CategoriaPredefinida {
  nombre: string;
  color: ClaveColor;
  /** Clave del catálogo: `src/categorias/<foto>.webp`. */
  foto: string;
}

export const PREDEFINIDAS: readonly CategoriaPredefinida[] = [
  { nombre: 'Arroces y legumbres', color: 'arroces', foto: 'arroces-y-legumbres' },
  { nombre: 'Aves', color: 'aves', foto: 'aves' },
  { nombre: 'Bebidas', color: 'bebidas', foto: 'bebidas' },
  { nombre: 'Carnes', color: 'carnes', foto: 'carnes' },
  { nombre: 'Desayunos y meriendas', color: 'desayunos', foto: 'desayunos-y-meriendas' },
  { nombre: 'Ensaladas', color: 'ensaladas', foto: 'ensaladas' },
  { nombre: 'Entradas y picadas', color: 'entradas', foto: 'entradas-y-picadas' },
  { nombre: 'Panes y masas', color: 'panes', foto: 'panes-y-masas' },
  { nombre: 'Pastas', color: 'pastas', foto: 'pastas' },
  { nombre: 'Pescados y mariscos', color: 'pescados', foto: 'pescados-y-mariscos' },
  { nombre: 'Postres', color: 'postres', foto: 'postres' },
  { nombre: 'Salsas y aderezos', color: 'salsas', foto: 'salsas-y-aderezos' },
  { nombre: 'Sopas y caldos', color: 'sopas', foto: 'sopas-y-caldos' },
  { nombre: 'Tartas y empanadas', color: 'tartas', foto: 'tartas-y-empanadas' },
  { nombre: 'Verduras y guarniciones', color: 'verduras', foto: 'verduras-y-guarniciones' },
  // Otros es el comodín: su color es el neutro (design-system §2.3).
  { nombre: 'Otros', color: 'otros', foto: 'otros' }
];

/** La predefinida con ese nombre, sin mirar tildes ni mayúsculas. */
export function predefinidaPorNombre(nombre: string): CategoriaPredefinida | null {
  const buscado = normalizar(nombre);
  return PREDEFINIDAS.find(p => normalizar(p.nombre) === buscado) ?? null;
}

export const COLUMNAS_CATEGORIAS = ['id_carpeta', 'nombre', 'color', 'foto'] as const;

export const filaDeCategoria = (c: Categoria): string[] => [c.id, c.nombre, c.color, c.foto];

export const categoriaDesdeFila = (f: string[]): Categoria => ({
  id: f[0] ?? '', nombre: f[1] ?? '', color: f[2] ?? '', foto: f[3] ?? ''
});
```

Los literales `{ id, nombre }` que hoy crean categorías en `src/store.ts` (`arrancar`) dejan de compilar: sumar `color: ''` y `foto: ''` ahí por ahora —la Tarea 3 los reemplaza—. En `tests/vista-editor.test.ts`, la constante `categorias: Categoria[]` (línea 8) pasa a `Pick<Categoria, 'id' | 'nombre'>[]`: es lo que el editor acepta, y el test no necesita color ni foto.

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/categorias-predefinidas.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 2: Drive, planilla, copia y dobles

**Archivos:**
- Modificar: `src/tipos.ts` (`ArchivoDrive`), `src/drive.ts`, `src/sheets.ts`, `src/config.ts`, `src/indice-local.ts`, `src/store.ts` (`DriveDelStore`), `tests/dobles.ts`, `tests/indice-local.test.ts`, `tests/store-indice-local.test.ts`, `tests/store-informe.test.ts`
- Crear: `tests/drive-propiedades.test.ts`

**Interfaces:**
- Produce:
  - `ArchivoDrive.appProperties?: Record<string, string>`.
  - `drive.propiedades(id: string, props: Record<string, string>): Promise<ArchivoDrive>`.
  - `sheets.ts`: `HOJA_CATEGORIAS = 'categorias'`.
  - `CopiaIndice.raizId: string`, `CopiaIndice.categorias: Categoria[]`.
  - `SCHEMA_VERSION = 5`.
  - Drive falso: `propiedades` (registra `['propiedades', id, props]` en `llamadas` y guarda en `appProperties`); `metadatos` de un id inexistente tira un error con `status: 404`.

- [ ] **Paso 1: test de `propiedades`**

Crear `tests/drive-propiedades.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('propiedades de carpeta en Drive', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ files: [] })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('propiedades escribe appProperties con PATCH', async () => {
    await drive.propiedades('c1', { color: 'pastas', foto: 'catalogo:pastas' });
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/drive/v3/files/c1');
    expect(opciones.method).toBe('PATCH');
    expect(JSON.parse(String(opciones.body))).toEqual({ appProperties: { color: 'pastas', foto: 'catalogo:pastas' } });
  });

  it('listarCarpetas pide las propiedades junto con el nombre', async () => {
    await drive.listarCarpetas('raiz');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(decodeURIComponent(url)).toContain('files(id,name,appProperties)');
  });
});
```

Correr: `npx vitest run tests/drive-propiedades.test.ts`
Esperado: FAIL (`drive.propiedades` no es una función).

- [ ] **Paso 2: implementar Drive, planilla y config**

`src/tipos.ts`, en `ArchivoDrive`:

```ts
  /** Las propiedades privadas de la app sobre el archivo. */
  appProperties?: Record<string, string>;
```

`src/drive.ts`: `listarCarpetas` pasa a `listar(q.carpetasDe(id), 'files(id,name,appProperties)')`, y después de `renombrar`:

```ts
    /** Las propiedades privadas de la app: el color y la foto de una categoría. */
    propiedades: (id: string, props: Record<string, string>) =>
      pedir<ArchivoDrive>(`/files/${id}?fields=id,appProperties`, {
        method: 'PATCH', body: JSON.stringify({ appProperties: props })
      }),
```

`src/sheets.ts`, después de `HOJA_BORRADORES`: `export const HOJA_CATEGORIAS = 'categorias';`

`src/config.ts`: `SCHEMA_VERSION = 5`, y el comentario suma «y a 5 el mismo día, cuando sumó la hoja `categorias` y las propiedades de las carpetas».

`src/store.ts`, `DriveDelStore` suma `'propiedades'`.

- [ ] **Paso 3: la copia local**

`src/indice-local.ts`: el import pasa a `import type { Categoria, Entrada, EntradaBorrador } from './tipos.js';`; `CopiaIndice` suma después de `indiceId`:

```ts
  /** La carpeta `Recetario/`: con ella y `indiceId`, abrir no busca nada. */
  raizId: string;
```

y después de `borradores`:

```ts
  /** La hoja `categorias`, en el orden de la planilla. */
  categorias: Categoria[];
```

`esCopia` suma `&& typeof x['raizId'] === 'string' && Array.isArray(x['categorias'])`.

En `tests/indice-local.test.ts`, la `copia` suma `raizId: 'raiz', categorias: [{ id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' }]`. En `tests/store-indice-local.test.ts` y `tests/store-informe.test.ts`, `copiaVigente` suma `raizId: 'raiz', categorias: [],`.

En `src/store.ts`, `copiaActual()` suma `raizId: ctx.raizId, categorias: ctx.categorias` para que compile (la Tarea 3 usa esos campos).

- [ ] **Paso 4: el Drive falso**

`tests/dobles.ts`: `ArchivoFalso` suma `appProperties?: Record<string, string>;`. `metadatos` queda:

```ts
    // Como el real: un id que no está es un 404, que el arranque distingue de
    // no poder preguntar.
    async metadatos(id: string) {
      api.llamadas.push(['metadatos', id]);
      if (fallas.has('metadatos')) throw fallas.get('metadatos');
      const a = store.get(id);
      if (!a) throw Object.assign(new Error(`El doble de Drive no tiene el archivo ${id}`), { status: 404 });
      return a;
    },
```

y después de `mover`:

```ts
    async propiedades(id: string, props: Record<string, string>) {
      api.llamadas.push(['propiedades', id, props]);
      const a = exigir(id);
      a.appProperties = { ...a.appProperties, ...props };
      return a;
    },
```

- [ ] **Paso 5: correr**

Correr: `npx vitest run tests/drive-propiedades.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 3: el store carga y reindexa las categorías

**Archivos:**
- Modificar: `src/store.ts`
- Crear: `tests/store-categorias.test.ts`
- Modificar: `tests/store-busqueda.test.ts`, `tests/store-escritura.test.ts`, `tests/compartido.test.ts`, `tests/store-borradores.test.ts`, `tests/store-arranque.test.ts`

**Interfaces:**
- Consume: Tareas 1 y 2.
- Produce:
  - `store.categorias(): Categoria[]`.
  - `ResultadoArranque` (caso `listo`) **pierde** `categorias`.
  - `arrancar()` deja de listar carpetas.
  - `cargarIndice()` lee también la hoja `categorias` y toma `carpeta_borradores` de `meta`.
  - `reconstruir()` lista las carpetas con sus propiedades, migra las predefinidas, escribe la hoja y `carpeta_borradores`.
  - `agregarBorrador` anota `carpeta_borradores` al crear la carpeta.
  - Interna: `usarCategorias(lista: Categoria[])`.

- [ ] **Paso 1: tests que fallan**

Crear `tests/store-categorias.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

/**
 * Tres carpetas: Pastas sin propiedades (predefinida a migrar), «Mis tartas» con
 * propiedades de Tartas (una predefinida renombrada a mano) y «Fiambres» sin
 * propiedades (desconocida). Más `_borradores`, que no es categoría. `hojas`
 * elige qué hojas tiene la planilla.
 */
function armar(hojas = ['recetas', 'meta', 'borradores', 'categorias']) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Pastas', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'c2', name: 'Mis tartas', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'tartas', foto: 'catalogo:tartas-y-empanadas' } },
    { id: 'c3', name: 'Fiambres', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', hojas);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.cargar('i1', 'borradores', [[...COLUMNAS_BORRADORES]]);
  if (hojas.includes('categorias')) sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS]]);
  const indiceLocal = indiceLocalFalso();
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store };
}

describe('reindexar las categorías', () => {
  it('escribe color y foto sólo a las predefinidas que no los tienen', async () => {
    const { store, drive } = armar();
    await store.arrancar();
    await store.reconstruir();
    const escritas = drive.llamadas.filter(l => l[0] === 'propiedades');
    expect(escritas).toEqual([['propiedades', 'c1', { color: 'pastas', foto: 'catalogo:pastas' }]]);
  });

  it('una carpeta con propiedades las conserva aunque se llame distinto', async () => {
    const { store } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(store.categorias().find(c => c.id === 'c2')).toEqual(
      { id: 'c2', nombre: 'Mis tartas', color: 'tartas', foto: 'catalogo:tartas-y-empanadas' });
  });

  it('una desconocida queda sin color ni foto, y _borradores no es categoría', async () => {
    const { store } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(store.categorias().find(c => c.id === 'c3')).toEqual({ id: 'c3', nombre: 'Fiambres', color: '', foto: '' });
    expect(store.categorias().map(c => c.nombre)).not.toContain('_borradores');
  });

  it('escribe la hoja categorias y anota carpeta_borradores en meta', async () => {
    const { store, sheets } = armar();
    await store.arrancar();
    await store.reconstruir();
    const hoja = await sheets.leer('i1', 'categorias!A1:D100');
    expect(hoja[0]).toEqual([...COLUMNAS_CATEGORIAS]);
    expect(hoja.slice(1).map(f => f[0]).sort()).toEqual(['c1', 'c2', 'c3']);
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['carpeta_borradores']).toBe('bc');
  });

  it('crea la hoja categorias si la planilla no la tiene', async () => {
    const { store, sheets } = armar(['recetas', 'meta', 'borradores']);
    await store.arrancar();
    await store.reconstruir();
    expect((await sheets.hojas('i1')).map(h => h.title)).toContain('categorias');
    expect(await sheets.leer('i1', 'categorias!A1:D100')).toHaveLength(4);
  });

  it('la copia guardada al terminar trae las categorías y la raíz', async () => {
    const { store, indiceLocal } = armar();
    await store.arrancar();
    await store.reconstruir();
    expect(indiceLocal.actual()?.raizId).toBe('raiz');
    expect(indiceLocal.actual()?.categorias.map(c => c.id).sort()).toEqual(['c1', 'c2', 'c3']);
  });
});

describe('cargar las categorías', () => {
  it('salen de la hoja, con el id de _borradores de meta, sin listar carpetas', async () => {
    const { store, sheets, drive } = armar();
    sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Pastas', 'pastas', 'catalogo:pastas']]);
    sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)], ['carpeta_borradores', 'bc']]);
    let listadas = 0;
    const listar = drive.listarCarpetas.bind(drive);
    drive.listarCarpetas = async (id: string) => { listadas++; return listar(id); };

    await store.arrancar();
    await store.cargarIndice();

    expect(store.categorias()).toEqual([{ id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' }]);
    expect(listadas).toBe(0);
    const b = await store.agregarBorrador({ titulo: 'Pan', fuente: '', nota: '' });
    expect(drive._store.get(b.id)?.parents).toEqual(['bc']);
  });

  it('con la planilla recién creada están vacías hasta reindexar', async () => {
    const drive = driveFalso([
      { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
      { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    expect(store.categorias()).toEqual([]);
    await store.reconstruir();
    expect(store.categorias().map(c => c.nombre)).toEqual(['Carnes']);
  });

  it('agregar el primer borrador anota la carpeta nueva en meta', async () => {
    const { store, sheets } = armar();
    await store.arrancar();
    await store.cargarIndice();
    await store.agregarBorrador({ titulo: 'Pan', fuente: '', nota: '' });
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['carpeta_borradores']).toMatch(/^nuevo/);
  });

  it('crear la planilla crea las cuatro hojas', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    expect((await sheets.hojas(store._ctx.indiceId)).map(h => h.title))
      .toEqual(['recetas', 'meta', 'borradores', 'categorias']);
  });
});
```

Correr: `npx vitest run tests/store-categorias.test.ts`
Esperado: FAIL (`store.categorias` no es una función).

- [ ] **Paso 2: implementar en `src/store.ts`**

Imports: sumar `HOJA_CATEGORIAS` al de `./sheets.js`, `NOMBRE_BORRADORES` ya está, y

```ts
import { COLUMNAS_CATEGORIAS, categoriaDesdeFila, filaDeCategoria, predefinidaPorNombre } from './categorias.js';
```

Constante junto a las otras: `const ULTIMA_COLUMNA_CATEGORIAS = String.fromCharCode(64 + COLUMNAS_CATEGORIAS.length);`

`ResultadoArranque`, caso `listo`: borrar `categorias: Categoria[];`, y en el `return` de `arrancar` borrar `categorias: ctx.categorias,`.

Después de `usarCopia`, la auxiliar:

```ts
  /** Las categorías en memoria y el mapa de carpeta → nombre que usan guardar y crear. */
  function usarCategorias(lista: Categoria[]): void {
    ctx.categorias = lista;
    ctx.carpetas = new Map<string, string>([
      [ctx.raizId, CATEGORIA_RAIZ],
      ...lista.map(c => [c.id, c.nombre] as [string, string])
    ]);
  }
```

`usarCopia` suma al final:

```ts
    usarCategorias(copia.categorias);
    ctx.borradoresId = ctx.meta['carpeta_borradores'] ?? '';
```

`crearPlanilla`, después de la hoja de borradores:

```ts
      await sheets.agregarHoja(archivo.id, HOJA_CATEGORIAS);
      await sheets.escribir(archivo.id, `${HOJA_CATEGORIAS}!A1:${ULTIMA_COLUMNA_CATEGORIAS}1`, [[...COLUMNAS_CATEGORIAS]]);
```

`arrancar`: borrar el bloque de `listarCarpetas` —desde `let subcarpetas: ArchivoDrive[];` hasta la línea de `ctx.borradoresId = subcarpetas.find(…)` inclusive—.

`cargarIndice`, después de armar `filasBorradores`:

```ts
    const crudoCategorias = await sheets.leer(
      ctx.indiceId, `${HOJA_CATEGORIAS}!A1:${ULTIMA_COLUMNA_CATEGORIAS}1000`);
    usarCategorias(crudoCategorias.slice(1).map(categoriaDesdeFila).filter(c => c.id));
    ctx.borradoresId = ctx.meta['carpeta_borradores'] ?? '';
```

`reconstruir`, justo después de `await guardarMeta('reconstruccion_en_curso', 'si');`:

```ts
    // Las carpetas: la verdad de cada categoría. Las predefinidas que todavía
    // no tienen propiedades las reciben de la tabla, una sola vez.
    let borradoresId = '';
    const categorias: Categoria[] = [];
    for (const carpeta of await drive.listarCarpetas(ctx.raizId)) {
      const nombre = carpeta.name ?? '';
      if (nombre === NOMBRE_BORRADORES) { borradoresId = carpeta.id; continue; }
      if (nombre.startsWith('_')) continue;
      let color = carpeta.appProperties?.['color'] ?? '';
      let foto = carpeta.appProperties?.['foto'] ?? '';
      const predefinida = !color && !foto ? predefinidaPorNombre(nombre) : null;
      if (predefinida) {
        color = predefinida.color;
        foto = `catalogo:${predefinida.foto}`;
        await drive.propiedades(carpeta.id, { color, foto });
      }
      categorias.push({ id: carpeta.id, nombre, color, foto });
    }
    usarCategorias(categorias);
    ctx.borradoresId = borradoresId;
```

En el mismo `reconstruir`, después del bloque que crea la hoja `borradores` si falta:

```ts
    if (!hojas.some(h => h.title === HOJA_CATEGORIAS)) {
      // Una planilla de antes de la versión 5 no la tiene.
      await sheets.agregarHoja(ctx.indiceId, HOJA_CATEGORIAS);
      await sheets.escribir(ctx.indiceId, `${HOJA_CATEGORIAS}!A1:${ULTIMA_COLUMNA_CATEGORIAS}1`, [[...COLUMNAS_CATEGORIAS]]);
    }
    await reemplazarFilas(HOJA_CATEGORIAS, idDeHoja(hojas, HOJA_CATEGORIAS), ULTIMA_COLUMNA_CATEGORIAS,
      ctx.categorias.map(filaDeCategoria));
```

y antes de `await guardarMeta('schemaVersion', …)`:

```ts
    await guardarMeta('carpeta_borradores', ctx.borradoresId);
```

`agregarBorrador`, dentro del `if (!ctx.borradoresId)`, después de `ctx.borradoresId = carpeta.id;`:

```ts
      // Sin listar carpetas al abrir, la única forma de volver a encontrarla.
      await guardarMeta('carpeta_borradores', carpeta.id);
```

Antes de `return { arrancar, … }`:

```ts
  /** Las categorías en memoria: de la copia, de la hoja o del último reindexado. */
  function categorias(): Categoria[] {
    return ctx.categorias;
  }
```

y el `return` suma `categorias`.

- [ ] **Paso 3: ajustar los fixtures que dependían del listado al abrir**

`tests/store-busqueda.test.ts`, en el `beforeEach` de arriba, después de cargar las recetas:

```ts
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Carnes', 'carnes', 'catalogo:carnes'], ['c2', 'Postres', 'postres', 'catalogo:postres']
  ]);
```

(importar `COLUMNAS_CATEGORIAS` de `../src/categorias.js`). `abrirDeNuevo` no cambia: vuelve a cargar la hoja.

`tests/store-escritura.test.ts`, en el `beforeEach` de la línea ~98, igual, con `c1` Carnes y `c2` Postres.

`tests/compartido.test.ts`, en `armar`:

```ts
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'borradores', 'categorias']);
  …
  sheets.cargar('i1', 'categorias', [[...COLUMNAS_CATEGORIAS], ['c1', 'Pescados y mariscos', 'pescados', 'catalogo:pescados-y-mariscos']]);
```

`tests/store-borradores.test.ts`, en `armar`: la meta pasa a

```ts
  sheets.cargar('i1', 'meta', [
    ['schemaVersion', String(SCHEMA_VERSION)], ...(conCarpeta ? [['carpeta_borradores', 'bc']] : [])
  ]);
```

y los dos tests que miraban el arranque:
- «la carpeta _borradores no es una categoría»: `await store.arrancar(); await store.reconstruir(); expect(store.categorias().map(c => c.nombre)).toEqual(['Carnes']);` (sin `arranqueListo`).
- «crear la planilla crea también la hoja borradores con su encabezado»: los títulos esperados pasan a `['recetas', 'meta', 'borradores', 'categorias']`.

`tests/store-arranque.test.ts`:
- «descubre las categorías listando subcarpetas, y excluye las que empiezan con _» pasa a:

```ts
  it('las categorías salen del reindexado: las subcarpetas, sin las que empiezan con _', async () => {
    const { store } = armar(conRecetario());
    await store.arrancar();   // sin planilla: la crea y pide reindexar
    await store.reconstruir();
    expect(store.categorias().map(c => c.nombre).sort()).toEqual(['Carnes', 'Postres']);
  });
```

- «si falla listarCarpetas arranca en solo lectura sin lanzar» se reemplaza por:

```ts
  it('abrir no lista carpetas: las categorías salen del índice', async () => {
    const drive = conRecetario([{ id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] }]);
    drive.listarCarpetas = async () => { throw new Error('no debería listar al abrir'); };
    const { store, sheets } = armar(drive);
    sheets.crearPlanilla('i1');
    expect((await store.arrancar()).estado).toBe('listo');
  });
```

- [ ] **Paso 4: correr**

Correr: `npx vitest run tests/store-categorias.test.ts && npm test && npm run typecheck`
Esperado: todo en verde. Si algún test más lee `arranqueListo(r).categorias`, pasa a `store.categorias()` después de cargar o reindexar.

---

### Tarea 4: abrir por la copia

**Archivos:**
- Modificar: `src/store.ts` (`arrancar`, `InformeArranque`), `src/ui/ajustes.ts`
- Modificar: `tests/store-indice-local.test.ts`, `tests/store-informe.test.ts`, `tests/vista-ajustes.test.ts`, `tests/store-categorias.test.ts`

**Interfaces:**
- Consume: Tarea 3.
- Produce:
  - `arrancar()`: con copia de esta versión, `drive.metadatos(copia.indiceId, 'modifiedTime,trashed')`; 404 o papelera → camino completo; otro error → `solo-lectura`.
  - `InformeArranque` pierde `categorias`.
  - `renderAjustes` suma `categorias?: number`, y `fichaAlAbrir(informe, recetas, borradores, categorias)`.

- [ ] **Paso 1: tests que fallan**

Agregar a `tests/store-categorias.test.ts`:

```ts
describe('abrir por la copia', () => {
  /** Una primera apertura que reindexa y deja la copia; la segunda la usa. */
  async function segundaApertura() {
    const primera = armar();
    await primera.store.arrancar();
    await primera.store.reconstruir();
    const drive = primera.drive;
    drive.llamadas.length = 0;
    let lecturas = 0;
    const leer = primera.sheets.leer.bind(primera.sheets);
    primera.sheets.leer = async (id: string, rango: string) => { lecturas++; return leer(id, rango); };
    const store = crearStore({ drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal });
    return { store, drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal, lecturas: () => lecturas };
  }

  it('con la copia vigente, un solo pedido a Drive y ninguno a Sheets', async () => {
    const { store, drive, lecturas } = await segundaApertura();
    const r = await store.arrancar();
    await store.cargarIndice();
    expect(r.estado).toBe('listo');
    expect(drive.llamadas).toEqual([['metadatos', 'i1']]);
    expect(lecturas()).toBe(0);
    expect(store.categorias().map(c => c.id).sort()).toEqual(['c1', 'c2', 'c3']);
  });

  it('con otra fecha, lee la planilla sin buscar nada', async () => {
    const { store, drive, lecturas } = await segundaApertura();
    drive._store.get('i1')!.modifiedTime = '2030-01-01T00:00:00.000Z';
    await store.arrancar();
    await store.cargarIndice();
    expect(drive.llamadas.some(l => l[0] === 'buscarPorNombre')).toBe(false);
    expect(lecturas()).toBeGreaterThan(0);
    expect(store.categorias()).toHaveLength(3);
  });

  it('si _indice ya no está, busca como la primera vez', async () => {
    const { store, drive } = await segundaApertura();
    drive._store.get('i1')!.trashed = true;
    await store.arrancar();
    expect(drive.llamadas.some(l => l[0] === 'buscarPorNombre')).toBe(true);
  });

  it('sin red, solo-lectura: la copia no se usa para dibujar', async () => {
    const { store, drive } = await segundaApertura();
    drive.fallar('metadatos', Object.assign(new Error('sin red'), { status: 0 }));
    expect((await store.arrancar()).estado).toBe('solo-lectura');
  });
});
```

En `tests/store-indice-local.test.ts`, el test «sin red no toca la copia» pasa a hacer fallar `metadatos` en lugar de `buscarPorNombre` (con la copia vigente ya no se busca):

```ts
    drive.fallar('metadatos', Object.assign(new Error('sin red'), { status: 0 }));
```

En `tests/store-informe.test.ts`, el test «trae cuándo arrancó, la fecha de _indice y cuántas categorías hay» pasa a «trae cuándo arrancó y la fecha de _indice» y pierde la aserción de `categorias`.

En `tests/vista-ajustes.test.ts`, en el `describe` de «Al abrir»: `informe` pierde `categorias: 16`; `conInforme` pasa `categorias: 16` a `renderAjustes`; el test «una receta y un borrador van en singular» también pasa `categorias: 16`.

Correr: `npx vitest run tests/store-categorias.test.ts tests/store-indice-local.test.ts tests/store-informe.test.ts tests/vista-ajustes.test.ts`
Esperado: FAIL en «abrir por la copia» (hoy busca) y en los de Ajustes/informe hasta cambiar los tipos.

- [ ] **Paso 2: implementar `arrancar`**

`InformeArranque`: borrar `categorias: number;`.

Antes de `crearStore`:

```ts
/** Un 404 de Drive: el archivo no está, que es distinto de no poder preguntar. */
const esNoEncontrado = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { status?: unknown }).status === 404;
```

`arrancar` queda:

```ts
  async function arrancar(): Promise<ResultadoArranque> {
    const momento = new Date().toISOString();
    const avisos: string[] = [];
    const mensaje = (e: unknown): string => e instanceof Error ? e.message : String(e);
    const soloLectura = (e: unknown): ResultadoArranque => {
      // "No la encontré" no es "no existe": nunca se crea nada tras un fallo (§5.1).
      ctx.soloLectura = true;
      return { estado: 'solo-lectura', motivo: mensaje(e), avisos };
    };

    let indiceDuplicado: IndiceDuplicado | null = null;
    let planillaNueva = false;

    // Con una copia de esta versión, la raíz y `_indice` ya se conocen: alcanza
    // con la fecha de `_indice`. Un pedido en vez de dos búsquedas.
    const guardada = indiceLocal.leer();
    let conocida = guardada?.schemaVersion === SCHEMA_VERSION;
    if (guardada && conocida) {
      try {
        const archivo = await drive.metadatos(guardada.indiceId, 'modifiedTime,trashed');
        conocida = !archivo.trashed && !!archivo.modifiedTime;
        if (conocida) {
          ctx.raizId = guardada.raizId;
          ctx.indiceId = guardada.indiceId;
          ctx.modifiedTime = archivo.modifiedTime ?? '';
        }
      } catch (e) {
        if (!esNoEncontrado(e)) return soloLectura(e);
        conocida = false;
      }
    }

    if (!conocida) {
      let raices: ArchivoDrive[];
      try {
        raices = await drive.buscarPorNombre(NOMBRE_RAIZ);
      } catch (e) {
        return soloLectura(e);
      }
      const raiz = raices[0];
      if (raices.length === 0 || !raiz) return { estado: 'falta-estructura', avisos };
      if (raices.length > 1) return { estado: 'elegir-carpeta', candidatas: raices, avisos };
      ctx.raizId = raiz.id;

      let planillas: ArchivoDrive[];
      try {
        planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
      } catch (e) {
        return soloLectura(e);
      }
      if (planillas.length === 0) {
        ctx.indiceId = await crearPlanilla();
        ctx.meta = { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '' };
        planillaNueva = true;
      } else {
        if (planillas.length > 1) avisos.push('indice-duplicado');
        const ordenadas = [...planillas].sort(
          (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''));
        ctx.indiceId = ordenadas[0]?.id ?? '';
        // La búsqueda ya trae la fecha: esa es toda la verificación, sin pedidos nuevos.
        ctx.modifiedTime = ordenadas[0]?.modifiedTime ?? '';
        if (planillas.length > 1) indiceDuplicado = { cantidad: planillas.length, modifiedTime: ctx.modifiedTime };
      }
    }

    const comparacion = compararCopia();
    let reindexado: MotivoReindexado = planillaNueva ? 'planilla-nueva' : '';
    if (!planillaNueva) {
      if (comparacion.estado === 'coincide' && comparacion.copia) usarCopia(comparacion.copia);
      else ctx.meta = await leerMeta();
      if (ctx.meta['reconstruccion_en_curso']) reindexado = 'a-medias';
      if (Number(ctx.meta['schemaVersion']) !== SCHEMA_VERSION) reindexado = 'esquema';
    }

    const informe: InformeArranque = {
      momento, indiceModificado: ctx.modifiedTime,
      copia: comparacion.estado, copiaModificada: comparacion.copia?.modifiedTime ?? '',
      reindexado
    };

    return {
      estado: 'listo', raizId: ctx.raizId, indiceId: ctx.indiceId,
      reconstruir: reindexado !== '', indiceDuplicado, informe, avisos
    };
  }
```

- [ ] **Paso 3: Ajustes cuenta las categorías aparte**

`src/ui/ajustes.ts`: `OpcionesAjustes` suma

```ts
  /** Cuántas categorías hay ahora, para la ficha «Al abrir». */
  categorias?: number;
```

la desestructuración de `renderAjustes` suma `categorias = 0`, la llamada pasa a `fichaAlAbrir(informe, recetas, borradores, categorias)`, y `fichaAlAbrir` recibe `categorias: number` como cuarto parámetro y deja de desestructurarla de `informe`.

- [ ] **Paso 4: correr**

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 5: dibujar desde las categorías registradas

**Archivos:**
- Modificar: `src/ui/categorias.ts`, `src/main.ts`, `tests/categorias.test.ts`, `tests/main-rutas.test.ts`, `tests/main-nueva-receta.test.ts`, `tests/main-estado-vista.test.ts`

**Interfaces:**
- Consume: `Categoria`, `CLAVES_COLOR`, `store.categorias()`.
- Produce: `registrarCategorias(lista: Categoria[]): void`; `colorCategoria(nombre: unknown): string` y `fotoCategoria(nombre: unknown): string | null` con la misma firma; `slugCategoria` sin cambios.

- [ ] **Paso 1: test que falla**

Reemplazar `tests/categorias.test.ts` por:

```ts
// La identidad visual sale de las propiedades de la carpeta —color y foto—, que
// `main` registra desde el índice. Lo que importa probar es que la búsqueda es
// por nombre, que una categoría renombrada conserva lo suyo, y que lo que falta
// no rompe nada.
import { describe, it, expect, beforeEach } from 'vitest';
import { colorCategoria, fotoCategoria, slugCategoria, registrarCategorias } from '../src/ui/categorias.js';

describe('categorias', () => {
  beforeEach(() => registrarCategorias([
    { id: 'c1', nombre: 'Pescados y mariscos', color: 'pescados', foto: 'catalogo:pescados-y-mariscos' },
    { id: 'c2', nombre: 'Mis tartas', color: 'tartas', foto: 'catalogo:tartas-y-empanadas' },
    { id: 'c3', nombre: 'Fiambres', color: '', foto: '' },
    { id: 'c4', nombre: 'Rara', color: 'fucsia', foto: 'drive:abc' },
    { id: 'c5', nombre: 'Otros', color: 'otros', foto: 'catalogo:otros' }
  ]));

  it('el slug sigue siendo el del nombre', () => {
    expect(slugCategoria('Pescados y mariscos')).toBe('pescados-y-mariscos');
  });

  it('color y foto salen de las claves registradas', () => {
    expect(colorCategoria('Pescados y mariscos')).toBe('var(--cat-pescados)');
    expect(fotoCategoria('Pescados y mariscos')).toMatch(/pescados-y-mariscos/);
  });

  it('una categoría renombrada conserva su color y su foto', () => {
    expect(colorCategoria('Mis tartas')).toBe('var(--cat-tartas)');
    expect(fotoCategoria('Mis tartas')).toMatch(/tartas-y-empanadas/);
  });

  it('Otros lleva el neutro y su foto', () => {
    expect(colorCategoria('Otros')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Otros')).not.toBeNull();
  });

  it('sin propiedades, con una clave desconocida o sin registrar: neutro y sin foto', () => {
    expect(colorCategoria('Fiambres')).toBe('var(--cat-otros)');
    expect(fotoCategoria('Fiambres')).toBeNull();
    expect(colorCategoria('Rara')).toBe('var(--cat-otros)');
    expect(colorCategoria('Sin categorizar')).toBe('var(--cat-otros)');
  });

  it('una foto de Drive todavía no se dibuja', () => {
    expect(fotoCategoria('Rara')).toBeNull();
  });

  it('defendé: sin nombre no lanza', () => {
    expect(() => colorCategoria(undefined)).not.toThrow();
    expect(() => fotoCategoria(null)).not.toThrow();
  });
});
```

Correr: `npx vitest run tests/categorias.test.ts`
Esperado: FAIL (`registrarCategorias` no existe).

- [ ] **Paso 2: implementar `src/ui/categorias.ts`**

Reemplazar el archivo entero por:

```ts
import { slugArchivo } from '../recipe.js';
import { CLAVES_COLOR } from '../categorias.js';
import type { Categoria } from '../tipos.js';

/**
 * Identidad visual de cada categoría: una foto y un color.
 *
 * La foto identifica —es lo que se reconoce de un vistazo, sin aprender nada—
 * y el color hilvana: el mismo tono aparece en el filo del tile, en el punto de
 * las tarjetas y en la línea de contexto de la receta.
 *
 * Las dos cosas son propiedades de la carpeta en Drive, y llegan acá desde el
 * índice: `main` registra las categorías y este módulo sólo traduce claves. No
 * conoce ningún nombre de categoría; las predefinidas están en
 * `src/categorias.ts`.
 */

/**
 * Las imágenes se importan desde `src/` y no desde `public/` a propósito: así
 * Vite les pone hash y quedan bajo `/assets/`, que es la única ruta que
 * `sw.js` sirve caché-primero. En `public/` caerían en la regla general, que
 * es red-primero, y serían 16 pedidos de red en cada apertura para archivos
 * que no cambian nunca.
 */
const IMAGENES = import.meta.glob<string>('../categorias/*.webp', {
  eager: true, query: '?url', import: 'default'
});

/** El catálogo: clave → URL. La clave es el nombre del `.webp`. */
const CATALOGO = new Map<string, string>(
  Object.entries(IMAGENES).map(([ruta, url]) => [
    (ruta.split('/').pop() ?? '').replace(/\.webp$/, ''),
    url
  ])
);

/**
 * El neutro de `Otros`: también el respaldo de una categoría sin color o con
 * una clave que la paleta no tiene (design-system §2.3).
 */
const NEUTRO = 'var(--cat-otros)';

let registradas = new Map<string, Categoria>();

/** Las categorías del índice. `main` las registra al arrancar y después de reindexar. */
export function registrarCategorias(lista: Categoria[]): void {
  registradas = new Map(lista.map(c => [c.nombre, c]));
}

/** Del nombre de la carpeta al slug, igual que el nombre del archivo de receta. */
export function slugCategoria(nombre: unknown): string {
  return slugArchivo(nombre, []).replace(/\.md$/, '');
}

/** El color de una categoría. Sin clave válida cae en el neutro, sin romper nada. */
export function colorCategoria(nombre: unknown): string {
  const color = registradas.get(String(nombre ?? ''))?.color ?? '';
  return (CLAVES_COLOR as readonly string[]).includes(color) ? `var(--cat-${color})` : NEUTRO;
}

/**
 * La URL de la foto, o null. Sólo las del catálogo se dibujan: una foto de
 * Drive (`drive:<id>`) llega en la etapa 3.
 */
export function fotoCategoria(nombre: unknown): string | null {
  const foto = registradas.get(String(nombre ?? ''))?.foto ?? '';
  return foto.startsWith('catalogo:') ? CATALOGO.get(foto.slice('catalogo:'.length)) ?? null : null;
}
```

- [ ] **Paso 3: `src/main.ts`**

- Import: `import { registrarCategorias } from './ui/categorias.js';`
- Borrar `categoriasDelArranque` con su comentario, y sus tres usos (`renderEditor` en `editar`, en `nueva` y en `conError`) pasan a `categorias: store.categorias()`.
- En `arrancar`, después de `if (estadoArranque.reconstruir) await reconstruir(); else await store.cargarIndice();`:

```ts
  registrarCategorias(store.categorias());
```

- En la función `reconstruir`, después de `ignorados = r.ignorados;`:

```ts
    registrarCategorias(store.categorias());
```

- En `render`, caso `'ajustes'`, `renderAjustes` suma `categorias: store.categorias().length`.

- [ ] **Paso 4: dobles de `main`**

`tests/main-rutas.test.ts`, `storeFake` suma:

```ts
  categorias: () => [{ id: 'c1', nombre: 'Carnes', color: 'carnes', foto: 'catalogo:carnes' }],
```

`tests/main-nueva-receta.test.ts` y `tests/main-estado-vista.test.ts`, `storeFake` suma `categorias: () => [],`.

- [ ] **Paso 5: correr**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

---

### Tarea 6: documentos, y mostrar los cambios

**Archivos:**
- Modificar: `product-design/ux/design-system.md` §2.3, `CLAUDE.md`, `SETUP.md:36`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`

- [ ] **Paso 1: `design-system.md` §2.3**

Al párrafo que empieza «Agregar una categoría es crear una carpeta en Drive…» (línea ~151), sumar al final: «`[2026-09-13]` La tabla de las 16 predefinidas —nombre, clave de color y foto— vive en `src/categorias.ts`; el color y la foto de cada carpeta son propiedades suyas en Drive, así que renombrarla no los pierde.»

- [ ] **Paso 2: `CLAUDE.md`**

- «Ubicación en Drive», la oración «**La app no hardcodea ninguno de esos ids:** descubre las categorías listando las subcarpetas, así que agregar una categoría es crear una carpeta en Drive.» → «**La app no hardcodea ninguno de esos ids.** Las categorías salen de la hoja `categorias` de `_indice`, que el reindexado arma listando las subcarpetas: una carpeta nueva aparece al reindexar. Las 16 predefinidas —nombre, color y foto— están en `src/categorias.ts`, y el color y la foto de cada carpeta son sus `appProperties` en Drive.»
- Fila «Derivar el color de categoría de un hash del nombre»: agregar al final «Desde el 2026-09-13 el color es una propiedad de la carpeta; la tabla de predefinidas está en `src/categorias.ts`.»
- Sección «Las fotos de las categorías»: la oración «El nombre del archivo es el slug de la carpeta: así se agrega una foto nueva sin tocar código. Una categoría sin foto se dibuja con su color plano y no rompe nada.» → «El nombre del archivo es la clave del catálogo: sumar una foto al catálogo es agregar un `.webp`, y sumar una predefinida es además una fila en `src/categorias.ts`. Cada carpeta guarda su foto como `appProperties` (`foto=catalogo:<clave>`); una categoría sin foto se dibuja con su color plano y no rompe nada.»
- Estado de arriba: un párrafo nuevo «**Hecho el 2026-09-13 — categorías en el índice (P15/P19, etapa 1):** el color y la foto son propiedades de la carpeta, las predefinidas viven en `src/categorias.ts`, la hoja `categorias` entra en la copia local y abrir con la copia vigente es un pedido. Spec en `docs/superpowers/specs/2026-09-13-categorias-en-el-indice-design.md`. **Falta probarlo en el teléfono.**», y la cantidad de tests al número que dé `npm test`.

- [ ] **Paso 3: `SETUP.md`**

La oración de la línea ~36 que dice que la app descubre las categorías listando subcarpetas y que una categoría nueva no toca el código pasa a: «La app arma sus categorías al reindexar, listando las subcarpetas de `Recetario/`: una carpeta nueva aparece después de *Ajustes → Reindexar*. Si su nombre coincide con una de las 16 predefinidas, toma su color y su foto; si no, se dibuja con el color neutro.»

- [ ] **Paso 4: `decision-log.md`**

Versión 2.0, y al final de la tabla:

```markdown
| 2026-09-13 | **El color y la foto de una categoría son `appProperties` de su carpeta** (`color=<clave>`, `foto=catalogo:<clave>`). Las 16 predefinidas viven en una tabla, `src/categorias.ts`. `_indice` suma una hoja `categorias` derivada de las carpetas, que entra en la copia local; abrir con la copia vigente pide sólo la fecha de `_indice`. | Etapa 1 de P15/P19. El color y la foto salían del slug del nombre, así que renombrar una carpeta los perdía, y la definición de las predefinidas estaba repartida en tres archivos. Otra persona usando la app tendría sus propias carpetas. | Una clave de predefinida en la carpeta y el color en la tabla; guardar la personalización en `_indice`, que es un cache que se borra para repararlo; seguir listando carpetas en cada apertura. | Las propiedades viajan con la carpeta y sobreviven al renombre y a borrar `_indice`. Una sola forma de leer cualquier categoría, predefinida o nueva. | `SCHEMA_VERSION` 5. Una carpeta creada o renombrada a mano aparece al reindexar. `carpeta_borradores` en `meta`. |
```

- [ ] **Paso 5: `BACKLOG.md`**

En la fila de **P19**, agregar antes del `|` final: « **Etapa 1 hecha** `[2026-09-13]`: color y foto como `appProperties`, predefinidas en `src/categorias.ts`, hoja `categorias` en la copia local, apertura de un pedido. **Decidido para la etapa 2:** la estructura inicial se crea con las 16 predefinidas, con sus nombres y fotos; sólo a partir de ellas el usuario agrega o borra categorías en la etapa 3.»

- [ ] **Paso 6: verificación final y mostrar los cambios**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde; la cantidad de tests coincide con `CLAUDE.md`.

Correr: `git status --short && git diff --stat`, y presentarle al usuario el resumen y el diff para revisar. **No commitear ni pushear.**
