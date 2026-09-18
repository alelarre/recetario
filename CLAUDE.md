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
- **Cuatro tags especiales**, reservados y con forma propia: `favorito`,
  `menú diario`, `probar` e `incompleta` (la completitud de la receta). Van en
  la lista `tags` como cualquier otro.
- **El índice es una Google Sheet** (`_indice`, con las hojas de recetas, `meta`,
  `borradores` y `categorias`). Es un cache derivado: los `.md` y las carpetas
  son siempre la verdad, y *Ajustes → Reindexar* lo rehace entero. La fila se
  escribe en el momento, sin cola.
- **Copia local del índice, y sólo del índice** (`src/indice-local.ts`): vive en
  `localStorage`; al abrir se compara el `modifiedTime` de `_indice` y, si
  coincide, no se lee Sheets. Parte de que nunca hay escritura concurrente. No
  sirve para funcionar sin conexión.
- **Los borradores son `.md` aparte**, uno por archivo en `_borradores/`, con
  formato propio: título, fuente, capturado y la nota. Borrar manda a la papelera.
- **El plan de la semana es otro `.md`**, `_plan.md`, en la carpeta base y al
  lado de `_indice`: siete días sin fechas que arrancan en hoy, con dos comidas
  cada uno y una lista de recetas en cada comida. No está en el índice —se lo
  busca por nombre— y cada cambio lo reescribe entero. La lista de compras
  deriva del plan y no se guarda en ningún lado.
- **El input principal no es el editor**, son sesiones con agentes que reciben
  una fuente (PDF, foto, video, sitio web) y escriben el `.md`. El editor existe
  para corregir. Desde un borrador, «Convertir con Claude» arma el pedido y lo
  manda a Claude; la respuesta vuelve compartida o con «Pegar receta». **La app
  no llama a ningún modelo.**
- **Hay un solo camino de escritura: el store.** `store.crear` y
  `store.guardar` escriben el `.md` y su fila juntos; `convertirBorrador`
  (`src/compartido.ts`) suma descartar el borrador. El agente no corre este
  código: devuelve el `.md` y lo guarda la app.
- **La app no descubre lo que se escribe afuera:** un `.md` subido a Drive por
  fuera aparece al reindexar.

## Dónde está cada cosa

| Para saber | Leé |
|---|---|
| Qué tiene que hacer cada cosa | `product-design/product/specs/` — capacidades con criterios de aceptación y edge cases. Las reglas transversales están en `E05-Cimientos.md` §Reglas. |
| Pantallas, rutas, entidades y flujos | `product-design/ux/information-architecture.md` y `user-flows.md` |
| Cómo se ve | `product-design/ux/design-system.md`; lo que manda es `src/ui/tokens.css` |
| Cómo habla la app | `product-design/ux/brand-identity.md` §3 y §4 |
| Qué está pendiente | `BACKLOG.md` |
| El skill con el que un agente carga recetas | `skills/recetario/SKILL.md` — quedó en un esquema viejo, ver `BACKLOG.md` P14 |

`product-design/` es la especificación del producto y se mantiene al día: un
cambio de comportamiento o de diseño actualiza el documento que corresponde, en
el mismo trabajo. Los documentos dicen cómo es el producto hoy —sin historial,
sin fechas, sin alternativas descartadas—. Los mockups de `ux/mockups/` y los
wireframes son de cuando se diseñó y no se actualizan.

Nada del código depende de `product-design/`. **Todo el producto vive en `src/`:**

| | |
|---|---|
| Entrada | `inicio.ts` decide entre `main.ts` (la app, con login) e `invitado.ts` (la vista de una receta compartida, sin login). `main.ts` cablea rutas, acciones y pantallas. |
| Google | `auth.ts`, `drive.ts`, `sheets.ts`; los tipos de Google Identity Services están escritos a mano en `gis.d.ts` (el SDK se carga por `<script>`). `config.ts` tiene el client ID, el scope, los nombres fijos y `SCHEMA_VERSION`. |
| Dominio | `recipe.ts` (parsear y escribir el `.md`), `borrador.ts`, `plan.ts` (el `.md` del plan de la semana), `compras.ts` (la lista que sale del plan, y su texto), `catalogo.ts` (la fila del índice, tags reservados, búsqueda), `categorias.ts` (las 16 predefinidas: nombre, color, foto), `store.ts` (arranque, índice, reindexado), `indice-local.ts`, `compartido.ts`, `conversion.ts` (el pedido a Claude y lo que vuelve), `tipos.ts`. |
| Compartir | `compartir.ts` (menú Compartir del sistema y portapapeles, con sus respaldos), `link-receta.ts` (la receta comprimida en el fragmento del link), `texto-receta.ts`, `pdf/` (pdfmake con Inter embebida), `cocina-control.ts` (modo cocina y pantalla encendida, compartido entre receta e invitado). |
| UI | `src/ui/`: una pantalla por archivo, sobre `componentes.ts`, `iconos.ts`, `pintar.ts` y `fichas-receta.ts`; `router.ts` tiene las rutas. **`tokens.css` es el sistema del producto** —tokens y componentes— y se edita directamente; `base.css` es lo propio de cada pantalla. |
| Imágenes | `src/categorias/*.webp`, el catálogo de fotos de categoría, importado con `import.meta.glob`: el nombre del archivo es la clave. |

## Comandos

- `npm run dev` — Vite en `http://localhost:8080/recetario/`; `localhost:8080`
  es el origen autorizado en el cliente OAuth.
- `npx vitest run tests/<archivo>.test.ts` corre un solo archivo;
  `npm run test:watch` los deja corriendo.
- `npm test`, `npm run typecheck`, `npm run build` — las tres tienen que quedar
  en verde. **Vite borra los tipos, no los verifica:** sin `typecheck` un error
  de tipos se publica igual. El CI corre tests y typecheck antes de publicar.
- Publicar es pushear a `main`: `.github/workflows/pages.yml` despliega a Pages.

## Cómo se trabaja

- Las features grandes se trabajan con spec y plan en `docs/superpowers/`. Al
  cerrar el tema, lo decidido pasa a `product-design/` y el spec y el plan se
  borran.
- En esas features, el código no se commitea hasta que el usuario revisa el diff.
- Los cambios de UI se prueban en el teléfono sobre GitHub Pages: commitear y
  pushear a `main`.
- `BACKLOG.md` sólo tiene pendientes abiertos: lo resuelto se borra de la tabla.

## TypeScript

Todo `src/` y `tests/` es TypeScript con `strict`, más
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` y
`verbatimModuleSyntax`. No hay ningún `.js` y `allowJs` está apagado.

- **Dos configs.** `tsconfig.json` para `src`; `tsconfig.tests.json` extiende y
  apaga sólo `noUncheckedIndexedAccess`, que en una aserción de test es ruido.
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
  (`recetario=raiz`), no por nombre. Si no hay ninguna, la app ofrece elegirla o
  crearla y arma la estructura con las 16 categorías predefinidas. Se cambia
  desde Ajustes. La app no hardcodea ningún id de Drive.
- **Las categorías son las subcarpetas.** El color y la foto de cada una son sus
  `appProperties` (`foto=catalogo:<clave>`); se gestionan desde *Ajustes →
  Recetario*. Una carpeta creada a mano en Drive aparece al reindexar; sin foto
  se dibuja con la trama sobre su color. Lo que empieza con `_` no es categoría.
- La carpeta del usuario es `Recetario/` (`1B2nNmy0qOAuZT9lomrSdompYta7uuJ7B`).
  `Carnes/milanesas-napolitanas.md` es un fixture escrito por fuera de la app y
  sirve de ejemplo canónico del formato.
- **Cliente OAuth:** tipo *Aplicación web*, sin API key ni client secret; el
  client ID está en `src/config.ts` y no es un secreto. Orígenes autorizados:
  `http://localhost:8080` y `https://alelarre.github.io`. APIs habilitadas:
  Drive y Sheets. La app está sin verificar, con tipo de usuario *Externo* y
  usuarios de prueba (hasta 100): la primera vez Google muestra «Google no
  verificó esta app». Un `Error 403: org_internal` es que el tipo quedó en
  *Interno*.

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
- **Fotos de receta guardadas en Drive, miniaturas o portadas:** sólo URLs
  externas.
- **Los borradores como receta incompleta o en una planilla propia.**

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
- **El Google Picker** para elegir carpeta: pide API key, se ve con el estilo
  claro de Google y no crea carpetas.

## Lo sabido y no arreglado

- **El conector de Google Drive de claude.ai es limitado:** crea, lee, mueve y
  renombra archivos, pero no escribe planillas ni reescribe el contenido de un
  archivo existente.
- **Subir `SCHEMA_VERSION` cuesta un reindexado entero** al próximo arranque, y
  reindexar lee los `.md` de a uno: ~40 segundos con ~60 recetas.
- **Dos reconstrucciones solapadas duplican las filas del índice** (dos pestañas
  abiertas, o *Reindexar* durante el arranque). Se arregla reindexando una vez.
- **Android toma el deslizamiento desde el borde como «atrás»:** por eso el
  gesto del menú lateral empieza a 24 px del borde.
- **Lo que ningún test cubre y se verifica en el teléfono:** el Share Target
  real (necesita la PWA instalada en Android), el foco del teclado en la
  captura, la posición de scroll al conmutar en el modo cocina, el gesto de
  atrás de Android en el editor con cambios sin guardar, y los gestos táctiles.
