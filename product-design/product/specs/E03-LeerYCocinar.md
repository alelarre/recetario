# E03 — Leer y cocinar

**Versión:** 3.1 · **Fecha:** 2026-09-12 · **Estado:** Final — Hito 11
**Job:** J6 · **Prioridad:** media · **Flujo:** F6

> **Cambios en la 3.1 (2026-09-12):** el encabezado de la receta se especifica
> entero y es nuevo (C03.1.2b): arranca sin texto, queda fijo, toma el título
> recortado al scrollear y lleva el **link al `.md` en Drive**. Se va el menú ⋯ y
> *Cocinar* aparece sólo si hay pasos (C03.1.2). La marca de incompleta **sale
> del archivo**, no de mirar el contenido (C03.1.3). El modo cocina tiene dos
> salidas que hacen lo mismo, resetea el scroll al entrar y no se deja en el
> historial (C03.2.1).
>
> **Cambio en la 3.0 (Hito 11):** C03.2.4 — un paso hecho lleva check y texto
> atenuado, no tachado. La receta en lectura queda como pila de fichas con la
> foto dentro de la primera.
>
> **Cambio en la 2.1 (Hito 9):** C03.2.4 — en modo cocina se puede realzar el
> paso actual y tachar los hechos, sin que nada de eso persista.
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. **Se cierra el `[abierto]` de F03.2:** los
> ingredientes se resuelven con un modo cocina y un conmutador
> Ingredientes/Pasos, no con la barra pegajosa de la implementación actual.

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

La receta a la vista mientras se cocina, con las manos ocupadas o sucias, el
teléfono apoyado y la atención partida.

**Es el uso menor de los cuatro** —solo para recetas complejas o poco
frecuentes— y es, a la vez, lo único que la app actual ya resuelve bien.

La pantalla sirve a **dos momentos distintos con la misma información**:

1. **Prelectura.** Antes de decidir o de empezar: se lee todo de corrido, incluidas notas y variaciones.
2. **Cocina.** Ingredientes durante el *mise en place*; pasos durante la ejecución. Son **excluyentes en el tiempo**, y notas y variaciones no se usan acá.

---

## Features

### F03.1 — La receta en una columna

Todo a la vista, en orden: descripción, ingredientes, preparación, variaciones,
notas. Sin pestañas: costaban cuatro toques para leer una receta entera.

#### C03.1.1 — El orden de lectura *(J6)*

- [ ] Foto si la hay, título, línea de contexto (categoría, tiempo, dificultad), fuente, descripción, ingredientes, preparación, variaciones, notas.
- [ ] Una sección ausente no se dibuja: no queda encabezado vacío.
- [ ] Una sección desconocida del `.md` se muestra tal cual, al final, sin interpretarse (C05.1.2).
- [ ] Toda la receta se lee scrolleando, sin ningún toque.

#### C03.1.2 — Las acciones *(J6, J7)*

- [ ] Al pie: **Cocinar** y **Editar**. Sin ingredientes ni pasos, **Cocinar no se ofrece**: no hay nada que cocinar.
- [ ] Volver es un control de tamaño normal en el encabezado, y el gesto del sistema hace lo mismo.
- [ ] **No hay menú de acciones secundarias:** las dos acciones están al pie y un menú vacío es peor que ninguno. `[del 2026-09-12]`

#### C03.1.2b — El encabezado *(J6)*

`[nueva el 2026-09-12]`

- [ ] Arranca **sin texto**: el título está abajo, grande y entero, y repetirlo arriba es decir dos veces lo mismo.
- [ ] Queda **fijo al scrollear**, y cuando el título grande sale de pantalla lo toma **recortado con elipsis**, sin llegar a pisar lo que tenga a la derecha.
- [ ] A la derecha, un **link al `.md` en Drive**, con el logo de Drive y la etiqueta `.md`, que abre en otra pestaña. Es un dato al margen y no un botón: sin caja y más chico que los controles.
- [ ] El link sólo aparece si la receta está en el índice: sin fila no se conoce su id de archivo.

#### C03.1.3 — Estados de la receta *(J6)*

- [ ] Incompleta: **un chip más de la fila de tags, el primero, que dice *Incompleta*** y lleva la marca (design-system §6.5). Es **tocable** y **abre el editor**, que es donde están las dos salidas: completar lo que falta, o mover el conmutador a *Terminada* (C04.4.1). El resto de la receta se muestra igual.
- [ ] Va **en la fila de tags y no suelto debajo** `[2026-09-12]`: es un estado del mismo orden que un tag, se lee en el mismo barrido, y toma de ahí el alto y el aire que le faltaban.
- [ ] La marca sale de la clave `completa` del archivo, no de mirar el contenido (C05.3.1).
- [ ] Sin foto: el bloque de foto no se dibuja y la receta empieza por el título.
- [ ] Cargando: el esqueleto de la pantalla está mientras se lee el `.md`.
- [ ] Sin red: no se puede abrir; el aviso (C05.8.1).
- [ ] El `.md` ya no está en Drive: el aviso dice que la receta ya no existe y ofrece volver. La app **no corrige el índice** (R4).

### F03.2 — El modo cocina

`[cierra el abierto de la 1.0 — wireframes §3.4]` `[divergencia deliberada con lo implementado: reemplaza la barra pegajosa]`

Los ingredientes se consultan repetidamente durante la preparación y tienen que
seguir alcanzables sin perder el lugar en los pasos. La solución es un **modo**
aparte, con un conmutador de dos posiciones.

**Por qué esto no contradice el veto a las pestañas:** el argumento contra ellas
era que escondían las notas y las variaciones justo al cocinar. Notas y
variaciones **no se usan cocinando**, y ingredientes y pasos son excluyentes en
el tiempo. Con eso, el conmutador no esconde nada que haga falta.

#### C03.2.1 — Se entra a propósito *(J6)*

- [ ] Se entra desde **Cocinar** en la receta abierta. No es la vista por defecto: cocinar es el uso menor.
- [ ] **Dos salidas, con destinos distintos** `[del 2026-09-12]`: el chevron vuelve **a la receta** —seguir leyéndola sin la escala de cocina— y **Salir** vuelve **a la categoría**, que es donde se elige otra cosa.
- [ ] Las dos sueltan el bloqueo de pantalla: se dejó de cocinar.
- [ ] Volver con el gesto del sistema sale del modo, no de la receta. Salir del modo **no deja la cocina en el historial**: volver desde la receta lleva a donde se estaba antes.
- [ ] Al entrar, la pantalla **empieza arriba**: se entra desde el pie de la receta y heredar ese scroll abría los ingredientes por la mitad.

#### C03.2.2 — El conmutador Ingredientes / Pasos *(J6)*

- [ ] Dos posiciones. Al entrar, abre en **Ingredientes**: el *mise en place* va primero.
- [ ] **Preserva la posición de scroll de cada lado.** Ir a Ingredientes y volver a Pasos devuelve al paso donde se estaba, no al principio.
- [ ] Cambiar de posición es un toque, en un control de tamaño grande.
- [ ] Notas, variaciones y descripción **no se muestran** en este modo.

**Edge cases:** la receta no tiene ingredientes o no tiene pasos → el conmutador
muestra solo lo que existe, sin una posición vacía · la receta no tiene ninguna
de las dos → **Cocinar** no se ofrece.

#### C03.2.4 — Seguir el hilo entre los pasos *(J6)*

`[nueva en la 2.1 — Hito 9]`

- [ ] **Al entrar, el paso 1 ya está realzado** `[del 2026-09-12]`: sin un paso elegido, la pantalla no dice dónde estás.
- [ ] Tocar un paso lo **realza**, y queda realzado hasta que se toque otro. Es dónde estás. Tocar el que ya está realzado lo da por hecho y realza el siguiente.
- [ ] Tocar un paso **no selecciona su texto** `[del 2026-09-12]`. Copiar un paso se hace desde la receta abierta.
- [ ] Un paso se puede **marcar como hecho**: su número se reemplaza por un check y el texto se atenúa. **No se tacha** — a 22 px el tachado cruza el renglón entero y lo vuelve difícil de leer, que es lo contrario de lo que el modo cocina busca.
- [ ] **Nada de esto persiste:** no entra al `.md`, no entra al índice, y se pierde al salir del modo cocina.
- [ ] Al volver a entrar, no hay ningún paso hecho y el realzado vuelve a ser el 1.
- [ ] Solo existe en modo cocina: la receta en lectura no tiene ni realce ni tachado.

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

- [ ] Vive en el encabezado del modo cocina, como ícono solo —el sol— a la izquierda de *Salir*, con su etiqueta accesible `[del 2026-09-12: era una barra al pie]`.
- [ ] Dice si está activo: encendido, el ícono se invierte —fondo claro, sol oscuro—, como el estado elegido del editor.
- [ ] Arranca apagado cada vez que se entra al modo: no recuerda la elección anterior.
- [ ] Salir del modo cocina lo libera.
- [ ] Al volver de segundo plano con el modo abierto, se reintenta tomarlo.
- [ ] Si el navegador no lo soporta o lo niega, el control **no se muestra**. No se avisa: no es un problema del usuario.

**Nota técnica:** Wake Lock API. Ya implementada, con reintento al volver de
segundo plano.

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

### F03.5 — La foto, si la hay

Se dibuja donde esté, desde una URL externa. **El diseño no depende de ella.**

#### C03.5.1 — La foto de la receta *(J6)*

- [ ] Se carga desde la URL externa de `foto`, tal cual.
- [ ] Si no carga, la receta se dibuja sin bloque de foto. Sin ícono roto y sin aviso.
- [ ] La receta sin foto se ve completa igual: empieza por el título.
- [ ] No se muestra en modo cocina.

### F03.6 — Tamaños para la distancia del brazo

El texto y los controles se leen y se tocan con el teléfono apoyado, a la
distancia del brazo, con un dedo que puede estar sucio.

#### C03.6.1 — Los controles *(J6)*

- [ ] Todos los controles táctiles cumplen el mismo tamaño mínimo del sistema.
- [ ] Es una regla del sistema, no una decisión de esta pantalla; la excepción hacia arriba es el modo cocina (C03.2.3).
- [ ] No hay botón flotante de acción: taparía el contenido.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C03.1.1, C03.1.3, C03.2.1, C03.2.2, C03.2.3, C03.2.4, C03.3.1, C03.4.1, C03.5.1, C03.6.1 | J6 |
| C03.1.2 | J6, J7 |

Ninguna capacidad de esta épica quedó sin job.
