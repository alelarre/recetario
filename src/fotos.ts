/**
 * Achicar una foto antes de subirla: el lado mayor a 1600 px, en JPEG. Una
 * foto del teléfono pesa varios MB; achicada alcanza para leer una página y
 * viaja rápido a Drive y a Claude.
 *
 * El canvas y el decodificador se reciben por parámetro: los tests corren en
 * Node, donde no existen.
 */

/** Lo que se usa de un `<canvas>`. */
export interface Lienzo {
  width: number;
  height: number;
  getContext(tipo: '2d'): { drawImage(imagen: never, x: number, y: number, ancho: number, alto: number): void } | null;
  toBlob(alTerminar: (blob: Blob | null) => void, tipo: string, calidad: number): void;
}

/** Lo que se usa de un `ImageBitmap`. */
export interface Imagen {
  width: number;
  height: number;
  close?: () => void;
}

export const LADO_MAXIMO = 1600;
const CALIDAD = 0.85;

/** El ancho y el alto con el lado mayor en `maximo` o menos. Nunca agranda. */
export function medidas(ancho: number, alto: number, maximo = LADO_MAXIMO): { ancho: number; alto: number } {
  const escala = Math.min(1, maximo / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

/**
 * La foto achicada, en JPEG. Rechaza si el navegador no la puede decodificar
 * —HEIC, un archivo roto—: esa foto no se agrega. El `maximo` se elige para el
 * PDF, que las quiere más chicas que las que van a Drive (spec §10).
 */
export async function achicar(
  archivo: Blob,
  lienzo: () => Lienzo,
  decodificar: (b: Blob) => Promise<Imagen> = b => createImageBitmap(b),
  maximo = LADO_MAXIMO
): Promise<Blob> {
  const imagen = await decodificar(archivo);
  try {
    const { ancho, alto } = medidas(imagen.width, imagen.height, maximo);
    const canvas = lienzo();
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Sin contexto 2d');
    contexto.drawImage(imagen as never, 0, 0, ancho, alto);
    return await new Promise<Blob>((resolver, rechazar) => {
      canvas.toBlob(b => (b ? resolver(b) : rechazar(new Error('No se pudo exportar la foto'))), 'image/jpeg', CALIDAD);
    });
  } finally {
    imagen.close?.();
  }
}
