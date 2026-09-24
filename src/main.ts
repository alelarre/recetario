import { crearAuth, ErrorDeAuth } from './auth.js';
import { crearDrive, ErrorDeDrive } from './drive.js';
import { crearSheets, ErrorDeSheets } from './sheets.js';
import { crearStore, conConcurrencia, TOPE_LECTURAS } from './store.js';
import * as indiceLocal from './indice-local.js';
import { parse, slugArchivo } from './recipe.js';
import { tagReservado, conEspecial, esFavorita, tieneEspecial, contarDuraciones, filtrarPorDuracion, ordenarRecetas } from './catalogo.js';
import type { Orden } from './catalogo.js';
import { sePuedeTerminar } from './recipe.js';
import { crearRouter, parsearHash, hashDeCompartido, esHashDeInvitado } from './ui/router.js';
import { renderRecetario } from './ui/recetario.js';
import { renderCategoria } from './ui/categoria.js';
import { renderTag } from './ui/tag.js';
import { renderResultados } from './ui/resultados.js';
import { renderReceta } from './ui/receta.js';
import { renderCocina } from './ui/cocina.js';
import {
  renderEditor, recetaDesdeFormulario, pillTag, confirmacionSalida, botonBorrar, confirmacionBorrado,
  renderAccionesFoto, renderElegirFoto, renderSelectorPortada, renderFotoPorUrl,
  filaDeFotosEditor, muestraDePortada, fotosDesde, botonPonerFoto
} from './ui/editor.js';
import { renderPlan } from './ui/plan.js';
import { renderPlanAgregar, bloqueDeAgregar } from './ui/plan-agregar.js';
import { renderCompras } from './ui/compras.js';
import { diaDeHoy } from './plan.js';
import { listaDeCompras, textoCompras } from './compras.js';
import type { ListaDeCompras } from './compras.js';
import { renderAjustes } from './ui/ajustes.js';
import { renderConexion } from './ui/conexion.js';
import { renderListaCategorias, renderEdicionCategoria, confirmacionBorrarCategoria, botonBorrarCategoria } from './ui/gestion-categorias.js';
import { colorLibre, problemaDelNombre } from './categorias.js';
import { colorDeClave, urlDeFoto } from './ui/categorias.js';
import { imgDe } from './ui/markdown.js';
import { renderSelector } from './ui/carpeta.js';
import { elegirCarpeta } from './picker.js';
import { API_KEY, NOMBRE_RAIZ } from './config.js';
import { puedeEmpezar, direccion, progreso, seAbre } from './ui/gesto-menu.js';
import type { CarpetaSimple } from './ui/carpeta.js';
import { aviso, SIN_SESION, FOTO_AUSENTE, FOTO_ROTA } from './ui/componentes.js';
import { pintar as pintarEnPantalla, conClosest, desplazarCarrusel, movimientoReducido } from './ui/pintar.js';
import { renderVisor, pasoDelVisor } from './ui/visor.js';
import {
  linkDeFoto, idDeDrive, resolverReceta, fotosSinUso, siguienteNumero, lineaDelCursor, ponerEn, sacarReferencias
} from './fotos-receta.js';
import { crearControlCocina } from './cocina-control.js';
import { registrarCategorias } from './ui/categorias.js';
import { precargar, generar } from './pdf/generar.js';
import {
  compartirPdf, compartirLink, compartirTexto, plataformaDelNavegador, leerPortapapeles, enviarAlAgente
} from './compartir.js';
import type { FotosDelPedido } from './compartir.js';
import { esRecetaEnMd, recetaRecibida, aplicarPegada, pedidoDeConversion } from './conversion.js';
import { desdeCompartido, tituloPorDefecto } from './compartido.js';
import { codificar, urlDeLink } from './link-receta.js';
import { textoReceta } from './texto-receta.js';
import type { EstadoCompartir } from './ui/compartir.js';
import type { Ruta } from './ui/router.js';
import { achicar } from './fotos.js';
import type { OpcionesAchicar } from './fotos.js';
import { crearImagenes, conTope } from './imagenes.js';
import type { DatosFormulario } from './ui/editor.js';
import type { EstadoVisor } from './ui/visor.js';
import type { ResultadoArranque, Progreso } from './store.js';
import type { CambiosDeFotos, Entrada, FotoDeReceta, Momento, Plan, Receta } from './tipos.js';

type Store = ReturnType<typeof crearStore>;

const app = document.querySelector('#app');
if (!app) throw new Error('Falta #app en el documento');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());
/** Las fotos de Drive, pedidas con el token y guardadas en Cache Storage. */
const imagenes = crearImagenes({ leerBlob: id => drive.leerBlob(id) });

/**
 * Dibuja la pantalla y completa las fotos que quedaron pedidas.
 *
 * Nada espera a una imagen para dibujarse: una foto de Drive sale
 * como `<img data-drive>` sin `src` —un recuadro del mismo tamaño— y una foto
 * nueva del editor como `<img data-n>`, y acá se les pone el `src` cuando el
 * blob está. Envuelve a `pintar` en vez de repetirse en cada pantalla: son
 * treinta llamadas y ninguna tiene que acordarse.
 */
const pintar = (html: string): void => {
  pintarEnPantalla(html);
  // El velo del cierre espera a que la pantalla de destino esté dibujada: si
  // se fuera antes, se vería el repintado por debajo (§6.17b).
  if (veloEsperaPintado) sacarVeloDelCierre();
  mirarElAviso();
  void completarFotos();
};

/**
 * Un aviso que queda fuera de pantalla no avisa: el que falla al guardar con la
 * pantalla scrolleada al fondo se dibuja arriba de todo y no se ve. Con
 * `nearest` sólo se mueve lo justo, y no se mueve nada si ya estaba a la vista.
 */
function mirarElAviso(): void {
  const aviso = document.querySelector<HTMLElement>('#app .aviso');
  aviso?.scrollIntoView?.({ block: 'nearest', behavior: movimientoReducido() ? 'auto' : 'smooth' });
}

/**
 * Las fotos que la pantalla dejó pedidas. Las del editor salen del blob que
 * está en memoria; las de Drive, del caché o de la red. Una de Drive que ya no
 * está pasa al recuadro de aviso si tiene su propio cuadrado —el carrusel de la
 * receta, una grilla, una miniatura—, y no se dibuja en ningún otro lado.
 * Las de Drive van de a dos, como la precarga: de
 * a una, una lista entera se completa de arriba a abajo y se ve llegar.
 */
async function completarFotos(): Promise<void> {
  for (const img of document.querySelectorAll<HTMLElement>('#app img[data-n]:not([src])')) {
    const url = fotosEditor.urls.get(Number(img.dataset['n']));
    if (url) img.setAttribute('src', url);
  }
  const deDrive = [...document.querySelectorAll<HTMLElement>('#app img[data-drive]:not([src])')];
  await conTope(deDrive, 2, async img => {
    const id = img.dataset['drive'];
    if (!id) return;
    const url = await imagenes.urlDeImagen(id).catch(err => { console.error(err); return null; });
    if (url) img.setAttribute('src', url);
    else sacarFoto(img, FOTO_AUSENTE);
  });
}

/**
 * La foto que no se va a ver: donde tiene su propio cuadrado —el carrusel de la
 * receta, la grilla de portada del editor, la fila de miniaturas— deja el
 * recuadro con el motivo, y en cualquier otro lado —la cabecera, un paso, una
 * lista— el bloque no se dibuja. En una lista, abajo queda el placeholder de la
 * categoría.
 */
function sacarFoto(img: Element, recuadro: string): void {
  if (img.closest('.carrusel-foto, .galeria-item, .miniatura')) img.outerHTML = recuadro;
  else img.remove();
}

let store: Store;
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
/** El id de la ruta que se está mirando: la receta o la categoría. */
const idActual = (): string => vistaActual?.params['id'] ?? '';
let tagsActivos: string[] = [];   // filtro de la vista de categoría; se limpia al cambiar de vista
let duracionesActivas: string[] = [];   // filtro de duración de la categoría o la lista por tag
let orden: Orden = 'alfa';               // el conmutador de las listas; vuelve a A–Z al cambiar de pantalla

/**
 * Cuántas tarjetas dibuja la categoría. El tramo no es una lectura de red —el
 * índice ya está entero en memoria—: es cuántas se dibujan de una vez.
 */
const TRAMO = 30;
let visibles = TRAMO;
let observadorTramo: IntersectionObserver | null = null;

/**
 * La pantalla de la carpeta base. Las sugerencias vienen del arranque; que se
 * esté cambiando la carpeta, de la ruta. La app no lista nada del Drive: la
 * carpeta se crea, o se elige con el Picker de Google.
 */
const selector = {
  sugerencias: [] as CarpetaSimple[],
  confirmando: null as CarpetaSimple | null,
  error: ''
};

/** Se entró desde Ajustes a cambiar la carpeta, y no por no tener ninguna. */
const cambiandoCarpeta = (): boolean => vistaActual?.params['cambiando'] === '1';

/**
 * El setup de la carpeta elegida o recién creada, con su progreso, y la recarga
 * al terminar. Si falla, el aviso reemplaza los botones y Reintentar vuelve a
 * ofrecer la misma carpeta: repetir el setup no duplica nada.
 */
async function usarCarpeta(elegida: CarpetaSimple): Promise<void> {
  try {
    // La anotación es para los otros dispositivos: si falla, el cambio sigue.
    if (cambiandoCarpeta()) await store.marcarReemplazada().catch(err => console.error(err));
    pintar(renderConexion({ estado: 'creando-indice' }));
    await store.prepararCarpeta(elegida, progreso => pintar(renderConexion({ estado: 'creando-indice', progreso })));
    // La copia ya es la de la carpeta elegida: recargar abre con un pedido.
    location.replace('#/');
    location.reload();
  } catch (err) {
    console.error(err);
    selector.error = 'No se pudo preparar la carpeta. Revisá la conexión.';
    await render();
  }
}

/** El menú lateral desplegado. Sólo aplica en pantalla angosta: desde 900 px es fijo. */
let menuAbierto = false;

/**
 * El editor abierto: su hash y cómo estaba el formulario al dibujarlo. Salir
 * con el formulario distinto pregunta antes (C04.1.1). La comparación es contra
 * esta foto, no contra el `.md` de Drive: no se lee nada para decidir.
 */
let editorAbierto: { hash: string; formulario: string } | null = null;
/**
 * La receta abierta, leída una vez. La reutilizan los redibujados —marcar un
 * paso, conmutar, tocar el sol: cada lectura era un pedido a Drive que se
 * sentía en cada toque— y el ir y venir entre la receta, su modo cocina y su
 * editor, que es la misma receta. Salir a cualquier otra pantalla la descarta:
 * volver más tarde vuelve a leer, porque el archivo es la verdad (C05.8.1).
 */
let recetaLeida: { id: string; entrada: Entrada | null; receta: Receta } | null = null;

/** La estrella de favorito está escribiendo: dura lo que tarda Drive. */
let marcandoFavorito = false;
/** Lo último que falló al marcar favorito. Lo dibuja la receta, arriba de la ficha. */
let errorFavorito = '';
/**
 * Un aviso para la pantalla a la que se va, y el que la pantalla actual trajo
 * al llegar: cómo terminó el pedido al agente se lee en la receta, porque el
 * editor desde el que se mandó ya se cerró. Dura esa llegada.
 */
let avisoAlLlegar = '';
let avisoDeLlegada = '';
/** El pedido al agente, listo para mandar: el texto y las fotos. */
type PedidoAlAgente = { pedido: string; fotos: FotosDelPedido | null };
/**
 * El pedido que no salió —el navegador ya no tenía la activación del toque—,
 * para la pantalla a la que se va y el que la receta ofrece mandar con un
 * toque nuevo. Como `pdfListo` con *Enviar PDF*: no se vuelve a armar.
 */
let pedidoAlLlegar: PedidoAlAgente | null = null;
let pedidoPendiente: PedidoAlAgente | null = null;
const PEDIDO_COPIADO = 'Pedido copiado: pegalo en el agente';

/**
 * El plan de la semana, leído de su `.md` una vez. Mismo criterio que la
 * receta: se conserva mientras se navega entre las tres pantallas del
 * plan y se descarta al salir a cualquier otra.
 */
let planLeido: Plan | null = null;
const PANTALLAS_DE_PLAN: readonly Ruta['vista'][] = ['plan', 'plan-agregar', 'plan-compras'];
/** Reiniciar el plan pregunta antes: vacía los siete días. */
let confirmandoReinicio = false;
/** Lo último que falló al escribir el plan. La grilla sigue mostrando lo que dice Drive. */
let errorPlan = '';
/** Lo escrito en la caja de la pantalla de agregar. Vive acá y no en el DOM: el bloque se redibuja solo. */
let consultaPlan = '';
/** La categoría elegida en la grilla de la pantalla de agregar, si hay una. */
let categoriaPlan: string | null = null;
/**
 * La lista de compras ya armada, con la clave del plan del que salió:
 * redibujar —abrir la ficha de compartir— no vuelve a leer las recetas.
 */
let comprasLeidas: { clave: string; lista: ListaDeCompras } | null = null;

/**
 * Falta la sesión de Google: la renovación silenciosa no salió, o Google
 * rechazó el token. No es un problema de red, y el aviso lo dice (R3).
 */
const sinSesion = (err: unknown): boolean =>
  err instanceof ErrorDeAuth ||
  ((err instanceof ErrorDeDrive || err instanceof ErrorDeSheets) && err.status === 401);

/** Por qué no se guardó, en castellano (R1). */
const porQueNoGuardo = (err: unknown): string =>
  sinSesion(err) ? SIN_SESION : 'No se pudo guardar. Revisá la conexión.';

/**
 * Cuántos pedidos de tapar la pantalla hay abiertos, y la pantalla desde la
 * que se tapó. Es la única verdad sobre el velo: cada escritura abre el suyo,
 * y el manejador que tarda en llegar a escribir abre el suyo antes. Con
 * la pantalla tapada no se navega ni responde ningún control.
 */
let tapadas = 0;
let hashEscritura = '';

/**
 * Lo que dura el cierre con el tilde antes de navegar (§6.17b): el tilde
 * termina de dibujarse a los 875 ms —0,3 s de espera y 0,575 s de trazo— y se
 * queda 975 ms más quieto, para que se llegue a ver que salió bien. El
 * reparto se elige mirando la animación en el teléfono: con menos, el tilde
 * aparece y la pantalla ya cambió.
 */
const MS_CIERRE = 1850;

/** Lo que se espera a que la pantalla de destino se dibuje antes de sacar el velo igual. */
const MS_RESPALDO_CIERRE = 400;

/** El temporizador del cierre con el tilde, mientras se dibuja. */
let cierreEnCurso: ReturnType<typeof setTimeout> | null = null;

/**
 * Cómo dar por terminado el dibujo del cierre. Una escritura nueva lo corta, y
 * ahí también hay que soltar al que lo espera: si no, el manejador que guardó
 * se queda esperando un dibujo que ya no va a pasar.
 */
let terminarCierre: (() => void) | null = null;

/** El velo, con `aria-busy` en `#app`. Los tests corren sobre un DOM mínimo: puede no estar. */
function mostrarVelo(mostrar: boolean): void {
  // Una escritura nueva corta el cierre de la anterior: el velo vuelve a tapar.
  if (cierreEnCurso !== null) { clearTimeout(cierreEnCurso); cierreEnCurso = null; }
  if (terminarCierre) { const listo = terminarCierre; terminarCierre = null; listo(); }
  veloEsperaPintado = false;
  veloDelCierre = null;
  if (respaldoDelCierre !== null) { clearTimeout(respaldoDelCierre); respaldoDelCierre = null; }
  const velo = document.querySelector<HTMLElement>('#velo-escritura');
  if (velo) { velo.hidden = !mostrar; velo.classList.remove('exito'); }
  if (mostrar) app?.setAttribute('aria-busy', 'true');
  else app?.removeAttribute('aria-busy');
}

/**
 * El cierre de una escritura que salió bien: la tapa baja sobre la olla y se
 * dibuja el tilde. La promesa termina cuando el dibujo terminó, **con el velo
 * todavía puesto**: así el que guardó navega recién después del tilde, y el
 * repintado de la pantalla de destino queda tapado (§6.17b). Del velo se
 * encarga `sacarVeloDelCierre`, cuando esa pantalla ya está dibujada.
 *
 * La pantalla, eso sí, ya no está tapada: el contador quedó en cero y el velo
 * deja pasar el toque.
 */
function cerrarConExito(): Promise<void> {
  const velo = document.querySelector<HTMLElement>('#velo-escritura');
  if (!velo) { mostrarVelo(false); return Promise.resolve(); }
  velo.classList.add('exito');
  veloDelCierre = velo;
  app?.removeAttribute('aria-busy');
  return new Promise(listo => {
    terminarCierre = listo;
    cierreEnCurso = setTimeout(() => {
      cierreEnCurso = null;
      terminarCierre = null;
      listo();
    }, MS_CIERRE);
  });
}

/**
 * El velo del cierre se va cuando la pantalla de destino está dibujada. El
 * respaldo es para el guardado que no navega a ningún lado: sin él, el velo se
 * quedaría puesto esperando un dibujo que no viene.
 */
let veloEsperaPintado = false;
let respaldoDelCierre: ReturnType<typeof setTimeout> | null = null;
/**
 * El velo que está dibujando el cierre. Se guarda en vez de volver a buscarlo:
 * para cuando toca sacarlo, la pantalla de abajo ya se redibujó, y el que lo
 * tiene que esconder es el mismo elemento que lo empezó a dibujar.
 */
let veloDelCierre: HTMLElement | null = null;

function esperarPintadoParaSacarElVelo(): void {
  veloEsperaPintado = true;
  if (respaldoDelCierre !== null) clearTimeout(respaldoDelCierre);
  respaldoDelCierre = setTimeout(sacarVeloDelCierre, MS_RESPALDO_CIERRE);
}

function sacarVeloDelCierre(): void {
  veloEsperaPintado = false;
  if (respaldoDelCierre !== null) { clearTimeout(respaldoDelCierre); respaldoDelCierre = null; }
  const velo = veloDelCierre;
  veloDelCierre = null;
  if (velo) { velo.hidden = true; velo.classList.remove('exito'); }
}

/**
 * Tapa la pantalla y devuelve cómo destaparla. Destapar dos veces no descuenta
 * de más: el manejador que la tapó puede soltarla por varios caminos. Con
 * `{ exito: true }` el velo no se va de golpe: se queda los milisegundos del
 * cierre con el tilde, ya sin tapar nada.
 */
function tapar(): (opciones?: { exito?: boolean }) => Promise<void> {
  if (tapadas++ === 0) { hashEscritura = location.hash; mostrarVelo(true); }
  let soltado = false;
  return opciones => {
    if (soltado) return Promise.resolve();
    soltado = true;
    if (--tapadas > 0) return Promise.resolve();
    if (opciones?.exito) return cerrarConExito();
    mostrarVelo(false);
    return Promise.resolve();
  };
}

/**
 * Envuelve la promesa de una escritura: la pantalla tapada mientras dura, y se
 * suelta siempre, termine bien o mal. Envuelve sólo la llamada que escribe y no
 * el manejador entero, para que éste pueda navegar o redibujar al terminar.
 */
async function escribiendo<T>(p: Promise<T>): Promise<T> {
  const destapar = tapar();
  try { return await p; }
  finally { destapar(); }
}

/** Las pantallas de una misma receta, entre las que la copia leída se conserva. */
const PANTALLAS_DE_RECETA: readonly Ruta['vista'][] = ['receta', 'cocinar', 'editar'];

/** La receta de la pantalla: de Drive la primera vez, de memoria mientras no se salga. */
async function recetaDePantalla(id: string): Promise<{ entrada: Entrada | null; receta: Receta }> {
  if (recetaLeida?.id !== id) {
    const { entrada, receta } = await store.receta(id);
    recetaLeida = { id, entrada, receta };
    // El depósito entero, no sólo lo que está a la vista: así el visor
    // desliza sin esperar.
    const ids = idsDeDrive(receta.fotos.map(f => f.url));
    if (ids.length) void imagenes.precargar(ids);
  }
  return recetaLeida;
}

/** El plan de la pantalla: de Drive la primera vez, de memoria mientras no se salga. */
async function planDePantalla(): Promise<Plan> {
  if (!planLeido) planLeido = await store.plan();
  return planLeido;
}

/** Los ids de Drive de estas URLs; las externas quedan afuera. */
const idsDeDrive = (urls: readonly string[]): string[] =>
  urls.flatMap(url => { const id = idDeDrive(url); return id ? [id] : []; });

/** Ya se precargaron las fotos del home: es una sola vez por sesión. */
let precargado = false;

/**
 * Dibujado el home, en segundo plano: las cabeceras de Drive del índice y las
 * fotos propias de las categorías. Lo que ya está en el caché no se
 * vuelve a pedir, y con `saveData` no se pide nada.
 */
function precargarElHome(): void {
  if (precargado) return;
  precargado = true;
  const deLasRecetas = idsDeDrive(store.entradas().map(e => e.foto));
  const deLasCategorias = store.categorias()
    .flatMap(c => c.foto.startsWith('drive:') ? [c.foto.slice('drive:'.length)] : []);
  const ids = [...deLasRecetas, ...deLasCategorias];
  if (ids.length) void imagenes.precargar(ids);
}

/** Las recetas con el tag `menú diario`: lo que la pantalla de agregar ofrece sin buscar nada. */
const delMenuDiario = (): Entrada[] => store.entradas().filter(e => tieneEspecial(e, 'menú diario'));

/** Las recetas de una categoría, para cuando se la elige en la grilla de agregar al plan. */
const delaCategoria = (nombre: string): Entrada[] => store.entradas().filter(e => e.categoria === nombre);

/**
 * La lista de compras del plan. Las recetas se leen de Drive al entrar, una por
 * receta distinta; una que ya no se puede leer se saltea. Después cuentan una
 * vez por aparición: la misma receta en dos comidas cuenta dos veces.
 *
 * Las lecturas se solapan, de a seis como el reindexado: en fila, un plan
 * cargado son catorce viajes uno detrás de otro. Y tapan la pantalla
 * mientras duran —no escriben nada, pero es la espera más larga de la app
 * (R8)—; con la lista ya armada no se tapa nada, que sería un parpadeo.
 */
async function comprasDelPlan(plan: Plan): Promise<ListaDeCompras> {
  const clave = plan.comidas.map(c => c.id).join(',');
  if (comprasLeidas?.clave === clave) return comprasLeidas.lista;
  const ids = [...new Set(plan.comidas.map(c => c.id))];
  const leidas = new Map<string, Receta>();
  const destapar = tapar();
  try {
    // El error se atrapa acá adentro y no afuera: `conConcurrencia` corta el
    // reparto con el primero que falla, y una receta borrada sólo se saltea.
    const traidas = await conConcurrencia(ids, TOPE_LECTURAS, (id: string) =>
      store.receta(id).catch(err => { console.error(err); return null; }));
    for (const [i, id] of ids.entries()) {
      const leida = traidas[i];
      if (leida) leidas.set(id, leida.receta);
    }
  } finally {
    destapar();
  }
  const recetas = plan.comidas.flatMap(c => {
    const receta = leidas.get(c.id);
    return receta ? [receta] : [];
  });
  const lista = listaDeCompras(recetas);
  comprasLeidas = { clave, lista };
  return lista;
}

/** Escribe el plan entero y lo deja en memoria; si falla, la grilla no cambia y el aviso lo dice (R1). */
async function guardarPlan(nuevo: Plan): Promise<void> {
  try {
    await escribiendo(store.guardarPlan(nuevo));
    planLeido = nuevo;
    errorPlan = '';
  } catch (err) {
    console.error(err);
    errorPlan = 'No se pudo guardar el plan. Revisá la conexión.';
  }
}

/** Lo que el reindexado dejó afuera, para la sección de avisos de Ajustes. */
let ignorados: string[] = [];
/** El mail de la cuenta conectada. Se pide una vez, al entrar a Ajustes. */
let cuenta = '';
/** El progreso del reindexado en curso, o `null`. Mientras corre no se guarda ni se borra. */
let reindexando: Progreso | null = null;

/** El visor de fotos de una receta abierto: las URLs que recorre y en cuál está. */
let visor: EstadoVisor | null = null;
/**
 * El deslizamiento cambió de foto: el click que viene después del `touchend`
 * no cierra el visor, que si no se cerraría en cada gesto.
 */
let deslizoElVisor = false;
/** Dónde empezó el deslizamiento sobre el visor, o `null`. */
let visorDesde: number | null = null;

/**
 * Las fotos que el editor tiene en memoria hasta Guardar: el blob de
 * cada número nuevo, su object URL para la miniatura, y el id de Drive de la
 * que ya se subió en un intento que falló después —reintentar no la vuelve a
 * subir—.
 */
const fotosEditor = {
  nuevas: new Map<number, Blob>(),
  urls: new Map<number, string>(),
  subidas: new Map<number, string>()
};
/** La foto propia recién elegida para una categoría: se sube al guardarla. */
let fotoPropia: { blob: Blob; url: string } | null = null;

/**
 * Cuántas fotos dejó el service worker del menú Compartir para la receta nueva
 * que se está abriendo, todavía sin leer. Se leen una sola vez: un redibujado
 * del editor no las vuelve a sumar.
 */
let compartidasPorLeer = 0;
/**
 * La receta `.md` que llegó compartida. Vive mientras la ruta la nombra
 * (`recibida=1`): el editor la aplica al abrir, y en una receta nueva es
 * también la base de lo que el editor no muestra.
 */
let recibida: Receta | null = null;

/**
 * La base de una receta nueva: la recibida o pegada, o una vacía, siempre sin
 * depósito. Una receta nueva no tiene nada en Drive, y las fotos que traiga un
 * `.md` ajeno son de otra receta: contadas como suyas, guardar las daría por
 * sacadas y las mandaría a la papelera.
 */
const baseDeNueva = (): Receta => ({ ...(recibida ?? parse('')), fotos: [] });

/** La foto achicada; rechaza si el navegador no la decodifica. Sin opciones, al lado de Drive. */
const achicarFoto = (archivo: Blob, opciones?: OpcionesAchicar): Promise<Blob> =>
  achicar(archivo, () => document.createElement('canvas'), opciones);

const NO_SE_LEYO_UNA_FOTO = 'No se pudo leer una de las fotos.';

/**
 * Las fotos de Drive del depósito que se pudieron leer, en orden y con su
 * número, como archivos para mandarlas al agente. El archivo lleva el número
 * del depósito, el mismo con el que el pedido la nombra. Si no se pueden leer,
 * ninguna.
 */
async function fotosParaElAgente(fotos: readonly FotoDeReceta[]): Promise<{ n: number; id: string; archivo: File }[]> {
  const deDrive = [...fotos].sort((a, b) => a.n - b.n)
    .flatMap(f => { const id = idDeDrive(f.url); return id ? [{ n: f.n, id }] : []; });
  try {
    const blobs = await Promise.all(deDrive.map(f => imagenes.imagenDe(f.id)));
    return deDrive.flatMap((f, i) => {
      const b = blobs[i];
      return b ? [{ ...f, archivo: new File([b], `foto-${f.n}.jpg`, { type: b.type || 'image/jpeg' }) }] : [];
    });
  } catch (err) {
    console.error(err);
    return [];
  }
}

/** El modo cocina: paso actual, marcados, conmutador y pantalla encendida. */
const cocina = crearControlCocina();

/** La ficha de compartir de la receta abierta, o `null`. */
let compartiendo: EstadoCompartir | null = null;
/** El PDF ya armado, para *Enviar PDF* cuando Chrome perdió el toque: no se vuelve a generar. */
let pdfListo: File | null = null;
/** Lo que la ficha de compartir escucha. Con el PDF armándose, ninguna responde. */
const ACCIONES_DE_LA_FICHA = ['compartir', 'cerrar-compartir', 'compartir-pdf', 'enviar-pdf', 'compartir-link', 'compartir-texto'];

/** El mensaje de un error desconocido, sin asumir que es un Error. */

/** Lo que verificó el arranque, para la ficha «Al abrir» de Ajustes. */
const informeArranque = () =>
  estadoArranque?.estado === 'listo' ? estadoArranque.informe : null;

/** El aviso de la planilla `_indice` repetida, para Ajustes. Sólo existe con el arranque en 'listo'. */
const indiceDuplicado = () =>
  estadoArranque?.estado === 'listo' ? estadoArranque.indiceDuplicado : null;

/** Lo que el editor tiene escrito, como texto comparable. Los tags viajan en un campo oculto. */
const formularioActual = (): string => {
  const form = document.querySelector<HTMLFormElement>('[data-formulario]');
  return form ? JSON.stringify([...new FormData(form)]) : '';
};

/**
 * Los valores crudos del formulario. `FormData` da `string | File`; los campos
 * del editor son todos de texto, y un `File` acá sería un campo que alguien
 * agregó sin pasar por el editor.
 */
function datosDelFormulario(): DatosFormulario {
  const form = document.querySelector<HTMLFormElement>('[data-formulario]');
  if (!form) return {};
  return Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, typeof v === 'string' ? v : undefined]));
}

/** Recién dibujado, el editor no tiene cambios: su formulario es la foto contra la que se compara. */
const abrirEditor = (html: string): void => {
  pintar(html);
  editorAbierto = { hash: location.hash, formulario: formularioActual() };
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  // Si el botón sigue activo, el usuario nunca lo apagó: el bloqueo se
  // perdió al irse a segundo plano y hay que volver a pedirlo.
  const sol = document.querySelector<HTMLElement>('[data-accion="wake"].on');
  if (cocina.necesitaRepedir(!!sol)) void cocina.mantenerPantalla().then(() => render());
});

/**
 * Arranca la app. `pidiendoPermiso` es el toque del botón: el consentimiento
 * de Google se pide ahí y nunca al abrir (C05.7.1).
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
      // Cancelado o denegado: nunca se queda en «Conectando…» (C05.7.2).
      return pintar(renderConexion({ estado: 'cancelado' }));
    }
  }
  // Con `imagenes`, una foto recién subida entra al caché con el blob que ya
  // está en memoria, y una que va a la papelera sale.
  store = crearStore({ drive, sheets, indiceLocal, imagenes });
  estadoArranque = await store.arrancar();

  // Los tres estados que no llegan a 'listo' avisan en castellano, con su
  // control: ninguno muestra el mensaje crudo de Google (R1).
  if (estadoArranque.estado === 'elegir-carpeta') {
    selector.sugerencias = estadoArranque.sugerencias.map(c => ({ id: c.id, nombre: c.name ?? '' }));
    location.replace('#/carpeta');
    router.iniciar();
    return;
  }
  if (estadoArranque.estado === 'solo-lectura') {
    return pintar('<div class="cuerpo">' + aviso({
      texto: 'No se pudo conectar con Drive. Sin esa lectura no hay con qué dibujar.',
      accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
    }) + '</div>');
  }

  // Reindexar rearma el índice entero: cargarlo antes es leer de más, y una
  // planilla de un esquema viejo puede no tener todas sus hojas.
  if (estadoArranque.reconstruir) await reconstruir();
  else await store.cargarIndice();
  registrarCategorias(store.categorias());

  router.iniciar();
}

/** El contador del menú: las recetas con el tag `borrador`. */
const cuantosBorradores = (): number => store.buscar({ tags: ['borrador'] }).length;

/** Ajustes, igual al entrar que mientras reindexa: sólo cambia `reindexando`. */
function dibujarAjustes(): void {
  pintar(renderAjustes({
    cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados,
    indiceDuplicado: indiceDuplicado(), planDuplicado: store.planDuplicado(), reindexando,
    borradores: cuantosBorradores(), menuAbierto,
    informe: informeArranque(), recetas: store.entradas().length, categorias: store.categorias().length,
    carpeta: store.carpeta().nombre
  }));
}

/**
 * Reindexar lee todos los `.md` y rearma la planilla: es la reparación
 * universal. No se puede cancelar —cortar a mitad deja el índice en el estado
 * que el reindexado existe para reparar— y mientras corre no se guarda ni se
 * borra nada (C05.5.2).
 */
async function reconstruir({ enAjustes = false } = {}) {
  reindexando = 0;
  const dibujar = () => enAjustes
    ? dibujarAjustes()
    : pintar(renderConexion({ estado: 'creando-indice', ...(reindexando !== null ? { progreso: reindexando } : {}) }));

  dibujar();
  try {
    const r = await store.reconstruir(progreso => { reindexando = progreso; dibujar(); });
    ignorados = r.ignorados;
    registrarCategorias(store.categorias());
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
 * La lista que dibujan la categoría y la lista por tag: filtrada por duración y
 * ordenada. Sin fila de duraciones no hay conmutador para volver a A–Z, así que
 * ahí el orden por duración se ignora en vez de quedar pegado sin control.
 */
function listaOrdenada(porTags: Entrada[]): { entradas: Entrada[]; ordenEfectivo: Orden } {
  const ordenEfectivo: Orden = contarDuraciones(porTags).length || duracionesActivas.length ? orden : 'alfa';
  return { entradas: ordenarRecetas(filtrarPorDuracion(porTags, duracionesActivas), ordenEfectivo), ordenEfectivo };
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
  // La vista de invitado se elige una sola vez, al cargar (`inicio.ts`), y un
  // cambio de fragmento no recarga: el dueño que toca su propio link con la PWA
  // abierta vería el Recetario. Recargar deja que `inicio.ts` vuelva a decidir.
  if (esHashDeInvitado(location.hash)) { location.reload(); return; }
  const cambiaDePantalla = !vistaActual || ruta.vista !== vistaActual.vista
    || ruta.params.nombre !== vistaActual.params.nombre || ruta.params.id !== vistaActual.params.id;

  // Sin carpeta base no hay con qué dibujar ninguna otra pantalla.
  if (estadoArranque?.estado === 'elegir-carpeta' && ruta.vista !== 'carpeta') {
    location.replace('#/carpeta');
    return;
  }

  // Con la pantalla tapada no se navega: el resultado o el error tienen que
  // llegar a la pantalla que lanzó la escritura. Como el `hashchange` no se
  // puede cancelar, la URL vuelve a la de esa pantalla, igual que con el
  // editor. El hash es el de cuando se tapó: acá `location.hash` ya es el destino.
  if (tapadas && cambiaDePantalla) { history.pushState(null, '', hashEscritura); return; }

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
    if (!ruta.params['recibida']) recibida = null;
    compartidasPorLeer = ruta.vista === 'nueva' ? Number(ruta.params['fotos'] ?? 0) || 0 : 0;
    if (!PANTALLAS_DE_RECETA.includes(ruta.vista)) recetaLeida = null;
    // El aviso de una escritura que falló sobrevive a la navegación entre las
    // pantallas del plan: agregar escribe y cierra, y el aviso va en el plan.
    if (!PANTALLAS_DE_PLAN.includes(ruta.vista)) { planLeido = null; comprasLeidas = null; errorPlan = ''; }
    confirmandoReinicio = false;
    consultaPlan = '';
    categoriaPlan = null;
    tagsActivos = [];
    duracionesActivas = [];
    orden = 'alfa';
    visibles = TRAMO;
    // Navegar cierra el menú: se abrió para elegir a dónde ir.
    menuAbierto = false;
    // Salir de la pantalla de la carpeta la cierra: lo que se estaba por usar no sigue.
    selector.confirmando = null;
    selector.error = '';
    // Las imágenes de la pantalla anterior se sueltan: el visor es de esa pantalla.
    imagenes.soltarImagenes();
    visor = null;
    // Las fotos del editor viven lo que la pantalla: salir sin guardar no deja
    // nada en Drive, y volver a entrar abre con lo que dice el `.md`.
    fotosEditor.nuevas.clear();
    fotosEditor.urls.clear();
    fotosEditor.subidas.clear();
    fotoPropia = null;
    cocina.reiniciar();
    compartiendo = null;
    pdfListo = null;
    marcandoFavorito = false;
    errorFavorito = '';
    avisoDeLlegada = avisoAlLlegar;
    avisoAlLlegar = '';
    pedidoPendiente = pedidoAlLlegar;
    pedidoAlLlegar = null;
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
    case 'recetario':
      pintar(renderRecetario({
        categorias: store.categoriasConConteo(), borradores: cuantosBorradores(),
        menuAbierto, tags: store.tagsDe()
      }));
      return precargarElHome();

    case 'categoria': {
      const nombre = ruta.params['nombre'] ?? '';
      const porTags = store.buscar({ categoria: nombre, tags: tagsActivos });
      const { entradas, ordenEfectivo } = listaOrdenada(porTags);
      pintar(renderCategoria({
        nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos, tags: store.tagsDe(nombre),
        duraciones: contarDuraciones(porTags), duracionesActivas, orden: ordenEfectivo
      }));
      return observarTramo();
    }

    case 'tag':
    case 'borradores': {
      // Se llega tocando un chip del carrusel del Recetario: el tag tocado
      // entra como filtro igual que en la categoría, para poder sumarle otros.
      // Borradores es la misma lista con `borrador`, como destino del menú.
      const enElMenu = ruta.vista === 'borradores';
      const nombre = enElMenu ? 'borrador' : ruta.params['nombre'] ?? '';
      const activos = tagsActivos.includes(nombre) ? tagsActivos : [nombre, ...tagsActivos];
      const porTags = store.buscar({ tags: activos });
      const { entradas, ordenEfectivo } = listaOrdenada(porTags);
      pintar(renderTag({
        tag: nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos: activos, tags: store.tagsDe(),
        duraciones: contarDuraciones(porTags), duracionesActivas, orden: ordenEfectivo,
        ...(enElMenu ? { menu: { abierto: menuAbierto, borradores: cuantosBorradores() } } : {})
      }));
      return observarTramo();
    }

    case 'resultados': {
      const q = ruta.params['q'] ?? '';
      return pintar(renderResultados({ consulta: q, grupos: store.buscarPorTexto(q), orden }));
    }

    case 'receta':
      try {
        const { entrada, receta } = await recetaDePantalla(ruta.params['id'] ?? '');
        pintar(renderReceta({
          entrada, receta,
          ...(visor ? { visor } : {}),
          ...(compartiendo ? { compartir: compartiendo } : {}),
          ...(marcandoFavorito ? { favorito: 'escribiendo' as const } : {}),
          ...(errorFavorito ? { error: errorFavorito } : {}),
          ...(pedidoPendiente
            ? { aviso: {
                texto: 'La receta quedó guardada. Tocá para mandarla al agente.',
                accion: { etiqueta: 'Mandar al agente', accion: 'mandar-al-agente' }
              } }
            : avisoDeLlegada ? { aviso: { texto: avisoDeLlegada } } : {})
        }));
        return observarTitulo();
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'cocinar':
      try {
        const { receta } = await recetaDePantalla(ruta.params['id'] ?? '');
        return pintar(renderCocina({ receta, ...cocina.estado(), salidas: 'volver-y-salir' }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'ajustes':
      // El mail no lo guarda nadie: se lo pide a Drive una vez. Que falle no
      // rompe la pantalla, solo deja la línea de la cuenta vacía.
      if (!cuenta) cuenta = await drive.cuenta().catch(() => '');
      return dibujarAjustes();

    case 'carpeta': {
      const { error, ...resto } = selector;
      return pintar(renderSelector({
        ...resto,
        cambiando: ruta.params['cambiando'] === '1',
        // Sin API key el Picker no abre: queda sólo crear.
        conPicker: Boolean(API_KEY),
        ...(error ? { error } : {})
      }));
    }

    case 'categorias':
      return pintar(renderListaCategorias({
        categorias: store.categorias().map(categoria => ({ categoria, recetas: store.recetasDe(categoria.id).length }))
      }));

    case 'editar-categoria': {
      const id = ruta.params['id'] ?? 'nueva';
      const categoria = id === 'nueva' ? null : store.categorias().find(c => c.id === id) ?? null;
      // Un id que ya no está —borrada en otra pestaña— vuelve a la lista.
      if (id !== 'nueva' && !categoria) { irCerrando('#/categorias'); return; }
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      const valores = categoria
        ? { nombre: categoria.nombre, color: categoria.color, foto: categoria.foto }
        : { nombre: '', color: colorLibre(store.categorias().map(c => c.color)), foto: '' };
      return abrirEditor(renderEdicionCategoria({ categoria, valores, otros }));
    }

    case 'plan':
      try {
        const plan = await planDePantalla();
        return pintar(renderPlan({
          plan, entradas: store.entradas(), hoy: diaDeHoy(),
          borradores: cuantosBorradores(), menuAbierto,
          ...(confirmandoReinicio ? { confirmandoReinicio: true } : {}),
          ...(errorPlan ? { error: errorPlan } : {})
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer el plan.');
      }

    case 'plan-agregar':
      // El día y el momento ya vienen validados por el router: sin una comida
      // a la que sumar, la ruta cae en el plan.
      return pintar(renderPlanAgregar({
        dia: Number(ruta.params['dia'] ?? 0),
        momento: (ruta.params['momento'] ?? 'noche') as Momento,
        menuDiario: delMenuDiario(), categorias: store.categorias(),
        categoriaElegida: categoriaPlan, deLaCategoria: categoriaPlan ? delaCategoria(categoriaPlan) : [],
        consulta: consultaPlan, grupos: store.buscarPorTexto(consultaPlan)
      }));

    case 'plan-compras':
      try {
        const lista = await comprasDelPlan(await planDePantalla());
        return pintar(renderCompras({ lista, ...(compartiendo ? { compartir: compartiendo } : {}) }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo armar la lista de compras.');
      }

    case 'editar':
      try {
        const { entrada, receta } = await recetaDePantalla(ruta.params['id'] ?? '');
        // Una receta `.md` compartida con el id de ésta se aplica como Pegar,
        // sobre la copia leída: el archivo no cambia hasta Guardar.
        const conRecibida = ruta.params['recibida'] && recibida
          ? aplicarPegada(receta, recibida, entrada?.carpeta_id ?? '') : null;
        abrirEditor(renderEditor({
          entrada, receta: conRecibida ?? receta, categorias: store.categorias(),
          tagsConocidos: store.tagsDe().map(t => t.tag)
        }));
        // Lo recibido cuenta como cambio desde que se abre: la foto contra la
        // que se compara queda vacía, así que cualquier formulario difiere.
        if (conRecibida && editorAbierto) editorAbierto.formulario = '';
        return;
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'nueva': {
      const texto = ruta.params['text'] ?? '';
      // Lo compartido puede ser una receta `.md` que volvió del agente: no va
      // a las notas, se abre en el editor que le toca. Las fotos que llegaron
      // con ella no son de ninguna receta y se descartan.
      if (esRecetaEnMd(texto)) {
        compartidasPorLeer = 0;
        await imagenes.descartarCompartidas().catch(err => console.error(err));
        recibirReceta(texto);
        return;
      }
      const noSeLeyo = compartidasPorLeer ? await leerCompartidas() : false;
      // El mismo formulario que editar, sin entrada (todavía no hay archivo en
      // Drive) y con una receta vacía —o la recibida— en vez de una leída. Lo
      // compartido reparte el link a la fuente y el resto del texto a Notas.
      let receta: Receta;
      if (recibida) receta = baseDeNueva();
      else {
        const { fuente, nota } = desdeCompartido({ url: ruta.params['url'] ?? '', text: texto });
        receta = { ...parse(''), fuente: fuente || null, notas: nota };
      }
      // Las fotos compartidas, ya en memoria: el depósito las nombra como
      // nuevas y suben al guardar.
      receta.fotos = [...receta.fotos, ...[...fotosEditor.nuevas.keys()].map(n => ({ n, url: '' }))];
      // Una receta nace como borrador: sacar el tag es la declaración explícita
      // de que está terminada (C04.3b.1).
      receta.tags = conEspecial(receta.tags, 'borrador', true);
      abrirEditor(renderEditor({
        entrada: null, receta, categorias: store.categorias(),
        tagsConocidos: store.tagsDe().map(t => t.tag)
      }));
      // Lo que llegó de otra app cuenta como cambio desde que se abre: salir
      // sin guardar lo perdería.
      if (llegoDeAfuera(ruta) && editorAbierto) editorAbierto.formulario = '';
      if (noSeLeyo) avisarEnElFormulario(NO_SE_LEYO_UNA_FOTO);
      return;
    }
  }
}

/** El editor se abrió con algo que llegó de otra app: un link, un texto, fotos o una receta. */
const llegoDeAfuera = (ruta: Ruta | null): boolean =>
  ['url', 'text', 'fotos', 'recibida'].some(clave => !!ruta?.params[clave]);

/**
 * Las fotos que llegaron del menú Compartir: el service worker las dejó en su
 * caché. Se achican, quedan en memoria como fotos nuevas del editor, sin tope,
 * y el caché se vacía. Devuelve si alguna no se pudo leer.
 */
async function leerCompartidas(): Promise<boolean> {
  const cantidad = compartidasPorLeer;
  compartidasPorLeer = 0;
  let noSeLeyo = false;
  const destapar = tapar();
  try {
    const llegadas = await imagenes.fotosCompartidas(cantidad);
    await imagenes.descartarCompartidas();
    let deposito: FotoDeReceta[] = [];
    for (const archivo of llegadas) {
      let blob: Blob;
      try {
        blob = await achicarFoto(archivo);
      } catch (err) {
        console.error(err);
        noSeLeyo = true;
        continue;
      }
      const n = siguienteNumero(deposito);
      deposito = [...deposito, { n, url: '' }];
      fotosEditor.nuevas.set(n, blob);
      fotosEditor.urls.set(n, imagenes.urlDeBlob(blob));
    }
  } catch (err) {
    console.error(err);
    noSeLeyo = true;
  } finally {
    destapar();
  }
  return noSeLeyo;
}

/**
 * Una receta `.md` compartida va al editor de la receta de su `id` si existe;
 * si no, al de una receta nueva. Siempre con `replace`: la entrada del
 * historial es la que dejó el Share Target, y sin reemplazarla, volver caería
 * de nuevo en ella y reabriría la misma receta.
 */
function recibirReceta(texto: string): void {
  const { receta, id } = recetaRecibida(texto);
  recibida = receta;
  const existe = !!id && store.entradas().some(e => e.id_archivo === id);
  irCerrando(existe ? `#/r/${encodeURIComponent(id)}/editar?recibida=1` : '#/nueva?recibida=1');
}

/** Los especiales apretados y las pills, en el `hidden` que viaja en el formulario. */
function sincronizarTags(): void {
  const especiales = [...document.querySelectorAll<HTMLElement>('#app [data-accion="tag-especial"][aria-pressed="true"]')]
    .map(b => b.dataset['valor'] ?? '');
  const pills = [...document.querySelectorAll<HTMLElement>('[data-pills] [data-valor]')]
    .map(p => p.dataset['valor'] ?? '');
  const oculto = document.querySelector<HTMLInputElement>('input[name="tags"]');
  if (oculto) oculto.value = [...especiales, ...pills].filter(Boolean).join(', ');
}

/**
 * Vuelve a mirar si la receta del formulario puede sacarse `borrador`, y
 * habilita o bloquea su botón. Corre en cada tecla, así que toca el DOM en vez
 * de redibujar: redibujar perdería el foco y el cursor.
 */
function revisarBorrador(): void {
  const boton = document.querySelector<HTMLButtonElement>('#app [data-accion="tag-especial"][data-valor="borrador"]');
  if (!boton) return;
  const valor = (n: string): string =>
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `#app [name="${n}"]`)?.value ?? '';
  const puede = sePuedeTerminar(
    { titulo: valor('titulo'), ingredientes: valor('ingredientes'), preparacion: valor('preparacion') },
    valor('carpeta')
  );
  boton.disabled = !puede;
  const leyenda = document.querySelector<HTMLElement>('#app .leyenda-borrador');
  if (leyenda) leyenda.hidden = puede;
  // Si dejó de cumplir, la receta vuelve a quedar borrador.
  if (!puede && boton.getAttribute('aria-pressed') !== 'true') {
    boton.setAttribute('aria-pressed', 'true');
    sincronizarTags();
  }
}

/** Las cinco secciones de texto del editor, las que pueden nombrar una foto. */
const SECCIONES = ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas'] as const;

/** Lo que mide un renglón de un campo: `--txt-base` por la interlínea 1.5. */
const ALTO_RENGLON = 24;

/** Se está en el editor de una receta, la que sea: ahí nada se redibuja sin perder lo escrito. */
const enElEditor = (): boolean => vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva';

/** Un campo del formulario por su `name`, como lo hace `revisarBorrador`. */
const campoDelEditor = (nombre: string) =>
  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#app [name="${nombre}"]`);

/**
 * El depósito que el editor tiene escrito ahora: el campo oculto es la única
 * fuente. Un JSON que no se entiende cae en el depósito de la receta abierta y
 * no en uno vacío: vacío significa «las saqué a todas», y el store mandaría
 * esas fotos a la papelera.
 */
const depositoDelEditor = (): FotoDeReceta[] =>
  fotosDesde(campoDelEditor('fotos')?.value ?? '', recetaLeida?.receta.fotos ?? []);

/** El valor crudo de la cabecera: `foto:N`, una URL, o vacío. */
const portadaDelEditor = (): string => campoDelEditor('foto')?.value ?? '';

/**
 * La receta sobre la que escribe el formulario: lo que el editor no muestra
 * —`extras` y las secciones ajenas— sale de acá. En el alta es una vacía;
 * editando, la que se leyó. Es la misma base que
 * usa Guardar, salvo que ahí la de una receta existente se relee de Drive.
 */
const baseDelEditor = (): Receta => {
  if (vistaActual?.vista === 'nueva') return baseDeNueva();
  return recetaLeida?.receta ?? parse('');
};

/**
 * La receta como está escrita **ahora** en el formulario. La necesita lo que
 * depende de todo el texto y no de un campo solo: el uso de cada foto, que
 * mira la cabecera y **todas** las secciones, las ajenas incluidas.
 */
const recetaDelEditor = (): Receta => recetaDesdeFormulario(datosDelFormulario(), baseDelEditor());

/**
 * Escribe el depósito y redibuja sólo su fila de miniaturas: redibujar el
 * formulario entero perdería lo que se venía escribiendo. El campo se escribe
 * primero, así la fila sale con el uso de las fotos que quedaron.
 */
function escribirDeposito(fotos: FotoDeReceta[]): void {
  const campo = campoDelEditor('fotos');
  if (campo) campo.value = JSON.stringify(fotos);
  redibujarFilaDeFotos();
  // Sacar la última foto deja el botón de poner sin nada que ofrecer.
  acomodarBotonDeFoto();
}

/**
 * La fila de miniaturas de nuevo, con el uso de cada foto según lo que está
 * escrito ahora: la marca tiene que aparecer al elegir una portada o al poner
 * una foto en una línea, sin salir del editor.
 */
function redibujarFilaDeFotos(): void {
  const fila = document.querySelector<HTMLElement>('#app .fotos-campo');
  if (fila) fila.outerHTML = filaDeFotosEditor(recetaDelEditor());
  void completarFotos();
}

/** Escribe la cabecera y cambia su miniatura, también sin redibujar. */
function escribirPortada(valor: string): void {
  const campo = campoDelEditor('foto');
  if (campo) campo.value = valor;
  const boton = document.querySelector<HTMLElement>('#app .portada-boton');
  if (boton) boton.innerHTML = muestraDePortada(valor || null, depositoDelEditor());
  // La marca de portada de la fila cambia de foto junto con la cabecera.
  redibujarFilaDeFotos();
}

/**
 * El botón de poner una foto, a la altura de la línea donde está el cursor.
 * Se cuelga del marco del campo con foco y se saca de ahí en cada
 * movimiento: el formulario no se redibuja nunca, que perdería lo escrito.
 *
 * La altura sale del **espejo** del campo (`area`, `src/ui/editor.ts`): se le
 * escribe el texto hasta el cursor y se le pregunta dónde quedó la marca. Un
 * `textarea` no sabe decir en qué renglón está el cursor, y calcularlo con el
 * alto de línea daría mal en cuanto una línea larga ocupe dos renglones. Al
 * alto del espejo se le resta el scroll del campo, que es lo que corre el
 * texto cuando no entra entero.
 */
function acomodarBotonDeFoto(): void {
  document.querySelector('#app .poner-foto')?.remove();
  if (!enElEditor()) return;
  const campo = document.activeElement as HTMLTextAreaElement | null;
  const seccion = campo?.name ?? '';
  if (!(SECCIONES as readonly string[]).includes(seccion)) return;
  // Sin depósito no hay nada que poner, y el botón no se dibuja.
  if (!depositoDelEditor().length) return;
  const marco = document.querySelector(`#app [data-campo-texto="${seccion}"]`);
  const antes = marco?.querySelector('[data-antes]');
  const marca = marco?.querySelector<HTMLElement>('[data-marca]');
  if (!marco || !antes || !marca) return;
  const texto = campo?.value ?? '';
  const posicion = campo?.selectionStart ?? texto.length;
  antes.textContent = texto.slice(0, posicion);
  const altura = Math.round(marca.offsetTop - (campo?.scrollTop ?? 0));
  // El campo scrolleado puede dejar el renglón del cursor arriba o abajo de lo
  // que se ve: ahí no hay dónde poner el botón, y dibujarlo lo tiraría encima
  // de lo que haya afuera del campo.
  const visible = campo?.clientHeight ?? 0;
  if (altura + ALTO_RENGLON <= 0 || altura >= visible) return;
  // Y el renglón a medio entrar se recorta, para que el botón quede adentro.
  const tope = Math.min(Math.max(altura, 0), Math.max(visible - ALTO_RENGLON, 0));
  marco.insertAdjacentHTML('beforeend', botonPonerFoto(seccion, lineaDelCursor(texto, posicion), tope));
}

/** Las fichas al pie del editor y el velo con el que se cierran. */
const FICHAS_DE_FOTO =
  '#app [data-acciones-foto], #app [data-elegir-foto], #app [data-selector-portada], ' +
  '#app [data-foto-url], #app .velo[data-accion="cerrar-ficha-foto"]';

/** Saca del DOM la ficha que esté abierta, sin tocar el formulario. */
function cerrarFichaFoto(): void {
  for (const e of document.querySelectorAll(FICHAS_DE_FOTO)) e.remove();
}

/**
 * Abre una ficha al pie: siempre una sola, como la hoja de Compartir. Se
 * cuelga del formulario del editor, que no se redibuja; la ficha es fija
 * (`tokens.css`), así que de dónde cuelgue no le cambia nada.
 */
function abrirFichaFoto(html: string): void {
  cerrarFichaFoto();
  document.querySelector('[data-formulario]')?.insertAdjacentHTML('beforeend', html);
  void completarFotos();
}

/**
 * Un aviso arriba del formulario —el de las fotos, o el de Pegar—, que
 * aparece y se va sin redibujarlo: en el editor redibujar perdería lo escrito,
 * y en la categoría apagaría Guardar hasta la próxima tecla.
 */
function avisarEnElFormulario(texto: string): void {
  document.querySelector('#app [data-aviso-fotos]')?.remove();
  if (!texto) return;
  document.querySelector('[data-formulario]')
    ?.insertAdjacentHTML('afterbegin', `<div data-aviso-fotos>${aviso({ texto })}</div>`);
  // Arriba del formulario, con la ficha Fotos al fondo, el aviso queda fuera de
  // pantalla; nadie lo redibuja, así que se lo trae acá (R1).
  mirarElAviso();
}

/**
 * Suma fotos al depósito del editor, achicadas y en memoria hasta Guardar.
 * Cada una toma el número siguiente: ninguno se reusa, ni siquiera el de una
 * que se sacó.
 */
async function agregarFotosAlEditor(archivos: Blob[]): Promise<void> {
  let deposito = depositoDelEditor();
  let noSeLeyo = false;
  // Una sola vez el velo, aunque se elijan cinco fotos.
  const destapar = tapar();
  try {
    for (const archivo of archivos) {
      let blob: Blob;
      try {
        blob = await escribiendo(achicarFoto(archivo));
      } catch (err) {
        console.error(err);
        noSeLeyo = true;
        continue;
      }
      const n = siguienteNumero(deposito);
      deposito = [...deposito, { n, url: '' }];
      fotosEditor.nuevas.set(n, blob);
      fotosEditor.urls.set(n, imagenes.urlDeBlob(blob));
    }
  } finally {
    destapar();
  }
  escribirDeposito(deposito);
  avisarEnElFormulario(noSeLeyo ? NO_SE_LEYO_UNA_FOTO : '');
}

/**
 * Suma una foto al depósito del editor con el número que le toca. Con `blob`
 * es una foto que todavía no está en Drive —vive en memoria y sube al
 * guardar—; sin él, la línea es un link externo, que el `.md` acepta como
 * cualquier otra.
 */
function sumarFotoAlEditor(url: string, blob?: Blob): void {
  const deposito = depositoDelEditor();
  const n = siguienteNumero(deposito);
  if (blob) {
    fotosEditor.nuevas.set(n, blob);
    fotosEditor.urls.set(n, imagenes.urlDeBlob(blob));
  }
  escribirDeposito([...deposito, { n, url }]);
}

const NO_ES_UNA_FOTO = 'Esa URL no es una foto.';
const SOLO_HTTPS = 'La dirección tiene que empezar con https://.';
const QUEDA_COMO_LINK =
  'No se pudo traer la foto —el sitio no lo permite o no hay conexión—: ' +
  'queda como link, y si el sitio la borra se pierde.';

/**
 * La forma que tiene que tener una dirección para poder ser una línea del
 * depósito, **tal cual la parsea `fotos-receta.ts`**: esquema en minúsculas y
 * ni un espacio. Una que no la cumpla se escribiría igual y al releer el `.md`
 * dejaría toda la sección `## Fotos` como sección ajena: la receta perdería
 * sus fotos (C05.1.5).
 */
const URL_DE_FOTO = /^https?:\/\/\S+$/;

/**
 * La dirección con el esquema en minúsculas, que es lo único que se normaliza:
 * el resto distingue mayúsculas y cambiarlo daría otra foto. El teclado del
 * teléfono manda `Https://` solo, y quien lo escribió quiso lo evidente.
 */
const conEsquemaEnMinuscula = (url: string): string =>
  url.replace(/^[A-Za-z]+:\/\//, e => e.toLowerCase());

/** Lo que devolvió una dirección: la foto, algo que no es una foto, o nada. */
type FotoTraida = { que: 'foto'; blob: Blob } | { que: 'no-es-foto' } | { que: 'no-se-pudo' };

/** Lo que se espera a un sitio ajeno antes de darlo por perdido. */
const CORTE_DE_TRAIDA = 20_000;

/**
 * Baja la foto de una dirección. Una página que contesta 200 con HTML no es
 * una foto, y por eso se mira el `Content-Type` antes que nada.
 *
 * Que `fetch` ni conteste es lo habitual —CORS, que es lo que hacen Instagram
 * y tantos otros—, y sin red pasa lo mismo: no hay forma de distinguirlos
 * desde el navegador, y en los dos casos la salida es la misma, quedarse con
 * la URL como link.
 *
 * **El pedido se corta solo.** Es el único pedido a un sitio ajeno que tapa la
 * pantalla (R8), y un servidor que acepta y nunca contesta dejaría el editor
 * tapado sin salida: salir sería recargar, y con eso se va lo escrito.
 */
async function traerFoto(url: string): Promise<FotoTraida> {
  const corte = new AbortController();
  const reloj = setTimeout(() => { corte.abort(); }, CORTE_DE_TRAIDA);
  try {
    const r = await fetch(url, { signal: corte.signal });
    if (!r.ok) return { que: 'no-es-foto' };
    if (!(r.headers.get('Content-Type') ?? '').startsWith('image/')) return { que: 'no-es-foto' };
    return { que: 'foto', blob: await r.blob() };
  } catch {
    return { que: 'no-se-pudo' };
  } finally {
    clearTimeout(reloj);
  }
}

/**
 * Lo que dio pedir una foto por su dirección: la foto ya achicada, la
 * dirección que no se pudo bajar —normalizada, lista para escribirse donde el
 * formato la acepte—, o el motivo por el que no sirve.
 */
type PedidoDeFoto =
  | { que: 'foto'; blob: Blob }
  | { que: 'link'; url: string }
  | { que: 'error'; mensaje: string };

/**
 * Pide la foto de una dirección escrita a mano y la deja lista para agregar.
 * Las salidas son tres: la foto bajada, un link que no se pudo bajar, o un
 * error.
 */
async function pedirFotoPorUrl(escrita: string): Promise<PedidoDeFoto> {
  const url = conEsquemaEnMinuscula(escrita);
  // Lo que ni siquiera tiene forma de dirección no se pide. En la receta, además,
  // es lo único que se puede escribir como línea del depósito (C05.1.5).
  if (!URL_DE_FOTO.test(url)) return { que: 'error', mensaje: NO_ES_UNA_FOTO };
  // Desde Pages, una `http://` es contenido mixto: el pedido falla siempre y
  // la imagen tampoco cargaría después. Entra como link y no sirve de nada.
  if (url.startsWith('http://')) return { que: 'error', mensaje: SOLO_HTTPS };
  const traida = await escribiendo(traerFoto(url));
  if (traida.que === 'no-es-foto') return { que: 'error', mensaje: NO_ES_UNA_FOTO };
  if (traida.que === 'no-se-pudo') return { que: 'link', url };
  try {
    return { que: 'foto', blob: await escribiendo(achicarFoto(traida.blob)) };
  } catch (err) {
    console.error(err);
    return { que: 'error', mensaje: NO_SE_LEYO_UNA_FOTO };
  }
}

/**
 * *Traer* en la ficha de una foto por URL. Sólo el editor la dibuja: caer al
 * editor desde una pantalla sin depósito sería escribir en un formulario que
 * no existe.
 */
async function agregarFotoPorUrl(escrita: string): Promise<void> {
  if (enElEditor()) return agregarFotoPorUrlAlEditor(escrita);
  return;
}

/** Abre la ficha de *Por URL*. El aviso de un intento anterior se va al traer la próxima. */
function abrirFotoPorUrl(): void {
  abrirFichaFoto(renderFotoPorUrl());
}

/**
 * En el editor, la foto bajada entra al depósito por el mismo camino que una
 * de la cámara. Lo que no se pudo bajar entra como link externo —el `.md` de
 * la receta acepta una URL ajena como cualquier otra—, y lo que no es una foto
 * no entra y deja la ficha abierta con lo escrito.
 */
async function agregarFotoPorUrlAlEditor(escrita: string): Promise<void> {
  // Cada intento empieza sin el aviso del anterior: dos avisos a la vez no
  // dicen cuál es el de ahora.
  avisarEnElFormulario('');
  // El aviso vuelve con lo que se escribió, y no con lo normalizado: lo que el
  // usuario escribió sigue en pantalla (R1).
  const pedido = await pedirFotoPorUrl(escrita);
  if (pedido.que === 'error') return abrirFichaFoto(renderFotoPorUrl(escrita, pedido.mensaje));
  if (pedido.que === 'link') {
    sumarFotoAlEditor(pedido.url);
    cerrarFichaFoto();
    // No es un error del usuario: la foto entró, y el aviso dice con qué.
    return avisarEnElFormulario(QUEDA_COMO_LINK);
  }
  sumarFotoAlEditor('', pedido.blob);
  cerrarFichaFoto();
}

/**
 * La receta con el link de cada foto que un intento anterior ya subió.
 * Su línea deja de estar vacía, así que el reintento la escribe en el `.md` y
 * no la vuelve a mandar como nueva.
 */
const conSubidas = (receta: Receta): Receta => ({
  ...receta,
  fotos: receta.fotos.map(f => {
    const id = f.url ? undefined : fotosEditor.subidas.get(f.n);
    return id ? { ...f, url: linkDeFoto(id) } : f;
  })
});

/**
 * Lo que el depósito cambió respecto del `.md` que el editor abrió: las que
 * hay que subir y las URLs que ya no están. Cada subida se anota apenas el store avisa, para el reintento.
 */
function cambiosDeFotos(nueva: Receta, base: Receta): CambiosDeFotos {
  const nuevas = new Map<number, Blob>();
  for (const f of nueva.fotos) {
    const blob = f.url ? undefined : fotosEditor.nuevas.get(f.n);
    if (blob) nuevas.set(f.n, blob);
  }
  const urls = new Set(nueva.fotos.map(f => f.url));
  return {
    nuevas,
    sacadas: base.fotos.map(f => f.url).filter(url => !urls.has(url)),
    alSubir: (n, id) => { fotosEditor.subidas.set(n, id); }
  };
}

/** Las fotos del depósito que se pueden mostrar: la subida, o la que está en memoria. */
const fotosMostrables = (fotos: FotoDeReceta[]): { n: number; url: string }[] =>
  fotos.flatMap(f => {
    const url = f.url || fotosEditor.urls.get(f.n) || '';
    return url ? [{ n: f.n, url }] : [];
  });

/**
 * Abre el visor con **lo que se tocó**: `fotos` es la tira que
 * recorre —las del carrusel en la lectura, el depósito entero en el editor—.
 * Una foto que no está en esa tira —la portada, la de un paso— se abre sola,
 * con la URL que venga en `suelta`.
 */
function abrirVisor(fotos: FotoDeReceta[], n: number | undefined, suelta?: string | undefined): void {
  const lista = fotosMostrables(fotos);
  const i = n === undefined ? -1 : lista.findIndex(f => f.n === n);
  if (i >= 0) visor = { urls: lista.map(f => f.url), i };
  else if (suelta) visor = { urls: [suelta], i: 0 };
}

/**
 * El visor en pantalla. En el editor se agrega y se saca del DOM, como las
 * fichas: redibujar el formulario perdería lo escrito.
 */
function dibujarVisor(): void {
  if (!enElEditor()) { void render(); return; }
  document.querySelector('#app .visor')?.remove();
  if (visor) document.querySelector('[data-formulario]')?.insertAdjacentHTML('beforeend', renderVisor(visor));
  void completarFotos();
}

/**
 * La edición de una categoría, en cada tecla y en cada elección: la muestra de
 * arriba, la línea del nombre inválido y si Guardar se puede tocar. Toca el DOM
 * en vez de redibujar, que perdería el foco y el cursor.
 */
function revisarCategoria(): void {
  // Sin el `#app `: el formulario se busca igual que en `formularioActual` y
  // en `dibujarVisor`, que es el mismo formulario.
  const form = document.querySelector<HTMLFormElement>('[data-formulario]');
  if (!form) return;
  const valor = (n: string): string => form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value ?? '';
  const otros = JSON.parse(form.dataset['otros'] ?? '[]') as string[];
  const problema = problemaDelNombre(valor('nombre'), otros);

  const muestra = form.querySelector<HTMLElement>('[data-muestra]');
  if (muestra) {
    muestra.style.setProperty('--c', colorDeClave(valor('color')));
    // Como `muestraCategoria` (`gestion-categorias.ts`): con `imgDe`, para
    // que una foto propia de Drive también se pueda mostrar.
    const im = muestra.querySelector<HTMLElement>('.im');
    const url = urlDeFoto(valor('foto'));
    if (im) { im.classList.toggle('trama', !url); im.innerHTML = url ? imgDe(url) : ''; }
    const nm = muestra.querySelector<HTMLElement>('.nm');
    if (nm) nm.textContent = valor('nombre');
  }
  const linea = form.querySelector<HTMLElement>('.error-nombre');
  if (linea) { linea.hidden = !problema; linea.textContent = problema; }
  const guardar = document.querySelector<HTMLButtonElement>('#app [data-accion="guardar-categoria"]');
  if (guardar) guardar.disabled = !!problema || formularioActual() === editorAbierto?.formulario;
}

/** Lo que el formulario de la categoría tiene escrito. */
const valoresDeCategoria = (): { nombre: string; color: string; foto: string } => {
  const datos = datosDelFormulario();
  return { nombre: datos['nombre'] ?? '', color: datos['color'] ?? '', foto: datos['foto'] ?? '' };
};

/** La edición de la categoría con lo que está escrito y, si hay, un aviso. */
function dibujarCategoria(valores: { nombre: string; color: string; foto: string }, error: string): void {
  const id = vistaActual?.params['id'] ?? 'nueva';
  pintar(renderEdicionCategoria({
    categoria: id === 'nueva' ? null : store.categorias().find(c => c.id === id) ?? null,
    valores, otros: store.categorias().filter(c => c.id !== id).map(c => c.nombre),
    ...(error ? { error } : {})
  }));
}

/** Elegir un color o una foto: el campo oculto, la marca y la muestra, sin redibujar. */
function elegirEnCategoria(campo: 'color' | 'foto', valor: string): void {
  const oculto = document.querySelector<HTMLInputElement>(`#app input[name="${campo}"]`);
  if (oculto) oculto.value = valor;
  for (const b of document.querySelectorAll<HTMLElement>(`#app [data-accion="elegir-${campo}"]`)) {
    b.setAttribute('aria-pressed', String(b.dataset['valor'] === valor));
  }
  revisarCategoria();
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
  // Los especiales tienen su botón y terminado contradice a borrador: no se escriben a mano.
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
 * cocina a la receta, salir a la categoría, o dejar la receta recién guardada
 * en lugar del editor. Con `location.hash =` el historial acumula la pantalla
 * que se está dejando, y el volver de la siguiente trae de vuelta justo eso:
 * el chevron de la receta llevaría al modo cocina.
 */
const irCerrando = (hash: string): void => { location.replace(hash); };

/**
 * Manda el pedido al agente y dice cómo salió: mandado —o cancelado por el
 * usuario, que es su decisión—, copiado para pegar, o no salió: sin la
 * activación del toque, el navegador no deja abrir el menú Compartir ni la
 * ventana de claude.ai, y el pedido espera otro toque.
 */
async function mandarAlAgente(envio: PedidoAlAgente): Promise<'mandado' | 'copiado' | 'no-salio'> {
  try {
    const r = await enviarAlAgente(plataformaDelNavegador(), envio.pedido, envio.fotos);
    if (r === 'copiado') return 'copiado';
    if (r === 'sin-activacion' || r === 'sin-portapapeles') return 'no-salio';
    return 'mandado';
  } catch (err) {
    console.error(err);
    return 'no-salio';
  }
}

/**
 * Guarda lo que el editor tiene escrito: crea el `.md` o reescribe el abierto,
 * con su fila. Devuelve el id y la receta guardada, con el dibujo del tilde en
 * curso; `null` si no escribió nada —la validación o un error—, y en ese caso
 * el editor ya está redibujado con lo escrito y el aviso (C04.5.2).
 */
async function guardarEditor(
  boton: HTMLElement
): Promise<{ id: string; receta: Receta; dibujado: Promise<void> } | null> {
  if (!document.querySelector('[data-formulario]')) return null;
  // El velo antes que nada: entre el toque y la escritura hay una relectura
  // del `.md` de base, que es un pedido a Drive, y la validación puede
  // devolver el editor sin escribir nada. Se suelta por cualquier
  // camino, así que no queda pegado.
  const destapar = tapar();
  let guardada: { id: string; receta: Receta } | null = null;
  let dibujado: Promise<void> = Promise.resolve();
  try {
    const datos = datosDelFormulario();
    // `''` es «Sin categoría»: la receta va a `_sin-categoria/`.
    const carpetaId = datos['carpeta'] ?? '';
    const esNueva = vistaActual?.vista === 'nueva';
    const id = idActual();

    // Mientras trabaja, el botón lo dice y no se puede tocar dos veces (C04.5.1).
    boton.setAttribute('disabled', '');
    boton.textContent = 'Guardando…';

    const base = esNueva ? baseDeNueva() : (await store.receta(id)).receta;
    const escrita = conSubidas(recetaDesdeFormulario(datos, base));
    // Un borrador puede no tener título todavía: se guarda con el día y la
    // hora, y el nombre del archivo sale de ahí.
    const nueva = !escrita.titulo && tieneEspecial(escrita, 'borrador')
      ? { ...escrita, titulo: tituloPorDefecto(new Date()) } : escrita;

    /** El editor otra vez, con lo que el usuario tenía escrito y el aviso (C04.5.2). */
    const conError = (mensaje: string): null => {
      pintar(renderEditor({
        entrada: esNueva ? null : store.entradas().find(e => e.id_archivo === id) ?? null,
        // Con las fotos que este intento alcanzó a subir ya en sus líneas: el
        // reintento las manda por su link en vez de volver a subirlas.
        receta: conSubidas(escrita), carpeta: carpetaId, categorias: store.categorias(),
        tagsConocidos: store.tagsDe().map(t => t.tag), error: mensaje
      }));
      return null;
    };

    if (!nueva.titulo) return conError('Ponele un título antes de guardar.');

    // Lo que el depósito cambió respecto del `.md` que se abrió: el store sube,
    // mueve y manda a la papelera.
    const fotos = cambiosDeFotos(nueva, base);

    try {
      if (esNueva) {
        const creada = await escribiendo(store.crear(nueva, carpetaId ? { carpetaId, fotos } : { fotos }));
        guardada = { id: creada.id, receta: conSubidas(nueva) };
      } else {
        await escribiendo(store.guardar(id, nueva, { carpetaDestino: carpetaId, fotos }));
        guardada = { id, receta: conSubidas(nueva) };
        // Lo guardado es la copia: volver a la receta la muestra sin releer, y
        // con el link de cada foto que se acaba de subir en su línea.
        recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta: guardada.receta };
      }
      editorAbierto = null;
    } catch (err) {
      console.error(err);
      return conError(porQueNoGuardo(err));
    }
  } finally {
    // El tilde sólo cuando se escribió: ni la validación ni el error llegan a
    // `guardada`, y ahí el velo se va solo, sin tilde.
    dibujado = destapar({ exito: guardada !== null });
  }
  return guardada ? { ...guardada, dibujado } : null;
}

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  // Con la pantalla tapada no responde nada: el velo ya tapa los controles, y
  // esto cubre lo que llegue igual.
  if (tapadas) return;
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const boton = destino?.closest<HTMLElement>('[data-accion], [data-tag]') ?? null;
  // Una foto en línea del texto no lleva `data-accion` —la dibuja el markdown,
  // que no sabe de acciones— y abre el visor igual. Se abre **sola**: lo
  // que se tocó es esa foto, no una tira. En el modo cocina no: ahí la
  // foto está adentro del paso, que sí lleva acción, y un toque marca dónde voy.
  if (!boton && destino && recetaLeida) {
    const enLinea = destino.closest<HTMLElement>('.foto-linea');
    const img = enLinea?.querySelector<HTMLElement>('img');
    if (!img) return;
    const id = img.dataset['drive'] ?? '';
    const suelta = id ? linkDeFoto(id) : img.getAttribute('src') ?? '';
    if (!suelta) return;
    visor = { urls: [suelta], i: 0 };
    return render();
  }
  if (!boton) return;

  if (boton.dataset['tag']) {
    const tag = boton.dataset['tag'];
    // Desde el Recetario el carrusel no filtra nada ahí mismo: navega a la
    // lista por tag, que es donde ese chip tiene algo que mostrar.
    if (vistaActual?.vista === 'recetario') { location.hash = `#/t/${encodeURIComponent(tag)}`; return; }
    tagsActivos = tagsActivos.includes(tag) ? tagsActivos.filter(t => t !== tag) : [...tagsActivos, tag];
    visibles = TRAMO;
    return render();
  }

  const accion = boton.dataset['accion'];

  if (accion === 'filtrar-duracion') {
    const valor = boton.dataset['valor'] ?? '';
    duracionesActivas = duracionesActivas.includes(valor)
      ? duracionesActivas.filter(d => d !== valor) : [...duracionesActivas, valor];
    visibles = TRAMO;
    return render();
  }
  if (accion === 'ordenar') {
    orden = boton.dataset['valor'] === 'duracion' ? 'duracion' : 'alfa';
    visibles = TRAMO;
    return render();
  }

  // Mientras se arma el PDF la ficha no acepta otro toque: cerrar con el velo
  // no frena `generar`, y al terminar el PDF se mandaría igual.
  if (compartiendo?.paso === 'generando' && ACCIONES_DE_LA_FICHA.includes(accion ?? '')) return;

  if (accion === 'compartir') {
    compartiendo = { paso: 'opciones' };
    // Lo pesado del PDF empieza a bajar ya: el toque que lo genera es otro.
    void precargar().catch(() => {});
    return render();
  }
  if (accion === 'cerrar-compartir') {
    compartiendo = null;
    pdfListo = null;
    return render();
  }
  if (accion === 'compartir-pdf' || accion === 'enviar-pdf') {
    if (!recetaLeida) return;
    const { entrada, receta } = recetaLeida;
    if (accion === 'compartir-pdf' || !pdfListo) {
      compartiendo = { paso: 'generando' };
      await render();
      // Si mientras se armaba se navegó, `render` ya cerró la ficha: el PDF es
      // de una pantalla que no está, y aplicarlo mostraría «listo» en otra receta.
      const sigueGenerando = (): boolean => compartiendo?.paso === 'generando';
      try {
        // El PDF lleva las fotos adentro: las de Drive salen del caché de
        // `imagenes`, y el canvas para achicarlas es el mismo de siempre.
        const blob = await generar(receta, entrada?.categoria ?? '', {
          imagenDe: id => imagenes.imagenDe(id),
          achicar: (foto, maximo) => achicarFoto(foto, { maximo })
        });
        if (!sigueGenerando()) return;
        pdfListo = new File([blob], slugArchivo(receta.titulo).replace(/\.md$/, '.pdf'), { type: 'application/pdf' });
      } catch (err) {
        console.error(err);
        if (!sigueGenerando()) return;
        compartiendo = { paso: 'error-pdf' };
        return render();
      }
    }
    try {
      const r = await compartirPdf(plataformaDelNavegador(), pdfListo);
      compartiendo = r === 'sin-activacion' ? { paso: 'pdf-listo' } : null;
    } catch (err) {
      console.error(err);
      compartiendo = { paso: 'error-pdf' };
    }
    if (!compartiendo) pdfListo = null;
    return render();
  }
  if (accion === 'compartir-compras') {
    // La lista se comparte sólo como texto: no es una receta y no tiene link.
    compartiendo = { paso: 'opciones', solo: 'texto' };
    return render();
  }
  if (accion === 'compartir-texto' && vistaActual?.vista === 'plan-compras') {
    const contenido = textoCompras(comprasLeidas?.lista ?? { conCantidad: [], sinCantidad: [] });
    try {
      const r = await compartirTexto(plataformaDelNavegador(), contenido);
      compartiendo = r === 'copiado' ? { paso: 'copiado', que: 'texto' }
        : r === 'sin-portapapeles' ? { paso: 'mostrar', que: 'texto', contenido }
        : null;
    } catch (err) {
      console.error(err);
      compartiendo = { paso: 'mostrar', que: 'texto', contenido };
    }
    return render();
  }
  if (accion === 'compartir-link' || accion === 'compartir-texto') {
    if (!recetaLeida) return;
    const { entrada, receta } = recetaLeida;
    const categoria = entrada?.categoria ?? '';
    const que = accion === 'compartir-link' ? 'link' : 'texto';
    let contenido = '';
    try {
      const plataforma = plataformaDelNavegador();
      contenido = que === 'link' ? urlDeLink(await codificar(receta, categoria)) : textoReceta(receta, categoria);
      const r = que === 'link'
        ? await compartirLink(plataforma, receta.titulo ?? '', contenido)
        : await compartirTexto(plataforma, contenido);
      compartiendo = r === 'copiado' ? { paso: 'copiado', que }
        : r === 'sin-portapapeles' ? { paso: 'mostrar', que, contenido }
        : null;
    } catch (err) {
      console.error(err);
      compartiendo = contenido ? { paso: 'mostrar', que, contenido } : null;
    }
    return render();
  }
  if (accion === 'favorito') {
    const id = idActual();
    const actual = recetaLeida?.receta;
    if (!id || !actual || marcandoFavorito) return;

    // El resultado se dibuja recién cuando Drive contesta: mientras tanto, la
    // estrella muestra que está escribiendo y no acepta otro toque.
    marcandoFavorito = true;
    errorFavorito = '';
    await render();

    const nueva = { ...actual, tags: conEspecial(actual.tags, 'favorito', !esFavorita(actual)) };
    try {
      await store.guardar(id, nueva);
      recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta: nueva };
    } catch (err) {
      console.error(err);
      errorFavorito = 'No se pudo marcar como favorita. Revisá la conexión.';
    }
    marcandoFavorito = false;
    return render();
  }
  if (accion === 'cocinar') {
    cocina.entrarDesdeLectura();
    location.hash = `#/r/${idActual()}/cocinar`;
    return;
  }
  if (accion === 'conmutar') {
    const volverA = cocina.conmutar(boton.dataset['posicion'], window.scrollY);
    if (volverA === null) return;
    await render();
    window.scrollTo(0, volverA);
    return;
  }
  if (accion === 'paso') {
    // Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
    // hecho y el hilo sigue al siguiente.
    if (cocina.marcarPaso(boton.dataset['paso'])) return render();
    return;
  }
  if (accion === 'wake') {
    await cocina.alternarPantalla();
    return render();
  }

  if (accion === 'carrusel-izq' || accion === 'carrusel-der') {
    desplazarCarrusel(boton, accion);
    return;
  }

  // El plan: el `+` de una celda, la tarjeta que suma, la cruz que saca una
  // línea, y reiniciar. Cada cambio escribe en el momento.
  if (accion === 'agregar-al-plan') {
    const dia = boton.dataset['dia'] ?? '';
    const momento = boton.dataset['momento'] ?? '';
    location.hash = `#/plan/agregar?dia=${encodeURIComponent(dia)}&momento=${encodeURIComponent(momento)}`;
    return;
  }
  if (accion === 'elegir-categoria-plan') {
    categoriaPlan = boton.dataset['nombre'] ?? '';
    return render();
  }
  if (accion === 'volver-categorias-plan') {
    categoriaPlan = null;
    return render();
  }
  if (accion === 'elegir-para-el-plan') {
    const id = boton.dataset['id'] ?? '';
    const entrada = store.entradas().find(e => e.id_archivo === id);
    if (!entrada) return;
    const dia = Number(vistaActual?.params['dia'] ?? 0);
    const momento: Momento = vistaActual?.params['momento'] === 'mediodia' ? 'mediodia' : 'noche';
    // El plan puede no estar leído todavía, y leerlo es otro pedido a Drive
    // antes de escribir: la pantalla se tapa desde el toque.
    const destapar = tapar();
    try {
      const plan = await planDePantalla();
      // Agregar suma al final: la misma receta dos veces se permite, y cada
      // línea tiene su cruz.
      await guardarPlan({ comidas: [...plan.comidas, { dia, momento, id, titulo: entrada.titulo }] });
    } catch (err) {
      console.error(err);
      errorPlan = 'No se pudo guardar el plan. Revisá la conexión.';
    } finally {
      destapar();
    }
    // Esta pantalla se cierra al elegir: volver tiene que dejar el plan.
    irCerrando('#/plan');
    return render();
  }
  if (accion === 'sacar-del-plan') {
    const i = Number(boton.dataset['i'] ?? -1);
    const plan = planLeido;
    if (!plan || !Number.isInteger(i) || i < 0 || i >= plan.comidas.length) return;
    await guardarPlan({ comidas: plan.comidas.filter((_, n) => n !== i) });
    return render();
  }
  if (accion === 'reiniciar-plan') { confirmandoReinicio = true; return render(); }
  if (accion === 'cancelar-reinicio') { confirmandoReinicio = false; return render(); }
  if (accion === 'reiniciar-plan-confirmado') {
    await guardarPlan({ comidas: [] });
    confirmandoReinicio = false;
    return render();
  }
  if (accion === 'ir-a-compras') { location.hash = '#/plan/compras'; return; }

  if (accion === 'abrir-menu') { menuAbierto = true; return render(); }
  if (accion === 'cerrar-menu') { menuAbierto = false; return render(); }
  if (accion === 'limpiar') {
    // Vacía la caja y deja el cursor ahí. No navega: buscar vacío no hace nada,
    // y salir de los resultados es el chevron.
    const campo = document.querySelector<HTMLInputElement>('#app [data-accion="buscar"]');
    if (campo) { campo.value = ''; campo.focus?.(); }
    return;
  }
  if (accion === 'reindexar') return reconstruir({ enAjustes: true });
  if (accion === 'conectar') return arrancar({ pidiendoPermiso: true });
  if (accion === 'cambiar-carpeta') {
    location.hash = '#/carpeta?cambiando=1';
    return;
  }
  if (accion === 'carpeta-sugerida') {
    selector.confirmando = { id: boton.dataset['id'] ?? '', nombre: boton.dataset['nombre'] ?? '' };
    return render();
  }
  if (accion === 'carpeta-elegir') {
    try {
      const elegida = await elegirCarpeta(await auth.token());
      // Cerró la ventana sin elegir: nada cambia, ni siquiera la pantalla.
      if (!elegida) return;
      selector.confirmando = elegida;
    } catch (err) {
      console.error(err);
      selector.error = 'No se pudo abrir el selector de Google.';
    }
    return render();
  }
  if (accion === 'carpeta-cancelar') { selector.confirmando = null; return render(); }
  // Crear no confirma: el botón ya dice qué carpeta y dónde. Queda como
  // `confirmando` igual, para que un fallo del setup se pueda reintentar sobre
  // la carpeta que ya se creó y no cree otra.
  if (accion === 'carpeta-crear') {
    try {
      selector.confirmando = await escribiendo(store.crearCarpeta(NOMBRE_RAIZ, 'root'));
    } catch (err) {
      console.error(err);
      selector.error = 'No se pudo crear la carpeta.';
      return render();
    }
    return usarCarpeta(selector.confirmando);
  }
  if (accion === 'carpeta-confirmar') {
    if (!selector.confirmando) return;
    return usarCarpeta(selector.confirmando);
  }
  if (accion === 'borrar-datos-locales') {
    // Recargar y no seguir: lo que hay en memoria salió de esa copia, y la
    // próxima escritura la volvería a guardar igual.
    indiceLocal.borrar();
    await Promise.all([imagenes.borrarImagenes(), imagenes.descartarCompartidas()]);
    location.reload();
    return;
  }
  if (accion === 'salir') {
    auth.olvidar();
    // La copia tiene títulos e ingredientes: después de Salir no queda nada
    // del usuario en el navegador. Y se recarga, porque el índice y la receta
    // abierta también viven en memoria: sin recargar, la próxima pantalla los
    // volvería a dibujar. Las fotos guardadas en el navegador tampoco quedan.
    indiceLocal.borrar();
    await Promise.all([imagenes.borrarImagenes(), imagenes.descartarCompartidas()]);
    irCerrando('#/');
    location.reload();
    return;
  }
  if (accion === 'cerrar-visor') {
    // Un deslizamiento termina en un click: ese no cierra, ya cambió de foto.
    if (deslizoElVisor) { deslizoElVisor = false; return; }
    visor = null;
    if (enElEditor()) { document.querySelector('#app .visor')?.remove(); return; }
    return render();
  }

  // Las fotos de una receta. El depósito sale del campo oculto en el
  // editor y de la receta leída en la lectura: son la misma acción y el mismo
  // `data-n` en la cabecera, la galería y la ficha de acciones.
  if (accion === 'ver-foto-receta') {
    const marca = boton.dataset['n'];
    const n = marca === undefined ? undefined : Number(marca);
    if (enElEditor()) {
      cerrarFichaFoto();
      abrirVisor(depositoDelEditor(), n);
      dibujarVisor();
      return;
    }
    if (!recetaLeida) return;
    const receta = resolverReceta(recetaLeida.receta);
    // El carrusel son las sin uso, calculadas sobre la cruda: desde ahí el
    // visor las recorre. La portada no está ahí y se abre sola.
    const sola = (n === undefined ? undefined : receta.fotos.find(f => f.n === n)?.url) ?? receta.foto ?? undefined;
    abrirVisor(fotosSinUso(recetaLeida.receta), n, sola);
    return render();
  }
  if (accion === 'cerrar-ficha-foto') {
    cerrarFichaFoto();
    // Tocar el velo puede haberle sacado el foco al campo: el botón de la
    // foto no puede quedar colgado de un campo que ya no lo tiene.
    acomodarBotonDeFoto();
    return;
  }
  if (accion === 'acciones-foto') {
    const n = boton.dataset['n'] ?? '';
    abrirFichaFoto(renderAccionesFoto(Number(n)));
    return;
  }
  if (accion === 'abrir-portada') {
    abrirFichaFoto(renderSelectorPortada(depositoDelEditor(), portadaDelEditor() || null));
    return;
  }
  if (accion === 'elegir-portada') {
    escribirPortada(`foto:${boton.dataset['n'] ?? ''}`);
    cerrarFichaFoto();
    return;
  }
  if (accion === 'sin-portada') { escribirPortada(''); cerrarFichaFoto(); return; }
  if (accion === 'abrir-foto-url') return abrirFotoPorUrl();
  if (accion === 'traer-foto-url') {
    const url = document.querySelector<HTMLInputElement>('#app [data-url-foto]')?.value.trim() ?? '';
    if (url) await agregarFotoPorUrl(url);
    return;
  }
  if (accion === 'abrir-elegir-foto') {
    // La sección y la línea son las que tenía el botón: las escribió
    // `acomodarBotonDeFoto` con el cursor donde estaba.
    abrirFichaFoto(renderElegirFoto(
      depositoDelEditor(), boton.dataset['seccion'] ?? '', Number(boton.dataset['linea'] ?? 0)
    ));
    return;
  }
  if (accion === 'poner-en') {
    const campo = campoDelEditor(boton.dataset['seccion'] ?? '');
    if (campo) {
      campo.value = ponerEn(campo.value, Number(boton.dataset['linea'] ?? 0), Number(boton.dataset['n'] ?? 0));
    }
    // Ahora está en el texto, y su miniatura lo dice.
    redibujarFilaDeFotos();
    cerrarFichaFoto();
    return;
  }
  if (accion === 'sacar-foto-editor') {
    const n = Number(boton.dataset['n'] ?? 0);
    // La foto se va del depósito y de todo el texto que la nombraba. El texto
    // primero: la fila se redibuja con el uso de las que quedaron.
    for (const seccion of SECCIONES) {
      const campo = campoDelEditor(seccion);
      if (campo) campo.value = sacarReferencias(campo.value, n);
    }
    if (portadaDelEditor() === `foto:${n}`) escribirPortada('');
    escribirDeposito(depositoDelEditor().filter(f => f.n !== n));
    fotosEditor.nuevas.delete(n);
    fotosEditor.urls.delete(n);
    cerrarFichaFoto();
    return;
  }

  if (accion === 'convertir-con-agente') {
    // Guarda y después manda: el pedido lleva el id del `.md`, que en una
    // receta nueva recién existe al crearla. Si no se guardó, no se manda nada.
    const guardada = await guardarEditor(boton);
    if (!guardada) return;
    const { id, receta } = guardada;
    // Las fotos que el agente puede leer son las de Drive que se pudieron
    // leer, en el orden del depósito y con su número: la receta que vuelve las
    // nombra con ese número.
    const leidas = await fotosParaElAgente(receta.fotos);
    const numeradas = leidas.map(({ n, id }) => ({ n, id }));
    const datos = { id, titulo: receta.titulo ?? '', fuente: receta.fuente ?? '', notas: receta.notas };
    const envio: PedidoAlAgente = {
      pedido: pedidoDeConversion(datos, { fotos: numeradas }),
      fotos: leidas.length
        ? { archivos: leidas.map(f => f.archivo), conLinks: pedidoDeConversion(datos, { fotos: numeradas, links: true }) }
        : null
    };
    const r = await mandarAlAgente(envio);
    if (r === 'copiado') avisoAlLlegar = PEDIDO_COPIADO;
    if (r === 'no-salio') pedidoAlLlegar = envio;
    // La receta ya está guardada: el editor se cierra y la app queda en ella.
    // Editando, la receta es la pantalla de atrás; si no, la receta toma el
    // lugar del editor en el historial.
    await guardada.dibujado;
    esperarPintadoParaSacarElVelo();
    if (vistaActual?.vista === 'editar' && !llegoDeAfuera(vistaActual)) history.back();
    else irCerrando(`#/r/${encodeURIComponent(id)}`);
    return;
  }

  if (accion === 'mandar-al-agente') {
    // El mismo pedido que no salió, con la activación de este toque.
    const envio = pedidoPendiente;
    if (!envio) return;
    const r = await mandarAlAgente(envio);
    if (r !== 'no-salio') pedidoPendiente = null;
    avisoDeLlegada = r === 'copiado' ? PEDIDO_COPIADO : '';
    return render();
  }

  if (accion === 'pegar-receta') {
    if (!enElEditor()) return;
    const texto = await leerPortapapeles(plataformaDelNavegador());
    // El aviso va arriba del formulario sin redibujarlo: lo escrito sigue ahí.
    if (texto === null) return avisarEnElFormulario('No se pudo leer lo copiado.');
    if (!esRecetaEnMd(texto)) return avisarEnElFormulario('Lo copiado no es una receta en .md.');
    // El `id` que traiga se ignora: se pega en el editor abierto.
    const { receta: pegada } = recetaRecibida(texto);
    const datos = datosDelFormulario();
    const carpeta = datos['carpeta'] ?? '';
    const actual = recetaDesdeFormulario(datos, baseDelEditor());
    // En una receta nueva, lo pegado es también la base de lo que el editor
    // no muestra, como lo recibido por Compartir.
    if (vistaActual?.vista === 'nueva') recibida = pegada;
    // Sin `abrirEditor`: la foto contra la que se comparan los cambios sigue
    // siendo la de antes, y salir sin guardar pregunta.
    pintar(renderEditor({
      entrada: vistaActual?.vista === 'editar' ? recetaLeida?.entrada ?? null : null,
      receta: aplicarPegada(actual, pegada, carpeta), carpeta,
      categorias: store.categorias(), tagsConocidos: store.tagsDe().map(t => t.tag)
    }));
    return;
  }

  if (accion === 'tag-especial') {
    if (boton.hasAttribute('disabled')) return;
    boton.setAttribute('aria-pressed', String(boton.getAttribute('aria-pressed') !== 'true'));
    sincronizarTags();
    return;
  }

  if (accion === 'elegir-duracion') {
    const valor = boton.dataset['valor'] ?? '';
    const puesto = boton.getAttribute('aria-pressed') !== 'true';
    for (const b of document.querySelectorAll<HTMLElement>('#app [data-accion="elegir-duracion"]')) {
      b.setAttribute('aria-pressed', String(puesto && b === boton));
    }
    const oculto = document.querySelector<HTMLInputElement>('#app input[name="tiempo"]');
    if (oculto) { oculto.value = puesto ? valor : ''; oculto.setAttribute('value', oculto.value); }
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
    await cocina.soltarPantalla();
    if (cocina.salirALectura() === 'atras') return history.back();
    // Se entró al modo cocina por un link directo: no hay receta atrás.
    irCerrando(`#/r/${encodeURIComponent(idActual())}`);
    return;
  }
  if (accion === 'salir-cocina') {
    await cocina.soltarPantalla();
    cocina.olvidarLectura();
    const entrada = store.entradas().find(e => e.id_archivo === idActual());
    // Sin fila del índice no se sabe de qué categoría es: se vuelve al Recetario.
    irCerrando(entrada?.categoria ? `#/c/${encodeURIComponent(entrada.categoria)}` : '#/');
    return;
  }

  if (accion === 'volver') {
    if (vistaActual?.vista === 'cocinar') await cocina.soltarPantalla();
    if (history.length <= 1) {
      // Entrar por un link directo deja el historial vacío: ahí volver es ir
      // al Recetario, no salirse de la app.
      location.hash = '#/';
      return;
    }
    return history.back();
  }
  if (accion === 'editar') { location.hash = `#/r/${idActual()}/editar`; return; }
  if (accion === 'seguir-editando') {
    document.querySelector('[data-salida]')?.remove();
    return;
  }
  if (accion === 'salir-sin-guardar') {
    editorAbierto = null;
    // Mismo caso que arriba: sin entrada previa —el editor que abrió lo
    // compartido desde otra app— volver no puede intentar salir de la app
    // (C01.2.2); cierra al Recetario.
    if (history.length <= 1) { irCerrando('#/'); return; }
    return history.back();
  }
  if (accion === 'conectar-de-nuevo') {
    // No se redibuja: en el editor lo escrito vive sólo en el formulario (R3).
    // Conectado, el aviso se va y se guarda a mano; si no, queda donde está.
    try {
      await auth.conectar();
      document.querySelector('[data-sin-sesion]')?.remove();
    } catch (err) {
      console.error(err);
    }
    return;
  }
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

  if (accion === 'elegir-color') { elegirEnCategoria('color', boton.dataset['valor'] ?? ''); return; }
  if (accion === 'elegir-foto') { elegirEnCategoria('foto', boton.dataset['valor'] ?? ''); return; }

  if (accion === 'guardar-categoria') {
    if (!document.querySelector('[data-formulario]')) return;
    const valores = valoresDeCategoria();
    const id = vistaActual?.params['id'] ?? 'nueva';
    // La foto propia se manda sólo si se eligió un archivo en esta pantalla:
    // cambiar el color o el nombre no vuelve a subir nada.
    const propia = valores.foto.startsWith('propia:') ? fotoPropia?.blob : undefined;
    const datos = {
      ...valores,
      foto: valores.foto.startsWith('propia:') ? '' : valores.foto,
      ...(propia ? { fotoPropia: propia } : {})
    };
    try {
      if (id === 'nueva') await escribiendo(store.crearCategoria(datos));
      else await escribiendo(store.editarCategoria(id, datos));
      registrarCategorias(store.categorias());
      editorAbierto = null;
      return history.back();
    } catch (err) {
      console.error(err);
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      // El motivo del nombre se dice tal cual; lo demás, sin el mensaje de Google (R1).
      const mensaje = err instanceof Error && problemaDelNombre(valores.nombre, otros) ? err.message : 'No se pudo guardar. Revisá la conexión.';
      dibujarCategoria(valores, mensaje);
      return;
    }
  }

  if (accion === 'borrar-categoria') {
    const id = idActual();
    const categoria = store.categorias().find(c => c.id === id);
    if (categoria) boton.outerHTML = confirmacionBorrarCategoria(categoria.nombre, store.recetasDe(id).map(e => e.titulo));
    return;
  }
  if (accion === 'cancelar-borrar-categoria') {
    const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
    if (confirmacion) confirmacion.outerHTML = botonBorrarCategoria;
    return;
  }
  if (accion === 'borrar-categoria-confirmado') {
    const id = idActual();
    try {
      await escribiendo(store.borrarCategoria(id));
      registrarCategorias(store.categorias());
      editorAbierto = null;
      irCerrando('#/categorias');
      return;
    } catch (err) {
      console.error(err);
      const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
      if (confirmacion) confirmacion.outerHTML = aviso({ texto: 'No se pudo borrar. La categoría sigue estando.' }) + botonBorrarCategoria;
      return;
    }
  }

  if (accion === 'guardar') {
    const guardada = await guardarEditor(boton);
    if (!guardada) return;
    // El orden que se ve: la olla revolviendo, el tilde, y recién después la
    // pantalla nueva. Por eso se espera a que el tilde esté dibujado antes de
    // navegar —la pantalla ya no está tapada, así que navegar se puede— y el
    // velo se saca cuando esa pantalla ya se pintó, con el repintado tapado.
    await guardada.dibujado;
    esperarPintadoParaSacarElVelo();
    // Lo escrito ya está en Drive, así que salir no tiene nada que preguntar.
    // El editor que abrió algo compartido no tiene pantalla atrás —la entrada
    // del historial es la del Share Target—: cierra en la receta guardada.
    if (llegoDeAfuera(vistaActual)) irCerrando(`#/r/${encodeURIComponent(guardada.id)}`);
    else history.back();
    return;
  }

  // La confirmación toma el lugar del botón, y el botón el de la confirmación:
  // redibujar el editor perdería lo escrito y la foto contra la que se
  // comparan los cambios sin guardar.
  if (accion === 'borrar') { boton.outerHTML = confirmacionBorrado(recetaLeida?.receta.titulo ?? null); return; }
  if (accion === 'cancelar-borrado') {
    const confirmacion = document.querySelector('[data-confirmar-borrado]');
    if (confirmacion) confirmacion.outerHTML = botonBorrar;
    return;
  }
  if (accion === 'borrar-confirmado') {
    const id = idActual();
    try {
      await escribiendo(store.borrar(id));
      editorAbierto = null;
      // Vuelve a la lista de donde se venía; el archivo queda en la papelera
      // de Drive, que es la red de seguridad y es del usuario. Y la receta
      // borrada no queda en el historial.
      irCerrando('#/');
      return;
    } catch (err) {
      console.error(err);
      // El aviso va donde estaba la pregunta, y el botón vuelve: lo escrito en
      // el formulario sigue ahí (R1).
      const confirmacion = document.querySelector('[data-confirmar-borrado]');
      if (confirmacion) confirmacion.outerHTML = aviso({ texto: 'No se pudo borrar. La receta sigue estando.' }) + botonBorrar;
      return;
    }
  }

  // Reintentar es volver a pedir: lo leído no se reutiliza.
  if (accion === 'reintentar') {
    recetaLeida = null; selector.error = '';
    return render();
  }
});

/**
 * Lo que se escribe vive en el DOM y no en el estado: redibujar en cada tecla
 * perdería el foco y el cursor. Lo que se sigue tecla a tecla toca el DOM
 * directo, sin volver a pintar la pantalla.
 */
app.addEventListener('input', (e) => {
  if (tapadas) return;
  // En la pantalla de agregar al plan se redibuja sólo el bloque de abajo:
  // repintar la pantalla entera perdería el foco del teclado.
  if (vistaActual?.vista === 'plan-agregar') {
    const caja = e.target as HTMLInputElement | null;
    if (caja?.dataset?.['accion'] !== 'buscar-en-plan') return;
    consultaPlan = caja.value;
    // Escribir es dejar la categoría elegida: son dos formas de filtrar y no
    // conviven en el mismo bloque.
    categoriaPlan = null;
    const bloque = document.querySelector('[data-resultados-plan]');
    if (bloque) {
      bloque.innerHTML = bloqueDeAgregar({
        menuDiario: delMenuDiario(), categorias: store.categorias(),
        categoriaElegida: null, deLaCategoria: [],
        consulta: consultaPlan, grupos: store.buscarPorTexto(consultaPlan)
      });
    }
    return;
  }
  if (vistaActual?.vista === 'editar-categoria') return revisarCategoria();
  // En el editor, cada tecla puede habilitar o bloquear el botón de
  // `borrador`, y mueve el cursor de línea.
  if (enElEditor()) { revisarBorrador(); acomodarBotonDeFoto(); }
});

/**
 * Las pantallas que dibujan el menú lateral: sólo ahí se desliza para abrirlo,
 * y sólo ahí el encabezado lleva la hamburguesa en vez del volver. El botón lo
 * decide a mano cada `ui/*.ts`, así que la lista se exporta para que un test
 * recorra las cuatro y compruebe que ninguna se desalineó del gesto.
 */
export const PANTALLAS_CON_MENU: readonly Ruta['vista'][] = ['recetario', 'borradores', 'plan', 'ajustes'];

/** El deslizamiento en curso: dónde empezó, si ya se sabe que es gesto, y cuánto va abierto. */
let deslizando: { x: number; y: number; decidido: 'indeciso' | 'horizontal' | 'vertical'; p: number } | null = null;

/** Desde 900 px el menú es fijo (`base.css`): no hay nada que abrir. */
const menuFijo = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;

/** El menú y el velo al ritmo del dedo, sin transición; con `null` vuelven a lo que diga el CSS. */
function seguirDedo(p: number | null): void {
  const lat = document.querySelector<HTMLElement>('#app .lat');
  const velo = document.querySelector<HTMLElement>('#app .velo-lat');
  if (lat) {
    lat.style.transition = p === null ? '' : 'none';
    lat.style.transform = p === null ? '' : `translateX(${(p - 1) * 100}%)`;
  }
  if (velo) {
    velo.style.transition = p === null ? '' : 'none';
    velo.style.opacity = p === null ? '' : String(p * 0.6);
  }
}

/** Las dos filas que se desplazan de costado: el carrusel (`tokens.css`) y la fila de duraciones (`base.css`). Una que entra entera no cuenta: no hay nada que mover. */
function sobreFilaDeslizable(destino: EventTarget | null): boolean {
  const fila = conClosest(destino)?.closest<HTMLElement>('.carrusel, .fila-dur');
  return !!fila && fila.scrollWidth > fila.clientWidth;
}

// Deslizar para abrir o cerrar el menú, como en una app nativa. Los listeners
// son pasivos: un deslizamiento vertical tiene que seguir desplazando la página.
//
// Van en `document` y no en `#app`: el gesto es de la pantalla entera, y una
// pantalla que no llega abajo —Borradores con pocos, sin ir más lejos— deja
// debajo del contenido un área que no es de `#app`, donde el toque no llegaría
// a ningún lado.
document.addEventListener('touchstart', (e) => {
  if (tapadas) return;
  deslizando = null;
  visorDesde = null;
  deslizoElVisor = false;
  const toques = (e as TouchEvent).touches;
  const toque = toques[0];
  if (!toque || toques.length !== 1) return;
  // Con el visor abierto, el dedo pasa de una foto a la siguiente y no abre
  // el menú: es lo único que se puede hacer ahí.
  if (visor) { visorDesde = toque.clientX; return; }
  if (!vistaActual || !PANTALLAS_CON_MENU.includes(vistaActual.vista) || menuFijo()) return;
  if (!puedeEmpezar(toque.clientX, menuAbierto, sobreFilaDeslizable(e.target))) return;
  deslizando = { x: toque.clientX, y: toque.clientY, decidido: 'indeciso', p: menuAbierto ? 1 : 0 };
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (tapadas) return;
  const toque = (e as TouchEvent).touches[0];
  if (!deslizando || !toque) return;
  const dx = toque.clientX - deslizando.x;
  const dy = toque.clientY - deslizando.y;
  if (deslizando.decidido === 'indeciso') deslizando.decidido = direccion(dx, dy);
  if (deslizando.decidido === 'vertical') { deslizando = null; return; }
  if (deslizando.decidido !== 'horizontal') return;
  deslizando.p = progreso(dx, menuAbierto);
  seguirDedo(deslizando.p);
}, { passive: true });

const soltarDeslizamiento = (): void => {
  if (tapadas || !deslizando) return;
  const { decidido, p } = deslizando;
  deslizando = null;
  if (decidido !== 'horizontal') return;
  seguirDedo(null);
  const abrir = seAbre(p);
  // Si vuelve a donde estaba, el CSS lo reacomoda con su transición.
  if (abrir === menuAbierto) return;
  menuAbierto = abrir;
  void render();
};
document.addEventListener('touchend', soltarDeslizamiento);
document.addEventListener('touchcancel', soltarDeslizamiento);

// El visor pasa de una foto a la otra con el dedo. Va aparte del
// gesto del menú: ahí el deslizamiento arrastra el panel al ritmo del dedo, y
// acá la foto cambia de una vez, al soltar.
document.addEventListener('touchend', (e) => {
  if (tapadas || visorDesde === null || !visor) return;
  const toque = (e as TouchEvent).changedTouches[0];
  const desde = visorDesde;
  visorDesde = null;
  if (!toque) return;
  const i = pasoDelVisor(visor.i, toque.clientX - desde, visor.urls.length);
  if (i === visor.i) return;
  visor = { ...visor, i };
  deslizoElVisor = true;
  dibujarVisor();
});

app.addEventListener('keydown', (e) => {
  if (tapadas) return;
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

/**
 * El cursor se movió: el botón de la foto va a la línea nueva. Es el
 * único aviso que da el navegador cuando el cursor cambia de lugar, venga de
 * un toque, de una tecla o de las manijas de la selección.
 */
document.addEventListener('selectionchange', () => {
  if (tapadas) return;
  acomodarBotonDeFoto();
});

/**
 * El foco pasó a otro control: si no es una sección, el botón de la foto se
 * va. No todo cambio de foco mueve el cursor, así que no alcanza con
 * `selectionchange`.
 */
app.addEventListener('focusin', () => {
  if (tapadas) return;
  acomodarBotonDeFoto();
});

/**
 * Deslizar adentro del campo corre el texto sin mover el cursor: el botón
 * tiene que seguirlo, o queda clavado en un renglón que ya no es el suyo. El
 * oyente va en captura porque el `scroll` de un campo no burbujea.
 */
app.addEventListener('scroll', () => {
  if (tapadas) return;
  acomodarBotonDeFoto();
}, true);

/**
 * Tocar el botón de la foto **no mueve el foco**: sin esto, el navegador se lo
 * saca al campo y el botón desaparece entre el toque y el click —en el Safari
 * de iOS el foco ni siquiera llega al botón—, así que el toque se pierde.
 */
app.addEventListener('pointerdown', (e) => {
  if (tapadas) return;
  if (!conClosest(e.target)?.closest('.poner-foto')) return;
  e.preventDefault();
});

// Salir del campo con algo escrito lo agrega igual: no se pierde por
// distraerse y tocar Guardar.
app.addEventListener('focusout', (e) => {
  if (tapadas) return;
  const campo = (e.target as HTMLInputElement | null);
  if (!campo?.dataset || !('tagNuevo' in campo.dataset)) return;
  if (agregarTag(campo.value)) campo.value = '';
});

/**
 * Una foto externa cuya URL no carga: la app se entera por el `error`
 * del `<img>`, que no burbujea —de ahí la escucha en captura— y se trata como
 * una de Drive que ya no está. Las de Drive no pasan por acá: salen sin `src`
 * y las resuelve `completarFotos`.
 */
app.addEventListener('error', (e) => {
  const img = conClosest(e.target);
  if (img?.tagName === 'IMG') sacarFoto(img, FOTO_ROTA);
}, true);

app.addEventListener('change', (e) => {
  if (tapadas) return;
  // *Cámara* o *Galería*: el selector del sistema devolvió los archivos.
  const campoFotos = e.target as HTMLInputElement | null;
  if (campoFotos?.dataset && 'fotos' in campoFotos.dataset) {
    const archivos: Blob[] = Array.from(campoFotos.files ?? []);
    // El editor no se redibuja: perdería lo escrito. La fila de miniaturas
    // se rehace sola.
    if (enElEditor()) void agregarFotosAlEditor(archivos);
    return;
  }
  // *Subir foto* en una categoría: una sola, y se sube recién al guardar.
  if (campoFotos?.dataset && 'fotoPropia' in campoFotos.dataset) {
    const archivo = Array.from(campoFotos.files ?? [])[0];
    if (!archivo) return;
    void (async () => {
      try {
        const blob = await escribiendo(achicarFoto(archivo));
        fotoPropia = { blob, url: imagenes.urlDeBlob(blob) };
        // Queda elegida como cualquier otra: el campo oculto la nombra, y de
        // ahí salen la muestra de arriba y «cambios sin guardar».
        elegirEnCategoria('foto', `propia:${fotoPropia.url}`);
        avisarEnElFormulario('');
      } catch (err) {
        console.error(err);
        avisarEnElFormulario(NO_SE_LEYO_UNA_FOTO);
      }
    })();
    return;
  }
  // La categoría es un select: cambia por `change`, no por `input`.
  if (vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva') revisarBorrador();
  // Mismo motivo que en `conClosest`: nada de instanceof contra globales del
  // navegador, que en los tests no existen.
  const campo = e.target as HTMLInputElement | null;
  if (campo?.dataset?.['accion'] !== 'buscar') return;
  const q = campo.value.trim();
  // Con la caja vacía no se busca, y no se avisa: no hay nada que decir.
  if (!q) return;
  location.hash = `#/buscar?q=${encodeURIComponent(q)}`;
});

// Lo que llega desde el menú Compartir de Android viene en la query: se pasa
// a la receta nueva y se limpia la URL, para que recargar no lo vuelva a abrir.
const compartido = hashDeCompartido(location.search);
if (compartido) history.replaceState(null, '', location.pathname + compartido);

arrancar().catch(err => {
  console.error(err);
  pintar('<div class="cuerpo">' + aviso({
    texto: 'No se pudo abrir el Recetario.',
    accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
  }) + '</div>');
});

// El caché de fotos deja de ser desalojable con la PWA instalada: en Android,
// Chrome lo concede solo. Se pide una vez y no se mira el resultado —que no se
// conceda no cambia nada— ni se espera.
if (typeof navigator !== 'undefined') void navigator.storage?.persist?.().catch(() => {});

// `main.ts` se carga con `import()` desde `inicio.ts`, no con un `<script>`
// directo: puede llegar después de `load`, y ahí `addEventListener('load', …)`
// no dispara nunca y el service worker no se registra.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const registrarSW = (): void => { navigator.serviceWorker.register('./sw.js').catch(console.error); };
  if (document.readyState === 'complete') registrarSW();
  else window.addEventListener('load', registrarSW);
}
