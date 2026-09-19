# Plan — Fotos en los borradores

Spec: `docs/superpowers/specs/2026-09-19-fotos-en-borradores-design.md`.

Cada tarea es test primero: el test falla, después pasa.

## 1. El formato del borrador (spec §3)

- `src/tipos.ts`: `Borrador` suma `fotos: string[]`.
- `src/borrador.ts`: `parseBorrador` lee `fotos: [a, b]`; `serializeBorrador`
  la escribe sólo si no está vacía; `MAXIMO_FOTOS = 5`; `nombreDeFoto(md,
  hermanos)` da `<slug>-<n>.jpg` con el primer número libre; `sePuedeGuardar`
  acepta `fotos` (cuántas).
- `tests/borrador.test.ts`: ida y vuelta con fotos, sin fotos no se escribe,
  el nombre con el primer número libre, guardar con sólo fotos. Los fixtures
  de `Borrador` en otros tests suman `fotos: []`.

## 2. Drive (spec §5, §8)

- `src/drive.ts`: `crear` acepta un `Blob` como contenido; `leerBlob(id)`.
- `tests/drive-crear.test.ts`: el `Blob` viaja tal cual en el multipart;
  `leerBlob` pide `alt=media` y devuelve el `Blob`.

## 3. Achicar (spec §4)

- `src/fotos.ts`, nuevo: `medidas`, `achicar(archivo, lienzo, decodificar)`.
- `tests/fotos.test.ts`, nuevo: vertical, horizontal, más chica; `achicar` con
  un canvas falso; lo que no se decodifica rechaza.

## 4. Imágenes de Drive (spec §5, §6)

- `src/imagenes.ts`, nuevo: `crearImagenes({ leerBlob, caches, crearUrl,
  revocarUrl })` con `urlDeImagen`, `imagenDe`, `soltarImagenes`,
  `borrarImagenes`, y lo compartido: `fotosCompartidas(n)` y
  `descartarCompartidas()`.
- `tests/imagenes.test.ts`, nuevo: la primera vez pide a Drive y guarda, la
  segunda sale del caché, soltar revoca, borrar, una foto que no está.

## 5. El store (spec §8)

- `src/store.ts`: `agregarBorrador` con fotos (ya subidas o por subir, y un
  aviso por cada una que sube), `agregarFotoABorrador`, `sacarFotoDeBorrador`,
  `descartarBorrador` que se lleva las fotos, `editarBorrador` que las conserva.
- `tests/dobles.ts`: el Drive falso guarda `Blob` y borrar lo que no está es 404.
- `tests/store-borradores.test.ts`: orden de subida e ids en el `.md`, el
  reintento no resube, agregar y sacar, descartar, editar conserva, el
  reindexado no ve los `.jpg`.

## 6. El pedido (spec §9)

- `src/conversion.ts`: `pedidoDeConversion(b, { links })` con el párrafo de
  las fotos y, con `links`, una línea por foto y el aviso del conector.
- `src/compartir.ts`: `enviarAClaude(p, pedido, fotos)`: con
  `canShare({ files })` comparte texto y archivos; si no, el pedido con links.
- `tests/conversion.test.ts`, `tests/compartir.test.ts`.

## 7. Las pantallas (spec §7)

- `src/ui/iconos.ts`: la cámara.
- `src/ui/captura.ts`: la fila de miniaturas con ×, *Agregar foto* hasta 5,
  Guardar con sólo fotos, un aviso sin acción.
- `src/ui/borradores.ts`: la fila en el borrador, el recuadro «ya no está», el
  visor.
- `src/ui/tokens.css`: `.miniaturas`, `.miniatura`, `.visor`.
- `tests/vista-captura.test.ts`, `tests/vista-borradores.test.ts`.

## 8. La ruta y el cableado (spec §6, §7)

- `src/ui/router.ts`: `capturar` suma `fotos`.
- `src/main.ts`: las fotos de la captura en memoria (con el id si ya se
  subió), las compartidas desde el caché, agregar y sacar en el borrador con
  el velo, el visor, *Convertir con Claude* con fotos, soltar al cambiar de
  pantalla, y *Borrar datos locales* y *Salir* borran los dos cachés.
- `tests/router.test.ts`, `tests/main-rutas.test.ts` (con `fotos.js` e
  `imagenes.js` simulados).

## 9. Service worker y manifest (spec §5, §6)

- `public/manifest.webmanifest`: Share Target `POST` multipart con `fotos`.
- `public/sw.js`: el `POST` a `compartir` guarda en `recetario-compartido` y
  redirige con 303; `activate` borra sólo `recetario-v*` viejos.
- `tests/manifest.test.ts`: `POST`, multipart, `files` de imágenes; cada campo
  en su parámetro. `node --check public/sw.js`.

## 10. Documentos (spec §12)

- `product-design/product/specs/E01-CapturaYBorradores.md`,
  `ux/information-architecture.md`, `ux/user-flows.md`, `ux/design-system.md`,
  `CLAUDE.md`, `BACKLOG.md` (sale P39, entra P40).
