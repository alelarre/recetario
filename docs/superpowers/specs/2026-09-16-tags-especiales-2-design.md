# Tags especiales, segunda parte — diseño

**Fecha:** 2026-09-16
**Estado:** Aprobado en conversación; pendiente de revisión escrita.
**Parte de:** `product-design/plan/BACKLOG.md` P27. Sigue a
`docs/superpowers/specs/2026-09-16-tags-especiales-design.md`, ya implementado.
**Reabre:** la decisión del 2026-09-12 «la completitud es una declaración del usuario» —se
mantiene como declaración; cambia dónde se guarda— y C05.3.1 a C05.3.3 de
`E05-Cimientos.md`.

---

## 1. Qué cambia

Salió de probar la primera parte en el teléfono:

1. **No había forma de poner `probar` ni `menú diario`.** El spec anterior decía a la vez
   que se ponían desde el editor y que escribirlos a mano estaba prohibido.
2. **Las marcas de la tarjeta estaban repartidas:** la estrella en la esquina y la de
   incompleta al final de la línea de contexto.
3. **La completitud era un mecanismo aparte** —la clave `completa` del frontmatter y su
   conmutador— cuando se comporta como un tag especial más.

La respuesta: **`incompleta` pasa a ser el cuarto tag especial**, los cuatro se ponen desde
**un botón cada uno en el editor**, y sus marcas van **juntas en la esquina de la tarjeta**.

## 2. Los cuatro tags especiales

| Orden | Tag | Ícono | Formas que se leen como él |
|---|---|---|---|
| 1 | `favorito` | estrella | `favorita`, `favoritos`, `favoritas` |
| 2 | `menú diario` | calendario | `menu diario` |
| 3 | `probar` | marcador | — |
| 4 | `incompleta` | el círculo a medio llenar | `incompleto`, `incompletos`, `incompletas` |

- **El orden es el mismo en todos lados:** carrusel, esquina de la tarjeta, fila de tags de
  la receta y editor. Primero lo que se busca para cocinar; al final, lo que falta terminar.
- **Se escriben siempre en la forma canónica**, en minúscula. `incompleta` en femenino: es
  una receta incompleta.
- **Siguen reservados** `terminado`, `terminada`, `terminados` y `terminadas`: un tag así
  contradiría a `incompleta`.

Esta tabla **reemplaza** el orden de la primera parte (`favorito`, `probar`, `menú diario`).

## 3. La clave `completa` desaparece

- **El frontmatter queda con siete claves.** La app no lee `completa`: una receta sin el
  tag `incompleta` está terminada.
- **No hay transición:** una receta con `completa: no` y sin el tag se ve terminada.
- **Al guardar, si el `.md` todavía tiene la clave `completa`, se borra.** Conservarla como
  clave desconocida dejaría un dato paralelo al tag: el archivo podría decir `completa: sí`
  y tener `incompleta` a la vez.
- **Es una excepción con nombre, no una regla nueva.** Guardar sigue conservando todas las
  demás claves que la app no conoce (`extras`) y las secciones que no reconoce (`otras`),
  como hasta ahora.
- **El índice pierde la columna `completa`.** Si una receta está incompleta se sabe por su
  columna `tags`, como si es favorita. `SCHEMA_VERSION` pasa de 3 a 4: la próxima apertura
  reindexa sola.

**Lo existente no se migra.** Antes de publicar se lista qué `.md` del Drive tienen la clave
`completa`, y el usuario los edita a mano.

## 4. Una receta nace incompleta

- **Una receta nueva** abre el editor con `incompleta` puesto.
- **Un borrador convertido**, también.
- **Sacarlo es la acción explícita** que la declara terminada.
- **El agente** todavía escribe `completa`: queda anotado en P14, que es rehacer el skill.

## 5. El editor

### 5.1 Los botones

Dentro del campo **«Tags»**, una fila con los cuatro botones, arriba de los tags comunes y
del campo para agregar.

- **Apretado:** la receta tiene el tag. **Suelto:** no lo tiene. Tocarlo lo pone o lo saca.
- Apretado se dibuja invertido —fondo claro, texto oscuro—, la convención del estado
  elegido que ya usaba el conmutador de completitud.
- Cada botón lleva su ícono y su nombre, y `aria-pressed`.

### 5.2 La regla de `incompleta`

- **No se puede soltar** hasta que la receta tenga título, categoría, ingredientes y pasos
  (`sePuedeTerminar`, que no cambia).
- Mientras no se pueda, queda **apretado y deshabilitado**, con la leyenda:
  «Se va a poder sacar *incompleta* cuando se cargue: título, categoría, ingredientes y
  pasos.»
- La condición se revisa **mientras se escribe**, sin redibujar el formulario.
- **Si la receta deja de cumplirla** mientras se edita —se borran los pasos, se vacía el
  título—, el botón **vuelve a apretarse solo**.

### 5.3 Lo que sale y lo que no cambia

- **Sale** el conmutador «Incompleta | Terminada» y la fila «Estado» de la ficha de datos.
- **Los cuatro no se pueden escribir a mano:** tienen su botón. El campo de agregar los sigue
  rechazando con el aviso de siempre, y no los sugiere.
- **Las pills son sólo de los tags comunes:** un especial no se dibuja dos veces.

## 6. La tarjeta

- Las marcas de los especiales que tenga la receta van **juntas arriba a la derecha**, en el
  orden de la tabla del §2.
- **La línea de contexto queda sólo con datos:** categoría, tiempo, rinde.
- La reserva de espacio para el título se ajusta a cuántas marcas haya.

## 7. La receta

- Los especiales van **primeros en la fila de tags**, en el orden del §2 y con su ícono.
- **Tocar `incompleta` abre el editor**, como hoy la marca de incompleta. Los demás chips se
  comportan como hasta ahora.
- La estrella del encabezado no cambia: es el atajo para `favorito`.

## 8. Dónde no cambia nada

- **La vista de invitado**, el modo cocina y Borradores, por lo mismo que en la primera
  parte.
- **El PDF y el texto compartido** no muestran tags.

## 9. Tests

- Los cuatro especiales, en su orden, con sus formas alternativas.
- `parse` no lee `completa`; `serialize` no la escribe y la borra si venía.
- La fila del índice no tiene la columna `completa`, y `SCHEMA_VERSION` es 4.
- Una receta nueva y un borrador convertido abren con `incompleta`.
- El editor dibuja los cuatro botones con su estado; tocarlos pone y saca el tag.
- `incompleta` no se puede soltar sin lo mínimo, y vuelve a apretarse si se pierde.
- Las pills no incluyen especiales, y el campo de agregar los sigue rechazando.
- La tarjeta dibuja las marcas juntas, en orden, y la línea de contexto no lleva ninguna.
- En la receta, el chip de `incompleta` abre el editor.

## 10. Verificación en el teléfono

1. Crear una receta: abre con `incompleta` apretado y deshabilitado.
2. Cargar lo mínimo: el botón se habilita; soltarlo y guardar la deja terminada.
3. Borrar los pasos con `incompleta` suelto: vuelve a apretarse.
4. Poner `menú diario` y `probar` desde sus botones: aparecen en la esquina de la tarjeta y
   primeros en la receta.
5. Tocar el chip `incompleta` en una receta: abre el editor.

## 11. Documentos que cambian

- **`decision-log.md`:** una fila que reabre la del 2026-09-12.
- **`E05-Cimientos.md`:** C05.3.1 a C05.3.3.
- **`E04-Corregir.md`:** C04.4.1, el control del editor.
- **`design-system.md`:** el conmutador de completitud sale; el ícono de `incompleta`.
- **`CLAUDE.md`:** el esquema pasa de ocho claves a siete, y la fila de campos del
  frontmatter en las decisiones cerradas.
- **`BACKLOG.md`:** P14 suma que el skill escribe `completa` y no el tag; P27 suma esta
  segunda parte.
- **El spec de la primera parte:** el orden de los especiales y el §2 sobre quién escribe
  cada uno.

## 12. Fuera de alcance

- Migrar los `.md` existentes.
- Leer `completa: no` como si fuera el tag.
- Actualizar el skill del agente: es P14.
