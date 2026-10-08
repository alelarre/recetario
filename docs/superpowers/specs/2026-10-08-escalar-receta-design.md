# Escalar una receta

Desde la receta, multiplicar sus cantidades —×½, ×2, o para tantas
porciones— para cocinarla esa vez. Escalar cambia lo que se muestra, nunca el
`.md`.

## El multiplicador

- **Arriba de la lista de ingredientes**, en la ficha de Ingredientes, una
  fila de chips: **×½**, **×1**, **×2** y **×3**. Al abrir la receta está
  marcado ×1.
- **Si el rinde empieza con un número** —«4 porciones», «12 empanadas», «1
  molde de 24 cm»—, al lado de los chips va un campo con ese número, seguido
  del resto del rinde: «[ 4 ] porciones». Escribir otro número pone el
  multiplicador en la razón entre los dos: 6 sobre 4 es ×1,5. Elegir un chip
  cambia el número del campo: ×2 sobre 4 da 8. Un campo vacío, en cero o que
  no es un número no cambia nada. Si el rinde no empieza con un número —«para
  la familia»— o no hay rinde, sólo están los chips.
- Con un multiplicador que no está entre los chips —el que sale del campo
  del rinde—, ningún chip queda marcado.
- **Una receta sin ingredientes** no muestra el multiplicador.

## Qué cambia con el multiplicador

- **La cantidad de cada ingrediente**, según las reglas de abajo.
- **El rinde del encabezado**, con la misma regla que una cantidad: «4
  porciones» ×2 es «8 porciones».
- **El título de la ficha** pasa a decir «Ingredientes ×2» (o «×1,5»), para
  que se vea que no son las cantidades de la receta. Con ×1 dice
  «Ingredientes».
- **Con un multiplicador distinto de ×1**, debajo de los chips va una línea:
  «Los pasos no cambian: sus cantidades son las de la receta».

**Lo que no cambia:** el texto de la preparación, las variaciones y las
notas; la receta guardada, su fila del índice y el `.md`; lo que se comparte
—texto, PDF y link—; la vista de invitado; el plan y la lista de compras.

## Cuánto dura

- **El modo cocina** muestra las cantidades con el mismo multiplicador que la
  receta, y el mismo título de la ficha. No tiene chips propios: se cambia en
  la receta.
- El multiplicador vale para esa receta mientras se va y viene entre la
  receta y su modo cocina. **Al abrir otra receta, o al volver a abrir la
  misma desde una lista, vuelve a ×1.** No se guarda en ningún lado.

## Cómo se lee y se escribe una cantidad

- **Se lee sólo el número del principio de la cantidad**, sin la nota entre
  paréntesis (`cantidadSinNota`). Vale:
  - un entero o un decimal, con coma o con punto: `2`, `1,5`, `0.75`;
  - una fracción: `½`, `¼`, `¾`, `⅓`, `⅔`, `⅛`, o escrita `1/2`;
  - un número y una fracción: `1½`, `1 ½`, `1 1/2`;
  - un rango: `2-3`, `2–3`, `2 a 3`. Se escalan los dos extremos.
- **El resto queda tal cual:** la unidad (`taza`, `g`, `dientes`), la nota
  entre paréntesis y todo lo que sigue. La unidad no se convierte ni se pasa a
  plural o singular: «1½ tazas» ×½ es «¾ tazas».
- **Una cantidad que no empieza con un número** —«a gusto», «c/n», «una
  pizca», «media taza»— queda igual. Las cantidades en palabras no se escalan.
- **El resultado se escribe así:**
  - de 10 para arriba, entero: `375 g`;
  - debajo de 10, si está a menos de 0,05 de un entero o de una de las
    fracciones ½, ¼, ¾, ⅓ y ⅔ (sola o después de un entero), así: `1½`,
    `¾`, `3`;
  - si no, con un decimal y coma: `2,4`.
- **Un ingrediente sin cantidad** queda sin cantidad.

## El código

- **`src/escalar.ts`**, un módulo puro: lee el número del principio de una
  cantidad, la escala por un multiplicador y la vuelve a escribir con las
  reglas de arriba; también el número de porciones de un rinde.
- **La receta y el modo cocina** reciben el multiplicador y dibujan los
  ingredientes y el rinde escalados. Los chips y el campo de porciones son
  acciones de la receta; escribir en el campo del rinde pinta sólo lo que cambia,
  sin sacarle el foco al campo.
- **`main.ts`** guarda el multiplicador con el id de su receta, como algo que
  sobrevive entre la receta y su modo cocina, y lo vuelve a ×1 al abrir otra.

## Tests

De lógica, con cantidades armadas en el test: cada forma de número, el rango,
la nota, lo que no empieza con número, el redondeo a fracción, a decimal y a
entero, el rinde; la receta y el modo cocina con un multiplicador; el campo
del rinde que fija el multiplicador y el chip que fija las porciones; volver
a ×1 al abrir otra receta.

## Documentos

- `E05-Cimientos.md` C05.1.3: la cantidad no se parsea **para guardar**; para
  escalar se lee sólo el número del principio, y lo que se muestra no vuelve
  al `.md`.
- La capacidad nueva en la épica de la receta que corresponda
  (`product-design/product/specs/`), y `design-system.md` (los chips y el campo
  del rinde), `information-architecture.md` (la receta y el modo cocina) y
  `CLAUDE.md` si hace falta.
