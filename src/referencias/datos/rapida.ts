/**
 * Referencia rápida: sólo datos. Cada tabla dice de dónde sale.
 *
 * Procedencia: product-design/research/herramientas/verificacion-referencia-rapida.md
 * Para corregir un número, editá su fila y la fecha `consultada` de la fuente.
 * Para sumar una fila, respetá las columnas de su tabla. El orden en que se
 * muestran las tablas está en `src/referencias/indice.ts`.
 */
import type { Tabla } from '../tipos.js';

const consultada = '2026-10-04';

export const TABLAS_RAPIDA = {
  huevos: {
    id: 'huevos', titulo: 'Huevos',
    columnas: [
      { id: 'punto', nombre: 'Punto' },
      { id: 'heladera', nombre: 'Huevo de heladera', unidad: 'min' },
      { id: 'ambiente', nombre: 'A temperatura ambiente', unidad: 'min' }
    ],
    filas: [
      { punto: 'Pasado por agua', heladera: '4:01', ambiente: '2:31' },
      { punto: 'Mollet: clara firme, yema líquida', heladera: '6:49', ambiente: '5:18' },
      { punto: 'Yema cremosa', heladera: '7:49', ambiente: '6:19' },
      { punto: 'Duro', heladera: '10:04', ambiente: '8:33' }
    ],
    notas: [
      'Huevo grande, de 58 g, en agua hirviendo.',
      'Al nivel del mar; el tiempo corre desde que el huevo entra al agua. Al sacarlo, agua fría para cortar la cocción.'
    ],
    fuente: { nombre: 'Omni Calculator, Ideal Egg Boiling Calculator', url: 'https://www.omnicalculator.com/food/egg-boiling', consultada }
  },

  'carne-seguridad': {
    id: 'carne-seguridad', titulo: 'Temperatura interna segura',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'minima', nombre: 'Mínima', unidad: '°C' },
      { id: 'reposo', nombre: 'Reposo' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { alimento: 'Vaca, cerdo, ternera y cordero: bifes, costillas y piezas enteras', minima: '63', reposo: '3 min', fuente: 'FSIS' },
      { alimento: 'Carne picada (vaca, cerdo, ternera, cordero); el SENASA pide evitarla en menores de 5 años', minima: '71', reposo: '—', fuente: 'SENASA y FSIS' },
      { alimento: 'Aves: pechuga, entera, pata, muslo, alitas, picada, menudos y relleno', minima: '74', reposo: '—', fuente: 'FSIS' },
      { alimento: 'Jamón crudo, fresco o ahumado', minima: '63', reposo: '3 min', fuente: 'FSIS' },
      { alimento: 'Platos con huevo', minima: '71', reposo: '—', fuente: 'FSIS' },
      { alimento: 'Pescados y mariscos', minima: '63', reposo: '—', fuente: 'FSIS' },
      { alimento: 'Sobras (recalentadas)', minima: '74', reposo: '—', fuente: 'FSIS' },
      { alimento: 'Guisos y cazuelas al horno', minima: '74', reposo: '—', fuente: 'FSIS' }
    ],
    notas: ['Medida con termómetro en la parte más gruesa, antes de sacar del fuego.'],
    columnaFuente: 'fuente',
    fuentes: [
      {
        abreviatura: 'FSIS', nombre: 'USDA FSIS, Safe Minimum Internal Temperature Chart',
        url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart',
        consultada
      },
      {
        abreviatura: 'SENASA', nombre: 'SENASA, Síndrome urémico hemolítico: pautas para la prevención',
        url: 'https://www.argentina.gob.ar/noticias/sindrome-uremico-hemolitico-pautas-para-la-prevencion-de-esta-enfermedad-transmitida-por',
        consultada
      }
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
      { punto: 'A punto', interna: '55–60' },
      { punto: 'A punto menos', interna: '60–65' },
      { punto: 'Cocido', interna: '65–70' },
      { punto: 'Bien cocido', interna: '70 o más' }
    ],
    notas: ['Cerdo y aves no tienen tabla de puntos: van con su mínima de seguridad (cerdo 63 °C con 3 min de reposo, aves 74 °C).'],
    fuente: {
      nombre: 'Frigorífico Sada, ¿Cuáles son los puntos de cocción de la carne vacuna?',
      url: 'https://www.frigorificosada.com.ar/blog/punto-de-coccion-de-la-carne/',
      consultada
    }
  },

  aceite: {
    id: 'aceite', titulo: 'Aceite para freír',
    columnas: [
      { id: 'alimento', nombre: 'Alimento' },
      { id: 'aceite', nombre: 'Aceite', unidad: '°C' },
      { id: 'tiempo', nombre: 'Tiempo' },
      { id: 'interna', nombre: 'Interna', unidad: '°C' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { alimento: 'Milanesas', aceite: '170–180', tiempo: '2–3 min por lado', interna: '—', fuente: 'Breaders' },
      { alimento: 'Empanadas', aceite: '182', tiempo: '2–4 min', interna: '—', fuente: 'ToH' },
      { alimento: 'Papas fritas, en dos tiempos', aceite: '163, y después 204', tiempo: '3–4 min + 3–4 min', interna: '—', fuente: 'ToH' },
      { alimento: 'Pescado rebozado', aceite: '185', tiempo: '3–5 min', interna: '63', fuente: 'ToH' },
      { alimento: 'Pollo frito (presas)', aceite: '191', tiempo: '12–15 min', interna: '74', fuente: 'ToH' },
      { alimento: 'Alitas de pollo', aceite: '191', tiempo: '8–10 min', interna: '74', fuente: 'ToH' },
      { alimento: 'Tiritas de pollo', aceite: '177', tiempo: '3–5 min', interna: '74', fuente: 'ToH' },
      { alimento: 'Langostinos', aceite: '177', tiempo: '3–4 min', interna: '54', fuente: 'ToH' },
      { alimento: 'Churros', aceite: '191', tiempo: '2–4 min', interna: '—', fuente: 'ToH' },
      { alimento: 'Donas', aceite: '191', tiempo: '2–4 min', interna: '—', fuente: 'ToH' }
    ],
    notas: ['Rango general (Taste of Home): 177–191 °C.'],
    columnaFuente: 'fuente',
    fuentes: [
      { abreviatura: 'ToH', nombre: 'Taste of Home, Deep Frying Temperature Chart', url: 'https://www.tasteofhome.com/article/deep-frying-temperature-chart/', consultada },
      { abreviatura: 'Breaders', nombre: 'Breaders, Tips de manipulación y de cocción', url: 'https://breaders.com.ar/tips-de-manipulacion-y-de-coccion/', consultada }
    ]
  },

  'punto-humo': {
    id: 'punto-humo', titulo: 'Punto de humo',
    columnas: [
      { id: 'aceite', nombre: 'Aceite' },
      { id: 'humo', nombre: 'Punto de humo', unidad: '°C' }
    ],
    filas: [
      { aceite: 'Maní, cártamo, soja', humo: '232' },
      { aceite: 'Uva', humo: '229' },
      { aceite: 'Canola', humo: '224' },
      { aceite: 'Maíz, oliva, sésamo, girasol', humo: '210' }
    ],
    fuente: {
      nombre: 'USDA FSIS, Deep Fat Frying and Food Safety',
      url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/deep-fat-frying',
      consultada
    }
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
      { horno: 'Muy fuerte', temperatura: '230–260' }
    ],
    fuente: { nombre: 'Soy celíaco, no extraterrestre, Temperatura del horno', url: 'https://www.soyceliaconoextraterrestre.com/temperatura-del-horno/', consultada }
  },

  'horno-ventilador': {
    id: 'horno-ventilador', titulo: 'Horno con ventilador',
    columnas: [
      { id: 'convencional', nombre: 'Receta para horno convencional' },
      { id: 'ventilador', nombre: 'Con ventilador' }
    ],
    filas: [
      { convencional: 'Temperatura de la receta', ventilador: '20 °C menos' }
    ],
    notas: ['Ejemplo: 200 °C en horno convencional son 180 °C con ventilador. El tiempo queda igual.'],
    fuente: {
      nombre: 'Bosch, Trucos para el horno: cómo ser un maestro',
      url: 'https://innovacionparatuvida.bosch-home.es/electrodomesticos/hornos/trucos-para-el-horno-como-ser-un-maestro/',
      consultada
    }
  },

  mate: {
    id: 'mate', titulo: 'Mate',
    columnas: [
      { id: 'bebida', nombre: 'Bebida' },
      { id: 'agua', nombre: 'Agua', unidad: '°C' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { bebida: 'Mate', agua: '75', fuente: 'INYM' },
      { bebida: 'Mate cocido', agua: '85–90', fuente: 'ED' }
    ],
    columnaFuente: 'fuente',
    fuentes: [
      {
        abreviatura: 'INYM', nombre: 'INYM, Claves para preparar un buen mate',
        url: 'https://inym.org.ar/noticias/yerba-mate-argentina/78425-claves-para-preparar-un-buen-mate.html', consultada
      },
      {
        abreviatura: 'ED', nombre: 'El Día, ¿Cuáles son las temperaturas ideales del agua para tomar café, mate y té?',
        url: 'https://www.eldia.com/nota/2025-1-12-1-49-45-cuales-son-las-temperaturas-ideales-del-agua-para-tomar-cafe-mate-y-te--temas', consultada
      }
    ]
  },

  te: {
    id: 'te', titulo: 'Té',
    columnas: [
      { id: 'te', nombre: 'Té' },
      { id: 'agua', nombre: 'Agua', unidad: '°C' },
      { id: 'infusion', nombre: 'Infusión', minutos: true },
      { id: 'hebras', nombre: 'Hebras', unidad: 'g por 100 ml' }
    ],
    filas: [
      { te: 'Verde', agua: '80', infusion: '3 min', hebras: '2' },
      { te: 'Blanco', agua: '85', infusion: '4 min', hebras: '2' },
      { te: 'Oolong', agua: '90', infusion: '3 min 30 s', hebras: '2' },
      { te: 'Negro', agua: '100', infusion: '4 min', hebras: '2' },
      { te: 'Pu-erh', agua: '100', infusion: '5 min', hebras: '2' },
      { te: 'Hierbas', agua: '100', infusion: '6 min', hebras: '1,5' }
    ],
    fuente: { nombre: 'teatimer.io, Tea Steeping Guide', url: 'https://teatimer.io/tea-steeping-guide', consultada }
  },

  cafe: {
    id: 'cafe', titulo: 'Café',
    columnas: [
      { id: 'metodo', nombre: 'Método' },
      { id: 'temperatura', nombre: 'Temperatura', unidad: '°C' },
      { id: 'cafe', nombre: 'Café', unidad: 'g' },
      { id: 'agua', nombre: 'Agua', unidad: 'ml' },
      { id: 'tiempo', nombre: 'Tiempo' }
    ],
    filas: [
      { metodo: 'Filtro de dos tazas (pour-over)', temperatura: '93,5', cafe: '22', agua: '400', tiempo: '2 min 30 s a 3 min' }
    ],
    notas: ['Proporción: 55 g de café por litro de agua.'],
    fuente: {
      nombre: 'SCAA, Guidelines for Brewing with a Two Cup Pour-Over Brewer',
      url: 'https://scagermany.coffee/wp-content/uploads/2021/02/best-practices-two-cup-pour-over-brewer.pdf',
      consultada
    }
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
    fuente: {
      nombre: 'La Nación, La temperatura ideal para servir cada tipo de vino y cómo alcanzarla',
      url: 'https://www.lanacion.com.ar/que-sale/la-temperatura-ideal-para-servir-cada-tipo-de-vino-y-como-alcanzarla-nid08052025/',
      consultada
    }
  },

  cervezas: {
    id: 'cervezas', titulo: 'Cervezas y gaseosas',
    columnas: [
      { id: 'bebida', nombre: 'Bebida' },
      { id: 'servir', nombre: 'Servir a', unidad: '°C' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: [
      { bebida: 'Lager liviana industrial', servir: '1–4', fuente: 'AHA' },
      { bebida: 'Lager rubia, pilsner', servir: '3–7', fuente: 'AHA' },
      { bebida: 'Ale rubia (blonde, cream)', servir: '4–7', fuente: 'AHA' },
      { bebida: 'Stout nitro', servir: '4–7', fuente: 'AHA' },
      { bebida: 'Ale belga rubia, tripel', servir: '4–7', fuente: 'AHA' },
      { bebida: 'De trigo', servir: '4–10', fuente: 'AHA' },
      { bebida: 'Lambic', servir: '4–10', fuente: 'AHA' },
      { bebida: 'Lager oscura', servir: '7–10', fuente: 'AHA' },
      { bebida: 'APA, IPA', servir: '7–10', fuente: 'AHA' },
      { bebida: 'Stout, porter', servir: '7–13', fuente: 'AHA' },
      { bebida: 'Lager fuerte', servir: '10–13', fuente: 'AHA' },
      { bebida: 'Ale de barril (real ale)', servir: '10–13', fuente: 'AHA' },
      { bebida: 'Dubbel', servir: '10–13', fuente: 'AHA' },
      { bebida: 'Gaseosas', servir: '4–5', fuente: 'Omni' }
    ],
    columnaFuente: 'fuente',
    fuentes: [
      {
        abreviatura: 'AHA', nombre: 'American Homebrewers Association, Proper Beer Serving Temperatures',
        url: 'https://homebrewersassociation.org/how-to-brew/proper-beer-serving-temperatures/', consultada
      },
      {
        abreviatura: 'Omni', nombre: 'Omni Calculator, Chilled Drink Calculator',
        url: 'https://www.omnicalculator.com/food/chilled-drink', consultada
      }
    ]
  }
} satisfies Record<string, Tabla>;
