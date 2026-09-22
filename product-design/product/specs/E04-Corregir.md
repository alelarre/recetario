# E04 — Corregir

**Versión:** 3.3 · **Fecha:** 2026-09-16 · **Estado:** Final — Hito 11
**Job:** J7 · **Prioridad:** baja · **Flujo:** F7

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

Arreglar un error descubierto al cocinar, o anotar una variación que salió mejor.

**El editor corrige, y crea una receta que ya tenés en la cabeza.** Lo que no
hace es componer desde una fuente: transcribir un PDF, un video o la foto de un
libro sigue siendo trabajo del agente. Es el mismo formulario para las dos cosas.

La distinción es estratégica, no una limitación de alcance: un editor que
compitiera con la ruta de entrada real no la mejoraría.

---

## Features

### F04.1 — Editar desde la receta

A un toque desde la receta que se está leyendo, que es donde se descubre el
error.

#### C04.1.1 — La entrada al editor *(J7)*

- [ ] **Editar** está al pie de la receta abierta, a un toque.
- [ ] El editor abre con todos los campos cargados con lo que dice el `.md`.
- [ ] El encabezado —volver, título y *Guardar*— queda fijo arriba al hacer scroll, como en la receta abierta (C03.1.2b): *Guardar* queda a mano aunque se esté escribiendo al fondo del formulario.
- [ ] Salir sin guardar con cambios pendientes **pregunta antes**: *"¿Salir sin guardar los cambios?"*, con *Seguir editando* y *Salir*. Vale para el volver del encabezado y para el gesto de atrás de Android. La pregunta se inserta arriba del formulario sin redibujarlo, para no perder lo escrito.
- [ ] El formulario va en tres fichas con título: **Datos**, **Contenido** y **Fotos** (F04.3d).
- [ ] Agregar, sacar o poner una foto cuenta como cambio sin guardar, igual que escribir en un campo.
- [ ] Salir sin cambios no pregunta nada.

### F04.2 — Un formulario de campos separados

Título, categoría, tags, rinde, duración, dificultad, fuente y foto, cada uno
con su control. **El frontmatter YAML no se ve:** es estructura, no contenido,
y el archivo se arma solo al guardar.

#### C04.2.1 — Los campos del frontmatter *(J7)*

- [ ] Un control por clave: título (texto), tags (lista editable), rinde y fuente (texto), dificultad (elección de tres), `tiempo` con los cinco botones de duración (C04.2.1c) y `foto` con el selector de **Portada** (C04.2.1d).
- [ ] **El YAML no se muestra en ningún momento.**
- [ ] Solo el título es obligatorio.
- [ ] Un campo que se deja vacío **no se escribe** en el frontmatter: no quedan claves vacías.
- [ ] `rinde` es texto libre, no un número: *"4 porciones"*.

#### C04.2.1b — Los tags, y las palabras que la app se reserva *(J7)*

- [ ] Los tags comunes puestos se dibujan como pills, cada una con su cruz, que la saca; debajo va el campo para agregar otro, que se suma con Enter y sugiere los tags que ya existen —nunca los reservados—. Lo que quedó a medio escribir en ese campo no se guarda. Los especiales no: tienen su botón (C04.4.1) y no se dibujan dos veces.
- [ ] Hay **palabras reservadas** que el editor no deja escribir a mano: `favorito`, `menú diario`, `probar` e `incompleta`, cada uno en sus formas alternativas, más `terminado` en sus cuatro formas —masculino, femenino, singular y plural—.
- [ ] `terminado` está reservada porque contradice a `incompleta` (C05.3.1): un tag que contradiga a otro tag especial es ambigüedad pura.
- [ ] Los cuatro especiales están reservados porque tienen su propio control: escribirlos a mano duplicaría el botón.
- [ ] Al intentar agregar una reservada, el tag **no entra** y aparece una línea de aviso sin acción, *"Tag no permitido"* (C05.9.1): no es un error del usuario, es un nombre tomado.
- [ ] La comparación ignora mayúsculas y acentos, igual que la búsqueda.
- [ ] **La app no borra ni corrige** una palabra reservada que ya esté en un `.md` escrito afuera: la muestra como cualquier otro tag (R4).

#### C04.2.1c — El campo «Duración» *(J7)*

- [ ] **«Duración»** son cinco botones con relojito, uno por valor —`~15 min`, `~30 min`, `~60 min`, `>60 min` y `>1 día`—, en una grilla de tres columnas (`design-system.md` §6.18). **«Rinde» ocupa la fila entera**, y «Duración» va debajo, también a lo ancho.
- [ ] **Se aprieta uno a la vez.** Tocar el apretado lo suelta: la receta queda sin duración. Apretado se dibuja invertido, como los botones de los tags especiales (C04.4.1).
- [ ] Debajo de la grilla, en chico: *"Hasta comer, con reposo y horno incluidos."*
- [ ] **Un valor inválido en el archivo** abre el editor sin ningún botón apretado.
- [ ] El valor viaja en un campo oculto `tiempo`, que es lo que lee el formulario, y entra en la foto de «cambios sin guardar» como cualquier campo (C04.1.1).

#### C04.2.1d — El campo «Portada» *(J7)*

- [ ] **Se llama «Portada»**, y no «Foto»: abajo está la ficha *Fotos*, que es el depósito, y son dos cosas distintas.
- [ ] **No es un campo de texto: es la miniatura de la cabecera actual**, y tocarla abre una ficha al pie con el depósito para elegir y **Sin foto**.
- [ ] **La portada sale de lo que ya está**: una foto del depósito o ninguna. **Desde acá no se agrega nada**: una foto nueva —de la cámara, de la galería o de una URL— entra por la ficha *Fotos* (C04.3d.1, C04.3d.1b), y recién después se la puede poner de portada.
- [ ] Elegir una del depósito escribe `foto: foto:N` y la deja marcada en la grilla; *Sin foto* deja la cabecera vacía.
- [ ] **Una cabecera que es una URL suelta** —escrita afuera— se dibuja adelante de la grilla, marcada como la actual y sin poder tocarse: no está en el depósito. Se conserva mientras no se elija otra cosa; elegir una del depósito o *Sin foto* la reemplaza.
- [ ] Sin cabecera, el botón dice *Sin foto*. Una `foto:N` que no está en el depósito se lee como ausente (C05.1.1).
- [ ] El valor viaja crudo —`foto:N` o la URL— en un campo oculto, que es lo que se guarda.

#### C04.2.2 — El título no renombra el archivo *(J7)*

- [ ] Cambiar el título reescribe el frontmatter y **deja el archivo con el mismo nombre en Drive** (R5).
- [ ] La identidad de la receta sigue siendo su `fileId`.

#### C04.2.3 — La categoría es un control que actúa *(J7)*

- [ ] Las opciones son las subcarpetas de `Recetario/`, las mismas del Recetario (C02.4.1).
- [ ] Cambiarla **mueve el archivo entre carpetas de Drive** al guardar. No escribe nada en el frontmatter: la carpeta es la única verdad de la categoría.
- [ ] Al guardar se actualiza la categoría de la fila del índice.
- [ ] Si el movimiento falla, avisa y el reintento repite todo el guardado (R2).

### F04.3 — El contenido, en texto plano

Descripción, ingredientes, preparación, variaciones y notas: cada sección es un
campo de texto y se guarda tal cual en su lugar del `.md`.

#### C04.3.1 — Un campo de texto por sección *(J7)*

- [ ] Cinco campos: descripción, ingredientes, preparación, variaciones y notas.
- [ ] Lo escrito se guarda tal cual bajo su encabezado del `.md`.
- [ ] Un campo vacío no escribe su encabezado: no quedan secciones vacías en el archivo.

#### C04.3.2 — Los ingredientes son un campo de texto más *(J4, J7)*

- [ ] **No hay un control por ingrediente**: es un único campo, como la preparación.
- [ ] La estructura es por convención: cada bullet es un ingrediente, los `###` son grupos, y la cantidad va después del separador (C05.1.3).
- [ ] El editor **no corrige, no autocompleta y no valida** la convención.
- [ ] Una receta mal tipeada queda fuera del filtro por ingrediente y figura como incompleta. Es el costo aceptado y es consistente con el principio 3.

#### C04.3.3 — El editor no impone formato *(J7, J8)*

- [ ] Lo escrito se guarda literal: el editor no reordena secciones, no normaliza bullets y no cambia el markdown.
- [ ] El orden de las secciones del archivo original se conserva.

### F04.3b — Crear una receta nueva

El mismo formulario, con los campos vacíos.

#### C04.3b.1 — Nueva receta *(J7)*

- [ ] Los mismos campos, vacíos. Solo el título es obligatorio.
- [ ] La categoría hay que elegirla: sin ella no se sabe en qué carpeta va el archivo.
- [ ] Guardar crea el `.md` en la carpeta elegida y escribe su fila del índice, por el store (C05.4.1).
- [ ] El nombre del archivo se deriva del título **una sola vez, al crearlo**, y no vuelve a cambiar (C04.2.2): el título en minúsculas, sin acentos y con guiones — `milanesas-napolitanas.md`.
- [ ] Si ya existe un archivo con ese nombre en la carpeta, se usa un nombre distinto sin preguntar: la identidad es el `fileId`, no el nombre.
- [ ] **Desde un borrador** (C01.6.3), el editor abre con el título, la `fuente` y **el depósito ya cargado con las fotos del borrador**, y guardar descarta el borrador —su `.md` a la papelera y su fila afuera— en la misma operación (C01.7.1). Lo mismo con una receta que llegó de Claude atada a un borrador (C01.9.2).
- [ ] **Nace con el tag `incompleta` puesto** (C04.4.1, C05.3.1): terminar es una declaración explícita, no el estado inicial. Una receta creada desde un borrador también.

### F04.3c — Lo desconocido se conserva

Si el `.md` traía claves o secciones que el esquema no reconoce, se conservan al
guardar. Pasar por el editor no puede hacer perder contenido que un agente o el
usuario escribieron afuera.

#### C04.3c.1 — Nada se pierde por pasar por el editor *(J8)*

- [ ] Las claves desconocidas del frontmatter se reescriben tal cual.
- [ ] Las secciones desconocidas del cuerpo se reescriben tal cual, en su posición.
- [ ] Un `## Fotos` mal formado —escrito afuera— es una sección desconocida más: se conserva tal cual y la receta queda sin depósito (C05.1.5).
- [ ] El editor no las muestra ni permite editarlas: no son suyas.
- [ ] Guardar una receta sin tocar ningún campo produce un archivo equivalente al original.

**Nota técnica:** Drive no tiene escritura parcial — guardar reescribe el `.md`
entero. Por eso conservar lo desconocido no es una mejora: si el editor no lo
conserva, lo borra.

### F04.3d — Las fotos de la receta

La ficha **Fotos**, después de Contenido: el depósito de la receta (C05.1.5),
donde se agregan y se sacan. **Una foto se pone en el texto desde el lugar**:
se pone el cursor en la línea y se elige la foto, que es el orden en que se
piensa mientras se escribe el paso.

**Nada toca Drive hasta Guardar** (C04.5.1): las fotos nuevas viven en memoria,
ya achicadas y con su número asignado.

#### C04.3d.1 — La ficha Fotos *(J7)*

- [ ] La fila de miniaturas del depósito, en su orden, **cada una con su número** —`#3`—, que es con el que se la nombra en el texto.
- [ ] **Cada miniatura dice en qué se usa** (`E05-Cimientos.md` C05.1.5), con un ícono por uso arriba a la derecha, sobre el mismo fondo oscuro que el número: la ficha con un señalador si es la portada, los tres renglones si está en un paso o un ingrediente, **los dos si es las dos cosas**. Una foto sin uso no lleva ninguna marca.
- [ ] **Debajo de la fila, el epígrafe dice qué significa cada marca**, con los íconos dibujados en línea con el texto: *«[portada] es la portada / [en el texto] está en un paso o un ingrediente / Las que no tienen marca solo se ven en el carrusel de la receta: para poner una en un paso, tocá el [imagen] que aparece al costado del renglón que estás escribiendo.»*
- [ ] Las marcas se rehacen en el momento: poner una foto de portada o en una línea la marca sin salir del editor.
- [ ] **Cámara**, **Galería** y **Por URL** al final, sin tope: la primera saca una foto nueva de a una, la segunda abre el selector del sistema y acepta varias a la vez, y la tercera la trae de una dirección (C04.3d.1b). Son los mismos tres de las fotos de un borrador (C01.2.4, C01.2.4b); lo único que cambia acá es que no hay tope.
- [ ] Cada foto nueva toma el número más alto más uno; ninguno se reusa, ni siquiera el de una que se sacó.
- [ ] Mientras se achica, el velo cubre la pantalla (R8): tarda, aunque no escriba nada en Drive.
- [ ] Una foto que el navegador no puede decodificar —HEIC, un archivo roto— no se agrega, y el aviso lo dice: *«No se pudo leer una de las fotos.»*
- [ ] Escribir `![](foto:2)` a mano en un campo de texto sigue valiendo: los campos no cambian.
- [ ] Salir sin guardar no deja nada en Drive: las fotos nuevas nunca llegaron.

#### C04.3d.1b — Una foto por URL *(J7)*

Una receta que se está copiando de un sitio trae su foto de ahí. **La app la
baja y la guarda como cualquier otra**: el link de un sitio ajeno se rompe
cuando el sitio la borra.

Es la misma ficha y el mismo camino en la captura y en el borrador
(C01.2.4b); lo único que no comparten es la salida de la que no se pudo bajar.

- [ ] **Por URL** abre una ficha al pie con un campo para la dirección y **Traer**.
- [ ] Lo que trae **es una foto más del depósito**: se achica y se sube al guardar, igual que una de la cámara (C04.3d.1). Nada toca Drive hasta Guardar.
- [ ] **Mientras la baja y la achica, el velo cubre la pantalla** (R8), y el pedido se corta solo si el sitio no contesta.
- [ ] **Si el sitio no la deja bajar** —CORS, que es lo habitual—, la URL **entra igual al depósito como link externo** (C05.1.5), y el aviso lo dice: *«No se pudo traer la foto —el sitio no lo permite o no hay conexión—: queda como link, y si el sitio la borra se pierde.»* No es un error: la foto entró, y el aviso va sin control, arriba del formulario y a la vista (R1). Sin red pasa lo mismo: desde el navegador no se distinguen. **Esto es propio de la receta**: su `.md` escribe una URL ajena como cualquier otra foto, y el borrador, que guarda ids de Drive, no la agrega (C01.2.4b).
- [ ] **Una dirección que no es una foto** —una página, un archivo que no existe, algo que no empieza con `http(s)://` o que lleva un espacio adentro— **no entra**: el aviso va en la ficha, que queda abierta con lo escrito (R1). **Una `http://` tampoco**, y su aviso lo dice: *«La dirección tiene que empezar con https://.»* Desde Pages es contenido mixto, así que no se puede bajar y la imagen tampoco cargaría después.
- [ ] **Sólo entra al depósito una URL que se pueda volver a leer**: la línea es `- <n>: <url>` con el esquema en minúsculas y sin espacios, y una que no tenga esa forma dejaría toda la sección `## Fotos` como sección ajena al reabrir la receta (C05.1.5).
- [ ] **El esquema en mayúsculas no se rechaza, se arregla:** `Https://` —lo que manda el teclado del teléfono con la primera letra— se escribe en minúsculas, y el chequeo de `http://` lo ve igual. El resto de la dirección se deja tal cual: distingue mayúsculas.
- [ ] **Cada intento limpia el aviso del anterior**: nunca quedan dos a la vez.
- [ ] Una foto bajada que el navegador no puede decodificar no se agrega, con el aviso de C04.3d.1.

#### C04.3d.2 — Qué se hace con una foto *(J7)*

- [ ] Tocar una miniatura abre una ficha al pie con tres acciones: **Ver**, **Portada** y **Sacar**. El velo o tocar afuera la cierran.
- [ ] **Ver** abre el visor (C03.5.3). **Portada** la pone de cabecera; si ya lo es, la acción no se dibuja.
- [ ] **Sacar** la saca del depósito y **borra sus referencias del texto**. Si era la portada, la cabecera queda vacía.

#### C04.3d.3 — Poner una foto en una línea *(J7)*

- [ ] En un campo de contenido con el foco aparece **un botón sin texto, con el ícono de foto, a la altura de la línea donde está el cursor**, pegado al borde derecho del campo (`design-system.md` §6.9b).
- [ ] **Con el depósito vacío el botón no se dibuja:** no hay foto que poner.
- [ ] El botón se va cuando el foco pasa a otro control, y se acomoda solo a medida que el cursor cambia de línea y a medida que el campo se desplaza por dentro.
- [ ] **Si el renglón del cursor quedó fuera de lo que se ve del campo**, el botón no se dibuja; el renglón a medio entrar lo corre para que quede adentro.
- [ ] **Tocar el botón no le saca el foco al campo:** el toque tiene que llegar al botón, y no perderse en el cambio de foco.
- [ ] Tocarlo abre una ficha al pie con **la galería del depósito y nada más**: elegir una escribe `![](foto:N)` al final de esa línea y cierra la ficha. **Desde ahí no se agregan fotos**: agregar es la ficha *Fotos* (C04.3d.1).
- [ ] En una línea vacía la referencia queda sola. Si la línea ya la tiene, no se repite.
- [ ] La línea es la que tenía el cursor cuando apareció el botón, y el texto es el que está escrito en ese momento en el formulario, no el del `.md` guardado.
- [ ] El botón y la ficha se agregan y se sacan del DOM **sin redibujar el formulario**: redibujarlo perdería lo escrito (C04.1.1).

### F04.4 — Declarar una receta terminada

El estado de la receta lo fija el usuario acá, sacando el tag `incompleta`, y
en ningún otro lado. La app no lo deduce del contenido (C05.3.1): sólo dice
cuándo se lo puede sacar.

#### C04.4.1 — El control *(J7)*

- [ ] Dentro del campo **«Tags»**, una fila con **un botón por tag especial**
  —`favorito`, `menú diario`, `probar` e `incompleta`, en ese orden—, arriba de
  los tags comunes y del campo para agregar. Apretado: la receta tiene el tag.
  Suelto: no lo tiene. Tocarlo lo pone o lo saca, con su `aria-pressed`. Cada
  botón lleva el ícono de su tag. No hay fila «Estado» ni otro control de
  completitud: es este botón.
- [ ] **Una receta nueva nace con `incompleta` puesto** (C04.3b.1): no está
  terminada hasta que alguien lo diga.
- [ ] `incompleta` **no se puede soltar** hasta que la receta cumpla C05.3.3
  —título, categoría, ingredientes y pasos—. Mientras no se pueda, queda
  **apretado y deshabilitado**, con la leyenda: *"Se va a poder sacar
  incompleta cuando se cargue: título, categoría, ingredientes y pasos."*
- [ ] La condición se revisa **mientras se escribe**, sin redibujar el
  formulario ni perder el foco.
- [ ] Si la receta deja de cumplirla —se borran los pasos, se vacía el
  título— mientras `incompleta` está suelto, el botón **vuelve a apretarse
  solo**.
- [ ] Sacar `incompleta` es una declaración del usuario, no una edición de
  contenido: es la única excepción del principio 3 entre los cuatro
  especiales, y es del usuario, no del agente. Los otros tres se ponen y
  sacan libremente.
- [ ] También se llega acá desde el chip `incompleta` de la receta abierta,
  que abre el editor (C03.1.3).

**Por qué apretado y no una casilla:** una casilla tiene un estado implícito
—lo que significa *no tildada*—. Apretado e invertido dice las dos cosas, y es
la misma convención para los cuatro especiales y para la duración (C04.2.1c).

### F04.5 — Guardar

Reescribe el `.md` en Drive y actualiza su fila en el índice.

#### C04.5.1 — Las dos escrituras *(J7)*

- [ ] Guardar escribe el `.md` entero y después la fila del índice, sincrónicamente (C05.4.1).
- [ ] **Con fotos, en este orden:** sube a `_fotos/` las nuevas y pone su link en su línea; escribe el `.md` y su fila; y recién después manda a la papelera las que se sacaron. Si algo falla en el medio, lo peor que queda es una foto huérfana en `_fotos/`, nunca una receta que nombra una foto borrada.
- [ ] **El reintento no resube:** una foto que ya se subió conserva su link y se escribe como está (R2).
- [ ] El guardado se declara exitoso recién cuando las dos terminaron.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces.
- [ ] El velo tapa la pantalla desde el toque (R8), antes de releer el `.md` de base para saber qué fotos se sacaron.
- [ ] Al terminar, vuelve a la receta, ya con lo guardado.

#### C04.5.2 — Cuando falla *(J7)*

- [ ] Avisa (R1) y **todo lo escrito queda en pantalla**, con las fotos nuevas que todavía viven en memoria.
- [ ] El reintento repite las dos escrituras (R2).
- [ ] Si falló la segunda, el `.md` ya está guardado y el reintento lo reescribe igual: no hay reparación parcial.
- [ ] Sesión vencida: el aviso ofrece reconectar y, al volver, el usuario reintenta a mano (R3).

### F04.6 — Borrar una receta

Borra el `.md` y su fila del índice. Es la única operación destructiva de la app
sobre contenido del usuario.

#### C04.6.1 — Borrar *(J7)*

- [ ] *Borrar receta*, con su tacho, va suelto al pie del formulario, a lo ancho y fuera de las fichas: es una acción destructiva, no un campo. En una receta nueva no aparece.
- [ ] Pide confirmación, y la confirmación nombra la receta. Toma el lugar del botón sin redibujar el formulario.
- [ ] Borra el `.md` de Drive y la fila del índice, y después manda a la papelera **sus fotos de `_fotos/`** (C05.1.5). Las externas y las que viven en otra carpeta no se tocan.
- [ ] Al terminar, vuelve a la lista de donde se venía.
- [ ] Si falla, avisa y la receta sigue estando (R1).
- [ ] Si el `.md` ya no existía, se borra la fila igual y no es un error.

**Nota técnica:** el archivo va a la papelera de Drive, no se destruye. La app no
ofrece deshacer: la papelera de Drive es la red de seguridad, y es del usuario.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C04.1.1, C04.2.1, C04.2.1b, C04.2.1c, C04.2.1d, C04.2.2, C04.2.3, C04.3.1, C04.3b.1, C04.3d.1, C04.3d.1b, C04.3d.2, C04.3d.3, C04.4.1, C04.5.1, C04.5.2, C04.6.1 | J7 |
| C04.3.2 | J4, J7 |
| C04.3.3 | J7, J8 |
| C04.3c.1 | J8 |

Ninguna capacidad de esta épica quedó sin job.
