import type { Duracion } from '../recipe.js';

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
  /** Las tres líneas del encabezado: abren el menú lateral. */
  menu: svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  ajustes: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/>' +
    '<circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>'),
  lapiz: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
  /** Lo lleva la acción destructiva: Borrar receta. */
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
  /** Compartir la receta: PDF, link o texto. De Lucide (share-2). */
  compartir: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
    '<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>'),
  mas: svg('<path d="M12 5v14M5 12h14"/>'),
  /** «Más o menos»: abre los multiplicadores de la receta. */
  masMenos: svg('<path d="M12 4v9M7.5 8.5h9M7.5 19h9"/>'),
  /** Pegar una receta copiada: el botón del encabezado del editor. */
  portapapeles: svg('<rect x="8" y="3" width="8" height="4" rx="1"/>' +
    '<path d="M16 5h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2"/>'),
  /** Inicio, en el menú lateral y en el título del Recetario. */
  casa: svg('<path d="M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-8z"/>'),
  /** Los dos tags especiales que no son favorito: «probar» y «menú diario». */
  marcador: svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  /** Entre los dos campos de una cantidad que se calculan uno al otro. De Lucide (arrow-left-right). */
  idaYVuelta: svg('<path d="M8 3L4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>'),
  /** Herramientas, en el menú: una balanza de cocina. */
  balanza: svg('<path d="M5 20h14l-1.5-9h-11z"/><path d="M12 11V7"/><circle cx="12" cy="5" r="2"/>'),
  /** Pan, en la lista de Herramientas y en el título de su calculadora: un pan con dos cortes. */
  pan: svg('<path d="M3 13a9 7 0 0 1 18 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 9.5l1.5 3M12.5 8.5l1.5 3M17 10l1 2"/>'),
  /** Fermentados: un frasco con su tapa. */
  frasco: svg('<path d="M7 2h10v3H7z"/><path d="M8 5v1.5C6 7.5 5 9 5 11.5V20a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8.5c0-2.5-1-4-3-5V5"/><path d="M5 13h14"/>'),
  /** Referencias: un libro abierto. */
  libro: svg('<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>'),
  /** Conversor: una taza medidora con sus marcas. */
  medidor: svg('<path d="M5 4h12v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M17 8h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2"/><path d="M5 9h4M5 13h4"/>'),
  /** Un tag común, en el título de su lista. De Lucide (tag). */
  etiqueta: svg('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>'),
  /** La lista de compras, en su título. De Lucide (shopping-cart). */
  carrito: svg('<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>'),
  /** Temporizadores: el reloj de la tira, de la lista de Herramientas y de su título. */
  reloj: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  /** El reloj con un «+» donde se abre el círculo: crea una cuenta regresiva. */
  relojMas: svg('<path d="M21 12a9 9 0 1 0-9 9"/><path d="M12 7v5l3 2"/><path d="M19 16v6M16 19h6"/>'),
  /** El cronómetro: una aguja y el botón arriba. */
  cronometro: svg('<circle cx="12" cy="13" r="8"/><path d="M12 13V9"/><path d="M10 2h4M12 2v3"/>'),
  /** El cronómetro con el «+»: crea uno. */
  cronometroMas: svg('<path d="M20 13a8 8 0 1 0-8 8"/><path d="M12 13V9"/><path d="M10 2h4M12 2v3"/><path d="M19 16v6M16 19h6"/>'),
  /** La llave inglesa del botón de herramientas del editor. */
  herramienta: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3.5 17.3a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.4-.4-2.1z"/>'),
  /** Hecho: el temporizador se creó. */
  tilde: svg('<path d="M5 12l5 5 9-10"/>'),
  /** Pausar y seguir una cuenta. */
  pausa: svg('<path d="M9 5v14M15 5v14"/>'),
  play: svg('<path d="M8 5l11 7-11 7z"/>'),
  /** Las ruedas de la cuenta nueva: un paso arriba, un paso abajo. */
  arriba: svg('<path d="M6 15l6-6 6 6"/>'),
  abajo: svg('<path d="M6 9l6 6 6-6"/>'),
  calendario: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  /** Borrador: un círculo a medio llenar, hecha a medias. Un aro vacío se
   *  leería como viñeta. Es el símbolo de los borradores en todos lados: su botón
   *  del editor, la entrada del menú lateral y el título de Borradores. */
  borrador: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3A9 9 0 0 0 12 21Z" fill="currentColor" stroke="none"/>'),
  /** Favorito: la misma estrella en la receta, en la tarjeta y en el carrusel. */
  estrella: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>'),
  /** El chevron hacia adelante: la flecha derecha del carrusel. */
  chevron: svg('<path d="M9 18l6-6-6-6"/>'),
  /** Una carpeta de Drive: la ficha de cada carpeta encontrada. */
  carpeta: svg('<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'),
  /** La cámara: sacar una foto y agregarla al depósito de la receta. */
  camara: svg('<path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>' +
    '<circle cx="12" cy="13" r="3.5"/>'),
  /**
   * Una foto ya sacada, y no la cámara: es el botón que pone en la línea una
   * del depósito, no el que agrega una nueva. De Lucide (image).
   */
  imagen: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.6"/>' +
    '<path d="M21 15l-4-4a2 2 0 00-2.8 0L6 19.2"/>'),

  /** *Por URL*: agregar una foto pegando su dirección. Dos eslabones, de Lucide (link). */
  link: svg('<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>' +
    '<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>'),

  /**
   * Las dos marcas de uso de una foto del depósito. **Portada** es la
   * ficha con un señalador adentro, y no una estrella: en esta app la estrella
   * es favorita. **En el texto** son tres renglones: la foto está puesta en una
   * línea, un paso o un ingrediente.
   */
  portada: svg('<path d="M9 4h6v9l-3-2-3 2z" fill="currentColor" stroke="none"/>' +
    '<rect x="4" y="4" width="16" height="16" rx="2"/>'),
  enElTexto: svg('<path d="M4 7h10M4 12h16M4 17h7"/>'),

  /** *Galería*: dos fotos, una detrás de la otra. Es el botón que elige una del teléfono. De Lucide (images). */
  galeria: svg('<path d="M8 3h11a2 2 0 012 2v11"/>' +
    '<rect x="3" y="7" width="14" height="14" rx="2"/><circle cx="8" cy="12" r="1.3"/>' +
    '<path d="M3 18.5l3.2-3.2a2 2 0 012.8 0L17 21"/>')
} as const satisfies Record<string, string>;

/**
 * Los relojitos de la duración: una aguja y el recorrido desde las 12,
 * tenue. `~60 min` completa la vuelta con la aguja de nuevo arriba; `>60 min`
 * suma un cuarto de aro que sigue, con flecha; `>1 día` son dos relojes. El
 * disco de `>1 día` corta al reloj de atrás con el fondo de donde se dibuje:
 * `--fondo-reloj`.
 */
export const ICONO_DE_DURACION: Record<Duracion, string> = {
  '~15 min': svg('<circle cx="12" cy="12" r="9"/><g opacity=".3"><path d="M12 12L12 3A9 9 0 0 1 21 12Z" fill="currentColor" stroke="none"/></g><path d="M12 3v2"/><path d="M12 12L18 12"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  '~30 min': svg('<circle cx="12" cy="12" r="9"/><g opacity=".3"><path d="M12 12L12 3A9 9 0 0 1 12 21Z" fill="currentColor" stroke="none"/></g><path d="M12 3v2"/><path d="M12 12L12 18"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  '~60 min': svg('<circle cx="12" cy="12" r="9"/><g opacity=".3"><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/></g><path d="M12 3v2"/><path d="M12 12L12 6"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  '>60 min': svg('<circle cx="12" cy="12" r="7"/><g opacity=".3"><circle cx="12" cy="12" r="7" fill="currentColor" stroke="none"/></g><path d="M12 5v1.56"/><path d="M12 12L12 7.33"/><circle cx="12" cy="12" r=".6" fill="currentColor"/><path d="M12 2A10 10 0 0 1 21.78 9.92" stroke-width="1.6"/><path d="M22.92 7.15L21.78 9.92L19.61 7.85" stroke-width="1.6"/>'),
  '>1 día': svg('<g opacity=".6"><circle cx="15.5" cy="8.5" r="6"/><g opacity=".3"><path d="M15.5 8.5L15.5 2.5A6 6 0 0 1 15.5 14.5Z" fill="currentColor" stroke="none"/></g><path d="M15.5 2.5v1.33"/><path d="M15.5 8.5L15.5 12.5"/><circle cx="15.5" cy="8.5" r=".6" fill="currentColor"/></g><circle cx="8.5" cy="15.5" r="7.2" style="fill:var(--fondo-reloj)" stroke="none"/><circle cx="8.5" cy="15.5" r="6"/><g opacity=".3"><path d="M8.5 15.5L8.5 9.5A6 6 0 0 1 14.5 15.5Z" fill="currentColor" stroke="none"/></g><path d="M8.5 9.5v1.33"/><path d="M8.5 15.5L12.5 15.5"/><circle cx="8.5" cy="15.5" r=".6" fill="currentColor"/>')
};
