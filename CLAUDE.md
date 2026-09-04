# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario.

**Estado: v1 mergeada a `main` y publicada en GitHub Pages.** 328 tests,
`npm run build` genera `dist/`. Falta la verificación manual contra el Drive
real (ver más abajo) y agregar `https://alelarre.github.io` a los orígenes
autorizados del cliente OAuth.

- Fuente de verdad: `docs/superpowers/specs/2026-08-31-recetario-design.md`
- Pasos manuales de instalación: `SETUP.md`

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
  reconstruible: los `.md` son siempre la verdad.
- **El input principal no es el editor**, son sesiones con agentes que reciben
  una fuente (PDF, foto, video, sitio web), extraen la receta y escriben el
  `.md`. El editor de la app existe para corregir, no para componer.

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
| Una vista de bandeja o triage | Lo que falta archivar se ve en el tile "Sin categorizar" del home; lo que falta terminar se lista filtrando por el tag `incompleto`. |
| Campos `ultima_vez`, `veces`, `puntaje`, `porciones` numérico, `foto:` | El esquema del frontmatter es cerrado y son seis claves (§3.2). |
| Datos nutricionales: calorías, macros, porciones diarias | Decidido el 2026-09-03. Las 24 recetas del libro de pescados vinieron con una nota "Valor calórico según la fuente" y se sacaron todas. No entra en las seis claves del §3.2, y como nota al cuerpo crea un campo paralelo que ninguna otra receta tiene. Si la fuente lo trae, se descarta. |
| Guardar fotos en Drive, miniaturas, imagen de portada | Decidido el 2026-09-02. Mostrar una foto de Drive obliga a pedirla con el token y armar un object URL; las miniaturas, a mantener un mapa de `thumbnailLink` que caduca. Demasiado para un recetario donde casi ninguna receta va a tener imagen. Solo URLs externas, dibujadas donde estén (§3.3). |
| Funcionar sin conexión | Salió de v1 el 2026-09-02. El índice ya se guarda en IndexedDB; usarlo para dibujar antes de la red quedó inventariado en el §11. |
| AppSheet, Apps Script, apps nativas, Artifact de Claude | Evaluadas como plataforma y descartadas (§2). |
| Pestañas en el detalle | Costaban cuatro toques para leer una receta entera y escondían las notas y las variaciones justo cuando se cocina. Reemplazadas el 2026-09-04 por una columna sola con los ingredientes en barra pegajosa. |
| Derivar el color de categoría de un hash del nombre | Medido: con 16 categorías siempre agrupa. `Pescados y mariscos` y `Ensaladas` caían en el mismo matiz exacto. La paleta es una lista escrita a mano, con 14° de separación mínima. |
| Identificar las categorías por una abreviación de 3 letras | Hay que aprenderlas. La foto se reconoce sin memorizar nada, y el nombre completo está escrito al lado igual. |
| Las fotos de categoría en `public/` o en Drive | `sw.js` sirve caché-primero solo `/assets/`; en `public/` serían 16 pedidos de red por apertura. Desde Drive haría falta el token y un object URL, que es lo que hizo descartar las fotos de receta. Van en `src/categorias/`, importadas con `import.meta.glob`. |
| Ordenar el home por cantidad de recetas | Reacomoda la grilla cada vez que entra una receta, y la posición de la categoría es justo lo que se aprende. Alfabético. |
| Una paleta clara, o `prefers-color-scheme` | La app se abre en la cocina, de noche. Un solo tema oscuro es un solo juego de tokens, y deja que las fotos sean lo único con color. |
| `drive.file` como scope, y el Google Picker | Medido el 2026-09-01: es estrictamente por archivo. Con `Recetario/` elegida en el Picker, la app no veía ninguna de las 16 subcarpetas ni un solo `.md` ajeno — y los `.md` los escriben agentes por fuera. |
| Detectar y reparar la planilla del índice corrupta o incompleta | Decidido el 2026-09-03. Siempre que el índice esté corrupto o incompleto, la recuperación es borrar el archivo `_indice` en Drive y dejar que la app lo cree de nuevo (arranca en el caso "falta-estructura" de `store.js`, que llama a `crearPlanilla()` y reconstruye solo). Diagnosticar cada tipo de daño posible para repararlo in situ es más trabajo y más riesgo que recrear desde los `.md`, que son la fuente de verdad. |

## Pendientes, en orden

1. **Verificar a mano contra el Drive real.** Es lo único que separa a v1 de
   estar terminada, y no lo cubre ningún test: la app nunca corrió contra Google.
   Los cuatro puntos que dejó la revisión final:
   - Cerrar la ventana de consentimiento de Google a mitad del primer login: la
     app tiene que mostrar un mensaje con botón, no quedarse en "Conectando…".
   - Cortar la red durante un "Guardar" o un "Borrar": tiene que avisar, no
     quedarse muda.
   - Guardar varias recetas seguidas y cambiar de app cerca de los 30 segundos
     del debounce; después mirar `_indice` y confirmar que ninguna receta quedó
     con dos filas.
   - Publicar dos veces sin tocar `sw.js` y confirmar que la app instalada ve la
     versión nueva.
2. **Migrar el contenido existente:** ya se migraron ~60 recetas del recetario
   original y del PDF de pescados a `Recetario/`, con el skill de
   `skills/recetario/`. Falta el resto: los documentos temáticos (fondues,
   pan, macarons, fermentación) y el Doc de ~7,3 MB.
3. El planificador semanal y la lista de compras: fuera de v1 y sin diseñar.
   Es lo próximo después del núcleo; necesita sus vistas y la barra de
   navegación inferior.

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

## El spike del §10, ya corrido

Las cuatro verificaciones se corrieron el 2026-09-01 contra las APIs reales y
sus resultados están incorporados al spec, que por eso ya no tiene un §10 de
riesgos. Sirvieron para: descartar `drive.file` (ver la tabla de arriba) y
confirmar la Changes API, las escrituras por fila de Sheets y el
`thumbnailLink`. El harness quedó en el historial de git (`647ab75`, borrado en
la punta) por si Google cambia algo y hay que volver a medir.

## En Drive, además de las carpetas

`Carnes/milanesas-napolitanas.md` es un fixture, no contenido real: lo escribió
un agente por fuera de la app para que la prueba 1 del spike tenga un `.md` que
la app no creó. Sirve también como ejemplo canónico del esquema del §3.2.

## Mockups de las sesiones de diseño

Quedaron en `.superpowers/brainstorm/*/content/` (fuera de git). De la sesión de
layout: `home`, `cocina`, `secciones`, `fotos`, `bandeja`, `editor`, `editor-v2`,
`categoria`. De la sesión visual: `neutro-y-acento`, `densidad`. Sirven para
recordar qué se comparó, no como especificación — lo decidido está en el §7.2 y
el §7.3 del spec, reescritos enteros el 2026-09-04 con el rediseño.

## Las fotos de las categorías

Los 16 `.webp` de `src/categorias/` son recortes de una sola imagen generada por
un agente (una grilla de 5×3), salvo `otros.webp`, que es pixel art compuesto
sobre el color de la categoría. El nombre del archivo es el slug de la carpeta:
así se agrega una foto nueva sin tocar código. Una categoría sin foto se dibuja
con su color plano y no rompe nada.
