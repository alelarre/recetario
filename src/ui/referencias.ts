/**
 * Una herramienta de referencia, sea cual sea: el índice de sus fichas, una
 * ficha por tabla o por cuenta y la fuente al pie de cada una. Dibuja lo que
 * hay en `src/referencias/`; no conoce ningún número.
 *
 * El resultado de una cuenta y las filas de la tabla buscada son bloques
 * aparte (`[data-resultado-cuenta]`, `[data-tabla]`) para pintarlos solos
 * mientras se escribe: redibujar le sacaría el foco al campo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { normalizar } from '../normalizar.js';
import { filasDe, fuentesDe } from '../referencias/forma.js';
import type { HerramientaDeReferencia, Tabla, Cuenta, Valores, Fila, Fuente, Entrada } from '../referencias/tipos.js';
import type { EstadoReferencia } from '../referencias-control.js';

/** El primer número de un texto de minutos: «1½» es 1,5; «3–5», 3; sin número, nada. */
export function minutosDe(texto: string): number | null {
  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*(½)?/);
  if (!m?.[1]) return null;
  return Number(m[1].replace(',', '.')) + (m[2] ? 0.5 : 0);
}

const lineaDeFuente = (f: Fuente): string =>
  `<a href="${escapar(f.url)}" target="_blank" rel="noopener">${escapar(f.nombre)}</a>`;

/** Todas las fuentes que cita, una sola vez por link. */
function pieDeFuentes(fuentes: readonly Fuente[]): string {
  const unicas = fuentes.filter((f, i) => fuentes.findIndex(g => g.url === f.url) === i);
  return `<p class="fuente-ref">Fuente: ${unicas.map(lineaDeFuente).join(' · ')}</p>`;
}

/**
 * Cómo se llama el temporizador de una fila: su primera celda y, para distinguir
 * filas que la comparten, la primera columna siguiente que no es de minutos ni
 * lleva unidad, si tiene valor en esa fila.
 */
function nombreDeFila(t: Tabla, fila: Fila): string {
  const [primera, ...resto] = t.columnas;
  const base = fila[primera?.id ?? ''] ?? '';
  const distingue = resto.find(c => !c.minutos && !c.unidad);
  const extra = distingue ? (fila[distingue.id] ?? '').trim() : '';
  return extra && extra !== '—' ? `${base}, ${extra}` : base;
}

function celda(t: Tabla, fila: Fila, columna: Tabla['columnas'][number]): string {
  const texto = fila[columna.id] ?? '';
  const minutos = columna.minutos ? minutosDe(texto) : null;
  const nombre = nombreDeFila(t, fila);
  const boton = minutos === null ? '' :
    ` <button type="button" class="ico-min" data-accion="referencia-temporizador" data-nombre="${escapar(nombre)}" ` +
    `data-minutos="${minutos}" aria-label="Temporizador de ${escapar(nombre)}">${ICO.reloj.replace('<svg ', '<svg aria-hidden="true" ')}</button>`;
  return `<td>${escapar(texto)}${boton}</td>`;
}

const filasHtml = (t: Tabla, filas: readonly Fila[]): string =>
  filas.map(f => `<tr>${t.columnas.map(c => celda(t, f, c)).join('')}</tr>`).join('');

/**
 * El cuerpo de la tabla con las filas que coinciden con la búsqueda; vacía,
 * todas. Sólo una tabla agrupada —la de alimentos— se filtra: las demás
 * fichas de la herramienta se dibujan siempre enteras y sin aviso.
 */
export function filasFiltradas(t: Tabla, busqueda: string): string {
  const q = 'grupos' in t ? normalizar(busqueda.trim()) : '';
  const coincide = (f: Fila): boolean => !q || t.columnas.some(c => normalizar(f[c.id]).includes(q));
  const cuerpo = 'grupos' in t
    ? t.grupos.map(g => {
        const filas = g.filas.filter(coincide);
        return filas.length ? `<tr class="grupo-ref"><th colspan="${t.columnas.length}">${escapar(g.titulo)}</th></tr>${filasHtml(t, filas)}` : '';
      }).join('')
    : filasHtml(t, t.filas.filter(coincide));
  const vacia = q && !filasDe(t).some(coincide) ? `<p class="aviso-mudo">Ningún alimento con «${escapar(busqueda.trim())}».</p>` : '';
  return `<div class="tabla-ref" data-tabla="${escapar(t.id)}"><table>` +
    `<thead><tr>${t.columnas.map(c => `<th>${escapar(c.nombre)}${c.unidad ? ` <span class="u">(${escapar(c.unidad)})</span>` : ''}</th>`).join('')}</tr></thead>` +
    `<tbody>${cuerpo}</tbody></table>${vacia}</div>`;
}

/**
 * El texto de una nota, escapado, con cada URL como link: sin eso se leen pero
 * no se pueden tocar. La URL termina en un espacio, en «)» o en un escape de
 * `escapar`, y no se lleva la coma ni el punto que cierran la oración.
 */
function textoDeNota(texto: string): string {
  return escapar(texto).replace(/https?:\/\/(?:(?!&quot;|&lt;|&gt;)[^\s)])+/g, coincidencia => {
    const url = coincidencia.replace(/[.,]+$/, '');
    return `<a href="${url}" target="_blank" rel="noopener">${url}</a>${coincidencia.slice(url.length)}`;
  });
}

const notas = (xs: readonly string[] | undefined): string =>
  (xs?.length ? `<ul class="notas-ref">${xs.map(n => `<li>${textoDeNota(n)}</li>`).join('')}</ul>` : '');

function fichaTabla(t: Tabla, busqueda: string): string {
  return `<div class="ficha ref" id="ficha-${escapar(t.id)}"><h2>${escapar(t.titulo)}</h2>` +
    filasFiltradas(t, busqueda) + notas(t.notas) + pieDeFuentes(fuentesDe(t)) + '</div>';
}

/**
 * Los valores con que se dibuja y se calcula una cuenta: lo guardado que sigue
 * valiendo —un número finito en una entrada numérica, una opción que todavía
 * existe— y, para el resto, el valor por defecto. Así lo que se ve es lo que
 * se calcula.
 */
export function valoresDe(c: Cuenta, guardado: Valores): Valores {
  return Object.fromEntries(c.entradas.map((e): [string, number | string | null] => {
    const v = guardado[e.id];
    if (e.tipo === 'numero') return [e.id, typeof v === 'number' && Number.isFinite(v) ? v : e.porDefecto];
    return [e.id, typeof v === 'string' && e.opciones.some(o => o.valor === v) ? v : e.porDefecto];
  }));
}

/** `v` son los valores ya pasados por `valoresDe`. */
function entradaHtml(c: Cuenta, e: Entrada, v: Valores): string {
  const valor = v[e.id];
  const datos = `data-entrada="${escapar(e.id)}" data-cuenta="${escapar(c.id)}"`;
  if (e.tipo === 'opcion') {
    const opciones = e.opciones.map(o => `<option value="${escapar(o.valor)}"${o.valor === valor ? ' selected' : ''}>${escapar(o.texto)}</option>`).join('');
    return `<label class="dato"><span class="n">${escapar(e.nombre)}</span><select ${datos}>${opciones}</select></label>`;
  }
  const etiqueta = e.unidad ? `${e.nombre} (${e.unidad})` : e.nombre;
  return `<label class="dato"><span class="n">${escapar(etiqueta)}</span>` +
    `<input type="number" inputmode="decimal" min="0" ${datos} value="${typeof valor === 'number' ? valor : ''}"></label>`;
}

/** El resultado de una cuenta, en su bloque: líneas, tabla, advertencias y fuentes. Sin datos, vacío. `guardado` es lo escrito: acá se completa con los valores por defecto. */
export function resultadoDeCuenta(c: Cuenta, guardado: Valores): string {
  const r = c.calcular(valoresDe(c, guardado));
  const contenido = !r ? '' :
    r.lineas.map(l => `<div class="ing"><span class="n">${escapar(l.nombre)}</span><span class="c">${escapar(l.valor)}</span></div>`).join('') +
    (r.tabla ? `<div class="tabla-ref"><table><thead><tr>${r.tabla.columnas.map(x => `<th>${escapar(x)}</th>`).join('')}</tr></thead>` +
      `<tbody>${r.tabla.filas.map(f => `<tr>${f.map(x => `<td>${escapar(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '') +
    (r.advertencias.length ? `<ul class="advertencias">${r.advertencias.map(a => `<li>${escapar(a)}</li>`).join('')}</ul>` : '') +
    (r.fuentes.length ? pieDeFuentes(r.fuentes) : '');
  return `<div class="resultado-ref" data-resultado-cuenta="${escapar(c.id)}">${contenido}</div>`;
}

function fichaCuenta(c: Cuenta, v: Valores): string {
  const valores = valoresDe(c, v);
  const visibles = c.entradas.filter(e => !e.visibleSi || e.visibleSi(valores));
  return `<div class="ficha ref" id="ficha-${escapar(c.id)}"><h2>${escapar(c.titulo)}</h2>` +
    `<div class="datos">${visibles.map(e => entradaHtml(c, e, valores)).join('')}</div>` +
    resultadoDeCuenta(c, valores) + notas(c.notas) + '</div>';
}

export function renderReferencia(h: HerramientaDeReferencia, e: EstadoReferencia): string {
  const idDe = (f: HerramientaDeReferencia['fichas'][number]): { id: string; titulo: string } =>
    (f.tipo === 'tabla' ? { id: f.tabla.id, titulo: f.tabla.titulo } : { id: f.cuenta.id, titulo: f.cuenta.titulo });
  const indice = '<div class="chips indice-ref">' + h.fichas.map(f => {
    const { id, titulo } = idDe(f);
    return `<button type="button" class="chip" data-accion="ir-a-ficha" data-id="${escapar(id)}">${escapar(titulo)}</button>`;
  }).join('') + '</div>';
  const buscador = h.buscador
    ? `<div class="buscar">${ICO.buscar}<input data-buscar-referencia="${h.id}" placeholder="Buscar un alimento" value="${escapar(e.busqueda)}"></div>`
    : '';
  const fichas = h.fichas.map(f => (f.tipo === 'tabla' ? fichaTabla(f.tabla, e.busqueda) : fichaCuenta(f.cuenta, e.valores[f.cuenta.id] ?? {}))).join('');
  return encabezado({ titulo: h.titulo, icono: ICO[h.icono], volver: true }) +
    `<div class="cuerpo referencias">${buscador}${indice}${fichas}</div>`;
}
