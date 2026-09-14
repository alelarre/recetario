# Categorías en el índice — diseño (P15/P19, etapa 1)

**Fecha:** 2026-09-13
**Estado:** Aprobado en conversación; pendiente de revisión escrita.
**Resuelve:** la etapa 1 de `product-design/plan/BACKLOG.md` P15/P19.
**Se apoya en:** `docs/superpowers/specs/2026-09-13-indice-local-design.md` y
`docs/superpowers/specs/2026-09-13-borradores-md-design.md`.

---

## 1. Qué cambia

| | Hoy | Con este diseño |
|---|---|---|
| Color y foto de una categoría | Salen del slug del nombre de la carpeta | Salen de las propiedades de la carpeta en Drive (`appProperties`) |
| Las 16 categorías predefinidas | Repartidas entre `src/ui/categorias.ts`, `tokens.css` y los nombres de archivo de `src/categorias/` | Una tabla, `src/categorias.ts` |
| Renombrar una carpeta | Pierde color y foto | Los conserva |
| La lista de categorías al abrir | Se lista de Drive en cada apertura | Sale de la hoja `categorias` de `_indice`, en la copia local |
| Pedidos al abrir con copia vigente | Tres: buscar `Recetario`, listar subcarpetas, buscar `_indice` | Uno: la fecha de `_indice` |

## 2. Los datos

### 2.1 Las predefinidas: `src/categorias.ts`

Es el único lugar de la app que nombra las 16 categorías:

```ts
export interface CategoriaPredefinida {
  nombre: string;
  /** Clave de la paleta: `tokens.css` tiene `--cat-<clave>`. */
  color: ClaveColor;
  /** Clave del catálogo: `src/categorias/<clave>.webp`. */
  foto: string;
}

export const PREDEFINIDAS: readonly CategoriaPredefinida[] = [
  { nombre: 'Arroces y legumbres', color: 'arroces', foto: 'arroces-y-legumbres' },
  // … las 16
  { nombre: 'Otros', color: 'otros', foto: 'otros' }
];
```

- Las claves de color son las de hoy: `arroces`, `aves`, `bebidas`, `carnes`,
  `desayunos`, `ensaladas`, `entradas`, `panes`, `pastas`, `pescados`, `postres`,
  `salsas`, `sopas`, `tartas`, `verduras` y `otros`. `ClaveColor` es la unión de
  esas dieciséis.
- Los valores hex siguen en `src/ui/tokens.css` como `--cat-<clave>`: son la paleta del
  sistema visual.
- El catálogo de fotos es lo que hay en `src/categorias/`. Sumar una foto al catálogo es
  agregar un `.webp`.
- `src/categorias.ts` exporta también `predefinidaPorNombre(nombre)`: compara con
  `normalizar()` —sin tildes ni mayúsculas—, igual que hoy se compara el slug.

### 2.2 Las propiedades de cada carpeta

Cada carpeta de categoría lleva en `appProperties`:

| clave | valor |
|---|---|
| `color` | una `ClaveColor` |
| `foto` | `catalogo:<clave>`. La etapa 3 suma `drive:<id>`. |

`appProperties` son privadas de la app: otra aplicación no las ve ni las pisa.

### 2.3 El tipo `Categoria`

```ts
export interface Categoria {
  id: string;
  nombre: string;
  /** Clave de la paleta, o vacío: se dibuja con el neutro. */
  color: string;
  /** `catalogo:<clave>`, `drive:<id>` o vacío: sin foto se dibuja la trama. */
  foto: string;
}
```

### 2.4 La hoja `categorias` de `_indice`

| id_carpeta | nombre | color | foto |
|---|---|---|---|

Es **derivada**: la verdad son las carpetas y sus propiedades. Borrar `_indice` y
reindexar la rearma sin perder nada.

### 2.5 La hoja `meta`

Suma la clave `carpeta_borradores`: el id de `_borradores/`, o vacío si todavía no
existe. La escriben el reindexado y `agregarBorrador` cuando crea la carpeta.

### 2.6 La copia local

`CopiaIndice` suma:

```ts
  /** La carpeta `Recetario/`. */
  raizId: string;
  /** La hoja `categorias`, en el orden de la planilla. */
  categorias: Categoria[];
```

`carpeta_borradores` viaja en `meta`, que la copia ya tiene.

### 2.7 La versión del esquema

`SCHEMA_VERSION` pasa de 4 a 5. La próxima apertura reindexa: crea la hoja
`categorias`, escribe las propiedades de las carpetas predefinidas y anota
`carpeta_borradores`.

## 3. Al abrir

### 3.1 Con copia local

1. Pide la metadata de `_indice` con el id de la copia:
   `drive.metadatos(copia.indiceId, 'modifiedTime,trashed')`.
2. **La fecha coincide y no está en la papelera:** usa la copia entera —recetas,
   borradores, categorías, raíz y `meta`—. **Un pedido en total.**
3. **La fecha no coincide:** lee las cuatro hojas —`meta`, `recetas`, `borradores` y
   `categorias`— con el `indiceId` y el `raizId` de la copia, sin buscar nada, y guarda
   una copia nueva con la fecha que trajo la metadata.
4. **404 o en la papelera:** sigue por el camino completo (§3.2).
5. **Cualquier otro error:** el arranque termina en `solo-lectura`, como hoy.

La copia que no sirve por versión del esquema (`otro-esquema`) va directo al camino
completo.

### 3.2 Sin copia: el camino completo

1. Busca `Recetario` por nombre, como hoy: ninguna o más de una terminan igual que hoy.
2. Busca `_indice` dentro de la raíz, como hoy, con el aviso de duplicado.
3. Si no existe, la crea con las cuatro hojas y pide reindexar.
4. Si existe, lee las cuatro hojas.

No lista carpetas: las categorías salen de la hoja.

### 3.3 De dónde salen los ids de las carpetas

Las categorías y `_borradores/` siguen el mismo camino; cambia sólo dónde se guarda el
id —una fila por categoría en su hoja, un solo id en `meta`—:

| Situación | Categorías | `_borradores/` |
|---|---|---|
| `_indice` no existe | El arranque la crea y pide reindexar; el reindexado lista las subcarpetas de la raíz y escribe la hoja `categorias` | Del mismo listado, a `meta` |
| `_indice` existe, sin copia o con otra fecha | La hoja `categorias`, columna `id_carpeta` | `meta`, clave `carpeta_borradores` |
| Copia vigente | La copia | La copia, en `meta` |

Cuando `_indice` no existe, el resultado del arranque trae la lista de categorías vacía:
todavía no se reindexó. Por eso nadie toma las categorías de ese resultado: el store
expone `store.categorias()`, que refleja la última carga o reindexado (§5).

### 3.4 La decisión de reindexar

No cambia: versión del esquema, reindexado a medias o planilla nueva. Una planilla de
la versión 4 no tiene la hoja `categorias` y cae por el esquema. Con la versión 5 la hoja
existe siempre —la crean `crearPlanilla` y el reindexado—; una hoja borrada a mano es un
índice dañado, y su reparación es la de siempre: borrar `_indice`.

### 3.4b Qué lee cada paso

- `store.arrancar()` resuelve la raíz y `_indice` —por la copia o por el camino completo—
  y lee sólo `meta`, que decide si hay que reindexar. Con la copia vigente, carga la copia
  entera.
- `store.cargarIndice()` lee `recetas`, `borradores` y `categorias`, y toma
  `carpeta_borradores` de `meta`. `main` no la llama si hay que reindexar: una planilla de
  un esquema viejo puede no tener todas sus hojas.

### 3.5 El informe de «Al abrir» (P18)

`InformeArranque` pierde el campo `categorias`: cuando la copia no sirve, las categorías
se leen después del arranque. Ajustes cuenta `store.categorias()`, como ya cuenta
recetas y borradores.

### 3.6 Lo que la apertura diaria deja de ver

- Una carpeta creada, renombrada o borrada a mano en Drive aparece al reindexar.
- Un segundo `Recetario` o un segundo `_indice` se detectan en el camino completo.

## 4. Al reindexar

1. Lista las subcarpetas de la raíz pidiendo `files(id,name,appProperties)`.
2. **Migración.** A cada carpeta **sin** `color` ni `foto` cuyo nombre coincide con una
   predefinida (§2.1) le escribe las dos propiedades desde la tabla:
   `drive.propiedades(id, { color, foto })`.
3. Una carpeta con propiedades se respeta tal cual, aunque su nombre ya no coincida con
   ninguna predefinida.
4. Una carpeta sin propiedades que no coincide queda con `color: ''` y `foto: ''`. No se
   le escribe nada.
5. Las carpetas que empiezan con `_` no son categorías. `_borradores` se anota en
   `meta` como `carpeta_borradores`.
6. Reescribe la hoja `categorias`; si no existe, la crea con su encabezado.
7. Recetas y borradores, como hoy.
8. `persistir()` una sola vez al final, como hoy.

`crearPlanilla()` crea la hoja `categorias` con su encabezado junto a las otras tres.

## 5. Al dibujar

- `store.categorias(): Categoria[]` devuelve las categorías en memoria —de la copia, de la
  hoja o del último reindexado—. `main` las toma de ahí y no del resultado del arranque:
  el selector de carpeta del editor, el conteo del Recetario y el registro de abajo.

`src/ui/categorias.ts` deja de conocer nombres de categoría:

- `registrarCategorias(lista: Categoria[])`: `main` la llama después de arrancar y
  después de cada reindexado.
- `colorCategoria(nombre)` y `fotoCategoria(nombre)` conservan su firma. Buscan la
  categoría registrada por nombre y traducen sus claves: `color` a
  `var(--cat-<clave>)`, `foto: 'catalogo:<clave>'` a la URL del `.webp`.
- Una categoría no registrada —*Sin categorizar*—, sin `color` o con una clave que la
  paleta no tiene, da el neutro. Sin `foto`, o con `drive:<id>` —que se dibuja recién en
  la etapa 3—, da `null`.
- `slugCategoria` se queda: lo usa el `data-slug` del tile.

`componentes.ts`, `receta.ts` y sus firmas no cambian.

## 6. Drive

- `drive.propiedades(id, props)`: `PATCH /files/{id}` con `{ appProperties: props }`.
- `drive.listarCarpetas(id)` pide `files(id,name,appProperties)`.
- `ArchivoDrive` suma `appProperties?: Record<string, string>`.
- `drive.metadatos` ya acepta los campos a pedir.

## 7. Fallas

La regla es la de siempre (R1).

- **La migración se corta a mitad:** el reindexado falla como cualquier otro;
  `reconstruccion_en_curso` queda marcado y la próxima apertura reindexa. Las
  propiedades ya escritas no molestan: escribirlas de nuevo da lo mismo.
- **La metadata de `_indice` da 404 o está en la papelera:** camino completo.
- **La metadata falla por otra razón:** `solo-lectura`. La copia no se usa para dibujar.

## 8. Tests

**`src/categorias.ts`:** son 16; cada `color` es una clave con su `--cat-<clave>` en
`tokens.css`; cada `foto` tiene su `.webp` en `src/categorias/`; no hay nombres
repetidos; `predefinidaPorNombre` ignora tildes y mayúsculas.

**`src/ui/categorias.ts`:** con la lista registrada, color y foto por nombre; una
categoría renombrada con sus propiedades conserva color y foto; sin registro, sin
propiedades o con una clave desconocida, el neutro y `null`; `drive:<id>` da `null`.

**`drive`:** `propiedades` pide `PATCH` con `appProperties`; `listarCarpetas` pide ese
campo.

**Store, al abrir:**
- Con copia vigente, un solo pedido a Drive y ninguna lectura de Sheets.
- Con otra fecha, las cuatro hojas y ninguna búsqueda.
- Con 404 o en la papelera, el camino completo.
- Con otro error, `solo-lectura`.
- Las categorías del resultado del arranque salen de la hoja o de la copia.

**Store, al reindexar:**
- Escribe propiedades sólo a las predefinidas sin propiedades.
- Una carpeta con propiedades y otro nombre las conserva.
- Una desconocida queda neutra y sin escritura.
- La hoja `categorias` se escribe, y se crea si falta; `carpeta_borradores` queda en
  `meta`.
- La copia coincide con la planilla.

**Store, al crear la planilla:** las cuatro hojas.

**Store, `agregarBorrador`:** al crear la carpeta anota `carpeta_borradores`.

**Store:** `categorias()` refleja la copia, la hoja y el último reindexado; con la planilla
recién creada, está vacía hasta reindexar y después trae las carpetas.

**`main`:** registra las categorías después del arranque y del reindexado, y el editor
ofrece las categorías de `store.categorias()`, también después de un reindexado al
abrir.

**Verificación en el teléfono:**
1. La primera apertura reindexa; en Drive, las 16 carpetas tienen `color` y `foto`.
2. La siguiente apertura hace un solo pedido: en la pestaña Red, la metadata de
   `_indice` y nada más hasta tocar algo.
3. Las categorías se ven con sus colores y fotos, igual que antes.
4. Renombrar una carpeta a mano en Drive y reindexar: conserva color y foto con el
   nombre nuevo.

## 9. Documentos que cambian

- **`design-system.md` §2.3:** la tabla de categorías se remite a `src/categorias.ts`.
- **`CLAUDE.md`:** las filas «Derivar el color de categoría…» y «Las fotos de categoría
  en…», la sección «Las fotos de las categorías» —agregar una predefinida es una fila de
  la tabla más su `.webp`—, y el arranque.
- **`SETUP.md`:** una categoría nueva ya no toma color ni foto del nombre.
- **`decision-log.md`:** una fila con las propiedades de la carpeta, la hoja derivada y
  la apertura de un pedido.
- **`BACKLOG.md`**, en P15/P19: lo que resuelve la etapa 1, y lo decidido para la
  etapa 2 —la estructura se crea con las 16 predefinidas, con sus nombres y fotos, y
  sólo a partir de ellas el usuario agrega o borra categorías en la etapa 3—.

## 10. Fuera de alcance

- **Etapa 2:** elegir la carpeta base, marcarla con `appProperties` y crear la estructura.
- **Etapa 3:** crear, borrar y renombrar categorías desde la app, elegir color, subir
  imágenes a Drive y guardarlas en Cache Storage.
- Detectar en la apertura diaria cambios de carpetas hechos a mano.
