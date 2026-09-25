/**
 * El depósito de fotos de una receta (spec `2026-09-19-fotos-de-recetas-design.md`
 * §3-4): la sección `## Fotos` del cuerpo, las referencias `![epígrafe](foto:N)`
 * que la nombran desde cualquier parte del texto, y cómo el editor escribe una
 * de esas referencias en la línea donde está el cursor.
 *
 * Módulo puro: no toca Drive ni el DOM. Lo consumen `recipe.ts` (parsear y
 * serializar la sección) y las pantallas que necesitan la receta ya resuelta.
 */
import type { FotoDeReceta, Receta, UsoDeFoto } from './tipos.js';

/** El link de Drive de una foto, para quien la lea con el conector de Drive. */
export const linkDeFoto = (id: string): string =>
  `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

/**
 * El link a un archivo de Drive, en las formas en que Drive lo reparte y en
 * las que quedan al pegarlo a mano: con `/view`, `/edit`, `/preview` o nada, y
 * con la query o el fragmento que venga (`?usp=sharing`). Otro dominio u otro
 * camino no son un link de foto: la URL se usa tal cual, como cualquier
 * externa.
 */
const PATRON_LINK_DRIVE =
  /^https:\/\/drive\.google\.com\/file\/d\/([^/?#]+)(?:\/(?:view|edit|preview))?\/?(?:[?#].*)?$/;

export function idDeDrive(url: string): string | null {
  const id = url.match(PATRON_LINK_DRIVE)?.[1];
  if (id === undefined) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

/** Una línea de `## Fotos`: `- <número>: <url>`, sin margen para nada más. */
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
 * La receta con la cabecera y cada referencia ya resueltas: lo único que
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

/** Cada sección del cuerpo, las ajenas incluidas: donde puede haber una referencia. */
const textosDe = (receta: Receta): string[] =>
  [receta.descripcion, receta.ingredientes, receta.preparacion, receta.variaciones, receta.notas,
    ...receta.otras.map(o => o.cuerpo)];

/**
 * En qué se usa cada foto del depósito, por número. **Va sobre la receta
 * cruda**, la que salió de `parse`: después de `resolverReceta` no queda
 * ninguna `foto:N` que buscar. Es lo único que decide el uso; nadie más
 * vuelve a buscar referencias por su cuenta.
 *
 * Una `foto:` o una referencia que apuntan a un número que no está en el
 * depósito no marcan nada: el mapa tiene una entrada por foto y ninguna más.
 */
export function usosDeFotos(receta: Receta): Map<number, UsoDeFoto> {
  const portada = receta.foto?.match(PATRON_FOTO_N)?.[1];
  const enElTexto = new Set<number>();
  for (const texto of textosDe(receta))
    for (const m of texto.matchAll(PATRON_REFERENCIA)) enElTexto.add(Number(m[2]));
  return new Map(receta.fotos.map(f => [f.n, {
    portada: portada !== undefined && Number(portada) === f.n,
    enElTexto: enElTexto.has(f.n)
  }]));
}

/**
 * Los números que nombra una referencia `![](foto:N)` del cuerpo y que no
 * están en el depósito, sin repetir y en el orden en que aparecen. Al
 * dibujarse esas referencias se borran (`resolverReceta`): quien escribe la
 * receta tiene que enterarse antes. Va sobre la receta cruda, como
 * `usosDeFotos`.
 */
export function referenciasSinFoto(receta: Receta): number[] {
  const hay = new Set(receta.fotos.map(f => f.n));
  const faltan = new Set<number>();
  for (const texto of textosDe(receta))
    for (const m of texto.matchAll(PATRON_REFERENCIA))
      if (!hay.has(Number(m[2]))) faltan.add(Number(m[2]));
  return [...faltan];
}

/**
 * Las fotos que no usa ni la cabecera ni el texto, en el orden del depósito:
 * las únicas que se muestran aparte —el carrusel de la receta, la galería del
 * PDF—, porque las demás ya se ven donde van.
 */
export function fotosSinUso(receta: Receta): FotoDeReceta[] {
  const usos = usosDeFotos(receta);
  return receta.fotos.filter(f => {
    const uso = usos.get(f.n);
    return !uso || (!uso.portada && !uso.enElTexto);
  });
}

/** Una imagen markdown con destino `http(s)`, ya resuelta: `![epígrafe](url)`. */
const PATRON_IMAGEN_RESUELTA = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * La receta **sin resolver** y sin nada de Drive: se van las líneas de Drive
 * del depósito, las referencias que las nombraban, una cabecera que apunte a
 * una de ellas y cualquier imagen con una URL de Drive escrita en el texto.
 * Las externas quedan como estaban: `foto:N` en la cabecera y en el texto, con
 * su línea en el depósito.
 *
 * **Sin resolver a propósito:** es lo que viaja en el link compartido, y
 * del otro lado el invitado tiene que poder calcular el uso de cada foto
 * (`usosDeFotos`). Resolviéndola antes no quedaría ninguna `foto:N` que contar
 * y el carrusel volvería a repetir la portada y las de una línea.
 */
export function sinFotosDeDrive(receta: Receta): Receta {
  const deDrive = receta.fotos.filter(f => idDeDrive(f.url) !== null).map(f => f.n);
  const sinDrive = (texto: string) => {
    const sinReferencias = deDrive.reduce((t, n) => sacarReferencias(t, n), texto);
    // Una URL de Drive escrita a mano en el texto, sin pasar por el depósito.
    return sinReferencias.replace(PATRON_IMAGEN_RESUELTA, (imagen, _epigrafe, url: string) => idDeDrive(url) ? '' : imagen);
  };
  const n = receta.foto?.match(PATRON_FOTO_N)?.[1];
  const fotos = receta.fotos.filter(f => idDeDrive(f.url) === null);
  return {
    ...receta,
    foto: receta.foto === null ? null
      : n !== undefined ? (fotos.some(f => f.n === Number(n)) ? receta.foto : null)
      : idDeDrive(receta.foto) ? null : receta.foto,
    descripcion: sinDrive(receta.descripcion),
    ingredientes: sinDrive(receta.ingredientes),
    preparacion: sinDrive(receta.preparacion),
    variaciones: sinDrive(receta.variaciones),
    notas: sinDrive(receta.notas),
    otras: receta.otras.map(o => ({ ...o, cuerpo: sinDrive(o.cuerpo) })),
    fotos
  };
}

/**
 * La misma, ya resuelta a URLs: lo que dibuja el invitado y lo que arma el
 * texto plano, que no tienen token para pedirle nada a Drive.
 */
export const resueltaSinFotosDeDrive = (receta: Receta): Receta => resolverReceta(sinFotosDeDrive(receta));

/**
 * En qué línea del texto está el cursor: las líneas son las lógicas —las que
 * separa un `\n`—, así que el ajuste de línea en pantalla no cuenta. Una
 * posición fuera del texto se recorta a sus extremos: el `selectionStart` de
 * un campo que todavía no se tocó llega en 0.
 */
export function lineaDelCursor(texto: string, posicion: number): number {
  const tope = Math.min(Math.max(posicion, 0), texto.length);
  return texto.slice(0, tope).split('\n').length - 1;
}

/** Si ya tiene esta referencia, en cualquier epígrafe. */
const tieneReferencia = (texto: string, n: number): boolean => texto.includes(`(foto:${n})`);

/**
 * Agrega ` ![](foto:N)` al final de una línea del texto —la del cursor—. En
 * una línea vacía la referencia queda sola, sin el espacio adelante. Si la
 * línea ya la tiene, no la repite; si esa línea no existe, el texto no cambia.
 */
export function ponerEn(texto: string, linea: number, n: number): string {
  const referencia = `![](foto:${n})`;
  const lineas = texto.split('\n');
  const actual = lineas[linea];
  if (actual === undefined || tieneReferencia(actual, n)) return texto;
  lineas[linea] = actual ? `${actual} ${referencia}` : referencia;
  return lineas.join('\n');
}

/** Borra todas las `![…](foto:N)` de un texto, con el espacio que las separaba del resto. */
export function sacarReferencias(texto: string, n: number): string {
  const patron = new RegExp(` ?!\\[[^\\]]*\\]\\(foto:${n}\\)`, 'g');
  return texto.replace(patron, '');
}
