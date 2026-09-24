/**
 * La receta entera, en una columna (mockup 01).
 *
 * Sin pestañas: costaban cuatro toques para leerla y escondían las notas y las
 * variaciones justo cuando se cocina. El conmutador existe sólo dentro del modo
 * cocina, que es donde esas dos secciones no se usan.
 *
 * Una pila de `.ficha`: la primera con la foto —si la hay—, el título, el
 * contexto, la fuente y los tags; después una por sección, y ninguna vacía.
 */
import { escapar } from './markdown.js';
import { encabezado, chipsSueltos, aviso } from './componentes.js';
import type { OpcionesAviso } from './componentes.js';
import { ICO } from './iconos.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import { renderFichaCompartir } from './compartir.js';
import { renderVisor } from './visor.js';
import { esFavorita, tagEspecial } from '../catalogo.js';
import { fotosSinUso, resolverReceta } from '../fotos-receta.js';
// El logo de Drive, en el repo y no pedido a `gstatic.com`: una dependencia de
// red para 513 bytes es una dependencia de más, y así entra a `/assets/`, que es
// lo único que el service worker sirve caché-primero. Es el favicon que publica
// Google, copiado tal cual: redibujarlo de trazo lo vuelve irreconocible, que es
// lo único que el logo aporta (design-system §6.7).
import logoDrive from './drive.png';
import type { Entrada, Receta } from '../tipos.js';
import type { EstadoCompartir } from './compartir.js';
import type { EstadoVisor } from './visor.js';

export interface OpcionesReceta {
  /** La fila del índice, para la categoría. Falta si la receta no está indexada. */
  entrada: Entrada | null;
  receta: Receta;
  /** La ficha de compartir abierta, en su estado. Sin esto no se dibuja. */
  compartir?: EstadoCompartir;
  /** Qué está pasando con la estrella: nada, o una escritura en curso. */
  favorito?: 'escribiendo';
  /** Lo último que falló al marcar favorito. Se dibuja arriba de la ficha. */
  error?: string;
  /** Un aviso que trae la receta la pantalla de la que se llegó, con su acción si la tiene. Va arriba de la ficha. */
  aviso?: OpcionesAviso;
  /** El visor de fotos abierto, en su foto actual. Sin esto no se dibuja. */
  visor?: EstadoVisor;
}

/**
 * La estrella del encabezado: pone y saca el tag `favorito`. Son dos
 * estrellas superpuestas —el contorno y la llena—, y mientras Drive contesta
 * la llena se descubre de izquierda a derecha, en loop. El resultado se dibuja
 * recién con la respuesta: la app no adivina lo que todavía no se escribió.
 */
function botonFavorito(receta: Receta, escribiendo: boolean): string {
  const puesta = esFavorita(receta);
  const clase = escribiendo ? 'fav cargando' : puesta ? 'fav on' : 'fav';
  // El `title` dice lo mismo que el `aria-label`, y cambia con el estado: en
  // la computadora es el globito que explica el ícono.
  const que = puesta ? 'Sacar de favoritos' : 'Marcar como favorita';
  return `<button class="ico" data-accion="favorito" aria-label="Favorito" title="${que}" ` +
    `aria-pressed="${puesta}"${escribiendo ? ' disabled' : ''}>` +
    `<span class="${clase}">${ICO.estrella}${ICO.estrella}</span></button>`;
}

export function renderReceta(
  { entrada, receta: sinResolver, compartir, favorito, error, aviso: avisoDeLlegada, visor }: OpcionesReceta
): string {
  // La cabecera y el cuerpo sólo ven la receta resuelta: ni `fichaCabecera`
  // ni `fichasDelCuerpo` saben de `foto:N`, eso es cosa de acá.
  const receta = resolverReceta(sinResolver);
  // El uso se calcula antes de resolver: después ya no hay ninguna `foto:N`
  // que buscar, ni en la cabecera ni en el texto.
  const carrusel = fotosSinUso(sinResolver);
  const categoria = entrada?.categoria ?? '';
  // Los tags, con los especiales primero y con su ícono. Borrador es uno
  // más: su chip abre el editor. Favorito no va: ya lo dice la estrella del
  // encabezado, y un chip igual parecía otro control para marcarla.
  const tags = receta.tags.filter(t => tagEspecial(t) !== 'favorito');
  const marcas = tags.length ? `<div class="chips">${chipsSueltos(tags)}</div>` : '';

  // El `.md` en Drive, en una pestaña nueva. Sólo si la receta está en el
  // índice: sin fila no se conoce su id de archivo.
  const alArchivo = entrada?.id_archivo
    ? `<a class="archivo" href="https://drive.google.com/file/d/${encodeURIComponent(entrada.id_archivo)}/view" ` +
      'target="_blank" rel="noopener" aria-label="Ver el archivo en Drive" ' +
      'title="Ver el archivo en Drive">' +
      `<img class="logo" src="${escapar(logoDrive)}" ` +
      // Sin `lazy`: son 513 bytes y está en pantalla desde el primer momento.
      'alt="" width="16" height="16">.md</a>'
    : '';

  // El encabezado arranca sin texto: el título está abajo, grande y entero, y
  // repetirlo arriba —o poner la categoría, que ya está en el contexto— era
  // decir dos veces lo mismo. `main` le pone el título recortado cuando el
  // grande sale de pantalla, y ahí se corta antes de llegar al link.
  const botonCompartir =
    `<button class="ico" data-accion="compartir" aria-label="Compartir" title="Compartir">${ICO.compartir}</button>`;
  const estrella = botonFavorito(receta, favorito === 'escribiendo');
  return encabezado({ titulo: '', volver: true, pegajoso: true, derecha: estrella + botonCompartir + alArchivo }) +
    '<div class="cuerpo">' +
      (avisoDeLlegada ? aviso(avisoDeLlegada) : '') +
      (error ? aviso({ texto: error, accion: { etiqueta: 'Reintentar', accion: 'favorito' } }) : '') +
      fichaCabecera({ receta, categoria, marcas, carrusel }) + fichasDelCuerpo(receta) +
    '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`) +
    (compartir ? renderFichaCompartir(compartir) : '') +
    (visor ? renderVisor(visor) : '');
}
