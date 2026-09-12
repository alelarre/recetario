/**
 * La receta entera, en una columna (mockup 01).
 *
 * Sin pestañas: costaban cuatro toques para leerla y escondían las notas y las
 * variaciones justo cuando se cocina. El conmutador vuelve, pero solo dentro
 * del modo cocina, que es donde esas dos secciones no se usan.
 *
 * Una pila de `.ficha`: la primera con la foto —si la hay—, el título, el
 * contexto, la fuente y los tags; después una por sección, y ninguna vacía.
 */
import { escapar, aHtml, esDestinoSeguro } from './markdown.js';
import { encabezado } from './componentes.js';
import { colorCategoria } from './categorias.js';
import { ICO } from './iconos.js';
import { gruposDe, tramosDe, variacionesDe, estaCompleta } from '../recipe.js';
import type { Entrada, Receta, GrupoIngredientes, TramoPreparacion } from '../tipos.js';

export interface OpcionesReceta {
  /** La fila del índice, para la categoría. Falta si la receta no está indexada. */
  entrada: Entrada | null;
  receta: Receta;
}

/**
 * La fuente es texto libre: puede ser una URL pelada, un link markdown, o
 * «libro de pescados, pág. 84». Las dos primeras se dibujan clickeables; de la
 * URL pelada se muestra el sitio y no el esquema, que no informa nada.
 */
function fuenteHtml(fuente: string): string {
  // El parser del frontmatter deja el valor tal cual, comillas incluidas: se
  // sacan acá para mirar qué hay adentro.
  const limpia = fuente.trim().replace(/^["'](.*)["']$/, '$1').trim();
  const md = limpia.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (md?.[1] && md[2] && esDestinoSeguro(md[2])) {
    return `<a href="${escapar(md[2])}" target="_blank" rel="noopener">${escapar(md[1])}</a>`;
  }
  if (/^https?:\/\/\S+$/i.test(limpia)) {
    return `<a href="${escapar(limpia)}" target="_blank" rel="noopener">` +
      `${escapar(limpia.replace(/^https?:\/\//i, ''))}</a>`;
  }
  return escapar(limpia);
}

const ficha = (contenido: string, titulo?: string): string =>
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

export function renderReceta({ entrada, receta }: OpcionesReceta): string {
  const categoria = entrada?.categoria ?? '';
  const grupos = gruposDe(receta.ingredientes).filter(g => g.items.length);
  const tramos = tramosDe(receta.preparacion).filter(t => t.pasos.length);
  const { lista, secciones } = variacionesDe(receta.variaciones);
  const completa = estaCompleta(receta);

  const contexto = [categoria, receta.rinde, receta.tiempo, receta.dificultad].filter(Boolean).join(' · ');
  const marca = completa ? '' :
    '<button class="inc-txt" data-accion="editar"><span class="inc"></span>Falta terminarla</button>';

  // Arriba, qué es y cómo se clasifica; la fuente al pie, tras un divisor: es
  // dato de procedencia y con los cuatro bloques pegados no se leía ninguno.
  const cabecera =
    (receta.foto ? `<img class="rec-foto" src="${escapar(receta.foto)}" alt="" loading="lazy">` : '') +
    `<h1 class="rec-tit">${escapar(receta.titulo ?? 'Sin título')}</h1>` +
    (contexto
      ? `<div class="rec-ctx">${categoria ? `<span class="pin" style="background:${colorCategoria(categoria)}"></span>` : ''}${escapar(contexto)}</div>`
      : '') +
    (receta.tags.length
      ? '<div class="chips">' +
        receta.tags.map(t => `<button class="chip" data-tag="${escapar(t)}">${escapar(t)}</button>`).join('') +
        '</div>'
      : '') +
    // La descripción es de la receta, no una sección aparte: va en la misma
    // ficha, después de los datos y antes de la procedencia.
    (receta.descripcion ? `<div class="lee rec-desc">${aHtml(receta.descripcion)}</div>` : '') +
    marca +
    (receta.fuente
      ? `<div class="rec-fuente"><span class="emo">📖</span>fuente: ${fuenteHtml(receta.fuente)}</div>`
      : '');

  const variaciones = secciones.length
    ? secciones.map(v =>
        `<div class="var"><h3>${escapar(v.nombre)}</h3>` +
        (v.fuente ? `<div class="f">${escapar(v.fuente)}</div>` : '') +
        `<p>${aHtml(v.cuerpo)}</p></div>`).join('')
    : lista.map(v => `<div class="var"><p>${aHtml(v)}</p></div>`).join('');

  const otras = receta.otras.map(o => ficha(`<div class="lee">${aHtml(o.cuerpo)}</div>`, o.encabezado)).join('');

  // Cocinar necesita algo que cocinar: sin ingredientes ni pasos no se ofrece.
  const cocinar = grupos.length || tramos.length
    ? '<button class="btn prim" data-accion="cocinar">Cocinar</button>'
    : '';

  // El encabezado arranca sin texto: el título está abajo, grande y entero, y
  // repetirlo arriba —o poner la categoría, que ya está en el contexto— era
  // decir dos veces lo mismo. `main` le pone el título recortado cuando el
  // grande sale de pantalla.
  // Sin menú de ⋯: las acciones son Cocinar y Editar, y las dos están al pie.
  return encabezado({ titulo: '', volver: true, pegajoso: true }) +
    '<div class="cuerpo">' +
      ficha(cabecera) +
      ficha(ingredientes(grupos), 'Ingredientes') +
      ficha(preparacion(tramos), 'Preparación') +
      ficha(variaciones, 'Variaciones') +
      ficha(receta.notas ? `<div class="lee">${aHtml(receta.notas)}</div>` : '', 'Notas') +
      otras +
    '</div>' +
    '<div class="pie"><div class="acciones">' +
      cocinar +
      `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>` +
    '</div></div>';
}
