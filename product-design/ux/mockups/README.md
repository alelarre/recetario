# Mockups Hi-Fi — plan y hallazgos

**Versión:** 2.0 · **Fecha:** 2026-09-07 · **Estado:** Final — Hito 11

> **Cambios en la 2.0 (Hito 11):** las tres variantes están resueltas —queda una
> sola versión de cada pantalla, que es la que se implementa—, la tipografía pasa
> a ser la del sistema, y `--fg-3` y `--velo` se corrigieron.

Abrir `index.html`. Cada pantalla usa **los tokens de `../design-system.md`
literalmente**, en `tokens.css`.

---

## Cómo están hechos

**`tokens.css` es el sistema, no una hoja de estilo de los mockups.** Tiene los
tokens y los quince componentes core, uno a uno, con la sección del design system
anotada. Si una pantalla necesita un valor que no está ahí, es un hueco del
sistema y se arregla en el sistema — no en la pantalla. Eso pasó cuatro veces y
está abajo.

Lo único que no es producto es el andamio del catálogo —los marcos de 390 y
1280 px, los rótulos—, marcado como tal en el CSS.

**El contenido es real, leído del Drive**, con sus imperfecciones: son las que
produjeron los hallazgos.

| Caso | De dónde sale |
|---|---|
| Título de 86 caracteres, cuatro grupos, preparación en cuatro tramos | `Pescados y mariscos/anchoitas-a-la-plancha-con-melon…md` |
| Ingredientes sin separador, variaciones como lista, notas | `Pescados y mariscos/rabas.md` |
| Los veinte títulos de una categoría | `Pescados y mariscos/` |
| Receta mínima | `Carnes/hamburguesas.md` |
| Las dieciséis fotos de categoría | `src/categorias/*.webp`, copiadas a `categorias/` |

La única cosa inventada es la **foto de una receta**: ninguna de las sesenta
recetas de Drive tiene `foto`, así que en `01` va un SVG embebido en su lugar.

## Alcance

Trece pantallas. Las ocho prioritarias primero, por uso y por dificultad, y
después las cinco restantes.

- **Las tres variantes que el Hito 6 marcó para comparar están resueltas** en el
  Hito 11: la receta es una pila de fichas con la foto dentro de la primera; el
  Recetario mantiene el contador como ícono y el planificador al pie; la lista de
  categoría usa la tarjeta de 80 px. Las descartadas se sacaron.
- **1280 px** en Recetario, Editor y Borradores, que son los tres contextos
  reales de escritorio. El resto, solo 390 px.
- **Dos estados no felices**: sin resultados e incompleta. El resto queda
  especificado en los specs y en el design system, sin mockup — decisión del
  Hito 9. Igual quedaron dibujados los que caían de paso: índice dañado, error al
  guardar, sin sesión, vacío, reindexando y consentimiento cancelado.

---

## Huecos del sistema que aparecieron al mockupear

Los cuatro están **corregidos en `design-system.md`**; se listan acá porque son el
resultado del hito, no una nota al pie.

| # | Qué faltaba | Cómo quedó |
|---|---|---|
| 1 | **Un espaciado de 20 px para cocina.** La escala de §3.3 lo pedía y ninguno de los siete valores de la escala base lo daba. | Token `--e-cocina`, la única excepción a la escala. |
| 2 | **Un botón de 40 px.** El encabezado mide 56 px y no entra uno de 48 con aire. | Variante compacta de botón, solo dentro del encabezado, con área táctil de 48 igual. |
| 3 | **El tamaño de la casilla y del ícono.** Se usaban 22 px y 20 px sin token. | `--ico`, `--ico-cocina`, y la casilla especificada en §6.9. |
| 4 | **El estado de un paso en cocina.** C03.2.4 se decidió en este hito y no tenía componente. | §6.13, con sus tres estados. |

## Reglas que el mockup obligó a precisar

| Qué se vio | Qué cambió |
|---|---|
| El degradado del pie pegajoso deja el contenido **cortado a mitad** detrás, y lee como error de dibujo. | Las barras pegadas se separan con **borde**, no con degradado. §6.12. |
| Tachar un paso hecho a 22 px **cruza el renglón entero** y lo vuelve difícil de leer. | El paso hecho lleva **check y texto atenuado**, sin tachado. §6.13 y `E03` C03.2.4. |
| Sobre las fotos claras de categoría —la paella, la ensalada— el nombre **pierde contraste**. | El velo del tile llega a .96 y sube `--e-6`. §6.4. |
| `--error` se necesitaba para *Descartar* y *Borrar*, y la regla decía "solo para errores". | La regla admite lo destructivo, y dice por qué. §2.2. |

## Observaciones, sin cambio

| Qué se vio | Por qué se deja |
|---|---|
| **Dentro de una categoría, las veinte fotos son la misma**, porque el placeholder muestra la de la categoría: no informa nada y compite con el título. | Su función ahí es que la fila no se desalinee el día que una receta tenga foto propia. Donde sí informa es en los resultados, que mezclan categorías. |
| En la lista de compras, **el mismo ingrediente puede caer en los dos bloques** —«Leche» arriba y «Leche 250gr (aprox)» abajo— porque el recetario original escribe sin separador. | Es la consecuencia visible de que convivan dos convenciones, y el bloque "sin cantidad" existe justamente para no disimularla. |
| El título de 86 caracteres **rompe la altura fija** de la tarjeta: ocupa dos renglones y la fila crece. | Cortarlo en una línea escondería la diferencia entre dos recetas que empiezan igual. Se permite hasta dos renglones y después elipsis. |

---

## Lo que estos mockups no cubren

- **Ninguna interacción.** Son HTML estático: los estados se muestran lado a lado, no se navegan.
- **La foto de una receta real**, porque todavía no existe ninguna.
- **Una categoría con cientos de recetas.** La más grande de Drive tiene veinte.
