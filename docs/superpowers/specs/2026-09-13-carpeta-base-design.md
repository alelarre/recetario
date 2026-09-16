# Carpeta base elegida — diseño (P15/P19, etapa 2)

**Fecha:** 2026-09-13
**Estado:** Implementado y probado en el teléfono `[2026-09-15]`.
**Resuelve:** la etapa 2 de `product-design/plan/BACKLOG.md` P15/P19.
**Se apoya en:** `docs/superpowers/specs/2026-09-13-categorias-en-el-indice-design.md`
(etapa 1) y `docs/superpowers/specs/2026-09-13-indice-local-design.md`.

---

## 1. Qué cambia

| | Hoy | Con este diseño |
|---|---|---|
| Cómo se encuentra la raíz | Buscando una carpeta llamada `Recetario` en todo el Drive | Buscando la carpeta marcada con `appProperties` |
| Sin carpeta | Aviso: «No encontré la carpeta Recetario», y `SETUP.md` | Un selector de carpetas dentro de la app |
| Dos carpetas | Aviso: «Hay más de una carpeta llamada Recetario» | El selector, con las marcadas |
| La estructura | Se crea a mano en Drive | La crea el setup: las 16 predefinidas que falten, `_indice` y el reindexado |
| Cambiar de carpeta | No existe | *Ajustes → Cuenta → Cambiar carpeta* |
| Qué carpeta se usa | No se ve | Una línea en la ficha Cuenta |

## 2. La marca

La carpeta base lleva en `appProperties` la clave `recetario` con el valor `raiz`. Sólo
esta app la lee y la escribe.

La consulta que la encuentra:

```
appProperties has { key='recetario' and value='raiz' }
  and 'me' in owners
  and mimeType='application/vnd.google-apps.folder'
  and trashed=false
```

`'me' in owners` deja afuera una carpeta marcada que otra persona haya compartido con el
usuario.

## 3. Al abrir

### 3.1 Con copia local

Igual que en la etapa 1: un pedido, la fecha de `_indice` por su id.

- **Coincide:** usa la copia.
- **No coincide:** lee `meta`. Si trae `reemplazada=si` (§5.2), descarta la copia y sigue
  por §3.2. Si no, sigue como en la etapa 1: lee las hojas con los ids de la copia.
- **404 o en la papelera:** §3.2.
- **Otro error:** `solo-lectura`.

### 3.2 Sin copia, o con la copia descartada

Busca las carpetas marcadas (§2):

| Encuentra | Qué hace |
|---|---|
| Una | Es la raíz. Busca `_indice` adentro, como hoy; si no está, crea la planilla y reindexa. No crea predefinidas: las que el usuario borre en la etapa 3 siguen borradas. |
| Ninguna | El arranque termina en `elegir-carpeta`, con las **sugerencias**: las carpetas propias llamadas `Recetario` (`name='Recetario' and 'me' in owners`). |
| Más de una | El arranque termina en `elegir-carpeta`, con las marcadas como sugerencias. |

Los estados `falta-estructura` y el `elegir-carpeta` actual —dos carpetas `Recetario`—
desaparecen. `elegir-carpeta` pasa a traer:

```ts
{ estado: 'elegir-carpeta'; sugerencias: ArchivoDrive[]; avisos: string[] }
```

### 3.3 La carpeta en uso

`CopiaIndice` suma `raizNombre: string`. La ficha Cuenta de Ajustes muestra
«Carpeta: <nombre>» sin pedidos. El nombre se toma al elegir la carpeta y en el camino
sin copia (la búsqueda de la marca ya trae `name`).

## 4. El selector

### 4.1 Cuándo aparece

- Cuando el arranque termina en `elegir-carpeta`.
- Desde *Ajustes → Cuenta → Cambiar carpeta*.

La ruta es `#/carpeta`. El router la agrega como vista `carpeta`, con los parámetros
opcionales `id` y `nombre` del nivel que se está mirando
(`#/carpeta?id=<id>&nombre=<nombre>`); sin `id`, es «Mi unidad». Mientras el arranque
esté en `elegir-carpeta`, cualquier otra ruta lleva a `#/carpeta`.

### 4.2 Qué muestra

```
‹  Elegí la carpeta de tus recetas

ENCONTRADAS                          ← sólo si hay sugerencias
📁 Recetario                      ›

MI UNIDAD › Cocina                   ← el nivel actual
📁 Recetas viejas                 ›
📁 Libros                         ›

[ Usar esta carpeta ]
[ Crear una carpeta nueva acá ]
```

- **Tocar una carpeta** navega a su nivel. El chevron del encabezado vuelve un nivel —el
  historial del navegador, como en el resto de la app—.
- **Tocar una sugerencia** la elige directo: pasa a la confirmación (§4.3).
- **Cada nivel** es un pedido: las carpetas propias dentro de ese nivel,
  `'<id>' in parents and mimeType=carpeta and 'me' in owners and trashed=false`, con
  `root` como id de «Mi unidad».
- **El rótulo del nivel** es «Mi unidad» en la raíz y «Mi unidad › <nombre>» adentro;
  el nombre viaja en el hash. El camino intermedio no se muestra: volver nivel por nivel
  es el historial.
- **«Usar esta carpeta»** no se ofrece en «Mi unidad»: usar la raíz del Drive haría
  categorías de todas las carpetas del usuario.
- **«Crear una carpeta nueva acá»** despliega un campo con el nombre —precargado
  `Recetario`— y *Crear*. Crear hace la carpeta en el nivel actual y pasa a la
  confirmación.
- **Sin red,** el nivel muestra el aviso de siempre con *Reintentar*.

Las unidades compartidas y las carpetas compartidas con el usuario no aparecen.

### 4.3 La confirmación

Reemplaza los botones, como la de descartar un borrador:

> Voy a usar **Recetas viejas**. Si faltan categorías, las creo, y después indexo lo que
> haya adentro.
>
> [ Cancelar ]  [ Usar ]

Al cambiar de carpeta desde Ajustes, suma: «Tu carpeta actual queda como está en Drive.»

## 5. El setup

### 5.1 Los pasos

Al confirmar una carpeta:

1. **Categorías.** Lista las subcarpetas. Por cada predefinida (`src/categorias.ts`) sin
   una subcarpeta del mismo nombre —comparado con `normalizar()`— crea la carpeta con
   `appProperties` `color` y `foto` ya escritos. Las que existen no se tocan aquí.
2. **`_indice`.** Lo busca dentro de la carpeta; si no está, crea la planilla con sus
   cuatro hojas. Si está y su `meta` trae `reemplazada=si` —se vuelve a una carpeta que se
   había dejado—, la borra: si no, los otros dispositivos la volverían a abandonar.
3. **Reindexa**, con la pantalla de progreso de hoy. El reindexado escribe las
   propiedades de las predefinidas que ya existían sin ellas (etapa 1) y guarda la copia.
4. **Marca.** Escribe `recetario=raiz` en la carpeta elegida y la quita de toda otra
   carpeta marcada.
5. **Recarga** en el Recetario. El reindexado ya guardó la copia de la carpeta elegida:
   la apertura siguiente es el pedido de siempre.

La marca va última: si algo falla antes, la carpeta queda sin marcar y la próxima apertura
vuelve al selector. Como el reindexado ya guardó la copia, si la marca falla el setup borra
la copia antes de avisar: si no, la próxima apertura usaría una carpeta sin marca. Repetir
el setup no duplica nada: cada paso hace sólo lo que falta.

Si falla, el selector muestra el aviso con *Reintentar*, que repite el setup sobre la
misma carpeta.

### 5.2 Cambiar de carpeta

Es el mismo setup, con dos pasos más:

- **Antes de marcar la nueva:** anota `reemplazada=si` en la hoja `meta` del `_indice` de
  la carpeta anterior. Escribir le cambia la fecha, y así otro dispositivo con la copia de
  la carpeta anterior deja de usarla (§3.1). Si esta escritura falla, el cambio sigue: ese
  otro dispositivo necesitará *Borrar datos locales*.
- **Al terminar:** recarga, como el setup. La copia local ya es la de la carpeta nueva.

La carpeta anterior queda en Drive como estaba, con sus recetas y su `_indice`; sólo
pierde la marca.

### 5.3 Quién hace qué

- **`src/store.ts`:** `carpetasDe(id)` para el selector, `crearCarpeta(nombre, padre)`,
  `prepararCarpeta(carpeta, progreso)` —los pasos 1 a 4—, `marcarReemplazada()` y
  `carpeta()`, que devuelve la carpeta en uso para Ajustes.
- **`src/drive.ts`:** `carpetasMarcadas()`, `carpetasPropias(padre)` y
  `carpetasPropiasPorNombre(nombre)`.
  Escribir y quitar la marca usan `propiedades()` de la etapa 1; quitar una propiedad es
  escribirla con valor `null`.
- **`src/ui/carpeta.ts`** (nuevo): la pantalla del selector.
- **`src/main.ts`:** la ruta, el estado del selector y el cambio desde Ajustes.

## 6. Fallas

- **Sin red al buscar la marca:** `solo-lectura`, como hoy.
- **Sin red al listar un nivel del selector:** el aviso con *Reintentar* en ese nivel.
- **El setup se corta:** la carpeta queda sin marcar; lo creado queda y el reintento no lo
  duplica.
- **`reemplazada` no se pudo escribir:** el cambio sigue; los otros dispositivos se
  arreglan con *Borrar datos locales*.

## 7. Tests

**Store, al abrir:**
- Una carpeta marcada: es la raíz, sin selector.
- Ninguna: `elegir-carpeta` con las carpetas propias llamadas `Recetario` como sugerencias.
- Varias: `elegir-carpeta` con las marcadas.
- Una carpeta marcada ajena (`'me' in owners`) no cuenta.
- La copia con otra fecha y `meta` con `reemplazada=si`: se descarta y se busca la marca.

**Store, setup:**
- Sobre una carpeta vacía: crea las 16 con color y foto, `_indice`, reindexa y marca.
- Sobre una carpeta con las 16: no crea ninguna.
- Sobre una carpeta con carpetas propias: las conserva y crea las predefinidas que faltan.
- Si se corta antes de marcar, la carpeta queda sin marca; repetirlo no duplica.
- Marcar la nueva quita la marca de las otras.
- Cambiar de carpeta anota `reemplazada=si` en la `meta` anterior.
- Volver a una carpeta con `reemplazada=si` la borra.

**Drive:** la consulta de marcadas y el listado de un nivel piden lo de §2 y §4.2;
quitar la marca envía `null`.

**Vista del selector:** las sugerencias; la lista del nivel; la ruta; «Usar esta carpeta»
ausente en «Mi unidad»; el campo de carpeta nueva con `Recetario`; la confirmación y su
variante de cambio.

**Ajustes:** la línea «Carpeta: …» y *Cambiar carpeta*.

**`main`:** el arranque en `elegir-carpeta` lleva a `#/carpeta`; otra ruta vuelve ahí;
confirmar corre el setup y recarga; cambiar desde Ajustes anota `reemplazada` antes.

**Verificación en el teléfono:**
1. *Borrar datos locales*: la app abre el selector sugiriendo `Recetario`; elegirla no
   crea categorías, reindexa y entra.
2. La apertura siguiente va directo al Recetario.
3. Crear una carpeta nueva desde el selector: aparecen las 16 categorías con sus fotos.
4. Volver a `Recetario` con *Cambiar carpeta*; en otro dispositivo, la apertura siguiente
   pasa a la carpeta nueva sola.

## 8. Documentos que cambian

- **`SETUP.md`:** la carpeta y las categorías ya no se crean a mano; los ids quedan como
  referencia de tu Drive.
- **`CLAUDE.md`:** «Ubicación en Drive» —la app no busca `Recetario` por nombre—, el
  arranque y el estado.
- **`E05-Cimientos.md`:** F05.7 —el primer arranque suma el selector y el setup— y
  C05.9b.1 —la ficha Cuenta muestra la carpeta y ofrece cambiarla—.
- **`user-flows.md`:** F8, el paso «la app busca Recetario/ en Drive».
- **`decision-log.md`:** una fila con la marca, el selector, el setup y la anotación
  `reemplazada`.
- **`BACKLOG.md`:** la etapa 2 hecha en P19.

## 9. Fuera de alcance

- Mover o copiar las recetas de la carpeta anterior a la nueva.
- Unidades compartidas y carpetas compartidas con el usuario.
- Distribuir el skill del agente.
- **Etapa 3:** crear, borrar y renombrar categorías; imágenes de Drive.
