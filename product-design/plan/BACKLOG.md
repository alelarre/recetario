# Backlog

**Versión:** 1.0
**Fecha:** 2026-09-07
**Estado:** Final — Hito 11

---

## Sobre este documento

Lo que quedó **explícitamente afuera** del diseño, con descripción suficiente para
retomarlo sin releer el proyecto entero. Nada de esto es un olvido: cada línea se
decidió dejar afuera y dice por qué.

Lo que quedó afuera del **producto** —y no del scope— está en la tabla de
`plan/decision-log.md`, que es otra cosa: ahí van las alternativas descartadas.

---

## 1. Decisiones abiertas

| Qué | Estado | Por qué no se resolvió |
|---|---|---|
| **Que el agente se embeba en la PWA** | Abierta desde el Hito 2. Es la decisión más grande sin resolver del proyecto. | El posicionamiento cierra sin ella: el agente está afuera de la app, no afuera del producto. Si algún día se embebe, el lugar exacto donde aparecería el botón ya está identificado —la pantalla de Borrador— y no cambia nada más. |
| **Una vía de hosting para las fotos de receta** | Abierta desde el Hito 5. | El campo `foto` existe y acepta una URL externa. Una vía propia sin backend obliga a pedir la imagen con el token y armar un object URL. No bloquea nada: el diseño no depende de la foto, y hoy ninguna de las ~60 recetas del Drive tiene una. |

## 2. Funcionalidad que no entró

| Qué | Por qué quedó afuera | Si alguna vez entra |
|---|---|---|
| **El planificador y la lista de compras (E06)** | J9 es el único job hipotético del proyecto, y el único que **cambiaría** la conducta en vez de acompañarla. El mercado tampoco ayuda: los cuatro competidores lo tienen. | Está diseñada y mockupeada. Su entrada vive en el Recetario, debajo de las categorías, y sacarla cuesta borrar un bloque y dos pantallas. |
| **Sugerencias para J5** — *"hace mucho que no hacés esto"* | La novedad se resuelve mostrando, no registrando. Y registrar obliga a guardar historial de uso, que el esquema no tiene. | Va **entre** la búsqueda y las categorías, nunca arriba. |
| **Un control de filtro visible sobre las listas** | Quedó a decidir "al ver la pantalla llena". Se vio en el Hito 9 y no hizo falta: los tags se aplican desde la receta. | — |
| **Ordenar dentro de una categoría** | Mismo caso. Con veinte recetas el alfabético alcanza; con cientos habría que volver a mirarlo. | — |
| **Historial de cocina, escalado de porciones, timers** | Ningún job los pide. | — |
| **Modo offline** | Decisión, no carencia: sin Drive no hay app, y una copia local es una segunda fuente de verdad. | — |
| **iOS** | Salió del alcance en el Hito 7. No tiene Share Target, y un equivalente declarado sin diseñar es una deuda que nadie implementa. | Sería un Atajo, con la misma pantalla de captura. |

## 3. Deuda técnica heredada

| Qué | Por qué importa |
|---|---|
| **Reindexar lee los `.md` de a uno**, sin paralelismo ni loteo | Con las sesenta recetas actuales no se nota. Con las mil del target, el reindexado tarda minutos — y por eso tiene barra de progreso y no se puede cancelar. Loteando o paralelizando, el problema se achica. |
| **La app no detecta sola un índice corrupto de todas las formas posibles** | Detecta que no puede leerlo y ofrece reindexar, que es la salida universal. Lo que no hace es diagnosticar el tipo de daño, y es deliberado. |

## 4. Lo que quedó sin evidencia

El **Hito 10 —Usability Testing— se salteó**, así que estas tres cosas están
decididas por razonamiento y no por observación. Son las primeras candidatas a
revisar cuando la app se use de verdad.

| Qué | Cómo se sabría |
|---|---|
| **La escala del modo cocina a 50 cm reales** | Cocinando una receta que no te sepas de memoria, con el teléfono apoyado. Si el cuerpo de 22 px no alcanza, sube; el sistema ya tiene el lugar donde cambiarlo. |
| **La densidad de la lista con cientos de recetas** | La categoría más grande del Drive hoy tiene veinte. A cientos puede hacer falta ordenar, o el filtro visible que quedó en §2. |
| **Si el vocabulario se entiende sin haberlo escrito uno mismo** | *Borrador*, *reindexar*, *está completa así como está*. Se prueba en diez minutos con cualquiera, sentado y sin cocinar nada. |

## 5. Documentos que quedaron viejos

| Documento | Qué le pasa |
|---|---|
| `product/strategy/personas.md` y `jtbd.md` | Del Hito 2. Mencionan "bandeja" y el Atajo de iOS, que el vocabulario y el alcance cambiaron después. **Se dejaron como estaban a propósito:** describen conducta observada, no decisiones vigentes. |
| `../docs/superpowers/plans/2026-09-01-recetario-v1.md` | Ya estaba viejo antes de este proyecto: describe la funcionalidad de fotos que después se eliminó. |
