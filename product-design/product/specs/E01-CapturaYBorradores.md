# E01 — Captura y Borradores

**Versión:** 3.2 · **Fecha:** 2026-09-16 · **Estado:** Final — Hito 11
**Jobs:** J2, J3 · **Prioridad:** la más alta · **Flujos:** F1, F2

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas. Acá se anota solo lo
que se aparta o lo que necesita precisarse.

---

## La épica

Cerrar el limbo. Hoy, entre encontrar una receta y tenerla en el recetario, hay
un espacio de reels guardados, notas sueltas y links en el navegador donde
**confirmadamente se pierden recetas**. Ninguna versión de Recetario atendió
esto, y ninguno de los siete competidores del análisis tampoco: todos importan
desde una página web, y las fuentes reales son videos, PDFs y libros de papel.

La épica cubre las dos etapas: **capturar** sin cortar lo que estabas haciendo, y
**esperar** en un lugar propio hasta que haya tiempo de convertir.

Es el flujo más crítico del producto: si falla, Recetario no resuelve lo que dice
resolver.

---

## Features

### F01.1 — Compartir hacia Recetario

Recetario aparece en la hoja de "Compartir" del sistema operativo. Compartir un
reel, una página, un video o fotos abre una pantalla mínima de Recetario con la
fuente o las fotos ya cargadas, sin salir de donde estabas.

#### C01.1.1 — La app se registra como destino de compartir *(J2)*

- [ ] Recetario aparece en la hoja de compartir de Android una vez instalada como PWA.
- [ ] Acepta texto, URLs e imágenes. **La fuente es el link**: `url` si vino; si no, el primer link que aparezca en el texto. **Lo que sobra del texto va a la nota**, sin el link. El título que manda la app de origen se ignora: suele ser el de la página, no el de la receta.
- [ ] Compartir abre la pantalla de captura, no la app entera.
- [ ] **Las fotos compartidas** —de la cámara, Fotos, una galería— llegan a la
  captura como miniaturas (C01.2.4). Se toman las primeras 5; si llegaron más,
  la captura avisa **«Llegaron 8 fotos: se guardan las primeras 5.»**
- [ ] **Lo compartido puede ser una receta entera en `.md`**: en ese caso no
  se toma como fuente de un borrador, sigue la regla de C01.9.2.

**Nota técnica:** es la Share Target API del manifest, que funciona en una PWA
sin backend. Lo compartido llega por `POST` `multipart/form-data` a
`/recetario/compartir` —`title`, `text` y `url`, cada uno en su propio campo,
y las imágenes en `fotos`—, y lo atiende el service worker: guarda las fotos
en el caché `recetario-compartido` (`compartido/0`, `compartido/1`…, sin lo
de un envío anterior) y redirige con un 303 a
`#/capturar?url=…&text=…&fotos=<cantidad>`. La captura saca las fotos del
caché y lo borra. Casi todas las apps mandan el link dentro de `text`. El
manifest lo lee Android al instalar la PWA: un cambio ahí pide reinstalarla.
Una instalación vieja manda por `GET`, en la query, y la app lo sigue
pasando a `#/capturar`. **iOS no se soporta** (R7): no existe
el equivalente y el Atajo queda fuera del alcance.

**Edge cases:** se comparte un texto sin link —una receta copiada de un
chat— → no hay fuente y el texto entero va a la nota · se comparte un texto
que es sólo el link → la nota queda vacía · archivos que no son imágenes no se
aceptan: Recetario no aparece en la hoja de compartir para ellos · una foto que
el navegador no puede leer —HEIC, un archivo roto— no se agrega, y se avisa
**«No se pudo leer una de las fotos.»**

### F01.2 — La pantalla de captura

Ningún campo es obligatorio por sí solo: **el borrador necesita fuente, nota
o fotos**, algo de dónde salir. Lo compartido ya trae alguna, así que
compartir y tocar Guardar alcanza. Guardar agrega el borrador y devuelve a la
app donde estabas.

No pide categoría, ni tags, ni dificultad. **El título es opcional**: si queda
vacío, el borrador se llama por cuándo se capturó —*Borrador 19/09 14:30*— y
se le puede poner uno después, con *Editar*.

**La nota** es lo que se sabe en el momento: llega precargada con el texto que
acompañaba al link, y es lo que después se reparte en la receta (C01.7.1).

#### C01.2.1 — Fuente, nota o fotos, y el título con el foco puesto *(J2)*

- [ ] La pantalla muestra la fuente ya cargada, sin permitir editarla acá. Sin link, no hay fuente que mostrar.
- [ ] El título, **opcional**, recibe el foco con el teclado abierto al abrirse la pantalla. Guardado vacío, el borrador se titula *Borrador dd/mm hh:mm*, con el momento en que se guardó.
- [ ] Debajo, un campo de **nota**, de texto libre, precargado con lo que sobró del texto compartido.
- [ ] Guardar está disponible con fuente, con nota o con al menos una foto; sin nada de eso, no.
- [ ] Debajo de la nota, **Fotos** (C01.2.4).
- [ ] No hay ningún otro campo: ni categoría, ni tags, ni dificultad.
- [ ] Junto a la nota, un **esbozo plegado** —*Estructura básica*— muestra cómo se estructura para que se reparta sola al convertir. Es referencia, no obligación: sin encabezados todo cae en la descripción.

#### C01.2.2 — Guardar devuelve a donde estabas *(J2)*

- [ ] Guardar sube las fotos, en orden, y después escribe el `.md` del borrador con sus ids y su fila (C01.4.2), y cierra la pantalla.
- [ ] El usuario vuelve a la app desde la que compartió. Recetario **no queda abierto**.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces.

#### C01.2.3 — Cancelar no deja nada *(J2)*

- [ ] Cancelar cierra la pantalla sin escribir nada y sin pedir confirmación.

#### C01.2.4 — Las fotos de la captura *(J2)*

- [ ] Un borrador lleva **hasta 5 fotos**: una página de un libro, una receta
  escrita a mano, una captura de pantalla.
- [ ] Se ven como una fila de miniaturas cuadradas, cada una con su ×, y al
  final dos botones, **Cámara** y **Galería**: el primero lleva directo a
  sacar una foto nueva, con una foto por vez; el segundo abre el selector del
  sistema y acepta varias a la vez. Con 5 fotos, ninguno de los dos se
  dibuja; si se eligen más de las que entran, se agregan las primeras y se
  avisa.
- [ ] **Antes de guardar, se achican**: el lado mayor a 1600 px, en JPEG. Viven
  en memoria hasta Guardar.
- [ ] Editando un borrador, la pantalla no las muestra: se manejan en la vista
  del borrador (C01.6.4).

### F01.3 — Registrar una fuente sin compartir

Cuando compartir no es posible —la foto de una página de un libro, algo que
alguien contó— se puede crear un borrador a mano desde la app.

#### C01.3.1 — Agregar a mano desde Borradores *(J2)*

- [ ] Borradores tiene un control para agregar a mano, **Nuevo**, visible también con la lista vacía.
- [ ] El formulario es el mismo de la captura, con la fuente **escrita a mano** y como texto libre: una URL o *"libro de pescados, pág. 84"*.
- [ ] Hace falta fuente, nota o una foto; el título es opcional, con la misma regla que la captura (C01.2.1). Editar un borrador sigue la misma regla, y un título borrado vuelve a ser el de su fecha de captura.
- [ ] Guardar deja el borrador en Borradores y vuelve a la lista, que ya lo muestra.
- [ ] Agregado a mano, el formulario es una pantalla más de la app: lleva encabezado y volver. Compartido desde otra app, no —es efímero sobre lo que estabas haciendo (C01.2.2)—.

### F01.4 — Borradores

Uno de los dos lugares primarios. Lista los borradores que esperan, con su
título y cuándo entraron.
La fuente y la nota se ven adentro del borrador: en la fila competían con el
título, que es lo que se busca al recorrer la lista.

**Cada borrador es un `.md` en `Recetario/_borradores/`**, y la lista sale de la
hoja `borradores` de `_indice`: capturar escribe un archivo chico y una fila. Como
hoja del índice, hereda su copia local y el reindexado (C05.4.2). Un borrador no
es una receta incompleta: tiene título, fuente, nota y fotos, y un formato propio.

#### C01.4.1 — La lista *(J3)*

- [ ] Cada entrada muestra **el título y cuándo se capturó**. La fuente y la nota están adentro.
- [ ] El orden es por fecha de captura, **lo más viejo primero**: lo que lleva más tiempo esperando es lo que más riesgo corre.
- [ ] La lista sale de la hoja `borradores` del índice, en memoria: mostrarla no hace ningún pedido.

#### C01.4.2 — Un `.md` por borrador *(J2)*

- [ ] Cada borrador es un `.md` en `Recetario/_borradores/`: `titulo`, `fuente`, `capturado` y `fotos` en el frontmatter, y la nota como cuerpo. Es un formato propio, no el de una receta.
- [ ] **Las fotos van al lado del `.md`**, en `_borradores/`, como `.jpg` con el nombre del `.md` y un número —`tarta-de-la-abuela-1.jpg`, `-2.jpg`…—; una foto agregada después toma el primer número libre. El número es para que en Drive se lean juntas: el orden es el de `fotos`, la lista de sus ids. Sin fotos, la clave no se escribe.
- [ ] Las fotos no entran al índice ni al reindexado: una foto no es un `.md`.
- [ ] El identificador del borrador es el id del archivo en Drive.
- [ ] La hoja `borradores` de `_indice` tiene una fila por borrador: `id_archivo`, `nombre_archivo`, `titulo` y `capturado`. Capturar agrega una fila; descartar y convertir borran una; editar reescribe la suya. Reindexar la rearma desde la carpeta.
- [ ] Editar un borrador reescribe su `.md` y su fila, con los tres campos editables, y conserva cuándo se capturó y sus fotos.

#### C01.4.3 — Estados de Borradores *(J3)*

- [ ] Vacía: *"No hay nada esperando."* y el control de agregar a mano. Sin ilustración.
- [ ] Sin red: el aviso de R1. **Borradores no se dibuja con datos de antes.**
- [ ] Un borrador que el agente convirtió mientras Borradores estaba abierto sigue en pantalla hasta volver a entrar (R6).

### F01.5 — El contador

La entrada a Borradores lleva cuántos borradores esperan. Es lo que evita que el
limbo se reproduzca adentro del producto.

#### C01.5.1 — El contador en el Recetario *(J3)*

- [ ] El número de borradores va sobre el botón del menú, arriba a la izquierda del Recetario, y junto a *Borradores* dentro del menú lateral: con el menú cerrado, es lo que dice que hay algo esperando.
- [ ] En cero, la entrada sigue visible sin número: Borradores no desaparece.
- [ ] Es un aviso sin acción: no interrumpe, no abre nada solo, no cambia de color para alarmar.
- [ ] El número sale de la misma lectura que usa Borradores; no se pide aparte.

### F01.6 — Abrir un borrador

Muestra su título, su fuente, su nota y sus fotos, y permite: ir a la fuente, editarlo,
descartarlo, mandarlo a Claude para convertirlo (F01.9) o crear la receta a
mano. La conversión desde la fuente ocurre afuera, en una sesión con Claude.

#### C01.6.1 — Lo que se ve *(J3)*

- [ ] Título, fuente, cuándo se capturó, la nota, si tiene, y debajo, **Fotos** (C01.6.4).
- [ ] **Ir a la fuente** abre la URL fuera de la app. Si la fuente no es una URL, el control no aparece.
- [ ] **Editar** abre el mismo formulario con el que se creó, precargado: título, fuente y nota, los tres editables. Va arriba a la derecha, en el encabezado.
- [ ] Salir de la edición con cambios sin guardar —el volver del encabezado o el gesto de atrás— pregunta *«¿Salir sin guardar los cambios?»*, como el editor de recetas (C04.1.1). Desde el volver, salir deja el borrador en pantalla; desde el gesto de atrás, sigue a donde iba. *Cancelar* no pregunta.
- [ ] **Crear la receta** abre el editor con lo que el borrador tenía (C01.6.3).
- [ ] **La app no llama a ningún modelo**: **«Convertir con Claude»** arma el
  pedido y lo manda afuera, a una sesión de Claude, y **«Pegar receta»** trae
  la respuesta (F01.9). Lo que la app ofrece sin salir de ella es escribir la
  receta a mano, con **«Crear la receta»**.
- [ ] Las acciones van en este orden: *Ir a la fuente*, *Descartar*,
  *Convertir con Claude*, *Pegar receta* y *Crear la receta*.

#### C01.6.2 — Descartar pide confirmación *(J3)*

- [ ] Descartar pregunta antes.
- [ ] Confirmado, manda sus fotos y el `.md` a la papelera de Drive, borra su fila y vuelve a Borradores. Una foto que ya no está en Drive no es un error.
- [ ] Si falla, avisa y el borrador sigue ahí (R1).

#### C01.6.3 — Crear la receta desde el borrador *(J3)*

- [ ] Abre el editor de receta nueva (C04.3b.1) con el título y la `fuente` del borrador ya cargados.
- [ ] **El depósito de la receta abre con las fotos del borrador**, todas, en su orden, como `1`, `2`, `3`… (C05.1.5). Las que no sirven se sacan de a una, como cualquier otra (C04.3d.2).
- [ ] **La nota se lee como si fuera el `.md` de la receta**: lo que esté bajo `## Ingredientes`, `## Preparación`, `## Variaciones` o `## Notas` cae en su campo, y el texto suelto de arriba queda como descripción. Sin encabezados, todo va a la descripción.
- [ ] Hay que elegir la categoría, como en cualquier receta nueva.
- [ ] Guardar invoca la operación de conversión de la capa compartida (C01.7.1): escribe el `.md`, escribe la fila del índice y **descarta el borrador**, en una sola operación.
- [ ] Salir sin guardar deja el borrador intacto.
- [ ] Es el alcance del editor y no otro: sirve para una receta que ya tenés en la cabeza. Transcribir el video o el PDF de la fuente sigue siendo trabajo del agente.

#### C01.6.4 — Las fotos del borrador *(J3)*

- [ ] Las miniaturas en una fila, en el orden de `fotos`, cada una con su ×, y
  **Cámara** y **Galería** al final mientras haya menos de 5 (C01.2.4).
- [ ] Tocar una miniatura abre el **visor**: la foto al ancho de la pantalla,
  sobre un velo. Se cierra tocando cualquier lado.
- [ ] Agregar achica la foto, la sube al lado del `.md` y lo reescribe con la
  lista nueva, en el momento y con el velo de escritura (R8). Se agregan al
  final; no se reordenan.
- [ ] La × manda la foto a la papelera de Drive y reescribe el `.md`, también
  con el velo y sin confirmación: se recupera desde la papelera.
- [ ] **Las fotos se piden a Drive con el token** y quedan en Cache Storage,
  en `recetario-imagenes`, por id de archivo: un id de Drive no cambia de
  contenido, así que lo guardado no vence. *Borrar datos locales* y *Salir*
  borran ese caché y el de lo compartido.
- [ ] Una foto que ya no está en Drive se dibuja como un recuadro vacío con
  **«La foto ya no está en Drive.»**; la × la saca de la lista.
- [ ] Si subir o sacar falla, avisa y el borrador sigue como estaba (R1).

### F01.7 — El borrador desaparece al convertirse

Convertir es **una sola operación de la capa compartida**: escribe el `.md`,
escribe la fila del índice y descarta el borrador —sus fotos y su `.md` a la
papelera y su fila afuera—, salvo las fotos que la receta se quedó. La invocan
tanto la app como el agente, y nadie borra el borrador por separado.

Su fuente sobrevive en la receta; no queda copia.

#### C01.7.1 — Convertir es una operación, no tres *(J3)*

- [ ] La operación escribe el `.md`, escribe la fila del índice, manda las fotos y el `.md` del borrador a la papelera y borra su fila, en ese orden.
- [ ] **Las fotos del borrador que siguen en el depósito de la receta no se descartan: se mudan.** Antes de escribir el `.md` pasan de `_borradores/` a `_fotos/` y se renombran con el nombre del `.md` y su número; el id no cambia, así que el link y el caché siguen valiendo. Sólo van a la papelera las que se sacaron.
- [ ] La `fuente` del borrador pasa al frontmatter de la receta, y la nota a los campos que nombra (C01.6.3).
- [ ] Si alguno de los pasos falla, el reintento repite todos (R2): reescribir el `.md`, reemplazar la fila y borrar el borrador son idempotentes.
- [ ] Nadie borra un borrador convertido "a mano" desde otro lado.
- [ ] La invocan las dos partes: el agente al convertir afuera, y la app cuando se guarda una receta creada desde un borrador (C01.6.3).

**Edge case:** el borrador ya no existe cuando la operación intenta borrarlo →
no es un error, la operación termina bien.

### F01.8 — Fallo de captura sin red

Si no hay red, la captura falla y avisa. El texto queda en pantalla para
reintentar. **No hay cola local ni guardado offline**: el borrador nace como
`.md` en Drive o no nace.

Es el único punto donde el producto acepta a sabiendas un riesgo sobre este job.

#### C01.8.1 — Falla, lo dice, y no pierde lo escrito *(J2)*

- [ ] El aviso dice que no se pudo guardar. Sin el error crudo.
- [ ] **El título escrito queda en pantalla**, con las fotos, y se puede reintentar. Las fotos que ya se subieron no se vuelven a subir.
- [ ] La pantalla no se cierra sola después del error.
- [ ] No se promete guardar más tarde.

#### C01.8.2 — Sin sesión en la captura *(J2)*

- [ ] Si el token venció, el aviso dice que hay que conectarse de nuevo y ofrece el control (R3).
- [ ] Al volver, el título escrito sigue ahí y el usuario reintenta a mano.
- [ ] Es el peor caso de este flujo y el mensaje lo dice claro, sin tecnicismos.

### F01.9 — Convertir con Claude

La app no llama a ningún modelo: arma el pedido con las reglas del formato,
Claude lee la fuente del borrador y contesta con el `.md`, y esa respuesta
vuelve a la app compartida o pegada. La vuelta no depende de la ida:
**cualquier receta en `.md` que llega a la app abre el editor**, tenga o no
un borrador detrás.

#### C01.9.1 — El botón arma el pedido *(J3)*

- [ ] En el borrador, **«Convertir con Claude»** (C01.6.1).
- [ ] El pedido lleva el título, la fuente y la nota del borrador tal cual, y
  las reglas del formato armadas desde las mismas constantes que usa la
  app —duraciones, dificultades, tags reservados—, así no se desactualiza
  cuando cambia el esquema.
- [ ] La última línea del frontmatter que pide es `borrador: <id>`. La
  categoría no viaja: se elige en el editor.
- [ ] **Con fotos**, el pedido suma después del borrador cuántas van y en qué
  orden, qué pueden ser —páginas de un libro, una receta escrita a mano, una
  captura, el plato terminado—, que se transcriba lo que se lee sin inventar
  cantidades ni pasos, y que una foto del plato sirve para el título y la
  descripción, no para la receta.
- [ ] **Y le dice cómo nombrarlas en la receta:** esas fotos son `foto:1`,
  `foto:2`… en el mismo orden; la del plato terminado va como `foto: foto:N`;
  la de un paso, como `![](foto:N)` al final de ese paso; y la sección Fotos no
  la escribe él, la arma la app (C05.1.5). Así la receta que vuelve ya trae la
  portada y las referencias, y el depósito del editor las resuelve.
- [ ] **Con el menú Compartir del sistema** (Android): se abre con el pedido
  como texto, y las fotos como archivos (`foto-1.jpg`…), y se elige Claude.
- [ ] **Sin menú Compartir, o sin poder compartir archivos**, el pedido suma
  una línea por foto con su link de Drive —`Foto 1:
  https://drive.google.com/file/d/<id>/view`— y **«Las fotos están en mi
  Google Drive: leelas con el conector de Drive.»** El conector tiene que estar
  en la misma cuenta.
- [ ] **Sin él** (Chrome en la Mac): abre `https://claude.ai/new?q=<pedido
  codificado>` si entra en 8.000 caracteres. Si no entra, copia el pedido al
  portapapeles, abre `https://claude.ai/new` vacío y avisa **«Pedido
  copiado: pegalo en Claude»**. Si tampoco se puede copiar, avisa **«No se pudo
  abrir Claude ni copiar el pedido.»**
- [ ] El pedido pide la respuesta en markdown, como texto plano y sin nada
  antes ni después, dentro de un bloque de código o una cita si hace falta
  para que no se le aplique formato.

#### C01.9.2 — Reconocer la receta que vuelve *(J2, J3)*

- [ ] Antes de mirarlo, a lo recibido se le saca el envoltorio: si trae un
  bloque de código, vale su contenido; si todo viene citado con `>`, se saca
  la cita.
- [ ] Un texto es una receta si, sin espacios al principio, empieza con un
  frontmatter cerrado —`---` … `---`— con una línea `titulo:` adentro.
  Cualquier otra cosa sigue el camino que ya tenía: se captura como borrador
  (C01.2.1), o el aviso de C01.9.3 si llegó pegado.
- [ ] Lo que llega **con `borrador: <id>` de un borrador que existe** abre el
  editor atado a ese borrador (C01.6.3), con la receta ya cargada.
- [ ] **Sin id, o con uno que ya no existe**, abre **«¿De qué borrador es
  esta receta?»**: la lista de borradores por título y **«Ninguno»**. Elegir
  un borrador ata el editor a él; «Ninguno» lo abre como receta nueva.
  Volver descarta lo recibido.
- [ ] En el editor, **la clave `borrador` no se muestra ni se guarda**; la
  categoría queda sin elegir y la receta nace con `incompleta` (C04.3b.1),
  como cualquier receta nueva; cuenta como cambios sin guardar desde que se
  abre (C04.1.1).
- [ ] **Guardar**: atada a un borrador, la operación de conversión de la
  capa compartida (C01.7.1); sin borrador, se crea como cualquier receta
  nueva (C04.3b.1).

#### C01.9.3 — Pegar receta *(J3)*

- [ ] **«Pegar receta»** lee el portapapeles: está en el borrador y en
  Borradores.
- [ ] **Desde el borrador**, ata el editor a ese borrador aunque el texto
  traiga otro id. **Desde Borradores**, sigue la misma regla que recibir por
  Compartir (C01.9.2): el id si lo trae y existe, la pregunta si no.
- [ ] Lo pegado que no es una receta avisa **«Lo copiado no es una receta en
  .md.»**, sin abrir nada.
- [ ] Si el navegador no deja leer el portapapeles, avisa **«No se pudo leer lo
  copiado.»**, sin abrir nada.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C01.1.1, C01.2.1, C01.2.2, C01.2.3, C01.2.4, C01.3.1, C01.4.2, C01.8.1, C01.8.2 | J2 |
| C01.4.1, C01.4.3, C01.5.1, C01.6.1, C01.6.2, C01.6.3, C01.6.4, C01.7.1, C01.9.1, C01.9.3 | J3 |
| C01.9.2 | J2, J3 |

Ninguna capacidad de esta épica quedó sin job.
