/**
 * La cuenta común de un evento: para cada cosa prendida, su porción por las
 * personas, repartida en su grupo, por los factores del grupo y el margen; y
 * después lo que se suma —bebidas, infusiones, hielo, carbón o leña—, que lee
 * lo ya calculado. No tiene ningún número propio: los trae cada tipo de
 * `datos/`, y los tests le pasan otros.
 */
import type { Fuente } from '../referencias/tipos.js';
import type {
  Calculado, Comunes, Contexto, CosaSimple, Dato, EstadoEvento, GrupoDeResultado, IdAdemas, Item, Linea,
  ResultadoEvento, TipoDeEvento, Tramo, ValorDeDato
} from './tipos.js';
import { estadoDeTipo, tipoDe, valoresDe } from './estado.js';
import { envases, personas, peso, unidades, volumen } from './formato.js';

/** Las que se suman después, en el orden en que se calculan: el hielo enfría lo que calcularon las bebidas. */
const ORDEN: readonly IdAdemas[] = ['bebidas', 'infusiones', 'hielo', 'combustible'];

/** Una porción que no depende del evento. */
export const fija = (d: Dato) => (): Dato => d;

/** El factor del tramo de horas: el primero que las alcanza. */
export function porTramo(tramos: readonly Tramo[], horas: number): Dato | null {
  const t = tramos.find(x => x.hastaHoras === null || horas <= x.hastaHoras) ?? tramos[tramos.length - 1];
  return t?.factor ?? null;
}

/** El dato de la opción elegida —la ocasión—; `null` si la opción no lo cambia o no está. */
export function deOpcion(tabla: Readonly<Record<string, Dato | null>>, valor: ValorDeDato | undefined): Dato | null {
  return typeof valor === 'string' && Object.hasOwn(tabla, valor) ? tabla[valor] ?? null : null;
}

export const soloDatos = (...xs: readonly (Dato | null)[]): Dato[] => xs.filter((x): x is Dato => x !== null);

/** La cantidad de una cosa simple, en su unidad de compra. */
function enCompra(c: CosaSimple, total: number): string {
  const base = c.unidad === 'g' ? peso(total)
    : c.unidad === 'ml' ? volumen(total)
    : unidades(total, { nombre: c.nombreUnidad, porDocena: c.docenas === true });
  return c.envase ? `${envases(total, c.envase.cantidad.valor, c.envase.nombre)} (${base})` : base;
}

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
  let carneG = 0;
  let cifraG = 0;

  for (const g of t.grupos) {
    const cosas = t.cosas.filter(c => c.grupo === g.id && (et.cosas[c.id] ?? c.prendida));
    if (!cosas.length) continue;
    const factores = g.factores?.(contexto) ?? [];
    usados.push(...factores);
    const multiplica = factores.reduce((p, x) => p * x.valor, 1) * margen * (g.seReparte ? 1 / cosas.length : 1);
    const enCifra = t.cifra?.grupo === g.id;
    const items: Item[] = [];
    for (const c of cosas) {
      const personas = c.chicoEntero ? adultos + chicos : contexto.personas;
      if ('partes' in c) {
        for (const p of c.partes) {
          const porcion = p.porcion(contexto);
          usados.push(porcion);
          const total = porcion.valor * personas * multiplica;
          if (c.carne) carneG += total;
          if (enCifra) cifraG += total;
          items.push({ id: `${c.id}-${p.id}`, nombre: p.nombre, cantidad: peso(total) });
        }
        continue;
      }
      const porcion = c.porcion(contexto);
      usados.push(porcion, ...(c.envase ? [c.envase.cantidad] : []));
      const total = porcion.valor * personas * multiplica;
      if (c.carne && c.unidad === 'g') carneG += total;
      if (enCifra && c.unidad === 'g') cifraG += total;
      items.push({ id: c.id, nombre: c.nombre, cantidad: enCompra(c, total) });
    }
    grupos.push({ titulo: g.titulo, items });
  }

  let calculado: Calculado = { contexto, margen, carneG, mlFrios: 0 };
  const ademas: Item[] = [];
  const avisos: string[] = [];
  for (const id of ORDEN) {
    const declarado = t.ademas.find(x => x.ademas.id === id);
    const estado = et.ademas[id];
    if (!declarado || !(estado?.prendido ?? declarado.prendido)) continue;
    const r = declarado.ademas.calcular(calculado, valoresDe(declarado.ademas.datos, estado?.datos ?? {}));
    ademas.push(...r.items);
    usados.push(...r.usados);
    avisos.push(...(r.advertencias ?? []));
    if (r.mlFrios !== undefined) calculado = { ...calculado, mlFrios: r.mlFrios };
  }

  if (!grupos.length && !ademas.length) return null;
  const cifras: Linea[] = [{ nombre: 'Personas', valor: personas(adultos + chicos) }];
  if (t.cifra && cifraG > 0) cifras.push({ nombre: t.cifra.nombre, valor: peso(cifraG) });
  const { fuentes, advertencias } = procedencia(usados);
  return { titulo: tituloDe(t, adultos, chicos), cifras, grupos, ademas, fuentes, advertencias: [...avisos, ...advertencias] };
}

/** La lista como texto, para mandar: el título, cada grupo con sus ítems y lo que se suma después. */
export function textoEvento(r: ResultadoEvento): string {
  const bloque = (titulo: string, items: readonly Item[]): string =>
    [titulo, ...items.map(i => `- ${i.nombre}: ${i.cantidad}`)].join('\n');
  return [r.titulo, ...r.grupos.map(g => bloque(g.titulo, g.items)), ...(r.ademas.length ? [bloque('Además', r.ademas)] : [])].join('\n\n');
}
