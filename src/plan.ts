/**
 * El `.md` del plan de la semana: `Recetario/_plan.md`. Un `## <Día>` por día
 * con algo cargado, de lunes a domingo, y una línea por receta con la comida
 * como prefijo y un link `[título](drive:<fileId>)`.
 *
 * Es un formato propio, como el del borrador: no comparte parser con
 * `recipe.ts`. Sin frontmatter, y sin fechas —el plan no tiene semana ni
 * historial—.
 *
 * Al leer se ignora lo que no se reconoce —un día que no existe, una línea sin
 * link, una comida que no es Mediodía ni Noche— y no se conserva al reescribir.
 */
import { normalizar } from './recipe.js';
import type { Comida, Momento, Plan } from './tipos.js';

/** Lunes primero: es el índice `dia` de una comida. */
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

/** Los mismos días abreviados, para la columna de la grilla. */
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export const MOMENTOS = ['mediodia', 'noche'] as const;

/** Cómo se escribe cada momento en el archivo y en la pantalla. */
export const NOMBRE_DEL_MOMENTO: Record<Momento, string> = { mediodia: 'Mediodía', noche: 'Noche' };

/** «Martes al mediodía», «Martes a la noche»: el título de la pantalla de agregar. */
export const tituloDeComida = (dia: number, momento: Momento): string =>
  `${DIAS[dia] ?? ''} ${momento === 'mediodia' ? 'al mediodía' : 'a la noche'}`;

const indiceDeDia = (nombre: string): number =>
  DIAS.findIndex(d => normalizar(d) === normalizar(nombre));

const momentoDe = (nombre: string): Momento | null =>
  MOMENTOS.find(m => normalizar(NOMBRE_DEL_MOMENTO[m]) === normalizar(nombre)) ?? null;

/** `- Noche: [Rabas](drive:1EjWIrmaQ)`. El título puede traer corchetes o paréntesis. */
const LINEA = /^\s*-\s*([^:]+):\s*\[(.*)\]\(drive:([^)\s]+)\)\s*$/;

export function parsePlan(texto: unknown): Plan {
  const comidas: Comida[] = [];
  let dia = -1;
  for (const linea of String(texto ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const encabezado = linea.match(/^##\s+(.+?)\s*$/);
    if (encabezado) { dia = indiceDeDia(encabezado[1] ?? ''); continue; }
    if (dia < 0) continue;
    const m = linea.match(LINEA);
    if (!m) continue;
    const momento = momentoDe(m[1] ?? '');
    const id = m[3] ?? '';
    if (!momento || !id) continue;
    comidas.push({ dia, momento, id, titulo: (m[2] ?? '').trim() });
  }
  return { comidas };
}

export function serializePlan(plan: Plan): string {
  const bloques: string[] = [];
  for (let dia = 0; dia < DIAS.length; dia++) {
    // Dentro del día mandan los momentos, y dentro de cada uno el orden del
    // arreglo: agregar suma al final y sacar saca una sola línea.
    const lineas = MOMENTOS.flatMap(momento => plan.comidas
      .filter(c => c.dia === dia && c.momento === momento)
      .map(c => `- ${NOMBRE_DEL_MOMENTO[momento]}: [${c.titulo}](drive:${c.id})`));
    if (lineas.length) bloques.push(`## ${DIAS[dia]}\n${lineas.join('\n')}\n`);
  }
  return bloques.join('\n');
}

/** El día de hoy del teléfono, con lunes en 0. `getDay()` pone el domingo en 0. */
export const diaDeHoy = (fecha = new Date()): number => (fecha.getDay() + 6) % 7;

/** Los siete días en el orden en que se dibujan: hoy primero, y dando la vuelta. */
export const diasDesde = (hoy: number): number[] =>
  Array.from({ length: DIAS.length }, (_, i) => (hoy + i) % DIAS.length);
