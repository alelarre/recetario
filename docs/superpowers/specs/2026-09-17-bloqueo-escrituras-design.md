# Bloquear la pantalla mientras una escritura está en curso

**Resuelve:** `BACKLOG.md` P36.

## 1. El problema

Mientras la app escribe en Drive o en Sheets —guardar una receta, descartar un
borrador, borrar una categoría— la pantalla sigue respondiendo: se puede tocar
otra cosa, navegar con un link o con el gesto de atrás de Android, o repetir la
misma acción. El resultado o el error de la escritura llega entonces a una
pantalla que ya no es la suya, y una acción repetida puede escribir dos veces.

Hoy sólo tres operaciones lo señalan, cada una a su manera: el editor y la
captura ponen «Guardando…» en su botón, la estrella de favorito se anima y no
acepta otro toque, y Reindexar oculta sus controles y muestra el avance.

## 2. Lo decidido

**Un solo mecanismo en `main.ts`, y no uno por pantalla.** Mientras haya una
escritura en curso:

1. **Se ve.** Un velo translúcido cubre la pantalla, con el spinner centrado,
   desde que la escritura arranca hasta que termina. Los botones que ya dicen
   «Guardando…» se quedan como están: el velo se suma, no los reemplaza.
2. **No se toca.** Los listeners de `#app` —click, input, change, keydown,
   focusout y los tres de touch— no hacen nada. El velo además lleva
   `pointer-events: auto`, así ningún control recibe el toque.
3. **No se navega.** Si cambia el hash —un link, el volver del encabezado o el
   gesto de atrás—, `render()` no dibuja la pantalla nueva y vuelve a poner la
   URL de la pantalla que estaba escribiendo, con `history.pushState`, igual
   que hace el editor con cambios sin guardar (C04.1.1).
4. **Se suelta siempre.** Termine bien o mal, el velo se va y todo vuelve a
   responder. Después, cada operación sigue haciendo lo que hace hoy: navegar,
   redibujar o mostrar su aviso con lo escrito todavía en pantalla (R1).

**Lo que está adentro y lo que no**

| Operación | Acción de `main.ts` | Entra |
|---|---|---|
| Guardar o crear una receta, también desde un borrador o desde Claude | `guardar` | Sí |
| Borrar una receta | `borrar-confirmado` | Sí |
| Guardar una captura, nueva o editada | `guardar-captura` | Sí |
| Descartar un borrador | `descartar-confirmado` | Sí |
| Crear o editar una categoría | `guardar-categoria` | Sí |
| Borrar una categoría | `borrar-categoria-confirmado` | Sí |
| Crear la carpeta «Recetario» desde la pantalla de carpeta | `carpeta-crear` | Sí |
| Marcar o quitar favorito | `favorito` | **No.** Ya tiene su estrella animada, y no debe trabar la lectura de la receta. |
| Reindexar | `reindexar` | **No.** Ya oculta sus controles y muestra el avance; no se puede cancelar y no cambia. |
| Preparar la carpeta base (setup) | `carpeta-confirmar` | **No.** Dibuja su propia pantalla de progreso y termina navegando. |
| Conectar de nuevo con Google | `conectar-de-nuevo`, `reconectar` | **No.** Abre el popup de Google: el velo taparía la pantalla mientras el usuario está en otra ventana. |

## 3. Cómo se implementa

**Un contador y un helper en `main.ts`:**

```ts
/** Cuántas escrituras hay en curso, y la pantalla que las lanzó. */
let escrituras = 0;
let hashEscritura = '';

/** Envuelve la promesa de una escritura: el velo mientras dura, y se suelta siempre. */
async function escribiendo<T>(p: Promise<T>): Promise<T> {
  if (escrituras++ === 0) { hashEscritura = location.hash; mostrarVelo(true); }
  try { return await p; }
  finally { if (--escrituras === 0) mostrarVelo(false); }
}
```

Cada operación de la tabla envuelve **sólo la llamada al store** —o a
`convertirBorrador`—, no el manejador entero: así el propio manejador puede
navegar o redibujar cuando la escritura terminó, sin que el bloqueo lo
frene. Por ejemplo `await escribiendo(store.borrar(id))`.

**El velo** es un `<div id="velo-escritura" hidden>` en `index.html`, hermano de
`#app` y no hijo: `pintar()` reemplaza el `innerHTML` de `#app`, y la captura
redibuja antes de escribir. `mostrarVelo` conmuta `hidden` y pone `aria-busy`
en `#app`. El CSS va en `base.css`, al lado de `.velo-lat`: `position: fixed;
inset: 0; z-index: 30; background: var(--velo); opacity: .6; display: grid;
place-items: center;` con `.spin` adentro. Sin transición: aparece con la
escritura y se va con ella.

**Las guardas.** Al principio de cada listener de `#app`: `if (escrituras) return;`.
En `render()`, antes de la guarda del editor:

```ts
if (escrituras && cambiaDePantalla) { history.pushState(null, '', hashEscritura); return; }
```

`hashEscritura` se toma al arrancar la primera escritura y no cuando llega el
`hashchange`: en ese momento `location.hash` ya es el destino.

**Nada cambia en `store.ts`, `compartido.ts` ni en `src/ui/`**, salvo el CSS
del velo. Las pantallas no saben del bloqueo.

## 4. Casos borde

- **Dos escrituras a la vez** no pueden pasar por los toques —el primero
  bloquea al segundo—, pero el contador las soporta igual: el velo se va con
  la última.
- **La escritura falla:** el `finally` suelta el velo y el manejador muestra
  su aviso como hoy. Sin sesión, el aviso ofrece *Conectar* (R3) y esa acción
  no entra en el bloqueo.
- **`document.querySelector('#velo-escritura')` devuelve `null`** en los tests,
  que corren contra un DOM mínimo: `mostrarVelo` lo tolera con `?.`.
- **El gesto del menú lateral** también se ignora: entra por `touchstart`.
- **Recargar la pestaña** durante una escritura no se bloquea: es del
  navegador, y R2 dice que el reintento reescribe todo.

## 5. Tests

En `tests/main-rutas.test.ts`, con un store falso cuya operación devuelve una
promesa que el test resuelve a mano:

1. Mientras `crear` está pendiente, tocar otra acción no hace nada y cambiar
   el hash no dibuja la pantalla nueva: la URL vuelve a la del editor.
2. Al resolver, el velo se va y la operación termina como hoy (navega a la
   receta creada).
3. Al rechazar, el velo se va y el aviso aparece con lo escrito.
4. `favorito` no muestra el velo.
5. Con la captura, lo mismo que 1 y 2.

Para ver el velo en los tests, el `document` falso de `montar()` devuelve un
objeto con `hidden` para `#velo-escritura`.

## 6. Documentos

- `product-design/product/specs/E05-Cimientos.md`: una regla transversal
  nueva, **R8 — Una escritura por vez**, con el velo, las tres cosas que no
  pasan mientras dura y las excepciones de la tabla.
- `product-design/ux/design-system.md`: el velo de escritura junto al velo del
  menú lateral.
- `BACKLOG.md`: sale P36.

## 7. Probar en el teléfono

- Guardar una receta: el velo aparece, el volver no sale del editor, y al
  terminar abre la receta.
- Descartar un borrador y borrar una categoría: el velo, y la pantalla que
  corresponde al terminar.
- Sin red: la escritura falla, el velo se va y queda el aviso.
- Favorito: sin velo, la estrella como siempre.
