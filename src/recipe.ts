import type {
  Receta, Ingrediente, ClaveSeccion,
  GrupoIngredientes, TramoPreparacion, Variacion
} from './tipos.js';

/** Las claves del frontmatter que se escriben tal cual, sin `tags`, que es lista. */
const CLAVES = ['titulo', 'rinde', 'tiempo', 'dificultad', 'fuente', 'foto'] as const;
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
    foto: null, completa: false,
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
    } else if (clave === 'completa') {
      // En el `.md` se escribe «sí» o «no», que es como se lee un archivo de
      // texto. Sin tilde vale igual, y `true` también: es lo que escribían los
      // archivos anteriores al 2026-09-12.
      receta.completa = ['si', 'true'].includes(normalizar(valor));
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
  if (r.foto) fm.push(`foto: ${r.foto}`);
  // La clave se escribe siempre, en los dos valores: la completitud es un dato
  // del archivo y se lee tal cual, sin calcular nada (2026-09-12). Antes sólo
  // se escribía `true` y la ausencia significaba `false`. Sin título no hay
  // receta —el índice la ignora—, así que ahí no se escribe nada.
  if (r.titulo) fm.push(`completa: ${r.completa === true ? 'sí' : 'no'}`);
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

/**
 * Nombre + separador + cantidad (C05.1.3). Manda el primer separador que
 * aparece, salvo la coma, que solo separa si le sigue un dígito: sin esa
 * regla `Sal, pimienta` daría el ingrediente "Sal" con cantidad "pimienta".
 */
const SEPARADORES = ['-', '—', ';', ',', '|'] as const;

export function parseIngrediente(linea: unknown): Ingrediente | null {
  if (typeof linea !== 'string') return null;
  const crudo = linea;
  const limpia = crudo.replace(/^\s*[-*]\s+/, '').trim();
  if (!limpia || limpia.startsWith('#')) return null;

  let corte = -1;
  for (let i = 0; i < limpia.length; i++) {
    const c = limpia[i];
    if (!c || !(SEPARADORES as readonly string[]).includes(c)) continue;
    // La coma pide un dígito después, salteando espacios.
    if (c === ',' && !/^\s*\d/.test(limpia.slice(i + 1))) continue;
    corte = i;
    break;
  }

  if (corte === -1) return { nombre: limpia, cantidad: null, crudo };
  const nombre = limpia.slice(0, corte).trim();
  const cantidad = limpia.slice(corte + 1).trim();
  return { nombre, cantidad: cantidad || null, crudo };
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
 * **No es la completitud**: la completitud es `completa` del frontmatter y se
 * lee tal cual (C05.3.2 reescrito el 2026-09-12). Esto sólo habilita el control
 * del editor, y por eso vive en el editor y en ningún camino de lectura.
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
