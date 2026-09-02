export function crearCacheMemoria() {
  let indice = [];
  let mapaFilas = new Map();
  const cuerpos = new Map();
  const meta = new Map();
  let cola = [];

  return {
    leerIndice: async () => [...indice],
    guardarIndice: async (entradas) => { indice = [...entradas]; },
    leerMapaFilas: async () => new Map(mapaFilas),
    guardarMapaFilas: async (mapa) => { mapaFilas = new Map(mapa); },
    leerCuerpo: async (id) => cuerpos.get(id) ?? null,
    guardarCuerpo: async (id, texto) => { cuerpos.set(id, texto); },
    leerMeta: async (clave) => meta.get(clave) ?? null,
    guardarMeta: async (clave, valor) => { meta.set(clave, valor); },
    encolar: async (op) => { cola.push(op); },
    leerCola: async () => [...cola],
    vaciarCola: async () => { cola = []; }
  };
}

const TIENDAS = ['indice', 'cuerpos', 'meta', 'cola'];

export function abrirCache() {
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

function envolver(db) {
  const tx = (tienda, modo, fn) => new Promise((resolve, reject) => {
    const t = db.transaction(tienda, modo);
    const req = fn(t.objectStore(tienda));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return {
    leerIndice: async () => (await tx('indice', 'readonly', s => s.get('todo'))) ?? [],
    guardarIndice: (entradas) => tx('indice', 'readwrite', s => s.put(entradas, 'todo')),
    leerMapaFilas: async () => new Map((await tx('indice', 'readonly', s => s.get('filas'))) ?? []),
    guardarMapaFilas: (mapa) => tx('indice', 'readwrite', s => s.put([...mapa], 'filas')),
    leerCuerpo: async (id) => (await tx('cuerpos', 'readonly', s => s.get(id))) ?? null,
    guardarCuerpo: (id, texto) => tx('cuerpos', 'readwrite', s => s.put(texto, id)),
    leerMeta: async (clave) => (await tx('meta', 'readonly', s => s.get(clave))) ?? null,
    guardarMeta: (clave, valor) => tx('meta', 'readwrite', s => s.put(valor, clave)),
    encolar: async (op) => {
      const cola = (await tx('cola', 'readonly', s => s.get('ops'))) ?? [];
      return tx('cola', 'readwrite', s => s.put([...cola, op], 'ops'));
    },
    leerCola: async () => (await tx('cola', 'readonly', s => s.get('ops'))) ?? [],
    vaciarCola: () => tx('cola', 'readwrite', s => s.put([], 'ops'))
  };
}
