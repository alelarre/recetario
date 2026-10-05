/**
 * Conversor: sólo datos. Cada sistema, cada unidad y cada ingrediente dicen de dónde salen.
 *
 * Procedencia: product-design/research/herramientas/verificacion-conversor.md
 * Para corregir un número, editá su línea y la fecha `consultada` de la fuente.
 * Un ingrediente guarda la medida tal como la da su fuente («½ taza de EE. UU.
 * = 113 g»); los gramos por ml los saca la cuenta. Para sumar uno, escribí su
 * medida así, con su grupo y su fuente.
 */
import type { Constante, FuenteAbreviada, IngredienteConvertible, Sistema } from '../tipos.js';

const consultada = '2026-10-04';

const HC: FuenteAbreviada = {
  abreviatura: 'HC', nombre: 'Health Canada, Measure ingredients like a pro',
  url: 'https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/cooking-skills/measure-ingredients-pro.html', consultada
};
const PRH: FuenteAbreviada = {
  abreviatura: 'PRH', nombre: 'Penguin Australia, Bake with Brooki: conversiones',
  url: 'https://cdn2.penguin.com.au/content/resources/bake-with-brooki-conversions-page.pdf', consultada
};
const DEL: FuenteAbreviada = {
  abreviatura: 'DEL', nombre: 'delicious. magazine, US to UK cups to grams conversion guide',
  url: 'https://www.deliciousmagazine.co.uk/cups-to-grams-conversion-charts/', consultada
};
const HCU: FuenteAbreviada = {
  abreviatura: 'HCU', nombre: 'Hacé Cuentas, Conversor de tazas a gramos',
  url: 'https://hacecuentas.com/conversor-tazas-gramos-cocina-recetas', consultada
};
const NIST: FuenteAbreviada = {
  abreviatura: 'NIST', nombre: 'NIST Handbook 44 (2026), Apéndice C',
  url: 'https://www.nist.gov/system/files/documents/2025/12/30/appc-26-HB44-20251222.pdf', consultada
};
const WJA: FuenteAbreviada = {
  abreviatura: 'WJA', nombre: 'Wikipedia en japonés, 計量カップ',
  url: 'https://ja.wikipedia.org/wiki/%E8%A8%88%E9%87%8F%E3%82%AB%E3%83%83%E3%83%97', consultada
};
const TOH: FuenteAbreviada = {
  abreviatura: 'TOH', nombre: 'Taste of Home, What\'s the Difference Between a Pinch, a Dash and a Shake?',
  url: 'https://www.tasteofhome.com/article/whats-the-difference-between-a-pinch-a-dash-and-a-shake/', consultada
};
const LOL: FuenteAbreviada = {
  abreviatura: 'LOL', nombre: 'Land O\'Lakes, Butter Conversion',
  url: 'https://www.landolakes.com/kitchen-reference/measurements-abbreviations/butter-conversion-converter/', consultada
};
const KA: FuenteAbreviada = {
  abreviatura: 'KA', nombre: 'King Arthur Baking, Ingredient Weight Chart',
  url: 'https://www.kingarthurbaking.com/learn/ingredient-weight-chart', consultada
};
/** USDA FoodData Central, SR Legacy: una ficha por alimento. */
const usda = (id: number, producto: string): FuenteAbreviada => ({
  abreviatura: 'USDA', nombre: `USDA FoodData Central, ${producto}`,
  url: `https://fdc.nal.usda.gov/food-details/${id}/portions`, consultada
});

export const SISTEMAS: readonly Sistema[] = [
  { id: 'metrica', nombre: 'Métrica (Argentina, Reino Unido, Canadá, Nueva Zelanda)', taza: 250, cucharada: 15, cucharadita: 5,
    notas: [
      'Argentina no tiene una norma de cocina: se usa la métrica, que es como vienen marcadas las tazas medidoras que se venden acá.',
      'Las etiquetas argentinas usan otra medida casera (taza de té 200 ml, cuchara de sopa 10 ml): una porción de etiqueta no se lee con esta tabla.'
    ],
    fuentes: [HC, PRH, DEL, HCU] },
  { id: 'australia', nombre: 'Australia', taza: 250, cucharada: 20, cucharadita: 5, fuentes: [PRH] },
  // 8 fl oz de NIST; la cucharada es ½ fl oz y la cucharadita, un tercio de cucharada.
  { id: 'eeuu', nombre: 'EE. UU.', taza: 236.5882, cucharada: 14.7868, cucharadita: 4.9289,
    notas: ['Las etiquetas de EE. UU. redondean la taza a 240 ml; las recetas usan la de 8 fl oz.'],
    fuentes: [NIST] },
  { id: 'japon', nombre: 'Japón', taza: 200, cucharada: 15, cucharadita: 5,
    notas: ['La taza del arroz (1 gō) es de 180 ml.'], fuentes: [WJA] }
];

/** Las unidades que no dependen del sistema. Las informales son de EE. UU.: la fracción de su cucharadita. */
export const UNIDADES = {
  flOz: { valor: 29.5735, unidad: 'ml', fuente: NIST },
  oz: { valor: 28.3495, unidad: 'g', fuente: NIST },
  lb: { valor: 453.59237, unidad: 'g', fuente: NIST },
  dash: { valor: 1 / 8, unidad: 'cdita EE. UU.', fuente: TOH },
  pinch: { valor: 1 / 16, unidad: 'cdita EE. UU.', fuente: TOH },
  smidgen: { valor: 1 / 32, unidad: 'cdita EE. UU.', fuente: TOH },
  stick: { valor: 0.5, unidad: 'taza EE. UU.', fuente: LOL }
} satisfies Record<string, Constante>;

/** El stick es una medida de manteca. */
export const INGREDIENTE_DEL_STICK = 'manteca';

const HARINAS = 'Harinas y almidones';
const AZUCARES = 'Azúcares y dulces';
const GRASAS = 'Grasas y lácteos';
const OTROS = 'Otros';
const LEUDANTES = 'Leudantes y sal';

const taza = (cantidad: number, gramos: number) => ({ cantidad, unidad: 'taza', sistema: 'eeuu', gramos }) as const;
const cda = (cantidad: number, gramos: number) => ({ cantidad, unidad: 'cucharada', sistema: 'eeuu', gramos }) as const;
const cdita = (cantidad: number, gramos: number) => ({ cantidad, unidad: 'cucharadita', sistema: 'eeuu', gramos }) as const;

export const INGREDIENTES: readonly IngredienteConvertible[] = [
  { id: 'harina-000', nombre: 'Harina 000', grupo: HARINAS, medida: taza(1, 120), fuente: KA },
  { id: 'harina-0000', nombre: 'Harina 0000', grupo: HARINAS, medida: taza(1, 120), fuente: KA },
  { id: 'harina-leudante', nombre: 'Harina leudante', grupo: HARINAS, medida: taza(1, 113), fuente: KA },
  { id: 'harina-integral', nombre: 'Harina integral', grupo: HARINAS, medida: taza(1, 113), fuente: KA },
  { id: 'polenta', nombre: 'Harina de maíz (polenta)', grupo: HARINAS, medida: taza(1, 163), fuente: KA },
  { id: 'maicena', nombre: 'Almidón de maíz (maicena)', grupo: HARINAS, medida: taza(1 / 4, 28), fuente: KA },
  { id: 'fecula-mandioca', nombre: 'Fécula de mandioca', grupo: HARINAS, medida: taza(1, 113), fuente: KA },
  { id: 'harina-arroz', nombre: 'Harina de arroz', grupo: HARINAS, medida: taza(1, 142), fuente: KA },
  { id: 'avena', nombre: 'Avena arrollada', grupo: HARINAS, medida: taza(1, 89), fuente: KA },
  { id: 'pan-rallado', nombre: 'Pan rallado', grupo: HARINAS, medida: taza(1 / 4, 28), fuente: KA },
  { id: 'harina-almendras', nombre: 'Harina de almendras', grupo: HARINAS, medida: taza(1, 96), fuente: KA },

  { id: 'azucar', nombre: 'Azúcar blanca', grupo: AZUCARES, medida: taza(1, 198), fuente: KA },
  { id: 'azucar-rubia', nombre: 'Azúcar rubia (apretada)', grupo: AZUCARES, medida: taza(1, 213), fuente: KA },
  { id: 'azucar-impalpable', nombre: 'Azúcar impalpable', grupo: AZUCARES, medida: taza(1, 113), fuente: KA },
  { id: 'miel', nombre: 'Miel', grupo: AZUCARES, medida: cda(1, 21), fuente: KA },
  { id: 'dulce-de-leche', nombre: 'Dulce de leche', grupo: AZUCARES, medida: cda(1, 19), fuente: usda(173461, 'Dulce de Leche') },
  { id: 'glucosa', nombre: 'Glucosa (jarabe de maíz)', grupo: AZUCARES, medida: taza(1, 312), fuente: KA },
  { id: 'cacao', nombre: 'Cacao amargo', grupo: AZUCARES, medida: taza(1 / 2, 42), fuente: KA },
  { id: 'chocolate', nombre: 'Chocolate picado', grupo: AZUCARES, medida: taza(1, 170), fuente: KA },
  { id: 'coco', nombre: 'Coco rallado', grupo: AZUCARES, medida: taza(1, 85), fuente: KA },

  { id: 'manteca', nombre: 'Manteca', grupo: GRASAS, medida: taza(1 / 2, 113), fuente: KA },
  { id: 'aceite', nombre: 'Aceite', grupo: GRASAS, medida: taza(1, 198), fuente: KA },
  { id: 'grasa-vacuna', nombre: 'Grasa vacuna', grupo: GRASAS, medida: taza(1, 205), fuente: usda(171400, 'Fat, beef tallow') },
  { id: 'crema', nombre: 'Crema de leche', grupo: GRASAS, medida: taza(1, 227), fuente: KA },
  { id: 'leche', nombre: 'Leche', grupo: GRASAS, medida: taza(1, 227), fuente: KA },
  { id: 'leche-polvo', nombre: 'Leche en polvo entera', grupo: GRASAS, medida: taza(1 / 2, 50), fuente: KA },
  { id: 'yogur', nombre: 'Yogur', grupo: GRASAS, medida: taza(1, 227), fuente: KA },
  { id: 'queso-crema', nombre: 'Queso crema', grupo: GRASAS, medida: taza(1, 227), fuente: KA },
  { id: 'ricota', nombre: 'Ricota', grupo: GRASAS, medida: taza(1, 227), fuente: KA },
  { id: 'queso-rallado', nombre: 'Queso rallado', grupo: GRASAS, medida: taza(1 / 2, 50), fuente: KA },

  { id: 'agua', nombre: 'Agua', grupo: OTROS, medida: taza(1, 227), fuente: KA },
  { id: 'arroz', nombre: 'Arroz crudo', grupo: OTROS, medida: taza(1 / 2, 99), fuente: KA },
  { id: 'lentejas', nombre: 'Lentejas secas', grupo: OTROS, medida: taza(1, 192), fuente: usda(172420, 'Lentils, raw') },
  { id: 'nueces', nombre: 'Nueces picadas', grupo: OTROS, medida: taza(1, 113), fuente: KA },
  { id: 'almendras', nombre: 'Almendras enteras', grupo: OTROS, medida: taza(1, 142), fuente: KA },
  { id: 'pasas', nombre: 'Pasas de uva', grupo: OTROS, medida: taza(1, 149), fuente: KA },
  { id: 'chia', nombre: 'Semillas de chía', grupo: OTROS, medida: taza(1 / 4, 37), fuente: KA },
  { id: 'sesamo', nombre: 'Sésamo', grupo: OTROS, medida: taza(1 / 2, 71), fuente: KA },
  { id: 'lino', nombre: 'Semillas de lino', grupo: OTROS, medida: taza(1 / 4, 35), fuente: KA },
  { id: 'jugo-limon', nombre: 'Jugo de limón', grupo: OTROS, medida: cda(1, 14), fuente: KA },
  { id: 'vinagre', nombre: 'Vinagre', grupo: OTROS, medida: taza(1, 238), fuente: usda(172237, 'Vinegar, distilled') },

  { id: 'sal', nombre: 'Sal fina', grupo: LEUDANTES, medida: cda(1, 18), fuente: KA },
  { id: 'levadura-seca', nombre: 'Levadura seca', grupo: LEUDANTES, medida: cda(1, 12), fuente: usda(175043, 'Leavening agents, yeast, baker\'s, active dry') },
  { id: 'levadura-instantanea', nombre: 'Levadura instantánea', grupo: LEUDANTES, medida: cda(1, 9), fuente: KA },
  { id: 'polvo-hornear', nombre: 'Polvo de hornear', grupo: LEUDANTES, medida: cdita(1, 4), fuente: KA },
  { id: 'bicarbonato', nombre: 'Bicarbonato de sodio', grupo: LEUDANTES, medida: cdita(1 / 2, 3), fuente: KA },
  { id: 'gelatina', nombre: 'Gelatina sin sabor', grupo: LEUDANTES, medida: cda(1, 7), fuente: usda(169599, 'Gelatins, dry powder, unsweetened') }
];

/** La primera va como advertencia del resultado. */
export const NOTAS_CONVERSOR: readonly string[] = [
  'Medidas al ras; la harina, volcada con cuchara en la taza. Hundiendo la taza entra hasta un tercio más.',
  'La 000 y la 0000 pesan lo mismo por taza: la diferencia está en el uso (pan y repostería), no en el peso. En recetas en inglés, la 000 hace de bread flour y la 0000 de all-purpose.'
];

export const NOTAS_MEDIDAS: readonly string[] = [
  'Pinch, dash y smidgen son las medidas de las cucharitas marcadas de EE. UU.; otras fuentes dan el dash en 1/16 (Universidad de Nebraska) o el pinch en ⅛ (Smitten Kitchen).',
  'En Argentina la manteca se vende en panes de 100 y 200 g: un stick es un poco más que un pan de 100.'
];

export const CONVERSOR = {
  sistemas: SISTEMAS, unidades: UNIDADES, ingredienteDelStick: INGREDIENTE_DEL_STICK,
  ingredientes: INGREDIENTES, notas: NOTAS_CONVERSOR, notasMedidas: NOTAS_MEDIDAS
};
