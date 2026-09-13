# Auditoría tipográfica

**Versión:** 1.0
**Fecha:** 2026-09-12
**Estado:** Informe. No cambia nada del sistema: lo que proponga se decide aparte.
**Pedido:** `plan/BACKLOG.md` P11.

---

## Sobre este documento

Tres partes, en el orden que pidió P11:

1. **Criterios**, sacados de fuentes externas (§1).
2. **Auditoría** de las once pantallas contra la escala de `design-system.md` §3.2 y
   §3.3, pantalla por pantalla y entre pantallas (§2 y §3).
3. **Propuesta** de cambios, sin aplicar (§4).

**Cómo se midió.** Cada pantalla se dibujó con sus funciones de render reales, el CSS
de `src/ui/tokens.css` y `src/ui/base.css`, y datos de ejemplo —la receta
*Milanesas a la napolitana* con grupos, tramos, variación y nota—. Se abrió a 400 px de
ancho en Chromium y se leyó el estilo **computado** de cada texto visible: tamaño,
peso, interlínea, color y mayúsculas. No es lo que dice el CSS sino lo que llega a la
pantalla. El modo cocina se midió en sus dos posiciones: son doce vistas.

La fuente del sistema en esa medición es SF (macOS). En Android es Roboto: los tamaños y
los pesos son los mismos, el ancho de cada palabra no.

---

## 1. Criterios

Cada criterio lleva su fuente; las siglas y las direcciones están al pie de la sección.

**C1 — Tres tamaños por pantalla, cuatro como mucho.** NNg: «no more than 3 sizes»
[NNg-vh]. UXP: «limit to 3–4 sizes», con captions y metadatos como niveles aparte [UXP].
Butterick, para títulos: «three levels of headings. Two is better» [PT-h].

**C2 — Dos niveles vecinos tienen que separarse de verdad.** UXP pide el título al menos
2× el cuerpo y el subtítulo 1,5× [UXP]. Butterick va al revés para títulos *dentro* del
texto: primero espacio, después negrita, y el tamaño apenas sube [PT-h]. Las dos cosas
son compatibles: **o se separa mucho por tamaño, o no se separa por tamaño y se usa peso
y espacio**. Lo que no funciona es la mitad.

**C3 — Con una sola familia, las palancas son peso, tamaño y color, en ese orden de
fuerza.** Apple arma la jerarquía ajustando «font weight, size, and color» [HIG]. En las
dos escalas de sistema, **un título y un cuerpo del mismo tamaño se distinguen sólo por
el peso**: Headline y Body miden 17 pt en iOS [HIG]; `titleMedium` y `bodyLarge` miden 16
en Material 3 [M3]. Las dos usan dos pesos, no más [HIG] [M3].

**C4 — El color nunca es la única señal**, y bajar el contraste no es la manera de
marcar lo secundario: con reflejo en un teléfono, el texto de bajo contraste es «nearly
impossible» de leer [NNg-lc]. Para restarle importancia a algo, mejor moverlo que
apagarlo [NNg-lc].

**C5 — Un rol, un estilo, en toda la app.** Los estilos de texto existen para que la
jerarquía sea «consistent» [HIG]; en Material 3 cada texto se asigna a un rol
(`titleLarge`), no a un tamaño suelto [M3]. Mezclar estilos hace que la interfaz se sienta
«internally inconsistent» [HIG].

**C6 — Interlínea: alrededor de 1,4–1,5 en el cuerpo, más cerrada en títulos y en micro.**
Butterick: 120–145 % [PT-ls]. Material 3: 1,5 en 16, 1,43 en 14, 1,33 en 12 [M3]. Apple:
1,29 en 17, 1,38 en 13 [HIG]. La interlínea `normal` del navegador (≈1,2) queda en el
borde de abajo de todos esos rangos.

**C7 — Los pisos de tamaño.** Apple: 17 pt por defecto, 11 como mínimo [HIG]. Material 3:
cuerpo 16 / 14 / 12, etiqueta mínima 11 [M3]. En móvil, 14 px es el mínimo absoluto del
cuerpo [DSB]. **La escala propia de este sistema es más exigente que las de plataforma**
—16 de cuerpo mínimo, 18 en la receta, 22 en cocina (§1)—, y es la que se audita.

**C8 — En oscuro, el texto claro se ve más grueso.** El ejemplo de referencia baja el
peso un escalón (400 → 350, 500 → 400) para compensar [CSST]. Los trazos finos se dibujan
más tenues de lo declarado [WCAG]. Material recomienda no usar blanco puro y desaturar
[MDC].

**C9 — Mayúsculas sólo en textos de menos de una línea, con 5–12 % de espaciado
extra** [PT]. Nunca en bloques [UXP] [DSB].

Siglas: **[UXP]** https://uxplanet.org/what-is-typographic-hierarchy-definition-examples-26f6225f6bad ·
**[DSB]** https://www.designstudiouiux.com/blog/what-is-typographic-hierarchy/ ·
**[HIG]** https://developer.apple.com/design/human-interface-guidelines/typography ·
**[M3]** https://developer.android.com/develop/ui/compose/designsystems/material3 ·
**[PT]** https://practicaltypography.com/summary-of-key-rules.html ·
**[PT-h]** https://practicaltypography.com/headings.html ·
**[PT-ls]** https://practicaltypography.com/line-spacing.html ·
**[NNg-vh]** https://www.nngroup.com/articles/visual-hierarchy-ux-definition/ ·
**[NNg-lc]** https://www.nngroup.com/articles/low-contrast/ ·
**[CSST]** https://css-tricks.com/dark-mode-and-variable-fonts/ ·
**[WCAG]** https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ·
**[MDC]** https://codelabs.developers.google.com/codelabs/design-material-darktheme

El artículo de UX Planet se leyó con un navegador —Medium bloquea la descarga directa— y
llegó casi entero. `m3.material.io` no se pudo leer: la escala de Material 3 sale de la
documentación de Android Developers. El ratio 1,2 para móvil que suele citarse no se
verificó en su fuente.

### Lo que la escala actual ya cumple

- **Dos pesos, 400 y 600** (C3), como las escalas de sistema.
- **Razón 1,2 con base 16** (§3.2), el ratio que se recomienda para móvil.
- **Rótulos en mayúsculas cortos y con 6 % de espaciado** (C9).
- **Interlínea de lectura y cocina, 1,6 y 1,65**: más abierta que el rango general,
  a propósito, y documentada (§3.2).

---

## 2. Pantalla por pantalla

Cada tabla lista los estilos distintos que aparecen en la pantalla, del más grande al
más chico. **Nivel** es el rol que el texto cumple; **Escala** dice si el tamaño y el
peso coinciden con un token de §3.2 tal como está definido.

Colores: `fg` es el texto principal, `fg-2` el secundario, `fg-3` el tenue.

### 2.1 Recetario

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Recetario», en el encabezado | 24 / 600 | fg | Título de pantalla | `--txt-titulo` ✓ |
| La caja de búsqueda | 16 / 400 | fg | Control | `--txt-base` ✓ |
| «CATEGORÍAS» | 14 / 400, mayúsculas | fg-2 | Rótulo de sección | `--txt-chico` ✓ |
| El nombre del tile | 14 / **600** | fg | Nombre de un ítem | Tamaño chico, peso de título ✗ |
| El número del tile y del menú | 12 / **600** | fg / fg-2 | Dato | `--txt-micro` pide 500 ✗ |

Tres tamaños y dos niveles claros: el título y la grilla. El rótulo en mayúsculas
cumple su papel. El nombre del tile en 14 / 600 queda por debajo del cuerpo mínimo de
16 de §1, pero va sobre foto y es una etiqueta, no prosa.

### 2.2 Categoría

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Carnes», en el encabezado | **16** / 600 | fg | Título de pantalla | §3.2 dice que el nombre de la categoría va en `--txt-titulo` (24) ✗ |
| El título de la tarjeta | 16 / 600, interlínea 1.3 | fg | Nombre de un ítem | `--txt-base` con peso de título ✗ |
| El contexto de la tarjeta, el total | 14 / 400 | fg-2 | Metadato | `--txt-chico` ✓ |
| El chip del filtro | 14 / 400 | acento | Estado | `--txt-chico` ✓ |

**El título de la pantalla y el título de cada tarjeta son iguales:** 16 / 600, mismo
color. Lo único que los separa es la posición. En pantalla se lee: «Carnes» arriba no
pesa más que «Bife de chorizo».

### 2.3 Resultados

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| La consulta, en la caja | 16 / 400 | fg | Control | ✓ |
| «POR NOMBRE», «POR INGREDIENTE» y su número | 14 / 400, mayúsculas | fg-2 | Rótulo de sección | ✓ |
| El título de la tarjeta | 16 / 600 | fg | Nombre de un ítem | ✗ (como en Categoría) |
| El contexto y el motivo | 14 / 400 | fg-2 / acento | Metadato | ✓ |

Sin título de pantalla: la caja es el encabezado. Los rótulos en mayúsculas ordenan
bien los grupos.

### 2.4 Receta abierta

Es la pantalla con más niveles.

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| El título de la receta | 24 / 600, interlínea 1.25 | fg | Título de pantalla | `--txt-titulo` ✓ |
| «Ingredientes», «Preparación», «Variaciones», «Notas» | 20 / 600, con divisor | fg | Título de sección | `--txt-titulo-s` ✓ |
| La descripción, los pasos, la variación, la nota | 18 / 400, interlínea 1.6 | fg | Cuerpo | `--txt-lectura` ✓ |
| **El nombre del ingrediente** | **16** / 400 | fg | Cuerpo | §1 y §3.2 piden 18 para los ingredientes ✗ |
| La cantidad | 16 / 600 | fg | Cuerpo, dato | Mismo desvío, en 600 ✗ |
| El nombre de la variación («A caballo») | **16** / 600 | fg | Subtítulo | Fuera de escala: no hay token para un tercer nivel de título ✗ |
| Los botones *Cocinar* y *Editar* | 16 / 600 | bg / fg | Control | ✓ |
| El contexto («Carnes · 4 porciones…»), el link al `.md` | 14 / 400 | fg-2 | Metadato | ✓ |
| Los chips de tags e *Incompleta* | 14 / 400 | fg / acento | Etiqueta | ✓ |
| «PARA LA CUBIERTA», «GRATINADO» | 14 / 400, mayúsculas | fg-2 | Rótulo de grupo | ✓ |
| La fuente, al pie de la ficha | 12 / 400 | fg-3 / fg-2 | Procedencia | `--txt-micro` pide 500 ✗ |

**Seis tamaños** —24, 20, 18, 16, 14 y 12— que, combinados con peso, color y
mayúsculas, dan **once estilos distintos** en una sola pantalla.

Lo que se ve en la captura:

- **Los ingredientes se leen más chicos que los pasos**, en la misma receta y a la misma
  distancia. Es el desvío más concreto de toda la auditoría: §1 fija el cuerpo de la
  receta abierta en 18 px y los ingredientes están en 16.
- **El título de sección compite con el título de la receta.** 20 contra 24 es una
  razón de 1.2, con el mismo peso y el mismo color; el divisor debajo le suma peso a la
  sección. «Ingredientes» se lee casi tan fuerte como «Milanesas a la napolitana».
- **El nombre de una variación (16 / 600) es más chico que el texto que encabeza** (18 /
  400). Se distingue por peso, pero el título queda por debajo de su contenido.

### 2.5 Modo cocina

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| El paso, el ingrediente | 22 / 400, interlínea 1.65 | fg / fg-3 | Cuerpo | `--txt-cocina` ✓ |
| La cantidad | 22 / 600 | fg | Cuerpo, dato | ✓ (§3.3) |
| El título de la receta, en el encabezado | **16** / 600 | fg | Título de pantalla | §3.2 define `--txt-cocina-titulo` (28) «el encabezado en modo cocina» ✗ |
| *Ingredientes* / *Pasos*, *Salir* | 16 / 600 | fg / fg-2 | Control | ✓ |
| «PARA LA CUBIERTA», «GRATINADO» | **16** / 400, mayúsculas | fg-2 | Rótulo de grupo | §3.3 pide 28 para el encabezado de sección en cocina ✗ |

**`--txt-cocina-titulo` (28 px) no se usa en ningún lado.** §3.3 dice que en cocina el
encabezado de sección sube de 20 a 28; en el código el rótulo de un grupo o un tramo es
16 en mayúsculas y `fg-2`. El resultado es un rótulo **más chico y más tenue que el
paso** (22 / `fg`): separa por mayúsculas y color, no por tamaño.

En la captura se lee bien igual: el rótulo en mayúsculas con aire arriba corta el
bloque. Lo que no se sabe es si a 50 cm alcanza (`BACKLOG.md` §4, «la escala del modo
cocina a 50 cm reales»).

**Fuera de la tipografía, pero salió acá:** §1 pide 64 × 64 px de área táctil en modo
cocina. En el encabezado, el volver y el sol de la pantalla encendida miden 48 y
*Salir* 40. El sol llegó con P10 (2026-09-12): antes era una barra de 64 px al pie.

### 2.6 Editor

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Contenido» | 20 / 600, con divisor | fg | Título de sección | `--txt-titulo-s` ✓ |
| «Editando», en el encabezado | 16 / 600 | fg | Título de pantalla | Sin token de título de encabezado ✗ |
| Lo escrito en los campos | 16 / 400, interlínea 1.5 | fg | Control | ✓ |
| *Guardar*, el conmutador de Estado, *Borrar receta* | 16 / 600 | varios | Control | ✓ |
| Los rótulos de campo, «Formato» | 14 / 400 | fg-2 | Etiqueta | ✓ |
| Los chips de tags | 14 / 400 | fg | Etiqueta | ✓ |
| **La ayuda de «Formato»** | **11** / 400, interlínea 1.6 | fg-2 | Texto de ayuda | **Debajo de `--txt-micro` (12)**, y §3.2 dice que micro es «solo datos, nunca prosa» ✗ |

**La primera ficha no tiene título y la segunda sí.** «Contenido» es el único título de
sección del formulario: los datos de arriba no se llaman de ninguna forma. El único
texto de la pantalla más grande que un campo es ese rótulo, a mitad de camino.

### 2.7 Captura

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Guardar en Recetario» | 24 / **700** | fg | Título de pantalla | `--txt-titulo` pide 600. El 700 es el del navegador para `<h1>` ✗ |
| Lo escrito, *Cancelar*, *Guardar* | 16 / 400 y 600 | fg | Control | ✓ |
| La fuente compartida, los rótulos de campo | 14 / 400 | fg-2 | Metadato, etiqueta | ✓ |
| La ayuda «Estructura básica» | **11** / 400 | fg-2 | Texto de ayuda | Como en el editor ✗ |

Compartida desde otra app, la captura no tiene encabezado: su título va en el cuerpo, a
la izquierda y en 700. Agregada a mano sí lo tiene, en 16 / 600 centrado. **La misma
pantalla tiene dos títulos distintos según cómo se entró.**

### 2.8 Borradores

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Borradores», en el encabezado | 24 / 600 | fg | Título de pantalla | ✓ |
| El título del borrador | 16 / 600 | fg | Nombre de un ítem | ✗ (como la tarjeta) |
| El total | 14 / 400 | fg-2 | Dato | ✓ |
| «hace 2 días» | 12 / 400 | fg-3 | Dato | `--txt-micro` pide 500 ✗ |

### 2.9 Borrador

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Focaccia de papa» | 24 / 600, interlínea 1.25 | fg | Título de pantalla | ✓, pero escrito en línea en `borradores.ts`, no con la clase `.rec-tit` |
| La nota | 18 / 400, interlínea 1.6 | fg | Cuerpo | `--txt-lectura` ✓ |
| «Borrador», en el encabezado; los botones | 16 / 600 | fg | Control | ✓ |
| La fuente | **14** / 400 | fg-2 | Procedencia | En la receta abierta la misma línea es 12 / `fg-3` ✗ |
| «Capturado hace 2 días» | 12 / 400 | fg-3 | Dato | micro pide 500 ✗ |

### 2.10 Ajustes

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Ajustes», en el encabezado | 24 / 600 | fg | Título de pantalla | ✓ |
| «Cuenta», «Índice», «Avisos» | 20 / 600, con divisor | fg | Título de sección | ✓ |
| La cuenta, los botones | 16 / 400 y 600 | fg | Cuerpo, control | ✓ |
| «Salir no borra nada de Drive», «Último reindexado», los avisos | **14** / 400 | fg-2 | **Prosa** | `--txt-chico` es para metadatos; §1 fija el cuerpo mínimo en 16 ✗ |

Tres niveles limpios: pantalla (24), sección (20), contenido (16/14). **Es la pantalla
mejor ordenada**, pero el título de pantalla y el de sección se separan por una razón de
1.2, lo mismo que en la receta.

### 2.11 Conexión

| Texto | Tamaño / peso | Color | Nivel | Escala |
|---|---|---|---|---|
| «Recetario» | 24 / **700** | fg | Título | 700 del navegador, como en Captura ✗ |
| «Tus recetas viven en tu Google Drive…» | 18 / 400, interlínea 1.6 | **fg-2** | Cuerpo | `--txt-lectura`, que §3.2 reserva para la receta abierta ✗ |
| *Conectar con Google* | 16 / 600 | bg | Control | ✓ |

---

## 3. Entre pantallas

### 3.1 El mismo rol, dibujado distinto

| Rol | Cómo se ve | Dónde |
|---|---|---|
| **Título de pantalla** | 24 / 600, centrado en el encabezado | Recetario, Borradores, Ajustes |
| | 16 / 600, centrado en el encabezado | Categoría, Borrador, Editor, Captura a mano, Modo cocina |
| | 24 / 600, en el cuerpo, a la izquierda | Receta abierta, Borrador (con el de 16 arriba) |
| | 24 / **700**, en el cuerpo, a la izquierda | Captura compartida, Conexión |
| **Nombre de un ítem de lista** | 16 / 600 | Tarjeta de receta, borrador |
| | 14 / 600 | Tile de categoría |
| **Título de sección** | 20 / 600, con divisor | Fichas de receta, editor y ajustes |
| | 14 / 400, mayúsculas, `fg-2` | «Categorías», grupos de resultados, grupos de ingredientes, tramos |
| | 16 / 400, mayúsculas, `fg-2` | Grupos y tramos en modo cocina |
| | 16 / 600 | Nombre de una variación |
| **Procedencia (📖 fuente)** | 12 / 400, `fg-3` | Receta abierta |
| | 14 / 400, `fg-2` | Borrador |
| **Prosa secundaria** | 14 / 400, `fg-2` | Ajustes, la leyenda de Estado |
| | 18 / 400, `fg-2` | Conexión |
| **Texto de ayuda** | 11 / 400, `fg-2` | «Formato» en el editor, «Estructura básica» en la captura |

**Hay un patrón y dos excepciones.** El patrón: las pantallas de primer nivel —las del
menú lateral— llevan el título grande en el encabezado; las de detalle llevan el
encabezado chico y, si tienen un objeto propio, su nombre grande en el cuerpo. Las
excepciones son **Categoría**, que es de detalle pero no tiene nombre en el cuerpo y
queda con su nombre en 16, y **Captura y Conexión**, que no tienen encabezado y usan el
700 del navegador.

### 3.2 La escala contra el uso

| Token | Definido | Usado | Observación |
|---|---|---|---|
| `--txt-micro` | 12 / 500 | 12 / 400 y 12 / 600 | **Nunca en 500.** Contadores en 600, fechas y fuente en 400. |
| `--txt-chico` | 14 / 400 | 14 / 400 y 14 / 600 | Bien, salvo el tile en 600. Se usa para prosa en Ajustes. |
| `--txt-base` | 16 / 400 | 16 / 400 y **16 / 600** | 16 / 600 es el estilo más repetido de la app: botones, encabezados chicos, títulos de tarjeta, cantidades y variaciones. Ningún token lo nombra. |
| `--txt-lectura` | 18 / 400 | 18 / 400 | Bien. Falta en los ingredientes. Aparece en Conexión, fuera de la receta. |
| `--txt-titulo-s` | 20 / 600 | 20 / 600 | Bien. |
| `--txt-titulo` | 24 / 600 | 24 / 600 y 24 / 700 | El 700 no es del sistema. |
| `--txt-cocina` | 22 / 400 | 22 / 400 y 22 / 600 | Bien (la cantidad va en 600 por §3.3). |
| `--txt-cocina-titulo` | 28 / 600 | **Nunca** | §3.3 lo usa para el encabezado de sección en cocina; el código usa 16. |
| — | — | **11 / 400** | La ayuda de formato. No es ningún token y queda debajo del piso de micro. |

### 3.3 La interlínea no llega

§3.2 fija una interlínea por token: 1.4 para micro, 1.45 para chico, 1.5 para base, 1.3
y 1.25 para los títulos. **En el código sólo la llevan la lectura, la cocina, los campos
y el título de la receta.** Todo lo demás se dibuja con la interlínea `normal` del
navegador, que en SF y Roboto ronda 1.2: el `body` no declara `line-height`.

Con una línea no se nota. Se nota cuando un texto hace dos renglones: el nombre de un
tile («Desayunos y meriendas»), un título de sección largo, la prosa de 14 en Ajustes,
un aviso.

### 3.4 Tamaño y peso a la vez

Casi todos los saltos de nivel de la app cambian **tamaño y peso juntos** (24/600 →
18/400; 20/600 → 16/400), y dentro de un mismo tamaño el peso hace todo el trabajo
(16/600 título de tarjeta → 16/400 ingrediente). Hay dos pesos en uso —400 y 600— más
el 700 accidental. Eso está bien: **el problema no es la cantidad de pesos, es que el
600 en 16 cumple cinco roles distintos.**

---

## 4. Propuesta

Ordenada por lo que cuesta decidirla, no por gravedad.

**Estado** `[2026-09-12]`: **T1 a T4 aplicadas** en `src/ui/base.css` y probadas en el
teléfono. **T5 a T8 escritas** en `design-system.md` §3.2. **T9 por la salida a) y T10 aplicadas.** **T11 aplicada al revés de lo propuesto:** la fuente se unifica con el estilo de la receta (12, `fg-3`), también en el borrador. **T12 por la salida a):** las notas de una oración suben a 16, el piso de §1. **T13 por la salida a):** la primera ficha del editor se titula «Datos». T14, fuera de la tipografía, pasó a `plan/BACKLOG.md` P16.
Las que dicen *decisión* tienen más de una salida razonable; las demás son desvíos del
propio sistema.

### 4.1 Desvíos: el código no cumple lo que el sistema ya dice

| # | Qué | Criterio | Propuesta |
|---|---|---|---|
| **T1** | Los ingredientes de la receta abierta van en 16 | §1, C5 | Llevarlos a `--txt-lectura` (18), nombre y cantidad. Es lo único de la auditoría que contradice una restricción de §1. |
| **T2** | Casi nada declara interlínea: se dibuja con la `normal` del navegador | C6 | Poner `line-height: 1.5` en `body`. Los títulos, la lectura y la cocina ya declaran la suya y no cambian. |
| **T3** | Los títulos de Captura y Conexión salen en 700 | C3, C5 | `font-weight: 600` en `.hoja h1` y `.arr h1`. Es el peso del navegador para `<h1>`, no una decisión. |
| **T4** | La ayuda de formato va en 11 px, debajo de todo token | C7 | Subirla a `--txt-micro` (12) como mínimo. |

### 4.2 La escala no nombra lo que la app usa

| # | Qué | Criterio | Propuesta |
|---|---|---|---|
| **T5** | 16 / 600 cumple cinco roles y no es ningún token | C5 | Nombrarlo en §3.2: **«base fuerte»**, para el nombre de un ítem de lista, un botón y el título del encabezado chico. No cambia nada en pantalla: ordena la escala. |
| **T6** | `--txt-micro` dice 500 y nunca se usa en 500 | C5 | Escribir la escala como está: micro en 400 para fechas y procedencia, en 600 para contadores. Es más simple que llevar todo a 500, que hoy no usa ningún texto. |
| **T7** | §3.2 dice que el nombre de la categoría va en 24, y va en 16 | C5 | Corregir §3.2, no la pantalla: Categoría sigue el patrón de las pantallas de detalle (§3.1), igual que Borrador y el Editor. |
| **T8** | `--txt-cocina-titulo` (28) no se usa; en cocina los grupos van en 16 mayúsculas | C2 | Esperar a la prueba a 50 cm (`BACKLOG.md` §4). Mientras tanto, §3.3 describe lo que no está: anotar que el token no está aplicado. |

### 4.3 Decisiones

| # | Qué | Criterio | Salidas |
|---|---|---|---|
| **T9** | **El título de sección (20) está a una razón de 1,2 del título de pantalla (24)**, con el mismo peso | C2 | **a)** Bajar la sección a 18 / 600: mismo tamaño que el cuerpo, se separa por peso, divisor y aire —el patrón de Headline y Body—. Sale un tamaño de la escala (20). **b)** Subir el título de pantalla a 28: la razón pasa a 1,4 y la escala suma un paso. **c)** Dejarlo. *Recomendación: a)*, porque resta en vez de sumar y es lo que hacen las dos escalas de sistema. |
| **T10** | **El nombre de una variación (16 / 600) es más chico que su texto (18)** | C2, C3 | Llevarlo a 18 / 600, el mismo tamaño que su cuerpo. Si T9 va por a), el nombre de la variación y el título de sección quedan iguales en tamaño y peso: los distingue el divisor. |
| **T11** | **La procedencia se dibuja distinto en la receta (12, `fg-3`) y en el borrador (14, `fg-2`)** | C4, C5 | Unificar en 14 / `fg-2`. El 12 en `fg-3` es el texto más tenue de la app, y es un link. |
| **T12** | **Prosa secundaria en 14** —las notas de Ajustes, la leyenda de Estado— | C7 | **a)** Subirla a 16, que es el piso de §1. **b)** Escribir en §1 que el piso de 16 es para el cuerpo y que la nota secundaria de una sola oración puede ir en 14. *Recomendación: b)*: está dentro de los pisos de las dos plataformas y no compite con el contenido. |
| **T13** | **El editor tiene título en la segunda ficha y no en la primera** | C5 | **a)** Titular la primera «Datos». **b)** Sacarle el título a «Contenido». *Recomendación: a)*: el formulario es largo, y los títulos son lo que permite saber dónde se está al hacer scroll. |

### 4.4 Fuera de la tipografía

| # | Qué | Propuesta |
|---|---|---|
| **T14** | El encabezado del modo cocina tiene controles de 48 y 40 px, y §1 pide 64 | Llevarlo al backlog como pendiente propio. El sol de la pantalla encendida llegó con P10 (2026-09-12) y agravó algo que ya estaba: antes era una barra de 64 px. |

### Cuántos tamaños quedarían

Hoy la receta abierta usa seis: 24, 20, 18, 16, 14 y 12. Con T1, T9 a) y T11 quedarían
cuatro —24, 18, 16 y 14—, y el 12 sólo en contadores. Sigue siendo uno más de lo que
pide C1, y es el costo de tener un cuerpo de lectura (18) distinto del de interfaz (16),
que §1 decidió a propósito.
