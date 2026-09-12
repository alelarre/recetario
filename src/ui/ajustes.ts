/**
 * Ajustes (mockup 10): la cuenta, el reindexado y los avisos que no
 * interrumpen. Está a tres toques a propósito: lo de acá es raro y caro.
 */
import { escapar } from './markdown.js';
import { encabezado, SPINNER } from './componentes.js';
import { cuando } from './borradores.js';
import type { Progreso } from '../store.js';

export interface OpcionesAjustes {
  cuenta: string;
  ultimaReindexado: string;
  /** Los `.md` que el reindexado salteó, por nombre: sin eso no se encuentran en Drive. */
  ignorados: string[];
  reindexando: Progreso | null;
}

export function renderAjustes({ cuenta, ultimaReindexado, ignorados, reindexando }: OpcionesAjustes): string {
  const enCurso = !!reindexando;

  const seccionCuenta = '<div class="ficha"><h2>Cuenta</h2>' +
    `<div class="fila-a"><span class="t">${escapar(cuenta || 'Sin cuenta conectada')}</span>` +
    '<button class="btn sec compacto" data-accion="salir">Salir</button></div>' +
    '<p class="aviso-mudo" style="margin:var(--e-2) 0 0">Salir no borra nada de Drive.</p>' +
  '</div>';

  // Con número hay barra y sin número hay spinner (mockup 10): antes de la
  // primera lectura el total todavía es 0, y «Reindexando: 0 de 0» no dice
  // nada. No hay cancelar, porque cortar a mitad deja el índice en el estado
  // que el reindexado existe para reparar (C05.5.2).
  const avance = reindexando && reindexando.total > 0
    ? `<p style="margin:0 0 var(--e-3);font-variant-numeric:tabular-nums">Reindexando: ${reindexando.leidas} de ${reindexando.total}.</p>` +
      `<div class="barra"><i style="width:${porcentaje(reindexando)}%"></i></div>`
    : '<p style="margin:0">Reindexando…</p>' + SPINNER;

  const seccionIndice = enCurso
    ? '<div class="ficha"><h2>Índice</h2>' + avance +
      '<p class="aviso-mudo" style="margin:var(--e-3) 0 0">No se puede guardar ni borrar recetas mientras tanto.</p>' +
    '</div>'
    : '<div class="ficha"><h2>Índice</h2>' +
      `<p class="aviso-mudo" style="margin:0 0 var(--e-3)">Último reindexado: ${escapar(cuando(ultimaReindexado) || 'nunca')}</p>` +
      '<button class="btn sec" style="width:100%" data-accion="reindexar">Reindexar</button>' +
    '</div>';

  const lista = ignorados.length
    ? `<div class="fila-a"><span class="t aviso-mudo">${ignorados.length} ${ignorados.length === 1 ? 'archivo ignorado' : 'archivos ignorados'} por no tener título.</span></div>` +
      `<p class="aviso-mudo" style="margin:var(--e-2) 0 0">${ignorados.map(n => escapar(n)).join(', ')}</p>`
    : '<p class="aviso-mudo" style="margin:0">No hay nada para avisar.</p>';

  return encabezado({ titulo: 'Ajustes', volver: true }) +
    '<div class="cuerpo">' + seccionCuenta + seccionIndice +
      `<div class="ficha"><h2>Avisos</h2>${lista}</div>` +
    '</div>';
}

const porcentaje = ({ leidas, total }: Progreso): number =>
  total > 0 ? Math.min(100, Math.round((leidas / total) * 100)) : 0;
