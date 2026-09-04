/** Las vistas que la app sabe dibujar. El hash es el único estado de navegación. */
export type Vista = 'home' | 'categoria' | 'buscar' | 'nueva' | 'detalle' | 'editar';

export interface Ruta {
  vista: Vista;
  params: Record<string, string>;
}

export function parsearHash(hash: unknown): Ruta {
  const limpio = String(hash ?? '').replace(/^#/, '');
  const [ruta = '', query = ''] = limpio.split('?');
  const partes = ruta.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));

  if (partes.length === 0) return { vista: 'home', params: {} };

  if (partes[0] === 'c' && partes[1]) {
    try {
      const nombre = decodeURIComponent(partes[1]);
      return { vista: 'categoria', params: { nombre } };
    } catch {
      // URL rota: caer en home
      return { vista: 'home', params: {} };
    }
  }

  if (partes[0] === 'buscar') return { vista: 'buscar', params: { q: params['q'] ?? '' } };
  if (partes[0] === 'nueva') return { vista: 'nueva', params: {} };

  if (partes[0] === 'r' && partes[1]) {
    if (partes[2] === 'editar') return { vista: 'editar', params: { id: partes[1] } };
    if (!partes[2]) return { vista: 'detalle', params: { id: partes[1] } };
  }

  return { vista: 'home', params: {} };
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
