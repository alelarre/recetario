/**
 * Lo que se guarda del evento: completar lo leído del teléfono —lo que ya no
 * existe se descarta o vuelve a su valor por defecto— y cada cambio, que
 * devuelve un estado nuevo. Puro: el control guarda y dibuja.
 */
import type { Comunes, DatoPedido, EstadoDeTipo, EstadoEvento, Margen, TipoDeEvento, ValorDeDato, Valores } from './tipos.js';

export const MARGENES: readonly Margen[] = [0, 10, 20];

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Un número finito y no negativo, o `null`: vacío. */
const numeroOVacio = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null);

/** Lo guardado de cada dato que sigue valiendo; el resto, su valor por defecto. */
export function valoresDe(datos: readonly DatoPedido[], guardado: unknown): Valores {
  const g = esObjeto(guardado) ? guardado : {};
  return Object.fromEntries(datos.map((d): [string, ValorDeDato] => {
    const v = g[d.id];
    if (d.tipo === 'numero') return [d.id, numeroOVacio(v) ?? d.porDefecto];
    if (d.tipo === 'si-no') return [d.id, typeof v === 'boolean' ? v : d.porDefecto];
    return [d.id, typeof v === 'string' && d.opciones.some(o => o.valor === v) ? v : d.porDefecto];
  }));
}

/** Las cosas con el atajo aplicado: prende las de la opción y apaga las demás que nombra; las que no nombra quedan. */
function conAtajo(t: TipoDeEvento, cosas: Readonly<Record<string, boolean>>, opcion: ValorDeDato): Record<string, boolean> {
  const atajo = t.atajo;
  const prende = atajo && typeof opcion === 'string' ? atajo.cosas[opcion] : undefined;
  if (!atajo || !prende) return { ...cosas };
  const nombradas = new Set(Object.values(atajo.cosas).flat());
  return { ...cosas, ...Object.fromEntries([...nombradas].map(id => [id, prende.includes(id)])) };
}

export function estadoInicialDeTipo(t: TipoDeEvento): EstadoDeTipo {
  const datos = valoresDe(t.datos, {});
  const cosas = Object.fromEntries(t.cosas.map(c => [c.id, c.prendida]));
  return {
    datos,
    cosas: t.atajo ? conAtajo(t, cosas, datos[t.atajo.dato] ?? null) : cosas,
    ademas: Object.fromEntries(t.ademas.map(a => [a.ademas.id, { prendido: a.prendido, datos: valoresDe(a.ademas.datos, {}) }]))
  };
}

/** Lo de un tipo leído del teléfono: lo que ya no existe se descarta y lo que falta toma su valor inicial. */
function completarTipo(t: TipoDeEvento, crudo: unknown): EstadoDeTipo {
  const inicial = estadoInicialDeTipo(t);
  if (!esObjeto(crudo)) return inicial;
  const cosas = esObjeto(crudo['cosas']) ? crudo['cosas'] : {};
  const ademas = esObjeto(crudo['ademas']) ? crudo['ademas'] : {};
  return {
    datos: valoresDe(t.datos, crudo['datos']),
    cosas: Object.fromEntries(t.cosas.map(c => {
      const v = cosas[c.id];
      return [c.id, typeof v === 'boolean' ? v : inicial.cosas[c.id] ?? c.prendida];
    })),
    ademas: Object.fromEntries(t.ademas.map(a => {
      const g = ademas[a.ademas.id];
      const prendido = esObjeto(g) && typeof g['prendido'] === 'boolean' ? g['prendido'] : a.prendido;
      return [a.ademas.id, { prendido, datos: valoresDe(a.ademas.datos, esObjeto(g) ? g['datos'] : {}) }];
    }))
  };
}

export function estadoInicial(tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento {
  return { tipo: tipos[0]?.id ?? '', adultos: null, chicos: null, horas: comunes.horas, calor: false, margen: 0, porTipo: {} };
}

/** Lo leído del teléfono, completo: un tipo que ya no existe vuelve al primero. */
export function completarEvento(crudo: unknown, tipos: readonly TipoDeEvento[], comunes: Comunes): EstadoEvento {
  const inicial = estadoInicial(tipos, comunes);
  if (!esObjeto(crudo)) return inicial;
  const porTipo = esObjeto(crudo['porTipo']) ? crudo['porTipo'] : {};
  const tipo = tipos.find(t => t.id === crudo['tipo']);
  return {
    tipo: tipo?.id ?? inicial.tipo,
    adultos: numeroOVacio(crudo['adultos']),
    chicos: numeroOVacio(crudo['chicos']),
    horas: 'horas' in crudo ? numeroOVacio(crudo['horas']) : inicial.horas,
    calor: crudo['calor'] === true,
    margen: MARGENES.find(m => m === crudo['margen']) ?? 0,
    porTipo: Object.fromEntries(tipos.filter(t => t.id in porTipo).map(t => [t.id, completarTipo(t, porTipo[t.id])]))
  };
}

export const tipoDe = (e: EstadoEvento, tipos: readonly TipoDeEvento[]): TipoDeEvento | undefined =>
  tipos.find(t => t.id === e.tipo);

/** Lo del tipo en el evento: lo guardado, o lo inicial si nunca se tocó. */
export const estadoDeTipo = (e: EstadoEvento, t: TipoDeEvento): EstadoDeTipo => e.porTipo[t.id] ?? estadoInicialDeTipo(t);

/** El evento con lo del tipo elegido cambiado; sin tipo, igual. */
function cambiarTipo(e: EstadoEvento, tipos: readonly TipoDeEvento[], cambio: (t: TipoDeEvento, et: EstadoDeTipo) => EstadoDeTipo): EstadoEvento {
  const t = tipoDe(e, tipos);
  return t ? { ...e, porTipo: { ...e.porTipo, [t.id]: cambio(t, estadoDeTipo(e, t)) } } : e;
}

export const conTipo = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string): EstadoEvento =>
  (tipos.some(t => t.id === id) ? { ...e, tipo: id } : e);

/** Un dato del tipo; el del atajo, además, prende y apaga sus cosas. */
export const conDato = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, valor: ValorDeDato): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => {
    const datos = valoresDe(t.datos, { ...et.datos, [id]: valor });
    return { ...et, datos, cosas: t.atajo?.dato === id ? conAtajo(t, et.cosas, datos[id] ?? null) : et.cosas };
  });

export const conCosa = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, prendida: boolean): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => (t.cosas.some(c => c.id === id) ? { ...et, cosas: { ...et.cosas, [id]: prendida } } : et));

export const conAdemas = (e: EstadoEvento, tipos: readonly TipoDeEvento[], id: string, prendido: boolean): EstadoEvento =>
  cambiarTipo(e, tipos, (_t, et) => {
    const a = et.ademas[id];
    return a ? { ...et, ademas: { ...et.ademas, [id]: { ...a, prendido } } } : et;
  });

export const conDatoDeAdemas = (e: EstadoEvento, tipos: readonly TipoDeEvento[], ademas: string, dato: string, valor: ValorDeDato): EstadoEvento =>
  cambiarTipo(e, tipos, (t, et) => {
    const a = et.ademas[ademas];
    const declarado = t.ademas.find(x => x.ademas.id === ademas)?.ademas;
    return a && declarado
      ? { ...et, ademas: { ...et.ademas, [ademas]: { ...a, datos: valoresDe(declarado.datos, { ...a.datos, [dato]: valor }) } } }
      : et;
  });
