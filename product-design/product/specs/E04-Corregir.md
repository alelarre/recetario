# E04 — Corregir

**Versión:** 3.0 · **Fecha:** 2026-09-07 · **Estado:** Final — Hito 11
**Job:** J7 · **Prioridad:** baja · **Flujo:** F7

> **Cambio en la 3.0 (Hito 11):** sin cambios de comportamiento. El alcance del
> editor coincide con `product-vision.md` §1 desde su v2.1.
>
> **Cambio en la 2.1 (Hito 9):** la convención del ingrediente es `nombre` +
> separador + `cantidad` (C05.1.3), no la cantidad en itálica.
>
> **Cambios en la 2.0 (Hito 7):** features partidas en capacidades con criterios
> de aceptación y edge cases. El guardado deja de tener debounce: la fila del
> índice se escribe sincrónicamente (C05.4.1). Se precisa que editar el título
> **no renombra el archivo** (R5).

**Reglas transversales:** ver `E05-Cimientos.md` §Reglas.

---

## La épica

Arreglar un error descubierto al cocinar, o anotar una variación que salió mejor.

**El editor corrige, y crea una receta que ya tenés en la cabeza.** Lo que no
hace es componer desde una fuente: transcribir un PDF, un video o la foto de un
libro sigue siendo trabajo del agente. Es el mismo formulario para las dos cosas.

La distinción es estratégica, no una limitación de alcance: un editor que
compitiera con la ruta de entrada real no la mejoraría.

---

## Features

### F04.1 — Editar desde la receta

A un toque desde la receta que se está leyendo, que es donde se descubre el
error.

#### C04.1.1 — La entrada al editor *(J7)*

- [ ] **Editar** está al pie de la receta abierta, a un toque.
- [ ] El editor abre con todos los campos cargados con lo que dice el `.md`.
- [ ] Salir sin guardar con cambios pendientes **pregunta antes**.
- [ ] Salir sin cambios no pregunta nada.

### F04.2 — Un formulario de campos separados

Título, categoría, tags, rinde, tiempo, dificultad, fuente y foto, cada uno con
su control. **El frontmatter YAML no se ve:** es estructura, no contenido, y el
archivo se arma solo al guardar.

#### C04.2.1 — Los campos del frontmatter *(J7)*

- [ ] Un control por clave: título (texto), tags (lista editable), rinde, tiempo, fuente y foto (texto), dificultad (elección de tres).
- [ ] **El YAML no se muestra en ningún momento.**
- [ ] Solo el título es obligatorio.
- [ ] Un campo que se deja vacío **no se escribe** en el frontmatter: no quedan claves vacías.
- [ ] `rinde` y `tiempo` son texto libre, no números: *"4 porciones"*, *"40 min"*.

#### C04.2.2 — El título no renombra el archivo *(J7)*

- [ ] Cambiar el título reescribe el frontmatter y **deja el archivo con el mismo nombre en Drive** (R5).
- [ ] La identidad de la receta sigue siendo su `fileId`.

#### C04.2.3 — La categoría es un control que actúa *(J7)*

- [ ] Las opciones son las subcarpetas de `Recetario/`, las mismas del Recetario (C02.4.1).
- [ ] Cambiarla **mueve el archivo entre carpetas de Drive** al guardar. No escribe nada en el frontmatter: la carpeta es la única verdad de la categoría.
- [ ] Al guardar se actualiza la categoría de la fila del índice.
- [ ] Si el movimiento falla, avisa y el reintento repite todo el guardado (R2).

### F04.3 — El contenido, en texto plano

Descripción, ingredientes, preparación, variaciones y notas: cada sección es un
campo de texto y se guarda tal cual en su lugar del `.md`.

#### C04.3.1 — Un campo de texto por sección *(J7)*

- [ ] Cinco campos: descripción, ingredientes, preparación, variaciones y notas.
- [ ] Lo escrito se guarda tal cual bajo su encabezado del `.md`.
- [ ] Un campo vacío no escribe su encabezado: no quedan secciones vacías en el archivo.

#### C04.3.2 — Los ingredientes son un campo de texto más *(J4, J7)*

- [ ] **No hay un control por ingrediente**: es un único campo, como la preparación.
- [ ] La estructura es por convención: cada bullet es un ingrediente, los `###` son grupos, y la cantidad va después del separador (C05.1.3).
- [ ] El editor **no corrige, no autocompleta y no valida** la convención.
- [ ] Una receta mal tipeada queda fuera del filtro por ingrediente y figura como incompleta. Es el costo aceptado y es consistente con el principio 3.

#### C04.3.3 — El editor no impone formato *(J7, J8)*

- [ ] Lo escrito se guarda literal: el editor no reordena secciones, no normaliza bullets y no cambia el markdown.
- [ ] El orden de las secciones del archivo original se conserva.

### F04.3b — Crear una receta nueva

El mismo formulario, con los campos vacíos.

#### C04.3b.1 — Nueva receta *(J7)*

- [ ] Los mismos campos, vacíos. Solo el título es obligatorio.
- [ ] La categoría hay que elegirla: sin ella no se sabe en qué carpeta va el archivo.
- [ ] Guardar crea el `.md` en la carpeta elegida y escribe su fila del índice, con la operación de la capa compartida (C05.4.1).
- [ ] El nombre del archivo se deriva del título **una sola vez, al crearlo**, y no vuelve a cambiar (C04.2.2): el título en minúsculas, sin acentos y con guiones — `milanesas-napolitanas.md`.
- [ ] Si ya existe un archivo con ese nombre en la carpeta, se usa un nombre distinto sin preguntar: la identidad es el `fileId`, no el nombre.
- [ ] **Desde un borrador** (C01.6.3), el editor abre con el título y la `fuente` cargados, y guardar borra la fila del borrador en la misma operación (C01.7.1).

### F04.3c — Lo desconocido se conserva

Si el `.md` traía claves o secciones que el esquema no reconoce, se conservan al
guardar. Pasar por el editor no puede hacer perder contenido que un agente o el
usuario escribieron afuera.

#### C04.3c.1 — Nada se pierde por pasar por el editor *(J8)*

- [ ] Las claves desconocidas del frontmatter se reescriben tal cual.
- [ ] Las secciones desconocidas del cuerpo se reescriben tal cual, en su posición.
- [ ] El editor no las muestra ni permite editarlas: no son suyas.
- [ ] Guardar una receta sin tocar ningún campo produce un archivo equivalente al original.

**Nota técnica:** Drive no tiene escritura parcial — guardar reescribe el `.md`
entero. Por eso conservar lo desconocido no es una mejora: si el editor no lo
conserva, lo borra.

### F04.4 — Declarar una receta completa

La salida manual del estado derivado: el usuario dice que la receta está bien
así —una técnica, un fondo, una masa madre— y la marca desaparece.

#### C04.4.1 — El control *(J7)*

- [ ] Una casilla al pie del editor: *"Está completa así como está"*.
- [ ] Marcarla escribe `completa: true` en el frontmatter.
- [ ] Desmarcarla **borra la clave**; nunca escribe `completa: false` (C05.3.2).
- [ ] Es una declaración del usuario, no una edición de contenido: es la única excepción del principio 3 y es del usuario, no del agente.
- [ ] También se llega acá desde la marca de incompleta de la receta abierta, que abre el editor (C03.1.3).

### F04.5 — Guardar

Reescribe el `.md` en Drive y actualiza su fila en el índice.

#### C04.5.1 — Las dos escrituras *(J7)*

- [ ] Guardar escribe el `.md` entero y después la fila del índice, sincrónicamente (C05.4.1).
- [ ] El guardado se declara exitoso recién cuando las dos terminaron.
- [ ] Mientras guarda, el botón indica que está trabajando y no se puede tocar dos veces.
- [ ] Al terminar, vuelve a la receta, ya con lo guardado.

#### C04.5.2 — Cuando falla *(J7)*

- [ ] Avisa (R1) y **todo lo escrito queda en pantalla**.
- [ ] El reintento repite las dos escrituras (R2).
- [ ] Si falló la segunda, el `.md` ya está guardado y el reintento lo reescribe igual: no hay reparación parcial.
- [ ] Sesión vencida: el aviso ofrece reconectar y, al volver, el usuario reintenta a mano (R3).

### F04.6 — Borrar una receta

Borra el `.md` y su fila del índice. Es la única operación destructiva de la app
sobre contenido del usuario.

#### C04.6.1 — Borrar *(J7)*

- [ ] Pide confirmación, y la confirmación nombra la receta.
- [ ] Borra el `.md` de Drive y la fila del índice.
- [ ] Al terminar, vuelve a la lista de donde se venía.
- [ ] Si falla, avisa y la receta sigue estando (R1).
- [ ] Si el `.md` ya no existía, se borra la fila igual y no es un error.

**Nota técnica:** el archivo va a la papelera de Drive, no se destruye. La app no
ofrece deshacer: la papelera de Drive es la red de seguridad, y es del usuario.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C04.1.1, C04.2.1, C04.2.2, C04.2.3, C04.3.1, C04.3b.1, C04.4.1, C04.5.1, C04.5.2, C04.6.1 | J7 |
| C04.3.2 | J4, J7 |
| C04.3.3 | J7, J8 |
| C04.3c.1 | J8 |

Ninguna capacidad de esta épica quedó sin job.
