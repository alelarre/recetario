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
