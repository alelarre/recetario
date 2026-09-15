/** Las vistas que la app sabe dibujar. El hash es el único estado de navegación. */
export type Vista =
  | 'recetario' | 'categoria' | 'resultados' | 'receta' | 'cocinar'
  | 'editar' | 'nueva' | 'borradores' | 'borrador' | 'capturar' | 'ajustes' | 'carpeta'
  | 'categorias' | 'editar-categoria';

export interface Ruta {
  vista: Vista;
  params: Record<string, string>;
}

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
  // `#/nueva?borrador=b1` es crear la receta desde un borrador: sin el
  // parámetro, el editor abría vacío y el borrador no se borraba al guardar.
  if (partes[0] === 'nueva') {
    const borrador = params['borrador'] ?? '';
    return { vista: 'nueva', params: borrador ? { borrador } : {} };
  }

  if (partes[0] === 'r' && partes[1]) {
    if (partes[2] === 'editar') return { vista: 'editar', params: { id: partes[1] } };
    if (partes[2] === 'cocinar') return { vista: 'cocinar', params: { id: partes[1] } };
    if (!partes[2]) return { vista: 'receta', params: { id: partes[1] } };
  }

  if (partes[0] === 'borradores') {
    return partes[1]
      ? { vista: 'borrador', params: { id: partes[1] } }
      : { vista: 'borradores', params: {} };
  }
  if (partes[0] === 'ajustes') return { vista: 'ajustes', params: {} };
  // El Share Target manda lo que la app de origen le dio: los dos campos
  // pueden venir vacíos y la captura igual se abre (F01.2).
  if (partes[0] === 'capturar') {
    return { vista: 'capturar', params: { url: params['url'] ?? '', text: params['text'] ?? '' } };
  }

  if (partes[0] === 'categorias') {
    return partes[1]
      ? { vista: 'editar-categoria', params: { id: partes[1] } }
      : { vista: 'categorias', params: {} };
  }

  // El selector de la carpeta base: el nivel que se mira viaja en la query, y
  // volver un nivel es el historial.
  if (partes[0] === 'carpeta') {
    const nivel: Record<string, string> = {};
    if (params['id']) nivel['id'] = params['id'];
    if (params['nombre']) nivel['nombre'] = params['nombre'];
    return { vista: 'carpeta', params: nivel };
  }

  return { vista: 'recetario', params: {} };
}

/**
 * Lo compartido desde otra app, como hash de la captura, o `null`.
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
  return [...destino.keys()].length ? `#/capturar?${destino.toString()}` : null;
}

/** La vista de invitado: la receta que viaja en el link, sin login (spec P23 §3). */
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

export function crearRouter(alCambiar: (ruta: Ruta) => void) {
  const disparar = () => alCambiar(parsearHash(location.hash));
  window.addEventListener('hashchange', disparar);
  return {
    ir: (hash: string) => { location.hash = hash; },
    atras: () => history.back(),
    iniciar: disparar
  };
}
