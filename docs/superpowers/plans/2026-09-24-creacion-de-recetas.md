# Plan — Creación de recetas: una sola entidad

> **Para agentes:** usar superpowers:subagent-driven-development o
> superpowers:executing-plans, tarea por tarea. Los pasos llevan `- [ ]`.

**Objetivo:** que el borrador deje de ser una entidad aparte. Pasa a ser un tag
especial de la receta, y el editor queda como el único formulario.

**Arquitectura:** primero el dominio puro (tags, pedido, lo compartido),
después el store (`_sin-categoria/` y sacar borradores), después el editor, y al
final el cableado en `main.ts` y el service worker. El orden permite que cada
tarea compile y deje los tests en verde.

**Spec:** `docs/superpowers/specs/2026-09-24-creacion-de-recetas-design.md`.

## Reglas para todas las tareas

- Cada tarea empieza por el test: primero falla, después pasa.
- Al cerrar cada tarea tienen que quedar en verde `npm test` y
  `npm run typecheck`. Al final, también `npm run build`.
- **Nada se commitea hasta que el usuario revisa el diff** (`CLAUDE.md`).
- Todo va en español rioplatense: UI, comentarios y nombres.
- Los comentarios no citan entradas del backlog ni este spec. Dicen la razón
  vigente. Sí pueden citar `product-design/`.
- Un test que probaba algo que se borra se borra con el código, no se adapta.

## Nombres que cruzan tareas

```ts
// src/catalogo.ts
TAGS_ESPECIALES = ['favorito', 'menú diario', 'probar', 'borrador']
// FORMAS_ALTERNATIVAS.borrador = ['borradores', 'incompleta', 'incompleto', 'incompletos', 'incompletas']
coincideTag(escrito: string, buscado: string): boolean   // igual, o el mismo especial

// src/config.ts
NOMBRE_SIN_CATEGORIA = '_sin-categoria'     // reemplaza a NOMBRE_BORRADORES
SCHEMA_VERSION = 7

// src/store.ts
CATEGORIA_RAIZ = 'Sin categoría'            // el nombre visible de lo que no tiene categoría
store.crear(receta, { carpetaId?: string, fotos? })     // sin carpetaId → `_sin-categoria/`
store.guardar(id, receta, { carpetaDestino?: string, fotos? })
//   carpetaDestino '' → sin categoría: si ya está en la raíz o en `_sin-categoria/`, queda; si no, va a `_sin-categoria/`
//   carpetaDestino undefined → no se mueve

// src/compartido.ts  (reemplaza su contenido: `convertirBorrador` se va)
desdeCompartido({ url, text }): { fuente: string; nota: string }   // viene de borrador.ts, igual
tituloPorDefecto(fecha: Date): string                              // viene de borrador.ts, igual

// src/conversion.ts
pedidoDeConversion(
  { id, titulo, fuente, notas }: { id: string; titulo: string; fuente: string; notas: string },
  { fotos?: readonly string[]; links?: boolean }
): string                                       // pide `id: <id>` como última línea del frontmatter
recetaRecibida(texto: string): { receta: Receta; id: string }       // saca `id` de los extras

// src/ui/editor.ts
renderEditor({ receta, entrada, carpeta?: string, categorias, tagsConocidos, error?, confirmandoBorrado? })
//   `carpeta`: la elegida en el select; '' es «Sin categoría». Si falta, sale de `entrada?.carpeta_id`.
renderAccionesFoto(n: number): string          // Ver y Sacar; ya no recibe `{ portada }`

// src/ui/router.ts
'#/nueva?url=&text=&fotos=N'                    // lo compartido
'#/nueva?recibida=1'                            // una receta .md que llegó sin id conocido
'#/r/<id>/editar?recibida=1'                    // una receta .md cuyo id existe
hashDeCompartido(search) → '#/nueva?…' | null
```

---

### Tarea 1: El tag `borrador`

**Archivos:** `src/catalogo.ts`, `src/tipos.ts`, `src/recipe.ts`,
`src/ui/componentes.ts`, `src/ui/editor.ts`, `src/ui/fichas-receta.ts`,
`src/main.ts` (sólo los usos del literal), `src/store.ts` (`buscar`),
`src/ui/base.css`, `src/ui/tokens.css` y los tests que nombran `incompleta`
(`grep -rln incompleta src tests`).

- [ ] **Test primero:** `tests/catalogo-especiales.test.ts`.
  - `tagEspecial` da `'borrador'` para `borrador`, `Borradores`, `incompleta`
    e `INCOMPLETOS`.
  - `TAGS_RESERVADOS` incluye `borrador`, `incompleta` y `terminado`.
  - `conEspecial(['incompleta', 'pollo'], 'borrador', true)` da
    `['borrador', 'pollo']`: la forma vieja se reemplaza.
  - `conEspecial(['incompleta'], 'borrador', false)` da `[]`.
  - `coincideTag('incompleta', 'borrador')` es verdadero,
    `coincideTag('pollo', 'pollo')` también, y `coincideTag('pollo', 'borrador')`
    es falso.
- [ ] **Test primero:** en `tests/store-busqueda.test.ts`,
  `buscar({ tags: ['borrador'] })` encuentra una fila que tiene `incompleta`.
- [ ] Correr `npx vitest run tests/catalogo-especiales.test.ts tests/store-busqueda.test.ts`.
  Tiene que fallar.
- [ ] **Implementar:**
  - En `catalogo.ts`, `'incompleta'` pasa a `'borrador'` en `TAGS_ESPECIALES`
    y en `FORMAS_ALTERNATIVAS`, con las formas de arriba.
  - `coincideTag` compara con igualdad o, si `buscado` es especial, con
    `tagEspecial(escrito) === tagEspecial(buscado)`.
  - El comentario de `FORMAS_TERMINADO` dice «contradicen a `borrador`».
  - En `store.buscar`, `e.tags.includes(tag)` pasa a
    `e.tags.some(x => coincideTag(x, tag))`.
- [ ] **Cambiar el resto de los usos** del literal: `conEspecial(…, 'incompleta', …)`,
  `t === 'incompleta'` en `editor.ts` y `componentes.ts`, y `esp === 'incompleta'`.
  - Las etiquetas visibles: `incompleta: 'Incompleta'` pasa a
    `borrador: 'Borrador'`.
  - La leyenda del editor pasa a «Se va a poder sacar *borrador* cuando se
    cargue: título, categoría, ingredientes y pasos.».
  - Las clases CSS (`.inc`, `leyenda-incompleta`) pasan a `.borr` y
    `leyenda-borrador`. Los selectores de `base.css` y `tokens.css` cambian
    juntos, y también `tests/estilos-incompleta.test.ts`, que se renombra a
    `estilos-borrador.test.ts`.
- [ ] Actualizar los tests que esperan `incompleta` en el HTML o en los tags
  guardados. Los fixtures con `tags: [incompleta]` en el `.md` quedan así: son
  justamente el caso de la forma vieja.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 2: `_sin-categoria/` en el store

**Archivos:** `src/config.ts`, `src/store.ts`, `tests/store-escritura.test.ts`,
`tests/store-reconstruccion.test.ts`, `tests/dobles.ts`, `tests/config.test.ts`.

- [ ] **Tests primero:**
  - `store.crear(receta)` sin `carpetaId`:
    - crea la carpeta `_sin-categoria` en la raíz con `MIME_CARPETA` la primera
      vez, anota `carpeta_sin_categoria` en `meta` y escribe el `.md` adentro;
    - la segunda vez no crea otra;
    - la fila queda con categoría «Sin categoría».
  - `store.guardar(id, receta, { carpetaDestino: 'c1' })` de una receta en
    `_sin-categoria/` la mueve a `c1`.
  - `store.guardar(id, receta, { carpetaDestino: '' })`:
    - de una receta en `c1` la mueve a `_sin-categoria/`;
    - de una suelta en la raíz no la mueve.
  - `store.guardar` y `store.borrar` aceptan un id sin fila que está en
    `_sin-categoria/`. Hoy `delRecetario` sólo acepta la raíz y las categorías.
  - `reconstruir`:
    - lee los `.md` de `_sin-categoria/` con categoría «Sin categoría» y la
      carpeta como `carpeta_id`;
    - `_sin-categoria` no entra en `categorias`;
    - `meta.carpeta_sin_categoria` queda anotada.
  - `SCHEMA_VERSION` es 7 (`tests/config.test.ts`).
- [ ] Correr esos archivos: tienen que fallar.
- [ ] **Implementar:**
  - `config.ts`: se agrega `NOMBRE_SIN_CATEGORIA = '_sin-categoria'` y
    `SCHEMA_VERSION = 7`.
  - `store.ts`, en el contexto:
    - `CATEGORIA_RAIZ = 'Sin categoría'`;
    - `ctx.sinCategoriaId`, que se lee de `meta['carpeta_sin_categoria']` donde
      hoy se lee `carpeta_fotos` (`usarCopia` y `cargarIndice`);
    - `usarCategorias` suma `[ctx.sinCategoriaId, CATEGORIA_RAIZ]` al mapa
      `carpetas` cuando el id existe, así `delRecetario` y `conCategoria` la
      reconocen.
  - `carpetaSinCategoria()` se escribe como `carpetaDeFotos()`: la crea si
    falta, guarda la meta y la suma al mapa.
  - En `crear`, `const padre = carpetaId ?? await carpetaSinCategoria()`.
  - En `guardar`:
    - si `carpetaDestino === ''` y la carpeta actual no es `ctx.raizId` ni
      `ctx.sinCategoriaId`, el destino pasa a ser `await carpetaSinCategoria()`;
    - si `carpetaDestino === ''` y ya está en una de esas dos, no se mueve.
  - En `reconstruir`:
    - `nombre === NOMBRE_SIN_CATEGORIA` toma el id, igual que `_fotos`;
    - `lugares` suma `{ id: sinCategoriaId, categoria: CATEGORIA_RAIZ }` si existe;
    - al final, `guardarMeta('carpeta_sin_categoria', …)`.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 3: Sacar los borradores del store y del índice

**Archivos:** `src/store.ts`, `src/borrador.ts` (se borra), `src/compartido.ts`,
`src/tipos.ts`, `src/sheets.ts`, `src/indice-local.ts`, `src/config.ts`,
`src/ui/ajustes.ts`. Tests: `tests/store-borradores.test.ts` (se borra),
`tests/borrador.test.ts` (se borra, salvo lo de `desdeCompartido` y
`tituloPorDefecto`, que va a `tests/compartido.test.ts`),
`tests/compartido.test.ts`, `tests/store-reconstruccion.test.ts`,
`tests/store-indice-local.test.ts`, `tests/indice-local.test.ts`,
`tests/vista-ajustes.test.ts`, `tests/dobles.ts`.

- [ ] **Test primero:** en `tests/compartido.test.ts`, los casos de
  `desdeCompartido` y `tituloPorDefecto`, importados de `../src/compartido.js`.
  Se reemplazan los de `convertirBorrador`.
- [ ] **Test primero:** en `tests/store-reconstruccion.test.ts`, reconstruir no
  escribe la hoja `borradores` ni lee `_borradores/`, aunque la carpeta exista:
  un `.md` ahí no aparece en ninguna fila.
- [ ] Correr esos dos archivos: tienen que fallar.
- [ ] **Implementar:**
  - `src/compartido.ts` pasa a tener sólo `desdeCompartido`, `tituloPorDefecto`
    y `LINK`, movidos tal cual. El comentario de cabecera dice que es lo que
    llega por el menú Compartir.
  - Se borra `src/borrador.ts`.
  - `store.ts` pierde:
    - `borradoresId`, `entradasBorradores` y `filasBorradores`;
    - `escribirBorrador`, `subirFoto`, `agregarBorrador`, `editarBorrador`,
      `borradorConEntrada`, `agregarFotoABorrador`, `sacarFotoDeBorrador`,
      `descartarBorrador`, `borradores()` y `borrador()`;
    - la rama `deBorrador` de `subirYMover`;
    - la hoja y la meta de borradores en `reconstruir`, `cargarIndice`,
      `copiaActual` y `usarCopia`.
  - `aLaPapelera` se queda si la sigue usando `tirarFotos`.
  - `tipos.ts`: salen `Borrador`, `EntradaBorrador` y `deBorrador` de
    `CambiosDeFotos`.
  - `sheets.ts`: sale `HOJA_BORRADORES`.
  - `indice-local.ts`: sale `borradores` de `CopiaIndice`. Una copia vieja con
    ese campo igual se descarta por `schemaVersion`.
  - `config.ts`: sale `NOMBRE_BORRADORES`.
  - Ajustes: la ficha «Al abrir» deja de contar borradores.
  - La hoja `borradores` que ya existe en `_indice` queda sin tocar y sin leer.
- [ ] Sacar de `tests/dobles.ts` los métodos de borradores. Borrar
  `tests/store-borradores.test.ts` y `tests/borrador.test.ts`.
- [ ] `npm run typecheck` va a marcar los usos en `main.ts` y `src/ui/`. En esta
  tarea se arreglan sólo con lo mínimo para que compile, y en la Tarea 6 se
  reescriben:
  - se borran los `case` de `borradores`, `borrador`, `capturar` y `recibida`
    en `render`;
  - se borran las acciones que llaman a métodos que ya no existen;
  - el contador pasa a `store.buscar({ tags: ['borrador'] }).length`.
  - Los tests de `main-rutas` que prueban esas pantallas se borran acá.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 4: El pedido al agente y la receta que vuelve

**Archivos:** `src/conversion.ts`, `src/compartir.ts`, `tests/conversion.test.ts`,
`tests/compartir.test.ts`.

- [ ] **Tests primero:**
  - `pedidoDeConversion({ id: 'r1', titulo: 'Pan', fuente: 'https://x', notas: 'hidratación 75%' }, { fotos: ['f1'] })`:
    - empieza con «Convertí este borrador en una receta para mi Recetario»;
    - dice `Notas: hidratación 75%`;
    - pide `` `id: r1` `` como última línea del frontmatter;
    - no dice `borrador:`.
  - Con `links: true`, lleva `Foto 1: <link>`, como hoy.
  - `recetaRecibida('---\ntitulo: Pan\nid: r1\n---\n')` da `id: 'r1'` y los
    extras no tienen `id`. Sin `id`, da `id: ''`.
  - Con una receta vieja que trae `borrador: b1`, `id` es `''` y `borrador`
    queda en los extras, como cualquier clave desconocida.
  - En `compartir.ts`, los textos que hablan de Claude pasan a «el agente».
    `enviarAClaude` se renombra `enviarAlAgente`, con la misma firma.
- [ ] Correr esos archivos: tienen que fallar.
- [ ] **Implementar** según los nombres de arriba. El parámetro `nota` pasa a
  `notas`: el pedido se arma con la sección Notas del formulario.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 5: El editor

**Archivos:** `src/ui/editor.ts`, `src/ui/base.css` (si hace falta para las
acciones al pie), `tests/vista-editor.test.ts`.

- [ ] **Tests primero** en `tests/vista-editor.test.ts`:
  - **El orden.** El orden de las marcas en el HTML es: `name="titulo"`,
    `name="carpeta"`, …, `name="fuente"`, `<h2>Fotos</h2>`,
    `<h2>Contenido</h2>`, `data-portada`, `name="descripcion"`, …,
    `name="notas"`, `data-accion="convertir-con-agente"`,
    `data-accion="guardar"`. Se compara con `indexOf` creciente.
  - **El encabezado.** Tiene
    `<button class="btn prim compacto" data-accion="pegar-receta"` con el
    ícono de portapapeles y el texto «Pegar». No tiene `data-accion="guardar"`.
  - **Categoría.** El select tiene `<option value="">Sin categoría</option>`,
    sin `disabled`.
    - Sin `carpeta` ni entrada, queda elegida.
    - Con `carpeta: 'c1'`, queda elegida `c1`.
    - Con una entrada cuya carpeta no es una categoría (la raíz o
      `_sin-categoria/`), queda elegida «Sin categoría».
  - **Convertir con Agente.** Aparece con el tag `borrador` puesto y no aparece
    sin él.
  - **Guardar al final.** Es un `btn prim` a lo ancho. Al editar, «Borrar
    receta» va después.
  - **La hoja de una foto.** `renderAccionesFoto(2)` tiene `ver-foto-receta` y
    `sacar-foto-editor`, y no tiene `elegir-portada`.
- [ ] Correr `npx vitest run tests/vista-editor.test.ts`: tiene que fallar.
- [ ] **Implementar en `renderEditor`:**
  - `campoPortada` sale de `datos` y va primero en `contenido`.
  - Se arma `datos + fichaFotos(receta) + contenido + acciones + borrar`.
  - `acciones` es un `<div class="acciones-editor">` con el botón
    `btn sec` «Convertir con Agente» (ícono `ICO.compartir`), sólo si
    `tieneEspecial({ tags }, 'borrador')`, y después
    `<button class="btn prim" data-accion="guardar" type="button">Guardar</button>`.
  - La `derecha` del encabezado pasa a ser el botón Pegar. El ícono del
    portapapeles se agrega a `ICO` como `portapapeles`:
    `<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2"/>`.
  - Deja de ser `pegajoso`: arriba ya no hay nada que tenga que quedar a mano
    mientras se escribe. Hay que borrar el comentario que citaba C03.1.2b para
    Guardar.
  - `sinElegir` y el placeholder deshabilitado se reemplazan por la opción
    `value=""` «Sin categoría». La elegida es `carpeta ?? entrada?.carpeta_id`,
    y si no es el id de una categoría de la lista, se elige «Sin categoría».
  - `puede = sePuedeTerminar(receta, carpetaElegida)` con la carpeta elegida.
  - `renderAccionesFoto` pierde el botón Portada y el parámetro.
  - `.acciones-editor` en `base.css`: columna, `gap: var(--e-2)`,
    `margin-top: var(--e-4)`, y cada botón a `width: 100%`.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 6: El cableado en `main.ts`

**Archivos:** `src/main.ts`, `src/ui/router.ts`, `src/ui/tag.ts`,
`src/ui/componentes.ts`, `tests/router.test.ts`, `tests/main-rutas.test.ts`,
`tests/main-nueva-receta.test.ts`, `tests/main-estado-vista.test.ts`.

Es la tarea más grande. Van seis bloques, y cada uno arranca con su test en
`main-rutas.test.ts`, con el arnés `montar()` que ya existe.

- [ ] **Router** (`tests/router.test.ts` primero):
  - `#/nueva?url=u&text=t&fotos=2` da `params: { url, text, fotos }`;
    `#/nueva?recibida=1` da `{ recibida: '1' }`.
  - `#/r/x/editar?recibida=1` da `{ id: 'x', recibida: '1' }`.
  - `#/capturar…` y `#/recibida` caen en el recetario.
  - `#/borradores/<id>` cae en `borradores`.
  - `hashDeCompartido('?text=hola')` da `'#/nueva?text=hola'`.
  - Se implementa en `router.ts`: salen las vistas `capturar`, `recibida` y
    `borrador`, y sale el parámetro `borrador` de `nueva`.
- [ ] **Nueva receta y lo compartido:**
  - Tests:
    - `#/nueva` abre el editor con «Sin categoría» y `borrador` puesto.
    - `#/nueva?text=https://ig.com/r mirá esto` abre con
      `fuente` = `https://ig.com/r` y la nota «mirá esto» en `notas`.
    - Con `fotos=2` y dos `estado.compartidas`, las dos quedan en el depósito
      como fotos nuevas, 1 y 2, con su miniatura `blob:`.
    - Volver sin tocar nada pregunta «¿Salir sin guardar los cambios?», porque
      lo compartido cuenta como cambio.
    - Un `text` que es una receta `.md` con `id: f1`, y `f1` está en
      `store.entradas()`: navega con `replace` a `#/r/f1/editar?recibida=1` y
      el editor muestra el título recibido con la categoría de `f1`.
    - Sin `id`, o con uno que no existe: navega a `#/nueva?recibida=1`, lleno.
  - Implementación:
    - En el `case 'nueva'`: `recibida` si está, si no `parse('')` con lo de
      `desdeCompartido` (`fuente`, `notas`) y las fotos de
      `leerCompartidas`, que pasa a sumarlas a `fotosEditor` como nuevas con
      `siguienteNumero`. Sin tope: se va `MAXIMO_FOTOS`.
    - Siempre `conEspecial(receta.tags, 'borrador', true)`.
    - `editorAbierto.formulario = ''` si vino algo compartido o recibido.
    - `recibirReceta(texto)` usa `recetaRecibida`: si
      `store.entradas().some(e => e.id_archivo === id)`, va a
      `#/r/<id>/editar?recibida=1`; si no, a `#/nueva?recibida=1`. Siempre
      con `irCerrando`: la entrada del historial es la del Share Target.
    - Si lo compartido es una receta `.md`, las fotos que llegaron con ella se
      descartan (`imagenes.descartarCompartidas()`) y no entran al depósito.
    - En el `case 'editar'` con `recibida`: la receta leída con lo recibido
      aplicado por `aplicarPegada` (bloque siguiente), y
      `editorAbierto.formulario = ''`.
- [ ] **Pegar:**
  - Tests:
    - En un editor con una foto en el depósito y `carpeta` = `c1` en el
      formulario, `pegar-receta` con un `.md` en el portapapeles vuelve a
      pintar el editor con el título pegado, el depósito intacto y `c1`
      elegida.
    - No llama a `crear` ni a `guardar`.
    - Con «Sin categoría» elegida y lo pegado sin tags, `borrador` queda
      puesto.
    - Un texto que no es receta muestra «Lo copiado no es una receta en .md.»
      sin redibujar el formulario.
    - Un `id:` en lo pegado se ignora.
  - Implementación:
    - `aplicarPegada(actual: Receta, pegada: Receta, carpeta: string): Receta`
      es una función pura en `src/conversion.ts`, con su test en
      `tests/conversion.test.ts`.
    - Da `{ ...pegada, fotos: actual.fotos, foto: pegada.foto ?? actual.foto }`,
      y con `carpeta === ''` fuerza `borrador`.
    - El handler lee `recetaDesdeFormulario(datosDelFormulario(), base)`,
      aplica y hace `pintar(renderEditor({ …, carpeta }))` **sin**
      `abrirEditor`, así la foto de «cambios sin guardar» sigue siendo la de
      antes.
    - El aviso va con `avisoAlGuardar`, en el mismo lugar que el error de
      guardar.
- [ ] **Guardar:**
  - Tests:
    - Con «Sin categoría» llama a `crear` sin `carpetaId`, y sin el aviso
      «Elegí una categoría».
    - Sin título y con `borrador`, guarda con «Borrador dd/mm hh:mm».
    - Sin título y sin `borrador`, avisa «Ponele un título antes de guardar.».
    - Editando con «Sin categoría» elegida, llama a `guardar` con
      `carpetaDestino: ''`.
    - Guardar lo recibido (`#/nueva?recibida=1`) cierra en `#/r/<id-nuevo>`.
  - Implementación:
    - Se extrae el cuerpo del handler a
      `guardarEditor(): Promise<{ id: string } | null>`, que devuelve `null`
      si no escribió.
    - Salen `borradorId`, `convertirBorrador` y la validación de categoría.
    - `carpetaDestino: carpetaId`, que ahora puede ser `''`.
- [ ] **Convertir con Agente:**
  - Tests:
    - En `#/nueva` con título y fuente, `convertir-con-agente` llama a `crear`
      y **después** manda un pedido que dice `id: nuevo-1`.
    - Si guardar falla, no manda nada.
    - Al terminar, la app queda en `#/r/nuevo-1`.
    - Con `enviarAlAgente` → `'copiado'`, el aviso «Pedido copiado: pegalo en
      el agente» se ve en la receta.
  - Implementación:
    - `const creada = await guardarEditor(); if (!creada) return;`
    - Después el pedido con `pedidoDeConversion` desde la receta guardada.
    - Las fotos del pedido son las del depósito con link de Drive
      (`idDeDrive`), leídas con `archivosDeFotos`, en orden de `n`.
    - Después `irCerrando('#/r/<id>')`.
- [ ] **Borradores y menú:**
  - Tests:
    - `#/borradores` pinta la lista de `store.buscar({ tags: ['borrador'] })`
      con la hamburguesa (`data-accion="abrir-menu"`) y no el volver.
    - El contador del menú cuenta esas recetas.
    - No hay «+ Nuevo» ni «Pegar receta».
    - El texto vacío es «No hay borradores.».
  - Implementación:
    - `renderTag` suma `{ menu?: { abierto: boolean; borradores: number } }`.
      Con `menu`, el encabezado lleva `botonMenu` y dibuja `lateral` con
      `activo: 'borradores'`.
    - El `case 'borradores'` llama a `renderTag` con `tag: 'borrador'`, igual
      que `case 'tag'`.
    - `PANTALLAS_CON_MENU` sigue incluyendo `borradores`.
    - Se borran `src/ui/borradores.ts`, `src/ui/captura.ts` y sus tests
      (`tests/vista-borradores.test.ts`, `tests/vista-captura.test.ts`).
- [ ] **Limpieza de estado:** salen `tituloCaptura`, `fuenteCaptura`,
  `notaCaptura`, `fotosCaptura`, `errorCaptura`, `avisoCaptura`,
  `guardandoCaptura`, `editandoBorrador`, `borradorLeido`, `fotoAbierta`,
  `confirmandoDescarte`, `fotosDelBorrador`, `avisoBorradores`,
  `PANTALLAS_DE_BORRADOR` y el `input` que habilitaba Guardar en la captura.
  Además, `grep -n "orrador" src/main.ts` sólo debe devolver el tag y la
  pantalla de Borradores.
- [ ] Correr `npm test` y `npm run typecheck`: verde.

### Tarea 7: El service worker, el home y los textos

**Archivos:** `public/sw.js`, `src/ui/recetario.ts`, `src/ui/categoria.ts`,
`tests/manifest.test.ts` (o el que cubra `sw.js`), `tests/vista-recetario.test.ts`.

- [ ] **Tests primero:**
  - El redirect de `recibirCompartido` apunta a `./#/nueva?…`. Si no hay test
    del `sw.js`, se agrega uno que lee el archivo y busca `#/nueva`, como hace
    `index-html.test.ts` con `index.html`.
  - El home vacío dice: «Todavía no hay recetas. Entran con *Nueva receta*,
    compartiendo desde otra app, o como archivos .md en las carpetas de
    Drive.».
  - En `tests/componentes.test.ts`: una fila con categoría «Sin categoría»
    se dibuja con la trama neutra, sin color de categoría. Hoy «Sin
    categorizar» ya cae en ese caso; el test fija que el nombre nuevo también.
- [ ] Implementar. `sw.js` cambia sólo la ruta del redirect y su comentario.
- [ ] Correr `npm test`, `npm run typecheck` y `npm run build`: verde.

### Tarea 8: Documentación

Esta tarea no tiene tests. Los documentos dicen cómo es el producto hoy, sin
historial.

- [ ] **`product-design/product/specs/E01-CapturaYBorradores.md`** se reescribe:
  - la captura es el editor nuevo, abierto por Compartir;
  - un borrador es una receta con el tag `borrador`;
  - Borradores es la lista por tag;
  - Convertir con Agente guarda y manda;
  - la vuelta abre el editor, y Pegar está en el editor;
  - sin tope de fotos.
  Salen el formato propio, `_borradores/`, la hoja, «¿De qué borrador…?» y el
  descarte. La tabla de trazabilidad se revisa.
- [ ] **`E04-Corregir.md`:**
  - F04.3b: categoría opcional, «Sin categoría», nace con `borrador`, título
    por defecto;
  - el orden del editor;
  - Guardar al final;
  - Pegar en el encabezado;
  - la portada sólo desde su campo (C04.2.1d y la hoja de la foto);
  - `incompleta` → `borrador` en C04.4.1 y las palabras reservadas.
- [ ] **`E02-Encontrar.md`:**
  - el menú, con Borradores como la lista por tag y *Nueva receta* como única
    entrada;
  - C02.1.2, el texto del home vacío;
  - sacar «se llega también desde el Recetario».
- [ ] **`E05-Cimientos.md`:**
  - los tags especiales y sus formas;
  - `_sin-categoria/` y «Sin categoría»;
  - el reindexado (sin `_borradores/` ni la hoja `borradores`);
  - la lista del velo (línea 103).
- [ ] **`product-design/ux/information-architecture.md`, `user-flows.md` (F1,
  F2) y `design-system.md`**: donde aparezcan borradores, captura o
  `incompleta`.
- [ ] **`CLAUDE.md`:**
  - «Lo esencial»: los tags especiales, los borradores (el tag y
    `_sin-categoria/`), el input principal (Convertir con Agente y Pegar en el
    editor) y el camino de escritura (sin `convertirBorrador`);
  - el mapa de `src/`, sin `borrador.ts` y con `compartido.ts` como lo que
    llega compartido;
  - sale de *No proponer* «Los borradores como receta incompleta o en una
    planilla propia»;
  - en «Lo que ningún test cubre», el foco del teclado en la captura pasa a
    ser el del editor abierto por Compartir.
- [ ] **`BACKLOG.md`:**
  - se borran P61 y P78;
  - P14 suma «usar el tag `borrador` y devolver `id:`».
- [ ] **`skills/recetario/SKILL.md`** no se toca: es P14.
- [ ] Se borran este plan y el spec: lo decidido quedó en `product-design/`.

### Cierre

- [ ] `npm test`, `npm run typecheck` y `npm run build` en verde.
- [ ] Mostrar el diff al usuario. Con su visto bueno: commit, push a `main` y
  prueba en el teléfono. En el teléfono hay que ver:
  - compartir un link desde Instagram;
  - compartir la receta que vuelve del agente, con `id:` y sin él;
  - Pegar;
  - Convertir con Agente con fotos;
  - la lista de Borradores y su contador;
  - elegir categoría y sacar `borrador`.
- [ ] Antes de publicar, el usuario vacía y borra `_borradores/` en Drive con
  la versión actual.
