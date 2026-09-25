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
| P14 | Rehacer el skill del agente (`skills/recetario/`) | Quedó en un esquema viejo: escribe la clave `completa` en vez del tag `borrador`, tiene su propia lista de tags reservados —le falta `menú diario`—, no conoce los cinco valores de `tiempo` y tampoco el depósito de fotos: la sección `## Fotos`, las referencias `![](foto:N)` y `foto: foto:N` como cabecera. El skill nuevo no repite reglas que ya están en `src/`. Tampoco escribe la fila del índice: después de cargar recetas directo a Drive hay que tocar *Ajustes → Reindexar*. Para una receta suelta alcanza con que el skill devuelva el `.md` y la app lo reciba compartido o pegado: la app lo guarda con su fila. Lo que sigue sin resolver es la carga en masa, porque el conector de Google Drive de claude.ai no escribe planillas ni reescribe archivos. Tiene que usar el tag `borrador` y, cuando el pedido trae un `id: <id>`, devolverlo como última línea del frontmatter: con él, la receta compartida abre el editor de la receta que la pidió. | Abierto |
| P86 | Probar en el teléfono la arquitectura frontend | Lo que ningún test cubre de la navegación, el velo y los componentes nuevos: el atrás de Android cerrando el menú, el visor, las fichas —compartir y las de fotos del editor— y la categoría elegida en *Agregar al plan*, sin salir de la pantalla; las salidas: borrar una receta (vuelve a la lista de donde se venía, también desde Borradores), *Salir* de la cocina (vuelve a donde se eligió la receta), guardar una receta nueva (queda en la receta creada) y elegir en *Agregar al plan* (vuelve al plan con una sola entrada); el velo con la olla y el tilde en cada escritura —receta, categoría, plan, carpeta— y ningún botón que diga «Guardando…»; el reindexado de *Ajustes* bloqueando la pantalla, con su tarjeta y su barra; el menú fijo desde 900 px en la receta y el editor; el aviso de foto ausente en la muestra de la categoría; los espacios entre filas y grupos en las listas y en *Agregar al plan*, la primera ficha de una receta sin fuente y el carrusel de duraciones. | Falta probar |
| P73 | Actualizar la documentación de producto | Poner `product-design/` al día con el estado actual del producto. | Implementando |
