/**
 * El `.md` de un borrador: título, fuente, cuándo se capturó y los ids de sus
 * fotos en el frontmatter, y la nota como cuerpo entero. Es un formato propio —un borrador
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

/** Un borrador lleva hasta cinco fotos. */
export const MAXIMO_FOTOS = 5;

/** `[a, b]`, la misma sintaxis de lista que los `tags` de la receta. */
const lista = (valor: string): string[] =>
  (valor.match(/^\[(.*)\]$/)?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean);

export function parseBorrador(texto: string): ContenidoBorrador {
  const borrador: ContenidoBorrador = { titulo: '', fuente: '', capturado: '', nota: '', fotos: [] };
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  let cuerpo = lineas;
  if (lineas[0] === '---') {
    const cierre = lineas.indexOf('---', 1);
    if (cierre > 0) {
      for (const linea of lineas.slice(1, cierre)) {
        const m = linea.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
        const clave = m?.[1] ?? '';
        const valor = (m?.[2] ?? '').trim();
        // Lo que no es de un borrador se ignora: no se conserva al reescribir.
        if (esClave(clave)) borrador[clave] = valor;
        else if (clave === 'fotos') borrador.fotos = lista(valor);
      }
      cuerpo = lineas.slice(cierre + 1);
    }
  }
  borrador.nota = cuerpo.join('\n').replace(/^\n+/, '').replace(/\s+$/, '');
  return borrador;
}

export function serializeBorrador(b: ContenidoBorrador): string {
  const fotos = b.fotos.length ? `fotos: [${b.fotos.join(', ')}]\n` : '';
  const frontmatter = `---\ntitulo: ${b.titulo}\nfuente: ${b.fuente}\ncapturado: ${b.capturado}\n${fotos}---\n`;
  return b.nota ? `${frontmatter}\n${b.nota}\n` : frontmatter;
}

export const filaDeBorrador = (e: EntradaBorrador): string[] =>
  [e.id_archivo, e.nombre_archivo, e.titulo, e.capturado];

export const entradaBorradorDesdeFila = (f: string[]): EntradaBorrador => ({
  id_archivo: f[0] ?? '', nombre_archivo: f[1] ?? '', titulo: f[2] ?? '', capturado: f[3] ?? ''
});

/** El primer link de un texto: lo que casi todas las apps mandan compartido. */
const LINK = /https?:\/\/\S+/i;

/**
 * Lo que llega del menú Compartir, repartido entre la fuente y la nota: la
 * fuente es el link —`url` si vino; si no, el primero que haya en el texto— y
 * la nota es lo que sobra del texto. Un texto sin link —una receta copiada de
 * un chat— va entero a la nota, que es lo que después se convierte.
 */
export function desdeCompartido({ url, text }: { url: string; text: string }): { fuente: string; nota: string } {
  const fuente = url.trim() || (text.match(LINK)?.[0] ?? '');
  const nota = (fuente ? text.split(fuente).join(' ') : text)
    .split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').trim();
  return { fuente, nota };
}

const dosCifras = (n: number): string => String(n).padStart(2, '0');

/** El título de un borrador que se guardó sin uno: el día y la hora. */
export function tituloPorDefecto(fecha: Date): string {
  return `Borrador ${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)} ` +
    `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}

/** Un borrador necesita algo de dónde salir: la fuente, la nota o una foto. El título, no. */
export const sePuedeGuardar = (
  { fuente, nota, fotos = 0 }: { fuente: string; nota: string; fotos?: number }
): boolean => !!(fuente.trim() || nota.trim() || fotos > 0);

/**
 * El nombre de una foto nueva: el del `.md` con el primer número libre. El
 * número es para que en Drive se lean juntas; el orden es el de `fotos`.
 */
export function nombreDeFoto(nombreMd: string, hermanos: readonly string[]): string {
  const base = nombreMd.replace(/\.md$/i, '');
  const tomados = new Set(hermanos.map(n => n.toLowerCase()));
  let n = 1;
  while (tomados.has(`${base}-${n}.jpg`.toLowerCase())) n++;
  return `${base}-${n}.jpg`;
}
