import type { ArchivoDrive, CambioDrive } from './tipos.js';

const API = 'https://www.googleapis.com/drive/v3';
const SUBIDA = 'https://www.googleapis.com/upload/drive/v3';
const MIME_CARPETA = 'application/vnd.google-apps.folder';

const escapar = (s: unknown): string => String(s ?? '').replace(/'/g, "\\'");

export const q = {
  hijosDe: (id: string): string => `'${escapar(id)}' in parents and trashed=false`,
  carpetasDe: (id: string): string =>
    `'${escapar(id)}' in parents and mimeType='${MIME_CARPETA}' and trashed=false`,
  porNombre: (nombre: string, padre?: string): string => padre
    ? `name='${escapar(nombre)}' and '${escapar(padre)}' in parents and trashed=false`
    : `name='${escapar(nombre)}' and trashed=false`
};

export class ErrorDeDrive extends Error {
  readonly status: number;
  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

/** Lo que devuelve `files.list`. El token de página falta en la última. */
interface RespuestaListado {
  files?: ArchivoDrive[];
  nextPageToken?: string;
}

/** Lo que devuelve la Changes API (§4.2). */
export interface RespuestaCambios {
  changes?: CambioDrive[];
  newStartPageToken?: string;
  nextPageToken?: string;
}

/** Lo que vuelve al crear o actualizar un archivo. */
export interface ArchivoCreado {
  id: string;
  name?: string;
  modifiedTime?: string;
}

export interface OpcionesCrear {
  nombre: string;
  contenido?: string;
  padre?: string;
  mime?: string;
}

export function crearDrive(obtenerToken: () => Promise<string>) {
  /**
   * El tipo de retorno es genérico y sin verificar a propósito: nada de lo que
   * devuelve Drive se valida acá. Quien llama declara qué espera, y los que
   * consumen esos datos —`diffCambios`, `entradaDesdeFila`— tratan cada campo
   * como ausente hasta probar lo contrario.
   */
  async function pedir<T>(ruta: string, opciones: RequestInit = {}, base = API): Promise<T> {
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
    return (tipo.includes('json') ? r.json() : r.text()) as Promise<T>;
  }

  const listar = async (
    consulta: string,
    campos = 'files(id,name,mimeType,parents,modifiedTime)'
  ): Promise<ArchivoDrive[]> => {
    const archivos: ArchivoDrive[] = [];
    let pageToken = '';
    do {
      const url = `/files?q=${encodeURIComponent(consulta)}&fields=nextPageToken,${campos}&pageSize=1000` +
        (pageToken ? `&pageToken=${pageToken}` : '');
      const r = await pedir<RespuestaListado>(url);
      archivos.push(...(r.files ?? []));
      pageToken = r.nextPageToken ?? '';
    } while (pageToken);
    return archivos;
  };

  return {
    q,
    listar,
    buscarPorNombre: (nombre: string, padre?: string) => listar(q.porNombre(nombre, padre)),
    listarCarpetas: (id: string) => listar(q.carpetasDe(id), 'files(id,name)'),
    listarHijos: (id: string, campos?: string) => listar(q.hijosDe(id), campos),
    metadatos: (id: string, campos = 'id,name,parents,modifiedTime') =>
      pedir<ArchivoDrive>(`/files/${id}?fields=${campos}`),

    /** Devuelve el `.md` crudo: `alt=media` no responde JSON. */
    leerTexto: (id: string) => pedir<string>(`/files/${id}?alt=media`),

    crear: ({ nombre, contenido = '', padre, mime = 'text/markdown' }: OpcionesCrear): Promise<ArchivoCreado> => {
      const meta = { name: nombre, mimeType: mime, ...(padre ? { parents: [padre] } : {}) };

      // Tipos nativos de Google se crean con solo metadata (sin archivo)
      if (mime.startsWith('application/vnd.google-apps.')) {
        return pedir<ArchivoCreado>('/files?fields=id,name,modifiedTime', {
          method: 'POST', body: JSON.stringify(meta)
        });
      }

      // Otros archivos usan subida multipart
      const fd = new FormData();
      fd.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
      fd.append('file', new Blob([contenido], { type: mime }));
      return pedir<ArchivoCreado>('/files?uploadType=multipart&fields=id,name,modifiedTime', {
        method: 'POST', body: fd
      }, SUBIDA);
    },

    actualizar: (id: string, contenido: string) =>
      pedir<ArchivoCreado>(`/files/${id}?uploadType=media&fields=id,modifiedTime`,
        { method: 'PATCH', body: contenido, headers: { 'Content-Type': 'text/markdown' } }, SUBIDA),

    renombrar: (id: string, nombre: string) =>
      pedir<ArchivoDrive>(`/files/${id}?fields=id,name`, {
        method: 'PATCH', body: JSON.stringify({ name: nombre })
      }),

    mover: (id: string, { de, a }: { de: string; a: string }) =>
      pedir<ArchivoDrive>(`/files/${id}?addParents=${a}&removeParents=${de}&fields=id,parents`, { method: 'PATCH' }),

    borrar: (id: string) => pedir<string>(`/files/${id}`, { method: 'DELETE' }),

    tokenInicialDeCambios: async (): Promise<string | undefined> =>
      (await pedir<{ startPageToken?: string }>('/changes/startPageToken')).startPageToken,

    cambios: (pageToken: string) => pedir<RespuestaCambios>(`/changes?pageToken=${pageToken}&pageSize=200` +
      '&fields=newStartPageToken,nextPageToken,changes(fileId,removed,file(id,name,mimeType,parents,modifiedTime,trashed))')
  };
}

/** El objeto que devuelve `crearDrive`. Lo consumen `store` y los tests. */
export type Drive = ReturnType<typeof crearDrive>;
