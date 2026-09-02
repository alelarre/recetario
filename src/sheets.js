import { COLUMNAS } from './catalogo.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const HOJA_RECETAS = 'recetas';
export const HOJA_META = 'meta';

const letra = (i) => String.fromCharCode(65 + i);

/**
 * Genera un rango A1 para una fila entera (de A a la última columna).
 * Lanza si fila no es un entero >= 1: la fila 1 son los encabezados y no hay fallback seguro.
 * Un rango mal calculado es un error de programación, no un dato malo del usuario.
 */
export const rangoDeFila = (fila) => {
  if (!Number.isInteger(fila) || fila < 1) {
    throw new Error(`La fila tiene que ser un entero mayor o igual a 1; recibí ${JSON.stringify(fila)}`);
  }
  return `${HOJA_RECETAS}!A${fila}:${letra(COLUMNAS.length - 1)}${fila}`;
};

export function rangoDeCelda(columna, fila) {
  const i = COLUMNAS.indexOf(columna);
  if (i < 0) throw new Error(`Columna desconocida: ${columna}`);
  return `${HOJA_RECETAS}!${letra(i)}${fila}`;
}

export function crearSheets(obtenerToken) {
  async function pedir(ruta, opciones = {}) {
    const token = await obtenerToken();
    const r = await fetch(API + ruta, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });
    if (!r.ok) { const e = new Error(await r.text()); e.status = r.status; throw e; }
    return r.json();
  }

  return {
    leer: async (id, rango) => (await pedir(`/${id}/values/${encodeURIComponent(rango)}`)).values ?? [],

    escribir: (id, rango, valores) => pedir(
      `/${id}/values/${encodeURIComponent(rango)}?valueInputOption=RAW`,
      { method: 'PUT', body: JSON.stringify({ values: valores }) }),

    append: (id, hoja, filas) => pedir(
      `/${id}/values/${encodeURIComponent(hoja + '!A1')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { method: 'POST', body: JSON.stringify({ values: filas }) }),

    agregarHoja: (id, titulo) => pedir(`/${id}:batchUpdate`,
      { method: 'POST', body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titulo } } }] }) }),

    /** Borra la fila de verdad: el corrimiento posterior es determinístico (§4.3). */
    borrarFila: (id, hojaId, fila) => pedir(`/${id}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ deleteDimension: { range: { sheetId: hojaId, dimension: 'ROWS', startIndex: fila - 1, endIndex: fila } } }]
      })
    }),

    hojas: async (id) => (await pedir(`/${id}?fields=sheets(properties(sheetId,title))`)).sheets
      .map(s => s.properties)
  };
}
