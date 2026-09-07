# Recetario — Wireframes Lo-Fi

**Versión:** 1.3
**Fecha:** 2026-09-06
**Estado:** Final — Hito 6 cerrado, corregido en los Hitos 7, 8 y 9

> **Cambios en la 1.1 (Hito 7):** §3.6 — Borradores es una planilla, una fila por
> borrador. §3.7 — el borrador ofrece **Crear la receta**, que abre el editor.
> §3.8 — iOS sale del alcance, Android es la plataforma (`E05-Cimientos.md` R7).
> §3.12 — la lista de compras no se tilda.
>
> **Cambio en la 1.3 (Hito 9):** §2.3 y §3.5 — la convención del ingrediente es
> `nombre` + separador + `cantidad`, escrita contra el contenido real del Drive.
>
> **Cambios en la 1.2 (Hito 8):** el vocabulario canónico de
> `ux/brand-identity.md` §4 — la pantalla es **Borradores**, no "bandeja", y la
> acción es **reindexar**, no "reconstruir". §3.1 — la grilla de categorías es de
> dos columnas.

---

## Sobre este documento

La estructura de cada pantalla: qué elementos aparecen, en qué jerarquía y cómo
se comportan. **No es diseño visual** — la paleta, la tipografía y los tokens
llegan en el Hito 8.

Cada decisión de layout lleva su razón. Lo que quede ambiguo acá se va a
resolver por gusto en el Hito 9, así que la ambigüedad es el error a evitar.

**Los estados no felices están en cada pantalla, no en un apéndice.** Un estado
que no se wireframea acá no va a tener mockup.

**Notación:** los bloques `┌─┐` son zonas de contenido, no píxeles. `▸` es un
estado, `⚑` una decisión de comportamiento, `[…]` un control.

---

## 1. Reglas transversales

Valen para todas las pantallas y no se repiten en cada una.

### 1.1 Densidad: densa para recorrer, espaciada para leer

Las listas son compactas: se recorren cientos de recetas y lo que importa es
cuántas entran de un vistazo. La receta abierta tiene aire: se lee, a veces a
50 cm, y es el único lugar donde el contenido es el fin y no el medio.

### 1.2 Ancho

Una columna. En pantalla ancha la columna tiene un máximo y se centra; las
grillas —categorías, listas de tarjetas— pasan de dos a cuatro columnas.

No hay diseño desktop propio: el principio 7 pide que se vea **bien** en el
teléfono y **no mal** en la computadora, y esa asimetría es deliberada.

### 1.3 Tamaños de control

El tamaño de los controles es una regla del sistema, no una decisión por
pantalla. Todos los controles táctiles tienen el mismo tamaño mínimo, pensado
para un dedo que puede estar sucio.

**El botón de volver es un control de tamaño normal, no un chevron chico.** El
gesto del sistema —swipe, back del navegador— funciona igual y es el camino que
se va a usar la mayoría de las veces; el botón es el respaldo visible.

### 1.4 Patrones vetados

| Vetado | Por qué |
|---|---|
| **Botón flotante de acción** | Tapa contenido y suele quedar sobre el último ítem de una lista. |
| **Estados vacíos decorativos** | Ilustraciones y frases simpáticas donde hace falta una frase que diga qué pasó. |

El resto de los patrones habituales queda disponible, con la razón anotada donde
se use.

### 1.5 Estados no felices, en general

| Estado | Forma |
|---|---|
| **Cargando** | Un indicador en el lugar donde va a aparecer el contenido, no una pantalla de carga completa. |
| **Vacío** | Una frase que dice qué pasa y, si hay una acción, el control para hacerla. Sin ilustración. |
| **Sin red** | Un aviso que dice que no se pudo conectar. La app **no muestra datos viejos como si fueran actuales**. |
| **Error al guardar** | Aviso, y el contenido queda en pantalla para reintentar. Nunca se pierde lo escrito sin decirlo. |

---

## 2. Componentes base

### 2.1 Tarjeta miniatura

Para recorrer: resultados de búsqueda, lista de categoría, y cualquier lista de
recetas.

```
┌──────────────────────────────────────┐
│ ┌────┐  Milanesas napolitanas        │
│ │foto│  Carnes · 40 min          [!] │
│ └────┘                               │
└──────────────────────────────────────┘
```

**Anatomía:** foto cuadrada chica a la izquierda · título · una línea de
contexto (categoría y tiempo) · marca de incompleta si corresponde.

**Por qué la foto al costado y no arriba:** con la foto arriba entran tres o
cuatro por pantalla; al costado entran ocho o nueve. La lista es para recorrer.

**Variantes:**

| Variante | Diferencia | Dónde |
|---|---|---|
| Base | Como arriba | Lista de categoría |
| Con motivo | Agrega por qué apareció: *"tiene berenjena"* | Resultados de búsqueda por ingrediente |

**Estados:** normal · sin foto *(placeholder)* · incompleta.

### 2.2 Placeholder de foto

**Es el caso normal, no la excepción.** Casi ninguna receta va a tener imagen, así
que el placeholder tiene que verse deliberado y no como una falta.

`[decisión Hito 8]` Su forma concreta —un color derivado de la categoría, una
marca, una inicial— es del design system. Acá se fija que **ocupa exactamente el
mismo espacio que una foto**, para que la lista no se desalinee cuando algunas
tienen y otras no.

### 2.3 Ítem de ingrediente

```
muzzarella          200 g
└─ nombre ─┘        └cant┘
```

`[corregido en el Hito 9]` El nombre va primero y la cantidad después del
separador, que es como está escrito el contenido real. En pantalla la cantidad se
alinea a la derecha. Un ingrediente sin cantidad se muestra solo con su nombre,
alineado igual.

**Dónde:** receta, editor *(como texto)*, lista de compras.

### 2.4 Marca de incompleta

Una marca discreta y consistente, en la tarjeta y en la receta abierta. **No es
un error ni una advertencia:** la receta funciona, le falta algo.

En la receta abierta, la marca es tocable y lleva a la acción: completarla, o
declararla completa así como está.

### 2.5 Encabezado

En todas las pantallas menos Recetario y Borradores.

```
┌──────────────────────────────────────┐
│ [←]   Título de la pantalla    [···] │
└──────────────────────────────────────┘
```

Volver a la izquierda, título al medio, acciones a la derecha si las hay.

### 2.6 Aviso

Un bloque con el mensaje y, si existe, el control de la acción.

```
┌──────────────────────────────────────┐
│ No se pudo guardar: no hay conexión. │
│                     [Reintentar]     │
└──────────────────────────────────────┘
```

**Dos niveles:** con acción, aparece donde ocurrió el problema e interrumpe lo
justo; sin acción, se acumula en Ajustes y no interrumpe (principio 4).

Nunca muestra el error crudo del servidor.

### 2.7 Campo de metadato

En la receta es una etiqueta y un valor. En el editor es parte del texto del
frontmatter, no un formulario — ver §3.5.

### 2.8 Entrada de borrador

```
┌──────────────────────────────────────┐
│ Pasta con berenjenas                 │
│ instagram.com/reel/…      hace 3 días│
└──────────────────────────────────────┘
```

Título, fuente, y cuándo se capturó. La fuente es texto libre: puede ser una URL
o *"libro de pescados, pág. 84"*.

---

## 3. Las pantallas

### 3.1 Recetario

El punto de entrada. Cinco cosas compiten por esta pantalla y la jerarquía es
la decisión central.

```
┌──────────────────────────────────────┐
│  Recetario              [3] [ajustes]│  ← Borradores con contador
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🔍 Buscar receta o ingrediente   │ │  ← lo primero, ocupa lugar
│ └──────────────────────────────────┘ │
│                                      │
│  Categorías                          │
│ ┌────────────────┐ ┌────────────────┐│
│ │     Carnes     │ │    Pescados    ││  ← grilla de 2, 16 tiles
│ └────────────────┘ └────────────────┘│
│ ┌────────────────┐ ┌────────────────┐│
│ │       …        │ │       …        ││
│ └────────────────┘ └────────────────┘│
│                                      │
│  [ Planificar la semana ]            │  ← condicional, debajo de todo
└──────────────────────────────────────┘
```

**Por qué la búsqueda arriba y visible:** sirve al job más frecuente (J1) y al
que hoy no existe (J4). No va detrás de un ícono — principio 5.

**Por qué las categorías abajo y en grilla:** sirven a pasear (J5), que es
secundario respecto de buscar. La posición de cada categoría se aprende porque
el orden es alfabético y estable.

`[corregido en el Hito 8]` **Son dos columnas, no tres.** Con tres, el tile mide
110 px y la foto de categoría deja de distinguirse — y la foto es lo que hace que
la categoría se reconozca sin leer. Entran menos de un vistazo, y eso está
aceptado (`design-system.md` §6.4).

**Por qué Borradores arriba a la derecha con contador:** es uno de los dos
lugares primarios, pero se visita cuando hay algo que convertir, no siempre. El
contador es lo que evita que el limbo se reproduzca adentro del producto. Es un
aviso sin acción, así que no interrumpe.

**Por qué no hay barra de navegación inferior:** con dos lugares primarios, una
barra de dos ítems gasta una franja permanente para una decisión que se toma
poco.

**Por qué el planificador último:** entrada visible y alcanzable en dos toques,
sin ocupar navegación primaria. Sacarla cuesta borrar un bloque (principio 6).

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Cargando | La búsqueda ya usable; las categorías con su espacio reservado. |
| ▸ Sin recetas | Las categorías se ven igual, vacías. Una línea explica que todavía no hay nada y que las recetas entran por Borradores o desde Drive. |
| ▸ Sin red | Aviso arriba. Ni búsqueda ni categorías se dibujan con datos viejos. |
| ▸ Índice dañado | Reemplaza el contenido: el aviso del §3.10 con el botón de reindexar. |

`[variante a comparar en el Hito 9]` La jerarquía de esta pantalla admite al
menos dos formas distintas.

### 3.2 Resultados

```
┌──────────────────────────────────────┐
│ [←] 🔍 berenjena                 [×] │
├──────────────────────────────────────┤
│  Por nombre                          │
│  ┌────────────────────────────────┐  │
│  │ [tarjeta miniatura]            │  │
│  └────────────────────────────────┘  │
│                                      │
│  Por ingrediente                     │
│  ┌────────────────────────────────┐  │
│  │ [tarjeta con motivo]           │  │
│  └────────────────────────────────┘  │
│                                      │
│  Por tag                             │
│  ┌────────────────────────────────┐  │
│  │ [tarjeta con motivo]           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**La búsqueda es por título, por ingrediente y por tag.** Los tres criterios en
la misma caja.

**Por qué separados en grupos:** responden a preguntas distintas —J1, J4 y el
cruce lateral— y mezclarlas hace que el resultado exacto se pierda entre veinte
que comparten un ingrediente o un tag.

**Resuelve contra el índice**, cuya fila lleva los nombres de ingredientes: una
lectura, no mil.

**Estados:** ▸ escribiendo *(resultados en vivo)* · ▸ sin resultados *(una frase
y nada más)* · ▸ sin red *(no se puede buscar; se dice)*.

### 3.3 Categoría

```
┌──────────────────────────────────────┐
│ [←] Pescados y mariscos          (20)│
├──────────────────────────────────────┤
│  [tarjeta miniatura]                 │
│  [tarjeta miniatura]                 │
│  [tarjeta miniatura]                 │
│  …                                   │
└──────────────────────────────────────┘
```

Lista densa de tarjetas miniatura. El conteo en el encabezado dice el tamaño
antes de scrollear.

**A cientos de recetas:** la lista se carga por tramos al scrollear, pero el
conteo total está siempre visible arriba, así que nunca se scrollea sin saber
cuánto falta.

`[abierto: Hito 9]` Si hace falta ordenar u ordenar-por dentro de una categoría
se decide al ver la pantalla llena.

`[variante a comparar en el Hito 9]` Densidad de la tarjeta con el placeholder
como caso normal.

**Estados:** ▸ cargando · ▸ categoría vacía *(una frase)* · ▸ sin red.

### 3.4 Receta

**La pantalla más compleja de resolver.** Tiene que servir a dos momentos
distintos con la misma información.

**Los dos momentos, según el usuario:**

1. **Prelectura.** Antes de decidir o de empezar: se lee todo de corrido, incluidas notas y variaciones.
2. **Cocina.** Ingredientes durante el *mise en place*; pasos durante la ejecución. **Son excluyentes en el tiempo.** Notas y variaciones no se usan acá.

```
LECTURA (por defecto)                  COCINA
┌──────────────────────────┐          ┌──────────────────────────┐
│ [←] Milanesas nap.  [···]│          │ [←]  Milanesas    [salir]│
├──────────────────────────┤          ├──────────────────────────┤
│ ┌──────────────────────┐ │          │ [Ingredientes] [ Pasos ] │ ← conmutador
│ │        foto          │ │          ├──────────────────────────┤
│ └──────────────────────┘ │          │                          │
│ Milanesas napolitanas    │          │  Para la milanesa        │
│ Carnes · 40 min · fácil  │          │                          │
│ Cuaderno de mamá, p. 12  │          │  Milanesas          4    │
│                          │          │                          │
│ Un clásico de los…       │          │  Muzzarella      200 g   │
│                          │          │                          │
│ ## Ingredientes          │          │                          │
│  *4* milanesas de nalga  │          │        (texto grande)    │
│  Muzzarella      200 g   │          │                          │
│                          │          │                          │
│ ## Preparación           │          │                          │
│  1. Precalentar…         │          │                          │
│                          │          │                          │
│ ## Variaciones           │          │                          │
│  A la suiza              │          │                          │
│  *Libro de …*            │          │                          │
│                          │          │                          │
│ ## Notas                 │          │                          │
│                          │          │                          │
│ [Cocinar] [Editar]       │          │  [☀ pantalla encendida]  │
└──────────────────────────┘          └──────────────────────────┘
```

**Por qué una columna sola en lectura:** la prelectura necesita leer todo de
corrido. Con pestañas permanentes, leer la receta entera cuesta cuatro toques —
que es exactamente por lo que se descartaron en la implementación actual.

**Por qué un conmutador en cocina, y por qué eso no contradice lo anterior:** el
argumento contra las pestañas era que escondían las notas y las variaciones justo
al cocinar. El Hito 6 encontró que **notas y variaciones no se usan cocinando**,
y que ingredientes y pasos son excluyentes en el tiempo. Con eso, el conmutador
deja de esconder algo que hace falta. `[divergencia parcial con lo implementado]`

**El conmutador preserva la posición.** Volver de Ingredientes a Pasos devuelve
al paso donde se estaba, no al principio. Es lo que hace que ir y volver sea
barato.

**Por qué el modo cocina es un modo y no la pantalla por defecto:** cocinar es el
uso menor de los cuatro. Se entra a propósito.

**Tamaños a 50 cm:** el modo cocina usa texto y controles bastante más grandes
que el resto de la app. Es el único lugar donde la escala cambia, y cambia porque
la distancia de lectura cambia.

**Wake lock:** botón manual dentro del modo cocina. Manual por decisión — no
siempre hace falta.

**Variaciones en lectura:** cada una con su nombre y su fuente propia, en la misma
columna. Un plato con tres versiones es una receta, no tres.

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Incompleta | La marca junto al título, tocable: lleva a completar o a declararla completa. El resto se muestra igual. |
| ▸ Sin foto | El bloque de foto no se dibuja. La receta empieza por el título. |
| ▸ Sin ingredientes o sin pasos | La sección no aparece. En modo cocina, el conmutador muestra solo lo que existe. |
| ▸ Cargando | El `.md` se lee al abrir; el esqueleto de la pantalla ya está. |
| ▸ Sin red | No se puede abrir. Aviso. |

`[variante a comparar en el Hito 9]` Es la principal candidata: la relación entre
lectura y cocina admite varias formas.

### 3.5 Editor

**Un formulario con campos separados**, y el mismo editor para corregir una
receta existente y para crear una nueva. Lo que se escribe se guarda como
markdown en el `.md`.

```
┌──────────────────────────────────────┐
│ [←] Editando            [Guardar]    │
├──────────────────────────────────────┤
│  Título                              │
│  ┌──────────────────────────────────┐│
│  │ Milanesas napolitanas            ││
│  └──────────────────────────────────┘│
│                                      │
│  Categoría [ Carnes ▾ ]              │
│  Tags      [ italiana ×][ horno ×][+]│
│                                      │
│  Rinde [4 porciones]  Tiempo [40 min]│
│  Dificultad [ fácil ▾ ]              │
│  Fuente    [ Cuaderno de mamá, p.12 ]│
│  Foto      [ https://…              ]│
│                                      │
│  Descripción                         │
│  ┌──────────────────────────────────┐│
│  │ Un clásico de los domingos…      ││
│  └──────────────────────────────────┘│
│                                      │
│  Ingredientes    ⚑ un campo de texto │
│  ┌──────────────────────────────────┐│
│  │ ### Para la milanesa             ││
│  │ - Milanesas de nalga — 4         ││
│  │ - Muzzarella | 200 g             ││
│  └──────────────────────────────────┘│
│                                      │
│  Preparación                         │
│  ┌──────────────────────────────────┐│
│  │ 1. Precalentar el horno…         ││
│  └──────────────────────────────────┘│
│                                      │
│  Variaciones          [+ agregar]    │
│  Notas                               │
│                                      │
│  [ ] Está completa así como está     │
└──────────────────────────────────────┘
```

**Por qué campos separados y no el `.md` crudo:** el frontmatter YAML es
estructura, no contenido. Ponerlo delante de alguien que vino a corregir una
falta de ortografía en un paso es exponer el andamiaje. Con campos, cada dato
tiene su control y el archivo se arma solo.

**Por qué el contenido es texto plano dentro de cada campo:** los pasos, las
notas y las variaciones son prosa. Se escriben como se escriben y se guardan tal
cual en su sección del `.md`.

**Los ingredientes son un único campo de texto**, igual que la preparación o las
notas. No hay un componente que genere una fila por ingrediente.

**La estructura es por convención, no por interfaz:** cada bullet es un
ingrediente, y de cada bullet se extrae lo que se indexa. Los grupos son una
línea con `###`. La cantidad va después del separador y se escribe a mano.

`[decidido, con su costo a la vista]` La alternativa era cantidad y nombre en
campos separados, con la app armando el ítem sola — J4 nunca fallaría por un
descuido de tipeo, pero cada ingrediente sería un control con su fila que agregar
y quitar. Se prefirió el campo único: un ingrediente se escribe en el tiempo que
se tarda en escribirlo. El costo es que una receta mal tipeada queda fuera del
filtro por ingrediente, y **eso es consistente con el principio 3**: la app no
rechaza, marca la receta como incompleta.

**El editor compone lo mínimo.** Es el mismo formulario para "nueva receta", así
que el alcance declarado pasa a ser **corregir, y crear una receta que ya tenés
en la cabeza**. Transcribir un PDF o un video sigue siendo trabajo del agente:
nadie va a hacer eso acá adentro.

**Dos controles no editan texto, actúan:**

- **Categoría.** Cambiarla mueve el archivo entre carpetas de Drive.
- **"Está completa así como está".** Escribe `completa: true`. Es una declaración del usuario, no una edición.

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Nueva receta | Los mismos campos, vacíos. Solo el título es obligatorio. |
| ▸ Guardando | El botón indica que está trabajando. |
| ▸ Error al guardar | Aviso, y **todo lo escrito queda en pantalla**. |
| ▸ Sin red | Igual que el anterior. |
| ▸ Campos desconocidos | Si el `.md` traía claves o secciones que el esquema no reconoce, se conservan al guardar y no se pierden por haber pasado por el editor. |

### 3.6 Borradores

Uno de los dos lugares primarios.

```
┌──────────────────────────────────────┐
│ [←] Borradores                    (3)│
├──────────────────────────────────────┤
│  [entrada de borrador]               │
│  [entrada de borrador]               │
│  [entrada de borrador]               │
│                                      │
│  [ + Agregar a mano ]                │
└──────────────────────────────────────┘
```

**Es una cola de trabajo, no un archivo.** Se lee de una vez —es una planilla en
Drive, una fila por borrador— y se vacía. El orden es por fecha de captura, lo más viejo
primero: lo que lleva más tiempo esperando es lo que más riesgo corre.

**"Agregar a mano"** cubre lo que no se puede compartir: la foto de una página de
un libro, algo que alguien contó.

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Vacío | *"No hay borradores."* Y el control de agregar a mano. Sin ilustración. |
| ▸ Cargando | — |
| ▸ Sin red | Aviso. Borradores no se puede leer. |

### 3.7 Borrador

```
┌──────────────────────────────────────┐
│ [←] Borrador              [Descartar]│
├──────────────────────────────────────┤
│  Pasta con berenjenas                │
│  instagram.com/reel/…                │
│  Capturado hace 3 días               │
│                                      │
│  [ Crear la receta ]                 │
│  [ Ir a la fuente ]                  │
│  [ Editar título ]                   │
└──────────────────────────────────────┘
```

**Lo que la app hace acá es poco y a propósito:** muestra el borrador. La
conversión desde una fuente ocurre afuera, en una sesión con el agente, y cuando
termina el borrador desaparece solo.

**No hay botón que llame a un agente.** Sería una promesa que la app no puede
cumplir: el agente no vive adentro.

`[corregido en el Hito 7]` Lo que sí ofrece es **Crear la receta**, que abre el
editor con el título y la fuente ya cargados. Es el alcance del editor y no otro:
sirve para una receta que ya tenés en la cabeza, no para transcribir el video de
la fuente. Al guardar, el borrador desaparece en la misma operación.

`[abierto]` Si el agente se embebe algún día, este es el lugar donde aparecería
su botón, sin cambiar nada más de la pantalla.

**Descartar** pide confirmación: es destructivo y no hay papelera.

### 3.8 Captura

La pantalla efímera del Share Target. **Es el flujo más crítico del producto** y
es la pantalla más simple: un campo y un botón.

```
┌──────────────────────────────────────┐
│  Guardar en Recetario                │
│                                      │
│  instagram.com/reel/…                │  ← la fuente, ya cargada
│                                      │
│  Título                              │
│  ┌──────────────────────────────────┐│
│  │ ▮                                ││  ← foco automático
│  └──────────────────────────────────┘│
│                                      │
│           [Cancelar]  [Guardar]      │
└──────────────────────────────────────┘
```

**Un solo campo.** No pide categoría, ni tags, ni descripción: el presupuesto de
la captura es un campo y está gastado en el título, que es lo único que vuelve al
borrador recuperable.

**El foco entra solo en el campo**, con el teclado abierto. Se captura con una
mano, en el medio de otra cosa.

**Al guardar, vuelve a donde estabas.** La app no queda abierta: la captura
termina donde empezó.

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Guardando | El botón indica que está trabajando. |
| ▸ Sin red | *"No se pudo guardar."* **El título escrito queda en pantalla.** Se puede reintentar. |
| ▸ Sin sesión | Hay que conectarse primero. Es el peor caso de este flujo y hay que decirlo claro. |

**iOS no se soporta.** No tiene Share Target, y el Atajo equivalente queda fuera
del alcance en vez de quedar como una deuda que nadie va a implementar. Android
es la plataforma (`E05-Cimientos.md` R7).

### 3.9 Ajustes

```
┌──────────────────────────────────────┐
│ [←] Ajustes                          │
├──────────────────────────────────────┤
│  Cuenta                              │
│   alelarre@gmail.com     [Salir]     │
│                                      │
│  Índice                              │
│   Última reindexado: ayer        │
│   [ Reindexar ]          │
│                                      │
│  Avisos                              │
│   2 archivos ignorados por no tener  │
│   título.                     [Ver]  │
└──────────────────────────────────────┘
```

**Es donde viven los avisos sin acción inmediata** (principio 4). Que no
interrumpan no significa que no existan: lo que se ignora se cuenta y se dice
acá.

**Reindexar está acá** —a tres toques— porque es una operación rara y cara.
Cuando hace falta de verdad, se ofrece sola, en la pantalla que falló.

### 3.10 Conexión y arranque

```
PRIMER ARRANQUE                    ÍNDICE DAÑADO
┌──────────────────────────┐      ┌──────────────────────────┐
│                          │      │                          │
│  Recetario               │      │  El índice está dañado.  │
│                          │      │                          │
│  Tus recetas viven en    │      │  Tus recetas están bien: │
│  tu Google Drive. Esta   │      │  lo dañado es el atajo   │
│  app las lee y las       │      │  que la app usa para     │
│  escribe ahí.            │      │  listarlas.              │
│                          │      │                          │
│  [ Conectar con Google ] │      │  [ Reindexar ]         │
└──────────────────────────┘      └──────────────────────────┘
```

**Explica antes de pedir permiso.** El scope `drive` trae una pantalla de "app no
verificada" y conviene que no sea la primera explicación que el usuario recibe.

**Estados:**

| Estado | Qué se ve |
|---|---|
| ▸ Conectando | Indicador. **Con salida:** si tarda demasiado o el popup se cierra, aparece el aviso. |
| ▸ Consentimiento cancelado | *"No se pudo conectar."* Y el botón otra vez. **Nunca quedarse en "Conectando…".** |
| ▸ Creando el índice | Progreso, porque puede tardar: se leen los `.md` de a uno. |
| ▸ Índice dañado | El de la derecha. Se ofrece, no se hace solo: reindexar es caro y arrancar no es el momento de decidirlo por el usuario. |

### 3.11 Planificador `[condicional]`

Existe solo si J9 se construye.

```
┌──────────────────────────────────────┐
│ [←] Semana del 7 al 13      [Compras]│
├──────────────────────────────────────┤
│  Lunes                               │
│   Mediodía  [ + ]                    │
│   Noche     Milanesas napolitanas    │
│  Martes                              │
│   Mediodía  [ + ]                    │
│   Noche     [ + ]                    │
│  …                                   │
└──────────────────────────────────────┘
```

Dos comidas por día, siete días. Tocar un espacio vacío abre la búsqueda de
recetas: **solo entran recetas del recetario**.

**Estados:** ▸ semana vacía · ▸ parcial *(el caso normal)*.

### 3.12 Lista de compras `[condicional]`

```
┌──────────────────────────────────────┐
│ [←] Lista de compras                 │
├──────────────────────────────────────┤
│  Con cantidad                        │
│   350 g  muzzarella                  │
│   4      milanesas de nalga          │
│                                      │
│  Sin cantidad                        │
│   sal y pimienta                     │
│   aceite de oliva                    │
└──────────────────────────────────────┘
```

**Degrada con gracia y lo muestra.** Lo que tiene cantidad se suma y se agrupa;
lo que está en prosa libre se lista tal cual, como recordatorio. Separarlos en
dos bloques hace visible la diferencia sin pedir disculpas por ella.

Es lo que evitó que J9 forzara un formato de archivo más rígido.

`[corregido en el Hito 7]` **No se tilda nada.** La lista se lee en el
supermercado y no guarda estado: sin ítems tachados, sin progreso, sin nada que
sincronizar.

---

## 4. Cómo se navegan los tags

`[cierra pendiente del Hito 5]`

**Los tags son un criterio de búsqueda de primera clase**, junto al título y a
los ingredientes: escribir "horno" en la caja de búsqueda devuelve, entre otras
cosas, las recetas que llevan ese tag.

**Además son filtros que se aplican sobre una lista** —resultados o categoría— y
se muestran en la receta abierta, donde tocar uno lleva a la lista filtrada por
él.

**Lo que no tienen es pantalla propia.** Una nube o un listado de tags es una
taxonomía más para aprender, y ningún job pide recorrer tags: piden llegar a una
receta. Como criterio de búsqueda el tag no cuesta nada; como sección del
producto, cuesta un lugar en la navegación que no se gana.

**Por qué también desde la receta:** es el momento en que el tag tiene sentido
concreto —"esto es de horno, qué más tengo de horno"— y es gratis, porque los
tags ya están dibujados ahí.

`[abierto: Hito 9]` Si además hace falta un control de filtro visible sobre las
listas se decide al ver la pantalla llena de recetas.

## 5. Decisiones de layout, resumidas

| Decisión | Razón | Principio |
|---|---|---|
| Búsqueda arriba, categorías abajo | J1 es el job más frecuente y no usa categorías | 5 |
| Sin barra de navegación inferior | Dos lugares, y a Borradores se va poco | — |
| Borradores arriba a la derecha, con contador | Aviso sin acción: no interrumpe | 4 |
| Tarjeta con foto al costado | Ocho por pantalla en vez de tres | Densidad |
| Placeholder del mismo tamaño que la foto | Es el caso normal; la lista no se desalinea | — |
| Receta en una columna para leer | La prelectura necesita corrido | — |
| Conmutador Ingredientes/Pasos solo en cocina | Son excluyentes en el tiempo; notas y variaciones no se usan cocinando | — |
| El conmutador preserva la posición | Hace barato ir y volver | — |
| Modo cocina con texto más grande | Se lee a 50 cm, no a 30 | 7 |
| Editor de campos separados | El frontmatter es andamiaje, no contenido | — |
| Ingredientes en un campo de texto único, con bullets por convención | Velocidad de uso; el costo lo absorbe la marca de incompleta | 3 |
| El mismo editor para corregir y para crear | Un solo formulario, y crear se limita a lo que ya tenés en la cabeza | — |
| Categoría y "completa" como controles, no texto | No son texto: mueven el archivo o declaran algo | 3 |
| Sin botón de "convertir" en el borrador | El agente no vive adentro de la app | — |
| Captura con un solo campo y foco automático | El presupuesto es un campo | 2 |
| Reindexar en Ajustes, y ofrecido donde falla | Caro y raro, pero con salida cuando hace falta | 4 |
| Tags como criterio de búsqueda y filtro, sin pantalla propia | Como criterio no cuestan nada; como sección cuestan un lugar que no se gana | 5 |

---

## 6. Candidatas a variante en el Hito 9

| Pantalla | Qué se compara |
|---|---|
| **Receta** | La relación entre lectura y cocina. Es la más compleja de resolver. |
| **Recetario** | La jerarquía entre búsqueda, categorías, Borradores y planificador. |
| **Lista de categoría** | Densidad de la tarjeta, con el placeholder como caso normal. |
