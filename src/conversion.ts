/**
 * Convertir un borrador con Claude (P28). La app no llama a ningún modelo:
 * arma el pedido, y reconoce la receta en `.md` que vuelve. Las reglas del
 * formato salen de las mismas constantes que usa la app, así el pedido no se
 * desactualiza cuando cambia el esquema.
 */
import { DURACIONES, DIFICULTADES, TAGS_RESERVADOS } from './catalogo.js';
import { parse } from './recipe.js';
import type { Receta } from './tipos.js';

export interface BorradorAConvertir { id: string; titulo: string; fuente: string; nota: string }

export function pedidoDeConversion({ id, titulo, fuente, nota }: BorradorAConvertir): string {
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
    'Respondé sólo con el .md, sin texto antes ni después y sin bloque de código.'
  ].join('\n');
}

/** Empieza con un frontmatter cerrado que tiene `titulo:`. */
export function esRecetaEnMd(texto: unknown): boolean {
  if (typeof texto !== 'string') return false;
  const m = texto.trimStart().match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return !!m && /^titulo\s*:/m.test(m[1] ?? '');
}

/** La receta parseada, sin la clave `borrador`, que se devuelve aparte. */
export function recetaRecibida(texto: string): { receta: Receta; borradorId: string } {
  const receta = parse(texto.trimStart());
  const borradorId = String(receta.extras['borrador'] ?? '').trim();
  const extras = { ...receta.extras };
  delete extras['borrador'];
  return { receta: { ...receta, extras }, borradorId };
}
