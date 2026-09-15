# Compartir recetas — diseño (P23)

**Fecha:** 2026-09-14
**Estado:** Implementado el 2026-09-14; falta probarlo en el teléfono.
**Resuelve:** `product-design/plan/BACKLOG.md` P23.
**Entrega:** un único commit —código, spec, plan y documentación—, para poder
revertir la función entera de una vez.

---

## 1. Qué cambia

| | Hoy | Con este diseño |
|---|---|---|
| Mandarle una receta a alguien | No se puede desde la app | Ícono de compartir en la receta → *PDF*, *Link* o *Texto* |
| Lo que recibe | — | Un PDF de la receta, un link que la muestra sin login, o la receta como texto |
| Abrir la app sin sesión | Siempre pide conectar | `#/ver…` se dibuja sin login y sin tocar Drive |

Lo compartido es una copia del momento: el PDF, el link y el texto llevan la receta como
estaba al compartirla. Nada queda publicado en Drive y no hay nada que revocar.

## 2. En la receta: el ícono y la ficha

```
‹                        [⇪]  [▣ .md]

Baba ganush
…

┌ Compartir ──────────────────────────┐
│  PDF                                │
│  Link                               │
│  Texto                              │
│  Cancelar                           │
└─────────────────────────────────────┘
```

- El ícono va en el encabezado de la receta, a la izquierda del link al `.md`. Es un ícono
  nuevo, `ICO.compartir`, de trazo como los demás; `design-system.md` §3.4 lo suma.
- Tocarlo abre una ficha al pie con *PDF*, *Link*, *Texto* y *Cancelar*. Abrir la ficha llama a
  `precargar()` (§4.3): el toque que genera el PDF es el segundo y tiene su propia ventana
  de activación.
- La ficha no cambia la URL: es estado de la pantalla, como la confirmación de *Descartar*.
  Volver, *Cancelar* o tocar fuera la cierran.

### 2.1 PDF

1. Tocar *PDF* genera el archivo (§4) y llama a `navigator.share({ files: [pdf], title })`.
2. El archivo se llama como el `.md` de la receta con extensión `.pdf`
   (`baba-ganush.pdf`), con `slugArchivo(titulo)`.
3. Mientras genera, *PDF* muestra el spinner y la ficha no acepta otro toque.

| Resultado | Qué pasa |
|---|---|
| El menú de Android se abre | La ficha se cierra |
| El usuario cancela el menú (`AbortError`) | La ficha se cierra, sin aviso |
| La activación se perdió (`NotAllowedError`) | La ficha pasa a «El PDF está listo» con el botón *Enviar PDF*, que llama a `share` con el mismo archivo ya generado |
| El navegador no puede compartir archivos (`canShare` falso o sin `share`) | El PDF se descarga con un `<a download>` y la ficha se cierra |
| Falla la generación | La ficha muestra «No pude armar el PDF.» con *Reintentar* |

### 2.2 Link

1. Tocar *Link* arma la URL (§5) y llama a `navigator.share({ title, url })`.
2. Sin `navigator.share`, el link se copia con `navigator.clipboard.writeText` y se avisa
   «Link copiado». Si tampoco hay portapapeles, la ficha muestra el link seleccionable.
3. `AbortError` cierra la ficha sin aviso, igual que en el PDF.

### 2.3 Texto

1. Tocar *Texto* arma el texto de la receta (§6) y llama a `navigator.share({ text })`, sin
   `title`: muchas apps lo ignoran, y el título ya va adentro del texto.
2. Sin `navigator.share`, el texto se copia con `navigator.clipboard.writeText` y se avisa
   «Texto copiado». Si tampoco hay portapapeles, la ficha muestra el texto seleccionable.
3. `AbortError` cierra la ficha sin aviso.

## 3. La vista de invitado

`#/ver?r=<carga>` y `#/ver/cocinar?r=<carga>`. Quien abre el link ve la receta sin
conectar con Google.

### 3.1 Lectura: `#/ver?r=…`

```
                                          (sin encabezado con acciones)
┌───────────────────────────────────────┐
│ Baba ganush                           │
│ Entradas y picadas · 6 porciones · …  │
│ Pasta árabe de berenjena.             │
│ ───────────────────────────────────── │
│ fuente: cookieandkate.com/…           │
└───────────────────────────────────────┘
┌ Ingredientes ┐  ┌ Preparación ┐  …
                                   [ Cocinar ]
```

- La cabecera tiene título, contexto (categoría · rinde · tiempo · dificultad), foto si la
  hay, descripción y fuente. **No tiene fila de tags**, y por lo tanto tampoco la marca de
  *Incompleta*: no se dibujan.
- Después, las mismas fichas que la receta: Ingredientes, Preparación, Variaciones, Notas y
  otras secciones.
- El encabezado no tiene volver, ni `.md`, ni compartir. El pie tiene sólo *Cocinar*, si
  hay ingredientes o pasos.
- El título de la pestaña es el de la receta.

### 3.2 Cocinar: `#/ver/cocinar?r=…`

- El mismo modo cocina de la app: conmutador, paso actual, pasos hechos, sol.
- **La única salida es el chevron**, que vuelve a `#/ver?r=…` de la misma receta. *Salir* no
  se dibuja.
- El estado del modo cocina se reinicia al entrar, igual que en la app (C03.2.4).

### 3.3 Link roto

Si la carga no se puede decodificar —cortada, alterada, de una versión desconocida—, la
pantalla dice «Este link está roto o incompleto.» y nada más. No hay login ni botón a la app.

### 3.4 Qué no hace

No lee ni escribe Drive, no pide el token, no toca `localStorage` y no ofrece guardar la
receta en un Recetario propio.

## 4. El PDF

### 4.1 Cómo se ve

Es el estilo aprobado en la prueba `opcion-a-5`:

| | |
|---|---|
| Página | 105 × 180 mm, fondo `--bg` (#17140F) en todas las páginas |
| Cabecera | Un bloque con reborde **recto** de 1 px `--borde` y fondo `--surface`: título (semibold), contexto en `--fg-2`, descripción, divisor y «fuente: …» con link |
| Secciones | Sin reborde. Título semibold con una línea `--borde-fuerte` debajo |
| Ingredientes | Lista con «•» y sangría colgante; los rótulos de grupo en mayúsculas chicas `--fg-2` |
| Preparación | Numerada con sangría colgante, número en `--fg-3`; los tramos con subtítulo reinician la numeración |
| Variaciones | Subtítulo semibold y párrafo |
| Notas y otras | Párrafos y listas con «•» |
| Cuerpo | Un solo tamaño para ingredientes, pasos, variaciones y notas |
| Inline | Negrita, itálica y links del markdown |

Tamaños en puntos PDF, los de la prueba (px CSS × 0,52 × 0,75): cuerpo 6,25 pt, título
9,4 pt, títulos de sección 7 pt, contexto y fuente 5,5 pt. Márgenes laterales de 8 mm.
Son el punto de partida: se ajustan mirando el PDF en el teléfono.

**No lleva:** tags, marca de incompleta, foto, link al `.md`, ni botones.

**Paginación:**

- Ningún ingrediente, paso, variación ni ítem de nota se parte entre páginas.
- Cada título de sección va agrupado con su primer ítem en un bloque que no se parte:
  un título nunca queda solo al pie.
- Una sección vacía no se dibuja, igual que en la receta.

### 4.2 Fuentes

Inter regular, semibold e itálica, recortadas una vez al armar el repo a Latin-1, rayas,
comillas, bullet, `°`, `€` y las fracciones U+2150–215E. Viven en `src/pdf/fuentes/` con su
licencia OFL, y se importan con `?url`: caen en `/assets/` y el service worker las sirve
caché-primero.

### 4.3 La librería

`pdfmake` 0.3.11, con `@types/pdfmake` como dependencia de desarrollo. Se carga con
`import()` dinámico: no entra en el bundle de arranque.

- `precargar()` dispara el `import()` y el `fetch` de las tres fuentes, y guarda la promesa.
  Llamarlo dos veces no pide dos veces.
- `generar(receta, categoria)` espera esa promesa, arma el documento con
  `documentoPdf()` (§7.2) y devuelve un `Blob` `application/pdf`.

## 5. El link

```
https://alelarre.github.io/recetario/#/ver?r=1<base64url>
```

- La carga es `JSON.stringify({ c: categoria, md })`, comprimida con
  `CompressionStream('deflate-raw')` y pasada a base64url. El `1` inicial es la versión del
  formato: `decodificar` rechaza cualquier otra.
- `md` es `serialize()` de la receta con `tags: []` y `extras: {}`.
- La categoría viaja aparte porque el `.md` no la lleva: sale de la carpeta.
- La URL base es `location.origin + import.meta.env.BASE_URL`.
- Todo va en el fragmento: no llega a GitHub Pages ni tiene límite de servidor. Medido con
  recetas reales: 383 caracteres la más corta, ~950 la típica, 2075 la más larga. Un link de
  2075 llegó entero y tocable a WhatsApp.

## 6. El texto

Es la receta casi como está en el `.md`, sin lo que en texto plano se ve mal. Conserva lo
que WhatsApp entiende como formato: negrita, itálica y las dos listas.

| En el `.md` | En el texto |
|---|---|
| Frontmatter | Título en la primera línea; debajo, el contexto (categoría · rinde · tiempo · dificultad). Sin tags, `completa`, foto ni claves extra |
| Descripción | Tal cual, tras un renglón en blanco |
| `## Sección` | El nombre de la sección, tras un renglón en blanco |
| `### Subtítulo` | El subtítulo, sin los `#` |
| `**negrita**` | `*negrita*` |
| `*itálica*` | `_itálica_` |
| `- ítem` | `- ítem` |
| `1. paso` | `1. paso` |
| `[texto](url)` | `texto (url)`; si el texto es la URL, sólo la URL |
| `![](url)` | La URL |
| La fuente | Al final, tras un renglón en blanco: `Fuente: …`, con el mismo tratamiento de links |

```
Baba ganush
Entradas y picadas · 6 porciones (unas 1¾ tazas) · 55 min · fácil

Pasta árabe de berenjena.

Ingredientes
- 900 g de berenjenas italianas (2 chicas o medianas)
- 2 dientes de ajo medianos, prensados o picados
…

Preparación
1. Precalentar el horno a 230 °C, con una rejilla en el tercio superior. …
…

Fuente: https://cookieandkate.com/epic-baba-ganoush-recipe/
```

Los renglones en blanco se colapsan: nunca hay dos seguidos. Una sección vacía no aparece.

## 7. Arquitectura

### 7.1 Lo que comparten la app y el invitado

La vista de invitado es una pantalla con su propio controlador, armada con las mismas
piezas que la receta. Lo que se agregue a la receta —su cabecera, su encabezado, sus
acciones— no llega al invitado salvo que se sume a propósito.

| Pieza | Qué es | Origen |
|---|---|---|
| `src/ui/fichas-receta.ts` | `fichaCabecera({ receta, categoria, marcas })` —título, contexto, foto, descripción y fuente, con un lugar para las marcas que la receta pone y el invitado no—, `fichasDelCuerpo(receta)`, `botonCocinar(receta)` y `pieDeAcciones(html)` | Sale de `src/ui/receta.ts` |
| `src/ui/cocina.ts` | `renderCocina`, con `salidas: 'volver-y-salir' \| 'solo-volver'` obligatorio | Existe; suma el parámetro |
| `src/cocina-control.ts` | El estado del modo cocina —posición, paso actual, hechos, scroll por posición, si se entró desde la lectura— con `reiniciar()`, `conmutar()`, `marcarPaso()`, `salirALectura()`, y la pantalla encendida: `mantenerPantalla()`, `soltarPantalla()`, `alternarPantalla()` y `necesitaRepedir()` | Sale de `src/main.ts` |
| `src/ui/markdown.ts` | Un parser de bloques (párrafo, lista, lista numerada, `###`) con tramos en línea (texto, negrita, itálica, link, imagen), `tramosDeFuente()`, y tres salidas: `aHtml()`, `aPdf()` y `aTexto()` | Se parte el actual en parser + salida HTML |
| `src/ui/pintar.ts` | `pintar(html)` sobre `#app` y `conClosest(destino)`, que estrecha el destino de un click para la delegación | Sale de `src/main.ts` |
| `contextoDe(receta, categoria)` en `src/recipe.ts` | La línea «categoría · rinde · tiempo · dificultad» | Sale de `src/ui/receta.ts` |

Cada controlador conserva lo suyo: la receta, su cabecera con tags y *Incompleta*, su
encabezado con `.md` y compartir, y el `switch` de acciones de la app; el invitado, su
cabecera sin marcas, sin encabezado, y su propio manejador con cinco acciones:
`cocinar`, `volver-receta`, `conmutar`, `paso` y `wake`.

### 7.2 Lo nuevo

| Módulo | Responsabilidad |
|---|---|
| `src/link-receta.ts` | `codificar(receta, categoria): Promise<string>` y `decodificar(carga): Promise<{ receta, categoria } \| null>`. Nunca tira: una carga inválida es `null` |
| `src/texto-receta.ts` | `textoReceta(receta, categoria): string`: el texto del §6, armado con `aTexto()` para cada sección. Pura |
| `src/pdf/documento.ts` | `documentoPdf(receta, categoria)`: la definición de documento de pdfmake. Pura, sin DOM ni pdfmake |
| `src/pdf/generar.ts` | `precargar()` y `generar()`: el `import()` de pdfmake, las fuentes y el `Blob` |
| `src/pdf/fuentes/` | Los tres `.ttf` recortados y `OFL.txt` |
| `src/ui/compartir.ts` | `renderFichaCompartir(estado)`: la ficha en sus estados —opciones, generando, «El PDF está listo», error, el link o el texto seleccionable— |
| `src/compartir.ts` | `compartirPdf()`, `compartirLink()` y `compartirTexto()`: `share`, `canShare`, la descarga y el portapapeles, y la traducción de cada resultado al estado de la ficha |
| `src/ui/invitado.ts` | `renderInvitado({ receta, categoria })` y `renderLinkRoto()` |
| `src/invitado.ts` | El controlador: decodifica la carga, dibuja lectura o cocina, maneja `cocinar`, `volver-receta`, `conmutar`, `paso` y `wake`, y escucha `hashchange` |
| `src/inicio.ts` | La entrada de `index.html`: importa el CSS y decide entre la app y el invitado |

### 7.3 El arranque

`index.html` carga `src/inicio.ts`, que pregunta `esHashDeInvitado(location.hash)`. Si es
`#/ver` o `#/ver/…`, importa `invitado.ts` y llama a `iniciarInvitado()`; si no, importa
`main.ts`. En modo invitado `main.ts` no se carga: no se crea el store, no se pide el
token, no se registra ningún listener de la app. `esHashDeInvitado` y `rutaDeInvitado`
viven en `src/ui/router.ts`.

## 8. Tests

| Qué | Dónde |
|---|---|
| Ida y vuelta del link con las tres recetas medidas; tags y extras no viajan; carga cortada, alterada, vacía o de otra versión → `null` | `tests/link-receta.test.ts` |
| El documento: sin tags; cada paso e ítem `unbreakable`; título agrupado con su primer ítem; sección vacía ausente; fracciones intactas; negrita e itálica como tramos | `tests/pdf-documento.test.ts` |
| El parser de markdown: los tests actuales de `aHtml` pasan sin cambios; `aPdf` produce los tramos esperados; `aTexto` convierte negrita, itálica, links e imágenes según el §6 | `tests/markdown.test.ts` |
| El texto: el baba ganush completo contra un texto esperado; sin tags ni `completa`; sin dos renglones en blanco seguidos; fuente al final | `tests/texto-receta.test.ts` |
| El control del modo cocina: marcar, dar por hecho, conmutar, reiniciar | `tests/cocina-control.test.ts` |
| La vista de invitado y su cocina: los `data-accion` presentes están dentro de `cocinar`, `volver-receta`, `conmutar`, `paso`, `wake`; no hay chips, ni `.md`, ni *Salir*; link roto | `tests/vista-invitado.test.ts` |
| El controlador del invitado: dibuja la receta del link, Cocinar y volver, link roto | `tests/invitado.test.ts` |
| El arranque: `#/ver…` carga el invitado y no `main.ts`; cualquier otro hash, al revés | `tests/inicio.test.ts` |
| Compartir cableado en la receta: abrir la ficha, PDF con `share` de archivos, texto y link | `tests/main-rutas.test.ts` |
| Compartir: éxito, `AbortError`, `NotAllowedError` → *Enviar PDF*, sin `canShare` → descarga, sin `share` → portapapeles, para PDF, link y texto | `tests/compartir.test.ts` |
| La ficha en cada estado, y el ícono en el encabezado de la receta | `tests/vista-receta.test.ts` |

Los tests actuales del modo cocina y de la receta siguen verdes con la extracción.

## 9. Entrega

- Un único commit con: el código, las fuentes, `pdfmake` y `@types/pdfmake`, este spec y su
  plan, P23 resuelto en `BACKLOG.md`, `design-system.md` §3.4 con el ícono nuevo, y
  `CLAUDE.md` al día.
- Antes del commit: tests, `npm run typecheck` y `npm run build` en verde, y el diff
  revisado por el usuario.
- Después del commit, a `main` para probar en el teléfono sobre Pages.

### 9.1 Lo que sólo se verifica en el teléfono

- Que el chunk de pdfmake funcione dentro del build de Vite.
- Cuánto tarda en generar en un Android real, y si la primera vez entra en la ventana de
  activación.
- Cómo llega el PDF a WhatsApp, y cómo se ve el texto en WhatsApp y en otra app destino.
- Que el link abra la vista de invitado desde WhatsApp, y el modo cocina con la pantalla
  encendida.
