/**
 * Huevos, carne, aceite, horno y bebidas: sólo datos. Cada tabla dice de dónde
 * sale.
 *
 * Procedencia: product-design/research/herramientas/verificacion-referencia-rapida.md
 * Para corregir un número, editá su fila.
 * Para sumar una fila, respetá las columnas de su tabla. El orden en que se
 * muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { Tabla } from '../tipos.js';

export const TABLAS_RAPIDA = {
  huevos: {
    id: 'huevos', titulo: 'Huevos',
    columnas: [
      { id: 'punto', nombre: 'Punto' },
      { id: 'heladera', nombre: 'Huevo de heladera' },
      { id: 'ambiente', nombre: 'A temperatura ambiente' }
    ],
    filas: [
      { punto: 'Pasado por agua', heladera: '4 min', ambiente: '2½ min' },
      { punto: 'Mollet: clara firme, yema líquida', heladera: '7 min', ambiente: '5½ min' },
      { punto: 'Yema cremosa', heladera: '8 min', ambiente: '6½ min' },
      { punto: 'Duro', heladera: '10 min', ambiente: '8½ min' }
    ],
    notas: ['Huevo grande, de 58 g.'],
    fuente: { nombre: 'Omni Calculator, Ideal Egg Boiling Calculator', url: 'https://www.omnicalculator.com/food/egg-boiling' }
  },

  'carne-seguridad': {
    id: 'carne-seguridad', titulo: 'Temperatura interna segura',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'minima', nombre: 'Mínima', unidad: '°C' }
    ],
    filas: [
      { alimento: 'Vaca, cerdo, ternera y cordero: bifes, costillas y piezas enteras', minima: '63' },
      { alimento: 'Carne picada (vaca, cerdo, ternera, cordero)', minima: '71' },
      { alimento: 'Aves: pechuga, entera, pata, muslo, alitas, picada, menudos y relleno', minima: '74' },
      { alimento: 'Platos con huevo', minima: '71' },
      { alimento: 'Pescados y mariscos', minima: '63' },
      { alimento: 'Sobras (recalentadas)', minima: '74' },
      { alimento: 'Guisos y cazuelas al horno', minima: '74' }
    ],
    notas: ['Medida con termómetro en la parte más gruesa o en el centro, antes de sacar del fuego.'],
    fuentes: [
      { nombre: 'USDA FSIS', url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart' },
      { nombre: 'SENASA', url: 'https://www.argentina.gob.ar/noticias/sindrome-uremico-hemolitico-pautas-para-la-prevencion-de-esta-enfermedad-transmitida-por' }
    ]
  },

  'carne-puntos': {
    id: 'carne-puntos', titulo: 'Puntos de la carne vacuna',
    columnas: [
      { id: 'punto', nombre: 'Punto' },
      { id: 'interna', nombre: 'Interna', unidad: '°C' }
    ],
    filas: [
      { punto: 'Crudo (vuelta y vuelta)', interna: '46–52' },
      { punto: 'Jugoso', interna: '52–55' },
      { punto: 'A punto', interna: '55–65' },
      { punto: 'Cocido', interna: '65–70' },
      { punto: 'Bien cocido', interna: '70 o más' }
    ],
    fuentes: []
  },

  aceite: {
    id: 'aceite', titulo: 'Aceite para freír',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'aceite', nombre: 'Aceite', unidad: '°C' },
      { id: 'tiempo', nombre: 'Tiempo' },
      { id: 'interna', nombre: 'Interna', unidad: '°C' }
    ],
    filas: [
      { alimento: 'Milanesas', aceite: '170–180', tiempo: '2–3 min por lado', interna: '—' },
      { alimento: 'Empanadas', aceite: '180', tiempo: '2–4 min', interna: '—' },
      { alimento: 'Papas fritas, en dos tiempos', aceite: '165, y después 205', tiempo: '3–4 min + 3–4 min', interna: '—' },
      { alimento: 'Pescado rebozado', aceite: '185', tiempo: '3–5 min', interna: '63' },
      { alimento: 'Pollo frito (presas)', aceite: '190', tiempo: '12–15 min', interna: '74' },
      { alimento: 'Alitas de pollo', aceite: '190', tiempo: '8–10 min', interna: '74' },
      { alimento: 'Tiritas de pollo', aceite: '175', tiempo: '3–5 min', interna: '74' },
      { alimento: 'Langostinos', aceite: '175', tiempo: '3–4 min', interna: '54' },
      { alimento: 'Churros', aceite: '190', tiempo: '2–4 min', interna: '—' },
      { alimento: 'Donas', aceite: '190', tiempo: '2–4 min', interna: '—' }
    ],
    fuentes: [
      { nombre: 'Taste of Home', url: 'https://www.tasteofhome.com/article/deep-frying-temperature-chart/' },
      { nombre: 'Breaders', url: 'https://breaders.com.ar/tips-de-manipulacion-y-de-coccion/' }
    ]
  },

  'punto-humo': {
    id: 'punto-humo', titulo: 'Punto de humo',
    columnas: [
      { id: 'aceite', nombre: 'Aceite' },
      { id: 'humo', nombre: 'Punto de humo', unidad: '°C' }
    ],
    filas: [
      { aceite: 'Uva', humo: '270' },
      { aceite: 'Canola', humo: '255' },
      { aceite: 'Girasol', humo: '255' },
      { aceite: 'Arroz', humo: '235' },
      { aceite: 'Maní alto oleico', humo: '225' },
      { aceite: 'Oliva', humo: '210' },
      { aceite: 'Oliva extra virgen', humo: '205' },
      { aceite: 'Palta', humo: '195' },
      { aceite: 'Coco', humo: '190' },
      { aceite: 'Oliva virgen', humo: '175' }
    ],
    fuente: { nombre: 'De Alzaa, Guillaume y Ravetti, 2018', url: 'https://actascientific.com/ASNH/pdf/ASNH-02-0083.pdf' }
  },

  'horno-escala': {
    id: 'horno-escala', titulo: 'Horno',
    columnas: [
      { id: 'horno', nombre: 'Horno' },
      { id: 'temperatura', nombre: 'Temperatura', unidad: '°C' }
    ],
    filas: [
      { horno: 'Suave', temperatura: '140–170' },
      { horno: 'Moderado', temperatura: '170–190' },
      { horno: 'Fuerte', temperatura: '190–230' },
      { horno: 'Muy fuerte', temperatura: '230–260' },
      { horno: 'Con ventilador', temperatura: '20 °C menos' }
    ],
    fuentes: []
  },

  infusiones: {
    id: 'infusiones', titulo: 'Infusiones',
    columnas: [
      { id: 'infusion', nombre: 'Infusión' },
      { id: 'agua', nombre: 'Agua', unidad: '°C' },
      { id: 'tiempo', nombre: 'Tiempo', minutos: true },
      { id: 'hebras', nombre: 'Hebras', unidad: 'g por 100 ml' }
    ],
    filas: [
      { infusion: 'Mate', agua: '75', tiempo: '—', hebras: '—' },
      { infusion: 'Mate cocido', agua: '85–90', tiempo: '—', hebras: '—' },
      { infusion: 'Té verde', agua: '80', tiempo: '3 min', hebras: '2' },
      { infusion: 'Té blanco', agua: '85', tiempo: '4 min', hebras: '2' },
      { infusion: 'Té oolong', agua: '90', tiempo: '3 min 30 s', hebras: '2' },
      { infusion: 'Té negro', agua: '100', tiempo: '4 min', hebras: '2' },
      { infusion: 'Té pu-erh', agua: '100', tiempo: '5 min', hebras: '2' },
      { infusion: 'Té de hierbas', agua: '100', tiempo: '6 min', hebras: '1,5' }
    ],
    fuentes: [
      { nombre: 'INYM', url: 'https://inym.org.ar/noticias/yerba-mate-argentina/78425-claves-para-preparar-un-buen-mate.html' },
      { nombre: 'teatimer.io', url: 'https://teatimer.io/tea-steeping-guide' }
    ]
  },

  vinos: {
    id: 'vinos', titulo: 'Vinos y espumantes',
    columnas: [
      { id: 'vino', nombre: 'Vino' },
      { id: 'servir', nombre: 'Servir a', unidad: '°C' }
    ],
    filas: [
      { vino: 'Espumante', servir: '6' },
      { vino: 'Blanco liviano y aromático (torrontés, sauvignon blanc)', servir: '6' },
      { vino: 'Rosado', servir: '8–9' },
      { vino: 'Blanco con más cuerpo (semillón, chardonnay)', servir: '8–9' },
      { vino: 'Tinto liviano (criolla, pinot noir)', servir: '13–14' },
      { vino: 'Tinto con más cuerpo (malbec, syrah con crianza)', servir: '17–18' }
    ],
    fuente: { nombre: 'La Nación', url: 'https://www.lanacion.com.ar/que-sale/la-temperatura-ideal-para-servir-cada-tipo-de-vino-y-como-alcanzarla-nid08052025/' }
  },

  cervezas: {
    id: 'cervezas', titulo: 'Cervezas y gaseosas',
    columnas: [
      { id: 'bebida', nombre: 'Bebida' },
      { id: 'servir', nombre: 'Servir a', unidad: '°C' }
    ],
    filas: [
      { bebida: 'Lager liviana industrial', servir: '1–4' },
      { bebida: 'Lager rubia, pilsner', servir: '3–7' },
      { bebida: 'Ale rubia (blonde, cream)', servir: '4–7' },
      { bebida: 'Stout nitro', servir: '4–7' },
      { bebida: 'Ale belga rubia, tripel', servir: '4–7' },
      { bebida: 'De trigo', servir: '4–10' },
      { bebida: 'Lambic', servir: '4–10' },
      { bebida: 'Lager oscura', servir: '7–10' },
      { bebida: 'APA, IPA', servir: '7–10' },
      { bebida: 'Stout, porter', servir: '7–13' },
      { bebida: 'Lager fuerte', servir: '10–13' },
      { bebida: 'Ale de barril (real ale)', servir: '10–13' },
      { bebida: 'Dubbel', servir: '10–13' },
      { bebida: 'Gaseosas', servir: '4–5' }
    ],
    fuentes: [
      { nombre: 'American Homebrewers Association', url: 'https://homebrewersassociation.org/how-to-brew/proper-beer-serving-temperatures/' },
      { nombre: 'Omni Calculator', url: 'https://www.omnicalculator.com/food/chilled-drink' }
    ]
  }
} satisfies Record<string, Tabla>;
