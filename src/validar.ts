/**
 * Validar un `.md` de receta antes de escribirlo: cómo lo lee la app y qué
 * tiene que no es del formato. Es lo que corre quien escribe recetas desde
 * afuera del editor, que no tiene los controles del editor para no
 * equivocarse.
 *
 * Módulo puro y sin reglas propias: cada problema sale del parser, de las
 * constantes de `catalogo.ts` o del depósito de `fotos-receta.ts`. Un valor
 * que la app lee como ausente —un `tiempo` fuera de sus cinco valores— se
 * informa, porque la receta se guardaría perdiéndolo sin avisar.
 */
import { parse, gruposDe } from './recipe.js';
import {
  DURACIONES, DIFICULTADES, TAGS_ESPECIALES,
  duracionValida, dificultadValida, tagReservado, tagEspecial
} from './catalogo.js';
import { resolver, referenciasSinFoto } from './fotos-receta.js';
import { limpiarRecibido } from './conversion.js';
import type { Aviso, Receta } from './tipos.js';

/** Algo del `.md` que no es del formato: dónde está y qué hacer, en una línea. */
export interface Problema {
  /** La clave del frontmatter, `frontmatter`, `ingredientes`, `fotos` o `cuerpo`. */
  campo: string;
  mensaje: string;
}

const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');

/** Lo que el parser avisa, dicho para quien escribió el `.md`. */
const POR_AVISO: Record<Aviso, Problema> = {
  'sin-frontmatter': {
    campo: 'frontmatter',
    mensaje: 'Falta el frontmatter: el .md empieza con `---`, las claves y otro `---`.'
  },
  'frontmatter-ilegible': {
    campo: 'frontmatter',
    mensaje: 'El frontmatter tiene líneas que no son `clave: valor` ni ítems de `tags`.'
  },
  'sin-titulo': {
    campo: 'titulo',
    mensaje: 'Falta `titulo` en el frontmatter, y es obligatoria.'
  },
  'seccion-duplicada': {
    campo: 'cuerpo',
    mensaje: 'Una sección está repetida: al leerla, la app junta las dos.'
  }
};

function problemasDeTags(tags: string[]): Problema[] {
  return tags
    .filter(t => tagReservado(t) && !(TAGS_ESPECIALES as readonly string[]).includes(t))
    .map(t => {
      const especial = tagEspecial(t);
      return {
        campo: 'tags',
        mensaje: especial
          ? `El tag \`${t}\` es otra forma de un tag especial: escribirlo \`${especial}\`.`
          : `El tag \`${t}\` está reservado y no se usa.`
      };
    });
}

/** Un ingrediente que no se parte en nombre y cantidad y empieza con un número tiene la cantidad adelante. */
function problemasDeIngredientes(ingredientes: string): Problema[] {
  return gruposDe(ingredientes)
    .flatMap(g => g.items)
    .filter(i => i.cantidad === null && /^\p{N}/u.test(i.nombre))
    .map(i => ({
      campo: 'ingredientes',
      mensaje: `El ingrediente «${i.nombre}» no tiene la forma \`- nombre — cantidad\`: la cantidad va después del nombre.`
    }));
}

function problemasDeFotos(receta: Receta): Problema[] {
  const problemas: Problema[] = [];
  // `resolver` devuelve tal cual lo que no es `foto:N`: `null` es un número sin foto.
  if (receta.foto !== null && resolver(receta.foto, receta.fotos) === null) {
    problemas.push({
      campo: 'foto',
      mensaje: `\`foto: ${receta.foto}\` no está en el depósito de fotos.`
    });
  }
  for (const n of referenciasSinFoto(receta)) {
    problemas.push({
      campo: 'fotos',
      mensaje: `La referencia a \`foto:${n}\` no está en el depósito de fotos: al dibujarse, se borra.`
    });
  }
  return problemas;
}

/**
 * La receta como la lee la app y lo que tiene fuera del formato. El texto se
 * limpia antes como al pegar: un agente lo puede devolver con CRLF, en un
 * bloque de código o citado.
 */
export function validarMd(md: string): { receta: Receta; problemas: Problema[] } {
  const receta = parse(limpiarRecibido(md) + '\n');
  const problemas: Problema[] = receta.avisos.map(a => ({ ...POR_AVISO[a] }));

  if (receta.tiempo !== null && !duracionValida(receta.tiempo)) {
    problemas.push({
      campo: 'tiempo',
      mensaje: `\`tiempo: ${receta.tiempo}\` no es uno de sus valores: ${lista(DURACIONES)}.`
    });
  }
  if (receta.dificultad !== null && !dificultadValida(receta.dificultad)) {
    problemas.push({
      campo: 'dificultad',
      mensaje: `\`dificultad: ${receta.dificultad}\` no es uno de sus valores: ${lista(DIFICULTADES)}.`
    });
  }
  for (const clave of Object.keys(receta.extras)) {
    problemas.push({ campo: clave, mensaje: `\`${clave}\` es una clave desconocida del frontmatter.` });
  }

  problemas.push(
    ...problemasDeTags(receta.tags),
    ...problemasDeIngredientes(receta.ingredientes),
    ...problemasDeFotos(receta)
  );
  return { receta, problemas };
}
