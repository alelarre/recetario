# Recetario

App personal de recetas. Los datos viven en Google Drive como archivos `.md` y
sobreviven a la app. Un solo usuario. Publicada en GitHub Pages
(`https://alelarre.github.io/recetario/`) y en uso contra el Drive real.

Todo en español rioplatense: documentos, comentarios, UI y nombres de carpetas.

## Lo esencial

- **PWA de archivos estáticos** en GitHub Pages: TypeScript estricto + Vite, sin
  framework, sin backend. Un único scope OAuth, `drive`.
- **Las recetas son `.md` en Drive.** La carpeta contenedora es la categoría y es
  la única verdad; el frontmatter no lleva `categoria`.
- **El frontmatter es cerrado, siete claves:** `titulo`, `rinde`, `tiempo`,
  `dificultad`, `fuente`, `foto` y `tags`. `tiempo` es uno de cinco valores
  (`~15 min`, `~30 min`, `~60 min`, `>60 min`, `>1 día`); `foto` es una URL
  externa. Un valor inválido de `tiempo` o `dificultad` se lee como ausente.
- **Las fotos de la receta son un depósito**, la sección `## Fotos` del cuerpo:
  una línea `- <número>: <url>` por foto, con el número estable y nunca reusado.
  El texto las nombra con `![epígrafe](foto:N)` en cualquier sección y `foto`
  acepta `foto:N`; antes de dibujarse, la receta se resuelve a URLs. Las que
  sube la app van a `_fotos/` (`carpeta_fotos` en `meta`), achicadas a JPEG;
  se piden a Drive con el token y quedan en Cache Storage por id de archivo
  (`src/imagenes.ts`). La foto propia de una categoría vive ahí también.
- **Cuatro tags especiales**, reservados y con forma propia: `favorito`,
  `menú diario`, `probar` y `borrador` (la completitud de la receta). Van en
  la lista `tags` como cualquier otro. Cada uno tiene formas alternativas que
  se leen como él sin reescribir el `.md`: `incompleta` y sus formas son
  `borrador`.
- **El índice es una Google Sheet** (`_indice`, con las hojas de recetas, `meta`
  y `categorias`). Es un cache derivado: los `.md` y las carpetas
  son siempre la verdad, y *Ajustes → Reindexar* lo rehace entero. La fila se
  escribe en el momento, sin cola.
- **Copia local del índice, y sólo del índice** (`src/indice-local.ts`): vive en
  `localStorage`; al abrir se compara el `modifiedTime` de `_indice` y, si
  coincide, no se lee Sheets. Parte de que nunca hay escritura concurrente. No
  sirve para funcionar sin conexión.
- **Un borrador es una receta con el tag `borrador`**: el mismo `.md`, el
  mismo editor y la misma fila. Borradores es la lista por tag de `borrador`,
  en el menú, y **es el único camino a ellos**: el home no tiene tile «Sin
  categoría» y `borrador` no aparece en ninguna lista de tags (`store.tagsDe`
  lo filtra). **`borrador` no tiene presentación propia:** ni marca en la
  tarjeta, ni chip en la receta, ni ícono; tocar un borrador en Borradores
  abre su editor. La categoría es opcional al crear: lo que no tiene categoría vive
  en `_sin-categoria/` (`carpeta_sin_categoria` en `meta`), que no es una
  categoría, y se muestra como «Sin categoría»; ninguna categoría puede
  llamarse así. Sacar `borrador` exige categoría, así que ahí todo es
  borrador; reindexar nombra en Ajustes la que no lo tenga, sin tocarla.
  **La app no escribe recetas sueltas en la carpeta base**; un `.md` suelto
  escrito afuera se lee sin categoría.
- **El editor es el único formulario.** *Nueva receta*, en el menú, lo abre
  vacío, con la hamburguesa en vez del volver (`nueva` está en
  `PANTALLAS_CON_MENU`); editar una existente lleva el volver; el menú Compartir lo abre con la fuente, el texto en Notas y las fotos
  en el depósito: el Share Target es un `POST` que atiende `public/sw.js` y
  redirige a `#/nueva`. Nada se escribe hasta Guardar, y una receta nueva sin
  ningún campo cargado no se guarda (`tieneAlgoCargado` en `catalogo.ts`).
- **El plan de la semana es otro `.md`**, `_plan.md`, en la carpeta base y al
  lado de `_indice`: siete días sin fechas que arrancan en hoy, con dos comidas
  cada uno y una lista de recetas en cada comida. No está en el índice —se lo
  busca por nombre— y cada cambio lo reescribe entero. La lista de compras
  deriva del plan y no se guarda en ningún lado.
- **El input principal no es el editor**, son sesiones con un agente en la Mac
  (Claude Code o Claude Desktop) que usa el MCP local (`mcp/`), el skill
  `skills/recetario/SKILL.md` y sus herramientas: recibe una fuente (PDF, foto,
  video, sitio web, una lista de links) y escribe las recetas, corrige las que
  están u ordena el recetario. El editor existe para corregir. En un borrador,
  «Convertir con Agente» guarda la receta y manda el pedido a claude.ai, que
  pide `id: <id>` en el frontmatter. La respuesta vuelve compartida —abre el
  editor de la receta de ese `id`, o uno nuevo— o se pega con «Pegar», en el
  encabezado del editor, que llena el formulario sin guardar. **La app no llama
  a ningún modelo.**
- **Hay un solo camino de escritura: el store.** `store.crear` y
  `store.guardar` escriben el `.md` y su fila juntos; sin categoría, en
  `_sin-categoria/`. El agente corre este mismo código a través del MCP, que
  importa `store.ts`: lo que escribe queda con su fila, sin reindexar. Con
  *Convertir con Agente*, el agente devuelve el `.md` y lo guarda la app.
- **La app no descubre lo que se escribe afuera:** lo que escribe el MCP
  aparece la próxima vez que la app abre, porque cambió la fecha de `_indice`;
  un `.md` subido a Drive por fuera del store aparece al reindexar.

## Dónde está cada cosa

| Para saber | Leé |
|---|---|
| Qué tiene que hacer cada cosa | `product-design/product/specs/` — capacidades con criterios de aceptación y edge cases. Las reglas transversales están en `E05-Cimientos.md` §Reglas. |
| Pantallas, rutas, entidades y flujos | `product-design/ux/information-architecture.md` y `user-flows.md` |
| Cómo se ve | `product-design/ux/design-system.md`; lo que manda es `src/ui/tokens.css` |
| Cómo habla la app | `product-design/ux/brand-identity.md` §3 y §4 |
| Qué está pendiente | `BACKLOG.md` |
| El skill con el que un agente carga recetas | `skills/recetario/SKILL.md` |
| Cómo conectar y registrar el MCP, y qué hacer con cada error de login | `mcp/LEEME.md` |

`product-design/` es la especificación del producto y se mantiene al día: un
cambio de comportamiento o de diseño actualiza el documento que corresponde, en
el mismo trabajo. Los documentos dicen cómo es el producto hoy —sin historial,
sin fechas, sin alternativas descartadas—. Los mockups de `ux/mockups/` y los
wireframes son de cuando se diseñó y no se actualizan.

Nada del código depende de `product-design/`. **Todo el producto vive en `src/`.**
El MCP vive en `mcp/`, importa de `src/` y nunca al revés:
`tests/publicacion.test.ts` verifica que ningún archivo de `src/` importe de
`mcp/` y que `mcp/` no entre al bundle de Pages.

| | |
|---|---|
| Entrada | `inicio.ts` decide entre `main.ts` (la app, con login) e `invitado.ts` (la vista de una receta compartida, sin login). `main.ts` cablea rutas, acciones y pantallas: lo que es de la pantalla que se mira vive en `estado-pantalla.ts` —un objeto nuevo por pantalla, `estadoNuevo()`; lo que sobrevive a un cambio va aparte en `main.ts`, cada cosa con su motivo—, y las acciones son un mapa `data-accion → función` armado por secciones (`acciones.ts`, `registrarAcciones`), que el listener de click sólo consulta. En `main.ts` quedan las secciones sin módulo propio: navegación, menú, plan, receta, categorías, editor, compartir y ajustes. |
| Navegación y velo | `navegacion.ts` es el único que toca `location` y `history`: la profundidad viaja en `history.state` y dice si hay una pantalla atrás; `ir`, `reemplazar`, `volver`, `salirDe` (retrocede hasta salir de una pantalla, como al borrar una receta o salir de la cocina) y las **capas**, lo que se abre sin cambiar de ruta y se cierra con el atrás (IA §4.6). `velo.ts` es el dueño del velo de R8, con sus tres formas: `escribir`, `esperar` y `conProgreso`; `ocupado()` es lo que miran las guardas de navegación y de toque. |
| Controladores | Cada uno tiene su estado y registra sus acciones en el mapa. `lista-control.ts`: filtros, orden y tramo de una lista de recetas, y el observador del tramo (`filtrar-duracion`, `ordenar`; el chip de un tag lo atiende `main.ts`). `fotos-control.ts`: el depósito del editor de recetas —las fotos, la portada, las nuevas en memoria, las ya subidas— y los campos ocultos, que se escriben sólo desde ahí (las fichas de foto, *Por URL*, portada, poner y sacar). `visor-control.ts`: la foto a pantalla completa y su gesto (`ver-foto-receta`, `cerrar-visor`). `carrusel-control.ts`: las flechas (`carrusel-izq`, `carrusel-der`). Visor, carrusel y `cocina-control.ts` los usan la app y el invitado. La foto propia de una categoría que se edita no es de `fotos-control`: vive en el estado de pantalla. |
| Google | `auth.ts`, `drive.ts`, `sheets.ts`; los tipos de Google Identity Services están escritos a mano en `gis.d.ts` (el SDK se carga por `<script>`). `config.ts` tiene el client ID, el scope, los nombres fijos y `SCHEMA_VERSION`. |
| Dominio | `recipe.ts` (parsear y escribir el `.md`), `plan.ts` (el `.md` del plan de la semana), `compras.ts` (la lista que sale del plan, y su texto), `catalogo.ts` (la fila del índice, tags reservados, búsqueda), `categorias.ts` (las 16 predefinidas: nombre, color, foto), `store.ts` (arranque, índice, reindexado), `indice-local.ts`, `compartido.ts` (lo que llega por el menú Compartir: la fuente, las notas y el título por defecto), `conversion.ts` (el pedido al agente y sus reglas del formato, la receta que vuelve y cómo se pega), `validar.ts` (cómo lee la app un `.md` recibido y qué tiene fuera del formato; lo usa el MCP), `fotos.ts` (achicar una foto antes de subirla), `fotos-receta.ts` (el depósito: parsear y escribir `## Fotos`, resolver `foto:N`, poner y sacar referencias), `tipos.ts`. |
| Compartir | `compartir.ts` (menú Compartir del sistema y portapapeles, con sus respaldos), `link-receta.ts` (la receta comprimida en el fragmento del link), `texto-receta.ts`, `pdf/` (pdfmake con Inter embebida), `cocina-control.ts` (modo cocina y pantalla encendida, compartido entre receta e invitado). |
| UI | `src/ui/`: una pantalla por archivo, sobre `componentes.ts` (con `cuadroDeFoto` y `carrusel`), `iconos.ts`, `pintar.ts`, `fichas-receta.ts`, `lista-recetas.ts` (la lista de recetas que dibujan la categoría, la lista por tag, Borradores, los resultados y *Agregar al plan*) y `visor.ts` (la foto a pantalla completa, compartida entre receta, editor e invitado); `router.ts` tiene las rutas y `MENU`, la única fuente de qué pantallas son destino del menú. `pintar` dibuja la pantalla entera y `pintarParte` una parte —un bloque, una ficha, la fila de fotos— sin repintar: los dos completan las fotos que el HTML deja pedidas, así que todo HTML con fotos pasa por uno de los dos. **`tokens.css` es el sistema del producto** —tokens y componentes— y se edita directamente; `base.css` es lo propio de cada pantalla. Todo encabezado queda fijo arriba por CSS (`.enc`, `.encoc`, `.cajaenc`). Abrir y cerrar el menú lateral cambia las clases del panel y del velo sin redibujar (`ponerMenu` en `main.ts`): en la receta nueva, redibujar borraría lo escrito. Desde 900 px (`ANCHO_MENU_FIJO` en `gesto-menu.ts`, igual que el CSS) el lateral queda fijo en todas las pantallas. |
| MCP (`mcp/`) | Un proceso de Node que Claude Code o Claude Desktop lanzan por stdio con `tsx`. `servidor.ts` registra las diez herramientas —`formato`, `categorias`, `tags`, `buscar`, `leer`, `validar`, `crear`, `guardar`, `borrar` y `reindexar`— con sus esquemas; la lógica está en `recetario.ts`, sobre `crearStore` de la app con la copia del índice en una variable del proceso (`indiceEnMemoria`): antes de cada herramienta que usa el Drive corre el arranque de la app, que pide la fecha de `_indice` y relee la planilla sólo si cambió. `crear` y `guardar` validan primero con `src/validar.ts` y no escriben si hay errores. `validar` sin `id` valida como `crear`, con el depósito vacío; al corregir recibe también el `id` y `sacar`, para numerar las fotos desde el depósito que está en Drive, igual que `guardar`. `borrar` pide `confirmacion`: el título exacto, o el nombre de archivo si no hay título. **El depósito `## Fotos` lo arma el MCP** y el que trae el `.md` se ignora, con un aviso: cada foto se pide con su origen y su uso —`plato` (portada si el `.md` no trae `foto:`), `paso` o `fuente` (se sube sólo si la receta queda `borrador`)—, y el número de cada una se sabe antes de subirla (`fotos-pedidas.ts`). `fotos.ts` achica con el `achicar()` de la app sobre `@napi-rs/canvas`, pasa los HEIC por `sips` y acepta rutas locales o URLs `http` y `https` de hasta 25 MB; una `https` que no se baja por red, tiempo o un 5xx queda como link externo, y un 4xx, o una `http` que no se baja, es error: la app no agrega una URL rota ni puede mostrar una `http` desde Pages. Login: `auth.ts` (OAuth de escritorio con `loopback.ts`), `llavero.ts` (el refresh token en el Llavero con `security`), `google.ts` (Drive y Sheets con ese token) y `errores.ts`: los errores de login salen como `[código] texto`, con nueve códigos fijos que el skill traduce a un paso para el usuario. `conectar.ts` es `npm run mcp:conectar`. Tiene su propio `tsconfig.json` y sus tests son `tests/mcp-*.test.ts`. |
| Imágenes | `src/categorias/*.webp`, el catálogo de fotos de categoría, importado con `import.meta.glob`: el nombre del archivo es la clave. `imagenes.ts` muestra las imágenes de Drive —las fotos de las recetas y las propias de las categorías—: cada una se pide recién cuando aparece en pantalla, nunca antes, y queda en Cache Storage por id de archivo; también lee las fotos que el service worker dejó del menú Compartir. |

## Comandos

- `npm run dev` — Vite en `http://localhost:8080/recetario/`; `localhost:8080`
  es el origen autorizado en el cliente OAuth.
- `npx vitest run tests/<archivo>.test.ts` corre un solo archivo;
  `npm run test:watch` los deja corriendo.
- `npm test`, `npm run typecheck`, `npm run build` — las tres tienen que quedar
  en verde. **Vite borra los tipos, no los verifica:** sin `typecheck` un error
  de tipos se publica igual. El CI corre tests y typecheck antes de publicar.
- Publicar es pushear a `main`: `.github/workflows/pages.yml` despliega a Pages.
- `npm run mcp` levanta el MCP por stdio; lo lanza Claude Code o Claude Desktop,
  registrado con `npm --silent --prefix <repo> run mcp` (`mcp/LEEME.md`).
- `npm run mcp:conectar` abre el navegador para darle permiso al MCP y guarda
  el refresh token en el Llavero; reemplaza el que hubiera.

## Cómo se trabaja

- Las features grandes se trabajan con spec y plan en `docs/superpowers/`. Al
  cerrar el tema, lo decidido pasa a `product-design/` y el spec y el plan se
  borran.
- En esas features, el código no se commitea hasta que el usuario revisa el diff.
- Los cambios de UI se prueban en el teléfono sobre GitHub Pages: commitear y
  pushear a `main`.
- `BACKLOG.md` sólo tiene pendientes abiertos, con su estado. **Al empezar a
  trabajar una entrada se le pone `Implementando`**, para que otra sesión no la
  tome; la fila se borra recién cuando el trabajo está terminado y listo para
  que el usuario lo pruebe. Una entrada que quedó a medias vuelve a `Abierto`.
  Un estado más: `En espera` es lo que se decidió no tocar hasta que se
  resuelva otra entrada.
- **Un comentario no cita lo que se borra.** Ni el número de una entrada del
  backlog ni una sección de un spec de `docs/superpowers/`: las dos cosas
  desaparecen al terminar el trabajo y dejan el comentario apuntando a nada.
  Sí se cita `product-design/` —`C05.4b.1`, `R8`, `§6.17b`—, que se mantiene al
  día. Y el comentario dice **la razón vigente, no el incidente**: qué pasa si
  el código no está, no cuándo se rompió ni qué se vio en el teléfono.

## TypeScript

Todo `src/`, `mcp/` y `tests/` es TypeScript con `strict`, más
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y
`verbatimModuleSyntax`. No hay ningún `.js` y `allowJs` está apagado.

- **Tres configs.** `tsconfig.json` para `src`; `tsconfig.tests.json` extiende y
  apaga sólo `noUncheckedIndexedAccess`, que en una aserción de test es ruido;
  `mcp/tsconfig.json` extiende el de `src` e incluye `mcp/` y `src/`.
  `npm run typecheck` corre los tres.
- **Los tipos del dominio viven en `src/tipos.ts`** y separan dos fronteras: la
  del `.md`, donde una receta parseada siempre tiene todas sus claves y lo
  ausente llega como `null`; y la de Google, donde todo campo se declara
  opcional porque el servidor puede omitirlo.
- **Los dobles de test se declaran contra el tipo que el store consume**
  (`DriveDelStore`, `SheetsDelStore`) con `satisfies`: un doble que se aparte de
  la API real deja de compilar. Los helpers están en `tests/dobles.ts`,
  `tests/dom-falso.ts` (el DOM mínimo y el cliente de GIS) y
  `tests/aserciones.ts`.
- **Los tests corren en Node contra un DOM escrito a mano** (`tests/dom-falso.ts`),
  sin jsdom: `Element`, `HTMLElement` y compañía no existen como globales. En
  `src/` no va `instanceof` contra clases del navegador; el destino de un evento
  se estrecha con `conClosest` (`src/ui/pintar.ts`).
- **Las decisiones van en módulos puros y testeables** (`ui/gesto-menu.ts`,
  `ui/router.ts`, `catalogo.ts`); `main.ts` lee el DOM, las llama y cablea.

## Drive y Google Cloud

- **La carpeta base se encuentra por su marca** en `appProperties`
  (`recetario=raiz`), no por nombre. Si no hay ninguna, la app ofrece crearla en
  Mi unidad o elegir una que ya exista, y arma la estructura con las 16
  categorías predefinidas. Se cambia desde Ajustes. La app no hardcodea ningún id
  de Drive.
- **La app no explora el Drive:** no lista las carpetas del usuario en ninguna
  pantalla. Lo único de Drive que muestra son las carpetas marcadas —o las
  propias llamadas `Recetario`—; elegir otra es el **Google Picker**
  (`src/picker.ts`, tipos a mano en `src/gapi.d.ts`).
- **Las categorías son las subcarpetas.** El color y la foto de cada una son sus
  `appProperties` (`foto=catalogo:<clave>`, o `foto=drive:<id>` si es una propia
  subida a `_fotos/`); se gestionan desde *Ajustes → Recetario*. Una carpeta
  creada a mano en Drive aparece al reindexar; sin foto se dibuja con la trama
  sobre su color. Lo que empieza con `_` no es categoría.
- La carpeta del usuario es `Recetario/` (`1B2nNmy0qOAuZT9lomrSdompYta7uuJ7B`).
  `Carnes/milanesas-napolitanas.md` es un fixture escrito por fuera de la app y
  sirve de ejemplo canónico del formato.
- **Cliente OAuth:** tipo *Aplicación web*, sin client secret; el client ID está
  en `src/config.ts` y no es un secreto. Orígenes autorizados:
  `http://localhost:8080` y `https://alelarre.github.io`. APIs habilitadas:
  Drive, Sheets y Picker. La app está sin verificar, con tipo de usuario *Externo* y
  usuarios de prueba (hasta 100): la primera vez Google muestra «Google no
  verificó esta app». Un `Error 403: org_internal` es que el tipo quedó en
  *Interno*.
- **La API key del Picker** (`API_KEY` en `src/config.ts`) tampoco es un secreto:
  va restringida por referente a esos dos orígenes y a la Picker API. Vacía, la
  app sólo ofrece crear la carpeta.
- **El MCP tiene su propio cliente OAuth**, tipo *App de escritorio*, en el mismo
  proyecto y con el mismo scope `drive`. Su client ID y su client secret van en
  `~/.config/recetario/cliente.json`, fuera del repo: Google no considera
  secreto el de una app de escritorio, pero igual no se commitea. El permiso se
  da con loopback (un puerto local en `127.0.0.1`). **El refresh token vive sólo
  en el Llavero de macOS**, en el ítem `recetario-mcp`; nunca en un archivo. En
  modo *Prueba*, Google lo revoca a los 7 días y hay que correr
  `npm run mcp:conectar` de nuevo.

## No proponer

Cada una se midió o se discutió a fondo.

**Plataforma y datos**
- **`drive.file` como scope:** es por archivo; la app no vería los `.md` que
  escriben los agentes.
- **El índice en JSON, SQLite en Drive, journal de deltas o particiones:** Drive
  no tiene escritura parcial; con la planilla, editar una receta es una fila.
- **Comprimir el índice en tránsito:** Google exige un `User-Agent` con «gzip» y
  `fetch` no puede setearlo.
- **Funcionar sin conexión, o detectar lo que se escribe afuera** (Changes API).
- **Diagnosticar o reparar un índice dañado, o lógica de concurrencia para
  reindexar:** la salida siempre es borrar `_indice` o *Reindexar*, con una sola
  pestaña abierta.
- **AppSheet, Apps Script, apps nativas, un Artifact de Claude** como plataforma.
- **Cooklang** en el cuerpo de la receta, o **`schema.org/Recipe`** como modelo.
- **Claves nuevas en el frontmatter** (`ultima_vez`, `veces`, `puntaje`,
  porciones numéricas) y **datos nutricionales:** si la fuente los trae, se
  descartan.
- **Miniaturas, o una portada guardada aparte:** se dibuja la foto entera, y un
  `thumbnailLink` de Drive caduca. Las fotos sí van en Drive, en `_fotos/`.

**Producto y UI**
- **Un tema claro o `prefers-color-scheme`:** se cocina de noche; un solo tema
  oscuro.
- **Pestañas en la receta:** se lee de corrido, en una pila de fichas. El
  conmutador Ingredientes/Pasos existe sólo en el modo cocina.
- **Una vista de bandeja o triage.**
- **Ordenar el home por cantidad de recetas:** es alfabético, porque la posición
  de la categoría es lo que se aprende. Las listas de recetas sí ponen las
  favoritas primero y pueden ordenarse por duración.
- **Derivar el color de categoría de un hash del nombre, o identificarlas con
  abreviaturas:** la paleta está escrita a mano (`--cat-*` en `tokens.css`,
  reglas en design-system §2.3).
- **Las fotos de categoría en `public/`:** `sw.js` sirve caché-primero sólo
  `/assets/`.
- **Compartir con un link público al `.md` de Drive, o como imagen:** el link
  lleva la receta comprimida en el fragmento; WhatsApp recomprime las imágenes.
- **El PDF con `window.print()`, rasterizando HTML, o con jsPDF, PDFKit,
  pdf-lib, @react-pdf o typst; Roboto en el PDF** (no tiene ⅓ ni ⅔).
- **La vista de invitado como un modo de la receta:** tiene controlador propio y
  una lista cerrada de acciones, para que lo que se agregue a la receta no
  aparezca ahí sin querer.
- **Un explorador propio del Drive para elegir la carpeta base:** listar las
  carpetas del usuario dentro de la app no genera confianza. Se crea la carpeta,
  o se elige con el Picker de Google.

## Lo sabido y no arreglado

- **El token de Drive vive en `localStorage` de `alelarre.github.io`**, para no
  abrir el popup de Google en cada apertura. Ese origen lo comparten todos los
  proyectos de GitHub Pages de la cuenta: un script ajeno en otro de ellos
  podría leerlo durante su hora de vida. No publicar ahí nada con código de
  terceros; la salida de fondo es un dominio propio.
- **Un id que llega en un link a `#/r/<id>` puede ser cualquier archivo del
  Drive:** por eso `store.guardar` y `store.borrar` rechazan un archivo sin
  fila que no esté en la carpeta base, en `_sin-categoria/` o en una categoría.
- **La app y el MCP no escriben a la vez.** Los dos numeran las filas del
  índice por posición en la planilla y no hay bloqueo: si uno agrega o borra
  filas mientras el otro escribe con el índice que tenía, puede escribir en la
  fila equivocada. El skill pide cerrar la app antes de escribir y el `LEEME`
  lo repite. Si pasó, la salida es *Reindexar*.
- **Cada uno ve lo del otro al comparar la fecha de `_indice`.** La app, al
  abrirse; el MCP, antes de cada herramienta que usa el Drive. Si la fecha
  cambió, la copia no coincide y se relee la planilla, sin reindexar. Una app
  que quedó abierta no ve lo nuevo hasta recargar.
- **El conector de Google Drive de claude.ai no sirve para cargar recetas:** no
  escribe planillas ni reescribe el contenido de un archivo. Las recetas se
  cargan con el MCP. *Convertir con Agente* usa el conector sólo para que
  claude.ai lea las fotos del pedido.
- **Subir `SCHEMA_VERSION` cuesta un reindexado entero** al próximo arranque.
  Reindexar lee los `.md` de a seis a la vez (`TOPE_LECTURAS` en `store.ts`),
  pero con miles de recetas sigue siendo la operación más cara.
- **Dos reconstrucciones solapadas duplican las filas del índice** (dos pestañas
  abiertas, o *Reindexar* durante el arranque). Se arregla reindexando una vez.
- **Android toma el deslizamiento desde el borde como «atrás»:** por eso el
  gesto del menú lateral empieza a 24 px del borde.
- **Lo que ningún test cubre y se verifica en el teléfono:** el Share Target
  real (necesita la PWA instalada en Android), el foco del teclado en el
  editor que abre lo compartido, abrir claude.ai desde la PWA instalada al
  Convertir con Agente, la posición de scroll al conmutar en el modo cocina, el
  gesto de atrás de Android —en el editor con cambios sin guardar y cerrando
  el menú, el visor, las fichas y la categoría de *Agregar al plan*—, los
  gestos táctiles, la animación del velo y su tilde, y los espacios entre las
  filas de una pantalla.
