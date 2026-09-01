import { normalizar, ingredientesIndexables, primeraImagen } from './recipe.js';

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
  'foto',
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
    .map(t => t.trim())
    .join('|');

  // Defender ingredientes: debe ser array de strings
  let ingredientesArray = ingredientesIndexables(r);
  const ingredientesStr = Array.isArray(ingredientesArray)
    ? ingredientesArray
      .filter(i => typeof i === 'string' && i.trim())
      .map(i => i.trim())
      .join('|')
    : '';

  // Defender foto
  const foto = primeraImagen(r);
  const fotoStr = typeof foto === 'string' ? foto : '';

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
    foto: fotoStr,
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
