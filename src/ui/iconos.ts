/**
 * Los SVG de los mockups, como constantes.
 *
 * Solo el `viewBox` y el contenido: `stroke`, `fill` y `stroke-width` los pone
 * `.ico svg` en `tokens.css`, así que un ícono se ve igual esté donde esté.
 */
const svg = (contenido: string): string => `<svg viewBox="0 0 24 24">${contenido}</svg>`;

export const ICO = {
  volver: svg('<path d="M15 18l-6-6 6-6"/>'),
  buscar: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  /** Las tres líneas del encabezado del Recetario: lleva a Borradores. */
  menu: svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  ajustes: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/>' +
    '<circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>'),
  lapiz: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
  // No está en ningún mockup: se dibuja con el mismo trazo que los demás (§3.4).
  // Lo llevan las dos acciones destructivas: Borrar receta y Descartar un borrador.
  tacho: svg('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>'),
  cerrar: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  /** Las dos posiciones del conmutador de cocina: qué va y en qué orden. De Lucide. */
  zanahoria: svg('<path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7z"/>' +
    '<path d="M8.64 14l-2.05-2.04"/><path d="M15.34 15l-2.46-2.46"/>' +
    '<path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z"/>' +
    '<path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z"/>'),
  listaNumerada: svg('<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/>' +
    '<path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  /** El sol del modo cocina: la pantalla que no se apaga. */
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3' +
    'M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
  puntos: svg('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  /** Los dos destinos del menú lateral que no tenían ícono propio. */
  casa: svg('<path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-8z"/>'),
  bandeja: svg('<path d="M4 13l2.5-7h11L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z"/>' +
    '<path d="M4 13h5l1 2h4l1-2h5"/>')
} as const satisfies Record<string, string>;
