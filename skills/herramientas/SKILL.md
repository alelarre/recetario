---
name: herramientas
description: Usar cuando el usuario quiere calcular las cantidades de un pan (harina, agua, sal, levadura o masa madre, hidratación, para un peso de harina o de masa) o la sal de un fermentado (chucrut, kimchi, ajíes, pepinos, verduras en salmuera). Por ejemplo «quiero hacer un pan con 500 g de 000» o «cuánta sal le pongo a un frasco de pepinos de 1200 g». Trabaja con las herramientas `calcular_pan` y `calcular_sal` del MCP `recetario`.
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
- **No asumas ningún otro dato.** Llamá a la herramienta con lo que hay. Si
  devuelve `faltan`, preguntá todo lo que falta **en un solo mensaje**, en
  este orden y con las opciones que devolvió:
  1. pan;
  2. harinas: la principal y si hay una segunda (con su porcentaje);
  3. levadura;
  4. fermentación: ambiente o frío, y cuántas horas;
  5. cantidad: harina total o masa total, en gramos.

  Con las respuestas, volvé a llamar a la herramienta. Si todavía falta algo,
  preguntá sólo eso.
- **Mostrá el resultado** como una lista, una línea por ingrediente y la
  hidratación, con la harina total y la masa total. Debajo, las advertencias
  tal como vienen.

## Ejemplos

**«Quiero hacer un pan con 500 g de 000»**

Ya están la harina principal (000) y la cantidad (500 g de harina). Se
pregunta, en un mensaje:

> Para calcularlo me faltan:
> 1. ¿Qué pan? Pan francés, Pan de molde, Pan de miga, Pizza al molde, Pizza a la piedra, Baguette, Pan de campo, Ciabatta o Focaccia.
> 2. ¿Le sumás una segunda harina? Ninguna, 0000, 000 para pizza, Semolín, Integral o Centeno (y en qué porcentaje: 10, 20, 30 o 50 %).
> 3. ¿Qué levadura? Fresca, Seca o Masa madre.
> 4. ¿Fermentación a temperatura ambiente o en frío, y cuántas horas?

**«¿Cuánta sal para un frasco de pepinos de 1200 g?»**

Están los dos datos: se llama a `calcular_sal` y se muestra el resultado, sin
preguntar nada.

## Si el pedido viene de una receta

Si el usuario está mirando o cargando una receta y pide las cantidades, los
datos de la receta no reemplazan las preguntas: la calculadora no lee
recetas. Lo que el usuario diga en el pedido sí cuenta como dato.
