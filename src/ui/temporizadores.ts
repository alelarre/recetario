/**
 * *Temporizadores*: la pantalla —el cronómetro, los temporizadores que corren y
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
  type Temporizador, type Duracion, type Rueda,
  corriendo, restante, terminado, avance, transcurrido, cronoCorriendo, formatear, aMs
} from '../temporizadores.js';

/** El alto de la tira, en px; `base.css` lo repite y `--tira` lo lleva a los pies pegados. */
export const ALTO_TIRA = 56;

const dos = (n: number): string => String(n).padStart(2, '0');

function fichaCrono(e: EstadoTemporizadores): string {
  const ms = transcurrido(e.crono, e.ahora);
  const andando = cronoCorriendo(e.crono);
  return '<div class="ficha crono"><h2>Cronómetro</h2>' +
    `<div class="tiempo-grande" data-tiempo="crono">${formatear(ms)}</div>` +
    '<div class="acciones-temporizador">' +
      `<button class="btn sec" type="button" data-accion="crono-reiniciar"${ms > 0 ? '' : ' disabled'}>Reiniciar</button>` +
      (andando
        ? '<button class="btn prim" type="button" data-accion="crono-parar">Parar</button>'
        : '<button class="btn prim" type="button" data-accion="crono-iniciar">Iniciar</button>') +
    '</div></div>';
}

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
    `<div class="temporizador-fila"><span class="nom">${escapar(c.nombre)}</span>${tiempo}<div class="acciones-temporizador">${botones}</div></div>` +
    barra + '</div>';
}

const ETIQUETA: Record<Rueda, string> = { h: 'horas', m: 'min', s: 'seg' };

function rueda(r: Rueda, ruedas: Duracion): string {
  const valor = r === 'h' ? String(ruedas.h) : dos(ruedas[r]);
  return `<div class="rueda"><span class="lbl">${ETIQUETA[r]}</span><div class="caja">` +
    `<button type="button" data-accion="rueda-mas" data-rueda="${r}" aria-label="Más ${ETIQUETA[r]}">${ICO.arriba}</button>` +
    `<span class="val" data-rueda-valor="${r}">${valor}</span>` +
    `<button type="button" data-accion="rueda-menos" data-rueda="${r}" aria-label="Menos ${ETIQUETA[r]}">${ICO.abajo}</button>` +
    '</div></div>';
}

function fichaNuevo(ruedas: Duracion, nombre: string): string {
  return '<div class="ficha nuevo-temporizador"><h2>Nuevo temporizador</h2>' +
    `<label class="campo"><span>Nombre (opcional)</span><input name="nombre-temporizador" value="${escapar(nombre)}" placeholder="Pasta, horno…"></label>` +
    `<div class="ruedas">${rueda('h', ruedas)}${rueda('m', ruedas)}${rueda('s', ruedas)}</div>` +
    `<button class="btn prim" type="button" data-accion="temporizador-empezar"${aMs(ruedas) > 0 ? '' : ' disabled'}>Empezar</button>` +
    '</div>';
}

/** La pantalla entera. `nombre` es lo escrito en el campo del temporizador nuevo, para no perderlo al redibujar. */
export function renderTemporizadores(e: EstadoTemporizadores & { nombre: string }): string {
  return encabezado({ titulo: 'Temporizadores', volver: true }) +
    '<div class="cuerpo"><div class="temporizadores">' +
      fichaCrono(e) +
      e.temporizadores.map(c => fichaTemporizador(c, e.ahora)).join('') +
      fichaNuevo(e.ruedas, e.nombre) +
    '</div></div>';
}

/** Cuánto se queda la tira en cada turno antes de pasar al siguiente, en ms. */
export const CICLO_TIRA = 5000;

/** Un turno de la tira: el cronómetro o un temporizador. */
export type Turno = { tipo: 'crono' } | { tipo: 'temporizador'; temporizador: Temporizador };

/**
 * Por lo que rota la tira, en el orden de la pantalla: el cronómetro si corre
 * y los temporizadores en orden de creación, terminados incluidos —su
 * «¡Listo!» queda hasta *Parar*—. Los pausados no entran.
 */
export function turnosDeTira(e: EstadoTemporizadores): Turno[] {
  return [
    ...(cronoCorriendo(e.crono) ? [{ tipo: 'crono' } as const] : []),
    ...e.temporizadores.filter(t => corriendo(t)).map(temporizador => ({ tipo: 'temporizador', temporizador }) as const)
  ];
}

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
function turnoEn(e: EstadoTemporizadores, lugar: number): { turno: Turno; lugar: number; total: number } | null {
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
  const cual = `${t.lugar}/${t.total}`;
  if (t.turno.tipo === 'crono') return `crono:${cual}`;
  const { id, nombre } = t.turno.temporizador;
  return `${terminado(t.turno.temporizador, e.ahora) ? 'listo' : 'corre'}:${id}:${nombre}:${cual}`;
}

/** El tiempo que muestra la tira, o ninguno si el turno es uno terminado. */
export function tiempoDeTira(e: EstadoTemporizadores, lugar: number): string | null {
  const t = turnoEn(e, lugar);
  if (!t) return null;
  if (t.turno.tipo === 'crono') return formatear(transcurrido(e.crono, e.ahora));
  const temp = t.turno.temporizador;
  return terminado(temp, e.ahora) ? null : formatear(restante(temp, e.ahora));
}

/**
 * La tira al pie, en el turno `lugar`: el cronómetro o un temporizador —uno
 * terminado, con «¡Listo!» y *Parar*—, con «2/3» y las flechas si hay más de
 * uno. `entra` es el lado por el que llega el contenido de un turno nuevo.
 * Nada que mostrar: ''.
 */
export function renderTira(e: EstadoTemporizadores, lugar: number, entra?: 'izq' | 'der'): string {
  const t = turnoEn(e, lugar);
  if (!t) return '';
  const varios = t.total > 1;
  const listo = t.turno.tipo === 'temporizador' && terminado(t.turno.temporizador, e.ahora);
  const nombre = t.turno.tipo === 'crono' ? 'Cronómetro' : t.turno.temporizador.nombre;
  const tiempo = listo
    ? '<span class="t">¡Listo!</span>'
    : `<span class="t" data-tiempo-tira>${tiempoDeTira(e, lugar) ?? ''}</span>`;
  const parar = listo && t.turno.tipo === 'temporizador'
    ? `<button class="btn prim compacto" type="button" data-accion="temporizador-sacar" data-id="${escapar(t.turno.temporizador.id)}">Parar</button>`
    : '';
  // Lo que cambia de un turno a otro va en un envoltorio propio: al pasar de
  // turno se mueve sólo eso, y el fondo y las flechas quedan quietos.
  return `<div class="tira${listo ? ' listo' : ''}" data-accion="ir-temporizadores">` +
    (varios ? `<button class="tira-flecha" type="button" data-accion="tira-anterior" aria-label="Anterior">${ICO.volver}</button>` : '') +
    `<span class="tira-contenido${entra ? ` entra-${entra}` : ''}">` +
      `${ICO.reloj}<span class="nom">${escapar(nombre)}</span>${tiempo}` +
      (varios ? `<span class="mas">${t.lugar + 1}/${t.total}</span>` : '') +
      parar +
    '</span>' +
    (varios ? `<button class="tira-flecha" type="button" data-accion="tira-siguiente" aria-label="Siguiente">${ICO.chevron}</button>` : '') +
    '</div>';
}
