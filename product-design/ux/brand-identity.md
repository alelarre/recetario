# Recetario — Brand Identity

**Versión:** 1.1
**Fecha:** 2026-09-07
**Estado:** Final — Hito 8, corregida en el Hito 11

> **Cambio en la 1.1 (Hito 11):** §2.6 — la tipografía es la del sistema, sin
> webfont, y con eso **la calidez queda entera del lado del color**.

---

## Sobre este documento

La personalidad del producto, cómo se ve traducida en decisiones visuales, cómo
habla, y con qué palabras. **Los valores concretos —colores, tamaños, tokens—
están en `design-system.md`;** acá está el criterio que los genera.

No hay logo, no hay manual de marca y no hay público al que convencer: Recetario
tiene un solo usuario. Lo que sí hay es un conjunto de decisiones que tienen que
ser consistentes para que la app no se contradiga a sí misma.

---

## 1. Personalidad

Cinco adjetivos. Cada uno vale porque **descarta** algo: un adjetivo que no
prohíbe nada no arbitra nada.

| Adjetivo | Qué significa acá | Qué descarta |
|---|---|---|
| **Sobrio** | La app no tiene color propio compitiendo con el contenido. Nada decorativo que no cargue información. | Ilustraciones, gradientes, fondos con textura, íconos de adorno. |
| **Directo** | Dice qué pasó, con el sujeto adelante. | Los eufemismos y los rodeos. |
| **Tolerante** | Acepta lo que llega y señala lo que falta sin tratarlo como una falta. | El rojo de error para lo que no es un error. |
| **Callado** | No festeja, no interrumpe y no se mueve solo. | Los toasts que aparecen solos, las confirmaciones de éxito, las animaciones de celebración. |
| **Doméstico** | Es un recetario de casa, con el cuaderno de mamá adentro. No es una cocina profesional ni una herramienta de trabajo. | Lo aséptico, lo corporativo y lo neutro-frío. |

Los cuatro primeros salen de los principios de producto. **Doméstico es el
contrapeso**, y es el que impide que el resultado sea correcto y frío.

---

## 2. Dirección visual

### 2.1 La estructura es una ficha

La receta y las pantallas se organizan en **bloques con borde visible**. Cada
sección —los metadatos, los ingredientes, la preparación— es un contenedor con
límites, no un tramo de texto separado por espacio.

**Por qué:** el contenido de una receta es heterogéneo y de longitud impredecible
—una receta tiene tres ingredientes y otra tiene treinta—, y la ficha lo mantiene
legible sin depender de que el contenido esté equilibrado. Una maquetación
editorial, que separa por espacio y por escala, necesita contenido parejo y una
foto que casi ninguna receta va a tener.

### 2.2 La calidez está en el color del papel, no en la estructura

La ficha es la dirección que más tensiona **doméstico**: leída literal, es la
estética de una app de productividad. Eso está descartado, y se evita en tres
lugares concretos:

| Riesgo | Cómo se evita |
|---|---|
| El gris azulado | **Todos los neutros son cálidos.** Ningún gris del sistema tiene matiz frío. |
| El acento violeta | El acento es una **terracota**, del lado cálido del círculo. |
| Los bordes translúcidos de 1px | Los bordes son **opacos y visibles**: se ven como bordes, no como una insinuación. |

### 2.3 El color vive en el contenido

La app aporta un solo acento. Todo el resto del color viene de dos lados: las
**fotos** de las recetas, y los **colores de categoría**.

Es la razón por la que los neutros son tan neutros: son el fondo contra el que
una foto de comida tiene que verse bien.

### 2.4 Sin sombras

La jerarquía se construye con **borde y valor de fondo**, nunca con elevación.
Una sombra sobre fondo oscuro es casi invisible y lo único que aporta es el
recuerdo de Material Design, que está descartado.

### 2.5 Un solo tema, oscuro

No hay tema claro ni conmutador. El contraste está calibrado para pantalla a
media luz, que es el contexto que más importa: la cocina de noche.

**El costo está aceptado:** capturar un reel al mediodía en la calle es el job
más crítico del producto y es donde un tema oscuro rinde peor. Se prefirió un
solo juego de tokens.

### 2.6 Tipografía: la del sistema, una sola familia

`[cambiada en el Hito 11]` Una familia para todo —la interfaz y el contenido— y es
**la fuente del sistema**, sin webfont. Un pedido de red externo en una PWA que no
tiene ninguno, o 100 KB empaquetados que el service worker tenga que cachear, es
un precio que la tipografía acá no se gana.

**La consecuencia es que la tipografía deja de aportar lo doméstico.** La primera
versión elegía una humanista justamente por eso; la del sistema es neutra. **La
calidez queda entera del lado del color**, así que los neutros cálidos y la
terracota dejan de ser una preferencia y pasan a ser lo único que sostiene el
quinto adjetivo.

La escala está en `design-system.md` §3.

---

## 3. Tono de voz

### 3.1 La regla

**Telegráfico.** El producto dice qué pasó y nada más. No explica, no tranquiliza
y no se disculpa.

Lo que el mensaje no dice, lo dice el estado de la pantalla: si el texto que
escribiste sigue ahí, no hace falta que un cartel te avise que no lo perdiste.
**La app confía en lo que se ve.**

### 3.2 Por contexto

| Contexto | Cómo suena | Ejemplo |
|---|---|---|
| **Error de operación** | Qué falló y por qué, en esa orden. | *"Error al guardar. Sin conexión."* |
| **Sesión vencida** | El hecho, y el control al lado. | *"Sesión vencida."* → `[Conectar]` |
| **Estado vacío** | Qué hay, en una frase. Sin ilustración y sin invitación. | *"No hay borradores."* |
| **Confirmación destructiva** | Qué se va a borrar, nombrándolo. | *"¿Borrar Milanesas napolitanas?"* |
| **Operación larga** | Cuánto va, con número. | *"Reindexando: 340 de 1.012."* |
| **Aviso sin acción** | El hecho y el número. | *"2 archivos ignorados por no tener título."* |
| **Falta información** | Lo que falta, no lo que está mal. | *"Sin ingredientes."* |
| **Éxito** | **No existe.** Nada confirma que algo salió bien. | — |

### 3.3 Correcto e incorrecto

| ✅ | ❌ | Por qué |
|---|---|---|
| *"Error al guardar. Sin conexión."* | *"Uy, algo salió mal 😕"* | El "uy" es simpatía en el peor momento, y "algo" no es información. |
| *"El índice está dañado."* | *"Parece que hubo un problema con el índice."* | "Parece que" convierte un hecho en una sospecha. |
| *"No hay borradores."* | *"¡Todo al día! No tenés nada pendiente 🎉"* | Es una celebración por no haber hecho nada. |
| *"Sin ingredientes."* | *"Esta receta está incompleta. Completala para poder buscarla."* | Reta, y da una instrucción que nadie pidió. |
| *"Sesión vencida."* | *"Tu sesión de Google expiró. Por favor volvé a conectarte para continuar."* | Tres líneas para lo que se resuelve con dos palabras y un botón. |
| *"Reindexando: 340 de 1.012."* | *"Esto puede tardar un ratito…"* | Un número es una espera medible; "un ratito" no. |
| *"Error al guardar."* | *"Unable to parse range: meta!A1:B20"* | El error crudo del servidor no se muestra nunca. |

### 3.4 Prohibido siempre

- Disculparse. La app no dice "perdón" ni "lo sentimos".
- Emojis en los mensajes del sistema.
- Signos de exclamación.
- Prometer algo futuro: *"se guardará más tarde"*, *"lo intentaremos de nuevo"*.
- Mostrar el error crudo de Google.
- Confirmar el éxito de una operación con un cartel.
- Tutear con diminutivos: *"un ratito"*, *"esperá un toque"*.

### 3.5 Rioplatense

**Voseo**, siempre: *"tocá"*, *"escribí"*, *"elegí"*. Nunca *"toca"*, *"pulsa"*
ni *"haz clic"*. Y "tocar", no "hacer clic": el contexto es un teléfono.

---

## 4. Vocabulario canónico

Lo que el producto llama a cada cosa. **Estos términos son los que aparecen en
la interfaz**, y no tienen sinónimos.

| Concepto | Término | Nunca |
|---|---|---|
| El producto entero, y su pantalla principal | **Recetario** | "Inicio", "Home", "Mis recetas" |
| Un `.md` con una comida | **receta** | "plato", "ficha", "entrada" |
| La carpeta de Drive donde vive | **categoría** | "sección", "colección", "carpeta" |
| Lo capturado que espera conversión | **borrador** | "pendiente", "captura", "item" |
| El lugar donde esperan | **Borradores** | **"bandeja"**, "inbox", "por procesar" |
| Guardar algo desde otra app | **capturar** | "importar", "agregar", "compartir a" |
| Escribir la receta a partir de un borrador | **crear la receta** | "convertir", "procesar" |
| Una versión alternativa de un plato | **variación** | "versión", "alternativa" |
| Sacar la marca de incompleta | **marcar como completada** | "declarar completa", "validar" |
| Rehacer la planilla del índice | **reindexar** | **"reconstruir"**, "reparar", "sincronizar" |
| La planilla derivada | **el índice** | "la base", "el cache", "la planilla" |
| Lo que la receta no tiene | **incompleta** | "inválida", "con errores", "borrador" |
| De dónde salió la receta | **fuente** | "origen", "link", "referencia" |
| Los criterios libres de la receta | **tags** | "etiquetas", "labels" |

### 4.1 Dos que hubo que decidir

**"Borradores" reemplaza a "bandeja".** El lugar se llama igual que lo que
contiene, así que el nombre no hay que aprenderlo. "Bandeja" además arrastraba
"bandeja de entrada", que es una metáfora de correo y no de cocina.

**"Reindexar" reemplaza a "reconstruir".** Los documentos usaban las dos.
Reindexar es más preciso: lo que se rehace es el índice, y las recetas —que son
lo que el usuario tiene miedo de perder— no se tocan.

### 4.2 "Recetario" nombra dos cosas y está bien

Es el producto y es la pantalla principal. No genera ambigüedad porque **ninguna
etiqueta de la interfaz dice "volver al Recetario"**: volver es un control, no
una frase.

---

## 5. Lo que esta identidad prohíbe

Registrado para que se pueda verificar contra un mockup:

| Prohibido | De dónde sale |
|---|---|
| Neutros de matiz frío | §2.2 |
| Acento violeta o azul-corporativo | §2.2 |
| Bordes translúcidos de 1px | §2.2 |
| Sombras y elevación | §2.4 |
| Tema claro | §2.5 |
| Una segunda familia tipográfica, y cualquier webfont | §2.6 |
| Ilustraciones y estados vacíos decorativos | §1, y el veto del Hito 6 |
| Botón flotante de acción | El veto del Hito 6 |
| Emojis, exclamaciones y disculpas | §3.4 |
| Confirmaciones de éxito | §3.2 |
| Madera, papel arrugado, tiza, íconos de batidora | La versión mala de "doméstico" |
