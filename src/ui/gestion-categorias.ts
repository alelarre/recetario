/**
 * La gestión de categorías (P15/P19, etapa 3a): la lista y la edición.
 *
 * Todas las categorías se tratan igual, predefinidas o no. La edición es un
 * formulario —color y foto viajan en campos ocultos— para que «salir sin
 * guardar» funcione como en el editor de recetas.
 */
import { escapar } from './markdown.js';
import { encabezado, aviso } from './componentes.js';
import { colorDeClave, urlDeFoto, fotosDelCatalogo } from './categorias.js';
import { CLAVES_COLOR } from '../categorias.js';
import type { Categoria } from '../tipos.js';

interface Valores {
  nombre: string;
  color: string;
  foto: string;
}

/** El tile de una categoría con estos valores: la miniatura de la lista y la muestra de la edición. */
export function muestraCategoria({ nombre, color, foto }: Valores, extra = ''): string {
  const imagen = urlDeFoto(foto);
  const fondo = imagen
    ? `<span class="im" style="background-image:url(${imagen})"></span>`
    : '<span class="im trama"></span>';
  return `<span class="tile muestra" style="--c:${colorDeClave(color)}"${extra}>` +
    `${fondo}<span class="nm">${escapar(nombre)}</span></span>`;
}

const recetas = (n: number): string => `${n} ${n === 1 ? 'receta' : 'recetas'}`;

export function renderListaCategorias({ categorias }: { categorias: { categoria: Categoria; recetas: number }[] }): string {
  const filas = [...categorias]
    .sort((a, b) => a.categoria.nombre.localeCompare(b.categoria.nombre, 'es'))
    .map(({ categoria, recetas: n }) =>
      `<a class="bor cat-fila" href="#/categorias/${encodeURIComponent(categoria.id)}">` +
        muestraCategoria({ nombre: '', color: categoria.color, foto: categoria.foto }) +
        `<span class="txt"><span class="n">${escapar(categoria.nombre)}</span></span>` +
        `<span class="d">${recetas(n)}</span>` +
      '</a>')
    .join('');

  return encabezado({
    titulo: 'Categorías', volver: true,
    derecha: '<a class="btn sec compacto" href="#/categorias/nueva">+ Nueva</a>'
  }) +
    `<div class="cuerpo denso"><div class="lista">${filas}</div></div>`;
}

export const botonBorrarCategoria =
  '<button class="btn pel" type="button" data-accion="borrar-categoria">Borrar categoría</button>';

/** Dice todo antes de borrar: cuántas recetas se van, cuáles, y a dónde (§3.3 del diseño). */
export function confirmacionBorrarCategoria(nombre: string, titulos: string[]): string {
  const n = titulos.length;
  const ordenados = [...titulos].sort((a, b) => a.localeCompare(b, 'es'));
  const cuales = n
    ? `<p class="lee" style="margin:0 0 var(--e-4)">${escapar(ordenados.slice(0, 3).join(', '))}` +
      `${n > 3 ? ` y ${n - 3} más` : ''}.</p>`
    : '';
  const titulo = n === 0
    ? `${nombre} va a la papelera de Drive.`
    : n === 1
      ? `${nombre} y su receta va a la papelera de Drive.`
      : `${nombre} y sus ${n} recetas van a la papelera de Drive.`;
  const explicacion = n
    ? '<p class="lee" style="margin:0 0 var(--e-2)">Dejan de verse en la app. Se pueden recuperar desde la papelera de Drive, y después hay que reindexar.</p>'
    : '';
  const boton = n ? `Borrar ${nombre} y ${recetas(n)}` : `Borrar ${nombre}`;
  return '<div class="ficha" data-confirmar-borrado-categoria style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-2)"><b>${escapar(titulo)}</b></p>` +
    explicacion + cuales +
    '<div class="acciones">' +
      '<button class="btn sec" type="button" data-accion="cancelar-borrar-categoria">Cancelar</button>' +
      `<button class="btn pel" type="button" data-accion="borrar-categoria-confirmado">${escapar(boton)}</button>` +
    '</div></div>';
}

export function renderEdicionCategoria(
  { categoria, valores, otros, error }: { categoria: Categoria | null; valores: Valores; otros: string[]; error?: string }
): string {
  const colores = CLAVES_COLOR.map(clave =>
    `<button type="button" class="muestra-color" data-accion="elegir-color" data-valor="${clave}" ` +
    `aria-pressed="${clave === valores.color}" style="background:${colorDeClave(clave)}" aria-label="${clave}"></button>`
  ).join('');

  const fotos = ['', ...fotosDelCatalogo().map(f => `catalogo:${f}`)].map(foto => {
    const imagen = urlDeFoto(foto);
    return `<button type="button" class="muestra-foto${imagen ? '' : ' trama'}" data-accion="elegir-foto" data-valor="${escapar(foto)}" ` +
      `aria-pressed="${foto === valores.foto}"${imagen ? ` style="background-image:url(${imagen})"` : ''} ` +
      `aria-label="${foto ? escapar(foto.slice('catalogo:'.length)) : 'sin foto'}"></button>`;
  }).join('');

  return encabezado({
    titulo: categoria ? categoria.nombre : 'Nueva categoría', volver: true,
    derecha: '<button class="btn prim compacto" data-accion="guardar-categoria" disabled>Guardar</button>'
  }) +
    `<form class="cuerpo" data-formulario data-otros="${escapar(JSON.stringify(otros))}" onsubmit="return false">` +
      (error ? aviso({ texto: error }) : '') +
      muestraCategoria(valores, ' data-muestra') +
      '<label class="campo"><span>Nombre</span>' +
        `<input name="nombre" value="${escapar(valores.nombre)}" autocomplete="off"></label>` +
      '<p class="aviso-mudo error-nombre" hidden></p>' +
      `<input type="hidden" name="color" value="${escapar(valores.color)}">` +
      `<input type="hidden" name="foto" value="${escapar(valores.foto)}">` +
      `<div class="ficha"><h2>Color</h2><div class="muestras">${colores}</div></div>` +
      `<div class="ficha"><h2>Foto</h2><div class="muestras fotos">${fotos}</div></div>` +
      (categoria ? botonBorrarCategoria : '') +
    '</form>';
}
