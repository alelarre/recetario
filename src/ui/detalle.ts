import { aHtml, escapar } from './markdown.js';
import { colorCategoria } from './categorias.js';
import type { Receta, Entrada, Aviso } from '../tipos.js';

// Traduce los códigos internos de recipe.js (§8: "se indexa con lo que se
// pueda rescatar y se muestra como texto plano con un aviso") a un texto que
// el usuario entienda, sin exponer el código interno. 'frontmatter-ilegible'
// y 'sin-frontmatter' comparten mensaje: son mutuamente excluyentes (parse()
// nunca empuja los dos juntos) y para quien lee la receta el problema
// práctico es el mismo — no se pudo leer el frontmatter.
const AVISOS_LEGIBLES: Record<Aviso, string> = {
  'frontmatter-ilegible': 'el frontmatter no se pudo leer',
  'sin-frontmatter': 'el frontmatter no se pudo leer',
  'sin-titulo': 'esta receta no tiene título',
  'seccion-duplicada': 'hay una sección repetida'
};

function avisosLegibles(avisos?: Aviso[]): string[] {
  const lista: Aviso[] = Array.isArray(avisos) ? avisos : [];
  return [...new Set(lista.map(a => AVISOS_LEGIBLES[a]).filter(Boolean))];
}

/** Cuenta los ítems de una lista markdown, para el número del rótulo. */
function cuentaItems(md: unknown): number {
  return String(md ?? '').split('\n').filter(l => /^\s*[-*]\s+\S/.test(l)).length;
}

/**
 * Una sola columna, sin pestañas: cocinando hacen falta los ingredientes y los
 * pasos a la vez, y las pestañas obligaban a saltar entre las dos cosas con
 * las manos ocupadas. Las secciones se apilan en el orden del §3.2, y los
 * ingredientes quedan a un toque en la barra pegajosa mientras se lee la
 * preparación.
 */
export interface ArgsDetalle {
  /** La fila del índice. Falta en una receta recién creada y todavía no indexada. */
  entrada?: Partial<Entrada> | null;
  receta?: Partial<Receta> | null;
  ingredientesPlegados?: boolean;
}

export function renderDetalle(args: ArgsDetalle = {}): string {
  const { entrada = {}, receta = {}, ingredientesPlegados = false } = args || {};

  const r: Partial<Receta> = receta ?? {};
  const e: Partial<Entrada> = entrada ?? {};

  const meta = [r.rinde, r.tiempo, r.dificultad].filter(Boolean).join(' · ');
  const incompleto = e?.tags?.includes('incompleto');
  const avisos = avisosLegibles(r.avisos);
  const categoria = e?.categoria ?? '';

  const otras = (r.otras ?? []).map(o =>
    seccion(escapar(o.encabezado), '', `<div class="cuerpo-seccion">${aHtml(o.cuerpo)}</div>`)).join('');

  return `
    <div class="banda" style="--cat:${colorCategoria(categoria)}"></div>
    <nav class="nav-detalle">
      <button data-accion="atras">‹ ${escapar(categoria || 'Volver')}</button>
      <button data-accion="editar"><span aria-hidden="true">✏️</span>Editar</button>
    </nav>
    <h1 class="titulo-receta${incompleto ? ' incompleto' : ''}">${escapar(r.titulo ?? e?.titulo ?? '')}</h1>
    ${meta ? `<p class="meta-receta">${escapar(meta)}</p>` : ''}
    ${avisos.length ? `<p class="meta-receta aviso">⚠ ${avisos.map(escapar).join(' · ')}</p>` : ''}
    ${r.descripcion ? `<div class="cuerpo-seccion">${aHtml(r.descripcion)}</div>` : ''}

    <div class="acciones">
      <button data-accion="pantalla" aria-pressed="false">Pantalla activa</button>
      <button data-accion="texto-grande" aria-pressed="false">Texto grande</button>
    </div>

    ${r.ingredientes ? `
      <button class="plegable" data-accion="ingredientes" aria-expanded="${!ingredientesPlegados}">
        <span>Ingredientes</span>
        <span class="cuenta">${cuentaItems(r.ingredientes)} ${ingredientesPlegados ? '⌄' : '⌃'}</span>
      </button>
      ${ingredientesPlegados ? '' : `<div class="cuerpo-seccion" data-ingredientes>${aHtml(r.ingredientes)}</div>`}` : ''}

    ${r.preparacion ? seccion('Preparación', '',
      `<div style="--cat:${colorCategoria(categoria)}">${aHtml(r.preparacion, { pasos: true })}</div>`) : ''}
    ${r.variaciones ? seccion('Variaciones', cuentaSecciones(r.variaciones),
      `<div class="cuerpo-seccion">${aHtml(r.variaciones)}</div>`) : ''}
    ${r.notas ? seccion('Notas', cuentaItems(r.notas),
      `<div class="cuerpo-seccion">${aHtml(r.notas)}</div>`) : ''}
    ${otras}`;
}

function cuentaSecciones(md: unknown): number {
  return String(md ?? '').split(/^###\s+/m).filter(Boolean).length;
}

function seccion(rotulo: string, cuenta: number | string, cuerpo: string): string {
  return `
    <div class="seccion"><span>${rotulo}</span><span>${cuenta === '' ? '' : cuenta}</span></div>
    ${cuerpo}`;
}
