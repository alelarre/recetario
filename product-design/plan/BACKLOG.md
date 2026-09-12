# Backlog

**Versión:** 1.1
**Fecha:** 2026-09-12
**Estado:** Final — Hito 11, con los pendientes de uso real del §6

---

## Sobre este documento

Lo que quedó **explícitamente afuera** del diseño, con descripción suficiente para
retomarlo sin releer el proyecto entero. Nada de esto es un olvido: cada línea se
decidió dejar afuera y dice por qué.

Lo que quedó afuera del **producto** —y no del scope— está en la tabla de
`plan/decision-log.md`, que es otra cosa: ahí van las alternativas descartadas.

**El §6 es distinto de los cinco anteriores:** no salió del proyecto de diseño
sino de usar la app terminada. Son cosas para hacer, no cosas descartadas.

---

## 1. Decisiones abiertas

| Qué | Estado | Por qué no se resolvió |
|---|---|---|
| **Que el agente se embeba en la PWA** | Abierta desde el Hito 2. Es la decisión más grande sin resolver del proyecto. | El posicionamiento cierra sin ella: el agente está afuera de la app, no afuera del producto. Si algún día se embebe, el lugar exacto donde aparecería el botón ya está identificado —la pantalla de Borrador— y no cambia nada más. |
| **Una vía de hosting para las fotos de receta** | Abierta desde el Hito 5. | El campo `foto` existe y acepta una URL externa. Una vía propia sin backend obliga a pedir la imagen con el token y armar un object URL. No bloquea nada: el diseño no depende de la foto, y hoy ninguna de las ~60 recetas del Drive tiene una. |

## 2. Funcionalidad que no entró

| Qué | Por qué quedó afuera | Si alguna vez entra |
|---|---|---|
| **El planificador y la lista de compras (E06)** | J9 es el único job hipotético del proyecto, y el único que **cambiaría** la conducta en vez de acompañarla. El mercado tampoco ayuda: los cuatro competidores lo tienen. | Está diseñada y mockupeada. Su entrada vive en el Recetario, debajo de las categorías, y sacarla cuesta borrar un bloque y dos pantallas. |
| **Sugerencias para J5** — *"hace mucho que no hacés esto"* | La novedad se resuelve mostrando, no registrando. Y registrar obliga a guardar historial de uso, que el esquema no tiene. | Va **entre** la búsqueda y las categorías, nunca arriba. |
| **Un control de filtro visible sobre las listas** | Quedó a decidir "al ver la pantalla llena". Se vio en el Hito 9 y no hizo falta: los tags se aplican desde la receta. | — |
| **Ordenar dentro de una categoría** | Mismo caso. Con veinte recetas el alfabético alcanza; con cientos habría que volver a mirarlo. | — |
| **Que la app sugiera tags** | `[abierto]` de `ux/information-architecture.md` §4.5. Con sesenta recetas el desorden de tags no molesta. | Recién si con mil recetas molesta. |
| **Historial de cocina, escalado de porciones, timers** | Ningún job los pide. | — |
| **Modo offline** | Decisión, no carencia: sin Drive no hay app, y una copia local es una segunda fuente de verdad. | — |
| **iOS** | Salió del alcance en el Hito 7. No tiene Share Target, y un equivalente declarado sin diseñar es una deuda que nadie implementa. | Sería un Atajo, con la misma pantalla de captura. |

## 3. Deuda técnica heredada

| Qué | Por qué importa |
|---|---|
| **Reindexar lee los `.md` de a uno**, sin paralelismo ni loteo | Con las sesenta recetas actuales no se nota. Con las mil del target, el reindexado tarda minutos — y por eso tiene barra de progreso y no se puede cancelar. Loteando o paralelizando, el problema se achica. |
| **La app no detecta sola un índice corrupto de todas las formas posibles** | Detecta que no puede leerlo y ofrece reindexar, que es la salida universal. Lo que no hace es diagnosticar el tipo de daño, y es deliberado. |

## 4. Lo que quedó sin evidencia

El **Hito 10 —Usability Testing— se salteó**, así que estas tres cosas están
decididas por razonamiento y no por observación. Son las primeras candidatas a
revisar cuando la app se use de verdad.

| Qué | Cómo se sabría |
|---|---|
| **La escala del modo cocina a 50 cm reales** | Cocinando una receta que no te sepas de memoria, con el teléfono apoyado. Si el cuerpo de 22 px no alcanza, sube; el sistema ya tiene el lugar donde cambiarlo. |
| **La densidad de la lista con cientos de recetas** | La categoría más grande del Drive hoy tiene veinte. A cientos puede hacer falta ordenar, o el filtro visible que quedó en §2. |
| **Si el vocabulario se entiende sin haberlo escrito uno mismo** | *Borrador*, *reindexar*, *está completa así como está*. Se prueba en diez minutos con cualquiera, sentado y sin cocinar nada. |

## 5. Documentos que quedaron viejos

| Documento | Qué le pasa |
|---|---|
| `product/strategy/personas.md` y `jtbd.md` | Del Hito 2. Mencionan "bandeja" y el Atajo de iOS, que el vocabulario y el alcance cambiaron después. **Se dejaron como estaban a propósito:** describen conducta observada, no decisiones vigentes. |
| `../docs/superpowers/plans/2026-09-01-recetario-v1.md` | Ya estaba viejo antes de este proyecto: describe la funcionalidad de fotos que después se eliminó. |

---

## 6. Pendientes de uso real

`[abierto el 2026-09-12]` Salieron de usar la app publicada contra el Drive real.
A diferencia de los §1 a §5, **esto es trabajo pendiente**, no alcance
descartado. El identificador de cada uno es estable: sirve para nombrarlo sin
repetir el enunciado.

### 6.1 Comportamiento

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P1** | **El borrador se borra recién cuando la receta ya existe en Drive** | **Resuelto** `[2026-09-12]`. El código ya lo hacía: *Crear la receta* sólo abre el editor con `?borrador=<id>`, y el único que borra es `convertirBorrador`, invocado desde *Guardar* después de escribir el `.md` y su fila. Volver, cancelar o el gesto de atrás no borran nada. Quedó fijado en `tests/main-rutas.test.ts`. De paso se arregló que reintentar Guardar después de un fallo al borrar el borrador creaba un segundo `.md`: `main.ts` rearmaba las dependencias en cada intento y perdía `convertidos`. Queda sabido un caso más raro: si falla la fila después de crear el `.md`, el reintento también lo duplica, y el duplicado se ve en Drive. |
| **P7** | **Editar receta: avisar de cambios sin guardar** | **Resuelto** `[2026-09-12]`. Al dibujar el editor —editar o nueva— se guarda una foto del formulario, incluidos los campos ocultos de tags y completitud; salir con el formulario distinto pregunta *«¿Salir sin guardar los cambios?»* arriba del formulario, sin redibujarlo. No se compara contra el `.md` de Drive. El volver del encabezado y el gesto de atrás pasan por el mismo chequeo en `render()`: como el `hashchange` no se cancela, se vuelve a poner la URL del editor con `pushState` y no se dibuja la pantalla nueva. Cerrar la pestaña o recargar no pregunta: `beforeunload` sólo da el cartel del navegador, y Android lo ignora seguido. |
| **P8** | **Modo cocina: el paso 1 arranca seleccionado** | **Resuelto** `[2026-09-12]`. El paso actual arranca en el primero, al entrar y al volver a entrar. Tocar el paso 1 de entrada lo da por hecho, como a cualquier paso realzado. C03.2.4 quedó escrito así. |
| **P9** | **Modo cocina: que el texto del paso no se pueda seleccionar** | **Resuelto** `[2026-09-12]`. `user-select: none` en `.coc .pasos li` (`src/ui/base.css`). Sólo los pasos del modo cocina: sus ingredientes, la receta abierta y el editor siguen seleccionables. Falta verlo en el teléfono. |
| **P14** | **La v2 del skill del agente escribe la fila del índice** | `[2026-09-12]` Hoy `skills/recetario/SKILL.md` sube el `.md` y termina, y como la app no descubre lo que se escribe afuera (R4), **una receta cargada por el agente no aparece hasta reindexar**. El skill ya lo dice y le pide al agente que avise. C05.4.3 pide otra cosa: que el agente escriba con **la misma función** que la app —`src/compartido.ts`—, no con una copia de la regla. La pregunta abierta es cómo: el agente corre en sesiones de Claude con acceso a Drive y Sheets, y `compartido.ts` es TypeScript que hoy sólo corre en el navegador. Entra también **convertir un borrador en receta** desde el agente, que es la otra operación que C05.4.3 le asigna. |
| **P12** | **Revisar cómo se sabe si el índice está al día** | Estado de partida: **no hay copia local** (C05.4.2) —ni IndexedDB ni nada del navegador—, el índice se lee entero de Sheets en cada arranque, y la Changes API se eliminó en el rediseño, así que la app **no descubre lo que se escribe afuera** (R4). Lo que hay es `SCHEMA_VERSION` en la meta, que fuerza reindexar cuando cambia. Primero entender qué está pasando de verdad y recién después decidir si algo cambia. |

### 6.2 Diseño visual

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P2** | **El acento parece un error** | `--acento` (`#E0663C`) es el fondo de los botones primarios —*Cocinar*, *Guardar*— y se lee como rojo de error, no como la acción principal. Proponer opciones, elegir una, y recién ahí actualizar `ux/design-system.md` §2.2 y todo lo que lo cite. Ojo con el alcance: el acento también pinta el ítem activo del menú lateral, el chip de incompleta (§6.5), el paso actual de cocina y el motivo de un resultado de búsqueda. |
| **P3** | **El chevron de los desplegables queda pegado al margen derecho** | En los `select` de categoría y tags del editor. Es padding del control, no del sistema. |
| **P4** | **«Borrar receta» lleva emoji de tacho** | El único botón de peligro de la app. |
| **P5** | **El editor: la completitud adentro de la ficha, el borrar afuera** | El conmutador de completitud tiene hoy ficha propia y debería estar en la ficha principal del formulario. Y *Borrar receta* no debería estar dentro de una `.ficha`: es una acción destructiva al pie, no un campo más. |
| **P6** | **El editor: encabezado fijo** | Como en la receta abierta (C03.1.2b), que ya queda pegado arriba. |
| **P10** | **Modo cocina: «Mantener pantalla encendida» pasa a ícono** | Sale de ser un botón con texto y queda como ícono solo, a la izquierda de *Salir*. |
| **P13** | **Modo cocina: un ícono o emoji para «Ingredientes» y «Pasos»** | Buscar opciones para las dos posiciones del conmutador. Tener en cuenta §3.4: la iconografía del sistema es de trazo, y un emoji es la excepción —la app ya usa el 📖 de la fuente—. |

### 6.3 Investigación primero

| # | Qué | Qué hay que hacer |
|---|---|---|
| **P11** | **La jerarquía tipográfica, pantalla por pantalla y entre pantallas** | **Un informe antes de tocar nada.** Primero un research de fuentes externas para fijar los criterios —el usuario propuso [uxplanet: *What is typographic hierarchy*](https://uxplanet.org/what-is-typographic-hierarchy-definition-examples-26f6225f6bad) como punto de partida—, después la auditoría de las once pantallas contra la escala de `design-system.md` §3.2 y §3.3, y recién después la propuesta de cambios. |

### 6.4 Estado del contenido y del entorno

Esto no se arregla escribiendo código.

| Qué | Situación |
|---|---|
| **El índice tiene cada receta dos veces** | 122 filas para 61 recetas, visto el 2026-09-12. La causa probable son dos reconstrucciones solapadas —dos pestañas de la app abiertas, o *Reindexar* tocado mientras el arranque ya estaba reconstruyendo—: `reconstruir()` lee las filas previas, las borra y appendea las nuevas, sin nada que impida que dos pasadas se pisen. **Se decidió no agregar lógica de concurrencia** (2026-09-12): la salida es reindexar una vez, con una sola pestaña abierta. |
| **Las 61 recetas del Drive se leen como incompletas** | Ninguna trae la clave `completa` todavía, y sin ella la receta se lee como no terminada (C05.3.1). El usuario edita esos `.md` a mano. |
| **Cuatro cosas que ningún test alcanza** | El Share Target real —necesita la PWA instalada en Android—, el foco del teclado en la captura, la posición del scroll al conmutar en modo cocina, y el gesto de atrás de Android en el editor con cambios (P7): los tests cubren la lógica con un historial falso, no el gesto. |
| **Las acciones del workflow de Pages usan Node 20** | GitHub ya lo marca como deprecado. Es mantenimiento del CI, no del producto. |

### 6.5 Deuda chica del código

| Qué | Situación |
|---|---|
| **`src/ui/tokens.css` ya no es copia literal de los mockups** | Es la convención declarada en su encabezado, pero los cambios posteriores al Hito 11 —el chip más claro, la marca a medio llenar, el chip «pendiente»— viven como overrides en `base.css`. Se lee bien, pero para saber cómo se dibuja algo hay que mirar los dos archivos. |
| **`.inc-txt` quedó sin uso** | Era el texto suelto de «Falta terminarla» en la receta abierta. Sigue definido en `tokens.css` porque ese archivo no se toca. |
