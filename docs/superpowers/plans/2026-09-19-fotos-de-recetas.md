# Plan — Fotos de las recetas y de las categorías

Spec: `docs/superpowers/specs/2026-09-19-fotos-de-recetas-design.md`.

Cada tarea es test primero: el test falla, después pasa. Al cerrar cada una,
`npm test` y `npm run typecheck` en verde. El código no se commitea hasta que
el usuario revisa el diff.

## Nombres que cruzan tareas

```ts
// src/tipos.ts
export interface FotoDeReceta { n: number; url: string }   // Receta.fotos: FotoDeReceta[]
export interface CambiosDeFotos {
  nuevas: Map<number, Blob>;   // se suben a `_fotos/` y su url va en la línea n
  deBorrador: string[];        // ids en `_borradores/`: se mueven a `_fotos/`
  sacadas: string[];           // urls que estaban en el `.md` y ya no
}
export type Lugar =
  | { seccion: 'ingredientes' | 'preparacion'; linea: number; texto: string; grupo: string }
  | { seccion: 'descripcion' | 'variaciones' | 'notas'; linea: null; texto: string; grupo: string };

// src/fotos-receta.ts
linkDeFoto(id: string): string
idDeDrive(url: string): string | null
parsearFotos(cuerpo: string): FotoDeReceta[] | null      // null: la sección no tiene forma
serializarFotos(fotos: FotoDeReceta[]): string
siguienteNumero(fotos: FotoDeReceta[]): number
resolver(valor: string | null, fotos: FotoDeReceta[]): string | null
resolverReceta(receta: Receta): Receta
sinFotosDeDrive(receta: Receta): Receta
lineasDeLaReceta(receta: Receta): Lugar[]
ponerEn(texto: string, linea: number | null, n: number): string
sacarReferencias(texto: string, n: number): string

// src/imagenes.ts (suma)
guardarImagen(id: string, blob: Blob): Promise<void>
olvidarImagen(id: string): Promise<void>
precargar(ids: string[], opciones?: { tope?: number }): Promise<void>

// src/ui/markdown.ts (suma)
imgDe(url: string, clase?: string): string   // <img src> o <img data-drive>
```

## 1. El formato y el dominio (spec §3, §4)

- `src/tipos.ts`: `FotoDeReceta`, `CambiosDeFotos`, `Lugar`; `Receta` suma
  `fotos: FotoDeReceta[]`.
- `src/fotos-receta.ts`, nuevo y puro: todo lo de arriba. `linkDeFoto` pasa
  de `conversion.ts` acá (y `conversion.ts` lo importa).
  - La línea es `/^- (\d+): (https?:\/\/\S+)$/`; `parsearFotos` devuelve
    `null` si alguna línea no vacía no calza.
  - `resolverReceta` reemplaza `!\[([^\]]*)\]\(foto:(\d+)\)` por la URL, o
    borra la referencia entera si el número no está; resuelve `foto`. Recorre
    descripción, las cuatro secciones y `otras`.
  - `lineasDeLaReceta` numera las líneas de ingredientes y pasos por su
    índice en el texto de la sección —el que `ponerEn` recibe—, salteando los
    `###` y las vacías; `grupo` es el `###` que las contiene, o el nombre de
    la sección.
- `src/recipe.ts`: `parsearCuerpo` manda `## Fotos` a `parsearFotos`; con
  `null` la sección cae en `otras` tal cual. `serialize` escribe `## Fotos`
  después de `otras`. `foto` acepta `foto:N` (`/^foto:\d+$/`) además de la
  URL. `parse('')` da `fotos: []`.
- `tests/fotos-receta.test.ts`, nuevo: ida y vuelta con huecos; una línea sin
  forma da `null`; `siguienteNumero` vacío y con huecos; `resolver` con
  `foto:N`, un número que falta y una URL; `idDeDrive` con y sin link de
  Drive; `resolverReceta` con epígrafe y sin él; `sinFotosDeDrive` deja las
  externas; `lineasDeLaReceta` con grupos `###`; `ponerEn` en un paso, en un
  ingrediente y en notas, sin repetir; `sacarReferencias`.
- `tests/recipe-frontmatter.test.ts`, `tests/recipe-cuerpo.test.ts`,
  `tests/recipe-serialize.test.ts`: `foto: foto:2`; la sección se lee, va
  última, sin fotos no se escribe, mal formada queda en `otras`. Los fixtures
  de `Receta` en otros tests suman `fotos: []`.

## 2. Markdown e índice (spec §3, §4, §6)

- `src/ui/markdown.ts`: `TramoEnLinea` suma `epigrafe?: string`; la regex
  captura el texto entre corchetes de la imagen. `tramosAHtml` dibuja la
  imagen como `<span class="foto-linea">${imgDe(url)}<span
  class="epigrafe">…</span></span>`. `imgDe` da `<img data-drive="<id>"
  alt="">` para un link de Drive y `<img src="…" alt="" loading="lazy">`
  para el resto. `tramosATexto` no escribe una imagen de Drive.
- `src/catalogo.ts`: `filaDesde` guarda en `foto` la cabecera resuelta
  (`resolver(receta.foto, receta.fotos)`).
- `src/ui/tokens.css`: `.foto-linea` en bloque, al ancho, con `--r-foto`; el
  epígrafe en `--txt-chico` `--fg-3`; `img[data-drive]:not([src])` es un
  recuadro `--surface` de 4:3.
- `tests/markdown.test.ts`, `tests/catalogo-fila.test.ts`,
  `tests/texto-receta.test.ts`.

## 3. Imágenes: caché y precarga (spec §6)

- `src/imagenes.ts`: `guardarImagen`, `olvidarImagen`, `precargar(ids, {
  tope = 2 })` —saltea lo que ya está en el caché y no sigue si
  `navigator.connection?.saveData`; la conexión llega por dependencia para
  probarla—.
- `tests/imagenes.test.ts`: guardar y leer sin pedir a Drive; olvidar; la
  precarga pide sólo lo que falta, de a dos, y nada con `saveData`.

## 4. El store (spec §5, §8, §9)

- `src/config.ts`: `NOMBRE_FOTOS = '_fotos'`.
- `src/store.ts`:
  - `ctx.fotosId` desde `meta['carpeta_fotos']`; el reindexado la reconoce
    por nombre como a `_borradores` y no la lee. `carpetaDeFotos()` la crea
    con la primera foto y la anota en `meta`.
  - `crear(receta, { carpetaId, fotos })` y `guardar(id, receta, {
    carpetaDestino, fotos })` con `fotos?: CambiosDeFotos`: (1) sube cada
    nueva como `<md sin .md>-<n>.jpg` y pone su link en la línea `n`, y la
    guarda en el caché con `guardarImagen`; (2) mueve cada `deBorrador` de
    `ctx.borradoresId` a `_fotos/` y la renombra igual; (3) escribe el `.md`
    y la fila; (4) manda a la papelera cada `sacadas` de Drive cuyo padre sea
    `_fotos/` (`metadatos(id, 'parents')`) y la olvida del caché. En `crear`
    el nombre del `.md` se calcula antes de subir.
  - El reintento: `fotos.nuevas` sólo trae las que no se subieron; el editor
    lleva la cuenta (tarea 8).
  - `borrar(id)` lee el `.md`, lo manda a la papelera y después sus fotos de
    `_fotos/`.
  - `descartarBorrador(id, { conservar = [] })` no manda a la papelera los
    ids de `conservar`.
  - `crearCategoria` y `editarCategoria` aceptan `fotoPropia?: Blob`: la
    suben como `categoria-<slug>.jpg`, ponen `foto: drive:<id>` y mandan la
    anterior propia a la papelera. `borrarCategoria` se lleva la suya.
  - El store recibe `imagenes` como dependencia opcional (`guardarImagen`,
    `olvidarImagen`), para no atarlo al caché en los tests.
- `tests/dobles.ts`: el Drive falso registra `mover` y `renombrar`.
- `tests/store-escritura.test.ts`: orden subir → mover → `.md` → papelera; la
  línea lleva el link; una sacada fuera de `_fotos/` no va a la papelera;
  `borrar` se lleva las fotos; la primera foto crea `_fotos/` y la anota.
- `tests/store-borradores.test.ts`: `conservar`.
- `tests/store-gestion-categorias.test.ts`: la foto propia se sube, reemplaza
  a la anterior y se va con la categoría.
- `tests/store-reconstruccion.test.ts`: `_fotos/` no es categoría.

## 5. Convertir (spec §9)

- `src/compartido.ts`: `convertirBorrador(deps, { borradorId, receta,
  carpetaId, fotos })` pasa `fotos` a `crear`/`guardar` y descarta con
  `conservar: fotos.deBorrador`.
- `src/conversion.ts`: el párrafo de `foto:N` después del de las fotos.
- `tests/compartido.test.ts`, `tests/conversion.test.ts`.

## 6. La receta, la cocina y las listas (spec §7)

- `src/ui/fichas-receta.ts`: `fichaCabecera` dibuja la cabecera con `imgDe`
  y `data-accion="ver-foto" data-n`; `fichasDelCuerpo` suma al final la ficha
  **Fotos** con la grilla (`.galeria`, de a tres) si hay depósito. Las dos
  reciben la receta ya resuelta y el depósito.
- `src/ui/receta.ts`: `renderReceta` resuelve con `resolverReceta`; suma
  `visor?: { urls: string[]; i: number }` y dibuja el visor con `imgDe`.
- `src/ui/visor.ts`, nuevo y puro: `pasoDelVisor(i, dx, total)` —con `|dx|`
  menor a 40 px no se mueve; no da la vuelta—.
- `src/ui/cocina.ts`: resuelve; el paso actual dibuja su foto (ya sale del
  markdown); las fotos no llevan `data-accion`.
- `src/ui/componentes.ts`: `placeholder(categoria, foto)` usa `imgDe`; el
  tile de categoría también, para `drive:<id>`.
- `src/ui/categorias.ts`: `urlDeFoto` resuelve `drive:<id>` al link de Drive.
- `src/ui/tokens.css`: `.galeria`, el visor que desliza.
- `tests/vista-receta.test.ts`, `tests/vista-recetario.test.ts`,
  `tests/visor.test.ts`, nuevo.

## 7. El editor (spec §7)

- `src/ui/editor.ts`:
  - Un campo oculto `fotos` con el depósito en JSON (`FotoDeReceta[]`; las
    nuevas llevan `url: ''`). Entra en la foto de «cambios sin guardar» como
    cualquier campo. `formularioDesde` y `recetaDesdeFormulario` lo leen y
    lo escriben.
  - La ficha **Fotos** después de Contenido: `filaDeFotos` con el número en
    un badge y *Agregar foto* sin tope. Las miniaturas llevan
    `data-accion="acciones-foto" data-n`.
  - `renderAccionesFoto(n, { portada })`: la ficha al pie con *Ver*,
    *Portada* (no si ya lo es), *Poner en…* y *Sacar*.
  - `renderPonerEn(lugares: Lugar[], n)`: los lugares agrupados, cada uno
    cortado a una línea, con `data-accion="poner-en" data-seccion
    data-linea`.
  - El campo Foto: oculto `foto`, y un botón con la miniatura de la cabecera
    que abre `renderSelectorPortada(fotos, actual)`: el depósito, el campo
    de URL y *Sin foto*.
  - Las fichas se agregan y se sacan del DOM sin redibujar el formulario,
    como la confirmación de salida.
- `src/ui/iconos.ts`: los íconos que falten.
- `tests/vista-editor.test.ts`: la ficha Fotos con números; las acciones;
  *Portada* no aparece si ya lo es; *Poner en…* lista los lugares; el
  selector de portada; el campo `fotos` de ida y vuelta.

## 8. El cableado (spec §6, §7, §8, §9)

- `src/main.ts`:
  - **Las imágenes de Drive:** después de cada `pintar`, cada
    `img[data-drive]:not([src])` pide `urlDeImagen` y se completa; la que no
    está se saca (o, en la galería, pasa al recuadro «ya no está»).
  - **Al arrancar:** `navigator.storage?.persist?.()` sin esperar;
    dibujado el home, `precargar` con los ids de Drive de la columna `foto`
    y de las categorías.
  - **Al abrir una receta:** `precargar` con el depósito entero.
  - **El visor:** `ver-foto` abre con las URLs del depósito; el deslizamiento
    con `pasoDelVisor`; tocar cierra.
  - **El editor:** el estado `fotosEditor = { nuevas: Map<number, Blob>;
    subidas: Map<number, string> }`. *Agregar foto* achica, asigna
    `siguienteNumero` y reescribe el campo `fotos`. *Poner en…* aplica
    `ponerEn` al `textarea` de la sección. *Sacar* saca del campo `fotos`,
    aplica `sacarReferencias` a cada `textarea` y vacía `foto` si era
    `foto:N`. *Portada* escribe `foto:N`.
  - **Guardar:** arma `CambiosDeFotos` —`nuevas` sin las ya subidas,
    `deBorrador` con los ids del borrador que siguen en el depósito,
    `sacadas` con las URLs de la base que ya no están— y lo pasa a
    `crear`/`guardar`/`convertirBorrador`.
  - **El editor atado a un borrador** abre con el depósito cargado con sus
    fotos, `1…k`, y sus links.
  - **Categorías:** *Subir foto* achica y guarda el `Blob` en el estado de
    la pantalla hasta guardar la categoría.
- `tests/main-rutas.test.ts` (con `fotos.js` e `imagenes.js` simulados):
  guardar con fotos nuevas y sacadas; el reintento no resube; convertir con
  fotos; *Poner en…* y *Sacar* sobre el formulario; el visor.

## 9. Compartir (spec §10)

- `src/link-receta.ts`: `codificar` usa `sinFotosDeDrive`.
- `src/texto-receta.ts`: usa `sinFotosDeDrive`; no escribe la sección Fotos.
- `src/ui/invitado.ts`: la receta con la galería de las externas; nunca
  `data-drive`.
- `src/pdf/documento.ts`: `documentoPdf(receta, categoria, imagenes:
  Map<string, string>)`, con la receta resuelta y un data URL por URL: la
  cabecera arriba del título (ancho de página, alto ≤ 90 mm); la foto de una
  línea debajo de ella, en el mismo bloque sin partir; la galería de a dos.
  Una URL sin data URL no se dibuja.
- `src/pdf/generar.ts`: antes de armar, junta las URLs, pide cada una —las
  de Drive con `imagenDe`, las externas con `fetch`—, las achica a 800 px
  (`achicar(blob, { maximo: 800 })`, en `fotos.ts`) y las pasa como data URL.
  Una que falla se omite.
- `tests/link-receta.test.ts`, `tests/texto-receta.test.ts`,
  `tests/pdf-documento.test.ts`, `tests/pdf-generar.test.ts`,
  `tests/vista-invitado.test.ts`, `tests/invitado.test.ts`.

## 10. El velo de escritura (spec §7)

- `index.html`: `#velo-escritura` lleva el SVG del libro con el renglón y el
  lápiz en lugar del `.spin`.
- `src/ui/base.css`: el velo con `background: color-mix(in srgb, var(--velo)
  60%, transparent)` y sin `opacity`; el renglón con `stroke-dasharray` y
  `@keyframes` que lo dibujan en 1,6 s mientras el lápiz se traslada; con
  `prefers-reduced-motion: reduce`, quieto a medio renglón.
- `tests/main-rutas.test.ts`, que ya arma el velo como hermano de `#app`:
  el velo tiene el libro y no el spinner. La animación se prueba en el
  teléfono.

## 11. Documentos (spec §13)

- `product-design/product/specs/E01`, `E02`, `E03`, `E04`, `E05`;
  `ux/information-architecture.md`, `ux/user-flows.md`,
  `ux/design-system.md` (§5.1 con el libro); `CLAUDE.md`; `BACKLOG.md` (sale
  P19-3b, P14 suma `foto:N`, entra la prueba en el teléfono con el checklist
  del spec §14).
