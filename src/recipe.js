const CLAVES = ['titulo', 'tags', 'rinde', 'tiempo', 'dificultad', 'fuente'];

/** Minúsculas y sin tildes. Es la única normalización del sistema (§3.2). */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // marcas de combinación
    .toLowerCase()
    .trim();
}

function recetaVacia() {
  return {
    titulo: null, tags: [], rinde: null, tiempo: null, dificultad: null, fuente: null,
    extras: {},
    descripcion: '', ingredientes: '', preparacion: '', variaciones: '', notas: '',
    otras: [], avisos: []
  };
}

function parsearLista(valor, resto) {
  // Formato corto: [a, b, c]
  const corta = valor.match(/^\[(.*)\]$/);
  if (corta) {
    return corta[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  // Formato largo: líneas siguientes que empiezan con guión
  const items = [];
  for (const linea of resto) {
    const m = linea.match(/^\s*-\s+(.*)$/);
    if (!m) break;
    items.push(m[1].trim());
  }
  return items;
}

function parsearFrontmatter(bloque, receta) {
  const lineas = bloque.split('\n');
  let ultimaClave = null;
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea.trim()) continue;
    if (/^\s*-\s+/.test(linea)) {
      // Si no es tags, es ilegible
      if (ultimaClave !== 'tags') {
        receta.avisos.push('frontmatter-ilegible');
      }
      continue; // ya consumida por una lista
    }
    const m = linea.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) { receta.avisos.push('frontmatter-ilegible'); continue; }
    const [, clave, valor] = m;
    ultimaClave = clave;
    if (clave === 'tags') {
      receta.tags = parsearLista(valor.trim(), lineas.slice(i + 1));
    } else if (CLAVES.includes(clave)) {
      receta[clave] = valor.trim() === '' ? null : valor.trim();
    } else {
      receta.extras[clave] = valor.trim();
    }
  }
}

export function parse(texto) {
  const receta = recetaVacia();
  const fuente = String(texto ?? '');

  const m = fuente.match(/^---\n([\s\S]*?)\n---\n?/);
  let cuerpo = fuente;
  if (m) {
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

const SECCIONES = {
  ingredientes: 'ingredientes',
  preparacion: 'preparacion',
  variaciones: 'variaciones',
  notas: 'notas'
};

function parsearCuerpo(cuerpo, receta) {
  const lineas = String(cuerpo).split('\n');
  let destino = 'descripcion';
  let encabezadoOtra = null;
  let buffer = [];

  const volcar = () => {
    const texto = buffer.join('\n').trim();
    buffer = [];
    if (!texto) { encabezadoOtra = null; return; }
    if (destino === 'otra') receta.otras.push({ encabezado: encabezadoOtra, cuerpo: texto });
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
    if (m && !linea.startsWith('###')) {
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

const ORDEN_CUERPO = [
  ['ingredientes', 'Ingredientes'],
  ['preparacion', 'Preparación'],
  ['variaciones', 'Variaciones'],
  ['notas', 'Notas']
];

export function serialize(receta) {
  receta = receta ?? {};
  const fm = [];
  if (receta.titulo) fm.push(`titulo: ${receta.titulo}`);
  if (Array.isArray(receta.tags) && receta.tags.length) fm.push(`tags: [${receta.tags.join(', ')}]`);
  for (const clave of ['rinde', 'tiempo', 'dificultad', 'fuente']) {
    if (receta[clave]) fm.push(`${clave}: ${receta[clave]}`);
  }
  for (const [clave, valor] of Object.entries(typeof receta.extras === 'object' && receta.extras !== null ? receta.extras : {})) {
    fm.push(`${clave}: ${valor}`);
  }

  const partes = [];
  if (receta.descripcion) partes.push(receta.descripcion);
  for (const [clave, encabezado] of ORDEN_CUERPO) {
    if (receta[clave]) partes.push(`## ${encabezado}\n${receta[clave]}`);
  }
  for (const otra of Array.isArray(receta.otras) ? receta.otras : []) {
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
export function parseIngrediente(linea) {
  // Solo strings: un número o un objeto suelto no es un ingrediente válido
  if (typeof linea !== 'string') return null;
  const crudo = linea;
  const limpia = crudo.replace(/^\s*[-*]\s+/, '').trim();
  if (!limpia || limpia.startsWith('#')) return null;

  const m = limpia.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(.*)$/);
  if (!m) return { cantidad: null, unidad: null, item: limpia, crudo };

  let [, cantidad, resto] = m;
  let unidad = null;
  const primera = resto.split(/\s+/)[0];
  if (UNIDADES.includes(normalizar(primera))) {
    unidad = primera;
    resto = resto.slice(primera.length).trim();
  }
  return { cantidad, unidad, item: resto.replace(/^de\s+/i, '').trim(), crudo };
}

export function ingredientesIndexables(receta) {
  if (!receta) return [];
  const vistos = new Set();
  for (const linea of String(receta.ingredientes ?? '').split('\n')) {
    const ing = parseIngrediente(linea);
    if (!ing?.item) continue;
    vistos.add(ing.item.toLowerCase());  // solo minúsculas, nada de sinónimos (§3.2)
  }
  return [...vistos];
}

export function slugArchivo(titulo, existentes = []) {
  // Aceptar solo strings, números o null/undefined; rechazar objetos
  if (typeof titulo !== 'string' && typeof titulo !== 'number' && titulo !== null && titulo !== undefined) {
    return 'sin-titulo.md';
  }
  const base = normalizar(titulo)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sin-titulo';
  const tomados = new Set((Array.isArray(existentes) ? existentes : []).map(n => String(n ?? '').toLowerCase()));
  if (!tomados.has(`${base}.md`)) return `${base}.md`;
  let n = 2;
  while (tomados.has(`${base}-${n}.md`)) n++;
  return `${base}-${n}.md`;
}
