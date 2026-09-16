# Backlog

**Versión:** 1.3
**Fecha:** 2026-09-16
**Estado:** Vivo — el §6 se edita a medida que los pendientes se resuelven

---

## Sobre este documento

Lo que quedó **explícitamente afuera** del diseño, con descripción suficiente para
retomarlo sin releer el proyecto entero. Nada de esto es un olvido: cada línea se
decidió dejar afuera y dice por qué.

Lo que quedó afuera del **producto** —y no del scope— está en la tabla de
`plan/decision-log.md`, que es otra cosa: ahí van las alternativas descartadas.

**El §6 es distinto de los cinco anteriores:** no salió del proyecto de diseño
sino de usar la app terminada. Son cosas para hacer, no cosas descartadas.

---

## 1. Decisiones abiertas

| Qué | Estado | Por qué no se resolvió |
|---|---|---|
| **Que el agente se embeba en la PWA** | Abierta desde el Hito 2. Es la decisión más grande sin resolver del proyecto. **Pasó a trabajo pendiente como P28** `[2026-09-14]`. | El posicionamiento cierra sin ella: el agente está afuera de la app, no afuera del producto. Si algún día se embebe, el lugar exacto donde aparecería el botón ya está identificado —la pantalla de Borrador— y no cambia nada más. |
| **Una vía de hosting para las fotos de receta** | Abierta desde el Hito 5. | El campo `foto` existe y acepta una URL externa. Una vía propia sin backend obliga a pedir la imagen con el token y armar un object URL. No bloquea nada: el diseño no depende de la foto, y hoy ninguna de las ~60 recetas del Drive tiene una. |

## 2. Funcionalidad que no entró

| Qué | Por qué quedó afuera | Si alguna vez entra |
|---|---|---|
| **El planificador y la lista de compras (E06)** | J9 es el único job hipotético del proyecto, y el único que **cambiaría** la conducta en vez de acompañarla. El mercado tampoco ayuda: los cuatro competidores lo tienen. | Está diseñada y mockupeada. Su entrada vive en el Recetario, debajo de las categorías, y sacarla cuesta borrar un bloque y dos pantallas. |
| **Sugerencias para J5** — *"hace mucho que no hacés esto"* | La novedad se resuelve mostrando, no registrando. Y registrar obliga a guardar historial de uso, que el esquema no tiene. | Va **entre** la búsqueda y las categorías, nunca arriba. |
| **Un control de filtro visible sobre las listas** | Quedó a decidir "al ver la pantalla llena". Se vio en el Hito 9 y no hizo falta: los tags se aplican desde la receta. | — |
| **Ordenar dentro de una categoría** | Mismo caso. Con veinte recetas el alfabético alcanza; con cientos habría que volver a mirarlo. | — |
| **Que la app sugiera tags** | Quedó abierto en `ux/information-architecture.md` (Hito 6). Con sesenta recetas el desorden de tags no molesta. | Recién si con mil recetas molesta. |
| **Historial de cocina, escalado de porciones, timers** | Ningún job los pide. | — |
| **Modo offline** | Decisión, no carencia: sin Drive no hay app, y una copia local es una segunda fuente de verdad. | — |
| **iOS** | Salió del alcance en el Hito 7. No tiene Share Target, y un equivalente declarado sin diseñar es una deuda que nadie implementa. | Sería un Atajo, con la misma pantalla de captura. |

## 3. Deuda técnica heredada

| Qué | Por qué importa |
|---|---|
| **Reindexar lee los `.md` de a uno**, sin paralelismo ni loteo | Con las sesenta recetas actuales no se nota. Con las mil del target, el reindexado tarda minutos — y por eso tiene barra de progreso y no se puede cancelar. Loteando o paralelizando, el problema se achica. |
| **La app no detecta sola un índice corrupto de todas las formas posibles** | Detecta que no puede leerlo y ofrece reindexar, que es la salida universal. Lo que no hace es diagnosticar el tipo de daño, y es deliberado. |

## 4. Lo que quedó sin evidencia

El **Hito 10 —Usability Testing— se salteó**, así que estas tres cosas están
decididas por razonamiento y no por observación. Son las primeras candidatas a
revisar cuando la app se use de verdad.

| Qué | Cómo se sabría |
|---|---|
| **La escala del modo cocina a 50 cm reales** | Cocinando una receta que no te sepas de memoria, con el teléfono apoyado. Si el cuerpo de 22 px no alcanza, sube; el sistema ya tiene el lugar donde cambiarlo. |
| **La densidad de la lista con cientos de recetas** | La categoría más grande del Drive hoy tiene veinte. A cientos puede hacer falta ordenar, o el filtro visible que quedó en §2. |
| **Si el vocabulario se entiende sin haberlo escrito uno mismo** | *Borrador*, *reindexar*, *está completa así como está*. Se prueba en diez minutos con cualquiera, sentado y sin cocinar nada. |

## 5. Documentos que quedaron viejos

| Documento | Qué le pasa |
|---|---|
| `product/strategy/personas.md` y `jtbd.md` | Del Hito 2. Mencionan "bandeja" y el Atajo de iOS, que el vocabulario y el alcance cambiaron después. **Se dejaron como estaban a propósito:** describen conducta observada, no decisiones vigentes. |
| `../docs/superpowers/plans/2026-09-01-recetario-v1.md` | Ya estaba viejo antes de este proyecto: describe la funcionalidad de fotos que después se eliminó. |

---

## 6. Pendientes de uso real

`[abierto el 2026-09-12]` Salieron de usar la app publicada contra el Drive real.
A diferencia de los §1 a §5, **esto es trabajo pendiente**, no alcance
descartado. El identificador de cada uno es estable: sirve para nombrarlo sin
repetir el enunciado.

### 6.1 Comportamiento

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P1** | **El borrador se borra recién cuando la receta ya existe en Drive** | **Resuelto** `[2026-09-12]`. El código ya lo hacía: *Crear la receta* sólo abre el editor con `?borrador=<id>`, y el único que borra es `convertirBorrador`, invocado desde *Guardar* después de escribir el `.md` y su fila. Volver, cancelar o el gesto de atrás no borran nada. Quedó fijado en `tests/main-rutas.test.ts`. De paso se arregló que reintentar Guardar después de un fallo al borrar el borrador creaba un segundo `.md`: `main.ts` rearmaba las dependencias en cada intento y perdía `convertidos`. Queda sabido un caso más raro: si falla la fila después de crear el `.md`, el reintento también lo duplica, y el duplicado se ve en Drive. |
| **P7** | **Editar receta: avisar de cambios sin guardar** | **Resuelto** `[2026-09-12]`. Al dibujar el editor —editar o nueva— se guarda una foto del formulario, incluidos los campos ocultos de tags y completitud; salir con el formulario distinto pregunta *«¿Salir sin guardar los cambios?»* arriba del formulario, sin redibujarlo. No se compara contra el `.md` de Drive. El volver del encabezado y el gesto de atrás pasan por el mismo chequeo en `render()`: como el `hashchange` no se cancela, se vuelve a poner la URL del editor con `pushState` y no se dibuja la pantalla nueva. Cerrar la pestaña o recargar no pregunta: `beforeunload` sólo da el cartel del navegador, y Android lo ignora seguido. |
| **P8** | **Modo cocina: el paso 1 arranca seleccionado** | **Resuelto** `[2026-09-12]`. El paso actual arranca en el primero, al entrar y al volver a entrar. Tocar el paso 1 de entrada lo da por hecho, como a cualquier paso realzado. C03.2.4 quedó escrito así. |
| **P9** | **Modo cocina: que el texto del paso no se pueda seleccionar** | **Resuelto** `[2026-09-12]`. `user-select: none` en `.coc .pasos li` (`src/ui/base.css`). Sólo los pasos del modo cocina: sus ingredientes, la receta abierta y el editor siguen seleccionables. Falta verlo en el teléfono. |
| **P14** | **Rehacer el skill del agente** | `[2026-09-14]` **La tarea es rehacer `skills/recetario/`**, no sumarle una sección: lo de abajo es el problema que lo originó y lo que se midió del conector, que el skill nuevo tiene que tomar como punto de partida. `[2026-09-12]` Hoy `skills/recetario/SKILL.md` sube el `.md` y termina, y como la app no descubre lo que se escribe afuera (R4), **una receta cargada por el agente no aparece hasta reindexar**. El skill ya lo dice y le pide al agente que avise. C05.4.3 pide otra cosa: que el agente escriba con **la misma función** que la app —`src/compartido.ts`—, no con una copia de la regla. La pregunta abierta es cómo: el agente corre en sesiones de Claude con acceso a Drive y Sheets, y `compartido.ts` es TypeScript que hoy sólo corre en el navegador. Entra también **convertir un borrador en receta** desde el agente, que es la otra operación que C05.4.3 le asigna. **Bloqueado** `[2026-09-12]`: el conector de Google Drive de claude.ai crea, lee, mueve y renombra archivos, pero no escribe planillas ni reescribe el contenido de un archivo existente. Con ese conector el agente no puede escribir la fila, ni correr `compartido.ts`. |
| **P12** | **Revisar cómo se sabe si el índice está al día** | Estado de partida: **no hay copia local** (C05.4.2) —ni IndexedDB ni nada del navegador—, el índice se lee entero de Sheets en cada arranque, y la Changes API se eliminó en el rediseño, así que la app **no descubre lo que se escribe afuera** (R4). Lo que hay es `SCHEMA_VERSION` en la meta, que fuerza reindexar cuando cambia. Primero entender qué está pasando de verdad y recién después decidir si algo cambia. **Resuelto** `[2026-09-13]`: con la premisa nueva de que nunca hay escritura concurrente, hay **una copia local del índice verificada por la metadata de `_indice`** —al abrir, si la fecha coincide, no se lee Sheets— y cada escritura la actualiza. Spec en `docs/superpowers/specs/2026-09-13-indice-local-design.md`, plan en `docs/superpowers/plans/2026-09-13-indice-local.md`. La app sigue sin ver lo que se escribe afuera en los `.md` (P14). Queda medir en el teléfono cuánto tarda Drive en actualizar la fecha después de escribir. |
| **P15** | **Definir cómo se agrega una categoría o se modifica una existente** | **Cerrado** `[2026-09-14]`: lo resolvió P19 desde la app, no con un skill. Crear, renombrar, cambiar color y foto y borrar se hace desde *Ajustes → Recetario* (etapa 3a), y el color y la foto son propiedades de la carpeta, así que renombrar ya no rompe nada. Las imágenes propias siguen en la etapa 3b de P19. `[2026-09-12]` Hoy «agregar una categoría es crear una carpeta en Drive» —`SETUP.md` dice que no toca el código—, pero para que se vea bien hay que tocar más cosas, y nada lo junta: la carpeta en `Recetario/` (crear o renombrar), el color en `src/ui/tokens.css` (`--cat-*`) y en el mapa de `src/ui/categorias.ts` —la clave es el slug de la carpeta, así que **renombrar rompe el color y la foto**—, la foto `src/categorias/<slug>.webp`, la tabla de `design-system.md` §2.3 con sus reglas de separación (18° entre categorías, distancia percibida de 12 con el acento), los ids de `SETUP.md`, y reindexar si cambió un nombre, porque la fila del índice guarda la categoría. Probablemente sea un **skill prearmado** que haga los cambios del código y los de Drive, o liste los de Drive que no pueda hacer. El conector de Drive de claude.ai sí puede crear una carpeta y renombrarla. |
| **P16** | **Modo cocina: los controles del encabezado miden menos que los 64 px de §1** | **Resuelto** `[2026-09-12]`. El encabezado de cocina pasa de 56 a 64 px de alto, y el volver, el sol y *Salir* tocan en 64 × 64 (*Salir*, 68 × 64). El sol y *Salir* se siguen dibujando como cajas de 40 con reborde: la caja es un pseudo-elemento adentro del área táctil. El costo es ancho para el título: en 400 px quedan 186 y un título largo se corta. |
| **P17** | **La planilla de borradores se lee entera en cada dibujo** | **Resuelto** `[2026-09-13]`. Mismo criterio que la receta abierta: la planilla se lee una vez y la copia la reutilizan los redibujados —abrir y cerrar el menú, *Descartar*, *Cancelar*, *Editar*— y el ir y venir entre Borradores, un borrador y crear la receta desde él. Salir a otra pantalla la descarta, y agregar, editar, descartar o convertir la invalidan. Editar y descartar siguen leyendo la planilla antes de escribir, para encontrar la fila: las filas se corren. |
| **P18** | **Una pantalla de arranque que muestre la comparación del índice** | **Resuelto** `[2026-09-13]`, con otra forma: el detalle vive **sólo en Ajustes**, en una ficha «Al abrir» —cuándo abrió, la fecha de `_indice`, cómo estaba la copia local y qué se hizo, cuántas recetas, borradores y categorías hay, y si reindexó y por qué—, para no sumar nada al camino diario. La pantalla de carga suma el spinner debajo de «Conectando…». El informe lo arma `store.arrancar()` y dura la sesión. |
| **P19** | **Que la carpeta de Drive y las categorías las defina el usuario** | `[2026-09-13]` Hoy la app busca la carpeta raíz por el nombre fijo `Recetario`, y la planilla y la cola por los nombres fijos `_indice` y `_borradores` (`src/config.ts`); no hardcodea ids. Las categorías son las subcarpetas, pero su color y su foto están atados al slug en el código (`src/ui/categorias.ts`, `tokens.css`, `src/categorias/`). La tarea: definir cómo sacar esas referencias fijas, dejar que el usuario elija su propia carpeta, y que pueda agregar y quitar categorías desde la app. Se superpone con P15, que resuelve lo mismo con un skill en vez de con la app: decidir juntas. **La pregunta que lo ordena** `[2026-09-13]`: qué pasa si otra persona usa la app con sus propias recetas. **Decidido en conversación** `[2026-09-13]`, para cuando se retome: (1) el permiso sigue siendo `drive` —Drive no tiene uno acotado a una carpeta— y la app no se verifica por ahora: se comparte con conocidos como usuarios de prueba, hasta 100; (2) el flujo es explicar el login → buscar la carpeta base marcada con `appProperties` (y `'me' in owners`) → si no hay, elegirla y hacer el setup inicial; (3) la verdad de cada categoría es su carpeta, con `appProperties`: el color de la paleta —si se complica, un color genérico— y la foto como id de un archivo en Drive; (4) `_indice` suma una hoja `categorias` derivada de las carpetas, que entra en la copia local y, igual que las recetas, sólo se lee de Drive en el setup, al reindexar y cuando la copia local falta o no sirve: el arranque diario queda en un pedido, la fecha de `_indice`, y una carpeta creada a mano aparece al reindexar; (5) la imagen se pide con el token una sola vez y se guarda en Cache Storage por id de archivo; reindexar vacía ese cache; (6) cómo distribuir el skill del agente a otros usuarios, más adelante; (7) las 16 fotos actuales quedan como catálogo de arranque de imágenes, al que se van a sumar otras. **Etapa 1 hecha** `[2026-09-13]`: color y foto como `appProperties`, predefinidas en `src/categorias.ts`, hoja `categorias` en la copia local, apertura de un pedido (spec `docs/superpowers/specs/2026-09-13-categorias-en-el-indice-design.md`). **Decidido para la etapa 2:** la estructura inicial se crea con las 16 predefinidas, con sus nombres y fotos; sólo a partir de ellas el usuario agrega o borra categorías en la etapa 3. **Etapa 2 hecha** `[2026-09-13]`: carpeta base marcada, selector dentro de la app, setup con las 16 predefinidas y *Cambiar carpeta* en Ajustes (spec `docs/superpowers/specs/2026-09-13-carpeta-base-design.md`). **Etapa 3a hecha** `[2026-09-13]`: gestión de categorías desde *Ajustes → Recetario* (spec `docs/superpowers/specs/2026-09-13-gestion-de-categorias-design.md`). Queda la 3b: imágenes propias en Drive. |
| **P20** | **Un indicador visible de la versión de la app** | **Resuelto** `[2026-09-13]`. Al pie del menú lateral, en micro y tenue: el commit corto y cuándo se compiló, en la hora del teléfono (`07dcd8c · 13/09 14:13`). Lo inyecta Vite con `define` —`GITHUB_SHA` en el CI, `git rev-parse` en local— y vive en `src/version.ts`. Semver no: `package.json` no se sube, y lo que dice si el teléfono tomó el último deploy es el commit. |
| **P21** | **Los borradores con copia local, como el índice** | **Reemplazado** `[2026-09-13]`: los borradores pasaron a ser un `.md` por borrador en `Recetario/_borradores/`, con su hoja `borradores` en `_indice`, que entra en la copia local. Spec en `docs/superpowers/specs/2026-09-13-borradores-md-design.md`, plan en `docs/superpowers/plans/2026-09-13-borradores-md.md`. |
| **P22** | **El skill del agente escribe borradores** | **Resuelto** `[2026-09-13]`. `skills/recetario/SKILL.md` suma «Capturar un borrador»: cuándo es un borrador y no una receta, el `.md` de tres claves en `Recetario/_borradores/`, validar antes de subir y avisar que aparece al reindexar. Convertir, editar y descartar siguen siendo de la app. |
| **P23** | **Compartir recetas** | **Resuelto** `[2026-09-14]`. Desde un ícono en el encabezado de la receta: **PDF** (pdfmake con Inter embebida, 105 × 180 mm, tema oscuro), **Link** a una vista de invitado sin login —la receta viaja comprimida en el fragmento, sin tags, y se puede leer y cocinar— y **Texto** para cualquier app, con la negrita y la itálica de WhatsApp. Es una copia del momento: nada queda publicado en Drive. Spec en `docs/superpowers/specs/2026-09-14-compartir-recetas-design.md`, plan en `docs/superpowers/plans/2026-09-14-compartir-recetas.md`. Queda afuera *Guardar en mi Recetario* desde el link. |
| **P24** | **Borrar los datos locales desde Ajustes** | **Resuelto** `[2026-09-13]`. Ajustes suma la ficha «En este navegador» con *Borrar datos locales*: borra la copia del índice y recarga la app —lo que hay en memoria salió de esa copia, y la próxima escritura la volvería a guardar—, sin cerrar la sesión de Google. Cuando exista el cache de imágenes de categorías (P19), lo borra también. Mientras reindexa no se ofrece. |
| **P25** | **Reordenar y renombrar las fichas de Ajustes** | **Resuelto** `[2026-09-13]`. El orden es: 1. **Cuenta**; 2. **Recetario** —la carpeta y las categorías, etapa 3a de P19—; 3. **Índice**; 4. **Archivos locales** —antes «En este navegador» (P24)—; 5. **Avisos**; 6. **Registro de actividad** —antes «Al abrir» (P18)—. |
| **P26** | **Rediseñar el selector de carpetas** | `[2026-09-14]` El selector de la etapa 2 de P19 (`src/ui/carpeta.ts`, `#/carpeta`) no convence. Hoy es una lista de carpetas propias por nivel —tocar entra, el chevron vuelve—, con «Encontradas» arriba, «Usar esta carpeta» (no en Mi unidad), «Crear una carpeta nueva acá» y una confirmación antes del setup. Una alternativa ya evaluada es el Google Picker para el paso de elegir: navegación y búsqueda de Drive, pero pide API key, se ve con el estilo claro de Google y no crea carpetas. **Primero entender qué no convence y presentar propuestas.** |
| **P27** | **Darle entidad a favoritos y a otros tags especiales** | **Resuelto** `[2026-09-16]`. Tres tags reservados con forma propia, los tres en la lista `tags` del `.md` que ya existía —ni clave nueva en el frontmatter ni columna nueva en el índice—: `favorito` gana una **estrella** en el encabezado de la receta que lo pone y lo saca, y la marca en la esquina de la tarjeta; `probar` y `menú diario` (nuevo) ganan **ícono propio**, puestos desde el editor como cualquier tag. Un **carrusel** de tags en el Recetario y en cada categoría —los especiales primero, después por cantidad— filtra ahí mismo o, desde el Recetario, abre una **lista por tag** nueva (`#/t/<tag>`). Las listas ordenan las favoritas primero, alfabético dentro de cada bloque. Spec en `docs/superpowers/specs/2026-09-16-tags-especiales-design.md`, plan en `docs/superpowers/plans/2026-09-16-tags-especiales.md`. Queda afuera marcar favorito desde la lista y una pantalla de Favoritos en el menú lateral: se llega por el carrusel. `[2026-09-14]` Hoy «favorito» y «probar» están reservados como tags (`TAGS_RESERVADOS` en `src/catalogo.ts`, junto con las variantes de «incompleto» y «terminado») y no se pueden escribir: la regla dice que lo van a decir «algo que todavía no existe». La tarea es definir ese algo: qué estados especiales tiene una receta —favorita, para probar, y los que hagan falta—, cómo se marcan y se filtran en la app, y dónde se guardan. Choca con una decisión cerrada: el frontmatter tiene ocho claves y ningún campo nuevo (`CLAUDE.md`, «Campos `ultima_vez`, `veces`, `puntaje`…»); guardarlo en el `.md` la reabre, y guardarlo fuera del `.md` lo saca de la fuente de verdad. |
| **P28** | **Un agente embebido en la app que convierta un borrador en receta** | `[2026-09-14]` Pasa a trabajo pendiente lo que el §1 tenía como decisión abierta desde el Hito 2 («Que el agente se embeba en la PWA»). El lugar del botón ya está identificado: la pantalla de Borrador. Hoy convertir es abrir el editor con `?borrador=<id>` y completar a mano; la tarea es que un agente lea la fuente del borrador y escriba la receta, con `convertirBorrador` de `src/compartido.ts` como único camino de escritura (C05.4.3). Sin definir: qué modelo y cómo se llama sin backend —la app es estática y una API key no puede vivir en el navegador—, qué fuentes puede leer desde el teléfono, y qué ve el usuario antes de guardar. Se cruza con P14. |
| **P29** | **La duración, como campo estructurado** | `[2026-09-15]` Hoy `tiempo` es texto libre en el frontmatter —`40 min`, `1 h 15`, `3 h`— y el skill pide que sea «corto y parejo», nada más. Estructurarlo —minutos como número, con el texto original si hace falta— habilita filtrar por duración (la idea de «rápida» sin que sea un estado; P27), ordenar por tiempo y mostrarlo parejo. Hay que definir: cómo se parsea lo que ya está escrito, qué pasa con lo que no matchea —hoy `dificultad` resuelve eso cayendo en «sin definir»—, si cambia la fila del índice (subir `SCHEMA_VERSION`) y qué escribe el agente. Toca `recipe.ts`, `catalogo.ts`, el editor, el skill y las ~60 recetas ya cargadas. |

### 6.2 Diseño visual

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P2** | **El acento parece un error** | **Resuelto** `[2026-09-12]`. `--acento` pasa a arcilla `#D98A5F` (y `--acento-suave` a `#39291D`): queda a 14.6 de distancia percibida del error, contra 8.1 de la terracota. Se eligió entre cinco candidatos dibujados con el CSS de la app. La regla de §2.3 pasó de «20° de matiz respecto del acento» a «distancia percibida de al menos 12», porque la arcilla queda a 15° de Carnes pero se distingue por saturación. Decisión en `decision-log.md`. |
| **P3** | **El chevron de los desplegables queda pegado al margen derecho** | **Resuelto** `[2026-09-12]`. El `select` del navegador ignoraba el padding. Ahora `.campo select` (`src/ui/base.css`) dibuja su propio chevron, con el trazo de los íconos, a 16 px del borde, y reserva el lugar para que un texto largo no se le monte encima. |
| **P4** | **«Borrar receta» lleva el tacho** | **Resuelto** `[2026-09-12]`. El ícono de trazo `ICO.tacho`, no el emoji: toma el color del botón y se dibuja igual en todos los teléfonos. Lo llevan las dos acciones destructivas de la app, *Borrar receta* en el editor y *Descartar* en el borrador. |
| **P5** | **El editor: la completitud adentro de la ficha, el borrar afuera** | **Resuelto** `[2026-09-12]`. El conmutador, rotulado *Estado*, cierra la ficha de datos después de la foto, separado por un divisor. *Borrar receta* va suelto al pie, a lo ancho, como *Descartar* en el borrador; su confirmación sigue siendo una ficha con borde de error. C04.4.1 y C04.6.1 quedaron escritos así. |
| **P6** | **El editor: encabezado fijo** | **Resuelto** `[2026-09-12]`. El editor pasa `pegajoso: true` a `encabezado()`, lo mismo que la receta abierta: volver y *Guardar* quedan arriba al hacer scroll, en *Editando* y en *Nueva receta*. Anotado en C04.1.1. |
| **P10** | **Modo cocina: «Mantener pantalla encendida» pasa a ícono** | **Resuelto** `[2026-09-12]`. El sol va en el encabezado, a la izquierda de *Salir*, con `aria-label` y `aria-pressed`. Encendido se invierte —fondo `--fg`, sol oscuro—, la convención del estado elegido. La barra del pie desapareció, y con ella unos 100 px que ahora son de los pasos. C03.3.1 quedó escrito así. |
| **P13** | **Modo cocina: un ícono para «Ingredientes» y «Pasos»** | **Resuelto** `[2026-09-12]`. Se compararon cinco pares —tres de trazo y dos de emoji— sobre el conmutador real. Quedó una zanahoria para *Ingredientes* y una lista numerada para *Pasos*, de trazo (Lucide), a 24 px y al lado de la palabra. `design-system.md` §3.4 pasó de ocho íconos a diez. |

### 6.3 Investigación primero

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P11** | **La jerarquía tipográfica, pantalla por pantalla y entre pantallas** | **Un informe antes de tocar nada.** Primero un research de fuentes externas para fijar los criterios —el usuario propuso [uxplanet: *What is typographic hierarchy*](https://uxplanet.org/what-is-typographic-hierarchy-definition-examples-26f6225f6bad) como punto de partida—, después la auditoría de las once pantallas contra la escala de `design-system.md` §3.2 y §3.3, y recién después la propuesta de cambios. **Informe escrito** `[2026-09-12]`: `ux/auditoria-tipografica.md`, con los criterios de las fuentes, las once pantallas medidas en el navegador y catorce propuestas (T1 a T14). Aplicadas T1 a T13 `[2026-09-12]`; T14 pasó a P16. |

### 6.4 Estado del contenido y del entorno

Esto no se arregla escribiendo código. **Cerrada** `[2026-09-13]`: lo que quedaba es contenido o verificación a mano.

| Qué | Situación |
|---|---|
| **El índice tiene cada receta dos veces** | **Cerrado** `[2026-09-13]`: no es trabajo de código; la salida es reindexar una vez, con una sola pestaña abierta. 122 filas para 61 recetas, visto el 2026-09-12. La causa probable son dos reconstrucciones solapadas —dos pestañas de la app abiertas, o *Reindexar* tocado mientras el arranque ya estaba reconstruyendo—: `reconstruir()` lee las filas previas, las borra y appendea las nuevas, sin nada que impida que dos pasadas se pisen. **Se decidió no agregar lógica de concurrencia** (2026-09-12): la salida es reindexar una vez, con una sola pestaña abierta. |
| **Las 61 recetas del Drive se leen como incompletas** | **Cerrado** `[2026-09-13]`: es contenido, no código. Ninguna trae la clave `completa` todavía, y sin ella la receta se lee como no terminada (C05.3.1). El usuario edita esos `.md` a mano. |
| **Cuatro cosas que ningún test alcanza** | **Cerrado** `[2026-09-13]` como pendiente de código: queda como verificación a mano en el teléfono, y `CLAUDE.md` la lista. El Share Target real —necesita la PWA instalada en Android—, el foco del teclado en la captura, la posición del scroll al conmutar en modo cocina, y el gesto de atrás de Android en el editor con cambios (P7): los tests cubren la lógica con un historial falso, no el gesto. |
| **Las acciones del workflow de Pages usan Node 20** | **Resuelto** `[2026-09-13]`. `checkout` y `setup-node` a v7, `configure-pages` a v6, `upload-pages-artifact` y `deploy-pages` a v5: todas corren sobre Node 24. El build también pasa de Node 20 a 24. |

### 6.5 Deuda chica del código

| Qué | Situación |
|---|---|
| **`src/ui/tokens.css` ya no es copia literal de los mockups** | **Resuelto** `[2026-09-12]`. Se terminó la convención: `src/ui/tokens.css` es el sistema del producto y se edita directamente. Los overrides que pisaban reglas del sistema desde `base.css` —interlínea del `body`, título de sección, ingredientes, chip, marca de incompleta, chevron del `select`, notas, encabezado y columna— se movieron a su regla en `tokens.css`. Se verificó midiendo el estilo computado de 1404 elementos en 18 vistas y dos anchos, antes y después: sin diferencias. Los mockups quedaron como la especificación de cuando se diseñaron, y lo dicen su `tokens.css` y su README. |
| **`.inc-txt` quedó sin uso** | **Resuelto** `[2026-09-12]`. Borrado de `src/ui/tokens.css`, que ya se puede tocar. |
