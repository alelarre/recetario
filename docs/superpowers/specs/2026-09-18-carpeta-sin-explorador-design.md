# Elegir la carpeta base sin explorar el Drive

**Resuelve:** `BACKLOG.md` P26.

## 1. El problema

Cuando la app no encuentra una carpeta marcada —o desde *Ajustes → Cambiar
carpeta*— muestra un explorador propio del Drive del usuario: sus carpetas,
nivel por nivel. Una lista de «Documentos, Fotos, Trabajo» adentro del
Recetario no genera confianza: dice que la app ve todo el Drive, aunque el
permiso ya sea ése. Ninguna app hace un explorador propio; cuando hay que
elegir una carpeta aparece la ventana de Google.

## 2. Lo decidido

1. **El explorador propio desaparece.** No se listan carpetas del usuario en
   ninguna pantalla de la app.
2. **La primera vez es una sola decisión:** una explicación corta y el botón
   **Crear la carpeta «Recetario» en Mi unidad**. No muestra nada del Drive.
3. **Ya tengo una carpeta** abre el **Google Picker**: la ventana de Google,
   con su navegación y su búsqueda, limitada a carpetas propias. Al elegir,
   la app confirma con el nombre y prepara la carpeta.
4. **Cambiar carpeta**, desde Ajustes, lleva a la misma pantalla con las dos
   opciones y la aclaración de que la carpeta actual queda como está.
5. **Encontradas** sigue: si hay más de una carpeta marcada, o una sin marca
   que se llama *Recetario*, se ofrecen arriba con un botón *Usar* cada una.
   Es lo único de Drive que la pantalla muestra, y es lo que la app ya sabe
   que le pertenece.
6. **El Picker pide una API key pública,** restringida al origen de Pages y
   a `localhost:8080`, y a la Picker API. Va en `src/config.ts`, como el
   client ID: no es un secreto. Con la constante vacía, *Ya tengo una carpeta*
   no se dibuja y queda sólo crear.
7. **Cuando esto funcione en el teléfono, se borra el selector viejo:** la
   navegación por niveles de `src/ui/carpeta.ts`, `store.carpetasDe`,
   `drive.listarCarpetas` si nadie más lo usa, las acciones `carpeta-usar` y
   `carpeta-crear` con su formulario de nombre, el estado `selector.nivel` y
   sus tests. Esta implementación ya lo hace: no se deja código muerto
   esperando.

## 3. La pantalla `#/carpeta`

`src/ui/carpeta.ts`, reescrito. Estados:

**Primera vez** (sin carpeta marcada), encabezado *Tus recetas en Drive*, sin
volver:
- Un párrafo: *«Recetario guarda cada receta como un archivo en una carpeta
  de tu Google Drive. Podés crearla ahora o elegir una que ya tengas.»*
- **Encontradas**, si las hay: una ficha por carpeta, con el ícono de carpeta,
  el nombre y un botón *Usar* compacto a la derecha.
- **Crear la carpeta «Recetario» en Mi unidad**, primario, a lo ancho.
- **Ya tengo una carpeta**, secundario, a lo ancho. Sólo si hay API key.

**Cambiar carpeta** (desde Ajustes, `#/carpeta?cambiando=1`), encabezado
*Cambiar carpeta* con volver:
- Un párrafo: *«La carpeta actual queda como está en Drive. La app va a usar
  la que elijas.»*
- Los mismos controles.

**Confirmando** (después de *Usar* o del Picker): la ficha que ya existe,
*«Voy a usar <b>nombre</b>. Si faltan categorías, las creo, y después indexo
lo que haya adentro.»*, con *Cancelar* y *Usar*, en el lugar de los botones.
Crear no confirma: el botón ya dice todo, y crea y prepara de una.

**Preparando:** la pantalla de conexión con el progreso, como hoy.

**Error:** el aviso con *Reintentar* en el lugar de los botones, como hoy.

## 4. El Picker

`src/picker.ts`, nuevo. `elegirCarpeta(token: string): Promise<{ id; nombre } | null>`:
- Carga `https://apis.google.com/js/api.js` la primera vez que se necesita,
  con un `<script>` inyectado, y espera `gapi.load('picker')`. No va en
  `index.html`: la mayoría de las sesiones no lo usa.
- Arma el Picker con una `DocsView` de `google.picker.ViewId.FOLDERS`, con
  `setSelectFolderEnabled(true)`, `setOwnedByMe(true)` y
  `setMimeTypes('application/vnd.google-apps.folder')`; el token de `auth`,
  la API key, `setTitle('Elegí la carpeta de tus recetas')` y el idioma
  `es`.
- Resuelve con la carpeta al elegir y con `null` al cancelar. Si el script
  no carga, rechaza y la pantalla muestra *«No se pudo abrir el selector de
  Google.»* con *Reintentar*.
- Los tipos van a mano en `src/picker.d.ts`, como `gis.d.ts`: sólo lo que se
  usa.
- El Picker se ve con el estilo claro de Google. Es el costo aceptado.

## 5. Cableado y store

- `main.ts`: `selector` queda con `sugerencias`, `confirmando`, `cambiando`
  y `error`; se van `nivel` y `creando`. Acciones: `carpeta-sugerida`
  (confirma), `carpeta-crear` (crea *Recetario* en la raíz y prepara, sin
  confirmar), `carpeta-elegir` (abre el Picker; al volver, confirma),
  `carpeta-cancelar`, `carpeta-confirmar` (como hoy).
- `store.crearCarpeta(nombre, 'root')` y `store.prepararCarpeta` quedan como
  están. `store.carpetasDe` se borra. `drive.listarCarpetas` se queda: lo usa
  `prepararCarpeta`.
- Crear y preparar van con el velo de escritura (R8) hasta que empieza la
  pantalla de progreso.
- `config.ts`: `export const API_KEY = '';` con el comentario de para qué es
  y cómo se restringe. El valor real lo pone el usuario.

## 6. Tests

- `tests/vista-carpeta.test.ts`: los estados de la pantalla; sin API key no
  hay *Ya tengo una carpeta*; encontradas con *Usar*.
- `tests/picker.test.ts`: carga el script una vez; resuelve con la carpeta y
  con `null`; rechaza si no carga. `gapi` y `google.picker` falsos.
- `tests/main-rutas.test.ts`: crear prepara y recarga; elegir con el Picker
  falso confirma y prepara; cancelar no hace nada; los tests de la navegación
  por niveles se borran.
- `tests/store-carpeta-base.test.ts`: se borran los de `carpetasDe`.

## 7. Documentos

- `E05-Cimientos.md` C05.7.4: la pantalla nueva.
- `user-flows.md` F8 y F19: el flujo nuevo.
- `information-architecture.md` §3: `#/carpeta` sin niveles.
- `design-system.md`: la ficha de carpeta encontrada, si hace falta.
- `CLAUDE.md`, «Drive y Google Cloud»: la API key —Picker API habilitada,
  restringida por referente— y que la app no explora el Drive.
- `BACKLOG.md`: sale P26.

## 8. Pasos manuales, del usuario

En Google Cloud Console, el mismo proyecto del cliente OAuth:
1. Habilitar **Google Picker API**.
2. Crear una **API key**, restringida a *Sitios web* con
   `http://localhost:8080/*` y `https://alelarre.github.io/*`, y a la
   Picker API.
3. Pegarla en `src/config.ts`.

## 9. Probar en el teléfono

- Sin carpeta marcada: crear, y que aparezca el Recetario con las 16
  categorías.
- Cambiar carpeta con el Picker: que la ventana se abra, elegir, confirmar,
  y que la app recargue con la nueva.
- Cancelar el Picker: nada cambia.
