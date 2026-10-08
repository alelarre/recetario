/**
 * Las referencias: la entrada de Referencias —el buscador, los tags y la
 * lista de fichas, que se despliegan en el lugar— y
 * el Conversor, que dibuja todas sus fichas juntas. Dibuja lo que hay en
 * `src/referencias/`; no conoce ningún número.
 *
 * El resultado de una cuenta, las filas de la tabla buscada y lo que muestra
 * la entrada son bloques aparte (`[data-resultado-cuenta]`, `[data-tabla]`,
 * `[data-contenido-referencias]`) para pintarlos solos mientras se escribe:
 * redibujar le sacaría el foco al campo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { normalizar } from '../normalizar.js';
import { filasDe, fuentesDe, idDeFicha, tituloDeFicha } from '../referencias/forma.js';
import { REFERENCIAS } from '../referencias/indice.js';
import { tagsDe, conTag, buscarEnReferencias } from '../referencias/busqueda.js';
import type { Tabla, Cuenta, Valores, Fila, Fuente, Entrada, Ficha } from '../referencias/tipos.js';
import type { EstadoReferencia } from '../referencias-control.js';

/**
 * El primer número de un texto de minutos: «1½» es 1,5; «3–5», 3; «3 min 30 s»,
 * 3,5; sin número, nada.
 */
export function minutosDe(texto: string): number | null {
  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*(½)?(?:\s*min\s+(\d+)\s*s\b)?/);
  if (!m?.[1]) return null;
  return Number(m[1].replace(',', '.')) + (m[2] ? 0.5 : 0) + Number(m[3] ?? 0) / 60;
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

/** Una letra como la compara el buscador: sin tilde y en minúscula. */
const comparable = (letra: string): string => letra.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * El texto escapado, con cada aparición de lo buscado entre `<mark>`. Compara
 * como el buscador, sin tildes ni mayúsculas, pero marca el texto como está
 * escrito: «limon» marca «Limón».
 */
export function resaltar(texto: string, buscado: string): string {
  const q = [...buscado.trim()].map(comparable).join('');
  if (!q) return escapar(texto);
  const letras = [...texto];
  // De cada posición del texto comparable, la letra del original de donde salió.
  const origen: number[] = [];
  const plano = letras.map((letra, i) => {
    const c = comparable(letra);
    for (let j = 0; j < c.length; j++) origen.push(i);
    return c;
  }).join('');
  let html = '';
  let hasta = 0;
  for (let k = plano.indexOf(q); k !== -1; k = plano.indexOf(q, k + q.length)) {
    const desde = origen[k] ?? 0;
    const fin = (origen[k + q.length - 1] ?? desde) + 1;
    html += escapar(letras.slice(hasta, desde).join('')) + `<mark>${escapar(letras.slice(desde, fin).join(''))}</mark>`;
    hasta = fin;
  }
  return html + escapar(letras.slice(hasta).join(''));
}

function celda(t: Tabla, fila: Fila, columna: Tabla['columnas'][number], marcar: string): string {
  const texto = fila[columna.id] ?? '';
  const minutos = columna.minutos ? minutosDe(texto) : null;
  const nombre = nombreDeFila(t, fila);
  const boton = minutos === null ? '' :
    ` <button type="button" class="ico-min" data-accion="referencia-temporizador" data-nombre="${escapar(nombre)}" ` +
    `data-minutos="${minutos}" aria-label="Temporizador de ${escapar(nombre)}">${ICO.reloj.replace('<svg ', '<svg aria-hidden="true" ')}</button>`;
  return `<td>${resaltar(texto, marcar)}${boton}</td>`;
}

const filasHtml = (t: Tabla, filas: readonly Fila[], marcar: string): string =>
  filas.map(f => `<tr>${t.columnas.map(c => celda(t, f, c, marcar)).join('')}</tr>`).join('');

/**
 * La tabla con las filas que coinciden con la búsqueda; vacía, todas. Sólo se
 * filtra una tabla agrupada —en el Conversor, la de pesos—: las demás fichas
 * se dibujan siempre enteras y sin aviso. Los resultados de Referencias la
 * usan sin búsqueda, con la tabla ya recortada.
 */
/** `marcar` es lo que se resalta en las celdas: lo que encontró el buscador de Referencias. */
export function filasFiltradas(t: Tabla, busqueda: string, marcar = ''): string {
  const q = 'grupos' in t ? normalizar(busqueda.trim()) : '';
  const coincide = (f: Fila): boolean => !q || t.columnas.some(c => normalizar(f[c.id]).includes(q));
  const cuerpo = 'grupos' in t
    ? t.grupos.map(g => {
        const filas = g.filas.filter(coincide);
        return filas.length ? `<tr class="grupo-ref"><th colspan="${t.columnas.length}">${escapar(g.titulo)}</th></tr>${filasHtml(t, filas, marcar)}` : '';
      }).join('')
    : filasHtml(t, t.filas.filter(coincide), marcar);
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

/** `conTitulo` en falso es la ficha sola en su pantalla, donde el título ya está en el encabezado. */
function fichaTabla(t: Tabla, busqueda: string, conTitulo = true): string {
  return `<div class="ficha ref" id="ficha-${escapar(t.id)}">${conTitulo ? `<h2>${escapar(t.titulo)}</h2>` : ''}` +
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
    `<input type="number" inputmode="decimal" min="0" step="any" ${datos} value="${typeof valor === 'number' ? valor : ''}"></label>`;
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

/** Una cuenta en el desplegable de su ficha, donde el título ya está en la fila que la abre. */
export const fichaDeCuenta = (c: Cuenta, v: Valores): string => fichaCuenta(c, v, false);

function fichaCuenta(c: Cuenta, v: Valores, conTitulo = true): string {
  const valores = valoresDe(c, v);
  const visibles = c.entradas.filter(e => !e.visibleSi || e.visibleSi(valores));
  return `<div class="ficha ref" id="ficha-${escapar(c.id)}">${conTitulo ? `<h2>${escapar(c.titulo)}</h2>` : ''}` +
    `<div class="datos">${visibles.map(e => entradaHtml(c, e, valores)).join('')}</div>` +
    resultadoDeCuenta(c, valores) + notas(c.notas) + '</div>';
}

/** El Conversor: el índice de sus fichas, su buscador y todas sus fichas juntas. */
export function renderConversor(lista: readonly Ficha[], e: EstadoReferencia): string {
  const indice = '<div class="chips">' + lista.map(f =>
    `<button type="button" class="chip" data-accion="ir-a-ficha" data-id="${escapar(idDeFicha(f))}">${escapar(tituloDeFicha(f))}</button>`).join('') + '</div>';
  const buscador = `<div class="buscar">${ICO.buscar}<input data-buscar-referencia="conversor" aria-label="Buscar un alimento" placeholder="Buscar un alimento" value="${escapar(e.busqueda)}"></div>`;
  const fichas = lista.map(f => (f.tipo === 'tabla' ? fichaTabla(f.tabla, e.busqueda) : fichaCuenta(f.cuenta, e.valores[f.cuenta.id] ?? {}))).join('');
  return encabezado({ titulo: 'Conversor', icono: ICO.medidor, volver: true }) +
    `<div class="cuerpo referencias">${buscador}${indice}${fichas}</div>`;
}

/** Lo escrito en las cuentas de Referencias, por el id de la cuenta. */
type ValoresDeCuentas = Readonly<Record<string, Valores>>;

/** Una ficha como desplegable: su título es la fila que la abre o la cierra. */
function desplegableDeFicha(f: Ficha, valores: ValoresDeCuentas, titulo: string, contenido?: string): string {
  const adentro = contenido ?? (f.tipo === 'tabla' ? fichaTabla(f.tabla, '', false) : fichaCuenta(f.cuenta, valores[f.cuenta.id] ?? {}, false));
  return `<details class="ficha-ref"${contenido === undefined ? '' : ' open'}><summary>${titulo}</summary>${adentro}</details>`;
}

/** La lista de fichas desplegables, en una sola tarjeta. */
const listaDeFichas = (fichas: readonly string[]): string => `<div class="fichas-ref">${fichas.join('')}</div>`;

/**
 * Lo que muestra la entrada debajo de los tags, en una sola lista de fichas.
 * Sin texto, las del tag, todo cerrado. Con texto, lo encontrado, con lo buscado resaltado: las fichas
 * que coinciden por su título o un tag, cerradas; y cada tabla con filas que
 * coinciden, abierta, con sólo esas filas bajo su encabezado.
 */
export function contenidoDeReferencias({ tag, q }: { tag: string; q: string }, valores: ValoresDeCuentas = {}): string {
  if (!q.trim()) return listaDeFichas(conTag(REFERENCIAS, tag).map(f => desplegableDeFicha(f, valores, escapar(tituloDeFicha(f)))));
  const { fichas, tablas } = buscarEnReferencias(REFERENCIAS, tag, q);
  if (!fichas.length && !tablas.length) return `<p class="aviso-mudo">Nada con «${escapar(q.trim())}».</p>`;
  return listaDeFichas([
    ...fichas.map(f => desplegableDeFicha(f, valores, resaltar(tituloDeFicha(f), q))),
    ...tablas.map(e => desplegableDeFicha(e.ficha, valores, resaltar(e.tabla.titulo, q), filasFiltradas(e.tabla, '', q)))
  ]);
}

export function renderReferencias({ tag, q }: { tag: string; q: string }, valores: ValoresDeCuentas = {}): string {
  const chips = tagsDe(REFERENCIAS).map(t =>
    `<button type="button" class="chip${t === tag ? ' act' : ''}" data-accion="referencias-tag" data-tag-ref="${escapar(t)}">${escapar(t)}</button>`).join('');
  return encabezado({ titulo: 'Referencias', icono: ICO.libro, volver: true }) +
    '<div class="cuerpo referencias">' +
    `<div class="buscar">${ICO.buscar}<input data-buscar-referencias aria-label="Buscar en Referencias" placeholder="Buscar" value="${escapar(q)}"></div>` +
    `<div class="chips tags-ref">${chips}</div>` +
    `<div data-contenido-referencias>${contenidoDeReferencias({ tag, q }, valores)}</div></div>`;
}
