/**
 * Lo que llega por el menú Compartir de otra app: un link, un texto o las dos
 * cosas, repartido entre la fuente y la nota de la receta que se va a crear.
 */

/** El primer link de un texto: lo que casi todas las apps mandan compartido. */
const LINK = /https?:\/\/\S+/i;

/**
 * Lo que llega del menú Compartir, repartido entre la fuente y la nota: la
 * fuente es el link —`url` si vino; si no, el primero que haya en el texto— y
 * la nota es lo que sobra del texto. Un texto sin link —una receta copiada de
 * un chat— va entero a la nota, que es lo que después se convierte.
 */
export function desdeCompartido({ url, text }: { url: string; text: string }): { fuente: string; nota: string } {
  const fuente = url.trim() || (text.match(LINK)?.[0] ?? '');
  const nota = (fuente ? text.split(fuente).join(' ') : text)
    .split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n').trim();
  return { fuente, nota };
}

const dosCifras = (n: number): string => String(n).padStart(2, '0');

/** El título de una receta que se guardó sin uno: el día y la hora. */
export function tituloPorDefecto(fecha: Date): string {
  return `Borrador ${dosCifras(fecha.getDate())}/${dosCifras(fecha.getMonth() + 1)} ` +
    `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`;
}

/**
 * El título que se puso solo, con el día y la hora: no dice nada del plato,
 * así que al pedirle la receta al agente no viaja.
 */
export const esTituloPorDefecto = (titulo: string): boolean =>
  /^Borrador \d{2}\/\d{2} \d{2}:\d{2}$/.test(titulo.trim());
