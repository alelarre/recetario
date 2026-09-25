# E06 — Planificar

**Job:** J9 · **Prioridad:** Baja · **Flujo:** F13

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas. Acá se anota solo lo
que se aparta o lo que necesita precisarse.

---

## La épica

Decidir qué comida concreta va cada día, y que de ahí salga la lista de compras.

Es lo mínimo que resuelve el job: **siete días sin fechas** que arrancan en hoy,
dos comidas por día, y cada comida una lista de recetas del recetario. No hay
semana siguiente ni historial: un día cargado se mantiene hasta que se cambie o
se reinicie el plan.

J9 es el único job del proyecto que **cambia** la conducta del usuario en vez
de acompañarla, así que la épica se construye con costo de retiro bajo
(principio 6): **sacarla es borrar una entrada del menú, sus tres pantallas, sus
dos módulos y un archivo de Drive, y desconectarlos del resto** (C06.5.1). No define entidades en el núcleo —`_indice` no
cambia, ni hoja ni columna, y el esquema del `.md` de receta tampoco— y ninguna
otra épica la nombra.

---

## Features

### F06.1 — El plan de la semana

Una grilla de siete filas y dos columnas. Es la pantalla de la épica: todo lo
demás se alcanza desde acá.

#### C06.1.1 — Siete días desde hoy *(J9)*

- [ ] Siete filas, **hoy primero**, y los demás en orden hasta dar la vuelta.
- [ ] La fila de hoy dice *hoy* debajo del nombre del día, en el acento.
- [ ] Los nombres van abreviados: *Lun*, *Mar*, *Mié*, *Jue*, *Vie*, *Sáb*, *Dom*.
- [ ] Dos columnas: **Mediodía** y **Noche**.
- [ ] **No hay fechas.** El día de hoy es el único lugar donde entra el
  calendario, y sale del teléfono: al día siguiente el plan arranca en el nuevo
  hoy con lo que tuviera cargado.
- [ ] El plan parcial es el caso normal y **no se señala como incompleto**.
- [ ] El plan vacío no lleva aviso: las catorce celdas con su `+` ya lo dicen.

#### C06.1.2 — Cada comida es una lista de recetas *(J9)*

- [ ] Una comida tiene **cuantas recetas se quiera**, sin tipos: una entrada, un
  principal y un postre, o dos principales.
- [ ] Cada línea muestra el título de la receta, con el color de su categoría en
  el borde izquierdo, y lleva a la receta.
- [ ] El orden de las líneas es aquel en que se agregaron.
- [ ] Una comida vacía es sólo el control de agregar, con borde punteado.
- [ ] **La misma receta se puede cargar dos veces** en la misma comida: cada
  línea es propia.

**Edge case:** la receta cargada ya no está en el índice → la línea se ve
tachada, con el borde en `--error`. **No se borra sola**, y sigue teniendo su
control para sacarla.

#### C06.1.3 — Sacar una receta *(J9)*

- [ ] Cada línea tiene una `×` a la derecha que **saca esa línea y nada más**.
- [ ] No pide confirmación: sacar una receta de una comida no borra nada de Drive.
- [ ] No existe «reemplazar»: se saca una y se agrega otra.

#### C06.1.4 — Reiniciar el plan *(J9)*

- [ ] Al pie, pegados: **Lista de compras** (primario) y **Reiniciar el plan**
  (secundario). Con el plan vacío los dos están deshabilitados.
- [ ] Reiniciar pregunta antes, en el lugar de los dos botones y con borde de
  error, como borrar una receta: *«¿Reiniciar el plan? Se vacían los siete
  días.»*, *Cancelar* y *Reiniciar*.
- [ ] Confirmado, vacía los siete días y deja el archivo vacío.

### F06.2 — Agregar una receta a una comida

**Solo entran recetas del recetario.** Que una comida se cocine de memoria no
significa que la receta no esté registrada.

#### C06.2.1 — La pantalla de agregar *(J9)*

- [ ] Se llega tocando el `+` de una comida, y el título dice para cuál es:
  *Martes al mediodía*, *Martes a la noche*.
- [ ] Arriba, la caja de búsqueda del Recetario; debajo, el bloque **Menú
  diario** con las recetas de ese tag, las favoritas primero y alfabético
  dentro de cada bloque. **Se dibuja entero, sin tramos:** es la lista corta de
  lo que se come seguido. Sin ninguna, el bloque no se dibuja.
- [ ] Debajo, la grilla de las categorías. Tocar una muestra sus recetas en el
  mismo lugar, con las favoritas primero, por tramos y con un chevron al lado
  del nombre. Es algo abierto en la misma pantalla: el chevron o el atrás
  vuelven a la grilla sin salir (`ux/information-architecture.md` §4.6). Una
  categoría sin recetas dice *«Todavía no hay recetas en <categoría>.»*
- [ ] Al buscar —con Enter o al salir de la caja, no mientras se escribe
  (`E02-Encontrar.md` C02.2.1)—, el bloque se reemplaza por los resultados, con **la misma
  lista que la búsqueda** (`E02-Encontrar.md` C02.3.2): los tres grupos, el
  conmutador «A–Z | Duración» arriba (C02.9.2), la misma frase sin resultados y
  la carga por tramos (C02.3.5).
- [ ] Buscar, cambiar el orden y el tramo siguiente redibujan sólo el bloque,
  no la caja.
- [ ] Los borradores no aparecen, ni en la búsqueda ni en las categorías
  (`E02-Encontrar.md` C02.1.4).
- [ ] Tocar una tarjeta **suma la receta a esa comida**, escribe —el velo con su
  tilde (`E05-Cimientos.md` R8)— y vuelve al plan, sin dejar esta pantalla en el
  historial. Si se llegó por un link directo, el plan toma su lugar.
- [ ] En esta pantalla las tarjetas no llevan a la receta.
- [ ] **No se puede cargar texto libre:** sólo recetas del recetario.
- [ ] **Asignar es sólo desde acá.** La receta abierta no ofrece planificar.

### F06.3 — El plan es un archivo

Un solo archivo en Drive, legible sin la app (principio 1, J8).

#### C06.3.1 — `_plan.md` *(J9, J8)*

- [ ] Un solo plan y un solo archivo: **`_plan.md`**, en la carpeta base, al
  lado de `_indice`. Como `_fotos/`, el `_` lo deja fuera de las categorías
  y del reindexado.
- [ ] Sin frontmatter. Un `## <Día>` por día con algo cargado, de lunes a
  domingo; una línea por receta, con la comida como prefijo y un link
  `[título](drive:<fileId>)`.
- [ ] **El título está para leerlo; el id es lo que usa la app** (R5): el archivo
  sigue siendo legible aunque el índice no esté.
- [ ] Un día sin nada no se escribe. El plan reiniciado es un archivo vacío.
- [ ] El formato es propio: no comparte parser con el `.md` de una receta.

**Edge case:** `_plan.md` editado a mano → se lee tal cual, y **lo que no se
entiende se ignora** —un día que no existe, una línea sin link, una comida que
no es *Mediodía* ni *Noche*— y se pierde al próximo guardado. Los nombres de día
y de momento se comparan sin acentos ni mayúsculas.

#### C06.3.2 — Cómo se encuentra y cómo se escribe *(J9)*

- [ ] `_plan.md` **no está en el índice**: se lo busca por nombre en la carpeta
  base la primera vez que se abre el plan en la sesión, y el id y lo leído
  quedan en memoria: en la misma sesión no se vuelve a leer de Drive.
- [ ] Si no existe, se crea vacío al primer cambio.
- [ ] Si hay más de uno, manda el más reciente y queda el aviso en
  *Ajustes → Avisos*, como el `_indice` repetido.
- [ ] **Cada cambio se escribe en el momento**, reescribiendo el archivo entero,
  con el velo y su tilde (`E05-Cimientos.md` R8). Reintentar reescribe todo (R2).
- [ ] **`_indice` no cambia:** ni hoja ni columna. `SCHEMA_VERSION` no sube y el
  reindexado no mira `_plan.md`.

**Edge case:** sin red al escribir → el aviso, *«No se pudo guardar el plan.
Revisá la conexión.»*, va en el plan y reintentar es volver a tocar (R1). La
grilla sigue mostrando lo que dice Drive. Sin red al leer → *«No se pudo leer
el plan.»* con **Reintentar**.

### F06.4 — La lista de compras

Recopila los ingredientes de todo lo cargado. **Deriva del plan y no se escribe
en Drive:** se lee en la app y se comparte como texto.

#### C06.4.1 — Cómo se arma *(J9)*

- [ ] Toma los ingredientes de cada receta cargada, **una vez por aparición**:
  una receta en dos comidas cuenta dos veces.
- [ ] Las recetas se leen de Drive al entrar, una por receta distinta del plan
  —la misma en dos comidas se lee una sola vez—; una que ya no se puede leer se
  saltea. **Se leen solapadas, de a seis como el reindexado, y con la pantalla
  tapada** (`E05-Cimientos.md` R8): es la espera más larga de la app, y en fila
  y sin señal parecía colgada.
- [ ] La lista armada se guarda en memoria mientras el plan no cambie: volver a
  entrar, o abrir la ficha de compartir, no vuelve a leer nada.
- [ ] Dos bloques: **Con cantidad** y **Sin cantidad** (C05.1.3).
- [ ] **Se suman** las cantidades de mismo nombre cuando las dos empiezan con un
  número y el resto del texto —recortado y en minúsculas— coincide:
  `250 g` + `250 g` = `500 g`. Coma o punto como decimal; el resultado se escribe
  con punto y sin ceros de más.
- [ ] **No se convierte nada:** `500 g` y `2 tazas` del mismo nombre son dos
  ítems, uno debajo del otro.
- [ ] Una cantidad que no empieza con número —`½`, `un puñado`, `c/n`— no se suma
  con nada: queda como ítem propio.
- [ ] Sin cantidad: una vez por nombre, como recordatorio, sin deducir nada.
- [ ] Los nombres se comparan **tal como están escritos** (C05.4b.1): dos
  escrituras del mismo ingrediente son dos ítems, y eso es esperado.
- [ ] Orden alfabético por nombre en los dos bloques; para el mismo nombre, el
  orden en que aparecieron.

#### C06.4.2 — Cómo se ve y cómo se comparte *(J9)*

- [ ] Los dos bloques son fichas, con las filas de ingredientes de la receta:
  nombre a la izquierda, cantidad a la derecha. Un bloque vacío no se dibuja.
- [ ] Sin ningún ingrediente —las recetas del plan no los tienen, o ya no se
  pueden leer—, la pantalla dice *«Las recetas del plan no tienen ingredientes
  cargados.»*
- [ ] Si la lectura falla, la pantalla avisa *«No se pudo armar la lista de
  compras.»* con **Reintentar** (R1).
- [ ] **No se tilda nada.** La lista se lee en el supermercado y no guarda
  estado: sin ítems tachados, sin progreso, sin nada que sincronizar.
- [ ] El ícono de compartir del encabezado abre la ficha de compartir con
  **Texto** como única opción, con la negrita de WhatsApp (§6.23).
- [ ] La lista no se guarda en Drive ni en el navegador: se arma cada vez que se
  entra.

### F06.5 — La entrada

#### C06.5.1 — Una entrada, en el menú lateral *(J9)*

- [ ] **Plan de la semana**, con el ícono del calendario, entre *Borradores* y
  *Nueva receta* (IA §4.6).
- [ ] Es la única entrada: el Recetario no cambia, y la receta no ofrece
  planificar.
- [ ] **Sacar la épica es borrar esa entrada, las tres pantallas
  (`ui/plan.ts`, `ui/plan-agregar.ts`, `ui/compras.ts`), los módulos `plan.ts`
  y `compras.ts` y `_plan.md`**, y sacar lo que los conecta con el resto: la
  lectura y la escritura del plan en `store.ts`, sus acciones en `main.ts`, sus
  rutas en `ui/router.ts`, `NOMBRE_PLAN` en `config.ts` y el aviso de
  `_plan.md` repetido en `ui/ajustes.ts`. El índice y el esquema del `.md` de
  receta no cambian.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C06.1.1, C06.1.2, C06.1.3, C06.1.4, C06.2.1, C06.3.2, C06.4.1, C06.4.2, C06.5.1 | J9 |
| C06.3.1 | J9, J8 |

Ninguna capacidad de esta épica quedó sin job.
