# Tags especiales — diseño

**Fecha:** 2026-09-16
**Estado:** Aprobado en conversación; pendiente de revisión escrita.
**Resuelve:** `product-design/plan/BACKLOG.md` P27 — darle entidad a favoritos y a otros
tags especiales.
**Mockups:** los de la conversación del 2026-09-16 —la estrella que se llena, el carrusel
con degradé y flechas, los seis pares de íconos—, dibujados con el CSS real.

---

## 1. Qué cambia

Tres tags que la app ya se reservaba pasan a tener forma propia, y los tags en general
ganan dónde tocarse fuera de una receta.

| | Qué es | Qué gana |
|---|---|---|
| **`favorito`** | Un tag especial con control propio | Una estrella en el encabezado de la receta que lo pone y lo saca, la estrella en la esquina de la tarjeta, y el orden: las favoritas primero |
| **`probar`** | Un tag especial | Ícono propio donde se muestre, y lugar fijo al principio del carrusel |
| **`menú diario`** | Un tag especial nuevo | Lo mismo |
| **Los demás tags** | Sin cambios en el `.md` | Un **carrusel** en el Recetario y en cada categoría, que filtra |

**No son estados:** son tags. Lo especial es que la app se los reserva, los dibuja con
ícono y los pone primeros.

## 2. Los datos

**Se escriben en la lista `tags` del `.md`, que ya existe.** No se agrega ninguna clave al
frontmatter, ninguna columna al índice y no hace falta reindexar: la columna `tags` ya
viaja en la fila.

| Tag | Cómo se escribe | Qué más se reserva |
|---|---|---|
| favorito | `favorito` | `favorita`, `favoritos`, `favoritas` |
| probar | `probar` | — |
| menú diario | `menú diario` | `menu diario` |

Como hoy, la comparación normaliza mayúsculas y tildes (`tagReservado` en
`src/catalogo.ts`), y **escribirlos a mano en el editor sigue prohibido**: los pone la app.

**Quién los escribe.** `favorito`, la estrella de la receta. `probar` y `menú diario`, el
editor, como cualquier tag, pero dibujados con su ícono.

**Lo que no cambia:** el `.md` es la verdad, el índice sigue siendo cache, y el agente no
necesita saber nada nuevo.

## 3. La receta

### 3.1 La estrella

Va en el encabezado, **a la izquierda de compartir**. Un toque pone `favorito`, otro lo
saca: como es uno solo, no hay hoja que abrir.

| Momento | Cómo se ve |
|---|---|
| No es favorita | Contorno, en el color del texto, como los demás íconos del encabezado |
| **Escribiendo** | La estrella se llena de izquierda a derecha, en loop de **2 s**, en el acento |
| Es favorita | Llena, en el acento, con relleno al 45% |

**Cómo está hecha:** dos estrellas superpuestas —el contorno y la llena—, y la llena se
descubre con `clip-path: inset(0 100% 0 0)` animado hasta `inset(0)`. Ni imágenes ni
librerías.

- **El resultado se dibuja cuando Drive contesta**, no antes. El toque muestra que algo
  está pasando; el estado final llega con la respuesta.
- **Si falla**, la animación corta, la estrella queda como estaba y aparece el aviso de
  siempre con *Reintentar* (R1).
- **Mientras dura, no acepta otro toque**, para no encadenar escrituras.
- Con `prefers-reduced-motion` no hay loop: queda a medio llenar hasta la respuesta.
- Etiqueta accesible «Favorito», con `aria-pressed`.

**Qué escribe:** agrega o saca `favorito` de los tags, guarda el `.md` y reescribe su fila
del índice. Es el mismo camino que cualquier edición.

**Una receta sin fila en el índice** —abierta por link directo— también se puede marcar:
se escribe el `.md` y se escribe su fila.

### 3.2 Los otros dos

`probar` y `menú diario` se ven **en la fila de tags**, con su ícono adelante y primeros,
antes de los tags comunes. No tienen control propio en la receta: se ponen y se sacan
desde el editor.

## 4. Las listas

**El orden: las favoritas primero, y dentro de cada bloque sigue el alfabético.**

- En una categoría: favoritas arriba, después el resto.
- En la búsqueda: la misma regla **dentro de cada subsección** —Por nombre, Por
  ingrediente, Por tag—, sin mezclar entre ellas.
- En el Recetario no cambia nada: la grilla es de categorías.

**La marca:** una estrella chica arriba a la derecha de la tarjeta, en el acento y rellena.
**Sólo en las favoritas.** Las demás no muestran nada: marcar es sólo desde la receta.

Esto es una **excepción al alfabético**, no su reemplazo: la decisión cerrada de no ordenar
por cantidad sigue valiendo.

## 5. El carrusel de tags

### 5.1 Dónde y qué lleva

| Pantalla | Dónde | Qué cuenta el número |
|---|---|---|
| Recetario | Debajo de la búsqueda, arriba del rótulo «Categorías» | Recetas con ese tag en todo el recetario |
| Categoría | Debajo del encabezado, arriba de la lista | Recetas con ese tag dentro de la categoría |

**El orden:** los tres especiales primero, en orden fijo —`favorito`, `probar`,
`menú diario`—, cada uno con su ícono; después los demás por cantidad de recetas, de mayor
a menor, y los empates alfabéticos. Todos en minúscula, como se escriben en el `.md`.

**Cuántos:** en una categoría, todos. En el Recetario, los **veinte** más usados.

**Cuándo no se dibuja:** si no hay ningún tag. Un tag especial sin ninguna receta tampoco
se muestra: ocuparía lugar sin llevar a ningún lado.

### 5.2 Que se note que sigue

- **Degradé a la derecha** mientras quede algo por ver; **a la izquierda**, sólo cuando ya
  se corrió.
- **Flechas a los dos lados, sólo con mouse o trackpad**:
  `@media (hover: hover) and (pointer: fine)`. En el teléfono no aparecen; ahí se desliza.
  La izquierda aparece sólo cuando hay algo atrás.
- **Sin barra de scroll dibujada:** se descartó porque en Android la del sistema aparece
  sólo mientras se desliza, y dibujar una propia agrega un elemento gris que no se toca.

**Cómo se sabe si hay algo a cada lado.** Con animaciones ligadas al scroll
(`animation-timeline: scroll(self inline)`, Chrome 116+), que atan la opacidad de cada
degradé y la visibilidad de la flecha izquierda a la posición del carrusel, **sin
JavaScript**. Donde no estén soportadas, el degradé izquierdo se ve siempre: no rompe nada.
Las flechas sí necesitan un handler para desplazar —el 80% del ancho visible—, y entra en
la delegación de clicks que ya tiene la app.

### 5.3 Qué pasa al tocar

- **En una categoría:** filtra la lista ahí mismo, como hoy. El chip queda encendido, los
  filtros se acumulan y se sacan tocándolos de nuevo.
- **En el Recetario:** abre la **lista por tag** (§6).

Los filtros se pierden al cambiar de pantalla, como hoy.

## 6. La lista por tag

Una pantalla nueva, armada con las piezas de la categoría:

- **Encabezado** con el nombre del tag —y su ícono si es especial— y el total, como el de
  una categoría.
- **El mismo carrusel**, para acumular otro tag: el propio, el de la ruta, va encendido
  pero no es tocable —cambiar de tag es volver y elegir otro, no tocarlo acá—; los demás
  siguen acumulando como en una categoría. Corta en los mismos veinte que el Recetario.
- **La lista** de recetas con ese tag, con las favoritas primero.
- **Vacía:** si el tag ya no tiene recetas, una frase propia que dice el hecho: como el
  tag de la ruta no se puede sacar, no invita a «sacar un filtro».

No es la pantalla de resultados: esa agrupa por *por qué* apareció cada receta, y acá hay
un solo motivo.

## 7. El editor

- Los tags especiales puestos se ven **con su ícono** entre las pills, y se sacan como
  cualquier otro.
- Escribirlos a mano sigue rechazado, con el aviso que ya existe.
- El campo de agregar no los sugiere, como hoy.

## 8. Dónde no aparece nada de esto

- **La vista de invitado:** no hay sesión ni Drive, y los tags no viajan en el link.
- **El modo cocina:** el encabezado ya está lleno —volver, el sol y *Salir*—.
- **Borradores:** no son recetas.

## 9. Arquitectura

| Archivo | Qué cambia |
|---|---|
| `src/catalogo.ts` | `menú diario` y sus variantes en los reservados; la lista de los tres especiales con su orden |
| `src/ui/iconos.ts` | Dos íconos de trazo: marcador y calendario |
| `src/store.ts` | Orden con las favoritas primero; conteo de tags para el carrusel; filtro por un tag sin categoría |
| `src/ui/componentes.ts` | El carrusel —degradé, flechas, chips con ícono y número— y la estrella de la esquina en `tarjeta()` |
| `src/ui/receta.ts` | La estrella del encabezado y los especiales primeros en la fila de tags |
| `src/ui/recetario.ts`, `categoria.ts`, `resultados.ts` | El carrusel y el orden nuevo |
| `src/ui/tag.ts` | La pantalla de lista por tag (nueva) |
| `src/ui/router.ts` | La ruta `#/t/<tag>` |
| `src/ui/editor.ts` | Los especiales con ícono entre las pills |
| `src/main.ts` | La acción de la estrella, con sus tres momentos; las flechas del carrusel; el cableado de la ruta nueva |
| `src/ui/tokens.css`, `base.css` | El carrusel, la estrella de la esquina y la animación de la estrella |

## 10. Tests

- Tocar la estrella agrega `favorito`, guarda el `.md` y reescribe la fila; tocarla de
  nuevo lo saca.
- Mientras escribe, la estrella queda en el estado de carga y no acepta otro toque.
- Si la escritura falla, la estrella vuelve como estaba y aparece el aviso.
- Una categoría lista las favoritas primero, y alfabético dentro de cada bloque.
- Cada subsección de los resultados aplica la misma regla, sin mezclar entre subsecciones.
- La tarjeta de una favorita lleva la marca; la de las demás, no.
- El carrusel arma los chips en orden —especiales primero, después por cantidad— con su
  número, y no dibuja los especiales sin recetas.
- En el Recetario el carrusel corta en veinte; en una categoría, no corta.
- Sin ningún tag no hay carrusel.
- La ruta `#/t/<tag>` lista las recetas de ese tag, con las favoritas primero, y su estado
  vacío.
- Un tag reservado escrito a mano en el editor se sigue rechazando.
- El editor dibuja los especiales con ícono y permite sacarlos.

## 11. Verificación en el teléfono

1. Marcar y desmarcar una receta con Drive real: la animación corre y corta al contestar.
2. Con el avión puesto: la estrella vuelve y aparece el aviso.
3. Deslizar el carrusel en el Recetario y en una categoría: el degradé aparece y
   desaparece de cada lado.
4. **Las flechas no aparecen** en el teléfono.
5. Una receta marcada se ve primera en su categoría y en la búsqueda.

## 12. Documentos que cambian

- **`E02-Encontrar.md`**: C02.6.4 decía que los tags no tienen pantalla propia. Pasan a
  tener dónde tocarse fuera de la receta —el carrusel— y una lista por tag.
- **`E03-LeerYCocinar.md`**: la estrella en el encabezado de la receta.
- **`design-system.md`** §3.4: dos íconos más, de diez a doce.
- **`decision-log.md`**: una fila con lo decidido acá —los tres tags especiales, el
  carrusel, y la excepción al alfabético—.
- **`BACKLOG.md`**: P27 resuelto.
- **`CLAUDE.md`**: la fila de decisiones cerradas sobre el orden de las listas.

## 13. Fuera de alcance

- Marcar favorito desde la lista: se marca sólo desde la receta.
- Que `probar` y `menú diario` tengan control propio.
- Una pantalla de «Favoritos» en el menú lateral: se llega por el carrusel.
- Accesos directos del ícono de la app en Android.
- Compartir la lista de un tag.
- Ordenar o filtrar por duración: es P29.
- Que el agente marque tags especiales: entra en P14.
