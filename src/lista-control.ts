/**
 * El controlador de una lista de recetas: los filtros, el orden, cuántas
 * tarjetas van dibujadas y el observador que agranda el tramo. Lo usan la
 * categoría, la lista por tag, Borradores, los resultados y *Agregar al plan*;
 * el HTML es de `ui/lista-recetas.ts`.
 *
 * El orden se aplica acá y una sola vez, antes de cortar el tramo: ordenar
 * después de cortar dejaría afuera del primer tramo lo que el orden trae
 * adelante.
 *
 * Vive lo que la pantalla: `estadoNuevo()` crea uno nuevo al cambiar de
 * pantalla, así un filtro no queda puesto en otra lista donde no se ve.
 */
import { contarDuraciones, filtrarPorDuracion, ordenarRecetas, duracionValida } from './catalogo.js';
import type { Duracion, Orden } from './catalogo.js';
import type { SeccionDeAcciones } from './acciones.js';
import type { Coincidencia, Coincidencias, Entrada } from './tipos.js';

/**
 * Cuántas tarjetas dibuja una lista de una vez. El tramo no es una lectura de
 * red —el índice ya está entero en memoria—: es cuántas se dibujan.
 */
export const TRAMO = 30;

/** Una receta de la lista y, en los resultados por ingrediente o por tag, por qué apareció. */
export interface ItemDeLista { entrada: Entrada; motivo?: string }

/** Lo que dibuja una lista sin grupos: ya filtrada, ordenada y cortada al tramo. */
export interface ListaPlana {
  entradas: Entrada[];
  /** Cuántas hay con los filtros puestos, dibujadas o no: lo dice el encabezado. */
  total: number;
  /** Falta dibujar al menos un tramo: va el spinner del final. */
  hayMas: boolean;
  /** Cuántas recetas hay con cada duración, sobre la lista sin el filtro de duración. */
  duraciones: { valor: Duracion; cantidad: number }[];
  duracionesActivas: string[];
  /** El orden puesto, o `null` si no hay conmutador: ninguna receta tiene duración. */
  orden: Orden | null;
}

export interface GrupoDeLista {
  rotulo: string;
  /** Cuántas trae el grupo, dibujadas o no. */
  total: number;
  /** Las que entran en el tramo. */
  items: ItemDeLista[];
}

/** Los resultados de una búsqueda: los tres grupos, ordenados cada uno y cortados al tramo entre todos. */
export interface ListaAgrupada {
  grupos: GrupoDeLista[];
  total: number;
  hayMas: boolean;
  orden: Orden | null;
}

export interface ListaControl {
  readonly tagsActivos: readonly string[];
  readonly duracionesActivas: readonly string[];
  readonly orden: Orden;
  /** Cuántas tarjetas de la lista están dibujadas: crece de a un tramo. */
  readonly visibles: number;
  alternarTag(tag: string): void;
  alternarDuracion(valor: string): void;
  ordenar(orden: Orden): void;
  /** Suma un tramo. */
  mas(): void;
  /** Vuelve al primer tramo: lo que se lista cambió. */
  primerTramo(): void;
  /**
   * La lista de la categoría o de un tag: `entradas` ya filtradas por tags.
   * Con `filtros: false` no hay filtro de duración ni conmutador, y va en A–Z.
   * Con `paginar: false` van todas, sin tramo.
   */
  plana(entradas: Entrada[], opciones?: { filtros?: boolean; paginar?: boolean }): ListaPlana;
  agrupada(grupos: Coincidencias): ListaAgrupada;
  /**
   * Observa el spinner del tramo de esta lista, el que encuentra `spinner`:
   * cuando entra en pantalla, suma un tramo y llama a `redibujar`. Se llama
   * después de cada dibujo de la lista, porque el spinner es otro. Lo busca
   * quien dibuja: la pantalla puede tener otra lista con su propio spinner.
   */
  observar(spinner: () => Element | null, redibujar: () => unknown): void;
  /** Deja de observar: la pantalla se va. */
  soltar(): void;
}

const alternar = (lista: readonly string[], valor: string): string[] =>
  lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor];

/**
 * Ordena las coincidencias por su entrada sin perder el motivo, que viaja con
 * la coincidencia y no con la entrada.
 */
function ordenarItems(items: ItemDeLista[], orden: Orden): ItemDeLista[] {
  const porId = new Map(items.map(i => [i.entrada.id_archivo, i]));
  return ordenarRecetas(items.map(i => i.entrada), orden)
    .map(e => porId.get(e.id_archivo))
    .filter((i): i is ItemDeLista => !!i);
}

export function crearListaControl(): ListaControl {
  let tagsActivos: string[] = [];
  let duracionesActivas: string[] = [];
  let orden: Orden = 'alfa';
  let visibles = TRAMO;
  let observador: IntersectionObserver | null = null;

  const soltar = (): void => { observador?.disconnect(); observador = null; };

  return {
    get tagsActivos() { return tagsActivos; },
    get duracionesActivas() { return duracionesActivas; },
    get orden() { return orden; },
    get visibles() { return visibles; },

    alternarTag(tag) { tagsActivos = alternar(tagsActivos, tag); visibles = TRAMO; },
    alternarDuracion(valor) { duracionesActivas = alternar(duracionesActivas, valor); visibles = TRAMO; },
    ordenar(nuevo) { orden = nuevo; visibles = TRAMO; },
    mas() { visibles += TRAMO; },
    primerTramo() { visibles = TRAMO; },

    plana(entradas, { filtros = true, paginar = true } = {}) {
      const duraciones = filtros ? contarDuraciones(entradas) : [];
      const activas = filtros ? duracionesActivas : [];
      // Sin fila de duraciones no hay conmutador para volver a A–Z: ahí el
      // orden por duración se ignora en vez de quedar pegado sin control.
      const conConmutador = duraciones.length > 0 || activas.length > 0;
      const efectivo: Orden = conConmutador ? orden : 'alfa';
      const todas = ordenarRecetas(filtrarPorDuracion(entradas, activas), efectivo);
      const tope = paginar ? visibles : todas.length;
      return {
        entradas: todas.slice(0, tope),
        total: todas.length,
        hayMas: tope < todas.length,
        duraciones,
        duracionesActivas: [...activas],
        orden: conConmutador ? efectivo : null
      };
    },

    agrupada({ porNombre, porIngrediente, porTag }) {
      const conMotivo = (cs: Coincidencia[]): ItemDeLista[] => cs.map(c => ({ entrada: c.entrada, motivo: c.motivo }));
      const crudos: [string, ItemDeLista[]][] = [
        ['Por nombre', porNombre.map(entrada => ({ entrada }))],
        ['Por ingrediente', conMotivo(porIngrediente)],
        ['Por tag', conMotivo(porTag)]
      ];
      const conConmutador = crudos.some(([, items]) => items.some(i => duracionValida(i.entrada.tiempo)));
      const efectivo: Orden = conConmutador ? orden : 'alfa';
      // El tramo se reparte en el orden de los grupos: el que no entra entero
      // queda cortado y los de abajo esperan al tramo siguiente.
      let quedan = visibles;
      const grupos: GrupoDeLista[] = [];
      let total = 0;
      for (const [rotulo, items] of crudos) {
        if (!items.length) continue;
        total += items.length;
        if (quedan <= 0) continue;
        grupos.push({ rotulo, total: items.length, items: ordenarItems(items, efectivo).slice(0, quedan) });
        quedan -= items.length;
      }
      return { grupos, total, hayMas: visibles < total, orden: conConmutador ? efectivo : null };
    },

    observar(spinner, redibujar) {
      soltar();
      // `IntersectionObserver` no existe en Node, donde corren los tests: se
      // pregunta antes, igual que el resto del código hace con `navigator`.
      if (typeof IntersectionObserver === 'undefined') return;
      const spin = spinner();
      if (!spin) return;
      observador = new IntersectionObserver(entradas => {
        if (!entradas.some(e => e.isIntersecting)) return;
        visibles += TRAMO;
        void redibujar();
      });
      observador.observe(spin);
    },

    soltar
  };
}

/**
 * Los filtros y el orden de la lista de la pantalla. El chip de un tag no lleva
 * `data-accion` sino `data-tag`, y lo atiende `main.ts`: desde el Recetario
 * navega en vez de filtrar.
 */
export const accionesDeLista = (lista: () => ListaControl, redibujar: () => unknown): SeccionDeAcciones => ({
  'filtrar-duracion': (boton) => {
    lista().alternarDuracion(boton.dataset['valor'] ?? '');
    return redibujar();
  },
  ordenar: (boton) => {
    lista().ordenar(boton.dataset['valor'] === 'duracion' ? 'duracion' : 'alfa');
    return redibujar();
  }
});
