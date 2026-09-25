/**
 * La navegación: el único lugar que toca `location` y `history`, y la única
 * regla para saber si hay una pantalla atrás.
 *
 * La **profundidad** es cuántas pantallas de la app hay atrás de la actual, y
 * viaja en `history.state` como `{ profundidad }`. Al arrancar, la entrada
 * actual queda con 0; cada entrada nueva lleva la de la anterior más uno; y
 * volver a una entrada anterior la recupera de su `state`. `history.length` no
 * sirve para esto: cuenta también las entradas de adelante y las de otros
 * sitios, y con eso el volver se salía de la app.
 *
 * Las navegaciones propias cambian el hash y dejan que el `hashchange` dibuje,
 * igual que un `<a href>`: hay un solo camino hasta la pantalla.
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
 * - `nueva`: sin `state`, por un `<a href>` o la barra del navegador;
 * - `conocida`: con `state`, porque se volvió a ella o la agregó la app;
 * - `deshecha`: la vuelta que pidió `deshacer`, que no se dibuja.
 */
export type Llegada = 'nueva' | 'conocida' | 'deshecha';

const profundidadDe = (state: unknown): number | null => {
  const p = (state as { profundidad?: unknown } | null)?.profundidad;
  return typeof p === 'number' && Number.isInteger(p) && p >= 0 ? p : null;
};

export function crearNavegacion({ location, history }: EntornoDeNavegacion) {
  let profundidad = 0;
  /** Se pidió `deshacer`: el próximo `hashchange` es esa vuelta. */
  let deshaciendo = false;

  /** Le pone a la entrada actual la profundidad `p`, sin cambiar la URL. */
  const marcar = (p: number): void => {
    profundidad = p;
    history.replaceState({ profundidad: p }, '');
  };

  const hayAtras = (n = 1): boolean => profundidad >= n;

  /** Reemplaza la entrada actual: la pantalla que se deja no queda en el historial. */
  function reemplazar(hash: string): void {
    if (hash !== location.hash) location.replace(hash);
    marcar(profundidad);
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
      if (url === undefined) history.replaceState({ profundidad: 0 }, '');
      else history.replaceState({ profundidad: 0 }, '', url);
    },

    /** Agrega una entrada. Ir al hash en el que ya se está no agrega nada. */
    ir(hash: string): void {
      if (hash === location.hash) return;
      // El cambio de hash agrega la entrada en el momento; el `hashchange`
      // llega después y ya la encuentra numerada.
      location.hash = hash;
      marcar(profundidad + 1);
    },

    reemplazar,
    hayAtras,

    /** Retrocede `n` entradas si las hay; si no, reemplaza la actual por `respaldo`. */
    volver(respaldo: string, n = 1): void {
      if (!hayAtras(n)) { reemplazar(respaldo); return; }
      if (n === 1) history.back();
      else history.go(-n);
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
        return 'deshecha';
      }
      if (p !== null) { profundidad = p; return 'conocida'; }
      marcar(profundidad + 1);
      return 'nueva';
    },

    /**
     * Deshace la entrada que acaba de llegar sin `state`, volviendo a la
     * anterior. El `hashchange` de esa vuelta llega como `deshecha`: la
     * pantalla de antes nunca se dejó de ver.
     */
    deshacer(): void {
      deshaciendo = true;
      history.back();
    },

    /**
     * Vuelve a poner adelante la pantalla que se estaba dejando, sin dibujar:
     * `pushState` no dispara `hashchange`. Es para cuando la pantalla ya se
     * dejó por el atrás y no se la puede dejar.
     */
    restaurar(hash: string): void {
      profundidad += 1;
      history.pushState({ profundidad }, '', hash);
    }
  };
}

export type Navegacion = ReturnType<typeof crearNavegacion>;
