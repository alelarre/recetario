# El MCP del Recetario

Un servidor MCP local: Claude Code o Claude Desktop lo lanzan por stdio en la
Mac y escribe las recetas en el Drive con el mismo código que la app.

**La app y el MCP no se usan a la vez.** Mientras el MCP escribe, la app tiene
que estar cerrada: los dos numeran las filas del índice por posición y pueden
pisarse. Si pasó, la salida es *Ajustes → Reindexar*.

## Conectarlo con Google (una sola vez)

El MCP usa su propio cliente OAuth, tipo *Aplicación de escritorio*, en el mismo
proyecto de Google Cloud que la app.

1. **Crear el cliente.** En [Google Cloud Console](https://console.cloud.google.com/),
   con el proyecto de la app elegido: *APIs y servicios → Credenciales → Crear
   credenciales → ID de cliente de OAuth*. Tipo de aplicación: *App de
   escritorio*. Nombre: `Recetario MCP`.
2. **Bajar el JSON** del cliente recién creado (el botón de descarga en la fila
   del cliente). Tiene la forma `{ "installed": { "client_id": …, "client_secret": … } }`.
3. **Guardarlo fuera del repo**, con este nombre exacto:

   ```sh
   mkdir -p ~/.config/recetario
   mv ~/Downloads/client_secret_*.json ~/.config/recetario/cliente.json
   chmod 600 ~/.config/recetario/cliente.json
   ```

4. **Dar permiso:**

   ```sh
   npm run mcp:conectar
   ```

   Se abre el navegador. Elegir la cuenta del Drive del recetario y aceptar el
   acceso completo a Drive (Google avisa que la app no está verificada: es la
   misma advertencia que con la app). Al terminar, la terminal dice con qué
   cuenta quedó conectado.

El refresh token queda en el Llavero de macOS, en el ítem `recetario-mcp`, y
nunca en un archivo. Para reconectar —otra cuenta, o un permiso vencido— se
corre `npm run mcp:conectar` de nuevo: reemplaza el token del Llavero.

### Si algo falla

Los errores de login salen con un código entre corchetes:

| Código | Qué hacer |
|---|---|
| `sin-cliente` | Falta `~/.config/recetario/cliente.json` o no es el JSON de un cliente de escritorio: repetir los pasos 1 a 3. |
| `sin-permiso` | Correr `npm run mcp:conectar`. |
| `permiso-revocado` | Correr `npm run mcp:conectar` otra vez. Si pasa cada semana es porque el proyecto está en modo *Prueba*, donde el permiso dura 7 días. |
| `usuario-no-habilitado` | Agregar la cuenta en *Pantalla de consentimiento de OAuth → Usuarios de prueba*. |
| `cliente-interno` | Pasar el tipo de usuario del proyecto a *Externo*, en la pantalla de consentimiento. |
| `api-deshabilitada` | Habilitar Google Drive API y Google Sheets API en *APIs y servicios → Biblioteca*. |
| `scope-insuficiente` | Correr `npm run mcp:conectar` y aceptar el acceso completo a Drive. |
| `sin-carpeta` | Conectarse con la cuenta del Drive del recetario, o abrir la app una vez para crear o elegir la carpeta. |
| `sin-red` | Revisar la conexión y reintentar. No hace falta reconectar. |

Para sacarle el permiso al MCP: borrar el ítem `recetario-mcp` en *Acceso a
Llaveros*, y quitar el acceso en <https://myaccount.google.com/permissions>.
