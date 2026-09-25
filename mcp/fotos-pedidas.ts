// Las fotos que el agente pide subir con una receta, y el número que va a
// tener cada una en el depósito. El número se sabe antes de subir, así el
// `.md` las nombra con `foto:N` desde el principio y `validar` lo acepta.
import { siguienteNumero } from '../src/fotos-receta.js';
import type { FotoDeReceta } from '../src/tipos.js';

/** Una foto pedida: una ruta local o una URL, y para qué es. */
export interface FotoPedida {
  origen: string;
  uso: 'plato' | 'paso' | 'fuente';
}

/**
 * El número de cada foto pedida, en el orden en que se piden: siguen al más
 * alto del depósito actual (vacío al crear, así la i-ésima es `foto:i`). Cada
 * pedida tiene su número aunque no se suba —una `fuente` ya volcada—: los
 * números nunca se reusan y los huecos valen.
 */
export function numerosDeFotos(pedidas: readonly FotoPedida[], deposito: readonly FotoDeReceta[]): number[] {
  const primero = siguienteNumero([...deposito]);
  return pedidas.map((_, i) => primero + i);
}

/** Una foto pedida que se sube, con su número. */
export interface FotoASubir {
  n: number;
  pedida: FotoPedida;
}

/**
 * Las pedidas que se suben, cada una con su número de `numerosDeFotos`. Una
 * `fuente` se sube sólo si la receta lleva `borrador`: si no, su contenido ya
 * pasó a la receta y la foto sobra, pero su número queda sin usar igual.
 */
export function fotosQueSeSuben(
  pedidas: readonly FotoPedida[], deposito: readonly FotoDeReceta[], { conBorrador }: { conBorrador: boolean }
): FotoASubir[] {
  const numeros = numerosDeFotos(pedidas, deposito);
  return pedidas.flatMap((pedida, i) => {
    const n = numeros[i];
    return n === undefined || (pedida.uso === 'fuente' && !conBorrador) ? [] : [{ n, pedida }];
  });
}

/**
 * La portada de la receta: la que trae el `.md`, o si no trae ninguna, la
 * primera foto del plato que se sube.
 */
export function portadaCon(foto: string | null, seSuben: readonly FotoASubir[]): string | null {
  if (foto) return foto;
  const plato = seSuben.find(s => s.pedida.uso === 'plato');
  return plato ? `foto:${plato.n}` : null;
}
