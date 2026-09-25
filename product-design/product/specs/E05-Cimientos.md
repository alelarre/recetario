# E05 — Cimientos

**Job:** J8 y transversal · **Prioridad:** alta · **Flujos:** F8, F9, F10, F11, F12

---

## La épica

El piso sobre el que se apoyan todas las demás: el esquema del `.md`, la relación
con Drive, el índice como contrato con el agente, y qué hace la app cuando algo
no está como esperaba.

No es infraestructura invisible. **La mitad de esta épica es comportamiento
visible**, porque el stack hace inevitables los estados degradados: la app
depende de la red, de un índice derivado y de archivos que escriben otros.

---

## Reglas transversales

Valen para todas las épicas. Una feature que no diga lo contrario, cumple esto.

### R1 — El manejo de errores es mínimo

Toda operación que puede fallar falla de una sola manera: **un aviso en
castellano, en el lugar donde ocurrió, y un control para reintentar**. No hay
colas de reintento, ni reintento automático, ni recuperación en segundo plano, ni
reconciliación de estados a medias.

- [ ] Ningún error muestra el mensaje crudo de Google.
- [ ] Ningún aviso de error se cierra solo.
- [ ] **Si el control que falló sigue a la vista, ese control es el reintento**, y el aviso no lleva *Reintentar*: un *Guardar*, la `×` del plan o *Traer* se vuelven a tocar. *Reintentar* va cuando no queda a la vista nada que repita la operación —una pantalla que no pudo leer, un arranque que no llegó—.
- [ ] Lo que el usuario escribió sigue en pantalla después del error.
- [ ] **El aviso se trae a la vista.** Un aviso fuera de pantalla no avisa: con la pantalla scrolleada al fondo, el que se dibuja arriba se desplaza hasta verse, y sólo lo justo —si ya estaba a la vista, nada se mueve—.

### R2 — El reintento reescribe todo, porque escribir es idempotente

Guardar una receta son dos escrituras: el `.md` y su fila del índice. Si falla la
segunda, **no se intenta reparar solo esa**: el reintento repite las dos.
Reescribir un `.md` con el mismo contenido y reemplazar una fila existente no
duplican nada.

- [ ] Reintentar un guardado que falló a mitad deja exactamente una fila para esa receta.

### R3 — La sesión vencida se trata como cualquier otro error

Si el token expiró, el aviso dice que hay que conectarse de nuevo y ofrece el
control. Al reconectar, el usuario reintenta la operación **a mano**: la app no
reanuda nada por su cuenta.

- [ ] Lo escrito en el editor sobrevive a la reautenticación.

### R4 — El `.md` gana, y la app no lo verifica

Cuando el índice y el `.md` difieren, la verdad es el `.md`. **La app no
compara, no valida y no autorrepara.** No hay escritura correctiva al abrir una
receta ni al listar. La divergencia se corrige reconstruyendo el índice a mano
desde Ajustes.

- [ ] Abrir una receta cuyo `.md` difiere de su fila no escribe nada.
- [ ] **La única excepción:** abrir una receta cuyo `.md` Drive ya no tiene —contesta que no existe; la papelera no se mira— saca su fila (`E03-LeerYCocinar.md` C03.1.3): no hay nada que comparar, y la fila sólo haría volver a una receta que no se puede abrir.

### R5 — Una receta se identifica por su `fileId` de Drive

La clave de la fila del índice es el `fileId`. Mover el archivo entre carpetas
—cambiar la categoría— y editar el título **no cambian la identidad de la
receta**. El nombre del archivo nunca se deriva del título ni se renombra al
editarlo.

- [ ] Cambiar la categoría de una receta actualiza su fila, no crea una nueva.
- [ ] Cambiar el título deja el archivo con el mismo nombre en Drive.

### R6 — La app no descubre cambios de afuera

Un `.md` o una fila que escribe un agente mientras la app está abierta **no
disparan nada**. No hay polling, ni Changes API, ni refresco al volver del
segundo plano. El cambio se ve la próxima vez que la app abre y lee el índice:
al abrir, la fecha de `_indice` en Drive dice si la copia local sigue valiendo
(C05.4.2). Un `.md` escrito afuera sin su fila aparece recién al reindexar.

- [ ] Un `.md` que el agente deja directo en Drive no aparece en ninguna lista hasta reindexar.

### R7 — Android es la plataforma

El producto se especifica para Android y para navegador de escritorio. **iOS no
se soporta:** no hay Share Target y el Atajo equivalente sale del alcance.

### R8 — La app ocupada no se toca

Mientras la app trabaja en algo que el usuario tiene que esperar, **un velo
cubre la pantalla** (`ux/design-system.md` §6.17b) desde el toque que lo lanza
hasta que termina. Es un solo mecanismo para toda la app, y no uno por
pantalla. Mientras dura, el resultado y el error tienen a dónde llegar: la
pantalla que lanzó la operación sigue siendo la que está.

El velo tiene tres formas, y cada operación usa una sola:

| Forma | Qué muestra | Para qué |
|---|---|---|
| **Escribir** | La olla que se revuelve y, si salió bien, el tilde | Toda escritura en Drive o en Sheets |
| **Esperar** | La olla, sin tilde, **recién a los 250 ms** | Lo que tarda sin escribir nada |
| **Con progreso** | Una tarjeta con el texto y la barra, en lugar de la olla | El reindexado y la preparación de la carpeta base |

- [ ] **Aparece con el toque, no con la escritura:** entre uno y otra puede haber una lectura de Drive —el `.md` de base al guardar una receta, el plan al sumarle una— o un redibujado; todo eso pasa con la pantalla ya tapada. Si después nada llega a escribirse —falta el título—, el velo se saca y queda el aviso.
- [ ] **No se toca:** ningún control responde, ni el gesto del menú lateral.
- [ ] **No se desplaza:** la página de atrás no scrollea mientras el velo está.
- [ ] **No se navega:** un cambio de hash —un link, el volver del encabezado, el gesto de atrás de Android— no dibuja la pantalla nueva, y la URL vuelve a la de la pantalla ocupada. El atrás que cerraría algo abierto en la misma pantalla —el menú, el visor, una ficha— también se deshace (`ux/information-architecture.md` §4.6).
- [ ] **No se repite la acción:** volver a tocar el control no hace nada.
- [ ] **Una operación, un velo.** Con varias fotos de una, o con dos lecturas seguidas —el plan y sus recetas en la lista de compras—, el velo se pone una sola vez para todo: prenderlo y apagarlo entre una y otra se ve como un parpadeo. Una operación que empieza adentro de otra no lo hace parpadear: se va cuando termina la última.
- [ ] **Ningún botón cambia a «Guardando…»**, ni se deshabilita: el velo ya bloquea y dice que se está trabajando. *Convertir con Agente* conserva su ícono.

**Escribir.** Entran todas las escrituras: guardar y crear una receta —también la que llegó por Compartir o pegada—, borrarla, *Convertir con Agente*, crear, editar y borrar una categoría, escribir el plan de la semana —sumarle una receta, sacarle una, reiniciarlo— y crear la carpeta base.

- [ ] **Toda escritura que sale bien cierra con el tilde:** la olla se tapa y se dibuja el tilde, que queda quieto un momento para que se llegue a ver; el cierre dura 1850 ms (§6.17b). Si no se llegó a escribir —falta el título, falló Drive— no hay tilde: el velo se va de una y queda el aviso.
- [ ] **El orden es olla, tilde y recién después la pantalla nueva.** Durante el tilde la app sigue ocupada: no se toca y no se navega. Terminado el tilde se navega, y el velo sigue puesto hasta que la pantalla de destino está pintada, así el repintado no se ve pasar. Si la escritura no lleva a ninguna pantalla nueva, el velo se va solo un momento después.
- [ ] **Convertir con Agente** es una sola operación: el velo cubre guardar, bajar las fotos y abrir el agente, y el tilde va al final.
- [ ] **Guardar una receta deja la guardada en memoria**, nueva o editada: la receta de destino se dibuja sin volver a leer el `.md`.

**Esperar.** Lo que tarda sin escribir, y mientras dura vale lo mismo —no se toca y no se navega—:

- [ ] **Achicar una foto** recién elegida —cámara, galería— o recién llegada por Compartir, en el editor de recetas, y la foto propia de una categoría. Las fotos del editor no llegan a Drive hasta Guardar (F04.3d).
- [ ] **Traer una foto por URL** (`E04-Corregir.md` C04.3d.1b): una sola espera cubre bajarla y achicarla.
- [ ] **Leer las fotos compartidas** que dejó el service worker.
- [ ] **Armar la lista de compras**, que lee el plan y cada receta distinta del plan que todavía no se leyó en la sesión (`E06-Planificar.md` F06.4).
- [ ] **Las lecturas de red al dibujar** la receta, el editor y el plan.
- [ ] Si la espera termina antes de los 250 ms, el velo no llega a verse: sería un parpadeo. Igual bloquea desde el toque.

**Con progreso.** *Ajustes → Reindexar*, el reindexado al arrancar (C05.5.3) y crear o elegir la carpeta base y prepararla (C05.7.4):

- [ ] En lugar de la olla, una tarjeta centrada con el texto —«Reindexando…» o «Preparando la carpeta…»— y la barra de C05.5.2. La barra va adentro del velo, nunca en la pantalla de atrás.
- [ ] Bloquea igual que las otras dos: mientras corre no se navega ni se toca nada.
- [ ] **Si falla**, el velo se va y la pantalla desde la que se lanzó muestra el aviso: *«No se pudo reindexar.»* o *«No se pudo preparar la carpeta.»*. En Ajustes no lleva *Reintentar*: el botón **Reindexar** sigue a la vista y es el reintento (R1). Donde no queda a la vista el control que falló, el aviso lleva **Reintentar**.
- [ ] Preparada la carpeta, la app se recarga con el velo todavía puesto.

**Lo que se espera tiene un corte.** Toda lectura de Drive o de Sheets se corta a
los 20 segundos, y bajar una foto de una URL también. Al cortarse sigue el camino
de error de siempre: el velo se va y la pantalla muestra su aviso o, con la foto
por URL, sigue como si no se hubiera podido bajar. Sin el corte, un servidor que
acepta y calla dejaría la pantalla tapada sin salida, y salir sería recargar,
que en el editor se lleva lo escrito. Las escrituras no se cortan.

**Quedan afuera**, cada una con su propia señal o sin espera de red:

- [ ] **Marcar favorito**, que tiene su estrella animada y no debe trabar la lectura de la receta (`E03-LeerYCocinar.md` C03.1.2b).
- [ ] **Pegar**, **armar el link de compartir** y **mandar al agente desde el aviso** de la receta: no esperan a la red.
- [ ] **Elegir la carpeta en el Picker** y **Conectar de nuevo**: la ventana de Google es la espera, y el velo la taparía desde otra ventana.
- [ ] **Borrar datos locales** y **Salir**, que recargan la página.

---

## Features

### F05.1 — El esquema del `.md`

Frontmatter de siete claves, solo `titulo` obligatorio; cuerpo markdown con cuatro
secciones conocidas y opcionales, más el depósito de fotos. Los ingredientes
llevan el nombre primero y la cantidad después de un separador.

Es lo que permite J4 sin ensuciar el archivo. Definido en
`ux/information-architecture.md` §1.

#### C05.1.1 — Parsear el frontmatter *(J8)*

- [ ] Se leen las siete claves: `titulo`, `tags`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`. La completitud no es una clave: es un tag (F05.3).
- [ ] Una clave ausente se representa como ausente, no como cadena vacía.
- [ ] Una clave desconocida se conserva sin interpretarse.
- [ ] `dificultad` fuera de `fácil` · `media` · `difícil` se muestra tal cual y no se corrige.
- [ ] **`tiempo` es uno de cinco valores:** `~15 min`, `~30 min`, `~60 min`, `>60 min`, `>1 día`. Cuenta el tiempo hasta comer, con reposo y horno incluidos. Cualquier otro texto se lee como sin duración —no se muestra, no filtra y no ordena— y el `.md` no se corrige. La validación es al leer.
- [ ] **Hay tags reservados** (C05.1.4): viven en la lista `tags` como cualquier otro, y la app los dibuja y los carga con forma propia.
- [ ] **`foto` es una URL externa o una foto del depósito**, escrita `foto:N` (C05.1.5). Un `foto:N` cuyo número no está en el depósito se lee como ausente. **El editor sólo escribe `foto:N`** (C04.2.1d), pero el formato sigue aceptando la URL: un agente puede escribirla, y se conserva.
- [ ] Un archivo sin bloque de frontmatter no tiene título: todo es cuerpo, y cae en C05.2.3.

**Edge cases:** frontmatter con YAML inválido → se rescata lo que se puede: cada
línea que no es `clave: valor` se saltea, y si no queda título se ignora y se
cuenta (C05.2.3) · `tags` escrito
como texto suelto, sin corchetes ni guiones → se lee como sin tags · `foto` que no es una URL
→ se conserva y no se dibuja · `foto: foto:9` sin el 9 en el depósito → la
receta no tiene cabecera.

#### C05.1.2 — Parsear el cuerpo *(J8)*

- [ ] Se reconocen `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`.
- [ ] Los `###` dentro de Ingredientes son grupos; dentro de Variaciones, variaciones; **dentro de Preparación, tramos con nombre**, y la numeración de los pasos vuelve a empezar en cada uno.
- [ ] `## Variaciones` puede traer una lista de bullets en vez de secciones `###`, y entonces se muestra como lista.
- [ ] **`## Fotos` es el depósito** (C05.1.5) y no texto: no se muestra como sección de la receta —cada foto se dibuja donde la usan, y las sin uso en el carrusel (`E03-LeerYCocinar.md` C03.5.2)— ni se edita como un campo más del editor.
- [ ] Cualquier otra sección se conserva y se muestra tal cual, sin interpretarse.
- [ ] El texto antes de la primera sección es la descripción.
- [ ] Al reescribir, el orden es siempre el mismo: la descripción, Ingredientes, Preparación, Variaciones y Notas, después las otras secciones en el orden en que estaban, y `## Fotos` al final de todo. Un `.md` que las traía en otro orden queda en éste la primera vez que se guarda.

#### C05.1.3 — Separar nombre y cantidad en un ingrediente *(J4)*

- [ ] El ítem se parte en **nombre + separador + cantidad**, en ese orden.
- [ ] Los separadores son `-`, `—`, `;`, `,` y `|`. **Manda el primero que aparezca.**
- [ ] **La coma solo separa si lo que sigue empieza con un dígito.** `Provenzal, 1 cucharada` se parte; `Sal, pimienta` no.
- [ ] Un ítem sin separador es un ingrediente sin cantidad, y su nombre es el ítem entero.
- [ ] Los espacios alrededor del separador se descartan; el resto del texto se conserva tal cual.
- [ ] Un separador dentro de una imagen o un link —`![…](…)`, `[…](…)`— no cuenta: el guión de un id de Drive no parte el ingrediente.
- [ ] La cantidad es **texto libre**: no se parsea, no se normaliza y no se convierte a número.

**Edge cases:** `Harina 0000, 200gr?` → nombre "Harina 0000", cantidad "200gr?"; el signo de pregunta se conserva · `500gr de anillos de calamar`, con la cantidad adelante y sin separador → es el nombre entero, sin cantidad, y entra al filtro por "500gr de anillos de calamar" · ítem que empieza con el separador → cantidad sin nombre, no entra al filtro y no rompe · ítem vacío → se ignora.

**Nota técnica:** la convención sale del contenido real del Drive. El libro de
pescados usa `Anchoítas — 18-20 medianas` y el recetario original usa
`Provenzal, 1 cucharada`: las dos fuentes ponen el nombre adelante.

#### C05.1.4 — Los tags reservados *(J8)*

- [ ] Cuatro tags son **especiales**: `favorito`, `menú diario`, `probar` y `borrador`, en ese orden en cualquier fila de tags y antes que los demás.
- [ ] Se reconocen sin mirar mayúsculas ni tildes. `favorito` se reconoce además como `favorita`, `favoritos` y `favoritas`; `borrador`, como `borradores`, `incompleta`, `incompleto`, `incompletos` e `incompletas`. Un `.md` que trae una forma alternativa se lee como el especial sin reescribirse; al guardarlo desde el editor queda con la forma canónica.
- [ ] Buscar o filtrar por un especial encuentra también sus formas alternativas: la lista por tag de `borrador` y el contador de Borradores cuentan las recetas con `incompleta` (`E01-CapturaYBorradores.md` C01.4.1).
- [ ] Ninguno se escribe a mano en el campo de tags: cada uno tiene su botón en el editor (`E04-Corregir.md`). Tampoco se acepta `terminado` ni sus formas de género y número, que contradicen a `borrador`.
- [ ] No suman claves al frontmatter ni columnas al índice: son valores de `tags`.

#### C05.1.5 — El depósito de fotos *(J8)*

- [ ] **Las fotos de una receta viven en una sección `## Fotos` del cuerpo**, una línea por foto: `- <número>: <url>`. No hay claves nuevas en el frontmatter.
- [ ] **El número es estable:** una foto nueva toma el más alto más uno, y un número no se reusa nunca. Los números pueden tener huecos, y el orden de las líneas es el del carrusel.
- [ ] La URL es **un archivo de Drive** —`https://drive.google.com/file/d/<id>/view`, el único formato que se reconoce como tal— **o una externa**. La de Drive se pide con el token; la externa va a un `<img>` directo. La app escribe una externa sólo cuando el sitio no dejó bajar la foto (C04.3d.1b); un agente puede escribir cualquiera de las dos.
- [ ] Sin fotos, la sección no se escribe.
- [ ] **Si alguna línea no tiene esa forma** —o su URL no es `http(s)`—, la sección entera se lee como una sección ajena y se conserva tal cual: la receta queda sin depósito y nada se pierde (C04.3c.1).
- [ ] **El texto nombra una foto con `![epígrafe](foto:N)`**, en cualquier sección del cuerpo. El epígrafe es opcional. Como link (`[x](foto:2)`) no significa nada y queda como texto.
- [ ] **Antes de dibujarse, la receta se resuelve:** cada `foto:N` se cambia por la URL de su línea, y una referencia a un número que no está en el depósito se borra. La lectura, la cocina, el texto y el PDF sólo ven URLs.
- [ ] **Cada foto tiene un uso, que se calcula al leer el `.md` y no se guarda:** *portada* si la nombra la `foto:` del frontmatter, *en el texto* si la nombra un `![](foto:N)` de **cualquier** sección del cuerpo —las ajenas incluidas—, y *sin uso* si ninguna de las dos. Las dos primeras **no se excluyen**: una foto puede ser las dos cosas.
- [ ] El uso se calcula **sobre la receta cruda**, antes de resolverla: después ya no hay ninguna `foto:N` que buscar. Una `foto:` o una referencia a un número que no está en el depósito no marcan nada.
- [ ] Por eso **lo que viaja en el link compartido va sin resolver** (`E03-LeerYCocinar.md` C03.7.3): se le sacan las fotos de Drive y las referencias que las nombraban, pero las externas siguen siendo `foto:N`. Resolver es lo último, y lo hace el que dibuja.
- [ ] **Las sin uso son las únicas que se muestran aparte** —el carrusel de la receta (`E03-LeerYCocinar.md` C03.5.2), la galería del PDF (C03.7.2)—, para que ninguna foto se dibuje dos veces. El editor marca el uso de cada una en su miniatura (`E04-Corregir.md` C04.3d.1).
- [ ] **Las fotos que sube la app van a `_fotos/`**, en la carpeta base, achicadas a JPEG: el lado mayor a 1600 px. La carpeta se crea con la primera foto y su id queda en `meta` como `carpeta_fotos`. El `_` la deja fuera de las categorías y del reindexado.
- [ ] El nombre del archivo es el del `.md` con el número —`pan-de-campo-3.jpg`—, para que en Drive se lean juntas. No se verifica que sea único: lo que manda es el id.
- [ ] Cambiar la receta de categoría no mueve sus fotos: el link es por id.
- [ ] **La app sólo manda a la papelera fotos que están en `_fotos/`.** Un link de Drive pegado a mano que apunta a otra carpeta se saca del depósito y el archivo no se toca.
- [ ] **Una foto de Drive se muestra pidiéndola con el token** y queda en Cache Storage por id de archivo, sin vencimiento: un id de Drive no cambia de contenido. *Borrar datos locales* y *Salir* borran ese caché.
- [ ] **La pantalla no espera las fotos:** una de Drive se dibuja como un recuadro del mismo tamaño y se completa cuando llega. Abrir una receta no tarda más por tenerlas.
- [ ] **Se cachea todo lo posible:** al arrancar se pide almacenamiento persistente, una vez y sin mirar el resultado; dibujado el Recetario, se precargan en segundo plano las cabeceras de Drive del índice y las fotos propias de las categorías que falten, de a dos; y al abrir una receta se pide el depósito entero, no sólo lo que está a la vista. Con `saveData` no se precarga nada.
- [ ] Una foto recién subida entra al caché con el blob que ya está en memoria, y una que va a la papelera sale del caché.

**Edge cases:** un `.md` escrito por fuera con un `## Fotos` mal formado → se
conserva como sección ajena y la receta no tiene depósito · dos recetas que
nombran el mismo link de Drive —pegado a mano en las dos— → sacarlo de una lo
manda a la papelera si está en `_fotos/`; la app nunca escribe el mismo link en
dos recetas · reindexar no lee `_fotos/` y no toca el caché.

### F05.2 — Leer tolerante

Un archivo con título se muestra y se lista igual, le falte lo que le falte: la
app no lo castiga ni lo marca por su cuenta (la completitud la declara el
usuario, F05.3). Un archivo sin título se ignora y se cuenta.

**La app no es la autoridad sobre el formato**: los `.md` los escriben agentes y
el usuario a mano, y eso es el caso normal.

#### C05.2.1 — Mostrar lo que llegó *(J8)*

- [ ] Una receta a la que le falta cualquier cosa menos el título se muestra y se lista.
- [ ] Una sección ausente no se dibuja: no hay encabezado vacío ni "sin datos".

#### C05.2.2 — Un archivo que no es una receta *(J8)*

- [ ] Un archivo que no termina en `.md` dentro de una carpeta de categoría se ignora sin contarse: no pretendía ser una receta.

#### C05.2.3 — Un `.md` sin título se ignora y se cuenta *(J8)*

- [ ] No se lista, no entra al índice, y no rompe la lectura de la carpeta.
- [ ] Suma al contador de archivos ignorados que se ve en Ajustes (C05.9.1).
- [ ] El contador nombra los archivos, para poder encontrarlos en Drive.

### F05.3 — La completitud la declara el usuario

Una receta está terminada cuando el usuario lo dice, y no cuando el texto alcanza
una forma. **Es un dato del archivo** —el tag `borrador` en la lista `tags`—,
no un cálculo: la app lo lee y lo muestra, nunca lo deduce.

Terminar una receta es un juicio. Hay recetas escritas enteras que todavía no
están buenas, y recetas de tres líneas que sí. Derivarlo del contenido decidiría
por el usuario y además podría cambiar solo, sin que nadie tocara nada.

#### C05.3.1 — La completitud es el tag `borrador` *(J8)*

- [ ] Una receta es un borrador si su lista `tags` tiene `borrador`; si no lo tiene, está terminada.
- [ ] Se escribe siempre en la forma canónica, en minúscula. Se reconocen además sus formas alternativas como el mismo tag (C05.1.4).
- [ ] Es el único de los cuatro tags especiales que **no** se pone y saca libremente: sólo se puede sacar cuando la receta cumple C05.3.3, y una receta nueva nace con el tag puesto (`E04-Corregir.md` C04.3b.1).
- [ ] **Una receta sin categoría es siempre un borrador:** la categoría es parte de C05.3.3. Un `.md` escrito afuera sin categoría —en `_sin-categoria/` o suelto en la carpeta base— y sin el tag **no se encuentra de ninguna forma**: ni en la búsqueda, ni en las listas —tampoco en Borradores—, ni en el conteo de tags. Sólo lo nombra el aviso de Ajustes al reindexar (C05.9b.3). El editor no deja guardar una receta sin `borrador` mientras no tenga categoría.
- [ ] `completa` es una clave desconocida como cualquier otra (C05.1.1): la app no la lee ni la borra, y la conserva tal cual si venía en el `.md`.

#### C05.3.2 — El índice no tiene columna propia *(J1, J8)*

- [ ] La fila no tiene columna de completitud. Si una receta es un borrador se sabe por su columna `tags`, igual que si es favorita (F05.4b).
- [ ] Sigue siendo cache: un `.md` editado afuera deja la fila atrasada hasta el próximo guardado o reindexado (R4).

#### C05.3.3 — Cuándo se puede sacar el tag *(J7)*

- [ ] La condición (`sePuedeTerminar`): título, categoría, al menos un ingrediente y al menos un paso.
- [ ] La condición existe para habilitar que se pueda soltar el botón `borrador` del editor (`E04-Corregir.md` C04.4.1) y **en ningún otro lado**: no filtra, no corrige y no escribe.
- [ ] Título y categoría no son obligatorios para guardar un borrador (`E04-Corregir.md` C04.3b.1); son obligatorios para dejar de serlo, y se evalúan junto con lo demás para que la leyenda diga todo lo que falta de una vez.
- [ ] Si una receta sin el tag deja de cumplir la condición mientras se la edita, el tag vuelve a ponerse solo.

### F05.4 — El índice, y la capa compartida

El índice es una Google Sheet, `_indice`, dentro de la carpeta base: derivada y
reconstruible. Tiene tres hojas: **`recetas`** —una fila por receta
(F05.4b), borradores incluidos—, **`meta`** —la versión del esquema, la fecha
del último reindexado, la marca de un reindexado en curso, los ids de `_fotos/`
y `_sin-categoria/`, y la marca de una carpeta reemplazada (C05.7.4)— y **`categorias`**
—una fila por subcarpeta: id, nombre, color y foto (C05.4.4)—.

**Lo escribe un solo camino: el store** (`src/store.ts`). Crear y guardar una
receta escriben el `.md` y su fila juntos. El formato tiene una sola
implementación —`src/recipe.ts` para el `.md`, `src/catalogo.ts` para la fila—,
así que no hay dos versiones que puedan divergir. El agente no corre este
código: devuelve el `.md` y lo guarda la app (C01.9.2); lo que deja directo en
Drive aparece al reindexar.

#### C05.4.1 — Escribir una receta al índice *(transversal)*

- [ ] Recibe la receta parseada y escribe o reemplaza **su** fila, identificada por `fileId` (R5).
- [ ] **La escritura es sincrónica:** ocurre en el momento del guardado y no se junta con otras. **No hay debounce y no hay cola.**
- [ ] Nada queda esperando en almacenamiento local a que alguien lo mande después: una fila encolada es una segunda fuente de verdad, que es lo que R1 prohíbe.
- [ ] Lo mismo vale para la hoja `categorias`: cada cambio de categoría escribe su fila en el momento.
- [ ] La operación termina cuando Sheets confirmó; recién ahí el guardado se declara exitoso.
- [ ] Es idempotente: repetirla con la misma receta deja una sola fila (R2).

**Nota técnica:** la escritura por fila ronda los 200 B y es exactamente el
motivo por el que el índice es una planilla y no un JSON — Drive no tiene
escritura parcial y un JSON obligaría a reescribir el archivo entero.

#### C05.4.2 — Leer el índice *(J1, J4, J5)*

- [ ] Una sola lectura devuelve todas las filas: buscar entre mil recetas no lee mil archivos.
- [ ] Lo que se lee se usa para listar y buscar; abrir una receta lee su `.md`.
- [ ] **Una receta se lee una vez por sesión.** Lo leído queda en memoria por id: volver a una receta, o armar la lista de compras con una ya abierta, no vuelve a Drive. Lo que la app guarda queda como la receta leída; la que borra, la que Drive dice que ya no está y la que se reintenta salen. Borrar una categoría las descarta todas, porque reescribe sus recetas. Lo que se escribe afuera de la app no se ve hasta recargar.
- [ ] **Guardar relee igual el `.md` de base**, de Drive y no de memoria: lo que la app no conoce del archivo de ese momento se preserva (`E04-Corregir.md` C04.5.1).
- [ ] Borrar una receta ya abierta no la relee para saber sus fotos.
- [ ] **Hay copia local del índice, y sólo del índice.** Vive en `localStorage` y guarda las tres hojas, más qué planilla y qué carpeta base son. Al abrir se pide el `modifiedTime` de `_indice` en Drive: si es el mismo que tenía la copia al guardarse, no se lee Sheets; si no, se lee la planilla y la copia se reemplaza. Con la copia vigente, abrir es un solo pedido.
- [ ] Cada escritura en `_indice` deja la copia al día. Borrar una categoría, que reescribe una fila por receta, la deja al día una sola vez: al terminar, o donde se cortó.
- [ ] **`meta` se lee sólo al abrir sin copia vigente** —o al preparar una carpeta base—. Después se escribe entera desde la de memoria, sin releerla, y reindexar no lee ninguna hoja.
- [ ] Los ids de las hojas de `_indice`, que borrar una fila necesita, se piden una vez por sesión; si la planilla se creó en la sesión, ya se conocen.
- [ ] Una copia de otra versión del esquema, de otra planilla, o que no se puede leer cuenta como que no hay copia. La copia nunca es imprescindible.
- [ ] La premisa es que nunca hay escritura concurrente. No sirve para dibujar sin red: ver C05.8.1.

#### C05.4.3 — Un solo camino de escritura *(J8)*

- [ ] Toda escritura de una receta pasa por el store, que escribe el `.md` y su fila: no hay una ruta paralela dentro de la app.
- [ ] El agente no escribe el índice: entrega el `.md` y lo guarda la app, o lo deja en Drive y aparece al reindexar.

**Nota técnica:** no hay bloqueo ni lógica de concurrencia. Con un solo usuario
y sesiones que no se solapan el riesgo es bajo, y la reparación es reindexar
(F05.5) con una sola pestaña abierta.

#### C05.4.4 — Las categorías salen del índice *(J1, J8)*

- [ ] Una categoría es una subcarpeta de la carpeta base. Las carpetas que empiezan con `_` no son categorías.
- [ ] **Lo que no tiene categoría vive en `_sin-categoria/`**, al lado de las categorías. Se crea la primera vez que hace falta, como `_fotos/`, y su id queda en `meta` como `carpeta_sin_categoria`; reindexar la encuentra por su nombre. No es una categoría: no tiene color ni foto, no se gestiona desde *Ajustes → Recetario* y no está en la hoja `categorias`. Sus recetas sí están en el índice, sin categoría.
- [ ] **La app no escribe recetas sueltas en la carpeta base.** Un `.md` suelto ahí, escrito afuera, se lee sin categoría; guardarlo lo deja donde está, y elegirle una categoría lo mueve.
- [ ] Lo que no tiene categoría, en `_sin-categoria/` o suelto en la carpeta base, se muestra como **«Sin categoría»** (`E02-Encontrar.md` C02.4.1).
- [ ] **El color y la foto son propiedades de la carpeta** (`appProperties` `color` y `foto`). La foto es una del catálogo, `catalogo:<clave>`, o una propia subida a `_fotos/`, `drive:<id>` (C05.9b.4). La hoja `categorias` las copia; la carpeta es la verdad.
- [ ] La app no tiene escrito ningún id de carpeta. Las 16 predefinidas —nombre, color y foto— están en `src/categorias.ts` y sólo sirven para el setup (C05.7.4) y para darle color y foto, al reindexar, a una carpeta con nombre de predefinida que todavía no tiene propiedades.
- [ ] Una carpeta creada a mano en Drive aparece como categoría al reindexar. Sin color ni foto se dibuja con el neutro y la trama, y no rompe nada.
- [ ] El nombre de la categoría de cada receta sale de su carpeta, no de un texto guardado aparte.

### F05.4b — La fila del índice es completa

Lo que hace falta para listar, buscar, filtrar y ordenar sin abrir ningún `.md`:
título, categoría, tags, rinde, tiempo, dificultad, fuente, foto y **los nombres
de los ingredientes**, tal como están escritos, sin normalizar.

Los ingredientes están ahí porque J4 tiene que resolverse sin leer mil `.md`. No
se normalizan porque cualquier regla que la app y el agente tuvieran que replicar
es una fuente de divergencia.

#### C05.4b.1 — Las columnas de la fila *(J1, J4, J5)*

- [ ] En este orden: `fileId`, nombre del archivo, título, categoría, id de la carpeta, rinde, tiempo, dificultad, fuente, tags, nombres de ingredientes, fecha de modificación y foto. No hay columna de completitud: se sabe por `tags`.
- [ ] `tiempo` se guarda como está en el `.md` y se valida al leer la fila (C05.1.1); una `dificultad` inválida se guarda vacía.
- [ ] La columna `foto` guarda la cabecera **ya resuelta a su URL** (C05.1.5), así las listas la dibujan sin leer el `.md`.
- [ ] La categoría se deriva de la carpeta que contiene al archivo, no del frontmatter.
- [ ] Los nombres de ingredientes se guardan tal como están escritos: sin singularizar, sin bajar a minúsculas, sin quitar acentos.
- [ ] Nada de lo que se guarda se usa para dibujar la receta abierta: eso sale del `.md`.

**Edge case:** una receta con cientos de ingredientes hace la fila grande pero no
la rompe; no hay tope declarado.

### F05.5 — Reindexar

Lee todos los `.md` y rearma la planilla. Es la reparación universal: cualquier
inconsistencia se resuelve así, porque los archivos son la verdad.

Disponible desde Ajustes. Además corre solo al abrir en tres casos (C05.5.3).

#### C05.5.1 — Reindexar *(J8)*

- [ ] Lista las subcarpetas de la carpeta base, lee cada `.md` —los de cada categoría, los de `_sin-categoria/` y los sueltos en la carpeta base, estos dos sin categoría— y escribe las hojas `recetas` y `categorias` enteras.
- [ ] Un `.md` cuyo nombre empieza con `_` es de la app y no es una receta: `_plan.md` no entra al índice.
- [ ] Si a la planilla le falta la hoja `categorias`, la crea.
- [ ] Al terminar, el índice no conserva ninguna fila anterior: lo que no está en Drive, no está.
- [ ] Los archivos ignorados por no tener título se cuentan y quedan visibles en Ajustes.
- [ ] **Una receta sin categoría —en `_sin-categoria/` o suelta en la carpeta base— sin el tag `borrador`**, en ninguna de sus formas (C05.1.4), se nombra en Ajustes al terminar, como los ignorados. No se hace nada más: no se mueve y no se le pone el tag. Entra al índice, pero no se muestra en ninguna lista ni búsqueda (C05.3.1).
- [ ] La fecha del último reindexado queda registrada en `meta` y se muestra en Ajustes.

#### C05.5.2 — El reindexado muestra progreso y no se cancela *(J8)*

- [ ] Hay **una sola barra de punta a punta, con su porcentaje**, que cubre el proceso entero: recorrer las carpetas, listar lo que hay adentro, leer los `.md` y escribir las hojas. Cada etapa avanza dentro de su tramo, con pesos fijos.
- [ ] **Nunca hay un indicador indeterminado.** Leer los `.md` es una etapa entre otras: con una carpeta recién creada no hay ninguno que leer y el rato se lo llevan las demás, que un spinner no distingue de colgado.
- [ ] **No hay botón de cancelar.** Una vez empezada, termina.
- [ ] Corre bajo el velo con progreso (R8): la barra va en una tarjeta sobre la pantalla, y mientras dura no se navega ni se toca nada.
- [ ] Si falla a mitad, el velo se va y la pantalla desde la que se lanzó avisa *«No se pudo reindexar.»*; desde Ajustes, el reintento es el mismo botón **Reindexar** (R1); el índice queda como haya quedado y se repara volviendo a reindexar.

#### C05.5.3 — Cuándo se reindexa solo *(J8)*

- [ ] Al abrir, si la planilla se acaba de crear (C05.7.3), si la versión del esquema anotada en `meta` no es la del código (`SCHEMA_VERSION`, hoy 7), o si `meta` dice que un reindexado quedó a medias.
- [ ] Al terminar, el reindexado anota la versión del esquema en `meta`: sin eso, reindexaría en cada arranque.
- [ ] Cambiar la forma de la fila o de las hojas obliga a subir `SCHEMA_VERSION`. Lo que se valida al leer —`tiempo`, `dificultad`— no la sube.
- [ ] Al elegir o cambiar la carpeta base (C05.7.4).
- [ ] **No hay lógica de concurrencia:** dos reindexados solapados —dos pestañas, o *Reindexar* tocado mientras el arranque ya reindexa— pueden dejar cada receta dos veces. La salida es reindexar una vez con una sola pestaña abierta.

**Nota técnica:** es la operación más cara del producto — con ~1.000 recetas son
~1.000 lecturas de Drive, más la escritura de la planilla. Se leen de a seis a la
vez, con un tope para no abrir cientos de pedidos juntos, y las filas se escriben
igual en el orden en que Drive lista los archivos. Cada hoja se vacía con un
solo pedido y sin leerla: se borra la grilla entera salvo el encabezado, con
el tamaño que Sheets informa, así que se van también las filas duplicadas o
agregadas a mano. Aun así puede tardar minutos:
por eso vive a tres toques y por eso tiene barra de progreso y no un indicador
indeterminado. El setup de una carpeta base (C05.7.4) suma sus dos etapas
propias —crear las predefinidas que falten y `_indice`— adelante de la barra del
reindexado, que entra comprimida en lo que queda. Las carpetas se listan una
sola vez: el reindexado usa las del setup, con las recién creadas.

### F05.6 — Un índice roto se recrea, no se repara

Los `.md` son la verdad y el índice se rearma desde ellos. **La app no
diagnostica ni repara daños de la planilla in situ:** recrearla es menos trabajo
y menos riesgo que distinguir cada tipo de daño.

#### C05.6.1 — La app no detecta el daño *(J8)*

- [ ] La app no revisa que `_indice` tenga todas sus hojas y columnas, ni distingue tipos de daño.
- [ ] Un índice con filas de más, de menos o atrasadas no impide abrir: se corrige con **Ajustes → Reindexar** (C05.9b.2), con una sola pestaña abierta.
- [ ] Si `_indice` no existe, la app lo crea sola (C05.7.3): no es daño.

#### C05.6.2 — La salida cuando la app no abre *(J8)*

- [ ] Una planilla que no se puede leer —le falta la hoja `meta`, por ejemplo— frena el arranque con el aviso *«No se pudo abrir el Recetario.»* y **Reintentar**; el mensaje de Google va a la consola, no a la pantalla (R1).
- [ ] La recuperación es borrar el archivo `_indice` en Drive y volver a abrir: la app lo crea de nuevo y lo puebla desde los `.md`.
- [ ] Una copia local vieja o rota se resuelve con **Borrar datos locales** (C05.9b.5).

### F05.7 — Primer arranque y consentimiento

Explica qué va a pasar antes de pedir permiso. Pasa por la pantalla de "app no
verificada" una vez, que es inevitable con el scope `drive`.

#### C05.7.1 — Explicar antes de pedir *(transversal)*

- [ ] La primera pantalla dice que las recetas viven en el Drive del usuario y que la app las lee y las escribe.
- [ ] El pedido de permiso ocurre al tocar **Conectar con Google**, nunca automáticamente al abrir.
- [ ] Con una sesión previa vigente la app abre sin mostrar esa pantalla ni ningún popup: el pedido explícito es sólo para cuando no hay sesión o el permiso se revocó.

#### C05.7.2 — La conexión siempre termina en algo *(transversal)*

- [ ] Si el usuario cierra el popup, la app dice que no se pudo conectar y muestra el botón otra vez.
- [ ] Si la respuesta demora más de lo razonable, aparece el mismo aviso con el botón.
- [ ] **Nunca se queda en "Conectando…".** Si después del permiso el arranque falla, la pantalla dice *«No se pudo abrir el Recetario.»* con **Reintentar**, lo mismo que al abrir (C05.6.2).
- [ ] Si el usuario deniega el permiso, el mensaje lo dice y explica que sin acceso a Drive no hay app.

#### C05.7.3 — Crear el índice la primera vez *(J8)*

- [ ] Si `_indice` no existe en la carpeta base, se crea y se puebla leyendo los `.md`, con la barra de progreso de C05.5.2.
- [ ] Si la creación falla a mitad, el archivo a medio hacer se borra antes de avisar, para que el próximo arranque no lo encuentre corrupto.
- [ ] Si hay más de una planilla `_indice`, se usa la modificada más recientemente y Ajustes lo avisa (C05.9b.3).

#### C05.7.4 — Elegir la carpeta base *(transversal)*

- [ ] La app encuentra su carpeta por una marca en sus `appProperties` (`recetario=raiz`), no por el nombre: la carpeta puede llamarse como el usuario quiera y estar en cualquier lugar de su Drive.
- [ ] **La app no lista las carpetas del usuario en ninguna pantalla.** Lo único de Drive que muestra son las **Encontradas**: las que ya sabe que le pertenecen.
- [ ] Sin una carpeta marcada, o con más de una, abre `#/carpeta` —«Tus recetas en Drive»—: una explicación de dos frases y dos opciones, **Crear la carpeta «Recetario» en Mi unidad**, primaria, y **Ya tengo una carpeta**. No tiene volver: no hay a dónde.
- [ ] **Encontradas**, si las hay, va arriba de las dos opciones: las marcadas, o si no hay ninguna las propias que se llamen `Recetario`, cada una con su *Usar*.
- [ ] **Ya tengo una carpeta** abre el Google Picker —la ventana de Google, con su navegación y su búsqueda—, limitado a carpetas propias. Sin API key configurada el botón no se dibuja y queda sólo crear.
- [ ] Antes de usar una carpeta que ya existe confirma: «Se va a usar *nombre*. Las categorías que falten se crean, y después se indexa lo que haya adentro.» Crear no confirma: el botón ya dice qué carpeta y dónde.
- [ ] El setup, en este orden: crea las predefinidas que falten —comparando nombres sin mirar tildes ni mayúsculas—, cada una con su color y su foto; crea `_indice` si no está; reindexa, con la barra de C05.5.2; y **recién al final pone la marca** y se la saca a cualquier otra carpeta. Si algo falla antes, la carpeta queda sin marcar y la pantalla la vuelve a ofrecer. Repetirlo no duplica nada.
- [ ] Un fallo —el Picker que no abre, la carpeta que no se pudo crear, el setup que se cortó— se avisa en el lugar de los botones, con **Reintentar** (R1).
- [ ] La carpeta se cambia desde Ajustes (C05.9b.4): la misma pantalla, con el título *Cambiar carpeta*, volver, y la aclaración de que la carpeta actual queda como está en Drive.
- [ ] **Al cambiar, la `meta` de la carpeta anterior queda anotada como `reemplazada`:** otro dispositivo con la copia local de esa carpeta la descarta al abrir y busca la marcada. Si la anotación falla, el cambio sigue. Volver a usar esa carpeta borra la anotación.

### F05.8 — Sin red

Avisa y no insiste. No hay cola de reintentos, ni guardado local, ni "se guardará
más tarde" sin evidencia. La app tampoco muestra datos viejos como si fueran
actuales.

#### C05.8.1 — Sin red no se dibuja nada viejo *(transversal)*

- [ ] **Sin red al abrir, la app no arranca:** en lugar del Recetario, el aviso *«No se pudo conectar con Drive. Sin esa lectura no hay con qué dibujar.»* con **Reintentar**.
- [ ] Borradores, las listas y la búsqueda salen del índice en memoria y no leen Drive: una vez abierta la app, siguen andando sin red y no tienen un estado «sin red».
- [ ] Una pantalla que lee Drive —una receta, el plan— y no pudo, muestra el aviso, no datos de una lectura anterior.
- [ ] Ninguna pantalla promete que algo se va a guardar después.
- [ ] La copia local del índice (C05.4.2) no reemplaza la lectura de Drive: al abrir, la búsqueda de `_indice` va primero, y sin ella se muestra el aviso.

### F05.9 — Los avisos que no interrumpen

Los archivos ignorados, las inconsistencias detectadas y cualquier otro problema
sin acción inmediata viven en un lugar secundario —Ajustes—, no en la cara.
Que no interrumpan no significa que no existan: lo que se ignora se cuenta.

#### C05.9.1 — El aviso tiene dos niveles *(transversal)*

- [ ] **Con acción:** aparece donde ocurrió el problema, dice qué pasó y trae el control para resolverlo, salvo que ese control sea el que falló y siga a la vista: entonces el aviso va sin control (R1).
- [ ] **Sin acción:** no aparece donde ocurrió; se acumula en Ajustes.
- [ ] Los dos usan el mismo componente y el mismo tono: una frase en castellano, sin el error crudo.
- [ ] Ningún aviso usa ilustración ni frase simpática.

#### C05.9.2 — Los avisos acumulados se cuentan *(transversal)*

- [ ] Ajustes muestra cuántos archivos se ignoraron y por qué.
- [ ] La lista nombra los archivos, para poder encontrarlos en Drive.
- [ ] El contador se recalcula en cada lectura completa; no se acumula entre sesiones.

### F05.9b — Ajustes

La pantalla secundaria donde viven la cuenta, la carpeta y sus categorías, el
reindexado y los avisos que no interrumpen. Se llega desde el menú lateral.

Seis fichas, en este orden: **Cuenta**, **Recetario**, **Índice**, **Archivos
locales**, **Avisos** y **Registro de actividad**. Lo de la cuenta y el índice va
primero; lo raro, al final. Mientras corre un reindexado, el velo tapa la
pantalla (R8).

**La versión del build** —el commit corto y cuándo se compiló— se ve al pie del
menú lateral, para saber si el teléfono ya tomó el último deploy.

#### C05.9b.1 — Cuenta *(transversal)*

- [ ] Muestra con qué cuenta de Google está conectada la app.
- [ ] Ofrece **Salir**, que revoca el token en Google, borra la copia local del índice y las fotos guardadas en el navegador, y recarga la app: vuelve a la pantalla de conexión sin nada del usuario en memoria.
- [ ] Salir no borra nada de Drive y lo dice.

#### C05.9b.2 — Índice *(J8)*

- [ ] Muestra la fecha del último reindexado.
- [ ] Ofrece **Reindexar**, que lleva a C05.5.2.
- [ ] Está a tres toques a propósito: es una operación rara y cara.

#### C05.9b.3 — Avisos *(transversal)*

- [ ] Lista los avisos sin acción acumulados (C05.9.2).
- [ ] Si hay más de una planilla `_indice` en Drive, dice cuántas y cuál se usa: la modificada más recientemente. Lo mismo con más de un `_plan.md` (`E06-Planificar.md` C06.3.2).
- [ ] Después del reindexado, los `.md` ignorados por no tener título y, aparte, las recetas sin categoría —en `_sin-categoria/` o sueltas en la carpeta base— sin la marca de borrador (C05.5.1), con el nombre de cada archivo: *«En Sin categoría hay 2 recetas sin la marca de borrador.»*
- [ ] Sin avisos, la sección dice «No hay nada para avisar.», sin ilustración.

#### C05.9b.4 — Recetario: la carpeta y las categorías *(transversal)*

- [ ] La ficha muestra el nombre de la carpeta base en uso y ofrece **Cambiar carpeta**, que abre la pantalla de C05.7.4. La carpeta anterior queda como está en Drive, sin la marca.
- [ ] Muestra cuántas categorías hay y lleva a **Categorías** (`#/categorias`), donde se gestionan: crear, renombrar, elegir color de la paleta y foto —del catálogo o una propia—, y borrar. Las predefinidas no tienen trato especial.
- [ ] **La foto propia** se elige con *Subir foto*, primera entre las muestras: se ve en la muestra en el momento y se sube a `_fotos/` recién al guardar la categoría, como `drive:<id>`. Una propia que ya no está en Drive deja en la muestra el recuadro *«La foto ya no está en Drive.»*. Reemplazar la foto manda la propia anterior a la papelera, y borrar la categoría también se lleva la suya.
- [ ] Cada cambio escribe en el momento la carpeta en Drive —su nombre y sus propiedades— y su fila en la hoja `categorias`, con el velo y su tilde (R8). Guardar o borrar vuelve a *Categorías*.
- [ ] Una categoría nueva nace con el primer color de la paleta que nadie usa.
- [ ] Un nombre vacío, que empiece con `_`, repetido o igual a **«Sin categoría»** —sin mirar tildes ni mayúsculas en los dos casos— no se acepta, y se dice por qué. «Sin categoría» es el nombre de lo que no tiene categoría (C05.4.4).
- [ ] **Borrar una categoría no borra sus recetas:** pasan a `_sin-categoria/` con el tag `borrador` puesto, para que quede a la vista que hay que elegirles otra categoría, y sus filas del índice se actualizan. Sus fotos quedan en `_fotos/` como estaban: el `.md` las nombra por su id. La carpeta vacía, su fila de `categorias` y su foto propia van a la papelera de Drive.
- [ ] Con recetas, la confirmación lo advierte con la cantidad: *«Sus N recetas pasan a Borradores, sin categoría.»*, y el botón dice **Borrar <nombre de la categoría>**. La confirmación toma el lugar del botón, se trae entera a la vista y el foco va a *Cancelar*.

#### C05.9b.5 — Archivos locales *(J8)*

- [ ] Dice que la copia del índice se guarda en el navegador para abrir más rápido.
- [ ] Ofrece **Borrar datos locales**: borra lo guardado en el navegador —la copia del índice y las fotos— sin salir de la cuenta, la app se recarga y baja todo de Drive.
- [ ] No toca nada de Drive.

#### C05.9b.6 — Registro de actividad *(J8)*

- [ ] Dice lo que verificó el arranque de esta sesión, con el tono de los avisos —el hecho y el número—: cuándo abrió, la fecha de `_indice`, si la copia local coincidía —y entonces no se leyó Sheets— o por qué no, cuántas recetas y categorías hay, y si reindexó y por qué.
- [ ] Es sólo lectura: no ofrece ninguna acción.

### F05.10 — La app en pantalla ancha

El teléfono es el contexto principal y ahí tiene que verse bien; la computadora
es un contexto real —recuperar y elegir qué cocinar también pasa sentado— y ahí
tiene que verse no mal. El ancho tiene una respuesta definida, no librada al
azar del CSS.

#### C05.10.1 — Una columna con máximo *(transversal)*

- [ ] El contenido es una columna; pasado cierto ancho, la columna tiene un máximo y se centra. El modo cocina también.
- [ ] **Desde 900 px el menú lateral queda fijo en todas las pantallas** y el contenido se corre: también en la receta, el modo cocina, la categoría, los resultados, el editor, *Agregar al plan* y la lista de compras. En las que no son destino del menú no marca ninguna entrada, y abajo de 900 px no se dibuja: ahí sólo lo abren la hamburguesa y el gesto de las pantallas del menú (`ux/information-architecture.md` §4.6). La pantalla de la carpeta base no lo lleva: sin carpeta no hay a dónde ir.
- [ ] Los encabezados —y el conmutador del modo cocina— pintan su barra de lado a lado, pero sus controles se alinean con la columna.
- [ ] Las grillas —categorías, listas de tarjetas— pasan de dos a cuatro columnas al ensancharse.
- [ ] No hay layout de escritorio propio: es la misma app, más ancha.
- [ ] Ninguna pantalla queda inutilizable en ancho de teléfono chico.

---

## Trazabilidad

| Capacidad | Job |
|---|---|
| C05.1.1, C05.1.2, C05.1.4, C05.1.5, C05.2.1, C05.2.2, C05.2.3, C05.3.1 | J8 |
| C05.3.2 | J1, J8 |
| C05.3.3 | J7 |
| C05.1.3, C05.4b.1 | J4 (y J1, J5 para la fila) |
| C05.4.1, C05.4.3, C05.5.1, C05.5.2, C05.5.3, C05.6.1, C05.6.2, C05.7.3, C05.9b.2, C05.9b.5, C05.9b.6 | J8 |
| C05.4.2 | J1, J4, J5 |
| C05.4.4 | J1, J8 |
| C05.7.1, C05.7.2, C05.7.4, C05.8.1, C05.9.1, C05.9.2, C05.9b.1, C05.9b.3, C05.9b.4, C05.10.1 | Transversal |

Ninguna capacidad de esta épica quedó sin job o sin justificación transversal.
