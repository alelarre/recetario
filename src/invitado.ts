/**
 * El controlador de la vista de invitado. No carga nada de la app: ni store,
 * ni token, ni el manejador de acciones de `main.ts`. Escucha sólo las acciones
 * de su lista; una acción nueva de la app no llega acá aunque use el mismo nombre.
 */
import { pintar, conClosest } from './ui/pintar.js';
import { renderInvitado, renderLinkRoto } from './ui/invitado.js';
import { renderCocina } from './ui/cocina.js';
import { rutaDeInvitado } from './ui/router.js';
import { decodificar } from './link-receta.js';
import { crearControlCocina } from './cocina-control.js';
import type { Receta } from './tipos.js';

// `ver-foto` puede llegar por `fichaCabecera`/`fichasDelCuerpo`, que comparte con
// la receta: no tiene manejador acá —abrir el visor del invitado es Tarea 9—,
// pero está en la lista porque el HTML compartido sí puede traerlo.
export const ACCIONES_DE_INVITADO = ['cocinar', 'volver-receta', 'conmutar', 'paso', 'wake', 'ver-foto'] as const;

export function iniciarInvitado(): void {
  const cocina = crearControlCocina();
  /** La receta decodificada, por carga: los redibujados no vuelven a descomprimir. */
  let leida: { carga: string; receta: Receta; categoria: string } | null = null;
  let vistaAnterior: 'lectura' | 'cocina' | null = null;

  async function render(): Promise<void> {
    const ruta = rutaDeInvitado(location.hash);
    // Un hash de la app (el chevron del navegador, un link `#/r/…`) no recarga
    // solo, y este controlador no sabe dibujarlo: recargar deja que `inicio.ts`
    // vuelva a decidir y cargue la app.
    if (!ruta) { location.reload(); return; }
    if (leida?.carga !== ruta.carga) {
      const datos = await decodificar(ruta.carga);
      leida = datos ? { carga: ruta.carga, ...datos } : null;
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
    }
    if (ruta.vista === 'lectura') return pintar(renderInvitado({ receta: leida.receta, categoria: leida.categoria }));
    return pintar(renderCocina({ receta: leida.receta, ...cocina.estado(), salidas: 'solo-volver' }));
  }

  document.querySelector('#app')?.addEventListener('click', async (e) => {
    const boton = conClosest(e.target)?.closest<HTMLElement>('[data-accion]') ?? null;
    if (!boton || !leida) return;
    const accion = boton.dataset['accion'];
    const lectura = `#/ver?r=${leida.carga}`;

    if (accion === 'cocinar') {
      cocina.entrarDesdeLectura();
      location.hash = `#/ver/cocinar?r=${leida.carga}`;
      return;
    }
    if (accion === 'volver-receta') {
      await cocina.soltarPantalla();
      if (cocina.salirALectura() === 'atras') return history.back();
      location.replace(lectura);
      return;
    }
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
    }
  });

  window.addEventListener('hashchange', () => { void render(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const sol = document.querySelector('[data-accion="wake"].on');
    if (cocina.necesitaRepedir(!!sol)) void cocina.mantenerPantalla().then(render);
  });

  void render();
}
