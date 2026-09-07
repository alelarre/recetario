# Recetario — Índice de Documentación

> Una PWA personal de recetas, para un solo usuario, donde los datos viven en
> Google Drive como archivos `.md` que sobreviven a la app.

---

## El problema

Alguien que cocina en serio junta recetas durante años en formatos que no se
hablan entre sí: documentos largos, PDFs, fotos de páginas de libros, reels
guardados, links en el navegador. Eso trae tres problemas.

**Lo que se guarda no está guardado.** Un reel o un link son un recordatorio de
que algo existía, no una receta que se pueda seguir. Entre encontrar una receta
y tenerla en el recetario hay un limbo, y ahí se pierden.

**Convertir cuesta, y por eso se posterga.** Pasar de un video a una receta
completa es trabajo real, así que se hace recién cuando ya se va a cocinar y no
cuando se encuentra. Entre las dos cosas pasa tiempo, y el material espera sin
estar en ningún lado.

**A escala, el archivo deja de ser navegable.** Con decenas de recetas alcanza
con buscar por nombre. Con mil —en su mayoría nunca cocinadas y de nombre no
recordado— una receta que no se recuerda es una receta que no existe.

Las alternativas del mercado resuelven una parte y piden a cambio que le cedas
tus recetas a su base de datos, que es el problema original un nivel más arriba.
Y ninguna entra por donde el contenido realmente está: los siete competidores
analizados importan desde una página web.

Se cocina igual sin resolver nada de esto. El costo no es dramático: es
permanente, y crece con el tamaño del archivo.

## La solución

Recetario es un recetario personal donde **cada receta es un archivo `.md` en
Google Drive**. Se lee, se edita y sobrevive sin la app: si el producto
desaparece mañana, el recetario sigue siendo una carpeta de archivos de texto.

No es solo una app: es un **ecosistema de dos partes**. Una PWA, que recibe,
guarda, muestra y corrige; y un **agente**, que recibe un PDF, un video, la foto
de una página de libro o un sitio, extrae la receta y escribe el `.md` en Drive.
Las dos escriben sobre los mismos archivos. Por eso el contenido no entra por un
editor: el de la PWA sirve para corregir y para escribir una receta que ya tenés
en la cabeza, no para convertir una fuente.

Para que nada se pierda antes de eso, lo que se encuentra se captura en el
momento como **borrador** —un título y la fuente, nada más— y espera en una
sección separada hasta que haya tiempo de convertirlo.

Esa forma y no otra por tres razones que se sostienen juntas: los archivos son
abiertos **y están en Drive**, que es donde los agentes escriben y desde donde
el teléfono lee; la entrada agéntica funciona desde cualquier fuente, que es el
único terreno sin competencia en el mercado; y el código es del usuario, así que
nada de lo que el producto hace depende de la decisión de un tercero.

Se diseña para ~1.000 recetas, no para las decenas de hoy.

---

## Estado

| Hito | Estado |
|---|---|
| 1 — Research & Competitive Analysis | ✅ 2026-09-04 |
| 2 — Personas + JTBD | ✅ 2026-09-05 |
| 3 — Product Principles | ✅ 2026-09-05 |
| 4 — Product Vision | ✅ 2026-09-05 |
| 5 — IA + User Flows | ✅ 2026-09-06 |
| 6 — Wireframes Lo-Fi | ✅ 2026-09-06 |
| 7 — Specs refinamiento | ✅ 2026-09-06 |
| 8 — Brand Identity + Design System | ✅ 2026-09-06 |
| 9 — UI Mockups Hi-Fi | ✅ 2026-09-06 |
| 10 — Usability Testing | ⏭ Salteado — 2026-09-06 |
| 11 — Iteración final + Handoff | ✅ 2026-09-07 |

**El proyecto está terminado.** Quien venga a implementar empieza por
[`plan/delta-implementacion.md`](plan/delta-implementacion.md).

Dos decisiones siguen abiertas, sin bloquear nada: la vía de hosting de las fotos
de receta y si el agente se embebe en la PWA. Están en
[BACKLOG.md](plan/BACKLOG.md) §1 con su contexto.

---

## Research

| Documento | Qué contiene | Hito |
|---|---|---|
| [Análisis competitivo](research/competitive-analysis.md) | El landscape de soluciones para guardar y consultar recetas, con vacíos e insights. | 1 |
| [Usability testing](research/usability-testing/README.md) | El Hito 10 se salteó: no hay protocolo ni hallazgos, y el README dice qué quedó sin evidencia. | ⏭ |

## Producto

| Documento | Qué contiene | Hito |
|---|---|---|
| [Product Vision](product/strategy/product-vision.md) | Qué es el producto, para quién, por qué existe y qué decisiones estratégicas lo condicionan. | Setup (v1.0) → 4 (v2.0) → 6 (v2.1) |
| [Personas](product/strategy/personas.md) | Quién usa el producto y en qué contextos concretos. | 2 |
| [Jobs to be Done](product/strategy/jtbd.md) | Los jobs que el producto resuelve, por persona y transversales. | 2 |
| [Principios de producto](product/strategy/product-principles.md) | Los árbitros de las decisiones de diseño ambiguas. | 3 |
| [Índice de épicas](product/specs/specs-overview.md) | Las seis épicas del producto, cómo se relacionan, y dónde viven las reglas transversales. | 5 → 7 → 11 |
| [E01 — Captura y borradores](product/specs/E01-CapturaYBorradores.md) | Guardar algo antes de perderlo, y la cola que espera conversión. | 5 → 7 → 11 |
| [E02 — Encontrar](product/specs/E02-Encontrar.md) | Búsqueda por título, ingrediente y tag; categorías; paseo. | 5 → 7 → 11 |
| [E03 — Leer y cocinar](product/specs/E03-LeerYCocinar.md) | La receta a la vista, con las manos ocupadas. | 5 → 7 → 11 |
| [E04 — Corregir](product/specs/E04-Corregir.md) | El editor: arreglar un error, crear una receta mínima. | 5 → 7 → 11 |
| [E05 — Cimientos](product/specs/E05-Cimientos.md) | Drive, el índice, el esquema del `.md`, los estados degradados. | 5 → 7 → 11 |
| [E06 — Planificar](product/specs/E06-Planificar.md) | Plan semanal y lista de compras. *Exploración.* | 5 → 7 → 11 |

## UX

| Documento | Qué contiene | Hito |
|---|---|---|
| [Arquitectura de información](ux/information-architecture.md) | Entidades, esquema del `.md`, inventario de pantallas y navegación. | 5 → 7 → 8 → 9 |
| [User flows](ux/user-flows.md) | Los flujos críticos, diagramados, con sus puntos de decisión. | 5 → 7 → 8 |
| [Wireframes](ux/wireframes.md) | Estructura y jerarquía de cada pantalla, con decisiones de layout explícitas. | 6 → 7 → 8 |
| [Brand Identity](ux/brand-identity.md) | Cinco adjetivos con lo que descarta cada uno, dirección visual, tono de voz y vocabulario canónico. | 8 → 11 |
| [Design System](ux/design-system.md) | Tokens con su contraste medido, paleta de categorías, tipografía, iconografía, motion y 15 componentes core. | 8 → 9 → 11 |
| [Mockups](ux/mockups/) | Trece pantallas en HTML+CSS con los tokens reales, una sola versión de cada una, más su [README](ux/mockups/README.md) con los hallazgos. | 9 → 11 |

## Plan

| Documento | Qué contiene |
|---|---|
| [Delta contra la implementación](plan/delta-implementacion.md) | **Por acá se empieza a implementar.** Las ocho decisiones que hay que entender, y el delta archivo por archivo contra la app existente. |
| [PLAN.md](plan/PLAN.md) | El runbook de ejecución, hito por hito. |
| [Decision log](plan/decision-log.md) | Decisiones no obvias, con alternativas descartadas y racional. |
| [Backlog](plan/BACKLOG.md) | Lo que quedó fuera de scope, con su razón y con qué haría falta para retomarlo. |
