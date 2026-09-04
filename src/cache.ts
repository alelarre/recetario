import type { Entrada } from './tipos.js';

/**
 * Una operación pendiente de escribir en la planilla. La cola existe para que
 * varias ediciones seguidas se agrupen en un solo `flush` en vez de gastar una
 * escritura de cuota cada una (§4.3).
 */
export interface OperacionPendiente {
  tipo: 'fila';
  id: string;
  fila: string[];
}

/**
 * El contrato del cache local. Dos implementaciones lo cumplen: la de memoria,
 * que es la que usan los tests, y la de IndexedDB, que es la que corre en el
 * navegador. Tenerlas atadas al mismo tipo es lo que evita que los tests pasen
 * contra un doble que no se parece a lo real.
 */
export interface Cache {
  leerIndice(): Promise<Entrada[]>;
  guardarIndice(entradas: Entrada[]): Promise<unknown>;
  /** Mapa id de archivo → número de fila en la planilla. */
  leerMapaFilas(): Promise<Map<string, number>>;
  guardarMapaFilas(mapa: Map<string, number>): Promise<unknown>;
  leerCuerpo(id: string): Promise<string | null>;
  guardarCuerpo(id: string, texto: string): Promise<unknown>;
  leerMeta(clave: string): Promise<string | null>;
  guardarMeta(clave: string, valor: string): Promise<unknown>;
  encolar(op: OperacionPendiente): Promise<unknown>;
  leerCola(): Promise<OperacionPendiente[]>;
  vaciarCola(): Promise<unknown>;
}

export function crearCacheMemoria(): Cache {
  let indice: Entrada[] = [];
  let mapaFilas = new Map<string, number>();
  const cuerpos = new Map<string, string>();
  const meta = new Map<string, string>();
  let cola: OperacionPendiente[] = [];

  return {
    leerIndice: async () => structuredClone(indice),
    guardarIndice: async (entradas) => { indice = structuredClone(entradas); },
    leerMapaFilas: async () => structuredClone(mapaFilas),
    guardarMapaFilas: async (mapa) => { mapaFilas = structuredClone(mapa); },
    leerCuerpo: async (id) => cuerpos.get(id) ?? null,
    guardarCuerpo: async (id, texto) => { cuerpos.set(id, texto); },
    leerMeta: async (clave) => meta.get(clave) ?? null,
    guardarMeta: async (clave, valor) => { meta.set(clave, valor); },
    encolar: async (op) => { cola.push(structuredClone(op)); },
    leerCola: async () => structuredClone(cola),
    vaciarCola: async () => { cola = []; }
  };
}

const TIENDAS = ['indice', 'cuerpos', 'meta', 'cola'] as const;

export function abrirCache(): Promise<Cache> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('recetario', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const t of TIENDAS) if (!db.objectStoreNames.contains(t)) db.createObjectStore(t);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(envolver(req.result));
  });
}

function envolver(db: IDBDatabase): Cache {
  const tx = <T>(tienda: string, modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> =>
    new Promise((resolve, reject) => {
      const t = db.transaction(tienda, modo);
      const req = fn(t.objectStore(tienda));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });

  return {
    leerIndice: async () => (await tx<Entrada[] | undefined>('indice', 'readonly', s => s.get('todo'))) ?? [],
    guardarIndice: (entradas) => tx('indice', 'readwrite', s => s.put(entradas, 'todo')),
    // El Map no se guarda tal cual: viaja como pares y se rearma al leer.
    leerMapaFilas: async () =>
      new Map((await tx<[string, number][] | undefined>('indice', 'readonly', s => s.get('filas'))) ?? []),
    guardarMapaFilas: (mapa) => tx('indice', 'readwrite', s => s.put([...mapa], 'filas')),
    leerCuerpo: async (id) => (await tx<string | undefined>('cuerpos', 'readonly', s => s.get(id))) ?? null,
    guardarCuerpo: (id, texto) => tx('cuerpos', 'readwrite', s => s.put(texto, id)),
    leerMeta: async (clave) => (await tx<string | undefined>('meta', 'readonly', s => s.get(clave))) ?? null,
    guardarMeta: (clave, valor) => tx('meta', 'readwrite', s => s.put(valor, clave)),
    encolar: async (op) => {
      const cola = (await tx<OperacionPendiente[] | undefined>('cola', 'readonly', s => s.get('ops'))) ?? [];
      return tx('cola', 'readwrite', s => s.put([...cola, op], 'ops'));
    },
    leerCola: async () => (await tx<OperacionPendiente[] | undefined>('cola', 'readonly', s => s.get('ops'))) ?? [],
    vaciarCola: () => tx('cola', 'readwrite', s => s.put([], 'ops'))
  };
}
