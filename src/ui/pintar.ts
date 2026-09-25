/** Lo que comparten los dos controladores —la app y el invitado— para dibujar y escuchar toques. */

/**
 * Lo que corre después de cada dibujo, sea la pantalla entera o una parte. Lo
 * registra el controlador: completar las fotos que el HTML dejó pedidas
 * depende de dónde viven los blobs, y eso no es de este módulo.
 */
const despues: (() => void)[] = [];

/** Suma algo a lo que corre después de cada dibujo. Devuelve cómo sacarlo. */
export function despuesDePintar(fn: () => void): () => void {
  despues.push(fn);
  return () => {
    const i = despues.indexOf(fn);
    if (i >= 0) despues.splice(i, 1);
  };
}

const terminarDibujo = (): void => { for (const fn of [...despues]) fn(); };

export function pintar(html: string): void {
  const app = document.querySelector('#app');
  if (app) app.innerHTML = html;
  terminarDibujo();
}

/**
 * Dónde va el HTML de una parte: en lugar de lo que el elemento tiene adentro,
 * en lugar del elemento, o antes o después de lo que ya tiene.
 */
export type DondePintar = 'adentro' | 'reemplazar' | 'al-principio' | 'al-final';

/**
 * Dibuja una parte de la pantalla sin repintarla entera —repintar perdería lo
 * escrito o el foco— y termina igual que `pintar`: las fotos que el HTML deja
 * pedidas se completan. Es el único camino para escribir HTML fuera de
 * `pintar`: una parte escrita a mano quedaría con las fotos sin cargar.
 */
export function pintarParte(elemento: Element, html: string, donde: DondePintar = 'adentro'): void {
  if (donde === 'adentro') elemento.innerHTML = html;
  else if (donde === 'reemplazar') elemento.outerHTML = html;
  else elemento.insertAdjacentHTML(donde === 'al-principio' ? 'afterbegin' : 'beforeend', html);
  terminarDibujo();
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

