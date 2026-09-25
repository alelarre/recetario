# Arquitectura frontend: navegación, velo y componentes

## Objetivo

Hay que arreglar todo lo que marcó el diagnóstico de la arquitectura frontend. Las causas de fondo son cuatro:

- `main.ts` concentra el estado y el cableado de todo.
- La navegación no tiene una sola regla.
- El velo no es uniforme.
- La lista de recetas, el gestor de fotos, el visor y los carruseles no tienen dueño propio.

También se cierran los cuatro puntos de P84.

## Decisiones del usuario

- **El favorito queda como está**: estrella animada y sin velo.
- **El reindexado muestra su barra de progreso sobre un velo que bloquea.** No se puede navegar ni tocar nada mientras corre.
- **Los borradores existen sólo en la sección Borradores del menú.** No aparecen en ninguna otra lista, búsqueda ni selector.
- Se arregla **todo** lo que marcó el diagnóstico.

---

## 1. Navegación

### Un solo módulo

`src/navegacion.ts` es el único lugar que toca `location` y `history`, y tiene una sola regla para saber si hay una pantalla atrás. Salvo el arranque, que se describe más abajo, nada fuera de ese módulo llama a `location.hash =`, `location.replace`, `history.back`, `history.go`, `pushState` ni `replaceState`.

**La profundidad** es la cantidad de pantallas de la app que hay atrás. Viaja en `history.state` como `{ profundidad: n }`.

- Al arrancar, la entrada actual queda con 0.
- Cada entrada nueva recibe la profundidad de la anterior más uno. Si llegó por un `<a href>` y no por el módulo, se la numera en el `hashchange`, porque trae `state` en `null`.
- Volver a una entrada anterior la recupera de su `state`.
- `history.length` no se usa, porque cuenta las entradas de adelante y las de otros sitios.

**La API:**

| Función | Qué hace |
|---|---|
| `ir(hash)` | Agrega una entrada. |
| `reemplazar(hash)` | Reemplaza la entrada actual. Hoy es `irCerrando`. |
| `hayAtras(n = 1)` | `profundidad >= n`. |
| `volver(respaldo, n = 1)` | Si `hayAtras(n)`, retrocede `n` entradas. Si no, `reemplazar(respaldo)`. |
| `salirDe(prefijo, respaldo)` | Retrocede hasta la primera entrada cuyo hash no empieza con `prefijo`. El módulo lleva en memoria los hashes de las entradas de la sesión. Si no hay ninguna, `reemplazar(respaldo)`. |

**Adónde lleva cada salida:**

| Salida | Destino |
|---|---|
| Volver del encabezado | `volver('#/')` |
| Salir sin guardar | `volver('#/')` |
| Guardar una receta que ya existía | `volver('#/r/<id>')` |
| Guardar una receta nueva | La receta creada: `reemplazar('#/r/<id>')` (decisión). Hoy volvía a la pantalla de antes del menú. Así termina igual que *Convertir con Agente*. |
| Convertir con Agente | Termina en la receta, igual que Guardar. |
| Guardar o borrar una categoría | `volver('#/categorias')` |
| Borrar una receta | Vuelve hasta salir de la receta: retrocede las entradas `#/r/<id>…` (la receta y su editor, o sólo el editor si se abrió desde Borradores). Sin nada atrás, `reemplazar('#/')`. La receta borrada no queda en el historial. |
| Elegir una receta en *Agregar al plan* | `volver('#/plan')`. Una sola entrada y un solo dibujo. |
| *Salir* del modo cocina | Vuelve hasta salir de la receta, a donde se la eligió: la categoría, los resultados, el plan. Sin nada atrás, `reemplazar('#/c/<categoría>')`. |
| El chevron del modo cocina | `volver('#/r/<id>')`. Lo usan igual la app y el invitado. |

El router deja de exportar `ir` y `atras`, que no usa nadie.

### Lo que está abierto se cierra con atrás

Cuatro cosas se abren sin cambiar de ruta:
- el menú lateral en el teléfono;
- el visor de fotos;
- la ficha de compartir y las fichas de fotos del editor;
- la categoría elegida en *Agregar al plan*.

Al abrirse, cada una **suma una entrada al historial**: el mismo hash, con `state.capa` puesto. El atrás de Android o del navegador la cierra en vez de salir de la pantalla. Cerrarla de otra forma (el velo, la cruz o un destino) consume esa entrada, así el historial no queda con entradas de más. El chevron interno de *Agregar al plan* hace lo mismo que el atrás.

### Cambiar de pantalla

`cambiaDePantalla` compara la vista y **todos** los parámetros, no sólo `id` y `nombre`. Por eso:
- entrar a *Nueva receta* desde el menú, cuando ya había una abierta con algo compartido, pregunta si hay cambios;
- cambiar la búsqueda, el día o la comida de *Agregar al plan*, o el parámetro de la carpeta, limpia el estado de la pantalla.

### La pregunta de cambios sin guardar

Si al editor se lo deja con un destino nuevo (un link del menú o un `<a>`), esa navegación se deshace con `history.back()`, sin sumar otra entrada, y el destino queda anotado.
- *Seguir editando* no deja nada en el historial.
- *Salir sin guardar* hace `ir(destino)`.

El atrás sigue funcionando como hoy.

### El menú lateral

- **Una sola fuente.** `router.ts` exporta `MENU: Partial<Record<Vista, DestinoLateral | null>>`, con las pantallas que son destino del menú y qué entrada marcan. *Nueva receta* no marca ninguna. De ahí salen:
  - el gesto;
  - la hamburguesa en vez del volver;
  - el `activo` del lateral.
- **Una sola forma de pasarle el menú a una pantalla:** `menu?: { activo: DestinoLateral | null; abierto: boolean; borradores: number }`. Las cinco pantallas del menú lo reciben así.
- La lista por tag deja de usar el menú como bandera de «es Borradores»: recibe `borradores: true` aparte.
- **Tocar el destino en el que ya se está** cierra el menú y no navega.
- **Desde 900 px el lateral se dibuja en todas las pantallas** y queda fijo, también en la receta, la categoría, los resultados, el editor, *Agregar al plan* y compras. En pantallas angostas sólo lo abren la hamburguesa o el gesto de las pantallas del menú.
- **260 y 900 viven en TS** (`ANCHO_MENU` y `ANCHO_MENU_FIJO` en `gesto-menu.ts`). Un test verifica que el CSS use los mismos valores.

### Arranque y código muerto

- El arranque dibuja una sola vez: sin `render` después de un `location.replace`, y sin `hashchange` y `router.iniciar` que dupliquen el dibujo.
- Se borran:
  - la rama `vista === 'cocinar'` de la acción `volver`;
  - la copia de `volver-receta` en `invitado.ts`.
- El comentario de `lateral` pasa a nombrar las cinco entradas.

---

## 2. El velo

### Un solo mecanismo, tres formas

`src/velo.ts` es el dueño del velo:

| Función | Uso |
|---|---|
| `escribir(tarea)` | Una escritura. Tapa desde el toque y cierra con el tilde. |
| `esperar(tarea)` | Una espera que no escribe. Tapa sin tilde. Si la espera termina en menos de 250 ms, el velo no llega a verse (decisión). |
| `conProgreso(tarea)` | El reindexado y la preparación de la carpeta base. Tapa con la barra de progreso y un texto. |

Mientras cualquiera de las tres está activa no se navega ni se toca nada, igual que hoy con `tapadas`.

### Todas las escrituras cierran igual

Cada operación usa `escribir`, que cierra con el tilde. Después se navega y el velo se saca cuando la pantalla nueva está pintada:
- guardar, crear y borrar una receta;
- *Convertir con Agente*, cuyo velo cubre también bajar las fotos y abrir el agente, con el tilde al final;
- crear, editar y borrar una categoría;
- en el plan: agregar, sacar y reiniciar;
- crear la carpeta base.

**Quedan afuera:**
- el favorito;
- las que no esperan a la red: Pegar, armar el link de compartir, mandar al agente desde el aviso, elegir la carpeta en el Picker (el Picker es la espera), *Conectar de nuevo* (el popup de Google es la espera), y *Borrar datos locales* y *Salir* (recargan la página).

**Usan `esperar`:**
- achicar fotos (cámara, galería, compartidas y la foto propia de una categoría);
- traer una foto por URL, con un solo `esperar` que cubre bajarla y achicarla;
- leer las fotos compartidas;
- armar la lista de compras;
- las lecturas de red al dibujar la receta, el editor y el plan (decisión).

**Una operación, un envoltorio.** Se terminan los `tapar()` con un `escribiendo()` adentro.

**Sin «Guardando…» en los botones.** Ningún botón cambia su texto ni se deshabilita: el velo ya bloquea y dice que se está trabajando. *Convertir con Agente* conserva su ícono.

**Guardar una receta nueva** deja la receta creada en memoria, igual que al editar. La pantalla de destino se dibuja sin volver a leer, así que el redibujo no se ve.

### Durante el tilde

El velo sigue bloqueando el toque y el scroll hasta que la pantalla de destino está pintada (decisión). Se corrigen los comentarios que decían lo contrario.

### El reindexado y la carpeta base

`conProgreso` muestra el mismo velo. En lugar de la olla dibuja una tarjeta centrada con el texto («Reindexando…» o «Preparando la carpeta…») y la barra, de 0 a 1, con los tramos de hoy.

- Lo usan:
  - *Ajustes → Reindexar*;
  - el reindexado al arrancar, que deja de ser la pantalla `creando-indice`;
  - crear o elegir la carpeta base y prepararla, incluido `marcarReemplazada`.
- La barra se dibuja adentro del velo y no en la pantalla de atrás, así nunca pinta encima de otra pantalla.
- **Si falla**, el velo se va y la pantalla desde la que se lanzó muestra un aviso con *Reintentar*: «No se pudo reindexar.» o «No se pudo preparar la carpeta.». Hoy la barra queda congelada.

### La olla

- El design system pasa a decir: **la olla es «la app está ocupada y no se puede tocar»**, sea una escritura o una espera. El spinner queda sólo para lo que no bloquea, como el botón del PDF.
- §6.17b describe la tapa como la dibuja el CSS: oculta mientras se revuelve y puesta en el cierre.
- R8 en E05 se reescribe con estas reglas.

---

## 3. Los borradores, sólo en Borradores

**Una receta con `borrador` no aparece en:**
- la categoría;
- las listas por tag;
- los resultados de búsqueda, en ninguno de sus tres grupos, ni como motivo;
- el Menú diario;
- *Agregar al plan*, ni en su búsqueda ni en sus categorías;
- el conteo de los tiles del home.

**Sí aparece:**
- en `#/borradores`;
- en el contador del menú;
- abierta por su link;
- en un plan que ya la tenía de antes.

**El store** lo resuelve en un solo lugar:
- `buscar` y `buscarPorTexto` excluyen `borrador` salvo que se lo pida explícitamente, con `{ tags: ['borrador'] }`;
- `categoriasConConteo` no lo cuenta.

**El home vacío con borradores:**
- sin recetas terminadas pero con borradores: «Todavía no hay recetas terminadas. Hay N en Borradores.»;
- sin nada: el texto de hoy.

---

## 4. Componentes

### Lista de recetas

- **`src/ui/lista-recetas.ts`** es el componente: tarjeta, orden, filtros de duración y tags, y paginado.
- **Su controlador** (`src/lista-control.ts`) es el dueño del estado: `tagsActivos`, `duracionesActivas`, `orden`, `visibles` y el observador del tramo.
- **Lo usan cinco pantallas:** categoría, lista por tag, Borradores, resultados y *Agregar al plan*.
- El orden se aplica una sola vez, en el controlador: las favoritas primero y después A–Z o por duración.
- **Resultados y *Agregar al plan*** paginan igual que la categoría.
- ***Agregar al plan* usa la misma lista agrupada que resultados**, con el mismo orden y la misma frase de vacío. Deja de tener una copia.
- **El observador del tramo** busca el spinner de su propia lista, no el primero de la pantalla.
- **La búsqueda de *Agregar al plan*** redibuja su bloque por el camino común, que completa las fotos. Hoy no las carga.
- **La línea del plan** (`plan.ts`, `linea`) no pasa a ser tarjeta (decisión): es un renglón de una comida, no una lista de recetas.
- **CSS:**
  - `.tarjeta`, `.bor` y `.carp` comparten una base, `.fila`, en `tokens.css`.
  - `.lista`, `.rot`, `.grupo-res`, `.tile`, `.fila-dur` y `.orden` pasan a `tokens.css`.
  - Se borra la regla suelta `.foto`.

### Gestor de fotos

- **`src/fotos-control.ts`** es el único dueño del depósito del editor:
  - las fotos y su número;
  - las nuevas en memoria, con sus blobs y sus URLs;
  - las ya subidas;
  - la portada.
- Los campos ocultos del formulario se escriben desde el controlador y nunca a mano. Cada cambio pasa por una sola función, que:
  - actualiza el estado;
  - reescribe los ocultos;
  - redibuja la fila y la portada;
  - acomoda el botón de poner foto;
  - completa las imágenes.
- **Una sola entrada para sumar fotos**, `sumarFotos(blobs)`: achica, numera con `siguienteNumero` y guarda. La usan la cámara, la galería, las compartidas y *Por URL*.
- *Por URL* pierde la capa que quedó de la captura.
- **`filaDeFotos`** queda con lo que usa el editor. Salen:
  - la cruz de sacar y su CSS;
  - `agregar: false`;
  - `porUrl` opcional;
  - `n` opcional;
  - `url: null`.
- **Un solo cuadro de foto.** `cuadroDeFoto(foto)` en `componentes.ts` dibuja el `<img data-n>` o el `<img data-drive>`, y una clase, `.cuadro-foto`, reúne el CSS que hoy está repetido en cinco lugares.
- **`sacarFoto`**, cuando una foto de Drive ya no está, reconoce el cuadro por esa clase. Así la portada del editor, la muestra de la categoría y la cabecera de la receta muestran el aviso de foto ausente.
- **Sacar una foto** libera su object URL.
- **La foto de una categoría:**
  - la muestra se dibuja por un solo camino, que reusa `tile()`;
  - las fotos del catálogo y la propia usan el mismo `<img>`;
  - el valor `propia:<blobURL>` deja de viajar en un campo oculto: lo guarda el controlador.

### El visor

- **`src/visor-control.ts`** tiene el estado (las URLs, cuál se ve), el gesto para pasar de foto y el cierre que ignora el click que sigue a un deslizamiento. Lo usan `main.ts` e `invitado.ts`, sin copias.
- `renderVisor` deja de escribir `data-i` y `data-total`, que no lee nadie.
- Abrir el visor suma una entrada al historial (§1).

### Carruseles

- **La fila de duraciones pasa a ser un `carrusel()`**, con degradé, flechas con mouse y la misma alineación que la fila de tags.
- **El componente marca su fila con `data-deslizable`**, y el gesto del menú excluye cualquier `[data-deslizable]`, sin una lista de selectores.
- Las acciones `carrusel-izq` y `carrusel-der` viven en un solo módulo, que usan la app y el invitado.
- Se corrige el margen doble entre filas: el `gap` de `.cuerpo` es el único separador.
- `.carrusel-fotos` sigue en `tokens.css` (decisión): lo comparten la receta y el invitado.

---

## 5. `main.ts`

- **El estado de pantalla** es un objeto que se crea nuevo al cambiar de pantalla, `estadoDePantalla = estadoNuevo()`, en lugar de resetear a mano más de 30 variables.
  - Lo que sobrevive entre pantallas es explícito y va aparte: los cachés, `menuAbierto` y `fotosEditor` mientras dura el editor.
- **Las acciones se registran por módulo** en un mapa `accion → función`: navegación, lista, fotos, visor, carrusel, plan, categorías y editor. El listener de click sólo busca en el mapa. Se termina la cadena de 75 `if`.
- **Un solo camino para dibujar una parte de la pantalla:** `pintarParte(elemento, html)`, que completa las fotos igual que `pintar`. Pasan por ahí:
  - el bloque de *Agregar al plan*;
  - la fila de fotos;
  - las fichas;
  - el visor;
  - las confirmaciones;
  - los tags y los avisos del formulario.

---

## 6. P84

- **El encabezado fijo no tapa los avisos:** `html { scroll-padding-top: 64px }`, la altura del encabezado más alto. Así `scrollIntoView` deja el aviso a la vista.
- **El home con sólo borradores:** §3.
- **La búsqueda con `borrador`:** §3.
- **Tocar el destino actual del menú:** §1.

---

## Documentación

Se actualiza en el mismo trabajo:
- **E05:** R8 (velo, tilde, esperas, el reindexado con barra) y C05.10.1 (el lateral fijo en todas las pantallas desde 900 px).
- **E02:** los borradores fuera de las listas y de la búsqueda, y el home vacío.
- **E03:** Agregar al plan.
- **E04:** la salida del editor y adónde lleva Guardar.
- **La IA:** §4.6, el menú, y el historial de lo que se abre en la misma pantalla.
- **`design-system.md`:** la olla, §6.17b, la fila, el cuadro de foto y el carrusel de duraciones.
- **`CLAUDE.md`:** el mapa de `src/`, con los módulos nuevos.

## Fuera de alcance

- Cambiar el aspecto de la olla o del tilde.
- Pasar a un framework.

## Tests

Cada módulo nuevo es puro o se prueba con el DOM falso:
- **`navegacion`:** profundidad, `volver` con y sin historial, `n = 2`, entradas que llegan por `<a>`, capas.
- **`velo`:** las tres formas, los 250 ms, el contador, el error del progreso.
- **`lista-control`:** orden único, paginado, filtros.
- **`fotos-control`:** sumar, sacar, portada, ocultos, `revokeObjectURL`.
- **`visor-control`:** estado y gesto.
- **Store:** los borradores fuera de `buscar`, `buscarPorTexto` y `categoriasConConteo`.
- **`main-rutas`:** cada salida de la tabla de §1, el atrás cerrando las capas, *Nueva receta* con cambios, el lateral fijo en la receta desde 900 px, el reindexado bloqueando la navegación, y la búsqueda de *Agregar al plan* con fotos.
