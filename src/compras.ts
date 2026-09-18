/**
 * La lista de compras: los ingredientes de todo lo que el plan tiene cargado.
 *
 * Deriva del plan y no se escribe en Drive: se lee en la app y se comparte como
 * texto. Es puro —recibe las recetas ya leídas— para que la regla de la suma
 * sea probable sin red.
 */
import { gruposDe } from './recipe.js';
import type { Receta } from './tipos.js';

export interface Item {
  nombre: string;
  cantidad: string;
}

export interface ListaDeCompras {
  conCantidad: Item[];
  /** Un recordatorio: el nombre y nada más, una vez cada uno. */
  sinCantidad: string[];
}

/** Lo que empieza con un número: `250 g`, `1,5 l`, `3`. Coma o punto como decimal. */
const NUMERO = /^(\d+(?:[.,]\d+)?)\s*(.*)$/;

/** El número escrito con punto y sin ceros de más: 500, 1.5. */
const comoTexto = (n: number): string => String(Math.round(n * 1e6) / 1e6);

interface Acumulado {
  nombre: string;
  /** El número acumulado, o `null` si la cantidad no empieza con número: esa no se suma con nada. */
  numero: number | null;
  /** El resto del texto tal como vino la primera vez; se muestra así. */
  unidad: string;
}

export function listaDeCompras(recetas: Receta[]): ListaDeCompras {
  const acumulados: Acumulado[] = [];
  const sinCantidad: string[] = [];

  for (const receta of recetas) {
    for (const grupo of gruposDe(receta.ingredientes)) {
      for (const { nombre, cantidad } of grupo.items) {
        if (!cantidad) {
          // Sin cantidad, una vez por nombre: es un recordatorio, no una suma.
          if (!sinCantidad.includes(nombre)) sinCantidad.push(nombre);
          continue;
        }
        const m = cantidad.match(NUMERO);
        if (!m) { acumulados.push({ nombre, numero: null, unidad: cantidad }); continue; }
        const numero = Number((m[1] ?? '0').replace(',', '.'));
        const unidad = (m[2] ?? '').trim();
        // Se suma sólo con el mismo nombre —tal como está escrito (C05.4b.1)—
        // y el mismo resto de texto. `500 g` y `2 tazas` son dos ítems: acá no
        // se convierte nada.
        const previo = acumulados.find(a =>
          a.numero !== null && a.nombre === nombre && a.unidad.toLowerCase() === unidad.toLowerCase());
        if (previo && previo.numero !== null) previo.numero += numero;
        else acumulados.push({ nombre, numero, unidad });
      }
    }
  }

  // Alfabético por nombre, y para el mismo nombre el orden en que aparecieron:
  // `sort` es estable, así que alcanza con comparar el nombre.
  const conCantidad = acumulados
    .map(a => ({
      nombre: a.nombre,
      cantidad: a.numero === null ? a.unidad : [comoTexto(a.numero), a.unidad].filter(Boolean).join(' ')
    }))
    .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));

  return { conCantidad, sinCantidad: [...sinCantidad].sort((a, b) => a.localeCompare(b, 'es')) };
}

/** La lista para el menú Compartir, con la negrita que WhatsApp entiende (como `texto-receta.ts`). */
export function textoCompras({ conCantidad, sinCantidad }: ListaDeCompras): string {
  const partes: string[] = [];
  if (conCantidad.length) {
    partes.push(`*Con cantidad*\n${conCantidad.map(i => `- ${i.nombre}: ${i.cantidad}`).join('\n')}`);
  }
  if (sinCantidad.length) {
    partes.push(`*Sin cantidad*\n${sinCantidad.map(n => `- ${n}`).join('\n')}`);
  }
  return partes.join('\n\n');
}
