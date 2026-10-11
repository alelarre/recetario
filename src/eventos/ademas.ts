/**
 * Lo que se suma después de las cosas: bebidas, infusiones, hielo, carbón o
 * leña. Cada fábrica recibe sus números de `datos/`, como las cuentas de las
 * referencias, y los tests le pasan otros. El margen ya viene en lo
 * calculado; lo que lee de las cosas —la carne, la bebida fría— ya lo trae.
 */
import type { Ademas, Dato, Item, NombreDeEnvase } from './tipos.js';
import { envases, peso, unidades, volumen } from './formato.js';

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

/** `prendidas`: las que van al empezar, por `id`; `brindis`, el espumante del brindis. Cambian con el tipo. */
export function bebidas(d: DatosBebidas, prendidas: readonly string[]): Ademas {
  return {
    id: 'bebidas', nombre: 'Bebidas', grupo: 'Además',
    datos: [
      { id: 'toman', nombre: 'Adultos que toman alcohol', tipo: 'numero', porDefecto: null },
      ...d.bebidas.map(b => ({ id: b.id, nombre: b.nombre, tipo: 'si-no' as const, porDefecto: prendidas.includes(b.id) })),
      { id: 'brindis', nombre: 'Espumante para el brindis', tipo: 'si-no', porDefecto: prendidas.includes('brindis') }
    ],
    calcular({ contexto: c, margen }, v) {
      const horas = Math.min(c.horas, d.horasPlenas.valor) + Math.max(0, c.horas - d.horasPlenas.valor) * d.despues.valor;
      const calor = c.calor ? d.calor.valor : 1;
      // Vacío, toman todos los adultos; nunca más que ellos.
      const toman = typeof v['toman'] === 'number' ? Math.min(v['toman'], c.adultos) : c.adultos;
      const prendidas = d.bebidas.filter(b => v[b.id] === true);
      const items: Item[] = [];
      const usados: Dato[] = [];
      let mlFrios = 0;
      // Sólo los litros: el envase lo elige el que compra.
      const sumar = (id: string, nombre: string, ml: number, ...datos: Dato[]): void => {
        items.push({ id, nombre, cantidad: volumen(ml) });
        usados.push(...datos);
        mlFrios += ml;
      };
      for (const alcohol of [true, false]) {
        const grupo = prendidas.filter(b => b.alcohol === alcohol);
        // Los chicos toman sólo lo sin alcohol, por su factor.
        const personas = alcohol ? toman : c.adultos + c.chicos * d.chico.valor;
        for (const b of grupo) {
          const ml = b.mlPorHora.valor * horas * personas * calor * margen / grupo.length;
          if (ml <= 0) continue;
          sumar(b.id, b.nombre, ml, b.mlPorHora, d.horasPlenas, d.despues,
            ...(c.calor ? [d.calor] : []), ...(!alcohol && c.chicos > 0 ? [d.chico] : []));
          if (b.con) sumar(b.con.id, b.con.nombre, ml * b.con.mlPorMl.valor, b.con.mlPorMl);
        }
      }
      if (v['brindis'] === true && c.adultos > 0) {
        sumar('brindis', 'Espumante para el brindis', d.brindis.mlPorAdulto.valor * c.adultos * margen, d.brindis.mlPorAdulto);
      }
      return { items, usados, mlFrios };
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
    id: 'infusiones', nombre: 'Infusiones', grupo: 'Además',
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
