/** Las vistas que la app sabe dibujar. El hash es el único estado de navegación. */
export type Vista =
  | 'recetario' | 'categoria' | 'resultados' | 'receta' | 'cocinar'
  | 'editar' | 'nueva' | 'borradores' | 'borrador' | 'capturar' | 'ajustes' | 'carpeta'
  | 'categorias' | 'editar-categoria' | 'tag' | 'recibida'
  | 'plan' | 'plan-agregar' | 'plan-compras';

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
  // `#/nueva?borrador=b1` es crear la receta desde un borrador: el parámetro es
  // lo que ata las dos cosas, y sin él el borrador no se borra al guardar.
  if (partes[0] === 'nueva') {
    const p: Record<string, string> = {};
    if (params['borrador']) p['borrador'] = params['borrador'];
    // `recibida`: el editor abre con la receta que llegó de Claude.
    if (params['recibida']) p['recibida'] = params['recibida'];
    return { vista: 'nueva', params: p };
  }
  // La pregunta «¿De qué borrador es esta receta?», cuando la receta que
  // llegó de Claude no trae un id de borrador que exista.
  if (partes[0] === 'recibida') return { vista: 'recibida', params: {} };

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
  // pueden venir vacíos y la captura igual se abre (F01.2). `fotos` es
  // cuántas dejó el service worker en su caché.
  if (partes[0] === 'capturar') {
    return {
      vista: 'capturar',
      params: { url: params['url'] ?? '', text: params['text'] ?? '', ...(params['fotos'] ? { fotos: params['fotos'] } : {}) }
    };
  }

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

export function crearRouter(alCambiar: (ruta: Ruta) => void) {
  const disparar = () => alCambiar(parsearHash(location.hash));
  window.addEventListener('hashchange', disparar);
  return {
    ir: (hash: string) => { location.hash = hash; },
    atras: () => history.back(),
    iniciar: disparar
  };
}
