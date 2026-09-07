# Recetario — Índice de Épicas

**Versión:** 2.0
**Fecha:** 2026-09-07
**Estado:** Final — Hito 11

---

## Sobre este documento

El índice de las épicas del producto. Cada una tiene su archivo con sus features
partidas en **capacidades**, cada una con sus criterios de aceptación, sus edge
cases y sus notas técnicas.

**Las reglas transversales viven en `E05-Cimientos.md` §Reglas** y valen para las
seis épicas: manejo de errores mínimo, reintento idempotente, el `.md` como
verdad sin autorreparación, el `fileId` como identidad, y Android como
plataforma. Una épica que no diga lo contrario, las cumple.

Las épicas salen de los módulos de la arquitectura de información, no de las
pantallas: una épica es un pedazo de producto con sentido propio, y puede tocar
varias pantallas.

---

## Las épicas

| # | Épica | Qué cubre | Jobs | Prioridad |
|---|---|---|---|---|
| **E01** | [Captura y Borradores](E01-CapturaYBorradores.md) | Guardar algo antes de perderlo, y la cola que espera conversión | J2, J3 | **La más alta** |
| **E02** | [Encontrar](E02-Encontrar.md) | Búsqueda por nombre y por ingrediente, categorías, paseo | J1, J4, J5 | Alta |
| **E03** | [Leer y cocinar](E03-LeerYCocinar.md) | La receta a la vista, con las manos ocupadas | J6 | Media |
| **E04** | [Corregir](E04-Corregir.md) | El editor: arreglar un error, anotar una variación | J7 | Baja |
| **E05** | [Cimientos](E05-Cimientos.md) | Drive, el índice, el esquema del `.md`, los estados degradados | J8, transversal | Alta |
| **E06** | [Planificar](E06-Planificar.md) `[en el backlog]` | Plan semanal y lista de compras | J9 | **Fuera de la primera implementación** |

---

## Cómo se relacionan

**E05 es el piso.** Todas las demás escriben o leen a través de él: el esquema
del `.md`, el índice como contrato con el agente, y qué hace la app cuando algo
falla. Nada funciona si E05 no está.

**E01 es el diferenciador.** Es el job huérfano, sin competencia en el mercado, y
el flujo más crítico del producto. Es también lo único que la app actual no tiene
en absoluto.

**E02 es lo que más cambia respecto de lo implementado.** La búsqueda pasa a ser
la pantalla principal y aparece el filtro por ingrediente, que hoy no existe.

**E03 y E04 son lo que la app ya resuelve.** Se conservan casi enteras, y eso es
un resultado del análisis, no una omisión: son los jobs de menor frecuencia y
están bien atendidos.

**E06 es exploración** y está escrita con menos detalle que las otras cinco a
propósito: especificarla al mismo nivel la instalaría. No compromete nada. El principio 6 la mantiene fuera de
la navegación primaria y con costo de retiro bajo: sacarla tiene que costar
borrar una pantalla, no rediseñar el producto.

---

## Por dónde se empieza

`[Hito 11]` **El rediseño se implementa de una sola vez, no por fases.** El delta
archivo por archivo contra la app existente está en
[`plan/delta-implementacion.md`](../../plan/delta-implementacion.md), que es el
documento por el que empieza quien implementa: tiene las ocho decisiones que hay
que entender antes de escribir la primera línea, qué se mantiene, qué cambia, qué
se elimina y qué es nuevo.

**E06 queda afuera** de esa implementación (`plan/BACKLOG.md`).

---

## Lo que ninguna épica cubre

Registrado para que se vea que falta a propósito:

| Tema | Por qué |
|---|---|
| El agente que convierte | Vive fuera de la PWA. Es parte del producto (`product-vision.md` §1) pero no de la app, así que no tiene épica acá. |
| Historial de cocina, escalado, timers | Descartados o no pedidos por ningún job. |
| Multiusuario, compartir, sincronización entre personas | No existe un segundo usuario. |
| Modo offline | Sin Drive no hay app. Decisión, no carencia. |
