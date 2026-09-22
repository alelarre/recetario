# Backlog

Sólo pendientes. El **estado** dice en qué anda cada uno:

- `Abierto` — nadie lo está tocando.
- `Implementando` — hay una sesión trabajándolo: no lo tomes.
- `Falta probar` — hecho, esperando la prueba en el teléfono.

Una entrada se borra de la tabla recién cuando está terminada y lista para
probar; una que quedó a medias vuelve a `Abierto`.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P14 | Rehacer el skill del agente (`skills/recetario/`) | Quedó en un esquema viejo: escribe la clave `completa` en vez del tag `incompleta`, tiene su propia lista de tags reservados —le falta `menú diario`—, no conoce los cinco valores de `tiempo` y tampoco el depósito de fotos: la sección `## Fotos`, las referencias `![](foto:N)` y `foto: foto:N` como cabecera. El skill nuevo no repite reglas que ya están en `src/`. Tampoco escribe la fila del índice: después de cargar recetas directo a Drive hay que tocar *Ajustes → Reindexar*. Para una receta suelta alcanza con que el skill devuelva el `.md` y la app lo reciba compartido o pegado: la app lo guarda con su fila. Lo que sigue sin resolver es la carga en masa, porque el conector de Google Drive de claude.ai no escribe planillas ni reescribe archivos. | Abierto |
| P61 | Simplificar el flujo de creación de recetas | Nuevo y borrador se solapan en funcionalidad. Revisar el flujo entero y simplificarlo. | Abierto |
| P70 | Limpiar comentarios que referencian el backlog | Hay comentarios en el código que citan entradas del backlog o decisiones puntuales. Limitarlos a lo mínimo que explique qué hace el código. | Abierto |
| P71 | Limpieza general de documentos del proyecto | Revisar y poner en orden los documentos del proyecto. | Abierto |
| P72 | Borrar los artefactos de claude.ai | Sacar los Artifacts publicados en claude.ai que quedaron del desarrollo. | Abierto |
| P73 | Actualizar la documentación de producto | Poner `product-design/` al día con el estado actual del producto. | Abierto |
| P74 | Revisar cómo están construidos los tests | Repasar la estructura y los patrones de los tests actuales. | Abierto |
| P78 | *Nueva receta* no tiene menú lateral | El menú ofrece *Nueva receta* (`lateral()` en `ui/componentes.ts`), pero `nueva` no está en `PANTALLAS_CON_MENU` (`src/main.ts:2784`) y el editor dibuja el volver en vez de la hamburguesa: se llega desde el menú y ahí el menú desaparece. El nudo es que la pantalla es un editor con cambios sin guardar —irse por el menú tendría que preguntar, como hoy pregunta el volver—, así que la decisión es entre sumarla a la lista con esa guarda, o que el menú deje de ofrecerla. Se cruza con P61. | Abierto |
| P79 | El gesto del menú no lo despliega en Borradores | `borradores` está en `PANTALLAS_CON_MENU` y la pantalla dibuja el lateral, así que el deslizamiento debería abrirlo, pero en Android no pasa nada. Mirar `puedeEmpezar`/`direccion` (`ui/gesto-menu.ts`) y el `pointerdown` de `main.ts:2826`: el gesto arranca a 24 px del borde para no pelearse con el «atrás» de Android. Sólo se ve en el teléfono. | Abierto |
| P80 | Agregar una receta al plan demora | Son hasta tres viajes a Drive en el toque: si `_plan.md` todavía no se leyó, `store.guardarPlan` (`store.ts:1351`) lo busca por nombre y lo lee, y recién ahí reescribe el archivo entero —el plan no está en el índice y cada cambio lo reescribe—. La pantalla ya se tapa desde el toque (`main.ts:2085`), así que lo que falta es que no espere: leer el plan al entrar a la pantalla de agregar, para que el toque sea una sola escritura. | Abierto |
| P81 | La lista de compras demora y no avisa | `comprasDelPlan` (`src/main.ts:476`) lee de Drive una receta por cada receta distinta del plan, **de a una y en serie** —hasta catorce—, y hasta que termina la pantalla se queda en la anterior, sin velo ni indicador. Dos cosas: leerlas solapadas como hace el reindexado (`conConcurrencia` con `TOPE_LECTURAS`, `store.ts`) y tapar la pantalla mientras tanto. El resultado ya queda cacheado por plan (`comprasLeidas`), así que duele sólo la primera vez. | Abierto |
