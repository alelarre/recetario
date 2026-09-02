import { normalizar, ingredientesIndexables } from './recipe.js';

export const COLUMNAS = [
  'id_archivo',
  'nombre_archivo',
  'titulo',
  'categoria',
  'carpeta_id',
  'rinde',
  'tiempo',
  'dificultad',
  'fuente',
  'tags',
  'ingredientes',
  'mtime'
];

export const DIFICULTADES = ['fácil', 'media', 'difícil'];

/** Un valor que no matchea cae en "sin definir" en vez de romper el filtro (§3.2). */
export function dificultadValida(valor) {
  // Defender contra cualquier tipo
  const s = String(valor ?? '').trim();
  if (!s) return '';
  const n = normalizar(s);
  const encontrada = DIFICULTADES.find(d => normalizar(d) === n);
  return encontrada ?? '';
}

export function filaDesde(receta, ubicacion) {
  // Defender receta
  const r = typeof receta === 'object' && receta !== null ? receta : {};

  // Defender ubicacion
  const u = typeof ubicacion === 'object' && ubicacion !== null ? ubicacion : {};

  // Defender tags: debe ser array
  let tagsArray = Array.isArray(r.tags) ? r.tags : [];
  const tagsStr = tagsArray
    .filter(t => typeof t === 'string' && t.trim())
    // Sacar el | de cada valor: es el separador de la celda (§4.3), y un tag
    // que lo trajera partiría mal al releer. Son valores curados, no texto
    // libre del .md, así que sacarlo no pierde nada real.
    .map(t => t.trim().replace(/\|/g, ''))
    .filter(Boolean)
    .join('|');

  // Defender ingredientes: debe ser array de strings
  let ingredientesArray = ingredientesIndexables(r);
  const ingredientesStr = Array.isArray(ingredientesArray)
    ? ingredientesArray
      .filter(i => typeof i === 'string' && i.trim())
      // Mismo motivo que con tags: el | es el separador de la celda, no un
      // carácter válido dentro de un valor.
      .map(i => i.trim().replace(/\|/g, ''))
      .filter(Boolean)
      .join('|')
    : '';

  // Construir celdas
  const celdas = {
    id_archivo: typeof u.id === 'string' ? u.id : '',
    nombre_archivo: typeof u.nombre_archivo === 'string' ? u.nombre_archivo : '',
    titulo: typeof r.titulo === 'string' ? r.titulo : '',
    categoria: typeof u.categoria === 'string' ? u.categoria : '',
    carpeta_id: typeof u.carpeta_id === 'string' ? u.carpeta_id : '',
    rinde: typeof r.rinde === 'string' ? r.rinde : '',
    tiempo: typeof r.tiempo === 'string' ? r.tiempo : '',
    dificultad: dificultadValida(r.dificultad),
    fuente: typeof r.fuente === 'string' ? r.fuente : '',
    tags: tagsStr,
    ingredientes: ingredientesStr,
    mtime: String(typeof u.mtime === 'number' ? u.mtime : 0)
  };

  return COLUMNAS.map(c => String(celdas[c] ?? ''));
}

export function entradaDesdeFila(fila) {
  // Defender fila: debe ser array
  const f = Array.isArray(fila) ? fila : [];

  const e = {};
  COLUMNAS.forEach((col, i) => {
    const valor = f[i];
    // Defender cada elemento: convertir a string si es string, vacío si no
    e[col] = typeof valor === 'string' ? valor : '';
  });

  // Procesar tags: split si no está vacío
  e.tags = e.tags && typeof e.tags === 'string' && e.tags.trim()
    ? e.tags.split('|').filter(t => typeof t === 'string' && t.trim())
    : [];

  // Procesar ingredientes: split si no está vacío
  e.ingredientes = e.ingredientes && typeof e.ingredientes === 'string' && e.ingredientes.trim()
    ? e.ingredientes.split('|').filter(i => typeof i === 'string' && i.trim())
    : [];

  // Procesar mtime: número o 0
  const mtimeNum = Number(e.mtime);
  e.mtime = isNaN(mtimeNum) || mtimeNum < 0 ? 0 : mtimeNum;

  return e;
}

const esMarkdown = (file) => {
  // Defender file: debe ser un object con properties
  if (typeof file !== 'object' || file === null) return false;

  // Detectar por mimeType o extensión
  return file.mimeType === 'text/markdown' || /\.md$/i.test(file.name ?? '');
};

export function diffCambios(cambios, opciones) {
  const salida = { releer: [], parchear: [], borrar: [], ignorados: [] };

  // Defender cambios: debe ser array
  const cambiosArray = Array.isArray(cambios) ? cambios : [];

  // Defender opciones: puede faltar, ser null o undefined
  // Si no hay opciones válidas, no procesamos nada
  if (typeof opciones !== 'object' || opciones === null) {
    return salida;
  }

  // Defender indice: debe tener .get si es Map, si no tratar como vacío
  const indice = opciones.indice && typeof opciones.indice.get === 'function' ? opciones.indice : new Map();

  // Defender carpetas: debe tener .get si es Map, si no tratar como vacío
  const carpetas = opciones.carpetas && typeof opciones.carpetas.get === 'function' ? opciones.carpetas : new Map();

  for (const cambio of cambiosArray) {
    // Tolera elementos null
    if (cambio === null || typeof cambio !== 'object') continue;

    const id = cambio.fileId ?? cambio.file?.id;
    // Salta si no hay id
    if (!id) continue;

    const file = cambio.file;
    const estaba = indice.get(id);

    // Borrar: removed, sin file, o trashed
    if (cambio.removed || !file || file.trashed) {
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    // Validar que está en una carpeta conocida
    const carpetaId = (file.parents ?? [])[0];
    const categoria = carpetas.get(carpetaId);

    if (categoria === undefined) {
      // Se movió fuera del recetario, o nunca estuvo adentro.
      if (estaba) salida.borrar.push(id); else salida.ignorados.push(id);
      continue;
    }

    // Ignorar si no es markdown
    if (!esMarkdown(file)) { salida.ignorados.push(id); continue; }

    const ubicacion = {
      id,
      nombre_archivo: file.name ?? '',
      categoria,
      carpeta_id: carpetaId,
      mtime: Date.parse(file.modifiedTime ?? '') || 0
    };

    // Comparar con lo que ya existe
    if (!estaba || estaba.mtime !== ubicacion.mtime) {
      // Cambió el contenido o es nuevo
      salida.releer.push(ubicacion);
      continue;
    }

    // Mismo mtime: solo cambió ubicación o nombre
    if (estaba.nombre_archivo !== ubicacion.nombre_archivo || estaba.carpeta_id !== ubicacion.carpeta_id) {
      salida.parchear.push(ubicacion);
      continue;
    }

    // Sin cambios reales
    salida.ignorados.push(id);
  }

  return salida;
}
