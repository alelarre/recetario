/**
 * Masas y dulces: sólo datos. Cada tabla, cada constante y cada receta dicen de dónde salen.
 *
 * Procedencia: product-design/research/herramientas/verificacion-masas-y-dulces.md
 * (y su «Agregado: pastas rellenas y ñoquis»).
 * Para corregir un número, editá su fila.
 * Los ingredientes de las recetas son por porción: la cuenta los multiplica.
 * El orden en que se muestran las fichas está en `src/referencias/indice.ts`.
 */
import type { Constante, Fuente, Tabla } from '../tipos.js';

const WILTON: Fuente = { nombre: 'Wilton, Cake Baking & Serving Guide', url: 'https://wilton.com/baking-inspiration/cake-baking-serving-guide/' };
const BAKERPEDIA: Fuente = { nombre: 'BAKERpedia', url: 'https://bakerpedia.com/processes/specific-gravity-cakes/' };
const AIB: Fuente = {
  nombre: 'AIB International, Food First, Q&A: Is taking a specific gravity measurement necessary for cake batter during or after mixing',
  url: 'https://blog.aibinternational.com/en/food-first-blog/postid/948/qa-is-taking-a-specific-gravity-measurement-necessary-for-cake-batter-during-or-after-mixing'
};
const EMPORIO_ALUMINIO: Fuente = { nombre: 'El Nuevo Emporio, Artículos de aluminio', url: 'https://elnuevoemporio.com.ar/productos-reposteria-aluminio.html' };
const AVPN: Fuente = { nombre: 'AVPN', url: 'https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf' };
const RITA_GALLINA: Fuente = { nombre: 'Rita Gallina', url: 'https://www.artebiancaconrita.com/post/pizza-tonda-romana-croccante-ricetta-professionale-e-tecnica-completa' };
const COCINEROS_MEDIA_MASA: Fuente = { nombre: 'Cocineros Argentinos', url: 'https://cocinerosargentinos.com/pizzas/pizza-a-la-piedra-y-media-masa' };
const CUKIT: Fuente = { nombre: 'Cuk-it', url: 'https://cuk-it.com/recetas/pizza-al-molde/' };
const CSU_CANDY: Fuente = { nombre: 'Colorado State University Extension', url: 'https://foodsmartcolorado.colostate.edu/recipes/cooking-and-baking/candy-making-at-high-elevation' };
const LAROUSSE_FRANCES: Fuente = { nombre: 'Larousse Cocina', url: 'https://laroussecocina.mx/receta/merengue-frances/' };
const LAROUSSE_SUIZO: Fuente = { nombre: 'Larousse Cocina', url: 'https://laroussecocina.mx/receta/merengue-suizo/' };
const LAROUSSE_ITALIANO: Fuente = { nombre: 'Larousse Cocina', url: 'https://laroussecocina.mx/receta/merengue-italiano/' };

export const TABLAS_MASAS = {
  piezas: {
    id: 'piezas', titulo: 'Masa por pieza',
    columnas: [
      { id: 'pieza', nombre: 'Pieza' },
      { id: 'gramos', nombre: 'Masa cruda', unidad: 'g' }
    ],
    filas: [
      { pieza: 'Pan de hamburguesa', gramos: '80' },
      { pieza: 'Pan de hamburguesa artesanal', gramos: '75' },
      { pieza: 'Pan de pancho', gramos: '40' },
      { pieza: 'Pan de Viena', gramos: '100' },
      { pieza: 'Pan de pebete', gramos: '100' },
      { pieza: 'Pan flauta', gramos: '100' },
      { pieza: 'Pan francés', gramos: '120' },
      { pieza: 'Baguette', gramos: '250' },
      { pieza: 'Bagel', gramos: '85' },
      { pieza: 'Grisín', gramos: '30' },
      { pieza: 'Medialuna de manteca', gramos: '50' },
      { pieza: 'Factura', gramos: '50' },
      { pieza: 'Tapa de empanada casera', gramos: '35' },
      { pieza: 'Tapa de empanada comprada', gramos: '27,5' },
      { pieza: 'Tortilla de maíz de 12 cm', gramos: '30' },
      { pieza: 'Tortilla de harina', gramos: '40–50' },
      { pieza: 'Tapa de dumpling de 8 cm', gramos: '13' },
      { pieza: 'Pan de molde tipo artesanal', gramos: '380' },
      { pieza: 'Pan de molde lacteado', gramos: '400' },
      { pieza: 'Pan de campo', gramos: '500' },
      { pieza: 'Pan dulce de 500 g', gramos: '530' }
    ],
    notas: ['Peso de la masa cruda al dividir.'],
    fuentes: []
  },

  'pasta-porcion': {
    id: 'pasta-porcion', titulo: 'Pasta: cuánto por persona',
    columnas: [
      { id: 'pasta', nombre: 'Pasta' },
      { id: 'porPersona', nombre: 'Por persona' }
    ],
    filas: [
      { pasta: 'Seca (de paquete)', porPersona: '85–100 g; en caldo, 40 g' },
      { pasta: 'Fresca sin relleno (tallarines, fettuccine)', porPersona: '200 g' },
      { pasta: 'Lasaña y canelones', porPersona: '200 g de pasta' },
      { pasta: 'Ravioles', porPersona: '48 (una caja)' },
      { pasta: 'Raviolones', porPersona: '16' },
      { pasta: 'Sorrentinos', porPersona: '5 o 6' },
      { pasta: 'Agnolotis', porPersona: '5 o 6' },
      { pasta: 'Capeletis', porPersona: '250 g' },
      { pasta: 'Tortelettis', porPersona: '200 g' },
      { pasta: 'Ñoquis', porPersona: '300 g' }
    ],
    notas: ['Pasta cruda.'],
    fuentes: [
      { nombre: 'Garofalo', url: 'https://www.pasta-garofalo.com/es/news/cuantos-gramos-de-pasta-seca-por-persona/' },
      { nombre: 'CSI Piemonte', url: 'https://www.csipiemonte.it/sites/default/files/inline_download/gare/archivio/2017/01_2017/All_5_Tabella_Grammature_e_Porzioni.pdf' },
      { nombre: 'La Juvenil', url: 'https://www.lajuvenilpastas.com.ar/catalogos/catalogo_de_productos.pdf' },
      { nombre: 'Dicomo', url: 'https://www.pastadicomo.com/post/guia-simple-para-no-quedarse-corto-cuanta-pasta-fresca-calcular-por-persona' }
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

/** Un tipo de masa que se vuelca en el molde, con su densidad. */
export interface MasaDeMolde { id: string; texto: string; densidad: Constante }

/** Masa para un molde: el llenado, la densidad de cada masa, y los moldes que se eligen en vez de tipear las medidas (cm). */
export const MOLDE: {
  masas: readonly MasaDeMolde[]; llenado: Constante; atajos: readonly MoldeArgentino[];
  fuenteAtajos: Fuente; notas: readonly string[]
} = {
  masas: [
    { id: 'torta', texto: 'Torta o budín', densidad: { valor: 0.85, unidad: 'g de masa por ml', fuente: AIB } },
    { id: 'bizcochuelo', texto: 'Bizcochuelo o pionono', densidad: { valor: 0.5, unidad: 'g de masa por ml', fuente: BAKERPEDIA } }
  ],
  llenado: { valor: 0.6, unidad: 'fracción del molde que se llena', fuente: WILTON },
  atajos: [
    { id: 'bizcochuelo', texto: 'Bizcochuelo, 6 cm de alto (n.º 16 a 32)', forma: 'redondo', alto: 6 },
    { id: 'boda', texto: 'Tortera boda, 8 cm de alto (n.º 12 a 32)', forma: 'redondo', alto: 8 },
    { id: 'boda-alta', texto: 'Tortera boda alta, 10 cm de alto (n.º 12 a 32)', forma: 'redondo', alto: 10 },
    { id: 'placa-30x40', texto: 'Placa de 30 × 40 × 2 cm', forma: 'rectangular', largo: 30, ancho: 40, alto: 2 },
    { id: 'placa-35x45', texto: 'Placa de 35 × 45 × 2 cm', forma: 'rectangular', largo: 35, ancho: 45, alto: 2 },
    { id: 'placa-40x60', texto: 'Placa de 40 × 60 × 2 cm', forma: 'rectangular', largo: 40, ancho: 60, alto: 2 }
  ],
  fuenteAtajos: EMPORIO_ALUMINIO,
  notas: []
};

/**
 * El bollo de pizza: la napolitana por la tabla de la AVPN; la a la piedra y
 * la media masa, por gramos de masa por cm² de pizza.
 */
export const PIZZA: {
  napolitana: readonly { desde: number; hasta: number; gramos: number }[];
  fuenteNapolitana: Fuente;
  piedraPorCm2: Constante;
  mediaMasaMinPorCm2: Constante; mediaMasaMaxPorCm2: Constante
} = {
  napolitana: [
    { desde: 22, hasta: 24, gramos: 200 },
    { desde: 25, hasta: 27, gramos: 240 },
    { desde: 28, hasta: 35, gramos: 280 }
  ],
  fuenteNapolitana: AVPN,
  piedraPorCm2: { valor: 0.2, unidad: 'g de masa por cm² de pizza', fuente: RITA_GALLINA },
  mediaMasaMinPorCm2: { valor: 0.85, unidad: 'g de masa por cm² de molde', fuente: COCINEROS_MEDIA_MASA },
  mediaMasaMaxPorCm2: { valor: 0.9, unidad: 'g de masa por cm² de molde', fuente: CUKIT }
};

export interface PuntoDeAzucar { nombre: string; min: number; max: number | null; prueba: string; usos: string }

/** Puntos del azúcar a nivel del mar, en °C; `max: null` es un solo valor. */
/** Los puntos del azúcar, sin fuente a la vista; `metrosPorGrado` guarda la suya. */
export const AZUCAR: { puntos: readonly PuntoDeAzucar[]; metrosPorGrado: Constante; notas: readonly string[] } = {
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
  notas: []
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
    fuente: LAROUSSE_SUIZO
  },
  {
    id: 'italiano', nombre: 'Italiano', azucarPorClara: 1.33, impalpablePorClara: 0,
    aguaPorAzucarAlmibar: 0.4, azucarAlmibarPorClara: 1, temperatura: 'almíbar a 120 °C',
    fuente: LAROUSSE_ITALIANO
  }
];
