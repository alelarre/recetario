/** Lo que comparten los dos controladores —la app y el invitado— para dibujar y escuchar toques. */

export function pintar(html: string): void {
  const app = document.querySelector('#app');
  if (app) app.innerHTML = html;
}

/**
 * Estrecha el destino de un evento a algo con `closest`.
 *
 * Va por capacidad y no por `instanceof Element` a propósito: los tests corren
 * en Node contra un DOM mínimo escrito a mano, donde `Element` no existe como
 * global. Chequear la clase ataría el código de producción a que el entorno de
 * test cargue un DOM completo, que es justo lo que este proyecto no hace.
 */
export const conClosest = (t: EventTarget | null): Element | null =>
  t && typeof (t as Element).closest === 'function' ? t as Element : null;

/** Sin animaciones: el CSS ya lo respeta con `scroll-behavior`, `scrollBy` y `scrollIntoView` no. */
export const movimientoReducido = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * La flecha desplaza la pista de su propio marco, y no la primera de la
 * pantalla: la receta tiene el carrusel de fotos y otra pantalla puede tener el
 * de tags. Se mueve el 80% de lo que se ve, para que quede algo de referencia
 * entre una vista y la siguiente.
 *
 * Las flechas sólo existen con mouse o trackpad —el CSS las esconde—: el
 * teléfono desliza con el dedo.
 */
export function desplazarCarrusel(flecha: Element, hacia: 'carrusel-izq' | 'carrusel-der'): void {
  const pista = flecha.closest('.carrusel-marco')?.querySelector<HTMLElement>('[data-carrusel]');
  if (!pista) return;
  const paso = Math.round(pista.clientWidth * 0.8);
  pista.scrollBy?.({
    left: hacia === 'carrusel-der' ? paso : -paso,
    behavior: movimientoReducido() ? 'auto' : 'smooth'
  });
}
