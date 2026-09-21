/**
 * Las piezas de la receta en lectura que comparten la receta de la app y la
 * vista de invitado. Cada pantalla arma su encabezado, sus marcas y sus
 * acciones: lo que se sume a una no aparece en la otra salvo que se pase a propósito.
 */
import { escapar, aHtml, tramosAHtml, tramosDeFuente, imgDe } from './markdown.js';
import { colorCategoria } from './categorias.js';
import { duracionConReloj } from './componentes.js';
import { gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { Receta, GrupoIngredientes, TramoPreparacion, FotoDeReceta } from '../tipos.js';

export const ficha = (contenido: string, titulo?: string): string =>
  contenido ? `<div class="ficha">${titulo ? `<h2>${escapar(titulo)}</h2>` : ''}${contenido}</div>` : '';

/** La lista de ingredientes, con sus grupos. La misma en la receta y en el modo cocina. */
export const listaIngredientes = (grupos: GrupoIngredientes[]): string =>
  grupos.map(g =>
    (g.nombre ? `<div class="grupo">${escapar(g.nombre)}</div>` : '') +
    g.items.map(i =>
      `<div class="ing"><span class="n">${escapar(i.nombre)}</span>` +
      (i.cantidad ? `<span class="c">${escapar(i.cantidad)}</span>` : '') +
      '</div>').join('')
  ).join('');

const preparacion = (tramos: TramoPreparacion[]): string =>
  tramos.map(t =>
    (t.nombre ? `<div class="tramo">${escapar(t.nombre)}</div>` : '') +
    // La numeración vuelve a empezar en cada tramo: son pasos de otra cosa.
    `<ol class="pasos">${t.pasos.map(p => `<li>${aHtml(p)}</li>`).join('')}</ol>`
  ).join('');

export interface OpcionesCabecera {
  receta: Receta;
  categoria: string;
  /** Lo que va entre el contexto y la descripción. La receta pone ahí los tags y la marca de incompleta. */
  marcas?: string;
  /**
   * El pin de color junto a la categoría. El color es de la carpeta del dueño:
   * el invitado no lo conoce, y sin él saldría el neutro, que se lee como `Otros`.
   */
  pin?: boolean;
}

/**
 * La foto de la cabecera, tocable: abre el visor. Si es una del depósito
 * lleva `data-n`, para que Tarea 8 sepa en qué foto abrirlo y deslizar entre
 * las demás; una cabecera externa que no está en el depósito se abre sola,
 * sin ese número (spec §7).
 */
function botonFoto(url: string, n: number | undefined): string {
  return `<button type="button" class="rec-foto-boton" data-accion="ver-foto-receta"` +
    (n !== undefined ? ` data-n="${n}"` : '') +
    ` aria-label="Ver la foto">${imgDe(url, 'rec-foto')}</button>`;
}

/**
 * La primera ficha: foto, título, contexto, marcas, descripción y fuente.
 * Arriba, qué es y cómo se clasifica; la fuente al pie, tras un divisor: es
 * dato de procedencia y con los cuatro bloques pegados no se leía ninguno.
 * Recibe la receta ya resuelta (`resolverReceta`): `receta.foto` es una URL,
 * nunca `foto:N`, y `receta.fotos` es el depósito para saber su número.
 */
export function fichaCabecera({ receta, categoria, marcas = '', pin = true }: OpcionesCabecera): string {
  const partes = [escapar(categoria), escapar(receta.rinde ?? ''), duracionConReloj(receta.tiempo), escapar(receta.dificultad ?? '')]
    .filter(Boolean);
  const fuente = receta.fuente ? tramosAHtml(tramosDeFuente(receta.fuente)) : '';
  return ficha(
    (receta.foto ? botonFoto(receta.foto, receta.fotos.find(f => f.url === receta.foto)?.n) : '') +
    `<h1 class="rec-tit">${escapar(receta.titulo ?? 'Sin título')}</h1>` +
    (partes.length
      ? `<div class="rec-ctx">${categoria && pin ? `<span class="pin" style="background:${colorCategoria(categoria)}"></span>` : ''}<span class="ctx-txt">${partes.join(' · ')}</span></div>`
      : '') +
    marcas +
    // La descripción es de la receta, no una sección aparte: va en la misma
    // ficha, después de los datos y antes de la procedencia.
    (receta.descripcion ? `<div class="lee rec-desc">${aHtml(receta.descripcion)}</div>` : '') +
    (fuente ? `<div class="rec-fuente"><span class="emo">📖</span>fuente: ${fuente}</div>` : '')
  );
}

/**
 * La grilla del depósito entero, en su orden, cuadradas y de a tres por fila
 * (spec §7). Cada una abre el visor en su foto, con `data-n` su número.
 */
function galeria(fotos: FotoDeReceta[]): string {
  if (!fotos.length) return '';
  return `<div class="galeria">${fotos.map((f, i) =>
    `<button type="button" class="galeria-item" data-accion="ver-foto-receta" data-n="${f.n}" ` +
    `aria-label="Ver la foto ${i + 1}">${imgDe(f.url)}</button>`
  ).join('')}</div>`;
}

/**
 * Ingredientes, Preparación, Variaciones, Notas, Fotos y las secciones que la
 * app no conoce. Ninguna vacía; Fotos, además, sólo si hay depósito. Recibe
 * la receta ya resuelta: las referencias en línea ya son URLs, y `.fotos`
 * sigue siendo el depósito para la grilla.
 */
export function fichasDelCuerpo(receta: Receta): string {
  const grupos = gruposDe(receta.ingredientes).filter(g => g.items.length);
  const tramos = tramosDe(receta.preparacion).filter(t => t.pasos.length);
  const { lista, secciones } = variacionesDe(receta.variaciones);
  const variaciones = secciones.length
    ? secciones.map(v =>
        `<div class="var"><h3>${escapar(v.nombre)}</h3>` +
        (v.fuente ? `<div class="f">${escapar(v.fuente)}</div>` : '') +
        `<p>${aHtml(v.cuerpo)}</p></div>`).join('')
    : lista.map(v => `<div class="var"><p>${aHtml(v)}</p></div>`).join('');

  return ficha(listaIngredientes(grupos), 'Ingredientes') +
    ficha(preparacion(tramos), 'Preparación') +
    ficha(variaciones, 'Variaciones') +
    ficha(receta.notas ? `<div class="lee">${aHtml(receta.notas)}</div>` : '', 'Notas') +
    ficha(galeria(receta.fotos), 'Fotos') +
    receta.otras.map(o => ficha(`<div class="lee">${aHtml(o.cuerpo)}</div>`, o.encabezado)).join('');
}

/** Cocinar necesita algo que cocinar: sin ingredientes ni pasos no se ofrece. */
export function botonCocinar(receta: Receta): string {
  const hay = gruposDe(receta.ingredientes).some(g => g.items.length) || tramosDe(receta.preparacion).some(t => t.pasos.length);
  return hay ? '<button class="btn prim" data-accion="cocinar">Cocinar</button>' : '';
}

export const pieDeAcciones = (botones: string): string =>
  botones ? `<div class="pie"><div class="acciones">${botones}</div></div>` : '';
