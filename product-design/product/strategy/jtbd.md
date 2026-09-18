# Recetario — Jobs to be Done

**Versión:** 1.1
**Fecha:** 2026-09-18
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
real, cómo lo resuelve el producto y qué pasa si no lo resuelve.

**Leyenda de estado:**

- ✅ **Validado** — surgió de la entrevista con conducta real observada.
- 🔬 **Hipotético** — el usuario cree que lo querría; no hay conducta que lo respalde.

---

## Tabla de prioridad

| # | Job | Contexto | Frecuencia | Estado | ¿Lo resuelve la app? |
|---|---|---|---|---|---|
| J1 | Recuperar una receta que ya tengo en mente | Recuperar | Alta | ✅ | Sí |
| J2 | No perder una receta que acabo de encontrar | Archivar | Alta | ✅ | Sí |
| J3 | Convertir lo que guardé en una receta completa | Archivar | Alta | ✅ | El agente convierte; la app manda el pedido y recibe la receta |
| J4 | Buscar qué cocinar con lo que tengo | Recuperar | Media | ✅ | Sí |
| J5 | Mirar sin buscar, para hacer algo distinto | Recuperar | Media | ✅ | Sí |
| J6 | Seguir una receta mientras cocino | Cocinar | Baja | ✅ | Sí |
| J7 | Corregir una receta que estaba mal | Cocinar | Baja | ✅ | Sí |
| J8 | Que el recetario sea legible sin la app | Transversal | Permanente | ✅ | Sí |
| J9 | Planificar la semana y armar la compra | Planificar | Baja | ✅ | Sí |

---

## Jobs por contexto

### Contexto: Recuperar

#### J1 — Recuperar una receta que ya tengo en mente ✅

> **Cuando** decidí qué voy a cocinar y sé cómo se llama la receta,
> **quiero** llegar a ella sin recorrer nada,
> **para** ponerme a cocinar sin que la búsqueda sea parte del trabajo.

**Frecuencia:** alta. Es el uso principal declarado.
**Hoy:** la búsqueda es lo primero del Recetario y busca por título,
ingrediente y tag. La recuperación es por nombre, no por barrido visual.
**Si no se resuelve:** el producto pierde su razón de ser más básica.
**Nota de escala:** probado con decenas de recetas. Con ~1.000, buscar por
nombre sigue sirviendo; navegar un índice de mil entradas, no necesariamente.

#### J4 — Buscar qué cocinar con lo que tengo ✅

> **Cuando** tengo ingredientes en casa y quiero aprovecharlos,
> **quiero** encontrar recetas que los usen,
> **para** cocinar sin salir a comprar.

**Frecuencia:** media. Uno de los dos filtros que el usuario declaró usar.
**Hoy:** la búsqueda encuentra por ingrediente, sobre los nombres que el índice
guarda de cada receta: una mención al pasar en una nota no cuenta.
**Si no se resuelve:** el recetario solo sirve cuando ya sabés qué querés, y
queda inútil en el caso inverso.

> 🔗 **Este job es el que decide el formato del archivo.** Buscar por
> ingrediente entre mil recetas exige que los ingredientes tengan estructura;
> si son prosa libre, "berenjena" trae ruido. Por eso cada ingrediente es un
> ítem de lista con nombre, separador y cantidad: estructura suficiente para
> buscar, sin ensuciar el `.md`.

#### J5 — Mirar sin buscar, para hacer algo distinto ✅

> **Cuando** tengo ganas de cocinar algo diferente pero no sé qué,
> **quiero** recorrer mi recetario sin un objetivo concreto,
> **para** que algo me llame la atención.

> **Sobre recomendar.** Este job no exige que el producto sugiera nada, pero
> tampoco lo excluye: sugerir es una de las formas posibles de resolverlo, como
> ayuda secundaria. Lo que sí está descartado es que el producto **empuje** a
> cocinar algo — el usuario generalmente ya sabe qué quiere. El producto no
> sugiere nada.

**Frecuencia:** media. Es el otro filtro declarado: *novedad*.
**Hoy:** se pasea por las categorías, con su foto, y por el carrusel de tags
—`probar` y `favorito` entre ellos—, que filtra una categoría o abre la lista de
un tag.
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
**Antes del producto:** el usuario guardaba el link, guardaba el reel, o anotaba
en una app de notas. Quedaba en un limbo fuera del recetario. **Confirmado: ahí
se perdían recetas.**
**Hoy:** se comparte hacia Recetario, o se abre la captura a mano; queda un
borrador con su título y su fuente.
**Si no se resuelve:** sigue siendo el agujero real del sistema. No es una
molestia de comodidad: es contenido que nunca llega.

> 🎯 **Este es el job sin competencia.** Ninguno de los siete competidores
> analizados lo resuelve, porque todos importan desde una página web y las
> fuentes reales son videos, libros de papel y PDFs.

**Forma de la solución:**
compartir desde la app donde se vio la receta —o, como mínimo, registrar la
fuente—; queda un **borrador**; el borrador espera en una **sección separada**,
no mezclado con el recetario; y lo completa el usuario. Ver `personas.md` §2.2.

**Camino técnico sin backend:** la **Share Target API** permite que la PWA sea
destino del "Compartir" del sistema y escriba el borrador en Drive, sin agente y
sin servidor. Funciona en Android, con la PWA instalada.

#### J3 — Convertir lo que guardé en una receta completa ✅

> **Cuando** voy a cocinar algo que tenía guardado como link o como nota,
> **quiero** que se convierta en una receta completa y estructurada,
> **para** poder seguirla con método y que quede en el recetario para siempre.

**Frecuencia:** alta, y **acoplada al momento de cocinar**: la conversión ocurre
*"generalmente antes de ponerme a cocinarlo"*, no cuando se encuentra la receta.
**Hoy:** lo hace un agente, por fuera de la app, que no llama a ningún modelo.
Desde el borrador, «Convertir con Claude» arma el pedido y lo manda; la receta
vuelve compartida o pegada, abre el editor, y al guardarla el borrador se borra
— ver `personas.md` §3.3.
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
**Hoy:** resuelto por el modo cocina.
**Si no se resuelve:** molesta, pero no rompe el producto.

> El único dolor de este contexto es que la pantalla se apaga, y ya está
> resuelto (`src/cocina-control.ts`). Es un **botón manual por decisión**, no por
> omisión: mantener la pantalla encendida no siempre hace falta, y activarlo
> solo cuando corresponde es el comportamiento buscado.

#### J7 — Corregir una receta que estaba mal ✅

> **Cuando** cocinando descubro que la receta tiene un error, o quiero anotar
> una variación que me salió mejor,
> **quiero** arreglarla en el momento,
> **para** que la próxima vez esté bien.

**Frecuencia:** baja.
**Hoy:** resuelto. Es el alcance declarado del editor: corregir, y crear una
receta que ya se tiene en la cabeza; no componer desde una fuente.
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
> La parte de independencia también la cumple Obsidian + Recipe Box. Lo que
> encabeza el posicionamiento es que los archivos estén **en Drive**, que es
> donde escriben los agentes — ver `product-vision.md` §2.

---

### Contexto: Planificar

#### J9 — Planificar la semana y armar la compra ✅

> **Cuando** empieza la semana,
> **quiero** decidir **qué comida concreta va cada día** y que de ahí salga la
> lista de compras,
> **para** comprar una sola vez y comer más variado.

**Granularidad:** comidas concretas por día. Confirmado explícitamente, no es
una planificación floja tipo "esta semana quiero hacer estas cuatro cosas".
**Frecuencia:** baja.
**Hoy:** el plan de siete días sin fechas, que arranca en el día de hoy, con dos
comidas por día y una lista de recetas en cada una; de ahí sale la lista de
compras (`E06-Planificar.md`). El plan es un archivo, `_plan.md`.

> ⚠️ **Tensión declarada.** Este job apunta a *más variedad de comidas durante
> la semana*, pero entre semana el usuario cocina de memoria, sencillo y sin
> receta. No es una feature que se acople a la conducta actual: **es una feature
> que la cambiaría.** Por eso se construyó con costo de retiro bajo (principio
> 6): una entrada en el menú lateral, ninguna entidad nueva en el núcleo, y
> sacarla es borrar tres pantallas y un archivo.

---

## Lo que estos jobs implican

Seis conclusiones, y una advertencia.

**1. Los jobs de mayor frecuencia mandan.**
J6 y J7 —cocinar y corregir— son los de menor frecuencia. J1, J2 y J4 son los
que ordenan el producto: la búsqueda arriba, la captura a un toque, el
ingrediente buscable.

**2. El job huérfano es J2, y no tiene competencia.**
Nadie del mercado lo resuelve, porque todos importan desde páginas web. Es
donde está el diferenciador defendible, y la conducta lo confirma: el limbo
existe y ahí se pierden recetas.

**3. J4 decide el formato del archivo.**
Buscar por ingrediente es el único job que impone una restricción dura sobre la
estructura del `.md`: de ahí sale la convención del ingrediente.

**4. J1 y J5 son el mismo problema visto por los dos lados.**
Saber el nombre y no saberlo. Con ~1.000 recetas mayormente migradas —recetas
que el usuario nunca cocinó y cuyo nombre no recuerda— J5 crece hasta volverse
tan importante como J1. La navegación tiene que servir a los dos.

**5. Ningún job menciona las categorías.**
No aparecen en ninguno de los nueve jobs. Confirmado por el usuario: *"la
cantidad de carpetas o categorías es circunstancial, no es central a nada"*.
Por eso las define el usuario, desde *Ajustes → Recetario*, y van debajo de la
búsqueda.

**6. Todo entregable tiene que ser reconstruible desde archivos.**
J8 no es solo sobre las recetas: alcanza al índice y al plan de J9. El plan es un
archivo en Drive, no un dato de la app; la lista de compras no se guarda en
ningún lado, porque se deriva del plan cada vez.
Es la restricción más dura, y es el principio 1 de `product-principles.md`.

**⚠️ Advertencia sobre J9.** Es el único job que cambiaría la conducta en vez de
acompañarla, y el único que pedía inventar entidades nuevas. Está construido con
lo mínimo que lo resuelve —un plan, un archivo, y la lista derivada del plan— y
con costo de retiro bajo: si el uso no lo confirma, se saca sin rediseñar nada
(principio 6).
