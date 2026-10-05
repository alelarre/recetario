# Backlog

Sólo pendientes. El **estado** dice en qué anda cada uno:

- `Abierto` — nadie lo está tocando.
- `Implementando` — hay una sesión trabajándolo: no lo tomes.
- `Falta probar` — hecho, esperando la prueba en el teléfono.
- `En espera` — decidido que no se toca hasta que se resuelva otra entrada.

Una entrada se borra de la tabla recién cuando está terminada y lista para
probar; una que quedó a medias vuelve a `Abierto`.

Donde el detalle dice «ideas N», el número es el de
`product-design/research/herramientas/ideas.md`; los archivos de esa carpeta
tienen las fórmulas, las tablas y las fuentes de cada una.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P105 | Skill: investigar una receta a partir de un título o una idea | Hoy el skill parte de una fuente (PDF, foto, video, sitio, links). Instruirlo para que, con sólo un título o una idea, busque fuentes, compare versiones y escriba la receta. | Abierto |
| P107 | Escalar una receta | Multiplicar las cantidades de cualquier receta (×2, ×½) desde la receta. | Abierto |
| P111 | Herramientas: referencia rápida | Tablas de consulta en *Herramientas*: minutos de los huevos según el punto, temperatura interna de la carne, temperatura del aceite para freír, temperaturas y tiempos de horno, y temperaturas de las bebidas (agua para el mate, el té y el café; servicio de vinos). Sin cálculo. Ideas 291, 292 y 295. | Falta probar |
| P115 | Pan: planificador por etapas | De la hora de inicio a la hora de cada etapa del pan, con un aviso en cada una. Usa los temporizadores de *Herramientas*. Idea 41. | Abierto |
| P117 | Herramientas: referencia de masas y dulces | Masa para un molde de torta según sus medidas, y tabla de capacidades de moldes; gramos de masa por pieza (pan de hamburguesa, pancho, bagel, baguette, grisín); pasta fresca, de porciones a harina, huevos o yemas; masas por plato (tortillas, ñoquis, fideos de ramen, tapas de dumplings, bollo de pizza según el diámetro); puntos del azúcar con ajuste por altitud; merengue por peso de claras y tipo. Ideas 16, 17, 30, 31, 43, 49, 75 y 83; para el molde de torta, también la 52. | Falta probar |
| P118 | Herramientas: asado | Carne por persona con corrección por hueso; carbón o leña según la carne o las horas; tiempo de parrilla por corte; tiempo de horno por peso, corte y punto; método de la mano para medir el calor. Los tiempos por corte no coinciden entre las fuentes relevadas: hay que elegir una. Ideas 169, 182, 184, 185 y 187. | Abierto |
| P119 | Herramientas: orquestador de los pasos de una comida | Planificar los pasos de una comida: cada uno con su hora o su duración, y el orden en que van. Al ejecutarlo crea temporizadores que se comportan como los de *Temporizadores* —la tira, el aviso, *Parar*—, con alguna diferencia: tocar uno lleva al orquestador y no a *Temporizadores*. Otras pantallas lo pueden abrir con los pasos ya cargados. La línea de tiempo del asado (idea 186) y el planificador del pan (P115) son dos usos de esta herramienta. | Abierto |
| P120 | Herramientas: conversor de unidades | Conversor general de unidades de cocina; tazas, cucharadas y cucharaditas a gramos por ingrediente, con tabla buscable de pesos; mililitros a gramos por densidad; tazas y cucharas por país; medidas informales (pinch, dash); manteca en sticks, tazas y gramos. Ideas 217 a 224. | En espera |
| P122 | Herramientas: sustituciones | Buscador de sustituciones: qué usar en lugar del ingrediente que falta, con sus proporciones. Idea 237. | Abierto |
| P123 | Herramientas: cantidades por persona y eventos | Comida para una fiesta o buffet; pasta y arroz; empanadas; picada; bebidas, hielo y vino; mesa temática; comida de fiestas con sobras; guarnición; ítems puntuales (alitas, galletitas, pochoclo); viandas para varios días; reparto de platos entre invitados. Ideas 261 a 273. | Abierto |
| P124 | Herramientas: básicos de cocción | Agua para el arroz por variedad y método; tabla de granos (líquido, tiempo y rendimiento); legumbres (remojo, cocción y rendimiento); agua y sal para la pasta; tiempo de pasta por formato y medidor de espagueti, que en el inventario no tienen fuente; verduras al vapor y hervidas; blanqueado con temporizador y baño de hielo; caldo. Ideas 274 a 281. | Falta probar |
| P125 | Herramientas: cuánto dura cada alimento | Tiempo de conservación de cada alimento en alacena, heladera y freezer. Idea 300. | Falta probar |
| P126 | Temporizadores desde la receta | Al editar una receta, sumarle temporizadores como herramienta, cada uno con sus minutos y su etiqueta; en el modo cocina, cada uno se dispara con un solo botón y corre como cualquier temporizador. **Falta decidir dónde viven en el `.md`:** el frontmatter es cerrado (ocho claves) y no se le suman claves, y Cooklang en el cuerpo está descartado (`CLAUDE.md` §No proponer). Una salida es una sección propia del cuerpo, como el depósito `## Fotos`. | Abierto |
| P127 | Fermentados: la sal sube de a 0,1 % | En la calculadora de *Fermentados*, el campo «Sal (%)» tiene que subir y bajar de a 0,1 % con las flechas, no de a 1 %. El campo no tiene `step` (`numeroEnFila` en `src/ui/herramientas.ts`), y sin él el navegador usa 1; la hidratación del pan usa el mismo campo y ahí 1 está bien. | Falta probar |
| P129 | Referencias: pendientes menores | 29 detalles que quedaron sin tocar al cerrar P111, P117, P124 y P125 —datos y fuentes, cuentas, pantalla, tests y documentos—, listados en `pendientes-referencias.md`, en la raíz. Se ven de a uno y cada punto resuelto o descartado se borra del archivo. **Al terminar, borrar `pendientes-referencias.md`**, que es temporal. | Abierto |
