# Delta contra la implementación actual

**Versión:** 1.0
**Fecha:** 2026-09-07
**Estado:** Final — Hito 11

---

## Sobre este documento

**Es la pieza que hace utilizable a todo el resto del proyecto.** La app ya existe
—v1 mergeada, 328 tests, publicada en GitHub Pages— así que el entregable no es
"cómo construirlo" sino **qué cambia respecto de lo que hay**, archivo por
archivo.

El rediseño se implementa **de una sola vez**, no por fases. `[decisión del Hito 11]`

Lo que este documento **no** repite: el comportamiento esperado está en
`product/specs/`, los valores visuales en `ux/design-system.md`, y el porqué de
cada decisión en `plan/decision-log.md`.

---

## 1. Lo primero que hay que entender

Ocho decisiones que, si no se entienden, se implementan al revés. Están en el
decision-log con su racional completo; acá está lo que hay que saber antes de
escribir la primera línea.

| # | Decisión | Qué pasa si no se entiende |
|---|---|---|
| 1 | **La escritura del índice es sincrónica.** Sin debounce y **sin cola**. | Alguien "optimiza" y vuelve a poner el buffer. Es lo que la app hace hoy. |
| 2 | **La app no verifica el índice contra los `.md`.** Gana el `.md`; la reparación es reindexar a mano. | Al abrir una receta se tienen los dos a la vista, y reescribir la fila parece gratis. No se hace. |
| 3 | **El manejo de errores es un aviso y un botón de reintentar.** Nada más. | Se agrega una cola de reintentos, que es una segunda fuente de verdad. |
| 4 | **La identidad es el `fileId`**, y el archivo no se renombra al editar el título. | Cambiar la categoría duplica filas en el índice. |
| 5 | **La convención de ingredientes es `nombre` + separador + `cantidad`**, y la coma solo separa si le sigue un dígito. | `Sal, pimienta` se parsea como el ingrediente "Sal" con cantidad "pimienta". |
| 6 | **El editor conserva las claves y secciones que no reconoce.** | Se borra contenido que escribieron los agentes, en silencio. |
| 7 | **No hay copia local del índice.** | Se deja el IndexedDB que ya existe, y aparece el caso de mostrar datos viejos. |
| 8 | **El éxito no se comunica.** Ningún cartel confirma que algo salió bien. | La ausencia del toast de "guardado" se reporta como bug. |

---

## 2. El delta, archivo por archivo

### 2.1 Se mantiene

El stack no cambia: **TypeScript estricto + Vite, sin framework.** Nada del diseño
pide uno — no hay estado compartido complejo ni listas virtualizadas más allá de
la carga por tramos, y los 328 tests son un activo que una reescritura tira.

| Archivo | Estado |
|---|---|
| `src/auth.ts` | Sin cambios. El scope `drive` y el flujo de consentimiento siguen igual. |
| `src/drive.ts` | Sin cambios. |
| `src/sheets.ts` | Sin cambios. `borrarFilas` ya resuelve el 429 al reindexar. |
| `src/config.ts`, `src/tipos.ts`, `src/gis.d.ts` | Sin cambios, salvo los tipos que arrastre el parser nuevo. |
| `src/categorias/*.webp` | **Se mantienen tal cual**, con su `import.meta.glob`. El placeholder nuevo las reutiliza. |

### 2.2 Cambia

| Archivo | Qué cambia | Referencia |
|---|---|---|
| `src/recipe.ts` | **El parser de ingredientes.** Hoy espera la cantidad en itálica al principio; pasa a `nombre` + separador + `cantidad`, con los cinco separadores y la regla de la coma. Además: `## Preparación` puede traer `###`, y `## Variaciones` puede ser una lista de bullets. | `E05` C05.1.2 y C05.1.3 |
| `src/store.ts` | **Se elimina la cola.** `guardar()` y `crear()` llaman hoy a `cache.encolar()` y esperan a `flush()`; pasan a escribir la fila en el momento, como **ya hace `borrar()`**. Desaparecen `flush()` y el uso de `encolar`/`leerCola`/`vaciarCola`. | `E05` C05.4.1 |
| `src/cache.ts` | **Se reduce o desaparece.** Sin cola y sin copia local del índice, lo único que podría justificar IndexedDB es el mapa de filas — y ese se puede releer del índice. Evaluar si el módulo sobrevive. | `E05` C05.4.2 |
| `src/catalogo.ts` | La fila del índice suma **la columna de nombres de ingredientes**, que es lo que hace posible la búsqueda por ingrediente sin leer mil archivos. | `E05` C05.4b.1 |
| `src/ui/router.ts` | Rutas nuevas: `borradores`, `borrador/:id`, `capturar`, `ajustes`, y `cocinar` como estado de la receta. | `ux/information-architecture.md` §3 |
| `src/ui/home.ts` | **Se reescribe.** La búsqueda pasa a estar arriba y visible; las categorías bajan a una grilla de **dos** columnas. | `E02` F02.1, mockup `03` |
| `src/ui/lista.ts` | Tarjeta miniatura nueva —foto al costado, 80 px— y carga por tramos con el total siempre visible. | `E02` C02.5.1 y C02.5.2 |
| `src/ui/detalle.ts` | La receta en fichas, y **el modo cocina entero**: conmutador, escala propia, paso realzado y tachado. | `E03` F03.1 y F03.2 |
| `src/ui/editor.ts` | Campos separados por clave, contenido en texto plano, y la casilla de "está completa así como está". | `E04` F04.2 y F04.3 |

### 2.3 Se elimina

| Qué | Por qué |
|---|---|
| `src/ui/app.css` | Se reemplaza por el CSS nuevo, escrito desde `ux/design-system.md`. |
| `src/ui/tokens.css` | **Se reescribe entero** con los tokens nuevos. Sigue viviendo en `src/ui/`. |
| Las tres familias tipográficas | Bricolage Grotesque, Instrument Sans y JetBrains Mono salen. **Sin webfont:** la fuente del sistema. |
| El tag manual `incompleto` | La completitud se deriva del contenido. La salida manual es `completa: true`. |
| La clase `texto-grande` | La reemplaza el modo cocina, con su escala completa. |
| La cola de escrituras y el cache del índice | Ver §2.2. |

### 2.4 Es nuevo

| Qué | Dónde | Nota |
|---|---|---|
| **Toda la épica E01** | Share Target en el manifest, pantalla de captura, planilla de borradores, pantalla de Borradores, pantalla de Borrador. | **Hoy no existe nada de esto**, y es lo más valioso del rediseño: es el job huérfano. |
| **La búsqueda por ingrediente y por tag** | `src/ui/home.ts` y una pantalla de resultados. | Depende de la columna nueva de `catalogo.ts`. |
| **El modo cocina** | `src/ui/detalle.ts`. | |
| **Ajustes** | Pantalla nueva: cuenta, reindexar, avisos acumulados. | |
| **El filtro por tag sobre una lista** | Resultados y lista de categoría. | |

---

### 2.5 Dónde vive el código

**Todo el producto vive en `src/` o en una subcarpeta.** Nada del código apunta a
`product-design/`, ni en un `import`, ni en un `@import` de CSS, ni en una ruta de
asset. Los documentos de este proyecto son especificación, no dependencia: se leen
al implementar y no se despliegan.

En concreto, para los dos casos donde la tentación existe:

| Qué | Cómo se hace |
|---|---|
| **Los tokens** | `ux/mockups/tokens.css` es la traducción del design system a CSS y sirve como punto de partida: se **copia** su contenido a `src/ui/tokens.css`, no se referencia. El archivo de `ux/` es del proyecto de diseño y no se toca al implementar. |
| **Las fotos de categoría** | Ya están en `src/categorias/*.webp` con `import.meta.glob`, que es donde tienen que estar. La copia en `ux/mockups/categorias/` existe solo para que los mockups se abran solos. |

**El andamio de los mockups no se copia.** `tokens.css` tiene una sección marcada
como catálogo —los marcos de 390 y 1280 px, los rótulos, `.pagina`, `.fila`,
`.caso`— que no es producto y no va a `src/`.

---

## 3. Lo que hay que hacer en Drive

**Nada obligatorio.** Los `.md` no se migran: la convención de ingredientes se
escribió contra el contenido que ya está, justamente para no tener que tocarlo.

Lo único a decidir: **la planilla de borradores** hay que crearla, y la crea la
app la primera vez, igual que hace con `_indice`.

---

## 4. Los tests

Los 328 tests son un activo, pero **no todos sobreviven**:

| Archivo de test | Qué le pasa |
|---|---|
| `recipe-cuerpo.test.ts`, `recipe-derivados.test.ts` | **Se reescriben.** Prueban el parser de ingredientes con la convención vieja. |
| `store-escritura.test.ts` | **Se reescribe.** Prueba la cola. |
| `cache.test.ts` | **Probablemente desaparece**, con el módulo. |
| `catalogo-fila.test.ts` | Se amplía con la columna de ingredientes. |
| `vista-detalle.test.ts`, `vistas-listas.test.ts`, `vista-editor.test.ts` | Se reescriben con las pantallas nuevas. |
| El resto —`auth`, `drive`, `sheets`, `router`, `markdown`, `config`— | Sobrevive casi entero. |

**El orden que recomiendo:** primero el parser con sus tests, porque todo lo demás
lo usa; y `npm run typecheck` sigue siendo la puerta, porque Vite borra los tipos
y no los verifica.

---

## 5. Lo que este proyecto contradice del repo padre

`../CLAUDE.md` tiene una tabla de "Decisiones cerradas — no reabrir". **Las de
plataforma siguen valiendo.** Las de producto y UX las reabrió este proyecto, que
era su mandato. Las que quedaron dadas vuelta:

| El repo padre decía | Este proyecto decidió |
|---|---|
| Pestañas en el detalle, descartadas | **El conmutador vuelve, pero solo dentro del modo cocina** — donde notas y variaciones no se usan, que era el argumento del veto. |
| El home es la grilla de categorías | La búsqueda va arriba; las categorías, abajo. |
| Un solo tema oscuro, sin `prefers-color-scheme` | **Se mantiene**, ahora con su costo escrito. |
| La paleta a mano con 14° de separación | **Se rehace:** 15 colores, 18° entre sí y 20° respecto del acento, `Otros` sin color. |
| Las fotos de categoría en `src/categorias/` | **Se mantiene**, y el placeholder de receta las reutiliza. |
| El índice se escribe con debounce | Sincrónico, sin cola. |
