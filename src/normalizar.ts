/** Minúsculas y sin tildes. Es la única normalización del sistema. */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // marcas de combinación
    .toLowerCase()
    .trim();
}
