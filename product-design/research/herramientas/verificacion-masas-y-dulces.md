# Verificación: masas y dulces (P117)

Verificación de las fuentes del inventario para P117, hecha el 2026-10-04. Cada número de este documento sale de una página abierta ese día; lo que no se pudo abrir está marcado o quedó afuera.

## Resumen

| Ítem | Estado | Tipo | Fuente elegida |
|---|---|---|---|
| 1. Masa para un molde de torta | con decisión | cuenta | Wilton (cuánto se llena) + AIB International (densidad) |
| 2. Capacidades de moldes | con decisión | tabla + cuenta | El Nuevo Emporio (catálogo argentino de moldes) |
| 3. Gramos de masa por pieza | listo | tabla | Puratos Argentina (recetas de panadería) |
| 4. Pasta fresca | con decisión | cuenta | Informacibo (huevo y harina), Casa di Langa (yemas), Galbani (sémola), Decreto 4238/68 y USDA (huevo y yema) |
| 5. Masas por plato | con decisión | tabla | Cocineros Argentinos (ñoquis, tapas de empanada), Maseca (tortillas de maíz), Just One Cookbook (ramen), CharWok (tapas de dumplings) |
| 6. Bollo de pizza según diámetro | con decisión | tabla | AVPN (napolitana), comemelapizza (al molde); a la piedra queda afuera |
| 7. Puntos del azúcar | con decisión | tabla + ajuste | CSU Extension (temperaturas y altitud) + Wikipedia (hilo y caramelo) |
| 8. Merengue por peso de claras | con decisión | cuenta | Larousse Cocina (los tres tipos, con gramos de clara) |

---

## 1. Masa para un molde de torta según sus medidas

### Cuenta propuesta

Entra: forma (redondo, cuadrado o rectangular, con tubo), medidas en cm y alto en cm. Sale: capacidad en litros y gramos de masa cruda.

- Volumen del molde (cm³ = ml):
  - redondo: `V = π · (d/2)² · alto`
  - cuadrado o rectangular: `V = largo · ancho · alto`
  - con tubo (savarín): `V = π · (R² − r²) · alto` (se resta el tubo)
- Masa: `gramos = V · llenado · densidad`
  - `llenado` = de 0,5 a 0,67 (de la mitad a dos tercios). Valor por defecto propuesto: 0,6.
  - `densidad` = 0,85 g/ml para torta o budín (punto medio de 0,8–0,9) y 0,5 g/ml para bizcochuelo o pionono.

Ejemplo: molde de bizcochuelo n.º 24, alto 6 cm → V = 2714 ml; con llenado 0,6 → 1384 g de masa de torta (0,85) u 814 g de bizcochuelo (0,5). Un bizcochuelo clásico de 24 cm (6 huevos, 180 g de azúcar, 180 g de harina) pesa unos 720 g: con 0,85 la cuenta daba casi el doble, y por eso el bizcochuelo tiene su densidad.

### Fuente

- Wilton, *Cake Baking & Serving Guide* — https://wilton.com/baking-inspiration/cake-baking-serving-guide/ (2026-10-04). Leído: «Fill pans 1/2 to 2/3 full» para tortas de 4" de alto; los moldes de 3" se llenan a la mitad. Columna «Cups Batter 1 Layer, 2 in»: redondo 6" 2¼ tazas, 8" 4, 10" 6, 12" 8; cuadrado 6" 3, 8" 6, 10" 9; hoja 9×13" 10, 12×18" 16.
  - Comprobación propia: con taza de 240 ml y 1" = 2,54 cm, esas tazas llenan entre el 52 % (redondo 12") y el 69 % (cuadrado 8") de un molde de 2" de alto. Coincide con «½ a ⅔».
- BAKERpedia, *Specific Gravity for Cakes* — https://bakerpedia.com/processes/specific-gravity-cakes/ (2026-10-08). Leído: chocolate cake 0.90, cream cake 0.85, pound cake 0.80, white or yellow cake 0.70, devil's food 0.70, sponge cake 0.50, angel food 0.30; «with aeration, specific gravity is usually between 0.40 to 0.80». Es la densidad del bizcochuelo o pionono.
- AIB International, blog Food First, *Q&A: Is taking a specific gravity measurement necessary for cake batter…* — https://blog.aibinternational.com/en/food-first-blog/postid/948/qa-is-taking-a-specific-gravity-measurement-necessary-for-cake-batter-during-or-after-mixing (2026-10-04). Leído: «most batter cakes should be in the range of 0.8 to 0.9» (gravedad específica, igual a g/ml).
- Goizalde, *Moldes y capacidades* — https://cocinandocongoizalde.com/2013/04/23/moldes-y-capacidades/ (2026-10-04). Leído: las tres fórmulas de volumen (rectangular, redondo, con agujero restando el agujero) y que se mida la capacidad con agua como alternativa.

### Descartado

- Chelsweets (https://chelsweets.com/how-much-cake-batter-per-pan/, abierta): tazas por capa de 1" y la fórmula π·r²·alto; es un blog y no da densidad. Wilton es el fabricante.
- Densidades de artículos científicos (abiertos): bizcochuelo batido 0,77 g/cm³ (PMC5629162, https://pmc.ncbi.nlm.nih.gov/articles/PMC5629162/) y masa con aceite y polvo de hornear 1,061 g/cm³ (PMC11629245, https://pmc.ncbi.nlm.nih.gov/articles/PMC11629245/). Son una receta cada uno; AIB da el rango general de la industria. Se usan sólo para la nota de abajo.
- «100 g de masa por persona» y «8 huevos para molde de 24»: sólo en resultados de búsqueda, sin abrir.

### Decisiones para el usuario

- **Llenado por defecto.** Wilton da un rango. Recomiendo 0,6 fijo y no pedirlo; si se quiere, un selector «mitad / dos tercios».
- **Una densidad o dos.** Recomiendo una sola (0,85). Un bizcochuelo batido queda más liviano (0,77 en el artículo) y una masa con aceite más pesada (1,06): la diferencia (±10–25 %) es menor que la del llenado.

### Notas

- La cuenta da masa cruda, no rinde ni porciones.
- Bakemag (gravedades por tipo de torta) dio 403.

---

## 2. Capacidades de moldes

### Tabla propuesta

En Argentina el número del molde es el diámetro en cm (Distribuidora Fénix: «el número representa el diámetro en centímetros»). La capacidad es la cuenta del ítem 1 sobre las medidas del catálogo; con paredes inclinadas la capacidad real es menor (ver Notas).

Medidas de El Nuevo Emporio:

| Molde | Alto | Números (diámetro en cm) |
|---|---|---|
| Bizcochuelo (fijo o desmontable) | 6 cm | 16 a 32 (desmontable desde 10) |
| Tortera cónica | 6 cm | 20 a 32 |
| Tortera boda (fija o desmontable) | 8 cm | 12 a 32 |
| Tortera boda alta (fija o desmontable) | 10 cm | 12 a 32 (desmontable desde 10) |
| Tartera (fija, desmontable, rizada) | 4 cm | 10 a 35 |
| Tartera rizada alta | 5 cm | 16, 24, 28 |
| Savarín bajo (cónico, con tubo) | 6 cm | 22 a 32 |
| Savarín boda (recto, con tubo) | 8 cm | 22 a 32 |
| Pizzera | 2 cm | 10 a 35 |
| Molde de pan dulce 1 kg | 11 cm | 16 |
| Molde de pan dulce 2 kg | 10 cm | 20 |

Placas (largo × ancho × alto): 30×40×2 cm (2,4 l), 35×45×2 cm (3,15 l), 40×60×2 cm (4,8 l).
Cuadrados con pestaña de 10×10 a 30×30 cm y rectangulares de 10×20 a 20×30 cm; el catálogo no da el alto.

Capacidad calculada (litros, paredes rectas):

| Diámetro | Tartera 4 cm | Bizcochuelo 6 cm | Boda 8 cm | Boda alta 10 cm |
|---|---|---|---|---|
| 16 | 0,80 | 1,21 | 1,61 | 2,01 |
| 18 | 1,02 | 1,53 | 2,04 | 2,54 |
| 20 | 1,26 | 1,88 | 2,51 | 3,14 |
| 22 | 1,52 | 2,28 | 3,04 | 3,80 |
| 24 | 1,81 | 2,71 | 3,62 | 4,52 |
| 26 | 2,12 | 3,19 | 4,25 | 5,31 |
| 28 | 2,46 | 3,69 | 4,93 | 6,16 |
| 30 | 2,83 | 4,24 | 5,65 | 7,07 |
| 32 | 3,22 | 4,83 | 6,43 | 8,04 |

Budineras: no hay numeración estándar; se mide largo × ancho × alto interior. Ejemplos de fabricantes:

| Budinera | Medidas | Capacidad declarada |
|---|---|---|
| Kuchen antiadherente | interior 23,3 × 13 × 6 cm | 1,5 l |
| Betty Crocker aluminio | interior 25 × 14 × 6 cm | — |
| Joy of Baking, 8×4×2½" | 20 × 10 × 6 cm | 948 ml |

### Fuente

- El Nuevo Emporio, *Artículos de aluminio* — https://elnuevoemporio.com.ar/productos-reposteria-aluminio.html (2026-10-04). Leído: el catálogo entero de torteras, tarteras, bizcochueleras, savarines, pizzeras, placas y moldes cuadrados con sus medidas.
- El Nuevo Emporio, *Moldes para budín* — https://elnuevoemporio.com.ar/productos-reposteria-moldes-budin.html (2026-10-04). Leído: Betty Crocker 25 × 14 × 6 cm interior.
- Distribuidora Fénix, *Molde de torta n.º 22* — https://distribuidorafenix.com.ar/producto/molde-torta-n-22-redondo-de-aluminio/ (2026-10-04). Leído: el número es el diámetro en cm.
- Kuchen Bazar, *Budinera antiadherente 1,5 L* — https://www.kuchenbazar.com.ar/productos/budinera-antiadherente-de-aluminio-molde-para-horno-15-l/ (2026-10-04). Leído: interior útil 23,3 × 13 × 6 cm, 1,5 l.
- Joy of Baking, *Pan Sizes* — https://www.joyofbaking.com/PanSizes.html (2026-10-04). Leído: redondo 20×4 cm 948 ml, 23×5 cm 1,9 l, 25×5 cm 2,6 l; desmontable 23×6 cm 2,4 l, 25×6 cm 2,8 l; bundt 23×8 cm 2,1 l, 25×9 cm 2,8 l; rectangular 33×23×5 cm 3,3 l; budinera 20×10×6 cm 948 ml; arrollado 27×39×2,5 cm 2,4 l.

### Descartado

- Joy of Baking como tabla principal: medidas de EE. UU. que no se venden así acá. Sirve para la nota de abajo.
- DPMSA (https://dpmsa.com.ar/linea-aluminio/budineras/, abierta): budineras descartables (300 a 1000 cm³), no de uso doméstico.
- Tramontina Paris 30 cm 1,9 l y MTA n.º 2 y n.º 3: sólo en resultados de búsqueda; las páginas no abrieron (DNS o 403). Moderno Bazar dio medidas exteriores de la Tramontina (33,7 × 13,3 × 7,2 cm) sin capacidad.
- Sodimac Argentina (abierta): budinera de silicona Carol 25,5 × 11,5 × 6,5 cm, sin capacidad.

### Decisiones para el usuario

- **Tabla o cuenta.** Recomiendo que la herramienta sea la cuenta del ítem 1 (forma + medidas → litros), con los números y altos de El Nuevo Emporio como atajos para elegir. Una tabla fija de litros no agrega nada que la cuenta no dé.
- **Savarín.** El catálogo no da el diámetro del tubo; sin eso no se calcula. Recomiendo pedir el diámetro del tubo o dejar el savarín afuera.

### Notas

- La capacidad real de un molde con paredes inclinadas es menor que la cuenta: el 20×4 cm de Joy of Baking da 1,24 l en la cuenta y declara 948 ml (77 %); la budinera Kuchen da 1,82 l y declara 1,5 l (83 %). La salida tiene que decir «aproximado» o sugerir medirlo con agua (Goizalde).
- Conversión de Joy of Baking: 1" = 2,54 cm, como la publica la página.

---

## 3. Gramos de masa por pieza

### Tabla propuesta

Peso de la masa cruda al dividir.

| Pieza | Gramos | Receta de Puratos Argentina |
|---|---|---|
| Pan de hamburguesa | 80 | Pan de hamburguesa (y de papa clásico) |
| Pan de hamburguesa artesanal | 75 | Pan de hamburguesas tipo artesanal |
| Pan de pancho | 40 | Pan de pancho |
| Pan de Viena | 100 | Pan de Viena |
| Pan de pebete | 100 | Pan de pebete |
| Pan flauta | 100 | Pan flauta |
| Pan francés | 120 | Pan francés |
| Baguette | 250 | Baguette rústica S500 Acti-Plus |
| Bagel | 85 | Bagel de granos andinos |
| Grisín | 30 | Grisines de queso y semillas |
| Medialuna de manteca | 50 | Medialunas de manteca |
| Factura | 50 | Facturas |
| Pan de molde | 380–400 | Pan de molde tipo artesanal (380), lacteado (400) |
| Pan de campo | 500 | Pan de campo |
| Pan dulce de 500 g | 530 | Panettone |

### Fuente

Puratos Argentina, recetas (todas abiertas el 2026-10-04):
- https://www.puratos.com.ar/es/recipes/pan-de-hamburguesa0 — «Cortar piezas de 80 g y bollar».
- https://www.puratos.com.ar/es/recipes/pan-de-hamburguesa-de-papa-clasico — división de 80 g.
- https://www.puratos.com.ar/es/recipes/pan-de-hamburguesas-tipo-artesanal — «Dividir la masa en bollos de 75 g».
- https://www.puratos.com.ar/es/recipes/pan-de-pancho — «División: 40 g».
- https://www.puratos.com.ar/es/recipes/pan-de-viena — piezas de 100 g.
- https://www.puratos.com.ar/es/recipes/pan-de-pebete — 100 g.
- https://www.puratos.com.ar/es/recipes/pan-flauta — «Cortar piezas de 100 g».
- https://www.puratos.com.ar/es/recipes/pan-frances — 120 g, armado tipo baguette.
- https://www.puratos.com.ar/es/recipes/baguette-rustica — 250 g.
- https://www.puratos.com.ar/es/recipes/bagel-de-granos-andinos — 85 g.
- https://www.puratos.com.ar/es/recipes/grisines-de-queso-y-semillas — 30 g.
- https://www.puratos.com.ar/es/recipes/medialunas-de-manteca — triángulos de 50 g.
- https://www.puratos.com.ar/es/recipes/facturas0 — «aproximadamente 50 g cada uno».
- https://www.puratos.com.ar/es/recipes/pan-de-molde-lacteado — 400 g.
- https://www.puratos.com.ar/es/recipes/pan-de-molde-tipo-artesanal — «380 g aproximadamente».
- https://www.puratos.com.ar/es/recipes/pan-de-campo0 — 500 g.
- https://www.puratos.com.ar/es/recipes/panettone0 — «Cortar piezas de 530 g», rinde piezas de 500 g.

### Descartado

- Pantry Mama (https://pantrymama.com/dough-weights-for-common-bread-shapes/, abierta): hamburguesa 90 o 140 g, pancho 100, pancito 50, bagel 75 o 100, grisín 25–30, tortilla 40–50, muffin inglés 80, pretzel 70. Es un blog de EE. UU.; Puratos es fabricante argentino y da las piezas que se hacen acá.
- The Fresh Loaf (https://www.thefreshloaf.com/node/23352/dough-ball-sizes-common-bread-shapes, abierta): baguette casera 200–250 g, bagel 96–113 g, pancito 48 g. Foro.
- Grisines de Spekkel de Puratos (10 g): son de hojaldre.

### Decisiones para el usuario

Ninguna: la tabla sale de una sola fuente argentina.

### Notas

- Son recetas para panadería: el pan de pancho de 40 g es el industrial chico; el de Viena (100 g) es el grande.

---

## 4. Pasta fresca

### Cuenta propuesta

Entra: porciones y tipo de masa. Sale: harina (o sémola), huevos, yemas o agua, y sal.

| Masa | Por porción | Fuente |
|---|---|---|
| Al huevo | 100 g de harina + 1 huevo | Informacibo |
| De yemas (tajarin) | 100 g de harina + 3 a 4 yemas | Casa di Langa (30–40 yemas por kg) |
| De sémola y agua | 100 g de sémola + 50 ml de agua | Galbani (400 g + 200 ml) |
| Sal | una pizca | Informacibo y Galbani |

Peso del huevo y de la yema:

| Dato | Valor | Fuente |
|---|---|---|
| Huevo grande (grado 1), con cáscara | 54 g mínimo | Decreto 4238/68, 22.4.1 |
| Huevo extra grande (grado IS) / mediano (2) / chico (3) | 62 / 48 / 42 g mínimo | Decreto 4238/68, 22.4.1 |
| Huevo grande sin cáscara | 50 g | USDA FoodData Central |
| Yema de huevo grande | 17 g | USDA FoodData Central |
| Partes del huevo | yema 30–33 %, clara ~60 %, cáscara ~9 % | Instituto de Estudios del Huevo |

### Fuente

- Informacibo, *Guida alla pasta all'uovo*, Ines Roscio Pavia — https://www.informacibo.it/fare-la-pasta-alluovo-tagliatelle-lasagne-pappardelle/ (2026-10-04). Leído: «un uovo per un etto di farina per ogni persona»; para 6, 500 g y 5 huevos o 600 g y 6; «1 pizzico sale».
- Casa di Langa, *Tajarin* — https://www.casadilanga.com/it/tavola-e-calici/tajarin-pasta/ (2026-10-04). Leído: «30-40 tuorli per chilogrammo di farina, talvolta anche più».
- Galbani, *Come fare le orecchiette pugliesi* — https://www.galbani.it/abcucina/come-fare/trucchi-e-segreti-per-la-pasta-fresca/come-fare-le-orecchiette-pugliesi (2026-10-04). Leído: 400 g de sémola rimacinata de trigo duro y 200 ml de agua, «un pizzico di sale».
- Decreto 4238/68, cap. XXII, *Huevos y ovoproductos* — https://www.argentina.gob.ar/normativa/recurso/24788/dn4238-1968cap22/htm (2026-10-04). Leído, 22.4.1: grado IS 62 g por unidad y 744 g por docena; grado 1, 54 y 648; grado 2, 48. Grado 3 (42 g) y los nombres (extra grande, grande, mediano, chico) en InfoAlimentos, https://www.infoalimentos.org.ar/temas/nutricion-y-estilos-de-vida/478-huevo-un-alimento-nutritivo-y-versatil (abierta).
- USDA FoodData Central, API: *Egg, yolk, raw, fresh* — https://api.nal.usda.gov/fdc/v1/food/172184 («Large egg yolk» 17 g), y *Egg, whole, raw, fresh* — https://api.nal.usda.gov/fdc/v1/food/171287 (large 50 g, extra large 56, jumbo 63, medium 44, small 38) (2026-10-04).
- Instituto de Estudios del Huevo, *Estructura del huevo* — https://www.institutohuevo.com/estructura_huevo/ (2026-10-04). Leído: yema «entre un 30% y un 33%», clara «aproximadamente un 60%», cáscara «alrededor de un 9%».

### Descartado

- Cocineros Argentinos, *Tallarines al huevo* (https://cocinerosargentinos.com/recetas/arroces-y-pastas/tallarines-al-huevo-con-bolognesa-y-pesto-argentino, abierta): 500 g de harina 0000, 5 huevos y 50 cc de aceite para 4 porciones (125 g por porción). Mismo huevo cada 100 g; ver la decisión sobre la porción.
- Handy Chef Dom (https://handychefdom.com/pasta-dough-ratio-calculator/, abierta): 100 g principal, 60 g entrada, 130 g rellena; 4–5 yemas por 100 g; sémola con 45–50 ml de agua; sal 1 g por 100 g. Sitio de calculadoras.
- Miss Vickie (https://missvickie.com/pasta-dough-serving-calculator/, abierta): 100 g por porción, 1 g de sal, 5 ml de aceite, sémola con 60 ml de agua. Blog.
- El depósito de la tagliatella en la Cámara de Comercio de Bolonia (Sala Borsa, abierta) sólo fija el ancho (7 mm cruda, 8 mm cocida), no la proporción.

### Decisiones para el usuario

- **Harina por porción.** 100 g (Informacibo) o 125 g (Cocineros Argentinos). Recomiendo 100 g, la regla italiana de «un huevo y cien gramos por persona», que además deja el huevo entero.
- **Entrada y pasta rellena** (60 y 130 g) sólo tienen fuente de calculadora. Recomiendo dejarlas afuera y que la cuenta tenga una sola porción.
- **Sal.** Las fuentes dicen «una pizca»; el único número (1 g cada 100 g) es de calculadora. Recomiendo mostrar «una pizca».

### Notas

- Los pesos del Decreto son mínimos con cáscara. Con el 9 % de cáscara del Instituto, un grado 1 de 54 g deja ~49 g sin cáscara y ~16–18 g de yema: coincide con el USDA (50 y 17 g).
- 30–40 yemas por kg = 3 a 4 por cada 100 g.

---

## 5. Masas por plato

### Tabla propuesta

| Plato | Por porción o por pieza | Fuente |
|---|---|---|
| Ñoquis de papa | por porción: 250 g de puré, 50 g de harina, ¼ a ½ huevo, queso rallado y sal | Cocineros Argentinos (1 kg de puré, 200 g de harina, 1–2 huevos, 4 porciones) |
| Tortilla de maíz | 30 g por tortilla de 12 cm; masa: 2 tazas de harina de maíz y 1½ de agua → 19 tortillas | Maseca |
| Tortilla de harina | 40–50 g por tortilla | Pantry Mama |
| Fideos de ramen | frescos 142–170 g por persona; secos 90 g | Just One Cookbook |
| Tapas de dumplings | 250 g de harina + 130 g de agua → ~30 tapas de 8 cm (~13 g cada una) | CharWok |
| Tapas de empanada caseras | 1 kg de harina 0000, 150 g de grasa, 500 cc de agua, 20 g de sal → ~48 tapas (~35 g cada una) | Cocineros Argentinos |
| Tapa de empanada comprada | 27,5 g (12 tapas = 330 g) | La Salteña |

### Fuente

- Cocineros Argentinos, *Ñoquis de papa* — https://cocinerosargentinos.com/recetas/economicas/noquis-de-papa (2026-10-04). Leído: 4 porciones; 1 kg de puré de papa, 200 g de harina 0000/000 aprox., 1 a 2 huevos, un puñado de queso rallado, sal, 1 cdita de polvo de hornear, nuez moscada.
- Maseca, *Tortillas* — https://www.mimaseca.com/es/recetas/tortillas/ (2026-10-04). Leído: 2 tazas de harina de maíz Maseca, 1½ tazas de agua, 19 bolitas de 1 onza (30 g), tortilla de «5 pulgadas (12 cm)».
- Pantry Mama — https://pantrymama.com/dough-weights-for-common-bread-shapes/ (2026-10-04). Leído: «Flatbreads/tortillas: 40-50g».
- Just One Cookbook, *Ramen Noodles* — https://www.justonecookbook.com/ramen-noodles/ (2026-10-04). Leído: frescos «roughly 5 to 6 oz (142 to 170 g) per person»; secos «about 1 to 2 bundles (3 oz, 90 g) per person».
- CharWok, *Chinese dumplings, an ultimate how-to guide* — https://charwok.com/dumpling-guide/ (2026-10-04). Leído: 250 g de harina común y 130 g de agua, «alrededor de 30» tapas de unos 8 cm, con 450 g de relleno para 30 dumplings.
- Cocineros Argentinos, *Tapas de empanadas* — https://cocinerosargentinos.com/masas-saladas/tapas-de-empanadas (2026-10-04). Leído: 1 kg de harina 0000, 150 g de grasa vacuna (o manteca), 500 cc de agua tibia, 20 g de sal; «Salen 4 docenas aprox.»; bollitos como una pelota de ping pong, estirados a 2 mm.
- Casa Segal, *Tapa de empanadas horno x 12 u La Salteña 330 g* — https://www.casa-segal.com/producto/tapa-de-empanadas-horno-x-12u-la-saltena-330g/ (2026-10-04). Leído: 12 unidades, 330 g.

### Descartado

- Ñoquis, otras recetas abiertas: Cocineros Argentinos *Ñoquis caseros* (http://cocinerosargentinos.com/arroces-y-pastas/noquis-caseros): 700 g de papa cruda (½ kg de puré), 150–200 g de harina, 1 huevo, 4 porciones; Paulina Cocina (https://www.paulinacocina.net/receta-de-gnocchi-o-noquis/12020): 1 kg de papa, 300 g de harina, 1 huevo, 4 porciones; La Nación (https://www.lanacion.com.ar/recetas/noquis-de-papa-nid09122020/): 1 kg de papa, 350 g de harina, 1 huevo grande, sin porciones.
- Cocineros Argentinos, *Masa para tapas de empanadas* (https://cocinerosargentinos.com/panes/masa-para-tapas-de-empanadas, abierta): 1 kg de harina 000, 150 g de grasa, 450 cc de agua, 10 g de sal; no dice cuántas tapas.
- Directo al Paladar, tortillas de maíz (abierta): 1 kg de harina rinde 20 tortillas de 20 g, que no cierra.
- Larousse Cocina, tortillas de harina y de maíz (abiertas): no dan peso ni rinde.
- Sun Noodle (fabricante de ramen): el sitio no abrió (DNS).
- Red House Spice (tapas de dumplings): 403; CharWok publica la misma guía.

### Decisiones para el usuario

- **Ñoquis.** Las fuentes argentinas van de 125 a 250 g de puré por porción y de 20 % a 35 % de harina sobre la papa. Recomiendo la de Cocineros Argentinos (1 kg de puré, 200 g de harina, 4 porciones), la única que pesa el puré y no la papa cruda.
- **Tapas de empanada.** Caseras (~35 g, Cocineros) o compradas (27,5 g, La Salteña). Recomiendo la casera, que es la que se calcula; la comprada ya viene hecha.
- **Tortilla de harina** sólo tiene un blog de EE. UU. Recomiendo dejarla, con la fuente a la vista, o sacarla si se quiere sólo fuentes de primera mano.

### Notas

- El peso de cada tapa casera es cuenta propia: (1000 + 150 + 500 + 20) g ÷ 48 ≈ 35 g.
- 1 onza = 28,35 g; Maseca redondea a 30 g y 5" = 12,7 cm a 12 cm.
- No hay fuente abierta de cuántos dumplings por persona.

---

## 6. Bollo de pizza según el diámetro

### Tabla propuesta

Napolitana (AVPN):

| Diámetro de la pizza | Bollo |
|---|---|
| 22–24 cm | 200 g |
| 28–35 cm | 280 g |

Al molde argentina (comemelapizza), por número de pizzera:

| Molde | Bollo | g/cm² (cuenta propia) |
|---|---|---|
| n.º 32 | 350–380 g | 0,44–0,47 |
| n.º 34 | 380–420 g | 0,42–0,46 |
| n.º 36 | 420–500 g | 0,41–0,49 |

Para otros números: `bollo = 0,45 · π · (n/2)²` g (n = número del molde = diámetro en cm).

A la piedra: **sin datos**, queda afuera.

### Fuente

- AVPN, *Disciplinare* 2024 (en inglés) — https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf (2026-10-04). Leído: «200 g portion (pizza diameter 22-24 cm) – 280 g portion (pizza diameter 28-35 cm)»; en otra parte, «200 - 280 g, to obtain a pizza with a diameter between 22 and 35 cm». Centro de 0,25 cm (±10 %), borde de 1–2 cm; sal de 40 a 60 g por litro de agua; horno 380–430 °C en la base, 60–90 s.
- Comemelapizza, *Masa de pizza argentina* — https://www.comemelapizza.com/masa-de-pizza-argentina/ (2026-10-04). Leído: molde 32 350–380 g, 34 380–420 g, 36 420–500 g; 1 kg de harina y 600 g de agua (60 %).
- El Nuevo Emporio (catálogo, ítem 2): pizzeras de 2 cm de alto, 10 a 35 cm de diámetro; el número es el diámetro (Distribuidora Fénix).

### Descartado

- Ooni (napolitana 250 g para 30 cm y 336 g para 35 cm; NY 380 g para 40 cm): verificada en la investigación anterior; para la napolitana manda la AVPN.
- Cocineros Argentinos, *Pizza a la piedra y media masa* (https://cocinerosargentinos.com/pizzas/pizza-a-la-piedra-y-media-masa, abierta): piedra con bollos de 300 g, sin diámetro; media masa con bollos de 600 g para 30 cm (0,85 g/cm², casi el doble que comemelapizza).
- Cocineros Argentinos, *Pizza especial al molde* (abierta): bollos de 400 g, sin número de molde.
- Vinomanos (APPyCE, abierta): hidrataciones de media masa y piedra, sin pesos de bollo ni diámetro.
- Alfa Forni, «pizza a la piedra» (abierta): 550–600 g para 35–40 × 60–70 cm; es la pizza romana en pala, no la piedra porteña.
- Pantry Mama y The Fresh Loaf (pizzas en pulgadas): blogs de estilos de EE. UU.

### Decisiones para el usuario

- **Napolitana entre 24 y 28 cm.** La AVPN da dos escalones, no un factor: su peso por cm² va de 0,53 (22 cm) a 0,29 (35 cm). Recomiendo mostrar la tabla tal cual (200 g hasta 24 cm, 280 g desde 28 cm) y, entre 25 y 27 cm, 240 g como punto medio declarado como tal; o no ofrecer esos diámetros.
- **Al molde con un factor.** Comemelapizza es un blog, pero es la única fuente que liga el peso al número del molde, y sus tres filas dan casi el mismo factor (~0,45 g/cm²). Recomiendo usarla con el factor para los demás números. Cocineros Argentinos (600 g para 30 cm) queda descartada por ser otro estilo, más alto.
- **A la piedra** queda afuera hasta encontrar una fuente con diámetro.

### Notas

- Cuenta del factor: 365 g ÷ (π · 16²) = 0,45; 400 ÷ (π · 17²) = 0,44; 460 ÷ (π · 18²) = 0,45 (puntos medios).
- En un resultado de búsqueda (página sin abrir, DNS) una pizzera enlozada n.º 32 medía 30,2 cm adentro: en algunas marcas el número puede ser la medida exterior.

---

### Estilos a la piedra y media masa (2026-10-08)

La al molde (Comemelapizza: n.º 32 350–380 g, n.º 34 380–420 g, n.º 36 420–500 g, ~0,45 g/cm²) se sacó: da la mitad de masa por cm² que la media masa, que es más baja, y su propia receta saca tres bollos de ~550 g de 1 kg de harina.

- **A la piedra:** viene de la romana tonda. Rita Gallina, *Pizza tonda romana croccante* — https://www.artebiancaconrita.com/post/pizza-tonda-romana-croccante-ricetta-professionale-e-tecnica-completa (2026-10-08): panetto de «200 g», pizza de «circa 35 centimetri» (0,21 g/cm²). Il Giornale, *Bassa e "scrocchiarella": come piace la pizza romana* — https://www.ilgiornale.it/news/cucina/bassa-e-scrocchiarella-come-piace-la-pizza-romana/ (2026-10-08): Futura Pizzeria Romana, «160 grammi» para «32 cm» (0,20 g/cm²). Se usa 0,2 g/cm². Las recetas argentinas dan el bollo sin diámetro: Cocineros Argentinos 300 g, El Gourmet 250 g; con 0,2 g/cm² son pizzas de 40 a 44 cm.
- **Media masa:** Cocineros Argentinos, *Pizza a la piedra y media masa* — https://cocinerosargentinos.com/pizzas/pizza-a-la-piedra-y-media-masa (2026-10-08): «bollos de 600 g», «molde de pizza de 30 cm» (0,85 g/cm²). Cuk-it, *Pizza al molde* — https://cuk-it.com/recetas/pizza-al-molde/ (2026-10-08), que la llama media masa: 400 g de harina, 225 ml de agua, 15 ml de aceite, 4 g de levadura y 7 g de sal (~651 g) para una fuente de 30 cm (0,92 g/cm²). Se usa de 0,85 a 0,9 g/cm².

## 7. Puntos del azúcar

### Tabla propuesta

Temperaturas a nivel del mar.

| Punto | °C | Prueba en agua fría | Usos | Fuente |
|---|---|---|---|---|
| Hilo | 110–112 | forma un hilo líquido que no se hace bolita | almíbar | Wikipedia; descripción: My Country Table |
| Bolita blanda | 112–116 | bolita blanda que se aplasta al sacarla | cremas, rellenos, fudge | CSU |
| Bolita firme | 118–120 | bolita firme que se aplasta sólo si se aprieta | caramelos masticables | CSU |
| Bolita dura | 121–127 | bolita dura que mantiene la forma, todavía moldeable | caramelos estirados, rellenos y glaseados con claras | CSU |
| Quebrado blando | 132–140 | hilos duros que se doblan un poco antes de romperse | toffees | CSU |
| Quebrado duro | 149–153 | hilos quebradizos que se rompen enseguida | crocantes | CSU |
| Caramelo claro | 160 | — (se mira el color) | caramelo duro | Wikipedia |
| Caramelo oscuro | 170 | — | caramelo líquido | Wikipedia |
| Azúcar quemada | 177 | — | — | Wikipedia |

Ajuste por altitud (CSU):
1. Hervir agua y leer el termómetro.
2. Restar a la temperatura de la receta la diferencia entre 100 °C y esa lectura.
3. Sin termómetro probado: unos 2 °F menos cada 1000 pies, que es **1 °C menos cada 275 m**.
4. La prueba en agua fría sirve a cualquier altura y no necesita ajuste.

Punto de ebullición del agua según CSU: nivel del mar 100 °C; 610 m 97,8 °C; 1524 m 95,0 °C; 2286 m 92,2 °C; 3048 m 89,4 °C.

### Fuente

- Colorado State University Extension, *Candy making at high elevation* — https://foodsmartcolorado.colostate.edu/recipes/cooking-and-baking/candy-making-at-high-elevation (2026-10-04). Leído, a nivel del mar / 5000 ft / 7500 ft: cremas y rellenos, soft ball, 234–240 / 224–230 / 219–225 °F; masticables, firm ball, 244–248 / 232–238 / 227–233; caramelos estirados y glaseados con claras, hard ball, 250–260 / 241–258 / 235–253; toffees, soft crack, 270–284 / 260–280 / 255–275; crocantes, hard crack, 300–308 / 290–300 / 285–295. «For every 1,000 feet above sea level, reduce candy recipe temperatures by 2°F».
- CSU Extension, *High Altitude Food Preparation* (PDF) — https://www.extension.colostate.edu/wp-content/uploads/2021/11/High-Altitude-PDFv3.pdf (2026-10-04). Leído: tabla 1 de ebullición (212, 208, 203, 198, 193 °F a 0, 2000, 5000, 7500, 10.000 ft); restar la diferencia entre el agua hirviendo y 212 °F; la prueba en agua fría «is reliable at any altitude».
- Wikipedia, *Candy making* — https://en.wikipedia.org/wiki/Candy_making (2026-10-04). Leído: thread 110–112 °C, soft ball 112–116, firm ball 118–120, hard ball 121–130, soft crack 132–143, hard crack 146–154, clear liquid 160, brown liquid 170, burnt sugar 177; la prueba en agua fría se ajusta sola a la altitud.
- My Country Table, *How to test candy in cold water* — https://mycountrytable.com/test-candy-cold-water/ (2026-10-04). Leído: la descripción de cada prueba (hilo: «soft threads»; bolita blanda: se aplasta al soltarla; firme: mantiene la forma salvo que se apriete; dura: «holds its shape but is still pliable»; quebrado blando: «hard but not brittle threads»; quebrado duro: «brittle threads»).

### Descartado

- Club de Cocina, *De almíbar a caramelo* (https://clubdecocina.com.ar/es/blog/articulos/479-de-almibar-a-caramelo-los-puntos-del-azucar-tecnicas, abierta), fuente argentina que cita el Larousse gastronomique: once puntos con nombres locales (hebra fina 103–105 °C, hebra gruesa 106–110, perlita 110–112, gran perla 113–115, bolita blanda 116–125, bolita dura 126–135, caramelo flojo 136–140, caramelo fuerte 146–155, caramelo claro 156–165, oscuro 166–175). Sus rangos no coinciden con los de CSU y Wikipedia (bolita blanda hasta 125 °C cubre la firme y la dura) y no trae altitud.
- WebstaurantStore (abierta): temperaturas puntuales y descripciones parecidas; comercio.
- Exploratorium: 403. usecalcpro y bakecalcs (fuentes del inventario): calculadoras; no hizo falta abrirlas.
- La regla «1 °C cada 300 m» del inventario: CSU da 2 °F cada 1000 pies = 1 °C cada 274 m.

### Decisiones para el usuario

- **Qué tabla.** CSU (oficial, con altitud, cinco puntos) completada con Wikipedia para el hilo y los caramelos, o Club de Cocina (argentina, once puntos, nombres locales, rangos más anchos). Recomiendo CSU + Wikipedia, con los nombres en castellano de Club de Cocina (bolita blanda, bolita dura, caramelo flojo o quebrado, caramelo fuerte).
- **Bolita dura.** CSU da 121–127 °C y Wikipedia 121–130. Recomiendo CSU.

### Notas

- °F → °C con (F − 32) ÷ 1,8, redondeado a 1 °C. 1 pie = 0,3048 m.
- La descripción de la prueba en agua fría viene de un blog porque CSU sólo da el nombre de cada prueba.
- Los rangos de CSU a 5000 ft no restan lo mismo en todas las filas (el de bolita dura, 241–258 °F, es casi el de nivel del mar): no usarlos como tabla, usar la regla.

---

## 8. Merengue por peso de claras

### Cuenta propuesta

Entra: gramos de claras y tipo. Sale: azúcar, agua y temperatura.

| Tipo | Azúcar por cada 100 g de claras | Agua | Temperatura |
|---|---|---|---|
| Francés | 100 g de azúcar + 80 g de impalpable | — | horno a 120 °C hasta secar |
| Suizo | 167 g | — | baño maría hasta 45 °C (ver Decisiones) |
| Italiano | 133 g: 100 g al almíbar + 33 g a las claras | 40 ml (40 % del azúcar del almíbar) | almíbar a 120 °C, punto bolita blanda |

### Fuente

Larousse Cocina (de *Larousse de los postres*), las tres abiertas el 2026-10-04:
- *Merengue francés* — https://laroussecocina.mx/receta/merengue-frances/. Leído: 5 claras (150 g), ¾ taza de azúcar (150 g), 1 taza de azúcar glass (120 g); rinde 4 discos de 22 cm; horno a 120 °C.
- *Merengue suizo* — https://laroussecocina.mx/receta/merengue-suizo/. Leído: 3 claras (90 g), ¾ taza de azúcar (150 g); batir a baño maría «hasta que alcancen una temperatura de 45 ºC».
- *Merengue italiano* — https://laroussecocina.mx/receta/merengue-italiano/. Leído: ¼ taza de agua (60 ml), 1 taza de azúcar (200 g), 5 claras (150 g); 150 g del azúcar al almíbar «hasta que alcance una temperatura de 120 ºC o el punto de bola suave», el resto a las claras.

Para la temperatura del suizo:
- FDA, *What you need to know about egg safety* — https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety (2026-10-04). Leído: «Casseroles and other dishes containing eggs should be cooked to 160° F» (71 °C); para lo que lleva huevo crudo, huevo pasteurizado.
- Baker Bettie, *How to make Swiss meringue* — https://bakerbettie.com/how-to-make-swiss-meringue/ (2026-10-04). Leído: 150 g de claras y 225 g de azúcar llevados a 160 °F / 71 °C; las claras solas coagulan desde 62 °C, pero el azúcar lo demora y la mezcla sigue líquida.

### Descartado

- Cocineros Argentinos, *Lo sí y los no del merengue* (https://cocinerosargentinos.com/pasteleria/lo-si-y-los-no-del-merengue, abierta): italiano con 3 claras, 180 g de azúcar (120 g al almíbar con 40 cc de agua y 60 g a las claras), almíbar a 118 °C. Fuente argentina, pero no da el peso de las claras ni trae francés ni suizo.
- El Nuevo Emporio, *Tipos de merengues* (https://tienda.elnuevoemporio.com.ar/ver/tutoriales-reposteria/tipos-de-merengues, abierta): «doble peso de las claras en azúcar», almíbar a 118–120 °C; sin agua ni temperatura del suizo.
- Paulina Cocina, *Merengue suizo* (https://www.paulinacocina.net/merengue-suizo-como-hacerlo-paso-a-paso/22042, abierta): claras de 4 huevos y 200 g de azúcar, «que no pase los 60°».
- Paulina Cocina, *Tipos de merengues* (abierta): sólo da el almíbar a 118°.
- Receta de Osvaldo Gross (165 + 55 g de azúcar, 70 cc de agua, 3 claras, 120 °C): sólo en resultados de búsqueda; misanplas no abrió (DNS) y laguada dio error de certificado.
- jjlmoya, handychefdom y usecalcpro (fuentes del inventario): calculadoras; el 1:2 y el 1:1,7 / 1:1,75 no se tomaron.

### Decisiones para el usuario

- **Proporción.** Larousse (francés 1:1 + 0,8 de impalpable, suizo 1:1,67, italiano 1:1,33) o la regla argentina de «el doble de azúcar» (El Nuevo Emporio) para los tres. Recomiendo Larousse: es la única fuente que da los gramos de clara y cubre los tres tipos con la misma mano.
- **Temperatura del suizo.** 45 °C (Larousse), «no más de 60 °C» (Paulina Cocina) o 71 °C (FDA, para que la clara quede segura). Recomiendo 71 °C, que es la regla oficial de seguridad y que con el azúcar no corta la clara (Baker Bettie), con una nota de que Larousse lo lleva sólo a 45 °C.
- **Almíbar del italiano.** 120 °C (Larousse) o 118 °C (Cocineros Argentinos). Recomiendo mostrar «118–120 °C, bolita blanda», que además coincide con El Nuevo Emporio y con la tabla del ítem 7.

### Notas

- Las proporciones son cuenta propia sobre Larousse: francés 150:150:120; suizo 90:150; italiano 150 de claras, 150 + 50 de azúcar y 60 de agua.
- Con 30 g por clara (Larousse: 5 claras = 150 g; 3 = 90 g), la cuenta puede aceptar también «cantidad de claras».

---

## Pasta: cuánto por persona (2026-10-08)

Reemplaza a la pasta fresca (ítem 4) y a la tabla de pasta comprada: cómo se hace cada masa es receta. La tabla da la porción cruda por persona.

| Pasta | Por persona | Fuente |
|---|---|---|
| Seca (de paquete) | 85–100 g; en caldo, 40 g | Garofalo; en caldo, CSI Piemonte |
| Fresca sin relleno | 200 g | Dicomo |
| Lasaña y canelones | 200 g de pasta | CSI Piemonte |
| Ravioles, raviolones, sorrentinos, agnolotis, tortelettis | 48 (una caja), 16, 5 o 6, 5 o 6, 200 g | La Juvenil |
| Capeletis | 250 g | Dicomo, que desempata entre La Juvenil (200 g de máquina, 250–300 g caseros) y CSI Piemonte (125 g) |
| Ñoquis | 300 g | Dicomo, que desempata entre CSI Piemonte (200 g) y La Juvenil (~333 g) |

- Garofalo, *¿Cuántos gramos de pasta seca por persona?* — https://www.pasta-garofalo.com/es/news/cuantos-gramos-de-pasta-seca-por-persona/ (2026-10-08). Leído: «85-100 gramos por persona» para pasta larga, corta y formatos especiales; «un adulto necesita entre 70 y 100 gramos de pasta cruda».
- Dicomo (fábrica de pastas, Montevideo), *Cuánta pasta fresca calcular por persona* — https://www.pastadicomo.com/post/guia-simple-para-no-quedarse-corto-cuanta-pasta-fresca-calcular-por-persona (2026-10-08). Leído, en crudo: ravioles 50 unidades; sorrentinos 6 a 7; capelletis 250 g; agnolotti 250 g; tallarines 200 g; ñoquis 300 g; ñoquis rellenos 250 g; lasaña y canelones 600 g (el plato armado).
- CSI Piemonte, tabla de gramajes (ver ítem 9): pasta de sémola 80 g, en caldo 40 g; pasta al huevo 100 g; lasaña y canelones 200 g; rellena 125 g, en caldo 80 g; ñoquis 200 g. Es una porción de comedor de empresa, la mitad que las fábricas: se usa sólo donde no hay otra.

## Lo que no se pudo verificar

- **Pizza a la piedra:** ninguna fuente abierta da el peso del bollo junto con el diámetro.
- **Savarín:** el catálogo argentino no da el diámetro del tubo.
- **Alto de los moldes cuadrados y rectangulares argentinos:** El Nuevo Emporio no lo da.
- **Budineras por número** (MTA n.º 1, 2 y 3; Tramontina Paris 1,9 l): sólo en resultados de búsqueda; las páginas no abrieron.
- **Pasta para entrada (60 g) y rellena (130 g)** y la sal en gramos: sólo hay sitios de calculadoras.
- **Cuántos dumplings por persona:** sin fuente.
- **Tortilla de harina:** sólo un blog de EE. UU. (40–50 g).
- **Densidad por tipo de torta** (Bakemag, 403): queda el rango general de AIB.
- **«100 g de masa de torta por persona»:** sólo en un resultado de búsqueda.
- **Merengue de Osvaldo Gross:** las dos páginas que lo transcriben no abrieron.

---

## Agregado: pastas rellenas, lasaña y ñoquis (2026-10-04)

Pedido del usuario: los ñoquis pasan a la ficha de pasta fresca y la ficha suma pastas rellenas y lasaña. Cada número sale de una página abierta el 2026-10-04.

| Ítem | Estado | Tipo | Fuente elegida |
|---|---|---|---|
| 9. Pastas rellenas | con decisión | cuenta | CSI Piemonte (porción) + Giovanni Rana (masa y relleno) + ítem 4 (harina y huevo); La Juvenil (piezas por persona, compradas) |
| 10. Lasaña | con decisión | cuenta | Accademia Italiana della Cucina, receta depositada (vía Bologna Welcome) |
| 11. Ñoquis | listo | cuenta | Cocineros Argentinos (sin cambios), con La Juvenil como confirmación |

### 9. Pastas rellenas

#### Cuenta propuesta

Entra: porciones y tipo de relleno. Sale: harina, huevos y gramos de relleno.

| Dato | Valor | Fuente |
|---|---|---|
| Pasta rellena cruda por porción | 125 g | CSI Piemonte (ravioles, tortelinis y tortelis, plato principal); Giovanni Rana (250 g = 2 porciones) |
| En caldo | 80 g | CSI Piemonte |
| Masa : relleno, relleno de carne | 60 : 40 | Giovanni Rana (62:38 y 64:36) |
| Masa : relleno, relleno de ricota y verdura | 40 : 60 | Giovanni Rana (40:60) |
| Masa al huevo | 100 g de harina + 1 huevo ≈ 150 g de masa | ítem 4 (Informacibo) y USDA (huevo de 50 g) |

Cuenta, por porción:
- `masa = 125 · fracción de masa`; `relleno = 125 − masa`
- `harina = masa · 100/150`; `huevos = masa / 150`

| Relleno | Masa | Harina | Huevo | Relleno |
|---|---|---|---|---|
| De carne (60:40) | 75 g | 50 g | ½ | 50 g |
| De ricota y verdura (40:60) | 50 g | 33 g | ⅓ | 75 g |

Para 4 porciones con relleno de carne: 200 g de harina, 2 huevos y 200 g de relleno.

Compradas, piezas por persona (La Juvenil, fábrica de pastas argentina):

| Pasta | Por persona |
|---|---|
| Ravioles | 48 (una caja) |
| Raviolones | 16 (2 cajas de 24 cada 3 personas) |
| Sorrentinos | 5 o 6 |
| Agnolotis | 5 o 6 |
| Capeletis de máquina y tortelettis | 200 g (5 porciones por kg) |
| Capeletis caseros | 250–300 g |

Tamaños de corte con fuente: raviol de 5 × 5 cm (Cocineros Argentinos, Galbani); tortelini de 3 cm y capeleti de 4 cm (Galbani); capeletinis de 4 × 4 cm (Cocineros Argentinos).

#### Fuente

- CSI Piemonte (consorcio público de la Región del Piamonte), *Procedura per l'affidamento del servizio di ristorazione aziendale*, anexo 5, *Tabella delle grammature e delle porzioni* — https://www.csipiemonte.it/sites/default/files/inline_download/gare/archivio/2017/01_2017/All_5_Tabella_Grammature_e_Porzioni.pdf (2026-10-04). Leído, «porzioni al crudo e al netto degli scarti», pasta al huevo: «ravioli, tortelli, tortellini (alla bolognese, alla romana, di magro) 125 g»; «per minestre in brodo (tortellini, ravioli) 80 g»; tagliatelle 100 g; lasagne, cannelloni, crespelle 200 g; gnocchi 200 g; salsas 80 g; parmesano 10 g.
- Giovanni Rana, tienda oficial (las tres abiertas el 2026-10-04):
  - *Sfogliavelo Ricotta e Spinaci 250 g* — https://shop.giovannirana.it/prodotto/sfogliavelo-ricotta-e-spinaci-confezione-da-250-g. Leído: «2 porzioni»; relleno 60 %, pasta 40 %.
  - *Sfogliavelo Carne 250 g* — https://shop.giovannirana.it/prodotto/sfogliavelo-carne-confezione-da-250-g. Leído: 2 porciones; pasta 62 %, relleno 38 %.
  - *Sfogliagrezza Casarecci 250 g* — https://shop.giovannirana.it/prodotto/sfogliagrezza-casarecci-confezione-da-250-g. Leído: 2 porciones; pasta 64 %, relleno 36 % (relleno de cerdo y mortadela).
- La Juvenil, *Catálogo de productos* — https://www.lajuvenilpastas.com.ar/catalogos/catalogo_de_productos.pdf (2026-10-04). Leído: ravioles «Caja de 48 unidades. Rinde una porción por caja»; raviolones (sorrentinos, caseritos, panzotti) «Caja de 24 unidades. Se calculan 2 cajas para tres personas»; agnolotti y sorrentinos juveniles «Se calculan 5 o 6 por persona»; capelletti de máquina y tortelletti «Rinde 5 porciones por kilo»; capelletti caseros «Rinde 250/300 grs por persona»; ravioles veganos «Caja de 72 unidades. Rinde dos porciones»; salsas «120 grs por porción».
- Galbani, *Come fare i ravioli* — https://www.galbani.it/abcucina/come-fare/consigli-in-cucina/come-fare-i-ravioli (2026-10-04). Leído: 500 g de harina 00 y 4 huevos para unos 50 ravioli, «un uovo per ogni etto di farina», cuadrados de unos 5 cm de lado.
- Galbani, *Come fare la pasta ripiena* — https://www.galbani.it/abcucina/come-fare/trucchi-e-segreti-per-la-pasta-fresca/come-fare-la-pasta-ripiena (2026-10-04). Leído: tortellini de 3 cm, cappelletti de 4 cm; no da dosis.

#### Descartado

- **Código Alimentario Argentino, cap. V** (Res. GMC 47/03, *Reglamento técnico Mercosur de porciones*), https://www.argentina.gob.ar/sites/default/files/anmat_capitulo_v_rotulacion_14-01-2019.pdf (abierto): «Fideos y Pastas frescas con o sin relleno: 100 g, X plato/taza»; pastas deshidratadas con relleno, 70 g. Es organismo oficial, pero es la porción del rótulo nutricional y vale igual para la pasta sin relleno: aplicada a la pasta fresca simple contradice los 100 g de harina por porción del ítem 4 (≈150 g de masa). La Salteña la usa en sus ravioles: «100g (1 plato)» (https://www.lasaltena.com.ar/productos/ravioles-ricotta/, abierta; paquete de 450 g, sin cantidad de unidades).
- **Cocineros Argentinos, recetas de pastas rellenas** (todas abiertas): no dan una porción estable.
  - *Sorrentinos* (https://www.cocinerosargentinos.com/arroces-y-pastas/sorrentinos): 4 porciones; masa de 500 g de harina 0000, 1 huevo y 200–230 cc de agua; relleno de 400 g de mozzarella y 1 huevo; masa de 2 mm. Cuenta propia: ~765 g de masa y ~450 g de relleno, ~300 g por porción y relleno 37 % del total.
  - *Ravioles caseros* (https://cocinerosargentinos.com/recetas/arroces-y-pastas/ravioles-caseros): 4 porciones; 350 g de harina, 150 g de semolín, 4 huevos y ~50 cc de agua; relleno de 600 g de carne para brasear; raviol de 5 × 5 cm.
  - *Sorrentinos de jamón, queso y ricota* (https://cocinerosargentinos.com/arroces-y-pastas/sorrentinos-de-jamon-queso-y-ricota): 4 porciones; 400 g de harina, 2 huevos; relleno sin cantidades.
  - *Ravioles de verdura a lo Doña Petrona* (https://cocinerosargentinos.com/arroces-y-pastas/ravioles-de-verdura-a-lo-dona-petrona): 4 porciones; 800 g de harina y 2 huevos.
  - *Cappelettinis caseros* (https://cocinerosargentinos.com/arroces-y-pastas/cappelettinis-caseros): 10 personas; 350 g de harina, 350 g de semolín, 7 huevos; cuadrados de 4 × 4. *Cappelettinis* (https://cocinerosargentinos.com/recetas/arroces-y-pastas/cappelettinis): la misma masa, para 4 porciones.
  - *Capelettis con doble relleno* (https://cocinerosargentinos.com/arroces-y-pastas/capelettis-con-doble-relleno/): «4 porciones aprox.»; 360 g de harina y 300 g de yemas; cuadrados de 9 × 9 cm.
  - Van de 70 a 200 g de harina por porción y la misma masa figura para 10 y para 4 personas.
- **Paulina Cocina, *Sorrentinos caseros*** (https://www.paulinacocina.net/sorrentinos-caseros/26569, abierta): 150 g de pasta rellena por adulto, 80 g por chico, 5–6 sorrentinos por porción (25–30 g cada uno, cuenta propia); 1 kg para 6 o 7 personas. Blog.
- **Tortellini de Bolonia** (receta del relleno depositada en 1974 por la Dotta Confraternita del Tortellino y la Accademia Italiana della Cucina; sólo en un resultado de búsqueda): ~1,65 kg de relleno contra una masa de 300 g de harina y 3 huevos; no dice para cuántos ni cuánto se usa. Galbani, en otro resultado de búsqueda (página sin abrir), da un relleno de ~270 g para unos 150 tortellini.
- Cucchiaio d'Argento, *Ravioli di ricotta e spinaci* (6 personas, 300 g de harina y sémola, 3 huevos): 403; sólo en un resultado de búsqueda.
- Galbani, *Come fare gli agnolotti* (abierta): 300 g de harina y 3 huevos, 400 g de carne; no dice para cuántos.
- Calculadoras y notas de búsqueda (todocalculadoras, laganini, cocinachic, gustoblog: 150–250 g por persona): no se abrieron; sitios de calculadoras o blogs.

#### Decisiones para el usuario

- **Porción.** 125 g (CSI Piemonte, con Rana igual), 100 g (Código Alimentario, porción de rótulo), 150 g (Paulina Cocina) o lo que dan las fábricas argentinas (200 g los capeletis de máquina, 250–300 g los caseros, La Juvenil). Recomiendo 125 g: es una tabla pública de porciones de plato, coincide con el fabricante, y el Código Alimentario no separa la pasta rellena de la simple. Las fuentes argentinas sirven más grande; si se quiere, la porción puede ser editable.
- **Una proporción o dos.** Recomiendo dos opciones, «carne» (60:40) y «ricota o verdura» (40:60), que es lo que muestra Rana. Con una sola, 60:40 (coincide con los sorrentinos de Cocineros, ~63:37).
- **Piezas por persona.** La Juvenil da piezas para lo comprado, pero sin peso por pieza: no convierte a harina. Recomiendo dejarlo como nota de la ficha («comprados: 48 ravioles, 5 o 6 sorrentinos por persona») y no como cuenta.

#### Notas

- El 125 g de CSI Piemonte es pasta rellena cruda entera, masa y relleno juntos.
- Harina y huevo por porción son cuenta propia: la masa del ítem 4 (100 g de harina + un huevo de 50 g sin cáscara) pesa ~150 g, así que 1 g de masa ≈ 0,67 g de harina.
- Los porcentajes de Rana son de productos industriales (masa fina hecha a máquina); en casa la masa queda más gruesa y la proporción de masa sube.

---

### 10. Lasaña

#### Cuenta propuesta

Entra: largo y ancho de la fuente en cm (o porciones). Sale: porciones, harina, huevos, ragú, bechamel y queso.

Base (Accademia Italiana della Cucina): fuente de 25 × 35 cm (875 cm²), alta de 6 cm como mínimo, **8 porciones**, al menos **6 capas**.

| Por porción | Cantidad |
|---|---|
| Superficie de fuente | ~109 cm² |
| Harina 00 (masa verde) | 87,5 g |
| Huevo | ⅜ |
| Espinaca hervida, escurrida y picada | ~44 g |
| Ragú a la boloñesa | 125 g |
| Bechamel: leche entera | 125 ml |
| Bechamel: harina | 12,5 g |
| Manteca (bechamel y capas) | ~25 g |
| Parmesano rallado | 50 g |

Para otra fuente:
- `porciones = largo · ancho / 109`
- cada ingrediente = cantidad de la receta · `largo · ancho / 875`

Ejemplo: fuente de 20 × 30 cm → 600 cm² → 5,5 porciones; factor 0,69 → 480 g de harina, 2 huevos, 240 g de espinaca, 690 g de ragú, 690 ml de leche, 69 g de harina para la bechamel, 275 g de parmesano.

Armado: placas de unos 15 × 10 cm o un poco más chicas que la fuente, hervidas hasta que suben, pasadas por agua fría y secadas; fondo con manteca, ragú y bechamel; cada capa con «un sottile velo di besciamella, ragù in abbondanza», manteca y parmesano; tapa de masa con ragú y bechamel. Horno a 180 °C, 25–30 min; 5 min de reposo.

#### Fuente

- Fondazione Bologna Welcome, *Lasagne Verdi alla bolognese* — https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese (2026-10-04). Leído: receta «solennemente decretata dall'Accademia Italiana della Cucina, delegazione di Bologna San Luca» el 28 de mayo de 2003 y depositada el 4 de julio de 2003 en la Camera di Commercio di Bologna. «Ricetta per 8 persone»: 1 kg de ragú clásico boloñés; 400 g de Parmigiano Reggiano; bechamel de 100 g de harina 00 y 1 litro de leche entera; «burro (un panetto di circa 200 g)»; 1 kg de masa verde con 700 g de harina 00, 3 huevos y 350 g de espinaca hervida; «una teglia rettangolare di circa 25x35 cm, alta almeno 6 cm»; rectángulos «di circa 15x10»; «almeno 6 strati complessivi»; «25-30 minuti a circa 180 gradi»; «Lasciare riposare 5 minuti».

#### Descartado

- Succede solo a Bologna, *Verdi o gialle poco importa: ecco le ricette ufficiali delle lasagne* (https://www.succedesoloabologna.it/verdi-o-gialle-poco-importa-ecco-le-ricette-ufficiali-delle-lasagne/, abierta): la verde para 4, con 350 g de harina, 2 huevos, 200 g de espinaca, 500 g de ragú, 200 g de parmesano, 350 g de bechamel, 100 g de manteca, rectángulos de 15 × 10, seis capas, 30 min a 180 °C; sin tamaño de fuente. Es la mitad de la de Bologna Welcome (87,5 g de harina, 125 g de ragú y 50 g de parmesano por persona en las dos). También da una amarilla para 4 con 400 g de harina y 4 huevos y otro relleno (hígados, mollejas, hongos). Blog, sin decir quién la depositó.
- Cocineros Argentinos, *Lasaña* (https://www.cocinerosargentinos.com/recetas/arroces-y-pastas/lasana, abierta): 4 porciones; 600 g de harina 0000, 3 huevos y 9 yemas; masa de 1 mm; «láminas de 15 x 25 cm o del tamaño del recipiente»; bolognesa de 500 g de carne picada y un chorizo; bechamel de 40 g de harina, 40 g de manteca, 500 cc de leche, 2 huevos, 100 g de queso rallado y 300 g de mozzarella. No da tamaño de fuente ni capas, y son 150 g de harina por porción.
- Cocineros Argentinos, *Lasagna* (https://www.cocinerosargentinos.com/recetas/arroces-y-pastas/lasagna, abierta): 4 porciones; 300 g de harina 0000, 200 g de semolín y 5 huevos; 2 l de tomate y 1 l de bechamel; sin fuente ni horno.
- Cocineros Argentinos, *Lasaña de carne y espinaca* (https://cocinerosargentinos.com/arroces-y-pastas/lasana-de-carne-y-espinaca, abierta): 4 porciones; 250 g de harina, 250 g de semolín, 2 huevos, 100 cc de agua; 500 g de carne picada; bechamel de 1 l de leche; tres capas; sin fuente ni horno.
- La Nación, *Lasaña a la emiliana*, de Leonardo Fumarola (https://www.lanacion.com.ar/recetas/platos-de-comida-principal/lasana-a-la-emiliana-o-a-la-bolonesa-nid22072021/, abierta): 4 porciones; 200 g de harina, 200 g de sémola y 4 huevos; placas de 15 × 30 cm «ajustables según la fuente»; 4 o 5 capas; 180 °C, 35–40 min. Sin tamaño de fuente.
- La Nación, *Lasaña fácil* (https://www.lanacion.com.ar/recetas/platos-de-comida-principal/lasana-facil-nid24082022/, abierta): 10 porciones, 9 placas compradas, 3 capas, fuente de 7 cm de alto como mínimo, 180 °C 35–45 min; no da largo ni ancho.
- La Juvenil (catálogo, ítem 9): lasaña armada comprada, «1 kilo rinde 3 porciones»; no es la cuenta de la casera.
- CSI Piemonte (ítem 9): «lasagne, cannelloni, crespelle 200 g» en la fila de pasta al huevo; no queda claro si es la masa sola o el plato armado.
- Barilla, *Lasagne alla Bolognese* y *5-Layer Oven-Ready Lasagne* (fuente de 9 × 13"): 403 en las dos.

#### Decisiones para el usuario

- **Fuente elegida.** Ninguna receta argentina abierta da el tamaño de la fuente; la de la Accademia sí, y es la receta depositada. Recomiendo la Accademia, con la cuenta por superficie.
- **Masa verde o amarilla.** La Accademia es verde (con espinaca y sólo 3 huevos cada 700 g de harina). Recomiendo ofrecer las dos con la misma harina por porción (87,5 g): verde como la Accademia, y amarilla con un huevo cada 100 g de harina (ítem 4), que da ~0,9 huevo por porción. La amarilla es cuenta propia.
- **El relleno.** La Accademia lleva ragú, bechamel y parmesano; la lasaña argentina suele llevar también mozzarella o ricota, que ninguna fuente con fuente en cm pesa. Recomiendo que la ficha dé sólo masa, ragú, bechamel y queso rallado, como la Accademia.
- **Placas compradas.** No hay fuente abierta de cuántas placas secas van por capa en una fuente en cm. Recomiendo dejarlas afuera.

#### Notas

- La cuenta supone el mismo alto (6 capas en 6 cm): escala por superficie, no por volumen.
- 875 cm² ÷ 8 = 109,4 cm²; los valores por porción son la receta ÷ 8. 3 huevos ÷ 8 = 0,375.
- La manteca de la Accademia («un panetto di circa 200 g») va en la bechamel, en cada capa y en las esquinas; la receta no la reparte.
- La harina de la masa por porción (87,5 g) queda cerca de los 100 g de la pasta fresca del ítem 4.

---

### 11. Ñoquis

#### Cuenta propuesta

Queda la del ítem 5, ahora en la ficha de pasta: por porción, **250 g de puré de papa, 50 g de harina, ¼ a ½ huevo**, queso rallado y sal (Cocineros Argentinos, 1 kg de puré y 200 g de harina para 4). Papa : harina = 5 : 1 sobre el puré.

#### Fuente

- Cocineros Argentinos, *Ñoquis de papa* (ítem 5) — https://cocinerosargentinos.com/recetas/economicas/noquis-de-papa (2026-10-04).
- Confirmación: La Juvenil (catálogo, ítem 9), ñoquis de papa, espinaca y calabaza: «El kg rinde 3 porciones», ~333 g por porción. La receta de Cocineros pesa ~1,25–1,3 kg en crudo (1000 g de puré, 200 g de harina, 1 o 2 huevos y queso) para 4: ~315–325 g por porción (cuenta propia). Coinciden.

#### Descartado

- CSI Piemonte (ítem 9): «gnocchi … 200 g» por porción, cruda. Organismo público, pero italiano, y no da la proporción de papa y harina; la porción argentina de la fábrica y la de Cocineros es una vez y media más grande.
- TV Pública, *Ñoquis de papa perfectos*, en Cocineros Argentinos, de Gladys Mabel Olazar (https://www.tvpublica.com.ar/post/noquis-de-papa-perfectos, abierta): 500 g de puré, 150 g de harina, 100 g de queso rallado, 1 yema; sin porciones.
- Narda Lepes (1 kg de papa, 300 g de harina, 1 huevo, 4 porciones): sólo en un resultado de búsqueda, desde un agregador; no se abrió.
- La Juvenil, ñoquis a la romana: «El kilo rinde 4 porciones»; son de sémola, otra masa.
- Las que ya estaban descartadas en el ítem 5 (Cocineros *Ñoquis caseros*, Paulina Cocina, La Nación).

#### Decisiones para el usuario

Ninguna: no apareció una fuente oficial ni argentina más firme, y la fábrica argentina confirma la porción.

#### Notas

- La porción de La Juvenil es de ñoquis ya hechos; la de Cocineros, de ingredientes. Las dos dan ~320–330 g.

---

### Lo que no se pudo verificar

- **Peso por pieza de las pastas rellenas:** ninguna fuente abierta da gramos por raviol, sorrentino o capeleti; La Juvenil da piezas por persona sin peso, y los 25–30 g por sorrentino salen de un blog.
- **Una porción casera argentina de pasta rellena:** las recetas de Cocineros Argentinos van de 70 a 200 g de harina por porción y repiten la misma masa para 4 y para 10 personas.
- **Proporción masa : relleno casera:** sólo hay la de productos industriales (Rana); la de Cocineros es cuenta propia sobre una receta.
- **Lasaña argentina con tamaño de fuente:** ninguna receta argentina abierta da largo y ancho.
- **Placas de lasaña compradas por capa:** Barilla dio 403 y ningún fabricante argentino abierto lo publica.
- **Mozzarella y ricota en la lasaña:** sin fuente que las pese contra el tamaño de la fuente.
- **Tortellini de Bolonia y Cucchiaio d'Argento:** sólo en resultados de búsqueda.
