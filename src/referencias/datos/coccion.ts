/**
 * Arroz, granos, legumbres, pasta, verduras y caldo: sólo datos. Cada tabla y
 * cada constante dicen de dónde salen.
 *
 * Procedencia: product-design/research/herramientas/verificacion-basicos-de-coccion.md
 * Para corregir un número, editá su fila.
 * Para sumar una fila, respetá las columnas de su tabla. El orden en que se
 * muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { Constante, Fuente, Tabla } from '../tipos.js';
import { TAZA_METRICA } from './conversor.js';

const USA_RICE: Fuente = { nombre: 'USA Rice Federation, How To Cook Rice', url: 'https://www.usarice.com/thinkrice/how-to/how-to-cook-rice' };
const FAGOR: Fuente = { nombre: 'Fagor', url: 'https://fagorcookware.com/wp-content/uploads/2022/10/IM_OP_FUTURE.pdf' };
const BARILLA_ITALIA: Fuente = { nombre: 'Barilla', url: 'https://www.barilla.com/it-it/prodotti/pasta/i-classici/penne-rigate' };
const IGI: Fuente = { nombre: 'IGI', url: 'https://www.igi-la.com/blog/fondos-de-cocina-guia/' };

export const TABLAS_COCCION = {
  'arroz-presion': {
    id: 'arroz-presion', titulo: 'Arroz en olla a presión',
    columnas: [
      { id: 'arroz', nombre: 'Arroz' },
      { id: 'proporcion', nombre: 'Arroz : agua' },
      { id: 'presion', nombre: 'Presión estándar (100 kPa)' }
    ],
    filas: [
      { arroz: 'Grano corto o para sushi', proporcion: '300 g : 400 ml', presion: '4–6 min' },
      { arroz: 'Integral', proporcion: '300 g : 800 ml', presion: '12–16 min' },
      { arroz: 'Basmati', proporcion: '300 g : 500 ml', presion: '2–4 min' },
      { arroz: 'Arbóreo o carnaroli', proporcion: '300 g : 550 ml', presion: '4–6 min' },
      { arroz: 'Bomba', proporcion: '300 g : 550 ml', presion: '4–6 min' }
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
      { id: 'rinde', nombre: 'Rinde', unidad: 'partes cocidas' }
    ],
    filas: [
      { grano: 'Quinoa', liquido: '2', tiempo: '12–15 min', rinde: '3' },
      { grano: 'Trigo burgol', liquido: '2', tiempo: '10–12 min', rinde: '3' },
      { grano: 'Polenta (harina de maíz común, no instantánea)', liquido: '4', tiempo: '25–30 min', rinde: '2½' },
      { grano: 'Avena cortada', liquido: '4', tiempo: '30 min', rinde: '3' },
      { grano: 'Avena arrollada', liquido: '1¾–2', tiempo: '5 min', rinde: '—' },
      { grano: 'Cebada pelada', liquido: '3', tiempo: '45–60 min', rinde: '3½' },
      { grano: 'Mijo pelado', liquido: '2½', tiempo: '25–35 min', rinde: '4' },
      { grano: 'Trigo sarraceno', liquido: '2', tiempo: '20 min', rinde: '4' },
      { grano: 'Amaranto', liquido: '2', tiempo: '15–20 min', rinde: '2½' },
      { grano: 'Farro', liquido: '2½', tiempo: '25–40 min', rinde: '3' },
      { grano: 'Cuscús', liquido: '1¼', tiempo: '0 min (reposo: 5 min)', rinde: '—' },
      { grano: 'Trigo en grano', liquido: '4', tiempo: 'remojo de una noche, y 45–60 min', rinde: '2½' }
    ],
    notas: [
      'Por cada parte de grano, en volumen; sirve con cualquier taza. Salvo la avena arrollada y el cuscús, el tiempo es a fuego bajo, tapado, una vez que rompe el hervor.',
      'El tiempo varía con la edad del grano, la variedad y la olla.'
    ],
    fuentes: [
      { nombre: 'Whole Grains Council', url: 'https://wholegrainscouncil.org/recipes/cooking-whole-grains' },
      { nombre: 'Quaker', url: 'https://www.quakeroats.com/products/hot-cereals/old-fashioned-oats' },
      { nombre: "Bob's Red Mill", url: 'https://www.bobsredmill.com/recipes/how-to-make/basic-preparation-instructions-for-golden-couscous' }
    ]
  },

  legumbres: {
    id: 'legumbres', titulo: 'Legumbres',
    columnas: [
      { id: 'legumbre', nombre: 'Legumbre' },
      { id: 'remojo', nombre: 'Remojo' },
      { id: 'agua', nombre: 'Agua', unidad: 'partes' },
      { id: 'olla', nombre: 'Olla', unidad: 'min' },
      { id: 'rinde', nombre: 'Rinde', unidad: 'tazas cocidas por taza seca' }
    ],
    filas: [
      { legumbre: 'Garbanzos', remojo: 'sí', agua: '2', olla: '90–120', rinde: '2' },
      { legumbre: 'Lentejas', remojo: 'no', agua: '2½', olla: '15–20', rinde: '2½' },
      { legumbre: 'Arvejas secas partidas', remojo: 'no', agua: '2', olla: '30–40', rinde: '2' },
      { legumbre: 'Arvejas secas enteras', remojo: 'sí', agua: '2', olla: '35–40', rinde: '2' },
      { legumbre: 'Porotos negros', remojo: 'sí', agua: '2', olla: '60–90', rinde: '2–2½' },
      { legumbre: 'Porotos alubia', remojo: 'sí', agua: '2', olla: '45–60', rinde: '2–2½' },
      { legumbre: 'Porotos alubia chicos (navy)', remojo: 'sí', agua: '2', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos colorados', remojo: 'sí', agua: '2', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos pintos', remojo: 'sí', agua: '2', olla: '90–120', rinde: '2–2½' },
      { legumbre: 'Porotos rosados', remojo: 'sí', agua: '2', olla: '60', rinde: '2–2½' },
      { legumbre: 'Porotos cranberry (borlotti)', remojo: 'sí', agua: '2', olla: '45–60', rinde: '2–2½' }
    ],
    notas: [
      'Remojo: 6–8 h o toda la noche, en la heladera, con 5 partes de agua por parte de legumbre.',
      'Siempre se descarta el agua del remojo y se enjuaga. Si el remojo pasa de 4 horas, va a la heladera.'
    ],
    fuente: { nombre: 'NDSU Extension', url: 'https://www.ndsu.edu/agriculture/sites/default/files/2024-01/fn2068.pdf' }
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
      'El tiempo se cuenta desde que la válvula larga vapor con fuerza. Llenar la olla hasta la mitad como máximo y poner líquido hasta cubrir.'
    ],
    fuente: FAGOR
  },

  'pasta-tiempos': {
    id: 'pasta-tiempos', titulo: 'Tiempo de pasta seca',
    columnas: [
      { id: 'formato', nombre: 'Formato' },
      { id: 'tiempo', nombre: 'Al dente', minutos: true }
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
    notas: ['Manda el tiempo del paquete.'],
    fuentes: []
  },

  verduras: {
    id: 'verduras', titulo: 'Verduras al vapor y hervidas',
    columnas: [
      { id: 'verdura', nombre: 'Verdura' },
      { id: 'vapor', nombre: 'Vapor', unidad: 'min' },
      { id: 'hervida', nombre: 'Hervida', unidad: 'min' }
    ],
    filas: [
      { verdura: 'Alcaucil (alcachofa) entero', vapor: '30–40', hervida: '25–40' },
      { verdura: 'Corazones de alcaucil', vapor: '10–15', hervida: '10–15' },
      { verdura: 'Arvejas', vapor: '3–5', hervida: '8–12' },
      { verdura: 'Berenjena', vapor: '15–20', hervida: '10–15' },
      { verdura: 'Remolacha (betarraga)', vapor: '40–60', hervida: '30–60' },
      { verdura: 'Brócoli entero', vapor: '8–15', hervida: '5–10' },
      { verdura: 'Brócoli en ramitos', vapor: '5–6', hervida: '4–5' },
      { verdura: 'Coliflor entera', vapor: '15–20', hervida: '10–15' },
      { verdura: 'Coliflor en ramitos', vapor: '6–10', hervida: '5–8' },
      { verdura: 'Champiñones', vapor: '4–5', hervida: '3–4' },
      { verdura: 'Espinaca', vapor: '5–6', hervida: '2–5' },
      { verdura: 'Espárragos', vapor: '8–10', hervida: '5–12' },
      { verdura: 'Morrón (pimentón)', vapor: '2–4', hervida: '4–5' },
      { verdura: 'Chauchas (porotos verdes)', vapor: '5–15', hervida: '10–20' },
      { verdura: 'Papa mediana', vapor: '15–20, en cuartos', hervida: '30–40, entera' },
      { verdura: 'Repollo', vapor: '6–9', hervida: '10–15' },
      { verdura: 'Repollitos de Bruselas', vapor: '6–12', hervida: '5–10' },
      { verdura: 'Zanahoria entera', vapor: '10–15', hervida: '15–20' },
      { verdura: 'Zanahoria en rodajas', vapor: '4–5', hervida: '5–10' },
      { verdura: 'Zapallo', vapor: '5–10', hervida: '5–10' },
      { verdura: 'Zapallito (zapallo italiano)', vapor: '5–10', hervida: '5–10' }
    ],
    notas: [
      'Los tiempos son para ½ kg de verdura.',
      'Hervidas: en agua que apenas las cubra, que esté hirviendo y con poca sal.'
    ],
    fuentes: [
      { nombre: 'Clínica Las Condes', url: 'https://www.clinicalascondes.cl/CENTROS-Y-ESPECIALIDADES/Centros/Centro-de-Nutricion/Nutricion/Coccion-de-Verduras' },
      { nombre: 'Universidad de Kentucky', url: 'https://publications.mgcafe.uky.edu/sites/publications.ca.uky.edu/files/FSHE12.pdf' }
    ]
  },

  blanqueado: {
    id: 'blanqueado', titulo: 'Blanqueado',
    variantes: { nombre: 'Método', opciones: [{ valor: 'agua', texto: 'Al agua' }, { valor: 'vapor', texto: 'Al vapor' }] },
    columnas: [
      { id: 'verdura', nombre: 'Verdura' },
      { id: 'corte', nombre: 'Tamaño o corte' },
      { id: 'agua', nombre: 'Al agua', unidad: 'min', minutos: true, variante: 'agua' },
      { id: 'vapor', nombre: 'Al vapor', unidad: 'min', minutos: true, variante: 'vapor' }
    ],
    filas: [
      { verdura: 'Espárragos', corte: 'finos', agua: '2', vapor: '3' },
      { verdura: 'Espárragos', corte: 'medianos', agua: '3', vapor: '4½' },
      { verdura: 'Espárragos', corte: 'gruesos', agua: '4', vapor: '6' },
      { verdura: 'Chauchas', corte: '—', agua: '3', vapor: '4½' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'chicos', agua: '2', vapor: '3' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'medianos', agua: '3', vapor: '4½' },
      { verdura: 'Habas, porotos lima o manteca', corte: 'grandes', agua: '4', vapor: '6' },
      { verdura: 'Brócoli', corte: 'ramitos de 4 cm', agua: '3', vapor: '5' },
      { verdura: 'Repollitos de Bruselas', corte: 'chicos', agua: '3', vapor: '4½' },
      { verdura: 'Repollitos de Bruselas', corte: 'medianos', agua: '4', vapor: '6' },
      { verdura: 'Repollitos de Bruselas', corte: 'grandes', agua: '5', vapor: '7½' },
      { verdura: 'Repollo o repollo chino', corte: 'cortado en tiras', agua: '1½', vapor: '2¼' },
      { verdura: 'Zanahorias', corte: 'chicas, enteras', agua: '5', vapor: '7½' },
      { verdura: 'Zanahorias', corte: 'en cubos, rodajas o tiras', agua: '2', vapor: '3' },
      { verdura: 'Coliflor', corte: 'ramitos de 2,5 cm', agua: '3', vapor: '4½' },
      { verdura: 'Apio', corte: '—', agua: '3', vapor: '4½' },
      { verdura: 'Choclo en mazorca', corte: 'chico', agua: '7', vapor: '10½' },
      { verdura: 'Choclo en mazorca', corte: 'mediano', agua: '9', vapor: '13½' },
      { verdura: 'Choclo en mazorca', corte: 'grande', agua: '11', vapor: '16½' },
      { verdura: 'Choclo en grano', corte: '—', agua: '4', vapor: '6' },
      { verdura: 'Berenjena', corte: '—', agua: '4', vapor: '6' },
      { verdura: 'Hojas verdes (acelga, espinaca y otras)', corte: '—', agua: '2', vapor: '3' },
      { verdura: 'Hojas de berza (collards)', corte: '—', agua: '3', vapor: '4½' },
      { verdura: 'Hongos', corte: 'enteros', agua: '—', vapor: '5' },
      { verdura: 'Hongos', corte: 'botones o en cuartos', agua: '—', vapor: '3½' },
      { verdura: 'Hongos', corte: 'en láminas', agua: '—', vapor: '3' },
      { verdura: 'Cebolla', corte: 'hasta que se caliente el centro', agua: '3–7', vapor: '4½–10½' },
      { verdura: 'Cebolla', corte: 'en aros: 10–15 segundos', agua: '—', vapor: '—' },
      { verdura: 'Arvejas', corte: '—', agua: '1½', vapor: '2¼' },
      { verdura: 'Arvejas chinas (de vaina comestible)', corte: '—', agua: '1½–3', vapor: '2¼–4½' },
      { verdura: 'Morrón', corte: 'mitades', agua: '3', vapor: '4½' },
      { verdura: 'Morrón', corte: 'tiras o aros', agua: '2', vapor: '3' },
      { verdura: 'Papas nuevas', corte: '—', agua: '3–5', vapor: '4½–7½' },
      { verdura: 'Zapallito', corte: '—', agua: '3', vapor: '4½' },
      { verdura: 'Nabo o chirivía', corte: 'cubos', agua: '2', vapor: '3' },
      { verdura: 'Remolacha, zapallo, calabaza, batata', corte: '—', agua: 'no se blanquean: se cocinan', vapor: 'no se blanquean: se cocinan' }
    ],
    notas: [
      'Al agua: en agua hirviendo, a nivel del mar, contando desde que el agua vuelve a hervir.',
      'Agua: 8,3 l por kg de verdura preparada.',
      'Al vapor: 1½ veces el tiempo al agua; la canasta va a 7,5 cm o más del fondo, y se cuenta desde que se pone la tapa.',
      'Enfriado: en agua a 16 °C o menos, cambiándola seguido o con agua helada corriendo; hace falta más o menos 1 kg de hielo por kg de verdura. El enfriado dura lo mismo que el blanqueado.'
    ],
    fuente: { nombre: 'NCHFP', url: 'https://nchfp.uga.edu/how/freeze/freeze-general-information/blanching-times/' }
  }
} satisfies Record<string, Tabla>;

/**
 * `partesVolumen`: tazas de agua por taza de arroz. `aguaPorGramo`: ml de agua
 * por gramo de arroz crudo, derivada de las partes y de las densidades de
 * USDA; el parboil no la tiene.
 */
export interface VariedadDeArroz { id: string; nombre: string; partesVolumen: number; aguaPorGramo: number | null; tiempo: string }

/** Arroz por absorción en olla, con la taza en que se mide. */
export const ARROZ: { variedades: readonly VariedadDeArroz[]; taza: Constante; notas: readonly string[]; fuente: Fuente } = {
  variedades: [
    { id: 'largo-fino', nombre: 'Largo fino', partesVolumen: 2, aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'doble-carolina', nombre: 'Doble carolina (largo ancho)', partesVolumen: 2, aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'mediano', nombre: 'Grano mediano', partesVolumen: 1.5, aguaPorGramo: 1.85, tiempo: '15–18 min' },
    { id: 'corto', nombre: 'Grano corto o para sushi', partesVolumen: 1.25, aguaPorGramo: 1.5, tiempo: '15–18 min' },
    { id: 'integral', nombre: 'Integral, grano largo o mediano (y yamaní)', partesVolumen: 2.25, aguaPorGramo: 2.9, tiempo: '40–45 min' },
    { id: 'parboil', nombre: 'Parboil', partesVolumen: 2.25, aguaPorGramo: null, tiempo: '20–30 min' },
    { id: 'parboil-integral', nombre: 'Parboil integral', partesVolumen: 2.25, aguaPorGramo: null, tiempo: '25 min' },
    { id: 'jazmin', nombre: 'Jazmín', partesVolumen: 2, aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'basmati', nombre: 'Basmati', partesVolumen: 2, aguaPorGramo: 2.6, tiempo: '15–18 min' },
    { id: 'arborio', nombre: 'Arbóreo o carnaroli', partesVolumen: 4, aguaPorGramo: 4.9, tiempo: '20–30 min' },
    { id: 'salvaje', nombre: 'Salvaje', partesVolumen: 3, aguaPorGramo: 4.5, tiempo: '40–50 min' }
  ],
  taza: TAZA_METRICA,
  notas: [
    'Hervir el agua con el arroz, bajar a fuego mínimo, tapar y no revolver. Si después del tiempo el arroz no está tierno o queda líquido, 2 a 4 minutos más.'
  ],
  fuente: USA_RICE
};

export const AGUA_SAL_PASTA: { litrosPor100g: Constante; salPorLitro: Constante } = {
  litrosPor100g: { valor: 1, unidad: 'l de agua por 100 g de pasta', fuente: BARILLA_ITALIA },
  salPorLitro: { valor: 7, unidad: 'g de sal por litro de agua', fuente: BARILLA_ITALIA }
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
