---
name: herramientas
description: Usar cuando el usuario quiere calcular las cantidades de un pan o de una masa de pizza (harina, agua, sal, levadura, masa madre u otro prefermento, hidratación, para un peso de harina o de masa, o para una cantidad de bollos) o la sal de un fermentado (chucrut, kimchi, ajíes, pepinos, verduras en salmuera) y cuántos días tarda según la temperatura. Por ejemplo «quiero hacer un pan con 500 g de 000» o «cuánta sal le pongo a un frasco de pepinos de 1200 g». Trabaja con las herramientas `calcular_pan` y `calcular_sal` del MCP `recetario`.
---

# Herramientas

Las calculadoras de la app *Recetario*, para el agente. Las tablas y las
cuentas son las de la app: `calcular_pan` y `calcular_sal` del MCP
`recetario` usan el mismo código. No usan el Drive.

## Las reglas

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
