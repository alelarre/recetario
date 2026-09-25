# Plan — Arquitectura frontend: navegación, velo y componentes

> **Para agentes:** usar superpowers:subagent-driven-development, una tarea por vez. Los pasos van con `- [ ]`.

**Objetivo:** arreglar todo lo que marcó el diagnóstico (P85) y cerrar P84.

**Arquitectura:**
- Primero se ordena `main.ts`: el estado de la pantalla pasa a un objeto, las acciones a un mapa y hay un solo camino para dibujar una parte de la pantalla.
- Después se extraen los módulos, uno por tarea: navegación, velo, lista, fotos, visor y carrusel.
- Cada tarea deja la app andando y los tests en verde.

**Spec:** `docs/superpowers/specs/2026-09-25-arquitectura-frontend-design.md`. Es la autoridad. Leelo entero antes de cada tarea.

## Reglas para todas las tareas

- **Test primero.** Al cerrar la tarea, `npm test`, `npm run typecheck` y `npm run build` en verde.
- **Commits en la rama del worktree.** A `main` no llega nada sin el visto bueno del usuario sobre el diff.
- **Idioma:** todo en español rioplatense: UI, comentarios y nombres.
- **Comentarios:** no citan el backlog, ni `docs/superpowers`, ni cosas borradas. Dicen la razón vigente y pueden citar `product-design/`.
- **Tests:** en Node con el DOM falso, sin `instanceof` contra clases del navegador. Las decisiones van en módulos puros.
- **Tests de algo que se borra:** se borran con el código, no se adaptan.
- **`tests/main-rutas.test.ts`:** es el arnés de `main.ts`. Si un módulo sale de `main.ts`, los tests que lo cubren pueden quedar ahí o pasar a un archivo propio. Nunca se pierden casos.

## Nombres que cruzan tareas

```ts
// src/ui/pintar.ts
pintarParte(elemento: Element, html: string, donde?: 'reemplazar' | 'adentro'): void   // completa las fotos como pintar()

// src/navegacion.ts  (T3)
crearNavegacion({ location, history }): Navegacion
interface Navegacion {
  ir(hash: string): void;
  reemplazar(hash: string): void;
  hayAtras(n?: number): boolean;
  volver(respaldo: string, n?: number): void;
  numerar(): void;                      // en cada hashchange: le pone profundidad a la entrada que llegó sin state
  abrirCapa(capa: string): void;         // pushState del mismo hash con state.capa
  cerrarCapa(): void;                    // si la entrada actual es una capa, history.back()
  capaActual(): string | null;
}

// src/ui/router.ts  (T4)
MENU: Partial<Record<Vista, DestinoLateral | null>>
// src/ui/gesto-menu.ts  (T4)
ANCHO_MENU = 260; ANCHO_MENU_FIJO = 900

// src/velo.ts  (T5)
crearVelo(dom): Velo
interface Velo {
  escribir<T>(tarea: () => Promise<T>): Promise<T>;       // tilde al terminar bien
  esperar<T>(tarea: () => Promise<T>): Promise<T>;        // sin tilde; visible sólo pasados 250 ms
  conProgreso<T>(texto: string, tarea: (avance: (p: number) => void) => Promise<T>): Promise<T>;
  ocupado(): boolean;                                      // reemplaza a `tapadas > 0`
  alPintar(): void;                                        // lo llama pintar(): saca el velo del cierre
}

// src/lista-control.ts + src/ui/lista-recetas.ts  (T6)
// src/fotos-control.ts; componentes.ts: cuadroDeFoto(foto)  (T7)
// src/visor-control.ts; src/carrusel-control.ts  (T8)
```

---

### Tarea 1: Los borradores sólo en Borradores, y P84

**Archivos:** `src/store.ts`, `src/ui/recetario.ts`, `src/main.ts` (lo que llama a `buscar`, `buscarPorTexto`, `delMenuDiario` y `delaCategoria`), `src/ui/tokens.css`. Tests del store, `vista-recetario`, `main-rutas` y estilos.

- [ ] **Test primero.**
  - `buscar()` sin tags no devuelve recetas con `borrador` en ninguna de sus formas. Con `{ tags: ['borrador'] }` sí.
  - `buscarPorTexto` no las devuelve en ningún grupo, y el tag `borrador` no aparece como motivo.
  - `categoriasConConteo` no las cuenta.
  - El Menú diario y las categorías de *Agregar al plan* no las muestran.
  - El home, sin recetas terminadas y con N borradores, dice «Todavía no hay recetas terminadas. Hay N en Borradores.». Sin nada, dice el texto de hoy.
  - `tokens.css` tiene `html { scroll-padding-top: 64px }` o equivalente en la regla de `html`.
- [ ] **Implementar** según §3 y §6 del spec.
- [ ] Verde. Commit.

### Tarea 2: `main.ts` en orden: estado de pantalla, mapa de acciones y `pintarParte`

Es un refactor mecánico: no cambia el comportamiento, salvo el arreglo de las fotos en la búsqueda de *Agregar al plan*.

**Archivos:** `src/main.ts`, `src/ui/pintar.ts`, `tests/main-rutas.test.ts`, `tests/*pintar*` si existe.

- [ ] **Estado de pantalla.** El estado que hoy se resetea a mano al cambiar de pantalla (`main.ts`, el bloque de `if (cambiaDePantalla) { … }`) pasa a un objeto `estadoDePantalla`, que se crea nuevo con `estadoNuevo()`.
  - Lo que sobrevive entre pantallas se declara aparte, con un comentario de por qué: los cachés, `menuAbierto`, `fotosEditor` mientras el editor sigue abierto, y lo recibido.
  - Test: un estado nuevo tiene los valores iniciales. Además, los tests de `main-rutas` de «cambiar de pantalla limpia…» siguen en verde.
- [ ] **Mapa de acciones.** El listener de click busca `accion` en `acciones: Record<string, (boton, e) => unknown>`, que arman secciones registradas por tema: navegación, menú, lista, fotos, visor, carrusel, plan, categorías, editor, compartir y ajustes.
  - Una acción no registrada no hace nada.
  - Todos los tests existentes siguen en verde sin cambios de comportamiento.
- [ ] **`pintarParte(elemento, html)`** en `pintar.ts` inserta HTML y completa las fotos, igual que `pintar`. Todos los lugares que hoy escriben `innerHTML`, `outerHTML` o `insertAdjacentHTML` fuera de `pintar` pasan por ella:
  - el bloque de *Agregar al plan*;
  - la fila de fotos;
  - las fichas de fotos;
  - el visor;
  - las confirmaciones;
  - los tags del formulario;
  - los avisos.
  - **Test primero:** en *Agregar al plan*, escribir en la búsqueda completa las fotos de Drive de las tarjetas. Hoy falla.
- [ ] Verde. Commit.

### Tarea 3: El módulo de navegación y las salidas

**Archivos:** `src/navegacion.ts` (nuevo), `tests/navegacion.test.ts` (nuevo), `src/main.ts`, `src/invitado.ts`, `src/ui/router.ts`, `src/cocina-control.ts`, `tests/main-rutas.test.ts`, `tests/router.test.ts`.

- [ ] **Test primero, `navegacion.test.ts`, con dobles de `location` y `history`:**
  - `ir` pushea con `profundidad + 1`.
  - `reemplazar` conserva la profundidad.
  - `numerar()` le pone profundidad a una entrada sin `state`: la de la anterior más uno.
  - `hayAtras(1)` y `hayAtras(2)`.
  - `volver(r)` hace `back()` si hay; si no, `reemplazar(r)`.
  - `volver(r, 2)` hace `go(-2)`.
  - Una entrada de profundidad 0 no vuelve.
- [ ] **Implementar `navegacion.ts`.** Las capas quedan para T4.
- [ ] **En `main.ts` e `invitado.ts`, todo `location.hash =`, `location.replace`, `history.back`, `history.go`, `pushState` y `replaceState` pasa por el módulo.** La excepción es el arranque, dentro del módulo o de una función `arrancar` que lo use.
  - Test o grep en un test: fuera de `navegacion.ts` no quedan esas llamadas.
- [ ] **Test primero en `main-rutas`, una salida por fila de la tabla de §1 del spec,** con y sin historial:
  - volver;
  - salir sin guardar;
  - guardar una receta que ya existía;
  - guardar una nueva, que va a `#/r/<id>` con `reemplazar`;
  - Convertir;
  - guardar y borrar una categoría;
  - borrar una receta, que vuelve dos entradas;
  - elegir en *Agregar al plan*, que vuelve una entrada y dibuja una sola vez;
  - *Salir* de la cocina;
  - el chevron de la cocina.
- [ ] **`cambiaDePantalla`** compara la vista y todos los parámetros. Test: en `#/nueva?text=…` con cambios, tocar el link del menú *Nueva receta* pregunta.
- [ ] **La pregunta de cambios sin guardar:** con un destino nuevo, deshacer con `back()` y anotar el destino. *Seguir editando* no deja entradas de más; *Salir sin guardar* hace `ir(destino)`. Test sobre el historial falso: la pila queda como antes.
- [ ] **El router** deja de exportar `ir` y `atras`.
  - El arranque dibuja una vez. Test: una sola pintura al arrancar en `#/` y en un hash que redirige.
  - Se borra la rama `cocinar` de `volver`.
  - `volver-receta` es una sola función que usan la app y el invitado.
- [ ] Verde. Commit (pueden ser varios).

### Tarea 4: Menú lateral y capas en el historial

**Archivos:** `src/navegacion.ts`, `src/ui/router.ts`, `src/ui/gesto-menu.ts`, `src/ui/componentes.ts`, `src/ui/{recetario,plan,ajustes,tag,editor}.ts` y las demás pantallas (para el lateral desde 900 px), `src/main.ts`, `src/invitado.ts`, `src/ui/base.css` y tests.

- [ ] **Capas.**
  - Test primero en `navegacion.test.ts`:
    - `abrirCapa` pushea el mismo hash con `state.capa`;
    - `cerrarCapa` hace `back()` sólo si la entrada actual es una capa;
    - un `popstate` que sale de la capa se informa al que la abrió, por ejemplo con `alCerrarCapa(cb)`.
  - En `main-rutas`, con el historial falso: el menú (en el teléfono), el visor, la ficha de compartir, las fichas de fotos y la categoría de *Agregar al plan* se cierran con el atrás, sin cambiar de pantalla.
  - Cerrarlos con el velo, la cruz o el chevron consume la entrada.
  - Un destino del menú tocado con el menú abierto no deja la capa en el historial.
- [ ] **`MENU` en el router** es la única fuente de qué vista es destino del menú y qué marca.
  - `PANTALLAS_CON_MENU` sale.
  - El gesto, la hamburguesa y el `activo` salen de `MENU`.
  - Las pantallas reciben `menu?: { activo, abierto, borradores }`, y la lista por tag recibe `borradores: true` aparte.
  - Test: para cada vista de `MENU`, la pantalla dibuja la hamburguesa, el lateral con el `activo` correcto y el gesto la abre. Para las demás, dibujan el volver y el gesto no abre nada.
- [ ] **Tocar el destino actual cierra el menú.** Test, incluido el caso de `''` → `#/`.
- [ ] **Desde 900 px, el lateral está en todas las pantallas.**
  - Test: la receta, la categoría y el editor lo dibujan.
  - Test de CSS: desde 900 px, el contenido lleva el `padding-left` del ancho del menú en todas.
- [ ] **`ANCHO_MENU` y `ANCHO_MENU_FIJO` en `gesto-menu.ts`.** Un test de estilos lee `base.css` y verifica que use 260 y 900.
- [ ] **El comentario de `lateral`** nombra las cinco entradas.
- [ ] Verde. Commit.

### Tarea 5: El velo

**Archivos:** `src/velo.ts` (nuevo), `tests/velo.test.ts` (nuevo), `src/main.ts`, `src/store.ts` (el callback de progreso, si hace falta), `src/ui/ajustes.ts`, `src/ui/conexion.ts`, `src/ui/editor.ts` (sin «Guardando…»), `index.html` (la tarjeta del progreso en el velo), `src/ui/base.css` y tests.

- [ ] **Test primero, `velo.test.ts`, con un DOM falso y un reloj falso:**
  - `escribir`: tapa, cierra con el tilde (`.exito`) y se saca en `alPintar()` o por el respaldo.
  - `esperar`: no se ve si termina antes de 250 ms; si pasa ese tiempo, se ve la olla sin tilde.
  - `conProgreso`: se ven la tarjeta, el texto y la barra, y `avance(p)` mueve la barra.
  - `ocupado()` mientras dura cualquiera de las tres.
  - Un error en cualquiera de las tres saca el velo y propaga el error.
  - Anidar dos operaciones no parpadea: hay un contador.
- [ ] **Migrar todas las operaciones de §2 del spec** a `escribir`, `esperar` o `conProgreso`, con una sola envoltura por operación.
  - En cada una, test en `main-rutas`: la escritura cierra con el tilde y recién después navega.
  - Borrar una receta, las categorías y el plan ya no se ven redibujar.
- [ ] **Convertir con Agente:** el velo cubre bajar las fotos y abrir el agente, y el tilde va al final.
- [ ] **Sin «Guardando…» ni `disabled` en ningún botón.** *Convertir* conserva su ícono.
- [ ] **Guardar una receta nueva deja `recetaLeida`.** Test: la pantalla de destino no vuelve a leer.
- [ ] **El reindexado desde Ajustes, el del arranque y la carpeta base usan `conProgreso`.**
  - La pantalla `creando-indice` sale.
  - Test: mientras corre, un `hashchange` se deshace y los clicks no hacen nada.
  - Si falla, sale el aviso con *Reintentar* («No se pudo reindexar.» / «No se pudo preparar la carpeta.»).
  - La barra nunca pinta la pantalla de atrás.
- [ ] **Las lecturas de red al dibujar** la receta, el editor y el plan usan `esperar`.
- [ ] **CSS:** la tarjeta del progreso. Se corrigen los comentarios del tilde: el velo sigue bloqueando.
- [ ] Verde. Commit.

### Tarea 6: La lista de recetas

**Archivos:** `src/lista-control.ts` (nuevo), `src/ui/lista-recetas.ts` (nuevo), `src/ui/{categoria,tag,resultados,plan-agregar}.ts`, `src/ui/componentes.ts`, `src/main.ts`, `src/ui/tokens.css`, `src/ui/base.css` y tests.

- [ ] **Test primero, `lista-control`:**
  - estado inicial;
  - filtrar por tags y duración;
  - el orden se aplica una sola vez: favoritas primero, A–Z o por duración;
  - `mas()` agranda el tramo.
- [ ] **Test primero, `lista-recetas`:** el HTML de una lista plana y de una agrupada (resultados), con el spinner propio del tramo.
- [ ] **Categoría, tag, Borradores, resultados y *Agregar al plan* usan el componente.**
  - Resultados y *Agregar al plan* paginan.
  - *Agregar al plan* usa la lista agrupada de resultados, con su orden y su frase de vacío.
  - Se borran las copias.
  - El observador del tramo mira el spinner de su propia lista.
- [ ] **CSS:**
  - `.fila` es la base común de `.tarjeta`, `.bor` y `.carp`, en `tokens.css`.
  - `.lista`, `.rot`, `.grupo-res`, `.tile`, `.fila-dur` y `.orden` pasan a `tokens.css`.
  - Se borra `.foto`.
  - Tests de estilos para lo que se mueve.
- [ ] Verde. Commit.

### Tarea 7: El gestor de fotos

**Archivos:** `src/fotos-control.ts` (nuevo), `tests/fotos-control.test.ts` (nuevo), `src/ui/editor.ts`, `src/ui/componentes.ts`, `src/ui/gestion-categorias.ts`, `src/main.ts`, `src/ui/tokens.css`, `src/ui/base.css` y tests.

- [ ] **Test primero, `fotos-control`:**
  - `sumarFotos(blobs)` achica, numera y guarda el blob y la URL;
  - `sacar(n)` limpia las referencias y la portada, y hace `revokeObjectURL`;
  - `ponerPortada` y `sacarPortada`;
  - los ocultos del formulario salen del estado;
  - `cambiosDeFotos` y `conSubidas` se mudan acá.
- [ ] **El editor usa el controlador para todo.** La cámara, la galería, las compartidas y *Por URL* entran por `sumarFotos`, y *Por URL* pierde la capa de más.
- [ ] **`filaDeFotos` queda con lo que usa el editor.** Salen `sacar`, `agregar: false`, `porUrl` opcional, `n` opcional y `url: null`, con sus tests y su CSS.
- [ ] **`cuadroDeFoto(foto)` y `.cuadro-foto`** en los cinco cuadros. `sacarFoto` los reconoce por la clase.
  - Test: una portada del editor cuya foto de Drive ya no está muestra el aviso.
- [ ] **La foto de la categoría:**
  - la muestra por un solo camino, que reusa `tile()`;
  - el mismo `<img>` para la foto del catálogo y la propia;
  - `propia:` fuera del campo oculto.
- [ ] Verde. Commit.

### Tarea 8: Visor y carruseles

**Archivos:** `src/visor-control.ts` (nuevo), `src/carrusel-control.ts` (nuevo), `src/ui/visor.ts`, `src/ui/componentes.ts`, `src/ui/pintar.ts`, `src/main.ts`, `src/invitado.ts`, `src/ui/gesto-menu.ts`, CSS y tests.

- [ ] **Test primero, `visor-control`:** abrir, pasar de foto con el gesto, el click que sigue a un deslizamiento no cierra, y cerrar. `main.ts` e `invitado.ts` lo usan y se borran las copias. `renderVisor` sin `data-i` ni `data-total`. Abrir el visor es una capa (T4).
- [ ] **La fila de duraciones es un `carrusel()`.** Test: tiene degradé y flechas, y la misma alineación que la de tags.
- [ ] **`data-deslizable` en el carrusel.** El gesto excluye `[data-deslizable]`. Test en `gesto-menu`.
- [ ] **`carrusel-control`** con `carrusel-izq` y `carrusel-der`, que usan la app y el invitado.
- [ ] **Sin margen doble entre filas.** Test de estilos.
- [ ] Verde. Commit.

### Tarea 9: Documentación

- [ ] Hay que actualizar lo que lista la sección «Documentación» del spec: E05 (R8 y C05.10.1), E02, E03, E04, la IA §4.6, `design-system.md` (la olla, §6.17b, la fila, el cuadro de foto y el carrusel de duraciones) y el mapa de `src/` en `CLAUDE.md`. Todo va sin historial.
- [ ] En `BACKLOG.md`, borrar P84 y P85, y sumar una entrada «Falta probar» con lo que se prueba en el teléfono:
  - el atrás de Android cerrando el menú, el visor, las fichas y la categoría del plan;
  - las salidas de la tabla;
  - el velo en cada escritura;
  - el reindexado bloqueante;
  - el menú fijo desde 900 px.
- [ ] Borrar el spec y este plan.
- [ ] Commit.
