import { COLUMNAS } from '../src/catalogo.js';

/**
 * Drive falso en memoria. `archivos` es un array de
 * {id, name, mimeType, parents, modifiedTime, contenido}.
 */
export function driveFalso(archivos = []) {
  const store = new Map(archivos.map(a => [a.id, { mimeType: 'text/markdown', parents: [], modifiedTime: '2026-01-01T00:00:00.000Z', ...a }]));
  let siguiente = 1;
  const fallas = new Map();  // ruta lógica → error a lanzar

  const vivos = () => [...store.values()].filter(a => !a.trashed);

  const api = {
    llamadas: [],
    fallar(operacion, error) { fallas.set(operacion, error); },
    _store: store,

    async buscarPorNombre(nombre, padre) {
      api.llamadas.push(['buscarPorNombre', nombre, padre]);
      if (fallas.has('buscarPorNombre')) throw fallas.get('buscarPorNombre');
      return vivos().filter(a => a.name === nombre && (!padre || a.parents.includes(padre)));
    },
    async listarCarpetas(id) {
      return vivos().filter(a => a.parents.includes(id) && a.mimeType === 'application/vnd.google-apps.folder');
    },
    async listarHijos(id) {
      return vivos().filter(a => a.parents.includes(id));
    },
    async metadatos(id) { return store.get(id); },
    async leerTexto(id) {
      api.llamadas.push(['leerTexto', id]);
      return store.get(id)?.contenido ?? '';
    },
    async crear({ nombre, contenido = '', padre, mime = 'text/markdown' }) {
      const a = { id: `nuevo${siguiente++}`, name: nombre, mimeType: mime, parents: padre ? [padre] : [], modifiedTime: new Date().toISOString(), contenido };
      store.set(a.id, a);
      return a;
    },
    async actualizar(id, contenido) {
      const a = store.get(id);
      a.contenido = contenido;
      a.modifiedTime = new Date().toISOString();
      return a;
    },
    async renombrar(id, nombre) { store.get(id).name = nombre; return store.get(id); },
    async mover(id, { de, a: destino }) {
      const a = store.get(id);
      a.parents = [destino, ...a.parents.filter(p => p !== de && p !== destino)].slice(0, 1);
      return a;
    },
    async borrar(id) { store.delete(id); },
    async tokenInicialDeCambios() { return '100'; },
    async cambios(token) { return { changes: [], newStartPageToken: String(Number(token) + 1) }; }
  };
  return api;
}

/** Sheets falso: una planilla es un objeto {hojas: {nombre: filas[][]}}. */
export function sheetsFalso() {
  const planillas = new Map();
  // Mapeo de id → lista de hojas con sus metadatos {sheetId, title}
  const hojasMetadatos = new Map();

  // La app crea la planilla con drive.crear y después le escribe: el doble tiene
  // que aceptar una escritura sobre un id que todavía no vio. Cuando se crea una
  // planilla nueva, tiene una hoja por defecto llamada 'Sheet1', no 'recetas'.
  const asegurar = (id) => {
    if (!planillas.has(id)) {
      planillas.set(id, { 'Sheet1': [] });
      hojasMetadatos.set(id, [{ sheetId: 0, title: 'Sheet1' }]);
    }
    return planillas.get(id);
  };

  return {
    _planillas: planillas,
    _hojasMetadatos: hojasMetadatos,

    crearPlanilla(id) {
      planillas.set(id, { recetas: [], meta: [] });
      hojasMetadatos.set(id, [
        { sheetId: 0, title: 'recetas' },
        { sheetId: 1, title: 'meta' }
      ]);
    },

    async leer(id, rango) {
      const hoja = rango.split('!')[0];
      return (planillas.get(id)?.[hoja] ?? []).map(f => [...f]);
    },

    async escribir(id, rango, valores) {
      const [hoja, celdas] = rango.split('!');
      const fila = Number(celdas.match(/\d+/)[0]);
      const p = asegurar(id);
      p[hoja] = p[hoja] ?? [];
      while (p[hoja].length < fila) p[hoja].push([]);
      p[hoja][fila - 1] = valores[0];
    },

    async append(id, hoja, filas) {
      const p = asegurar(id);
      p[hoja] = p[hoja] ?? [];
      p[hoja].push(...filas);
    },

    async agregarHoja(id, titulo) {
      const p = asegurar(id);
      p[titulo] = [];
      const hojas = hojasMetadatos.get(id);
      hojas.push({ sheetId: hojas.length, title: titulo });
    },

    async borrarFila(id, _hojaId, fila) {
      planillas.get(id).recetas.splice(fila - 1, 1);
    },

    async borrarFilas(id, _hojaId, filas) {
      const recetas = planillas.get(id).recetas;
      // Mismo contrato que la API real: de mayor a menor, para que cada
      // índice siga siendo válido según se van sacando filas.
      for (const fila of filas) recetas.splice(fila - 1, 1);
    },

    async hojas(id) {
      asegurar(id);  // Asegurar que la planilla existe en metadatos
      return hojasMetadatos.get(id) ?? [];
    },

    async renombrarHoja(id, sheetId, nuevoTitulo) {
      const p = asegurar(id);
      const hojas = hojasMetadatos.get(id);
      const hoja = hojas.find(h => h.sheetId === sheetId);
      if (hoja) {
        const nombreAnterior = hoja.title;
        hoja.title = nuevoTitulo;
        // Renombrar también en el objeto de datos
        if (p[nombreAnterior]) {
          p[nuevoTitulo] = p[nombreAnterior];
          delete p[nombreAnterior];
        }
      }
    }
  };
}

export const COLUMNAS_ESPERADAS = COLUMNAS;
