/**
 * Ajustes (mockup 10): la cuenta, el reindexado y los avisos que no
 * interrumpen. Está a tres toques a propósito: lo de acá es raro y caro.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, conLateral, izquierdaDelEncabezado } from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
import type { IndiceDuplicado, InformeArranque } from '../store.js';

const DIA = 86400000;

/**
 * Cuándo pasó, dicho como se dice: lo reciente en días —«ayer», «hace 3
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

export interface OpcionesAjustes {
  cuenta: string;
  ultimaReindexado: string;
  /** Los `.md` que el reindexado salteó, por nombre: sin eso no se encuentran en Drive. */
  ignorados: string[];
  /** Las recetas de `_sin-categoria/` sin el tag borrador, por nombre: el reindexado las avisa y no las toca. */
  sinBorrador?: string[];
  /** Hay más de una planilla `_indice` en Drive: cuántas y cuál se usa. */
  indiceDuplicado?: IndiceDuplicado | null;
  /** Lo mismo con `_plan.md`, que tampoco está en el índice y se busca por nombre. */
  planDuplicado?: IndiceDuplicado | null;
  /**
   * El último reindexado falló. El progreso no se dibuja acá: va en el velo,
   * que tapa la pantalla mientras dura.
   */
  errorReindexado?: boolean;
  /** Lo que verificó el arranque de esta sesión. */
  informe?: InformeArranque | null;
  /** Cuántas recetas tiene el índice ahora, para el registro de actividad. */
  recetas?: number;
  /** Cuántas categorías hay ahora, para el registro de actividad. */
  categorias?: number;
  /** El nombre de la carpeta base en uso. */
  carpeta?: string;
  /** Ajustes es destino del menú: el lateral y la hamburguesa. */
  menu?: MenuDePantalla;
}

export function renderAjustes(
  { cuenta, ultimaReindexado, ignorados, sinBorrador = [], indiceDuplicado, planDuplicado, errorReindexado = false, menu, informe, recetas = 0, categorias = 0, carpeta = '' }: OpcionesAjustes
): string {
  const seccionCuenta = '<div class="ficha"><h2>Cuenta</h2>' +
    `<div class="fila-a"><span class="t">${escapar(cuenta || 'Sin cuenta conectada')}</span>` +
    '<button class="btn sec compacto" data-accion="salir">Salir</button></div>' +
    '<p class="aviso-mudo" style="margin:var(--e-2) 0 0">Salir no borra nada de Drive.</p>' +
  '</div>';

  // La carpeta y sus categorías, juntas y fuera de Cuenta.
  const seccionRecetario = '<div class="ficha"><h2>Recetario</h2>' +
    (carpeta
      ? `<div class="fila-a"><span class="t">Carpeta: ${escapar(carpeta)}</span>` +
        '<button class="btn sec compacto" data-accion="cambiar-carpeta">Cambiar carpeta</button></div>'
      : '') +
    `<div class="fila-a" style="margin-top:var(--e-3)"><span class="t">${categorias} ${categorias === 1 ? 'categoría' : 'categorías'}</span>` +
      '<a class="btn sec compacto" href="#/categorias">Categorías ›</a></div>' +
  '</div>';

  // Si el último falló, el aviso va sin control: se reintenta con el botón
  // Reindexar, que sigue a la vista (R1).
  const seccionIndice = '<div class="ficha"><h2>Índice</h2>' +
    `<p class="aviso-mudo" style="margin:0 0 var(--e-3)">Último reindexado: ${escapar(cuando(ultimaReindexado) || 'nunca')}</p>` +
    (errorReindexado ? aviso({ texto: 'No se pudo reindexar.' }) : '') +
    '<button class="btn sec" style="width:100%" data-accion="reindexar">Reindexar</button>' +
  '</div>';

  // El tono de los avisos es el hecho y el número (brand-identity §3.2).
  const duplicado = indiceDuplicado
    ? `<p class="aviso-mudo" style="margin:0 0 var(--e-2)">Hay ${indiceDuplicado.cantidad} planillas _indice en Drive. ` +
      `Se usa la modificada el ${fechaYHora(indiceDuplicado.modifiedTime)}.</p>`
    : '';

  const planRepetido = planDuplicado
    ? `<p class="aviso-mudo" style="margin:0 0 var(--e-2)">Hay ${planDuplicado.cantidad} archivos _plan.md en Drive. ` +
      `Se usa el modificado el ${fechaYHora(planDuplicado.modifiedTime)}.</p>`
    : '';

  const deIgnorados = ignorados.length
    ? `<div class="fila-a"><span class="t aviso-mudo">${ignorados.length} ${ignorados.length === 1 ? 'archivo ignorado' : 'archivos ignorados'} por no tener título.</span></div>` +
      `<p class="aviso-mudo" style="margin:var(--e-2) 0 0">${ignorados.map(n => escapar(n)).join(', ')}</p>`
    : '';

  const deSinBorrador = sinBorrador.length
    ? '<div class="fila-a"><span class="t aviso-mudo">En Sin categoría hay ' +
      `${sinBorrador.length === 1 ? 'una receta' : `${sinBorrador.length} recetas`} sin la marca de borrador.</span></div>` +
      `<p class="aviso-mudo" style="margin:var(--e-2) 0 0">${sinBorrador.map(n => escapar(n)).join(', ')}</p>`
    : '';

  const lista = duplicado + planRepetido + deIgnorados + deSinBorrador ||
    '<p class="aviso-mudo" style="margin:0">No hay nada para avisar.</p>';

  return conLateral(menu,
      encabezado({ titulo: 'Ajustes', grande: true, ...izquierdaDelEncabezado(menu) }) +
      // Lo de la cuenta y el índice primero, lo raro al final.
      '<div class="cuerpo">' + seccionCuenta + seccionRecetario + seccionIndice +
        FICHA_DATOS_LOCALES +
        `<div class="ficha"><h2>Avisos</h2>${lista}</div>` +
        (informe ? fichaAlAbrir(informe, recetas, categorias) : '') +
      '</div>');
}

/**
 * Borrar lo guardado en el navegador, sin salir de la cuenta: la salida para
 * una copia local corrupta o vieja.
 */
const FICHA_DATOS_LOCALES = '<div class="ficha"><h2>Archivos locales</h2>' +
  '<p class="aviso-mudo" style="margin:0 0 var(--e-3)">La copia del índice se guarda acá para abrir más rápido. ' +
  'Si algo se ve viejo o roto, borrala: la app se recarga y se baja todo de Drive.</p>' +
  '<button class="btn sec" style="width:100%" data-accion="borrar-datos-locales">Borrar datos locales</button>' +
'</div>';

const COPIA: Record<InformeArranque['copia'], string> = {
  'coincide': 'coincide con _indice',
  'sin-copia': 'no había',
  'otra-fecha': 'distinta',
  'otra-planilla': 'de otra planilla',
  'otro-esquema': 'de otra versión'
};

const REINDEXADO: Record<InformeArranque['reindexado'], string> = {
  '': 'No hizo falta reindexar.',
  'planilla-nueva': 'Se reindexó: la planilla es nueva.',
  'esquema': 'Se reindexó: cambió la versión del esquema.',
  'a-medias': 'Se reindexó: había uno a medias.'
};

const contar = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/**
 * Lo que pasó al abrir, con el tono de los avisos: el hecho y el número
 * (brand-identity §3.2). Si reindexó, la copia dice sólo cómo estaba: lo que
 * se hizo después no fue bajar la planilla sino rearmarla.
 */
function fichaAlAbrir(informe: InformeArranque, recetas: number, categorias: number): string {
  const { momento, indiceModificado, copia, copiaModificada, reindexado } = informe;
  const estadoCopia = copia === 'otra-fecha' && copiaModificada
    ? `del ${fechaYHora(copiaModificada)}, ${COPIA[copia]}`
    : COPIA[copia];
  const consecuencia = reindexado ? ''
    : copia === 'coincide' ? '; no se leyó Sheets' : '; se bajó la planilla';
  const lineas = [
    `Abrió el ${fechaYHora(momento)}.`,
    indiceModificado ? `_indice: modificada el ${fechaYHora(indiceModificado)}.` : '_indice: se creó al abrir.',
    `Copia local: ${estadoCopia}${consecuencia}.`,
    `${contar(recetas, 'receta', 'recetas')} · ${contar(categorias, 'categoría', 'categorías')}.`,
    REINDEXADO[reindexado]
  ];
  return '<div class="ficha"><h2>Registro de actividad</h2>' +
    lineas.map(l => `<p class="aviso-mudo" style="margin:0 0 var(--e-2)">${escapar(l)}</p>`).join('') +
  '</div>';
}

/** «12/09 a las 14:30», en la hora del teléfono. */
function fechaYHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} a las ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
