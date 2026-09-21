# E02 — Encontrar

**Versión:** 3.3 · **Fecha:** 2026-09-16 · **Estado:** Final — Hito 11
**Jobs:** J1, J4, J5 · **Prioridad:** alta · **Flujos:** F3, F4, F5

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

Llegar a una receta, de las dos maneras posibles: **sabiendo cómo se llama** y
**sin saberlo**. Son el mismo problema visto por los dos lados, y a ~1.000
recetas —en su mayoría nunca cocinadas y de nombre no recordado— pesan casi
igual.

La búsqueda es lo primero de la pantalla principal, y la misma caja busca por
ingrediente y por tag. Para recorrer sin buscar están las categorías, el
carrusel de tags y la duración.

---

## Features

### F02.1 — La pantalla principal

Búsqueda arriba, el carrusel de tags debajo y las categorías abajo. Es el punto
de entrada de la app, siempre, aunque Borradores tenga borradores esperando.

#### C02.1.1 — La jerarquía *(J1, J5)*

- [ ] La caja de búsqueda está arriba, visible y ocupando lugar. **No detrás de un ícono.** Su texto de ayuda es *"Buscar receta o ingrediente"*.
- [ ] Debajo de la búsqueda, el carrusel de tags (C02.6.4).
- [ ] Las categorías van debajo, en grilla, bajo el rótulo *Categorías*.
- [ ] Los destinos —Inicio, Borradores, Plan de la semana, Nueva receta y Ajustes— viven en el menú lateral (C02.1.3). El encabezado lleva sólo el título y, a la izquierda, el botón del menú con el contador de borradores encima (C01.5.1).
- [ ] **El Recetario no nombra el plan de la semana:** su única entrada es la del menú (C06.5.1).
- [ ] No hay barra de navegación inferior.

#### C02.1.2 — Estados del Recetario *(J1, J5)*

- [ ] Cargando: la búsqueda ya usable; las categorías con su espacio reservado, sin salto al llegar.
- [ ] Sin recetas: las categorías se ven igual, vacías, y una línea explica que las recetas entran por Borradores o desde Drive.
- [ ] Sin red: el aviso arriba, y **ni la búsqueda ni las categorías se dibujan con datos viejos** (C05.8.1).
- [ ] Si la app no puede abrir el índice, no llega al Recetario: la salida es la de C05.6.2.

#### C02.1.3 — El menú lateral *(J1, J5)*

- [ ] Lo dibujan el Recetario, Borradores y Ajustes. Lleva Inicio, Borradores con su contador, Nueva receta y Ajustes, y al pie la versión de la app.
- [ ] En el teléfono está cerrado: se abre con el botón del encabezado y se cierra tocando el velo o eligiendo un destino. Desde 900 px de ancho queda fijo y el botón no se dibuja.
- [ ] **Se abre y se cierra deslizando**, y acompaña al dedo mientras se desliza. Al soltar queda abierto si pasó la mitad.
- [ ] Cerrado, el gesto tiene que empezar **a 24 px o más del borde izquierdo**: desde el borde Android lo toma como «atrás». Abierto, empieza desde cualquier lado.
- [ ] Sólo cuenta un movimiento claramente horizontal: en diagonal gana el scroll de la página.
- [ ] **El gesto no arranca sobre el carrusel de tags ni sobre la fila de duraciones** cuando tienen para deslizar: ahí el dedo es de la fila.

### F02.2 — Búsqueda por nombre

Visible y ocupando lugar. Resultados mientras se escribe. Sirve al job más
frecuente y tiene que resolverse en dos toques.

#### C02.2.1 — Buscar por título *(J1)*

- [ ] Los resultados se actualizan mientras se escribe, sin apretar nada.
- [ ] La coincidencia no distingue mayúsculas ni acentos: *"puree"* encuentra *"Puré"*.
- [ ] Coincide con cualquier parte del título, no solo con el principio.
- [ ] Llegar a una receta buscada por nombre cuesta dos toques: escribir y tocar el resultado.

**Edge case:** la caja vacía no muestra resultados ni una lista completa; muestra
el Recetario como estaba. **Buscar con la caja vacía —o con espacios— no hace
nada y no avisa**: no hay nada que decir.

### F02.3 — Búsqueda por ingrediente y por tag

La misma caja busca en tres criterios: **título, ingredientes y tags**. Escribir
"berenjena" devuelve las recetas que se llaman así, las que la tienen como
ingrediente y las que la llevan como tag, agrupadas y distinguidas.

**No busca en el cuerpo entero.** Eso es lo que hace el buscador de Drive y es
exactamente lo que trae ruido: una mención al pasar en una nota no es un
ingrediente.

#### C02.3.1 — Los tres criterios en la misma caja *(J1, J4)*

- [ ] Una sola caja. El usuario no elige criterio.
- [ ] Se busca en título, en los nombres de ingredientes de la fila del índice, y en los tags.
- [ ] **No se busca en la descripción, en los pasos ni en las notas.**
- [ ] La misma insensibilidad a mayúsculas y acentos que C02.2.1.

#### C02.3.2 — Los resultados van agrupados por criterio *(J1, J4)*

- [ ] Tres grupos, con su encabezado: **Por nombre**, **Por ingrediente**, **Por tag**.
- [ ] Un grupo sin resultados no se dibuja.
- [ ] Una receta que coincide por dos criterios aparece en los dos grupos.
- [ ] En los grupos de ingrediente y de tag, cada tarjeta dice **por qué apareció**, citando el valor tal como está escrito: *"tiene Merluza o pescadilla"* por ingrediente, *"tiene tag horno"* por tag.

#### C02.3.3 — Se resuelve contra el índice *(J4)*

- [ ] La búsqueda es una lectura del índice, no una lectura de mil `.md`.
- [ ] Los ingredientes se comparan tal como están escritos: no hay normalización, singularización ni sinónimos (C05.4b.1).
- [ ] Lo que se compara es **el nombre**, o sea lo que está antes del separador (C05.1.3). Un ítem sin separador se compara entero.
- [ ] Una receta con los ingredientes mal tipeados no aparece, y eso es esperado: figura como incompleta y ese es el aviso (principio 3).

#### C02.3.4 — Estados de los resultados *(J1, J4)*

- [ ] Escribiendo: los resultados se actualizan en vivo.
- [ ] Sin resultados: una frase que nombra los tres criterios probados, y nada más. Sin sugerencias, sin "quisiste decir".
- [ ] Sin red: no se puede buscar, y se dice.

#### C02.3.5 — Los resultados se muestran todos *(J1, J4)*

- [ ] No hay carga por tramos ni tope de resultados: se dibujan todos los que coinciden.
- [ ] No hace falta: la búsqueda resuelve sobre el índice ya leído, así que un resultado más no cuesta una lectura más.
- [ ] Cada grupo dice cuántos resultados trajo.

### F02.4 — Las categorías

Por tipo de plato, debajo de la búsqueda y del carrusel. Sirven para pasear, y
se aprenden por posición. La app arma las dieciséis predefinidas al preparar la
carpeta, y después se crean, renombran y borran desde *Ajustes → Recetario*.

#### C02.4.1 — La grilla *(J5)*

- [ ] Las categorías son las subcarpetas de la carpeta base y se leen de la hoja `categorias` del índice: **la app no tiene escrito el id de ninguna**.
- [ ] El orden es alfabético y estable: la posición de cada categoría se aprende. **No se ordena por cantidad de recetas:** reacomodaría la grilla cada vez que entra una.
- [ ] Una carpeta creada a mano en Drive aparece como categoría al reindexar.
- [ ] Cada tile lleva la foto y el color de su carpeta, con el nombre completo. La foto puede ser del catálogo o una propia, subida a `_fotos/` (C05.4.4), que se pide con el token y se completa cuando llega. Una categoría sin foto se dibuja con la trama sobre su color.
- [ ] Una categoría sin recetas se muestra igual.
- [ ] **Cada tile dice cuántas recetas tiene**, en un badge sobre la foto y sólo si tiene alguna: una categoría vacía no lleva un cero encima. Sobre foto clara el badge necesita fondo casi opaco.
- [ ] La grilla pasa de dos a cuatro columnas en pantalla ancha (C05.10.1).

### F02.5 — La lista de una categoría

Las recetas de una carpeta. A ~1.000 recetas, una categoría puede tener cientos:
la lista tiene que servir para recorrer, no solo para llegar.

#### C02.5.1 — Lista densa, con el total arriba *(J5)*

- [ ] Tarjetas miniatura, densas: la lista es para recorrer.
- [ ] El encabezado muestra el **total** de recetas de la categoría antes de scrollear.
- [ ] **Las favoritas van primero**, y el orden es alfabético por título dentro de cada bloque. Se puede pasar a ordenar por duración (C02.9.2).
- [ ] Debajo del encabezado van el carrusel de tags (C02.6.4), la fila de duraciones (C02.9.1) y el conmutador de orden (C02.9.2); después, la lista.

#### C02.5.2 — Carga por tramos *(J5)*

- [ ] La lista carga por tramos al scrollear; no dibuja cientos de tarjetas de una.
- [ ] **El total del encabezado es el total real desde el primer momento**, no lo cargado hasta ahora: nunca se scrollea sin saber cuánto falta.
- [ ] Al llegar al final de un tramo, el siguiente aparece sin que el usuario toque nada.
- [ ] Los tramos salen del índice ya leído: el indicador del final dice que hay más, no es una espera de red.
- [ ] La lista por tag (C02.6.5) carga igual.

#### C02.5.3 — Estados de la lista *(J5)*

- [ ] Cargando: indicador donde va el contenido, no pantalla de carga.
- [ ] Categoría vacía: una frase. Sin ilustración.
- [ ] Sin red: el aviso, y nada dibujado con datos viejos.

### F02.5b — Las listas muestran foto

Los resultados de búsqueda, la lista de una categoría y la lista por tag
muestran la foto de la receta. **Una receta sin foto lleva un placeholder genérico**, no un hueco.

#### C02.5b.1 — La tarjeta miniatura *(J1, J5)*

- [ ] Foto cuadrada chica a la izquierda, título, y una línea de contexto con el color y el nombre de la categoría, **la duración con su relojito** y lo que rinde. El alto total es de 80 px.
- [ ] La duración sólo se dibuja si `tiempo` es uno de los cinco valores (`E05-Cimientos.md` C05.1.1).
- [ ] Las marcas de los tags especiales van en la esquina de la tarjeta, no en la línea de contexto (C02.7.1).
- [ ] La foto va **al costado y no arriba**: al costado entran ocho o nueve por pantalla, arriba tres.
- [ ] En resultados por ingrediente o por tag, la línea de contexto es el motivo (C02.3.2) seguido de la duración.

#### C02.5b.2 — El placeholder es el caso normal *(J1, J5)*

- [ ] Una receta sin `foto` muestra un placeholder —la foto de su categoría, oscurecida y teñida con su color—, no un hueco ni un ícono roto.
- [ ] El placeholder **ocupa exactamente el mismo espacio que una foto**: la lista no se desalinea.
- [ ] **El placeholder se dibuja siempre, también con foto, y la foto va encima**: una cabecera de Drive (C05.1.5) llega con el token y se completa cuando está, así que abajo nunca hay un hueco.
- [ ] Una `foto` cuya URL no carga, o una de Drive que ya no está, deja a la vista el placeholder, sin error visible.
- [ ] La cabecera sale de la columna `foto` del índice, ya resuelta (C05.4b.1): listar no lee ningún `.md`.

### F02.6 — Los tags como cruce

Una receta vive en una carpeta y lleva varios tags. Los tags permiten cruzar
criterios sin mover el archivo: "pescados" es la carpeta, "para el horno" es un
tag.

#### C02.6.1 — El tag como criterio de búsqueda *(J4)*

- [ ] Escribir un tag en la caja devuelve las recetas que lo llevan, en el grupo **Por tag** (C02.3.2).

#### C02.6.2 — El tag como filtro sobre una lista *(J4, J5)*

- [ ] Un tag se aplica como filtro sobre la lista de una categoría o sobre la lista por tag, **tocando su chip en el carrusel** (C02.6.4).
- [ ] El chip tocado queda encendido, y se saca tocándolo de nuevo. No hay una fila aparte con los filtros puestos.
- [ ] Los filtros se acumulan: dos tags dejan las recetas que llevan los dos.
- [ ] El total del encabezado pasa a ser el de las recetas filtradas.
- [ ] Filtrar hasta cero resultados muestra una frase: *"Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba."*
- [ ] Los filtros se pierden al cambiar de pantalla: si no, se entra a otra categoría y no se ve nada por un tag que ahí no existe.

#### C02.6.3 — En la receta los tags se leen *(J4, J5)*

- [ ] Los tags se muestran en la receta abierta como chips, y no son tocables: al filtro se entra por el carrusel (C02.6.4).
- [ ] La excepción es `incompleta`, que abre el editor (C03.1.3).

#### C02.6.4 — El carrusel de tags *(J5)*

- [ ] Vive en el Recetario —debajo de la búsqueda, arriba de *Categorías*—, en cada categoría y en la lista por tag, debajo del encabezado.
- [ ] Cada chip lleva el tag tal como está escrito, su ícono si es especial, y **cuántas recetas lo llevan**: en el Recetario y en la lista por tag cuenta todo el recetario; en una categoría, sólo esa categoría.
- [ ] **El orden:** los cuatro especiales primero y en orden fijo —`favorito`, `menú diario`, `probar`, `incompleta`—; después los demás **por cantidad de recetas**, de mayor a menor, con los empates en alfabético.
- [ ] En una categoría van todos los tags. En el Recetario y en la lista por tag, los especiales y los **veinte** comunes más usados: para la cola larga está la búsqueda.
- [ ] Un tag especial sin ninguna receta no se dibuja. Sin ningún tag, el carrusel no se dibuja.
- [ ] Se desliza de costado, sin barra de scroll. Un degradé a la derecha dice que sigue; a la izquierda aparece cuando ya se corrió. Con mouse o trackpad hay una flecha a cada lado, que corre el 80% del ancho visible.
- [ ] **En el Recetario, tocar un chip abre la lista por tag** (C02.6.5). En una categoría y en la lista por tag, filtra ahí mismo (C02.6.2).
- [ ] No hay nube de tags ni sección de tags en la navegación.
- [ ] El vocabulario de tags es libre: la app no propone ni valida, salvo los cuatro especiales, que se reserva.

#### C02.6.5 — La lista por tag *(J4, J5)*

- [ ] `#/t/<tag>`: las recetas de todo el recetario que llevan ese tag. Se llega desde el carrusel del Recetario.
- [ ] El encabezado lleva el nombre del tag —con su ícono adelante si es especial—, el volver y el total, como el de una categoría.
- [ ] El mismo carrusel, para sumar otro tag. **El chip del tag de la ruta va encendido y no es tocable:** cambiar de tag es volver y elegir otro.
- [ ] La lista es la de una categoría: las mismas tarjetas, las favoritas primero, la carga por tramos (C02.5.2), el filtro y el orden por duración (F02.9).
- [ ] Vacía, dice el hecho —*"Ninguna receta tiene estos tags."*— sin invitar a sacar un filtro: el de la ruta no se puede sacar.
- [ ] No es la pantalla de resultados: esa agrupa por el motivo de cada coincidencia, y acá hay uno solo.

### F02.7 — Las marcas de los tags especiales en las listas

Los cuatro tags especiales —`favorito`, `menú diario`, `probar`, `incompleta`—
se ven en la tarjeta sin abrir la receta. Una receta incompleta se lista igual
que cualquier otra, y se ve que le falta algo. No se esconde ni se ordena al
final.

#### C02.7.1 — Las marcas *(J1, J5)*

- [ ] Van **juntas en la esquina superior derecha de la tarjeta**, en el orden fijo de los especiales, cada una con su ícono: la estrella, el calendario, el marcador y la marca de incompleta (design-system §6.5). El título no pasa por debajo.
- [ ] Salen de la lista `tags` de la fila del índice (C05.3.1). Cada marca tiene su nombre accesible: *Favorita*, *Menú diario*, *Para probar*, *Incompleta*.
- [ ] La marca de incompleta es consistente con la de la receta abierta (C03.1.3).
- [ ] Una receta incompleta **no se filtra, no se esconde y no se ordena distinto**.
- [ ] La marca no se dibuja como error ni como advertencia: la receta funciona, le falta algo.
- [ ] **De los cuatro, sólo `favorito` cambia el orden:** las favoritas van primero en las listas (C02.5.1).

### F02.8 — Sin historial ni sugerencias por uso

No hay "última vez", ni "veces", ni "hace mucho que no hacés esto". La novedad se
resuelve mostrando, no registrando.

#### C02.8.1 — Nada se registra *(J5)*

- [ ] La app no guarda cuándo se abrió ni cuántas veces se cocinó una receta.
- [ ] No hay sección de recientes ni de sugerencias.
- [ ] El orden de ninguna lista depende del uso.

`[abierto]` Sugerir es una forma posible de servir a J5, como ayuda secundaria.
Si alguna vez entra, va entre la búsqueda y las categorías, nunca arriba.

### F02.9 — Filtrar y ordenar por duración

La duración (`tiempo`, `E05-Cimientos.md` C05.1.1) sirve para recorrer una
lista, no para buscar: el filtro es sólo de la categoría y la lista por tag;
el orden suma la búsqueda.

#### C02.9.1 — El filtro por duración *(J5)*

- [ ] Sólo en la categoría y en la lista por tag. No hay filtro por duración en la búsqueda ni en el Recetario.
- [ ] Una fila de chips de duración, debajo del carrusel de tags (C02.6.4): cada chip lleva el relojito, el valor y cuántas recetas hay con ese valor, en el orden de los cinco valores.
- [ ] La fila se desliza cuando no entra, como el carrusel, sin degradé ni flechas.
- [ ] **Encender varios chips los suma.** Con tags encendidos, una receta tiene que llevar esos tags **y** alguna de las duraciones encendidas.
- [ ] Las cantidades cuentan sobre la lista ya filtrada por tags.
- [ ] Un valor sin recetas no se dibuja, salvo que esté encendido.
- [ ] **Si ninguna receta de la lista tiene duración, la fila no se dibuja.**
- [ ] El filtro se pierde al cambiar de pantalla, como el de tags (C02.6.2).
- [ ] El total del encabezado cuenta la lista filtrada, como con los tags.
- [ ] Filtrar hasta cero resultados muestra el vacío de siempre: *"Probá sacando alguno de los filtros de arriba."*

#### C02.9.2 — El orden por duración *(J1, J5)*

- [ ] Un conmutador «A–Z | Duración» —*Duración* con su relojito—, en una fila propia alineada a la derecha, debajo del filtro, en la categoría y en la lista por tag.
- [ ] **En la búsqueda va arriba de los grupos**, sin fila de filtro (C02.3.2).
- [ ] **A–Z**, el orden con el que abre cada lista: las favoritas primero y alfabético dentro de cada bloque.
- [ ] **Duración:** de `~15 min` a `>1 día`, con las favoritas mezcladas y alfabético dentro de cada valor; las recetas sin duración van al final, en alfabético.
- [ ] La lista va seguida, sin rótulos por valor.
- [ ] En la búsqueda, el orden se aplica dentro de cada grupo —Por nombre, Por ingrediente, Por tag—, sin mezclarlos.
- [ ] Vuelve a A–Z al cambiar de pantalla.
- [ ] **Si ninguna receta de la lista tiene duración, la fila no se dibuja.**

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C02.2.1 | J1 |
| C02.3.1, C02.3.2, C02.3.4, C02.3.5, C02.5b.1, C02.5b.2, C02.7.1 | J1, J4 o J1, J5 |
| C02.3.3, C02.6.1 | J4 |
| C02.1.1, C02.1.2, C02.1.3 | J1, J5 |
| C02.4.1, C02.5.1, C02.5.2, C02.5.3, C02.6.4, C02.8.1, C02.9.1 | J5 |
| C02.6.2, C02.6.3, C02.6.5, C02.9.2 | J4, J5 o J1, J5 |

Ninguna capacidad de esta épica quedó sin job.
