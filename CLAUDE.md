# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario.

**Estado: diseño cerrado y verificado contra las APIs reales. Todavía sin código.**

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
`recetas` del usuario. Las 15 categorías y `_fotos/` ya están creadas; los ids
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
| Una vista de bandeja o triage | Lo que falta archivar se ve en el tile "Sin categorizar" del home; lo que falta terminar se lista filtrando por el tag `incompleto`. |
| Campos `ultima_vez`, `veces`, `puntaje`, `porciones` numérico, `foto:` | El esquema del frontmatter es cerrado y son seis claves (§3.2). |
| AppSheet, Apps Script, apps nativas, Artifact de Claude | Evaluadas como plataforma y descartadas (§2). |
| `drive.file` como scope, y el Google Picker | Medido el 2026-09-01: es estrictamente por archivo. Con `Recetario/` elegida en el Picker, la app no veía ninguna de las 16 subcarpetas ni un solo `.md` ajeno — y los `.md` los escriben agentes por fuera. |

## Pendientes, en orden

1. **Plan de implementación**, con el skill `superpowers:writing-plans`. Es el
   próximo paso: el spec ya no tiene condicionales abiertos ni decisiones
   visuales pendientes.
2. **GitHub Pages** (`SETUP.md` §4), y agregar ese origen al cliente OAuth.
3. El planificador semanal y la lista de compras (hito 2), sin diseñar.
4. **Migrar el contenido existente:** en la carpeta `recetas` de Drive hay un Doc
   de ~7,3 MB y varios documentos temáticos (fondues, pan, macarons,
   fermentación, un PDF de pescados). Es trabajo de agente, no de la app.
5. **El skill del agente:** validador, corrector y contrato con la app. El
   contrato mínimo está anticipado en el §10.

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
