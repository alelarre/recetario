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
ellos —no la persona— los que arbitran el diseño.

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
**Los dos primeros son los principales.**

### 2.1 Recuperar — *"ya sé qué quiero"* 🥇 Principal

| | |
|---|---|
| **Cuándo** | No es fijo. Cuando decide qué va a cocinar. |
| **Dónde y con qué** | Sentado, teléfono o computadora, sin apuro. |
| **Atención** | Completa. |
| **Objetivo** | Llegar a una receta que ya tiene identificada. |

**Cómo lo hacía antes del producto:** buscador de Drive por nombre, o el índice
del documento temático. Ninguno de los dos es barrido visual: la recuperación es
**por nombre**, y eso escala razonablemente bien.

**Los dos filtros que sí usa:**

- **Ingredientes.** "Qué hago con lo que tengo." Es el que más consecuencias tiene: obliga a poder buscar *dentro* de los ingredientes de mil recetas, y por lo tanto define el formato del `.md`: cada ingrediente es un ítem con nombre, separador y cantidad.
- **Novedad.** Querer hacer algo distinto. **No es un dato, es un modo de uso:** no consulta ningún historial ni lo quiere. Pide que la app permita *mirar sin buscar*, no que registre qué cocinó.

**Filtros que declaró no usar:** tiempo disponible, cantidad de comensales,
dificultad, y no repetir lo reciente. De esos, el producto sólo tiene la
**duración** —cinco valores fijos—, que filtra y ordena las listas de recetas.
Los otros tres no existen como filtro: la dificultad es un dato de la receta,
que se lee y no filtra.

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
- **El limbo es el problema real.** Lo que se pierde, se pierde antes de convertirse: por eso la app captura borradores, y no sólo recibe recetas ya convertidas.
- **Las fuentes son de todo tipo** —videos, sitios, libros de papel, PDFs, gente que le pasa cosas— y ninguna app del mercado captura desde ellas.

**Forma que el usuario le da a la solución:**

| Momento | Qué pasa |
|---|---|
| Arranque | **Desde la app donde vio la receta**, compartiendo hacia Recetario. Si compartir no es posible, registrar al menos la fuente. |
| Qué queda | Un **borrador**. |
| Dónde espera | **Borradores**, la lista de las recetas con el tag `borrador`, con su contador en el menú. |
| Quién completa | **El usuario**, en una sesión con el agente. No corre solo: desde el editor del borrador, «Convertir con Agente» guarda la receta, arma el pedido y lo manda, y la receta vuelve a la app compartida o pegada. |


### 2.3 Cocinar — *"lo tengo abierto mientras hago"* 🥉 Menor

| | |
|---|---|
| **Cuándo** | Fin de semana, mientras cocina. |
| **Dónde y con qué** | Cocina, teléfono apoyado, manos ocupadas o sucias. |
| **Atención** | Partida, interrumpida, a la distancia del brazo. |
| **Objetivo** | Seguir una receta ya elegida. |

**Es el uso menor**, y solo para **recetas complejas o que hace muy de vez en
cuando**. Lo que domina no lo mira.

El único dolor que aparece acá es que **la pantalla se apaga**. Lo resuelve el
modo cocina (`src/cocina-control.ts`, Wake Lock API), intencionalmente como
botón manual —el sol del encabezado— porque no siempre es necesario que quede
prendida. Una vez encendido, se vuelve a pedir solo al volver de segundo plano.

### 2.4 Planificar la semana — *"me gustaría probar"*

| | |
|---|---|
| **Cuándo** | Sin definir. |
| **Dónde y con qué** | Sentado, sin apuro. |
| **Atención** | Completa. |
| **Objetivo** | Facilitar la compra semanal y ganar variedad entre semana. |

**No es un contexto observado: nace de una hipótesis del usuario.** Sus
palabras: *"no es principal, pero me gustaría probar a ver si me resulta"*.

Tiene una tensión que hay que dejar escrita: apunta a **más variedad de comidas
durante la semana**, pero entre semana hoy cocina de memoria y sin receta. O sea
que no es una feature que se acople a la conducta actual — **es una feature que
la cambiaría**. Por eso el plan es lo mínimo que resuelve el job, y sacarlo
cuesta borrar una entrada del menú y tres pantallas (principio 6).

---

## 3. Restricciones que este hito impone al diseño

Tres cosas que salieron de la entrevista y condicionan todo lo que venga:

**3.1 Todo tiene que ser reconstruible desde archivos.**
Textual: *"todo tiene que ser reconstruible por `.md` o archivos de Drive como
soporte"*. No es solo el recetario: alcanza al índice y al plan de la semana. **Nada que importe puede vivir solo dentro de la app.** Es la
consecuencia literal de que el producto sea el repositorio y la app una vista
sobre él. Es el principio 1 de `product-principles.md`.

**3.2 La taxonomía está abierta.**
Textual: *"la cantidad de carpetas o categorías es circunstancial, no es central
a nada"*. Ninguno de los nueve jobs las menciona. Por eso las categorías las define el
usuario: la app trae 16 predefinidas, y se crean, renombran y borran desde
*Ajustes → Recetario*. La carpeta base también se elige.

**3.3 El agente vive afuera de la app.**
La app no llama a ningún modelo: **está diseñada para recibir borradores y
esperar**, no para procesar. Cuando se quiere convertir uno, «Convertir con
Agente» arma el pedido —el borrador y las reglas del formato— y lo manda al
agente; la respuesta vuelve compartida o pegada y abre el editor.

Para la captura en sí no hace falta ningún agente: la **Share Target API**
permite que la PWA sea destino del "Compartir" del sistema y escriba el borrador
en Drive, sin backend. Funciona en Android, con la PWA instalada.

---

## 4. Lo que este documento descarta

Registrado para que no se reabra sin decisión explícita:

| Descartado | Motivo |
|---|---|
| Segunda persona, o cualquier consultante | Confirmado: no existe nadie más. |
| Modelo de hogar, recetario compartido, multiusuario | Consecuencia de lo anterior. Mandarle una receta a alguien —PDF, link o texto— sí existe: es una copia, no un acceso al recetario. |
| Historial de cocina (`ultima_vez`, `veces`) | *"No es necesario saber qué cociné."* La novedad se resuelve explorando, no registrando. |
| Filtros por comensales y dificultad | Preguntados uno por uno: no aplican. |
| Uso diario del recetario | Entre semana cocina de memoria. El producto es de fin de semana. |
