# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario.

**Estado: el rediseño de `product-design/` está implementado, mergeado a `main`
y publicado en GitHub Pages** (PR #3, 2026-09-11). 392 tests, `npm run typecheck`
y `npm run build` en verde, y recorrida a mano contra el Drive real: el
Recetario, una categoría, una receta, el modo cocina, el editor, Borradores y
Ajustes.

- Especificación funcional y visual: **`product-design/`** ← lo vigente
- El plan con el que se implementó: `docs/superpowers/plans/2026-09-07-rediseno.md`
- Spec técnico de v1: `docs/superpowers/specs/2026-08-31-recetario-design.md`
- Pasos manuales de instalación: `SETUP.md`

---

## El rediseño: `product-design/`

`product-design/` es un proyecto de diseño de producto **terminado** (once hitos,
2026-09-04 al 09-07) que escribió desde cero la capa que la app nunca tuvo:
personas, jobs, principios, arquitectura de información, flujos, specs, sistema
visual y mockups.

**Es la especificación vigente del producto.** Cuando contradiga a lo
implementado o a este archivo, gana `product-design/`: la contradicción es
deliberada y está registrada.

### Ya está implementado

Las 24 tareas del plan (`docs/superpowers/plans/2026-09-07-rediseno.md`) están
hechas, un commit por tarea, y mergeadas a `main`. El delta
(`product-design/plan/delta-implementacion.md`) sirve ahora para leer por qué
cada archivo quedó como quedó, no como punto de entrada.

Lo que se implementó por fuera del plan, porque salió de mirar la app andando:
el reindexado ahora anota `schemaVersion` en la meta —sin eso, subir la versión
del esquema hacía reconstruir el índice en cada arranque—, el permiso de Google
se pide al tocar el botón y no al abrir, las categorías del Recetario salen
alfabéticas y no en el orden en que Drive las lista, el **volver** del
encabezado estaba emitiendo una acción que el cableado no escuchaba, el ⋯ de la
receta se eliminó por no tener contenido, y los **tags del editor** pasaron a
ser pills con su cruz.

Falta verificar a mano lo que ningún test alcanza: el **Share Target real**
(necesita la PWA instalada en Android), el foco del teclado en la captura y la
posición de scroll al conmutar en el modo cocina.

Para lo demás, según lo que necesites:

| Para saber | Leé |
|---|---|
| Qué tiene que hacer cada cosa | `product-design/product/specs/` — 91 capacidades con criterios de aceptación y edge cases. Las **reglas transversales** están en `E05-Cimientos.md` §Reglas. |
| Cómo se ve | `product-design/ux/design-system.md`, y `ux/mockups/index.html` para verlo funcionando |
| Cómo habla la app | `product-design/ux/brand-identity.md` §3 y §4 |
| Por qué algo es así | `product-design/plan/decision-log.md` — 89 decisiones con lo descartado |
| Qué quedó afuera a propósito | `product-design/plan/BACKLOG.md` |

### Cómo quedó el código

| | |
|---|---|
| **Se mantuvo** | El stack: TypeScript estricto + Vite, sin framework. `auth.ts`, `drive.ts`, `sheets.ts` y las fotos de `src/categorias/`. |
| **Cambió** | `recipe.ts` (el ingrediente es nombre + separador + cantidad, y los `###` estructuran), `store.ts` (la fila se escribe en el momento, sin cola), `catalogo.ts` (la fila suma `foto` y `completa`), y `src/ui/` entero. |
| **Se eliminó** | `app.css`, `cache.ts`, `home.ts`, `lista.ts`, `detalle.ts`, `visor.ts`, las tres familias tipográficas, el tag manual `incompleto`, la clase `texto-grande`, la cola, el cache local del índice y la Changes API. |
| **Es nuevo** | `borradores.ts` (la planilla de la cola) y `compartido.ts` (la capa que la app y el agente invocan igual), más las once pantallas de `src/ui/`: recetario, categoria, resultados, receta, cocina, editor, captura, borradores, ajustes y conexion, sobre `componentes.ts` e `iconos.ts`. |

**Todo el producto vive en `src/`.** Nada del código apunta a
`product-design/`: los documentos son especificación, no dependencia. Los tokens
están **copiados** de `product-design/ux/mockups/tokens.css` a
`src/ui/tokens.css`, sin el andamio del catálogo; `src/ui/base.css` es lo que en
los mockups vivía en el `<style>` de cada pantalla.

### Lo que el rediseño dio vuelta de la tabla de abajo

La tabla "Decisiones cerradas — no reabrir" mezcla dos cosas. **Las
restricciones de plataforma siguen valiendo enteras.** Las decisiones de producto
y UX las reabrió `product-design/`, que era su mandato:

| Acá dice | El rediseño decidió |
|---|---|
| Pestañas en el detalle, descartadas | El conmutador vuelve, **solo dentro del modo cocina** — donde notas y variaciones no se usan, que era el argumento del veto |
| El home es la grilla de categorías | La búsqueda va arriba; las categorías, abajo, en dos columnas |
| La paleta a mano con 14° de separación | Se rehace: 15 colores, 18° entre sí y 20° respecto del acento, `Otros` sin color |
| El índice se escribe con debounce | Sincrónico y **sin cola** |
| Un solo tema oscuro | Se mantiene, ahora con su costo escrito |
| Las fotos de categoría en `src/categorias/` | Se mantiene, y el placeholder de receta las reutiliza |

## TypeScript

Todo `src/` y `tests/` es TypeScript con `strict`, más
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y
`verbatimModuleSyntax`. No queda ningún `.js` y `allowJs` está apagado.

- **Vite borra los tipos, no los verifica.** La verificación es
  `npm run typecheck`, que corre `tsc --noEmit` sobre las dos configs y es una
  puerta del CI junto con los tests. Sin ese paso un error de tipos se publica
  igual.
- **Dos configs.** `tsconfig.json` para `src`; `tsconfig.tests.json` extiende y
  apaga solo `noUncheckedIndexedAccess`, que en una aserción de test es ruido
  —`filas[0]` dentro de un `expect` ya falla solo si la fila no está—.
- **Los tipos del dominio viven en `src/tipos.ts`** y separan dos fronteras: la
  del `.md`, donde una receta parseada siempre tiene todas sus claves y lo
  ausente llega como `null`; y la de Google, donde todo campo se declara
  opcional porque el servidor puede omitirlo.
- **Los dobles de test se declaran contra el tipo que el store consume**
  (`DriveDelStore`, `SheetsDelStore`) con `satisfies`: un doble que se aparte de
  la API real deja de compilar. Los helpers están en `tests/dobles.ts`
  (`entradaFalsa`, `recetaFalsa`), `tests/dom-falso.ts` (el DOM mínimo y el
  cliente de GIS) y `tests/aserciones.ts` (`arranqueListo` y compañía, que
  estrechan la unión de `arrancar()`, y `invalido()`, que marca la entrada
  deliberadamente mala de los tests de defensa del §8).
- **Los tipos de Google Identity Services están escritos a mano** en
  `src/gis.d.ts`: el SDK se carga por `<script>` y no es un paquete npm.

## Idioma

Todo en español rioplatense: spec, comentarios, UI y nombres de carpetas.

## Lo esencial

- **PWA de archivos estáticos** en GitHub Pages. Sin backend, sin infraestructura
  que mantener. Un único scope OAuth: `drive`, con su pantalla de "app no
  verificada" una vez (§4.4).
- **Las recetas son `.md` en Drive.** La carpeta contenedora es la categoría y es
  la única verdad; el frontmatter no lleva `categoria`.
- **El índice es una Google Sheet** (`Recetario/_indice`). Es un cache derivado y
  reconstruible: los `.md` son siempre la verdad. **Los borradores son otra**
  (`Recetario/_borradores`): una cola de trabajo de cuatro columnas, que no entra
  al índice porque no es contenido consolidado.
- **El input principal no es el editor**, son sesiones con agentes que reciben
  una fuente (PDF, foto, video, sitio web), extraen la receta y escriben el
  `.md`. El editor de la app existe para corregir, no para componer.
- **La app y el agente escriben con la misma función.** `src/compartido.ts` tiene
  las tres operaciones —escribir una receta al índice, convertir un borrador en
  receta y leer un `.md`— y son el único camino para escribir: dos
  implementaciones del mismo formato divergen, una sola no (C05.4.3).

## Ubicación en Drive

`Recetario/` → `1B2nNmy0qOAuZT9lomrSdompYta7uuJ7B`, dentro de la carpeta
`recetas` del usuario. Las 16 categorías ya están creadas; los ids
de cada una están en `SETUP.md`.

**La app no hardcodea ninguno de esos ids:** descubre las categorías listando las
subcarpetas, así que agregar una categoría es crear una carpeta en Drive.

## Decisiones cerradas — no reabrir

El spec dice qué se hace, pero por decisión del usuario no guarda el registro de
lo descartado. Todo esto se discutió a fondo y tiene una razón concreta.

| No proponer | Por qué |
|---|---|
| Índice en JSON en vez de planilla | Drive no tiene escritura parcial: `files.update` reemplaza el archivo entero. Con planilla, editar una receta es una fila (~200 B) en vez de reescribir cientos de KB. |
| SQLite en Drive | Se puede leer parcial (Range requests) pero no escribir: cada cambio obliga a resubir el `.db` completo. |
| Comprimir el índice en tránsito | Google exige un `User-Agent` que contenga la cadena "gzip", y `fetch` no puede setear ese header desde el navegador. |
| Journal de deltas o partición del índice | Existían solo para evitar el full rewrite, que la planilla ya resuelve. |
| Cooklang para el cuerpo de la receta | Da parsing exacto, pero ensucia el `.md`, que es justamente lo que se eligió proteger. |
| `schema.org/Recipe` como modelo de datos | Está diseñado para publicar a buscadores: nutrición, rating, autor, video. Sirve como checklist, no como modelo. |
| Reabrir el alcance de v1 | Se revisó entero el 2026-09-01: el planificador salió, y crear una receta mínima entró (§11). |
| Una vista de bandeja o triage | Lo que falta archivar se ve en el tile "Sin categorizar" del Recetario. **El rediseño cambió la otra mitad:** lo que falta terminar ya no se filtra por un tag manual — la completitud se deriva al leer el `.md` (C05.3.1) y se dibuja como marca en la tarjeta. |
| Campos `ultima_vez`, `veces`, `puntaje`, `porciones` numérico | El esquema del frontmatter es cerrado. **El rediseño lo abrió a ocho claves:** entraron `foto` y `completa` (IA §1.5), y nada más. |
| Datos nutricionales: calorías, macros, porciones diarias | Decidido el 2026-09-03. Las 24 recetas del libro de pescados vinieron con una nota "Valor calórico según la fuente" y se sacaron todas. No entra en las seis claves del §3.2, y como nota al cuerpo crea un campo paralelo que ninguna otra receta tiene. Si la fuente lo trae, se descarta. |
| Guardar fotos en Drive, miniaturas, imagen de portada | Decidido el 2026-09-02. Mostrar una foto de Drive obliga a pedirla con el token y armar un object URL; las miniaturas, a mantener un mapa de `thumbnailLink` que caduca. Demasiado para un recetario donde casi ninguna receta va a tener imagen. Solo URLs externas, dibujadas donde estén (§3.3). |
| Funcionar sin conexión | Salió de v1 el 2026-09-02, y el rediseño lo cerró del todo: **no hay copia local del índice** (C05.4.2). Sin la lectura de Drive no hay con qué dibujar, y esa es la consecuencia buscada. `cache.ts` y su IndexedDB se eliminaron. |
| AppSheet, Apps Script, apps nativas, Artifact de Claude | Evaluadas como plataforma y descartadas (§2). |
| Pestañas en el detalle | Costaban cuatro toques para leer una receta entera y escondían las notas y las variaciones justo cuando se cocina. La receta se lee de corrido, en una pila de fichas. **El conmutador volvió, pero solo dentro del modo cocina**, que es donde notas y variaciones no se usan. |
| Derivar el color de categoría de un hash del nombre | Medido: con 16 categorías siempre agrupa. `Pescados y mariscos` y `Ensaladas` caían en el mismo matiz exacto. La paleta es una lista escrita a mano: quince colores a 18° entre sí y a 20° del acento, más el neutro de `Otros` (design-system §2.3), y vive en `src/ui/tokens.css` como tokens `--cat-*`. |
| Identificar las categorías por una abreviación de 3 letras | Hay que aprenderlas. La foto se reconoce sin memorizar nada, y el nombre completo está escrito al lado igual. |
| Las fotos de categoría en `public/` o en Drive | `sw.js` sirve caché-primero solo `/assets/`; en `public/` serían 16 pedidos de red por apertura. Desde Drive haría falta el token y un object URL, que es lo que hizo descartar las fotos de receta. Van en `src/categorias/`, importadas con `import.meta.glob`. |
| Ordenar el home por cantidad de recetas | Reacomoda la grilla cada vez que entra una receta, y la posición de la categoría es justo lo que se aprende. Alfabético. El **número** sí se muestra: un badge en la esquina del tile, y sólo si la categoría tiene algo (2026-09-11, elegido sobre ponerlo en la banda del nombre). |
| Una paleta clara, o `prefers-color-scheme` | La app se abre en la cocina, de noche. Un solo tema oscuro es un solo juego de tokens, y deja que las fotos sean lo único con color. |
| `drive.file` como scope, y el Google Picker | Medido el 2026-09-01: es estrictamente por archivo. Con `Recetario/` elegida en el Picker, la app no veía ninguna de las 16 subcarpetas ni un solo `.md` ajeno — y los `.md` los escriben agentes por fuera. |
| Detectar y reparar la planilla del índice corrupta o incompleta | Decidido el 2026-09-03. Siempre que el índice esté corrupto o incompleto, la recuperación es borrar el archivo `_indice` en Drive y dejar que la app lo cree de nuevo (`store.ts` llama a `crearPlanilla()` y reconstruye solo); el rediseño agregó el camino a mano: **Ajustes → Reindexar**. Diagnosticar cada tipo de daño posible para repararlo in situ es más trabajo y más riesgo que recrear desde los `.md`, que son la fuente de verdad. |

## Lo que queda pendiente

El planificador está diseñado y queda afuera a propósito
(`product-design/plan/BACKLOG.md`). Lo que queda es una sola cosa.

**Migrar el contenido existente:** ya se migraron ~60 recetas del recetario
original y del PDF de pescados a `Recetario/`, con el skill de
`skills/recetario/`. Falta el resto: los documentos temáticos (fondues, pan,
macarons, fermentación) y el Doc de ~7,3 MB.

Lo que ya no está pendiente:

- **La app corrió contra el Drive real y funciona**, antes y después del
  rediseño: el 2026-09-11 se recorrieron a mano el Recetario, una categoría, una
  receta, el modo cocina, Borradores y Ajustes contra las ~60 recetas reales.
- **El origen `https://alelarre.github.io` ya está autorizado** en el cliente
  OAuth de Google Cloud Console.
- **La planilla `Recetario/_borradores` ya existe:** la creó la app sola la
  primera vez que se abrió Borradores, igual que hace con el índice.

## Lo que quedó sabido y no arreglado

- **La app no detecta sola una planilla del índice corrupta o incompleta.**
  Pasó de verdad el 2026-09-02: la creación se cortó a mitad, quedó un archivo
  a medio crear en Drive y la app no arrancaba más (`Unable to parse range:
  meta!A1:B20`, porque la hoja `meta` nunca llegó a escribirse) — el mensaje
  crudo del error, sin ninguna salida ofrecida. La recuperación es manual y es
  política, no un parche pendiente: ver la fila del índice en "Decisiones
  cerradas". Lo que sí se arregló el 2026-09-03: si `crearPlanilla()` falla a
  mitad, ahora borra el archivo a medio hacer antes de propagar el error, así
  que una falla transitoria ya no deja ese archivo corrupto para la próxima
  vez — la siguiente carga simplemente la vuelve a crear sola.
- **Reconstruir el índice sigue leyendo los `.md` de a uno.** El 429 al
  escribir (una llamada por fila borrada) se arregló el 2026-09-03
  (`sheets.borrarFilas`, ver el commit). Pero la lectura previa —un
  `drive.leerTexto()` por archivo, sin paralelismo ni loteo— no se tocó. Con
  una receta no se nota; con las miles que va a traer la migración, va a
  tardar. La cuota de lectura de Drive es más generosa que la de escritura de
  Sheets, así que es menos urgente, pero conviene mirarlo antes de migrar en
  masa.
- **El plan `docs/superpowers/plans/2026-09-01-recetario-v1.md` quedó viejo.**
  Describe la funcionalidad de fotos que después se eliminó. Sirve como registro
  de cómo se construyó, no como runbook: si se vuelve a usar, hay que leerlo
  contra el spec.
- **Subir `SCHEMA_VERSION` cuesta un reindexado entero al próximo arranque.**
  Es el mecanismo, no un bug: la versión pasó a 2 con el rediseño porque la fila
  suma `foto` y `completa`. Con ~60 recetas son unos 40 segundos; con las miles
  de la migración va a ser el problema de la línea de arriba.
- **Tres cosas del rediseño no las cubre ningún test:** el Share Target real
  (necesita la PWA instalada en Android), el foco del teclado en la captura y la
  posición de scroll al conmutar en el modo cocina.

## El spike del §10, ya corrido

Las cuatro verificaciones se corrieron el 2026-09-01 contra las APIs reales y
sus resultados están incorporados al spec, que por eso ya no tiene un §10 de
riesgos. Sirvieron para: descartar `drive.file` (ver la tabla de arriba) y
confirmar la Changes API, las escrituras por fila de Sheets y el
`thumbnailLink`. La Changes API terminó eliminada por el rediseño: la app no
descubre lo que se escribe afuera (R6). El harness quedó en el historial de git (`647ab75`, borrado en
la punta) por si Google cambia algo y hay que volver a medir.

## En Drive, además de las carpetas

`Carnes/milanesas-napolitanas.md` es un fixture, no contenido real: lo escribió
un agente por fuera de la app para que la prueba 1 del spike tenga un `.md` que
la app no creó. Sirve también como ejemplo canónico del esquema del §3.2.

## Mockups de las sesiones de diseño

**Estos son de 2026-09-04 y quedaron viejos:** los mockups vigentes son los trece
de `product-design/ux/mockups/`, con el design system aplicado.

Quedaron en `.superpowers/brainstorm/*/content/` (fuera de git). De la sesión de
layout: `home`, `cocina`, `secciones`, `fotos`, `bandeja`, `editor`, `editor-v2`,
`categoria`. De la sesión visual: `neutro-y-acento`, `densidad`. Sirven para
recordar qué se comparó, no como especificación — lo decidido está en el §7.2 y
el §7.3 del spec, reescritos enteros el 2026-09-04 con el rediseño.

## Las fotos de las categorías

Los 16 `.webp` de `src/categorias/` son recortes de una sola imagen generada por
un agente (una grilla de 5×3), salvo `otros.webp`, que es pixel art compuesto
sobre el color de la categoría. El rediseño lo había dado de baja —`Otros` se
dibujaba con la trama— y se repuso el 2026-09-11: la foto va, el color neutro
también, y la trama queda como respaldo de una carpeta que todavía no tiene
imagen. El nombre del archivo es el slug de la carpeta:
así se agrega una foto nueva sin tocar código. Una categoría sin foto se dibuja
con su color plano y no rompe nada.
