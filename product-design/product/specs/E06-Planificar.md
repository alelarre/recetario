# E06 — Planificar `[exploración]`

**Versión:** 3.0 · **Fecha:** 2026-09-07 · **Estado:** Final — Hito 11
**Job:** J9 · **Prioridad:** sin comprometer · **Flujo:** F13

> **Cambio en la 3.0 (Hito 11):** la épica entera pasa al backlog. Sigue
> diseñada y mockupeada, sin comprometer (`plan/BACKLOG.md` §2).
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. El nivel de detalle es deliberadamente menor que
> el de las otras cinco épicas: es exploración, y detallarla al mismo nivel la
> instalaría, que es justo lo que el principio 6 evita.

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

Decidir qué comida concreta va cada día de la semana, y que de ahí salga la lista
de compras.

**Es exploración, no producto comprometido.** J9 es el único job hipotético del
proyecto y el único que **cambiaría** la conducta del usuario en vez de
acompañarla.

El principio 6 fija las condiciones: no entra en la navegación primaria, no
define entidades nuevas en el núcleo, y **sacarla tiene que costar borrar una
pantalla, no rediseñar el producto**.

Y el mercado no ayuda: AnyList, Mealie, Tandoor y Recipe Box tienen todos
planificador y lista de compras. Recetario llega último y sin diferencial.

---

## Features

### F06.1 — La grilla de la semana

Dos comidas por día, los siete días. Granularidad de comida concreta.

#### C06.1.1 — La grilla *(J9)*

- [ ] Siete días, dos espacios cada uno: mediodía y noche.
- [ ] La semana se identifica por sus fechas y se muestra en el encabezado.
- [ ] Un espacio vacío muestra un control para asignar; uno ocupado muestra el título de la receta.
- [ ] Estados: semana vacía · semana parcial, que es el caso normal.
- [ ] La semana parcial **no se señala como incompleta**: no llenarla es normal.

### F06.2 — Asignar una receta a un espacio

Solo entran recetas del recetario. Que una comida se cocine de memoria no
significa que la receta no esté registrada.

#### C06.2.1 — Asignar *(J9)*

- [ ] Tocar un espacio vacío abre la búsqueda del Recetario, con los mismos criterios (C02.3.1).
- [ ] Elegir un resultado lo asigna y vuelve a la grilla.
- [ ] **No se puede asignar texto libre:** solo recetas del recetario.
- [ ] Un espacio ocupado se puede vaciar o reemplazar.
- [ ] La misma receta puede estar en varios espacios.
- [ ] Tocar una receta asignada lleva a la receta, no al editor.

**Edge case:** la receta asignada se borró → el espacio muestra que la receta ya
no está y ofrece vaciarlo. No se borra solo.

### F06.3 — El plan es un archivo

Un archivo en Drive, como todo lo demás. Por homogeneidad y por el principio 1.

#### C06.3.1 — El plan en Drive *(J9, J8)*

- [ ] Un archivo por semana, legible sin la app.
- [ ] Referencia a las recetas por `fileId` **y** por título, para que siga siendo legible si el índice no está (R5).
- [ ] Cada cambio en la grilla se guarda; si falla, avisa y se reintenta (R1, R2).

### F06.4 — La lista de compras

Recopila los ingredientes de todo lo planificado.

#### C06.4.1 — Degrada con gracia, y lo muestra *(J9)*

- [ ] Junta los ingredientes de todas las recetas asignadas en la semana.
- [ ] Dos bloques: **con cantidad** y **sin cantidad**.
- [ ] Con cantidad: los ingredientes de mismo nombre y misma unidad se suman.
- [ ] Distinta unidad para el mismo nombre → **no se convierte**: se listan las dos, una debajo de la otra.
- [ ] Sin cantidad: se listan tal cual, como recordatorio, sin intentar deducir nada.
- [ ] Los nombres se comparan **tal como están escritos** (C05.4b.1): dos escrituras distintas del mismo ingrediente son dos ítems, y eso es esperado.

### F06.5 — La lista también es un archivo

Deriva del plan y se escribe en Drive.

#### C06.5.1 — La lista en Drive *(J9, J8)*

- [ ] Se escribe como archivo, legible sin la app.
- [ ] Se regenera desde el plan cada vez que el plan cambia.
- [ ] **No se puede tildar nada:** la lista se lee en el supermercado y no guarda estado. Sin ítems tachados, sin progreso, sin nada que sincronizar.

### F06.6 — Entrada en el Recetario

La entrada vive **en el Recetario, debajo de las categorías**: visible y
alcanzable en dos toques, sin ser uno de los lugares primarios.

#### C06.6.1 — La entrada *(J9)*

- [ ] Un bloque debajo de las categorías, en el Recetario.
- [ ] No hay barra de navegación ni tercer lugar primario.
- [ ] **Sacar la épica cuesta borrar ese bloque y dos pantallas**, y nada más del producto cambia.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C06.1.1, C06.2.1, C06.4.1, C06.6.1 | J9 |
| C06.3.1, C06.5.1 | J9, J8 |

Todas las capacidades de esta épica dependen de J9, que es **hipotético**: la
épica entera está marcada `[exploración]` y no se compromete.
