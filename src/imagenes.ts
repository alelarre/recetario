/**
 * Mostrar imágenes de Drive: se piden con el token y quedan en Cache Storage
 * por id de archivo. Un id de Drive no cambia de contenido, así que lo
 * guardado no vence. Sirve para las fotos de las recetas y para las
 * imágenes propias de las categorías.
 *
 * También vive acá lo que el service worker deja del menú Compartir: las
 * fotos que llegaron, en su propio caché, hasta que la receta nueva las lee.
 *
 * Todo se inyecta: los tests corren en Node, donde no hay Cache Storage ni
 * object URLs.
 */

/** Lo que se usa de un `Cache`. */
export interface CacheMinimo {
  match(clave: string): Promise<Response | undefined>;
  put(clave: string, respuesta: Response): Promise<void>;
  delete(clave: string): Promise<boolean>;
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

/** La clave del caché para un id de Drive: la misma que guarda y que lee. */
const claveImagen = (id: string): string => `imagen/${id}`;

/**
 * Corre `tarea` sobre cada cosa con a lo sumo `tope` en vuelo. A diferencia de
 * la reconstrucción del índice, un error de una foto no corta a las demás:
 * nadie espera el resultado de una sola. Lo usa `main.ts` para completar las
 * imágenes que una pantalla dejó pedidas.
 */
export async function conTope<T>(cosas: readonly T[], tope: number, tarea: (cosa: T) => Promise<void>): Promise<void> {
  let siguiente = 0;
  const obrero = async (): Promise<void> => {
    while (siguiente < cosas.length) {
      const cosa = cosas[siguiente++] as T;  // El corte de arriba ya garantiza que está.
      try { await tarea(cosa); } catch { /* una foto que falla no frena a las demás */ }
    }
  };
  await Promise.all(Array.from({ length: Math.min(tope, cosas.length) }, obrero));
}

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

  /**
   * Los pedidos que están en vuelo, por id. La misma foto la piden a la vez la
   * cabecera, el carrusel y el visor: sin esto, cada uno la baja por su cuenta.
   */
  const enVuelo = new Map<string, Promise<Blob | null>>();

  /** El pedido en sí: del caché o de Drive, y de vuelta al caché; `null` si ya no está en Drive. */
  async function leerImagen(id: string): Promise<Blob | null> {
    const cache = await abrir(CACHE_IMAGENES);
    const clave = claveImagen(id);
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

  /**
   * El pedido de una foto, uno solo por id mientras dure: el que llega segundo
   * espera el mismo. Termine bien o mal, se olvida, así que un error no deja
   * la foto pegada.
   */
  function pedir(id: string): Promise<Blob | null> {
    const ya = enVuelo.get(id);
    if (ya) return ya;
    const pedido = leerImagen(id).finally(() => { enVuelo.delete(id); });
    enVuelo.set(id, pedido);
    return pedido;
  }

  /** La imagen, del caché o de Drive; `null` si ya no está en Drive. */
  const imagenDe = pedir;

  /**
   * Los object URL que se están creando, por id. Dos pasadas que completan
   * la misma foto a la vez reciben el mismo: si cada una creara el suyo, el
   * primero quedaría pisado en `urls` y no se soltaría nunca.
   */
  const urlsEnVuelo = new Map<string, Promise<string | null>>();

  /** Un object URL para dibujar la imagen, o `null` si ya no está en Drive. */
  function urlDeImagen(id: string): Promise<string | null> {
    const ya = urls.get(id);
    if (ya) return Promise.resolve(ya);
    const enCurso = urlsEnVuelo.get(id);
    if (enCurso) return enCurso;
    const pedido = imagenDe(id)
      .then(blob => {
        if (!blob) return null;
        const url = crearUrl(blob);
        urls.set(id, url);
        return url;
      })
      .finally(() => { urlsEnVuelo.delete(id); });
    urlsEnVuelo.set(id, pedido);
    return pedido;
  }

  /** Un object URL para una foto en memoria; se suelta con los demás. */
  function urlDeBlob(blob: Blob): string {
    const url = crearUrl(blob);
    sueltas.push(url);
    return url;
  }

  /** Revoca el object URL de una foto en memoria que dejó de estar: la que se sacó del editor. */
  function soltarUrl(url: string): void {
    const i = sueltas.indexOf(url);
    if (i >= 0) sueltas.splice(i, 1);
    revocarUrl(url);
  }

  /**
   * Aparta los object URL de la pantalla que se va y devuelve con qué
   * revocarlos. Se revocan recién con la pantalla nueva pintada: la vieja
   * sigue a la vista mientras se lee la nueva, y sin sus URL mostraría las
   * fotos rotas. Lo que se cree después de apartar ya es de la pantalla nueva.
   */
  function apartarImagenes(): () => void {
    const apartadas = [...urls.values(), ...sueltas];
    urls.clear();
    sueltas.length = 0;
    return () => { for (const url of apartadas) revocarUrl(url); };
  }

  const borrar = async (nombre: string): Promise<void> => {
    try { await caches()?.delete(nombre); } catch { /* sin caché no hay nada que borrar */ }
  };

  /** Guarda en el caché el blob de una foto recién subida, sin volver a pedirla a Drive. */
  async function guardarImagen(id: string, blob: Blob): Promise<void> {
    const cache = await abrir(CACHE_IMAGENES);
    await cache
      ?.put(claveImagen(id), new Response(blob, { headers: { 'Content-Type': blob.type } }))
      .catch(() => {});
  }

  /** Saca una foto del caché al mandarla a la papelera, y suelta su object URL si estaba en pantalla. */
  async function olvidarImagen(id: string): Promise<void> {
    const cache = await abrir(CACHE_IMAGENES);
    await cache?.delete(claveImagen(id)).catch(() => {});
    const url = urls.get(id);
    if (url) {
      revocarUrl(url);
      urls.delete(id);
    }
  }

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
    imagenDe, urlDeImagen, urlDeBlob, soltarUrl, apartarImagenes, fotosCompartidas,
    guardarImagen, olvidarImagen,
    borrarImagenes: () => borrar(CACHE_IMAGENES),
    descartarCompartidas: () => borrar(CACHE_COMPARTIDO)
  };
}

export type Imagenes = ReturnType<typeof crearImagenes>;
