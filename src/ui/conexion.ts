/**
 * El primer arranque (mockup 11).
 *
 * Explica antes de pedir: el scope `drive` trae la pantalla de «app no
 * verificada» de Google, y no conviene que esa sea la primera explicación que
 * el usuario recibe. El permiso se pide al tocar el botón, nunca al abrir.
 */
import { aviso, SPINNER } from './componentes.js';

export type EstadoConexion = 'inicial' | 'conectando' | 'cancelado' | 'denegado';

export interface OpcionesConexion {
  estado: EstadoConexion;
}

const BOTON = '<button class="btn prim" style="width:100%" data-accion="conectar">Conectar con Google</button>';

export function renderConexion({ estado }: OpcionesConexion): string {
  const cuerpo = (() => {
    switch (estado) {
      case 'conectando':
        return '<p>Conectando…</p>' + SPINNER;
      case 'cancelado':
        // Tres palabras y el botón otra vez: nunca se queda en «Conectando…».
        return aviso({ texto: 'No se pudo conectar.' }) + BOTON;
      case 'denegado':
        return aviso({ texto: 'Sin acceso a Drive no hay app: las recetas son archivos de tu Drive.' }) + BOTON;
      default:
        return '<p>Tus recetas viven en tu Google Drive. Esta app las lee y las escribe ahí.</p>' + BOTON;
    }
  })();

  return `<div class="arr"><h1>Recetario</h1>${cuerpo}</div>`;
}
