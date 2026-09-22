/**
 * pdfmake y las fuentes, cargados recién cuando se va a compartir.
 * Abrir la ficha llama a `precargar()`: el toque que genera el PDF es otro, con
 * su propia ventana de activación, y lo pesado ya llegó.
 */
import fuenteRegular from './fuentes/Inter-Regular.ttf?url';
import fuenteSemibold from './fuentes/Inter-SemiBold.ttf?url';
import fuenteItalica from './fuentes/Inter-Italic.ttf?url';
import { documentoPdf } from './documento.js';
import { bloques } from '../ui/markdown.js';
import { fotosSinUso, idDeDrive, resolverReceta } from '../fotos-receta.js';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Receta } from '../tipos.js';

/** El lado mayor de las fotos del PDF: entran a 105 mm de ancho, con esto sobra. */
const LADO_PDF = 800;

/** Lo que el PDF necesita para conseguir las fotos; lo pone `main`, que tiene el caché y el canvas. */
export interface FotosDelPdf {
  /** El blob de una foto de Drive: del caché o pedida con el token. `null` si ya no está. */
  imagenDe: (id: string) => Promise<Blob | null>;
  /** La foto achicada al lado mayor que se le pide. */
  achicar: (blob: Blob, maximo: number) => Promise<Blob>;
}

/** Lo que se usa de pdfmake. El build de navegador es UMD y su forma exacta depende del empaquetador. */
interface PdfMake {
  setFonts(fuentes: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>): void;
  createPdf(documento: TDocumentDefinitions): { getBlob(): Promise<Blob> };
}

let cargando: Promise<PdfMake> | null = null;

export function precargar(): Promise<PdfMake> {
  if (!cargando) {
    cargando = (async () => {
      // pdfmake baja las fuentes por su cuenta y sólo acepta URLs http(s) absolutas.
      const urls = [fuenteRegular, fuenteSemibold, fuenteItalica]
        .map(u => new URL(u, location.href).href) as [string, string, string];
      const [normal, bold, italics] = urls;
      const [modulo] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        ...urls.map(async u => {
          const r = await fetch(u);
          if (!r.ok) throw new Error(`No se pudo bajar la fuente (${r.status})`);
        })
      ]);
      const conDefault = modulo as unknown as { default?: PdfMake } & PdfMake;
      const pdfMake = conDefault.default ?? conDefault;
      pdfMake.setFonts({ Inter: { normal, bold, italics, bolditalics: bold } });
      return pdfMake;
    })();
    // Un fallo —sin señal— no queda guardado: el próximo toque vuelve a intentar.
    cargando.catch(() => { cargando = null; });
  }
  return cargando;
}

/** Las URLs de imagen de un texto ya resuelto, en su orden. */
const urlsDeTexto = (texto: string): string[] =>
  bloques(texto)
    .flatMap(b => ('tramos' in b ? [b.tramos] : b.items))
    .flatMap(tramos => tramos.flatMap(t => (t.imagen ? [t.imagen] : [])));

/** Todas las fotos de la receta resuelta, sin repetir: la cabecera, las de las líneas y el depósito. */
function urlsDeLaReceta(receta: Receta): string[] {
  const textos = [receta.descripcion, receta.ingredientes, receta.preparacion, receta.variaciones, receta.notas,
    ...receta.otras.map(o => o.cuerpo)];
  return [...new Set([
    ...(receta.foto ? [receta.foto] : []),
    ...textos.flatMap(urlsDeTexto),
    ...receta.fotos.map(f => f.url)
  ])];
}

/** La foto como data URL: es lo único que pdfmake entiende sin pedirla él. */
async function aDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binario)}`;
}

/**
 * Cada foto de la receta como data URL, achicada. Las de Drive salen del
 * caché o se piden con el token; una externa se pide con `fetch`, y si falla
 * —CORS, red, un 404— se omite sin aviso.
 */
async function fotosDelPdf(receta: Receta, fotos: FotosDelPdf): Promise<Map<string, string>> {
  const pares = await Promise.all(urlsDeLaReceta(receta).map(async (url): Promise<[string, string][]> => {
    try {
      const id = idDeDrive(url);
      let blob: Blob | null;
      if (id !== null) {
        blob = await fotos.imagenDe(id);
      } else {
        const r = await fetch(url);
        blob = r.ok ? await r.blob() : null;
      }
      if (!blob) return [];
      return [[url, await aDataUrl(await fotos.achicar(blob, LADO_PDF))]];
    } catch (err) {
      console.error(err);
      return [];
    }
  }));
  return new Map(pares.flat());
}

export async function generar(receta: Receta, categoria: string, fotos: FotosDelPdf): Promise<Blob> {
  // El documento se arma con la receta resuelta: `foto:N` es cosa del `.md`.
  const resuelta = resolverReceta(receta);
  // El uso, sobre la receta cruda: en la resuelta ya no hay `foto:N`.
  const sinUso = fotosSinUso(receta);
  const [pdfMake, imagenes] = await Promise.all([precargar(), fotosDelPdf(resuelta, fotos)]);
  return pdfMake.createPdf(documentoPdf(resuelta, categoria, imagenes, sinUso)).getBlob();
}
