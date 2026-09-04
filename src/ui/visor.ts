import { escapar } from './markdown.js';

export interface ArgsVisor {
  fotos?: string[];
  indice?: number;
}

export function renderVisor(args: ArgsVisor = {}): string {
  const { fotos = [], indice = 0 } = args || {};

  if (!fotos || !fotos.length) return '';

  // Garantizar que el índice esté dentro de rango
  const idx = Math.max(0, Math.min(indice, fotos.length - 1));

  return `
    <div class="visor" role="dialog" aria-label="Foto">
      <button data-accion="cerrar-visor" aria-label="Cerrar">✕</button>
      <img src="${escapar(fotos[idx])}" alt="">
      <p class="visor-contador">${idx + 1} / ${fotos.length}</p>
      <button data-accion="foto-anterior" aria-label="Anterior">‹</button>
      <button data-accion="foto-siguiente" aria-label="Siguiente">›</button>
    </div>`;
}
