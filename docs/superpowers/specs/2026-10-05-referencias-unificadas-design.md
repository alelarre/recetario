# Referencias: una sola sección

Referencia rápida, Masas y dulces, Básicos de cocción y Conservación dejan de
ser cuatro herramientas y pasan a ser **Referencias**, una sola sección con
subsecciones, tags y un buscador. El contenido de cada ficha no cambia en este
trabajo: cambia cómo se llega a ella. El Conversor sigue siendo una
herramienta aparte, con su pantalla de hoy.

## Herramientas

La lista de *Herramientas* queda con cinco entradas, en este orden:
Temporizadores, Pan, Fermentados, **Referencias** y Conversor. Referencias
lleva el ícono `libro` y el detalle «Huevos, carne, masas, cocción y cuánto
dura cada alimento». Las rutas `#/herramientas/referencia`, `/masas`,
`/coccion` y `/conservacion` dejan de existir; `#/herramientas/conversor`
sigue igual.

## La entrada: `#/herramientas/referencias`

- **Encabezado:** volver, el ícono `libro` y «Referencias».
- **Debajo, el buscador** (la caja de búsqueda del Recetario, design-system
  §3.4) con el texto «Buscar», y **una fila de chips con los tags**, en orden
  alfabético, que se acomoda en renglones.
- **Sin tag ni búsqueda: el índice.** Las cuatro subsecciones como títulos,
  en este orden: Referencia rápida, Masas y dulces, Básicos de cocción,
  Conservación. Debajo de cada título, una fila por ficha con su título, en el
  orden de hoy. Tocar una fila abre la ficha.
- **Un tag a la vez.** Tocar un tag lo activa y el índice queda con sus
  fichas, bajo las subsecciones que tengan alguna. Tocar el tag activo lo
  saca. Tocar otro lo reemplaza.
- **El buscador.** Con texto, el índice se reemplaza por los resultados. Con
  un tag activo, se busca sólo en sus fichas.
- **El tag y el texto viajan en la ruta:**
  `#/herramientas/referencias?tag=pasta&q=crema`. Elegir o sacar un tag
  reemplaza la ruta; escribir también, sin redibujar la caja (el foco y el
  teclado quedan donde están). Así el volver desde una ficha encuentra la
  entrada como estaba. Entrar desde *Herramientas* abre la ruta sin nada: el
  tag y el texto no se recuerdan entre visitas.
- Un `tag` de la ruta que no existe se ignora.

## Los resultados del buscador

- Se busca sin distinguir mayúsculas ni acentos (`normalizar.ts`) en: el
  título y los tags de cada ficha, y el texto de cada celda de cada fila de
  cada tabla, agrupada o no.
- **Una ficha cuyo título o tag coincide** aparece como una fila del índice,
  bajo su subsección.
- **Una tabla con filas que coinciden** aparece como un grupo: el título de la
  ficha, el encabezado de la tabla con sus unidades y sólo esas filas, con el
  formato de la tabla (design-system §6.30) y su botón de minutos si lo
  tiene. En una tabla agrupada, cada fila lleva el título de su grupo en una
  fila completa antes, como en la ficha. Junto al título, «abrir» lleva a la
  ficha entera. Si la ficha coincide también por título o tag, va como grupo
  y no se repite como fila.
- Orden: primero las fichas que coinciden por título o tag, después los
  grupos, los dos en el orden del índice.
- Sin ningún resultado: «Nada con «…»», como un estado vacío.
- Las cuentas se encuentran sólo por su título y sus tags.

## La ficha: `#/herramientas/referencias/<id>`

- `<id>` es el id de la tabla o de la cuenta (ya son únicos entre todas).
- **Encabezado:** volver y el título de la ficha.
- **Arriba, sus tags** como chips. Tocar uno va a la entrada con ese tag
  (`?tag=`).
- **Debajo, la ficha como hoy:** la tabla con sus notas y su fuente, o la
  cuenta con sus datos, su resultado, sus notas y su fuente. El botón de
  minutos crea su temporizador como ahora.
- Lo escrito en una cuenta se sigue guardando en `localStorage` bajo la clave
  de su subsección (`recetario.referencias.<subsección>`), la misma de hoy:
  no se pierde nada de lo guardado.
- Un id que no es de ninguna ficha de Referencias (también uno del Conversor)
  lleva a la entrada.

## Los tags

Se declaran en `src/referencias/indice.ts`, en cada ficha de cada subsección:
`{ tipo: 'tabla', tabla: TABLAS_RAPIDA.huevos, tags: ['huevo'] }`. Cada ficha
de Referencias tiene al menos un tag. Las fichas del Conversor no llevan tags.
Los iniciales:

| Tag | Fichas |
|---|---|
| arroz | Agua para el arroz, Arroz en olla, Arroz en olla a presión |
| bebidas | Mate, Té, Vinos y espumantes, Cervezas y gaseosas |
| carne | Temperatura interna segura, Puntos de la carne vacuna |
| conservación | Nota general, Cuánto dura cada alimento |
| dulces | Masa para un molde, Puntos del azúcar, Merengue |
| fritura | Aceite para freír, Punto de humo |
| horno | Horno, Masa para un molde, Bollo de pizza |
| huevo | Huevos, Pasta fresca, Merengue |
| legumbres y granos | Granos, Legumbres, Legumbres en olla a presión |
| masas | Gramos de masa por pieza, Masas por plato, Bollo de pizza, Pasta fresca |
| olla a presión | Arroz en olla a presión, Legumbres en olla a presión |
| pasta | Pasta fresca, Pasta comprada, Agua y sal para la pasta, Tiempo de pasta seca, Medidor de espagueti |
| pollo | Temperatura interna segura, Aceite para freír |
| verduras | Verduras al vapor y hervidas, Blanqueado, Caldo |

## El código

- **`src/referencias/tipos.ts`:** la ficha de una subsección suma `tags`. Las
  cuatro subsecciones dejan de llevar ruta, ícono y buscador propios; el
  Conversor los conserva.
- **`src/referencias/indice.ts`:** las subsecciones de Referencias, en orden,
  con sus fichas y sus tags; el Conversor, aparte. Es el único lugar que
  ordena y etiqueta.
- **La búsqueda** es un módulo puro y testeable: recibe las subsecciones, el
  tag y el texto, y devuelve el índice filtrado o los resultados.
- **`src/ui/referencias.ts`** suma la entrada y la ficha suelta, y reusa lo
  que ya dibuja una tabla y una cuenta. La pantalla del Conversor sigue
  dibujando todas sus fichas juntas, con su buscador de hoy.
- **El router** suma `#/herramientas/referencias` y
  `#/herramientas/referencias/<id>`, y saca las cuatro rutas viejas.
- **Los íconos** `rodillo`, `olla` y `heladera` dejan de usarse y se borran
  de `src/ui/iconos.ts`.

## El MCP

`consultar_referencia` sigue igual. `herramienta` es la subsección, con los
ids de hoy (`rapida`, `masas`, `coccion`, `conservacion`, `conversor`). El
listado suma los tags de cada ficha. Las `calcular_*` no cambian.

## Tests

De forma y de lógica, nunca de valores: cada ficha de Referencias con al menos
un tag, sin tags repetidos en una ficha; la búsqueda (tag, texto, los dos,
acentos, tablas agrupadas, sin resultados, una ficha que coincide por título
y por filas); las rutas nuevas y las viejas que ya no existen; la entrada, la
ficha suelta, el volver con el tag y el texto, y el foco al escribir.

## Documentos

- `E07-Herramientas.md`: F07.7 a F07.10 pasan a ser una sola feature,
  **Referencias**, con la entrada, el buscador, los tags, la ficha y las
  fichas de cada subsección; C07.1 (la lista y las rutas) y C07.6.4–5 (el
  MCP y el skill) se ajustan.
- `information-architecture.md` (pantallas y rutas), `design-system.md`
  (§6.30 y la tabla de íconos), `CLAUDE.md`, `skills/herramientas/SKILL.md` y
  `mcp/LEEME.md`.

## Fuera de este trabajo

El contenido de las fichas —qué fichas hay, cómo se parten y qué datos
traen— se refactoriza después.
