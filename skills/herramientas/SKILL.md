---
name: herramientas
description: Usar cuando el usuario quiere calcular un pan o una pizza (harina, agua, sal, levadura o prefermento), la sal de un fermentado, o consultar un dato de cocina: minutos de los huevos, temperatura de la carne, del aceite o del horno, agua para mate o té, a cuántos grados se sirve un vino o una cerveza, masa para un molde o por pieza, pasta fresca o rellena, bollo de pizza, puntos del azúcar, merengue, agua del arroz, granos, legumbres, tiempo de pasta, verduras, blanqueado, caldo, cuánto dura un alimento en la alacena, la heladera o el freezer, o pasar tazas y cucharas a gramos (medidas de otro país, sticks de manteca). Por ejemplo «¿a qué temperatura frío las milanesas?», «¿cuánto dura la crema abierta?» o «¿cuántos gramos es una taza de azúcar?». Trabaja con las herramientas del MCP `recetario`.
---

# Herramientas

Las calculadoras y las tablas de consulta de la app *Recetario*, para el
agente. Las tablas y las cuentas son las de la app: las herramientas del MCP
`recetario` que se nombran acá usan el mismo código. Ninguna usa el Drive.

- **Pan y sal:** `calcular_pan` y `calcular_sal`.
- **Referencias:** `consultar_referencia` y las diez `calcular_*` de masas,
  cocción y el conversor (ver *Las referencias*).

## Las reglas de pan y sal

- **Los números salen siempre de la herramienta.** No inventes porcentajes,
  no los corrijas con lo que sepas de panadería y no hagas la cuenta a mano.
- **Lo que vino en el pedido no se repregunta.** «Quiero hacer un pan con
  500 g de 000» ya trae la harina principal y la cantidad.
- **Un pan parte de su tipo.** El tipo (`pan`) trae la harina, la
  hidratación, el prefermento, la levadura, la fermentación y las horas, como
  en la app. Pasale a `calcular_pan` el tipo y **sólo lo que el usuario
  dijo**: lo que digas pisa lo del tipo, y lo demás lo completa la
  herramienta.
- **Preguntá el tipo, la cantidad y la temperatura del ambiente**, que no
  salen de ningún lado. No preguntes lo que el tipo ya trae: el usuario lo ve
  en el resultado y lo cambia si quiere.
- **No asumas ningún dato por tu cuenta.** Llamá a la herramienta con lo que
  hay. Si devuelve `faltan`, preguntá **en un solo mensaje** lo que devolvió,
  con sus opciones. Si entre lo que falta está `pan`, preguntá sólo el tipo
  —y la cantidad y la temperatura, si faltan—: con el tipo, lo demás sale
  solo. El resto preguntalo sólo si el usuario no quiere partir de un tipo;
  sin tipo, la herramienta necesita todos los datos.
- **Puede llevar más de una vuelta:** un dato que depende de otro que se
  cambió —el porcentaje de una segunda harina, las horas de otro prefermento
  o de otro modo de fermentación— se pide recién ahí. Con las respuestas,
  volvé a llamar a la herramienta y repetí hasta que calcule.
- **Mostrá con qué se calculó y el resultado.** Primero los datos de `usado`,
  en una línea o dos, para que el usuario vea qué trajo el tipo y pueda
  cambiarlo. Después el resultado como una lista, una línea por ingrediente,
  con la harina total, la masa total y la hidratación. Con poolish, biga o
  pâte fermentée, dos listas: *Prefermento* y *Masa final*. Debajo, las
  advertencias tal como vienen.
- **La masa madre es un prefermento, no una levadura:** si el usuario dice
  «con masa madre», va en `prefermento` y no hace falta la levadura.
- **Una pizza se pide en bollos.** Los gramos por bollo son los del tipo,
  salvo que el usuario diga otros.
- **Un fermentado también parte de su tipo.** El tipo (`fermento`) trae el
  porcentaje de sal que sugiere; pasá `porcentaje_sal` sólo si el usuario
  dijo uno. Preguntá el tipo y el peso. Sin tipo, hace falta el porcentaje.

## Ejemplos

**«Quiero hacer un pan con 500 g de 000»**

Ya están la harina principal (000) y la cantidad (500 g de harina). Falta el
tipo, y con él la temperatura. Se pregunta, en un mensaje:

> Para calcularlo me faltan:
> 1. ¿Qué tipo de pan? Pan francés, Pan de molde, Pan de miga, Baguette, Pan de campo, Ciabatta, Focaccia, Pizza al molde, Pizza a la piedra, Pizza napolitana o Pizza New York.
> 2. ¿Qué temperatura hay en la cocina? Menos de 13 °C, 13 a 18 °C, 18 a 24 °C o Más de 24 °C.

Si contesta «pan de campo, 18 a 24», se llama con `pan`, `harina`,
`harina_total` y `temperatura`, y la herramienta calcula con lo que trae el
pan de campo: masa madre, 72 % de hidratación, 8 h a temperatura ambiente.
Se muestra eso y el resultado.

**«Una baguette con 1 kg de harina, pero con levadura seca y en 18 horas»**

Se pasan el tipo, la cantidad, `levadura: seca` y `horas_prefermento: 18`
—la baguette viene con poolish—, y se pregunta sólo la temperatura.

**«Hacé la cuenta de un pan francés, pero en frío»**

Se pasan el tipo y `fermentacion: frío`. Las horas del pan francés son para
temperatura ambiente, así que la herramienta devuelve que faltan las horas
(12, 24, 48 o 72) y la cantidad; se preguntan las dos.

**«¿Cuánta sal para un frasco de pepinos de 1200 g?»**

Están el tipo y el peso: se llama a `calcular_sal` y se muestra el resultado,
sin preguntar nada. La sal sale al 3,5 %, que es lo que sugiere el tipo.

**«Chucrut con 2 kg de repollo, pero al 2,5 % de sal»**

Se pasan el tipo, el peso y `porcentaje_sal: 2.5`, que pisa el 2 % del tipo.

**La temperatura de la sal es opcional.** Va sólo si el usuario la dijo o
pregunta cuánto tarda; sin ella no hay tiempo. Si pregunta cuánto tarda y no
la dijo, preguntásela con las cuatro franjas de la herramienta. El tiempo es
cuándo empezar a probar: mostralo con su advertencia, y una franja sin dato
se muestra como viene, sin estimarla.

## Si el pedido viene de una receta

Si el usuario está mirando o cargando una receta y pide las cantidades, los
datos de la receta no reemplazan las preguntas: la calculadora no lee
recetas. Lo que el usuario diga en el pedido sí cuenta como dato.

## Las referencias

Cuatro herramientas de la app con tablas de consulta y algunas cuentas
chicas: **referencia rápida** (huevos, carne, aceite, horno y bebidas),
**masas y dulces**, **básicos de cocción** y **conservación**. Cada dato
trae su fuente.

### Las reglas

- **Los números salen siempre de `consultar_referencia` o de su cuenta
  `calcular_*`.** Nunca de lo que vos sepas de cocina: ni un tiempo, ni una
  temperatura, ni una proporción, ni cuántos días dura un alimento.
- **Consultá antes de contestar.** Una pregunta de las de la `description`
  se contesta con la herramienta, aunque creas saber la respuesta.
- **La respuesta cita la fuente con su nombre y su link.** Vienen en
  `fuentes` (o en la tabla). Si la respuesta junta varias, citá cada una.
- **Si la tabla no tiene el dato, decilo.** «Esa tabla no trae el chayote»,
  por ejemplo. No lo estimes ni lo saques de una fila parecida. Sólo si el
  usuario lo pide, contestá con conocimiento general, aclarando que no sale
  de las referencias y que no tiene fuente.

### Consultar una tabla: `consultar_referencia`

Para cualquier pregunta de dato que no pida una cuenta: huevos, carne, aceite
y punto de humo, horno, mate, té, vinos, cervezas, gramos por pieza,
pasta comprada, masas por plato, granos, legumbres, tiempo de pasta,
verduras, blanqueado, cuánto dura un alimento, cuántos gramos pesa una taza
o una cuchara de cada ingrediente y cuánto miden la taza y las cucharas en
cada país.

- **Sin nada** lista las cinco herramientas con el `id` de sus tablas y de
  sus cuentas. Sirve para ubicar la tabla.
- **Con `herramienta` y `tabla`** (`rapida`, `masas`, `coccion`,
  `conservacion` o `conversor`) devuelve las filas con sus columnas, las notas y las
  fuentes.
- **Con `buscar`** («pollo», «crema») devuelve las filas de cualquier tabla
  que contengan el texto, cada una con su tabla y sus fuentes. Es lo más
  corto para una pregunta de un alimento; si hay varias filas, elegí la que
  responde a lo que el usuario preguntó y, si dudás entre dos, mostrá las dos.
- Un `error` trae `opciones`: son los ids que sí existen.
- **Leé las notas de la tabla** y pasalas cuando cambian la respuesta (por
  ejemplo, que el tiempo de la pasta es un rango y que manda el paquete).

### Calcular: las `calcular_*`

Cada una es una cuenta de la app. Se llama con lo que el usuario dijo; lo
que no dijo y tiene valor por defecto lo completa la herramienta (el esquema
de cada número dice cuál es). Usá cada una para esta pregunta:

| Herramienta | Para |
|---|---|
| `calcular_molde` | Cuánta masa lleva un molde de torta, según su forma y sus medidas o su número. |
| `calcular_pasta_fresca` | Qué ingredientes lleva la masa de pasta fresca, o el relleno o el puré, para unas porciones. |
| `calcular_bollo_pizza` | Cuántos gramos pesa el bollo de una pizza, napolitana o al molde, según su diámetro o su número de molde. |
| `calcular_merengue` | Cuánta azúcar, cuánto impalpable y cuánta agua de almíbar lleva un merengue francés, suizo o italiano para unos gramos de claras. |
| `calcular_punto_azucar` | A qué temperatura está cada punto del azúcar, corrido por la altitud o por donde hierve el agua. |
| `calcular_arroz` | Cuánta agua y cuánto tiempo lleva el arroz en olla, según la variedad y los gramos. |
| `calcular_agua_sal_pasta` | Cuánta agua y cuánta sal lleva la cocción de unos gramos de pasta seca. |
| `calcular_medidor_espagueti` | Cuántos gramos de espagueti hay en un atado de cierto diámetro, o qué diámetro tiene el atado de unos gramos. |
| `calcular_caldo` | Cuánta agua, cuánto mirepoix y cuánto tiempo lleva un caldo de ave, de vaca o de pescado para unos kilos de huesos. |
| `calcular_conversion` | Cuánto es una cantidad en las demás unidades —tazas, cucharas, ml, gramos, onzas, sticks de manteca— según el sistema de medida (métrica, Australia, EE. UU., Japón) y el ingrediente. Sin ingrediente no pasa de volumen a peso. |

La respuesta es una de tres:

- **Con todo:** `{ resultado, tabla?, advertencias, notas, fuentes }`.
  `resultado` es la lista de líneas (nombre y valor); `tabla`, si la cuenta
  trae una (los puntos del azúcar); `notas`, lo que hay que saber de la
  cuenta. Mostrá el resultado con sus `advertencias` y sus `notas` tal como
  vienen, y citá las `fuentes`.
- **`faltan: [{ dato, opciones }]`:** falta un dato que no tiene valor por
  defecto. Preguntá **todo lo que faltó en un solo mensaje**, con las
  `opciones` de cada dato que las traiga, y volvé a llamar con las
  respuestas.
- **`error`:** con esos valores la cuenta no se puede hacer (una medida en
  cero, o incoherente). Decile al usuario que esos valores no se pueden
  calcular y pedile otros coherentes; no corrijas los números por tu
  cuenta.

### Ejemplos

**«¿A qué temperatura frío las milanesas?»**: `consultar_referencia` con
`buscar: "milanesas"`. Se contesta con la fila del aceite para freír, tal
como está escrita, y la fuente con su nombre y su link.

**«¿Cuánto dura la crema abierta?»**: `buscar: "crema"`. Hay más de una fila
de crema: se dan las que el usuario pudo querer decir, con lo que cada una
dice de la crema abierta y su fuente; si ninguna trae el dato, se dice que
no lo trae.

**«¿Cuánta masa lleva un molde redondo de 24 cm de diámetro y 6 de alto?»**:
`calcular_molde` con el diámetro y el alto. El llenado lo completa la
herramienta, y se muestra el resultado con sus notas y su fuente.

**«¿Cuánta agua le pongo al arroz?»**: `calcular_arroz` devuelve que faltan
los gramos (la variedad tiene valor por defecto). Se pregunta cuántos gramos,
y de qué variedad si el usuario quiere otra que la de por defecto.

**«¿Cuántos gramos es una taza de azúcar?»**: `calcular_conversion` con
`cantidad: 1`, `unidad: "taza"` e `ingrediente: "azúcar blanca"`. Si la
receta es de EE. UU., `sistema: "EE. UU."`; si no se sabe, la métrica de
por defecto, y se dice cuál se usó. Se muestran los gramos con la
advertencia del método (al ras, la harina con cuchara) y la fuente.
