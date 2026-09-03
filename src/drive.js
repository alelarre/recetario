const API = 'https://www.googleapis.com/drive/v3';
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
const MIME_CARPETA = 'application/vnd.google-apps.folder';

const escapar = (s) => String(s ?? '').replace(/'/g, "\\'");

export const q = {
  hijosDe: (id) => `'${escapar(id)}' in parents and trashed=false`,
  carpetasDe: (id) => `'${escapar(id)}' in parents and mimeType='${MIME_CARPETA}' and trashed=false`,
  porNombre: (nombre, padre) => padre
    ? `name='${escapar(nombre)}' and '${escapar(padre)}' in parents and trashed=false`
    : `name='${escapar(nombre)}' and trashed=false`
};

export class ErrorDeDrive extends Error {
  constructor(mensaje, status) { super(mensaje); this.status = status; }
}

export function crearDrive(obtenerToken) {
  async function pedir(ruta, opciones = {}, base = API) {
    const token = await obtenerToken();
    const esJson = typeof opciones.body === 'string';
    const r = await fetch(base + ruta, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(esJson ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
      }
    });
    if (!r.ok) throw new ErrorDeDrive(await r.text(), r.status);
    const tipo = r.headers.get('content-type') ?? '';
    return tipo.includes('json') ? r.json() : r.text();
  }

  const listar = async (consulta, campos = 'files(id,name,mimeType,parents,modifiedTime)') => {
    const archivos = [];
    let pageToken = '';
    do {
      const url = `/files?q=${encodeURIComponent(consulta)}&fields=nextPageToken,${campos}&pageSize=1000` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const r = await pedir(url);
      archivos.push(...(r.files ?? []));
      pageToken = r.nextPageToken ?? '';
    } while (pageToken);
    return archivos;
  };

  return {
    q,
    listar,
    buscarPorNombre: (nombre, padre) => listar(q.porNombre(nombre, padre)),
    listarCarpetas: (id) => listar(q.carpetasDe(id), 'files(id,name)'),
    listarHijos: (id, campos) => listar(q.hijosDe(id), campos),
    metadatos: (id, campos = 'id,name,parents,modifiedTime') => pedir(`/files/${id}?fields=${campos}`),
    leerTexto: (id) => pedir(`/files/${id}?alt=media`),

    crear: ({ nombre, contenido = '', padre, mime = 'text/markdown' }) => {
      const meta = { name: nombre, mimeType: mime, ...(padre ? { parents: [padre] } : {}) };

      // Tipos nativos de Google se crean con solo metadata (sin archivo)
      if (mime.startsWith('application/vnd.google-apps.')) {
        return pedir('/files?fields=id,name,modifiedTime', { method: 'POST', body: JSON.stringify(meta) });
      }

      // Otros archivos usan subida multipart
      const fd = new FormData();
      fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      fd.append('file', new Blob([contenido], { type: mime }));
      return pedir('/files?uploadType=multipart&fields=id,name,modifiedTime', { method: 'POST', body: fd }, SUBIDA);
    },

    actualizar: (id, contenido) => pedir(`/files/${id}?uploadType=media&fields=id,modifiedTime`,
      { method: 'PATCH', body: contenido, headers: { 'Content-Type': 'text/markdown' } }, SUBIDA),

    renombrar: (id, nombre) => pedir(`/files/${id}?fields=id,name`, { method: 'PATCH', body: JSON.stringify({ name: nombre }) }),
    mover: (id, { de, a }) => pedir(`/files/${id}?addParents=${a}&removeParents=${de}&fields=id,parents`, { method: 'PATCH' }),
    borrar: (id) => pedir(`/files/${id}`, { method: 'DELETE' }),

    tokenInicialDeCambios: async () => (await pedir('/changes/startPageToken')).startPageToken,
    cambios: (pageToken) => pedir(`/changes?pageToken=${pageToken}&pageSize=200` +
      '&fields=newStartPageToken,nextPageToken,changes(fileId,removed,file(id,name,mimeType,parents,modifiedTime,trashed))')
  };
}
