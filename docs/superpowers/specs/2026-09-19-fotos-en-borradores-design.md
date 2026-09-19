# Fotos en los borradores

**Resuelve:** `BACKLOG.md` P39. Deja hecho el mecanismo para mostrar imágenes
de Drive que usa P19-3b.

## 1. Qué es

Un borrador puede tener hasta cinco fotos: una página de un libro, una receta
escrita a mano, una captura de pantalla. Las fotos se sacan desde la app o
llegan compartidas desde otra (la cámara, Fotos, una galería), y viajan con el
pedido a Claude o Gemini para que reconozcan la receta y la devuelvan en `.md`.

## 2. Lo decidido

1. **Hasta 5 fotos por borrador.** Si llegan más compartidas, se toman las
   primeras 5 y se avisa.
2. **Se sacan desde la captura y desde el borrador**, con la cámara o la
   galería, y **llegan compartidas desde otra app** por el menú Compartir.
3. **Se achican antes de subir:** el lado mayor a 1600 px, en JPEG.
4. **En Drive van al lado del `.md` del borrador**, en `_borradores/`, y el
   `.md` suma la clave `fotos` con sus ids, en orden.
5. **En la captura** se ven como miniaturas con su ×, antes de guardar.
6. **En el borrador** se ven como miniaturas; tocar una la abre a pantalla
   completa. Se agregan al final y se sacan de a una, sin reordenar.
7. **Al convertir o descartar el borrador**, sus fotos van a la papelera con él.
8. **El pedido a Claude o Gemini** explica qué son las fotos y cómo
   tratarlas. Con el menú Compartir, las fotos viajan como archivos junto al
   texto; sin él, el pedido lleva el link de Drive de cada foto.
9. **Para guardar un borrador alcanza con fuente, nota o fotos.**
10. **Las fotos de Drive se muestran pidiéndolas con el token**, y quedan en
    Cache Storage por id de archivo. Es el mismo mecanismo que usa P19-3b.

## 3. El formato del borrador

El frontmatter suma una clave, `fotos`, con los ids de Drive en orden, en la
misma sintaxis de lista que los `tags` de la receta. Sin fotos no se escribe.

```md
---
titulo: Tarta de la abuela
fuente:
capturado: 2026-09-19T10:30:00.000Z
fotos: [1AbC…, 1DeF…]
---

Página 84 del libro de tartas.
```

- `src/borrador.ts`: `parseBorrador` lee `fotos` como lista de ids;
  `serializeBorrador` la escribe sólo si no está vacía. El tipo `Borrador`
  (`src/tipos.ts`) suma `fotos: string[]`. La fila de la hoja `borradores` no
  cambia.
- **Los archivos** se llaman como el `.md` con un número: `tarta-de-la-abuela-1.jpg`,
  `-2.jpg`… Una foto agregada después toma el primer número libre. El número
  es sólo para que en Drive se lean juntos: el orden es el de `fotos`.
- **Las fotos no entran al índice** ni al reindexado: el reindexado lista los
  `.md` de `_borradores/`, y una foto no es un `.md`.

## 4. Achicar una foto

`src/fotos.ts`, nuevo.

- `medidas(ancho, alto, maximo = 1600)`: pura. Devuelve el ancho y el alto con
  el lado mayor en `maximo` o menos, sin agrandar nunca.
- `achicar(archivo: Blob): Promise<Blob>`: decodifica con `createImageBitmap`,
  dibuja en un `canvas` con `medidas`, y lo exporta con
  `canvas.toBlob('image/jpeg', 0.85)`. El `canvas` se recibe por parámetro,
  para poder probarlo en Node con uno falso.
- Una foto que el navegador no puede decodificar —HEIC, un archivo roto— no
  se agrega, y la pantalla avisa **«No se pudo leer una de las fotos.»**

## 5. Mostrar una foto de Drive

`src/imagenes.ts`, nuevo, pensado para servir también a P19-3b.

- `urlDeImagen(id: string): Promise<string>`: busca la imagen en Cache
  Storage, en el caché `recetario-imagenes` bajo la clave `imagen/<id>`. Si no
  está, la pide a Drive con el token (`drive.leerBlob(id)`, nuevo en
  `drive.ts`: `files/<id>?alt=media` como `Blob`), la guarda ahí y devuelve
  un object URL.
- `soltarImagenes()`: revoca los object URL de la pantalla anterior. Lo llama
  `main.ts` al cambiar de pantalla.
- `borrarImagenes()`: borra el caché entero.
- Un id de Drive no cambia de contenido: lo guardado no vence. Una foto que ya
  no está en Drive se dibuja como un recuadro vacío con **«La foto ya no está
  en Drive.»**
- **El service worker ya no borra todos los cachés ajenos:** `activate`
  borra sólo los que empiezan con `recetario-v` y no son el actual. Si no,
  cada deploy vaciaría `recetario-imagenes` y `recetario-compartido`.
- **«Borrar datos locales» y «Salir»** borran `recetario-imagenes` y
  `recetario-compartido`, además de la copia del índice.

## 6. Compartir fotos a Recetario

**El manifest.** El Share Target pasa a `POST`:

```json
"share_target": {
  "action": "/recetario/compartir",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": {
    "title": "title", "text": "text", "url": "url",
    "files": [{ "name": "fotos", "accept": ["image/*"] }]
  }
}
```

Android lo lee al instalar la PWA: hay que reinstalarla.

**El service worker** atiende el `POST` a `/recetario/compartir`, que ningún
servidor recibe:

1. Lee el `FormData`.
2. Guarda cada archivo de `fotos` en el caché `recetario-compartido`, bajo
   `compartido/0`, `compartido/1`…, y borra lo que hubiera de un envío
   anterior.
3. Responde con una redirección 303 a
   `/recetario/#/capturar?url=…&text=…&fotos=<cantidad>`, con los mismos
   `url` y `text` que hoy.

**La captura** lee `fotos` de la ruta. Si hay fotos, las saca del caché, se
queda con las primeras 5, las achica y borra el caché. Si llegaron más de 5,
avisa **«Llegaron 8 fotos: se guardan las primeras 5.»** Lo demás de lo
compartido sigue la regla de hoy: el link a la fuente, el resto del texto a la
nota, y una receta en `.md` en `text` abre el editor.

`hashDeCompartido` se queda para lo que llegue por `GET` de una instalación
vieja, hasta que se reinstale.

## 7. Las pantallas

**La captura** (`src/ui/captura.ts`)
- Debajo de la nota, **Fotos**: las miniaturas en una fila, cuadradas de
  64 px, cada una con su ×, y al final un botón **Agregar foto** con el ícono
  de la cámara. Abre `<input type="file" accept="image/*" capture multiple>`,
  que en el teléfono ofrece la cámara o la galería. Con 5 fotos, el botón no
  se dibuja.
- Las fotos viven en memoria, ya achicadas, hasta Guardar. Las miniaturas
  salen de object URLs de esos `Blob`.
- Guardar se habilita con fuente, nota o al menos una foto.

**El borrador** (`src/ui/borradores.ts`, `renderBorrador`)
- Debajo de la nota, **Fotos**: las miniaturas, de `urlDeImagen`, cada una con
  su ×, y **Agregar foto** al final mientras haya menos de 5.
- Tocar una miniatura abre el visor: la foto al ancho de la pantalla, sobre un
  velo, y se cierra tocando cualquier lado.
- Agregar sube la foto y reescribe el `.md` en el momento, con el velo de
  escritura (R8). Sacar manda la foto a la papelera de Drive y reescribe el
  `.md`, también con el velo, sin confirmación: se recupera desde la papelera.
- *Editar* sigue editando título, fuente y nota; las fotos se manejan en la
  vista del borrador.

## 8. El store

- `agregarBorrador({ titulo, fuente, nota, fotos: Blob[] })`: sube las fotos
  en orden, después el `.md` con sus ids, después la fila. Para que un
  reintento no las suba dos veces, la captura guarda en memoria el id de cada
  foto que ya se subió y sólo manda las que faltan (`fotosSubidas`, en el
  estado de la captura).
- `agregarFotoABorrador(id, foto: Blob)` y `sacarFotoDeBorrador(id, fotoId)`:
  suben o mandan a la papelera la foto, y reescriben el `.md` con la lista
  nueva.
- `descartarBorrador(id)`: manda a la papelera las fotos que nombra el `.md`
  y después el `.md`. Una foto que ya no está no es un error. Como
  `convertirBorrador` descarta con esta función, convertir también se lleva
  las fotos.
- `drive.crear` acepta un `Blob` además de un texto como contenido, con su
  `mime`.

## 9. El pedido a Claude o Gemini

`pedidoDeConversion` (`src/conversion.ts`) recibe las fotos y suma, después
del borrador:

```
Fotos: van 2, en orden. Pueden ser páginas de un libro, una receta escrita a
mano, una captura de pantalla o el plato terminado. Transcribí lo que se lee,
sin inventar cantidades ni pasos que no estén. Una foto del plato sirve para
el título y la descripción, no para la receta.
```

`enviarAClaude` (`src/compartir.ts`):

- **Con menú Compartir y archivos** (`canShare({ files })`): comparte el texto
  y las fotos como `File` (`foto-1.jpg`…), que saca de `urlDeImagen`.
- **Sin eso** —Chrome en la Mac—: el pedido suma una línea por foto con su
  link de Drive, `Foto 1: https://drive.google.com/file/d/<id>/view`, y
  **«Las fotos están en mi Google Drive: leelas con el conector de Drive.»**
  Después sigue como hoy: el link a `claude.ai/new?q=…`, o copiar si no entra.
- La respuesta vuelve igual que hoy.

## 10. Casos borde

- **Sin red al guardar:** el aviso de hoy; las fotos ya subidas no se vuelven
  a subir al reintentar.
- **Una foto que no se decodifica:** no se agrega; aviso.
- **Un borrador sin fotos:** todo como hoy; el `.md` no escribe `fotos`.
- **Una foto borrada a mano en Drive:** el recuadro «ya no está»; la × la saca
  de la lista.
- **El service worker todavía no está activo** —la primera apertura—: el
  menú Compartir no ofrece Recetario hasta instalar la PWA, así que el `POST`
  siempre lo atiende el service worker.
- **Invitado:** no ve nada de esto.

## 11. Tests

- `tests/borrador.test.ts`: `fotos` en parse y serialize, ida y vuelta; sin
  fotos no se escribe; `sePuedeGuardar` con sólo fotos.
- `tests/fotos.test.ts`: `medidas` —vertical, horizontal, más chica que el
  máximo—; `achicar` con un canvas falso.
- `tests/imagenes.test.ts`: la primera vez pide a Drive y guarda; la segunda
  sale del caché; `borrarImagenes`; una foto que no está.
- `tests/store-borradores.test.ts`: agregar con fotos —orden de subida, ids en
  el `.md`—; el reintento no resube; agregar y sacar una foto; descartar manda
  las fotos a la papelera.
- `tests/conversion.test.ts`: el pedido con fotos, y con los links de Drive.
- `tests/compartir.test.ts`: con `canShare({ files })` viajan los archivos;
  sin él, el link lleva los links de Drive.
- `tests/vista-captura.test.ts` y `tests/vista-borradores.test.ts`: las
  miniaturas, la ×, Agregar foto hasta 5, el visor, Guardar con sólo fotos.
- `tests/main-rutas.test.ts`: la captura con `fotos=` en la ruta, el aviso de
  más de 5; agregar y sacar en el borrador con el velo.
- `tests/manifest.test.ts`: el Share Target es `POST` y acepta imágenes.
- `public/sw.js` no tiene tests: se prueba en el teléfono.

## 12. Documentos

- `E01-CapturaYBorradores.md`: la captura con fotos, el borrador con fotos,
  la regla de guardar, compartir fotos, y el pedido con fotos (C01.9.1).
- `information-architecture.md`: el formato del borrador con `fotos`.
- `user-flows.md`: F1 con fotos y F2 con el pedido.
- `design-system.md`: la fila de miniaturas y el visor.
- `CLAUDE.md`: en «No proponer», las fotos en Drive quedan descartadas sólo
  para la receta; en «Lo esencial», el borrador con fotos; el mapa de `src/`
  con `fotos.ts` e `imagenes.ts`.
- `BACKLOG.md`: sale P39.

## 13. Probar en el teléfono

- Reinstalar la PWA.
- Compartir 2 fotos desde la galería: miniaturas en la captura, guardar, ver
  los `.jpg` al lado del `.md` en Drive.
- Compartir 7 fotos: el aviso, y quedan 5.
- Sacar una foto con la cámara desde el borrador; sacar otra con la ×.
- Tocar una miniatura: el visor, y cerrarlo.
- «Convertir con Claude» con fotos, en el teléfono: llegan las fotos y el
  texto. En Chrome en la Mac: el pedido trae los links de Drive.
- Convertir y ver que las fotos se fueron a la papelera.
- «Borrar datos locales» y volver a abrir el borrador: las fotos se vuelven a
  pedir a Drive.
