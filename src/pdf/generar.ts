/**
 * pdfmake y las fuentes, cargados recién cuando se va a compartir.
 * Abrir la ficha llama a `precargar()`: el toque que genera el PDF es otro, con
 * su propia ventana de activación, y lo pesado ya llegó.
 */
import fuenteRegular from './fuentes/Inter-Regular.ttf?url';
import fuenteSemibold from './fuentes/Inter-SemiBold.ttf?url';
import fuenteItalica from './fuentes/Inter-Italic.ttf?url';
import { documentoPdf } from './documento.js';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Receta } from '../tipos.js';

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

export async function generar(receta: Receta, categoria: string): Promise<Blob> {
  const pdfMake = await precargar();
  return pdfMake.createPdf(documentoPdf(receta, categoria)).getBlob();
}
