/**
 * Las partes de un grupo que se reparte: cuánto lleva cada cosa prendida, de
 * 0 a 1, sumando 1. Lo guardado es la proporción de cada una —la mueven los
 * sliders—; la que no tiene parte guardada entra con la de un reparto parejo,
 * y las demás le hacen lugar en su proporción.
 */
export function partes(ids: readonly string[], reparto: Readonly<Record<string, number>>): Record<string, number> {
  const n = ids.length;
  const guardada = (id: string): number | null => {
    const v = reparto[id];
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
  };
  const conParte = ids.filter(id => guardada(id) !== null);
  const suma = conParte.reduce((s, id) => s + (guardada(id) ?? 0), 0);
  if (!n || suma <= 0) return Object.fromEntries(ids.map(id => [id, 1 / n]));
  const paraLasGuardadas = 1 - (n - conParte.length) / n;
  return Object.fromEntries(ids.map(id => {
    const g = guardada(id);
    return [id, g === null ? 1 / n : paraLasGuardadas * g / suma];
  }));
}
