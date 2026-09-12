/**
 * El primer arranque (mockup 11).
 *
 * Explica antes de pedir: el scope `drive` trae la pantalla de «app no
 * verificada» de Google, y no conviene que esa sea la primera explicación que
 * el usuario recibe. El permiso se pide al tocar el botón, nunca al abrir.
 */
import { escapar } from './markdown.js';
import { aviso, SPINNER } from './componentes.js';
import type { Progreso } from '../store.js';

export type EstadoConexion = 'inicial' | 'conectando' | 'cancelado' | 'denegado' | 'creando-indice';

export interface OpcionesConexion {
  estado: EstadoConexion;
  progreso?: Progreso;
}

const BOTON = '<button class="btn prim" style="width:100%" data-accion="conectar">Conectar con Google</button>';

export function renderConexion({ estado, progreso }: OpcionesConexion): string {
  const cuerpo = (() => {
    switch (estado) {
      case 'conectando':
        return '<p>Conectando…</p>';
      case 'cancelado':
        // Tres palabras y el botón otra vez: nunca se queda en «Conectando…».
        return aviso({ texto: 'No se pudo conectar.' }) + BOTON;
      case 'denegado':
        return aviso({ texto: 'Sin acceso a Drive no hay app: las recetas son archivos de tu Drive.' }) + BOTON;
      case 'creando-indice': {
        // Puede tardar minutos —los `.md` se leen de a uno—, así que número y
        // no spinner. Hasta que se sepa cuántos son, el número no existe: ahí
        // va el spinner, no un «0 de 0».
        const { leidas = 0, total = 0 } = progreso ?? {};
        if (total <= 0) return '<p>Creando el índice…</p>' + SPINNER;
        const ancho = Math.min(100, Math.round((leidas / total) * 100));
        return `<p style="font-variant-numeric:tabular-nums">Creando el índice: ${leidas} de ${total}.</p>` +
          `<div class="barra"><i style="width:${ancho}%"></i></div>`;
      }
      default:
        return '<p>Tus recetas viven en tu Google Drive. Esta app las lee y las escribe ahí.</p>' + BOTON;
    }
  })();

  return `<div class="arr"><h1>${escapar('Recetario')}</h1>${cuerpo}</div>`;
}
