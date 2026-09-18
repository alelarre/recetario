# Plan — Elegir la carpeta base sin explorar el Drive

Spec: `docs/superpowers/specs/2026-09-18-carpeta-sin-explorador-design.md`.

Cada tarea es test primero, y borra lo que reemplaza en el mismo paso.

## 1. La API key en `config.ts`

- `src/config.ts`: `export const API_KEY = '';` con el comentario de para qué es
  y cómo se restringe. El valor lo pone el usuario (spec §8).

## 2. El Picker

- `src/picker.d.ts`, nuevo: los tipos a mano de `gapi.load` y `google.picker`.
  `src/gis.d.ts` pasa a nombrar el global compartido (`GoogleGlobal`) para que
  los dos archivos le sumen su parte sin chocar.
- `src/picker.ts`, nuevo: `elegirCarpeta(token)`. Carga
  `https://apis.google.com/js/api.js` la primera vez, espera `gapi.load('picker')`,
  arma la `DocsView` de carpetas propias y resuelve con la carpeta o con `null`.
- `tests/picker.test.ts`, nuevo: el script se carga una sola vez; resuelve con la
  carpeta y con `null`; rechaza si el script no carga. `gapi` y `google.picker`
  falsos con `comoGlobal`/`limpiarGlobales`.

## 3. La pantalla

- `tests/vista-carpeta.test.ts`, reescrito: los dos encabezados, el párrafo de
  cada uno, las encontradas con *Usar*, *Crear la carpeta «Recetario» en Mi
  unidad*, *Ya tengo una carpeta* sólo con API key, la confirmación y el error.
  Se van los tests de niveles, del nombre a mano y del spinner.
- `src/ui/carpeta.ts`, reescrito: sin niveles, sin lista de carpetas, sin
  formulario de nombre.
- `src/ui/iconos.ts`: el ícono de carpeta para la ficha de encontrada.
- `src/ui/base.css`: lo que haga falta para la ficha con botón a la derecha.

## 4. La ruta y el cableado

- `tests/router.test.ts`: `#/carpeta` y `#/carpeta?cambiando=1`; se va el nivel
  en la query.
- `src/ui/router.ts`: la ruta `carpeta` lleva sólo `cambiando`.
- `tests/main-rutas.test.ts`: crear prepara y recarga; elegir con el Picker falso
  confirma y prepara; cancelar no hace nada; cambiar carpeta anota la anterior.
  Se van los tests de navegación por niveles y del `storeFake.carpetasDe`.
- `src/main.ts`: `selector` queda con `sugerencias`, `confirmando` y `error`;
  `cambiando` sale de la ruta. Acciones `carpeta-sugerida`, `carpeta-crear`,
  `carpeta-elegir`, `carpeta-cancelar` y `carpeta-confirmar`; crear y preparar
  comparten un solo camino, con el velo hasta la pantalla de progreso. Se van
  `carpeta-usar`, `carpeta-crear-confirmado` y el estado `nivel`/`creando`.

## 5. Lo que queda sin usar

- `src/store.ts`: se borra `carpetasDe` y la clave `carpetasPropias` de
  `DriveDelStore`.
- `src/drive.ts`: se borran `carpetasPropias` y `q.carpetasPropiasDe`.
  `listarCarpetas` y `carpetasPropiasPorNombre` se quedan.
- `tests/dobles.ts`, `tests/drive-carpetas.test.ts` y
  `tests/store-carpeta-base.test.ts`: se van sus partes.

## 6. Documentos

- `product-design/product/specs/E05-Cimientos.md` C05.7.4.
- `product-design/ux/user-flows.md` F8 y F19.
- `product-design/ux/information-architecture.md` §3 (la ruta y la entidad).
- `product-design/ux/design-system.md`, si la ficha lo pide.
- `CLAUDE.md`: la API key en «Drive y Google Cloud», y sale la línea del Picker
  de «No proponer».
- `BACKLOG.md`: sale la fila P26.

## 7. Cerrar

`npm run typecheck`, `npm test` y `npm run build` en verde. Commits en
`p26-carpeta`, sin push.
