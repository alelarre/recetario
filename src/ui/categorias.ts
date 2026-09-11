import { slugArchivo } from '../recipe.js';

/**
 * Identidad visual de cada categoría: una foto y un color.
 *
 * La foto identifica —es lo que se reconoce de un vistazo, sin aprender nada—
 * y el color hilvana: el mismo tono aparece en el filo del tile, en el chip de
 * los resultados de búsqueda y en la banda del detalle, donde una foto de
 * categoría no entra.
 *
 * Las dos cosas se resuelven desde el nombre de la carpeta, que es la única
 * verdad del modelo (§3.1). No hay ids ni mapas de archivos que mantener:
 * agregar una carpeta en Drive alcanza, y la categoría nueva arranca con color
 * plano hasta que alguien le ponga su imagen.
 */

/**
 * Las imágenes se importan desde `src/` y no desde `public/` a propósito: así
 * Vite les pone hash y quedan bajo `/assets/`, que es la única ruta que
 * `sw.js` sirve caché-primero. En `public/` caerían en la regla general, que
 * es red-primero, y serían 16 pedidos de red en cada apertura para archivos
 * que no cambian nunca.
 */
const IMAGENES = import.meta.glob<string>('../categorias/*.webp', {
  eager: true, query: '?url', import: 'default'
});

const porSlug = new Map<string, string>(
  Object.entries(IMAGENES).map(([ruta, url]) => [
    (ruta.split('/').pop() ?? '').replace(/\.webp$/, ''),
    url
  ])
);

/**
 * El color de cada categoría es un token de `tokens.css`: quince matices a 18°
 * entre sí y a 20° del acento (design-system §2.3). Acá vive solo el mapa de
 * carpeta → token; los valores están en un lugar y son los del sistema visual.
 */
const COLORES: Record<string, string> = {
  'arroces-y-legumbres': 'var(--cat-arroces)',
  'aves': 'var(--cat-aves)',
  'bebidas': 'var(--cat-bebidas)',
  'carnes': 'var(--cat-carnes)',
  'desayunos-y-meriendas': 'var(--cat-desayunos)',
  'ensaladas': 'var(--cat-ensaladas)',
  'entradas-y-picadas': 'var(--cat-entradas)',
  'panes-y-masas': 'var(--cat-panes)',
  'pastas': 'var(--cat-pastas)',
  'pescados-y-mariscos': 'var(--cat-pescados)',
  'postres': 'var(--cat-postres)',
  'salsas-y-aderezos': 'var(--cat-salsas)',
  'sopas-y-caldos': 'var(--cat-sopas)',
  'tartas-y-empanadas': 'var(--cat-tartas)',
  'verduras-y-guarniciones': 'var(--cat-verduras)'
};

/**
 * `Otros` no tiene color propio: es la categoría comodín y lo que dice es
 * "todavía no sabemos" (design-system §2.3). Sí tiene foto —el pixel art
 * compuesto sobre su color—, y el neutro es también el respaldo de una carpeta
 * que todavía no está en la lista; sin foto, el tile cae en la trama.
 */
const NEUTRO = 'var(--cat-otros)';

/** Del nombre de la carpeta al slug, igual que el nombre del archivo de receta. */
export function slugCategoria(nombre: unknown): string {
  return slugArchivo(nombre, []).replace(/\.md$/, '');
}

/** El color de una categoría. Una desconocida cae en el neutro, sin romper nada. */
export function colorCategoria(nombre: unknown): string {
  return COLORES[slugCategoria(nombre)] ?? NEUTRO;
}

/** La URL de la foto, o null si esa categoría todavía no tiene. */
export function fotoCategoria(nombre: unknown): string | null {
  return porSlug.get(slugCategoria(nombre)) ?? null;
}
