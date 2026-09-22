# Backlog

Sólo pendientes. El **estado** dice en qué anda cada uno:

- `Abierto` — nadie lo está tocando.
- `Implementando` — hay una sesión trabajándolo: no lo tomes.
- `Falta probar` — hecho, esperando la prueba en el teléfono.
- `En espera` — decidido que no se toca hasta que se resuelva otra entrada.

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
| P78 | *Nueva receta* no tiene menú lateral | El menú ofrece *Nueva receta*, pero `nueva` no está en `PANTALLAS_CON_MENU` (`src/main.ts:2784`): ni el gesto la abre ni el encabezado lleva la hamburguesa. Los cambios sin guardar no son el problema —la pregunta al salir vive en el `hashchange` (`main.ts:917`), así que un link del menú ya dispararía la misma confirmación que el volver—; el nudo es la esquina izquierda del encabezado, donde hoy está el volver, que es cómo se sale del editor. **En espera de P61:** si el flujo de creación se simplifica, puede que *Nueva receta* deje de ser una entrada del menú y la pregunta desaparezca sola. | En espera |
| P79 | El gesto del menú no lo despliega en Borradores | Falla **sólo ahí**: en Inicio, Plan y Ajustes el deslizamiento abre el menú. Y el cableado (`main.ts:2817`) no distingue entre pantallas —mira `PANTALLAS_CON_MENU`, donde `borradores` está—, el lateral que dibuja es idéntico al de las otras tres y su CSS no tiene nada propio. Queda una hipótesis: **la lista es una pila de `<a class="bor">` que ocupa todo el ancho**, así que el dedo siempre arranca sobre un enlace, y Android puede tomar el arrastre horizontal sobre un `<a>` como arrastre del link y mandar `touchcancel`, que `soltarDeslizamiento` trata como soltar sin abrir. En las otras tres el dedo empieza sobre fondo o sobre fichas. Se prueba con `draggable="false"` y `-webkit-user-drag: none` en `.bor`, o mirando por `chrome://inspect` si llega el `touchstart` y si lo sigue un `touchcancel`. **Primero conviene el test que falta:** ningún test ejercita el gesto de punta a punta —los de `gesto-menu.ts` son unitarios y el de P55 prueba el botón—, así que esto pudo romperse sin que nada avisara. | Abierto |
