import './ui/tokens.css';
import './ui/app.css';
import { crearAuth } from './auth.js';
import { crearDrive } from './drive.js';
import { crearSheets } from './sheets.js';
import { abrirCache } from './cache.js';
import { crearStore } from './store.js';
import { parse } from './recipe.js';
import { crearRouter, parsearHash } from './ui/router.js';
import { escapar } from './ui/markdown.js';
import { renderHome } from './ui/home.js';
import { renderLista } from './ui/lista.js';
import { renderDetalle } from './ui/detalle.js';
import { renderEditor, recetaDesdeFormulario } from './ui/editor.js';
import { renderVisor } from './ui/visor.js';
import type { Ruta } from './ui/router.js';
import type { DatosFormulario } from './ui/editor.js';
import type { Receta } from './tipos.js';
import type { ResultadoArranque } from './store.js';

type Store = ReturnType<typeof crearStore>;

const app = document.querySelector('#app');
if (!app) throw new Error('Falta #app en el documento');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());

let store: Store;
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
let ingredientesPlegados = false;  // la barra pegajosa del detalle
let vaciasVisibles = false;        // las categorías en cero, plegadas en el home
let wakeLock: WakeLockSentinel | null = null;  // para que la pantalla no se apague cocinando
let pendienteFlush: ReturnType<typeof setTimeout> | undefined;
let tagsActivos: string[] = [];   // filtro de la vista de categoría; se limpia al cambiar de vista
let fotosVisor: string[] | null = null;  // fotos de la receta abierta; null = visor cerrado
let indiceVisor = 0;

/**
 * Estrecha el destino de un evento a algo con `closest`.
 *
 * Va por capacidad y no por `instanceof Element` a propósito: los tests corren
 * en Node contra un DOM mínimo escrito a mano, donde `Element` no existe como
 * global. Chequear la clase ataría el código de producción a que el entorno de
 * test cargue un DOM completo, que es justo lo que este proyecto no hace.
 */
const conClosest = (t: EventTarget | null): Element | null =>
  t && typeof (t as Element).closest === 'function' ? t as Element : null;

/** El mensaje de un error desconocido, sin asumir que es un Error. */
const mensajeDe = (e: unknown): string => e instanceof Error ? e.message : String(e);

/**
 * Las categorías sólo existen cuando el arranque llegó a 'listo'. Antes esto
 * se leía como `estadoArranque.categorias` a secas: en cualquier otro estado
 * daba undefined y el editor dibujaba un selector de carpeta vacío, sin decir
 * por qué.
 */
const categoriasDelArranque = () =>
  estadoArranque?.estado === 'listo' ? estadoArranque.categorias : [];

const pintar = (html: string): void => { app.innerHTML = html; };

/** Agrega o saca el visor del final de #app, sin tocar el resto del contenido (§7.2: no pierde el scroll del detalle). */
function pintarVisor(): void {
  document.querySelector('.visor')?.remove();
  if (fotosVisor) app!.insertAdjacentHTML('beforeend', renderVisor({ fotos: fotosVisor, indice: indiceVisor }));
}

function abrirVisor(fotos: string[], indice: number): void {
  fotosVisor = fotos;
  indiceVisor = indice;
  pintarVisor();
}

function cerrarVisor() {
  fotosVisor = null;
  pintarVisor();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fotosVisor) return cerrarVisor();
  if (e.key === 'Escape') { const m = document.querySelector<HTMLElement>('.menu'); if (m) m.hidden = true; }
});

/**
 * Que la pantalla no se apague mientras se cocina: es la fricción más real de
 * seguir una receta con las manos sucias. El bloqueo se pierde solo cuando la
 * app pasa a segundo plano, así que hay que volver a pedirlo al volver — sin
 * eso, alcanza con atender un mensaje para que la pantalla se apague de nuevo.
 */
async function mantenerPantalla(): Promise<boolean> {
  if (!navigator.wakeLock) return false;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
    return true;
  } catch {
    wakeLock = null;
    return false;
  }
}

async function soltarPantalla(): Promise<void> {
  try { await wakeLock?.release(); } catch { /* ya soltado */ }
  wakeLock = null;
}

function programarFlush() {
  clearTimeout(pendienteFlush);
  pendienteFlush = setTimeout(() => store.flush().catch(console.error), 30000);
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Si el botón sigue activo, el usuario nunca lo apagó: el bloqueo se
    // perdió al irse a segundo plano y hay que volver a pedirlo.
    const b = document.querySelector<HTMLElement>('[data-accion="pantalla"][aria-pressed="true"]');
    if (b && !wakeLock) mantenerPantalla().then(ok => b.setAttribute('aria-pressed', String(ok)));
    return;
  }
  if (document.visibilityState !== 'hidden') return;
  // Cancelar el debounce antes del flush forzado: si no, y el timer de 30s
  // vencía justo mientras este flush estaba en vuelo, corrían los dos en
  // paralelo y la escritura de fila (que no es atómica) podía duplicar la
  // fila de la misma receta en el índice.
  clearTimeout(pendienteFlush);
  store?.flush().catch(console.error);
});

async function arrancar() {
  pintar('<p class="contenido">Conectando…</p>');
  try {
    // Vía silenciosa primero: es la misma que usa auth.token() para renovar
    // (pedir('') con la sesión en frío). Para una app que se abre a diario,
    // pedir el consentimiento explícito en cada arranque es un popup por
    // apertura; solo corresponde mostrarlo si la vía silenciosa falla —sin
    // sesión previa, o con el permiso revocado.
    await auth.token();
  } catch {
    await auth.conectar();
  }
  store = crearStore({ drive, sheets, cache: await abrirCache() });
  estadoArranque = await store.arrancar();

  if (estadoArranque.estado === 'falta-estructura') {
    return pintar('<p class="contenido">No encontré la carpeta <b>Recetario</b> en tu Drive. Ver <code>SETUP.md</code>.</p>');
  }
  if (estadoArranque.estado === 'elegir-carpeta') {
    return pintar('<p class="contenido">Hay más de una carpeta llamada Recetario. Dejá una sola y recargá.</p>');
  }
  if (estadoArranque.estado === 'solo-lectura') {
    const motivo = estadoArranque.motivo ? `: ${escapar(estadoArranque.motivo)}` : '.';
    return pintar(`<p class="contenido">No pude conectar con Drive${motivo} Quedás en modo solo lectura. <button data-accion="reconectar">Reintentar</button></p>`);
  }

  await store.cargarIndice();
  if (estadoArranque.reconstruir) await reconstruir();
  else store.sync().then(() => render()).catch(console.error);

  router.iniciar();
}

async function reconstruir() {
  pintar('<p class="contenido">Reconstruyendo el índice… <span data-progreso>0</span></p>');
  await store.reconstruir(({ leidas, total }) => {
    const el = document.querySelector('[data-progreso]');
    if (el) el.textContent = `${leidas} / ${total}`;
  });
  render();
}

async function render(ruta: Ruta = parsearHash(location.hash)): Promise<void> {
  // Cambiar de categoría o de vista limpia el filtro de tags y cierra el visor:
  // si no, se entra a otra categoría y no se ve nada porque quedó filtrando
  // por un tag que ahí no existe, sin forma de darse cuenta.
  if (!vistaActual || ruta.vista !== vistaActual.vista || ruta.params.nombre !== vistaActual.params.nombre
      || ruta.params.id !== vistaActual.params.id) {
    tagsActivos = [];
    fotosVisor = null;
    // Lo que se plegó vale para la receta que se estaba mirando, no para la
    // próxima: sin esto se entra a otra receta y los ingredientes ya vienen
    // cerrados sin que nadie los haya cerrado.
    ingredientesPlegados = false;
  }
  vistaActual = ruta;
  if (ruta.vista === 'home') {
    return pintar(renderHome({ categorias: store.categoriasConConteo(), ultimaReconstruccion: store.ultimaReconstruccion(), vaciasVisibles }));
  }
  if (ruta.vista === 'categoria') {
    const nombre = ruta.params['nombre'] ?? '';
    const entradas = store.buscar({ categoria: nombre, tags: tagsActivos });
    const vacio = tagsActivos.length
      ? { titulo: 'Ninguna receta con esos tags', detalle: 'Probá sacando alguno de los filtros de arriba.' }
      : { titulo: 'Todavía no hay nada acá',
          detalle: `Las recetas entran como archivos .md en la carpeta ${nombre} de Drive, casi siempre escritas por un agente desde un PDF, una foto o un video.` };
    return pintar(renderLista({ titulo: nombre, entradas, tags: store.tagsDe(nombre), tagsActivos, vacio }));
  }
  if (ruta.vista === 'buscar') {
    const q = ruta.params['q'] ?? '';
    const grupos = store.buscarPorTexto(q);
    return pintar(renderLista({ titulo: `"${q}"`, grupos,
      vacio: { titulo: 'Sin resultados', detalle: 'Se busca por título y por ingrediente.' } }));
  }
  if (ruta.vista === 'detalle') {
    const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
    return pintar(renderDetalle({ entrada, receta, ingredientesPlegados }));
  }
  if (ruta.vista === 'editar') {
    const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
    return pintar(renderEditor({ entrada, receta, categorias: categoriasDelArranque(), tagsConocidos: store.tagsDe().map(t => t.tag) }));
  }
  if (ruta.vista === 'nueva') {
    // El mismo formulario que editar, sin entrada (todavía no hay archivo
    // en Drive) y con una receta vacía en vez de una leída. Guardar es lo
    // que de verdad la crea (§11: "crear una receta mínima").
    return pintar(renderEditor({ entrada: null, receta: parse(''), categorias: categoriasDelArranque(), tagsConocidos: store.tagsDe().map(t => t.tag) }));
  }
}

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const boton = destino?.closest<HTMLElement>('[data-accion], .check, [data-tag], img') ?? null;

  // El menú del home se cierra al tocar cualquier otra cosa, como cualquier
  // desplegable. Sin esto solo se cerraba volviendo a tocar el ⋯.
  const menu = document.querySelector<HTMLElement>('.menu');
  if (menu && !menu.hidden && !destino?.closest('.menu') && boton?.dataset['accion'] !== 'menu') {
    menu.hidden = true;
  }
  if (!boton) return;

  if (boton.classList.contains('check')) {
    const marcado = boton.getAttribute('aria-pressed') === 'true';
    boton.setAttribute('aria-pressed', String(!marcado));
    return;
  }

  if (boton.dataset['tag']) {
    const tag = boton.dataset['tag'];
    tagsActivos = tagsActivos.includes(tag) ? tagsActivos.filter(t => t !== tag) : [...tagsActivos, tag];
    return render();
  }

  if (boton.tagName === 'IMG') {
    // Las imágenes del cuerpo son las únicas fotos de la receta: tocar
    // cualquiera abre el visor (§7.2).
    const fotos = [...document.querySelectorAll<HTMLImageElement>('#app [data-cuerpo] img')];
    const indice = fotos.indexOf(boton as HTMLImageElement);
    if (indice === -1) return;
    return abrirVisor(fotos.map(img => img.src), indice);
  }

  const accion = boton.dataset['accion'];
  if (accion === 'ingredientes') { ingredientesPlegados = !ingredientesPlegados; return render(); }
  if (accion === 'vacias') { vaciasVisibles = !vaciasVisibles; return render(); }

  // Las dos mitades que resolvería un modo cocina, sin pantalla nueva (§7.2).
  if (accion === 'texto-grande') {
    const activo = document.documentElement.classList.toggle('texto-grande');
    boton.setAttribute('aria-pressed', String(activo));
    return;
  }
  if (accion === 'pantalla') {
    const activo = boton.getAttribute('aria-pressed') === 'true';
    if (activo) { await soltarPantalla(); boton.setAttribute('aria-pressed', 'false'); return; }
    const ok = await mantenerPantalla();
    boton.setAttribute('aria-pressed', String(ok));
    if (!ok) alert('Este navegador no deja mantener la pantalla encendida.');
    return;
  }

  if (accion === 'atras') return history.back();
  if (accion === 'editar') { location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/editar`; return; }
  if (accion === 'cancelar') return history.back();
  if (accion === 'reconstruir') return reconstruir();
  if (accion === 'reconectar') {
    try {
      // Si el arranque nunca llegó a "listo" (solo-lectura), reintentar todo
      // el arranque en vez de solo renovar el token: el store todavía no
      // tiene categorías ni índice cargados.
      if (estadoArranque?.estado !== 'listo') { await arrancar(); return; }
      await auth.conectar();
      return render();
    } catch (err) {
      console.error(err);
      return alert(`No se pudo reconectar con Google: ${mensajeDe(err)}. Probá de nuevo.`);
    }
  }
  if (accion === 'menu') return document.querySelector('.menu')?.toggleAttribute('hidden');
  if (accion === 'cerrar-visor') return cerrarVisor();
  if (accion === 'foto-anterior') { indiceVisor = Math.max(0, indiceVisor - 1); return pintarVisor(); }
  if (accion === 'foto-siguiente') { indiceVisor = Math.min((fotosVisor?.length ?? 1) - 1, indiceVisor + 1); return pintarVisor(); }

  if (accion === 'guardar') {
    const form = document.querySelector<HTMLFormElement>('[data-formulario]');
    if (!form) return;
    // FormData da string | File; los campos del editor son todos de texto, y
    // un File acá sería un campo que alguien agregó sin pasar por el editor.
    const datos: DatosFormulario = Object.fromEntries(
      [...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v : undefined])
    );

    if (vistaActual?.vista === 'nueva') {
      const nueva = recetaDesdeFormulario(datos, parse('')) as Receta;
      if (!nueva.titulo) return alert('Ponele un título a la receta antes de guardar.');
      try {
        await store.crear(nueva, { carpetaId: datos['carpeta'] || undefined });
        programarFlush();
        return history.back();
      } catch (err) {
        console.error(err);
        return alert(`No se pudo crear la receta en Drive: ${mensajeDe(err)}. Probá de nuevo.`);
      }
    }

    const id = vistaActual?.params['id'] ?? '';
    try {
      const { receta } = await store.receta(id);
      const nueva = recetaDesdeFormulario(datos, receta) as Receta;
      const r = await store.guardar(id, nueva, { carpetaDestino: datos['carpeta'] });
      if (!r.ok) return alert('La receta cambió en Drive desde que la abriste. Recargá antes de guardar.');
      programarFlush();
      return history.back();
    } catch (err) {
      console.error(err);
      return alert(`No se pudo guardar en Drive: ${mensajeDe(err)}. El cambio puede no haberse guardado — probá de nuevo antes de salir de la receta.`);
    }
  }

  if (accion === 'borrar') {
    if (!confirm('¿Borrar esta receta?')) return;
    try {
      await store.borrar(vistaActual?.params['id'] ?? '');
      programarFlush();
      location.hash = '#/';
      return;
    } catch (err) {
      console.error(err);
      return alert(`No se pudo borrar en Drive: ${mensajeDe(err)}. La receta puede seguir estando ahí — probá de nuevo.`);
    }
  }
});

app.addEventListener('change', (e) => {
  // Mismo motivo que en `conClosest`: nada de instanceof contra globales del
  // navegador, que en los tests no existen.
  const campo = e.target as HTMLInputElement | null;
  if (campo?.dataset?.['accion'] === 'buscar') {
    location.hash = `#/buscar?q=${encodeURIComponent(campo.value)}`;
  }
});

arrancar().catch(err => pintar(`<p class="contenido">No pude arrancar: ${escapar(mensajeDe(err))} <button data-accion="reconectar">Reintentar</button></p>`));

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
