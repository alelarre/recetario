/**
 * El editor: un control por clave del frontmatter y un campo de texto por
 * sección (mockup 06). El YAML no se muestra en ningún momento.
 *
 * Lo que no es un campo de texto: la categoría, que al guardar **mueve el
 * archivo** entre carpetas de Drive (C04.2.3).
 *
 * Lo que el editor no entiende —claves y secciones desconocidas— no se muestra
 * y se conserva igual: Drive no tiene escritura parcial, así que guardar
 * reescribe el `.md` entero y lo que el editor no preservara se perdería
 * (C04.3c.1).
 */
import { escapar, imgDe } from './markdown.js';
import { encabezado, aviso, avisoAlGuardar, iconoDeTag, filaDeFotos, lateral, botonMenu } from './componentes.js';
import { ICO, ICONO_DE_DURACION } from './iconos.js';
import {
  DIFICULTADES, dificultadValida, tagReservado, TAGS_ESPECIALES, tagEspecial, tieneEspecial,
  DURACIONES, duracionValida
} from '../catalogo.js';
import { sePuedeTerminar } from '../recipe.js';
import { resolver, usosDeFotos } from '../fotos-receta.js';
import type { Receta, Entrada, FotoDeReceta } from '../tipos.js';
import type { Categoria } from '../store.js';

export interface ArgsEditor {
  receta: Receta;
  /** Sin entrada es el alta: el archivo todavía no existe en Drive. */
  entrada: Entrada | null;
  /** La carpeta elegida en el select; `''` es «Sin categoría». Sin ella sale de `entrada?.carpeta_id`. */
  carpeta?: string;
  categorias?: Pick<Categoria, 'id' | 'nombre'>[];
  tagsConocidos?: string[];
  /** El texto del aviso cuando el guardado falló. Lo escrito sigue en pantalla. */
  error?: string;
  /** Borrar es destructivo: la confirmación nombra la receta (C04.6.1). */
  confirmandoBorrado?: boolean;
  /**
   * La receta nueva es un destino del menú: el lateral, desplegado o no, y
   * cuántos borradores esperan. Sin esto, el encabezado lleva el volver.
   */
  menu?: { abierto: boolean; borradores: number };
}

/** Suelto al pie y no en una ficha: es una acción destructiva, no un campo más. */
export const botonBorrar =
  `<button class="btn pel" data-accion="borrar" type="button" style="width:100%">${ICO.tacho}Borrar receta</button>`;

/**
 * Toma el lugar del botón sin redibujar el formulario, por lo mismo que la
 * pregunta de salida: redibujarlo perdería lo que se venía escribiendo.
 */
export const confirmacionBorrado = (titulo: string | null): string =>
  '<div class="ficha" data-confirmar-borrado style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-4)">¿Borrar <b>${escapar(titulo ?? 'esta receta')}</b>?</p>` +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="cancelar-borrado" type="button">Cancelar</button>' +
      '<button class="btn pel" data-accion="borrar-confirmado" type="button">Borrar</button>' +
    '</div></div>';

/**
 * Salir con cambios pendientes pregunta antes (C04.1.1). Se inserta arriba del
 * formulario sin redibujarlo, por lo mismo que `pillTag`: redibujar perdería
 * justo lo que se está preguntando si descartar.
 */
export const confirmacionSalida =
  '<div class="ficha" data-salida style="border-color:var(--error)">' +
    '<p class="lee" style="margin:0 0 var(--e-4)">¿Salir sin guardar los cambios?</p>' +
    '<div class="acciones">' +
      '<button class="btn sec" data-accion="seguir-editando" type="button">Seguir editando</button>' +
      '<button class="btn pel" data-accion="salir-sin-guardar" type="button">Salir</button>' +
    '</div></div>';

const campo = (nombre: string, etiqueta: string, valor?: string | null, ph = ''): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<input name="${nombre}" value="${escapar(valor ?? '')}"${ph ? ` placeholder="${escapar(ph)}"` : ''}></label>`;

/**
 * Un tag del editor: una pill con su propia cruz. Se exporta porque `main`
 * agrega una sin redibujar el formulario entero —redibujarlo perdería lo que
 * el usuario venía escribiendo en los demás campos—. El ícono del especial va
 * antes del nombre, como en los chips de las demás pantallas; la cruz queda
 * al final, que es la que saca el tag.
 */
export const pillTag = (tag: string): string =>
  `<button type="button" class="chip" data-accion="tag-quitar" data-valor="${escapar(tag)}">` +
  `${iconoDeTag(tag)}${escapar(tag)}${ICO.cerrar}</button>`;

/**
 * Una foto del depósito, dibujada. Una foto nueva todavía no tiene URL —se
 * sube al guardar—: el `<img>` queda vacío y marcado con su número, y quien
 * la tenga en memoria le pone su object URL buscándolo por `data-n`.
 */
const imagenDeFoto = (f: FotoDeReceta): string =>
  f.url ? imgDe(f.url) : `<img data-n="${f.n}" alt="">`;

/**
 * Lo que se ve adentro del botón de la cabecera: la foto del depósito, la URL
 * pegada a mano, o «Sin foto». Una `foto:N` que no está en el depósito se lee
 * como ausente, igual que cualquier otro valor inválido. Se exporta porque
 * `main` la reemplaza al elegir otra portada, sin redibujar el formulario.
 */
export function muestraDePortada(foto: string | null, fotos: FotoDeReceta[]): string {
  const delDeposito = fotos.find(f => `foto:${f.n}` === foto);
  const url = resolver(foto, fotos);
  return delDeposito ? imagenDeFoto(delDeposito)
    : url === null ? '<span class="portada-vacia">Sin foto</span>'
    : imgDe(url);
}

/**
 * La cabecera dejó de ser un campo de texto: es la miniatura de lo
 * que hay hoy y abre el selector. El valor sigue viajando crudo en el
 * `hidden`, que es lo que se guarda: `foto:N` o la URL externa.
 */
function campoPortada(foto: string | null, fotos: FotoDeReceta[]): string {
  // *Portada* y no *Foto*: abajo está la ficha Fotos, que es el depósito, y
  // dos cosas distintas no se llaman igual.
  return '<div class="campo" data-portada><span>Portada</span>' +
    `<button type="button" class="portada-boton" data-accion="abrir-portada" ` +
      `aria-label="Elegir la foto de portada">${muestraDePortada(foto, fotos)}</button>` +
    `<input type="hidden" name="foto" value="${escapar(foto ?? '')}">` +
  '</div>';
}

/**
 * La ficha Fotos: el depósito entero con el número de cada una, y *Cámara*,
 * *Galería* y *Por URL* sin tope. Tocar una abre sus acciones
 * (`renderAccionesFoto`).
 *
 * El depósito viaja en el `hidden` como JSON —las nuevas con `url: ''`—: así
 * agregar, sacar o renumerar una cuenta como cambio sin guardar igual que
 * cualquier otro campo (C04.1.1), y `recetaDesdeFormulario` lo devuelve sin
 * tener que mirar a ningún lado más.
 *
 * `filaDeFotosEditor` va aparte porque `main` la redibuja sola —al agregar o
 * sacar una foto— sin tocar el resto del formulario.
 */
export const filaDeFotosEditor = (receta: Receta): string => {
  // El uso sale de la receta entera —la cabecera y todas las secciones—, no
  // del depósito: por eso esto recibe la receta y no la lista de fotos.
  const usos = usosDeFotos(receta);
  return filaDeFotos({
    fotos: receta.fotos.map(f => ({
      url: f.url, n: f.n,
      uso: usos.get(f.n) ?? { portada: false, enElTexto: false },
      ver: { accion: 'acciones-foto', etiqueta: `Qué hacer con la foto ${f.n}` }
    })),
    agregar: true,
    porUrl: true
  });
};

/** Un ícono en línea con el texto del epígrafe, no en una fila aparte. */
const enLinea = (ico: string): string => `<span class="ico-linea">${ico}</span>`;

/**
 * Qué quiere decir cada marca de la fila, debajo de ella. Es **un párrafo**
 * con los íconos adentro: la última línea corta como cualquier texto, en vez
 * de estirarse o partir una palabra como lo haría una fila de flex.
 */
const AYUDA_DE_FOTOS =
  '<p class="fotos-ayuda">' +
  `${enLinea(ICO.portada)} es la portada<br>` +
  `${enLinea(ICO.enElTexto)} está en un paso o un ingrediente<br>` +
  'Las que no tienen marca solo se ven en el carrusel de la receta: para poner una en un paso, tocá el ' +
  `${enLinea(ICO.imagen)} que aparece al costado del renglón que estás escribiendo.` +
  '</p>';

function fichaFotos(receta: Receta): string {
  return '<div class="ficha"><h2>Fotos</h2>' +
    filaDeFotosEditor(receta) +
    AYUDA_DE_FOTOS +
    `<input type="hidden" name="fotos" value="${escapar(JSON.stringify(receta.fotos))}">` +
  '</div>';
}

/**
 * El velo con el que se cierra una ficha al pie, como la hoja de Compartir:
 * tocar afuera la cierra, y por eso ninguna necesita un *Cancelar*.
 */
const VELO_DE_FICHA = '<div class="velo" data-accion="cerrar-ficha-foto"></div>';

/**
 * Lo que una foto del depósito deja hacer, al pie y sin redibujar el
 * formulario: *Ver* y *Sacar*. La portada se elige sólo desde el campo
 * Portada, así que acá no hay ninguna acción para eso.
 */
export function renderAccionesFoto(n: number): string {
  const boton = (accion: string, etiqueta: string, clase = 'sec'): string =>
    `<button class="btn ${clase}" data-accion="${accion}" data-n="${n}" type="button">${etiqueta}</button>`;
  return VELO_DE_FICHA +
    `<div class="ficha hoja-foto" data-acciones-foto data-n="${n}">` +
    `<p class="lee" style="margin:0 0 var(--e-4)">Foto ${n}</p>` +
    '<div class="acciones acciones-foto">' +
      boton('ver-foto-receta', 'Ver') +
      boton('sacar-foto-editor', 'Sacar', 'pel') +
    '</div></div>';
}

/**
 * El botón que pone una foto en la línea donde está el cursor: sin
 * texto, del alto de un renglón y colgado del marco del campo, a `altura`
 * píxeles de su borde de arriba. La línea viaja con él porque es la que había
 * cuando se lo dibujó: el cursor puede haberse ido para cuando se elige la
 * foto.
 */
export const botonPonerFoto = (seccion: string, linea: number, altura: number): string =>
  '<button type="button" class="poner-foto" data-accion="abrir-elegir-foto" ' +
  `data-seccion="${escapar(seccion)}" data-linea="${linea}" style="top:${altura}px" ` +
  `aria-label="Poner una foto en esta línea">${ICO.imagen}</button>`;

/**
 * Qué foto poner en esa línea: la galería del depósito, y nada más. **Agregar
 * una sigue siendo la ficha Fotos**: acá se elige entre las que ya están, que
 * es lo único que hace falta para seguir escribiendo el paso.
 */
export function renderElegirFoto(fotos: FotoDeReceta[], seccion: string, linea: number): string {
  const grilla = fotos.map(f =>
    '<button type="button" class="galeria-item" data-accion="poner-en" ' +
    `data-seccion="${escapar(seccion)}" data-linea="${linea}" data-n="${f.n}" ` +
    `aria-label="Poner la foto ${f.n}">${imagenDeFoto(f)}</button>`
  ).join('');
  return VELO_DE_FICHA +
    '<div class="ficha hoja-foto" data-elegir-foto>' +
    '<h2>Poner una foto</h2>' +
    `<div class="galeria">${grilla}</div></div>`;
}

/**
 * De dónde sale la cabecera: una foto del depósito o ninguna. La actual queda
 * marcada. **Acá no se agrega nada**: una foto nueva —de la cámara, de la
 * galería o de una URL— entra por la ficha Fotos, y recién después se la puede
 * poner de portada.
 *
 * Una cabecera que es una URL suelta —escrita afuera, o traída como link— se
 * dibuja igual como la actual, adelante y sin tocar: se conserva mientras no
 * se elija otra cosa (C04.2.1d).
 */
export function renderSelectorPortada(fotos: FotoDeReceta[], actual: string | null): string {
  // `resolver` devuelve una URL tal cual, y para un `foto:N` devuelve la del
  // depósito o `null`: que vuelva igual es justamente que hoy hay una URL.
  const urlSuelta = actual !== null && resolver(actual, fotos) === actual ? actual : '';
  const items =
    (urlSuelta ? `<span class="galeria-item actual">${imgDe(urlSuelta)}</span>` : '') +
    fotos.map(f =>
      '<button type="button" class="galeria-item" data-accion="elegir-portada" ' +
      `data-n="${f.n}" aria-pressed="${actual === `foto:${f.n}`}" ` +
      `aria-label="La foto ${f.n} de portada">${imagenDeFoto(f)}</button>`
    ).join('');
  return VELO_DE_FICHA +
    '<div class="ficha hoja-foto" data-selector-portada>' +
    '<h2>Foto de portada</h2>' +
    (items
      ? `<div class="galeria">${items}</div>`
      : '<p class="aviso-mudo">Subí una foto en la ficha Fotos para poder elegirla de portada.</p>') +
    '<div class="acciones">' +
      '<button class="btn sec" type="button" data-accion="sin-portada">Sin foto</button>' +
    '</div></div>';
}

/**
 * Agregar una foto por su dirección: el campo y *Traer*. La app la baja, la
 * achica y la suma como cualquier otra (C04.3d.1b). La que el sitio no deja
 * bajar entra como link, y el aviso lo dice.
 *
 * Con un aviso, la ficha se vuelve a dibujar con lo escrito adentro: lo que el
 * usuario escribió sigue en pantalla después del error (R1).
 */
export function renderFotoPorUrl(url = '', error = ''): string {
  return VELO_DE_FICHA +
    '<div class="ficha hoja-foto" data-foto-url>' +
    '<h2>Foto por URL</h2>' +
    (error ? aviso({ texto: error }) : '') +
    // Sin `autocapitalize`, el teclado del teléfono manda la primera letra en
    // mayúscula, y el esquema del link del depósito se escribe en minúsculas.
    '<label class="campo"><span>Dirección de la foto</span>' +
      `<input data-url-foto type="url" value="${escapar(url)}" placeholder="https://…" ` +
      'autocapitalize="off" autocorrect="off" spellcheck="false"></label>' +
    '<div class="acciones">' +
      '<button class="btn sec" type="button" data-accion="traer-foto-url">Traer</button>' +
    '</div></div>';
}

/**
 * Un campo de sección. El `textarea` va en un marco propio porque el botón de
 * la foto se cuelga encima de él, y con él viaja el **espejo**: un
 * calco del campo, invisible, donde `main` escribe el texto hasta el cursor
 * para leer a qué altura quedó el renglón. Un `textarea` no deja poner nada
 * adentro ni preguntar dónde está el cursor en pantalla; el espejo es la única
 * forma de saberlo sin medir el ajuste de línea a mano.
 */
const area = (
  nombre: string, etiqueta: string, valor?: string | null, filas = 4, estilo = ''
): string =>
  `<label class="campo"${estilo ? ` style="${estilo}"` : ''}><span>${escapar(etiqueta)}</span>` +
  `<div class="campo-texto" data-campo-texto="${nombre}">` +
    `<textarea name="${nombre}" rows="${filas}">${escapar(valor ?? '')}</textarea>` +
    '<div class="espejo" aria-hidden="true"><span data-antes></span><span data-marca>&#8203;</span></div>' +
  '</div></label>';

/**
 * Los cuatro tags especiales, un botón cada uno: apretado si la receta
 * lo tiene, suelto si no. `borrador` no se suelta sin lo mínimo —título,
 * categoría, ingredientes y pasos—: mientras falte, queda apretado y
 * deshabilitado, y la leyenda dice qué hace falta.
 */
function botonesEspeciales(tags: string[], puedeTerminar: boolean): string {
  const botones = TAGS_ESPECIALES.map(t => {
    const bloqueado = t === 'borrador' && !puedeTerminar;
    const apretado = bloqueado || tieneEspecial({ tags }, t);
    return `<button type="button" class="tag-esp" data-accion="tag-especial" data-valor="${escapar(t)}" ` +
      `aria-pressed="${apretado}"${bloqueado ? ' disabled' : ''}>${iconoDeTag(t)}${escapar(t)}</button>`;
  }).join('');
  return `<div class="tags-esp" role="group" aria-label="Tags especiales">${botones}</div>` +
    `<p class="aviso-mudo leyenda-borrador"${puedeTerminar ? ' hidden' : ''}>` +
    'Se va a poder sacar <i>borrador</i> cuando se cargue: título, categoría, ingredientes y pasos.</p>';
}

/**
 * La duración: cinco botones con su relojito, uno apretado a la vez.
 * Tocar el apretado lo suelta. El valor viaja en el `hidden`, que es lo que
 * lee el formulario y lo que compara «cambios sin guardar».
 */
function campoDuracion(tiempo: string | null): string {
  const actual = duracionValida(tiempo);
  const botones = DURACIONES.map(d =>
    `<button type="button" class="dur-btn" data-accion="elegir-duracion" data-valor="${escapar(d)}" aria-pressed="${d === actual}">` +
    `${ICONO_DE_DURACION[d]}${escapar(d)}</button>`).join('');
  return '<div class="campo" data-duraciones><span>Duración</span>' +
    `<div class="duraciones" role="group" aria-label="Duración">${botones}</div>` +
    `<input type="hidden" name="tiempo" value="${escapar(actual)}">` +
    '<p class="aviso-mudo">Hasta comer, con reposo y horno incluidos.</p>' +
  '</div>';
}

/**
 * La carpeta que el editor da por elegida: el id si es una categoría de la
 * lista, `''` —«Sin categoría»— si no. La raíz y `_sin-categoria/` no son
 * categorías, y una receta ahí se trata como sin categoría: queda borrador.
 */
export function carpetaDelEditor(
  carpetaId: string, categorias: readonly Pick<Categoria, 'id'>[]
): string {
  return categorias.some(c => c.id === carpetaId) ? carpetaId : '';
}

export function renderEditor(
  { receta, entrada, carpeta, categorias = [], tagsConocidos = [], error, confirmandoBorrado, menu }: ArgsEditor
): string {
  // «Sin categoría» es una opción más, elegible como cualquier otra —guardar
  // así escribe en `_sin-categoria/` (C04.3b.1)—, así que no hace falta un
  // placeholder.
  const carpetaElegida = carpetaDelEditor(carpeta ?? entrada?.carpeta_id ?? '', categorias);
  const opcionesCarpeta =
    `<option value=""${carpetaElegida === '' ? ' selected' : ''}>Sin categoría</option>` +
    [...categorias]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(c =>
        `<option value="${escapar(c.id)}"${c.id === carpetaElegida ? ' selected' : ''}>${escapar(c.nombre)}</option>`
      ).join('');

  const actual = dificultadValida(receta.dificultad);
  const opcionesDificultad = ['', ...DIFICULTADES].map(d =>
    `<option value="${escapar(d)}"${d === actual ? ' selected' : ''}>${escapar(d || '—')}</option>`).join('');

  const tags = receta.tags ?? [];

  const puede = sePuedeTerminar(receta, carpetaElegida);
  const comunes = tags.filter(t => !tagEspecial(t));
  const especiales = TAGS_ESPECIALES.filter(t =>
    (t === 'borrador' && !puede) || tieneEspecial({ tags }, t));

  // Las tres fichas llevan título: el formulario es largo, y al hacer scroll es lo
  // que dice en qué parte se está.
  const datos = '<div class="ficha"><h2>Datos</h2>' +
    campo('titulo', 'Título', receta.titulo) +
    `<label class="campo"><span>Categoría</span><select name="carpeta">${opcionesCarpeta}</select></label>` +
    // Los tags son pills que se sacan de a una, y un campo aparte para sumar.
    // El valor que viaja en el formulario es el `hidden`: el campo de agregar
    // no se llama `tags` justamente para que lo a medio escribir no se guarde.
    '<div class="campo" data-tags><span>Tags</span>' +
      botonesEspeciales(tags, puede) +
      `<div class="chips" data-pills>${comunes.map(pillTag).join('')}</div>` +
      `<input type="hidden" name="tags" value="${escapar([...especiales, ...comunes].join(', '))}">` +
      '<input data-tag-nuevo list="tags-conocidos" placeholder="Agregar tags">' +
      // Los reservados no se sugieren: no se pueden escribir a mano.
      `<datalist id="tags-conocidos">${tagsConocidos.filter(t => !tagReservado(t))
        .map(t => `<option value="${escapar(t)}">`).join('')}</datalist>` +
      '<p class="error-tag" hidden>Tag no permitido</p>' +
    '</div>' +
    campo('rinde', 'Rinde', receta.rinde) +
    campoDuracion(receta.tiempo) +
    `<label class="campo"><span>Dificultad</span><select name="dificultad">${opcionesDificultad}</select></label>` +
    campo('fuente', 'Fuente original', receta.fuente) +
  '</div>';

  // Cómo se escribe un ingrediente para que el filtro por ingrediente lo
  // encuentre y la cantidad quede en su columna (C05.1.2, C05.1.3). El editor
  // no corrige ni valida: por eso es una ayuda y no una regla.
  const FORMATO = [
    'Un ingrediente por línea, con guión:',
    '',
    '- Merluza — 800 g',
    '- Aceite — c/n',
    '- Sal, pimienta',
    '',
    'El nombre va primero y la cantidad después del separador, que puede ser',
    '— | - ; o una coma seguida de un número.',
    '',
    'Los ### arman grupos:',
    '',
    '### Para la salsa',
    '- Tomate perita — 1 lata'
  ].join('\n');

  const ayudaIngredientes =
    '<details class="esbozo">' +
      '<summary>Formato</summary>' +
      `<pre>${escapar(FORMATO)}</pre>` +
    '</details>';

  const contenido = '<div class="ficha"><h2>Contenido</h2>' +
    campoPortada(receta.foto, receta.fotos) +
    area('descripcion', 'Descripción', receta.descripcion, 3) +
    // El campo y su ayuda son un bloque: se pegan.
    area('ingredientes', 'Ingredientes', receta.ingredientes, 8, 'margin-bottom:var(--e-1)') +
    ayudaIngredientes +
    area('preparacion', 'Preparación', receta.preparacion, 6) +
    area('variaciones', 'Variaciones', receta.variaciones, 3) +
    area('notas', 'Notas', receta.notas, 3) +
  '</div>';

  // Convertir con Agente sólo mientras la receta es un borrador —con el tag
  // puesto, o bloqueado porque falta lo mínimo—: sin él no hay nada que mandar
  // a convertir. Va siempre, oculto sin el tag, para que el botón de
  // `borrador` lo muestre y lo oculte sin redibujar.
  const acciones = '<div class="acciones-editor">' +
    '<button class="btn sec" data-accion="convertir-con-agente" type="button"' +
      `${especiales.includes('borrador') ? '' : ' hidden'}>${ICO.compartir}Convertir con Agente</button>` +
    '<button class="btn prim" data-accion="guardar" type="button">Guardar</button>' +
  '</div>';

  const borrar = !entrada ? ''
    : confirmandoBorrado ? confirmacionBorrado(receta.titulo) : botonBorrar;

  const pantalla = encabezado({
    titulo: entrada ? 'Editando' : 'Nueva receta',
    ...(menu ? { izquierda: botonMenu(menu.borradores) } : { volver: true }),
    derecha: `<button class="btn prim compacto" data-accion="pegar-receta">${ICO.portapapeles}Pegar</button>`
  }) +
    // Nada acá manda el formulario: Guardar es de tipo `button`, y sin esto
    // Enter en cualquier campo de texto recargaría la página.
    '<form class="cuerpo" data-formulario onsubmit="return false">' +
      (error ? avisoAlGuardar(error) : '') +
      datos + fichaFotos(receta) + contenido + acciones + borrar +
    '</form>';
  if (!menu) return pantalla;
  // Sin destino marcado: Nueva receta es una acción, no un lugar del menú.
  return lateral({ borradores: menu.borradores, ...(menu.abierto ? { abierto: true } : {}) }) +
    `<div class="conten">${pantalla}</div>`;
}

/** Los valores crudos del formulario: cada campo es el `name` de su input. */
export type DatosFormulario = Record<string, string | undefined>;

/** El formulario que corresponde a una receta. Lo usa el redibujado tras un error. */
export function formularioDesde(receta: Receta): DatosFormulario {
  return {
    titulo: receta.titulo ?? '',
    tags: (receta.tags ?? []).join(', '),
    rinde: receta.rinde ?? '',
    tiempo: receta.tiempo ?? '',
    dificultad: receta.dificultad ?? '',
    fuente: receta.fuente ?? '',
    foto: receta.foto ?? '',
    fotos: JSON.stringify(receta.fotos),
    descripcion: receta.descripcion,
    ingredientes: receta.ingredientes,
    preparacion: receta.preparacion,
    variaciones: receta.variaciones,
    notas: receta.notas
  };
}

const esFoto = (f: unknown): f is FotoDeReceta =>
  typeof f === 'object' && f !== null &&
  typeof (f as FotoDeReceta).n === 'number' && typeof (f as FotoDeReceta).url === 'string';

/**
 * El depósito que viaja en el campo oculto. Cualquier cosa que no sea el
 * arreglo que escribió el editor —o que el campo no esté— deja el depósito de
 * la receta que se abrió: un depósito vacío significa «las saqué a todas», y
 * el store manda esas fotos a la papelera de Drive. Un JSON que no se
 * entiende no puede querer decir eso.
 */
export function fotosDesde(crudo: string, base: FotoDeReceta[]): FotoDeReceta[] {
  try {
    const leido: unknown = JSON.parse(crudo);
    if (!Array.isArray(leido)) return base;
    const fotos = leido.filter(esFoto);
    return fotos.length === leido.length ? fotos : base;
  } catch {
    return base;
  }
}

/**
 * La receta que resulta del formulario, sobre la que se leyó del `.md`.
 *
 * Lo que el editor no muestra —`extras` y `otras`— viaja en `base` y sale
 * intacto: guardar sin tocar nada tiene que producir un archivo equivalente.
 */
export function recetaDesdeFormulario(datos: DatosFormulario, base: Receta): Receta {
  const texto = (clave: string): string | null => datos[clave]?.trim() || null;

  return {
    ...base,
    titulo: texto('titulo') ?? base.titulo,
    tags: String(datos['tags'] ?? '').split(',').map(t => t.trim()).filter(Boolean),
    rinde: texto('rinde'),
    tiempo: duracionValida(datos['tiempo']) || null,
    dificultad: dificultadValida(datos['dificultad']) || null,
    fuente: texto('fuente'),
    foto: texto('foto'),
    fotos: fotosDesde(datos['fotos'] ?? '', base.fotos),
    descripcion: datos['descripcion'] ?? base.descripcion,
    ingredientes: datos['ingredientes'] ?? base.ingredientes,
    preparacion: datos['preparacion'] ?? base.preparacion,
    variaciones: datos['variaciones'] ?? base.variaciones,
    notas: datos['notas'] ?? base.notas
  };
}
