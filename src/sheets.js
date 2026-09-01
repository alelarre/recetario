import { COLUMNAS } from './catalogo.js';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';
export const HOJA_RECETAS = 'recetas';
export const HOJA_META = 'meta';

const letra = (i) => String.fromCharCode(65 + i);

/**
 * Genera un rango A1 para una fila entera (de A a la última columna).
 * Defiende los parámetros: null, undefined, string o número negativo retorna fila 1 (encabezados).
 * Esto previene errores silenciosos de índice cuando la capa superior pasa datos inválidos.
 */
export const rangoDeFila = (fila) => {
  // Defenderse: solo aceptar números positivos (>= 1)
  // null, undefined, string, o negativo cae a fila 1 (encabezados)
  const f = typeof fila === 'number' && fila > 0 ? fila : 1;
  return `${HOJA_RECETAS}!A${f}:${letra(COLUMNAS.length - 1)}${f}`;
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
