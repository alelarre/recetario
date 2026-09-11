import { COLUMNAS } from '../src/catalogo.js';
import type { PropiedadesHoja } from '../src/sheets.js';
import type { Entrada, Receta } from '../src/tipos.js';
import { parse } from '../src/recipe.js';
import type { DriveDelStore, SheetsDelStore } from '../src/store.js';

/**
 * Los dobles se declaran contra el mismo tipo que el store consume, con
 * `satisfies`: una firma que se aparte de la API real deja de compilar en vez
 * de mentirle a los tests.
 */
type DriveUsado = DriveDelStore;

/** Un archivo del Drive falso: lo de Drive más el contenido que sirve. */
interface ArchivoFalso {
  id: string;
  name?: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
  trashed?: boolean;
  contenido?: string;
}

/**
 * Drive falso en memoria. `archivos` es un array de
 * {id, name, mimeType, parents, modifiedTime, contenido}.
 */
export function driveFalso(archivos: ArchivoFalso[] = []) {
  const store = new Map<string, ArchivoFalso>(archivos.map(a => [a.id, {
    mimeType: 'text/markdown', parents: [], modifiedTime: '2026-01-01T00:00:00.000Z', ...a
  }]));
  let siguiente = 1;
  const fallas = new Map<string, unknown>();  // ruta lógica → error a lanzar

  const vivos = (): ArchivoFalso[] => [...store.values()].filter(a => !a.trashed);

  const api = {
    llamadas: [] as unknown[][],
    fallar(operacion: string, error: unknown) { fallas.set(operacion, error); },
    _store: store,

    async buscarPorNombre(nombre: string, padre?: string) {
      api.llamadas.push(['buscarPorNombre', nombre, padre]);
      if (fallas.has('buscarPorNombre')) throw fallas.get('buscarPorNombre');
      return vivos().filter(a => a.name === nombre && (!padre || (a.parents ?? []).includes(padre)));
    },
    async listarCarpetas(id: string) {
      return vivos().filter(a => (a.parents ?? []).includes(id) && a.mimeType === 'application/vnd.google-apps.folder');
    },
    async listarHijos(id: string) {
      return vivos().filter(a => (a.parents ?? []).includes(id));
    },
    // El real siempre devuelve un archivo o tira; pedir metadatos de un id que
    // no existe es un error del test, no un caso a tolerar en silencio.
    async metadatos(id: string) {
      const a = store.get(id);
      if (!a) throw new Error(`El doble de Drive no tiene el archivo ${id}`);
      return a;
    },
    async leerTexto(id: string) {
      api.llamadas.push(['leerTexto', id]);
      return store.get(id)?.contenido ?? '';
    },
    async crear({ nombre, contenido = '', padre, mime = 'text/markdown' }: {
      nombre: string; contenido?: string; padre?: string; mime?: string;
    }) {
      const a: ArchivoFalso = {
        id: `nuevo${siguiente++}`, name: nombre, mimeType: mime,
        parents: padre ? [padre] : [], modifiedTime: new Date().toISOString(), contenido
      };
      store.set(a.id, a);
      return a as ArchivoFalso & { id: string };
    },
    async actualizar(id: string, contenido: string) {
      const a = exigir(id);
      a.contenido = contenido;
      a.modifiedTime = new Date().toISOString();
      return a as ArchivoFalso & { id: string };
    },
    async renombrar(id: string, nombre: string) {
      const a = exigir(id);
      a.name = nombre;
      return a;
    },
    async mover(id: string, { de, a: destino }: { de: string; a: string }) {
      const a = exigir(id);
      a.parents = [destino, ...(a.parents ?? []).filter(p => p !== de && p !== destino)].slice(0, 1);
      return a;
    },
    async borrar(id: string) { store.delete(id); return ''; }
  } satisfies DriveUsado & Record<string, unknown>;

  /** Los mutadores del doble asumen que el archivo existe: si no, es un test mal armado. */
  function exigir(id: string): ArchivoFalso {
    const a = store.get(id);
    if (!a) throw new Error(`El doble de Drive no tiene el archivo ${id}`);
    return a;
  }

  return api;
}

type SheetsUsado = SheetsDelStore;

/** Las hojas de una planilla falsa: nombre de hoja → filas. */
type PlanillaFalsa = Record<string, string[][]>;

/** Un envío a la planilla falsa: una llamada a `escribir` o a `append`. */
export interface EscrituraFalsa {
  id: string;
  hoja: string;
  valores: string[][];
}

/** Una fila que se sacó de la planilla falsa, con la hoja de la que salió. */
export interface FilaBorrada {
  id: string;
  hoja: string;
  fila: number;
}

/** Sheets falso: una planilla es un objeto {hojas: {nombre: filas[][]}}. */
export function sheetsFalso() {
  const planillas = new Map<string, PlanillaFalsa>();
  // Mapeo de id → lista de hojas con sus metadatos {sheetId, title}
  const hojasMetadatos = new Map<string, PropiedadesHoja[]>();
  const escrituras: EscrituraFalsa[] = [];
  const appends: EscrituraFalsa[] = [];
  const filasBorradas: FilaBorrada[] = [];

  // La app crea la planilla con drive.crear y después le escribe: el doble tiene
  // que aceptar una escritura sobre un id que todavía no vio. Cuando se crea una
  // planilla nueva, tiene una hoja por defecto llamada 'Sheet1', no 'recetas'.
  /**
   * La hoja que un `sheetId` nombra, igual que en la API real: borrar filas se
   * pide por id de hoja, no por nombre. Que la planilla o la hoja no existan es
   * un test mal armado, no un caso real.
   */
  const exigirHoja = (id: string, hojaId: number): { titulo: string; filas: string[][] } => {
    const titulo = (hojasMetadatos.get(id) ?? []).find(h => h.sheetId === hojaId)?.title;
    if (!titulo) throw new Error(`El doble de Sheets no tiene la hoja ${hojaId} en ${id}`);
    const filas = planillas.get(id)?.[titulo];
    if (!filas) throw new Error(`El doble de Sheets no tiene la hoja ${titulo} en ${id}`);
    return { titulo, filas };
  };

  const asegurar = (id: string): PlanillaFalsa => {
    let p = planillas.get(id);
    if (!p) {
      p = { 'Sheet1': [] };
      planillas.set(id, p);
      hojasMetadatos.set(id, [{ sheetId: 0, title: 'Sheet1' }]);
    }
    return p;
  };

  const api = {
    _planillas: planillas,
    _hojasMetadatos: hojasMetadatos,
    escrituras,
    appends,
    filasBorradas,
    /**
     * Gancho opcional para simular la confirmación de Sheets: si está,
     * `escribir` y `append` lo esperan antes de tocar la planilla. Sirve para
     * probar que `guardar()` no termina hasta que Sheets confirmó (Tarea 6:
     * la escritura de la fila es sincrónica, sin cola) y que un error acá se
     * propaga en vez de quedar encolado en algún lado.
     */
    alEscribir: undefined as (() => Promise<void>) | undefined,

    crearPlanilla(id: string, hojas: string[] = ['recetas', 'meta']) {
      planillas.set(id, Object.fromEntries(hojas.map(h => [h, [] as string[][]])));
      hojasMetadatos.set(id, hojas.map((title, sheetId) => ({ sheetId, title })));
    },

    /** Deja filas puestas sin pasar por `escribir`: es fixture, no escritura. */
    cargar(id: string, hoja: string, filas: string[][]) {
      const p = asegurar(id);
      p[hoja] = filas.map(f => [...f]);
    },

    async leer(id: string, rango: string) {
      const hoja = rango.split('!')[0] ?? '';
      return (planillas.get(id)?.[hoja] ?? []).map(f => [...f]);
    },

    async escribir(id: string, rango: string, valores: string[][]) {
      if (api.alEscribir) await api.alEscribir();
      const [hoja = '', celdas = ''] = rango.split('!');
      escrituras.push({ id, hoja, valores });
      const fila = Number(celdas.match(/\d+/)?.[0] ?? 0);
      const p = asegurar(id);
      const destino = p[hoja] ?? (p[hoja] = []);
      while (destino.length < fila) destino.push([]);
      destino[fila - 1] = valores[0] ?? [];
    },

    async append(id: string, hoja: string, filas: string[][]) {
      if (api.alEscribir) await api.alEscribir();
      escrituras.push({ id, hoja, valores: filas });
      appends.push({ id, hoja, valores: filas });
      const p = asegurar(id);
      (p[hoja] ?? (p[hoja] = [])).push(...filas);
    },

    async agregarHoja(id: string, titulo: string) {
      const p = asegurar(id);
      p[titulo] = [];
      const hojas = hojasMetadatos.get(id) ?? [];
      hojas.push({ sheetId: hojas.length, title: titulo });
      hojasMetadatos.set(id, hojas);
    },

    async borrarFila(id: string, hojaId: number, fila: number) {
      const hoja = exigirHoja(id, hojaId);
      hoja.filas.splice(fila - 1, 1);
      filasBorradas.push({ id, hoja: hoja.titulo, fila });
    },

    async borrarFilas(id: string, hojaId: number, filas: number[]) {
      const hoja = exigirHoja(id, hojaId);
      // Mismo contrato que la API real: de mayor a menor, para que cada
      // índice siga siendo válido según se van sacando filas.
      for (const fila of filas) {
        hoja.filas.splice(fila - 1, 1);
        filasBorradas.push({ id, hoja: hoja.titulo, fila });
      }
    },

    async hojas(id: string) {
      asegurar(id);  // Asegurar que la planilla existe en metadatos
      return hojasMetadatos.get(id) ?? [];
    },

    async renombrarHoja(id: string, sheetId: number, nuevoTitulo: string) {
      const p = asegurar(id);
      const hojas = hojasMetadatos.get(id) ?? [];
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
  } satisfies SheetsUsado & Record<string, unknown>;

  return api;
}

export const COLUMNAS_ESPERADAS = COLUMNAS;

/** Los tipos de los dobles, para anotar las variables de los tests. */
export type DriveFalso = ReturnType<typeof driveFalso>;
export type SheetsFalso = ReturnType<typeof sheetsFalso>;

/**
 * Una `Entrada` completa a partir de lo poco que le importa a cada test.
 *
 * Los tests venían armando literales con dos o tres campos y pasándolos donde
 * se espera una fila del índice entera. Funcionaba porque nadie miraba el
 * resto, pero dejaba fixtures que no se parecen a lo que el store maneja de
 * verdad. Completar desde acá cuesta lo mismo y mantiene el parecido.
 */
export function entradaFalsa(parcial: Partial<Entrada> = {}): Entrada {
  return {
    id_archivo: '', nombre_archivo: '', titulo: '', categoria: '', carpeta_id: '',
    rinde: '', tiempo: '', dificultad: '', fuente: '',
    tags: [], ingredientes: [], mtime: 0, foto: '', completa: false,
    ...parcial
  };
}

/**
 * Una `Receta` completa a partir de los campos que el test quiere fijar.
 *
 * La base sale de `parse('')` y no de un literal escrito acá: así el fixture
 * usa el mismo esquema que produce el parser de verdad, y si mañana la receta
 * gana un campo, este helper lo hereda sin que haya que acordarse.
 */
export function recetaFalsa(parcial: Partial<Receta> = {}): Receta {
  return { ...parse(''), ...parcial };
}
