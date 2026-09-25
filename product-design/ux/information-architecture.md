# Recetario — Arquitectura de Información

**Versión:** 2.0
**Estado:** Vigente — describe el producto como está implementado en `src/`

---

## Sobre este documento

Define cómo se organiza el producto: qué formato tiene el archivo de receta, qué
entidades existen y cómo viven, qué pantallas hay y cómo se conectan.

Si este documento y el código de `src/` se contradicen, gana el código.

---

## 1. Benchmark de formatos y esquema del `.md`

El formato del archivo es la representación de la entidad Receta: determina qué
puede mostrar la UI, qué se puede filtrar y qué puede generar una lista de
compras. Se decide antes que nada.

### 1.1 Criterios, en orden

1. **¿Sigue siendo legible y editable a mano?** Es la premisa del producto (J8).
2. **¿Un agente lo escribe sin ambigüedad?** Es la ruta de entrada real.
3. **¿Alcanza para lo que la UI necesita mostrar y filtrar?** Sobre todo J4.
4. **¿Alcanza para generar una lista de compras?**
5. **¿Hay parsers que ya lo lean?**

### 1.2 El formato

**Frontmatter YAML de claves cerradas + cuerpo en markdown libre.** El archivo se
lee y se edita a mano en cualquier editor, un agente lo escribe sin ambigüedad,
y cualquier parser de markdown lo entiende. El frontmatter lleva lo que la UI
muestra y filtra; el cuerpo es prosa con cuatro secciones conocidas (§1.5).

### 1.3 El hallazgo que decide

**J4 no necesita cantidades estructuradas: necesita saber cuál es el nombre del
ingrediente.** Buscar "berenjena" entre mil recetas exige distinguir un
ingrediente de una mención al pasar en una nota, no saber cuántos gramos son.

Y la lista de compras **degrada con gracia**: si los ingredientes están
estructurados suma y agrupa; si no, es un recordatorio. Eso saca al criterio 4
de la posición de requisito duro y lo alinea con el principio 3.

Con eso, el problema se reduce a **una sola regla**: que en cada ítem de la lista
de ingredientes se pueda separar la cantidad del nombre.

### 1.4 Decisión

**El cuerpo tiene una única convención: el ítem de ingrediente es `nombre` +
`separador` + `cantidad`.** El nombre va primero, y lo que viene después del
separador es la cantidad, en texto libre.

**Los separadores son cinco:** `-`, `—`, `;`, `,` y `|`. Manda **el primero que
aparezca** en el ítem.

```markdown
## Ingredientes
### Para la milanesa
- Milanesas de nalga — 4
- Muzzarella | 200 g
- Provenzal, 1 cucharada
- Sal y pimienta
```

**La coma tiene una regla propia: solo separa si lo que sigue empieza con un
dígito.** Sin eso, `Sal, pimienta` daría el ingrediente "Sal" con cantidad
"pimienta", y `Orégano, pimentón, comino, etc` sería peor. Con la regla, esos dos
quedan como ingredientes sin cantidad, que es lo correcto, y
`Provenzal, 1 cucharada` funciona.

**Un ítem sin separador es un ingrediente sin cantidad**, y es válido: el nombre
es la línea entera. Un ítem que no tenga nada reconocible no rompe nada: se
muestra tal cual y no entra al filtro.

**Por qué el nombre primero:** es como están escritas las recetas que existen
—`Anchoítas — 18-20 medianas`, `Provenzal, 1 cucharada`—. La convención se ajusta
al contenido, que es lo que pide el principio 3: la app lee lo que llega.

**Consecuencia para J4:** el nombre del ingrediente queda al principio del ítem,
que es donde una búsqueda por prefijo lo encuentra primero. La cantidad se separa
para la lista de compras.

### 1.5 El esquema

````markdown
---
titulo: Milanesas napolitanas
tags: [favorito, italiana, horno, invitados]
rinde: 4 porciones
tiempo: ~60 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
foto: foto:2
---

Un clásico de los domingos en casa.

## Ingredientes
### Para la milanesa
- Milanesas de nalga — 4
- Muzzarella — 200 g

## Preparación
1. Precalentar el horno a 200 °C.
2. Hornear 15 minutos.

## Variaciones
### A la suiza
*fuente: Libro de cocina de …*

Cambiar la salsa y la muzzarella por salsa blanca y gruyere.

## Notas
- El horno de casa calienta de más: bajar a 180 °C.

## Fotos
- 1: https://drive.google.com/file/d/1AbC…/view
- 2: https://ejemplo.com/milanesas.jpg
````

**Frontmatter.** Siete claves, todas opcionales menos `titulo`. El esquema es
cerrado: una clave que no es de estas siete no se interpreta, y se conserva al
guardar.

| clave | tipo | obligatorio | notas |
|---|---|---|---|
| `titulo` | texto | **sí** | Sin él la receta no se muestra |
| `tags` | lista | no | Vocabulario libre, más los cuatro tags especiales (§1.6 y §5.2) |
| `rinde` | texto | no | Libre, no un número |
| `tiempo` | enumerado | no | La duración hasta comer, con reposo y horno: `~15 min` · `~30 min` · `~60 min` · `>60 min` · `>1 día`. Cualquier otro texto se lee como sin duración |
| `dificultad` | enumerado | no | `fácil` · `media` · `difícil`. Otro valor se lee como sin dificultad |
| `fuente` | texto | no | **Texto libre:** URL o *"libro de pescados, pág. 84"* |
| `foto` | URL o `foto:N` | no | La cabecera: una URL externa, o una foto del depósito. Ver §1.7 |

**Cuerpo.** Cuatro secciones conocidas, todas opcionales: `## Ingredientes`
—con subtítulos `###` como grupos—, `## Preparación`, `## Variaciones` y
`## Notas`, más **`## Fotos`, que es el depósito de fotos y no texto** (§1.7).
Cualquier otra sección se muestra tal cual y no se interpreta.

**`## Preparación` también puede traer `###`**, y en el
contenido real los trae: el libro de pescados divide la preparación en "Para el
melón", "Para la vinagreta", "Final y presentación". Se muestran como subtítulos
y la numeración de los pasos vuelve a empezar en cada uno, tal como está escrita.

### 1.6 Completitud

**La completitud es el tag especial `borrador`**, en la lista `tags` del
archivo. No hay clave propia en el frontmatter ni columna en el índice, y la app
nunca la deduce del contenido: una receta es un borrador si lleva el tag, y
terminada si no lo lleva. Lo que falta terminar es eso: una receta con el tag, y
no una entidad aparte.

Terminar una receta es un juicio del usuario, no una propiedad del texto: hay
recetas escritas enteras que todavía no están buenas, y recetas de tres líneas
que sí. Es una declaración, y es del usuario, no del agente — la única excepción
del principio 3.

**Se pone y se saca con su botón en el campo «Tags» del editor**, igual que los
otros tres especiales. Una receta nueva nace con el tag puesto. El contenido sólo
decide **cuándo se puede sacar**: hace falta título, categoría, al menos un
ingrediente y al menos un paso. Esa condición no filtra, no corrige y no escribe
nada por su cuenta. Como la categoría es parte de la condición, **una receta
sin categoría es siempre un borrador**.

Un `.md` escrito afuera sin categoría —en `_sin-categoria/` o suelto en la
carpeta base— y sin el tag no cumple esa regla, y
**no se encuentra de ninguna forma**: no está en Borradores ni en ninguna otra
lista, ni en la búsqueda, ni en el conteo de tags. Sólo lo nombra el aviso de
*Ajustes → Avisos* después de reindexar (§4.7), con el nombre del archivo.

### 1.7 Las fotos

Una receta tiene un **depósito de fotos**: la del plato, la de un paso, la de
cómo tiene que quedar la masa. Vive en la sección `## Fotos` del cuerpo, una
línea por foto, y no suma ninguna clave al frontmatter.

```md
## Fotos
- 1: https://drive.google.com/file/d/1AbC…/view
- 2: https://ejemplo.com/pan.jpg
```

- **El número es la identidad de la foto**, y es estable: una nueva toma el más
  alto más uno, ninguno se reusa, y puede haber huecos. El orden de las líneas
  es el del carrusel.
- **La URL es un archivo de Drive o una externa.** La de Drive es
  `https://drive.google.com/file/d/<id>`, con `/view`, `/edit`, `/preview` o
  nada al final y con la query que traiga (`?usp=sharing`): es el único
  formato que la app reconoce como tal, y se pide con el token. La app la
  escribe con `/view`. La externa va a un `<img>` directo.
- **Si alguna línea no tiene esa forma, la sección entera se lee como una
  sección ajena** y se conserva tal cual: la receta queda sin depósito y nada se
  pierde por pasar por el editor. Sin fotos, la sección no se escribe.
- **La sección va última en el archivo**, después de las secciones ajenas. En
  pantalla, en cambio, las fotos que no son la cabecera ni están nombradas en
  el texto se dibujan como un carrusel en la primera ficha
  (`E03-LeerYCocinar.md` C03.5.2): las demás ya se ven donde van. En el PDF
  esas mismas forman la galería, al final, después de Notas y antes de las
  secciones ajenas.

**El texto nombra una foto con `![epígrafe](foto:N)`**, en cualquier sección, y
la cabecera acepta `foto: foto:N` además de una URL. **Antes de dibujarse, la
receta se resuelve:** cada `foto:N` se cambia por la URL de su línea, y una
referencia a un número que no está en el depósito se borra. Así la lectura, la
cocina, el texto y el PDF sólo ven URLs.

**Dónde viven los archivos.** Las fotos que sube la app van a **`_fotos/`**, en
la carpeta base, al lado de `_sin-categoria/`: se crea con la primera foto y su id
queda en `meta` como `carpeta_fotos`. El `_` la deja fuera de las categorías y
del reindexado. El nombre es el del `.md` con el número —`pan-de-campo-3.jpg`—,
sólo para que en Drive se lean juntas. Cambiar la receta de categoría no las
mueve: el link es por id. **La app sólo manda a la papelera fotos que están en
`_fotos/`**; un link pegado a mano que apunta a otra carpeta se saca del
depósito y el archivo no se toca.

**Se muestran pidiéndolas a Drive con el token** y quedan en Cache Storage por
id de archivo, sin vencimiento. La pantalla no las espera: cada una se dibuja
como un recuadro del mismo tamaño y se completa cuando llega.

**El diseño las contempla y no depende de ninguna.** Una receta sin foto se
dibuja completa igual: su lugar en las listas lo ocupa la foto de su categoría.

### 1.8 Variaciones y versiones del mismo plato

Un plato con varias recetas de fuentes distintas **no se repite N veces**: hay
una receta y las demás cuelgan de ella como variaciones.

`## Variaciones` es texto libre: cada `###` adentro es una versión con nombre, y
**puede llevar su propia `fuente`** en una línea en itálica al empezar. Lo que
sigue se muestra como está escrito; no tiene la estructura de ingredientes y
pasos de la receta.

**Una variación también puede ser un simple bullet**, y
en el contenido real casi siempre lo es: *"- Pasar por harina directamente, sin
usar huevo."* Cuando `## Variaciones` trae una lista en vez de secciones, se
muestra como lista. No se fuerza la estructura sobre lo que ya está escrito.

**Por qué dentro del archivo y no en archivos vinculados:** un vínculo entre
`.md` obliga a que el archivo sepa dónde vive el otro, y eso se rompe en cuanto
alguien mueve o renombra algo en Drive — que es precisamente lo que el producto
promete que se puede hacer. Dentro del archivo, la receta sigue siendo
autocontenida y legible sola (J8).

**Consecuencia para J4:** la búsqueda por ingrediente mira sólo `## Ingredientes`.
Lo que nombra una variación no se busca: no tiene estructura, y darle una
obligaría a un modelo de versiones que el formato no aguanta sin dejar de ser
legible.

---

## 2. Entidades y ciclo de vida

| Entidad | Dónde vive | Nace | Muere |
|---|---|---|---|
| **Carpeta base** | Una carpeta propia del Drive, marcada con `appProperties` `recetario=raiz` | Al crearla o elegirla en el primer arranque | Al elegir otra desde Ajustes: pierde la marca y queda en Drive como estaba |
| **Receta** | Un `.md` en una carpeta de categoría, o en `_sin-categoria/` si no tiene categoría | Al guardar una receta nueva —escrita en el editor, compartida o pegada—, o cuando un agente la escribe directo | Al borrarla desde el editor: va a la papelera de Drive |
| **Borrador** | Una receta con el tag `borrador` (§1.6): el mismo `.md` y la misma fila | Con la receta: toda receta nueva nace borrador. También lo son las de una categoría borrada, que pasan a `_sin-categoria/` con el tag | Cuando se le saca el tag, o con la receta |
| **Foto de receta** | Una línea de la sección `## Fotos` del `.md` (§1.7). El archivo, si lo subió la app, es un `.jpg` en `_fotos/`; si no, es una URL externa | Al agregarla en el editor —también la que llega por Compartir—, o escrita a mano en el `.md` | Al sacarla del depósito, o con su receta: el archivo de `_fotos/` va a la papelera de Drive. Borrar la categoría de la receta no la toca: la receta sigue y la nombra por su id |
| **Categoría** | Una carpeta dentro de la carpeta base, con su color y su foto en `appProperties`, y su fila en la hoja `categorias` del índice | En el setup de la carpeta base —las 16 predefinidas—, o al crearla desde *Ajustes → Recetario → Categorías* | Al borrarla desde ahí: la carpeta vacía, su fila y su foto propia van a la papelera de Drive. Sus recetas no: pasan a `_sin-categoria/` con el tag `borrador` |
| **Tag** | La lista `tags` del frontmatter | Al escribirlo, o al apretar el botón de un especial | Cuando ninguna receta lo usa |
| **Fuente** | Frontmatter, o línea en itálica en una variación | Con la receta | Con ella |
| **Variación** | Sección `###` o bullet bajo `## Variaciones` | Al escribirla | Al borrarla |
| **Índice** | Google Sheet `_indice` en la carpeta base, con tres hojas: `recetas`, `meta` y `categorias` | Al primer arranque, o al reindexar | Se puede borrar en cualquier momento: se reconstruye |
| **Copia local del índice** | `localStorage` del navegador | Al cargar o reindexar; cada escritura la deja al día | Con *Borrar datos locales* o *Salir*, o cuando deja de coincidir con `_indice` |
| **Imágenes guardadas** | Cache Storage del navegador: `recetario-imagenes`, por id de archivo | La primera vez que se muestra una foto de Drive, o al subirla —entra con el blob que ya está en memoria—; también por precarga en segundo plano | Con *Borrar datos locales* o *Salir*, o al mandar esa foto a la papelera. Un id de Drive no cambia de contenido: no vence |
| **Receta compartida** | En ningún lado: un PDF, un texto o un link que lleva la receta comprimida en el fragmento | Al compartir | Es una copia del momento; nada queda publicado en Drive |
| **Plan de la semana** | **`_plan.md`** en la carpeta base, al lado de `_indice` | Al primer cambio, si el archivo no existía | Con *Reiniciar el plan*, que lo deja vacío. El archivo queda |
| **Lista de compras** | En ningún lado: se arma al entrar, desde el plan y los `.md` de sus recetas | Al abrirla | Al salir de la pantalla |

### 2.1 Las reglas del modelo

**La carpeta base se encuentra por su marca, no por su nombre ni por un id
escrito en el código.** Si no hay ninguna carpeta marcada —o hay más de una—, la
app ofrece crearla o elegir una que ya exista; **no lista las carpetas del
usuario**. Todo lo demás —categorías, `_sin-categoria/`, `_fotos/`, `_indice`—
vive adentro.

**Una receta vive en exactamente una carpeta.** La carpeta dice *dónde está el
archivo*. Los tags dicen *cómo se lo encuentra*, y son varios. La navegación
puede cruzar criterios; no está atada al árbol de carpetas. El frontmatter no
lleva la categoría: el nombre de la categoría de una receta sale de su carpeta.

**Lo que no tiene categoría vive en `_sin-categoria/`**, al lado de las
categorías: se crea la primera vez que hace falta, como `_fotos/`, y su id queda
en `meta`. No es una categoría —no tiene color ni foto, no está en la hoja
`categorias` ni se gestiona desde Ajustes—, pero sus recetas sí están en el
índice. **La app no escribe recetas sueltas en la carpeta base**: un `.md`
suelto ahí, escrito afuera, se lee sin categoría, guardarlo lo deja donde está y
elegirle una categoría lo mueve. Lo de `_sin-categoria/` y lo suelto se lista
como **Sin categoría**.

**La categoría es la carpeta, y su color y su foto son propiedades de la
carpeta** (`appProperties` `color` y `foto`). La foto es `catalogo:<clave>`, una
de las imágenes de `src/categorias/`, o `drive:<id>`, una propia subida a
`_fotos/` con el mismo mecanismo que las de las recetas. Las 16 predefinidas
—nombre, color y foto— están en `src/categorias.ts`; la app no guarda el id de
ninguna. Todas se tratan igual, predefinidas o no. Una carpeta creada a mano en
Drive aparece al reindexar; sin foto se dibuja con su color, y sin color con el
neutro.

**Un borrador es una receta.** Tiene el formato, el editor, la fila del índice
y el depósito de fotos de cualquier receta; lo que lo distingue es el tag
`borrador` (§1.6). Sin categoría vive en `_sin-categoria/`; con categoría, en
ella. Borradores es la lista por tag de `borrador`.

**El plan es un solo archivo y no está en el índice.** `_plan.md` vive en la
carpeta base, al lado de `_indice`, y se lo busca por nombre la primera vez que
se abre el plan en la sesión. Es texto plano —un `## <Día>` por día con algo
cargado, y una línea `- <Momento>: [título](drive:<fileId>)` por receta—, sin
frontmatter y sin fechas. `_indice` no cambia por él: ni hoja ni columna. Como
`_fotos/`, el `_` lo deja fuera de las categorías y del reindexado. **La
lista de compras no se guarda en ningún lado:** deriva del plan cada vez.

**Una receta se identifica por su `fileId` de Drive.** Ni la ruta ni el nombre
del archivo son identidad: cambiar la categoría mueve el archivo entre carpetas y
editar el título no lo renombra.

**Escribir una receta es escribir el `.md` y su fila, juntos.** Ver §2.2.

### 2.2 Un solo camino de escritura

El formato tiene una sola implementación y la escritura un solo camino: el
store de la app.

| Operación | Qué hace | Dónde vive |
|---|---|---|
| **Crear y guardar una receta** | Sube a `_fotos/` las fotos nuevas, escribe el `.md` y escribe o reemplaza su fila del índice, y recién después manda a la papelera las que se sacaron | `src/store.ts` |
| **Leer y parsear un `.md`** | Aplica el esquema: lo ausente llega vacío, y un `tiempo` o una `dificultad` fuera de sus valores se lee como sin dato | `src/recipe.ts` |

Así no hay dos implementaciones del mismo formato que se separen con el tiempo.

**El agente no corre este código: entrega la receta por la app.** El
conector de Google Drive de claude.ai crea archivos pero no escribe planillas:
un `.md` que deja en Drive aparece recién al reindexar. El camino sin ese paso es
que el agente devuelva el `.md` y el usuario lo comparta o lo pegue en el
editor (*Convertir con Agente*, `user-flows.md` F2): ahí guarda la app, por el mismo
camino que cualquier receta. Rehacer el skill del agente sobre esa base está pendiente
(`../../BACKLOG.md`, P14).

### 2.3 Dos escritores sobre el mismo índice

La app escribe la planilla, y un agente puede dejar `.md` en Drive en otro
momento. Con un solo usuario y sesiones que no se solapan, el riesgo
de colisión es bajo, y el principio 1 lo cubre: si una fila queda mal, el índice
se reconstruye desde los `.md`, que son la verdad.

No se agrega ningún mecanismo de bloqueo, tampoco entre dos pestañas de la app:
dos reindexados solapados dejan cada receta dos veces, y la salida es reindexar
una vez con una sola pestaña abierta. La reparación siempre es reindexar, desde
*Ajustes → Índice* (principio 4).

### 2.4 Qué guarda el índice

**La fila de una receta es completa.** Id y nombre del archivo, título,
categoría y id de su carpeta, rinde, tiempo, dificultad, fuente, tags, **la lista
de nombres de ingredientes**, fecha de modificación y foto —la cabecera ya
resuelta a su URL, para que las listas la dibujen sin leer el `.md`—. Los tags
especiales —la completitud incluida— van en la columna `tags`, sin columna
propia.

Los ingredientes están ahí porque la búsqueda de J4 tiene que resolverse sin leer
mil `.md`. Se guardan **tal como están escritos en la receta**, sin normalizar:
cualquier normalización que la app y el agente tuvieran que replicar es una
fuente de divergencia.

Una fila más gorda es barata: la escritura por fila ronda los 200 B y es
exactamente para lo que el índice es una planilla.

**Las otras dos hojas:**

| Hoja | Qué guarda |
|---|---|
| `meta` | La versión del esquema, cuándo fue el último reindexado, si hay uno a medias, si la carpeta fue reemplazada por otra, y los ids de `_fotos/` y `_sin-categoria/` |
| `categorias` | Una fila por carpeta de categoría: id, nombre, color y foto |

**La fila se escribe en el momento**, sin cola ni demora: guardar termina cuando
el `.md` y su fila están escritos. **Si la versión del esquema de `meta` no es la
del código, la app reindexa sola al abrir.**

### 2.5 La copia local del índice

El índice entero —recetas y categorías— se guarda en `localStorage`.
Al abrir, la app pide la fecha de modificación de `_indice`: si coincide con la
de la copia, usa la copia y no lee Sheets; si no, baja la planilla. Cada
escritura de la app deja la copia al día. La premisa es que nunca hay escritura
concurrente.

**No sirve para abrir sin red:** la consulta a Drive va antes que la copia, y sin
esa respuesta no se dibuja nada. *Ajustes → Archivos locales → Borrar datos
locales* la descarta —con las imágenes guardadas en Cache Storage—; *Registro de
actividad* dice si se usó.

---

## 3. Inventario de pantallas

El hash es el único estado de navegación (`src/ui/router.ts`). Un hash que no
se reconoce abre el Recetario.

| Pantalla | Ruta | Propósito | Contexto | Jobs |
|---|---|---|---|---|
| **Recetario** | `#/` | Punto de entrada. Búsqueda arriba, el carrusel de tags, y las categorías abajo, en orden alfabético. Lo que no tiene categoría no tiene tile: es borrador, y se llega por *Borradores*. | Recuperar | J1, J5 |
| **Resultados** | `#/buscar?q=` | Lo que devuelve la búsqueda, agrupado por título, ingrediente y tag. Se ordena A–Z o por duración dentro de cada grupo. | Recuperar | J1, J4 |
| **Categoría** | `#/c/<nombre>` | Las recetas de una carpeta, con el carrusel de tags, la fila de duraciones y el conmutador de orden. | Recuperar | J5 |
| **Lista por tag** | `#/t/<tag>` | Las recetas del recetario entero con ese tag. Se llega tocando un chip del carrusel del Recetario. Mismos filtros que la categoría. | Recuperar | J5 |
| **Receta** | `#/r/<id>` | La receta entera, en una columna de fichas: la cabecera arriba, cada foto donde el texto la nombra y, en un carrusel en la primera ficha, las que no están en ningún otro lado —tocar una abre el visor—. En el encabezado, la estrella de favorito, Compartir y el link al `.md` en Drive; al pie, *Cocinar* —si hay ingredientes o pasos— y *Editar*. | Recuperar | J6 |
| **Modo cocina** | `#/r/<id>/cocinar` | Letra grande, conmutador Ingredientes / Pasos, el paso actual realzado, y la pantalla encendida. | Cocinar | J6 |
| **Editor** | `#/r/<id>/editar` | El único formulario de la app. Corregir un error, anotar una variación, poner y sacar los tags especiales, agregar fotos y ponerlas en el texto, cambiar la categoría, *Pegar*, *Convertir con Agente* mientras es borrador, borrar la receta. Con `?recibida=1` abre con la receta `.md` compartida aplicada como *Pegar*. | Cocinar | J3, J7 |
| **Nueva receta** | `#/nueva` | El mismo editor, vacío, en «Sin categoría» y con `borrador`. Es destino del menú: hamburguesa en vez de volver. Con `?url=&text=&fotos=` abre con lo que llegó por el Share Target —`fotos` es cuántas dejó el service worker en su caché—; con `?recibida=1`, con la receta `.md` que llegó compartida sin un `id:` que exista. | Archivar | J2, J3, J7 |
| **Borradores** | `#/borradores` | La lista por tag de `borrador`, como destino del menú: hamburguesa en vez de volver, y el título «Borradores». Es el único camino a los borradores —ninguna otra lista, búsqueda ni conteo los muestra—, y tocar uno abre su editor. | Archivar | J2, J3 |
| **Ajustes** | `#/ajustes` | Seis fichas, en este orden: Cuenta, Recetario, Índice, Archivos locales, Avisos y Registro de actividad. Ver §4.7. | Transversal | — |
| **Categorías** | `#/categorias` | La lista de categorías con cuántas recetas tiene cada una, y *+ Nueva*. | Transversal | — |
| **Editar categoría** | `#/categorias/<id>` · `#/categorias/nueva` | Nombre, color y foto de una categoría —del catálogo o una propia, con *Subir foto*—, y *Borrar categoría*. | Transversal | — |
| **Carpeta base** | `#/carpeta` · `#/carpeta?cambiando=1` | Crear la carpeta, o elegir una que ya exista con el Picker de Google. **No lista nada del Drive.** Aparece sola cuando no hay una carpeta marcada, o hay más de una; con `cambiando=1` se llega desde *Ajustes → Recetario → Cambiar carpeta*. | Transversal | — |
| **Conexión** | *(sin ruta: es el arranque)* | Primer arranque y consentimiento de Google. El índice que se crea o se reindexa al arrancar muestra su barra en el velo, encima (`E05-Cimientos.md` R8). | Transversal | — |
| **Vista de invitado** | `#/ver?r=<receta>` · `#/ver/cocinar?r=<receta>` | La receta que viaja en un link compartido, sin login: se lee y se cocina, y nada más. No muestra tags, y de las fotos sólo las externas: las de Drive no viajan. | Compartir | — |
| **Plan de la semana** | `#/plan` | Siete días desde hoy, dos comidas cada uno, y cada comida una lista de recetas. Al pie, la lista de compras y reiniciar. | Planificar | J9 |
| **Agregar al plan** | `#/plan/agregar?dia=&momento=` | La búsqueda del Recetario, el bloque *Menú diario* y la grilla de las categorías: tocar una receta la suma a esa comida y vuelve. | Planificar | J9 |
| **Lista de compras** | `#/plan/compras` | Los ingredientes de todo lo cargado, en dos bloques, y compartir como texto. | Planificar | J9 |

**La ficha de compartir no es una pantalla**: es estado de la Receta, se abre al
pie y el atrás la cierra (§4.6).

**La vista de invitado es una entrada aparte.** `src/inicio.ts` mira el hash antes
de cargar nada: un `#/ver…` carga sólo `src/invitado.ts`, sin token ni store, con
una lista cerrada de acciones —cocinar, volver, conmutar, marcar un paso, la
pantalla encendida, abrir y cerrar el visor, y las flechas del carrusel—. Lo que se agregue a la Receta no
aparece ahí sin querer.

**El Share Target llega por `POST`** a `/recetario/compartir`, y lo atiende el
service worker: guarda las fotos en su caché `recetario-compartido` y redirige a
`#/nueva` con `url`, `text` y cuántas fotos llegaron. Una instalación vieja
manda por `GET`, en la query antes del `#`, y la app pasa `url` y `text` a
`#/nueva`. El título de la página compartida no viaja: el de la receta lo
escribe el usuario, o queda el de la fecha.

---

## 4. Modelo de navegación

### 4.1 Dos lugares primarios

**Recetario** y **Borradores**. Nada más.

Son los dos contextos principales y tienen lógicas incompatibles: uno
es un archivo consolidado que se consulta, el otro es una cola de trabajo que se
vacía. Meterlos en el mismo lugar obliga a uno de los dos a comportarse como el
otro.

**Ajustes** es secundario, y se llega desde el menú lateral, como los otros dos.

**El plan de la semana** se alcanza desde el menú lateral, como Ajustes, y no es
uno de los dos lugares primarios: es una entrada sola, que es lo que el
principio 6 pide para que sacarlo cueste borrar una línea. El Recetario no lo
nombra y la receta abierta tampoco.

**Capturar no es un lugar.** Lo compartido entra por el Share Target del sistema
operativo, desde la app donde estabas, y abre el editor de una receta nueva. No
hay botón de "capturar" en la navegación porque en el momento en que se captura,
Recetario no está abierto. A mano, se crea con *Nueva receta*, en el menú.

### 4.2 El punto de entrada es el Recetario

Siempre, aunque Borradores tenga borradores esperando. Abrir en Borradores te
pone adelante una cola de trabajo cuando lo que ibas a hacer era buscar una
receta.

Para que Borradores no reproduzca el limbo adentro del producto, **su entrada de
navegación lleva un contador** de cuántos borradores esperan. Es un aviso sin
acción asociada, así que no interrumpe (principio 4).

### 4.3 Profundidad

**Dos toques para lo frecuente, tres como máximo.**

| Destino | Toques | Camino |
|---|---|---|
| Una receta que sé cómo se llama | 2 | Recetario → escribir → tocar el resultado |
| Recetas con un ingrediente | 2 | Recetario → escribir el ingrediente → resultados |
| Pasear una categoría | 2 | Recetario → categoría → receta *(3 hasta la receta)* |
| Las recetas de un tag | 1 | Recetario → chip del carrusel |
| Marcar una favorita | 1 | Receta → estrella |
| Compartir una receta | 2 | Receta → Compartir → PDF, Link o Texto |
| Un borrador | 2 | Menú → Borradores → su editor |
| Corregir la receta que estoy leyendo | 1 | Receta → editar |
| El plan de la semana | 2 | Menú → Plan de la semana |
| Cargar una receta en una comida | 4 | Plan → `+` → elegir la receta |
| La lista de compras | 3 | Menú → Plan → Lista de compras |
| Reindexar | 3 | Menú → Ajustes → Reindexar |
| Gestionar categorías | 3 | Menú → Ajustes → Categorías |

Nada frecuente queda a más de dos. Ajustes está a tres a propósito.

### 4.4 La búsqueda es lo principal

Es el control más importante de la pantalla principal y no está escondido detrás
de un ícono: se ve, ocupa lugar, y es lo primero. Sirve a J1 —el job más
frecuente— y a J4.

Busca en el **título**, en los **ingredientes** y en los **tags**. No busca en
el cuerpo entero: eso es lo que hace el buscador de Drive y es exactamente lo que
trae ruido.

### 4.5 Volver

El botón de volver es un control de tamaño normal, no un chevron chico. El gesto
del sistema —swipe en Android, back del navegador— funciona igual y es el camino
que la mayoría va a usar; el botón es el respaldo visible.

**El volver es para las pantallas a las que se entra desde otra.** A las que se
alcanzan desde el menú —Recetario, Borradores, el plan de la semana, la receta
nueva y Ajustes— se sale por el menú, así que su encabezado lo abre:
hamburguesa, no volver. Editar una receta existente se abre desde la receta y
lleva volver.

**Volver nunca sale de la app.** La app lleva la cuenta de cuántas pantallas
suyas hay atrás; si no hay ninguna —se entró por un link directo, o por el menú
Compartir—, volver pone el Recetario en su lugar —desde la cocina, la receta—
en vez de irse a lo que había antes. Las salidas que no son un
volver simple —guardar, borrar, salir de la cocina, elegir en *Agregar al
plan*— tienen su destino escrito en `E04-Corregir.md` C04.1.2,
`E03-LeerYCocinar.md` C03.2.1 y `E06-Planificar.md` C06.2.1.

**Todos los encabezados quedan fijos arriba al bajar**, también el del modo
cocina y la caja de los resultados: el volver, la hamburguesa y las acciones de
la pantalla están siempre a mano.

**Cada pantalla nueva abre desde arriba**, y la de antes se queda como está
—con su scroll y sus fotos— hasta que la nueva está dibujada: mientras se lee
la receta tocada al fondo de una lista, la lista no salta ni se redibuja.

Sale de la regla de tamaños del principio 7: el tamaño de los controles es una
regla del sistema, no una decisión por pantalla.

### 4.6 Un menú lateral, sin barra inferior

La navegación primaria vive en un **menú lateral** con cinco entradas, cada una
con su nombre y su ícono:

| | |
|---|---|
| **Inicio** | El punto de entrada: la pantalla del Recetario. Se llama *Inicio* porque «Recetario» ya es la marca de arriba del menú |
| **Borradores** | La cola: las recetas con `borrador`, con su contador |
| **Plan de la semana** | La única entrada al plan, con el ícono del calendario |
| **Nueva receta** | Una acción, no un lugar: nunca queda marcada, ni en el editor al que lleva |
| **Ajustes** | Secundario, pero alcanzable desde cualquier parte |

**Al pie del menú va la versión de la app.**

**Qué pantallas son destino del menú está escrito en un solo lugar** (`MENU`,
en `src/ui/router.ts`), junto con la entrada que marca cada una: de ahí salen la
hamburguesa en lugar del volver, el gesto que lo abre y la entrada marcada.

**En el teléfono se despliega desde una hamburguesa**, arriba a la izquierda —del
lado por el que el panel entra—, y se cierra tocando el velo, con el atrás o
eligiendo un destino. **Tocar el destino en el que ya se está** lo cierra y no
navega. La hamburguesa está en las pantallas que se alcanzan desde el menú
(§4.5), que son las mismas donde el gesto lo abre: el botón y el deslizamiento
no se separan. **Abrir y cerrar el menú no redibuja la pantalla:** en la receta nueva
borraría lo escrito. Con cambios sin guardar, tocar un destino hace la pregunta
de salir sin guardar, y el menú se cierra.
**También se abre y se cierra deslizando.** Cerrado, el gesto empieza a 24 px del
borde izquierdo: desde el borde mismo Android lo toma como «atrás». No arranca
sobre un carrusel —el de tags, la fila de duraciones, el de fotos—, que se
desliza en el mismo sentido. **Abierto, la pantalla de atrás no se desplaza:** el velo la tapa,
y moverla sería mover justo lo que está tapado.
**Desde 900 px queda fijo en todas las pantallas** y el contenido se corre: el
mismo ancho en que la grilla de categorías pasa a cuatro columnas. También en
las que no son destino del menú —la receta, la cocina, el editor, los
resultados—, donde no marca ninguna entrada; en el teléfono esas no lo dibujan
(`E05-Cimientos.md` C05.10.1).

**El contador de borradores aparece dos veces**: junto a «Borradores» dentro del
menú, y sobre la hamburguesa cuando está cerrado. Sin eso, con el menú cerrado no
habría manera de saber que hay algo esperando.

**Lo que se abre en la misma pantalla se cierra con el atrás.** Cuatro cosas se
abren sin cambiar de ruta: el menú en el teléfono, el visor de fotos, las fichas
al pie —la de compartir y las de fotos del editor— y la categoría elegida en
*Agregar al plan*. Al abrirse, cada una suma una entrada al historial con el
mismo hash, así el atrás de Android o del navegador la cierra en vez de salir de
la pantalla. Cerrarla de otra forma —el velo, la cruz, el chevron, un destino—
consume esa entrada, y navegar desde ella la saltea: el historial no queda con
entradas de más. Con la app ocupada (`E05-Cimientos.md` R8), ese atrás se
deshace como cualquier otro.

**No hay barra inferior.** El lateral resuelve las cinco entradas sin gastar
pantalla en el teléfono y sin desperdiciar el ancho en escritorio.

**Capturar sigue sin estar en la navegación** (§4.1): entra por el Share Target.
Lo que sí está en el menú es **Nueva receta**: es la única entrada para crear a
mano (`E04-Corregir.md` F04.3b).

### 4.7 Ajustes

Seis fichas, en este orden: lo de la cuenta y el índice primero, lo raro al final.

| Ficha | Qué tiene |
|---|---|
| **Cuenta** | La cuenta conectada y *Salir*, que no borra nada de Drive |
| **Recetario** | La carpeta base en uso con *Cambiar carpeta*, y cuántas categorías hay con el link a *Categorías* |
| **Índice** | Cuándo fue el último reindexado y *Reindexar* |
| **Archivos locales** | *Borrar datos locales*: descarta la copia del índice y las imágenes guardadas, y recarga |
| **Avisos** | Lo que no interrumpe: los `.md` ignorados por no tener título, con su nombre; las recetas sin categoría —en `_sin-categoria/` o sueltas en la carpeta base— sin el tag `borrador`, con su nombre, que el reindexado no toca; y si hay más de una planilla `_indice` o más de un `_plan.md` |
| **Registro de actividad** | Lo que pasó al abrir: cuándo, la fecha de `_indice`, si la copia local coincidió, cuántas recetas y categorías hay, y si se reindexó y por qué |

El reindexado corre con el velo y su barra (`E05-Cimientos.md` R8): mientras
dura, la pantalla entera está tapada y no se toca nada.

---

## 5. La clasificación

### 5.1 Las categorías

El eje es **tipo de plato**, y sirve para pasear, que es para lo que existe. La
app propone **dieciséis predefinidas** —las crea el setup de la carpeta base, con
su color y su foto—, un número que se recorre de un vistazo en una grilla.

**Las categorías son del usuario:** desde *Ajustes → Recetario → Categorías* se
crean, se renombran, se les cambia el color y la foto, y se borran. El color se
elige entre los quince de la paleta más el neutro; la foto, entre las del
catálogo de `src/categorias/` o una propia, con *Subir foto*: se sube a
`_fotos/` al guardar la categoría y la carpeta la nombra `drive:<id>`.

En el Recetario van **en orden alfabético** —la posición es lo que se aprende, y
ordenar por cantidad la movería—, debajo de la búsqueda y del carrusel de tags,
cada una con un badge con cuántas recetas tiene si tiene alguna.

### 5.2 Los tags quedan libres

Vocabulario libre en el frontmatter, sin lista controlada. Nada impide escribir
`rapido` y `rápido` como dos tags distintos, y se acepta: un vocabulario
controlado obliga a mantenerlo y a que el agente lo conozca, y el costo del
desorden es bajo con un solo autor.

**Cuatro tags son especiales: `favorito`, `menú diario`, `probar` y
`borrador`**, siempre en ese orden. Viven en la misma lista `tags` que los
demás, pero tienen forma propia:

- **No se escriben a mano.** Cada uno tiene su botón en el campo «Tags» del
  editor; escribirlos —o `terminado`, que contradice a `borrador`— no se
  acepta. Se reconocen sin importar mayúsculas ni tildes, y también `favorita`,
  `favoritos` y `favoritas`; `borrador` se reconoce además como `borradores` y
  como `incompleta`, `incompleto` y sus plurales, sin reescribir el `.md`.
- **`favorito` además tiene una estrella en el encabezado de la receta**, que lo
  pone y lo saca sin pasar por el editor.
- **`borrador` es la completitud** (§1.6): una receta nueva nace con él.
- **Cada uno tiene su ícono**, y las marcas de los que lleva una receta van juntas
  en la esquina de su tarjeta. `borrador` no: no tiene ícono ni marca, y en la
  receta abierta no aparece; un borrador se ve sólo en Borradores.
- **En el carrusel de tags van primero**; después, los demás por cantidad de
  recetas. **`borrador` no va en ninguna lista de tags**: ni en el carrusel ni
  en las sugerencias del editor. A los borradores se llega por el menú.
- **Las favoritas van primero en toda lista de recetas ordenada A–Z**, y
  alfabético dentro de cada bloque. Ordenada por duración, van mezcladas.

**El carrusel de tags** está en el Recetario y en cada categoría. En la categoría
y en la lista por tag filtra: tocar un chip lo enciende, y varios encendidos
suman condiciones. En el Recetario abre la lista por tag (`#/t/<tag>`), con ese
chip encendido y fijo. **La fila de duraciones** filtra igual por `tiempo`, y el
conmutador *A–Z / Duración* cambia el orden; las dos aparecen sólo si alguna
receta de la lista tiene duración.

### 5.3 Quién elige la carpeta

**El usuario, siempre.** El agente **propone** carpeta y tags al convertir; el
usuario confirma. Es la misma regla que gobierna las variaciones y la
completitud: lo que clasifica es del usuario, lo que transcribe es del agente.
