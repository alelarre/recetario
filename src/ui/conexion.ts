/**
 * El primer arranque (mockup 11).
 *
 * Explica antes de pedir: el scope `drive` trae la pantalla de «app no
 * verificada» de Google, y no conviene que esa sea la primera explicación que
 * el usuario recibe. El permiso se pide al tocar el botón, nunca al abrir.
 */
import { aviso, SPINNER, barra, porCiento } from './componentes.js';
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
        return '<p>Conectando…</p>' + SPINNER;
      case 'cancelado':
        // Tres palabras y el botón otra vez: nunca se queda en «Conectando…».
        return aviso({ texto: 'No se pudo conectar.' }) + BOTON;
      case 'denegado':
        return aviso({ texto: 'Sin acceso a Drive no hay app: las recetas son archivos de tu Drive.' }) + BOTON;
      case 'creando-indice': {
        // Puede tardar minutos, así que barra y nunca spinner: con una carpeta
        // recién creada no hay un solo `.md` que leer y el rato se lo llevan
        // las carpetas y los listados, que un spinner no distingue de colgado.
        const parte = progreso ?? 0;
        return `<p style="font-variant-numeric:tabular-nums">Creando el índice: ${porCiento(parte)}%.</p>` +
          barra(parte);
      }
      default:
        return '<p>Tus recetas viven en tu Google Drive. Esta app las lee y las escribe ahí.</p>' + BOTON;
    }
  })();

  return `<div class="arr"><h1>Recetario</h1>${cuerpo}</div>`;
}
