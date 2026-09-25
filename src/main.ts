import { crearAuth, ErrorDeAuth } from './auth.js';
import { crearDrive, ErrorDeDrive } from './drive.js';
import { crearSheets, ErrorDeSheets } from './sheets.js';
import { crearStore, conConcurrencia, TOPE_LECTURAS } from './store.js';
import * as indiceLocal from './indice-local.js';
import { parse, slugArchivo } from './recipe.js';
import { tagReservado, conEspecial, esFavorita, tieneEspecial, tieneAlgoCargado } from './catalogo.js';
import { sePuedeTerminar } from './recipe.js';
import { crearRouter, parsearHash, hashDeCompartido, esHashDeInvitado, MENU, esDelMenu } from './ui/router.js';
import { renderRecetario } from './ui/recetario.js';
import { renderCategoria } from './ui/categoria.js';
import { renderTag } from './ui/tag.js';
import { renderResultados } from './ui/resultados.js';
import { renderReceta } from './ui/receta.js';
import { renderCocina } from './ui/cocina.js';
import {
  renderEditor, recetaDesdeFormulario, pillTag, confirmacionSalida, botonBorrar, confirmacionBorrado,
  renderAccionesFoto, renderElegirFoto, renderSelectorPortada, renderFotoPorUrl,
  filaDeFotosEditor, muestraDePortada, botonPonerFoto, carpetaDelEditor
} from './ui/editor.js';
import type { ArgsEditor } from './ui/editor.js';
import { renderPlan } from './ui/plan.js';
import { renderPlanAgregar, bloqueDeAgregar } from './ui/plan-agregar.js';
import type { OpcionesBloque } from './ui/plan-agregar.js';
import { renderCompras } from './ui/compras.js';
import { diaDeHoy } from './plan.js';
import { listaDeCompras, textoCompras } from './compras.js';
import type { ListaDeCompras } from './compras.js';
import { renderAjustes } from './ui/ajustes.js';
import { renderConexion } from './ui/conexion.js';
import {
  renderListaCategorias, renderEdicionCategoria, confirmacionBorrarCategoria, botonBorrarCategoria,
  muestraCategoria, FOTO_PROPIA
} from './ui/gestion-categorias.js';
import { colorLibre, problemaDelNombre } from './categorias.js';
import { renderSelector } from './ui/carpeta.js';
import { elegirCarpeta } from './picker.js';
import { API_KEY, NOMBRE_RAIZ } from './config.js';
import { puedeEmpezar, direccion, progreso, seAbre, ANCHO_MENU_FIJO } from './ui/gesto-menu.js';
import type { CarpetaSimple } from './ui/carpeta.js';
import { aviso, lateralFijo, SIN_SESION, FOTO_AUSENTE, FOTO_ROTA } from './ui/componentes.js';
import type { MenuDePantalla } from './ui/componentes.js';
import { pintar as pintarEnPantalla, pintarParte, despuesDePintar, conClosest, desplazarCarrusel, movimientoReducido } from './ui/pintar.js';
import { renderVisor, pasoDelVisor } from './ui/visor.js';
import type { EstadoVisor } from './ui/visor.js';
import type { EstadoCompartir } from './ui/compartir.js';
import {
  linkDeFoto, idDeDrive, resolverReceta, fotosSinUso, lineaDelCursor
} from './fotos-receta.js';
import { crearFotosControl, SECCIONES } from './fotos-control.js';
import { crearControlCocina } from './cocina-control.js';
import { crearNavegacion } from './navegacion.js';
import { crearVelo } from './velo.js';
import type { Llegada } from './navegacion.js';
import { registrarAcciones, accionDe } from './acciones.js';
import type { SeccionDeAcciones } from './acciones.js';
import { registrarCategorias } from './ui/categorias.js';
import { precargar, generar } from './pdf/generar.js';
import {
  compartirPdf, compartirLink, compartirTexto, plataformaDelNavegador, leerPortapapeles, enviarAlAgente
} from './compartir.js';
import { esRecetaEnMd, recetaRecibida, aplicarPegada, pedidoDeConversion } from './conversion.js';
import { desdeCompartido, tituloPorDefecto } from './compartido.js';
import { codificar, urlDeLink } from './link-receta.js';
import { textoReceta } from './texto-receta.js';
import type { Ruta, Vista } from './ui/router.js';
import { estadoNuevo } from './estado-pantalla.js';
import { accionesDeLista } from './lista-control.js';
import type { EstadoDePantalla, PedidoAlAgente } from './estado-pantalla.js';
import { achicar } from './fotos.js';
import type { OpcionesAchicar } from './fotos.js';
import { crearImagenes, conTope } from './imagenes.js';
import type { DatosFormulario } from './ui/editor.js';
import type { ResultadoArranque } from './store.js';
import type { Entrada, FotoDeReceta, Momento, Plan, Receta } from './tipos.js';

type Store = ReturnType<typeof crearStore>;

const app = document.querySelector('#app');
if (!app) throw new Error('Falta #app en el documento');
const auth = crearAuth();
const drive = crearDrive(() => auth.token());
const sheets = crearSheets(() => auth.token());
/** Las fotos de Drive, pedidas con el token y guardadas en Cache Storage. */
const imagenes = crearImagenes({ leerBlob: id => drive.leerBlob(id) });
/** El único que cambia la URL y se mueve por el historial. */
const nav = crearNavegacion({ location, history });

/**
 * Nada espera a una imagen para dibujarse: una foto de Drive sale como
 * `<img data-drive>` sin `src` —un recuadro del mismo tamaño— y una foto nueva
 * del editor como `<img data-n>`, y después de cada dibujo se les pone el
 * `src` cuando el blob está. Va enganchado a `pintar` y a `pintarParte` en vez
 * de repetirse en cada pantalla: son treinta llamadas y ninguna tiene que
 * acordarse.
 *
 * Los dibujos de una misma vuelta se completan en una sola pasada: un cambio
 * del editor redibuja la fila, la portada y el botón de poner foto, y cada
 * pasada pediría de nuevo las fotos que la anterior todavía no terminó.
 */
let completarPedido = false;
despuesDePintar(() => {
  if (completarPedido) return;
  completarPedido = true;
  queueMicrotask(() => {
    completarPedido = false;
    void completarFotos();
  });
});
/**
 * El velo que quedó puesto después del tilde se va cuando la pantalla de
 * destino está dibujada: si se fuera antes, se vería el repintado por debajo
 * (§6.17b). Una parte dibujada también cuenta: la escritura que no navega
 * redibuja sólo lo suyo.
 */
despuesDePintar(() => { velo.alPintar(); });

/** Dibuja la pantalla entera. */
const pintar = (html: string): void => {
  pintarEnPantalla(conLateralFijo(html));
  mirarElAviso();
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
 * está pasa al recuadro de aviso si está en un cuadro de foto, y no se dibuja
 * en ningún otro lado.
 * Las de Drive van de a dos, como la precarga: de
 * a una, una lista entera se completa de arriba a abajo y se ve llegar.
 */
async function completarFotos(): Promise<void> {
  for (const img of document.querySelectorAll<HTMLElement>('#app img[data-n]:not([src])')) {
    const url = fotosEditor.urlEnMemoria(Number(img.dataset['n']));
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
 * La foto que no se va a ver: en un cuadro de foto (`.cuadro-foto`: la
 * cabecera y el carrusel de la receta, la fila y las grillas del editor, su
 * portada, la muestra de la categoría) deja el recuadro con el motivo, y en
 * cualquier otro lado —un paso, una lista— el bloque no se dibuja. En una
 * lista, abajo queda el placeholder de la categoría.
 */
function sacarFoto(img: Element, recuadro: string): void {
  // Sin `pintarParte`: el recuadro no deja ninguna foto pedida.
  if (img.closest('.cuadro-foto')) img.outerHTML = recuadro;
  else img.remove();
}

let store: Store;
let estadoArranque: ResultadoArranque | undefined;
let vistaActual: Ruta | null = null;
/** El id de la ruta que se está mirando: la receta o la categoría. */
const idActual = (): string => vistaActual?.params['id'] ?? '';
/** Lo que es de la pantalla que se mira. Cambiar de pantalla lo reemplaza entero. */
let estadoDePantalla: EstadoDePantalla = estadoNuevo();

/**
 * Las carpetas que la pantalla de la carpeta base ofrece. Vienen del arranque y
 * no de la pantalla: sobreviven a salir y volver. Que se esté cambiando la
 * carpeta sale de la ruta. La app no lista nada del Drive: la carpeta se crea,
 * o se elige con el Picker de Google.
 */
let sugerenciasDeCarpeta: CarpetaSimple[] = [];

/** Se entró desde Ajustes a cambiar la carpeta, y no por no tener ninguna. */
const cambiandoCarpeta = (): boolean => vistaActual?.params['cambiando'] === '1';

/**
 * El setup de la carpeta elegida —o de la que se crea acá, con `'crear'`—
 * con el velo del progreso, y la recarga al terminar. Si falla, el aviso
 * reemplaza los botones y Reintentar vuelve a ofrecer la misma carpeta:
 * repetir el setup no duplica nada. La carpeta creada queda como
 * `confirmando`, así un fallo después se reintenta sobre ella y no crea otra.
 */
async function usarCarpeta(elegida: CarpetaSimple | 'crear'): Promise<void> {
  let creada = elegida !== 'crear';
  try {
    await velo.conProgreso('Preparando la carpeta…', async avance => {
      const carpeta = elegida === 'crear' ? await store.crearCarpeta(NOMBRE_RAIZ, 'root') : elegida;
      creada = true;
      estadoDePantalla.selector.confirmando = carpeta;
      // La anotación es para los otros dispositivos: si falla, el cambio sigue.
      if (cambiandoCarpeta()) await store.marcarReemplazada().catch(err => console.error(err));
      await store.prepararCarpeta(carpeta, avance);
    });
  } catch (err) {
    console.error(err);
    estadoDePantalla.selector.error = creada ? 'No se pudo preparar la carpeta.' : 'No se pudo crear la carpeta.';
    return render();
  }
  // La copia ya es la de la carpeta elegida: recargar abre con un pedido.
  nav.reemplazar('#/');
  location.reload();
}

/**
 * El menú lateral desplegado. Sólo aplica en pantalla angosta: desde 900 px es
 * fijo. Va aparte del estado de la pantalla porque lo cambian el gesto y la
 * pregunta de cambios sin guardar, sin dibujar nada; navegar lo cierra igual.
 */
let menuAbierto = false;

/**
 * La receta abierta, leída una vez. Es un caché: sobrevive entre las pantallas
 * de la misma receta. La reutilizan los redibujados —marcar un
 * paso, conmutar, tocar el sol: cada lectura era un pedido a Drive que se
 * sentía en cada toque— y el ir y venir entre la receta, su modo cocina y su
 * editor, que es la misma receta. Salir a cualquier otra pantalla la descarta:
 * volver más tarde vuelve a leer, porque el archivo es la verdad (C05.8.1).
 */
let recetaLeida: { id: string; entrada: Entrada | null; receta: Receta } | null = null;

/**
 * Un aviso y un pedido al agente que no salió, para la pantalla a la que se
 * va. Sobreviven al cambio de pantalla a propósito: al llegar pasan a ser el
 * `avisoDeLlegada` y el `pedidoPendiente` de la pantalla nueva, y acá se
 * vacían.
 */
let avisoAlLlegar = '';
let pedidoAlLlegar: PedidoAlAgente | null = null;
const PEDIDO_COPIADO = 'Pedido copiado: pegalo en el agente';

/**
 * El plan de la semana, leído de su `.md` una vez. Mismo criterio que la
 * receta: es un caché que se conserva mientras se navega entre las tres
 * pantallas del plan y se descarta al salir a cualquier otra.
 */
let planLeido: Plan | null = null;
const PANTALLAS_DE_PLAN: readonly Ruta['vista'][] = ['plan', 'plan-agregar', 'plan-compras'];
/**
 * Lo último que falló al escribir el plan. La grilla sigue mostrando lo que
 * dice Drive. Sobrevive entre las pantallas del plan, como el plan leído:
 * agregar escribe y cierra, y el aviso va en el plan.
 */
let errorPlan = '';
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
 * La pantalla desde la que se tapó: mientras el velo está puesto, un
 * `hashchange` vuelve a ella (ver `render`).
 */
let hashAlTapar = '';

/**
 * El velo (R8). Con la pantalla ocupada no se navega ni responde ningún
 * control; lo lee cada oyente con `velo.ocupado()`.
 */
const velo = crearVelo({
  velo: () => document.querySelector<HTMLElement>('#velo-escritura'),
  app: () => app,
  alTapar: () => { hashAlTapar = location.hash; }
});

/** Las pantallas de una misma receta, entre las que la copia leída se conserva. */
const PANTALLAS_DE_RECETA: readonly Ruta['vista'][] = ['receta', 'cocinar', 'editar'];

/**
 * La receta de la pantalla: de Drive la primera vez, de memoria mientras no se
 * salga. La lectura es una espera: la pantalla no se toca hasta que llega.
 */
async function recetaDePantalla(id: string): Promise<{ entrada: Entrada | null; receta: Receta }> {
  if (recetaLeida?.id !== id) {
    const { entrada, receta } = await velo.esperar(() => store.receta(id));
    recetaLeida = { id, entrada, receta };
    // El depósito entero, no sólo lo que está a la vista: así el visor
    // desliza sin esperar.
    const ids = idsDeDrive(receta.fotos.map(f => f.url));
    if (ids.length) void imagenes.precargar(ids);
  }
  return recetaLeida;
}

/** El plan de la pantalla: de Drive la primera vez, de memoria mientras no se salga. Leerlo es una espera. */
async function planDePantalla(): Promise<Plan> {
  if (!planLeido) planLeido = await velo.esperar(() => store.plan());
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

/**
 * Las recetas con el tag `menú diario`: lo que la pantalla de agregar ofrece
 * sin buscar nada. Un borrador no entra aunque lleve el tag: a los borradores
 * se llega por el menú, no por acá.
 */
const delMenuDiario = (): Entrada[] =>
  store.entradas().filter(e => tieneEspecial(e, 'menú diario') && !tieneEspecial(e, 'borrador'));

/**
 * Las recetas de una categoría, para cuando se la elige en la grilla de
 * agregar al plan. Un borrador de esa categoría no se ofrece.
 */
const delaCategoria = (nombre: string): Entrada[] =>
  store.entradas().filter(e => e.categoria === nombre && !tieneEspecial(e, 'borrador'));

/** Deja la categoría elegida en *Agregar al plan*: lo que se lista cambia, y vuelve al primer tramo. */
function dejarCategoriaDelPlan(): void {
  estadoDePantalla.categoriaPlan = null;
  estadoDePantalla.lista.primerTramo();
}

/**
 * La lista de compras del plan. Las recetas se leen de Drive al entrar, una por
 * receta distinta; una que ya no se puede leer se saltea. Después cuentan una
 * vez por aparición: la misma receta en dos comidas cuenta dos veces.
 *
 * Las lecturas se solapan, de a seis como el reindexado: en fila, un plan
 * cargado son catorce viajes uno detrás de otro. Y tapan la pantalla
 * mientras duran —no escriben nada, pero es la espera más larga de la app
 * (R8)—; con la lista ya armada no se espera nada.
 */
async function comprasDelPlan(plan: Plan): Promise<ListaDeCompras> {
  const clave = plan.comidas.map(c => c.id).join(',');
  if (comprasLeidas?.clave === clave) return comprasLeidas.lista;
  const ids = [...new Set(plan.comidas.map(c => c.id))];
  const leidas = new Map<string, Receta>();
  // El error se atrapa acá adentro y no afuera: `conConcurrencia` corta el
  // reparto con el primero que falla, y una receta borrada sólo se saltea.
  const traidas = await velo.esperar(() => conConcurrencia(ids, TOPE_LECTURAS, (id: string) =>
    store.receta(id).catch(err => { console.error(err); return null; })));
  for (const [i, id] of ids.entries()) {
    const leida = traidas[i];
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

/**
 * Escribe el plan entero con el cambio y lo deja en memoria; si falla, la
 * grilla no cambia y el aviso lo dice (R1). El plan puede no estar leído
 * todavía, y leerlo es otro pedido a Drive antes de escribir: el velo cubre
 * las dos cosas, desde el toque.
 */
async function guardarPlan(cambio: (plan: Plan) => Plan): Promise<void> {
  try {
    await velo.escribir(async () => {
      const nuevo = cambio(await planDePantalla());
      await store.guardarPlan(nuevo);
      planLeido = nuevo;
    });
    errorPlan = '';
  } catch (err) {
    console.error(err);
    errorPlan = 'No se pudo guardar el plan. Revisá la conexión.';
  }
}

/** Lo que el reindexado dejó afuera, para la sección de avisos de Ajustes. */
let ignorados: string[] = [];
/** Las recetas de `_sin-categoria/` sin el tag borrador que avisó el último reindexado. */
let sinBorrador: string[] = [];
/** El mail de la cuenta conectada. Se pide una vez, al entrar a Ajustes. */
let cuenta = '';

/**
 * El deslizamiento cambió de foto: el click que viene después del `touchend`
 * no cierra el visor, que si no se cerraría en cada gesto.
 */
let deslizoElVisor = false;
/** Dónde empezó el deslizamiento sobre el visor, o `null`. */
let visorDesde: number | null = null;

/**
 * El depósito de fotos del editor: las fotos, la portada y las nuevas en
 * memoria hasta Guardar. Va aparte del estado de la pantalla porque completar
 * las fotos de cualquier dibujo lo lee, y porque las compartidas se suman
 * antes de que el editor se dibuje; vive lo que dura el editor y se vacía al
 * salir.
 */
const fotosEditor = crearFotosControl({
  achicar: foto => achicarFoto(foto),
  crearUrl: foto => imagenes.urlDeBlob(foto),
  soltarUrl: url => { imagenes.soltarUrl(url); },
  campos: {
    leer: nombre => campoDelEditor(nombre)?.value ?? null,
    escribir: (nombre, valor) => {
      const campo = campoDelEditor(nombre);
      if (campo) campo.value = valor;
    }
  },
  alCambiar: () => { mostrarDeposito(); }
});
/**
 * La receta `.md` que llegó compartida. Vive mientras la ruta la nombra
 * (`recibida=1`), y por eso sobrevive al cambio de pantalla que la abre: el
 * editor la aplica al abrir, y en una receta nueva es también la base de lo
 * que el editor no muestra.
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
const abrirEditor = (dibujar: () => void): void => {
  dibujar();
  estadoDePantalla.editorAbierto = { hash: location.hash, formulario: formularioActual() };
};

/**
 * Dibuja el editor de una receta. El depósito que dibuja es el que queda en
 * `fotosEditor`: los ocultos del formulario y el controlador dicen lo mismo.
 */
function pintarEditor(args: ArgsEditor): void {
  fotosEditor.cargar(args.receta);
  pintar(renderEditor(args));
}

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
    sugerenciasDeCarpeta = estadoArranque.sugerencias.map(c => ({ id: c.id, nombre: c.name ?? '' }));
    // Sin avisar: el `hashchange` de un reemplazo dibujaría la carpeta una
    // segunda vez.
    nav.arrancar('#/carpeta');
    router.iniciar();
    return;
  }
  if (estadoArranque.estado === 'solo-lectura') {
    return pintar('<div class="cuerpo">' + aviso({
      texto: 'No se pudo conectar con Drive. Sin esa lectura no hay con qué dibujar.',
      accion: { etiqueta: 'Reintentar', accion: 'reconectar' }
    }) + '</div>');
  }

  return terminarArranque(estadoArranque.reconstruir);
}

/**
 * El índice y la primera pantalla. Reindexar rearma el índice entero:
 * cargarlo antes es leer de más, y una planilla de un esquema viejo puede no
 * tener todas sus hojas. Si el reindexado falla, el aviso lo dice y
 * Reintentar vuelve acá.
 */
async function terminarArranque(reindexar: boolean): Promise<void> {
  if (reindexar) {
    try {
      await reconstruir();
    } catch (err) {
      console.error(err);
      return pintar('<div class="cuerpo">' + aviso({
        texto: 'No se pudo reindexar.', accion: { etiqueta: 'Reintentar', accion: 'reindexar-al-arrancar' }
      }) + '</div>');
    }
  } else await store.cargarIndice();
  registrarCategorias(store.categorias());
  router.iniciar();
}

/** El contador del menú: las recetas con el tag `borrador`. */
const cuantosBorradores = (): number => store.buscar({ tags: ['borrador'] }).length;

/** El menú de la pantalla, si es destino del menú (`MENU`); si no, nada. */
const menuDe = (vista: Vista | undefined): { menu?: MenuDePantalla } =>
  vista && esDelMenu(vista)
    ? { menu: { activo: MENU[vista] ?? null, abierto: menuAbierto, borradores: cuantosBorradores() } }
    : {};

/**
 * Desde 900 px el lateral queda fijo en todas las pantallas (C05.10.1). Las
 * de `MENU` lo dibujan ellas, con su hamburguesa; a las demás se lo pone acá,
 * sólo para pantalla ancha: en el teléfono no lo abre nada. Sin carpeta base
 * —o sin arranque— no hay a dónde ir.
 */
function conLateralFijo(html: string): string {
  const vista = vistaActual?.vista;
  if (!vista || esDelMenu(vista) || vista === 'carpeta' || estadoArranque?.estado !== 'listo') return html;
  return lateralFijo(cuantosBorradores(), html);
}

/** Ajustes, con lo que dejó el último reindexado. */
function dibujarAjustes(): void {
  pintar(renderAjustes({
    cuenta, ultimaReindexado: store.ultimaReconstruccion(), ignorados, sinBorrador,
    indiceDuplicado: indiceDuplicado(), planDuplicado: store.planDuplicado(),
    errorReindexado: estadoDePantalla.errorReindexado,
    ...menuDe('ajustes'),
    informe: informeArranque(), recetas: store.entradas().length, categorias: store.categorias().length,
    carpeta: store.carpeta().nombre
  }));
}

/**
 * Reindexar lee todos los `.md` y rearma la planilla: es la reparación
 * universal. Corre con el velo del progreso, que bloquea todo: no se puede
 * cancelar —cortar a mitad deja el índice en el estado que el reindexado
 * existe para reparar— y mientras corre no se guarda, ni se borra, ni se
 * navega (C05.5.2). No dibuja la pantalla: la dibuja quien reindexó, así el
 * arranque la dibuja una sola vez. Si falla, rechaza, y el aviso lo pone él.
 */
async function reconstruir(): Promise<void> {
  const r = await velo.conProgreso('Reindexando…', avance => store.reconstruir(avance));
  ignorados = r.ignorados;
  sinBorrador = r.sinBorrador;
  registrarCategorias(store.categorias());
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

/** El tramo siguiente de la lista de la pantalla entera se dibuja redibujándola. */
const observarLista = (): void => { estadoDePantalla.lista.observar('#app', () => render()); };

/**
 * Lo que va debajo de la caja de *Agregar al plan*: los resultados de lo
 * escrito, las recetas de la categoría elegida, o el Menú diario con la grilla.
 */
function bloqueDelPlan(): OpcionesBloque {
  const { lista, consultaPlan, categoriaPlan } = estadoDePantalla;
  if (consultaPlan.trim()) {
    return { busqueda: { consulta: consultaPlan, lista: lista.agrupada(store.buscarPorTexto(consultaPlan)) } };
  }
  if (categoriaPlan) return { categoria: { nombre: categoriaPlan, lista: lista.plana(delaCategoria(categoriaPlan), { filtros: false }) } };
  return { menuDiario: lista.plana(delMenuDiario(), { filtros: false }), categorias: store.categorias() };
}

/**
 * Redibuja sólo el bloque de *Agregar al plan*: repintar la pantalla entera
 * perdería el foco del teclado. El tramo siguiente se dibuja por acá también.
 */
function pintarBloqueDelPlan(): void {
  const bloque = document.querySelector('[data-resultados-plan]');
  if (!bloque) return;
  pintarParte(bloque, bloqueDeAgregar(bloqueDelPlan()));
  estadoDePantalla.lista.observar('[data-resultados-plan]', pintarBloqueDelPlan);
}

/** La misma pantalla: la misma vista con los mismos parámetros, todos. */
function mismaPantalla(a: Ruta, b: Ruta): boolean {
  const claves = Object.keys(a.params);
  return a.vista === b.vista && claves.length === Object.keys(b.params).length
    && claves.every(k => a.params[k] === b.params[k]);
}

/**
 * La pantalla no se puede dejar todavía: la URL vuelve a la suya sin dibujar
 * nada. Una entrada nueva —un link— se deshace, así no queda en el historial;
 * si se salía por el atrás, la pantalla se vuelve a poner adelante.
 */
function quedarseEn(hash: string, llegada: Llegada | null): void {
  if (llegada === 'nueva') nav.deshacer();
  else nav.restaurar(hash);
}

/**
 * Dibuja la pantalla que la ruta pide. Es el único lugar que decide qué se ve.
 *
 * Cada rama que lee de red envuelve la lectura y dibuja un aviso si falla,
 * **sin datos viejos**: sin la lectura no hay con qué dibujar, y esa es la
 * consecuencia buscada de no tener copia local (C05.8.1). Ningún error muestra
 * el mensaje crudo de Google (R1).
 */
async function render(ruta: Ruta = parsearHash(location.hash), llegada: Llegada | null = null): Promise<void> {
  // La vista de invitado se elige una sola vez, al cargar (`inicio.ts`), y un
  // cambio de fragmento no recarga: el dueño que toca su propio link con la PWA
  // abierta vería el Recetario. Recargar deja que `inicio.ts` vuelva a decidir.
  if (esHashDeInvitado(location.hash)) { location.reload(); return; }
  const cambiaDePantalla = !vistaActual || !mismaPantalla(ruta, vistaActual);

  // Sin carpeta base no hay con qué dibujar ninguna otra pantalla.
  if (estadoArranque?.estado === 'elegir-carpeta' && ruta.vista !== 'carpeta') {
    nav.reemplazar('#/carpeta');
    return;
  }

  // Con la pantalla ocupada no se navega: el resultado o el error tienen que
  // llegar a la pantalla que lanzó la operación. Como el `hashchange` no se
  // puede cancelar, la URL vuelve a la de esa pantalla, igual que con el
  // editor. El hash es el de cuando se tapó: acá `location.hash` ya es el destino.
  if (velo.ocupado() && cambiaDePantalla) { quedarseEn(hashAlTapar, llegada); return; }

  // Salir del editor con cambios pregunta antes (C04.1.1). El `hashchange` no
  // se puede cancelar: cuando llega, el link, el volver del encabezado o el
  // gesto de atrás ya cambiaron la URL. Así que no se dibuja la pantalla
  // nueva —el formulario sigue en el DOM con lo escrito—, la URL vuelve a ser
  // la del editor, y se pregunta. Si se salía por un link, su destino queda
  // anotado para *Salir sin guardar*.
  if (cambiaDePantalla && estadoDePantalla.editorAbierto && formularioActual() !== estadoDePantalla.editorAbierto.formulario) {
    estadoDePantalla.salidaPendiente = llegada === 'nueva' ? location.hash : null;
    quedarseEn(estadoDePantalla.editorAbierto.hash, llegada);
    // Si se llegó desde un destino del menú, el menú se cierra: la pregunta
    // queda en el formulario, debajo del velo.
    ponerMenu(false);
    const formulario = document.querySelector('[data-formulario]');
    if (formulario && !document.querySelector('[data-salida]')) pintarParte(formulario, confirmacionSalida, 'al-principio');
    window.scrollTo?.(0, 0);
    return;
  }

  // Cambiar de categoría o de vista limpia lo que era de la anterior: si no,
  // se entra a otra categoría y no se ve nada porque quedó filtrando por un
  // tag que ahí no existe, sin forma de darse cuenta.
  if (cambiaDePantalla) {
    estadoDePantalla.lista.soltar();
    estadoDePantalla = {
      ...estadoNuevo(),
      compartidasPorLeer: ruta.vista === 'nueva' ? Number(ruta.params['fotos'] ?? 0) || 0 : 0,
      avisoDeLlegada: avisoAlLlegar,
      pedidoPendiente: pedidoAlLlegar
    };
    avisoAlLlegar = '';
    pedidoAlLlegar = null;
    // Lo que sobrevive a la pantalla, cada cosa hasta donde le toca.
    if (!ruta.params['recibida']) recibida = null;
    if (!PANTALLAS_DE_RECETA.includes(ruta.vista)) recetaLeida = null;
    if (!PANTALLAS_DE_PLAN.includes(ruta.vista)) { planLeido = null; comprasLeidas = null; errorPlan = ''; }
    // Navegar cierra el menú: se abrió para elegir a dónde ir.
    menuAbierto = false;
    // Las imágenes de la pantalla anterior se sueltan: el visor es de esa pantalla.
    imagenes.soltarImagenes();
    // Las fotos del editor viven lo que la pantalla: salir sin guardar no deja
    // nada en Drive, y volver a entrar abre con lo que dice el `.md`.
    fotosEditor.vaciar();
    cocina.reiniciar();
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
        tags: store.tagsDe(), ...menuDe('recetario')
      }));
      return precargarElHome();

    case 'categoria': {
      const nombre = ruta.params['nombre'] ?? '';
      const { lista } = estadoDePantalla;
      pintar(renderCategoria({
        nombre, lista: lista.plana(store.buscar({ categoria: nombre, tags: [...lista.tagsActivos] })),
        tagsActivos: lista.tagsActivos, tags: store.tagsDe(nombre)
      }));
      return observarLista();
    }

    case 'tag':
    case 'borradores': {
      // Se llega tocando un chip del carrusel del Recetario: el tag tocado
      // entra como filtro igual que en la categoría, para poder sumarle otros.
      // Borradores es la misma lista con `borrador`, como destino del menú.
      const esBorradores = ruta.vista === 'borradores';
      const nombre = esBorradores ? 'borrador' : ruta.params['nombre'] ?? '';
      const { lista } = estadoDePantalla;
      const activos = lista.tagsActivos.includes(nombre) ? [...lista.tagsActivos] : [nombre, ...lista.tagsActivos];
      pintar(renderTag({
        tag: nombre, lista: lista.plana(store.buscar({ tags: activos })), tagsActivos: activos, tags: store.tagsDe(),
        ...(esBorradores ? { titulo: 'Borradores', borradores: true } : {}), ...menuDe(ruta.vista)
      }));
      return observarLista();
    }

    case 'resultados': {
      const q = ruta.params['q'] ?? '';
      pintar(renderResultados({ consulta: q, lista: estadoDePantalla.lista.agrupada(store.buscarPorTexto(q)) }));
      return observarLista();
    }

    case 'receta':
      try {
        const { entrada, receta } = await recetaDePantalla(ruta.params['id'] ?? '');
        pintar(renderReceta({
          entrada, receta,
          ...(estadoDePantalla.visor ? { visor: estadoDePantalla.visor } : {}),
          ...(estadoDePantalla.compartiendo ? { compartir: estadoDePantalla.compartiendo } : {}),
          ...(estadoDePantalla.marcandoFavorito ? { favorito: 'escribiendo' as const } : {}),
          ...(estadoDePantalla.errorFavorito ? { error: estadoDePantalla.errorFavorito } : {}),
          ...(estadoDePantalla.pedidoPendiente
            ? { aviso: {
                texto: 'La receta quedó guardada. Tocá para mandarla al agente.',
                accion: { etiqueta: 'Mandar al agente', accion: 'mandar-al-agente' }
              } }
            : estadoDePantalla.avisoDeLlegada ? { aviso: { texto: estadoDePantalla.avisoDeLlegada } } : {})
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
      const { error, confirmando } = estadoDePantalla.selector;
      return pintar(renderSelector({
        sugerencias: sugerenciasDeCarpeta, confirmando,
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
      if (id !== 'nueva' && !categoria) { nav.reemplazar('#/categorias'); return; }
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      const valores = categoria
        ? { nombre: categoria.nombre, color: categoria.color, foto: categoria.foto }
        : { nombre: '', color: colorLibre(store.categorias().map(c => c.color)), foto: '' };
      return abrirEditor(() => { pintar(renderEdicionCategoria({ categoria, valores, otros })); });
    }

    case 'plan':
      try {
        const plan = await planDePantalla();
        return pintar(renderPlan({
          plan, entradas: store.entradas(), hoy: diaDeHoy(), ...menuDe('plan'),
          ...(estadoDePantalla.confirmandoReinicio ? { confirmandoReinicio: true } : {}),
          ...(errorPlan ? { error: errorPlan } : {})
        }));
      } catch (err) {
        console.error(err);
        return enPantalla('No se pudo leer el plan.');
      }

    case 'plan-agregar':
      // El día y el momento ya vienen validados por el router: sin una comida
      // a la que sumar, la ruta cae en el plan.
      pintar(renderPlanAgregar({
        dia: Number(ruta.params['dia'] ?? 0),
        momento: (ruta.params['momento'] ?? 'noche') as Momento,
        consulta: estadoDePantalla.consultaPlan, ...bloqueDelPlan()
      }));
      return estadoDePantalla.lista.observar('[data-resultados-plan]', pintarBloqueDelPlan);

    case 'plan-compras':
      try {
        const lista = await comprasDelPlan(await planDePantalla());
        return pintar(renderCompras({ lista, ...(estadoDePantalla.compartiendo ? { compartir: estadoDePantalla.compartiendo } : {}) }));
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
          ? aplicarPegada(receta, recibida, carpetaDelEditor(entrada?.carpeta_id ?? '', store.categorias()))
          : null;
        abrirEditor(() => pintarEditor({
          entrada, receta: conRecibida ?? receta, categorias: store.categorias(),
          tagsConocidos: store.tagsDe().map(t => t.tag)
        }));
        // Lo recibido cuenta como cambio desde que se abre: la foto contra la
        // que se compara queda vacía, así que cualquier formulario difiere.
        if (conRecibida && estadoDePantalla.editorAbierto) estadoDePantalla.editorAbierto.formulario = '';
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
        estadoDePantalla.compartidasPorLeer = 0;
        await imagenes.descartarCompartidas().catch(err => console.error(err));
        recibirReceta(texto);
        return;
      }
      const noSeLeyo = estadoDePantalla.compartidasPorLeer ? await leerCompartidas() : false;
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
      receta.fotos = fotosEditor.fotos();
      // Una receta nace como borrador: sacar el tag es la declaración explícita
      // de que está terminada (C04.3b.1).
      receta.tags = conEspecial(receta.tags, 'borrador', true);
      abrirEditor(() => pintarEditor({
        entrada: null, receta, categorias: store.categorias(),
        tagsConocidos: store.tagsDe().map(t => t.tag), ...menuDe(vistaActual?.vista)
      }));
      // Lo que llegó de otra app cuenta como cambio desde que se abre: salir
      // sin guardar lo perdería.
      if (llegoDeAfuera(ruta) && estadoDePantalla.editorAbierto) estadoDePantalla.editorAbierto.formulario = '';
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
  const cantidad = estadoDePantalla.compartidasPorLeer;
  estadoDePantalla.compartidasPorLeer = 0;
  // Leer y achicar es una espera: una sola para todas las fotos.
  return velo.esperar(async () => {
    let noSeLeyo = false;
    try {
      let llegadas: Blob[];
      // El caché se vacía aunque la lectura falle: si no, las fotos quedarían
      // ahí hasta la próxima vez que se comparta algo.
      try {
        llegadas = await imagenes.fotosCompartidas(cantidad);
      } finally {
        await imagenes.descartarCompartidas().catch(err => console.error(err));
      }
      noSeLeyo = await fotosEditor.sumarFotos(llegadas);
    } catch (err) {
      console.error(err);
      noSeLeyo = true;
    }
    return noSeLeyo;
  });
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
  nav.reemplazar(existe ? `#/r/${encodeURIComponent(id)}/editar?recibida=1` : '#/nueva?recibida=1');
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
    mostrarConvertir(true);
    sincronizarTags();
  }
}

/**
 * Convertir con Agente se ve sólo mientras la receta tiene `borrador`. Se
 * oculta con el atributo y no redibujando: redibujar perdería lo escrito.
 */
function mostrarConvertir(conBorrador: boolean): void {
  const convertir = document.querySelector<HTMLElement>('#app [data-accion="convertir-con-agente"]');
  if (convertir) convertir.hidden = !conBorrador;
}

/** Lo que mide un renglón de un campo: `--txt-base` por la interlínea 1.5. */
const ALTO_RENGLON = 24;

/** Se está en el editor de una receta, la que sea: ahí nada se redibuja sin perder lo escrito. */
const enElEditor = (): boolean => vistaActual?.vista === 'editar' || vistaActual?.vista === 'nueva';

/** Un campo del formulario por su `name`, como lo hace `revisarBorrador`. */
const campoDelEditor = (nombre: string) =>
  document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#app [name="${nombre}"]`);

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
 * Lo que muestra el depósito, después de cada cambio de `fotosEditor`, sin
 * redibujar el formulario, que perdería lo que se venía escribiendo:
 * - la fila de miniaturas, con el uso de cada foto según lo que está escrito
 *   ahora —la marca aparece al elegir una portada o al poner una foto en una
 *   línea—;
 * - la miniatura de la portada;
 * - el botón de poner foto: sacar la última lo deja sin nada que ofrecer.
 */
function mostrarDeposito(): void {
  const fila = document.querySelector<HTMLElement>('#app .fotos-campo');
  if (fila) pintarParte(fila, filaDeFotosEditor(recetaDelEditor()), 'reemplazar');
  const boton = document.querySelector<HTMLElement>('#app .portada-boton');
  if (boton) pintarParte(boton, muestraDePortada(fotosEditor.portada() || null, fotosEditor.fotos()));
  acomodarBotonDeFoto();
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
  if (!fotosEditor.fotos().length) return;
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
  pintarParte(marco, botonPonerFoto(seccion, lineaDelCursor(texto, posicion), tope), 'al-final');
}

/** Las fichas al pie del editor y el velo con el que se cierran. */
const FICHAS_DE_FOTO =
  '#app [data-acciones-foto], #app [data-elegir-foto], #app [data-selector-portada], ' +
  '#app [data-foto-url], #app .velo[data-accion="cerrar-ficha-foto"]';

/** Saca del DOM la ficha que esté abierta, sin tocar el formulario ni el historial. */
function quitarFichaFoto(): void {
  for (const e of document.querySelectorAll(FICHAS_DE_FOTO)) e.remove();
}

/** Cierra la ficha desde la app —el velo, una elección—: su capa se consume. */
function cerrarFichaFoto(): void {
  quitarFichaFoto();
  nav.cerrarCapa('ficha-foto');
}

/**
 * Abre una ficha al pie: siempre una sola, como la hoja de Compartir. Se
 * cuelga del formulario del editor, que no se redibuja; la ficha es fija
 * (`tokens.css`), así que de dónde cuelgue no le cambia nada. Es una capa: el
 * atrás la cierra, y otra ficha toma su lugar en el historial.
 */
function abrirFichaFoto(html: string): void {
  quitarFichaFoto();
  const formulario = document.querySelector('[data-formulario]');
  if (!formulario) return;
  pintarParte(formulario, html, 'al-final');
  nav.abrirCapa('ficha-foto');
}

/**
 * Un aviso arriba del formulario —el de las fotos, o el de Pegar—, que
 * aparece y se va sin redibujarlo: en el editor redibujar perdería lo escrito,
 * y en la categoría apagaría Guardar hasta la próxima tecla.
 */
function avisarEnElFormulario(texto: string): void {
  document.querySelector('#app [data-aviso-fotos]')?.remove();
  if (!texto) return;
  const formulario = document.querySelector('[data-formulario]');
  if (formulario) pintarParte(formulario, `<div data-aviso-fotos>${aviso({ texto })}</div>`, 'al-principio');
  // Arriba del formulario, con la ficha Fotos al fondo, el aviso queda fuera de
  // pantalla; nadie lo redibuja, así que se lo trae acá (R1).
  mirarElAviso();
}

/**
 * *Cámara* o *Galería*: las fotos entran al depósito del editor, achicadas y
 * en memoria hasta Guardar. Una sola espera, aunque se elijan cinco fotos.
 */
async function agregarFotosAlEditor(archivos: Blob[]): Promise<void> {
  const noSeLeyo = await velo.esperar(() => fotosEditor.sumarFotos(archivos));
  avisarEnElFormulario(noSeLeyo ? NO_SE_LEYO_UNA_FOTO : '');
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
 * **El pedido se corta solo.** Es el único pedido a un sitio ajeno que ocupa la
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

/** Abre la ficha de *Por URL*. El aviso de un intento anterior se va al traer la próxima. */
function abrirFotoPorUrl(): void {
  abrirFichaFoto(renderFotoPorUrl());
}

/**
 * *Traer* en la ficha de *Por URL*. La foto bajada entra al depósito por el
 * mismo camino que una de la cámara. Lo que no se pudo bajar entra como link
 * externo —el `.md` de la receta acepta una URL ajena como cualquier otra—, y
 * lo que no es una foto no entra y deja la ficha abierta con lo escrito: el
 * aviso vuelve con lo que se escribió y no con lo normalizado (R1).
 */
async function agregarFotoPorUrl(escrita: string): Promise<void> {
  // Cada intento empieza sin el aviso del anterior: dos avisos a la vez no
  // dicen cuál es el de ahora.
  avisarEnElFormulario('');
  const url = conEsquemaEnMinuscula(escrita);
  const reabrir = (mensaje: string): void => { abrirFichaFoto(renderFotoPorUrl(escrita, mensaje)); };
  // Lo que ni siquiera tiene forma de dirección no se pide: es lo único que se
  // puede escribir como línea del depósito (C05.1.5).
  if (!URL_DE_FOTO.test(url)) return reabrir(NO_ES_UNA_FOTO);
  // Desde Pages, una `http://` es contenido mixto: el pedido falla siempre y
  // la imagen tampoco cargaría después. Entra como link y no sirve de nada.
  if (url.startsWith('http://')) return reabrir(SOLO_HTTPS);
  // Bajarla y achicarla son una sola espera.
  const resultado = await velo.esperar(async () => {
    const traida = await traerFoto(url);
    if (traida.que !== 'foto') return traida.que;
    return await fotosEditor.sumarFotos([traida.blob]) ? 'no-se-leyo' : 'sumada';
  });
  if (resultado === 'no-es-foto') return reabrir(NO_ES_UNA_FOTO);
  if (resultado === 'no-se-leyo') return reabrir(NO_SE_LEYO_UNA_FOTO);
  if (resultado === 'no-se-pudo') {
    fotosEditor.sumarLink(url);
    cerrarFichaFoto();
    // No es un error del usuario: la foto entró, y el aviso dice con qué.
    return avisarEnElFormulario(QUEDA_COMO_LINK);
  }
  cerrarFichaFoto();
}

/** Las fotos del depósito que se pueden mostrar: la subida, o la que está en memoria. */
const fotosMostrables = (fotos: FotoDeReceta[]): { n: number; url: string }[] =>
  fotos.flatMap(f => {
    const url = f.url || fotosEditor.urlEnMemoria(f.n) || '';
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
  if (i >= 0) ponerVisor({ urls: lista.map(f => f.url), i });
  else if (suelta) ponerVisor({ urls: [suelta], i: 0 });
}

/** El visor abierto es una capa: el atrás lo cierra sin salir de la pantalla. */
function ponerVisor(visor: EstadoVisor): void {
  estadoDePantalla.visor = visor;
  nav.abrirCapa('visor');
}

/** Saca el visor. En el editor, del DOM; en la lectura, redibujando. */
function sacarVisor(): Promise<void> | undefined {
  estadoDePantalla.visor = null;
  deslizoElVisor = false;
  if (enElEditor()) { document.querySelector('#app .visor')?.remove(); return; }
  return render();
}

/**
 * El visor en pantalla. En el editor se agrega y se saca del DOM, como las
 * fichas: redibujar el formulario perdería lo escrito.
 */
function dibujarVisor(): void {
  if (!enElEditor()) { void render(); return; }
  document.querySelector('#app .visor')?.remove();
  const formulario = document.querySelector('[data-formulario]');
  if (estadoDePantalla.visor && formulario) pintarParte(formulario, renderVisor(estadoDePantalla.visor), 'al-final');
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

  // La muestra entera, por el mismo camino que la dibujó la pantalla.
  const muestra = form.querySelector('[data-muestra]');
  if (muestra) {
    pintarParte(muestra, muestraCategoria(
      { nombre: valor('nombre'), color: valor('color'), foto: valor('foto') }, estadoDePantalla.fotoPropia?.url
    ), 'reemplazar');
  }
  const linea = form.querySelector<HTMLElement>('.error-nombre');
  if (linea) { linea.hidden = !problema; linea.textContent = problema; }
  const guardar = document.querySelector<HTMLButtonElement>('#app [data-accion="guardar-categoria"]');
  if (guardar) guardar.disabled = !!problema || formularioActual() === estadoDePantalla.editorAbierto?.formulario;
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
    ...(error ? { error } : {}),
    ...(estadoDePantalla.fotoPropia ? { propia: estadoDePantalla.fotoPropia.url } : {})
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
  if (!yaEsta) pintarParte(contenedor, pillTag(tag), 'al-final');
  sincronizarTags();
  return !yaEsta;
}

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
 * Después de guardar, la app queda en la receta guardada. Editando, la
 * receta es la pantalla de atrás, y volver no la repite en el historial; sin
 * pantalla atrás —el editor que abrió algo compartido—, la receta toma el
 * lugar del editor. Una receta nueva siempre toma el lugar del editor.
 */
function salirALaGuardada(id: string): void {
  const hash = `#/r/${encodeURIComponent(id)}`;
  if (vistaActual?.vista === 'nueva') nav.reemplazar(hash);
  else nav.volver(hash);
}

/** La validación del editor no deja guardar: el mensaje va al aviso y no se escribe nada. */
class NoSeGuarda extends Error {}

/**
 * Escribe lo que el editor tiene: crea el `.md` o reescribe el abierto, con su
 * fila, y deja lo guardado como la receta leída —la de destino se dibuja sin
 * volver a leer, y con el link de cada foto que se acaba de subir en su
 * línea—. Si la validación no deja, rechaza con `NoSeGuarda`.
 */
async function escribirEditor(datos: DatosFormulario): Promise<{ id: string; receta: Receta }> {
  // `''` es «Sin categoría»: la receta va a `_sin-categoria/`.
  const carpetaId = datos['carpeta'] ?? '';
  const esNueva = vistaActual?.vista === 'nueva';
  let id = idActual();
  const base = esNueva ? baseDeNueva() : (await store.receta(id)).receta;
  const escrita = fotosEditor.conSubidas(recetaDesdeFormulario(datos, base));
  // Un borrador puede no tener título todavía: se guarda con el día y la
  // hora, y el nombre del archivo sale de ahí.
  const nueva = !escrita.titulo && tieneEspecial(escrita, 'borrador')
    ? { ...escrita, titulo: tituloPorDefecto(new Date()) } : escrita;

  // Una receta nueva sin nada escrito no se crea: el título por defecto del
  // borrador no es contenido (C04.3b.1). Editando, el `.md` ya existe.
  if (esNueva && !tieneAlgoCargado(escrita)) throw new NoSeGuarda('Completá algún campo antes de guardar.');
  if (!nueva.titulo) throw new NoSeGuarda('Ponele un título antes de guardar.');

  // Lo que el depósito cambió respecto del `.md` que se abrió: el store sube
  // las nuevas y manda a la papelera las que se sacaron.
  const fotos = fotosEditor.cambiosDeFotos(nueva, base);
  if (esNueva) id = (await store.crear(nueva, carpetaId ? { carpetaId, fotos } : { fotos })).id;
  else await store.guardar(id, nueva, { carpetaDestino: carpetaId, fotos });
  const receta = fotosEditor.conSubidas(nueva);
  recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta };
  return { id, receta };
}

/**
 * Guarda el editor con el velo, desde el toque: entre el toque y la escritura
 * hay una relectura del `.md` de base, que es un pedido a Drive. `yDespues`
 * corre adentro del mismo velo —*Convertir con Agente* baja las fotos y abre
 * el agente— y el tilde va al final de todo.
 *
 * Devuelve el id y lo que dio `yDespues`, con el tilde ya dibujado: el que
 * guardó navega recién ahí, y el velo se va cuando la pantalla de destino
 * está pintada (§6.17b). `null` si no escribió nada —la validación o un
 * error—, y en ese caso el editor ya está redibujado con lo escrito y el
 * aviso (C04.5.2).
 */
async function guardarEditor<T>(
  yDespues: (guardada: { id: string; receta: Receta }) => Promise<T>
): Promise<{ id: string; despues: T } | null> {
  if (!document.querySelector('[data-formulario]')) return null;
  const datos = datosDelFormulario();
  try {
    return await velo.escribir(async () => {
      const guardada = await escribirEditor(datos);
      estadoDePantalla.editorAbierto = null;
      return { id: guardada.id, despues: await yDespues(guardada) };
    });
  } catch (err) {
    if (!(err instanceof NoSeGuarda)) console.error(err);
    const esNueva = vistaActual?.vista === 'nueva';
    const id = idActual();
    // El editor otra vez, con lo que el usuario tenía escrito y el aviso.
    // Con las fotos que este intento alcanzó a subir ya en sus líneas: el
    // reintento las manda por su link en vez de volver a subirlas.
    pintarEditor({
      entrada: esNueva ? null : store.entradas().find(e => e.id_archivo === id) ?? null,
      receta: fotosEditor.conSubidas(recetaDesdeFormulario(datos, baseDelEditor())), carpeta: datos['carpeta'] ?? '',
      categorias: store.categorias(), tagsConocidos: store.tagsDe().map(t => t.tag),
      error: err instanceof NoSeGuarda ? err.message : porQueNoGuardo(err), ...menuDe(vistaActual?.vista)
    });
    return null;
  }
}

/**
 * Cada `hashchange` numera la entrada que llegó y dibuja. La vuelta que pidió
 * `quedarseEn` no se dibuja: la pantalla de antes nunca se dejó de ver.
 */
const router = crearRouter(ruta => {
  const llegada = nav.numerar();
  if (llegada !== 'deshecha') void render(ruta, llegada);
});

/**
 * Lo que se cierra cuando el atrás sale de su capa. Es la misma pantalla —el
 * hash no cambia y no hay `hashchange`—: cada una se saca sola, sin tocar el
 * historial, que ya retrocedió.
 */
const CIERRE_DE_CAPA: Record<string, () => unknown> = {
  menu: () => { mostrarMenu(false); },
  visor: () => sacarVisor(),
  compartir: () => sacarCompartir(),
  'ficha-foto': () => { quitarFichaFoto(); acomodarBotonDeFoto(); },
  'categoria-plan': () => { dejarCategoriaDelPlan(); return render(); }
};
nav.alCerrarCapa(capa => { void CIERRE_DE_CAPA[capa]?.(); });
window.addEventListener('popstate', () => { nav.alPopstate(); });

// Las acciones de la pantalla, por tema. Cada sección es un mapa
// `data-accion → función`; el listener de click sólo busca en `acciones`.

/** Navegar entre pantallas: el volver del encabezado, entrar al editor y reintentar una lectura. */
const accionesDeNavegacion: SeccionDeAcciones = {
  // Entrar por un link directo no deja ninguna pantalla atrás: ahí volver es
  // ir al Recetario, no salirse de la app.
  volver: () => { nav.volver('#/'); },
  editar: () => { nav.ir(`#/r/${idActual()}/editar`); },
  // Vacía la caja y deja el cursor ahí. No navega: buscar vacío no hace nada,
  // y salir de los resultados es el chevron.
  limpiar: () => {
    const campo = document.querySelector<HTMLInputElement>('#app [data-accion="buscar"]');
    if (campo) { campo.value = ''; campo.focus?.(); }
  },
  // Reintentar es volver a pedir: lo leído no se reutiliza.
  reintentar: () => {
    recetaLeida = null; estadoDePantalla.selector.error = '';
    return render();
  }
};

/** El menú lateral. */
const accionesDelMenu: SeccionDeAcciones = {
  'abrir-menu': () => ponerMenu(true),
  'cerrar-menu': () => ponerMenu(false)
};

/** Tocar el chip de un tag: filtra la lista, o desde el Recetario lleva a la lista por tag. */
function tocarTag(tag: string): Promise<void> | undefined {
  // Desde el Recetario el carrusel no filtra nada ahí mismo: navega a la
  // lista por tag, que es donde ese chip tiene algo que mostrar.
  if (vistaActual?.vista === 'recetario') { nav.ir(`#/t/${encodeURIComponent(tag)}`); return; }
  estadoDePantalla.lista.alternarTag(tag);
  return render();
}

/**
 * Las fotos del depósito en el editor: las fichas al pie, la portada, traer
 * una por URL, ponerla en una línea y sacarla.
 */
const accionesDeFotos: SeccionDeAcciones = {
  'cerrar-ficha-foto': () => {
    cerrarFichaFoto();
    // Tocar el velo puede haberle sacado el foco al campo: el botón de la
    // foto no puede quedar colgado de un campo que ya no lo tiene.
    acomodarBotonDeFoto();
  },
  'acciones-foto': (boton) => {
    const n = boton.dataset['n'] ?? '';
    abrirFichaFoto(renderAccionesFoto(Number(n)));
  },
  'abrir-portada': () => {
    abrirFichaFoto(renderSelectorPortada(fotosEditor.fotos(), fotosEditor.portada() || null));
  },
  'elegir-portada': (boton) => {
    fotosEditor.ponerPortada(Number(boton.dataset['n'] ?? 0));
    cerrarFichaFoto();
  },
  'sin-portada': () => { fotosEditor.sacarPortada(); cerrarFichaFoto(); },
  'abrir-foto-url': () => abrirFotoPorUrl(),
  'traer-foto-url': async () => {
    const url = document.querySelector<HTMLInputElement>('#app [data-url-foto]')?.value.trim() ?? '';
    if (url) await agregarFotoPorUrl(url);
  },
  'abrir-elegir-foto': (boton) => {
    // La sección y la línea son las que tenía el botón: las escribió
    // `acomodarBotonDeFoto` con el cursor donde estaba.
    abrirFichaFoto(renderElegirFoto(
      fotosEditor.fotos(), boton.dataset['seccion'] ?? '', Number(boton.dataset['linea'] ?? 0)
    ));
  },
  'poner-en': (boton) => {
    // Ahora está en el texto, y su miniatura lo dice.
    fotosEditor.ponerEn(
      boton.dataset['seccion'] ?? '', Number(boton.dataset['linea'] ?? 0), Number(boton.dataset['n'] ?? 0)
    );
    cerrarFichaFoto();
  },
  'sacar-foto-editor': (boton) => {
    // La foto se va del depósito, de la portada y de todo el texto que la nombraba.
    fotosEditor.sacar(Number(boton.dataset['n'] ?? 0));
    cerrarFichaFoto();
  }
};

/**
 * El visor de fotos. El depósito sale de `fotosEditor` en el editor y de la
 * receta leída en la lectura: son la misma acción y el mismo `data-n` en la
 * cabecera, la galería y la ficha de acciones.
 */
const accionesDelVisor: SeccionDeAcciones = {
  'ver-foto-receta': (boton) => {
    const marca = boton.dataset['n'];
    const n = marca === undefined ? undefined : Number(marca);
    if (enElEditor()) {
      // Sin consumir la capa de la ficha: el visor toma su lugar.
      quitarFichaFoto();
      abrirVisor(fotosEditor.fotos(), n);
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
  },
  'cerrar-visor': () => {
    // Un deslizamiento termina en un click: ese no cierra, ya cambió de foto.
    if (deslizoElVisor) { deslizoElVisor = false; return; }
    nav.cerrarCapa('visor');
    return sacarVisor();
  }
};

/**
 * Una foto en línea del texto no lleva `data-accion` —la dibuja el markdown,
 * que no sabe de acciones— y abre el visor igual. Se abre **sola**: lo que se
 * tocó es esa foto, no una tira. En el modo cocina no: ahí la foto está
 * adentro del paso, que sí lleva acción, y un toque marca dónde voy.
 */
function tocarFotoEnLinea(destino: Element): Promise<void> | undefined {
  const enLinea = destino.closest<HTMLElement>('.foto-linea');
  const img = enLinea?.querySelector<HTMLElement>('img');
  if (!img) return;
  const id = img.dataset['drive'] ?? '';
  const suelta = id ? linkDeFoto(id) : img.getAttribute('src') ?? '';
  if (!suelta) return;
  ponerVisor({ urls: [suelta], i: 0 });
  return render();
}

/** Las flechas de un carrusel, que sólo existen con mouse. */
const accionesDelCarrusel: SeccionDeAcciones = {
  'carrusel-izq': (boton) => { desplazarCarrusel(boton, 'carrusel-izq'); },
  'carrusel-der': (boton) => { desplazarCarrusel(boton, 'carrusel-der'); }
};

/**
 * El plan: el `+` de una celda, la tarjeta que suma, la cruz que saca una
 * línea, y reiniciar. Cada cambio escribe en el momento.
 */
const accionesDelPlan: SeccionDeAcciones = {
  'agregar-al-plan': (boton) => {
    const dia = boton.dataset['dia'] ?? '';
    const momento = boton.dataset['momento'] ?? '';
    nav.ir(`#/plan/agregar?dia=${encodeURIComponent(dia)}&momento=${encodeURIComponent(momento)}`);
  },
  // La categoría elegida es una capa: el atrás vuelve a la grilla sin salir
  // de la pantalla, y el chevron hace lo mismo.
  'elegir-categoria-plan': (boton) => {
    estadoDePantalla.categoriaPlan = boton.dataset['nombre'] ?? '';
    estadoDePantalla.lista.primerTramo();
    nav.abrirCapa('categoria-plan');
    return render();
  },
  'volver-categorias-plan': () => {
    nav.cerrarCapa('categoria-plan');
    dejarCategoriaDelPlan();
    return render();
  },
  'elegir-para-el-plan': async (boton) => {
    const id = boton.dataset['id'] ?? '';
    const entrada = store.entradas().find(e => e.id_archivo === id);
    if (!entrada) return;
    const dia = Number(vistaActual?.params['dia'] ?? 0);
    const momento: Momento = vistaActual?.params['momento'] === 'mediodia' ? 'mediodia' : 'noche';
    // Agregar suma al final: la misma receta dos veces se permite, y cada
    // línea tiene su cruz.
    await guardarPlan(plan => ({ comidas: [...plan.comidas, { dia, momento, id, titulo: entrada.titulo }] }));
    // Esta pantalla se cierra al elegir y deja el plan, que dibuja el
    // `hashchange`. Sin pantalla atrás, el plan toma su lugar.
    nav.volver('#/plan');
  },
  'sacar-del-plan': async (boton) => {
    const i = Number(boton.dataset['i'] ?? -1);
    const plan = planLeido;
    if (!plan || !Number.isInteger(i) || i < 0 || i >= plan.comidas.length) return;
    await guardarPlan(() => ({ comidas: plan.comidas.filter((_, n) => n !== i) }));
    return render();
  },
  'reiniciar-plan': () => { estadoDePantalla.confirmandoReinicio = true; return render(); },
  'cancelar-reinicio': () => { estadoDePantalla.confirmandoReinicio = false; return render(); },
  'reiniciar-plan-confirmado': async () => {
    await guardarPlan(() => ({ comidas: [] }));
    estadoDePantalla.confirmandoReinicio = false;
    return render();
  },
  'ir-a-compras': () => { nav.ir('#/plan/compras'); }
};

/** La receta abierta y su modo cocina: la estrella, entrar, conmutar, marcar pasos, la pantalla encendida y las salidas. */
const accionesDeLaReceta: SeccionDeAcciones = {
  favorito: async () => {
    const id = idActual();
    const actual = recetaLeida?.receta;
    if (!id || !actual || estadoDePantalla.marcandoFavorito) return;

    // El resultado se dibuja recién cuando Drive contesta: mientras tanto, la
    // estrella muestra que está escribiendo y no acepta otro toque.
    estadoDePantalla.marcandoFavorito = true;
    estadoDePantalla.errorFavorito = '';
    await render();

    const nueva = { ...actual, tags: conEspecial(actual.tags, 'favorito', !esFavorita(actual)) };
    try {
      await store.guardar(id, nueva);
      recetaLeida = { id, entrada: store.entradas().find(e => e.id_archivo === id) ?? null, receta: nueva };
    } catch (err) {
      console.error(err);
      estadoDePantalla.errorFavorito = 'No se pudo marcar como favorita. Revisá la conexión.';
    }
    estadoDePantalla.marcandoFavorito = false;
    return render();
  },
  cocinar: () => { nav.ir(`#/r/${idActual()}/cocinar`); },
  conmutar: async (boton) => {
    const volverA = cocina.conmutar(boton.dataset['posicion'], window.scrollY);
    if (volverA === null) return;
    await render();
    window.scrollTo(0, volverA);
  },
  // Tocar un paso marca dónde voy; tocar el que ya estaba realzado lo da por
  // hecho y el hilo sigue al siguiente.
  paso: (boton) => {
    if (cocina.marcarPaso(boton.dataset['paso'])) return render();
    return;
  },
  wake: async () => {
    await cocina.alternarPantalla();
    return render();
  },
  // Las dos salidas del modo cocina tienen destinos distintos, y las dos
  // sueltan el bloqueo de pantalla: se dejó de cocinar.
  'volver-receta': () => cocina.volverALectura(nav, `#/r/${encodeURIComponent(idActual())}`),
  'salir-cocina': () => {
    const entrada = store.entradas().find(e => e.id_archivo === idActual());
    // Sin fila del índice no se sabe de qué categoría es: se va al Recetario.
    return cocina.salir(
      nav, `#/r/${encodeURIComponent(idActual())}`, entrada?.categoria ? `#/c/${encodeURIComponent(entrada.categoria)}` : '#/'
    );
  },
  'mandar-al-agente': async () => {
    // El mismo pedido que no salió, con la activación de este toque.
    const envio = estadoDePantalla.pedidoPendiente;
    if (!envio) return;
    const r = await mandarAlAgente(envio);
    if (r !== 'no-salio') estadoDePantalla.pedidoPendiente = null;
    estadoDePantalla.avisoDeLlegada = r === 'copiado' ? PEDIDO_COPIADO : '';
    return render();
  }
};

/** La gestión de categorías: elegir color y foto, guardar y borrar. */
const accionesDeCategorias: SeccionDeAcciones = {
  'elegir-color': (boton) => { elegirEnCategoria('color', boton.dataset['valor'] ?? ''); },
  'elegir-foto': (boton) => { elegirEnCategoria('foto', boton.dataset['valor'] ?? ''); },
  'guardar-categoria': async () => {
    if (!document.querySelector('[data-formulario]')) return;
    const valores = valoresDeCategoria();
    const id = vistaActual?.params['id'] ?? 'nueva';
    // La foto propia se manda sólo si se eligió un archivo en esta pantalla:
    // cambiar el color o el nombre no vuelve a subir nada.
    const propia = valores.foto === FOTO_PROPIA ? estadoDePantalla.fotoPropia?.blob : undefined;
    const datos = {
      ...valores,
      foto: valores.foto === FOTO_PROPIA ? '' : valores.foto,
      ...(propia ? { fotoPropia: propia } : {})
    };
    try {
      await velo.escribir(async () => {
        if (id === 'nueva') await store.crearCategoria(datos);
        else await store.editarCategoria(id, datos);
      });
      registrarCategorias(store.categorias());
      estadoDePantalla.editorAbierto = null;
      nav.volver('#/categorias');
      return;
    } catch (err) {
      console.error(err);
      const otros = store.categorias().filter(c => c.id !== id).map(c => c.nombre);
      // El motivo del nombre se dice tal cual; lo demás, sin el mensaje de Google (R1).
      const mensaje = err instanceof Error && problemaDelNombre(valores.nombre, otros) ? err.message : 'No se pudo guardar. Revisá la conexión.';
      dibujarCategoria(valores, mensaje);
      return;
    }
  },
  'borrar-categoria': (boton) => {
    const id = idActual();
    const categoria = store.categorias().find(c => c.id === id);
    if (categoria) pintarParte(boton, confirmacionBorrarCategoria(categoria.nombre, store.recetasDe(id).map(e => e.titulo)), 'reemplazar');
  },
  'cancelar-borrar-categoria': () => {
    const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
    if (confirmacion) pintarParte(confirmacion, botonBorrarCategoria, 'reemplazar');
  },
  'borrar-categoria-confirmado': async () => {
    const id = idActual();
    try {
      await velo.escribir(() => store.borrarCategoria(id));
      registrarCategorias(store.categorias());
      estadoDePantalla.editorAbierto = null;
      nav.volver('#/categorias');
      return;
    } catch (err) {
      console.error(err);
      const confirmacion = document.querySelector('[data-confirmar-borrado-categoria]');
      if (confirmacion) pintarParte(confirmacion, aviso({ texto: 'No se pudo borrar. La categoría sigue estando.' }) + botonBorrarCategoria, 'reemplazar');
      return;
    }
  }
};

/**
 * El editor de una receta: guardar, convertir con el agente, pegar, los tags,
 * la duración, salir y borrar.
 */
const accionesDelEditor: SeccionDeAcciones = {
  'convertir-con-agente': async () => {
    // Guarda y después manda: el pedido lleva el id del `.md`, que en una
    // receta nueva recién existe al crearla. Si no se guardó, no se manda
    // nada. Bajar las fotos y abrir el agente van adentro del mismo velo.
    const guardada = await guardarEditor(async ({ id, receta }) => {
      // Las fotos que el agente puede leer son las de Drive que se pudieron
      // leer, en el orden del depósito y con su número: la receta que vuelve
      // las nombra con ese número.
      const leidas = await fotosParaElAgente(receta.fotos);
      const numeradas = leidas.map(({ n, id }) => ({ n, id }));
      const datos = {
        id, titulo: receta.titulo ?? '', fuente: receta.fuente ?? '', descripcion: receta.descripcion,
        rinde: receta.rinde ?? '', ingredientes: receta.ingredientes, preparacion: receta.preparacion, notas: receta.notas
      };
      const envio: PedidoAlAgente = {
        pedido: pedidoDeConversion(datos, { fotos: numeradas }),
        fotos: leidas.length
          ? { archivos: leidas.map(f => f.archivo), conLinks: pedidoDeConversion(datos, { fotos: numeradas, links: true }) }
          : null
      };
      return { envio, r: await mandarAlAgente(envio) };
    });
    if (!guardada) return;
    const { envio, r } = guardada.despues;
    if (r === 'copiado') avisoAlLlegar = PEDIDO_COPIADO;
    if (r === 'no-salio') pedidoAlLlegar = envio;
    // La receta ya está guardada: el editor se cierra y la app queda en ella,
    // igual que al guardar.
    salirALaGuardada(guardada.id);
  },
  'pegar-receta': async () => {
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
    pintarEditor({
      entrada: vistaActual?.vista === 'editar' ? recetaLeida?.entrada ?? null : null,
      receta: aplicarPegada(actual, pegada, carpeta), carpeta,
      categorias: store.categorias(), tagsConocidos: store.tagsDe().map(t => t.tag), ...menuDe(vistaActual?.vista)
    });
  },
  'tag-especial': (boton) => {
    if (boton.hasAttribute('disabled')) return;
    const apretado = boton.getAttribute('aria-pressed') !== 'true';
    boton.setAttribute('aria-pressed', String(apretado));
    if (boton.dataset['valor'] === 'borrador') mostrarConvertir(apretado);
    sincronizarTags();
  },
  'elegir-duracion': (boton) => {
    const valor = boton.dataset['valor'] ?? '';
    const puesto = boton.getAttribute('aria-pressed') !== 'true';
    for (const b of document.querySelectorAll<HTMLElement>('#app [data-accion="elegir-duracion"]')) {
      b.setAttribute('aria-pressed', String(puesto && b === boton));
    }
    const oculto = document.querySelector<HTMLInputElement>('#app input[name="tiempo"]');
    if (oculto) { oculto.value = puesto ? valor : ''; oculto.setAttribute('value', oculto.value); }
  },
  'tag-quitar': (boton) => {
    const tag = boton.dataset['valor'] ?? '';
    boton.remove();
    sincronizarTags();
    if (tag) document.querySelector<HTMLInputElement>('[data-tag-nuevo]')?.focus();
  },
  'seguir-editando': () => {
    estadoDePantalla.salidaPendiente = null;
    document.querySelector('[data-salida]')?.remove();
  },
  'salir-sin-guardar': () => {
    estadoDePantalla.editorAbierto = null;
    // Se salía por un link: va a donde llevaba. Si no, se salía volviendo, y
    // como el volver, sin pantalla atrás —el editor que abrió lo compartido
    // desde otra app— no intenta salir de la app (C01.2.2): va al Recetario.
    const destino = estadoDePantalla.salidaPendiente;
    if (destino) nav.ir(destino);
    else nav.volver('#/');
  },
  guardar: async () => {
    // El orden que se ve: la olla revolviendo, el tilde, y recién después la
    // pantalla nueva, con su dibujo tapado por el velo.
    const guardada = await guardarEditor(async () => undefined);
    // Lo escrito ya está en Drive, así que salir no tiene nada que preguntar.
    if (guardada) salirALaGuardada(guardada.id);
  },
  // La confirmación toma el lugar del botón, y el botón el de la confirmación:
  // redibujar el editor perdería lo escrito y la foto contra la que se
  // comparan los cambios sin guardar.
  borrar: (boton) => { pintarParte(boton, confirmacionBorrado(recetaLeida?.receta.titulo ?? null), 'reemplazar'); },
  'cancelar-borrado': () => {
    const confirmacion = document.querySelector('[data-confirmar-borrado]');
    if (confirmacion) pintarParte(confirmacion, botonBorrar, 'reemplazar');
  },
  'borrar-confirmado': async () => {
    const id = idActual();
    try {
      await velo.escribir(() => store.borrar(id));
      estadoDePantalla.editorAbierto = null;
      // Vuelve hasta salir de la receta, a donde se la eligió —la receta y el
      // editor, o sólo el editor si se abrió desde Borradores—: la receta
      // borrada no queda en el historial. El archivo queda en la papelera de
      // Drive, que es la red de seguridad y es del usuario.
      nav.salirDe(`#/r/${encodeURIComponent(id)}`, '#/');
      return;
    } catch (err) {
      console.error(err);
      // El aviso va donde estaba la pregunta, y el botón vuelve: lo escrito en
      // el formulario sigue ahí (R1).
      const confirmacion = document.querySelector('[data-confirmar-borrado]');
      if (confirmacion) pintarParte(confirmacion, aviso({ texto: 'No se pudo borrar. La receta sigue estando.' }) + botonBorrar, 'reemplazar');
      return;
    }
  }
};

/** Lo que la ficha de compartir escucha. Con el PDF armándose, ninguna responde. */
const ACCIONES_DE_LA_FICHA = ['compartir', 'cerrar-compartir', 'compartir-pdf', 'enviar-pdf', 'compartir-link', 'compartir-texto'];

/**
 * El PDF de la receta abierta. *Compartir PDF* lo arma siempre; *Enviar PDF*
 * reusa el que ya estaba armado, si lo hay.
 */
async function compartirPdfDeLaReceta(accion: 'compartir-pdf' | 'enviar-pdf'): Promise<void> {
  if (!recetaLeida) return;
  const { entrada, receta } = recetaLeida;
  if (accion === 'compartir-pdf' || !estadoDePantalla.pdfListo) {
    estadoDePantalla.compartiendo = { paso: 'generando' };
    await render();
    // Si mientras se armaba se navegó, `render` ya cerró la ficha: el PDF es
    // de una pantalla que no está, y aplicarlo mostraría «listo» en otra receta.
    const sigueGenerando = (): boolean => estadoDePantalla.compartiendo?.paso === 'generando';
    try {
      // El PDF lleva las fotos adentro: las de Drive salen del caché de
      // `imagenes`, y el canvas para achicarlas es el mismo de siempre.
      const blob = await generar(receta, entrada?.categoria ?? '', {
        imagenDe: id => imagenes.imagenDe(id),
        achicar: (foto, maximo) => achicarFoto(foto, { maximo })
      });
      if (!sigueGenerando()) return;
      estadoDePantalla.pdfListo = new File([blob], slugArchivo(receta.titulo).replace(/\.md$/, '.pdf'), { type: 'application/pdf' });
    } catch (err) {
      console.error(err);
      if (!sigueGenerando()) return;
      estadoDePantalla.compartiendo = { paso: 'error-pdf' };
      return render();
    }
  }
  try {
    const r = await compartirPdf(plataformaDelNavegador(), estadoDePantalla.pdfListo);
    estadoDePantalla.compartiendo = r === 'sin-activacion' ? { paso: 'pdf-listo' } : null;
  } catch (err) {
    console.error(err);
    estadoDePantalla.compartiendo = { paso: 'error-pdf' };
  }
  if (!estadoDePantalla.compartiendo) { estadoDePantalla.pdfListo = null; nav.cerrarCapa('compartir'); }
  return render();
}

/** La receta abierta como link o como texto. */
async function compartirLaReceta(que: 'link' | 'texto'): Promise<void> {
  if (!recetaLeida) return;
  const { entrada, receta } = recetaLeida;
  const categoria = entrada?.categoria ?? '';
  let contenido = '';
  try {
    const plataforma = plataformaDelNavegador();
    contenido = que === 'link' ? urlDeLink(await codificar(receta, categoria)) : textoReceta(receta, categoria);
    const r = que === 'link'
      ? await compartirLink(plataforma, receta.titulo ?? '', contenido)
      : await compartirTexto(plataforma, contenido);
    return seguirCompartiendo(r === 'copiado' ? { paso: 'copiado', que }
      : r === 'sin-portapapeles' ? { paso: 'mostrar', que, contenido }
      : null);
  } catch (err) {
    console.error(err);
    return seguirCompartiendo(contenido ? { paso: 'mostrar', que, contenido } : null);
  }
}

/** La lista de compras, que se comparte sólo como texto. */
async function compartirLasCompras(): Promise<void> {
  const contenido = textoCompras(comprasLeidas?.lista ?? { conCantidad: [], sinCantidad: [] });
  try {
    const r = await compartirTexto(plataformaDelNavegador(), contenido);
    return seguirCompartiendo(r === 'copiado' ? { paso: 'copiado', que: 'texto' }
      : r === 'sin-portapapeles' ? { paso: 'mostrar', que: 'texto', contenido }
      : null);
  } catch (err) {
    console.error(err);
    return seguirCompartiendo({ paso: 'mostrar', que: 'texto', contenido });
  }
}

/**
 * El paso que sigue de la ficha de compartir, o cerrarla con `null`. Si
 * mientras se compartía el atrás ya la cerró —o se cambió de pantalla—, no se
 * la vuelve a abrir: su capa ya no está.
 */
function seguirCompartiendo(siguiente: EstadoCompartir | null): Promise<void> | undefined {
  if (!estadoDePantalla.compartiendo) return;
  estadoDePantalla.compartiendo = siguiente;
  if (!siguiente) nav.cerrarCapa('compartir');
  return render();
}

/** Saca la ficha de compartir, con el PDF que se haya armado. */
function sacarCompartir(): Promise<void> {
  estadoDePantalla.compartiendo = null;
  estadoDePantalla.pdfListo = null;
  return render();
}

/**
 * La ficha de compartir de la receta y de la lista de compras. Abierta es una
 * capa: el atrás la cierra sin salir de la pantalla.
 */
const accionesDeCompartir: SeccionDeAcciones = {
  compartir: () => {
    estadoDePantalla.compartiendo = { paso: 'opciones' };
    nav.abrirCapa('compartir');
    // Lo pesado del PDF empieza a bajar ya: el toque que lo genera es otro.
    void precargar().catch(() => {});
    return render();
  },
  'cerrar-compartir': () => {
    nav.cerrarCapa('compartir');
    return sacarCompartir();
  },
  'compartir-pdf': () => compartirPdfDeLaReceta('compartir-pdf'),
  'enviar-pdf': () => compartirPdfDeLaReceta('enviar-pdf'),
  'compartir-compras': () => {
    // La lista se comparte sólo como texto: no es una receta y no tiene link.
    estadoDePantalla.compartiendo = { paso: 'opciones', solo: 'texto' };
    nav.abrirCapa('compartir');
    return render();
  },
  'compartir-texto': () =>
    vistaActual?.vista === 'plan-compras' ? compartirLasCompras() : compartirLaReceta('texto'),
  'compartir-link': () => compartirLaReceta('link')
};

/** Ajustes, la conexión con Google y la carpeta base. */
const accionesDeAjustes: SeccionDeAcciones = {
  reindexar: async () => {
    try {
      await reconstruir();
      estadoDePantalla.errorReindexado = false;
    } catch (err) {
      console.error(err);
      estadoDePantalla.errorReindexado = true;
    }
    return render();
  },
  'reindexar-al-arrancar': () => terminarArranque(true),
  conectar: () => arrancar({ pidiendoPermiso: true }),
  'cambiar-carpeta': () => { nav.ir('#/carpeta?cambiando=1'); },
  'carpeta-sugerida': (boton) => {
    estadoDePantalla.selector.confirmando = { id: boton.dataset['id'] ?? '', nombre: boton.dataset['nombre'] ?? '' };
    return render();
  },
  'carpeta-elegir': async () => {
    try {
      const elegida = await elegirCarpeta(await auth.token());
      // Cerró la ventana sin elegir: nada cambia, ni siquiera la pantalla.
      if (!elegida) return;
      estadoDePantalla.selector.confirmando = elegida;
    } catch (err) {
      console.error(err);
      estadoDePantalla.selector.error = 'No se pudo abrir el selector de Google.';
    }
    return render();
  },
  'carpeta-cancelar': () => { estadoDePantalla.selector.confirmando = null; return render(); },
  // Crear no confirma: el botón ya dice qué carpeta y dónde.
  'carpeta-crear': () => usarCarpeta('crear'),
  'carpeta-confirmar': () => {
    if (!estadoDePantalla.selector.confirmando) return;
    return usarCarpeta(estadoDePantalla.selector.confirmando);
  },
  'borrar-datos-locales': async () => {
    // Recargar y no seguir: lo que hay en memoria salió de esa copia, y la
    // próxima escritura la volvería a guardar igual.
    indiceLocal.borrar();
    await Promise.all([imagenes.borrarImagenes(), imagenes.descartarCompartidas()]);
    location.reload();
  },
  salir: async () => {
    auth.olvidar();
    // La copia tiene títulos e ingredientes: después de Salir no queda nada
    // del usuario en el navegador. Y se recarga, porque el índice y la receta
    // abierta también viven en memoria: sin recargar, la próxima pantalla los
    // volvería a dibujar. Las fotos guardadas en el navegador tampoco quedan.
    indiceLocal.borrar();
    await Promise.all([imagenes.borrarImagenes(), imagenes.descartarCompartidas()]);
    nav.reemplazar('#/');
    location.reload();
  },
  'conectar-de-nuevo': async () => {
    // No se redibuja: en el editor lo escrito vive sólo en el formulario (R3).
    // Conectado, el aviso se va y se guarda a mano; si no, queda donde está.
    try {
      await auth.conectar();
      document.querySelector('[data-sin-sesion]')?.remove();
    } catch (err) {
      console.error(err);
    }
  },
  reconectar: async () => {
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
};

const acciones = registrarAcciones({
  navegacion: accionesDeNavegacion,
  menu: accionesDelMenu,
  lista: accionesDeLista(() => estadoDePantalla.lista, () => render()),
  fotos: accionesDeFotos,
  visor: accionesDelVisor,
  carrusel: accionesDelCarrusel,
  plan: accionesDelPlan,
  receta: accionesDeLaReceta,
  categorias: accionesDeCategorias,
  editor: accionesDelEditor,
  compartir: accionesDeCompartir,
  ajustes: accionesDeAjustes
});

app.addEventListener('click', async (e) => {
  // Con la pantalla tapada no responde nada: el velo ya tapa los controles, y
  // esto cubre lo que llegue igual.
  if (velo.ocupado()) return;
  // Todo el manejo de clicks es delegación desde #app, así que el destino
  // llega como EventTarget y hay que estrecharlo una sola vez, acá.
  const destino = conClosest(e.target);
  const link = destino?.closest<HTMLElement>('.lat a[href]');
  if (link) { if (tocarDestino(link.getAttribute('href') ?? '')) e.preventDefault(); return; }
  const boton = destino?.closest<HTMLElement>('[data-accion], [data-tag]') ?? null;
  if (!boton && destino && recetaLeida) return tocarFotoEnLinea(destino);
  if (!boton) return;
  const tag = boton.dataset['tag'];
  if (tag) return tocarTag(tag);

  const accion = boton.dataset['accion'];
  // Mientras se arma el PDF la ficha no acepta otro toque: cerrar con el velo
  // no frena `generar`, y al terminar el PDF se mandaría igual.
  if (estadoDePantalla.compartiendo?.paso === 'generando' && ACCIONES_DE_LA_FICHA.includes(accion ?? '')) return;
  // Una acción que no está registrada no hace nada.
  return accionDe(acciones, accion)?.(boton, e);
});

/**
 * Lo que se escribe vive en el DOM y no en el estado: redibujar en cada tecla
 * perdería el foco y el cursor. Lo que se sigue tecla a tecla toca el DOM
 * directo, sin volver a pintar la pantalla.
 */
app.addEventListener('input', (e) => {
  if (velo.ocupado()) return;
  // En la pantalla de agregar al plan se redibuja sólo el bloque de abajo:
  // repintar la pantalla entera perdería el foco del teclado.
  if (vistaActual?.vista === 'plan-agregar') {
    const caja = e.target as HTMLInputElement | null;
    if (caja?.dataset?.['accion'] !== 'buscar-en-plan') return;
    estadoDePantalla.consultaPlan = caja.value;
    // Escribir es dejar la categoría elegida: son dos formas de filtrar y no
    // conviven en el mismo bloque.
    dejarCategoriaDelPlan();
    nav.cerrarCapa('categoria-plan');
    return pintarBloqueDelPlan();
  }
  if (vistaActual?.vista === 'editar-categoria') return revisarCategoria();
  // En el editor, cada tecla puede habilitar o bloquear el botón de
  // `borrador`, y mueve el cursor de línea.
  if (enElEditor()) { revisarBorrador(); acomodarBotonDeFoto(); }
});

/** El deslizamiento en curso: dónde empezó, si ya se sabe que es gesto, y cuánto va abierto. */
let deslizando: { x: number; y: number; decidido: 'indeciso' | 'horizontal' | 'vertical'; p: number } | null = null;

/** Desde `ANCHO_MENU_FIJO` el menú es fijo (`base.css`): no hay nada que abrir. */
const corteDelMenu = typeof window.matchMedia === 'function'
  ? window.matchMedia(`(min-width: ${ANCHO_MENU_FIJO}px)`) : null;
const menuFijo = (): boolean => corteDelMenu?.matches ?? false;

// La ventana que se agranda hasta el corte deja el menú fijo: desplegado no
// hay nada que mostrar, y su capa quedaría en el historial sin nada abierto.
corteDelMenu?.addEventListener?.('change', (e) => {
  if (e.matches) ponerMenu(false);
});

/**
 * Muestra u oculta el menú sobre lo que ya está pintado: cambia las clases del
 * panel y del velo, y no redibuja. En la receta nueva, redibujar borraría lo
 * escrito. `menuAbierto` queda como la verdad para el próximo dibujo.
 */
function mostrarMenu(abierto: boolean): void {
  menuAbierto = abierto;
  document.querySelector<HTMLElement>('#app .lat')?.classList.toggle('abierto', abierto);
  document.querySelector<HTMLElement>('#app .velo-lat')?.classList.toggle('on', abierto);
}

/**
 * Abre o cierra el menú desde la app —la hamburguesa, el velo, el gesto—.
 * Desplegado es una capa: el atrás lo cierra sin salir de la pantalla.
 */
function ponerMenu(abierto: boolean): void {
  if (abierto === menuAbierto) return;
  mostrarMenu(abierto);
  if (abierto) nav.abrirCapa('menu');
  else nav.cerrarCapa('menu');
}

/**
 * Un destino del lateral. El que ya se está mirando cierra el menú y no
 * navega —con `''` y `#/` es el mismo Inicio—. Con una capa abierta —el menú
 * desplegado, o cualquier otra con el lateral fijo de pantalla ancha—, el
 * destino toma el lugar de su capa en el historial, así el atrás no vuelve a
 * ella. Sin capa, el link navega solo. Devuelve si se ocupó del toque.
 */
function tocarDestino(href: string): boolean {
  if (vistaActual && mismaPantalla(parsearHash(href), vistaActual)) { ponerMenu(false); return true; }
  const abierta = nav.capaActual();
  if (abierta === null) return false;
  // Cerrar el menú va después de navegar: con la capa consumida, cerrar no
  // vuelve atrás. Lo demás de la capa lo limpia el cambio de pantalla.
  nav.ir(href);
  if (abierta === 'menu') mostrarMenu(false);
  return true;
}

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

/** Las dos filas que se desplazan de costado: el carrusel y la fila de duraciones, en `tokens.css`. Una que entra entera no cuenta: no hay nada que mover. */
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
  if (velo.ocupado()) return;
  deslizando = null;
  visorDesde = null;
  deslizoElVisor = false;
  const toques = (e as TouchEvent).touches;
  const toque = toques[0];
  if (!toque || toques.length !== 1) return;
  // Con el visor abierto, el dedo pasa de una foto a la siguiente y no abre
  // el menú: es lo único que se puede hacer ahí.
  if (estadoDePantalla.visor) { visorDesde = toque.clientX; return; }
  if (!vistaActual || !esDelMenu(vistaActual.vista) || menuFijo()) return;
  if (!puedeEmpezar(toque.clientX, menuAbierto, sobreFilaDeslizable(e.target))) return;
  deslizando = { x: toque.clientX, y: toque.clientY, decidido: 'indeciso', p: menuAbierto ? 1 : 0 };
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (velo.ocupado()) return;
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
  if (velo.ocupado() || !deslizando) return;
  const { decidido, p } = deslizando;
  deslizando = null;
  if (decidido !== 'horizontal') return;
  seguirDedo(null);
  const abrir = seAbre(p);
  // Si vuelve a donde estaba, el CSS lo reacomoda con su transición.
  if (abrir === menuAbierto) return;
  ponerMenu(abrir);
};
document.addEventListener('touchend', soltarDeslizamiento);
document.addEventListener('touchcancel', soltarDeslizamiento);

// El visor pasa de una foto a la otra con el dedo. Va aparte del
// gesto del menú: ahí el deslizamiento arrastra el panel al ritmo del dedo, y
// acá la foto cambia de una vez, al soltar.
document.addEventListener('touchend', (e) => {
  if (velo.ocupado() || visorDesde === null || !estadoDePantalla.visor) return;
  const toque = (e as TouchEvent).changedTouches[0];
  const desde = visorDesde;
  visorDesde = null;
  if (!toque) return;
  const i = pasoDelVisor(estadoDePantalla.visor.i, toque.clientX - desde, estadoDePantalla.visor.urls.length);
  if (i === estadoDePantalla.visor.i) return;
  estadoDePantalla.visor = { ...estadoDePantalla.visor, i };
  deslizoElVisor = true;
  dibujarVisor();
});

app.addEventListener('keydown', (e) => {
  if (velo.ocupado()) return;
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
  if (velo.ocupado()) return;
  acomodarBotonDeFoto();
});

/**
 * El foco pasó a otro control: si no es una sección, el botón de la foto se
 * va. No todo cambio de foco mueve el cursor, así que no alcanza con
 * `selectionchange`.
 */
app.addEventListener('focusin', () => {
  if (velo.ocupado()) return;
  acomodarBotonDeFoto();
});

/**
 * Deslizar adentro del campo corre el texto sin mover el cursor: el botón
 * tiene que seguirlo, o queda clavado en un renglón que ya no es el suyo. El
 * oyente va en captura porque el `scroll` de un campo no burbujea.
 */
app.addEventListener('scroll', () => {
  if (velo.ocupado()) return;
  acomodarBotonDeFoto();
}, true);

/**
 * Tocar el botón de la foto **no mueve el foco**: sin esto, el navegador se lo
 * saca al campo y el botón desaparece entre el toque y el click —en el Safari
 * de iOS el foco ni siquiera llega al botón—, así que el toque se pierde.
 */
app.addEventListener('pointerdown', (e) => {
  if (velo.ocupado()) return;
  if (!conClosest(e.target)?.closest('.poner-foto')) return;
  e.preventDefault();
});

// Salir del campo con algo escrito lo agrega igual: no se pierde por
// distraerse y tocar Guardar.
app.addEventListener('focusout', (e) => {
  if (velo.ocupado()) return;
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
  if (velo.ocupado()) return;
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
        const blob = await velo.esperar(() => achicarFoto(archivo));
        estadoDePantalla.fotoPropia = { blob, url: imagenes.urlDeBlob(blob) };
        // Queda elegida como cualquier otra: el campo oculto la nombra, y de
        // ahí salen la muestra de arriba y «cambios sin guardar». Su URL
        // queda en el estado de la pantalla, no en el formulario.
        elegirEnCategoria('foto', FOTO_PROPIA);
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
  nav.ir(`#/buscar?q=${encodeURIComponent(q)}`);
});

// La entrada con la que se abrió la app es la primera pantalla. Lo que llega
// desde el menú Compartir de Android viene en la query: se pasa a la receta
// nueva y se limpia la URL, para que recargar no lo vuelva a abrir.
const compartido = hashDeCompartido(location.search);
nav.arrancar(compartido ? location.pathname + compartido : undefined);

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
