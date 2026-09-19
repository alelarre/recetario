# Fotos de las recetas y de las categorías

**Resuelve:** `BACKLOG.md` P19-3b, y suma las fotos propias de una receta.
Usa lo que dejaron hecho las fotos de los borradores: `fotos.ts` para achicar,
`imagenes.ts` para mostrar una imagen de Drive con el token y guardarla en
Cache Storage, y la fila de miniaturas con su visor.

## 1. Qué es

Una receta tiene un **depósito de fotos**: las del plato, las de un paso, la
de cómo tiene que quedar la masa. Las fotos se sacan con la cámara o se eligen
de la galería desde el editor, y se guardan en Drive. El texto de la receta
las nombra por número —`![](foto:2)`— en cualquier paso, ingrediente o nota,
y la foto de cabecera puede ser una de ellas. Una categoría puede tener una
foto propia, además de las del catálogo.

## 2. Lo decidido

1. **El depósito es una sección `## Fotos` del cuerpo**, una línea por foto
   con su número y su URL. No hay claves nuevas en el frontmatter.
2. **El número es estable:** una foto nueva toma el más alto más uno y un
   número no se reusa nunca.
3. **La URL puede ser un archivo de Drive o una externa.** La de Drive se pide
   con el token; la externa va a un `<img>` directo.
4. **El texto nombra una foto con `![](foto:N)`**, en cualquier sección. La
   foto de cabecera acepta `foto: foto:N`, además de una URL.
5. **Las fotos que sube la app van a `_fotos/`**, en la carpeta base,
   achicadas como las de los borradores.
6. **En el editor, una foto se pone en el texto desde la foto**, con
   *Poner en…*: la app agrega la referencia al final de la línea elegida. No
   hace falta ubicar el cursor.
7. **Nada toca Drive hasta Guardar.** Guardar sube las nuevas, manda a la
   papelera las que se sacaron y después escribe el `.md` y su fila.
8. **Convertir un borrador pasa sus fotos al depósito**, todas, en su orden.
   Las que no sirven se sacan de a una.
9. **El PDF lleva las fotos**, achicadas para que pese poco.
10. **El invitado sólo ve las fotos externas:** las de Drive no viajan en el
    link.
11. **Se cachea todo lo posible:** Cache Storage por id sin vencimiento,
    almacenamiento persistente, las cabeceras de todas las recetas en
    segundo plano al arrancar y el depósito entero al abrir una receta.
12. **Una categoría puede tener una foto propia** en `_fotos/`, con el mismo
    mecanismo.

## 3. El formato

```md
---
titulo: Pan de campo
foto: foto:3
---

Masa madre, 24 horas.

## Ingredientes
- Harina 000 — 1 kg
- Masa madre — 200 g ![](foto:1)

## Preparación
1. Mezclar y dejar reposar 1 hora.
2. Plegar cada 30 minutos. ![Así tiene que quedar](foto:2)
3. Hornear a 250° con vapor.

## Fotos
- 1: https://drive.google.com/file/d/1AbC…/view
- 2: https://drive.google.com/file/d/1DeF…/view
- 3: https://drive.google.com/file/d/1GhI…/view
- 5: https://ejemplo.com/pan.jpg
```

**La sección `## Fotos`**
- Va última, después de Notas y de las secciones ajenas.
- Cada línea es `- <número>: <url>`. El orden de las líneas es el de la
  galería; los números pueden tener huecos.
- **Si alguna línea no tiene esa forma**, la sección entera se lee como una
  sección ajena (`otras`) y se conserva tal cual: la receta queda sin
  depósito, y nada se pierde por pasar por el editor (C04.3c.1).
- Una URL que no es `http(s)` se lee como una línea sin forma.
- Sin fotos, la sección no se escribe.

**Una URL de Drive** es `https://drive.google.com/file/d/<id>/view`. Es el
formato que la app escribe y el único que reconoce como de Drive; también
sirve pegado a mano o escrito por un agente. `linkDeFoto` y su inversa
`idDeDrive` pasan de `conversion.ts` a `fotos-receta.ts`.

**Las referencias**
- `![epígrafe](foto:N)` en cualquier sección del cuerpo. El epígrafe es
  opcional.
- `markdown.ts` acepta `foto:N` como destino de una imagen; como link
  (`[x](foto:2)`) no significa nada y se deja como texto.
- Una referencia a un número que no está en el depósito no se dibuja.

**La cabecera:** `foto` acepta una URL, como hoy, o `foto:N`. Cualquier otro
valor se lee como ausente, igual que hoy.

**El tipo** (`src/tipos.ts`): `Receta` suma `fotos: FotoDeReceta[]`, con
`FotoDeReceta = { n: number; url: string }`. `ClaveSeccion` no cambia: el
depósito no es texto.

## 4. El dominio

`src/fotos-receta.ts`, nuevo y puro:

- `linkDeFoto(id)` e `idDeDrive(url)`: el link de Drive de un id, y el id de
  un link de Drive o `null`.
- `parsearFotos(cuerpo)` y `serializarFotos(fotos)`: la sección, de ida y de
  vuelta. Los usa `recipe.ts`.
- `siguienteNumero(fotos)`: el más alto más uno, o 1.
- `resolver(valor, fotos)`: lo que dibujar para una `foto` o un destino de
  imagen. `foto:N` da la URL de su línea, o `null` si no está; una URL da la
  misma URL.
- `lineasDeLaReceta(receta)`: los lugares donde se puede poner una foto, para
  *Poner en…*. Son la descripción, cada ingrediente, cada paso, las
  variaciones y las notas, con el texto de la línea y dónde está.
- `ponerEn(texto, lugar, n)`: agrega ` ![](foto:N)` al final de la línea de un
  ingrediente o un paso, o un renglón nuevo al final de la descripción, las
  variaciones o las notas. Si la línea ya la tiene, no la repite.
- `sacarReferencias(texto, n)`: borra todas las `![…](foto:N)` de un texto.

**La fila del índice** (`catalogo.ts`) guarda en la columna `foto` la cabecera
ya resuelta a su URL, así las listas la dibujan sin leer el `.md`. Las filas
que ya existen tienen URLs y siguen valiendo: no hace falta subir
`SCHEMA_VERSION`.

## 5. Dónde viven los archivos

- **`_fotos/`**, en la carpeta base, al lado de `_borradores/`. Se crea con la
  primera foto y su id va en `meta` como `carpeta_fotos`, igual que
  `carpeta_borradores`. Empieza con `_`, así que no es una categoría, y el
  reindexado no la lee.
- **El nombre** es el del `.md` con el número: `pan-de-campo-3.jpg`. Sirve
  para que en Drive se lean juntas; no se verifica que sea único, porque lo
  que manda es el id. En una receta nueva se usa el nombre que va a tener el
  `.md`, calculado antes de subir.
- **Cambiar la receta de categoría no mueve sus fotos:** el link es por id.
- **La app sólo manda a la papelera fotos que están en `_fotos/`.** Un link de
  Drive pegado a mano, que apunta a un archivo de otra carpeta, se saca del
  depósito pero el archivo no se toca.
- **Una foto de categoría** es `_fotos/categoria-<nombre>.jpg`, y la carpeta
  la nombra en `appProperties.foto` como `drive:<id>`, además de los
  `catalogo:<clave>` de hoy.

## 6. Mostrar y cachear

`imagenes.ts` sigue siendo el único que habla con el caché:

- **Resolver una URL para dibujar:** una de Drive pasa por `urlDeImagen(id)`,
  del caché o pedida con el token. Una externa se usa tal cual.
- **La pantalla no espera las fotos.** Se dibuja con cada imagen de Drive
  como un recuadro del mismo tamaño (`data-drive="<id>"`), y cada una se
  completa cuando llega. Así no cambia lo que tarda en abrirse una receta.
- **Una foto de Drive que ya no está:** en la galería, el recuadro con
  *«La foto ya no está en Drive.»*; en la cabecera, en un paso o en una
  lista, no se dibuja, igual que hoy una URL que no carga.
- **Sin vencimiento:** un id de Drive no cambia de contenido.
- **Al mandar una foto a la papelera**, también sale del caché
  (`olvidarImagen(id)`, nuevo).
- **Una foto recién subida entra al caché con el blob que ya está en
  memoria**, sin volver a bajarla (`guardarImagen(id, blob)`, nuevo).
- **Almacenamiento persistente:** al arrancar, `navigator.storage.persist()`,
  una vez y sin mirar el resultado. Con la PWA instalada, Chrome en Android lo
  concede solo, y el caché deja de ser desalojable.
- **Precarga al arrancar:** después de dibujar el home, en segundo plano y de
  a dos, las fotos de Drive de la columna `foto` del índice y las de las
  categorías que no estén ya en el caché. Con `navigator.connection.saveData`
  no se precarga nada.
- **Al abrir una receta**, se pide el depósito entero, no sólo lo que está a
  la vista: así el visor desliza sin esperar.
- *Borrar datos locales* y *Salir* ya borran `recetario-imagenes`.

## 7. Las pantallas

**La receta** (`src/ui/fichas-receta.ts`, `src/ui/receta.ts`)
- La cabecera dibuja `foto` resuelta.
- Una referencia en un ingrediente, un paso o una nota se dibuja **debajo del
  texto de esa línea**, al ancho de la ficha, con su epígrafe si lo tiene.
- Al final, después de Notas, una ficha **Fotos** con la grilla del depósito
  entero, en su orden, cuadradas, de a tres por fila.
- Tocar cualquier foto —la cabecera, una en línea o una de la grilla— abre el
  **visor** en esa foto. El visor desliza entre las fotos del depósito, en su
  orden, y se cierra tocando. Una cabecera externa que no está en el depósito
  se abre sola, sin deslizar.

**El modo cocina** (`src/ui/cocina.ts`): el paso actual dibuja su foto debajo,
igual que en la lectura. Tocarla no abre el visor, porque en la cocina un
toque marca el paso.

**Las listas** (`componentes.ts`, `placeholder`): una cabecera de Drive se
dibuja con el recuadro y se completa al llegar; mientras tanto, y si no llega,
va el placeholder de la categoría.

**El editor** (`src/ui/editor.ts`)
- **La ficha Fotos**, después de Contenido: la fila de miniaturas de
  `filaDeFotos`, cada una con su número en un badge, y **Agregar foto** al
  final, sin tope. Abre el mismo selector que el borrador (cámara o
  galería, varias a la vez).
- **Tocar una miniatura abre una ficha al pie** con cuatro acciones:
  - **Ver** abre el visor.
  - **Portada** la pone de cabecera (`foto: foto:N`). Si ya es la portada, la
    acción no se dibuja.
  - **Poner en…** abre una segunda ficha con los lugares de
    `lineasDeLaReceta`, agrupados por sección y con el texto de cada línea
    cortado a una. Elegir uno escribe la referencia con `ponerEn` en el campo
    de texto y cierra la ficha. Las líneas salen de lo que está escrito en
    ese momento en el formulario, no del `.md` guardado.
  - **Sacar** la saca del depósito y **borra sus referencias** del texto con
    `sacarReferencias`. Si era la portada, la cabecera queda vacía.
- **El campo Foto** de los datos pasa a ser un selector: la miniatura de la
  cabecera actual y, al tocarla, una ficha con el depósito para elegir, el
  campo de URL de hoy y **Sin foto**.
- **Las fotos nuevas viven en memoria**, ya achicadas, con su número asignado,
  hasta Guardar. Su miniatura sale de `urlDeBlob`.
- **Escribir `![](foto:2)` a mano sigue valiendo:** los campos de texto no
  cambian.
- Agregar, sacar o poner una foto cuenta como cambio sin guardar (C04.1.1).

**Categorías** (`src/ui/gestion-categorias.ts`): el selector de foto suma, al
principio, **Subir foto**, con el mismo selector de archivo. La foto elegida
se ve en la muestra en el momento; se sube al guardar la categoría. Una foto
propia se elige de nuevo como cualquier otra del catálogo.

## 8. El store

- **`guardar(id, receta, { carpetaDestino, fotos })`** y
  **`crear(receta, { carpetaId, fotos })`** reciben los cambios del
  depósito: `CambiosDeFotos = { nuevas: Map<number, Blob>; sacadas: string[] }`,
  donde `sacadas` son las URLs que estaban en el `.md` y ya no están. En este
  orden:
  1. Sube cada nueva a `_fotos/`, la guarda en el caché con su blob y pone su
     link en la línea de su número.
  2. Escribe el `.md` y su fila, como hoy.
  3. Manda a la papelera cada sacada de Drive que esté en `_fotos/`, y la
     saca del caché. Una que ya no está no es un error.

  El `.md` se escribe **antes** de mandar nada a la papelera: si algo falla en
  el medio, lo peor que queda es una foto huérfana en `_fotos/`, nunca una
  receta que nombra una foto borrada.
- **El reintento no resube:** el editor guarda en memoria el id de cada foto
  que ya se subió (`fotosSubidas`, como la captura) y el store sólo sube las
  que faltan.
- **`borrar(id)`** lee el `.md` antes de mandarlo a la papelera, y después
  manda sus fotos de `_fotos/`. Las externas no se tocan.
- **Las categorías:** `crearCategoria` y `editarCategoria` reciben la foto
  propia como `Blob`, la suben a `_fotos/` y ponen `drive:<id>` en
  `appProperties.foto`. La foto propia anterior, si la había, va a la
  papelera. `borrarCategoria` manda también su foto propia.

## 9. Convertir un borrador

- **El editor atado a un borrador** abre con el depósito ya cargado: las fotos
  del borrador, en su orden, como `1`, `2`, `3`…, con sus links de Drive. Se
  sacan con la × como cualquier otra.
- **El pedido a Claude le dice cómo usarlas.** A lo que ya lleva sobre las
  fotos, `pedidoDeConversion` suma:

  > En la receta, esas fotos son foto:1, foto:2…, en el mismo orden. Si una
  > muestra el plato terminado, poné `foto: foto:N`. Si una muestra un paso,
  > sumá `![](foto:N)` al final de ese paso. No escribas la sección Fotos: la
  > arma la app.

  Así, la receta que vuelve pegada o compartida ya trae la portada y las
  referencias, y el depósito del editor las resuelve.
- **Al guardar** (`convertirBorrador`), las fotos del borrador que siguen en
  el depósito **se mueven** de `_borradores/` a `_fotos/` y se renombran con
  el nombre del `.md` y su número. El id no cambia, así que el link y el
  caché siguen valiendo. Las que se sacaron van a la papelera con el
  borrador.
- **`descartarBorrador(id, { conservar })`:** no manda a la papelera las fotos
  de `conservar`, que ya se movieron. Es lo que impide que convertir se lleve
  las fotos recién pasadas a la receta.

## 10. Compartir

- **El link de invitado** (`link-receta.ts`) lleva el depósito **sin las
  fotos de Drive**, y la cabecera sólo si es externa, o si es `foto:N` de una
  foto externa. Las referencias a fotos que no viajan no se dibujan, por la
  regla de §3.
- **El invitado** (`invitado.ts`) dibuja la receta como la app, con las fotos
  externas; nunca pide nada a Drive. La galería del invitado es la de las
  fotos que viajaron; sin ninguna, no se dibuja.
- **El texto** (`texto-receta.ts`): una referencia a una foto externa se
  escribe como su URL, como cualquier imagen de hoy. Una de Drive no se
  escribe. La sección Fotos no va.
- **El PDF** (`pdf/documento.ts`, `pdf/generar.ts`):
  - La cabecera, arriba del título, al ancho de la página y con el alto
    topado a 90 mm.
  - Cada referencia, debajo de su línea. **Una línea con foto no se parte
    entre páginas**, igual que hoy una línea sola.
  - La galería al final, de a dos por fila.
  - Las fotos se achican a 800 px de lado mayor con `achicar` (que suma el
    `maximo` como parámetro) y viajan como data URL.
  - Las de Drive salen del caché o se piden con el token. Una externa se pide
    con `fetch`, y si falla —CORS, red— se omite sin aviso.
  - El PDF no espera más que eso: *«Armando el PDF…»* ya cubre la espera.

## 11. Casos borde

- **Sin red al guardar:** el aviso de hoy. Lo escrito y las fotos en memoria
  siguen en pantalla; las que ya se subieron no se vuelven a subir.
- **Salir del editor sin guardar:** las fotos nuevas nunca llegaron a Drive;
  no queda nada huérfano.
- **Una foto que no se decodifica** —HEIC, un archivo roto—: no se agrega, y
  el aviso de los borradores: *«No se pudo leer una de las fotos.»*
- **Una foto de `_fotos/` borrada a mano en Drive:** el recuadro en la
  galería; la × la saca del depósito.
- **Un `.md` escrito por fuera con un `## Fotos` mal formado:** se conserva
  como sección ajena y la receta no tiene depósito (§3).
- **`foto: foto:9` sin el 9 en el depósito:** la receta no tiene cabecera.
- **Dos recetas que nombran el mismo link de Drive** —pegado a mano en las
  dos—: sacarlo de una lo manda a la papelera si está en `_fotos/`. La app
  nunca escribe el mismo link en dos recetas, así que sólo pasa a mano.
- **Reindexar** no lee `_fotos/` y no toca el caché.

## 12. Tests

- `tests/fotos-receta.test.ts`: la sección de ida y vuelta, con huecos en la
  numeración; una línea sin forma deja la sección como ajena;
  `siguienteNumero`; `resolver` con `foto:N`, con un número que falta y con
  una URL; `idDeDrive`; `lineasDeLaReceta` con grupos `###`; `ponerEn` en un
  ingrediente, en un paso y en las notas, sin repetir; `sacarReferencias`.
- `tests/recipe-frontmatter.test.ts`: `foto: foto:2` se lee.
- `tests/recipe-cuerpo.test.ts` y `tests/recipe-serialize.test.ts`: la
  sección Fotos se lee; va última al serializar; sin fotos no se escribe.
- `tests/markdown.test.ts`: `foto:N` como imagen; como link queda texto.
- `tests/catalogo-fila.test.ts`: la columna `foto` guarda la cabecera
  resuelta.
- `tests/imagenes.test.ts`: `guardarImagen` y `olvidarImagen`; la precarga
  saltea lo que ya está y respeta `saveData`.
- `tests/store-escritura.test.ts`: guardar con fotos nuevas —orden: subir,
  `.md`, papelera—; el reintento no resube; una sacada fuera de `_fotos/` no
  va a la papelera; borrar la receta se lleva sus fotos; la primera foto crea
  `_fotos/` y la anota en `meta`.
- `tests/store-gestion-categorias.test.ts`: la foto propia se sube, reemplaza
  a la anterior y se va con la categoría.
- `tests/compartido.test.ts`: convertir mueve las fotos conservadas y
  descarta el resto sin tocar las movidas.
- `tests/conversion.test.ts`: el pedido con fotos suma el párrafo de
  `foto:N`.
- `tests/link-receta.test.ts` y `tests/texto-receta.test.ts`: sin fotos de
  Drive; con las externas.
- `tests/pdf-documento.test.ts`: la cabecera, una foto en un paso y la galería en el
  documento; una externa que falla se omite.
- `tests/vista-receta.test.ts`: la foto en línea debajo de su paso, la ficha
  Fotos, el recuadro de Drive con `data-drive`.
- `tests/vista-editor.test.ts`: la ficha Fotos con sus números, la ficha de
  acciones, *Poner en…* escribe la referencia, *Sacar* la borra del texto,
  *Portada*, el selector del campo Foto.
- `tests/main-rutas.test.ts`: guardar desde el editor con fotos nuevas y
  sacadas; convertir un borrador con fotos.

## 13. Documentos

- `E03-LeerYCocinar.md`: C03.5.1 pasa a ser la cabecera resuelta; las fotos
  en línea, la ficha Fotos y el visor; el modo cocina; C03.7.2 (PDF) con
  fotos; C03.7.3–C03.7.5 sin las fotos de Drive.
- `E04-Corregir.md`: la ficha Fotos, sus acciones y el selector del campo
  Foto; guardar con fotos; borrar se lleva las fotos.
- `E01-CapturaYBorradores.md`: convertir pasa las fotos a la receta, y el
  párrafo nuevo del pedido.
- `E05-Cimientos.md`: `foto` acepta `foto:N`; la sección Fotos; `_fotos/` y
  `carpeta_fotos`; la foto propia de una categoría (`drive:<id>`).
- `E02-Encontrar.md`: F02.5b con cabeceras de Drive.
- `information-architecture.md`: el formato con `## Fotos`, la entidad *Foto
  de receta* y la foto propia de categoría en la tabla de entidades; §1.7.
- `user-flows.md`: corregir con fotos, convertir con fotos.
- `design-system.md`: la ficha de acciones de una foto, la galería, la foto
  en línea.
- `CLAUDE.md`: en «Lo esencial», el depósito de fotos y `_fotos/`; en «No
  proponer», las fotos de receta en Drive dejan de estar descartadas —las
  miniaturas y las portadas aparte siguen—; el mapa de `src/` con
  `fotos-receta.ts`.
- `BACKLOG.md`: sale P19-3b; P14 suma que el skill conozca `foto:N` y la
  sección Fotos; entra la prueba en el teléfono.

## 14. Probar en el teléfono

- En una receta, agregar 3 fotos con la cámara y la galería; guardar; ver los
  `.jpg` en `_fotos/` y la sección Fotos en el `.md`.
- *Poner en…* un paso y un ingrediente; ver la foto debajo de cada uno en la
  receta y en el modo cocina.
- *Portada* desde una foto y desde el campo Foto; la lista muestra la
  cabecera.
- *Sacar* una foto que está en un paso: desaparece la referencia; al guardar,
  va a la papelera de Drive.
- Salir sin guardar con fotos nuevas: `_fotos/` no cambia.
- El visor: desliza entre todas y se cierra tocando.
- Convertir un borrador con fotos por Claude: la receta vuelve con
  `foto:N`, el depósito tiene las del borrador, se sacan dos, y al guardar
  las otras están en `_fotos/` y `_borradores/` quedó vacío.
- El PDF con cabecera, una foto en un paso y la galería.
- Mandar el link: el invitado ve la receta sin las fotos de Drive.
- Una categoría con foto propia, en el home.
- En modo avión, abrir una receta ya vista: las fotos están.
- *Borrar datos locales* y abrir la receta: las fotos se vuelven a pedir.
