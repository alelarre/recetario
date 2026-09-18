# Plan de implementación — El plan de la semana y la lista de compras

Spec: `docs/superpowers/specs/2026-09-17-planificador-design.md`.
Mockup: `product-design/ux/mockups/12-plan.html`.

Once tareas en orden. Cada una es test primero (el test falla, después pasa) y
un commit. Las tres primeras son dominio puro; después el store, después las
pantallas, después el cableado, y los documentos al final.

---

## T1 — El tipo y el archivo (`plan.ts`) · spec §3

**Toca:** `src/tipos.ts` (nuevo: `Plan`, `Comida`, `Momento`), `src/plan.ts`
(nuevo), `src/config.ts` (`NOMBRE_PLAN = '_plan.md'`).

- `DIAS` (Lunes…Domingo), `DIAS_CORTOS` (Lun…Dom), `MOMENTOS`
  (`mediodia`/`noche`) con su etiqueta (*Mediodía*, *Noche*).
- `parsePlan(texto): Plan` — `## <Día>` abre el día; `- <Momento>: [título](drive:<id>)`
  es una comida. Lo que no se reconoce se ignora. Los nombres se comparan con
  `normalizar()` de `recipe.ts`.
- `serializePlan(plan): string` — un `## <Día>` por día con algo, de lunes a
  domingo, en el orden del arreglo dentro de cada comida. Plan vacío → `''`.
- `diaDeHoy(fecha)` → 0..6 con lunes = 0, desde `getDay()`.
- `diasDesde(hoy)` → los siete índices desde hoy, dando la vuelta.

**Tests:** `tests/plan.test.ts` — ida y vuelta; líneas inválidas ignoradas
(día inexistente, línea sin link, momento desconocido); días vacíos no
escritos; varias recetas por comida; el plan vacío es un archivo vacío; día y
momento sin acentos ni mayúsculas; el orden de los días desde hoy.

## T2 — La lista de compras (`compras.ts`) · spec §4

**Toca:** `src/compras.ts` (nuevo).

- `listaDeCompras(recetas: Receta[]): ListaDeCompras` con
  `{ conCantidad: Item[]; sinCantidad: string[] }`. Los ingredientes salen de
  `gruposDe(receta.ingredientes)`, una vez por aparición.
- Suma sólo cuando las dos cantidades empiezan con número y el resto del texto
  —recortado y en minúsculas— coincide. Coma o punto como decimal; se escribe
  con punto y sin ceros de más. Nada se convierte.
- Una cantidad que no empieza con número es su propio ítem.
- Sin cantidad: una vez por nombre.
- Orden alfabético por nombre en los dos bloques; para el mismo nombre, el
  orden de aparición.
- `textoCompras(lista)`: `*Con cantidad*` / `*Sin cantidad*` en negrita de
  WhatsApp y `- Nombre: cantidad`, como `texto-receta.ts`.

**Tests:** `tests/compras.test.ts` — suma de iguales, no conversión, sin
cantidad, mismo nombre con distinta unidad, orden, receta dos veces, decimales
con coma, cantidad no numérica, el texto para compartir.

## T3 — El store: leer y guardar el plan · spec §6

**Toca:** `src/store.ts`.

- `plan()`: la primera vez busca `_plan.md` por nombre en la carpeta base; el
  id queda en el contexto. Con más de uno manda el más reciente y queda
  anotado para *Ajustes → Avisos* (`planDuplicado()`). Sin archivo, plan vacío.
- `guardarPlan(plan)`: reescribe el `.md` entero, creándolo si no existe.
  Reiniciar es `guardarPlan({ comidas: [] })`.
- `reconstruir()` deja de indexar los `.md` cuyo nombre empieza con `_`: sin
  eso `_plan.md` entraría al índice como receta suelta.

**Tests:** `tests/store-plan.test.ts` — encontrar por nombre, una sola búsqueda
por sesión, leer, crear al primer cambio, guardar sobre el existente,
reiniciar, el duplicado, y que el reindexado saltee `_plan.md`.

## T4 — El CSS de las pantallas · mockup 12

**Toca:** `src/ui/base.css`, `src/ui/tokens.css`.

- `base.css`: la grilla del plan (`.grilla-sem`, `.cab`, `.d`, `.celda`,
  `.it`, `.mas`) y el pie pegado (`.pie-plan`), copiados del mockup con la
  densidad de comentarios del archivo. La línea del ítem lleva su `×`, así que
  `.it` es un contenedor con el link y el botón adentro.
- `tokens.css`: `button.tarjeta` —la tarjeta que suma al plan es un botón, no
  un link.

**Tests:** `tests/estilos-plan.test.ts` — las clases del mockup existen en
`base.css`.

## T5 — La pantalla del plan (`ui/plan.ts`) · spec §5

**Toca:** `src/ui/plan.ts` (nuevo).

Encabezado con volver y *Plan de la semana*; la grilla de tres columnas con
siete filas desde hoy, *hoy* debajo del nombre; cada celda con sus líneas —con
el color de su categoría, link a la receta y su `×`— y el `+` al pie; la celda
vacía es sólo el `+`, con borde punteado; la receta que ya no está en el índice
va tachada y en `--error`. Al pie, *Lista de compras* y *Reiniciar el plan*,
deshabilitados con el plan vacío, y la confirmación en su lugar.

**Tests:** `tests/vista-plan.test.ts` — el orden de los días desde hoy, hoy
marcado, celdas con varias recetas, la tachada, la confirmación, los botones
deshabilitados con el plan vacío, el `×` por línea.

## T6 — Agregar una receta (`ui/plan-agregar.ts`) · spec §5

**Toca:** `src/ui/plan-agregar.ts` (nuevo), `src/ui/componentes.ts` (la
tarjeta acepta una acción en vez de llevar a la receta).

Encabezado con volver y *Martes al mediodía*; la caja de búsqueda arriba; el
bloque *Menú diario* debajo, alfabético, que no se dibuja si no hay ninguna;
con texto escrito, los resultados agrupados como en `#/buscar`. El bloque de
abajo se redibuja solo, sin repintar la pantalla, para no perder el foco.

**Tests:** `tests/vista-plan-agregar.test.ts`.

## T7 — La lista de compras (`ui/compras.ts`) · spec §5

**Toca:** `src/ui/compras.ts` (nuevo), `src/ui/compartir.ts` (la ficha con
*Texto* solamente).

Encabezado con volver, *Lista de compras* y el ícono de compartir; los dos
bloques como fichas con filas `.ing`.

**Tests:** `tests/vista-compras.test.ts`.

## T8 — Las rutas y la entrada del menú · spec §6

**Toca:** `src/ui/router.ts`, `src/ui/componentes.ts` (`lateral`, `DestinoLateral`).

`plan`, `plan-agregar` (con `dia` y `momento`) y `plan-compras`. *Plan de la
semana* entra en el menú lateral entre *Borradores* y *Nueva receta*, con el
ícono del calendario.

**Tests:** `tests/router.test.ts` y `tests/componentes.test.ts`.

## T9 — El cableado · spec §6 y §7

**Toca:** `src/main.ts`.

Las tres rutas dibujan; la copia del plan se conserva entre ellas y se descarta
al salir; agregar suma, escribe y vuelve; sacar escribe; reiniciar pide
confirmación; las recetas de la lista de compras se leen al entrar y una que ya
no está se saltea; compartir la lista como texto. Toda escritura va envuelta en
`escribiendo(...)`, y un fallo avisa en el plan sin cambiar la grilla.

**Tests:** en `tests/main-rutas.test.ts`.

## T10 — El aviso del `_plan.md` repetido

**Toca:** `src/ui/ajustes.ts`, `src/main.ts`.

Una línea más en *Ajustes → Avisos*, con la forma del `_indice` duplicado.

**Tests:** `tests/vista-ajustes.test.ts`.

## T11 — Los documentos · spec §9

**Toca:** `product-design/product/specs/E06-Planificar.md` (reescrito como
épica real, con capacidades `C06.x.y` y trazabilidad),
`product-design/product/strategy/product-principles.md` (principio 6),
`product-design/product/strategy/jtbd.md` (J9),
`product-design/ux/information-architecture.md` (entidad, archivo, rutas,
menú), `product-design/ux/user-flows.md` (F13),
`product-design/ux/design-system.md` (la grilla del plan),
`CLAUDE.md` (`_plan.md` en «Lo esencial» y el mapa de `src/`),
`BACKLOG.md` (sale P32).
