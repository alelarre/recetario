/**
 * Convertir un borrador con Claude. La app no llama a ningún modelo:
 * arma el pedido, y reconoce la receta en `.md` que vuelve. Las reglas del
 * formato salen de las mismas constantes que usa la app, así el pedido no se
 * desactualiza cuando cambia el esquema.
 */
import { DURACIONES, DIFICULTADES, TAGS_RESERVADOS } from './catalogo.js';
import { parse } from './recipe.js';
import { linkDeFoto } from './fotos-receta.js';
import type { Receta, Borrador } from './tipos.js';

/**
 * Qué son las fotos y cómo tratarlas. Con `links`, una línea por foto con su
 * link de Drive: es el pedido que no puede llevar las fotos como archivos.
 */
function parrafoDeFotos(fotos: readonly string[], links: boolean): string[] {
  if (!fotos.length) return [];
  return [
    '',
    `Fotos: ${fotos.length === 1 ? 'va 1' : `van ${fotos.length}`}, en orden. Pueden ser páginas de un libro, una receta escrita a ` +
      'mano, una captura de pantalla o el plato terminado. Transcribí lo que se lee, sin inventar cantidades ni pasos ' +
      'que no estén. Una foto del plato sirve para el título y la descripción, no para la receta.',
    ...(links
      ? [...fotos.map((id, i) => `Foto ${i + 1}: ${linkDeFoto(id)}`),
        'Las fotos están en mi Google Drive: leelas con el conector de Drive.']
      : [])
  ];
}

export function pedidoDeConversion(
  { id, titulo, fuente, nota, fotos = [] }: Pick<Borrador, 'id' | 'titulo' | 'fuente' | 'nota'> & { fotos?: readonly string[] },
  { links = false }: { links?: boolean } = {}
): string {
  const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');
  return [
    'Convertí este borrador en una receta para mi Recetario. Leé la fuente y escribí la receta en el formato de abajo.',
    '',
    'Borrador:',
    `Título: ${titulo}`,
    ...(fuente ? [`Fuente: ${fuente}`] : []),
    ...(nota ? [`Nota: ${nota}`] : []),
    ...parrafoDeFotos(fotos, links),
    '',
    'Formato:',
    '- Frontmatter entre `---`, con estas claves y ninguna otra: `titulo` (obligatoria), `tags` como lista `[a, b]`, `rinde`, `tiempo`, `dificultad`, `fuente`, `foto`.',
    `- \`tiempo\` es uno de estos valores, tal cual: ${lista(DURACIONES)}. Cuenta el tiempo hasta comer, con reposo y horno. Si la fuente no lo dice, no lo pongas.`,
    `- \`dificultad\` es uno de estos valores: ${lista(DIFICULTADES)}. Si no se puede saber, no la pongas.`,
    `- En \`tags\` no uses estos: ${lista(TAGS_RESERVADOS)}.`,
    `- La última línea del frontmatter es \`borrador: ${id}\`.`,
    '- Después del frontmatter, una descripción corta opcional y las secciones `## Ingredientes`, `## Preparación`, `## Variaciones` y `## Notas`, sólo las que haya.',
    '- Un ingrediente por línea: `- nombre — cantidad`. Los `###` agrupan ingredientes o tramos de la preparación.',
    '- La preparación en pasos numerados.',
    '',
    'No inventes temperaturas, tiempos ni cantidades que la fuente no dice. No agregues datos nutricionales.',
    '',
    'Respondé en formato markdown, sólo con el texto plano, sin texto antes ni después. Usar un bloque de código o quote si es necesario para evitar aplicar formato en la salida.'
  ].join('\n');
}

/**
 * `\r\n` → `\n`, una vez, para que el resto del módulo no tenga que pensar en
 * CRLF (precedente: `borrador.ts`). `parse()` de `recipe.ts` sólo reconoce
 * `\n`: sin esto, una receta compartida o pegada con saltos de Windows se
 * detecta como receta pero se parsea vacía.
 */
const normalizarSaltos = (texto: string): string => texto.replace(/\r\n/g, '\n');

/**
 * El contenido del primer bloque de código, si hay uno. El pedido acepta que
 * la respuesta venga envuelta —algunos agentes la muestran así para no
 * aplicarle formato—, y de paso tolera el texto que quede afuera del bloque.
 */
function sinBloqueDeCodigo(texto: string): string {
  const m = texto.match(/(?:^|\n)[ \t]*(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n?[ \t]*\1[ \t]*(?:\n|$)/);
  return m?.[2] ?? texto;
}

/** Sin el `>` de la cita, cuando todo lo que tiene texto viene citado. */
function sinCita(texto: string): string {
  const lineas = texto.split('\n');
  const conTexto = lineas.filter(l => l.trim());
  if (!conTexto.length || !conTexto.every(l => /^\s*>/.test(l))) return texto;
  return lineas.map(l => l.replace(/^\s*>\s?/, '')).join('\n');
}

/** Lo que llega compartido o pegado, sin el envoltorio que le puso el agente. */
const limpiarRecibido = (texto: string): string =>
  sinCita(sinBloqueDeCodigo(normalizarSaltos(texto))).trim();

/** Empieza con un frontmatter cerrado que tiene `titulo:`. */
export function esRecetaEnMd(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = limpiarRecibido(texto).match(/^---\n([\s\S]*?)\n---(\n|$)/);
  return !!m && /^titulo\s*:/m.test(m[1] ?? '');
}

/** La receta parseada, sin la clave `borrador`, que se devuelve aparte. */
export function recetaRecibida(texto: string): { receta: Receta; borradorId: string } {
  const receta = parse(limpiarRecibido(texto) + '\n');
  const borradorId = String(receta.extras['borrador'] ?? '').trim();
  const extras = { ...receta.extras };
  delete extras['borrador'];
  return { receta: { ...receta, extras }, borradorId };
}
