# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario.

**Estado: v1 implementada y revisada, sin publicar.** El código vive en la rama
`v1`; `main` todavía tiene solo el diseño. 298 tests, `npm run build` genera
`dist/`. Falta la verificación manual contra el Drive real y publicar.

- Fuente de verdad: `docs/superpowers/specs/2026-08-31-recetario-design.md`
- Pasos manuales de instalación: `SETUP.md`

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
| Guardar fotos en Drive, miniaturas, imagen de portada | Decidido el 2026-09-02. Mostrar una foto de Drive obliga a pedirla con el token y armar un object URL; las miniaturas, a mantener un mapa de `thumbnailLink` que caduca. Demasiado para un recetario donde casi ninguna receta va a tener imagen. Solo URLs externas, dibujadas donde estén (§3.3). |
| Funcionar sin conexión | Salió de v1 el 2026-09-02. El índice ya se guarda en IndexedDB; usarlo para dibujar antes de la red quedó inventariado en el §11. |
| AppSheet, Apps Script, apps nativas, Artifact de Claude | Evaluadas como plataforma y descartadas (§2). |
| `drive.file` como scope, y el Google Picker | Medido el 2026-09-01: es estrictamente por archivo. Con `Recetario/` elegida en el Picker, la app no veía ninguna de las 16 subcarpetas ni un solo `.md` ajeno — y los `.md` los escriben agentes por fuera. |

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
2. **Mergear `v1` a `main` y publicar.** El workflow ya está (`.github/workflows/pages.yml`)
   y Pages está configurado en modo GitHub Actions; el entorno solo publica desde
   `main`. Después hay que agregar `https://alelarre.github.io` a los orígenes
   autorizados del cliente OAuth.
3. **Migrar el contenido existente:** en la carpeta `recetas` de Drive hay un Doc
   de ~7,3 MB y varios documentos temáticos (fondues, pan, macarons,
   fermentación, un PDF de pescados). Es trabajo de agente, con el skill de
   `skills/recetario/`. Antes de migrar miles de recetas, mirar el punto de
   abajo sobre la reconstrucción.
4. El planificador semanal y la lista de compras: fuera de v1 y sin diseñar.
   Es lo próximo después del núcleo; necesita sus vistas y la barra de
   navegación inferior.

## Lo que quedó sabido y no arreglado

- **La reconstrucción del índice no escala.** Lee los `.md` de a uno y borra las
  filas viejas una por una, sin reintento ante un 429. Con una receta no se nota;
  con las miles que va a traer la migración, tarda mucho más que el minuto que
  estima el §5.3 y puede fallar a mitad. Arreglarlo antes de migrar.
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
el §7.3 del spec.
