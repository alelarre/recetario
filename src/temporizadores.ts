/**
 * *Herramientas → Temporizadores*: los temporizadores —cuentas regresivas— y el cronómetro.
 * Puro, sin DOM. Todo tiempo se calcula contra el reloj que se le pasa
 * (`ahora`, en ms), nunca con un contador: un temporizador no se atrasa aunque la
 * página se frene, y sobrevive a recargar y a cerrar la app.
 */

export const MINUTO = 60_000;

export interface TemporizadorCorriendo { id: string; nombre: string; duracion: number; fin: number }
export interface TemporizadorPausado { id: string; nombre: string; duracion: number; restante: number }
export type Temporizador = TemporizadorCorriendo | TemporizadorPausado;

export const corriendo = (c: Temporizador): c is TemporizadorCorriendo => 'fin' in c;

/** Lo que falta, nunca negativo. */
export const restante = (c: Temporizador, ahora: number): number =>
  Math.max(0, corriendo(c) ? c.fin - ahora : c.restante);

export const terminado = (c: Temporizador, ahora: number): boolean => restante(c, ahora) === 0;

/** Cuánto va, de 0 a 1: la barra. */
export const avance = (c: Temporizador, ahora: number): number =>
  c.duracion > 0 ? 1 - restante(c, ahora) / c.duracion : 1;

export function empezar(id: string, nombre: string, duracion: number, ahora: number): TemporizadorCorriendo {
  const limpio = nombre.trim();
  return { id, nombre: limpio || nombreDeDuracion(duracion), duracion, fin: ahora + duracion };
}

export const pausar = (c: Temporizador, ahora: number): TemporizadorPausado =>
  ({ id: c.id, nombre: c.nombre, duracion: c.duracion, restante: restante(c, ahora) });

export const seguir = (c: Temporizador, ahora: number): TemporizadorCorriendo =>
  ({ id: c.id, nombre: c.nombre, duracion: c.duracion, fin: ahora + restante(c, ahora) });

/**
 * Un minuto más. Uno terminado vuelve a correr desde 1:00 contado desde
 * ahora: sumárselo al fin viejo lo dejaría terminado igual.
 */
export function sumarMinuto(c: Temporizador, ahora: number): Temporizador {
  const duracion = c.duracion + MINUTO;
  return corriendo(c)
    ? { ...c, duracion, fin: Math.max(c.fin, ahora) + MINUTO }
    : { ...c, duracion, restante: c.restante + MINUTO };
}

export interface CronoCorriendo { desde: number; acumulado: number }
export interface CronoParado { acumulado: number }
export type Cronometro = CronoCorriendo | CronoParado;

export const CRONO_EN_CERO: CronoParado = { acumulado: 0 };
export const cronoCorriendo = (c: Cronometro | CronoConNombre): c is CronoCorriendo | (CronoConNombre & { desde: number }) =>
  'desde' in c && c.desde !== undefined;

export const transcurrido = (c: Cronometro | CronoConNombre, ahora: number): number =>
  c.acumulado + (cronoCorriendo(c) ? Math.max(0, ahora - c.desde) : 0);

export const iniciarCrono = (c: Cronometro, ahora: number): CronoCorriendo =>
  cronoCorriendo(c) ? c : { desde: ahora, acumulado: c.acumulado };

export const pararCrono = (c: Cronometro, ahora: number): CronoParado => ({ acumulado: transcurrido(c, ahora) });

export const reiniciarCrono = (): CronoParado => CRONO_EN_CERO;

/**
 * Un cronómetro con nombre: lo crea una marca de la receta y va en la lista,
 * mezclado con las cuentas (C07.5b.1). Cuenta igual que el cronómetro de
 * arriba —su forma es la de un `Cronometro`— y no termina ni avisa.
 */
export interface CronoConNombre { id: string; nombre: string; acumulado: number; desde?: number }

/** Lo que va en la lista de Temporizadores, en orden de creación. */
export type EnLista = Temporizador | CronoConNombre;

export const esCrono = (x: EnLista): x is CronoConNombre => 'acumulado' in x;

const comoCrono = (c: CronoConNombre): Cronometro =>
  c.desde === undefined ? { acumulado: c.acumulado } : { desde: c.desde, acumulado: c.acumulado };

export const empezarCrono = (id: string, nombre: string, ahora: number): CronoConNombre =>
  ({ id, nombre: nombre.trim() || 'Cronómetro', acumulado: 0, desde: ahora });

export const pausarCrono = (c: CronoConNombre, ahora: number): CronoConNombre =>
  ({ id: c.id, nombre: c.nombre, ...pararCrono(comoCrono(c), ahora) });

export const seguirCrono = (c: CronoConNombre, ahora: number): CronoConNombre =>
  ({ id: c.id, nombre: c.nombre, ...iniciarCrono(comoCrono(c), ahora) });

/** Horas, minutos y segundos enteros de una cantidad de ms, redondeando hacia abajo. */
function partes(ms: number): { h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

const dos = (n: number): string => String(n).padStart(2, '0');

/** `m:ss` hasta 59:59 y `h:mm:ss` de una hora en adelante. El mismo para todo lo que muestra tiempo. */
export function formatear(ms: number): string {
  const { h, m, s } = partes(ms);
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${m}:${dos(s)}`;
}

/** «10 min», «1 h 20 min», «45 s»: el nombre de un temporizador sin nombre. */
export function nombreDeDuracion(ms: number): string {
  const { h, m, s } = partes(ms);
  const texto = [h ? `${h} h` : '', m ? `${m} min` : '', s ? `${s} s` : ''].filter(Boolean).join(' ');
  return texto || '0 s';
}

/** Las tres ruedas del temporizador nuevo. */
export interface Duracion { h: number; m: number; s: number }
export type Rueda = keyof Duracion;

const TOPE: Record<Rueda, number> = { h: 24, m: 60, s: 60 };

export const esRueda = (x: unknown): x is Rueda => x === 'h' || x === 'm' || x === 's';

export const aMs = ({ h, m, s }: Duracion): number => ((h * 60 + m) * 60 + s) * 1000;

/** Una rueda un paso arriba o abajo, dando la vuelta en el tope. */
export const girar = (d: Duracion, rueda: Rueda, paso: 1 | -1): Duracion =>
  ({ ...d, [rueda]: (d[rueda] + paso + TOPE[rueda]) % TOPE[rueda] });

export interface Guardado { temporizadores: EnLista[]; crono: Cronometro; ultimaDuracion: Duracion }

export const CLAVE_TEMPORIZADORES = 'recetario.temporizadores';
export const DURACION_POR_DEFECTO: Duracion = { h: 0, m: 10, s: 0 };
export const GUARDADO_POR_DEFECTO: Guardado = { temporizadores: [], crono: CRONO_EN_CERO, ultimaDuracion: DURACION_POR_DEFECTO };

const esNumero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;

function esTemporizador(x: unknown): x is Temporizador {
  if (!esObjeto(x) || typeof x['id'] !== 'string' || typeof x['nombre'] !== 'string') return false;
  if (!esNumero(x['duracion']) || x['duracion'] < 0) return false;
  const conFin = esNumero(x['fin']);
  const conRestante = esNumero(x['restante']) && x['restante'] >= 0;
  // Una sola de las dos: con las dos no se sabe si corre.
  return conFin !== conRestante;
}

function esCronoConNombre(x: unknown): x is CronoConNombre {
  if (!esObjeto(x) || typeof x['id'] !== 'string' || typeof x['nombre'] !== 'string') return false;
  if (!esNumero(x['acumulado']) || x['acumulado'] < 0) return false;
  return x['desde'] === undefined || esNumero(x['desde']);
}

function cronoLeido(x: unknown): Cronometro {
  if (!esObjeto(x) || !esNumero(x['acumulado']) || x['acumulado'] < 0) return CRONO_EN_CERO;
  return esNumero(x['desde']) ? { desde: x['desde'], acumulado: x['acumulado'] } : { acumulado: x['acumulado'] };
}

function duracionLeida(x: unknown): Duracion {
  if (!esObjeto(x)) return DURACION_POR_DEFECTO;
  const entera = (v: unknown, tope: number): v is number => esNumero(v) && Number.isInteger(v) && v >= 0 && v < tope;
  const { h, m, s } = x;
  return entera(h, TOPE.h) && entera(m, TOPE.m) && entera(s, TOPE.s) ? { h, m, s } : DURACION_POR_DEFECTO;
}

/** Lo guardado en el teléfono, o lo de fábrica por cada parte que no se pueda leer. */
export function leerGuardado(crudo: unknown): Guardado {
  if (!esObjeto(crudo)) return GUARDADO_POR_DEFECTO;
  const lista = Array.isArray(crudo['temporizadores']) ? crudo['temporizadores'] : [];
  return {
    temporizadores: lista.flatMap((x): EnLista[] => {
      if (esTemporizador(x)) return [corriendo(x)
        ? { id: x.id, nombre: x.nombre, duracion: x.duracion, fin: x.fin }
        : { id: x.id, nombre: x.nombre, duracion: x.duracion, restante: x.restante }];
      if (esCronoConNombre(x)) return [x.desde === undefined
        ? { id: x.id, nombre: x.nombre, acumulado: x.acumulado }
        : { id: x.id, nombre: x.nombre, acumulado: x.acumulado, desde: x.desde }];
      return [];
    }),
    crono: cronoLeido(crudo['crono']),
    ultimaDuracion: duracionLeida(crudo['ultimaDuracion'])
  };
}
