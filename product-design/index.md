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
momento: compartirlo abre el editor con la fuente cargada, y guardar alcanza.
Queda como **borrador** —una receta con el tag `borrador`— y espera en
Borradores hasta que haya tiempo de convertirlo. Desde el editor, **«Convertir
con Agente»** guarda la receta, arma el pedido y lo manda al agente; la
respuesta vuelve a la app compartida, o se pega en el editor con **Pegar**. La
app no llama a ningún modelo.

La semana se planifica en la app: el **plan de la semana** son siete días sin
fechas que arrancan en hoy, con dos comidas —mediodía y noche— y una lista de
recetas en cada una. Vive en Drive como `_plan.md`, y de él sale la **lista de
compras**, que no se guarda en ningún lado y se comparte como texto.

Una receta se puede **compartir** como PDF, como link a una vista de invitado
que se lee y se cocina sin login, o como texto. Es una copia del momento: nada
queda publicado en Drive.

Esa forma y no otra por tres razones que se sostienen juntas: los archivos son
abiertos **y están en Drive**, que es donde los agentes escriben y desde donde
el teléfono lee; la entrada agéntica funciona desde cualquier fuente, que es el
único terreno sin competencia en el mercado; y el código es del usuario, así que
nada de lo que el producto hace depende de la decisión de un tercero.

Se diseña para ~1.000 recetas, no para las decenas de hoy.

---

## Estos documentos

Estos documentos se mantienen al día con el producto: dicen lo que la app hace
hoy. Si un documento y el código en `src/` se contradicen, gana el código y el
documento se corrige.

El agente no se embebe en la PWA: la app arma el pedido, lo manda al agente y
recibe la respuesta compartida o pegada. La receta guarda fotos en Drive: tiene un
depósito propio —la sección `## Fotos` del `.md`— y las que se suben desde
el editor viven en `_fotos/`, junto con las propias de las categorías. Una URL externa
sigue valiendo (`ux/information-architecture.md` §1.7).

Lo pendiente está en [`BACKLOG.md`](../BACKLOG.md), en la raíz del repo.

---

## Research

| Documento | Qué contiene |
|---|---|
| [Análisis competitivo](research/competitive-analysis.md) | El landscape de soluciones para guardar y consultar recetas, con vacíos e insights. |

## Producto

| Documento | Qué contiene |
|---|---|
| [Product Vision](product/strategy/product-vision.md) | Qué es el producto, para quién, por qué existe y qué decisiones estratégicas lo condicionan. |
| [Personas](product/strategy/personas.md) | Quién usa el producto y en qué contextos concretos. |
| [Jobs to be Done](product/strategy/jtbd.md) | Los jobs que el producto resuelve, por persona y transversales. |
| [Principios de producto](product/strategy/product-principles.md) | Los árbitros de las decisiones de diseño ambiguas. |
| [Índice de épicas](product/specs/specs-overview.md) | Las seis épicas del producto, cómo se relacionan, y dónde viven las reglas transversales. |
| [E01 — Captura y borradores](product/specs/E01-CapturaYBorradores.md) | Guardar algo antes de perderlo, los borradores que esperan conversión, y Convertir con Agente. |
| [E02 — Encontrar](product/specs/E02-Encontrar.md) | Búsqueda por título, ingrediente y tag; categorías; paseo. |
| [E03 — Leer y cocinar](product/specs/E03-LeerYCocinar.md) | La receta a la vista, con las manos ocupadas. |
| [E04 — Corregir](product/specs/E04-Corregir.md) | El editor: arreglar un error, crear una receta mínima. |
| [E05 — Cimientos](product/specs/E05-Cimientos.md) | Drive, el índice, el esquema del `.md`, los estados degradados. |
| [E06 — Planificar](product/specs/E06-Planificar.md) | El plan de siete días sin fechas y la lista de compras que sale de él. |

## UX

| Documento | Qué contiene |
|---|---|
| [Arquitectura de información](ux/information-architecture.md) | Entidades, esquema del `.md`, inventario de pantallas y navegación. |
| [User flows](ux/user-flows.md) | Los flujos críticos, diagramados, con sus puntos de decisión. |
| [Wireframes](ux/wireframes.md) | Estructura y jerarquía de cada pantalla, con decisiones de layout explícitas. |
| [Brand Identity](ux/brand-identity.md) | Cinco adjetivos con lo que descarta cada uno, dirección visual, tono de voz y vocabulario canónico. |
| [Design System](ux/design-system.md) | Tokens con su contraste medido, paleta de categorías, tipografía, iconografía, motion y componentes core. |
| [Mockups](ux/mockups/) | Doce pantallas en HTML+CSS, una sola versión de cada una, más su [README](ux/mockups/README.md) con los hallazgos. Son la especificación de cuando se diseñó: lo decidido después usando la app vive en `src/ui/tokens.css`. |
