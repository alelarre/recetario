/**
 * Deslizar para abrir y cerrar el menú lateral, como en una app nativa.
 *
 * Con la navegación por gestos, Android usa el deslizamiento desde el borde
 * para «atrás» y lo toma antes que la página: una web no puede reservar esa
 * franja. Por eso, cerrado, el gesto empieza un poco adentro. Acá están sólo
 * las decisiones; `main` escucha los toques y mueve el menú.
 */

/** El ancho del menú en px: el que fija `.lat` en `base.css`. */
export const ANCHO_MENU = 260;

/** Lo que Android se reserva desde el borde izquierdo para «atrás». */
export const MARGEN_BORDE = 24;

/** Cuánto tiene que moverse el dedo antes de decidir si es gesto o desplazamiento. */
const UMBRAL = 10;

/**
 * Cerrado, desde dónde puede empezar; abierto, desde cualquier lado. Sobre una
 * fila que se desplaza de costado el dedo es de la fila: si no, se mueven las
 * dos cosas a la vez.
 */
export function puedeEmpezar(xInicio: number, abierto: boolean, sobreFilaDeslizable = false): boolean {
  if (abierto) return true;
  return !sobreFilaDeslizable && xInicio >= MARGEN_BORDE;
}

/**
 * Si el movimiento es gesto o desplazamiento. Sólo cuenta como gesto uno
 * claramente horizontal: en diagonal gana el desplazamiento de la página.
 */
export function direccion(dx: number, dy: number): 'indeciso' | 'horizontal' | 'vertical' {
  if (Math.abs(dx) < UMBRAL && Math.abs(dy) < UMBRAL) return 'indeciso';
  return Math.abs(dx) > Math.abs(dy) * 1.5 ? 'horizontal' : 'vertical';
}

/** Qué tan abierto va el menú, de 0 a 1, según cuánto se movió el dedo desde donde empezó. */
export function progreso(dx: number, abierto: boolean): number {
  const desde = abierto ? 1 : 0;
  return Math.min(1, Math.max(0, desde + dx / ANCHO_MENU));
}

/** Al soltar: queda abierto si pasó la mitad. */
export function seAbre(p: number): boolean {
  return p > 0.5;
}
