# Gestión de categorías — diseño (P15/P19, etapa 3a)

**Fecha:** 2026-09-13
**Estado:** Aprobado en conversación; pendiente de revisión escrita.
**Resuelve:** la etapa 3a de `product-design/plan/BACKLOG.md` P15/P19.
**Se apoya en:** `docs/superpowers/specs/2026-09-13-categorias-en-el-indice-design.md`
(etapa 1) y `docs/superpowers/specs/2026-09-13-carpeta-base-design.md` (etapa 2).

---

## 1. Qué cambia

| | Hoy | Con este diseño |
|---|---|---|
| Crear una categoría | Crear una carpeta en Drive y reindexar | *Ajustes → Recetario → Categorías → Nueva* |
| Renombrarla | Renombrar la carpeta en Drive y reindexar | Desde su edición |
| Cambiar color o foto | No se puede | Desde su edición: la paleta y el catálogo |
| Borrarla | Borrar la carpeta en Drive y reindexar | Desde su edición, con una advertencia explícita |
| La carpeta en Ajustes | En la ficha Cuenta | En una ficha propia, «Recetario», junto a las categorías |

Las predefinidas no tienen trato especial: se crean en el setup (etapa 2) y después se
renombran, se editan y se borran como cualquier otra. El setup sólo corre al elegir una
carpeta, así que una predefinida borrada o renombrada queda así.

## 2. Ajustes: la ficha «Recetario»

```
Cuenta                  alguien@gmail.com   [Salir]
                        Salir no borra nada de Drive.

Recetario
Carpeta: Recetario                 [Cambiar carpeta]
16 categorías                         [Categorías ›]

Índice · Archivos locales · Avisos · Registro de actividad
```

- Va segunda, después de Cuenta. La línea de la carpeta sale de Cuenta y pasa acá.
- «Categorías ›» lleva a `#/categorias`.
- Mientras reindexa, la ficha no ofrece nada, igual que Índice y Archivos locales.

## 3. Las pantallas

### 3.1 La lista: `#/categorias`

```
‹  Categorías                    [ + Nueva ]

🖼 Arroces y legumbres     4 recetas     ›
🖼 Aves                     7 recetas     ›
▦  Fiambres                 0 recetas     ›
```

- Alfabética, como la grilla del Recetario.
- Cada fila: la miniatura —la foto sobre su color, o la trama—, el nombre y cuántas
  recetas tiene. Abre `#/categorias/<id>`.
- «+ Nueva» abre `#/categorias/nueva`.

### 3.2 La edición: `#/categorias/<id>` y `#/categorias/nueva`

```
‹  Pastas                                 [Guardar]

[ tile de muestra: foto, color y nombre ]

Nombre   [ Pastas                         ]

Color    ● ● ● ● ● ● ● ●
         ● ● ● ● ● ● ● ●

Foto     [🖼][🖼][🖼][🖼]
         [🖼][🖼][🖼][ ▦ ]

         [ Borrar categoría ]
```

- **El tile de muestra** arriba es el que va a quedar en el Recetario, y se actualiza al
  cambiar nombre, color o foto sin redibujar el formulario.
- **Color:** las 16 claves de `CLAVES_COLOR`, como muestras redondas. La elegida va
  marcada.
- **Foto:** las fotos del catálogo (`src/categorias/*.webp`) y una opción «sin foto», que
  muestra la trama.
- **Una categoría nueva** arranca con el primer color que ninguna otra use —si todos
  están en uso, el neutro— y sin foto.
- **Guardar** está disponible sólo con cambios y con un nombre válido.
- **Nombre válido:** no vacío, no empieza con `_`, y no coincide —con `normalizar()`— con
  el de otra categoría. Con un nombre inválido, una línea debajo del campo dice por qué.
- **Borrar categoría** aparece sólo al editar, en rojo (§3.3).
- **Salir con cambios sin guardar** pregunta antes, con la misma confirmación que el
  editor de recetas.
- **Guardar** vuelve a la lista. **Si falla,** el aviso de siempre, y lo escrito queda.

### 3.3 La confirmación de borrado

Reemplaza el botón, como la de borrar una receta.

Con recetas:

> **Pastas y sus 12 recetas van a la papelera de Drive.**
> Dejan de verse en la app. Se pueden recuperar desde la papelera de Drive, y después
> hay que reindexar.
> Ñoquis, Lasaña, Ravioles y 9 más.
>
> [ Cancelar ]  [ Borrar Pastas y 12 recetas ]

Vacía:

> **Pastas va a la papelera de Drive.**
>
> [ Cancelar ]  [ Borrar Pastas ]

- Se nombran hasta tres recetas, en orden alfabético, y el resto se cuenta.
- El botón de confirmar es rojo y dice lo que hace.
- Borrar vuelve a la lista. Si falla, el aviso queda donde estaba la confirmación.

## 4. Las operaciones

Tres operaciones del store. Cada una termina en `persistir()`.

| Operación | Pasos |
|---|---|
| `crearCategoria({ nombre, color, foto })` | Crea la carpeta en la raíz → escribe `color` y `foto` en sus `appProperties` → agrega su fila a la hoja `categorias` → persiste. Devuelve la `Categoria`. |
| `editarCategoria(id, { nombre, color, foto })` | Si cambió el nombre, renombra la carpeta → si cambiaron color o foto, escribe las propiedades → reescribe su fila → actualiza las recetas en memoria (§5) → persiste. |
| `borrarCategoria(id)` | Manda la carpeta a la papelera → borra en **una sola llamada** (`borrarFilas`) las filas de las recetas con ese `carpeta_id` y corre los números de fila de las que quedan → borra la fila de la categoría → persiste. |

`crearCategoria` y `editarCategoria` validan el nombre con la misma regla de §3.2 y
rechazan uno inválido sin tocar Drive.

`store.recetasDe(id)` devuelve las entradas de una categoría, para el conteo de la lista y
los nombres de la confirmación.

## 5. El nombre de la categoría de cada receta

Hoy la fila de una receta guarda el nombre de su categoría, y `Entrada.categoria` sale de
esa columna. Renombrar una categoría obligaría a reescribir todas sus filas, y la cuota de
escritura de Sheets es de 60 por minuto.

Con este diseño **`Entrada.categoria` se deriva de `carpeta_id`**:

- Al cargar recetas —de la planilla o de la copia— y después de reindexar, cada entrada
  toma el nombre de `ctx.carpetas` por su `carpeta_id`. Una receta en la raíz es
  *Sin categorizar*; una con un `carpeta_id` que no está entre las categorías, también.
- `editarCategoria` actualiza en memoria las entradas de esa carpeta y la copia se guarda
  con el nombre nuevo.
- La columna `categoria` de la hoja `recetas` se sigue escribiendo al guardar y al
  reindexar, pero la app no la lee: puede quedar desactualizada hasta la próxima
  escritura de esa fila.

## 6. Fallas

La regla es la de siempre (R1): se avisa y lo escrito queda en pantalla.

- **Crear se corta después de la carpeta:** la carpeta existe sin fila; *Reindexar* la
  agrega.
- **Editar se corta después de renombrar o escribir propiedades:** la fila queda vieja;
  *Reindexar* la rearma desde la carpeta.
- **Borrar se corta después de la papelera:** las filas quedan; *Reindexar* las saca.

## 7. Tests

**Store:**
- `crearCategoria` crea la carpeta en la raíz con sus propiedades, agrega la fila y la
  copia coincide con la planilla.
- `editarCategoria` renombra y escribe propiedades sólo si cambiaron, reescribe sólo la
  fila de la categoría —ninguna de recetas—, y las recetas de esa carpeta muestran el
  nombre nuevo, también al volver a abrir desde la copia y al cargar desde la planilla.
- `borrarCategoria` manda la carpeta a la papelera, borra las filas de sus recetas en una
  llamada, corre los números de fila de las que quedan —la copia coincide con la
  planilla— y saca la fila de la categoría.
- Los tres rechazan un nombre vacío, con `_` o repetido.
- `Entrada.categoria` sale de `carpeta_id` al cargar, aunque la columna diga otra cosa.

**Vistas:**
- La lista: orden, conteo, miniatura con foto o trama, «+ Nueva».
- La edición: color inicial de una nueva, las muestras y las fotos con la elegida marcada,
  la línea del nombre inválido, Guardar deshabilitado sin cambios, Borrar sólo al editar.
- La confirmación: con recetas —cantidad, hasta tres nombres, «y N más», el botón— y
  vacía.
- Ajustes: la ficha «Recetario» segunda, con la carpeta y «Categorías ›», y Cuenta sin la
  carpeta.

**`main`:** las rutas `#/categorias`, `#/categorias/nueva` y `#/categorias/<id>`; guardar
vuelve a la lista y registra las categorías; salir con cambios pregunta; borrar vuelve a
la lista.

**Verificación en el teléfono:**
1. Crear «Fiambres» con un color y una foto: aparece en el Recetario.
2. Renombrarla: el Recetario y sus recetas muestran el nombre nuevo, también al volver a
   abrir la app.
3. Borrar una categoría con recetas: la advertencia las cuenta; confirmar la saca del
   Recetario, y la carpeta está en la papelera de Drive.

## 8. Documentos que cambian

- **`E05-Cimientos.md`:** C05.9b.1 —la carpeta pasa a la ficha «Recetario»— y una
  capacidad nueva, C05.9b.4, para gestionar categorías.
- **`design-system.md` §2.3:** las categorías se crean y se editan desde la app, con la
  paleta y el catálogo.
- **`CLAUDE.md`:** «agregar una categoría es crear una carpeta en Drive» deja de ser el
  camino; el orden de Ajustes; el estado.
- **`decision-log.md`:** una fila con las predefinidas sin trato especial, el borrado con
  sus recetas, y `Entrada.categoria` derivada de `carpeta_id`.
- **`BACKLOG.md`:** la etapa 3a hecha en P19, y el orden de Ajustes de P25 con la ficha
  nueva.

## 9. Fuera de alcance

- **Etapa 3b:** subir imágenes propias a Drive y guardarlas en Cache Storage.
- Reordenar las categorías: siguen alfabéticas.
- Mover recetas entre categorías en lote.
