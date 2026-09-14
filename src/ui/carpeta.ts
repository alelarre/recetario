/**
 * El selector de la carpeta base (P15/P19, etapa 2).
 *
 * Aparece cuando no hay una carpeta marcada, o hay más de una, y desde Ajustes
 * para cambiarla. Sólo muestra carpetas propias: las compartidas y las unidades
 * compartidas no entran.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso, vacio, SPINNER } from './componentes.js';

export interface CarpetaSimple {
  id: string;
  nombre: string;
}

export interface OpcionesSelector {
  /** Las marcadas, o las propias llamadas Recetario. */
  sugerencias: CarpetaSimple[];
  /** El nivel que se mira; `root` es «Mi unidad». */
  nivel: CarpetaSimple;
  /** Las carpetas del nivel; `null` mientras se leen. */
  carpetas: CarpetaSimple[] | null;
  /** La carpeta a punto de usarse: la confirmación reemplaza los botones. */
  confirmando: CarpetaSimple | null;
  /** «Crear una carpeta nueva acá» desplegado. */
  creando: boolean;
  /** Se entró desde Ajustes, para cambiar la carpeta en uso. */
  cambiando: boolean;
  error?: string;
}

const hrefNivel = (c: CarpetaSimple): string =>
  `#/carpeta?id=${encodeURIComponent(c.id)}&nombre=${encodeURIComponent(c.nombre)}`;

const fila = (c: CarpetaSimple, destino: string): string =>
  `${destino}<span class="txt"><span class="n">${escapar(c.nombre)}</span></span></a>`;

export function renderSelector(
  { sugerencias, nivel, carpetas, confirmando, creando, cambiando, error }: OpcionesSelector
): string {
  const enRaiz = nivel.id === 'root';

  const encontradas = sugerencias.length
    ? '<div><div class="rot">Encontradas</div><div class="lista">' +
      sugerencias.map(c =>
        `<button class="bor" data-accion="carpeta-sugerida" data-id="${escapar(c.id)}" data-nombre="${escapar(c.nombre)}">` +
          `<span class="txt"><span class="n">${escapar(c.nombre)}</span></span></button>`
      ).join('') + '</div></div>'
    : '';

  const lista = error
    ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'reintentar' } })
    : carpetas === null
      ? SPINNER
      : carpetas.length
        ? '<div class="lista">' + carpetas.map(c => fila(c, `<a class="bor" href="${escapar(hrefNivel(c))}">`)).join('') + '</div>'
        : vacio('No hay carpetas acá.');

  const rotulo = enRaiz ? 'Mi unidad' : `Mi unidad › ${nivel.nombre}`;

  const acciones = confirmando
    ? '<div class="ficha">' +
        `<p class="lee" style="margin:0 0 var(--e-4)">Voy a usar <b>${escapar(confirmando.nombre)}</b>. ` +
        'Si faltan categorías, las creo, y después indexo lo que haya adentro.' +
        (cambiando ? ' Tu carpeta actual queda como está en Drive.' : '') + '</p>' +
        '<div class="acciones">' +
          '<button class="btn sec" data-accion="carpeta-cancelar">Cancelar</button>' +
          '<button class="btn prim" data-accion="carpeta-confirmar">Usar</button>' +
        '</div></div>'
    : creando
      ? '<div class="ficha">' +
          '<label class="campo"><span>Nombre de la carpeta</span>' +
            '<input name="nombre-carpeta" value="Recetario"></label>' +
          '<div class="acciones" style="margin-top:var(--e-3)">' +
            '<button class="btn sec" data-accion="carpeta-cancelar">Cancelar</button>' +
            '<button class="btn prim" data-accion="carpeta-crear-confirmado">Crear</button>' +
          '</div></div>'
      : '<div style="display:flex;flex-direction:column;gap:var(--e-2)">' +
          (enRaiz ? '' : '<button class="btn prim" data-accion="carpeta-usar">Usar esta carpeta</button>') +
          '<button class="btn sec" data-accion="carpeta-crear">Crear una carpeta nueva acá</button>' +
        '</div>';

  return encabezado({ titulo: 'Elegí la carpeta de tus recetas', volver: true }) +
    '<div class="cuerpo">' +
      encontradas +
      `<div><div class="rot">${escapar(rotulo)}</div>${lista}</div>` +
      acciones +
    '</div>';
}
