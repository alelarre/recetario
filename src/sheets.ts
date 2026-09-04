import { COLUMNAS } from './catalogo.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const HOJA_RECETAS = 'recetas';
export const HOJA_META = 'meta';

const letra = (i: number): string => String.fromCharCode(65 + i);

/**
 * Genera un rango A1 para una fila entera (de A a la última columna).
 * Lanza si fila no es un entero >= 1: la fila 1 son los encabezados y no hay fallback seguro.
 * Un rango mal calculado es un error de programación, no un dato malo del usuario.
 */
export const rangoDeFila = (fila: unknown): string => {
  // El typeof es lo que estrecha el tipo; Number.isInteger solo devuelve boolean.
  if (typeof fila !== 'number' || !Number.isInteger(fila) || fila < 1) {
    throw new Error(`La fila tiene que ser un entero mayor o igual a 1; recibí ${JSON.stringify(fila)}`);
  }
  return `${HOJA_RECETAS}!A${fila}:${letra(COLUMNAS.length - 1)}${fila}`;
};

export function rangoDeCelda(columna: string, fila: number): string {
  const i = (COLUMNAS as readonly string[]).indexOf(columna);
  if (i < 0) throw new Error(`Columna desconocida: ${columna}`);
  return `${HOJA_RECETAS}!${letra(i)}${fila}`;
}

/** Una hoja de la planilla: su id numérico y su nombre. */
export interface PropiedadesHoja {
  sheetId: number;
  title: string;
}

/** Un error de la API de Sheets, con el status para distinguir el 429 (§4.3). */
export class ErrorDeSheets extends Error {
  readonly status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

export function crearSheets(obtenerToken: () => Promise<string>) {
  async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
    const token = await obtenerToken();
    const r = await fetch(API + ruta, {
      ...opciones,
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

    agregarHoja: (id: string, titulo: string) => pedir<unknown>(`/${id}:batchUpdate`,
      { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titulo } } }] }) }),

    /** Borra la fila de verdad: el corrimiento posterior es determinístico (§4.3). */
    borrarFila: (id: string, hojaId: number, fila: number) => pedir<unknown>(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }]
      })
    }),

    /**
     * Borra varias filas en una sola llamada, una escritura de cuota en vez
     * de una por fila. `filas` tiene que venir de mayor a menor: un
     * `deleteDimension` corre las filas de abajo hacia arriba, así que borrar
     * primero una fila de más arriba invalidaría el índice de las que
     * todavía faltan (§4.3, mismo corrimiento que `borrarFila`).
     */
    borrarFilas: (id: string, hojaId: number, filas: number[]) => pedir<unknown>(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: filas.map(fila => (
          { deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }
        ))
      })
    }),

    /**
     * `sheets` puede faltar entera: es justo lo que pasó con la planilla que
     * quedó a medio crear y dejó la app sin arrancar. Devolver [] hace que el
     * llamador vea "no está la hoja" en vez de un TypeError sin salida (§8).
     */
    hojas: async (id: string): Promise<PropiedadesHoja[]> => {
      const r = await pedir<{ sheets?: { properties?: PropiedadesHoja }[] }>(
        `/${id}?fields=sheets(properties(sheetId,title))`);
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
