# Verificación: básicos de cocción (P124)

Verificación de las fuentes del inventario para P124, hecha el 2026-10-04. Cada número de este documento sale de una página o PDF abierto ese día; lo que no se pudo abrir quedó afuera o figura como descartado.

Convenciones: taza estadounidense = 240 ml; 1 lb = 453,6 g; 1 oz = 28,35 g; 1 galón = 3,785 l; 1 pie = 0,3048 m. «Partes» quiere decir partes en volumen salvo que se diga «en peso». Algunas páginas no se dejaron leer con WebFetch (405 o PDF ilegible) y se leyeron con el lector `r.jina.ai` o bajando el PDF y pasándolo por `pdftotext`; se indica en cada caso.

## Resumen

| Ítem | Estado | Tipo | Fuente elegida |
|---|---|---|---|
| 1. Agua para el arroz | con decisión | tabla + cuenta | USA Rice Federation (olla); manual Fagor Future (olla a presión); densidades de USDA FoodData Central |
| 2. Granos | con decisión | tabla | Whole Grains Council; Quaker (avena arrollada); Bob's Red Mill (cuscús) |
| 3. Legumbres | con decisión | tabla | NDSU Extension FN2068 (remojo, olla, rinde); manual Fagor Future (olla a presión) |
| 4. Agua y sal para la pasta | listo | cuenta | Barilla (páginas de producto, Italia) |
| 5. Tiempo de pasta y medidor de espagueti | con decisión | tabla + cuenta | Cavanagh, *Ciencia y Tecnología* (Univ. de Palermo), 2013, tabla 1; Barilla EE. UU. (medidor) |
| 6. Verduras al vapor y hervidas | con decisión | tabla | Clínica Las Condes, Centro de Nutrición |
| 7. Blanqueado | listo | tabla + temporizador | NCHFP (tabla y procedimiento); Colorado State University Extension (altitud) |
| 8. Caldo | con decisión | cuenta | Instituto Gastronómico Internacional (IGI) |

---

## 1. Agua para el arroz por variedad y método

### Tabla propuesta

**Olla, por absorción** (hervir el agua con el arroz, bajar a mínimo, tapar, no revolver). Fuente: USA Rice Federation. Las partes de agua son en volumen, como las da la fuente. La columna en peso es una cuenta hecha acá (ver Notas).

| Variedad (nombre local) | Fila de la fuente | Agua, partes en volumen | Agua en peso (g de agua por g de arroz), derivada | Tiempo tapado a fuego mínimo |
|---|---|---|---|---|
| Largo fino | White, long grain | 2 | 2,6 | 15–18 min |
| Doble carolina (largo ancho) | — (ver Decisiones) | 2 (propuesta) | 2,6 | 15–18 min (propuesta) |
| Grano mediano | White, medium grain | 1½ | 1,85 | 15–18 min |
| Grano corto / para sushi | White, short grain | 1¼ | 1,5 | 15–18 min |
| Integral, grano largo o mediano (yamaní: ver Decisiones) | Brown, medium or long grain | 2¼ | 2,9 | 40–45 min |
| Parboil | Parboiled | 2¼ | sin dato de densidad | 20 min (en la tabla; ver Notas) |
| Parboil integral | Parboiled, brown | 2¼ | sin dato de densidad | 25 min |
| Jazmín | U.S. jasmine, white | 2 | 2,6 | 15–18 min |
| Basmati | U.S. basmati, white | 2 | 2,6 | 15–18 min |
| Arbóreo / carnaroli | U.S. arborio | 4 | 4,9 | 20–30 min |
| Salvaje | Wild rice | 3 | 4,5 | 40–50 min |

- Si después del tiempo el arroz no está tierno o queda líquido, 2 a 4 minutos más (USA Rice).
- Rinde: el arroz triplica su volumen (1 taza cruda → 3 cocidas). En peso, la fuente dice «más que duplica» (1 lb cruda → 2+ lb cocida).

**Olla a presión de hornalla.** Fuente: manual Fagor Future. Agua en peso de arroz y ml de agua (la única fuente con el arroz en peso). El tiempo se cuenta desde que la válvula larga vapor con fuerza; ahí se baja a fuego medio-bajo.

| Arroz (fila de la fuente) | Arroz : agua | ml de agua por g de arroz | Posición 2, 100 kPa | Posición 1, 60 kPa |
|---|---|---|---|---|
| Bomba | 300 g : 550 ml | 1,83 | 4–6 min | 8–10 min |
| Carnaroli («carnalorí» en el manual) | 300 g : 550 ml | 1,83 | 4–6 min | 8–10 min |
| Basmati | 300 g : 500 ml | 1,67 | 2–4 min | 6–8 min |
| Integral | 300 g : 800 ml | 2,67 | 12–16 min | 16–20 min |
| Risotto | 300 g : 675 ml | 2,25 | 4–6 min | 8–10 min |
| Sushi | 300 g : 400 ml | 1,33 | 4–6 min | 8–10 min |

Para liberar la presión, el manual da tres formas: natural (sacar del fuego y esperar 10–15 min), con agua fría sobre la tapa, o con la válvula. Llenar hasta la mitad como máximo cuando se cocina arroz o legumbres.

**Arrocera:** sin datos. USA Rice dice que se sigan las instrucciones del fabricante del aparato. Queda afuera.

### Fuente

- USA Rice Federation, *How To Cook Rice* — https://www.usarice.com/thinkrice/how-to/how-to-cook-rice — consultada el 2026-10-04 con el lector `r.jina.ai`, porque WebFetch recibió un 405. Se leyó la «Rice Cooking Chart» (partes de líquido por parte de arroz, en volumen, y el tiempo), las instrucciones de olla, horno y microondas y las equivalencias de rinde: «1 cup dry rice = 3 cups cooked», «1 pound dry rice = 2+ pounds cooked», «1 cup dry rice = approximately 7 ounces», «1 cup cooked rice = approximately 8 ounces».
- Fagor, *Manual olla a presión super-rápida Future* — https://fagorcookware.com/wp-content/uploads/2022/10/IM_OP_FUTURE.pdf — consultado el 2026-10-04 bajando el PDF y pasándolo por `pdftotext`. Páginas 14 a 16, «Tiempos de cocción», tabla «Arroces (1 vaso)», y la sección «Cómo liberar la presión después de cocinar».
- USDA FoodData Central (API, 2026-10-04), gramos por taza de arroz crudo: largo blanco 185 g (fdcId 168877), mediano blanco 195 g (168879), corto blanco 200 g (168931), integral largo 185 g (169703), integral mediano 190 g (169706), salvaje 160 g (169726).
- Ministerio de Agroindustria, Alimentos Argentinos, *Ficha 37: Arroz* (marzo de 2015) — https://alimentosargentinos.magyp.gob.ar/HomeAlimentos/seguridad-alimentaria-y-nutricion/fichaspdf/Ficha_37_Arroz.pdf — consultada el 2026-10-04 con `pdftotext`. Define los tipos: largo ancho (doble carolina) con una longitud media de 7 mm o más; largo fino, 6,5 mm o más; mediano (mediano carolina), entre 6,0 y 7,0 mm; corto (japonés). Da una sola regla general: «1 parte de arroz por tres de líquido, ya sea agua, caldo o salsa».

### Descartado

- Omni Calculator, rice-water-ratio (abierta): es calculadora (nivel 4), sin tiempos y sin fuente. Da largo 1:2, mediano 1:1,5, corto 1:1,25, jazmín 1:1,75, basmati 1:1,5, sushi 1:1,33, integral largo 1:1,75, parboil 1:2,25. Reposo de 2–5 min.
- hacecuentas.com (abierta): aplica la proporción en volumen como ml por gramo (por ejemplo «2 ml de agua por gramo de arroz»), lo que es un error de unidades, porque una taza de arroz pesa 185–200 g y no 240 g.
- calcgator (arrocera −25 %, presión 1:1): sólo resultado de búsqueda, no se abrió.
- Instant Pot, *Cooking Time Tables* (abierta): tiempos para olla eléctrica (arroz blanco 4 min, integral 20, basmati 4, jazmín 4, salvaje 20), sin proporción de agua y para otro aparato.
- Diario Uno (2026-06-09, abierta): largo fino 15–17 min, doble carolina 18–20, parboil 20, integral 40–45, carnaroli/arbóreo 18–20, yamaní 45–50, reposo 5–10 min tapado. No da proporciones de agua ni cita fuente. Se usa sólo como referencia local en las Decisiones.
- Recetas Nestlé Argentina, *¿Cómo cocinar arroz yamaní?* (2020-08-11, abierta): 1 taza de arroz por 2½ de agua, 30/40 min y 10 min de reposo tapado. Es sólo yamaní; queda como alternativa en las Decisiones.
- La Nación y Paulina Cocina (yamaní 1:2½, unos 50 min) y cocina-argentina.com (Gallo Oro 1:2): sólo resultados de búsqueda, no se abrieron.
- Sitios de fabricantes argentinos (Dos Hermanos, Molinos Ala, Gallo): las páginas que abrieron no traen instrucciones de cocción; arrozgallo.com.ar no resuelve.

### Decisiones para el usuario

1. **¿Proporción en peso (derivada) o en volumen?** La única fuente en peso es Fagor, y es sólo para olla a presión. Para la olla común, el peso sale de cruzar USA Rice (volumen) con las densidades de FoodData Central. *Recomiendo guardar la proporción en peso derivada*, porque la app trabaja en gramos, y dejar escrito en el dato de dónde sale.
2. **Doble carolina.** USA Rice no tiene una fila de grano largo ancho. La Ficha 37 lo define como grano largo (7 mm o más). *Recomiendo usar la fila de largo blanco (2 partes, 15–18 min)*; la prensa local (Diario Uno) le da 18–20 min.
3. **Yamaní.** Es un integral; USA Rice da 2¼ partes y 40–45 min, y Nestlé Argentina da 2½, 30–40 min y 10 de reposo. *Recomiendo la fila de integral de USA Rice*, por coherencia con el resto de la tabla.
4. **Basmati y jazmín.** USA Rice habla de las variedades cultivadas en EE. UU. (2 partes); Omni da 1,5 y 1,75, y Fagor usa menos agua para el basmati. *Recomiendo USA Rice* y aclarar en la app que el importado puede pedir menos agua.
5. **Parboil.** La misma página de USA Rice dice 20 min en la tabla y 25–30 min en las instrucciones de olla. *Recomiendo 20–30 min.*
6. **Reposo.** USA Rice no da reposo para la olla (sí 5 min en microondas). *Recomiendo no poner un reposo fijo* o, si se quiere uno, «5–10 min tapado» de Diario Uno, avisando que es prensa.
7. **Columna de presión.** Las ollas a presión de hornalla trabajan a unos 100 kPa. *Recomiendo mostrar sólo la posición 2 (100 kPa).* Fagor no tiene largo fino; la fila más cercana es basmati.
8. **Regla oficial 1:3 de la Ficha 37.** Es un organismo oficial, pero da una sola regla para todo y no aclara el método. *Recomiendo citarla como nota y no usarla en la tabla.*

### Notas

- Cuenta del peso: g de agua por g de arroz = partes × 240 ml ÷ gramos por taza (FDC). Por ejemplo, largo: 2 × 240 / 185 = 2,59. Para jazmín y basmati se usó la densidad del largo; para arbóreo, la del mediano (4 × 240 / 195 = 4,92). Parboil no tiene densidad en FDC.
- Las proporciones de USA Rice son por taza de arroz crudo. Con la equivalencia de la misma página (1 taza ≈ 7 oz ≈ 198 g), largo da 480 / 198 = 2,4; con FDC (185 g) da 2,6. La diferencia es la que hay entre las dos densidades.
- Rinde en peso: USA Rice da «2+» (1 lb → 2+ lb), y también 1 taza cruda ≈ 198 g → 3 tazas cocidas × 227 g = 681 g (×3,4). Las dos cifras no coinciden. Lo único firme es ×3 en volumen.

---

## 2. Granos

### Tabla propuesta

Por cada parte de grano en volumen. El tiempo es a fuego bajo, tapado, una vez que rompe el hervor. Fuente: Whole Grains Council, salvo donde se indica otra.

| Grano | Líquido (partes) | Tiempo | Rinde (partes cocidas) |
|---|---|---|---|
| Quinoa | 2 | 12–15 min | 3 |
| Trigo burgol | 2 | 10–12 min | 3 |
| Polenta (harina de maíz común, no instantánea) | 4 | 25–30 min | 2½ |
| Avena cortada (*steel cut*) | 4 | 30 min | 3 |
| Avena arrollada (Quaker) | 2 (una porción: ½ taza y 1 taza); 1¾ (dos porciones: 1 taza y 1¾) | unos 5 min | sin dato |
| Cebada pelada (*hulled*) | 3 | 45–60 min | 3½ |
| Mijo pelado | 2½ | 25–35 min | 4 |
| Trigo sarraceno | 2 | 20 min | 4 |
| Amaranto | 2 | 15–20 min | 2½ |
| Farro | 2½ | 25–40 min | 3 |
| Cuscús (Bob's Red Mill) | 1¼ (agua o caldo hirviendo) | 0 min al fuego: tapar fuera del fuego y dejar 5 min | sin dato |
| Trigo en grano | 4 | remojo de una noche, y 45–60 min | 2½ |
| Arroz salvaje | 3 | 45–55 min | 3½ |
| Sorgo | 4 | 25–40 min | 3 |
| Teff | 3 | 20 min | 2½ |

### Fuente

- Whole Grains Council, *Cooking Whole Grains* — https://wholegrainscouncil.org/recipes/cooking-whole-grains — consultada el 2026-10-04. Se leyó la tabla completa (líquido por taza de grano, tiempo y rinde) y la nota «Grains can vary in cooking time depending on the age of the grain, the variety, and the pans you're using to cook.»
- Quaker, *Old Fashioned Oats* — https://www.quakeroats.com/products/hot-cereals/old-fashioned-oats — consultada el 2026-10-04 con `r.jina.ai`. Una porción: ½ taza de avena y 1 taza de agua o leche; dos porciones: 1 taza y 1¾ tazas; unos 5 minutos a fuego medio. En microondas, 2½–3 min.
- Bob's Red Mill, *Basic preparation instructions for Golden Couscous* — https://www.bobsredmill.com/recipes/how-to-make/basic-preparation-instructions-for-golden-couscous — consultada el 2026-10-04 con `r.jina.ai`. 1¼ tazas de agua o caldo por 1 taza de cuscús; se hierve el líquido, se agrega el cuscús, se tapa, se saca del fuego y se deja 5 minutos.

### Descartado

- «Cuscús 1:1 con 5 min de reposo» (inventario, sin verificar): el único 1:1 apareció en resúmenes de búsqueda de blogs. Se reemplaza por el fabricante.
- Polenta instantánea Presto Pronta (Arcor): las recetas de arcor.com que se abrieron usan proporciones distintas (250 cc de agua y 50 g de polenta, cocida «unos cinco minutos»; en otra, «removemos por un minuto»). La proporción del paquete, «una medida por tres», salió sólo de resultados de búsqueda. No hay una proporción verificada.
- joteo (quinoa, cuscús, avena): sólo en listado, no se abrió.

### Decisiones para el usuario

1. **Polenta instantánea.** En Argentina es la más usada, pero no hay una proporción verificada del fabricante. *Recomiendo dejar en la tabla la harina de maíz común (Whole Grains Council)* y, para la instantánea, decir «según el paquete».
2. **Cebada.** La fuente es cebada pelada; acá se vende más la perlada, que tarda menos. *Recomiendo dejar la fila con su nombre exacto («cebada pelada») y no extrapolar.*
3. **Avena.** *Recomiendo dos filas*, cortada (Whole Grains Council) y arrollada (Quaker), porque en Argentina se usa más la arrollada.

### Notas

- Todo es en volumen y la fuente no da pesos. Como la proporción es entre partes, sirve con cualquier taza.
- Las filas de sorgo, teff y arroz salvaje están en la fuente; se incluyen por si se quieren, pero no se pidieron.

---

## 3. Legumbres

### Tabla propuesta

**Remojo y olla común.** Fuente: NDSU Extension, FN2068 (noviembre de 2022). El tiempo es a fuego suave, después del remojo, con las legumbres cubiertas de agua. El rinde es en volumen, por taza seca.

| Legumbre (nombre local) | Fila de la fuente | Remojo | Olla | Rinde (tazas cocidas por taza seca) |
|---|---|---|---|---|
| Garbanzos | Chickpeas | sí | 90–120 min | 2 |
| Lentejas | Lentils | no | 15–20 min | 2½ |
| Arvejas secas partidas | Split peas | no | 30 min (el texto dice 35–40) | 2 |
| Arvejas secas enteras | Whole dry peas | sí | 35–40 min | 2 |
| Porotos negros | Black beans | sí | 60–90 min | 2–2½ |
| Porotos alubia (ver Decisiones) | Great Northern beans | sí | 45–60 min | 2–2½ |
| Porotos alubia chicos o *navy* | Navy beans | sí | 90–120 min | 2–2½ |
| Porotos colorados | Kidney beans | sí | 90–120 min | 2–2½ |
| Porotos pintos | Pinto beans | sí | 90–120 min | 2–2½ |
| Porotos rosados | Pink beans | sí | 60 min | 2–2½ |
| Porotos *cranberry* (borlotti) | Cranberry beans | sí | 45–60 min | 2–2½ |
| Pallares | — | sin dato | sin dato | sin dato |

Remojo (NDSU):

| Método | Agua | Tiempo |
|---|---|---|
| Lento | 10 tazas por 1 lb de legumbres (unos 5,3 l por kg) | 6–8 h o toda la noche, en la heladera |
| En caliente (el que recomienda) | 10 tazas por 2 tazas de legumbres (5 partes); hervir 2–3 min | tapado fuera del fuego, 4–24 h |
| Rápido | 6 tazas por 2 tazas de legumbres (3 partes); hervir 2–3 min | tapado fuera del fuego, 1 h |

Siempre se descarta el agua del remojo y se enjuaga. Si el remojo pasa de 4 horas, va a la heladera. Para cocinar: 2 tazas de agua por taza de legumbre remojada (2 partes) y mantenerla cubierta, agregando agua fría si hace falta; lentejas, 2½ partes; arvejas partidas, 2.

**Olla a presión de hornalla.** Fuente: manual Fagor Future. El tiempo se cuenta desde que la válvula larga vapor con fuerza. Llenar hasta la mitad como máximo y poner líquido hasta cubrir.

| Legumbre (fila de la fuente) | Posición 2, 100 kPa | Posición 1, 60 kPa |
|---|---|---|
| Garbanzos | 26–30 min | 34–38 min |
| Lentejas, sin remojo | 8–10 min | 12–14 min |
| Alubias blancas | 16–22 min | 24–30 min |
| Alubias pintas | 18–22 min | 22–26 min |
| Alubias fabes | 16–22 min | 24–30 min |
| Alubias verdinas | 16–20 min | 20–24 min |
| Azuki | 10–12 min | 14–16 min |
| Habas | 8–10 min | 12–14 min |
| Arvejas secas | sin dato | sin dato |

### Fuente

- NDSU Extension, *A Pocket Guide to Preparing Pulse Foods*, FN2068, noviembre de 2022 — https://www.ndsu.edu/agriculture/sites/default/files/2024-01/fn2068.pdf — consultado el 2026-10-04 bajando el PDF y pasándolo por `pdftotext`. Se leyeron la tabla «Preparing and cooking pulses» (tiempo, remojo y rinde por taza seca), los tres métodos de remojo, la nota de seguridad del remojo de más de 4 horas y el apartado «Cooking Pulses». Sobre la olla a presión dice sólo que, siguiendo al fabricante, las legumbres se cocinan «in half the time» y sin remojo.
- Fagor, manual Future (la misma fuente que en el arroz), tabla «Legumbres», página 15.

### Descartado

- Legumbres Pedro, Cádiz (2021-11-19, abierta): es fabricante (nivel 3) y no distingue porotos por variedad. Da lentejas 60–90 min en olla, lo que choca con todas las otras fuentes (15–30 min). En presión: garbanzos 10–15 min, lentejas 20–25, alubias 15–18. Remojo: garbanzos y alubias 8–12 h, lentejas 0–4 h; en caliente, 90–120 min, 45–120 min y 20–40 min.
- Pronto (2026-06-10, revista argentina, abierta): remojo de garbanzos y porotos 8–12 h, lentejas 30–60 min (opcional), arvejas secas 4–6 h (las partidas no necesitan). Olla: garbanzos 40–90 min, porotos 60–80, lentejas 20–30, arvejas secas 30–40. Presión: garbanzos 20–25, porotos 15–20, lentejas 6–8, arvejas 8–10. No da fuente ni la presión de la olla. Queda como alternativa local en las Decisiones.
- Instant Pot (abierta): tiempos de olla eléctrica (porotos negros secos 20 min, remojados 3; garbanzos secos 35, remojados 5; lentejas 8). Es otro aparato.
- thecalculatedcook (inventario): calculadora, no se abrió.
- «Rinde 100 g → 250–300 g» (inventario): no se encontró ninguna fuente en peso. Queda afuera.
- USDA Food Buying Guide, sección 2 (abierta): da porciones de ¼ de taza cocida por libra seca. En volumen da relaciones de 2,0 a 2,5, iguales a las de NDSU (por ejemplo, garbanzos: 24,6 porciones de ¼ de taza = 6,15 tazas cocidas por 2½ tazas secas = 2,46). Confirma el rinde, pero no lo da en peso.

### Decisiones para el usuario

1. **Olla: NDSU o Pronto.** NDSU es una extensión universitaria pública (organismo oficial) y distingue porotos por variedad; Pronto es local pero no tiene fuente, y sus tiempos son más cortos (garbanzos 40–90 contra 90–120). *Recomiendo NDSU.*
2. **Presión: Fagor o Pronto.** Por el orden de preferencia iría primero la fuente argentina, pero Pronto no dice a qué presión ni desde cuándo se cuenta. *Recomiendo Fagor a 100 kPa*, que además es la misma fuente que la tabla de arroz.
3. **Qué fila corresponde a cada poroto local.** *Recomiendo:* alubia → Great Northern (y Fagor «alubias blancas»); negros → Black beans; colorados → Kidney beans. Fagor no tiene negros ni colorados; la fila más cercana es «alubias pintas» (18–22 min).
4. **Pallares.** No figuran en NDSU ni en Fagor. *Recomiendo dejarlos afuera.*
5. **Arvejas partidas.** NDSU dice 30 min en la tabla y 35–40 min en el texto. *Recomiendo 30–40 min.*

### Notas

- Rinde en volumen: «2–2½» es por taza seca, como lo da la fuente.
- 1 lb = 453,6 g; 10 tazas = 2,4 l, o sea, unos 5,3 l por kilo para el remojo lento.

---

## 4. Agua y sal para la pasta

### Cuenta propuesta

- Entra: gramos de pasta seca.
- Sale: litros de agua = gramos ÷ 100; gramos de sal = litros × 7.
- Constantes: 1 l de agua cada 100 g de pasta; 7 g de sal por litro («un cucchiaino da thè di sale fino, abbondante se grosso»).

### Fuente

- Barilla, página de producto *Penne Rigate* (Italia) — https://www.barilla.com/it-it/prodotti/pasta/i-classici/penne-rigate — consultada el 2026-10-04 con `r.jina.ai`. «Istruzioni per la cottura»: «Per cuocere 100 grammi di pasta servono in media 1 litro di acqua e 7 gr di sale, ossia un cucchiaino da thè di sale fino, abbondante se grosso». El mismo texto aparece en las otras páginas de producto de Barilla que se abrieron.
- Lo confirma, en el agua: Cavanagh (2013, ver ítem 5): «5 litros de agua (lo recomendado para cocinar 0,5 kg de pasta)».

### Descartado

- Regla 1-10-100 (10 g de sal por litro): sólo apareció en blogs italianos que salieron en la búsqueda y no se abrieron.
- Miss Vickie (cinco niveles, de 3–4 a 11–12 g/l) y cupstogramscalculator: calculadoras (nivel 4). Se elige el fabricante.

### Decisiones para el usuario

Ninguna.

### Notas

- Barilla propone también la cocción pasiva: 2 minutos de cocción activa, apagar el fuego, tapar y esperar el tiempo de cocción. Cavanagh (ítem 5) la probó con pastas argentinas, con resultado positivo.

---

## 5. Tiempo de pasta seca por formato y medidor de espagueti

### Tabla propuesta (tiempos)

Minutos de cocción impresos en los paquetes de marcas argentinas, según la tabla 1 de Cavanagh (2013).

| Formato | Lucchetti | Matarazzo | Don Vicente |
|---|---|---|---|
| Espagueti | 10 | 7,5 | 8 |
| Tallarines | 6 | — | 8 |
| Fettuccini | — | 6 | 8 |
| Bucatini | 6 | — | — |
| Foratini | — | 9 | — |
| Mostachol | 9 | 9 (rayado) | — |
| Tirabuzón | 8 | 8 | — |
| Moño | 7 | 7 | — |
| Coditos | 8 | 8 | — |
| Dedalitos | 5 | — | — |
| Cabello de ángel | — | 4 | — |
| Ave María | 5 | 5 | — |
| Municiones | — | 5 | — |
| Nidos de fettuccine | 6 | — | — |

Alternativa del fabricante (Barilla Italia, páginas de producto): espagueti n.º 5, 9 min; linguine, 10; penne rigate, 11; fusilli, 11; farfalle, 12; pipe rigate, 10; sedanini rigati, 12; rigatoni, 12; tortiglioni, 12; conchiglie rigate, 12; bucatini, 8; ditalini rigati, 8.

Ñoquis secos: sin datos.

### Cuenta propuesta (medidor de espagueti)

- Entra: el diámetro del atado de espagueti seco, en cm (o el perímetro).
- Sale: gramos ≈ k × d², con k ≈ 19 g/cm²; y al revés, d = √(gramos ÷ k).
- Puntos que da la fuente: una porción de 2 oz (56,7 g) es un atado de 2⅛ pulgadas de circunferencia (5,40 cm, o sea, 1,72 cm de diámetro), lo que da k = 56,7 ÷ 1,72² = 19,2 g/cm². Con eso, 80 g ≈ 2,0 cm de diámetro y 100 g ≈ 2,3 cm.
- Comprobación: el paquete entero da 5¾ pulgadas de circunferencia (14,6 cm, o 4,65 cm de diámetro). Si el paquete es de 1 lb (453,6 g; la página no da el peso), sale k = 21,0. Las dos cifras quedan dentro de un 10 %.

### Fuente

- E. J. Cavanagh, «Ahorro de Gas Natural en la Cocción de Pastas», *Ciencia y Tecnología* 13, Universidad de Palermo, 2013, pp. 41–52, ISSN 1850-0870 — https://dspace.palermo.edu/ojs/index.php/cyt/article/download/42/35/ — consultado el 2026-10-04 con `pdftotext`. Tabla 1, «Tiempo de cocción de algunos tipos y marcas populares de pasta en Argentina»; el texto dice que los paquetes indican entre 4 y 10 minutos, con un promedio de 7.
- Barilla Italia, páginas de producto (`https://www.barilla.com/it-it/prodotti/pasta/i-classici/<formato>`: spaghetti-n-5, linguine, penne-rigate, fusilli, farfalle, pipe-rigate, sedanini-rigati, rigatoni, tortiglioni, conchiglie-rigate, bucatini, ditalini-rigati) — consultadas el 2026-10-04 con `r.jina.ai`, campo «Tempo di cottura».
- Barilla EE. UU., *Dry & Cooked Pasta Serving Size* — https://www.barilla.com/en-us/help-with/pasta-kitchen-tips/pasta-serving-size — consultada el 2026-10-04 con `r.jina.ai`. Pastas largas: porción de 2 oz = «2-1/8 inches (circumference)»; paquete = «5-3/4 inches (circumference)» (6 pulgadas el espagueti rigati).

### Descartado

- Barilla, tabla general de tiempos (inventario): había dado 403. Se reemplazó por las páginas de producto.
- Resúmenes de búsqueda con espagueti 8–10 min o penne 10–12, y la página de un súper con «Tirabuzón Lucchetti, cocción 3 minutos» (una línea de cocción rápida): no se abrieron.
- Omni, dry-to-cooked pasta (abierta): mide el atado por la circunferencia, pero no publica la fórmula ni las constantes.
- La «moneda de 25 centavos» como una porción (56 g según unos sitios, 85 g según otros): blogs, contradictorios.

### Decisiones para el usuario

1. **Tiempos: tabla argentina o Barilla.** La argentina es local y de los paquetes, pero de 2013, y la misma marca puede tener hoy líneas de cocción rápida. Barilla está al día, pero es de productos italianos y con otros tiempos (farfalle 12 contra moño 7). *Recomiendo la tabla argentina, mostrando el rango entre marcas por formato* (por ejemplo, espagueti 7,5–10 min), con la nota «el paquete manda».
2. **Medidor: qué k.** *Recomiendo k = 19 g/cm²*, el que sale del punto de la porción, que es el tamaño que se mide en la práctica.

### Notas

- Pulgadas a cm: × 2,54. Diámetro = circunferencia ÷ π.
- Ñoquis secos: ninguna fuente abierta los tiene.

---

## 6. Verduras al vapor y hervidas

### Tabla propuesta

Minutos para ½ kg de verdura. Hervidas: «en agua que apenas las cubra, que esté hirviendo y con poca sal». Fuente: Clínica Las Condes.

| Verdura (nombre local; en la fuente) | Corte | Vapor | Hervida |
|---|---|---|---|
| Alcaucil (alcachofa) | entero | 30–40 | 25–40 |
| Alcaucil | corazones | 10–15 | 10–15 |
| Arvejas | — | 3–5 | 8–12 |
| Berenjena | — | 15–20 | 10–15 |
| Remolacha (betarraga) | — | 40–60 | 30–60 |
| Brócoli | entero | 8–15 | 5–10 |
| Brócoli | ramitos | 5–6 | 4–5 |
| Coliflor | entera | 15–20 | 10–15 |
| Coliflor | ramitos | 6–10 | 5–8 |
| Champiñones | — | 4–5 | 3–4 |
| Espinaca | — | 5–6 | 2–5 |
| Espárragos | — | 8–10 | 5–12 |
| Morrón (pimentón) | — | 2–4 | 4–5 |
| Chauchas (porotos verdes) | — | 5–15 | 10–20 |
| Repollo | — | 6–9 | 10–15 |
| Repollitos de Bruselas | — | 6–12 | 5–10 |
| Zanahoria | entera | 10–15 | 15–20 |
| Zanahoria | en rodajas | 4–5 | 5–10 |
| Zapallo | — | 5–10 | 5–10 |
| Zapallito (zapallo italiano) | — | 5–10 | 5–10 |

La fuente trae también una columna de microondas (con sólo el agua del lavado).

### Fuente

- Universidad de Kentucky, Cooperative Extension Service, A. Cason, *Potatoes: Choosing, Storing, Preparing, and Enjoying* (FSHE-12, revisada 04-2025) — https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/FSHE12.pdf — consultada el 2026-10-08. Tabla 1: hervir papas medianas enteras «approximately 30-40 minutes»; al vapor, papas medianas en cuartos, «approximately 15-20 minutes». Es la fila de la papa, que Clínica Las Condes no trae.
- Clínica Las Condes (Chile), Centro de Nutrición, *Cocción de verduras* — https://www.clinicalascondes.cl/CENTROS-Y-ESPECIALIDADES/Centros/Centro-de-Nutricion/Nutricion/Coccion-de-Verduras — consultada el 2026-10-04. Se leyeron la tabla «Al vapor / Microonda / Hervir» con los nombres originales, la nota 1 («los tiempos son para ½ kg de verduras») y la indicación de cocinar en agua que apenas cubra, hirviendo y con poca sal. No tiene fecha.

### Descartado

- healwithfood.org (abierta): 42 filas sólo de vapor, sin fuente, y nada de hervidas. Es un sitio (nivel 4).
- Academy of Nutrition and Dietetics, *Cooking for Beginners: Vegetables* (2012; PDF alojado en K-State, abierto): es una asociación profesional, pero tiene sólo 8 filas de vapor (espárragos 4, brócoli 5, repollitos 10, zanahoria 6–8, coliflor 6, chauchas 5, arvejas 3, zucchini 4–5) y nada de hervidas.
- Betty Crocker, *Fresh Vegetable Cooking Chart* (abierta, en parte): hierve en «1 inch water» (unos 2,5 cm de agua, no sumergidas), es una marca editorial y la página no dejó leer la tabla completa. Sí se leyeron, entre otras: papas 15–20 min hervidas y 15–20 al vapor; choclo 5–7 y 5–7; zucchini 5–10 y 5–7.
- Eroski Consumer (2002, abierta): sólo hervidas y con tiempos muy largos (zanahorias 20–25, chauchas 30–35, remolacha 80–100).
- Fagor (abierta): tiene tiempos de verduras en olla a presión, pero no se pidieron.

### Decisiones para el usuario

1. **Faltan papa, batata, choclo y acelga.** *Recomiendo dejar la tabla con una sola fuente*, sin completarla. Si se quieren las papas y el choclo, la única cifra leída es de Betty Crocker (papas 15–20 min, choclo 5–7), que hierve con poca agua.

### Notas

- Los cortes son los de la fuente; donde no indica corte, la fila no lo distingue.

---

## 7. Blanqueado

### Tabla propuesta

Minutos en agua hirviendo, a nivel del mar. Fuente: NCHFP.

| Verdura | Tamaño o corte | Minutos |
|---|---|---|
| Espárragos | finos | 2 |
| Espárragos | medianos | 3 |
| Espárragos | gruesos | 4 |
| Chauchas | — | 3 |
| Habas, porotos lima o manteca | chicos / medianos / grandes | 2 / 3 / 4 |
| Brócoli | ramitos de 3,8 cm (1½ pulgadas) | 3 (al vapor: 5) |
| Repollitos de Bruselas | chicos / medianos / grandes | 3 / 4 / 5 |
| Repollo o repollo chino | cortado en tiras | 1½ |
| Zanahorias | chicas, enteras | 5 |
| Zanahorias | en cubos, rodajas o tiras | 2 |
| Coliflor | ramitos de 2,5 cm (1 pulgada) | 3 |
| Apio | — | 3 |
| Choclo en mazorca | chico / mediano / grande | 7 / 9 / 11 |
| Choclo en grano | — | 4 |
| Berenjena | — | 4 |
| Hojas verdes (acelga, espinaca y otras) | — | 2 |
| Hojas de berza (*collards*) | — | 3 |
| Hongos | enteros, al vapor | 5 |
| Hongos | botones o en cuartos, al vapor | 3½ |
| Hongos | en láminas, al vapor | 3 |
| Cebolla | hasta que se caliente el centro | 3–7 |
| Cebolla | en aros | 10–15 segundos |
| Arvejas | — | 1½ |
| Arvejas chinas (de vaina comestible) | — | 1½–3 |
| Morrón | mitades | 3 |
| Morrón | tiras o aros | 2 |
| Papas nuevas | — | 3–5 |
| Zapallito (*summer squash*) | — | 3 |
| Nabo o chirivía | cubos | 2 |
| Remolacha, zapallo, calabaza, batata | — | no se blanquean: se cocinan |

**Procedimiento** (lo que usa el temporizador):

- Agua: 1 galón por libra de verdura preparada, o sea, unos 8,3 l por kg.
- El tiempo se empieza a contar cuando el agua vuelve a hervir.
- Enfriado: en agua a 16 °C (60 °F) o menos, cambiándola seguido o con agua helada corriendo; hace falta más o menos 1 kg de hielo por kg de verdura. El enfriado dura lo mismo que el blanqueado.
- Al vapor, el tiempo es 1½ veces el del agua; la canasta va a 7,5 cm (3 pulgadas) o más del fondo, y se cuenta desde que se pone la tapa.
- Altitud: a 5.000 pies (1.524 m) o más, 1 minuto más que el tiempo a nivel del mar.

### Fuente

- National Center for Home Food Preservation (NCHFP, Universidad de Georgia), *Blanching Times* — https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-times/ — consultada el 2026-10-04. Se leyó la tabla completa y la nota «Blanching times are for water blanching unless otherwise indicated».
- NCHFP, *Blanching Vegetables* — https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-vegetables/ — consultada el 2026-10-04. Se leyeron: «Use one gallon water per pound of prepared vegetables»; contar el tiempo cuando el agua vuelve a hervir; enfriar en «cold water, 60ºF or below»; «about one pound of ice for each pound of vegetable»; el enfriado dura lo mismo que el blanqueado; al vapor, 1½ veces más y la canasta a 3 pulgadas del fondo; no recomienda el microondas.
- Colorado State University Extension, *High Elevation Food Preparation Guide* — https://foodsmartcolorado.colostate.edu/recipes/cooking-and-baking/high-elevation-food-preparation-guide — consultada el 2026-10-04: «At 5,000 feet elevation or higher, heat 1 minute longer than the blanching time given for sea level».

### Descartado

- frugalorganicmama (temporizador): sitio (nivel 4), no hace falta.
- «4 litros cada 450 g» (inventario): era un redondeo; la fuente dice 1 galón (3,785 l) por libra (453,6 g).
- «+1 min en altura» sin umbral (inventario): se completa con el umbral de Colorado State. Las páginas de NCHFP que se abrieron no hablan de altitud.

### Decisiones para el usuario

Ninguna.

### Notas

- La columna «Al vapor» de la app es 1½ veces la del agua, con la regla de NCHFP, salvo el brócoli (5 min, que NCHFP da al vapor) y los hongos (NCHFP los da sólo al vapor; al agua van «—»).

- El umbral de 1.524 m deja afuera a casi todo el país; lo pasan, por ejemplo, la Quebrada de Humahuaca y la Puna.
- Colorado State da también el punto de ebullición por altitud: 100 °C a nivel del mar, 97,8 °C a 2.000 pies (610 m), 95 °C a 5.000 pies (1.524 m), 92,2 °C a 7.500 pies (2.286 m) y 89,4 °C a 10.000 pies (3.048 m) (convertido desde 212, 208, 203, 198 y 193 °F).

---

## 8. Caldo

### Cuenta propuesta

- Entra: kilos de huesos (o carcasas o espinas) y el tipo de fondo.
- Sale: agua = 2 l por kg de huesos; mirepoix = 100–150 g por kg de huesos, repartidos en 2 partes de cebolla, 1 de zanahoria y 1 de apio; y el tiempo según el tipo.
- Cocción: se empieza con agua fría, sin sal, sin tapa y sin hervir (entre 85 y 95 °C), espumando.

| Tipo | Elemento principal | Antes de cocinar | Tiempo |
|---|---|---|---|
| Blanco de ave | carcasas y patas de pollo | crudo o blanqueado | 3–4 h |
| Blanco de ternera o vaca | huesos con articulación | blanqueado | 6–8 h |
| Oscuro (ternera, vaca, ave, caza) | huesos y recortes | tostados en horno a 200–220 °C de 45 min a 1 h, con tomate | 6–8 h |
| Fumet de pescado | espinas y cabezas de pescado blanco, sin agallas | desangradas en agua fría y sudadas en manteca | 20–30 min, y 10 min de reposo fuera del fuego |
| De verduras | cebolla, zanahoria, apio, puerro y hongos | sudadas o crudas | 45 min a 1 h |

### Fuente

- Instituto Gastronómico Internacional (IGI), Equipo Académico, *Fondos de cocina: fondo blanco, oscuro, fumet y glace paso a paso*, 2026-09-21 — https://www.igi-la.com/blog/fondos-de-cocina-guia/ — consultada el 2026-10-04 con `r.jina.ai`. Se leyeron: «1 kilo de huesos por 2 litros de agua, con 100 a 150 gramos de mirepoix por kilo de huesos»; mirepoix 2:1:1; la tabla «Proporciones y tiempos de cocción de referencia»; los procedimientos de cada fondo; y las reglas (agua fría, nunca hervir, sin sal, sin tapa, 85–95 °C, enfriar rápido). Dice además que con 1,5 kg y 3 l «se obtienen entre 1,2 y 1,5 litros de fondo terminado», y que el fondo dura 3–4 días en la heladera y hasta 3 meses en el freezer.

### Descartado

- joteo, *Bone Broth Ratio Calculator* (inventario): calculadora, no se abrió.
- Ruhlman, *Ratio* (3 de agua por 2 de hueso): es un libro que no se pudo abrir.
- La regla de 8 lb de huesos, 6 cuartos de galón de agua y 1 lb de mirepoix (atribuida al CIA): sólo resultados de búsqueda de foros y sitios personales, no se abrieron.
- Instant Pot (abierta): «Stock / Bone Broth» de vaca 4 h, pollo 2 h y pescado 30–45 min en olla eléctrica, sin proporciones.
- Las proporciones del inventario (de 32 a 67 % de hueso por agua): mezcla de fuentes sin abrir.

### Decisiones para el usuario

1. **¿La proporción de 2 l por kg vale para el fumet y el de verduras?** IGI la da como regla general, junto a un ejemplo de ave; la tabla por tipo no repite la proporción. *Recomiendo aplicar los 2 l/kg a los fondos de hueso y al fumet, y para el de verduras pedir sólo el agua*, porque IGI no da proporción de verduras por litro.
2. **¿Se entra por kilos de huesos o por litros deseados?** El rinde que da IGI (1,2–1,5 l) es ambiguo: no queda claro si es por kilo o para el ejemplo de 1,5 kg. *Recomiendo entrar por kilos de huesos*, que no depende del rinde.
3. **Nivel de la fuente.** IGI es una escuela de cocina con sede argentina (nivel 2–3), no un organismo oficial; no hay ninguna fuente oficial de caldos. *Recomiendo usarla*, porque es la única que cubre los cuatro tipos de manera coherente.

### Notas

- IGI distingue fondo (huesos, sin sal, base) de caldo (con carne, salado, se toma tal cual). La herramienta calcula fondos.
- Por inocuidad, IGI pide enfriar en baño de hielo o en recipientes bajos antes de llevar a la heladera.

---

## Lo que no se pudo verificar

- Agua para el arroz en **arrocera**: ninguna fuente da proporción ni tiempo (USA Rice remite al fabricante del aparato).
- **Reposo del arroz** de una fuente de nivel 1 a 3 para todas las variedades (sólo hay el de Nestlé para el yamaní y el de la prensa).
- Rinde del arroz **en peso** coherente (USA Rice da «2+» y una cuenta que da 3,4).
- **Polenta instantánea**: la proporción del paquete de Presto Pronta.
- **Rinde del cuscús y de la avena arrollada.**
- Legumbres: **pallares**; **arvejas secas en olla a presión** de una fuente con la presión declarada; **rinde en peso** de seco a cocido.
- Pasta: **ñoquis secos**; tiempos argentinos posteriores a 2013.
- Verduras hervidas y al vapor: **papa, batata, choclo y acelga** en la fuente elegida.
- Caldo: **proporción de verduras por litro** para el fondo de verduras y un **rinde** inequívoco.
