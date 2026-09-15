/**
 * La receta como documento de pdfmake (spec §4). Es una función pura: no
 * importa pdfmake, sólo sus tipos, y se prueba en Node.
 *
 * Cada ítem es un nodo que no se parte, y cada título de sección —y cada
 * rótulo de grupo o de tramo— viaja junto a su primer ítem: así ninguno queda
 * solo al pie de una página.
 */
import type { Content, ContentCanvas, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { aPdf, tramosAPdf, tramosDeFuente, tramosEnLinea } from '../ui/markdown.js';
import { contextoDe, gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { Receta } from '../tipos.js';

const mm = (v: number): number => v * 72 / 25.4;
const ANCHO = mm(105);
const ALTO = mm(180);
const MARGEN = mm(8);
const RELLENO = 6;

/** Los tokens de `src/ui/tokens.css` que usa el PDF. */
const COLOR = {
  bg: '#17140F', surface: '#211D17', borde: '#3A342B', bordeFuerte: '#544C40',
  fg: '#F2EBE1', fg2: '#B3A99B', fg3: '#948A7A'
} as const;

const TXT = { cuerpo: 6.25, titulo: 9.4, seccion: 7, chico: 5.5 } as const;

const linea = (ancho: number, color: string): ContentCanvas =>
  ({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: ancho, y2: 0, lineWidth: 0.75, lineColor: color }] });

/** El primer nodo con lo que lo antecede, en un bloque que no se parte; el resto, suelto. */
function juntoAlPrimero(antes: Content[], nodos: Content[]): Content[] {
  const [primero, ...resto] = nodos;
  if (primero === undefined) return [];
  return [{ stack: [...antes, primero], unbreakable: true }, ...resto];
}

function seccion(titulo: string, nodos: Content[]): Content[] {
  const encabezado: Content = {
    stack: [{ text: titulo, style: 'seccion' }, linea(ANCHO - 2 * MARGEN, COLOR.bordeFuerte)],
    margin: [0, 8, 0, 3]
  };
  return juntoAlPrimero([encabezado], nodos);
}

function cabecera(receta: Receta, categoria: string): Content {
  const contexto = contextoDe(receta, categoria);
  const fuente = receta.fuente ? tramosDeFuente(receta.fuente) : [];
  const separador: ContentCanvas = { ...linea(ANCHO - 2 * MARGEN - 2 * RELLENO, COLOR.borde), margin: [0, 3, 0, 3] };
  const stack: Content[] = [
    { text: receta.titulo ?? 'Sin título', style: 'titulo' },
    ...(contexto ? [{ text: contexto, style: 'contexto' }] : []),
    ...aPdf(receta.descripcion),
    ...(fuente.length
      ? [
          separador,
          { text: [{ text: 'fuente: ' }, ...tramosAPdf(fuente)], style: 'fuente' }
        ]
      : [])
  ];
  return {
    table: { widths: ['*'], body: [[{ stack }]] },
    layout: {
      fillColor: () => COLOR.surface,
      hLineColor: () => COLOR.borde, vLineColor: () => COLOR.borde,
      hLineWidth: () => 0.75, vLineWidth: () => 0.75,
      paddingLeft: () => RELLENO, paddingRight: () => RELLENO,
      paddingTop: () => RELLENO, paddingBottom: () => RELLENO
    }
  };
}

function ingredientes(receta: Receta): Content[] {
  return gruposDe(receta.ingredientes).filter(g => g.items.length).flatMap(g => {
    const items: Content[] = g.items.map(i => ({
      ul: [{ text: [{ text: i.nombre }, ...(i.cantidad ? [{ text: `  ${i.cantidad}`, bold: true } as ContentText] : [])] }],
      style: 'lista', unbreakable: true
    }));
    return g.nombre ? juntoAlPrimero([{ text: g.nombre.toUpperCase(), style: 'grupo' }], items) : items;
  });
}

function preparacion(receta: Receta): Content[] {
  return tramosDe(receta.preparacion).filter(t => t.pasos.length).flatMap(t => {
    const pasos: Content[] = t.pasos.map((p, n) => ({
      ol: [{ text: tramosAPdf(tramosEnLinea(p)) }], start: n + 1, style: 'lista', markerColor: COLOR.fg3, unbreakable: true
    }));
    return t.nombre ? juntoAlPrimero([{ text: t.nombre.toUpperCase(), style: 'grupo' }], pasos) : pasos;
  });
}

function variaciones(receta: Receta): Content[] {
  const { lista, secciones } = variacionesDe(receta.variaciones);
  if (secciones.length) {
    return secciones.map(v => ({
      stack: [
        { text: v.nombre, style: 'subtitulo' },
        ...(v.fuente ? [{ text: v.fuente, style: 'fuente', italics: true } as Content] : []),
        ...aPdf(v.cuerpo)
      ],
      unbreakable: true
    }));
  }
  return lista.map(v => ({ ul: [{ text: tramosAPdf(tramosEnLinea(v)) }], style: 'lista', unbreakable: true }));
}

export function documentoPdf(receta: Receta, categoria: string): TDocumentDefinitions {
  return {
    pageSize: { width: ANCHO, height: ALTO },
    pageMargins: [MARGEN, MARGEN, MARGEN, MARGEN],
    info: { title: receta.titulo ?? 'Receta' },
    background: (_pagina, tamano) => ({
      canvas: [{ type: 'rect', x: 0, y: 0, w: tamano.width, h: tamano.height, color: COLOR.bg }]
    }),
    defaultStyle: { font: 'Inter', fontSize: TXT.cuerpo, color: COLOR.fg, lineHeight: 1.4 },
    styles: {
      titulo: { fontSize: TXT.titulo, bold: true, margin: [0, 0, 0, 2] },
      contexto: { fontSize: TXT.chico, color: COLOR.fg2, margin: [0, 0, 0, 3] },
      fuente: { fontSize: TXT.chico, color: COLOR.fg3 },
      link: { color: COLOR.fg2, decoration: 'underline' },
      seccion: { fontSize: TXT.seccion, bold: true, margin: [0, 0, 0, 2] },
      grupo: { fontSize: TXT.chico, color: COLOR.fg2, characterSpacing: 0.3, margin: [0, 3, 0, 1] },
      subtitulo: { bold: true, margin: [0, 2, 0, 1] },
      parrafo: { margin: [0, 0, 0, 3] },
      lista: { margin: [0, 0, 0, 1.5] }
    },
    content: [
      cabecera(receta, categoria),
      ...seccion('Ingredientes', ingredientes(receta)),
      ...seccion('Preparación', preparacion(receta)),
      ...seccion('Variaciones', variaciones(receta)),
      ...seccion('Notas', aPdf(receta.notas)),
      ...receta.otras.flatMap(o => seccion(o.encabezado, aPdf(o.cuerpo)))
    ]
  };
}
