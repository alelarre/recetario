/**
 * La calculadora de pan. **Toda su fórmula vive acá**: las tablas, las
 * constantes y las cuentas. Cambiar un porcentaje es editar este archivo y
 * nada más: la pantalla, el MCP y los tests usan lo que exporta.
 *
 * Los porcentajes son de panadero: sobre la harina total. Los valores son
 * puntos de partida, no medidas exactas: la absorción cambia entre marcas de
 * harina y la fermentación, con la temperatura.
 */
import { porNombre, positivo, type Faltante, type Pedido } from './pedido.js';
import { gramos, porciento } from './gramos.js';
import { TEMPERATURAS, type ClaveTemperatura } from './temperaturas.js';

export type ClavePan =
  | 'frances' | 'molde' | 'miga' | 'pizza-molde' | 'pizza-piedra' | 'napolitana' | 'new-york'
  | 'baguette' | 'campo' | 'ciabatta' | 'focaccia';
export type ClaveHarina = '0000' | '000' | '00' | 'semolin' | 'integral' | 'centeno';
export type Levadura = 'fresca' | 'seca';
export type ClaveFermentacion =
  | 'ambiente-2' | 'ambiente-4' | 'ambiente-8' | 'frio-12' | 'frio-24' | 'frio-48' | 'frio-72';
export type PorcentajeSegunda = 10 | 20 | 30 | 50;
export type ClavePrefermento = 'masa-madre' | 'poolish' | 'biga' | 'pate';

/**
 * Los tipos de pan. **Un tipo es un punto de partida, no una regla:** al
 * elegirlo carga su hidratación, su harina, su prefermento, su levadura y su
 * fermentación, y después se cambia lo que haga falta. Ninguno trae mezcla
 * de harinas. La `fermentacion` de un tipo con poolish o biga es la que queda
 * si se le saca el prefermento.
 *
 * Una pizza lleva además el peso sugerido del bollo, en gramos, y su cantidad
 * se pide en bollos. La hidratación de cada tipo es la de su harina. Las
 * fuentes de las pizzas están en
 * `product-design/research/herramientas/panaderia-pizza-masas.md`.
 */
export const PANES: readonly {
  clave: ClavePan; nombre: string; bollo?: number;
  hidratacion: number; harina: ClaveHarina; prefermento: ClavePrefermento | null; horasPrefermento?: number;
  levadura: Levadura; fermentacion: ClaveFermentacion;
}[] = [
  { clave: 'frances', nombre: 'Pan francés',
    hidratacion: 60, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-4' },
  { clave: 'molde', nombre: 'Pan de molde',
    hidratacion: 62, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-4' },
  { clave: 'miga', nombre: 'Pan de miga',
    hidratacion: 56, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-2' },
  // Bollo para un molde n.º 32 (comemelapizza).
  { clave: 'pizza-molde', nombre: 'Pizza al molde', bollo: 380,
    hidratacion: 61, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-4' },
  // Bollo: las fuentes van de 210 a 350 g y ninguna dice el diámetro.
  { clave: 'pizza-piedra', nombre: 'Pizza a la piedra', bollo: 250,
    hidratacion: 57, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-4' },
  // Ooni: harina 00 al 65 %, bollo para 30 cm.
  { clave: 'napolitana', nombre: 'Pizza napolitana', bollo: 250,
    hidratacion: 65, harina: '00', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-8' },
  // Ooni: 65 %, bollo para 40 cm, en frío de 24 a 72 h.
  { clave: 'new-york', nombre: 'Pizza New York', bollo: 380,
    hidratacion: 65, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'frio-24' },
  { clave: 'baguette', nombre: 'Baguette',
    hidratacion: 68, harina: '000', prefermento: 'poolish', horasPrefermento: 12, levadura: 'fresca', fermentacion: 'ambiente-4' },
  { clave: 'campo', nombre: 'Pan de campo',
    hidratacion: 72, harina: '000', prefermento: 'masa-madre', levadura: 'fresca', fermentacion: 'ambiente-8' },
  { clave: 'ciabatta', nombre: 'Ciabatta',
    hidratacion: 80, harina: '000', prefermento: 'biga', horasPrefermento: 18, levadura: 'fresca', fermentacion: 'ambiente-4' },
  { clave: 'focaccia', nombre: 'Focaccia',
    hidratacion: 75, harina: '000', prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-4' }
];

/**
 * Cuántos puntos de hidratación suma o resta cada harina, pura, contra la
 * 000. Con dos harinas el ajuste es el promedio según la proporción. Al
 * cambiar de harina, la hidratación se corre por la diferencia.
 */
export const HARINAS: readonly { clave: ClaveHarina; nombre: string; ajuste: number }[] = [
  { clave: '0000', nombre: '0000', ajuste: -4 },
  { clave: '000', nombre: '000', ajuste: 0 },
  // La de fuerza para pizza, sin nada agregado: las premezclas «para pizza» ya traen levadura.
  { clave: '00', nombre: '00', ajuste: 2 },
  { clave: 'semolin', nombre: 'Semolín', ajuste: 3 },
  { clave: 'integral', nombre: 'Integral', ajuste: 8 },
  { clave: 'centeno', nombre: 'Centeno', ajuste: 20 }
];

export const LEVADURAS: readonly { clave: Levadura; nombre: string }[] = [
  { clave: 'fresca', nombre: 'Fresca' },
  { clave: 'seca', nombre: 'Seca' }
];

/**
 * El tiempo total de fermentación —primera fermentación y apresto— y cuánta
 * levadura fresca o masa madre (al 100 % de hidratación) pide, con el
 * ambiente entre 18 y 24 °C. Con masa madre no hay 2 h: no le alcanza el
 * tiempo para levar.
 */
export const FERMENTACIONES: readonly {
  clave: ClaveFermentacion; modo: 'ambiente' | 'frio'; horas: number; fresca: number; masaMadre: number | null;
}[] = [
  { clave: 'ambiente-2', modo: 'ambiente', horas: 2, fresca: 2, masaMadre: null },
  { clave: 'ambiente-4', modo: 'ambiente', horas: 4, fresca: 1.2, masaMadre: 20 },
  { clave: 'ambiente-8', modo: 'ambiente', horas: 8, fresca: 0.5, masaMadre: 10 },
  { clave: 'frio-12', modo: 'frio', horas: 12, fresca: 0.6, masaMadre: 15 },
  { clave: 'frio-24', modo: 'frio', horas: 24, fresca: 0.4, masaMadre: 15 },
  { clave: 'frio-48', modo: 'frio', horas: 48, fresca: 0.2, masaMadre: 8 },
  { clave: 'frio-72', modo: 'frio', horas: 72, fresca: 0.1, masaMadre: 5 }
];

/**
 * Por cuánto se multiplica la levadura —o la masa madre— de la tabla según la
 * temperatura del ambiente, para que las horas se cumplan: cada 10 °C menos,
 * el doble (doughrise). Cada franja se toma por su medio —10, 15, 21 y
 * 27 °C— contra el de la tabla. Vale para lo que fermenta a temperatura
 * ambiente: la masa, si no va a la heladera, y el poolish o la pâte
 * fermentée. En frío manda la heladera, y la biga pide su lugar a 18 °C.
 */
export const LEVADURA_POR_TEMPERATURA: Readonly<Record<ClaveTemperatura, number>> = {
  'menos-13': 2,
  '13-18': 1.5,
  '18-24': 1,
  'mas-24': 0.65
};

export const PORCENTAJES_SEGUNDA: readonly PorcentajeSegunda[] = [10, 20, 30, 50];
/** La harina con que arranca la mezcla al encenderla. */
export const SEGUNDA_POR_DEFECTO: ClaveHarina = 'integral';

/**
 * Los prefermentos con levadura comercial: qué parte de la harina total va al
 * prefermento, su hidratación y su sal (sobre su harina), y la levadura fresca
 * según sus horas, también sobre su harina. Salen de la harina principal, del
 * agua y de la sal del pan, que no cambian: se reparten en dos momentos.
 *
 * En poolish y biga toda la levadura va en el prefermento, y la masa final no
 * suma más. La pâte fermentée da sabor y no levado: la masa final suma la
 * levadura de la tabla de fermentación. `ambiente` dice si el prefermento
 * fermenta a la temperatura de la cocina, y entonces su levadura se ajusta
 * con ella (`LEVADURA_POR_TEMPERATURA`). `titulo` y `descripcion` son la
 * explicación que se despliega debajo del elegido. Las fuentes de cada valor están en
 * `product-design/research/herramientas/panaderia-pizza-masas.md`.
 */
export const PREFERMENTOS_CON_LEVADURA: readonly {
  clave: Exclude<ClavePrefermento, 'masa-madre'>; nombre: string; harina: number; hidratacion: number; sal: number;
  horas: readonly { horas: number; fresca: number }[]; levaduraFinal: boolean; ambiente: boolean; advertencia: string;
  titulo: string; descripcion: string;
}[] = [
  // Bianco Lievito: 20 a 40 % de la harina; levadura a 23 °C.
  { clave: 'poolish', nombre: 'Poolish', harina: 30, hidratacion: 100, sal: 0,
    horas: [{ horas: 8, fresca: 0.75 }, { horas: 12, fresca: 0.2 }, { horas: 18, fresca: 0.1 }],
    levaduraFinal: false, ambiente: true,
    advertencia: 'El poolish fermenta a temperatura ambiente. La masa final no lleva levadura: leva con la del poolish.',
    titulo: 'Qué es el poolish',
    descripcion: 'Una mezcla líquida de harina y agua en partes iguales, con muy poca levadura, que se prepara de 8 a 18 horas ' +
      'antes y fermenta a temperatura ambiente. Suma sabor y hace la masa más fácil de estirar. Lleva toda la levadura del pan.' },
  // Bianco Lievito, biga corta: 30 a 50 % de la harina; 16 a 20 h a 18 °C.
  { clave: 'biga', nombre: 'Biga', harina: 40, hidratacion: 44, sal: 0,
    horas: [{ horas: 18, fresca: 1 }], levaduraFinal: false, ambiente: false,
    advertencia: 'La biga fermenta de 16 a 20 h a unos 18 °C. La masa final no lleva levadura: leva con la de la biga.',
    titulo: 'Qué es la biga',
    descripcion: 'Una masa firme, con poca agua y levadura, que se prepara de 16 a 20 horas antes y fermenta en un lugar ' +
      'fresco, a unos 18 °C. Suma sabor y le da fuerza a la masa. Lleva toda la levadura del pan.' },
  // King Arthur: 0,1 % de instantánea, que es 0,3 % de fresca; 14 h a temperatura ambiente.
  { clave: 'pate', nombre: 'Pâte fermentée', harina: 27, hidratacion: 68, sal: 1.4,
    horas: [{ horas: 14, fresca: 0.3 }], levaduraFinal: true, ambiente: true,
    advertencia: 'La pâte fermentée fermenta unas 14 h a temperatura ambiente. La masa final lleva su propia levadura.',
    titulo: 'Qué es la pâte fermentée',
    descripcion: 'Masa de pan ya fermentada —harina, agua, sal y levadura—: un pedazo guardado de la tanda anterior, o ' +
      'preparada unas 14 horas antes. Suma sabor, pero no leva el pan: la masa final lleva su propia levadura.' }
];

/**
 * Lo que se elige como prefermento. La masa madre es uno más: leva el pan
 * sola, sin levadura, y su cantidad sale de la tabla de fermentación.
 */
export const PREFERMENTOS: readonly { clave: ClavePrefermento; nombre: string; titulo: string; descripcion: string }[] = [
  { clave: 'masa-madre', nombre: 'Masa madre',
    titulo: 'Qué es la masa madre',
    descripcion: 'Un cultivo de harina y agua que se mantiene vivo alimentándolo, con sus propias levaduras y bacterias. ' +
      'Leva el pan sola, sin levadura, y le da acidez. Acá se cuenta al 100 % de hidratación: la mitad de su peso es ' +
      'harina y la mitad, agua.' },
  ...PREFERMENTOS_CON_LEVADURA
];

/** Los bollos con que arranca una pizza si no había. */
export const BOLLOS_POR_DEFECTO = 4;

/** La sal, % de la harina total. */
export const SAL = 2;
/** La seca (instantánea) es más concentrada: va la fresca dividida por esto. */
export const DIVISOR_SECA = 3;
/** Con qué porcentaje arranca la mezcla al encenderla. */
export const PORCENTAJE_SEGUNDA_POR_DEFECTO: PorcentajeSegunda = 30;
/** Más agua que esto no se maneja con estas harinas: la cuenta se topea acá. */
export const HIDRATACION_MAXIMA = 85;

export const ADVERTENCIA_TIEMPOS = 'Los tiempos son totales: primera fermentación y apresto.';
export const ADVERTENCIA_AMBIENTE = 'La levadura o la masa madre va según la temperatura del ambiente: con más frío, más; con más calor, menos.';
/** La cuenta de la temperatura es de doughrise, que avisa dónde deja de valer. */
export const ADVERTENCIA_MUY_FRIO = 'Por debajo de 10 °C esta cuenta deja de valer: la masa casi no fermenta.';
export const ADVERTENCIA_FRIO = 'En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después de la heladera.';
export const AVISO_TOPE = 'La hidratación se limitó a 85 %.';

export interface DatosPan {
  /** El tipo del que se partió. `null`: un pedido del agente con todos los datos y sin tipo. */
  pan: ClavePan | null;
  harina: ClaveHarina;
  segunda: ClaveHarina | null;
  /** Sin segunda harina no se usa. */
  porcentajeSegunda: PorcentajeSegunda;
  /** En %, sobre la harina total. Lo que pase del tope se cuenta como el tope. */
  hidratacion: number;
  /** `null` es un pan directo, sólo con levadura. */
  prefermento: ClavePrefermento | null;
  /** Fresca o seca. Con masa madre no se usa. */
  levadura: Levadura;
  fermentacion: ClaveFermentacion;
  /** La del ambiente. Cuenta sólo con la fermentación a temperatura ambiente. */
  temperatura: ClaveTemperatura;
  cantidad: CantidadPan;
  /** Las horas de un prefermento con levadura, una de las de su tabla. */
  horasPrefermento: number;
}

/** Un pan se pide por la harina o la masa total; una pizza, en bollos y gramos por bollo. */
export type CantidadPan =
  | { de: 'harina' | 'masa'; gramos: number }
  | { de: 'bollos'; bollos: number; gramos: number };

/** Lo que lleva el prefermento, en gramos. */
export interface ResultadoPrefermento {
  harina: number;
  agua: number;
  sal: number;
  levadura: number;
}

export interface ResultadoPan {
  /** Con prefermento, lo suyo; las harinas, el agua, la sal y la levadura son entonces las de la masa final. */
  prefermento: ResultadoPrefermento | null;
  /** Una por harina. Con masa madre, lo que se agrega aparte de la que trae ella. */
  harinas: { clave: ClaveHarina; nombre: string; gramos: number }[];
  /** Con masa madre, el agua a agregar. */
  agua: number;
  sal: number;
  /** La levadura fresca o seca, o la masa madre. */
  levadura: number;
  hidratacion: number;
  topeada: boolean;
  /** Toda la harina, con la de la masa madre. */
  harinaTotal: number;
  masaTotal: number;
}

function buscar<T extends { clave: string }>(tabla: readonly T[], clave: T['clave']): T {
  const fila = tabla.find(f => f.clave === clave);
  if (!fila) throw new Error(`Opción desconocida: ${clave}`);
  return fila;
}

export const fermentacionesPara = (prefermento: ClavePrefermento | null): typeof FERMENTACIONES =>
  FERMENTACIONES.filter(f => prefermento !== 'masa-madre' || f.masaMadre !== null);

type ConLevadura = (typeof PREFERMENTOS_CON_LEVADURA)[number];

/** El prefermento con levadura elegido, o `null` si no hay o es la masa madre. */
export const prefermentoConLevadura = (clave: ClavePrefermento | null): ConLevadura | null =>
  PREFERMENTOS_CON_LEVADURA.find(p => p.clave === clave) ?? null;

const prefermentoDe = (d: DatosPan): ConLevadura | null => prefermentoConLevadura(d.prefermento);

/** Las horas del prefermento elegidas, o las primeras de su tabla. */
const horasDe = (pref: ConLevadura, horas: number) =>
  pref.horas.find(h => h.horas === horas) ?? pref.horas[0] ?? { horas: 0, fresca: 0 };

/**
 * Si se ofrecen la fermentación y las horas de la tabla: con masa madre, sin
 * prefermento o con uno que deja a la masa final su propia levadura.
 */
export const conFermentacion = (d: DatosPan): boolean => prefermentoDe(d)?.levaduraFinal ?? true;

/** Si la masa fermenta afuera de la heladera, con la levadura o la masa madre de la tabla. */
const masaAlAmbiente = (d: DatosPan): boolean =>
  conFermentacion(d) && buscar(FERMENTACIONES, d.fermentacion).modo === 'ambiente';

/**
 * Si cuenta la temperatura del ambiente: cuando algo fermenta a la
 * temperatura de la cocina, sea la masa o el prefermento.
 */
export const conTemperatura = (d: DatosPan): boolean => masaAlAmbiente(d) || (prefermentoDe(d)?.ambiente ?? false);

/** Si hay que elegir levadura: siempre, salvo con masa madre. */
export const conLevadura = (d: DatosPan): boolean => d.prefermento !== 'masa-madre';

/** La harina que se suma al encender la mezcla: la de por defecto, o la primera que no sea la principal. */
export const segundaAlMezclar = (harina: ClaveHarina): ClaveHarina =>
  harina !== SEGUNDA_POR_DEFECTO ? SEGUNDA_POR_DEFECTO : HARINAS.find(h => h.clave !== harina)?.clave ?? SEGUNDA_POR_DEFECTO;

/** El peso sugerido del bollo, o `null` si el pan no es una pizza. */
export const bolloDe = (pan: ClavePan | null): number | null => PANES.find(p => p.clave === pan)?.bollo ?? null;

/** El ajuste de hidratación de una harina o de una mezcla, ponderado por la proporción. */
function ajusteDe({ harina, segunda, porcentajeSegunda }: Pick<DatosPan, 'harina' | 'segunda' | 'porcentajeSegunda'>): number {
  const p = segunda ? porcentajeSegunda / 100 : 0;
  return buscar(HARINAS, harina).ajuste * (1 - p) + (segunda ? buscar(HARINAS, segunda).ajuste * p : 0);
}

/** Un decimal: la suma de ajustes no deja colas de punto flotante en el campo. */
const aUnDecimal = (n: number): number => Math.round(n * 10) / 10;

/**
 * La hidratación al cambiar la harina o la mezcla: se corre por la diferencia
 * de absorción entre las harinas de antes y las de ahora. Lo que se ajustó a
 * mano se conserva.
 */
export function hidratacionAlCambiarHarinas(
  antes: Pick<DatosPan, 'hidratacion' | 'harina' | 'segunda' | 'porcentajeSegunda'>,
  ahora: Pick<DatosPan, 'harina' | 'segunda' | 'porcentajeSegunda'>
): number {
  return aUnDecimal(antes.hidratacion + ajusteDe(ahora) - ajusteDe(antes));
}

/**
 * Los datos al elegir un tipo: todo vuelve a lo que trae el tipo. No son
 * parte del tipo, y se conservan, la temperatura del ambiente y la cantidad
 * —que pasa a bollos si es una pizza, y a gramos si no—.
 */
export function alElegirTipo(antes: Pick<DatosPan, 'pan' | 'cantidad' | 'temperatura'>, pan: ClavePan): DatosPan {
  const tipo = buscar(PANES, pan);
  return {
    pan, harina: tipo.harina, segunda: null, porcentajeSegunda: PORCENTAJE_SEGUNDA_POR_DEFECTO,
    hidratacion: tipo.hidratacion, prefermento: tipo.prefermento, levadura: tipo.levadura,
    fermentacion: tipo.fermentacion, temperatura: antes.temperatura,
    cantidad: cantidadAlCambiar(antes, pan), horasPrefermento: tipo.horasPrefermento ?? 0
  };
}

const esPositivo = (n: number): boolean => Number.isFinite(n) && n > 0;

/**
 * La cantidad al pasar a otro pan. Una pizza conserva los bollos y toma el
 * peso sugerido de su estilo; al pasar de una pizza a un pan, se conserva la
 * masa total.
 */
export function cantidadAlCambiar(antes: Pick<DatosPan, 'pan' | 'cantidad'>, pan: ClavePan): CantidadPan {
  if (pan === antes.pan) return antes.cantidad;
  const c = antes.cantidad;
  const bollo = bolloDe(pan);
  if (bollo !== null) return { de: 'bollos', bollos: c.de === 'bollos' ? c.bollos : BOLLOS_POR_DEFECTO, gramos: bollo };
  return c.de === 'bollos' ? { de: 'masa', gramos: c.bollos * c.gramos } : c;
}

/** Las cantidades, o `null` si la cantidad pedida o la hidratación no son un número positivo. */
export function calcularPan(d: DatosPan): ResultadoPan | null {
  const c = d.cantidad;
  if (!esPositivo(c.gramos) || (c.de === 'bollos' && !esPositivo(c.bollos)) || !esPositivo(d.hidratacion)) return null;
  const masaPedida = c.de === 'bollos' ? c.bollos * c.gramos : c.gramos;
  const fermentacion = buscar(FERMENTACIONES, d.fermentacion);
  const p = d.segunda ? d.porcentajeSegunda / 100 : 0;
  const sinTope = d.hidratacion;
  const hidratacion = Math.min(sinTope, HIDRATACION_MAXIMA);
  const conMasaMadre = d.prefermento === 'masa-madre';

  const pref = prefermentoDe(d);
  const seca = (fresca: number): number => (d.levadura === 'seca' ? fresca / DIVISOR_SECA : fresca);
  // La levadura de cada parte, en % de la harina total: la del prefermento
  // va sobre su harina; la de la masa final, sobre la total.
  const factor = LEVADURA_POR_TEMPERATURA[d.temperatura];
  const pctPrefermento = pref
    ? seca(horasDe(pref, d.horasPrefermento).fresca) * (pref.ambiente ? factor : 1) * pref.harina / 100 : 0;
  const porTemperatura = masaAlAmbiente(d) ? factor : 1;
  const pctFinal = conMasaMadre || (pref && !pref.levaduraFinal) ? 0 : seca(fermentacion.fresca) * porTemperatura;
  // Con masa madre la levadura no suma a la masa: su harina y su agua ya
  // están contadas en la harina total y en el agua.
  const pctLevadura = pctPrefermento + pctFinal;
  const H = c.de === 'harina'
    ? c.gramos
    : masaPedida / (1 + (hidratacion + SAL + pctLevadura) / 100);
  const agua = H * hidratacion / 100;
  const sal = H * SAL / 100;
  // Si llegara 2 h con masa madre, se toma la de 4 h: es lo mínimo que se ofrece.
  const pctMasaMadre = (fermentacion.masaMadre ?? buscar(FERMENTACIONES, 'ambiente-4').masaMadre ?? 0) * porTemperatura;
  const masaMadre = conMasaMadre ? H * pctMasaMadre / 100 : 0;
  const harinaAAgregar = H - masaMadre / 2;
  // El prefermento sale de la harina principal: la segunda va entera a la masa final.
  const prefermento: ResultadoPrefermento | null = pref ? {
    harina: H * pref.harina / 100,
    agua: H * pref.harina / 100 * pref.hidratacion / 100,
    sal: H * pref.harina / 100 * pref.sal / 100,
    levadura: H * pctPrefermento / 100
  } : null;
  const harinas = [{ clave: d.harina, proporcion: 1 - p }, ...(d.segunda ? [{ clave: d.segunda, proporcion: p }] : [])]
    .map(({ clave, proporcion }, i) => ({
      clave, nombre: buscar(HARINAS, clave).nombre,
      gramos: harinaAAgregar * proporcion - (i === 0 && prefermento ? prefermento.harina : 0)
    }));

  return {
    prefermento,
    harinas,
    agua: agua - masaMadre / 2 - (prefermento?.agua ?? 0),
    sal: sal - (prefermento?.sal ?? 0),
    levadura: conMasaMadre ? masaMadre : H * pctFinal / 100,
    hidratacion,
    topeada: sinTope > HIDRATACION_MAXIMA,
    harinaTotal: H,
    masaTotal: H + agua + sal + H * pctLevadura / 100
  };
}

/** Lo que manda el agente por el MCP, con los datos por su nombre. */
export interface PedidoPan {
  /** El tipo. Con él, lo que no venga sale de lo que trae el tipo. */
  pan?: string | undefined;
  harina?: string | undefined;
  /** `ninguna` o una harina distinta de la principal. */
  segunda_harina?: string | undefined;
  porcentaje_segunda?: number | undefined;
  /** En %, sobre la harina total. */
  hidratacion?: number | undefined;
  /** `ninguno` o uno de la tabla, la masa madre incluida. */
  prefermento?: string | undefined;
  horas_prefermento?: number | undefined;
  levadura?: string | undefined;
  /** `ambiente` o `frío`. */
  fermentacion?: string | undefined;
  horas?: number | undefined;
  /** La del ambiente, una de las franjas. */
  temperatura?: string | undefined;
  harina_total?: number | undefined;
  masa_total?: number | undefined;
  /** En una pizza, la cantidad es bollos y gramos por bollo. */
  bollos?: number | undefined;
  peso_bollo?: number | undefined;
}

const MODOS = [{ clave: 'ambiente', nombre: 'Ambiente' }, { clave: 'frio', nombre: 'Frío' }] as const;
const NINGUNA = [{ clave: 'ninguna', nombre: 'Ninguna' }];
const NINGUNO = [{ clave: 'ninguno', nombre: 'Ninguno' }];

/**
 * Los datos de un pedido del MCP, o lo que falta con sus opciones.
 *
 * **Con el tipo, lo que no viene sale de lo que trae el tipo**, como en la
 * pantalla, y lo que viene lo pisa. Sin el tipo no hay de dónde completar:
 * hacen falta todos los datos, y entre lo que falta va el tipo, que es la
 * forma corta de darlos.
 *
 * Nunca salen del tipo la cantidad ni la temperatura del ambiente —sí los
 * gramos por bollo de una pizza—. Tampoco lo que depende de un dato que se
 * cambió: el porcentaje de una segunda harina, las horas de otro prefermento
 * y las horas que no van con el modo o el prefermento pedidos. La hidratación
 * que no viene es la del tipo, corrida por las harinas pedidas.
 *
 * Un dato cuyas opciones dependen de otro que falta no se pide todavía: la
 * segunda harina espera a la principal; las horas, al prefermento y al modo;
 * y la cantidad al tipo, porque una pizza se pide en bollos. La levadura, la
 * fermentación y la temperatura dejan de pedirse cuando lo elegido no las
 * usa: la masa madre no lleva levadura, con poolish o biga la masa final no
 * tiene fermentación que elegir, y la temperatura del ambiente no cuenta con
 * la masa en frío —salvo que el prefermento fermente a temperatura
 * ambiente— ni con biga.
 */
export function leerPedidoPan(p: PedidoPan): Pedido<DatosPan> {
  const faltan: Faltante[] = [];
  const falta = (dato: string, opciones: readonly string[]): void => { faltan.push({ dato, opciones }); };

  const tipo = porNombre(PANES, p.pan);
  // Un tipo que no existe se corrige antes que nada: de él sale todo lo demás.
  if (p.pan !== undefined && !tipo) return { faltan: [{ dato: 'pan', opciones: PANES.map(x => x.nombre) }] };

  const harina = p.harina === undefined ? (tipo ? buscar(HARINAS, tipo.harina) : null) : porNombre(HARINAS, p.harina);
  if (!harina) falta('harina', HARINAS.map(x => x.nombre));

  const posiblesSegundas = HARINAS.filter(x => x.clave !== harina?.clave);
  const sinSegunda = p.segunda_harina === undefined ? !!tipo : !!porNombre(NINGUNA, p.segunda_harina);
  const segunda = sinSegunda ? null : porNombre(posiblesSegundas, p.segunda_harina);
  if (harina && !sinSegunda && !segunda) falta('segunda_harina', ['Ninguna', ...posiblesSegundas.map(x => x.nombre)]);
  const porcentaje = PORCENTAJES_SEGUNDA.find(x => x === p.porcentaje_segunda);
  if (segunda && !porcentaje) falta('porcentaje_segunda', PORCENTAJES_SEGUNDA.map(String));

  const hidratacion = p.hidratacion !== undefined ? positivo(p.hidratacion)
    : tipo && harina
      ? hidratacionAlCambiarHarinas(
          { hidratacion: tipo.hidratacion, harina: tipo.harina, segunda: null, porcentajeSegunda: PORCENTAJE_SEGUNDA_POR_DEFECTO },
          { harina: harina.clave, segunda: segunda?.clave ?? null, porcentajeSegunda: porcentaje ?? PORCENTAJE_SEGUNDA_POR_DEFECTO })
      : null;
  if (hidratacion === null && (p.hidratacion !== undefined || !tipo)) falta('hidratacion', []);

  const sinPrefermento = p.prefermento === undefined ? tipo?.prefermento === null : !!porNombre(NINGUNO, p.prefermento);
  const elegido = sinPrefermento ? null
    : p.prefermento === undefined ? PREFERMENTOS.find(x => x.clave === tipo?.prefermento) ?? null
    : porNombre(PREFERMENTOS, p.prefermento);
  const sabePrefermento = sinPrefermento || !!elegido;
  if (!sabePrefermento) falta('prefermento', ['Ninguno', ...PREFERMENTOS.map(x => x.nombre)]);
  const pref = prefermentoConLevadura(elegido?.clave ?? null);
  // Las horas del tipo valen sólo para su prefermento.
  const horasPedidas = p.horas_prefermento ?? (tipo?.prefermento === pref?.clave ? tipo?.horasPrefermento : undefined);
  const horasPrefermento = pref?.horas.length === 1 ? pref.horas[0] : pref?.horas.find(h => h.horas === horasPedidas);
  if (pref && !horasPrefermento) falta('horas_prefermento', pref.horas.map(h => String(h.horas)));

  // La masa madre no lleva levadura.
  const pideLevadura = elegido?.clave !== 'masa-madre';
  const levadura = p.levadura === undefined ? (tipo ? buscar(LEVADURAS, tipo.levadura) : null) : porNombre(LEVADURAS, p.levadura);
  if (pideLevadura && !levadura) falta('levadura', LEVADURAS.map(x => x.nombre));

  // Sin levadura en la masa final, no hay fermentación que elegir.
  const conTabla = !pref || pref.levaduraFinal;
  const delTipo = tipo ? buscar(FERMENTACIONES, tipo.fermentacion) : null;
  const modo = !conTabla ? null
    : p.fermentacion === undefined ? MODOS.find(m => m.clave === delTipo?.modo) ?? null
    : porNombre(MODOS, p.fermentacion);
  if (conTabla && !modo) falta('fermentacion', MODOS.map(x => x.nombre));
  // Las horas esperan al prefermento: con masa madre no van las 2 h. Las del
  // tipo valen si van con el modo y el prefermento pedidos.
  const posibles = modo && sabePrefermento ? fermentacionesPara(elegido?.clave ?? null).filter(f => f.modo === modo.clave) : [];
  const fermentacion = !conTabla ? delTipo ?? buscar(FERMENTACIONES, PAN_POR_DEFECTO.fermentacion)
    : p.horas !== undefined ? posibles.find(f => f.horas === p.horas)
    : posibles.find(f => f.clave === delTipo?.clave);
  if (modo && sabePrefermento && !fermentacion) falta('horas', posibles.map(f => String(f.horas)));

  // Sin el tipo y con datos por completar, el tipo es lo primero que falta:
  // con él, el resto sale solo.
  const sinTipoEIncompleto = !tipo && faltan.length > 0;
  if (sinTipoEIncompleto) faltan.unshift({ dato: 'pan', opciones: PANES.map(x => x.nombre) });

  const temperatura = porNombre(TEMPERATURAS, p.temperatura);
  const pideTemperatura = (pref?.ambiente ?? false) || (conTabla && modo?.clave !== 'frio');
  if (pideTemperatura && !temperatura) falta('temperatura', TEMPERATURAS.map(x => x.nombre));

  const bollo = bolloDe(tipo?.clave ?? null);
  const bollos = positivo(p.bollos);
  const harinaTotal = positivo(p.harina_total);
  const masaTotal = positivo(p.masa_total);
  let cantidad: CantidadPan | null = null;
  if (tipo && bollo !== null) {
    // Una pizza va en bollos; los gramos por bollo que no vienen son los del tipo.
    const gramos = p.peso_bollo === undefined ? bollo : positivo(p.peso_bollo);
    if (bollos === null) falta('bollos', []);
    if (gramos === null) falta('peso_bollo', [String(bollo)]);
    if (bollos !== null && gramos !== null) cantidad = { de: 'bollos', bollos, gramos };
  } else if (!tipo && bollos !== null && positivo(p.peso_bollo) !== null && p.harina_total === undefined && p.masa_total === undefined) {
    cantidad = { de: 'bollos', bollos, gramos: positivo(p.peso_bollo) ?? 0 };
  } else if (harinaTotal !== null && p.masa_total === undefined) {
    cantidad = { de: 'harina', gramos: harinaTotal };
  } else if (masaTotal !== null && p.harina_total === undefined) {
    cantidad = { de: 'masa', gramos: masaTotal };
  } else if (tipo || !sinTipoEIncompleto) {
    falta('cantidad', ['harina_total', 'masa_total']);
  }

  if (faltan.length || !harina || (!sinSegunda && !segunda) || hidratacion === null || !fermentacion || !cantidad) return { faltan };
  return {
    datos: {
      pan: tipo?.clave ?? null, harina: harina.clave, segunda: segunda?.clave ?? null,
      porcentajeSegunda: porcentaje ?? PORCENTAJE_SEGUNDA_POR_DEFECTO,
      hidratacion,
      prefermento: elegido?.clave ?? null,
      levadura: levadura?.clave ?? PAN_POR_DEFECTO.levadura,
      fermentacion: fermentacion.clave,
      temperatura: temperatura?.clave ?? PAN_POR_DEFECTO.temperatura,
      cantidad,
      horasPrefermento: horasPrefermento?.horas ?? 0
    }
  };
}

/** El tipo con que arranca la calculadora. */
const TIPO_POR_DEFECTO: ClavePan = 'campo';

/** Lo que muestra la calculadora la primera vez: el tipo de por defecto, con 1 kg de harina. */
export const PAN_POR_DEFECTO: DatosPan = alElegirTipo(
  { pan: TIPO_POR_DEFECTO, cantidad: { de: 'harina', gramos: 1000 }, temperatura: '18-24' }, TIPO_POR_DEFECTO);

const deLaTabla = <T extends { clave: string }>(tabla: readonly T[], valor: unknown): T['clave'] | undefined =>
  tabla.find(f => f.clave === valor)?.clave;

/**
 * Las últimas elecciones guardadas, dato por dato: lo que no se puede leer o
 * ya no es una opción vuelve a lo que trae el tipo guardado, y el resto se
 * conserva. También corrige las combinaciones que no van: la segunda igual a
 * la principal, las 2 h con masa madre, una cantidad que no es la del pan
 * —una pizza va en bollos; un pan, en harina o masa— y unas horas que no son
 * de su prefermento.
 */
export function completarPan(guardado: unknown): DatosPan {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const pan = deLaTabla(PANES, g['pan']) ?? TIPO_POR_DEFECTO;
  const d = alElegirTipo({ ...PAN_POR_DEFECTO, pan }, pan);
  const harina = deLaTabla(HARINAS, g['harina']) ?? d.harina;
  const segunda = deLaTabla(HARINAS, g['segunda']);
  // «Ninguno» se guarda como `null`: no es un dato que falte.
  const prefermento = g['prefermento'] === null ? null : deLaTabla(PREFERMENTOS, g['prefermento']) ?? d.prefermento;
  const pref = prefermentoConLevadura(prefermento);
  const posibles = fermentacionesPara(prefermento);
  const fermentacion = deLaTabla(posibles, g['fermentacion'])
    ?? (g['fermentacion'] === 'ambiente-2' ? 'ambiente-4' : deLaTabla(posibles, d.fermentacion) ?? 'ambiente-4');
  const c = typeof g['cantidad'] === 'object' && g['cantidad'] !== null ? g['cantidad'] as Record<string, unknown> : {};
  const numero = (x: unknown): number | null => (typeof x === 'number' && esPositivo(x) ? x : null);
  const gramos = numero(c['gramos']);
  const bollos = numero(c['bollos']);
  const leida: CantidadPan | null = gramos === null ? null
    : c['de'] === 'harina' || c['de'] === 'masa' ? { de: c['de'], gramos }
    : c['de'] === 'bollos' && bollos !== null ? { de: 'bollos', bollos, gramos }
    : null;
  const bollo = bolloDe(pan);
  const cantidad: CantidadPan = bollo !== null
    ? (leida?.de === 'bollos' ? leida : { de: 'bollos', bollos: BOLLOS_POR_DEFECTO, gramos: bollo })
    : leida === null ? PAN_POR_DEFECTO.cantidad
    : leida.de === 'bollos' ? { de: 'masa', gramos: leida.bollos * leida.gramos }
    : leida;
  // Las horas del tipo valen sólo para su prefermento.
  const horas = numero(g['horasPrefermento']) ?? (prefermento === d.prefermento ? d.horasPrefermento : 0);
  return {
    pan,
    harina,
    segunda: segunda && segunda !== harina ? segunda : null,
    porcentajeSegunda: PORCENTAJES_SEGUNDA.find(x => x === g['porcentajeSegunda']) ?? d.porcentajeSegunda,
    hidratacion: numero(g['hidratacion']) ?? d.hidratacion,
    prefermento,
    levadura: deLaTabla(LEVADURAS, g['levadura']) ?? d.levadura,
    fermentacion,
    temperatura: deLaTabla(TEMPERATURAS, g['temperatura']) ?? PAN_POR_DEFECTO.temperatura,
    cantidad,
    horasPrefermento: pref ? horasDe(pref, horas).horas : 0
  };
}

const NOMBRE_LEVADURA: Record<Levadura, string> = { fresca: 'Levadura fresca', seca: 'Levadura seca' };

type Linea = { nombre: string; valor: string };

/**
 * Lo que se destaca del resultado: la masa total y la hidratación, que son
 * las del pan entero aunque haya prefermento. Sin resultado, guiones.
 */
export function cifrasPan(d: DatosPan): Linea[] {
  const r = calcularPan(d);
  return [
    { nombre: 'Masa total', valor: r ? `${gramos(r.masaTotal)} g` : '—' },
    { nombre: 'Hidratación', valor: r ? porciento(r.hidratacion) : '—' }
  ];
}

/**
 * El resultado como se muestra, una línea por ingrediente: lo usan la
 * pantalla y el MCP, así dicen lo mismo. Sin resultado, cada valor es un
 * guion. Con un prefermento con levadura son las de la masa final, sin la
 * levadura si va toda en el prefermento. Con masa madre, la harina y el agua
 * son lo que se agrega aparte de lo que trae ella.
 */
export function lineasPan(d: DatosPan): Linea[] {
  const r = calcularPan(d);
  const conMasaMadre = d.prefermento === 'masa-madre';
  const aAgregar = conMasaMadre ? ' a agregar' : '';
  const g = (valor: number | undefined): string => (r && valor !== undefined ? `${gramos(valor)} g` : '—');
  return [
    ...(r ? r.harinas.map(h => ({ nombre: `Harina ${h.nombre}${aAgregar}`, valor: g(h.gramos) })) : [{ nombre: 'Harina', valor: '—' }]),
    { nombre: `Agua${aAgregar}`, valor: g(r?.agua) },
    { nombre: 'Sal', valor: g(r?.sal) },
    ...(conMasaMadre ? [{ nombre: 'Masa madre', valor: g(r?.levadura) }]
      : conFermentacion(d) ? [{ nombre: NOMBRE_LEVADURA[d.levadura], valor: g(r?.levadura) }] : [])
  ];
}

/** Las líneas de un prefermento con levadura, o ninguna si no hay. Sin resultado, guiones. */
export function lineasPrefermento(d: DatosPan): Linea[] {
  const pref = prefermentoDe(d);
  if (!pref) return [];
  const r = calcularPan(d)?.prefermento;
  const g = (valor: number | undefined): string => (r && valor !== undefined ? `${gramos(valor)} g` : '—');
  return [
    { nombre: `Harina ${buscar(HARINAS, d.harina).nombre}`, valor: g(r?.harina) },
    { nombre: 'Agua', valor: g(r?.agua) },
    ...(pref.sal ? [{ nombre: 'Sal', valor: g(r?.sal) }] : []),
    { nombre: NOMBRE_LEVADURA[d.levadura], valor: g(r?.levadura) }
  ];
}

/**
 * Los datos con que se hizo la cuenta, dichos como en la pantalla. Es lo que
 * el agente muestra junto al resultado: con el tipo, parte no la pidió nadie.
 */
export function datosUsados(d: DatosPan): Linea[] {
  const pref = prefermentoDe(d);
  const fermentacion = buscar(FERMENTACIONES, d.fermentacion);
  const harinas = buscar(HARINAS, d.harina).nombre +
    (d.segunda ? ` con ${d.porcentajeSegunda} % de ${buscar(HARINAS, d.segunda).nombre}` : '');
  const prefermento = d.prefermento
    ? buscar(PREFERMENTOS, d.prefermento).nombre + (pref && pref.horas.length > 1 ? `, ${horasDe(pref, d.horasPrefermento).horas} h` : '')
    : 'Ninguno';
  return [
    ...(d.pan ? [{ nombre: 'Tipo', valor: buscar(PANES, d.pan).nombre }] : []),
    { nombre: 'Harina', valor: harinas },
    { nombre: 'Hidratación', valor: porciento(Math.min(d.hidratacion, HIDRATACION_MAXIMA)) },
    { nombre: 'Prefermento', valor: prefermento },
    ...(conLevadura(d) ? [{ nombre: 'Levadura', valor: buscar(LEVADURAS, d.levadura).nombre }] : []),
    ...(conFermentacion(d)
      ? [{ nombre: 'Fermentación', valor: `${fermentacion.modo === 'frio' ? 'En frío' : 'Ambiente'}, ${fermentacion.horas} h` }] : []),
    ...(conTemperatura(d) ? [{ nombre: 'Temperatura ambiente', valor: buscar(TEMPERATURAS, d.temperatura).nombre }] : [])
  ];
}

/**
 * Las advertencias que acompañan al resultado. Las de los tiempos de la tabla
 * no van si la masa final no lleva levadura: manda el prefermento. Si algo
 * fermenta a temperatura ambiente, la de la temperatura; con la masa en
 * frío, la de la heladera.
 */
export const advertenciasPan = (d: DatosPan): string[] => {
  const pref = prefermentoDe(d);
  return [
    ...(conFermentacion(d) ? [ADVERTENCIA_TIEMPOS] : []),
    ...(conTemperatura(d) ? [ADVERTENCIA_AMBIENTE, ...(d.temperatura === 'menos-13' ? [ADVERTENCIA_MUY_FRIO] : [])] : []),
    ...(conFermentacion(d) && !masaAlAmbiente(d) ? [ADVERTENCIA_FRIO] : []),
    ...(pref ? [pref.advertencia] : []),
    ...(calcularPan(d)?.topeada ? [AVISO_TOPE] : [])
  ];
};
