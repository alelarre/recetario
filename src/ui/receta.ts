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
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import { renderFichaCompartir } from './compartir.js';
// El logo de Drive, en el repo y no pedido a `gstatic.com`: una dependencia de
// red para 513 bytes es una dependencia de más, y así entra a `/assets/`, que es
// lo único que el service worker sirve caché-primero. Es el favicon que publica
// Google, copiado tal cual: redibujarlo de trazo lo vuelve irreconocible, que es
// lo único que el logo aporta (design-system §6.7).
import logoDrive from './drive.png';
import type { Entrada, Receta } from '../tipos.js';
import type { EstadoCompartir } from './compartir.js';

export interface OpcionesReceta {
  /** La fila del índice, para la categoría. Falta si la receta no está indexada. */
  entrada: Entrada | null;
  receta: Receta;
  /** La ficha de compartir abierta, en su estado. Sin esto no se dibuja. */
  compartir?: EstadoCompartir;
}

export function renderReceta({ entrada, receta, compartir }: OpcionesReceta): string {
  const categoria = entrada?.categoria ?? '';
  // El estado es un chip más de la fila de tags, y va primero: es lo que hay que
  // ver al mirar la receta. Como chip hereda el ancho, el alto y el aire de los
  // demás — suelto debajo se montaba sobre ellos (C03.1.3). Lo que dice el `.md`, sin calcular nada.
  const marca = receta.completa ? '' :
    '<button class="chip pend" data-accion="editar" aria-label="Incompleta: abrir el editor">' +
      '<span class="inc"></span>Incompleta</button>';
  const marcas = marca || receta.tags.length
    ? '<div class="chips">' + marca +
      receta.tags.map(t => `<button class="chip" data-tag="${escapar(t)}">${escapar(t)}</button>`).join('') +
      '</div>'
    : '';

  // El `.md` en Drive, en una pestaña nueva. Sólo si la receta está en el
  // índice: sin fila no se conoce su id de archivo.
  const alArchivo = entrada?.id_archivo
    ? `<a class="archivo" href="https://drive.google.com/file/d/${encodeURIComponent(entrada.id_archivo)}/view" ` +
      'target="_blank" rel="noopener" aria-label="Ver el archivo en Drive">' +
      `<img class="logo" src="${escapar(logoDrive)}" ` +
      // Sin `lazy`: son 513 bytes y está en pantalla desde el primer momento.
      'alt="" width="16" height="16">.md</a>'
    : '';

  // El encabezado arranca sin texto: el título está abajo, grande y entero, y
  // repetirlo arriba —o poner la categoría, que ya está en el contexto— era
  // decir dos veces lo mismo. `main` le pone el título recortado cuando el
  // grande sale de pantalla, y ahí se corta antes de llegar al link.
  // Sin menú de ⋯: las acciones son Cocinar y Editar, y las dos están al pie.
  const botonCompartir = `<button class="ico" data-accion="compartir" aria-label="Compartir">${ICO.compartir}</button>`;
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: botonCompartir + alArchivo }) +
    '<div class="cuerpo">' + fichaCabecera({ receta, categoria, marcas }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`) +
    (compartir ? renderFichaCompartir(compartir) : '');
}
