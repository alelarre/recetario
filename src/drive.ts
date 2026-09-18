import { MARCA_RAIZ } from './config.js';
import type { ArchivoDrive } from './tipos.js';

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
    : `name='${escapar(nombre)}' and trashed=false`,
  /** La carpeta base: la que lleva la marca de la app. Sólo propias. */
  marcadas: (): string =>
    `appProperties has { key='${MARCA_RAIZ.clave}' and value='${MARCA_RAIZ.valor}' } and ` +
    `'me' in owners and mimeType='${MIME_CARPETA}' and trashed=false`,
  carpetasPropiasPorNombre: (nombre: string): string =>
    `name='${escapar(nombre)}' and mimeType='${MIME_CARPETA}' and 'me' in owners and trashed=false`
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
   * consumen esos datos —`entradaDesdeFila`— tratan cada campo como ausente
   * hasta probar lo contrario.
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
    buscarPorNombre: (nombre: string, padre?: string) => listar(q.porNombre(nombre, padre)),
    listarCarpetas: (id: string) => listar(q.carpetasDe(id), 'files(id,name,appProperties)'),
    listarHijos: (id: string) => listar(q.hijosDe(id)),
    carpetasMarcadas: () => listar(q.marcadas(), 'files(id,name,modifiedTime)'),
    carpetasPropiasPorNombre: (nombre: string) => listar(q.carpetasPropiasPorNombre(nombre), 'files(id,name)'),
    metadatos: (id: string, campos = 'id,name,parents,modifiedTime') =>
      pedir<ArchivoDrive>(`/files/${id}?fields=${campos}`),

    /** El mail de la cuenta conectada, para Ajustes (C05.9b.1). */
    cuenta: async (): Promise<string> =>
      (await pedir<{ user?: { emailAddress?: string } }>('/about?fields=user(emailAddress)'))
        .user?.emailAddress ?? '',

    /** Devuelve el `.md` crudo: `alt=media` no responde JSON. */
    leerTexto: (id: string) => pedir<string>(`/files/${id}?alt=media`),

    crear: ({ nombre, contenido = '', padre, mime = 'text/markdown' }: OpcionesCrear): Promise<ArchivoCreado> => {
      const meta = { name: nombre, mimeType: mime, ...(padre ? { parents: [padre] } : {}) };

      // Los tipos nativos de Google —una planilla, una carpeta— se crean con
      // solo metadata: no hay archivo que subir.
      if (mime.startsWith('application/vnd.google-apps.')) {
        return pedir<ArchivoCreado>('/files?fields=id,name,modifiedTime', {
          method: 'POST', body: JSON.stringify(meta)
        });
      }

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

    /** Las propiedades privadas de la app: color, foto, la marca. Una clave en `null` se borra. */
    propiedades: (id: string, props: Record<string, string | null>) =>
      pedir<ArchivoDrive>(`/files/${id}?fields=id,appProperties`, {
        method: 'PATCH', body: JSON.stringify({ appProperties: props })
      }),

    mover: (id: string, { de, a }: { de: string; a: string }) =>
      pedir<ArchivoDrive>(`/files/${id}?addParents=${a}&removeParents=${de}&fields=id,parents`, { method: 'PATCH' }),

    /**
     * Manda el archivo a la papelera de Drive. `DELETE` lo borraría para
     * siempre, y la papelera es la red de seguridad, que es del usuario (E04).
     */
    borrar: (id: string) => pedir<ArchivoDrive>(`/files/${id}?fields=id,trashed`, {
      method: 'PATCH', body: JSON.stringify({ trashed: true })
    })
  };
}

/** El objeto que devuelve `crearDrive`. Lo consumen `store` y los tests. */
export type Drive = ReturnType<typeof crearDrive>;
