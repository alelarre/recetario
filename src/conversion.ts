/**
 * Convertir un borrador con Claude (P28). La app no llama a ningún modelo:
 * arma el pedido, y reconoce la receta en `.md` que vuelve. Las reglas del
 * formato salen de las mismas constantes que usa la app, así el pedido no se
 * desactualiza cuando cambia el esquema.
 */
import { DURACIONES, DIFICULTADES, TAGS_RESERVADOS } from './catalogo.js';
import { parse } from './recipe.js';
import type { Receta, Borrador } from './tipos.js';

export function pedidoDeConversion({ id, titulo, fuente, nota }: Pick<Borrador, 'id' | 'titulo' | 'fuente' | 'nota'>): string {
  const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');
  return [
    'Convertí este borrador en una receta para mi Recetario. Leé la fuente y escribí la receta en el formato de abajo.',
    '',
    'Borrador:',
    `Título: ${titulo}`,
    ...(fuente ? [`Fuente: ${fuente}`] : []),
    ...(nota ? [`Nota: ${nota}`] : []),
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
 * CRLF (precedente: `borrador.ts:21`). `parse()` de `recipe.ts` sólo reconoce
 * `\n`: sin esto, una receta compartida o pegada con saltos de Windows se
 * detecta como receta pero se parsea vacía.
 */
const normalizarSaltos = (texto: string): string => texto.replace(/\r\n/g, '\n');

/** Empieza con un frontmatter cerrado que tiene `titulo:`. */
export function esRecetaEnMd(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = normalizarSaltos(texto).trimStart().match(/^---\n([\s\S]*?)\n---(\n|$)/);
  return !!m && /^titulo\s*:/m.test(m[1] ?? '');
}

/** La receta parseada, sin la clave `borrador`, que se devuelve aparte. */
export function recetaRecibida(texto: string): { receta: Receta; borradorId: string } {
  const receta = parse(normalizarSaltos(texto).trimStart());
  const borradorId = String(receta.extras['borrador'] ?? '').trim();
  const extras = { ...receta.extras };
  delete extras['borrador'];
  return { receta: { ...receta, extras }, borradorId };
}
