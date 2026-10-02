# E07 — Herramientas

**Job:** J6 · **Prioridad:** Baja

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas. Acá se anota solo lo
que se aparta o lo que necesita precisarse.

---

## La épica

Calcular las cantidades antes de cocinar: las de un pan —harinas, agua, sal y
levadura o masa madre— y la sal de un fermentado.

Son dos calculadoras, en una sección propia del menú. **No leen ninguna receta
ni usan Drive:** no tocan el índice, ni el `.md`, ni la carpeta base. Una
receta marcada con `pan` o `fermentado` tiene un botón que abre la que le
corresponde, y el agente usa las mismas cuentas por el MCP.

**Toda la fórmula de cada calculadora vive en un solo archivo**, puro y sin
DOM: `src/calculadoras/pan.ts` y `src/calculadoras/fermentados.ts`. Ahí están
las tablas, las constantes, las cuentas, los valores por defecto, la lectura
del pedido del MCP y el texto del resultado. **Los números salen de esos
archivos y de ningún otro lado:** este documento dice cómo funcionan las
calculadoras, no cuánto vale cada porcentaje. Cambiar un valor es editar ese
archivo, y la pantalla, el MCP y los tests lo toman de ahí.

**Se apartan de R8:** no escriben ni leen nada de Drive, así que el velo no
aparece.

---

## Features

### F07.1 — La sección

#### C07.1.1 — La entrada en el menú *(J6)*

- [ ] **Herramientas**, con el ícono de la balanza, entre *Plan de la semana*
  y *Nueva receta* (`ux/information-architecture.md` §4.6).
- [ ] `#/herramientas` es destino del menú (`MENU` en `src/ui/router.ts`):
  lleva la hamburguesa en vez del volver, y su entrada queda marcada.
- [ ] La pantalla es una lista con dos entradas, cada una con una línea que
  dice qué calcula: **Pan** —*Harinas, agua, sal y levadura*— y **Sal para
  fermentados** —*La sal de un frasco*—.

#### C07.1.2 — Las rutas *(J6)*

- [ ] `#/herramientas/pan` y `#/herramientas/fermentados` son cada
  calculadora, con el volver.
- [ ] Una calculadora abierta desde una receta vuelve a la receta; abierta
  desde la lista, vuelve a la lista. Por un link directo, el volver pone el
  Recetario en su lugar, como cualquier volver (IA §4.5).
- [ ] Una ruta `#/herramientas/<otra cosa>` abre la lista.

### F07.2 — La calculadora de pan

Una sola pantalla. Cada dato es una fila de botones con una opción apretada,
como la duración en el editor (`E04-Corregir.md` C04.2.1c), y el resultado va
al pie. Los componentes propios —el interruptor, el par de cantidades y la
ficha del resultado— están en `design-system.md` §6.28.

#### C07.2.1 — Los datos, en su orden *(J6)*

- [ ] De arriba abajo:
  1. **Pan:** uno de la tabla de panes. Cada pan pone la hidratación base,
     pensada para harina 000. Cuatro son pizzas —al molde, a la piedra,
     napolitana y New York— y llevan además un peso de bollo sugerido.
  2. **Harina:** la principal, de la tabla de harinas. Cada harina suma o
     resta puntos de hidratación.
  3. **Mezclar con otra harina:** un interruptor, apagado por defecto.
     Encendido, debajo van **Otra harina** —las de la tabla **sin la
     principal**— y su **porcentaje**, con las opciones de la tabla.
  4. **Prefermento:** *Ninguno*, *Masa madre*, *Poolish*, *Biga* o *Pâte
     fermentée* (C07.2.8). Con poolish, sus horas.
  5. **Levadura:** fresca o seca. **Va después del prefermento, que dice si
     hace falta:** con masa madre no está.
  6. **Fermentación:** *Ambiente* o *En frío*; con poolish o biga no está,
     y con pâte fermentée es la de la masa final.
  7. **Horas:** las del modo elegido.
  8. **Cantidad:** dos campos en gramos en una misma fila, *Harina total* y
     *Masa total*; en una pizza, *Bollos* y *Gramos por bollo* (C07.2.4).
- [ ] Tocar una opción la aprieta y redibuja la pantalla.
- [ ] Cambiar de modo elige las primeras horas de ese modo.
- [ ] **Encender la mezcla** suma la harina integral, o la primera de la
  tabla si la principal es la integral; apagarla la saca. Elegir como
  principal la harina que estaba de segunda apaga la mezcla.

#### C07.2.2 — Las dos harinas *(J6)*

- [ ] La hidratación es la base del pan más el ajuste de la harina.
- [ ] Con dos harinas, el ajuste se pondera por su proporción: el de la
  principal por lo que queda y el de la segunda por su porcentaje.
- [ ] El resultado lleva una línea por harina, cada una con sus gramos según
  su proporción.

#### C07.2.3 — La levadura y la fermentación *(J6)*

- [ ] La levadura fresca sale de una tabla por fermentación, en % sobre la
  harina total. **La seca es la fresca dividida por una constante.**
- [ ] **La masa madre es un prefermento que leva el pan sola:** con ella no
  se elige levadura, y la que hubiera quedado elegida no cuenta.
- [ ] **La masa madre es al 100 % de hidratación** y sale de su propia tabla
  por fermentación, en % sobre la harina total. Trae la mitad de su peso en
  harina y la mitad en agua, que se descuentan de lo que hay que agregar.
- [ ] **Con masa madre no hay 2 h:** esa opción no se ofrece, y si estaba
  elegida pasa a 4 h.
- [ ] La sal es un porcentaje fijo de la harina total.
- [ ] Todos los porcentajes son de panadero: sobre la harina total, con la de
  la masa madre incluida.

#### C07.2.4 — La cantidad: manda el último escrito *(J6)*

- [ ] *Harina total* y *Masa total* son dos campos numéricos, en una misma
  fila y con las flechas de ida y vuelta en el medio. **El que se escribe
  manda** y el otro muestra lo que resulta, en gramos enteros.
- [ ] Desde la masa total, la harina sale de dividirla por uno más la
  hidratación, la sal y la levadura; con masa madre, la levadura cuenta cero,
  porque su harina y su agua ya están dentro de las otras dos.
- [ ] Ida y vuelta da lo mismo: la masa total que resulta de una harina, escrita
  en *Masa total*, devuelve esa harina.
- [ ] Se aceptan coma o punto como decimal.
- [ ] **Escribir no redibuja la pantalla:** se pintan sólo el resultado y el
  otro campo, para no sacarle el foco al que se está escribiendo.

- [ ] **Una pizza se pide en bollos:** *Bollos* y *Gramos por bollo*
  reemplazan a *Harina total* y *Masa total*, en la misma fila y con un ×
  en el medio. La masa total es los bollos
  por los gramos, y de ahí sale la harina como desde la masa total.
- [ ] Al elegir una pizza, *Gramos por bollo* toma el sugerido del estilo y
  *Bollos* conserva los que había, o arranca en 4. Cambiar de estilo vuelve
  al sugerido del nuevo.
- [ ] Al pasar de una pizza a un pan se conserva la masa total: queda
  escrita en *Masa total*.

**Edge case:** cantidad vacía, en cero, negativa o que no es un número —o
bollos así— → no hay resultado: cada línea muestra un guion y el otro campo
queda vacío.

#### C07.2.5 — El resultado *(J6)*

- [ ] Una ficha **Resultado** al pie, destacada (`design-system.md` §6.28).
  Arriba, en grande, **la masa total y la hidratación**, que son las del pan
  entero. Debajo, las filas de la ficha de ingredientes: nombre a la
  izquierda, valor a la derecha.
- [ ] En este orden: una línea por harina, el agua, la sal y la levadura
  —*Levadura fresca*, *Levadura seca* o *Masa madre*—.
- [ ] Con poolish, biga o pâte fermentée, las líneas van en dos grupos,
  **Prefermento** y **Masa final** (C07.2.8). Con masa madre no hay grupos:
  es una línea más.
- [ ] **Con masa madre, las harinas y el agua dicen «a agregar»**: son lo que
  va aparte de lo que trae la masa madre.
- [ ] Se recalcula con cada toque y cada tecla.
- [ ] **El redondeo:** gramos enteros desde 10 g; por debajo de 10 g, un
  decimal con coma; por debajo de 1 g, dos decimales, y nunca menos de
  0,01 g. Las cuentas se hacen sin redondear y se redondea sólo lo que se
  muestra.
- [ ] La hidratación se muestra como porcentaje, con un decimal si no es
  entera.

#### C07.2.6 — El tope de hidratación *(J6)*

- [ ] **La hidratación no pasa de 85 %.** Si la base del pan más el ajuste de
  las harinas da más, se usa 85 %.
- [ ] Cuando se aplicó el tope, las advertencias suman *«La hidratación se
  limitó a 85 %.»*

#### C07.2.7 — Las advertencias *(J6)*

- [ ] Debajo del resultado, siempre, como una lista:
  - *«Los tiempos son totales (primera fermentación y apresto), a unos 24 °C.
    Con frío ambiente hay que estirarlos; con calor, acortarlos.»*
  - *«En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después
    de la heladera.»*
- [ ] Y la del tope, sólo si se aplicó (C07.2.6).

#### C07.2.8 — El prefermento *(J6)*

- [ ] **Cuatro prefermentos:** la masa madre, que leva sola (C07.2.3), y
  tres con levadura comercial.
- [ ] Los de levadura comercial salen de una tabla. Cada uno dice qué
  parte de la harina total va al prefermento, su hidratación, su sal y la
  levadura fresca según sus horas, las tres sobre su harina, con la fuente
  de cada fila al lado del valor:

  | Prefermento | Harina | Hidratación | Sal | Levadura fresca | Horas |
  |---|---|---|---|---|---|
  | Poolish | 30 % | 100 % | — | 0,75 / 0,2 / 0,1 % | 8 / 12 / 18 h, a unos 23 °C |
  | Biga | 40 % | 44 % | — | 1 % | 16 a 20 h, a unos 18 °C |
  | Pâte fermentée | 27 % | 68 % | 1,4 % | 0,3 % | 14 h, a temperatura ambiente |

- [ ] **El prefermento con levadura sale del pan, no se suma:** la harina total, la
  hidratación, la sal y la masa total son las mismas; se reparten entre el
  prefermento y la masa final. Su harina sale de la principal: la segunda va
  entera a la masa final.
- [ ] **En poolish y biga, toda la levadura va en el prefermento:** la masa
  final no lleva y la pantalla no ofrece fermentación ni horas de la tabla.
- [ ] **La pâte fermentée da sabor, no levado:** la masa final lleva la
  levadura de la tabla de fermentación (C07.2.3), con sus filas.
- [ ] La levadura seca es la fresca dividida por la misma constante.
- [ ] Las advertencias suman la del prefermento —a qué temperatura y cuánto
  fermenta, y si la masa final lleva levadura—; las de los tiempos de la
  tabla van sólo si la masa final lleva levadura.

### F07.3 — La calculadora de sal

#### C07.3.1 — Sal para fermentados *(J6)*

- [ ] Tres datos, en este orden: el **fermento**, una fila de botones con los
  de la tabla de fermentos; la **temperatura del ambiente**, una fila con
  cuatro franjas —menos de 13 °C, 13 a 18, 18 a 24 y más de 24—; y el
  **peso total** en gramos.
- [ ] El peso total es **todo lo que hay en el frasco**: la verdura y, si va
  en salmuera, el agua. El campo lo dice.
- [ ] La sal es el porcentaje del fermento sobre el peso total. Es la misma
  cuenta para la sal seca y para la salmuera.
- [ ] El resultado al pie, en la misma ficha **Resultado** destacada del pan
  (C07.2.5): arriba, en grande, los gramos de sal y el porcentaje usado, con
  el mismo redondeo; debajo, el **tiempo**: cuántos días hasta empezar a
  probar, como un rango —*6 a 16 días*—.
- [ ] El tiempo sale de una tabla fermento × franja, con la fuente de cada
  fila al lado del valor. **Una franja sin fuente dice *sin dato a esta
  temperatura*:** no se extrapola.
- [ ] Debajo del resultado, la advertencia: es cuándo empezar a probar, no
  cuándo termina.
- [ ] Escribir el peso pinta sólo el resultado, sin redibujar.

**Edge case:** peso vacío, en cero, negativo o que no es un número → la sal y
el porcentaje muestran un guion; el tiempo no depende del peso y se muestra
igual.

### F07.4 — Las últimas elecciones

#### C07.4.1 — Se guardan en el teléfono *(J6)*

- [ ] Cada calculadora guarda sus elecciones y su cantidad en `localStorage`,
  **en cada cambio**, una entrada por calculadora. No van a Drive: son una
  comodidad de ese teléfono.
- [ ] Al abrirla —por el menú o por el botón *Calcular* de una receta— vuelve
  con lo último elegido.
- [ ] **Se completa dato por dato:** un dato que falta, que no se puede leer o
  que nombra una opción que ya no está en la tabla vuelve a su valor por
  defecto, y los demás se conservan.
- [ ] La lectura también corrige lo que no va junto: una segunda harina igual
  a la principal pasa a *Ninguna*, y 2 h con masa madre pasan a 4 h.
- [ ] Los valores por defecto están en el archivo de cada calculadora
  (`PAN_POR_DEFECTO`, `SAL_POR_DEFECTO`).
- [ ] Toda lectura y escritura de `localStorage` va con `try/catch`: sin
  almacenamiento —navegación privada, o un error al escribir—, la calculadora
  funciona igual, con los valores por defecto y sin recordar lo elegido.

**Edge case:** se deja la cantidad vacía o inválida y se sale → al volver a
abrir, la cantidad es la por defecto.

### F07.5 — El botón *Calcular* de la receta

#### C07.5.1 — Las marcas `pan` y `fermentado` *(J6)*

- [ ] Son dos tags especiales (`E05-Cimientos.md` C05.1.4) que dicen qué
  calculadora sirve para la receta: `pan` abre la de pan; `fermentado`, la de
  sal.
- [ ] **No tienen otra presentación:** sin ícono, sin marca en la tarjeta, sin
  chip, sin aparecer en la fila de tags de la receta y sin que la búsqueda los
  encuentre.
- [ ] Se ponen y se sacan con su botón en el editor (`E04-Corregir.md`
  C04.4.1), o los pone el agente al cargar la receta.

#### C07.5.2 — El botón *(J6)*

- [ ] Con `pan`, la receta lleva **Calcular pan**; con `fermentado`, **Calcular
  sal**; con los dos, los dos botones (`E03-LeerYCocinar.md` C03.1.2).
- [ ] **La única condición es la marca:** no importan la categoría, los
  ingredientes ni ningún otro dato de la receta.
- [ ] Va al pie de la ficha de ingredientes; si la receta no tiene
  ingredientes, en una ficha propia en ese mismo lugar.
- [ ] Abre la calculadora con las últimas elecciones (C07.4.1). **No lee la
  receta.**
- [ ] La vista de invitado no lo tiene: el link compartido no lleva tags
  especiales (`E03-LeerYCocinar.md` C03.7.3).

### F07.6 — El agente

El agente calcula con las mismas funciones que la pantalla, por el MCP local,
y lo guía el skill `herramientas` (`skills/herramientas/SKILL.md`).

#### C07.6.1 — Las herramientas del MCP *(J6)*

- [ ] `calcular_pan` y `calcular_sal`, en el servidor `recetario`. Importan
  `src/calculadoras/` y **no usan Drive ni el login**.
- [ ] Reciben los datos por su nombre en las tablas —«pan de campo», «000»,
  «centeno», «masa madre», «ambiente» o «frío»—, sin mirar mayúsculas ni
  tildes. La segunda harina es «ninguna» o una distinta de la principal.
- [ ] La cantidad es `harina_total` o `masa_total`, **una sola de las dos**;
  en una pizza, `bollos` y `peso_bollo`, con el peso sugerido del estilo como
  opción si falta.
- [ ] En `calcular_pan`, el `prefermento` es un dato más: «ninguno», «masa
  madre», «poolish», «biga» o «pâte fermentée». Con masa madre no pide la
  levadura; con poolish pide `horas_prefermento`; con poolish o biga no pide
  la fermentación ni las horas de la tabla. Con poolish, biga o pâte
  fermentée devuelve las líneas del prefermento aparte, y el resultado es el
  de la masa final.
- [ ] En `calcular_sal`, la `temperatura` es **opcional**: sin ella no hay
  tiempo ni su advertencia. Una que no es una de las franjas falta, con las
  franjas como opciones.
- [ ] **No tienen valores por defecto.** Si falta un dato o no es una opción,
  no calculan: devuelven la lista de lo que falta y, para cada dato, las
  opciones válidas.
- [ ] **Un dato cuyas opciones dependen de otro que falta no se pide
  todavía:** la segunda harina espera a la principal; las horas, al
  prefermento y al modo (con masa madre, sin 2 h); y la cantidad al pan,
  porque una pizza va en bollos. Se piden en la vuelta siguiente, así
  ninguna opción ofrecida queda inválida después. Completar un pan puede
  llevar más de una vuelta de preguntas.
- [ ] La levadura y la fermentación se piden junto con el prefermento, y
  dejan de pedirse cuando el elegido no las usa.
- [ ] Con todo, devuelven las mismas líneas que la pantalla, las advertencias
  y, en el pan, la harina total, la masa total y la hidratación.
- [ ] La descripción de cada herramienta lista las opciones tomadas de las
  tablas: si una tabla cambia, cambia ahí también.

#### C07.6.2 — El skill `herramientas` *(J6)*

- [ ] Se activa con pedidos de cálculo: las cantidades de un pan o la sal de
  un fermentado.
- [ ] Los datos que ya vienen en el pedido **no se repreguntan**.
- [ ] **No asume ningún otro dato:** pregunta los que faltan en un solo
  mensaje, en el orden de la pantalla —pan, harinas, prefermento, levadura,
  fermentación, cantidad—, con las opciones que devolvió la herramienta.
- [ ] **Los números salen siempre de `calcular_pan` o `calcular_sal`**: no
  inventa porcentajes ni hace la cuenta a mano.
- [ ] Muestra el resultado con las advertencias.
- [ ] Si el pedido viene de una receta, los datos de la receta no reemplazan
  las preguntas.

#### C07.6.3 — El skill `recetario` pone las marcas *(J6, J8)*

- [ ] `pan` va en un pan de masa con levadura o masa madre —no en un pan de
  carne ni en un budín—; `fermentado`, en un fermento con sal —chucrut,
  kimchi, encurtidos en salmuera—.
- [ ] Las pone al cargar una receta y al ordenar el recetario, sólo cuando
  corresponde.
- [ ] Un pedido de cálculo lo deriva al skill `herramientas`.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C07.1.1, C07.1.2, C07.2.1, C07.2.2, C07.2.3, C07.2.4, C07.2.5, C07.2.6, C07.2.7, C07.3.1, C07.4.1, C07.5.1, C07.5.2, C07.6.1, C07.6.2 | J6 |
| C07.6.3 | J6, J8 |

Ninguna capacidad de esta épica quedó sin job.
