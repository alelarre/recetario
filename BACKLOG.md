# Backlog

Sólo pendientes. El **estado** dice en qué anda cada uno:

- `Abierto` — nadie lo está tocando.
- `Implementando` — hay una sesión trabajándolo: no lo tomes.
- `Falta probar` — publicado en GitHub Pages, esperando la prueba en el teléfono.
- `En espera` — decidido que no se toca hasta que se resuelva otra entrada.

**Al empezar a trabajar una entrada se le pone `Implementando`**, para que
otra sesión no la tome. **Pasa a `Falta probar` recién en el commit que se
pushea a `main`**, el que la publica: antes no se puede probar. Con el código
terminado pero sin commitear —esperando la revisión del diff o el visto
bueno del usuario— sigue en `Implementando`. La fila se borra recién cuando
está probada. Una entrada que quedó a medias vuelve a `Abierto`.

Donde el detalle dice «ideas N», el número es el de
`product-design/research/herramientas/ideas.md`; los archivos de esa carpeta
tienen las fórmulas, las tablas y las fuentes de cada una.

| ID | Descripción | Detalle | Estado |
|---|---|---|---|
| P105 | Skill: investigar una receta a partir de un título o una idea | Hoy el skill parte de una fuente (PDF, foto, video, sitio, links). Instruirlo para que, con sólo un título o una idea, busque fuentes, compare versiones y escriba la receta. | Falta probar |
| P115 | Pan: planificador por etapas | De la hora de inicio a la hora de cada etapa del pan, con un aviso en cada una. Usa los temporizadores de *Herramientas*. Idea 41. | Abierto |
| P118 | Herramientas: asado, cómo cocinar | Tiempo de parrilla por corte; tiempo de horno por peso, corte y punto; método de la mano para medir el calor. Los tiempos por corte no coinciden entre las fuentes relevadas: hay que elegir una. Va con P119, sobre *Evento*. Ideas 185 y 187. | Abierto |
| P119 | Herramientas: orquestador de los pasos de una comida | Planificar los pasos de una comida: cada uno con su hora o su duración, y el orden en que van. Al ejecutarlo crea temporizadores que se comportan como los de *Temporizadores* —la tira, el aviso, *Parar*—, con alguna diferencia: tocar uno lleva al orquestador y no a *Temporizadores*. Otras pantallas lo pueden abrir con los pasos ya cargados. La línea de tiempo del asado (idea 186) y el planificador del pan (P115) son dos usos de esta herramienta. | Abierto |
| P123 | Herramientas: cantidades por persona y eventos | Comida para una fiesta o buffet; pasta y arroz; empanadas; picada; bebidas, hielo y vino; mesa temática; comida de fiestas con sobras; guarnición; ítems puntuales (alitas, galletitas, pochoclo); viandas para varios días; reparto de platos entre invitados. Ideas 261 a 273. | Falta probar |
| P133 | Evento: correcciones de la revisión | Cumpleaños infantil: hoy un chico cuenta 0,5 y el infantil multiplica por 1,125, así que come 4,5 bocados contra 9 de la fuente; decidir si en un infantil los chicos cuentan enteros. Las tazas se redondean para arriba y el café se calcula sin redondear («8 tazas · 77 g»). Plural fijo («1 tazas», «1 provoletas»). El brindis cuenta a todos los adultos aunque ninguno tome. El MCP acepta personas negativas y un margen inválido pasa a 0 sin avisar. «Adultos que toman alcohol» vacío no dice que es «todos». El comentario de `accionesDeCompartir` en `main.ts` está viejo. Una cosa nueva que no estaba guardada arranca como la prende el tipo de asado por defecto. «Café con leche (la leche)» se lee raro. | Abierto |
