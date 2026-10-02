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
| P111 | Herramientas: referencia rápida | Tablas de consulta en *Herramientas*: minutos de los huevos según el punto, temperatura interna de la carne, temperatura del aceite para freír, temperaturas y tiempos de horno, y temperaturas de las bebidas (agua para el mate, el té y el café; servicio de vinos). Sin cálculo. Ideas 291, 292 y 295. | Abierto |
| P112 | Herramientas: cronómetro y cuenta regresiva | Un cronómetro y una cuenta regresiva en *Herramientas*. Lo usan los avisos por etapa de P115 y P119, y el blanqueado de P124. | Abierto |
| P113 | Calculadora de pan: prefermentos | Analizar si la calculadora de pan ofrece prefermentos (biga, poolish, etc.) además de levadura fresca, seca y masa madre, con la levadura del prefermento según las horas de anticipación. Ideas 32 y 33. | Abierto |
| P114 | Calculadora de pan: pizza | Sumar la masa de pizza a la calculadora de pan: por estilo, cantidad de bollos, hidratación y horas. Idea 42. | Abierto |
| P115 | Pan: planificador por etapas | De la hora de inicio a la hora de cada etapa del pan, con un aviso en cada una. Usa el cronómetro de P112. Idea 41. | Abierto |
| P116 | Calculadora de sal: tiempo de fermentación | Sumar a la calculadora de fermentados el tiempo estimado de fermentación según la temperatura. Idea 110. | Abierto |
| P117 | Herramientas: referencia de masas y dulces | Masa para un molde de torta según sus medidas, y tabla de capacidades de moldes; gramos de masa por pieza (pan de hamburguesa, pancho, bagel, baguette, grisín); pasta fresca, de porciones a harina, huevos o yemas; masas por plato (tortillas, ñoquis, fideos de ramen, tapas de dumplings, bollo de pizza según el diámetro); puntos del azúcar con ajuste por altitud; merengue por peso de claras y tipo. Ideas 16, 17, 30, 31, 43, 49, 75 y 83; para el molde de torta, también la 52. | Abierto |
| P118 | Herramientas: asado | Carne por persona con corrección por hueso; carbón o leña según la carne o las horas; tiempo de parrilla por corte; tiempo de horno por peso, corte y punto; método de la mano para medir el calor. Los tiempos por corte no coinciden entre las fuentes relevadas: hay que elegir una. Ideas 169, 182, 184, 185 y 187. | Abierto |
| P119 | Asado: línea de tiempo | Con la hora de comer, cuándo prender el fuego y cuándo entra cada corte, con un aviso en cada paso. Usa el cronómetro de P112. Idea 186. | Abierto |
| P120 | Herramientas: conversor de unidades | Conversor general de unidades de cocina; tazas, cucharadas y cucharaditas a gramos por ingrediente, con tabla buscable de pesos; mililitros a gramos por densidad; tazas y cucharas por país; medidas informales (pinch, dash); manteca en sticks, tazas y gramos. Ideas 217 a 224. | Abierto |
| P122 | Herramientas: sustituciones | Buscador de sustituciones: qué usar en lugar del ingrediente que falta, con sus proporciones. Idea 237. | Abierto |
| P123 | Herramientas: cantidades por persona y eventos | Comida para una fiesta o buffet; pasta y arroz; empanadas; picada; bebidas, hielo y vino; mesa temática; comida de fiestas con sobras; guarnición; ítems puntuales (alitas, galletitas, pochoclo); viandas para varios días; reparto de platos entre invitados. Ideas 261 a 273. | Abierto |
| P124 | Herramientas: básicos de cocción | Agua para el arroz por variedad y método; tabla de granos (líquido, tiempo y rendimiento); legumbres (remojo, cocción y rendimiento); agua y sal para la pasta; tiempo de pasta por formato y medidor de espagueti, que en el inventario no tienen fuente; verduras al vapor y hervidas; blanqueado con temporizador y baño de hielo; caldo. Ideas 274 a 281. | Abierto |
| P125 | Herramientas: cuánto dura cada alimento | Tiempo de conservación de cada alimento en alacena, heladera y freezer. Idea 300. | Abierto |
| P129 | Buscar por fuente, en la app y en el MCP | **App:** la búsqueda por texto separa las coincidencias por nombre, ingrediente y tag (`buscarPorTexto` en `src/store.ts`, C02.3); sumarle la fuente como un grupo más, con su motivo, y actualizar C02.3. **MCP:** `buscar` filtra por texto, categoría, tags y dificultad (`Consulta` en `mcp/recetario.ts`); sumarle `fuente`, en la consulta y en el esquema de la herramienta. El índice ya guarda la fuente (`COLUMNAS` en `src/catalogo.ts`): no hay que cambiarlo ni subir `SCHEMA_VERSION`. Que `formato` recomiende una misma fuente para todas las recetas de un libro, con la página fuera del campo (en `## Notas` si se quiere conservar), y que una receta propia no lleve `fuente`. | Abierto |
