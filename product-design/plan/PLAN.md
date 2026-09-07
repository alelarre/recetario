# Recetario — Plan de Diseño de Producto

> Para ejecutar este plan: abrí este archivo en una nueva sesión de Claude Code
> y pedile al agente que ejecute el siguiente hito pendiente.
> El agente tiene todo el contexto que necesita en este documento.

**Proyecto:** Recetario
**Descripción:** PWA personal de recetas, para un solo usuario, donde los datos viven en Google Drive como archivos `.md` que sobreviven a la app. El input principal no es el editor: son sesiones con agentes que reciben una fuente (PDF, foto, video, sitio web) y escriben el `.md`. Se usa en la cocina, de noche, desde el teléfono.
**Idioma de trabajo:** español rioplatense
**Mapa de documentos:** ver `../index.md`
**Encuadre del proyecto (qué está fijo y qué se rediseña):** ver `../CLAUDE.md`

---

## ⚙️ Protocolo de ejecución de hitos

Cada hito sigue este protocolo sin excepción. El agente NO puede saltear pasos
ni ejecutar hitos sin aprobación explícita del usuario.

**Paso 0 — Briefing:** Presentar un resumen del estado del plan y un briefing del hito al usuario. Preguntar si desea
proceder antes de hacer cualquier otra cosa.

**Paso 1 — Preguntas iniciales:** Hacer las preguntas específicas del hito de a una,
en orden. No avanzar hasta tener respuesta a cada pregunta.

**Paso 2 — Draft inicial:** Con las respuestas, crear el borrador de todos los
archivos de output del hito y preguntar:
> "Aquí están los borradores de [lista de documentos]. Por favor revisá antes de continuar."
Al recibir aprobación explícita del usuario, seguir con el Paso 3.

**Paso 3 — Revisión del agente:** Revisar todos los borradores del hito en conjunto
e identificar:
- Inconsistencias internas dentro de cada documento
- Inconsistencias entre documentos del mismo hito
- Información faltante o superficial
- Puntos ambiguos que un lector externo no podría resolver

Presentar un cuestionario unificado con los gaps detectados y pedir al usuario
que los complete.

**Paso 4 — Versión final y aprobación:** Incorporar respuestas del cuestionario,
generar la versión final de todos los documentos del hito, y pedir aprobación
explícita del conjunto:
> "Estos son los documentos finales del hito. ¿Los aprobás para cerrar este hito?"

⚠️ REGLA CRÍTICA: No avanzar al hito siguiente hasta recibir aprobación explícita
del usuario ("sí", "aprobado", "ok", etc.). El silencio no es aprobación.

📋 LOG TRANSVERSAL: `plan/decision-log.md` se actualiza en cualquier hito donde
se tome una decisión no obvia. No es un entregable exclusivo de ningún hito.

---

## 🧭 Regla de encuadre — leer antes de cualquier hito

Este proyecto rediseña el producto sobre una app que **ya está construida y
publicada**. Eso crea un riesgo permanente: tomar lo implementado como si fuera
lo decidido.

**Está fijo y no se rediscute:** la visión general (recetario personal, un
usuario, `.md` en Drive que sobreviven a la app, agentes como input principal) y
el stack (PWA estática en GitHub Pages, sin backend, Drive como fuente de
verdad, Sheet como índice derivado, scope OAuth `drive`), con sus restricciones
técnicas duras.

**Se rediseña desde cero:** todo lo demás. La taxonomía de 16 categorías, el
home de tiles con fotos, el detalle en columna sola, el tema oscuro único, la
paleta, el alcance del editor, y el planificador que nunca se diseñó.

Los documentos `../../CLAUDE.md` y
`../../docs/superpowers/specs/2026-08-31-recetario-design.md` se leen como
**estado del arte y restricción técnica**, nunca como definición de producto.
Cuando una decisión de este proyecto contradiga lo implementado, eso es un
resultado válido: se registra en `plan/decision-log.md` y sigue.

---

## 🤖 Agentes del proyecto

Cada hito indica el agente recomendado. Al iniciar el hito, el agente adopta
el modo indicado internalizando el prompt como su perspectiva de trabajo.

### Agente de Research Estratégico
*Aplicar en: Hito 1 — Research & Competitive Analysis*

Eres un analista de mercado y research estratégico. Tu rol es identificar el
landscape competitivo con rigor y objetividad, encontrar patrones no obvios, y
extraer insights diferenciadores accionables. Cuestionás suposiciones del
usuario, pedís evidencia concreta, y distinguís entre percepciones del fundador
y realidades del mercado. Sos sistemático en la comparación de competidores y
orientado a insights que informen decisiones de producto, no confirmaciones de
ideas previas.

### Agente de Visión de Producto
*Aplicar en: Hitos 2, 3 y 4 — Personas, JTBD, Principios de Producto, Product Vision*

Eres un estratega de producto con expertise en investigación de usuarios y
definición estratégica. Guiás el proceso de discovery asegurando que cada
decisión esté fundamentada en evidencia real. Cuestionás arquetipos genéricos
y pedís especificidad: no "profesionales", sino "contadores de pymes con 3-5
empleados". Conectás los insights de usuarios con las decisiones de producto, e
identificás inconsistencias entre personas, jobs y proposición de valor. Cuando
un principio es demasiado abstracto para arbitrar una decisión real, lo señalás.

### Agente de Diseño UX
*Aplicar en: Hitos 5, 6, 7, 8 y 9 — IA, User Flows, Wireframes, Specs, Brand Identity, Design System, Mockups*

Eres un especialista en UX/UI con expertise en arquitectura de información,
diseño de interacción y sistemas de diseño. Asegurás que la experiencia sea
coherente, intuitiva y alineada con los principios de producto definidos.
Cuestionás decisiones de diseño sin justificación, buscás coherencia entre capas
(IA → Flows → Wireframes → Design System → Mockups), y priorizás la usabilidad
sobre la estética. Usás los principios de producto para arbitrar decisiones de
diseño cuando hay tensión entre opciones. Distinguís entre lo que el usuario pide y lo que necesita.

### Agente de Validación
*Aplicar en: Hitos 10 y 11 — Usability Testing, Iteración final + Handoff*

Eres un especialista en investigación cualitativa y testing de usabilidad. Tu
rol es diseñar protocolos rigurosos, analizar hallazgos con objetividad, y
traducir insights en mejoras accionables. Priorizás la evidencia sobre la
opinión, distinguís entre problemas críticos y mejoras incrementales, y asegurás
que los hallazgos del testing se traduzcan en cambios concretos de diseño con
criterio de priorización explícito.

---

## Roadmap

```
Hito 1  → Research & Competitive Analysis          ✅ Completado
Hito 2  → Síntesis + Personas + JTBD               ✅ Completado
Hito 3  → Product Principles (sin VPC)             ✅ Completado
Hito 4  → Product Vision                           ✅ Completado
Hito 5  → IA + User Flows                          ✅ Completado
Hito 6  → Wireframes Lo-Fi + Validación            ✅ Completado
Hito 7  → Specs refinamiento                       ✅ Completado
Hito 8  → Brand Identity + Design System           ✅ Completado
Hito 9  → UI Mockups Hi-Fi                         ✅ Completado
Hito 10 → Usability Testing                        ⏭ Salteado
Hito 11 → Iteración final + Handoff                ✅ Completado
```

---

## 📦 Catálogo de artefactos

Referencia de inputs y outputs por hito. Antes de ejecutar un hito,
el agente DEBE leer todos los archivos de la columna Inputs.

| Hito | Inputs | Outputs |
| --- | --- | --- |
| Setup | Brief del proyecto, `../CLAUDE.md` del repo padre | `CLAUDE.md` (1.0), `product-vision.md` (1.0) |
| Hito 1 — Research & Competitive Analysis | `product-vision.md` (1.0) | `competitive-analysis.md` (1.0) |
| Hito 2 — Síntesis + Personas + JTBD | `competitive-analysis.md` (1.0), `product-vision.md` (1.0) | `personas.md` (1.0), `jtbd.md` (1.0) |
| Hito 3 — Product Principles | `personas.md` (1.0), `jtbd.md` (1.0) | `product-principles.md` (1.0) |
| Hito 4 — Product Vision | `competitive-analysis.md` (1.0), `personas.md` (1.0), `jtbd.md` (1.0), `product-principles.md` (1.0) | `product-vision.md` (2.0), `index.md` (secciones "El problema" y "La solución") |
| Hito 5 — IA + User Flows | `product-vision.md` (2.0), `personas.md` (1.0), `jtbd.md` (1.0), `product-principles.md` (1.0), [RecipeMD](https://recipemd.org/) y demás formatos del benchmark | `information-architecture.md` (1.0), `user-flows.md` (1.0), `specs-overview.md` (1.0), `E0N-*.md` (1.0), esquema del `.md` decidido en `decision-log.md` |
| Hito 6 — Wireframes Lo-Fi + Validación | `information-architecture.md` (1.0), `user-flows.md` (1.0), `specs-overview.md` (1.0), `product-principles.md` (1.0) | `wireframes.md` (1.0) |
| Hito 7 — Specs refinamiento | `E0N-*.md` (1.0), `wireframes.md` (1.0) | `E0N-*.md` (2.0), y las correcciones de consistencia que arrastró: `information-architecture.md` (1.2), `user-flows.md` (1.2), `wireframes.md` (1.1), `specs-overview.md` (1.1) |
| Hito 8 — Brand Identity + Design System | `product-vision.md` (2.0), `product-principles.md` (1.0), `wireframes.md` (1.1), `app.css` y `tokens.css` del repo padre como antecedente | `brand-identity.md` (1.0), `design-system.md` (1.0), y el vocabulario canónico propagado a specs, IA, flows y wireframes |
| Hito 9 — UI Mockups Hi-Fi | `wireframes.md` (1.2), `design-system.md` (1.0), `brand-identity.md` (1.0), `E0N-*.md` (2.0) | `ux/mockups/` (1.0) |
| Hito 10 — Usability Testing ⏭ | *(salteado — no produjo ningún archivo)* | — |
| Hito 11 — Iteración final + Handoff | ~~`usability-testing.md`~~ *(el Hito 10 se salteó)*, la revisión de los mockups por el usuario, y el catálogo completo del Hito 9 | `ux/mockups/` (2.0), `E0N-*.md` (3.0), `CLAUDE.md` (2.0), `plan/BACKLOG.md` |

---

## Hito 1: Research & Competitive Analysis

**Estado:** ✅ Completado — 2026-09-04
**Depende de:** Ninguna
**Archivos de output:** `research/competitive-analysis.md`
**Agente recomendado:** Agente de Research Estratégico
**Referencia:** `../index.md` — mapa completo de documentos del proyecto

### Briefing

En este hito se analiza el landscape competitivo de Recetario. El objetivo es
entender qué soluciones existen hoy para guardar y consultar recetas propias,
cómo se posicionan, qué les falta a sus usuarios, y dónde hay oportunidades
diferenciadas. Al terminar, se puede responder "¿por qué Recetario y no
[competidor X]?" con datos concretos, no percepciones.

Este hito tiene una particularidad: el competidor más relevante puede no ser una
app. Un documento de texto largo, una carpeta de PDFs y la app de notas del
teléfono son las soluciones que la gente realmente usa. Hay que analizarlas con
la misma seriedad que a un producto formal.

El agente puede hacer el research de forma autónoma o partir del input del
usuario — lo primero que se define es el modo de trabajo.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. ¿Preferís que haga el research de competidores de forma autónoma y después lo revisamos juntos, o preferís darme primero tu lista de competidores conocidos para partir de ahí?
   - **Si elige investigación autónoma:** el agente investiga el landscape usando la descripción del proyecto, presenta un listado inicial al usuario para validar ("¿Falta alguno? ¿Alguno no aplica?"), incorpora correcciones y procede.
   - **Si elige input previo:** continuar con las siguientes preguntas.
2. *(solo si input previo)* ¿Qué apps de recetas usaste o evaluaste, y por qué las dejaste?
3. ¿Cómo guardabas tus recetas antes de Recetario? Describí el sistema real, con sus formatos y su desorden — ese es el competidor a vencer.
4. De las alternativas que conocés, ¿alguna resuelve bien la lectura mientras cocinás? ¿Cuál y cómo?
5. ¿En qué aspecto diferencial apostás más fuerte con Recetario?

### Ejecución

Seguir el Protocolo de ejecución definido al inicio de este documento
(Pasos 0-4), usando las preguntas de arriba y los archivos de output de este hito.

### Entregables

- [ ] Análisis de 3-8 competidores en `research/competitive-analysis.md`, incluyendo al menos una alternativa no-producto (documento, notas, PDFs)
- [ ] Síntesis comparativa con vacíos e insights estratégicos
- [ ] Evaluación explícita de qué hace cada uno con la propiedad de los datos y con la lectura en cocina

### Criterio de completitud

Podés responder "¿por qué Recetario y no [competidor X]?" con datos concretos
del análisis, para cada competidor listado.

---

## Hito 2: Síntesis + Personas + JTBD

**Estado:** ✅ Completado — 2026-09-05
**Depende de:** Hito 1
**Archivos de output:** `product/strategy/personas.md`, `product/strategy/jtbd.md`
**Agente recomendado:** Agente de Visión de Producto
**Referencia:** `../index.md`

### Briefing

En este hito se define quién usa el producto y qué lo motiva. Recetario tiene un
solo usuario, así que la ficha de persona es corta — pero los **contextos de uso
son varios y muy distintos entre sí**, y son ellos los que van a arbitrar el
diseño: no es lo mismo estar cocinando de noche con las manos ocupadas que estar
sentado planificando la semana, ni que estar archivando una receta encontrada en
el teléfono.

Por eso el peso de este hito está en el JTBD, no en las personas. Al terminar,
existe una lista de jobs concretos, cada uno con su situación disparadora, que
después se usa para decidir qué entra en la navegación primaria y qué no.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. Describite como usuario del recetario: ¿con qué frecuencia cocinás, qué tipo de cocina, y cuánto de lo que cocinás sale de una receta escrita vs. de memoria?
2. ¿Hay alguien más que vaya a usar la app o a consultarla, aunque sea de vez en cuando? (alguien más en la casa, invitados, vos desde otra máquina)
3. Enumerá los momentos distintos en que abrirías la app. Para cada uno: dónde estás, qué tenés en la mano, cuánta atención le podés dar, y qué querés lograr.
4. ¿Cuál de esos momentos es el más frecuente? ¿Y cuál es el que más te frustra hoy?
5. ¿Qué pasa hoy cuando querés cocinar algo y no te acordás del nombre de la receta? Contá el recorrido real.
6. El planificador semanal y la lista de compras nunca se diseñaron. ¿Qué te imaginás haciendo con ellos, en qué momento de la semana, y qué problema te resolverían?
7. ¿Cuál es el insight central que justifica la existencia del producto? ¿Qué entendiste que las apps de recetas no entienden?

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

Con las respuestas anteriores, construir los borradores:

- **Personas:** una ficha por perfil real (probablemente una sola, más quizá un segundo perfil consultante). Perfil concreto, contexto, motivación principal, rol en el sistema. Si aparece un segundo usuario, no inflarlo: registrar honestamente su peso.
- **Contextos de uso:** documentar cada momento de la pregunta 3 como un contexto con nombre propio, condiciones físicas (manos, luz, atención, distancia a la pantalla) y restricciones que impone al diseño. Esta sección es la de mayor valor del hito.
- **JTBD:** formular cada job en formato "Cuando [situación] quiero [motivación] para [resultado]". Cubrir los jobs del recetario y los del planificador/lista de compras. Marcar cuáles son frecuentes y cuáles raros pero críticos.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [ ] Personas con fichas completas y contextos de uso en `product/strategy/personas.md`
- [ ] JTBD con jobs por contexto y jobs transversales en `product/strategy/jtbd.md`

### Criterio de completitud

Para cada job podés responder: en qué situación se dispara, con qué frecuencia,
y qué pasa hoy si el producto no lo resuelve.

---

## Hito 3: Product Principles

**Estado:** ✅ Completado — 2026-09-05
**Depende de:** Hito 2
**Archivos de output:** `product/strategy/product-principles.md`
**Agente recomendado:** Agente de Visión de Producto
**Referencia:** `../index.md`

> El Value Proposition Canvas queda fuera de este proyecto: en un producto de un
> solo usuario que ya decidió usarlo, mapear pains y gains para justificar la
> elección es ceremonia. El hito produce únicamente los principios.

### Briefing

En este hito se definen los principios que van a gobernar las decisiones de
diseño del resto del proyecto. Los principios no son valores abstractos: son
**árbitros de tensiones reales**. Si un principio no puede desempatar una
decisión concreta —qué va en la navegación primaria, cuánta información entra en
la pantalla de cocina, si el editor permite componer o solo corregir— es
demasiado genérico y hay que reescribirlo.

Este hito importa especialmente acá, porque los Hitos 5 y 6 van a reabrir
decisiones de UX que la implementación actual ya tomó. Sin principios escritos,
esas discusiones se resuelven por gusto y son irrepetibles.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. Mirando los contextos de uso del Hito 2: ¿cuál es la tensión de diseño que más veces vas a tener que desempatar? (ejemplos posibles: densidad vs. legibilidad a distancia, velocidad de captura vs. estructura del dato, potencia del editor vs. simplicidad)
2. ¿Qué es lo que Recetario nunca debería sacrificar, ni aunque hiciera la app más cómoda?
3. Los `.md` en Drive son la fuente de verdad y los escriben agentes por fuera. ¿Qué obliga eso a la app a asumir sobre los datos que lee? ¿Qué hace la app cuando un `.md` no cumple lo que esperaba?
4. Cuando estés cocinando y algo salga mal en la app, ¿qué comportamiento preferís: que insista, que se calle, o que te avise y te deje seguir?
5. ¿Hay algo que la implementación actual hace y que te molesta cada vez que la usás? Nombralo — probablemente ahí hay un principio que falta.

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

Redactar 4-6 principios. Cada uno debe tener: la **tensión concreta** que
resuelve (nombrada como "X vs. Y"), **cómo se aplica en la práctica**, y **un
ejemplo de decisión real que desempataría** — sacado preferentemente de una
decisión que este proyecto va a tener que tomar en el Hito 5 o 6. El valor
innegociable de la pregunta 2 debe convertirse en al menos un principio.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [ ] 4-6 principios en `product/strategy/product-principles.md`, cada uno con tensión, aplicación práctica y ejemplo de arbitraje

### Criterio de completitud

Tomá tres decisiones abiertas de este proyecto (por ejemplo: si la categoría
sigue siendo la única clasificación, si el planificador entra en la navegación
primaria, cuánto muestra la pantalla de cocina) y verificá que los principios
las desempatan. Si no lo hacen, faltan principios o los que hay son demasiado
abstractos.

---

## Hito 4: Product Vision

**Estado:** ✅ Completado — 2026-09-05
**Depende de:** Hito 3
**Archivos de output:** `product/strategy/product-vision.md` (v2.0), `../index.md` (secciones "El problema" y "La solución")
**Agente recomendado:** Agente de Visión de Producto
**Referencia:** `../index.md`

### Briefing

En este hito se refina la hipótesis con la que arrancó el proyecto, incorporando
todo lo aprendido. La v1.0 del `product-vision.md` fue una hipótesis escrita
antes de research; esta versión es una síntesis validada. Al terminar existe una
fuente de verdad sobre qué es el producto, para quién, por qué existe y qué
decisiones estratégicas lo condicionan — el documento al que se vuelve para
arbitrar cualquier discusión posterior.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. Habiendo hecho el research y definido los jobs: ¿el insight central de la v1.0 sigue siendo válido, o lo reformularías?
2. ¿El problem statement de la v1.0 refleja lo que apareció en los contextos de uso, o quedó corto?
3. Además de las dimensiones ya fijas (usuarios, propiedad de los datos, plataforma, persistencia, permisos, input de contenido), ¿qué otras decisiones estratégicas condicionan el producto y todavía no están escritas?
4. Mirando los diferenciadores del research: ¿qué confirmó y qué contradijo tu hipótesis original?
5. ¿Aparecieron entidades del producto que no estaban en la v1.0? En particular, ¿qué entidades traen el planificador y la lista de compras, y cómo se persisten dado que el stack es Drive + Sheet?
6. La v1.0 dice que la categoría es "hoy la única clasificación y es exclusiva", y marca esa forma como abierta. Con los jobs a la vista: ¿sigue siendo la clasificación correcta?

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

Con esos documentos y las respuestas anteriores, construir la v2.0:

- Actualizar la visión y el insight central con las reformulaciones del usuario.
- Completar §2 Diferenciadores con evidencia concreta del `competitive-analysis.md`, un competidor por sección.
- Completar la tabla de decisiones estratégicas con las dimensiones nuevas. Las dimensiones fijas del encuadre se mantienen tal cual.
- Reescribir el problem statement con lo aprendido de los contextos de uso.
- Completar §4 Entidades con los sustantivos del sistema, incluidos los del planificador, y su matriz de relaciones.
- Marcar el documento con `**Estado:** v2.0 — Validada post-research`.
- Completar las secciones "El problema" y "La solución" de `../index.md`, que hasta ahora son placeholders.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [ ] `product/strategy/product-vision.md` v2.0 con todas las secciones completas y ningún `_(completar)_`
- [ ] `../index.md` con "El problema" y "La solución" escritos

### Criterio de completitud

Alguien que no participó del proyecto puede leer solo ese documento y responder:
qué es el producto, para quién, por qué existe, y qué decisiones estratégicas lo
condicionan.

---

## Hito 5: IA + User Flows

**Estado:** ✅ Completado — 2026-09-06
**Depende de:** Hito 4
**Archivos de output:** `ux/information-architecture.md`, `ux/user-flows.md`, `product/specs/specs-overview.md`, `product/specs/E0N-*.md`
**Agente recomendado:** Agente de Diseño UX
**Referencia:** `../index.md`

### Briefing

En este hito se define la arquitectura del producto: cómo se organiza la
información, qué pantallas existen y cómo se conectan. También se documentan los
flujos críticos que cada contexto de uso recorre para cumplir su job. Al
terminar se puede trazar el camino completo desde que la app se abre hasta que
el job está cumplido, para cada job del Hito 2.

Este es el hito donde se reabre en serio lo implementado. La taxonomía de
categorías, el home, la estructura del detalle y la existencia misma de una
barra de navegación son decisiones de este hito, no herencias. Cada vez que la
decisión coincida con lo implementado, decir por qué; cada vez que difiera,
registrarlo en `plan/decision-log.md`.

Este hito también genera el esqueleto de las specs por épica.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. Con los jobs a la vista: ¿cuáles son los módulos o secciones principales del producto? ¿Cuántos merecen estar en la navegación primaria?
2. ¿Cuál es la pantalla a la que volvés más seguido, la que debería ser el punto de entrada?
3. ¿Cuál es el flujo más crítico, el que si no funciona bien vuelve inútil a toda la app?
4. Sobre la clasificación de recetas: ¿la categoría única alcanza, o los jobs piden algo más (tags, búsqueda, filtros, colecciones)? ¿Qué pasa con una receta que cae en dos lados?
5. ¿Cómo entra al producto una receta escrita por un agente? ¿La app tiene que hacer algo, o simplemente aparece? ¿Necesitás enterarte de que llegó?
6. Para el planificador: ¿qué es exactamente lo que se planifica, con qué granularidad, y cómo se convierte en lista de compras?
7. ¿Hay restricciones de navegación que ya tenés claras? (profundidad máxima, alcance del pulgar, qué tiene que estar a un toque)

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

- **Inventario de pantallas** en tabla: nombre / propósito / contexto de uso principal / job que sirve. Las pantallas que el usuario no nombró pero que la estructura exige se marcan con `[inferida]`.
- **Modelo de navegación:** qué es primario y qué secundario, con el criterio explícito. Un job frecuente del Hito 2 que quede a más de dos toques necesita justificación escrita.
- **Benchmark de formatos de receta en texto plano** (ver el recuadro de abajo) y, con su resultado, definición del esquema del `.md`.
- **Entidades y su ciclo de vida**, cerrando lo que quedó abierto en `product-vision.md` §4.
- **Flujos críticos** en texto estructurado (flechas, puntos de decisión ⚑, estados). Cada flujo mapea a un job del JTBD; si no mapea a ninguno, marcarlo `[revisar necesidad]`. Incluir siempre: el primer arranque con el consentimiento de Google, y el flujo de "una receta nueva apareció en Drive escrita por un agente".
- **Estados degradados** como flujos de primera clase, no como notas al pie: sin conexión, índice corrupto, `.md` que no cumple el esquema. El stack los hace inevitables.
- `product/specs/specs-overview.md`: índice de épicas, una por módulo principal, con nombre, descripción corta y resumen de sus features. No listar features en detalle.
- `product/specs/E0N-NombreEpica.md` por épica: descripción de la épica y una descripción por feature. Sin acceptance criteria ni edge cases — eso es el Hito 7.

Seguir con el Paso 2 del protocolo de ejecución.

### 📐 Benchmark de formatos de receta — tarea previa del hito

Antes de definir la entidad Receta hay que decidir el **formato del archivo**,
porque es su representación: qué campos existen determina qué puede mostrar la
UI, qué se puede filtrar y qué puede generar una lista de compras.

Hacer un benchmark de los formatos existentes, con **atención especial a
[RecipeMD](https://recipemd.org/)**, que es markdown con una estructura mínima
acordada. Otros a mirar: Cooklang, `schema.org/Recipe`, el microformato
h-recipe, Open Recipe Format, y el esquema propio que hoy usa la app
(frontmatter de seis claves, `../../docs/superpowers/specs/2026-08-31-recetario-design.md` §3.2).

Criterios de evaluación, en este orden:

1. **¿El archivo sigue siendo legible y editable a mano?** Es la premisa del producto.
2. **¿Un agente puede escribirlo bien sin ambigüedad?** Es la ruta de entrada real.
3. **¿Alcanza para lo que la UI necesita mostrar y filtrar?**
4. **¿Alcanza para generar una lista de compras desde los ingredientes?** — la respuesta acá es la que más tensiona el criterio 1.
5. **¿Hay herramientas o parsers que ya lo lean?** Interoperabilidad real, no teórica.

> Esto reabre dos decisiones que el `CLAUDE.md` del repo padre daba por
> cerradas: Cooklang descartado para el cuerpo, y `schema.org/Recipe`
> descartado como modelo de datos. Es consistente con el encuadre — el esquema
> del `.md` es decisión de producto, no restricción de plataforma. Registrar el
> resultado en `plan/decision-log.md`, se confirme o se cambie lo que hay.

### Entregables

- [ ] Benchmark de formatos de receta, con RecipeMD evaluado, y el esquema del `.md` decidido
- [ ] IA completa: entidades, inventario de pantallas, modelo de navegación, decisiones estructurales
- [ ] Flujos críticos diagramados, incluidos los estados degradados
- [ ] `product/specs/specs-overview.md` — índice de épicas
- [ ] Un `product/specs/E0N-NombreEpica.md` por épica
- [ ] Divergencias con la implementación actual registradas en `plan/decision-log.md`

### Criterio de completitud

Podés trazar, para cada job del `jtbd.md`, el camino completo desde que la app se
abre hasta que el job está cumplido, nombrando cada pantalla del recorrido.

---

## Hito 6: Wireframes Lo-Fi + Validación

**Estado:** ✅ Completado — 2026-09-06
**Depende de:** Hito 5
**Archivos de output:** `ux/wireframes.md`
**Agente recomendado:** Agente de Diseño UX
**Referencia:** `../index.md`

### Briefing

En este hito se define la estructura visual de cada pantalla: qué elementos
aparecen, en qué jerarquía y cómo se relacionan. No es diseño visual, es
estructura: el sistema visual llega recién en el Hito 8.

Los wireframes son el input directo de los mockups Hi-Fi, así que tienen que ser
explícitos sobre jerarquía, densidad y comportamiento — todo lo que quede
ambiguo acá se va a resolver por gusto en el Hito 9. Toda decisión de layout va
anotada con su razón.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. ¿Cuáles son las pantallas más complejas por cantidad de información a mostrar?
2. ¿Qué componentes se repiten entre pantallas? (listas de recetas, tarjetas, formularios, la fila de ingredientes)
3. La pantalla de cocina es el caso extremo: teléfono apoyado a cierta distancia, manos ocupadas, lectura interrumpida. ¿A qué distancia lo apoyás y qué necesitás ver sin tocar nada?
4. ¿Preferís interfaces densas —más información por pantalla, menos scroll— o espaciadas?
5. ¿Hay patrones de layout que querés evitar explícitamente? (nombrá cualquier cosa de la implementación actual que no funcione)
6. ¿Qué pantallas creés que van a necesitar más de una variante de layout para decidir? (candidatas a comparar en el Hito 9)

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

- Documentar los **componentes base**: anatomía (qué elementos lo componen), variantes y estados, y en qué pantallas aparece cada uno.
- Wireframear **cada pantalla del inventario de IA** en texto estructurado, mostrando jerarquía, posición y zonas de contenido. Priorizar las complejas y la pantalla de cocina.
- Incluir los **estados no felices** de cada pantalla: vacía, cargando, error, sin conexión. Un estado que no se wireframea acá no va a tener mockup en el Hito 9.
- Anotar junto a cada decisión de layout **por qué** esa estructura, arbitrando con los principios del Hito 3 cuando haya tensión.
- Registrar en `plan/decision-log.md` lo no obvio y lo que difiere de la implementación actual.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [ ] Componentes base con anatomía, variantes y estados
- [ ] Todas las pantallas del inventario wireframeadas, con sus estados no felices
- [ ] Decisiones de layout anotadas con su racional

### Criterio de completitud

Se puede empezar el diseño visual de cualquier pantalla sin necesitar aclarar su
estructura, su jerarquía ni su comportamiento.

---

## Hito 7: Specs refinamiento

**Estado:** ✅ Completado — 2026-09-06
**Depende de:** Hito 6
**Archivos de output:** `product/specs/E0N-*.md` (v2.0)
**Agente recomendado:** Agente de Diseño UX
**Referencia:** `../index.md`

### Briefing

Los archivos `product/specs/E0N-*.md` del Hito 5 tienen la descripción de cada
épica y sus features, pero sin comportamiento detallado. Este hito parte cada
feature en unidades más chicas —capacidades— que aportan valor por sí mismas, y
a cada una le agrega, cuando aplique: acceptance criteria, edge cases, estados
de error y notas técnicas. Al terminar, cualquier feature se puede implementar
sin ambigüedad funcional.

En este producto los edge cases no son un anexo: el contenido lo escriben
agentes por fuera de la app, el índice es un cache que puede quedar
desincronizado, y no hay backend que arbitre. Buena parte del valor del hito
está ahí.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. Para cada épica: ¿hay features que no quedaron capturadas o que cambiaron al ver los wireframes?
2. ¿Cuáles son los estados de error más críticos? (sesión de Google vencida, sin conexión a mitad de un guardado, índice desincronizado, `.md` que no cumple el esquema)
3. ¿Hay lógica de negocio no obvia que alguien necesita entender para implementar bien? (cómo se resuelve un conflicto entre el `.md` y el índice, qué gana)
4. ¿Qué restricciones técnicas condicionan el comportamiento de alguna feature? (cuotas de la API de Sheets, el reemplazo completo de archivo en Drive, el debounce de escritura)
5. ¿Qué tiene que pasar cuando un agente escribe un `.md` mientras la app está abierta?

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

Para cada épica, actualizar su `E0N-*.md`: partir features en capacidades,
agregar acceptance criteria como lista de condiciones verificables, edge cases y
estados de error, y notas técnicas donde el usuario las mencionó. Verificar que
cada capacidad mapea a un job del `jtbd.md`; si no mapea a ninguno, marcarla
`[revisar prioridad]`.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [x] `product/specs/E0N-*.md` actualizados con capacidades, acceptance criteria y edge cases
- [x] Cada capacidad trazada a un job, o marcada para revisión — las 90 capacidades mapean a un job o a una regla transversal; ninguna quedó `[revisar prioridad]`
- [x] Siete reglas transversales en `E05-Cimientos.md`, referenciadas por las otras cinco épicas
- [x] Correcciones de consistencia: `information-architecture.md` (1.2), `user-flows.md` (1.2), `wireframes.md` (1.1), `specs-overview.md` (1.1), `decision-log.md` (1.1, con 13 decisiones nuevas)

### Criterio de completitud

Alguien puede implementar cualquier capacidad sin hacer una sola pregunta sobre
comportamiento esperado, incluidos los casos de error.

---

## Hito 8: Brand Identity + Design System

**Estado:** ✅ Completado — 2026-09-06
**Depende de:** Hito 7
**Archivos de output:** `ux/brand-identity.md`, `ux/design-system.md`
**Agente recomendado:** Agente de Diseño UX
**Referencia:** `../index.md`

### Briefing

En este hito se define la identidad visual y de comunicación del producto, y se
construye el sistema de diseño que la implementa. El objetivo es que se pueda
implementar cualquier pantalla usando solo el design system, sin tomar
decisiones visuales por el camino.

En Recetario el sistema visual carga más peso que en un producto común, por dos
razones. Una: el contexto de uso es hostil —cocina, de noche, teléfono apoyado a
distancia, manos ocupadas— así que contraste, tamaño tipográfico y área táctil
son decisiones funcionales, no estéticas. Dos: hoy existe un `app.css`
implementado que es la única especificación visual del producto; este hito
produce lo que lo reemplaza.

La identidad se define desde cero. El tema oscuro único, la paleta de 16
categorías con 14° de separación y las fotos de categoría que hay hoy entran
como **antecedente a evaluar**, no como lineamiento a respetar: si el diseño
nuevo llega a las mismas conclusiones, que sea por su propio razonamiento y
quede escrito por qué.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. ¿Qué personalidad debería transmitir Recetario? Elegí 3-5 adjetivos específicos.
2. ¿Hay productos —de este u otro rubro— cuyo diseño admirás? ¿Qué te gusta de ellos concretamente?
3. ¿Hay estéticas que querés evitar? (la app de recetas con foto a sangre completa, el look de app de productividad, lo que sea)
4. ¿Qué tono usa el producto cuando te habla? Pensá sobre todo en los mensajes de error: cuando falla el guardado o se cae la conexión, ¿qué te dice y cómo?
5. Sobre el modo oscuro: ¿el uso es siempre de noche, o hay momentos de día que también importan? ¿Un tema solo o dos?
6. ¿Las categorías necesitan identidad visual propia (color, foto, ícono) o alcanza con el nombre? Si necesitan, ¿para qué exactamente — reconocerlas rápido, distinguirlas en una lista, otra cosa?
7. ¿El producto tiene términos propios que hay que usar de forma consistente? ("receta", "categoría", "variación", "nota", y lo que traiga el planificador)

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

- **Brand identity:** traducir los adjetivos en una dirección visual concreta; tabla de tono y voz por contexto (con ejemplos correctos e incorrectos, incluidos los mensajes de error y los estados vacíos); vocabulario canónico del producto.
- **Design system:** tokens de color (con la decisión sobre uno o dos temas resuelta y escrita), tipografía con escala, espaciado base, radios, elevación y motion. Cada token con su razón cuando no sea obvia.
- **Legibilidad en contexto de cocina como restricción explícita:** tamaño mínimo de cuerpo, contraste mínimo, área táctil mínima, todo con número. Esto arbitra el resto del sistema.
- **Sistema de identidad de categorías** resuelto según la respuesta 6, con el criterio de cómo se agrega una categoría nueva sin romper el sistema.
- **Componentes core:** anatomía y estados de los componentes del Hito 6, ahora con tokens aplicados.
- Registrar en `plan/decision-log.md` cada punto donde el diseño nuevo coincida o difiera del `app.css` actual, con el racional.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [x] Brand identity completa en `ux/brand-identity.md`: cinco adjetivos con lo que descarta cada uno, dirección visual, tono de voz por contexto con ejemplos correctos e incorrectos, y vocabulario canónico de 14 términos
- [x] Design system en `ux/design-system.md`: tokens con su contraste medido, paleta de 15 categorías, tipografía, espaciado, iconografía, motion y 14 componentes core
- [x] Restricciones de legibilidad con número, en §1, y arbitrando el resto del sistema
- [x] Divergencias con `app.css` registradas en `plan/decision-log.md` — seis: neutros cálidos, acento propio, una sola tipografía, área táctil de 48 px, la paleta rehecha y la escala de cocina
- [x] Las dos deudas heredadas, saldadas: el placeholder de foto (§6.2) y la escala del modo cocina (§3.3)
- [x] El vocabulario nuevo propagado a specs, IA, flows y wireframes; `E01` renombrado a `E01-CapturaYBorradores.md`

### Criterio de completitud

Se puede implementar cualquier pantalla usando solo el design system, sin tomar
ni una decisión visual propia — incluidos los estados de error y los vacíos.

---

## Hito 9: UI Mockups Hi-Fi

**Estado:** ✅ Completado — 2026-09-06
**Depende de:** Hito 8
**Archivos de output:** `ux/mockups/`
**Agente recomendado:** Agente de Diseño UX
**Referencia:** `../index.md`

### Briefing

En este hito se crean los mockups de alta fidelidad de las pantallas
prioritarias, aplicando el design system del Hito 8. El objetivo es tener
pantallas implementables directamente, sin decisiones visuales adicionales.

Como el producto tiene un solo usuario y no hay stakeholders a los que
convencer, el criterio de prioridad no es "qué pantalla luce mejor" sino **qué
pantalla se usa más y cuál es más difícil de acertar**. La pantalla de cocina es
la candidata obvia a las dos cosas.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. ¿Cuáles son las 5-8 pantallas más importantes a mockupear primero?
2. Mobile-first, asumo, pero: ¿usás la app desde una computadora alguna vez? ¿Para qué?
3. ¿Qué estados de UI son críticos de definir además de los felices? (vacío inicial sin ninguna receta, error de sesión, sin conexión, cargando, receta que no cumple el esquema)
4. De las pantallas de la lista: ¿alguna necesita ver dos variantes comparadas antes de decidir?
5. ¿Hay micro-interacciones que son parte del valor y no adorno? (marcar un paso como hecho mientras cocinás, tachar un ítem de la lista de compras)
6. ¿Con qué contenido real querés ver los mockups? Nombrá recetas concretas de tu Drive, incluida alguna larga y alguna incompleta.

### Armado del borrador

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

- Armar el **plan de mockups**: lista priorizada de pantallas, breakpoint de inicio, estados a incluir por pantalla, y cuáles se hacen en dos variantes para comparar.
- Para cada pantalla, generar un archivo en `ux/mockups/` como **HTML+CSS autocontenido** que aplique los tokens del design system literalmente. Esto no es decorativo: si el mockup se escribe con los tokens reales, es también la validación de que el design system alcanza, y el paso a implementación es directo.
- Poblar los mockups con **contenido real** de las recetas nombradas en la pregunta 6, incluidos los casos incómodos: la receta larguísima, la que casi no tiene datos, el nombre que no entra en una línea.
- Mockupear los estados no felices, no solo los felices.
- Versión mobile (390px) de todo; desktop (1280px) solo si la respuesta 2 lo justifica.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [x] Trece pantallas en `ux/mockups/`, con `tokens.css` como traducción literal del design system
- [x] Dos variantes en Receta, Recetario y Lista de categoría; 1280 px en Recetario, Editor y Borradores
- [x] Estados no felices: los dos pedidos, más seis que caían de paso
- [x] Contenido real leído del Drive, con los casos extremos: título de 86 caracteres, receta mínima, ingredientes sin separador, ninguna foto
- [x] Cuatro huecos del design system corregidos y tres reglas precisadas — el detalle en `ux/mockups/README.md`
- [x] Hallazgo mayor: **la convención de ingredientes no la cumplía ninguna receta**, y se reescribió contra el contenido real

### Criterio de completitud

Las pantallas son implementables directamente, y ningún mockup necesitó un valor
visual que no estuviera en el design system.


---

## Hito 10: Usability Testing

**Estado:** ⏭ Salteado — 2026-09-06, por decisión del usuario tras revisar los
mockups del Hito 9. No hay prototipo navegable ni sesiones. Ver la fila del
2026-09-06 en `decision-log.md`: el Hito 11 pierde su input principal y se apoya
en la revisión de los mockups en vez de en hallazgos.
**Depende de:** Hito 7
**Archivos de output:** `research/usability-testing/usability-testing-prototype.html`, `research/usability-testing/usability-testing.md`
**Depende de:** Hito 9
**Agente recomendado:** Agente de Validación
**Referencia:** `../index.md`

### Briefing

En este hito se valida que el producto es usable. Tiene dos momentos separados
por las sesiones: en el Paso A se genera un prototipo navegable y se diseña el
protocolo; en el Paso B —después de las sesiones— se documentan y sintetizan los
hallazgos.

La particularidad acá es que el producto tiene un solo usuario, que sos vos: el
testing con terceros mide comprensibilidad, no adopción. Vale más una sesión en
el contexto real —el teléfono, en la cocina, cocinando de verdad una receta que
no te sabés de memoria— que cinco sesiones sentado frente a una computadora. El
prototipo sale de los mockups del Hito 9, así que la prueba incluye la capa
visual: si el texto no se lee a la distancia real, este es el hito donde se
descubre.

---

### Paso A — Prototipo y protocolo

**Preguntas iniciales (Paso A):**

1. ¿Cuáles son las 3-5 pantallas o flujos más importantes a incluir en el prototipo?
2. ¿Vas a probarlo vos en contexto real, con terceros, o las dos cosas?
3. ¿Cuáles son las 3 tareas más importantes a testear?
4. Para cada tarea: ¿cuál es el criterio de éxito, medible? (se completa sola, en menos de X toques, sin volver atrás)
5. ¿Hay hipótesis de diseño concretas que querés validar o refutar? En particular, sobre lo que este proyecto cambió respecto de la implementación actual.
6. Si probás en contexto real: ¿qué receta vas a cocinar y cuándo?

**Armado del borrador (Paso A):**

Leer los archivos de la columna Inputs del catálogo de artefactos para este hito.

- Generar `research/usability-testing/usability-testing-prototype.html`: archivo autocontenido (HTML + CSS + JS inline) que conecte las pantallas prioritarias con navegación real, componiendo los mockups del Hito 9 con los tokens del design system aplicados. Incluir los estados no felices mockupeados.
- Redactar el protocolo en `research/usability-testing/usability-testing.md`: objetivo, perfil de participantes, guía de tareas con instrucciones palabra por palabra (sin revelar el flujo esperado), preguntas de seguimiento, criterios de éxito medibles e hipótesis falsables.

Seguir con el Paso 2 del protocolo de ejecución.

⏸ **PAUSA obligatoria:** Al cerrar el Paso A, presentar el prototipo y el
protocolo. El Paso B se inicia únicamente cuando el usuario confirma que
completó las sesiones y trae los hallazgos.

---

### Paso B — Documentación de hallazgos

**Preguntas iniciales (Paso B):**

1. ¿Cuántas sesiones hiciste, con quién y en qué contexto?
2. ¿Cuáles fueron los problemas más recurrentes o severos?
3. ¿Qué tareas se completaron sin fricción y cuáles generaron confusión o abandono?
4. ¿Las hipótesis se confirmaron, se refutaron o quedaron parciales?
5. ¿Apareció algo inesperado que valga la pena documentar?

**Armado del borrador (Paso B):**

Completar `research/usability-testing/usability-testing.md`: tabla de hallazgos
(tarea / comportamiento observado / frecuencia N/N / severidad), patrones
transversales, resultado de cada hipótesis con su evidencia, resumen ejecutivo
con los 3-5 hallazgos más importantes, e iteraciones priorizadas por impacto y
vinculadas a la tarea donde surgieron.

Seguir con el Paso 2 del protocolo de ejecución.

---

### Entregables

- [ ] Prototipo navegable en `research/usability-testing/usability-testing-prototype.html`
- [ ] Protocolo en `research/usability-testing/usability-testing.md`
- [ ] Hallazgos con frecuencia y severidad
- [ ] Iteraciones priorizadas, replicadas en `plan/BACKLOG.md`

### Criterio de completitud

Podés decir qué cambiarías en una segunda ronda, con evidencia concreta de las
sesiones y no con impresiones.

---

## Hito 11: Iteración final + Handoff

**Estado:** ✅ Completado — 2026-09-07. **El proyecto está terminado.**
**Depende de:** Hito 10
**Archivos de output:** `ux/mockups/` (v2.0), `ux/design-system.md` (v2.0), `product/specs/E0N-*.md` (v3.0), `CLAUDE.md` (v2.0), `plan/BACKLOG.md`, `plan/decision-log.md`
**Agente recomendado:** Agente de Validación
**Referencia:** `../index.md`

### Briefing

En este hito se incorporan los hallazgos del testing en una iteración final y se
prepara la documentación para implementación. El handoff acá tiene un
destinatario particular: la app **ya existe**, así que el entregable no es solo
"cómo construirlo" sino **qué cambia respecto de lo que hay**. Un plan de
migración desde la implementación actual hacia el diseño nuevo es parte del
handoff, no un extra.

### Preguntas iniciales

Hacer de a una, en orden. No continuar sin respuesta:

1. ¿Cuáles fueron los hallazgos del testing con mayor impacto en el diseño?
2. ¿Qué decisiones de diseño no obvias necesita entender quien implemente?
3. La implementación existente es TypeScript estricto + Vite, sin framework. ¿Se mantiene? ¿Hay restricciones técnicas que obliguen a ajustar algo del diseño?
4. ¿Qué inconsistencias detectaste en el design system al mockupear y al testear?
5. ¿Qué queda fuera de esta iteración y va al backlog?
6. ¿El rediseño se implementa de una o por partes? Si es por partes, ¿cuál va primero?

### Armado del borrador

- Actualizar `ux/mockups/`, `ux/design-system.md` y los `E0N-*.md` con los cambios derivados de cada hallazgo de alto impacto, indicando qué hallazgo motivó cada cambio.
- Completar `plan/decision-log.md` con las decisiones no obvias: decisión, alternativas descartadas y racional. Priorizar las que van a generar preguntas durante la implementación.
- Escribir el **delta contra la implementación actual**: qué se mantiene, qué cambia, qué se elimina, qué es nuevo. Es la sección que hace utilizable a todo el resto.
- Agregar a `plan/BACKLOG.md` lo fuera de scope, con descripción suficiente para retomarlo.
- Actualizar `CLAUDE.md` al estado final: hitos completados, estado del proyecto y referencias a los documentos del handoff.

Seguir con el Paso 2 del protocolo de ejecución.

### Entregables

- [x] Mockups 2.0 con las tres variantes resueltas; design system 2.0 y specs 3.0
- [x] Delta explícito contra la implementación actual, en `plan/delta-implementacion.md`
- [x] `plan/decision-log.md` completo: 89 decisiones
- [x] `plan/BACKLOG.md` escrito: decisiones abiertas, funcionalidad fuera de scope, deuda técnica y lo que quedó sin evidencia
- [x] `CLAUDE.md` v2.0 al estado final, orientado a quien implementa
- [x] Dos cambios pedidos en la revisión: la tipografía pasa a la del sistema, y se elimina la cola de escrituras a Drive

### Criterio de completitud

Alguien puede empezar a implementar el rediseño sobre el código existente sin
hacer una sola pregunta sobre intención de diseño, sabiendo exactamente qué
archivos del producto actual quedan obsoletos y qué reemplaza a `app.css`.
