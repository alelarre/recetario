/**
 * La vista de invitado: la receta de un link, para quien no usa la app. Es una
 * pantalla propia, armada con las piezas de la receta: su cabecera no lleva
 * marcas, no hay encabezado, y la única acción es Cocinar.
 */
import { vacio } from './componentes.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import { renderVisor } from './visor.js';
import { sinFotosDeDrive } from '../fotos-receta.js';
import type { Receta } from '../tipos.js';
import type { EstadoVisor } from './visor.js';

export interface OpcionesInvitado {
  receta: Receta;
  categoria: string;
  /** El visor de fotos abierto, en su foto actual. Sin esto no se dibuja. */
  visor?: EstadoVisor;
}

export function renderInvitado({ receta: sinResolver, categoria, visor }: OpcionesInvitado): string {
  // Resuelta y sin nada de Drive (§10): el invitado no tiene token, así que
  // acá no puede quedar ni un `data-drive` ni una `foto:N` sin resolver.
  const receta = sinFotosDeDrive(sinResolver);
  return '<div class="cuerpo">' + fichaCabecera({ receta, categoria, pin: false }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta)) +
    (visor ? renderVisor(visor) : '');
}

export const renderLinkRoto = (): string =>
  `<div class="cuerpo">${vacio('Este link está roto o incompleto.')}</div>`;
