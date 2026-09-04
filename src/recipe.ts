import type { Receta, Ingrediente, Aviso, ClaveSeccion, OtraSeccion } from './tipos.js';

/** Las claves del frontmatter que se escriben tal cual, sin `tags`, que es lista. */
const CLAVES = ['titulo', 'rinde', 'tiempo', 'dificultad', 'fuente'] as const;
type ClaveSimple = (typeof CLAVES)[number];

const esClaveSimple = (c: string): c is ClaveSimple =>
  (CLAVES as readonly string[]).includes(c);

/** Minúsculas y sin tildes. Es la única normalización del sistema (§3.2). */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // marcas de combinación
    .toLowerCase()
    .trim();
}

function recetaVacia(): Receta {
  return {
    titulo: null, tags: [], rinde: null, tiempo: null, dificultad: null, fuente: null,
    extras: {},
    descripcion: '', ingredientes: '', preparacion: '', variaciones: '', notas: '',
    otras: [], avisos: []
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
  let ultimaClave: string | null = null;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (linea === undefined || !linea.trim()) continue;
    if (/^\s*-\s+/.test(linea)) {
      // Si no es tags, es ilegible
      if (ultimaClave !== 'tags') {
        receta.avisos.push('frontmatter-ilegible');
      }
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
    if (clave === 'tags') {
      receta.tags = parsearLista(valor.trim(), lineas.slice(i + 1));
    } else if (esClaveSimple(clave)) {
      receta[clave] = valor.trim() === '' ? null : valor.trim();
    } else {
      receta.extras[clave] = valor.trim();
    }
  }
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

/** Dónde se está acumulando texto: una sección conocida, la descripción, o una ajena. */
type Destino = ClaveSeccion | 'descripcion' | 'otra';

function parsearCuerpo(cuerpo: string, receta: Receta): void {
  const lineas = String(cuerpo).split('\n');
  let destino: Destino = 'descripcion';
  let encabezadoOtra: string | null = null;
  let buffer: string[] = [];

  const volcar = () => {
    const texto = buffer.join('\n').trim();
    buffer = [];
    if (!texto) { encabezadoOtra = null; return; }
    if (destino === 'otra') receta.otras.push({ encabezado: encabezadoOtra ?? '', cuerpo: texto });
    else {
      if (receta[destino]) {
        receta[destino] = receta[destino] + '\n\n' + texto;
        receta.avisos.push('seccion-duplicada');
      } else {
        receta[destino] = texto;
      }
    }
    encabezadoOtra = null;
  };

  for (const linea of lineas) {
    const m = linea.match(/^##\s+(.+?)\s*$/);
    if (m?.[1] !== undefined && !linea.startsWith('###')) {
      volcar();
      const encabezadoTrimado = m[1].trim();
      if (!encabezadoTrimado) {
        buffer.push(linea);
        continue;
      }
      const clave = SECCIONES[normalizar(encabezadoTrimado)];
      if (clave) { destino = clave; } else { destino = 'otra'; encabezadoOtra = encabezadoTrimado; }
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
  if (r.titulo) fm.push(`titulo: ${r.titulo}`);
  if (Array.isArray(r.tags) && r.tags.length) fm.push(`tags: [${r.tags.join(', ')}]`);
  for (const clave of ['rinde', 'tiempo', 'dificultad', 'fuente'] as const) {
    if (r[clave]) fm.push(`${clave}: ${r[clave]}`);
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

  const cabecera = fm.length ? `---\n${fm.join('\n')}\n---\n` : '';
  const cuerpo = partes.length ? `\n${partes.join('\n\n')}\n` : '';
  return cabecera + cuerpo;
}

const UNIDADES = ['g', 'kg', 'mg', 'ml', 'l', 'cc', 'taza', 'tazas', 'cda', 'cdas',
  'cdta', 'cdtas', 'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas',
  'pizca', 'diente', 'dientes', 'lata', 'latas', 'paquete', 'paquetes'];

/** Best-effort a propósito (§3.2): lo que no matchea se muestra tal cual. */
export function parseIngrediente(linea: unknown): Ingrediente | null {
  // Solo strings: un número o un objeto suelto no es un ingrediente válido
  if (typeof linea !== 'string') return null;
  const crudo = linea;
  const limpia = crudo.replace(/^\s*[-*]\s+/, '').trim();
  if (!limpia || limpia.startsWith('#')) return null;

  const m = limpia.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(.*)$/);
  if (!m || m[1] === undefined || m[2] === undefined) {
    return { cantidad: null, unidad: null, item: limpia, crudo };
  }

  const cantidad = m[1];
  let resto = m[2];
  let unidad: string | null = null;
  const primera = resto.split(/\s+/)[0] ?? '';
  if (UNIDADES.includes(normalizar(primera))) {
    unidad = primera;
    resto = resto.slice(primera.length).trim();
  }
  return { cantidad, unidad, item: resto.replace(/^de\s+/i, '').trim(), crudo };
}

export function ingredientesIndexables(receta?: Partial<Receta> | null): string[] {
  if (!receta) return [];
  const vistos = new Set<string>();
  for (const linea of String(receta.ingredientes ?? '').split('\n')) {
    const ing = parseIngrediente(linea);
    if (!ing?.item) continue;
    vistos.add(ing.item.toLowerCase());  // solo minúsculas, nada de sinónimos (§3.2)
  }
  return [...vistos];
}

export function slugArchivo(titulo: unknown, existentes: unknown[] = []): string {
  // Aceptar solo strings, números o null/undefined; rechazar objetos
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
