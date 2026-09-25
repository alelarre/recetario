# Recetario — Índice de Épicas

---

## Sobre este documento

El índice de las épicas del producto. Cada una tiene su archivo con sus features
partidas en **capacidades**, cada una con sus criterios de aceptación, sus edge
cases y sus notas técnicas.

**Las reglas transversales viven en `E05-Cimientos.md` §Reglas** y valen para las
seis épicas: manejo de errores mínimo, reintento idempotente, la sesión vencida
como un error más, el `.md` como verdad sin autorreparación, el `fileId` como
identidad, que la app no descubre cambios de afuera, Android como plataforma, y
el velo que tapa la pantalla mientras la app trabaja. Una épica que no diga lo contrario, las cumple.

Las épicas salen de los módulos de la arquitectura de información, no de las
pantallas: una épica es un pedazo de producto con sentido propio, y puede tocar
varias pantallas.

---

## Las épicas

| # | Épica | Qué cubre | Jobs | Prioridad |
|---|---|---|---|---|
| **E01** | [Captura y Borradores](E01-CapturaYBorradores.md) | Guardar algo antes de perderlo: lo compartido abre el editor, los borradores son recetas con el tag `borrador`, y Convertir con Agente | J2, J3 | **La más alta** |
| **E02** | [Encontrar](E02-Encontrar.md) | Búsqueda por nombre, ingrediente y tag; categorías; tags especiales y lista por tag; filtro y orden por duración | J1, J4, J5 | Alta |
| **E03** | [Leer y cocinar](E03-LeerYCocinar.md) | La receta a la vista, el modo cocina con las manos ocupadas, la estrella de favorito, y compartir la receta (PDF, link a la vista de invitado, texto) | J6 | Media |
| **E04** | [Corregir](E04-Corregir.md) | El editor, único formulario de la app: arreglar un error, anotar una variación, crear una receta, poner los tags especiales y la duración | J7 | Baja |
| **E05** | [Cimientos](E05-Cimientos.md) | El esquema del `.md`, la carpeta base y las categorías en Drive, el índice y su copia local, los estados degradados, Ajustes | J8, transversal | Alta |
| **E06** | [Planificar](E06-Planificar.md) | El plan de siete días sin fechas y la lista de compras que sale de él | J9 | Baja |

---

## Cómo se relacionan

**E05 es el piso.** Todas las demás escriben o leen a través de él: el esquema
del `.md`, el índice como contrato con el agente, y qué hace la app cuando algo
falla. Nada funciona si E05 no está.

**E01 es el diferenciador.** Es el job huérfano, sin competencia en el mercado, y
el flujo más crítico del producto.

**E02 es la pantalla principal.** La búsqueda va arriba y las categorías abajo;
todo se resuelve contra el índice, sin abrir ningún `.md`.

**E03 y E04 son los jobs de menor frecuencia.** Leer, cocinar y corregir: el
editor existe para corregir, no para componer, porque el input principal son las
sesiones con agentes.

**E06 tiene costo de retiro bajo.** J9 es el único job que cambia
la conducta del usuario en vez de acompañarla, así que el plan entra por una
sola entrada del menú lateral, no toca el índice ni el esquema del `.md`, y
ninguna otra épica lo nombra: sacarlo es borrar una entrada, tres pantallas,
dos módulos y un archivo de Drive, y desconectarlos del store, de `main.ts`, del
router, de la configuración y de Ajustes (principio 6, `E06-Planificar.md`
C06.5.1).

---

## Lo que ninguna épica cubre

Registrado para que se vea que falta a propósito:

| Tema | Por qué |
|---|---|
| El agente que convierte | Vive fuera de la PWA. Es parte del producto (`product-vision.md` §1) pero no de la app, así que no tiene épica acá. |
| Historial de cocina, escalado, timers | Descartados o no pedidos por ningún job. |
| Multiusuario y sincronización entre personas | No existe un segundo usuario. Compartir una receta es mandar una copia del momento: nada queda publicado ni sincronizado. |
| Modo offline | Sin Drive no hay app. Decisión, no carencia. La copia local del índice ahorra una lectura al abrir; no reemplaza a Drive. |
