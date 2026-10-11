/**
 * La cuenta común de un evento: para cada cosa prendida, su porción por las
 * personas, repartida en su grupo, por los factores del grupo y el margen; y
 * después lo que se suma —bebidas, infusiones, hielo, carbón o leña—, que lee
 * lo ya calculado. No tiene ningún número propio: los trae cada tipo de
 * `datos/`, y los tests le pasan otros.
 */
import type { Fuente } from '../referencias/tipos.js';
import type {
  Calculado, Comunes, Contexto, Cosa, CosaSimple, Dato, EstadoEvento, GrupoDeResultado, IdAdemas, Item, Linea,
  ResultadoEvento, TipoDeEvento, Tramo
} from './tipos.js';
import { estadoDeTipo, tipoDe, valoresDe } from './estado.js';
import { envases, personas, peso, unidades, volumen } from './formato.js';
import { avisosDeRestricciones } from './restricciones.js';
import { partes } from './reparto.js';

/** Las que se suman después, en el orden en que se calculan: el hielo enfría lo que calcularon las bebidas. */
const ORDEN: readonly IdAdemas[] = ['bebidas', 'infusiones', 'hielo', 'combustible'];

/** Una porción que no depende del evento. */
export const fija = (d: Dato) => (): Dato => d;

/** El factor del tramo de horas: el primero que las alcanza. */
export function porTramo(tramos: readonly Tramo[], horas: number): Dato | null {
  const t = tramos.find(x => x.hastaHoras === null || horas <= x.hastaHoras) ?? tramos[tramos.length - 1];
  return t?.factor ?? null;
}

export const soloDatos = (...xs: readonly (Dato | null)[]): Dato[] => xs.filter((x): x is Dato => x !== null);

/** La cantidad de una cosa simple, en su unidad de compra. */
function enCompra(c: CosaSimple, total: number): string {
  const base = c.unidad === 'g' ? peso(total)
    : c.unidad === 'ml' ? volumen(total)
    : unidades(total, { nombre: c.nombreUnidad, porDocena: c.docenas === true });
  return c.envase ? `${envases(total, c.envase.cantidad.valor, c.envase.nombre)} (${base})` : base;
}

/** Un total en la unidad de la cosa, sin docenas ni envases: «5,9 kg», «88». */
function totalEn(c: CosaSimple, total: number): string {
  return c.unidad === 'g' ? peso(total) : c.unidad === 'ml' ? volumen(total) : unidades(total, { nombre: c.nombreUnidad });
}

/** En qué se mide una cosa: dos cosas con la misma medida se suman en un total. */
const medida = (c: Cosa): string => ('partes' in c ? 'partes' : `${c.unidad}|${c.nombreUnidad ?? ''}|${c.envase?.nombre.varios ?? ''}`);

const cuantos = (n: number, uno: string, varios: string): string => `${personas(n)} ${n === 1 ? uno : varios}`;

/** «Asado para 12 (10 adultos, 2 chicos)»; sin chicos, «Asado para 10». */
function tituloDe(t: TipoDeEvento, adultos: number, chicos: number): string {
  const total = `${t.nombre} para ${personas(adultos + chicos)}`;
  return chicos ? `${total} (${cuantos(adultos, 'adulto', 'adultos')}, ${cuantos(chicos, 'chico', 'chicos')})` : total;
}

/** Las fuentes de los números usados, una vez por link; las notas de los que van sin fuente, como advertencias. */
function procedencia(usados: readonly Dato[]): { fuentes: Fuente[]; advertencias: string[] } {
  const fuentes: Fuente[] = [];
  const advertencias: string[] = [];
  for (const d of usados) {
    if (d.fuente === null) {
      if (!advertencias.includes(d.nota)) advertencias.push(d.nota);
      continue;
    }
    const f = d.fuente;
    if (!fuentes.some(x => x.url === f.url)) fuentes.push(f);
  }
  return { fuentes, advertencias };
}

export function calcularEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes): ResultadoEvento | null {
  const t = tipoDe(e, tipos);
  const adultos = e.adultos ?? 0;
  const chicos = e.chicos ?? 0;
  if (!t || adultos + chicos <= 0) return null;
  const et = estadoDeTipo(e, t);
  const contexto: Contexto = {
    adultos, chicos, personas: adultos + chicos * comunes.factorChico.valor,
    horas: e.horas && e.horas > 0 ? e.horas : comunes.horas,
    calor: e.calor, tipo: valoresDe(t.datos, et.datos)
  };
  const margen = 1 + e.margen / 100;
  const usados: Dato[] = chicos > 0 ? [comunes.factorChico] : [];
  const grupos: GrupoDeResultado[] = [];
  /** Lo prendido de cada grupo, para el aviso de las restricciones. */
  const prendidas: { titulo: string; cosas: readonly Cosa[] }[] = [];
  let carneG = 0;
  let cifraG = 0;

  for (const g of t.grupos) {
    const cosas = t.cosas.filter(c => c.grupo === g.id && (et.cosas[c.id] ?? c.prendida));
    if (!cosas.length) continue;
    prendidas.push({ titulo: g.titulo, cosas });
    const factores = g.factores?.(contexto) ?? [];
    usados.push(...factores);
    const multiplica = factores.reduce((p, x) => p * x.valor, 1) * margen;
    // La parte de cada cosa en su grupo: la de los sliders, o pareja; en un grupo que no se reparte, entera.
    const parte = g.seReparte ? partes(cosas.map(c => c.id), et.reparto) : null;
    const parteDe = (c: Cosa): number => (parte ? parte[c.id] ?? 0 : 1);
    const personasDe = (c: Cosa): number => (c.chicoEntero ? adultos + chicos : contexto.personas);
    // Las cosas de una misma medida se suman en un total que el reparto divide sin cambiarlo: los
    // kilos de carne. Es lo que dan todas en partes iguales; moverlas no cambia los kilos.
    const primera = cosas[0];
    const unaMedida = g.seReparte && primera !== undefined && !('partes' in primera) && cosas.every(c => medida(c) === medida(primera));
    let totalDelGrupo = 0;
    if (unaMedida) {
      for (const c of cosas) {
        if ('partes' in c) continue;
        const porcion = c.porcion(contexto);
        totalDelGrupo += porcion.valor * personasDe(c) * multiplica / cosas.length;
      }
    }
    const enCifra = t.cifra?.grupo === g.id;
    const items: Item[] = [];
    for (const c of cosas) {
      if ('partes' in c) {
        for (const p of c.partes) {
          const porcion = p.porcion(contexto);
          usados.push(porcion);
          const total = porcion.valor * personasDe(c) * parteDe(c) * multiplica;
          if (c.carne) carneG += total;
          if (enCifra) cifraG += total;
          items.push({ id: `${c.id}-${p.id}`, nombre: p.nombre, cantidad: peso(total), cosa: c.id });
        }
        continue;
      }
      const porcion = c.porcion(contexto);
      usados.push(porcion, ...(c.envase ? [c.envase.cantidad] : []));
      const total = unaMedida ? totalDelGrupo * parteDe(c) : porcion.valor * personasDe(c) * parteDe(c) * multiplica;
      if (c.carne && c.unidad === 'g') carneG += total;
      if (enCifra && c.unidad === 'g') cifraG += total;
      items.push({ id: c.id, nombre: c.nombre, cantidad: enCompra(c, total), cosa: c.id });
    }
    grupos.push({
      id: g.id, titulo: g.titulo, items,
      ...(unaMedida && cosas.length > 1 && primera && !('partes' in primera) ? { total: totalEn(primera, totalDelGrupo) } : {}),
      ...(parte && cosas.length > 1 ? { reparto: Object.fromEntries(cosas.map(c => [c.id, Math.round(parteDe(c) * 100)])) } : {})
    });
  }

  let calculado: Calculado = { contexto, margen, carneG, mlFrios: 0, reparto: et.reparto };
  const ademas: { id: string; titulo: string; items: Item[]; reparto?: Record<string, number> }[] = [];
  const avisos: string[] = [];
  for (const id of ORDEN) {
    const declarado = t.ademas.find(x => x.ademas.id === id);
    const estado = et.ademas[id];
    if (!declarado || !(estado?.prendido ?? declarado.prendido)) continue;
    const r = declarado.ademas.calcular(calculado, valoresDe(declarado.ademas.datos, estado?.datos ?? {}));
    // Cada uno en su grupo, en el orden en que aparecen: «Además» y «Para el fuego».
    if (r.items.length) {
      let grupo = ademas.find(g => g.titulo === declarado.ademas.grupo);
      if (!grupo) {
        grupo = { id: declarado.ademas.grupo, titulo: declarado.ademas.grupo, items: [] };
        ademas.push(grupo);
      }
      grupo.items.push(...r.items);
      if (r.reparto && Object.keys(r.reparto).length) grupo.reparto = { ...grupo.reparto, ...r.reparto };
    }
    usados.push(...r.usados);
    avisos.push(...(r.advertencias ?? []));
    if (r.mlFrios !== undefined) calculado = { ...calculado, mlFrios: r.mlFrios };
  }

  if (!grupos.length && !ademas.length) return null;
  const cifras: Linea[] = [{ nombre: 'Personas', valor: personas(adultos + chicos) }];
  if (t.cifra && cifraG > 0) cifras.push({ nombre: t.cifra.nombre, valor: peso(cifraG) });
  const { fuentes, advertencias } = procedencia(usados);
  return {
    titulo: tituloDe(t, adultos, chicos), cifras, grupos, ademas, fuentes,
    advertencias: [...avisosDeRestricciones(prendidas, e.restricciones), ...avisos, ...advertencias]
  };
}

/** La lista como texto, para mandar: el título, y cada grupo —también los de lo que se suma— con sus ítems. */
export function textoEvento(r: ResultadoEvento): string {
  const bloque = (g: GrupoDeResultado): string =>
    [tituloDeGrupo(g), ...g.items.map(i => `- ${i.nombre}: ${i.cantidad}`)].join('\n');
  return [r.titulo, ...[...r.grupos, ...r.ademas].map(bloque)].join('\n\n');
}

/** El título de un grupo, con su total si lo tiene: «Carne · 5,9 kg». */
export function tituloDeGrupo(g: GrupoDeResultado): string {
  return g.total ? `${g.titulo} · ${g.total}` : g.titulo;
}
