# Recetario — Design System

**Versión:** 2.5
**Fecha:** 2026-09-18
**Estado:** Vigente

> Los valores de este documento están implementados en `src/ui/tokens.css`
> —tokens y componentes del sistema— y `src/ui/base.css` —lo que es de cada
> pantalla—; los íconos, en `src/ui/iconos.ts`. Si el documento y esos archivos
> se contradicen, gana el código y se corrige acá.

---

## Sobre este documento

Los valores concretos con los que se implementa cualquier pantalla de Recetario.
**El criterio que los genera está en `brand-identity.md`;** acá están los
números.

Una pantalla que necesite un valor que no esté acá indica un hueco del sistema, y
el hueco se arregla en el sistema —`src/ui/tokens.css` y este documento—, no en
la pantalla.

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
| `--fg-3` | `#948A7A` | El texto tenue: fechas, contadores, la marca de borrador. | **4.9:1** |
| `--velo` | `#0C0A07` | Más oscuro que `--bg`. Solo bajo el nombre de un tile de categoría, como degradado. | — |

**`--fg-3` cumple 4.5:1 sin excepción:** es el piso de todo texto, también del
chico.

**Por qué `--fg` no es blanco puro:** sobre un fondo cálido, el blanco puro se ve
azul por contraste simultáneo, que es exactamente el gris azulado que la
identidad prohíbe.

### 2.2 Acento y semánticos

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--acento` | `#D98A5F` | Arcilla. La acción primaria, el foco, el tag activo. | **6.2:1** sobre `--surface` |
| `--acento-suave` | `#39291D` | El fondo de un elemento con el acento aplicado. | — |
| `--error` | `#D95F52` | **Solo para operaciones que fallaron.** | **4.6:1** |
| `--error-suave` | `#33191A` | El fondo del aviso con acción. | — |
| `--exito` | `#53DA6E` | **Solo el tilde con el que cierra el velo de escritura** (§6.17b). | **9.3:1** |

**`--exito` es el hermano verde del error:** la misma saturación y la misma
luminosidad, a 126° de matiz. Sobre el velo, que es donde se lo ve, da 10.7:1.
No es ninguno de los verdes de categoría —son de otra paleta y viven en otra
pantalla— y no se usa en ningún texto ni en ningún control: el éxito no se
escribe (`brand-identity.md` §3.2), se dibuja una sola vez y se va.

**No hay token de advertencia:** lo que en otro producto sería una advertencia
—un borrador— acá no es un problema y usa `--fg-3`.

**El acento y el error se tienen que distinguir de reojo:** una distancia
percibida (CIEDE2000) de al menos 12 entre los dos. La arcilla está a 14.6 del
error: más cerca, un botón primario se lee como error.

**Regla dura: el error es solo para errores y para lo destructivo.** Una receta
sin ingredientes, un archivo ignorado o una categoría vacía **nunca** usan
`--error`.

La excepción son los controles que borran algo —*Borrar* una receta, borrar una
categoría, *Sacar* una foto—, con la variante de peligro del botón (§6.7), y
el borde de la ficha que pide la confirmación. La operación **es** destructiva, y
es el único aviso que el usuario tiene antes de tocarla.

### 2.3 Los colores de categoría

Quince colores, uno por categoría, más un neutro para `Otros`.

**Reglas de la paleta:**

1. **Separación mínima de 18° de matiz**, y **una distancia percibida (CIEDE2000) de al menos 12 respecto del acento**. 18° es la distancia a la que dos colores se distinguen sin compararlos lado a lado, que es como se ven en una lista. La segunda regla existe porque el acento es de la app y una categoría no puede parecerse a un botón: por eso la serie arranca en 36° y deja libre el vecindario del acento. Se mide en distancia percibida y no en matiz porque la saturación también separa: la arcilla está a 15° de Carnes pero a 14.1 de distancia, porque Carnes es un beige apagado. Carnes es la más cercana.
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

Las categorías se crean y se editan desde la app —*Ajustes → Recetario →
Categorías*—, y una carpeta creada a mano en Drive aparece al reindexar.

- **El color y la foto son propiedades de la carpeta** en Drive
  (`appProperties`), así que renombrarla no los pierde. No se derivan de un hash
  ni de la posición alfabética: si dependieran de la posición, agregar una
  categoría le cambiaría el color a todas las que van después.
- **El color se guarda como clave de la paleta** —`carnes`, `aves`…— y se dibuja
  con el token `--cat-<clave>` de `src/ui/tokens.css`. Se elige entre los dieciséis
  de la tabla, en una grilla de muestras donde la elegida lleva un borde de 2 px
  en `--fg`; la foto se elige igual, entre las del catálogo.
- **Una categoría nueva arranca con el primer color de la paleta que nadie usa**,
  y con el neutro si ya están todos usados. Dos categorías pueden compartir color.
- **La tabla de las 16 predefinidas —nombre, clave de color y foto— vive en
  `src/categorias.ts`.** Una carpeta nueva toma su color y su foto de esa tabla
  sólo si su nombre coincide con una predefinida.
- **Una categoría sin color, o con una clave que la paleta no tiene, usa
  `#99907F`**, el mismo neutro que `Otros`, y no rompe nada.

#### Dónde se usa el color, y dónde no

| Sí | No |
|---|---|
| El borde del tile en la grilla del Recetario | El fondo entero de una pantalla |
| El cuadrito de 8 px antes de la categoría, en la línea de contexto de una tarjeta y de la receta | El texto de la receta |
| El placeholder de foto (§6.2) | Los controles: los botones son siempre `--acento` |

**El color identifica, no describe.** Lo que describe es la foto de la categoría,
que se reconoce sin memorizar nada.

---

## 3. Tipografía

### 3.1 La familia

**La fuente del sistema**, sin webfont:

```css
--tipo: system-ui, -apple-system, 'Segoe UI', Roboto,
        'Helvetica Neue', Arial, sans-serif;
```

Una sola familia para la interfaz y el contenido (`brand-identity.md` §2.6).

**Por qué:** un webfont es un pedido de red externo en una PWA que hoy no tiene
ninguno, y empaquetarlo son ~100 KB en `assets/` que el service worker tiene que
cachear. La fuente del sistema no cuesta nada, nunca falla y nunca provoca un
salto de texto al cargar.

**El costo:** en Android la fuente del sistema es Roboto, que es neogrotesca:
correcta y neutra, no aporta nada a *doméstico*. **La calidez depende enteramente
del color** —los neutros cálidos y la arcilla—, así que esos tokens no tienen
margen para enfriarse.

**La interlínea base es 1.5**, declarada en `body`: lo que no declara la suya no
cae en la `normal` del navegador.

**El PDF compartido no puede usar la fuente del sistema** y lleva Inter embebida
(§6.23).

**Cifras tabulares:** se piden con `font-variant-numeric: tabular-nums`, que
Roboto, SF y Segoe soportan. Es lo que alinea las cantidades en columna.

### 3.2 La escala

Base 16 px, razón 1.2, redondeada a valores enteros.

| Token | Tamaño | Interlínea | Peso | Uso |
|---|---|---|---|---|
| `--txt-micro` | 12 px | 1.4 | 400 · 600 | En 400, la fuente; en 600, los contadores. La versión, al pie del menú lateral. **Solo datos y referencia —la ayuda de formato—, nunca prosa.** |
| `--txt-chico` | 14 px | 1.45 | 400 · 600 | En 400, la línea de contexto de una tarjeta, las etiquetas de los campos, el chip y los rótulos de grupo en mayúsculas. En 600, el nombre del tile, el valor de un botón de duración y el conmutador de orden. |
| `--txt-base` | 16 px | 1.5 | 400 | La interfaz, y las notas de una oración (§6.8): son prosa, y la prosa no baja de 16. El piso de la restricción §1. |
| *base fuerte* | 16 px | 1.3 | 600 | El nombre de un ítem de lista —tarjeta, fila de categoría—, los botones y el título del encabezado chico. No es un token aparte: es `--txt-base` en 600, y se nombra porque es el estilo más repetido de la app. |
| `--txt-lectura` | 18 px | 1.6 | 400 | **El cuerpo de la receta abierta.** Descripción, pasos, notas, ingredientes. |
| *título de sección* | 18 px | 1.3 | 600 | El encabezado de una ficha —«Ingredientes», «Cuenta»— y el nombre de una variación. Es `--txt-lectura` en 600: se separa del cuerpo por peso, divisor y aire, no por tamaño, para no competir con el título de la receta. |
| `--txt-titulo` | 24 px | 1.25 | 600 | El título de las pantallas de primer nivel —Recetario, Ajustes—, en el encabezado; y el nombre del objeto de una pantalla de detalle —la receta—, en el cuerpo. También el nombre de la app arriba del menú lateral y el de la pantalla de conexión. |
| `--txt-cocina` | 22 px | 1.65 | 400 | El cuerpo en modo cocina. |
| `--txt-cocina-titulo` | 28 px | 1.3 | 600 | El encabezado de sección en modo cocina (§3.3). **Sin aplicar:** los grupos y los tramos en cocina van en 16, mayúsculas y `--fg-2`. El token se aplica sólo si cocinando a 50 cm reales esos rótulos no alcanzan. |

**Interlínea alta en lectura y en cocina** —1.6 y 1.65— porque en las dos hay que
volver a encontrar el renglón después de mirar para otro lado.

**Dónde va el título de una pantalla.** Las pantallas de primer
nivel —las del menú lateral— lo llevan grande en el encabezado. Las de detalle llevan
el encabezado chico, en *base fuerte*, y si tienen un objeto propio, su nombre grande en
el cuerpo. **Categoría es de detalle y no tiene objeto propio**: su nombre queda en el
encabezado chico, como el del Editor. Borradores, que es una lista por tag,
lleva el mismo encabezado chico que las demás listas (§6.12).

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

**De trazo, con la grilla de Lucide** —`viewBox` de 24—: los que Lucide tiene se
toman de ahí, y los que no —el tacho, los relojitos— se dibujan con el mismo
trazo. Viven en `src/ui/iconos.ts` como constantes, sólo el contenido del SVG: el
trazo de 1.5 px, el `fill: none` y el color heredado del texto los pone el CSS
del lugar donde se dibujan, así que un ícono se ve igual esté donde esté. Dos
tamaños de base:

| Token | Valor | Dónde |
|---|---|---|
| `--ico` | 20 px | En toda la app. |
| `--ico-cocina` | 24 px | Solo en modo cocina. |

Adentro de otro componente el ícono se achica a su medida: 16 px en la marca de
la tarjeta, el botón de tag especial, el conmutador de orden y la flecha del
carrusel; 15 px pegado a la duración en una línea de contexto; 14 px en un chip;
24 px en el botón de duración.

**Los íconos son funcionales, nunca decorativos.** `iconos.ts` tiene
**veintitrés**: dieciocho en `ICO` y los cinco relojitos de
`ICONO_DE_DURACION`.

| Ícono | Dónde |
|---|---|
| `volver` | El volver del encabezado, el de cocina y el de la búsqueda; y la flecha izquierda del carrusel. |
| `chevron` | La flecha derecha del carrusel. |
| `buscar` | La caja de búsqueda. |
| `menu` | La hamburguesa que abre el menú lateral, con el contador de borradores encima. |
| `casa`, `bandeja`, `mas`, `ajustes` | Los destinos del menú lateral: Inicio, Borradores, Nueva receta y Ajustes. |
| `lapiz` | *Editar*, en el pie de la receta. |
| `compartir` | *Compartir*, en el encabezado de la receta. |
| `estrella` | Favorito: en el encabezado de la receta (§6.22), en la marca de la tarjeta, en el chip y en el botón del editor. |
| `marcador` | El tag *probar*. |
| `calendario` | El tag *menú diario*. |
| `tacho` | La acción destructiva del editor: *Borrar receta*. |
| `cerrar` | La cruz: la del chip removible del editor, la que limpia la búsqueda y la que saca una receta de una comida del plan. |
| `camara` | *Cámara*, en la ficha *Fotos* del editor (§6.25), y *Subir foto* al elegir la de una categoría (§6.4). |
| `imagen` | El botón que pone en una línea una foto que ya está en el depósito (§6.9b). Es una foto sacada y no la cámara: no agrega ninguna. |
| `portada` | La marca de la foto que es la portada, en la fila de fotos del editor (§6.25). Una ficha con un señalador adentro; el señalador va relleno con `currentColor`. **No es una estrella:** en esta app la estrella es favorito. |
| `enElTexto` | La marca de la foto que está puesta en un paso o un ingrediente (§6.25). Tres renglones de largo distinto. |
| `link` | *Por URL*, en la fila de fotos (§6.25): agregar una foto pegando su dirección. Dos eslabones. |
| `sol` | Mantener la pantalla encendida, en el encabezado de cocina. |
| `zanahoria`, `listaNumerada` | Las dos posiciones del conmutador de cocina —*Ingredientes* y *Pasos*—, al lado de la palabra. |
| Los cinco relojitos | Uno por valor de la duración, el mismo mapa en el editor (§6.18), la tarjeta, la receta, la búsqueda, el filtro (§6.19) y el orden (§6.20). |

**Dos dibujos no están en `iconos.ts` porque son CSS:** el medio círculo de
*borrador* (§6.5) —que hace de ícono del cuarto tag especial— y el chevron del
desplegable (§6.9).

**Los relojitos:** una esfera con la aguja y el recorrido recién hecho, tenue
al 30 % de opacidad, en las posiciones de `~15 min`, `~30 min` y `~60 min`;
`>60 min` es la esfera de `~60 min`, más chica, con un cuarto de aro por
afuera que termina en flecha; `>1 día` son dos relojes, uno detrás del otro,
donde el de adelante corta al de atrás con un disco del color del fondo
—`--fondo-reloj`, que cada lugar donde se dibuja un relojito redefine—.

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

**`--e-cocina` es la única excepción a la escala:** §3.3 pide 20 px de separación
y ninguno de los siete valores de la base lo da. Existe porque el modo cocina es
la única escala distinta del sistema.

**Densidad:** las listas usan `--e-3`, la receta abierta usa
`--e-5` y `--e-6`. Se recorren cientos de recetas y se lee una sola.

### 4.2 Radios

| Token | Valor | Uso |
|---|---|---|
| `--r-chico` | 4 px | Chips, el bloque de color de categoría. |
| `--r-medio` | 8 px | Controles: botones, campos. |
| `--r-ficha` | 12 px | Las fichas y las tarjetas. |
| `--r-foto` | 8 px | La foto y el placeholder de una tarjeta. |

**Ningún control con texto es de radio completo.** Un chip con `border-radius:
999px` es la píldora de Material, que está descartada. Lo redondo es lo que no
lleva palabras: los contadores (§6.4, §6.17), la flecha del carrusel (§6.21), la
marca de borrador (§6.5) y las muestras de color de una categoría.

### 4.3 Borde

Un solo grosor: **1 px, opaco**. `--borde` para las fichas, `--borde-fuerte`
para los controles y los separadores internos.

**No hay sombras.** No existe un token de elevación
(`brand-identity.md` §2.4).

---

## 5. Motion

**Casi nada se mueve.** El sistema tiene cuatro movimientos:

| Qué | Duración | Curva |
|---|---|---|
| El menú lateral que entra y sale, y su velo | 200 ms | la del navegador |
| El desplazamiento de un carrusel al tocar una flecha | el del navegador (`scroll-behavior: smooth`) | — |
| La estrella de favorito que se llena mientras Drive contesta (§6.22) | 2 s, en bucle | lineal |
| Giro del indicador de carga | 900 ms, en bucle | lineal |

**Todo lo demás es instantáneo:** el cambio de estado de un control, la aparición
de un aviso, el conmutador de cocina. No hay transiciones de pantalla, ni
skeletons que pulsan, ni nada que entre solo. El degradé y las flechas del
carrusel aparecen y desaparecen atados a la posición del scroll, no al tiempo.

### 5.1 El indicador de carga

Un **spinner** de 24 px en `--fg-3`, centrado en el lugar donde va a aparecer el
contenido — nunca una pantalla de carga completa. Existe porque un bloque quieto
y vacío no se distingue de un bloque vacío de verdad.

**El velo de escritura no usa spinner: usa la olla** (§6.17b). Son las dos
únicas animaciones en bucle del sistema, y se reparten así: el spinner dice que
se está esperando algo, la olla dice que la app está escribiendo.

**Y es la única que tiene final:** cuando la escritura sale bien, la olla se
tapa y aparece un tilde antes de que el velo se vaya (§6.17b). Es la única
excepción a que todo lo demás sea instantáneo, y dura 1850 ms.

**El reindexado no usa ninguno de los dos:** usa barra de progreso, porque ahí
hay un número que decir (`E05-Cimientos.md` C05.5.2). La regla es esa — con
número, barra; sin número, spinner.

**`prefers-reduced-motion: reduce` elimina los cinco movimientos:** el menú
aparece sin transición, el carrusel salta, el spinner queda quieto, la estrella
se dibuja llena a la mitad, fija, y la olla queda con la cuchara apoyada y el
vapor detenido. No hay ninguna información que dependa del movimiento.

**El cierre del velo tampoco se mueve, pero dura lo mismo:** la tapa aparece
abajo y el tilde entero, sin dibujarse, y el cierre dura los mismos 1850 ms. Lo
que se saca es el movimiento, no el tiempo: el cierre no se atrasa ni se
acorta.

---

## 6. Componentes core

Con tokens aplicados. Los que son sistema —encabezado, ficha, botón, tarjeta,
placeholder, marca de borrador, chip, carrusel, campo, aviso, ítem de
ingrediente, spinner, miniatura, galería y foto en línea— están en
`src/ui/tokens.css`; los que son de una pantalla, en `src/ui/base.css`.

### 6.0 Cómo responde un control

Tres convenciones valen para todos los componentes:

- **Elegido se dibuja invertido** —fondo `--fg`, texto `--bg`, borde `--fg`—, no
  con el acento: el botón de tag especial (§6.10b), el botón de duración
  (§6.18), el conmutador de orden (§6.20) y el sol encendido de cocina (§6.12).
  `--acento` está reservado para las acciones y para lo que está activo como
  filtro o como destino: el chip encendido (§6.10) y el ítem actual del menú
  (§6.17). Un estado declarado pintado de acento compite con *Guardar*, que está
  a centímetros. Todos llevan `aria-pressed`.
- **El presionado es lo que vale en el teléfono:** mientras el dedo está apoyado
  (`:active`), el control pasa a `--surface-alta` —el ícono, el botón secundario
  y el de peligro, la tarjeta, la fila de una lista, el ítem del menú— y el
  primario se aclara mezclando el acento con `--fg`.
- **El hover existe sólo bajo `@media (hover: hover)`**, con el mismo dibujo que
  el presionado. En una pantalla táctil el hover queda pegado después de tocar,
  hasta que se toca otra cosa.

### 6.1 Tarjeta miniatura

```
┌────────────────────────────────────────┐  --surface, borde 1px --borde
│ ┌──────┐  Milanesas napolitanas    ★○  │  --r-ficha, padding --e-3
│ │ foto │  ▪ Carnes · ◷ ~30 min           │
│ └──────┘                               │
└────────────────────────────────────────┘
```

| Parte | Token |
|---|---|
| Foto o placeholder | 56 × 56 px, `--r-foto` |
| Título | `--txt-base`, peso 600, `--fg`; hasta dos renglones, después elipsis |
| Línea de contexto | `--txt-chico`, `--fg-2`, sólo datos: categoría · duración · rinde |
| El relojito de la duración | 15 × 15 px, pegado al valor (`.dur`); mismo mapa de íconos que el editor (§6.18) |
| El cuadrito `▪` de categoría | 8 × 8 px, `--r-chico`, el color de la categoría |
| Marcas de los especiales, juntas en la esquina de arriba a la derecha | 16 × 16 px cada una, separadas 4 px, en el orden de los especiales —favorito, menú diario, probar, borrador—, en `--acento`; ver §6.5. La estrella de favorito lleva además un relleno del acento al 35 %. El título reserva 20 px de ancho por marca, para no pasar por debajo; una tarjeta sin marcas no reserva nada. Sin texto, así que cada una se nombra para el lector de pantalla —*Favorita*, *Menú diario*, *Para probar*, *Borrador*— y con el mismo nombre en el `title`, que en la computadora aparece como globito al apoyar el mouse |
| Motivo, en resultados por ingrediente | `--txt-chico`, `--acento` |
| El «+» de agregar, sólo cuando la tarjeta suma en vez de abrir | Círculo de 28 px relleno en `--fg`, con el signo en `--bg` a 2,5 px de trazo. Es el contraste más alto que da la paleta, para que se lea como botón antes que como dato; el acento queda para las marcas de la esquina, que son otra cosa. Va al final de la fila, fuera del bloque de texto. Se usa en *Agregar al plan* (`E06-Planificar.md` F06.3) |

**Alto total: 80 px** con el título en un renglón. Entran ocho o nueve por
pantalla.

**Estados:** normal · presionada (`--surface-alta`, §6.0) · sin foto (§6.2) ·
con marcas.

### 6.2 Placeholder de foto

**La foto de la categoría, oscurecida con negro al 45 %, con el color de la
categoría encima al 25 %.**

- Ocupa **exactamente el mismo espacio que una foto** —56 × 56 px en la tarjeta,
  el ancho completo en la receta— para que la lista no se desalinee.
- **Es el caso normal, no la excepción:** casi ninguna receta va a tener imagen,
  así que tiene que verse deliberado. Un bloque de color con un glifo lo es; un
  ícono gris de imagen rota no.
- Aporta información: **dice de qué categoría es la receta** sin ocupar una línea
  de texto, y con la misma imagen que esa categoría tiene en la grilla, así que
  se reconoce sin leer.
- **Dentro de una lista de categoría no aporta nada**,
  porque las veinte filas comparten categoría. Se conserva igual: su función ahí
  es que la fila no se desalinee el día que una receta tenga foto propia. Donde sí
  informa es en los resultados de búsqueda, que mezclan categorías.
- **No necesita ningún asset nuevo:** reutiliza los `.webp` de categoría que ya
  existen. Una categoría sin foto usa su color plano; una sin color usa
  `#99907F`.
- **Está siempre, también con foto:** la de la receta va encima, en la misma
  caja. Una cabecera de Drive llega con el token y tarda, y mientras tanto
  —o para siempre, si ya no está— abajo queda la categoría. El hueco no existe
  en ningún momento.
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

**Es tocable y abre el visor** (§6.26). El botón no agrega nada visual: la foto
se ve igual.

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
| Proporción | 4:3 |
| Foto | El tile entero, con el color de la categoría encima al 28 % (`overlay`) |
| Contador | Un badge en la esquina de arriba a la derecha, a `--e-2` del borde: 20 px de alto mínimo, radio completo, fondo `--velo` al 92 %, borde 1 px `--borde-fuerte`, `--txt-micro` peso 600 en `--fg`, cifras tabulares |
| Grilla | **2 columnas** en teléfono, 4 desde 900 px, `--e-3` de separación |

**El velo llega a .96 abajo y sube hasta `--e-6`** para que el nombre cumpla
4.5:1 sea cual sea la foto: sobre las claras —la paella, la ensalada— un velo
suave lo deja sin contraste.

**El contador se dibuja sólo si la categoría tiene algo.** Es casi opaco y con
el texto claro porque cae sobre fotos de cualquier luminosidad. El orden de la
grilla es alfabético: el número informa, no ordena.

**Dos columnas y no tres:** con tres, el tile mide 110 px y la foto de categoría
—que es lo que hace que se reconozca sin leer— deja de distinguirse. Entran menos
de un vistazo y hay que scrollear, y eso está aceptado: la posición de cada
categoría se aprende igual porque el orden es alfabético y estable.

**Es el único lugar donde el color de la categoría es el borde y no un cuadrito**,
porque es el único donde la categoría es el contenido y no un dato de otra cosa.

**Sin foto:** una trama de rayas diagonales del color de la categoría, al 22 %
sobre `--surface`, con el nombre. No se rompe. La misma trama es la muestra «sin
foto» al elegir la foto de una categoría.

**La foto propia** —una subida por el usuario, no del catálogo— se dibuja igual,
pero se pide a Drive con el token: hasta que llega, el tile queda con su color.
Al elegirla, *Subir foto* es la primera muestra de la fila: un botón de
`--surface-alta` con el ícono `camara`, del mismo tamaño que las demás.

### 6.5 Marca de borrador

**Un círculo de 12 px a medio llenar**: 1,5 px de
borde en `currentColor` y la mitad izquierda rellena del mismo color
—`linear-gradient(to right, currentColor 50%, transparent 50%)`—. **En
`--acento`**, salvo donde el contexto ya tiene un color propio.

Es la misma marca en todos los lugares donde el dato se muestra, y no hay ningún
otro dibujo para decir lo mismo:

| Dónde | Cómo |
|---|---|
| **Tarjeta de la lista** | Junto con las demás marcas de especiales, arriba a la derecha de la tarjeta y en su orden (§6.1). Sin texto, así que cada una se nombra para el lector de pantalla. |
| **Receta abierta** | Un chip (§6.10) con el tag tal como está escrito —*borrador*—, el primero de la fila de tags. Tocable, abre el editor (`E03-LeerYCocinar.md` C03.1.3). |
| **Editor** | El ícono del botón `borrador` (§6.10b), en el color del botón y no en el acento. |
| **Carrusel de tags** | El ícono del chip `borrador` (§6.21). |
| **Borradores** | El ícono antes del título, en el encabezado de la lista (§6.12). |

- **Nunca `--error` y nunca amarillo.** No es un problema: la receta funciona, le
  falta algo.
- **El acento acá no rompe la regla de que el acento es de las acciones:** donde
  la marca es más visible —la receta abierta— es efectivamente una acción, la
  única de su fila. En la tarjeta hereda ese color para que la marca sea una
  sola, aprendida una vez.

**Por qué a medio llenar:** dice "hecha a medias", que es exactamente el estado.
Un aro vacío al lado de un título se lee como viñeta.

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

**Variante compacta: 40 px de alto.** Existe para **un botón dentro de otra
barra**: el encabezado de pantalla, que mide 56 px y no puede contener uno de 48
con aire alrededor —*Pegar* en el editor, *Salir* en cocina, *+ Nueva* en
Categorías—, el botón de un aviso con acción (§6.8), el de
una fila de Ajustes —*Salir*, *Cambiar carpeta*, *Categorías ›*— y el *Usar* de
una carpeta encontrada, en la pantalla de la carpeta base. **Su área
táctil sigue siendo de 48 px**, porque el alto de la barra la completa; en
cocina, de 64 (§6.12). Suelto en el cuerpo de una pantalla no se usa.

**Estados:** normal · presionado y hover (§6.0) · trabajando (el texto se
reemplaza por el verbo en gerundio: *"Guardando…"*; en la ficha de compartir, un
spinner de 16 px adelante: *"Armando el PDF…"*) · deshabilitado (`--fg-3`, sin
fondo, borde `--borde`).

**Con ícono,** va a la izquierda de la palabra, a `--ico`, con `--e-2` de
separación.

**Un botón que navega es un `<a>`, y nunca se subraya.** *Categorías ›* y *+
Nueva* llevan a otra pantalla, así que son enlaces y no
`<button>`; se dibujan igual que cualquier otro botón.

**No hay botón flotante.**

**Un logo ajeno adentro de un control no sigue la regla de trazo.** Los íconos del sistema son de trazo, 1,5 px,
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
| **Sin acción** | Una nota de `--txt-base` en `--fg-2`, sin fondo ni borde (`.aviso-mudo`): es prosa, y la prosa no baja de 16. Las de Ajustes —Avisos, Archivos locales, Registro de actividad— son todas así. La excepción es la nota debajo de los botones de duración (§6.18), que va en `--txt-chico`. |

Ninguno se cierra solo, ninguno lleva ícono y ninguno muestra el error crudo.

### 6.9 Campo de texto

`--surface-alta`, borde 1 px `--borde-fuerte`, `--r-medio`, padding `--e-3`,
alto mínimo 48 px, `--txt-base`.

**El desplegable lleva un chevron propio**, no el del navegador, que ignora el
padding y queda pegado al borde derecho: el trazo de los íconos (§3.4), 16 px, en
`--fg-2`, a `--e-4` del borde. Es una imagen de fondo del `select`, con el color
escrito a mano porque adentro de un `url()` no llegan las variables.

Etiqueta arriba en `--txt-chico` y `--fg-2`. Foco: borde `--acento` de 2 px.
Placeholder en `--fg-3`, y **nunca reemplaza a la etiqueta**.

Los campos de contenido —ingredientes, preparación, notas— son `textarea` que
crecen con el contenido, con un mínimo de tres renglones.

### 6.9b Botón de poner una foto

Vive **encima de un campo de contenido del editor**, pegado a su borde derecho
—a `--e-2`— y **a la altura de la línea donde está el cursor**. Se dibuja sólo
con el campo enfocado y con algo en el depósito.

Sin texto: el ícono `imagen` de 18 px en `--fg-2`, en una caja de 36 × 32 px de
`--surface` —más oscuro que el campo, que es `--surface-alta`— con borde 1 px
`--borde-fuerte` y `--r-chico`. Del lado izquierdo lleva un **pico** de 6 px
que apunta al texto, con el mismo borde y relleno: dice que la foto va en esa
línea y no en el campo entero. Presionado, caja y pico pasan a `--surface-alta`
(§6.0). Es de
32 px y no de 24 para poder tocarlo, y se sube 4 px para quedar centrado sobre
el renglón. Tapa el final de la línea, que es el precio de estar adentro del
campo: la escritura pasa por debajo y el botón se ve entero.

**No es la cámara** (§3.4): pone una foto que ya está en el depósito, no agrega
una nueva.

**Sigue al campo por dentro:** desplazar el texto con el dedo lo mueve con su
renglón, y si el renglón del cursor se fue de la vista el botón no se dibuja.
**Tocarlo no mueve el foco**, para que el toque no se pierda en el camino.

La altura sale de un **espejo** del campo: un calco invisible, con el mismo
tipo, la misma interlínea y el mismo ancho de texto, al que se le escribe lo
que hay hasta el cursor para leer dónde quedó el renglón. Un `textarea` no sabe
decir en qué renglón está el cursor, y contar líneas por el alto de línea falla
en cuanto una línea larga ocupa dos renglones.

### 6.10 Chip

Para los tags y los metadatos de la receta.

Fondo un tono por encima de `--surface-alta` —
`color-mix(in srgb, var(--surface-alta) 86%, var(--fg))`—, borde 1 px
`--borde-fuerte`, `--r-chico`, padding lateral `--e-2`, `--txt-chico` en `--fg`.
Alto 32 px.

**Por qué un tono por encima:** con `--surface-alta` el chip desaparece sobre los
dos fondos donde vive. En el editor comparte fondo con el campo de agregar un
tag, y en la receta abierta se funde con la ficha. Es el mismo chip en las dos
pantallas: un tag se tiene que ver igual donde se pone y donde se lee.

**Con ícono** —un tag especial lleva el suyo adelante (§3.4), y un chip de
duración su relojito—: 14 px, trazo de 1.5 px, al 70 % de opacidad.

**Con número** —en el carrusel de tags (§6.21) y en la fila de duraciones
(§6.19)—: la cantidad de recetas a la derecha, en `--fg-3` y cifras tabulares.

**Encendido** —un tag o una duración aplicados como filtro— usa `--acento-suave`
de fondo, borde `--acento` y texto `--acento`; el número hereda el color, al
80 %. **No lleva cruz:** se apaga tocándolo de nuevo. En la lista por tag, el
chip del tag de la ruta va encendido y no es tocable: cambiar de tag es volver y
elegir otro.

**Quieto** —un tag en la receta abierta— es el chip normal como `<span>`: se
lee y no se toca, así que no lleva `cursor: pointer` ni estado encendido.

**Removible** —un tag del editor— es el chip normal más una `×` de trazo de 14 px
en `currentColor` a 70 % de opacidad, y el chip entero es el botón que lo saca.
No hay una cruz con su propia área táctil adentro: a 32 px de alto no entra un
segundo blanco de 48. Debajo de la fila de chips van `--e-3` de aire antes del
campo de agregar.

**Pendiente** —el estado de un borrador, en la receta abierta— usa los
mismos valores que **Encendido**, con la marca de §6.5 adelante y el tag tal como
está escrito, *borrador*. Son clases distintas porque significan cosas
distintas: uno es un filtro puesto, el otro un estado del contenido.

**Un tag reservado no llega a ser chip:** el editor lo rechaza al agregarlo y lo
dice en una línea de `--txt-chico` en `--error`, sin caja ni botón
(`E04-Corregir.md` C04.2.1b).

### 6.10b Botón de tag especial

Cuatro botones —uno por tag especial: `favorito`, `menú diario`, `probar`,
`borrador`—, dentro del campo **«Tags»**
del editor, en una **grilla de 2 × 2** arriba de los tags comunes y del campo
para agregar (`E04-Corregir.md` C04.2.1b, C04.4.1), con `--e-2` entre sí. Cada
uno mide 48 px de alto mínimo, `--r-medio`, `--txt-base` peso 600, y lleva su
ícono (§3.4) a 16 px y el tag tal como se escribe, con `aria-pressed`.

| Estado | Fondo | Texto | Borde |
|---|---|---|---|
| **Suelto** | `--surface-alta` | `--fg-2` | 1 px `--borde` |
| **Apretado** | `--fg` | `--bg` | 1 px `--fg` |

**Apretado se dibuja invertido, no con el acento** (§6.0). Con puntero, un botón
suelto sube su texto a `--fg` al pasar por encima.

**`borrador` apretado y deshabilitado** —sin título, categoría, ingredientes
o pasos— no se puede tocar, y debajo lleva la leyenda de qué falta, como un
aviso sin acción (§6.8): *"Se va a poder sacar borrador cuando se cargue:
título, categoría, ingredientes y pasos."* **Deshabilitado baja a `opacity:
.6`**, manteniendo apretado: sigue leyéndose qué estado tiene, sólo que no se
puede tocar.

**Nunca `--error`.** Misma regla que la marca de borrador (§6.5): a la
receta le falta algo, no está rota.

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
arriba a la derecha, alineada con el primero. **Nada estira la fila:** una
palabra sin espacios —una URL, un nombre pegado— se parte en el ancho de la
pantalla en vez de empujarla. La cantidad conserva su ancho mientras entre, así
que `250 g` no se parte nunca; la que sola no entra en la fila baja a su propio
renglón, a la derecha, y ahí sí se corta.

Los grupos —los `###` del `.md`— son `--txt-chico` en `--fg-2`, en mayúsculas con
`.06em` de espaciado, con `--e-4` arriba.

### 6.12 Encabezado de pantalla

Alto 56 px, fondo `--bg`, borde inferior 1 px `--borde`.

Volver a la izquierda como control de 48 px —no un chevron chico—, título al
medio en `--txt-base` peso 600, acciones a la derecha.

**El encabezado abre el menú en las pantallas a las que se llega desde el
menú** —Recetario, Borradores, el plan de la semana, la receta nueva y
Ajustes—: ahí la hamburguesa (§6.17) ocupa el lugar del volver, que queda para
las pantallas a las que se entra desde otra. Editar una receta existente es una
de esas: se entra desde la receta y se sale volviendo. En el Recetario y en Ajustes el
título va además en `--txt-titulo`, centrado en la barra y no en el hueco que
dejan los controles. Borradores es la lista por tag de `borrador` dibujada como
destino del menú: el encabezado de la lista por tag —título chico, el ícono del
tag y el total—, con la hamburguesa y el título «Borradores».

El total de una lista —las recetas de una categoría, los borradores— va a la
derecha, en `--txt-chico` `--fg-2` y cifras tabulares. En la lista por tag de un
especial, su ícono va antes del título, a `--ico`.

**Queda pegado arriba en todas las pantallas**, con `z-index` 3: el volver, la
hamburguesa y las acciones —la estrella y *Compartir* en la receta, *Pegar* en
el editor— están a mano en cualquier punto del scroll. El menú lateral, su velo,
las fichas al pie y el visor van por encima. El título se recorta a una línea con
elipsis. La caja de los resultados, que es el encabezado de esa pantalla, queda
pegada igual.

**En modo cocina el encabezado mide 64 px y cada control suyo toca en
64 × 64** —volver, el sol, *Salir*—, como pide §1. El sol y *Salir* se dibujan
como una caja de 40 px de alto con borde `--borde-fuerte` adentro de sus 64: sin
reborde, un ícono suelto no se lee como algo que se toca. **El sol encendido se
invierte** (§6.0). El encabezado de cocina también queda pegado arriba, y el
conmutador (§6.14) se pega debajo de él.

**Las barras pegadas se separan con un borde, no con un degradado.** Un degradado
sobre fichas deja el contenido cortado a mitad detrás de él, que lee como un
error de dibujo. Fondo `--bg` opaco y 1 px de `--borde` — la misma regla que el
resto del sistema: los límites se marcan con borde. Vale también para el pie de
acciones de la receta, pegado abajo.

### 6.13 Paso de la preparación, en cocina

Tres estados, y ninguno persiste (`E03-LeerYCocinar.md`
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

Dos posiciones del mismo ancho, alto 64 px, pegado debajo del encabezado de
cocina (§6.12).

Inactiva: `--surface`, texto `--fg-2`. Activa: `--surface-alta`, texto `--fg`,
con una barra de 3 px de `--acento` abajo.

`--txt-base` peso 600. Cada posición lleva su ícono —la zanahoria, la lista
numerada— a `--ico-cocina`, al lado de la palabra. El cambio es instantáneo.

### 6.17 Menú lateral

La navegación primaria de la app: Inicio —la pantalla del Recetario, que no
repite el nombre de la marca—, Borradores, Plan de la semana, Nueva receta y
Ajustes. Nueva receta es una acción: en el editor al que lleva, que dibuja el
menú, no queda marcado ningún ítem.

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
Con el menú cerrado, el mismo número va sobre la hamburguesa, en una píldora de
18 px.

**Al pie, la versión de la app,** en `--txt-micro` `--fg-3` y cifras tabulares:
sirve para saber si el teléfono ya tomó la última publicación.

**Dos comportamientos según el ancho, un solo menú.** Abajo de 900 px es un cajón
que entra desde la izquierda en 200 ms, sobre un velo de `--velo` al 60 %, y se
abre con el botón de hamburguesa del encabezado o deslizando hacia la derecha; el
velo lo cierra al tocarlo, y deslizar hacia la izquierda también. **El gesto
empieza a 24 px del borde** —desde el borde mismo Android lo toma como «atrás»— y
no arranca sobre el carrusel de tags (§6.21) ni la fila de duraciones (§6.19),
que se deslizan en el mismo sentido. **Vale en toda la pantalla, también donde
no hay contenido:** una lista corta deja abajo un área vacía y el dedo tiene
que abrir el menú ahí igual.
Desde 900 px queda fijo, el velo y la hamburguesa desaparecen, y el contenido se
corre 260 px. **Es sólo CSS:** la misma marca dibujada, una consulta de medios
decide. Con `prefers-reduced-motion` el cajón aparece sin transición.

**Abrir y cerrar no redibuja la pantalla:** se cambian las clases del panel y del
velo que ya están dibujados. En la receta nueva, redibujar borraría lo escrito.

**Con el cajón abierto, la página de atrás no se desplaza:** el velo tapa el
toque, pero sin eso un deslizamiento vertical scrollea justo lo que el velo
tapa. Es la misma regla que las fichas al pie (§6.23) y el velo de escritura
(§6.17b). Desde 900 px no aplica: ahí el menú es fijo y el velo no se dibuja.

**A la izquierda, también en teléfono.** Es de donde vienen los cajones en
Android, y el pulgar que lo abre es el mismo que toca la hamburguesa, que está
del mismo lado.

### 6.17b Velo de escritura

Mientras la app escribe en Drive o en Sheets, un velo de `--velo` al 60 % cubre
la pantalla entera con **la olla que se revuelve** centrada. Sin transición:
aparece con el toque que lanza la escritura —no cuando la escritura arranca— y
se va cuando termina, bien o mal.

**La olla** es un dibujo de unos 96 px en `--fg-2`: el cuerpo y el borde, tres
hilos de vapor que suben escalonados, y la tapa levantada unos milímetros sobre
el borde. Adentro, una cuchara en `--acento` —el palo y la parte redonda— va de
lado a lado sin girar, en un loop de 1,6 s. Con
`prefers-reduced-motion: reduce` queda quieta, con la cuchara apoyada y el
vapor detenido (§5.1).

**El cierre, sólo cuando la escritura salió bien:** la cuchara y el vapor se
van, la tapa baja sobre la olla y encima se dibuja un tilde en `--exito`. Todo
en 1850 ms: el trazo del tilde arranca a los 300, termina a los 875 y el dibujo
se queda quieto 975 ms más, que es lo que hace falta para llegar a verlo en el
teléfono. Recién ahí sigue lo que venía. Si la escritura falla no hay
cierre: el velo se va de una y queda el aviso. Con
`prefers-reduced-motion: reduce` la tapa y el tilde aparecen sin dibujarse,
pero los 1850 ms son los mismos: se saca el movimiento, no el tiempo (§5.1).

**El orden se ve entero, y en este orden:** la olla revolviendo mientras se
escribe, el tilde cuando terminó, y recién después la pantalla a la que se va
—cerrar el editor, volver a la receta—. El velo sigue tapando mientras dibuja
el tilde, así que el repintado de esa pantalla queda por debajo y no se ve
pasar; se va cuando esa pantalla ya está dibujada. Lo que sí se suelta apenas
arranca el cierre es la espera: `aria-busy` se saca y la pantalla deja de estar
ocupada, así que navegar no lo frena nadie. Si nadie dibuja nada —un guardado
que no lleva a ningún lado— el velo se va solo un rato después.

**El velo tiñe el fondo y no a la olla:** es `color-mix` sobre el fondo, no
`opacity` sobre el elemento entero, así el dibujo se ve a pleno.

**Recibe el toque**, así que ningún control de abajo responde, y el contenido
queda marcado como ocupado (`aria-busy`). **Y frena el scroll:** mientras está,
la página de atrás no se desplaza, con la misma regla que las fichas al pie
(`html:has(...) { overflow: hidden }`). Las dos cosas valen mientras escribe, no
mientras cierra. No es una pantalla de carga: lo que estaba sigue dibujado
debajo, incluido el botón que dice «Guardando…».

Qué operaciones lo muestran, cuáles lo cierran con el tilde y cuáles no lo
muestran está en `product/specs/E05-Cimientos.md` R8.

### 6.18 Botones de duración, en el editor

El campo **«Duración»** del editor: va debajo de «Rinde», los dos a lo ancho.

Cinco botones (`.dur-btn`), uno por valor, en una grilla de **tres columnas**
(`.duraciones`) separadas `--e-2`. Cada uno mide un mínimo de **72 px** de
alto, con el relojito arriba —24 px, en `--fg`— y el valor abajo, en
`--txt-chico` peso 600.

| Estado | Fondo | Texto | Borde |
|---|---|---|---|
| **Suelto** | `--surface-alta` | `--fg-2` | 1 px `--borde` |
| **Apretado** | `--fg` | `--bg`, ícono incluido | 1 px `--fg` |

**Se aprieta uno a la vez, y tocar el apretado lo suelta.** La inversión es la
del botón de tag especial (§6.10b, §6.0). El reloj de `>1 día` corta con el fondo
del botón: `--fondo-reloj` vale `--surface-alta` suelto y `--fg` apretado.

Debajo de la grilla, en `--txt-chico` `--fg-2` (`.aviso-mudo`): *"Hasta comer,
con reposo y horno incluidos."*

### 6.19 Fila de chips de duración

Debajo del carrusel de tags (§6.21), en la
categoría y en la lista por tag. Mismo chip que §6.10 —`.fila-dur .chip`—,
con el relojito (14 px, como cualquier ícono de chip) y la cantidad en
`--fg-3` a la derecha del valor, en el orden de los cinco valores.

Se desliza de costado como el carrusel de tags, pero sin degradé ni flechas, y
con margen negativo para llegar hasta el borde de la pantalla.

Un chip encendido usa la variante `.act` —fondo `--acento-suave`, borde y
texto `--acento`—, la misma de un tag encendido. `--fondo-reloj` sigue al fondo
del chip en los dos estados.

**No se dibuja si ninguna receta de la lista tiene duración**, y un valor sin
recetas no se dibuja salvo que esté encendido, para poder apagarlo.

### 6.20 Conmutador de orden

«A–Z | ◷ Duración» (`.orden-seg`), en una
fila propia alineada a la derecha (`.orden`), debajo del filtro; en la
búsqueda, arriba de los grupos y sin fila de filtro.

Dos botones del mismo panel (`--borde` de 1 px alrededor, `--r-medio`,
separados por un borde de 1 px entre sí): alto mínimo **40 px**, sin fondo ni
borde propios, `--txt-chico` peso 600 en `--fg-2`; el elegido invierte a fondo
`--fg` y texto `--bg` (§6.0). El botón de Duración lleva el relojito de `~30 min` como ícono
genérico, 16 px.

**No es el conmutador de cocina del §6.14** —que ocupa el ancho pegado
arriba—: es un patrón propio, más chico y dentro de la fila de orden.

Vuelve a A–Z al cambiar de pantalla, y no se dibuja si ninguna receta de la
lista tiene duración.

### 6.21 Carrusel

**El marco es un componente reusable:** una pista que se desliza de costado con
lo que le pongan adentro, `--e-2` entre ítem e ítem, sin barra de scroll, el
degradé a los lados y las dos flechas. Lo usan el **carrusel de tags** y el
**carrusel de fotos de la receta** (§6.26), y puede haber más de uno en la misma
pantalla: cada marco lleva su propia timeline de scroll, y una flecha mueve la
pista de su marco. Cada uno define a qué color va su degradé según el fondo que
tenga atrás.

**El carrusel de tags** es una fila de chips (§6.10). Vive entre la búsqueda y
las categorías en el Recetario, y arriba de la lista en la categoría y en la
lista por tag.

**El orden:** los tags especiales primero, en su orden —favorito, menú diario,
probar, borrador— y sólo los que tienen alguna receta; después los comunes,
por cantidad de recetas y alfabético en el empate. Cada chip lleva su número, y
los especiales su ícono. En el Recetario y en la lista por tag entran hasta
veinte comunes.

**Qué hace un toque:** en la categoría y en la lista por tag, enciende el chip y
filtra la lista; en el Recetario, abre la lista de ese tag.

**Un degradé de 40 px al fondo de atrás dice que sigue** —`--bg` en el de tags,
`--surface` en el de fotos, que vive sobre una ficha—: a la derecha mientras
quede algo por ver, a la izquierda sólo cuando ya se corrió. Se ata a la posición del
scroll con `animation-timeline`, sin JavaScript; sin desborde no se dibuja
ninguno, y donde no haya soporte se ven los dos siempre.

**Las flechas existen sólo con mouse o trackpad** —`@media (hover: hover) and
(pointer: fine)`—; en el teléfono se desliza con el dedo. Son un círculo de
32 px, `--surface-alta`, borde 1 px `--borde-fuerte`, con el chevron a 16 px:
`volver` a la izquierda y `chevron` a la derecha. Aparecen y desaparecen con el
mismo rango que su degradé, y mientras están ocultas no se pueden tocar. Con
flechas, el carrusel deja 40 px de aire a cada lado.

### 6.22 Estrella de favorito

Un botón de ícono de 48 px en el encabezado de la receta, el primero de la
derecha, con `aria-pressed`. Son dos estrellas superpuestas, a `--ico`: el
contorno en `currentColor`, y encima la llena —trazo `--acento` y relleno del
acento al 45 %—, recortada.

| Estado | Cómo se ve |
|---|---|
| **Sin marcar** | El contorno en `--fg`; la llena, recortada entera. |
| **Favorita** | Todo en `--acento`, con la llena a la vista. |
| **Escribiendo en Drive** | En `--acento`, y la llena se descubre de izquierda a derecha en 2 s, en bucle. El resultado se dibuja recién con la respuesta. Con `prefers-reduced-motion`, fija a la mitad. |

Si la escritura falla, el aviso con *Reintentar* va arriba del cuerpo de la
receta (§6.8) y la estrella vuelve a como estaba.

**La estrella es el único tag especial que se pone desde la receta;** los otros
tres se ponen desde el editor (§6.10b). En la fila de tags de la receta,
`favorito` no se repite como chip.

### 6.23 Ficha de compartir

Una hoja pegada al pie de la receta, sobre un velo de `--velo` al 60 %:
`--surface`, borde superior 1 px `--borde`, `--r-ficha` en las dos esquinas de
arriba, padding `--e-4` más el área segura de abajo, ancho máximo 680 px. El
título, *Compartir*, en *base fuerte*. Adentro, botones secundarios a lo ancho,
con `--e-2` entre sí: **PDF**, **Link**, **Texto** y **Cancelar**.

| Paso | Qué muestra |
|---|---|
| **Armando el PDF** | El botón de PDF deshabilitado, con un spinner de 16 px y *"Armando el PDF…"*; los otros dos, deshabilitados. |
| **PDF listo** | *"El PDF está listo."*, **Enviar PDF** como primario y *Cancelar*. |
| **Falló el PDF** | El aviso con acción: *"No se pudo armar el PDF."* y *Reintentar*. |
| **Copiado** | *"Link copiado."* o *"Texto copiado."*, y *Listo*. |
| **Sin portapapeles** | *"Copialo desde acá:"* y el contenido en un cuadro —`--bg`, borde `--borde`, `--r-medio`, `--txt-chico` `--fg-2`, hasta 40 % del alto de la pantalla, seleccionable de un toque— y *Listo*. |

**Con la ficha abierta, la página de atrás no se desplaza.** La cierran
*Cancelar*, el velo y volver. Es estado de la pantalla, no una ruta.

**La ficha nunca pasa el alto de la ventana.** El alto se mide contra **la
ventana chica**, la que se ve con la barra de direcciones puesta: medida contra
la grande, la ficha puede quedar cortada arriba, y ahí no se llega porque la
página está trabada. Lo único que se desplaza adentro es el cuadro del
contenido, que se achica cuando la ficha llega a su tope: así *Listo* queda
siempre a la vista, y el dedo nunca queda desplazando una cosa adentro de otra.
Las fichas de fotos del editor se topan igual, al 80 %, y ahí el que se
desplaza es la ficha: adentro no hay nada que se desplace solo.

**En la lista de compras la ficha ofrece sólo *Texto***: no es una receta, así
que no hay PDF ni link.

**El PDF** es una hoja de **105 × 180 mm** con 8 mm de margen, **en el tema
oscuro**: los neutros de §2.1 —`--bg` de fondo, `--surface` y los dos bordes
para las fichas, `--fg`, `--fg-2` y `--fg-3` para el texto—, sin acento ni color
de categoría. Lleva **Inter embebida** —regular, semibold e itálica— porque un
PDF no puede usar la fuente del sistema, y Inter tiene ⅓ y ⅔. La escala es la de
la receta abierta, reducida a la hoja: título, título de sección con su divisor,
cuerpo y texto chico para el contexto, la fuente y los rótulos de grupo. **Las
fotos van adentro del archivo**, achicadas: la cabecera arriba del título, al
ancho útil y con el alto topado a 90 mm; cada una debajo de su línea, con el
epígrafe en texto chico `--fg-3`; y la galería al final, de a dos por fila.

### 6.24 Grilla del plan de la semana

Tres columnas —`52px 1fr 1fr`— con `--e-2` de separación: la del día, *Mediodía*
y *Noche*. Los encabezados de columna van en *micro* `--fg-3`, en versalita con
`.06em` y centrados; la columna del día lleva el nombre abreviado en *chico
fuerte* `--fg` y, sólo en la fila de hoy, la palabra *hoy* debajo. **La fila de
hoy es lo único marcado**, entera en `--acento`: el plan no tiene fechas, y es
lo que dice dónde estás parado.

**La celda** es una comida: `--surface`, borde 1 px `--borde`, `--r-medio`, 56 px
de alto mínimo, y adentro una línea por receta más el `+` al pie. Vacía se dibuja
**punteada y sin fondo**, con el `+` ocupando el alto entero: un borde lleno se
leería como una comida ya elegida.

**La línea** es `--surface-alta`, `--r-chico` y texto *micro*, con **3 px de
borde izquierdo en el color de su categoría**: el mismo hilo de color que el pin
de la tarjeta y el filo del tile (§2.3). Lleva el título, que abre la receta, y
una `×` de 12 px en `--fg-3` que saca esa línea y nada más. Una receta que ya no
está en el índice va tachada, en `--fg-3`, y su borde izquierdo pasa a `--error`.

**El pie** queda pegado abajo, con un degradé a `--bg` que lo despega de la
grilla, y sus dos botones ocupan el ancho: *Lista de compras* primario y
*Reiniciar el plan* secundario, deshabilitados con el plan vacío. La
confirmación de reiniciar va en su lugar, en una ficha con borde `--error`, como
borrar una receta.

### 6.25 Fila de miniaturas y visor

**La fila** es la ficha *Fotos* del editor de recetas (§6.26). Lleva el rótulo
*Fotos* de un campo (§6.9): miniaturas **cuadradas de 64 px** con `--e-2` entre
sí, que bajan de renglón si no entran. Cada una es la foto recortada al cuadrado
(`object-fit: cover`) sobre `--surface-alta`, con `--r-foto`. No lleva ×:
*Sacar* es una de las acciones de la ficha (§6.26). Al final de la fila, botones
secundarios de 64 px de alto: **Cámara**, con el ícono `camara`, que saca una
foto por vez; **Galería**, con el ícono `galeria` —dos fotos, una detrás de
la otra—, que abre el selector del sistema y acepta varias a la vez; y **Por
URL**, con el ícono `link`, que abre la ficha de §6.26. **Con mouse o trackpad,
*Cámara* no se dibuja**: ahí el `capture` no hace nada y abriría el mismo
selector que *Galería*. Es la consulta de puntero con la que aparecen las
flechas del carrusel (§6.21), al revés. **Van en su propia fila, debajo de las
miniaturas**, y bajan de renglón entre ellos si no entran —en un teléfono, los
tres entran de a dos—, y no tienen tope. **Una foto que ya no está en Drive** es el mismo cuadrado con
borde punteado `--borde-fuerte` y *"La foto ya no está en Drive."* en *micro*
`--fg-3`, centrado.

**El número del depósito** (§6.26) va en la esquina de abajo a la izquierda de
la miniatura, adentro del botón: un badge de `--velo` al 75 %, `--r-chico`,
*micro* en `--fg`, de 18 px de alto, con el numeral delante —`#3`—. Es con el
que se nombra a la foto en el texto, así que se lee sobre cualquiera.

**Las marcas de uso** van en la esquina de enfrente, arriba a la derecha, y
sólo en la ficha *Fotos* de una receta: el mismo badge de `--velo` al 75 % y
`--r-chico`, de 18 px de alto, con los íconos `portada` y `enElTexto` (§3.4) a
13 px en `--fg` —los dos si la foto es las dos cosas, ninguno si no se usa—.
Van arriba a la derecha porque es la esquina que queda libre.

**El epígrafe de la ficha *Fotos*** va debajo de la fila, en *micro* `--fg-3`,
con `--e-3` arriba y un interlineado de 1,8. Es **un párrafo**, no una fila de
flex: los íconos van en línea con el texto —`inline-block` de 1,15 em con
`vertical-align: -0.22em`—, así el párrafo corta como cualquier texto y la
última línea no queda ni estirada ni partida a la mitad de una palabra.

**El visor** abre la foto tocada: fija sobre toda la pantalla, encima de todo,
sobre `--velo` al 94 %, con la foto entera al ancho —o al alto— de la pantalla,
sin recortar. Se cierra tocando cualquier lado. **Desliza entre lo que se
tocó**: desde el carrusel de una receta, entre las del carrusel; desde la fila
de fotos del editor, entre las del depósito; una foto que no es de una tira —la
portada, la de un paso— se abre sola. El dedo
pasa a la siguiente o a la anterior, sin dar la vuelta en los extremos, y ese
gesto no la cierra. Es estado de la pantalla, no una ruta.

### 6.26 Las fotos de la receta

**El carrusel de fotos** son las fotos **sin uso** dentro de la primera ficha,
debajo de la descripción y arriba del divisor de la fuente. Es el carrusel de
§6.21 con las fotos adentro: cada una un cuadrado de **66 px**
(`object-fit: cover`) sobre `--surface-alta`, con `--r-foto` —entran cinco en el
ancho de un teléfono, y el visor es el que las muestra grandes—, y el degradé
va a `--surface`, que es el fondo de la ficha. Cada foto abre el visor
recorriendo las del carrusel. **Sólo las sin uso:** la portada está arriba y
las puestas en una línea están en su línea, así que ninguna se dibuja dos
veces. Sin ninguna sin uso —o sin depósito— no se dibuja.

**La galería** es una grilla de **tres columnas** con `--e-2` de separación,
cada foto cuadrada (`object-fit: cover`) sobre `--surface-alta`, con
`--r-foto`. La usan las dos fichas del editor que hacen elegir una foto: la de
la portada, donde la elegida lleva un contorno de 2 px en `--acento`, y la de
poner una en una línea (§6.9b). **Una cabecera que es una URL suelta** va
adelante de la grilla de la portada, con el mismo contorno y sin ser un botón:
no está en el depósito y no hay nada que elegir en ella.

**La foto en línea** va debajo del texto que la nombra —un ingrediente, un paso,
una nota—, al ancho de la ficha, con `--r-foto` y `--e-2` arriba y abajo. Si
trae epígrafe, va abajo en *chico* `--fg-3`. En un ingrediente ocupa su propio
renglón, para no apretar el nombre ni desalinear la cantidad.

**Una foto de Drive que todavía no llegó** es un recuadro de `--surface` del
ancho disponible, en 4:3: el mismo lugar que va a ocupar, así nada salta cuando
aparece.

**Las fichas de foto del editor** se abren al pie, sobre el velo de `--velo` al
60 %, como la ficha de compartir (§6.23): `--surface`, `--r-ficha` en las dos
esquinas de arriba, ancho máximo 680 px, hasta 80 % del alto de la pantalla, y
el padding de abajo con el área segura. Tocar el velo las cierra, y por eso
ninguna tiene *Cancelar*. Mientras una está abierta, la página de atrás no se
desplaza. Son cuatro:

| Ficha | Qué muestra |
|---|---|
| **Acciones** | *Foto N* y dos botones, uno al lado del otro: **Ver**, secundario, y **Sacar**, con la variante de peligro (§6.7). **No ofrece Portada**: la portada se elige sólo en su campo. |
| **Poner una foto** | La galería del depósito, y nada más: es la que abre el botón de §6.9b. **No ofrece agregar**, que es la ficha *Fotos*. |
| **Foto de portada** | La galería del depósito con la actual marcada, y **Sin foto**. **No ofrece agregar**: la portada sale de lo que ya está. Es el único lugar donde se elige. |
| **Foto por URL** | El campo *Dirección de la foto*, con `https://…` de placeholder, y **Traer**. Si algo falla, el aviso (§6.12) va arriba del campo y la ficha queda abierta con lo escrito. |

**El botón de portada**, en el campo *Portada* de Contenido, es un cuadrado de
96 px con `--r-foto`: la miniatura de la cabecera actual, o un recuadro
punteado de `--borde-fuerte` que dice *Sin foto* en *micro* `--fg-3`.

---

## 7. Layout

| Qué | Valor |
|---|---|
| Margen lateral en teléfono | `--e-4` |
| Ancho máximo de la columna | **680 px**, centrada |
| Ancho máximo del cuerpo de lectura | **62 caracteres** |
| Punto de quiebre | **900 px**, uno solo: las grillas pasan de 2 a 4 columnas y el menú lateral deja de ser cajón y queda fijo (§6.17) |

**No hay layout de escritorio propio.** Es la misma app, más ancha
(`E05-Cimientos.md` C05.10.1). El menú fijo desde 900 px no es una excepción: es
el mismo menú, dibujado igual, al que le sobra lugar para quedarse abierto.

### 7.1 El ícono de la app

**Una olla con vapor, en los colores de la app:** fondo `--bg`, la olla y su tapa
en `--acento`, tres hilos de vapor en `--fg`. La fuente es `public/icono.svg`
—que es también el favicon—, y de ahí salen los PNG de 192 y 512 px del
manifest, declarados `any` y `maskable`: el dibujo entra en la zona segura de
Android, un círculo del 40 % del lado, así que el mismo archivo sirve recortado.
Es la única figura rellena del producto: a 48 px en la pantalla del teléfono, un
trazo de 1.5 no se ve.

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
