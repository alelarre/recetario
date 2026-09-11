import './ui/tokens.css';
import './ui/base.css';
import { crearAuth } from './auth.js';
import { crearDrive } from './drive.js';
import { crearSheets } from './sheets.js';
import { crearStore } from './store.js';
import { parse } from './recipe.js';
import { crearRouter, parsearHash } from './ui/router.js';
import { escapar } from './ui/markdown.js';
import { renderRecetario } from './ui/recetario.js';
import { renderCategoria } from './ui/categoria.js';
import { renderResultados } from './ui/resultados.js';
import { renderReceta } from './ui/receta.js';
import { renderCocina } from './ui/cocina.js';
import { renderEditor, recetaDesdeFormulario } from './ui/editor.js';
import { crearBorradores } from './borradores.js';
import { renderBorradores, renderBorrador } from './ui/borradores.js';
import { renderCaptura } from './ui/captura.js';
import { renderAjustes } from './ui/ajustes.js';
import { renderConexion } from './ui/conexion.js';
import { aviso } from './ui/componentes.js';
import { convertirBorrador } from './compartido.js';
import type { Borradores } from './borradores.js';
import type { Ruta } from './ui/router.js';
import type { DatosFormulario } from './ui/editor.js';
import type { PosicionCocina } from './ui/cocina.js';
import type { ResultadoArranque, Progreso } from './store.js';

type Store = ReturnType<typeof crearStore>;

const app = document.querySelector('#app');
if (!app) throw new Error('Falta #app en el documento');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());

let store: Store;
let borradores: Borradores | null = null;
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
let vaciasVisibles = false;        // las categorías en cero, plegadas en el home
let wakeLock: WakeLockSentinel | null = null;  // para que la pantalla no se apague cocinando
let tagsActivos: string[] = [];   // filtro de la vista de categoría; se limpia al cambiar de vista

/**
 * Cuántas tarjetas dibuja la categoría. El tramo no es una lectura de red —el
 * índice ya está entero en memoria—: es cuántas se dibujan de una vez.
 */
const TRAMO = 30;
let visibles = TRAMO;
let observadorTramo: IntersectionObserver | null = null;

/**
 * El estado del modo cocina. Se limpia al entrar: al volver a abrir una receta
 * no hay ningún paso realzado ni marcado (C03.2.4). No persiste en ningún lado.
 */
/** El borrador que se está por descartar pide confirmación antes (C01.6.2). */
let confirmandoDescarte = false;
/** El título del borrador se corrige en su lugar (C01.6.1). */
let editandoTitulo = false;

/** La captura: lo escrito sobrevive al error y a la reautenticación (R3). */
/** Lo que el reindexado dejó afuera, para la sección de avisos de Ajustes. */
let ignorados: string[] = [];
/** El mail de la cuenta conectada. Se pide una vez, al entrar a Ajustes. */
let cuenta = '';
/** El progreso del reindexado en curso, o `null`. Mientras corre no se guarda ni se borra. */
let reindexando: Progreso | null = null;

let tituloCaptura = '';
let guardandoCaptura = false;
let errorCaptura = '';

let posicionCocina: PosicionCocina = 'ingredientes';
let pasoAqui: number | null = null;
let pasosHechos: number[] = [];
/** El scroll de cada lado del conmutador, para no perderlo al conmutar (C03.2.2). */
const scrollCocina: Record<PosicionCocina, number> = { ingredientes: 0, pasos: 0 };

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

document.addEventListener('keydown', (e) => {
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

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  // Si el botón sigue activo, el usuario nunca lo apagó: el bloqueo se
  // perdió al irse a segundo plano y hay que volver a pedirlo.
  const b = document.querySelector<HTMLElement>('[data-accion="wake"].prim');
  if (b && !wakeLock) void mantenerPantalla().then(() => render());
});

async function arrancar() {
  pintar(renderConexion({ estado: 'conectando' }));
  try {
    // Vía silenciosa primero: es la misma que usa auth.token() para renovar
    // (pedir('') con la sesión en frío). Para una app que se abre a diario,
    // pedir el consentimiento explícito en cada arranque es un popup por
    // apertura; solo corresponde mostrarlo si la vía silenciosa falla —sin
    // sesión previa, o con el permiso revocado.
    await auth.token();
  } catch {
    try {
      await auth.conectar();
    } catch (err) {
      console.error(err);
      // Cancelado o denegado: nunca se queda en «Conectando…» (C05.9.2).
      return pintar(renderConexion({ estado: 'cancelado' }));
    }
  }
  store = crearStore({ drive, sheets });
  estadoArranque = await store.arrancar();

  // Los tres estados que no llegan a 'listo' avisan en castellano, con su
  // control: ninguno muestra el mensaje crudo de Google (R1).
  if (estadoArranque.estado === 'falta-estructura') {
    return pintar('<div class="cuerpo">' + aviso({
      texto: 'No encontré la carpeta Recetario en tu Drive. Está en SETUP.md cómo crearla.',
      accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
    }) + '</div>');
  }
  if (estadoArranque.estado === 'elegir-carpeta') {
    return pintar('<div class="cuerpo">' + aviso({
      texto: 'Hay más de una carpeta llamada Recetario en tu Drive. Dejá una sola y volvé a entrar.',
      accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
    }) + '</div>');
  }
  if (estadoArranque.estado === 'solo-lectura') {
    return pintar('<div class="cuerpo">' + aviso({
      texto: 'No pude conectar con Drive. Sin esa lectura no hay con qué dibujar.',
      accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
    }) + '</div>');
  }

  // Los borradores viven en su propia planilla, al lado del índice, y recién
  // acá se conoce la carpeta raíz.
  borradores = crearBorradores({ drive, sheets, raizId: estadoArranque.raizId });

  await store.cargarIndice();
  if (estadoArranque.reconstruir) await reconstruir();

  router.iniciar();
}

/**
 * Reindexar lee todos los `.md` y rearma la planilla: es la reparación
 * universal. No se puede cancelar —cortar a mitad deja el índice en el estado
 * que el reindexado existe para reparar— y mientras corre no se guarda ni se
 * borra nada (C05.5.2).
 */
async function reconstruir({ enAjustes = false } = {}) {
  reindexando = { leidas: 0, total: 0 };
  const dibujar = () => enAjustes
    ? pintar(renderAjustes({
        cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados, reindexando
      }))
    : pintar(renderConexion({ estado: 'creando-indice', ...(reindexando ? { progreso: reindexando } : {}) }));

  dibujar();
  try {
    const r = await store.reconstruir(progreso => { reindexando = progreso; dibujar(); });
    ignorados = r.ignorados;
  } finally {
    reindexando = null;
  }
  await render();
}

/**
 * El tramo siguiente se dibuja cuando el spinner del final entra en pantalla.
 * `IntersectionObserver` no existe en Node, donde corren los tests: se
 * pregunta antes, igual que el resto del código hace con `navigator`.
 */
function observarTramo(): void {
  observadorTramo?.disconnect();
  observadorTramo = null;
  if (typeof IntersectionObserver === 'undefined') return;
  const spin = document.querySelector('#app .spin');
  if (!spin) return;
  observadorTramo = new IntersectionObserver(entradas => {
    if (!entradas.some(e => e.isIntersecting)) return;
    visibles += TRAMO;
    void render();
  });
  observadorTramo.observe(spin);
}

async function render(ruta: Ruta = parsearHash(location.hash)): Promise<void> {
  // Cambiar de categoría o de vista limpia el filtro de tags:
  // si no, se entra a otra categoría y no se ve nada porque quedó filtrando
  // por un tag que ahí no existe, sin forma de darse cuenta.
  if (!vistaActual || ruta.vista !== vistaActual.vista || ruta.params.nombre !== vistaActual.params.nombre
      || ruta.params.id !== vistaActual.params.id) {
    tagsActivos = [];
    visibles = TRAMO;
    confirmandoDescarte = false;
    editandoTitulo = false;
    if (ruta.vista !== 'capturar') { tituloCaptura = ''; guardandoCaptura = false; errorCaptura = ''; }
    posicionCocina = 'ingredientes';
    pasoAqui = null;
    pasosHechos = [];
    scrollCocina.ingredientes = scrollCocina.pasos = 0;
  }
  vistaActual = ruta;
  if (ruta.vista === 'recetario') {
    // El cableado entero de main es de la Tarea 22; acá solo se cambia la vista.
    return pintar(renderRecetario({ categorias: store.categoriasConConteo(), borradores: 0 }));
  }
  if (ruta.vista === 'categoria') {
    const nombre = ruta.params['nombre'] ?? '';
    const entradas = store.buscar({ categoria: nombre, tags: tagsActivos });
    pintar(renderCategoria({
      nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
      visibles: Math.min(visibles, entradas.length), tagsActivos
    }));
    return observarTramo();
  }
  if (ruta.vista === 'resultados') {
    const q = ruta.params['q'] ?? '';
    return pintar(renderResultados({ consulta: q, grupos: store.buscarPorTexto(q) }));
  }
  if (ruta.vista === 'receta') {
    const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
    return pintar(renderReceta({ entrada, receta }));
  }
  if (ruta.vista === 'cocinar') {
    const { receta } = await store.receta(ruta.params['id'] ?? '');
    return pintar(renderCocina({
      receta, posicion: posicionCocina, aqui: pasoAqui, hechos: pasosHechos, wakeActivo: !!wakeLock
    }));
  }
  if (ruta.vista === 'ajustes') {
    // El mail no lo guarda nadie: se lo pide a Drive una vez. Que falle no
    // rompe la pantalla, solo deja la línea de la cuenta vacía.
    if (!cuenta) cuenta = await drive.cuenta().catch(() => '');
    return pintar(renderAjustes({
      cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados, reindexando
    }));
  }
  if (ruta.vista === 'capturar') {
    // La captura no dibuja la app: es una pantalla efímera sobre lo que el
    // usuario estaba haciendo en otra app (C01.2.2).
    const fuente = ruta.params['url'] || ruta.params['text'] || '';
    return pintar(renderCaptura({
      fuente, titulo: tituloCaptura, guardando: guardandoCaptura,
      ...(errorCaptura ? { error: errorCaptura } : {})
    }));
  }
  if (ruta.vista === 'borradores') {
    try {
      return pintar(renderBorradores({ borradores: await borradores?.listar() ?? [] }));
    } catch (err) {
      console.error(err);
      // Sin la lectura no hay con qué dibujar: se avisa, no se inventa (C05.8.1).
      return pintar(renderBorradores({ borradores: [], error: 'No se pudieron leer los borradores.' }));
    }
  }
  if (ruta.vista === 'borrador') {
    const id = ruta.params['id'] ?? '';
    try {
      const borrador = (await borradores?.listar() ?? []).find(b => b.id === id);
      if (!borrador) return pintar(renderBorradores({ borradores: await borradores?.listar() ?? [] }));
      return pintar(renderBorrador({ borrador, confirmando: confirmandoDescarte, editando: editandoTitulo }));
    } catch (err) {
      console.error(err);
      return pintar(renderBorradores({ borradores: [], error: 'No se pudo leer el borrador.' }));
    }
  }
  if (ruta.vista === 'editar') {
    const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
    return pintar(renderEditor({ entrada, receta, categorias: categoriasDelArranque(), tagsConocidos: store.tagsDe().map(t => t.tag) }));
  }
  if (ruta.vista === 'nueva') {
    // El mismo formulario que editar, sin entrada (todavía no hay archivo en
    // Drive) y con una receta vacía en vez de una leída. Desde un borrador
    // abre con el título y la fuente cargados (C04.3b.1); guardar es lo que
    // de verdad la crea, y ahí se borra el borrador (C01.7.1).
    const receta = parse('');
    const borradorId = ruta.params['borrador'] ?? '';
    if (borradorId) {
      const borrador = (await borradores?.listar() ?? []).find(b => b.id === borradorId);
      if (borrador) {
        receta.titulo = borrador.titulo;
        receta.fuente = borrador.fuente || null;
      }
    }
    return pintar(renderEditor({ entrada: null, receta, categorias: categoriasDelArranque(), tagsConocidos: store.tagsDe().map(t => t.tag) }));
  }
}

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const boton = destino?.closest<HTMLElement>('[data-accion], .check, [data-tag]') ?? null;

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

  const accion = boton.dataset['accion'];
  if (accion === 'vacias') { vaciasVisibles = !vaciasVisibles; return render(); }

  // Las dos mitades que resolvería un modo cocina, sin pantalla nueva (§7.2).
  if (accion === 'texto-grande') {
    const activo = document.documentElement.classList.toggle('texto-grande');
    boton.setAttribute('aria-pressed', String(activo));
    return;
  }

  if (accion === 'cocinar') { location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/cocinar`; return; }
  if (accion === 'salir-cocina') { await soltarPantalla(); return history.back(); }
  if (accion === 'conmutar') {
    const destinoPos = boton.dataset['posicion'] === 'pasos' ? 'pasos' : 'ingredientes';
    if (destinoPos === posicionCocina) return;
    scrollCocina[posicionCocina] = window.scrollY;
    posicionCocina = destinoPos;
    await render();
    window.scrollTo(0, scrollCocina[destinoPos]);
    return;
  }
  if (accion === 'paso') {
    // Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
    // hecho y el hilo sigue al siguiente.
    const n = Number(boton.dataset['paso'] ?? -1);
    if (!Number.isInteger(n) || n < 0) return;
    if (pasoAqui === n) {
      pasosHechos = [...pasosHechos.filter(p => p !== n), n];
      pasoAqui = n + 1;
    } else {
      pasoAqui = n;
      pasosHechos = pasosHechos.filter(p => p !== n);
    }
    return render();
  }
  if (accion === 'wake') {
    if (wakeLock) await soltarPantalla();
    else await mantenerPantalla();
    return render();
  }

  if (accion === 'borradores') { location.hash = '#/borradores'; return; }
  if (accion === 'ajustes') { location.hash = '#/ajustes'; return; }
  if (accion === 'reindexar') return reconstruir({ enAjustes: true });
  if (accion === 'conectar') return arrancar();
  if (accion === 'salir') {
    auth.olvidar();
    cuenta = '';
    location.hash = '#/';
    return pintar(renderConexion({ estado: 'inicial' }));
  }
  if (accion === 'crear-receta') {
    location.hash = `#/nueva?borrador=${encodeURIComponent(vistaActual?.params['id'] ?? '')}`;
    return;
  }
  if (accion === 'descartar') { confirmandoDescarte = true; return render(); }
  if (accion === 'cancelar-descarte') { confirmandoDescarte = false; return render(); }
  if (accion === 'descartar-confirmado') {
    const id = vistaActual?.params['id'] ?? '';
    try {
      await borradores?.descartar(id);
      location.hash = '#/borradores';
      return;
    } catch (err) {
      console.error(err);
      const borrador = (await borradores?.listar() ?? []).find(b => b.id === id);
      if (!borrador) return;
      return pintar(renderBorrador({ borrador, confirmando: true, error: 'No se pudo descartar.' }));
    }
  }
  if (accion === 'agregar-borrador') { location.hash = '#/capturar'; return; }
  if (accion === 'cancelar-captura') {
    // Cerrar sin escribir nada y sin preguntar: no hay nada que perder todavía.
    tituloCaptura = '';
    window.close();
    return;
  }
  if (accion === 'guardar-captura') {
    const campoTitulo = document.querySelector<HTMLInputElement>('input[name="titulo"]');
    const campoFuente = document.querySelector<HTMLInputElement>('input[name="fuente"]');
    tituloCaptura = campoTitulo?.value.trim() ?? '';
    if (!tituloCaptura) return;
    const fuente = campoFuente?.value.trim()
      ?? vistaActual?.params['url'] ?? vistaActual?.params['text'] ?? '';

    guardandoCaptura = true;
    errorCaptura = '';
    await render();
    try {
      await borradores?.agregar({ titulo: tituloCaptura, fuente });
    } catch (err) {
      console.error(err);
      // Nada queda esperando: el texto sigue en pantalla y se reintenta a mano.
      guardandoCaptura = false;
      errorCaptura = 'No se pudo guardar. Revisá la conexión.';
      return render();
    }
    guardandoCaptura = false;
    tituloCaptura = '';
    // Volver a donde estabas, con Recetario sin quedar abierto (C01.2.2). Si
    // la pestaña no la abrió un script, `close()` no hace nada: ahí queda la
    // lista, que es el lugar donde el borrador nuevo está.
    window.close();
    location.hash = '#/borradores';
    return;
  }
  if (accion === 'editar-titulo') { editandoTitulo = true; return render(); }
  if (accion === 'cancelar-titulo') { editandoTitulo = false; return render(); }
  if (accion === 'guardar-titulo') {
    const campo = document.querySelector<HTMLInputElement>('input[name="titulo"]');
    const titulo = campo?.value.trim() ?? '';
    const id = vistaActual?.params['id'] ?? '';
    if (!titulo) return;
    try {
      await borradores?.editarTitulo(id, titulo);
      editandoTitulo = false;
      return render();
    } catch (err) {
      console.error(err);
      const borrador = (await borradores?.listar() ?? []).find(b => b.id === id);
      if (!borrador) return;
      return pintar(renderBorrador({
        borrador: { ...borrador, titulo }, confirmando: false, editando: true,
        error: 'No se pudo guardar el título.'
      }));
    }
  }

  if (accion === 'atras') return history.back();
  if (accion === 'editar') { location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/editar`; return; }
  if (accion === 'cancelar') return history.back();
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

  if (accion === 'guardar') {
    const form = document.querySelector<HTMLFormElement>('[data-formulario]');
    if (!form) return;
    // FormData da string | File; los campos del editor son todos de texto, y
    // un File acá sería un campo que alguien agregó sin pasar por el editor.
    const datos: DatosFormulario = Object.fromEntries(
      [...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v : undefined])
    );
    const carpetaId = datos['carpeta'] || '';
    const esNueva = vistaActual?.vista === 'nueva';
    const id = vistaActual?.params['id'] ?? '';
    const borradorId = vistaActual?.params['borrador'] ?? '';

    // Mientras trabaja, el botón lo dice y no se puede tocar dos veces (C04.5.1).
    boton.setAttribute('disabled', '');
    boton.textContent = 'Guardando…';

    const base = esNueva ? parse('') : (await store.receta(id)).receta;
    const nueva = recetaDesdeFormulario(datos, base);

    /** El editor otra vez, con lo que el usuario tenía escrito y el aviso (C04.5.2). */
    const conError = (mensaje: string) => pintar(renderEditor({
      entrada: esNueva ? null : store.entradas().find(e => e.id_archivo === id) ?? null,
      receta: nueva, categorias: categoriasDelArranque(),
      tagsConocidos: store.tagsDe().map(t => t.tag), error: mensaje
    }));

    if (!nueva.titulo) return conError('Ponele un título antes de guardar.');

    try {
      if (esNueva && borradorId && borradores) {
        // Convertir es una sola operación: el .md, la fila y el borrador (C01.7.1).
        await convertirBorrador({ store, borradores }, { borradorId, receta: nueva, carpetaId });
      } else if (esNueva) {
        await store.crear(nueva, { carpetaId: carpetaId || undefined });
      } else {
        await store.guardar(id, nueva, { carpetaDestino: carpetaId });
      }
      // Nada confirma el éxito: al terminar, vuelve a la receta.
      return history.back();
    } catch (err) {
      console.error(err);
      return conError('No se pudo guardar. Revisá la conexión.');
    }
  }

  if (accion === 'borrar') {
    if (!confirm('¿Borrar esta receta?')) return;
    try {
      await store.borrar(vistaActual?.params['id'] ?? '');
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
