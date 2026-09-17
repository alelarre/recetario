# E05 — Cimientos

**Versión:** 4.0 · **Fecha:** 2026-09-17 · **Estado:** Vigente
**Job:** J8 y transversal · **Prioridad:** alta · **Flujos:** F8, F9, F10, F11, F12

---

## La épica

El piso sobre el que se apoyan todas las demás: el esquema del `.md`, la relación
con Drive, el índice como contrato con el agente, y qué hace la app cuando algo
no está como esperaba.

No es infraestructura invisible. **La mitad de esta épica es comportamiento
visible**, porque el stack hace inevitables los estados degradados: la app
depende de la red, de un índice derivado y de archivos que escriben otros.

---

## Reglas transversales

Valen para todas las épicas. Una feature que no diga lo contrario, cumple esto.

### R1 — El manejo de errores es mínimo

Toda operación que puede fallar falla de una sola manera: **un aviso en
castellano, en el lugar donde ocurrió, y un control para reintentar**. No hay
colas de reintento, ni reintento automático, ni recuperación en segundo plano, ni
reconciliación de estados a medias.

- [ ] Ningún error muestra el mensaje crudo de Google.
- [ ] Ningún aviso de error se cierra solo.
- [ ] Lo que el usuario escribió sigue en pantalla después del error.

### R2 — El reintento reescribe todo, porque escribir es idempotente

Guardar una receta son dos escrituras: el `.md` y su fila del índice. Si falla la
segunda, **no se intenta reparar solo esa**: el reintento repite las dos.
Reescribir un `.md` con el mismo contenido y reemplazar una fila existente no
duplican nada.

- [ ] Reintentar un guardado que falló a mitad deja exactamente una fila para esa receta.

### R3 — La sesión vencida se trata como cualquier otro error

Si el token expiró, el aviso dice que hay que conectarse de nuevo y ofrece el
control. Al reconectar, el usuario reintenta la operación **a mano**: la app no
reanuda nada por su cuenta.

- [ ] Lo escrito en el editor o en la captura sobrevive a la reautenticación.

### R4 — El `.md` gana, y la app no lo verifica

Cuando el índice y el `.md` difieren, la verdad es el `.md`. **La app no
compara, no valida y no autorrepara.** No hay escritura correctiva al abrir una
receta ni al listar. La divergencia se corrige reconstruyendo el índice a mano
desde Ajustes.

- [ ] Abrir una receta cuyo `.md` difiere de su fila no escribe nada.

### R5 — Una receta se identifica por su `fileId` de Drive

La clave de la fila del índice es el `fileId`. Mover el archivo entre carpetas
—cambiar la categoría— y editar el título **no cambian la identidad de la
receta**. El nombre del archivo nunca se deriva del título ni se renombra al
editarlo.

- [ ] Cambiar la categoría de una receta actualiza su fila, no crea una nueva.
- [ ] Cambiar el título deja el archivo con el mismo nombre en Drive.

### R6 — La app no descubre cambios de afuera

Un `.md` o una fila que escribe un agente mientras la app está abierta **no
disparan nada**. No hay polling, ni Changes API, ni refresco al volver del
segundo plano. El cambio se ve la próxima vez que la app abre y lee el índice:
al abrir, la fecha de `_indice` en Drive dice si la copia local sigue valiendo
(C05.4.2). Un `.md` escrito afuera sin su fila aparece recién al reindexar.

- [ ] Un borrador convertido por el agente sigue listado en Borradores hasta que la app se vuelva a abrir.

### R7 — Android es la plataforma

El producto se especifica para Android y para navegador de escritorio. **iOS no
se soporta:** no hay Share Target y el Atajo equivalente sale del alcance.

---

## Features

### F05.1 — El esquema del `.md`

Frontmatter de siete claves, solo `titulo` obligatorio; cuerpo markdown con cuatro
secciones conocidas y opcionales. Los ingredientes llevan el nombre primero y la
cantidad después de un separador.

Es lo que permite J4 sin ensuciar el archivo. Definido en
`ux/information-architecture.md` §1.

#### C05.1.1 — Parsear el frontmatter *(J8)*

- [ ] Se leen las siete claves: `titulo`, `tags`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`. La completitud no es una clave: es un tag (F05.3).
- [ ] Una clave ausente se representa como ausente, no como cadena vacía.
- [ ] Una clave desconocida se conserva sin interpretarse.
- [ ] `dificultad` fuera de `fácil` · `media` · `difícil` se muestra tal cual y no se corrige.
- [ ] **`tiempo` es uno de cinco valores:** `~15 min`, `~30 min`, `~60 min`, `>60 min`, `>1 día`. Cuenta el tiempo hasta comer, con reposo y horno incluidos. Cualquier otro texto se lee como sin duración —no se muestra, no filtra y no ordena— y el `.md` no se corrige. La validación es al leer.
- [ ] **Hay tags reservados** (C05.1.4): viven en la lista `tags` como cualquier otro, y la app los dibuja y los carga con forma propia.
- [ ] Un archivo sin bloque de frontmatter es válido si el cuerpo permite deducir el título; si no, cae en C05.2.3.

**Edge cases:** frontmatter con YAML inválido → el archivo se trata como sin
frontmatter, y si no hay título se ignora y se cuenta (C05.2.3) · `tags` escrito
como texto suelto, sin corchetes ni guiones → se lee como sin tags · `foto` que no es una URL
→ se conserva y no se dibuja.

#### C05.1.2 — Parsear el cuerpo *(J8)*

- [ ] Se reconocen `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`.
- [ ] Los `###` dentro de Ingredientes son grupos; dentro de Variaciones, variaciones; **dentro de Preparación, tramos con nombre**, y la numeración de los pasos vuelve a empezar en cada uno.
- [ ] `## Variaciones` puede traer una lista de bullets en vez de secciones `###`, y entonces se muestra como lista.
- [ ] Cualquier otra sección se conserva y se muestra tal cual, sin interpretarse.
- [ ] El texto antes de la primera sección es la descripción.
- [ ] Al reescribir, el orden es siempre el mismo: la descripción, Ingredientes, Preparación, Variaciones y Notas, y después las otras secciones en el orden en que estaban. Un `.md` que las traía en otro orden queda en éste la primera vez que se guarda.

#### C05.1.3 — Separar nombre y cantidad en un ingrediente *(J4)*

- [ ] El ítem se parte en **nombre + separador + cantidad**, en ese orden.
- [ ] Los separadores son `-`, `—`, `;`, `,` y `|`. **Manda el primero que aparezca.**
- [ ] **La coma solo separa si lo que sigue empieza con un dígito.** `Provenzal, 1 cucharada` se parte; `Sal, pimienta` no.
- [ ] Un ítem sin separador es un ingrediente sin cantidad, y su nombre es el ítem entero.
- [ ] Los espacios alrededor del separador se descartan; el resto del texto se conserva tal cual.
- [ ] La cantidad es **texto libre**: no se parsea, no se normaliza y no se convierte a número.

**Edge cases:** `Harina 0000, 200gr?` → nombre "Harina 0000", cantidad "200gr?"; el signo de pregunta se conserva · `500gr de anillos de calamar`, con la cantidad adelante y sin separador → es el nombre entero, sin cantidad, y entra al filtro por "500gr de anillos de calamar" · ítem que empieza con el separador → cantidad sin nombre, no entra al filtro y no rompe · ítem vacío → se ignora.

**Nota técnica:** la convención sale del contenido real del Drive. El libro de
pescados usa `Anchoítas — 18-20 medianas` y el recetario original usa
`Provenzal, 1 cucharada`: las dos fuentes ponen el nombre adelante.

#### C05.1.4 — Los tags reservados *(J8)*

- [ ] Cuatro tags son **especiales**: `favorito`, `menú diario`, `probar` e `incompleta`, en ese orden en cualquier fila de tags y antes que los demás.
- [ ] Se reconocen sin mirar mayúsculas ni tildes. `favorito` se reconoce además como `favorita`, `favoritos` y `favoritas`; `incompleta`, como `incompleto`, `incompletos` e `incompletas`. Al escribir, la app usa siempre la forma canónica.
- [ ] Ninguno se escribe a mano en el campo de tags: cada uno tiene su botón en el editor (`E04-Corregir.md`). Tampoco se acepta `terminado` ni sus formas de género y número, que contradicen a `incompleta`.
- [ ] No suman claves al frontmatter ni columnas al índice: son valores de `tags`.

### F05.2 — Leer tolerante

Un archivo con título se muestra y se lista igual, le falte lo que le falte: la
app no lo castiga ni lo marca por su cuenta (la completitud la declara el
usuario, F05.3). Un archivo sin título se ignora y se cuenta.

**La app no es la autoridad sobre el formato**: los `.md` los escriben agentes y
el usuario a mano, y eso es el caso normal.

#### C05.2.1 — Mostrar lo que llegó *(J8)*

- [ ] Una receta a la que le falta cualquier cosa menos el título se muestra y se lista.
- [ ] Una sección ausente no se dibuja: no hay encabezado vacío ni "sin datos".

#### C05.2.2 — Un archivo que no es una receta *(J8)*

- [ ] Un archivo que no termina en `.md` dentro de una carpeta de categoría se ignora sin contarse: no pretendía ser una receta.

#### C05.2.3 — Un `.md` sin título se ignora y se cuenta *(J8)*

- [ ] No se lista, no entra al índice, y no rompe la lectura de la carpeta.
- [ ] Suma al contador de archivos ignorados que se ve en Ajustes (C05.9.1).
- [ ] El contador nombra los archivos, para poder encontrarlos en Drive.

### F05.3 — La completitud la declara el usuario

Una receta está terminada cuando el usuario lo dice, y no cuando el texto alcanza
una forma. **Es un dato del archivo** —el tag `incompleta` en la lista `tags`—,
no un cálculo: la app lo lee y lo muestra, nunca lo deduce.

Terminar una receta es un juicio. Hay recetas escritas enteras que todavía no
están buenas, y recetas de tres líneas que sí. Derivarlo del contenido decidiría
por el usuario y además podría cambiar solo, sin que nadie tocara nada.

#### C05.3.1 — La completitud es el tag `incompleta` *(J8)*

- [ ] Una receta está incompleta si su lista `tags` tiene `incompleta`; si no lo tiene, está terminada.
- [ ] Se escribe siempre en la forma canónica, en minúscula. Se reconocen además `incompleto`, `incompletos` e `incompletas` como el mismo tag (C05.1.4).
- [ ] Es el único de los cuatro tags especiales que **no** se pone y saca libremente: sólo se puede sacar cuando la receta cumple C05.3.3, y una receta nueva nace con el tag puesto (`E04-Corregir.md` C04.3b.1).
- [ ] `completa` es una clave desconocida como cualquier otra (C05.1.1): la app no la lee ni la borra, y la conserva tal cual si venía en el `.md`.

#### C05.3.2 — El índice no tiene columna propia *(J1, J8)*

- [ ] La fila no tiene columna de completitud. Si una receta está incompleta se sabe por su columna `tags`, igual que si es favorita (F05.4b).
- [ ] Sigue siendo cache: un `.md` editado afuera deja la fila atrasada hasta el próximo guardado o reindexado (R4).

#### C05.3.3 — Cuándo se puede sacar el tag *(J7)*

- [ ] La condición (`sePuedeTerminar`): título, categoría, al menos un ingrediente y al menos un paso.
- [ ] La condición existe para habilitar que se pueda soltar el botón `incompleta` del editor (`E04-Corregir.md` C04.4.1) y **en ningún otro lado**: no filtra, no corrige y no escribe.
- [ ] Título y categoría ya son obligatorios para guardar; se evalúan igual para que el aviso pueda decir todo lo que falta de una vez.
- [ ] Si una receta sin el tag deja de cumplir la condición mientras se la edita, el tag vuelve a ponerse solo.

### F05.4 — El índice, y la capa compartida

El índice es una Google Sheet, `_indice`, dentro de la carpeta base: derivada y
reconstruible. Tiene cuatro hojas: **`recetas`** —una fila por receta
(F05.4b)—, **`meta`** —la versión del esquema, la fecha del último reindexado y
la marca de un reindexado en curso—, **`borradores`** —una fila por cada `.md`
de `_borradores/`: archivo, título y cuándo se capturó— y **`categorias`** —una
fila por subcarpeta: id, nombre, color y foto (C05.4.4)—.

**Lo escribe un solo camino: el store** (`src/store.ts`). Crear y guardar una
receta escriben el `.md` y su fila juntos, y convertir un borrador
(`src/compartido.ts`) suma descartarlo. El formato tiene una sola
implementación —`src/recipe.ts` para el `.md`, `src/catalogo.ts` para la fila—,
así que no hay dos versiones que puedan divergir. El agente no corre este
código: devuelve el `.md` y lo guarda la app (C01.9.2); lo que deja directo en
Drive aparece al reindexar.

#### C05.4.1 — Escribir una receta al índice *(transversal)*

- [ ] Recibe la receta parseada y escribe o reemplaza **su** fila, identificada por `fileId` (R5).
- [ ] **La escritura es sincrónica:** ocurre en el momento del guardado y no se junta con otras. **No hay debounce y no hay cola.**
- [ ] Nada queda esperando en almacenamiento local a que alguien lo mande después: una fila encolada es una segunda fuente de verdad, que es lo que R1 prohíbe.
- [ ] Lo mismo vale para las hojas `borradores` y `categorias`: cada captura, descarte o cambio de categoría escribe su fila en el momento.
- [ ] La operación termina cuando Sheets confirmó; recién ahí el guardado se declara exitoso.
- [ ] Es idempotente: repetirla con la misma receta deja una sola fila (R2).

**Nota técnica:** la escritura por fila ronda los 200 B y es exactamente el
motivo por el que el índice es una planilla y no un JSON — Drive no tiene
escritura parcial y un JSON obligaría a reescribir el archivo entero.

#### C05.4.2 — Leer el índice *(J1, J4, J5)*

- [ ] Una sola lectura devuelve todas las filas: buscar entre mil recetas no lee mil archivos.
- [ ] Lo que se lee se usa para listar y buscar; abrir una receta lee su `.md`.
- [ ] **Hay copia local del índice, y sólo del índice.** Vive en `localStorage` y guarda las cuatro hojas, más qué planilla y qué carpeta base son. Al abrir se pide el `modifiedTime` de `_indice` en Drive: si es el mismo que tenía la copia al guardarse, no se lee Sheets; si no, se lee la planilla y la copia se reemplaza. Con la copia vigente, abrir es un solo pedido.
- [ ] Cada escritura en `_indice` deja la copia al día.
- [ ] Una copia de otra versión del esquema, de otra planilla, o que no se puede leer cuenta como que no hay copia. La copia nunca es imprescindible.
- [ ] La premisa es que nunca hay escritura concurrente. No sirve para dibujar sin red: ver C05.8.1.

#### C05.4.3 — Un solo camino de escritura *(J8)*

- [ ] Toda escritura de una receta pasa por el store, que escribe el `.md` y su fila: no hay una ruta paralela dentro de la app.
- [ ] **Convertir un borrador en receta** es una sola operación —el `.md`, la fila y descartar el borrador— y la usa la app cuando se guarda una receta creada desde un borrador (C01.6.3), venga escrita a mano o recibida de Claude.
- [ ] El agente no escribe el índice: entrega el `.md` y lo guarda la app, o lo deja en Drive y aparece al reindexar.

**Nota técnica:** no hay bloqueo ni lógica de concurrencia. Con un solo usuario
y sesiones que no se solapan el riesgo es bajo, y la reparación es reindexar
(F05.5) con una sola pestaña abierta.

#### C05.4.4 — Las categorías salen del índice *(J1, J8)*

- [ ] Una categoría es una subcarpeta de la carpeta base. Las carpetas que empiezan con `_` no son categorías.
- [ ] **El color y la foto son propiedades de la carpeta** (`appProperties` `color` y `foto`, esta última como `catalogo:<clave>`). La hoja `categorias` las copia; la carpeta es la verdad.
- [ ] La app no tiene escrito ningún id de carpeta. Las 16 predefinidas —nombre, color y foto— están en `src/categorias.ts` y sólo sirven para el setup (C05.7.4) y para darle color y foto, al reindexar, a una carpeta con nombre de predefinida que todavía no tiene propiedades.
- [ ] Una carpeta creada a mano en Drive aparece como categoría al reindexar. Sin color ni foto se dibuja con el neutro y la trama, y no rompe nada.
- [ ] El nombre de la categoría de cada receta sale de su carpeta, no de un texto guardado aparte.

### F05.4b — La fila del índice es completa

Lo que hace falta para listar, buscar, filtrar y ordenar sin abrir ningún `.md`:
título, categoría, tags, rinde, tiempo, dificultad, fuente, foto y **los nombres
de los ingredientes**, tal como están escritos, sin normalizar.

Los ingredientes están ahí porque J4 tiene que resolverse sin leer mil `.md`. No
se normalizan porque cualquier regla que la app y el agente tuvieran que replicar
es una fuente de divergencia.

#### C05.4b.1 — Las columnas de la fila *(J1, J4, J5)*

- [ ] En este orden: `fileId`, nombre del archivo, título, categoría, id de la carpeta, rinde, tiempo, dificultad, fuente, tags, nombres de ingredientes, fecha de modificación y foto. No hay columna de completitud: se sabe por `tags`.
- [ ] `tiempo` se guarda como está en el `.md` y se valida al leer la fila (C05.1.1); una `dificultad` inválida se guarda vacía.
- [ ] La categoría se deriva de la carpeta que contiene al archivo, no del frontmatter.
- [ ] Los nombres de ingredientes se guardan tal como están escritos: sin singularizar, sin bajar a minúsculas, sin quitar acentos.
- [ ] Nada de lo que se guarda se usa para dibujar la receta abierta: eso sale del `.md`.

**Edge case:** una receta con cientos de ingredientes hace la fila grande pero no
la rompe; no hay tope declarado.

### F05.5 — Reindexar

Lee todos los `.md` y rearma la planilla. Es la reparación universal: cualquier
inconsistencia se resuelve así, porque los archivos son la verdad.

Disponible desde Ajustes. Además corre solo al abrir en tres casos (C05.5.3).

#### C05.5.1 — Reindexar *(J8)*

- [ ] Lista las subcarpetas de la carpeta base, lee cada `.md` —los de cada categoría, los sueltos en la carpeta base, que quedan sin categorizar, y los de `_borradores/`— y escribe las hojas `recetas`, `borradores` y `categorias` enteras.
- [ ] Si a la planilla le falta la hoja `borradores` o `categorias`, la crea.
- [ ] Al terminar, el índice no conserva ninguna fila anterior: lo que no está en Drive, no está.
- [ ] Los archivos ignorados por no tener título se cuentan y quedan visibles en Ajustes.
- [ ] La fecha del último reindexado queda registrada en `meta` y se muestra en Ajustes.

#### C05.5.2 — El reindexado muestra progreso y no se cancela *(J8)*

- [ ] Hay una barra de progreso con cuántos archivos van sobre el total.
- [ ] **No hay botón de cancelar.** Una vez empezada, termina.
- [ ] Mientras corre, la app no permite guardar ni borrar recetas.
- [ ] Si falla a mitad, avisa (R1) y ofrece volver a empezar; el índice queda como haya quedado y se repara volviendo a reindexar.

#### C05.5.3 — Cuándo se reindexa solo *(J8)*

- [ ] Al abrir, si la planilla se acaba de crear (C05.7.3), si la versión del esquema anotada en `meta` no es la del código (`SCHEMA_VERSION`, hoy 6), o si `meta` dice que un reindexado quedó a medias.
- [ ] Al terminar, el reindexado anota la versión del esquema en `meta`: sin eso, reindexaría en cada arranque.
- [ ] Cambiar la forma de la fila o de las hojas obliga a subir `SCHEMA_VERSION`. Lo que se valida al leer —`tiempo`, `dificultad`— no la sube.
- [ ] Al elegir o cambiar la carpeta base (C05.7.4).
- [ ] **No hay lógica de concurrencia:** dos reindexados solapados —dos pestañas, o *Reindexar* tocado mientras el arranque ya reindexa— pueden dejar cada receta dos veces. La salida es reindexar una vez con una sola pestaña abierta.

**Nota técnica:** es la operación más cara del producto — con ~1.000 recetas son
~1.000 lecturas de Drive, de a una y sin paralelismo, más la escritura de la
planilla. Puede tardar minutos. Por eso vive a tres toques y por eso tiene barra
de progreso y no un indicador indeterminado.

### F05.6 — Un índice roto se recrea, no se repara

Los `.md` son la verdad y el índice se rearma desde ellos. **La app no
diagnostica ni repara daños de la planilla in situ:** recrearla es menos trabajo
y menos riesgo que distinguir cada tipo de daño.

#### C05.6.1 — La app no detecta el daño *(J8)*

- [ ] La app no revisa que `_indice` tenga todas sus hojas y columnas, ni distingue tipos de daño.
- [ ] Un índice con filas de más, de menos o atrasadas no impide abrir: se corrige con **Ajustes → Reindexar** (C05.9b.2), con una sola pestaña abierta.
- [ ] Si `_indice` no existe, la app lo crea sola (C05.7.3): no es daño.

#### C05.6.2 — La salida cuando la app no abre *(J8)*

- [ ] Una planilla que no se puede leer —le falta la hoja `meta`, por ejemplo— frena el arranque con el aviso *«No se pudo abrir el Recetario.»* y **Reintentar**; el mensaje de Google va a la consola, no a la pantalla (R1).
- [ ] La recuperación es borrar el archivo `_indice` en Drive y volver a abrir: la app lo crea de nuevo y lo puebla desde los `.md`.
- [ ] Una copia local vieja o rota se resuelve con **Borrar datos locales** (C05.9b.5).

### F05.7 — Primer arranque y consentimiento

Explica qué va a pasar antes de pedir permiso. Pasa por la pantalla de "app no
verificada" una vez, que es inevitable con el scope `drive`.

#### C05.7.1 — Explicar antes de pedir *(transversal)*

- [ ] La primera pantalla dice que las recetas viven en el Drive del usuario y que la app las lee y las escribe.
- [ ] El pedido de permiso ocurre al tocar **Conectar con Google**, nunca automáticamente al abrir.
- [ ] Con una sesión previa vigente la app abre sin mostrar esa pantalla ni ningún popup: el pedido explícito es sólo para cuando no hay sesión o el permiso se revocó.

#### C05.7.2 — La conexión siempre termina en algo *(transversal)*

- [ ] Si el usuario cierra el popup, la app dice que no se pudo conectar y muestra el botón otra vez.
- [ ] Si la respuesta demora más de lo razonable, aparece el mismo aviso con el botón.
- [ ] **Nunca se queda en "Conectando…".**
- [ ] Si el usuario deniega el permiso, el mensaje lo dice y explica que sin acceso a Drive no hay app.

#### C05.7.3 — Crear el índice la primera vez *(J8)*

- [ ] Si `_indice` no existe en la carpeta base, se crea y se puebla leyendo los `.md`, con la barra de progreso de C05.5.2.
- [ ] Si la creación falla a mitad, el archivo a medio hacer se borra antes de avisar, para que el próximo arranque no lo encuentre corrupto.
- [ ] Si hay más de una planilla `_indice`, se usa la modificada más recientemente y Ajustes lo avisa (C05.9b.3).

#### C05.7.4 — Elegir la carpeta base *(transversal)*

- [ ] La app encuentra su carpeta por una marca en sus `appProperties` (`recetario=raiz`), no por el nombre: la carpeta puede llamarse como el usuario quiera y estar en cualquier lugar de su Drive.
- [ ] Sin una carpeta marcada, o con más de una, abre el selector (`#/carpeta`): «Elegí la carpeta de tus recetas». Arriba muestra las **Encontradas** —las marcadas, o si no hay ninguna las propias que se llamen `Recetario`— y abajo deja recorrer «Mi unidad». Sólo lista carpetas propias.
- [ ] En cualquier nivel se puede **Usar esta carpeta** o **Crear una carpeta nueva acá**, que propone el nombre `Recetario`.
- [ ] Antes de usarla confirma: «Voy a usar *nombre*. Si faltan categorías, las creo, y después indexo lo que haya adentro.»
- [ ] El setup, en este orden: crea las predefinidas que falten —comparando nombres sin mirar tildes ni mayúsculas—, cada una con su color y su foto; crea `_indice` si no está; reindexa, con la barra de C05.5.2; y **recién al final pone la marca** y se la saca a cualquier otra carpeta. Si algo falla antes, la carpeta queda sin marcar y el selector la vuelve a ofrecer. Repetirlo no duplica nada.
- [ ] La carpeta se cambia desde Ajustes (C05.9b.4).

### F05.8 — Sin red

Avisa y no insiste. No hay cola de reintentos, ni guardado local, ni "se guardará
más tarde" sin evidencia. La app tampoco muestra datos viejos como si fueran
actuales.

#### C05.8.1 — Sin red no se dibuja nada viejo *(transversal)*

- [ ] Una pantalla que no pudo leer muestra el aviso, no datos de una lectura anterior.
- [ ] El aviso dice que no se pudo conectar y ofrece reintentar.
- [ ] Ninguna pantalla promete que algo se va a guardar después.
- [ ] La copia local del índice (C05.4.2) no reemplaza la lectura de Drive: al abrir, la búsqueda de `_indice` va primero, y sin ella se muestra el aviso.

### F05.9 — Los avisos que no interrumpen

Los archivos ignorados, las inconsistencias detectadas y cualquier otro problema
sin acción inmediata viven en un lugar secundario —Ajustes—, no en la cara.
Que no interrumpan no significa que no existan: lo que se ignora se cuenta.

#### C05.9.1 — El aviso tiene dos niveles *(transversal)*

- [ ] **Con acción:** aparece donde ocurrió el problema, dice qué pasó y trae el control para resolverlo.
- [ ] **Sin acción:** no aparece donde ocurrió; se acumula en Ajustes.
- [ ] Los dos usan el mismo componente y el mismo tono: una frase en castellano, sin el error crudo.
- [ ] Ningún aviso usa ilustración ni frase simpática.

#### C05.9.2 — Los avisos acumulados se cuentan *(transversal)*

- [ ] Ajustes muestra cuántos archivos se ignoraron y por qué.
- [ ] La lista nombra los archivos, para poder encontrarlos en Drive.
- [ ] El contador se recalcula en cada lectura completa; no se acumula entre sesiones.

### F05.9b — Ajustes

La pantalla secundaria donde viven la cuenta, la carpeta y sus categorías, el
reindexado y los avisos que no interrumpen. Se llega desde el menú lateral.

Seis fichas, en este orden: **Cuenta**, **Recetario**, **Índice**, **Archivos
locales**, **Avisos** y **Registro de actividad**. Lo de la cuenta y el índice va
primero; lo raro, al final. Mientras corre un reindexado, Recetario no ofrece
sus controles y Archivos locales no se muestra.

**La versión del build** —el commit corto y cuándo se compiló— se ve al pie del
menú lateral, para saber si el teléfono ya tomó el último deploy.

#### C05.9b.1 — Cuenta *(transversal)*

- [ ] Muestra con qué cuenta de Google está conectada la app.
- [ ] Ofrece **Salir**, que descarta la sesión y vuelve a la pantalla de conexión.
- [ ] Salir no borra nada de Drive y lo dice.

#### C05.9b.2 — Índice *(J8)*

- [ ] Muestra la fecha del último reindexado.
- [ ] Ofrece **Reindexar**, que lleva a C05.5.2.
- [ ] Está a tres toques a propósito: es una operación rara y cara.

#### C05.9b.3 — Avisos *(transversal)*

- [ ] Lista los avisos sin acción acumulados (C05.9.2).
- [ ] Si hay más de una planilla `_indice` en Drive, dice cuántas y cuál se usa: la modificada más recientemente.
- [ ] Sin avisos, la sección dice «No hay nada para avisar.», sin ilustración.

#### C05.9b.4 — Recetario: la carpeta y las categorías *(transversal)*

- [ ] La ficha muestra el nombre de la carpeta base en uso y ofrece **Cambiar carpeta**, que abre el selector de C05.7.4. La carpeta anterior queda como está en Drive, sin la marca.
- [ ] Muestra cuántas categorías hay y lleva a **Categorías** (`#/categorias`), donde se gestionan: crear, renombrar, elegir color de la paleta y foto del catálogo, y borrar. Las predefinidas no tienen trato especial.
- [ ] Cada cambio escribe en el momento la carpeta en Drive —su nombre y sus propiedades— y su fila en la hoja `categorias`.
- [ ] Una categoría nueva nace con el primer color de la paleta que nadie usa.
- [ ] Un nombre vacío, que empiece con `_` o repetido sin mirar tildes ni mayúsculas no se acepta, y se dice por qué.
- [ ] Borrar una categoría con recetas lo advierte con la cantidad y los nombres: la carpeta y sus recetas van a la papelera de Drive, y sus filas salen del índice.

#### C05.9b.5 — Archivos locales *(J8)*

- [ ] Dice que la copia del índice se guarda en el navegador para abrir más rápido.
- [ ] Ofrece **Borrar datos locales**: borra lo guardado en el navegador sin salir de la cuenta, la app se recarga y baja todo de Drive.
- [ ] No toca nada de Drive.

#### C05.9b.6 — Registro de actividad *(J8)*

- [ ] Dice lo que verificó el arranque de esta sesión, con el tono de los avisos —el hecho y el número—: cuándo abrió, la fecha de `_indice`, si la copia local coincidía —y entonces no se leyó Sheets— o por qué no, cuántas recetas, borradores y categorías hay, y si reindexó y por qué.
- [ ] Es sólo lectura: no ofrece ninguna acción.

### F05.10 — La app en pantalla ancha

El teléfono es el contexto principal y ahí tiene que verse bien; la computadora
es un contexto real —recuperar y elegir qué cocinar también pasa sentado— y ahí
tiene que verse no mal. El ancho tiene una respuesta definida, no librada al
azar del CSS.

#### C05.10.1 — Una columna con máximo *(transversal)*

- [ ] El contenido es una columna; pasado cierto ancho, la columna tiene un máximo y se centra.
- [ ] Las grillas —categorías, listas de tarjetas— pasan de dos a cuatro columnas al ensancharse.
- [ ] No hay layout de escritorio propio: es la misma app, más ancha.
- [ ] Ninguna pantalla queda inutilizable en ancho de teléfono chico.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C05.1.1, C05.1.2, C05.1.4, C05.2.1, C05.2.2, C05.2.3, C05.3.1 | J8 |
| C05.3.2 | J1, J8 |
| C05.3.3 | J7 |
| C05.1.3, C05.4b.1 | J4 (y J1, J5 para la fila) |
| C05.4.1, C05.4.3, C05.5.1, C05.5.2, C05.5.3, C05.6.1, C05.6.2, C05.7.3, C05.9b.2, C05.9b.5, C05.9b.6 | J8 |
| C05.4.2 | J1, J4, J5 |
| C05.4.4 | J1, J8 |
| C05.7.1, C05.7.2, C05.7.4, C05.8.1, C05.9.1, C05.9.2, C05.9b.1, C05.9b.3, C05.9b.4, C05.10.1 | Transversal |

Ninguna capacidad de esta épica quedó sin job o sin justificación transversal.
