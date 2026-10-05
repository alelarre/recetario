# Herramientas: conversor de unidades (P120)

Una herramienta nueva en *Herramientas*: pasar una cantidad de cocina de una
unidad a todas las demás —tazas, cucharas, ml, gramos, onzas— y, con un
ingrediente, cruzar entre volumen y peso. Sirve para recetas de afuera y para
las caseras de acá. No lee recetas ni usa Drive. Funciona igual por el MCP.

**Se monta sobre las herramientas de referencia** (`src/referencias/`): usa
sus tipos, su pantalla genérica, su manera de declarar una cuenta y sus
herramientas del MCP, sin sumarles mecanismo.

Cada número sale de
`product-design/research/herramientas/verificacion-conversor.md`, con las
decisiones de §6.

## 1. Los datos: `src/referencias/datos/conversor.ts`

Sólo datos, sin funciones, con el encabezado de los demás archivos de datos
(qué contiene, de qué informe salió, cómo se corrige).

- **Sistemas de medida.** Cada uno con `id`, `nombre`, los ml de la taza, de
  la cucharada y de la cucharadita, y su fuente. Son cuatro:

  | Sistema | Taza | Cucharada | Cucharadita |
  |---|---|---|---|
  | Métrica (Argentina, Reino Unido, Canadá, Nueva Zelanda) | 250 ml | 15 ml | 5 ml |
  | Australia | 250 ml | 20 ml | 5 ml |
  | EE. UU. | 236,6 ml | 14,8 ml | 4,9 ml |
  | Japón | 200 ml | 15 ml | 5 ml |

  La taza de arroz japonesa (gō, 180 ml) va como nota del sistema Japón.
- **Unidades fijas**, cada una con su equivalencia y su fuente: ml y l; g, kg,
  oz y lb; la fl oz de EE. UU.; pinch, dash y smidgen como fracción de la
  cucharadita de EE. UU.; y el stick de manteca. Las informales y la fl oz son
  de EE. UU. aunque se elija otro sistema: así las define su fuente.
- **Ingredientes** (47). Cada uno con `id`, `nombre`, **la medida tal como la
  da su fuente** —cantidad, unidad y sistema: «1 taza EE. UU. = 120 g», «1
  cda EE. UU. = 21 g»— y la fuente. Los gramos por ml no se escriben: la cuenta
  los saca de esa medida. Así el número vive en un solo lugar, y corregirlo es
  editar esa línea. Un ingrediente puede llevar una nota («000 y 0000 pesan lo
  mismo por taza»).

Todo con la forma de fuente de las referencias: `{ nombre, url, consultada }`.

## 2. La cuenta: `conversion`

Se declara como las cuentas de las referencias (`src/referencias/cuentas.ts`),
y la pantalla y el MCP salen de esa declaración.

**Entradas:**

- `cantidad`: un número, decimal como las demás entradas: 1,5 o 0,75.
- `unidad`: taza, cucharada, cucharadita, ml, l, fl oz, g, kg, oz, lb, pinch,
  dash, smidgen, stick.
- `sistema`: uno de los cuatro; dice cuánto miden la taza y las cucharas.
- `ingrediente`: una opción, «Ninguno» y los 47 en el orden de la tabla.

**Salida:** tazas, cucharadas, cucharaditas y ml del sistema elegido; g y oz;
y, con manteca, sticks. l, kg, lb, fl oz y las informales valen sólo como
entrada. Con estas reglas:

- **Sin ingrediente:** volumen a volumen y peso a peso. En lugar del otro
  tipo, una línea: «Elegí un ingrediente para pasar a peso» (o «a volumen»).
- **Con ingrediente:** cruza con los gramos por ml que salen de su medida.
- **El stick** es una unidad sólo con manteca. Con manteca, la salida suma la
  línea de sticks.
- **Tazas, cucharadas y cucharaditas** salen en la fracción práctica más
  cercana —enteros más ¼, ⅓, ½, ⅔ o ¾ para la taza; enteros más ½ para las
  cucharas—, con «≈» delante si no es exacta: «≈ ¾ taza», «2 ½ cdas». Una medida
  que redondea a cero no se muestra, ni una cuchara de más de 16. **ml y g**
  salen enteros, con un decimal debajo de 10 y con dos debajo de 1. **oz**,
  con un decimal.
- Una cantidad vacía o cero da un resultado vacío, nunca un error.

Advertencia fija: «Medidas al ras; la harina, volcada con cuchara en la taza.
Hundiendo la taza entra hasta un tercio más».

## 3. La pantalla

`#/herramientas/conversor`, con volver y el ícono en el título. En la lista de
Herramientas, después de las de referencia: **Conversor** —*Tazas, cucharas y
gramos por ingrediente*—, con un ícono nuevo, `medidor` (una taza medidora),
del trazo de los demás: `balanza` ya es el de *Herramientas*.

Es la pantalla genérica de las referencias, con el buscador y el índice de
chips arriba, y tres fichas:

1. **Conversor.** Las entradas de la cuenta, como las demás: la cantidad, la
   unidad, el sistema y el ingrediente, cada uno en un `select`. Debajo, el
   resultado y la advertencia. Lo elegido queda en `localStorage`
   (`recetario.referencias.conversor`); la primera vez, Métrica y sin
   ingrediente.
2. **Pesos por ingrediente.** Una tabla agrupada —harinas, azúcares, grasas
   y lácteos, otros, leudantes y sal— con los gramos por taza, por cucharada
   y por cucharadita **métricas** (250, 15 y 5 ml, dichos en el encabezado),
   armada desde los datos. El buscador de arriba la filtra, como el de
   Conservación. Para otro sistema está el conversor.
3. **Tazas y cucharas.** La tabla de los cuatro sistemas, y debajo las
   informales y el stick.

Al pie de cada ficha, su fuente o la lista de abreviaturas, como en las
referencias.

## 4. MCP y skill

- **`calcular_conversion`**, registrada desde la declaración de la cuenta,
  como las demás `calcular_*`. El ingrediente, como toda opción, se pasa por
  `id` o por nombre, sin tildes ni mayúsculas; si no se encuentra, devuelve la
  lista.
- **`consultar_referencia`** encuentra la tabla de pesos y la de sistemas por
  texto («harina», «taza»), y su descripción suma el tema: tazas, cucharas y
  gramos por ingrediente, medidas de otro país, sticks de manteca.
- **El skill `herramientas`:** la `description` suma el conversor con un
  ejemplo («¿cuántos gramos es una taza de azúcar?»), sin pasar de 1.024
  caracteres. Valen las reglas de las referencias: el número sale de la
  herramienta, la respuesta cita la fuente y, si el ingrediente no está, lo
  dice.

## 5. Tests

Ningún test fija un valor de los datos.

- **La forma:**
  - toda fila de ingrediente, sistema y unidad tiene fuente con URL y fecha;
  - los `id` no se repiten;
  - toda medida de ingrediente usa una unidad y un sistema que existen.
- **La cuenta**, con datos armados en el test:
  - los gramos por ml salen de la medida del ingrediente;
  - la taza mide lo de su sistema;
  - sin ingrediente no cruza entre volumen y peso;
  - el stick sólo existe con manteca;
  - redondea a la fracción práctica, con «≈» cuando no es exacta;
  - una entrada vacía da un resultado vacío.
- **La pantalla:**
  - la búsqueda filtra los ingredientes;
  - la ruta dibuja su pantalla y lleva volver.
- **El MCP:**
  - con todas las entradas;
  - sin ingrediente;
  - con un ingrediente que no existe.

## 6. Decisiones aplicadas

- **Argentina usa la taza métrica**, 250 / 15 / 5 ml: es como vienen marcadas
  las tazas medidoras que se venden acá. No hay norma de cocina; la de
  rotulado (GMC 47/03: taza de té 200 ml, cuchara de sopa 10 ml) es de
  etiquetas y no se usa.
- **Reino Unido** cocina hoy en métrico; la taza imperial queda afuera.
- **EE. UU.:** la taza de 8 fl oz de NIST, 236,6 ml. Los 240 ml de las
  etiquetas, no.
- **Informales:** la convención de las cucharitas marcadas —dash ⅛, pinch
  1/16, smidgen 1/32 de cucharadita de EE. UU.—, con la nota de UNL (dash 1/16)
  y Smitten Kitchen (pinch ⅛).
- **Stick:** ½ taza de EE. UU. = 8 cdas = 113 g (Land O'Lakes, King Arthur).
  Los panes de 100 y 200 g de La Serenísima, como nota.
- **Ingredientes:**
  - King Arthur es la fuente principal; USDA FoodData Central para lo que King
    Arthur no tiene.
  - Harina 000 y 0000: 120 g por taza las dos. La correspondencia con *bread
    flour* y *all-purpose* va como nota.
  - Avena: la fila genérica, 89 g.
  - Polenta: 163 g.
  - Glucosa: la de King Arthur, 312 g.
  - Leche en polvo: la entera.
  - Grasa vacuna: el sebo de USDA, 205 g.
  - Crema, cacao y azúcar rubia: de King Arthur.
- **Afuera:** azúcar mascabo y sal gruesa, sin fuente seria. El porcentaje de
  grasa de la manteca, sin verificar.

## 7. Documentos

- `E07-Herramientas.md`: la feature, con sus criterios.
- `information-architecture.md`: la pantalla.
- `design-system.md`: el ícono `medidor`.
- `CLAUDE.md`: el conversor junto a las referencias.
- `skills/herramientas/SKILL.md` y `mcp/LEEME.md`: `calcular_conversion`.
- `BACKLOG.md`: P120 se borra al terminar.
