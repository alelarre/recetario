/**
 * *Herramientas*: la lista de las calculadoras y sus dos pantallas. Sólo
 * dibujan: las cuentas, las tablas y las advertencias salen de
 * `src/calculadoras/`, y lo elegido lo guarda `herramientas-control.ts`.
 *
 * Cada dato es una fila con su nombre a la izquierda y lo elegido a la
 * derecha, como un ingrediente y su cantidad (design-system §6.28): un
 * desplegable si las opciones son muchas, un conmutador si son dos o tres.
 *
 * El resultado es un bloque aparte (`[data-resultado]`) para poder pintarlo
 * solo mientras se escribe una cantidad: redibujar la pantalla le sacaría el
 * foco al campo.
 */
import { escapar } from './markdown.js';
import { encabezado, conLateral, izquierdaDelEncabezado } from './componentes.js';
import type { MenuDePantalla } from './componentes.js';
import { ICO } from './iconos.js';
import {
  PANES, HARINAS, LEVADURAS, PORCENTAJES_SEGUNDA, PREFERMENTOS, calcularPan, fermentacionesPara, FERMENTACIONES,
  conFermentacion, conLevadura, conTemperatura, prefermentoConLevadura,
  cifrasPan, lineasPan, lineasPrefermento, advertenciasPan, type DatosPan
} from '../calculadoras/pan.js';
import { FERMENTOS, cifrasSal, lineasSal, advertenciasSal, type DatosSal } from '../calculadoras/fermentados.js';
import { TEMPERATURAS } from '../calculadoras/temperaturas.js';

type Opcion = { valor: string; texto: string };

const opciones = (xs: readonly Opcion[], elegido: string): string =>
  xs.map(o => `<option value="${escapar(o.valor)}"${o.valor === elegido ? ' selected' : ''}>${escapar(o.texto)}</option>`).join('');

/**
 * Un dato con muchas opciones: la fila muestra la elegida y abre el selector
 * del sistema. Con `grupos`, las opciones van bajo el nombre de cada uno.
 */
function desplegable(etiqueta: string, grupo: string, xs: readonly Opcion[] | readonly { nombre: string; opciones: readonly Opcion[] }[],
                     elegido: string): string {
  const contenido = xs.map(x => ('opciones' in x
    ? `<optgroup label="${escapar(x.nombre)}">${opciones(x.opciones, elegido)}</optgroup>`
    : opciones([x], elegido))).join('');
  return `<label class="dato"><span class="n">${escapar(etiqueta)}</span>` +
    `<select data-opcion="${grupo}">${contenido}</select></label>`;
}

/** Un dato con dos a cuatro opciones cortas, todas a la vista y una sola apretada. */
function conmutador(etiqueta: string, grupo: string, xs: readonly Opcion[], elegido: string): string {
  const botones = xs.map(o =>
    `<button type="button" data-accion="elegir-opcion" data-grupo="${grupo}" ` +
    `data-valor="${escapar(o.valor)}" aria-pressed="${o.valor === elegido}">${escapar(o.texto)}</button>`).join('');
  return `<div class="dato"><span class="n">${escapar(etiqueta)}</span>` +
    `<div class="seg" role="group" aria-label="${escapar(etiqueta)}">${botones}</div></div>`;
}

/**
 * El interruptor: una fila entera que se toca, apagada o encendida. Manda el
 * estado al que pasa, no el que tiene.
 */
const interruptor = (etiqueta: string, grupo: string, encendido: boolean): string =>
  `<button type="button" class="dato interruptor" role="switch" aria-checked="${encendido}" data-accion="elegir-opcion" ` +
  `data-grupo="${grupo}" data-valor="${encendido ? '' : '1'}"><span class="n">${escapar(etiqueta)}</span>` +
  '<span class="perilla" aria-hidden="true"></span></button>';

/** Una explicación que se despliega debajo de un dato: cerrada, sólo su título. */
const explicacion = (titulo: string, texto: string): string =>
  `<details class="explica"><summary>${escapar(titulo)}</summary><p>${escapar(texto)}</p></details>`;

/** Las filas de datos que van juntas, en una ficha. Sin filas, nada. */
const fichaDeDatos = (...filas: string[]): string => {
  const contenido = filas.join('');
  return contenido ? `<div class="ficha datos">${contenido}</div>` : '';
};

/** Un campo de gramos. */
const campoGramos = (etiqueta: string, cantidad: string, valor: number | null): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<input type="number" inputmode="decimal" min="0" data-cantidad="${cantidad}" value="${valor === null ? '' : valor}"></label>`;

/** Dos cantidades en una fila, con lo que las une en el medio. */
const parDeCantidades = (una: string, entre: string, otra: string): string =>
  `<div class="par-cantidades">${una}<span class="entre" aria-hidden="true">${entre}</span>${otra}</div>`;

type Linea = { nombre: string; valor: string };

/** Las líneas del resultado, como las de la ficha de ingredientes. */
const lineas = (xs: readonly Linea[]): string =>
  xs.map(l => `<div class="ing"><span class="n">${escapar(l.nombre)}</span><span class="c">${escapar(l.valor)}</span></div>`).join('');

/** Lo que manda en el resultado, en grande: el valor arriba y su nombre abajo. */
const cifras = (xs: readonly Linea[]): string =>
  `<div class="cifras">${xs.map(x =>
    `<div class="cifra"><span class="v">${escapar(x.valor)}</span><span class="n">${escapar(x.nombre)}</span></div>`).join('')}</div>`;

const grupo = (titulo: string): string => `<div class="grupo">${escapar(titulo)}</div>`;

const advertencias = (textos: readonly string[]): string =>
  (textos.length ? `<ul class="advertencias">${textos.map(t => `<li>${escapar(t)}</li>`).join('')}</ul>` : '');

/**
 * La ficha del resultado de una calculadora. Es un solo bloque para pintarlo
 * entero mientras se escribe una cantidad.
 */
const fichaResultado = (contenido: string): string =>
  `<div class="ficha resultado" data-resultado><h2>${ICO.balanza}Resultado</h2>${contenido}</div>`;

export function renderHerramientas({ menu }: { menu?: MenuDePantalla }): string {
  const entrada = (hash: string, titulo: string, detalle: string): string =>
    `<a class="fila herramienta" href="${hash}"><span class="tit">${escapar(titulo)}</span>` +
    `<span class="ctx">${escapar(detalle)}</span></a>`;
  return conLateral(menu,
    encabezado({ titulo: 'Herramientas', ...izquierdaDelEncabezado(menu) }) +
    '<div class="cuerpo"><div class="ficha">' +
      entrada('#/herramientas/pan', 'Pan', 'Harinas, agua, sal y levadura') +
      entrada('#/herramientas/fermentados', 'Fermentados', 'La sal de un frasco y cuándo probarlo') +
    '</div></div>');
}

/**
 * El resultado del pan: la masa total y la hidratación en grande, lo que va
 * —con un prefermento con levadura, en dos grupos— y las advertencias.
 */
export function resultadoPan(d: DatosPan): string {
  const prefermento = lineasPrefermento(d);
  return fichaResultado(
    cifras(cifrasPan(d)) +
    (prefermento.length ? grupo('Prefermento') + lineas(prefermento) + grupo('Masa final') : '') +
    lineas(lineasPan(d)) +
    advertencias(advertenciasPan(d)));
}

const enTexto = <T extends { clave: string; nombre: string }>(xs: readonly T[]): Opcion[] =>
  xs.map(x => ({ valor: x.clave, texto: x.nombre }));

export function renderPan(d: DatosPan): string {
  const r = calcularPan(d);
  const modo = FERMENTACIONES.find(f => f.clave === d.fermentacion)?.modo ?? 'ambiente';
  const horas = fermentacionesPara(d.prefermento).filter(f => f.modo === modo);
  const pref = prefermentoConLevadura(d.prefermento);
  const elegido = PREFERMENTOS.find(p => p.clave === d.prefermento);
  const c = d.cantidad;
  // Una pizza va en bollos. En un pan, el campo que manda muestra lo escrito; el otro, lo que resulta.
  const cantidad = c.de === 'bollos'
    ? parDeCantidades(campoGramos('Bollos', 'bollos', c.bollos), '×', campoGramos('Gramos por bollo', 'bollo', c.gramos))
    : parDeCantidades(
        campoGramos('Harina total (g)', 'harina', c.de === 'harina' ? c.gramos : r ? Math.round(r.harinaTotal) : null),
        ICO.idaYVuelta,
        campoGramos('Masa total (g)', 'masa', c.de === 'masa' ? c.gramos : r ? Math.round(r.masaTotal) : null));

  // Tres fichas, en el orden en que se piensa un pan: qué es y de qué harina,
  // cómo leva, y cuánto. El resultado va al pie.
  return encabezado({ titulo: 'Pan', volver: true }) +
    '<div class="cuerpo"><div class="calculadora">' +
      fichaDeDatos(
        desplegable('Pan', 'pan', [
          { nombre: 'Panes', opciones: enTexto(PANES.filter(p => p.bollo === undefined)) },
          { nombre: 'Pizzas', opciones: enTexto(PANES.filter(p => p.bollo !== undefined)) }
        ], d.pan),
        desplegable('Harina', 'harina', enTexto(HARINAS), d.harina),
        interruptor('Mezclar con otra harina', 'mezcla', d.segunda !== null),
        ...(d.segunda ? [
          desplegable('Otra harina', 'segunda', enTexto(HARINAS.filter(h => h.clave !== d.harina)), d.segunda),
          conmutador('Porcentaje', 'porcentaje',
            PORCENTAJES_SEGUNDA.map(p => ({ valor: String(p), texto: `${p} %` })), String(d.porcentajeSegunda))
        ] : [])) +
      fichaDeDatos(
        desplegable('Prefermento', 'prefermento', [{ valor: '', texto: 'Ninguno' }, ...enTexto(PREFERMENTOS)], d.prefermento ?? ''),
        elegido ? explicacion(elegido.titulo, elegido.descripcion) : '',
        pref && pref.horas.length > 1
          ? conmutador(`Horas del ${pref.nombre.toLowerCase()}`, 'horas-prefermento',
              pref.horas.map(h => ({ valor: String(h.horas), texto: `${h.horas} h` })), String(d.horasPrefermento))
          : '',
        // La levadura va después del prefermento, que dice si hace falta: la masa madre leva sola.
        conLevadura(d) ? conmutador('Levadura', 'levadura', enTexto(LEVADURAS), d.levadura) : '',
        ...(conFermentacion(d) ? [
          conmutador('Fermentación', 'modo', [{ valor: 'ambiente', texto: 'Ambiente' }, { valor: 'frio', texto: 'En frío' }], modo),
          conmutador('Horas', 'fermentacion', horas.map(f => ({ valor: f.clave, texto: `${f.horas} h` })), d.fermentacion)
        ] : []),
        // Sólo si algo fermenta a la temperatura de la cocina: la masa o el prefermento.
        conTemperatura(d) ? desplegable('Temperatura ambiente', 'temperatura-pan', enTexto(TEMPERATURAS), d.temperatura) : '') +
      `<div class="ficha">${cantidad}</div>` +
    '</div>' +
    resultadoPan(d) +
    '</div>';
}

/** El resultado de la sal: la sal y su porcentaje en grande, el tiempo y su advertencia. */
export function resultadoSal(d: DatosSal): string {
  return fichaResultado(cifras(cifrasSal(d)) + lineas(lineasSal(d)) + advertencias(advertenciasSal(d)));
}

export function renderSal(d: DatosSal): string {
  return encabezado({ titulo: 'Fermentados', volver: true }) +
    '<div class="cuerpo"><div class="calculadora">' +
      fichaDeDatos(
        desplegable('Fermento', 'fermento', enTexto(FERMENTOS), d.fermento),
        desplegable('Temperatura ambiente', 'temperatura', enTexto(TEMPERATURAS), d.temperatura ?? '')) +
      `<div class="ficha">${campoGramos('Peso total (g)', 'peso', d.pesoTotal)}` +
        '<p class="aviso-mudo">Todo lo que va en el frasco: la verdura y, si va en salmuera, el agua.</p></div>' +
    '</div>' +
    resultadoSal(d) +
    '</div>';
}
