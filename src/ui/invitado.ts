/**
 * La vista de invitado: la receta de un link, para quien no usa la app. Es una
 * pantalla propia, armada con las piezas de la receta: su cabecera no lleva
 * marcas, no hay encabezado, y la única acción es Cocinar.
 */
import { vacio } from './componentes.js';
import { fichaCabecera, fichasDelCuerpo, botonCocinar, pieDeAcciones } from './fichas-receta.js';
import { renderVisor } from './visor.js';
import { fotosSinUso, idDeDrive, sinFotosDeDrive } from '../fotos-receta.js';
import type { FotoDeReceta, Receta } from '../tipos.js';
import type { EstadoVisor } from './visor.js';

/**
 * El carrusel del invitado: las sin uso que viajaron en el link. Se calcula
 * sobre la receta cruda —con sus `foto:N` todavía— y deja afuera las de Drive,
 * que el invitado no puede pedir (§10). Lo usa también su controlador, para
 * saber qué recorre el visor.
 */
export const carruselDeInvitado = (receta: Receta): FotoDeReceta[] =>
  fotosSinUso(receta).filter(f => idDeDrive(f.url) === null);

export interface OpcionesInvitado {
  /** La receta cruda, como salió del link: acá se resuelve y se limpia. */
  receta: Receta;
  categoria: string;
  /** El visor de fotos abierto, en su foto actual. Sin esto no se dibuja. */
  visor?: EstadoVisor;
}

export function renderInvitado({ receta: sinResolver, categoria, visor }: OpcionesInvitado): string {
  // Resuelta y sin nada de Drive (§10): el invitado no tiene token, así que
  // acá no puede quedar ni un `data-drive` ni una `foto:N` sin resolver.
  const receta = sinFotosDeDrive(sinResolver);
  const carrusel = carruselDeInvitado(sinResolver);
  return '<div class="cuerpo">' +
      fichaCabecera({ receta, categoria, pin: false, carrusel }) + fichasDelCuerpo(receta) + '</div>' +
    pieDeAcciones(botonCocinar(receta)) +
    (visor ? renderVisor(visor) : '');
}

export const renderLinkRoto = (): string =>
  `<div class="cuerpo">${vacio('Este link está roto o incompleto.')}</div>`;
