# Recetario — Diseño

Fecha: 2026-08-31

## 1. Objetivo y restricciones

Un recetario personal accesible desde el celular Android y desde la Mac, cuyos
datos vivan en Google Drive y sobrevivan a la app.

Restricciones dadas:
- **Un solo usuario.** El autor. Sin compartir ni multiusuario.
- **Los datos son independientes de la app.** Las recetas se tienen que poder
  leer, editar y navegar directamente en Drive, sin la app de por medio.
- **Los tres usos pesan igual:** cocinar con el celular en la mano, capturar
  recetas nuevas, y organizar/planificar.
- **Escala objetivo:** miles de recetas.
- **Offline deseable, no obligatorio.**

## 2. Plataforma

**PWA de archivos estáticos**, publicada una vez en GitHub Pages, que habla
directo con las APIs de Google desde el navegador.

Se instala en el celular y en la Mac, arranca al instante, funciona sin señal y
se actualiza sola. El navegador se autentica contra Google con
la cuenta del usuario y escribe en su propio Drive. La única configuración es
crear una vez un cliente OAuth en Google Cloud Console.

## 3. Modelo de datos en Drive

### 3.1 Taxonomía

```
Recetario/
├── _indice                      (Google Sheet)
├── _fotos/
├── Entradas y picadas/
├── Sopas y caldos/
├── Ensaladas/
├── Pastas/
├── Arroces y legumbres/
├── Carnes/
│   └── Milanesas napolitanas.md
├── Aves/
├── Pescados y mariscos/
├── Tartas y empanadas/
├── Verduras y guarniciones/
├── Panes y masas/
├── Postres/
├── Salsas y aderezos/
├── Desayunos y meriendas/
└── Bebidas/
```

- **La carpeta es la categoría L1 y es la única verdad.** El frontmatter no
  lleva `categoria`. Mover un archivo de carpeta desde la app de Drive *es*
  recategorizarlo.
- **El eje de las carpetas es el curso**, porque es el único donde toda receta
  tiene exactamente una respuesta obvia. Estructura plana de quince carpetas,
  siguiendo el patrón de los recetarios impresos: curso arriba, con los platos
  principales ya abiertos por ingrediente. Son suficientes para que ninguna se
  vuelva inmanejable con miles de recetas, y pocas para nombrarlas de memoria.
- **La raíz es la bandeja de entrada.** Un `.md` suelto en la raíz se muestra
  como "sin categorizar", no se ignora. Capturar no exige clasificar: lo que
  llega sin decidir queda ahí y se archiva después.
- **Las categorías no están hardcodeadas.** La app las descubre listando las
  subcarpetas. Crear una carpeta crea una categoría, y la taxonomía se cambia
  arrastrando carpetas.
- **Taxonomía vs. facetas.** Una receta está en exactamente una carpeta pero
  puede tener muchos tags. Jerarquía en carpetas, clasificación múltiple en
  tags. Un L2 futuro es una subcarpeta; algo que cruza categorías es un tag.
  Van a tags y no a carpetas: origen, dieta, técnica, ocasión, estación y
  equipamiento.
- **Convención `_`.** Todo nombre que empieza con guión bajo es de la app y no
  es una categoría. Protege `_indice` y `_fotos/`.

### 3.2 Formato de receta

Un archivo `.md` por receta, con frontmatter YAML y cuerpo libre:

```markdown
---
titulo: Milanesas napolitanas
tags: [italiana, horno, rápido, invitados]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
---

Un clásico de los domingos en casa. La versión con provolone terminó ganando.

![](https://drive.google.com/file/d/1a2B3c4D5e6F7g8H9i/view)

## Ingredientes
### Para la milanesa
- 4 milanesas de nalga
- 200 g de muzzarella

### Para la salsa
- 1 lata de tomate triturado

## Preparación
1. Precalentar el horno a 200 °C.
2. Cubrir con salsa y queso.
3. Hornear 15 minutos.

## Variaciones
### A la suiza
Cambiar la salsa y la muzzarella por salsa blanca y gruyere.

## Notas
- El horno de casa calienta de más: bajar a 180 °C.
```

**Cada campo es un impuesto a la captura, así que todo es opcional menos el
título.** La app tiene que renderizar bien una receta que es solo un título y un
texto pegado de cualquier lado; los campos se llenan después, o nunca.

#### Frontmatter

| campo | notas |
|-------|-------|
| `titulo` | Obligatorio. Es lo que muestra la app. Sin él, la receta no se indexa. |
| `tags` | Clasificación múltiple: origen, dieta, técnica, ocasión, estación, equipamiento. |
| `rinde` | Texto libre. No todo rinde porciones: una tarta rinde "1 tarta de 24 cm". |
| `tiempo` | Texto libre. |
| `dificultad` | Tres valores fijos: `fácil`, `media`, `difícil`. |
| `fuente` | De dónde salió: URL, libro y página, o persona. |

- **El nombre del archivo tiene que ser representativo de la receta** y es cómo
  se navega en Drive. Cuando la app crea o renombra una receta mantiene
  alineados el título y el nombre del archivo. Si divergen por una edición
  manual, gana `titulo` para mostrar y la app ofrece renombrar el archivo.
- **`titulo` es el único campo obligatorio.** Un `.md` sin título se descarta:
  no entra al índice y la app no lo muestra. El archivo queda intacto en Drive,
  y la reconstrucción reporta cuántos se ignoraron por esta razón, para que no
  desaparezcan en silencio.
- **`dificultad` se normaliza al leer** (minúsculas, sin tildes). Un valor
  escrito a mano que no matchee cae en "sin definir" en vez de romper el filtro.
  La app lo edita con selector, no con texto libre.
- **Los tags son de vocabulario libre** por ahora. La app no los valida ni los
  restringe a una lista.

#### Cuerpo

- **La descripción es el texto entre el frontmatter y el primer `##`.** Sin
  campo ni encabezado: se lee natural en Drive y capturar es pegar un párrafo.
  Se muestra solo en el detalle de la receta, nunca en las listas, así que no va
  al índice: se lee del `.md` al abrir la receta.
- **`## Ingredientes` y `## Preparación` admiten subsecciones `###`** ("Para la
  masa", "Día 2"). El parser no puede asumir listas planas.
- **`## Variaciones` y `## Notas` son secciones distintas**, y la regla de corte
  es: si lo escrito cambia el plato que sale, es variación; si es un consejo
  para que este plato salga bien, es nota. Cada variación lleva su `###`.
- **Los ingredientes se parsean con heurística** (`- 200 g de muzzarella` →
  cantidad, unidad, item). Las líneas que no matchean se muestran tal cual. Es
  best-effort a propósito: la prioridad es poder escribir libre, no llenar un
  formulario.
- **La normalización del ingrediente para el índice es solo pasar a
  minúsculas.** Nada de tildes, plurales ni sinónimos por ahora; queda para
  cuando la búsqueda por ingrediente muestre dónde falla de verdad.

### 3.3 Fotos

Los archivos se guardan en `_fotos/` y el `.md` los referencia **por URL**, en
forma `https://drive.google.com/file/d/<ID>/view`. Como el vínculo es el id y no
la ruta, renombrar o mover la receta o la foto no lo rompe.

- **La primera imagen del documento es la principal**: la que va en la grilla y
  arriba del detalle. Sin campo en el frontmatter.
- **Se aceptan URLs externas.** Renderizan directo, sin auth. La app no puede
  copiarlas a Drive porque CORS le impide leer sus bytes; eso lo hace Claude
  (§11). El service worker cachea respuestas opacas, así que una foto externa ya
  vista sigue apareciendo sin señal.
- **Mostrar una foto de Drive requiere trabajo:** `<img src>` no puede mandar el
  token, así que la app extrae el id, hace fetch autenticado y arma un object
  URL. Se cachea en IndexedDB, lo que de paso resuelve las fotos offline.
- **Las grillas usan `thumbnailLink`**, que Drive devuelve en la metadata del
  archivo. Bajar cientos de fotos completas para pintar una lista no es viable.
- **Se redimensiona antes de subir** a ~1600 px y JPEG, en canvas. Una foto de
  celular son 4 MB y miles de recetas comerían la cuota de Drive sin necesidad.
- **Nombres dentro de `_fotos/`:** la app sube nombrando por receta
  (`Milanesas napolitanas.jpg`, `Milanesas napolitanas-2.jpg`), que al ordenar
  alfabéticamente agrupa las fotos de cada plato. El id manda, el nombre es
  cortesía. Si algún día miles de archivos en una sola carpeta molestan, se
  parte `_fotos/` sin tocar ningún `.md`.
- **Huérfanas:** al borrar una receta, la app parsea las URLs de su `.md` y
  ofrece borrar también esos archivos. Como la reconstrucción ya lee todos los
  `.md` (§5.3), puede comparar los ids referenciados contra el contenido de
  `_fotos/` y reportar las huérfanas sin costo adicional.

## 4. Índice

### 4.1 Por qué existe

Que un dispositivo nuevo no tenga que leer miles de archivos para arrancar, y
que buscar y filtrar no requiera abrir ninguna receta. **Es un cache derivado y
reconstruible: la verdad son siempre los `.md`.**

### 4.2 Por qué es una planilla

Google Sheets tiene escritura por fila (`values.update` sobre un rango,
`values.append`, borrado). Editar una receta pasa de reescribir ~540 KB a mandar
una fila de ~200 bytes.

Costo aceptado: la lectura es algo peor. La API devuelve arrays de strings sin
comprimir, así que 3.000 recetas son unos 600 KB contra ~170 KB que daría un
JSON gzippeado. Se baja solo cuando la planilla cambió, así que es un costo raro.

### 4.3 Esquema

Hoja `recetas`, una fila por receta:

| col | campo | notas |
|-----|-------|-------|
| A | `id_archivo` | id de Drive. Clave primaria. Estable ante renombres y movidas. |
| B | `nombre_archivo` | |
| C | `titulo` | del frontmatter |
| D | `categoria` | nombre de la carpeta contenedora |
| E | `carpeta_id` | id de Drive de la carpeta |
| F | `rinde` | |
| G | `tiempo` | |
| H | `dificultad` | `fácil`, `media`, `difícil` o vacío |
| I | `fuente` | |
| J | `tags` | separados por barra vertical |
| K | `ingredientes` | nombres en minúsculas, separados por barra vertical |
| L | `foto` | URL de la primera imagen del documento |
| M | `mtime` | epoch |

Los ingredientes van como celda delimitada y no como hoja aparte, para que **una
receta sea exactamente una fila y editarla sea exactamente una llamada**. Una
hoja relacional obligaría a borrar e insertar filas y a lidiar con el corrimiento
de índices.

**Cómo se ubica una fila.** La API de Sheets escribe por rango, no por clave, así
que hay que traducir `id_archivo` a número de fila. Ese mapa lo mantiene la app
en IndexedDB, armado al leer la planilla. Borrar usa `deleteDimension` y elimina
la fila de verdad: el corrimiento es determinístico, así que la app decrementa
en memoria las filas posteriores sin releer nada. Cualquier cambio hecho desde
otro dispositivo altera el `modifiedTime` de la planilla, lo que dispara una
lectura completa y reconstruye el mapa. No hace falta columna de baja lógica.

Si un mapa desactualizado hiciera escribir sobre la fila equivocada, se detecta
al leer —aparecen dos filas con el mismo `id_archivo`— y lo arregla la
reconstrucción.

Hoja `meta`: `schemaVersion`, `changesPageToken`, `ultima_reconstruccion`.

**`schemaVersion`** existe porque la metadata todavía está por definirse. Si la
app espera una versión más nueva que la de la planilla, dispara la
reconstrucción sola. Agregar campos no requiere migraciones a mano.

### 4.4 Permisos

Todo el sistema usa un único scope: **`drive.file`**, que es no-sensible y
permite publicar la app sin verificación de Google ni pantalla de advertencia.
La API de Sheets lo acepta y Google lo recomienda explícitamente por sobre el
scope `spreadsheets`, que es sensible. Usar una planilla no cuesta permisos
extra.

## 5. Sincronización

### 5.1 Arranque

Objetivo: **costo constante, independiente del tamaño del recetario.** Nada de
recorrer subcarpetas ni de leer `.md` en el arranque.

1. Render inmediato desde el índice cacheado en IndexedDB, sin esperar red.
2. En paralelo, dos llamadas:
   - `modifiedTime` de la planilla. Si cambió, se lee entera (una llamada más) y
     se reconstruye el índice local.
   - Changes API de Drive con el `changesPageToken` guardado: una sola llamada
     que casi siempre vuelve vacía, no recorre nada, no depende del tamaño del
     recetario, y detecta ediciones externas, movidas, renombres y borrados.
     Solo se relee el `.md` cuando cambió su contenido: una movida o un
     renombre parchean la fila sin descargar el archivo.
3. Si algo cambió, re-render.

La Changes API es lo que evita que el índice se desincronice cuando se edita una
receta desde Drive o desde Claude. Si no estuviera disponible, el diseño
degrada a que el usuario dispare la reconstrucción a mano (ver §10).

### 5.2 Escritura

Al guardar una receta:

1. Se sube el `.md` inmediatamente. Es el dato real.
2. Se parchea el índice local en IndexedDB inmediatamente. Es lo que ve la UI.
3. La fila de la planilla se encola: se manda con debounce de ~30 s de
   inactividad, más flush forzado cuando la pestaña pasa a segundo plano.

La cola vive en IndexedDB, es la misma que la de escrituras offline, y se
reintenta en el próximo arranque. La UI nunca espera a la red.

### 5.3 Reconstrucción total

Única operación que lee todos los `.md`. Explícita, con barra de progreso,
nunca en el arranque. Se dispara a mano, o sola si la planilla no existe, está
corrupta o tiene un `schemaVersion` viejo.

Listar la raíz y cada subcarpeta, leer todos los archivos, parsear, reescribir
la planilla con `values.append` en lotes de cientos de filas —unas seis llamadas
para 3.000 recetas— y resetear el `changesPageToken`. El cuello de botella es
leer los `.md`, que es irreducible: estimo alrededor de un minuto para 3.000
recetas con requests en paralelo.

## 6. Offline y cache local

IndexedDB guarda una copia del índice y los cuerpos de las recetas que se
abrieron (LRU), no todas. Service worker para el código de la app.

- **Siempre offline:** buscar, filtrar y navegar el recetario entero, porque
  sale del índice cacheado.
- **Offline solo si ya se abrió:** el detalle completo de una receta.
- Un botón explícito de "bajar todo" queda fuera de v1.

## 7. Componentes

Seis piezas, cada una con un solo trabajo:

- **`auth.js`** — obtener y renovar el token de Google.
- **`drive.js`** — cliente crudo de la API de Drive: listar carpeta, leer,
  escribir, crear, mover, renombrar, subir foto, Changes API. No sabe qué es una
  receta.
- **`sheets.js`** — cliente crudo de la API de Sheets: leer rango, actualizar
  fila, append en lote.
- **`recipe.js`** — puro, sin red: `parse(texto)`, `serialize(receta)` y el
  parseo best-effort de la línea de ingrediente.
- **`catalogo.js`** — construir, diffear y parchear el índice. **El diff es una
  función pura**: recibe lo que devolvió Drive y el índice actual, devuelve qué
  se agregó, cambió, movió, renombró y borró. Ahí vive casi toda la corrección
  del sistema y se puede testear entera en memoria.
- **`store.js`** — el único que combina los anteriores con IndexedDB, y la única
  cara que ve la UI: `sync()`, `buscar()`, `get()`, `guardar()`.

Más `ui/` con cuatro vistas y `sw.js` para el app shell.

## 8. Manejo de errores

- **Un `.md` malformado nunca puede romper la app.** Requisito duro, no caso
  borde: las recetas se editan desde Drive y desde Claude. Si el frontmatter no
  parsea, la receta se indexa con lo que se pueda rescatar y se muestra como
  texto plano con un aviso.
- **Sin red:** banner, navegación completa desde cache, escrituras encoladas.
- **Token caído:** renovación silenciosa; si falla, el índice sigue navegable en
  solo lectura y se ofrece re-login.
- **Conflicto de edición:** antes de escribir un `.md` se compara su
  `modifiedTime` con el que se tenía. Si cambió, no se pisa: se muestran las dos
  versiones.
- **Índice corrupto o `schemaVersion` viejo:** reconstrucción con progreso.
- **429 de Drive o Sheets:** backoff exponencial, sobre todo durante una
  reconstrucción.
- **Concurrencia entre dispositivos:** Drive v3 no tiene ETags para escritura
  condicional, así que lo mejor disponible es leer el `modifiedTime` justo antes
  de escribir y abortar si no es el esperado. Queda una ventana mínima de
  carrera; con un solo usuario es despreciable y el peor caso lo arregla la
  reconstrucción.

## 9. Testing

- **`recipe.js` y el diff son puros** → tests unitarios: round-trip de
  parse/serialize, frontmatter roto, ingredientes raros, y cada tipo de cambio
  detectable más sus combinaciones.
- **`store.js`** contra un Drive y un Sheets falsos en memoria: sync
  incremental, reconstrucción, cola offline, conflicto.
- **`auth.js`, `drive.js`, `sheets.js`** no llevan unitarios. Son integración
  con un tercero: se verifican a mano una vez.
- Vitest como runner. Sin automatización de navegador en v1.

## 10. Riesgos a despejar antes de construir (paso 0)

Cuatro preguntas sobre el mismo tema, resueltas en un spike de una tarde antes
de escribir la app:

1. **¿`drive.file` + Google Picker sobre la carpeta `Recetario/` da acceso a los
   `.md` que ya están adentro?** `drive.file` solo alcanza archivos que la app
   creó o que se eligieron explícitamente.
   *Plan B:* un scope más amplio, que funciona igual pero muestra una pantalla
   de "app no verificada" al entrar. Aceptable para uso propio.
2. **¿La Changes API funciona con `drive.file`?**
   *Plan B:* el índice se valida solo cuando el usuario dispara la
   reconstrucción. El resto del diseño no cambia.
3. **¿La API de Sheets lee y escribe con `drive.file` una planilla creada por la
   app?** La documentación dice que sí; conviene confirmarlo en la práctica.
   *Plan B:* volver al índice JSON con escritura diferida, journal de deltas y
   partición por categoría (ver §4.2).
4. **¿`thumbnailLink` sirve desde el navegador con `drive.file`?** Es lo que
   hace viable pintar una grilla sin bajar las fotos completas.
   *Plan B:* generar miniaturas propias al subir y guardarlas en `_fotos/`.

Ninguno de los planes B invalida el modelo de datos. El riesgo está acotado a
cómo se sincroniza el índice, no a cómo se guardan las recetas.

## 11. Interfaz conversacional

**No hay que construir nada.** Al ser las recetas archivos `.md` en Drive, el
conector de Google Drive de Claude las lee tal cual desde la app de Android, y
la búsqueda full-text de Drive cubre las consultas por contenido. Sin skill, sin
MCP, sin hosting.

Esto además resuelve la captura de recetas desde la web, que de otro modo sería
un problema: una PWA no puede descargar una página arbitraria por CORS, y un
proxy implicaría infraestructura. Pedirle a Claude que convierta una URL en una
receta guardada en Drive es el camino sin infra, y el índice se entera por la
Changes API en el próximo arranque.

## 12. Alcance de v1

Dentro:

- Buscar y filtrar por categoría, tags e ingredientes.
- Ver receta en modo cocina: texto grande, pasos marcables.
- Crear y editar recetas, con foto.
- Planificador semanal y lista de compras.
- Reconstruir índice.
- Offline según §6.

Fuera:

- Escalado de porciones (el parser de ingredientes queda listo; falta la UI).
- Importar desde URL dentro de la app: lo cubre Claude (§11).
- OCR de fotos de libros.
- Compartir con otras personas.
- Botón de "bajar todo para offline".

El alcance de v1 tiene un corte natural en dos hitos, y conviene ejecutarlo
así: **núcleo** (autenticación, índice, buscar, filtrar, leer en modo cocina,
crear y editar, reconstruir) y **planificación** (planificador semanal y lista
de compras), que depende del núcleo y no lo modifica. El segundo hito se puede
posponer sin dejar nada a medias.

Decisiones diferidas con su umbral:

- **Journal de deltas y partición del índice:** eliminados por la decisión de
  §4.2. Solo reaparecen si el plan B del riesgo 3 se activa.
- **Cache offline completo:** cuando cocinar sin señal deje de ser hipotético.
