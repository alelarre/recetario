# Backlog

Sólo pendientes abiertos. Lo que se resuelve se borra de la tabla.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P14 | Rehacer el skill del agente (`skills/recetario/`) | Quedó en un esquema viejo: escribe la clave `completa` en vez del tag `incompleta`, tiene su propia lista de tags reservados —le falta `menú diario`— y no conoce los cinco valores de `tiempo`. El skill nuevo no repite reglas que ya están en `src/`. Tampoco escribe la fila del índice: después de cargar recetas directo a Drive hay que tocar *Ajustes → Reindexar*. Para una receta suelta alcanza con que el skill devuelva el `.md` y la app lo reciba compartido o pegado: la app lo guarda con su fila. Lo que sigue sin resolver es la carga en masa, porque el conector de Google Drive de claude.ai no escribe planillas ni reescribe archivos. | Abierto |
| P19-3b | Imágenes propias de categorías | La foto de una categoría puede ser un archivo del usuario en Drive, además del catálogo de `src/categorias/`. La carpeta guarda el id del archivo en sus `appProperties`. La imagen se pide con el token una sola vez y se guarda en Cache Storage por id de archivo; reindexar vacía ese cache y *Borrar datos locales* también lo borra. | Abierto |
| P36 | Probar el velo durante las escrituras | Checklist en `docs/superpowers/specs/2026-09-17-bloqueo-escrituras-design.md` §7: guardar una receta, descartar un borrador, borrar una categoría, sin red, y favorito sin velo. Al terminar se borra el spec. | Falta probar |
| P26 | Probar la carpeta sin explorador | Checklist en `docs/superpowers/specs/2026-09-18-carpeta-sin-explorador-design.md` §9: crear «Recetario», cambiar de carpeta con el Picker y cancelarlo. Al terminar se borran el spec y su plan. | Falta probar |
| P32 | Probar el plan de la semana | Checklist en `docs/superpowers/specs/2026-09-17-planificador-design.md` §10: agregar, sacar, reiniciar, la lista de compras por WhatsApp, y que arranque en el día de hoy. Al terminar se borran el spec y su plan. | Falta probar |
| P37 | Probar que «Salir» cierra la sesión | Salir revoca el token y recarga: después no tiene que verse nada del Recetario ni reconectarse solo. | Falta probar |
| P38 | Probar la captura nueva | Reinstalar la PWA —el manifest cambió— y compartir un reel de Instagram (fuente el link, el texto en la nota), una página desde Chrome (fuente la URL, sin el título), un texto sin link desde WhatsApp (sin fuente, todo en la nota), y guardar sin título («Borrador dd/mm hh:mm»). | Falta probar |
| P40 | Probar las fotos en los borradores | Checklist en `docs/superpowers/specs/2026-09-19-fotos-en-borradores-design.md` §13. Hay que reinstalar la PWA. Al terminar se borran el spec y su plan. | Falta probar |
