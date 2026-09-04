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

Se instala en el celular y en la Mac y se actualiza sola. El navegador se autentica contra Google con
la cuenta del usuario y escribe en su propio Drive. La única configuración es
crear una vez un cliente OAuth en Google Cloud Console.

## 3. Modelo de datos en Drive

### 3.1 Taxonomía

```
Recetario/
├── _indice                      (Google Sheet)
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
  tiene exactamente una respuesta obvia. Estructura plana de dieciséis carpetas,
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
- **El nombre del archivo sale del título, una sola vez.** Al crear una receta,
  la app la nombra con el título en minúsculas, sin acentos y con guiones
  (`milanesas-napolitanas.md`); si ya existe ese nombre en la carpeta, agrega un
  sufijo numérico. Si después el título cambia, la app **ofrece** renombrar el
  archivo, nunca lo hace en silencio (§3.2); el índice guarda los dos valores
  por separado (§4.3). Un `.md` que escribió un agente conserva su nombre hasta
  que alguien acepte renombrarlo.
- **Convención `_`.** Todo nombre que empieza con guión bajo es de la app y no
  es una categoría. Protege `_indice`.

### 3.2 Formato de receta

Un archivo `.md` por receta: frontmatter YAML y cuerpo Markdown.

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

**Cada campo es un impuesto a la captura, así que `titulo` es el único
obligatorio.** La app tiene que renderizar bien una receta que es solo un título
y un texto pegado de cualquier lado; el resto se llena después, o nunca.

#### Frontmatter

Lista exhaustiva de claves reconocidas. La app no interpreta ninguna otra.

| clave | tipo | obligatorio | valores |
|---|---|---|---|
| `titulo` | texto | **sí** | libre |
| `tags` | lista de texto | no | vocabulario libre |
| `rinde` | texto | no | libre |
| `tiempo` | texto | no | libre |
| `dificultad` | enumerado | no | `fácil` · `media` · `difícil` |
| `fuente` | texto | no | libre |

- **Sin `titulo` la receta no se indexa** y la app no la muestra. El archivo
  queda intacto en Drive y la reconstrucción reporta cuántos se ignoraron por
  esta razón, para que no desaparezcan en silencio.
- **`rinde` es texto libre y no un número de porciones**, porque no todo rinde
  porciones: una tarta rinde "1 tarta de 24 cm".
- **`dificultad` se compara normalizando** (minúsculas, sin tildes). Un valor
  escrito a mano que no matchee cae en "sin definir" en vez de romper el filtro.
  La app lo edita con selector, no con texto libre.
- **`tags` es vocabulario libre**, sin validación ni lista cerrada. Tiene un
  único valor con significado especial: **`incompleto`**, que hace que la receta
  se dibuje marcada en las listas y en el detalle, y que se pueda listar lo que
  falta terminar filtrando por él. No es un campo aparte: es un tag común con
  render distinto.
- **Las claves desconocidas se preservan** en toda escritura de la app, aunque
  las ignore. Un agente puede dejar metadata propia sin que la app se la borre.

#### Cuerpo

Las secciones se reconocen por encabezado `##`, comparando normalizado
(minúsculas, sin tildes). Este es el orden canónico en el que la app serializa:

| sección | encabezado | notas |
|---|---|---|
| descripción | *(ninguno)* | Todo el texto entre el frontmatter y el primer `##`. |
| ingredientes | `## Ingredientes` | Admite subsecciones `###` ("Para la masa"). |
| preparación | `## Preparación` | Admite subsecciones `###` ("Día 2"). |
| variaciones | `## Variaciones` | Cada variación con su `###`. |
| notas | `## Notas` | |

- **Ninguna sección es obligatoria.** Pueden faltar todas.
- **Las secciones no reconocidas se preservan textualmente** y se serializan
  después de `## Notas`. La app nunca descarta contenido que no entiende: un
  agente puede escribir `## Maridaje` y sobrevive a cualquier edición.
- **La descripción se muestra solo en el detalle de la receta**, nunca en las
  listas, así que no va al índice: se lee del `.md` al abrir la receta.
- **La regla de corte entre notas y variaciones:** si lo escrito cambia el plato
  que sale, es variación; si es un consejo para que este plato salga bien, es
  nota.
- **Las imágenes se escriben como `![](url)`** en cualquier punto del cuerpo.
  Ver §3.3.
- **Los ingredientes se parsean con heurística** (`- 200 g de muzzarella` →
  cantidad, unidad, item). Las líneas que no matchean se muestran tal cual. Es
  best-effort a propósito: la prioridad es poder escribir libre, no llenar un
  formulario.
- **La normalización del ingrediente para el índice es solo pasar a
  minúsculas.** Nada de tildes, plurales ni sinónimos por ahora; queda para
  cuando la búsqueda por ingrediente muestre dónde falla de verdad.

#### Nombre del archivo

**Tiene que ser representativo de la receta** y es cómo se navega en Drive.
Cuando la app crea o renombra una receta mantiene alineados el título y el
nombre del archivo. Si divergen por una edición manual, gana `titulo` para
mostrar y la app ofrece renombrar el archivo.

### 3.3 Imágenes

**Las recetas no guardan fotos propias.** Las imágenes se referencian por URL
externa con la sintaxis normal de Markdown, `![](https://…)`, en cualquier punto
del cuerpo. Renderizan directo, sin autenticación.

La app no sube fotos, no las guarda en Drive y no tiene carpeta de fotos. La
razón es el costo desproporcionado: mostrar una imagen guardada en Drive obliga
a extraer su id, pedirla con el token y armar un object URL, porque un `<img
src>` no puede autenticarse; y sostener miniaturas para las listas obliga además
a mantener un mapa de `thumbnailLink` que caduca. Todo eso para un recetario
donde la mayoría de las recetas —capturadas de PDFs, libros y videos— no va a
tener ninguna imagen.

- **Se dibujan donde el Markdown las puso**, dentro de la sección que les toca.
  No hay imagen de portada ni destacada: ninguna imagen tiene un rol especial.
- **Las listas no muestran imágenes.** Ni la de una categoría ni los resultados
  de la búsqueda: son listas de texto.
- **Tocar una imagen la abre a pantalla completa**, con paso de una a otra si la
  receta tiene varias.
- **Solo se aceptan `http:` y `https:`** y rutas relativas. Cualquier otro
  esquema se deja como texto a la vista, sin dibujar la imagen (§7.3).
- Una imagen externa que dejó de estar disponible se ve rota; el `.md` no se
  toca. El texto de la receta nunca depende de una imagen.

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
| L | `mtime` | epoch |

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

Hoja `meta`: `schemaVersion`, `changesPageToken`, `ultima_reconstruccion` y
`reconstruccion_en_curso`.

**`schemaVersion`** existe porque la metadata todavía está por definirse. Si la
app espera una versión más nueva que la de la planilla, dispara la
reconstrucción sola. Agregar campos no requiere migraciones a mano.

### 4.4 Permisos

Todo el sistema usa un único scope: **`https://www.googleapis.com/auth/drive`**.
La misma credencial cubre Drive y Sheets: usar una planilla no cuesta permisos
extra.

El scope es amplio porque `drive.file` no alcanza. `drive.file` es estrictamente
por archivo: da acceso a lo que la app crea y a lo que el usuario elige a mano en
el Picker, y elegir una carpeta da la carpeta, no su contenido. Con la carpeta
`Recetario/` seleccionada, la app no ve ninguna de las 16 subcarpetas ni ningún
`.md` que no haya escrito ella. Como el input principal son agentes que escriben
los `.md` por fuera (§10), la app quedaría ciega justo frente al contenido que
tiene que mostrar.

El costo es la pantalla **"Google no verificó esta app"** la primera vez que se
entra. Para un solo usuario es aceptable, y a cambio desaparece el Google Picker:
la app ubica `Recetario/` buscándola por nombre, sin API key ni paso de selección
en el primer arranque.

## 5. Sincronización

### 5.1 Arranque

Objetivo: **costo constante, independiente del tamaño del recetario.** Nada de
recorrer subcarpetas ni de leer `.md` en el arranque.

**Arranque en frío.** Sin nada en IndexedDB, la app tiene que ubicar dos cosas
por nombre, porque no hardcodea ningún id:

1. **La carpeta.** Buscar `Recetario/`. Si no aparece ninguna, la app **no la
   crea**: falla con un mensaje que apunta al `SETUP.md`, porque la estructura
   de Drive es un prerrequisito. Si aparece más de una, preguntar cuál.
2. **La planilla.** Buscar `_indice` dentro de esa carpeta. Una, se usa;
   ninguna, se crea y se reconstruye (§5.3); más de una, se usa la de
   `modifiedTime` más reciente y se avisa, porque es el rastro de que alguna vez
   se creó una duplicada.

**La planilla se crea solo cuando la búsqueda respondió y vino vacía.** Si la
búsqueda falla —sin red, 429, token caído—, "no la encontré" no es "no existe":
la app arranca en solo lectura con el índice cacheado y no crea nada. Crear una
segunda `_indice` es el peor error posible del arranque, porque no tiene
síntoma: cada dispositivo escribe en la suya y las ediciones dejan de verse del
otro lado.

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
receta desde Drive o desde Claude. Una edición externa aparece en la primera
llamada posterior, con un `pageToken` que avanza de a uno.

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

**Antes de empezar se descarta la cola de escrituras del §5.2.** Cada entrada de
la cola es una fila derivada de un `.md` que ya está en Drive, así que la
reconstrucción la vuelve a generar leyendo el archivo. Si no se descartara, la
cola volcaría filas viejas sobre la planilla recién reconstruida.

**Una reconstrucción interrumpida se detecta.** `reconstruccion_en_curso` se
marca en la hoja `meta` al empezar y se limpia al terminar, junto con
`ultima_reconstruccion`. Si al arrancar está marcado, el índice quedó a medias
—se cerró la pestaña, se cayó la red— y la app reconstruye de nuevo en lugar de
confiar en él. Sin esa marca, un índice truncado se ve exactamente igual que uno
completo: el `schemaVersion` es correcto y el `changesPageToken` también.

## 6. Cache local

IndexedDB guarda el índice, el mapa de filas, los cuerpos de las recetas que se
abrieron y la cola de escrituras pendientes. Service worker para el código de la
app, con red primero para la navegación —así una versión nueva se ve aunque la
app esté instalada— y cache primero para los archivos con hash en el nombre.

**La app necesita conexión para arrancar.** Usar el índice cacheado para
renderizar antes de hablar con Drive es una optimización que v1 no hace: el
arranque lee la planilla y recién entonces dibuja. Cocinar sin señal no es el
caso de uso que se está resolviendo; si alguna vez lo es, el índice ya está en
IndexedDB y lo que falta es solo decidir usarlo.

**El índice se puede reconstruir a mano cuando se quiera** (§5.3), desde el menú
del home. Es lo que se usa después de editar recetas por fuera de la app.

## 7. Componentes e interfaz

### 7.1 Módulos

Seis piezas, cada una con un solo trabajo:

- **`auth.js`** — obtener y renovar el token de Google.
- **`drive.js`** — cliente crudo de la API de Drive: listar carpeta, leer,
  escribir, crear, mover, renombrar, Changes API. No sabe qué es una
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

Más `ui/` con las vistas de §7.2 y `sw.js` para el app shell.

### 7.2 Vistas

**Un solo diseño, pensado para el celular.** La Mac usa la misma interfaz en una
ventana más ancha; no hay dos diseños que mantener.

**Home — categorías.** Buscador arriba de todo, y debajo una grilla de tiles,
uno por subcarpeta, con el conteo de recetas de cada una. **Cada tile lleva la
foto de su categoría**, con un velo que sostiene el nombre y un filo de 3 px con
el color de la categoría (§7.3): eso es lo que se reconoce de un vistazo, sin
leer las dieciséis. La raíz aparece como un tile más, "Sin categorizar", que es
donde quedan las capturas que un agente dejó sin archivar.

**Los tiles van en orden alfabético**, no por cantidad: ordenar por conteo
reacomoda la grilla cada vez que entra una receta, y la posición de una
categoría es justamente lo que se aprende. **Las categorías vacías se pliegan**
detrás de una fila —"3 categorías vacías"— que las despliega: existen en Drive y
tienen que poder abrirse, pero no ganan un tile hasta tener contenido.

Al pie, **"Nueva receta"** como acción propia, no escondida en un menú: es la
única forma de anotar algo sin un agente a mano (§11). En el hito 1 no hay barra
de navegación inferior —el planificador es hito 2—: la navegación es un stack
hacia adentro.

En el encabezado del home hay un menú de overflow con las dos únicas acciones
que no pertenecen a ninguna receta: **reconstruir el índice** —con la fecha y
hora de la última reconstrucción, que sale de la hoja `meta`— y **reconectar la
cuenta**, que es la salida del token caído del §8. No hay pantalla de ajustes:
no hay nada que ajustar.

**Categoría — y resultados del buscador.** Las dos usan la misma lista compacta
de una columna, con título y la meta en una línea
(`rinde` · `tiempo` · `dificultad`). Entran seis o siete por pantalla y aguanta
cientos de recetas sin cambiar de forma. Es una lista de texto: las imágenes,
cuando las hay, se ven al abrir la receta. Arriba, chips que filtran por tag
dentro de la categoría. Las recetas con el tag `incompleto` se dibujan en
itálica con una barra del color de la categoría al costado: se leen distinto sin
depender de que se vea un punto de color.

**El buscador agrupa por dónde coincidió**, con dos bloques rotulados: *por
nombre* y *por ingrediente*. Son dos coincidencias de peso muy distinto y en una
sola lista se mezclaban. Como los resultados cruzan categorías, cada fila lleva
la foto de la suya como marca; en la vista de una categoría, donde todas son
iguales, no lleva ninguna.

Una categoría sin recetas no muestra una lista vacía: dice qué falta y dónde
—las recetas entran como `.md` en esa carpeta de Drive—, que es la única acción
posible desde ahí.

**Detalle.** Una sola columna, sin pestañas. Las pestañas costaban cuatro toques
para leer una receta entera y escondían las notas y las variaciones justo cuando
se está cocinando; en una receta —que es texto corto— el scroll alcanza.

Arriba, una banda del color de la categoría: es el lugar reservado para una foto
de portada si alguna vez las hay (§3.3), y mientras tanto ubica la receta en su
categoría. Debajo, la vuelta a la categoría y "Editar"; después el título, la
meta y las secciones en el orden en que se cocina: **Ingredientes**,
**Preparación**, **Variaciones**, **Notas**, y al final las secciones que la app
no reconoce.

**Los ingredientes van en una barra pegajosa que se pliega.** Se consultan una y
otra vez mientras se ejecutan los pasos, así que quedan siempre a la vista al
tope; plegarlos —la barra muestra el conteo— devuelve la pantalla a la
preparación. Los pasos van numerados; tocar uno lo marca con el color de la
categoría.

Dos acciones de cocina, que es donde se usa la app con las manos ocupadas:
**"Pantalla activa"** toma un *wake lock* para que el celular no se apague a
mitad de una receta, y **"Texto grande"** sube el tamaño de los pasos para leer
de lejos. El wake lock se vuelve a pedir al volver a la app, porque el navegador
lo suelta al pasar a segundo plano.

Las imágenes se dibujan donde el Markdown las puso. Tocar cualquier foto abre un
visor a pantalla completa con zoom y swipe entre todas las de la receta: **la
galería es un visor, no una sección.**

**Editor.** No es para escribir recetas, es para corregir lo que quedó mal.
Formulario en una sola pantalla que scrollea:

- *Frontmatter:* `titulo`, `rinde`, `tiempo` y `fuente` como campos de texto;
  `tags` con autocompletado sobre los ya usados; **carpeta y `dificultad` como
  selectores**, que son los dos únicos lugares donde un error rompe algo — y la
  carpeta ni siquiera es un campo del archivo, es una operación de Drive.
- *Cuerpo:* un textarea por sección (descripción, ingredientes, preparación,
  variaciones, notas), en monoespaciada, con el Markdown crudo adentro,
  subsecciones `###` incluidas. Sin texto enriquecido, sin barra de formato y
  sin insertor de imágenes: un `![](…)` se ve y se edita como texto.
- *"Otras secciones":* bloque que aparece solo cuando el archivo trae
  encabezados que la app no reconoce (§3.2). **El editor nunca esconde contenido
  del archivo:** si se preservaran en silencio, no habría forma de arreglarlos
  desde la app.

**Crear una receta** es el mismo editor con el archivo vacío: la app escribe el
frontmatter con `titulo` y el tag `incompleto`, en la carpeta que se elija —la
raíz por defecto, que es la bandeja de entrada del §3.1— y abre el formulario.
No hay un flujo de alta aparte. Existe para anotar algo en el momento sin
depender de tener un agente a mano, no para componer recetas largas.

**No hay vista de bandeja ni de triage.** Lo que falta archivar se ve en el tile
"Sin categorizar" del home, y lo que falta terminar se lista filtrando por el tag
`incompleto`. Corregir se hace entrando a la receta puntual.

### 7.3 Lenguaje visual

**El color lo ponen las categorías; la app no.** La interfaz es un fondo oscuro
y un texto claro, y lo único que tiene color en la pantalla es una foto de
categoría o el filo que la identifica. No hay un acento de marca compitiendo con
eso.

**Oscuro, siempre.** No hay paleta clara ni `prefers-color-scheme`: la app se
abre en la cocina, muchas veces de noche, y el fondo oscuro deja que las fotos
sean lo único que ilumina. Un solo tema es también un solo juego de tokens que
mantener.

| token | valor |
|---|---|
| fondo | `#14131A` |
| superficie (campos, menú, barras) | `#1E1C26` |
| texto | `#EDEAE4` |
| texto secundario | `#8A8598` |
| separador | `#2C2936` |

Los neutros no son grises de sistema: llevan el mismo tinte violeta, que es lo
que los hace leer como elegidos y no como el default del navegador.

**Un color por categoría.** Dieciséis matices repartidos a propósito, con 14° de
separación mínima entre vecinos, todos con contraste AA. **No salen de un hash
del nombre:** se midió, y con dieciséis categorías el hash agrupaba —`Pescados y
mariscos` y `Ensaladas` caían en el mismo matiz exacto—. El color se resuelve
desde el nombre de la carpeta, que es la única verdad del modelo (§3.1); una
categoría nueva que nadie mapeó cae en un neutro y no rompe nada.

El color hilvana la categoría a través de las vistas: el filo del tile en el
home, la barra de una receta `incompleto`, el chip de los resultados de búsqueda
y la banda del detalle.

**Las fotos de categoría viven en el repo**, no en Drive: son dieciséis archivos
que no cambian nunca, y pedirlos con el token en cada arranque sería la misma
maquinaria que hizo descartar las fotos de receta (§3.3). Se importan desde
`src/` —no desde `public/`— para que el build les ponga hash y caigan bajo
`/assets/`, la única ruta que el service worker sirve caché-primero (§6).

**Tipografía: tres roles, no una fuente de sistema.** La pila del sistema se
veía como un documento sin diseñar, y el arranque ya depende de la red.

| rol | fuente | uso |
|---|---|---|
| display | Bricolage Grotesque | títulos de pantalla y de receta |
| texto | Instrument Sans | todo el cuerpo |
| mono | JetBrains Mono | rótulos de sección, conteos, y el Markdown crudo del editor |

Los rótulos en mono, en versalita y con tracking, son los que marcan la
estructura de la receta sin usar peso ni color.

| uso | tamaño | peso |
|---|---|---|
| Título de pantalla y de receta | 1.75rem | 700 |
| Encabezado `##` del cuerpo | 1.125rem | 600 |
| Cuerpo: ingredientes, notas | 1.0625rem / interlineado 1.55 | 400 |
| Paso de la preparación | 1.0625rem, o 1.375rem con "Texto grande" | 400 |
| Título de fila en lista | 1rem | 550 |
| Chips | 0.875rem | 500 |
| Meta (`rinde` · `tiempo` · `dificultad`) | 0.8125rem | 400 |
| Rótulo de sección (mono, versalita) | 0.625rem | 500 |

Todas las medidas van en `rem`, nunca en píxeles fijos, así la app hereda el
tamaño de letra del sistema. "Texto grande" del §7.2 no reemplaza eso: sube solo
los pasos, que es lo que se lee de lejos, sin reacomodar el resto de la pantalla.

**Densidad.** Espaciado en múltiplos de 4 px. Márgenes laterales de 16 px, filas
de lista con 12 px arriba y abajo —seis o siete por pantalla, como pide el
§7.2—, y 14 px entre pasos de la preparación. Radio de 12 px en tiles y
superficies, `999px` en los chips.

**Área táctil mínima de 44 px** en todo lo que se toca, aunque el elemento
dibujado sea más chico. El caso que manda es marcar un paso con el dorso del
dedo, con las manos sucias.

Los tokens de esta sección viven en un único archivo de variables CSS que
consumen las vistas de `ui/`. Ningún componente escribe un color literal: si un
valor aparece dos veces, es un token que falta.

## 8. Manejo de errores

- **Un `.md` malformado nunca puede romper la app.** Requisito duro, no caso
  borde: las recetas se editan desde Drive y desde Claude. Si el frontmatter no
  parsea, la receta se indexa con lo que se pueda rescatar y se muestra como
  texto plano con un aviso.
- **Sin red:** las escrituras quedan encoladas y se reintentan; el arranque
  falla con un mensaje y un botón para reintentar.
- **Token caído:** renovación silenciosa; si falla, el índice sigue navegable en
  solo lectura y se ofrece re-login.
- **Conflicto de edición:** antes de escribir un `.md` se compara su
  `modifiedTime` con el que se tenía. Si cambió, no se pisa: se muestran las dos
  versiones.
- **Índice corrupto, `schemaVersion` viejo o `reconstruccion_en_curso` marcado:**
  reconstrucción con progreso (§5.3).
- **Dos planillas `_indice`:** se usa la más reciente y se avisa. La app nunca
  crea una si la búsqueda falló (§5.1).
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

## 10. Interfaz conversacional

**No hay que construir nada.** Al ser las recetas archivos `.md` en Drive, el
conector de Google Drive de Claude las lee tal cual desde la app de Android, y
la búsqueda full-text de Drive cubre las consultas por contenido. Sin skill, sin
MCP, sin hosting.

Esto además resuelve la captura de recetas desde la web, que de otro modo sería
un problema: una PWA no puede descargar una página arbitraria por CORS, y un
proxy implicaría infraestructura. Pedirle a Claude que convierta una URL en una
receta guardada en Drive es el camino sin infra, y el índice se entera por la
Changes API en el próximo arranque.

**El input principal del recetario son estas sesiones, no el editor de la app.**
La forma esperada de sumar contenido es pasarle una fuente a un agente —un PDF,
la foto de un libro, un video, un sitio— y pedirle que extraiga la receta y la
guarde en la carpeta. Por eso el `.md` es el formato: es lo bastante flexible
para que lo escriba cualquier cosa. El editor de la app (§7.2) existe para
corregir lo que quedó mal, no para componer.

Falta definir el skill que hace ese trabajo: su validador, su corrector y el
contrato con la app. El contrato mínimo ya se puede anticipar — escribir un
`.md` que cumpla el esquema del §3.2, dejarlo en la raíz si no se decide la
categoría, y marcarlo con el tag `incompleto` si algo quedó a medias.

## 11. Alcance de v1

Dentro:

- Autenticarse con Google y descubrir la carpeta y sus categorías.
- Construir, sincronizar y reconstruir el índice (§5).
- Buscar y filtrar por categoría, tags e ingredientes.
- Ver la receta con los pasos marcables (§7.2).
- Editar recetas, incluido moverlas de categoría (§7.2).
- Crear una receta nueva, mínima: frontmatter y tag `incompleto` (§7.2).
- Borrar una receta.
- Reconstruir el índice a mano después de editar por fuera (§5.3).

Fuera, inventariado, cada uno con lo que le falta para entrar:

- **Planificador semanal y lista de compras.** Es lo próximo. Falta diseñar sus
  vistas y la barra de navegación inferior que hoy el §7.2 no tiene justamente
  porque esto no existe. No modifica nada del núcleo: se apoya en el índice.
- **Escalado de porciones.** El parseo de la línea de ingrediente ya queda hecho
  en `recipe.js`; falta decidir la interfaz.
- **Importar desde una URL dentro de la app.** No se va a hacer: una PWA no puede
  descargar una página ajena por CORS, y un proxy sería infraestructura. Lo
  cubre Claude (§10).
- **OCR de fotos de libros.** Trabajo de agente, no de la app.
- **Compartir con otras personas.** Cambia el modelo de permisos entero.
- **Funcionar sin conexión.** El índice ya se guarda en IndexedDB; falta usarlo
  para renderizar antes de la red, y decidir qué hacer con las recetas que no se
  abrieron nunca. Cuando cocinar sin señal deje de ser hipotético.

Cerrado, no vuelve a evaluarse:

- **Journal de deltas y partición del índice.** Existían para evitar reescribir
  el índice completo en cada edición, que es un problema que la planilla no
  tiene: la escritura por fila quedó verificada contra la API real.

