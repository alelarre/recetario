/**
 * La forma de los números y de los tipos de *Evento*: no mira ningún valor,
 * sólo que cada número diga de dónde sale —una fuente con URL, o la nota de
 * por qué no tiene— y que cada tipo nombre grupos, cosas y atajos que
 * existen. La usan los tests que custodian `datos/` y los tipos.
 */
import type { Dato, TipoDeEvento } from './tipos.js';

const esDato = (x: unknown): x is Dato => typeof x === 'object' && x !== null && 'valor' in x && 'fuente' in x;

/** Todos los números de un archivo de datos, con su camino: «ASADO.tira». */
export function datosDe(nombre: string, x: unknown): { donde: string; dato: Dato }[] {
  if (esDato(x)) return [{ donde: nombre, dato: x }];
  if (Array.isArray(x)) return x.flatMap((y, i) => datosDe(`${nombre}[${i}]`, y));
  if (typeof x === 'object' && x !== null) return Object.entries(x).flatMap(([k, y]) => datosDe(`${nombre}.${k}`, y));
  return [];
}

export function problemasDeDato(donde: string, d: Dato): string[] {
  const problemas: string[] = [];
  if (!Number.isFinite(d.valor) || d.valor < 0) problemas.push(`${donde}: el valor no es un número positivo`);
  if (d.fuente === null) {
    if (!d.nota.trim()) problemas.push(`${donde}: va sin fuente y sin nota`);
  } else if (!/^https?:\/\/\S+$/.test(d.fuente.url)) {
    problemas.push(`${donde}: la fuente «${d.fuente.nombre}» no tiene una URL http o https`);
  }
  return problemas;
}

export function problemasDeTipo(t: TipoDeEvento): string[] {
  const p: string[] = [];
  const grupos = new Set(t.grupos.map(g => g.id));
  const cosas = new Set<string>();
  for (const c of t.cosas) {
    if (cosas.has(c.id)) p.push(`${t.id}: la cosa «${c.id}» está dos veces`);
    cosas.add(c.id);
    if (!grupos.has(c.grupo)) p.push(`${t.id}: la cosa «${c.id}» es de un grupo que no está, «${c.grupo}»`);
  }
  for (const g of t.grupos) if (!t.cosas.some(c => c.grupo === g.id)) p.push(`${t.id}: el grupo «${g.id}» no tiene cosas`);
  const atajo = t.atajo;
  if (atajo) {
    const dato = t.datos.find(x => x.id === atajo.dato);
    if (dato?.tipo !== 'opcion') p.push(`${t.id}: el atajo es de «${atajo.dato}», que no es una opción del tipo`);
    else for (const o of dato.opciones) if (!(o.valor in atajo.cosas)) p.push(`${t.id}: la opción «${o.valor}» del atajo no prende nada`);
    for (const id of Object.values(atajo.cosas).flat()) if (!cosas.has(id)) p.push(`${t.id}: el atajo nombra «${id}», que no es una cosa`);
  }
  if (t.cifra && !grupos.has(t.cifra.grupo)) p.push(`${t.id}: la cifra es de un grupo que no está, «${t.cifra.grupo}»`);
  const ademas = t.ademas.map(a => a.ademas.id);
  if (new Set(ademas).size !== ademas.length) p.push(`${t.id}: lo que se suma después está repetido`);
  return p;
}
