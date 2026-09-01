# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario.

**Estado: diseño cerrado, todavía sin código.**

- Fuente de verdad: `docs/superpowers/specs/2026-08-31-recetario-design.md`
- Pasos manuales de instalación: `SETUP.md`

## Idioma

Todo en español rioplatense: spec, comentarios, UI y nombres de carpetas.

## Lo esencial

- **PWA de archivos estáticos** en GitHub Pages. Sin backend, sin infraestructura
  que mantener. Un único scope OAuth: `drive.file`, que es no-sensible.
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

## Pendientes, en orden

1. **Cliente OAuth y API key** en Google Cloud Console (`SETUP.md` §3). Lo tiene
   que hacer el usuario. Es lo único que bloquea el spike.
2. **Correr el spike del §10:** ya está construido en `spike/` — cuatro
   verificaciones contra las APIs reales (Picker con `drive.file`, Changes API,
   Sheets con `drive.file`, `thumbnailLink`), con su plan B enunciado en cada
   una. Bloquea escribir código, porque sus resultados pueden cambiar el §5
   entero. Ver `spike/README.md` para correrlo.
3. Actualizar el spec con esos resultados, eliminar los condicionales del §10 y
   borrar `spike/`.
4. Plan de implementación, con el skill `superpowers:writing-plans`.
5. **Dirección visual:** tipografía, color, densidad. Sin decidir — los mockups
   usaron colores de relleno, no son una decisión de diseño.
6. El planificador semanal y la lista de compras (hito 2), sin diseñar.
7. **Migrar el contenido existente:** en la carpeta `recetas` de Drive hay un Doc
   de ~7,3 MB y varios documentos temáticos (fondues, pan, macarons,
   fermentación, un PDF de pescados). Es trabajo de agente, no de la app.
8. **El skill del agente:** validador, corrector y contrato con la app. El
   contrato mínimo está anticipado en el §11.

## En Drive, además de las carpetas

`Carnes/milanesas-napolitanas.md` es un fixture, no contenido real: lo escribió
un agente por fuera de la app para que la prueba 1 del spike tenga un `.md` que
la app no creó. Sirve también como ejemplo canónico del esquema del §3.2.

## Mockups de la sesión de diseño

Quedaron en `.superpowers/brainstorm/*/content/` (fuera de git): `home`,
`cocina`, `secciones`, `fotos`, `bandeja`, `editor`, `editor-v2`, `categoria`.
Sirven para recordar qué se comparó, no como especificación — lo que se decidió
está en el §7.2 del spec.
