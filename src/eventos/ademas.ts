/**
 * Lo que se suma después de las cosas: bebidas, infusiones, hielo, carbón o
 * leña. Cada fábrica recibe sus números de `datos/`, como las cuentas de las
 * referencias, y los tests le pasan otros. El margen ya viene en lo
 * calculado; lo que lee de las cosas —la carne, la bebida fría— ya lo trae.
 */
import type { Ademas, Dato, Item, NombreDeEnvase, Valores } from './tipos.js';
import { envases, peso, unidades, volumen } from './formato.js';
import { partes } from './reparto.js';

export interface Bebida {
  id: string;
  nombre: string;
  alcohol: boolean;
  /** Mililitros por persona por hora si es la única de las suyas, con alcohol o sin. */
  mlPorHora: Dato;
  /** Lo que se sirve con ella: la cola del fernet, en ml por ml. */
  con?: { id: string; nombre: string; mlPorMl: Dato };
}
export interface DatosBebidas {
  bebidas: readonly Bebida[];
  /** Las primeras horas se toma a pleno; cada una de las siguientes cuenta `despues`. */
  horasPlenas: Dato;
  despues: Dato;
  calor: Dato;
  /** Lo que toma un chico de lo sin alcohol, sobre lo que toma un adulto. */
  chico: Dato;
  /** El espumante del brindis, por adulto. */
  brindis: { mlPorAdulto: Dato };
}
export interface DatosHielo { kgPorPersona: Dato; kgPorLitroFrio: Dato; calor: Dato; bolsa: { kg: Dato; nombre: NombreDeEnvase } }
export interface Infusion { id: string; nombre: string; prendida: boolean; porTaza: Dato; unidad: 'g' | 'saquitos' | 'ml' }
export interface DatosInfusiones { tazasPorPersona: Dato; infusiones: readonly Infusion[] }
export interface DatosCombustible { carbonPorKgCarne: Dato; lenaPorKgCarne: Dato; vientoOFrio: Dato; bolsaCarbon: { kg: Dato; nombre: NombreDeEnvase } }

/** La clave de una bebida en el reparto del tipo: no se cruza con las de las cosas. */
const clave = (id: string): string => `bebidas.${id}`;

/** `prendidas`: las que van al empezar, por `id`; `brindis`, el espumante del brindis. Cambian con el tipo. */
export function bebidas(d: DatosBebidas, prendidas: readonly string[]): Ademas {
  const deTipo = (alcohol: boolean, v: Valores): Bebida[] => d.bebidas.filter(b => b.alcohol === alcohol && v[b.id] === true);
  return {
    id: 'bebidas', nombre: 'Bebidas', grupo: 'Bebidas',
    // Dos repartos: el de las con alcohol divide a los que toman; el de las sin alcohol, a todos.
    reparte: v => [deTipo(true, v).map(b => clave(b.id)), deTipo(false, v).map(b => clave(b.id))],
    datos: [
      { id: 'toman', nombre: 'Adultos que toman alcohol', tipo: 'numero', porDefecto: null },
      ...d.bebidas.map(b => ({ id: b.id, nombre: b.nombre, tipo: 'si-no' as const, porDefecto: prendidas.includes(b.id) })),
      { id: 'brindis', nombre: 'Espumante para el brindis', tipo: 'si-no', porDefecto: prendidas.includes('brindis') }
    ],
    calcular({ contexto: c, margen, reparto }, v) {
      const horas = Math.min(c.horas, d.horasPlenas.valor) + Math.max(0, c.horas - d.horasPlenas.valor) * d.despues.valor;
      const calor = c.calor ? d.calor.valor : 1;
      // Vacío, toman todos los adultos; nunca más que ellos.
      const toman = typeof v['toman'] === 'number' ? Math.min(v['toman'], c.adultos) : c.adultos;
      const items: Item[] = [];
      const usados: Dato[] = [];
      const porcentajes: Record<string, number> = {};
      let mlFrios = 0;
      // Sólo los litros: el envase lo elige el que compra.
      const sumar = (id: string, nombre: string, ml: number, cosa: string | undefined, ...datos: Dato[]): void => {
        items.push({ id, nombre, cantidad: volumen(ml), ...(cosa ? { cosa } : {}) });
        usados.push(...datos);
        mlFrios += ml;
      };
      for (const alcohol of [true, false]) {
        const grupo = deTipo(alcohol, v);
        // El reparto divide a la gente, no los litros: cada uno toma a su ritmo.
        const parte = partes(grupo.map(b => clave(b.id)), reparto);
        if (grupo.length > 1) for (const b of grupo) porcentajes[clave(b.id)] = Math.round((parte[clave(b.id)] ?? 0) * 100);
        // Los chicos toman sólo lo sin alcohol, por su factor.
        const personas = alcohol ? toman : c.adultos + c.chicos * d.chico.valor;
        for (const b of grupo) {
          const ml = b.mlPorHora.valor * horas * personas * calor * margen * (parte[clave(b.id)] ?? 0);
          if (ml <= 0) continue;
          sumar(b.id, b.nombre, ml, clave(b.id), b.mlPorHora, d.horasPlenas, d.despues,
            ...(c.calor ? [d.calor] : []), ...(!alcohol && c.chicos > 0 ? [d.chico] : []));
          if (b.con) sumar(b.con.id, b.con.nombre, ml * b.con.mlPorMl.valor, undefined, b.con.mlPorMl);
        }
      }
      if (v['brindis'] === true && c.adultos > 0) {
        sumar('brindis', 'Espumante para el brindis', d.brindis.mlPorAdulto.valor * c.adultos * margen, undefined, d.brindis.mlPorAdulto);
      }
      return { items, usados, mlFrios, reparto: porcentajes };
    }
  };
}

export function hielo(d: DatosHielo): Ademas {
  return {
    id: 'hielo', nombre: 'Hielo', grupo: 'Además',
    datos: [{ id: 'enfriar', nombre: 'También para enfriar las bebidas', tipo: 'si-no', porDefecto: false }],
    calcular({ contexto: c, margen, mlFrios }, v) {
      const enfriar = v['enfriar'] === true;
      // Los vasos son de todos: el chico cuenta entero.
      const kg = d.kgPorPersona.valor * (c.adultos + c.chicos) * (c.calor ? d.calor.valor : 1) * margen
        + (enfriar ? d.kgPorLitroFrio.valor * mlFrios / 1000 : 0);
      if (kg <= 0) return { items: [], usados: [] };
      return {
        items: [{ id: 'hielo', nombre: 'Hielo', cantidad: `${peso(kg * 1000)} · ${envases(kg, d.bolsa.kg.valor, d.bolsa.nombre)}` }],
        usados: [d.kgPorPersona, d.bolsa.kg, ...(c.calor ? [d.calor] : []), ...(enfriar ? [d.kgPorLitroFrio] : [])]
      };
    }
  };
}

export function infusiones(d: DatosInfusiones): Ademas {
  return {
    id: 'infusiones', nombre: 'Infusiones', grupo: 'Bebidas',
    datos: d.infusiones.map(i => ({ id: i.id, nombre: i.nombre, tipo: 'si-no' as const, porDefecto: i.prendida })),
    calcular({ contexto: c, margen }, v) {
      const prendidas = d.infusiones.filter(i => v[i.id] === true);
      if (!prendidas.length || c.personas <= 0) return { items: [], usados: [] };
      const tazas = d.tazasPorPersona.valor * c.personas * margen / prendidas.length;
      return {
        items: prendidas.map(i => {
          const cuanto = tazas * i.porTaza.valor;
          const en = i.unidad === 'g' ? peso(cuanto) : i.unidad === 'ml' ? volumen(cuanto) : unidades(cuanto, { nombre: 'saquitos' });
          return { id: i.id, nombre: i.nombre, cantidad: `${unidades(tazas, { nombre: 'tazas' })} · ${en}` };
        }),
        usados: [d.tazasPorPersona, ...prendidas.map(i => i.porTaza)]
      };
    }
  };
}

export function combustible(d: DatosCombustible): Ademas {
  return {
    id: 'combustible', nombre: 'Carbón o leña', grupo: 'Para el fuego',
    datos: [
      { id: 'que', nombre: 'Fuego', tipo: 'opcion', porDefecto: 'carbon', opciones: [{ valor: 'carbon', texto: 'Carbón' }, { valor: 'lena', texto: 'Leña' }] },
      { id: 'viento', nombre: 'Viento o frío', tipo: 'si-no', porDefecto: false }
    ],
    calcular({ carneG }, v) {
      // Sale de la carne en gramos: un asado veggie, o sólo de chorizos, no tiene de dónde.
      if (carneG <= 0) return { items: [], usados: [], advertencias: ['Sin carne en gramos, el carbón o la leña no se calcula.'] };
      const carbon = v['que'] !== 'lena';
      const porKg = carbon ? d.carbonPorKgCarne : d.lenaPorKgCarne;
      const viento = v['viento'] === true;
      const kg = carneG / 1000 * porKg.valor * (viento ? d.vientoOFrio.valor : 1);
      return {
        items: [carbon
          ? { id: 'carbon', nombre: 'Carbón', cantidad: `${peso(kg * 1000)} · ${envases(kg, d.bolsaCarbon.kg.valor, d.bolsaCarbon.nombre)}` }
          : { id: 'lena', nombre: 'Leña', cantidad: peso(kg * 1000) }],
        usados: [porKg, ...(viento ? [d.vientoOFrio] : []), ...(carbon ? [d.bolsaCarbon.kg] : [])]
      };
    }
  };
}
