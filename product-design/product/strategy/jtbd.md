# Recetario — Jobs to be Done

**Versión:** 1.0
**Fecha:** 2026-09-05
**Estado:** Final — Hito 2 cerrado

---

## Sobre este documento

Los Jobs to be Done describen qué trabajo contrata el usuario cuando usa el
producto. No son features ni pantallas: son la situación que dispara el uso, la
motivación, y el resultado esperado.

Formato: **Cuando** *(situación)* **quiero** *(motivación)* **para**
*(resultado esperado)*.

Como Recetario tiene un solo usuario, los jobs no se agrupan por persona sino
por **contexto de uso** — ver `personas.md` §2. Cada job lleva su frecuencia
real y qué pasa hoy si el producto no lo resuelve, que es lo que permite
priorizar después.

**Leyenda de estado:**

- ✅ **Validado** — surgió de la entrevista con conducta real observada.
- 🔬 **Hipotético** — el usuario cree que lo querría; no hay conducta que lo respalde.

---

## Tabla de prioridad

| # | Job | Contexto | Frecuencia | Estado | ¿Lo resuelve la app hoy? |
|---|---|---|---|---|---|
| J1 | Recuperar una receta que ya tengo en mente | Recuperar | Alta | ✅ | Parcial |
| J2 | No perder una receta que acabo de encontrar | Archivar | Alta | ✅ | **No** |
| J3 | Convertir lo que guardé en una receta completa | Archivar | Alta | ✅ | Fuera de la app (agentes) |
| J4 | Buscar qué cocinar con lo que tengo | Recuperar | Media | ✅ | **No** |
| J5 | Mirar sin buscar, para hacer algo distinto | Recuperar | Media | ✅ | Parcial |
| J6 | Seguir una receta mientras cocino | Cocinar | Baja | ✅ | Sí |
| J7 | Corregir una receta que estaba mal | Cocinar | Baja | ✅ | Sí |
| J8 | Que el recetario sea legible sin la app | Transversal | Permanente | ✅ | Sí |
| J9 | Planificar la semana y armar la compra | Planificar | — | 🔬 | **No existe** |

---

## Jobs por contexto

### Contexto: Recuperar

#### J1 — Recuperar una receta que ya tengo en mente ✅

> **Cuando** decidí qué voy a cocinar y sé cómo se llama la receta,
> **quiero** llegar a ella sin recorrer nada,
> **para** ponerme a cocinar sin que la búsqueda sea parte del trabajo.

**Frecuencia:** alta. Es el uso principal declarado.
**Hoy:** buscador de Drive por nombre, o el índice del documento temático.
Funciona. La recuperación es por nombre, no por barrido visual.
**Si no se resuelve:** el producto pierde su razón de ser más básica.
**Nota de escala:** probado con decenas de recetas. Con ~1.000, buscar por
nombre sigue sirviendo; navegar un índice de mil entradas, no necesariamente.

#### J4 — Buscar qué cocinar con lo que tengo ✅

> **Cuando** tengo ingredientes en casa y quiero aprovecharlos,
> **quiero** encontrar recetas que los usen,
> **para** cocinar sin salir a comprar.

**Frecuencia:** media. Uno de los dos filtros que el usuario declaró usar.
**Hoy:** no existe. El buscador de Drive busca texto, sin distinguir un
ingrediente de una mención al pasar en una nota.
**Si no se resuelve:** el recetario solo sirve cuando ya sabés qué querés, y
queda inútil en el caso inverso.

> 🔗 **Este job es el que decide el formato del archivo.** Buscar por
> ingrediente entre mil recetas exige que los ingredientes tengan estructura;
> si son prosa libre, "berenjena" trae ruido. Es el argumento más fuerte del
> benchmark de formatos anotado para el Hito 5 — y también lo que tensiona la
> premisa de que el `.md` sea limpio.

#### J5 — Mirar sin buscar, para hacer algo distinto ✅

> **Cuando** tengo ganas de cocinar algo diferente pero no sé qué,
> **quiero** recorrer mi recetario sin un objetivo concreto,
> **para** que algo me llame la atención.

> **Sobre recomendar.** Este job no exige que el producto sugiera nada, pero
> tampoco lo excluye: sugerir es una de las formas posibles de resolverlo, como
> ayuda secundaria. Lo que sí está descartado es que el producto **empuje** a
> cocinar algo — el usuario generalmente ya sabe qué quiere. La forma concreta
> se decide en el Hito 5.

**Frecuencia:** media. Es el otro filtro declarado: *novedad*.
**Hoy:** parcial. Se puede navegar por categorías, pero está pensado para llegar
a algo, no para pasear.
**Si no se resuelve:** el recetario se convierte en un archivo de consulta y las
recetas que no se recuerdan por nombre no existen — lo cual, a ~1.000 recetas
mayormente migradas, es casi todo el recetario.

> ⚠️ **Novedad no es un dato, es un modo de uso.** El usuario descartó
> explícitamente llevar registro de qué cocinó: *"no es necesario saber qué
> cociné"*. Este job **no** pide `ultima_vez` ni `veces`. Pide una forma de
> mirar sin buscar.

---

### Contexto: Archivar

#### J2 — No perder una receta que acabo de encontrar ✅

> **Cuando** encuentro una receta que me interesa mientras estoy haciendo otra cosa,
> **quiero** dejarla guardada sin cortar lo que estoy haciendo,
> **para** no perderla.

**Frecuencia:** alta.
**Hoy:** el usuario guarda el link, guarda el reel, o anota en una app de notas.
Queda en un limbo fuera del recetario. **Confirmado: ahí se pierden recetas.**
**Si no se resuelve:** sigue siendo el agujero real del sistema. No es una
molestia de comodidad: es contenido que nunca llega.

> 🎯 **Este es el job huérfano del proyecto.** Ninguna versión de Recetario lo
> atendió nunca —la app recibe recetas ya convertidas— y ninguno de los siete
> competidores del Hito 1 lo resuelve tampoco, porque todos importan desde una
> página web y las fuentes reales son videos, libros de papel y PDFs.

**Forma acordada de la solución** (definida en el Hito 2, a detallar en el Hito 5):
compartir desde la app donde se vio la receta —o, como mínimo, registrar la
fuente—; queda un **borrador**; el borrador espera en una **sección separada**,
no mezclado con el recetario; y lo completa el usuario. Ver `personas.md` §2.2.

**Camino técnico sin backend:** la **Share Target API** permite que la PWA sea
destino del "Compartir" del sistema y escriba el borrador en Drive, sin agente y
sin servidor. Funciona en Android; en iOS el equivalente es un Atajo. Se
resuelve en el Hito 5.

#### J3 — Convertir lo que guardé en una receta completa ✅

> **Cuando** voy a cocinar algo que tenía guardado como link o como nota,
> **quiero** que se convierta en una receta completa y estructurada,
> **para** poder seguirla con método y que quede en el recetario para siempre.

**Frecuencia:** alta, y **acoplada al momento de cocinar**: la conversión ocurre
*"generalmente antes de ponerme a cocinarlo"*, no cuando se encuentra la receta.
**Hoy:** lo hacen agentes, en sesiones por fuera de la app. Que siga siendo así
o que el agente termine embebido en la PWA queda abierto — ver `personas.md`
§3.3.
**Si no se resuelve:** vuelve el problema declarado como más desgastante — *"no
tener la receta completa guardada para revisar"*.

> **Consecuencia de que la conversión sea just-in-time:** el recetario no crece
> continuamente. Una receta entra recién cuando está por cocinarse; todo lo
> demás vive en el limbo. Las ~1.000 recetas del target son casi todas
> migración de contenido viejo, no captura de contenido nuevo.

---

### Contexto: Cocinar

#### J6 — Seguir una receta mientras cocino ✅

> **Cuando** estoy cocinando algo complejo o que hago muy de vez en cuando,
> **quiero** tener la receta a la vista sin tocar el teléfono,
> **para** no perder el hilo con las manos ocupadas.

**Frecuencia:** baja. Solo para recetas complejas o poco frecuentes; lo que
domina no lo mira. Es el uso menor de los cuatro.
**Hoy:** resuelto. Es para lo que está construida la app actual.
**Si no se resuelve:** molesta, pero no rompe el producto.

> El único dolor de este contexto es que la pantalla se apaga, y ya está
> resuelto (`src/main.ts:93`). Es un **botón manual por decisión**, no por
> omisión: mantener la pantalla encendida no siempre hace falta, y activarlo
> solo cuando corresponde es el comportamiento buscado.

#### J7 — Corregir una receta que estaba mal ✅

> **Cuando** cocinando descubro que la receta tiene un error, o quiero anotar
> una variación que me salió mejor,
> **quiero** arreglarla en el momento,
> **para** que la próxima vez esté bien.

**Frecuencia:** baja.
**Hoy:** resuelto. Es exactamente el alcance declarado del editor: corregir, no
componer.
**Si no se resuelve:** los errores se perpetúan y el recetario pierde confianza.

---

### Transversal

#### J8 — Que el recetario sea legible sin la app ✅

> **Cuando** pienso en el recetario a diez años,
> **quiero** que sean archivos que pueda abrir con cualquier cosa, desde
> cualquier dispositivo,
> **para** que ni la app ni la plataforma ni el aparato sean condición para
> acceder a lo mío.

**Frecuencia:** permanente. No se ejecuta: se cumple o no se cumple.
**Hoy:** resuelto por diseño. Los `.md` en Drive son la fuente de verdad.
**Si no se resuelve:** el producto pierde su justificación entera.

> 💡 **Es el insight central declarado por el usuario**, con una formulación que
> vale citar textual: *"el recetario es una forma portátil de visualizar esa
> información"*. No dice que la app sea el producto — dice que **el producto es
> el repositorio, y la app es una vista descartable sobre él**. Es una tesis más
> fuerte que "mis datos son míos", porque acepta de entrada que la app puede
> morir sin consecuencias.
>
> El Hito 1 mostró que la parte de independencia también la cumple Obsidian +
> Recipe Box. Cuál formulación encabeza el posicionamiento está anotado como
> decisión pendiente del Hito 4 en `plan/decision-log.md`.

---

### Contexto: Planificar *(hipotético)*

#### J9 — Planificar la semana y armar la compra 🔬

> **Cuando** empieza la semana,
> **quiero** decidir **qué comida concreta va cada día** y que de ahí salga la
> lista de compras,
> **para** comprar una sola vez y comer más variado.

**Granularidad:** comidas concretas por día. Confirmado explícitamente, no es
una planificación floja tipo "esta semana quiero hacer estas cuatro cosas".
**Frecuencia:** desconocida. No hay conducta previa que lo respalde.
**Hoy:** no existe, ni en la app ni fuera de ella.
**Estado:** 🔬 hipótesis del usuario — *"no es principal, pero me gustaría
probar a ver si me resulta"*.

> ⚠️ **Tensión declarada.** Este job apunta a *más variedad de comidas durante
> la semana*, pero entre semana el usuario cocina de memoria, sencillo y sin
> receta. No es una feature que se acople a la conducta actual: **es una feature
> que la cambiaría.** Eso no la descalifica —puede ser exactamente lo que hace
> valiosa una herramienta— pero es una apuesta más grande de lo que "secundario"
> sugiere, y hay que tratarla como apuesta, no como requerimiento.

---

## Lo que estos jobs implican

Cuatro conclusiones que van directo al Hito 5, y una advertencia.

**1. El producto está construido para su tercer job en importancia.**
J6 y J7 —cocinar y corregir— son los que la app actual resuelve bien, y son los
de menor frecuencia. J1 lo resuelve a medias, J4 y J2 no los resuelve. Es el
desajuste más grande que dejó este hito.

**2. El job huérfano es J2, y no tiene competencia.**
Nadie del mercado lo resuelve, porque todos importan desde páginas web. Es
donde el Hito 1 ubicó el diferenciador defendible, y el Hito 2 lo confirma desde
la conducta: el limbo existe y ahí se pierden recetas.

**3. J4 decide el formato del archivo.**
Buscar por ingrediente es el único job que impone una restricción dura sobre la
estructura del `.md`. El benchmark de formatos del Hito 5 se resuelve
mayormente contra este job.

**4. J1 y J5 son el mismo problema visto por los dos lados.**
Saber el nombre y no saberlo. Con ~1.000 recetas mayormente migradas —recetas
que el usuario nunca cocinó y cuyo nombre no recuerda— J5 crece hasta volverse
tan importante como J1. La navegación tiene que servir a los dos.

**5. Ningún job menciona las categorías.**
Son la estructura central de la app actual y no aparecen en ninguno de los nueve
jobs. Confirmado por el usuario: *"la cantidad de carpetas o categorías es
circunstancial, no es central a nada"*. La clasificación se define desde cero en
el Hito 5, sin heredar las 16 carpetas.

**6. Todo entregable tiene que ser reconstruible desde archivos.**
J8 no es solo sobre las recetas: alcanza al índice, al plan semanal de J9 y a la
lista de compras. Un plan semanal es un archivo en Drive, no un dato de la app.
Es la restricción más dura del hito y va como candidato a principio en el Hito 3.

**⚠️ Advertencia sobre J9.** Es el único job hipotético y el único que pediría
inventar entidades nuevas (plan semanal, lista de compras, quizás despensa).
Diseñarlo al mismo nivel que los validados sería construir sobre una
suposición. Va tratado como exploración explícita.
