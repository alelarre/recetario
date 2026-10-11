/**
 * *Evento*: los datos, las cosas por grupo, lo que se suma después y el
 * resultado. Sólo dibuja: la cuenta sale de `src/eventos/`, y lo elegido lo
 * guarda `eventos-control.ts`. Usa las filas de las calculadoras
 * (design-system §6.28); las fichas de las cosas llevan título porque la
 * misma cosa puede estar en dos grupos.
 *
 * El resultado es un bloque aparte (`[data-resultado]`) para pintarlo solo
 * mientras se escribe un número: redibujar le sacaría el foco al campo.
 */
import { escapar } from './markdown.js';
import { encabezado } from './componentes.js';
import { ICO } from './iconos.js';
import { renderFichaCompartir } from './compartir.js';
import type { EstadoCompartir } from './compartir.js';
import { advertencias, cifras, fichaResultado, grupo, lineas } from './herramientas.js';
import { pieDeFuentes } from './referencias.js';
import { calcularEvento } from '../eventos/evento.js';
import { MARGENES, estadoDeTipo, tipoDe, valoresDe } from '../eventos/estado.js';
import type { Comunes, DatoPedido, EstadoEvento, Item, ResultadoEvento, TipoDeEvento, Valores } from '../eventos/tipos.js';

/** Una fila que se toca entera, apagada o prendida. Manda el estado al que pasa: `'1'` prende. */
const interruptor = (nombre: string, prendido: boolean, datos: string): string =>
  `<button type="button" class="dato interruptor" role="switch" aria-checked="${prendido}" data-accion="evento-alternar" ${datos} ` +
  `data-valor="${prendido ? '' : '1'}"><span class="n">${escapar(nombre)}</span><span class="perilla" aria-hidden="true"></span></button>`;

/** Un dato del tipo o de lo que se suma después. `donde` son los atributos que dicen de quién es. */
function filaDeDato(d: DatoPedido, v: Valores, donde: string): string {
  const valor = v[d.id];
  const atributos = `${donde} data-id="${escapar(d.id)}"`;
  if (d.tipo === 'si-no') return interruptor(d.nombre, valor === true, atributos);
  if (d.tipo === 'opcion') {
    const opciones = d.opciones.map(o => `<option value="${escapar(o.valor)}"${o.valor === valor ? ' selected' : ''}>${escapar(o.texto)}</option>`).join('');
    return `<label class="dato"><span class="n">${escapar(d.nombre)}</span><select ${atributos}>${opciones}</select></label>`;
  }
  return `<label class="dato"><span class="n">${escapar(d.unidad ? `${d.nombre} (${d.unidad})` : d.nombre)}</span>` +
    `<input type="number" inputmode="decimal" min="0" step="any" ${atributos} value="${typeof valor === 'number' ? valor : ''}"></label>`;
}

const comoLineas = (items: readonly Item[]): string => lineas(items.map(i => ({ nombre: i.nombre, valor: i.cantidad })));

/** El resultado, en la ficha del resultado; sin resultado, la línea que dice qué falta. */
export function resultadoEvento(r: ResultadoEvento | null): string {
  if (!r) return fichaResultado('<p class="aviso-mudo">Escribí cuántos son y prendé lo que va a haber.</p>');
  return fichaResultado(
    cifras(r.cifras) +
    r.grupos.map(g => grupo(g.titulo) + comoLineas(g.items)).join('') +
    (r.ademas.length ? grupo('Además') + comoLineas(r.ademas) : '') +
    advertencias(r.advertencias) +
    (r.fuentes.length ? pieDeFuentes(r.fuentes) : ''));
}

const campo = (etiqueta: string, que: 'adultos' | 'chicos', valor: number | null): string =>
  `<label class="campo"><span>${etiqueta}</span><input type="number" inputmode="numeric" min="0" step="1" data-evento="${que}" value="${valor ?? ''}"></label>`;

export function renderEvento(e: EstadoEvento, tipos: readonly TipoDeEvento[], comunes: Comunes, compartir?: EstadoCompartir): string {
  const t = tipoDe(e, tipos);
  const et = t ? estadoDeTipo(e, t) : null;
  const tipo = `<label class="dato"><span class="n">Evento</span><select data-evento="tipo">` +
    tipos.map(x => `<option value="${escapar(x.id)}"${x.id === e.tipo ? ' selected' : ''}>${escapar(x.nombre)}</option>`).join('') + '</select></label>';
  const personas = `<div class="ficha"><div class="par-cantidades">${campo('Adultos', 'adultos', e.adultos)}` +
    `<span class="entre" aria-hidden="true">+</span>${campo('Chicos', 'chicos', e.chicos)}</div></div>`;
  const horas = `<label class="dato"><span class="n">Horas</span><input type="number" inputmode="decimal" min="0" step="any" data-evento="horas" value="${e.horas ?? ''}"></label>`;
  const margen = '<div class="dato"><span class="n">Margen</span><div class="seg" role="group" aria-label="Margen">' +
    MARGENES.map(m => `<button type="button" data-accion="evento-margen" data-valor="${m}" aria-pressed="${m === e.margen}">${m ? `${m} %` : 'Sin margen'}</button>`).join('') +
    '</div></div>';
  const datosDelTipo = t && et ? t.datos.map(d => filaDeDato(d, valoresDe(t.datos, et.datos), 'data-evento="dato"')).join('') : '';

  const grupos = t && et ? t.grupos.map(g => {
    const cosas = t.cosas.filter(c => c.grupo === g.id);
    return `<div class="ficha datos con-titulo"><h2>${escapar(g.titulo)}</h2>` +
      cosas.map(c => interruptor(c.nombre, et.cosas[c.id] ?? c.prendida, `data-evento="cosa" data-id="${escapar(c.id)}"`)).join('') + '</div>';
  }).join('') : '';

  const ademas = t && et && t.ademas.length ? '<div class="ficha datos con-titulo"><h2>Además</h2>' +
    t.ademas.map(({ ademas: a, prendido }) => {
      const estado = et.ademas[a.id];
      const prendida = estado?.prendido ?? prendido;
      const filas = prendida
        ? a.datos.map(d => filaDeDato(d, valoresDe(a.datos, estado?.datos ?? {}), `data-evento="dato-ademas" data-ademas="${a.id}"`)).join('')
        : '';
      return interruptor(a.nombre, prendida, `data-evento="ademas" data-id="${a.id}"`) + filas;
    }).join('') + '</div>' : '';

  return encabezado({
    titulo: 'Evento', icono: ICO.invitados, volver: true,
    derecha: `<button class="ico" data-accion="compartir-evento" aria-label="Compartir">${ICO.compartir}</button>`
  }) +
    '<div class="cuerpo"><div class="calculadora">' +
      `<div class="ficha datos">${tipo}</div>` + personas +
      `<div class="ficha datos">${horas}${interruptor('Hace calor', e.calor, 'data-evento="calor"')}${margen}${datosDelTipo}</div>` +
      grupos + ademas +
    '</div>' +
    resultadoEvento(t ? calcularEvento(e, tipos, comunes) : null) +
    '<button type="button" class="btn sec reiniciar-evento" data-accion="evento-reiniciar">Empezar de nuevo</button>' +
    '</div>' +
    (compartir ? renderFichaCompartir(compartir) : '');
}
