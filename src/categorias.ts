/**
 * Las categorías predefinidas, en un solo lugar.
 *
 * Son las 16 con las que arranca un Recetario: su nombre, su color de la paleta
 * y su foto del catálogo. Ningún otro archivo nombra una categoría. Los valores
 * de los colores viven en `src/ui/tokens.css` como `--cat-<clave>`, y las fotos
 * en `src/categorias/<clave>.webp`: sumar una predefinida es una fila acá y su
 * `.webp`.
 *
 * También vive acá la fila de la hoja `categorias` del índice.
 */
import { normalizar } from './recipe.js';
import type { Categoria } from './tipos.js';

export const CLAVES_COLOR = [
  'arroces', 'aves', 'bebidas', 'carnes', 'desayunos', 'ensaladas', 'entradas', 'panes',
  'pastas', 'pescados', 'postres', 'salsas', 'sopas', 'tartas', 'verduras', 'otros'
] as const;

export type ClaveColor = (typeof CLAVES_COLOR)[number];

export interface CategoriaPredefinida {
  nombre: string;
  color: ClaveColor;
  /** Clave del catálogo: `src/categorias/<foto>.webp`. */
  foto: string;
}

export const PREDEFINIDAS: readonly CategoriaPredefinida[] = [
  { nombre: 'Arroces y legumbres', color: 'arroces', foto: 'arroces-y-legumbres' },
  { nombre: 'Aves', color: 'aves', foto: 'aves' },
  { nombre: 'Bebidas', color: 'bebidas', foto: 'bebidas' },
  { nombre: 'Carnes', color: 'carnes', foto: 'carnes' },
  { nombre: 'Desayunos y meriendas', color: 'desayunos', foto: 'desayunos-y-meriendas' },
  { nombre: 'Ensaladas', color: 'ensaladas', foto: 'ensaladas' },
  { nombre: 'Entradas y picadas', color: 'entradas', foto: 'entradas-y-picadas' },
  { nombre: 'Panes y masas', color: 'panes', foto: 'panes-y-masas' },
  { nombre: 'Pastas', color: 'pastas', foto: 'pastas' },
  { nombre: 'Pescados y mariscos', color: 'pescados', foto: 'pescados-y-mariscos' },
  { nombre: 'Postres', color: 'postres', foto: 'postres' },
  { nombre: 'Salsas y aderezos', color: 'salsas', foto: 'salsas-y-aderezos' },
  { nombre: 'Sopas y caldos', color: 'sopas', foto: 'sopas-y-caldos' },
  { nombre: 'Tartas y empanadas', color: 'tartas', foto: 'tartas-y-empanadas' },
  { nombre: 'Verduras y guarniciones', color: 'verduras', foto: 'verduras-y-guarniciones' },
  // Otros es el comodín: su color es el neutro (design-system §2.3).
  { nombre: 'Otros', color: 'otros', foto: 'otros' }
];

/** La predefinida con ese nombre, sin mirar tildes ni mayúsculas. */
export function predefinidaPorNombre(nombre: string): CategoriaPredefinida | null {
  const buscado = normalizar(nombre);
  return PREDEFINIDAS.find(p => normalizar(p.nombre) === buscado) ?? null;
}

export const COLUMNAS_CATEGORIAS = ['id_carpeta', 'nombre', 'color', 'foto'] as const;

export const filaDeCategoria = (c: Categoria): string[] => [c.id, c.nombre, c.color, c.foto];

export const categoriaDesdeFila = (f: string[]): Categoria => ({
  id: f[0] ?? '', nombre: f[1] ?? '', color: f[2] ?? '', foto: f[3] ?? ''
});
