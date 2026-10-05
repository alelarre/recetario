/**
 * Básicos de cocción: sólo datos. Cada tabla y cada constante dicen de dónde salen.
 *
 * Procedencia: product-design/research/herramientas/verificacion-basicos-de-coccion.md
 * Para corregir un número, editá su fila.
 * Para sumar una fila, respetá las columnas de su tabla. El orden en que se
 * muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { Constante, Fuente, Tabla } from '../tipos.js';

const USA_RICE: Fuente = { nombre: 'USA Rice Federation, How To Cook Rice', url: 'https://www.usarice.com/thinkrice/how-to/how-to-cook-rice' };
const FAGOR: Fuente = {
  nombre: 'Fagor, Manual olla a presión super-rápida Future',
  url: 'https://fagorcookware.com/wp-content/uploads/2022/10/IM_OP_FUTURE.pdf'
};
const BARILLA_ITALIA: Fuente = { nombre: 'Barilla, Penne Rigate (Italia)', url: 'https://www.barilla.com/it-it/prodotti/pasta/i-classici/penne-rigate' };
const BARILLA_EEUU: Fuente = { nombre: 'Barilla EE. UU., Dry & Cooked Pasta Serving Size', url: 'https://www.barilla.com/en-us/help-with/pasta-kitchen-tips/pasta-serving-size' };
const IGI: Fuente = {
  nombre: 'Instituto Gastronómico Internacional (IGI), Fondos de cocina: fondo blanco, oscuro, fumet y glace paso a paso',
  url: 'https://www.igi-la.com/blog/fondos-de-cocina-guia/'
};

export const TABLAS_COCCION = {
  'arroz-presion': {
    id: 'arroz-presion', titulo: 'Arroz en olla a presión',
    columnas: [
      { id: 'arroz', nombre: 'Arroz' },
      { id: 'proporcion', nombre: 'Arroz : agua' },
      { id: 'presion', nombre: 'Presión estándar (100 kPa)' }
    ],
    filas: [
      { arroz: 'Bomba', proporcion: '300 g : 550 ml', presion: '4–6 min' },
      { arroz: 'Carnaroli', proporcion: '300 g : 550 ml', presion: '4–6 min' },
      { arroz: 'Basmati', proporcion: '300 g : 500 ml', presion: '2–4 min' },
      { arroz: 'Integral', proporcion: '300 g : 800 ml', presion: '12–16 min' },
      { arroz: 'Risotto', proporcion: '300 g : 675 ml', presion: '4–6 min' },
      { arroz: 'Sushi', proporcion: '300 g : 400 ml', presion: '4–6 min' }
    ],
    notas: [
      'El tiempo se cuenta desde que la válvula larga vapor con fuerza; ahí se baja a fuego medio-bajo.',
      'Para liberar la presión: natural (sacar del fuego y esperar 10–15 min), con agua fría sobre la tapa o con la válvula.',
      'Llenar la olla hasta la mitad como máximo.'
    ],
    fuente: FAGOR
  },

  granos: {
    id: 'granos', titulo: 'Granos',
    columnas: [
      { id: 'grano', nombre: 'Grano' },
      { id: 'liquido', nombre: 'Líquido', unidad: 'partes' },
      { id: 'tiempo', nombre: 'Tiempo' },
      { id: 'rinde', nombre: 'Rinde', unidad: 'partes cocidas' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { grano: 'Quinoa', liquido: '2', tiempo: '12–15 min', rinde: '3', fuente: 'WGC' },
      { grano: 'Trigo burgol', liquido: '2', tiempo: '10–12 min', rinde: '3', fuente: 'WGC' },
      { grano: 'Polenta (harina de maíz común, no instantánea)', liquido: '4', tiempo: '25–30 min', rinde: '2½', fuente: 'WGC' },
      { grano: 'Avena cortada', liquido: '4', tiempo: '30 min', rinde: '3', fuente: 'WGC' },
      { grano: 'Avena arrollada', liquido: '2 para media taza de avena; 1¾ para una taza', tiempo: 'unos 5 min', rinde: '—', fuente: 'Quaker' },
      { grano: 'Cebada pelada', liquido: '3', tiempo: '45–60 min', rinde: '3½', fuente: 'WGC' },
      { grano: 'Mijo pelado', liquido: '2½', tiempo: '25–35 min', rinde: '4', fuente: 'WGC' },
      { grano: 'Trigo sarraceno', liquido: '2', tiempo: '20 min', rinde: '4', fuente: 'WGC' },
      { grano: 'Amaranto', liquido: '2', tiempo: '15–20 min', rinde: '2½', fuente: 'WGC' },
      { grano: 'Farro', liquido: '2½', tiempo: '25–40 min', rinde: '3', fuente: 'WGC' },
      { grano: 'Cuscús', liquido: '1¼ (agua o caldo hirviendo)', tiempo: '0 min al fuego: tapar fuera del fuego y dejar 5 min', rinde: '—', fuente: 'Bobs' },
      { grano: 'Trigo en grano', liquido: '4', tiempo: 'remojo de una noche, y 45–60 min', rinde: '2½', fuente: 'WGC' }
    ],
    notas: [
      'Por cada parte de grano, en volumen; sirve con cualquier taza. Salvo la avena arrollada y el cuscús, el tiempo es a fuego bajo, tapado, una vez que rompe el hervor.',
      'El tiempo varía con la edad del grano, la variedad y la olla.',
      'La polenta instantánea no tiene una proporción verificada: se cocina según el paquete.'
    ],
    columnaFuente: 'fuente',
    fuentes: [
      { abreviatura: 'WGC', nombre: 'Whole Grains Council, Cooking Whole Grains', url: 'https://wholegrainscouncil.org/recipes/cooking-whole-grains' },
      { abreviatura: 'Quaker', nombre: 'Quaker, Old Fashioned Oats', url: 'https://www.quakeroats.com/products/hot-cereals/old-fashioned-oats' },
      {
        abreviatura: 'Bobs', nombre: "Bob's Red Mill, Basic preparation instructions for Golden Couscous",
        url: 'https://www.bobsredmill.com/recipes/how-to-make/basic-preparation-instructions-for-golden-couscous'
      }
    ]
  },

  legumbres: {
    id: 'legumbres', titulo: 'Legumbres',
    columnas: [
      { id: 'legumbre', nombre: 'Legumbre' },
      { id: 'remojo', nombre: 'Remojo' },
      { id: 'olla', nombre: 'Olla', unidad: 'min' },
      { id: 'rinde', nombre: 'Rinde', unidad: 'tazas cocidas por taza seca' }
    ],
    filas: [
      { legumbre: 'Garbanzos', remojo: 'sí', olla: '90–120', rinde: '2' },
      { legumbre: 'Lentejas', remojo: 'no', olla: '15–20', rinde: '2½' },
      { legumbre: 'Arvejas secas partidas', remojo: 'no', olla: '30–40', rinde: '2' },
      { legumbre: 'Arvejas secas enteras', remojo: 'sí', olla: '35–40', rinde: '2' },
      { legumbre: 'Porotos negros', remojo: 'sí', olla: '60–90', rinde: '2–2½' },
      { legumbre: 'Porotos alubia', remojo: 'sí', olla: '45–60', rinde: '2–2½' },
      { legumbre: 'Porotos alubia chicos (navy)', remojo: 'sí', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos colorados', remojo: 'sí', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos pintos', remojo: 'sí', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos rosados', remojo: 'sí', olla: '60', rinde: '2–2½' },
      { legumbre: 'Porotos cranberry (borlotti)', remojo: 'sí', olla: '45–60', rinde: '2–2½' }
    ],
    notas: [
      'El tiempo es a fuego suave, después del remojo, con las legumbres cubiertas de agua. Para cocinar: 2 tazas de agua por taza de legumbre remojada (2½ las lentejas, 2 las arvejas partidas), siempre cubiertas, agregando agua fría si hace falta.',
      'Remojo lento: 10 tazas de agua por 1 lb de legumbres (unos 5,3 l por kg), 6–8 h o toda la noche, en la heladera.',
      'Remojo en caliente (el que recomienda NDSU): 10 tazas de agua por 2 tazas de legumbres (5 partes); hervir 2–3 min y dejar tapado fuera del fuego entre 4 y 24 h.',
      'Remojo rápido: 6 tazas de agua por 2 tazas de legumbres (3 partes); hervir 2–3 min y dejar tapado fuera del fuego 1 h.',
      'Siempre se descarta el agua del remojo y se enjuaga. Si el remojo pasa de 4 horas, va a la heladera.'
    ],
    fuente: {
      nombre: 'NDSU Extension, A Pocket Guide to Preparing Pulse Foods (FN2068, noviembre de 2022)',
      url: 'https://www.ndsu.edu/agriculture/sites/default/files/2024-01/fn2068.pdf'
    }
  },

  'legumbres-presion': {
    id: 'legumbres-presion', titulo: 'Legumbres en olla a presión',
    columnas: [
      { id: 'legumbre', nombre: 'Legumbre' },
      { id: 'presion', nombre: 'Presión estándar (100 kPa)' }
    ],
    filas: [
      { legumbre: 'Garbanzos', presion: '26–30 min' },
      { legumbre: 'Lentejas, sin remojo', presion: '8–10 min' },
      { legumbre: 'Alubias blancas', presion: '16–22 min' },
      { legumbre: 'Alubias pintas', presion: '18–22 min' },
      { legumbre: 'Alubias fabes', presion: '16–22 min' },
      { legumbre: 'Alubias verdinas', presion: '16–20 min' },
      { legumbre: 'Azuki', presion: '10–12 min' },
      { legumbre: 'Habas', presion: '8–10 min' }
    ],
    notas: [
      'El tiempo se cuenta desde que la válvula larga vapor con fuerza. Llenar la olla hasta la mitad como máximo y poner líquido hasta cubrir.',
      'El manual no trae porotos negros ni colorados: la fila más cercana es la de alubias pintas.'
    ],
    fuente: FAGOR
  },

  'pasta-tiempos': {
    id: 'pasta-tiempos', titulo: 'Tiempo de pasta seca',
    columnas: [
      { id: 'formato', nombre: 'Formato' },
      { id: 'tiempo', nombre: 'Al dente' }
    ],
    filas: [
      { formato: 'Espagueti', tiempo: '7,5–10 min' },
      { formato: 'Tallarines', tiempo: '6–8 min' },
      { formato: 'Fettuccini', tiempo: '6–8 min' },
      { formato: 'Bucatini', tiempo: '6 min' },
      { formato: 'Foratini', tiempo: '9 min' },
      { formato: 'Mostachol', tiempo: '9 min' },
      { formato: 'Tirabuzón', tiempo: '8 min' },
      { formato: 'Moño', tiempo: '7 min' },
      { formato: 'Coditos', tiempo: '8 min' },
      { formato: 'Dedalitos', tiempo: '5 min' },
      { formato: 'Cabello de ángel', tiempo: '4 min' },
      { formato: 'Ave María', tiempo: '5 min' },
      { formato: 'Municiones', tiempo: '5 min' },
      { formato: 'Nidos de fettuccine', tiempo: '6 min' }
    ],
    notas: [
      'Manda el tiempo del paquete.',
      'Es el rango entre los minutos impresos en los paquetes de Lucchetti, Matarazzo y Don Vicente; son de 2013, y la misma marca puede tener hoy líneas de cocción rápida.'
    ],
    fuente: {
      nombre: 'E. J. Cavanagh, Ahorro de Gas Natural en la Cocción de Pastas, Ciencia y Tecnología 13, Universidad de Palermo (2013), tabla 1',
      url: 'https://dspace.palermo.edu/ojs/index.php/cyt/article/download/42/35/'
    }
  },

  verduras: {
    id: 'verduras', titulo: 'Verduras al vapor y hervidas',
    columnas: [
      { id: 'verdura', nombre: 'Verdura' },
      { id: 'corte', nombre: 'Corte' },
      { id: 'vapor', nombre: 'Vapor', unidad: 'min' },
      { id: 'hervida', nombre: 'Hervida', unidad: 'min' }
    ],
    filas: [
      { verdura: 'Alcaucil (alcachofa)', corte: 'entero', vapor: '30–40', hervida: '25–40' },
      { verdura: 'Alcaucil', corte: 'corazones', vapor: '10–15', hervida: '10–15' },
      { verdura: 'Arvejas', corte: '—', vapor: '3–5', hervida: '8–12' },
      { verdura: 'Berenjena', corte: '—', vapor: '15–20', hervida: '10–15' },
      { verdura: 'Remolacha (betarraga)', corte: '—', vapor: '40–60', hervida: '30–60' },
      { verdura: 'Brócoli', corte: 'entero', vapor: '8–15', hervida: '5–10' },
      { verdura: 'Brócoli', corte: 'ramitos', vapor: '5–6', hervida: '4–5' },
      { verdura: 'Coliflor', corte: 'entera', vapor: '15–20', hervida: '10–15' },
      { verdura: 'Coliflor', corte: 'ramitos', vapor: '6–10', hervida: '5–8' },
      { verdura: 'Champiñones', corte: '—', vapor: '4–5', hervida: '3–4' },
      { verdura: 'Espinaca', corte: '—', vapor: '5–6', hervida: '2–5' },
      { verdura: 'Espárragos', corte: '—', vapor: '8–10', hervida: '5–12' },
      { verdura: 'Morrón (pimentón)', corte: '—', vapor: '2–4', hervida: '4–5' },
      { verdura: 'Chauchas (porotos verdes)', corte: '—', vapor: '5–15', hervida: '10–20' },
      { verdura: 'Repollo', corte: '—', vapor: '6–9', hervida: '10–15' },
      { verdura: 'Repollitos de Bruselas', corte: '—', vapor: '6–12', hervida: '5–10' },
      { verdura: 'Zanahoria', corte: 'entera', vapor: '10–15', hervida: '15–20' },
      { verdura: 'Zanahoria', corte: 'en rodajas', vapor: '4–5', hervida: '5–10' },
      { verdura: 'Zapallo', corte: '—', vapor: '5–10', hervida: '5–10' },
      { verdura: 'Zapallito (zapallo italiano)', corte: '—', vapor: '5–10', hervida: '5–10' }
    ],
    notas: [
      'Los tiempos son para ½ kg de verdura. Donde no hay corte, la fuente no lo distingue.',
      'Hervidas: en agua que apenas las cubra, que esté hirviendo y con poca sal.'
    ],
    fuente: {
      nombre: 'Clínica Las Condes (Chile), Centro de Nutrición, Cocción de verduras',
      url: 'https://www.clinicalascondes.cl/CENTROS-Y-ESPECIALIDADES/Centros/Centro-de-Nutricion/Nutricion/Coccion-de-Verduras'
    }
  },

  blanqueado: {
    id: 'blanqueado', titulo: 'Blanqueado',
    columnas: [
      { id: 'verdura', nombre: 'Verdura' },
      { id: 'corte', nombre: 'Tamaño o corte' },
      { id: 'minutos', nombre: 'Minutos', minutos: true }
    ],
    filas: [
      { verdura: 'Espárragos', corte: 'finos', minutos: '2' },
      { verdura: 'Espárragos', corte: 'medianos', minutos: '3' },
      { verdura: 'Espárragos', corte: 'gruesos', minutos: '4' },
      { verdura: 'Chauchas', corte: '—', minutos: '3' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'chicos', minutos: '2' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'medianos', minutos: '3' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'grandes', minutos: '4' },
      { verdura: 'Brócoli', corte: 'ramitos de 3,8 cm (1½ pulgadas)', minutos: '3 (al vapor: 5)' },
      { verdura: 'Repollitos de Bruselas', corte: 'chicos', minutos: '3' },
      { verdura: 'Repollitos de Bruselas', corte: 'medianos', minutos: '4' },
      { verdura: 'Repollitos de Bruselas', corte: 'grandes', minutos: '5' },
      { verdura: 'Repollo o repollo chino', corte: 'cortado en tiras', minutos: '1½' },
      { verdura: 'Zanahorias', corte: 'chicas, enteras', minutos: '5' },
      { verdura: 'Zanahorias', corte: 'en cubos, rodajas o tiras', minutos: '2' },
      { verdura: 'Coliflor', corte: 'ramitos de 2,5 cm (1 pulgada)', minutos: '3' },
      { verdura: 'Apio', corte: '—', minutos: '3' },
      { verdura: 'Choclo en mazorca', corte: 'chico', minutos: '7' },
      { verdura: 'Choclo en mazorca', corte: 'mediano', minutos: '9' },
      { verdura: 'Choclo en mazorca', corte: 'grande', minutos: '11' },
      { verdura: 'Choclo en grano', corte: '—', minutos: '4' },
      { verdura: 'Berenjena', corte: '—', minutos: '4' },
      { verdura: 'Hojas verdes (acelga, espinaca y otras)', corte: '—', minutos: '2' },
      { verdura: 'Hojas de berza (collards)', corte: '—', minutos: '3' },
      { verdura: 'Hongos', corte: 'enteros, al vapor', minutos: '5' },
      { verdura: 'Hongos', corte: 'botones o en cuartos, al vapor', minutos: '3½' },
      { verdura: 'Hongos', corte: 'en láminas, al vapor', minutos: '3' },
      { verdura: 'Cebolla', corte: 'hasta que se caliente el centro', minutos: '3–7' },
      { verdura: 'Cebolla', corte: 'en aros: 10–15 segundos', minutos: '—' },
      { verdura: 'Arvejas', corte: '—', minutos: '1½' },
      { verdura: 'Arvejas chinas (de vaina comestible)', corte: '—', minutos: '1½–3' },
      { verdura: 'Morrón', corte: 'mitades', minutos: '3' },
      { verdura: 'Morrón', corte: 'tiras o aros', minutos: '2' },
      { verdura: 'Papas nuevas', corte: '—', minutos: '3–5' },
      { verdura: 'Zapallito', corte: '—', minutos: '3' },
      { verdura: 'Nabo o chirivía', corte: 'cubos', minutos: '2' },
      { verdura: 'Remolacha, zapallo, calabaza, batata', corte: '—', minutos: 'no se blanquean: se cocinan' }
    ],
    notas: [
      'Minutos en agua hirviendo, a nivel del mar, contados desde que el agua vuelve a hervir.',
      'Agua: 1 galón por libra de verdura preparada, o sea, unos 8,3 l por kg.',
      'Enfriado: en agua a 16 °C (60 °F) o menos, cambiándola seguido o con agua helada corriendo; hace falta más o menos 1 kg de hielo por kg de verdura. El enfriado dura lo mismo que el blanqueado.',
      'Al vapor, el tiempo es 1½ veces el del agua; la canasta va a 7,5 cm (3 pulgadas) o más del fondo, y se cuenta desde que se pone la tapa.',
      'Agua, enfriado y vapor: NCHFP, Blanching Vegetables, https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-vegetables/.',
      'Altitud: a 5.000 pies (1.524 m) o más, 1 minuto más que el tiempo a nivel del mar. Colorado State University Extension, High Elevation Food Preparation Guide, https://foodsmartcolorado.colostate.edu/recipes/cooking-and-baking/high-elevation-food-preparation-guide.'
    ],
    fuente: {
      nombre: 'National Center for Home Food Preservation (NCHFP, Universidad de Georgia), Blanching Times',
      url: 'https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-times/'
    }
  }
} satisfies Record<string, Tabla>;

export interface VariedadDeArroz { id: string; nombre: string; partesVolumen: string; aguaPorGramo: number | null; tiempo: string }

/** Arroz por absorción en olla: partes de agua en volumen, y en peso derivada de las densidades de USDA. */
export const ARROZ: { variedades: readonly VariedadDeArroz[]; notas: readonly string[]; fuente: Fuente } = {
  variedades: [
    { id: 'largo-fino', nombre: 'Largo fino', partesVolumen: '2', aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'doble-carolina', nombre: 'Doble carolina (largo ancho)', partesVolumen: '2', aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'mediano', nombre: 'Grano mediano', partesVolumen: '1½', aguaPorGramo: 1.85, tiempo: '15–18 min' },
    { id: 'corto', nombre: 'Grano corto o para sushi', partesVolumen: '1¼', aguaPorGramo: 1.5, tiempo: '15–18 min' },
    { id: 'integral', nombre: 'Integral, grano largo o mediano (y yamaní)', partesVolumen: '2¼', aguaPorGramo: 2.9, tiempo: '40–45 min' },
    { id: 'parboil', nombre: 'Parboil', partesVolumen: '2¼', aguaPorGramo: null, tiempo: '20–30 min' },
    { id: 'parboil-integral', nombre: 'Parboil integral', partesVolumen: '2¼', aguaPorGramo: null, tiempo: '25 min' },
    { id: 'jazmin', nombre: 'Jazmín', partesVolumen: '2', aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'basmati', nombre: 'Basmati', partesVolumen: '2', aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'arborio', nombre: 'Arbóreo o carnaroli', partesVolumen: '4', aguaPorGramo: 4.9, tiempo: '20–30 min' },
    { id: 'salvaje', nombre: 'Salvaje', partesVolumen: '3', aguaPorGramo: 4.5, tiempo: '40–50 min' }
  ],
  notas: [
    'Hervir el agua con el arroz, bajar a fuego mínimo, tapar y no revolver. Si después del tiempo el arroz no está tierno o queda líquido, 2 a 4 minutos más.',
    'El agua en peso es una cuenta hecha con las partes de la tabla y los gramos por taza de arroz crudo de USDA FoodData Central (https://fdc.nal.usda.gov/): largo blanco 185 g (fdcId 168877), mediano blanco 195 g (168879), corto blanco 200 g (168931), integral largo 185 g (169703), integral mediano 190 g (169706), salvaje 160 g (169726). El parboil no tiene densidad ahí.',
    'El Ministerio de Agroindustria (Alimentos Argentinos, Ficha 37: Arroz, https://alimentosargentinos.magyp.gob.ar/HomeAlimentos/seguridad-alimentaria-y-nutricion/fichaspdf/Ficha_37_Arroz.pdf) da una sola regla para todos: 1 parte de arroz por 3 de líquido, ya sea agua, caldo o salsa.',
    'En olla a presión, llenar la olla hasta la mitad como máximo (Fagor, manual Future, https://fagorcookware.com/wp-content/uploads/2022/10/IM_OP_FUTURE.pdf).'
  ],
  fuente: USA_RICE
};

export const AGUA_SAL_PASTA: { litrosPor100g: Constante; salPorLitro: Constante } = {
  litrosPor100g: { valor: 1, unidad: 'l de agua por 100 g de pasta', fuente: BARILLA_ITALIA },
  salPorLitro: { valor: 7, unidad: 'g de sal por litro de agua', fuente: BARILLA_ITALIA }
};

export const ESPAGUETI: { gramosPorCm2: Constante } = {
  gramosPorCm2: { valor: 19.2, unidad: 'g por cm²', fuente: BARILLA_EEUU }
};

export interface TipoDeCaldo { id: string; nombre: string; principal: string; antes: string; tiempo: string }

export const CALDO: {
  aguaPorKg: Constante; mirepoixMinPorKg: Constante; mirepoixMaxPorKg: Constante;
  reparto: { cebolla: number; zanahoria: number; apio: number };
  tipos: readonly TipoDeCaldo[]; procedimiento: string; fuente: Fuente
} = {
  aguaPorKg: { valor: 2, unidad: 'l de agua por kg de huesos', fuente: IGI },
  mirepoixMinPorKg: { valor: 100, unidad: 'g de mirepoix por kg de huesos', fuente: IGI },
  mirepoixMaxPorKg: { valor: 150, unidad: 'g de mirepoix por kg de huesos', fuente: IGI },
  reparto: { cebolla: 2, zanahoria: 1, apio: 1 },
  tipos: [
    { id: 'ave', nombre: 'Blanco de ave', principal: 'carcasas y patas de pollo', antes: 'crudo o blanqueado', tiempo: '3–4 h' },
    { id: 'vaca', nombre: 'Blanco de ternera o vaca', principal: 'huesos con articulación', antes: 'blanqueado', tiempo: '6–8 h' },
    {
      id: 'oscuro', nombre: 'Oscuro (ternera, vaca, ave, caza)', principal: 'huesos y recortes',
      antes: 'tostados en horno a 200–220 °C de 45 min a 1 h, con tomate', tiempo: '6–8 h'
    },
    {
      id: 'pescado', nombre: 'Fumet de pescado', principal: 'espinas y cabezas de pescado blanco, sin agallas',
      antes: 'desangradas en agua fría y sudadas en manteca', tiempo: '20–30 min, y 10 min de reposo fuera del fuego'
    }
  ],
  procedimiento: 'Se empieza con agua fría, sin sal, sin tapa y sin hervir (entre 85 y 95 °C), espumando.',
  fuente: IGI
};
