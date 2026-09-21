# E03 — Leer y cocinar

**Versión:** 3.2 · **Fecha:** 2026-09-16 · **Estado:** Final — Hito 11
**Job:** J6 · **Prioridad:** media · **Flujo:** F6

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

La receta a la vista mientras se cocina, con las manos ocupadas o sucias, el
teléfono apoyado y la atención partida.

**Es el uso menor de los cuatro:** solo para recetas complejas o poco
frecuentes.

La pantalla sirve a **dos momentos distintos con la misma información**:

1. **Prelectura.** Antes de decidir o de empezar: se lee todo de corrido, incluidas notas y variaciones.
2. **Cocina.** Ingredientes durante el *mise en place*; pasos durante la ejecución. Son **excluyentes en el tiempo**, y notas y variaciones no se usan acá.

---

## Features

### F03.1 — La receta en una columna

Todo a la vista, en orden: descripción, ingredientes, preparación, variaciones,
notas. Es una pila de fichas: la primera con la foto, el título y los datos;
después una por sección. Sin pestañas: costaban cuatro toques para leer una
receta entera.

#### C03.1.1 — El orden de lectura *(J6)*

- [ ] En la primera ficha: foto si la hay, título, línea de contexto, tags, descripción y, al pie tras un divisor, la fuente. Después ingredientes, preparación, variaciones y notas, cada una en su ficha, y al final la ficha **Fotos** si la receta tiene depósito (C03.5.2).
- [ ] La línea de contexto lleva el color y el nombre de la categoría, lo que rinde, **la duración con su relojito** y la dificultad. La duración sólo se dibuja si `tiempo` es uno de los cinco valores (`E05-Cimientos.md` C05.1.1).
- [ ] Los tags van como chips, los especiales primero y con su ícono. **Se leen y no se tocan** (C02.6.3); el único tocable es *incompleta* (C03.1.3). **`favorito` no lleva chip:** ya lo dice la estrella del encabezado (C03.1.2b).
- [ ] Una sección ausente no se dibuja: no queda encabezado vacío.
- [ ] Una sección desconocida del `.md` se muestra tal cual, después de Fotos, sin interpretarse (C05.1.2).
- [ ] Toda la receta se lee scrolleando, sin ningún toque.

#### C03.1.2 — Las acciones *(J6, J7)*

- [ ] Al pie: **Cocinar** y **Editar**. Sin ingredientes ni pasos, **Cocinar no se ofrece**: no hay nada que cocinar.
- [ ] Volver es un control de tamaño normal en el encabezado, y el gesto del sistema hace lo mismo.
- [ ] **No hay menú ⋯ de acciones secundarias:** las dos acciones están al pie, y favorito y compartir tienen su ícono en el encabezado (C03.1.2b).

#### C03.1.2b — El encabezado *(J6)*

- [ ] Arranca **sin texto**: el título está abajo, grande y entero, y repetirlo arriba es decir dos veces lo mismo.
- [ ] Queda **fijo al scrollear**, y cuando el título grande sale de pantalla lo toma **recortado con elipsis**, sin llegar a pisar lo que tenga a la derecha.
- [ ] A la derecha van, en este orden, la estrella de favorito, el ícono de compartir y el link al `.md`.
- [ ] El **link al `.md` en Drive** va con el logo de Drive y la etiqueta `.md`, que abre en otra pestaña. Es un dato al margen y no un botón: sin caja y más chico que los controles.
- [ ] El link sólo aparece si la receta está en el índice: sin fila no se conoce su id de archivo.
- [ ] **La estrella de favorito** vive en el encabezado, a la izquierda de compartir. Un toque pone el tag `favorito` y otro lo saca; mientras se escribe en Drive se llena de izquierda a derecha en loop, y el resultado se dibuja recién con la respuesta —si falla, vuelve como estaba y avisa arriba de la receta, con *Reintentar*. Mientras escribe no acepta otro toque.
- [ ] **El ícono de compartir** abre la ficha de compartir (C03.7.1).

#### C03.1.3 — Estados de la receta *(J6)*

- [ ] Incompleta: **un chip más de la fila de tags, entre los especiales, con el tag tal como está escrito** —*incompleta*— **y lleva la marca** (design-system §6.5). Es **tocable** y **abre el editor**, donde se saca el tag con su botón una vez cargado lo mínimo (C04.4.1). El resto de la receta se muestra igual.
- [ ] Va **en la fila de tags y no suelto debajo**: es un estado del mismo orden que un tag y se lee en el mismo barrido.
- [ ] La marca sale del tag `incompleta` de la lista `tags`, no de mirar el contenido (C05.3.1).
- [ ] Sin foto: el bloque de foto no se dibuja y la receta empieza por el título.
- [ ] Cargando: el esqueleto de la pantalla está mientras se lee el `.md`.
- [ ] Sin red: no se puede abrir; el aviso (C05.8.1).
- [ ] El `.md` ya no está en Drive: el aviso dice que la receta ya no existe y ofrece volver. La app **no corrige el índice** (R4).

### F03.2 — El modo cocina

Los ingredientes se consultan repetidamente durante la preparación y tienen que
seguir alcanzables sin perder el lugar en los pasos. La solución es un **modo**
aparte, con un conmutador de dos posiciones.

**Por qué acá sí hay conmutador y en la receta no hay pestañas:** las pestañas
esconden las notas y las variaciones. Notas y variaciones **no se usan
cocinando**, y ingredientes y pasos son excluyentes en el tiempo: el conmutador
no esconde nada que haga falta.

#### C03.2.1 — Se entra a propósito *(J6)*

- [ ] Se entra desde **Cocinar** en la receta abierta. No es la vista por defecto: cocinar es el uso menor.
- [ ] **El encabezado mide 64 px**, como sus controles: el chevron, el título de la receta centrado y recortado con elipsis, el sol (C03.3.1) y *Salir*. El sol y *Salir* responden en toda su área de 64 px, aunque su caja dibujada sea más chica.
- [ ] **Dos salidas, con destinos distintos**: el chevron vuelve **a la receta** —seguir leyéndola sin la escala de cocina— y **Salir** vuelve **a la categoría**, que es donde se elige otra cosa. Si la receta no está en el índice no se sabe su categoría, y *Salir* vuelve al Recetario.
- [ ] Las dos sueltan el bloqueo de pantalla: se dejó de cocinar.
- [ ] Volver con el gesto del sistema sale del modo, no de la receta. Salir del modo **no deja la cocina en el historial**: volver desde la receta lleva a donde se estaba antes.
- [ ] Al entrar, la pantalla **empieza arriba**: se entra desde el pie de la receta y heredar ese scroll abría los ingredientes por la mitad.

#### C03.2.2 — El conmutador Ingredientes / Pasos *(J6)*

- [ ] Dos posiciones, **cada una con su ícono y su nombre**: la zanahoria para *Ingredientes* y la lista numerada para *Pasos*. Queda fijo arriba al scrollear. Al entrar, abre en **Ingredientes**: el *mise en place* va primero.
- [ ] **Preserva la posición de scroll de cada lado.** Ir a Ingredientes y volver a Pasos devuelve al paso donde se estaba, no al principio.
- [ ] Cambiar de posición es un toque, en un control de tamaño grande.
- [ ] Notas, variaciones y descripción **no se muestran** en este modo.

**Edge cases:** la receta no tiene ingredientes o no tiene pasos → el conmutador
muestra solo lo que existe, sin una posición vacía · la receta no tiene ninguna
de las dos → **Cocinar** no se ofrece.

#### C03.2.4 — Seguir el hilo entre los pasos *(J6)*

- [ ] **Al entrar, el paso 1 ya está realzado**: sin un paso elegido, la pantalla no dice dónde estás.
- [ ] Tocar un paso lo **realza**, y queda realzado hasta que se toque otro. Es dónde estás. Tocar el que ya está realzado lo da por hecho y realza el siguiente.
- [ ] Tocar un paso **no selecciona su texto** ni resalta la pantalla entera: el texto de los pasos no es seleccionable en este modo. Copiar un paso se hace desde la receta abierta.
- [ ] Un paso hecho se ve distinto: su número se reemplaza por un check y el texto se atenúa. **No se tacha** — a 22 px el tachado cruza el renglón entero y lo vuelve difícil de leer, que es lo contrario de lo que el modo cocina busca.
- [ ] **Nada de esto persiste:** no entra al `.md`, no entra al índice, y se pierde al salir del modo cocina.
- [ ] Al volver a entrar, no hay ningún paso hecho y el realzado vuelve a ser el 1.
- [ ] Tocar un paso hecho lo vuelve a realzar y le saca el check.
- [ ] Los pasos se numeran por tramo, como están escritos, pero el hilo es uno solo para toda la receta.
- [ ] Solo existe en modo cocina: la receta en lectura no tiene ni realce ni pasos hechos.

**Por qué efímero:** perder el renglón es el problema concreto de cocinar, y estas
dos cosas lo resuelven. Persistirlas obligaría a elegir dónde viven — en el `.md`
ensucian el archivo, y en el navegador son estado que la app no guarda en ningún
otro lado.

#### C03.2.3 — La escala cambia *(J6)*

- [ ] El texto y los controles del modo cocina son **bastante más grandes** que en el resto de la app.
- [ ] Es el único lugar donde la escala cambia, y cambia porque la distancia de lectura cambia: se lee a 50 cm, con el teléfono apoyado.
- [ ] Los ingredientes conservan la distinción visual entre cantidad y nombre (C05.1.3).

### F03.3 — Mantener la pantalla encendida

Un botón manual. **Manual por decisión, no por omisión:** no siempre hace falta
dejarla prendida.

#### C03.3.1 — El control *(J6)*

- [ ] Vive en el encabezado del modo cocina, como ícono solo —el sol— a la izquierda de *Salir*, con su etiqueta accesible: *Mantener la pantalla encendida*.
- [ ] Dice si está activo: encendido, el ícono se invierte —fondo claro, sol oscuro—, como el estado elegido del editor.
- [ ] Arranca apagado cada vez que se entra al modo: no recuerda la elección anterior.
- [ ] Salir del modo cocina lo libera.
- [ ] El bloqueo se pierde solo cuando la app pasa a segundo plano: al volver con el modo abierto y el sol encendido, se vuelve a pedir.
- [ ] Si el navegador no lo soporta o lo niega, el control **no se muestra**. No se avisa: no es un problema del usuario.

**Nota técnica:** Wake Lock API. El control y el estado del modo cocina viven en
`src/cocina-control.ts`, que comparten la app y la vista de invitado (C03.7.5).

### F03.4 — Las variaciones, con su fuente

Cada variación es una sección con nombre, puede tener su propia fuente y sus
propios ingredientes y pasos. Se leen en la misma columna: un plato con tres
versiones es una receta, no tres.

#### C03.4.1 — Cómo se muestran *(J6)*

- [ ] Cada `###` bajo `## Variaciones` es una variación con su nombre.
- [ ] Si la variación empieza con una línea en itálica de fuente, se muestra como fuente propia y no como texto del cuerpo.
- [ ] Sus ingredientes y pasos, si los trae, se muestran dentro de la variación.
- [ ] **No hay pantalla propia ni navegación entre variaciones:** están en la misma columna.
- [ ] En modo cocina no aparecen (C03.2.2).

**Nota técnica:** los ingredientes de una variación cuentan para el filtro por
ingrediente de la receta entera, sin distinguir de cuál son. Es una imprecisión
aceptada (IA §1.8).

### F03.5 — Las fotos, si las hay

Una receta puede tener un depósito de fotos (C05.1.5): la del plato, la de un
paso, la de cómo tiene que quedar la masa. Se leen donde el texto las nombra, y
todas juntas al final. **El diseño no depende de ninguna.**

#### C03.5.1 — La foto de la cabecera *(J6)*

- [ ] Se dibuja `foto` **ya resuelta** (C05.1.5): la URL externa tal cual, o la foto del depósito que nombra `foto:N`.
- [ ] Si es de Drive, se pide con el token: mientras llega, un recuadro del tamaño que va a ocupar. **Si ya no está en Drive, el bloque se saca** y la receta queda sin foto, sin ícono roto y sin aviso.
- [ ] **Una URL externa que no carga se trata igual**: el bloque se saca, sin ícono roto y sin aviso. La app se entera por el `error` del `<img>`, que no burbujea y por eso se escucha en captura.
- [ ] La receta sin foto se ve completa igual: empieza por el título.
- [ ] No se muestra en modo cocina.

#### C03.5.2 — Las fotos del cuerpo y la galería *(J6)*

- [ ] Una referencia `![epígrafe](foto:N)` en un ingrediente, un paso o una nota se dibuja **debajo del texto de esa línea**, al ancho de la ficha, con su epígrafe si lo tiene.
- [ ] Al final, después de Notas y antes de las secciones ajenas, una ficha **Fotos** con el depósito entero, en su orden, cuadradas y de a tres por fila.
- [ ] Sin depósito, la ficha no se dibuja.
- [ ] **En el modo cocina**, cada paso y cada ingrediente dibujan su foto debajo, igual que en la lectura. Tocarlas no abre el visor: en la cocina un toque marca el paso (C03.2.4).
- [ ] Una foto de Drive que ya no está se dibuja en la galería como un recuadro con *«La foto ya no está en Drive.»*; en la cabecera o en una línea, no se dibuja.
- [ ] Una foto externa cuya URL no carga sigue la misma regla, con su propio motivo: en la galería, *«No se pudo cargar la foto.»*; en cualquier otro lado, no se dibuja.

#### C03.5.3 — El visor *(J6)*

- [ ] Tocar cualquier foto —la cabecera, una en línea o una de la grilla— abre el **visor**: la foto entera sobre un velo, encima de todo.
- [ ] El visor **desliza entre las fotos del depósito**, en su orden, empezando por la que se tocó. En los extremos no da la vuelta.
- [ ] Se cierra tocando, en cualquier parte. Es estado de la pantalla, no una ruta.
- [ ] Una cabecera externa que no está en el depósito se abre sola, sin deslizar.

### F03.6 — Tamaños para la distancia del brazo

El texto y los controles se leen y se tocan con el teléfono apoyado, a la
distancia del brazo, con un dedo que puede estar sucio.

#### C03.6.1 — Los controles *(J6)*

- [ ] Todos los controles táctiles cumplen el mismo tamaño mínimo del sistema.
- [ ] Es una regla del sistema, no una decisión de esta pantalla; la excepción hacia arriba es el modo cocina (C03.2.3).
- [ ] No hay botón flotante de acción: taparía el contenido.

### F03.7 — Compartir la receta

Mandarle una receta a alguien que no usa la app, de tres maneras: un **PDF**, un
**Link** que la muestra sin login, o la receta como **Texto**. Lo compartido es
una copia del momento: **nada queda publicado en Drive** y no hay nada que
revocar.

#### C03.7.1 — La ficha de compartir *(J6)*

- [ ] El ícono de compartir del encabezado (C03.1.2b) abre una ficha al pie con **PDF**, **Link**, **Texto** y **Cancelar**.
- [ ] La ficha es estado de la pantalla, no una ruta: volver, *Cancelar* o tocar el velo la cierran. Mientras está abierta, la página de atrás no scrollea.
- [ ] Las tres opciones usan el menú Compartir del sistema. Si el usuario cancela ese menú, la ficha se cierra sin aviso.
- [ ] Ninguna de las tres lleva los tags, la marca de incompleta ni las claves extra del frontmatter.

#### C03.7.2 — PDF *(J6)*

- [ ] Se arma en el teléfono, con pdfmake e **Inter** embebida —tiene ⅓ y ⅔, que un PDF no puede tomar de otra fuente—. La librería y las fuentes se empiezan a cargar al abrir la ficha, no al arrancar la app.
- [ ] Página de **105 × 180 mm**, con el tema oscuro de la app en todas las páginas. La cabecera es un bloque con título, contexto, descripción y fuente; después las secciones, con el formato en línea del markdown.
- [ ] **Lleva las fotos:** la de la cabecera arriba del título, al ancho de la página y con el alto topado a 90 mm; cada referencia debajo de su línea; y la galería del depósito al final, después de Notas y antes de las secciones ajenas, de a dos por fila.
- [ ] Las fotos se achican a 800 px de lado mayor y viajan adentro del archivo. Las de Drive salen del caché o se piden con el token; una externa se pide con `fetch`, y si falla —CORS, red— se omite sin aviso. *«Armando el PDF…»* ya cubre esa espera.
- [ ] No lleva tags, link al `.md` ni botones. Una sección vacía no se dibuja.
- [ ] Ningún ingrediente, paso, variación ni ítem de nota se parte entre páginas —tampoco una línea con su foto—, y un título de sección nunca queda solo al pie.
- [ ] El archivo se llama como el `.md` de la receta, con extensión `.pdf`.
- [ ] Mientras se arma, *PDF* muestra el spinner con *"Armando el PDF…"* y la ficha no acepta otro toque.
- [ ] Si armarlo tardó más de lo que dura el permiso del toque, la ficha pasa a *"El PDF está listo."* con **Enviar PDF**, que manda el archivo ya armado.
- [ ] Si el navegador no puede compartir archivos, el PDF se descarga.
- [ ] Si falla, la ficha dice *"No se pudo armar el PDF."* con *Reintentar*.

#### C03.7.3 — Link *(J6)*

- [ ] El link abre la vista de invitado (C03.7.5): `…/#/ver?r=<carga>`.
- [ ] **La receta viaja entera en el fragmento del link**, comprimida: el `.md` sin tags ni claves extra, más el nombre de la categoría, que el `.md` no lleva. No llega a ningún servidor.
- [ ] **Las fotos de Drive no viajan:** el depósito va resuelto y sólo con las externas, la cabecera sólo si es externa, y las referencias a fotos que no viajaron no se dibujan (C05.1.5). Quien abre el link no tiene token.
- [ ] La carga empieza con la versión del formato; una carga de otra versión se trata como link roto.
- [ ] Sin menú Compartir, el link se copia y la ficha avisa *"Link copiado."*. Sin portapapeles, la ficha lo muestra seleccionable: *"Copialo desde acá:"*.

#### C03.7.4 — Texto *(J6)*

- [ ] La receta casi como está en el `.md`: el título, debajo el contexto (categoría · rinde · duración · dificultad), la descripción, cada sección con su nombre sin los `#`, y al final *Fuente: …*.
- [ ] Conserva el formato que WhatsApp entiende: `*negrita*`, `_itálica_`, `- ` y `1. `. Un link queda como *texto (url)*; una imagen, como su URL.
- [ ] **Una referencia a una foto externa se escribe como su URL; una de Drive no se escribe**, porque nadie más la puede abrir. La sección Fotos no va: el depósito no es texto.
- [ ] Nunca hay dos renglones en blanco seguidos, y una sección vacía no aparece.
- [ ] Sin menú Compartir, se copia y avisa *"Texto copiado."*; sin portapapeles, se muestra seleccionable, como el link.

#### C03.7.5 — La vista de invitado *(J6)*

- [ ] Quien abre el link ve la receta **sin conectar con Google**. La vista no lee ni escribe Drive, no pide el token, no guarda nada en el navegador y no ofrece guardar la receta.
- [ ] Lectura (`#/ver?r=…`): la misma pila de fichas de la receta, con el contexto sin el color de la categoría —es de la carpeta del dueño—. **No tiene encabezado** —ni volver, ni estrella, ni compartir, ni `.md`—, ni fila de tags. Al pie, sólo **Cocinar**, si hay ingredientes o pasos.
- [ ] **Dibuja sólo las fotos externas** —las que viajaron en el link—, con su galería y su visor; sin ninguna, la ficha Fotos no se dibuja. Nunca le pide nada a Drive.
- [ ] Cocinar (`#/ver/cocinar?r=…`): el mismo modo cocina de la app —conmutador, paso actual, pasos hechos, sol—. **La única salida es el chevron**, que vuelve a la lectura; *Salir* no se dibuja.
- [ ] El título de la pestaña es el de la receta.
- [ ] Si la carga no se puede leer —cortada, alterada, de otra versión—, la pantalla dice *"Este link está roto o incompleto."* y nada más.
- [ ] Es una pantalla con controlador propio y una lista cerrada de acciones, armada con las mismas piezas que la receta: lo que se agregue a la receta no aparece en el invitado salvo que se sume a propósito.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C03.1.1, C03.1.2b, C03.1.3, C03.2.1, C03.2.2, C03.2.3, C03.2.4, C03.3.1, C03.4.1, C03.5.1, C03.5.2, C03.5.3, C03.6.1, C03.7.1, C03.7.2, C03.7.3, C03.7.4, C03.7.5 | J6 |
| C03.1.2 | J6, J7 |

Ninguna capacidad de esta épica quedó sin job.
