/**
 * El menú Compartir del sistema, con sus respaldos (spec §2). La plataforma se
 * inyecta: los tests corren en Node, donde `navigator.share` no existe.
 */
export interface Plataforma {
  share?: (datos: ShareData) => Promise<void>;
  canShare?: (datos: ShareData) => boolean;
  copiar?: (texto: string) => Promise<void>;
  descargar: (archivo: File) => void;
}

export type Resultado = 'compartido' | 'cancelado' | 'sin-activacion' | 'descargado' | 'copiado' | 'sin-portapapeles';

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
    }
  };
}
