/**
 * La receta como texto, para el menú Compartir. Casi el `.md`: sin
 * frontmatter, sin `#`, con la negrita y la itálica que WhatsApp entiende.
 */
import { aTexto, tramosATexto, tramosDeFuente } from './ui/markdown.js';
import { contextoDe } from './recipe.js';
import { resueltaSinFotosDeDrive } from './fotos-receta.js';
import type { Receta } from './tipos.js';

const SECCIONES = [
  ['ingredientes', 'Ingredientes'],
  ['preparacion', 'Preparación'],
  ['variaciones', 'Variaciones'],
  ['notas', 'Notas']
] as const;

export function textoReceta(sinResolver: Receta, categoria: string): string {
  // Una referencia a una foto externa se escribe como su URL, como cualquier
  // imagen de hoy; una de Drive no se escribe, porque nadie más la puede abrir
  // (§10). La sección Fotos no va: el depósito no es texto.
  const receta = resueltaSinFotosDeDrive(sinResolver);
  const partes: string[] = [[receta.titulo ?? 'Sin título', contextoDe(receta, categoria)].filter(Boolean).join('\n')];
  const descripcion = aTexto(receta.descripcion);
  if (descripcion) partes.push(descripcion);
  for (const [clave, nombre] of SECCIONES) {
    const cuerpo = aTexto(receta[clave]);
    if (cuerpo) partes.push(`${nombre}\n${cuerpo}`);
  }
  for (const otra of receta.otras) {
    const cuerpo = aTexto(otra.cuerpo);
    if (cuerpo) partes.push(`${otra.encabezado}\n${cuerpo}`);
  }
  const fuente = receta.fuente ? tramosATexto(tramosDeFuente(receta.fuente)) : '';
  if (fuente) partes.push(`Fuente: ${fuente}`);
  return partes.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
