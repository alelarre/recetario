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
reel, una página o un video abre una pantalla mínima de Recetario con la fuente
ya cargada, sin salir de donde estabas.

#### C01.1.1 — La app se registra como destino de compartir *(J2)*

- [ ] Recetario aparece en la hoja de compartir de Android una vez instalada como PWA.
- [ ] Acepta texto y URLs. Lo que llegue se toma como la fuente.
- [ ] Compartir abre la pantalla de captura, no la app entera.
- [ ] **Lo compartido puede ser una receta entera en `.md`**: en ese caso no
  se toma como fuente de un borrador, sigue la regla de C01.9.2.

**Nota técnica:** es la Share Target API del manifest, que funciona en una PWA
sin backend. Lo compartido llega por `GET`, en la query —`title`, `text` y
`url`—, y la app lo pasa a `#/capturar`. **iOS no se soporta** (R7): no existe
el equivalente y el Atajo queda fuera del alcance.

**Edge cases:** se comparte contenido sin URL —un texto pegado— → la fuente es
ese texto · se comparte una imagen → se toma su nombre o se deja la fuente vacía,
y el usuario la escribe.

### F01.2 — La pantalla de captura

Un campo obligatorio: **el título**, que escribe el usuario. La fuente viene de
lo compartido. Guardar agrega el borrador y devuelve a la app donde estabas.

No pide categoría, ni tags, ni dificultad. El presupuesto de la captura es un
campo y está gastado en el título, que es lo único que vuelve al borrador
recuperable.

**Y una nota opcional**, para lo que se sabe en el
momento y no entra en el título. No cuesta fricción —no bloquea Guardar— y es
lo que después se reparte en la receta (C01.7.1).

#### C01.2.1 — Un campo obligatorio, con el foco puesto *(J2)*

- [ ] La pantalla muestra la fuente ya cargada, sin permitir editarla acá.
- [ ] El título recibe el foco con el teclado abierto al abrirse la pantalla.
- [ ] El título es obligatorio: con el campo vacío, Guardar no está disponible.
- [ ] Debajo, un campo de **nota** opcional, de texto libre.
- [ ] No hay ningún otro campo: ni categoría, ni tags, ni dificultad.
- [ ] Junto a la nota, un **esbozo plegado** —*Estructura básica*— muestra cómo se estructura para que se reparta sola al convertir. Es referencia, no obligación: sin encabezados todo cae en la descripción.

#### C01.2.2 — Guardar devuelve a donde estabas *(J2)*

- [ ] Guardar escribe el `.md` del borrador y su fila (C01.4.2), y cierra la pantalla.
- [ ] El usuario vuelve a la app desde la que compartió. Recetario **no queda abierto**.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces.

#### C01.2.3 — Cancelar no deja nada *(J2)*

- [ ] Cancelar cierra la pantalla sin escribir nada y sin pedir confirmación.

### F01.3 — Registrar una fuente sin compartir

Cuando compartir no es posible —la foto de una página de un libro, algo que
alguien contó— se puede crear un borrador a mano desde la app.

#### C01.3.1 — Agregar a mano desde Borradores *(J2)*

- [ ] Borradores tiene un control para agregar a mano, **Nuevo**, visible también con la lista vacía.
- [ ] El formulario es el mismo de la captura, con la fuente **escrita a mano** y como texto libre: una URL o *"libro de pescados, pág. 84"*.
- [ ] El título es obligatorio; la fuente no.
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
es una receta incompleta: tiene título, fuente y nota, y un formato propio.

#### C01.4.1 — La lista *(J3)*

- [ ] Cada entrada muestra **el título y cuándo se capturó**. La fuente y la nota están adentro.
- [ ] El orden es por fecha de captura, **lo más viejo primero**: lo que lleva más tiempo esperando es lo que más riesgo corre.
- [ ] La lista sale de la hoja `borradores` del índice, en memoria: mostrarla no hace ningún pedido.

#### C01.4.2 — Un `.md` por borrador *(J2)*

- [ ] Cada borrador es un `.md` en `Recetario/_borradores/`: `titulo`, `fuente` y `capturado` en el frontmatter, y la nota como cuerpo. Es un formato propio, no el de una receta.
- [ ] El identificador del borrador es el id del archivo en Drive.
- [ ] La hoja `borradores` de `_indice` tiene una fila por borrador: `id_archivo`, `nombre_archivo`, `titulo` y `capturado`. Capturar agrega una fila; descartar y convertir borran una; editar reescribe la suya. Reindexar la rearma desde la carpeta.
- [ ] Editar un borrador reescribe su `.md` y su fila, con los tres campos editables, y conserva cuándo se capturó.

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

Muestra su título, su fuente y su nota, y permite: ir a la fuente, editarlo,
descartarlo, mandarlo a Claude para convertirlo (F01.9) o crear la receta a
mano. La conversión desde la fuente ocurre afuera, en una sesión con Claude.

#### C01.6.1 — Lo que se ve *(J3)*

- [ ] Título, fuente, cuándo se capturó y la nota, si tiene.
- [ ] **Ir a la fuente** abre la URL fuera de la app. Si la fuente no es una URL, el control no aparece.
- [ ] **Editar** abre el mismo formulario con el que se creó, precargado: título, fuente y nota, los tres editables. Va arriba a la derecha, en el encabezado.
- [ ] **Crear la receta** abre el editor con lo que el borrador tenía (C01.6.3).
- [ ] **La app no llama a ningún modelo**: **«Convertir con Claude»** arma el
  pedido y lo manda afuera, a una sesión de Claude, y **«Pegar receta»** trae
  la respuesta (F01.9). Lo que la app ofrece sin salir de ella es escribir la
  receta a mano, con **«Crear la receta»**.
- [ ] Las acciones van en este orden: *Ir a la fuente*, *Descartar*,
  *Convertir con Claude*, *Pegar receta* y *Crear la receta*.

#### C01.6.2 — Descartar pide confirmación *(J3)*

- [ ] Descartar pregunta antes.
- [ ] Confirmado, manda el `.md` a la papelera de Drive, borra su fila y vuelve a Borradores.
- [ ] Si falla, avisa y el borrador sigue ahí (R1).

#### C01.6.3 — Crear la receta desde el borrador *(J3)*

- [ ] Abre el editor de receta nueva (C04.3b.1) con el título y la `fuente` del borrador ya cargados.
- [ ] **La nota se lee como si fuera el `.md` de la receta**: lo que esté bajo `## Ingredientes`, `## Preparación`, `## Variaciones` o `## Notas` cae en su campo, y el texto suelto de arriba queda como descripción. Sin encabezados, todo va a la descripción.
- [ ] Hay que elegir la categoría, como en cualquier receta nueva.
- [ ] Guardar invoca la operación de conversión de la capa compartida (C01.7.1): escribe el `.md`, escribe la fila del índice y **descarta el borrador**, en una sola operación.
- [ ] Salir sin guardar deja el borrador intacto.
- [ ] Es el alcance del editor y no otro: sirve para una receta que ya tenés en la cabeza. Transcribir el video o el PDF de la fuente sigue siendo trabajo del agente.

### F01.7 — El borrador desaparece al convertirse

Convertir es **una sola operación de la capa compartida**: escribe el `.md`,
escribe la fila del índice y descarta el borrador —su `.md` a la papelera y su fila afuera—. La invocan tanto la app
como el agente, y nadie borra el borrador por separado.

Su fuente sobrevive en la receta; no queda copia.

#### C01.7.1 — Convertir es una operación, no tres *(J3)*

- [ ] La operación escribe el `.md`, escribe la fila del índice, manda el `.md` del borrador a la papelera y borra su fila, en ese orden.
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
- [ ] **El título escrito queda en pantalla** y se puede reintentar.
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
- [ ] **Con el menú Compartir del sistema** (Android): se abre con el pedido
  como texto y se elige Claude.
- [ ] **Sin él** (Chrome en la Mac): abre `https://claude.ai/new?q=<pedido
  codificado>` si entra en 8.000 caracteres. Si no entra, copia el pedido al
  portapapeles, abre `https://claude.ai/new` vacío y avisa **«Pedido
  copiado: pegalo en Claude»**. Si tampoco se puede copiar, avisa **«No pude
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
- [ ] Si el navegador no deja leer el portapapeles, avisa **«No pude leer lo
  copiado.»**, sin abrir nada.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C01.1.1, C01.2.1, C01.2.2, C01.2.3, C01.3.1, C01.4.2, C01.8.1, C01.8.2 | J2 |
| C01.4.1, C01.4.3, C01.5.1, C01.6.1, C01.6.2, C01.6.3, C01.7.1, C01.9.1, C01.9.3 | J3 |
| C01.9.2 | J2, J3 |

Ninguna capacidad de esta épica quedó sin job.
