import type { Content, ContentText } from 'pdfmake/interfaces';
import { idDeDrive } from '../fotos-receta.js';

export function escapar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sólo `http:`, `https:` y rutas relativas. Todo lo demás —`javascript:` el
 * primero— no se emite como destino: los `.md` los escribe cualquiera.
 */
const esDestinoSeguro = (url: string): boolean =>
  /^(https?:\/\/|\/|\.\.?\/)/i.test(url);

/** Un pedazo de texto en línea con su formato. Lo leen las tres salidas: HTML, texto y PDF. */
export interface TramoEnLinea {
  texto: string;
  negrita?: true;
  italica?: true;
  /** El destino de un link, ya validado. */
  link?: string;
  /** El destino de una imagen, ya validado; `texto` queda vacío. */
  imagen?: string;
  /** El texto entre corchetes de una imagen (`![epígrafe](…)`), si lo trae. */
  epigrafe?: string;
}

export type Bloque =
  | { tipo: 'parrafo' | 'subtitulo'; tramos: TramoEnLinea[] }
  | { tipo: 'lista' | 'numerada'; items: TramoEnLinea[][] };

type BloqueLista = Extract<Bloque, { items: unknown }>;

// Imagen, link, negrita, itálica: en cada posición gana el primero que calza, y
// adentro de la negrita y la itálica se vuelve a buscar. Nota: URLs con
// paréntesis anidados (ej: alert(1)) se truncan en el primer ), limitación conocida.
const EN_LINEA = /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;

function enLinea(fuente: string, formato: Pick<TramoEnLinea, 'negrita' | 'italica'>): TramoEnLinea[] {
  const salida: TramoEnLinea[] = [];
  const suelto = (texto: string): void => { if (texto) salida.push({ texto, ...formato }); };
  let desde = 0;
  for (const m of fuente.matchAll(EN_LINEA)) {
    const inicio = m.index ?? 0;
    suelto(fuente.slice(desde, inicio));
    desde = inicio + m[0].length;
    const [entero, epigrafe, imagen, textoLink, destino, negrita, italica] = m;
    if (imagen !== undefined) {
      if (esDestinoSeguro(imagen)) salida.push({ texto: '', imagen, ...(epigrafe ? { epigrafe } : {}), ...formato });
      else suelto(entero);
    } else if (textoLink !== undefined && destino !== undefined) {
      if (esDestinoSeguro(destino)) salida.push({ texto: textoLink, link: destino, ...formato });
      else suelto(entero);
    } else if (negrita !== undefined) {
      salida.push(...enLinea(negrita, { ...formato, negrita: true }));
    } else if (italica !== undefined) {
      salida.push(...enLinea(italica, { ...formato, italica: true }));
    }
  }
  suelto(fuente.slice(desde));
  return salida;
}

export const tramosEnLinea = (texto: unknown): TramoEnLinea[] => enLinea(String(texto ?? ''), {});

/** Los bloques de un texto: párrafos, `###`, listas con guion y listas numeradas. */
export function bloques(texto: unknown): Bloque[] {
  const salida: Bloque[] = [];
  let parrafo: string[] = [];
  let lista: BloqueLista | null = null;

  const cerrarParrafo = (): void => {
    if (parrafo.length) salida.push({ tipo: 'parrafo', tramos: tramosEnLinea(parrafo.join(' ')) });
    parrafo = [];
  };
  const item = (tipo: BloqueLista['tipo'], contenido: string): void => {
    cerrarParrafo();
    let actual = lista;
    if (!actual || actual.tipo !== tipo) {
      actual = { tipo, items: [] };
      salida.push(actual);
      lista = actual;
    }
    actual.items.push(tramosEnLinea(contenido));
  };

  for (const linea of String(texto ?? '').split('\n')) {
    const h3 = linea.match(/^###\s+(.*)$/);
    const vineta = linea.match(/^\s*[-*]\s+(.*)$/);
    const num = linea.match(/^\s*\d+[.)]\s+(.*)$/);

    if (h3) { cerrarParrafo(); lista = null; salida.push({ tipo: 'subtitulo', tramos: tramosEnLinea(h3[1]) }); continue; }
    if (vineta) { item('lista', vineta[1] ?? ''); continue; }
    if (num) { item('numerada', num[1] ?? ''); continue; }
    if (!linea.trim()) { cerrarParrafo(); lista = null; continue; }
    lista = null;
    parrafo.push(linea.trim());
  }
  cerrarParrafo();
  return salida;
}

/**
 * El `<img>` para una URL ya resuelta (nunca `foto:N`, eso lo resuelve
 * `resolverReceta`): de Drive lleva `data-drive` y sin `src`, así se dibuja
 * como el recuadro de `imagenes.ts` hasta que llegue el blob; cualquier otra
 * URL se usa tal cual, con carga diferida.
 */
export function imgDe(url: string, clase?: string): string {
  const claseAttr = clase ? ` class="${escapar(clase)}"` : '';
  const id = idDeDrive(url);
  return id !== null
    ? `<img data-drive="${escapar(id)}" alt=""${claseAttr}>`
    : `<img src="${escapar(url)}" alt="" loading="lazy"${claseAttr}>`;
}

export function tramosAHtml(tramos: TramoEnLinea[]): string {
  return tramos.map(t => {
    if (t.imagen) {
      const epigrafe = t.epigrafe ? `<span class="epigrafe">${escapar(t.epigrafe)}</span>` : '';
      return `<span class="foto-linea">${imgDe(t.imagen)}${epigrafe}</span>`;
    }
    let html = escapar(t.texto);
    if (t.link) html = `<a href="${escapar(t.link)}" target="_blank" rel="noopener">${html}</a>`;
    if (t.italica) html = `<em>${html}</em>`;
    if (t.negrita) html = `<strong>${html}</strong>`;
    return html;
  }).join('');
}

export function aHtml(texto: unknown): string {
  return bloques(texto).map(b => {
    // `'tramos' in b` angosta la unión donde `b.tipo === 'parrafo'` no alcanza:
    // el discriminante de esta rama es él mismo `'parrafo' | 'subtitulo'`, y TS
    // no lo excluye de la otra rama sólo comparando contra un literal.
    if ('tramos' in b) return b.tipo === 'parrafo' ? `<p>${tramosAHtml(b.tramos)}</p>` : `<h3>${tramosAHtml(b.tramos)}</h3>`;
    if (b.tipo === 'lista') return `<ul>${b.items.map(i => `<li>${tramosAHtml(i)}</li>`).join('')}</ul>`;
    return `<ol>${b.items.map(i => `<li>${tramosAHtml(i)}</li>`).join('')}</ol>`;
  }).join('');
}

const sinEsquema = (url: string): string => url.replace(/^https?:\/\//i, '');

/**
 * El texto para mandar por otra app: conserva lo que WhatsApp entiende como
 * formato —`*negrita*`, `_itálica_`— y saca la marca de links e imágenes.
 */
export function tramosATexto(tramos: TramoEnLinea[]): string {
  return tramos.map(t => {
    if (t.imagen) return t.imagen;
    let s = t.link
      ? (sinEsquema(t.link) === sinEsquema(t.texto) ? t.link : `${t.texto} (${t.link})`)
      : t.texto;
    if (t.italica) s = `_${s}_`;
    if (t.negrita) s = `*${s}*`;
    return s;
  }).join('');
}

/** Bloques separados por un renglón en blanco; lo que sigue a un `###` va pegado. */
export function aTexto(texto: unknown): string {
  const partes: string[] = [];
  let pegado = false;
  for (const b of bloques(texto)) {
    // Ídem `aHtml`: `'items' in b` es lo que angosta acá, no comparar `tipo`.
    const s = 'items' in b
      ? (b.tipo === 'lista' ? b.items.map(i => `- ${tramosATexto(i)}`).join('\n')
        : b.items.map((i, n) => `${n + 1}. ${tramosATexto(i)}`).join('\n'))
      : tramosATexto(b.tramos);
    partes.push((partes.length && !pegado ? '\n' : '') + s);
    pegado = b.tipo === 'subtitulo';
  }
  return partes.join('\n');
}

/** Los tramos como texto de pdfmake. Los estilos (`link`) los define el documento. */
export function tramosAPdf(tramos: TramoEnLinea[]): ContentText[] {
  return tramos.map(t => {
    const destino = t.link ?? t.imagen;
    return {
      text: t.imagen ?? t.texto,
      ...(t.negrita ? { bold: true } : {}),
      ...(t.italica ? { italics: true } : {}),
      ...(destino ? { link: destino, style: 'link' } : {})
    };
  });
}

/**
 * Un nodo por párrafo y por ítem, para que el documento pueda juntar un título
 * con lo primero que le sigue. Ningún ítem se parte entre páginas.
 */
export function aPdf(texto: unknown): Content[] {
  const nodos: Content[] = [];
  for (const b of bloques(texto)) {
    // Ídem `aHtml`: `'tramos' in b` es lo que angosta acá, no comparar `tipo`.
    if ('tramos' in b) {
      nodos.push(b.tipo === 'subtitulo'
        ? { text: tramosAPdf(b.tramos), style: 'subtitulo' }
        : { text: tramosAPdf(b.tramos), style: 'parrafo', unbreakable: true });
    } else if (b.tipo === 'lista') {
      for (const i of b.items) nodos.push({ ul: [{ text: tramosAPdf(i) }], style: 'lista', unbreakable: true });
    } else {
      b.items.forEach((i, n) => nodos.push({ ol: [{ text: tramosAPdf(i) }], start: n + 1, style: 'lista', unbreakable: true }));
    }
  }
  return nodos;
}

/**
 * La fuente es texto libre: una URL pelada, un link markdown, o «libro de
 * pescados, pág. 84». Las dos primeras son link; de la URL pelada se muestra el
 * sitio y no el esquema, que no informa nada. El texto libre va tal cual.
 */
export function tramosDeFuente(fuente: string): TramoEnLinea[] {
  // El parser del frontmatter deja el valor tal cual, comillas incluidas.
  const limpia = fuente.trim().replace(/^["'](.*)["']$/, '$1').trim();
  const md = limpia.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (md?.[1] && md[2] && esDestinoSeguro(md[2])) return [{ texto: md[1], link: md[2] }];
  if (/^https?:\/\/\S+$/i.test(limpia)) return [{ texto: sinEsquema(limpia), link: limpia }];
  return limpia ? [{ texto: limpia }] : [];
}
