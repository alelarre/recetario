# Recetario — Product Vision

**Versión:** 2.1
**Fecha:** 2026-09-06
**Estado:** v2.1 — Validada post-research

> **Cambio en la 2.1 (Hito 6):** el alcance del editor pasa de *"corregir, no
> componer"* a *"corregir, y crear una receta que ya tenés en la cabeza"*.
> Convertir una fuente sigue siendo trabajo del agente.

> Reemplaza a la v1.0, que era una hipótesis escrita antes del research. Todo lo
> que sigue está respaldado por `research/competitive-analysis.md`,
> `product/strategy/personas.md` y `product/strategy/jtbd.md`, y no puede
> contradecir los siete principios de `product/strategy/product-principles.md`.

---

## 1. Visión del Producto

### ¿Qué es Recetario?

Recetario es una aplicación personal de recetas para un solo usuario, en la que
los datos no son propiedad de la app. Cada receta es un archivo `.md` en Google
Drive: legible sin la app, editable sin la app, y sobreviviente a la app. Si el
producto desaparece mañana, el recetario sigue existiendo como una carpeta de
archivos de texto.

**Recetario no es solo la app: es un ecosistema de dos partes.** Una PWA, que
recibe, guarda, muestra y corrige; y un agente, que convierte una fuente
cualquiera —un PDF, la foto de una página de un libro, un video, un sitio web—
en un `.md` completo y estructurado. Las dos escriben sobre los mismos archivos
en Drive, y ninguna de las dos es el producto sola.

Por eso el input principal no es un editor. El editor de la PWA sirve para
corregir un error encontrado al cocinar y para escribir una receta que ya se
tiene en la cabeza; convertir una fuente en receta es trabajo del agente.

El producto se diseña para **~1.000 recetas**, no para las decenas de hoy: en su
mayoría recetas que el usuario todavía no cocinó y cuyo nombre no recuerda.

### Para quién

Un solo usuario, conocido y disponible: nadie más lo usa ni lo consulta.

Cocina **los fines de semana**, cuando cocinar es el pasatiempo; entre semana
cocina sencillo, de memoria, sin abrir nada. Cuando cocina de fin de semana lo
hace **siguiendo una receta escrita, con método**: no improvisa, y una receta
incompleta le arruina la sesión.

Es técnico y **construye la app que usa**, lo cual tiene una consecuencia que
ninguna otra persona de producto tendría: puede cambiar cualquier cosa del
producto, y esa capacidad es parte de por qué el producto existe.

Los dos usos principales son **recuperar** una receta que ya tiene en mente y
**archivar** una que acaba de encontrar. Cocinar con la app abierta es el uso
**menor**, reservado a recetas complejas o poco frecuentes. Detalle completo en
`personas.md`.

### El insight central

**El problema no es encontrar recetas: es que lo que guardaste no sirve cuando
lo vas a usar.** Una receta guardada como link, como reel o como nota es una
promesa incumplida — parece guardada y no lo está. El trabajo real no es
archivar: es **convertir** una fuente cualquiera en una receta completa que se
pueda seguir con método, y que quede en archivos que no dependan de nadie.

Eso corrige la hipótesis con la que arrancó el proyecto, que decía que el
problema era tener las recetas juntas y encontrarlas. La entrevista lo desmintió:
el usuario nunca perdió una receta que hubiera guardado, y el buscador de Drive
alcanzaba. Lo desgastante era, textual, *"no tener la receta completa guardada
para revisar"*.

Hay un segundo insight, y es el que explica por qué el producto es posible ahora
y no antes: **la conversión dejó de ser el cuello de botella**. Un agente lee un
PDF de 24 recetas y escribe 24 `.md` bien estructurados. Eso cambia qué tiene
que ser la app: no un buen editor, sino un buen lector de lo que otro escribió —
y un buen receptor de lo que todavía no se convirtió.

### Las tres cosas que hacen a este producto

Se sostienen juntas. Ninguna alcanza sola, y ese es el punto:

1. **Archivos abiertos en Drive.** No `.md` en abstracto: `.md` en el lugar donde los agentes escriben y desde donde el teléfono lee.
2. **Entrada agéntica desde cualquier fuente.** PDF, video, foto de un libro, sitio web. Es el único terreno del análisis competitivo sin competencia, y es parte del producto: el agente convierte, la PWA recibe y define la forma.
3. **El código es del usuario.** No solo los datos. Nada de lo que el producto haga depende de la decisión de un tercero.

### Decisiones estratégicas fundamentales

Las ocho primeras vienen del encuadre del proyecto y están fijas
(`../../CLAUDE.md`). Las tres últimas se agregan en esta versión.

| Dimensión | Decisión |
|---|---|
| Usuarios | Un solo usuario. No hay multiusuario, ni compartir, ni cuentas. |
| Propiedad de los datos | Los `.md` en Drive son la fuente de verdad. La app es una vista sobre ellos, reemplazable y descartable. |
| Plataforma | PWA de archivos estáticos en GitHub Pages. Sin backend, sin infraestructura que mantener. |
| Persistencia | Drive para el contenido; una Google Sheet como índice derivado y reconstruible desde los `.md`. |
| Permisos | Scope OAuth `drive`, con su pantalla de "app no verificada" una vez. `drive.file` no sirve: es por archivo y no ve los `.md` que escriben los agentes. |
| Input de contenido | Agentes externos escriben los `.md`. El editor de la app es para corregir. |
| Modelo de negocio | Ninguno. Es una app personal, no un producto a monetizar. |
| Alcance de este proyecto | Redefinición de producto y UX desde cero, hasta wireframes. La visión y el stack están fijos; todo lo demás se rediseña. |
| **Escala de diseño** | **~1.000 recetas.** Toda decisión de navegación, índice y arranque se evalúa a esa escala, no a las decenas actuales. |
| **Alcance del editor** | **Corregir, y crear una receta que ya tenés en la cabeza.** Lo que no hace es componer desde una fuente: transcribir un PDF, un video o la foto de un libro es trabajo del agente. |
| **Dónde vive el agente** | **Es parte del producto, afuera de la PWA.** Recetario es un ecosistema de dos partes que escriben sobre los mismos archivos; la conversión ocurre en una sesión con el agente, no adentro de la app. Embeberlo en la PWA queda abierto a explorar una vez resuelto el resto del producto. Mientras tanto, **la app está diseñada para recibir borradores y esperar**, no para procesar. |

---

## 2. Diferenciadores Competitivos

### Vs. Obsidian + Recipe Box

**Es el competidor más importante del análisis**, porque sostiene la misma tesis
—archivos `.md` planos que le sobreviven a la app— y ya la tiene funcionando,
gratis, sin registro y sin límite de dispositivos. En formato abierto y ausencia
de techo, empata; y encima trae planificador, modo cocina, timers y escalado.

**Qué privilegia Obsidian:** un vault de notas de propósito general, con recetas
encima como caso de uso de plugins de comunidad. La sincronización es problema
del usuario y se resuelve por iCloud, Syncthing o Git.

**Qué privilegia Recetario:** que los `.md` vivan **en Google Drive**, porque ahí
es donde los escriben los agentes. Obsidian no llega a Drive por ninguna vía
soportada: lo único que existe es un plugin beta, fuera del directorio oficial,
que advierte sobre pérdida de datos y que en iOS obliga a armar el vault en una
computadora y copiarlo a mano. **Es una incompatibilidad estructural, no una
molestia** — y cae justo sobre la restricción que define al producto.

A eso se suman dos diferencias más: ninguna ruta de importación de Recipe Box o
Recipe Vault acepta un PDF, un video ni la foto de una página de libro; y
Obsidian es un editor de notas donde el recetario compite con el resto del
vault, mientras Recetario se abre en la receta.

### Vs. Paprika 3

Es el archivador de referencia del rubro y el más honesto de los comerciales:
pago único, sin suscripción, sin tier free con techo, offline completo y el
mejor clipper web del mercado.

**Qué privilegia Paprika:** que el recetario esté ordenado, sincronizado y
disponible en cuatro sistemas operativos, con planificador y lista de compras
incluidos. Su ruta de entrada es el clipper web.

**Qué privilegia Recetario:** que la receta siga siendo un archivo. En Paprika,
una vez adentro, la receta deja de ser un texto legible y pasa a ser una fila de
su base: hay export, pero en formato propio, que sirve de backup y no para
trabajar los datos afuera. Es exactamente el intercambio que Recetario existe
para no aceptar. Y su clipper no ayuda: las fuentes reales del usuario son un
PDF de 24 recetas, documentos temáticos y fotos de páginas de libro.

### Dónde Recetario llega último

Registrado para que la visión no prometa lo que no tiene: **el planificador y la
lista de compras están resueltos hasta el aburrimiento.** AnyList, Mealie,
Tandoor y Recipe Box lo hacen todos, y AnyList es el mejor del rubro. Recetario
llega último y sin diferencial en ese terreno — lo cual es coherente con
tratarlo como exploración (principio 6) y no como promesa.

---

## 3. Problem Statement

*Escrito sobre el estado al que el producto tiene que llegar —~1.000 recetas—,
no sobre las decenas de hoy.*

Alguien que cocina en serio acumula recetas durante años en formatos que no se
hablan entre sí: documentos largos, PDFs, fotos de páginas de libros, capturas,
reels guardados, links en el navegador. Ese material tiene tres problemas
distintos, y solo el primero es obvio.

**Lo que se guarda no está guardado.** Un reel, un link o una nota son un
recordatorio de que algo existía, no una receta. Cuando llega el momento de
cocinar, hay que volver a la fuente, y a veces la fuente ya no está. Entre el
momento de encontrar una receta y el de tenerla en el recetario hay un limbo
—notas sueltas, links, videos guardados— y **ahí se pierden recetas**. Es el
único punto del sistema donde el contenido desaparece del todo.

**Convertir cuesta, y por eso se posterga.** Pasar de un PDF o de un video a una
receta completa y estructurada es trabajo real. Como cuesta, se hace recién
cuando ya se va a cocinar, y no cuando se encuentra la receta. Entre las dos
cosas pasa tiempo, y el material espera sin estar en ningún lado.

**A escala, el archivo deja de ser navegable.** Con decenas de recetas, buscar
por nombre alcanza. Con mil —en su mayoría nunca cocinadas y de nombre no
recordado— una receta que no se recuerda es una receta que no existe. El archivo
crece hasta volverse un depósito: tiene todo adentro y no devuelve nada.

Las alternativas del mercado piden, a cambio de resolver una parte, que le cedas
tus recetas a su base de datos — lo cual reproduce el problema original un nivel
más arriba. Y ninguna de ellas entra por donde el contenido realmente está: los
siete competidores analizados importan desde una página web.

El costo de no resolver todo esto no es dramático: se cocina igual. Pero es
permanente, y crece con el tamaño del archivo.

---

## 4. Entidades del Producto

### 4.1 Entidades

| Entidad | Descripción | Persistencia |
|---|---|---|
| **Receta** | Un `.md` con frontmatter y cuerpo. La unidad del sistema. Su estado de completitud lo deriva la app del contenido, y el usuario puede declararla completa así como está. | Archivo en Drive |
| **Borrador** | Input crudo sin procesar. Nace con un título —escrito por el usuario— y, si la hay, una fuente. Vive en una sección separada del recetario y **se borra al convertirse**; la fuente sobrevive en la receta. **No entra al índice:** los borradores viven en su propia planilla, una fila cada uno, y se listan de una sola lectura. `[precisado en el Hito 11: la disyuntiva del Hito 4 —carpeta o archivo único— se resolvió en el Hito 7]` | Una planilla en Drive |
| **Categoría** | La carpeta que contiene la receta. Es **exclusiva**: una receta vive en una sola. Su forma concreta —cuántas, cuáles— se rediseña en el Hito 5. | Carpeta en Drive |
| **Tag** | Clasificación **múltiple** y libre. Es lo que permite que una receta se cruce por más de un criterio sin mover el archivo. | Frontmatter del `.md` |
| **Ingrediente** | Tiene que ser **filtrable**: J4 —buscar qué cocinar con lo que hay— exige poder consultar los ingredientes de mil recetas sin que "berenjena" traiga ruido. Si eso se logra con estructura en el `.md`, con normalización en el índice o con otra cosa, se decide en el Hito 5 con el benchmark de formatos. | A definir — Hito 5 |
| **Fuente** | De dónde salió la receta. **Campo opcional de texto libre:** a veces una URL, a veces una referencia como *"libro de pescados, pág. 84"*, a veces nada. Nace en el borrador y sobrevive en la receta convertida. | Frontmatter del `.md` |
| **Índice** | Cache derivado de todas las recetas, para listar y buscar sin leer cada `.md`. Reconstruible y **reemplazable**: existe para que la PWA escale, no por decisión de producto. | Google Sheet |
| **Plan semanal** *(condicional)* | Qué comida concreta va cada día. **Existe solo si J9 se construye.** | Archivo en Drive |
| **Lista de compras** *(condicional)* | Deriva del plan semanal. **Existe solo si J9 se construye.** | Archivo en Drive |

### 4.2 Matriz de relaciones

| Entidad | Se relaciona con | Cómo |
|---|---|---|
| Receta | Categoría | Vive en exactamente una |
| Receta | Tag | Tiene cero o más |
| Receta | Ingrediente | Contiene varios; es lo que la hace filtrable |
| Receta | Índice | Aporta una fila |
| Receta | Borrador | Nace de uno, que se borra; hereda su fuente |
| Receta | Fuente | Tiene cero o una |
| Borrador | Fuente | Tiene cero o una |
| Borrador | Índice | **Ninguna.** No se clasifica ni se indexa: se lista leyendo su carpeta. Solo espera. |
| Plan semanal | Receta | Referencia una por día |
| Lista de compras | Plan semanal | Deriva de él, agregando ingredientes |

### 4.3 La decisión de clasificación

**Exclusiva para archivar, múltiple para clasificar.** La carpeta de Drive dice
*dónde vive el archivo*; los tags dicen *cómo se lo encuentra*. Son dos cosas
distintas y esta versión deja de confundirlas.

La v1.0 decía que la categoría era "la única clasificación y es exclusiva". Esa
exclusividad era una restricción del sistema de archivos que se había convertido
en decisión de producto sin que nadie la tomara. Una receta puede ser a la vez
"pescados" y "para el horno": el archivo va en una carpeta, y el segundo
criterio es un tag.

Consecuencia para el Hito 5: la navegación **puede** cruzar criterios; no está
obligada al árbol de carpetas.

---

## 5. Qué no es Recetario

Registrado para que el documento pueda arbitrar por exclusión:

| No es | Por qué |
|---|---|
| Una app de descubrimiento | El usuario generalmente ya sabe qué quiere cocinar. Sugerir es una ayuda secundaria posible; empujar está descartado. |
| Un editor de recetas | Se puede corregir y escribir una receta corta, pero nadie va a transcribir un PDF ahí adentro: eso es trabajo del agente. |
| Un registro de lo cocinado | Sin `ultima_vez`, sin `veces`, sin puntaje. *"No es necesario saber qué cociné."* La novedad se resuelve mostrando, no registrando. |
| Un planificador de comidas | Todavía no, y quizás nunca. Es el único job hipotético y el terreno donde el mercado ya está resuelto. |
| Una app offline | Sin Drive no hay app. Es consecuencia aceptada de que el archivo sea la única fuente de verdad. |
| Un producto | No se monetiza, no tiene usuarios que convencer, no tiene roadmap que defender. |
