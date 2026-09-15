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
