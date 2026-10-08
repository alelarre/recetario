# Temporizadores en la receta

Un paso de la receta puede llevar una **marca de temporizador** en el texto.
En la receta y en el modo cocina, la marca es un botón: tocarlo crea una
cuenta regresiva o un cronómetro con nombre y lo arranca, sin salir de la
pantalla. Las marcas viven en el cuerpo del `.md`, como las referencias a
fotos: no hay clave nueva ni sección nueva.

El botón de foto del editor pasa a ser un **botón de herramientas** que pone
en la línea una foto, una cuenta regresiva o un cronómetro, y queda listo
para sumar otras.

## El formato

Dos marcas en línea, con forma de link de Markdown, en cualquier sección del
cuerpo (ingredientes, pasos, notas):

```
[texto](cuenta:<duración> "<etiqueta>")
[texto](cronometro: "<etiqueta>")
```

- **`cuenta:`** crea una cuenta regresiva y **`cronometro:`** un cronómetro
  con nombre.
- **`texto`** es parte de la frase y se dibuja como texto común. Puede estar
  vacío: `[](cuenta:50:00 "hornear")` dibuja sólo el botón. Fuera de la app,
  en Drive o en un visor de Markdown, la marca es un link que no lleva a
  ningún lado, y la frase se sigue leyendo.
- **`duración`** es `m:ss` o `h:mm:ss`: `0:30`, `50:00`, `1:30:00`. Va de más
  de cero a 23:59:59, el tope de las ruedas de Temporizadores. Los minutos y
  los segundos después del primer número llevan dos cifras.
- **`"etiqueta"`** es opcional y va entre comillas dobles, separada del
  destino por un espacio.
- **El nombre del temporizador** es la etiqueta. Sin etiqueta, es el
  `texto`. Sin ninguno de los dos, es el nombre que hoy toma uno creado a
  mano sin nombre: `nombreDeDuracion` para una cuenta, «Cronómetro» para un
  cronómetro.
- **Una marca mal formada se lee como texto común:** se ve su `texto`, sin
  botón y sin la sintaxis. Mal formada es un esquema que no es ninguno de los
  dos, o una duración que no se lee o que está fuera del rango. Nunca rompe la
  receta.
- **Ejemplos:**

  ```
  - Cocinar a fuego fuerte durante [50 minutos](cuenta:50:00 "cocinar").
  - Hornear [1 h 30 min](cuenta:1:30:00 "hornear"), tapada.
  - Amasar [hasta que esté liso](cronometro: "amasar").
  - Dorar de los dos lados. [](cuenta:4:00 "dorar")
  ```

- **El frontmatter no cambia** y `SCHEMA_VERSION` tampoco: el índice no mira
  las marcas.
- **La búsqueda** ve sólo el `texto` de cada marca, no el esquema, la duración
  ni la etiqueta.

## Leer: las tres salidas

`enLinea` en `src/ui/markdown.ts` reconoce las marcas como un tramo más de
`TramoEnLinea`, con su tipo (`cuenta` o `cronometro`), su duración en ms si
es una cuenta y su nombre ya resuelto. Hoy `esDestinoSeguro` rechaza esos
destinos y deja la marca como texto crudo: el reconocimiento va antes de ese
filtro. Lo que se reconoce lo decide un módulo puro del dominio, `marcas.ts`
—leer y escribir una marca—, que usan `markdown.ts`, `validar.ts` y el
editor.

- **HTML (receta y modo cocina):** el `texto`, y pegado a él el botón
  `.ico-min` con `relojMas` (cuenta) o `cronometroMas` (cronómetro). El botón
  lleva `data-accion="crear-temporizador"`, el tipo, la duración y el nombre.
- **HTML en la vista de invitado:** sólo el `texto`, sin botón. El invitado
  no tiene temporizadores y su lista de acciones es cerrada.
- **Texto plano (compartir, copiar):** sólo el `texto`. Una marca vacía no
  deja nada.
- **PDF:** sólo el `texto`. Una marca vacía no deja nada.

## El botón en la receta y en el modo cocina

- Tocarlo crea el temporizador y lo arranca, sin cambiar de pantalla, por el
  mismo camino que *Empezar* en Temporizadores y que el botón de minutos de
  Referencias (`empezarCon` del control de temporizadores, y su par para el
  cronómetro). La tira aparece al pie, como siempre que algo corre.
- **Contra el doble toque:** al tocarlo, el botón queda deshabilitado 2 s y
  muestra una tilde (`--exito`); después vuelve a su ícono. Cada toque fuera
  de esos 2 s crea uno nuevo, así que dos bandejas del mismo paso son dos
  toques.
- En el modo cocina, el botón crece con el texto (`--ico-cocina`).

## `.ico-min` y los íconos nuevos

El botón es el que ya usan las tablas de Referencias, y el cambio va en la
clase, así que las dos lo toman:

- **`.ico-min`** baja de 28 a 24 px y su ícono de 16 a 14 px. El área que
  responde al toque sigue siendo 10 px más por lado.
- **`relojMas`**: el reloj, abierto abajo a la derecha, con un «+» del mismo
  trazo en ese hueco. Lo usan la marca `cuenta:` y las tablas de Referencias.
- **`cronometroMas`**: el cronómetro —círculo, una aguja y el botón arriba—,
  con el mismo «+». Lo usa la marca `cronometro:`.
- **`cronometro`**: el mismo dibujo sin el «+», al lado del nombre de un
  cronómetro con nombre en Temporizadores.
- **`herramienta`**: una llave inglesa, para el botón del editor.

## Temporizadores: cronómetros con nombre

C07.5b.1 cambia así:

- **La ficha fija «Cronómetro»** de arriba no cambia: sin nombre, a mano.
- **La lista** pasa a tener cuentas y cronómetros con nombre, mezclados en
  orden de creación. **La ficha de un cronómetro con nombre** lleva el ícono
  `cronometro` y su nombre, el tiempo que sube, pausa o seguir, y sacar. No
  lleva *+1'* ni barra de avance; no termina ni avisa. Al lado del nombre de
  una cuenta va el `reloj`, para distinguirlas.
- **Nuevo temporizador** sigue creando sólo cuentas. Un cronómetro con nombre
  sólo se crea desde una marca.
- **La tira** rota por todo lo que corre: el cronómetro fijo y después la
  lista en orden de creación, cuentas y cronómetros con nombre. Uno pausado
  no entra.
- **La pantalla no se apaga** mientras corre un cronómetro con nombre, como
  con todo lo demás que corre.

**El modelo (`src/temporizadores.ts`).** La lista guardada tiene dos formas
de elemento: la cuenta de hoy y el cronómetro con nombre,
`{ id, nombre, acumulado, desde? }`, que reusa las cuentas del cronómetro
fijo (`transcurrido`, `iniciarCrono`, `pararCrono`). Se distinguen por la
forma. `leerGuardado` lee las dos y descarta lo que no reconoce: lo guardado
antes, que sólo tiene cuentas, se lee igual, sin migrar.

## El editor: el botón de herramientas

- **El botón flotante** al costado del renglón del cursor
  (`botonPonerFoto`) pasa a ser `botonHerramientas`: el ícono `herramienta`
  y el `aria-label` «Agregar en esta línea». Aparece en los mismos campos y
  en la misma posición que hoy, y lleva la sección y la línea.
- **Al tocarlo se abre una capa, «Agregar en esta línea»** (IA §4.6: se
  cierra con el atrás), con una entrada por herramienta, ícono y nombre:
  **Foto**, **Cuenta regresiva** y **Cronómetro**, en ese orden.
- **Cada entrada lleva a su paso, en la misma capa:**
  - **Foto:** la galería del depósito de hoy (`renderElegirFoto`), sin
    cambios. Con el depósito vacío, la entrada va deshabilitada con «Primero
    agregá una foto en la ficha Fotos».
  - **Cuenta regresiva:** la etiqueta y las tres ruedas h/m/s de
    Temporizadores, y *Poner*, deshabilitado en 0:00:00. Las ruedas arrancan
    en 0:10:00.
  - **Cronómetro:** la etiqueta y *Poner*.
- **La etiqueta se precarga** con el texto del renglón antes del cursor, sin
  marcas ni referencias, recortado a sus últimas tres palabras. Se puede
  cambiar o dejar vacía; vacía, la marca va sin etiqueta.
- **Qué escribe:** la marca vacía al final de la línea, con un espacio antes,
  como hoy la foto: `[](cuenta:50:00 "cocinar")`. El editor no envuelve
  palabras del renglón: no sabe cuáles son las del tiempo.
- **Las herramientas son una tabla** (`src/herramientas-editor.ts`), como la
  de `especiales.ts`: cada entrada declara su ícono, su nombre, cómo dibuja
  su paso y qué escribe en la línea. Una herramienta nueva es una entrada
  más. La foto es una entrada de la tabla y deja de tener botón propio.
- El epígrafe de la ficha Fotos (C04.3d.1) nombra el botón nuevo: «tocá el
  [herramienta] que aparece al costado del renglón que estás escribiendo».
- Escribir una marca a mano sigue valiendo: los campos no cambian.

## El MCP, el skill y *Convertir con Agente*

- **`src/validar.ts`:** una marca `cuenta:` o `cronometro:` mal formada es un
  error fuera del formato. `crear` y `guardar` no escriben si la hay.
- **`formato`, en el MCP,** suma las dos marcas con un ejemplo de cada una.
- **El skill (`skills/recetario/SKILL.md`)** y **las reglas de *Convertir con
  Agente* (`src/conversion.ts`)** dicen:
  - Un paso con un tiempo concreto de horno, hervor, reposo, leudado o
    marinada lleva `cuenta:`, y la marca envuelve las palabras del tiempo:
    `durante [50 minutos](cuenta:50:00 "cocinar")`.
  - Con un rango («20 a 25 minutos»), la duración es el mayor.
  - Sin número («hasta que dore»), no lleva marca.
  - `cronometro:` va sólo donde el paso pide medir algo que la fuente no
    fija.
  - La etiqueta es corta, el verbo del paso: «hornear», «reposo», «hervir».
  - Al corregir una receta que ya existe, no se agregan marcas salvo que se
    pidan.

## Tests

- **`markdown`:** las dos marcas, con y sin etiqueta, con y sin texto; las
  mal formadas (esquema desconocido, duración ilegible, cero, más de
  23:59:59, sin comillas que cierren) como texto común; y las tres salidas
  (HTML con botón, HTML de invitado, texto y PDF).
- **`marcas`:** leer y escribir una marca, y el nombre que resulta.
- **`temporizadores`:** leer lo guardado con cronómetros con nombre, corriendo
  y pausados, y una lista vieja con sólo cuentas; las cuentas de un
  cronómetro con nombre.
- **La tira:** el orden de rotación con cronómetros con nombre y cuentas
  mezclados, y que los pausados no entran.
- **`validar`:** los errores de las marcas.
- **El editor:** la tabla de herramientas, la etiqueta precargada y la marca
  escrita al final de la línea, junto a los tests del depósito.
- **La búsqueda:** una marca aporta su `texto` y nada más.

## Documentos

- **`product-design/product/specs/`:**
  - `E05-Cimientos.md`: las marcas en el formato del cuerpo, junto a `foto:N`.
  - `E03-LeerYCocinar.md`: el botón en la receta y en el modo cocina, y lo que
    queda en el texto, el PDF y el invitado.
  - `E04-Corregir.md`: el botón de herramientas y su capa, en lugar de poner
    foto.
  - `E07-Herramientas.md`: los cronómetros con nombre en C07.5b.1 y la tira;
    el botón de minutos de Referencias con el ícono nuevo.
- **`product-design/ux/design-system.md`:** `.ico-min` y los íconos nuevos.
- **`product-design/ux/information-architecture.md`:** la capa «Agregar en
  esta línea».
- **`CLAUDE.md`:** en «Lo esencial», junto a cómo se nombran las fotos en el
  texto, las marcas de temporizador; en «Dónde está cada cosa», `marcas.ts` y
  `herramientas-editor.ts`.
- **`BACKLOG.md`:** P126 pasa a `Falta probar` al terminar.

## Fuera de este trabajo

- Cronómetros con nombre creados a mano en Temporizadores.
- Que el botón sepa si su temporizador ya corre.
- Otras herramientas en el botón del editor: la tabla queda lista para
  sumarlas.
