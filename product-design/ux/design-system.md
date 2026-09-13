# Recetario — Design System

**Versión:** 2.1
**Fecha:** 2026-09-12
**Estado:** Final — Hito 11

> **Cambios en la 2.1 (2026-09-12):** salieron de implementar el rediseño y
> mirarlo andando. Dos componentes nuevos: el **conmutador de dos posiciones**
> (§6.16), que reemplaza a la casilla de completitud, y el **menú lateral**
> (§6.17), que es la navegación primaria. §6.10 — el chip sube un tono y la
> variante removible pasa a ser la del editor. §6.7 — qué hacer con un logo
> ajeno dentro de un control. §7 — el segundo punto de quiebre, 900 px.
>
> **Cambios en la 2.0 (Hito 11):** §3.1 — la tipografía es **la del sistema**, sin
> webfont. §2.1 — `--fg-3` sube a `#948A7A` para cumplir 4.5:1 sin excepción, y el
> velo del tile pasa a ser el token `--velo`.
>
> **Cambios en la 1.1 (Hito 9):** cuatro huecos cerrados —`--e-cocina`, el botón
> compacto, los tokens de ícono y casilla, y §6.13— y tres reglas precisadas, todas
> por lo que se vio al mockupear. El detalle en `mockups/README.md`.

---

## Sobre este documento

Los valores concretos con los que se implementa cualquier pantalla de Recetario.
**El criterio que los genera está en `brand-identity.md`;** acá están los
números.

Es lo que reemplaza a `app.css` como especificación visual. Un mockup o una
pantalla que necesite un valor que no esté acá indica un hueco del sistema, y el
hueco se arregla acá, no en la pantalla.

**Un solo tema, oscuro** (`brand-identity.md` §2.5). No hay `prefers-color-scheme`
ni conmutador, así que cada token tiene un solo valor.

---

## 1. Restricciones de legibilidad

**Estas restricciones arbitran el resto del sistema.** Cuando un token las
contradiga, gana la restricción.

| Restricción | Valor | Por qué |
|---|---|---|
| Cuerpo mínimo, en toda la app | **16 px** | Es el piso en el que un teléfono no fuerza zoom. |
| Cuerpo de la receta abierta | **18 px** | Se lee a 30-50 cm, apoyado. |
| Cuerpo en modo cocina | **22 px** | Se lee a 50 cm, de pie, con la atención partida. |
| Contraste de texto normal | **≥ 4.5:1** | WCAG AA. |
| Contraste del cuerpo de la receta | **≥ 7:1** | AAA. Es el texto que se lee en malas condiciones. |
| Área táctil mínima | **48 × 48 px** | Un dedo que puede estar sucio o mojado. |
| Área táctil en modo cocina | **64 × 64 px** | El mismo dedo, más lejos y con menos puntería. |
| Separación entre controles | **≥ 8 px** | Que un error de puntería no active el de al lado. |
| Ancho de línea de lectura | **60-75 caracteres** | Fija el máximo de la columna en pantalla ancha. |

**Todos los tokens de color de este documento tienen su contraste medido** contra
`--bg` o `--surface`, y el valor está anotado.

---

## 2. Color

### 2.1 Neutros

Todos cálidos. Ninguno tiene matiz frío (`brand-identity.md` §2.2).

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--bg` | `#17140F` | El fondo de la app. | — |
| `--surface` | `#211D17` | La ficha: el fondo de cada bloque con borde. | 1.4:1 sobre `--bg` |
| `--surface-alta` | `#2B261E` | Un bloque dentro de otro, y el estado presionado. | — |
| `--borde` | `#3A342B` | El borde de una ficha. Opaco, no translúcido. | 1.5:1 |
| `--borde-fuerte` | `#544C40` | El borde de un control, y el separador dentro de una ficha. | 2.2:1 |
| `--fg` | `#F2EBE1` | El texto. Blanco cálido, nunca `#FFF`. | **14.2:1** sobre `--surface` |
| `--fg-2` | `#B3A99B` | La línea de contexto, las etiquetas de metadato. | **7.2:1** |
| `--fg-3` | `#948A7A` | El texto tenue: fechas, contadores, la marca de incompleta. | **4.9:1** |
| `--velo` | `#0C0A07` | Más oscuro que `--bg`. Solo bajo el nombre de un tile de categoría, como degradado. | — |

`[--fg-3 corregido en el Hito 11]` Estaba en `#8A8073`, que da 4.3:1 y quedaba por
debajo del mínimo del propio documento con una excepción para texto chico. Subirlo
un escalón lo hace cumplir sin excepción, que es más barato que sostener la
excepción.

**Por qué `--fg` no es blanco puro:** sobre un fondo cálido, el blanco puro se ve
azul por contraste simultáneo, que es exactamente el gris azulado que la
identidad prohíbe.

### 2.2 Acento y semánticos

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--acento` | `#D98A5F` | Arcilla `[del 2026-09-12]`. La acción primaria, el foco, el tag activo. | **6.2:1** sobre `--surface` |
| `--acento-suave` | `#39291D` | El fondo de un elemento con el acento aplicado. | — |
| `--error` | `#D95F52` | **Solo para operaciones que fallaron.** | **4.6:1** |
| `--error-suave` | `#33191A` | El fondo del aviso con acción. | — |

**No hay token de éxito ni de advertencia.** El éxito no se comunica
(`brand-identity.md` §3.2), y lo que en otro producto sería una advertencia —una
receta incompleta— acá no es un problema y usa `--fg-3`.

**El acento y el error se tienen que distinguir de reojo:** una distancia
percibida (CIEDE2000) de al menos 12 entre los dos. La terracota anterior
(`#E0663C`) estaba a 8, lo mismo que dos categorías vecinas, y los botones
primarios se leían como error. La arcilla está a 14.6.

**Regla dura: el error es solo para errores y para lo destructivo.** Una receta
sin ingredientes, un archivo ignorado o una categoría vacía **nunca** usan
`--error`.

`[precisada en el Hito 9]` La excepción son los dos controles que borran algo:
*Descartar* un borrador y *Borrar* una receta, con la variante de peligro del
botón (§6.7). No es una contradicción — la operación **es** destructiva, y es el
único aviso que el usuario tiene antes de tocarla.

### 2.3 Los colores de categoría

Quince colores, uno por categoría, más un neutro para `Otros`.

**Reglas de la paleta:**

1. **Separación mínima de 18° de matiz**, y **una distancia percibida (CIEDE2000) de al menos 12 respecto del acento** `[del 2026-09-12; antes eran 20° de matiz]`. 18° es la distancia a la que dos colores se distinguen sin compararlos lado a lado, que es como se ven en una lista. La segunda regla existe porque el acento es de la app y una categoría no puede parecerse a un botón: por eso la serie arranca en 36° y deja libre el vecindario del acento. Se mide en distancia percibida y no en matiz porque la saturación también separa: la arcilla está a 15° de Carnes pero a 14.1 de distancia, porque Carnes es un beige apagado. Carnes es la más cercana.
2. **Se evita el rango 255°-300°**, el violeta corporativo que la identidad prohíbe.
3. **Luminosidad compensada por matiz:** los amarillo-verdes (55°-115°) van más oscuros y los azules (175°-255°) más claros, porque a igual valor de HSL se perciben distinto.
4. **Todos superan 4.5:1 sobre `--surface`.** El más bajo es Entradas y picadas, con 4.9:1.
5. **La afinidad manda donde es obvia:** lo tostado y lo horneado en los ámbar, los vegetales en los verdes, el pescado y las bebidas en los celestes, lo dulce en los magentas. Donde no es obvia, reparte la separación.

| Categoría | Matiz | Token | Contraste |
|---|---|---|---|
| Arroces y legumbres | 126° | `#6ECF77` | 8.7:1 |
| Aves | 54° | `#CFC56E` | 9.5:1 |
| Bebidas | 216° | `#89A6D2` | 6.7:1 |
| Carnes | 36° | `#CFA86E` | 7.6:1 |
| Desayunos y meriendas | 324° | `#CF6EA8` | 5.1:1 |
| Ensaladas | 162° | `#6ECFB1` | 9.0:1 |
| Entradas y picadas | 342° | `#CF6E8B` | 5.0:1 |
| Panes y masas | 90° | `#8FC954` | 8.5:1 |
| Pastas | 72° | `#B2C954` | 9.1:1 |
| Pescados y mariscos | 198° | `#89BCD2` | 8.1:1 |
| Postres | 306° | `#CF6EC5` | 5.3:1 |
| Salsas y aderezos | 234° | `#8990D2` | 5.6:1 |
| Sopas y caldos | 180° | `#89D2D2` | 9.7:1 |
| Tartas y empanadas | 108° | `#6CC954` | 8.1:1 |
| Verduras y guarniciones | 144° | `#6ECF94` | 8.8:1 |
| **Otros** | — | `#99907F` | 5.3:1 |

**`Otros` no tiene color.** Es la categoría comodín: darle un matiz la pondría al
mismo nivel que las demás, cuando lo que dice es "todavía no sabemos".

#### Cómo se agrega una categoría

Agregar una categoría es crear una carpeta en Drive, así que el sistema tiene que
aguantarlo sin que nadie toque nada.

- La paleta es **un mapa del slug de la carpeta al color**, escrito a mano. No se
  deriva de un hash ni de la posición alfabética: si dependiera de la posición,
  agregar una categoría le cambiaría el color a todas las que van después, y la
  posición de cada una es justo lo que se aprende.
- Hay **cuatro colores de reserva** sin asignar, para las próximas cuatro
  categorías: `#9E6ECF` (270°), `#BB6ECF` (288°), `#CFB86E` (45°) y `#89C7D2`
  (189°). Los dos primeros rompen la regla 2 y los dos últimos bajan la
  separación local a 9°: con quince colores el círculo ya está repartido, y para
  cuando haga falta una decimosexta categoría la identidad va a estar establecida
  y una vecindad más cerrada no la rompe.
- **Una categoría sin entrada en el mapa usa `#99907F`**, el mismo neutro que
  `Otros`, y no rompe nada.

#### Dónde se usa el color, y dónde no

| Sí | No |
|---|---|
| El borde del tile en la grilla del Recetario | El fondo entero de una pantalla |
| El bloque de color detrás de la categoría en la línea de contexto de una tarjeta | El texto de la receta |
| El placeholder de foto (§6.2) | Los controles: los botones son siempre `--acento` |

**El color identifica, no describe.** Lo que describe es la foto de la categoría,
que se reconoce sin memorizar nada.

---

## 3. Tipografía

### 3.1 La familia

`[cambiada en el Hito 11]` **La fuente del sistema**, sin webfont:

```css
--tipo: system-ui, -apple-system, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, sans-serif;
```

Una sola familia para la interfaz y el contenido (`brand-identity.md` §2.6).

**Por qué:** un webfont es un pedido de red externo en una PWA que hoy no tiene
ninguno, y empaquetarlo son ~100 KB en `assets/` que el service worker tiene que
cachear. La fuente del sistema no cuesta nada, nunca falla y nunca provoca un
salto de texto al cargar.

**Qué se pierde, dicho sin disimulo:** la primera versión de este documento
elegía IBM Plex Sans porque es humanista, y ese carácter era lo que la tipografía
aportaba a *doméstico*. En Android la fuente del sistema es Roboto, que es
neogrotesca: correcta y neutra. **La calidez pasa a depender enteramente del
color** —los neutros cálidos y la arcilla—, así que esos tokens dejan de tener
margen para enfriarse.

**Cifras tabulares:** se piden con `font-variant-numeric: tabular-nums`, que
Roboto, SF y Segoe soportan. Es lo que alinea las cantidades en columna.

### 3.2 La escala

Base 16 px, razón 1.2, redondeada a valores enteros.

| Token | Tamaño | Interlínea | Peso | Uso |
|---|---|---|---|---|
| `--txt-micro` | 12 px | 1.4 | 400 · 600 | En 400, la fecha del borrador y la fuente; en 600, los contadores. **Solo datos y referencia —la ayuda de formato—, nunca prosa.** `[del 2026-09-12: decía 500, que ningún texto usaba]` |
| `--txt-chico` | 14 px | 1.45 | 400 | La línea de contexto de una tarjeta, las etiquetas de metadato. |
| `--txt-base` | 16 px | 1.5 | 400 | La interfaz. El piso de la restricción §1. |
| *base fuerte* | 16 px | 1.3 | 600 | `[del 2026-09-12]` El nombre de un ítem de lista —tarjeta, borrador—, los botones y el título del encabezado chico. No es un token aparte: es `--txt-base` en 600, y se nombra porque es el estilo más repetido de la app. |
| `--txt-lectura` | 18 px | 1.6 | 400 | **El cuerpo de la receta abierta.** Descripción, pasos, notas, ingredientes. |
| *título de sección* | 18 px | 1.3 | 600 | `[del 2026-09-12: era --txt-titulo-s, 20 px]` El encabezado de una ficha —«Ingredientes», «Cuenta»— y el nombre de una variación. Es `--txt-lectura` en 600: se separa del cuerpo por peso, divisor y aire, no por tamaño. En 20 competía con el título de la receta, a una razón de 1.2 con el mismo peso. `--txt-titulo-s` queda definido en `tokens.css` y sin uso. |
| `--txt-titulo` | 24 px | 1.25 | 600 | El título de las pantallas de primer nivel —Recetario, Borradores, Ajustes—, en el encabezado; y el nombre del objeto de una pantalla de detalle —la receta, el borrador—, en el cuerpo. |
| `--txt-cocina` | 22 px | 1.65 | 400 | El cuerpo en modo cocina. |
| `--txt-cocina-titulo` | 28 px | 1.3 | 600 | El encabezado de sección en modo cocina (§3.3). **Todavía sin aplicar:** los grupos y los tramos en cocina van en 16, mayúsculas y `--fg-2`, hasta la prueba a 50 cm (`plan/BACKLOG.md` §4). |

**Interlínea alta en lectura y en cocina** —1.6 y 1.65— porque en las dos hay que
volver a encontrar el renglón después de mirar para otro lado.

**Dónde va el título de una pantalla** `[del 2026-09-12]`. Las pantallas de primer
nivel —las del menú lateral— lo llevan grande en el encabezado. Las de detalle llevan
el encabezado chico, en *base fuerte*, y si tienen un objeto propio, su nombre grande en
el cuerpo. **Categoría es de detalle y no tiene objeto propio**: su nombre queda en el
encabezado chico, como el de Borrador y el del Editor.

### 3.3 La escala de cocina

El modo cocina es **el único lugar donde la escala cambia**, y cambia porque la
distancia de lectura cambia.

| Qué | Fuera de cocina | En cocina | Factor |
|---|---|---|---|
| Cuerpo | 18 px | **22 px** | ×1.22 |
| Encabezado de sección | 18 px | **28 px** | ×1.56 · *sin aplicar* (§3.2) |
| Área táctil | 48 px | **64 px** | ×1.33 |
| Espaciado entre ítems | 12 px | **20 px** | ×1.67 |

**El espaciado crece más que la letra**, y es deliberado: a 50 cm lo que hace
perder el renglón no es que la letra sea chica, es que los renglones estén juntos.

**Las cantidades usan cifras tabulares** y van en `--fg` con peso 600; el nombre
del ingrediente va en `--fg` con peso 400. La distinción es de peso, no de color:
un color distinto para la cantidad la convertiría en un dato secundario, y en
cocina es el dato principal.

---

### 3.4 Iconografía

**Un set de trazo existente** —Lucide o equivalente—, no íconos propios. Trazo de
1.5 px, color heredado del texto que acompañan, y dos tamaños:

| Token | Valor | Dónde |
|---|---|---|
| `--ico` | 20 px | En toda la app. |
| `--ico-cocina` | 24 px | Solo en modo cocina. |

**Los íconos son funcionales, nunca decorativos.** Hay exactamente diez en la
app: volver, buscar, ajustes, borradores, descartar, editar, borrar, mantener la
pantalla encendida, y las dos posiciones del conmutador de cocina —una zanahoria
para *Ingredientes* y una lista numerada para *Pasos*, al lado de la palabra
`[del 2026-09-12]`—.

**Regla dura: ningún ícono va solo si hay lugar para la palabra.** El ícono solo
se permite donde el espacio no da —el encabezado, donde "Volver" y "Ajustes" no
entran juntos— y ahí lleva su etiqueta accesible. En cualquier botón con ancho
propio va la palabra, con o sin ícono al lado.

**Por qué de trazo y no relleno:** el relleno pesa como un bloque de color, y el
color en esta app pertenece al contenido.

---

## 4. Espaciado, radios y borde

### 4.1 Espaciado

Base **4 px**. Solo estos valores:

| Token | Valor | Uso típico |
|---|---|---|
| `--e-1` | 4 px | Entre una etiqueta y su valor. |
| `--e-2` | 8 px | Entre controles. El mínimo de la restricción §1. |
| `--e-3` | 12 px | Padding de una tarjeta miniatura; entre ítems de una lista densa. |
| `--e-4` | 16 px | Padding de una ficha; margen lateral de la pantalla. |
| `--e-5` | 24 px | Entre fichas. |
| `--e-6` | 32 px | Entre secciones de la receta abierta. |
| `--e-7` | 48 px | El aire del final del scroll. |
| `--e-cocina` | 20 px | **Solo en modo cocina:** la separación entre ingredientes y entre pasos. |

`[--e-cocina agregado en el Hito 9]` No estaba, y al mockupear el modo cocina hizo
falta: la escala de §3.3 pide 20 px de separación y ninguno de los siete valores
de la escala base da eso. Es la única excepción, y existe porque el modo cocina
es la única escala distinta del sistema.

**Densidad, según el Hito 6:** las listas usan `--e-3`, la receta abierta usa
`--e-5` y `--e-6`. Se recorren cientos de recetas y se lee una sola.

### 4.2 Radios

| Token | Valor | Uso |
|---|---|---|
| `--r-chico` | 4 px | Chips, el bloque de color de categoría. |
| `--r-medio` | 8 px | Controles: botones, campos. |
| `--r-ficha` | 12 px | Las fichas y las tarjetas. |
| `--r-foto` | 8 px | La foto y el placeholder de una tarjeta. |

**Nada es circular ni de radio completo.** Un chip con `border-radius: 999px` es
la píldora de Material, que está descartada.

### 4.3 Borde

Un solo grosor: **1 px, opaco**. `--borde` para las fichas, `--borde-fuerte`
para los controles y los separadores internos.

**No hay sombras.** No existe un token de elevación
(`brand-identity.md` §2.4).

---

## 5. Motion

**Casi nada se mueve.** El sistema tiene exactamente tres transiciones:

| Qué | Duración | Curva |
|---|---|---|
| Cambio de estado de un control (presionado, foco) | 120 ms | `ease-out` |
| Aparición de un aviso | 160 ms | `ease-out` |
| Cambio de posición del conmutador de cocina | 140 ms | `ease-out` |
| Giro del indicador de carga | 900 ms, en bucle | lineal |

**Todo lo demás es instantáneo.** No hay transiciones de pantalla, ni skeletons
que pulsan, ni nada que entre solo.

### 5.1 El indicador de carga

Un **spinner** de 24 px en `--fg-3`, centrado en el lugar donde va a aparecer el
contenido — nunca una pantalla de carga completa.

Es la única animación en bucle del sistema, y existe porque un bloque quieto y
vacío no se distingue de un bloque vacío de verdad.

**El reindexado no usa spinner:** usa barra de progreso, porque ahí hay un número
que decir (`E05-Cimientos.md` C05.5.2). La regla es esa — con número, barra; sin
número, spinner.

**`prefers-reduced-motion: reduce` elimina las transiciones**, y todo pasa a ser
instantáneo. El spinner sobrevive: es lo único que informa que algo está pasando. No hay ninguna información que dependa del movimiento.

---

## 6. Componentes core

Los del Hito 6, con tokens aplicados. Quince: el último salió de mockupear.

### 6.1 Tarjeta miniatura

```
┌────────────────────────────────────────┐  --surface, borde 1px --borde
│ ┌──────┐  Milanesas napolitanas        │  --r-ficha, padding --e-3
│ │ foto │  ▪ Carnes · 40 min        ○   │
│ └──────┘                               │
└────────────────────────────────────────┘
```

| Parte | Token |
|---|---|
| Foto o placeholder | 56 × 56 px, `--r-foto` |
| Título | `--txt-base`, peso 600, `--fg` |
| Línea de contexto | `--txt-chico`, `--fg-2` |
| El cuadrito `▪` de categoría | 8 × 8 px, `--r-chico`, el color de la categoría |
| Marca de incompleta `○` | `--fg-3`, ver §6.5 |
| Motivo, en resultados por ingrediente | `--txt-chico`, `--acento` |

**Alto total: 80 px.** Entran ocho o nueve por pantalla, que es lo que la
decisión de densidad del Hito 6 pedía.

**Estados:** normal · presionada (`--surface-alta`) · sin foto (§6.2) ·
incompleta (§6.5).

### 6.2 Placeholder de foto

`[cierra la decisión pendiente del Hito 6]`

**La foto de la categoría, oscurecida, con el color de la categoría encima al
25 %.**

- Ocupa **exactamente el mismo espacio que una foto** —56 × 56 px en la tarjeta,
  el ancho completo en la receta— para que la lista no se desalinee.
- **Es el caso normal, no la excepción:** casi ninguna receta va a tener imagen,
  así que tiene que verse deliberado. Un bloque de color con un glifo lo es; un
  ícono gris de imagen rota no.
- Aporta información: **dice de qué categoría es la receta** sin ocupar una línea
  de texto, y con la misma imagen que esa categoría tiene en la grilla, así que
  se reconoce sin leer.
- `[observado en el Hito 9]` **Dentro de una lista de categoría no aporta nada**,
  porque las veinte filas comparten categoría. Se conserva igual: su función ahí
  es que la fila no se desalinee el día que una receta tenga foto propia. Donde sí
  informa es en los resultados de búsqueda, que mezclan categorías.
- **No necesita ningún asset nuevo:** reutiliza los `.webp` de categoría que ya
  existen. Una categoría sin foto usa su color plano; una sin color usa
  `#99907F`.
- Una `foto` de receta cuya URL no carga cae acá, sin error visible.

**Por qué oscurecida y teñida, y no la foto tal cual:** todas las recetas de una
categoría comparten el placeholder, así que tiene que leerse como fondo y no
competir con las tarjetas que sí tienen foto propia.

**Por qué no la inicial de la categoría:** las abreviaturas hay que aprenderlas,
y eso ya está descartado.

### 6.3 Foto de la receta

Va **dentro de la primera ficha** de la receta abierta, no a sangre en la
pantalla: la estructura es de ficha y una foto a sangre la rompe.

| Qué | Valor |
|---|---|
| Relación | 16:9, recortada al centro |
| Alto máximo | **200 px** |
| Radio | `--r-foto` |
| Ancho | El de la ficha, menos su padding |

**Por qué 200 px de tope:** más alto empuja el título fuera de la pantalla, y el
título es lo que confirma que abriste la receta que querías.

**Sin `foto`:** el bloque no se dibuja y la receta empieza por el título. **No**
se usa el placeholder acá — a este tamaño, un bloque de color teñido ocuparía
200 px para no decir nada. El placeholder es de las listas, donde su función es
que la fila no se desalinee.

### 6.4 Tile de categoría

```
┌──────────────┐   La foto ocupa el tile entero
│░░░░░░░░░░░░░░│   Borde 1px del color de la categoría
│░░░  foto  ░░░│   Nombre abajo, sobre un degradado a --bg
│░░░░░░░░░░░░░░│
│ Carnes       │
└──────────────┘
```

| Parte | Token |
|---|---|
| Borde | 1 px, el color de la categoría |
| Radio | `--r-ficha` |
| Nombre | `--txt-chico`, peso 600, `--fg`, sobre el velo |
| Velo | Degradado a `--velo` al 96 % desde abajo, alto `--e-6` |

`[el velo, precisado en el Hito 9; tokenizado en el 11]` Al mockupear con las dieciséis fotos reales se
vio que sobre las claras —la paella, la ensalada— un velo suave deja el nombre sin
contraste. El velo llega a .96 abajo y sube hasta `--e-6`: el nombre siempre
cumple 4.5:1, sea cual sea la foto.
| Grilla | **2 columnas** en teléfono, 4 en pantalla ancha, `--e-3` de separación |

**Dos columnas y no tres:** con tres, el tile mide 110 px y la foto de categoría
—que es lo que hace que se reconozca sin leer— deja de distinguirse. Entran menos
de un vistazo y hay que scrollear, y eso está aceptado: la posición de cada
categoría se aprende igual porque el orden es alfabético y estable.

**Es el único lugar donde el color de la categoría es el borde y no un cuadrito**,
porque es el único donde la categoría es el contenido y no un dato de otra cosa.

**Sin foto:** el tile es el color plano de la categoría al 20 % sobre
`--surface`, con el nombre. No se rompe.

### 6.5 Marca de incompleta

**Un círculo de 12 px a medio llenar** `[reescrita el 2026-09-12]`: 1,5 px de
borde en `currentColor` y la mitad izquierda rellena del mismo color
—`linear-gradient(to right, currentColor 50%, transparent 50%)`—. **En
`--acento`**, salvo donde el contexto ya tiene un color propio.

Es la misma marca en los tres lugares donde el dato se muestra, y no hay ningún
otro dibujo para decir lo mismo:

| Dónde | Cómo |
|---|---|
| **Tarjeta de la lista** | Sólo la marca, al final de la línea de contexto. Sin texto, así que se nombra para el lector de pantalla. |
| **Receta abierta** | Un chip (§6.10) que dice *Incompleta*, el primero de la fila de tags. Tocable, abre el editor (`E03-LeerYCocinar.md` C03.1.3). |
| **Editor** | Dentro de la posición *Incompleta* del conmutador (§6.16), en el color del botón y no en el acento. |

- **Nunca `--error` y nunca amarillo.** No es un problema: la receta funciona, le
  falta algo.
- **El acento acá no rompe la regla de que el acento es de las acciones:** donde
  la marca es más visible —la receta abierta— es efectivamente una acción, la
  única de su fila. En la tarjeta hereda ese color para que la marca sea una
  sola, aprendida una vez.

**Por qué a medio llenar y no un círculo vacío:** el aro vacío de la 2.0 no decía
nada. Al lado de un título se leía como viñeta, y en el conmutador, como el
símbolo de apagado. Medio relleno dice "hecha a medias", que es exactamente el
estado. Un signo de exclamación lee como advertencia y un triángulo como error;
un lápiz nombra la acción, no el estado, y se repetiría con el botón *Editar* que
está a centímetros.

### 6.6 Ficha

El contenedor de todo. `--surface`, borde 1 px `--borde`, `--r-ficha`, padding
`--e-4`.

Dentro, un encabezado opcional en *título de sección* (18 / 600, §3.2) con un separador de 1 px
`--borde-fuerte` debajo.

**Una ficha no lleva otra ficha adentro** salvo en el editor, donde el bloque
anidado usa `--surface-alta` y no lleva borde.

### 6.7 Botón

| Variante | Fondo | Texto | Borde |
|---|---|---|---|
| **Primario** | `--acento` | `--bg` | — |
| **Secundario** | transparente | `--fg` | 1 px `--borde-fuerte` |
| **Peligro** | transparente | `--error` | 1 px `--error` |

Alto 48 px (64 en cocina), padding lateral `--e-4`, `--r-medio`,
`--txt-base` peso 600.

**Variante compacta: 40 px de alto.** `[agregada en el Hito 9]` Existe para un
solo lugar: **un botón dentro del encabezado de pantalla**, que mide 56 px y no
puede contener uno de 48 con aire alrededor. Es el caso de *Guardar* en el
editor, *Salir* en cocina y *Descartar* en el borrador. **Su área táctil sigue
siendo de 48 px**, porque el padding vertical del encabezado la completa. Fuera
del encabezado no se usa.

**Estados:** normal · presionado (fondo un escalón más claro) · foco (contorno de
2 px `--acento` a 2 px de separación) · trabajando (el texto se reemplaza por el
verbo en gerundio: *"Guardando"*) · deshabilitado (`--fg-3`, sin fondo).

**No hay botón flotante.** Está vetado desde el Hito 6.

**Un logo ajeno adentro de un control no sigue la regla de trazo.**
`[agregada el 2026-09-12]` Los íconos del sistema son de trazo, 1,5 px,
`currentColor` (§3.4). El logo de Drive del link al `.md` (`E03-LeerYCocinar.md`
C03.1.2b) es el favicon de Google, a color y relleno: redibujarlo de trazo lo
vuelve irreconocible, que es lo único que el logo aporta. La regla es que un
logo de un tercero se usa **tal como lo publica el tercero**, a 16 px, **y viaja
con la app** —en el repo, no pedido al servidor del tercero: una dependencia de
red para 513 bytes es una dependencia de más—, y se
compensa bajándole el peso al resto del control —texto en `--txt-chico` y
`--fg-2`, sin caja— para que no pese más que los controles propios de al lado.

### 6.8 Aviso

Dos niveles, como fija `E05-Cimientos.md` C05.9.1.

| Nivel | Forma |
|---|---|
| **Con acción** | Ficha con fondo `--error-suave` y borde `--error`. El mensaje en `--fg`, el botón secundario a la derecha. Aparece donde ocurrió el problema. |
| **Sin acción** | Una línea de `--txt-chico` en `--fg-2`, sin fondo ni borde. Se acumula en Ajustes. |

Ninguno se cierra solo, ninguno lleva ícono y ninguno muestra el error crudo.

### 6.9 Campo de texto

`--surface-alta`, borde 1 px `--borde-fuerte`, `--r-medio`, padding `--e-3`,
alto mínimo 48 px, `--txt-base`.

**La casilla de verificación mide 22 px** `[agregada en el Hito 9]`, con
`--acento` de color y un área táctil de 48 px que incluye su etiqueta: la etiqueta
es parte del control, no un texto al lado. **Hoy no la usa ninguna pantalla**
`[2026-09-12]`: era el control de la completitud y lo reemplazó el conmutador de
dos posiciones (§6.16). Queda definida porque el sistema la va a necesitar, no
porque esté puesta en algún lado.

Etiqueta arriba en `--txt-chico` y `--fg-2`. Foco: borde `--acento` de 2 px.
Placeholder en `--fg-3`, y **nunca reemplaza a la etiqueta**.

Los campos de contenido —ingredientes, preparación, notas— son `textarea` que
crecen con el contenido, con un mínimo de tres renglones.

### 6.10 Chip

Para los tags y los metadatos de la receta.

Fondo un tono por encima de `--surface-alta` `[subido el 2026-09-12]` —
`color-mix(in srgb, var(--surface-alta) 86%, var(--fg))`—, borde 1 px
`--borde-fuerte`, `--r-chico`, padding `--e-1` `--e-2`, `--txt-chico`. Alto 32 px,
con área táctil de 48 px cuando es tocable.

**Por qué el tono subió:** con `--surface-alta` el chip desaparecía sobre los dos
fondos donde vive. En el editor comparte fondo con el campo de agregar un tag, y
la fila de tags puestos se leía como parte del campo; en la receta abierta se
funde con la ficha. Es el mismo chip en las dos pantallas: un tag se tiene que
ver igual donde se pone y donde se lee.

**Activo** —un tag aplicado como filtro— usa `--acento-suave` de fondo, borde
`--acento` y texto `--acento`, y muestra una `×`.

**Removible** —un tag del editor— `[agregado el 2026-09-12]` es el chip normal
más una `×` de trazo de 14 px en `currentColor` a 70 % de opacidad, y el chip
entero es el botón que lo saca. No hay una cruz con su propia área táctil
adentro: a 32 px de alto no entra un segundo blanco de 48. Debajo de la fila de
chips van `--e-3` de aire antes del campo de agregar.

**Pendiente** —el estado de una receta incompleta, en la receta abierta—
`[agregado el 2026-09-12]` usa los mismos valores que **Activo**, con la marca de
§6.5 adelante y el texto *Incompleta*. Son clases distintas porque significan
cosas distintas: uno es un filtro puesto, el otro un estado del contenido.

**Un tag reservado no llega a ser chip:** el editor lo rechaza al agregarlo y lo
dice en una línea de `--txt-chico` en `--error`, sin caja ni botón
(`E04-Corregir.md` C04.2.1b).

### 6.11 Ítem de ingrediente

```
 muzzarella                    200 g
 └──── nombre, peso 400 ────┘  └tab┘
```

**El nombre primero, a la izquierda; la cantidad a la derecha**, alineada a la
derecha y en cifras tabulares, peso 600. Los dos en `--fg`. Es el orden en que
está escrito el ítem en el `.md` (`E05-Cimientos.md` C05.1.3).

Un ingrediente sin cantidad ocupa el ancho entero: no queda un hueco a la derecha
señalando lo que falta.

**Por qué la cantidad a la derecha y no pegada al nombre:** en cocina se leen las
cantidades en columna —"¿cuánta muzzarella?"— y una columna alineada se recorre
de un vistazo. El nombre queda del lado donde empieza la lectura.

**Nombres largos:** el nombre puede ocupar dos renglones; la cantidad se mantiene
arriba a la derecha, alineada con el primero.

Los grupos —los `###` del `.md`— son `--txt-chico` en `--fg-2`, en versalitas,
con `--e-4` arriba.

### 6.12 Encabezado de pantalla

Alto 56 px, fondo `--bg`, borde inferior 1 px `--borde`.

Volver a la izquierda como control de 48 px —no un chevron chico—, título al
medio en `--txt-base` peso 600, acciones a la derecha.

**No es pegajoso.** En modo cocina se va con el scroll, y **queda pegado solo el
conmutador**: 64 px fijos arriba en vez de 120.

**Las barras pegadas se separan con un borde, no con un degradado.**
`[precisada en el Hito 9]` Al mockupear se vio que un degradado sobre fichas deja
el contenido cortado a mitad detrás de él, que lee como un error de dibujo. Fondo
`--bg` opaco y 1 px de `--borde` arriba — la misma regla que el resto del sistema:
los límites se marcan con borde. Volver y salir se recuperan
scrolleando hacia arriba, o con el gesto del sistema.

### 6.13 Paso de la preparación, en cocina

`[agregado en el Hito 9]` Tres estados, y ninguno persiste (`E03-LeerYCocinar.md`
C03.2.4).

| Estado | Cómo se ve |
|---|---|
| **Normal** | Número en `--fg-3`, texto en `--fg`, separador de 1 px abajo. |
| **Actual** | Fondo `--acento-suave`, `--r-medio`, sin separador. Es dónde estás. |
| **Hecho** | El número se reemplaza por un check y el texto pasa a `--fg-3`. |

**Un paso hecho no se tacha.** A 22 px una línea cruzando el renglón entero lo
vuelve difícil de leer, que es lo contrario de lo que el modo cocina busca. La
atenuación alcanza para distinguirlo, y deja el texto disponible por si hay que
volver.

### 6.14 Conmutador de cocina

Dos posiciones del mismo ancho, pegado arriba, alto 64 px.

Inactiva: `--surface`, texto `--fg-2`. Activa: `--surface-alta`, texto `--fg`,
con una barra de 3 px de `--acento` abajo.

`--txt-base` peso 600. La transición de la barra dura 140 ms.

### 6.15 Entrada de borrador

Ficha de `--e-3` de padding: título en `--txt-base` peso 600, fuente en
`--txt-chico` `--fg-2` cortada con elipsis a una línea, y la fecha en
`--txt-micro` `--fg-3` a la derecha.

### 6.16 Conmutador de dos posiciones

`[agregado el 2026-09-12]` Dos botones del mismo ancho, uno al lado del otro con
`--e-2` de separación, cada uno de 48 px de alto y `--r-medio`. Una sola posición
es verdadera. Hoy lo usa un solo control, el de completitud del editor
(`E04-Corregir.md` C04.4.1).

| Posición | Fondo | Texto | Borde |
|---|---|---|---|
| **Sin elegir** | `--surface-alta` | `--fg-2` | 1 px `--borde` |
| **Elegida** | `--fg` | `--bg` | 1 px `--fg` |
| **Deshabilitada** | transparente | `--fg-3` | 1 px `--borde` |

`--txt-base` peso 600, centrado. Al pasar por encima, una posición sin elegir
sube su texto a `--fg`.

**La posición elegida se marca invirtiendo, no con el acento.** `--acento` está
reservado para acciones —lo que se toca para que algo pase— y para el ítem activo
de la navegación. Un estado declarado no es una acción: pintarlo de acento lo
hace competir con el botón de guardar, que está a centímetros. La inversión es el
contraste más alto que tiene el sistema y no gasta un color semántico.

**Ningún estado del sistema se dibuja en `--error`.** Se probó *Incompleta* en
rojo y se leyó como que algo había fallado. Es la misma regla de la marca de
incompleta (§6.5): a la receta le falta algo, no está rota.

Una posición deshabilitada lleva debajo la leyenda de qué falta para habilitarla,
en `--txt-chico` `--fg-2` con interlineado 1,5 — un aviso sin acción (§6.8), no
un error.

**No es el conmutador de cocina (§6.14).** Aquél elige qué se mira y ocupa el
ancho pegado arriba; éste declara un estado y vive dentro de una ficha.

### 6.17 Menú lateral

`[agregado el 2026-09-12]` La navegación primaria de la app: Inicio —la pantalla
del Recetario, que no repite el nombre de la marca—, Borradores, Nueva receta y
Ajustes. Reemplaza a los accesos sueltos en el
encabezado de cada pantalla.

Panel de **260 px** de ancho, pegado a la izquierda y de alto completo.
`--surface`, borde derecho 1 px `--borde`, padding `--e-4`.

Arriba, el nombre de la app en `--txt-titulo` peso 600 con `--e-4` abajo. Después,
un ítem por destino: alto mínimo 48 px, `--r-medio`, ícono de trazo de `--ico` a
la izquierda con `--e-3` de separación, texto en `--fg` peso 600, y `--e-1` entre
ítems.

| Estado | Cómo se ve |
|---|---|
| **Normal** | Sin fondo, texto e ícono en `--fg`. |
| **Encima** | Fondo `--surface-alta`. |
| **Actual** | Fondo `--acento-suave`, texto e ícono en `--acento`. |

**Un ítem puede llevar un número a la derecha** —los borradores pendientes—: una
píldora de 20 px de alto mínimo, `--surface-alta`, borde 1 px `--borde-fuerte`,
`--txt-micro` peso 600 en `--fg-2`, con cifras tabulares. Es el mismo recurso que
el contador del tile de categoría (§6.4) y se dibuja sólo si hay algo que contar.

**Dos comportamientos según el ancho, un solo menú.** Abajo de 900 px es un cajón
que entra desde la izquierda en 200 ms, sobre un velo de `--velo` al 60 %, y se
abre con el botón de hamburguesa del encabezado; el velo lo cierra al tocarlo.
Desde 900 px queda fijo, el velo y la hamburguesa desaparecen, y el contenido se
corre 260 px. **Es sólo CSS:** la misma marca dibujada, una consulta de medios
decide. Con `prefers-reduced-motion` el cajón aparece sin transición.

**A la izquierda, también en teléfono.** Es de donde vienen los cajones en
Android, y el pulgar que lo abre es el mismo que toca la hamburguesa, que está
del mismo lado.

---

## 7. Layout

| Qué | Valor |
|---|---|
| Margen lateral en teléfono | `--e-4` |
| Ancho máximo de la columna | **680 px**, centrada |
| Ancho máximo del cuerpo de lectura | **62 caracteres** |
| Punto de quiebre de la grilla | 720 px: las grillas pasan de 2 a 4 columnas |
| Punto de quiebre del menú | 900 px: el menú lateral deja de ser cajón y queda fijo (§6.17) |

**No hay layout de escritorio propio.** Es la misma app, más ancha
(`E05-Cimientos.md` C05.10.1). El menú fijo desde 900 px no es una excepción: es
el mismo menú, dibujado igual, al que le sobra lugar para quedarse abierto.

---

## 8. Verificación

Una pantalla cumple el sistema si:

- [ ] No usa ningún color que no esté en §2.
- [ ] No usa ningún tamaño de texto que no esté en §3.2.
- [ ] No usa ningún espaciado que no esté en §4.1.
- [ ] No tiene sombras.
- [ ] Ningún control táctil mide menos de 48 px, ni de 64 px en cocina.
- [ ] Ningún texto de cuerpo baja de 16 px, ni de 18 px en la receta abierta.
- [ ] `--error` aparece solo en operaciones que fallaron, nunca en un estado del
      contenido.
- [ ] Ningún mensaje confirma un éxito.
- [ ] El estado vacío es una frase, sin ilustración.
