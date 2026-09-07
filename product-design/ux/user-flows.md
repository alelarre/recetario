# Recetario — User Flows

**Versión:** 1.3
**Fecha:** 2026-09-06
**Estado:** Final — Hito 5 cerrado, corregido en los Hitos 6, 7 y 8

> **Cambio en la 1.1 (Hito 6):** F3 y F4 — la búsqueda incluye los tags, y los
> resultados se agrupan por criterio.
>
> **Cambios en la 1.2 (Hito 7):** F1 — iOS sale del alcance, Android es la
> plataforma (`E05-Cimientos.md` R7). F2 — Borradores es una planilla, y la app
> tiene su propia vía de conversión desde el editor.
>
> **Cambio en la 1.3 (Hito 8):** el vocabulario canónico de
> `ux/brand-identity.md` §4 — **Borradores** y **reindexar**.

---

## Sobre este documento

Los flujos críticos del producto, en texto estructurado. Cada uno mapea a un job
de `jtbd.md`; si no mapea a ninguno, va marcado `[revisar necesidad]`.

Los **estados degradados** —sin conexión, índice corrupto, `.md` que no cumple
el esquema— están acá como flujos de primera clase, no como notas al pie. El
stack los hace inevitables: la app depende de la red, del índice y de archivos
que escriben otros.

**Notación:** `→` paso siguiente · `⚑` punto de decisión · `▸` estado ·
`✗` camino de error.

---

## Tabla de flujos

| # | Flujo | Job | Criticidad |
|---|---|---|---|
| F1 | Capturar una receta que acabo de ver | J2 | **La más alta** |
| F2 | Convertir un borrador en receta | J3 | Alta |
| F3 | Buscar una receta por nombre | J1 | Alta |
| F4 | Buscar por ingrediente | J4 | Media |
| F5 | Pasear sin buscar nada | J5 | Media |
| F6 | Cocinar con la receta abierta | J6 | Media |
| F7 | Corregir una receta | J7 | Baja |
| F8 | Primer arranque y consentimiento de Google | — | Alta |
| F9 | Una receta escrita por un agente aparece | J3, J8 | Media |
| F10 | Sin conexión | Transversal | Alta |
| F11 | Índice corrupto o incompleto | Transversal | Alta |
| F12 | Un `.md` que no cumple el esquema | J8 | Media |
| F13 | Planificar la semana `[condicional]` | J9 | — |

---

## F1 — Capturar una receta que acabo de ver

**Job:** J2. **Es el flujo más crítico del producto:** si falla, Recetario no
resuelve lo que dice resolver. Ocurre con atención mínima, en el medio de otra
cosa, con una mano.

**No empieza en Recetario.** Empieza en Instagram, en el navegador, en YouTube.

```
Estoy viendo un reel / una página / un video
  → Compartir del sistema
  → elijo Recetario en la hoja de compartir
  ▸ se abre la pantalla Captura, con la fuente ya cargada
  → escribo el título          ⚑ único campo, obligatorio
  → Guardar
  ▸ se agrega una fila a la planilla de Borradores en Drive
  ▸ vuelvo a donde estaba
```

**Decisiones que este flujo fija:**

- **Un solo campo.** No pide categoría, ni tags, ni nada más (principio 2). La fuente viene de lo compartido y no se escribe a mano.
- **La app no queda abierta.** La captura termina donde empezó: en la app donde estaba.
- **Se escribe en Drive, no local.** Principio 1.

**Camino de error:**

```
  → Guardar
  ✗ no hay red
  ▸ aviso: no se pudo guardar
  ⚑ el texto queda en pantalla para reintentar
  ✗ si cierro, se pierde
```

Está aceptado explícitamente (principio 1 + 4): no hay cola local. Es el único
punto donde el producto acepta a sabiendas un riesgo sobre el job huérfano.

**iOS no se soporta:** no tiene Share Target y el Atajo equivalente queda fuera
del alcance. Android es la plataforma (`E05-Cimientos.md` R7).

---

## F2 — Convertir un borrador en receta

**Job:** J3. Ocurre sentado, con atención completa, **antes de ponerse a
cocinar** — no cuando se encontró la receta.

```
Recetario
  → Borradores           ⚑ el contador dice cuántos esperan
  ▸ Borradores es una planilla, una fila por borrador: una lectura
  → toco una entrada
  ▸ veo su título y su fuente
  → abro una sesión con el agente y le paso la fuente
  ▸ el agente extrae la receta
  ▸ el agente propone carpeta y tags
  → confirmo o corrijo          ⚑ la clasificación es siempre mía
  ▸ el agente invoca "convertir borrador en receta"
      ▸ escribe el .md en la carpeta
      ▸ escribe la fila en el índice
      ▸ borra la entrada del borrador
  ▸ la receta aparece en el recetario, con su fuente heredada
```

**Las tres cosas son una sola operación** de la capa compartida entre la app y el
agente (`information-architecture.md` §2.2). Nadie borra el borrador por
separado: lo borra la misma función que crea la receta.

**Lo que la app hace acá es poco y a propósito:** muestra el borrador, y después
recibe. El agente vive afuera de la PWA (`product-vision.md` §1). La app está
diseñada para **recibir y esperar**, no para procesar.

`[corregido en el Hito 7]` **Hay una segunda vía, dentro de la app:** desde el
borrador, **Crear la receta** abre el editor con el título y la fuente cargados,
y guardar invoca la misma operación de conversión. Es para una receta que ya
tenés en la cabeza; transcribir el video o el PDF de la fuente sigue siendo el
camino de arriba.

```
Borradores → toco una entrada → Crear la receta
  ▸ el editor abre con título y fuente cargados
  → elijo la categoría y escribo la receta
  → Guardar
  ▸ la misma operación: escribe el .md, escribe la fila, borra el borrador
```

`[abierto]` Si el agente se embebe en la PWA algún día, el flujo de arriba se
acorta pero no cambia de forma: los mismos pasos, adentro.

---

## F3 — Buscar una receta por nombre

**Job:** J1, el más frecuente. Dos toques.

```
Recetario
  ▸ la búsqueda está arriba, visible, no detrás de un ícono
  → escribo parte del nombre
  ▸ resultados mientras escribo
  → toco el que quería
  ▸ Receta
```

Busca en el título, en los ingredientes y en los tags, no en el cuerpo entero:
buscar en todo es lo que hace Drive y es exactamente lo que trae ruido.

---

## F4 — Buscar por ingrediente

**Job:** J4. Hoy no existe. Es el que decidió el formato del archivo.

```
Recetario
  → escribo "berenjena"
  ▸ resultados agrupados: por nombre, por ingrediente y por tag
  ⚑ los tres grupos en la misma lista, distinguidos
  → toco una
```

**Lo que lo hace posible:** la convención de cantidad en itálica del §1.4 de la
IA. El nombre del ingrediente es lo que queda después de la itálica, así que
"berenjena" en una nota al pie no cuenta como ingrediente.

**Se resuelve contra el índice, no leyendo los `.md`.** La fila de cada receta
lleva sus nombres de ingredientes, así que buscar entre mil recetas es una
lectura, no mil.

**Degradación:** una receta con los ingredientes en prosa libre no aparece en
este filtro, y por eso mismo figura como incompleta (principio 3). No se
esconde: sigue apareciendo por nombre.

---

## F5 — Pasear sin buscar nada

**Job:** J5. Con ~1.000 recetas que el usuario no cocinó y cuyo nombre no
recuerda, este job pesa casi tanto como J1.

```
Recetario
  ▸ debajo de la búsqueda, las 16 categorías
  → toco una
  ▸ Categoría: sus recetas
  → toco una que me llamó la atención
  ▸ Receta
```

**No hay historial, ni "última vez", ni "hace mucho que no hacés esto".** La
novedad se resuelve mostrando, no registrando (`personas.md` §4).

`[abierto]` Sugerir es una forma posible de servir a este job, como ayuda
secundaria. Si alguna vez entra, va **entre la búsqueda y las categorías** —
nunca arriba de la búsqueda. `[decisión: Hito 4]`

---

## F6 — Cocinar con la receta abierta

**Job:** J6. Es el uso menor y es el único que la app actual ya resuelve bien.

```
Receta
  ▸ una sola columna: ingredientes, preparación, variaciones, notas
  ▸ todo a la vista, sin pestañas
  → activo mantener la pantalla encendida    ⚑ manual, por decisión
  ▸ cocino
```

**Sin pestañas:** costaban cuatro toques para leer una receta entera y escondían
las notas justo cuando se cocina. **El wake lock es manual a propósito:** no
siempre hace falta, y activarlo solo cuando corresponde es el comportamiento
buscado.

**Las variaciones se leen acá**, en la misma columna, cada una con su fuente.

---

## F7 — Corregir una receta

**Job:** J7. Un toque desde la receta.

```
Receta
  → Editar
  ▸ Editor
  → corrijo el error, o agrego una variación
  → Guardar
  ▸ se reescribe el .md
  ▸ se actualiza su fila en el índice
```

**El editor corrige, no compone.** Componer es trabajo del agente
(`product-vision.md` §1).

**Camino de error:** ver F10.

---

## F8 — Primer arranque y consentimiento de Google

**No mapea a un job**: es el peaje de entrada del stack. Está acá porque el plan
lo pide explícitamente y porque hoy tiene un agujero conocido.

```
Abro la app por primera vez
  ▸ Conexión: qué va a pasar y por qué
  → Conectar con Google
  ▸ popup de Google
  ▸ pantalla de "app no verificada"     ⚑ una vez, inevitable sin verificación
  → acepto
  ▸ la app busca Recetario/ en Drive
  ⚑ ¿existe el índice?
      sí  → arranca
      no  → lo crea, leyendo los .md
  ▸ Recetario
```

**Camino de error — cerrar el popup a mitad:**

```
  ✗ cierro la ventana de consentimiento
  ▸ aviso: no se pudo conectar, con botón de reintentar
  ✗ NUNCA quedarse en "Conectando…"
```

Es uno de los cuatro puntos que la revisión de v1 dejó pendientes de verificar
contra el Drive real.

---

## F9 — Una receta escrita por un agente aparece

**Jobs:** J3, J8. Es el flujo que hace que el ecosistema funcione.

```
El agente escribe un .md en una carpeta de Recetario/
  ▸ y escribe su fila en el índice
  → abro la app
  ▸ la receta está
```

**No hay detección de cambios, ni Changes API, ni "3 recetas nuevas".** Porque
el agente actualiza el índice, la receta ya está disponible cuando la app abre.
`[decisión: Hito 5]`

**Tampoco hace falta avisar:** la conversión la disparó el usuario y es
just-in-time, antes de cocinar. Sabe que llegó porque la pidió.

**Camino de error — el agente escribió el `.md` pero no el índice:**

```
  ✗ la receta existe en Drive y no aparece en la app
  ⚑ la salida es reindexar, desde Ajustes
```

Es reparable por diseño: el índice es derivado y los `.md` son la verdad
(principio 1).

---

## F10 — Sin conexión

**Transversal.** Sin Drive no hay app: es consecuencia aceptada de que el
archivo sea la única fuente de verdad.

```
⚑ ¿hay red?
    no, al abrir      → aviso: no se puede conectar. La app no muestra recetas viejas como si fueran actuales.
    no, al guardar    → aviso: no se pudo guardar. El texto queda en pantalla.
    no, al capturar   → ver F1.
```

**Sin reintentos silenciosos, sin cola, sin "se guardará más tarde".** El
reintento invisible deja al usuario sin saber si su trabajo existe, y este
usuario está cocinando o compartiendo algo en dos segundos (principio 4).

---

## F11 — Índice corrupto o incompleto

**Transversal.** Pasó de verdad: la creación se cortó a mitad y la app dejó de
arrancar, mostrando el error crudo de Google.

```
Abro la app
  ✗ el índice no se puede leer
  ▸ aviso en castellano: el índice está dañado, y qué significa
     (las recetas están bien; lo dañado es el atajo para listarlas)
  → botón: Reindexar
  ▸ progreso: leyendo los .md
  ▸ Recetario
```

**Se ofrece, no se hace solo.** Reindexar puede tardar —hoy se leen los `.md`
de a uno— y arrancar la app no es el momento de decidirlo por el usuario
(principio 4).

`[divergencia con lo implementado]` Hoy la política es borrar `_indice` a mano en
Drive. Se reemplaza por el botón.

---

## F12 — Un `.md` que no cumple el esquema

**Job:** J8. Los `.md` los escriben agentes y el usuario a mano: es el caso
normal, no la excepción.

```
La app lee el índice y las recetas
  ⚑ ¿el archivo tiene título?
      no  → se ignora, y se cuenta
      sí  ⚑ ¿tiene ingredientes reconocibles y pasos?
              no  → se muestra, marcada incompleta
              sí  → se muestra completa
  ▸ los ignorados se informan en Ajustes, no en la cara
```

**Se lee lo que llega y se dice qué le falta** (principio 3). Una receta
incompleta se lista y se abre igual: se ve que le falta algo, no se esconde ni
se bloquea.

**La salida manual:** si la receta está bien así —una técnica, un fondo—, el
usuario la declara completa y la marca desaparece.

---

## F13 — Planificar la semana `[condicional]`

**Job:** J9, el único hipotético. **Este flujo existe solo si J9 se construye**,
y su entrada es secundaria: no ocupa navegación primaria (principio 6).

```
Recetario           ⚑ entrada debajo de las categorías, no en un lugar primario
  → Planificador
  ▸ dos comidas por día, siete días
  → toco un espacio
  → busco una receta del recetario     ⚑ solo recetas del recetario
  ▸ queda asignada
  → Generar lista de compras
  ▸ recopila los ingredientes de todo lo planificado
  ⚑ los estructurados se suman y agrupan
  ⚑ los que están en prosa se listan tal cual, como recordatorio
  ▸ el plan y la lista se escriben como archivos en Drive
```

**Solo entran recetas del recetario.** Que una comida se cocine de memoria no
significa que la receta no esté registrada.

**La lista degrada con gracia:** si los ingredientes están estructurados es útil;
si no, es un recordatorio. Eso es lo que evitó que J9 forzara un formato de
archivo más rígido.

---

## Cobertura de jobs

Criterio de completitud del hito: para cada job, el camino completo desde que la
app se abre hasta que el job está cumplido.

| Job | Flujo | Camino de pantallas |
|---|---|---|
| J1 — Recuperar por nombre | F3 | Recetario → Resultados → Receta |
| J2 — No perder lo que encontré | F1 | *(app externa)* → Captura → *(vuelvo)* |
| J3 — Convertir en receta completa | F2, F9 | Recetario → Borradores → Borrador → *(agente)* → Receta |
| J4 — Buscar con lo que tengo | F4 | Recetario → Resultados → Receta |
| J5 — Mirar sin buscar | F5 | Recetario → Categoría → Receta |
| J6 — Seguir la receta cocinando | F6 | Receta |
| J7 — Corregir | F7 | Receta → Editor → Receta |
| J8 — Legible sin la app | F9, F12 | *(fuera de la app: los `.md` en Drive)* |
| J9 — Planificar `[condicional]` | F13 | Recetario → Planificador → Lista de compras |

Los nueve jobs tienen camino. J8 es el único que no se cumple **en** la app: se
cumple porque el archivo existe afuera y la app no lo estorba.
