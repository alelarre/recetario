# E02 — Encontrar

**Versión:** 3.1 · **Fecha:** 2026-09-12 · **Estado:** Final — Hito 11
**Jobs:** J1, J4, J5 · **Prioridad:** alta · **Flujos:** F3, F4, F5

> **Cambios en la 3.1 (2026-09-12):** el motivo de una coincidencia por tag se
> lee *"tiene tag X"*; buscar con el campo vacío no hace nada; y el tile de
> categoría muestra **cuántas recetas tiene** (C02.4.1).
>
> **Cambio en la 3.0 (Hito 11):** la grilla de categorías queda en **dos
> columnas** y la lista usa la tarjeta de 80 px — las dos variantes del Hito 9,
> resueltas.
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. Nuevas capacidades a partir de los wireframes: la
> **carga por tramos** de la lista de categoría y el **filtro por tag aplicado
> sobre una lista**.

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

Llegar a una receta, de las dos maneras posibles: **sabiendo cómo se llama** y
**sin saberlo**. Son el mismo problema visto por los dos lados, y a ~1.000
recetas —en su mayoría nunca cocinadas y de nombre no recordado— pesan casi
igual.

Es la épica que más cambia respecto de lo implementado: la búsqueda pasa a ser lo
primero de la pantalla principal, y aparece el filtro por ingrediente, que hoy no
existe.

---

## Features

### F02.1 — La pantalla principal

Búsqueda arriba, las 16 categorías abajo. Dos cosas, nada más. Es el punto de
entrada de la app, siempre, aunque Borradores tenga borradores esperando.

#### C02.1.1 — La jerarquía *(J1, J5)*

- [ ] La caja de búsqueda está arriba, visible y ocupando lugar. **No detrás de un ícono.**
- [ ] Las categorías van debajo, en grilla.
- [ ] La entrada a Borradores, con su contador, arriba a la derecha (C01.5.1).
- [ ] La entrada a Ajustes, también arriba a la derecha.
- [ ] La entrada al planificador, si J9 existe, **debajo de todo** (C06.6.1).
- [ ] No hay barra de navegación inferior.

#### C02.1.2 — Estados del Recetario *(J1, J5)*

- [ ] Cargando: la búsqueda ya usable; las categorías con su espacio reservado, sin salto al llegar.
- [ ] Sin recetas: las categorías se ven igual, vacías, y una línea explica que las recetas entran por Borradores o desde Drive.
- [ ] Sin red: el aviso arriba, y **ni la búsqueda ni las categorías se dibujan con datos viejos** (C05.8.1).
- [ ] Índice dañado: el aviso de C05.6.2 reemplaza el contenido.

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
nada y no avisa** `[del 2026-09-12]`: no hay nada que decir.

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
- [ ] En los grupos de ingrediente y de tag, cada tarjeta dice **por qué apareció**, citando el valor tal como está escrito: *"tiene Merluza o pescadilla"* por ingrediente, *"tiene tag horno"* por tag. `[«tiene tag» desde el 2026-09-12: «lleva» no distinguía de un ingrediente]`

#### C02.3.3 — Se resuelve contra el índice *(J4)*

- [ ] La búsqueda es una lectura del índice, no una lectura de mil `.md`.
- [ ] Los ingredientes se comparan tal como están escritos: no hay normalización, singularización ni sinónimos (C05.4b.1).
- [ ] Lo que se compara es **el nombre**, o sea lo que está antes del separador (C05.1.3). Un ítem sin separador se compara entero.
- [ ] Una receta con los ingredientes mal tipeados no aparece, y eso es esperado: figura como incompleta y ese es el aviso (principio 3).

#### C02.3.4 — Estados de los resultados *(J1, J4)*

- [ ] Escribiendo: los resultados se actualizan en vivo.
- [ ] Sin resultados: una frase y nada más. Sin sugerencias, sin "quisiste decir".
- [ ] Sin red: no se puede buscar, y se dice.

#### C02.3.5 — Los resultados se muestran todos *(J1, J4)*

- [ ] No hay carga por tramos ni tope de resultados: se dibujan todos los que coinciden.
- [ ] No hace falta: la búsqueda resuelve sobre el índice ya leído, así que un resultado más no cuesta una lectura más.
- [ ] Cada grupo dice cuántos resultados trajo.

### F02.4 — Las categorías

Dieciséis, por tipo de plato, debajo de la búsqueda. Se conservan: sirven para
pasear, que es para lo que existen, y ya están aprendidas por posición.

#### C02.4.1 — La grilla *(J5)*

- [ ] Las categorías se descubren listando las subcarpetas de `Recetario/`: **ninguna está en el código**.
- [ ] El orden es alfabético y estable: la posición de cada categoría se aprende.
- [ ] Agregar una carpeta en Drive agrega una categoría sin tocar la app.
- [ ] Una categoría sin recetas se muestra igual.
- [ ] **Cada tile dice cuántas recetas tiene** `[del 2026-09-12]`, en un badge sobre la foto y sólo si tiene alguna: una categoría vacía no lleva un cero encima. Sobre foto clara el badge necesita fondo casi opaco.
- [ ] La grilla pasa de dos a cuatro columnas en pantalla ancha (C05.10.1).

### F02.5 — La lista de una categoría

Las recetas de una carpeta. A ~1.000 recetas, una categoría puede tener cientos:
la lista tiene que servir para recorrer, no solo para llegar.

#### C02.5.1 — Lista densa, con el total arriba *(J5)*

- [ ] Tarjetas miniatura, densas: la lista es para recorrer.
- [ ] El encabezado muestra el **total** de recetas de la categoría antes de scrollear.
- [ ] El orden es alfabético por título.

#### C02.5.2 — Carga por tramos *(J5)*

`[nueva en la 2.0 — wireframes §3.3]`

- [ ] La lista carga por tramos al scrollear; no dibuja cientos de tarjetas de una.
- [ ] **El total del encabezado es el total real desde el primer momento**, no lo cargado hasta ahora: nunca se scrollea sin saber cuánto falta.
- [ ] Al llegar al final de un tramo, el siguiente aparece sin que el usuario toque nada.
- [ ] Si un tramo falla, el aviso aparece al final de la lista y lo ya cargado sigue en pantalla.

#### C02.5.3 — Estados de la lista *(J5)*

- [ ] Cargando: indicador donde va el contenido, no pantalla de carga.
- [ ] Categoría vacía: una frase. Sin ilustración.
- [ ] Sin red: el aviso, y nada dibujado con datos viejos.

### F02.5b — Las listas muestran foto

Tanto los resultados de búsqueda como la lista de una categoría muestran la foto
de la receta. **Una receta sin foto lleva un placeholder genérico**, no un hueco.

#### C02.5b.1 — La tarjeta miniatura *(J1, J5)*

- [ ] Foto cuadrada chica a la izquierda, título, y una línea de contexto con categoría y tiempo.
- [ ] La foto va **al costado y no arriba**: al costado entran ocho o nueve por pantalla, arriba tres.
- [ ] En resultados por ingrediente o por tag, la tarjeta agrega el motivo (C02.3.2).

#### C02.5b.2 — El placeholder es el caso normal *(J1, J5)*

- [ ] Una receta sin `foto` muestra un placeholder, no un hueco ni un ícono roto.
- [ ] El placeholder **ocupa exactamente el mismo espacio que una foto**: la lista no se desalinea.
- [ ] Una `foto` cuya URL no carga muestra el placeholder, sin error visible.

### F02.6 — Los tags como cruce

Una receta vive en una carpeta y lleva varios tags. Los tags permiten cruzar
criterios sin mover el archivo: "pescados" es la carpeta, "para el horno" es un
tag.

#### C02.6.1 — El tag como criterio de búsqueda *(J4)*

- [ ] Escribir un tag en la caja devuelve las recetas que lo llevan, en el grupo **Por tag** (C02.3.2).

#### C02.6.2 — El tag como filtro sobre una lista *(J4, J5)*

`[nueva en la 2.0 — wireframes §4]`

- [ ] Un tag se puede aplicar como filtro sobre una lista ya abierta: resultados de búsqueda o lista de categoría.
- [ ] Con el filtro puesto, el encabezado dice cuál es y ofrece quitarlo.
- [ ] Los filtros se acumulan: dos tags dejan las recetas que llevan los dos.
- [ ] El total del encabezado pasa a ser el de las recetas filtradas.
- [ ] Filtrar hasta cero resultados muestra una frase y el control para quitar el filtro.

#### C02.6.3 — Se entra al filtro desde la receta *(J4, J5)*

- [ ] Los tags se muestran en la receta abierta y son tocables.
- [ ] Tocar uno lleva a la lista filtrada por ese tag.

#### C02.6.4 — Los tags no tienen pantalla propia *(J5)*

- [ ] No hay nube de tags, ni listado, ni sección en la navegación.
- [ ] El vocabulario de tags es libre: la app no propone ni valida.

### F02.7 — La marca de incompleta en las listas

Una receta incompleta se lista igual que cualquier otra, y se ve que le falta
algo. No se esconde ni se ordena al final.

#### C02.7.1 — La marca *(J1, J5)*

- [ ] La marca aparece en la tarjeta, discreta y consistente con la de la receta abierta.
- [ ] Una receta incompleta **no se filtra, no se esconde y no se ordena distinto**.
- [ ] La marca no se dibuja como error ni como advertencia: la receta funciona, le falta algo.

### F02.8 — Sin historial ni sugerencias por uso

No hay "última vez", ni "veces", ni "hace mucho que no hacés esto". La novedad se
resuelve mostrando, no registrando.

#### C02.8.1 — Nada se registra *(J5)*

- [ ] La app no guarda cuándo se abrió ni cuántas veces se cocinó una receta.
- [ ] No hay sección de recientes ni de sugerencias.
- [ ] El orden de ninguna lista depende del uso.

`[abierto]` Sugerir es una forma posible de servir a J5, como ayuda secundaria.
Si alguna vez entra, va entre la búsqueda y las categorías, nunca arriba.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C02.2.1 | J1 |
| C02.3.1, C02.3.2, C02.3.4, C02.3.5, C02.5b.1, C02.5b.2, C02.7.1 | J1, J4 o J1, J5 |
| C02.3.3, C02.6.1 | J4 |
| C02.1.1, C02.1.2 | J1, J5 |
| C02.4.1, C02.5.1, C02.5.2, C02.5.3, C02.6.4, C02.8.1 | J5 |
| C02.6.2, C02.6.3 | J4, J5 |

Ninguna capacidad de esta épica quedó sin job.
