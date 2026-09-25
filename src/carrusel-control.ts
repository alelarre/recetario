/**
 * Las flechas de un carrusel (`carrusel()` en `ui/componentes.ts`), que sólo
 * existen con mouse o trackpad —el CSS las esconde—: el teléfono desliza con el
 * dedo. Lo usan la app y la vista de invitado.
 */
import { movimientoReducido } from './ui/pintar.js';
import type { SeccionDeAcciones } from './acciones.js';

/**
 * La flecha desplaza la pista de su propio marco, y no la primera de la
 * pantalla: la receta tiene el carrusel de fotos y otra pantalla puede tener
 * el de tags y el de duraciones. Se mueve el 80% de lo que se ve, para que
 * quede algo de referencia entre una vista y la siguiente.
 */
function desplazar(flecha: Element, hacia: 1 | -1): void {
  const pista = flecha.closest('.carrusel-marco')?.querySelector<HTMLElement>('[data-carrusel]');
  if (!pista) return;
  pista.scrollBy?.({
    left: hacia * Math.round(pista.clientWidth * 0.8),
    behavior: movimientoReducido() ? 'auto' : 'smooth'
  });
}

export const accionesDelCarrusel: SeccionDeAcciones = {
  'carrusel-izq': (flecha) => { desplazar(flecha, -1); },
  'carrusel-der': (flecha) => { desplazar(flecha, 1); }
};
