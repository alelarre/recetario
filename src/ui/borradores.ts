/**
 * Borradores: la cola de trabajo (mockups 08 y 09).
 *
 * Es el segundo lugar primario de la app y no se parece al Recetario: uno es
 * un archivo consolidado que se consulta, este es una cola que se vacía. Lo
 * más viejo va primero.
 *
 * Ninguna acción de acá llama a un agente: la conversión desde el video o el
 * PDF ocurre afuera, y lo que la app ofrece es crear la receta a mano.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, vacio, lateral, botonMenu } from './componentes.js';
import { ICO } from './iconos.js';
import type { Borrador } from '../tipos.js';

export interface OpcionesBorradores {
  borradores: Borrador[];
  error?: string;
  /** El menú lateral está desplegado (sólo en pantalla angosta). */
  menuAbierto?: boolean;
}

export interface OpcionesBorrador {
  borrador: Borrador;
  /** La confirmación de descarte reemplaza las acciones (C01.6.2). */
  confirmando: boolean;
  error?: string;
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

export function renderBorradores({ borradores, error, menuAbierto }: OpcionesBorradores): string {
  // Sólo el título y cuándo entró: la fuente y la nota están adentro, y en la
  // fila competían con el título.
  const lista = borradores.map(b =>
    `<a class="bor" href="#/borradores/${encodeURIComponent(b.id)}">` +
      `<span class="txt"><span class="n">${escapar(b.titulo)}</span></span>` +
      `<span class="d">${escapar(cuando(b.capturado))}</span>` +
    '</a>').join('');

  const agregar = '<button class="btn sec" style="width:100%" data-accion="agregar-borrador">' +
    `${ICO.mas}Nuevo</button>`;

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
        cuerpo + agregar +
      '</div>' +
    '</div>';
}

export function renderBorrador({ borrador, confirmando, error }: OpcionesBorrador): string {
  const ficha = '<div class="ficha">' +
    `<div style="font-size:var(--txt-titulo);font-weight:600;line-height:1.25">${escapar(borrador.titulo)}</div>` +
    (borrador.fuente
      ? '<div style="font-size:var(--txt-chico);color:var(--fg-2);margin-top:var(--e-2);word-break:break-all">' +
        `<span class="emo">📖</span>fuente: ${escapar(fuenteVisible(borrador.fuente))}</div>`
      : '') +
    // Cuándo entró es un dato al margen: se despega y se va al borde, como el
    // total del encabezado.
    '<div style="font-size:var(--txt-micro);color:var(--fg-3);margin-top:var(--e-3);text-align:right">' +
      `Capturado ${escapar(cuando(borrador.capturado))}</div>` +
    (borrador.nota
      ? `<p class="lee" style="margin:var(--e-4) 0 0;padding-top:var(--e-3);border-top:1px solid var(--borde)">${escapar(borrador.nota)}</p>`
      : '') +
  '</div>';

  // Es destructivo y no hay papelera: la confirmación nombra el borrador.
  const confirmacion = '<div class="ficha" style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-4)">¿Descartar <b>${escapar(borrador.titulo)}</b>?</p>` +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="cancelar-descarte">Cancelar</button>' +
      '<button class="btn pel" data-accion="descartar-confirmado">Descartar</button>' +
    '</div></div>';

  // Editar va arriba, como en la receta. En el cuerpo: primero ver de dónde
  // sale, después descartarlo, y crear la receta cierra la lista.
  const acciones = '<div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
    (esUrl(borrador.fuente)
      ? `<a class="btn sec" href="${escapar(borrador.fuente)}" target="_blank" rel="noopener">Ir a la fuente</a>`
      : '') +
    `<button class="btn pel" data-accion="descartar">${ICO.tacho}Descartar</button>` +
    '<button class="btn prim" data-accion="crear-receta">Crear la receta</button>' +
  '</div>';

  return encabezado({
    titulo: 'Borrador', volver: true,
    derecha: '<button class="btn sec compacto" data-accion="editar-borrador">Editar</button>'
  }) +
    '<div class="cuerpo">' +
      (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } }) : '') +
      (confirmando ? ficha + confirmacion : ficha + acciones) +
    '</div>';
}
