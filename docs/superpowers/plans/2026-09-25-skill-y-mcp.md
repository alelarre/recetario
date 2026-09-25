# Plan — El agente del Recetario: un servidor MCP local y un skill

> **Para agentes:** usar superpowers:subagent-driven-development, una tarea por vez. Los pasos van con `- [ ]`.

**Objetivo:** un servidor MCP local en `mcp/` que escribe recetas con el mismo código que la app, y un skill corto que lo usa (P14).

**Arquitectura:**
- `mcp/` es un proceso Node que corre por stdio con `tsx` e importa los módulos de `src/`.
- `src/` sólo recibe dos cambios: lo que haga falta para exponer lógica pura, como las reglas del formato o la validación, y nunca importa de `mcp/`.
- El login es OAuth de escritorio con loopback, y el refresh token se guarda en el Llavero con el comando `security`.

**Dependencias nuevas:**
- `@modelcontextprotocol/sdk` para el servidor MCP.
- `@napi-rs/canvas` para achicar las fotos.
- `tsx` (dev) para correr TypeScript en Node.
- `zod`, si el SDK lo pide para los esquemas de las herramientas.

**Spec:** `docs/superpowers/specs/2026-09-25-skill-y-mcp-design.md`. Es la autoridad: leelo entero antes de cada tarea.

## Reglas para todas las tareas

- **Test primero.** Al cerrar cada tarea tienen que quedar en verde `npm test`, `npm run typecheck` y `npm run build`.
- **Commits:** van en la rama del worktree. A `main` no se integra nada sin el visto bueno del usuario.
- **Idioma:** español rioplatense en todo: mensajes, comentarios y nombres. Las herramientas del MCP se llaman `formato`, `categorias`, `tags`, `buscar`, `leer`, `validar`, `crear`, `guardar`, `borrar` y `reindexar`.
- **Comentarios:** dicen la razón vigente. No citan el backlog ni `docs/superpowers`.
- **Nada de lógica copiada.** Si el MCP necesita algo que está en `src/` pero mezclado con el DOM, se separa en `src/` y lo usan los dos.
- **Credenciales:** nunca en el repo. El refresh token sólo va al Llavero.
- **Tests del MCP:** van en `tests/mcp-*.test.ts` y usan los dobles de `tests/dobles.ts`. Sin red y sin el Llavero real.

## Nombres que cruzan tareas

```ts
// src/conversion.ts  (T2): las reglas del formato, en un solo lugar
reglasDelFormato(): string[]            // las líneas de «Formato:» que hoy arma pedidoDeConversion; el pedido las usa

// src/validar.ts  (T2): puro
interface Problema { campo: string; mensaje: string }
validarMd(md: string): { receta: Receta; problemas: Problema[] }

// mcp/auth.ts  (T3)
type CodigoAuth = 'sin-cliente' | 'sin-permiso' | 'permiso-revocado' | 'usuario-no-habilitado'
  | 'cliente-interno' | 'api-deshabilitada' | 'scope-insuficiente' | 'sin-carpeta' | 'sin-red'
class ErrorDeLogin extends Error { codigo: CodigoAuth }
crearAuthEscritorio({ llavero, abrirNavegador, fetch }): { token(): Promise<string>; conectar(): Promise<void> }
interface Llavero { leer(): Promise<string | null>; guardar(v: string): Promise<void> }   // real: `security`
codigoDe(respuestaDeGoogle): CodigoAuth | null

// mcp/recetario.ts  (T4, T5): las herramientas, sin el transporte
crearRecetario({ drive, sheets, fotos }): {
  formato(), categorias(), tags(), buscar(q), leer(id), validar(md),
  crear({ md, categoria, fotos }), guardar({ id, md, categoria?, fotos?, sacar? }),
  borrar(id), reindexar(alProgresar)
}
interface FotoPedida { origen: string /* ruta o URL */; uso: 'plato' | 'paso' | 'fuente' }

// mcp/fotos.ts  (T6)
achicarEnNode(origen: string): Promise<Blob>   // achicar() de src/fotos.ts con @napi-rs/canvas; HEIC → sips

// mcp/servidor.ts  (T7): registra las herramientas en el SDK por stdio
```

---

### Tarea 1: La base de `mcp/` y lo que no se publica

**Archivos:** `mcp/tsconfig.json`, `mcp/servidor.ts` (un servidor vacío que arranca), `package.json` (dependencias y scripts `mcp` y `mcp:conectar`), `tsconfig.json`, `.gitignore`, `tests/publicacion.test.ts`.

- [ ] **Tests primero**, en `tests/publicacion.test.ts`:
  - ningún archivo de `src/` importa de `mcp/` (recorre `src/` y busca `from '../mcp` o `'../../mcp`);
  - después de `vite build`, ningún archivo de `dist/` contiene la marca `MCP-RECETARIO`, que se pone como constante en `mcp/servidor.ts`. El build se corre desde el test con la API de Vite, o el test lee `dist/` y falla si no existe;
  - `.gitignore` incluye `credentials*.json`, `token*.json` y `client_secret*.json`.
- [ ] **Implementar:**
  - `mcp/tsconfig.json` extiende el de la raíz con `types: ["node"]` e incluye `mcp` y `src`.
  - `npm run typecheck` suma `tsc --noEmit -p mcp/tsconfig.json`.
  - Script `"mcp": "tsx mcp/servidor.ts"`.
  - Un servidor mínimo con el SDK, que responde a `list_tools` con una lista vacía.
- [ ] **Chequeo manual:** `npm run mcp` arranca y espera por stdio.
- [ ] Todo en verde. Commit.

### Tarea 2: Las reglas del formato y la validación, puras en `src/`

**Archivos:** `src/conversion.ts`, `src/validar.ts` (nuevo), `tests/conversion.test.ts`, `tests/validar.test.ts` (nuevo).

- [ ] **Test primero:** `reglasDelFormato()` devuelve las líneas de formato que hoy arma el pedido, con los valores de `DURACIONES`, `DIFICULTADES` y `TAGS_RESERVADOS`. `pedidoDeConversion` las incluye tal cual: los tests de hoy del pedido no cambian.
- [ ] **Test primero:** `validarMd` detecta cada caso con su mensaje en español:
  - frontmatter sin `titulo`;
  - `tiempo` o `dificultad` fuera de sus valores;
  - un tag reservado en cualquiera de sus formas, salvo `borrador` y los especiales, que se permiten;
  - una clave desconocida;
  - un ingrediente con la cantidad adelante (`4 milanesas`) o sin separador reconocible y con número al principio;
  - `foto: foto:N` o un `![](foto:N)` cuyo `N` no está en el depósito;
  - un `.md` sin frontmatter.

  Un `.md` correcto no tiene problemas. `validarMd` usa `parse` y las funciones de `catalogo.ts`/`fotos-receta.ts`, sin reglas propias.
- [ ] **Implementar.**
- [ ] Todo en verde. Commit.

### Tarea 3: El login de escritorio y los errores con código

**Archivos:** `mcp/auth.ts`, `mcp/llavero.ts` (el real, con `security add-generic-password` / `find-generic-password`), `mcp/conectar.ts` (el script `mcp:conectar`), `tests/mcp-auth.test.ts`.

- [ ] **Test primero**, con un Llavero falso, un `fetch` falso y un `abrirNavegador` falso:
  - sin `~/.config/recetario/cliente.json`, o con el archivo mal formado → `sin-cliente` (la ruta del archivo se inyecta);
  - sin token en el Llavero → `sin-permiso`;
  - `conectar()` arma la URL de consentimiento con el scope `drive`, `access_type=offline`, `prompt=consent` y el redirect al puerto local; recibe el código, lo canjea y guarda el refresh token en el Llavero;
  - `token()` renueva con el refresh token y guarda en memoria el access token hasta un minuto antes de que venza;
  - `codigoDe` traduce cada respuesta de Google a su código:
    - `invalid_grant` → `permiso-revocado`
    - `access_denied` → `usuario-no-habilitado`
    - un 403 con `org_internal` → `cliente-interno`
    - un 403 con `accessNotConfigured` o `SERVICE_DISABLED` → `api-deshabilitada`
    - un 403 con `insufficientPermissions` o `ACCESS_TOKEN_SCOPE_INSUFFICIENT` → `scope-insuficiente`
    - un error de red → `sin-red`
  - el mensaje de un `ErrorDeLogin` es el texto claro de la tabla del spec, nunca el crudo de Google.
- [ ] **Implementar.**
  - El servidor de loopback escucha en `127.0.0.1` en un puerto libre, recibe un solo pedido y se cierra.
  - `npm run mcp:conectar` corre `conectar()` y dice con qué cuenta quedó.
- [ ] **Chequeo manual** con el cliente real. Crear el cliente *Aplicación de escritorio* en Google Cloud es un paso del usuario, y queda escrito en `mcp/LEEME.md`.
- [ ] Todo en verde. Commit.

### Tarea 4: Las herramientas de lectura

**Archivos:** `mcp/recetario.ts`, `tests/mcp-lectura.test.ts`.

- [ ] **Test primero**, contra los dobles de Drive y Sheets:
  - el primer uso arranca el store y carga el índice una vez; los usos siguientes no vuelven a leer la planilla;
  - `categorias` devuelve el id, el nombre y la cantidad de recetas de cada una;
  - `tags` devuelve lo mismo que `tagsDe('recetas')`;
  - `buscar` devuelve lo mismo que la búsqueda de la app: sin borradores, salvo que se pidan con `{ tags: ['borrador'] }`, y con el motivo de cada resultado;
  - `leer` devuelve el `.md`, la categoría y el nombre de archivo;
  - `formato` devuelve `reglasDelFormato()`;
  - `validar` devuelve lo que da `validarMd`;
  - sin una carpeta marcada, cualquier herramienta falla con `sin-carpeta`.
- [ ] **Implementar.** El store se crea con los clientes de `drive.ts` y `sheets.ts`, un proveedor de token que viene de `mcp/auth.ts` y un índice local que vive sólo en memoria.
- [ ] Todo en verde. Commit.

### Tarea 5: Las herramientas de escritura

**Archivos:** `mcp/recetario.ts`, `tests/mcp-escritura.test.ts`.

- [ ] **Test primero:**
  - `crear` con un `.md` válido escribe el `.md` y la fila (en la categoría, o en `_sin-categoria/` si no hay categoría) y devuelve el id y el nombre de archivo;
  - `crear` con problemas de validación no escribe nada y devuelve los problemas;
  - `guardar` relee antes de escribir, mueve el archivo si cambia la categoría, conserva las claves y secciones desconocidas y saca las fotos que se piden sacar;
  - `borrar` manda a la papelera;
  - `reindexar` informa el avance.
- [ ] **Implementar**, con `store.crear`, `store.guardar`, `store.borrar` y `store.reconstruir`.
- [ ] Todo en verde. Commit.

### Tarea 6: Las fotos

**Archivos:** `mcp/fotos.ts`, `mcp/recetario.ts` (la parte `fotos` de `crear` y `guardar`), `tests/mcp-fotos.test.ts`, `tests/fixtures/foto-chica.jpg` (una foto real chica).

- [ ] **Test primero:**
  - `achicarEnNode` sobre una foto de 2000×1000 da un JPEG de 1600×800;
  - una foto más chica que 1600 no se agranda;
  - un archivo que no es imagen falla con el nombre del archivo;
  - HEIC: se simula `sips` y se verifica que se lo llame para las extensiones `.heic` y `.heif`;
  - una URL se baja con un `fetch` falso y se achica. Si falla, queda como link externo en el depósito;
  - uso `plato`: la foto va al depósito y a la portada (`foto: foto:N`);
  - uso `paso`: va al depósito, y el `![](foto:N)` lo escribe el agente en el `.md`;
  - uso `fuente`: no se sube si la receta no tiene `borrador`; se sube al depósito si lo tiene.
- [ ] **Implementar.**
  - `achicar()` de `src/fotos.ts` recibe un `lienzo` y un `decodificar` hechos con `@napi-rs/canvas`: `createCanvas`, `loadImage` y un `toBlob` armado sobre `encode('jpeg', 85)`.
  - Las fotos entran al store como `CambiosDeFotos.nuevas`.
- [ ] Todo en verde. Commit.

### Tarea 7: El servidor y el skill

**Archivos:** `mcp/servidor.ts`, `mcp/LEEME.md`, `skills/recetario/SKILL.md` (se reescribe entero), `tests/mcp-servidor.test.ts`.

- [ ] **Test primero:** el servidor lista las diez herramientas, cada una con su esquema de entrada.
  - Llamar a una herramienta devuelve su resultado como texto o JSON.
  - Si falla, devuelve un error con el `codigo` y el texto claro, sin el crudo de Google.
- [ ] **`mcp/LEEME.md`** explica en pocas líneas cómo:
  - crear el cliente OAuth *Aplicación de escritorio* en el mismo proyecto de Google Cloud;
  - guardar `~/.config/recetario/cliente.json`;
  - correr `npm run mcp:conectar`;
  - registrarlo en Claude Code (`claude mcp add recetario -- npm --prefix <repo> run mcp`) y en Claude Desktop (el bloque de `claude_desktop_config.json`).
- [ ] **El skill**, según la sección «El skill» del spec:
  - usos, herramientas, lectura de cada fuente (se conserva la de hoy, corregida), fotos fuente, mostrar antes de escribir (una receta y un lote), la fuente como dato, corregir, ordenar, duplicados y la app cerrada;
  - la tabla de errores de login, con la instrucción de cada código y el reintento después de que el usuario confirme;
  - no copia reglas de formato: pide `formato`.
  - Se borra todo lo del modelo viejo: `completa`, `_borradores/`, «Sin categorizar» y el aviso de reindexar.
- [ ] Todo en verde. Commit.

### Tarea 8: Documentación y cierre

- [ ] **`CLAUDE.md`:**
  - el mapa suma `mcp/`;
  - la línea del agente en «Lo esencial»;
  - «Lo sabido y no arreglado» suma que la app y el MCP no se usan a la vez;
  - el conector de claude.ai deja de ser la forma de cargar recetas.
- [ ] **`product-design/`:**
  - E05: el camino de escritura y la concurrencia;
  - `user-flows.md` F9: lo que escribe el MCP aparece sin reindexar, y lo que se sube a mano, al reindexar.
- [ ] **`BACKLOG.md`:** se borra P14 y se suma «Falta probar»: registrarlo en Claude Code, `mcp:conectar`, cargar un PDF con varias recetas, corregir una receta y los errores de login.
- [ ] Se borran el spec y este plan. Commit.

## Revisión: casos que ningún test cubre del todo

1. **El usuario abre la app mientras el MCP escribe.** El skill tiene que avisar antes de empezar, y el `LEEME` lo repite.
2. **Un lote de 40 recetas con un corte a mitad de camino** (de red o de login). Cada receta se escribe entera o no se escribe, y el skill informa cuáles quedaron. Hay un test en T5: `crear` que falla en la tercera de cinco deja escritas las dos primeras y no deja ninguna a medias.
3. **Una categoría escrita distinto** («postres» o «Postre») cuando existe «Postres»: `crear` falla con las categorías que sí existen, sin crear una nueva. Test en T5.
4. **Un `.md` con CRLF o envuelto en un bloque de código,** como lo devuelve un agente: `validar` y `crear` lo limpian igual que *Pegar*, con la función `limpiarRecibido` de `conversion.ts` exportada. Test en T2.
5. **Dos recetas con el mismo título en la misma categoría:** el nombre de archivo sale con sufijo (`slugArchivo`) y ninguna pisa a la otra. Test en T5.
