/**
 * El botón que crea un temporizador al lado de un texto —una marca de la
 * receta, una fila de Referencias—: lo crea y lo arranca sin cambiar de
 * pantalla. Después queda 2 s deshabilitado con la tilde: un doble toque crea
 * uno solo, y un toque más, pasado ese rato, crea otro.
 */
import type { SeccionDeAcciones } from './acciones.js';
import { ICO } from './ui/iconos.js';

export const BLOQUEO_MARCA = 2000;

export interface DependenciasMarcas {
  empezarCuenta(nombre: string, ms: number): void;
  empezarCrono(nombre: string): void;
  /** Llama `fn` dentro de `ms`; los tests la disparan a mano. */
  demorar(ms: number, fn: () => void): void;
}

export const accionesDeMarcas = ({ empezarCuenta, empezarCrono, demorar }: DependenciasMarcas): SeccionDeAcciones => ({
  'crear-temporizador': (boton) => {
    const b = boton as HTMLButtonElement;
    if (b.disabled) return;
    const { tipo, nombre = '', duracion } = b.dataset;
    if (tipo === 'cuenta') {
      const ms = Number(duracion);
      if (!(Number.isFinite(ms) && ms > 0)) return;
      empezarCuenta(nombre, ms);
    } else if (tipo === 'cronometro') {
      empezarCrono(nombre);
    } else return;
    const icono = b.innerHTML;
    b.disabled = true;
    b.innerHTML = ICO.tilde;
    b.classList.add('hecho');
    demorar(BLOQUEO_MARCA, () => {
      b.disabled = false;
      b.innerHTML = icono;
      b.classList.remove('hecho');
    });
  }
});
