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
import {
  PANES, HARINAS, LEVADURAS, PORCENTAJES_SEGUNDA, PREFERMENTOS, calcularPan, fermentacionesPara, FERMENTACIONES,
  conFermentacion, lineasPan, lineasPrefermento, advertenciasPan, type DatosPan
} from '../calculadoras/pan.js';
import { FERMENTOS, TEMPERATURAS, lineasSal, advertenciasSal, type DatosSal } from '../calculadoras/fermentados.js';

/** Una fila de opciones: un botón por opción, uno solo apretado. */
function fila(etiqueta: string, grupo: string, opciones: readonly { valor: string; texto: string }[], elegido: string): string {
  const botones = opciones.map(o =>
    `<button type="button" class="tag-esp" data-accion="elegir-opcion" data-grupo="${grupo}" ` +
    `data-valor="${escapar(o.valor)}" aria-pressed="${o.valor === elegido}">${escapar(o.texto)}</button>`).join('');
  return `<div class="campo"><span>${escapar(etiqueta)}</span>` +
    `<div class="fila-opc" role="group" aria-label="${escapar(etiqueta)}">${botones}</div></div>`;
}

/** Un campo de gramos. */
const campoGramos = (etiqueta: string, cantidad: string, valor: number | null): string =>
  `<label class="campo"><span>${escapar(etiqueta)}</span>` +
  `<input type="number" inputmode="decimal" min="0" data-cantidad="${cantidad}" value="${valor === null ? '' : valor}"></label>`;

/** Una línea del resultado, como las de la ficha de ingredientes. */
const linea = (nombre: string, valor: string): string =>
  `<div class="ing"><span class="n">${escapar(nombre)}</span><span class="c">${escapar(valor)}</span></div>`;

const advertencias = (textos: readonly string[]): string =>
  `<ul class="advertencias">${textos.map(t => `<li>${escapar(t)}</li>`).join('')}</ul>`;

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
 * El bloque del resultado del pan: lo que va, la hidratación y las
 * advertencias. Con prefermento son dos fichas, el prefermento y la masa
 * final, en un mismo bloque para pintarlas juntas.
 */
export function resultadoPan(d: DatosPan): string {
  const prefermento = lineasPrefermento(d);
  const ficha = (titulo: string, lineas: { nombre: string; valor: string }[], pie = ''): string =>
    `<div class="ficha"><h2>${escapar(titulo)}</h2>${lineas.map(l => linea(l.nombre, l.valor)).join('')}${pie}</div>`;
  return '<div class="resultado" data-resultado>' +
    (prefermento.length ? ficha('Prefermento', prefermento) : '') +
    ficha(prefermento.length ? 'Masa final' : 'Resultado', lineasPan(d), advertencias(advertenciasPan(d))) +
  '</div>';
}

export function renderPan(d: DatosPan): string {
  const r = calcularPan(d);
  const modo = FERMENTACIONES.find(f => f.clave === d.fermentacion)?.modo ?? 'ambiente';
  const horas = fermentacionesPara(d.levadura).filter(f => f.modo === modo);
  const segundas = HARINAS.filter(h => h.clave !== d.harina);
  const prefermento = d.levadura === 'masa-madre' ? undefined : PREFERMENTOS.find(p => p.clave === d.prefermento);
  const c = d.cantidad;
  // Una pizza va en bollos. En un pan, el campo que manda muestra lo escrito; el otro, lo que resulta.
  const cantidad = c.de === 'bollos'
    ? campoGramos('Bollos', 'bollos', c.bollos) + campoGramos('Gramos por bollo', 'bollo', c.gramos)
    : campoGramos('Harina total (g)', 'harina', c.de === 'harina' ? c.gramos : r ? Math.round(r.harinaTotal) : null) +
      campoGramos('Masa total (g)', 'masa', c.de === 'masa' ? c.gramos : r ? Math.round(r.masaTotal) : null);

  return encabezado({ titulo: 'Pan', volver: true }) +
    '<div class="cuerpo"><div class="ficha calculadora">' +
      fila('Pan', 'pan', PANES.map(p => ({ valor: p.clave, texto: p.nombre })), d.pan) +
      fila('Harina', 'harina', HARINAS.map(h => ({ valor: h.clave, texto: h.nombre })), d.harina) +
      fila('Segunda harina', 'segunda',
        [{ valor: '', texto: 'Ninguna' }, ...segundas.map(h => ({ valor: h.clave, texto: h.nombre }))], d.segunda ?? '') +
      (d.segunda
        ? fila('Porcentaje de la segunda', 'porcentaje',
            PORCENTAJES_SEGUNDA.map(p => ({ valor: String(p), texto: `${p} %` })), String(d.porcentajeSegunda))
        : '') +
      fila('Levadura', 'levadura', LEVADURAS.map(l => ({ valor: l.clave, texto: l.nombre })), d.levadura) +
      // El prefermento no va con masa madre.
      (d.levadura === 'masa-madre' ? '' :
        fila('Prefermento', 'prefermento',
          [{ valor: '', texto: 'Ninguno' }, ...PREFERMENTOS.map(p => ({ valor: p.clave, texto: p.nombre }))], d.prefermento ?? '') +
        (prefermento && prefermento.horas.length > 1
          ? fila(`Horas del ${prefermento.nombre.toLowerCase()}`, 'horas-prefermento',
              prefermento.horas.map(h => ({ valor: String(h.horas), texto: `${h.horas} h` })), String(d.horasPrefermento))
          : '')) +
      (conFermentacion(d)
        ? fila(prefermento ? 'Fermentación de la masa final' : 'Fermentación', 'modo',
            [{ valor: 'ambiente', texto: 'Ambiente' }, { valor: 'frio', texto: 'En frío' }], modo) +
          fila('Horas', 'fermentacion', horas.map(f => ({ valor: f.clave, texto: `${f.horas} h` })), d.fermentacion)
        : '') +
      cantidad +
    '</div>' +
    resultadoPan(d) +
    '</div>';
}

/** El bloque del resultado de la sal: la sal, el porcentaje, el tiempo y su advertencia. */
export function resultadoSal(d: DatosSal): string {
  return '<div class="ficha" data-resultado><h2>Resultado</h2>' +
    lineasSal(d).map(l => linea(l.nombre, l.valor)).join('') +
    advertencias(advertenciasSal(d)) +
  '</div>';
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
