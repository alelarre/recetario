# Backlog

Sólo pendientes abiertos. Lo que se resuelve se borra de la tabla.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P14 | Rehacer el skill del agente (`skills/recetario/`) | Quedó en un esquema viejo: escribe la clave `completa` en vez del tag `incompleta`, tiene su propia lista de tags reservados —le falta `menú diario`— y no conoce los cinco valores de `tiempo`. El skill nuevo no repite reglas que ya están en `src/`. Tampoco escribe la fila del índice: después de cargar recetas directo a Drive hay que tocar *Ajustes → Reindexar*. El conector de Google Drive de claude.ai no escribe planillas ni reescribe archivos, así que no puede correr `src/compartido.ts`; para una receta suelta alcanza con que el skill devuelva el `.md` y la app lo reciba compartido o pegado. Sigue sin resolver la carga en masa. | Abierto |
| P19-3b | Imágenes propias de categorías | La foto de una categoría puede ser un archivo del usuario en Drive, además del catálogo de `src/categorias/`. La carpeta guarda el id del archivo en sus `appProperties`. La imagen se pide con el token una sola vez y se guarda en Cache Storage por id de archivo; reindexar vacía ese cache y *Borrar datos locales* también lo borra. | Abierto |
