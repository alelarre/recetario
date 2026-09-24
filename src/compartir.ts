/**
 * El menú Compartir del sistema, con sus respaldos. La plataforma se
 * inyecta: los tests corren en Node, donde `navigator.share` no existe.
 */
export interface Plataforma {
  share?: (datos: ShareData) => Promise<void>;
  canShare?: (datos: ShareData) => boolean;
  copiar?: (texto: string) => Promise<void>;
  descargar: (archivo: File) => void;
  /** Abre la dirección en otra ventana; `false` si el navegador no la abrió. */
  abrir?: (url: string) => boolean;
  leer?: () => Promise<string>;
}

export type Resultado = 'compartido' | 'cancelado' | 'sin-activacion' | 'descargado' | 'copiado' | 'sin-portapapeles' | 'abierto';

const nombreDe = (e: unknown): string =>
  e && typeof e === 'object' && 'name' in e ? String((e as { name: unknown }).name) : '';

async function mandar(share: NonNullable<Plataforma['share']>, datos: ShareData): Promise<Resultado> {
  try {
    await share(datos);
    return 'compartido';
  } catch (e) {
    if (nombreDe(e) === 'AbortError') return 'cancelado';
    // Chrome consume la activación del toque al llamar a share, y dura 5 s:
    // si generar tardó más, hay que pedir otro toque.
    if (nombreDe(e) === 'NotAllowedError') return 'sin-activacion';
    throw e;
  }
}

export async function compartirPdf(p: Plataforma, archivo: File): Promise<Resultado> {
  const datos: ShareData = { files: [archivo], title: archivo.name.replace(/\.pdf$/i, '') };
  if (!p.share || !p.canShare?.(datos)) {
    p.descargar(archivo);
    return 'descargado';
  }
  return mandar(p.share, datos);
}

async function compartirOCopiar(p: Plataforma, datos: ShareData, copia: string): Promise<Resultado> {
  if (p.share) {
    const r = await mandar(p.share, datos);
    if (r !== 'sin-activacion') return r;
  }
  if (!p.copiar) return 'sin-portapapeles';
  try {
    await p.copiar(copia);
    return 'copiado';
  } catch {
    return 'sin-portapapeles';
  }
}

export const compartirLink = (p: Plataforma, titulo: string, url: string): Promise<Resultado> =>
  compartirOCopiar(p, { title: titulo, url }, url);

/** Sin `title`: muchas apps lo ignoran, y el título ya va adentro del texto. */
export const compartirTexto = (p: Plataforma, texto: string): Promise<Resultado> =>
  compartirOCopiar(p, { text: texto }, texto);

export const LARGO_MAXIMO_DEL_LINK = 8000;

/** Las fotos de la receta para el pedido: como archivos, y el pedido que las nombra por su link de Drive. */
export interface FotosDelPedido {
  archivos: File[];
  conLinks: string;
}

/**
 * El pedido hacia el agente. Con el menú Compartir del sistema (Android)
 * se elige el agente ahí, y las fotos viajan como archivos junto al texto.
 * Sin él —o sin poder compartir archivos—, un link a claude.ai con el pedido
 * cargado, y las fotos por su link de Drive; si el pedido no entra en el
 * link, se copia y se abre claude.ai vacío para pegarlo.
 */
export async function enviarAlAgente(p: Plataforma, pedido: string, fotos: FotosDelPedido | null = null): Promise<Resultado> {
  const conArchivos = !!fotos?.archivos.length && !!p.canShare?.({ files: fotos.archivos });
  if (p.share && (!fotos || conArchivos)) {
    const r = await mandar(p.share, conArchivos && fotos ? { text: pedido, files: fotos.archivos } : { text: pedido });
    if (r !== 'sin-activacion') return r;
  }
  const texto = fotos ? fotos.conLinks : pedido;
  const link = `https://claude.ai/new?q=${encodeURIComponent(texto)}`;
  if (link.length <= LARGO_MAXIMO_DEL_LINK) {
    // Sin la activación del toque, el navegador bloquea la ventana: el pedido
    // no salió, y quien llamó tiene que pedir otro toque.
    return p.abrir?.(link) ? 'abierto' : 'sin-activacion';
  }
  if (!p.copiar) return 'sin-portapapeles';
  try {
    await p.copiar(texto);
  } catch {
    return 'sin-portapapeles';
  }
  p.abrir?.('https://claude.ai/new');
  return 'copiado';
}

/** El texto copiado, o `null` si el navegador no lo deja leer. */
export async function leerPortapapeles(p: Plataforma): Promise<string | null> {
  if (!p.leer) return null;
  try { return await p.leer(); } catch { return null; }
}

export function plataformaDelNavegador(): Plataforma {
  const nav = navigator;
  return {
    ...(typeof nav.share === 'function' ? { share: (d: ShareData) => nav.share(d) } : {}),
    ...(typeof nav.canShare === 'function' ? { canShare: (d: ShareData) => nav.canShare(d) } : {}),
    ...(nav.clipboard && typeof nav.clipboard.writeText === 'function'
      ? { copiar: (t: string) => nav.clipboard.writeText(t) } : {}),
    descargar: (archivo: File) => {
      const url = URL.createObjectURL(archivo);
      const a = document.createElement('a');
      a.href = url;
      a.download = archivo.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    // Sin `noopener`: con él, `window.open` devuelve `null` siempre y no se
    // sabría si el navegador la bloqueó. El corte con la app se hace a mano.
    abrir: (url: string) => {
      const ventana = window.open(url, '_blank');
      if (!ventana) return false;
      ventana.opener = null;
      return true;
    },
    ...(nav.clipboard && typeof nav.clipboard.readText === 'function'
      ? { leer: () => nav.clipboard.readText() } : {}),
  };
}
