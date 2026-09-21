import { crearAuth, ErrorDeAuth } from './auth.js';
import { crearDrive, ErrorDeDrive } from './drive.js';
import { crearSheets, ErrorDeSheets } from './sheets.js';
import { crearStore } from './store.js';
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
  renderAccionesFoto, renderPonerEn, renderSelectorPortada, filaDeFotosEditor, muestraDePortada, fotosDesde
} from './ui/editor.js';
import { renderBorradores, renderBorrador, renderPreguntaBorrador } from './ui/borradores.js';
import { renderPlan } from './ui/plan.js';
import { renderPlanAgregar, bloqueDeAgregar } from './ui/plan-agregar.js';
import { renderCompras } from './ui/compras.js';
import { diaDeHoy } from './plan.js';
import { listaDeCompras, textoCompras } from './compras.js';
import type { ListaDeCompras } from './compras.js';
import { renderCaptura } from './ui/captura.js';
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
import { pintar as pintarEnPantalla, conClosest } from './ui/pintar.js';
import { renderVisor, pasoDelVisor } from './ui/visor.js';
import {
  linkDeFoto, idDeDrive, resolverReceta, siguienteNumero, lineasDeLaReceta, ponerEn, sacarReferencias
} from './fotos-receta.js';
import { crearControlCocina } from './cocina-control.js';
import { registrarCategorias } from './ui/categorias.js';
import { convertirBorrador } from './compartido.js';
import { pedidoDeConversion, esRecetaEnMd, recetaRecibida } from './conversion.js';
import { precargar, generar } from './pdf/generar.js';
import { compartirPdf, compartirLink, compartirTexto, plataformaDelNavegador, enviarAClaude, leerPortapapeles } from './compartir.js';
import { codificar, urlDeLink } from './link-receta.js';
import { textoReceta } from './texto-receta.js';
import type { EstadoCompartir } from './ui/compartir.js';
import type { RecetaCreada } from './compartido.js';
import type { Ruta } from './ui/router.js';
import { desdeCompartido, tituloPorDefecto, sePuedeGuardar, MAXIMO_FOTOS } from './borrador.js';
import { achicar } from './fotos.js';
import type { OpcionesAchicar } from './fotos.js';
import { crearImagenes, conTope } from './imagenes.js';
import type { DatosFormulario } from './ui/editor.js';
import type { EstadoVisor } from './ui/visor.js';
import type { ResultadoArranque, Progreso } from './store.js';
import type { Borrador, CambiosDeFotos, Entrada, FotoDeReceta, Momento, Plan, Receta } from './tipos.js';

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
 * Nada espera a una imagen para dibujarse (spec §6): una foto de Drive sale
 * como `<img data-drive>` sin `src` —un recuadro del mismo tamaño— y una foto
 * nueva del editor como `<img data-n>`, y acá se les pone el `src` cuando el
 * blob está. Envuelve a `pintar` en vez de repetirse en cada pantalla: son
 * treinta llamadas y ninguna tiene que acordarse.
 */
const pintar = (html: string): void => {
  pintarEnPantalla(html);
  void completarFotos();
};

/**
 * Las fotos que la pantalla dejó pedidas. Las del editor salen del blob que
 * está en memoria; las de Drive, del caché o de la red. Una de Drive que ya no
 * está pasa al recuadro de aviso si es de una grilla, y no se dibuja en
 * ningún otro lado (spec §6). Las de Drive van de a dos, como la precarga: de
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
 * La foto que no se va a ver: en una grilla deja su recuadro con el motivo, y
 * en cualquier otro lado —la cabecera, un paso, una lista— el bloque no se
 * dibuja. En una lista, abajo queda el placeholder de la categoría.
 */
function sacarFoto(img: Element, recuadro: string): void {
  if (img.closest('.galeria-item, .miniatura')) img.outerHTML = recuadro;
  else img.remove();
}

let store: Store;
/**
 * Lo que una conversión de borrador ya creó, por si hay que reintentarla
 * (C01.7.1). Vive acá y no en cada Guardar: si el borrado del borrador falla,
 * el segundo intento tiene que reescribir el `.md` que ya existe, no crear otro.
 */
const convertidos = new Map<string, RecetaCreada>();
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
/** El id de la ruta que se está mirando: la receta, el borrador o la categoría. */
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

/** Lo que se está por descartar o borrar pide confirmación antes (C01.6.2, C04.6.1). */
let confirmandoDescarte = false;
/** El borrador se edita con el mismo formulario con el que se creó, precargado. */
let editandoBorrador = false;
/**
 * La pregunta de salir sin guardar vino del volver del encabezado, que cierra
 * la edición y deja el borrador, y no del gesto de atrás, que se va de él.
 */
let cerrandoEdicion = false;

/** Deja de editar el borrador: sin foto del formulario, ya no hay cambios que cuidar. */
const cerrarEdicion = (): void => {
  editandoBorrador = false;
  cerrandoEdicion = false;
  editorAbierto = null;
};
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
 * El borrador abierto, leído de su `.md` una vez. Mismo criterio que la
 * receta: lo reutilizan los redibujados —confirmar el descarte, Editar, un
 * error— y crear la receta desde él. Salir a otra pantalla lo descarta. La
 * lista y el contador no leen nada: salen del índice en memoria.
 */
let borradorLeido: Borrador | null = null;
const PANTALLAS_DE_BORRADOR: readonly Ruta['vista'][] = ['borrador', 'nueva'];

/**
 * El plan de la semana, leído de su `.md` una vez. Mismo criterio que la receta
 * y el borrador: se conserva mientras se navega entre las tres pantallas del
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
/**
 * La lista de compras ya armada, con la clave del plan del que salió:
 * redibujar —abrir la ficha de compartir— no vuelve a leer las recetas.
 */
let comprasLeidas: { clave: string; lista: ListaDeCompras } | null = null;

/**
 * La receta que llegó de Claude —compartida o pegada— mientras se decide a qué
 * borrador va y se revisa en el editor. Vive en memoria: el `.md` puede ser
 * largo para el hash.
 */
let recibida: Receta | null = null;
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

/** El aviso de «Pegar receta» cuando lo copiado no sirve, para Borradores y el borrador. */
let avisoBorradores = '';

/** Cuántas escrituras hay en curso, y la pantalla que las lanzó. */
let escrituras = 0;
let hashEscritura = '';

/** El velo, con `aria-busy` en `#app`. Los tests corren sobre un DOM mínimo: puede no estar. */
function mostrarVelo(mostrar: boolean): void {
  const velo = document.querySelector<HTMLElement>('#velo-escritura');
  if (velo) velo.hidden = !mostrar;
  if (mostrar) app?.setAttribute('aria-busy', 'true');
  else app?.removeAttribute('aria-busy');
}

/**
 * Envuelve la promesa de una escritura: el velo mientras dura, y se suelta
 * siempre, termine bien o mal. Envuelve sólo la llamada que escribe y no el
 * manejador entero, para que éste pueda navegar o redibujar al terminar.
 */
async function escribiendo<T>(p: Promise<T>): Promise<T> {
  if (escrituras++ === 0) { hashEscritura = location.hash; mostrarVelo(true); }
  try { return await p; }
  finally { if (--escrituras === 0) mostrarVelo(false); }
}

/** El borrador de la pantalla: de Drive la primera vez, de memoria mientras no se salga. */
async function borradorDePantalla(id: string): Promise<Borrador> {
  if (borradorLeido?.id !== id) borradorLeido = await store.borrador(id);
  return borradorLeido;
}

/** Las pantallas de una misma receta, entre las que la copia leída se conserva. */
const PANTALLAS_DE_RECETA: readonly Ruta['vista'][] = ['receta', 'cocinar', 'editar'];

/** La receta de la pantalla: de Drive la primera vez, de memoria mientras no se salga. */
async function recetaDePantalla(id: string): Promise<{ entrada: Entrada | null; receta: Receta }> {
  if (recetaLeida?.id !== id) {
    const { entrada, receta } = await store.receta(id);
    recetaLeida = { id, entrada, receta };
    // El depósito entero, no sólo lo que está a la vista: así el visor
    // desliza sin esperar (spec §6).
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
 * fotos propias de las categorías (spec §6). Lo que ya está en el caché no se
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

/**
 * La lista de compras del plan. Las recetas se leen de Drive al entrar, una por
 * receta distinta; una que ya no se puede leer se saltea. Después cuentan una
 * vez por aparición: la misma receta en dos comidas cuenta dos veces.
 */
async function comprasDelPlan(plan: Plan): Promise<ListaDeCompras> {
  const clave = plan.comidas.map(c => c.id).join(',');
  if (comprasLeidas?.clave === clave) return comprasLeidas.lista;
  const leidas = new Map<string, Receta>();
  for (const id of new Set(plan.comidas.map(c => c.id))) {
    const leida = await store.receta(id).catch(err => { console.error(err); return null; });
    if (leida) leidas.set(id, leida.receta);
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

/** La captura: lo escrito sobrevive al error y a la reautenticación (R3). */
/** Lo que llegó del menú Compartir en la ruta de la captura. */
const compartidoDe = (ruta: Ruta): { url: string; text: string } =>
  ({ url: ruta.params['url'] ?? '', text: ruta.params['text'] ?? '' });

let tituloCaptura = '';
/** La fuente escrita a mano: agregar una foto redibuja la captura. */
let fuenteCaptura = '';
let notaCaptura = '';
let guardandoCaptura = false;
let errorCaptura = '';
/** Un aviso de las fotos de la captura, sin control. */
let avisoCaptura = '';
/**
 * Las fotos de la captura, ya achicadas, en memoria hasta Guardar. `id` es el
 * de Drive cuando ya se subió en un intento que falló después: reintentar no
 * la vuelve a subir.
 */
let fotosCaptura: { blob: Blob; url: string; id?: string }[] = [];
/** Cuántas fotos dejó el service worker para esta captura, todavía sin leer. */
let compartidasPorLeer = 0;
/** La foto del borrador abierta en el visor, por id. */
let fotoAbierta: string | null = null;

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
 * Las fotos que el editor tiene en memoria hasta Guardar (spec §7): el blob de
 * cada número nuevo, su object URL para la miniatura, y el id de Drive de la
 * que ya se subió en un intento que falló después —reintentar no la vuelve a
 * subir (§8), igual que la captura—.
 */
const fotosEditor = {
  nuevas: new Map<number, Blob>(),
  urls: new Map<number, string>(),
  subidas: new Map<number, string>()
};
/** Los ids de las fotos del borrador que abrió el editor: las que queden se mueven a `_fotos/` (§9). */
let fotosDelBorrador: string[] = [];
/** La foto propia recién elegida para una categoría: se sube al guardarla (§7). */
let fotoPropia: { blob: Blob; url: string } | null = null;

/** La foto achicada; rechaza si el navegador no la decodifica. Sin opciones, al lado de Drive. */
const achicarFoto = (archivo: Blob, opciones?: OpcionesAchicar): Promise<Blob> =>
  achicar(archivo, () => document.createElement('canvas'), opciones);

const NO_SE_LEYO_UNA_FOTO = 'No se pudo leer una de las fotos.';

/**
 * Suma fotos a la captura, achicadas, hasta el máximo. Devuelve el aviso que
 * corresponda, o vacío.
 */
async function sumarFotosACaptura(archivos: Blob[]): Promise<string> {
  const lugar = MAXIMO_FOTOS - fotosCaptura.length;
  let noSeLeyo = false;
  for (const archivo of archivos.slice(0, Math.max(lugar, 0))) {
    try {
      const blob = await escribiendo(achicarFoto(archivo));
      fotosCaptura.push({ blob, url: imagenes.urlDeBlob(blob) });
    } catch (err) {
      console.error(err);
      noSeLeyo = true;
    }
  }
  return [
    archivos.length > lugar ? fotosDeMas(lugar) : '',
    noSeLeyo ? NO_SE_LEYO_UNA_FOTO : ''
  ].filter(Boolean).join(' ');
}

/** Se eligieron más de las que entran. */
const fotosDeMas = (lugar: number): string => lugar > 0
  ? `Un borrador lleva hasta ${MAXIMO_FOTOS} fotos: se agregaron las primeras ${lugar}.`
  : `Un borrador lleva hasta ${MAXIMO_FOTOS} fotos.`;

/**
 * Las fotos que llegaron del menú Compartir: el service worker las dejó en su
 * caché. Se toman las primeras cinco, se achican y el caché se borra.
 */
async function leerCompartidas(cantidad: number): Promise<void> {
  const llegadas = await imagenes.fotosCompartidas(Math.min(cantidad, MAXIMO_FOTOS));
  await imagenes.descartarCompartidas();
  const noSeLeyo = (await sumarFotosACaptura(llegadas)).includes(NO_SE_LEYO_UNA_FOTO);
  avisoCaptura = [
    llegadas.length && cantidad > MAXIMO_FOTOS ? `Llegaron ${cantidad} fotos: se guardan las primeras ${MAXIMO_FOTOS}.` : '',
    noSeLeyo ? NO_SE_LEYO_UNA_FOTO : ''
  ].filter(Boolean).join(' ');
}

/** Las fotos del borrador para dibujarlo: el object URL de cada una, o `null` si ya no está en Drive. */
const fotosDeBorrador = (b: Borrador): Promise<{ id: string; url: string | null }[]> =>
  Promise.all(b.fotos.map(async id => ({ id, url: await imagenes.urlDeImagen(id) })));

/**
 * Sube fotos al borrador abierto, de a una y con el velo (R8): cada una
 * reescribe el `.md` en el momento. Lo que no se pudo queda en el aviso.
 */
async function agregarFotosABorrador(id: string, archivos: Blob[]): Promise<void> {
  const lugar = MAXIMO_FOTOS - (borradorLeido?.fotos.length ?? 0);
  const avisos: string[] = archivos.length > lugar ? [fotosDeMas(lugar)] : [];
  let noSeLeyo = false;
  for (const archivo of archivos.slice(0, Math.max(lugar, 0))) {
    let blob: Blob;
    try {
      blob = await escribiendo(achicarFoto(archivo));
    } catch (err) {
      console.error(err);
      noSeLeyo = true;
      continue;
    }
    try {
      borradorLeido = await escribiendo(store.agregarFotoABorrador(id, blob));
    } catch (err) {
      console.error(err);
      avisos.push(porQueNoGuardo(err));
      break;
    }
  }
  if (noSeLeyo) avisos.push(NO_SE_LEYO_UNA_FOTO);
  avisoBorradores = avisos.join(' ');
}

/** Las fotos del borrador como archivos, para mandarlas a Claude. Si no se pueden leer, ninguna. */
async function archivosDeFotos(ids: string[]): Promise<File[]> {
  try {
    const blobs = await Promise.all(ids.map(id => imagenes.imagenDe(id)));
    return blobs.flatMap((b, i) => b ? [new File([b], `foto-${i + 1}.jpg`, { type: b.type || 'image/jpeg' })] : []);
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
  // está en memoria, y una que va a la papelera sale (spec §6).
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

/** Ajustes, igual al entrar que mientras reindexa: sólo cambia `reindexando`. */
function dibujarAjustes(): void {
  pintar(renderAjustes({
    cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados,
    indiceDuplicado: indiceDuplicado(), planDuplicado: store.planDuplicado(), reindexando,
    borradores: store.borradores().length, menuAbierto,
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
  reindexando = { leidas: 0, total: 0 };
  const dibujar = () => enAjustes
    ? dibujarAjustes()
    : pintar(renderConexion({ estado: 'creando-indice', ...(reindexando ? { progreso: reindexando } : {}) }));

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
 * Lo recibido de Claude va al editor del borrador del id si existe; si no, a
 * la pregunta «¿De qué borrador es esta receta?».
 *
 * `reemplazar` navega con `replace` en vez de sumar una entrada al
 * historial. Hace falta cuando esto se llama desde `capturar`: el Share
 * Target deja esa pantalla como única entrada (`hashDeCompartido` ya
 * reemplazó), y si acá se sumara una entrada, volver —o «Salir sin
 * guardar», o cerrar después de guardar— caería de nuevo en `#/capturar`,
 * que reconocería la misma receta y la reabriría. Desde «Pegar receta» no hace
 * falta: ahí sí conviene que volver deje al borrador o a Borradores, de donde
 * se pegó.
 */
function recibirReceta(texto: string, borradorElegido?: string, reemplazar = false): void {
  const { receta, borradorId } = recetaRecibida(texto);
  recibida = receta;
  const id = borradorElegido ?? borradorId;
  const existe = !!id && store.borradores().some(b => b.id_archivo === id);
  const hash = existe ? `#/nueva?borrador=${encodeURIComponent(id)}&recibida=1` : '#/recibida';
  if (reemplazar) irCerrando(hash); else location.hash = hash;
  // Un `hashchange` real haría lo mismo, pero en el próximo tick: no hay que
  // esperarlo para mostrar el editor o la pregunta.
  void render();
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

  // Con una escritura en curso no se navega: el resultado o el error tienen que
  // llegar a la pantalla que la lanzó. Como el `hashchange` no se puede
  // cancelar, la URL vuelve a la de esa pantalla, igual que con el editor. El
  // hash es el de cuando arrancó la escritura: acá `location.hash` ya es el destino.
  if (escrituras && cambiaDePantalla) { history.pushState(null, '', hashEscritura); return; }

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
    avisoBorradores = '';
    // Lo recibido de Claude sobrevive a la pregunta y al editor que abre
    // desde ella; cualquier otra pantalla lo descarta.
    if (!(ruta.vista === 'recibida' || (ruta.vista === 'nueva' && ruta.params['recibida']))) recibida = null;
    if (!PANTALLAS_DE_RECETA.includes(ruta.vista)) recetaLeida = null;
    if (!PANTALLAS_DE_BORRADOR.includes(ruta.vista)) borradorLeido = null;
    // El aviso de una escritura que falló sobrevive a la navegación entre las
    // pantallas del plan: agregar escribe y cierra, y el aviso va en el plan.
    if (!PANTALLAS_DE_PLAN.includes(ruta.vista)) { planLeido = null; comprasLeidas = null; errorPlan = ''; }
    confirmandoReinicio = false;
    consultaPlan = '';
    tagsActivos = [];
    duracionesActivas = [];
    orden = 'alfa';
    visibles = TRAMO;
    // Navegar cierra el menú: se abrió para elegir a dónde ir.
    menuAbierto = false;
    confirmandoDescarte = false;
    editandoBorrador = false;
    cerrandoEdicion = false;
    // Salir de la pantalla de la carpeta la cierra: lo que se estaba por usar no sigue.
    selector.confirmando = null;
    selector.error = '';
    if (ruta.vista !== 'capturar' && ruta.vista !== 'borrador') {
      tituloCaptura = ''; fuenteCaptura = ''; notaCaptura = ''; guardandoCaptura = false; errorCaptura = '';
    }
    // Las imágenes de la pantalla anterior se sueltan: las fotos de la
    // captura en memoria son de esa captura, y el visor, de ese borrador.
    imagenes.soltarImagenes();
    fotosCaptura = [];
    avisoCaptura = '';
    compartidasPorLeer = 0;
    fotoAbierta = null;
    visor = null;
    // Las fotos del editor viven lo que la pantalla: salir sin guardar no deja
    // nada en Drive, y volver a entrar abre con lo que dice el `.md`.
    fotosEditor.nuevas.clear();
    fotosEditor.urls.clear();
    fotosEditor.subidas.clear();
    fotosDelBorrador = [];
    fotoPropia = null;
    // Lo compartido llega con la nota ya escrita: el texto que acompañaba al link.
    if (ruta.vista === 'capturar') {
      tituloCaptura = ''; fuenteCaptura = ''; guardandoCaptura = false; errorCaptura = '';
      notaCaptura = desdeCompartido(compartidoDe(ruta)).nota;
      compartidasPorLeer = Number(ruta.params['fotos'] ?? 0) || 0;
    }
    cocina.reiniciar();
    compartiendo = null;
    pdfListo = null;
    marcandoFavorito = false;
    errorFavorito = '';
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
        categorias: store.categoriasConConteo(), borradores: store.borradores().length,
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

    case 'tag': {
      // Se llega tocando un chip del carrusel del Recetario: el tag tocado
      // entra como filtro igual que en la categoría, para poder sumarle otros.
      const nombre = ruta.params['nombre'] ?? '';
      const activos = tagsActivos.includes(nombre) ? tagsActivos : [nombre, ...tagsActivos];
      const porTags = store.buscar({ tags: activos });
      const { entradas, ordenEfectivo } = listaOrdenada(porTags);
      pintar(renderTag({
        tag: nombre, entradas: entradas.slice(0, visibles), total: entradas.length,
        visibles: Math.min(visibles, entradas.length), tagsActivos: activos, tags: store.tagsDe(),
        duraciones: contarDuraciones(porTags), duracionesActivas, orden: ordenEfectivo
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
          ...(errorFavorito ? { error: errorFavorito } : {})
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

    case 'capturar': {
      // La captura no dibuja la app: es una pantalla efímera sobre lo que el
      // usuario estaba haciendo en otra app (C01.2.2).
      const textoCompartido = ruta.params['text'] || '';
      // Lo compartido puede ser la receta que volvió de Claude: ahí no se
      // captura como borrador, se abre el editor directo. Con `replace`: esta
      // pantalla es la única entrada del historial que dejó el Share Target, y
      // sin reemplazarla, volver caería de nuevo acá y reabriría la misma receta.
      if (esRecetaEnMd(textoCompartido)) { recibirReceta(textoCompartido, undefined, true); return; }
      const llegado = compartidoDe(ruta);
      if (compartidasPorLeer) {
        const cantidad = compartidasPorLeer;
        compartidasPorLeer = 0;
        await leerCompartidas(cantidad);
      }
      return pintar(renderCaptura({
        fuente: desdeCompartido(llegado).fuente || fuenteCaptura,
        compartido: !!(llegado.url || llegado.text || ruta.params['fotos']),
        titulo: tituloCaptura, nota: notaCaptura, guardando: guardandoCaptura,
        fotos: fotosCaptura.map(f => f.url),
        ...(errorCaptura ? { error: errorCaptura } : {}),
        ...(avisoCaptura ? { aviso: avisoCaptura } : {})
      }));
    }

    case 'recibida':
      // Sin nada recibido —una recarga de esta misma pantalla, por
      // ejemplo— no hay qué preguntar: se vuelve a Borradores.
      if (!recibida) { irCerrando('#/borradores'); return; }
      return pintar(renderPreguntaBorrador({ borradores: store.borradores() }));

    case 'plan':
      try {
        const plan = await planDePantalla();
        return pintar(renderPlan({
          plan, entradas: store.entradas(), hoy: diaDeHoy(),
          borradores: store.borradores().length, menuAbierto,
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
        menuDiario: delMenuDiario(),
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

    case 'borradores':
      return pintar(renderBorradores({
        borradores: store.borradores(), menuAbierto,
        ...(avisoBorradores ? { aviso: avisoBorradores } : {})
      }));

    case 'borrador': {
      const id = ruta.params['id'] ?? '';
      // Un borrador que ya no está en el índice —convertido, descartado— no
      // es un error: la lista es lo que corresponde mostrar.
      if (!store.borradores().some(b => b.id_archivo === id)) {
        return pintar(renderBorradores({ borradores: store.borradores(), menuAbierto }));
      }
      try {
        const borrador = await borradorDePantalla(id);
        // Editar es el mismo formulario con el que se creó, precargado.
        if (editandoBorrador) {
          const html = renderCaptura({
            fuente: borrador.fuente, titulo: borrador.titulo, nota: borrador.nota,
            edicion: true, guardando: guardandoCaptura,
            ...(errorCaptura ? { error: errorCaptura } : {})
          });
          // La foto contra la que se comparan los cambios se saca al entrar a
          // editar; un redibujado —un error al guardar— no la reemplaza.
          return editorAbierto ? pintar(html) : abrirEditor(html);
        }
        const fotos = await fotosDeBorrador(borrador);
        const abierta = fotos.find(f => f.id === fotoAbierta)?.url;
        return pintar(renderBorrador({
          borrador, confirmando: confirmandoDescarte, fotos,
          ...(abierta ? { visor: abierta } : {}),
          ...(avisoBorradores ? { aviso: avisoBorradores } : {})
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer el borrador.');
      }
    }

    case 'editar':
      try {
        const { entrada, receta } = await recetaDePantalla(ruta.params['id'] ?? '');
        return abrirEditor(renderEditor({
          entrada, receta, categorias: store.categorias(),
          tagsConocidos: store.tagsDe().map(t => t.tag)
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer la receta.');
      }

    case 'nueva': {
      // El mismo formulario que editar, sin entrada (todavía no hay archivo en
      // Drive) y con una receta vacía en vez de una leída. Desde un borrador
      // abre con el título y la fuente cargados (C04.3b.1); guardar es lo que
      // de verdad la crea, y ahí se borra el borrador (C01.7.1). Si la receta
      // viene de Claude —recibida—, se usa tal cual, sin mezclar la nota de
      // ningún borrador.
      const borradorId = ruta.params['borrador'] ?? '';
      // `recibida` se lee una sola vez: de ahí sale tanto si esta pantalla
      // usa la receta de Claude como, más abajo, si cuenta como cambios sin
      // guardar desde que se abre.
      const deClaude = ruta.params['recibida'] ? recibida : null;
      const borrador = borradorId ? await borradorDePantalla(borradorId).catch(() => null) : null;
      let receta: Receta;
      if (deClaude) {
        // Copia: `recibida` sigue viva hasta que se guarda o se navega a otra
        // pantalla (para que `guardar` conserve sus claves desconocidas), y
        // no tiene que verse afectada por lo que el editor le hace a la suya.
        receta = { ...deClaude };
      } else {
        receta = parse('');
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
      if (borrador) {
        // El editor atado a un borrador abre con el depósito ya cargado: sus
        // fotos, en su orden, como 1, 2, 3…, con sus links de Drive (spec §9).
        // La receta que vuelve de Claude ya las nombra como `foto:N`.
        fotosDelBorrador = borrador.fotos;
        receta.fotos = borrador.fotos.map((id, i) => ({ n: i + 1, url: linkDeFoto(id) }));
      }
      // Una receta nace incompleta: sacar el tag es la declaración explícita de
      // que está terminada (C04.3b.1).
      receta.tags = conEspecial(receta.tags, 'incompleta', true);
      abrirEditor(renderEditor({
        entrada: null, receta, categorias: store.categorias(),
        tagsConocidos: store.tagsDe().map(t => t.tag)
      }));
      // Cuenta como cambios sin guardar desde que se abre: la foto contra la
      // que se compara queda vacía, así que cualquier formulario difiere.
      if (deClaude && editorAbierto) editorAbierto.formulario = '';
      return;
    }
  }
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
 * Vuelve a mirar si la receta del formulario puede sacarse `incompleta`, y
 * habilita o bloquea su botón. Corre en cada tecla, así que toca el DOM en vez
 * de redibujar: redibujar perdería el foco y el cursor.
 */
function revisarIncompleta(): void {
  const boton = document.querySelector<HTMLButtonElement>('#app [data-accion="tag-especial"][data-valor="incompleta"]');
  if (!boton) return;
  const valor = (n: string): string =>
    document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `#app [name="${n}"]`)?.value ?? '';
  const puede = sePuedeTerminar(
    { titulo: valor('titulo'), ingredientes: valor('ingredientes'), preparacion: valor('preparacion') },
    valor('carpeta')
  );
  boton.disabled = !puede;
  const leyenda = document.querySelector<HTMLElement>('#app .leyenda-incompleta');
  if (leyenda) leyenda.hidden = puede;
  // Si dejó de cumplir, la receta vuelve a quedar incompleta.
  if (!puede && boton.getAttribute('aria-pressed') !== 'true') {
    boton.setAttribute('aria-pressed', 'true');
    sincronizarTags();
  }
}

/** Las cinco secciones de texto del editor, las que pueden nombrar una foto. */
const SECCIONES = ['descripcion', 'ingredientes', 'preparacion', 'variaciones', 'notas'] as const;

/** Se está en el editor de una receta, la que sea: ahí nada se redibuja sin perder lo escrito. */
const enElEditor = (): boolean => vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva';

/** Un campo del formulario por su `name`, como lo hace `revisarIncompleta`. */
const campoDelEditor = (nombre: string) =>
  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#app [name="${nombre}"]`);

/**
 * El depósito que el editor tiene escrito ahora: el campo oculto es la única
 * fuente. Un JSON que no se entiende cae en el depósito de la receta abierta y
 * no en uno vacío: vacío significa «las saqué a todas», y el store mandaría
 * esas fotos a la papelera (§8).
 */
const depositoDelEditor = (): FotoDeReceta[] =>
  fotosDesde(campoDelEditor('fotos')?.value ?? '', recetaLeida?.receta.fotos ?? []);

/** El valor crudo de la cabecera: `foto:N`, una URL, o vacío. */
const portadaDelEditor = (): string => campoDelEditor('foto')?.value ?? '';

/**
 * Escribe el depósito y redibuja sólo su fila de miniaturas: redibujar el
 * formulario entero perdería lo que se venía escribiendo.
 */
function escribirDeposito(fotos: FotoDeReceta[]): void {
  const campo = campoDelEditor('fotos');
  if (campo) campo.value = JSON.stringify(fotos);
  const fila = document.querySelector<HTMLElement>('#app .miniaturas');
  if (fila) fila.outerHTML = filaDeFotosEditor(fotos);
  void completarFotos();
}

/** Escribe la cabecera y cambia su miniatura, también sin redibujar. */
function escribirPortada(valor: string): void {
  const campo = campoDelEditor('foto');
  if (campo) campo.value = valor;
  const boton = document.querySelector<HTMLElement>('#app .portada-boton');
  if (boton) boton.innerHTML = muestraDePortada(valor || null, depositoDelEditor());
  void completarFotos();
}

/** Las fichas al pie del editor y el velo con el que se cierran. */
const FICHAS_DE_FOTO =
  '#app [data-acciones-foto], #app [data-poner-en], #app [data-selector-portada], ' +
  '#app .velo[data-accion="cerrar-ficha-foto"]';

/** Saca del DOM la ficha que esté abierta, sin tocar el formulario. */
function cerrarFichaFoto(): void {
  for (const e of document.querySelectorAll(FICHAS_DE_FOTO)) e.remove();
}

/** Abre una ficha al pie: siempre una sola, como la hoja de Compartir. */
function abrirFichaFoto(html: string): void {
  cerrarFichaFoto();
  document.querySelector('[data-formulario]')?.insertAdjacentHTML('beforeend', html);
  void completarFotos();
}

/**
 * Un aviso de las fotos arriba del formulario, que aparece y se va sin
 * redibujarlo: en el editor redibujar perdería lo escrito, y en la categoría
 * apagaría Guardar hasta la próxima tecla.
 */
function avisarEnElFormulario(texto: string): void {
  document.querySelector('#app [data-aviso-fotos]')?.remove();
  if (!texto) return;
  document.querySelector('[data-formulario]')
    ?.insertAdjacentHTML('afterbegin', `<div data-aviso-fotos>${aviso({ texto })}</div>`);
}

/**
 * Suma fotos al depósito del editor, achicadas y en memoria hasta Guardar.
 * Cada una toma el número siguiente: ninguno se reusa, ni siquiera el de una
 * que se sacó.
 */
async function agregarFotosAlEditor(archivos: Blob[]): Promise<void> {
  let deposito = depositoDelEditor();
  let noSeLeyo = false;
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
  escribirDeposito(deposito);
  avisarEnElFormulario(noSeLeyo ? NO_SE_LEYO_UNA_FOTO : '');
}

/**
 * La receta con el link de cada foto que un intento anterior ya subió (§8).
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
 * hay que subir, las del borrador que siguen estando y las URLs que ya no
 * están. Cada subida se anota apenas el store avisa, para el reintento.
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
    deBorrador: fotosDelBorrador.filter(id => urls.has(linkDeFoto(id))),
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
 * Abre el visor en la foto `n` del depósito, para deslizar entre todas. Sin
 * número —o con uno que no está—, una cabecera externa se abre sola (spec §7).
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
  const form = document.querySelector<HTMLFormElement>('#app [data-formulario]');
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
  // Los especiales tienen su botón y terminado contradice a incompleta: no se escriben a mano.
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
 * de descartar. Con `location.hash =` el historial acumula la pantalla que se
 * está dejando, y el volver de la siguiente trae de vuelta justo eso: el
 * chevron de la receta llevaría al modo cocina.
 */
const irCerrando = (hash: string): void => { location.replace(hash); };

const router = crearRouter(render);

app.addEventListener('click', async (e) => {
  // Con una escritura en curso la pantalla no responde: el velo ya tapa los
  // controles, y esto cubre lo que llegue igual.
  if (escrituras) return;
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const boton = destino?.closest<HTMLElement>('[data-accion], [data-tag]') ?? null;
  // Una foto en línea del texto no lleva `data-accion` —la dibuja el markdown,
  // que no sabe de acciones— y abre el visor igual (§7). En el modo cocina no:
  // ahí la foto está adentro del paso, que sí lleva acción, y un toque marca
  // dónde voy.
  if (!boton && destino && recetaLeida) {
    const enLinea = destino.closest<HTMLElement>('.foto-linea');
    const img = enLinea?.querySelector<HTMLElement>('img');
    if (!img) return;
    const id = img.dataset['drive'] ?? '';
    const suelta = id ? linkDeFoto(id) : img.getAttribute('src') ?? '';
    const receta = resolverReceta(recetaLeida.receta);
    abrirVisor(receta.fotos, receta.fotos.find(f => f.url === suelta)?.n, suelta || undefined);
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
        // `imagenes`, y el canvas para achicarlas es el mismo de siempre (§10).
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

  // Las flechas sólo existen con mouse o trackpad (el CSS las esconde): el
  // teléfono desliza con el dedo. Se mueve el 80% de lo que se ve, para que
  // quede un chip de referencia entre una vista y la siguiente.
  if (accion === 'carrusel-izq' || accion === 'carrusel-der') {
    const carrusel = document.querySelector<HTMLElement>('#app [data-carrusel]');
    if (!carrusel) return;
    const paso = Math.round(carrusel.clientWidth * 0.8);
    carrusel.scrollBy?.({
      left: accion === 'carrusel-der' ? paso : -paso,
      behavior: movimientoReducido() ? 'auto' : 'smooth'
    });
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
  if (accion === 'elegir-para-el-plan') {
    const id = boton.dataset['id'] ?? '';
    const entrada = store.entradas().find(e => e.id_archivo === id);
    if (!entrada) return;
    const dia = Number(vistaActual?.params['dia'] ?? 0);
    const momento: Momento = vistaActual?.params['momento'] === 'mediodia' ? 'mediodia' : 'noche';
    try {
      const plan = await planDePantalla();
      // Agregar suma al final: la misma receta dos veces se permite, y cada
      // línea tiene su cruz.
      await guardarPlan({ comidas: [...plan.comidas, { dia, momento, id, titulo: entrada.titulo }] });
    } catch (err) {
      console.error(err);
      errorPlan = 'No se pudo guardar el plan. Revisá la conexión.';
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
    // del usuario en el navegador. Y se recarga, porque el índice, la receta
    // abierta y los borradores también viven en memoria: sin recargar, la
    // próxima pantalla los volvería a dibujar. Las fotos guardadas en el
    // navegador tampoco quedan.
    indiceLocal.borrar();
    await Promise.all([imagenes.borrarImagenes(), imagenes.descartarCompartidas()]);
    irCerrando('#/');
    location.reload();
    return;
  }
  if (accion === 'crear-receta') {
    location.hash = `#/nueva?borrador=${encodeURIComponent(idActual())}`;
    return;
  }
  if (accion === 'descartar') { confirmandoDescarte = true; return render(); }
  if (accion === 'cancelar-descarte') { confirmandoDescarte = false; return render(); }
  if (accion === 'descartar-confirmado') {
    const id = idActual();
    try {
      await escribiendo(store.descartarBorrador(id));
      // El borrador que se acaba de descartar no tiene que quedar en el
      // historial: volver ahí mostraría algo que ya no existe.
      irCerrando('#/borradores');
      return;
    } catch (err) {
      console.error(err);
      if (!borradorLeido) return;
      const fotos = await fotosDeBorrador(borradorLeido).catch(() => []);
      return pintar(renderBorrador({ borrador: borradorLeido, confirmando: true, fotos, error: 'No se pudo descartar.' }));
    }
  }
  if (accion === 'agregar-borrador') { location.hash = '#/capturar'; return; }
  if (accion === 'cancelar-captura') {
    tituloCaptura = '';
    fuenteCaptura = '';
    notaCaptura = '';
    fotosCaptura = [];
    // Editando, cancelar vuelve al borrador sin tocarlo, y sin preguntar:
    // es descartar lo escrito a propósito.
    if (editandoBorrador) { cerrarEdicion(); return render(); }
    // Compartida desde otra app, cerrar la pestaña es volver a donde estabas
    // (C01.2.2). Pero `close()` sólo funciona si la abrió un script: si no
    // —y si la captura se abrió a mano desde Borradores—, hay que volver por
    // la app, o Cancelar no hacía nada.
    const compartida = !!(vistaActual?.params['url'] || vistaActual?.params['text'] || vistaActual?.params['fotos']);
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
    // Compartida, la captura no dibuja el campo: la fuente es el link que
    // vino en la URL.
    const fuente = campoFuente
      ? campoFuente.value.trim()
      : vistaActual ? desdeCompartido(compartidoDe(vistaActual)).fuente : '';
    if (!sePuedeGuardar({ fuente, nota: notaCaptura, fotos: editandoBorrador ? 0 : fotosCaptura.length })) return;
    // El título es opcional: sin él, el borrador se llama por cuándo se capturó.
    const titulo = tituloCaptura
      || tituloPorDefecto(editandoBorrador && borradorLeido?.capturado ? new Date(borradorLeido.capturado) : new Date());

    guardandoCaptura = true;
    errorCaptura = '';
    await render();
    try {
      if (editandoBorrador) {
        const id = idActual();
        await escribiendo(store.editarBorrador(id, { titulo, fuente, nota: notaCaptura }));
        // Lo guardado es lo que se muestra: volver al borrador no relee el `.md`.
        if (borradorLeido?.id === id) borradorLeido = { ...borradorLeido, titulo, fuente, nota: notaCaptura };
        cerrarEdicion();
        guardandoCaptura = false;
        tituloCaptura = '';
        notaCaptura = '';
        return render();
      }
      // Cada foto que sube queda anotada con su id: si algo falla después,
      // reintentar no la vuelve a subir.
      await escribiendo(store.agregarBorrador(
        { titulo, fuente, nota: notaCaptura, fotos: fotosCaptura.map(f => f.id ?? f.blob) },
        (i, id) => { const foto = fotosCaptura[i]; if (foto) foto.id = id; }
      ));
    } catch (err) {
      console.error(err);
      // Nada queda esperando: el texto sigue en pantalla y se reintenta a mano.
      guardandoCaptura = false;
      errorCaptura = porQueNoGuardo(err);
      return render();
    }
    guardandoCaptura = false;
    tituloCaptura = '';
    fuenteCaptura = '';
    notaCaptura = '';
    fotosCaptura = [];
    // Volver a donde estabas, con Recetario sin quedar abierto (C01.2.2). Si
    // la pestaña no la abrió un script, `close()` no hace nada: ahí queda la
    // lista, que es el lugar donde el borrador nuevo está.
    window.close();
    irCerrando('#/borradores');
    return;
  }
  if (accion === 'editar-borrador') { editandoBorrador = true; editorAbierto = null; return render(); }

  // Las fotos. En la captura viven en memoria hasta Guardar; en el borrador,
  // sacar una la manda a la papelera y reescribe el `.md` en el momento, sin
  // confirmación: se recupera desde la papelera de Drive.
  if (accion === 'sacar-foto-captura') {
    fotosCaptura.splice(Number(boton.dataset['valor'] ?? -1), 1);
    avisoCaptura = '';
    return render();
  }
  if (accion === 'sacar-foto') {
    const id = idActual();
    try {
      borradorLeido = await escribiendo(store.sacarFotoDeBorrador(id, boton.dataset['valor'] ?? ''));
      avisoBorradores = '';
    } catch (err) {
      console.error(err);
      avisoBorradores = porQueNoGuardo(err);
    }
    return render();
  }
  if (accion === 'ver-foto') { fotoAbierta = boton.dataset['valor'] ?? null; return render(); }
  if (accion === 'cerrar-visor') {
    // Un deslizamiento termina en un click: ese no cierra, ya cambió de foto.
    if (deslizoElVisor) { deslizoElVisor = false; return; }
    fotoAbierta = null;
    visor = null;
    if (enElEditor()) { document.querySelector('#app .visor')?.remove(); return; }
    return render();
  }

  // Las fotos de una receta (spec §7). El depósito sale del campo oculto en el
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
    abrirVisor(receta.fotos, n, receta.foto ?? undefined);
    return render();
  }
  if (accion === 'cerrar-ficha-foto') { cerrarFichaFoto(); return; }
  if (accion === 'acciones-foto') {
    const n = boton.dataset['n'] ?? '';
    abrirFichaFoto(renderAccionesFoto(Number(n), { portada: portadaDelEditor() === `foto:${n}` }));
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
  if (accion === 'portada-url') {
    escribirPortada(document.querySelector<HTMLInputElement>('#app [data-url-portada]')?.value.trim() ?? '');
    cerrarFichaFoto();
    return;
  }
  if (accion === 'sin-portada') { escribirPortada(''); cerrarFichaFoto(); return; }
  if (accion === 'abrir-poner-en') {
    // Los lugares salen de lo que está escrito ahora en el formulario, no del
    // `.md` guardado: la foto va a la línea que el usuario está viendo.
    const receta = recetaDesdeFormulario(datosDelFormulario(), parse(''));
    abrirFichaFoto(renderPonerEn(lineasDeLaReceta(receta), Number(boton.dataset['n'] ?? 0)));
    return;
  }
  if (accion === 'poner-en') {
    const campo = campoDelEditor(boton.dataset['seccion'] ?? '');
    const marca = boton.dataset['linea'] ?? '';
    if (campo) campo.value = ponerEn(campo.value, marca === '' ? null : Number(marca), Number(boton.dataset['n'] ?? 0));
    cerrarFichaFoto();
    return;
  }
  if (accion === 'sacar-foto-editor') {
    const n = Number(boton.dataset['n'] ?? 0);
    escribirDeposito(depositoDelEditor().filter(f => f.n !== n));
    // La foto se va del depósito y de todo el texto que la nombraba.
    for (const seccion of SECCIONES) {
      const campo = campoDelEditor(seccion);
      if (campo) campo.value = sacarReferencias(campo.value, n);
    }
    if (portadaDelEditor() === `foto:${n}`) escribirPortada('');
    fotosEditor.nuevas.delete(n);
    fotosEditor.urls.delete(n);
    cerrarFichaFoto();
    return;
  }

  if (accion === 'convertir-con-claude') {
    const b = borradorLeido;
    if (!b) return;
    const fotos = b.fotos.length
      ? { archivos: await archivosDeFotos(b.fotos), conLinks: pedidoDeConversion(b, { links: true }) }
      : null;
    const r = await enviarAClaude(plataformaDelNavegador(), pedidoDeConversion(b), fotos);
    if (r === 'copiado') { avisoBorradores = 'Pedido copiado: pegalo en Claude'; return render(); }
    if (r === 'sin-portapapeles') { avisoBorradores = 'No se pudo abrir Claude ni copiar el pedido.'; return render(); }
    return;
  }
  if (accion === 'pegar-receta') {
    const texto = await leerPortapapeles(plataformaDelNavegador());
    if (texto === null) { avisoBorradores = 'No se pudo leer lo copiado.'; return render(); }
    if (!esRecetaEnMd(texto)) { avisoBorradores = 'Lo copiado no es una receta en .md.'; return render(); }
    avisoBorradores = '';
    // En la pantalla de un borrador, pegar ata a ese borrador aunque el texto
    // traiga otro id; en Borradores sigue la regla del id que trae.
    const enBorrador = vistaActual?.vista === 'borrador' ? vistaActual.params['id'] : undefined;
    return recibirReceta(texto, enBorrador);
  }
  if (accion === 'elegir-borrador-recibido') {
    if (!recibida) return;
    const id = boton.dataset['valor'] ?? '';
    location.hash = id ? `#/nueva?borrador=${encodeURIComponent(id)}&recibida=1` : '#/nueva?recibida=1';
    return render();
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
    // Editar un borrador no cambia la URL: es estado de la pantalla. Volver
    // cierra la edición y muestra el borrador, en vez de irse a la lista, que
    // es la entrada anterior del historial.
    if (editandoBorrador) {
      // Con cambios, pregunta antes, igual que el gesto de atrás (C04.1.1).
      if (editorAbierto && formularioActual() !== editorAbierto.formulario) {
        cerrandoEdicion = true;
        if (!document.querySelector('[data-salida]')) {
          document.querySelector('[data-formulario]')?.insertAdjacentHTML('afterbegin', confirmacionSalida);
        }
        window.scrollTo?.(0, 0);
        return;
      }
      cerrarEdicion();
      return render();
    }
    if (vistaActual?.vista === 'cocinar') await cocina.soltarPantalla();
    if (history.length <= 1) {
      // Sin entrada previa —por ejemplo, la pregunta «¿De qué borrador…»
      // abierta con `replace` porque la receta llegó por Share— no hay
      // nada detrás en este mismo hilo: se cierra a Borradores, no al
      // Recetario, que es adonde no vino.
      if (vistaActual?.vista === 'recibida') { irCerrando('#/borradores'); return; }
      // Entrar por un link directo deja el historial vacío: ahí volver es ir
      // al Recetario, no salirse de la app.
      location.hash = '#/';
      return;
    }
    return history.back();
  }
  if (accion === 'editar') { location.hash = `#/r/${idActual()}/editar`; return; }
  if (accion === 'seguir-editando') {
    cerrandoEdicion = false;
    document.querySelector('[data-salida]')?.remove();
    return;
  }
  if (accion === 'salir-sin-guardar') {
    // Desde el volver del encabezado, salir es dejar de editar: el borrador
    // sigue en pantalla, como cuando no había cambios.
    if (editandoBorrador && cerrandoEdicion) { cerrarEdicion(); return render(); }
    editorAbierto = null;
    // Mismo caso que arriba: sin entrada previa —el editor de una receta
    // recibida por Share, abierto con `replace`— volver no puede intentar
    // salir de la app (C01.2.2); cierra a Borradores. Mismo patrón que ya usa
    // «Cancelar» en la captura.
    if (history.length <= 1) { irCerrando('#/borradores'); return; }
    return history.back();
  }
  if (accion === 'conectar-de-nuevo') {
    // No se redibuja: en el editor lo escrito vive sólo en el formulario (R3).
    // Conectado, el aviso se va y se guarda a mano; si no, queda donde está.
    try {
      await auth.conectar();
      errorCaptura = '';
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
    // cambiar el color o el nombre no vuelve a subir nada (§8).
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
    if (!document.querySelector('[data-formulario]')) return;
    const datos = datosDelFormulario();
    const carpetaId = datos['carpeta'] || '';
    const esNueva = vistaActual?.vista === 'nueva';
    const id = idActual();
    const borradorId = vistaActual?.params['borrador'] ?? '';

    // Mientras trabaja, el botón lo dice y no se puede tocar dos veces (C04.5.1).
    boton.setAttribute('disabled', '');
    boton.textContent = 'Guardando…';

    // Atada a la receta que volvió de Claude, la base es esa receta y no una
    // vacía: así se conservan sus claves desconocidas.
    const recibidaBase = vistaActual?.params['recibida'] && recibida ? recibida : null;
    const base = esNueva ? (recibidaBase ?? parse('')) : (await store.receta(id)).receta;
    const nueva = conSubidas(recetaDesdeFormulario(datos, base));

    /** El editor otra vez, con lo que el usuario tenía escrito y el aviso (C04.5.2). */
    const conError = (mensaje: string) => pintar(renderEditor({
      entrada: esNueva ? null : store.entradas().find(e => e.id_archivo === id) ?? null,
      // Con las fotos que este intento alcanzó a subir ya en sus líneas: el
      // reintento las manda por su link en vez de volver a subirlas (§8).
      receta: conSubidas(nueva), categorias: store.categorias(),
      tagsConocidos: store.tagsDe().map(t => t.tag), error: mensaje
    }));

    if (!nueva.titulo) return conError('Ponele un título antes de guardar.');
    // Sin categoría no se sabe en qué carpeta de Drive va el archivo (C04.3b.1).
    if (esNueva && !carpetaId) return conError('Elegí una categoría antes de guardar.');

    // Lo que el depósito cambió respecto del `.md` que se abrió: el store sube,
    // mueve y manda a la papelera (§8).
    const fotos = cambiosDeFotos(nueva, base);

    try {
      let creada: { id: string } | null = null;
      if (esNueva && borradorId) {
        // Convertir es una sola operación: el .md, la fila y el borrador (C01.7.1).
        creada = await escribiendo(convertirBorrador({ store, convertidos }, { borradorId, receta: nueva, carpetaId, fotos }));
      } else if (esNueva) {
        creada = await escribiendo(store.crear(nueva, { carpetaId: carpetaId || undefined, fotos }));
      } else {
        await escribiendo(store.guardar(id, nueva, { carpetaDestino: carpetaId, fotos }));
        // Lo guardado es la copia: volver a la receta la muestra sin releer, y
        // con el link de cada foto que se acaba de subir en su línea.
        recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta: conSubidas(nueva) };
      }
      editorAbierto = null;
      recibida = null;
      // Atada a la receta recibida, `history.back()` caería en `#/capturar`
      // —o en `#/recibida`— y reabriría lo mismo que se acaba de guardar: se
      // cierra directo a la receta creada.
      if (recibidaBase && creada) { irCerrando(`#/r/${encodeURIComponent(creada.id)}`); return; }
      // Nada más confirma el éxito: al terminar, vuelve a la receta. Lo
      // escrito ya está en Drive, así que salir no tiene nada que preguntar.
      return history.back();
    } catch (err) {
      console.error(err);
      return conError(porQueNoGuardo(err));
    }
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
    recetaLeida = null; borradorLeido = null; selector.error = '';
    return render();
  }
});

/**
 * La captura se escribe en el DOM y no en el estado: redibujar en cada tecla
 * perdería el foco y el cursor. Lo que se sigue tecla a tecla es lo mínimo —el
 * título habilita Guardar, y lo escrito sobrevive a un error—, y el botón se
 * habilita tocándolo directo, sin volver a pintar la pantalla.
 */
app.addEventListener('input', (e) => {
  if (escrituras) return;
  // En la pantalla de agregar al plan se redibuja sólo el bloque de abajo:
  // repintar la pantalla entera perdería el foco del teclado.
  if (vistaActual?.vista === 'plan-agregar') {
    const caja = e.target as HTMLInputElement | null;
    if (caja?.dataset?.['accion'] !== 'buscar-en-plan') return;
    consultaPlan = caja.value;
    const bloque = document.querySelector('[data-resultados-plan]');
    if (bloque) {
      bloque.innerHTML = bloqueDeAgregar({
        menuDiario: delMenuDiario(), consulta: consultaPlan,
        grupos: store.buscarPorTexto(consultaPlan)
      });
    }
    return;
  }
  if (vistaActual?.vista === 'editar-categoria') return revisarCategoria();
  // En el editor, cada tecla puede habilitar o bloquear el botón de `incompleta`.
  if (vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva') return revisarIncompleta();
  if (vistaActual?.vista !== 'capturar' && !editandoBorrador) return;
  const campo = e.target as HTMLInputElement | HTMLTextAreaElement | null;
  if (!campo?.name) return;
  if (campo.name === 'titulo') { tituloCaptura = campo.value; return; }
  if (campo.name === 'nota') notaCaptura = campo.value;
  else if (campo.name === 'fuente') fuenteCaptura = campo.value;
  else return;
  // Guardar vale con fuente, con nota o con fotos: el título es opcional.
  const fuente = document.querySelector<HTMLInputElement>('#app input[name="fuente"]')?.value
    ?? (vistaActual ? desdeCompartido(compartidoDe(vistaActual)).fuente : '');
  const boton = document.querySelector<HTMLButtonElement>('#app [data-accion="guardar-captura"]');
  const fotos = editandoBorrador ? 0 : fotosCaptura.length;
  if (boton) boton.toggleAttribute('disabled', !sePuedeGuardar({ fuente, nota: notaCaptura, fotos }));
});

/** Las pantallas que dibujan el menú lateral: sólo ahí se desliza para abrirlo. */
const PANTALLAS_CON_MENU: readonly Ruta['vista'][] = ['recetario', 'borradores', 'plan', 'ajustes'];

/** El deslizamiento en curso: dónde empezó, si ya se sabe que es gesto, y cuánto va abierto. */
let deslizando: { x: number; y: number; decidido: 'indeciso' | 'horizontal' | 'vertical'; p: number } | null = null;

/** Desde 900 px el menú es fijo (`base.css`): no hay nada que abrir. */
const menuFijo = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 900px)').matches;

/** Sin animaciones: el CSS ya lo respeta con `scroll-behavior`, `scrollBy` no. */
const movimientoReducido = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/** Las dos filas que se desplazan de costado (`base.css`). Una que entra entera no cuenta: no hay nada que mover. */
function sobreFilaDeslizable(destino: EventTarget | null): boolean {
  const fila = conClosest(destino)?.closest<HTMLElement>('.carrusel, .fila-dur');
  return !!fila && fila.scrollWidth > fila.clientWidth;
}

// Deslizar para abrir o cerrar el menú, como en una app nativa. Los listeners
// son pasivos: un deslizamiento vertical tiene que seguir desplazando la página.
app.addEventListener('touchstart', (e) => {
  if (escrituras) return;
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

app.addEventListener('touchmove', (e) => {
  if (escrituras) return;
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
  if (escrituras || !deslizando) return;
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
app.addEventListener('touchend', soltarDeslizamiento);
app.addEventListener('touchcancel', soltarDeslizamiento);

// El visor pasa de una foto a la otra con el dedo (spec §7). Va aparte del
// gesto del menú: ahí el deslizamiento arrastra el panel al ritmo del dedo, y
// acá la foto cambia de una vez, al soltar.
app.addEventListener('touchend', (e) => {
  if (escrituras || visorDesde === null || !visor) return;
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
  if (escrituras) return;
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
  if (escrituras) return;
  const campo = (e.target as HTMLInputElement | null);
  if (!campo?.dataset || !('tagNuevo' in campo.dataset)) return;
  if (agregarTag(campo.value)) campo.value = '';
});

/**
 * Una foto externa cuya URL no carga (P42): la app se entera por el `error`
 * del `<img>`, que no burbujea —de ahí la escucha en captura— y se trata como
 * una de Drive que ya no está. Las de Drive no pasan por acá: salen sin `src`
 * y las resuelve `completarFotos`.
 */
app.addEventListener('error', (e) => {
  const img = conClosest(e.target);
  if (img?.tagName === 'IMG') sacarFoto(img, FOTO_ROTA);
}, true);

app.addEventListener('change', (e) => {
  if (escrituras) return;
  // *Agregar foto*: el selector del sistema devolvió los archivos.
  const campoFotos = e.target as HTMLInputElement | null;
  if (campoFotos?.dataset && 'fotos' in campoFotos.dataset) {
    const archivos: Blob[] = Array.from(campoFotos.files ?? []);
    void (async () => {
      if (vistaActual?.vista === 'capturar') {
        avisoCaptura = await sumarFotosACaptura(archivos);
      } else if (vistaActual?.vista === 'borrador' && !editandoBorrador) {
        await agregarFotosABorrador(idActual(), archivos);
      } else if (enElEditor()) {
        // El editor no se redibuja: perdería lo escrito. La fila de
        // miniaturas se rehace sola.
        return agregarFotosAlEditor(archivos);
      } else {
        return;
      }
      await render();
    })();
    return;
  }
  // *Subir foto* en una categoría: una sola, y se sube recién al guardar (§7).
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
  if (vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva') revisarIncompleta();
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
// a la captura y se limpia la URL, para que recargar no vuelva a capturarlo.
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
// conceda no cambia nada— ni se espera (spec §6).
if (typeof navigator !== 'undefined') void navigator.storage?.persist?.().catch(() => {});

// `main.ts` se carga con `import()` desde `inicio.ts`, no con un `<script>`
// directo: puede llegar después de `load`, y ahí `addEventListener('load', …)`
// no dispara nunca y el service worker no se registra.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const registrarSW = (): void => { navigator.serviceWorker.register('./sw.js').catch(console.error); };
  if (document.readyState === 'complete') registrarSW();
  else window.addEventListener('load', registrarSW);
}
