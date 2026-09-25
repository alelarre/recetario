/**
 * El mapa de las acciones de la pantalla: cada `data-accion` y la función que
 * la atiende. El listener de click de `main.ts` sólo busca acá.
 *
 * Las acciones se registran por sección, una por tema, para que cada sección
 * pueda vivir en el módulo de su tema sin que el listener cambie.
 */

/** Lo que hace un toque: recibe el control tocado y el evento. Lo que devuelve, se espera. */
export type Accion = (boton: HTMLElement, e: Event) => unknown;

/** Las acciones de un tema, por su `data-accion`. */
export type SeccionDeAcciones = Readonly<Record<string, Accion>>;

/**
 * Junta las secciones en un solo mapa. Una acción en dos secciones es un error
 * de cableado: una de las dos no se ejecutaría nunca, y se avisa al cargar en
 * vez de descubrirlo tocando.
 */
export function registrarAcciones(secciones: Readonly<Record<string, SeccionDeAcciones>>): Record<string, Accion> {
  const acciones: Record<string, Accion> = {};
  const seccionDe: Record<string, string> = {};
  for (const [seccion, deLaSeccion] of Object.entries(secciones)) {
    for (const [nombre, accion] of Object.entries(deLaSeccion)) {
      const otra = Object.hasOwn(seccionDe, nombre) ? seccionDe[nombre] : undefined;
      if (otra !== undefined) throw new Error(`La acción «${nombre}» está en dos secciones: ${otra} y ${seccion}`);
      seccionDe[nombre] = seccion;
      acciones[nombre] = accion;
    }
  }
  return acciones;
}

/**
 * La acción registrada con ese nombre. Sólo las propias del mapa: un
 * `data-accion="toString"` no encuentra lo que todo objeto trae de fábrica.
 */
export const accionDe = (acciones: Readonly<Record<string, Accion>>, nombre: string | undefined): Accion | undefined =>
  nombre && Object.hasOwn(acciones, nombre) ? acciones[nombre] : undefined;
