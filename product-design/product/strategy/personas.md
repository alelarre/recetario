# Recetario — Personas y Contextos de Uso

**Versión:** 1.0
**Fecha:** 2026-09-05
**Estado:** Final — Hito 2 cerrado

---

## Sobre este documento

Recetario tiene **un solo usuario**, confirmado explícitamente: nadie más lo usa
ni lo consulta. Por eso la ficha de persona es corta y no lleva demografía
inventada — el usuario es conocido y está disponible para preguntarle.

El peso del documento está en la segunda parte: **los contextos de uso**. Son
cuatro, con condiciones físicas y de atención muy distintas entre sí, y son
ellos —no la persona— los que arbitran el diseño en los Hitos 5 y 6.

---

## Tabla síntesis

| Persona | Perfil | Job principal | Patrón de uso |
|---|---|---|---|
| El cocinero metódico | Único usuario. Cocina como pasatiempo, no como rutina. | Recuperar una receta que ya tiene en mente, y no perder las que encuentra | Fines de semana. Uso intenso y corto, no diario. |

---

## 1. El cocinero metódico — "*ya sé qué quiero cocinar*"

### Perfil

Único usuario del producto y también quien lo construye. Cocina **los fines de
semana**, cuando cocinar es el pasatiempo. Entre semana cocina sencillo y
rutinario, de memoria, sin abrir nada.

Cuando cocina de fin de semana, lo hace **siguiendo una receta escrita**, y la
sigue con método. No improvisa sobre la marcha ni cocina "a ojo" a partir de una
idea general.

Es técnico: construye la app que usa. Eso tiene una consecuencia que ninguna
otra persona de producto tendría — **puede cambiar cualquier cosa del producto**,
y esa capacidad es parte de por qué el producto existe.

### Qué busca

👉 *"Que mis recetas sean mías, estén completas, y no dependan de ninguna app ni
de ningún dispositivo para poder leerlas."*

**Quiere:**

- Encontrar rápido una receta que **ya sabe** que quiere cocinar.
- Que lo que guardó esté **completo**, no un link ni un pegote a medias.
- Poder buscar por **ingrediente** — "tengo berenjenas, qué hago".
- A veces, mirar sin buscar nada concreto, para hacer algo distinto.
- Que el repositorio le sobreviva a la app, a la plataforma y al dispositivo.

**No quiere:**

- Que sus recetas vivan dentro de una base de datos ajena.
- Tiers gratuitos con techo, suscripciones, ni formatos cerrados.
- Que el producto lo empuje a cocinar algo: generalmente ya sabe qué quiere. Sugerencias como ayuda secundaria no están descartadas — ver `jtbd.md` J5.
- Llevar registro de qué cocinó y cuántas veces. *(Descartado explícitamente.)*

### Cómo usa el producto

Uso **concentrado en el fin de semana** y disperso el resto. La app no se abre
todos los días. Cuando se abre es para una de dos cosas: recuperar una receta
concreta, o dejar guardada una que acaba de encontrar.

Cocinar con la app abierta es el uso **menor**, reservado a recetas complejas o
que hace muy de vez en cuando. Las que domina no las mira.

### Qué le importa

- **La portabilidad por encima de todo.** Los `.md` valen más que la app.
- **El método.** Sigue la receta; una receta incompleta le arruina la sesión.
- **No tener techo.** Ni de precio, ni de formato, ni de permiso para cambiar algo.
- **Que el sistema no le pida mantenimiento.** Sin servidor, sin backend, sin administración.
- **Escala.** Apunta a ~1.000 recetas, contra las decenas de hoy.

### Rol en el sistema

👉 **Dueño único: usuario, autor del contenido y autor del producto.**

Es importante para el producto porque:

- Es el único que decide qué entra y qué no. No hay que negociar con nadie.
- Puede cambiar el producto entero, lo cual convierte "sin techo" en una propiedad real y no en una promesa de marketing.
- Es la fuente de verdad de todo este proyecto: cualquier duda se le pregunta.

---

## 2. Contextos de uso

Cuatro contextos, en el orden de importancia que el propio usuario les dio.
**Los dos primeros son los principales, y son justo los que la app actual casi
no atiende.**

### 2.1 Recuperar — *"ya sé qué quiero"* 🥇 Principal

| | |
|---|---|
| **Cuándo** | No es fijo. Cuando decide qué va a cocinar. |
| **Dónde y con qué** | Sentado, teléfono o computadora, sin apuro. |
| **Atención** | Completa. |
| **Objetivo** | Llegar a una receta que ya tiene identificada. |

**Cómo funciona hoy:** buscador de Drive por nombre, o el índice del documento
temático. Ninguno de los dos es barrido visual: la recuperación es **por
nombre**, y eso escala razonablemente bien.

**Los dos filtros que sí usa:**

- **Ingredientes.** "Qué hago con lo que tengo." Es el que más consecuencias tiene: obliga a poder buscar *dentro* de los ingredientes de mil recetas, y por lo tanto tensiona el formato del `.md`. Se decide en el Hito 5 con el benchmark de formatos.
- **Novedad.** Querer hacer algo distinto. **No es un dato, es un modo de uso:** no consulta ningún historial ni lo quiere. Pide que la app permita *mirar sin buscar*, no que registre qué cocinó.

**Filtros que no usa** — descartados explícitamente: tiempo disponible,
cantidad de comensales, dificultad, y no repetir lo reciente.

### 2.2 Archivar — *"la vi, no la quiero perder"* 🥇 Principal

| | |
|---|---|
| **Cuándo** | En el momento en que encuentra una receta, en cualquier lado. |
| **Dónde y con qué** | Teléfono, mayormente. Haciendo otra cosa: viendo un video, leyendo, hojeando un libro. |
| **Atención** | Mínima e interrumpida. Está en el medio de otra actividad. |
| **Objetivo** | Que no se pierda. |

**Este contexto tiene dos etapas y un limbo en el medio.** Es el hallazgo central
del hito:

1. **La ve y la guarda donde caiga.** Guarda el link, guarda el reel, anota en una app de notas. Rápido, con una mano, sin salir de donde estaba.
2. **La convierte en `.md`** — pero recién **antes de ponerse a cocinarla**, en una sesión con un agente.

Entre las dos hay un **limbo**: reels guardados, notas sueltas, links en el
navegador. Confirmado: **ahí se pierden recetas.**

Consecuencias:

- **El recetario no crece continuamente.** Una receta entra recién cuando está por cocinarse. Las ~1.000 del target son casi todas migración de contenido viejo, no captura de contenido nuevo.
- **El limbo es el problema real y la app no lo toca.** Hoy Recetario recibe recetas ya convertidas; lo que se pierde, se pierde antes.
- **Las fuentes son de todo tipo** —videos, sitios, libros de papel, PDFs, gente que le pasa cosas— y ninguna app del mercado captura desde ellas.

**Forma que el usuario le da a la solución** (definida en este hito, a detallar en
el Hito 5):

| Momento | Qué pasa |
|---|---|
| Arranque | **Desde la app donde vio la receta**, compartiendo hacia Recetario. Si compartir no es posible, registrar al menos la fuente. |
| Qué queda | Un **borrador**, o la receta ya procesada si se pudiera. |
| Dónde espera | Una **sección separada** — bandeja o equivalente — no mezclada con el recetario. |
| Quién completa | **El usuario**, en una sesión con el agente. No corre solo. |


### 2.3 Cocinar — *"lo tengo abierto mientras hago"* 🥉 Menor

| | |
|---|---|
| **Cuándo** | Fin de semana, mientras cocina. |
| **Dónde y con qué** | Cocina, teléfono apoyado, manos ocupadas o sucias. |
| **Atención** | Partida, interrumpida, a la distancia del brazo. |
| **Objetivo** | Seguir una receta ya elegida. |

**Es el uso menor**, y solo para **recetas complejas o que hace muy de vez en
cuando**. Lo que domina no lo mira.

El único dolor que aparece acá es que **la pantalla se apaga**. Ya está resuelto
en el código (`src/main.ts:93`, Wake Lock API), intencionalmente como botón manual que hay
que acordarse de apretar porque no siempre es necesario que quede prendida.

> ⚠️ **Este es el contexto para el que está construida la app actual.** El home
> de categorías, el detalle en columna, la barra de ingredientes y el wake lock
> sirven todos a este contexto, que resulta ser el tercero en importancia. Los
> dos principales no tienen casi nada. Es el desajuste más grande que dejó el
> Hito 2 y es material directo del Hito 5.

### 2.4 Planificar la semana — *"me gustaría probar"* 🔬 Hipotético

| | |
|---|---|
| **Cuándo** | Sin definir. |
| **Dónde y con qué** | Sentado, sin apuro. |
| **Atención** | Completa. |
| **Objetivo** | Facilitar la compra semanal y ganar variedad entre semana. |

**No es un contexto observado: es una hipótesis del usuario.** Sus palabras:
*"no es principal, pero me gustaría probar a ver si me resulta"*.

Tiene una tensión que hay que dejar escrita: apunta a **más variedad de comidas
durante la semana**, pero entre semana hoy cocina de memoria y sin receta. O sea
que no es una feature que se acople a la conducta actual — **es una feature que
la cambiaría**. Eso no la descalifica, pero es una apuesta más grande de lo que
"secundario" sugiere, y conviene tratarla como tal.

---

## 3. Restricciones que este hito impone al diseño

Tres cosas que salieron de la entrevista y condicionan todo lo que venga:

**3.1 Todo tiene que ser reconstruible desde archivos.**
Textual: *"todo tiene que ser reconstruible por `.md` o archivos de Drive como
soporte"*. No es solo el recetario: alcanza al índice, al plan semanal y a la
lista de compras. **Nada que importe puede vivir solo dentro de la app.** Es la
consecuencia literal de que el producto sea el repositorio y la app una vista
sobre él. Va como candidato a principio de producto en el Hito 3.

**3.2 La taxonomía está abierta.**
Textual: *"la cantidad de carpetas o categorías es circunstancial, no es central
a nada"*. Las 16 categorías de la implementación actual son un accidente, no una
decisión de producto. Ninguno de los nueve jobs las menciona. El Hito 5 define la
clasificación desde cero.

**3.3 Por ahora el agente vive afuera de la app.**
El usuario lo embebería en la PWA si el camino fuera confiable; embeberlo es una
posibilidad abierta, a explorar una vez resuelto el resto del producto. Mientras
tanto, **la app tiene que estar diseñada para recibir borradores y esperar**, no
para procesar.

Para la captura en sí no hace falta ningún agente: la **Share Target API**
permite que la PWA sea destino del "Compartir" del sistema y escriba el borrador
en Drive, sin backend. Funciona en Android; en iOS el equivalente es un Atajo.
Se decide en el Hito 5.

---

## 4. Lo que este documento descarta

Registrado para que no se reabra sin decisión explícita:

| Descartado | Motivo |
|---|---|
| Segunda persona, o cualquier consultante | Confirmado: no existe nadie más. |
| Modelo de hogar, compartir, multiusuario | Consecuencia de lo anterior. |
| Historial de cocina (`ultima_vez`, `veces`) | *"No es necesario saber qué cociné."* La novedad se resuelve explorando, no registrando. |
| Filtros por tiempo, comensales y dificultad | Preguntados uno por uno: no aplican. |
| Uso diario del recetario | Entre semana cocina de memoria. El producto es de fin de semana. |
