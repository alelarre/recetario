/** Las vistas que la app sabe dibujar. El hash es el único estado de navegación. */
export type Vista =
  | 'recetario' | 'categoria' | 'resultados' | 'receta' | 'cocinar'
  | 'editar' | 'nueva' | 'borradores' | 'borrador' | 'capturar' | 'ajustes';

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

  return { vista: 'recetario', params: {} };
}

export function crearRouter(alCambiar: (ruta: Ruta) => void) {
  const disparar = () => alCambiar(parsearHash(location.hash));
  window.addEventListener('hashchange', disparar);
  return {
    ir: (hash: string) => { location.hash = hash; },
    atras: () => history.back(),
    iniciar: disparar
  };
}
