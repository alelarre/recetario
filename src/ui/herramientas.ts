/**
 * *Herramientas*: la lista de las calculadoras y sus dos pantallas. Sólo
 * dibujan: las cuentas, las tablas y las advertencias salen de
 * `src/calculadoras/`, y lo elegido lo guarda `herramientas-control.ts`.
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
  conFermentacion, conLevadura, prefermentoConLevadura, cifrasPan, lineasPan, lineasPrefermento, advertenciasPan, type DatosPan
} from '../calculadoras/pan.js';
import {
  FERMENTOS, TEMPERATURAS, cifrasSal, lineasSal, advertenciasSal, type DatosSal
} from '../calculadoras/fermentados.js';

/** Una fila de opciones: un botón por opción, uno solo apretado. */
function fila(etiqueta: string, grupo: string, opciones: readonly { valor: string; texto: string }[], elegido: string): string {
  const botones = opciones.map(o =>
    `<button type="button" class="tag-esp" data-accion="elegir-opcion" data-grupo="${grupo}" ` +
    `data-valor="${escapar(o.valor)}" aria-pressed="${o.valor === elegido}">${escapar(o.texto)}</button>`).join('');
  return `<div class="campo"><span>${escapar(etiqueta)}</span>` +
    `<div class="fila-opc" role="group" aria-label="${escapar(etiqueta)}">${botones}</div></div>`;
}

/**
 * El interruptor: una fila entera que se toca, apagada o encendida. Manda el
 * estado al que pasa, no el que tiene.
 */
const interruptor = (etiqueta: string, grupo: string, encendido: boolean): string =>
  `<button type="button" class="interruptor" role="switch" aria-checked="${encendido}" data-accion="elegir-opcion" ` +
  `data-grupo="${grupo}" data-valor="${encendido ? '' : '1'}"><span>${escapar(etiqueta)}</span>` +
  '<span class="perilla" aria-hidden="true"></span></button>';

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
      entrada('#/herramientas/fermentados', 'Sal para fermentados', 'La sal de un frasco y cuándo probarlo') +
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

export function renderPan(d: DatosPan): string {
  const r = calcularPan(d);
  const modo = FERMENTACIONES.find(f => f.clave === d.fermentacion)?.modo ?? 'ambiente';
  const horas = fermentacionesPara(d.prefermento).filter(f => f.modo === modo);
  const otras = HARINAS.filter(h => h.clave !== d.harina);
  const pref = prefermentoConLevadura(d.prefermento);
  const c = d.cantidad;
  // Una pizza va en bollos. En un pan, el campo que manda muestra lo escrito; el otro, lo que resulta.
  const cantidad = c.de === 'bollos'
    ? parDeCantidades(campoGramos('Bollos', 'bollos', c.bollos), '×', campoGramos('Gramos por bollo', 'bollo', c.gramos))
    : parDeCantidades(
        campoGramos('Harina total (g)', 'harina', c.de === 'harina' ? c.gramos : r ? Math.round(r.harinaTotal) : null),
        ICO.idaYVuelta,
        campoGramos('Masa total (g)', 'masa', c.de === 'masa' ? c.gramos : r ? Math.round(r.masaTotal) : null));

  return encabezado({ titulo: 'Pan', volver: true }) +
    '<div class="cuerpo"><div class="ficha calculadora">' +
      fila('Pan', 'pan', PANES.map(p => ({ valor: p.clave, texto: p.nombre })), d.pan) +
      fila('Harina', 'harina', HARINAS.map(h => ({ valor: h.clave, texto: h.nombre })), d.harina) +
      interruptor('Mezclar con otra harina', 'mezcla', d.segunda !== null) +
      (d.segunda
        ? fila('Otra harina', 'segunda', otras.map(h => ({ valor: h.clave, texto: h.nombre })), d.segunda) +
          fila('Porcentaje de la otra harina', 'porcentaje',
            PORCENTAJES_SEGUNDA.map(p => ({ valor: String(p), texto: `${p} %` })), String(d.porcentajeSegunda))
        : '') +
      fila('Prefermento', 'prefermento',
        [{ valor: '', texto: 'Ninguno' }, ...PREFERMENTOS.map(p => ({ valor: p.clave, texto: p.nombre }))], d.prefermento ?? '') +
      (pref && pref.horas.length > 1
        ? fila(`Horas del ${pref.nombre.toLowerCase()}`, 'horas-prefermento',
            pref.horas.map(h => ({ valor: String(h.horas), texto: `${h.horas} h` })), String(d.horasPrefermento))
        : '') +
      // La levadura va después del prefermento, que dice si hace falta: la masa madre leva sola.
      (conLevadura(d) ? fila('Levadura', 'levadura', LEVADURAS.map(l => ({ valor: l.clave, texto: l.nombre })), d.levadura) : '') +
      (conFermentacion(d)
        ? fila(pref ? 'Fermentación de la masa final' : 'Fermentación', 'modo',
            [{ valor: 'ambiente', texto: 'Ambiente' }, { valor: 'frio', texto: 'En frío' }], modo) +
          fila('Horas', 'fermentacion', horas.map(f => ({ valor: f.clave, texto: `${f.horas} h` })), d.fermentacion)
        : '') +
      cantidad +
    '</div>' +
    resultadoPan(d) +
    '</div>';
}

/** El resultado de la sal: la sal y su porcentaje en grande, el tiempo y su advertencia. */
export function resultadoSal(d: DatosSal): string {
  return fichaResultado(cifras(cifrasSal(d)) + lineas(lineasSal(d)) + advertencias(advertenciasSal(d)));
}

export function renderSal(d: DatosSal): string {
  return encabezado({ titulo: 'Sal para fermentados', volver: true }) +
    '<div class="cuerpo"><div class="ficha calculadora">' +
      fila('Fermento', 'fermento', FERMENTOS.map(f => ({ valor: f.clave, texto: f.nombre })), d.fermento) +
      fila('Temperatura del ambiente', 'temperatura', TEMPERATURAS.map(t => ({ valor: t.clave, texto: t.nombre })), d.temperatura ?? '') +
      campoGramos('Peso total (g): la verdura y, si va en salmuera, el agua', 'peso', d.pesoTotal) +
    '</div>' +
    resultadoSal(d) +
    '</div>';
}
