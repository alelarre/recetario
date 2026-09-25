# E01 — Captura y Borradores

**Versión:** 4.0 · **Fecha:** 2026-09-24 · **Estado:** Final — Hito 11
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

**Hay una sola entidad, la receta, y un solo formulario, el editor**
(`E04-Corregir.md`). Lo que falta terminar es una receta con el tag especial
`borrador` (C05.3.1): capturar es abrir el editor con lo compartido y guardar,
y Borradores es la lista de las recetas con ese tag.

Es el flujo más crítico del producto: si falla, Recetario no resuelve lo que dice
resolver.

---

## Features

### F01.1 — Compartir hacia Recetario

Recetario aparece en la hoja de "Compartir" del sistema operativo. Compartir un
reel, una página, un video o fotos abre el editor de una receta nueva con la
fuente, el texto y las fotos ya cargados.

#### C01.1.1 — La app se registra como destino de compartir *(J2)*

- [ ] Recetario aparece en la hoja de compartir de Android una vez instalada como PWA.
- [ ] Acepta texto, URLs e imágenes. **La fuente es el link**: `url` si vino; si no, el primer link que aparezca en el texto. **Lo que sobra del texto va a Notas**, sin el link. El título que manda la app de origen se ignora: suele ser el de la página, no el de la receta.
- [ ] Compartir abre el editor de una receta nueva (C01.2.1).
- [ ] **Las fotos compartidas** —de la cámara, Fotos, una galería— llegan al depósito de la receta (C01.2.3), todas: no hay tope.
- [ ] **Lo compartido puede ser una receta entera en `.md`**: en ese caso no se toma como fuente, sigue la regla de C01.9.2.

**Nota técnica:** es la Share Target API del manifest, que funciona en una PWA
sin backend. Lo compartido llega por `POST` `multipart/form-data` a
`/recetario/compartir` —`title`, `text` y `url`, cada uno en su propio campo,
y las imágenes en `fotos`—, y lo atiende el service worker: guarda las fotos
en el caché `recetario-compartido` (`compartido/0`, `compartido/1`…, sin lo
de un envío anterior) y redirige con un 303 a
`#/nueva?url=…&text=…&fotos=<cantidad>`. El editor saca las fotos del caché y
lo vacía, aunque leerlas falle. Casi todas las apps mandan el link dentro de
`text`. El manifest lo lee Android al instalar la PWA: un cambio ahí pide
reinstalarla. Una instalación vieja manda por `GET`, en la query, y la app lo
sigue pasando a `#/nueva`. **iOS no se soporta** (R7): no existe el
equivalente y el Atajo queda fuera del alcance.

**Edge cases:** se comparte un texto sin link —una receta copiada de un
chat— → no hay fuente y el texto entero va a Notas · se comparte un texto
que es sólo el link → Notas queda vacío · archivos que no son imágenes no se
aceptan: Recetario no aparece en la hoja de compartir para ellos · una foto que
el navegador no puede leer —HEIC, un archivo roto— no se agrega, y se avisa
**«No se pudo leer una de las fotos.»**

### F01.2 — Lo compartido abre el editor

El editor de Nueva receta (`E04-Corregir.md` C04.3b.1), con lo compartido
repartido en sus campos. **Nada se escribe en Drive hasta Guardar o Convertir
con Agente**: compartir y tocar Guardar alcanza para que la receta exista.

#### C01.2.1 — El editor, con lo compartido cargado *(J2)*

- [ ] El link va a **Fuente original** y lo que sobró del texto a **Notas**.
- [ ] La categoría queda en **«Sin categoría»** y la receta con el tag `borrador` apretado y bloqueado (C04.4.1): sin categoría, sólo puede ser un borrador.
- [ ] **El título es opcional** mientras la receta es un borrador: guardado vacío, se titula *Borrador dd/mm hh:mm*, con el momento en que se guardó, y el nombre del archivo sale de ahí.
- [ ] Se puede completar cualquier campo antes de guardar, o nada.
- [ ] **Lo compartido cuenta como cambio desde que se abre el editor**: salir sin guardar pregunta *«¿Salir sin guardar los cambios?»* (C04.1.1).

#### C01.2.2 — Guardar deja la receta en Drive *(J2)*

- [ ] Guardar sube las fotos a `_fotos/`, escribe el `.md` en `_sin-categoria/` —o en la categoría elegida— y su fila del índice, por el store (C04.5.1).
- [ ] Al terminar, el editor se cierra y la app queda en la receta guardada. No hay pantalla de atrás: la entrada del historial era la del menú Compartir.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces, con el velo y el tilde (R8).

#### C01.2.3 — Las fotos que llegan *(J2)*

- [ ] Entran al depósito de la receta (C05.1.5) como fotos nuevas, en el orden en que llegaron, cada una con su número.
- [ ] **Antes de mostrarse, se achican**: el lado mayor a 1600 px, en JPEG, con el velo mientras tanto (R8). Viven en memoria hasta Guardar, como cualquier foto nueva del editor (F04.3d).
- [ ] Se manejan como cualquier otra foto del editor: se ven, se sacan, se ponen de portada o en una línea (`E04-Corregir.md` F04.3d).
- [ ] Salir sin guardar no deja nada en Drive.

### F01.3 — Registrar una fuente sin compartir

Cuando compartir no es posible —la foto de una página de un libro, algo que
alguien contó— se crea la receta a mano desde la app.

#### C01.3.1 — Nueva receta desde el menú *(J2)*

- [ ] *Nueva receta*, en el menú lateral, es la única entrada para crear a mano (C02.1.3).
- [ ] Abre el mismo editor, vacío, en «Sin categoría» y con `borrador` puesto (C04.3b.1). La fuente se escribe a mano, como texto libre: una URL o *"libro de pescados, pág. 84"*.
- [ ] Las fotos entran por la ficha *Fotos*: **Cámara**, **Galería** y **Por URL** (C04.3d.1, C04.3d.1b).
- [ ] El título es opcional con la misma regla que lo compartido (C01.2.1).

### F01.4 — Borradores

Uno de los dos lugares primarios. Lista las recetas que todavía son borradores.

**Un borrador es una receta con el tag `borrador`.** Tiene el mismo formato, el
mismo editor y la misma fila del índice que cualquier otra receta. Vive en su
categoría si ya la tiene, o en `_sin-categoria/` si no (C05.4.4).

#### C01.4.1 — La lista *(J3)*

- [ ] Está en `#/borradores` y es **la lista por tag** (C02.6.5) de `borrador`: las mismas tarjetas, las favoritas primero, la carga por tramos, el carrusel, el filtro y el orden por duración. El carrusel no lleva el chip de `borrador`, que no va en ninguna lista de tags (C02.6.4).
- [ ] **Es el único camino a los borradores:** el Recetario no tiene tile para lo que no tiene categoría (`E02-Encontrar.md` C02.4.1).
- [ ] Es un destino del menú: el encabezado dice **«Borradores»**, con el total, y a la izquierda lleva el botón del menú con su contador, no el volver (C02.1.3).
- [ ] Entra una receta que lleve `borrador` escrito en cualquiera de sus formas (C05.1.4).
- [ ] Una receta de `_sin-categoria/` se dibuja con la trama neutra en lugar del color de una categoría.
- [ ] La lista no tiene «+» ni «Pegar»: crear es *Nueva receta* (C01.3.1), y pegar está en el editor (C01.9.3).
- [ ] **Tocar una tarjeta abre el editor de ese borrador** (`#/r/<id>/editar`), no la receta: a un borrador se entra a completarlo. Es la única lista que lo hace; las demás abren la receta. Volver desde ese editor vuelve a Borradores, por el historial.
- [ ] Las tarjetas **no llevan marca de borrador**: en esta lista lo son todas, y en ninguna otra aparece una (`E02-Encontrar.md` C02.7.1).
- [ ] La lista sale del índice en memoria: mostrarla no hace ningún pedido.

#### C01.4.2 — Un borrador es una receta *(J2)*

- [ ] Es un `.md` con el formato de una receta (C05.1.1) y el tag `borrador` en la lista `tags`. No hay formato propio, ni carpeta propia de borradores, ni hoja propia en el índice.
- [ ] Un borrador sin categoría vive en `_sin-categoria/`, al lado de las categorías. Un borrador con categoría vive en ella.
- [ ] Sus fotos son el depósito de la receta y viven en `_fotos/` (C05.1.5).
- [ ] El identificador es el id del `.md` en Drive, como el de cualquier receta (R5).
- [ ] Deja de ser borrador cuando el usuario suelta el tag en el editor, y eso exige título, categoría, ingredientes y pasos (C04.4.1, C05.3.3).

#### C01.4.3 — Estados de Borradores *(J3)*

- [ ] Vacía: *«No hay borradores.»*. Sin ilustración.
- [ ] Sin red: el aviso de R1. **Borradores no se dibuja con datos de antes.**
- [ ] Un `.md` que un agente deja directo en Drive aparece recién al reindexar (R6).

### F01.5 — El contador

La entrada a Borradores lleva cuántos borradores esperan. Es lo que evita que el
limbo se reproduzca adentro del producto.

#### C01.5.1 — El contador en el Recetario *(J3)*

- [ ] El número de borradores va sobre el botón del menú, arriba a la izquierda de las pantallas del menú, y junto a *Borradores* dentro del menú lateral: con el menú cerrado, es lo que dice que hay algo esperando.
- [ ] Cuenta las recetas con `borrador`, escrito en cualquiera de sus formas.
- [ ] En cero, la entrada sigue visible sin número: Borradores no desaparece.
- [ ] Es un aviso sin acción: no interrumpe, no abre nada solo, no cambia de color para alarmar.
- [ ] El número sale de la misma lectura que usa Borradores; no se pide aparte.

### F01.8 — Fallo al guardar sin red

Si no hay red, guardar falla y avisa. Lo escrito queda en pantalla para
reintentar. **No hay cola local ni guardado offline**: la receta nace como
`.md` en Drive o no nace.

Es el único punto donde el producto acepta a sabiendas un riesgo sobre este job.

#### C01.8.1 — Falla, lo dice, y no pierde lo escrito *(J2)*

- [ ] El aviso dice que no se pudo guardar. Sin el error crudo.
- [ ] **Lo escrito queda en pantalla**, con las fotos, y se puede reintentar. Las fotos que ya se subieron no se vuelven a subir (C04.5.2).
- [ ] El editor no se cierra solo después del error.
- [ ] No se promete guardar más tarde.

#### C01.8.2 — Sin sesión al guardar *(J2)*

- [ ] Si el token venció, el aviso dice que hay que conectarse de nuevo y ofrece el control (R3).
- [ ] Al volver, lo escrito sigue ahí y el usuario reintenta a mano.
- [ ] Es el peor caso de este flujo y el mensaje lo dice claro, sin tecnicismos.

### F01.9 — Convertir con Agente

La app no llama a ningún modelo: arma el pedido con las reglas del formato, el
agente lee la fuente y contesta con el `.md`, y esa respuesta vuelve a la app
compartida o pegada. La vuelta no depende de la ida: **cualquier receta en
`.md` que llega a la app abre el editor**.

#### C01.9.1 — El botón guarda y manda el pedido *(J3)*

- [ ] **«Convertir con Agente»** va al final del editor, arriba de *Guardar*, sólo mientras la receta tiene `borrador` (C04.1.1).
- [ ] **Primero guarda**, como *Guardar* (C04.5.1): el pedido lleva el id del `.md`, que en una receta nueva recién existe al crearla. Si la validación o la escritura fallan —también una receta nueva sin nada cargado (`E04-Corregir.md` C04.3b.1)—, no manda nada.
- [ ] El pedido lleva el título, la fuente y las Notas de la receta tal cual, y las reglas del formato armadas desde las mismas constantes que usa la app —duraciones, dificultades, tags reservados—, así no se desactualiza cuando cambia el esquema.
- [ ] La última línea del frontmatter que pide es `id: <id>`, con el id del `.md` de la receta. La categoría no viaja: se elige en el editor.
- [ ] **Con fotos**, manda las de Drive del depósito, en su orden, y el pedido suma cuántas van, qué pueden ser —páginas de un libro, una receta escrita a mano, una captura, el plato terminado—, que se transcriba lo que se lee sin inventar cantidades ni pasos, y que una foto del plato sirve para el título y la descripción, no para la receta.
- [ ] **Y le dice cómo nombrarlas en la receta:** cada foto va con su número del depósito —*la 1.ª es foto:1, la 2.ª es foto:3*—; la del plato terminado va como `foto: foto:N`; la de un paso, como `![](foto:N)` al final de ese paso; y la sección Fotos no la escribe él, la arma la app (C05.1.5). Así la receta que vuelve ya trae la portada y las referencias, y el depósito del editor las resuelve.
- [ ] **Con el menú Compartir del sistema** (Android): se abre con el pedido como texto, y las fotos como archivos (`foto-1.jpg`…), y se elige el agente.
- [ ] **Sin menú Compartir, o sin poder compartir archivos**, el pedido suma una línea por foto con su número y su link de Drive —`foto:1: https://drive.google.com/file/d/<id>/view`— y **«Las fotos están en mi Google Drive: leelas con el conector de Drive.»** El conector tiene que estar en la misma cuenta.
- [ ] **Sin él** (Chrome en la Mac): abre `https://claude.ai/new?q=<pedido codificado>` si entra en 8.000 caracteres. Si no entra, copia el pedido al portapapeles, abre `https://claude.ai/new` vacío y avisa **«Pedido copiado: pegalo en el agente»**.
- [ ] Después de mandarlo, el editor queda cerrado y la app en la receta guardada.
- [ ] **Si el navegador ya no deja abrir el menú Compartir ni la ventana** —guardar tardó y se perdió la activación del toque—, o no se pudo copiar, la receta muestra **«La receta quedó guardada. Tocá para mandarla al agente.»** con la acción **Mandar al agente**, que manda el mismo pedido con el toque nuevo.
- [ ] El pedido pide la respuesta en markdown, como texto plano y sin nada antes ni después, dentro de un bloque de código o una cita si hace falta para que no se le aplique formato.

#### C01.9.2 — Reconocer la receta que vuelve *(J2, J3)*

- [ ] Antes de mirarlo, a lo recibido se le saca el envoltorio: si trae un bloque de código, vale su contenido; si todo viene citado con `>`, se saca la cita.
- [ ] Un texto es una receta si, sin espacios al principio, empieza con un frontmatter cerrado —`---` … `---`— con una línea `titulo:` adentro. Cualquier otra cosa compartida abre el editor nuevo con lo compartido (C01.2.1); pegada, avisa (C01.9.3).
- [ ] Lo que llega compartido **con `id: <id>` de una receta que existe** abre **el editor de esa receta** con lo recibido aplicado como en *Pegar* (C01.9.3).
- [ ] **Sin `id:`, o con uno que no existe**, abre **el editor nuevo** lleno con la receta, en «Sin categoría» y con `borrador`.
- [ ] Las fotos que llegan compartidas junto con una receta `.md` se ignoran.
- [ ] **La clave `id` se saca al recibir**: no se muestra ni llega al `.md` guardado.
- [ ] La receta recibida cuenta como cambios sin guardar desde que se abre el editor (C04.1.1). Nada se escribe hasta Guardar.

#### C01.9.3 — Pegar *(J3)*

- [ ] **«Pegar»** está en el encabezado de todo editor, a la derecha (C04.1.1), y lee el portapapeles.
- [ ] Si lo copiado es una receta en `.md` (C01.9.2), **llena el formulario**: título, datos, tags y secciones se reemplazan por lo pegado. **No guarda.**
- [ ] Se conservan el **depósito de fotos** y la **categoría elegida**: la receta pegada nombra las fotos por su número, y el depósito es el del editor. La portada que lo pegado no traiga queda la que estaba. Si la categoría es «Sin categoría», `borrador` queda puesto aunque lo pegado no lo traiga.
- [ ] Pisa lo escrito sin preguntar; la pregunta al salir sin guardar protege el archivo (C04.1.1).
- [ ] **Ignora el `id:` que traiga lo pegado**: pega en el editor abierto.
- [ ] Lo pegado que no es una receta avisa **«Lo copiado no es una receta en .md.»**, arriba del formulario y sin tocar lo escrito.
- [ ] Si el navegador no deja leer el portapapeles, avisa **«No se pudo leer lo copiado.»**, sin tocar lo escrito.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C01.1.1, C01.2.1, C01.2.2, C01.2.3, C01.3.1, C01.4.2, C01.8.1, C01.8.2 | J2 |
| C01.4.1, C01.4.3, C01.5.1, C01.9.1, C01.9.3 | J3 |
| C01.9.2 | J2, J3 |

Ninguna capacidad de esta épica quedó sin job.
