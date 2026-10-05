/**
 * Conservación: sólo datos. Cada fila dice de qué fuente sale.
 *
 * Procedencia: product-design/research/herramientas/verificacion-conservacion.md
 * y, para las filas que se suman, verificacion-conservacion-completa.md.
 * Para corregir un plazo, editá su fila y la fecha `consultada` de la fuente.
 * Para sumar una fila, respetá las columnas de su tabla y citá en `fuente` una
 * abreviatura de la lista (con el número de fila de FoodKeeper o el id de
 * StillTasty a continuación); si la fuente es nueva, sumala a `FUENTES`.
 * El orden en que se muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { FuenteAbreviada, Tabla } from '../tipos.js';

const consultada = '2026-10-04';

const FK: FuenteAbreviada = {
  abreviatura: 'FK', nombre: 'FoodKeeper, FSIS/USDA (dataset abierto; el número de fila es el ID del producto)',
  url: 'https://catalog.data.gov/dataset/fsis-foodkeeper-data', consultada
};
const FSIS_C: FuenteAbreviada = {
  abreviatura: 'FSIS-C', nombre: 'FSIS, «Freezing and Food Safety»',
  url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety', consultada
};
const FSIS_D: FuenteAbreviada = {
  abreviatura: 'FSIS-D', nombre: 'FSIS, «The Big Thaw — Safe Defrosting Methods»',
  url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/big-thaw-safe-defrosting-methods', consultada
};
const FSIS_S: FuenteAbreviada = {
  abreviatura: 'FSIS-S', nombre: 'FSIS, «Leftovers and Food Safety»',
  url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety', consultada
};
const FSIS_R: FuenteAbreviada = {
  abreviatura: 'FSIS-R', nombre: 'FSIS, «Refrigeration»',
  url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/refrigeration', consultada
};
const ANMAT_F: FuenteAbreviada = {
  abreviatura: 'ANMAT-F', nombre: 'ANMAT e INAL, folleto «Consejos útiles para comprar, cocinar y conservar los alimentos en forma segura»',
  url: 'https://www.argentina.gob.ar/sites/default/files/anmat_inal_consejos_utiles_alimentos.pdf', consultada
};
const ANMAT_M: FuenteAbreviada = {
  abreviatura: 'ANMAT-M', nombre: 'ANMAT, «Recomendaciones para la manipulación segura de los alimentos»',
  url: 'https://www.argentina.gob.ar/anmat/comunidad/recomendaciones-para-la-manipulacion-segura-de-los-alimentos', consultada
};
const SEN: FuenteAbreviada = {
  abreviatura: 'SEN', nombre: 'SENASA, «Pautas para la prevención de enfermedades a través de la refrigeración de alimentos» (06-03-2023)',
  url: 'https://www.argentina.gob.ar/noticias/pautas-para-la-prevencion-de-enfermedades-traves-de-la-refrigeracion-de-alimentos', consultada
};
const IA: FuenteAbreviada = {
  abreviatura: 'IA', nombre: 'InfoAlimentos, «Un tesoro argentino, el dulce de leche» (Silvina Medin, bromatóloga)',
  url: 'https://infoalimentos.org.ar/temas/del-campo-a-la-mesa/545-un-tesoro-argentino-el-dulce-de-leche', consultada
};
const LS: FuenteAbreviada = {
  abreviatura: 'LS', nombre: 'La Serenísima, catálogo de productos',
  url: 'https://www.laserenisima.com.ar/productos.php', consultada
};
const LSA: FuenteAbreviada = {
  abreviatura: 'LSa', nombre: 'La Salteña, fichas de producto',
  url: 'https://www.lasaltena.com.ar/productos/', consultada
};
const MK: FuenteAbreviada = {
  abreviatura: 'MK', nombre: 'Milkaut Profesional, dulce de leche heladero',
  url: 'https://milkautprofesional.com.ar/productos/dulces-de-leche/dulce-de-leche-heladero/', consultada
};
const CAN: FuenteAbreviada = {
  abreviatura: 'CAN', nombre: 'Canciani, milanesas congeladas de carne vacuna',
  url: 'https://www.cancianicarnes.com.ar/carne-vacuna/milanesas-congeladas-carne-vacuna.html', consultada
};
const ST: FuenteAbreviada = {
  abreviatura: 'ST', nombre: 'StillTasty (ficha de cada alimento, por su id en la columna Fuente)',
  url: 'https://www.stilltasty.com/fooditems/index/', consultada
};

export const TABLAS_CONSERVACION = {
  'nota-general': {
    id: 'nota-general', titulo: 'Nota general',
    columnas: [
      { id: 'tema', nombre: 'Tema' },
      { id: 'dice', nombre: 'Qué dice' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { tema: 'Temperatura de la heladera', dice: '5 °C o menos. SENASA recomienda mantenerla entre 4 y 5 °C. FSIS: 40 °F (4 °C) o menos en toda la heladera.', fuente: 'ANMAT-F, SEN, FSIS-R' },
      { tema: 'Temperatura del freezer', dice: '−18 °C (FSIS: 0 °F, que es −17,8 °C). Un congelador dentro de la heladera que no llega a esa temperatura, o cuya puerta se abre seguido, sirve sólo para guardar poco tiempo.', fuente: 'ANMAT-F, FSIS-C' },
      { tema: 'El freezer conserva la calidad, no la seguridad', dice: 'A −18 °C constante el alimento es seguro indefinidamente; con el tiempo sólo pierde calidad. Los plazos de freezer de la tabla son de calidad. El frío no mata los microbios: al descongelar vuelven a multiplicarse como en el alimento fresco.', fuente: 'FSIS-C' },
      { tema: 'La heladera tampoco es por tiempo indefinido', dice: 'Los plazos de SENASA son de «mantenimiento de calidad y cualidades organolépticas». FSIS aclara que la mayoría de las bacterias que pudren el alimento no enferman, pero algunas, como Listeria, crecen en la heladera.', fuente: 'SEN, FSIS-R' },
      { tema: 'Fuera de la heladera', dice: 'Máximo 2 horas para lo cocido y lo perecedero (ANMAT); 1 hora si hace más de 32 °C (FSIS, 90 °F). Lo que superó los 5 °C por más de 2 horas se tira.', fuente: 'ANMAT-F, FSIS-S' },
      { tema: 'Cómo descongelar', dice: 'Nunca a temperatura ambiente. Sí: en la heladera; en el microondas sólo si se cocina enseguida; como parte de la cocción; o bajo chorro de agua fría (menos de 21 °C). FSIS: en agua fría, en bolsa cerrada y cambiando el agua cada 30 minutos, y cocinar enseguida.', fuente: 'ANMAT-F, FSIS-D' },
      { tema: 'Cuánto dura lo descongelado en la heladera', dice: 'Carne picada, carne para guiso, pollo y pescado: 1 a 2 días más antes de cocinarlos. Cortes de vaca, cerdo o cordero: 3 a 5 días. Sobras descongeladas: 3 a 4 días.', fuente: 'FSIS-D, FSIS-S' },
      { tema: 'Cocinar sin descongelar', dice: 'Es seguro; tarda alrededor de 50 % más que con la carne descongelada o fresca.', fuente: 'FSIS-D' },
      { tema: 'Recongelar', dice: 'ANMAT: «No vuelvas a congelar un alimento que ya fue descongelado». La excepción es lo crudo que se descongeló y después se cocinó: ya cocido, se puede volver a congelar (FSIS).', fuente: 'ANMAT-M, FSIS-C, FSIS-D' },
      { tema: 'Recalentar', dice: 'Las sobras no deberían recalentarse más de una vez (ANMAT). FSIS: recalentar hasta 74 °C (165 °F); salsas, sopas y jugos, hasta que hiervan.', fuente: 'ANMAT-F, FSIS-S' },
      { tema: 'Preparaciones con huevo crudo', dice: 'No más de 24 horas (incluye las mezclas para panqueques).', fuente: 'ANMAT-M' },
      { tema: 'Lo que no se congela bien', dice: 'Mayonesa, salsas de crema y lechuga se pueden congelar pero quedan mal; los huevos con cáscara no se congelan. La carne y el pollo crudos aguantan más en el freezer que cocidos.', fuente: 'FSIS-C' },
      { tema: 'Enfriar rápido', dice: 'Lo cocido se guarda dentro de las 2 horas, repartido en recipientes chicos y bajos para que se enfríe rápido.', fuente: 'FSIS-S' }
    ],
    fuentes: [ANMAT_F, ANMAT_M, SEN, FSIS_R, FSIS_C, FSIS_S, FSIS_D], columnaFuente: 'fuente'
  },

  conservacion: {
    id: 'conservacion', titulo: 'Cuánto dura cada alimento',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'alacena', nombre: 'Alacena' },
      { id: 'heladera', nombre: 'Heladera' },
      { id: 'freezer', nombre: 'Freezer' },
      { id: 'notas', nombre: 'Notas' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    grupos: [
      {
        titulo: 'Carnes vacunas, de cerdo y cordero',
        filas: [
          { alimento: 'Cortes de vaca crudos (bife, asado, nalga, vacío, peceto, carne para guiso)', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses', notas: 'FoodKeeper da 3–5 días de heladera; se eligió SENASA («carne cruda: 2 a 3 días»). FoodKeeper da 4–12 meses de freezer para todos los cortes enteros y para la carne en cubos.', fuente: 'SEN, FK 34–42' },
          { alimento: 'Carne picada (vaca, cerdo, cordero, ternera)', alacena: 'no corresponde', heladera: '1 día', freezer: '3–4 meses', notas: 'FoodKeeper da 1–2 días; se eligió SENASA («carnes picadas: 1 día»).', fuente: 'SEN, FK 43, 59, 73' },
          { alimento: 'Cortes de cerdo crudos (bondiola, carré, solomillo, costillas, pechito)', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses', notas: 'FoodKeeper: 3–5 días; se eligió SENASA, como en la vaca.', fuente: 'SEN, FK 60–75' },
          { alimento: 'Cordero y cabrito crudos', alacena: 'no corresponde', heladera: '2–3 días', freezer: '4–12 meses', notas: 'FoodKeeper: 3–5 días (cordero y cabra); se eligió SENASA.', fuente: 'SEN, FK 44–55, 70–71' },
          { alimento: 'Menudencias (hígado, lengua, riñones, chinchulines)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses', notas: 'FoodKeeper las agrupa como «variety meats (liver, tongue, chitterlings)».', fuente: 'FK 77' },
          { alimento: 'Conejo crudo', alacena: 'no corresponde', heladera: '2 días', freezer: '9 meses', notas: '', fuente: 'FK 595' },
          { alimento: 'Carne cocida (asado, carne al horno, peceto, sobras con carne)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'Regla de sobras de ANMAT. SENASA da 2–3 días para la carne cocida; FoodKeeper, 3–4 días. Freezer: FoodKeeper (sobras con carne) y la tabla de freezer de FSIS («meat, cooked: 2 to 3»).', fuente: 'ANMAT-F, SEN, FK 173, FSIS-C' },
          { alimento: 'Milanesas crudas compradas congeladas', alacena: 'no corresponde', heladera: 'sin abrir, 6 días a 4 °C; abiertas, 3 días', freezer: '6 meses', notas: 'Plazos del fabricante para su producto, contados desde la elaboración. Las caseras no tienen fuente y no están en la tabla.', fuente: 'CAN' },
          { alimento: 'Milanesas cocidas (fritas o al horno)', alacena: 'no corresponde', heladera: '3 días', freezer: 'carne: 2–3 meses; pollo: 4 meses', notas: 'FoodKeeper no tiene ficha de milanesa: se tomó «sobras con carne» para la de carne y «fried chicken» (3–4 días, 4 meses) para la de pollo.', fuente: 'ANMAT-F, FK 136, 173' }
        ]
      },
      {
        titulo: 'Aves',
        filas: [
          { alimento: 'Pollo entero crudo', alacena: 'no corresponde', heladera: '1–2 días', freezer: '12 meses', notas: 'Para aves se usa FoodKeeper y no el «carne cruda: 2 a 3 días» de SENASA, que no nombra al pollo y daría más días.', fuente: 'FK 113' },
          { alimento: 'Presas de pollo crudas (pechuga, pata-muslo, alitas)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '9 meses', notas: '', fuente: 'FK 116–118' },
          { alimento: 'Pollo picado', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses', notas: '', fuente: 'FK 115' },
          { alimento: 'Menudos de pollo (hígados, mollejas, corazones)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '3–4 meses', notas: '«Giblets».', fuente: 'FK 130' },
          { alimento: 'Pavo (entero o pechuga)', alacena: 'no corresponde', heladera: '1–2 días', freezer: 'entero: 12 meses; presas: 9 meses', notas: '', fuente: 'FK 114, 119–121' },
          { alimento: 'Pollo cocido (al horno, hervido, al spiedo comprado)', alacena: 'no corresponde', heladera: '3 días', freezer: '4 meses', notas: 'FoodKeeper: 3–4 días. Freezer: 4 meses en la tabla de FSIS y en «rotisserie chicken»; FoodKeeper da 4–6 meses para «cooked poultry dishes».', fuente: 'ANMAT-F, FK 135, 141, FSIS-C' },
          { alimento: 'Pollo con salsa o caldo', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 140' },
          { alimento: 'Patitas, medallones y nuggets de pollo congelados', alacena: 'no corresponde', heladera: 'descongelados: 1–2 días', freezer: '1–3 meses', notas: '', fuente: 'FK 134' }
        ]
      },
      {
        titulo: 'Pescados y mariscos',
        filas: [
          { alimento: 'Pescado blanco crudo (merluza, lenguado, abadejo y otros magros)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '6–8 meses', notas: 'FoodKeeper agrupa por grasa: «lean fish (cod, flounder, haddock, halibut, sole)». La ubicación de la merluza en este grupo es nuestra.', fuente: 'FK 144' },
          { alimento: 'Pescado graso crudo (salmón, atún, caballa, lisa)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses', notas: '«Fatty fish (bluefish, catfish, mackerel, mullet, salmon, tuna)».', fuente: 'FK 146' },
          { alimento: 'Pescado cocido', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 148' },
          { alimento: 'Langostinos y camarones crudos', alacena: 'no corresponde', heladera: '1–3 días', freezer: '6–18 meses', notas: '', fuente: 'FK 151' },
          { alimento: 'Calamar crudo', alacena: 'no corresponde', heladera: '1–3 días', freezer: '6–18 meses', notas: '', fuente: 'FK 152' },
          { alimento: 'Mejillones y almejas vivos', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses', notas: 'FoodKeeper tiene otra fila para los mismos mariscos «fresh» (5–10 días, no congelar); se eligió la de vivos, que es la más corta.', fuente: 'FK 157 (descartada FK 160)' },
          { alimento: 'Mariscos cocidos', alacena: 'no corresponde', heladera: '3 días', freezer: '1–3 meses', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 162' },
          { alimento: 'Pescado rebozado congelado (comprado)', alacena: 'no corresponde', heladera: 'cocido: no se recomienda', freezer: '18 meses', notas: 'Una vez cocido, FoodKeeper no recomienda guardarlo en la heladera por la calidad.', fuente: 'FK 311' },
          { alimento: 'Salmón ahumado en frío, al vacío', alacena: 'no corresponde', heladera: 'cerrado: 21–30 días', freezer: '9–12 meses', notas: '', fuente: 'FK 167' },
          { alimento: 'Atún en lata', alacena: '3 años', heladera: 'abierto: 3–4 días', freezer: 'no corresponde', notas: 'Abierto: la fila de conservas de baja acidez (que incluye pescado). FoodKeeper da 1–2 días para «seafood (canned)» abierto.', fuente: 'FK 618, 372 (descartada FK 619)' },
          { alimento: 'Anchoas en lata', alacena: '5 años', heladera: 'abiertas: 3–4 días', freezer: '2 meses (fuera de la lata)', notas: '', fuente: 'FK 673' },
          { alimento: 'Kanikama (surimi)', alacena: 'no corresponde', heladera: 'hasta la fecha del envase', freezer: '9 meses', notas: '', fuente: 'FK 149' }
        ]
      },
      {
        titulo: 'Fiambres y embutidos',
        filas: [
          { alimento: 'Fiambre feteado en la fiambrería (jamón cocido, paleta, mortadela, pavita)', alacena: 'no corresponde', heladera: '3–5 días', freezer: '1–2 meses', notas: '«Luncheon meat (store-sliced)».', fuente: 'FK 184' },
          { alimento: 'Fiambre feteado envasado', alacena: 'no corresponde', heladera: 'cerrado: 2 semanas; abierto: 3–5 días', freezer: '1–2 meses', notas: 'En las filas por fiambre (jamón, salame, pavo, pollo) FoodKeeper da 1–2 meses de freezer pero anota «freezing not recommended».', fuente: 'FK 192, 514–517' },
          { alimento: 'Salame (embutido seco) feteado', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: '1–2 meses', notas: '«Sausage (hard, dry (pepperoni), sliced)». Envasado y abierto, FoodKeeper da 3–5 días (FK 516).', fuente: 'FK 104' },
          { alimento: 'Jamón crudo', alacena: 'no corresponde', heladera: '2–3 meses', freezer: '1 mes', notas: '«Prosciutto».', fuente: 'FK 675' },
          { alimento: 'Panceta', alacena: 'no corresponde', heladera: '1 semana (cerrada o abierta)', freezer: '1 mes', notas: '«Bacon».', fuente: 'FK 79' },
          { alimento: 'Salchichas tipo Viena', alacena: 'no corresponde', heladera: 'cerradas: 2 semanas; abiertas: 1 semana', freezer: '1–2 meses', notas: '«Hot dogs».', fuente: 'FK 98' },
          { alimento: 'Chorizo fresco y salchicha parrillera crudos', alacena: 'no corresponde', heladera: '1–2 días', freezer: '1–2 meses', notas: '', fuente: 'FK 630, 102' }
        ]
      },
      {
        titulo: 'Huevos',
        filas: [
          { alimento: 'Huevos con cáscara', alacena: 'no corresponde', heladera: '3–5 semanas', freezer: 'no se recomienda', notas: 'FSIS: los huevos con cáscara no se congelan; si se congeló uno y se rajó, se tira.', fuente: 'FK 21, FSIS-C' },
          { alimento: 'Claras o yemas crudas', alacena: 'no corresponde', heladera: '2–4 días', freezer: '12 meses', notas: '', fuente: 'FK 22' },
          { alimento: 'Huevo duro', alacena: 'no corresponde', heladera: '1 semana', freezer: 'no se recomienda', notas: '', fuente: 'FK 23' },
          { alimento: 'Preparaciones con huevo crudo (mayonesa casera, mousse, mezcla de panqueques)', alacena: 'no corresponde', heladera: '24 horas', freezer: 'no corresponde', notas: 'FoodKeeper da 3–4 días para el alioli casero; se eligió ANMAT.', fuente: 'ANMAT-M (descartada FK 670)' },
          { alimento: 'Platos con huevo cocido (tortilla, budín salado, revuelto)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'FoodKeeper: 3–4 días; el freezer vale para lo horneado.', fuente: 'ANMAT-F, FK 24' }
        ]
      },
      {
        titulo: 'Lácteos',
        filas: [
          { alimento: 'Leche fresca (sachet o cartón refrigerado)', alacena: 'no corresponde', heladera: 'cerrada: hasta la fecha del envase; abierta: 2–3 días', freezer: '3 meses', notas: 'Abierta: SENASA («leche pasteurizada: 2 a 3 días») y el fabricante dicen lo mismo. Freezer: FoodKeeper.', fuente: 'SEN, LS, FK 27' },
          { alimento: 'Leche larga vida', alacena: 'cerrada: 6–12 meses', heladera: 'abierta: 3 días', freezer: 'no corresponde', notas: 'El fabricante dice 3 días abierta; FoodKeeper («milk, shelf-stable») da 5–7 días.', fuente: 'LS, FK 644' },
          { alimento: 'Leche en polvo', alacena: 'cerrada: 3–5 años; abierta: 3 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'Los 3–5 años son con fresco y oscuridad; con calor puede durar sólo 3 meses.', fuente: 'FK 465' },
          { alimento: 'Leche condensada', alacena: '12 meses', heladera: 'abierta: 4–5 días', freezer: 'no corresponde', notas: '', fuente: 'FK 383' },
          { alimento: 'Crema de leche (para batir o para cocinar)', alacena: 'no corresponde', heladera: 'cerrada: 1 mes; abierta: 1 semana', freezer: 'no se recomienda', notas: '«Cream (whipping, ultrapasteurized)». Para la crema doble no ultrapasteurizada FoodKeeper da 10 días y 3–4 meses de freezer (FK 14). El fabricante sólo dice «mantener refrigerado (2–8 °C)».', fuente: 'FK 11' },
          { alimento: 'Crema larga vida', alacena: 'cerrada: hasta la fecha del envase', heladera: 'abierta: 1 semana', freezer: 'no se recomienda', notas: 'El fabricante: se guarda a temperatura ambiente hasta abrirla. Abierta, la fila de crema ultrapasteurizada.', fuente: 'LS, FK 11' },
          { alimento: 'Crema batida (chantilly)', alacena: 'no corresponde', heladera: '1 día', freezer: '1–2 meses', notas: '', fuente: 'FK 12' },
          { alimento: 'Manteca', alacena: '1–2 días', heladera: '1–2 meses', freezer: '6–9 meses', notas: 'La alacena es el tiempo que puede quedar fuera de la heladera.', fuente: 'FK 1' },
          { alimento: 'Margarina', alacena: 'no corresponde', heladera: '6 meses', freezer: '12 meses', notas: '', fuente: 'FK 26' },
          { alimento: 'Quesos duros en trozo (reggianito, sardo, provolone)', alacena: 'no corresponde', heladera: 'cerrado: 6 meses; abierto: 3–4 semanas', freezer: '6 meses', notas: 'FoodKeeper nombra cheddar, suizo y parmesano en bloque. El fabricante pide el reggianito a no más de 12 °C.', fuente: 'FK 3, LS' },
          { alimento: 'Queso rallado envasado', alacena: 'cerrado: hasta la fecha del envase, a menos de 20 °C y sin luz', heladera: '12 meses; abierto, siempre en heladera', freezer: 'no se recomienda', notas: 'Alacena y «abierto»: el fabricante. Heladera y freezer: FoodKeeper («parmesan, shredded or grated»).', fuente: 'LS, FK 4' },
          { alimento: 'Queso en hebras', alacena: 'no corresponde', heladera: 'cerrado: 1 mes; abierto: 5 días', freezer: '3–4 meses', notas: 'FoodKeeper no da plazo abierto; los 5 días son del fabricante. StillTasty da 5–7 días para la mozzarella en hebras abierta.', fuente: 'FK 5, LS, ST 17733' },
          { alimento: 'Quesos blandos y semiblandos (cremoso, port salut, queso fresco)', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '6 meses', notas: 'FoodKeeper nombra brie, bel paese y cabra; agrupar ahí el cremoso y el port salut es nuestro.', fuente: 'FK 7' },
          { alimento: 'Mozzarella', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '3–6 meses', notas: 'FoodKeeper no tiene la mozzarella en trozo; es la ficha de StillTasty de mozzarella fresca. Congelada se desgrana: sirve para cocinar.', fuente: 'ST 17732' },
          { alimento: 'Queso crema untable', alacena: 'no corresponde', heladera: 'cerrado: 2 semanas; abierto: 7 días', freezer: 'no se recomienda', notas: 'Cerrado: FoodKeeper. Abierto y «no congelar»: el fabricante.', fuente: 'FK 10, LS' },
          { alimento: 'Ricota', alacena: 'no corresponde', heladera: 'cerrada: 2 semanas; abierta: 1 semana', freezer: 'no se recomienda', notas: '', fuente: 'FK 490' },
          { alimento: 'Yogur', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '1–2 meses', notas: '', fuente: 'FK 33' },
          { alimento: 'Dulce de leche (de fábrica)', alacena: 'cerrado: unos 120 días', heladera: 'abierto: hasta 30 días', freezer: 'no corresponde', notas: 'InfoAlimentos: «vida útil de aproximadamente 120 días en envase cerrado; una vez abierto, en heladera un máximo de 30 días». El fabricante sólo pide heladera (2–8 °C) una vez abierto, sin días; Milkaut da 120 días de vida útil para el heladero.', fuente: 'IA, LS, MK' },
          { alimento: 'Dulce de leche casero', alacena: 'no corresponde', heladera: '15 días', freezer: 'no corresponde', notas: 'Se tira si aparece moho.', fuente: 'IA' }
        ]
      },
      {
        titulo: 'Frutas',
        filas: [
          { alimento: 'Manzanas', alacena: '3 semanas', heladera: '4–6 semanas', freezer: '8 meses', notas: 'El freezer vale para la manzana cocida.', fuente: 'FK 248' },
          { alimento: 'Bananas', alacena: 'hasta que maduren', heladera: '3 días (maduras)', freezer: '2–3 meses', notas: 'En la heladera la cáscara se pone negra.', fuente: 'FK 251' },
          { alimento: 'Cítricos (naranja, mandarina, limón, pomelo)', alacena: '10 días', heladera: '10–21 días', freezer: 'no se recomienda', notas: '', fuente: 'FK 256' },
          { alimento: 'Duraznos, pelones, ciruelas y peras', alacena: 'hasta que maduren; maduros, 1–2 días', heladera: '3–5 días (maduros)', freezer: '2 meses', notas: 'Freezer: en rodajas, con jugo de limón y azúcar.', fuente: 'FK 266' },
          { alimento: 'Frutillas, frambuesas y cerezas', alacena: 'no corresponde', heladera: '2–3 días', freezer: '8–12 meses', notas: 'FoodKeeper tiene otra fila para cerezas con 7 días (FK 252); se eligió la de cerezas sola.', fuente: 'FK 481–483' },
          { alimento: 'Arándanos', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '8–12 meses', notas: '', fuente: 'FK 254' },
          { alimento: 'Uvas', alacena: '1 día', heladera: '1 semana', freezer: '1 mes', notas: 'Freezer: enteras.', fuente: 'FK 261' },
          { alimento: 'Kiwi', alacena: 'hasta que madure', heladera: '3–6 días (maduro)', freezer: 'no se recomienda', notas: '', fuente: 'FK 263' },
          { alimento: 'Palta', alacena: 'hasta que madure', heladera: '3–4 días (madura)', freezer: 'no se recomienda', notas: '', fuente: 'FK 250' },
          { alimento: 'Melón', alacena: 'hasta que madure; maduro, 7 días', heladera: 'entero: 2 semanas; cortado: 2–4 días', freezer: '1 mes', notas: 'Freezer: en bolitas.', fuente: 'FK 264' },
          { alimento: 'Sandía', alacena: '1–2 días', heladera: '3–4 días', freezer: '12 meses', notas: '', fuente: 'FK 495' },
          { alimento: 'Ananá', alacena: 'hasta que madure; maduro, 1–2 días', heladera: '5–7 días', freezer: '10–12 meses', notas: '', fuente: 'FK 267' },
          { alimento: 'Mango, papaya y maracuyá', alacena: '3–5 días', heladera: '1 semana', freezer: '6–8 meses', notas: '', fuente: 'FK 265' },
          { alimento: 'Frutas secas (pasas de uva, orejones, ciruelas)', alacena: 'cerradas: 6 meses; abiertas: 1 mes', heladera: 'abiertas: 6 meses', freezer: 'no corresponde', notas: '', fuente: 'FK 379' },
          { alimento: 'Coco rallado', alacena: 'cerrado: 1 año', heladera: 'abierto: 8 meses', freezer: '1 año', notas: '', fuente: 'FK 257' }
        ]
      },
      {
        titulo: 'Verduras y hortalizas',
        filas: [
          { alimento: 'Papas', alacena: '1–2 meses', heladera: '1–2 semanas', freezer: '10–12 meses (cocidas, en puré)', notas: 'FoodKeeper recomienda la alacena: en la heladera la papa se oscurece al cocinarla y toma un gusto dulce.', fuente: 'FK 297' },
          { alimento: 'Batatas', alacena: '2–3 semanas', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 422' },
          { alimento: 'Cebollas', alacena: '1 mes', heladera: '2 meses', freezer: '10–12 meses', notas: '', fuente: 'FK 294' },
          { alimento: 'Cebolla de verdeo', alacena: '1 mes', heladera: '1 semana', freezer: '10–12 meses', notas: 'El mes de alacena es el dato de FoodKeeper; parece copiado de la cebolla común.', fuente: 'FK 295' },
          { alimento: 'Ajo', alacena: 'cabeza entera: 1 mes', heladera: 'dientes sueltos: 3–14 días', freezer: '1 mes', notas: '', fuente: 'FK 285' },
          { alimento: 'Tomates', alacena: 'hasta que maduren; maduros, 7 días', heladera: 'no se recomienda', freezer: '2 meses', notas: 'FSIS/USDA recomienda la alacena: la heladera afecta el sabor.', fuente: 'FK 306' },
          { alimento: 'Tomates cherry', alacena: '10 días', heladera: '5 días', freezer: 'no corresponde', notas: '', fuente: 'FK 600' },
          { alimento: 'Zanahorias', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: '10–12 meses', notas: '', fuente: 'FK 279' },
          { alimento: 'Lechuga, espinaca y rúcula', alacena: 'no corresponde', heladera: 'de hoja (criolla, mantecosa), espinaca y rúcula: 3–7 días; repollada o romana: 1–2 semanas', freezer: 'no se recomienda', notas: '', fuente: 'FK 290, 291, 678' },
          { alimento: 'Hojas lavadas en bolsa', alacena: 'no corresponde', heladera: 'cerrada: 3–5 días después de la fecha de la bolsa; abierta: 2 días', freezer: 'no se recomienda', notas: '', fuente: 'FK 415' },
          { alimento: 'Acelga', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: 'no corresponde', notas: 'En bolsa, para que no pierda humedad.', fuente: 'FK 550' },
          { alimento: 'Repollo', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '10–12 meses', notas: '', fuente: 'FK 278' },
          { alimento: 'Brócoli y coliflor', alacena: 'no corresponde', heladera: '3–5 días', freezer: '10–12 meses', notas: '', fuente: 'FK 276, 280' },
          { alimento: 'Zapallitos y zucchini', alacena: '1–5 días', heladera: '4–5 días', freezer: '10–12 meses', notas: '', fuente: 'FK 302' },
          { alimento: 'Zapallo y calabaza (anco, cabutia)', alacena: '2–6 semanas', heladera: '1–3 meses', freezer: '10–12 meses', notas: '«Squash (winter)». Para «pumpkins» FoodKeeper da 2–3 meses de alacena y 3–5 de heladera (FK 298).', fuente: 'FK 303' },
          { alimento: 'Choclo', alacena: 'no corresponde', heladera: '1–2 días', freezer: '8 meses', notas: '', fuente: 'FK 282' },
          { alimento: 'Morrones y pimientos', alacena: 'no corresponde', heladera: '4–14 días', freezer: '6–8 meses', notas: '', fuente: 'FK 296' },
          { alimento: 'Berenjenas', alacena: '1 día', heladera: '4–7 días', freezer: '6–8 meses', notas: '', fuente: 'FK 284' },
          { alimento: 'Pepinos', alacena: 'no corresponde', heladera: '4–6 días', freezer: 'no se recomienda', notas: '', fuente: 'FK 283' },
          { alimento: 'Apio y puerro', alacena: 'no corresponde', heladera: '1–2 semanas', freezer: '10–12 meses', notas: '', fuente: 'FK 281, 289' },
          { alimento: 'Chauchas, arvejas frescas y habas', alacena: 'no corresponde', heladera: '3–5 días', freezer: '8 meses', notas: '', fuente: 'FK 273' },
          { alimento: 'Champiñones y hongos frescos', alacena: 'no corresponde', heladera: '3–7 días', freezer: '10–12 meses', notas: '', fuente: 'FK 292' },
          { alimento: 'Remolachas', alacena: '1 día', heladera: '1–2 semanas', freezer: '6–8 meses', notas: '', fuente: 'FK 274' },
          { alimento: 'Perejil fresco', alacena: 'no corresponde', heladera: '2–3 días', freezer: '3–4 meses', notas: '', fuente: 'FK 611' },
          { alimento: 'Albahaca fresca', alacena: '5 días (con los tallos en agua)', heladera: '10 días', freezer: 'no corresponde', notas: 'En la heladera se oscurece.', fuente: 'FK 509' },
          { alimento: 'Hierbas frescas (orégano, romero, tomillo, ciboulette, menta, cilantro)', alacena: '1–2 semanas', heladera: '2–3 semanas', freezer: 'no se recomienda', notas: 'FoodKeeper anota daño por congelado para casi todas.', fuente: 'FK 506, 507, 510–513' },
          { alimento: 'Mandioca', alacena: '7 días', heladera: '3 días', freezer: '1–2 meses', notas: '', fuente: 'FK 308' },
          { alimento: 'Verduras congeladas compradas', alacena: 'no corresponde', heladera: 'cocidas: 3 días', freezer: '10–18 meses', notas: 'FoodKeeper: 3–4 días cocidas.', fuente: 'ANMAT-F, FK 331' }
        ]
      },
      {
        titulo: 'Panificados y masas',
        filas: [
          { alimento: 'Pan casero', alacena: '3–5 días', heladera: 'no se recomienda', freezer: '3 meses', notas: 'En la heladera se seca. FoodKeeper tiene dos filas de pan casero: la integral (FK 460) desaconseja la heladera y da 3 meses de freezer; la otra (FK 574) da «2–3 meses» de heladera, que parece el freezer cargado en la columna equivocada.', fuente: 'FK 460, 574' },
          { alimento: 'Pan francés de panadería', alacena: '2–3 días', heladera: 'no corresponde', freezer: '3 meses', notas: '', fuente: 'ST 18934' },
          { alimento: 'Pan de molde envasado', alacena: '14–18 días', heladera: '2–3 semanas', freezer: '3–5 meses', notas: '', fuente: 'FK 195' },
          { alimento: 'Medialunas y facturas', alacena: '1–2 días', heladera: '5–7 días', freezer: '1–2 meses', notas: 'Ficha de croissants recién horneados. La fila de FoodKeeper para facturas envasadas («pastries, danish») da 5–10 días de alacena y 14 meses de heladera, un dato evidentemente mal cargado.', fuente: 'ST 17052' },
          { alimento: 'Torta o bizcochuelo casero, budín', alacena: '1–2 días', heladera: '7 días', freezer: '2–4 meses', notas: 'Ficha de «butter cake» recién horneada.', fuente: 'ST 16654' },
          { alimento: 'Torta envasada (de fábrica)', alacena: '3–7 días', heladera: 'abierta: 7–10 días', freezer: '6 meses', notas: '', fuente: 'FK 197' },
          { alimento: 'Tortas y tartas con crema o crema pastelera', alacena: 'no corresponde', heladera: '3–4 días', freezer: 'no se recomienda', notas: '«Cream pies».', fuente: 'FK 205' },
          { alimento: 'Tarta de frutas', alacena: '1–2 días', heladera: '1 semana', freezer: '8 meses', notas: '', fuente: 'FK 207' },
          { alimento: 'Cheesecake', alacena: 'no corresponde', heladera: '5–7 días', freezer: '3–6 meses', notas: '', fuente: 'FK 198' },
          { alimento: 'Muffins', alacena: '3–7 días', heladera: 'no se recomienda', freezer: '2–3 meses', notas: 'Caseros.', fuente: 'FK 451' },
          { alimento: 'Galletitas dulces', alacena: 'crocantes: 4–6 meses; blandas: 2–3 meses', heladera: 'no corresponde', freezer: '8–12 meses', notas: '', fuente: 'FK 199, 200' },
          { alimento: 'Galletitas de agua y crackers', alacena: 'cerradas: 8 meses; abiertas: 1 mes', heladera: 'abiertas: 3–4 meses', freezer: '3–4 meses', notas: '', fuente: 'FK 377' },
          { alimento: 'Pan rallado', alacena: '6 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 643' },
          { alimento: 'Tapas de empanada compradas', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses', notas: 'El fabricante: heladera de 4 a 8 °C; descongelar en su envase en la heladera; los 6 meses los cuenta «a partir de su fecha de vencimiento», que no se entiende si es desde el vencimiento de la heladera o un error de redacción: mirá el envase.', fuente: 'LSa' },
          { alimento: 'Tapas de tarta (pascualina) compradas', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses', notas: 'El fabricante: lo demás y los 6 meses de freezer, que cuenta «a partir de su fecha de vencimiento»: mirá el envase. FoodKeeper («pie crust, refrigerated») da 2 meses.', fuente: 'LSa, FK 554' },
          { alimento: 'Pastas frescas compradas (ravioles, sorrentinos, ñoquis)', alacena: 'no corresponde', heladera: 'hasta la fecha del envase; abiertas: 24 horas', freezer: 'hasta 6 meses', notas: 'El fabricante: los 6 meses de freezer, que cuenta «a partir de su fecha de vencimiento»: mirá el envase. FoodKeeper («fresh pasta») da 2 meses.', fuente: 'LSa, FK 332' },
          { alimento: 'Pasta fresca casera', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2 meses', notas: '', fuente: 'FK 332' },
          { alimento: 'Masa casera cruda con levadura (pan, pizza)', alacena: 'no corresponde', heladera: '1–2 días', freezer: '2–3 meses', notas: '', fuente: 'ST 18760' },
          { alimento: 'Masa de hojaldre congelada', alacena: 'no corresponde', heladera: 'no corresponde', freezer: '12 meses', notas: '', fuente: 'FK 551' }
        ]
      },
      {
        titulo: 'Secos y de alacena',
        filas: [
          { alimento: 'Harina de trigo (000, 0000)', alacena: 'cerrada: 6–12 meses; abierta: 6–8 meses', heladera: 'abierta: 1 año', freezer: 'no corresponde', notas: '', fuente: 'FK 222' },
          { alimento: 'Harina integral', alacena: 'cerrada: 3–6 meses', heladera: 'abierta: 6–8 meses', freezer: 'no corresponde', notas: 'Otra fila de FoodKeeper (FK 459) da 12 meses de alacena y 2 años de heladera o freezer; se eligió la que está con las demás harinas.', fuente: 'FK 223 (descartada FK 459)' },
          { alimento: 'Harina de maíz y polenta', alacena: 'cerrada: 6–12 meses', heladera: 'abierta: 1 año', freezer: 'no corresponde', notas: '«Cornmeal (regular, degerminated)».', fuente: 'FK 218' },
          { alimento: 'Fécula de maíz', alacena: 'cerrada: 18–24 meses; abierta: 18 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 220' },
          { alimento: 'Arroz blanco', alacena: 'cerrado: 2 años; abierto: 1 año', heladera: 'abierto: 6 meses', freezer: 'no corresponde', notas: '', fuente: 'FK 338' },
          { alimento: 'Arroz integral', alacena: '1 año (cerrado o abierto)', heladera: 'abierto: 6 meses', freezer: 'no corresponde', notas: '', fuente: 'FK 339' },
          { alimento: 'Fideos secos', alacena: 'cerrados: 2 años; abiertos: 1 año', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'Sin huevo. Los fideos secos al huevo: 2 años cerrados, 1–2 meses abiertos (FK 336).', fuente: 'FK 335' },
          { alimento: 'Porotos secos', alacena: 'cerrados: 1–2 años; abiertos: 1 año', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 333' },
          { alimento: 'Lentejas y arvejas secas partidas', alacena: '1 año (cerradas o abiertas)', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 334, 337' },
          { alimento: 'Avena', alacena: 'cerrada: 12 meses; abierta: 6–12 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '«Cereal (cook before eating (oatmeal))».', fuente: 'FK 375' },
          { alimento: 'Azúcar (común, negra, impalpable)', alacena: 'indefinida; abierta, mejor calidad 18–24 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '«El azúcar nunca se echa a perder».', fuente: 'FK 239–241' },
          { alimento: 'Sal', alacena: 'indefinida', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 468' },
          { alimento: 'Aceite de girasol, maíz, mezcla u oliva', alacena: 'cerrado: 6–12 meses; abierto: 3–5 meses', heladera: 'abierto: 4 meses', freezer: 'no corresponde', notas: 'Para el de girasol solo, FoodKeeper da 1 año cerrado (FK 522).', fuente: 'FK 227' },
          { alimento: 'Aceite usado de freír', alacena: 'no corresponde', heladera: '1 mes', freezer: '6–9 meses', notas: '', fuente: 'FK 526' },
          { alimento: 'Vinagre', alacena: '2 años', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'Aceto balsámico: 3–5 años cerrado; abierto, 18 meses en heladera (FK 669).', fuente: 'FK 361' },
          { alimento: 'Miel', alacena: '2 años', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 345' },
          { alimento: 'Mermeladas', alacena: 'cerradas: 6–18 meses', heladera: 'abiertas: 6–12 meses', freezer: 'no corresponde', notas: '', fuente: 'FK 347' },
          { alimento: 'Cacao en polvo', alacena: 'cerrado: indefinido; abierto: 1 año', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 217' },
          { alimento: 'Chocolate de taza o semiamargo', alacena: 'cerrado: 1–2 años; abierto: 1 año', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 216' },
          { alimento: 'Polvo de hornear', alacena: 'cerrado: 6–18 meses; abierto: 3–6 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 212' },
          { alimento: 'Bicarbonato de sodio', alacena: 'cerrado: 2–3 años; abierto: 6 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 213' },
          { alimento: 'Levadura seca', alacena: 'cerrada: 2 años', heladera: 'abierta: 4 meses', freezer: '6 meses', notas: 'Una vez abierta, va a la heladera o al freezer.', fuente: 'FK 561' },
          { alimento: 'Gelatina sin sabor', alacena: 'cerrada: 3 años', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'La gelatina con sabor: 10–12 meses cerrada, 3–4 meses abierta (FK 225).', fuente: 'FK 226' },
          { alimento: 'Esencia de vainilla', alacena: 'cerrada: 2 años; abierta: 12 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 530' },
          { alimento: 'Especias y hierbas secas', alacena: 'molidas: 2–3 años; enteras: 3–4 años; hierbas secas: 1–2 años', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'Para comino, canela y nuez moscada molidos FoodKeeper da 3–4 años (FK 472, 473, 476); para la pimienta molida, 2 años (FK 469).', fuente: 'FK 236–238' },
          { alimento: 'Caldo en cubitos', alacena: '1 año (cerrado o abierto)', heladera: 'no corresponde', freezer: 'no corresponde', notas: '«Soup mixes (dry bouillon)».', fuente: 'FK 396' },
          { alimento: 'Conservas en lata de baja acidez (choclo, arvejas, porotos, carnes, pescados)', alacena: '2–5 años; abiertas: no se recomienda', heladera: 'abiertas: 3–4 días', freezer: 'no corresponde', notas: 'Una lata sin golpes, óxido ni hinchazón sigue siendo segura después de la fecha.', fuente: 'FK 372' },
          { alimento: 'Conservas ácidas (frutas en almíbar, jugos, pickles, chucrut)', alacena: '12–18 meses; abiertas: no se recomienda', heladera: 'abiertas: 5–7 días', freezer: 'no corresponde', notas: 'FoodKeeper no nombra el tomate en lata.', fuente: 'FK 373' },
          { alimento: 'Salsa de tomate envasada (frasco o caja)', alacena: 'hasta la fecha del envase', heladera: 'abierta: 3–5 días', freezer: 'no corresponde', notas: 'Cerrada no gana nada en la heladera. FoodKeeper no tiene fila para el puré ni el triturado.', fuente: 'FK 599' },
          { alimento: 'Extracto de tomate', alacena: '27 meses', heladera: 'abierto: 5 días', freezer: '2–3 meses', notas: '', fuente: 'FK 501' },
          { alimento: 'Aceitunas', alacena: 'cerradas: 12–18 meses', heladera: 'abiertas: 2 semanas', freezer: 'no corresponde', notas: '', fuente: 'FK 352' },
          { alimento: 'Nueces', alacena: '2–4 semanas', heladera: '9–12 meses', freezer: '24 meses', notas: 'Con o sin cáscara.', fuente: 'FK 446' },
          { alimento: 'Almendras peladas', alacena: '4 meses', heladera: '8 meses', freezer: '10 meses', notas: '', fuente: 'FK 438' },
          { alimento: 'Maní pelado', alacena: '4 semanas', heladera: '12 meses', freezer: '24 meses', notas: '', fuente: 'FK 442' },
          { alimento: 'Semillas (chía, sésamo, lino entero)', alacena: 'chía: 18 meses; sésamo: 5 años; lino entero: 2 años', heladera: 'lino molido: 12 meses', freezer: 'lino molido: 12 meses', notas: '', fuente: 'FK 573, 613, 503, 504' },
          { alimento: 'Café molido', alacena: 'cerrado: 2 años; abierto: 2 semanas', heladera: 'abierto: 1 mes', freezer: '6–12 meses', notas: 'En recipiente hermético.', fuente: 'FK 541' },
          { alimento: 'Té en saquitos', alacena: 'cerrado: 18–36 meses; abierto: 6–12 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 410' }
        ]
      },
      {
        titulo: 'Salsas y condimentos',
        filas: [
          { alimento: 'Mayonesa (de fábrica)', alacena: 'cerrada: 3–6 meses', heladera: 'abierta: 2 meses', freezer: 'no se recomienda', notas: 'FoodKeeper: abierta, la de fábrica es segura fuera de la heladera; la heladera es por calidad. FSIS: no se congela bien.', fuente: 'FK 350, FSIS-C' },
          { alimento: 'Mostaza', alacena: 'cerrada: 1–2 años', heladera: 'abierta: 1 año', freezer: 'no corresponde', notas: '', fuente: 'FK 351' },
          { alimento: 'Ketchup', alacena: 'cerrado: 1 año', heladera: 'abierto: 6 meses', freezer: 'no corresponde', notas: '', fuente: 'FK 348' },
          { alimento: 'Aderezos envasados', alacena: 'cremosos: 6 meses cerrados; vinagreta: 6 meses cerrada', heladera: 'cremosos abiertos: 3–4 semanas; vinagreta abierta: 4 semanas', freezer: 'no se recomienda', notas: '', fuente: 'FK 623, 625' },
          { alimento: 'Salsa de soja', alacena: 'cerrada: 3 años', heladera: 'abierta: 1 mes', freezer: 'no corresponde', notas: 'Abierta es segura fuera de la heladera; la heladera es por calidad.', fuente: 'FK 360' },
          { alimento: 'Salsa inglesa', alacena: '1 año', heladera: 'no corresponde', freezer: 'no corresponde', notas: '', fuente: 'FK 362' },
          { alimento: 'Salsa picante', alacena: '6 meses', heladera: 'no corresponde', freezer: 'no corresponde', notas: 'Dura más en la heladera.', fuente: 'FK 559' },
          { alimento: 'Pesto envasado', alacena: 'no corresponde', heladera: 'cerrado: 6 meses; abierto: 3 días', freezer: '1 mes', notas: '', fuente: 'FK 354' },
          { alimento: 'Pesto casero', alacena: 'no corresponde', heladera: '4–5 días', freezer: '3–4 meses', notas: '', fuente: 'ST 18780' },
          { alimento: 'Vinagreta casera', alacena: 'no corresponde', heladera: '2–3 semanas', freezer: 'no corresponde', notas: '', fuente: 'FK 624' },
          { alimento: 'Salsa fresca de tomate crudo casera', alacena: 'no corresponde', heladera: '5–7 días', freezer: '12 meses', notas: '«Salsa (homemade, fresh)»: tomate, cebolla y ají sin cocinar. Parecida a la salsa criolla, pero no es la misma receta.', fuente: 'FK 645' },
          { alimento: 'Guacamole', alacena: 'no corresponde', heladera: '3–4 días', freezer: '3–4 meses', notas: '', fuente: 'FK 180' },
          { alimento: 'Hummus casero', alacena: 'no corresponde', heladera: '7 días', freezer: 'no se recomienda', notas: '', fuente: 'FK 183' }
        ]
      },
      {
        titulo: 'Comidas cocidas y sobras',
        filas: [
          { alimento: 'Sobras con carne, pollo, pescado o huevo', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'FoodKeeper: 3–4 días. FSIS («Leftovers and Food Safety») da 3–4 meses de freezer para las sobras en general; se eligió la fila de FoodKeeper, que separa con carne y sin carne.', fuente: 'ANMAT-F, FK 173' },
          { alimento: 'Sobras sin carne (verduras cocidas, arroz, papas)', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'FoodKeeper: 3–4 días. SENASA: verduras cocidas 3–4 días.', fuente: 'ANMAT-F, FK 174, SEN' },
          { alimento: 'Caldo casero', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 484' },
          { alimento: 'Caldo comprado (en caja)', alacena: 'cerrado: hasta la fecha del envase', heladera: 'abierto: 3–4 días', freezer: '2–3 meses', notas: '', fuente: 'FK 486' },
          { alimento: 'Sopas, guisos y estofados (locro, carbonada, carne con salsa)', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'FoodKeeper: 3–4 días. Freezer: FoodKeeper y la tabla de FSIS coinciden; se descartó la fila de carnes con jugo (6 meses, FK 186) y la de StillTasty para el estofado de carne (4–6 meses).', fuente: 'ANMAT-F, FK 193, FSIS-C' },
          { alimento: 'Salsa de tomate casera (fileto, bolognesa)', alacena: 'no corresponde', heladera: '3 días', freezer: '4–6 meses', notas: 'StillTasty: 3–4 días.', fuente: 'ANMAT-F, ST 18842' },
          { alimento: 'Empanadas cocidas', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'Ninguna fuente oficial tiene empanadas; es la ficha de StillTasty de «meat pie» recién horneado (3–5 días, 1–2 meses).', fuente: 'ANMAT-F, ST 17671' },
          { alimento: 'Tartas saladas (pascualina, tarta de verdura, quiche)', alacena: 'máximo 2 horas', heladera: '3 días', freezer: '2–3 meses', notas: 'FoodKeeper («quiche»): 3–5 días. SENASA: 3–4 días para las verduras cocidas dentro de una tarta.', fuente: 'ANMAT-F, FK 211, SEN' },
          { alimento: 'Tortilla de papa', alacena: 'no corresponde', heladera: '3 días', freezer: '2–3 meses', notas: 'Plato con huevo; FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 24' },
          { alimento: 'Pizza', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 175' },
          { alimento: 'Pasta cocida', alacena: 'no corresponde', heladera: '3 días', freezer: '1–2 meses', notas: 'FoodKeeper: 3–5 días.', fuente: 'ANMAT-F, FK 177' },
          { alimento: 'Arroz cocido', alacena: 'no corresponde', heladera: '3 días', freezer: '6 meses', notas: 'FoodKeeper: 4–6 días.', fuente: 'ANMAT-F, FK 178' },
          { alimento: 'Legumbres cocidas (porotos, lentejas, garbanzos)', alacena: 'no corresponde', heladera: '3 días', freezer: '6 meses', notas: 'StillTasty: 3–5 días (fichas de lentejas y porotos pintos).', fuente: 'ANMAT-F, ST 17548, 18011' },
          { alimento: 'Puré de papas y papas cocidas', alacena: 'no corresponde', heladera: '3 días', freezer: '10–12 meses', notas: 'StillTasty: 3–5 días. La papa entera hervida no conviene congelarla: queda aguachenta.', fuente: 'ANMAT-F, ST 18081, FK 297' },
          { alimento: 'Ensalada de papa o rusa', alacena: 'no corresponde', heladera: '3 días', freezer: 'no se recomienda', notas: 'FoodKeeper: 3–5 días.', fuente: 'ANMAT-F, FK 191' },
          { alimento: 'Ensaladas de atún, pollo o huevo', alacena: 'no corresponde', heladera: '3 días', freezer: 'no se recomienda', notas: 'FoodKeeper: 3–4 días.', fuente: 'ANMAT-F, FK 190, 417, 418' }
        ]
      }
    ],
    notas: [
      '«No corresponde» quiere decir que la fuente no da plazo para ese lugar; «no se recomienda», que lo desaconseja de forma explícita. Cuando el plazo cambia, va en la misma celda («cerrado: …; abierto: …»).',
      'Todo lo cocido y las sobras llevan 3 días de heladera (ANMAT-F); en «Notas», lo que dice la otra fuente.',
      'Cuando las fuentes no coinciden se eligió una con este orden: organismo oficial (ANMAT y SENASA, después USDA/FSIS/FoodKeeper), fuente argentina reconocida, fabricante y sitios.',
      'La Serenísima: los dulces de leche están también en https://www.laserenisima.com.ar/DulcedeLeche/. La Salteña: las fichas de las tapas están en https://www.lasaltena.com.ar/productos/empanadas-criollas/ y https://www.lasaltena.com.ar/productos/pascualinas-criollas/.',
      'FoodKeeper sólo se pudo leer en la captura de julio de 2025 de su JSON oficial (https://web.archive.org/web/20250702182320/https://www.fsis.usda.gov/shared/data/EN/foodkeeper.json), porque el servidor de FSIS responde 403: no se comprobó que no haya cambiado después.'
    ],
    fuentes: [FK, FSIS_C, FSIS_D, FSIS_S, FSIS_R, ANMAT_F, ANMAT_M, SEN, IA, LS, LSA, MK, CAN, ST], columnaFuente: 'fuente'
  }
} satisfies Record<string, Tabla>;
