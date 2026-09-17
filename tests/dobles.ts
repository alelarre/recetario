/**
 * Los dobles se declaran contra el mismo tipo que el store consume, con
 * `satisfies`: una firma que se aparte de la API real deja de compilar en vez
 * de mentirle a los tests.
 */
import type { PropiedadesHoja } from '../src/sheets.js';
import type { Entrada, Receta } from '../src/tipos.js';
import { parse } from '../src/recipe.js';
import type { DriveDelStore, SheetsDelStore } from '../src/store.js';
import type { CopiaIndice, IndiceLocal } from '../src/indice-local.js';

const MIME_CARPETA = 'application/vnd.google-apps.folder';

/** Un archivo del Drive falso: lo de Drive más el contenido que sirve. */
interface ArchivoFalso {
  id: string;
  name?: string;
  mimeType?: string;
  parents?: string[];
  modifiedTime?: string;
  trashed?: boolean;
  contenido?: string;
  appProperties?: Record<string, string>;
  /** De otra persona, compartida con el usuario: `'me' in owners` la deja afuera. */
  ajena?: boolean;
}

/** Drive falso en memoria, sembrado con los archivos que el test necesita. */
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
      return vivos().filter(a => (a.parents ?? []).includes(id) && a.mimeType === MIME_CARPETA);
    },
    async listarHijos(id: string) {
      return vivos().filter(a => (a.parents ?? []).includes(id));
    },
    async carpetasMarcadas() {
      api.llamadas.push(['carpetasMarcadas']);
      if (fallas.has('carpetasMarcadas')) throw fallas.get('carpetasMarcadas');
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && a.appProperties?.['recetario'] === 'raiz');
    },
    async carpetasPropias(padre: string) {
      api.llamadas.push(['carpetasPropias', padre]);
      if (fallas.has('carpetasPropias')) throw fallas.get('carpetasPropias');
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && (a.parents ?? []).includes(padre));
    },
    async carpetasPropiasPorNombre(nombre: string) {
      return vivos().filter(a => a.mimeType === MIME_CARPETA && !a.ajena && a.name === nombre);
    },
    // Como el real: un id que no está es un 404, que el arranque distingue de
    // no poder preguntar.
    async metadatos(id: string) {
      api.llamadas.push(['metadatos', id]);
      if (fallas.has('metadatos')) throw fallas.get('metadatos');
      const a = store.get(id);
      if (!a) throw Object.assign(new Error(`El doble de Drive no tiene el archivo ${id}`), { status: 404 });
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
    async propiedades(id: string, props: Record<string, string | null>) {
      api.llamadas.push(['propiedades', id, props]);
      const a = exigir(id);
      const nuevas: Record<string, string> = { ...a.appProperties };
      for (const [clave, valor] of Object.entries(props)) {
        if (valor === null) delete nuevas[clave]; else nuevas[clave] = valor;
      }
      a.appProperties = nuevas;
      return a;
    },
    async mover(id: string, { de, a: destino }: { de: string; a: string }) {
      const a = exigir(id);
      a.parents = [destino, ...(a.parents ?? []).filter(p => p !== de && p !== destino)].slice(0, 1);
      return a;
    },
    // Como el real: a la papelera, no fuera de `_store`. `vivos()` ya lo
    // saca de búsquedas y listados.
    async borrar(id: string) { const a = exigir(id); a.trashed = true; return a; }
  } satisfies DriveDelStore & Record<string, unknown>;

  /** Los mutadores del doble asumen que el archivo existe: si no, es un test mal armado. */
  function exigir(id: string): ArchivoFalso {
    const a = store.get(id);
    if (!a) throw new Error(`El doble de Drive no tiene el archivo ${id}`);
    return a;
  }

  return api;
}

/** Las hojas de una planilla falsa: nombre de hoja → filas. */
type PlanillaFalsa = Record<string, string[][]>;

/** Un envío a la planilla falsa: una llamada a `escribir` o a `append`. */
interface EscrituraFalsa {
  id: string;
  hoja: string;
  valores: string[][];
}

/** Sheets falso: una planilla es un objeto {hojas: {nombre: filas[][]}}. */
export function sheetsFalso() {
  const planillas = new Map<string, PlanillaFalsa>();
  const hojasMetadatos = new Map<string, PropiedadesHoja[]>();
  const escrituras: EscrituraFalsa[] = [];
  const appends: EscrituraFalsa[] = [];

  /**
   * La hoja que un `sheetId` nombra, igual que en la API real: borrar filas se
   * pide por id de hoja, no por nombre. Que la planilla o la hoja no existan es
   * un test mal armado, no un caso real.
   */
  const exigirHoja = (id: string, hojaId: number): string[][] => {
    const titulo = (hojasMetadatos.get(id) ?? []).find(h => h.sheetId === hojaId)?.title;
    if (!titulo) throw new Error(`El doble de Sheets no tiene la hoja ${hojaId} en ${id}`);
    const filas = planillas.get(id)?.[titulo];
    if (!filas) throw new Error(`El doble de Sheets no tiene la hoja ${titulo} en ${id}`);
    return filas;
  };

  /**
   * La app crea la planilla con `drive.crear` y después le escribe: el doble
   * tiene que aceptar una escritura sobre un id que todavía no vio, y una
   * planilla recién creada trae una sola hoja llamada 'Sheet1'.
   */
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
    escrituras,
    appends,
    /**
     * Gancho opcional para simular la confirmación de Sheets: si está,
     * `escribir` y `append` lo esperan antes de tocar la planilla. Sirve para
     * probar que `guardar()` no termina hasta que Sheets confirmó y que un
     * error acá se propaga en vez de quedar encolado en algún lado.
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
      exigirHoja(id, hojaId).splice(fila - 1, 1);
    },

    async borrarFilas(id: string, hojaId: number, filas: number[]) {
      const hoja = exigirHoja(id, hojaId);
      // Mismo contrato que la API real: de mayor a menor, para que cada
      // índice siga siendo válido según se van sacando filas.
      for (const fila of filas) hoja.splice(fila - 1, 1);
    },

    async hojas(id: string) {
      asegurar(id);  // Una planilla que nadie creó todavía igual tiene su hoja por defecto.
      return hojasMetadatos.get(id) ?? [];
    },

    async renombrarHoja(id: string, sheetId: number, nuevoTitulo: string) {
      const p = asegurar(id);
      const hojas = hojasMetadatos.get(id) ?? [];
      const hoja = hojas.find(h => h.sheetId === sheetId);
      if (hoja) {
        const nombreAnterior = hoja.title;
        hoja.title = nuevoTitulo;
        if (p[nombreAnterior]) {
          p[nuevoTitulo] = p[nombreAnterior];
          delete p[nombreAnterior];
        }
      }
    }
  } satisfies SheetsDelStore & Record<string, unknown>;

  return api;
}

/**
 * La copia local del índice, en memoria. Clona al guardar y al leer, como el
 * JSON de `localStorage`: sin eso el store y la copia compartirían objetos, y
 * un test podría pasar gracias a un alias que en el navegador no existe.
 */
export function indiceLocalFalso(inicial: CopiaIndice | null = null) {
  let copia: CopiaIndice | null = inicial ? structuredClone(inicial) : null;
  const api = {
    /** Cada copia que el store guardó, en orden. */
    guardadas: [] as CopiaIndice[],
    /** Cuántas veces se pidió borrarla. */
    borradas: 0,
    /** Lo que hay guardado ahora, para las aserciones. */
    actual: (): CopiaIndice | null => copia,
    leer: (): CopiaIndice | null => (copia ? structuredClone(copia) : null),
    guardar: (c: CopiaIndice): void => {
      copia = structuredClone(c);
      api.guardadas.push(structuredClone(c));
    },
    borrar: (): void => { copia = null; api.borradas++; }
  } satisfies IndiceLocal & Record<string, unknown>;
  return api;
}

/** Los tipos de los dobles, para anotar las variables de los tests. */
export type DriveFalso = ReturnType<typeof driveFalso>;
export type SheetsFalso = ReturnType<typeof sheetsFalso>;

/**
 * Una `Entrada` completa a partir de lo poco que le importa a cada test.
 *
 * Un literal con dos o tres campos pasado donde se espera una fila entera del
 * índice funciona mientras nadie mire el resto, pero deja fixtures que no se
 * parecen a lo que el store maneja de verdad.
 */
export function entradaFalsa(parcial: Partial<Entrada> = {}): Entrada {
  return {
    id_archivo: '', nombre_archivo: '', titulo: '', categoria: '', carpeta_id: '',
    rinde: '', tiempo: '', dificultad: '', fuente: '',
    tags: [], ingredientes: [], mtime: 0, foto: '',
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
