/**
 * *Temporizadores*: la pantalla —los temporizadores y cronómetros que corren y
 * el temporizador nuevo— y la tira al pie que los muestra desde cualquier otra pantalla. Sólo
 * dibujan el estado del control; los tiempos llevan marcas (`data-tiempo`,
 * `data-avance`, `data-rueda-valor`) para que `main` los escriba cada segundo
 * sin redibujar, que perdería el nombre que se está escribiendo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import type { EstadoTemporizadores } from '../temporizadores-control.js';
import {
  type Temporizador, type Duracion, type Rueda, type EnLista, type CronoConNombre, type TipoNuevo, esCrono,
  corriendo, restante, terminado, avance, transcurrido, cronoCorriendo, formatear, aMs
} from '../temporizadores.js';

/** El alto de la tira, en px; `base.css` lo repite y `--tira` lo lleva a los pies pegados. */
export const ALTO_TIRA = 56;

const dos = (n: number): string => String(n).padStart(2, '0');

const cuadrado = (accion: string, id: string, etiqueta: string, contenido: string): string =>
  `<button class="btn sec cuadrado" type="button" data-accion="${accion}" data-id="${escapar(id)}" aria-label="${etiqueta}">${contenido}</button>`;

function fichaTemporizador(c: Temporizador, ahora: number): string {
  const falta = restante(c, ahora);
  const lista = terminado(c, ahora);
  const tiempo = lista
    ? '<span class="tiempo listo">¡Listo!</span>'
    : `<span class="tiempo${corriendo(c) ? '' : ' pausado'}" data-tiempo="${escapar(c.id)}">${formatear(falta)}</span>`;
  const mas = cuadrado('temporizador-sumar', c.id, 'Un minuto más', "+1'");
  const botones = lista
    ? mas + `<button class="btn prim" type="button" data-accion="temporizador-sacar" data-id="${escapar(c.id)}">Parar</button>`
    : mas +
      (corriendo(c) ? cuadrado('temporizador-pausar', c.id, 'Pausar', ICO.pausa) : cuadrado('temporizador-seguir', c.id, 'Seguir', ICO.play)) +
      cuadrado('temporizador-sacar', c.id, 'Sacar', ICO.cerrar);
  const barra = lista ? ''
    : `<div class="barra"><i data-avance="${escapar(c.id)}" style="width:${Math.round(avance(c, ahora) * 100)}%"></i></div>`;
  return `<div class="ficha temporizador" data-temporizador="${escapar(c.id)}">` +
    `<div class="temporizador-fila"><span class="nom">${ICO.reloj}${escapar(c.nombre)}</span>${tiempo}<div class="acciones-temporizador">${botones}</div></div>` +
    barra + '</div>';
}

/** Un cronómetro: el tiempo que sube, pausa o seguir, y sacar (C07.5b.1). */
function fichaCronoConNombre(c: CronoConNombre, ahora: number): string {
  const andando = cronoCorriendo(c);
  return `<div class="ficha temporizador" data-temporizador="${escapar(c.id)}">` +
    `<div class="temporizador-fila"><span class="nom">${ICO.cronometro}${escapar(c.nombre)}</span>` +
    `<span class="tiempo${andando ? '' : ' pausado'}" data-tiempo="${escapar(c.id)}">${formatear(transcurrido(c, ahora))}</span>` +
    '<div class="acciones-temporizador">' +
      (andando ? cuadrado('temporizador-pausar', c.id, 'Pausar', ICO.pausa) : cuadrado('temporizador-seguir', c.id, 'Seguir', ICO.play)) +
      cuadrado('temporizador-sacar', c.id, 'Sacar', ICO.cerrar) +
    '</div></div></div>';
}

const fichaDeLista = (x: EnLista, ahora: number): string =>
  esCrono(x) ? fichaCronoConNombre(x, ahora) : fichaTemporizador(x, ahora);

const terminadoEnLista = (t: EnLista, ahora: number): boolean => !esCrono(t) && terminado(t, ahora);

const tiempoEnLista = (t: EnLista, ahora: number): string =>
  formatear(esCrono(t) ? transcurrido(t, ahora) : restante(t, ahora));

const ETIQUETA: Record<Rueda, string> = { h: 'horas', m: 'min', s: 'seg' };

/** Las acciones y la marca de una rueda: las de Temporizadores, o las de otra pantalla que las use. */
export interface AccionesDeRueda { mas: string; menos: string; marca: string }
const RUEDA_DE_TEMPORIZADORES: AccionesDeRueda = { mas: 'rueda-mas', menos: 'rueda-menos', marca: 'data-rueda-valor' };

export function rueda(r: Rueda, ruedas: Duracion, a: AccionesDeRueda = RUEDA_DE_TEMPORIZADORES): string {
  const valor = r === 'h' ? String(ruedas.h) : dos(ruedas[r]);
  return `<div class="rueda"><span class="lbl">${ETIQUETA[r]}</span><div class="caja">` +
    `<button type="button" data-accion="${a.mas}" data-rueda="${r}" aria-label="Más ${ETIQUETA[r]}">${ICO.arriba}</button>` +
    `<span class="val" ${a.marca}="${r}">${valor}</span>` +
    `<button type="button" data-accion="${a.menos}" data-rueda="${r}" aria-label="Menos ${ETIQUETA[r]}">${ICO.abajo}</button>` +
    '</div></div>';
}

const TIPOS: readonly [TipoNuevo, string][] = [['cuenta', 'Cuenta regresiva'], ['crono', 'Cronómetro']];

/**
 * El temporizador nuevo: qué es —cuenta regresiva o cronómetro—, el nombre y,
 * para una cuenta, las ruedas. *Empezar* lo suma a la lista corriendo; una
 * cuenta en 0:00:00 no empieza.
 */
function fichaNuevo(tipo: TipoNuevo, ruedas: Duracion, nombre: string): string {
  const tipos = TIPOS.map(([valor, texto]) =>
    `<button type="button" data-accion="temporizador-tipo" data-valor="${valor}" aria-pressed="${valor === tipo}">${texto}</button>`).join('');
  const cuenta = tipo === 'cuenta';
  return '<div class="ficha nuevo-temporizador"><h2>Nuevo temporizador</h2>' +
    `<div class="seg" role="group" aria-label="Tipo">${tipos}</div>` +
    `<label class="campo"><span>Nombre (opcional)</span><input name="nombre-temporizador" value="${escapar(nombre)}" placeholder="${cuenta ? 'Pasta, horno…' : 'Amasar, levado…'}"></label>` +
    (cuenta ? `<div class="ruedas">${rueda('h', ruedas)}${rueda('m', ruedas)}${rueda('s', ruedas)}</div>` : '') +
    `<button class="btn prim" type="button" data-accion="temporizador-empezar"${!cuenta || aMs(ruedas) > 0 ? '' : ' disabled'}>Empezar</button>` +
    '</div>';
}

/** La pantalla entera. `nombre` es lo escrito en el campo del temporizador nuevo, para no perderlo al redibujar. */
export function renderTemporizadores(e: EstadoTemporizadores & { nombre: string }): string {
  return encabezado({ titulo: 'Temporizadores', icono: ICO.reloj, volver: true }) +
    '<div class="cuerpo"><div class="temporizadores">' +
      e.temporizadores.map(c => fichaDeLista(c, e.ahora)).join('') +
      fichaNuevo(e.tipo, e.ruedas, e.nombre) +
    '</div></div>';
}

/** Cuánto se queda la tira en cada turno antes de pasar al siguiente, en ms. */
export const CICLO_TIRA = 5000;

/**
 * Por lo que rota la tira, en el orden de la pantalla: los temporizadores y
 * cronómetros que corren, en orden de creación, terminados incluidos —su
 * «¡Listo!» queda hasta *Parar*—. Los pausados no entran.
 */
export const turnosDeTira = (e: EstadoTemporizadores): EnLista[] =>
  e.temporizadores.filter(t => (esCrono(t) ? cronoCorriendo(t) : corriendo(t)));

/** En qué turno está la tira y desde cuándo. Es de la pantalla: no se guarda. */
export interface Rotacion { lugar: number; desde: number }

/**
 * El turno que sigue: sola, uno más cada `CICLO_TIRA`; a mano (`paso`), uno
 * para cada lado, y el turno empieza de nuevo. Del último vuelve al primero.
 */
export function rotarTira(r: Rotacion, total: number, ahora: number, paso?: 1 | -1): Rotacion {
  if (total <= 1) return { lugar: 0, desde: r.lugar === 0 ? r.desde : ahora };
  if (paso) return { lugar: (r.lugar + paso + total) % total, desde: ahora };
  if (ahora - r.desde >= CICLO_TIRA) return { lugar: (r.lugar + 1) % total, desde: ahora };
  return r.lugar < total ? r : { lugar: r.lugar % total, desde: r.desde };
}

/** Cuánto tiene que correrse el dedo para pasar de turno, en px. */
const UMBRAL_DESLIZAR = 40;

/** Deslizar a la izquierda pasa al siguiente y a la derecha al anterior; en diagonal no es deslizar. */
export function pasoDeDeslizar(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < UMBRAL_DESLIZAR || Math.abs(dx) <= Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

/** El turno que le toca al lugar, o ninguno; un lugar que ya no existe cae adentro. */
function turnoEn(e: EstadoTemporizadores, lugar: number): { turno: EnLista; lugar: number; total: number } | null {
  const turnos = turnosDeTira(e);
  if (!turnos.length) return null;
  const l = lugar % turnos.length;
  return { turno: turnos[l]!, lugar: l, total: turnos.length };
}

/**
 * Lo que cambia la tira además del tiempo: con la misma forma, `main` escribe
 * sólo el tiempo. Rehacerla cada segundo cambiaría el nodo bajo el dedo, y un
 * toque que empieza en un nodo y termina en otro no es un click.
 */
export function formaDeTira(e: EstadoTemporizadores, lugar: number): string {
  const t = turnoEn(e, lugar);
  if (!t) return '';
  const { id, nombre } = t.turno;
  return `${terminadoEnLista(t.turno, e.ahora) ? 'listo' : 'corre'}:${id}:${nombre}:${t.lugar}/${t.total}`;
}

/** El tiempo que muestra la tira, o ninguno si el turno es uno terminado. */
export function tiempoDeTira(e: EstadoTemporizadores, lugar: number): string | null {
  const t = turnoEn(e, lugar);
  if (!t) return null;
  return terminadoEnLista(t.turno, e.ahora) ? null : tiempoEnLista(t.turno, e.ahora);
}

/**
 * La tira al pie, en el turno `lugar`: un temporizador o un cronómetro —un
 * temporizador terminado, con «¡Listo!» y *Parar*—, con «2/3» y las flechas si hay más de
 * uno. `entra` es el lado por el que llega el contenido de un turno nuevo.
 * Nada que mostrar: ''.
 */
export function renderTira(e: EstadoTemporizadores, lugar: number, entra?: 'izq' | 'der'): string {
  const t = turnoEn(e, lugar);
  if (!t) return '';
  const varios = t.total > 1;
  const listo = terminadoEnLista(t.turno, e.ahora);
  const tiempo = listo
    ? '<span class="t">¡Listo!</span>'
    : `<span class="t" data-tiempo-tira>${tiempoDeTira(e, lugar) ?? ''}</span>`;
  const parar = listo
    ? `<button class="btn prim compacto" type="button" data-accion="temporizador-sacar" data-id="${escapar(t.turno.id)}">Parar</button>`
    : '';
  // Lo que cambia de un turno a otro va en un envoltorio propio: al pasar de
  // turno se mueve sólo eso, y el fondo y las flechas quedan quietos.
  return `<div class="tira${listo ? ' listo' : ''}" data-accion="ir-temporizadores">` +
    (varios ? `<button class="tira-flecha" type="button" data-accion="tira-anterior" aria-label="Anterior">${ICO.volver}</button>` : '') +
    `<span class="tira-contenido${entra ? ` entra-${entra}` : ''}">` +
      `${esCrono(t.turno) ? ICO.cronometro : ICO.reloj}<span class="nom">${escapar(t.turno.nombre)}</span>${tiempo}` +
      (varios ? `<span class="mas">${t.lugar + 1}/${t.total}</span>` : '') +
      parar +
    '</span>' +
    (varios ? `<button class="tira-flecha" type="button" data-accion="tira-siguiente" aria-label="Siguiente">${ICO.chevron}</button>` : '') +
    '</div>';
}
