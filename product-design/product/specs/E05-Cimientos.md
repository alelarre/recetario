# E05 — Cimientos

**Versión:** 3.1 · **Fecha:** 2026-09-12 · **Estado:** Final — Hito 11
**Job:** J8 y transversal · **Prioridad:** alta · **Flujos:** F8, F9, F10, F11, F12

> **Cambios en la 3.1 (2026-09-12):** **F05.3 reescrita** — `completa` es un dato
> del frontmatter que el usuario declara (C05.3.1), el índice lo copia sin
> recalcular (C05.3.2), y la condición de título + categoría + ingredientes +
> pasos existe sólo para habilitar el control del editor (C05.3.3). Antes la
> completitud se derivaba al leer.
>
> **Cambios en la 3.0 (Hito 11):** C05.4.1 — además del debounce, **se elimina la
> cola**: nada queda esperando en almacenamiento local a que alguien lo mande
> después. Ver `plan/delta-implementacion.md` §2.2.
>
> **Cambio en la 2.1 (Hito 9):** C05.1.3 — la convención del ingrediente se
> reescribió contra el contenido real del Drive: `nombre` + separador +
> `cantidad`. Y `## Preparación` puede traer `###`.
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. Se agregan las **reglas transversales** (§Reglas),
> que valen para las seis épicas y no se repiten en cada una. Nuevas
> capacidades a partir de los wireframes: el aviso de dos niveles y la pantalla
> de Ajustes. La escritura del índice pasa a ser sincrónica, sin juntar
> escrituras.

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
segundo plano. El cambio se ve la próxima vez que esa pantalla lee el índice.

- [ ] Un borrador convertido por el agente sigue listado en Borradores hasta que se vuelva a entrar.

### R7 — Android es la plataforma

El producto se especifica para Android y para navegador de escritorio. **iOS no
se soporta:** no hay Share Target y el Atajo equivalente sale del alcance.

---

## Features

### F05.1 — El esquema del `.md`

Frontmatter de ocho claves, solo `titulo` obligatorio; cuerpo markdown con cuatro
secciones conocidas y opcionales. Los ingredientes llevan el nombre primero y la
cantidad después de un separador.

Es lo que permite J4 sin ensuciar el archivo. Definido en
`ux/information-architecture.md` §1.

#### C05.1.1 — Parsear el frontmatter *(J8)*

- [ ] Se leen las ocho claves: `titulo`, `tags`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`, `completa`.
- [ ] Una clave ausente se representa como ausente, no como cadena vacía.
- [ ] Una clave desconocida se conserva sin interpretarse.
- [ ] `dificultad` fuera de `fácil` · `media` · `difícil` se muestra tal cual y no se corrige.
- [ ] Un archivo sin bloque de frontmatter es válido si el cuerpo permite deducir el título; si no, cae en C05.2.3.

**Edge cases:** frontmatter con YAML inválido → el archivo se trata como sin
frontmatter, y si no hay título se ignora y se cuenta (C05.2.3) · `tags` escrito
como texto en vez de lista → se toma como un único tag · `foto` que no es una URL
→ se conserva y no se dibuja.

#### C05.1.2 — Parsear el cuerpo *(J8)*

- [ ] Se reconocen `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`.
- [ ] Los `###` dentro de Ingredientes son grupos; dentro de Variaciones, variaciones; **dentro de Preparación, tramos con nombre**, y la numeración de los pasos vuelve a empezar en cada uno.
- [ ] `## Variaciones` puede traer una lista de bullets en vez de secciones `###`, y entonces se muestra como lista.
- [ ] Cualquier otra sección se conserva y se muestra tal cual, sin interpretarse.
- [ ] El texto antes de la primera sección es la descripción.
- [ ] El orden de las secciones en el archivo se respeta al mostrar y al reescribir.

#### C05.1.3 — Separar nombre y cantidad en un ingrediente *(J4)*

`[reescrita en el Hito 9 contra el contenido real del Drive]`

- [ ] El ítem se parte en **nombre + separador + cantidad**, en ese orden.
- [ ] Los separadores son `-`, `—`, `;`, `,` y `|`. **Manda el primero que aparezca.**
- [ ] **La coma solo separa si lo que sigue empieza con un dígito.** `Provenzal, 1 cucharada` se parte; `Sal, pimienta` no.
- [ ] Un ítem sin separador es un ingrediente sin cantidad, y su nombre es el ítem entero.
- [ ] Los espacios alrededor del separador se descartan; el resto del texto se conserva tal cual.
- [ ] La cantidad es **texto libre**: no se parsea, no se normaliza y no se convierte a número.

**Edge cases:** `Harina 0000, 200gr?` → nombre "Harina 0000", cantidad "200gr?"; el signo de pregunta se conserva · `500gr de anillos de calamar`, con la cantidad adelante y sin separador → es el nombre entero, sin cantidad, y entra al filtro por "500gr de anillos de calamar" · ítem que empieza con el separador → cantidad sin nombre, no entra al filtro y no rompe · ítem vacío → se ignora.

**Nota técnica:** esta convención se escribió **contra las ~60 recetas ya
migradas**, no al revés. El libro de pescados usa `Anchoítas — 18-20 medianas` y
el recetario original usa `Provenzal, 1 cucharada`: las dos fuentes ponen el
nombre adelante. La convención anterior —la cantidad en itálica al principio— no
la cumplía ni una sola receta.

### F05.2 — Leer tolerante

Un archivo con título se muestra. Lo que le falte se informa, no se castiga: se
marca incompleta y se lista igual. Un archivo sin título se ignora y se cuenta.

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

`[cambio del 2026-09-12: antes se derivaba del contenido]`

Una receta está terminada cuando el usuario lo dice, y no cuando el texto alcanza
una forma. **Es un dato del archivo**, no un cálculo: la app lo lee y lo muestra,
nunca lo deduce.

Terminar una receta es un juicio. Hay recetas escritas enteras que todavía no
están buenas, y recetas de tres líneas que sí. Derivarlo del contenido decidía
por el usuario y además podía cambiar solo, sin que nadie tocara nada.

#### C05.3.1 — `completa` es un dato del frontmatter *(J8)*

- [ ] La clave vale **`sí`** o **`no`**; «si» sin tilde vale igual y las mayúsculas no importan.
- [ ] **Es el único caso en que la app asume algo:** si la clave falta o trae cualquier otro valor, la receta se lee como **incompleta**. Decir que algo está terminado cuando nadie lo dijo es peor que lo contrario.
- [ ] Se lee tal cual: **al leer no se evalúa el contenido de la receta**.
- [ ] La app la escribe siempre, en los dos valores, cada vez que guarda: leerla no depende de interpretar una ausencia.
- [ ] Un `.md` escrito afuera sin la clave se lee como no terminada; nadie lo corrige solo (R4).

#### C05.3.2 — El índice guarda lo que dice el archivo *(J1, J8)*

- [ ] La columna `completa` de la fila copia el dato del `.md`, sin recalcular nada.
- [ ] Sigue siendo cache: un `.md` editado afuera deja la fila atrasada hasta el próximo guardado o reindexado (R4).

#### C05.3.3 — Cuándo se puede declarar *(J7)*

- [ ] Una receta puede declararse terminada sólo si tiene **título, categoría, al menos un ingrediente y al menos un paso**.
- [ ] La condición existe para habilitar el control del editor (C04.4.1) y **en ningún otro lado**: no filtra, no corrige y no escribe.
- [ ] Título y categoría ya son obligatorios para guardar; se evalúan igual para que el aviso pueda decir todo lo que falta de una vez.
- [ ] Si una receta declarada terminada deja de cumplir la condición mientras se la edita, la declaración se cae con ella.

### F05.4 — El índice, y la capa compartida

El índice es una Google Sheet derivada y reconstruible. **Lo escriben las dos
partes del ecosistema con la misma función:** la app cuando guarda, y el agente
cuando escribe una receta nueva.

No es un formato acordado que cada uno implementa por su lado — es código común.
Tres operaciones viven ahí: escribir una receta al índice, convertir un borrador
en receta, y leer y parsear un `.md`. Eso elimina la divergencia entre dos
implementaciones del mismo formato, y hace concreto lo que la visión llama
ecosistema.

#### C05.4.1 — Escribir una receta al índice *(transversal)*

- [ ] Recibe la receta parseada y escribe o reemplaza **su** fila, identificada por `fileId` (R5).
- [ ] **La escritura es sincrónica:** ocurre en el momento del guardado y no se junta con otras. **No hay debounce y no hay cola.**
- [ ] Nada queda esperando en almacenamiento local a que alguien lo mande después: una fila encolada es una segunda fuente de verdad, que es lo que R1 prohíbe.
- [ ] La operación termina cuando Sheets confirmó; recién ahí el guardado se declara exitoso.
- [ ] Es idempotente: repetirla con la misma receta deja una sola fila (R2).

**Nota técnica:** la escritura por fila ronda los 200 B y es exactamente el
motivo por el que el índice es una planilla y no un JSON — Drive no tiene
escritura parcial y un JSON obligaría a reescribir el archivo entero.

#### C05.4.2 — Leer el índice *(J1, J4, J5)*

- [ ] Una sola lectura devuelve todas las filas: buscar entre mil recetas no lee mil archivos.
- [ ] Lo que se lee se usa para listar y buscar; abrir una receta lee su `.md`.
- [ ] **Hay copia local del índice, y sólo del índice** `[2026-09-13]`. Vive en `localStorage` y se usa si la fecha de `_indice` en Drive es la misma que tenía al guardarla; si no, se lee la planilla y se reemplaza. Cada escritura en `_indice` la actualiza. No sirve para dibujar sin red: ver C05.8.1.

#### C05.4.3 — La misma función la invocan la app y el agente *(J8)*

- [ ] Las tres operaciones de la capa compartida son el único camino para escribir: no hay una ruta paralela dentro de la app.
- [ ] **Convertir un borrador en receta** la invoca el agente al convertir afuera, y la app cuando se guarda una receta creada desde un borrador (C01.6.3).

**Nota técnica:** dos escritores sobre la misma planilla, sin bloqueo. Con un
solo usuario y sesiones que no se solapan el riesgo es bajo, y la reparación es
reindexar (F05.5).

### F05.4b — La fila del índice es completa

Título, categoría, tags, completitud, fuente, foto y **los nombres de los
ingredientes**, tal como están escritos, sin normalizar.

Los ingredientes están ahí porque J4 tiene que resolverse sin leer mil `.md`. No
se normalizan porque cualquier regla que la app y el agente tuvieran que replicar
es una fuente de divergencia.

#### C05.4b.1 — Las columnas de la fila *(J1, J4, J5)*

- [ ] `fileId`, título, categoría, tags, completitud, fuente, foto y nombres de ingredientes.
- [ ] La categoría se deriva de la carpeta que contiene al archivo, no del frontmatter.
- [ ] Los nombres de ingredientes se guardan tal como están escritos: sin singularizar, sin bajar a minúsculas, sin quitar acentos.
- [ ] Nada de lo que se guarda se usa para dibujar la receta abierta: eso sale del `.md`.

**Edge case:** una receta con cientos de ingredientes hace la fila grande pero no
la rompe; no hay tope declarado.

### F05.5 — Reindexar

Lee todos los `.md` y rearma la planilla. Es la reparación universal: cualquier
inconsistencia se resuelve así, porque los archivos son la verdad.

Disponible desde Ajustes, y ofrecida cuando el índice está dañado.

#### C05.5.1 — Reindexar *(J8)*

- [ ] Lista las subcarpetas de `Recetario/`, lee cada `.md` y escribe la planilla entera.
- [ ] Al terminar, el índice no conserva ninguna fila anterior: lo que no está en Drive, no está.
- [ ] Los archivos ignorados por no tener título se cuentan y quedan visibles en Ajustes.
- [ ] La fecha de la última reindexado queda registrada y se muestra en Ajustes.

#### C05.5.2 — El reindexado muestra progreso y no se cancela *(J8)*

- [ ] Hay una barra de progreso con cuántos archivos van sobre el total.
- [ ] **No hay botón de cancelar.** Una vez empezada, termina.
- [ ] Mientras corre, la app no permite guardar ni borrar recetas.
- [ ] Si falla a mitad, avisa (R1) y ofrece volver a empezar; el índice queda como haya quedado y se repara volviendo a reindexar.

**Nota técnica:** es la operación más cara del producto — con ~1.000 recetas son
~1.000 lecturas de Drive, de a una y sin paralelismo, más la escritura de la
planilla. Puede tardar minutos. Por eso vive a tres toques y por eso tiene barra
de progreso y no un indicador indeterminado.

### F05.6 — Aviso de índice dañado, con salida

Si el índice no se puede leer, la app avisa en castellano —las recetas están
bien; lo dañado es el atajo para listarlas— y ofrece el botón de reindexar.
**Nunca el error crudo de Google, nunca mandar al usuario a borrar un archivo en
Drive.**

#### C05.6.1 — Detectar que el índice no sirve *(J8)*

- [ ] Cuenta como dañado: el archivo no existe, no se puede leer, o le falta alguna de sus hojas o columnas.
- [ ] La app no distingue entre tipos de daño: todos llevan al mismo aviso y a la misma salida.

#### C05.6.2 — El aviso reemplaza el contenido del Recetario *(J8)*

- [ ] Dice que las recetas están bien y que lo dañado es el atajo para listarlas.
- [ ] Ofrece **Reindexar** como única acción.
- [ ] No se ofrece nada más: ni buscar, ni entrar a categorías, porque no hay con qué.
- [ ] Reindexar se ofrece, **no se hace solo**: arrancar no es el momento de decidir por el usuario una operación de minutos.

**Edge case:** índice inexistente en el primer arranque → no es daño, es
C05.7.3 (crearlo).

### F05.7 — Primer arranque y consentimiento

Explica qué va a pasar antes de pedir permiso. Pasa por la pantalla de "app no
verificada" una vez, que es inevitable con el scope `drive`.

#### C05.7.1 — Explicar antes de pedir *(transversal)*

- [ ] La primera pantalla dice que las recetas viven en el Drive del usuario y que la app las lee y las escribe.
- [ ] El pedido de permiso ocurre al tocar **Conectar con Google**, nunca automáticamente al abrir.

#### C05.7.2 — La conexión siempre termina en algo *(transversal)*

- [ ] Si el usuario cierra el popup, la app dice que no se pudo conectar y muestra el botón otra vez.
- [ ] Si la respuesta demora más de lo razonable, aparece el mismo aviso con el botón.
- [ ] **Nunca se queda en "Conectando…".**
- [ ] Si el usuario deniega el permiso, el mensaje lo dice y explica que sin acceso a Drive no hay app.

#### C05.7.3 — Crear el índice la primera vez *(J8)*

- [ ] Si `Recetario/_indice` no existe, se crea y se puebla leyendo los `.md`, con la barra de progreso de C05.5.2.
- [ ] Si la creación falla a mitad, el archivo a medio hacer se borra antes de avisar, para que el próximo arranque no lo encuentre corrupto.

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

`[nueva en la 2.0 — wireframes §2.6]`

- [ ] **Con acción:** aparece donde ocurrió el problema, dice qué pasó y trae el control para resolverlo.
- [ ] **Sin acción:** no aparece donde ocurrió; se acumula en Ajustes.
- [ ] Los dos usan el mismo componente y el mismo tono: una frase en castellano, sin el error crudo.
- [ ] Ningún aviso usa ilustración ni frase simpática.

#### C05.9.2 — Los avisos acumulados se cuentan *(transversal)*

- [ ] Ajustes muestra cuántos archivos se ignoraron y por qué.
- [ ] La lista nombra los archivos, para poder encontrarlos en Drive.
- [ ] El contador se recalcula en cada lectura completa; no se acumula entre sesiones.

### F05.9b — Ajustes

`[nueva en la 2.0 — wireframes §3.9]`

La pantalla secundaria donde viven la cuenta, el reindexado y los avisos que
no interrumpen. Se llega desde el Recetario.

#### C05.9b.1 — Cuenta *(transversal)*

- [ ] Muestra con qué cuenta de Google está conectada la app.
- [ ] Ofrece **Salir**, que descarta la sesión y vuelve a la pantalla de conexión.
- [ ] Salir no borra nada de Drive y lo dice.

#### C05.9b.2 — Índice *(J8)*

- [ ] Muestra la fecha de la última reindexado.
- [ ] Ofrece **Reindexar**, que lleva a C05.5.2.
- [ ] Está a tres toques a propósito: es una operación rara y cara.

#### C05.9b.3 — Avisos *(transversal)*

- [ ] Lista los avisos sin acción acumulados (C05.9.2).
- [ ] Sin avisos, la sección dice que no hay nada, sin ilustración.

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
| C05.1.1, C05.1.2, C05.2.1, C05.2.2, C05.2.3, C05.3.1 | J8 |
| C05.3.2 | J1, J8 |
| C05.3.3 | J7 |
| C05.1.3, C05.4b.1 | J4 (y J1, J5 para la fila) |
| C05.4.1, C05.4.3, C05.5.1, C05.5.2, C05.6.1, C05.6.2, C05.7.3, C05.9b.2 | J8 |
| C05.4.2 | J1, J4, J5 |
| C05.7.1, C05.7.2, C05.8.1, C05.9.1, C05.9.2, C05.9b.1, C05.9b.3, C05.10.1 | Transversal |

Ninguna capacidad de esta épica quedó sin job o sin justificación transversal.
