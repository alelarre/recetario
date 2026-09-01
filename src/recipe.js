const CLAVES = ['titulo', 'tags', 'rinde', 'tiempo', 'dificultad', 'fuente'];

/** Minúsculas y sin tildes. Es la única normalización del sistema (§3.2). */
export function normalizar(texto) {
  return (texto ?? '')
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
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea.trim()) continue;
    if (/^\s*-\s+/.test(linea)) continue; // ya consumida por una lista
    const m = linea.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) { receta.avisos.push('frontmatter-ilegible'); continue; }
    const [, clave, valor] = m;
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

// Implementada en la tarea siguiente; por ahora todo el cuerpo es descripción.
function parsearCuerpo(cuerpo, receta) {
  receta.descripcion = cuerpo.trim();
}
