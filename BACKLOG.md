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
| P79 | Probar el gesto del menú en Borradores | Eran dos cosas. La que lo explicaba: los oyentes del gesto estaban en `#app`, y una pantalla que no llega abajo —Borradores con pocos— deja debajo de los botones un área que ya no es de `#app`, donde el toque no llegaba a ningún lado; ahora van en `document`. Y de paso se recortó el título del borrador a dos renglones (`.bor .n`), que sin recortar estiraba la página a lo ancho. En el teléfono: abrir el menú deslizando en Borradores **desde abajo de los botones**, con la lista vacía y con pocos borradores; que un título largo se vea cortado en dos renglones; y que el gesto siga andando en Inicio, Plan y Ajustes. | Falta probar |
