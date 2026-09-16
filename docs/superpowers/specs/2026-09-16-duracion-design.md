# La duración — diseño

**Fecha:** 2026-09-16
**Estado:** Implementado.
**Resuelve:** `product-design/plan/BACKLOG.md` P29 — la duración como campo estructurado.
**Reabre:** «Ordenar dentro de una categoría» y «Un control de filtro visible sobre las
listas» de `BACKLOG.md` §2, sólo para la duración.
**Mockups:** los de la conversación del 2026-09-16 —el editor con los cinco relojitos, el
orden en una categoría y en la búsqueda, y el filtro—, dibujados con el CSS real.

---

## 1. Qué cambia

`tiempo` deja de ser texto libre y pasa a ser uno de cinco valores. Con eso:

- **se carga** en el editor con cinco botones, cada uno con su relojito;
- **se ve** en la tarjeta, en la receta y en la búsqueda, con el relojito;
- **se filtra** en la categoría y en la lista por tag;
- **se ordena** en la categoría, en la lista por tag y en la búsqueda.

**Qué cuenta:** el tiempo hasta comer, con reposo y horno incluidos.

## 2. Los datos

### 2.1 Los cinco valores

| Valor | Relojito |
|---|---|
| `~15 min` | Esfera con un cuarto recorrido y la aguja en las 3 |
| `~30 min` | Esfera con medio recorrido y la aguja en las 6 |
| `~60 min` | Esfera con el recorrido entero y la aguja en las 12 |
| `>60 min` | La esfera de `~60 min`, más chica, y un cuarto de aro por afuera que termina en flecha |
| `>1 día` | Dos relojes, uno detrás del otro |

- **Se escriben tal cual** en la clave `tiempo` del frontmatter: `tiempo: ~30 min`. El
  frontmatter sigue con siete claves.
- **Cualquier otro texto se lee como sin cargar**, igual que una `dificultad` inválida: no
  se muestra, no filtra y no ordena. Si la receta se guarda desde el editor, queda lo que
  se elija ahí.
- **En `src/recipe.ts`**, junto a las claves del frontmatter: la lista `DURACIONES`, en el
  orden de la tabla, y `duracionValida(valor)`, que devuelve el valor si es uno de los
  cinco o la cadena vacía. `src/catalogo.ts` las reexporta al lado de `DIFICULTADES`
  (`catalogo.ts` ya importa de `recipe.ts`; al revés sería una importación circular).

### 2.2 El índice

- **La columna `tiempo` no cambia:** la fila copia lo que dice el archivo, y la validación
  se hace al leer (`entradaDesdeFila`). Una fila con `55 min` llega como sin duración.
- **No sube `SCHEMA_VERSION`** y no hace falta reindexar.

### 2.3 Lo que ya está cargado

Dos recetas tienen tiempo: Baba ganush (`55 min`) y Calabaza especiada (`40 min`). Se
corrigen desde el editor de la app después de publicar. No hay migración.

### 2.4 El agente

`skills/recetario/SKILL.md` cambia la fila de `tiempo` de su tabla a los cinco valores,
con la aclaración de qué cuenta. Donde hoy dice que el tiempo activo va en una nota, se
mantiene. Que el skill escriba la fila del índice sigue en P14.

## 3. Los íconos

Cinco íconos en `src/ui/iconos.ts`, de trazo 1,5 y `currentColor`, en `viewBox` de 24:

- **La esfera:** un círculo, una marca corta en las 12, y el recorrido desde las 12 hasta la
  aguja como sector relleno al 30% de opacidad. La aguja va del centro hasta dos tercios
  del radio.
- **`>60 min`:** la esfera entera con radio 7, y un arco de radio 10 desde las 12 hasta
  78°, con trazo 1,6, terminado en una punta de flecha de dos segmentos.
- **`>1 día`:** una esfera de radio 6 arriba a la derecha, al 60% de opacidad, tapada en
  parte por otra esfera de radio 6 abajo a la izquierda. La de adelante lleva un disco del
  color del fondo detrás, para cortar a la de atrás.

Un mismo mapa, `ICONO_DE_DURACION`, da el ícono de cada valor, para el editor, la tarjeta,
la receta, el filtro y el orden.

## 4. El editor

- **El campo «Tiempo» de texto se reemplaza por «Duración».** «Rinde» pasa a ocupar la
  fila entera, y «Duración» va debajo, también a lo ancho.
- **Cinco botones** en una grilla de tres columnas, en el orden de la tabla. Cada uno tiene
  su relojito arriba, 24 px, y el valor abajo.
- **Se aprieta uno a la vez.** Tocar el apretado lo suelta: la receta queda sin duración.
  Apretado se dibuja invertido, fondo claro y texto oscuro, como los botones de los tags
  especiales.
- **Debajo de la grilla**, en chico: «Hasta comer, con reposo y horno incluidos.»
- **Un valor inválido en el archivo** abre el editor sin ningún botón apretado.
- El valor viaja en un campo oculto `tiempo`, que es lo que lee el formulario, y entra en
  la foto de «cambios sin guardar» como cualquier campo.

## 5. Dónde se ve

- **La línea de contexto de la tarjeta** pasa a «Categoría · ◷ ~30 min · rinde». El
  relojito va a 15 px, pegado al valor.
- **En la búsqueda**, donde la línea dice el motivo, la duración va a continuación: «tiene
  tag horno · ◷ ~60 min».
- **En la receta y en la vista de invitado**, la línea de contexto de la cabecera lleva el
  relojito (las dos se arman en `fichas-receta.ts`).
- **El PDF y el texto compartido** muestran `~30 min` como texto, sin ícono.
- `contextoDe` usa `duracionValida`: un valor inválido no aparece en ninguno de estos
  lugares.

## 6. Filtrar

Sólo en **la categoría y la lista por tag**.

- **Una fila de chips de duración**, debajo del carrusel de tags. Los chips llevan el
  relojito, el valor y cuántas recetas hay con ese valor, en el orden de la tabla.
- La fila se desliza cuando no entra, como el carrusel, sin degradé ni flechas.
- **Cada chip trae su valor, y encender varios los suma.** Con tags encendidos, una receta
  tiene que llevar esos tags y alguna de las duraciones encendidas.
- **Las cantidades** cuentan sobre la lista filtrada por tags.
- **Un valor sin recetas no se dibuja**, salvo que esté encendido.
- **Si ninguna receta de la lista tiene duración, la fila no se dibuja.**
- **El filtro se pierde al cambiar de pantalla**, como el de tags.
- **Sin resultados**, el vacío de siempre: «Probá sacando alguno de los filtros de
  arriba.»
- **El total del encabezado** cuenta la lista filtrada, como hoy con los tags.

## 7. Ordenar

En **la categoría, la lista por tag y la búsqueda**.

- **Un conmutador «A–Z | ◷ Duración»**, en una fila propia alineada a la derecha, debajo
  del filtro. En la búsqueda va arriba de los grupos.
- **A–Z**, como hoy: las favoritas primero y alfabético dentro de cada bloque.
- **Duración:** de `~15 min` a `>1 día`, con las favoritas mezcladas, alfabético dentro de
  cada valor. La estrella de la tarjeta sigue marcando cuáles son. Las recetas sin
  duración van al final, en alfabético.
- **La lista va seguida**, sin rótulos por valor.
- **En la búsqueda** ordena dentro de cada grupo —Por nombre, Por ingrediente, Por tag—,
  sin mezclarlos.
- **Vuelve a A–Z al cambiar de pantalla.**
- **Si ninguna receta de la lista tiene duración, la fila no se dibuja.**

## 8. Dónde no cambia nada

- **El Recetario:** ni filtro ni orden.
- **El modo cocina** y **Borradores**.

## 9. Arquitectura

| Archivo | Qué cambia |
|---|---|
| `src/catalogo.ts` | Reexporta `DURACIONES` y `duracionValida`; `entradaDesdeFila` valida `tiempo`; `ordenarRecetas` con el orden por duración; contar y filtrar por duración |
| `src/recipe.ts` | `DURACIONES` y `duracionValida`; `contextoDe` usa `duracionValida` |
| `src/ui/iconos.ts` | Los cinco relojitos |
| `src/ui/editor.ts` | El campo «Duración» con sus cinco botones |
| `src/ui/componentes.ts` | El relojito en la línea de contexto de `tarjeta()`; la fila de chips de duración; el conmutador de orden |
| `src/ui/fichas-receta.ts` | El relojito en la línea de contexto de la receta |
| `src/ui/categoria.ts`, `tag.ts`, `resultados.ts` | La fila de filtro y la de orden |
| `src/main.ts` | El estado del filtro y del orden, y sus acciones |
| `src/ui/tokens.css`, `base.css` | Los botones del editor, la fila de chips y el conmutador |
| `skills/recetario/SKILL.md` | La tabla de `tiempo` |

## 10. Tests

- `duracionValida` acepta los cinco valores y devuelve vacío para cualquier otro texto,
  incluidos `55 min` y `30 min` sin `~`.
- Una fila del índice con un tiempo inválido llega sin duración.
- El editor dibuja los cinco botones, aprieta el del valor cargado, y ninguno si el valor
  es inválido; tocar el apretado lo suelta; el formulario guarda el valor elegido.
- La línea de contexto lleva el relojito con un valor válido, y nada con uno inválido; en la
  búsqueda va después del motivo.
- `contextoDe` no incluye un tiempo inválido.
- El filtro suma valores, se combina con tags, y las cantidades cuentan sobre lo filtrado
  por tags.
- La fila de filtro no dibuja valores sin recetas, y no se dibuja si ninguna receta tiene
  duración.
- El orden A–Z no cambia: favoritas primero y alfabético. El orden por duración mezcla
  favoritas y deja las sin duración al final.
- En la búsqueda el orden se aplica dentro de cada grupo.
- La fila de orden no se dibuja si ninguna receta tiene duración.

## 11. Verificación en el teléfono

1. Editar Baba ganush: el campo abre sin botón apretado; elegir `~60 min` y guardar.
2. Editar Calabaza especiada: elegir `~30 min` y guardar.
3. La tarjeta y la receta muestran el relojito con el valor.
4. En Entradas y picadas, encender `~60 min`: queda Baba ganush; encender también
   `~30 min`: se suma.
5. Ordenar por duración en una categoría y en una búsqueda.
6. Los relojitos se distinguen a 15 px en la tarjeta.

## 12. Documentos que cambian

- **`decision-log.md`:** una fila con la duración en cinco valores, el filtro y el orden.
- **`BACKLOG.md`:** P29 resuelto; en §2, «Ordenar dentro de una categoría» y «Un control
  de filtro visible sobre las listas» dicen que la duración los resolvió.
- **`E02-Encontrar.md`:** el filtro y el orden por duración.
- **`E04-Corregir.md`:** el campo «Duración» del editor.
- **`E05-Cimientos.md`:** la clave `tiempo` con sus cinco valores.
- **`design-system.md`:** los cinco relojitos en §3.4, los botones del editor, la fila de
  chips y el conmutador de orden.
- **`CLAUDE.md`:** la fila «Ordenar el home por cantidad de recetas» suma que las listas
  se pueden ordenar por duración.

## 13. Fuera de alcance

- Filtrar u ordenar en el Recetario, y una lista por duración.
- Filtrar por duración en la búsqueda.
- Tiempo activo separado del total.
- Convertir sola la duración escrita como texto libre.
