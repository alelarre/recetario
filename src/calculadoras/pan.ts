/**
 * La calculadora de pan. **Toda su fórmula vive acá**: las tablas, las
 * constantes y las cuentas. Cambiar un porcentaje es editar este archivo y
 * nada más: la pantalla, el MCP y los tests usan lo que exporta.
 *
 * Los porcentajes son de panadero: sobre la harina total. Los valores son
 * puntos de partida para una cocina a unos 24 °C, no medidas exactas: la
 * absorción cambia entre marcas de harina y la fermentación, con la
 * temperatura.
 */
import { porNombre, positivo, type Faltante, type Pedido } from './pedido.js';
import { gramos, porciento } from './gramos.js';

export type ClavePan =
  | 'frances' | 'molde' | 'miga' | 'pizza-molde' | 'pizza-piedra' | 'napolitana' | 'new-york'
  | 'baguette' | 'campo' | 'ciabatta' | 'focaccia';
export type ClaveHarina = '0000' | '000' | '000-pizza' | 'semolin' | 'integral' | 'centeno';
export type Levadura = 'fresca' | 'seca' | 'masa-madre';
export type ClaveFermentacion =
  | 'ambiente-2' | 'ambiente-4' | 'ambiente-8' | 'frio-12' | 'frio-24' | 'frio-48' | 'frio-72';
export type PorcentajeSegunda = 10 | 20 | 30 | 50;

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
  { clave: 'seca', nombre: 'Seca' },
  { clave: 'masa-madre', nombre: 'Masa madre' }
];

/**
 * El tiempo total de fermentación —primera fermentación y apresto— y cuánta
 * levadura fresca o masa madre (al 100 % de hidratación) pide. Con masa madre
 * no hay 2 h: no le alcanza el tiempo para levar.
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

export const PORCENTAJES_SEGUNDA: readonly PorcentajeSegunda[] = [10, 20, 30, 50];

/** Los bollos con que arranca una pizza si no había. */
export const BOLLOS_POR_DEFECTO = 4;

/** La sal, % de la harina total. */
export const SAL = 2;
/** La seca (instantánea) es más concentrada: va la fresca dividida por esto. */
export const DIVISOR_SECA = 3;
/** Más agua que esto no se maneja con estas harinas: la cuenta se topea acá. */
export const HIDRATACION_MAXIMA = 85;

export const ADVERTENCIAS_PAN: readonly string[] = [
  'Los tiempos son totales (primera fermentación y apresto), a unos 24 °C. Con frío ambiente hay que estirarlos; con calor, acortarlos.',
  'En frío, se cuentan 1 o 2 horas a temperatura ambiente antes y después de la heladera.'
];
export const AVISO_TOPE = 'La hidratación se limitó a 85 %.';

export interface DatosPan {
  pan: ClavePan;
  harina: ClaveHarina;
  segunda: ClaveHarina | null;
  /** Sin segunda harina no se usa. */
  porcentajeSegunda: PorcentajeSegunda;
  levadura: Levadura;
  fermentacion: ClaveFermentacion;
  cantidad: CantidadPan;
}

/** Un pan se pide por la harina o la masa total; una pizza, en bollos y gramos por bollo. */
export type CantidadPan =
  | { de: 'harina' | 'masa'; gramos: number }
  | { de: 'bollos'; bollos: number; gramos: number };

export interface ResultadoPan {
  /** Una por harina. Con masa madre, lo que se agrega aparte de la que trae ella. */
  harinas: { clave: ClaveHarina; nombre: string; gramos: number }[];
  /** Con masa madre, el agua a agregar. */
  agua: number;
  sal: number;
  /** La levadura fresca o seca, o la masa madre. */
  levadura: number;
  levaduraTipo: Levadura;
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

export const fermentacionesPara = (levadura: Levadura): typeof FERMENTACIONES =>
  FERMENTACIONES.filter(f => levadura !== 'masa-madre' || f.masaMadre !== null);

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
  const conMasaMadre = d.levadura === 'masa-madre';

  // Con masa madre la levadura no suma a la masa: su harina y su agua ya
  // están contadas en la harina total y en el agua.
  const pctLevadura = conMasaMadre ? 0
    : d.levadura === 'seca' ? fermentacion.fresca / DIVISOR_SECA : fermentacion.fresca;
  const H = c.de === 'harina'
    ? c.gramos
    : masaPedida / (1 + (hidratacion + SAL + pctLevadura) / 100);
  const agua = H * hidratacion / 100;
  const sal = H * SAL / 100;
  // Si llegara 2 h con masa madre, se toma la de 4 h: es lo mínimo que se ofrece.
  const pctMasaMadre = fermentacion.masaMadre ?? buscar(FERMENTACIONES, 'ambiente-4').masaMadre ?? 0;
  const masaMadre = conMasaMadre ? H * pctMasaMadre / 100 : 0;
  const harinaAAgregar = H - masaMadre / 2;
  const harinas = [{ clave: d.harina, proporcion: 1 - p }, ...(d.segunda ? [{ clave: d.segunda, proporcion: p }] : [])]
    .map(({ clave, proporcion }) => ({ clave, nombre: buscar(HARINAS, clave).nombre, gramos: harinaAAgregar * proporcion }));

  return {
    harinas,
    agua: agua - masaMadre / 2,
    sal,
    levadura: conMasaMadre ? masaMadre : H * pctLevadura / 100,
    levaduraTipo: d.levadura,
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
  harina_total?: number | undefined;
  masa_total?: number | undefined;
  /** En una pizza, la cantidad es bollos y gramos por bollo. */
  bollos?: number | undefined;
  peso_bollo?: number | undefined;
}

const MODOS = [{ clave: 'ambiente', nombre: 'Ambiente' }, { clave: 'frio', nombre: 'Frío' }] as const;

/**
 * Los datos de un pedido del MCP, o lo que falta con sus opciones. No hay
 * valores por defecto: lo que no vino se le pregunta al usuario.
 *
 * Un dato cuyas opciones dependen de otro que falta no se pide todavía: la
 * segunda harina espera a la principal, las horas a la levadura y al modo, y
 * la cantidad al pan, porque una pizza se pide en bollos. Se pide en la
 * vuelta siguiente, con opciones que van seguro.
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

  const levadura = porNombre(LEVADURAS, p.levadura);
  if (!levadura) falta('levadura', LEVADURAS.map(x => x.nombre));
  const modo = porNombre(MODOS, p.fermentacion);
  if (!modo) falta('fermentacion', MODOS.map(x => x.nombre));
  const posibles = levadura && modo ? fermentacionesPara(levadura.clave).filter(f => f.modo === modo.clave) : [];
  const fermentacion = posibles.find(f => f.horas === p.horas);
  if (levadura && modo && !fermentacion) falta('horas', posibles.map(f => String(f.horas)));

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

  if (faltan.length || !pan || !harina || (!ninguna && !segunda) || !levadura || !fermentacion || !cantidad) return { faltan };
  return {
    datos: {
      pan: pan.clave, harina: harina.clave, segunda: segunda?.clave ?? null,
      porcentajeSegunda: porcentaje ?? PORCENTAJES_SEGUNDA[0] ?? 10,
      levadura: levadura.clave, fermentacion: fermentacion.clave,
      cantidad
    }
  };
}

/** Lo que muestra la calculadora la primera vez. */
export const PAN_POR_DEFECTO: DatosPan = {
  pan: 'campo', harina: '000', segunda: null, porcentajeSegunda: 30,
  levadura: 'fresca', fermentacion: 'ambiente-8', cantidad: { de: 'harina', gramos: 1000 }
};

const deLaTabla = <T extends { clave: string }>(tabla: readonly T[], valor: unknown): T['clave'] | undefined =>
  tabla.find(f => f.clave === valor)?.clave;

/**
 * Las últimas elecciones guardadas, dato por dato: lo que no se puede leer o
 * ya no es una opción vuelve al valor por defecto, y el resto se conserva.
 * También corrige las combinaciones que no van: la segunda igual a la
 * principal, las 2 h con masa madre, y una cantidad que no es la del pan
 * —una pizza va en bollos; un pan, en harina o masa—.
 */
export function completarPan(guardado: unknown): DatosPan {
  const g: Record<string, unknown> = typeof guardado === 'object' && guardado !== null && !Array.isArray(guardado)
    ? guardado as Record<string, unknown> : {};
  const d = PAN_POR_DEFECTO;
  const harina = deLaTabla(HARINAS, g['harina']) ?? d.harina;
  const segunda = deLaTabla(HARINAS, g['segunda']);
  const levadura = deLaTabla(LEVADURAS, g['levadura']) ?? d.levadura;
  const fermentacion = deLaTabla(fermentacionesPara(levadura), g['fermentacion'])
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
    levadura,
    fermentacion,
    cantidad
  };
}

const NOMBRE_LEVADURA: Record<Levadura, string> = { fresca: 'Levadura fresca', seca: 'Levadura seca', 'masa-madre': 'Masa madre' };

/**
 * El resultado como se muestra, una línea por ingrediente y la hidratación:
 * lo usan la pantalla y el MCP, así dicen lo mismo. Sin resultado, cada valor
 * es un guion.
 */
export function lineasPan(d: DatosPan): { nombre: string; valor: string }[] {
  const r = calcularPan(d);
  const aAgregar = d.levadura === 'masa-madre' ? ' a agregar' : '';
  const g = (valor: number | undefined): string => (r && valor !== undefined ? `${gramos(valor)} g` : '—');
  return [
    ...(r ? r.harinas.map(h => ({ nombre: `Harina ${h.nombre}${aAgregar}`, valor: g(h.gramos) })) : [{ nombre: 'Harina', valor: '—' }]),
    { nombre: `Agua${aAgregar}`, valor: g(r?.agua) },
    { nombre: 'Sal', valor: g(r?.sal) },
    { nombre: NOMBRE_LEVADURA[d.levadura], valor: g(r?.levadura) },
    { nombre: 'Hidratación', valor: r ? porciento(r.hidratacion) : '—' }
  ];
}

/** Las advertencias que acompañan al resultado. */
export const advertenciasPan = (d: DatosPan): string[] =>
  [...ADVERTENCIAS_PAN, ...(calcularPan(d)?.topeada ? [AVISO_TOPE] : [])];
