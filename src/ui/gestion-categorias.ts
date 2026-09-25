/**
 * La gestión de categorías: la lista y la edición.
 *
 * Todas las categorías se tratan igual, predefinidas o no. La edición es un
 * formulario —color y foto viajan en campos ocultos— para que «salir sin
 * guardar» funcione como en el editor de recetas.
 */
import { escapar, imgDe } from './markdown.js';
import { encabezado, aviso, tile } from './componentes.js';
import { ICO } from './iconos.js';
import { colorDeClave, urlDeFoto, fotosDelCatalogo } from './categorias.js';
import { CLAVES_COLOR } from '../categorias.js';
import type { Categoria } from '../tipos.js';

interface Valores {
  nombre: string;
  color: string;
  foto: string;
}

/**
 * El valor de la foto recién subida en el campo oculto. La foto está en
 * memoria hasta guardar la categoría, y su URL no viaja en el formulario: la
 * tiene quien la subió, y se la pasa a la pantalla aparte.
 */
export const FOTO_PROPIA = 'propia';

/** La URL de la foto elegida: la del catálogo, la propia de Drive, o la recién subida. */
const urlElegida = (foto: string, propia: string | undefined): string | null =>
  foto === FOTO_PROPIA ? propia ?? null : urlDeFoto(foto);

/**
 * El tile de una categoría con estos valores: la miniatura de la lista y la
 * muestra de la edición. Es el mismo `tile()` de la grilla, con el color y
 * la foto que se están eligiendo; `main` la redibuja entera con cada
 * elección y cada tecla del nombre.
 */
export function muestraCategoria({ nombre, color, foto }: Valores, propia?: string): string {
  return tile(nombre, { muestra: { color: colorDeClave(color), foto: urlElegida(foto, propia) } });
}

const recetas = (n: number): string => `${n} ${n === 1 ? 'receta' : 'recetas'}`;

export function renderListaCategorias({ categorias }: { categorias: { categoria: Categoria; recetas: number }[] }): string {
  const filas = [...categorias]
    .sort((a, b) => a.categoria.nombre.localeCompare(b.categoria.nombre, 'es'))
    .map(({ categoria, recetas: n }) =>
      `<a class="fila bor cat-fila" href="#/categorias/${encodeURIComponent(categoria.id)}">` +
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

/**
 * *Subir foto*, primero entre las muestras: el mismo selector del
 * sistema que las fotos de una receta, de a una. El `input` va adentro del
 * `label`, así se abre sin script; el `Blob` achicado vive en `main` hasta que
 * se guarda la categoría.
 */
const subirFoto =
  '<label class="muestra-foto subir" aria-label="Subir una foto">' +
  `${ICO.camara}<input type="file" accept="image/*" data-foto-propia hidden></label>`;

export const botonBorrarCategoria =
  '<button class="btn pel" type="button" data-accion="borrar-categoria">Borrar categoría</button>';

/** Dice todo antes de borrar: qué va a la papelera, y a dónde pasan sus recetas y cuáles son. */
export function confirmacionBorrarCategoria(nombre: string, titulos: string[]): string {
  const n = titulos.length;
  const ordenados = [...titulos].sort((a, b) => a.localeCompare(b, 'es'));
  const cuales = n
    ? `<p class="lee" style="margin:0 0 var(--e-4)">${escapar(ordenados.slice(0, 3).join(', '))}` +
      `${n > 3 ? ` y ${n - 3} más` : ''}.</p>`
    : '';
  const titulo = `${nombre} va a la papelera de Drive.`;
  const aDonde = n === 1 ? 'Su receta pasa a Borradores, sin categoría.' : `Sus ${n} recetas pasan a Borradores, sin categoría.`;
  const explicacion = n ? `<p class="lee" style="margin:0 0 var(--e-2)">${escapar(aDonde)}</p>` : '';
  const boton = `Borrar ${nombre}`;
  return '<div class="ficha" data-confirmar-borrado-categoria style="border-color:var(--error)">' +
    `<p class="lee" style="margin:0 0 var(--e-2)"><b>${escapar(titulo)}</b></p>` +
    explicacion + cuales +
    '<div class="acciones">' +
      '<button class="btn sec" type="button" data-accion="cancelar-borrar-categoria">Cancelar</button>' +
      `<button class="btn pel" type="button" data-accion="borrar-categoria-confirmado">${escapar(boton)}</button>` +
    '</div></div>';
}

/**
 * Una foto para elegir: sin URL es «sin foto», con la trama; con URL, el
 * mismo `<img>` para la del catálogo y la propia.
 */
const opcionDeFoto = (valor: string, url: string | null, elegida: boolean, etiqueta: string): string =>
  `<button type="button" class="muestra-foto ${url ? 'cuadro-foto' : 'trama'}" data-accion="elegir-foto" ` +
  `data-valor="${escapar(valor)}" aria-pressed="${elegida}" aria-label="${escapar(etiqueta)}">` +
  `${url ? imgDe(url) : ''}</button>`;

export function renderEdicionCategoria(
  { categoria, valores, otros, error, propia }: {
    categoria: Categoria | null; valores: Valores; otros: string[]; error?: string;
    /** La URL en memoria de la foto recién subida, si `valores.foto` es `FOTO_PROPIA`. */
    propia?: string;
  }
): string {
  const colores = CLAVES_COLOR.map(clave =>
    `<button type="button" class="muestra-color" data-accion="elegir-color" data-valor="${clave}" ` +
    `aria-pressed="${clave === valores.color}" style="background:${colorDeClave(clave)}" aria-label="${clave}"></button>`
  ).join('');

  const delCatalogo = ['', ...fotosDelCatalogo().map(f => `catalogo:${f}`)].map(foto =>
    opcionDeFoto(foto, urlDeFoto(foto), foto === valores.foto, foto ? foto.slice('catalogo:'.length) : 'sin foto')
  ).join('');
  // La foto propia de la categoría se elige de nuevo como cualquiera del
  // catálogo. La de Drive se pide con el token: por eso todas van con `imgDe`
  // y no con `background-image`, que no la mostraría nunca.
  const laPropia = valores.foto.startsWith('drive:') || valores.foto === FOTO_PROPIA
    ? opcionDeFoto(valores.foto, urlElegida(valores.foto, propia), true, 'la foto subida')
    : '';
  const fotos = subirFoto + laPropia + delCatalogo;

  return encabezado({
    titulo: categoria ? categoria.nombre : 'Nueva categoría', volver: true,
    derecha: '<button class="btn prim compacto" data-accion="guardar-categoria" disabled>Guardar</button>'
  }) +
    `<form class="cuerpo" data-formulario data-otros="${escapar(JSON.stringify(otros))}" onsubmit="return false">` +
      (error ? aviso({ texto: error }) : '') +
      muestraCategoria(valores, propia) +
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
