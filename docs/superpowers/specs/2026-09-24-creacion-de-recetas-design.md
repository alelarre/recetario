# Creación de recetas: una sola entidad

## Objetivo

Crear una receta tiene hoy dos entidades con estado propio —el borrador, con
su formato, su carpeta y su hoja, y la receta `incompleta`— y dos formularios
que piden lo mismo. Queda **una sola entidad, la receta**, y **un solo
formulario, el editor**. Lo que falta terminar es una receta con el tag
`borrador`.

## El modelo

- **`borrador` es un tag especial** y reemplaza a `incompleta`. Los cuatro
  especiales quedan `favorito`, `menú diario`, `probar` y `borrador`.
- `incompleta`, `incompleto`, `incompletos` e `incompletas` pasan a ser
  **formas alternativas de `borrador`**: los `.md` que ya lo tienen se leen
  como borrador sin reescribirse, y al guardarlos quedan con `borrador`.
  `borradores` también es forma alternativa. Las formas de `terminado` siguen
  reservadas: contradicen a `borrador`.
- **La categoría es opcional al crear.** Lo que no tiene categoría vive en la
  carpeta **`_sin-categoria/`**, al lado de las categorías. Se crea la primera
  vez que hace falta, como `_fotos/`.
- **La app no escribe recetas sueltas en la carpeta base.** Un `.md` suelto
  ahí, escrito por fuera, se sigue leyendo como hoy, sin categoría; guardarlo
  lo deja donde está, y elegirle una categoría lo mueve.
- El nombre que se muestra para lo que no tiene categoría pasa de «Sin
  categorizar» a **«Sin categoría»**, en los dos casos.
- **Todos los encabezados de todas las pantallas quedan fijos** arriba al
  bajar.
- `_sin-categoria/` **no es una categoría**: no aparece en el home, no tiene
  color ni foto y no se gestiona desde *Ajustes → Recetario*. Sus recetas sí
  están en el índice, con la categoría vacía.
- **Sacar `borrador` exige categoría**, además de título, ingredientes y pasos
  (`sePuedeTerminar` ya lo exige). Por lo tanto una receta en
  `_sin-categoria/` es siempre un borrador.
- Un `.md` escrito afuera en `_sin-categoria/` sin el tag se muestra como está
  (R4); el editor no lo deja guardar sin `borrador` hasta que tenga categoría.

## Borradores en el menú

- La entrada **Borradores** del menú sigue en `#/borradores`, que dibuja la
  lista por tag de siempre filtrada por `borrador`, con la hamburguesa en vez
  del volver: es un destino del menú. El contador cuenta las recetas con
  `borrador`, escrito en cualquiera de sus formas.
- En esa lista, una receta de `_sin-categoria/` se dibuja con la trama neutra
  en lugar del color de una categoría.
- La lista no tiene «+» ni «Pegar receta».
- **A los borradores se llega sólo por esta entrada.** El home no muestra
  «Sin categoría», y el tag `borrador` no aparece en ninguna lista de tags: ni
  en el carrusel del home, ni en los filtros de una categoría o de un tag, ni
  en las sugerencias del editor. El botón del editor para ponerlo y sacarlo
  sigue.
- *Nueva receta* sigue en el menú y es la única entrada para crear a mano.

## El editor

Es el único formulario, para crear y para editar. Orden de arriba abajo:

1. **Encabezado:** volver a la izquierda, el título («Nueva receta» o
   «Editando») y, a la derecha, **Pegar**: botón principal compacto, con el
   ícono de portapapeles y el texto «Pegar». Está en todo editor.
2. **Datos:** Título, Categoría, Tags, Rinde, Duración, Dificultad, Fuente
   original.
3. **Fotos**, ficha propia: Cámara, Galería, Por URL y la ayuda.
4. **Contenido:** **Portada** primero, después Descripción, Ingredientes,
   Preparación, Variaciones y Notas.
5. **Acciones, al final y a lo ancho:** **Convertir con Agente** (secundario,
   sólo mientras la receta tiene `borrador`) y debajo **Guardar** (principal).
   Al editar una receta existente, *Borrar receta* va debajo, separado.

Guardar está sólo al final. El encabezado queda fijo, como en todas las
pantallas.

### Categoría

- El select arranca en **«Sin categoría»**, que es una opción elegible y no un
  placeholder. En una receta existente arranca en la suya.
- Guardar con «Sin categoría» escribe en `_sin-categoria/`. Elegir una
  categoría mueve el archivo (`store.guardar` con `carpetaDestino`), en los dos
  sentidos.
- Con «Sin categoría» el botón de `borrador` queda apretado y bloqueado, como
  hoy cuando no se cumple lo mínimo.

### Título

Obligatorio para guardar, salvo en un borrador: vacío, se guarda como
«Borrador dd/mm hh:mm», y el nombre del archivo sale de ahí.

### Fotos y portada

- El depósito es el de siempre: sin tope, las fotos se suben a `_fotos/` al
  guardar, y una URL que no se puede bajar entra como link.
- **Tocar una foto** abre la hoja con *Ver* y *Sacar*. **La portada se elige
  sólo desde el campo Portada.**

### Pegar

- Lee el portapapeles. Si no es una receta en `.md`, avisa como hoy: *«No se
  pudo leer lo copiado.»* o *«Lo copiado no es una receta en .md.»*.
- Si lo es, **llena el formulario:** título, datos, tags y secciones se
  reemplazan por lo pegado. **No guarda.**
- Se conservan el **depósito de fotos** y la **categoría elegida**. Si la
  categoría es «Sin categoría», el tag `borrador` queda puesto aunque lo pegado
  no lo traiga.
- Pisa lo escrito sin preguntar; la pregunta al salir sin guardar protege el
  archivo.
- Ignora el `id:` que traiga lo pegado: pega en el editor abierto.

### Convertir con Agente

- **Guarda y después manda el pedido.** Si la validación de guardar falla, no
  manda nada.
- El pedido es el de hoy, armado con lo que tiene la receta: título, fuente,
  Notas y las fotos del depósito, en orden, como `foto:1`, `foto:2`…
- La línea que pedía `borrador: <id>` pasa a pedir **`id: <id>`**, con el id
  del `.md` de la receta.
- Lo manda como hoy: menú Compartir con las fotos como archivos, `claude.ai`,
  o el portapapeles. Los textos dicen «Agente» en lugar de «Claude».
- Después de mandarlo, el editor queda cerrado y la app en la receta.

### Salir sin guardar

Pregunta siempre que haya cambios, como hoy en el editor. Aplica también a lo
que llega compartido: el editor nuevo abierto con un link cuenta como cambio.

## Lo que llega por Compartir

El Share Target (`public/sw.js`) no cambia. Lo que abre la app:

| Llega | Abre |
|---|---|
| Un link, un texto que no es receta, fotos | El **editor nuevo** con la fuente, el texto en Notas y las fotos en el depósito. «Sin categoría» y `borrador`. No se guarda nada hasta Guardar o Convertir. |
| Una receta `.md` con `id:` de una receta que existe | El **editor de esa receta** con lo recibido aplicado como en *Pegar*. |
| Una receta `.md` sin `id:`, o con uno que no existe | El **editor nuevo** lleno con la receta, «Sin categoría» y `borrador`. |

- Las fotos que llegan junto con una receta `.md` se ignoran.
- La clave `id` se saca al recibir: nunca llega al `.md` guardado.
- La receta recibida sigue marcando cambios desde que abre el editor.

## El índice

- Deja de existir la hoja `borradores`.
- Reindexar lee también `_sin-categoria/`, y sus filas llevan «Sin
  categoría».
- Si una receta de `_sin-categoria/` no tiene el tag `borrador`, reindexar lo
  avisa al terminar, nombrando el archivo, y no hace nada más.
- Se sube `SCHEMA_VERSION`: el primer arranque con la versión nueva reindexa.

## Lo que se borra

- Las pantallas **Borradores**, **Borrador**, **Captura** y **¿De qué borrador
  es esta receta?**, con sus rutas `#/borradores`, `#/borradores/<id>`,
  `#/capturar` y `#/recibida`, y los parámetros `borrador` y `recibida` de
  `#/nueva`.
- `src/borrador.ts`, `src/ui/captura.ts`, `src/ui/borradores.ts`,
  `convertirBorrador` y las operaciones de borradores del store
  (`agregarBorrador`, `editarBorrador`, `descartarBorrador`,
  `agregarFotoABorrador`, `sacarFotoDeBorrador`) y `NOMBRE_BORRADORES`.
- La carpeta `_borradores/` deja de leerse. **No hay migración:** los
  borradores que existen se convierten o descartan con la versión actual, y la
  carpeta se borra a mano de Drive.

Lo compartido entra por `#/nueva?url=&text=&fotos=N`: el redirect de
`public/sw.js` y `hashDeCompartido` (el GET viejo) apuntan ahí en lugar de a
`#/capturar`.

## Fuera de alcance

- El skill del agente (`skills/recetario/`): sigue abierto aparte y suma usar
  `borrador` y devolver `id:`.
- Leer las fotos que llegan compartidas junto con una receta `.md`.

## Documentación

En el mismo trabajo:

- `product-design/product/specs/`: E01 se reescribe para la captura por el
  editor y los borradores como tag; E04 F04.3b (Nueva receta), el orden del
  editor, Guardar al final, Pegar, Convertir con Agente y la portada sólo desde
  su campo; E02 el menú, la lista de Borradores y el texto del home vacío; E05
  los tags especiales y la carpeta `_sin-categoria/`.
- `product-design/ux/information-architecture.md`, `user-flows.md` (F1, F2) y
  `design-system.md`, donde aparezcan borradores o `incompleta`.
- `CLAUDE.md`: el modelo de borradores, los tags especiales, el camino de
  escritura, `_sin-categoria/`, y sale de *No proponer* la línea sobre los
  borradores como receta incompleta.
- `BACKLOG.md`: P78 se cierra; P14 suma lo de `borrador` e `id:`.

## Tests

- `catalogo`: `borrador` especial, `incompleta` y sus formas como alternativas,
  reservadas.
- `recipe`: `sePuedeTerminar` sin categoría es falso (ya cubierto, se revisa).
- `conversion`: el pedido pide `id:`; `recetaRecibida` devuelve el `id` y lo
  saca de los extras.
- `store`: crear sin categoría escribe en `_sin-categoria/` y la crea si falta;
  guardar con categoría mueve; reindexar lee `_sin-categoria/` con categoría
  vacía; no hay hoja `borradores`.
- `router`: `#/nueva` con los parámetros de compartido; las rutas borradas caen
  al recetario.
- UI (`tests/` con el DOM falso): el orden del editor, Pegar llena sin guardar
  y conserva fotos y categoría, Convertir guarda antes de mandar, la hoja de la
  foto sin *Portada*, y lo compartido con y sin `id:`.
