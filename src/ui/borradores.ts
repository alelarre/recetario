/**
 * Borradores: la cola de trabajo (mockups 08 y 09).
 *
 * Es el segundo lugar primario de la app y no se parece al Recetario: uno es
 * un archivo consolidado que se consulta, este es una cola que se vacía. Lo
 * más viejo va primero.
 *
 * El borrador se crea a mano, o se manda a Claude: «Convertir con Claude»
 * arma el pedido y lo abre afuera, Claude responde con la receta en `.md`, y
 * esa respuesta vuelve a la app pegándola o compartiéndola —«Pegar receta»—
 * para abrir el editor. La app no llama a ningún modelo: sólo arma el pedido y
 * reconoce la receta que vuelve.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, vacio, lateral, botonMenu, filaDeFotos } from './componentes.js';
import { MAXIMO_FOTOS } from '../borrador.js';
import { ICO } from './iconos.js';
import type { Borrador, EntradaBorrador } from '../tipos.js';

export interface OpcionesBorradores {
  borradores: EntradaBorrador[];
  error?: string;
  /** Un aviso sin acción de reintentar, como «Lo copiado no es una receta en .md.». */
  aviso?: string;
  /** El menú lateral está desplegado (sólo en pantalla angosta). */
  menuAbierto?: boolean;
}

export interface OpcionesBorrador {
  borrador: Borrador;
  /** La confirmación de descarte reemplaza las acciones (C01.6.2). */
  confirmando: boolean;
  error?: string;
  /** Un aviso sin acción de reintentar, como «Lo copiado no es una receta en .md.». */
  aviso?: string;
  /** Las fotos, en el orden del `.md`, con su object URL; `null` si ya no está en Drive. */
  fotos?: { id: string; url: string | null }[];
  /** La foto abierta a pantalla completa: su object URL. */
  visor?: string;
}

const DIA = 86400000;

/**
 * Cuándo se capturó, dicho como se dice: lo reciente en días —«ayer», «hace 3
 * días»— y lo viejo con su fecha, que a partir de una semana es más útil que
 * contar días.
 */
export function cuando(iso: string, ahora = new Date()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const dias = Math.floor((ahora.getTime() - t) / DIA);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias <= 7) return `hace ${dias} días`;
  const fecha = new Date(t);
  const opciones: Intl.DateTimeFormatOptions = fecha.getFullYear() === ahora.getFullYear()
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' };
  return fecha.toLocaleDateString('es-AR', opciones);
}

/** La fuente es texto libre: una URL o «Cuaderno de mamá, p. 44» (C01.4.3). */
const esUrl = (fuente: string): boolean => /^https?:\/\//i.test(fuente.trim());

/** La URL se muestra sin el esquema: lo que informa es el sitio. */
const fuenteVisible = (fuente: string): string => fuente.replace(/^https?:\/\//i, '');

export function renderBorradores(
  { borradores, error, aviso: avisoTexto, menuAbierto }: OpcionesBorradores
): string {
  // Sólo el título y cuándo entró: la fuente y la nota están adentro, y en la
  // fila competían con el título.
  const lista = borradores.map(b =>
    `<a class="bor" href="#/borradores/${encodeURIComponent(b.id_archivo)}">` +
      `<span class="txt"><span class="n">${escapar(b.titulo)}</span></span>` +
      `<span class="d">${escapar(cuando(b.capturado))}</span>` +
    '</a>').join('');

  const agregar = '<button class="btn sec" style="width:100%" data-accion="agregar-borrador">' +
    `${ICO.mas}Nuevo</button>`;

  // Lo que llega de Claude por Compartir o portapapeles puede no tener id de
  // borrador: pegar acá hace la misma pregunta que Compartir.
  const pegar = '<button class="btn sec" style="width:100%" data-accion="pegar-receta">Pegar receta</button>';

  const cuerpo = lista
    // Sin celebración: no hay «¡todo al día!».
    ? `<div class="lista">${lista}</div>`
    : vacio('No hay nada esperando.');

  // Es uno de los dos lugares primarios: se llega por el menú, así que lleva la
  // hamburguesa y no un volver.
  return lateral({
    activo: 'borradores', borradores: borradores.length,
    ...(menuAbierto ? { abierto: true } : {})
  }) +
    '<div class="conten">' +
      encabezado({
        titulo: 'Borradores', grande: true, izquierda: botonMenu(0),
        ...(borradores.length ? { total: borradores.length } : {})
      }) +
      '<div class="cuerpo denso">' +
        (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } }) : '') +
        (avisoTexto ? aviso({ texto: avisoTexto }) : '') +
        cuerpo + agregar + pegar +
      '</div>' +
    '</div>';
}

export function renderBorrador(
  { borrador, confirmando, error, aviso: avisoTexto, fotos = [], visor }: OpcionesBorrador
): string {
  const ficha = '<div class="ficha">' +
    `<div style="font-size:var(--txt-titulo);font-weight:600;line-height:1.25">${escapar(borrador.titulo)}</div>` +
    // La fuente se dibuja como en la receta abierta (`.rec-fuente`): micro y
    // tenue, un dato al margen.
    (borrador.fuente
      ? '<div style="font-size:var(--txt-micro);color:var(--fg-3);margin-top:var(--e-2);word-break:break-all">' +
        `<span class="emo">📖</span>fuente: ${escapar(fuenteVisible(borrador.fuente))}</div>`
      : '') +
    // Cuándo entró es un dato al margen: se despega y se va al borde, como el
    // total del encabezado.
    '<div style="font-size:var(--txt-micro);color:var(--fg-3);margin-top:var(--e-3);text-align:right">' +
      `Capturado ${escapar(cuando(borrador.capturado))}</div>` +
    (borrador.nota
      ? `<p class="lee" style="margin:var(--e-4) 0 0;padding-top:var(--e-3);border-top:1px solid var(--borde)">${escapar(borrador.nota)}</p>`
      : '') +
    // Las fotos se agregan al final y se sacan de a una: no se reordenan.
    '<div class="campo" style="margin:var(--e-4) 0 0;padding-top:var(--e-3);border-top:1px solid var(--borde)">' +
      '<span>Fotos</span>' +
      filaDeFotos({
        fotos: fotos.map(f => ({
          url: f.url, sacar: { accion: 'sacar-foto', valor: f.id }, ver: { accion: 'ver-foto', valor: f.id }
        })),
        agregar: fotos.length < MAXIMO_FOTOS,
        porUrl: true
      }) +
    '</div>' +
  '</div>';

  // Es destructivo —el .md va a la papelera de Drive—: la confirmación nombra el borrador.
  const confirmacion = '<div class="ficha" style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-4)">¿Descartar <b>${escapar(borrador.titulo)}</b>?</p>` +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="cancelar-descarte">Cancelar</button>' +
      '<button class="btn pel" data-accion="descartar-confirmado">Descartar</button>' +
    '</div></div>';

  // Editar va arriba, como en la receta. En el cuerpo: primero ver de dónde
  // sale, después descartarlo, después las dos formas de traer la receta de
  // Claude, y crear la receta a mano cierra la lista.
  const acciones = '<div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
    (esUrl(borrador.fuente)
      ? `<a class="btn sec" href="${escapar(borrador.fuente)}" target="_blank" rel="noopener">Ir a la fuente</a>`
      : '') +
    `<button class="btn pel" data-accion="descartar">${ICO.tacho}Descartar</button>` +
    '<button class="btn sec" data-accion="convertir-con-claude">Convertir con Claude</button>' +
    '<button class="btn sec" data-accion="pegar-receta">Pegar receta</button>' +
    '<button class="btn prim" data-accion="crear-receta">Crear la receta</button>' +
  '</div>';

  return encabezado({
    titulo: 'Borrador', volver: true,
    derecha: '<button class="btn sec compacto" data-accion="editar-borrador">Editar</button>'
  }) +
    '<div class="cuerpo">' +
      (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } }) : '') +
      (avisoTexto ? aviso({ texto: avisoTexto }) : '') +
      (confirmando ? ficha + confirmacion : ficha + acciones) +
    '</div>' +
    // A pantalla completa, sobre un velo; se cierra tocando cualquier lado.
    (visor ? `<div class="visor" data-accion="cerrar-visor"><img src="${escapar(visor)}" alt="Foto"></div>` : '');
}

/** A qué borrador corresponde una receta que llegó sin id, o con uno que ya no existe. */
export function renderPreguntaBorrador({ borradores }: { borradores: EntradaBorrador[] }): string {
  const opciones = borradores.map(b =>
    `<button class="btn sec" data-accion="elegir-borrador-recibido" data-valor="${escapar(b.id_archivo)}">${escapar(b.titulo)}</button>`
  ).join('');
  return encabezado({ titulo: '¿De qué borrador es esta receta?', volver: true }) +
    '<div class="cuerpo denso"><div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
      opciones +
      '<button class="btn sec" data-accion="elegir-borrador-recibido" data-valor="">Ninguno</button>' +
    '</div></div>';
}
