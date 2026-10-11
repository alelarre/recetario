/**
 * *Evento* para el agente: la misma cuenta de la app (`src/eventos/`), con
 * los mismos tipos y números. No usa el Drive ni el login.
 *
 * El tipo es un punto de partida, como en la pantalla: lo que no se pasa
 * queda como lo trae; el tipo de asado prende lo suyo antes de que `prender`
 * y `apagar` lo corrijan.
 */
import { normalizar } from '../src/normalizar.js';
import { TIPOS_DE_EVENTO } from '../src/eventos/indice.js';
import { COMUNES } from '../src/eventos/datos/comunes.js';
import { calcularEvento, textoEvento } from '../src/eventos/evento.js';
import { MARGENES, conAdemas, conCosa, conDato, conDatoDeAdemas, conTipo, estadoInicial } from '../src/eventos/estado.js';
import type { Comunes, DatoPedido, EstadoEvento, TipoDeEvento, ValorDeDato } from '../src/eventos/tipos.js';

type ValorLibre = string | number | boolean;
export interface PedidoEvento {
  tipo?: string | undefined;
  adultos?: number | undefined;
  chicos?: number | undefined;
  horas?: number | undefined;
  calor?: boolean | undefined;
  margen?: number | undefined;
  datos?: Record<string, ValorLibre> | undefined;
  prender?: string[] | undefined;
  apagar?: string[] | undefined;
  ademas?: Record<string, false | Record<string, ValorLibre>> | undefined;
}
interface ErrorDelPedido { error: string; opciones: string[] }
const esError = (x: unknown): x is ErrorDelPedido => typeof x === 'object' && x !== null && 'error' in x;

const describirDato = (d: DatoPedido) => (d.tipo === 'opcion'
  ? { id: d.id, nombre: d.nombre, opciones: d.opciones.map(o => o.texto), por_defecto: d.opciones.find(o => o.valor === d.porDefecto)?.texto ?? d.porDefecto }
  : { id: d.id, nombre: d.nombre, tipo: d.tipo === 'numero' ? 'número' : 'sí o no', por_defecto: d.porDefecto });

export const listadoDeTipos = (tipos: readonly TipoDeEvento[]) => tipos.map(t => ({
  id: t.id, nombre: t.nombre, datos: t.datos.map(describirDato),
  cosas: t.cosas.map(c => ({ id: c.id, nombre: c.nombre, grupo: t.grupos.find(g => g.id === c.grupo)?.titulo ?? c.grupo, prendida: c.prendida })),
  ademas: t.ademas.map(a => ({ id: a.ademas.id, nombre: a.ademas.nombre, prendido: a.prendido, datos: a.ademas.datos.map(describirDato) }))
}));

/** El que coincide por id, o si no por nombre, sin tildes ni mayúsculas; tiene que ser uno solo. */
function encontrar<T extends { id: string; nombre: string }>(xs: readonly T[], texto: string): T | ErrorDelPedido {
  const q = normalizar(texto);
  const porId = xs.filter(x => normalizar(x.id) === q);
  const candidatos = porId.length ? porId : xs.filter(x => normalizar(x.nombre) === q);
  const uno = candidatos.length === 1 ? candidatos[0] : undefined;
  if (uno) return uno;
  return {
    error: candidatos.length ? `«${texto}» nombra a más de una: pasá el id.` : `No hay «${texto}».`,
    opciones: (candidatos.length ? candidatos : xs).map(x => `${x.id} (${x.nombre})`)
  };
}

/** El valor de un dato como lo pasó el agente; una opción, por su valor o por su texto. */
function valorDe(d: DatoPedido, x: ValorLibre): ValorDeDato | ErrorDelPedido {
  if (d.tipo === 'numero') return typeof x === 'number' ? x : { error: `«${d.id}» es un número.`, opciones: [] };
  if (d.tipo === 'si-no') return typeof x === 'boolean' ? x : { error: `«${d.id}» es true o false.`, opciones: [] };
  const o = d.opciones.find(op => normalizar(op.valor) === normalizar(String(x)) || normalizar(op.texto) === normalizar(String(x)));
  return o ? o.valor : { error: `«${String(x)}» no es una opción de «${d.id}».`, opciones: d.opciones.map(op => op.texto) };
}

export function calcularEventoParaElAgente(p: PedidoEvento, tipos: readonly TipoDeEvento[] = TIPOS_DE_EVENTO, comunes: Comunes = COMUNES) {
  const tipo = p.tipo === undefined ? null : encontrar(tipos, p.tipo);
  if (!tipo || esError(tipo)) return { tipos: listadoDeTipos(tipos), ...(tipo ? { error: tipo.error } : {}) };

  let e: EstadoEvento = {
    ...conTipo(estadoInicial(tipos, comunes), tipos, tipo.id),
    adultos: p.adultos ?? null, chicos: p.chicos ?? null, horas: p.horas ?? comunes.horas,
    calor: p.calor ?? false, margen: MARGENES.find(m => m === p.margen) ?? 0
  };
  for (const [id, x] of Object.entries(p.datos ?? {})) {
    const d = encontrar(tipo.datos, id);
    if (esError(d)) return d;
    const v = valorDe(d, x);
    if (esError(v)) return v;
    e = conDato(e, tipos, d.id, v);
  }
  // Después de los datos: el tipo de asado ya prendió lo suyo, y esto lo corrige.
  const alternar = (nombres: readonly string[], prendida: boolean): ErrorDelPedido | null => {
    for (const nombre of nombres) {
      const c = encontrar(tipo.cosas, nombre);
      if (esError(c)) return c;
      e = conCosa(e, tipos, c.id, prendida);
    }
    return null;
  };
  const errorAlPrender = alternar(p.prender ?? [], true) ?? alternar(p.apagar ?? [], false);
  if (errorAlPrender) return errorAlPrender;
  for (const [id, x] of Object.entries(p.ademas ?? {})) {
    const a = encontrar(tipo.ademas.map(y => y.ademas), id);
    if (esError(a)) return a;
    e = conAdemas(e, tipos, a.id, x !== false);
    if (x === false) continue;
    for (const [dato, valor] of Object.entries(x)) {
      const d = encontrar(a.datos, dato);
      if (esError(d)) return d;
      const v = valorDe(d, valor);
      if (esError(v)) return v;
      e = conDatoDeAdemas(e, tipos, a.id, d.id, v);
    }
  }
  const r = calcularEvento(e, tipos, comunes);
  return r ? { ...r, texto: textoEvento(r) } : { vacio: 'Sin personas, o con todo apagado, no hay lista.' };
}
