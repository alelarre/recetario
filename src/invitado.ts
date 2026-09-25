/**
 * El controlador de la vista de invitado. No carga nada de la app: ni store,
 * ni token, ni el manejador de acciones de `main.ts`. Escucha sólo las acciones
 * de su lista; una acción nueva de la app no llega acá aunque use el mismo nombre.
 */
import { pintar, conClosest, desplazarCarrusel } from './ui/pintar.js';
import { renderInvitado, renderLinkRoto, carruselDeInvitado } from './ui/invitado.js';
import { renderCocina } from './ui/cocina.js';
import { rutaDeInvitado } from './ui/router.js';
import { crearVisorControl } from './visor-control.js';
import { decodificar } from './link-receta.js';
import { resueltaSinFotosDeDrive } from './fotos-receta.js';
import { crearControlCocina } from './cocina-control.js';
import { crearNavegacion } from './navegacion.js';
import type { Receta } from './tipos.js';

// `ver-foto-receta` y `cerrar-visor` llegan por `fichaCabecera`/`fichasDelCuerpo`
// y por el visor, que comparte con la receta: acá abren y cierran el visor de
// las fotos que viajaron en el link, y nada más. Las dos flechas son las del
// carrusel de fotos de la primera ficha, y sólo lo desplazan.
export const ACCIONES_DE_INVITADO = [
  'cocinar', 'volver-receta', 'conmutar', 'paso', 'wake', 'ver-foto-receta', 'cerrar-visor',
  'carrusel-izq', 'carrusel-der'
] as const;

export function iniciarInvitado(): void {
  const cocina = crearControlCocina();
  const nav = crearNavegacion({ location, history });
  nav.arrancar();
  /**
   * La receta decodificada, por carga: los redibujados no vuelven a
   * descomprimir. `cruda` es la del link, con sus `foto:N`: es sobre esa que
   * se calcula el uso de cada foto. `receta` es la misma ya resuelta y sin
   * nada de Drive, que es lo que se dibuja.
   */
  let leida: { carga: string; cruda: Receta; receta: Receta; categoria: string } | null = null;
  let vistaAnterior: 'lectura' | 'cocina' | null = null;
  /** El visor de fotos. Sólo en la lectura: en la cocina un toque marca el paso. */
  const visor = crearVisorControl(nav);

  /**
   * Abre el visor con lo que se tocó: una foto del carrusel desliza entre
   * las del carrusel; la portada —que nunca está ahí— se abre sola.
   */
  function abrirVisor(marca: string | undefined): void {
    if (!leida) return;
    const carrusel = carruselDeInvitado(leida.cruda);
    const n = marca === undefined ? undefined : Number(marca);
    const sola = (n === undefined ? undefined : leida.receta.fotos.find(f => f.n === n)?.url) ?? leida.receta.foto;
    visor.abrir(carrusel, n, sola ?? undefined);
  }

  async function render(): Promise<void> {
    const ruta = rutaDeInvitado(location.hash);
    // Un hash de la app (el chevron del navegador, un link `#/r/…`) no recarga
    // solo, y este controlador no sabe dibujarlo: recargar deja que `inicio.ts`
    // vuelva a decidir y cargue la app.
    if (!ruta) { location.reload(); return; }
    if (leida?.carga !== ruta.carga) {
      const datos = await decodificar(ruta.carga);
      // Sin fotos de Drive desde el arranque: ni la lectura, ni la
      // cocina, ni el visor tienen después nada que pedirle a Drive.
      leida = datos
        ? { carga: ruta.carga, ...datos, cruda: datos.receta, receta: resueltaSinFotosDeDrive(datos.receta) }
        : null;
      visor.olvidar();
    }
    if (!leida) {
      document.title = 'Recetario';
      return pintar(renderLinkRoto());
    }
    document.title = leida.receta.titulo ?? 'Recetario';
    if (ruta.vista !== vistaAnterior) {
      // Pantalla nueva: arriba de todo, y la cocina desde el principio (C03.2.4).
      cocina.reiniciar();
      window.scrollTo?.(0, 0);
      vistaAnterior = ruta.vista;
      visor.olvidar();
    }
    if (ruta.vista === 'lectura') {
      // La cruda: `renderInvitado` resuelve y limpia, y necesita las `foto:N`
      // para saber cuáles están ubicadas y cuáles van al carrusel.
      return pintar(renderInvitado({ receta: leida.cruda, categoria: leida.categoria, ...(visor.estado ? { visor: visor.estado } : {}) }));
    }
    return pintar(renderCocina({ receta: leida.receta, ...cocina.estado(), salidas: 'solo-volver' }));
  }

  const app = document.querySelector('#app');

  app?.addEventListener('click', async (e) => {
    const boton = conClosest(e.target)?.closest<HTMLElement>('[data-accion]') ?? null;
    if (!boton || !leida) return;
    const accion = boton.dataset['accion'];
    const lectura = `#/ver?r=${leida.carga}`;

    if (accion === 'cocinar') {
      nav.ir(`#/ver/cocinar?r=${leida.carga}`);
      return;
    }
    if (accion === 'volver-receta') return cocina.volverALectura(nav, lectura);
    if (accion === 'conmutar') {
      const volverA = cocina.conmutar(boton.dataset['posicion'], window.scrollY);
      if (volverA === null) return;
      await render();
      window.scrollTo?.(0, volverA);
      return;
    }
    if (accion === 'paso') {
      if (cocina.marcarPaso(boton.dataset['paso'])) await render();
      return;
    }
    if (accion === 'wake') {
      await cocina.alternarPantalla();
      await render();
      return;
    }
    // Las fotos que viajaron en el link: la cabecera y las del carrusel
    // abren el visor, y se cierra tocando en cualquier parte.
    if (accion === 'ver-foto-receta') {
      abrirVisor(boton.dataset['n']);
      return render();
    }
    if (accion === 'carrusel-izq' || accion === 'carrusel-der') {
      desplazarCarrusel(boton, accion);
      return;
    }
    if (accion === 'cerrar-visor') {
      if (visor.tocar()) return render();
      return;
    }
  });

  // El único gesto del invitado: con el visor abierto, el dedo pasa de una
  // foto a la siguiente. La foto cambia de una vez, al soltar.
  app?.addEventListener('touchstart', (e) => {
    const toques = (e as TouchEvent).touches;
    const toque = toques[0];
    visor.empezarToque(toque && toques.length === 1 ? toque.clientX : null);
  }, { passive: true });

  app?.addEventListener('touchend', (e) => {
    if (visor.terminarToque((e as TouchEvent).changedTouches[0]?.clientX ?? null)) void render();
  });

  window.addEventListener('hashchange', () => { nav.numerar(); void render(); });
  // El atrás que cierra el visor no cambia el hash: llega sólo como `popstate`.
  nav.alCerrarCapa(() => { visor.olvidar(); void render(); });
  window.addEventListener('popstate', () => { nav.alPopstate(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const sol = document.querySelector('[data-accion="wake"].on');
    if (cocina.necesitaRepedir(!!sol)) void cocina.mantenerPantalla().then(render);
  });

  void render();
}
