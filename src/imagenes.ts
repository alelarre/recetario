/**
 * Mostrar imágenes de Drive: se piden con el token y quedan en Cache Storage
 * por id de archivo. Un id de Drive no cambia de contenido, así que lo
 * guardado no vence. Sirve para las fotos de los borradores y para las
 * imágenes propias de las categorías.
 *
 * También vive acá lo que el service worker deja del menú Compartir: las
 * fotos que llegaron, en su propio caché, hasta que la captura las lee.
 *
 * Todo se inyecta: los tests corren en Node, donde no hay Cache Storage ni
 * object URLs.
 */

/** Lo que se usa de un `Cache`. */
export interface CacheMinimo {
  match(clave: string): Promise<Response | undefined>;
  put(clave: string, respuesta: Response): Promise<void>;
}

/** Lo que se usa de `caches`. */
export interface AlmacenDeCaches {
  open(nombre: string): Promise<CacheMinimo>;
  delete(nombre: string): Promise<boolean>;
}

export const CACHE_IMAGENES = 'recetario-imagenes';
/** El mismo nombre que usa `public/sw.js`. */
export const CACHE_COMPARTIDO = 'recetario-compartido';

export interface DependenciasImagenes {
  leerBlob: (id: string) => Promise<Blob>;
  /** Sin Cache Storage —un contexto inseguro, Node— se pide a Drive cada vez. */
  caches?: () => AlmacenDeCaches | undefined;
  crearUrl?: (blob: Blob) => string;
  revocarUrl?: (url: string) => void;
}

const noEsta = (e: unknown): boolean =>
  !!e && typeof e === 'object' && (e as { status?: unknown }).status === 404;

export function crearImagenes({
  leerBlob,
  caches = () => (typeof globalThis.caches === 'undefined' ? undefined : globalThis.caches),
  crearUrl = b => URL.createObjectURL(b),
  revocarUrl = u => URL.revokeObjectURL(u)
}: DependenciasImagenes) {
  /** Los object URL de la pantalla, por id: la misma foto no se vuelve a leer al redibujar. */
  const urls = new Map<string, string>();
  /** Los object URL de fotos en memoria, que todavía no están en Drive. */
  const sueltas: string[] = [];

  /** El caché con ese nombre, o nada: sin él, todo sigue andando. */
  const abrir = async (nombre: string): Promise<CacheMinimo | undefined> => {
    try { return await caches()?.open(nombre); } catch { return undefined; }
  };

  /** La imagen, del caché o de Drive; `null` si ya no está en Drive. */
  async function imagenDe(id: string): Promise<Blob | null> {
    const cache = await abrir(CACHE_IMAGENES);
    const clave = `imagen/${id}`;
    const guardada = await cache?.match(clave);
    if (guardada) return guardada.blob();
    let blob: Blob;
    try {
      blob = await leerBlob(id);
    } catch (e) {
      if (noEsta(e)) return null;
      throw e;
    }
    // Si no se pudo guardar, se muestra igual: la próxima vez se pide de nuevo.
    await cache?.put(clave, new Response(blob, { headers: { 'Content-Type': blob.type } })).catch(() => {});
    return blob;
  }

  /** Un object URL para dibujar la imagen, o `null` si ya no está en Drive. */
  async function urlDeImagen(id: string): Promise<string | null> {
    const ya = urls.get(id);
    if (ya) return ya;
    const blob = await imagenDe(id);
    if (!blob) return null;
    const url = crearUrl(blob);
    urls.set(id, url);
    return url;
  }

  /** Un object URL para una foto en memoria; se suelta con los demás. */
  function urlDeBlob(blob: Blob): string {
    const url = crearUrl(blob);
    sueltas.push(url);
    return url;
  }

  /** Revoca los object URL de la pantalla anterior. */
  function soltarImagenes(): void {
    for (const url of [...urls.values(), ...sueltas]) revocarUrl(url);
    urls.clear();
    sueltas.length = 0;
  }

  const borrar = async (nombre: string): Promise<void> => {
    try { await caches()?.delete(nombre); } catch { /* sin caché no hay nada que borrar */ }
  };

  /** Las fotos que dejó el service worker, en orden. Las que falten no están. */
  async function fotosCompartidas(cantidad: number): Promise<Blob[]> {
    const cache = await abrir(CACHE_COMPARTIDO);
    if (!cache) return [];
    const fotos: Blob[] = [];
    for (let i = 0; i < cantidad; i++) {
      const r = await cache.match(`compartido/${i}`);
      if (r) fotos.push(await r.blob());
    }
    return fotos;
  }

  return {
    imagenDe, urlDeImagen, urlDeBlob, soltarImagenes, fotosCompartidas,
    borrarImagenes: () => borrar(CACHE_IMAGENES),
    descartarCompartidas: () => borrar(CACHE_COMPARTIDO)
  };
}

export type Imagenes = ReturnType<typeof crearImagenes>;
