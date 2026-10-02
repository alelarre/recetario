# Backlog

Sólo pendientes. El **estado** dice en qué anda cada uno:

- `Abierto` — nadie lo está tocando.
- `Implementando` — hay una sesión trabajándolo: no lo tomes.
- `Falta probar` — hecho, esperando la prueba en el teléfono.
- `En espera` — decidido que no se toca hasta que se resuelva otra entrada.

Una entrada se borra de la tabla recién cuando está terminada y lista para
probar; una que quedó a medias vuelve a `Abierto`.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P105 | Skill: investigar una receta a partir de un título o una idea | Hoy el skill parte de una fuente (PDF, foto, video, sitio, links). Instruirlo para que, con sólo un título o una idea, busque fuentes, compare versiones y escriba la receta. | Abierto |
| P106 | Herramientas complementarias al recetario | Calculadoras de cocina: cantidades para pan (harina, agua, sal y levadura según el tipo de pan), porcentaje de sal para fermentados, y otras a definir. Las recetas que las usan llevan `pan` o `fermentado` en `tags_especiales`: dos filas nuevas en `src/especiales.ts` y el botón *Calcular* en la receta. | Implementando |
| P107 | Escalar una receta | Multiplicar las cantidades de cualquier receta (×2, ×½) desde la receta. | Abierto |
| P109 | Dos filas de chips: tags y especiales | Separar la fila de chips de las listas en dos: una con los tags comunes (la de hoy, con su carrusel) y otra con los especiales que se muestran ahí (`borrador` no va). | Abierto |
| P110 | Editor: «Fuente» debajo de los tags | En *Nueva receta* y al editar, el campo *Fuente original* pasa a ir justo debajo del campo *Tags*. | Abierto |
| P111 | Herramientas: referencia rápida | Tablas de consulta en *Herramientas*: minutos de los huevos según el punto, temperatura interna de la carne, temperatura del aceite para freír, y temperaturas y tiempos de horno. Sin cálculo. | Abierto |
| P112 | Herramientas: cronómetro y cuenta regresiva | Un cronómetro y una cuenta regresiva en *Herramientas*. | Abierto |
| P113 | Calculadora de pan: prefermentos | Analizar si la calculadora de pan ofrece prefermentos (biga, poolish, etc.) además de levadura fresca, seca y masa madre. | Abierto |
