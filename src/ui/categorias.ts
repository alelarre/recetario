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
 * Matices repartidos a propósito, con 14° de separación mínima; todos dan
 * contraste AA con texto oscuro encima. Un hash del nombre repartía al azar y
 * con 16 categorías siempre agrupaba: `Pescados y mariscos` y `Ensaladas`
 * caían en el mismo matiz exacto.
 */
const COLORES: Record<string, string> = {
  'carnes': 'hsl(8 62% 58%)',
  'entradas-y-picadas': 'hsl(28 70% 60%)',
  'panes-y-masas': 'hsl(42 68% 55%)',
  'pastas': 'hsl(64 46% 52%)',
  'verduras-y-guarniciones': 'hsl(92 48% 50%)',
  'ensaladas': 'hsl(118 44% 48%)',
  'salsas-y-aderezos': 'hsl(148 46% 46%)',
  'pescados-y-mariscos': 'hsl(174 58% 50%)',
  'bebidas': 'hsl(196 58% 54%)',
  'otros': 'hsl(220 40% 58%)',
  'desayunos-y-meriendas': 'hsl(244 44% 64%)',
  'aves': 'hsl(268 44% 64%)',
  'sopas-y-caldos': 'hsl(292 42% 60%)',
  'arroces-y-legumbres': 'hsl(316 42% 58%)',
  'postres': 'hsl(334 58% 64%)',
  'tartas-y-empanadas': 'hsl(354 54% 60%)',
};

/** El color de respaldo de una carpeta que todavía no está en la lista. */
const NEUTRO = 'hsl(258 12% 46%)';

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
