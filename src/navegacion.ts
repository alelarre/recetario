/**
 * La navegación: el único lugar que toca `location` y `history`, y la única
 * regla para saber si hay una pantalla atrás.
 *
 * La **profundidad** es cuántas pantallas de la app hay atrás de la actual, y
 * viaja en `history.state` como `{ profundidad }`. Al arrancar, la entrada
 * actual queda con 0; cada entrada nueva lleva la de la anterior más uno; y
 * volver a una entrada anterior la recupera de su `state`. `history.length` no
 * sirve para esto: cuenta también las entradas de adelante y las de otros
 * sitios, y un volver que se guiara por él saldría de la app.
 *
 * Las navegaciones propias cambian el hash y dejan que el `hashchange` dibuje,
 * igual que un `<a href>`: hay un solo camino hasta la pantalla.
 *
 * Una **capa** es lo que se abre sin cambiar de pantalla —el menú en el
 * teléfono, el visor, una ficha, la categoría de *Agregar al plan*—: suma una
 * entrada con el mismo hash y `state.capa`, así el atrás la cierra en vez de
 * salir de la pantalla. Tiene la profundidad de su pantalla: no es otra
 * pantalla atrás. Cerrarla de otra forma consume su entrada, y navegar desde
 * ella la saltea: el historial no queda con entradas de más.
 */

/** Lo que la navegación usa de `location` y de `history`. */
export interface EntornoDeNavegacion {
  location: { hash: string; replace(url: string): void };
  history: {
    readonly state: unknown;
    back(): void;
    go(n: number): void;
    pushState(state: unknown, titulo: string, url?: string | null): void;
    replaceState(state: unknown, titulo: string, url?: string | null): void;
  };
}

/**
 * Cómo llegó la entrada del `hashchange`:
 * - `nueva`: una entrada que se agregó adelante, por un `<a href>`, la barra
 *   del navegador o `ir`;
 * - `conocida`: una a la que se volvió, o la que puso `reemplazar`;
 * - `deshecha`: la vuelta que pidió `deshacer`, que no se dibuja.
 */
export type Llegada = 'nueva' | 'conocida' | 'deshecha';

const profundidadDe = (state: unknown): number | null => {
  const p = (state as { profundidad?: unknown } | null)?.profundidad;
  return typeof p === 'number' && Number.isInteger(p) && p >= 0 ? p : null;
};

const capaDe = (state: unknown): string | null => {
  const c = (state as { capa?: unknown } | null)?.capa;
  return typeof c === 'string' && c ? c : null;
};

/** Si `hash` es la pantalla `prefijo` o una de las suyas: `#/r/f1` abarca `#/r/f1/editar`, no `#/r/f10`. */
const esDe = (hash: string, prefijo: string): boolean =>
  hash === prefijo || hash.startsWith(`${prefijo}/`) || hash.startsWith(`${prefijo}?`);

export function crearNavegacion({ location, history }: EntornoDeNavegacion) {
  let profundidad = 0;
  /** Se pidió `deshacer`: el próximo `hashchange` es esa vuelta. */
  let deshaciendo = false;
  /**
   * El hash de cada entrada de la sesión, por profundidad. Lo de adelante de
   * la actual sigue mientras no se agregue otra entrada: el atrás no lo borra.
   */
  let hashes: string[] = [];
  /**
   * Cuántas entradas agregó `ir` que todavía no llegaron por `hashchange`.
   * `ir` suma sólo si el hash cambió de verdad: cada una tiene su aviso.
   */
  let propias = 0;
  /** La capa abierta, cuya entrada es la actual; o `null`. */
  let capa: string | null = null;
  /**
   * La capa quedó atrás de la entrada que está llegando: llegó un link con
   * ella abierta. Deshacer ese link vuelve a la pantalla, no a la capa. Vale
   * hasta el `hashchange` siguiente al de ese link.
   */
  let capaAtras = false;
  /** Lo que se hace cuando llegue el `popstate` de la salida de la capa. */
  let alSalirDeLaCapa: (() => void) | null = null;
  /** A quién se le avisa que el atrás cerró la capa. */
  let alCerrar: (capa: string) => void = () => {};

  /** La entrada actual tiene este hash; `nueva` descarta las de adelante, como el navegador. */
  const anotar = (hash: string, nueva: boolean): void => {
    if (nueva) hashes = hashes.slice(0, profundidad);
    hashes[profundidad] = hash;
  };

  /** Le pone a la entrada actual la profundidad `p`, sin cambiar la URL. */
  const marcar = (p: number): void => {
    profundidad = p;
    history.replaceState({ profundidad: p }, '');
  };

  /** Retrocede `n` entradas, que tienen que estar. */
  const retroceder = (n: number): void => {
    if (n === 1) history.back();
    else history.go(-n);
  };

  const hayAtras = (n = 1): boolean => profundidad >= n;

  /**
   * La capa se da por cerrada sin avisar: la cierra quien navega. Devuelve
   * cuántas entradas suma al retroceder, la de la capa si está.
   */
  const soltarCapa = (): number => {
    const habia = capa !== null && capaDe(history.state) === capa;
    capa = null;
    return habia ? 1 : 0;
  };

  /** Reemplaza la entrada actual: la pantalla que se deja no queda en el historial. */
  function reemplazar(hash: string): void {
    // Desde una capa, lo que se reemplaza es la pantalla y no la capa: primero
    // se sale de ella, y el reemplazo va cuando el `popstate` confirma.
    if (soltarCapa()) {
      alSalirDeLaCapa = () => reemplazar(hash);
      history.back();
      return;
    }
    if (hash !== location.hash) location.replace(hash);
    marcar(profundidad);
    anotar(location.hash, false);
  }

  return {
    /**
     * El arranque: la entrada actual es la primera pantalla de la app, con
     * profundidad 0. Con `url` la pone en lugar de la que abrió la app, sin
     * dibujar nada: dibuja el que arranca.
     */
    arrancar(url?: string): void {
      profundidad = 0;
      deshaciendo = false;
      propias = 0;
      capa = null;
      capaAtras = false;
      alSalirDeLaCapa = null;
      if (url === undefined) history.replaceState({ profundidad: 0 }, '');
      else history.replaceState({ profundidad: 0 }, '', url);
      hashes = [];
      anotar(location.hash, true);
    },

    /**
     * Agrega una entrada. Ir al hash en el que ya se está no agrega nada.
     * Desde una capa, la entrada nueva toma el lugar de la de la capa.
     *
     * Un hash sin `#` es un error de programación: desde una capa va a
     * `location.replace`, que lo tomaría por una ruta y saldría de la app.
     */
    ir(hash: string): void {
      if (!hash.startsWith('#')) throw new Error(`ir recibe un hash con #; recibí ${JSON.stringify(hash)}`);
      if (hash === location.hash) return;
      const antes = location.hash;
      const abierta = capa;
      // La capa se suelta antes de navegar: el `popstate` del cambio de hash
      // no la tiene que tomar por un link.
      const desdeCapa = soltarCapa() > 0;
      // El cambio de hash agrega la entrada en el momento; el `hashchange`
      // llega después y ya la encuentra numerada.
      if (desdeCapa) location.replace(hash);
      else location.hash = hash;
      // Un hash escrito de otra forma que es el mismo —con algo sin
      // codificar que el navegador codifica— no cambia nada, y no llega
      // ningún `hashchange`.
      if (location.hash === antes) { capa = abierta; return; }
      propias++;
      marcar(profundidad + 1);
      anotar(location.hash, true);
    },

    reemplazar,
    hayAtras,

    /** Retrocede `n` entradas si las hay; si no, reemplaza la actual por `respaldo`. */
    volver(respaldo: string, n = 1): void {
      if (!hayAtras(n)) { reemplazar(respaldo); return; }
      retroceder(n + soltarCapa());
    },

    /**
     * Retrocede hasta la primera entrada que no es de la pantalla `prefijo`
     * —la receta y su editor, o su cocina—. Si atrás no hay ninguna de otra
     * pantalla, `respaldo` toma el lugar de la actual.
     */
    salirDe(prefijo: string, respaldo: string): void {
      for (let p = profundidad - 1; p >= 0; p--) {
        const hash = hashes[p];
        // Una entrada sin anotar —de antes de recargar— no se sabe de qué
        // pantalla es: retroceder hasta ahí podría salirse de la app.
        if (hash === undefined) break;
        if (!esDe(hash, prefijo)) { retroceder(profundidad - p + soltarCapa()); return; }
      }
      reemplazar(respaldo);
    },

    /**
     * Lo primero de cada `hashchange`. La entrada que llega sin `state` la
     * agregó un `<a href>`: se la numera con la profundidad de la anterior
     * más uno.
     */
    numerar(): Llegada {
      const p = profundidadDe(history.state);
      if (deshaciendo) {
        deshaciendo = false;
        if (p !== null) profundidad = p;
        anotar(location.hash, false);
        return 'deshecha';
      }
      // Si el navegador no avisó el link por `popstate`, se lo nota acá.
      const conCapaAtras = capaAtras || (p === null && capa !== null);
      capaAtras = false;
      if (propias > 0) {
        propias--;
        if (p !== null) profundidad = p;
        anotar(location.hash, false);
        return 'nueva';
      }
      if (p !== null) { profundidad = p; anotar(location.hash, false); return 'conocida'; }
      // Un link con una capa abierta la deja atrás, y la capa deja de estar.
      capaAtras = conCapaAtras;
      capa = null;
      marcar(profundidad + 1);
      anotar(location.hash, true);
      return 'nueva';
    },

    /**
     * Deshace la entrada que acaba de llegar sin `state`, volviendo a la
     * anterior. El `hashchange` de esa vuelta llega como `deshecha`: la
     * pantalla de antes nunca se dejó de ver.
     */
    deshacer(): void {
      deshaciendo = true;
      retroceder(capaAtras ? 2 : 1);
      capaAtras = false;
    },

    /**
     * Vuelve a poner adelante la pantalla que se estaba dejando, sin dibujar:
     * `pushState` no dispara `hashchange`. Es para cuando la pantalla ya se
     * dejó por el atrás y no se la puede dejar.
     */
    restaurar(hash: string): void {
      profundidad += 1;
      history.pushState({ profundidad }, '', hash);
      anotar(hash, true);
    },

    /**
     * Abre una capa: una entrada con el mismo hash y `state.capa`. Si ya hay
     * una abierta, la nueva toma su lugar: nunca hay dos entradas de capa.
     */
    abrirCapa(nueva: string): void {
      const state = { profundidad, capa: nueva };
      if (capa !== null && capaDe(history.state) === capa) history.replaceState(state, '');
      else history.pushState(state, '');
      capa = nueva;
    },

    /**
     * La capa se cerró desde la app —el velo, la cruz, un destino—: su entrada
     * se consume con un atrás, sin avisar a nadie. Con `cual`, sólo si la
     * abierta es esa. Si la entrada actual no es una capa, no hace nada.
     */
    cerrarCapa(cual?: string): void {
      if (capa === null || (cual !== undefined && cual !== capa)) return;
      if (soltarCapa()) history.back();
    },

    /** La capa abierta, o `null`. */
    capaActual: (): string | null => capa,

    /** Quién se entera de que el atrás cerró una capa, con su nombre. */
    alCerrarCapa(cb: (capa: string) => void): void {
      alCerrar = cb;
    },

    /**
     * Lo primero de cada `popstate`. Si se salió de la entrada de la capa
     * abierta, la capa se cerró por el atrás: se le avisa a quien la abrió.
     */
    alPopstate(): void {
      const pendiente = alSalirDeLaCapa;
      alSalirDeLaCapa = null;
      if (pendiente) { pendiente(); return; }
      // Un link o la barra al fragmento en el que ya se está: el navegador
      // reemplaza la entrada actual por una sin `state`, sin `hashchange` que
      // la numere. Se la numera acá; si era la de una capa, la capa se cierra
      // abajo, como con el atrás.
      if (profundidadDe(history.state) === null && location.hash === hashes[profundidad]) marcar(profundidad);
      if (capa === null || capaDe(history.state) === capa) return;
      const cerrada = capa;
      capa = null;
      // Cambió el hash: es otra pantalla —un link con la capa abierta—, y la
      // dibuja el `hashchange` que viene. No hay capa que cerrar a mano.
      if (location.hash !== hashes[profundidad]) {
        capaAtras = profundidadDe(history.state) === null;
        return;
      }
      alCerrar(cerrada);
    }
  };
}

export type Navegacion = ReturnType<typeof crearNavegacion>;
