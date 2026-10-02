# Herramientas: calculadoras de pan y de sal

Una sección nueva de la app, *Herramientas*, con dos calculadoras: la de pan
(harinas, agua, sal y levadura o masa madre) y la de sal para fermentados. Las
calculadoras no leen ninguna receta ni escriben en Drive. Una receta marcada
con `pan` o `fermentado` en `tags_especiales` tiene un botón que abre la
calculadora que corresponde. El agente las usa por el MCP, con un skill propio.

## 1. Las fórmulas: un archivo por calculadora

Toda la fórmula de cada calculadora vive en un solo archivo, puro y sin DOM:
las tablas, las constantes y las cuentas. Cambiar un porcentaje es editar ese
archivo y nada más; la pantalla, el MCP y los tests usan lo que exporta.

- `src/calculadoras/pan.ts`
- `src/calculadoras/fermentados.ts`

Las pantallas no hacen cuentas: dibujan lo que devuelven esas funciones.

### 1.1 Pan

**Datos de entrada**

| Dato | Valores |
|---|---|
| Pan | una clave de la tabla de panes |
| Harina principal | una clave de la tabla de harinas |
| Segunda harina | ninguna, o una clave de la tabla distinta de la principal |
| Porcentaje de la segunda | 10, 20, 30 o 50 |
| Levadura | fresca, seca o masa madre |
| Fermentación | ambiente 2, 4 u 8 h; frío 12, 24, 48 o 72 h |
| Cantidad | harina total o masa total, en gramos |

**Tabla de panes: hidratación base, con harina 000**

| Pan | Hidratación |
|---|---|
| Pan francés | 60 % |
| Pan de molde | 62 % |
| Pan de miga | 56 % |
| Pizza al molde | 61 % |
| Pizza a la piedra | 57 % |
| Baguette | 68 % |
| Pan de campo | 72 % |
| Ciabatta | 80 % |
| Focaccia | 75 % |

**Tabla de harinas: ajuste de la hidratación, en puntos, para la harina pura**

| Harina | Ajuste |
|---|---|
| 0000 | −4 |
| 000 | 0 |
| 000 para pizza | +2 |
| Semolín | +3 |
| Integral | +8 |
| Centeno | +20 |

**Levadura fresca, % sobre la harina total**

| Ambiente 2 h | 4 h | 8 h | Frío 12 h | 24 h | 48 h | 72 h |
|---|---|---|---|---|---|---|
| 2 % | 1,2 % | 0,5 % | 0,6 % | 0,4 % | 0,2 % | 0,1 % |

**Masa madre al 100 % de hidratación, % sobre la harina total**

| Ambiente 2 h | 4 h | 8 h | Frío 12 h | 24 h | 48 h | 72 h |
|---|---|---|---|---|---|---|
| — | 20 % | 10 % | 15 % | 15 % | 8 % | 5 % |

Con masa madre no hay 2 h: no se ofrece, y si estaba elegida pasa a 4 h.

**Constantes**

- Sal: 2 % de la harina total.
- Levadura seca: la fresca dividida por 3.
- Hidratación máxima: 85 %.

**Cuentas** (H = harina total, en gramos)

1. Ajuste de la harina = ajuste de la principal × (1 − p) + ajuste de la
   segunda × p, con p el porcentaje de la segunda (0 sin segunda).
2. Hidratación = base del pan + ajuste de la harina, tope 85 %. Si se topeó, el
   resultado lo dice.
3. Agua = H × hidratación. Sal = H × 2 %.
4. Levadura fresca = H × % de la tabla; seca = fresca ÷ 3.
5. Masa madre: M = H × % de la tabla. Trae M/2 de harina y M/2 de agua, que se
   descuentan: harina a agregar = H − M/2, agua a agregar = agua − M/2.
6. Cada harina = harina (a agregar) × su proporción.
7. Masa total = H + agua + sal + levadura (con masa madre, la masa madre ya
   está dentro de H y del agua, así que no se suma aparte).
8. Desde la masa total: H = masa total ÷ (1 + hidratación + sal + levadura),
   con levadura 0 para la masa madre.

**Redondeo:** gramos enteros; por debajo de 10 g, un decimal. Las cuentas se
hacen sin redondear y se redondea sólo lo que se muestra.

**Resultado:** una línea por harina, agua, sal, levadura o masa madre, la
hidratación final, la harina total y la masa total. Con masa madre, harina y
agua dicen «a agregar».

**Advertencias, fijas debajo del resultado:**

- Los tiempos son totales (primera fermentación y apresto), a unos 24 °C. Con
  frío ambiente hay que estirarlos; con calor, acortarlos.
- En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después de
  la heladera.
- Y, si se aplicó el tope: «La hidratación se limitó a 85 %».

### 1.2 Sal para fermentados

**Tabla de fermentos: % de sal sobre el peso total**

| Fermento | Sal |
|---|---|
| Chucrut | 2 % |
| Kimchi | 2,5 % |
| Ajíes | 3 % |
| Verduras en salmuera | 3 % |
| Pepinos | 3,5 % |

**Cuenta:** sal = peso total × %. El peso total es todo lo que hay en el
frasco: la verdura y, si va en salmuera, el agua.

**Resultado:** los gramos de sal y el porcentaje usado.

### 1.3 Datos inválidos

Las funciones reciben los datos ya elegidos. Una cantidad vacía, en cero,
negativa o que no es un número no da resultado. Una clave que no está en la
tabla es un error de programación en la app; en el MCP se informa como dato
faltante (§5).

## 2. Rutas y navegación

- **Menú:** un destino nuevo, *Herramientas*, entre *Plan* y *Ajustes*
  (`MENU` y `DestinoLateral` en `router.ts`).
- **Rutas:**
  - `#/herramientas`: la lista de las calculadoras, con la hamburguesa.
  - `#/herramientas/pan` y `#/herramientas/fermentados`: cada calculadora,
    con el volver.
- Una calculadora abierta desde una receta vuelve a la receta.

## 3. Las pantallas

### 3.1 Herramientas

Una lista con dos entradas: *Pan* y *Sal para fermentados*, cada una con una
línea que dice qué calcula.

### 3.2 Calculadora de pan

Una sola pantalla. De arriba abajo, cada fila es un grupo de botones con una
opción elegida, como la duración en el editor:

1. Pan.
2. Harina principal; debajo, la segunda (*ninguna* o una de la lista, sin la
   principal) y, si hay segunda, su porcentaje.
3. Levadura.
4. Fermentación: ambiente o frío, y las horas del modo elegido.
5. Cantidad: dos campos numéricos en gramos, *Harina total* y *Masa total*. El
   que se escribe manda y el otro se recalcula.

El resultado va al pie y se recalcula con cada toque o tecla, sin redibujar la
pantalla: un redibujo perdería el foco del campo que se está escribiendo. Sin
cantidad válida, cada línea muestra un guion.

### 3.3 Calculadora de sal

1. Fermento.
2. Peso total, en gramos.

El resultado al pie, igual que en el pan.

### 3.4 Últimas elecciones

Cada calculadora guarda sus elecciones y su cantidad en `localStorage` en
cada cambio, una entrada por calculadora. Al abrir, una entrada que falta, que
no se puede leer o que nombra una opción que ya no está en la tabla se
reemplaza, en ese dato, por el valor por defecto:

- Pan: pan de campo, 000, sin segunda, fresca, ambiente 8 h, 1000 g de harina.
- Sal: chucrut, 1000 g.

Toda lectura y escritura de `localStorage` va con `try/catch`: si falla, la
calculadora funciona igual con los valores por defecto.

## 4. Las marcas `pan` y `fermentado`

- **Dos filas nuevas en la tabla de especiales** (`src/especiales.ts`),
  después de `borrador`, sin ícono ni marca, y con `enChips`, `enReceta` y
  `enBusqueda` en `false`.
- **Campo nuevo en `DefinicionEspecial`:** `herramienta: 'pan' | 'fermentados' |
  null`, la calculadora que abre. Los cuatro de hoy llevan `null`.
- **Reservados:** `pan` y `fermentado` pasan a ser reservados; no se escriben a
  mano en `tags`. No hay recetas que los tengan como tag común.
- **Editor:** el grupo de los especiales suma *pan* y *fermentado*, que se
  aprietan y se sueltan como los demás.
- **Receta:** si la receta tiene un especial con herramienta, al pie de la
  ficha de ingredientes va un botón por cada uno: *Calcular pan*, *Calcular
  sal*. Abre la calculadora con las últimas elecciones; no lee la receta.
- **Invitado:** el link compartido no lleva especiales, así que no hay botón.

## 5. MCP y skills

### 5.1 Herramientas del MCP

`calcular_pan` y `calcular_sal`, en el servidor `recetario` que ya existe.
Importan `src/calculadoras/` y no usan Drive ni el login, como `formato` y
`validar`.

- **Reciben** los datos de §1.1 y §1.2 con los nombres de las tablas
  («pan de campo», «000», «centeno»), sin mirar mayúsculas ni tildes. La
  cantidad es la harina total o la masa total, una de las dos.
- **No tienen valores por defecto.** Si falta un dato o no es una opción de la
  tabla, no calculan: devuelven la lista de lo que falta y, para cada dato, las
  opciones válidas.
- **Con todo, devuelven** el mismo resultado que la pantalla, con las
  advertencias.

### 5.2 Skill `herramientas`

Un skill nuevo, `skills/herramientas/SKILL.md`, en el mismo plugin. Su
descripción lo activa con pedidos de cálculo: las cantidades de un pan o la
sal de un fermentado.

- Toma del pedido los datos que ya vienen y **no los repregunta**.
- **No asume ningún otro dato.** Pregunta los que faltan en un solo mensaje, en
  el orden del embudo (pan, harinas, levadura, fermentación, cantidad), con
  las opciones a la vista.
- Los números salen siempre de `calcular_pan` o `calcular_sal`; no inventa
  porcentajes.
- Muestra el resultado con las advertencias.

### 5.3 Skill `recetario`

- **Regla de las marcas:** `pan` va en un pan de masa con levadura o masa madre
  (no en un pan de carne ni en un budín); `fermentado`, en un fermento con sal
  (chucrut, kimchi, encurtidos en salmuera). Se ponen al cargar una receta y al
  ordenar el recetario, sólo cuando corresponde.
- **Derivación:** si el pedido es calcular un pan o la sal de un fermentado,
  usar el skill `herramientas`.

### 5.4 El plugin

En el repo `claude-code-marketplace`, el plugin `recetario` suma
`./skills/herramientas` a su lista de skills y sube de versión. Ese cambio se
muestra al usuario antes de pushearlo.

## 6. Documentos

- `product-design/product/specs/`: épica nueva, `E07-Herramientas.md`, con
  las dos calculadoras y sus criterios. C05.1.4 suma los dos especiales y el
  campo `herramienta`; E03 suma el botón *Calcular*; E04 los dos botones del
  editor; `specs-overview.md` la épica nueva.
- `product-design/ux/information-architecture.md`: el destino *Herramientas* y
  sus tres rutas.
- `CLAUDE.md`: `src/calculadoras/` y las pantallas en «Dónde está cada cosa»;
  los dos especiales; las doce herramientas del MCP; el skill nuevo.

## 7. Tests

- **Pan:**
  - pan de campo, 1000 g de 000, fresca, 8 h: 720 g de agua, 20 g de sal,
    5 g de levadura, 1745 g de masa;
  - 000 con 30 % de centeno: ajuste +6, una línea por harina;
  - masa madre: la harina y el agua a agregar descuentan la mitad cada una;
  - el tope de 85 % y su aviso;
  - la masa total da la misma harina que la usó (ida y vuelta);
  - la seca es la fresca dividida por 3;
  - con masa madre no hay 2 h;
  - el redondeo con un decimal por debajo de 10 g;
  - cantidad vacía, cero, negativa o no numérica: sin resultado.
- **Sal:** 1200 g de pepinos dan 42 g.
- **Rutas y menú:** `#/herramientas` es destino del menú; las calculadoras
  llevan el volver.
- **Pantallas:** las filas en su orden, el resultado y las advertencias; la
  segunda harina no ofrece la principal; un guardado inválido vuelve, en ese
  dato, al valor por defecto.
- **Receta y editor:** el botón *Calcular* aparece sólo con la marca; los dos
  botones nuevos del editor.
- **MCP:** con todos los datos, el mismo resultado que la función; con datos
  faltantes o inválidos, la lista de lo que falta con sus opciones.
