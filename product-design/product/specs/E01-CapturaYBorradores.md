# E01 — Captura y Borradores

**Versión:** 3.1 · **Fecha:** 2026-09-12 · **Estado:** Final — Hito 11
**Jobs:** J2, J3 · **Prioridad:** la más alta · **Flujos:** F1, F2

> **Cambios en la 3.1 (2026-09-12):** salieron de implementar el rediseño y
> mirarlo andando. El borrador suma una **nota** de texto libre (C01.2.1) que se
> guarda en una quinta columna de la planilla (C01.4.2); la **fuente es editable**
> como cualquier otro campo (C01.6.1); la fila de la lista muestra **sólo el
> título** (C01.4.1); y crear la receta desde el borrador **parsea la nota** como
> cuerpo de receta (C01.6.3, C01.7.1).
>
> **Cambios en la 3.0 (Hito 11):** vocabulario y estado final. Ninguna capacidad
> cambió: E01 no existe en la implementación actual, así que se construye entera
> desde acá (`plan/delta-implementacion.md` §2.4).
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. **Borradores pasa a ser una planilla, una fila por
> borrador** (antes: un archivo único con N entradas). Se agrega **crear la
> receta desde el borrador** (C01.6.3), que es la única vía por la que la app
> invoca la conversión. El Atajo de iOS sale del alcance (R7).

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

**Nota técnica:** es la Share Target API del manifest, que funciona en una PWA
sin backend. **iOS no se soporta** (R7): no existe el equivalente y el Atajo
queda fuera del alcance.

**Edge cases:** se comparte contenido sin URL —un texto pegado— → la fuente es
ese texto · se comparte una imagen → se toma su nombre o se deja la fuente vacía,
y el usuario la escribe.

### F01.2 — La pantalla de captura

Un campo obligatorio: **el título**, que escribe el usuario. La fuente viene de
lo compartido. Guardar agrega el borrador y devuelve a la app donde estabas.

No pide categoría, ni tags, ni dificultad. El presupuesto de la captura es un
campo y está gastado en el título, que es lo único que vuelve al borrador
recuperable.

**Y una nota opcional** `[cambio del 2026-09-12]`, para lo que se sabe en el
momento y no entra en el título. No cuesta fricción —no bloquea Guardar— y es
lo que después se reparte en la receta (C01.7.1).

#### C01.2.1 — Un campo obligatorio, con el foco puesto *(J2)*

- [ ] La pantalla muestra la fuente ya cargada, sin permitir editarla acá.
- [ ] El título recibe el foco con el teclado abierto al abrirse la pantalla.
- [ ] El título es obligatorio: con el campo vacío, Guardar no está disponible.
- [ ] Debajo, un campo de **nota** opcional, de texto libre.
- [ ] No hay ningún otro campo: ni categoría, ni tags, ni dificultad.
- [ ] Junto a la nota, un **esbozo plegado** muestra cómo se estructura para que se reparta sola al convertir. Es referencia, no obligación: sin encabezados todo cae en la descripción.

#### C01.2.2 — Guardar devuelve a donde estabas *(J2)*

- [ ] Guardar escribe la fila del borrador y cierra la pantalla.
- [ ] El usuario vuelve a la app desde la que compartió. Recetario **no queda abierto**.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces.

#### C01.2.3 — Cancelar no deja nada *(J2)*

- [ ] Cancelar cierra la pantalla sin escribir nada y sin pedir confirmación.

### F01.3 — Registrar una fuente sin compartir

Cuando compartir no es posible —la foto de una página de un libro, algo que
alguien contó— se puede crear un borrador a mano desde la app.

#### C01.3.1 — Agregar a mano desde Borradores *(J2)*

- [ ] Borradores tiene un control **Agregar a mano**, visible también con la lista vacía.
- [ ] El formulario es el mismo de la captura, con la fuente **escrita a mano** y como texto libre: una URL o *"libro de pescados, pág. 84"*.
- [ ] El título es obligatorio; la fuente no.
- [ ] Guardar deja el borrador en Borradores y vuelve a la lista, que ya lo muestra.
- [ ] Agregado a mano, el formulario es una pantalla más de la app: lleva encabezado y volver. Compartido desde otra app, no —es efímero sobre lo que estabas haciendo (C01.2.2)—.

### F01.4 — Borradores

Uno de los dos lugares primarios. Lista los borradores que esperan, con su
título y cuándo entraron. `[cambio del 2026-09-12: la fuente salió de la fila]`
La fuente y la nota se ven adentro del borrador: en la fila competían con el
título, que es lo que se busca al recorrer la lista.

**Es una planilla en Drive, una fila por borrador.** `[cambio en la 2.0]` No es
una carpeta con un archivo por borrador, ni un archivo único que haya que
reescribir entero para agregar una línea: capturar escribe una fila. Es el mismo
argumento que eligió planilla para el índice — Drive no tiene escritura parcial.

**No entra al índice:** es otra planilla, y una cola de trabajo no es un archivo
consolidado.

#### C01.4.1 — La lista *(J3)*

- [ ] Cada entrada muestra **el título y cuándo se capturó**. La fuente y la nota están adentro.
- [ ] El orden es por fecha de captura, **lo más viejo primero**: lo que lleva más tiempo esperando es lo que más riesgo corre.
- [ ] La lista se lee de una sola vez: una lectura de la planilla, sin paginar.

#### C01.4.2 — Escritura por fila *(J2)*

- [ ] Capturar agrega una fila; descartar borra una fila; convertir borra una fila. Ninguna operación reescribe la planilla entera.
- [ ] Cada borrador tiene un identificador propio que no depende de su posición.
- [ ] Las columnas son `id`, `titulo`, `fuente`, `capturado` y `nota` `[la última, del 2026-09-12]`. Una planilla escrita antes se lee igual: la celda falta y la nota queda vacía.
- [ ] Editar un borrador reescribe **su** fila, con los tres campos editables.

**Nota técnica:** con un solo usuario, dos capturas simultáneas no ocurren. La
escritura por fila lo vuelve inofensivo igualmente.

#### C01.4.3 — Estados de Borradores *(J3)*

- [ ] Vacía: *"No hay nada esperando."* y el control de agregar a mano. Sin ilustración.
- [ ] Sin red: el aviso de R1. **Borradores no se dibuja con datos de antes.**
- [ ] Un borrador que el agente convirtió mientras Borradores estaba abierto sigue en pantalla hasta volver a entrar (R6).

### F01.5 — El contador

La entrada a Borradores lleva cuántos borradores esperan. Es lo que evita que el
limbo se reproduzca adentro del producto.

#### C01.5.1 — El contador en el Recetario *(J3)*

- [ ] La entrada a Borradores, arriba a la derecha del Recetario, muestra el número de borradores.
- [ ] En cero, la entrada sigue visible sin número: Borradores no desaparece.
- [ ] Es un aviso sin acción: no interrumpe, no abre nada solo, no cambia de color para alarmar.
- [ ] El número sale de la misma lectura que usa Borradores; no se pide aparte.

### F01.6 — Abrir un borrador

Muestra su título y su fuente, y permite: ir a la fuente, editar el título o
descartarlo. La conversión en sí ocurre afuera, en una sesión con el agente.

#### C01.6.1 — Lo que se ve *(J3)*

- [ ] Título, fuente, cuándo se capturó y la nota, si tiene.
- [ ] **Ir a la fuente** abre la URL fuera de la app. Si la fuente no es una URL, el control no aparece.
- [ ] **Editar** abre el mismo formulario con el que se creó, precargado: título, fuente y nota, los tres editables. `[cambio del 2026-09-12: antes sólo el título, y la fuente no se editaba]`
- [ ] **Crear la receta** abre el editor con lo que el borrador tenía (C01.6.3).
- [ ] **No hay botón de "convertir" que llame a un agente**: el agente no vive adentro de la app y prometerlo sería mentir. Lo que la app ofrece es escribir la receta a mano, que es lo que sabe hacer.

#### C01.6.2 — Descartar pide confirmación *(J3)*

- [ ] Descartar pregunta antes: es destructivo y no hay papelera.
- [ ] Confirmado, borra la fila y vuelve a Borradores.
- [ ] Si falla, avisa y el borrador sigue ahí (R1).

#### C01.6.3 — Crear la receta desde el borrador *(J3)*

`[nueva en la 2.0]`

- [ ] Abre el editor de receta nueva (C04.3b.1) con el título y la `fuente` del borrador ya cargados.
- [ ] **La nota se lee como si fuera el `.md` de la receta** `[del 2026-09-12]`: lo que esté bajo `## Ingredientes`, `## Preparación`, `## Variaciones` o `## Notas` cae en su campo, y el texto suelto de arriba queda como descripción. Sin encabezados, todo va a la descripción.
- [ ] Hay que elegir la categoría, como en cualquier receta nueva.
- [ ] Guardar invoca la operación de conversión de la capa compartida (C01.7.1): escribe el `.md`, escribe la fila del índice y **borra la fila del borrador**, en una sola operación.
- [ ] Salir sin guardar deja el borrador intacto.
- [ ] Es el alcance del editor y no otro: sirve para una receta que ya tenés en la cabeza. Transcribir el video o el PDF de la fuente sigue siendo trabajo del agente.

### F01.7 — El borrador desaparece al convertirse

Convertir es **una sola operación de la capa compartida**: escribe el `.md`,
escribe la fila del índice y borra la fila del borrador. La invocan tanto la app
como el agente, y nadie borra el borrador por separado.

Su fuente sobrevive en la receta; no queda copia.

#### C01.7.1 — Convertir es una operación, no tres *(J3)*

- [ ] La operación escribe el `.md`, escribe la fila del índice y borra la fila del borrador, en ese orden.
- [ ] La `fuente` del borrador pasa al frontmatter de la receta, y la nota a los campos que nombra (C01.6.3).
- [ ] Si alguno de los pasos falla, el reintento repite los tres (R2): reescribir el `.md`, reemplazar la fila y borrar el borrador son idempotentes.
- [ ] Nadie borra un borrador convertido "a mano" desde otro lado.
- [ ] La invocan las dos partes: el agente al convertir afuera, y la app cuando se guarda una receta creada desde un borrador (C01.6.3).

**Edge case:** el borrador ya no existe cuando la operación intenta borrarlo →
no es un error, la operación termina bien.

### F01.8 — Fallo de captura sin red

Si no hay red, la captura falla y avisa. El texto queda en pantalla para
reintentar. **No hay cola local ni guardado offline**: el borrador nace como
fila en Drive o no nace.

Es el único punto donde el producto acepta a sabiendas un riesgo sobre este job.
Está decidido y registrado.

#### C01.8.1 — Falla, lo dice, y no pierde lo escrito *(J2)*

- [ ] El aviso dice que no se pudo guardar. Sin el error crudo.
- [ ] **El título escrito queda en pantalla** y se puede reintentar.
- [ ] La pantalla no se cierra sola después del error.
- [ ] No se promete guardar más tarde.

#### C01.8.2 — Sin sesión en la captura *(J2)*

- [ ] Si el token venció, el aviso dice que hay que conectarse de nuevo y ofrece el control (R3).
- [ ] Al volver, el título escrito sigue ahí y el usuario reintenta a mano.
- [ ] Es el peor caso de este flujo y el mensaje lo dice claro, sin tecnicismos.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C01.1.1, C01.2.1, C01.2.2, C01.2.3, C01.3.1, C01.4.2, C01.8.1, C01.8.2 | J2 |
| C01.4.1, C01.4.3, C01.5.1, C01.6.1, C01.6.2, C01.6.3, C01.7.1 | J3 |

Ninguna capacidad de esta épica quedó sin job.
