/**
 * El depósito de fotos de una receta (spec `2026-09-19-fotos-de-recetas-design.md`
 * §3-4): la sección `## Fotos` del cuerpo, las referencias `![epígrafe](foto:N)`
 * que la nombran desde cualquier parte del texto, y los lugares donde el
 * editor puede escribir una de esas referencias con *Poner en…*.
 *
 * Módulo puro: no toca Drive ni el DOM. Lo consumen `recipe.ts` (parsear y
 * serializar la sección) y las pantallas que necesitan la receta ya resuelta.
 */
import type { FotoDeReceta, Lugar, Receta } from './tipos.js';

/** El link de Drive de una foto, para quien la lea con el conector de Drive. */
export const linkDeFoto = (id: string): string =>
  `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

/** Sólo reconoce el formato que escribe `linkDeFoto`; cualquier otro da `null`. */
const PATRON_LINK_DRIVE = /^https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view$/;

export function idDeDrive(url: string): string | null {
  const id = url.match(PATRON_LINK_DRIVE)?.[1];
  if (id === undefined) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

/** Una línea de `## Fotos`: `- <número>: <url>`, sin margen para nada más (§3). */
const PATRON_LINEA_FOTO = /^- (\d+): (https?:\/\/\S+)$/;

/**
 * La sección `## Fotos`, de vuelta a su depósito. `null` si alguna línea no
 * vacía no tiene esa forma: ahí la sección se conserva como ajena (`recipe.ts`)
 * y la receta queda sin depósito, en vez de perder datos.
 */
export function parsearFotos(cuerpo: string): FotoDeReceta[] | null {
  const fotos: FotoDeReceta[] = [];
  for (const linea of cuerpo.split('\n')) {
    if (!linea.trim()) continue;
    const m = linea.match(PATRON_LINEA_FOTO);
    const n = m?.[1];
    const url = m?.[2];
    if (n === undefined || url === undefined) return null;
    fotos.push({ n: Number(n), url });
  }
  return fotos;
}

/** El depósito, de vuelta a texto. El orden de las líneas es el del arreglo. */
export function serializarFotos(fotos: FotoDeReceta[]): string {
  return fotos.map(f => `- ${f.n}: ${f.url}`).join('\n');
}

/** El número más alto más uno, o 1 si el depósito está vacío. Nunca se reusa uno. */
export function siguienteNumero(fotos: FotoDeReceta[]): number {
  return fotos.reduce((max, f) => Math.max(max, f.n), 0) + 1;
}

/** `foto:N` en cualquier destino de imagen: la cabecera o una referencia del cuerpo. */
const PATRON_FOTO_N = /^foto:(\d+)$/;

/**
 * Lo que dibujar para una `foto` o un destino de imagen: `foto:N` da la URL
 * de su línea en el depósito, o `null` si no está; cualquier otra cosa —una
 * URL— se devuelve tal cual.
 */
export function resolver(valor: string | null, fotos: FotoDeReceta[]): string | null {
  if (valor === null) return null;
  const n = valor.match(PATRON_FOTO_N)?.[1];
  if (n === undefined) return valor;
  return fotos.find(f => f.n === Number(n))?.url ?? null;
}

/** Una referencia `![epígrafe](foto:N)` en cualquier parte del cuerpo. */
const PATRON_REFERENCIA = /!\[([^\]]*)\]\(foto:(\d+)\)/g;

/** Cada `foto:N` del texto, cambiado por su URL; sin depósito para ese número, la referencia se borra entera. */
function resolverTexto(texto: string, fotos: FotoDeReceta[]): string {
  return texto.replace(PATRON_REFERENCIA, (referencia, epigrafe: string, n: string) => {
    const url = fotos.find(f => f.n === Number(n))?.url;
    return url === undefined ? '' : `![${epigrafe}](${url})`;
  });
}

/**
 * La receta con la cabecera y cada referencia ya resueltas (§3): lo único que
 * ven la lectura, la cocina, el texto y el PDF. No muta la que recibe, y el
 * depósito sigue siendo el mismo.
 */
export function resolverReceta(receta: Receta): Receta {
  return {
    ...receta,
    foto: resolver(receta.foto, receta.fotos),
    descripcion: resolverTexto(receta.descripcion, receta.fotos),
    ingredientes: resolverTexto(receta.ingredientes, receta.fotos),
    preparacion: resolverTexto(receta.preparacion, receta.fotos),
    variaciones: resolverTexto(receta.variaciones, receta.fotos),
    notas: resolverTexto(receta.notas, receta.fotos),
    otras: receta.otras.map(o => ({ ...o, cuerpo: resolverTexto(o.cuerpo, receta.fotos) }))
  };
}

/** Una imagen markdown con destino `http(s)`, ya resuelta: `![epígrafe](url)`. */
const PATRON_IMAGEN_RESUELTA = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * La receta resuelta sin ninguna URL de Drive: ni en la cabecera, ni en el
 * texto, ni en el depósito. La usan el link compartido y el texto plano, que
 * no llevan fotos que pidan el token de Drive.
 */
export function sinFotosDeDrive(receta: Receta): Receta {
  const resuelta = resolverReceta(receta);
  const sinDrive = (texto: string) =>
    texto.replace(PATRON_IMAGEN_RESUELTA, (imagen, _epigrafe, url: string) => idDeDrive(url) ? '' : imagen);
  return {
    ...resuelta,
    foto: resuelta.foto !== null && idDeDrive(resuelta.foto) ? null : resuelta.foto,
    descripcion: sinDrive(resuelta.descripcion),
    ingredientes: sinDrive(resuelta.ingredientes),
    preparacion: sinDrive(resuelta.preparacion),
    variaciones: sinDrive(resuelta.variaciones),
    notas: sinDrive(resuelta.notas),
    otras: resuelta.otras.map(o => ({ ...o, cuerpo: sinDrive(o.cuerpo) })),
    fotos: resuelta.fotos.filter(f => !idDeDrive(f.url))
  };
}

/** El nombre de cada sección cuando `lineasDeLaReceta` no tiene un `###` que la agrupe. */
const NOMBRE_SECCION = {
  descripcion: 'Descripción',
  ingredientes: 'Ingredientes',
  preparacion: 'Preparación',
  variaciones: 'Variaciones',
  notas: 'Notas'
} as const;

/** Los ingredientes o los pasos, línea por línea, agrupados por el `###` que los contiene. */
function lineasDeSeccion(texto: string, seccion: 'ingredientes' | 'preparacion'): Lugar[] {
  const lugares: Lugar[] = [];
  let grupo: string = NOMBRE_SECCION[seccion];
  texto.split('\n').forEach((linea, indice) => {
    const encabezado = linea.match(/^###\s+(.+?)\s*$/)?.[1];
    if (encabezado !== undefined) { grupo = encabezado.trim(); return; }
    if (!linea.trim()) return;
    lugares.push({ seccion, linea: indice, texto: linea.trim(), grupo });
  });
  return lugares;
}

/**
 * Los lugares donde se puede poner una foto, para *Poner en…*: la
 * descripción, cada ingrediente, cada paso, las variaciones y las notas, en
 * ese orden (spec §4, sin condición). Descripción, variaciones y notas dan
 * su lugar aunque estén vacías —poner la primera foto ahí es un caso real,
 * y `ponerEn` con texto vacío no deja un renglón en blanco adelante—;
 * ingredientes y pasos sólo dan uno por línea existente.
 */
export function lineasDeLaReceta(receta: Receta): Lugar[] {
  return [
    { seccion: 'descripcion', linea: null, texto: receta.descripcion.trim(), grupo: NOMBRE_SECCION.descripcion },
    ...lineasDeSeccion(receta.ingredientes, 'ingredientes'),
    ...lineasDeSeccion(receta.preparacion, 'preparacion'),
    { seccion: 'variaciones', linea: null, texto: receta.variaciones.trim(), grupo: NOMBRE_SECCION.variaciones },
    { seccion: 'notas', linea: null, texto: receta.notas.trim(), grupo: NOMBRE_SECCION.notas }
  ];
}

/** Si ya tiene esta referencia, en cualquier epígrafe. */
const tieneReferencia = (texto: string, n: number): boolean => texto.includes(`(foto:${n})`);

/**
 * Agrega ` ![](foto:N)` al final de la línea de un ingrediente o un paso, o
 * un renglón nuevo al final del texto para la descripción, las variaciones o
 * las notas. Si la línea ya la tiene —o, sin línea, si el texto ya la
 * tiene—, no la repite.
 */
export function ponerEn(texto: string, linea: number | null, n: number): string {
  const referencia = `![](foto:${n})`;
  if (linea === null) {
    if (tieneReferencia(texto, n)) return texto;
    return texto ? `${texto}\n${referencia}` : referencia;
  }
  const lineas = texto.split('\n');
  const actual = lineas[linea];
  if (actual === undefined || tieneReferencia(actual, n)) return texto;
  lineas[linea] = `${actual} ${referencia}`;
  return lineas.join('\n');
}

/** Borra todas las `![…](foto:N)` de un texto, con el espacio que las separaba del resto. */
export function sacarReferencias(texto: string, n: number): string {
  const patron = new RegExp(` ?!\\[[^\\]]*\\]\\(foto:${n}\\)`, 'g');
  return texto.replace(patron, '');
}
