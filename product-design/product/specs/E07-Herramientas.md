# E07 — Herramientas

**Job:** J6 · **Prioridad:** Baja

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas. Acá se anota solo lo
que se aparta o lo que necesita precisarse.

---

## La épica

Calcular las cantidades antes de cocinar —las de un pan: harinas, agua, sal y
levadura o masa madre; y la sal de un fermentado—, consultar un dato mientras
se cocina —cuántos minutos, a qué temperatura, cuánto dura— y medir el tiempo,
con un cronómetro y temporizadores.

Son los temporizadores, dos calculadoras, las *Referencias* y el Conversor,
en una sección propia del menú. **No leen ninguna receta
ni usan Drive:** no tocan el índice, ni el `.md`, ni la carpeta base. Una
receta marcada con `pan` o `fermentado` tiene un botón que abre la que le
corresponde, y el agente usa las mismas cuentas y las mismas tablas por el MCP.

**Toda la fórmula de cada calculadora vive en un solo archivo**, puro y sin
DOM: `src/calculadoras/pan.ts` y `src/calculadoras/fermentados.ts`. Ahí están
las tablas, las constantes, las cuentas, los valores por defecto, la lectura
del pedido del MCP y el texto del resultado. **Los números salen de esos
archivos y de ningún otro lado:** este documento dice cómo funcionan las
calculadoras, no cuánto vale cada porcentaje. Cambiar un valor es editar ese
archivo, y la pantalla, el MCP y los tests lo toman de ahí.

**Los datos de las referencias viven aparte de la lógica,** en
`src/referencias/datos/`: sólo datos, cada tabla y cada constante con su
fuente. Las cuentas, en `src/referencias/cuentas.ts`, no tienen ningún número
escrito adentro. Corregir una referencia es editar su archivo de datos;
ningún test fija un valor de las tablas.

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
- [ ] La pantalla es una lista con cinco entradas, cada una con su ícono
  adelante —como las entradas del menú lateral— y una línea que dice qué
  hace, en este orden: **Temporizadores** —*Cronómetro y cuentas
  regresivas*—, **Pan** —*Harinas, agua, sal y levadura*—, **Fermentados**
  —*Porcentaje de sal y tiempos*—, **Referencias** —*Huevos, carne, masas,
  cocción y cuánto dura cada alimento*— y **Conversor** —*Tazas, cucharas y
  gramos por ingrediente*—. Los íconos de las dos últimas son `libro` y
  `medidor`.

#### C07.1.2 — Las rutas *(J6)*

- [ ] `#/herramientas/temporizadores`, `#/herramientas/pan` y
  `#/herramientas/fermentados` son Temporizadores y cada calculadora, con el
  volver.
- [ ] `#/herramientas/referencias` es la entrada de Referencias (C07.7.1);
  con `?tag=` y `?q=`, filtrada por un tag o con lo escrito en el buscador.
  Lo que siga a `referencias/` cae en la entrada: las fichas no tienen ruta
  propia. `#/herramientas/conversor` es el Conversor (F07.11). Las dos llevan
  el volver y el ícono delante del título.
- [ ] Una calculadora abierta desde una receta vuelve a la receta; abierta
  desde la lista, vuelve a la lista. Por un link directo, el volver pone el
  Recetario en su lugar, como cualquier volver (IA §4.5).
- [ ] Una ruta `#/herramientas/<otra cosa>` abre la lista.

### F07.2 — La calculadora de pan

Una sola pantalla. **Cada dato es una fila:** su nombre a la izquierda y lo
elegido a la derecha, como un ingrediente y su cantidad. Un dato con muchas
opciones es un desplegable, que abre el selector del sistema; uno con dos a
cuatro opciones cortas es un conmutador, con todas a la vista. Las filas van
en tres fichas —el pan, sus harinas y su hidratación; cómo leva; y la
cantidad— y el resultado va al pie. Los componentes están en
`design-system.md` §6.28.

**El tipo de pan es un punto de partida, no una regla:** al elegirlo carga
todos los demás datos, y después se cambia lo que haga falta (C07.2.9).

#### C07.2.1 — Los datos, en su orden *(J6)*

- [ ] De arriba abajo, en tres fichas. **El pan, sus harinas y su
  hidratación:**
  1. **Tipo:** un desplegable con los de la tabla de panes, los panes
     primero y las pizzas —al molde, a la piedra, napolitana y New York—
     aparte. Elegirlo carga todo lo demás (C07.2.9).
  2. **Harina:** la principal, un desplegable con la tabla de harinas.
  3. **Mezclar con otra harina:** un interruptor, apagado en todos los
     tipos. Encendido, debajo van **Otra harina** —un desplegable con las de
     la tabla **sin la principal**— y su **Porcentaje**, un conmutador con
     las opciones de la tabla.
  4. **Hidratación (%):** un número que se escribe, en su fila (C07.2.2).
- [ ] **Cómo leva:**
  5. **Prefermento:** un desplegable con *Ninguno*, *Masa madre*, *Poolish*,
     *Biga* y *Pâte fermentée* (C07.2.8). Con poolish, sus horas, en un
     conmutador.
  6. **Levadura:** un conmutador, fresca o seca. **Va después del
     prefermento, que dice si hace falta:** con masa madre no está.
  7. **Fermentación:** un conmutador, *Ambiente* o *En frío*; con poolish o
     biga no está, y con pâte fermentée es la de la masa final.
  8. **Horas:** un conmutador con las del modo elegido.
  9. **Temperatura ambiente:** un conmutador con las cuatro franjas de los
     fermentados (C07.3.1), con su nombre corto —*< 13 °C*, *13–18 °C*,
     *18–24 °C*, *> 24 °C*—. Sólo si algo fermenta a la temperatura de la
     cocina: la masa, el poolish o la pâte fermentée (C07.2.3).
- [ ] **La cantidad:**
  10. Dos campos en gramos en una misma fila, *Harina total* y *Masa total*;
     en una pizza, *Bollos* y *Gramos por bollo* (C07.2.4).
- [ ] Elegir una opción —en un desplegable, un conmutador o el interruptor—
  redibuja la pantalla.
- [ ] Cambiar de modo elige las primeras horas de ese modo.
- [ ] **Encender la mezcla** suma la harina integral, o la primera de la
  tabla si la principal es la integral; apagarla la saca. Elegir como
  principal la harina que estaba de segunda apaga la mezcla.

#### C07.2.2 — La hidratación y las harinas *(J6)*

- [ ] **La hidratación es un dato más:** la carga el tipo y se puede
  escribir. Se aceptan coma o punto como decimal, y escribirla pinta sólo el
  resultado, sin redibujar (C07.2.4).
- [ ] **Cambiar la harina o la mezcla corre la hidratación** por lo que
  absorben: cada harina tiene un ajuste en puntos contra la 000 —0000, −4;
  00, +2; semolín, +3; integral, +8; centeno, +20—, y la hidratación escrita
  sube o baja por la diferencia entre las harinas de antes y las de ahora.
  Lo que se ajustó a mano se conserva.
- [ ] Con dos harinas, el ajuste se pondera por su proporción: el de la
  principal por lo que queda y el de la segunda por su porcentaje.
- [ ] El resultado lleva una línea por harina, cada una con sus gramos según
  su proporción.

**Edge case:** hidratación vacía, en cero, negativa o que no es un número →
no hay resultado, como con la cantidad (C07.2.4); queda así hasta que se
escribe o se elige un tipo.

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
- [ ] **La temperatura del ambiente cambia cuánta levadura —o masa madre—
  va, no las horas:** la tabla vale entre 18 y 24 °C, y cada franja la
  multiplica por un factor —menos de 13 °C, × 2; de 13 a 18, × 1,5; de 18 a
  24, × 1; más de 24, × 0,65—, que sale de duplicar la levadura cada 10 °C
  menos.
- [ ] **Vale para todo lo que fermenta a temperatura ambiente:** la masa, si
  no va a la heladera, y el poolish y la pâte fermentée, cuya levadura se
  multiplica por el mismo factor. Con pâte fermentée y la masa en frío,
  ajusta sólo la del prefermento.
- [ ] **No cuenta, y la fila no está,** con la masa en frío y sin esos
  prefermentos —manda la heladera—, ni con biga, que fermenta en un lugar a
  18 °C.
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

- [ ] **La hidratación no pasa de 85 %.** Si la escrita —o la que resulta de
  cambiar de harina— es mayor, la cuenta usa 85 % y el resultado muestra
  85 %; el campo conserva lo escrito.
- [ ] Cuando se aplicó el tope, las advertencias suman *«La hidratación se
  limitó a 85 %.»*

#### C07.2.7 — Las advertencias *(J6)*

- [ ] Debajo del resultado, como una lista. Con la levadura o la masa madre
  de la tabla:
  - *«Los tiempos son totales: primera fermentación y apresto.»*
  - Con la masa en frío: *«En frío, se cuentan 1 o 2 horas a temperatura
    ambiente antes y después de la heladera.»*
- [ ] Si algo fermenta a temperatura ambiente (C07.2.3): *«La levadura o la
  masa madre va según la temperatura del ambiente: con más frío, más; con
  más calor, menos.»* Con menos de 13 °C, además: *«Por debajo de 10 °C esta
  cuenta deja de valer: la masa casi no fermenta.»*
- [ ] La del prefermento, si hay uno con levadura (C07.2.8).
- [ ] Y la del tope, sólo si se aplicó (C07.2.6).

#### C07.2.8 — El prefermento *(J6)*

- [ ] **Cuatro prefermentos:** la masa madre, que leva sola (C07.2.3), y
  tres con levadura comercial.
- [ ] **Con uno elegido, debajo de su fila va su explicación,** cerrada:
  *«Qué es la biga»*. Al tocarla se despliega un párrafo que dice qué es,
  cuánto y dónde fermenta, y si la masa final lleva levadura. Sin
  prefermento no está, y vuelve a cerrarse cada vez que se elige algo.
- [ ] Los de levadura comercial salen de una tabla. Cada uno dice qué
  parte de la harina total va al prefermento, su hidratación, su sal y la
  levadura fresca según sus horas, las tres sobre su harina, con la fuente
  de cada fila al lado del valor:

  | Prefermento | Harina | Hidratación | Sal | Levadura fresca | Horas |
  |---|---|---|---|---|---|
  | Poolish | 30 % | 100 % | — | 0,75 / 0,2 / 0,1 % | 8 / 12 / 18 h, a temperatura ambiente |
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

#### C07.2.9 — El tipo es un punto de partida *(J6)*

- [ ] **Cada tipo trae** su harina, su hidratación, su prefermento —con sus
  horas—, su levadura y su fermentación, en la tabla de tipos:

  | Tipo | Harina | Hidratación | Prefermento | Levadura | Fermentación |
  |---|---|---|---|---|---|
  | Pan francés | 000 | 60 % | Ninguno | Fresca | Ambiente, 4 h |
  | Pan de molde | 000 | 62 % | Ninguno | Fresca | Ambiente, 4 h |
  | Pan de miga | 000 | 56 % | Ninguno | Fresca | Ambiente, 2 h |
  | Baguette | 000 | 68 % | Poolish, 12 h | Fresca | — |
  | Pan de campo | 000 | 72 % | Masa madre | — | Ambiente, 8 h |
  | Ciabatta | 000 | 80 % | Biga | Fresca | — |
  | Focaccia | 000 | 75 % | Ninguno | Fresca | Ambiente, 4 h |
  | Pizza al molde | 000 | 61 % | Ninguno | Fresca | Ambiente, 4 h |
  | Pizza a la piedra | 000 | 57 % | Ninguno | Fresca | Ambiente, 4 h |
  | Pizza napolitana | 00 | 65 % | Ninguno | Fresca | Ambiente, 8 h |
  | Pizza New York | 000 | 65 % | Ninguno | Fresca | En frío, 24 h |

- [ ] Ninguno trae mezcla de harinas. La hidratación de cada tipo es la de su
  harina.
- [ ] **Elegir un tipo vuelve todo el formulario a lo que trae el tipo**,
  también lo que se había ajustado a mano, y también si es el mismo tipo.
- [ ] **No son parte del tipo, y se conservan,** la temperatura del ambiente
  y la cantidad —que pasa a bollos si el tipo es una pizza, y a gramos si no
  (C07.2.4)—.
- [ ] Después de elegir el tipo se cambia cualquier dato, y el tipo sigue
  mostrando de cuál se partió.
- [ ] El tipo de fermento hace lo mismo con su porcentaje de sal (C07.3.1).
- [ ] **La cuenta no mira el tipo:** usa sólo los datos del formulario.

### F07.3 — La calculadora de sal

#### C07.3.1 — Fermentados *(J6)*

- [ ] La pantalla se titula **Fermentados**, como su entrada en la lista.

- [ ] Cuatro datos, con las filas de la calculadora de pan (F07.2). En una
  ficha: el **tipo**, un desplegable con los de la tabla de fermentos; la
  **sal (%)**, un número que se escribe y que las flechas suben y bajan de
  a 0,1 %; y la **temperatura ambiente**, un
  conmutador con cuatro franjas —menos de 13 °C, 13 a 18, 18 a 24 y más de
  24—. En otra, el **peso total** en gramos.
- [ ] **El tipo de fermento es un punto de partida, como el de pan
  (C07.2.9):** elegirlo carga el porcentaje de sal que sugiere —chucrut,
  2 %; kimchi, 2,5 %; ajíes y verduras en salmuera, 3 %; pepinos, 3,5 %—, y
  pisa el que estuviera escrito, también si es el mismo tipo. Después se
  cambia. El peso y la temperatura no son del tipo: se conservan.
- [ ] El peso total es **todo lo que hay en el frasco**: la verdura y, si va
  en salmuera, el agua. Lo dice una línea debajo del campo.
- [ ] La sal es el porcentaje escrito sobre el peso total. Es la misma
  cuenta para la sal seca y para la salmuera. **La cuenta no mira el tipo.**
- [ ] El resultado al pie, en la misma ficha **Resultado** destacada del pan
  (C07.2.5): arriba, en grande, los gramos de sal y el porcentaje usado, con
  el mismo redondeo; debajo, el **tiempo**: cuántos días hasta empezar a
  probar, como un rango —*6 a 16 días*—.
- [ ] El tiempo es del tipo, no del porcentaje de sal: sale de una tabla
  fermento × franja, con la fuente de cada
  fila al lado del valor. **Una franja sin fuente dice *sin dato a esta
  temperatura*:** no se extrapola.
- [ ] Debajo del resultado, la advertencia: es cuándo empezar a probar, no
  cuándo termina.
- [ ] Escribir el peso pinta sólo el resultado, sin redibujar.

**Edge case:** peso o porcentaje de sal vacío, en cero, negativo o que no es
un número → la sal y el porcentaje muestran un guion; el tiempo no depende de
ellos y se muestra igual. Un porcentaje vacío queda así hasta que se escribe
o se elige un tipo.

### F07.4 — Las últimas elecciones

#### C07.4.1 — Se guardan en el teléfono *(J6)*

- [ ] Cada calculadora guarda sus elecciones y su cantidad en `localStorage`,
  **en cada cambio**, una entrada por calculadora. No van a Drive: son una
  comodidad de ese teléfono.
- [ ] Al abrirla —por el menú o por el botón *Calcular* de una receta— vuelve
  con lo último elegido.
- [ ] **Se completa dato por dato:** un dato que falta, que no se puede leer o
  que nombra una opción que ya no está en la tabla vuelve a su valor por
  defecto —en el pan, a lo que trae el tipo guardado—, y los demás se
  conservan.
- [ ] La lectura también corrige lo que no va junto: una segunda harina igual
  a la principal pasa a *Ninguna*, y 2 h con masa madre pasan a 4 h.
- [ ] Los valores por defecto están en el archivo de cada calculadora
  (`PAN_POR_DEFECTO`, `SAL_POR_DEFECTO`). El pan arranca en *Pan de campo*,
  como viene, con 1 kg de harina.
- [ ] Toda lectura y escritura de `localStorage` va con `try/catch`: sin
  almacenamiento —navegación privada, o un error al escribir—, la calculadora
  funciona igual, con los valores por defecto y sin recordar lo elegido.

**Edge case:** se deja la cantidad o la hidratación vacía o inválida y se sale
→ al volver a abrir, la cantidad es la por defecto y la hidratación, la del
tipo.

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

### F07.5b — Temporizadores

#### C07.5b.1 — El cronómetro y los temporizadores *(J6)*

- [ ] `#/herramientas/temporizadores`, título «Temporizadores», con volver. Tres partes, en este orden: **Cronómetro** —el tiempo grande, *Reiniciar* (deshabilitado en cero) e *Iniciar*/*Parar*—; **los temporizadores**, una ficha cada uno en orden de creación, con nombre, tiempo, barra de avance y tres botones: *+1'*, pausa o seguir, y sacar; **Nuevo temporizador**: nombre opcional, tres ruedas —horas 0–23, minutos y segundos 0–59, con tope circular— y *Empezar*, deshabilitado en 0:00:00. Un temporizador es una cuenta regresiva: baja hasta cero y avisa.
- [ ] Un temporizador sin nombre se llama por su duración: *10 min*, *1 h 20 min*, *45 s*.
- [ ] El tiempo se escribe `m:ss` hasta 59:59 y `h:mm:ss` de una hora en adelante, en todos lados.
- [ ] Pausado, el tiempo no baja y va en `--fg-2`. *+1'* suma un minuto; sobre uno terminado, vuelve a correr desde 1:00 contado desde ahora.
- [ ] Terminado: el tiempo dice «¡Listo!», sin barra, con *+1'* y *Parar*; *Parar* lo saca.
- [ ] Todo se cuenta por fecha contra el reloj del teléfono, nunca por tics: no se atrasa y sobrevive a recargar y a cerrar la app. Se guarda en `localStorage` (`recetario.temporizadores`) en cada cambio, con la última duración puesta en las ruedas, que es con la que se abre la próxima vez (10 min la primera). Lo que no se puede leer se toma como sin temporizadores.
- [ ] Mientras corre algún temporizador o el cronómetro, la pantalla no se apaga (wake lock propio, repedido a cada tic si se perdió). Uno pausado o uno terminado no cuentan.

#### C07.5b.2 — El aviso y la tira *(J6)*

- [ ] Al llegar a cero, suena un pitido corto (Web Audio, sin archivo) y vibra, cada 2 s hasta *Parar* o un minuto. Si terminan varios, el aviso es uno; *Parar* corta el aviso y saca ese temporizador; los demás terminados quedan en «¡Listo!», callados.
- [ ] **Sólo con la app a la vista.** Con la pantalla apagada, la app cerrada o en segundo plano no hay aviso: al volver, el temporizador aparece terminado y avisa en el primer segundo. Después de recargar, el navegador no deja sonar ni vibrar hasta el primer toque: la tira igual dice «¡Listo!». Uno que ya avisó y no se sacó vuelve a avisar al recargar.
- [ ] **La tira**: toda pantalla —salvo Temporizadores y la vista de invitado— lleva al pie una tira fija de 56 px mientras haya un temporizador corriendo o terminado sin sacar, o el cronómetro corriendo. **Rota cada 5 s** por todos, en el orden de la pantalla —el cronómetro y después los temporizadores en orden de creación—: reloj, nombre («Cronómetro» para el cronómetro) y tiempo; uno terminado, «¡Listo!» con *Parar*. Los pausados no entran. Con más de uno lleva su lugar entre todos («2/3») y una flecha en cada punta para pasar a mano; **deslizar** sobre la tira a la izquierda pasa al siguiente y a la derecha al anterior, sin abrir el menú lateral. Pasar a mano empieza un turno entero. **El contenido del turno nuevo entra deslizándose** desde el lado al que se pasó, y la tira —su fondo y las flechas— queda quieta; sin animación con movimiento reducido. El primer turno dura entero desde que aparece la tira. Tocarla fuera de las flechas y de *Parar* abre Temporizadores. Los pies pegados de la receta y del plan suben lo que mide la tira.

### F07.6 — El agente

El agente calcula con las mismas funciones que la pantalla, por el MCP local,
y lo guía el skill `herramientas` (`skills/herramientas/SKILL.md`).

#### C07.6.1 — Las herramientas del MCP *(J6)*

- [ ] `calcular_pan` y `calcular_sal`, en el servidor `recetario`. Importan
  `src/calculadoras/` y **no usan Drive ni el login**.
- [ ] Reciben los datos por su nombre en las tablas —«pan de campo», «000»,
  «centeno», «masa madre», «ambiente» o «frío»—, sin mirar mayúsculas ni
  tildes. La segunda harina es «ninguna» o una distinta de la principal.
- [ ] **En `calcular_pan`, el tipo (`pan`) precarga, como en la pantalla:**
  con él, lo que no viene sale de lo que trae el tipo (C07.2.9), y lo que
  viene lo pisa. El agente pasa sólo lo que el usuario dijo.
- [ ] **Sin tipo, calcula si vienen todos los datos.** Si falta alguno, entre
  lo que falta va primero el tipo, que es la forma corta de darlos.
- [ ] **Nunca salen del tipo** la cantidad ni la temperatura del ambiente:
  se piden. Tampoco lo que depende de un dato que se cambió: el porcentaje
  de una segunda harina, las horas de otro prefermento y las horas que no
  van con el modo o el prefermento pedidos.
- [ ] La `hidratacion` que no viene es la del tipo, corrida por las harinas
  pedidas (C07.2.2).
- [ ] La cantidad es `harina_total` o `masa_total`, **una sola de las dos**;
  en una pizza, `bollos`, con el `peso_bollo` del tipo si no viene.
- [ ] Un tipo que no existe se corrige antes que nada: es lo único que
  falta.
- [ ] En `calcular_pan`, el `prefermento` es un dato más: «ninguno», «masa
  madre», «poolish», «biga» o «pâte fermentée». Con masa madre no pide la
  levadura; con poolish pide `horas_prefermento`; con poolish o biga no pide
  la fermentación ni las horas de la tabla. Con poolish, biga o pâte
  fermentée devuelve las líneas del prefermento aparte, y el resultado es el
  de la masa final.
- [ ] **En `calcular_sal`, el tipo (`fermento`) precarga igual:** con él, el
  `porcentaje_sal` que no viene es el que sugiere el tipo, y el que viene lo
  pisa. Sin tipo, calcula si viene el porcentaje; si no, lo primero que falta
  es el tipo. El `peso_total` se pide siempre.
- [ ] En `calcular_sal`, la `temperatura` es **opcional**: sin ella no hay
  tiempo ni su advertencia. Una que no es una de las franjas falta, con las
  franjas como opciones. El tiempo es del tipo: sin tipo no hay.
- [ ] **Lo que no sale de un tipo no se completa.** Si falta un dato o no es
  una opción, no calculan: devuelven la lista de lo que falta y, para cada
  dato, las opciones válidas.
- [ ] **Un dato cuyas opciones dependen de otro que falta no se pide
  todavía:** la segunda harina espera a la principal; las horas, al
  prefermento y al modo (con masa madre, sin 2 h); y la cantidad al tipo,
  porque una pizza va en bollos. Se piden en la vuelta siguiente, así
  ninguna opción ofrecida queda inválida después. Completar un pan puede
  llevar más de una vuelta de preguntas.
- [ ] La levadura, la fermentación y la `temperatura` del ambiente se piden
  junto con el prefermento, y dejan de pedirse cuando lo elegido no las usa:
  la levadura con masa madre, la fermentación con poolish o biga, y la
  temperatura con biga o con la masa en frío sin poolish ni pâte fermentée.
- [ ] Con todo, devuelven las mismas líneas que la pantalla, las advertencias
  y, en el pan, la harina total, la masa total, la hidratación y **`usado`:
  los datos con que se calculó**, para que el agente los muestre: con el
  tipo, parte no la pidió nadie.
- [ ] La descripción de cada herramienta lista las opciones tomadas de las
  tablas: si una tabla cambia, cambia ahí también.
- [ ] **Las referencias también están en el MCP** (C07.6.4), con las mismas
  tablas y cuentas que la pantalla.

#### C07.6.2 — El skill `herramientas` *(J6)*

- [ ] Se activa con pedidos de cálculo: las cantidades de un pan o la sal de
  un fermentado.
- [ ] Los datos que ya vienen en el pedido **no se repreguntan**.
- [ ] **En un pan, parte del tipo:** pregunta el tipo, la cantidad y la
  temperatura del ambiente, y pasa además sólo lo que el usuario dijo. No
  pregunta lo que el tipo ya trae.
- [ ] **En un fermentado, igual:** pregunta el tipo y el peso, y pasa el
  porcentaje de sal sólo si el usuario lo dijo.
- [ ] **No asume ningún dato por su cuenta:** lo que la herramienta devuelve
  como faltante lo pregunta en un solo mensaje, con sus opciones.
- [ ] Muestra los datos usados junto al resultado, para que el usuario vea
  qué trajo el tipo y pueda cambiarlo.
- [ ] **Los números salen siempre de `calcular_pan` o `calcular_sal`**: no
  inventa porcentajes ni hace la cuenta a mano.
- [ ] Muestra el resultado con las advertencias.
- [ ] Si el pedido viene de una receta, los datos de la receta no reemplazan
  las preguntas.
- [ ] **El mismo skill cubre las referencias** (C07.6.5): su `description`
  nombra los temas de Referencias y del Conversor y no pasa de 1.024
  caracteres.

#### C07.6.3 — El skill `recetario` pone las marcas *(J6, J8)*

- [ ] `pan` va en un pan de masa con levadura o masa madre —no en un pan de
  carne ni en un budín—; `fermentado`, en un fermento con sal —chucrut,
  kimchi, encurtidos en salmuera—.
- [ ] Las pone al cargar una receta y al ordenar el recetario, sólo cuando
  corresponde.
- [ ] Un pedido de cálculo, o de un dato de cocina, lo deriva al skill `herramientas`.

#### C07.6.4 — Las herramientas de referencia del MCP *(J6)*

- [ ] **`consultar_referencia`**, en el servidor `recetario`. Sin nada, lista
  todas las tablas y todas las cuentas de Referencias y del Conversor, con el
  `id`, el título y los tags de cada una —las del Conversor no llevan—, y el
  nombre de la herramienta del MCP de cada cuenta. Con `tabla`, devuelve esa
  tabla con los nombres de sus columnas, sus filas, sus notas y sus fuentes.
  Con `buscar` devuelve las filas de cualquier tabla cuyo texto lo contenga,
  sin mirar mayúsculas ni tildes, cada una con su tabla y sus fuentes. Una
  `tabla` que no existe devuelve `error` con los ids válidos.
- [ ] **Una herramienta por cuenta,** `calcular_<id>` con guiones bajos,
  registrada desde la declaración de la cuenta, así que su esquema son sus
  entradas: `calcular_molde`, `calcular_pasta_fresca`,
  `calcular_bollo_pizza`, `calcular_merengue`, `calcular_punto_azucar`,
  `calcular_arroz`, `calcular_agua_sal_pasta`, `calcular_medidor_espagueti`,
  `calcular_caldo` y `calcular_conversion`. Importan `src/referencias/` y **no usan Drive ni el
  login.**
- [ ] **El esquema de cada número dice su valor por defecto,** y el de cada
  opción, las que acepta y cuál es la de por defecto. Lo que no viene y tiene
  valor por defecto se completa; las opciones se reciben por su nombre, sin
  mirar mayúsculas ni tildes.
- [ ] **La respuesta de una `calcular_*`:** `{ resultado, tabla?, advertencias,
  notas, fuentes }` —`resultado` es la lista de líneas con nombre y valor;
  `tabla`, si la cuenta trae una, como los puntos del azúcar; `notas`, las de
  la cuenta; `fuentes`, las de las constantes que usó—. Si falta un dato que no
  tiene valor por defecto, `{ faltan: [{ dato, opciones? }] }`, la misma forma
  que `calcular_pan`; `opciones` sólo en un dato de opciones. Si con esos
  valores no se puede calcular, `{ error }`.
- [ ] La descripción de `consultar_referencia` enumera sus temas y dice que se
  use antes de responder con lo que el agente sepa; la de cada `calcular_*`
  dice para qué pregunta sirve. El agente las ve aunque no cargue el skill.

#### C07.6.5 — Las referencias en el skill `herramientas` *(J6)*

- [ ] **Es el mismo skill que las calculadoras:** una sección propia, *Las
  referencias*, y una `description` que cubre las dos cosas con sus temas y dos
  ejemplos.
- [ ] **Los números salen siempre de `consultar_referencia` o de su
  `calcular_*`,** nunca de lo que el agente sepa.
- [ ] **La respuesta cita la fuente con su nombre y su link.**
- [ ] **Si la tabla no tiene el dato, lo dice.** Sólo si el usuario lo pide,
  contesta con conocimiento general, aclarando que no sale de las referencias.
- [ ] Con `faltan`, pregunta todo lo que falta **en un solo mensaje**, con sus
  opciones. Con `error`, dice que esos valores no se pueden calcular y pide
  otros coherentes.
- [ ] Nombra cada `calcular_*` y dice para qué pregunta sirve.
- [ ] Un test verifica que la `description` de cada skill no pasa de 1.024
  caracteres y que toda herramienta que registra el MCP está nombrada en
  algún skill.

### F07.7 — Referencias

**Referencias** son datos para mirar mientras se cocina, en tablas y cuentas,
cada una con su fuente. Es una sola pantalla: una lista de fichas que se
despliegan en el lugar. Se llega a una ficha por la lista, por un tag o por el
buscador. Las fichas van, en este orden, en C07.7.5 (huevos, carne, aceite,
horno y bebidas), F07.9 (arroz, granos, legumbres, pasta, verduras y caldo),
F07.8 (masas y dulces) y F07.10 (conservación). No leen recetas ni usan
Drive, así que el velo no aparece. El Conversor es aparte (F07.11).

#### C07.7.1 — La entrada *(J6)*

- [ ] **Arriba,** el encabezado con el volver, el ícono `libro` y
  *Referencias* (`design-system.md` §6.12 y §6.30); debajo, el buscador
  —*Buscar*— y una fila de chips con los tags, en orden alfabético, en
  renglones.
- [ ] **Sin tag ni texto, una sola lista:** cada ficha es una fila con su
  título, en el orden de C07.7.5, F07.9, F07.8 y F07.10. Tocarla despliega la ficha ahí mismo (C07.7.3), y tocarla de
  nuevo la cierra. Se pueden abrir varias a la vez. Al entrar, todo está
  cerrado.
- [ ] **Un tag a la vez:** tocar uno oculta las fichas que no lo tienen; no
  abre nada. Tocar el activo lo saca;
  tocar otro lo reemplaza.
- [ ] **Con texto,** la lista se reemplaza por los resultados (C07.7.2); con
  un tag activo, se busca sólo en sus fichas.
- [ ] **El tag y el texto viajan en la ruta**
  (`#/herramientas/referencias?tag=pasta&q=crema`): el volver desde otra
  pantalla encuentra la entrada como estaba. Elegir o sacar un tag reemplaza
  la ruta y redibuja. Escribir también la cambia, pero sin redibujar: pinta
  sólo lo de debajo de los tags, y el foco y el teclado quedan en la caja.
  Entrar desde Herramientas abre la entrada sin tag ni texto. **Lo abierto no
  se guarda.**
- [ ] Un `tag` de la ruta que no está entre los de las fichas se saca de la
  ruta.

#### C07.7.2 — Los resultados del buscador *(J6)*

- [ ] Busca sin mirar mayúsculas ni tildes, como la búsqueda de recetas, en
  el título y los tags de cada ficha y en todas las celdas de cada tabla,
  agrupada o no. **Lo buscado se resalta** donde aparece —en las celdas y en
  los títulos—, tal como está escrito: «limon» resalta «limón».
- [ ] **Una tabla con filas que coinciden** aparece desplegada: el título de
  la ficha, el encabezado de la tabla con sus unidades y sólo esas filas; en
  una tabla agrupada, cada fila bajo el título de su grupo. El botón de
  minutos se dibuja como en la ficha.
- [ ] **Una ficha que coincide sólo por su título o un tag** aparece
  cerrada; al tocarla se despliega entera. Una que coincide también por sus
  filas aparece una sola vez, desplegada. Una cuenta se encuentra por su
  título y sus tags, no por lo que calcula.
- [ ] Primero van las fichas que coinciden por título o tag y después las
  tablas, las dos en el orden del índice.
- [ ] Sin nada, *Nada con «<lo escrito>».*

#### C07.7.3 — La ficha *(J6)*

- [ ] **Una ficha se despliega en la entrada,** debajo de la fila con su
  título; no tiene pantalla ni ruta propias y no muestra sus tags.
- [ ] **Una tabla** lleva el encabezado con las unidades, las filas con la
  primera columna en peso 600 y, debajo, sus notas. Una tabla ancha se
  desplaza de costado dentro de su ficha; la página no.
- [ ] **Una cuenta** lleva sus datos en filas, como las calculadoras
  (`design-system.md` §6.28), y debajo el resultado: sus líneas, la tabla del
  resultado si la tiene, las advertencias y la fuente; después, las notas de
  la cuenta.
- [ ] **Al pie de cada ficha, la fuente:** «Fuente: <nombre>», con el link.
  Una ficha con varias fuentes las lista todas, una vez por link. Una tabla de varias fuentes dice en cada fila
  cuál es la suya.
- [ ] **Lo que se muestra es lo que se calcula:** cada cuenta aplica sus
  valores por defecto y descarta lo inválido. Un campo vacío que tiene valor
  por defecto calcula con ese valor; una opción guardada que ya no existe
  vuelve a la de por defecto.
- [ ] Escribir un número pinta sólo el resultado de esa cuenta; elegir una
  opción pinta la cuenta entera, porque puede cambiar qué datos se ven. Ninguna
  de las dos redibuja la pantalla: la ficha sigue abierta.
- [ ] Lo escrito se guarda en `localStorage` en cada cambio
  (`recetario.referencias`), una sola entrada para todas las cuentas, como
  las calculadoras (C07.4.1); toda lectura y escritura va con `try/catch`.

**Edge case:** un dato vacío sin valor por defecto, en cero, negativo o que
no es un número → la cuenta no tiene resultado; el bloque queda vacío, nunca
un error.

#### C07.7.4 — Los tags *(J6)*

- [ ] Cada ficha de Referencias lleva al menos un tag; se declaran por ficha
  en `src/referencias/indice.ts`, el mismo lugar que ordena las fichas. Las
  fichas del Conversor no llevan.
- [ ] Son catorce: *arroz*, *bebidas*, *carne*, *conservación*, *dulces*,
  *fritura*, *horno*, *huevo*, *legumbres y granos*, *masas*, *olla a
  presión*, *pasta*, *pollo* y *verduras*. Un tag junta fichas de temas
  distintos: *pasta* lleva la pasta fresca y la comprada, el agua y la sal,
  el tiempo y el medidor de espagueti.

#### C07.7.5 — Las fichas de huevos, carne, aceite, horno y bebidas *(J6)*

- [ ] Son las primeras de la lista; las siguen las de F07.9. En este orden: **Huevos**, **Temperatura interna segura**, **Puntos de
  la carne vacuna**, **Aceite para freír**, **Punto de humo**, **Horno**,
  **Mate**, **Té**, **Vinos y espumantes** y **Cervezas y gaseosas**.
- [ ] **Huevos:** los minutos en agua hirviendo, para el huevo de heladera y
  a temperatura ambiente, sólo del grande, y los minutos desde agua fría,
  con su propia fuente; en cuatro puntos: pasado por agua, mollet, yema
  cremosa y duro.
- [ ] **Temperatura interna segura:** la de seguridad por alimento y su
  reposo.
- [ ] **Puntos de la carne vacuna:** la tabla de un frigorífico argentino con
  sus nombres.
- [ ] **Aceite para freír:** la temperatura, el tiempo y la interna por
  alimento, recortada a lo de uso local y con las milanesas; el punto de
  humo de cada aceite va en su propia ficha.
- [ ] **Horno:** la escala de nombres con su rango, y en la misma tabla,
  cuánto se baja la temperatura con ventilador.
- [ ] **Bebidas:** el agua del mate y del mate cocido; el té por tipo, con el
  agua, la infusión y las hebras por 100 ml, y su botón de minutos (C07.9.3);
  los vinos y espumantes y las cervezas, con las
  gaseosas, a la temperatura a la que se sirven.

### F07.8 — Las fichas de masas y dulces

Las fichas de Referencias (F07.7) de moldes, piezas, pasta, pizza, azúcar y
merengue, después de las de F07.9: tres tablas de consulta y cinco cuentas, de la masa para un molde
a los puntos del azúcar.

#### C07.8.1 — Las fichas de masas y dulces *(J6)*

- [ ] En este orden: **Masa para un molde**, **Gramos de masa por pieza**,
  **Pasta fresca**, **Pasta comprada: cuánto por persona**,
  **Masas por plato**, **Bollo de pizza**, **Puntos del azúcar** y
  **Merengue**.
- [ ] **Gramos de masa por pieza:** una fuente por receta; el pan de molde va
  en dos filas, artesanal y lacteado.
- [ ] **Masas por plato:** las tapas de empanada caseras, la tapa comprada, la
  tortilla de maíz, el ramen, las tapas de dumplings y la tortilla de harina,
  cada una con su fuente a la vista.
- [ ] **Pasta comprada** es una tabla de consulta, no una cuenta: cuánto por
  persona.

#### C07.8.2 — La masa para un molde *(J6)*

- [ ] **Molde** es el primer dato. *Con sus medidas* pide la forma —redondo,
  cuadrado o rectangular, o con tubo— y sus medidas en cm; con un atajo, el
  molde trae su forma y sus medidas.
- [ ] Los atajos son tipos de molde —tartera, bizcochuelo, tortera de boda,
  boda alta y pizzera, cada uno con su rango de números del catálogo— más las
  placas y las budineras, con medidas fijas. Con un tipo que no tiene
  diámetro, el número del molde se escribe aparte, como *Diámetro*.
- [ ] El **llenado** es un dato en %, con valor por defecto. El resultado es
  la capacidad en litros y los gramos de masa cruda, que salen de la
  capacidad por el llenado por una densidad. Un llenado de menos de 1 % o de
  más de 100 % no calcula: no hay resultado y la advertencia dice *El llenado
  va de 1 a 100 %.*
- [ ] El diámetro del tubo de un molde con tubo tiene que ser menor que el
  diámetro del molde; si no, no hay resultado.
- [ ] Las notas de la cuenta, y la fuente de la densidad, el llenado y el
  molde elegido, se muestran en la ficha. Cada budinera cita su propia fuente;
  los demás atajos, la del catálogo de El Nuevo Emporio.

#### C07.8.3 — La pasta fresca *(J6)*

- [ ] **Pasta fresca:** *porciones* —con valor por defecto— y *masa*: al
  huevo, de yemas, de sémola, rellena de carne, rellena de ricota o verdura, y
  ñoquis. El resultado son los ingredientes de esa masa para esas porciones
  —harina, huevos, yemas, agua, relleno o puré—, con las notas y la
  advertencia de la masa. La sal es «una pizca».
- [ ] Los huevos y las yemas se muestran enteros o con su fracción común
  (½, ⅓, ⅔…); si no hay una, con un decimal.

#### C07.8.4 — El bollo de pizza, los puntos del azúcar y el merengue *(J6)*

- [ ] **Bollo de pizza:** el *estilo* —napolitana o al molde—, el *diámetro o
  número de molde* y cuántas *pizzas*. El resultado es lo que pesa cada bollo
  y la masa total.
- [ ] En la **napolitana** manda la tabla de la AVPN: un diámetro entre dos
  filas usa la fila de menor diámetro; fuera del rango de la tabla no hay resultado y
  la advertencia dice el rango. Una de sus filas es un punto medio propio, no
  de la AVPN, y la nota de la ficha lo dice.
- [ ] **Al molde,** un número de molde de la tabla da su rango de gramos; uno
  que no está se calcula por superficie.
- [ ] **Puntos del azúcar:** se ajustan *por la altitud* o por *el hervor
  medido*. El resultado es una tabla —punto, °C, prueba en agua fría y
  usos—, con cada temperatura corrida por la diferencia entre 100 °C y donde
  hierve el agua. La altitud vacía es 0. Un hervor medido de menos de 70 °C o
  de más de 100 °C no corre la tabla: la advertencia dice *El agua hierve
  entre 70 y 100 °C; revisá la lectura del termómetro.*
- [ ] **Merengue:** los gramos de *claras* y el *tipo* —francés, suizo o
  italiano—. El resultado es el azúcar, el impalpable, el azúcar y el agua del
  almíbar que el tipo usa, y la temperatura, con la nota del tipo.

### F07.9 — Las fichas de arroz, granos, legumbres, pasta, verduras y caldo

Las fichas de Referencias (F07.7) que siguen a las de C07.7.5.

#### C07.9.1 — Las fichas de cocción *(J6)*

- [ ] En este orden: **Agua para el arroz**, **Arroz en olla**, **Arroz en
  olla a presión**, **Granos**, **Legumbres**, **Legumbres en olla a
  presión**, **Agua y sal para la pasta**, **Tiempo de pasta seca**,
  **Medidor de espagueti**, **Verduras al vapor y hervidas**, **Blanqueado** y
  **Caldo**.
- [ ] **Arroz en olla:** la tabla por variedad, con el agua en partes por
  volumen y por gramo de arroz y el tiempo; la regla general es una nota.
- [ ] **Granos y legumbres:** líquido, tiempo y rendimiento por grano o
  legumbre; las legumbres, además, el remojo. La polenta instantánea dice
  «según el paquete».
- [ ] **Tiempo de pasta seca:** el rango entre marcas por formato, con la nota
  «manda el paquete».
- [ ] **Verduras al vapor y hervidas:** las verduras de la fuente.
- [ ] **Blanqueado:** los minutos por verdura, con la nota del enfriado en agua con hielo, y su
  botón de minutos (C07.9.3).

#### C07.9.2 — Las cuentas de cocción *(J6)*

- [ ] **Agua para el arroz:** los gramos de arroz y la variedad; da el agua y
  el tiempo. Una variedad sin agua por gramo dice las partes por volumen.
- [ ] **Agua y sal para la pasta:** los gramos de pasta seca; da los litros de
  agua y los gramos de sal.
- [ ] **Medidor de espagueti:** *Tengo* los gramos o el diámetro del atado, y
  la *cantidad*; da el otro de los dos.
- [ ] **Caldo:** los kilos de huesos y el tipo —ave, vaca o pescado—; da el
  agua, el mirepoix y su reparto en cebolla, zanahoria y apio, y el tiempo. El
  procedimiento es la nota de la ficha.

#### C07.9.3 — El botón de minutos *(J6)*

- [ ] Una columna marcada como de minutos dibuja, en cada fila que tiene un
  número, un botón chico con el reloj. Tocarlo **crea un temporizador** con el
  nombre de la fila y esos minutos —el mínimo, si es un rango; «1½» es 1,5—,
  igual que *Empezar* en Temporizadores (C07.5b.1). El temporizador queda en
  la tira como cualquier otro.
- [ ] Lo llevan el **blanqueado** (cada verdura) y el **té** (cada tipo). El
  nombre es la primera columna más la siguiente columna de texto sin unidad,
  si la fila la tiene —«Espárragos, finos»—; en el té, sólo el tipo —«Verde»—.
- [ ] Una fila sin número en esa columna no lleva el botón.

### F07.10 — La ficha de conservación

La última ficha de Referencias (F07.7): cuánto dura cada alimento en la
alacena, la heladera y el freezer. Un alimento se encuentra con el buscador
de Referencias (C07.7.2).

#### C07.10.1 — La tabla de conservación *(J6)*

- [ ] Es **una sola tabla** con los alimentos en grupos por categoría
  —carnes, aves, pescados y mariscos, fiambres y embutidos, huevos, lácteos,
  frutas, verduras y hortalizas, panificados y masas, secos y de alacena,
  salsas y condimentos, y comidas cocidas y sobras—. Cada fila lleva el
  alimento, cuánto dura en la alacena, la heladera y el freezer, las notas y
  su fuente.
- [ ] **Cada fila nombra su fuente** con una abreviatura; al pie está la
  lista de abreviaturas, con el nombre y el link de cada una. La celda puede
  nombrar varias, separadas por espacio o coma.
- [ ] La comida cocida y las sobras duran lo que dice ANMAT; recongelar es
  «nunca», salvo lo crudo descongelado que, una vez cocinado, se congela
  cocido. La carne cruda sale de SENASA para vaca, cerdo y cordero, y la de
  pollo y pescado, de FoodKeeper. Una fila que agrupa por analogía lo dice en
  su nota.

### F07.11 — Conversor

Pasar una cantidad de cocina de una unidad a las demás y, con un ingrediente,
de volumen a peso. Sirve para recetas de afuera y para las caseras de acá.
Los datos están en `src/referencias/datos/conversor.ts`; de dónde sale cada
uno, en `verificacion-conversor.md`.

Es una herramienta aparte de Referencias, con su pantalla: el encabezado con
el volver, el ícono `medidor` y *Conversor*; arriba, el buscador y el índice
de sus fichas como chips —tocar uno lleva a su ficha—; debajo, todas sus
fichas juntas, que se dibujan y guardan lo escrito como las de Referencias
(C07.7.3), bajo la clave `recetario.conversor`.

#### C07.11.1 — La cuenta *(J6)*

- [ ] **Entradas:** la cantidad (un número, decimal), la unidad —taza,
  cucharada, cucharadita, ml, l, fl oz, g, kg, oz, lb, pinch, dash, smidgen y
  stick—, el sistema de medida y el ingrediente, que puede ser «Ninguno». Por
  defecto, taza, Métrica y ninguno.
- [ ] **Sistemas:** Métrica (Argentina, Reino Unido, Canadá y Nueva Zelanda),
  Australia, EE. UU. y Japón, cada uno con los ml de su taza, su cucharada y
  su cucharadita. Las informales y la fl oz son de EE. UU. sea cual sea el
  sistema: pinch, dash y smidgen son una fracción de su cucharadita, y el
  stick, media taza.
- [ ] **El resultado** son las tazas, cucharadas, cucharaditas y ml del
  sistema elegido, y los g y las oz. Cada medida casera lleva en el nombre
  los ml que mide.
- [ ] **Cada ingrediente guarda la medida tal como la da su fuente** («½ taza
  de EE. UU. = 113 g»), y sus gramos por ml salen de ahí.
- [ ] **Sin ingrediente** convierte volumen a volumen y peso a peso. En lugar
  del otro tipo, una línea dice *Elegí un ingrediente para pasar a peso* (o
  *a volumen*).
- [ ] **El stick es una medida de manteca:** con otro ingrediente o sin
  ninguno, la única línea dice *Es una medida de manteca: elegí Manteca*. Con
  manteca, el resultado suma los sticks.
- [ ] **Tazas, cucharadas y cucharaditas en la fracción práctica más
  cercana**: el entero más ¼, ⅓, ½, ⅔ o ¾ para la taza y más ½ para las
  cucharas, con «≈» delante si no es exacta. Una medida que redondea a cero
  no se muestra, ni una cuchara de más de 16. ml y g con el redondeo de los
  gramos de la app; oz con un decimal.
- [ ] La advertencia del método va siempre: medidas al ras, la harina volcada
  con cuchara. Al pie, las fuentes del sistema, del ingrediente y de las
  unidades que se usaron.
- [ ] Una cantidad vacía o cero da un resultado vacío.

#### C07.11.2 — Las tablas *(J6)*

- [ ] **Pesos por ingrediente:** una tabla agrupada —harinas y almidones,
  azúcares y dulces, grasas y lácteos, otros, leudantes y sal— con los gramos
  por taza, por cucharada y por cucharadita métricas, con los ml en el
  encabezado, y la fuente de cada fila. Se arma desde los mismos datos que la
  cuenta.
- [ ] **Tazas y cucharas:** los cuatro sistemas con sus ml y sus fuentes, y
  sus notas (la taza de las etiquetas argentinas, la de EE. UU., el gō).
- [ ] **Medidas de EE. UU.:** fl oz, oz, lb, dash, pinch, smidgen y el stick
  de manteca, con su equivalencia, y las notas sobre las fuentes que no
  coinciden y los panes de manteca de acá.
- [ ] El buscador de arriba —*Buscar un alimento*— filtra la tabla de pesos
  mientras se escribe, sin mirar tildes ni mayúsculas, y pinta sólo la tabla,
  para no sacarle el foco al campo. Sin coincidencias dice *Ningún alimento
  con «<lo escrito>»*. Las demás fichas y las opciones de la cuenta no se
  filtran, y la búsqueda no se guarda.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C07.1.1, C07.1.2, C07.2.1, C07.2.2, C07.2.3, C07.2.4, C07.2.5, C07.2.6, C07.2.7, C07.3.1, C07.4.1, C07.5.1, C07.5.2, C07.5b.1, C07.5b.2, C07.6.1, C07.6.2, C07.6.4, C07.6.5, C07.7.1, C07.7.2, C07.7.3, C07.7.4, C07.7.5, C07.8.1, C07.8.2, C07.8.3, C07.8.4, C07.9.1, C07.9.2, C07.9.3, C07.10.1, C07.11.1, C07.11.2 | J6 |
| C07.6.3 | J6, J8 |

Ninguna capacidad de esta épica quedó sin job.
