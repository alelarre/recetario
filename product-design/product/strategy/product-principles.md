# Recetario — Product Principles

**Versión:** 1.0
**Fecha:** 2026-09-05
**Estado:** Final — Hito 3 cerrado

---

## Sobre este documento

Siete principios. No son valores: son **árbitros**. Cada uno existe porque hay
una decisión concreta, pendiente en este proyecto, que sin él se resolvería por
gusto.

El orden importa. **El 1 es innegociable** y gana contra cualquier otro. Del 2
al 7 son operativos y se leen juntos; cuando dos chocan, el conflicto se
resuelve explícitamente y se registra en `plan/decision-log.md`.

Cada principio lleva la tensión que resuelve, cómo se aplica, y una decisión
real de los Hitos 5, 6 u 8 que desempata.

---

## Tabla síntesis

| # | Principio | Tensión que resuelve | Decisión que desempata |
|---|---|---|---|
| 1 | El archivo es el producto; la app es una vista | Independencia del dato vs. comodidad de la app | Dónde vive un borrador a medio capturar |
| 2 | Capturar cuesta un solo dato | Velocidad de captura vs. estructura del dato | Qué le pide la bandeja al usuario cuando comparte |
| 3 | Se lee lo que llega, y se dice qué le falta | Rigor del esquema vs. tolerancia al dato ajeno | Qué hace la app con una receta sin ingredientes estructurados |
| 4 | Avisa, ofrece la salida, y no insiste | Automatismo silencioso vs. control del usuario | Qué pasa cuando se corta la red al guardar |
| 5 | Se navega para llegar y para pasear | Clasificar vs. acceder | Qué ocupa la pantalla principal |
| 6 | Lo hipotético se explora; no se instala | Ambición del producto vs. evidencia de conducta | Si el planificador entra en la navegación primaria |
| 7 | La misma app en cualquier pantalla | Optimizar para un contexto vs. servir a todos | Para qué ancho se diseña, y qué tamaño tiene un control |

---

## 1. El archivo es el producto; la app es una vista

Todo dato que le importe al usuario —receta, borrador, plan semanal, lista de
compras— **nace como archivo en Drive**, no como estado de la app que después se
sincroniza. La app puede desaparecer entera y no se pierde nada.

La regla cae sobre **el dato del usuario**, no sobre el mecanismo. El índice en
Google Sheets es un instrumento circunstancial: existe para que la PWA escale y
no tenga que resolver cada funcionalidad con queries a Drive. Es reemplazable
por cualquier solución técnica superadora sin discusión de producto.

**Tensión que resuelve:** independencia del dato vs. comodidad de la app.
Siempre hay una versión más cómoda de construir cualquier feature si el dato
vive primero adentro.

**En la práctica, esto significa:**

- Un borrador es un `.md` en Drive desde el primer momento, no una nota local que sube después. No es solo doctrina: es lo que permite empezar en el Android y seguir en la Mac.
- Un plan semanal, si J9 alguna vez se construye, es un archivo. Por homogeneidad y simplicidad, aunque ahí la portabilidad importe menos.
- Cualquier estructura derivada —índice, caches— tiene que poder borrarse y reconstruirse sin pérdida.
- No existe un dato que solo la app sepa leer. Si hace falta inventar un formato, se elige el más aburrido que funcione.
- **Sin red no hay captura.** No hay cola local ni copia offline que espere para subir: si Drive no está, la operación falla y se avisa (principio 4). Es la consecuencia dura de este principio y se acepta como tal.

**Ejemplo de arbitraje (Hito 5):** al diseñar la bandeja de J2 va a aparecer la
opción de guardar el borrador local y subirlo en batch, para que compartir sea
instantáneo y no dependa de la red. Este principio la descarta, aun sabiendo que
el costo es una captura perdida cuando no hay señal — que es justo el riesgo que
J2 existe para eliminar. Se prefiere un sistema con una sola fuente de verdad
antes que uno con dos y un momento de reconciliación.

---

## 2. Capturar cuesta un solo dato

El momento de guardar y el momento de ordenar están separados. Al capturar, la
app pide **una sola cosa: el título**, que el usuario escribe. Nada más. Todo lo
demás —qué es, cómo se clasifica, qué lleva— se resuelve al convertir.

El título no es burocracia: es lo único que vuelve al borrador recuperable. Sin
él la bandeja es una pila de URLs indistinguibles y el problema de J2 se
reproduce adentro del producto.

**Tensión que resuelve:** velocidad de captura vs. estructura del dato. Es la
tensión declarada como la que más veces va a haber que desempatar. J2 pide
guardar sin fricción; J4 —buscar por ingrediente— pide estructura. Lo que entra
rápido entra sin estructura, y está bien.

**En la práctica, esto significa:**

- El único campo del camino de entrada es el título, y es obligatorio para grabar.
- La bandeja **no** pregunta categoría, ni tags, ni ingredientes, ni nada más. Cualquier campo nuevo tiene que ganarle al riesgo de perder la receta, y ninguno lo hace.
- Un borrador con título y una URL es una captura completa. Puede no tener ingredientes, ni pasos, ni sentido.
- La estructura la impone la **conversión** (J3), que es un momento con atención completa y sentada, no la captura (J2).
- Corolario: borrador y receta son **dos entidades distintas**, no dos estados de la misma. El borrador es input crudo y **se borra de Drive cuando se convierte**; la URL de origen sobrevive como atributo `fuente` de la receta.

**Ejemplo de arbitraje (Hito 5):** al diseñar el Share Target va a ser tentador
pedir también una categoría —"total es un toque más"— porque resuelve de una vez
dónde archivarlo después. Este principio lo descarta: el presupuesto de la
captura es un campo y ya está gastado en el título.

---

## 3. Se lee lo que llega, y se dice qué le falta

Los `.md` los escriben agentes por fuera de la app, y el usuario a mano. La app
**no es la autoridad sobre el formato**: es una lectora tolerante. Si un archivo
cumple el mínimo, se muestra. Lo que le falte se informa, no se castiga.

**Tensión que resuelve:** rigor del esquema vs. tolerancia al dato ajeno. Un
esquema estricto hace la app más simple y las features más confiables, pero
convierte cada archivo escrito afuera en un error potencial — y afuera es donde
se escribe casi todo.

**En la práctica, esto significa:**

- El mínimo para renderizar es chico —probablemente solo el título; el formato exacto se define en el Hito 5— y todo lo demás es opcional.
- **"Incompleta" es un estado derivado del contenido**, calculado al leer, no un tag que alguien escribe y que se desactualiza en cuanto el archivo se edita afuera.
- El criterio de completitud y el de buscabilidad son el mismo: una receta cuyos ingredientes están en prosa libre no se puede filtrar por ingrediente (J4), y por eso mismo está incompleta. No hay dos varas.
- **La marca se puede quitar a mano.** Hay recetas que legítimamente nunca van a tener ingredientes estructurados —una técnica, un fondo, una masa madre—; el usuario declara que están bien así y la marca desaparece. Es la única excepción manual del principio, y es del usuario, no de un agente.
- Una receta incompleta **se lista y se abre igual**. Se ve que le falta algo; no se esconde ni se bloquea.
- Un archivo corrupto —que no cumple ni el mínimo— se ignora, y el hecho se informa en un lugar no central del diseño. Dónde exactamente se decide en el Hito 5.

**Ejemplo de arbitraje (Hito 5):** cuando se elija el formato del `.md` va a
aparecer la opción de exigir ingredientes estructurados para que J4 funcione
siempre. Este principio la descarta: se prefiere una receta consultable a medias
antes que una receta rechazada. El formato define un objetivo, la app dice quién
no lo alcanza, y el usuario tiene la última palabra.

---

## 4. Avisa, ofrece la salida, y no insiste

Cuando algo falla, la app **lo dice una vez**, en el momento, y si hay una
reparación posible la ofrece como acción adentro de la app. No reintenta en
silencio, no repara sola, y no manda al usuario a arreglar nada por fuera.

**Tensión que resuelve:** automatismo silencioso vs. control del usuario. El
reintento invisible parece más prolijo, pero deja al usuario sin saber si su
trabajo existe — y este usuario está cocinando, o compartiendo algo en dos
segundos.

**En la práctica, esto significa:**

- Se corta la red al guardar: avisa, y nada más. No hay cola de reintentos, ni "se guardará más tarde" sin evidencia. Vale igual para guardar una receta y para capturar un borrador.
- El índice está corrupto: avisa **y ofrece el botón de reindexar**. Esto contradice explícitamente la política del repo padre, donde la recuperación es borrar `_indice` a mano en Drive.
- Ningún error se muestra crudo. El mensaje dice qué pasó y qué se puede hacer.
- Un aviso que no tiene acción asociada no interrumpe: vive en un lugar secundario.

**Ejemplo de arbitraje (Hito 6):** al wireframear el arranque va a estar la
opción de auto-reparar el índice sin preguntar, porque el índice es derivado y
reconstruirlo no pierde datos. Este principio la descarta: reconstruir puede
tardar mucho —hoy se leen los `.md` de a uno— y arrancar la app no es el momento
de decidirlo por el usuario. Se ofrece.

---

## 5. Se navega para llegar y para pasear

La navegación sirve a los dos accesos: **saber el nombre** (J1) y **no saberlo**
(J5). La búsqueda es lo primero de la pantalla principal porque atiende al job
más frecuente; la clasificación va abajo y sirve al otro. Ninguna estructura de
clasificación se queda con el lugar principal por herencia.

**Tensión que resuelve:** clasificar vs. acceder. Clasificar es satisfactorio de
diseñar y produce pantallas ordenadas; el usuario no está buscando un orden,
está buscando una receta o una idea.

**En la práctica, esto significa:**

- **La pantalla principal es la búsqueda arriba y las categorías abajo.** Dos cosas, nada más. Si en algún momento entran recomendaciones, van entre las dos — no arriba de la búsqueda.
- Pasear es un modo de uso de primera clase, no un efecto secundario de navegar el árbol.
- La forma concreta de la clasificación no se hereda: las 16 categorías se justifican de nuevo o se van, aunque el lugar del bloque en la pantalla ya esté decidido.
- **Novedad no es un dato.** No hay historial, `ultima_vez` ni `veces`. Se resuelve mostrando, no registrando.
- El objetivo de escala son ~1.000 recetas, mayormente migradas — recetas que el usuario nunca cocinó y cuyo nombre no recuerda. Toda navegación se evalúa a esa escala, no a las decenas de hoy.

**Ejemplo de arbitraje (Hito 5):** hoy la app se abre en una grilla de 16
categorías con fotos, sin búsqueda a la vista. Este principio la desaloja del
primer lugar sin discutir su valor: la categoría sirve a J5, que es real, pero
J1 es más frecuente y no la usa nunca. La grilla baja; la búsqueda sube.

---

## 6. Lo hipotético se explora; no se instala

Un job sin conducta que lo respalde **no puede ocupar estructura permanente del
producto**. Se construye como exploración, con costo de retiro bajo, y se
promueve solo si el uso lo confirma.

**Tensión que resuelve:** ambición del producto vs. evidencia de conducta. J9
—planificar la semana y armar la compra— es el único job hipotético y el único
que **cambiaría** la conducta del usuario en vez de acompañarla: apunta a más
variedad entre semana, cuando entre semana hoy se cocina de memoria y sin
receta.

**En la práctica, esto significa:**

- J9 no entra en la navegación primaria, no define entidades nuevas en el núcleo, y no condiciona el diseño de los jobs validados.
- Si se construye, cumple igual el principio 1: el plan semanal es un archivo.
- Sacarlo tiene que costar borrar una pantalla, no rediseñar el producto.
- Lo mismo vale para cualquier job futuro que aparezca sin conducta observada.

**Ejemplo de arbitraje (Hito 5):** si el planificador entra o no en la barra de
navegación primaria. Este principio dice que no: la navegación primaria la
ocupan los jobs validados. El planificador se explora por una entrada
secundaria, y se promueve si el uso lo justifica.

---

## 7. La misma app en cualquier pantalla

Recetario es un solo producto y se lee como uno solo en todas sus pantallas. El
teléfono es el contexto principal y ahí tiene que verse **bien**; la computadora
es un contexto real —recuperar y elegir qué cocinar también pasa sentado, en la
Mac— y ahí tiene que verse **no mal**.

Es una asimetría declarada, no paridad: nadie va a diseñar dos veces cada
pantalla, pero tampoco se acepta que la versión ancha sea una columna angosta
perdida en el medio de la nada.

**Tensión que resuelve:** optimizar para un contexto vs. servir a todos. La app
actual eligió el teléfono en vertical y simplificó el resto, y el resultado es
una de las tres molestias que el usuario reporta.

**En la práctica, esto significa:**

- Se diseña para el teléfono y se define qué hace el layout cuando sobra ancho. No queda librado al azar del CSS.
- Las pantallas comparten sistema: los mismos componentes, la misma jerarquía, el mismo vocabulario visual. La cohesión es un requisito, no un pulido final.
- **El tamaño de los controles es una regla del sistema, no una decisión por pantalla.** Nace de las manos que los usan: dedo, a veces sucio, a veces a la distancia del brazo. El chevron de volver de la app actual es el contraejemplo.

**Ejemplo de arbitraje (Hito 8):** cuando se defina el design system va a
aparecer la opción de tratar el desktop como una variante secundaria sin tokens
propios. Este principio acota el alcance: no exige un diseño desktop completo,
pero sí que el ancho tenga una respuesta definida y que los tamaños de control
salgan de una regla única.

---

## Verificación — decisiones abiertas

Criterio de completitud del hito: los principios tienen que desempatar
decisiones reales de este proyecto.

| Decisión abierta | Principio | Cómo desempata |
|---|---|---|
| ¿Qué ocupa la pantalla principal? | **5** | Búsqueda arriba, categorías abajo. La grilla de 16 tiles pierde el primer lugar; qué forma toma la clasificación se decide en el Hito 5. |
| ¿El planificador entra en la navegación primaria? | **6** | No. Es el único job hipotético; entra como exploración por una entrada secundaria y con costo de retiro bajo. |
| ¿Cuánto muestra la pantalla de cocina? | **3** + **7** | Muestra la receta entera tal como está en el archivo, incluida la marca de incompleta. La app no decide qué esconder de un dato que no controla; los tamaños salen de la regla de controles del principio 7. |
| ¿Qué pide el Share Target al capturar? | **2** | El título, escrito por el usuario. Nada más. |
| ¿Qué pasa si se comparte sin red? | **1** + **4** | Falla y avisa. No hay cola local. Está aceptado explícitamente, aun sabiendo que es el riesgo que J2 existe para eliminar. |
| ¿Qué pasa con el borrador al convertirse? | **2** | Se borra de Drive. La URL de origen sobrevive como atributo `fuente` de la receta. |

---

## Lo que estos principios no arbitran

Registrado para no forzarlos donde no llegan:

| Tema | Por qué queda afuera |
|---|---|
| El popup de autenticación de Google | Es una restricción de plataforma, no una decisión de producto: sin backend no hay alternativa. Registrado en `plan/BACKLOG.md`. |
| La estética concreta —paleta, tipografía, densidad, tema— | Se decide en el Hito 8 con el design system. El principio 7 exige cohesión y una regla de tamaños; no dice de qué color es nada. |
| El formato exacto del `.md` | El principio 3 fija el criterio —mínimo chico, completitud derivada—; el benchmark del Hito 5 elige el formato. |
| Si el agente se embebe en la PWA | Decisión abierta sin hito asignado. Ningún principio la fuerza en ninguna dirección. |
| Qué clasificación reemplaza a las 16 categorías | El principio 5 le asigna un lugar en la pantalla, no una forma. Hito 5. |
