# Gestión de categorías (P15/P19, etapa 3a) — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Objetivo:** crear, renombrar, editar y borrar categorías desde la app, con la paleta y el catálogo, y que el nombre de la categoría de cada receta salga de su carpeta.

**Arquitectura:** `src/categorias.ts` suma las reglas (nombre válido, primer color libre). `src/ui/categorias.ts` expone el catálogo y la traducción de claves. `src/store.ts` deriva `Entrada.categoria` de `carpeta_id` y suma `crearCategoria`, `editarCategoria`, `borrarCategoria` y `recetasDe`. `src/ui/gestion-categorias.ts` (nuevo) dibuja la lista, la edición y la confirmación. `main.ts` las cablea en `#/categorias` con el mismo mecanismo de «salir sin guardar» del editor de recetas.

**Stack:** TypeScript estricto + Vite, sin framework. Vitest en `environment: 'node'` con dobles a mano.

**Spec:** `docs/superpowers/specs/2026-09-13-gestion-de-categorias-design.md` — leerlo antes de empezar.

## Restricciones globales

- **Sin commits ni push.** La última tarea termina mostrando el diff.
- **Idioma:** español rioplatense en comentarios, nombres y UI.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess` (sólo `src`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **Las predefinidas no tienen trato especial.**
- **`Entrada.categoria` sale de `carpeta_id`**; la columna `categoria` de `recetas` no se lee.
- **Cada escritura en `_indice` termina en `persistir()`.**
- **Borrar filas de recetas: una sola llamada** (`sheets.borrarFilas`).
- **Verificación de cada tarea:** `npm test` y `npm run typecheck` en verde.

## Mapa de archivos

| Archivo | Qué cambia |
|---|---|
| `src/categorias.ts` | `problemaDelNombre`, `colorLibre`. |
| `src/ui/categorias.ts` | `fotosDelCatalogo`, `colorDeClave`, `urlDeFoto`; `colorCategoria` y `fotoCategoria` las usan. |
| `src/store.ts` | `conCategoria`; `crearCategoria`, `editarCategoria`, `borrarCategoria`, `recetasDe`. |
| `src/ui/gestion-categorias.ts` | **Nuevo.** `renderListaCategorias`, `renderEdicionCategoria`, `botonBorrarCategoria`, `confirmacionBorrarCategoria`. |
| `src/ui/router.ts` | Vistas `categorias` y `editar-categoria`. |
| `src/ui/ajustes.ts` | Ficha «Recetario», segunda; la carpeta sale de Cuenta. |
| `src/main.ts` | Rutas, elegir color y foto sin redibujar, validación en vivo, guardar y borrar. |
| Tests | `categorias-reglas.test.ts`, `store-gestion-categorias.test.ts`, `vista-gestion-categorias.test.ts` nuevos; `categorias.test.ts`, `router.test.ts`, `vista-ajustes.test.ts`, `main-rutas.test.ts`. |
| Documentos | `E05-Cimientos.md`, `design-system.md`, `CLAUDE.md`, `decision-log.md`, `BACKLOG.md`. |

---

### Tarea 1: las reglas y el catálogo

**Archivos:**
- Modificar: `src/categorias.ts`, `src/ui/categorias.ts`, `tests/categorias.test.ts`
- Crear: `tests/categorias-reglas.test.ts`

**Interfaces:**
- Produce:
  - `categorias.ts`: `problemaDelNombre(nombre: string, otros: readonly string[]): string` —vacío si es válido, si no el motivo—; `colorLibre(usados: readonly string[]): ClaveColor`.
  - `ui/categorias.ts`: `fotosDelCatalogo(): string[]` (claves ordenadas), `colorDeClave(color: string): string` (`var(--cat-<clave>)` o el neutro), `urlDeFoto(foto: string): string | null`.

- [ ] **Paso 1: tests que fallan**

Crear `tests/categorias-reglas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { problemaDelNombre, colorLibre, CLAVES_COLOR } from '../src/categorias.js';

describe('el nombre de una categoría', () => {
  it('uno nuevo y distinto es válido', () => {
    expect(problemaDelNombre('Fiambres', ['Pastas', 'Aves'])).toBe('');
  });

  it('vacío, con _ adelante o repetido sin mirar tildes ni mayúsculas, no', () => {
    expect(problemaDelNombre('   ', [])).toBe('Ponele un nombre.');
    expect(problemaDelNombre('_ocultas', [])).toBe('No puede empezar con _.');
    expect(problemaDelNombre('PASTAS', ['Pastas'])).toBe('Ya hay una categoría con ese nombre.');
    expect(problemaDelNombre('Pescados y mariscos', ['Péscados y Mariscos'])).toBe('Ya hay una categoría con ese nombre.');
  });
});

describe('el color de una categoría nueva', () => {
  it('el primero de la paleta que nadie usa', () => {
    expect(colorLibre(['arroces', 'aves'])).toBe('bebidas');
  });

  it('con todos en uso, el neutro', () => {
    expect(colorLibre(CLAVES_COLOR)).toBe('otros');
  });

  it('el neutro nunca se ofrece como libre mientras quede otro', () => {
    expect(colorLibre(CLAVES_COLOR.filter(c => c !== 'verduras' && c !== 'otros'))).toBe('verduras');
  });
});
```

En `tests/categorias.test.ts`, agregar al final del `describe`:

```ts
  it('el catálogo lista sus fotos, y las claves se traducen sin registro', () => {
    expect(fotosDelCatalogo()).toContain('pastas');
    expect(colorDeClave('pastas')).toBe('var(--cat-pastas)');
    expect(colorDeClave('fucsia')).toBe('var(--cat-otros)');
    expect(urlDeFoto('catalogo:pastas')).toMatch(/pastas/);
    expect(urlDeFoto('')).toBeNull();
    expect(urlDeFoto('drive:abc')).toBeNull();
  });
```

(sumando `fotosDelCatalogo, colorDeClave, urlDeFoto` al import).

Correr: `npx vitest run tests/categorias-reglas.test.ts tests/categorias.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: implementar**

`src/categorias.ts`, al final:

```ts
/**
 * Por qué un nombre no sirve para una categoría, o vacío si sirve. `otros` son
 * los nombres de las demás categorías: al editar, sin la que se edita.
 */
export function problemaDelNombre(nombre: string, otros: readonly string[]): string {
  const limpio = nombre.trim();
  if (!limpio) return 'Ponele un nombre.';
  // Las carpetas que empiezan con _ no son categorías: `_borradores`, `_indice`.
  if (limpio.startsWith('_')) return 'No puede empezar con _.';
  const buscado = normalizar(limpio);
  if (otros.some(o => normalizar(o) === buscado)) return 'Ya hay una categoría con ese nombre.';
  return '';
}

/** El color de una categoría nueva: el primero de la paleta que nadie usa, o el neutro. */
export function colorLibre(usados: readonly string[]): ClaveColor {
  return CLAVES_COLOR.find(c => c !== 'otros' && !usados.includes(c)) ?? 'otros';
}
```

`src/ui/categorias.ts`: reemplazar `colorCategoria` y `fotoCategoria` por:

```ts
/** Las claves del catálogo de fotos, en orden. */
export function fotosDelCatalogo(): string[] {
  return [...CATALOGO.keys()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** El token de una clave de color, o el neutro si la paleta no la tiene. */
export function colorDeClave(color: string): string {
  return (CLAVES_COLOR as readonly string[]).includes(color) ? `var(--cat-${color})` : NEUTRO;
}

/** La URL de una foto (`catalogo:<clave>`), o null. `drive:<id>` llega en la etapa 3b. */
export function urlDeFoto(foto: string): string | null {
  return foto.startsWith('catalogo:') ? CATALOGO.get(foto.slice('catalogo:'.length)) ?? null : null;
}

/** El color de una categoría registrada. Sin clave válida cae en el neutro, sin romper nada. */
export function colorCategoria(nombre: unknown): string {
  return colorDeClave(registradas.get(String(nombre ?? ''))?.color ?? '');
}

/** La URL de la foto de una categoría registrada, o null. */
export function fotoCategoria(nombre: unknown): string | null {
  return urlDeFoto(registradas.get(String(nombre ?? ''))?.foto ?? '');
}
```

- [ ] **Paso 3: correr**

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 2: el nombre de la categoría sale de la carpeta

**Archivos:**
- Modificar: `src/store.ts`
- Crear: `tests/store-gestion-categorias.test.ts`

**Interfaces:**
- Produce: interna `conCategoria(e: Entrada): Entrada`; `cargarIndice`, `usarCopia` y `reconstruir` la aplican.

- [ ] **Paso 1: test que falla**

Crear `tests/store-gestion-categorias.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import type { CopiaIndice } from '../src/indice-local.js';
import { driveFalso, sheetsFalso, indiceLocalFalso, recetaFalsa } from './dobles.js';
import type { SheetsFalso } from './dobles.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';

const fila = (id: string, titulo: string, categoria: string, carpeta: string): string[] =>
  [id, `${id}.md`, titulo, categoria, carpeta, '', '', '', '', '', '', '1000'];

/**
 * Pastas (c1) con dos recetas, Aves (c2) con una, y una suelta en la raíz. La
 * columna categoria de r1 dice un nombre viejo a propósito.
 */
async function abierta() {
  const drive = driveFalso([
    { id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: { recetario: 'raiz' } },
    { id: 'c1', name: 'Pastas', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'pastas', foto: 'catalogo:pastas' } },
    { id: 'c2', name: 'Aves', mimeType: CARPETA, parents: ['raiz'], appProperties: { color: 'aves', foto: 'catalogo:aves' } },
    { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['raiz'] },
    { id: 'r1', name: 'r1.md', parents: ['c1'] }, { id: 'r2', name: 'r2.md', parents: ['c2'] },
    { id: 'r3', name: 'r3.md', parents: ['c1'] }, { id: 'r4', name: 'r4.md', parents: ['raiz'] }
  ]);
  const sheets = sheetsFalso();
  sheets.crearPlanilla('i1', ['recetas', 'meta', 'borradores', 'categorias']);
  sheets.cargar('i1', 'recetas', [
    [...COLUMNAS],
    fila('r1', 'Ñoquis', 'Nombre viejo', 'c1'),
    fila('r2', 'Pollo', 'Aves', 'c2'),
    fila('r3', 'Lasaña', 'Pastas', 'c1'),
    fila('r4', 'Suelta', 'Sin categorizar', 'raiz')
  ]);
  sheets.cargar('i1', 'meta', [['schemaVersion', String(SCHEMA_VERSION)]]);
  sheets.cargar('i1', 'borradores', [[...COLUMNAS_BORRADORES]]);
  sheets.cargar('i1', 'categorias', [
    [...COLUMNAS_CATEGORIAS], ['c1', 'Pastas', 'pastas', 'catalogo:pastas'], ['c2', 'Aves', 'aves', 'catalogo:aves']
  ]);
  const indiceLocal = indiceLocalFalso();
  const store = crearStore({ drive, sheets, indiceLocal });
  await store.arrancar();
  await store.cargarIndice();
  drive._store.get('i1')!.modifiedTime = '2026-09-13T11:00:00.000Z';
  return { drive, sheets, indiceLocal, store };
}

/** Las filas de la copia apuntan a las de la planilla, en las dos hojas. */
async function copiaCoincide(sheets: SheetsFalso, copia: CopiaIndice | null) {
  const recetas = await sheets.leer('i1', 'recetas!A1:L100');
  expect(copia!.filas).toHaveLength(recetas.length - 1);
  for (const { fila: nro, entrada } of copia!.filas) expect(recetas[nro - 1]?.[0]).toBe(entrada.id_archivo);
  const categorias = await sheets.leer('i1', 'categorias!A1:D100');
  expect(copia!.categorias.map(c => c.id)).toEqual(categorias.slice(1).map(f => f[0]));
}

describe('el nombre de la categoría de cada receta', () => {
  it('sale de la carpeta, no de la columna', async () => {
    const { store } = await abierta();
    expect(store.entradas().find(e => e.id_archivo === 'r1')?.categoria).toBe('Pastas');
    expect(store.entradas().find(e => e.id_archivo === 'r4')?.categoria).toBe('Sin categorizar');
  });

  it('también al abrir desde la copia', async () => {
    const primera = await abierta();
    const store = crearStore({ drive: primera.drive, sheets: primera.sheets, indiceLocal: primera.indiceLocal });
    primera.drive._store.get('i1')!.modifiedTime = primera.indiceLocal.actual()!.modifiedTime;
    await store.arrancar();
    await store.cargarIndice();
    expect(store.entradas().find(e => e.id_archivo === 'r1')?.categoria).toBe('Pastas');
  });

  it('una receta con una carpeta que no es categoría queda Sin categorizar', async () => {
    const { sheets } = await abierta();
    sheets.cargar('i1', 'recetas', [[...COLUMNAS], fila('r9', 'Rara', 'Vieja', 'borrada')]);
    const otra = crearStore({ drive: driveFalso([]), sheets, indiceLocal: indiceLocalFalso() });
    otra._ctx.indiceId = 'i1';
    await otra.cargarIndice();
    expect(otra.entradas()[0]?.categoria).toBe('Sin categorizar');
  });
});
```

Correr: `npx vitest run tests/store-gestion-categorias.test.ts`
Esperado: FAIL en «sale de la carpeta, no de la columna» (hoy dice «Nombre viejo»).

- [ ] **Paso 2: implementar en `src/store.ts`**

Después de `usarCategorias`:

```ts
  /**
   * La categoría de una receta sale de su carpeta, no de la columna: así
   * renombrar una categoría no obliga a reescribir las filas de sus recetas.
   * Una carpeta que no es categoría —o la raíz— es Sin categorizar.
   */
  function conCategoria(e: Entrada): Entrada {
    return { ...e, categoria: ctx.carpetas.get(e.carpeta_id) ?? CATEGORIA_RAIZ };
  }
```

- En `usarCopia`, después de `usarCategorias(copia.categorias);`: `entradas = entradas.map(conCategoria);`.
- En `cargarIndice`, después de `usarCategorias(…)`: `entradas = entradas.map(conCategoria);`.
- En `reconstruir`, `entradas = nuevas.map(entradaDesdeFila);` pasa a `entradas = nuevas.map(entradaDesdeFila).map(conCategoria);`.

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/store-gestion-categorias.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 3: crear, editar y borrar categorías en el store

**Archivos:**
- Modificar: `src/store.ts`, `tests/store-gestion-categorias.test.ts`

**Interfaces:**
- Consume: Tareas 1 y 2.
- Produce:
  - `store.recetasDe(id: string): Entrada[]`.
  - `store.crearCategoria(datos: { nombre: string; color: string; foto: string }): Promise<Categoria>`.
  - `store.editarCategoria(id: string, datos: { nombre: string; color: string; foto: string }): Promise<void>`.
  - `store.borrarCategoria(id: string): Promise<void>`.
  - Los tres tiran `Error(problemaDelNombre(…))` con un nombre inválido, sin tocar Drive.
  - La fila de una categoría en la hoja es su posición en `ctx.categorias` + 2: `ctx.categorias` conserva el orden de la hoja —crear agrega al final, borrar saca del medio, editar reemplaza en el lugar—.

- [ ] **Paso 1: tests que fallan**

Agregar a `tests/store-gestion-categorias.test.ts`:

```ts
describe('crear una categoría', () => {
  it('crea la carpeta en la raíz con sus propiedades, agrega la fila y la copia coincide', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Fiambres', color: 'bebidas', foto: '' });
    expect(drive._store.get(c.id)).toMatchObject({ name: 'Fiambres', mimeType: CARPETA, parents: ['raiz'] });
    expect(drive._store.get(c.id)?.appProperties).toEqual({ color: 'bebidas', foto: '' });
    expect(store.categorias().map(x => x.nombre)).toContain('Fiambres');
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('un nombre repetido no toca Drive', async () => {
    const { store, drive } = await abierta();
    const antes = drive._store.size;
    await expect(store.crearCategoria({ nombre: 'pastas', color: 'aves', foto: '' })).rejects.toThrow('Ya hay una categoría con ese nombre.');
    expect(drive._store.size).toBe(antes);
  });
});

describe('editar una categoría', () => {
  it('renombra la carpeta, reescribe sólo su fila, y las recetas muestran el nombre nuevo', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    const escriturasAntes = sheets.escrituras.length;
    await store.editarCategoria('c1', { nombre: 'Pastas frescas', color: 'pastas', foto: 'catalogo:pastas' });

    expect(drive._store.get('c1')?.name).toBe('Pastas frescas');
    const nuevas = sheets.escrituras.slice(escriturasAntes);
    expect(nuevas.map(e => e.hoja)).toEqual(['categorias']);
    expect(store.entradas().filter(e => e.carpeta_id === 'c1').map(e => e.categoria)).toEqual(['Pastas frescas', 'Pastas frescas']);
    expect(indiceLocal.actual()?.filas.find(f => f.entrada.id_archivo === 'r1')?.entrada.categoria).toBe('Pastas frescas');
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('sin cambiar el nombre no renombra; sin cambiar color ni foto no escribe propiedades', async () => {
    const { store, drive } = await abierta();
    drive.llamadas.length = 0;
    await store.editarCategoria('c1', { nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' });
    expect(drive.llamadas.filter(l => l[0] === 'propiedades')).toEqual([]);
    drive.llamadas.length = 0;
    await store.editarCategoria('c1', { nombre: 'Pastas', color: 'aves', foto: 'catalogo:pastas' });
    expect(drive.llamadas.filter(l => l[0] === 'propiedades')).toEqual([['propiedades', 'c1', { color: 'aves', foto: 'catalogo:pastas' }]]);
  });

  it('su propio nombre no cuenta como repetido; el de otra sí', async () => {
    const { store } = await abierta();
    await expect(store.editarCategoria('c1', { nombre: 'PASTAS', color: 'pastas', foto: '' })).resolves.toBeUndefined();
    await expect(store.editarCategoria('c1', { nombre: 'Aves', color: 'pastas', foto: '' })).rejects.toThrow('Ya hay una categoría');
  });
});

describe('borrar una categoría', () => {
  it('la carpeta a la papelera, las filas de sus recetas en una llamada, y la copia coincide', async () => {
    const { store, drive, sheets, indiceLocal } = await abierta();
    let llamadas = 0;
    const borrarFilas = sheets.borrarFilas.bind(sheets);
    sheets.borrarFilas = async (id: string, hojaId: number, nros: number[]) => { llamadas++; return borrarFilas(id, hojaId, nros); };

    await store.borrarCategoria('c1');

    expect(drive._store.get('c1')?.trashed).toBe(true);
    expect(llamadas).toBe(1);
    expect(store.entradas().map(e => e.id_archivo).sort()).toEqual(['r2', 'r4']);
    expect(store.categorias().map(c => c.id)).toEqual(['c2']);
    await copiaCoincide(sheets, indiceLocal.actual());
  });

  it('una categoría vacía no borra filas de recetas', async () => {
    const { store, sheets } = await abierta();
    const c = await store.crearCategoria({ nombre: 'Vacía', color: 'bebidas', foto: '' });
    let llamadas = 0;
    const borrarFilas = sheets.borrarFilas.bind(sheets);
    sheets.borrarFilas = async (id: string, hojaId: number, nros: number[]) => { llamadas++; return borrarFilas(id, hojaId, nros); };
    await store.borrarCategoria(c.id);
    expect(llamadas).toBe(0);
    expect(store.categorias().map(x => x.id)).toEqual(['c1', 'c2']);
  });

  it('después de borrar, guardar otra receta escribe su fila correcta', async () => {
    const { store, sheets } = await abierta();
    await store.borrarCategoria('c1');
    await store.escribirFila(recetaFalsa({ titulo: 'Pollo al horno' }),
      { id: 'r2', nombre_archivo: 'r2.md', categoria: 'Aves', carpeta_id: 'c2', mtime: 1 });
    const recetas = await sheets.leer('i1', 'recetas!A1:L100');
    expect(recetas.filter(f => f[0] === 'r2')).toHaveLength(1);
    expect(recetas.find(f => f[0] === 'r2')?.[2]).toBe('Pollo al horno');
  });
});

describe('recetasDe', () => {
  it('las entradas de una categoría', async () => {
    const { store } = await abierta();
    expect(store.recetasDe('c1').map(e => e.titulo).sort()).toEqual(['Lasaña', 'Ñoquis']);
  });
});
```

Correr: `npx vitest run tests/store-gestion-categorias.test.ts`
Esperado: FAIL (`store.crearCategoria` no es una función).

- [ ] **Paso 2: implementar en `src/store.ts`**

Imports: sumar `problemaDelNombre` al de `./categorias.js`.

Antes de `categorias()`:

```ts
  /** Las recetas de una categoría: para contarlas y nombrarlas antes de borrar. */
  function recetasDe(id: string): Entrada[] {
    return entradas.filter(e => e.carpeta_id === id);
  }

  /** Tira si el nombre no sirve; `idPropio` es la categoría que se edita. */
  function validarNombre(nombre: string, idPropio = ''): void {
    const problema = problemaDelNombre(nombre, ctx.categorias.filter(c => c.id !== idPropio).map(c => c.nombre));
    if (problema) throw new Error(problema);
  }

  /** La fila de una categoría en su hoja: su lugar en `ctx.categorias`, que sigue el orden de la hoja. */
  const filaDeLaCategoria = (id: string): number => ctx.categorias.findIndex(c => c.id === id) + 2;

  /** Una categoría nueva: su carpeta en la raíz, con color y foto, y su fila. */
  async function crearCategoria(datos: { nombre: string; color: string; foto: string }): Promise<Categoria> {
    const nombre = datos.nombre.trim();
    validarNombre(nombre);
    const carpeta = await drive.crear({ nombre, padre: ctx.raizId, mime: MIME_CARPETA });
    await drive.propiedades(carpeta.id, { color: datos.color, foto: datos.foto });
    const categoria: Categoria = { id: carpeta.id, nombre, color: datos.color, foto: datos.foto };
    await sheets.append(ctx.indiceId, HOJA_CATEGORIAS, [filaDeCategoria(categoria)]);
    usarCategorias([...ctx.categorias, categoria]);
    await persistir();
    return categoria;
  }

  /** Renombrar, cambiar color o foto: la carpeta, su fila, y las recetas en memoria. */
  async function editarCategoria(id: string, datos: { nombre: string; color: string; foto: string }): Promise<void> {
    const actual = ctx.categorias.find(c => c.id === id);
    if (!actual) return;
    const nombre = datos.nombre.trim();
    validarNombre(nombre, id);
    if (nombre !== actual.nombre) await drive.renombrar(id, nombre);
    if (datos.color !== actual.color || datos.foto !== actual.foto) {
      await drive.propiedades(id, { color: datos.color, foto: datos.foto });
    }
    const editada: Categoria = { id, nombre, color: datos.color, foto: datos.foto };
    const nro = filaDeLaCategoria(id);
    await sheets.escribir(ctx.indiceId, rangoDeFila(nro, HOJA_CATEGORIAS, COLUMNAS_CATEGORIAS.length), [filaDeCategoria(editada)]);
    usarCategorias(ctx.categorias.map(c => c.id === id ? editada : c));
    entradas = entradas.map(conCategoria);
    await persistir();
  }

  /**
   * La carpeta a la papelera con sus recetas adentro, y sus filas afuera: las de
   * las recetas en una sola llamada —de a una, la cuota de Sheets se agota— y la
   * de la categoría.
   */
  async function borrarCategoria(id: string): Promise<void> {
    const nroCategoria = filaDeLaCategoria(id);
    if (nroCategoria < 2) return;
    await drive.borrar(id);

    const hojas = await sheets.hojas(ctx.indiceId);
    const nros = recetasDe(id)
      .map(e => filas.get(e.id_archivo))
      .filter((n): n is number => typeof n === 'number')
      .sort((a, b) => b - a);
    if (nros.length) {
      await sheets.borrarFilas(ctx.indiceId, idDeHoja(hojas, HOJA_RECETAS), nros);
      entradas = entradas.filter(e => e.carpeta_id !== id);
      const quedan = new Map<string, number>();
      for (const [otro, nro] of filas) {
        if (nros.includes(nro)) continue;
        // Cada fila borrada por encima corre a esta un lugar hacia arriba.
        quedan.set(otro, nro - nros.filter(n => n < nro).length);
      }
      filas = quedan;
    }

    await sheets.borrarFila(ctx.indiceId, idDeHoja(hojas, HOJA_CATEGORIAS), nroCategoria);
    usarCategorias(ctx.categorias.filter(c => c.id !== id));
    await persistir();
  }
```

(`filaDeCategoria`, `rangoDeFila` e `idDeHoja` ya están disponibles en el archivo.)

El `return` suma `recetasDe, crearCategoria, editarCategoria, borrarCategoria`.

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/store-gestion-categorias.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 4: las vistas, la ruta y Ajustes

**Archivos:**
- Crear: `src/ui/gestion-categorias.ts`, `tests/vista-gestion-categorias.test.ts`
- Modificar: `src/ui/router.ts`, `tests/router.test.ts`, `src/ui/ajustes.ts`, `tests/vista-ajustes.test.ts`, `src/ui/base.css`

**Interfaces:**
- Produce:
  - `router.ts`: `Vista` suma `'categorias' | 'editar-categoria'`; `#/categorias` → `{ vista: 'categorias', params: {} }`; `#/categorias/nueva` → `{ vista: 'editar-categoria', params: { id: 'nueva' } }`; `#/categorias/<id>` → `{ vista: 'editar-categoria', params: { id } }`.
  - `gestion-categorias.ts`:
    - `renderListaCategorias({ categorias }: { categorias: { categoria: Categoria; recetas: number }[] }): string`
    - `renderEdicionCategoria(o: { categoria: Categoria | null; valores: { nombre: string; color: string; foto: string }; otros: string[]; error?: string }): string` —`categoria` en `null` es una nueva—.
    - `botonBorrarCategoria: string`
    - `confirmacionBorrarCategoria(nombre: string, recetas: string[]): string`
    - `muestraCategoria(valores: { nombre: string; color: string; foto: string }): string`
  - `ajustes.ts`: la ficha «Recetario» segunda; Cuenta sin la carpeta.

- [ ] **Paso 1: tests que fallan**

`tests/router.test.ts`, dentro del `describe`:

```ts
  it('la gestión de categorías', () => {
    expect(parsearHash('#/categorias')).toEqual({ vista: 'categorias', params: {} });
    expect(parsearHash('#/categorias/nueva')).toEqual({ vista: 'editar-categoria', params: { id: 'nueva' } });
    expect(parsearHash('#/categorias/c1')).toEqual({ vista: 'editar-categoria', params: { id: 'c1' } });
  });
```

Crear `tests/vista-gestion-categorias.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  renderListaCategorias, renderEdicionCategoria, confirmacionBorrarCategoria, botonBorrarCategoria
} from '../src/ui/gestion-categorias.js';

const pastas = { id: 'c1', nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };
const fiambres = { id: 'c2', nombre: 'Fiambres', color: '', foto: '' };

describe('la lista de categorías', () => {
  it('alfabética, con su conteo, y cada una lleva a su edición', () => {
    const html = renderListaCategorias({ categorias: [{ categoria: pastas, recetas: 12 }, { categoria: fiambres, recetas: 1 }] });
    expect(html.indexOf('Fiambres')).toBeLessThan(html.indexOf('Pastas'));
    expect(html).toContain('12 recetas');
    expect(html).toContain('1 receta<');
    expect(html).toContain('href="#/categorias/c1"');
    expect(html).toContain('href="#/categorias/nueva"');
  });

  it('una sin foto lleva la trama en la miniatura', () => {
    expect(renderListaCategorias({ categorias: [{ categoria: fiambres, recetas: 0 }] })).toContain('trama');
  });
});

describe('la edición de una categoría', () => {
  const valores = { nombre: 'Pastas', color: 'pastas', foto: 'catalogo:pastas' };

  it('es un formulario con el nombre, las 16 muestras y las fotos, con la elegida marcada', () => {
    const html = renderEdicionCategoria({ categoria: pastas, valores, otros: ['Aves'] });
    expect(html).toContain('data-formulario');
    expect(html).toContain('name="nombre" value="Pastas"');
    expect(html.match(/data-accion="elegir-color"/g)).toHaveLength(16);
    expect(html).toContain('data-accion="elegir-color" data-valor="pastas" aria-pressed="true"');
    expect(html).toContain('data-accion="elegir-foto" data-valor="catalogo:pastas" aria-pressed="true"');
    expect(html).toContain('data-accion="elegir-foto" data-valor=""');
    expect(html).toContain('name="color" value="pastas"');
    expect(html).toContain('name="foto" value="catalogo:pastas"');
  });

  it('Guardar arranca deshabilitado: todavía no hay cambios', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toMatch(/data-accion="guardar-categoria"[^>]*disabled/);
  });

  it('la muestra de arriba es el tile que va a quedar', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toContain('data-muestra');
  });

  it('Borrar categoría sólo al editar', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [] })).toContain('data-accion="borrar-categoria"');
    expect(renderEdicionCategoria({ categoria: null, valores: { nombre: '', color: 'bebidas', foto: '' }, otros: [] }))
      .not.toContain('data-accion="borrar-categoria"');
  });

  it('una nueva se titula así', () => {
    expect(renderEdicionCategoria({ categoria: null, valores: { nombre: '', color: 'bebidas', foto: '' }, otros: [] }))
      .toContain('Nueva categoría');
  });

  it('el error de guardar va arriba', () => {
    expect(renderEdicionCategoria({ categoria: pastas, valores, otros: [], error: 'No se pudo guardar.' }))
      .toContain('No se pudo guardar.');
  });
});

describe('la confirmación de borrado', () => {
  it('con recetas: cuántas, hasta tres nombres en orden, y el botón dice lo que hace', () => {
    const html = confirmacionBorrarCategoria('Pastas', ['Ravioles', 'Lasaña', 'Ñoquis', 'Canelones', 'Sorrentinos']);
    expect(html).toContain('<b>Pastas y sus 5 recetas van a la papelera de Drive.</b>');
    expect(html).toContain('Canelones, Lasaña, Ñoquis y 2 más.');
    expect(html).toContain('Borrar Pastas y 5 recetas');
    expect(html).toContain('data-accion="borrar-categoria-confirmado"');
  });

  it('con una receta, en singular', () => {
    expect(confirmacionBorrarCategoria('Pastas', ['Ñoquis'])).toContain('Pastas y su receta va a la papelera de Drive.');
  });

  it('vacía, la corta', () => {
    const html = confirmacionBorrarCategoria('Pastas', []);
    expect(html).toContain('<b>Pastas va a la papelera de Drive.</b>');
    expect(html).toContain('>Borrar Pastas<');
  });

  it('el botón que la abre', () => {
    expect(botonBorrarCategoria).toContain('data-accion="borrar-categoria"');
  });
});
```

`tests/vista-ajustes.test.ts`:
- el test «la ficha Cuenta dice qué carpeta se usa y ofrece cambiarla» pasa a:

```ts
  it('la ficha Recetario dice qué carpeta se usa, cuántas categorías hay, y ofrece cambiar y gestionar', () => {
    const html = renderAjustes({ ...base, carpeta: 'Recetario', categorias: 16 });
    const recetario = html.slice(html.indexOf('<h2>Recetario</h2>'), html.indexOf('<h2>Índice</h2>'));
    expect(recetario).toContain('Carpeta: Recetario');
    expect(recetario).toContain('data-accion="cambiar-carpeta"');
    expect(recetario).toContain('16 categorías');
    expect(recetario).toContain('href="#/categorias"');
    const cuenta = html.slice(html.indexOf('<h2>Cuenta</h2>'), html.indexOf('<h2>Recetario</h2>'));
    expect(cuenta).not.toContain('Carpeta:');
  });
```

- en el test del orden de las fichas (P25), el orden esperado pasa a `['Cuenta', 'Recetario', 'Índice', 'Archivos locales', 'Avisos', 'Registro de actividad']`, y `renderAjustes` recibe `carpeta: 'Recetario'`.

Correr: `npx vitest run tests/router.test.ts tests/vista-gestion-categorias.test.ts tests/vista-ajustes.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: implementar la ruta**

`src/ui/router.ts`: `Vista` suma `| 'categorias' | 'editar-categoria'`, y antes del bloque de `carpeta`:

```ts
  if (partes[0] === 'categorias') {
    return partes[1]
      ? { vista: 'editar-categoria', params: { id: partes[1] } }
      : { vista: 'categorias', params: {} };
  }
```

- [ ] **Paso 3: implementar las vistas**

Crear `src/ui/gestion-categorias.ts`:

```ts
/**
 * La gestión de categorías (P15/P19, etapa 3a): la lista y la edición.
 *
 * Todas las categorías se tratan igual, predefinidas o no. La edición es un
 * formulario —color y foto viajan en campos ocultos— para que «salir sin
 * guardar» funcione como en el editor de recetas.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso } from './componentes.js';
import { colorDeClave, urlDeFoto, fotosDelCatalogo } from './categorias.js';
import { CLAVES_COLOR } from '../categorias.js';
import type { Categoria } from '../tipos.js';

interface Valores {
  nombre: string;
  color: string;
  foto: string;
}

/** El tile de una categoría con estos valores: la miniatura de la lista y la muestra de la edición. */
export function muestraCategoria({ nombre, color, foto }: Valores, extra = ''): string {
  const imagen = urlDeFoto(foto);
  const fondo = imagen
    ? `<span class="im" style="background-image:url(${imagen})"></span>`
    : '<span class="im trama"></span>';
  return `<span class="tile muestra" style="--c:${colorDeClave(color)}"${extra}>` +
    `${fondo}<span class="nm">${escapar(nombre)}</span></span>`;
}

const recetas = (n: number): string => `${n} ${n === 1 ? 'receta' : 'recetas'}`;

export function renderListaCategorias({ categorias }: { categorias: { categoria: Categoria; recetas: number }[] }): string {
  const filas = [...categorias]
    .sort((a, b) => a.categoria.nombre.localeCompare(b.categoria.nombre, 'es'))
    .map(({ categoria, recetas: n }) =>
      `<a class="bor cat-fila" href="#/categorias/${encodeURIComponent(categoria.id)}">` +
        muestraCategoria({ nombre: '', color: categoria.color, foto: categoria.foto }) +
        `<span class="txt"><span class="n">${escapar(categoria.nombre)}</span></span>` +
        `<span class="d">${recetas(n)}</span>` +
      '</a>')
    .join('');

  return encabezado({
    titulo: 'Categorías', volver: true,
    derecha: '<a class="btn sec compacto" href="#/categorias/nueva">+ Nueva</a>'
  }) +
    `<div class="cuerpo denso"><div class="lista">${filas}</div></div>`;
}

export const botonBorrarCategoria =
  '<button class="btn pel" type="button" data-accion="borrar-categoria">Borrar categoría</button>';

/** Dice todo antes de borrar: cuántas recetas se van, cuáles, y a dónde (§3.3 del diseño). */
export function confirmacionBorrarCategoria(nombre: string, titulos: string[]): string {
  const n = titulos.length;
  const ordenados = [...titulos].sort((a, b) => a.localeCompare(b, 'es'));
  const cuales = n
    ? `<p class="lee" style="margin:0 0 var(--e-4)">${escapar(ordenados.slice(0, 3).join(', '))}` +
      `${n > 3 ? ` y ${n - 3} más` : ''}.</p>`
    : '';
  const titulo = n === 0
    ? `${nombre} va a la papelera de Drive.`
    : n === 1
      ? `${nombre} y su receta va a la papelera de Drive.`
      : `${nombre} y sus ${n} recetas van a la papelera de Drive.`;
  const explicacion = n
    ? '<p class="lee" style="margin:0 0 var(--e-2)">Dejan de verse en la app. Se pueden recuperar desde la papelera de Drive, y después hay que reindexar.</p>'
    : '';
  const boton = n ? `Borrar ${nombre} y ${recetas(n)}` : `Borrar ${nombre}`;
  return '<div class="ficha" data-confirmar-borrado-categoria style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-2)"><b>${escapar(titulo)}</b></p>` +
    explicacion + cuales +
    '<div class="acciones">' +
      '<button class="btn sec" type="button" data-accion="cancelar-borrar-categoria">Cancelar</button>' +
      `<button class="btn pel" type="button" data-accion="borrar-categoria-confirmado">${escapar(boton)}</button>` +
    '</div></div>';
}

export function renderEdicionCategoria(
  { categoria, valores, otros, error }: { categoria: Categoria | null; valores: Valores; otros: string[]; error?: string }
): string {
  const colores = CLAVES_COLOR.map(clave =>
    `<button type="button" class="muestra-color" data-accion="elegir-color" data-valor="${clave}" ` +
    `aria-pressed="${clave === valores.color}" style="background:${colorDeClave(clave)}" aria-label="${clave}"></button>`
  ).join('');

  const fotos = ['', ...fotosDelCatalogo().map(f => `catalogo:${f}`)].map(foto => {
    const imagen = urlDeFoto(foto);
    return `<button type="button" class="muestra-foto${imagen ? '' : ' trama'}" data-accion="elegir-foto" data-valor="${escapar(foto)}" ` +
      `aria-pressed="${foto === valores.foto}"${imagen ? ` style="background-image:url(${imagen})"` : ''} ` +
      `aria-label="${foto ? escapar(foto.slice('catalogo:'.length)) : 'sin foto'}"></button>`;
  }).join('');

  return encabezado({
    titulo: categoria ? categoria.nombre : 'Nueva categoría', volver: true,
    derecha: '<button class="btn prim compacto" data-accion="guardar-categoria" disabled>Guardar</button>'
  }) +
    `<form class="cuerpo" data-formulario data-otros="${escapar(JSON.stringify(otros))}" onsubmit="return false">` +
      (error ? aviso({ texto: error }) : '') +
      muestraCategoria(valores, ' data-muestra') +
      '<label class="campo"><span>Nombre</span>' +
        `<input name="nombre" value="${escapar(valores.nombre)}" autocomplete="off"></label>` +
      '<p class="aviso-mudo error-nombre" hidden></p>' +
      `<input type="hidden" name="color" value="${escapar(valores.color)}">` +
      `<input type="hidden" name="foto" value="${escapar(valores.foto)}">` +
      `<div class="ficha"><h2>Color</h2><div class="muestras">${colores}</div></div>` +
      `<div class="ficha"><h2>Foto</h2><div class="muestras fotos">${fotos}</div></div>` +
      (categoria ? botonBorrarCategoria : '') +
    '</form>';
}
```

`src/ui/base.css`, al final:

```css
/* Gestión de categorías: la muestra de arriba, las muestras de color y de foto. */
.tile.muestra { display: block; }
.cat-fila .tile.muestra { width: 56px; aspect-ratio: 4/3; flex: 0 0 56px; }
.cat-fila .tile.muestra .nm { display: none; }
.muestras { display: grid; grid-template-columns: repeat(8, 1fr); gap: var(--e-2); }
.muestras.fotos { grid-template-columns: repeat(4, 1fr); }
.muestra-color { aspect-ratio: 1; border-radius: 50%; border: 2px solid transparent; }
.muestra-foto { aspect-ratio: 4/3; border-radius: var(--r-medio); border: 2px solid transparent;
                background-size: cover; background-position: center; }
.muestra-foto.trama { background:
    repeating-linear-gradient(135deg, var(--cat-otros) 0 6px, transparent 6px 14px); }
.muestra-color[aria-pressed="true"], .muestra-foto[aria-pressed="true"] { border-color: var(--fg); }
```

(Verificar las variables usadas —`--r-medio`, `--fg`, `--cat-otros`— en `tokens.css`; si alguna no existe, usar la equivalente.)

- [ ] **Paso 4: Ajustes**

`src/ui/ajustes.ts`: sacar de `seccionCuenta` el bloque `(carpeta ? … : '')`, y después de `seccionCuenta`:

```ts
  // La carpeta y sus categorías, juntas y fuera de Cuenta. Mientras reindexa no
  // se ofrece nada, igual que Índice.
  const seccionRecetario = '<div class="ficha"><h2>Recetario</h2>' +
    (carpeta
      ? `<div class="fila-a"><span class="t">Carpeta: ${escapar(carpeta)}</span>` +
        (enCurso ? '' : '<button class="btn sec compacto" data-accion="cambiar-carpeta">Cambiar carpeta</button>') + '</div>'
      : '') +
    `<div class="fila-a" style="margin-top:var(--e-3)"><span class="t">${categorias} ${categorias === 1 ? 'categoría' : 'categorías'}</span>` +
      (enCurso ? '' : '<a class="btn sec compacto" href="#/categorias">Categorías ›</a>') + '</div>' +
  '</div>';
```

y el cuerpo pasa a `seccionCuenta + seccionRecetario + seccionIndice + …`.

- [ ] **Paso 5: correr**

Correr: `npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 5: el cableado en `main`

**Archivos:**
- Modificar: `src/main.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consume: Tareas 3 y 4.

- [ ] **Paso 1: tests que fallan**

En `tests/main-rutas.test.ts`, el objeto `estado` suma:

```ts
  /** Lo que se guardó desde la gestión de categorías, en orden. */
  categoriasGuardadas: [] as string[],
  /** Los ids de las categorías borradas. */
  categoriasBorradas: [] as string[],
```

(con su reinicio en el `afterEach`), y `storeFake` suma:

```ts
  recetasDe: (id: string) => id === 'c1' ? [entradaFalsa({ id_archivo: 'f1', titulo: 'Milanesas', carpeta_id: 'c1' })] : [],
  crearCategoria: async (d: { nombre: string }) => { estado.categoriasGuardadas.push(`nueva:${d.nombre}`); return { id: 'c9', nombre: d.nombre, color: '', foto: '' }; },
  editarCategoria: async (id: string, d: { nombre: string }) => { estado.categoriasGuardadas.push(`${id}:${d.nombre}`); },
  borrarCategoria: async (id: string) => { estado.categoriasBorradas.push(id); },
```

Tests nuevos:

```ts
  describe('la gestión de categorías', () => {
    it('la lista y la edición se dibujan', async () => {
      const { app, abrir } = await montar();
      await abrir('#/categorias');
      expect(app.innerHTML).toContain('href="#/categorias/c1"');
      await abrir('#/categorias/c1');
      expect(app.innerHTML).toContain('name="nombre" value="Carnes"');
      await abrir('#/categorias/nueva');
      expect(app.innerHTML).toContain('Nueva categoría');
    });

    it('guardar una edición llama al store con lo del formulario y vuelve a la lista', async () => {
      const { abrir, tocar, vueltasAtras } = await montar();
      await abrir('#/categorias/c1');
      estado.formulario = { nombre: 'Carnes rojas', color: 'carnes', foto: 'catalogo:carnes' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['c1:Carnes rojas']);
      expect(vueltasAtras).toHaveLength(1);
    });

    it('guardar una nueva la crea', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/categorias/nueva');
      estado.formulario = { nombre: 'Fiambres', color: 'bebidas', foto: '' };
      await tocar('guardar-categoria');
      expect(estado.categoriasGuardadas).toEqual(['nueva:Fiambres']);
    });

    it('borrar pregunta con las recetas, y confirmar borra y vuelve a la lista', async () => {
      const { abrir, tocar, enLugar, reemplazos } = await montar();
      await abrir('#/categorias/c1');
      await tocar('borrar-categoria');
      expect(enLugar.at(-1)).toContain('Carnes y su receta va a la papelera de Drive.');
      await tocar('borrar-categoria-confirmado');
      expect(estado.categoriasBorradas).toEqual(['c1']);
      expect(reemplazos.at(-1)).toBe('#/categorias');
    });
  });
```

(El doble de `document.querySelector` de `montar` responde `[data-formulario]`; si la confirmación de borrado de categoría necesita `[data-confirmar-borrado-categoria]`, sumarlo igual que el de `[data-confirmar-borrado]`.)

Correr: `npx vitest run tests/main-rutas.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: implementar en `src/main.ts`**

Imports:

```ts
import { renderListaCategorias, renderEdicionCategoria, confirmacionBorrarCategoria, botonBorrarCategoria } from './ui/gestion-categorias.js';
import { colorLibre, problemaDelNombre } from './categorias.js';
import { colorDeClave, urlDeFoto } from './ui/categorias.js';
```

Casos en el `switch` de `render`, antes de `'capturar'`:

```ts
    case 'categorias':
      return pintar(renderListaCategorias({
        categorias: store.categorias().map(categoria => ({ categoria, recetas: store.recetasDe(categoria.id).length }))
      }));

    case 'editar-categoria': {
      const id = ruta.params['id'] ?? 'nueva';
      const categoria = id === 'nueva' ? null : store.categorias().find(c => c.id === id) ?? null;
      // Un id que ya no está —borrada en otra pestaña— vuelve a la lista.
      if (id !== 'nueva' && !categoria) { irCerrando('#/categorias'); return; }
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      const valores = categoria
        ? { nombre: categoria.nombre, color: categoria.color, foto: categoria.foto }
        : { nombre: '', color: colorLibre(store.categorias().map(c => c.color)), foto: '' };
      return abrirEditor(renderEdicionCategoria({ categoria, valores, otros }));
    }
```

Una función de apoyo, junto a `revisarCompletitud`:

```ts
/**
 * La edición de una categoría, en cada tecla y en cada elección: la muestra de
 * arriba, la línea del nombre inválido y si Guardar se puede tocar. Toca el DOM
 * en vez de redibujar, que perdería el foco y el cursor.
 */
function revisarCategoria(): void {
  const form = document.querySelector<HTMLFormElement>('#app [data-formulario]');
  if (!form) return;
  const valor = (n: string): string => form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value ?? '';
  const otros = JSON.parse(form.dataset['otros'] ?? '[]') as string[];
  const problema = problemaDelNombre(valor('nombre'), otros);

  const muestra = form.querySelector<HTMLElement>('[data-muestra]');
  if (muestra) {
    muestra.style.setProperty('--c', colorDeClave(valor('color')));
    const im = muestra.querySelector<HTMLElement>('.im');
    const url = urlDeFoto(valor('foto'));
    if (im) { im.classList.toggle('trama', !url); im.style.backgroundImage = url ? `url(${url})` : ''; }
    const nm = muestra.querySelector<HTMLElement>('.nm');
    if (nm) nm.textContent = valor('nombre');
  }
  const linea = form.querySelector<HTMLElement>('.error-nombre');
  if (linea) { linea.hidden = !problema; linea.textContent = problema; }
  const guardar = document.querySelector<HTMLButtonElement>('#app [data-accion="guardar-categoria"]');
  if (guardar) guardar.disabled = !!problema || formularioActual() === editorAbierto?.formulario;
}

/** Elegir un color o una foto: el campo oculto, la marca y la muestra, sin redibujar. */
function elegirEnCategoria(campo: 'color' | 'foto', valor: string): void {
  const oculto = document.querySelector<HTMLInputElement>(`#app input[name="${campo}"]`);
  if (oculto) oculto.value = valor;
  for (const b of document.querySelectorAll<HTMLElement>(`#app [data-accion="elegir-${campo}"]`)) {
    b.setAttribute('aria-pressed', String(b.dataset['valor'] === valor));
  }
  revisarCategoria();
}
```

Acciones, en el manejador de clicks, antes de `if (accion === 'guardar')`:

```ts
  if (accion === 'elegir-color') { elegirEnCategoria('color', boton.dataset['valor'] ?? ''); return; }
  if (accion === 'elegir-foto') { elegirEnCategoria('foto', boton.dataset['valor'] ?? ''); return; }

  if (accion === 'guardar-categoria') {
    const form = document.querySelector<HTMLFormElement>('[data-formulario]');
    if (!form) return;
    const datos = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v : '']));
    const valores = { nombre: datos['nombre'] ?? '', color: datos['color'] ?? '', foto: datos['foto'] ?? '' };
    const id = vistaActual?.params['id'] ?? 'nueva';
    try {
      if (id === 'nueva') await store.crearCategoria(valores);
      else await store.editarCategoria(id, valores);
      registrarCategorias(store.categorias());
      editorAbierto = null;
      return history.back();
    } catch (err) {
      console.error(err);
      const categoria = id === 'nueva' ? null : store.categorias().find(c => c.id === id) ?? null;
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      // El motivo del nombre se dice tal cual; lo demás, sin el mensaje de Google (R1).
      const mensaje = err instanceof Error && problemaDelNombre(valores.nombre, otros) ? err.message : 'No se pudo guardar. Revisá la conexión.';
      pintar(renderEdicionCategoria({ categoria, valores, otros, error: mensaje }));
      return;
    }
  }

  if (accion === 'borrar-categoria') {
    const id = vistaActual?.params['id'] ?? '';
    const categoria = store.categorias().find(c => c.id === id);
    if (categoria) boton.outerHTML = confirmacionBorrarCategoria(categoria.nombre, store.recetasDe(id).map(e => e.titulo));
    return;
  }
  if (accion === 'cancelar-borrar-categoria') {
    const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
    if (confirmacion) confirmacion.outerHTML = botonBorrarCategoria;
    return;
  }
  if (accion === 'borrar-categoria-confirmado') {
    const id = vistaActual?.params['id'] ?? '';
    try {
      await store.borrarCategoria(id);
      registrarCategorias(store.categorias());
      editorAbierto = null;
      irCerrando('#/categorias');
      return;
    } catch (err) {
      console.error(err);
      const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
      if (confirmacion) confirmacion.outerHTML = aviso({ texto: 'No se pudo borrar. La categoría sigue estando.' }) + botonBorrarCategoria;
      return;
    }
  }
```

En el listener de `input`, al principio:

```ts
  if (vistaActual?.vista === 'editar-categoria') return revisarCategoria();
```

- [ ] **Paso 3: correr**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

---

### Tarea 6: documentos, y mostrar los cambios

**Archivos:**
- Modificar: `product-design/product/specs/E05-Cimientos.md`, `product-design/ux/design-system.md`, `CLAUDE.md`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`

- [ ] **Paso 1: `E05-Cimientos.md`**

- En C05.9b.1, la línea «Muestra la carpeta base en uso y ofrece cambiarla…» se va de Cuenta.
- Después de C05.9b.3, una capacidad nueva:

```markdown
#### C05.9b.4 — Recetario: la carpeta y las categorías *(transversal)* `[2026-09-13]`

- [ ] Una ficha propia, segunda en Ajustes, muestra la carpeta base en uso y ofrece cambiarla; la anterior queda como está en Drive.
- [ ] Desde ahí se gestionan las categorías: crear, renombrar, elegir color de la paleta y foto del catálogo, y borrar. Las predefinidas no tienen trato especial.
- [ ] Un nombre vacío, que empiece con `_` o repetido sin mirar tildes ni mayúsculas no se acepta, y se dice por qué.
- [ ] Borrar una categoría con recetas lo advierte con la cantidad y los nombres: la carpeta y sus recetas van a la papelera de Drive.
```

- [ ] **Paso 2: `design-system.md` §2.3**

Agregar a la lista de «Cómo se agrega una categoría»: «`[2026-09-13]` Las categorías se crean y se editan desde la app —*Ajustes → Recetario → Categorías*—: el color se elige de la paleta, y una nueva arranca con el primero que nadie usa.»

- [ ] **Paso 3: `CLAUDE.md`**

- «Ubicación en Drive»: donde dice que una carpeta nueva aparece al reindexar, agregar «, aunque el camino normal es crearla desde *Ajustes → Recetario → Categorías*».
- Estado: un párrafo «**Hecho el 2026-09-13 — gestión de categorías (P15/P19, etapa 3a):** crear, renombrar, editar color y foto, y borrar categorías desde Ajustes; el nombre de la categoría de cada receta sale de su carpeta. Spec en `docs/superpowers/specs/2026-09-13-gestion-de-categorias-design.md`. **Falta probarlo en el teléfono.**»; la cantidad de tests al número que dé `npm test`.

- [ ] **Paso 4: `decision-log.md`**

Versión 2.2, y al final de la tabla:

```markdown
| 2026-09-13 | **Las categorías se gestionan desde Ajustes, todas por igual, y borrar una manda su carpeta a la papelera con sus recetas.** El nombre de la categoría de cada receta sale de su `carpeta_id`, no de la columna `categoria`. | Etapa 3a de P15/P19. Crear, renombrar o borrar una categoría obligaba a ir a Drive y reindexar. | Proteger las predefinidas de la edición o del borrado; permitir borrar sólo las vacías; mover las recetas a *Sin categorizar* al borrar; reescribir las filas de las recetas al renombrar. | Todas iguales es una sola regla. Borrar con sus recetas es una operación, y la advertencia explícita más la papelera de Drive cubren el error. Derivar el nombre deja renombrar en una fila, sin chocar con la cuota de 60 escrituras por minuto de Sheets. | La columna `categoria` de `recetas` puede quedar vieja hasta que la receta se guarde o se reindexe; la app no la lee. |
```

- [ ] **Paso 5: `BACKLOG.md`**

- En la fila de **P19**, agregar antes del `|` final: « **Etapa 3a hecha** `[2026-09-13]`: gestión de categorías desde *Ajustes → Recetario* (spec `docs/superpowers/specs/2026-09-13-gestion-de-categorias-design.md`). Queda la 3b: imágenes propias en Drive.»
- En la fila de **P25**, el orden pasa a «1. Cuenta; 2. **Recetario** —la carpeta y las categorías, etapa 3a—; 3. Índice; 4. Archivos locales; 5. Avisos; 6. Registro de actividad».

- [ ] **Paso 6: verificación final y mostrar los cambios**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

Correr: `git status --short && git diff --stat`, y presentarle al usuario el resumen para revisar. **No commitear ni pushear.**
