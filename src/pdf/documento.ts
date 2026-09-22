/**
 * La receta como documento de pdfmake. Es una función pura: no
 * importa pdfmake, sólo sus tipos, y se prueba en Node.
 *
 * Cada ítem es un nodo que no se parte, y cada título de sección —y cada
 * rótulo de grupo o de tramo— viaja junto a su primer ítem: así ninguno queda
 * solo al pie de una página.
 */
import type { Content, ContentCanvas, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { aPdf, conFotos, fotosDeTramos, tramosAPdf, tramosDeFuente, tramosEnLinea } from '../ui/markdown.js';
import { contextoDe, gruposDe, tramosDe, variacionesDe } from '../recipe.js';
import type { FotoDeTramo } from '../ui/markdown.js';
import type { FotoDeReceta, Receta } from '../tipos.js';

const mm = (v: number): number => v * 72 / 25.4;
const ANCHO = mm(105);
const ALTO = mm(180);
const MARGEN = mm(8);
const RELLENO = 6;
/** Lo más ancho que llega a ser algo: la página menos sus márgenes. */
const ANCHO_UTIL = ANCHO - 2 * MARGEN;
/**
 * El alto máximo de una foto. La cabecera lo pide, y una foto en línea
 * sigue la misma regla: su bloque no se parte, así que tiene que entrar en una página.
 */
const ALTO_FOTO = mm(90);
/** Lo que separa las dos columnas de la galería, y una fila de la siguiente. */
const AIRE_GALERIA = 6;

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

/**
 * Cómo dibujar la foto de una referencia, al ancho que le toque. Una URL que
 * no está en el mapa no se dibuja: `generar` no la pudo bajar.
 */
const fotoEnLinea = (imagenes: Map<string, string>, ancho: number): FotoDeTramo =>
  (url, epigrafe) => {
    const dataUrl = imagenes.get(url);
    if (!dataUrl) return [];
    return [
      { image: dataUrl, fit: [ancho, ALTO_FOTO], margin: [0, 3, 0, epigrafe ? 1 : 3] },
      ...(epigrafe ? [{ text: epigrafe, style: 'epigrafe' } as Content] : [])
    ];
  };

/** La foto de la cabecera, arriba del título y al ancho de la página. */
function fotoDeCabecera(receta: Receta, imagenes: Map<string, string>): Content[] {
  const dataUrl = receta.foto ? imagenes.get(receta.foto) : undefined;
  return dataUrl ? [{ image: dataUrl, fit: [ANCHO_UTIL, ALTO_FOTO], margin: [0, 0, 0, 6] }] : [];
}

/**
 * Las fotos sin uso, de a dos por fila, en el orden del depósito. La
 * portada ya está arriba y las de una línea están en su línea: repetirlas acá
 * sería dibujarlas dos veces. Sin ninguna, `seccion` no dibuja nada.
 */
function galeria(sinUso: FotoDeReceta[], imagenes: Map<string, string>): Content[] {
  const lado = (ANCHO_UTIL - AIRE_GALERIA) / 2;
  const fotos = sinUso.flatMap((f): Content[] => {
    const dataUrl = imagenes.get(f.url);
    return dataUrl ? [{ image: dataUrl, fit: [lado, lado] }] : [];
  });
  const filas: Content[] = [];
  for (let i = 0; i < fotos.length; i += 2) {
    filas.push({
      columns: fotos.slice(i, i + 2), columnGap: AIRE_GALERIA,
      margin: [0, 0, 0, AIRE_GALERIA], unbreakable: true
    });
  }
  return filas;
}

function cabecera(receta: Receta, categoria: string, imagenes: Map<string, string>): Content {
  // La descripción va adentro de la tarjeta: sus fotos entran en lo que queda
  // después del relleno, no en el ancho de la página.
  const fotoDe = fotoEnLinea(imagenes, ANCHO_UTIL - 2 * RELLENO);
  const contexto = contextoDe(receta, categoria);
  const fuente = receta.fuente ? tramosDeFuente(receta.fuente) : [];
  const separador: ContentCanvas = { ...linea(ANCHO - 2 * MARGEN - 2 * RELLENO, COLOR.borde), margin: [0, 3, 0, 3] };
  const stack: Content[] = [
    { text: receta.titulo ?? 'Sin título', style: 'titulo' },
    ...(contexto ? [{ text: contexto, style: 'contexto' }] : []),
    ...aPdf(receta.descripcion, fotoDe),
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

function ingredientes(receta: Receta, fotoDe: FotoDeTramo): Content[] {
  return gruposDe(receta.ingredientes).filter(g => g.items.length).flatMap(g => {
    const items: Content[] = g.items.map(i => {
      // El nombre y la cantidad son texto en línea como cualquier otra línea:
      // pueden traer negrita, un link o la referencia a una foto.
      const nombre = tramosEnLinea(i.nombre);
      const cantidad = i.cantidad ? tramosEnLinea(i.cantidad) : [];
      // La cantidad va en negrita y separada del nombre por dos espacios, que
      // se pegan al primer tramo con texto: así sigue siendo un solo renglón.
      const enNegrita = tramosAPdf(cantidad.filter(t => !t.imagen).map((t, n) => (n ? t : { ...t, texto: `  ${t.texto}` })))
        .map((t): ContentText => ({ ...t, bold: true }));
      const item: Content = {
        ul: [{ text: [...tramosAPdf(nombre), ...enNegrita] }],
        style: 'lista', unbreakable: true
      };
      return conFotos(item, fotosDeTramos([...nombre, ...cantidad], fotoDe));
    });
    return g.nombre ? juntoAlPrimero([{ text: g.nombre.toUpperCase(), style: 'grupo' }], items) : items;
  });
}

function preparacion(receta: Receta, fotoDe: FotoDeTramo): Content[] {
  return tramosDe(receta.preparacion).filter(t => t.pasos.length).flatMap(t => {
    const pasos: Content[] = t.pasos.map((p, n) => {
      const tramos = tramosEnLinea(p);
      const paso: Content = {
        ol: [{ text: tramosAPdf(tramos) }], start: n + 1, style: 'lista', markerColor: COLOR.fg3, unbreakable: true
      };
      return conFotos(paso, fotosDeTramos(tramos, fotoDe));
    });
    return t.nombre ? juntoAlPrimero([{ text: t.nombre.toUpperCase(), style: 'grupo' }], pasos) : pasos;
  });
}

function variaciones(receta: Receta, fotoDe: FotoDeTramo): Content[] {
  const { lista, secciones } = variacionesDe(receta.variaciones);
  if (secciones.length) {
    return secciones.map(v => ({
      stack: [
        { text: v.nombre, style: 'subtitulo' },
        ...(v.fuente ? [{ text: v.fuente, style: 'fuente', italics: true } as Content] : []),
        ...aPdf(v.cuerpo, fotoDe)
      ],
      unbreakable: true
    }));
  }
  return lista.map(v => {
    const tramos = tramosEnLinea(v);
    return conFotos({ ul: [{ text: tramosAPdf(tramos) }], style: 'lista', unbreakable: true }, fotosDeTramos(tramos, fotoDe));
  });
}

/**
 * `imagenes` es una URL de la receta resuelta por su data URL, ya achicada
 * (`generar`). Una URL que no está no se dibuja: no se pudo bajar.
 *
 * `sinUso` son las fotos de la galería del final: las calcula `generar` sobre
 * el `.md` crudo (`fotosSinUso`), porque acá la receta ya viene resuelta y no
 * queda ninguna `foto:N` que buscar.
 */
export function documentoPdf(
  receta: Receta, categoria: string, imagenes: Map<string, string>, sinUso: FotoDeReceta[]
): TDocumentDefinitions {
  const fotoDe = fotoEnLinea(imagenes, ANCHO_UTIL);
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
      lista: { margin: [0, 0, 0, 1.5] },
      epigrafe: { fontSize: TXT.chico, color: COLOR.fg3, margin: [0, 0, 0, 3] }
    },
    content: [
      ...fotoDeCabecera(receta, imagenes),
      cabecera(receta, categoria, imagenes),
      ...seccion('Ingredientes', ingredientes(receta, fotoDe)),
      ...seccion('Preparación', preparacion(receta, fotoDe)),
      ...seccion('Variaciones', variaciones(receta, fotoDe)),
      ...seccion('Notas', aPdf(receta.notas, fotoDe)),
      // Como en la pantalla: después de Notas y antes de las secciones ajenas.
      ...seccion('Fotos', galeria(sinUso, imagenes)),
      ...receta.otras.flatMap(o => seccion(o.encabezado, aPdf(o.cuerpo, fotoDe)))
    ]
  };
}
