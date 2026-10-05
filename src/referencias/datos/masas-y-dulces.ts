/**
 * Masas y dulces: sólo datos. Cada tabla, cada constante y cada receta dicen de dónde salen.
 *
 * Procedencia: product-design/research/herramientas/verificacion-masas-y-dulces.md
 * (y su «Agregado: pastas rellenas, lasaña y ñoquis»).
 * Para corregir un número, editá su fila.
 * Los ingredientes de las recetas son por porción: la cuenta los multiplica.
 * El orden en que se muestran las fichas está en `src/referencias/indice.ts`.
 */
import type { Constante, Fuente, Tabla } from '../tipos.js';

const WILTON: Fuente = { nombre: 'Wilton, Cake Baking & Serving Guide', url: 'https://wilton.com/baking-inspiration/cake-baking-serving-guide/' };
const AIB: Fuente = {
  nombre: 'AIB International, Food First, Q&A: Is taking a specific gravity measurement necessary for cake batter during or after mixing',
  url: 'https://blog.aibinternational.com/en/food-first-blog/postid/948/qa-is-taking-a-specific-gravity-measurement-necessary-for-cake-batter-during-or-after-mixing'
};
const EMPORIO_ALUMINIO: Fuente = { nombre: 'El Nuevo Emporio, Artículos de aluminio', url: 'https://elnuevoemporio.com.ar/productos-reposteria-aluminio.html' };
const KUCHEN_BAZAR: Fuente = {
  nombre: 'Kuchen Bazar, Budinera antiadherente 1,5 L',
  url: 'https://www.kuchenbazar.com.ar/productos/budinera-antiadherente-de-aluminio-molde-para-horno-15-l/'
};
const EMPORIO_BUDIN: Fuente = { nombre: 'El Nuevo Emporio, Moldes para budín', url: 'https://elnuevoemporio.com.ar/productos-reposteria-moldes-budin.html' };
const JOY_OF_BAKING: Fuente = { nombre: 'Joy of Baking, Pan Sizes', url: 'https://www.joyofbaking.com/PanSizes.html' };
const INFORMACIBO: Fuente = {
  nombre: "Informacibo, Guida alla pasta all'uovo (Ines Roscio Pavia)",
  url: 'https://www.informacibo.it/fare-la-pasta-alluovo-tagliatelle-lasagne-pappardelle/'
};
const CASA_DI_LANGA: Fuente = { nombre: 'Casa di Langa, Tajarin', url: 'https://www.casadilanga.com/it/tavola-e-calici/tajarin-pasta/' };
const GALBANI_ORECCHIETTE: Fuente = {
  nombre: 'Galbani, Come fare le orecchiette pugliesi',
  url: 'https://www.galbani.it/abcucina/come-fare/trucchi-e-segreti-per-la-pasta-fresca/come-fare-le-orecchiette-pugliesi'
};
const CSI_PIEMONTE: Fuente = {
  nombre: "CSI Piemonte, Procedura per l'affidamento del servizio di ristorazione aziendale, anexo 5, Tabella delle grammature e delle porzioni",
  url: 'https://www.csipiemonte.it/sites/default/files/inline_download/gare/archivio/2017/01_2017/All_5_Tabella_Grammature_e_Porzioni.pdf'
};
const COCINEROS_NOQUIS: Fuente = { nombre: 'Cocineros Argentinos, Ñoquis de papa', url: 'https://cocinerosargentinos.com/recetas/economicas/noquis-de-papa' };
const LA_JUVENIL: Fuente = { nombre: 'La Juvenil, Catálogo de productos', url: 'https://www.lajuvenilpastas.com.ar/catalogos/catalogo_de_productos.pdf' };
const BOLOGNA_WELCOME: Fuente = {
  nombre: 'Fondazione Bologna Welcome, Lasagne Verdi alla bolognese (receta de la Accademia Italiana della Cucina)',
  url: 'https://www.bolognawelcome.com/it/altro/ricette-e-prodotti-tipici/lasagne-verdi-alla-bolognese'
};
const AVPN: Fuente = { nombre: 'AVPN, Disciplinare 2024', url: 'https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf' };
const COMEMELAPIZZA: Fuente = { nombre: 'Comemelapizza, Masa de pizza argentina', url: 'https://www.comemelapizza.com/masa-de-pizza-argentina/' };
const CSU_CANDY: Fuente = {
  nombre: 'Colorado State University Extension, Candy making at high elevation',
  url: 'https://foodsmartcolorado.colostate.edu/recipes/cooking-and-baking/candy-making-at-high-elevation'
};
const LAROUSSE_FRANCES: Fuente = { nombre: 'Larousse Cocina, Merengue francés', url: 'https://laroussecocina.mx/receta/merengue-frances/' };
const LAROUSSE_SUIZO: Fuente = { nombre: 'Larousse Cocina, Merengue suizo', url: 'https://laroussecocina.mx/receta/merengue-suizo/' };
const LAROUSSE_ITALIANO: Fuente = { nombre: 'Larousse Cocina, Merengue italiano', url: 'https://laroussecocina.mx/receta/merengue-italiano/' };

export const TABLAS_MASAS = {
  piezas: {
    id: 'piezas', titulo: 'Gramos de masa por pieza',
    columnas: [
      { id: 'pieza', nombre: 'Pieza' },
      { id: 'gramos', nombre: 'Masa cruda', unidad: 'g' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { pieza: 'Pan de hamburguesa', gramos: '80', fuente: 'Hamburguesa' },
      { pieza: 'Pan de hamburguesa artesanal', gramos: '75', fuente: 'HamburguesaArtesanal' },
      { pieza: 'Pan de pancho', gramos: '40', fuente: 'Pancho' },
      { pieza: 'Pan de Viena', gramos: '100', fuente: 'Viena' },
      { pieza: 'Pan de pebete', gramos: '100', fuente: 'Pebete' },
      { pieza: 'Pan flauta', gramos: '100', fuente: 'Flauta' },
      { pieza: 'Pan francés', gramos: '120', fuente: 'Frances' },
      { pieza: 'Baguette', gramos: '250', fuente: 'Baguette' },
      { pieza: 'Bagel', gramos: '85', fuente: 'Bagel' },
      { pieza: 'Grisín', gramos: '30', fuente: 'Grisin' },
      { pieza: 'Medialuna de manteca', gramos: '50', fuente: 'Medialuna' },
      { pieza: 'Factura', gramos: '50', fuente: 'Factura' },
      { pieza: 'Pan de molde tipo artesanal', gramos: '380', fuente: 'MoldeArtesanal' },
      { pieza: 'Pan de molde lacteado', gramos: '400', fuente: 'MoldeLacteado' },
      { pieza: 'Pan de campo', gramos: '500', fuente: 'Campo' },
      { pieza: 'Pan dulce de 500 g', gramos: '530', fuente: 'Panettone' }
    ],
    notas: [
      'Peso de la masa cruda al dividir.',
      'Son recetas de panadería: el pan de pancho de 40 g es el industrial chico; el de Viena, de 100 g, es el grande.',
      'El pan de hamburguesa de papa clásico también se divide en 80 g (https://www.puratos.com.ar/es/recipes/pan-de-hamburguesa-de-papa-clasico). Pan dulce: se cortan piezas de 530 g y rinde piezas de 500 g.'
    ],
    columnaFuente: 'fuente',
    fuentes: [
      { abreviatura: 'Hamburguesa', nombre: 'Puratos Argentina, Pan de hamburguesa', url: 'https://www.puratos.com.ar/es/recipes/pan-de-hamburguesa0' },
      { abreviatura: 'HamburguesaArtesanal', nombre: 'Puratos Argentina, Pan de hamburguesas tipo artesanal', url: 'https://www.puratos.com.ar/es/recipes/pan-de-hamburguesas-tipo-artesanal' },
      { abreviatura: 'Pancho', nombre: 'Puratos Argentina, Pan de pancho', url: 'https://www.puratos.com.ar/es/recipes/pan-de-pancho' },
      { abreviatura: 'Viena', nombre: 'Puratos Argentina, Pan de Viena', url: 'https://www.puratos.com.ar/es/recipes/pan-de-viena' },
      { abreviatura: 'Pebete', nombre: 'Puratos Argentina, Pan de pebete', url: 'https://www.puratos.com.ar/es/recipes/pan-de-pebete' },
      { abreviatura: 'Flauta', nombre: 'Puratos Argentina, Pan flauta', url: 'https://www.puratos.com.ar/es/recipes/pan-flauta' },
      { abreviatura: 'Frances', nombre: 'Puratos Argentina, Pan francés', url: 'https://www.puratos.com.ar/es/recipes/pan-frances' },
      { abreviatura: 'Baguette', nombre: 'Puratos Argentina, Baguette rústica', url: 'https://www.puratos.com.ar/es/recipes/baguette-rustica' },
      { abreviatura: 'Bagel', nombre: 'Puratos Argentina, Bagel de granos andinos', url: 'https://www.puratos.com.ar/es/recipes/bagel-de-granos-andinos' },
      { abreviatura: 'Grisin', nombre: 'Puratos Argentina, Grisines de queso y semillas', url: 'https://www.puratos.com.ar/es/recipes/grisines-de-queso-y-semillas' },
      { abreviatura: 'Medialuna', nombre: 'Puratos Argentina, Medialunas de manteca', url: 'https://www.puratos.com.ar/es/recipes/medialunas-de-manteca' },
      { abreviatura: 'Factura', nombre: 'Puratos Argentina, Facturas', url: 'https://www.puratos.com.ar/es/recipes/facturas0' },
      { abreviatura: 'MoldeArtesanal', nombre: 'Puratos Argentina, Pan de molde tipo artesanal', url: 'https://www.puratos.com.ar/es/recipes/pan-de-molde-tipo-artesanal' },
      { abreviatura: 'MoldeLacteado', nombre: 'Puratos Argentina, Pan de molde lacteado', url: 'https://www.puratos.com.ar/es/recipes/pan-de-molde-lacteado' },
      { abreviatura: 'Campo', nombre: 'Puratos Argentina, Pan de campo', url: 'https://www.puratos.com.ar/es/recipes/pan-de-campo0' },
      { abreviatura: 'Panettone', nombre: 'Puratos Argentina, Panettone', url: 'https://www.puratos.com.ar/es/recipes/panettone0' }
    ]
  },

  'pasta-comprada': {
    id: 'pasta-comprada', titulo: 'Pasta comprada: cuánto por persona',
    columnas: [
      { id: 'pasta', nombre: 'Pasta' },
      { id: 'porPersona', nombre: 'Por persona' }
    ],
    filas: [
      { pasta: 'Ravioles', porPersona: '48 (una caja)' },
      { pasta: 'Raviolones', porPersona: '16 (2 cajas de 24 cada 3 personas)' },
      { pasta: 'Sorrentinos', porPersona: '5 o 6' },
      { pasta: 'Agnolotis', porPersona: '5 o 6' },
      { pasta: 'Capeletis de máquina y tortelettis', porPersona: '200 g (5 porciones por kg)' },
      { pasta: 'Capeletis caseros', porPersona: '250–300 g' }
    ],
    notas: [
      'Son piezas por persona de pasta ya hecha: la fuente no da el peso de cada pieza, así que no se convierten en harina.'
    ],
    fuente: LA_JUVENIL
  },

  'masas-por-plato': {
    id: 'masas-por-plato', titulo: 'Masas por plato',
    columnas: [
      { id: 'plato', nombre: 'Plato' },
      { id: 'cantidad', nombre: 'Por porción o por pieza' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { plato: 'Tapas de empanada caseras', cantidad: '1 kg de harina 0000, 150 g de grasa, 500 cc de agua, 20 g de sal → ~48 tapas (~35 g cada una)', fuente: 'Cocineros' },
      { plato: 'Tapa de empanada comprada', cantidad: '27,5 g (12 tapas = 330 g)', fuente: 'Salteña' },
      { plato: 'Tortilla de maíz', cantidad: '30 g por tortilla de 12 cm; masa: 2 tazas de harina de maíz y 1½ de agua → 19 tortillas', fuente: 'Maseca' },
      { plato: 'Fideos de ramen', cantidad: 'frescos 142–170 g por persona; secos 90 g', fuente: 'JustOne' },
      { plato: 'Tapas de dumplings', cantidad: '250 g de harina + 130 g de agua → ~30 tapas de 8 cm (~13 g cada una)', fuente: 'CharWok' },
      { plato: 'Tortilla de harina', cantidad: '40–50 g por tortilla', fuente: 'PantryMama' }
    ],
    notas: [
      'El peso de cada tapa de empanada casera es una cuenta propia: (1.000 + 150 + 500 + 20) g ÷ 48 ≈ 35 g.',
      'Maseca redondea la onza (28,35 g) a 30 g, y las 5 pulgadas a 12 cm.',
      'La tortilla de harina sólo tiene una fuente, un blog de EE. UU.',
      'Ñoquis: están en Pasta fresca.'
    ],
    columnaFuente: 'fuente',
    fuentes: [
      { abreviatura: 'Cocineros', nombre: 'Cocineros Argentinos, Tapas de empanadas', url: 'https://cocinerosargentinos.com/masas-saladas/tapas-de-empanadas' },
      {
        abreviatura: 'Salteña', nombre: 'Casa Segal, Tapa de empanadas horno x 12u La Salteña 330 g',
        url: 'https://www.casa-segal.com/producto/tapa-de-empanadas-horno-x-12u-la-saltena-330g/'
      },
      { abreviatura: 'Maseca', nombre: 'Maseca, Tortillas', url: 'https://www.mimaseca.com/es/recetas/tortillas/' },
      { abreviatura: 'JustOne', nombre: 'Just One Cookbook, Ramen Noodles', url: 'https://www.justonecookbook.com/ramen-noodles/' },
      { abreviatura: 'CharWok', nombre: 'CharWok, Chinese dumplings, an ultimate how-to guide', url: 'https://charwok.com/dumpling-guide/' },
      { abreviatura: 'PantryMama', nombre: 'Pantry Mama, Dough weights for common bread shapes', url: 'https://pantrymama.com/dough-weights-for-common-bread-shapes/' }
    ]
  }
} satisfies Record<string, Tabla>;

/** Sin `diametro`, el número se escribe aparte. */
export interface MoldeArgentino {
  id: string; texto: string; forma: 'redondo' | 'rectangular';
  diametro?: number; largo?: number; ancho?: number; alto: number;
  /** De dónde sale este molde, si no es de la fuente de los atajos. */
  fuente?: Fuente
}

/** Masa para un molde: llenado y densidad, y los moldes que se eligen en vez de tipear las medidas (cm). */
export const MOLDE: {
  densidad: Constante; llenado: Constante; atajos: readonly MoldeArgentino[];
  fuenteAtajos: Fuente; notas: readonly string[]
} = {
  densidad: { valor: 0.85, unidad: 'g de masa por ml', fuente: AIB },
  llenado: { valor: 0.6, unidad: 'fracción del molde que se llena', fuente: WILTON },
  atajos: [
    { id: 'tartera', texto: 'Tartera, 4 cm de alto (n.º 10 a 35)', forma: 'redondo', alto: 4 },
    { id: 'bizcochuelo', texto: 'Bizcochuelo, 6 cm de alto (n.º 16 a 32)', forma: 'redondo', alto: 6 },
    { id: 'boda', texto: 'Tortera boda, 8 cm de alto (n.º 12 a 32)', forma: 'redondo', alto: 8 },
    { id: 'boda-alta', texto: 'Tortera boda alta, 10 cm de alto (n.º 12 a 32)', forma: 'redondo', alto: 10 },
    { id: 'pizzera', texto: 'Pizzera, 2 cm de alto (n.º 10 a 35)', forma: 'redondo', alto: 2 },
    { id: 'placa-30x40', texto: 'Placa de 30 × 40 × 2 cm', forma: 'rectangular', largo: 30, ancho: 40, alto: 2 },
    { id: 'placa-35x45', texto: 'Placa de 35 × 45 × 2 cm', forma: 'rectangular', largo: 35, ancho: 45, alto: 2 },
    { id: 'placa-40x60', texto: 'Placa de 40 × 60 × 2 cm', forma: 'rectangular', largo: 40, ancho: 60, alto: 2 },
    { id: 'budinera-kuchen', texto: 'Budinera Kuchen antiadherente (interior 23,3 × 13 × 6 cm)', forma: 'rectangular', largo: 23.3, ancho: 13, alto: 6, fuente: KUCHEN_BAZAR },
    { id: 'budinera-betty-crocker', texto: 'Budinera Betty Crocker de aluminio (interior 25 × 14 × 6 cm)', forma: 'rectangular', largo: 25, ancho: 14, alto: 6, fuente: EMPORIO_BUDIN },
    { id: 'budinera-joy-of-baking', texto: 'Budinera de 8 × 4 × 2½ pulgadas (20 × 10 × 6 cm)', forma: 'rectangular', largo: 20, ancho: 10, alto: 6, fuente: JOY_OF_BAKING }
  ],
  fuenteAtajos: EMPORIO_ALUMINIO,
  notas: [
    'Llenado: de la mitad a dos tercios del molde (Wilton). Densidad de la masa de torta: de 0,8 a 0,9 g/ml (AIB International); se usa el punto medio.',
    'En Argentina el número del molde es el diámetro en cm (Distribuidora Fénix, https://distribuidorafenix.com.ar/producto/molde-torta-n-22-redondo-de-aluminio/). Los altos son los del catálogo de El Nuevo Emporio, que da los números por rango; el número del molde se escribe aparte.',
    'Las placas son del catálogo de El Nuevo Emporio. Las budineras son ejemplos de fabricante: al elegir una, el pie cita la suya.',
    'La capacidad real de un molde de paredes inclinadas es menor que la cuenta: el de 20 × 4 cm de Joy of Baking da 1,24 l en la cuenta y declara 948 ml (77 %); la budinera Kuchen da 1,82 l y declara 1,5 l (83 %). El resultado es aproximado; se puede medir con agua (Goizalde, Moldes y capacidades, https://cocinandocongoizalde.com/2013/04/23/moldes-y-capacidades/).',
    'El savarín lleva tubo: el catálogo no da su diámetro, así que se calcula sólo con las medidas y el diámetro del tubo. Los moldes cuadrados y rectangulares del catálogo no traen el alto.',
    'Un molde desmontable se calcula como redondo, con sus medidas.'
  ]
};

export interface Ingrediente { nombre: string; cantidad: number; cantidadMax?: number; unidad: 'g' | 'ml' | 'u' }
/** Una receta con los ingredientes de UNA porción; la cuenta los multiplica por las porciones. */
export interface RecetaPorPorcion {
  id: string; texto: string; ingredientes: readonly Ingrediente[]; notas: readonly string[];
  advertencia?: string; fuente: Fuente
}

export const PASTA_FRESCA: readonly RecetaPorPorcion[] = [
  {
    id: 'huevo', texto: 'Al huevo',
    ingredientes: [
      { nombre: 'Harina', cantidad: 100, unidad: 'g' },
      { nombre: 'Huevos', cantidad: 1, unidad: 'u' }
    ],
    notas: ['Sal: una pizca.', 'Un huevo por cada cien gramos de harina y por persona.'],
    fuente: INFORMACIBO
  },
  {
    id: 'yemas', texto: 'De yemas',
    ingredientes: [
      { nombre: 'Harina', cantidad: 100, unidad: 'g' },
      { nombre: 'Yemas', cantidad: 3, cantidadMax: 4, unidad: 'u' }
    ],
    notas: ['Sal: una pizca.', 'De 30 a 40 yemas por kilo de harina, a veces más (Casa di Langa).'],
    fuente: CASA_DI_LANGA
  },
  {
    id: 'semola', texto: 'De sémola y agua',
    ingredientes: [
      { nombre: 'Sémola', cantidad: 100, unidad: 'g' },
      { nombre: 'Agua', cantidad: 50, unidad: 'ml' }
    ],
    notas: ['Sal: una pizca.', 'Sémola rimacinada de trigo duro: 400 g con 200 ml de agua (Galbani).'],
    fuente: GALBANI_ORECCHIETTE
  },
  {
    id: 'rellena-carne', texto: 'Rellena de carne',
    ingredientes: [
      { nombre: 'Harina', cantidad: 50, unidad: 'g' },
      { nombre: 'Huevos', cantidad: 0.5, unidad: 'u' },
      { nombre: 'Relleno', cantidad: 50, unidad: 'g' }
    ],
    notas: [
      'Porción de 125 g de pasta rellena cruda, masa y relleno juntos (CSI Piemonte, para ravioles, tortelli y tortellini como plato principal; en caldo son 80 g).',
      'Masa y relleno 60 : 40: Giovanni Rana lo publica así en sus pastas de carne, 62 : 38 (Sfogliavelo Carne, https://shop.giovannirana.it/prodotto/sfogliavelo-carne-confezione-da-250-g) y 64 : 36 (Sfogliagrezza Casarecci, https://shop.giovannirana.it/prodotto/sfogliagrezza-casarecci-confezione-da-250-g).',
      'Harina y huevo son cuenta propia: la masa al huevo (100 g de harina y un huevo de 50 g sin cáscara) pesa unos 150 g. Una pasta casera queda más gruesa que la industrial, con más masa.'
    ],
    fuente: CSI_PIEMONTE
  },
  {
    id: 'rellena-ricota', texto: 'Rellena de ricota o verdura',
    ingredientes: [
      { nombre: 'Harina', cantidad: 100 / 3, unidad: 'g' },
      { nombre: 'Huevos', cantidad: 1 / 3, unidad: 'u' },
      { nombre: 'Relleno', cantidad: 75, unidad: 'g' }
    ],
    notas: [
      'Porción de 125 g de pasta rellena cruda, masa y relleno juntos (CSI Piemonte, para ravioles, tortelli y tortellini como plato principal; en caldo son 80 g).',
      'Masa y relleno 40 : 60: Giovanni Rana, Sfogliavelo Ricotta e Spinaci (https://shop.giovannirana.it/prodotto/sfogliavelo-ricotta-e-spinaci-confezione-da-250-g).',
      'Harina y huevo son cuenta propia: la masa al huevo (100 g de harina y un huevo de 50 g sin cáscara) pesa unos 150 g. Una pasta casera queda más gruesa que la industrial, con más masa.'
    ],
    fuente: CSI_PIEMONTE
  },
  {
    id: 'noquis', texto: 'Ñoquis de papa',
    ingredientes: [
      { nombre: 'Puré de papa', cantidad: 250, unidad: 'g' },
      { nombre: 'Harina', cantidad: 50, unidad: 'g' },
      { nombre: 'Huevos', cantidad: 0.25, cantidadMax: 0.5, unidad: 'u' }
    ],
    notas: [
      'Con queso rallado y sal. La receta rinde 4 porciones con 1 kg de puré, 200 g de harina 0000 o 000 y de 1 a 2 huevos; puré y harina en proporción de 5 a 1.',
      'La fábrica La Juvenil confirma la porción: sus ñoquis de papa, espinaca y calabaza rinden 3 porciones por kilo (Catálogo de productos, https://www.lajuvenilpastas.com.ar/catalogos/catalogo_de_productos.pdf).'
    ],
    fuente: COCINEROS_NOQUIS
  }
];

export const LASANA: {
  cm2PorPorcion: Constante; cm2Base: Constante; masas: readonly RecetaPorPorcion[]; notas: readonly string[]
} = {
  cm2PorPorcion: { valor: 109, unidad: 'cm² de fuente por porción', fuente: BOLOGNA_WELCOME },
  cm2Base: { valor: 875, unidad: 'cm² de la fuente de la receta (25 × 35 cm)', fuente: BOLOGNA_WELCOME },
  masas: [
    {
      id: 'verde', texto: 'Masa verde',
      ingredientes: [
        { nombre: 'Harina 00 (masa)', cantidad: 87.5, unidad: 'g' },
        { nombre: 'Huevos', cantidad: 0.375, unidad: 'u' },
        { nombre: 'Espinaca hervida, escurrida y picada', cantidad: 44, unidad: 'g' },
        { nombre: 'Ragú a la boloñesa', cantidad: 125, unidad: 'g' },
        { nombre: 'Leche entera (bechamel)', cantidad: 125, unidad: 'ml' },
        { nombre: 'Harina 00 (bechamel)', cantidad: 12.5, unidad: 'g' },
        { nombre: 'Manteca (bechamel y capas)', cantidad: 25, unidad: 'g' },
        { nombre: 'Parmesano rallado', cantidad: 50, unidad: 'g' }
      ],
      notas: ['La receta de la Accademia Italiana della Cucina es de 8 personas: 700 g de harina 00, 3 huevos y 350 g de espinaca para 1 kg de masa verde.'],
      fuente: BOLOGNA_WELCOME
    },
    {
      id: 'amarilla', texto: 'Masa amarilla',
      ingredientes: [
        { nombre: 'Harina 00 (masa)', cantidad: 87.5, unidad: 'g' },
        { nombre: 'Huevos', cantidad: 0.875, unidad: 'u' },
        { nombre: 'Ragú a la boloñesa', cantidad: 125, unidad: 'g' },
        { nombre: 'Leche entera (bechamel)', cantidad: 125, unidad: 'ml' },
        { nombre: 'Harina 00 (bechamel)', cantidad: 12.5, unidad: 'g' },
        { nombre: 'Manteca (bechamel y capas)', cantidad: 25, unidad: 'g' },
        { nombre: 'Parmesano rallado', cantidad: 50, unidad: 'g' }
      ],
      notas: ['Un huevo cada 100 g de harina, como la pasta al huevo; sin espinaca.'],
      advertencia: 'La masa amarilla es una cuenta propia con la misma harina y un huevo cada 100 g; la receta de la Accademia es la verde.',
      fuente: BOLOGNA_WELCOME
    }
  ],
  notas: [
    'Receta de la Accademia Italiana della Cucina, delegación de Bologna San Luca, depositada el 4 de julio de 2003 en la Cámara de Comercio de Bolonia: 8 porciones en una fuente rectangular de unos 25 × 35 cm (875 cm²), de 6 cm de alto como mínimo, con al menos 6 capas.',
    'La cuenta escala por superficie y supone el mismo alto, 6 capas en 6 cm. Los ingredientes por porción son los de la receta ÷ 8.',
    'Armado: placas de unos 15 × 10 cm, o un poco más chicas que la fuente, hervidas hasta que suben, pasadas por agua fría y secadas. Fondo con manteca, ragú y bechamel; cada capa con un velo de bechamel, ragú en abundancia, manteca y parmesano; la tapa de masa lleva ragú y bechamel.',
    'Horno a unos 180 °C, de 25 a 30 minutos, y 5 minutos de reposo.',
    'La manteca de la receta (un pan de unos 200 g) va en la bechamel, en cada capa y en las esquinas, y no la reparte: los ~25 g por porción son el total ÷ 8. Relleno sólo de ragú, bechamel y queso rallado, como la receta.'
  ]
};

export const PIZZA: {
  napolitana: readonly { desde: number; hasta: number; gramos: number }[];
  molde: readonly { numero: number; min: number; max: number }[];
  gramosPorCm2Molde: Constante; fuenteNapolitana: Fuente; fuenteMolde: Fuente;
  notas?: readonly string[]
} = {
  napolitana: [
    { desde: 22, hasta: 24, gramos: 200 },
    { desde: 25, hasta: 27, gramos: 240 },
    { desde: 28, hasta: 35, gramos: 280 }
  ],
  molde: [
    { numero: 32, min: 350, max: 380 },
    { numero: 34, min: 380, max: 420 },
    { numero: 36, min: 420, max: 500 }
  ],
  gramosPorCm2Molde: { valor: 0.45, unidad: 'g de masa por cm² de molde', fuente: COMEMELAPIZZA },
  fuenteNapolitana: AVPN,
  fuenteMolde: COMEMELAPIZZA,
  notas: [
    'Napolitana: la AVPN da 200 g para 22–24 cm y 280 g para 28–35 cm. Entre 25 y 27 cm, los 240 g son un punto medio que pusimos nosotros, no de la AVPN.',
    'Al molde: el número del molde es el diámetro en cm. Para los números que no están en la tabla se usa 0,45 g por cm² de molde, una cuenta propia sobre las tres filas.'
  ]
};

export interface PuntoDeAzucar { nombre: string; min: number; max: number | null; prueba: string; usos: string }

/** Puntos del azúcar a nivel del mar, en °C; `max: null` es un solo valor. */
export const AZUCAR: { puntos: readonly PuntoDeAzucar[]; metrosPorGrado: Constante; notas: readonly string[]; fuente: Fuente } = {
  puntos: [
    { nombre: 'Hilo', min: 110, max: 112, prueba: 'forma un hilo líquido que no se hace bolita', usos: 'almíbar' },
    { nombre: 'Bolita blanda', min: 112, max: 116, prueba: 'bolita blanda que se aplasta al sacarla', usos: 'cremas, rellenos, fudge' },
    { nombre: 'Bolita firme', min: 118, max: 120, prueba: 'bolita firme que se aplasta sólo si se aprieta', usos: 'caramelos masticables' },
    { nombre: 'Bolita dura', min: 121, max: 127, prueba: 'bolita dura que mantiene la forma, todavía moldeable', usos: 'caramelos estirados, rellenos y glaseados con claras' },
    { nombre: 'Quebrado blando', min: 132, max: 140, prueba: 'hilos duros que se doblan un poco antes de romperse', usos: 'toffees' },
    { nombre: 'Quebrado duro', min: 149, max: 153, prueba: 'hilos quebradizos que se rompen enseguida', usos: 'crocantes' },
    { nombre: 'Caramelo claro', min: 160, max: null, prueba: '— (se mira el color)', usos: 'caramelo duro' },
    { nombre: 'Caramelo oscuro', min: 170, max: null, prueba: '—', usos: 'caramelo líquido' },
    { nombre: 'Azúcar quemada', min: 177, max: null, prueba: '—', usos: '—' }
  ],
  metrosPorGrado: { valor: 275, unidad: 'm de altitud por °C menos', fuente: CSU_CANDY },
  notas: [
    'Temperaturas a nivel del mar. Bolita blanda a quebrado duro: Colorado State University Extension, Candy making at high elevation.',
    'Hilo, caramelos y azúcar quemada: Wikipedia, Candy making (https://en.wikipedia.org/wiki/Candy_making). La descripción de la prueba en agua fría: My Country Table, How to test candy in cold water (https://mycountrytable.com/test-candy-cold-water/), porque CSU sólo da el nombre de cada prueba.',
    'Ajuste por altitud (CSU Extension, High Altitude Food Preparation, https://www.extension.colostate.edu/wp-content/uploads/2021/11/High-Altitude-PDFv3.pdf): hervir agua y leer el termómetro; restarle a la temperatura de la receta la diferencia entre 100 °C y esa lectura. Sin termómetro probado, 1 °C menos cada 275 m (2 °F cada 1.000 pies).',
    'Punto de ebullición del agua según CSU: nivel del mar 100 °C; 610 m 97,8 °C; 1.524 m 95,0 °C; 2.286 m 92,2 °C; 3.048 m 89,4 °C.',
    'La prueba en agua fría sirve a cualquier altura.'
  ],
  fuente: CSU_CANDY
};

/** Por cada clara: los coeficientes se multiplican por el peso de las claras (1 = el mismo peso). */
export interface TipoDeMerengue {
  id: string; nombre: string;
  /** Todo el azúcar granulado, el del almíbar incluido. */
  azucarPorClara: number;
  impalpablePorClara: number;
  /** Agua por cada parte del azúcar del almíbar. */
  aguaPorAzucarAlmibar: number;
  /** La parte del azúcar que va al almíbar; el resto va a las claras. */
  azucarAlmibarPorClara: number;
  temperatura: string; nota?: string; fuente: Fuente
}

export const MERENGUE: readonly TipoDeMerengue[] = [
  {
    id: 'frances', nombre: 'Francés', azucarPorClara: 1, impalpablePorClara: 0.8,
    aguaPorAzucarAlmibar: 0, azucarAlmibarPorClara: 0, temperatura: 'horno a 120 °C hasta secar',
    fuente: LAROUSSE_FRANCES
  },
  {
    id: 'suizo', nombre: 'Suizo', azucarPorClara: 1.67, impalpablePorClara: 0,
    aguaPorAzucarAlmibar: 0, azucarAlmibarPorClara: 0, temperatura: 'baño maría hasta 71 °C',
    nota: 'Larousse lo lleva sólo hasta 45 °C. Los 71 °C (160 °F) son la temperatura de seguridad para el huevo que da la FDA (https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety), y con el azúcar la clara no se corta (Baker Bettie, https://bakerbettie.com/how-to-make-swiss-meringue/).',
    fuente: LAROUSSE_SUIZO
  },
  {
    id: 'italiano', nombre: 'Italiano', azucarPorClara: 1.33, impalpablePorClara: 0,
    aguaPorAzucarAlmibar: 0.4, azucarAlmibarPorClara: 1, temperatura: 'almíbar a 118–120 °C, punto bolita blanda',
    nota: 'El resto del azúcar, 0,33 por cada parte de claras, va a las claras. Larousse lleva el almíbar a 120 °C; Cocineros Argentinos, a 118 °C (https://cocinerosargentinos.com/pasteleria/lo-si-y-los-no-del-merengue).',
    fuente: LAROUSSE_ITALIANO
  }
];
