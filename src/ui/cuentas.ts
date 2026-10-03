/**
 * *Cuentas*: la pantalla —el cronómetro, las cuentas que corren y la cuenta
 * nueva— y la tira al pie que las muestra desde cualquier otra pantalla. Sólo
 * dibujan el estado del control; los tiempos llevan marcas (`data-tiempo`,
 * `data-avance`, `data-rueda-valor`) para que `main` los escriba cada segundo
 * sin redibujar, que perdería el nombre que se está escribiendo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import type { EstadoCuentas } from '../cuentas-control.js';
import {
  type Cuenta, type Duracion, type Rueda,
  corriendo, restante, terminada, avance, transcurrido, cronoCorriendo, formatear, aMs
} from '../cuentas.js';

/** El alto de la tira, en px; `base.css` lo repite y `--tira` lo lleva a los pies pegados. */
export const ALTO_TIRA = 56;

const dos = (n: number): string => String(n).padStart(2, '0');

function fichaCrono(e: EstadoCuentas): string {
  const ms = transcurrido(e.crono, e.ahora);
  const andando = cronoCorriendo(e.crono);
  return '<div class="ficha crono"><h2>Cronómetro</h2>' +
    `<div class="tiempo-grande" data-tiempo="crono">${formatear(ms)}</div>` +
    '<div class="acciones-cuenta">' +
      `<button class="btn sec" type="button" data-accion="crono-reiniciar"${ms > 0 ? '' : ' disabled'}>Reiniciar</button>` +
      (andando
        ? '<button class="btn prim" type="button" data-accion="crono-parar">Parar</button>'
        : '<button class="btn prim" type="button" data-accion="crono-iniciar">Iniciar</button>') +
    '</div></div>';
}

const cuadrado = (accion: string, id: string, etiqueta: string, contenido: string): string =>
  `<button class="btn sec cuadrado" type="button" data-accion="${accion}" data-id="${escapar(id)}" aria-label="${etiqueta}">${contenido}</button>`;

function fichaCuenta(c: Cuenta, ahora: number): string {
  const falta = restante(c, ahora);
  const lista = terminada(c, ahora);
  const tiempo = lista
    ? '<span class="tiempo listo">¡Listo!</span>'
    : `<span class="tiempo${corriendo(c) ? '' : ' pausada'}" data-tiempo="${escapar(c.id)}">${formatear(falta)}</span>`;
  const mas = cuadrado('cuenta-sumar', c.id, 'Un minuto más', "+1'");
  const botones = lista
    ? mas + `<button class="btn prim" type="button" data-accion="cuenta-sacar" data-id="${escapar(c.id)}">Parar</button>`
    : mas +
      (corriendo(c) ? cuadrado('cuenta-pausar', c.id, 'Pausar', ICO.pausa) : cuadrado('cuenta-seguir', c.id, 'Seguir', ICO.play)) +
      cuadrado('cuenta-sacar', c.id, 'Sacar', ICO.cerrar);
  const barra = lista ? ''
    : `<div class="barra"><i data-avance="${escapar(c.id)}" style="width:${Math.round(avance(c, ahora) * 100)}%"></i></div>`;
  return `<div class="ficha cuenta" data-cuenta="${escapar(c.id)}">` +
    `<div class="cuenta-fila"><span class="nom">${escapar(c.nombre)}</span>${tiempo}<div class="acciones-cuenta">${botones}</div></div>` +
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

function fichaNueva(ruedas: Duracion, nombre: string): string {
  return '<div class="ficha nueva-cuenta"><h2>Nueva cuenta</h2>' +
    `<label class="campo"><span>Nombre (opcional)</span><input name="nombre-cuenta" value="${escapar(nombre)}" placeholder="Pasta, horno…"></label>` +
    `<div class="ruedas">${rueda('h', ruedas)}${rueda('m', ruedas)}${rueda('s', ruedas)}</div>` +
    `<button class="btn prim" type="button" data-accion="cuenta-empezar"${aMs(ruedas) > 0 ? '' : ' disabled'}>Empezar</button>` +
    '</div>';
}

/** La pantalla entera. `nombre` es lo escrito en el campo de la cuenta nueva, para no perderlo al redibujar. */
export function renderCuentas(e: EstadoCuentas & { nombre: string }): string {
  return encabezado({ titulo: 'Cuentas', volver: true }) +
    '<div class="cuerpo"><div class="cuentas">' +
      fichaCrono(e) +
      e.cuentas.map(c => fichaCuenta(c, e.ahora)).join('') +
      fichaNueva(e.ruedas, e.nombre) +
    '</div></div>';
}

/** Cuánto se queda la tira en cada cosa que corre antes de pasar a la siguiente, en ms. */
export const CICLO_TIRA = 5000;

/** Lo que corre, en el orden de la pantalla: el cronómetro y las cuentas en orden de creación. */
type Corriendo = { tipo: 'crono' } | { tipo: 'cuenta'; cuenta: Cuenta };

/**
 * Lo que muestra la tira: la cuenta que avisa, o —rotando por turnos de
 * `CICLO_TIRA`— una de las que corren, con su lugar entre todas; o nada. El
 * turno sale del reloj: no hay estado que guardar.
 */
type ContenidoTira =
  | { tipo: 'listo'; cuenta: Cuenta }
  | (Corriendo & { lugar: number; total: number })
  | { tipo: 'nada' };

function contenidoTira(e: EstadoCuentas): ContenidoTira {
  const avisa = e.avisando !== null ? e.cuentas.find(c => c.id === e.avisando) : undefined;
  if (avisa) return { tipo: 'listo', cuenta: avisa };
  const corren: Corriendo[] = [
    ...(cronoCorriendo(e.crono) ? [{ tipo: 'crono' } as const] : []),
    ...e.cuentas.filter(c => corriendo(c) && !terminada(c, e.ahora)).map(cuenta => ({ tipo: 'cuenta', cuenta }) as const)
  ];
  const lugar = Math.floor(e.ahora / CICLO_TIRA) % Math.max(1, corren.length);
  const turno = corren[lugar];
  return turno ? { ...turno, lugar, total: corren.length } : { tipo: 'nada' };
}

/**
 * Lo que cambia la tira además del tiempo: con la misma forma, `main` escribe
 * sólo el tiempo. Rehacerla cada segundo cambiaría el nodo bajo el dedo, y un
 * toque que empieza en un nodo y termina en otro no es un click.
 */
export function formaDeTira(e: EstadoCuentas): string {
  const c = contenidoTira(e);
  switch (c.tipo) {
    case 'listo': return `listo:${c.cuenta.id}:${c.cuenta.nombre}`;
    case 'cuenta': return `cuenta:${c.cuenta.id}:${c.cuenta.nombre}:${c.lugar}/${c.total}`;
    case 'crono': return `crono:${c.lugar}/${c.total}`;
    case 'nada': return '';
  }
}

/** El tiempo que muestra la tira, o ninguno. */
export function tiempoDeTira(e: EstadoCuentas): string | null {
  const c = contenidoTira(e);
  if (c.tipo === 'cuenta') return formatear(restante(c.cuenta, e.ahora));
  if (c.tipo === 'crono') return formatear(transcurrido(e.crono, e.ahora));
  return null;
}

/**
 * La tira al pie: rota por lo que corre —el cronómetro y cada cuenta— con
 * «2/3» si hay más de una; avisando, el «¡Listo!» con *Parar*. Nada que
 * mostrar: ''.
 */
export function renderTira(e: EstadoCuentas): string {
  const c = contenidoTira(e);
  const tiempo = tiempoDeTira(e) ?? '';
  const cual = c.tipo === 'cuenta' || c.tipo === 'crono'
    ? (c.total > 1 ? `<span class="mas">${c.lugar + 1}/${c.total}</span>` : '') : '';
  switch (c.tipo) {
    case 'listo':
      return `<div class="tira listo" data-accion="ir-cuentas">${ICO.reloj}<span class="nom">${escapar(c.cuenta.nombre)}</span>` +
        '<span class="t">¡Listo!</span>' +
        `<button class="btn prim compacto" type="button" data-accion="cuenta-sacar" data-id="${escapar(c.cuenta.id)}">Parar</button></div>`;
    case 'cuenta':
      return `<button class="tira" type="button" data-accion="ir-cuentas">${ICO.reloj}<span class="nom">${escapar(c.cuenta.nombre)}</span>` +
        `<span class="t" data-tiempo-tira>${tiempo}</span>${cual}</button>`;
    case 'crono':
      return `<button class="tira" type="button" data-accion="ir-cuentas">${ICO.reloj}<span class="nom">Cronómetro</span>` +
        `<span class="t" data-tiempo-tira>${tiempo}</span>${cual}</button>`;
    case 'nada':
      return '';
  }
}
