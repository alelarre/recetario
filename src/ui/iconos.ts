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
  tacho: svg('<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>'),
  cerrar: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
  /** El sol del modo cocina: la pantalla que no se apaga. */
  sol: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3' +
    'M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>'),
  puntos: svg('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>')
} as const satisfies Record<string, string>;
