/**
 * Las herramientas de referencia para el agente: las mismas tablas y cuentas
 * de la app (`src/referencias/`), con su fuente. No usan el Drive ni el login.
 */
import { z } from 'zod';
import { normalizar } from '../src/normalizar.js';
import { REFERENCIAS, FICHAS_DEL_CONVERSOR } from '../src/referencias/indice.js';
import { filasDe, fuentesDe } from '../src/referencias/forma.js';
import type { Cuenta, Tabla, Valores, Fuente, Ficha } from '../src/referencias/tipos.js';

/** Las fichas de Referencias y del Conversor: todo lo que consulta el agente. */
const TODAS: readonly (Ficha & { tags?: readonly string[] })[] = [...REFERENCIAS, ...FICHAS_DEL_CONVERSOR];
const TABLAS: readonly Tabla[] = TODAS.flatMap(f => (f.tipo === 'tabla' ? [f.tabla] : []));
export const CUENTAS: readonly Cuenta[] = TODAS.flatMap(f => (f.tipo === 'cuenta' ? [f.cuenta] : []));
export const nombreMcp = (c: Cuenta): string => `calcular_${c.id.replaceAll('-', '_')}`;

const nombreDeColumna = (c: Tabla['columnas'][number]): string => (c.unidad ? `${c.nombre} (${c.unidad})` : c.nombre);
const conNombres = (t: Tabla, fila: Readonly<Record<string, string>>): Record<string, string> =>
  Object.fromEntries(t.columnas.map(c => [nombreDeColumna(c), fila[c.id] ?? '']));
const tablaParaElAgente = (t: Tabla) => ({
  id: t.id, titulo: t.titulo, columnas: t.columnas.map(nombreDeColumna),
  filas: filasDe(t).map(f => conNombres(t, f)), notas: t.notas ?? [], fuentes: fuentesDe(t)
});

/**
 * Sin nada, todas las tablas y las cuentas, con sus tags; con `tabla`, esa
 * tabla con sus filas; con `buscar`, las filas de cualquier tabla que contengan el texto.
 */
export function consultarReferencia(p: { tabla?: string | undefined; buscar?: string | undefined }) {
  if (p.buscar) {
    const q = normalizar(p.buscar);
    return { coincidencias: TABLAS.flatMap(t =>
      filasDe(t).filter(f => Object.values(f).some(x => normalizar(x).includes(q)))
        .map(f => ({ tabla: t.titulo, fila: conNombres(t, f), fuentes: fuentesDe(t) }))) };
  }
  if (!p.tabla) {
    return {
      tablas: TODAS.flatMap(f => (f.tipo === 'tabla' ? [{ id: f.tabla.id, titulo: f.tabla.titulo, tags: f.tags ?? [] }] : [])),
      cuentas: TODAS.flatMap(f => (f.tipo === 'cuenta'
        ? [{ id: f.cuenta.id, titulo: f.cuenta.titulo, tags: f.tags ?? [], herramienta_mcp: nombreMcp(f.cuenta) }] : []))
    };
  }
  const tabla = TABLAS.find(t => t.id === p.tabla);
  if (!tabla) return { error: `No hay tabla «${p.tabla}».`, opciones: TABLAS.map(t => t.id) };
  return { tabla: tablaParaElAgente(tabla) };
}

/** Lo que ve el agente de una `calcular_*`: qué cuenta es, a qué pregunta responde y qué devuelve. */
export const descripcionDe = (c: Cuenta): string =>
  `${c.titulo}. ${c.descripcion ? `${c.descripcion} ` : ''}Devuelve el resultado con las constantes de la app y sus fuentes. Si falta un dato, devuelve qué falta y sus opciones.`;

export function esquemaDe(c: Cuenta): Record<string, z.ZodTypeAny> {
  return Object.fromEntries(c.entradas.map(e => [e.id, e.tipo === 'numero'
    ? z.number().optional().describe(`${e.nombre}${e.unidad ? `, en ${e.unidad}` : ''}.${e.porDefecto !== null ? ` Sin él, ${e.porDefecto}.` : ''}`)
    : z.string().optional().describe(`${e.nombre}: una de ${e.opciones.map(o => o.texto).join('; ')}. Sin ella, ${e.opciones.find(o => o.valor === e.porDefecto)?.texto ?? e.porDefecto}.`)]));
}

/** Un dato que falta o no vale, como lo devuelven `calcular_pan` y `calcular_sal`; `opciones` sólo en una opción. */
interface Faltante { dato: string; opciones?: string[] }

export function calcularParaElAgente(c: Cuenta, pedido: Record<string, unknown>):
  { faltan: Faltante[] } | { error: string } |
  { resultado: unknown; tabla?: unknown; advertencias: readonly string[]; notas: readonly string[]; fuentes: readonly Fuente[] } {
  const faltan: Faltante[] = [];
  const v: Record<string, number | string | null> = {};
  for (const e of c.entradas) {
    const x = pedido[e.id];
    if (e.tipo === 'numero') {
      if (typeof x === 'number' && Number.isFinite(x) && x >= 0) v[e.id] = x;
      else if (e.porDefecto !== null) v[e.id] = e.porDefecto;
      else if (!e.visibleSi || e.visibleSi({ ...v })) faltan.push({ dato: e.id });
    } else if (x === undefined) v[e.id] = e.porDefecto;
    else {
      const o = typeof x === 'string'
        ? e.opciones.find(op => normalizar(op.valor) === normalizar(x) || normalizar(op.texto) === normalizar(x))
        : undefined;
      if (o) v[e.id] = o.valor; else faltan.push({ dato: e.id, opciones: e.opciones.map(op => op.texto) });
    }
  }
  if (faltan.length) return { faltan };
  const r = c.calcular(v as Valores);
  // Si ya no falta ningún dato visible, lo que no sale son los valores mismos.
  if (!r) return { error: 'Con esos valores no se puede calcular: revisá que las medidas y cantidades sean positivas y coherentes.' };
  return { resultado: r.lineas, ...(r.tabla ? { tabla: r.tabla } : {}), advertencias: r.advertencias, notas: c.notas ?? [], fuentes: r.fuentes };
}
