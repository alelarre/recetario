/**
 * Las restricciones alimentarias de los invitados y el aviso de *Evento*: por
 * cada grupo con algo prendido, si para una restricción con invitados no hay
 * nada apto, lo dice. Avisa y nada más: no cambia ninguna cantidad ni prende
 * nada. Qué cosa es apta para qué lo declara cada una en su tipo.
 */
import type { Cosa, Restriccion } from './tipos.js';
import { personas } from './formato.js';

export const RESTRICCIONES: readonly { id: Restriccion; nombre: string; uno: string; varios: string }[] = [
  { id: 'vegetariano', nombre: 'Vegetarianos', uno: 'vegetariano', varios: 'vegetarianos' },
  { id: 'vegano', nombre: 'Veganos', uno: 'vegano', varios: 'veganos' },
  { id: 'celiaco', nombre: 'Celíacos', uno: 'celíaco', varios: 'celíacos' },
  { id: 'sin-lactosa', nombre: 'Sin lactosa', uno: 'persona sin lactosa', varios: 'personas sin lactosa' }
];

/** «Carne: nada apto para 2 vegetarianos.», por cada grupo y cada restricción con invitados sin nada apto. */
export function avisosDeRestricciones(
  grupos: readonly { titulo: string; cosas: readonly Cosa[] }[],
  cuantos: Readonly<Record<Restriccion, number | null>>
): string[] {
  return grupos.flatMap(g => RESTRICCIONES.flatMap(r => {
    const n = cuantos[r.id] ?? 0;
    if (n <= 0 || g.cosas.some(c => c.aptaPara?.includes(r.id))) return [];
    return [`${g.titulo}: nada apto para ${personas(n)} ${n === 1 ? r.uno : r.varios}.`];
  }));
}
