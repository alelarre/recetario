# Recetario — Brand Identity

**Versión:** 1.1
**Fecha:** 2026-09-07
**Estado:** Vigente

---

## Sobre este documento

La personalidad del producto, cómo se ve traducida en decisiones visuales, cómo
habla, y con qué palabras. **Los valores concretos —colores, tamaños, tokens—
están en `design-system.md`;** acá está el criterio que los genera.

No hay manual de marca y no hay público al que convencer: Recetario tiene un solo
usuario. Lo único que hace de logo es el ícono de la app —una olla con vapor, en
el fondo y la arcilla de la app (`design-system.md` §7.1)—. Lo que sí hay es un
conjunto de decisiones que tienen que ser consistentes para que la app no se
contradiga a sí misma.

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
| El acento violeta | El acento es una **arcilla**, del lado cálido del círculo. |
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

Una familia para todo —la interfaz y el contenido— y es **la fuente del
sistema**, sin webfont. Un pedido de red externo en una PWA que no tiene ninguno,
o 100 KB empaquetados que el service worker tenga que cachear, es un precio que
la tipografía acá no se gana.

**La consecuencia es que la tipografía no aporta lo doméstico:** la del sistema
es neutra. **La calidez queda entera del lado del color**, así que los neutros
cálidos y la arcilla no son una preferencia: son lo único que sostiene el quinto
adjetivo.

La única excepción es el PDF de una receta compartida, que lleva Inter embebida
porque un PDF no puede usar la fuente del sistema.

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

**Los errores van en impersonal: «No se pudo…», nunca «No pude…».** La app no
habla de sí misma en primera persona.

| Contexto | Cómo suena | Ejemplo |
|---|---|---|
| **Error de operación** | Qué no se pudo, y qué quedó como estaba o qué mirar. Con *Reintentar* al lado. | *"No se pudo guardar. Revisá la conexión."* · *"No se pudo borrar. La receta sigue estando."* |
| **Sin conexión con Google** | El hecho, y el control al lado. | *"No se pudo reconectar con Google."* → `[Reintentar]` · *"Hay que conectarse de nuevo con Google."* → `[Conectar]` |
| **Estado vacío** | Qué hay, en una frase. Sin ilustración. Si está vacío por un filtro, cómo salir. | *"No hay nada esperando."* · *"Ninguna receta con esos tags. Probá sacando alguno de los filtros de arriba."* |
| **Confirmación destructiva** | Qué se va a borrar, nombrándolo. | *"¿Borrar Milanesas napolitanas?"* · *"¿Descartar Pasta con berenjenas?"* |
| **Operación larga** | Cuánto va, con número. Cuando no se puede saber, el verbo y un spinner. | *"Reindexando: 34%."* · *"Armando el PDF…"* |
| **Aviso sin acción** | El hecho y el número. | *"2 archivos ignorados por no tener título."* · *"No hay nada para avisar."* |
| **Falta información** | Lo que falta, no lo que está mal. | *"Se va a poder sacar incompleta cuando se cargue: título, categoría, ingredientes y pasos."* |
| **Explicación de un control** | Una oración, debajo, sólo donde el control no se explica solo. | *"Salir no borra nada de Drive."* · *"Hasta comer, con reposo y horno incluidos."* |
| **Resultado de copiar o armar algo para compartir** | El hecho, porque no deja nada a la vista que lo diga. | *"Link copiado."* · *"El PDF está listo."* |
| **Éxito** | **No se escribe.** Ningún cartel confirma que guardar, borrar o reindexar salió bien: lo dice la pantalla. Lo único que lo dice sin palabras es el tilde con el que cierra el velo al guardar una receta (`design-system.md` §6.17b). | — |

### 3.3 Correcto e incorrecto

| ✅ | ❌ | Por qué |
|---|---|---|
| *"No se pudo guardar. Revisá la conexión."* | *"Uy, algo salió mal 😕"* | El "uy" es simpatía en el peor momento, y "algo" no es información. |
| *"No se pudo conectar."* | *"Parece que hubo un problema al conectar."* | "Parece que" convierte un hecho en una sospecha. |
| *"No hay nada esperando."* | *"¡Todo al día! No tenés nada pendiente 🎉"* | Es una celebración por no haber hecho nada. |
| El botón `incompleta` apretado, y debajo qué falta cargar. | *"Esta receta está incompleta. Completala para poder buscarla."* | Reta, y da una instrucción que nadie pidió. |
| *"No se pudo reconectar con Google."* | *"Tu sesión de Google expiró. Por favor volvé a conectarte para continuar."* | Tres líneas para lo que se resuelve con una y un botón. |
| *"Reindexando: 34%."* | *"Esto puede tardar un ratito…"* | Un número es una espera medible; "un ratito" no. |
| *"No se pudo guardar."* | *"Unable to parse range: meta!A1:B20"* | El error crudo del servidor no se muestra nunca. |

### 3.4 Prohibido siempre

- Disculparse. La app no dice "perdón" ni "lo sentimos".
- Emojis en los mensajes del sistema. El único emoji de la interfaz es el 📖 que rotula
  la *fuente* de una receta o de un borrador: es un rótulo, no un mensaje.
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
| El producto entero, y su pantalla principal | **Recetario** | "Home", "Mis recetas" |
| La pantalla principal, en el menú lateral | **Inicio** | — (sólo ahí: «Recetario» ya es la marca, arriba del menú) |
| Un `.md` con una comida | **receta** | "plato", "ficha", "entrada" |
| La carpeta de Drive donde vive | **categoría** | "sección", "colección" |
| La carpeta de Drive que contiene todo el Recetario | **carpeta** — *"Carpeta: Recetario"*, **Cambiar carpeta**, *Crear la carpeta «Recetario» en Mi unidad*, *Ya tengo una carpeta* | "raíz", "directorio", "ubicación" |
| Lo capturado que espera conversión | **borrador** | "pendiente", "captura", "item" |
| El lugar donde esperan | **Borradores** | **"bandeja"**, "inbox", "por procesar" |
| Guardar algo desde otra app | **capturar** —la pantalla se titula **Nuevo borrador**, y el botón de Borradores, **Nuevo**— | "importar", "agregar", "compartir a" |
| Escribir a mano la receta de un borrador | **Crear la receta** | "procesar", "pasar a receta" |
| Pedirle a Claude que escriba la receta de un borrador | **Convertir con Claude** | "generar", "importar con IA" |
| Traer a la app la receta que devolvió Claude | **Pegar receta** | "importar", "cargar" |
| A qué borrador corresponde una receta que llegó | **¿De qué borrador es esta receta?**, con **Ninguno** como salida | — |
| Tirar un borrador | **Descartar** | "borrar", "eliminar" |
| Tirar una receta o una categoría | **Borrar** — *Borrar receta*, *Borrar categoría* | "eliminar", "quitar" |
| Empezar una receta sin borrador | **Nueva receta** | "crear", "agregar receta" |
| Mandar una receta afuera de la app | **Compartir**, con sus tres formas: **PDF**, **Link**, **Texto** | "exportar", "enviar", "publicar" |
| Una versión alternativa de un plato | **variación** | "versión", "alternativa" |
| Los criterios libres de la receta | **tags** | "etiquetas", "labels" |
| Los cuatro tags que la app se reserva | **tags especiales**: `favorito`, `menú diario`, `probar`, `incompleta`. Se escriben así, en minúscula, en el `.md`, en el chip y en su botón del editor | "estado", "marcadores", "listas" |
| El nombre de cada marca de la tarjeta, para el lector de pantalla | **Favorita**, **Menú diario**, **Para probar**, **Incompleta** —en femenino, por *la receta*; el botón de la estrella se llama **Favorito**— | — |
| Lo que la receta no tiene | **incompleta** | "inválida", "con errores", "borrador" |
| Sacar la marca de incompleta | **sacar *incompleta*** —soltar su botón en el editor— | "marcar como completada", "declarar completa", "validar" |
| Cuánto lleva la receta, hasta comer | **Duración** —uno de `~15 min`, `~30 min`, `~60 min`, `>60 min`, `>1 día`— | "tiempo", "tiempo de cocción", "preparación" |
| Para cuántos alcanza | **Rinde** | "porciones", "comensales" |
| El modo de lectura con la pantalla encendida | **Cocinar**, y **Salir** para dejarlo | "modo cocina" como etiqueta, "empezar" |
| Rehacer la planilla del índice | **Reindexar** —*"Reindexando: 34%."*, *"Último reindexado: …"*— | **"reconstruir"**, "reparar", "sincronizar" |
| La planilla derivada | **el índice** —la ficha de Ajustes se titula **Índice**— | "la base", "el cache", "la planilla" |
| Lo que la app guarda en el navegador | **Archivos locales** es la ficha de Ajustes; **Borrar datos locales**, su botón; *la copia del índice*, lo que guarda | "caché", "almacenamiento", "datos de la app" |
| Lo que pasó al abrir la app | **Registro de actividad** | "log", "diagnóstico", "depuración" |
| Lo que la app tiene para decir sin pedir nada | **Avisos** | "notificaciones", "alertas" |
| Dejar la cuenta de Google | **Salir**; entrar es **Conectar con Google** | "cerrar sesión", "logout", "iniciar sesión" |
| De dónde salió la receta | **fuente** —*Ir a la fuente*, en el borrador— | "origen", "link", "referencia" |

**Las fichas de Ajustes, en orden:** Cuenta, Recetario, Índice, Archivos locales,
Avisos, Registro de actividad.

### 4.1 Dos que hubo que decidir

**"Borradores" reemplaza a "bandeja".** El lugar se llama igual que lo que
contiene, así que el nombre no hay que aprenderlo. "Bandeja" además arrastraba
"bandeja de entrada", que es una metáfora de correo y no de cocina.

**"Reindexar" reemplaza a "reconstruir".** Reindexar es más preciso: lo que se rehace es el índice, y las recetas —que son
lo que el usuario tiene miedo de perder— no se tocan.

### 4.2 "Recetario" nombra dos cosas y está bien

Es el producto y es la pantalla principal. No genera ambigüedad porque **ninguna
etiqueta de la interfaz dice "volver al Recetario"**: volver es un control, no
una frase. Donde las dos se tocarían —el menú lateral, que lleva la marca
arriba— el destino se llama **Inicio**.

### 4.3 "Compartir" y "capturar" son sentidos opuestos

Lo que entra a la app desde otra se **captura**; lo que sale de la app se
**comparte**. El menú Compartir de Android aparece en los dos caminos, y por eso
la app nunca dice "compartir a Recetario".

### 4.4 "Convertir" es sólo con Claude

El verbo de pasar un borrador a receta es **crear la receta**. "Convertir" queda
para un solo botón, **Convertir con Claude**, donde quien escribe la receta no es
el usuario.

---

## 5. Lo que esta identidad prohíbe

Registrado para que se pueda verificar contra una pantalla:

| Prohibido | De dónde sale |
|---|---|
| Neutros de matiz frío | §2.2 |
| Acento violeta o azul-corporativo | §2.2 |
| Bordes translúcidos de 1px | §2.2 |
| Sombras y elevación | §2.4 |
| Tema claro | §2.5 |
| Una segunda familia tipográfica, y cualquier webfont | §2.6 |
| Ilustraciones y estados vacíos decorativos | §1 |
| Botón flotante de acción | `design-system.md` §6.7 |
| Emojis, exclamaciones y disculpas | §3.4 |
| Confirmaciones de éxito | §3.2 |
| Madera, papel arrugado, tiza, íconos de batidora | La versión mala de "doméstico" |
