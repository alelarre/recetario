# Índice local — diseño

**Fecha:** 2026-09-13
**Estado:** Aprobado en conversación; pendiente de revisión escrita.
**Resuelve:** `product-design/plan/BACKLOG.md` P12 — cómo se sabe si el índice está al día.
**Reabre:** «No hay copia local del índice» (`decision-log.md`, 2026-09-06), C05.4.2 y
C05.8.1 de `E05-Cimientos.md`, y la fila «Funcionar sin conexión» de las decisiones
cerradas de `CLAUDE.md`.

---

## 1. Premisa

**Nunca hay escritura concurrente.** Lo que cambia en Drive entre una sesión y la
siguiente puede venir de otro dispositivo con la app, del agente o de una edición a mano,
pero nunca mientras la app está abierta. No se diseña nada para dos pestañas, dos
dispositivos o un agente escribiendo al mismo tiempo que la app.

## 2. Qué se decidió

| Pregunta | Decisión |
|---|---|
| Qué se guarda local | **Sólo el índice.** Los `.md` siguen sin copia que sobreviva entre sesiones. |
| Qué detecta la verificación al abrir | **Sólo cambios en la planilla `_indice`**, no en los `.md`. Una receta que escribe el agente sigue dependiendo de *Reindexar* (P14 no cambia). |
| Cómo se verifica | **Comparando metadata**, nunca contenido. El contenido de la planilla se baja sólo si la metadata difiere. |
| Qué dibuja la app al abrir | **Verifica antes de dibujar.** Sin red, el aviso de siempre: la copia no se usa para dibujar sin conexión. |
| Las escrituras propias cambian la fecha remota | **Después de cada escritura se pide la metadata** de `_indice` y se guarda la fecha nueva junto a la copia. |

## 3. La copia

### 3.1 Qué contiene

Un objeto, «la planilla tal como la vi por última vez»:

```ts
interface CopiaIndice {
  /** El SCHEMA_VERSION del código que escribió la copia. */
  schemaVersion: number;
  /** Qué planilla es. */
  indiceId: string;
  /** El modifiedTime de `_indice` en Drive cuando se guardó la copia. */
  modifiedTime: string;
  /** La hoja `meta`: schemaVersion, ultima_reconstruccion, reconstruccion_en_curso. */
  meta: Record<string, string>;
  /** La hoja `recetas`: cada entrada con su número de fila en la planilla. */
  filas: { fila: number; entrada: Entrada }[];
}
```

**El número de fila va explícito.** Hoy `cargarIndice()` lo deduce del orden de lectura,
pero `guardar()` reubica la entrada al final de la lista en memoria mientras en la
planilla queda en su lugar. Reconstruir los números por orden haría que la próxima
escritura pise la fila equivocada.

### 3.2 Dónde

`localStorage`, una sola clave: `recetario-indice`, en JSON. Sigue la convención de
`auth.ts`, que ya guarda el token en `recetario-auth`. Con 1000 recetas son unos cientos
de KB, lejos del límite de ~5 MB.

### 3.3 Quién la maneja

- **`src/indice-local.ts`** (nuevo): `leer(): CopiaIndice | null`, `guardar(copia)` y
  `borrar()`. Envuelve cada acceso a `localStorage` en `try/catch`: navegación privada,
  almacenamiento lleno o bloqueado, o JSON roto se tratan como «no hay copia». No decide
  nada.
- **`src/store.ts`** decide cuándo leerla, usarla y guardarla. Es el dueño de las
  entradas en memoria y de los números de fila. Recibe la copia como dependencia
  —`crearStore({ drive, sheets, indiceLocal })`—, igual que recibe `drive` y `sheets`,
  para que los tests usen un doble.
- **`src/main.ts`** sólo la toca en *Salir*.

**La copia nunca es imprescindible.** Sin copia, o con una que no sirve, la app hace lo
de hoy: baja la planilla y guarda una copia nueva.

## 4. El arranque

`store.arrancar()` hace hoy: buscar `Recetario` → listar sus subcarpetas → buscar
`_indice` → leer `meta`. Después `main.ts` llama a `store.cargarIndice()`, que lee
`recetas`.

**Los tres primeros pasos no cambian.** Buscar `_indice` ya devuelve su `id` y su
`modifiedTime` (`drive.listar` pide `modifiedTime` por defecto): esa es toda la
verificación, sin pedidos nuevos.

Con la planilla elegida:

| Caso | Qué hace |
|---|---|
| **La copia sirve:** existe, `schemaVersion` coincide con el del código, `indiceId` coincide y `modifiedTime` coincide | Usa su `meta` y sus filas. **Cero lecturas de Sheets.** |
| **La copia no sirve** o no existe | Lee `meta` y `recetas`, arma la copia con el `modifiedTime` que trajo la búsqueda —es la metadata que se acaba de ver, no hace falta pedirla— y la guarda. |
| **No existe `_indice`** | La crea y reindexa, como hoy. El reindexado guarda la copia al terminar (§5). |
| **Hay más de un `_indice`** | Elige la de `modifiedTime` más reciente, como hoy, y compara la copia contra ésa. Además deja el aviso para Ajustes (§6). |

Con la `meta`, venga de la copia o de la planilla, la decisión de reindexar no cambia: se
reindexa si `schemaVersion` no coincide con el código o si quedó
`reconstruccion_en_curso`.

**Sin red** falla la búsqueda en Drive y se muestra el aviso de siempre (`solo-lectura`).
La copia no se usa para dibujar.

## 5. Mantener la copia al día

### 5.1 Todas las escrituras en `_indice`

| Escritura | Hoja | Cuándo |
|---|---|---|
| `escribirFila` | `recetas` | Guardar o crear una receta; convertir un borrador (`compartido.ts`) |
| `borrarDelIndice` | `recetas` | Borrar una receta |
| `reconstruir` | `recetas` y `meta` | Reindexar, a mano o porque lo pidió el arranque |
| `crearPlanilla` | las dos | Primera vez, cuando `_indice` no existe |

### 5.2 La regla

Cada operación que escribe en `_indice` termina en **un único paso, `persistir()`**:

1. Pide la metadata de `_indice`: `drive.metadatos(indiceId, 'modifiedTime')`.
2. Guarda la copia completa —filas con su número, `meta` y el `modifiedTime` nuevo—.

| Qué falla | Qué pasa |
|---|---|
| La escritura remota | No se persiste nada. La copia queda en el estado anterior con la fecha vieja; al abrir, la fecha no coincide y se baja la planilla. |
| La escritura sale bien, falla pedir la metadata | Se **borra** la copia. La próxima apertura baja la planilla. |
| Guardar en `localStorage` | Se ignora: la próxima apertura no encuentra copia y baja la planilla. |

**Reindexar persiste una sola vez, al final**, no en cada anotación de `meta`. Si se
corta a mitad, la primera anotación ya cambió la fecha remota: la próxima apertura baja la
planilla, ve `reconstruccion_en_curso` y vuelve a reindexar, como hoy.

`crearPlanilla` no persiste: siempre la sigue un reindexado, que persiste al terminar. Si
el reindexado falla, no hay copia, y la próxima apertura baja la planilla y reindexa.

**Garantía:** la copia nunca queda más nueva que la planilla. Cualquier duda termina en
bajarla.

### 5.3 Riesgo a medir

No está medido cuánto tarda Drive en actualizar el `modifiedTime` de una planilla después
de una escritura por la API de Sheets. Si tarda más que el pedido de metadata de §5.2,
se guarda la fecha vieja y la próxima apertura baja la planilla de más. Nunca deja datos
viejos; sí puede anular el ahorro. Se mide en la verificación manual de §8.

## 6. Ajustes: el aviso del índice duplicado

Hoy `store.arrancar()` agrega `'indice-duplicado'` a `avisos` y **ninguna pantalla lo
muestra**. Pasa a llegar a la sección *Avisos* de Ajustes, con el tono de
`brand-identity.md` §3.2 —el hecho y el número—:

> Hay 2 planillas _indice en Drive. Se usa la modificada el 12/09 a las 14:30.

Para eso el resultado del arranque lleva la cantidad y el `modifiedTime` de la elegida,
no sólo la etiqueta.

## 7. Salir y cambio de cuenta

- **Salir** borra la copia además del token. Tiene títulos e ingredientes: después de
  *Salir* no queda nada del usuario en el navegador.
- **Cambio de cuenta sin Salir** no necesita nada: la otra cuenta tiene otro `_indice`,
  el `indiceId` no coincide y se baja la planilla, que reemplaza la copia.

## 8. Tests y verificación

**Tests de `store`**, con un doble de `indiceLocal`:

- Una copia que sirve no llama a `sheets.leer`.
- Una copia con otro `modifiedTime`, otro `indiceId` u otro `schemaVersion`, o ninguna
  copia, lee `meta` y `recetas` y guarda la copia con el `modifiedTime` de la búsqueda.
- `escribirFila`, `borrarDelIndice` y `reconstruir` piden la metadata y guardan la copia.
- Los números de fila de la copia siguen siendo los de la planilla después de guardar
  —la entrada reubicada al final en memoria— y después de borrar —el corrimiento—.
- Si la escritura remota falla, la copia no cambia.
- Si falla la metadata, la copia se borra.
- La decisión de reindexar usa la `meta` de la copia cuando la copia sirve.
- Con más de un `_indice`, el resultado del arranque trae la cantidad y la fecha de la
  elegida.

**Tests de `indice-local`:** JSON roto y `localStorage` que tira se leen como «no hay
copia».

**Tests de `main` y de la vista de Ajustes:** *Salir* borra la copia; el aviso del
duplicado se dibuja.

**Verificación manual contra Drive real:**

1. Abrir la app dos veces seguidas: en la pestaña Red, la segunda apertura no lee
   Sheets.
2. Guardar una receta, cerrar y abrir: la apertura no lee Sheets. Si lee, la fecha
   remota tardó en actualizarse (§5.3): anotarlo.
3. Editar una fila a mano en la planilla, abrir: la apertura lee Sheets.

## 9. Documentos que cambian

- **`decision-log.md`**: una fila nueva que reabre «No hay copia local del índice», con
  la premisa de §1 y las decisiones de §2.
- **`E05-Cimientos.md`**: C05.4.2 —hay copia local del índice, sólo del índice— y
  C05.8.1 —sin red sigue sin dibujarse nada: la copia no reemplaza la verificación—.
- **`CLAUDE.md`**: la fila «Funcionar sin conexión» de las decisiones cerradas, y lo
  eliminado en el rediseño («el cache local del índice»).
- **`BACKLOG.md`**: P12 resuelto; P18 (la pantalla de arranque verbosa) pasa a poder
  mostrar esta comparación.

## 10. Fuera de alcance

- Escritura concurrente de cualquier tipo (§1).
- Detectar cambios en los `.md` hechos afuera. Sigue siendo *Reindexar* (P14).
- Guardar localmente los `.md`, las categorías o los borradores.
- Dibujar sin conexión.
