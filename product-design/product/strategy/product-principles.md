# Recetario — Product Principles

**Versión:** 1.0
**Fecha:** 2026-09-05
**Estado:** Final — Hito 3 cerrado

---

## Sobre este documento

Siete principios. No son valores: son **árbitros**. Cada uno existe porque hay
una decisión concreta que sin él se resolvería por gusto.

El orden importa. **El 1 es innegociable** y gana contra cualquier otro. Del 2
al 7 son operativos y se leen juntos; cuando dos chocan, el conflicto se
resuelve explícitamente y la regla que sale queda escrita en el spec que toca.

Cada principio lleva la tensión que resuelve, cómo se aplica, y una decisión
real del producto que desempata.

---

## Tabla síntesis

| # | Principio | Tensión que resuelve | Decisión que desempata |
|---|---|---|---|
| 1 | El archivo es el producto; la app es una vista | Independencia del dato vs. comodidad de la app | Dónde vive un borrador a medio capturar |
| 2 | Capturar cuesta un solo dato | Velocidad de captura vs. estructura del dato | Qué le pide el editor al usuario cuando comparte |
| 3 | Se lee lo que llega, y se dice qué le falta | Rigor del esquema vs. tolerancia al dato ajeno | Qué hace la app con una receta sin ingredientes estructurados |
| 4 | Avisa, ofrece la salida, y no insiste | Automatismo silencioso vs. control del usuario | Qué pasa cuando se corta la red al guardar |
| 5 | Se navega para llegar y para pasear | Clasificar vs. acceder | Qué ocupa la pantalla principal |
| 6 | Lo hipotético se explora; no se instala | Ambición del producto vs. evidencia de conducta | Cuánto del producto ocupa el plan de la semana |
| 7 | La misma app en cualquier pantalla | Optimizar para un contexto vs. servir a todos | Para qué ancho se diseña, y qué tamaño tiene un control |

---

## 1. El archivo es el producto; la app es una vista

Todo dato que le importe al usuario —receta, borrador, plan de la semana—
**nace como archivo en Drive**, no como estado de la app que después se
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
- El plan de la semana es un archivo, `_plan.md`. Por homogeneidad y simplicidad, aunque ahí la portabilidad importe menos.
- Cualquier estructura derivada —el índice, su copia en el navegador— tiene que poder borrarse y reconstruirse sin pérdida.
- No existe un dato que solo la app sepa leer. Si hace falta inventar un formato, se elige el más aburrido que funcione.
- **Sin red no hay captura.** No hay cola local ni copia offline que espere para subir: si Drive no está, la operación falla y se avisa (principio 4). Es la consecuencia dura de este principio y se acepta como tal.

**Ejemplo de arbitraje:** en la captura de J2 aparece la opción de guardar el
borrador local y subirlo en batch, para que compartir sea instantáneo y no
dependa de la red. Este principio la descarta, aun sabiendo que
el costo es una captura perdida cuando no hay señal — que es justo el riesgo que
J2 existe para eliminar. Se prefiere un sistema con una sola fuente de verdad
antes que uno con dos y un momento de reconciliación.

---

## 2. Capturar cuesta un solo dato

El momento de guardar y el momento de ordenar están separados. Al capturar, la
app ofrece **una sola cosa: el título**, que el usuario escribe si quiere. Nada
más es necesario. Todo lo demás —qué es, cómo se clasifica, qué lleva— se
resuelve al convertir.

El título es lo que vuelve al borrador reconocible en Borradores. Si no se
escribe, el borrador se titula con el momento en que se guardó, y se le pone
uno al convertirlo.

**Tensión que resuelve:** velocidad de captura vs. estructura del dato. Es la
tensión declarada como la que más veces va a haber que desempatar. J2 pide
guardar sin fricción; J4 —buscar por ingrediente— pide estructura. Lo que entra
rápido entra sin estructura, y está bien.

**En la práctica, esto significa:**

- Compartir y tocar Guardar alcanza. El título es opcional mientras la receta es un borrador.
- El editor que abre lo compartido **no exige** categoría, ni tags, ni ingredientes, ni nada más: la categoría arranca en «Sin categoría». Cualquier campo obligatorio nuevo tiene que ganarle al riesgo de perder la receta, y ninguno lo hace.
- Un borrador con una URL es una captura completa. Puede no tener ingredientes, ni pasos, ni sentido.
- La estructura la impone la **conversión** (J3), que es un momento con atención completa y sentada, no la captura (J2).
- Corolario: borrador y receta son **la misma entidad en dos estados**, y el tag `borrador` dice cuál. Convertir es completar el mismo archivo y sacarle el tag; la URL de origen queda como atributo `fuente`.

**Ejemplo de arbitraje:** en el Share Target es tentador pedir también una
categoría —"total es un toque más"— porque resuelve de una vez
dónde archivarlo después. Este principio lo descarta: la categoría arranca en
«Sin categoría» y elegirla es parte de la conversión.

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

- El mínimo para renderizar es el título; todo lo demás es opcional. Un valor que la app no reconoce —una `dificultad` o una duración fuera de la lista— se lee como ausente, no como error.
- **"Borrador" es un tag del `.md`**, uno de los cuatro reservados. Lo pone y lo saca el usuario con su botón en el editor; la app no lo calcula.
- Una receta nueva nace con el tag puesto, y no se puede sacar hasta que tenga título, categoría, ingredientes y pasos. Pasado ese mínimo, decidir que está terminada es del usuario.
- Un borrador **se lista y se abre igual** que cualquier receta. Se ve que le falta algo —la marca en la esquina de la tarjeta—; no se esconde ni se bloquea.
- Un archivo que no cumple ni el mínimo —no tiene título— se ignora, y el hecho se informa en un lugar no central: la ficha *Avisos* de Ajustes, con el nombre del archivo.

**Ejemplo de arbitraje:** al elegir el formato del `.md` aparece la opción de
exigir ingredientes estructurados para que J4 funcione siempre. Este principio
la descarta: se prefiere una receta consultable a medias antes que una receta
rechazada. El formato define un objetivo, y el usuario tiene la última palabra
sobre qué receta está terminada.

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
- El índice está mal: la salida es **Ajustes → Reindexar**, adentro de la app. La app no diagnostica ni repara la planilla in situ: la rehace desde los `.md`.
- Ningún error se muestra crudo. El mensaje dice qué pasó y qué se puede hacer.
- Un aviso que no tiene acción asociada no interrumpe: vive en un lugar secundario.

**Ejemplo de arbitraje:** en el arranque está la opción de auto-reparar el
índice sin preguntar, porque el índice es derivado y reconstruirlo no pierde
datos. Este principio la descarta: reconstruir puede tardar mucho —los `.md` se
leen de a uno— y arrancar la app no es el momento de decidirlo por el usuario.
Se ofrece. Las dos excepciones son las que no tienen alternativa: cuando
`_indice` no existe, y cuando cambió la versión del esquema.

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

- **La pantalla principal es la búsqueda arriba y las categorías abajo**, con el carrusel de tags entre las dos. Nada va arriba de la búsqueda.
- Pasear es un modo de uso de primera clase, no un efecto secundario de navegar el árbol.
- La forma concreta de la clasificación es del usuario: hay 16 categorías predefinidas, y se crean, renombran y borran desde *Ajustes → Recetario*.
- **Novedad no es un dato.** No hay historial, `ultima_vez` ni `veces`. Se resuelve mostrando, no registrando.
- El objetivo de escala son ~1.000 recetas, mayormente migradas — recetas que el usuario nunca cocinó y cuyo nombre no recuerda. Toda navegación se evalúa a esa escala, no a las decenas de hoy.

**Ejemplo de arbitraje:** una grilla de categorías con fotos como primera
pantalla, sin búsqueda a la vista. Este principio la desaloja del primer lugar
sin discutir su valor: la categoría sirve a J5, que es real, pero J1 es más
frecuente y no la usa nunca. La grilla va abajo; la búsqueda, arriba.

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

- J9 no define entidades nuevas en el núcleo ni condiciona el diseño de los jobs validados: `_indice` no cambia —ni hoja ni columna— y el esquema del `.md` de receta tampoco.
- Cumple igual el principio 1: el plan de la semana es un archivo, `_plan.md`.
- Sacarlo cuesta borrar una entrada del menú, tres pantallas, dos módulos y un archivo de Drive. Nada más del producto cambia.
- Lo mismo vale para cualquier job futuro que aparezca sin conducta observada.

**Ejemplo de arbitraje:** desde dónde se llega al plan. Es **una sola entrada,
en el menú lateral**, entre Borradores y Nueva receta: alcanzable de un toque,
sin gastar lugar en el Recetario y sin que la receta abierta ofrezca
planificar. Lo que este principio exige no es que esté escondido, sino que
sacarlo sea borrar una línea; un bloque en el home o un botón en la receta lo
hubieran repartido por el producto.

---

## 7. La misma app en cualquier pantalla

Recetario es un solo producto y se lee como uno solo en todas sus pantallas. El
teléfono es el contexto principal y ahí tiene que verse **bien**; la computadora
es un contexto real —recuperar y elegir qué cocinar también pasa sentado, en la
Mac— y ahí tiene que verse **no mal**.

Es una asimetría declarada, no paridad: nadie va a diseñar dos veces cada
pantalla, pero tampoco se acepta que la versión ancha sea una columna angosta
perdida en el medio de la nada.

**Tensión que resuelve:** optimizar para un contexto vs. servir a todos.
Elegir el teléfono en vertical y simplificar el resto deja una versión ancha
que molesta cada vez que se usa.

**En la práctica, esto significa:**

- Se diseña para el teléfono y se define qué hace el layout cuando sobra ancho. No queda librado al azar del CSS.
- Las pantallas comparten sistema: los mismos componentes, la misma jerarquía, el mismo vocabulario visual. La cohesión es un requisito, no un pulido final.
- **El tamaño de los controles es una regla del sistema, no una decisión por pantalla.** Nace de las manos que los usan: dedo, a veces sucio, a veces a la distancia del brazo.

**Ejemplo de arbitraje:** en el design system aparece la opción de tratar el
desktop como una variante secundaria sin tokens
propios. Este principio acota el alcance: no exige un diseño desktop completo,
pero sí que el ancho tenga una respuesta definida y que los tamaños de control
salgan de una regla única.

---

## Verificación — decisiones que desempatan

Los principios tienen que desempatar decisiones reales del producto.

| Decisión | Principio | Cómo desempata |
|---|---|---|
| ¿Qué ocupa la pantalla principal? | **5** | Búsqueda arriba, categorías abajo. La grilla de tiles no tiene el primer lugar. |
| ¿Cuánto del producto ocupa el plan de la semana? | **6** | Una sola entrada en el menú lateral. Es el único job que cambiaría la conducta: se construye con costo de retiro bajo, sin tocar el índice ni el esquema del `.md`. |
| ¿Cuánto muestra la receta? | **3** + **7** | La lectura muestra la receta entera tal como está en el archivo, incluido el tag `borrador`: la app no decide qué esconder de un dato que no controla. El modo cocina muestra sólo ingredientes y pasos, con un conmutador; los tamaños salen de la regla de controles del principio 7. |
| ¿Qué pide el Share Target al capturar? | **2** | Nada obligatorio: la fuente llega cargada, el título es opcional y la categoría arranca en «Sin categoría». |
| ¿Qué pasa si se comparte sin red? | **1** + **4** | Falla y avisa. No hay cola local. Está aceptado explícitamente, aun sabiendo que es el riesgo que J2 existe para eliminar. |
| ¿Qué pasa con el borrador al convertirse? | **2** | Es la misma receta: se completa y se le saca el tag `borrador`. La URL de origen queda como atributo `fuente`. |

---

## Lo que estos principios no arbitran

Registrado para no forzarlos donde no llegan:

| Tema | Por qué queda afuera |
|---|---|
| El popup de autenticación de Google | Es una restricción de plataforma, no una decisión de producto: sin backend no hay alternativa. |
| La estética concreta —paleta, tipografía, densidad, tema— | Se decide en `ux/design-system.md`. El principio 7 exige cohesión y una regla de tamaños; no dice de qué color es nada. |
| El formato exacto del `.md` | El principio 3 fija el criterio —mínimo chico, lectura tolerante—; el formato está en `ux/information-architecture.md`. |
| Si el agente se embebe en la PWA | Ningún principio lo fuerza en ninguna dirección. No se embebe: la app arma el pedido, lo manda a Claude y recibe la respuesta. |
| Qué categorías hay | El principio 5 les asigna un lugar en la pantalla, no una forma: las define el usuario. |
