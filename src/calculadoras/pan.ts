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
export type ClaveHarina = '0000' | '000' | '000-pizza' | 'semolin' | 'integral' | 'centeno';
export type Levadura = 'fresca' | 'seca';
export type ClaveFermentacion =
  | 'ambiente-2' | 'ambiente-4' | 'ambiente-8' | 'frio-12' | 'frio-24' | 'frio-48' | 'frio-72';
export type PorcentajeSegunda = 10 | 20 | 30 | 50;
export type ClavePrefermento = 'masa-madre' | 'poolish' | 'biga' | 'pate';

/**
 * El tipo de pan pone la hidratación base, con harina 000. Una pizza lleva
 * además el peso sugerido del bollo, en gramos, y su cantidad se pide en
 * bollos. Las fuentes de las pizzas están en
 * `product-design/research/herramientas/panaderia-pizza-masas.md`.
 */
export const PANES: readonly { clave: ClavePan; nombre: string; hidratacion: number; bollo?: number }[] = [
  { clave: 'frances', nombre: 'Pan francés', hidratacion: 60 },
  { clave: 'molde', nombre: 'Pan de molde', hidratacion: 62 },
  { clave: 'miga', nombre: 'Pan de miga', hidratacion: 56 },
  // Bollo para un molde n.º 32 (comemelapizza).
  { clave: 'pizza-molde', nombre: 'Pizza al molde', hidratacion: 61, bollo: 380 },
  // Bollo: las fuentes van de 210 a 350 g y ninguna dice el diámetro.
  { clave: 'pizza-piedra', nombre: 'Pizza a la piedra', hidratacion: 57, bollo: 250 },
  // Hidratación y bollo de Ooni, para 30 cm.
  { clave: 'napolitana', nombre: 'Pizza napolitana', hidratacion: 65, bollo: 250 },
  // Hidratación y bollo de Ooni, para 40 cm.
  { clave: 'new-york', nombre: 'Pizza New York', hidratacion: 65, bollo: 380 },
  { clave: 'baguette', nombre: 'Baguette', hidratacion: 68 },
  { clave: 'campo', nombre: 'Pan de campo', hidratacion: 72 },
  { clave: 'ciabatta', nombre: 'Ciabatta', hidratacion: 80 },
  { clave: 'focaccia', nombre: 'Focaccia', hidratacion: 75 }
];

/**
 * Cuántos puntos de hidratación suma o resta cada harina, pura. Con dos
 * harinas el ajuste es el promedio según la proporción.
 */
export const HARINAS: readonly { clave: ClaveHarina; nombre: string; ajuste: number }[] = [
  { clave: '0000', nombre: '0000', ajuste: -4 },
  { clave: '000', nombre: '000', ajuste: 0 },
  { clave: '000-pizza', nombre: '000 para pizza', ajuste: 2 },
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
 * con ella (`LEVADURA_POR_TEMPERATURA`). Las fuentes de cada valor están en
 * `product-design/research/herramientas/panaderia-pizza-masas.md`.
 */
export const PREFERMENTOS_CON_LEVADURA: readonly {
  clave: Exclude<ClavePrefermento, 'masa-madre'>; nombre: string; harina: number; hidratacion: number; sal: number;
  horas: readonly { horas: number; fresca: number }[]; levaduraFinal: boolean; ambiente: boolean; advertencia: string;
}[] = [
  // Bianco Lievito: 20 a 40 % de la harina; levadura a 23 °C.
  { clave: 'poolish', nombre: 'Poolish', harina: 30, hidratacion: 100, sal: 0,
    horas: [{ horas: 8, fresca: 0.75 }, { horas: 12, fresca: 0.2 }, { horas: 18, fresca: 0.1 }],
    levaduraFinal: false, ambiente: true,
    advertencia: 'El poolish fermenta a temperatura ambiente. La masa final no lleva levadura: leva con la del poolish.' },
  // Bianco Lievito, biga corta: 30 a 50 % de la harina; 16 a 20 h a 18 °C.
  { clave: 'biga', nombre: 'Biga', harina: 40, hidratacion: 44, sal: 0,
    horas: [{ horas: 18, fresca: 1 }], levaduraFinal: false, ambiente: false,
    advertencia: 'La biga fermenta de 16 a 20 h a unos 18 °C. La masa final no lleva levadura: leva con la de la biga.' },
  // King Arthur: 0,1 % de instantánea, que es 0,3 % de fresca; 14 h a temperatura ambiente.
  { clave: 'pate', nombre: 'Pâte fermentée', harina: 27, hidratacion: 68, sal: 1.4,
    horas: [{ horas: 14, fresca: 0.3 }], levaduraFinal: true, ambiente: true,
    advertencia: 'La pâte fermentée fermenta unas 14 h a temperatura ambiente. La masa final lleva su propia levadura.' }
];

/**
 * Lo que se elige como prefermento. La masa madre es uno más: leva el pan
 * sola, sin levadura, y su cantidad sale de la tabla de fermentación.
 */
export const PREFERMENTOS: readonly { clave: ClavePrefermento; nombre: string }[] = [
  { clave: 'masa-madre', nombre: 'Masa madre' },
  ...PREFERMENTOS_CON_LEVADURA
];

/** Los bollos con que arranca una pizza si no había. */
export const BOLLOS_POR_DEFECTO = 4;

/** La sal, % de la harina total. */
export const SAL = 2;
/** La seca (instantánea) es más concentrada: va la fresca dividida por esto. */
export const DIVISOR_SECA = 3;
/** Más agua que esto no se maneja con estas harinas: la cuenta se topea acá. */
export const HIDRATACION_MAXIMA = 85;

export const ADVERTENCIA_TIEMPOS = 'Los tiempos son totales: primera fermentación y apresto.';
export const ADVERTENCIA_AMBIENTE = 'La levadura o la masa madre va según la temperatura del ambiente: con más frío, más; con más calor, menos.';
/** La cuenta de la temperatura es de doughrise, que avisa dónde deja de valer. */
export const ADVERTENCIA_MUY_FRIO = 'Por debajo de 10 °C esta cuenta deja de valer: la masa casi no fermenta.';
export const ADVERTENCIA_FRIO = 'En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después de la heladera.';
export const AVISO_TOPE = 'La hidratación se limitó a 85 %.';

export interface DatosPan {
  pan: ClavePan;
  harina: ClaveHarina;
  segunda: ClaveHarina | null;
  /** Sin segunda harina no se usa. */
  porcentajeSegunda: PorcentajeSegunda;
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
export const bolloDe = (pan: ClavePan): number | null => PANES.find(p => p.clave === pan)?.bollo ?? null;

const esPositivo = (n: number): boolean => Number.isFinite(n) && n > 0;

/**
 * La cantidad al pasar a otro pan. Una pizza conserva los bollos y toma el
 * peso sugerido de su estilo; al pasar de una pizza a un pan, se conserva la
 * masa total.
 */
export function cantidadAlCambiar(antes: DatosPan, pan: ClavePan): CantidadPan {
  if (pan === antes.pan) return antes.cantidad;
  const c = antes.cantidad;
  const bollo = bolloDe(pan);
  if (bollo !== null) return { de: 'bollos', bollos: c.de === 'bollos' ? c.bollos : BOLLOS_POR_DEFECTO, gramos: bollo };
  return c.de === 'bollos' ? { de: 'masa', gramos: c.bollos * c.gramos } : c;
}

/** Las cantidades, o `null` si la cantidad pedida no es un número positivo. */
export function calcularPan(d: DatosPan): ResultadoPan | null {
  const c = d.cantidad;
  if (!esPositivo(c.gramos) || (c.de === 'bollos' && !esPositivo(c.bollos))) return null;
  const masaPedida = c.de === 'bollos' ? c.bollos * c.gramos : c.gramos;
  const pan = buscar(PANES, d.pan);
  const fermentacion = buscar(FERMENTACIONES, d.fermentacion);
  const p = d.segunda ? d.porcentajeSegunda / 100 : 0;
  const ajuste = buscar(HARINAS, d.harina).ajuste * (1 - p) + (d.segunda ? buscar(HARINAS, d.segunda).ajuste * p : 0);
  const sinTope = pan.hidratacion + ajuste;
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
  pan?: string | undefined;
  harina?: string | undefined;
  /** `ninguna` o una harina distinta de la principal. */
  segunda_harina?: string | undefined;
  porcentaje_segunda?: number | undefined;
  levadura?: string | undefined;
  /** `ambiente` o `frío`. */
  fermentacion?: string | undefined;
  horas?: number | undefined;
  /** La del ambiente, una de las franjas. En frío no va. */
  temperatura?: string | undefined;
  harina_total?: number | undefined;
  masa_total?: number | undefined;
  /** En una pizza, la cantidad es bollos y gramos por bollo. */
  bollos?: number | undefined;
  peso_bollo?: number | undefined;
  /** `ninguno` o uno de la tabla, la masa madre incluida. */
  prefermento?: string | undefined;
  horas_prefermento?: number | undefined;
}

const MODOS = [{ clave: 'ambiente', nombre: 'Ambiente' }, { clave: 'frio', nombre: 'Frío' }] as const;

/**
 * Los datos de un pedido del MCP, o lo que falta con sus opciones. No hay
 * valores por defecto: lo que no vino se le pregunta al usuario.
 *
 * Un dato cuyas opciones dependen de otro que falta no se pide todavía: la
 * segunda harina espera a la principal; las horas, al prefermento y al modo;
 * y la cantidad al pan, porque una pizza se pide en bollos. Se pide en la
 * vuelta siguiente, con opciones que van seguro.
 *
 * La levadura, la fermentación y la temperatura se piden junto con el
 * prefermento, y dejan de pedirse cuando lo elegido no las usa: la masa madre
 * no lleva levadura, con poolish o biga la masa final no tiene fermentación
 * que elegir, y la temperatura del ambiente no cuenta con la masa en frío
 * —salvo que el prefermento fermente a temperatura ambiente— ni con biga.
 */
export function leerPedidoPan(p: PedidoPan): Pedido<DatosPan> {
  const faltan: Faltante[] = [];
  const falta = (dato: string, opciones: readonly string[]): void => { faltan.push({ dato, opciones }); };

  const pan = porNombre(PANES, p.pan);
  if (!pan) falta('pan', PANES.map(x => x.nombre));
  const harina = porNombre(HARINAS, p.harina);
  if (!harina) falta('harina', HARINAS.map(x => x.nombre));

  const posiblesSegundas = HARINAS.filter(x => x.clave !== harina?.clave);
  const ninguna = p.segunda_harina !== undefined && porNombre([{ clave: 'ninguna', nombre: 'Ninguna' }], p.segunda_harina);
  const segunda = ninguna ? null : porNombre(posiblesSegundas, p.segunda_harina);
  if (harina && !ninguna && !segunda) falta('segunda_harina', ['Ninguna', ...posiblesSegundas.map(x => x.nombre)]);
  const porcentaje = PORCENTAJES_SEGUNDA.find(x => x === p.porcentaje_segunda);
  if (segunda && !porcentaje) falta('porcentaje_segunda', PORCENTAJES_SEGUNDA.map(String));

  const ninguno = !!porNombre([{ clave: 'ninguno', nombre: 'Ninguno' }], p.prefermento);
  const elegido = ninguno ? null : porNombre(PREFERMENTOS, p.prefermento);
  const sabePrefermento = ninguno || !!elegido;
  if (!sabePrefermento) falta('prefermento', ['Ninguno', ...PREFERMENTOS.map(x => x.nombre)]);
  const pref = prefermentoConLevadura(elegido?.clave ?? null);
  const horasPrefermento = pref?.horas.length === 1 ? pref.horas[0] : pref?.horas.find(h => h.horas === p.horas_prefermento);
  if (pref && !horasPrefermento) falta('horas_prefermento', pref.horas.map(h => String(h.horas)));

  // La masa madre no lleva levadura.
  const pideLevadura = elegido?.clave !== 'masa-madre';
  const levadura = porNombre(LEVADURAS, p.levadura);
  if (pideLevadura && !levadura) falta('levadura', LEVADURAS.map(x => x.nombre));

  // Sin levadura en la masa final, no hay fermentación que elegir.
  const conTabla = !pref || pref.levaduraFinal;
  const modo = conTabla ? porNombre(MODOS, p.fermentacion) : null;
  if (conTabla && !modo) falta('fermentacion', MODOS.map(x => x.nombre));
  const temperatura = porNombre(TEMPERATURAS, p.temperatura);
  const pideTemperatura = (pref?.ambiente ?? false) || (conTabla && modo?.clave !== 'frio');
  if (pideTemperatura && !temperatura) falta('temperatura', TEMPERATURAS.map(x => x.nombre));
  // Las horas esperan al prefermento: con masa madre no van las 2 h.
  const posibles = modo && sabePrefermento ? fermentacionesPara(elegido?.clave ?? null).filter(f => f.modo === modo.clave) : [];
  const fermentacion = conTabla ? posibles.find(f => f.horas === p.horas) : buscar(FERMENTACIONES, PAN_POR_DEFECTO.fermentacion);
  if (modo && sabePrefermento && !fermentacion) falta('horas', posibles.map(f => String(f.horas)));

  const bollo = pan ? bolloDe(pan.clave) : null;
  let cantidad: CantidadPan | null = null;
  if (pan && bollo !== null) {
    const bollos = positivo(p.bollos);
    const peso = positivo(p.peso_bollo);
    if (bollos === null) falta('bollos', []);
    if (peso === null) falta('peso_bollo', [String(bollo)]);
    if (bollos !== null && peso !== null) cantidad = { de: 'bollos', bollos, gramos: peso };
  } else if (pan) {
    const harinaTotal = positivo(p.harina_total);
    const masaTotal = positivo(p.masa_total);
    if (harinaTotal !== null && p.masa_total === undefined) cantidad = { de: 'harina', gramos: harinaTotal };
    else if (masaTotal !== null && p.harina_total === undefined) cantidad = { de: 'masa', gramos: masaTotal };
    else falta('cantidad', ['harina_total', 'masa_total']);
  }

  if (faltan.length || !pan || !harina || (!ninguna && !segunda) || !fermentacion || !cantidad) return { faltan };
  return {
    datos: {
      pan: pan.clave, harina: harina.clave, segunda: segunda?.clave ?? null,
      porcentajeSegunda: porcentaje ?? PORCENTAJES_SEGUNDA[0] ?? 10,
      prefermento: elegido?.clave ?? null,
      levadura: levadura?.clave ?? PAN_POR_DEFECTO.levadura,
      fermentacion: fermentacion.clave,
      temperatura: temperatura?.clave ?? PAN_POR_DEFECTO.temperatura,
      cantidad,
      horasPrefermento: horasPrefermento?.horas ?? 0
    }
  };
}

/** Lo que muestra la calculadora la primera vez. */
export const PAN_POR_DEFECTO: DatosPan = {
  pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
  prefermento: null, levadura: 'fresca', fermentacion: 'ambiente-8', temperatura: '18-24',
  cantidad: { de: 'harina', gramos: 1000 }, horasPrefermento: 0
};

const deLaTabla = <T extends { clave: string }>(tabla: readonly T[], valor: unknown): T['clave'] | undefined =>
  tabla.find(f => f.clave === valor)?.clave;

/**
 * Las últimas elecciones guardadas, dato por dato: lo que no se puede leer o
 * ya no es una opción vuelve al valor por defecto, y el resto se conserva.
 * También corrige las combinaciones que no van: la segunda igual a la
 * principal, las 2 h con masa madre, una cantidad que no es la del pan
 * —una pizza va en bollos; un pan, en harina o masa— y unas horas que no son
 * de su prefermento.
 */
export function completarPan(guardado: unknown): DatosPan {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const d = PAN_POR_DEFECTO;
  const harina = deLaTabla(HARINAS, g['harina']) ?? d.harina;
  const segunda = deLaTabla(HARINAS, g['segunda']);
  const levadura = deLaTabla(LEVADURAS, g['levadura']) ?? d.levadura;
  const prefermento = deLaTabla(PREFERMENTOS, g['prefermento']) ?? null;
  const pref = prefermentoConLevadura(prefermento);
  const fermentacion = deLaTabla(fermentacionesPara(prefermento), g['fermentacion'])
    ?? (g['fermentacion'] === 'ambiente-2' ? 'ambiente-4' : d.fermentacion);
  const pan = deLaTabla(PANES, g['pan']) ?? d.pan;
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
    : leida === null ? d.cantidad
    : leida.de === 'bollos' ? { de: 'masa', gramos: leida.bollos * leida.gramos }
    : leida;
  return {
    pan,
    harina,
    segunda: segunda && segunda !== harina ? segunda : null,
    porcentajeSegunda: PORCENTAJES_SEGUNDA.find(x => x === g['porcentajeSegunda']) ?? d.porcentajeSegunda,
    prefermento,
    levadura,
    fermentacion,
    temperatura: deLaTabla(TEMPERATURAS, g['temperatura']) ?? d.temperatura,
    cantidad,
    horasPrefermento: pref ? horasDe(pref, typeof g['horasPrefermento'] === 'number' ? g['horasPrefermento'] : 0).horas : 0
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
