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
import { parse, gruposDe, lineaDeIngrediente, empiezaConCantidad, pareceCantidad } from './recipe.js';
import {
  DURACIONES, DIFICULTADES, TAGS_ESPECIALES,
  duracionValida, dificultadValida, tagEspecial
} from './catalogo.js';
import { especialDeReservada } from './especiales.js';
import { resolver, referenciasSinFoto } from './fotos-receta.js';
import { marcasMalFormadas } from './marcas.js';
import { limpiarRecibido } from './conversion.js';
import type { Aviso, FotoDeReceta, Receta, ValorIgnorado } from './tipos.js';

/**
 * `error`: la receta no se escribe, porque se guardaría perdiendo algo o
 * rompiendo una regla del formato. `aviso`: se escribe igual; es lo que tienen
 * las recetas escritas antes de las reglas, que tienen que poder corregirse
 * conservando lo que no se toca.
 */
export type Nivel = 'error' | 'aviso';

/** Algo del `.md` que no es del formato: dónde está y qué hacer, en una línea. */
export interface Problema {
  /** La clave del frontmatter, `frontmatter`, `ingredientes`, `fotos` o `cuerpo`. */
  campo: string;
  nivel: Nivel;
  mensaje: string;
}

const lista = (xs: readonly string[]): string => xs.map(x => `\`${x}\``).join(', ');

/** Lo que el parser avisa, dicho para quien escribió el `.md`. */
const POR_AVISO: Record<Aviso, Problema> = {
  'sin-frontmatter': {
    campo: 'frontmatter',
    nivel: 'error',
    mensaje: 'Falta el frontmatter: el .md empieza con `---`, las claves y otro `---`.'
  },
  'frontmatter-ilegible': {
    campo: 'frontmatter',
    nivel: 'aviso',
    mensaje: 'El frontmatter tiene líneas que no son `clave: valor` ni ítems de una lista (`tags`, `tags_especiales`).'
  },
  'sin-titulo': {
    campo: 'titulo',
    nivel: 'error',
    mensaje: 'Falta `titulo` en el frontmatter, y es obligatoria.'
  },
  'seccion-duplicada': {
    campo: 'cuerpo',
    nivel: 'aviso',
    mensaje: 'Una sección está repetida: al leerla, la app junta las dos.'
  }
};

/**
 * Lo que el parser descartó de `tags` y `tags_especiales`. Todo es error: la
 * receta se guardaría perdiéndolo.
 */
function problemasDeIgnorados(ignorados: readonly ValorIgnorado[]): Problema[] {
  return ignorados.map(({ clave, valor }): Problema => {
    if (clave === 'tags_especiales') {
      return { campo: clave, nivel: 'error',
        mensaje: `\`${valor}\` no es un tag especial. \`tags_especiales\` acepta: ${lista(TAGS_ESPECIALES)}.` };
    }
    const especial = especialDeReservada(valor);
    if (especial && tagEspecial(valor) === especial) {
      return { campo: clave, nivel: 'error', mensaje: `\`${valor}\` es un tag especial: va en \`tags_especiales\`.` };
    }
    return especial
      ? { campo: clave, nivel: 'error', mensaje: `\`${valor}\` está reservado. Si es \`${especial}\`, va en \`tags_especiales\`.` }
      : { campo: clave, nivel: 'error', mensaje: `El tag \`${valor}\` está reservado y no se usa.` };
  });
}

/**
 * Un aviso por ingrediente, el primero que corresponda: el nombre que empieza
 * con una cantidad —`4 milanesas`, `una baguette`, `1,5 l de caldo`— la tiene
 * adelante; si no, una cantidad que no parece cantidad suele ser otro
 * ingrediente en la misma línea (`Sal - pimienta`).
 */
function problemasDeIngredientes(ingredientes: string): Problema[] {
  return gruposDe(ingredientes).flatMap(g => g.items).flatMap((i): Problema[] => {
    const linea = lineaDeIngrediente(i.crudo);
    if (empiezaConCantidad(i.nombre)) {
      return [{ campo: 'ingredientes', nivel: 'aviso',
        mensaje: `El ingrediente «${linea}» no tiene la forma \`- nombre — cantidad\`: la cantidad va después del nombre.` }];
    }
    if (i.cantidad !== null && !pareceCantidad(i.cantidad)) {
      return [{ campo: 'ingredientes', nivel: 'aviso',
        mensaje: `En el ingrediente «${linea}», «${i.cantidad}» no parece una cantidad: empieza con un número o es ` +
          '`a gusto`, `c/n` o `para …`. Si son dos ingredientes, van en dos líneas.' }];
    }
    return [];
  });
}

/** Los números que hay en el depósito, dichos para quien tiene que elegir uno. */
function disponibles(fotos: readonly FotoDeReceta[]): string {
  const numeros = fotos.map(f => f.n).sort((a, b) => a - b);
  return numeros.length ? `Hay: ${numeros.join(', ')}.` : 'El depósito está vacío.';
}

/**
 * Las referencias `foto:N` contra el depósito de la receta: quien arma el
 * depósito por su cuenta lo pone en la receta antes de validar.
 * `pendientes`: números de fotos que todavía no están en el depósito pero van
 * a estar al escribir. Quien escribe con fotos nuevas las nombra antes de
 * subirlas, y esas referencias no se borran al dibujar.
 */
function problemasDeFotos(leida: Receta, pendientes: readonly number[]): Problema[] {
  const receta: Receta = { ...leida, fotos: [...leida.fotos, ...pendientes.map(n => ({ n, url: `pendiente:${n}` }))] };
  const hay = disponibles(receta.fotos);
  const problemas: Problema[] = [];
  // `resolver` devuelve tal cual lo que no es `foto:N`: `null` es un número sin foto.
  if (receta.foto !== null && resolver(receta.foto, receta.fotos) === null) {
    problemas.push({
      campo: 'foto',
      nivel: 'error',
      mensaje: `\`foto: ${receta.foto}\` no está en el depósito de fotos. ${hay}`
    });
  }
  for (const n of referenciasSinFoto(receta)) {
    problemas.push({
      campo: 'fotos',
      nivel: 'error',
      mensaje: `La referencia a \`foto:${n}\` no está en el depósito de fotos: al dibujarse, se borra. ${hay}`
    });
  }
  return problemas;
}

/**
 * Las marcas de temporizador que la app lee como texto común: se perderían sin
 * avisar.
 */
function problemasDeMarcas(receta: Receta): Problema[] {
  const cuerpo = [receta.descripcion, receta.ingredientes, receta.preparacion, receta.variaciones, receta.notas,
    ...receta.otras.map(o => o.cuerpo)].join('\n');
  return marcasMalFormadas(cuerpo).map(marca => ({
    campo: 'cuerpo',
    nivel: 'error',
    mensaje: `\`${marca}\` no es una marca de temporizador: se escribe \`[texto](cuenta:50:00 "etiqueta")\` ` +
      '(`m:ss` o `h:mm:ss`, hasta 23:59:59) o `[texto](cronometro: "etiqueta")`, con la etiqueta opcional.'
  }));
}

/** Las opciones de la validación. */
export interface OpcionesValidar {
  /** Los números de las fotos que se suben junto con el `.md`: cuentan como si ya estuvieran en el depósito. */
  fotosPendientes?: readonly number[];
}

/**
 * El `.md` como lo lee la app, limpiado antes como al pegar: un agente lo
 * puede devolver con CRLF, en un bloque de código o citado.
 */
export function leerRecibido(md: string): Receta {
  return parse(limpiarRecibido(md) + '\n');
}

/** Lo que una receta ya leída con `leerRecibido` tiene fuera del formato. */
export function problemasDe(
  receta: Receta, { fotosPendientes = [] }: OpcionesValidar = {}
): Problema[] {
  const problemas: Problema[] = receta.avisos.map(a => ({ ...POR_AVISO[a] }));
  if (receta.tiempo !== null && !duracionValida(receta.tiempo)) {
    problemas.push({
      campo: 'tiempo',
      nivel: 'error',
      mensaje: `\`tiempo: ${receta.tiempo}\` no es uno de sus valores: ${lista(DURACIONES)}.`
    });
  }
  if (receta.dificultad !== null && !dificultadValida(receta.dificultad)) {
    problemas.push({
      campo: 'dificultad',
      nivel: 'error',
      mensaje: `\`dificultad: ${receta.dificultad}\` no es uno de sus valores: ${lista(DIFICULTADES)}.`
    });
  }
  for (const clave of Object.keys(receta.extras)) {
    problemas.push({ campo: clave, nivel: 'aviso', mensaje: `\`${clave}\` es una clave desconocida del frontmatter.` });
  }

  problemas.push(
    ...problemasDeIgnorados(receta.ignorados),
    ...problemasDeIngredientes(receta.ingredientes),
    ...problemasDeMarcas(receta),
    ...problemasDeFotos(receta, fotosPendientes)
  );
  return problemas;
}

/**
 * La receta como la lee la app y lo que tiene fuera del formato. La receta
 * devuelta es siempre la del `.md`, sin las fotos pendientes.
 */
export function validarMd(md: string, opciones: OpcionesValidar = {}): { receta: Receta; problemas: Problema[] } {
  const receta = leerRecibido(md);
  return { receta, problemas: problemasDe(receta, opciones) };
}
