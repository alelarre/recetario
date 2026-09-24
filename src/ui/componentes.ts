/**
 * Los fragmentos que comparten las pantallas: encabezado, tarjeta,
 * placeholder, aviso, chips, vacío y el spinner.
 *
 * Todo texto que venga de un `.md` pasa por `escapar()`: los archivos los
 * escribe cualquiera —un agente, el usuario, un PDF mal convertido— y ninguno
 * es confiable.
 */
import { escapar, imgDe } from './markdown.js';
import { colorCategoria, fotoCategoria, slugCategoria } from './categorias.js';
import { ICO, ICONO_DE_DURACION } from './iconos.js';
import { textoVersion } from '../version.js';
import { tagEspecial, ordenarTags, tieneEspecial, TAGS_ESPECIALES, duracionValida, DURACIONES } from '../catalogo.js';
import type { Entrada, UsoDeFoto } from '../tipos.js';
import type { TagEspecial, Duracion, Orden } from '../catalogo.js';

/** La duración con su relojito, o nada si el tiempo no es uno de los cinco valores. */
export function duracionConReloj(tiempo: unknown): string {
  const d = duracionValida(tiempo);
  return d ? `<span class="dur">${ICONO_DE_DURACION[d]}${escapar(d)}</span>` : '';
}

/**
 * Los chips de duración de una lista: cada uno con su relojito y
 * cuántas recetas trae. Un valor encendido se dibuja aunque ya no traiga
 * ninguna, para poder apagarlo. Sin nada que mostrar, no hay fila.
 */
export function filaDuraciones(conteo: { valor: Duracion; cantidad: number }[], activas: string[]): string {
  const lista = DURACIONES
    .map(valor => ({ valor, cantidad: conteo.find(c => c.valor === valor)?.cantidad ?? 0 }))
    .filter(x => x.cantidad > 0 || activas.includes(x.valor));
  if (!lista.length) return '';
  const chips = lista.map(({ valor, cantidad }) =>
    `<button class="chip${activas.includes(valor) ? ' act' : ''}" data-accion="filtrar-duracion" data-valor="${escapar(valor)}">` +
    `${ICONO_DE_DURACION[valor]}${escapar(valor)}<span class="cuenta">${cantidad}</span></button>`).join('');
  return `<div class="fila-dur" role="group" aria-label="Filtrar por duración">${chips}</div>`;
}

/** «A–Z | Duración», a la derecha. */
export function conmutadorOrden(orden: Orden): string {
  const b = (valor: Orden, contenido: string) =>
    `<button data-accion="ordenar" data-valor="${valor}" aria-pressed="${orden === valor}">${contenido}</button>`;
  return '<div class="orden"><div class="orden-seg" role="group" aria-label="Orden">' +
    b('alfa', 'A–Z') + b('duracion', `${ICONO_DE_DURACION['~30 min']}Duración`) +
  '</div></div>';
}

/** El spinner del final de la lista y de las esperas. */
export const SPINNER = '<div class="spin"></div>';

/** Lo hecho, de 0 a 1, como entero de 0 a 100: el texto y el ancho salen de acá. */
export const porCiento = (parte: number): number =>
  Math.min(100, Math.max(0, Math.round(parte * 100)));

/** La barra del reindexado, la misma en la conexión y en Ajustes. */
export const barra = (parte: number): string =>
  `<div class="barra"><i style="width:${porCiento(parte)}%"></i></div>`;

export interface OpcionesEncabezado {
  titulo: string;
  volver?: boolean;
  /** El título de la app: grande y centrado en la barra. */
  grande?: boolean;
  /** HTML ya armado para el extremo derecho: botones de ícono. */
  derecha?: string;
  /**
   * HTML para el extremo izquierdo, donde iría el volver. Lo usa la
   * hamburguesa del menú: en Android el control del drawer va a la izquierda,
   * del mismo lado por el que el panel entra.
   */
  izquierda?: string;
  /** El total de la categoría va acá y no en la lista (mockup 04). */
  total?: number;
  /** Un ícono antes del título: el del tag especial en su lista. HTML ya armado. */
  icono?: string;
}

export function encabezado(
  { titulo, volver, grande, derecha, izquierda, total, icono }: OpcionesEncabezado
): string {
  const alaIzquierda = izquierda ?? (volver
    ? `<button class="ico" data-accion="volver" aria-label="Volver">${ICO.volver}</button>`
    : '');
  const clase = grande ? 'tit app' : 'tit';
  const estilo = grande ? ' style="font-size:var(--txt-titulo)"' : '';
  return `<div class="enc">${alaIzquierda}` +
    `<span class="${clase}"${estilo}>${icono ?? ''}${escapar(titulo)}</span>` +
    (total === undefined ? '' : `<span class="tot">${total}</span>`) +
    // Los controles de la derecha van en su propio grupo: con el título
    // centrado en absoluto, nada los empuja hasta el borde.
    (derecha ? `<span class="der">${derecha}</span>` : '') +
    '</div>';
}

/**
 * El cuadro de 56 px de una fila: abajo, siempre, la categoría oscurecida y
 * teñida; encima, la foto de la receta si la tiene.
 *
 * El placeholder se dibuja **siempre**, incluso con foto: una
 * cabecera de Drive llega como recuadro y se completa cuando el blob está, y
 * si no está nunca —o si la foto ya no está en Drive— abajo queda la
 * categoría. Así el hueco no existe en ningún momento y la lista no se
 * reacomoda (F02.5b).
 */
export function placeholder(categoria: unknown, foto?: string): string {
  const imagen = fotoCategoria(categoria);
  const estilo = `--c:${colorCategoria(categoria)}`;
  return `<span class="ph" style="${escapar(estilo)}">` +
    (imagen ? imgDe(imagen) : '') +
    // Última y con `z-index`: las capas que oscurecen la categoría son
    // pseudo-elementos de `.ph` y no tienen que teñir la foto de la receta.
    (foto ? imgDe(foto, 'foto') : '') +
  '</span>';
}

export interface OpcionesTarjeta {
  /** En los resultados por ingrediente, por qué apareció (C02.3.2). */
  motivo?: string;
  /**
   * Con acción, la tarjeta es un botón que la dispara con el id de la receta,
   * en vez de un link que la abre: es lo que pide la pantalla de agregar al
   * plan, donde tocar una receta la suma a una comida.
   */
  accion?: string;
}

/** Cómo dice cada marca lo que es, para quien no la ve. */
const NOMBRE_DE_MARCA: Record<TagEspecial, string> = {
  favorito: 'Favorita', 'menú diario': 'Menú diario', probar: 'Para probar', borrador: 'Borrador'
};

/** Foto, título y una línea de contexto. Alto total 80 px. */
export function tarjeta(e: Entrada, { motivo, accion }: OpcionesTarjeta = {}): string {
  const dur = duracionConReloj(e.tiempo);
  const contexto = motivo
    ? `<span class="ctx-txt"><span class="motivo">${escapar(motivo)}</span>${dur ? ` · ${dur}` : ''}</span>`
    : `<span class="pin" style="background:${colorCategoria(e.categoria)}"></span>` +
      `<span class="ctx-txt">${[escapar(e.categoria), dur, escapar(e.rinde)].filter(Boolean).join(' · ')}</span>`;
  // Las marcas de los especiales, juntas en la esquina y en su orden: la línea
  // de contexto queda sólo con datos. `--marcas` reserva el ancho que ocupan,
  // para que el título no pase por debajo.
  // El `title` es el globito del escritorio: en el teléfono no hay dónde
  // apoyar el dedo, y ahí lo que dice qué es cada marca sigue siendo el
  // `aria-label`.
  const puestas = TAGS_ESPECIALES.filter(t => tieneEspecial(e, t));
  const marcas = puestas.length
    ? '<span class="marcas-esq">' + puestas.map(t =>
        `<span class="marca${t === 'favorito' ? ' favorita' : ''}" role="img" ` +
        `aria-label="${NOMBRE_DE_MARCA[t]}" title="${NOMBRE_DE_MARCA[t]}">` +
        `${iconoDeTag(t)}</span>`).join('') +
      '</span>'
    : '';
  const estilo = puestas.length ? ` style="--marcas:${puestas.length}"` : '';
  const apertura = accion
    ? `<button class="tarjeta" type="button" data-accion="${escapar(accion)}" data-id="${escapar(e.id_archivo)}"${estilo}>`
    : `<a class="tarjeta" href="#/r/${encodeURIComponent(e.id_archivo)}"${estilo}>`;
  // Con acción la tarjeta agrega en vez de abrir la receta: el «+» lo dice
  // para quien ve, y queda afuera de `.txt` para no competir con las marcas.
  const masElegir = accion ? `<span class="mas-elegir" aria-hidden="true">${ICO.mas}</span>` : '';
  return apertura +
    placeholder(e.categoria, e.foto) +
    '<span class="txt">' +
      `<span class="n">${escapar(e.titulo)}</span>` +
      `<span class="ctx">${contexto}</span>` +
    '</span>' + marcas + masElegir + (accion ? '</button>' : '</a>');
}

export interface OpcionesAviso {
  texto: string;
  /** El control para reintentar. Sin él, el aviso solo informa (R1). */
  accion?: { etiqueta: string; accion: string };
}

/** Un aviso en castellano, donde ocurrió, y un control para reintentar. */
export function aviso({ texto, accion }: OpcionesAviso): string {
  const boton = accion
    ? `<button class="btn sec compacto" data-accion="${escapar(accion.accion)}">${escapar(accion.etiqueta)}</button>`
    : '';
  return `<div class="aviso"><p>${escapar(texto)}</p>${boton}</div>`;
}

/** Lo que dice el aviso cuando falta la sesión de Google (R3). */
export const SIN_SESION = 'Hay que conectarse de nuevo con Google.';

/**
 * El aviso de un guardado que falló, en el editor. Se reintenta
 * con Guardar, que sigue a la vista; sin sesión, antes hay que conectarse, y
 * por eso ese aviso sí lleva su control.
 */
export function avisoAlGuardar(error: string): string {
  return error === SIN_SESION
    ? `<div data-sin-sesion>${aviso({ texto: error, accion: { etiqueta: 'Conectar', accion: 'conectar-de-nuevo' } })}</div>`
    : aviso({ texto: error });
}

/** El ícono del tag especial, o nada si es un tag común. */
export function iconoDeTag(tag: string): string {
  const esp = tagEspecial(tag);
  if (esp === 'favorito') return ICO.estrella;
  if (esp === 'probar') return ICO.marcador;
  if (esp === 'menú diario') return ICO.calendario;
  if (esp === 'borrador') return '<span class="borr"></span>';
  return '';
}

export interface OpcionesChip {
  activo?: boolean;
  /** Cuántas recetas lo llevan. Sin número, no se dibuja. */
  cantidad?: number;
  /**
   * El tag de la ruta en la lista por tag: va encendido pero no es tocable.
   * Cambiar de tag es volver y elegir otro, no tocarlo acá, así que va sin
   * `data-tag` —no entra en la delegación de clicks— y como `<span>`, no
   * `<button>`, que es lo único que gana `cursor: pointer` (tokens.css).
   */
  fijo?: boolean;
  /** En la receta el tag sólo se lee: `<span>` sin `data-tag`, y sin encender. */
  quieto?: boolean;
}

/** Un tag como chip: con su ícono si es especial, y con su número si lo trae. */
export function chipTag(tag: string, { activo, cantidad, fijo, quieto }: OpcionesChip = {}): string {
  const cuenta = cantidad === undefined ? '' : `<span class="cuenta">${cantidad}</span>`;
  const adentro = `${iconoDeTag(tag)}${escapar(tag)}${cuenta}`;
  if (fijo) return `<span class="chip act">${adentro}</span>`;
  if (quieto) return `<span class="chip">${adentro}</span>`;
  return `<button class="chip${activo ? ' act' : ''}" data-tag="${escapar(tag)}">${adentro}</button>`;
}

/**
 * Los chips sueltos, sin el contenedor: los usa la receta, donde los tags se
 * leen y no se tocan (C02.6.3). La excepción es `borrador`, que abre el
 * editor: ahí se completa lo que falta (C03.1.3).
 */
export function chipsSueltos(tags: string[]): string {
  return ordenarTags(Array.isArray(tags) ? tags : []).map(tag => tagEspecial(tag) === 'borrador'
    ? `<button class="chip pend" data-accion="editar" aria-label="Borrador: abrir el editor">` +
      `${iconoDeTag(tag)}${escapar(tag)}</button>`
    : chipTag(tag, { quieto: true })).join('');
}

export interface OpcionesMarcoCarrusel {
  /** Qué dicen las flechas cuando no se las ve: cambia con lo que lleva adentro. */
  etiquetaIzq: string;
  etiquetaDer: string;
  /** Una clase más en el marco, para lo propio de cada carrusel. */
  clase?: string;
}

/**
 * El marco que se desliza de costado: la pista con lo que le den adentro, el
 * degradé que dice que sigue, y las dos flechas, que aparecen sólo con mouse o
 * trackpad. Lo usan los tags y las fotos de la receta.
 *
 * Cada marco es independiente: la flecha mueve la pista de su propio marco
 * (`desplazarCarrusel` en `ui/pintar.ts`), así que dos carruseles pueden
 * convivir en la misma pantalla. Sin contenido no hay carrusel.
 */
export function carrusel(contenido: string, { etiquetaIzq, etiquetaDer, clase }: OpcionesMarcoCarrusel): string {
  if (!contenido) return '';
  return `<div class="carrusel-marco${clase ? ` ${clase}` : ''}">` +
    `<div class="carrusel" data-carrusel>${contenido}</div>` +
    `<button class="carrusel-flecha izq" data-accion="carrusel-izq" aria-label="${escapar(etiquetaIzq)}">${ICO.volver}</button>` +
    `<button class="carrusel-flecha der" data-accion="carrusel-der" aria-label="${escapar(etiquetaDer)}">${ICO.chevron}</button>` +
    '</div>';
}

export interface OpcionesCarrusel {
  activos?: string[];
  /** Cuántos tags comunes entran. Los especiales no cuentan y van siempre. */
  tope?: number;
  /** El tag de la ruta en la lista por tag: va encendido pero no es tocable. */
  fijo?: string;
}

/**
 * El carrusel de tags que filtra: los especiales primero y en su orden,
 * después los demás por cantidad. `store.tagsDe()` ya entrega los comunes así
 * de ordenados, pero se reordena igual acá: el carrusel no debe depender de
 * que quien lo llame respete ese contrato.
 */
export function carruselTags(
  tags: { tag: string; cantidad: number }[], { activos = [], tope, fijo }: OpcionesCarrusel = {}
): string {
  const lista = Array.isArray(tags) ? tags : [];
  const especiales = TAGS_ESPECIALES
    .map(t => lista.find(x => tagEspecial(x.tag) === t))
    .filter((x): x is { tag: string; cantidad: number } => !!x && x.cantidad > 0);
  const comunes = lista
    .filter(x => !tagEspecial(x.tag))
    .sort((a, b) => b.cantidad - a.cantidad || a.tag.localeCompare(b.tag, 'es'));
  const cortados = tope === undefined ? comunes : comunes.slice(0, tope);
  const todos = [...especiales, ...cortados];
  if (!todos.length) return '';

  const chips = todos
    .map(({ tag, cantidad }) => tag === fijo
      ? chipTag(tag, { cantidad, fijo: true })
      : chipTag(tag, { cantidad, activo: activos.includes(tag) }))
    .join('');
  return carrusel(chips, { etiquetaIzq: 'Tags anteriores', etiquetaDer: 'Más tags' });
}

/** Una frase y nada más: sin ilustración y sin sugerencias (mockup 05). */
export function vacio(texto: string): string {
  return `<div class="vacio">${escapar(texto)}</div>`;
}

/** Los destinos del menú lateral. Es la navegación primaria de la app. */
export type DestinoLateral = 'recetario' | 'borradores' | 'plan' | 'ajustes';

export interface OpcionesLateral {
  /** Cuál de los tres se está mirando: se marca con el acento. */
  activo: DestinoLateral;
  /** Cuántos borradores esperan. En cero no se dibuja el número. */
  borradores: number;
  /** El menú está desplegado. En pantalla ancha el lateral es fijo y esto no aplica. */
  abierto?: boolean;
}

/**
 * El menú lateral: Recetario, Borradores y Ajustes, con su nombre.
 *
 * En el teléfono se despliega desde la hamburguesa y se cierra tocando el velo
 * o cualquier destino; en pantalla ancha queda fijo y la hamburguesa no se
 * dibuja —eso lo resuelve el CSS, no este HTML, que es el mismo en los dos
 * casos—.
 */
export function lateral({ activo, borradores, abierto }: OpcionesLateral): string {
  const item = (destino: DestinoLateral, hash: string, icono: string, texto: string, cuenta = 0): string =>
    `<a class="${destino === activo ? 'act' : ''}" href="${hash}">${icono}${texto}` +
    (cuenta > 0 ? `<span class="cu">${cuenta}</span>` : '') + '</a>';

  return `<div class="velo-lat${abierto ? ' on' : ''}" data-accion="cerrar-menu"></div>` +
    `<nav class="lat${abierto ? ' abierto' : ''}">` +
      '<div class="marca">Recetario</div>' +
      // «Inicio» y no «Recetario»: ese nombre ya es la marca de arriba del menú.
      item('recetario', '#/', ICO.casa, 'Inicio') +
      item('borradores', '#/borradores', ICO.bandeja, 'Borradores', borradores) +
      // El plan es su única entrada: el Recetario no lo nombra.
      item('plan', '#/plan', ICO.calendario, 'Plan de la semana') +
      // Nueva receta es una acción y no un lugar: nunca queda marcada, porque
      // el editor al que lleva no dibuja el menú. Es la única entrada para
      // crear una receta a mano.
      `<a href="#/nueva">${ICO.mas}Nueva receta</a>` +
      item('ajustes', '#/ajustes', ICO.ajustes, 'Ajustes') +
      // Al pie y tenue: sirve para saber si el teléfono ya tomó el último deploy.
      `<div class="version">${escapar(textoVersion())}</div>` +
    '</nav>';
}

/**
 * La hamburguesa que abre el lateral, con el contador de borradores encima: en
 * el teléfono el menú está cerrado, y si no, no habría manera de saber que hay
 * algo esperando.
 */
export function botonMenu(borradores: number): string {
  const cuenta = borradores > 0 ? `<span class="n">${borradores}</span>` : '';
  return `<button class="ico cuenta menu-lat" data-accion="abrir-menu" aria-label="Menú">${ICO.menu}${cuenta}</button>`;
}

export interface OpcionesTile {
  cantidad?: number;
  /**
   * Con acción, el tile es un botón que la dispara con el nombre de la
   * categoría, en vez de un link que navega a ella: es lo que pide la
   * grilla de categorías al agregar al plan.
   */
  accion?: string;
}

/** El tile de una categoría en la grilla del Recetario (mockup 03). */
export function tile(nombre: string, { cantidad, accion }: OpcionesTile = {}): string {
  const imagen = fotoCategoria(nombre);
  // Con `imgDe`, una foto propia de Drive también se dibuja: como recuadro
  // hasta que `main.ts` la pida a Drive y le ponga el `src`.
  const fondo = imagen
    ? `<span class="im">${imgDe(imagen)}</span>`
    : '<span class="im trama"></span>';   // las que no tienen foto
  const cuenta = cantidad ? `<span class="cu">${cantidad}</span>` : '';
  const atributos = `class="tile" style="--c:${colorCategoria(nombre)}" data-slug="${escapar(slugCategoria(nombre))}"`;
  return (accion
    ? `<button type="button" ${atributos} data-accion="${escapar(accion)}" data-nombre="${escapar(nombre)}">`
    : `<a ${atributos} href="#/c/${encodeURIComponent(nombre)}">`) +
    `${fondo}${cuenta}<span class="nm">${escapar(nombre)}</span>` + (accion ? '</button>' : '</a>');
}

/** Qué acción dispara un botón de la miniatura, y con qué valor si lo lleva. */
interface AccionDeMiniatura {
  accion: string;
  valor?: string;
  /** Qué dice el botón cuando no se lo ve. Sin esto, lo que hace por defecto. */
  etiqueta?: string;
}

/**
 * Una miniatura de la fila de fotos. `url` en `null` es una foto que ya no
 * está en Drive; en `''`, una foto nueva que todavía no se subió y de la que
 * sólo se sabe su número —la miniatura se la pone quien la tenga en memoria,
 * buscándola por `data-n`—.
 */
export interface Miniatura {
  url: string | null;
  /** La × que la saca. Sin esto, desde la fila no se saca. */
  sacar?: AccionDeMiniatura;
  /** Tocarla; sin esto, la miniatura no se toca. */
  ver?: AccionDeMiniatura;
  /** Su número en el depósito de la receta: el badge, y `data-n` en los botones. */
  n?: number;
  /**
   * En qué se usa la foto (`usosDeFotos`): una marca por uso, arriba a la
   * derecha. Sin `uso`, la foto no lleva marca.
   */
  uso?: UsoDeFoto;
}

/**
 * El recuadro de una foto de Drive que ya no está. Lo dibuja la fila
 * de miniaturas, y `main` lo pone en lugar de una imagen que tenga su propio
 * cuadrado —el carrusel de la receta, una grilla— cuando Drive contesta que el
 * archivo no existe.
 */
export const FOTO_AUSENTE = '<span class="miniatura-vacia">La foto ya no está en Drive.</span>';

/** El recuadro de una foto externa cuya URL no carga. Mismo lugar, otro motivo. */
export const FOTO_ROTA = '<span class="miniatura-vacia">No se pudo cargar la foto.</span>';

/** `data-accion`, y el valor o el número con los que viaja. */
const datosDeAccion = (a: AccionDeMiniatura, n: number | undefined): string =>
  ` data-accion="${escapar(a.accion)}"` +
  (a.valor === undefined ? '' : ` data-valor="${escapar(a.valor)}"`) +
  (n === undefined ? '' : ` data-n="${n}"`);

/**
 * La fila de fotos del editor: miniaturas cuadradas y, al
 * final, dos botones —*Cámara* y *Galería*— para agregar. El `capture`
 * de un input es lo único que lleva directo a la cámara, y saca la galería:
 * por eso hacen falta dos inputs, cada uno en su propio `label` —tocarlo lo
 * abre sin script—, los dos con `data-fotos` para llegar al mismo manejador
 * de `change` en `main.ts`. La cámara entrega una foto a la vez; la galería
 * sigue aceptando varias.
 *
 * `porUrl` suma un tercer botón, **Por URL**, que no es un input de archivo:
 * la app baja la foto de la dirección que se le escriba. Qué pasa con la que
 * no se pudo bajar lo decide `main.ts`.
 */
export function filaDeFotos(
  { fotos, agregar, porUrl = false }: { fotos: Miniatura[]; agregar: boolean; porUrl?: boolean }
): string {
  const miniaturas = fotos.map((f, i) => {
    // Con depósito, la foto se nombra por su número —el que va en el texto de
    // la receta—; sin depósito, por su posición en la fila.
    const cual = f.n ?? i + 1;
    const imagen = f.url === null
      ? FOTO_AUSENTE
      // Sin URL, el `<img>` queda vacío y marcado con su número: recién
      // subida no hay nada que pedirle a Drive todavía.
      : f.url === '' ? `<img data-n="${f.n}" alt="Foto ${cual}">` : imgDe(f.url);
    // Las marcas de uso, arriba a la derecha y sobre el mismo fondo oscuro que
    // el número: una foto sin uso no lleva ninguna, y la esquina queda limpia.
    const marcas = (f.uso?.portada ? ICO.portada : '') + (f.uso?.enElTexto ? ICO.enElTexto : '');
    // El número va adentro del botón: encima de la foto, tocarlo es tocarla.
    const contenido = imagen + (f.n === undefined ? '' : `<span class="miniatura-n">#${f.n}</span>`) +
      (marcas ? `<span class="miniatura-usos">${marcas}</span>` : '');
    const cuerpo = f.ver && f.url !== null
      ? `<button type="button" class="miniatura-ver"${datosDeAccion(f.ver, f.n)} ` +
        `aria-label="${escapar(f.ver.etiqueta ?? `Ver la foto ${cual}`)}">${contenido}</button>`
      : contenido;
    const sacar = f.sacar
      ? `<button type="button" class="miniatura-sacar"${datosDeAccion(f.sacar, f.n)} ` +
        `aria-label="${escapar(f.sacar.etiqueta ?? `Sacar la foto ${cual}`)}">${ICO.cerrar}</button>`
      : '';
    return `<div class="miniatura">${cuerpo}${sacar}</div>`;
  }).join('');
  // Los dos botones van en su propia fila, abajo: con las miniaturas al lado
  // se mezclaban con las fotos y costaba ver dónde terminaba una cosa y
  // empezaba la otra.
  const botones = agregar
    ? '<div class="fotos-botones">' +
      // *Cámara* sólo donde hay una de mano: el `capture` no hace nada en una
      // computadora —abre el mismo selector que *Galería*— y sacar una foto con
      // la webcam de la Mac no es algo que se use. Lo esconde el CSS, por
      // puntero, que es lo mismo que decide las flechas del carrusel.
      `<label class="btn sec miniatura-agregar solo-tactil">${ICO.camara}Cámara` +
      '<input type="file" accept="image/*" capture="environment" data-fotos hidden></label>' +
      `<label class="btn sec miniatura-agregar">${ICO.galeria}Galería` +
      '<input type="file" accept="image/*" multiple data-fotos hidden></label>' +
      (porUrl
        ? '<button type="button" class="btn sec miniatura-agregar" data-accion="abrir-foto-url">' +
          `${ICO.link}Por URL</button>`
        : '') +
      '</div>'
    : '';
  return `<div class="fotos-campo"><div class="miniaturas">${miniaturas}</div>${botones}</div>`;
}

