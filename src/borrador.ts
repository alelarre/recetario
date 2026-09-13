/**
 * El `.md` de un borrador: título, fuente y cuándo se capturó en el
 * frontmatter, y la nota como cuerpo entero. Es un formato propio —un borrador
 * no es una receta incompleta—, y no comparte parser con `recipe.ts`.
 *
 * También vive acá su fila de la hoja `borradores` del índice.
 */
import type { Borrador, EntradaBorrador } from './tipos.js';

/** Lo que dice el archivo. El id es de Drive, no del contenido. */
export type ContenidoBorrador = Omit<Borrador, 'id'>;

export const COLUMNAS_BORRADORES = ['id_archivo', 'nombre_archivo', 'titulo', 'capturado'] as const;

const CLAVES = ['titulo', 'fuente', 'capturado'] as const;
type Clave = (typeof CLAVES)[number];
const esClave = (c: string): c is Clave => (CLAVES as readonly string[]).includes(c);

export function parseBorrador(texto: string): ContenidoBorrador {
  const borrador: ContenidoBorrador = { titulo: '', fuente: '', capturado: '', nota: '' };
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  let cuerpo = lineas;
  if (lineas[0] === '---') {
    const cierre = lineas.indexOf('---', 1);
    if (cierre > 0) {
      for (const linea of lineas.slice(1, cierre)) {
        const m = linea.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
        const clave = m?.[1] ?? '';
        // Lo que no es de un borrador se ignora: no se conserva al reescribir.
        if (esClave(clave)) borrador[clave] = (m?.[2] ?? '').trim();
      }
      cuerpo = lineas.slice(cierre + 1);
    }
  }
  borrador.nota = cuerpo.join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
  return borrador;
}

export function serializeBorrador(b: ContenidoBorrador): string {
  const frontmatter = `---\ntitulo: ${b.titulo}\nfuente: ${b.fuente}\ncapturado: ${b.capturado}\n---\n`;
  return b.nota ? `${frontmatter}\n${b.nota}\n` : frontmatter;
}

export const filaDeBorrador = (e: EntradaBorrador): string[] =>
  [e.id_archivo, e.nombre_archivo, e.titulo, e.capturado];

export const entradaBorradorDesdeFila = (f: string[]): EntradaBorrador => ({
  id_archivo: f[0] ?? '', nombre_archivo: f[1] ?? '', titulo: f[2] ?? '', capturado: f[3] ?? ''
});
