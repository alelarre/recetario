/**
 * Andamiaje para los tests que ejercitan `main`.
 *
 * Los tests corren en `environment: 'node'`: no hay jsdom, y el DOM que usan
 * es un doble escrito a mano con los tres o cuatro métodos que `main` toca.
 * Montar eso sobre `global.document` pide un cast, porque el doble no
 * implementa la interfaz entera de `Document`. Estos helpers dejan el cast
 * dicho en un solo lugar, en vez de repetirlo en cada línea de cada test.
 */

/** Monta un doble en un global del navegador, afirmando el tipo que Node espera. */
export const comoGlobal = <T>(doble: unknown): T => doble as T;

/**
 * Saca los globales del navegador entre tests.
 *
 * `delete` sobre ellos necesita el cast: en los tipos de Node no son
 * opcionales, así que TypeScript los trata como propiedades que siempre están.
 */
export function limpiarGlobales(): void {
  const g = global as unknown as Record<string, unknown>;
  for (const clave of ['document', 'window', 'location', 'history']) delete g[clave];
}

/**
 * Un cliente de Identity Services que concede el token al primer pedido.
 *
 * Los tipos son los mismos que declara `src/gis.d.ts` —son globales
 * ambientales, no hace falta importarlos—, así que si el contrato del SDK
 * cambia, este doble deja de compilar en vez de seguir mintiendo.
 */
export function clienteGisFalso(token = 'tok-123'): ClienteToken {
  const c: ClienteToken = {
    callback: () => {},
    error_callback: () => {},
    requestAccessToken: () => c.callback({ access_token: token, expires_in: 3600 })
  };
  return c;
}

/**
 * `localStorage` en memoria. Node no lo tiene, y los módulos que lo usan lo
 * envuelven en `try/catch`: sin este doble, los tests sólo verían el camino
 * de la falla.
 */
export function localStorageFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => (datos.has(k) ? datos.get(k)! : null),
    setItem: (k: string, v: unknown) => { datos.set(k, String(v)); },
    removeItem: (k: string) => { datos.delete(k); },
    _datos: datos
  };
}

/** `window` con Identity Services ya cargado y respondiendo. */
export function windowConGis(): Window & typeof globalThis {
  return comoGlobal<Window & typeof globalThis>({
    google: { accounts: { oauth2: { initTokenClient: () => clienteGisFalso() } } }
  });
}

/** Una entrada del historial: su hash y lo que la app le dejó en `state`. */
export interface EntradaFalsa { hash: string; state: unknown }

/** El hash de una URL como la reciben `pushState`, `replaceState` y `location.replace`. */
const hashDeUrl = (url: string): string => {
  const i = url.indexOf('#');
  return i >= 0 ? url.slice(i) : '';
};

/**
 * El historial del navegador, con sus entradas y su `state`, para los tests
 * que navegan. Se porta como el de verdad en lo que la app usa:
 * - asignar `location.hash` agrega una entrada sin `state`, y descarta las de
 *   adelante; asignar el hash que ya está no hace nada;
 * - `location.replace` reemplaza la entrada actual, también sin `state`;
 * - `pushState` y `replaceState` cambian las entradas sin avisar;
 * - `back` y `go` se mueven entre las entradas, y fuera de ellas no hacen nada;
 * - avisa con `popstate` cada movimiento, aunque el hash sea el mismo, y cada
 *   cambio de hash de `location` —asignar `hash` o `replace`—, como el
 *   navegador con toda navegación a un fragmento; `pushState` y
 *   `replaceState` no avisan;
 * - todo cambio de hash, salvo el de `pushState` y `replaceState`, avisa
 *   además con `hashchange`, después del `popstate`.
 *
 * Los avisos van en una microtarea, que no depende del reloj falso de los
 * tests; el navegador los manda en una tarea aparte. Lo que importa es lo
 * mismo: la app alcanza a numerar la entrada antes de que lleguen.
 *
 * `location` y `history` se montan como globales; lo demás es para mirar.
 */
export function historialFalso({
  hash = '',
  alCambiarHash,
  alPopstate = () => {},
  location: extraLocation = {},
  alVolver = () => {}
}: {
  hash?: string;
  /** El `hashchange`: lo que el test haya registrado como oyente. */
  alCambiarHash: () => void;
  /** El `popstate`: lo que el test haya registrado como oyente. */
  alPopstate?: () => void;
  /** Lo demás de `location` que el test necesite: `pathname`, `reload`… */
  location?: Record<string, unknown>;
  /** Corre en cada `back`, antes de moverse. */
  alVolver?: () => void;
}) {
  const entradas: EntradaFalsa[] = [{ hash, state: null }];
  let i = 0;
  const reemplazos: string[] = [];
  const empujados: string[] = [];
  const vueltasAtras: number[] = [];
  const saltos: number[] = [];
  const actual = (): EntradaFalsa => entradas[i]!;
  /** Los avisos que se retienen mientras el test mira lo de antes de dibujar, o `null`. */
  let retenidos: number | null = null;
  const avisar = (): void => {
    if (retenidos !== null) retenidos++;
    else void Promise.resolve().then(alCambiarHash);
  };
  /** El `popstate` de un cambio de hash o de un movimiento: llega antes que su `hashchange`. */
  const avisarPopstate = (): void => { void Promise.resolve().then(alPopstate); };
  const agregar = (entrada: EntradaFalsa): void => {
    entradas.splice(i + 1);
    entradas.push(entrada);
    i = entradas.length - 1;
  };
  const moverse = (n: number): void => {
    const destino = i + n;
    if (destino < 0 || destino >= entradas.length) return;
    const antes = actual().hash;
    i = destino;
    avisarPopstate();
    if (actual().hash !== antes) avisar();
  };

  const location = Object.assign({
    get hash(): string { return actual().hash; },
    set hash(valor: string) {
      const nuevo = valor.startsWith('#') ? valor : `#${valor}`;
      if (nuevo === actual().hash) return;
      agregar({ hash: nuevo, state: null });
      avisarPopstate();
      avisar();
    },
    replace(url: string) {
      reemplazos.push(url);
      const antes = actual().hash;
      entradas[i] = { hash: hashDeUrl(url), state: null };
      if (actual().hash !== antes) { avisarPopstate(); avisar(); }
    }
  }, extraLocation);

  const history = {
    get state(): unknown { return actual().state; },
    get length(): number { return entradas.length; },
    back() { vueltasAtras.push(1); alVolver(); moverse(-1); },
    go(n = 0) { saltos.push(n); moverse(n); },
    forward() { moverse(1); },
    pushState(state: unknown, _titulo: string, url?: string | null) {
      if (url) empujados.push(url);
      agregar({ hash: url ? hashDeUrl(url) : actual().hash, state });
    },
    replaceState(state: unknown, _titulo: string, url?: string | null) {
      entradas[i] = { hash: url ? hashDeUrl(url) : actual().hash, state };
    }
  };

  return {
    location,
    history,
    reemplazos,
    empujados,
    vueltasAtras,
    saltos,
    /** Las entradas hasta la actual, que son las que el atrás alcanza. */
    pila: (): EntradaFalsa[] => entradas.slice(0, i + 1).map(e => ({ ...e })),
    /** El atrás del navegador o de Android: se mueve sin pasar por la app. */
    atras: (): void => moverse(-1),
    /** Los `hashchange` quedan sin mandar hasta `soltarAvisos`: la URL cambia, la pantalla no. */
    retenerAvisos: (): void => { retenidos ??= 0; },
    soltarAvisos: (): void => {
      const cuantos = retenidos ?? 0;
      retenidos = null;
      for (let n = 0; n < cuantos; n++) avisar();
    }
  };
}
