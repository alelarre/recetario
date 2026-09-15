/**
 * Las piezas de la receta en lectura que comparten la receta de la app y la
 * vista de invitado. Cada pantalla arma su encabezado, sus marcas y sus
 * acciones: lo que se sume a una no aparece en la otra salvo que se pase a propósito.
 */
import { escapar, aHtml, tramosAHtml, tramosDeFuente } from './markdown.js';
import { colorCategoria } from './categorias.js';
import { contextoDe, gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { Receta, GrupoIngredientes, TramoPreparacion } from '../tipos.js';

export const ficha = (contenido: string, titulo?: string): string =>
  contenido ? `<div class="ficha">${titulo ? `<h2>${escapar(titulo)}</h2>` : ''}${contenido}</div>` : '';

const ingredientes = (grupos: GrupoIngredientes[]): string =>
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
 * La primera ficha: foto, título, contexto, marcas, descripción y fuente.
 * Arriba, qué es y cómo se clasifica; la fuente al pie, tras un divisor: es
 * dato de procedencia y con los cuatro bloques pegados no se leía ninguno.
 */
export function fichaCabecera({ receta, categoria, marcas = '', pin = true }: OpcionesCabecera): string {
  const contexto = contextoDe(receta, categoria);
  const fuente = receta.fuente ? tramosAHtml(tramosDeFuente(receta.fuente)) : '';
  return ficha(
    (receta.foto ? `<img class="rec-foto" src="${escapar(receta.foto)}" alt="" loading="lazy">` : '') +
    `<h1 class="rec-tit">${escapar(receta.titulo ?? 'Sin título')}</h1>` +
    (contexto
      ? `<div class="rec-ctx">${categoria && pin ? `<span class="pin" style="background:${colorCategoria(categoria)}"></span>` : ''}${escapar(contexto)}</div>`
      : '') +
    marcas +
    // La descripción es de la receta, no una sección aparte: va en la misma
    // ficha, después de los datos y antes de la procedencia.
    (receta.descripcion ? `<div class="lee rec-desc">${aHtml(receta.descripcion)}</div>` : '') +
    (fuente ? `<div class="rec-fuente"><span class="emo">📖</span>fuente: ${fuente}</div>` : '')
  );
}

/** Ingredientes, Preparación, Variaciones, Notas y las secciones que la app no conoce. Ninguna vacía. */
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

  return ficha(ingredientes(grupos), 'Ingredientes') +
    ficha(preparacion(tramos), 'Preparación') +
    ficha(variaciones, 'Variaciones') +
    ficha(receta.notas ? `<div class="lee">${aHtml(receta.notas)}</div>` : '', 'Notas') +
    receta.otras.map(o => ficha(`<div class="lee">${aHtml(o.cuerpo)}</div>`, o.encabezado)).join('');
}

/** Cocinar necesita algo que cocinar: sin ingredientes ni pasos no se ofrece. */
export function botonCocinar(receta: Receta): string {
  const hay = gruposDe(receta.ingredientes).some(g => g.items.length) || tramosDe(receta.preparacion).some(t => t.pasos.length);
  return hay ? '<button class="btn prim" data-accion="cocinar">Cocinar</button>' : '';
}

export const pieDeAcciones = (botones: string): string =>
  botones ? `<div class="pie"><div class="acciones">${botones}</div></div>` : '';
