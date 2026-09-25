import { COLUMNAS } from './catalogo.js';
import { CORTE_DE_LECTURA } from './config.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const HOJA_RECETAS = 'recetas';
export const HOJA_META = 'meta';
export const HOJA_CATEGORIAS = 'categorias';

const letra = (i: number): string => String.fromCharCode(65 + i);

/**
 * Genera un rango A1 para una fila entera (de A a la última columna), de la
 * hoja de recetas salvo que se diga otra.
 * Lanza si fila no es un entero >= 1: la fila 1 son los encabezados y no hay fallback seguro.
 * Un rango mal calculado es un error de programación, no un dato malo del usuario.
 */
export const rangoDeFila = (fila: unknown, hoja = HOJA_RECETAS, columnas: number = COLUMNAS.length): string => {
  // El typeof es lo que estrecha el tipo; Number.isInteger solo devuelve boolean.
  if (typeof fila !== 'number' || !Number.isInteger(fila) || fila < 1) {
    throw new Error(`La fila tiene que ser un entero mayor o igual a 1; recibí ${JSON.stringify(fila)}`);
  }
  return `${hoja}!A${fila}:${letra(columnas - 1)}${fila}`;
};

/**
 * Una hoja de la planilla: su id numérico, su nombre y, cuando se pidió, el
 * tamaño de la grilla —filas vacías incluidas—.
 */
export interface PropiedadesHoja {
  sheetId: number;
  title: string;
  gridProperties?: { rowCount?: number };
}

/** Un error de la API de Sheets, con el status para distinguir el 429 de cuota. */
export class ErrorDeSheets extends Error {
  readonly status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

export function crearSheets(obtenerToken: () => Promise<string>) {
  /** Como en `drive.ts`: una lectura se corta a los `CORTE_DE_LECTURA`, una escritura no. */
  async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
    const token = await obtenerToken();
    const esLectura = (opciones.method ?? 'GET') === 'GET';
    const r = await fetch(API + ruta, {
      ...opciones,
      ...(esLectura ? { signal: AbortSignal.timeout(CORTE_DE_LECTURA) } : {}),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });
    if (!r.ok) throw new ErrorDeSheets(await r.text(), r.status);
    return r.json() as Promise<T>;
  }

  return {
    /**
     * `values` falta cuando el rango existe pero está vacío, así que el `?? []`
     * no es defensa de más: es el caso normal de una planilla recién creada.
     */
    leer: async (id: string, rango: string): Promise<string[][]> =>
      (await pedir<{ values?: string[][] }>(`/${id}/values/${encodeURIComponent(rango)}`)).values ?? [],

    escribir: (id: string, rango: string, valores: string[][]) => pedir<unknown>(
      `/${id}/values/${encodeURIComponent(rango)}?valueInputOption=RAW`,
      { method: 'PUT', body: JSON.stringify({ values: valores }) }),

    append: (id: string, hoja: string, filas: string[][]) => pedir<unknown>(
      `/${id}/values/${encodeURIComponent(hoja + '!A1')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: 'POST', body: JSON.stringify({ values: filas }) }),

    /** La respuesta trae las propiedades de la hoja nueva: con eso no hace falta pedir `hojas` para saber su id. */
    agregarHoja: async (id: string, titulo: string): Promise<PropiedadesHoja> => {
      const r = await pedir<{ replies?: { addSheet?: { properties?: PropiedadesHoja } }[] }>(`/${id}:batchUpdate`,
        { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titulo } } }] }) });
      const hoja = r.replies?.[0]?.addSheet?.properties;
      if (!hoja) throw new ErrorDeSheets(`Sheets no devolvió la hoja ${titulo}`, 0);
      return hoja;
    },

    /** Borra la fila de verdad: el corrimiento posterior es determinístico. */
    borrarFila: (id: string, hojaId: number, fila: number) => pedir<unknown>(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }]
      })
    }),

    /**
     * Deja la hoja con el encabezado solo: borra de la fila 2 a la `filas`, en
     * un único `deleteDimension`. `filas` es el tamaño de la grilla, así que
     * se van también las filas vacías y las que se agregaron a mano.
     */
    vaciarHoja: (id: string, hojaId: number, filas: number) => pedir<unknown>(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: 1, endIndex: filas } } }]
      })
    }),

    /**
     * `sheets` puede faltar entera —una planilla que quedó a medio crear—.
     * Devolver [] hace que el llamador vea "no está la hoja" en vez de un
     * TypeError sin salida.
     */
    hojas: async (id: string): Promise<PropiedadesHoja[]> => {
      const r = await pedir<{ sheets?: { properties?: PropiedadesHoja }[] }>(
        `/${id}?fields=sheets(properties(sheetId,title,gridProperties(rowCount)))`);
      return (r.sheets ?? [])
        .map(s => s.properties)
        .filter((p): p is PropiedadesHoja => p !== undefined);
    },

    renombrarHoja: (id: string, sheetId: number, nuevoTitulo: string) => pedir<unknown>(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          updateSheetProperties: {
            properties: { sheetId, title: nuevoTitulo },
            fields: 'title'
          }
        }]
      })
    })
  };
}

/** El objeto que devuelve `crearSheets`. Lo consumen `store` y los tests. */
export type Sheets = ReturnType<typeof crearSheets>;
