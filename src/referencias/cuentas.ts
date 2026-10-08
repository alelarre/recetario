/**
 * Las cuentas de las herramientas de referencia. No tienen ningún número
 * propio: cada fábrica recibe sus constantes de `datos/`, y los tests le pasan
 * otras. Cada cuenta declara sus entradas; la pantalla y el MCP se arman
 * desde esa declaración.
 */
import { gramos } from '../calculadoras/gramos.js';
import type { Cuenta, Valores, Linea, Fuente, FuenteAbreviada, Resultado, Tabla, Sistema, IngredienteConvertible } from './tipos.js';
import type { MOLDE, PIZZA, AZUCAR, RecetaPorPorcion, TipoDeMerengue, Ingrediente } from './datos/masas-y-dulces.js';
import type { ARROZ, AGUA_SAL_PASTA, ESPAGUETI, CALDO } from './datos/coccion.js';
import type { CONVERSOR } from './datos/conversor.js';

/** Un número positivo y finito, o nada. */
export function numero(v: Valores, id: string): number | null {
  const x = v[id];
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null;
}
export const opcion = (v: Valores, id: string): string => (typeof v[id] === 'string' ? v[id] as string : '');

const FRACCIONES: Readonly<Record<string, string>> = { '0.25': '¼', '0.33': '⅓', '0.50': '½', '0.67': '⅔', '0.75': '¾' };

/** Huevos y yemas: enteros, o con su fracción común; si no hay una, un decimal con coma. */
export function fraccion(n: number): string {
  const entero = Math.floor(n + 1e-9);
  const resto = Math.round((n - entero) * 100) / 100;
  if (resto === 0) return String(entero);
  const f = FRACCIONES[resto.toFixed(2)];
  if (!f) return (Math.round(n * 10) / 10).toString().replace('.', ',');
  return entero ? `${entero} ${f}` : f;
}

/** En litros, con un decimal; lo que así quedaría en cero, en mililitros. */
const litros = (ml: number): string =>
  (Math.round(ml / 100) === 0 ? `${Math.round(ml)} ml` : `${(Math.round(ml / 100) / 10).toString().replace('.', ',')} l`);

function cantidad(i: Ingrediente, por: number): string {
  const una = (x: number): string => (i.unidad === 'u' ? fraccion(x * por) : `${gramos(x * por)} ${i.unidad}`);
  return i.cantidadMax === undefined ? una(i.cantidad) : `${una(i.cantidad).replace(/ (g|ml)$/, '')} a ${una(i.cantidadMax)}`;
}

const lineasDe = (ingredientes: readonly Ingrediente[], por: number): Linea[] =>
  ingredientes.map(i => ({ nombre: i.nombre, valor: cantidad(i, por) }));

const resultado = (lineas: readonly Linea[], fuentes: readonly Fuente[], advertencias: readonly string[] = []): Resultado =>
  ({ lineas, advertencias, fuentes });

/** Un molde no se llena menos del 1 % ni más del 100 %: fuera de eso la masa no entra. */
const LLENADO_MINIMO = 1;
const LLENADO_MAXIMO = 100;

export function cuentaMolde(k: typeof MOLDE): Cuenta {
  const medidas = (v: Valores): boolean => opcion(v, 'molde') === 'medidas';
  const conForma = (...formas: string[]) => (v: Valores): boolean => medidas(v) && formas.includes(opcion(v, 'forma'));
  // Un tipo de molde redondo sin diámetro propio: el número se escribe en `diametro`.
  const tipoSinDiametro = (v: Valores): boolean => {
    const a = k.atajos.find(x => x.id === opcion(v, 'molde'));
    return a !== undefined && a.forma === 'redondo' && a.diametro === undefined;
  };
  return {
    id: 'molde', titulo: 'Masa para un molde', descripcion: 'Cuánta masa lleva un molde de torta, según su forma y sus medidas o su número.',
    notas: k.notas,
    entradas: [
      { id: 'molde', nombre: 'Molde', tipo: 'opcion', porDefecto: 'medidas',
        opciones: [{ valor: 'medidas', texto: 'Con sus medidas' }, ...k.atajos.map(a => ({ valor: a.id, texto: a.texto }))] },
      { id: 'forma', nombre: 'Forma', tipo: 'opcion', porDefecto: 'redondo', visibleSi: medidas,
        opciones: [{ valor: 'redondo', texto: 'Redondo' }, { valor: 'rectangular', texto: 'Cuadrado o rectangular' }, { valor: 'tubo', texto: 'Con tubo' }] },
      { id: 'diametro', nombre: 'Diámetro', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: v => conForma('redondo', 'tubo')(v) || tipoSinDiametro(v) },
      { id: 'tubo', nombre: 'Diámetro del tubo', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('tubo') },
      { id: 'largo', nombre: 'Largo', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('rectangular') },
      { id: 'ancho', nombre: 'Ancho', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: conForma('rectangular') },
      { id: 'alto', nombre: 'Alto', tipo: 'numero', unidad: 'cm', porDefecto: null, visibleSi: medidas },
      { id: 'llenado', nombre: 'Llenado', tipo: 'numero', unidad: '%', porDefecto: Math.round(k.llenado.valor * 100) }
    ],
    calcular(v) {
      const atajo = k.atajos.find(a => a.id === opcion(v, 'molde'));
      const forma = atajo ? atajo.forma : opcion(v, 'forma');
      const alto = atajo ? atajo.alto : numero(v, 'alto');
      const d = atajo?.diametro ?? numero(v, 'diametro');
      let volumen: number | null = null;
      if (alto && forma === 'redondo' && d) volumen = Math.PI * (d / 2) ** 2 * alto;
      if (alto && forma === 'rectangular') {
        const largo = atajo ? atajo.largo ?? null : numero(v, 'largo');
        const ancho = atajo ? atajo.ancho ?? null : numero(v, 'ancho');
        if (largo && ancho) volumen = largo * ancho * alto;
      }
      const tubo = numero(v, 'tubo');
      if (alto && forma === 'tubo' && d && tubo && tubo < d) volumen = Math.PI * ((d / 2) ** 2 - (tubo / 2) ** 2) * alto;
      if (volumen === null) return null;
      const porcentaje = numero(v, 'llenado') ?? k.llenado.valor * 100;
      if (porcentaje < LLENADO_MINIMO || porcentaje > LLENADO_MAXIMO) {
        return resultado([], [k.llenado.fuente], [`El llenado va de ${LLENADO_MINIMO} a ${LLENADO_MAXIMO} %.`]);
      }
      return resultado(
        [{ nombre: 'Capacidad', valor: litros(volumen) }, { nombre: 'Masa cruda', valor: `${gramos(volumen * (porcentaje / 100) * k.densidad.valor)} g` }],
        [k.densidad.fuente, k.llenado.fuente, ...(atajo ? [atajo.fuente ?? k.fuenteAtajos] : [])]
      );
    }
  };
}

export function cuentaPastaFresca(recetas: readonly RecetaPorPorcion[]): Cuenta {
  return {
    id: 'pasta-fresca', titulo: 'Pasta fresca', descripcion: 'Qué ingredientes lleva la masa de pasta fresca, o el relleno o el puré, para unas porciones.',
    entradas: [
      { id: 'porciones', nombre: 'Porciones', tipo: 'numero', porDefecto: 4 },
      { id: 'masa', nombre: 'Masa', tipo: 'opcion', porDefecto: recetas[0]?.id ?? '', opciones: recetas.map(r => ({ valor: r.id, texto: r.texto })) }
    ],
    calcular(v) {
      const porciones = numero(v, 'porciones');
      const receta = recetas.find(r => r.id === opcion(v, 'masa'));
      if (!porciones || !receta) return null;
      return resultado(lineasDe(receta.ingredientes, porciones), [receta.fuente], [...receta.notas, ...(receta.advertencia ? [receta.advertencia] : [])]);
    }
  };
}

export function cuentaBolloPizza(k: typeof PIZZA): Cuenta {
  const rangoNapolitana = `${Math.min(...k.napolitana.map(r => r.desde))} a ${Math.max(...k.napolitana.map(r => r.hasta))} cm`;
  return {
    id: 'bollo-pizza', titulo: 'Bollo de pizza', descripcion: 'Cuántos gramos pesa el bollo de una pizza, napolitana o al molde, según su diámetro o su número de molde.',
    notas: k.notas ?? [],
    entradas: [
      { id: 'estilo', nombre: 'Estilo', tipo: 'opcion', porDefecto: 'napolitana', opciones: [{ valor: 'napolitana', texto: 'Napolitana' }, { valor: 'molde', texto: 'Al molde' }] },
      { id: 'diametro', nombre: 'Diámetro o número de molde', tipo: 'numero', unidad: 'cm', porDefecto: null },
      { id: 'cantidad', nombre: 'Pizzas', tipo: 'numero', porDefecto: 1 }
    ],
    calcular(v) {
      const d = numero(v, 'diametro'); const n = numero(v, 'cantidad');
      if (!d || !n) return null;
      if (opcion(v, 'estilo') === 'napolitana') {
        // Cada fila cubre desde su `desde` hasta el `desde` de la siguiente: entre dos filas toma la anterior.
        const dentro = d >= Math.min(...k.napolitana.map(r => r.desde)) && d <= Math.max(...k.napolitana.map(r => r.hasta));
        const fila = dentro ? k.napolitana.filter(r => r.desde <= d).sort((a, b) => b.desde - a.desde)[0] : undefined;
        if (!fila) return resultado([], [k.fuenteNapolitana], [`La tabla de la AVPN va de ${rangoNapolitana}.`]);
        return resultado([{ nombre: 'Cada bollo', valor: `${fila.gramos} g` }, { nombre: 'Masa total', valor: `${gramos(fila.gramos * n)} g` }], [k.fuenteNapolitana]);
      }
      const fila = k.molde.find(r => r.numero === d);
      if (fila) return resultado([{ nombre: 'Cada bollo', valor: `${fila.min} a ${fila.max} g` }, { nombre: 'Masa total', valor: `${gramos(fila.min * n)} a ${gramos(fila.max * n)} g` }], [k.fuenteMolde]);
      const g = k.gramosPorCm2Molde.valor * Math.PI * (d / 2) ** 2;
      return resultado([{ nombre: 'Cada bollo', valor: `${gramos(g)} g` }, { nombre: 'Masa total', valor: `${gramos(g * n)} g` }], [k.gramosPorCm2Molde.fuente]);
    }
  };
}

export function cuentaMerengue(tipos: readonly TipoDeMerengue[]): Cuenta {
  return {
    id: 'merengue', titulo: 'Merengue', descripcion: 'Cuánta azúcar, cuánto impalpable y cuánta agua de almíbar lleva un merengue francés, suizo o italiano para unos gramos de claras.',
    entradas: [
      { id: 'claras', nombre: 'Claras', tipo: 'numero', unidad: 'g', porDefecto: null },
      { id: 'tipo', nombre: 'Tipo', tipo: 'opcion', porDefecto: tipos[0]?.id ?? '', opciones: tipos.map(t => ({ valor: t.id, texto: t.nombre })) }
    ],
    calcular(v) {
      const claras = numero(v, 'claras'); const t = tipos.find(x => x.id === opcion(v, 'tipo'));
      if (!claras || !t) return null;
      const lineas: Linea[] = [{ nombre: 'Azúcar', valor: `${gramos(claras * t.azucarPorClara)} g` }];
      if (t.impalpablePorClara) lineas.push({ nombre: 'Azúcar impalpable', valor: `${gramos(claras * t.impalpablePorClara)} g` });
      if (t.aguaPorAzucarAlmibar) lineas.push({ nombre: 'Azúcar del almíbar', valor: `${gramos(claras * t.azucarAlmibarPorClara)} g` });
      if (t.aguaPorAzucarAlmibar) lineas.push({ nombre: 'Agua del almíbar', valor: `${gramos(claras * t.azucarAlmibarPorClara * t.aguaPorAzucarAlmibar)} g` });
      lineas.push({ nombre: 'Temperatura', valor: t.temperatura });
      return resultado(lineas, [t.fuente], t.nota ? [t.nota] : []);
    }
  };
}

/** Donde hierve el agua al nivel del mar, °C: de ahí se corre la tabla. */
const HERVOR_AL_NIVEL_DEL_MAR = 100;
/** Lo más bajo que hierve el agua sobre la Tierra, °C: por debajo, la lectura del termómetro está mal. */
const HERVOR_MINIMO = 70;

export function cuentaPuntoAzucar(k: typeof AZUCAR): Cuenta {
  return {
    id: 'punto-azucar', titulo: 'Puntos del azúcar', descripcion: 'A qué temperatura está cada punto del azúcar, corrido por la altitud o por donde hierve el agua.', notas: k.notas,
    entradas: [
      { id: 'referencia', nombre: 'Ajustar por', tipo: 'opcion', porDefecto: 'altitud', opciones: [{ valor: 'altitud', texto: 'La altitud' }, { valor: 'hervor', texto: 'El hervor medido' }] },
      { id: 'altitud', nombre: 'Altitud', tipo: 'numero', unidad: 'm', porDefecto: 0, visibleSi: v => opcion(v, 'referencia') !== 'hervor' },
      { id: 'hervor', nombre: 'El agua hierve a', tipo: 'numero', unidad: '°C', porDefecto: null, visibleSi: v => opcion(v, 'referencia') === 'hervor' }
    ],
    calcular(v) {
      const hervor = numero(v, 'hervor');
      const altitud = typeof v['altitud'] === 'number' && Number.isFinite(v['altitud']) && v['altitud'] >= 0 ? v['altitud'] : 0;
      const porHervor = opcion(v, 'referencia') === 'hervor';
      if (porHervor && hervor && (hervor < HERVOR_MINIMO || hervor > HERVOR_AL_NIVEL_DEL_MAR)) {
        return resultado([], [k.fuente], [`El agua hierve entre ${HERVOR_MINIMO} y ${HERVOR_AL_NIVEL_DEL_MAR} °C; revisá la lectura del termómetro.`]);
      }
      const resta = porHervor ? (hervor ? HERVOR_AL_NIVEL_DEL_MAR - hervor : null) : altitud / k.metrosPorGrado.valor;
      if (resta === null) return null;
      const t = (x: number): string => String(Math.round(x - resta));
      return {
        lineas: [], advertencias: [], fuentes: [k.fuente, k.metrosPorGrado.fuente],
        tabla: {
          columnas: ['Punto', '°C', 'Prueba en agua fría', 'Usos'],
          filas: k.puntos.map(p => [p.nombre, p.max === null ? t(p.min) : `${t(p.min)}–${t(p.max)}`, p.prueba, p.usos])
        }
      };
    }
  };
}

export const tablaDeArroz = (k: typeof ARROZ): Tabla => ({
  id: 'arroz-variedades', titulo: 'Arroz en olla',
  columnas: [{ id: 'variedad', nombre: 'Variedad' }, { id: 'partes', nombre: 'Agua (partes en volumen)' },
             { id: 'peso', nombre: 'Agua por gramo de arroz', unidad: 'g' }, { id: 'tiempo', nombre: 'Tiempo' }],
  filas: k.variedades.map(x => ({ variedad: x.nombre, partes: x.partesVolumen, peso: x.aguaPorGramo === null ? '—' : String(x.aguaPorGramo).replace('.', ','), tiempo: x.tiempo })),
  notas: k.notas, fuente: k.fuente
});

export function cuentaArroz(k: typeof ARROZ): Cuenta {
  return {
    id: 'arroz', titulo: 'Agua para el arroz', descripcion: 'Cuánta agua y cuánto tiempo lleva el arroz en olla, según la variedad y los gramos.',
    entradas: [
      { id: 'gramos', nombre: 'Arroz', tipo: 'numero', unidad: 'g', porDefecto: null },
      { id: 'variedad', nombre: 'Variedad', tipo: 'opcion', porDefecto: k.variedades[0]?.id ?? '', opciones: k.variedades.map(x => ({ valor: x.id, texto: x.nombre })) }
    ],
    calcular(v) {
      const g = numero(v, 'gramos'); const x = k.variedades.find(y => y.id === opcion(v, 'variedad'));
      if (!g || !x) return null;
      const agua = x.aguaPorGramo === null
        ? `${x.partesVolumen} partes por cada parte de arroz, en volumen`
        : `${gramos(g * x.aguaPorGramo)} g`;
      return resultado([{ nombre: 'Agua', valor: agua }, { nombre: 'Tiempo', valor: x.tiempo }], [k.fuente]);
    }
  };
}

export function cuentaAguaSalPasta(k: typeof AGUA_SAL_PASTA): Cuenta {
  return {
    id: 'agua-sal-pasta', titulo: 'Agua y sal para la pasta', descripcion: 'Cuánta agua y cuánta sal lleva la cocción de unos gramos de pasta seca.',
    entradas: [{ id: 'gramos', nombre: 'Pasta seca', tipo: 'numero', unidad: 'g', porDefecto: null }],
    calcular(v) {
      const g = numero(v, 'gramos'); if (!g) return null;
      const l = (g / 100) * k.litrosPor100g.valor;
      return resultado([{ nombre: 'Agua', valor: litros(l * 1000) }, { nombre: 'Sal', valor: `${gramos(l * k.salPorLitro.valor)} g` }],
        [k.litrosPor100g.fuente, k.salPorLitro.fuente]);
    }
  };
}

export function cuentaEspagueti(k: typeof ESPAGUETI): Cuenta {
  return {
    id: 'medidor-espagueti', titulo: 'Medidor de espagueti', descripcion: 'Cuántos gramos de espagueti hay en un atado de cierto diámetro, o qué diámetro tiene el atado de unos gramos.',
    entradas: [
      { id: 'desde', nombre: 'Tengo', tipo: 'opcion', porDefecto: 'gramos', opciones: [{ valor: 'gramos', texto: 'Los gramos' }, { valor: 'diametro', texto: 'El diámetro del atado' }] },
      { id: 'valor', nombre: 'Cantidad', tipo: 'numero', porDefecto: null }
    ],
    calcular(v) {
      const x = numero(v, 'valor'); if (!x) return null;
      const kk = k.gramosPorCm2.valor;
      const linea = opcion(v, 'desde') === 'diametro'
        ? { nombre: 'Pasta', valor: `${gramos(kk * x ** 2)} g` }
        : { nombre: 'Diámetro del atado', valor: `${(Math.round(Math.sqrt(x / kk) * 10) / 10).toString().replace('.', ',')} cm` };
      return resultado([linea], [k.gramosPorCm2.fuente]);
    }
  };
}

export function cuentaCaldo(k: typeof CALDO): Cuenta {
  return {
    id: 'caldo', titulo: 'Caldo', descripcion: 'Cuánta agua, cuánto mirepoix y cuánto tiempo lleva un caldo de ave, de vaca o de pescado para unos kilos de huesos.', notas: [k.procedimiento],
    entradas: [
      { id: 'kilos', nombre: 'Huesos', tipo: 'numero', unidad: 'kg', porDefecto: null },
      { id: 'tipo', nombre: 'Tipo', tipo: 'opcion', porDefecto: k.tipos[0]?.id ?? '', opciones: k.tipos.map(t => ({ valor: t.id, texto: t.nombre })) }
    ],
    calcular(v) {
      const kg = numero(v, 'kilos'); const t = k.tipos.find(x => x.id === opcion(v, 'tipo'));
      if (!kg || !t) return null;
      const min = kg * k.mirepoixMinPorKg.valor; const max = kg * k.mirepoixMaxPorKg.valor;
      const partes = k.reparto.cebolla + k.reparto.zanahoria + k.reparto.apio;
      const parte = (n: number): string => `${gramos((min * n) / partes)} a ${gramos((max * n) / partes)} g`;
      return resultado([
        { nombre: 'Agua', valor: litros(kg * k.aguaPorKg.valor * 1000) },
        { nombre: 'Mirepoix', valor: `${gramos(min)} a ${gramos(max)} g` },
        { nombre: 'Cebolla', valor: parte(k.reparto.cebolla) }, { nombre: 'Zanahoria', valor: parte(k.reparto.zanahoria) }, { nombre: 'Apio', valor: parte(k.reparto.apio) },
        { nombre: 'Tiempo', valor: t.tiempo }
      ], [k.aguaPorKg.fuente, k.fuente]);
    }
  };
}

// ── Conversor ──────────────────────────────────────────────────────────────

type DatosConversor = typeof CONVERSOR;
type Fija = keyof DatosConversor['unidades'];

const SIMBOLOS: readonly (readonly [number, string])[] = [[1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
const PASOS_TAZA = [0, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
const PASOS_CUCHARA = [0, 1 / 2];
const PASOS_STICK = [0, 1 / 4, 1 / 2, 3 / 4];
/** Más cucharadas que esto se miden con taza. */
const CUCHARAS_MAXIMAS = 16;
/** Por debajo de esta diferencia, una medida es exacta y no lleva «≈». */
const TOLERANCIA = 0.01;

/**
 * Una cantidad de tazas, cucharas o sticks como se mide: el entero más la
 * fracción de `pasos` más cercana, con «≈» si no es exacta. Si redondea a
 * cero, vacío: esa medida no se muestra.
 */
export function medidaPractica(n: number, pasos: readonly number[]): string {
  const entero = Math.floor(n);
  const candidatos = [...pasos.map(p => entero + p), entero + 1];
  const c = candidatos.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
  if (c === 0) return '';
  const e = Math.floor(c + 1e-9);
  const simbolo = SIMBOLOS.find(([f]) => Math.abs(c - e - f) < 1e-9)?.[1] ?? '';
  const texto = e && simbolo ? `${e} ${simbolo}` : simbolo || String(e);
  return Math.abs(c - n) < TOLERANCIA ? texto : `≈ ${texto}`;
}

/** Los ml de una medida en el nombre de una línea o de una columna: «250», «236,6». */
const mlDeMedida = (ml: number): string => String(Math.round(ml * 10) / 10).replace('.', ',');
const unDecimal = (n: number): string => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
/** «1/8», «1/16»: la fracción de cucharadita de una medida informal. */
const fraccionChica = (n: number): string => `1/${Math.round(1 / n)}`;

const mlDe = (s: Sistema, u: IngredienteConvertible['medida']['unidad']): number => s[u];
const gramosPorMl = (k: DatosConversor, i: IngredienteConvertible): number | null => {
  const s = k.sistemas.find(x => x.id === i.medida.sistema);
  return s ? i.medida.gramos / (i.medida.cantidad * mlDe(s, i.medida.unidad)) : null;
};

const UNIDADES_CONVERSOR: readonly { valor: string; texto: string }[] = [
  { valor: 'taza', texto: 'Taza' }, { valor: 'cucharada', texto: 'Cucharada' }, { valor: 'cucharadita', texto: 'Cucharadita' },
  { valor: 'ml', texto: 'ml' }, { valor: 'l', texto: 'l' }, { valor: 'fl oz', texto: 'fl oz (EE. UU.)' },
  { valor: 'g', texto: 'g' }, { valor: 'kg', texto: 'kg' }, { valor: 'oz', texto: 'oz' }, { valor: 'lb', texto: 'lb' },
  { valor: 'pinch', texto: 'pinch' }, { valor: 'dash', texto: 'dash' }, { valor: 'smidgen', texto: 'smidgen' },
  { valor: 'stick', texto: 'stick (manteca)' }
];

/** Los ml de una cantidad en una unidad de volumen, o `null` si es de peso. Anota la constante que usó. */
function mlDeEntrada(k: DatosConversor, s: Sistema, eeuu: Sistema, unidad: string, cantidad: number, usadas: Fija[]): number | null {
  switch (unidad) {
    case 'taza': case 'cucharada': case 'cucharadita': return cantidad * s[unidad];
    case 'ml': return cantidad;
    case 'l': return cantidad * 1000;
    case 'fl oz': usadas.push('flOz'); return cantidad * k.unidades.flOz.valor;
    case 'pinch': case 'dash': case 'smidgen': usadas.push(unidad); return cantidad * k.unidades[unidad].valor * eeuu.cucharadita;
    case 'stick': usadas.push('stick'); return cantidad * k.unidades.stick.valor * eeuu.taza;
    default: return null;
  }
}

function gramosDeEntrada(k: DatosConversor, unidad: string, cantidad: number, usadas: Fija[]): number | null {
  switch (unidad) {
    case 'g': return cantidad;
    case 'kg': return cantidad * 1000;
    case 'oz': case 'lb': usadas.push(unidad); return cantidad * k.unidades[unidad].valor;
    default: return null;
  }
}

function lineasDeVolumen(s: Sistema, ml: number): Linea[] {
  const lineas: Linea[] = [];
  const casera = (nombre: string, medida: number, pasos: readonly number[], tope: number): void => {
    const n = ml / medida;
    const texto = n > tope ? '' : medidaPractica(n, pasos);
    if (texto) lineas.push({ nombre: `${nombre} (${mlDeMedida(medida)} ml)`, valor: texto });
  };
  casera('Tazas', s.taza, PASOS_TAZA, Infinity);
  casera('Cucharadas', s.cucharada, PASOS_CUCHARA, CUCHARAS_MAXIMAS);
  casera('Cucharaditas', s.cucharadita, PASOS_CUCHARA, CUCHARAS_MAXIMAS);
  lineas.push({ nombre: 'ml', valor: gramos(ml) });
  return lineas;
}

/** Las oz que redondean a cero no se muestran, como una medida casera. */
function lineasDePeso(k: DatosConversor, g: number): Linea[] {
  const oz = unDecimal(g / k.unidades.oz.valor);
  return [{ nombre: 'g', valor: gramos(g) }, ...(oz === '0,0' ? [] : [{ nombre: 'oz', valor: oz }])];
}

export function cuentaConversion(k: DatosConversor): Cuenta {
  return {
    id: 'conversion', titulo: 'Conversor',
    descripcion: 'Pasa una cantidad de cocina de una unidad a las demás —tazas, cucharas, ml, gramos, onzas, sticks de manteca— según el sistema de medida y el ingrediente.',
    entradas: [
      { id: 'cantidad', nombre: 'Cantidad', tipo: 'numero', porDefecto: null },
      { id: 'unidad', nombre: 'Unidad', tipo: 'opcion', porDefecto: 'taza', opciones: UNIDADES_CONVERSOR },
      { id: 'sistema', nombre: 'Sistema', tipo: 'opcion', porDefecto: k.sistemas[0]?.id ?? '', opciones: k.sistemas.map(s => ({ valor: s.id, texto: s.nombre })) },
      { id: 'ingrediente', nombre: 'Ingrediente', tipo: 'opcion', porDefecto: '',
        opciones: [{ valor: '', texto: 'Ninguno' }, ...k.ingredientes.map(i => ({ valor: i.id, texto: i.nombre }))] }
    ],
    calcular(v) {
      const cantidad = numero(v, 'cantidad');
      const s = k.sistemas.find(x => x.id === opcion(v, 'sistema'));
      const eeuu = k.sistemas.find(x => x.id === 'eeuu');
      if (!cantidad || !s || !eeuu) return null;
      const unidad = opcion(v, 'unidad');
      const i = k.ingredientes.find(x => x.id === opcion(v, 'ingrediente'));
      if (unidad === 'stick' && i?.id !== k.ingredienteDelStick) {
        return resultado([{ nombre: 'Stick', valor: 'Es una medida de manteca: elegí Manteca' }], []);
      }
      const usadas: Fija[] = [];
      const densidad = i ? gramosPorMl(k, i) : null;
      let ml = mlDeEntrada(k, s, eeuu, unidad, cantidad, usadas);
      let g = ml === null ? gramosDeEntrada(k, unidad, cantidad, usadas) : null;
      if (ml === null && g === null) return null;
      if (densidad) {
        if (ml === null && g !== null) ml = g / densidad;
        else if (ml !== null) g = ml * densidad;
      }
      if (g !== null) usadas.push('oz');
      const lineas = [
        ...(ml !== null ? lineasDeVolumen(s, ml) : [{ nombre: 'Tazas y cucharas', valor: 'Elegí un ingrediente para pasar a volumen' }]),
        ...(g !== null ? lineasDePeso(k, g) : [{ nombre: 'Gramos', valor: 'Elegí un ingrediente para pasar a peso' }])
      ];
      if (ml !== null && i?.id === k.ingredienteDelStick) {
        usadas.push('stick');
        const sticks = medidaPractica(ml / (k.unidades.stick.valor * eeuu.taza), PASOS_STICK);
        if (sticks) lineas.push({ nombre: 'Sticks', valor: sticks });
      }
      const fuentes = [...s.fuentes, ...(i ? [i.fuente] : []), ...usadas.map(u => k.unidades[u].fuente)];
      return resultado(lineas, unicas(fuentes), k.notas.slice(0, 1));
    }
  };
}

/** Las fuentes de una tabla, una vez por link. */
const unicas = (fs: readonly FuenteAbreviada[]): FuenteAbreviada[] => fs.filter((f, n) => fs.findIndex(x => x.url === f.url) === n);

/** Los gramos por taza y por cuchara de cada ingrediente, en el sistema métrico. */
export function tablaDePesos(k: DatosConversor): Tabla {
  const m = k.sistemas.find(s => s.id === 'metrica');
  const grupos = [...new Set(k.ingredientes.map(i => i.grupo))];
  const celda = (i: IngredienteConvertible, ml: number | undefined): string => {
    const d = gramosPorMl(k, i);
    return d && ml ? gramos(d * ml) : '—';
  };
  return {
    id: 'pesos', titulo: 'Pesos por ingrediente',
    columnas: [
      { id: 'ingrediente', nombre: 'Ingrediente' },
      { id: 'taza', nombre: 'Taza', unidad: `g, ${mlDeMedida(m?.taza ?? 0)} ml` },
      { id: 'cucharada', nombre: 'Cucharada', unidad: `g, ${mlDeMedida(m?.cucharada ?? 0)} ml` },
      { id: 'cucharadita', nombre: 'Cucharadita', unidad: `g, ${mlDeMedida(m?.cucharadita ?? 0)} ml` },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    grupos: grupos.map(titulo => ({
      titulo,
      filas: k.ingredientes.filter(i => i.grupo === titulo).map(i => ({
        ingrediente: i.nombre, taza: celda(i, m?.taza), cucharada: celda(i, m?.cucharada),
        cucharadita: celda(i, m?.cucharadita), fuente: i.fuente.abreviatura
      }))
    })),
    notas: k.notas,
    fuentes: unicas(k.ingredientes.map(i => i.fuente)), columnaFuente: 'fuente'
  };
}

export function tablaDeSistemas(k: DatosConversor): Tabla {
  return {
    id: 'sistemas', titulo: 'Tazas y cucharas',
    columnas: [
      { id: 'sistema', nombre: 'Sistema' }, { id: 'taza', nombre: 'Taza', unidad: 'ml' },
      { id: 'cucharada', nombre: 'Cucharada', unidad: 'ml' }, { id: 'cucharadita', nombre: 'Cucharadita', unidad: 'ml' },
      { id: 'fuente', nombre: 'Fuente' }
    ],
    filas: k.sistemas.map(s => ({
      sistema: s.nombre, taza: mlDeMedida(s.taza), cucharada: mlDeMedida(s.cucharada),
      cucharadita: mlDeMedida(s.cucharadita), fuente: s.fuentes.map(f => f.abreviatura).join(', ')
    })),
    notas: k.sistemas.flatMap(s => s.notas ?? []),
    fuentes: unicas(k.sistemas.flatMap(s => s.fuentes)), columnaFuente: 'fuente'
  };
}

export function tablaDeMedidasEeuu(k: DatosConversor): Tabla {
  const u = k.unidades;
  const eeuu = k.sistemas.find(s => s.id === 'eeuu');
  const manteca = k.ingredientes.find(i => i.id === k.ingredienteDelStick);
  const densidad = manteca ? gramosPorMl(k, manteca) : null;
  const informal = (nombre: 'dash' | 'pinch' | 'smidgen') => ({
    medida: nombre, fuente: u[nombre].fuente.abreviatura,
    equivalencia: `${fraccionChica(u[nombre].valor)} de cucharadita${eeuu ? ` (${gramos(u[nombre].valor * eeuu.cucharadita)} ml)` : ''}`
  });
  const stickMl = eeuu ? u.stick.valor * eeuu.taza : null;
  return {
    id: 'medidas-eeuu', titulo: 'Medidas de EE. UU.',
    columnas: [{ id: 'medida', nombre: 'Medida' }, { id: 'equivalencia', nombre: 'Equivale a' }, { id: 'fuente', nombre: 'Fuente' }],
    filas: [
      { medida: 'fl oz', equivalencia: `${mlDeMedida(u.flOz.valor)} ml`, fuente: u.flOz.fuente.abreviatura },
      { medida: 'oz', equivalencia: `${mlDeMedida(u.oz.valor)} g`, fuente: u.oz.fuente.abreviatura },
      { medida: 'lb', equivalencia: `${mlDeMedida(u.lb.valor)} g`, fuente: u.lb.fuente.abreviatura },
      informal('dash'), informal('pinch'), informal('smidgen'),
      { medida: 'stick de manteca', fuente: u.stick.fuente.abreviatura,
        equivalencia: `${medidaPractica(u.stick.valor, PASOS_TAZA)} taza` +
          (stickMl && densidad ? ` = ${gramos(stickMl * densidad)} g` : '') }
    ],
    notas: k.notasMedidas,
    fuentes: unicas(Object.values(u).map(x => x.fuente)), columnaFuente: 'fuente'
  };
}
