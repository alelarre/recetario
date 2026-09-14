# Carpeta base elegida (P15/P19, etapa 2) — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDO: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para el seguimiento.

**Objetivo:** que la app encuentre su carpeta por una marca en `appProperties`, que sin carpeta ofrezca un selector dentro de la app, que el setup arme la estructura con las 16 predefinidas, y que se pueda cambiar de carpeta desde Ajustes.

**Arquitectura:** `drive.ts` suma tres consultas de carpetas propias. `store.ts` arranca por la marca —ya no por el nombre `Recetario`—, descarta la copia si la `meta` anterior dice `reemplazada`, y suma el setup (`prepararCarpeta`) y lo que el selector necesita. `src/ui/carpeta.ts` dibuja el selector; `main.ts` lo cablea en la ruta `#/carpeta`.

**Stack:** TypeScript estricto + Vite, sin framework. Vitest en `environment: 'node'` con dobles a mano.

**Spec:** `docs/superpowers/specs/2026-09-13-carpeta-base-design.md` — leerlo antes de empezar.

## Restricciones globales

- **Sin commits ni push.** La última tarea termina mostrando el diff.
- **Idioma:** español rioplatense en comentarios, nombres y UI.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess` (sólo `src`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`.
- **La marca:** `appProperties` `recetario=raiz`, en `MARCA_RAIZ` de `src/config.ts`.
- **Sólo carpetas propias:** toda consulta del selector y de la marca lleva `'me' in owners`.
- **Las predefinidas** salen de `PREDEFINIDAS` de `src/categorias.ts`; ningún otro archivo las nombra.
- **`SCHEMA_VERSION` no cambia.**
- **Verificación de cada tarea:** `npm test` y `npm run typecheck` en verde.

## Mapa de archivos

| Archivo | Qué cambia |
|---|---|
| `src/config.ts` | `MARCA_RAIZ`. |
| `src/drive.ts` | `q.marcadas`, `q.carpetasPropiasDe`, `q.carpetasPropiasPorNombre`; `carpetasMarcadas()`, `carpetasPropias()`, `carpetasPropiasPorNombre()`; `propiedades` acepta `null`. |
| `src/indice-local.ts` | `CopiaIndice` suma `raizNombre`. |
| `src/store.ts` | `ResultadoArranque` sin `falta-estructura`; `elegir-carpeta` con `sugerencias`; arranque por la marca y por `reemplazada`; `carpeta()`, `carpetasDe()`, `crearCarpeta()`, `prepararCarpeta()`, `marcarReemplazada()`. |
| `src/ui/router.ts` | Vista `carpeta`. |
| `src/ui/carpeta.ts` | **Nuevo.** `renderSelector`. |
| `src/ui/ajustes.ts` | La ficha Cuenta: «Carpeta: …» y *Cambiar carpeta*. |
| `src/main.ts` | El selector: estado, ruta, acciones y setup; *Cambiar carpeta*. |
| `tests/dobles.ts` | Drive falso: las tres consultas, `ajena`, `propiedades` con `null`. |
| `tests/aserciones.ts` | `arranqueEligiendo` sin cambios de firma. |
| Tests | `drive-carpetas.test.ts`, `store-carpeta-base.test.ts`, `vista-carpeta.test.ts` nuevos; la raíz marcada en los fixtures de `store-*` y `compartido`; `store-arranque`, `indice-local`, `router`, `vista-ajustes`, `main-rutas`. |
| Documentos | `SETUP.md`, `CLAUDE.md`, `E05-Cimientos.md`, `user-flows.md`, `decision-log.md`, `BACKLOG.md`. |

---

### Tarea 1: las consultas de carpetas en Drive

**Archivos:**
- Modificar: `src/config.ts`, `src/drive.ts`, `tests/dobles.ts`
- Crear: `tests/drive-carpetas.test.ts`
- Modificar: los fixtures con `{ id: 'raiz', name: 'Recetario', … }` en `tests/` (marcar la raíz)

**Interfaces:**
- Produce:
  - `config.ts`: `export const MARCA_RAIZ = { clave: 'recetario', valor: 'raiz' } as const;`
  - `drive.ts`: `carpetasMarcadas(): Promise<ArchivoDrive[]>` (campos `id,name,modifiedTime`), `carpetasPropias(padre: string): Promise<ArchivoDrive[]>` (`id,name`), `carpetasPropiasPorNombre(nombre: string): Promise<ArchivoDrive[]>` (`id,name`), `propiedades(id, props: Record<string, string | null>)`.
  - Drive falso: las tres consultas (con `fallar('carpetasMarcadas')` y `fallar('carpetasPropias')`), `ArchivoFalso.ajena?: boolean`, y `propiedades` que borra las claves en `null`.

- [ ] **Paso 1: test que falla**

Crear `tests/drive-carpetas.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { crearDrive } from '../src/drive.js';
import type { Drive } from '../src/drive.js';

describe('las consultas de carpetas propias', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let drive: Drive;
  const consulta = (): string => decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]));

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: async () => ({ files: [] })
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    drive = crearDrive(() => Promise.resolve('token-test'));
  });

  it('las marcadas: por la propiedad de la app, propias, carpetas y fuera de la papelera', async () => {
    await drive.carpetasMarcadas();
    expect(consulta()).toContain("appProperties has { key='recetario' and value='raiz' }");
    expect(consulta()).toContain("'me' in owners");
    expect(consulta()).toContain("mimeType='application/vnd.google-apps.folder'");
    expect(consulta()).toContain('trashed=false');
  });

  it('las de un nivel: hijas de esa carpeta y propias', async () => {
    await drive.carpetasPropias('root');
    expect(consulta()).toContain("'root' in parents");
    expect(consulta()).toContain("'me' in owners");
  });

  it('por nombre: propias y carpetas', async () => {
    await drive.carpetasPropiasPorNombre('Recetario');
    expect(consulta()).toContain("name='Recetario'");
    expect(consulta()).toContain("'me' in owners");
  });

  it('quitar una propiedad es mandarla en null', async () => {
    await drive.propiedades('c1', { recetario: null });
    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(opciones.body))).toEqual({ appProperties: { recetario: null } });
  });
});
```

Correr: `npx vitest run tests/drive-carpetas.test.ts`
Esperado: FAIL (`drive.carpetasMarcadas` no es una función).

- [ ] **Paso 2: implementar**

`src/config.ts`, después de `NOMBRE_BORRADORES`:

```ts
/**
 * La marca de la carpeta base en sus `appProperties`. La app la encuentra por
 * esta marca y no por el nombre: la carpeta puede llamarse como el usuario quiera.
 */
export const MARCA_RAIZ = { clave: 'recetario', valor: 'raiz' } as const;
```

`src/drive.ts`: importar `MARCA_RAIZ` de `./config.js`, y `q` suma:

```ts
  /** La carpeta base: la que lleva la marca de la app. Sólo propias. */
  marcadas: (): string =>
    `appProperties has { key='${MARCA_RAIZ.clave}' and value='${MARCA_RAIZ.valor}' } and ` +
    `'me' in owners and mimeType='${MIME_CARPETA}' and trashed=false`,
  /** Las carpetas propias dentro de otra: un nivel del selector. */
  carpetasPropiasDe: (id: string): string =>
    `'${escapar(id)}' in parents and mimeType='${MIME_CARPETA}' and 'me' in owners and trashed=false`,
  carpetasPropiasPorNombre: (nombre: string): string =>
    `name='${escapar(nombre)}' and mimeType='${MIME_CARPETA}' and 'me' in owners and trashed=false`
```

El objeto que devuelve `crearDrive` suma, después de `listarHijos`:

```ts
    carpetasMarcadas: () => listar(q.marcadas(), 'files(id,name,modifiedTime)'),
    carpetasPropias: (padre: string) => listar(q.carpetasPropiasDe(padre), 'files(id,name)'),
    carpetasPropiasPorNombre: (nombre: string) => listar(q.carpetasPropiasPorNombre(nombre), 'files(id,name)'),
```

y `propiedades` pasa a `(id: string, props: Record<string, string | null>) =>`, con el comentario: «Una clave en `null` se borra.»

`tests/dobles.ts`: `ArchivoFalso` suma

```ts
  /** De otra persona, compartida con el usuario: `'me' in owners` la deja afuera. */
  ajena?: boolean;
```

Después de `listarHijos`:

```ts
    async carpetasMarcadas() {
      api.llamadas.push(['carpetasMarcadas']);
      if (fallas.has('carpetasMarcadas')) throw fallas.get('carpetasMarcadas');
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && a.appProperties?.['recetario'] === 'raiz');
    },
    async carpetasPropias(padre: string) {
      api.llamadas.push(['carpetasPropias', padre]);
      if (fallas.has('carpetasPropias')) throw fallas.get('carpetasPropias');
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && (a.parents ?? []).includes(padre));
    },
    async carpetasPropiasPorNombre(nombre: string) {
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && a.name === nombre);
    },
```

con `const MIME_CARPETA = 'application/vnd.google-apps.folder';` arriba del archivo, y `propiedades` queda:

```ts
    async propiedades(id: string, props: Record<string, string | null>) {
      api.llamadas.push(['propiedades', id, props]);
      const a = exigir(id);
      const nuevas: Record<string, string> = { ...a.appProperties };
      for (const [clave, valor] of Object.entries(props)) {
        if (valor === null) delete nuevas[clave]; else nuevas[clave] = valor;
      }
      a.appProperties = nuevas;
      return a;
    },
```

- [ ] **Paso 3: marcar la raíz en los fixtures**

Desde la Tarea 2 el arranque busca la marca y no el nombre. Marcar la raíz de todos los fixtures de una vez:

```bash
grep -rl "{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: \['drive'\] }" tests \
  | xargs sed -i '' "s/{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: \['drive'\] }/{ id: 'raiz', name: 'Recetario', mimeType: CARPETA, parents: ['drive'], appProperties: { recetario: 'raiz' } }/g"
```

Revisar con `grep -rn "name: 'Recetario'" tests`: quedan sin marca sólo los de `store-arranque.test.ts` con ids `r1` y `r2`, que la Tarea 2 reescribe.

- [ ] **Paso 4: correr**

Correr: `npx vitest run tests/drive-carpetas.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 2: arrancar por la marca

**Archivos:**
- Modificar: `src/store.ts`, `src/indice-local.ts`, `tests/indice-local.test.ts`, `tests/store-indice-local.test.ts`, `tests/store-informe.test.ts`, `tests/store-arranque.test.ts`, `tests/store-categorias.test.ts`
- Crear: `tests/store-carpeta-base.test.ts`

**Interfaces:**
- Consume: Tarea 1.
- Produce:
  - `ResultadoArranque` sin `falta-estructura`; `{ estado: 'elegir-carpeta'; sugerencias: ArchivoDrive[]; avisos: string[] }`.
  - `CopiaIndice.raizNombre: string`; `ctx.raizNombre`.
  - `store.carpeta(): { id: string; nombre: string }`.
  - `DriveDelStore` suma `'carpetasMarcadas' | 'carpetasPropias' | 'carpetasPropiasPorNombre'`.
  - Interna: `porLaMarca(): Promise<ResultadoArranque | null>`.

- [ ] **Paso 1: tests que fallan**

Crear `tests/store-carpeta-base.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { crearStore } from '../src/store.js';
import { COLUMNAS } from '../src/catalogo.js';
import { COLUMNAS_BORRADORES } from '../src/borrador.js';
import { COLUMNAS_CATEGORIAS } from '../src/categorias.js';
import { SCHEMA_VERSION } from '../src/config.js';
import { driveFalso, sheetsFalso, indiceLocalFalso } from './dobles.js';
import type { SheetsFalso } from './dobles.js';
import { arranqueListo, arranqueEligiendo } from './aserciones.js';

const CARPETA = 'application/vnd.google-apps.folder';
const PLANILLA = 'application/vnd.google-apps.spreadsheet';
const MARCA = { recetario: 'raiz' };

/** Una planilla `_indice` completa, con la meta que se pida. */
function planilla(sheets: SheetsFalso, id: string, meta: string[][] = [['schemaVersion', String(SCHEMA_VERSION)]]) {
  sheets.crearPlanilla(id, ['recetas', 'meta', 'borradores', 'categorias']);
  sheets.cargar(id, 'recetas', [[...COLUMNAS]]);
  sheets.cargar(id, 'meta', meta);
  sheets.cargar(id, 'borradores', [[...COLUMNAS_BORRADORES]]);
  sheets.cargar(id, 'categorias', [[...COLUMNAS_CATEGORIAS]]);
}

describe('arrancar por la marca', () => {
  it('una carpeta marcada es la raíz, aunque no se llame Recetario', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Mis recetas', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    const r = arranqueListo(await store.arrancar());
    expect(r.raizId).toBe('m1');
    expect(store.carpeta()).toEqual({ id: 'm1', nombre: 'Mis recetas' });
  });

  it('sin marcadas, elegir-carpeta con las propias llamadas Recetario, sin las ajenas', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'r2', name: 'Recetario', mimeType: CARPETA, parents: ['root'], ajena: true }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    const r = arranqueEligiendo(await store.arrancar());
    expect(r.sugerencias.map(c => c.id)).toEqual(['r1']);
  });

  it('sin marcadas ni Recetario, elegir-carpeta sin sugerencias', async () => {
    const store = crearStore({ drive: driveFalso([]), sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias).toEqual([]);
  });

  it('con varias marcadas, elegir-carpeta con las marcadas', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Una', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'm2', name: 'Otra', mimeType: CARPETA, parents: ['root'], appProperties: MARCA }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias.map(c => c.id).sort()).toEqual(['m1', 'm2']);
  });

  it('una marcada ajena no cuenta', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'De otra persona', mimeType: CARPETA, parents: ['root'], appProperties: MARCA, ajena: true }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(arranqueEligiendo(await store.arrancar()).sugerencias).toEqual([]);
  });

  it('si la búsqueda de la marca falla, solo-lectura', async () => {
    const drive = driveFalso([]);
    drive.fallar('carpetasMarcadas', Object.assign(new Error('sin red'), { status: 0 }));
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect((await store.arrancar()).estado).toBe('solo-lectura');
  });

  it('la copia de una carpeta reemplazada se descarta y se usa la marcada', async () => {
    // Otro dispositivo cambió de carpeta: la vieja perdió la marca y su meta dice
    // reemplazada, y la nueva está marcada.
    const drive = driveFalso([
      { id: 'vieja', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'iv', name: '_indice', mimeType: PLANILLA, parents: ['vieja'], modifiedTime: '2026-09-14T00:00:00.000Z' },
      { id: 'nueva', name: 'Cocina', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'in', name: '_indice', mimeType: PLANILLA, parents: ['nueva'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'iv', [['schemaVersion', String(SCHEMA_VERSION)], ['reemplazada', 'si']]);
    planilla(sheets, 'in');
    const copia = {
      schemaVersion: SCHEMA_VERSION, indiceId: 'iv', raizId: 'vieja', raizNombre: 'Recetario',
      modifiedTime: '2026-09-13T00:00:00.000Z', meta: {}, filas: [], borradores: [], categorias: []
    };
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso(copia) });
    const r = arranqueListo(await store.arrancar());
    expect(r.raizId).toBe('nueva');
    expect(r.indiceId).toBe('in');
  });

  it('la copia guarda el nombre de la carpeta', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Mis recetas', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });
    await store.arrancar();
    await store.cargarIndice();
    expect(indiceLocal.actual()?.raizNombre).toBe('Mis recetas');
  });
});
```

Correr: `npx vitest run tests/store-carpeta-base.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: la copia suma `raizNombre`**

`src/indice-local.ts`, en `CopiaIndice` después de `raizId`:

```ts
  /** El nombre de la carpeta, para mostrar en Ajustes sin pedidos. */
  raizNombre: string;
```

y `esCopia` suma `&& typeof x['raizNombre'] === 'string'`.

Fixtures de copias: sumar `raizNombre: 'Recetario'` a `copia` en `tests/indice-local.test.ts` y a `copiaVigente` en `tests/store-indice-local.test.ts` y `tests/store-informe.test.ts`.

- [ ] **Paso 3: implementar en `src/store.ts`**

Imports: sumar `MARCA_RAIZ` a `./config.js` (y dejar de usar `NOMBRE_RAIZ` sólo para la búsqueda de la raíz: sigue usándose para las sugerencias).

`ResultadoArranque`: borrar la línea de `falta-estructura`, y el caso `elegir-carpeta` pasa a:

```ts
  /**
   * No hay carpeta marcada, o hay más de una: la elige el usuario. Las
   * sugerencias son las marcadas o, si no hay ninguna, las propias llamadas
   * Recetario.
   */
  | { estado: 'elegir-carpeta'; sugerencias: ArchivoDrive[]; avisos: string[] }
```

`DriveDelStore` suma `'carpetasMarcadas' | 'carpetasPropias' | 'carpetasPropiasPorNombre'`.

`Contexto` suma después de `raizId`:

```ts
  /** El nombre de la carpeta base, para Ajustes. */
  raizNombre: string;
```

(inicializado en `''`), y `copiaActual()` suma `raizNombre: ctx.raizNombre`.

En `arrancar`, el bloque `if (guardada && conocida)` suma `ctx.raizNombre = guardada.raizNombre;` junto a `ctx.raizId = guardada.raizId;`.

Reemplazar el bloque `if (!conocida) { … }` entero por:

```ts
    if (!conocida) {
      const resultado = await porLaMarca();
      if (resultado) return resultado;
    }
```

y el cierre, desde `const comparacion = compararCopia();` hasta el `if (!planillaNueva) { … }` inclusive, por:

```ts
    let comparacion = compararCopia();
    if (!planillaNueva && comparacion.estado !== 'coincide') {
      ctx.meta = await leerMeta();
      // Otro dispositivo cambió de carpeta: la de la copia quedó atrás (§5.2 del diseño).
      if (conocida && ctx.meta['reemplazada']) {
        indiceLocal.borrar();
        const resultado = await porLaMarca();
        if (resultado) return resultado;
        comparacion = compararCopia();
        if (!planillaNueva) ctx.meta = await leerMeta();
      }
    } else if (!planillaNueva && comparacion.copia) {
      usarCopia(comparacion.copia);
    }
    let reindexado: MotivoReindexado = planillaNueva ? 'planilla-nueva' : '';
    if (!planillaNueva) {
      if (ctx.meta['reconstruccion_en_curso']) reindexado = 'a-medias';
      if (Number(ctx.meta['schemaVersion']) !== SCHEMA_VERSION) reindexado = 'esquema';
    }
```

`porLaMarca` es una función interna de `arrancar` —usa `avisos`, `soloLectura`, `planillaNueva` e `indiceDuplicado`—, declarada antes del `if (guardada && conocida)`:

```ts
    /**
     * Sin copia útil: la carpeta marcada. Devuelve un resultado si el arranque
     * termina acá —sin red, o sin una sola carpeta marcada—; si no, deja la raíz
     * y `_indice` en el contexto.
     */
    const porLaMarca = async (): Promise<ResultadoArranque | null> => {
      let marcadas: ArchivoDrive[];
      try {
        marcadas = await drive.carpetasMarcadas();
      } catch (e) {
        return soloLectura(e);
      }
      const raiz = marcadas.length === 1 ? marcadas[0] : undefined;
      if (!raiz) {
        let sugerencias = marcadas;
        if (marcadas.length === 0) {
          try {
            sugerencias = await drive.carpetasPropiasPorNombre(NOMBRE_RAIZ);
          } catch (e) {
            return soloLectura(e);
          }
        }
        return { estado: 'elegir-carpeta', sugerencias, avisos };
      }
      ctx.raizId = raiz.id;
      ctx.raizNombre = raiz.name ?? '';

      let planillas: ArchivoDrive[];
      try {
        planillas = await drive.buscarPorNombre(NOMBRE_INDICE, ctx.raizId);
      } catch (e) {
        return soloLectura(e);
      }
      if (planillas.length === 0) {
        ctx.indiceId = await crearPlanilla();
        ctx.modifiedTime = '';
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
      return null;
    };
```

Antes de `return { arrancar, … }`:

```ts
  /** La carpeta base en uso, para la ficha Cuenta de Ajustes. */
  function carpeta(): { id: string; nombre: string } {
    return { id: ctx.raizId, nombre: ctx.raizNombre };
  }
```

y el `return` suma `carpeta`.

- [ ] **Paso 4: ajustar `store-arranque.test.ts`**

- «sin carpeta Recetario no crea nada y manda al SETUP» pasa a:

```ts
  it('sin carpeta marcada no crea nada y pide elegir', async () => {
    const { store, drive } = armar(driveFalso([]));
    const r = await store.arrancar();
    expect(arranqueEligiendo(r).sugerencias).toEqual([]);
    expect(drive._store.size).toBe(0);
  });
```

- «con dos carpetas Recetario pide elegir»: las dos carpetas suman `appProperties: { recetario: 'raiz' }`, y la aserción pasa a `expect(arranqueEligiendo(r).sugerencias).toHaveLength(2);`.
- «si la búsqueda falla arranca en solo lectura y NO crea una segunda planilla»: `drive.fallar('buscarPorNombre', …)` pasa a `drive.fallar('carpetasMarcadas', …)`.
- «si falla buscarPorNombre de planilla…»: la búsqueda por nombre ya es sólo la de `_indice`, así que el contador pasa de `callCount === 2` a `callCount === 1`.

En `tests/store-categorias.test.ts`, el test «si _indice ya no está, busca como la primera vez» pasa a esperar `drive.llamadas.some(l => l[0] === 'carpetasMarcadas')`.

- [ ] **Paso 5: correr**

Correr: `npx vitest run tests/store-carpeta-base.test.ts && npm test && npm run typecheck`
Esperado: todo en verde. `src/main.ts` deja de compilar por `falta-estructura` y `candidatas`: por ahora, borrar esos dos `if` de `arrancar` en `main.ts` y dejar `elegir-carpeta` con el aviso viejo —la Tarea 5 lo reemplaza—.

---

### Tarea 3: el setup

**Archivos:**
- Modificar: `src/store.ts`, `tests/store-carpeta-base.test.ts`

**Interfaces:**
- Consume: Tareas 1 y 2; `PREDEFINIDAS` y `normalizar`.
- Produce:
  - `store.carpetasDe(id: string): Promise<{ id: string; nombre: string }[]>` —ordenadas por nombre—.
  - `store.crearCarpeta(nombre: string, padre: string): Promise<{ id: string; nombre: string }>`.
  - `store.prepararCarpeta(carpeta: { id: string; nombre: string }, alProgresar?: (p: Progreso) => void): Promise<{ ignorados: string[] }>`.
  - `store.marcarReemplazada(): Promise<void>`.

- [ ] **Paso 1: tests que fallan**

Agregar a `tests/store-carpeta-base.test.ts` (sumar `import { PREDEFINIDAS } from '../src/categorias.js';`):

```ts
describe('el setup de una carpeta', () => {
  const subcarpetas = (drive: ReturnType<typeof driveFalso>, padre: string) =>
    [...drive._store.values()].filter(a => a.mimeType === CARPETA && !a.trashed && (a.parents ?? []).includes(padre));

  it('sobre una carpeta vacía: las 16 con color y foto, _indice, reindexa y marca', async () => {
    const drive = driveFalso([{ id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }]);
    const sheets = sheetsFalso();
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });

    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });

    const creadas = subcarpetas(drive, 'n1');
    expect(creadas.map(c => c.name).sort()).toEqual(PREDEFINIDAS.map(p => p.nombre).sort());
    expect(creadas.find(c => c.name === 'Pastas')?.appProperties).toEqual({ color: 'pastas', foto: 'catalogo:pastas' });
    expect([...drive._store.values()].some(a => a.name === '_indice' && (a.parents ?? []).includes('n1'))).toBe(true);
    expect(drive._store.get('n1')?.appProperties).toEqual(MARCA);
    expect(store.categorias()).toHaveLength(16);
    expect(indiceLocal.actual()?.raizNombre).toBe('Nueva');
  });

  it('sobre una carpeta que ya tiene las 16, no crea ninguna', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      ...PREDEFINIDAS.map((p, i) => ({ id: `c${i}`, name: p.nombre, mimeType: CARPETA, parents: ['r1'] }))
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    expect(subcarpetas(drive, 'r1')).toHaveLength(16);
  });

  it('conserva las carpetas propias y crea las predefinidas que faltan', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'f1', name: 'Fiambres', mimeType: CARPETA, parents: ['r1'] },
      { id: 'p1', name: 'pastas', mimeType: CARPETA, parents: ['r1'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    // Pastas ya estaba —con otra mayúscula—: 15 nuevas más las dos que había.
    expect(subcarpetas(drive, 'r1')).toHaveLength(17);
    expect(store.categorias().map(c => c.nombre)).toContain('Fiambres');
  });

  it('si se corta antes de marcar, queda sin marca y sin copia; repetirlo no duplica', async () => {
    const drive = driveFalso([{ id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }]);
    const sheets = sheetsFalso();
    const indiceLocal = indiceLocalFalso();
    const store = crearStore({ drive, sheets, indiceLocal });
    const propiedades = drive.propiedades.bind(drive);
    drive.propiedades = async (id: string, props: Record<string, string | null>) => {
      if (props['recetario']) throw new Error('red');
      return propiedades(id, props);
    };

    await expect(store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' })).rejects.toThrow('red');
    expect(drive._store.get('n1')?.appProperties?.['recetario']).toBeUndefined();
    expect(indiceLocal.actual()).toBeNull();

    drive.propiedades = propiedades;
    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });
    expect(subcarpetas(drive, 'n1')).toHaveLength(16);
    expect([...drive._store.values()].filter(a => a.name === '_indice' && !a.trashed)).toHaveLength(1);
  });

  it('marcar la nueva quita la marca de las otras', async () => {
    const drive = driveFalso([
      { id: 'vieja', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'n1', name: 'Nueva', mimeType: CARPETA, parents: ['root'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'n1', nombre: 'Nueva' });
    expect(drive._store.get('vieja')?.appProperties?.['recetario']).toBeUndefined();
    expect(drive._store.get('n1')?.appProperties).toEqual(MARCA);
  });

  it('volver a una carpeta con reemplazada la borra', async () => {
    const drive = driveFalso([
      { id: 'r1', name: 'Recetario', mimeType: CARPETA, parents: ['root'] },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['r1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1', [['schemaVersion', String(SCHEMA_VERSION)], ['reemplazada', 'si']]);
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.prepararCarpeta({ id: 'r1', nombre: 'Recetario' });
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['reemplazada']).toBe('');
  });

  it('marcarReemplazada anota en la meta de la carpeta en uso', async () => {
    const drive = driveFalso([
      { id: 'm1', name: 'Recetario', mimeType: CARPETA, parents: ['root'], appProperties: MARCA },
      { id: 'i1', name: '_indice', mimeType: PLANILLA, parents: ['m1'] }
    ]);
    const sheets = sheetsFalso();
    planilla(sheets, 'i1');
    const store = crearStore({ drive, sheets, indiceLocal: indiceLocalFalso() });
    await store.arrancar();
    await store.marcarReemplazada();
    const meta = Object.fromEntries((await sheets.leer('i1', 'meta!A1:B20')).map(f => [f[0], f[1]]));
    expect(meta['reemplazada']).toBe('si');
  });
});

describe('lo que usa el selector', () => {
  it('carpetasDe da las propias de un nivel, por nombre', async () => {
    const drive = driveFalso([
      { id: 'b', name: 'Libros', mimeType: CARPETA, parents: ['root'] },
      { id: 'a', name: 'Cocina', mimeType: CARPETA, parents: ['root'] },
      { id: 'x', name: 'Ajena', mimeType: CARPETA, parents: ['root'], ajena: true },
      { id: 'f', name: 'nota.md', parents: ['root'] }
    ]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    expect(await store.carpetasDe('root')).toEqual([{ id: 'a', nombre: 'Cocina' }, { id: 'b', nombre: 'Libros' }]);
  });

  it('crearCarpeta la crea en el nivel', async () => {
    const drive = driveFalso([{ id: 'a', name: 'Cocina', mimeType: CARPETA, parents: ['root'] }]);
    const store = crearStore({ drive, sheets: sheetsFalso(), indiceLocal: indiceLocalFalso() });
    const nueva = await store.crearCarpeta('Recetario', 'a');
    expect(nueva.nombre).toBe('Recetario');
    expect(drive._store.get(nueva.id)).toMatchObject({ mimeType: CARPETA, parents: ['a'] });
  });
});
```

Correr: `npx vitest run tests/store-carpeta-base.test.ts`
Esperado: FAIL (`store.prepararCarpeta` no es una función).

- [ ] **Paso 2: implementar en `src/store.ts`**

Imports: sumar `PREDEFINIDAS` al de `./categorias.js`. `normalizar` ya está importado de `./recipe.js`.

Antes de `categorias()`:

```ts
  /** Las carpetas propias de un nivel, por nombre: lo que lista el selector. */
  async function carpetasDe(id: string): Promise<{ id: string; nombre: string }[]> {
    return (await drive.carpetasPropias(id))
      .map(c => ({ id: c.id, nombre: c.name ?? '' }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  /** «Crear una carpeta nueva acá», en el selector. */
  async function crearCarpeta(nombre: string, padre: string): Promise<{ id: string; nombre: string }> {
    const creada = await drive.crear({ nombre, padre, mime: MIME_CARPETA });
    return { id: creada.id, nombre };
  }

  /**
   * El setup de una carpeta base (§5.1 del diseño): las predefinidas que
   * falten, `_indice`, el reindexado y la marca, en ese orden. La marca va
   * última: si algo falla antes, la carpeta queda sin marcar y el selector
   * vuelve a ofrecerla. Repetirlo no duplica nada.
   */
  async function prepararCarpeta(
    carpeta: { id: string; nombre: string }, alProgresar: (p: Progreso) => void = () => {}
  ): Promise<{ ignorados: string[] }> {
    ctx.raizId = carpeta.id;
    ctx.raizNombre = carpeta.nombre;
    ctx.modifiedTime = '';

    // 1. Las predefinidas que falten, con su color y su foto ya escritos.
    const existentes = new Set((await drive.listarCarpetas(carpeta.id)).map(c => normalizar(c.name ?? '')));
    for (const p of PREDEFINIDAS) {
      if (existentes.has(normalizar(p.nombre))) continue;
      const nueva = await drive.crear({ nombre: p.nombre, padre: carpeta.id, mime: MIME_CARPETA });
      await drive.propiedades(nueva.id, { color: p.color, foto: `catalogo:${p.foto}` });
    }

    // 2. `_indice`, y sin la anotación de una carpeta que se había dejado.
    const planillas = await drive.buscarPorNombre(NOMBRE_INDICE, carpeta.id);
    const masReciente = [...planillas].sort(
      (a, b) => Date.parse(b.modifiedTime ?? '') - Date.parse(a.modifiedTime ?? ''))[0];
    if (masReciente) {
      ctx.indiceId = masReciente.id;
      ctx.meta = await leerMeta();
      if (ctx.meta['reemplazada']) await guardarMeta('reemplazada', '');
    } else {
      ctx.indiceId = await crearPlanilla();
      ctx.meta = { schemaVersion: String(SCHEMA_VERSION), ultima_reconstruccion: '' };
    }

    // 3. Reindexar: escribe las propiedades que falten y guarda la copia.
    const { ignorados } = await reconstruir(alProgresar);

    // 4. La marca, y fuera de las otras.
    try {
      for (const otra of await drive.carpetasMarcadas()) {
        if (otra.id !== carpeta.id) await drive.propiedades(otra.id, { [MARCA_RAIZ.clave]: null });
      }
      await drive.propiedades(carpeta.id, { [MARCA_RAIZ.clave]: MARCA_RAIZ.valor });
    } catch (e) {
      // La copia ya se guardó: sin marca, la próxima apertura la usaría igual.
      indiceLocal.borrar();
      throw e;
    }
    return { ignorados };
  }

  /**
   * Antes de cambiar de carpeta: la `meta` de la actual dice que quedó atrás.
   * Escribir le cambia la fecha a `_indice`, y así otro dispositivo con su copia
   * deja de usarla (§5.2 del diseño).
   */
  async function marcarReemplazada(): Promise<void> {
    await guardarMeta('reemplazada', 'si');
  }
```

El `return` suma `carpetasDe, crearCarpeta, prepararCarpeta, marcarReemplazada`.

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/store-carpeta-base.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 4: el selector, la ruta y Ajustes

**Archivos:**
- Crear: `src/ui/carpeta.ts`, `tests/vista-carpeta.test.ts`
- Modificar: `src/ui/router.ts`, `tests/router.test.ts`, `src/ui/ajustes.ts`, `tests/vista-ajustes.test.ts`

**Interfaces:**
- Produce:
  - `router.ts`: `Vista` suma `'carpeta'`; `#/carpeta?id=<id>&nombre=<nombre>` da `{ vista: 'carpeta', params: { id, nombre } }` (sin los que falten).
  - `carpeta.ts`: `interface CarpetaSimple { id: string; nombre: string }`, `interface OpcionesSelector { sugerencias: CarpetaSimple[]; nivel: CarpetaSimple; carpetas: CarpetaSimple[] | null; confirmando: CarpetaSimple | null; creando: boolean; cambiando: boolean; error?: string }`, `renderSelector(o: OpcionesSelector): string`. `nivel.id === 'root'` es «Mi unidad».
  - `ajustes.ts`: `OpcionesAjustes.carpeta?: string`.

- [ ] **Paso 1: tests que fallan**

`tests/router.test.ts`, dentro del `describe`:

```ts
  it('el selector de carpeta, con el nivel en la query', () => {
    expect(parsearHash('#/carpeta')).toEqual({ vista: 'carpeta', params: {} });
    expect(parsearHash('#/carpeta?id=a1&nombre=Cocina')).toEqual({ vista: 'carpeta', params: { id: 'a1', nombre: 'Cocina' } });
  });
```

Crear `tests/vista-carpeta.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderSelector } from '../src/ui/carpeta.js';
import type { OpcionesSelector } from '../src/ui/carpeta.js';

const base: OpcionesSelector = {
  sugerencias: [], nivel: { id: 'root', nombre: '' }, carpetas: [],
  confirmando: null, creando: false, cambiando: false
};

describe('el selector de carpeta', () => {
  it('dice qué hay que hacer y vuelve', () => {
    const html = renderSelector(base);
    expect(html).toContain('Elegí la carpeta de tus recetas');
    expect(html).toContain('data-accion="volver"');
  });

  it('las sugerencias van arriba y se eligen directo', () => {
    const html = renderSelector({ ...base, sugerencias: [{ id: 'r1', nombre: 'Recetario' }] });
    expect(html).toContain('Encontradas');
    expect(html).toContain('data-accion="carpeta-sugerida" data-id="r1" data-nombre="Recetario"');
  });

  it('sin sugerencias no hay sección', () => {
    expect(renderSelector(base)).not.toContain('Encontradas');
  });

  it('cada carpeta del nivel lleva a su nivel', () => {
    const html = renderSelector({ ...base, carpetas: [{ id: 'a1', nombre: 'Cocina y más' }] });
    expect(html).toContain('href="#/carpeta?id=a1&amp;nombre=Cocina%20y%20m%C3%A1s"');
  });

  it('en Mi unidad no se ofrece usarla; adentro sí, con su nombre en el rótulo', () => {
    expect(renderSelector(base)).not.toContain('data-accion="carpeta-usar"');
    expect(renderSelector(base)).toContain('Mi unidad');
    const adentro = renderSelector({ ...base, nivel: { id: 'a1', nombre: 'Cocina' } });
    expect(adentro).toContain('data-accion="carpeta-usar"');
    expect(adentro).toContain('Mi unidad › Cocina');
  });

  it('crear una carpeta nueva despliega el nombre precargado', () => {
    const html = renderSelector({ ...base, creando: true });
    expect(html).toContain('name="nombre-carpeta"');
    expect(html).toContain('value="Recetario"');
    expect(html).toContain('data-accion="carpeta-crear-confirmado"');
  });

  it('cargando, spinner; vacío, lo dice; con error, reintentar', () => {
    expect(renderSelector({ ...base, carpetas: null })).toContain('class="spin"');
    expect(renderSelector(base)).toContain('No hay carpetas acá.');
    expect(renderSelector({ ...base, error: 'No se pudieron leer las carpetas.' })).toContain('data-accion="reintentar"');
  });

  it('la confirmación nombra la carpeta y reemplaza los botones', () => {
    const html = renderSelector({ ...base, nivel: { id: 'a1', nombre: 'Cocina' }, confirmando: { id: 'a1', nombre: 'Cocina' } });
    expect(html).toContain('Voy a usar <b>Cocina</b>.');
    expect(html).toContain('data-accion="carpeta-confirmar"');
    expect(html).not.toContain('data-accion="carpeta-usar"');
    expect(html).not.toContain('Tu carpeta actual');
  });

  it('al cambiar de carpeta, la confirmación dice que la actual queda', () => {
    const html = renderSelector({ ...base, cambiando: true, confirmando: { id: 'a1', nombre: 'Cocina' } });
    expect(html).toContain('Tu carpeta actual queda como está en Drive.');
  });
});
```

`tests/vista-ajustes.test.ts`, en el primer `describe`:

```ts
  it('la ficha Cuenta dice qué carpeta se usa y ofrece cambiarla', () => {
    const html = renderAjustes({ ...base, carpeta: 'Recetario' });
    expect(html).toContain('Carpeta: Recetario');
    expect(html).toContain('data-accion="cambiar-carpeta"');
  });
```

Correr: `npx vitest run tests/router.test.ts tests/vista-carpeta.test.ts tests/vista-ajustes.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: implementar**

`src/ui/router.ts`: `Vista` suma `| 'carpeta'`, y antes del `return` final:

```ts
  // El selector de la carpeta base: el nivel que se mira viaja en la query, y
  // volver un nivel es el historial.
  if (partes[0] === 'carpeta') {
    const nivel: Record<string, string> = {};
    if (params['id']) nivel['id'] = params['id'];
    if (params['nombre']) nivel['nombre'] = params['nombre'];
    return { vista: 'carpeta', params: nivel };
  }
```

Crear `src/ui/carpeta.ts`:

```ts
/**
 * El selector de la carpeta base (P15/P19, etapa 2).
 *
 * Aparece cuando no hay una carpeta marcada, o hay más de una, y desde Ajustes
 * para cambiarla. Sólo muestra carpetas propias: las compartidas y las unidades
 * compartidas no entran.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, vacio, SPINNER } from './componentes.js';

export interface CarpetaSimple {
  id: string;
  nombre: string;
}

export interface OpcionesSelector {
  /** Las marcadas, o las propias llamadas Recetario. */
  sugerencias: CarpetaSimple[];
  /** El nivel que se mira; `root` es «Mi unidad». */
  nivel: CarpetaSimple;
  /** Las carpetas del nivel; `null` mientras se leen. */
  carpetas: CarpetaSimple[] | null;
  /** La carpeta a punto de usarse: la confirmación reemplaza los botones. */
  confirmando: CarpetaSimple | null;
  /** «Crear una carpeta nueva acá» desplegado. */
  creando: boolean;
  /** Se entró desde Ajustes, para cambiar la carpeta en uso. */
  cambiando: boolean;
  error?: string;
}

const hrefNivel = (c: CarpetaSimple): string =>
  `#/carpeta?id=${encodeURIComponent(c.id)}&nombre=${encodeURIComponent(c.nombre)}`;

const fila = (c: CarpetaSimple, destino: string): string =>
  `${destino}<span class="txt"><span class="n">${escapar(c.nombre)}</span></span></a>`;

export function renderSelector(
  { sugerencias, nivel, carpetas, confirmando, creando, cambiando, error }: OpcionesSelector
): string {
  const enRaiz = nivel.id === 'root';

  const encontradas = sugerencias.length
    ? '<div><div class="rot">Encontradas</div><div class="lista">' +
      sugerencias.map(c =>
        `<button class="bor" data-accion="carpeta-sugerida" data-id="${escapar(c.id)}" data-nombre="${escapar(c.nombre)}">` +
          `<span class="txt"><span class="n">${escapar(c.nombre)}</span></span></button>`
      ).join('') + '</div></div>'
    : '';

  const lista = error
    ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } })
    : carpetas === null
      ? SPINNER
      : carpetas.length
        ? '<div class="lista">' + carpetas.map(c => fila(c, `<a class="bor" href="${escapar(hrefNivel(c))}">`)).join('') + '</div>'
        : vacio('No hay carpetas acá.');

  const rotulo = enRaiz ? 'Mi unidad' : `Mi unidad › ${nivel.nombre}`;

  const acciones = confirmando
    ? '<div class="ficha">' +
        `<p class="lee" style="margin:0 0 var(--e-4)">Voy a usar <b>${escapar(confirmando.nombre)}</b>. ` +
        'Si faltan categorías, las creo, y después indexo lo que haya adentro.' +
        (cambiando ? ' Tu carpeta actual queda como está en Drive.' : '') + '</p>' +
        '<div class="acciones">' +
          '<button class="btn sec" data-accion="carpeta-cancelar">Cancelar</button>' +
          '<button class="btn prim" data-accion="carpeta-confirmar">Usar</button>' +
        '</div></div>'
    : creando
      ? '<div class="ficha">' +
          '<input class="campo" name="nombre-carpeta" value="Recetario" aria-label="Nombre de la carpeta">' +
          '<div class="acciones" style="margin-top:var(--e-3)">' +
            '<button class="btn sec" data-accion="carpeta-cancelar">Cancelar</button>' +
            '<button class="btn prim" data-accion="carpeta-crear-confirmado">Crear</button>' +
          '</div></div>'
      : '<div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
          (enRaiz ? '' : '<button class="btn prim" data-accion="carpeta-usar">Usar esta carpeta</button>') +
          '<button class="btn sec" data-accion="carpeta-crear">Crear una carpeta nueva acá</button>' +
        '</div>';

  return encabezado({ titulo: 'Elegí la carpeta de tus recetas', volver: true }) +
    '<div class="cuerpo">' +
      encontradas +
      `<div><div class="rot">${escapar(rotulo)}</div>${lista}</div>` +
      acciones +
    '</div>';
}
```

(Verificar que `vacio` y `aviso` existen con esas firmas en `componentes.ts`, y que la clase del input de texto del formulario de captura es `campo`; si es otra, usar esa.)

`src/ui/ajustes.ts`: `OpcionesAjustes` suma

```ts
  /** El nombre de la carpeta base en uso. */
  carpeta?: string;
```

la desestructuración suma `carpeta = ''`, y `seccionCuenta` pasa a:

```ts
  const seccionCuenta = '<div class="ficha"><h2>Cuenta</h2>' +
    `<div class="fila-a"><span class="t">${escapar(cuenta || 'Sin cuenta conectada')}</span>` +
    '<button class="btn sec compacto" data-accion="salir">Salir</button></div>' +
    '<p class="aviso-mudo" style="margin:var(--e-2) 0 0">Salir no borra nada de Drive.</p>' +
    (carpeta
      ? `<div class="fila-a" style="margin-top:var(--e-3)"><span class="t">Carpeta: ${escapar(carpeta)}</span>` +
        '<button class="btn sec compacto" data-accion="cambiar-carpeta">Cambiar carpeta</button></div>'
      : '') +
  '</div>';
```

- [ ] **Paso 3: correr**

Correr: `npx vitest run tests/router.test.ts tests/vista-carpeta.test.ts tests/vista-ajustes.test.ts && npm test && npm run typecheck`
Esperado: todo en verde.

---

### Tarea 5: el cableado en `main`

**Archivos:**
- Modificar: `src/main.ts`, `tests/main-rutas.test.ts`

**Interfaces:**
- Consume: Tareas 2 a 4.

- [ ] **Paso 1: tests que fallan**

En `tests/main-rutas.test.ts`, el objeto `estado` suma:

```ts
  /** El arranque termina en elegir-carpeta, con estas sugerencias. */
  eligiendo: null as null | { id: string; name: string }[],
  /** Las carpetas que se prepararon con el setup, en orden. */
  preparadas: [] as string[],
  /** Cuántas veces se anotó la carpeta anterior como reemplazada. */
  reemplazadas: 0,
```

(con su reinicio en el `afterEach`: `estado.eligiendo = null; estado.preparadas = []; estado.reemplazadas = 0;`).

`storeFake.arrancar` pasa a devolver el selector cuando `estado.eligiendo` no es `null`:

```ts
  arrancar: async () => estado.eligiendo
    ? { estado: 'elegir-carpeta', sugerencias: estado.eligiendo, avisos: [] }
    : {
        estado: 'listo', reconstruir: false, raizId: 'raiz',
        categorias: [{ id: 'c1', nombre: 'Carnes' }], indiceDuplicado: estado.indiceDuplicado
      },
```

y `storeFake` suma:

```ts
  carpeta: () => ({ id: 'raiz', nombre: 'Recetario' }),
  carpetasDe: async () => [{ id: 'a1', nombre: 'Cocina' }],
  crearCarpeta: async (nombre: string) => ({ id: 'nueva', nombre }),
  prepararCarpeta: async (c: { id: string }) => { estado.preparadas.push(c.id); return { ignorados: [] }; },
  marcarReemplazada: async () => { estado.reemplazadas++; },
```

Tests nuevos:

```ts
  describe('la carpeta base', () => {
    it('sin carpeta marcada, el arranque lleva al selector con las sugerencias', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app, reemplazos } = await montar();
      expect(reemplazos).toContain('#/carpeta');
      expect(app.innerHTML).toContain('Elegí la carpeta de tus recetas');
      expect(app.innerHTML).toContain('data-id="r1"');
    });

    it('mientras no hay carpeta, otra ruta vuelve al selector', async () => {
      estado.eligiendo = [];
      const { abrir, reemplazos } = await montar();
      await abrir('#/ajustes');
      expect(reemplazos.at(-1)).toBe('#/carpeta');
    });

    it('elegir una sugerencia confirma, prepara la carpeta y recarga', async () => {
      estado.eligiendo = [{ id: 'r1', name: 'Recetario' }];
      const { app, tocar, recargas } = await montar();
      await tocar('carpeta-sugerida', { id: 'r1', nombre: 'Recetario' });
      expect(app.innerHTML).toContain('Voy a usar <b>Recetario</b>.');
      await tocar('carpeta-confirmar');
      expect(estado.preparadas).toEqual(['r1']);
      expect(estado.reemplazadas).toBe(0);
      expect(recargas).toHaveLength(1);
    });

    it('cambiar de carpeta desde Ajustes anota la anterior antes de preparar la nueva', async () => {
      const { abrir, tocar } = await montar();
      await abrir('#/ajustes');
      await tocar('cambiar-carpeta');
      await abrir('#/carpeta?id=a1&nombre=Cocina');
      await tocar('carpeta-usar');
      await tocar('carpeta-confirmar');
      expect(estado.reemplazadas).toBe(1);
      expect(estado.preparadas).toEqual(['a1']);
    });

    it('Ajustes dice qué carpeta se usa', async () => {
      const { app, abrir } = await montar();
      await abrir('#/ajustes');
      expect(app.innerHTML).toContain('Carpeta: Recetario');
    });
  });
```

Correr: `npx vitest run tests/main-rutas.test.ts`
Esperado: FAIL.

- [ ] **Paso 2: implementar en `src/main.ts`**

Imports: `import { renderSelector } from './ui/carpeta.js';` y `import type { CarpetaSimple } from './ui/carpeta.js';`.

Estado, junto a los demás:

```ts
/**
 * El selector de la carpeta base. Las sugerencias vienen del arranque; el nivel
 * que se mira, de la ruta. Lo leído de cada nivel se reutiliza en sus
 * redibujados —confirmar, crear, cancelar—.
 */
const selector = {
  sugerencias: [] as CarpetaSimple[],
  nivel: null as null | { id: string; carpetas: CarpetaSimple[] },
  confirmando: null as CarpetaSimple | null,
  creando: false,
  cambiando: false,
  error: ''
};
```

En `arrancar`, reemplazar el `if (estadoArranque.estado === 'elegir-carpeta') { … }` por:

```ts
  if (estadoArranque.estado === 'elegir-carpeta') {
    selector.sugerencias = estadoArranque.sugerencias.map(c => ({ id: c.id, nombre: c.name ?? '' }));
    location.replace('#/carpeta');
    router.iniciar();
    return;
  }
```

En `render`, al principio —antes del bloque del editor—:

```ts
  // Sin carpeta base no hay con qué dibujar ninguna otra pantalla.
  if (estadoArranque?.estado === 'elegir-carpeta' && ruta.vista !== 'carpeta') {
    location.replace('#/carpeta');
    return;
  }
```

En el bloque `if (cambiaDePantalla)`, sumar:

```ts
    if (ruta.vista !== 'carpeta') { selector.cambiando = false; selector.sugerencias = estadoArranque?.estado === 'elegir-carpeta' ? selector.sugerencias : []; }
    selector.confirmando = null;
    selector.creando = false;
    selector.error = '';
```

En el `switch`, un caso nuevo:

```ts
    case 'carpeta': {
      const nivel = { id: ruta.params['id'] ?? 'root', nombre: ruta.params['nombre'] ?? '' };
      if (selector.nivel?.id !== nivel.id) {
        selector.nivel = null;
        pintar(renderSelector({ ...selector, nivel, carpetas: null }));
        try {
          selector.nivel = { id: nivel.id, carpetas: await store.carpetasDe(nivel.id) };
        } catch (err) {
          console.error(err);
          return pintar(renderSelector({ ...selector, nivel, carpetas: [], error: 'No se pudieron leer las carpetas.' }));
        }
      }
      return pintar(renderSelector({
        ...selector, nivel, carpetas: selector.nivel?.carpetas ?? [],
        ...(selector.error ? { error: selector.error } : {})
      }));
    }
```

En el caso `'ajustes'`, `renderAjustes` suma `carpeta: store.carpeta().nombre`.

Acciones, en el manejador de clicks, antes de `if (accion === 'salir')`:

```ts
  if (accion === 'cambiar-carpeta') {
    selector.cambiando = true;
    location.hash = '#/carpeta';
    return;
  }
  if (accion === 'carpeta-sugerida') {
    selector.confirmando = { id: boton.dataset['id'] ?? '', nombre: boton.dataset['nombre'] ?? '' };
    return render();
  }
  if (accion === 'carpeta-usar') {
    selector.confirmando = { id: vistaActual?.params['id'] ?? '', nombre: vistaActual?.params['nombre'] ?? '' };
    return render();
  }
  if (accion === 'carpeta-crear') { selector.creando = true; return render(); }
  if (accion === 'carpeta-cancelar') { selector.confirmando = null; selector.creando = false; return render(); }
  if (accion === 'carpeta-crear-confirmado') {
    const nombre = document.querySelector<HTMLInputElement>('#app input[name="nombre-carpeta"]')?.value.trim() || 'Recetario';
    try {
      selector.confirmando = await store.crearCarpeta(nombre, vistaActual?.params['id'] ?? 'root');
      selector.creando = false;
      selector.nivel = null;   // el nivel ganó una carpeta
    } catch (err) {
      console.error(err);
      selector.error = 'No se pudo crear la carpeta.';
    }
    return render();
  }
  if (accion === 'carpeta-confirmar') {
    const elegida = selector.confirmando;
    if (!elegida) return;
    try {
      // La anotación es para los otros dispositivos: si falla, el cambio sigue.
      if (selector.cambiando) await store.marcarReemplazada().catch(err => console.error(err));
      const progreso = (p: Progreso) => pintar(renderConexion({ estado: 'creando-indice', progreso: p }));
      pintar(renderConexion({ estado: 'creando-indice' }));
      await store.prepararCarpeta(elegida, progreso);
      location.replace('#/');
      location.reload();
    } catch (err) {
      console.error(err);
      selector.error = 'No se pudo preparar la carpeta. Revisá la conexión.';
      await render();
    }
    return;
  }
```

Y `reintentar` suma `selector.nivel = null; selector.error = '';`.

- [ ] **Paso 3: correr**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

---

### Tarea 6: documentos, y mostrar los cambios

**Archivos:**
- Modificar: `SETUP.md`, `CLAUDE.md`, `product-design/product/specs/E05-Cimientos.md`, `product-design/ux/user-flows.md`, `product-design/plan/decision-log.md`, `product-design/plan/BACKLOG.md`

- [ ] **Paso 1: `SETUP.md`**

Al principio de la sección de la carpeta y las categorías, agregar: «`[2026-09-13]` **La carpeta ya no se crea a mano.** Al abrir, si no hay una carpeta marcada, la app ofrece elegir una —o crearla— y arma la estructura con las 16 categorías predefinidas. Lo que sigue queda como referencia de cómo está armado el Drive de este proyecto.»

- [ ] **Paso 2: `CLAUDE.md`**

- «Ubicación en Drive»: agregar al principio del párrafo que sigue a los ids: «La app no busca `Recetario` por nombre: encuentra la carpeta base por su marca en `appProperties` (`recetario=raiz`), y si no hay ninguna ofrece elegirla desde un selector (P15/P19, etapa 2).»
- Estado de arriba: un párrafo «**Hecho el 2026-09-13 — carpeta base elegida (P15/P19, etapa 2):** la app encuentra su carpeta por una marca, ofrece un selector cuando falta, arma la estructura con las 16 predefinidas y permite cambiar de carpeta desde Ajustes. Spec en `docs/superpowers/specs/2026-09-13-carpeta-base-design.md`. **Falta probarlo en el teléfono.**»; la cantidad de tests al número que dé `npm test`.

- [ ] **Paso 3: `E05-Cimientos.md`**

- F05.7: sumar un criterio «Sin una carpeta marcada, la app ofrece elegirla —o crearla— y arma la estructura con las 16 categorías predefinidas antes de entrar. `[2026-09-13]`».
- C05.9b.1: sumar «Muestra la carpeta base en uso y ofrece cambiarla; la anterior queda como está en Drive. `[2026-09-13]`».

- [ ] **Paso 4: `user-flows.md`**

En F8, la línea `  ▸ la app busca Recetario/ en Drive` se reemplaza por:

```
  ▸ la app busca la carpeta marcada
  ⚑ ¿hay una?
      no  → selector: elijo o creo una carpeta
            ▸ la app crea las categorías que falten, el índice, y marca la carpeta
```

- [ ] **Paso 5: `decision-log.md`**

Versión 2.1, y al final de la tabla:

```markdown
| 2026-09-13 | **La carpeta base se encuentra por una marca en `appProperties` (`recetario=raiz`), y sin marca la elige el usuario en un selector dentro de la app.** El setup crea las 16 predefinidas que falten, `_indice`, reindexa y marca, en ese orden. Cambiar de carpeta anota `reemplazada=si` en la `meta` anterior. | Etapa 2 de P15/P19: que otra persona pueda usar la app con su propia carpeta. Buscar `Recetario` por nombre obligaba a crear la estructura a mano siguiendo `SETUP.md`. | El Google Picker (necesita API key y se ve con el estilo de Google); crear siempre `Recetario/` en la raíz sin elegir; pedir dos datos al abrir para detectar el cambio de carpeta en otro dispositivo. | La marca viaja con la carpeta y funciona en cualquier dispositivo sin preguntar. El selector propio no suma dependencias. `reemplazada` le cambia la fecha a la planilla vieja, así que otro dispositivo se entera sin pedidos extra en la apertura diaria. | Desaparecen «No encontré la carpeta Recetario» y «Hay más de una carpeta llamada Recetario». Las unidades compartidas quedan afuera. |
```

- [ ] **Paso 6: `BACKLOG.md`**

En la fila de **P19**, agregar antes del `|` final: « **Etapa 2 hecha** `[2026-09-13]`: carpeta base marcada, selector dentro de la app, setup con las 16 predefinidas y *Cambiar carpeta* en Ajustes (spec `docs/superpowers/specs/2026-09-13-carpeta-base-design.md`).»

- [ ] **Paso 7: verificación final y mostrar los cambios**

Correr: `npm test && npm run typecheck && npm run build`
Esperado: todo en verde.

Correr: `git status --short && git diff --stat`, y presentarle al usuario el resumen para revisar. **No commitear ni pushear.**
