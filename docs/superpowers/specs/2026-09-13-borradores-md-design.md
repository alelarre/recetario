# Borradores como `.md` — diseño

**Fecha:** 2026-09-13
**Estado:** Implementado y probado en el teléfono `[2026-09-15]`.
**Reemplaza:** `product-design/plan/BACKLOG.md` P21.
**Reabre:** «El borrador no entra al índice» (`information-architecture.md` §2.1),
C01.4.1, C01.4.2, C01.6.2 y C01.7.1 de `E01-CapturaYBorradores.md`.
**Se apoya en:** el índice local, `docs/superpowers/specs/2026-09-13-indice-local-design.md`.

---

## 1. Qué cambia

| | Hoy | Con este diseño |
|---|---|---|
| Dónde vive un borrador | Una fila de la planilla `Recetario/_borradores` | Un `.md` en la carpeta `Recetario/_borradores/` |
| Qué lista la app | La planilla entera, leída de Sheets | La hoja `borradores` de `_indice`, desde memoria |
| Copia local | Ninguna | La del índice, que suma los borradores |
| Quién hace las operaciones | `src/borradores.ts` | `src/store.ts`; el formato vive en `src/borrador.ts` |
| Descartar | Borra la fila, sin vuelta atrás | Manda el `.md` a la papelera de Drive |

El borrador sigue siendo una entidad propia: **título, fuente y nota**, más cuándo se
capturó. No es una receta incompleta.

Los borradores que hoy están en la planilla `_borradores` se descartan. La planilla se
borra a mano en Drive; ningún código la vuelve a buscar.

## 2. Los datos

### 2.1 La carpeta

`Recetario/_borradores/`. El arranque ya lista las subcarpetas de `Recetario/`: ahí la
encuentra, por nombre y con tipo carpeta, sin pedidos nuevos. El `_` la deja fuera de las
categorías, como ya hace con cualquier subcarpeta que empiece así.

Si no existe, **se crea al agregar el primer borrador**, no al abrir la app.

### 2.2 El archivo

El nombre sale del título con `slugArchivo`, la misma regla que las recetas:
`pollo-al-disco.md`, `pollo-al-disco-2.md`. Editar el título no renombra el archivo.

```markdown
---
titulo: Pollo al disco
fuente: https://instagram.com/reel/abc
capturado: 2026-09-13T10:30:00.000Z
---

La nota, texto libre, tal cual se escribió.
```

- El frontmatter tiene tres claves: `titulo`, `fuente` y `capturado` (ISO).
- **La nota es el cuerpo entero**, sin encabezados impuestos. Puede tener varias
  líneas, `##` o `---` en el medio.
- Una clave desconocida en el frontmatter se ignora, y no se conserva al reescribir.
- Un archivo sin título se lee sin romper, con `titulo` vacío.

`src/borrador.ts` tiene el formato: `parseBorrador(texto)` y `serializeBorrador(b)`. No
comparte parser con `recipe.ts`.

### 2.3 Los tipos

`Borrador` conserva sus cinco claves —`id`, `titulo`, `fuente`, `nota`, `capturado`—.
`id` pasa a ser el id del archivo en Drive.

Una fila de la hoja es una `EntradaBorrador`:

```ts
interface EntradaBorrador {
  id_archivo: string;
  nombre_archivo: string;
  titulo: string;
  capturado: string;
}
```

Los dos tipos viven en `src/tipos.ts`.

### 2.4 La hoja `borradores` de `_indice`

| id_archivo | nombre_archivo | titulo | capturado |
|---|---|---|---|

Alcanza para la lista —título y cuándo entró, lo más viejo primero— y para el contador,
que es la cantidad de filas. La fuente y la nota se leen del `.md`.

### 2.5 La copia local

`CopiaIndice` suma `borradores: { fila: number; entrada: EntradaBorrador }[]`. Se
guarda, se verifica y se descarta junto con las recetas, con la misma fecha de `_indice`:
todo lo que dice el spec del índice local vale para las dos hojas.

### 2.6 La versión del esquema

`SCHEMA_VERSION` pasa de 3 a 4. La próxima apertura reindexa: crea la hoja `borradores`
si falta y la llena desde la carpeta. Las copias locales guardadas con la versión 3 dejan
de servir.

## 3. Las operaciones

### 3.1 Al abrir

`store.arrancar()` anota el id de `_borradores` si la carpeta existe. Si la copia sirve,
trae los borradores sin pedidos. Si no, `cargarIndice()` lee también la hoja `borradores`.

`main.ts` deja de crear el módulo de borradores.

### 3.2 Lo que se lee

| Qué | Cómo | Pedidos |
|---|---|---|
| El contador del Recetario, del menú y de Ajustes | `store.borradores().length` | ninguno |
| La lista de Borradores | `store.borradores()`, ordenada por `capturado`, lo más viejo primero | ninguno |
| Abrir un borrador | `store.borrador(id)` lee y parsea su `.md` | 1 a Drive |

`store.borradores()` devuelve `EntradaBorrador[]`; `store.borrador(id)` devuelve
`Borrador`.

**El borrador abierto se lee una vez.** Lo reusan los redibujados de su pantalla
—confirmar el descarte, *Editar*, un error— y *Crear la receta*, igual que la receta
abierta. Salir a otra pantalla lo descarta. El cache de borradores de P17 en `main.ts`
se elimina.

### 3.3 Lo que se escribe

Cada operación que escribe en `_indice` termina en `persistir()`, como en el índice
local.

| Operación | Pasos |
|---|---|
| `store.agregarBorrador({ titulo, fuente, nota })` | Crea `_borradores/` si falta → lista la carpeta para elegir el nombre → crea el `.md` con `capturado` = ahora → agrega la fila → persiste. Devuelve el `Borrador`. |
| `store.editarBorrador(id, { titulo, fuente, nota })` | Toma `capturado` de su fila en memoria → reescribe el `.md` → reescribe su fila → persiste. Si el borrador no tiene fila, no hace nada. |
| `store.descartarBorrador(id)` | Si el borrador no tiene fila en memoria, no hace nada. Si tiene: manda el `.md` a la papelera → borra la fila y corre las siguientes → persiste. |

`compartido.convertirBorrador` pasa a depender sólo del store: `store.crear(receta)` y
después `store.descartarBorrador(id)`. El mapa `convertidos` sigue: si el descarte falla,
el reintento reescribe la receta ya creada con `store.guardar`.

*Crear la receta* abre el editor como hoy (C01.6.3): título y fuente cargados, y la nota
interpretada como cuerpo de receta. La nota sale del borrador abierto.

La captura (Share Target y *Nuevo*) llama a `store.agregarBorrador`; editar un borrador,
a `store.editarBorrador`; descartar, a `store.descartarBorrador`.

### 3.4 Reindexar

`store.reconstruir()` lee también los `.md` de `_borradores/` y rearma la hoja
`borradores` como rearma `recetas`: una sola llamada borra las filas viejas y se agregan
las nuevas. Si la hoja no existe, la crea. Un borrador sin título se saltea y se nombra en
`ignorados`. La barra de progreso cuenta recetas y borradores juntos.

`crearPlanilla()` crea la hoja `borradores` con su encabezado, junto a `recetas` y `meta`.

### 3.5 La papelera

`drive.borrar(id)` manda el archivo a la papelera: `PATCH /files/{id}` con
`{ "trashed": true }`. Vale para todo lo que borra la app: recetas, borradores y la
planilla a medio crear. Borrar una receta cumple así lo que dice E04 («el archivo va a la
papelera de Drive»). La búsqueda por nombre ya excluye lo que está en la papelera.

La confirmación de descartar sigue. Deja de decir que no hay papelera.

## 4. Fallas

La regla es la de siempre (R1): se avisa, lo escrito queda en pantalla y se reintenta a
mano.

- **Agregar se corta después de crear el `.md`:** queda el archivo sin fila. Reintentar
  crea un segundo `.md`. Reindexar lo muestra en la lista y se descarta a mano.
- **Descartar se corta después de la papelera:** la fila queda. Reintentar la borra,
  porque mandar a la papelera un archivo que ya está ahí no falla.
- **Editar se corta después de reescribir el `.md`:** la fila queda con el título viejo
  hasta reintentar o reindexar.

## 5. Tests

**`borrador.ts`:** ida y vuelta de `parseBorrador` y `serializeBorrador`, con una nota de
varias líneas que tenga `##` y `---`; sin frontmatter; sin título; una clave desconocida
se ignora.

**`store`, con los dobles:**

- `agregarBorrador` crea el `.md` en `_borradores/` con el formato de §2.2, agrega la fila
  y deja la copia igual a la planilla. Crea la carpeta sólo si falta.
- `editarBorrador` conserva `capturado` y reescribe el `.md` y la fila.
- `descartarBorrador` manda el `.md` a la papelera, borra la fila, corre los números de
  fila de la copia, y descartar dos veces termina bien.
- `borradores()` ordena lo más viejo primero y no hace pedidos.
- `borrador(id)` lee el `.md`.
- Una copia que sirve trae los borradores sin leer Sheets; una que no sirve lee la hoja
  `borradores`.
- `reconstruir` rearma las dos hojas, crea la hoja `borradores` si falta y nombra los
  borradores sin título en `ignorados`.
- `crearPlanilla` crea las tres hojas.
- El control «la copia coincide con la planilla» de los tests del índice local cubre las
  dos hojas.

**`drive`:** `borrar` pide `PATCH` con `trashed: true`, no `DELETE`.

**`compartido`:** convertir crea la receta y descarta el borrador, en ese orden; el
reintento no crea una segunda receta.

**`main`:** el contador y la lista no hacen pedidos; abrir un borrador lee su `.md` una
vez entre redibujados; captura, edición, descarte y *Crear la receta* llaman a las
operaciones del store.

`tests/borradores.test.ts` se elimina con `src/borradores.ts`.

**Verificación manual en el teléfono:**

1. Abrir la app: reindexa una vez (versión 4) y Borradores está vacío.
2. Compartir un link a la app: aparece el `.md` en `Recetario/_borradores/` y el
   borrador en la lista.
3. Abrir el borrador, editarlo, volver: el `.md` cambió.
4. Crear la receta desde el borrador: la receta está en su categoría y el `.md` del
   borrador en la papelera.
5. Descartar otro: su `.md` en la papelera.
6. Volver al Recetario varias veces: en la pestaña Red, ningún pedido a Sheets.

## 6. Documentos que cambian

- **`E01-CapturaYBorradores.md`**: C01.4.1 (la lista sale del índice), C01.4.2 (un `.md`
  por borrador y una hoja del índice), C01.6.2 (descartar manda a la papelera) y C01.7.1
  (convertir manda el `.md` del borrador a la papelera).
- **`information-architecture.md`**: la fila **Borrador** de §2 y la regla del borrador de
  §2.1; la operación de conversión de §2.2.
- **`decision-log.md`**: una fila por los borradores como `.md` con hoja propia en el
  índice, y otra por la papelera.
- **`CLAUDE.md`**: la línea de «Lo esencial» sobre `_borradores`, la tabla «Cómo quedó el
  código», y la fila de lo descartado.
- **`BACKLOG.md`**: P21 reemplazado por este cambio, y un pendiente nuevo para que el skill
  del agente sepa escribir un borrador.
- **Comentarios del código** que citan «IA §2.1» o «no hay papelera»:
  `src/tipos.ts`, `src/ui/borradores.ts`, `src/main.ts`.

## 7. Fuera de alcance

- Migrar los borradores de la planilla vieja.
- Que el skill del agente escriba borradores.
- Renombrar el archivo cuando cambia el título.
- Evitar el `.md` duplicado cuando agregar se corta a mitad.
