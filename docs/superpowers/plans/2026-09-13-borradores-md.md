# Borradores como `.md` — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Objetivo:** que cada borrador sea un `.md` en `Recetario/_borradores/`, listado desde una hoja `borradores` de `_indice` que entra en la copia local, con las operaciones en el store, y que borrar mande a la papelera.

**Arquitectura:** `src/borrador.ts` tiene el formato del `.md` y la fila de la hoja. `src/store.ts` suma la hoja a la planilla, a la copia, a la carga y al reindexado, y hace las operaciones (`borradores`, `borrador`, `agregarBorrador`, `editarBorrador`, `descartarBorrador`) con la lógica de filas generalizada para las dos hojas. `src/borradores.ts` se elimina; `compartido.ts` y `main.ts` pasan a usar el store.

**Stack:** TypeScript estricto + Vite, sin framework. Vitest en `environment: 'node'` con dobles a mano.

**Spec:** `docs/superpowers/specs/2026-09-13-borradores-md-design.md` — leerlo antes de empezar. Se apoya en `docs/superpowers/specs/2026-09-13-indice-local-design.md`.

## Restricciones globales

- **Idioma:** español rioplatense en comentarios, nombres, UI y commits.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess` (sólo `src`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Imports internos con `.js`; tipos con `import type`.
- **El borrador es su entidad:** título, fuente, nota y `capturado`. Su `.md` no lo lee `recipe.ts`.
- **Carpeta:** `Recetario/_borradores/`, nombre en `NOMBRE_BORRADORES` de `src/config.ts`. Se crea al agregar el primer borrador.
- **Hoja:** `borradores`, columnas `id_archivo | nombre_archivo | titulo | capturado`.
- **`SCHEMA_VERSION` = 4.**
- **Cada escritura en `_indice` termina en `persistir()`.**
- **`drive.borrar` manda a la papelera:** `PATCH /files/{id}` con `{ "trashed": true }`.
- **Verificación de cada tarea:** `npm test` y `npm run typecheck` en verde antes de commitear.
- **Se trabaja sobre `main`**, un commit por tarea, push al final.
- **Commits** terminan con `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Mapa de archivos

| Archivo | Qué cambia |
|---|---|
| `src/drive.ts` | `borrar` pasa a papelera. |
| `src/borrador.ts` | **Nuevo.** `parseBorrador`, `serializeBorrador`, `COLUMNAS_BORRADORES`, `filaDeBorrador`, `entradaBorradorDesdeFila`. |
| `src/tipos.ts` | Suma `EntradaBorrador`; corrige el comentario de `Borrador`. |
| `src/sheets.ts` | Suma `HOJA_BORRADORES`; `rangoDeFila` acepta hoja y cantidad de columnas. |
| `src/config.ts` | `SCHEMA_VERSION` = 4; comentario de `NOMBRE_BORRADORES`. |
| `src/indice-local.ts` | `CopiaIndice` suma `borradores`. |
| `src/store.ts` | La hoja, la carpeta, la copia, el reindexado y las cinco operaciones. |
| `src/compartido.ts` | `convertirBorrador` usa `store.descartarBorrador`. |
| `src/main.ts` | Usa el store; `borradorLeido` reemplaza el cache de P17; reindexar reemplaza a cargar. |
| `src/ui/borradores.ts` | La lista recibe `EntradaBorrador[]`. |
| `src/ui/captura.ts` | Comentario. |
| `src/borradores.ts`, `tests/borradores.test.ts` | **Se eliminan.** |
| `tests/dobles.ts` | `borrar` del Drive falso marca `trashed`. |
| `tests/drive-borrar.test.ts`, `tests/borrador.test.ts`, `tests/store-borradores.test.ts` | **Nuevos.** |
| `tests/store-escritura.test.ts`, `tests/store-arranque.test.ts`, `tests/store-indice-local.test.ts`, `tests/indice-local.test.ts`, `tests/compartido.test.ts`, `tests/main-*.test.ts`, `tests/vista-borradores.test.ts` | Ajustes. |

---

### Tarea 1: borrar manda a la papelera

**Archivos:**
- Modificar: `src/drive.ts:133`
- Modificar: `tests/dobles.ts` (`borrar` del Drive falso)
- Modificar: `tests/store-escritura.test.ts:156,164,180`, `tests/store-arranque.test.ts` (el test «si falla a mitad de crear la planilla…»)
- Crear: `tests/drive-borrar.test.ts`

**Interfaces:**
- Produce: `drive.borrar(id: string): Promise<ArchivoDrive>` — ahora `PATCH` con `trashed: true`. El Drive falso deja el archivo con `trashed: true` en `_store` (y `vivos()` ya lo excluye de búsquedas y listados).

- [ ] **Paso 1: test que falla**

Crear `tests/drive-borrar.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('drive.borrar()', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ id: 'f1', trashed: true })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('manda el archivo a la papelera: PATCH con trashed, no DELETE', async () => {
    // DELETE en la API v3 borra para siempre, sin pasar por la papelera, y
    // la papelera es la red de seguridad del usuario (E04).
    await drive.borrar('f1');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/drive/v3/files/f1');
    expect(opciones.method).toBe('PATCH');
    expect(JSON.parse(String(opciones.body))).toEqual({ trashed: true });
  });
});
```

Correr: `npx vitest run tests/drive-borrar.test.ts`
Esperado: FAIL, `opciones.method` es `DELETE`.

- [ ] **Paso 2: implementar**

En `src/drive.ts`, la línea de `borrar` queda:

```ts
    /**
     * Manda el archivo a la papelera de Drive. `DELETE` lo borraría para
     * siempre, y la papelera es la red de seguridad, que es del usuario (E04).
     */
    borrar: (id: string) => pedir<ArchivoDrive>(`/files/${id}?fields=id,trashed`, {
      method: 'PATCH', body: JSON.stringify({ trashed: true })
    })
```

En `tests/dobles.ts`, `borrar` del Drive falso queda:

```ts
    // Como el real: a la papelera, no fuera de `_store`. `vivos()` ya lo
    // saca de búsquedas y listados.
    async borrar(id: string) { const a = exigir(id); a.trashed = true; return a; }
```

- [ ] **Paso 3: ajustar los tests que miraban el archivo desaparecer**

En `tests/store-escritura.test.ts`, las tres aserciones `expect(drive._store.has(X)).toBe(false)` (líneas 156, 164 y 180) pasan a:

```ts
    expect(drive._store.get('r1')?.trashed).toBe(true);
```

(con `r.id` en lugar de `'r1'` en la línea 164).

En `tests/store-arranque.test.ts`, el test «si falla a mitad de crear la planilla, borra el archivo a medio hacer…», la última línea pasa a:

```ts
    expect([...drive._store.values()].some(a => a.name === '_indice' && !a.trashed)).toBe(false);
```

- [ ] **Paso 4: correr**

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 5: commit**

```bash
git add src/drive.ts tests/dobles.ts tests/drive-borrar.test.ts tests/store-escritura.test.ts tests/store-arranque.test.ts
git commit -m "$(cat <<'EOF'
Borrar desde la app manda a la papelera de Drive

DELETE en la API v3 borra para siempre; E04 dice que el archivo va a la
papelera. Ahora es PATCH con trashed: true.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 2: el formato del borrador

**Archivos:**
- Crear: `src/borrador.ts`
- Crear: `tests/borrador.test.ts`
- Modificar: `src/tipos.ts:132-145`

**Interfaces:**
- Produce:
  - En `tipos.ts`: `export interface EntradaBorrador { id_archivo: string; nombre_archivo: string; titulo: string; capturado: string }`.
  - En `borrador.ts`: `export type ContenidoBorrador = Omit<Borrador, 'id'>`; `parseBorrador(texto: string): ContenidoBorrador`; `serializeBorrador(b: ContenidoBorrador): string`; `COLUMNAS_BORRADORES` (`readonly ['id_archivo','nombre_archivo','titulo','capturado']`); `filaDeBorrador(e: EntradaBorrador): string[]`; `entradaBorradorDesdeFila(f: string[]): EntradaBorrador`.

- [ ] **Paso 1: tipos**

En `src/tipos.ts`, el bloque de `Borrador` queda:

```ts
/**
 * Un borrador: un `.md` en `Recetario/_borradores/`. Es su propia entidad —título,
 * fuente y nota—, no una receta incompleta.
 */
export interface Borrador {
  /** El id del archivo en Drive. */
  id: string;
  titulo: string;
  /** Texto libre: una URL o "libro de pescados, pág. 84". */
  fuente: string;
  /** Lo que haya que recordar del borrador. Texto libre y opcional. */
  nota: string;
  /** ISO. El orden de la lista es por acá, lo más viejo primero. */
  capturado: string;
}

/** Una fila de la hoja `borradores` del índice: lo que alcanza para la lista y el contador. */
export interface EntradaBorrador {
  id_archivo: string;
  nombre_archivo: string;
  titulo: string;
  capturado: string;
}
```

- [ ] **Paso 2: test que falla**

Crear `tests/borrador.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  parseBorrador, serializeBorrador, filaDeBorrador, entradaBorradorDesdeFila, COLUMNAS_BORRADORES
} from '../src/borrador.js';

const borrador = {
  titulo: 'Pollo al disco', fuente: 'https://instagram.com/reel/abc',
  capturado: '2026-09-13T10:30:00.000Z', nota: 'Con cerveza.'
};

describe('el .md de un borrador', () => {
  it('se escribe con tres claves en el frontmatter y la nota como cuerpo', () => {
    expect(serializeBorrador(borrador)).toBe(
      '---\ntitulo: Pollo al disco\nfuente: https://instagram.com/reel/abc\n' +
      'capturado: 2026-09-13T10:30:00.000Z\n---\n\nCon cerveza.\n'
    );
  });

  it('sin nota, termina en el frontmatter', () => {
    expect(serializeBorrador({ ...borrador, nota: '' })).toMatch(/---\n$/);
  });

  it('ida y vuelta, con una nota de varias líneas que tiene ## y ---', () => {
    const nota = 'Una focaccia.\n\n## Ingredientes\n- Harina\n\n---\n\nOtra cosa: con dos puntos.';
    expect(parseBorrador(serializeBorrador({ ...borrador, nota }))).toEqual({ ...borrador, nota });
  });

  it('un título con dos puntos se lee entero', () => {
    expect(parseBorrador(serializeBorrador({ ...borrador, titulo: 'Pan: el de campo' })).titulo)
      .toBe('Pan: el de campo');
  });

  it('sin frontmatter, todo es nota y el título queda vacío', () => {
    expect(parseBorrador('Algo suelto.\n')).toEqual({ titulo: '', fuente: '', capturado: '', nota: 'Algo suelto.' });
  });

  it('una clave desconocida se ignora', () => {
    const texto = '---\ntitulo: A\ntags: [x]\n---\n\nnota\n';
    expect(parseBorrador(texto)).toEqual({ titulo: 'A', fuente: '', capturado: '', nota: 'nota' });
  });

  it('con saltos de línea de Windows se lee igual', () => {
    expect(parseBorrador('---\r\ntitulo: A\r\n---\r\n\r\nnota\r\n').titulo).toBe('A');
  });
});

describe('la fila de la hoja borradores', () => {
  it('tiene cuatro columnas, en el orden de COLUMNAS_BORRADORES', () => {
    const entrada = { id_archivo: 'b1', nombre_archivo: 'a.md', titulo: 'A', capturado: '2026-09-13' };
    expect(COLUMNAS_BORRADORES).toEqual(['id_archivo', 'nombre_archivo', 'titulo', 'capturado']);
    expect(filaDeBorrador(entrada)).toEqual(['b1', 'a.md', 'A', '2026-09-13']);
    expect(entradaBorradorDesdeFila(filaDeBorrador(entrada))).toEqual(entrada);
  });

  it('una fila corta se lee con vacíos', () => {
    expect(entradaBorradorDesdeFila(['b1'])).toEqual({ id_archivo: 'b1', nombre_archivo: '', titulo: '', capturado: '' });
  });
});
```

Correr: `npx vitest run tests/borrador.test.ts`
Esperado: FAIL, no resuelve `../src/borrador.js`.

- [ ] **Paso 3: implementar**

Crear `src/borrador.ts`:

```ts
/**
 * El `.md` de un borrador: título, fuente y cuándo se capturó en el
 * frontmatter, y la nota como cuerpo entero. Es un formato propio —un borrador
 * no es una receta incompleta—, y no comparte parser con `recipe.ts`.
 *
 * También vive acá su fila de la hoja `borradores` del índice.
 */
import type { Borrador, EntradaBorrador } from './tipos.js';

/** Lo que dice el archivo. El id es de Drive, no del contenido. */
export type ContenidoBorrador = Omit<Borrador, 'id'>;

export const COLUMNAS_BORRADORES = ['id_archivo', 'nombre_archivo', 'titulo', 'capturado'] as const;

const CLAVES = ['titulo', 'fuente', 'capturado'] as const;
type Clave = (typeof CLAVES)[number];
const esClave = (c: string): c is Clave => (CLAVES as readonly string[]).includes(c);

export function parseBorrador(texto: string): ContenidoBorrador {
  const borrador: ContenidoBorrador = { titulo: '', fuente: '', capturado: '', nota: '' };
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  let cuerpo = lineas;
  if (lineas[0] === '---') {
    const cierre = lineas.indexOf('---', 1);
    if (cierre > 0) {
      for (const linea of lineas.slice(1, cierre)) {
        const m = linea.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
        const clave = m?.[1] ?? '';
        // Lo que no es de un borrador se ignora: no se conserva al reescribir.
        if (esClave(clave)) borrador[clave] = (m?.[2] ?? '').trim();
      }
      cuerpo = lineas.slice(cierre + 1);
    }
  }
  borrador.nota = cuerpo.join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
  return borrador;
}

export function serializeBorrador(b: ContenidoBorrador): string {
  const frontmatter = `---\ntitulo: ${b.titulo}\nfuente: ${b.fuente}\ncapturado: ${b.capturado}\n---\n`;
  return b.nota ? `${frontmatter}\n${b.nota}\n` : frontmatter;
}

export const filaDeBorrador = (e: EntradaBorrador): string[] =>
  [e.id_archivo, e.nombre_archivo, e.titulo, e.capturado];

export const entradaBorradorDesdeFila = (f: string[]): EntradaBorrador => ({
  id_archivo: f[0] ?? '', nombre_archivo: f[1] ?? '', titulo: f[2] ?? '', capturado: f[3] ?? ''
});
```

- [ ] **Paso 4: correr**

Correr: `npx vitest run tests/borrador.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 5: commit**

```bash
git add src/borrador.ts src/tipos.ts tests/borrador.test.ts
git commit -m "$(cat <<'EOF'
El .md de un borrador: título, fuente y capturado, y la nota como cuerpo

Formato propio, sin compartir parser con las recetas, y la fila de la hoja
borradores del índice.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 3: el store lee los borradores del índice

**Archivos:**
- Modificar: `src/config.ts`, `src/sheets.ts`, `src/indice-local.ts`, `src/store.ts`
- Modificar: `tests/indice-local.test.ts`, `tests/store-indice-local.test.ts` (las copias de fixture suman `borradores: []`)
- Crear: `tests/store-borradores.test.ts`

**Interfaces:**
- Consume: `borrador.ts` y `EntradaBorrador` de la Tarea 2.
- Produce:
  - `sheets.ts`: `export const HOJA_BORRADORES = 'borradores'`; `rangoDeFila(fila: unknown, hoja = HOJA_RECETAS, columnas: number = COLUMNAS.length): string`.
  - `CopiaIndice.borradores: { fila: number; entrada: EntradaBorrador }[]`.
  - `store.borradores(): EntradaBorrador[]` (ordenados por `capturado`), `store.borrador(id): Promise<Borrador>`.
  - Internas del store para la Tarea 4: `ctx.borradoresId`, `entradasBorradores: EntradaBorrador[]`, `filasBorradores: Map<string, number>`, `ULTIMA_COLUMNA_BORRADORES`, `MIME_CARPETA`, `conFila()`.

- [ ] **Paso 1: `config.ts`, `sheets.ts` e `indice-local.ts`**

`src/config.ts`: `NOMBRE_BORRADORES` y `SCHEMA_VERSION` quedan:

```ts
/** La carpeta de los borradores, un `.md` por borrador. El `_` la deja fuera de las categorías. */
export const NOMBRE_BORRADORES = '_borradores';

// Subir esta versión fuerza una reconstrucción del índice en el próximo
// arranque. Fue a 2 con el rediseño —la fila sumó `foto` y `completa`—, a 3
// el 2026-09-12 —la columna `completa` pasó de guardar un cálculo a guardar lo
// que dice el `.md`— y a 4 el 2026-09-13, cuando la planilla sumó la hoja
// `borradores`.
export const SCHEMA_VERSION = 4;
```

`src/sheets.ts`: después de `HOJA_META`:

```ts
export const HOJA_BORRADORES = 'borradores';
```

y `rangoDeFila` queda:

```ts
/**
 * Genera un rango A1 para una fila entera (de A a la última columna), de la
 * hoja de recetas salvo que se diga otra.
 * Lanza si fila no es un entero >= 1: la fila 1 son los encabezados y no hay fallback seguro.
 * Un rango mal calculado es un error de programación, no un dato malo del usuario.
 */
export const rangoDeFila = (fila: unknown, hoja = HOJA_RECETAS, columnas: number = COLUMNAS.length): string => {
  // El typeof es lo que estrecha el tipo; Number.isInteger solo devuelve boolean.
  if (typeof fila !== 'number' || !Number.isInteger(fila) || fila < 1) {
    throw new Error(`La fila tiene que ser un entero mayor o igual a 1; recibí ${JSON.stringify(fila)}`);
  }
  return `${hoja}!A${fila}:${letra(columnas - 1)}${fila}`;
};
```

`src/indice-local.ts`: el import pasa a `import type { Entrada, EntradaBorrador } from './tipos.js';`, `CopiaIndice` suma después de `filas`:

```ts
  /** La hoja `borradores`, con el mismo criterio que `filas`. */
  borradores: { fila: number; entrada: EntradaBorrador }[];
```

y `esCopia` suma `&& Array.isArray(x['borradores'])` al final.

En `tests/indice-local.test.ts`, la `copia` del fixture suma `borradores: []`. En `tests/store-indice-local.test.ts`, `copiaVigente` suma `borradores: [],` antes de `...cambios`.

- [ ] **Paso 2: tests que fallan**

Crear `tests/store-borradores.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES, serializeBorrador } from '../src/borrador.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { arranqueListo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const FECHA = '2026-09-13T10:00:00.000Z';

const md = (titulo: string, capturado: string, nota = '', fuente = ''): string =>
  serializeBorrador({ titulo, fuente, capturado, nota });

/**
 * Un Recetario con `_borradores/` y dos borradores: el más nuevo primero en la
 * hoja, para ver que la lista ordena. `conCarpeta: false` arma uno sin la
 * carpeta, y `hojas` elige qué hojas tiene la planilla.
 */
async function armar({
  conCarpeta = true,
  hojas = ['recetas', 'meta', 'borradores'],
  copia = null as CopiaIndice | null
} = {}) {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Carnes', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'], modifiedTime: FECHA },
    ...(conCarpeta ? [
      { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
      { id: 'b1', name: 'focaccia.md', parents: ['bc'], contenido: md('Focaccia', '2026-09-10T00:00:00.000Z', 'Con romero.', 'https://x/1') },
      { id: 'b2', name: 'rabas.md', parents: ['bc'], contenido: md('Rabas', '2026-09-01T00:00:00.000Z') }
    ] : [])
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', hojas);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  if (hojas.includes('borradores')) {
    sheets.cargar('i1', 'borradores', [
      [...COLUMNAS_BORRADORES],
      ['b1', 'focaccia.md', 'Focaccia', '2026-09-10T00:00:00.000Z'],
      ['b2', 'rabas.md', 'Rabas', '2026-09-01T00:00:00.000Z']
    ]);
  }
  const lecturas: string[] = [];
  const leer = sheets.leer.bind(sheets);
  sheets.leer = async (id: string, rango: string) => { lecturas.push(rango); return leer(id, rango); };
  const indiceLocal = indiceLocalFalso(copia);
  const store = crearStore({ drive, sheets, indiceLocal });
  return { drive, sheets, indiceLocal, store, lecturas };
}

/** Cada fila de borradores de la copia apunta a la fila de la hoja donde está ese borrador. */
async function borradoresCoincidenConLaPlanilla(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const hoja = await sheets.leer('i1', 'borradores!A1:D100');
  expect(copia).not.toBeNull();
  expect(copia!.borradores).toHaveLength(hoja.length - 1);
  for (const { fila, entrada } of copia!.borradores) {
    expect(hoja[fila - 1]?.[0], `fila ${fila}`).toBe(entrada.id_archivo);
  }
}

describe('los borradores al abrir', () => {
  it('se cargan de la hoja borradores, y la lista va de lo más viejo a lo más nuevo', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Focaccia']);
  });

  it('entran en la copia local con su número de fila', async () => {
    const { store, sheets, indiceLocal } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('una copia que sirve trae los borradores sin leer Sheets', async () => {
    const primera = await armar();
    await primera.store.arrancar();
    await primera.store.cargarIndice();

    const segunda = await armar({ copia: primera.indiceLocal.actual() });
    await segunda.store.arrancar();
    await segunda.store.cargarIndice();

    expect(segunda.lecturas).toEqual([]);
    expect(segunda.store.borradores()).toEqual(primera.store.borradores());
  });

  it('borrador(id) lee y parsea su .md', async () => {
    const { store } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    expect(await store.borrador('b1')).toEqual({
      id: 'b1', titulo: 'Focaccia', fuente: 'https://x/1',
      capturado: '2026-09-10T00:00:00.000Z', nota: 'Con romero.'
    });
  });

  it('la carpeta _borradores no es una categoría', async () => {
    const { store } = await armar();
    expect(arranqueListo(await store.arrancar()).categorias.map(c => c.nombre)).toEqual(['Carnes']);
  });

  it('crear la planilla crea también la hoja borradores con su encabezado', async () => {
    const drive = driveFalso([{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] }]);
    const sheets = sheetsFalso();
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    const id = store._ctx.indiceId;
    expect((await sheets.hojas(id)).map(h => h.title)).toEqual(['recetas', 'meta', 'borradores']);
    expect((await sheets.leer(id, 'borradores!A1:D1'))[0]).toEqual([...COLUMNAS_BORRADORES]);
  });
});

describe('reindexar los borradores', () => {
  it('rearma la hoja borradores desde la carpeta', async () => {
    const { store, sheets, drive } = await armar();
    await store.arrancar();
    await store.cargarIndice();
    // Un borrador escrito por fuera: sólo aparece al reindexar.
    drive._store.set('b3', {
      id: 'b3', name: 'pan.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: md('Pan', '2026-09-05T00:00:00.000Z')
    });

    await store.reconstruir();

    expect(store.borradores().map(b => b.titulo)).toEqual(['Rabas', 'Pan', 'Focaccia']);
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja).toHaveLength(4);
    expect(hoja.slice(1).map(f => f[0]).sort()).toEqual(['b1', 'b2', 'b3']);
  });

  it('crea la hoja borradores si la planilla no la tiene', async () => {
    const { store, sheets, indiceLocal } = await armar({ hojas: ['recetas', 'meta'] });
    await store.arrancar();
    await store.reconstruir();
    const hoja = await sheets.leer('i1', 'borradores!A1:D100');
    expect(hoja[0]).toEqual([...COLUMNAS_BORRADORES]);
    expect(hoja).toHaveLength(3);
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('un borrador sin título se saltea y se nombra en ignorados', async () => {
    const { store, drive } = await armar();
    await store.arrancar();
    drive._store.set('b9', {
      id: 'b9', name: 'suelto.md', parents: ['bc'], mimeType: 'text/markdown',
      modifiedTime: FECHA, contenido: 'sin frontmatter'
    });
    const r = await store.reconstruir();
    expect(r.ignorados).toContain('suelto.md');
    expect(store.borradores().map(b => b.id_archivo)).not.toContain('b9');
  });

  it('sin carpeta _borradores, la hoja queda vacía', async () => {
    const { store, sheets } = await armar({ conCarpeta: false });
    await store.arrancar();
    await store.reconstruir();
    expect(store.borradores()).toEqual([]);
    expect(await sheets.leer('i1', 'borradores!A1:D100')).toHaveLength(1);
  });

  it('el progreso cuenta recetas y borradores juntos', async () => {
    const { store } = await armar();
    await store.arrancar();
    const vistos: number[] = [];
    await store.reconstruir(p => vistos.push(p.total));
    expect(vistos.at(-1)).toBe(2);
  });
});
```

Correr: `npx vitest run tests/store-borradores.test.ts`
Esperado: FAIL (`store.borradores` no es una función).

- [ ] **Paso 3: implementar en `src/store.ts`**

Imports:

```ts
import { NOMBRE_RAIZ, NOMBRE_INDICE, NOMBRE_BORRADORES, SCHEMA_VERSION } from './config.js';
import { COLUMNAS, entradaDesdeFila, filaDesde } from './catalogo.js';
import { HOJA_RECETAS, HOJA_META, HOJA_BORRADORES, rangoDeFila } from './sheets.js';
import { parse, serialize, slugArchivo, normalizar } from './recipe.js';
import { COLUMNAS_BORRADORES, entradaBorradorDesdeFila, filaDeBorrador, parseBorrador } from './borrador.js';
import type { Drive } from './drive.js';
import type { Sheets } from './sheets.js';
import type { CopiaIndice, IndiceLocal } from './indice-local.js';
import type {
  Receta, Ubicacion, Entrada, Filtros, Coincidencia, Coincidencias, ArchivoDrive,
  Borrador, EntradaBorrador
} from './tipos.js';

const CATEGORIA_RAIZ = 'Sin categorizar';
const ULTIMA_COLUMNA = String.fromCharCode(64 + COLUMNAS.length);
const ULTIMA_COLUMNA_BORRADORES = String.fromCharCode(64 + COLUMNAS_BORRADORES.length);
const MIME_CARPETA = 'application/vnd.google-apps.folder';
```

(`filaDeBorrador` y `serializeBorrador` se usan en la Tarea 4; importar `filaDeBorrador` ahora y sumar `serializeBorrador` allá.)

`Contexto` suma, después de `carpetas`:

```ts
  /** La carpeta `_borradores/`, o vacío si todavía no existe: se crea al agregar el primero. */
  borradoresId: string;
```

y la inicialización de `ctx` suma `borradoresId: ''`.

Después de `let filas = new Map<string, number>();`:

```ts
  let entradasBorradores: EntradaBorrador[] = [];
  let filasBorradores = new Map<string, number>();
```

`copiaActual` y `usarCopia` quedan:

```ts
  /** Cada entrada con su número de fila; una entrada sin fila no está en la planilla. */
  function conFila<E extends { id_archivo: string }>(
    lista: E[], nros: Map<string, number>
  ): { fila: number; entrada: E }[] {
    return lista.flatMap(entrada => {
      const fila = nros.get(entrada.id_archivo);
      return fila ? [{ fila, entrada }] : [];
    });
  }

  /** Lo que hay en memoria, con el número de fila que cada entrada tiene en la planilla. */
  function copiaActual(): CopiaIndice {
    return {
      schemaVersion: SCHEMA_VERSION,
      indiceId: ctx.indiceId,
      modifiedTime: ctx.modifiedTime,
      meta: { ...ctx.meta },
      filas: conFila(entradas, filas),
      borradores: conFila(entradasBorradores, filasBorradores)
    };
  }

  /** Carga la copia en memoria, en el orden de la planilla, como si se la hubiera leído. */
  function usarCopia(copia: CopiaIndice): void {
    const ordenadas = [...copia.filas].sort((a, b) => a.fila - b.fila);
    ctx.meta = { ...copia.meta };
    entradas = ordenadas.map(f => f.entrada);
    filas = new Map(ordenadas.map(f => [f.entrada.id_archivo, f.fila]));
    const borradores = [...copia.borradores].sort((a, b) => a.fila - b.fila);
    entradasBorradores = borradores.map(f => f.entrada);
    filasBorradores = new Map(borradores.map(f => [f.entrada.id_archivo, f.fila]));
  }
```

En `crearPlanilla`, después de escribir `meta`:

```ts
      await sheets.agregarHoja(archivo.id, HOJA_BORRADORES);
      await sheets.escribir(archivo.id, `${HOJA_BORRADORES}!A1:${ULTIMA_COLUMNA_BORRADORES}1`, [[...COLUMNAS_BORRADORES]]);
```

En `arrancar`, después de armar `ctx.carpetas`:

```ts
    // Está en la misma lista: encontrarla no cuesta ningún pedido.
    ctx.borradoresId = subcarpetas.find(c => c.name === NOMBRE_BORRADORES)?.id ?? '';
```

En `cargarIndice`, después de armar `filas` y antes de guardar la copia:

```ts
    const crudoBorradores = await sheets.leer(
      ctx.indiceId, `${HOJA_BORRADORES}!A1:${ULTIMA_COLUMNA_BORRADORES}100000`);
    entradasBorradores = crudoBorradores.slice(1).map(entradaBorradorDesdeFila).filter(e => e.id_archivo);
    filasBorradores = new Map(entradasBorradores.map((e, i) => [e.id_archivo, i + 2]));
```

`reconstruir` queda (reemplaza desde la declaración de `lugares` hasta `filas = new Map(...)` inclusive):

```ts
    const esMd = (a: ArchivoDrive): boolean =>
      a.mimeType !== MIME_CARPETA && /\.md$/i.test(a.name ?? '');

    const lugares = [
      { id: ctx.raizId, categoria: CATEGORIA_RAIZ },
      ...ctx.categorias.map(c => ({ id: c.id, categoria: c.nombre }))
    ];

    const pendientes: { archivo: ArchivoDrive; lugar: { id: string; categoria: string } }[] = [];
    for (const lugar of lugares) {
      for (const archivo of (await drive.listarHijos(lugar.id)).filter(esMd)) pendientes.push({ archivo, lugar });
    }
    const pendientesBorradores = ctx.borradoresId
      ? (await drive.listarHijos(ctx.borradoresId)).filter(esMd)
      : [];
    const total = pendientes.length + pendientesBorradores.length;

    const nuevas: string[][] = [];
    // Por nombre y no un conteo: un archivo que se salteó hay que poder
    // encontrarlo en Drive (C05.5.2).
    const ignorados: string[] = [];
    let leidas = 0;
    for (const { archivo, lugar } of pendientes) {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar({ leidas, total });
      const receta = parse(texto);
      if (!receta.titulo) { ignorados.push(archivo.name ?? archivo.id); continue; }
      nuevas.push(filaDesde(receta, {
        id: archivo.id, nombre_archivo: archivo.name ?? '',
        categoria: lugar.categoria, carpeta_id: lugar.id,
        mtime: Date.parse(archivo.modifiedTime ?? '') || 0
      }));
    }

    const nuevosBorradores: EntradaBorrador[] = [];
    for (const archivo of pendientesBorradores) {
      const texto = await drive.leerTexto(archivo.id);
      leidas++;
      alProgresar({ leidas, total });
      const { titulo, capturado } = parseBorrador(texto);
      if (!titulo) { ignorados.push(archivo.name ?? archivo.id); continue; }
      nuevosBorradores.push({ id_archivo: archivo.id, nombre_archivo: archivo.name ?? '', titulo, capturado });
    }

    const hojas = await sheets.hojas(ctx.indiceId);
    if (!hojas.some(h => h.title === HOJA_BORRADORES)) {
      // Una planilla de antes de la versión 4 no la tiene.
      await sheets.agregarHoja(ctx.indiceId, HOJA_BORRADORES);
      await sheets.escribir(ctx.indiceId, `${HOJA_BORRADORES}!A1:${ULTIMA_COLUMNA_BORRADORES}1`, [[...COLUMNAS_BORRADORES]]);
    }
    await reemplazarFilas(HOJA_RECETAS, idDeHoja(hojas, HOJA_RECETAS), ULTIMA_COLUMNA, nuevas);
    await reemplazarFilas(HOJA_BORRADORES, idDeHoja(hojas, HOJA_BORRADORES), ULTIMA_COLUMNA_BORRADORES,
      nuevosBorradores.map(filaDeBorrador));

    entradas = nuevas.map(entradaDesdeFila);
    filas = new Map(entradas.map((e, i) => [e.id_archivo, i + 2]));
    entradasBorradores = nuevosBorradores;
    filasBorradores = new Map(nuevosBorradores.map((e, i) => [e.id_archivo, i + 2]));
```

Y, antes de `reconstruir`, las dos auxiliares:

```ts
  /** El `sheetId` de una hoja por su nombre. Una hoja recién agregada no está en la lista, y no hace falta: está vacía. */
  function idDeHoja(hojas: { sheetId: number; title: string }[], nombre: string): number {
    return hojas.find(h => h.title === nombre)?.sheetId ?? 0;
  }

  /** Vacía una hoja, salvo el encabezado, y la llena con `nuevas`. */
  async function reemplazarFilas(hoja: string, hojaId: number, ultimaColumna: string, nuevas: string[][]): Promise<void> {
    const previas = await sheets.leer(ctx.indiceId, `${hoja}!A1:${ultimaColumna}100000`);
    if (previas.length >= 2) {
      // Todas juntas en una sola llamada: de a una, la cuota de escritura de
      // Sheets (60/min) se agota apenas la cantidad de recetas pasa un
      // puñado — pasó en la práctica con 60 recetas reales.
      const filasABorrar: number[] = [];
      for (let fila = previas.length; fila >= 2; fila--) filasABorrar.push(fila);
      await sheets.borrarFilas(ctx.indiceId, hojaId, filasABorrar);
    }
    for (let i = 0; i < nuevas.length; i += 500) {
      await sheets.append(ctx.indiceId, hoja, nuevas.slice(i, i + 500));
    }
  }
```

Las dos lecturas, antes de `return { arrancar, ... }`:

```ts
  /** La lista y el contador: desde memoria, lo más viejo primero (C01.4.1). */
  function borradores(): EntradaBorrador[] {
    return [...entradasBorradores].sort((a, b) => a.capturado.localeCompare(b.capturado));
  }

  /** El borrador entero: la fuente y la nota están en su `.md`, no en el índice. */
  async function borrador(id: string): Promise<Borrador> {
    return { id, ...parseBorrador(await drive.leerTexto(id)) };
  }
```

y el `return` suma `borradores, borrador`.

`rangoDeFila` sigue importado: lo usa `escribirFila`. Si el typecheck marca `filaDeBorrador` o `MIME_CARPETA` sin usar, no aplica (los usa `reconstruir`).

- [ ] **Paso 4: correr**

Correr: `npx vitest run tests/store-borradores.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 5: commit**

```bash
git add src/config.ts src/sheets.ts src/indice-local.ts src/store.ts tests/indice-local.test.ts tests/store-indice-local.test.ts tests/store-borradores.test.ts
git commit -m "$(cat <<'EOF'
El índice suma la hoja borradores: se carga, entra en la copia y se reindexa

La carpeta _borradores sale de la lista de subcarpetas del arranque. La
lista y el contador se leen de memoria; el borrador entero, de su .md.
SCHEMA_VERSION pasa a 4: la próxima apertura reindexa y crea la hoja.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 4: el store escribe los borradores

**Archivos:**
- Modificar: `src/store.ts` (`escribirEnHoja` y `borrarDeHoja` nuevas; `escribirFila`, `borrarDelIndice`; las tres operaciones)
- Modificar: `tests/store-borradores.test.ts`

**Interfaces:**
- Consume: lo de la Tarea 3; `serializeBorrador`.
- Produce: `store.agregarBorrador({ titulo, fuente, nota }: { titulo: string; fuente: string; nota: string }): Promise<Borrador>`, `store.editarBorrador(id: string, datos: { titulo: string; fuente: string; nota: string }): Promise<void>`, `store.descartarBorrador(id: string): Promise<void>`.

- [ ] **Paso 1: tests que fallan**

Agregar a `tests/store-borradores.test.ts` (sumar `parseBorrador` al import de `../src/borrador.js` y `recetaFalsa` al de `./dobles.js`):

```ts
/** La app abierta, con la copia ya guardada y la fecha de `_indice` que cambiaría al escribir. */
async function abierta(opciones: Parameters<typeof armar>[0] = {}) {
  const armado = await armar(opciones);
  await armado.store.arrancar();
  await armado.store.cargarIndice();
  armado.drive._store.get('i1')!.modifiedTime = '2026-09-13T11:00:00.000Z';
  return armado;
}

describe('agregar un borrador', () => {
  it('crea el .md en _borradores con su formato, agrega la fila y deja la copia al día', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const b = await store.agregarBorrador({ titulo: 'Pollo al disco', fuente: 'https://x/2', nota: 'Con cerveza.' });

    const archivo = drive._store.get(b.id)!;
    expect(archivo.parents).toEqual(['bc']);
    expect(archivo.name).toBe('pollo-al-disco.md');
    expect(parseBorrador(archivo.contenido ?? '')).toEqual({
      titulo: 'Pollo al disco', fuente: 'https://x/2', nota: 'Con cerveza.', capturado: b.capturado
    });
    expect(store.borradores().map(x => x.id_archivo)).toContain(b.id);
    expect(indiceLocal.actual()?.modifiedTime).toBe('2026-09-13T11:00:00.000Z');
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('sin carpeta _borradores, la crea una vez', async () => {
    const { store, drive } = await abierta({ conCarpeta: false });
    await store.agregarBorrador({ titulo: 'A', fuente: '', nota: '' });
    await store.agregarBorrador({ titulo: 'B', fuente: '', nota: '' });
    const carpetas = [...drive._store.values()].filter(a => a.name === '_borradores' && a.mimeType === CARPETA);
    expect(carpetas).toHaveLength(1);
    expect(carpetas[0]?.parents).toEqual(['raiz']);
  });

  it('un título repetido no pisa el archivo', async () => {
    const { store, drive } = await abierta();
    const b = await store.agregarBorrador({ titulo: 'Focaccia', fuente: '', nota: '' });
    expect(drive._store.get(b.id)?.name).toBe('focaccia-2.md');
  });
});

describe('editar un borrador', () => {
  it('reescribe el .md conservando capturado, y reescribe su fila', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    await store.editarBorrador('b1', { titulo: 'Focaccia de romero', fuente: 'https://x/9', nota: 'Otra nota.' });

    expect(parseBorrador(drive._store.get('b1')?.contenido ?? '')).toEqual({
      titulo: 'Focaccia de romero', fuente: 'https://x/9', nota: 'Otra nota.',
      capturado: '2026-09-10T00:00:00.000Z'
    });
    expect(store.borradores().find(b => b.id_archivo === 'b1')?.titulo).toBe('Focaccia de romero');
    expect(sheets.appends).toHaveLength(0);   // reescribe, no agrega
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('un borrador que no está en el índice no es un error', async () => {
    const { store } = await abierta();
    await expect(store.editarBorrador('fantasma', { titulo: 'A', fuente: '', nota: '' })).resolves.toBeUndefined();
  });
});

describe('descartar un borrador', () => {
  it('manda el .md a la papelera, borra la fila y corre las siguientes en la copia', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    await store.descartarBorrador('b1');

    expect(drive._store.get('b1')?.trashed).toBe(true);
    expect(store.borradores().map(b => b.id_archivo)).toEqual(['b2']);
    expect(indiceLocal.actual()?.borradores).toEqual([
      { fila: 2, entrada: expect.objectContaining({ id_archivo: 'b2' }) }
    ]);
    await borradoresCoincidenConLaPlanilla(sheets, indiceLocal.actual());
  });

  it('descartar dos veces termina bien', async () => {
    const { store } = await abierta();
    await store.descartarBorrador('b1');
    await expect(store.descartarBorrador('b1')).resolves.toBeUndefined();
  });

  it('si borrar la fila falla, reintentar la borra', async () => {
    const { store, sheets } = await abierta();
    const borrarFila = sheets.borrarFila.bind(sheets);
    let fallas = 1;
    sheets.borrarFila = async (...args) => {
      if (fallas-- > 0) throw new Error('red');
      return borrarFila(...args);
    };
    await expect(store.descartarBorrador('b1')).rejects.toThrow('red');
    await store.descartarBorrador('b1');
    expect(store.borradores().map(b => b.id_archivo)).toEqual(['b2']);
    expect(await sheets.leer('i1', 'borradores!A1:D100')).toHaveLength(2);
  });
});

describe('las recetas, con las filas generalizadas', () => {
  it('guardar una receta sigue escribiendo en la hoja recetas', async () => {
    const { store, sheets } = await abierta();
    await store.crear(recetaFalsa({ titulo: 'Asado' }), { carpetaId: 'c1' });
    expect(sheets.appends.at(-1)?.hoja).toBe('recetas');
  });
});
```

Correr: `npx vitest run tests/store-borradores.test.ts`
Esperado: FAIL (`store.agregarBorrador` no es una función).

- [ ] **Paso 2: implementar en `src/store.ts`**

Sumar `serializeBorrador` al import de `./borrador.js`.

Reemplazar `escribirFila` y `borrarDelIndice` por las auxiliares y sus versiones nuevas:

```ts
  /** Escribe la fila de `id` donde está, o la agrega al final. `nros` es el mapa de esa hoja. */
  async function escribirEnHoja(
    hoja: string, nros: Map<string, number>, id: string, valores: string[], columnas: number
  ): Promise<void> {
    const nro = nros.get(id);
    if (nro) await sheets.escribir(ctx.indiceId, rangoDeFila(nro, hoja, columnas), [valores]);
    else {
      await sheets.append(ctx.indiceId, hoja, [valores]);
      nros.set(id, nros.size + 2);
    }
  }

  /** Borra la fila de `id` y corre las siguientes. Devuelve si tenía fila. */
  async function borrarDeHoja(hoja: string, nros: Map<string, number>, id: string): Promise<boolean> {
    const nro = nros.get(id);
    if (!nro) return false;
    const hojas = await sheets.hojas(ctx.indiceId);
    await sheets.borrarFila(ctx.indiceId, idDeHoja(hojas, hoja), nro);
    nros.delete(id);
    // El corrimiento es determinístico: no hace falta releer nada (§4.3).
    for (const [otroId, otraFila] of nros) if (otraFila > nro) nros.set(otroId, otraFila - 1);
    return true;
  }

  async function escribirFila(receta: Receta, ubicacion: Ubicacion): Promise<void> {
    const fila = filaDesde(receta, ubicacion);
    // La entrada en memoria se actualiza acá y no en quien llama: la capa
    // compartida escribe la fila sin pasar por guardar ni crear, y la copia
    // se arma desde las entradas.
    entradas = [...entradas.filter(e => e.id_archivo !== ubicacion.id), entradaDesdeFila(fila)];
    await escribirEnHoja(HOJA_RECETAS, filas, ubicacion.id, fila, COLUMNAS.length);
    await persistir();
  }

  async function borrarDelIndice(id: string): Promise<void> {
    // Sacar la entrada siempre, tenga fila o no.
    entradas = entradas.filter(e => e.id_archivo !== id);
    if (await borrarDeHoja(HOJA_RECETAS, filas, id)) await persistir();
  }
```

Las tres operaciones, antes de `borradores()`:

```ts
  /** Escribe la fila del borrador y actualiza su entrada en memoria. */
  async function escribirBorrador(entrada: EntradaBorrador): Promise<void> {
    entradasBorradores = [...entradasBorradores.filter(e => e.id_archivo !== entrada.id_archivo), entrada];
    await escribirEnHoja(HOJA_BORRADORES, filasBorradores, entrada.id_archivo,
      filaDeBorrador(entrada), COLUMNAS_BORRADORES.length);
    await persistir();
  }

  /** Captura: un `.md` nuevo en `_borradores/` y su fila (C01.2). */
  async function agregarBorrador(
    { titulo, fuente, nota }: { titulo: string; fuente: string; nota: string }
  ): Promise<Borrador> {
    if (!ctx.borradoresId) {
      const carpeta = await drive.crear({ nombre: NOMBRE_BORRADORES, padre: ctx.raizId, mime: MIME_CARPETA });
      ctx.borradoresId = carpeta.id;
    }
    const hermanos = (await drive.listarHijos(ctx.borradoresId)).map(a => a.name ?? '');
    const nombre = slugArchivo(titulo, hermanos);
    const contenido = { titulo, fuente, nota, capturado: new Date().toISOString() };
    const archivo = await drive.crear({ nombre, contenido: serializeBorrador(contenido), padre: ctx.borradoresId });
    await escribirBorrador({ id_archivo: archivo.id, nombre_archivo: nombre, titulo, capturado: contenido.capturado });
    return { id: archivo.id, ...contenido };
  }

  /** Reescribe el `.md` y su fila. `capturado` sale de la fila: editar no cambia cuándo entró. */
  async function editarBorrador(
    id: string, { titulo, fuente, nota }: { titulo: string; fuente: string; nota: string }
  ): Promise<void> {
    const entrada = entradasBorradores.find(e => e.id_archivo === id);
    if (!entrada) return;
    await drive.actualizar(id, serializeBorrador({ titulo, fuente, nota, capturado: entrada.capturado }));
    await escribirBorrador({ ...entrada, titulo });
  }

  /**
   * El `.md` a la papelera y la fila afuera. Sin fila no hace nada: descartar
   * dos veces termina bien. Si la fila falla, reintentar vuelve a mandar a la
   * papelera un archivo que ya está ahí, que no falla.
   */
  async function descartarBorrador(id: string): Promise<void> {
    if (!filasBorradores.has(id)) return;
    await drive.borrar(id);
    entradasBorradores = entradasBorradores.filter(e => e.id_archivo !== id);
    await borrarDeHoja(HOJA_BORRADORES, filasBorradores, id);
    await persistir();
  }
```

El `return` suma `agregarBorrador, editarBorrador, descartarBorrador`.

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/store-borradores.test.ts tests/store-escritura.test.ts tests/store-indice-local.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

- [ ] **Paso 4: commit**

```bash
git add src/store.ts tests/store-borradores.test.ts
git commit -m "$(cat <<'EOF'
El store agrega, edita y descarta borradores

Agregar crea el .md en _borradores (y la carpeta, si falta) y su fila;
editar reescribe los dos conservando capturado; descartar manda el .md a
la papelera y borra la fila. La lógica de filas sirve a las dos hojas.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Tarea 5: la app usa los borradores del store

**Archivos:**
- Modificar: `src/compartido.ts`, `src/main.ts`, `src/ui/borradores.ts`, `src/ui/captura.ts:6`
- Eliminar: `src/borradores.ts`, `tests/borradores.test.ts`
- Modificar: `tests/compartido.test.ts`, `tests/main-rutas.test.ts`, `tests/main-nueva-receta.test.ts`, `tests/main-estado-vista.test.ts`, `tests/vista-borradores.test.ts`

**Interfaces:**
- Consume: `store.borradores`, `store.borrador`, `store.agregarBorrador`, `store.editarBorrador`, `store.descartarBorrador`.
- Produce: `DependenciasCompartido = { store: StoreDeCompartido; convertidos?: Map<string, RecetaCreada> }`, con `StoreDeCompartido = Pick<Store, 'escribirFila' | 'crear' | 'guardar' | 'receta' | 'descartarBorrador'>`. `renderBorradores({ borradores: EntradaBorrador[]; error?; menuAbierto? })`.

- [ ] **Paso 1: `compartido.ts`**

```ts
/**
 * La capa que la app y el agente invocan igual (C05.4.3).
 *
 * Tres operaciones viven acá —escribir una receta al índice, convertir un
 * borrador en receta y leer un `.md`— y son el único camino para escribir: dos
 * implementaciones del mismo formato divergen, una sola no.
 *
 * Son funciones finas sobre el store. La única con lógica propia es
 * `convertirBorrador`, que es una operación y no tres.
 */
import type { Store } from './store.js';
import type { Receta, Ubicacion } from './tipos.js';
```

`StoreDeCompartido` y `DependenciasCompartido`:

```ts
export type StoreDeCompartido = Pick<Store, 'escribirFila' | 'crear' | 'guardar' | 'receta' | 'descartarBorrador'>;

export interface DependenciasCompartido {
  store: StoreDeCompartido;
  /** (el comentario de `convertidos` queda igual) */
  convertidos?: Map<string, RecetaCreada>;
}
```

(Se borran `BorradoresDeCompartido` y el import de `Borradores`.) En `convertirBorrador`, la línea del descarte:

```ts
  // El borrador: su `.md` a la papelera y su fila afuera. Que ya no esté no es
  // un error (edge case de F01.7).
  await deps.store.descartarBorrador(borradorId);
```

- [ ] **Paso 2: `tests/compartido.test.ts`**

Reemplazar el principio del archivo hasta el final del `describe('convertirBorrador')` por:

```ts
import { describe, it, expect, vi } from 'vitest';
import { convertirBorrador, escribirRecetaAlIndice, leerReceta } from '../src/compartido.js';
import { crearStore } from '../src/store.js';
import { driveFalso, sheetsFalso, recetaFalsa, indiceLocalFalso } from './dobles.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES, serializeBorrador } from '../src/borrador.js';
import { SCHEMA_VERSION } from '../src/config.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const CAPTURADO = '2026-09-01T10:00:00Z';

/**
 * El store de verdad sobre los dobles de Drive y de Sheets: lo que esta capa
 * tiene que probar es que las escrituras pasan, y en qué orden, no que un
 * doble del store devuelva lo que el test quiere.
 */
const armar = async ({ borradores: lista = [] as { id: string; titulo: string }[] } = {}) => {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'] },
    { id: 'c1', name: 'Pescados y mariscos', mimeType: CARPETA, parents: ['raiz'] },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'bc', name: '_borradores', mimeType: CARPETA, parents: ['raiz'] },
    ...lista.map(b => ({
      id: b.id, name: `${b.id}.md`, parents: ['bc'],
      contenido: serializeBorrador({ titulo: b.titulo, fuente: '', nota: '', capturado: CAPTURADO })
    }))
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'borradores']);
  sheets.cargar('i1', 'recetas', [[...COLUMNAS]]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.cargar('i1', 'borradores', [
    [...COLUMNAS_BORRADORES], ...lista.map(b => [b.id, `${b.id}.md`, b.titulo, CAPTURADO])
  ]);

  const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
  await store.arrancar();
  await store.cargarIndice();

  // El orden de las escrituras es parte del contrato (C01.7.1), y no se ve en
  // ningún registro del doble: se anota acá, al pasar.
  const orden: string[] = [];
  const anotar = <T extends object, K extends keyof T>(objeto: T, metodo: K, etiqueta: string) => {
    const original = objeto[metodo] as (...args: unknown[]) => unknown;
    vi.spyOn(objeto, metodo as never).mockImplementation(((...args: unknown[]) => {
      orden.push(etiqueta);
      return original.apply(objeto, args);
    }) as never);
  };
  anotar(drive, 'crear', 'crear-md');
  anotar(sheets, 'append', 'escribir-fila');
  anotar(drive, 'borrar', 'borrador-a-la-papelera');
  anotar(sheets, 'borrarFila', 'borrar-fila-del-borrador');

  return { drive, sheets, store, orden, deps: { store } };
};

describe('convertirBorrador', () => {
  it('escribe el .md, escribe la fila y descarta el borrador, en ese orden', async () => {
    const { deps, orden } = await armar({ borradores: [{ id: 'b1', titulo: 'Rabas' }] });

    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(orden).toEqual(['crear-md', 'escribir-fila', 'borrador-a-la-papelera', 'borrar-fila-del-borrador']);
  });

  it('la fuente del borrador pasa al frontmatter', async () => {
    const { deps, drive } = await armar({ borradores: [{ id: 'b1', titulo: 'Rabas' }] });

    const { id } = await convertirBorrador(deps, {
      borradorId: 'b1',
      receta: recetaFalsa({ titulo: 'Rabas', fuente: 'https://x/1' }),
      carpetaId: 'c1'
    });

    expect(await drive.leerTexto(id)).toContain('fuente: https://x/1');
  });

  it('la receta queda en la categoría que le tocó, con su fila en el índice', async () => {
    const { deps, store } = await armar({ borradores: [{ id: 'b1', titulo: 'Rabas' }] });

    const { id } = await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(store.entradas()).toHaveLength(1);
    expect(store.entradas()[0]).toMatchObject({
      id_archivo: id, titulo: 'Rabas', categoria: 'Pescados y mariscos', carpeta_id: 'c1'
    });
  });

  it('el borrador convertido deja de estar en la lista, y su .md está en la papelera', async () => {
    const { deps, store, drive } = await armar({ borradores: [{ id: 'b1', titulo: 'Rabas' }] });

    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(store.borradores()).toEqual([]);
    expect(drive._store.get('b1')?.trashed).toBe(true);
  });

  it('si el borrador ya no existe, la operación termina bien', async () => {
    const { deps } = await armar();

    await expect(convertirBorrador(deps, {
      borradorId: 'fantasma', receta: recetaFalsa({ titulo: 'A' }), carpetaId: 'c1'
    })).resolves.toMatchObject({ id: expect.any(String) });
  });

  it('reintentar después de un fallo al descartar deja una sola receta (R2)', async () => {
    const { deps, store, drive } = await armar({ borradores: [{ id: 'b1', titulo: 'Rabas' }] });
    const falla = vi.spyOn(store, 'descartarBorrador').mockRejectedValueOnce(new Error('red'));

    await expect(convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    })).rejects.toThrow('red');

    falla.mockRestore();
    await convertirBorrador(deps, {
      borradorId: 'b1', receta: recetaFalsa({ titulo: 'Rabas' }), carpetaId: 'c1'
    });

    expect(store.entradas()).toHaveLength(1);
    // Y tampoco quedó un segundo .md: el reintento reescribe el que ya estaba.
    expect(await drive.listarHijos('c1')).toHaveLength(1);
    expect(store.borradores()).toEqual([]);
  });
});
```

Los `describe` de `escribirRecetaAlIndice` y `leerReceta` quedan como están.

- [ ] **Paso 3: `src/ui/borradores.ts` y su test**

En `src/ui/borradores.ts`: el import de tipos pasa a `import type { Borrador, EntradaBorrador } from '../tipos.js';`; `OpcionesBorradores.borradores` pasa a `EntradaBorrador[]`; en `renderBorradores`, `b.id` pasa a `b.id_archivo`. El comentario de la confirmación:

```ts
  // Es destructivo —el .md va a la papelera de Drive—: la confirmación nombra el borrador.
```

En `tests/vista-borradores.test.ts`, el import de tipos suma `EntradaBorrador`, se agrega:

```ts
const entradaFalsa = (p: Partial<EntradaBorrador> = {}): EntradaBorrador =>
  ({ id_archivo: 'b1', nombre_archivo: 'a.md', titulo: 'A', capturado: '', ...p });
```

y los cinco tests del `describe('Borradores')` usan `entradaFalsa` en lugar de `borradorFalso`:
- «cada entrada muestra el título y cuándo se capturó»: `entradaFalsa({ titulo: 'Focaccia', capturado: '2026-09-01T10:00:00Z' })`.
- «la fila muestra sólo el título, y no parece un hipervínculo»: se reescribe así, porque la entrada ya no trae fuente ni nota:

```ts
  it('la fila muestra el título y la fecha, y nada más', () => {
    const html = renderBorradores({ borradores: [entradaFalsa({ titulo: 'Focaccia', nombre_archivo: 'focaccia.md' })] });
    expect(html).toContain('Focaccia');
    expect(html).not.toContain('focaccia.md');
  });
```

- «cada borrador lleva al suyo»: `entradaFalsa({ id_archivo: 'b7' })`.

`borradorFalso` se queda para los tests de `renderBorrador`.

En `src/ui/captura.ts:6`, «guardar escribe una fila de la planilla de Borradores y cierra» pasa a «guardar escribe el `.md` del borrador y cierra».

- [ ] **Paso 4: `src/main.ts`**

Imports: borrar `import { crearBorradores } from './borradores.js';` y `import type { Borradores } from './borradores.js';`. Borrar `let borradores: Borradores | null = null;`.

Reemplazar el bloque de `borradoresLeidos`, `PANTALLAS_DE_BORRADORES` y `borradoresDePantalla` por:

```ts
/**
 * El borrador abierto, leído de su `.md` una vez. Mismo criterio que la
 * receta: lo reutilizan los redibujados —confirmar el descarte, Editar, un
 * error— y crear la receta desde él. Salir a otra pantalla lo descarta. La
 * lista y el contador no leen nada: salen del índice en memoria.
 */
let borradorLeido: Borrador | null = null;
const PANTALLAS_DE_BORRADOR: readonly Ruta['vista'][] = ['borrador', 'nueva'];

/** El borrador de la pantalla: de Drive la primera vez, de memoria mientras no se salga. */
async function borradorDePantalla(id: string): Promise<Borrador> {
  if (borradorLeido?.id !== id) borradorLeido = await store.borrador(id);
  return borradorLeido;
}
```

En `arrancar`, reemplazar desde el comentario «Los borradores viven en su propia planilla…» hasta `if (estadoArranque.reconstruir) await reconstruir();` por:

```ts
  // Reindexar rearma el índice entero: cargarlo antes es leer de más, y una
  // planilla de un esquema viejo puede no tener todas sus hojas.
  if (estadoArranque.reconstruir) await reconstruir();
  else await store.cargarIndice();
```

En `render`, `if (!PANTALLAS_DE_BORRADORES.includes(ruta.vista)) borradoresLeidos = null;` pasa a:

```ts
    if (!PANTALLAS_DE_BORRADOR.includes(ruta.vista)) borradorLeido = null;
```

Caso `'recetario'`:

```ts
    case 'recetario':
      return pintar(renderRecetario({
        categorias: store.categoriasConConteo(), borradores: store.borradores().length, menuAbierto
      }));
```

Caso `'ajustes'`: `borradores: (await borradoresDePantalla().catch(() => [])).length, menuAbierto` pasa a `borradores: store.borradores().length, menuAbierto`.

Casos `'borradores'` y `'borrador'`:

```ts
    case 'borradores':
      return pintar(renderBorradores({ borradores: store.borradores(), menuAbierto }));

    case 'borrador': {
      const id = ruta.params['id'] ?? '';
      // Un borrador que ya no está en el índice —convertido, descartado— no
      // es un error: la lista es lo que corresponde mostrar.
      if (!store.borradores().some(b => b.id_archivo === id)) {
        return pintar(renderBorradores({ borradores: store.borradores(), menuAbierto }));
      }
      try {
        const borrador = await borradorDePantalla(id);
        // Editar es el mismo formulario con el que se creó, precargado.
        if (editandoBorrador) {
          return pintar(renderCaptura({
            fuente: borrador.fuente, titulo: borrador.titulo, nota: borrador.nota,
            edicion: true, guardando: guardandoCaptura,
            ...(errorCaptura ? { error: errorCaptura } : {})
          }));
        }
        return pintar(renderBorrador({ borrador, confirmando: confirmandoDescarte }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer el borrador.');
      }
    }
```

Caso `'nueva'`: las dos líneas que buscan el borrador pasan a:

```ts
        const borrador = await borradorDePantalla(borradorId).catch(() => null);
```

`descartar-confirmado`:

```ts
  if (accion === 'descartar-confirmado') {
    const id = vistaActual?.params['id'] ?? '';
    try {
      await store.descartarBorrador(id);
      // El borrador que se acaba de descartar no tiene que quedar en el
      // historial: volver ahí mostraría algo que ya no existe.
      irCerrando('#/borradores');
      return;
    } catch (err) {
      console.error(err);
      if (!borradorLeido) return;
      return pintar(renderBorrador({ borrador: borradorLeido, confirmando: true, error: 'No se pudo descartar.' }));
    }
  }
```

`guardar-captura`: borrar la línea `borradoresLeidos = null;`, y el `try` queda:

```ts
    try {
      if (editandoBorrador) {
        const id = vistaActual?.params['id'] ?? '';
        await store.editarBorrador(id, { titulo: tituloCaptura, fuente, nota: notaCaptura });
        // Lo guardado es lo que se muestra: volver al borrador no relee el `.md`.
        if (borradorLeido?.id === id) borradorLeido = { ...borradorLeido, titulo: tituloCaptura, fuente, nota: notaCaptura };
        editandoBorrador = false;
        guardandoCaptura = false;
        tituloCaptura = '';
        notaCaptura = '';
        return render();
      }
      await store.agregarBorrador({ titulo: tituloCaptura, fuente, nota: notaCaptura });
    } catch (err) {
```

`guardar`:

```ts
      if (esNueva && borradorId) {
        // Convertir es una sola operación: el .md, la fila y el borrador (C01.7.1).
        await convertirBorrador({ store, convertidos }, { borradorId, receta: nueva, carpetaId });
```

`reintentar`:

```ts
  if (accion === 'reintentar') { recetaLeida = null; borradorLeido = null; return render(); }
```

- [ ] **Paso 5: tests de `main`**

`tests/main-nueva-receta.test.ts` y `tests/main-estado-vista.test.ts`: sumar `borradores: () => [],` a su `storeFake`.

`tests/main-rutas.test.ts`:

El comentario de `lecturasBorradores` pasa a `/** Cuántas veces se leyó el .md de un borrador. */`.

Borrar el `vi.mock('../src/borradores.js', …)` entero y sumar al `storeFake`:

```ts
  borradores: () => estado.borradores.map(b => ({
    id_archivo: b.id, nombre_archivo: `${b.id}.md`, titulo: b.titulo, capturado: b.capturado
  })),
  borrador: async (id: string) => {
    estado.lecturasBorradores++;
    const b = estado.borradores.find(x => x.id === id);
    if (!b) throw new Error(`no hay borrador ${id}`);
    return b;
  },
  agregarBorrador: async () => ({ id: 'b1', titulo: '', fuente: '', nota: '', capturado: '' }),
  editarBorrador: async () => {},
  descartarBorrador: async (id: string) => {
    if (estado.fallasAlDescartar > 0) { estado.fallasAlDescartar--; throw new Error('red'); }
    estado.descartados.push(id);
  }
```

El `describe('la planilla de borradores se lee al entrar, no en cada redibujado (P17)')` se reemplaza por:

```ts
  describe('los borradores salen del índice; el .md se lee al abrir uno', () => {
    const B1 = { id: 'b1', titulo: 'Focaccia', fuente: '', nota: '', capturado: '' };

    it('el contador y la lista no leen nada', async () => {
      estado.borradores = [B1];
      const { abrir, tocar, app } = await montar();
      await abrir('#/');
      await tocar('abrir-menu');
      await abrir('#/borradores');
      await abrir('#/ajustes');
      expect(estado.lecturasBorradores).toBe(0);
      await abrir('#/borradores');
      expect(app.innerHTML).toContain('Focaccia');
    });

    it('entre un borrador, sus redibujados y crear la receta, el .md se lee una vez', async () => {
      estado.borradores = [B1];
      const { abrir, tocar } = await montar();
      await abrir('#/borradores/b1');
      await tocar('descartar');
      await tocar('cancelar-descarte');
      await tocar('editar-borrador');
      await tocar('volver');
      await abrir('#/nueva?borrador=b1');
      expect(estado.lecturasBorradores).toBe(1);
    });

    it('salir a la lista y volver a abrirlo sí lo relee', async () => {
      estado.borradores = [B1];
      const { abrir } = await montar();
      await abrir('#/borradores/b1');
      await abrir('#/borradores');
      await abrir('#/borradores/b1');
      expect(estado.lecturasBorradores).toBe(2);
    });

    it('si descartar falla, avisa y el borrador sigue en pantalla', async () => {
      estado.borradores = [B1];
      estado.fallasAlDescartar = 1;
      const { abrir, tocar, app } = await montar();
      await abrir('#/borradores/b1');
      await tocar('descartar-confirmado');
      expect(app.innerHTML).toContain('No se pudo descartar.');
      expect(app.innerHTML).toContain('Focaccia');
    });

    it('un borrador que no está en el índice muestra la lista', async () => {
      const { abrir, app } = await montar();
      await abrir('#/borradores/fantasma');
      expect(app.innerHTML).toContain('No hay nada esperando.');
      expect(estado.lecturasBorradores).toBe(0);
    });
  });
```

- [ ] **Paso 6: eliminar el módulo viejo**

```bash
git rm src/borradores.ts tests/borradores.test.ts
```

- [ ] **Paso 7: correr**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde. Si `grep -rn "borradores.js'" src tests` encuentra algo que no sea `ui/borradores.js`, falta un import por cambiar.

- [ ] **Paso 8: commit**

```bash
git add -A src tests
git commit -m "$(cat <<'EOF'
La app usa los borradores del store; se va la planilla _borradores

La lista y el contador salen del índice en memoria, el borrador abierto se
lee de su .md una vez, y capturar, editar, descartar y convertir llaman al
store. Al abrir, reindexar reemplaza a cargar: una planilla de un esquema
viejo puede no tener la hoja borradores.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

(Revisar con `git status` antes que `-A` no suba nada ajeno a `src` y `tests`.)

---

### Tarea 6: documentos y push

**Archivos:**
- Modificar: `product-design/product/specs/E01-CapturaYBorradores.md`, `product-design/ux/information-architecture.md`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`, `CLAUDE.md`

- [ ] **Paso 1: `E01-CapturaYBorradores.md`**

- C01.4.1, tercer criterio: «La lista se lee de una sola vez: una lectura de la planilla, sin paginar.» → «La lista sale de la hoja `borradores` del índice, en memoria: mostrarla no hace ningún pedido. `[2026-09-13]`»
- C01.4.2 se reescribe:

```markdown
#### C01.4.2 — Un `.md` por borrador *(J2)* `[reescrita el 2026-09-13]`

- [ ] Cada borrador es un `.md` en `Recetario/_borradores/`: `titulo`, `fuente` y `capturado` en el frontmatter, y la nota como cuerpo. Es un formato propio, no el de una receta.
- [ ] El identificador del borrador es el id del archivo en Drive.
- [ ] La hoja `borradores` de `_indice` tiene una fila por borrador: `id_archivo`, `nombre_archivo`, `titulo` y `capturado`. Capturar agrega una fila; descartar y convertir borran una; editar reescribe la suya. Reindexar la rearma desde la carpeta.
- [ ] Editar un borrador reescribe su `.md` y su fila, con los tres campos editables, y conserva cuándo se capturó.
```

- C01.6.2: «Descartar pregunta antes: es destructivo y no hay papelera.» → «Descartar pregunta antes.»; «Confirmado, borra la fila y vuelve a Borradores.» → «Confirmado, manda el `.md` a la papelera de Drive, borra su fila y vuelve a Borradores.»
- C01.6.3, cuarto criterio: «**borra la fila del borrador**» → «**descarta el borrador**».
- C01.7.1: donde diga que convertir borra la fila del borrador, pasa a «manda el `.md` del borrador a la papelera y borra su fila».

- [ ] **Paso 2: `information-architecture.md`**

- §2, fila **Borrador**: «Una **fila en la planilla de Borradores** en Drive» → «Un **`.md` en `Recetario/_borradores/`**, con su fila en la hoja `borradores` del índice».
- §2.1, el párrafo «**El borrador no entra al índice.** …» se reemplaza por:

```markdown
**El borrador es un `.md` propio, con su hoja en el índice.** Cada borrador es un
archivo en `Recetario/_borradores/` —título, fuente y cuándo se capturó en el
frontmatter, la nota como cuerpo—, y el índice tiene una hoja `borradores` con lo
que la lista y el contador necesitan. No es una receta: la hoja es otra, y buscar
recetas no lo encuentra. `[decisión: 2026-09-13, reemplaza la planilla propia del Hito 7]`
```

- §2.2, fila **Convertir borrador en receta**: «**borra la entrada del borrador**» → «**descarta el borrador**: su `.md` a la papelera y su fila afuera».
- La fila de la tabla del final que dice «Una planilla en Drive, una fila por borrador» → «Un `.md` por borrador en `_borradores/`, con su hoja en el índice».

- [ ] **Paso 3: `decision-log.md`**

Versión 1.9, fecha 2026-09-13, y dos filas al final de la tabla:

```markdown
| 2026-09-13 | **Cada borrador es un `.md` en `Recetario/_borradores/`, con su hoja `borradores` en `_indice`.** El `.md` tiene un formato propio: `titulo`, `fuente` y `capturado` en el frontmatter, la nota como cuerpo. Las operaciones las hace el store. Reemplaza la planilla `_borradores` y P21. | La planilla propia se bajaba entera al entrar a cada pantalla de borradores, y no tenía copia local. Con el índice local ya hecho, sumar una hoja al índice le da la copia y el reindexado sin mecanismo nuevo. | Replicar la copia local sobre la planilla `_borradores` (P21); que el borrador use el formato de receta con una clave más; sacar la planilla a su propio módulo. | El borrador es su propia entidad —título, fuente y nota—: si fuera una receta, bastaría con crear recetas incompletas. Con archivos, el agente puede escribir un borrador con el conector de Drive, que no escribe planillas. | `E01` C01.4.1, C01.4.2, C01.6.2, C01.7.1; IA §2 y §2.1. `SCHEMA_VERSION` 4. Los borradores de la planilla vieja se descartaron. |
| 2026-09-13 | **Borrar desde la app manda a la papelera de Drive** (`PATCH` con `trashed: true`). | `drive.borrar` usaba `DELETE`, que en la API v3 borra para siempre, y E04 dice que la receta borrada va a la papelera. Salió al diseñar el descarte de borradores. | Borrado definitivo para los borradores y arreglar las recetas aparte. | La papelera es la red de seguridad del usuario, y un solo camino para borrar es menos que dos. | Recetas, borradores y planillas a medio crear van a la papelera. La confirmación de descartar deja de decir que no hay papelera. |
```

- [ ] **Paso 4: `BACKLOG.md`**

- Fila **P21**: reemplazar el contenido de la tercera celda por `**Reemplazado** \`[2026-09-13]\`: los borradores pasaron a ser un \`.md\` por borrador en \`Recetario/_borradores/\`, con su hoja \`borradores\` en \`_indice\`, que entra en la copia local. Spec en \`docs/superpowers/specs/2026-09-13-borradores-md-design.md\`, plan en \`docs/superpowers/plans/2026-09-13-borradores-md.md\`.`
- Fila nueva **P22** después de P21:

```markdown
| **P22** | **El skill del agente escribe borradores** | `[2026-09-13]` Un borrador ahora es un `.md` en `Recetario/_borradores/` (formato en `src/borrador.ts`), y el conector de Drive de claude.ai sí crea archivos: el agente puede dejar un borrador que aparece al reindexar. Falta enseñárselo a `skills/recetario/`. |
```

- [ ] **Paso 5: `CLAUDE.md`**

- «Lo esencial», la oración «**Los borradores son otra** (`Recetario/_borradores`): una cola de trabajo de cinco columnas, que no entra al índice porque no es contenido consolidado.» → «**Los borradores son `.md` aparte** (`Recetario/_borradores/`), con un formato propio —título, fuente, capturado y la nota— y su hoja `borradores` en `_indice`.»
- «Cómo quedó el código», fila **Es nuevo**: `` `borradores.ts` (la planilla de la cola) `` → `` `borrador.ts` (el `.md` del borrador) ``.
- El párrafo de estado de arriba suma, después del del índice local:

```markdown
**Hecho el 2026-09-13 — los borradores como `.md`:** un archivo por borrador en
`Recetario/_borradores/`, listado desde la hoja `borradores` de `_indice`, y borrar
manda a la papelera. Spec en `docs/superpowers/specs/2026-09-13-borradores-md-design.md`.
**Falta la verificación en el teléfono** y borrar a mano la planilla vieja
`_borradores`.
```

- La cantidad de tests (`**520 tests**`) al número que dé `npm test`.
- «Estado al 2026-09-13»: el ítem de **P21** se reemplaza por `- **P22** —el skill del agente escribe borradores—.`
- «Decisiones cerradas», fila nueva al final:

```markdown
| Los borradores en una planilla propia, o como receta incompleta | Decidido el 2026-09-13. La planilla se bajaba entera y no tenía copia; como hoja del índice hereda la copia local y el reindexado. Y el borrador no es una receta: título, fuente y nota. Si lo fuera, alcanzaría con crear recetas incompletas. |
```

- «Falta verificar a mano», agregar al final: «Y de los borradores como `.md`: la primera apertura reindexa; compartir un link crea el `.md` en `_borradores/`; editar, crear la receta y descartar dejan el `.md` cambiado o en la papelera; y volver al Recetario no pide nada a Sheets.»

- [ ] **Paso 6: verificación final, commit y push**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde; la cantidad de tests coincide con `CLAUDE.md`.

```bash
git add product-design CLAUDE.md
git commit -m "$(cat <<'EOF'
Los documentos dicen que los borradores son .md con hoja en el índice

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```
