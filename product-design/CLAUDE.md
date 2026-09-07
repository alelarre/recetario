# Recetario — Diseño de Producto

**Versión:** 2.0 · **Estado: proyecto terminado.** Once hitos, uno salteado.

---

## Qué es esto

Recetario es una PWA personal de recetas, para un solo usuario, donde los datos
viven en Google Drive como archivos `.md` que sobreviven a la app. El input
principal no es el editor: son sesiones con agentes que reciben una fuente (PDF,
foto, video, sitio web), extraen la receta y escriben el `.md`. Se usa en la
cocina, de noche, desde el teléfono.

**Este directorio contiene el diseño de producto**, no la implementación. La app
ya existe y está publicada; lo que nunca existió era la capa de producto:
personas, jobs, principios, arquitectura de información, flujos y specs. Este
proyecto la escribió desde cero, y terminó.

---

## Si venís a implementar

**Empezá por [`plan/delta-implementacion.md`](plan/delta-implementacion.md).** No
por acá y no por los specs: ese documento tiene las ocho decisiones que hay que
entender antes de escribir la primera línea, y después el delta archivo por
archivo contra la app que ya existe — qué se mantiene, qué cambia, qué se
elimina y qué es nuevo.

Después, en este orden:

| Para saber | Leé |
|---|---|
| Qué tiene que hacer cada cosa, al detalle | [`product/specs/`](product/specs/) — seis épicas, 91 capacidades con criterios de aceptación y edge cases. Las **reglas transversales** están en `E05-Cimientos.md` §Reglas y valen para las seis. |
| Cómo se ve | [`ux/design-system.md`](ux/design-system.md), y [`ux/mockups/`](ux/mockups/) para verlo funcionando. `tokens.css` es el sistema traducido a CSS. |
| Cómo habla | [`ux/brand-identity.md`](ux/brand-identity.md) §3 y §4 — el tono y el vocabulario canónico. |
| Por qué algo es así | [`plan/decision-log.md`](plan/decision-log.md), 89 decisiones con sus alternativas descartadas. |
| Qué quedó afuera a propósito | [`plan/BACKLOG.md`](plan/BACKLOG.md) |

**El rediseño se implementa de una sola vez, no por fases.**

---

## Las decisiones que definen el producto

Si tuvieras que quedarte con seis:

1. **El archivo es el producto; la app es una vista.** Nada que importe vive solo en la app. El índice es un cache reconstruible, y la reparación universal es reindexar.
2. **Capturar cuesta un solo dato.** La captura pide el título y nada más. Es el job huérfano —ningún competidor lo atiende— y el flujo más crítico.
3. **Se lee lo que llega, y se dice qué le falta.** Los `.md` los escriben agentes por fuera. La app no rechaza: marca incompleta y lista igual.
4. **Avisa, ofrece la salida, y no insiste.** El manejo de errores es un aviso y un botón de reintentar. Sin colas, sin reintentos automáticos, sin reconciliación.
5. **Se navega para llegar y para pasear.** La búsqueda arriba —el job frecuente—; las categorías abajo, para el paseo.
6. **Lo hipotético se explora, no se instala.** El planificador está diseñado y fuera de la primera implementación. Sacarlo cuesta borrar una pantalla.

Los siete principios completos, con la tensión que arbitra cada uno, están en
[`product/strategy/product-principles.md`](product/strategy/product-principles.md).

---

## Estado

| # | Hito | Estado |
|---|---|---|
| 1 | Research & Competitive Analysis | ✅ 2026-09-04 |
| 2 | Síntesis + Personas + JTBD | ✅ 2026-09-05 |
| 3 | Product Principles | ✅ 2026-09-05 *(sin VPC)* |
| 4 | Product Vision | ✅ 2026-09-05 |
| 5 | IA + User Flows + Specs 1.0 | ✅ 2026-09-06 |
| 6 | Wireframes Lo-Fi | ✅ 2026-09-06 |
| 7 | Specs 2.0 — capacidades y edge cases | ✅ 2026-09-06 |
| 8 | Brand Identity + Design System | ✅ 2026-09-06 |
| 9 | UI Mockups Hi-Fi | ✅ 2026-09-06 |
| 10 | Usability Testing | ⏭ **Salteado** — 2026-09-06 |
| 11 | Iteración final + Handoff | ✅ 2026-09-07 |

**El Hito 10 se salteó por decisión del usuario**, así que hay tres cosas
decididas por razonamiento y no por observación: la escala del modo cocina a
50 cm reales, la densidad de la lista con cientos de recetas, y si el vocabulario
se entiende sin haberlo escrito uno mismo. Están en `plan/BACKLOG.md` §4.

---

## Mapa de documentos

```
product-design/
├── CLAUDE.md                    ← estás acá
├── index.md                     mapa completo, con versión y hito de cada documento
├── product/
│   ├── strategy/                visión, personas, jobs, principios
│   └── specs/                   specs-overview + E01…E06 (3.0)
├── ux/
│   ├── information-architecture.md   esquema del `.md`, entidades, navegación
│   ├── user-flows.md            los trece flujos, diagramados
│   ├── wireframes.md            estructura de las doce pantallas
│   ├── brand-identity.md        personalidad, tono, vocabulario
│   ├── design-system.md         tokens, paleta, 15 componentes
│   └── mockups/                 trece pantallas navegables + README con los hallazgos
├── research/competitive-analysis.md
└── plan/
    ├── delta-implementacion.md  ← por acá se empieza a implementar
    ├── decision-log.md          89 decisiones, con lo descartado y el porqué
    ├── BACKLOG.md               lo que quedó afuera, con su razón
    └── PLAN.md                  el runbook que se ejecutó
```

---

## Contexto del repo padre

`../CLAUDE.md` describe la app **ya construida**: v1 mergeada, 328 tests,
publicada en GitHub Pages. `../docs/superpowers/specs/2026-08-31-recetario-design.md`
es el spec técnico de esa implementación.

Su tabla de "Decisiones cerradas — no reabrir" mezcla dos cosas: **restricciones
de plataforma**, que siguen valiendo enteras, y **decisiones de producto y UX**,
que este proyecto reabrió porque ese era su mandato. Las que quedaron dadas
vuelta están listadas en `plan/delta-implementacion.md` §5.

---

## Convenciones

- **Idioma:** español rioplatense. Documentos, comentarios, nombres y UI.
- **Ortografía completa:** acentos y eñes siempre.
- **Lenguaje directo:** sin analogías ni rodeos. Decir qué es la cosa.
- **Los documentos guardan lo decidido, no lo descartado.** Las alternativas van a `plan/decision-log.md`.
- **Versionado:** cada documento lleva versión y estado en el encabezado.
