# Recetario — Arquitectura de Información

**Versión:** 1.5
**Fecha:** 2026-09-12
**Estado:** Final — Hito 5 cerrado, corregido en los Hitos 6, 7, 8 y 9

> **Cambio en la 1.1 (Hito 6):** §4.4 — la búsqueda es por título, ingrediente
> **y tag**. La 1.0 omitía los tags.
>
> **Cambio en la 1.2 (Hito 7):** §2 — Borradores es **una planilla en Drive, una
> fila por borrador**, no un archivo único con N entradas. Y §2.1 — la identidad
> de una receta es su `fileId`.
>
> **Cambio en la 1.3 (Hito 8):** el vocabulario canónico de
> `ux/brand-identity.md` §4 — **Borradores** y **reindexar**.
>
> **Cambio en la 1.4 (Hito 9):** §1.4 — la convención del ingrediente pasa a ser
> **`nombre` + separador + `cantidad`**, contra el contenido real del Drive. La
> cantidad en itálica al principio queda descartada.
>
> **Cambios en la 1.5 (2026-09-12):** salieron de implementar el rediseño.
> §1.5 — el frontmatter escribe `completa: sí` / `no`. §1.6 — **la completitud es
> un dato del archivo que declara el usuario**, no un cálculo sobre el contenido.
> §2.1 — la planilla de borradores suma la columna `nota`. §4.1 y §4.6 — la
> navegación primaria pasa a **un menú lateral**, y no hay barra inferior. §6 —
> la tabla de divergencias con lo implementado, al día.

---

## Sobre este documento

Define cómo se organiza el producto: qué formato tiene el archivo de receta, qué
entidades existen y cómo viven, qué pantallas hay y cómo se conectan.

Este es el hito donde se reabre lo implementado. Cada decisión que coincide con
la app actual dice por qué; cada una que difiere está registrada en
`plan/decision-log.md`.

---

## 1. Benchmark de formatos y esquema del `.md`

El formato del archivo es la representación de la entidad Receta: determina qué
puede mostrar la UI, qué se puede filtrar y qué puede generar una lista de
compras. Se decide antes que nada.

### 1.1 Criterios, en orden

1. **¿Sigue siendo legible y editable a mano?** Es la premisa del producto (J8).
2. **¿Un agente lo escribe sin ambigüedad?** Es la ruta de entrada real.
3. **¿Alcanza para lo que la UI necesita mostrar y filtrar?** Sobre todo J4.
4. **¿Alcanza para generar una lista de compras?**
5. **¿Hay parsers que ya lo lean?**

### 1.2 Los candidatos

| Formato | Qué es | 1. Legible | 2. Agente | 3. UI y J4 | 4. Compras | 5. Parsers |
|---|---|---|---|---|---|---|
| **Esquema actual** | Frontmatter de 6 claves + cuerpo markdown libre | ✅ Excelente | ✅ Es lo que ya escriben | ❌ **Falla J4** | ⚠️ Recordatorio | Markdown estándar |
| **RecipeMD** | Markdown con convenciones: H1 título, tags en itálica, yields en negrita, `---` como separadores, cantidad en itálica | ⚠️ Bueno, con reglas que hay que recordar | ✅ | ✅ | ✅ | Parser Python de referencia |
| **Cooklang** | Ingredientes marcados inline en la prosa: `@bacon strips{1%kg}`, `#pot`, `~{25%minutes}` | ❌ Ensucia el texto y no hay lista de ingredientes legible | ⚠️ Ambigüedad al delimitar nombres | ✅ | ✅ | Buen ecosistema |
| **`schema.org/Recipe`** | JSON-LD para publicar a buscadores | ❌ No es un documento, es un registro | ✅ | ✅ | ✅ | Universal |
| **h-recipe** | Microformato sobre HTML | ❌ No aplica: el archivo es `.md` | — | — | — | — |
| **Open Recipe Format** | YAML puro, con HACCP y referencias USDA | ❌ El cuerpo de la receta deja de ser prosa | ✅ | ✅ | ✅ | Escaso |

### 1.3 El hallazgo que decide

**J4 no necesita cantidades estructuradas: necesita saber cuál es el nombre del
ingrediente.** Buscar "berenjena" entre mil recetas falla hoy porque no se puede
distinguir un ingrediente de una mención al pasar en una nota — no porque no se
sepa cuántos gramos son.

Y la lista de compras **degrada con gracia**: si los ingredientes están
estructurados suma y agrupa; si no, es un recordatorio. Eso saca al criterio 4
de la posición de requisito duro y lo alinea con el principio 3.

Con eso, el problema se reduce a **una sola regla**: que en cada ítem de la lista
de ingredientes se pueda separar la cantidad del nombre.

### 1.4 Decisión

`[reescrita en el Hito 9 contra el contenido real del Drive]`

**Se conserva el esquema actual y se le agrega una única convención: el ítem de
ingrediente es `nombre` + `separador` + `cantidad`.** El nombre va primero, y lo
que viene después del separador es la cantidad, en texto libre.

**Los separadores son cuatro:** `-`, `—`, `;`, `,` y `|`. Manda **el primero que
aparezca** en el ítem.

```markdown
## Ingredientes
### Para la milanesa
- Milanesas de nalga — 4
- Muzzarella | 200 g
- Provenzal, 1 cucharada
- Sal y pimienta
```

**La coma tiene una regla propia: solo separa si lo que sigue empieza con un
dígito.** Sin eso, `Sal, pimienta` daría el ingrediente "Sal" con cantidad
"pimienta", y `Orégano, pimentón, comino, etc` sería peor. Con la regla, esos dos
quedan como ingredientes sin cantidad, que es lo correcto, y
`Provenzal, 1 cucharada` funciona.

**Un ítem sin separador es un ingrediente sin cantidad**, y es válido: el nombre
es la línea entera. Un ítem que no tenga nada reconocible no rompe nada: se
muestra tal cual y no entra al filtro.

**Por qué el nombre primero y no la cantidad en itálica** —que fue la decisión
del Hito 5—: al mockupear con contenido real se vio que **ninguna de las ~60
recetas migradas cumplía la convención de la itálica**, y que las dos fuentes
escriben con el nombre adelante: el libro de pescados usa
`Anchoítas — 18-20 medianas` y el recetario original usa
`Provenzal, 1 cucharada`. La convención se ajustó al contenido que existe en vez
de pedirle al contenido que se ajuste a la convención, que además es lo que el
principio 3 pide: la app lee lo que llega.

**Consecuencia para J4:** el nombre del ingrediente queda al principio del ítem,
que es donde una búsqueda por prefijo lo encuentra primero. La cantidad se separa
igual que antes para la lista de compras.

**Por qué esta y no RecipeMD entero:** RecipeMD no tiene frontmatter, así que
`tiempo`, `dificultad` y `fuente` se quedan sin casa; usa `---` como separador
semántico, que colisiona con el frontmatter YAML; y pone los tags en itálica en
el cuerpo, donde son menos manejables que como lista. Se adopta lo que resuelve
J4 y se deja el resto.

**Por qué no Cooklang** —reabierto por mandato del hito y vuelto a descartar—:
marca los ingredientes dentro de la prosa, así que el archivo deja de tener una
lista de ingredientes legible de un vistazo. En un producto cuya premisa es que
el `.md` se lea sin la app, eso es exactamente lo que no se puede ceder.

**Por qué no `schema.org/Recipe`** —también reabierto—: está diseñado para
publicar a buscadores, no para que una persona lea y edite. Sirve como checklist
de campos, no como formato.

### 1.5 El esquema

````markdown
---
titulo: Milanesas napolitanas
tags: [italiana, horno, rápido, invitados]
rinde: 4 porciones
tiempo: 40 min
dificultad: fácil
fuente: Cuaderno de mamá, p. 12
foto: https://…
completa: sí
---

Un clásico de los domingos en casa.

## Ingredientes
### Para la milanesa
- Milanesas de nalga — 4
- Muzzarella — 200 g

## Preparación
1. Precalentar el horno a 200 °C.
2. Hornear 15 minutos.

## Variaciones
### A la suiza
*fuente: Libro de cocina de …*

Cambiar la salsa y la muzzarella por salsa blanca y gruyere.

## Notas
- El horno de casa calienta de más: bajar a 180 °C.
````

**Frontmatter.** Ocho claves, todas opcionales menos `titulo`.

| clave | tipo | obligatorio | notas |
|---|---|---|---|
| `titulo` | texto | **sí** | Sin él la receta no se muestra |
| `tags` | lista | no | Vocabulario libre |
| `rinde` | texto | no | Libre, no un número |
| `tiempo` | texto | no | Libre |
| `dificultad` | enumerado | no | `fácil` · `media` · `difícil` |
| `fuente` | texto | no | **Texto libre:** URL o *"libro de pescados, pág. 84"* |
| `foto` | URL | no | **Nueva.** Solo URL externa. Ver §1.7 |
| `completa` | `sí` · `no` | no | **Nueva.** La app la escribe siempre; si falta, se lee `no`. Ver §1.6 |

**Cuerpo.** Cuatro secciones conocidas, todas opcionales: `## Ingredientes`
—con subtítulos `###` como grupos—, `## Preparación`, `## Variaciones` y
`## Notas`. Cualquier otra sección se muestra tal cual y no se interpreta.

`[agregado en el Hito 9]` **`## Preparación` también puede traer `###`**, y en el
contenido real los trae: el libro de pescados divide la preparación en "Para el
melón", "Para la vinagreta", "Final y presentación". Se muestran como subtítulos
y la numeración de los pasos vuelve a empezar en cada uno, tal como está escrita.

### 1.6 Completitud

`[reescrita el 2026-09-12: era un estado derivado del contenido]`

**La completitud es un dato del archivo**, no un cálculo: la clave `completa`,
que vale `sí` o `no` y se escribe siempre. La app la lee tal cual y nunca la
deduce del contenido.

**Lo único que la app asume** es el caso en que el dato no está: si la clave
falta —un `.md` escrito antes, o por un agente que no la puso— o trae cualquier
otra cosa, la receta se lee como **incompleta**. Es el valor seguro: decir que
algo está terminado cuando nadie lo dijo es peor que lo contrario.

Terminar una receta es un juicio del usuario, no una propiedad del texto: hay
recetas escritas enteras que todavía no están buenas, y recetas de tres líneas
que sí. Es una declaración, y es del usuario, no del agente — la única excepción
del principio 3.

El contenido sólo decide **cuándo se puede declarar**: el conmutador del editor
habilita «Terminada» con título, categoría, al menos un ingrediente y al menos un
paso. Esa condición no filtra, no corrige y no escribe nada por su cuenta.

### 1.7 Foto

`foto` es una URL externa y se dibuja donde esté. Es lo único viable sin
backend: una imagen guardada en Drive necesita pedirse con el token y armar un
object URL, y las miniaturas obligan a mantener un mapa de `thumbnailLink` que
caduca.

**El diseño la contempla y no depende de ella.** Una receta sin foto se dibuja
completa igual, como hoy hace el home con una categoría sin imagen. Si aparece
una vía de hosting aceptable, el campo ya existe.

### 1.8 Variaciones y versiones del mismo plato

Un plato con varias recetas de fuentes distintas **no se repite N veces**: hay
una receta y las demás cuelgan de ella como variaciones.

`## Variaciones` sube de categoría: cada `###` adentro es una versión con
nombre, **puede llevar su propia `fuente`** en una línea en itálica al empezar, y
puede traer sus propios ingredientes y pasos si difiere mucho.

`[agregado en el Hito 9]` **Una variación también puede ser un simple bullet**, y
en el contenido real casi siempre lo es: *"- Pasar por harina directamente, sin
usar huevo."* Cuando `## Variaciones` trae una lista en vez de secciones, se
muestra como lista. No se fuerza la estructura sobre lo que ya está escrito.

**Por qué dentro del archivo y no en archivos vinculados:** un vínculo entre
`.md` obliga a que el archivo sepa dónde vive el otro, y eso se rompe en cuanto
alguien mueve o renombra algo en Drive — que es precisamente lo que el producto
promete que se puede hacer. Dentro del archivo, la receta sigue siendo
autocontenida y legible sola (J8).

**Consecuencia para J4:** el filtro por ingrediente mira los ingredientes de la
receta principal. Los de una variación cuentan para la receta entera, sin
distinguir cuál. Es una imprecisión aceptada: la alternativa es un modelo de
versiones que el formato no aguanta sin dejar de ser legible.

---

## 2. Entidades y ciclo de vida

| Entidad | Dónde vive | Nace | Muere |
|---|---|---|---|
| **Receta** | Un `.md` en una carpeta de Drive | Al convertir un borrador, o cuando un agente la escribe directo | Se borra a mano |
| **Borrador** | Una **fila en la planilla de Borradores** en Drive | Al capturar | **Al convertirse**, o al descartarse |
| **Categoría** | Una carpeta dentro de `Recetario/` | Al crear la carpeta en Drive | Al borrarla |
| **Tag** | Frontmatter | Al escribirlo | Cuando ninguna receta lo usa |
| **Fuente** | Frontmatter, o línea en itálica en una variación | Con el borrador o la receta | Con ella |
| **Variación** | Sección `###` bajo `## Variaciones` | Al escribirla | Al borrarla |
| **Índice** | Google Sheet `Recetario/_indice` | Al primer arranque, o al reindexar | Se puede borrar en cualquier momento: se reconstruye |
| **Plan semanal** *(condicional)* | Archivo en Drive | Solo si J9 se construye | |
| **Lista de compras** *(condicional)* | Archivo en Drive | Deriva del plan | |

### 2.1 Las tres reglas del modelo

**Una receta vive en exactamente una carpeta.** La carpeta dice *dónde está el
archivo*. Los tags dicen *cómo se lo encuentra*, y son varios. La navegación
puede cruzar criterios; no está atada al árbol de carpetas.

**El borrador no entra al índice.** Borradores es **su propia planilla, una fila
por borrador**, no una carpeta con un archivo por borrador ni un archivo único
que haya que reescribir entero para agregar una línea. Es el mismo argumento que
eligió planilla para el índice: Drive no tiene escritura parcial, así que
capturar escribe una fila y descartar o convertir borran una fila. Que sea otra
planilla no la mete en el índice: es una cola de trabajo, no un archivo
consolidado. `[decisión: Hito 4, corregida en el Hito 7]` Sus columnas son `id`,
`titulo`, `fuente`, `capturado` y `nota` `[la última, del 2026-09-12]`.

**Una receta se identifica por su `fileId` de Drive.** Ni la ruta ni el nombre
del archivo son identidad: cambiar la categoría mueve el archivo entre carpetas y
editar el título no lo renombra. `[decisión: Hito 7]`

**El índice es una implementación compartida, no solo un contrato.** El agente
que escribe una receta **también escribe su fila**, y lo hace con la misma
función que usa la app. Ver §2.2.

### 2.2 La capa compartida

Las dos partes del ecosistema —la PWA y el agente— no acuerdan un formato y lo
implementan cada una por su lado: **usan el mismo código**.

| Operación | Qué hace | Quién la invoca |
|---|---|---|
| **Escribir receta al índice** | Recibe el `.md` o el objeto que representa la receta, y escribe o reemplaza su fila | La app al guardar; el agente al convertir |
| **Convertir borrador en receta** | Escribe el `.md`, escribe la fila del índice, y **borra la entrada del borrador** | La app; el agente |
| **Leer y parsear un `.md`** | Aplica el esquema y lee la completitud tal como la dice el archivo | La app al listar; el agente para validar lo que escribió |

Eso elimina la fuente de divergencia más obvia —dos implementaciones del mismo
formato que se separan con el tiempo— y hace concreto lo que la visión llama
ecosistema: no son dos productos que comparten una carpeta, son dos frentes
sobre la misma lógica.

**Es también lo que sostiene el tercer diferenciador**, "el código es del
usuario": el código no solo es suyo, es el mismo de los dos lados.

### 2.3 Dos escritores sobre el mismo índice

Aun con código compartido, la app y el agente escriben la misma planilla en
momentos distintos. Con un solo usuario y sesiones que no se solapan, el riesgo
de colisión es bajo, y el principio 1 lo cubre: si una fila queda mal, el índice
se reconstruye desde los `.md`, que son la verdad.

No se agrega ningún mecanismo de bloqueo. La reparación es reindexar, ofrecida
desde la app (principio 4).

### 2.4 Qué guarda el índice

**La fila es completa.** Título, categoría, tags, estado de completitud, fuente,
foto y **la lista de nombres de ingredientes**.

Los ingredientes están ahí porque la búsqueda de J4 tiene que resolverse sin leer
mil `.md`. Se guardan **tal como están escritos en la receta**, sin normalizar:
cualquier normalización que la app y el agente tuvieran que replicar es una
fuente de divergencia, y la capa compartida existe justamente para no tener dos
versiones de la misma regla.

Una fila más gorda es barata: la escritura por fila ronda los 200 B y es
exactamente para lo que se eligió una planilla en vez de un JSON.

---

## 3. Inventario de pantallas

| Pantalla | Propósito | Contexto | Jobs |
|---|---|---|---|
| **Recetario** | Punto de entrada. Búsqueda arriba, categorías abajo. | Recuperar | J1, J5 |
| **Resultados** `[inferida]` | Lo que devuelve la búsqueda, por nombre o por ingrediente. | Recuperar | J1, J4 |
| **Categoría** | Las recetas de una carpeta. | Recuperar | J5 |
| **Receta** | La receta entera, en una columna. Es también la pantalla de cocina. | Recuperar, Cocinar | J6 |
| **Editor** | Corregir un error, anotar una variación. | Cocinar | J7 |
| **Borradores** | Los borradores esperando conversión. | Archivar | J2, J3 |
| **Borrador** `[inferida]` | Una entrada: su título, su fuente, y qué hacer con ella. | Archivar | J3 |
| **Captura** `[inferida]` | Pantalla efímera del Share Target: pide el título y guarda. | Archivar | J2 |
| **Ajustes** `[inferida]` | Cuenta, reindexar, avisos acumulados. | Transversal | — |
| **Conexión** `[inferida]` | Primer arranque y consentimiento de Google. | Transversal | — |
| **Planificador** `[condicional]` | Dos comidas por día, siete días. | Planificar | J9 |
| **Lista de compras** `[condicional]` | Los ingredientes de lo planificado. | Planificar | J9 |

Doce pantallas, de las cuales seis se dedujeron de la estructura y dos existen
solo si J9 se construye.

---

## 4. Modelo de navegación

### 4.1 Dos lugares primarios

**Recetario** y **Borradores**. Nada más.

Son los dos contextos principales del Hito 2 y tienen lógicas incompatibles: uno
es un archivo consolidado que se consulta, el otro es una cola de trabajo que se
vacía. Meterlos en el mismo lugar obliga a uno de los dos a comportarse como el
otro.

**Ajustes** es secundario. `[cambio del 2026-09-12: se llega desde el menú
lateral, como los otros dos]`

**Planificador**, si existe, tiene su entrada **en el Recetario, debajo de las
categorías** — visible, alcanzable, y sin ser uno de los lugares primarios. El
principio 6 pide que no ocupe navegación primaria y que sacarlo cueste borrar una
pantalla; una entrada en el home cumple las dos cosas.

**Capturar no es un lugar.** La captura entra por el Share Target del sistema
operativo, desde la app donde estabas. No hay botón de "capturar" en la
navegación porque en el momento en que se captura, Recetario no está abierto.

### 4.2 El punto de entrada es el Recetario

Siempre, aunque Borradores tenga borradores esperando. Abrir en Borradores te
pone adelante una cola de trabajo cuando lo que ibas a hacer era buscar una
receta.

Para que Borradores no reproduzca el limbo adentro del producto, **su entrada de
navegación lleva un contador** de cuántos borradores esperan. Es un aviso sin
acción asociada, así que no interrumpe (principio 4). `[a confirmar]`

### 4.3 Profundidad

**Dos toques para lo frecuente, tres como máximo.**

| Destino | Toques | Camino |
|---|---|---|
| Una receta que sé cómo se llama | 2 | Recetario → escribir → tocar el resultado |
| Recetas con un ingrediente | 2 | Recetario → escribir el ingrediente → resultados |
| Pasear una categoría | 2 | Recetario → categoría → receta *(3 hasta la receta)* |
| Un borrador | 2 | Borradores → borrador |
| Corregir la receta que estoy leyendo | 1 | Receta → editar |
| El planificador `[condicional]` | 2 | Recetario → planificador |
| Reindexar | 3 | Recetario → ajustes → reindexar |

Nada frecuente queda a más de dos. Ajustes está a tres a propósito.

### 4.4 La búsqueda es lo principal

Es el control más importante de la pantalla principal y no está escondido detrás
de un ícono: se ve, ocupa lugar, y es lo primero. Sirve a J1 —el job más
frecuente— y a J4, que hoy no existe.

Busca en el **título**, en los **ingredientes** y en los **tags**. No busca en
el cuerpo entero: eso es lo que hace el buscador de Drive y es exactamente lo que
trae ruido.

### 4.5 Volver

El botón de volver es un control de tamaño normal, no un chevron chico. El gesto
del sistema —swipe en Android, back del navegador— funciona igual y es el camino
que la mayoría va a usar; el botón es el respaldo visible.

Sale de la regla de tamaños del principio 7: el tamaño de los controles es una
regla del sistema, no una decisión por pantalla.

### 4.6 Un menú lateral, sin barra inferior

`[reescrita el 2026-09-12: antes «Sin barra de navegación inferior»]`

La navegación primaria vive en un **menú lateral** con cuatro entradas, cada una
con su nombre y su ícono:

| | |
|---|---|
| **Inicio** | El punto de entrada: la pantalla del Recetario. Se llama *Inicio* porque «Recetario» ya es la marca de arriba del menú `[2026-09-12]` |
| **Borradores** | La cola, con su contador |
| **Nueva receta** | Una acción, no un lugar: nunca queda marcada |
| **Ajustes** | Secundario, pero alcanzable desde cualquier parte |

**En el teléfono se despliega desde una hamburguesa**, arriba a la izquierda —del
lado por el que el panel entra—, y se cierra tocando el velo o cualquier destino.
**Desde 900 px queda fijo** y el contenido se corre: el mismo ancho en que la
grilla de categorías pasa a cuatro columnas. Es la misma pantalla; lo resuelve el
CSS.

**El contador de borradores aparece dos veces**: junto a «Borradores» dentro del
menú, y sobre la hamburguesa cuando está cerrado. Sin eso, con el menú cerrado no
habría manera de saber que hay algo esperando.

**La barra inferior sigue descartada.** El argumento anterior —que con dos ítems
una franja permanente no se justifica— ya no aplica igual con cuatro entradas,
pero el lateral las resuelve sin gastar pantalla en el teléfono y sin desperdiciar
el ancho en escritorio.

**Capturar sigue sin estar en la navegación** (§4.1): entra por el Share Target.
Lo que sí entró al menú es **Nueva receta**, que no tenía ninguna puerta: los
mockups no la dibujaron y `E04-Corregir.md` F04.3b define la pantalla sin decir
desde dónde se llega.

---

## 5. La clasificación

### 5.1 Dieciséis categorías, confirmadas

Se justifican de nuevo y quedan: el eje es **tipo de plato**, y sirve para
pasear, que es para lo que existe. Dieciséis es un número que se recorre de un
vistazo en una grilla y que ya está aprendido de memoria por posición.

Lo que cambia no es la taxonomía: es **su lugar**. Deja de ser la pantalla
principal y pasa a estar debajo de la búsqueda.

### 5.2 Los tags quedan libres

Vocabulario libre en el frontmatter, sin lista controlada. Nada impide escribir
`rapido` y `rápido` como dos tags distintos, y se acepta: un vocabulario
controlado obliga a mantenerlo y a que el agente lo conozca, y el costo del
desorden es bajo con un solo autor.

`[abierto]` Si con mil recetas el desorden molesta, la app puede sugerir tags
existentes al editar. No se diseña ahora.

### 5.3 Quién elige la carpeta

**El usuario, siempre.** El agente **propone** carpeta y tags al convertir; el
usuario confirma. Es la misma regla que gobierna las variaciones y la
completitud: lo que clasifica es del usuario, lo que transcribe es del agente.

---

## 6. Divergencias con la implementación actual

`[la columna «implementación actual» describe v1, anterior al rediseño. Hoy el
rediseño está implementado: lo que sigue queda como registro de lo que cambió]`

| Decisión | Implementación actual | Este documento |
|---|---|---|
| Pantalla principal | Grilla de 16 categorías, sin búsqueda a la vista | Búsqueda arriba, categorías abajo |
| Clasificación | Categoría única | Categoría única + tags como clasificación real |
| Ingredientes | Prosa libre bajo `## Ingredientes` | Nombre, separador y cantidad |
| Completitud | Tag manual `incompleto` | Dato del archivo: `completa: sí` / `no`, declarado por el usuario `[2026-09-12]` |
| Foto | Descartada | Campo `foto`, URL externa, opcional |
| Variaciones | Sección informativa | Entidad con `fuente` propia |
| Borradores | No existe | Uno de los dos lugares primarios |
| Índice | Lo escribe solo la app | Lógica compartida: la escriben la app y el agente con la misma función |
| Contenido del índice | Metadatos de la receta | Fila completa, con los nombres de los ingredientes |
| Borradores | No existe | Una planilla en Drive, una fila por borrador |
| Índice corrupto | Error crudo, se repara a mano en Drive | Aviso con botón de reindexar |
| Barra de navegación | No existe | Sigue sin existir, ahora por decisión |
