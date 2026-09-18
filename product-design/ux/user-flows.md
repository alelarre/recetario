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
Estoy viendo un reel / una página / un video
  → Compartir del sistema
  → elijo Recetario en la hoja de compartir
  ▸ lo compartido llega en la query y la app lo pasa a #/capturar
  ⚑ ¿lo compartido es una receta en .md?
      sí  → no es una captura: sigue en F2, «La vuelta»
  ▸ se abre la pantalla Captura —«Guardar en Recetario»—, con la fuente ya cargada
  → escribo el título          ⚑ único campo obligatorio; la nota es opcional
  → Guardar
  ▸ se escribe el .md del borrador en _borradores/ y su fila en la hoja borradores
  ▸ la app se cierra y vuelvo a donde estaba
```

**Decisiones que este flujo fija:**

- **Un solo campo obligatorio.** No pide categoría, ni tags (principio 2). La fuente viene de lo compartido y no se escribe a mano: muchas apps mandan el link en el texto, así que viajan los dos. El título de la página no viaja: el de la receta lo escribe el usuario. La nota está para lo que haga falta anotar, y no se exige.
- **La app no queda abierta.** La captura termina donde empezó: en la app donde estaba. Si el navegador no deja cerrar la pestaña, queda en Borradores, que es donde está el borrador nuevo.
- **Se escribe en Drive, no local.** Principio 1.

**Camino de error:**

```
  → Guardar
  ✗ no hay red
  ▸ aviso: «No se pudo guardar. Revisá la conexión.»
  ⚑ el texto queda en pantalla para reintentar con Guardar
  ✗ si cierro, se pierde
```

Está aceptado explícitamente (principio 1 + 4): no hay cola local. Es el único
punto donde el producto acepta a sabiendas un riesgo sobre el job huérfano.

**La captura a mano** es la misma pantalla, desde *Borradores → Nuevo*: título,
fuente y nota, y al guardar queda en Borradores.

**iOS no se soporta:** no tiene Share Target y el Atajo equivalente queda fuera
del alcance. Android es la plataforma (`E05-Cimientos.md` R7).

---

## F2 — Convertir un borrador en receta

**Job:** J3. Ocurre sentado, con atención completa, **antes de ponerse a
cocinar** — no cuando se encontró la receta.

Hay tres caminos, y los tres terminan en la misma operación de la capa
compartida (`information-architecture.md` §2.2): escribe el `.md`, escribe la
fila del índice y descarta el borrador —su `.md` a la papelera, su fila afuera—.
Nadie borra el borrador por separado.

**1. Convertir con Claude.** La app no llama a ningún modelo: arma el pedido, y
recibe de vuelta la receta para revisarla y guardarla.

```
Menú → Borradores           ⚑ el contador dice cuántos esperan
  → toco una entrada
  ▸ Borrador: título, fuente y nota
  → Convertir con Claude
  ▸ la app arma el pedido: el borrador, su id y las reglas del formato
  ⚑ ¿hay menú Compartir del sistema?
      sí (Android)  → se abre con el pedido como texto; elijo Claude
      no (la Mac)   ⚑ ¿el pedido entra en un link de 8.000 caracteres?
                        sí  → se abre claude.ai/new con el pedido cargado
                        no  → se copia, se abre claude.ai/new
                              ▸ aviso: «Pedido copiado: pegalo en Claude»
  ▸ Claude lee la fuente y responde sólo con el .md de la receta
```

**La vuelta** no depende de la ida: cualquier receta en `.md` que llegue a la
app abre el editor, empiece donde empiece la conversación.

```
La respuesta de Claude
  ⚑ ¿cómo vuelve?
      compartida  → Compartir → Recetario      (llega a #/capturar, como F1)
      pegada      → la copio → Pegar receta, en el Borrador o en Borradores
  ▸ la app limpia lo que llega: bloque de código, cita con >, texto alrededor
  ⚑ ¿es una receta? (frontmatter entre --- con una línea titulo:)
      no, compartida  → se captura como borrador (F1)
      no, pegada      ✗ aviso: «Lo copiado no es una receta en .md.»
  ⚑ ¿de qué borrador es?
      pegada dentro de un Borrador              → de ese, traiga el id que traiga
      trae borrador: <id> y ese borrador existe → de ese
      si no  ▸ «¿De qué borrador es esta receta?»: la lista, y Ninguno
             → elijo uno, o Ninguno            ⚑ volver descarta lo recibido
  ▸ el editor abre con la receta cargada, sin categoría y con el tag incompleta
  → reviso, elijo la categoría           ⚑ la clasificación es siempre mía
  → Guardar
  ▸ atada a un borrador: la operación de conversión
  ▸ con Ninguno: se crea como cualquier receta nueva
```

El pedido se arma con las mismas constantes que usa la app —las claves del
frontmatter, las cinco duraciones, las tres dificultades, los tags reservados—,
así que no se desactualiza cuando cambia el esquema. Pide no inventar lo que la
fuente no dice y no agregar datos nutricionales. La clave `borrador` que trae la
respuesta no se muestra ni se guarda. El editor cuenta la receta recibida como
cambios sin guardar: salir pregunta.

```
  ✗ el navegador no deja leer el portapapeles
  ▸ aviso: «No se pudo leer lo copiado.»
```

**2. Crear la receta, a mano.** Para una receta que ya tenés en la cabeza.

```
Borradores → toco una entrada → Crear la receta
  ▸ el editor abre con título y fuente cargados
  → elijo la categoría y escribo la receta
  → Guardar
  ▸ la misma operación: escribe el .md, escribe la fila, descarta el borrador
```

**3. Un agente por fuera de la app**, con acceso al Drive: lee el borrador,
extrae la receta, propone carpeta y tags, el usuario confirma, y escribe. Ver F9.

**Desde el borrador también se puede** *Editar* —título, fuente y nota— y
*Descartar*, que pide confirmación y manda el `.md` a la papelera de Drive.

---

## F3 — Buscar una receta por nombre

**Job:** J1, el más frecuente. Dos toques.

```
Recetario
  ▸ la búsqueda está arriba, visible, no detrás de un ícono
  → escribo parte del nombre
  ▸ resultados mientras escribo
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
  → escribo "berenjena"
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
```

**La lectura no tiene pestañas:** costaban cuatro toques para leer una receta
entera y escondían las notas. **El conmutador existe sólo en el modo cocina**,
donde notas y variaciones no se muestran; conmutar conserva la posición de
scroll de cada lado. **El sol es manual a propósito:** no siempre hace falta, y
arranca apagado cada vez. Si la app pasa a segundo plano con el sol encendido, al
volver se pide de nuevo. Si el navegador no lo soporta, el sol no se muestra.

**Las variaciones se leen en la receta**, en la misma columna, cada una con su
fuente.

---

## F7 — Corregir una receta

**Job:** J7. Un toque desde la receta.

```
Receta
  → Editar
  ▸ Editor
  → corrijo el error, o agrego una variación
  ⚑ también acá: la categoría, la duración —cinco botones—, los cuatro tags
    especiales —un botón cada uno— y Borrar receta
  → Guardar
  ▸ se reescribe el .md
  ▸ se actualiza su fila en el índice
```

**El editor corrige, no compone.** Componer es trabajo del agente
(`product-vision.md` §1).

**El tag `incompleta` no se puede sacar** sin título, categoría, al menos un
ingrediente y al menos un paso. **Borrar receta** pide confirmación y manda el
`.md` a la papelera de Drive.

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
      ninguna   → Selector, con las carpetas propias llamadas Recetario como «Encontradas»
      varias    → Selector, con las marcadas como «Encontradas»
  ⚑ ¿existe _indice adentro?
      sí  → arranca
      no  → lo crea, leyendo los .md, con progreso: «Creando el índice: 12 de 60.»
  ▸ Recetario
```

**El selector — «Elegí la carpeta de tus recetas»:**

```
Selector
  ▸ «Encontradas», si hay; y «Mi unidad» con sus carpetas propias
  → toco una carpeta: entro a su nivel        ⚑ volver sube un nivel
  ⚑ tres maneras de elegir
      toco una de «Encontradas»
      Usar esta carpeta                       ⚑ no se ofrece en «Mi unidad»
      Crear una carpeta nueva acá → nombre (precargado: Recetario) → Crear
  ▸ confirmación: «Voy a usar <carpeta>. Si faltan categorías, las creo, y
    después indexo lo que haya adentro.»
  → Usar
  ▸ setup:
      ▸ crea las predefinidas que falten, de las 16, con su color y su foto
      ▸ busca _indice adentro; si no está, lo crea con sus cuatro hojas
      ▸ reindexa, con progreso
      ▸ marca la carpeta, y le saca la marca a cualquier otra
  ▸ la app recarga en el Recetario
```

Sólo aparecen carpetas propias: ni las compartidas ni las unidades compartidas.
**La marca va última:** si algo falla antes, la carpeta queda sin marcar y la
próxima apertura vuelve al selector. Repetir el setup no duplica nada: cada paso
hace sólo lo que falta.

```
  ✗ el setup falla a mitad
  ▸ aviso con Reintentar, que lo repite sobre la misma carpeta
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
El agente escribe un .md en una carpeta de categoría
  ▸ y escribe su fila en el índice, con la capa compartida
  → abro la app
  ▸ la fecha de _indice cambió: la app baja la planilla
  ▸ la receta está
```

**No hay detección de cambios, ni Changes API, ni "3 recetas nuevas".** La app no
descubre sola lo que se escribe afuera: la receta está disponible porque el
agente actualizó el índice.

**Tampoco hace falta avisar:** la conversión la disparó el usuario y es
just-in-time, antes de cocinar. Sabe que llegó porque la pidió.

**Camino de error — el agente escribió el `.md` pero no el índice:**

```
  ✗ la receta existe en Drive y no aparece en la app
  ⚑ la salida es reindexar: Menú → Ajustes → Reindexar
```

Es reparable por diseño: el índice es derivado y los `.md` son la verdad
(principio 1). **Es el caso del conector de Google Drive de claude.ai**, que crea
archivos pero no escribe planillas: después de cargar recetas con él hay que
reindexar. El camino que no lo necesita es F2, «Convertir con Claude»: el agente
devuelve el `.md` y guarda la app. Rehacer el skill del agente está pendiente
(`../../BACKLOG.md`, P14).

---

## F10 — Sin conexión

**Transversal.** Sin Drive no hay app: es consecuencia aceptada de que el
archivo sea la única fuente de verdad.

```
⚑ ¿hay red?
    no, al abrir      → aviso: «No se pudo conectar con Drive. Sin esa lectura no hay con qué dibujar.», con Reintentar.
                        La copia local del índice no se usa: la consulta a Drive va antes.
    no, al guardar    → aviso: no se pudo guardar. El texto queda en pantalla.
    no, al capturar   → ver F1.
    no, al marcar favorita → aviso: no se pudo marcar. La estrella queda como estaba.
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
  ▸ progreso: «Reindexando: 12 de 60.»
  ▸ Recetario
```

**Reindexar no se cancela:** cortar a mitad deja el índice en el estado que el
reindexado existe para reparar. Mientras dura no se puede guardar ni borrar
recetas. Puede tardar: los `.md` se leen de a uno.

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
            ⚑ ¿lleva el tag incompleta?
                sí  → con su marca en la esquina de la tarjeta
            ⚑ ¿tiempo o dificultad fuera de sus valores?
                sí  → se leen como sin dato; el archivo no se toca
  ▸ los ignorados se informan en Ajustes → Avisos, con su nombre, no en la cara
```

**Se lee lo que llega** (principio 3). Una clave o una sección que el esquema no
conoce se muestra o se ignora, y se conserva al guardar. La app nunca deduce la
completitud del contenido: una receta es incompleta si lleva el tag, y lo lleva
porque nació con él o porque el usuario se lo puso.

**La salida manual:** cuando la receta está terminada, el usuario suelta el botón
*incompleta* en el editor y la marca desaparece.

---

## F13 — Planificar la semana y armar la compra

**Job:** J9. La entrada es una sola —el menú lateral— y no ocupa navegación
primaria (principio 6).

```
Menú lateral → Plan de la semana
▸ siete días desde hoy, dos comidas cada uno   ⚑ sin fechas: hoy primero y da la vuelta
  → toco el + de una comida
  → Martes a la noche
  ▸ la búsqueda arriba, el bloque «Menú diario» debajo
  → toco una receta                            ⚑ sólo recetas del recetario
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

- **El PDF** se arma en el teléfono: 105 × 180 mm, tema oscuro, con texto de verdad. El menú Compartir sólo se abre desde un toque del usuario: si el toque ya venció cuando el PDF termina, *Enviar PDF* es el segundo.
- **El link** lleva la receta comprimida en el fragmento, sin los tags. No usa Drive ni pide login a quien lo abre: ver F15.
- **El texto** conserva `*negrita*`, `_itálica_`, `- ` y `1. `, que WhatsApp entiende.
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
  ▸ Vista de invitado: la receta entera, sin tags
  → Cocinar
  ▸ Modo cocina, igual que en F6, con una sola salida: volver a la receta
```

**Es una pantalla con su propio controlador y una lista cerrada de acciones:**
cocinar, volver, conmutar, marcar un paso y la pantalla encendida. No hay editar,
ni favorito, ni compartir, ni menú.

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
  ▸ en toda lista, la receta va primero, con su marca en la esquina de la tarjeta
```

**El resultado se dibuja cuando Drive contesta, no antes.** Tocarla de nuevo saca
el tag. `favorito` es un tag de la lista `tags` como cualquier otro: no hay clave
ni columna nueva.

```
  ✗ no hay red
  ▸ aviso: «No se pudo marcar como favorita. Revisá la conexión.»
  ▸ la estrella queda como estaba
```

Los otros tres especiales —`menú diario`, `probar`, `incompleta`— se ponen y se
sacan desde el editor (F7).

---

## F17 — Filtrar por tag y por duración

**Job:** J5.

```
Recetario
  ▸ el carrusel de tags: los cuatro especiales primero, después por cantidad
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
                     ▸ confirmación: cuántas recetas se van, cuáles, y a dónde
                     → Borrar <categoría> y N recetas
                     ▸ la carpeta va a la papelera de Drive con sus recetas adentro
                     ▸ salen del índice
```

- **Todas las categorías se tratan igual**, predefinidas o no.
- **El nombre de la categoría de una receta sale de su carpeta:** renombrar no reescribe ningún `.md`.
- **El color** se elige entre los quince de la paleta y el neutro; **la foto**, entre las del catálogo. La muestra del tile se actualiza mientras se elige.
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
  ▸ el Selector de F8
  → elijo o creo otra carpeta → Usar
  ▸ confirmación, con una línea más: «Tu carpeta actual queda como está en Drive.»
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
| J2 — No perder lo que encontré | F1 | *(app externa)* → Captura → *(vuelvo)* |
| J3 — Convertir en receta completa | F2, F9 | Recetario → Borradores → Borrador → *(Claude)* → Editor → Receta |
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
