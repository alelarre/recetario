/** Las vistas que la app sabe dibujar. El hash es el único estado de navegación. */
export type Vista =
  | 'recetario' | 'categoria' | 'resultados' | 'receta' | 'cocinar'
  | 'editar' | 'nueva' | 'borradores' | 'ajustes' | 'carpeta'
  | 'categorias' | 'editar-categoria' | 'tag'
  | 'plan' | 'plan-agregar' | 'plan-compras';

export interface Ruta {
  vista: Vista;
  params: Record<string, string>;
}

/** Los parámetros de la query que están y no vienen vacíos, de esta lista. */
const presentes = (params: Record<string, string>, claves: readonly string[]): Record<string, string> =>
  Object.fromEntries(claves.flatMap(c => (params[c] ? [[c, params[c]]] : [])));

export function parsearHash(hash: unknown): Ruta {
  const limpio = String(hash ?? '').replace(/^#/, '');
  const [ruta = '', query = ''] = limpio.split('?');
  const partes = ruta.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));

  if (partes.length === 0) return { vista: 'recetario', params: {} };

  if (partes[0] === 'c' && partes[1]) {
    try {
      const nombre = decodeURIComponent(partes[1]);
      return { vista: 'categoria', params: { nombre } };
    } catch {
      // URL rota: caer en el Recetario
      return { vista: 'recetario', params: {} };
    }
  }

  if (partes[0] === 'buscar') return { vista: 'resultados', params: { q: params['q'] ?? '' } };
  // `#/nueva` abre el editor vacío. Lo compartido desde otra app llega con
  // `url`, `text` y `fotos` —cuántas dejó el service worker en su caché—, y
  // una receta `.md` compartida que no es de ninguna receta existente, con
  // `recibida`. Sólo viajan los que vinieron.
  if (partes[0] === 'nueva') return { vista: 'nueva', params: presentes(params, ['url', 'text', 'fotos', 'recibida']) };

  if (partes[0] === 'r' && partes[1]) {
    // `recibida`: el editor abre con la receta `.md` compartida aplicada encima.
    if (partes[2] === 'editar') return { vista: 'editar', params: { id: partes[1], ...presentes(params, ['recibida']) } };
    if (partes[2] === 'cocinar') return { vista: 'cocinar', params: { id: partes[1] } };
    if (!partes[2]) return { vista: 'receta', params: { id: partes[1] } };
  }

  // Un borrador es una receta con ese tag y se abre como cualquier otra: una
  // ruta vieja con id cae en la lista.
  if (partes[0] === 'borradores') return { vista: 'borradores', params: {} };
  if (partes[0] === 'ajustes') return { vista: 'ajustes', params: {} };
  if (partes[0] === 'categorias') {
    return partes[1]
      ? { vista: 'editar-categoria', params: { id: partes[1] } }
      : { vista: 'categorias', params: {} };
  }

  // La carpeta base. Entrar desde Ajustes lo dice en la query: la pantalla
  // cambia de título y aclara que la carpeta actual queda como está.
  if (partes[0] === 'carpeta') {
    return {
      vista: 'carpeta',
      params: params['cambiando'] ? { cambiando: params['cambiando'] } : {}
    };
  }

  // El plan de la semana y sus dos pantallas. Agregar necesita saber a qué
  // comida suma: sin un día y un momento válidos no hay nada que hacer ahí, y
  // se cae en el plan.
  if (partes[0] === 'plan') {
    if (partes[1] === 'compras') return { vista: 'plan-compras', params: {} };
    if (partes[1] === 'agregar') {
      const dia = Number(params['dia']);
      const momento = params['momento'] ?? '';
      const valido = Number.isInteger(dia) && dia >= 0 && dia <= 6 && (momento === 'mediodia' || momento === 'noche');
      return valido
        ? { vista: 'plan-agregar', params: { dia: String(dia), momento } }
        : { vista: 'plan', params: {} };
    }
    if (!partes[1]) return { vista: 'plan', params: {} };
  }

  // La lista por tag: se llega tocando un chip del carrusel del Recetario.
  if (partes[0] === 't' && partes[1]) {
    try {
      return { vista: 'tag', params: { nombre: decodeURIComponent(partes[1]) } };
    } catch {
      return { vista: 'recetario', params: {} };
    }
  }

  return { vista: 'recetario', params: {} };
}

/**
 * Lo compartido desde otra app, como hash de la receta nueva, o `null`.
 *
 * El Share Target de Android manda `title`, `text` y `url` en la query de la
 * URL —antes del `#`—, y el router sólo lee lo que viene después. Muchas apps
 * mandan el link sólo en `text`, así que los dos viajan. El título no: lo que
 * trae es el de la página, y el de la receta lo escribe el usuario.
 */
export function hashDeCompartido(search: string): string | null {
  const params = new URLSearchParams(search);
  const destino = new URLSearchParams();
  for (const clave of ['url', 'text']) {
    const valor = params.get(clave);
    if (valor) destino.set(clave, valor);
  }
  return [...destino.keys()].length ? `#/nueva?${destino.toString()}` : null;
}

/** La vista de invitado: la receta que viaja en el link, sin login. */
export interface RutaInvitado {
  vista: 'lectura' | 'cocina';
  carga: string;
}

export function rutaDeInvitado(hash: unknown): RutaInvitado | null {
  const limpio = String(hash ?? '').replace(/^#/, '');
  const [ruta = '', query = ''] = limpio.split('?');
  const partes = ruta.split('/').filter(Boolean);
  if (partes[0] !== 'ver') return null;
  const carga = new URLSearchParams(query).get('r') ?? '';
  return { vista: partes[1] === 'cocinar' ? 'cocina' : 'lectura', carga };
}

export const esHashDeInvitado = (hash: unknown): boolean => rutaDeInvitado(hash) !== null;

/**
 * Avisa cada cambio de hash con la ruta que llegó. `iniciar` avisa la del
 * arranque. Navegar no es de acá: es de `navegacion.ts`.
 */
export function crearRouter(alCambiar: (ruta: Ruta) => void) {
  const disparar = () => alCambiar(parsearHash(location.hash));
  window.addEventListener('hashchange', disparar);
  return { iniciar: disparar };
}
