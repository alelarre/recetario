# Recetario — User Flows

**Versión:** 2.0
**Estado:** Vigente — describe el producto como está implementado en `src/`

---

## Sobre este documento

Los flujos críticos del producto, en texto estructurado. Cada uno mapea a un job
de `jtbd.md`; si no mapea a ninguno, va marcado `[revisar necesidad]`.

Los **estados degradados** —sin conexión, índice corrupto, `.md` que no cumple
el esquema— están acá como flujos de primera clase, no como notas al pie. El
stack los hace inevitables: la app depende de la red, del índice y de archivos
que escriben otros.

**Notación:** `→` paso siguiente · `⚑` punto de decisión · `▸` estado ·
`✗` camino de error.

---

## Tabla de flujos

| # | Flujo | Job | Criticidad |
|---|---|---|---|
| F1 | Capturar una receta que acabo de ver | J2 | **La más alta** |
| F2 | Convertir un borrador en receta | J3 | Alta |
| F3 | Buscar una receta por nombre | J1 | Alta |
| F4 | Buscar por ingrediente | J4 | Media |
| F5 | Pasear sin buscar nada | J5 | Media |
| F6 | Cocinar con la receta abierta | J6 | Media |
| F7 | Corregir una receta | J7 | Baja |
| F8 | Primer arranque y consentimiento de Google | — | Alta |
| F9 | Una receta escrita por un agente aparece | J3, J8 | Media |
| F10 | Sin conexión | Transversal | Alta |
| F11 | Índice corrupto o incompleto | Transversal | Alta |
| F12 | Un `.md` que no cumple el esquema | J8 | Media |
| F13 | Planificar la semana y armar la compra | J9 | Baja |
| F14 | Compartir una receta | — | Media |
| F15 | Abrir una receta compartida, como invitado | — | Media |
| F16 | Marcar una receta como favorita | J5 | Media |
| F17 | Filtrar por tag y por duración | J5 | Media |
| F18 | Gestionar las categorías | — | Baja |
| F19 | Cambiar de carpeta | — | Baja |

---

## F1 — Capturar una receta que acabo de ver

**Job:** J2. **Es el flujo más crítico del producto:** si falla, Recetario no
resuelve lo que dice resolver. Ocurre con atención mínima, en el medio de otra
cosa, con una mano.

**No empieza en Recetario.** Empieza en Instagram, en el navegador, en YouTube.

```
Estoy viendo un reel / una página / un video / fotos de una receta
  → Compartir del sistema
  → elijo Recetario en la hoja de compartir
  ▸ el service worker recibe el POST: guarda las fotos en su caché y
    redirige a #/nueva con el link, el texto y cuántas fotos llegaron
  ⚑ ¿lo compartido es una receta en .md?
      sí  → no es una captura: sigue en F2, «La vuelta»
  ▸ se abre el editor de una receta nueva: el link en Fuente original, lo que
    sobró del texto en Notas, y las fotos, achicadas, en el depósito, todas
  ▸ la categoría en «Sin categoría» y el tag borrador puesto
  → escribo el título, si quiero   ⚑ opcional: sin título, «Borrador dd/mm hh:mm»
  → completo lo que quiera, o nada
  → Guardar
  ▸ se suben las fotos a _fotos/
  ▸ se escribe el .md en _sin-categoria/, y su fila en el índice
  ▸ el editor se cierra y la app queda en la receta guardada
```

**Decisiones que este flujo fija:**

- **Compartir y guardar alcanza.** No pide categoría ni tags (principio 2), y el título es opcional mientras la receta es un borrador. La fuente es el link —`url`, o el primero que haya en el texto, porque muchas apps lo mandan ahí—; el resto del texto va a Notas. El título de la página no viaja: el de la receta lo escribe el usuario, o queda el de la fecha.
- **Un solo formulario.** Lo compartido abre el mismo editor que *Nueva receta* y *Editar*: lo que se captura ya es una receta, con el tag `borrador`.
- **Nada se escribe hasta Guardar.** Lo compartido cuenta como cambio: salir sin guardar pregunta *«¿Salir sin guardar los cambios?»*.
- **Se escribe en Drive, no local.** Principio 1.

**Camino de error:**

```
  → Guardar
  ✗ no hay red
  ▸ aviso: «No se pudo guardar. Revisá la conexión.»
  ⚑ lo escrito y las fotos quedan en pantalla para reintentar con Guardar
  ⚑ las fotos que ya se subieron no se vuelven a subir
  ✗ si salgo, se pierde
```

Está aceptado explícitamente (principio 1 + 4): no hay cola local. Es el único
punto donde el producto acepta a sabiendas un riesgo sobre el job huérfano.

**A mano** es el mismo editor, desde *Menú → Nueva receta*: fuente escrita a
mano, notas y fotos —la página de un libro, sacada con la cámara—, y al guardar
queda como borrador.

**iOS no se soporta:** no tiene Share Target y el Atajo equivalente queda fuera
del alcance. Android es la plataforma (`E05-Cimientos.md` R7).

---

## F2 — Convertir un borrador en receta

**Job:** J3. Ocurre sentado, con atención completa, **antes de ponerse a
cocinar** — no cuando se encontró la receta.

Un borrador ya es una receta: convertirlo es completarla y sacarle el tag
`borrador`, en el editor. Hay tres caminos.

**1. Convertir con Agente.** La app no llama a ningún modelo: guarda la receta,
arma el pedido, y recibe de vuelta la receta para revisarla y guardarla.

```
Menú → Borradores           ⚑ el contador dice cuántos esperan
  → toco una receta               ▸ abre su editor, no la receta
  ▸ el editor, con Convertir con Agente al final, arriba de Guardar
  → Convertir con Agente
  ▸ guarda la receta, como Guardar     ⚑ si no se pudo guardar, no manda nada
  ▸ la app arma el pedido: título, fuente, lo que ya está cargado
    —descripción, rinde, ingredientes, preparación—, Notas, el id del .md,
    las reglas del formato y, si hay fotos en el depósito, cuántas van, cómo
    leerlas y cómo nombrarlas —cada una con su número, foto:N—
  ⚑ ¿hay menú Compartir del sistema que comparta archivos?
      sí (Android)  → se abre con el pedido como texto y las fotos como
                      archivos; elijo el agente
      no (la Mac)   ▸ el pedido suma el link de Drive de cada foto, para que
                      el agente las lea con su conector de Drive
                    ⚑ ¿el pedido entra en un link de 8.000 caracteres?
                        sí  → se abre claude.ai/new con el pedido cargado
                        no  → se copia, se abre claude.ai/new
                              ▸ aviso: «Pedido copiado: pegalo en el agente»
  ▸ el editor queda cerrado y la app en la receta
  ✗ el navegador ya no deja abrir el menú ni la ventana —guardar tardó y se
    perdió el toque—
  ▸ la receta avisa «La receta quedó guardada. Tocá para mandarla al agente.»
  → Mandar al agente                   ▸ el mismo pedido, con el toque nuevo
  ▸ el agente lee la fuente y las fotos, y responde sólo con el .md de la receta
```

**La vuelta** no depende de la ida: cualquier receta en `.md` que llegue a la
app abre el editor, empiece donde empiece la conversación.

```
La respuesta del agente
  ⚑ ¿cómo vuelve?
      compartida  → Compartir → Recetario      (llega a #/nueva, como F1)
      pegada      → la copio → abro el editor de la receta → Pegar
  ▸ la app limpia lo que llega: bloque de código, cita con >, texto alrededor
  ⚑ ¿es una receta? (frontmatter entre --- con una línea titulo:)
      no, compartida  → abre el editor nuevo con lo compartido (F1)
      no, pegada      ✗ aviso: «Lo copiado no es una receta en .md.»
  ⚑ compartida: ¿trae id: de una receta que existe?
      sí  ▸ el editor de esa receta, con lo recibido aplicado como Pegar
      no  ▸ el editor nuevo, lleno con la receta, «Sin categoría» y borrador
  ⚑ pegada: se aplica al editor abierto, traiga el id que traiga
  ▸ título, datos, tags y secciones son los de la receta que volvió; el
    depósito de fotos y la categoría elegida quedan, y la receta ya nombra
    las fotos como foto:N
  → reviso, elijo la categoría           ⚑ la clasificación es siempre mía
  → saco las fotos que no sirven                  ⚑ de a una, con sus acciones
  → suelto borrador, si ya está terminada  ⚑ hace falta título, categoría,
                                              ingredientes y pasos
  → Guardar
  ▸ se reescribe el .md y su fila; elegir una categoría lo mueve de
    _sin-categoria/ a su carpeta
```

El pedido se arma con las mismas constantes que usa la app —las claves del
frontmatter, las cinco duraciones, las tres dificultades, los tags reservados—,
así que no se desactualiza cuando cambia el esquema. Pide no inventar lo que la
fuente no dice y no agregar datos nutricionales. La clave `id` que trae la
respuesta no se muestra ni se guarda. Pegar no guarda y pisa lo escrito sin
preguntar; la receta recibida por Compartir cuenta como cambios sin guardar:
salir pregunta.

```
  ✗ el navegador no deja leer el portapapeles
  ▸ aviso: «No se pudo leer lo copiado.»
```

**2. Completarla a mano.** Para una receta que ya tenés en la cabeza.

```
Menú → Borradores → toco una receta   ▸ abre su editor
  → elijo la categoría y escribo la receta
  → suelto borrador → Guardar
  ▸ se reescribe el .md y su fila, y el archivo se mueve a su categoría
```

**3. Un agente por fuera de la app**, con acceso al Drive: lee la fuente,
extrae la receta y deja el `.md` en Drive, que aparece al reindexar. Ver F9.

---

## F3 — Buscar una receta por nombre

**Job:** J1, el más frecuente. Dos toques.

```
Recetario
  ▸ la búsqueda está arriba, visible, no detrás de un ícono
  → escribo parte del nombre y toco Enter
  ▸ resultados
  → toco el que quería
  ▸ Receta
```

Busca en el título, en los ingredientes y en los tags, no en el cuerpo entero:
buscar en todo es lo que hace Drive y es exactamente lo que trae ruido.

---

## F4 — Buscar por ingrediente

**Job:** J4. Es el que decidió el formato del archivo.

```
Recetario
  → escribo "berenjena" y toco Enter
  ▸ resultados agrupados: por nombre, por ingrediente y por tag
  ⚑ los tres grupos en la misma lista, distinguidos, cada uno con su cantidad
  ⚑ dentro de cada grupo, las favoritas primero; el orden puede pasar a Duración
  → toco una
```

**Lo que lo hace posible:** la convención `nombre` + separador + `cantidad` del
§1.4 de la IA. El nombre del ingrediente es lo que está antes del separador, así
que "berenjena" en una nota al pie no cuenta como ingrediente.

**Se resuelve contra el índice, no leyendo los `.md`.** La fila de cada receta
lleva sus nombres de ingredientes, así que buscar entre mil recetas es una
lectura, no mil.

**Degradación:** una receta con los ingredientes en prosa libre no aparece en
este filtro (principio 3). No se esconde: sigue apareciendo por nombre.

---

## F5 — Pasear sin buscar nada

**Job:** J5. Con ~1.000 recetas que el usuario no cocinó y cuyo nombre no
recuerda, este job pesa casi tanto como J1.

```
Recetario
  ▸ debajo de la búsqueda, el carrusel de tags y las categorías, alfabéticas
  → toco una
  ▸ Categoría: sus recetas, las favoritas primero
  → toco una que me llamó la atención
  ▸ Receta
```

**No hay historial, ni "última vez", ni "hace mucho que no hacés esto".** La
novedad se resuelve mostrando, no registrando (`personas.md` §4).

**Los tags y la duración son la otra forma de pasear:** ver F17.

---

## F6 — Cocinar con la receta abierta

**Job:** J6. Es el uso menor.

```
Receta
  ▸ una sola columna de fichas: ingredientes, preparación, variaciones, notas
  ▸ todo a la vista, sin pestañas
  → Cocinar                                  ⚑ al modo cocina se entra a propósito
  ▸ Modo cocina: letra grande, conmutador Ingredientes / Pasos
  ▸ el primer paso está realzado
  → toco un paso: es donde voy; lo toco de nuevo: hecho, y el hilo sigue
  → toco el sol: la pantalla no se apaga     ⚑ manual, por decisión
  ▸ cocino
  → Salir, o volver a la receta
  ▸ la pantalla se libera; nada de lo marcado se guarda
  ▸ Salir vuelve a donde elegí la receta: la categoría, los resultados, el plan
```

**La lectura no tiene pestañas:** costaban cuatro toques para leer una receta
entera y escondían las notas. **El conmutador existe sólo en el modo cocina**,
donde notas y variaciones no se muestran; conmutar conserva la posición de
scroll de cada lado. **El sol es manual a propósito:** no siempre hace falta, y
arranca apagado cada vez. Si la app pasa a segundo plano con el sol encendido, al
volver se pide de nuevo. Si el navegador no lo soporta, el sol no se muestra.

**Las variaciones se leen en la receta**, en la misma columna, cada una con su
fuente.

**Las fotos se leen donde el texto las nombra:** debajo del paso o del
ingrediente, en la receta y también en el modo cocina. Las que no son la
cabecera ni están en el texto van en el carrusel de la primera ficha, debajo
de la descripción. Tocar una abre el visor, que se cierra tocando: desde el
carrusel desliza entre las del carrusel; la cabecera y una foto del texto se
abren solas. En la cocina no: ahí un toque marca el paso.

---

## F7 — Corregir una receta

**Job:** J7. Un toque desde la receta.

```
Receta
  → Editar
  ▸ Editor: tres fichas, Datos, Fotos y Contenido, y al final Guardar
  → corrijo el error, o agrego una variación
  ⚑ también acá: la categoría, la duración —cinco botones—, los cuatro tags
    especiales —un botón cada uno—, Pegar en el encabezado y Borrar receta
  → Guardar
  ▸ se reescribe el .md
  ▸ se actualiza su fila en el índice
```

**Las fotos de la receta se manejan en la ficha Fotos**, y nada toca Drive hasta
Guardar.

```
Editor → ficha Fotos
  → Cámara o Galería        ⚑ la cámara saca una por vez; la galería, varias a
                              la vez —las dos sin tope
  → Por URL                 ⚑ la app la baja del sitio y la guarda como
                              cualquier otra; la que el sitio no deja bajar
                              queda como link externo
  ▸ la foto se achica y espera en memoria, con su número
  → toco una miniatura
  ⚑ ¿qué hago con ella?
      Ver        → el visor, que desliza entre todas
      Sacar      ▸ sale del depósito y sus referencias se borran del texto
  → Guardar
  ▸ suben las fotos nuevas a _fotos/
  ▸ se escribe el .md, con la sección Fotos, y su fila
  ▸ recién ahí van a la papelera las que saqué
```

**Una foto se pone en el texto desde el lugar**, que es lo que estoy mirando
mientras escribo el paso:

```
Editor → escribo un paso
  ▸ a la derecha del campo, a la altura de mi línea, el botón de foto
    ⚑ sólo con el campo enfocado, y sólo si el depósito tiene algo
  → lo toco
  ⚑ la galería del depósito, y nada más: agregar es la ficha Fotos
  → elijo una
  ▸ ![](foto:N) se escribe al final de esa línea
```

**El campo «Portada», primero de Contenido, es la foto de la cabecera** y el
único lugar donde se elige: la miniatura de lo que hay, y al tocarla, el
depósito para elegir o *Sin foto*. Una cabecera que es una URL suelta se
muestra como la actual y queda mientras no se elija otra cosa.
**Salir sin guardar no deja nada en Drive:** las fotos nuevas nunca llegaron.

**El editor corrige, no compone.** Componer es trabajo del agente
(`product-vision.md` §1).

**El tag `borrador` no se puede sacar** sin título, categoría, al menos un
ingrediente y al menos un paso. **Borrar receta** pide confirmación y manda el
`.md` a la papelera de Drive, con sus fotos de `_fotos/`.

**Salir con cambios sin guardar pregunta**, también con el gesto de atrás de
Android.

**Camino de error:** ver F10.

---

## F8 — Primer arranque y consentimiento de Google

**No mapea a un job**: es el peaje de entrada del stack.

```
Abro la app por primera vez
  ▸ Conexión: «Tus recetas viven en tu Google Drive. Esta app las lee y las escribe ahí.»
  → Conectar con Google                 ⚑ el permiso se pide al tocar, nunca al abrir
  ▸ popup de Google
  ▸ pantalla de "app no verificada"     ⚑ una vez, inevitable sin verificación
  → acepto
  ▸ la app busca la carpeta marcada (recetario=raiz)
  ⚑ ¿cuántas hay?
      una       → es la carpeta base
      ninguna   → «Tus recetas en Drive», con las propias llamadas Recetario como «Encontradas»
      varias    → «Tus recetas en Drive», con las marcadas como «Encontradas»
  ⚑ ¿existe _indice adentro?
      sí  → arranca
      no  → lo crea, leyendo los .md, con la barra sobre el velo: «Reindexando…»
  ▸ Recetario
```

**La pantalla — «Tus recetas en Drive»:**

```
Carpeta base
  ▸ «Recetario guarda cada receta como un archivo en una carpeta de tu Google
    Drive. Podés crearla ahora o elegir una que ya tengas.»
  ▸ «Encontradas», si hay: una ficha por carpeta, con su Usar
  ⚑ tres maneras de elegir
      Usar, en una de «Encontradas»          → confirmación
      Crear la carpeta «Recetario» en Mi unidad  ⚑ no confirma: crea y prepara
      Ya tengo una carpeta → Picker de Google → confirmación
  ▸ confirmación: «Voy a usar <carpeta>. Si faltan categorías, las creo, y
    después indexo lo que haya adentro.»
  → Usar
  ▸ setup, con la barra sobre el velo: «Preparando la carpeta…»
      ▸ crea las predefinidas que falten, de las 16, con su color y su foto
      ▸ busca _indice adentro; si no está, lo crea con sus tres hojas
      ▸ reindexa
      ▸ marca la carpeta, y le saca la marca a cualquier otra
  ▸ la app recarga en el Recetario
```

**La app no lista las carpetas del usuario.** Lo único de Drive que muestra son
las «Encontradas», que son las que ya sabe que le pertenecen; elegir otra es el
Picker de Google, que sólo ofrece carpetas propias —ni las compartidas ni las
unidades compartidas—. El Picker se ve con el estilo claro de Google y necesita
una API key: sin ella, *Ya tengo una carpeta* no se dibuja y queda sólo crear.

**La marca va última:** si algo falla antes, la carpeta queda sin marcar y la
próxima apertura vuelve a esta pantalla. Repetir el setup no duplica nada: cada
paso hace sólo lo que falta.

```
  ✗ el Picker no abre
  ▸ aviso: «No se pudo abrir el selector de Google.», con Reintentar
  ✗ el setup falla a mitad
  ▸ aviso: «No se pudo preparar la carpeta.» —o «No se pudo crear la
    carpeta.»—, con Reintentar, que lo repite sobre la misma carpeta
```

**Las aperturas siguientes son un pedido:** con la copia local del índice, la app
pide la fecha de `_indice`; si coincide, no lee Sheets
(`information-architecture.md` §2.5). La sesión de Google se renueva en silencio.

**Camino de error — cerrar el popup a mitad:**

```
  ✗ cierro la ventana de consentimiento
  ▸ aviso: no se pudo conectar, con botón de reintentar
  ✗ NUNCA quedarse en "Conectando…"
```

El aviso es «No se pudo conectar.», con el botón *Conectar con Google* otra vez.

---

## F9 — Una receta escrita por un agente aparece

**Jobs:** J3, J8. Es el flujo que hace que el ecosistema funcione.

```
El agente deja un .md en una carpeta de categoría de Drive
  → abro la app
  ▸ la receta todavía no está: la app no descubre lo que se escribe afuera
  → Menú → Ajustes → Reindexar
  ▸ la receta está
```

**No hay detección de cambios, ni Changes API, ni "3 recetas nuevas".** Un `.md`
escrito por fuera de la app aparece recién al reindexar: el índice es derivado y
los `.md` son la verdad (principio 1).

**Tampoco hace falta avisar:** la conversión la disparó el usuario y es
just-in-time, antes de cocinar. Sabe que llegó porque la pidió.

**El camino sin reindexar es F2, «Convertir con Agente»:** el agente devuelve el
`.md` y lo guarda la app, que escribe el archivo y su fila juntos. Es también lo
que pasa con el conector de Google Drive de claude.ai, que crea archivos pero no
escribe planillas: lo que carga por su cuenta necesita reindexar. Rehacer el
skill del agente está pendiente (`../../BACKLOG.md`, P14).

---

## F10 — Sin conexión

**Transversal.** Sin Drive no hay app: es consecuencia aceptada de que el
archivo sea la única fuente de verdad.

```
⚑ ¿hay red?
    no, al abrir      → aviso: «No se pudo conectar con Drive. Sin esa lectura no hay con qué dibujar.», con Reintentar.
                        La copia local del índice no se usa: la consulta a Drive va antes.
    no, al guardar    → aviso: no se pudo guardar. El texto queda en pantalla.
    no, al marcar favorita → aviso: no se pudo marcar. La estrella queda como estaba y es el reintento.
```

**Sin reintentos silenciosos, sin cola, sin "se guardará más tarde".** El
reintento invisible deja al usuario sin saber si su trabajo existe, y este
usuario está cocinando o compartiendo algo en dos segundos (principio 4).

---

## F11 — Índice corrupto o incompleto

**Transversal.** El índice es derivado: nunca se repara en el lugar, se rearma
desde los `.md`.

```
Abro la app
  ⚑ ¿qué le pasa a _indice?
      no existe                          → se crea y se puebla, con progreso
      quedó un reindexado a medias       → reindexa sola
      es de otra versión del esquema     → reindexa sola
      le faltan o le sobran filas        → Menú → Ajustes → Reindexar
      no se puede leer y la app no abre  → borro _indice en Drive; la próxima
                                           apertura lo crea de nuevo
  ▸ progreso: «Reindexando…», con la barra sobre el velo
  ▸ Recetario
```

**Reindexar no se cancela:** cortar a mitad deja el índice en el estado que el
reindexado existe para reparar. Mientras dura, el velo tapa la pantalla: no se
guarda, no se borra y no se navega. Puede tardar: los `.md` se leen de a seis a
la vez.

**Si crear la planilla falla a mitad, la app borra el archivo a medio hacer**
antes de avisar, así la próxima apertura la crea de nuevo y no encuentra una
planilla rota.

**Una sola pestaña:** dos reindexados solapados dejan cada receta dos veces. La
salida es reindexar otra vez, con una sola pestaña abierta.

**Más de una planilla `_indice`** no detiene nada: se usa la modificada más
recientemente, y *Ajustes → Avisos* lo dice.

---

## F12 — Un `.md` que no cumple el esquema

**Job:** J8. Los `.md` los escriben agentes y el usuario a mano: es el caso
normal, no la excepción.

```
El reindexado lee cada .md
  ⚑ ¿el archivo tiene título?
      no  → se ignora, y se cuenta
      sí  → entra al índice y se muestra
            ⚑ ¿lleva el tag borrador, o incompleta?
                sí  → aparece en Borradores
            ⚑ ¿está en _sin-categoria/ sin el tag borrador?
                sí  → se avisa; el archivo no se toca
            ⚑ ¿tiempo o dificultad fuera de sus valores?
                sí  → se leen como sin dato; el archivo no se toca
  ▸ los ignorados y los de _sin-categoria/ sin el tag se informan en
    Ajustes → Avisos, con su nombre, no en la cara
```

**Se lee lo que llega** (principio 3). Una clave o una sección que el esquema no
conoce se muestra o se ignora, y se conserva al guardar. La app nunca deduce la
completitud del contenido: una receta es un borrador si lleva el tag, y lo lleva
porque nació con él o porque el usuario se lo puso.

**La salida manual:** cuando la receta está terminada, el usuario suelta el botón
*borrador* en el editor y la receta sale de Borradores.

---

## F13 — Planificar la semana y armar la compra

**Job:** J9. La entrada es una sola —el menú lateral— y no ocupa navegación
primaria (principio 6).

```
Menú lateral → Plan de la semana
▸ siete días desde hoy, dos comidas cada uno   ⚑ sin fechas: hoy primero y da la vuelta
  → toco el + de una comida
  → Martes a la noche
  ▸ la búsqueda arriba, el bloque «Menú diario» y las categorías debajo
  → toco una receta                            ⚑ sólo recetas del recetario, sin borradores
  ▸ se suma a esa comida, se escribe `_plan.md` y vuelvo al plan
  → toco el + de la misma comida y sumo otra   ⚑ una comida es una lista, sin límite ni tipos
  → toco la × de una línea
  ▸ sale esa línea nada más, y se reescribe el archivo
  → Lista de compras
  ▸ los ingredientes de todo lo cargado, en dos bloques
  ⚑ los de mismo nombre y misma unidad se suman; distinta unidad, dos ítems
  ⚑ los que no tienen cantidad se listan como recordatorio
  → Compartir → Texto                          ⚑ la lista no se guarda en ningún lado
```

**Cada cambio se escribe en el momento**, reescribiendo `_plan.md` entero, con el
velo mientras dura (R8). Si falla, el aviso va en el plan, la grilla sigue
mostrando lo que dice Drive, y reintentar es volver a tocar (R1).

**Reiniciar el plan** está al pie, junto a la lista de compras, y pregunta antes:
vacía los siete días y deja el archivo vacío.

**La receta cargada que ya no está** en el índice se ve tachada, con su × para
sacarla; la lista de compras la saltea. No se borra sola.

**La lista degrada con gracia:** si los ingredientes están estructurados es útil;
si no, es un recordatorio. Eso es lo que evitó que J9 forzara un formato de
archivo más rígido.

---

## F14 — Compartir una receta

**No mapea a un job.** Es una copia del momento: nada queda publicado en Drive, y
lo que se cambie después en la receta no llega a quien la recibió.

```
Receta
  → Compartir, el ícono del encabezado
  ▸ ficha al pie: PDF · Link · Texto · Cancelar
  ⚑ ¿qué elijo?
      PDF    ▸ «Armando el PDF…»
             ▸ menú Compartir del sistema, con el archivo
             ⚑ si armarlo tardó y el sistema ya no deja abrir el menú solo:
               ▸ «El PDF está listo.» → Enviar PDF
      Link   → menú Compartir del sistema, con el link
      Texto  → menú Compartir del sistema, con la receta como texto
  ⚑ ¿no hay menú Compartir del sistema? (link y texto)
      ▸ se copia: «Link copiado.» / «Texto copiado.»
      ✗ sin portapapeles: «Copialo desde acá:», con el contenido a la vista
```

- **El PDF** se arma en el teléfono: 105 × 180 mm, tema oscuro, con texto de verdad. Lleva las fotos —la cabecera arriba del título, cada una debajo de su línea, y al final la galería con las que no están en ningún otro lado—, achicadas para que pese poco. El menú Compartir sólo se abre desde un toque del usuario: si el toque ya venció cuando el PDF termina, *Enviar PDF* es el segundo.
- **El link** lleva la receta comprimida en el fragmento, sin los tags y **sin las fotos de Drive**: quien lo abre no tiene token. Las externas sí viajan. No usa Drive ni pide login a quien lo abre: ver F15.
- **El texto** conserva `*negrita*`, `_itálica_`, `- ` y `1. `, que WhatsApp entiende. Una foto externa se escribe como su URL; una de Drive no se escribe.
- **La ficha es estado de la pantalla, no una ruta:** volver, *Cancelar* o tocar el velo la cierran, y mientras está abierta la página de atrás no se desplaza.

```
  ✗ el PDF no se pudo armar
  ▸ aviso: «No se pudo armar el PDF.», con Reintentar
```

---

## F15 — Abrir una receta compartida, como invitado

**No mapea a un job del usuario:** es lo que ve quien recibe el link.

```
Recibo un link por WhatsApp
  → lo toco
  ▸ la app mira el hash antes de cargar nada: #/ver… es la vista de invitado
  ▸ sin login, sin Drive: la receta sale del link
  ▸ Vista de invitado: la receta entera, sin tags y con las fotos externas
  → Cocinar
  ▸ Modo cocina, igual que en F6, con una sola salida: volver a la receta
```

**Es una pantalla con su propio controlador y una lista cerrada de acciones:**
cocinar, volver, conmutar, marcar un paso, la pantalla encendida y el visor de
las fotos que viajaron. No hay editar, ni favorito, ni compartir, ni menú.

```
  ✗ el link llegó cortado o no se puede leer
  ▸ «Este link está roto o incompleto.»
```

---

## F16 — Marcar una receta como favorita

**Job:** J5. Un toque desde la receta.

```
Receta
  → toco la estrella del encabezado
  ▸ la estrella se anima mientras Drive contesta, y no acepta otro toque
  ▸ se reescribe el .md con el tag favorito en su lista, y su fila en el índice
  ▸ la estrella queda encendida
  ▸ en toda lista en orden A–Z, la receta va primero, con su marca en la
    esquina de la tarjeta
```

**El resultado se dibuja cuando Drive contesta, no antes.** Tocarla de nuevo saca
el tag. `favorito` es un tag de la lista `tags` como cualquier otro: no hay clave
ni columna nueva.

```
  ✗ no hay red
  ▸ aviso: «No se pudo marcar como favorita. Revisá la conexión.», sin Reintentar:
    la estrella sigue a la vista y es el reintento
  ▸ la estrella queda como estaba
```

Los otros tres especiales —`menú diario`, `probar`, `borrador`— se ponen y se
sacan desde el editor (F7).

---

## F17 — Filtrar por tag y por duración

**Job:** J5.

```
Recetario
  ▸ el carrusel de tags: los especiales primero —borrador no está—, después
    los demás por cantidad
  → toco un chip
  ▸ Lista por tag: las recetas del recetario entero con ese tag
  ▸ su chip está encendido y fijo; los demás se pueden sumar
```

```
Categoría, o Lista por tag
  → toco un chip del carrusel          ⚑ se enciende; tocarlo de nuevo lo apaga
  ▸ quedan las recetas que tienen todos los tags encendidos
  → toco una duración de la fila: ~15 min · ~30 min · ~60 min · >60 min · >1 día
  ▸ quedan las de esa duración; se pueden encender varias
  → conmutador de orden: A–Z · Duración
  ▸ A–Z: las favoritas primero, alfabético dentro de cada bloque
  ▸ Duración: de la más corta a la más larga; las que no tienen, al final
  ▸ ningún resultado: «Ninguna receta con esos filtros. Probá sacando alguno de
    los filtros de arriba.»
```

**La fila de duraciones y el conmutador aparecen sólo si hay algo que filtrar:**
una lista donde ninguna receta tiene duración no los muestra. Los filtros son
estado de la pantalla: no se guardan.

---

## F18 — Gestionar las categorías

**No mapea a un job.** Está a tres toques a propósito.

```
Menú → Ajustes → ficha Recetario → Categorías
  ▸ la lista, alfabética: cada una con su tile y cuántas recetas tiene
  ⚑ ¿qué hago?
      + Nueva      → nombre, color, foto → Guardar
                     ▸ se crea la carpeta en Drive, con color y foto como propiedades
      toco una     → cambio el nombre, el color o la foto → Guardar
                     ▸ renombrar renombra la carpeta; las recetas no se tocan
      toco una → Borrar categoría
                     ▸ confirmación: «Sus N recetas pasan a Borradores, sin categoría.»
                     → Borrar <categoría>
                     ▸ las recetas pasan a _sin-categoria/ con el tag borrador
                     ▸ la carpeta vacía y su foto propia van a la papelera de Drive
```

- **Todas las categorías se tratan igual**, predefinidas o no.
- **El nombre de la categoría de una receta sale de su carpeta:** renombrar no reescribe ningún `.md`.
- **El color** se elige entre los quince de la paleta y el neutro; **la foto**, entre las del catálogo o una propia, con *Subir foto*: se ve en la muestra en el momento y se sube a `_fotos/` recién al guardar. La muestra del tile se actualiza mientras se elige.
- **Lo borrado se recupera desde la papelera de Drive**, y después hay que reindexar.
- **Salir sin guardar pregunta**, como en el editor de recetas.

```
  ✗ no se pudo borrar
  ▸ aviso: «No se pudo borrar. La categoría sigue estando.»
```

---

## F19 — Cambiar de carpeta

**No mapea a un job.**

```
Menú → Ajustes → ficha Recetario → Cambiar carpeta
  ▸ la pantalla de F8, con el título «Cambiar carpeta», volver, y el párrafo
    «La carpeta actual queda como está en Drive. La app va a usar la que elijas.»
  → elijo o creo otra carpeta → Usar
  ▸ el mismo setup de F8
  ▸ el _indice de la carpeta anterior queda anotado como reemplazado
  ▸ la app recarga en el Recetario, sobre la carpeta nueva
```

La carpeta anterior sólo pierde la marca: sus recetas y su `_indice` siguen en
Drive. La anotación hace que otro dispositivo con la copia local de la carpeta
anterior deje de usarla y busque la marcada.

---

## Cobertura de jobs

Criterio de completitud del hito: para cada job, el camino completo desde que la
app se abre hasta que el job está cumplido.

| Job | Flujo | Camino de pantallas |
|---|---|---|
| J1 — Recuperar por nombre | F3 | Recetario → Resultados → Receta |
| J2 — No perder lo que encontré | F1 | *(app externa)* → Editor → Receta |
| J3 — Convertir en receta completa | F2, F9 | Menú → Borradores → Editor → Receta → *(agente)* → Editor → Receta |
| J4 — Buscar con lo que tengo | F4 | Recetario → Resultados → Receta |
| J5 — Mirar sin buscar | F5, F16, F17 | Recetario → Categoría o Lista por tag → Receta |
| J6 — Seguir la receta cocinando | F6 | Receta → Modo cocina |
| J7 — Corregir | F7 | Receta → Editor → Receta |
| J8 — Legible sin la app | F9, F12 | *(fuera de la app: los `.md` en Drive)* |
| J9 — Planificar | F13 | Menú → Plan de la semana → Agregar al plan · Lista de compras |

Los nueve jobs tienen camino. J8 es el único que no se cumple **en** la app: se
cumple porque el archivo existe afuera y la app no lo estorba.

F8, F14, F15, F18 y F19 no mapean a un job: son el arranque, compartir y el
mantenimiento del recetario.
