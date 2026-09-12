import './ui/tokens.css';
import './ui/base.css';
import { crearAuth } from './auth.js';
import { crearDrive } from './drive.js';
import { crearSheets } from './sheets.js';
import { crearStore } from './store.js';
import { parse } from './recipe.js';
import { tagReservado } from './catalogo.js';
import { sePuedeTerminar } from './recipe.js';
import { crearRouter, parsearHash } from './ui/router.js';
import { escapar } from './ui/markdown.js';
import { renderRecetario } from './ui/recetario.js';
import { renderCategoria } from './ui/categoria.js';
import { renderResultados } from './ui/resultados.js';
import { renderReceta } from './ui/receta.js';
import { renderCocina } from './ui/cocina.js';
import { renderEditor, recetaDesdeFormulario, pillTag, confirmacionSalida } from './ui/editor.js';
import { crearBorradores } from './borradores.js';
import { renderBorradores, renderBorrador } from './ui/borradores.js';
import { renderCaptura } from './ui/captura.js';
import { renderAjustes } from './ui/ajustes.js';
import { renderConexion } from './ui/conexion.js';
import { aviso } from './ui/componentes.js';
import { convertirBorrador } from './compartido.js';
import type { RecetaCreada } from './compartido.js';
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
/**
 * Lo que una conversión de borrador ya creó, por si hay que reintentarla
 * (C01.7.1). Vive acá y no en cada Guardar: si el borrado del borrador falla,
 * el segundo intento tiene que reescribir el `.md` que ya existe, no crear otro.
 */
const convertidos = new Map<string, RecetaCreada>();
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
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
/** El menú lateral desplegado. Sólo aplica en pantalla angosta: desde 900 px es fijo. */
let menuAbierto = false;

/** Lo que se está por descartar o borrar pide confirmación antes (C01.6.2, C04.6.1). */
let confirmandoDescarte = false;
/** El borrador se edita con el mismo formulario con el que se creó, precargado. */
let editandoBorrador = false;
/**
 * El editor abierto: su hash y cómo estaba el formulario al dibujarlo. Salir
 * con el formulario distinto pregunta antes (C04.1.1). La comparación es contra
 * esta foto, no contra el `.md` de Drive: no se lee nada para decidir.
 */
let editorAbierto: { hash: string; formulario: string } | null = null;

/** La captura: lo escrito sobrevive al error y a la reautenticación (R3). */
/** Lo que el reindexado dejó afuera, para la sección de avisos de Ajustes. */
let ignorados: string[] = [];
/** El mail de la cuenta conectada. Se pide una vez, al entrar a Ajustes. */
let cuenta = '';
/** El progreso del reindexado en curso, o `null`. Mientras corre no se guarda ni se borra. */
let reindexando: Progreso | null = null;

let tituloCaptura = '';
let notaCaptura = '';
let guardandoCaptura = false;
let errorCaptura = '';

let posicionCocina: PosicionCocina = 'ingredientes';
let pasoAqui: number | null = null;
let pasosHechos: number[] = [];
/**
 * Si al modo cocina se entró tocando «Cocinar», la receta ya está una entrada
 * atrás en el historial: volver a ella es un `back`, no una navegación nueva.
 * Con una navegación quedaba dos veces seguidas y el volver de la receta
 * parecía no hacer nada.
 */
let cocinaDesdeReceta = false;

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

/** Lo que el editor tiene escrito, como texto comparable. Los tags y la completitud viajan en campos ocultos. */
const formularioActual = (): string => {
  const form = document.querySelector<HTMLFormElement>('[data-formulario]');
  return form ? JSON.stringify([...new FormData(form)]) : '';
};

/** Recién dibujado, el editor no tiene cambios: su formulario es la foto contra la que se compara. */
const abrirEditor = (html: string): void => {
  pintar(html);
  editorAbierto = { hash: location.hash, formulario: formularioActual() };
};

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

/**
 * Arranca la app. `pidiendoPermiso` es el toque del botón: el consentimiento
 * de Google se pide ahí y nunca al abrir (C05.9.1).
 */
async function arrancar({ pidiendoPermiso = false } = {}) {
  pintar(renderConexion({ estado: 'conectando' }));
  try {
    // Vía silenciosa primero: es la misma que usa auth.token() para renovar
    // (pedir('') con la sesión en frío). Para una app que se abre a diario,
    // pedir el consentimiento explícito en cada arranque es un popup por
    // apertura.
    await auth.token();
  } catch {
    // Sin sesión previa, o con el permiso revocado: se explica antes de pedir,
    // porque el scope `drive` trae la pantalla de «app no verificada».
    if (!pidiendoPermiso) return pintar(renderConexion({ estado: 'inicial' }));
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
 * El encabezado de la receta arranca vacío y toma el título recortado cuando el
 * título grande sale de pantalla, como hacen las pantallas de detalle del
 * sistema. `IntersectionObserver` no existe en Node, donde corren los tests.
 */
let observadorTitulo: IntersectionObserver | null = null;

function observarTitulo(): void {
  observadorTitulo?.disconnect();
  observadorTitulo = null;
  if (typeof IntersectionObserver === 'undefined') return;
  const grande = document.querySelector<HTMLElement>('#app .rec-tit');
  const chico = document.querySelector<HTMLElement>('#app .enc .tit');
  if (!grande || !chico) return;
  const titulo = grande.textContent ?? '';
  observadorTitulo = new IntersectionObserver(([entrada]) => {
    chico.textContent = entrada?.isIntersecting ? '' : titulo;
  // El umbral en el borde de arriba: el título cuenta como fuera de pantalla
  // recién cuando pasó por detrás del encabezado, que mide 56 px.
  }, { rootMargin: '-56px 0px 0px 0px' });
  observadorTitulo.observe(grande);
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

/**
 * Dibuja la pantalla que la ruta pide. Es el único lugar que decide qué se ve.
 *
 * Cada rama que lee de red envuelve la lectura y dibuja un aviso si falla,
 * **sin datos viejos**: sin la lectura no hay con qué dibujar, y esa es la
 * consecuencia buscada de no tener copia local (C05.8.1). Ningún error muestra
 * el mensaje crudo de Google (R1).
 */
async function render(ruta: Ruta = parsearHash(location.hash)): Promise<void> {
  const cambiaDePantalla = !vistaActual || ruta.vista !== vistaActual.vista
    || ruta.params.nombre !== vistaActual.params.nombre || ruta.params.id !== vistaActual.params.id;

  // Salir del editor con cambios pregunta antes (C04.1.1). El `hashchange` no
  // se puede cancelar: cuando llega, el volver del encabezado o el gesto de
  // atrás ya cambiaron la URL. Así que no se dibuja la pantalla nueva —el
  // formulario sigue en el DOM con lo escrito—, la URL vuelve a ser la del
  // editor, y se pregunta.
  if (cambiaDePantalla && editorAbierto && formularioActual() !== editorAbierto.formulario) {
    history.pushState(null, '', editorAbierto.hash);
    if (!document.querySelector('[data-salida]')) {
      document.querySelector('[data-formulario]')?.insertAdjacentHTML('afterbegin', confirmacionSalida);
    }
    window.scrollTo?.(0, 0);
    return;
  }

  // Cambiar de categoría o de vista limpia lo que era de la anterior: si no,
  // se entra a otra categoría y no se ve nada porque quedó filtrando por un
  // tag que ahí no existe, sin forma de darse cuenta.
  if (cambiaDePantalla) {
    editorAbierto = null;
    tagsActivos = [];
    visibles = TRAMO;
    // Navegar cierra el menú: se abrió para elegir a dónde ir.
    menuAbierto = false;
    confirmandoDescarte = false;
    editandoBorrador = false;
    if (ruta.vista !== 'capturar' && ruta.vista !== 'borrador') {
      tituloCaptura = ''; notaCaptura = ''; guardandoCaptura = false; errorCaptura = '';
    }
    posicionCocina = 'ingredientes';
    pasoAqui = null;
    pasosHechos = [];
    scrollCocina.ingredientes = scrollCocina.pasos = 0;
    // La pantalla nueva empieza arriba: el hash no cambia el scroll, así que
    // entrar al modo cocina desde el pie de la receta abría los ingredientes
    // ya scrolleados. La llamada es opcional por lo mismo que
    // `IntersectionObserver`: los tests corren sobre un DOM mínimo.
    window.scrollTo?.(0, 0);
  }
  vistaActual = ruta;

  const enPantalla = (texto: string) => pintar('<div class="cuerpo">' + aviso({
    texto, accion: { etiqueta: 'Reintentar', accion: 'reintentar' }
  }) + '</div>');

  switch (ruta.vista) {
    case 'recetario': {
      // El contador de borradores es una lectura más, y que falle no puede
      // dejar sin Recetario: se dibuja sin número.
      const pendientes = await borradores?.listar().catch(() => []) ?? [];
      return pintar(renderRecetario({
        categorias: store.categoriasConConteo(), borradores: pendientes.length, menuAbierto
      }));
    }

    case 'categoria': {
      const nombre = ruta.params['nombre'] ?? '';
      const entradas = store.buscar({ categoria: nombre, tags: tagsActivos });
      pintar(renderCategoria({
        nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos
      }));
      return observarTramo();
    }

    case 'resultados': {
      const q = ruta.params['q'] ?? '';
      return pintar(renderResultados({ consulta: q, grupos: store.buscarPorTexto(q) }));
    }

    case 'receta':
      try {
        const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
        pintar(renderReceta({ entrada, receta }));
        return observarTitulo();
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'cocinar':
      try {
        const { receta } = await store.receta(ruta.params['id'] ?? '');
        return pintar(renderCocina({
          receta, posicion: posicionCocina, aqui: pasoAqui, hechos: pasosHechos, wakeActivo: !!wakeLock
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'ajustes':
      // El mail no lo guarda nadie: se lo pide a Drive una vez. Que falle no
      // rompe la pantalla, solo deja la línea de la cuenta vacía.
      if (!cuenta) cuenta = await drive.cuenta().catch(() => '');
      return pintar(renderAjustes({
        cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados, reindexando,
        borradores: (await borradores?.listar().catch(() => []) ?? []).length, menuAbierto
      }));

    case 'capturar': {
      // La captura no dibuja la app: es una pantalla efímera sobre lo que el
      // usuario estaba haciendo en otra app (C01.2.2).
      const fuente = ruta.params['url'] || ruta.params['text'] || '';
      return pintar(renderCaptura({
        fuente, titulo: tituloCaptura, nota: notaCaptura, guardando: guardandoCaptura,
        ...(errorCaptura ? { error: errorCaptura } : {})
      }));
    }

    case 'borradores':
      try {
        return pintar(renderBorradores({ borradores: await borradores?.listar() ?? [], menuAbierto }));
      } catch (err) {
        console.error(err);
        return pintar(renderBorradores({ borradores: [], error: 'No se pudieron leer los borradores.' }));
      }

    case 'borrador':
      try {
        const lista = await borradores?.listar() ?? [];
        const borrador = lista.find(b => b.id === (ruta.params['id'] ?? ''));
        // Un borrador que ya no está —convertido afuera, descartado— no es un
        // error: la lista es lo que corresponde mostrar.
        if (!borrador) return pintar(renderBorradores({ borradores: lista }));
        // Editar es el mismo formulario con el que se creó, precargado.
        if (editandoBorrador) {
          return pintar(renderCaptura({
            fuente: borrador.fuente, titulo: borrador.titulo, nota: borrador.nota,
            edicion: true, guardando: guardandoCaptura,
            ...(errorCaptura ? { error: errorCaptura } : {})
          }));
        }
        return pintar(renderBorrador({ borrador, confirmando: confirmandoDescarte }));
      } catch (err) {
        console.error(err);
        return pintar(renderBorradores({ borradores: [], error: 'No se pudo leer el borrador.' }));
      }

    case 'editar':
      try {
        const { entrada, receta } = await store.receta(ruta.params['id'] ?? '');
        return abrirEditor(renderEditor({
          entrada, receta, categorias: categoriasDelArranque(),
          tagsConocidos: store.tagsDe().map(t => t.tag),
          confirmandoBorrado: confirmandoDescarte
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'nueva': {
      // El mismo formulario que editar, sin entrada (todavía no hay archivo en
      // Drive) y con una receta vacía en vez de una leída. Desde un borrador
      // abre con el título y la fuente cargados (C04.3b.1); guardar es lo que
      // de verdad la crea, y ahí se borra el borrador (C01.7.1).
      const receta = parse('');
      const borradorId = ruta.params['borrador'] ?? '';
      if (borradorId) {
        const borrador = (await borradores?.listar().catch(() => []) ?? [])
          .find(b => b.id === borradorId);
        if (borrador) {
          // La nota se lee como si fuera el `.md` de la receta: lo que esté
          // bajo `## Ingredientes`, `## Preparación`, `## Variaciones` o
          // `## Notas` cae en su campo, y el texto suelto de arriba queda como
          // descripción. Escribirla así es opcional.
          const deLaNota = parse(borrador.nota);
          Object.assign(receta, deLaNota, {
            titulo: borrador.titulo || deLaNota.titulo,
            fuente: borrador.fuente || deLaNota.fuente
          });
        }
      }
      return abrirEditor(renderEditor({
        entrada: null, receta, categorias: categoriasDelArranque(),
        tagsConocidos: store.tagsDe().map(t => t.tag)
      }));
    }
  }
}

/** Los tags que quedaron dibujados, en el `hidden` que viaja en el formulario. */
function sincronizarTags(): void {
  const pills = [...document.querySelectorAll<HTMLElement>('[data-pills] [data-valor]')];
  const oculto = document.querySelector<HTMLInputElement>('input[name="tags"]');
  if (oculto) oculto.value = pills.map(p => p.dataset['valor'] ?? '').filter(Boolean).join(', ');
}

/**
 * Vuelve a mirar si la receta del formulario puede declararse terminada, y
 * habilita o apaga el conmutador en consecuencia. Corre en cada tecla, así que
 * toca el DOM en vez de redibujar: redibujar perdería el foco y el cursor.
 */
function revisarCompletitud(): void {
  const bloque = document.querySelector<HTMLElement>('#app [data-completitud]');
  if (!bloque) return;
  const valor = (n: string): string =>
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `#app [name="${n}"]`)?.value ?? '';

  const puede = sePuedeTerminar(
    { titulo: valor('titulo'), ingredientes: valor('ingredientes'), preparacion: valor('preparacion') },
    valor('carpeta')
  );
  const terminada = bloque.querySelector<HTMLButtonElement>('[data-completa="si"]');
  const leyenda = bloque.querySelector<HTMLElement>('.leyenda-completa');
  if (terminada) terminada.disabled = !puede;
  if (leyenda) leyenda.hidden = puede;

  // Si dejó de cumplir, la declaración se cae con ella.
  if (!puede && terminada?.classList.contains('on')) marcarCompletitud(false);
}

/** Mueve el conmutador y deja el valor en el campo que viaja al guardar. */
function marcarCompletitud(terminada: boolean): void {
  const bloque = document.querySelector<HTMLElement>('#app [data-completitud]');
  if (!bloque) return;
  bloque.querySelector('[data-completa="si"]')?.classList.toggle('on', terminada);
  bloque.querySelector('[data-completa="no"]')?.classList.toggle('on', !terminada);
  const oculto = bloque.querySelector<HTMLInputElement>('input[name="completa"]');
  if (oculto) oculto.value = terminada ? 'si' : 'no';
}

/** El aviso de tag reservado, que aparece y se va sin redibujar el formulario. */
function avisarTag(mostrar: boolean): void {
  const aviso = document.querySelector<HTMLElement>('#app .error-tag');
  if (aviso) aviso.hidden = !mostrar;
}

/** Agrega el tag escrito, si no estaba ya. Devuelve si lo agregó. */
function agregarTag(valor: string): boolean {
  const tag = valor.trim().replace(/,+$/, '').trim();
  const contenedor = document.querySelector('[data-pills]');
  if (!tag || !contenedor) return false;
  // Los reservados nombran estados que calcula la app: no se escriben a mano.
  if (tagReservado(tag)) { avisarTag(true); return false; }
  avisarTag(false);
  const yaEsta = [...contenedor.querySelectorAll<HTMLElement>('[data-valor]')]
    .some(p => (p.dataset['valor'] ?? '').toLowerCase() === tag.toLowerCase());
  if (!yaEsta) contenedor.insertAdjacentHTML('beforeend', pillTag(tag));
  sincronizarTags();
  return !yaEsta;
}

/**
 * Navega reemplazando la entrada del historial en vez de agregar una.
 *
 * Es lo que corresponde cuando la navegación es un **cierre**: volver de la
 * cocina a la receta, salir a la categoría, o irse de un borrador que se acaba
 * de descartar. Con `location.hash =` el historial acumulaba la pantalla que
 * se estaba dejando, y el volver de la siguiente traía de vuelta justo eso:
 * el chevron de la receta llevaba al modo cocina.
 */
const irCerrando = (hash: string): void => { location.replace(hash); };

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const boton = destino?.closest<HTMLElement>('[data-accion], .check, [data-tag], [data-completa]') ?? null;
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

  if (accion === 'cocinar') {
    cocinaDesdeReceta = true;
    location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/cocinar`;
    return;
  }
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

  if (accion === 'abrir-menu') { menuAbierto = true; return render(); }
  if (accion === 'cerrar-menu') { menuAbierto = false; return render(); }
  if (accion === 'borradores') { location.hash = '#/borradores'; return; }
  if (accion === 'ajustes') { location.hash = '#/ajustes'; return; }
  if (accion === 'limpiar') {
    // Vacía la caja y deja el cursor ahí. No navega: buscar vacío no hace nada,
    // y salir de los resultados es el chevron.
    const campo = document.querySelector<HTMLInputElement>('#app [data-accion="buscar"]');
    if (campo) { campo.value = ''; campo.focus?.(); }
    return;
  }
  if (accion === 'reindexar') return reconstruir({ enAjustes: true });
  if (accion === 'conectar') return arrancar({ pidiendoPermiso: true });
  if (accion === 'salir') {
    auth.olvidar();
    cuenta = '';
    irCerrando('#/');
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
      // El borrador que se acaba de descartar no tiene que quedar en el
      // historial: volver ahí mostraría algo que ya no existe.
      irCerrando('#/borradores');
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
    tituloCaptura = '';
    notaCaptura = '';
    // Editando, cancelar vuelve al borrador sin tocarlo.
    if (editandoBorrador) { editandoBorrador = false; return render(); }
    // Compartida desde otra app, cerrar la pestaña es volver a donde estabas
    // (C01.2.2). Pero `close()` sólo funciona si la abrió un script: si no
    // —y si la captura se abrió a mano desde Borradores—, hay que volver por
    // la app, o Cancelar no hacía nada.
    const compartida = !!(vistaActual?.params['url'] || vistaActual?.params['text']);
    if (compartida) window.close();
    if (history.length <= 1) { irCerrando('#/borradores'); return; }
    return history.back();
  }
  if (accion === 'guardar-captura') {
    const campoTitulo = document.querySelector<HTMLInputElement>('input[name="titulo"]');
    const campoFuente = document.querySelector<HTMLInputElement>('input[name="fuente"]');
    const campoNota = document.querySelector<HTMLTextAreaElement>('textarea[name="nota"]');
    tituloCaptura = campoTitulo?.value.trim() ?? '';
    notaCaptura = campoNota?.value.trim() ?? '';
    if (!tituloCaptura) return;
    const fuente = campoFuente?.value.trim()
      ?? vistaActual?.params['url'] ?? vistaActual?.params['text'] ?? '';

    guardandoCaptura = true;
    errorCaptura = '';
    await render();
    try {
      if (editandoBorrador) {
        await borradores?.editar(vistaActual?.params['id'] ?? '',
          { titulo: tituloCaptura, fuente, nota: notaCaptura });
        editandoBorrador = false;
        guardandoCaptura = false;
        tituloCaptura = '';
        notaCaptura = '';
        return render();
      }
      await borradores?.agregar({ titulo: tituloCaptura, fuente, nota: notaCaptura });
    } catch (err) {
      console.error(err);
      // Nada queda esperando: el texto sigue en pantalla y se reintenta a mano.
      guardandoCaptura = false;
      errorCaptura = 'No se pudo guardar. Revisá la conexión.';
      return render();
    }
    guardandoCaptura = false;
    tituloCaptura = '';
    notaCaptura = '';
    // Volver a donde estabas, con Recetario sin quedar abierto (C01.2.2). Si
    // la pestaña no la abrió un script, `close()` no hace nada: ahí queda la
    // lista, que es el lugar donde el borrador nuevo está.
    window.close();
    irCerrando('#/borradores');
    return;
  }
  if (accion === 'editar-borrador') { editandoBorrador = true; return render(); }

  if (boton.dataset['completa']) {
    if (boton.hasAttribute('disabled')) return;
    marcarCompletitud(boton.dataset['completa'] === 'si');
    return;
  }

  if (accion === 'tag-quitar') {
    const tag = boton.dataset['valor'] ?? '';
    boton.remove();
    sincronizarTags();
    if (tag) document.querySelector<HTMLInputElement>('[data-tag-nuevo]')?.focus();
    return;
  }

  // Las dos salidas del modo cocina tienen destinos distintos, y las dos
  // sueltan el bloqueo de pantalla: se dejó de cocinar.
  if (accion === 'volver-receta') {
    await soltarPantalla();
    if (cocinaDesdeReceta) {
      cocinaDesdeReceta = false;
      return history.back();
    }
    // Se entró al modo cocina por un link directo: no hay receta atrás.
    irCerrando(`#/r/${encodeURIComponent(vistaActual?.params['id'] ?? '')}`);
    return;
  }
  if (accion === 'salir-cocina') {
    await soltarPantalla();
    cocinaDesdeReceta = false;
    const entrada = store.entradas().find(e => e.id_archivo === (vistaActual?.params['id'] ?? ''));
    // Sin fila del índice no se sabe de qué categoría es: se vuelve al Recetario.
    irCerrando(entrada?.categoria ? `#/c/${encodeURIComponent(entrada.categoria)}` : '#/');
    return;
  }

  if (accion === 'volver' || accion === 'atras') {
    // Editar un borrador no cambia la URL: es estado de la pantalla. Volver
    // cierra la edición y muestra el borrador, en vez de irse a la lista, que
    // es la entrada anterior del historial.
    if (editandoBorrador) { editandoBorrador = false; return render(); }
    if (vistaActual?.vista === 'cocinar') await soltarPantalla();
    // Entrar por un link directo deja el historial vacío: ahí volver es ir al
    // Recetario, no salirse de la app.
    if (history.length <= 1) { location.hash = '#/'; return; }
    return history.back();
  }
  if (accion === 'editar') { location.hash = `#/r/${vistaActual?.params['id'] ?? ''}/editar`; return; }
  if (accion === 'cancelar') return history.back();
  if (accion === 'seguir-editando') { document.querySelector('[data-salida]')?.remove(); return; }
  if (accion === 'salir-sin-guardar') { editorAbierto = null; return history.back(); }
  if (accion === 'reconectar') {
    try {
      // Si el arranque nunca llegó a "listo" (solo-lectura), reintentar todo
      // el arranque en vez de solo renovar el token: el store todavía no
      // tiene categorías ni índice cargados.
      if (estadoArranque?.estado !== 'listo') { await arrancar({ pidiendoPermiso: true }); return; }
      await auth.conectar();
      return render();
    } catch (err) {
      console.error(err);
      return pintar('<div class="cuerpo">' + aviso({
        texto: 'No se pudo reconectar con Google.',
        accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
      }) + '</div>');
    }
  }

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
    // Sin categoría no se sabe en qué carpeta de Drive va el archivo (C04.3b.1).
    if (esNueva && !carpetaId) return conError('Elegí una categoría antes de guardar.');

    try {
      if (esNueva && borradorId && borradores) {
        // Convertir es una sola operación: el .md, la fila y el borrador (C01.7.1).
        await convertirBorrador({ store, borradores, convertidos }, { borradorId, receta: nueva, carpetaId });
      } else if (esNueva) {
        await store.crear(nueva, { carpetaId: carpetaId || undefined });
      } else {
        await store.guardar(id, nueva, { carpetaDestino: carpetaId });
      }
      // Nada confirma el éxito: al terminar, vuelve a la receta. Lo escrito ya
      // está en Drive, así que salir no tiene nada que preguntar.
      editorAbierto = null;
      return history.back();
    } catch (err) {
      console.error(err);
      return conError('No se pudo guardar. Revisá la conexión.');
    }
  }

  if (accion === 'borrar') { confirmandoDescarte = true; return render(); }
  if (accion === 'cancelar-borrado') { confirmandoDescarte = false; return render(); }
  if (accion === 'borrar-confirmado') {
    const id = vistaActual?.params['id'] ?? '';
    try {
      await store.borrar(id);
      confirmandoDescarte = false;
      editorAbierto = null;
      // Vuelve a la lista de donde se venía; el archivo queda en la papelera
      // de Drive, que es la red de seguridad y es del usuario. Y la receta
      // borrada no queda en el historial.
      irCerrando('#/');
      return;
    } catch (err) {
      console.error(err);
      const { entrada, receta } = await store.receta(id);
      return pintar(renderEditor({
        entrada, receta, categorias: categoriasDelArranque(),
        tagsConocidos: store.tagsDe().map(t => t.tag),
        error: 'No se pudo borrar. La receta sigue estando.'
      }));
    }
  }

  if (accion === 'reintentar') return render();
});

/**
 * La captura se escribe en el DOM y no en el estado: redibujar en cada tecla
 * perdería el foco y el cursor. Lo que se sigue tecla a tecla es lo mínimo —el
 * título habilita Guardar, y lo escrito sobrevive a un error—, y el botón se
 * habilita tocándolo directo, sin volver a pintar la pantalla.
 */
app.addEventListener('input', (e) => {
  // En el editor, cada tecla puede habilitar o apagar «Terminada».
  if (vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva') return revisarCompletitud();
  if (vistaActual?.vista !== 'capturar' && !editandoBorrador) return;
  const campo = e.target as HTMLInputElement | HTMLTextAreaElement | null;
  if (!campo?.name) return;
  if (campo.name === 'nota') { notaCaptura = campo.value; return; }
  if (campo.name !== 'titulo') return;
  tituloCaptura = campo.value;
  const boton = document.querySelector<HTMLButtonElement>('#app [data-accion="guardar-captura"]');
  if (boton) boton.toggleAttribute('disabled', !tituloCaptura.trim());
});

app.addEventListener('keydown', (e) => {
  const campo = (e.target as HTMLInputElement | null);
  if (!campo?.dataset || !('tagNuevo' in campo.dataset)) return;
  // Seguir escribiendo borra el aviso del intento anterior.
  if ((e as KeyboardEvent).key.length === 1) avisarTag(false);
  const tecla = (e as KeyboardEvent).key;
  if (tecla !== 'Enter' && tecla !== ',') return;
  // Enter dentro de un formulario lo manda: acá el Enter es «agregá el tag».
  e.preventDefault();
  agregarTag(campo.value);
  campo.value = '';
});

// Salir del campo con algo escrito lo agrega igual: no se pierde por
// distraerse y tocar Guardar.
app.addEventListener('focusout', (e) => {
  const campo = (e.target as HTMLInputElement | null);
  if (!campo?.dataset || !('tagNuevo' in campo.dataset)) return;
  if (agregarTag(campo.value)) campo.value = '';
});

// La categoría es un select: cambia por `change`, no por `input`.
app.addEventListener('change', () => {
  if (vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva') revisarCompletitud();
});

app.addEventListener('change', (e) => {
  // Mismo motivo que en `conClosest`: nada de instanceof contra globales del
  // navegador, que en los tests no existen.
  const campo = e.target as HTMLInputElement | null;
  if (campo?.dataset?.['accion'] !== 'buscar') return;
  const q = campo.value.trim();
  // Con la caja vacía no se busca, y no se avisa: no hay nada que decir.
  if (!q) return;
  location.hash = `#/buscar?q=${encodeURIComponent(q)}`;
});

arrancar().catch(err => pintar(`<p class="contenido">No pude arrancar: ${escapar(mensajeDe(err))} <button data-accion="reconectar">Reintentar</button></p>`));

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}
