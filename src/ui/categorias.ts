import { slugArchivo } from '../recipe.js';
import { CLAVES_COLOR } from '../categorias.js';
import { linkDeFoto } from '../fotos-receta.js';
import type { Categoria } from '../tipos.js';

/**
 * Identidad visual de cada categoría: una foto y un color.
 *
 * La foto identifica —es lo que se reconoce de un vistazo, sin aprender nada—
 * y el color hilvana: el mismo tono aparece en el filo del tile, en el punto de
 * las tarjetas y en la línea de contexto de la receta.
 *
 * Las dos cosas son propiedades de la carpeta en Drive, y llegan acá desde el
 * índice: `main` registra las categorías y este módulo sólo traduce claves. No
 * conoce ningún nombre de categoría; las predefinidas están en
 * `src/categorias.ts`.
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

/** El catálogo: clave → URL. La clave es el nombre del `.webp`. */
const CATALOGO = new Map<string, string>(
  Object.entries(IMAGENES).map(([ruta, url]) => [
    (ruta.split('/').pop() ?? '').replace(/\.webp$/, ''),
    url
  ])
);

/**
 * El neutro de `Otros`: también el respaldo de una categoría sin color o con
 * una clave que la paleta no tiene (design-system §2.3).
 */
const NEUTRO = 'var(--cat-otros)';

let registradas = new Map<string, Categoria>();

/** Las categorías del índice. `main` las registra al arrancar y después de reindexar. */
export function registrarCategorias(lista: Categoria[]): void {
  registradas = new Map(lista.map(c => [c.nombre, c]));
}

/** Del nombre de la carpeta al slug, igual que el nombre del archivo de receta. */
export function slugCategoria(nombre: unknown): string {
  return slugArchivo(nombre, []).replace(/\.md$/, '');
}

/** Las claves del catálogo de fotos, en orden. */
export function fotosDelCatalogo(): string[] {
  return [...CATALOGO.keys()].sort((a, b) => a.localeCompare(b, 'es'));
}

/** El token de una clave de color, o el neutro si la paleta no la tiene. */
export function colorDeClave(color: string): string {
  return (CLAVES_COLOR as readonly string[]).includes(color) ? `var(--cat-${color})` : NEUTRO;
}

/**
 * La URL de una foto de categoría: del catálogo (`catalogo:<clave>`) o propia,
 * subida a `_fotos/` (`drive:<id>`) y resuelta a su link de Drive,
 * igual que la de una receta. Cualquier otro valor da null.
 */
export function urlDeFoto(foto: string): string | null {
  if (foto.startsWith('catalogo:')) return CATALOGO.get(foto.slice('catalogo:'.length)) ?? null;
  if (foto.startsWith('drive:')) return linkDeFoto(foto.slice('drive:'.length));
  return null;
}

/** El color de una categoría registrada. Sin clave válida cae en el neutro, sin romper nada. */
export function colorCategoria(nombre: unknown): string {
  return colorDeClave(registradas.get(String(nombre ?? ''))?.color ?? '');
}

/** La URL de la foto de una categoría registrada, o null. */
export function fotoCategoria(nombre: unknown): string | null {
  return urlDeFoto(registradas.get(String(nombre ?? ''))?.foto ?? '');
}
