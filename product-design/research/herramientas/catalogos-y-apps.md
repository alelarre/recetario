# Inventario de herramientas de cocina, por catálogo

**Cómo leerlo.** Todo lo listado se vio en la página indicada, salvo lo marcado «(sin verificar)», que es de memoria, o «(snippet)», que se vio sólo en un resultado de búsqueda. De los agregadores verifiqué los nombres en la página índice; no abrí cada calculadora, así que entradas → salida sólo aparece donde el índice lo decía o donde abrí la herramienta.

**Límites de la búsqueda.**
- El cupo de WebSearch de la sesión se agotó (200 de 200) a mitad del trabajo. Seguí con WebFetch directo, Brave Search por WebFetch (devuelve 429 enseguida) y Playwright para páginas que bloquean el fetch.
- Bloqueados o caídos, sin inventario: pizzamaking.com (Cloudflare), BigOven (403), Epicurious, Food Network (redirige a tudiscovery.com), ChefSteps (páginas vacías o 403), cocktailpartyapp.com (403), foodgeek.io (403), innovicat.com (403), breadboss.com (socket cerrado), KitchenAid (timeout), recetasgratis.net (redirige a elperiodico, bloqueado), bbc.co.uk/food.
- No llegué a cubrir: America's Test Kitchen, The Kitchn, Taste of Home, Good Housekeeping, Modernist Cuisine, Yummly, Instant Pot app, panificadoras, apps de «Kitchen Timer» múltiples y apps de cócteles.
- Lo puramente nutricional existe en casi todos (Omni, Calculator Academy, RecipeTool, Samsung Food, WP Recipe Maker) y queda afuera.

---

## 1. Agregadores de calculadoras

### Omni Calculator — omnicalculator.com/food
- **Conversores:** Air Fryer; Butter (sticks ↔ g); Cake Pan Converter; Cooking Measurement Converter; Cups ↔ Pounds; Dry to Cooked Pasta; Fresh to Dry Herb; Garlic Clove to Powder; Grams ↔ Cups / Tablespoons / Teaspoons; ml ↔ Grams; Oil to Butter; Uncooked to Cooked Rice; Yeast Converter.
- **Té y café:** Coffee Calculator; Coffee Footprint; Coffee Kick (cafeína); Coffee Ratio; Coffee to Water Ratio; Cold Brew Ratio; Healthy Coffee; Tea Brewing.
- **Bebidas:** ABV; Alcohol Dilution; Chilled Drink (bebida, envase, temperatura inicial, dónde se enfría, temperatura deseada → tiempo de espera y curva de enfriado); SO2 Wine; Priming Sugar.
- **Postres y horneado:** Baker's Percentage; Cake Pricing; Cake Serving; Chocolate; Donut; Perfect Ice Cream; Pancake Recipe; Perfect Pancake; Self-rising Flour; Sourdough.
- **Pizza:** Perfect Pizza; Pizza Comparison; Pizza Party (cuántas pedir); Pizza Size.
- **Thanksgiving:** Thanksgiving Calculator; Turkey Cooking Time; Turkey Defrost Time; Turkey Size; Turkey Thawing.
- **Fiestas:** BBQ Grill Size; BBQ Party; Beer Pong; How Much Ham per Person; Party Drink; Popcorn; Taco Bar; Wedding Alcohol.
- **Otras:** Bacon Curing; Bread Spreads; Brine; Egg Boiling; Ideal Egg Boiling (tamaño o peso, altitud, presión → tiempo para cuatro puntos de cocción); Ham Cooking Time; Mashed Potatoes per Person; Quarantine Food; Rice to Water Ratio; Steak Cook Time; Sulfur; Water Cooling.
- La versión en español (omnicalculator.com/es/comida) tiene sólo 16 de éstas.

### Inch Calculator — inchcalculator.com/cooking-calculators/
- Cake Calculator; Cooking Conversion; Ham Cooking Time; Ham Size; Milk Weight; Oven Temperature Conversion & Chart; Oven to Air Fryer Conversion; Pizza Calculator; Recipe Scale Conversion; **Timer**; Turkey Cooking Time; Turkey Size; Turkey Thawing Time; Uncooked to Cooked Rice.
- Conversores por ingrediente: Butter, Flour, Sugar, Salt (volumen ↔ peso), Beer Volume.
- Pares de unidades: cups / g / ml / tbsp / tsp / oz, y unas 16 páginas del tipo «cuántas cucharadas hay en ¼ de taza».

### Good Calculators — goodcalculators.com
- Recipe Scaler; Cake Pan Converter; Raw to Cooked Weight Conversion; Cooking Conversion; Convection Oven Conversion; Rice-to-Water Ratio; Coffee-to-Water Ratio; Meat Cooking Time; Meatball Calculator; Pizza Calculator; Pizza Tip; ABV.
- Perfect Toast Calculator (grosor, peso y propiedades térmicas del pan y la manteca → grosor y peso de manteca ideales).

### Calculator Academy — calculator.academy/food-calculators/ (124 entradas)
- **Tiempos:** 13, 15, 18 y 30 Minutes Per Pound; Pork Loin Cooking Time; Ham Cook Time; Turkey (cocción y descongelado); Cooking Time Conversion; Oven to Microwave Conversion; Air Fryer; Holding Time.
- **Escalado y proporciones:** Half Recipe; Batch Size; Cooking Ratio; Baking Ratio; Cookie Ratio; Gravy Ratio; Water to Grits Ratio; Meat Ratio; Sausage Ratio.
- **Masa:** Baker's Percentage; Dough Hydration; Bread Hydration; Flour Weight; Whip (overrun); Cake Surface Area; Cake Serving; Knife Marks Per Inch.
- **Rendimientos:** Beef, Chicken, Pork, Turkey, Lamb, Fish, Deer, Butcher, Paneer, Juice y Potato Yield; Raw to Cooked Weight; Dry to Cooked Pasta; Meat Shrinkage; Moisture Loss.
- **Porciones:** Servings; Amount Per Serving; Food Quantity; Meat, Potatoes y Prime Rib Per Person; cuántas pizzas; Pizza Price Per Square Inch; Pizza Value.
- **Costos:** Cost Per Serving, Portion, Ingredient, Shot y Egg; Price Per Cup; Meal Prep Cost; Cookie, Cupcake y Sandwich Cost; Buffet y Banquet Cost; Food Waste Percentage; Coffee Cost Per Cup; Beer Cost.
- **Bebidas y fermentación:** Sugar to Alcohol; Alcohol Per Volume; Mead Alcohol %; Wine Sugar; Brix to Sugar; Brix to Acid Ratio; Bitterness Ratio; Grain Absorption; Brewing Water pH; Whiskey Dilution; Keg Carbonation.
- **Ciencia:** Dry Matter; Moisture Ratio; Pasteurisation Units; Refractometer Temperature Correction; Blast Freezer Capacity; Production Date.

### UseCalcPro — usecalcpro.com/food (96 entradas, el catálogo más raro)
- **Masas:** Bread Dough; Bagel; Challah; Poolish; Sourdough Starter Feeding (proporción, hora de pico, levain); Bread Proofing (tiempo según temperatura y levadura); Yeast Conversion; Pie Crust (por molde); Cookie Dough; Waffle Batter; Tortilla; Ramen Noodle; Gnocchi; Grain Mill.
- **Pastelería:** Ganache (proporción por tipo); Meringue; Cream Whipping Yield; Ice Cream Base; Wedding Cake (pisos, porciones, masa).
- **Fermentos y conservas:** Pickle Brine; Sauerkraut; Kimchi; Kvass; Tepache; Ginger Beer; Water Kefir; Kefir Grains; Yogurt Starter; Tempeh; Natto; Vinegar Making; Hot Sauce (con estimación Scoville); Jam Canning; Fruit Preserves; Pressure Canning; Canning Water Bath (con altitud); Canning Jar Quantity.
- **Carnes:** Meat Curing Salt; Meat Curing; Sausage Making (largo de tripa); Jerky Yield; Butcher Yield; Tallow Rendering; Smoking Pellet; Sous Vide Time & Temperature; Bone Broth; Gravy (roux).
- **Lácteos y vegetales:** Cheese Making; Rennet Dosing; Ricotta; Cream Cheese; Butter Churning; Ghee; Milk Pasteurization; Tofu; Seitan; Oat Milk.
- **Por plato:** Rice; Sushi Rice; Congee; Biryani; Paella; Tamale; Spring Roll; Pasta Serving; BBQ Sauce; Spice Blend; Infused Oil.
- **Conversión:** Spice Conversion (fresco ↔ seco); Butter to Oil.
- **Eventos:** BBQ Party; Easter Dinner; Turkey Size; Catering Portions; Potluck (reparte categorías de platos); Ice Calculator; Candy Buffet; Popcorn; Cocktail Batch.
- **Almacenaje:** Food Storage; Grain Storage; Food Dehydrator Tray; Freeze Drying.
- **Bebidas:** Mead Honey; Mead Nutrient; Cider; Wine; Maple Syrup; Tincture.

### Flour & Scale — flourandscale.com (38)
- **Horneado:** Baker's Percentage (también hacia atrás, desde el peso de masa); Recipe Scaling; Hydration; Sourdough Starter Feeding; Yeast Conversion; Pizza Dough; Pizza Dough Recipe Generator (por estilo y horario); Bread Proofing Time Estimator.
- **Conversiones y reemplazos:** Volume to Weight; Pan Size Conversion; Oven Temperature; Egg Size Substitution; Butter Substitution; Herb Substitution Chart; Spice Conversion Chart (entero ↔ molido); Dry to Cooked Rice; Flour Types Explained; Ingredient Substitution Finder.
- **Carnes:** Internal Meat Temperature Guide; Turkey Cooking Time; Brine; Meat Thawing Time; Vegetable Roasting Times.
- **Parrilla:** Grill & Smoker Temperature Guide; Rub Ratio; Wood Pairing Chart.
- **Sopas:** Thickening Calculator; Stock & Broth Ratio Guide; Chili Style Guide.
- **Porciones:** Pasta, Soup y Chili Serving; Leftover Calculator (porciones que quedan y días seguros); Coffee Ratio.
- **Electrodomésticos:** Air Fryer Conversion Chart; Air Fryer Cook Times; Slow Cooker Conversion Chart; Dutch Oven Size Guide.

### Brine Calculators — brinecalculators.com/calculators.html (26)
- Salmueras: pavo; salmuera húmeda al 3,5, 5 o 6 %; carne por corte; salado en seco; tiempo de salmuera; inyección; olla a presión; pescados; equilibrio; panceta curada con control de ppm de nitrito.
- Fermentos y encurtidos: sal para kimchi y chucrut; sal para fermentación por vegetal; pickles (vinagre o salmuera); pH para conserva (línea de 4,6).
- Utilidades: conversión entre marcas y tipos de sal; porcentaje de una salmuera ya hecha; visualizador de fuerza de salmuera; tablas de conversión; escalado de lote; planificador de varias salmueras a la vez; tamaño de recipiente; escala comercial; costo.
- Rarezas: generador de ficha de receta imprimible; **temporizador de salmuera** con avisos a la mitad y a 15 minutos; herramienta de diagnóstico («quedó salado o blando: causa probable»).

### The Baker's Calculator — thebakerscalculator.com (10)
- Pan Converter; Recipe Scaler (con redondeo); Baking Time & Temperature Adjuster (por cambio de molde y altura de masa); High Altitude Baking Adjustment; Yeast Conversion; Cake Serving Size; Cupcake & Muffin Yield (torta → cupcakes); Oven Temperature Converter (°F, °C, gas mark); Ingredient Weight Reference; Pan Size Comparison Chart.

### TheCalculatorSite — thecalculatorsite.com/cooking/ (25)
- Cooking Converter; Air Fryer Converter; Baking Conversions (tabla); Butter Converter; Oven Temperature Conversions (gas y eléctrico).
- Unos 20 pares de unidades: cups ↔ g, ml, lb, tbsp; g ↔ ml, oz, lb, tbsp, tsp; oz ↔ cups, ml; pints y quarts ↔ cups; tbsp ↔ tsp; tsp ↔ ml.

### Catálogos chicos
- **RecipeTool** (recipetool.net/tools): Recipe Scaler con fracciones de cocina; Sourdough (con línea de tiempo hasta el pico); Fermentation (% de sal, y tiempos de masa madre y kombucha según temperatura); Bread; Cooking Unit Converter con densidad por ingrediente; Air Fryer Conversion; Instant Pot Timing Guide (más de 50 alimentos, tipo de liberación, proporción de agua); Weekly Meal Planner.
- **Chefs Binge** (chefsbinge.com/tools/): Pizza Dough (con cronograma de fermentación); Sourdough (alimentar el fermento e hidratación); Fermentation Brine (gramos y cucharadas, con presets); How Much Food Do I Need? (carne, papas, arroz y verduras según adultos y chicos); Weekly Meal Planner con lista de compras combinada.
- **GIGAcalculator** (gigacalculator.com/calculators/cooking/): Recipe Scaler; Pizza Dough; Bread; Rice; Water to Rice; Coffee Ratio; Brine.
- **CalculatingHub** (calculatinghub.com/en/calculators/cooking/): Recipe Scaler; Pizza Dough; Bread; Rice; Rice to Water Ratio; Coffee Ratio; Baker's Percentage; Brine.
- **Fond** (fond.kitchen/tools/): Pizza Dough; Cooking Unit Converter; Baker's Percentage.
- **MyKitchenCalculator** (mykitchencalculator.com): Kitchen Calculator (volumen, peso, largo, tiempo, temperatura); Recipe Converter (escalar).
- **BakingCalculators** (bakingcalculators.com): Quick Convert (consulta en texto libre: «2 cups flour to grams»); Recipe Resizer; Ingredient Guide. El conversor de receta entera usa IA.
- **Calculator Soup** (calculatorsoup.com/calculators/conversions/cooking.php): un solo Cooking Conversion Calculator, que muestra la fórmula.
- **best-calculators.com:** Butter Calculator; Ingredient Volume-to-Weight; Oil to Butter; Cooking Measurement Converter (el índice dio 404).
- **Stadler Made** (stadlermade.com/pizza-calculator/): pizza (estilo, cantidad, hidratación, tipo de levadura, medidas de la placa, harina, porcentajes de sal, aceite, azúcar, malta y sémola → peso de bollo e ingredientes); Pan Calculator; Bread Calculator; Yeast Measuring Tool; Flour Selector.
- **cookingtimes.co.uk:** tiempo de cocción para 13 carnes (incluye faisán, paloma, codorniz, conejo, ciervo); guías de ahumado, cocción lenta, freidora de aire y guarniciones; Meal Planner con etapas de tiempo.
- **roastdinner.ianrenton.com:** carne y peso, verduras, extras y hora de servir → cronograma hacia atrás con la hora de arranque de cada componente.
- **calculator.net, calcuvio.com, calculadoraconversor.com:** nada de cocina. **calculadoras.uno:** sólo «Volume a Peso (culinarias)».

---

## 2. Sitios de cocina

- **King Arthur Baking** (kingarthurbaking.com/learn): Ingredient Weight Chart (más de 200 ingredientes, con filtro al escribir e impresión); High-Altitude Baking (tablas de ajuste por altitud y tipo de masa); guías de masa madre, levadura, pie y torta. En la receta: **Bake Mode** («Prevent your screen from going dark») e imprimir. El conmutador volumen/onzas/gramos y el 1x/2x/3x: (sin verificar).
- **BBC Good Food** (bbcgoodfood.com/howto/guide/roast-timer y /conversion-guides): Roast timer (carne y punto entre 14 opciones, peso → tiempos y temperaturas, más reposo). Tablas: **puntos del azúcar** (hilo a caramelo duro, en °C y °F); molde redondo ↔ cuadrado; horno eléctrico, con ventilador y gas mark. Un «sponge calculator» por tamaño de molde: (snippet).
- **BBC Food:** roast calculator para ocho carnes (snippet; el fetch está bloqueado).
- **Delia Online** (deliaonline.com/information-centre/oven-temperatures-and-conversions): tablas de horno (con ajuste para ventilador y para pavo), cucharas, pesos, dimensiones, volumen, tazas americanas y líquidos. «Scaling up cake recipes»: ingredientes y tiempos de una torta por tamaño de molde (snippet).
- **Jamie Oliver** (jamieoliver.com/features/guide-to-roasting-meat/): tabla de asado para siete carnes (temperatura de horno, tiempo por peso, temperatura interna, reposo) y PDF descargable. Sin calculadora.
- **Allrecipes:** en la receta, «Toggle Screen Wake», escala **1/2X, 1X, 2X**, Jump to Recipe, Print, «I Made It».
- **Serious Eats:** en la receta, «Toggle Screen Wake», sección Special Equipment, Print. Herramientas sueltas vistas sólo en snippet: tabla porotos secos ↔ lata, «booze calculator» para invitados, calculadora de slushies alcohólicos.
- **NYT Cooking:** Add to Grocery List; imprimir con opción «Include recipe photo».
- **AmazingRibs** (página de Weights, Measures & Conversion Charts): Conversions Calculator; **Salt Converter** (entre tipos de sal); calculadora de curas húmedas; Ground Meat Calculator; tablas de equivalencias por ingrediente (porotos, queso, chocolate, ajo, harina, hongos, pasta y arroz, azafrán, azúcares, grasas, huevos, jugos, vinagreta, vino); temperaturas; **cocción en altura**; briquetas; olla lenta. Food Temperature Guide aparte.
- **ChefSteps y Joule:** Egg Calculator (elegís la textura de yema y de clara → temperatura y tiempo); Sous Vide Time and Temperature Guide; Visual Doneness; «cook calculator» de Breville+. Todo (snippet).
- **Anova** (anovaculinary.com/pages/sous-vide-time-and-temperature-guide): tabla estática de temperatura por punto y rango de tiempo para ocho categorías, con PDF imprimible.
- **Douglas Baldwin** (douglasbaldwin.com/sous-vide.html): tablas de tiempo de calentamiento por grosor y forma (fresco y congelado), pasteurización por grosor y temperatura (pescado, ave, carne) y enfriado en baño de hielo.
- **Recetas de Rechupete:** **calendario de temporada** (tabla mes por producto en cinco categorías, con link a recetas); equivalencias de medidas; proporciones básicas en repostería; tabla de puntos de la carne; guías de sustitución; menús semanales.
- **Recetas Nestlé (AR):** planificador de menú; búsqueda por ingredientes que tenés.
- **Gallina Blanca:** Menu Planner; «Inspírame»; filtros por técnica, tiempo y dificultad.
- **El Gourmet:** glosario; filtro por tiempo de cocción.
- **Directo al Paladar, Paulina Cocina, Cocineros Argentinos, Cookpad:** ninguna herramienta en la página de inicio.
- **Plugins de tarjeta de receta** (lo que usan casi todos los blogs):
  - WP Recipe Maker: porciones ajustables; conversión de unidades y temperatura; Cook Mode; tildar ingredientes; impresión con opción de sacar imágenes; Jump to Recipe; colecciones; planificador y lista de compras.
  - Tasty Recipes: escala 1x/2x/3x; US ↔ métrico; Cook Mode; casillas de ingredientes; **copiar ingredientes al portapapeles**; tamaño de texto al imprimir.

---

## 3. Apps

- **Paprika** (paprikaapp.com): temporizadores detectados en el texto del paso; escalar a porciones; métrico ↔ imperial; tachar ingredientes; resaltar el paso actual; pantalla encendida; fijar varias recetas activas; lista de compras por góndola que suma cantidades; plan semanal y mensual con plantillas de menú; despensa.
- **Mela** (mela.recipes): modo cocina a pantalla completa con texto grande, paso actual resaltado y el resto atenuado; tildar ingredientes; temporizadores; varias recetas a la vez; calendario; compras en Recordatorios.
- **Crouton** (App Store):
  - Paso a paso: un paso por vez; tocar un ingrediente dentro del paso muestra su cantidad; **manos libres con guiño o gesto de mano**; partir pasos largos.
  - Temporizadores: detectados y con nombre propio; en pantalla bloqueada y reloj.
  - Escalado: por multiplicador, por porciones o **por un ingrediente elegido**; sustituciones aplicadas sin tocar la receta guardada; recetas enlazadas como ingrediente.
  - Aparatos: sonda de temperatura Combustion; **balanza Bluetooth con pesado guiado**.
  - Plan: plan al azar; insignia «preparar con anticipación».
- **Pestle** (pestlechef.app): cocina guiada; escalar; métrico ↔ imperial; plan con calendario; lista de compras; SharePlay (avanzar el paso lo avanza en la otra pantalla). Voz y temporizadores múltiples: (sin verificar).
- **AnyList:** modo cocina; alternar entre recetas mientras cocinás; escalar; lista que combina ingredientes; calendario.
- **Cooklang** (cooklang.org/app/ y la spec): paso a paso con texto grande y los ingredientes de cada paso; temporizadores marcados en el texto (`~{3%minutes}`), con notificación; utensilios marcados (`#`); escalar; lista por góndola.
- **Umami:** «Start Cooking», con checklist de ingredientes y pasos; exporta a PDF, Markdown y JSON.
- **Recipe Keeper:** escalar; plan; lista por góndola; paso a paso por voz con Alexa; libro en PDF.
- **Kitchen Stories** (App Store): fotos por paso; calculadora de porciones; lista agregada; recetas a partir de sobras.
- **Tasty** (App Store): modo paso a paso; porciones ajustables con métrico y US; búsqueda por ingredientes que tenés.
- **SideChef:** paso a paso; plan; lista de compras.
- **Samsung Food:** caja de recetas; plan semanal; lista de compras. Modo cocina con temporizadores: (sin verificar).
- **Mealie:** plan con comida al azar según reglas; lista de compras con etiquetas; organización por utensilio; Cook Mode, «Keep Screen Awake» e ingredientes vinculados a pasos (vistos en las discusiones de GitHub, no en la documentación).
- **Tandoor** (docs.tandoor.dev): escalar; fracciones o decimales; vista de impresión; plan; lista de compras.
- **Cookidoo / Thermomix:** «Mi semana»; lista de la compra; modos de cocción. Cocina guiada con balanza y temporizador integrados: (sin verificar).
- **Kitchen Calculator PRO** (App Store): escalar con fracciones; peso ↔ volumen por ingrediente; biblioteca de ingredientes propios con densidad; volumen, peso, temperatura y distancia.
- **MEATER** (App Store): Guided Cook (cuánto falta, cuándo sacar, cuánto reposar); estimación que se afina durante la cocción; temperatura interna y ambiente; hasta cuatro sondas; historial de cocciones.
- **Traeger** (traeger.com/app): tiempos y temporizadores; alertas; cocción guiada por proteína y punto; nivel de pellets.
- **Ooni** (App Store): calculadora de masa (temperatura, hidratación, tipo de levadura, tiempo de leudado, prefermentos, aceite, masa madre, estilo Detroit); guardar cálculos con nombre, notas y puntaje.
- **Apps de masa de pizza** (comparativa en pandough.app/en/blog/best-pizza-dough-calculators): levadura según temperatura ambiente y ventana de fermentación (PizzApp+); hidratación según la fuerza W de la harina (Pandough, Pizza Pro); fermentación en varias etapas; biga y poolish.
- **Filtru** (getfiltru.com): temporizador guiado de café (verter, revolver, esperar) por método; pesos objetivo por paso; balanza Bluetooth con gráfico de flujo; diario de granos; lectura de la balanza en voz alta.
- **Difford's Guide** (diffordsguide.com/cocktails/search): buscador de cócteles por ingredientes que tenés, con exclusiones; filtros por cristalería, estilo y ABV.
- **BigOven** (sin verificar, bloqueado): «Use Up Leftovers», plan de menú, lista de compras.

---

## 4. Fabricantes

- **Butterball** (butterball.com/calculators-conversions): porciones (adultos, chicos, sobras, apetito → kilos de pavo y de relleno); tiempo de descongelado (heladera o agua fría); tiempo de cocción (con o sin relleno); tablas de líquidos, secos y temperatura.
- **Instant Pot** (instantpot.com/pages/cooking-time-tables): tabla de tiempos filtrable por aparato (seis), por ingrediente y por categoría.
- **Weber** (weber.com, Grill Skills): guías por combustible y por proteína; «prueba de la mano» para medir el calor; configuración del fuego. Sin calculadoras.
- **Traeger:** guía de 51 cortes de vaca; guías de tiempos y temperaturas.
- **Ninja / SharkNinja:** sólo recetas con filtros.
- **KitchenAid** (sin verificar, timeout): artículos de conversión de medidas y de horno convencional a convección.

---

## 5. Lista consolidada

El número es la cantidad aproximada de fuentes verificadas que lo ofrecen.

**Escalar y convertir**
- Escalar receta por factor o porciones (~24). Variantes: con fracciones de cocina; mitad de receta; por un ingrediente elegido (rareza, Crouton); manteniendo el porcentaje (salmueras).
- Conversor general de unidades: volumen, peso, temperatura (~18).
- Volumen ↔ peso por ingrediente, con densidades (~12). Variantes: ingredientes propios; consulta en texto libre.
- Métrico ↔ imperial dentro de la receta (~6).
- Manteca: barras, tazas, gramos (4). Aceite ↔ manteca (4).
- Conversores por ingrediente: sal entre tipos (3), harina, azúcar, leche (1 cada uno).
- Temperatura de horno °C, °F, gas mark, ventilador o convección (~8).
- Horno → freidora de aire (~7). Horno → microondas (1). Horno → olla lenta (2).
- Tabla de tiempos de olla a presión (2).
- Molde a molde, con factor de ingredientes (~6). Variantes: ajuste de tiempo y temperatura por molde (1); torta → cupcakes (1); redondo ↔ cuadrado en tabla (2).
- Levadura fresca, seca e instantánea (5).
- Hierbas frescas ↔ secas (3). Especia entera ↔ molida (1). Ajo diente ↔ polvo (1). Tamaño de huevo (1). Harina leudante casera (1).
- Buscador o tabla de sustituciones (~4).
- Ajuste por altitud: horneado (3), conservas (1), huevo (1).

**Crudo, cocido y proporciones**
- Arroz: agua por tipo, y crudo → cocido (~7). Variantes rara vez vistas: sushi, congee, paella, biryani.
- Pasta seca → cocida, y por persona (4).
- Peso crudo → cocido, merma, rendimiento por corte (3).
- Proporciones fijas: gravy o roux (2), vinagreta (1), espesantes (1), caldo huesos-agua (2), galletitas (1), ganache (1), merengue (1), helado (2), crema batida (2), rub por peso de carne (1), mezcla de especias (1).

**Pan, pizza y masas**
- Porcentaje panadero o calculadora de pan (~9).
- Masa de pizza por estilo y cantidad de bollos (~9). Variantes: levadura según tiempo y temperatura (3); prefermentos (3); por medidas de placa (1); según fuerza W (2).
- Masa madre: alimentar el fermento, levain, hora de pico (5).
- Tiempo de leudado según temperatura (3).
- Generador de cronograma de masa (2).

**Sal, salmuera, fermentos y conservas**
- Salmuera por porcentaje (~9). Variantes: equilibrio, seca, inyección, tiempo por corte, porcentaje de una ya hecha.
- Sal para fermentar vegetales (5).
- Curado con nitrito (4).
- Pickles en vinagre (2).
- Conservas: tiempo de baño maría o presión (1), pH (1), frascos por kilo (1), mermelada azúcar-pectina (1).
- Por producto, sólo en UseCalcPro: kéfir, yogur, kombucha, tempeh, natto, vinagre, tepache, ginger beer, salsa picante; queso, ricota, cuajo, tofu, seitán, ghee, leche de avena.

**Carnes y cocción**
- Tiempo de asado por carne y peso (~11).
- Descongelado (5).
- Tabla de temperatura interna y puntos (~7).
- Sous vide, tiempo y temperatura (4). Variantes: por grosor y pasteurización (1); huevo por textura (1).
- Huevo duro o pasado por tamaño y altitud (1). Bife por grosor (1).
- Cronograma hacia atrás de una comida entera (2).
- Estimación en vivo de tiempo restante y reposo con sonda (2).
- Parrilla y ahumado: temperaturas (2), madera por carne (1), briquetas o pellets (2), tamaño de parrilla (1).
- Tiempos de verduras al horno (2).
- Puntos del azúcar (1).

**Cantidades para gente**
- Cuánta comida por persona (~7). Variantes: pavo o jamón, asado, tacos, puré, pochoclo, pasta, sopa.
- Cuántas pizzas pedir (2 a 4). Comparar tamaño y precio de pizzas (3).
- Bebidas y alcohol para una fiesta (3). Hielo (1). Reparto de un potluck (1). Porciones de torta por tamaño (4).

**Bebidas**
- Café: proporción café-agua (6). Cold brew (1). Temporizador guiado de preparación (1).
- Té: tiempo y temperatura (1).
- ABV y dilución de alcohol (3). Cóctel en tanda (1).
- Tiempo para enfriar una bebida (1).
- Cócteles con lo que tenés (1).

**Costos**
- Costo por porción o por ingrediente (4). Precio de torta (1). Costo de un lote (2).

**Dentro de la receta**
- Paso a paso o paso actual resaltado (~10).
- Pantalla encendida (~7).
- Temporizadores (~8). Variantes: detectados en el texto del paso (3); múltiples y con nombre (2); en pantalla bloqueada o reloj (2).
- Tildar ingredientes (5).
- Ingredientes del paso a la vista, o tocar el ingrediente y ver la cantidad (3).
- Varias recetas activas a la vez (3).
- Botones 1/2x, 1x, 2x (3).
- Imprimir con opciones: sin fotos, tamaño de texto (3).
- Copiar ingredientes al portapapeles (1).
- Manos libres por gesto o guiño (1). Voz (1).
- Cocina sincronizada entre dos pantallas (2).
- Balanza conectada con pesado guiado (2).
- Sección de utensilios (3).
- Insignia «preparar con anticipación» (1).

**Alrededor de la receta**
- Plan semanal (~17). Variantes: plan al azar con reglas (3); plantillas de menú (1).
- Lista de compras desde recetas, que suma y ordena por góndola (~15).
- Despensa (1).
- Buscar por ingredientes que tenés (4). Recetas con sobras (2). Calculadora de sobras (1).
- Calendario de temporada (1).
- Glosario (2).
- Historial de cocciones (2).

**Rarezas**
- Calculadora de la tostada perfecta (Good Calculators).
- Huevo según altitud y presión (Omni); huevo por textura de yema y clara (ChefSteps).
- Tiempo para enfriar una bebida, con curva (Omni).
- Diagnóstico de qué salió mal, visualizador de fuerza de salmuera y generador de ficha imprimible (Brine Calculators).
- Planificador de varias preparaciones a la vez, con espacio de heladera (Brine Calculators).
- Cronograma hacia atrás del asado completo (roastdinner).
- Reparto de un potluck; cantidad de hielo; estimación Scoville (UseCalcPro).
- Marcas de cuchillo por pulgada; tiempo de mantenimiento en caliente (Calculator Academy).
- Tabla de puntos del azúcar (BBC Good Food).
- Madera por carne; rub por peso; guía de tamaños de olla (Flour & Scale).
- Bread Spreads, Garlic Clove to Powder, Self-rising Flour (Omni).
- Escalar por un ingrediente, guiño para pasar de paso, pesado guiado (Crouton).
- Copiar ingredientes al portapapeles (Tasty Recipes).
- «Prueba de la mano» para el calor de la parrilla (Weber).

**No apareció en ninguna fuente verificada:** conversor de tamaños de lata, lector de ingredientes en voz alta, ruleta de recetas y checklist de mise en place como herramienta propia. Lo más cercano: tabla porotos secos ↔ lata (Serious Eats, snippet), lectura de balanza en voz alta (Filtru), plan al azar (Crouton, Mealie) y checklist de ingredientes (Umami, Mela).

---

## Índices completos de otros catálogos

Nombres de las herramientas tal como figuran en la página índice de cada sitio. No se abrió cada herramienta.

### https://bakecalcs.uk/

Based on the webpage content provided, the site displays **categories with calculator counts** rather than individual calculator names:

| Category | Count | URL |
|----------|-------|-----|
| Baking Essentials | 18 | /baking-essentials/ |
| Bread & Dough | 17 | /bread-and-dough/ |
| Pastry & Desserts | 15 | /pastry-and-desserts/ |
| Cooking & Roasting | 13 | /cooking-and-roasting/ |
| Portions & Catering | 15 | /portions-and-catering/ |
| Preserving & Canning | 10 | /preserving-and-canning/ |
| Drinks & Beverages | 12 | /drinks-and-beverages/ |
| Conversions & Units | 16 | /conversions-and-units/ |
| Sugar & Chocolate | 12 | /sugar-and-chocolate/ |
| Eggs & Dairy | 10 | /eggs-and-dairy/ |
| Biscuits & Cookies | 8 | /biscuits-and-cookies/ |
| Seasonal & Holiday | 10 | /seasonal-and-holiday/ |
| Kitchen Maths | 10 | /kitchen-maths/ |
| Event Planning | 1 | /event-planning/ |

**Total: 167+ calculators across 14 categories**

The homepage does not list individual calculator names—it only displays category overviews with links to access each category's full calculator list.

### https://www.jjlmoya.es/utilidades/

1. **Conversor Cocina Americana Cups a Gramos y Temperaturas** - Convierte medidas estadounidenses (cups, tablespoons, Fahrenheit) al sistema métrico para recetas.

2. **Diagnóstico y Conservación de Plátanos: Guía Científica** - Analiza maduración y técnicas de conservación con bases científicas.

3. **Calculadora de Salmuera por Equilibrio** - Calcula salinidad exacta para carnes jugosas y fermentados.

4. **Selector de Sartenes Inteligente: Guía de Utensilios de Cocina** - Guía interactiva para elegir sartenes según estilo de cocina.

5. **Cronómetro de Huevos Científico** - Cálculos termodinámicos para cocción perfecta de huevos.

6. **Escalador de Ingredientes Ajuste de Recetas** - Escala automáticamente recetas según número de raciones.

7. **Temporizador de Cocina Múltiple** - Gestiona múltiples tiempos de cocción simultáneamente.

8. **Calculadora de Merengue y Punto de Nieve** - Calcula azúcar exacta para diferentes tipos de merengue.

9. **Calculadora para Escalar Moldes de Repostería** - Adapta recetas a tus moldes específicos.

10. **Calculadora de Masa Pizza Napolitana** - Proporciones exactas de harina, agua, sal y levadura.

11. **Guía Maestra de Roux y Salsas Madre** - Proporciones precisas para Bechamel, Velouté y Espagnole.

12. **Calculadora de Masa Madre Ratios de Fermentación** - Proporciones automáticas para mantener cultivo.

13. **Conversor de Levadura: Fresca, Seca y Masa Madre** - Convierte entre tipos de levadura con ajustes de receta.

14. **Calculadora de Tiempo de Fermentación de Levadura** - Estima tiempos de fermentación según temperatura y volumen.

15. **Calculadora de Sal para Fermentación Lacto** - Porcentajes precisos de sal para fermentación.

16. **Calculadora de Baño de Esferificación** - Proporciones de alginato y lactato de calcio.

17. **Calculadora PAC POD de Helado** - Cálculos de anticongelante y edulcorante para helados.

18. **Calculadora de Seguridad en Conservas Botulismo** - Evalúa seguridad térmica en conservas.

19. **Calculadora de Transglutaminasa para Pegamento de Carne** - Dosificación precisa de transglutaminasa.

20. **Predictor de Cocción Residual** - Predice temperatura final tras retirar del horno.

21. **Optimizador de la Reacción de Maillard** - Calcula bicarbonato para acelerar reacción de Maillard.

22. **Predictor de Secado de Macarons** - Tiempos exactos según humedad y temperatura.

23. **Calculadora de Densidad de Brix para Sorbetes** - Balance azúcar-puré para sorbetes cremosos.

24. **Monitor de Punto de Humo del Aceite** - Supervisa calidad del aceite de fritura.

25. **Neutralizador de Ácidos para Levadura** - Proporciones de bicarbonato y polvo de hornear.

26. **Calculadora de Pectina y Cuajado de Mermelada** - Cálculos para cuajado perfecto sin líquidos.

27. **Curvas de Pasteurización para Sous Vide** - Tiempos seguros de pasteurización en cocción a baja temperatura.

28. **Calculadora de Estabilidad de Emulsión y Límite de Aceite** - Cuánto aceite soporta mayonesa o salsas.

29. **Calculadora de Inoculación e Hidratación de Koji** - Humedad y dosis de esporas para koji casero.

30. **Calculadora Multiplicador de Floculación para Queso** - Momento exacto para cortar cuajada en quesería.

31. **Estimador de Humedad de Deshidratador** - Pérdida de peso y tiempo de secado de alimentos.

32. **Calculadora de Coste y Rendimiento de Maduración en Seco** - Pérdida de peso y coste real en maduración.

33. **Curva de Templado de Chocolate y Guía de Siembra** - Temperaturas termodinámicas para templado perfecto.

34. **Comprobador de temperatura segura** - Compara temperaturas internas con mínimos seguros de cocción.

### https://joteo.net/food-calculators/

**Baking Calculators (19)**
- Baker's Percentage Calculator
- Bread Calculator (Loaf Size)
- Bread Hydration Calculator
- Cake Pan Converter
- Cake Pricing Calculator
- Cake Serving Calculator
- Cookie Batch Calculator
- Donut Calculator
- Frosting/Icing Coverage Calculator
- High Altitude Baking Adjustment Calculator
- Oven Temperature Converter
- Pancake Recipe Calculator
- Perfect Ice Cream Calculator
- Perfect Pancake Calculator
- Pie Crust Calculator
- Poolish/Preferment Calculator
- Sourdough Calculator
- Sourdough Starter Feeding Calculator
- Tangzhong Calculator

**Bread & Dough Calculators (9)**
- Bagel Dough Calculator
- Bread Spread Calculator
- Brioche Dough Calculator
- Desired Dough Temperature Calculator
- Dough Ball Weight Calculator
- Flour Absorption Calculator
- Pizza Dough Calculator
- Pretzel Dough Calculator
- Proofing Time Calculator

**Coffee & Tea Calculators (14)**
- Caffeine Content Calculator
- Chai Tea Calculator
- Coffee Calculator
- Coffee Footprint Calculator
- Coffee Kick Calculator
- Coffee Ratio Calculator
- Coffee to Water Ratio Calculator
- Cold Brew Ratio Calculator
- Espresso Shot Calculator
- French Press Calculator
- Healthy Coffee Calculator
- Iced Coffee Dilution Calculator
- Matcha Calculator
- Pour Over Calculator

**Cooking Measurement Converters (26)**
- Cooking Measurement Converter
- Cups to Grams Converter
- Cups to Milliliters Converter
- Cups to Ounces Converter
- Cups to Pounds Converter
- Cups to Tablespoons Converter
- Cups to Teaspoons Converter
- Grams to Cups Converter
- Grams to Ounces Converter (Kitchen)
- Grams to Tablespoons Converter
- Grams to Teaspoons Converter
- Liters to Gallons Converter (Kitchen)
- Metric to Imperial Kitchen Converter
- Milliliters to Cups Converter
- Milliliters to Grams Converter
- Milliliters to Tablespoons Converter
- Milliliters to Teaspoons Converter
- Ounces to Cups Converter
- Pinch/Dash/Smidgen Converter
- Pounds to Cups Converter
- Tablespoons to Cups Converter
- Tablespoons to Grams Converter
- Teaspoons to Cups Converter
- Teaspoons to Grams Converter
- Teaspoons to Milliliters Converter
- ml to Grams Calculator

**Cooking Time & Temperature Calculators (22)**
- Air Fryer Conversion Calculator
- Brisket Cooking Time Calculator
- Chicken Cooking Time Calculator
- Chilled Drink Calculator
- Convection Oven Conversion Calculator
- Deep Frying Time Calculator
- Egg Boiling Calculator
- Fish Cooking Time Calculator
- Ham Cooking Time Calculator
- Ideal Egg Boiling Calculator
- Meat Doneness Temperature Chart Calculator
- Perfect Pizza Calculator
- Pork Tenderloin Cooking Calculator
- Pressure Cooker Time Converter
- Prime Rib Cooking Calculator
- Roast Cooking Time Calculator
- Slow Cooker Time Converter
- Smoking Meat Time Calculator
- Sous Vide Time & Temperature Calculator
- Steak Cook Time Calculator
- Turkey Cooking Time Calculator
- Water Cooling Calculator

**Diet-Specific Calculators (9)**
- Carb Counting Calculator (Diabetes)
- Carnivore Diet Protein Calculator
- DASH Diet Serving Calculator
- Elimination Diet Tracker Calculator
- Keto Macro Calculator
- Low FODMAP Calculator
- Mediterranean Diet Score Calculator
- Paleo Diet Macros Calculator
- Vegan Protein Calculator

**Drinks & Beverages Calculators (18)**
- ABV Calculator (Alcohol by Volume)
- Beer IBU Calculator
- Beer SRM Color Calculator
- Cocktail Ratio Calculator
- Homebrew OG/FG Calculator
- Keg Volume Calculator
- Kombucha Brewing Calculator
- Lemonade Batch Calculator
- Mash Temperature Calculator
- Party Drink Calculator
- Priming Sugar Calculator
- Punch Bowl Calculator
- Smoothie Ratio Calculator
- Strike Water Calculator
- Sulfur Calculator (Wine)
- Wedding Alcohol Calculator
- Wine Must Calculator
- Yeast Pitch Rate Calculator

**Food Business & Restaurant Calculators (12)**
- Bakery Pricing Calculator
- Break-Even Analysis (Restaurant)
- Catering Profit Margin Calculator
- Edible Portion Cost Calculator
- Food Truck Revenue Calculator
- Inventory Turnover Calculator (Food)
- Kitchen Yield Percentage Calculator
- Labor Cost Percentage Calculator
- Menu Engineering Calculator
- Plate Cost Calculator
- Restaurant Food Cost Calculator
- Waste Tracking Calculator

**Food Preservation & Fermentation Calculators (16)**
- Bacon Curing Calculator
- Brine Calculator
- Canning Processing Time Calculator
- Cheese Making Calculator
- Dehydrator Time Calculator
- Fermentation Temperature Calculator
- Food pH Calculator
- Freeze Drying Batch Calculator
- Jerky Yield Calculator
- Kimchi Salt Calculator
- Meat Curing Salt Calculator
- Pickling Brine Calculator
- Pressure Canner PSI Calculator
- Sauerkraut Salt Calculator
- Sausage Making Calculator
- Yogurt Making Calculator

**Food Safety Calculators (7)**
- Cooling Time Calculator (Food Service)
- Cross-Contamination Risk Calculator
- Food Expiration Date Calculator
- Hot Holding Temperature Calculator
- Meat Temperature Safety Calculator
- Refrigerator Temperature Calculator
- Water Activity (aw) Calculator

**Garden to Table Calculators (8)**
- Apple Cider Yield Calculator
- Fruit Jam Yield Calculator
- Harvest to Canning Calculator
- Herb Garden Yield Calculator
- Microgreens Yield Calculator
- Seed Starting Date Calculator
- Sprout Growing Calculator
- Tomato Sauce Yield Calculator

**Grilling & Smoking Calculators (9)**
- Brisket Per Person Calculator
- Burger Patty Calculator
- Charcoal Quantity Calculator
- Grill Temperature Zone Calculator
- Meat Resting Time Calculator
- Propane Gas Grill Calculator
- Pulled Pork Yield Calculator
- Ribs Per Person Calculator
- Steak Thickness to Time Calculator

**Ingredient Substitution Calculators (14)**
- Butter Calculator (Stick Converter)
- Butter to Oil Conversion
- Cocoa to Chocolate Converter
- Cream Substitution Calculator
- Dairy-Free Milk Substitution Calculator
- Egg Substitute Calculator
- Fresh to Dry Herb Conversion Calculator
- Garlic Clove to Powder Converter
- Gluten-Free Flour Blend Calculator
- Honey to Sugar Converter
- Oil to Butter Conversion
- Self-Rising Flour Calculator
- Sugar Substitute Calculator
- Yeast Converter

**International Cuisine Tools (9)**
- Curry Spice Blend Calculator
- Dumpling Wrapper Calculator
- Hummus Recipe Calculator
- Pho Broth Calculator
- Ramen Broth Calculator
- Sushi Rice Calculator
- Tempura Batter Calculator
- Thai Curry Paste Calculator
- Tortilla Calculator

**Meal Planning & Portions Calculators (10)**
- Food Waste Calculator
- Freezer Storage Time Calculator
- Leftovers Shelf Life Calculator
- Meal Prep Calculator
- Pantry Inventory Calculator
- Portion Size Calculator
- Quarantine Food Calculator
- School Lunch Nutrition Calculator
- Serving Size Comparison Calculator
- Weekly Meal Planner Calculator

**Nutrition & Calorie Calculators (12)**
- DRI Calculator (Dietary Reference Intakes)
- Fiber Content Calculator
- Food Calorie Calculator (USDA)
- Iron Calculator (Food)
- Macro Calculator (Food)
- MyPlate Plan Calculator
- Omega-3 Calculator
- Protein Per Meal Calculator
- Recipe Nutrition Analyzer
- Salad Calories Calculator
- Sugar Content Calculator
- Vitamin Content Calculator

**Party & Event Food Calculators (22)**
- Appetizer Quantity Calculator
- BBQ Grill Size Calculator
- BBQ Party Calculator
- Buffet Food Quantity Calculator
- Catering Cost per Head Calculator
- Charcuterie Board Calculator
- Holiday Cookie Exchange Calculator
- How Much Ham per Person Calculator
- How Much Mashed Potatoes per Person
- Pizza Comparison Calculator
- Pizza Party Calculator
- Pizza Size Calculator
- Popcorn Calculator
- Potluck Planner Calculator
- Sandwich Platter Calculator
- Super Bowl Party Food Calculator
- Taco Bar Calculator
- Thanksgiving Calculator
- Thanksgiving Calories Calculator
- Turkey Defrost Time Calculator
- Turkey Size Calculator
- Turkey Thawing Calculator

**Pasta, Rice & Grains Calculators (10)**
- Couscous Cooking Calculator
- Dry to Cooked Pasta Converter
- Grain Cooking Chart Calculator
- Noodle Portion Calculator
- Oatmeal Ratio Calculator
- Pasta Per Person Calculator
- Quinoa Cooking Calculator
- Rice Per Person Calculator
- Rice to Water Ratio Calculator
- Uncooked to Cooked Rice Calculator

**Recipe Scaling & Conversion Calculators (11)**
- AI Recipe Converter
- Batch Cooking Calculator
- Catering Quantity Calculator
- Cost per Serving Calculator
- Food Cost Percentage Calculator
- Menu Pricing Calculator
- Recipe Converter (Scaler)
- Recipe Cost Calculator
- Recipe Multiplier/Divider
- Recipe Portion Calculator
- Recipe Yield Calculator

**Specialty Food Calculators (13)**
- Bone Broth Ratio Calculator
- Brine Concentration Calculator (Food)
- Candy Temperature Stage Calculator
- Caramel Stage Calculator
- Chocolate Tempering Calculator
- Dry Rub Calculator
- Gelatin/Agar Ratio Calculator
- Maple Syrup Yield Calculator
- Marinade Volume Calculator
- Nutritional Yeast Calculator
- Oil Smoke Point Reference Calculator
- Soap Making Lye Calculator
- Spice Blend Ratio Calculator

### https://hacecuentas.com/cocina

Based on the page content, here are all the kitchen calculators listed:

1. **Adapt a Recipe** — "Recalculá todos los ingredientes según la cantidad real de personas" (adjust all ingredients based on actual number of people)

2. **Oven Temperature** — Convert between Celsius, Fahrenheit, and gas oven settings

3. **Kitchen Measurements** — "Pasá entre medidas de volumen y peso por ingrediente" (convert between volume and weight measurements by ingredient)

4. **Food for an Event** — Calculate quantities and margins based on menu type

5. **Empanadas and Side Dishes** — Determine portions per person, flavors, and accompaniments

6. **Coffee Calculator** — Grams of coffee and water milliliters for different brewing methods

7. **Homemade Beer** — Calculate ABV, attenuation, IBU, and priming sugar

8. **Meat Cooking** — Oven time per kilogram, internal temperature, and doneness levels

9. **Yeast/Dough Rising** — "¿Cuánto tarda en levar tu masa según la temperatura ambiente" (calculate rising time based on ambient temperature)

10. **Rice or Pasta Portions** — Grams per person, water, and salt amounts

### https://formulafactory.tools/cooking-calculators/

1. Air Fryer Time Calculator
2. Baker's Percentage and Hydration Calculator
3. Batch Size Calculator
4. Blender Batch Calculator
5. Bread Hydration Calculator
6. Bread Recipe Calculator
7. Brine Calculator
8. Buffet Quantity Calculator
9. Butter Converter
10. Cake Pan Size Converter
11. Cake Serving Calculator
12. Calorie (TDEE) Calculator
13. Canning Jar Calculator
14. Carbs Calculator
15. Cooking Measurement Converter
16. Cost per Serving Calculator
17. Double / Half Recipe Calculator
18. Dough Portion Calculator
19. Dry Rub Calculator
20. Fermentation Salt Calculator
21. Fiber Calculator
22. Fish Cooking Time Calculator
23. Freezer Space Calculator
24. Gluten-Free Flour Converter
25. Grams to Cups Converter
26. Ingredient Adjuster
27. Ingredient Price Comparator
28. Ingredient Weight Converter
29. Jam & Jelly Calculator
30. Keto Macro Calculator
31. Length Converter
32. Loaf Pan Size Calculator
33. Macro Calculator
34. Marinade Calculator
35. Meal Prep Portion Calculator
36. Meat Roasting Time Calculator
37. Meat Yield & Trim Loss Calculator
38. Moisture Loss Calculator
39. Net Carbs Calculator
40. Nutrition Lookup Calculator
41. Oven Temperature Converter
42. Party Servings Calculator
43. Pickling Brine Calculator
44. Pizza Calculator
45. Pizza Dough Calculator
46. Pizza Sauce Calculator
47. Pizza Toppings Calculator
48. Price per Unit Calculator
49. Proofing Time Calculator
50. Protein Calculator
51. Recipe Scaler (Serving Size Converter)
52. Recipe Yield Calculator
53. Reheat Time Calculator
54. Resting Time Calculator
55. Rice to Water Ratio Calculator
56. Sales Tax Calculator
57. Salt Percentage Calculator
58. Seafood Thawing Time Calculator
59. Seafood Yield Calculator
60. Shrimp & Shellfish Calculator
61. Slow Cooker Converter
62. Smoke Time Calculator
63. Sodium Calculator
64. Sourdough Starter Calculator
65. Turkey Thawing and Cooking Time
66. Vegan Egg Replacer Calculator
67. Weight Converter
68. Yeast Converter

### https://thecalculatedcook.com/

1. Recipe Scaler
2. Unit Converter
3. Rice Calculator
4. Pasta Calculator
5. Bean Calculator
6. Butter Calculator
7. Cookie Calculator
8. Brisket Calculator
9. Turkey Calculator
10. Chicken Calculator
11. Wing Calculator
12. Charcuterie Board Calculator
13. Tamale Bar Calculator
14. Seafood Buffet Calculator
15. Breakfast Bar Calculator
16. Soup Bar Calculator
17. Party Food Calculator
18. Lunch Packing Calculator
19. Mashed Potato Calculator
20. Coffee Ratio Calculator
21. Fraction Calculator
22. Air Fryer Converter
23. Shopping List
24. Grocery Cost Estimator
25. Ingredient Substitutions
26. Temperature Converter
27. Baking Pan Converter
28. Thawing Calculator
29. Brine Ratio & Timing Calculator
30. Sweet Potato Cooking Time Calculator
31. Induction Cookware Compatibility Checker
32. Water Bath Canning Altitude Adjustment Calculator
33. Pumpkin Puree Calculator
34. Pantry Storage Calculator

### https://cookcalculator.net/

1. Cups to Grams
2. Temperature Converter
3. Oven ↔ Air Fryer
4. Slow Cooker ↔ Oven
5. Pan Size Converter
6. Egg Boiling Calculator
7. Rice-to-Water Ratio
8. Pasta Calculator
9. Cooking Time by Weight
10. Meat Thawing Calculator
11. Instant Pot Converter
12. Brine Calculator
13. Smoker & BBQ Calculator
14. Freezer Storage Guide
15. Sourdough Calculator
16. Pizza Dough Calculator
17. Egg Substitute Calculator
18. Sugar Substitute Calculator
19. Ingredient Substitutions
20. Recipe Scaler
21. Party & BBQ Food Calculator
22. FODMAP Food Checker
23. FODMAP Meal Analyzer
24. Soluble vs Insoluble Fiber
25. Food Digestion Timeline
26. Histamine Food Checker
27. Oxalate Food Checker
28. Purine Checker (Gout)
29. Glycemic Index Checker
30. Anti-Inflammatory Checker
31. Pregnancy Foods Checker
32. Vitamin & Mineral Sources
33. Calories per Ingredient
34. Calorie Swap Calculator
35. Protein per Ingredient
36. Coffee Ratio Calculator

### https://titangrillers.com/tools/

**Food Safety**
- Food Danger Zone Calculator
- Leftover Food Safety Calculator
- Meat Refrigerator Life Calculator
- Meat Freezer Storage Calculator
- Chicken Safe Temperature Guide

**Cook Time Calculators**
- Brisket Cook Time Calculator
- Turkey Cook Time Calculator
- Pork Shoulder Cook Time Calculator
- Baby Back Ribs Cook Time Calculator
- Salmon & Fish Grill Time Calculator
- Prime Rib Cook Time Calculator
- Lamb Leg Cook Time Calculator
- Whole Chicken Cook Time Calculator

**Prep & Marinades**
- Dry Rub Calculator
- Brine Calculator
- Marinade Time Calculator
- Reverse Sear Calculator
- Steak Cook Time by Thickness

**BBQ Equipment**
- Charcoal Amount Calculator
- Propane Tank Duration Calculator
- Gas vs Charcoal Cost Calculator
- Grill Size Calculator
- Smoker Temperature Guide

**Party Planning**
- BBQ Meat Per Person Calculator
- BBQ Party Food Planner
- Thanksgiving Turkey Planner
- Holiday Prime Rib Planner
- Pulled Pork Yield Calculator

**Thermometer Tools**
- Meat Thermometer Calibration Tester
- Instant Read vs Probe Thermometer Comparison
- Thermometer Probe Care Guide

**Conversions & References**
- Cooking Temperature Converter
- Meat Weight Converter
- Meat Serving Size Calculator
- Beef Internal Temperature Guide
- Pork Internal Temperature Guide
- Meat Resting Time Calculator

**Specialty Cooking**
- Candy Making Temperature Stages Guide
- Deep Fry Oil Temperature Guide
- Bread Internal Temperature Guide
- Sous Vide Temperature Reference
- Cheese Making Temperature Guide

**BBQ Techniques**
- Smoking Wood Pairing Guide
- Grill Temperature Zone Guide
- Competition BBQ Prep Timeline

### https://www.calcusite.com.ar/categoria/cocina

Based on the webpage content, here are all the kitchen calculators listed:

1. **Calculadora de Tiempo de Cocción del Asado** - "¿No sabés cuánto tiempo dejar el asado? Calculalo según corte y peso"

2. **Cómo multiplico los ingredientes de mi receta** - Tool to "Ajustá cualquier receta en segundos. Multiplicá ingredientes automáticamente"

3. **Calculadora de Presupuesto del Asado** - Helps you determine "cuánta carne necesitás y cuánto te va a costar el asado"

These are the only three cooking-specific calculators displayed on this cuisine section of CalcuSite.

### https://cookingcalcs.com/

1. Cups to Grams
2. Oven Temperature Converter
3. Tablespoon to Teaspoon
4. Weight Converter
5. Egg Size Converter
6. Egg Weight & Volume Converter
7. Recipe Multiplier
8. Cooking Time Calculator
9. Meat Temperature Guide
10. Meal Cost Calculator
11. Cost Per Serving
12. Liquid Converter
13. Butter Converter
14. Baking Substitutions
15. Cups to Tablespoons
16. Raw to Cooked Weight
17. Weekly Meal Prep Cost Calculator
18. Slow Cooker Time Converter
19. Fresh to Dried Herb Converter
20. Kitchen Math Practice Problem Generator
21. Grill Temperature & Time Calculator
22. Baking Pan Size Converter
23. Can Size Converter
24. Slow Cooker to Pressure Cooker Converter
25. High Altitude Cooking Calculator
26. Vegetable Roasting Calculator
27. Oven Sharing Calculator
28. Meal Timeline Planner
29. Deep Frying Batch Calculator
30. Pot Size Calculator
31. Batch Cooking Planner
32. Leftover Reheating Calculator
33. Air Fryer Cooking Times by Food
34. Candy & Sugar Stage Temperature Calculator
35. Yield Percentage Calculator

### https://bakecalcs.uk/kitchen-maths/

1. Ingredient Cost Calculator
2. Cost Per Serving Calculator
3. Cooking Yield Calculator
4. Freezer Capacity Calculator
5. Defrost Time Calculator
6. Meal Prep Multiplier Calculator
7. Baking Tray Size Calculator
8. Cooking Timer Calculator
9. Food Weight After Cooking Calculator
10. Recipe Halving Calculator

### https://bakecalcs.uk/cooking-and-roasting/

1. Roasting Time Calculator
2. Turkey Roasting Calculator
3. Chicken Roasting Calculator
4. Beef Joint Calculator
5. Lamb Joint Calculator
6. Pork Joint Calculator
7. Meat Resting Time Calculator
8. Stock Ratio Calculator
9. Gravy Calculator
10. Brine Calculator
11. Pasta Water Salt Calculator
12. Rice to Water Ratio Calculator
13. Slow Cooker Conversion Calculator

### https://bakecalcs.uk/portions-and-catering/

1. Buffet Quantity Calculator
2. Wedding Cake Portions Calculator
3. Pasta Portions Calculator
4. Rice Portions Calculator
5. Potato Portions Calculator
6. Meat Per Person Calculator
7. Salad Portions Calculator
8. Soup Portions Calculator
9. Sandwich Platter Calculator
10. Canape Quantity Calculator
11. Cheese Board Calculator
12. BBQ Quantity Calculator
13. Afternoon Tea Calculator
14. Dietary Buffet Calculator
15. Children's Party Food Calculator

### https://bakecalcs.uk/drinks-and-beverages/

1. Cocktail Batch Calculator
2. Punch Bowl Calculator
3. Mulled Wine Calculator
4. Coffee Brew Ratio Calculator
5. Cold Brew Coffee Calculator
6. Cordial Dilution Calculator
7. Simple Syrup Calculator
8. Drinks Per Bottle Calculator
9. Party Drinks Calculator
10. Hot Chocolate Calculator
11. Lemonade Calculator
12. Iced Tea Calculator

### https://bakecalcs.uk/baking-essentials/

1. Recipe Scaler Calculator
2. Cake Tin Size Converter
3. Round to Square Tin Calculator
4. Cake Tin Volume Calculator
5. Tiered Cake Calculator
6. Cake Portions Calculator
7. Baking Time Adjustment Calculator
8. Egg Replacement Calculator
9. Butter to Oil Converter
10. Bakers Percentage Calculator
11. Flour Type Substitution Calculator
12. Oven Temperature Converter
13. Fan Oven Adjustment Calculator
14. Cake Batter Weight Calculator
15. Cake Dowel Calculator
16. Cake Board & Drum Sizing Calculator
17. Baking Pan Conversion Calculator
18. Flour Type Conversion Calculator

### https://bakecalcs.uk/bread-and-dough/

1. Dough Hydration Calculator
2. Yeast Conversion Calculator
3. Sourdough Starter Calculator
4. Sourdough Recipe Converter
5. Desired Dough Temperature Calculator
6. Pizza Dough Calculator
7. Bagel Dough Calculator
8. Bread Loaf Scaler
9. Tangzhong Calculator
10. Poolish Calculator
11. Biga Calculator
12. Bread Roll Weight Calculator
13. Salt Percentage Calculator
14. Enriched Dough Calculator
15. Croissant & Laminated Dough Calculator
16. Sourdough Feeding Calculator
17. Bread Proofing Time Calculator

### https://bakecalcs.uk/seasonal-and-holiday/

1. Christmas Cake Calculator
2. Christmas Pudding Calculator
3. Mince Pie Calculator
4. Hot Cross Bun Calculator
5. Simnel Cake Calculator
6. Pancake Batter Calculator
7. Yorkshire Pudding Calculator
8. Scone Calculator
9. Marzipan Coverage Calculator
10. Stollen Calculator

### https://bakecalcs.uk/conversions-and-units/

1. Cups to Grams Converter
2. Grams to Cups Converter
3. Tablespoons to Grams Converter
4. Millilitres to Fluid Ounces Converter
5. Grams to Ounces Converter
6. Kilograms to Pounds Converter
7. Litres to Pints Converter
8. Stick of Butter Converter
9. Teaspoon to Tablespoon Converter
10. Cooking Weight to Volume Converter
11. Australian to UK Cups Converter
12. Old Recipes Measurement Converter
13. Altitude Baking Adjustment Calculator
14. Gelatine Conversion Calculator
15. Oven Temperature Offset Calculator
16. Egg Size Substitution Calculator

### https://bakecalcs.uk/eggs-and-dairy/

1. Egg Size Converter
2. Egg Quantity by Weight Calculator
3. Egg White and Yolk Weight Calculator
4. Cream Fat Content Calculator
5. Cream to Milk Converter
6. Cheese Sauce Calculator
7. Whipped Cream Volume Calculator
8. Yoghurt to Sour Cream Converter
9. Milk Type Substitution Calculator
10. Bechamel Sauce Calculator
