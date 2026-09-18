# El plan de la semana y la lista de compras

**Resuelve:** `BACKLOG.md` P32. Reemplaza la exploración de
`product-design/product/specs/E06-Planificar.md`. La especificación visual es
el mockup `product-design/ux/mockups/12-plan.html`.

## 1. Qué es

Un plan de siete días, de lunes a domingo, **sin fechas**: la pantalla arranca
en el día de hoy y sigue hasta dar la vuelta. Cada día tiene dos comidas,
mediodía y noche, y cada comida es una **lista de recetas** del recetario,
sin límite ni tipos: una entrada, un principal y un postre, o dos principales,
lo que sea. Un día cargado se mantiene hasta que se cambie o se reinicie el
plan. De ahí sale la lista de compras.

Se llega desde el menú lateral. Sacarlo cuesta borrar esa entrada, tres
pantallas, dos módulos y un archivo de Drive.

## 2. Lo decidido

1. **Un solo plan, un solo archivo:** `Recetario/_plan.md`, en la carpeta
   base, al lado de `_indice`. Se reescribe entero con cada cambio.
2. **Sin fechas, sin semanas.** No hay semana siguiente ni historial. El
   orden de los días en pantalla es el único lugar donde entra la fecha de hoy.
3. **Varias recetas por comida.** Agregar suma; sacar saca una. No existe
   «reemplazar».
4. **Reiniciar el plan** vacía los siete días, con confirmación.
5. **Asignar** sólo desde el plan: la pantalla de agregar tiene las recetas
   con tag `menú diario` arriba y la búsqueda del Recetario debajo. No hay
   «planificar» desde la receta.
6. **La lista de compras** se deriva del plan, se lee en la app y se comparte
   como texto. No se escribe en Drive.
7. **Nada cambia en `_indice`:** ni hoja ni columna. `SCHEMA_VERSION` no
   sube y el reindexado no mira `_plan.md`.
8. Cada cambio escribe en el momento, con el velo de escritura (R8).
   Reintentar reescribe todo (R2).

## 3. El archivo

`_plan.md`, legible sin la app. Sin frontmatter. Un `## <Día>` por día con
algo cargado, en orden de lunes a domingo; una línea por receta, con la comida
como prefijo y un link `[título](drive:<fileId>)`. El título está para leerlo;
el id es lo que usa la app.

```md
## Martes
- Noche: [Rabas](drive:1EjWIrmaQ)
- Noche: [Ensalada verde](drive:10szFByXS)
- Noche: [Flan casero](drive:1T7vf_BgC)

## Jueves
- Mediodía: [Ñoquis de papa](drive:1lYb6YB9Q)
```

- Un día sin nada no se escribe. El plan reiniciado es un archivo vacío.
- `src/plan.ts`, nuevo, con formato propio como `borrador.ts`: `parsePlan`
  y `serializePlan`. Al parsear, se ignora lo que no se reconoce —un día que
  no existe, una línea sin link, una comida que no es *Mediodía* ni
  *Noche*— y no se conserva al reescribir. Los nombres de día se comparan
  sin acentos ni mayúsculas.
- **El tipo** (`src/tipos.ts`):
  `Plan = { comidas: Comida[] }`,
  `Comida = { dia: 0..6; momento: 'mediodia' | 'noche'; id: string; titulo: string }`,
  con `dia` 0 = lunes. El orden dentro de una comida es el del archivo.
- **Cómo se encuentra:** por nombre, `_plan.md` en la carpeta base, con una
  búsqueda en Drive la primera vez que se abre el plan en la sesión; el id
  queda en memoria. Si no existe, se crea vacío al primer cambio. Si hay más
  de uno, manda el más reciente y se avisa en *Ajustes → Avisos*, como el
  `_indice` duplicado. Como `_borradores/`, el `_` lo deja fuera de las
  categorías y del reindexado.

## 4. Cómo se arma la lista de compras

`src/compras.ts`, nuevo y puro: `listaDeCompras(recetas: Receta[]) →
{ conCantidad: Item[]; sinCantidad: string[] }`, con `Item = { nombre; cantidad }`.

- Se toman los ingredientes de cada receta cargada, **una vez por aparición**:
  una receta en dos comidas cuenta dos veces.
- Cada ingrediente ya viene como nombre + cantidad (C05.1.3). Sin cantidad va
  al bloque *Sin cantidad*, una vez por nombre; con cantidad, al bloque *Con
  cantidad*.
- **Se suman** las cantidades de mismo nombre cuando las dos empiezan con un
  número —`250 g`, `1.5 l`, `3`— y el resto del texto, recortado y en
  minúsculas, coincide: `250 g` + `250 g` = `500 g`. Coma o punto como
  decimal; el resultado se escribe con punto y sin ceros de más.
- **No se convierte nada:** `500 g` y `2 tazas` del mismo nombre son dos
  ítems, uno debajo del otro. Una cantidad que no empieza con número —`½`,
  `un puñado`, `c/n`— no se suma con nada: queda como ítem propio.
- Los nombres se comparan tal como están escritos, sin normalizar (C05.4b.1).
- Orden: alfabético por nombre en los dos bloques; para el mismo nombre, en
  el orden en que aparecieron.
- **Como texto** (`src/texto-compras.ts` o dentro de `compras.ts`): las dos
  secciones con `*Con cantidad*` y `*Sin cantidad*` en negrita de WhatsApp y
  `- ` por ítem, `Nombre: cantidad`, igual que `texto-receta.ts`.

## 5. Las pantallas

Tres pantallas nuevas en `src/ui/`, sobre `componentes.ts`, siguiendo el
mockup `12-plan.html`.

**`#/plan` — El plan** (`src/ui/plan.ts`)
- Encabezado con volver y el título *Plan de la semana*.
- Una grilla de tres columnas: el día, *Mediodía* y *Noche*. Siete filas
  **desde hoy**: hoy primero, con *hoy* debajo del nombre en acento, y los
  demás en orden hasta dar la vuelta. Los nombres van abreviados: *Lun*,
  *Mar*, *Mié*, *Jue*, *Vie*, *Sáb*, *Dom*.
- Cada celda es una lista: una línea por receta, con el color de su categoría
  en el borde izquierdo, que lleva a la receta (`#/r/<id>`); y al pie un `+`
  que lleva a agregar. Una celda vacía es sólo el `+`, con borde punteado.
- Sacar una receta: cada línea tiene una `×` a la derecha, y saca esa línea
  nada más.
- Si la receta ya no está en el índice, la línea se ve tachada, con el borde
  en `--error`, y su `×`; no se borra sola.
- Al pie, pegado: **Lista de compras** (primario, deshabilitado con el plan
  vacío) y **Reiniciar el plan** (secundario, deshabilitado con el plan
  vacío). Reiniciar pone la confirmación en el lugar de los dos botones, con
  borde de error como borrar una receta: *«¿Reiniciar el plan? Se vacían los
  siete días.»*, *Cancelar* y *Reiniciar*.
- El plan parcial es el caso normal y no se señala. El plan vacío no lleva
  aviso: las catorce celdas con su `+` ya lo dicen.

**`#/plan/agregar?dia=&momento=` — Agregar una receta** (`src/ui/plan-agregar.ts`)
- Encabezado con volver y el título *Martes al mediodía* (el día completo).
- Arriba, la caja de búsqueda del Recetario; debajo, el bloque *Menú diario*
  con las recetas de ese tag como tarjetas de lista, alfabético. Si no hay
  ninguna, el bloque no se dibuja. Al escribir, el bloque se reemplaza por los
  resultados agrupados como en `#/buscar` (C02.3.2).
- Tocar una tarjeta la suma a esa comida, escribe y vuelve al plan. En esta
  pantalla las tarjetas no llevan a la receta.

**`#/plan/compras` — La lista de compras** (`src/ui/compras.ts`)
- Encabezado con volver, *Lista de compras* y el ícono de compartir, que abre
  la ficha de compartir con **Texto** solamente.
- Los dos bloques como fichas, con las filas de ingredientes (`.ing`) de la
  receta: nombre a la izquierda, cantidad a la derecha.
- No se tilda nada. Sin estado.

**La entrada** (`src/ui/componentes.ts`, el menú lateral): *Plan de la
semana*, con el ícono `calendario`, entre *Borradores* y *Nueva receta*. Es
la única entrada: el Recetario no cambia. Esto reabre el principio 6, que
dejaba el planificador fuera de la navegación primaria: queda anotado en
`product-principles.md`.

## 6. Cableado y store

`main.ts`, con el mismo patrón que los borradores:
- Rutas en `router.ts`: `plan`, `plan-agregar` (con `dia` y `momento`) y
  `plan-compras`. Sólo `plan` dibuja el menú lateral y entra en
  `PANTALLAS_CON_MENU`; agregar y compras llevan volver.
- `store.plan()` devuelve el plan leído de Drive; la copia se conserva
  mientras se navega entre las tres pantallas, como `borradorLeido`, y se
  descarta al salir a otra.
- `store.guardarPlan(plan)` escribe `_plan.md` entero, creándolo si no
  existe. Reiniciar es `guardarPlan({ comidas: [] })`.
- Las recetas para la lista de compras se leen de Drive al entrar a
  `#/plan/compras`, una por receta distinta del plan; con diez recetas son
  diez lecturas y es aceptable. Una que ya no está se salta.
- El día de hoy sale de `new Date().getDay()` del teléfono, pasado a 0 =
  lunes.
- El velo de escritura (R8) envuelve `guardarPlan`.

## 7. Casos borde

- **Sin red al escribir:** aviso en el plan y reintentar es volver a tocar
  (R1). La grilla vuelve a lo que decía Drive.
- **La misma receta dos veces en una comida:** se permite; la lista la
  cuenta dos veces. Cada línea tiene su `×`.
- **Receta borrada:** el archivo la sigue nombrando por título; la app la
  marca y la lista de compras la salta.
- **`_plan.md` editado a mano:** se lee tal cual; lo que no se entiende se
  ignora y se pierde al próximo guardado.
- **Borrar datos locales:** no toca el plan.
- **Invitado:** no ve nada de esto.

## 8. Tests

- `tests/plan.test.ts`: parse y serialize, ida y vuelta; líneas inválidas
  ignoradas; días vacíos no escritos; varias recetas por comida; el plan
  vacío es un archivo vacío.
- `tests/compras.test.ts`: suma de cantidades iguales, no conversión, sin
  cantidad, nombre repetido con distinta unidad, orden, receta dos veces,
  decimales con coma, el texto para compartir.
- `tests/vista-plan.test.ts`: el orden de los días desde hoy, hoy marcado,
  celdas con varias recetas, la tachada, la confirmación de reiniciar, los
  botones deshabilitados con el plan vacío.
- `tests/vista-plan-agregar.test.ts`, `tests/vista-compras.test.ts`.
- `tests/store-plan.test.ts`: encontrar por nombre, crear al primer cambio,
  leer, guardar, reiniciar, el duplicado.
- `tests/main-rutas.test.ts`: las tres rutas dibujan; agregar suma y vuelve;
  sacar escribe; reiniciar con confirmación; la entrada del menú.

## 9. Documentos

- `E06-Planificar.md` deja de ser exploración: se reescribe con lo de acá,
  con capacidades numeradas y trazabilidad.
- `product-principles.md`, principio 6: el plan entra en el menú lateral.
- `jtbd.md`: J9 pasa de hipotético a construido.
- `information-architecture.md`: la entidad plan, `_plan.md`, las tres rutas,
  el menú lateral.
- `user-flows.md` F13: el flujo real.
- `design-system.md`: la grilla del plan y sus celdas.
- `ux/mockups/`: `12-plan.html` reemplaza a `12-planificador.html` y
  `13-lista-compras.html`.
- `CLAUDE.md`: `_plan.md` en «Lo esencial»; `plan.ts` y `compras.ts` en el
  mapa de `src/`.
- `BACKLOG.md`: sale P32.

## 10. Probar en el teléfono

- Entrar desde el menú, agregar dos recetas a hoy a la noche, ver `_plan.md`
  en Drive.
- Sacar una; borrar una receta cargada y ver la marca.
- La lista de compras con dos recetas que comparten un ingrediente, y
  compartirla por WhatsApp.
- Reiniciar el plan y ver el archivo vacío.
- Al día siguiente, que el plan arranque en el nuevo hoy con lo cargado.
