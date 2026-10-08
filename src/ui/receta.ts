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
import { escalarCantidad, porcionesDe, restoDelRinde, MULTIPLICADORES } from '../escalar.js';
import { escapar } from './markdown.js';
import { encabezado, chipsSueltos, aviso } from './componentes.js';
import type { OpcionesAviso } from './componentes.js';
import { ICO } from './iconos.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones, listaIngredientes, tituloIngredientes, textoFactor } from './fichas-receta.js';
import { gruposDe } from '../recipe.js';
import { renderFichaCompartir } from './compartir.js';
import { renderVisor } from './visor.js';
import { esFavorita, ESPECIALES } from '../catalogo.js';
import type { Herramienta } from '../especiales.js';
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
  /** El multiplicador elegido: escala las cantidades y el rinde que se muestran. Sin él, ×1. */
  factor?: number;
  /** La fila de los multiplicadores, abierta con el botón «Más o menos». Sin esto, cerrada. */
  escalaAbierta?: boolean;
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

const TEXTO_CALCULAR: Record<Herramienta, string> = { pan: 'Calcular pan', fermentados: 'Calcular sal' };

/**
 * Un botón por cada especial de la receta que abre una calculadora. La
 * calculadora no lee la receta: abre con las últimas elecciones.
 */
function botonesCalcular(receta: Receta): string {
  const botones = ESPECIALES
    .filter(d => d.herramienta && receta.tags_especiales.includes(d.nombre))
    .map(d => d.herramienta ? `<a class="btn sec" href="#/herramientas/${d.herramienta}">${TEXTO_CALCULAR[d.herramienta]}</a>` : '')
    .join('');
  return botones ? `<div class="calcular">${botones}</div>` : '';
}

/** Los chips del multiplicador, marcados si el elegido es uno de ellos. */
export const chipsEscala = (factor: number): string =>
  MULTIPLICADORES.map(m =>
    `<button type="button" class="chip${m === factor ? ' act' : ''}" data-accion="escalar" data-factor="${m}">×${m === 0.5 ? '½' : m}</button>`).join('');

/** «Los pasos no cambian…», sólo con un multiplicador distinto de ×1. */
export const avisoEscala = (factor: number): string =>
  (factor === 1 ? '' : 'Los pasos no cambian: sus cantidades son las de la receta.');

/**
 * El botón que abre y cierra la fila de los multiplicadores. Cerrado con un
 * multiplicador distinto de ×1 va en acento y lo dice al lado del ±: sin
 * abrir la fila se ve que lo que se lee no es la receta como está escrita.
 */
export function botonMasOMenos(factor: number, abierta: boolean): string {
  const puesto = !abierta && factor !== 1;
  return `<button type="button" class="mas-o-menos${puesto ? ' puesto' : ''}" data-accion="mas-o-menos" data-escala-boton ` +
    `aria-expanded="${abierta}" aria-label="Más o menos" title="Más o menos">` +
    `${ICO.masMenos}${puesto ? `<span class="fac">${textoFactor(factor)}</span>` : ''}</button>`;
}

const filaDeChips = (factor: number): string => `<div class="chips escala-chips" data-escala-chips>${chipsEscala(factor)}</div>`;

/**
 * Lo que cambia con el multiplicador, bloque por bloque y por su atributo:
 * escribir en el campo del rinde los repinta sin redibujar la pantalla.
 */
export function bloquesEscala(sinResolver: Receta, factor: number, abierta: boolean): [string, string][] {
  const receta = resolverReceta(sinResolver);
  const grupos = gruposDe(receta.ingredientes).filter(g => g.items.length);
  return [
    ['data-ingredientes', `<div data-ingredientes>${listaIngredientes(grupos, factor)}</div>`],
    ['data-titulo-ingredientes', `<span data-titulo-ingredientes>${escapar(tituloIngredientes(factor))}</span>`],
    ['data-escala-boton', botonMasOMenos(factor, abierta)],
    ['data-escala-chips', filaDeChips(factor)],
    ['data-escala-aviso', `<p class="aviso-escala" data-escala-aviso>${avisoEscala(factor)}</p>`],
    ['data-rinde', `<span data-rinde>${escapar(receta.rinde ? escalarCantidad(receta.rinde, factor) : '')}</span>`]
  ];
}

/**
 * Arriba de los ingredientes, sólo si el rinde empieza con un número: un
 * campo con ese número escalado y el resto del rinde al lado, para elegir el
 * multiplicador por lo que se quiere que rinda, y a la derecha el botón que
 * abre debajo los chips ×½, ×1, ×2 y ×3. Sin número en el rinde no hay nada
 * que escalar a la vista y no se ofrece. El botón, los chips y el aviso van en
 * sus bloques: escribir en el campo los repinta sin tocarlo.
 */
function controlesEscala(factor: number, rinde: string | null, abierta: boolean): string {
  const porciones = porcionesDe(rinde);
  if (porciones === null || !rinde) return '';
  const campo =
    `<label class="escala-rinde"><input type="number" inputmode="decimal" min="0" step="any" data-porciones aria-label="Rinde" ` +
    `value="${Math.round(porciones * factor * 100) / 100}"> <span class="resto">${escapar(restoDelRinde(rinde))}</span></label>`;
  return `<div class="escala">${campo}${botonMasOMenos(factor, abierta)}</div>` +
    (abierta ? filaDeChips(factor) : '') +
    `<p class="aviso-escala" data-escala-aviso>${avisoEscala(factor)}</p>`;
}

export function renderReceta(
  { entrada, receta: sinResolver, compartir, favorito, error, aviso: avisoDeLlegada, visor, factor = 1, escalaAbierta = false }: OpcionesReceta
): string {
  // La cabecera y el cuerpo sólo ven la receta resuelta: ni `fichaCabecera`
  // ni `fichasDelCuerpo` saben de `foto:N`, eso es cosa de acá.
  const receta = resolverReceta(sinResolver);
  // El uso se calcula antes de resolver: después ya no hay ninguna `foto:N`
  // que buscar, ni en la cabecera ni en el texto.
  const carrusel = fotosSinUso(sinResolver);
  const categoria = entrada?.categoria ?? '';
  // Los tags, con los especiales primero y con su ícono. Favorito no va: ya
  // lo dice la estrella del encabezado, y un chip igual parecía otro control
  // para marcarla.
  const chips = chipsSueltos(receta.tags, receta.tags_especiales.filter(t => t !== 'favorito'));
  const marcas = chips ? `<div class="chips">${chips}</div>` : '';

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
  return encabezado({ titulo: '', volver: true, derecha: estrella + botonCompartir + alArchivo }) +
    '<div class="cuerpo">' +
      (avisoDeLlegada ? aviso(avisoDeLlegada) : '') +
      // Sin control: se reintenta con la estrella, que sigue a la vista (R1).
      (error ? aviso({ texto: error }) : '') +
      fichaCabecera({ receta: { ...receta, rinde: receta.rinde ? escalarCantidad(receta.rinde, factor) : null }, categoria, marcas, carrusel }) +
      fichasDelCuerpo(receta, { alPieDeIngredientes: botonesCalcular(receta), antesDeIngredientes: controlesEscala(factor, receta.rinde, escalaAbierta), factor }) +
    '</div>' +
    pieDeAcciones(botonCocinar(receta) + `<button class="btn sec" data-accion="editar">${ICO.lapiz}Editar</button>`) +
    (compartir ? renderFichaCompartir(compartir) : '') +
    (visor ? renderVisor(visor) : '');
}
