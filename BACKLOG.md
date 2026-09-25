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
| P83 | Probar en el teléfono la creación de recetas | Lo que ningún test cubre del flujo nuevo de creación: compartir un link desde Instagram (abre el editor nuevo con la fuente); compartir la receta que vuelve del agente, con `id:` (abre el editor de esa receta) y sin él (abre uno nuevo lleno); *Pegar* en el editor; *Convertir con Agente* con fotos, y que claude.ai se abra desde la PWA instalada (si no se abre, la receta muestra «Mandar al agente»); la lista de *Borradores* y su contador; elegir categoría y sacar el tag `borrador`; la hamburguesa y el gesto del menú en *Nueva receta*, y que arrastrar sobre un campo no abra el menú sin querer; los encabezados fijos en todas las pantallas, sobre todo en el modo cocina. | Falta probar |
| P84 | Detalles que quedaron de la creación de recetas | (1) Con los encabezados fijos, un aviso de error puede quedar tapado por el encabezado, sobre todo en el editor al guardar desde el pie: falta `scroll-padding-top`. (2) Si todas las recetas son borradores, el home dice «Todavía no hay recetas». (3) La búsqueda por texto muestra «tiene tag borrador» en el grupo *Por tag*. (4) Tocar en el menú el destino en el que ya se está deja el menú abierto. | Implementando |
| P85 | Arquitectura frontend: navegación, velo y componentes | Arreglar todo lo del diagnóstico: un módulo de navegación con una sola regla de historial; el velo igual en todas las escrituras (salvo el favorito) y el reindexado con su barra sobre un velo bloqueante; los borradores sólo en su sección del menú; la lista de recetas, el gestor de fotos, el visor y los carruseles como componentes con su propio controlador. Incluye P84. | Implementando |
| P73 | Actualizar la documentación de producto | Poner `product-design/` al día con el estado actual del producto. | Abierto |
