import type {
  Receta, Ingrediente, ClaveSeccion,
  GrupoIngredientes, TramoPreparacion, Variacion
} from './tipos.js';
import { parsearFotos, serializarFotos } from './fotos-receta.js';
import { normalizar } from './normalizar.js';
import { especialesValidos, tagReservado } from './especiales.js';

export { normalizar } from './normalizar.js';

/**
 * Las claves del frontmatter, en el orden en que se escriben. Es la única
 * declaración del formato: el parser, el serializador, `validar` y las reglas
 * para los agentes salen de acá.
 */
export const CLAVES_FRONTMATTER = [
  { clave: 'titulo', forma: 'texto' },
  { clave: 'tags', forma: 'lista' },
  { clave: 'tags_especiales', forma: 'lista' },
  { clave: 'rinde', forma: 'texto' },
  { clave: 'tiempo', forma: 'texto' },
  { clave: 'dificultad', forma: 'texto' },
  { clave: 'fuente', forma: 'texto' },
  { clave: 'foto', forma: 'texto' }
] as const;
export type ClaveFrontmatter = (typeof CLAVES_FRONTMATTER)[number]['clave'];
type ClaveTexto = Extract<(typeof CLAVES_FRONTMATTER)[number], { forma: 'texto' }>['clave'];
type ClaveLista = Extract<(typeof CLAVES_FRONTMATTER)[number], { forma: 'lista' }>['clave'];

const formaDe = (clave: string): 'texto' | 'lista' | null =>
  CLAVES_FRONTMATTER.find(c => c.clave === clave)?.forma ?? null;

/**
 * La duración no es texto libre: es uno de estos cinco valores, escritos tal
 * cual en `tiempo`. Cuenta el tiempo hasta comer, con reposo y horno.
 */
export const DURACIONES = ['~15 min', '~30 min', '~60 min', '>60 min', '>1 día'] as const;
export type Duracion = (typeof DURACIONES)[number];

/** El valor si es uno de los cinco; si no, vacío: lo demás se lee como sin duración. */
export function duracionValida(valor: unknown): Duracion | '' {
  if (typeof valor !== 'string') return '';
  const s = valor.trim();
  return (DURACIONES as readonly string[]).includes(s) ? s as Duracion : '';
}

function recetaVacia(): Receta {
  return {
    titulo: null, tags: [], tags_especiales: [], rinde: null, tiempo: null, dificultad: null, fuente: null,
    foto: null,
    extras: {},
    descripcion: '', ingredientes: '', preparacion: '', variaciones: '', notas: '',
    otras: [], fotos: [], avisos: [], ignorados: []
  };
}

function parsearLista(valor: string, resto: string[]): string[] {
  // Formato corto: [a, b, c]
  const corta = valor.match(/^\[(.*)\]$/);
  if (corta?.[1] !== undefined) {
    return corta[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  // Formato largo: líneas siguientes que empiezan con guión
  const items: string[] = [];
  for (const linea of resto) {
    const m = linea.match(/^\s*-\s+(.*)$/);
    if (!m?.[1]) break;
    items.push(m[1].trim());
  }
  return items;
}

function parsearFrontmatter(bloque: string, receta: Receta): void {
  const lineas = bloque.split('\n');
  // Las listas se juntan crudas y se asignan al final: el filtro de cada una
  // necesita la lista entera.
  const listas: Partial<Record<ClaveLista, string[]>> = {};
  let ultimaClave: string | null = null;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (linea === undefined || !linea.trim()) continue;
    if (/^\s*-\s+/.test(linea)) {
      if (ultimaClave === null || formaDe(ultimaClave) !== 'lista') receta.avisos.push('frontmatter-ilegible');
      continue; // ya consumida por una lista
    }
    const m = linea.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m || m[1] === undefined || m[2] === undefined) {
      receta.avisos.push('frontmatter-ilegible');
      continue;
    }
    const clave = m[1];
    const valor = m[2];
    ultimaClave = clave;
    const forma = formaDe(clave);
    if (forma === 'lista') {
      listas[clave as ClaveLista] = parsearLista(valor.trim(), lineas.slice(i + 1));
    } else if (forma === 'texto') {
      receta[clave as ClaveTexto] = valor.trim() === '' ? null : valor.trim();
    } else {
      receta.extras[clave] = valor.trim();
    }
  }

  // Un reservado en `tags` no es un tag común: los especiales tienen su clave.
  const tags = listas.tags ?? [];
  receta.tags = tags.filter(t => !tagReservado(t));
  const { validos, ignorados } = especialesValidos(listas.tags_especiales ?? []);
  receta.tags_especiales = validos;
  receta.ignorados = [
    ...tags.filter(t => tagReservado(t)).map(valor => ({ clave: 'tags' as const, valor })),
    ...ignorados.map(valor => ({ clave: 'tags_especiales' as const, valor }))
  ];
}

export function parse(texto: unknown): Receta {
  const receta = recetaVacia();
  const fuente = String(texto ?? '');

  const m = fuente.match(/^---\n([\s\S]*?)\n---\n?/);
  let cuerpo = fuente;
  if (m?.[1] !== undefined) {
    parsearFrontmatter(m[1], receta);
    cuerpo = fuente.slice(m[0].length);
  } else {
    receta.avisos.push('sin-frontmatter');
  }

  if (!receta.titulo) receta.avisos.push('sin-titulo');
  receta.avisos = [...new Set(receta.avisos)];

  parsearCuerpo(cuerpo, receta);
  return receta;
}

const SECCIONES: Record<string, ClaveSeccion> = {
  ingredientes: 'ingredientes',
  preparacion: 'preparacion',
  variaciones: 'variaciones',
  notas: 'notas'
};

/**
 * Dónde se está acumulando texto: una sección conocida, la descripción, el
 * depósito de fotos —que no es texto, y por eso se resuelve aparte—, o una
 * sección ajena.
 */
type Destino = ClaveSeccion | 'descripcion' | 'fotos' | 'otra';

function parsearCuerpo(cuerpo: string, receta: Receta): void {
  const lineas = String(cuerpo).split('\n');
  let destino: Destino = 'descripcion';
  let encabezadoOtra: string | null = null;
  let buffer: string[] = [];

  const volcar = () => {
    const texto = buffer.join('\n').trim();
    buffer = [];
    if (!texto) { encabezadoOtra = null; return; }
    if (destino === 'fotos') {
      // Mal formada, cae como ajena tal cual: nada se pierde por pasar por el editor.
      const fotos = parsearFotos(texto);
      if (fotos) { receta.fotos = fotos; } else { receta.otras.push({ encabezado: encabezadoOtra ?? 'Fotos', cuerpo: texto }); }
    } else if (destino === 'otra') {
      receta.otras.push({ encabezado: encabezadoOtra ?? '', cuerpo: texto });
    } else if (receta[destino]) {
      receta[destino] = receta[destino] + '\n\n' + texto;
      receta.avisos.push('seccion-duplicada');
    } else {
      receta[destino] = texto;
    }
    encabezadoOtra = null;
  };

  for (const linea of lineas) {
    // `\s+` después de `##` es lo que deja afuera a los `###`.
    const m = linea.match(/^##\s+(.+?)\s*$/);
    if (m?.[1] !== undefined) {
      volcar();
      const encabezadoTrimado = m[1].trim();
      if (!encabezadoTrimado) {
        buffer.push(linea);
        continue;
      }
      const clave = SECCIONES[normalizar(encabezadoTrimado)];
      if (clave) {
        destino = clave;
      } else if (normalizar(encabezadoTrimado) === 'fotos') {
        destino = 'fotos';
        encabezadoOtra = encabezadoTrimado;
      } else {
        destino = 'otra';
        encabezadoOtra = encabezadoTrimado;
      }
      continue;
    }
    buffer.push(linea);
  }
  volcar();
}

const ORDEN_CUERPO: ReadonlyArray<readonly [ClaveSeccion, string]> = [
  ['ingredientes', 'Ingredientes'],
  ['preparacion', 'Preparación'],
  ['variaciones', 'Variaciones'],
  ['notas', 'Notas']
];

/**
 * Serializa lo que le den, no solo una `Receta` completa: el editor entrega
 * objetos a medio armar y los tests le pasan basura a propósito. Por eso el
 * parámetro es parcial y todo se valida adentro.
 */
export function serialize(receta?: Partial<Receta> | null): string {
  const r: Partial<Receta> = receta ?? {};
  const fm: string[] = [];
  for (const { clave, forma } of CLAVES_FRONTMATTER) {
    if (forma === 'lista') {
      const valores = r[clave];
      if (Array.isArray(valores) && valores.length) fm.push(`${clave}: [${valores.join(', ')}]`);
    } else if (r[clave]) {
      fm.push(`${clave}: ${r[clave]}`);
    }
  }
  for (const [clave, valor] of Object.entries(typeof r.extras === 'object' && r.extras !== null ? r.extras : {})) {
    fm.push(`${clave}: ${valor}`);
  }

  const partes: string[] = [];
  if (r.descripcion) partes.push(r.descripcion);
  for (const [clave, encabezado] of ORDEN_CUERPO) {
    if (r[clave]) partes.push(`## ${encabezado}\n${r[clave]}`);
  }
  for (const otra of Array.isArray(r.otras) ? r.otras : []) {
    if (!otra?.encabezado || typeof otra.encabezado !== 'string') continue;
    partes.push(`## ${otra.encabezado}\n${otra.cuerpo}`);
  }
  // Va última, después de Notas y de las secciones ajenas. Sin fotos, no se escribe.
  const fotos = Array.isArray(r.fotos) ? r.fotos : [];
  if (fotos.length) partes.push(`## Fotos\n${serializarFotos(fotos)}`);

  const cabecera = fm.length ? `---\n${fm.join('\n')}\n---\n` : '';
  const cuerpo = partes.length ? `\n${partes.join('\n\n')}\n` : '';
  return cabecera + cuerpo;
}

/**
 * Nombre + separador + cantidad (C05.1.3). Manda el primer separador que
 * aparece. La raya `—` separa sola; el resto pide espacio para no partir un
 * número: `-` y `|` lo piden a los dos lados (`8-10 granos` no se parte), y
 * `,`, `;` y `:` después (`1,5 l` tampoco). La coma, además, sólo separa si
 * le sigue un número: sin esa regla `Sal, pimienta` daría el ingrediente
 * "Sal" con cantidad "pimienta".
 */
function esSeparador(texto: string, i: number): boolean {
  const c = texto[i];
  const antes = texto[i - 1];
  const despues = texto[i + 1];
  const espacio = (x: string | undefined) => x !== undefined && /\s/.test(x);
  if (c === '—') return true;
  if (c === '-' || c === '|') return espacio(antes) && espacio(despues);
  if (c === ',') return /^\s+\p{N}/u.test(texto.slice(i + 1));
  if (c === ';' || c === ':') return espacio(despues);
  return false;
}

/**
 * Dónde caen `![texto](destino)` y `[texto](destino)`: adentro, un guión del
 * id de Drive o del propio destino no es un separador.
 */
function rangosDeMarkdown(texto: string): Array<readonly [number, number]> {
  const rangos: Array<readonly [number, number]> = [];
  for (const m of texto.matchAll(/!?\[[^\]]*\]\([^)]*\)/g)) {
    rangos.push([m.index, m.index + m[0].length]);
  }
  return rangos;
}

export function parseIngrediente(linea: unknown): Ingrediente | null {
  if (typeof linea !== 'string') return null;
  const crudo = linea;
  const limpia = lineaDeIngrediente(crudo);
  if (!limpia || limpia.startsWith('#')) return null;

  const rangos = rangosDeMarkdown(limpia);
  const dentroDeMarkdown = (i: number) => rangos.some(([ini, fin]) => i >= ini && i < fin);

  // Un separador entre paréntesis es parte del texto: el paréntesis describe
  // el ingrediente o es una nota de la cantidad (C05.1.3).
  let parentesis = 0;
  let corte = -1;
  for (let i = 0; i < limpia.length; i++) {
    if (dentroDeMarkdown(i)) continue;
    const c = limpia[i];
    if (c === '(') parentesis++;
    else if (c === ')') parentesis = Math.max(0, parentesis - 1);
    else if (parentesis === 0 && esSeparador(limpia, i)) { corte = i; break; }
  }

  if (corte === -1) return { nombre: limpia, cantidad: null, crudo };
  const nombre = limpia.slice(0, corte).trim();
  const cantidad = limpia.slice(corte + 1).trim();
  return { nombre, cantidad: cantidad || null, crudo };
}

/** La línea de un ingrediente sin la viñeta ni los espacios de los bordes. */
export function lineaDeIngrediente(crudo: string): string {
  return crudo.replace(/^\s*[-*]\s+/, '').trim();
}

/**
 * La cantidad sin la nota: lo que va entre paréntesis después de la cantidad
 * es texto libre —`1 kg (800 g si es de lata)`— y no se lee como cantidad.
 */
export function cantidadSinNota(cantidad: string): string {
  const i = cantidad.indexOf('(');
  return (i === -1 ? cantidad : cantidad.slice(0, i)).trim();
}

/** Las cantidades escritas en palabras, al principio de la cantidad o del nombre. */
const CANTIDADES_EN_PALABRAS = [
  'un', 'una', 'unos', 'unas', 'medio', 'media',
  'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'doce'
] as const;

/** Las cantidades que no son un número. `para` abre una cantidad por uso: `para freír`. */
const CANTIDADES_SIN_NUMERO = ['a gusto', 'al gusto', 'c/n', 'c/s', 'para'] as const;

/** Si el texto empieza con alguna de las palabras, entera. */
function empiezaCon(texto: string, palabras: readonly string[]): boolean {
  const t = normalizar(texto);
  return palabras.some(p => t === p || t.startsWith(p + ' '));
}

/** Si el texto empieza con una cantidad: un número, una fracción o un número en palabras. */
export function empiezaConCantidad(texto: string): boolean {
  return /^\p{N}/u.test(texto.trim()) || empiezaCon(texto, CANTIDADES_EN_PALABRAS);
}

/**
 * Si la cantidad de un ingrediente parece una cantidad (C05.1.3): empieza con
 * un número o una fracción, o es una de las cantidades sin número. Una que
 * no lo parece suele ser otro ingrediente en la misma línea: `Sal - pimienta`.
 */
export function pareceCantidad(cantidad: string): boolean {
  const sinNota = cantidadSinNota(cantidad);
  return empiezaConCantidad(sinNota) || empiezaCon(sinNota, CANTIDADES_SIN_NUMERO);
}

/** Parte un texto de sección por sus `###`. El texto antes del primero es el tramo sin nombre. */
function porSubsecciones(texto: string): { nombre: string; cuerpo: string }[] {
  const partes: { nombre: string; cuerpo: string }[] = [];
  let nombre = '';
  let buffer: string[] = [];
  const volcar = () => {
    const cuerpo = buffer.join('\n').trim();
    if (cuerpo || nombre) partes.push({ nombre, cuerpo });
    buffer = [];
  };
  for (const linea of String(texto ?? '').split('\n')) {
    const m = linea.match(/^###\s+(.+?)\s*$/);
    if (m?.[1]) { volcar(); nombre = m[1].trim(); continue; }
    buffer.push(linea);
  }
  volcar();
  return partes;
}

export function gruposDe(ingredientes: string): GrupoIngredientes[] {
  return porSubsecciones(ingredientes).map(({ nombre, cuerpo }) => ({
    nombre,
    items: cuerpo.split('\n').map(parseIngrediente).filter((i): i is Ingrediente => i !== null)
  }));
}

/** Un paso es una línea que empieza con `1.` o con un bullet. El número no se conserva: se recuenta al dibujar. */
export function tramosDe(preparacion: string): TramoPreparacion[] {
  return porSubsecciones(preparacion).map(({ nombre, cuerpo }) => ({
    nombre,
    pasos: cuerpo.split('\n')
      .map(l => l.replace(/^\s*(?:\d+[.)]|[-*])\s+/, '').trim())
      .filter(Boolean)
  }));
}

export function variacionesDe(variaciones: string): { lista: string[]; secciones: Variacion[] } {
  const partes = porSubsecciones(variaciones);
  const conNombre = partes.filter(p => p.nombre);
  if (conNombre.length === 0) {
    const lista = String(variaciones ?? '').split('\n')
      .map(l => l.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean);
    return { lista, secciones: [] };
  }
  return {
    lista: [],
    secciones: conNombre.map(({ nombre, cuerpo }) => {
      // Una línea en itálica al empezar es la fuente de la variación (IA §1.8).
      const m = cuerpo.match(/^\*(?:fuente:\s*)?(.+?)\*\s*(?:\n|$)/i);
      return {
        nombre,
        fuente: m?.[1]?.trim() ?? null,
        cuerpo: (m ? cuerpo.slice(m[0].length) : cuerpo).trim()
      };
    })
  };
}

/**
 * Si la receta reúne lo mínimo para que el usuario pueda declararla terminada.
 *
 * La completitud es el tag especial `borrador`: esto sólo habilita que
 * se pueda sacar en el editor, y por eso vive en el editor y en ningún camino
 * de lectura.
 *
 * `categoria` es la carpeta elegida: sin ella no se puede guardar, pero se
 * evalúa igual para que la leyenda diga todo lo que falta.
 */
export function sePuedeTerminar(
  receta?: Partial<Receta> | null, categoria?: string | null
): boolean {
  if (!receta) return false;
  if (!receta.titulo) return false;
  if (!categoria) return false;
  const hayIngrediente = gruposDe(String(receta.ingredientes ?? '')).some(g => g.items.length > 0);
  const hayPaso = tramosDe(String(receta.preparacion ?? '')).some(t => t.pasos.length > 0);
  return hayIngrediente && hayPaso;
}

/** Los nombres, tal como están escritos: sin normalizar (C05.4b.1). */
export function ingredientesIndexables(receta?: Partial<Receta> | null): string[] {
  if (!receta) return [];
  const vistos = new Set<string>();
  for (const linea of String(receta.ingredientes ?? '').split('\n')) {
    const ing = parseIngrediente(linea);
    if (!ing?.nombre) continue;
    vistos.add(ing.nombre);
  }
  return [...vistos];
}

/** La línea de contexto de una receta: lo que la ubica sin abrirla. La categoría sale de la carpeta. */
export function contextoDe(receta: Receta, categoria: string): string {
  return [categoria, receta.rinde, duracionValida(receta.tiempo), receta.dificultad].filter(Boolean).join(' · ');
}

export function slugArchivo(titulo: unknown, existentes: unknown[] = []): string {
  if (typeof titulo !== 'string' && typeof titulo !== 'number' && titulo !== null && titulo !== undefined) {
    return 'sin-titulo.md';
  }
  const base = normalizar(titulo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sin-titulo';
  const tomados = new Set<string>((Array.isArray(existentes) ? existentes : []).map(n => String(n ?? '').toLowerCase()));
  if (!tomados.has(`${base}.md`)) return `${base}.md`;
  let n = 2;
  while (tomados.has(`${base}-${n}.md`)) n++;
  return `${base}-${n}.md`;
}
